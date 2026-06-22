"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function submitResponse(
  caseId: string,
  action: "ACCEPT" | "REJECT" | "COUNTERCLAIM",
  formData: FormData
) {
  const session = await getSession();
  if (!session) return { error: "请先登录" };

  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    include: { caseResponse: true },
  });

  if (!caseRecord) return { error: "案件不存在" };
  if (caseRecord.respondentId !== session.userId) return { error: "仅被申请人可以回复" };
  if (caseRecord.status !== "RESPONDENT_PENDING") return { error: "当前案件状态不允许回复" };
  if (caseRecord.caseResponse) return { error: "您已回复过该案件" };

  // Check deadline
  if (caseRecord.responseDeadline && new Date() > caseRecord.responseDeadline) {
    return { error: "已超过回复期限" };
  }

  const responseText = (formData.get("responseText") as string) || null;
  const counterclaimDesc = (formData.get("counterclaimDesc") as string) || null;

  // Create response record
  await prisma.caseResponse.create({
    data: {
      caseId,
      respondentId: session.userId,
      action,
      responseText,
      counterclaimDesc: action === "COUNTERCLAIM" ? counterclaimDesc : null,
    },
  });

  // Update case status based on action
  let newStatus: string;
  if (action === "ACCEPT") {
    newStatus = "ACCEPTED";
  } else if (action === "REJECT") {
    newStatus = "RESPONDENT_REJECTED";
  } else {
    newStatus = "COUNTERCLAIM_PENDING";
  }

  await prisma.case.update({
    where: { id: caseId },
    data: {
      status: newStatus,
      responseAction: action,
    },
  });

  // Notify applicant
  const actionLabels: Record<string, string> = {
    ACCEPT: "接受",
    REJECT: "拒绝",
    COUNTERCLAIM: "提出反请求",
  };
  await prisma.message.create({
    data: {
      fromUserId: session.userId,
      toUserId: caseRecord.applicantId,
      caseId,
      content: `被申请人已${actionLabels[action]}参与评估程序。${responseText || ""}`,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: `RESPONDENT_${action}`,
      targetType: "CASE",
      targetId: caseId,
      details: `被申请人${actionLabels[action]}：${responseText || "无备注"}`,
    },
  });

  revalidatePath("/cases");
  revalidatePath("/dashboard");
  revalidatePath(`/cases/${caseId}`);
  return { success: true };
}

export async function getRespondentCases(userId: string) {
  return prisma.case.findMany({
    where: { respondentId: userId },
    include: {
      applicant: { select: { name: true, company: true } },
      caseResponse: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}
