"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "请先登录" };

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const company = formData.get("company") as string;

  if (!name?.trim()) return { error: "姓名不能为空" };

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      name: name.trim(),
      phone: phone?.trim() || null,
      company: company?.trim() || null,
    },
  });

  revalidatePath("/profile");
  return { success: true };
}
