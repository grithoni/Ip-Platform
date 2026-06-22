"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

interface AssessmentAnswers {
  disputeType: string;
  hasPatent: boolean;
  patentNumber?: string;
  bothPartiesKnown: boolean;
  respondentWilling?: string;
  amountInDispute?: string;
  urgencyLevel?: string;
  hasPriorNegotiation: boolean;
  technicalComplexity?: string;
}

function determineRecommendedPath(answers: AssessmentAnswers): string {
  const { disputeType, bothPartiesKnown, respondentWilling, amountInDispute, hasPriorNegotiation, technicalComplexity } = answers;

  // High-value infringement with high technical complexity → expert evaluation
  if (
    disputeType === "INFRINGEMENT" &&
    technicalComplexity === "HIGH" &&
    (amountInDispute === "RANGE_500W_1M" || amountInDispute === "OVER_1M")
  ) {
    return "EXPERT_EVALUATION";
  }

  // Both parties known and willing → ENE
  if (bothPartiesKnown && respondentWilling === "YES") {
    return "ENE";
  }

  // Low amount with prior negotiation → mediation
  if (amountInDispute === "UNDER_100W" && hasPriorNegotiation) {
    return "MEDIATION";
  }

  // Valuation disputes → expert evaluation
  if (disputeType === "VALUATION") {
    return "EXPERT_EVALUATION";
  }

  // Default
  return "EXPERT_EVALUATION";
}

export async function saveAssessment(answers: AssessmentAnswers) {
  const session = await getSession();
  if (!session) return { error: "请先登录" };

  const recommendedPath = determineRecommendedPath(answers);

  const assessment = await prisma.aDRAssessment.create({
    data: {
      userId: session.userId,
      disputeType: answers.disputeType,
      hasPatent: answers.hasPatent,
      patentNumber: answers.patentNumber || null,
      bothPartiesKnown: answers.bothPartiesKnown,
      respondentWilling: answers.respondentWilling || null,
      amountInDispute: answers.amountInDispute || null,
      urgencyLevel: answers.urgencyLevel || null,
      hasPriorNegotiation: answers.hasPriorNegotiation,
      technicalComplexity: answers.technicalComplexity || null,
      recommendedPath,
      answers: JSON.stringify(answers),
    },
  });

  return { success: true, assessmentId: assessment.id, recommendedPath };
}

export async function getAssessment(assessmentId: string) {
  const session = await getSession();
  if (!session) return { error: "请先登录" };

  const assessment = await prisma.aDRAssessment.findUnique({
    where: { id: assessmentId },
  });

  if (!assessment) return null;

  if (assessment.userId !== session.userId && session.role !== "ADMIN") {
    return { error: "无权查看此评估" };
  }

  return {
    id: assessment.id,
    disputeType: assessment.disputeType,
    hasPatent: assessment.hasPatent,
    patentNumber: assessment.patentNumber,
    bothPartiesKnown: assessment.bothPartiesKnown,
    respondentWilling: assessment.respondentWilling,
    amountInDispute: assessment.amountInDispute,
    urgencyLevel: assessment.urgencyLevel,
    hasPriorNegotiation: assessment.hasPriorNegotiation,
    technicalComplexity: assessment.technicalComplexity,
    recommendedPath: assessment.recommendedPath,
    answers: assessment.answers,
    createdAt: assessment.createdAt.toISOString(),
  };
}
