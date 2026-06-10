import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const activeCases = await prisma.case.count({
    where: { applicantId: session.userId, status: { notIn: ["DRAFT", "COMPLETED", "CLOSED"] } },
  });

  const totalCases = await prisma.case.count({
    where: { applicantId: session.userId },
  });

  const recentCases = await prisma.case.findMany({
    where: { applicantId: session.userId },
    orderBy: { updatedAt: "desc" },
    take: 5,
    include: {
      assignments: { include: { expert: true } },
    },
  });

  const unreadMessages = await prisma.message.count({
    where: { toUserId: session.userId, readAt: null },
  });

  const data = {
    activeCases,
    totalCases,
    unreadMessages,
    recentCases: recentCases.map((c) => ({
      id: c.id,
      caseNumber: c.caseNumber,
      patentTitle: c.patentTitle,
      status: c.status,
      disputeType: c.disputeType,
      updatedAt: c.updatedAt.toISOString(),
      expertName: c.assignments[0]?.expert?.name || null,
    })),
  };

  return <DashboardClient data={data} />;
}
