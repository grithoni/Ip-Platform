"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function assignExpert(caseId: string, expertId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return { error: "无权操作" };

  const caseRecord = await prisma.case.findUnique({ where: { id: caseId } });
  if (!caseRecord) return { error: "案件不存在" };

  const existing = await prisma.expertAssignment.findUnique({
    where: { caseId_expertId: { caseId, expertId } },
  });
  if (existing) return { error: "该专家已分配到此案件" };

  await prisma.expertAssignment.create({
    data: { caseId, expertId, status: "PENDING" },
  });

  if (caseRecord.status === "ACCEPTED" || caseRecord.status === "SUBMITTED") {
    await prisma.case.update({
      where: { id: caseId },
      data: { status: "EXPERT_ASSIGNING" },
    });
  }

  const expert = await prisma.expert.findUnique({
    where: { id: expertId },
    select: { userId: true, name: true },
  });

  if (expert) {
    await prisma.message.create({
      data: {
        fromUserId: session.userId,
        toUserId: expert.userId,
        caseId,
        content: `您有一个新的案件指派请求，案件编号: ${caseRecord.caseNumber}，请及时处理。`,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: "EXPERT_ASSIGNED",
      targetType: "CASE",
      targetId: caseId,
      details: `指派专家 ${expert?.name || expertId}`,
    },
  });

  revalidatePath(`/admin/cases/${caseId}`);
  return { success: true };
}

export async function acceptAssignment(assignmentId: string) {
  const session = await getSession();
  if (!session || session.role !== "EXPERT") return { error: "无权操作" };

  const assignment = await prisma.expertAssignment.findUnique({
    where: { id: assignmentId },
    include: { expert: true, case: true },
  });

  if (!assignment) return { error: "指派不存在" };
  if (assignment.expert.userId !== session.userId) return { error: "无权操作" };
  if (assignment.status !== "PENDING") return { error: "当前状态不允许接受" };

  await prisma.expertAssignment.update({
    where: { id: assignmentId },
    data: { status: "ACCEPTED" },
  });

  await prisma.case.update({
    where: { id: assignment.caseId },
    data: { status: "IN_EVALUATION" },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: "ASSIGNMENT_ACCEPTED",
      targetType: "ASSIGNMENT",
      targetId: assignmentId,
      details: `接受案件 ${assignment.case.caseNumber} 的指派`,
    },
  });

  revalidatePath("/expert/assignments");
  revalidatePath("/expert/cases");
  return { success: true };
}

export async function declineAssignment(assignmentId: string) {
  const session = await getSession();
  if (!session || session.role !== "EXPERT") return { error: "无权操作" };

  const assignment = await prisma.expertAssignment.findUnique({
    where: { id: assignmentId },
    include: { expert: true },
  });

  if (!assignment) return { error: "指派不存在" };
  if (assignment.expert.userId !== session.userId) return { error: "无权操作" };
  if (assignment.status !== "PENDING") return { error: "当前状态不允许拒绝" };

  await prisma.expertAssignment.update({
    where: { id: assignmentId },
    data: { status: "DECLINED" },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: "ASSIGNMENT_DECLINED",
      targetType: "ASSIGNMENT",
      targetId: assignmentId,
      details: "拒绝案件指派",
    },
  });

  revalidatePath("/expert/assignments");
  return { success: true };
}

export async function signDeclaration(assignmentId: string) {
  const session = await getSession();
  if (!session || session.role !== "EXPERT") return { error: "无权操作" };

  const assignment = await prisma.expertAssignment.findUnique({
    where: { id: assignmentId },
    include: { expert: true },
  });

  if (!assignment) return { error: "指派不存在" };
  if (assignment.expert.userId !== session.userId) return { error: "无权操作" };
  if (assignment.status !== "ACCEPTED") return { error: "请先接受指派" };

  await prisma.expertAssignment.update({
    where: { id: assignmentId },
    data: {
      declarationSigned: true,
      declarationSignedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: "DECLARATION_SIGNED",
      targetType: "ASSIGNMENT",
      targetId: assignmentId,
      details: "签署独立性声明",
    },
  });

  revalidatePath("/expert/cases");
  return { success: true };
}

export async function updateExpertProfile(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "EXPERT") return { error: "无权操作" };

  const name = formData.get("name") as string;
  const technicalFields = formData.get("technicalFields") as string;
  const qualifications = formData.get("qualifications") as string;
  const availability = formData.get("availability") as string;
  const hourlyRate = formData.get("hourlyRate") as string;
  const bio = formData.get("bio") as string;

  const expert = await prisma.expert.findUnique({
    where: { userId: session.userId },
  });

  if (!expert) return { error: "专家信息不存在" };

  await prisma.expert.update({
    where: { id: expert.id },
    data: {
      name: name || expert.name,
      technicalFields: technicalFields || expert.technicalFields,
      qualifications: qualifications ?? expert.qualifications,
      availability: availability || expert.availability,
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : expert.hourlyRate,
      bio: bio ?? expert.bio,
    },
  });

  revalidatePath("/expert/profile");
  return { success: true };
}

export async function completeAssignment(assignmentId: string) {
  const session = await getSession();
  if (!session || session.role !== "EXPERT") return { error: "无权操作" };

  const assignment = await prisma.expertAssignment.findUnique({
    where: { id: assignmentId },
    include: { expert: true },
  });

  if (!assignment) return { error: "指派不存在" };
  if (assignment.expert.userId !== session.userId) return { error: "无权操作" };
  if (assignment.status !== "ACCEPTED") return { error: "当前状态不允许完成" };

  await prisma.expertAssignment.update({
    where: { id: assignmentId },
    data: { status: "COMPLETED" },
  });

  revalidatePath("/expert/cases");
  return { success: true };
}
