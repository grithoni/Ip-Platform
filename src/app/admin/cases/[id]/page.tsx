import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CaseDetailClient from "./CaseDetailClient";

export default async function AdminCaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const caseData = await prisma.case.findUnique({
    where: { id },
    include: {
      applicant: { select: { id: true, name: true, company: true, email: true } },
      respondent: { select: { id: true, name: true, company: true, email: true } },
      documents: { orderBy: { uploadTime: "desc" } },
      assignments: {
        include: { expert: { select: { id: true, name: true, userId: true } } },
      },
      aiAnalyses: { orderBy: { createdAt: "desc" } },
      determinations: {
        orderBy: { issuedAt: "desc" },
        include: { expert: { select: { name: true } } },
      },
    },
  });

  if (!caseData) redirect("/admin/cases");

  const messages = await prisma.message.findMany({
    where: { caseId: id },
    orderBy: { createdAt: "asc" },
    include: {
      from: { select: { id: true, name: true, role: true } },
      to: { select: { id: true, name: true, role: true } },
    },
  });

  const auditLogs = await prisma.auditLog.findMany({
    where: { targetId: id },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });

  const experts = await prisma.expert.findMany({
    select: { id: true, name: true, availability: true },
    orderBy: { name: "asc" },
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
      expertId: a.expertId,
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
    auditLogs: auditLogs.map((l) => ({
      id: l.id,
      action: l.action,
      targetType: l.targetType,
      targetId: l.targetId,
      details: l.details,
      userName: l.user.name,
      createdAt: l.createdAt.toISOString(),
    })),
    experts: experts.map((e) => ({
      id: e.id,
      name: e.name,
      availability: e.availability,
    })),
  };

  return <CaseDetailClient data={data} />;
}
