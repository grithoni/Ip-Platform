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

  // Respondent pending cases
  const pendingResponses = await prisma.case.count({
    where: {
      respondentId: session.userId,
      status: "RESPONDENT_PENDING",
    },
  });

  const respondentCases = await prisma.case.findMany({
    where: { respondentId: session.userId },
    orderBy: { updatedAt: "desc" },
    take: 5,
    include: {
      applicant: { select: { name: true } },
      caseResponse: true,
    },
  });

  const data = {
    activeCases,
    totalCases,
    unreadMessages,
    pendingResponses,
    recentCases: recentCases.map((c) => ({
      id: c.id,
      caseNumber: c.caseNumber,
      patentTitle: c.patentTitle,
      status: c.status,
      disputeType: c.disputeType,
      updatedAt: c.updatedAt.toISOString(),
      expertName: c.assignments[0]?.expert?.name || null,
    })),
    respondentCases: respondentCases.map((c) => ({
      id: c.id,
      caseNumber: c.caseNumber,
      patentTitle: c.patentTitle,
      status: c.status,
      disputeType: c.disputeType,
      applicantName: c.applicant.name,
      hasResponded: !!c.caseResponse,
      updatedAt: c.updatedAt.toISOString(),
    })),
  };

  return <DashboardClient data={data} />;
}
