import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

export async function saveUploadedFile(
  file: File,
  caseId: string,
  category: string
): Promise<{ filePath: string; fileName: string; fileSize: number; fileType: string }> {
  const caseDir = path.join(UPLOAD_DIR, caseId);
  await mkdir(caseDir, { recursive: true });

  const timestamp = Date.now();
  const originalName = file.name;
  const ext = path.extname(originalName);
  const fileName = `${timestamp}_${category}${ext}`;
  const filePath = path.join(caseDir, fileName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return {
    filePath: `uploads/${caseId}/${fileName}`,
    fileName: originalName,
    fileSize: file.size,
    fileType: ext.replace(".", "").toLowerCase(),
  };
}
