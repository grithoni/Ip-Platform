"use server";

import { prisma } from "@/lib/prisma";
import { signToken, setSession, clearSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";

const registerSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少6个字符"),
  name: z.string().min(2, "姓名至少2个字符"),
  role: z.enum(["PARTY", "EXPERT"]),
});

const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(1, "请输入密码"),
});

export async function register(formData: FormData) {
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    name: formData.get("name") as string,
    role: formData.get("role") as "PARTY" | "EXPERT",
  };

  const result = registerSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    return { error: "该邮箱已被注册" };
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: data.role,
    },
  });

  // If registering as expert, create expert profile
  if (data.role === "EXPERT") {
    await prisma.expert.create({
      data: {
        userId: user.id,
        name: data.name,
        technicalFields: "[]",
      },
    });
  }

  const token = await signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  await setSession(token);

  return { success: true, role: user.role };
}

export async function login(formData: FormData) {
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const result = loginSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    return { error: "邮箱或密码错误" };
  }

  const isValid = await bcrypt.compare(data.password, user.password);
  if (!isValid) {
    return { error: "邮箱或密码错误" };
  }

  const token = await signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  await setSession(token);

  if (user.role === "ADMIN") {
    redirect("/admin");
  } else if (user.role === "EXPERT") {
    redirect("/expert");
  }
  redirect("/dashboard");
}

export async function logout() {
  await clearSession();
  return { success: true };
}
