import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewCaseClient from "./NewCaseClient";

export default async function NewCasePage({
  searchParams,
}: {
  searchParams: Promise<{ assessmentId?: string; disputeType?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { assessmentId, disputeType } = await searchParams;

  return <NewCaseClient assessmentId={assessmentId} initialDisputeType={disputeType} />;
}
