import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminCasesClient from "./CasesClient";

export default async function AdminCasesPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const cases = await prisma.case.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      applicant: { select: { name: true } },
      assignments: { include: { expert: { select: { name: true } } } },
    },
  });

  const data = cases.map((c) => ({
    id: c.id,
    caseNumber: c.caseNumber,
    patentTitle: c.patentTitle,
    disputeType: c.disputeType,
    status: c.status,
    amountInDispute: c.amountInDispute,
    applicantName: c.applicant.name,
    expertName: c.assignments[0]?.expert?.name || null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return <AdminCasesClient cases={data} />;
}
