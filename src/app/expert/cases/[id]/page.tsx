import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ExpertCaseDetailClient from "./ExpertCaseDetailClient";

export default async function ExpertCaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "EXPERT") redirect("/login");

  const expert = await prisma.expert.findUnique({
    where: { userId: session.userId },
  });
  if (!expert) redirect("/expert");

  const assignment = await prisma.expertAssignment.findUnique({
    where: { caseId_expertId: { caseId: id, expertId: expert.id } },
  });
  if (!assignment) redirect("/expert/cases");

  const caseData = await prisma.case.findUnique({
    where: { id },
    include: {
      applicant: { select: { id: true, name: true, company: true, email: true } },
      respondent: { select: { id: true, name: true, company: true, email: true } },
      documents: { orderBy: { uploadTime: "desc" } },
      assignments: {
        include: { expert: { select: { id: true, name: true } } },
      },
      aiAnalyses: { orderBy: { createdAt: "desc" } },
      determinations: {
        orderBy: { issuedAt: "desc" },
        include: { expert: { select: { name: true } } },
      },
    },
  });

  if (!caseData) redirect("/expert/cases");

  const messages = await prisma.message.findMany({
    where: { caseId: id },
    orderBy: { createdAt: "asc" },
    include: {
      from: { select: { id: true, name: true, role: true } },
      to: { select: { id: true, name: true, role: true } },
    },
  });

  const data = {
    id: caseData.id,
    caseNumber: caseData.caseNumber,
    patentNumber: caseData.patentNumber,
    patentTitle: caseData.patentTitle,
    disputeType: caseData.disputeType,
    amountInDispute: caseData.amountInDispute,
    description: caseData.description,
    status: caseData.status,
    responseDeadline: caseData.responseDeadline?.toISOString() || null,
    createdAt: caseData.createdAt.toISOString(),
    applicant: caseData.applicant,
    respondent: caseData.respondent,
    documents: caseData.documents.map((d) => ({
      id: d.id,
      fileName: d.fileName,
      fileType: d.fileType,
      fileSize: d.fileSize,
      category: d.category,
      uploadTime: d.uploadTime.toISOString(),
    })),
    assignments: caseData.assignments.map((a) => ({
      id: a.id,
      expertName: a.expert.name,
      status: a.status,
      declarationSigned: a.declarationSigned,
      assignedAt: a.assignedAt.toISOString(),
    })),
    aiAnalyses: caseData.aiAnalyses.map((a) => ({
      id: a.id,
      analysisType: a.analysisType,
      status: a.status,
      result: a.result,
      createdAt: a.createdAt.toISOString(),
      completedAt: a.completedAt?.toISOString() || null,
    })),
    determinations: caseData.determinations.map((d) => ({
      id: d.id,
      type: d.type,
      content: d.content,
      expertName: d.expert.name,
      issuedAt: d.issuedAt.toISOString(),
      correctedAt: d.correctedAt?.toISOString() || null,
      correctionContent: d.correctionContent,
    })),
    messages: messages.map((m) => ({
      id: m.id,
      fromName: m.from.name,
      fromRole: m.from.role,
      toName: m.to.name,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
      readAt: m.readAt?.toISOString() || null,
    })),
    currentUserId: session.userId,
    expertId: expert.id,
    assignmentId: assignment.id,
    declarationSigned: assignment.declarationSigned,
  };

  return <ExpertCaseDetailClient data={data} />;
}
