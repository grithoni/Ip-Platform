import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const totalCases = await prisma.case.count();
  const activeCases = await prisma.case.count({
    where: { status: { notIn: ["DRAFT", "COMPLETED", "CLOSED"] } },
  });
  const totalExperts = await prisma.expert.count();
  const totalUsers = await prisma.user.count();

  const pendingApplications = await prisma.expertApplication.count({
    where: { status: "PENDING" },
  });
  const activeENE = await prisma.eNEAssessment.count({
    where: { status: { notIn: ["COMPLETED"] } },
  });
  const pendingResponses = await prisma.case.count({
    where: { status: "RESPONDENT_PENDING" },
  });

  const recentCases = await prisma.case.findMany({
    orderBy: { updatedAt: "desc" },
    take: 10,
    include: {
      applicant: { select: { name: true, company: true } },
      assignments: { include: { expert: { select: { name: true } } } },
    },
  });

  const data = {
    totalCases,
    activeCases,
    totalExperts,
    totalUsers,
    pendingApplications,
    activeENE,
    pendingResponses,
    recentCases: recentCases.map((c) => ({
      id: c.id,
      caseNumber: c.caseNumber,
      patentTitle: c.patentTitle,
      status: c.status,
      applicantName: c.applicant.name,
      expertName: c.assignments[0]?.expert?.name || null,
      updatedAt: c.updatedAt.toISOString(),
    })),
  };

  return <AdminDashboardClient data={data} />;
}
