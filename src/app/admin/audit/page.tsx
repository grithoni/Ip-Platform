import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AuditLogClient from "./AuditLogClient";

export default async function AdminAuditPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { name: true, role: true } } },
  });

  const data = logs.map((l) => ({
    id: l.id,
    action: l.action,
    targetType: l.targetType,
    targetId: l.targetId,
    details: l.details,
    userName: l.user.name,
    userRole: l.user.role,
    createdAt: l.createdAt.toISOString(),
  }));

  return <AuditLogClient logs={data} />;
}
