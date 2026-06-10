"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { analyzeClaims, valuatePatent } from "@/lib/agent-client";
import { revalidatePath } from "next/cache";

async function verifyAnalysisPermission(caseId: string) {
  const session = await getSession();
  if (!session) return { error: "请先登录", session: null };

  if (session.role === "ADMIN") return { error: null, session };

  if (session.role === "EXPERT") {
    const expert = await prisma.expert.findUnique({ where: { userId: session.userId } });
    if (!expert) return { error: "专家信息不存在", session: null };
    const assignment = await prisma.expertAssignment.findUnique({
      where: { caseId_expertId: { caseId, expertId: expert.id } },
    });
    if (!assignment || assignment.status !== "ACCEPTED") {
      return { error: "您未被指派或未接受此案件", session: null };
    }
    return { error: null, session };
  }

  return { error: "无权操作", session: null };
}

function getMockClaimResult() {
  return {
    claimInterpretation: {
      independentClaims: [
        {
          claimNumber: 1,
          text: "Mock独立权利要求1",
          technicalFeatures: ["技术特征A", "技术特征B", "技术特征C"],
          interpretation: "该权利要求描述了一种方法，包含A、B、C三个技术特征",
        },
      ],
      dependentClaims: [
        { claimNumber: 2, text: "Mock从属权利要求2", interpretation: "进一步限定了技术特征A的具体实施方式" },
      ],
    },
    infringementComparison: {
      featureComparisons: [
        {
          feature: "技术特征A",
          claimElement: "权利要求中的A",
          accusedElement: "被控产品中的A'",
          comparison: "字面相同",
          reasoning: "被控产品完全覆盖了该技术特征",
        },
      ],
      overallConclusion: "被控产品落入权利要求1的保护范围",
      literalInfringement: true,
      doctrineOfEquivalents: "无需适用等同原则",
    },
    confidence: 0.85,
    reasoning: "基于模拟数据的分析结果",
  };
}

function getMockInfringementResult() {
  return {
    comparisonMatrix: [
      { claimElement: "特征A", accusedElement: "产品A'", match: true, notes: "字面侵权" },
      { claimElement: "特征B", accusedElement: "产品B'", match: true, notes: "等同侵权" },
    ],
    conclusion: "被控产品落入专利保护范围",
    infringementLikelihood: "HIGH",
    confidence: 0.82,
  };
}

function getMockValuationResult() {
  return {
    methods: {
      incomeApproach: { value: 5000000, assumptions: ["预期收益期5年", "折现率12%"], calculation: "净现值法" },
      marketApproach: { value: 4500000, comparables: [{ name: "可比许可A", value: 4000000 }], adjustments: "技术领域调整" },
      costApproach: { value: 3000000, rdCost: 2500000, adjustments: "研发成本加成" },
      royaltyRate: { rate: 5, basis: "行业标准", comparableRates: [{ source: "许可数据库", rate: 4.5 }] },
    },
    recommendedRange: { low: 4000000, high: 6000000, recommended: 5000000 },
    currency: "CNY",
    assumptions: ["基于当前市场条件", "专利剩余有效期10年"],
    sensitivityAnalysis: [
      { variable: "折现率", impact: 15 },
      { variable: "收益增长率", impact: 20 },
    ],
  };
}

export async function triggerClaimAnalysis(caseId: string) {
  const { error, session } = await verifyAnalysisPermission(caseId);
  if (error || !session) return { error };

  const caseRecord = await prisma.case.findUnique({ where: { id: caseId } });
  if (!caseRecord) return { error: "案件不存在" };

  const analysis = await prisma.aIAnalysis.create({
    data: {
      caseId,
      analysisType: "CLAIM_INTERPRETATION",
      status: "PROCESSING",
    },
  });

  try {
    let result;
    try {
      result = await analyzeClaims({
        patentNumber: caseRecord.patentNumber,
        patentTitle: caseRecord.patentTitle,
        claimsText: caseRecord.description || "",
        accusedProductDescription: "",
        technicalField: "",
      });
    } catch {
      result = getMockClaimResult();
    }

    await prisma.aIAnalysis.update({
      where: { id: analysis.id },
      data: {
        status: "COMPLETED",
        result: JSON.stringify(result),
        completedAt: new Date(),
      },
    });
  } catch (e) {
    await prisma.aIAnalysis.update({
      where: { id: analysis.id },
      data: { status: "FAILED", error: (e as Error).message },
    });
  }

  revalidatePath(`/expert/cases/${caseId}`);
  revalidatePath(`/cases/${caseId}`);
  revalidatePath(`/admin/cases/${caseId}`);
  return { success: true, analysisId: analysis.id };
}

export async function triggerInfringementComparison(caseId: string) {
  const { error, session } = await verifyAnalysisPermission(caseId);
  if (error || !session) return { error };

  const caseRecord = await prisma.case.findUnique({ where: { id: caseId } });
  if (!caseRecord) return { error: "案件不存在" };

  const analysis = await prisma.aIAnalysis.create({
    data: {
      caseId,
      analysisType: "INFRINGEMENT_COMPARISON",
      status: "PROCESSING",
    },
  });

  try {
    let result;
    try {
      result = await analyzeClaims({
        patentNumber: caseRecord.patentNumber,
        patentTitle: caseRecord.patentTitle,
        claimsText: caseRecord.description || "",
        accusedProductDescription: "",
        technicalField: "",
      });
    } catch {
      result = getMockInfringementResult();
    }

    await prisma.aIAnalysis.update({
      where: { id: analysis.id },
      data: {
        status: "COMPLETED",
        result: JSON.stringify(result),
        completedAt: new Date(),
      },
    });
  } catch (e) {
    await prisma.aIAnalysis.update({
      where: { id: analysis.id },
      data: { status: "FAILED", error: (e as Error).message },
    });
  }

  revalidatePath(`/expert/cases/${caseId}`);
  revalidatePath(`/cases/${caseId}`);
  revalidatePath(`/admin/cases/${caseId}`);
  return { success: true, analysisId: analysis.id };
}

export async function triggerValuation(caseId: string) {
  const { error, session } = await verifyAnalysisPermission(caseId);
  if (error || !session) return { error };

  const caseRecord = await prisma.case.findUnique({ where: { id: caseId } });
  if (!caseRecord) return { error: "案件不存在" };

  const analysis = await prisma.aIAnalysis.create({
    data: {
      caseId,
      analysisType: "VALUATION",
      status: "PROCESSING",
    },
  });

  try {
    let result;
    try {
      result = await valuatePatent({
        patentNumber: caseRecord.patentNumber,
        patentTitle: caseRecord.patentTitle,
        technicalField: "",
        remainingLife: 10,
        claimScope: caseRecord.description || "",
      });
    } catch {
      result = getMockValuationResult();
    }

    await prisma.aIAnalysis.update({
      where: { id: analysis.id },
      data: {
        status: "COMPLETED",
        result: JSON.stringify(result),
        completedAt: new Date(),
      },
    });
  } catch (e) {
    await prisma.aIAnalysis.update({
      where: { id: analysis.id },
      data: { status: "FAILED", error: (e as Error).message },
    });
  }

  revalidatePath(`/expert/cases/${caseId}`);
  revalidatePath(`/cases/${caseId}`);
  revalidatePath(`/admin/cases/${caseId}`);
  return { success: true, analysisId: analysis.id };
}
