"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// --- Expert Application ---

export async function submitExpertApplication(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "请先登录" };

  // Check if already applied
  const existing = await prisma.expertApplication.findUnique({
    where: { userId: session.userId },
  });
  if (existing) return { error: "您已提交过申请" };

  // Check if already an expert
  const existingExpert = await prisma.expert.findUnique({
    where: { userId: session.userId },
  });
  if (existingExpert) return { error: "您已是平台专家" };

  const name = formData.get("name") as string;
  const technicalFields = formData.get("technicalFields") as string;
  const qualifications = formData.get("qualifications") as string;
  const experienceYears = formData.get("experienceYears") as string;
  const bio = formData.get("bio") as string;
  const hourlyRateExpect = formData.get("hourlyRateExpect") as string;

  if (!name || !technicalFields) return { error: "请填写必要信息" };

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return { error: "用户不存在" };

  await prisma.expertApplication.create({
    data: {
      userId: session.userId,
      name,
      email: user.email,
      phone: user.phone || null,
      company: user.company || null,
      technicalFields,
      qualifications: qualifications || null,
      experienceYears: experienceYears ? parseInt(experienceYears) : null,
      bio: bio || null,
      hourlyRateExpect: hourlyRateExpect ? parseFloat(hourlyRateExpect) : null,
      status: "PENDING",
    },
  });

  // Notify admins
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
  for (const admin of admins) {
    await prisma.message.create({
      data: {
        fromUserId: session.userId,
        toUserId: admin.id,
        content: `新的专家申请：${name}（${user.company || "未填写公司"}）申请加入平台专家库。`,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: "EXPERT_APPLICATION_SUBMITTED",
      targetType: "USER",
      targetId: session.userId,
      details: `专家申请：${name}`,
    },
  });

  revalidatePath("/profile");
  return { success: true };
}

export async function reviewApplication(
  applicationId: string,
  decision: "APPROVED" | "REJECTED",
  note?: string
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return { error: "无权操作" };

  const application = await prisma.expertApplication.findUnique({
    where: { id: applicationId },
  });
  if (!application) return { error: "申请不存在" };
  if (application.status !== "PENDING") return { error: "该申请已处理" };

  await prisma.expertApplication.update({
    where: { id: applicationId },
    data: {
      status: decision,
      reviewNote: note || null,
      reviewedBy: session.userId,
      reviewedAt: new Date(),
    },
  });

  if (decision === "APPROVED") {
    // Create Expert profile and update role
    await prisma.expert.create({
      data: {
        userId: application.userId,
        name: application.name,
        technicalFields: application.technicalFields,
        qualifications: application.qualifications,
        hourlyRate: application.hourlyRateExpect,
        bio: application.bio,
        applicationStatus: "APPROVED",
      },
    });

    await prisma.user.update({
      where: { id: application.userId },
      data: { role: "EXPERT" },
    });
  }

  // Notify applicant
  await prisma.message.create({
    data: {
      fromUserId: session.userId,
      toUserId: application.userId,
      content:
        decision === "APPROVED"
          ? "恭喜！您的专家申请已通过审核，您现在可以以专家身份登录平台。"
          : `很抱歉，您的专家申请未通过审核。${note ? `原因：${note}` : ""}`,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: `EXPERT_APPLICATION_${decision}`,
      targetType: "USER",
      targetId: application.userId,
      details: `审核专家申请：${decision}${note ? ` - ${note}` : ""}`,
    },
  });

  revalidatePath("/admin/experts");
  return { success: true };
}

export async function listExpertApplications(status?: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return [];

  return prisma.expertApplication.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    include: {
      reviewer: { select: { name: true } },
    },
  });
}

// --- Conflict of Interest ---

