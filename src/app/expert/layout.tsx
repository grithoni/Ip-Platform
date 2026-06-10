import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ExpertLayoutClient from "./layout-client";

export default async function ExpertLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== "EXPERT") {
    redirect("/login");
  }

  return (
    <ExpertLayoutClient
      user={{
        userId: session.userId,
        email: session.email,
        role: session.role,
      }}
    >
      {children}
    </ExpertLayoutClient>
  );
}
