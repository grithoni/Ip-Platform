import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ResponseClient from "./ResponseClient";

export default async function ResponsePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const caseRecord = await prisma.case.findUnique({
    where: { id },
    include: {
      applicant: { select: { id: true, name: true, email: true, company: true } },
      documents: true,
      caseResponse: true,
    },
  });

  if (!caseRecord) redirect("/cases");
  if (caseRecord.respondentId !== session.userId) redirect(`/cases/${id}`);
  if (caseRecord.status !== "RESPONDENT_PENDING" && !caseRecord.caseResponse) {
    redirect(`/cases/${id}`);
  }

  const data = {
    id: caseRecord.id,
    caseNumber: caseRecord.caseNumber,
    patentNumber: caseRecord.patentNumber,
    patentTitle: caseRecord.patentTitle,
    disputeType: caseRecord.disputeType,
    amountInDispute: caseRecord.amountInDispute,
    description: caseRecord.description,
    status: caseRecord.status,
    responseDeadline: caseRecord.responseDeadline?.toISOString() || null,
    applicant: caseRecord.applicant,
    documents: caseRecord.documents.map((d) => ({
      id: d.id,
      fileName: d.fileName,
      fileType: d.fileType,
      fileSize: d.fileSize,
      category: d.category,
      uploadTime: d.uploadTime.toISOString(),
    })),
    caseResponse: caseRecord.caseResponse
      ? {
          action: caseRecord.caseResponse.action,
          responseText: caseRecord.caseResponse.responseText,
          counterclaimDesc: caseRecord.caseResponse.counterclaimDesc,
          respondedAt: caseRecord.caseResponse.respondedAt.toISOString(),
        }
      : null,
  };

  return <ResponseClient data={data} />;
}
