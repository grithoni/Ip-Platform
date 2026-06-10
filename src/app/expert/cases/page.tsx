import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ExpertCasesClient from "./ExpertCasesClient";

export default async function ExpertCasesPage() {
  const session = await getSession();
  if (!session || session.role !== "EXPERT") redirect("/login");

  const expert = await prisma.expert.findUnique({
    where: { userId: session.userId },
  });
  if (!expert) redirect("/expert");

  const assignments = await prisma.expertAssignment.findMany({
    where: { expertId: expert.id, status: { in: ["ACCEPTED", "COMPLETED"] } },
    orderBy: { assignedAt: "desc" },
    include: {
      case: {
        include: {
          applicant: { select: { name: true } },
        },
      },
    },
  });

  const cases = assignments.map((a) => ({
    id: a.case.id,
    caseNumber: a.case.caseNumber,
    patentTitle: a.case.patentTitle,
    disputeType: a.case.disputeType,
    status: a.case.status,
    amountInDispute: a.case.amountInDispute,
    applicantName: a.case.applicant.name,
    assignmentStatus: a.status,
    declarationSigned: a.declarationSigned,
    assignedAt: a.assignedAt.toISOString(),
    updatedAt: a.case.updatedAt.toISOString(),
  }));

  return <ExpertCasesClient cases={cases} />;
}
