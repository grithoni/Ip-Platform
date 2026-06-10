import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AssignmentsClient from "./AssignmentsClient";

export default async function AssignmentsPage() {
  const session = await getSession();
  if (!session || session.role !== "EXPERT") redirect("/login");

  const expert = await prisma.expert.findUnique({
    where: { userId: session.userId },
  });
  if (!expert) redirect("/expert");

  const assignments = await prisma.expertAssignment.findMany({
    where: { expertId: expert.id },
    orderBy: { assignedAt: "desc" },
    include: {
      case: {
        include: {
          applicant: { select: { name: true } },
        },
      },
    },
  });

  const data = assignments.map((a) => ({
    id: a.id,
    caseId: a.case.id,
    caseNumber: a.case.caseNumber,
    patentTitle: a.case.patentTitle,
    disputeType: a.case.disputeType,
    status: a.status,
    declarationSigned: a.declarationSigned,
    applicantName: a.case.applicant.name,
    assignedAt: a.assignedAt.toISOString(),
  }));

  return <AssignmentsClient assignments={data} />;
}
