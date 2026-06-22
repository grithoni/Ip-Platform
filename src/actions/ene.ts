"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createENEAssessment(
  caseId: string,
  expertId: string,
  scope: string,
  bindingType: string
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return { error: "无权操作" };

  const caseRecord = await prisma.case.findUnique({ where: { id: caseId } });
  if (!caseRecord) return { error: "案件不存在" };

  // Check for existing ENE on this case
  const existing = await prisma.eNEAssessment.findFirst({
    where: { caseId, status: { notIn: ["COMPLETED"] } },
  });
  if (existing) return { error: "该案件已有进行中的 ENE 评估" };

  const ene = await prisma.eNEAssessment.create({
    data: {
      caseId,
      expertId,
      scope,
      bindingType,
      status: "PENDING_AGREEMENT",
    },
  });

  // Notify both parties
  const notifyUserIds = [caseRecord.applicantId, caseRecord.respondentId].filter(Boolean) as string[];
  for (const uid of notifyUserIds) {
    await prisma.message.create({
      data: {
        fromUserId: session.userId,
        toUserId: uid,
        caseId,
        content: `案件 ${caseRecord.caseNumber} 已发起早期中立评估（ENE），评估范围：${scope === "FULL" ? "全面评估" : scope === "INFRINGEMENT_ONLY" ? "仅侵权分析" : "仅估值分析"}，约束类型：${bindingType === "BINDING" ? "约束性" : "非约束性"}。请登录平台确认是否同意参与。`,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: "ENE_CREATED",
      targetType: "CASE",
      targetId: caseId,
      details: `创建ENE评估，范围：${scope}，约束类型：${bindingType}`,
    },
  });

  revalidatePath("/admin/ene");
  revalidatePath(`/admin/cases/${caseId}`);
  return { success: true, eneId: ene.id };
}

export async function agreeToENE(eneId: string) {
  const session = await getSession();
  if (!session) return { error: "请先登录" };

  const ene = await prisma.eNEAssessment.findUnique({
    where: { id: eneId },
    include: { case: { select: { applicantId: true, respondentId: true, caseNumber: true } } },
  });
  if (!ene) return { error: "ENE 评估不存在" };
  if (ene.status !== "PENDING_AGREEMENT") return { error: "当前状态不允许操作" };

  const isApplicant = ene.case.applicantId === session.userId;
  const isRespondent = ene.case.respondentId === session.userId;
  if (!isApplicant && !isRespondent) return { error: "仅当事人可以同意参与" };

  // Prevent duplicate agreement
  if ((isApplicant && ene.applicantAgreed) || (isRespondent && ene.respondentAgreed)) {
    return { error: "您已同意参与" };
  }

  const updateData: Record<string, string | boolean> = {};
  if (isApplicant) updateData.applicantAgreed = true;
  if (isRespondent) updateData.respondentAgreed = true;

  const bothAgreed =
    (isApplicant || ene.applicantAgreed) && (isRespondent || ene.respondentAgreed);

  if (bothAgreed) {
    updateData.bothPartiesAgreed = true;
    updateData.status = "IN_PROGRESS";
  }

  await prisma.eNEAssessment.update({
    where: { id: eneId },
    data: updateData,
  });

  // Notify the other party
  const otherUserId = isApplicant ? ene.case.respondentId : ene.case.applicantId;
  if (otherUserId) {
    await prisma.message.create({
      data: {
        fromUserId: session.userId,
        toUserId: otherUserId,
        caseId: ene.caseId,
        content: `对方当事人已同意参与 ENE 评估。${bothAgreed ? "双方均已同意，评估即将开始。" : "请登录平台确认您的参与意愿。"}`,
      },
    });
  }

  // Notify admin if both agreed
  if (bothAgreed) {
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
    for (const admin of admins) {
      await prisma.message.create({
        data: {
          fromUserId: session.userId,
          toUserId: admin.id,
          caseId: ene.caseId,
          content: `案件 ${ene.case.caseNumber} 的 ENE 评估双方均已同意，评估已自动启动。`,
        },
      });
    }
  }

  revalidatePath("/admin/ene");
  revalidatePath(`/expert/ene/${eneId}`);
  return { success: true, bothAgreed };
}

