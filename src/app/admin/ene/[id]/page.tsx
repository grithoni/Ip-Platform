import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ENEDetailClient from "@/app/expert/ene/[id]/ENEDetailClient";
import { getENEDetail } from "@/actions/ene";

export default async function AdminENEDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const data = await getENEDetail(id);
  if (!data) redirect("/admin/ene");

  return <ENEDetailClient data={data} userRole={session.role} />;
}
