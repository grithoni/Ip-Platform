import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MessagesClient from "./MessagesClient";

export default async function AdminMessagesPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const messages = await prisma.message.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      from: { select: { name: true, role: true } },
      to: { select: { name: true, role: true } },
      case: { select: { caseNumber: true } },
    },
  });

  const data = messages.map((m) => ({
    id: m.id,
    fromName: m.from.name,
    fromRole: m.from.role,
    toName: m.to.name,
    toRole: m.to.role,
    content: m.content,
    caseNumber: m.case?.caseNumber || null,
    createdAt: m.createdAt.toISOString(),
    readAt: m.readAt?.toISOString() || null,
  }));

  return <MessagesClient messages={data} />;
}