export async function issuePreliminaryOpinion(eneId: string, opinion: string) {
  const session = await getSession();
  if (!session || session.role !== "EXPERT") return { error: "无权操作" };

  const ene = await prisma.eNEAssessment.findUnique({
    where: { id: eneId },
    include: { case: { select: { applicantId: true, respondentId: true, caseNumber: true } } },
  });
  if (!ene) return { error: "ENE 评估不存在" };
  if (ene.status !== "IN_PROGRESS") return { error: "当前状态不允许操作" };

  const expert = await prisma.expert.findUnique({ where: { userId: session.userId } });
  if (!expert || expert.id !== ene.expertId) return { error: "仅指派专家可以操作" };

  await prisma.eNEAssessment.update({
    where: { id: eneId },
    data: {
      preliminaryOpinion: opinion,
      status: "OPINION_ISSUED",
    },
  });

  // Notify both parties
  const notifyUserIds = [ene.case.applicantId, ene.case.respondentId].filter(Boolean) as string[];
  for (const uid of notifyUserIds) {
    await prisma.message.create({
      data: {
        fromUserId: session.userId,
        toUserId: uid,
        caseId: ene.caseId,
        content: `案件 ${ene.case.caseNumber} 的 ENE 初步评估意见已出具，请登录平台查看。`,
      },
    });
  }

  revalidatePath(`/expert/ene/${eneId}`);
  return { success: true };
}

export async function issueENEOpinion(eneId: string, content: string) {
  const session = await getSession();
  if (!session || session.role !== "EXPERT") return { error: "无权操作" };

  const ene = await prisma.eNEAssessment.findUnique({
    where: { id: eneId },
    include: { case: { select: { applicantId: true, respondentId: true, caseNumber: true } } },
  });
  if (!ene) return { error: "ENE 评估不存在" };
  if (!["IN_PROGRESS", "OPINION_ISSUED"].includes(ene.status)) return { error: "当前状态不允许操作" };

  const expert = await prisma.expert.findUnique({ where: { userId: session.userId } });
  if (!expert || expert.id !== ene.expertId) return { error: "仅指派专家可以操作" };

  await prisma.eNEAssessment.update({
    where: { id: eneId },
    data: {
      content,
      status: "COMPLETED",
      issuedAt: new Date(),
    },
  });

  // Notify both parties
  const notifyUserIds = [ene.case.applicantId, ene.case.respondentId].filter(Boolean) as string[];
  for (const uid of notifyUserIds) {
    await prisma.message.create({
      data: {
        fromUserId: session.userId,
        toUserId: uid,
        caseId: ene.caseId,
        content: `案件 ${ene.case.caseNumber} 的 ENE 最终评估意见已出具，请登录平台查看。`,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: "ENE_COMPLETED",
      targetType: "CASE",
      targetId: ene.caseId,
      details: "ENE 最终评估意见已出具",
    },
  });

  revalidatePath(`/expert/ene/${eneId}`);
  return { success: true };
}

export async function listENEAssessments() {
  const session = await getSession();
  if (!session) return [];

  const whereClause: Record<string, unknown> = {};
  if (session.role === "EXPERT") {
    const expert = await prisma.expert.findUnique({ where: { userId: session.userId } });
    if (!expert) return [];
    whereClause.expertId = expert.id;
  }

  return prisma.eNEAssessment.findMany({
    where: whereClause,
    include: {
      case: { select: { caseNumber: true, patentTitle: true, id: true } },
      expert: { select: { name: true, id: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getENEDetail(eneId: string) {
  const session = await getSession();
  if (!session) return null;

  const ene = await prisma.eNEAssessment.findUnique({
    where: { id: eneId },
    include: {
      case: {
        include: {
          applicant: { select: { name: true, company: true } },
          respondent: { select: { name: true, company: true } },
        },
      },
      expert: { select: { id: true, name: true, userId: true } },
    },
  });

  if (!ene) return null;

  return {
    id: ene.id,
    caseId: ene.caseId,
    caseNumber: ene.case.caseNumber,
    patentTitle: ene.case.patentTitle,
    expertId: ene.expertId,
    expertName: ene.expert.name,
    expertUserId: ene.expert.userId,
    scope: ene.scope,
    bindingType: ene.bindingType,
    applicantAgreed: ene.applicantAgreed,
    respondentAgreed: ene.respondentAgreed,
    bothPartiesAgreed: ene.bothPartiesAgreed,
    content: ene.content,
    preliminaryOpinion: ene.preliminaryOpinion,
    status: ene.status,
    issuedAt: ene.issuedAt?.toISOString() || null,
    createdAt: ene.createdAt.toISOString(),
    applicantName: ene.case.applicant.name,
    respondentName: ene.case.respondent?.name || null,
  };
}
