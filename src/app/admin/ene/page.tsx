import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ENEMgmtClient from "./ENEMgmtClient";

export default async function ENEMgmtPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const assessments = await prisma.eNEAssessment.findMany({
    include: {
      case: { select: { caseNumber: true, patentTitle: true, id: true } },
      expert: { select: { name: true, id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Cases that can have ENE (not already having active ENE)
  const casesWithENE = new Set(assessments.filter((a) => a.status !== "COMPLETED").map((a) => a.caseId));
  const allCases = await prisma.case.findMany({
    where: { status: { notIn: ["DRAFT", "CLOSED"] } },
    select: { id: true, caseNumber: true, patentTitle: true },
    orderBy: { createdAt: "desc" },
  });
  const availableCases = allCases.filter((c) => !casesWithENE.has(c.id));

  const experts = await prisma.expert.findMany({
    where: { availability: { not: "UNAVAILABLE" } },
    select: { id: true, name: true, panelCategory: true },
    orderBy: { name: "asc" },
  });

  const data = {
    assessments: assessments.map((a) => ({
      id: a.id,
      caseId: a.caseId,
      caseNumber: a.case.caseNumber,
      patentTitle: a.case.patentTitle,
      expertId: a.expertId,
      expertName: a.expert.name,
      scope: a.scope,
      bindingType: a.bindingType,
      applicantAgreed: a.applicantAgreed,
      respondentAgreed: a.respondentAgreed,
      bothPartiesAgreed: a.bothPartiesAgreed,
      status: a.status,
      createdAt: a.createdAt.toISOString(),
    })),
    availableCases: availableCases.map((c) => ({
      id: c.id,
      label: `${c.caseNumber} - ${c.patentTitle}`,
    })),
    experts: experts.map((e) => ({
      id: e.id,
      name: e.name,
    })),
  };

  return <ENEMgmtClient data={data} />;
}