export async function addConflictOfInterest(
  expertId: string,
  partyUserId: string,
  reason: string,
  details?: string
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return { error: "无权操作" };

  const existing = await prisma.conflictOfInterest.findUnique({
    where: { expertId_partyUserId: { expertId, partyUserId } },
  });
  if (existing) return { error: "该冲突记录已存在" };

  await prisma.conflictOfInterest.create({
    data: { expertId, partyUserId, reason, details: details || null },
  });

  revalidatePath("/admin/experts");
  return { success: true };
}

export async function removeConflictOfInterest(conflictId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return { error: "无权操作" };

  await prisma.conflictOfInterest.update({
    where: { id: conflictId },
    data: { isActive: false },
  });

  revalidatePath("/admin/experts");
  return { success: true };
}

export async function checkConflicts(expertId: string, caseId: string) {
  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      parties: { select: { userId: true } },
    },
  });
  if (!caseRecord) return { hasConflicts: false, conflicts: [] };

  const partyUserIds = caseRecord.parties.map((p) => p.userId);

  const conflicts = await prisma.conflictOfInterest.findMany({
    where: {
      expertId,
      partyUserId: { in: partyUserIds },
      isActive: true,
    },
    include: {
      partyUser: { select: { name: true, email: true, company: true } },
    },
  });

  return {
    hasConflicts: conflicts.length > 0,
    conflicts: conflicts.map((c) => ({
      id: c.id,
      reason: c.reason,
      details: c.details,
      partyName: c.partyUser.name,
      partyCompany: c.partyUser.company,
    })),
  };
}

// --- Expert Panel Management ---

export async function updateExpertPanel(expertId: string, panelCategory: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return { error: "无权操作" };

  await prisma.expert.update({
    where: { id: expertId },
    data: { panelCategory },
  });

  revalidatePath("/admin/experts");
  return { success: true };
}

// --- Expert Ratings ---

export async function submitRating(
  expertId: string,
  caseId: string,
  score: number,
  comment?: string,
  dimensions?: Record<string, number>
) {
  const session = await getSession();
  if (!session) return { error: "请先登录" };

  // Verify case is completed and user is a party
  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
  });
  if (!caseRecord) return { error: "案件不存在" };
  if (!["COMPLETED", "CLOSED"].includes(caseRecord.status)) {
    return { error: "只能在案件完成后进行评分" };
  }
  if (caseRecord.applicantId !== session.userId && caseRecord.respondentId !== session.userId) {
    return { error: "仅当事人可以评分" };
  }

  // Check for existing rating
  const existing = await prisma.expertRating.findUnique({
    where: {
      expertId_caseId_raterId: { expertId, caseId, raterId: session.userId },
    },
  });
  if (existing) return { error: "您已对该案件进行过评分" };

  await prisma.expertRating.create({
    data: {
      expertId,
      caseId,
      raterId: session.userId,
      score,
      comment: comment || null,
      dimensions: dimensions ? JSON.stringify(dimensions) : null,
    },
  });

  // Update expert average rating
  const allRatings = await prisma.expertRating.findMany({
    where: { expertId },
  });
  const avg = allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length;

  await prisma.expert.update({
    where: { id: expertId },
    data: {
      averageRating: Math.round(avg * 10) / 10,
      totalRatings: allRatings.length,
    },
  });

  revalidatePath(`/cases/${caseId}`);
  return { success: true };
}

export async function getExpertRatings(expertId: string) {
  const ratings = await prisma.expertRating.findMany({
    where: { expertId },
    include: {
      rater: { select: { name: true, company: true } },
      case: { select: { caseNumber: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const expert = await prisma.expert.findUnique({
    where: { id: expertId },
    select: { averageRating: true, totalRatings: true },
  });

  return {
    ratings: ratings.map((r) => ({
      id: r.id,
      score: r.score,
      comment: r.comment,
      dimensions: r.dimensions,
      raterName: r.rater.name,
      raterCompany: r.rater.company,
      caseNumber: r.case.caseNumber,
      createdAt: r.createdAt.toISOString(),
    })),
    averageRating: expert?.averageRating || 0,
    totalRatings: expert?.totalRatings || 0,
  };
}
