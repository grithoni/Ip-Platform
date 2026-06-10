import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminLayoutClient from "./layout-client";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <AdminLayoutClient
      user={{
        userId: session.userId,
        email: session.email,
        role: session.role,
      }}
    >
      {children}
    </AdminLayoutClient>
  );
}
