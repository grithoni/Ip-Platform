import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ExpertProfileClient from "./ExpertProfileClient";

export default async function ExpertProfilePage() {
  const session = await getSession();
  if (!session || session.role !== "EXPERT") redirect("/login");

  const expert = await prisma.expert.findUnique({
    where: { userId: session.userId },
    include: { user: { select: { name: true, email: true, phone: true, company: true } } },
  });

  if (!expert) redirect("/expert");

  const data = {
    id: expert.id,
    name: expert.name,
    email: expert.user.email,
    phone: expert.user.phone,
    company: expert.user.company,
    technicalFields: expert.technicalFields,
    qualifications: expert.qualifications,
    availability: expert.availability,
    hourlyRate: expert.hourlyRate,
    bio: expert.bio,
  };

  return <ExpertProfileClient profile={data} />;
}
