import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ExpertsClient from "./ExpertsClient";

export default async function ExpertsPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const experts = await prisma.expert.findMany({
    include: {
      user: { select: { email: true, company: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const applications = await prisma.expertApplication.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      reviewer: { select: { name: true } },
    },
  });

  const conflicts = await prisma.conflictOfInterest.findMany({
    where: { isActive: true },
    include: {
      expert: { select: { name: true } },
      partyUser: { select: { name: true, email: true, company: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const allUsers = await prisma.user.findMany({
    where: { role: { in: ["PARTY", "EXPERT"] } },
    select: { id: true, name: true, email: true, company: true },
  });

  const data = {
    experts: experts.map((e) => ({
      id: e.id,
      name: e.name,
      technicalFields: e.technicalFields,
      qualifications: e.qualifications,
      availability: e.availability,
      hourlyRate: e.hourlyRate,
      bio: e.bio,
      panelCategory: e.panelCategory,
      averageRating: e.averageRating,
      totalRatings: e.totalRatings,
      email: e.user.email,
      company: e.user.company,
      createdAt: e.createdAt.toISOString(),
    })),
    applications: applications.map((a) => ({
      id: a.id,
      userId: a.userId,
      name: a.name,
      email: a.email,
      company: a.company,
      technicalFields: a.technicalFields,
      qualifications: a.qualifications,
      experienceYears: a.experienceYears,
      bio: a.bio,
      hourlyRateExpect: a.hourlyRateExpect,
      status: a.status,
      createdAt: a.createdAt.toISOString(),
    })),
    conflicts: conflicts.map((c) => ({
      id: c.id,
      expertId: c.expertId,
      expertName: c.expert.name,
      partyUserId: c.partyUserId,
      partyName: c.partyUser.name,
      partyCompany: c.partyUser.company,
      reason: c.reason,
      details: c.details,
    })),
    expertsForSelect: experts.map((e) => ({ id: e.id, name: e.name })),
    usersForSelect: allUsers.map((u) => ({
      id: u.id,
      label: `${u.name} (${u.email})${u.company ? ` - ${u.company}` : ""}`,
    })),
  };

  return <ExpertsClient data={data} />;
}
