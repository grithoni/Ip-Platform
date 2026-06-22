"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { generateCaseNumber } from "@/lib/case-number";
import { ALLOWED_TRANSITIONS } from "@/lib/constants";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const createCaseSchema = z.object({
  patentNumber: z.string().min(1, "请输入专利号"),
  patentTitle: z.string().min(1, "请输入专利名称"),
  disputeType: z.string().min(1, "请选择纠纷类型"),
  amountInDispute: z.string().optional(),
  description: z.string().optional(),
  respondentEmail: z.string().email("请输入有效的邮箱").optional().or(z.literal("")),
  adrAssessmentId: z.string().optional(),
});

export async function createCase(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "请先登录" };

  const data = {
    patentNumber: formData.get("patentNumber") as string,
    patentTitle: formData.get("patentTitle") as string,
    disputeType: formData.get("disputeType") as string,
    amountInDispute: formData.get("amountInDispute") as string,
    description: formData.get("description") as string,
    respondentEmail: formData.get("respondentEmail") as string,
    adrAssessmentId: formData.get("adrAssessmentId") as string,
  };

  const result = createCaseSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const caseNumber = await generateCaseNumber();

  const caseRecord = await prisma.case.create({
    data: {
      caseNumber,
      patentNumber: data.patentNumber,
      patentTitle: data.patentTitle,
      disputeType: data.disputeType,
      amountInDispute: data.amountInDispute ? parseFloat(data.amountInDispute) : null,
      description: data.description || null,
      status: "DRAFT",
      applicantId: session.userId,
      adrAssessmentId: data.adrAssessmentId || null,
    },
  });

  // Create applicant party record
  await prisma.party.create({
    data: {
      userId: session.userId,
      caseId: caseRecord.id,
      role: "APPLICANT",
    },
  });

  // If respondent email provided, look up user
  if (data.respondentEmail) {
    const respondent = await prisma.user.findUnique({
      where: { email: data.respondentEmail },
    });
    if (respondent) {
      await prisma.case.update({
        where: { id: caseRecord.id },
        data: { respondentId: respondent.id },
      });
      await prisma.party.create({
        data: {
          userId: respondent.id,
          caseId: caseRecord.id,
          role: "RESPONDENT",
        },
      });
    }
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: "CASE_CREATED",
      targetType: "CASE",
      targetId: caseRecord.id,
      details: `创建案件 ${caseNumber}`,
    },
  });

  revalidatePath("/cases");
  revalidatePath("/dashboard");
  return { success: true, caseId: caseRecord.id };
}

export async function submitCase(caseId: string) {
  const session = await getSession();
  if (!session) return { error: "请先登录" };

  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
  });

  if (!caseRecord) return { error: "案件不存在" };
  if (caseRecord.applicantId !== session.userId) return { error: "无权操作" };
  if (caseRecord.status !== "DRAFT") return { error: "案件状态不允许提交" };

  const responseDeadline = new Date();
  responseDeadline.setDate(responseDeadline.getDate() + 15);

  await prisma.case.update({
    where: { id: caseId },
    data: {
      status: "RESPONDENT_PENDING",
      responseDeadline,
    },
  });

  // Notify respondent if linked
  if (caseRecord.respondentId) {
    await prisma.message.create({
      data: {
        fromUserId: session.userId,
        toUserId: caseRecord.respondentId,
        caseId,
        content: `您有一起新的专利纠纷评估案件（${caseRecord.caseNumber}）等待回复，请在15天内登录平台进行回复。`,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: "CASE_SUBMITTED",
      targetType: "CASE",
      targetId: caseId,
      details: "提交案件，等待被申请人回复",
    },
  });

  revalidatePath("/cases");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateCaseStatus(caseId: string, newStatus: string, reason?: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return { error: "无权操作" };

  const caseRecord = await prisma.case.findUnique({ where: { id: caseId } });
  if (!caseRecord) return { error: "案件不存在" };

  const allowed = ALLOWED_TRANSITIONS[caseRecord.status] || [];
  if (!allowed.includes(newStatus)) {
    return { error: `不允许从 ${caseRecord.status} 转换到 ${newStatus}` };
  }

  await prisma.case.update({
    where: { id: caseId },
    data: { status: newStatus },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: `STATUS_${newStatus}`,
      targetType: "CASE",
      targetId: caseId,
      details: reason || `状态变更为 ${newStatus}`,
    },
  });

  revalidatePath("/admin/cases");
  revalidatePath("/cases");
  return { success: true };
}

export async function respondToCase(caseId: string, formData: FormData) {
// respondToCase removed - use submitResponse from case-response.ts instead
