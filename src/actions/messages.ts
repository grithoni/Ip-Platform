"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function sendMessage(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "请先登录" };

  const toUserId = formData.get("toUserId") as string;
  const caseId = formData.get("caseId") as string;
  const content = formData.get("content") as string;

  if (!content?.trim()) return { error: "消息内容不能为空" };

  await prisma.message.create({
    data: {
      fromUserId: session.userId,
      toUserId,
      caseId: caseId || null,
      content: content.trim(),
    },
  });

  revalidatePath("/messages");
  revalidatePath("/admin/messages");
  return { success: true };
}

export async function markMessageRead(messageId: string) {
  const session = await getSession();
  if (!session) return { error: "请先登录" };

  await prisma.message.update({
    where: { id: messageId },
    data: { readAt: new Date() },
  });

  return { success: true };
}
