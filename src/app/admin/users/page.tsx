import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import UsersClient from "./UsersClient";

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      company: true,
      phone: true,
      createdAt: true,
    },
  });

  const data = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    company: u.company,
    phone: u.phone,
    createdAt: u.createdAt.toISOString(),
  }));

  return <UsersClient users={data} />;
}
