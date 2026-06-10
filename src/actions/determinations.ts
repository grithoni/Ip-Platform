"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createDetermination(caseId: string, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "EXPERT") return { error: "无权操作" };

  const expert = await prisma.expert.findUnique({
    where: { userId: session.userId },
  });
  if (!expert) return { error: "专家信息不存在" };

  const assignment = await prisma.expertAssignment.findUnique({
    where: { caseId_expertId: { caseId, expertId: expert.id } },
  });
  if (!assignment || assignment.status !== "ACCEPTED") {
    return { error: "您未被指派或未接受此案件" };
  }

  const type = formData.get("type") as string;
  const content = formData.get("content") as string;

  if (!type || !content?.trim()) return { error: "请填写裁决类型和内容" };

  const determination = await prisma.determination.create({
    data: {
      caseId,
      expertId: expert.id,
      type,
      content: content.trim(),
    },
  });

  if (type === "FINAL") {
    await prisma.case.update({
      where: { id: caseId },
      data: { status: "DETERMINATION_ISSUED" },
    });

    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      select: { caseNumber: true, applicantId: true, respondentId: true },
    });

    if (caseRecord) {
      const notifyUserIds = [caseRecord.applicantId, caseRecord.respondentId].filter(Boolean) as string[];
      for (const userId of notifyUserIds) {
        await prisma.message.create({
          data: {
            fromUserId: session.userId,
            toUserId: userId,
            caseId,
            content: `案件 ${caseRecord.caseNumber} 已发出最终裁决，请查看。`,
          },
        });
      }
    }
  }

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: "DETERMINATION_CREATED",
      targetType: "DETERMINATION",
      targetId: determination.id,
      details: `创建${type === "FINAL" ? "最终" : "临时"}裁决`,
    },
  });

  revalidatePath(`/expert/cases/${caseId}`);
  revalidatePath(`/cases/${caseId}`);
  return { success: true, determinationId: determination.id };
}

export async function correctDetermination(determinationId: string, correctionContent: string) {
  const session = await getSession();
  if (!session || session.role !== "EXPERT") return { error: "无权操作" };

  const expert = await prisma.expert.findUnique({
    where: { userId: session.userId },
  });
  if (!expert) return { error: "专家信息不存在" };

  const determination = await prisma.determination.findUnique({
    where: { id: determinationId },
  });

  if (!determination) return { error: "裁决不存在" };
  if (determination.expertId !== expert.id) return { error: "无权修改此裁决" };

  const daysSinceIssued = (Date.now() - determination.issuedAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceIssued > 30) return { error: "裁决已超过30天，无法补正" };

  if (!correctionContent?.trim()) return { error: "请输入补正内容" };

  await prisma.determination.update({
    where: { id: determinationId },
    data: {
      correctedAt: new Date(),
      correctionContent: correctionContent.trim(),
    },
  });

  const caseRecord = await prisma.case.findUnique({
    where: { id: determination.caseId },
    select: { caseNumber: true, applicantId: true, respondentId: true },
  });

  if (caseRecord) {
    const notifyUserIds = [caseRecord.applicantId, caseRecord.respondentId].filter(Boolean) as string[];
    for (const userId of notifyUserIds) {
      await prisma.message.create({
        data: {
          fromUserId: session.userId,
          toUserId: userId,
          caseId: determination.caseId,
          content: `案件 ${caseRecord.caseNumber} 的裁决已补正，请查看。`,
        },
      });
    }
  }

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: "DETERMINATION_CORRECTED",
      targetType: "DETERMINATION",
      targetId: determinationId,
      details: "补正裁决内容",
    },
  });

  revalidatePath(`/expert/cases/${determination.caseId}`);
  revalidatePath(`/cases/${determination.caseId}`);
  return { success: true };
}
