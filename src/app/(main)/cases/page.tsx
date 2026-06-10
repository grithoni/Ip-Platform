import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CasesClient from "./CasesClient";

export default async function CasesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const cases = await prisma.case.findMany({
    where: {
      OR: [
        { applicantId: session.userId },
        { respondentId: session.userId },
      ],
    },
    orderBy: { updatedAt: "desc" },
    include: {
      applicant: { select: { name: true, company: true } },
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

  return <CasesClient cases={data} />;
}
