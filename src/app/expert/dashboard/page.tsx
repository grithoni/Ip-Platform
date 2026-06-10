import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ExpertDashboardClient from "./ExpertDashboardClient";

export default async function ExpertDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "EXPERT") redirect("/login");

  const expert = await prisma.expert.findUnique({
    where: { userId: session.userId },
  });

  if (!expert) redirect("/login");

  const totalAssignments = await prisma.expertAssignment.count({
    where: { expertId: expert.id },
  });
  const activeAssignments = await prisma.expertAssignment.count({
    where: { expertId: expert.id, status: "ACCEPTED" },
  });
  const pendingAssignments = await prisma.expertAssignment.count({
    where: { expertId: expert.id, status: "PENDING" },
  });
  const completedAssignments = await prisma.expertAssignment.count({
    where: { expertId: expert.id, status: "COMPLETED" },
  });

  const recentAssignments = await prisma.expertAssignment.findMany({
    where: { expertId: expert.id },
    orderBy: { assignedAt: "desc" },
    take: 5,
    include: {
      case: {
        include: {
          applicant: { select: { name: true, company: true } },
        },
      },
    },
  });

  const data = {
    totalAssignments,
    activeAssignments,
    pendingAssignments,
    completedAssignments,
    recentAssignments: recentAssignments.map((a) => ({
      id: a.id,
      caseId: a.case.id,
      caseNumber: a.case.caseNumber,
      patentTitle: a.case.patentTitle,
      applicantName: a.case.applicant.name,
      status: a.status,
      caseStatus: a.case.status,
    })),
  };

  return <ExpertDashboardClient data={data} />;
}
