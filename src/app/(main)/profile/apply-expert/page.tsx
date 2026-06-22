import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ApplyExpertClient from "./ApplyExpertClient";

export default async function ApplyExpertPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Check if already an expert
  const existingExpert = await prisma.expert.findUnique({
    where: { userId: session.userId },
  });
  if (existingExpert) redirect("/expert");

  // Check if already applied
  const existingApp = await prisma.expertApplication.findUnique({
    where: { userId: session.userId },
  });

  const user = await prisma.user.findUnique({ where: { id: session.userId } });

  return (
    <ApplyExpertClient
      userName={user?.name || ""}
      userEmail={user?.email || ""}
      existingApplication={
        existingApp
          ? {
              status: existingApp.status,
              createdAt: existingApp.createdAt.toISOString(),
              reviewNote: existingApp.reviewNote,
            }
          : null
      }
    />
  );
}
