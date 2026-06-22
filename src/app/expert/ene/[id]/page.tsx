import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ENEDetailClient from "./ENEDetailClient";
import { getENEDetail } from "@/actions/ene";

export default async function ENEDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const data = await getENEDetail(id);
  if (!data) redirect("/expert");

  // Verify access: admin or the assigned expert
  if (session.role !== "ADMIN" && session.userId !== data.expertUserId) {
    redirect("/expert");
  }

  return <ENEDetailClient data={data} userRole={session.role} />;
}
