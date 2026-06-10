import { prisma } from "@/lib/prisma";

export async function generateCaseNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ED-${year}-`;

  const lastCase = await prisma.case.findFirst({
    where: { caseNumber: { startsWith: prefix } },
    orderBy: { caseNumber: "desc" },
  });

  let nextNumber = 1;
  if (lastCase) {
    const lastNum = parseInt(lastCase.caseNumber.replace(prefix, ""), 10);
    if (!isNaN(lastNum)) {
      nextNumber = lastNum + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(3, "0")}`;
}
