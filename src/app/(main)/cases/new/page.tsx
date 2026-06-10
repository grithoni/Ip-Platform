import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewCaseClient from "./NewCaseClient";

export default async function NewCasePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return <NewCaseClient />;
}
