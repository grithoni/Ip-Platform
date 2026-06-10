"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/upload";
import { revalidatePath } from "next/cache";

export async function uploadDocument(caseId: string, formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "请先登录" };

  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    include: { parties: true },
  });

  if (!caseRecord) return { error: "案件不存在" };

  // Check access: must be party to case or admin
  const isParty = caseRecord.parties.some((p) => p.userId === session.userId);
  if (!isParty && session.role !== "ADMIN") return { error: "无权操作" };

  const file = formData.get("file") as File;
  const category = formData.get("category") as string;

  if (!file || file.size === 0) return { error: "请选择文件" };
  if (file.size > 50 * 1024 * 1024) return { error: "文件大小不能超过50MB" };

  const allowedTypes = ["pdf", "doc", "docx", "jpg", "jpeg", "png"];
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (!allowedTypes.includes(ext)) {
    return { error: `不支持的文件格式: ${ext}，支持: ${allowedTypes.join(", ")}` };
  }

  const saved = await saveUploadedFile(file, caseId, category || "OTHER");

  const document = await prisma.document.create({
    data: {
      caseId,
      uploaderId: session.userId,
      fileName: saved.fileName,
      filePath: saved.filePath,
      fileType: saved.fileType,
      fileSize: saved.fileSize,
      category: category || "OTHER",
    },
  });

  revalidatePath(`/cases/${caseId}`);
  return { success: true, documentId: document.id };
}

export async function deleteDocument(documentId: string) {
  const session = await getSession();
  if (!session) return { error: "请先登录" };

  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) return { error: "文件不存在" };
  if (document.uploaderId !== session.userId && session.role !== "ADMIN") {
    return { error: "无权操作" };
  }

  await prisma.document.delete({ where: { id: documentId } });

  revalidatePath(`/cases/${document.caseId}`);
  return { success: true };
}
