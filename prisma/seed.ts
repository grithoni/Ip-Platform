import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clean existing data (in dependency order)
  await prisma.auditLog.deleteMany();
  await prisma.message.deleteMany();
  await prisma.determination.deleteMany();
  await prisma.aIAnalysis.deleteMany();
  await prisma.expertAssignment.deleteMany();
  await prisma.document.deleteMany();
  await prisma.party.deleteMany();
  await prisma.caseResponse.deleteMany();
  await prisma.expertRating.deleteMany();
  await prisma.eNEAssessment.deleteMany();
  await prisma.case.deleteMany();
  await prisma.conflictOfInterest.deleteMany();
  await prisma.expertApplication.deleteMany();
  await prisma.expert.deleteMany();
  await prisma.aDRAssessment.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({
    data: {
      email: "admin@ip.com",
      password: adminPassword,
      name: "系统管理员",
      role: "ADMIN",
      company: "IP评估平台",
    },
  });

  // Create applicant (party)
  const applicantPassword = await bcrypt.hash("test123", 10);
  const applicant = await prisma.user.create({
    data: {
      email: "applicant@ip.com",
      password: applicantPassword,
      name: "张明",
      role: "PARTY",
      company: "深圳华芯科技有限公司",
      phone: "13800138001",
    },
  });

  // Create respondent (party)
  const respondentPassword = await bcrypt.hash("test123", 10);
  const respondent = await prisma.user.create({
    data: {
      email: "respondent@ip.com",
      password: respondentPassword,
      name: "李强",
      role: "PARTY",
      company: "北京创新电子有限公司",
      phone: "13800138002",
    },
  });

  // Create expert users
  const expertPassword = await bcrypt.hash("test123", 10);

  const expertUser1 = await prisma.user.create({
    data: {
      email: "expert@ip.com",
      password: expertPassword,
      name: "王教授",
      role: "EXPERT",
      company: "清华大学知识产权研究院",
    },
  });
  const expert1 = await prisma.expert.create({
    data: {
      userId: expertUser1.id,
      name: "王教授",
      technicalFields: JSON.stringify(["通信", "信号处理", "5G"]),
      qualifications: "专利代理人资格, 通信工程教授, 博士生导师",
      availability: "AVAILABLE",
      hourlyRate: 3000,
      bio: "清华大学知识产权研究院教授，专注通信领域专利分析20余年",
      panelCategory: "ELECTRONICS",
    },
  });

  const expertUser2 = await prisma.user.create({
    data: {
      email: "expert2@ip.com",
      password: expertPassword,
      name: "陈律师",
      role: "EXPERT",
      company: "金杜律师事务所",
    },
  });
  const expert2 = await prisma.expert.create({
    data: {
      userId: expertUser2.id,
      name: "陈律师",
      technicalFields: JSON.stringify(["软件", "互联网", "人工智能"]),
      qualifications: "律师执业证, 专利代理人资格",
      availability: "AVAILABLE",
      hourlyRate: 2500,
      bio: "金杜律师事务所合伙人，专注互联网和AI领域知识产权诉讼",
      panelCategory: "SOFTWARE",
    },
  });

  const expertUser3 = await prisma.user.create({
    data: {
      email: "expert3@ip.com",
      password: expertPassword,
      name: "赵博士",
      role: "EXPERT",
      company: "中国科学院微电子研究所",
    },
  });
  const expert3 = await prisma.expert.create({
    data: {
      userId: expertUser3.id,
      name: "赵博士",
      technicalFields: JSON.stringify(["半导体", "集成电路", "MEMS"]),
      qualifications: "博士学位, 高级工程师",
      availability: "BUSY",
      hourlyRate: 3500,
      bio: "中科院微电子研究所高级工程师，半导体封装技术专家",
      panelCategory: "ELECTRONICS",
    },
  });

  // Create case 1: 5G patent infringement (IN_EVALUATION)
  const case1 = await prisma.case.create({
    data: {
      caseNumber: "ED-2026-001",
      patentNumber: "ZL202310123456.7",
      patentTitle: "一种5G信号处理方法及装置",
      disputeType: "INFRINGEMENT",
      amountInDispute: 5000000,
      description: "申请人认为被申请人的5G基站产品使用了其专利技术，涉嫌侵犯专利权",
      status: "IN_EVALUATION",
      applicantId: applicant.id,
      respondentId: respondent.id,
      responseDeadline: new Date("2026-06-24"),
    },
  });

  await prisma.party.create({
    data: { userId: applicant.id, caseId: case1.id, role: "APPLICANT", company: "深圳华芯科技有限公司" },
  });
  await prisma.party.create({
    data: { userId: respondent.id, caseId: case1.id, role: "RESPONDENT", company: "北京创新电子有限公司" },
  });

  // Expert assignment for case 1
  const assignment1 = await prisma.expertAssignment.create({
    data: {
      caseId: case1.id,
      expertId: expert1.id,
      status: "ACCEPTED",
      declarationSigned: true,
      declarationSignedAt: new Date("2026-06-05"),
    },
  });

  // Documents for case 1
  await prisma.document.create({
    data: {
      caseId: case1.id,
      uploaderId: applicant.id,
      fileName: "专利证书.pdf",
      filePath: `uploads/${case1.id}/专利证书.pdf`,
      fileType: "pdf",
      fileSize: 1024000,
      category: "PATENT_CERTIFICATE",
    },
  });
  await prisma.document.create({
    data: {
      caseId: case1.id,
      uploaderId: applicant.id,
      fileName: "权利要求书.pdf",
      filePath: `uploads/${case1.id}/权利要求书.pdf`,
      fileType: "pdf",
      fileSize: 512000,
      category: "CLAIMS",
    },
  });
  await prisma.document.create({
    data: {
      caseId: case1.id,
      uploaderId: applicant.id,
      fileName: "被控产品技术说明.pdf",
      filePath: `uploads/${case1.id}/被控产品技术说明.pdf`,
      fileType: "pdf",
      fileSize: 2048000,
      category: "INFRINGEMENT_EVIDENCE",
    },
  });

  // AI analysis for case 1
  await prisma.aIAnalysis.create({
    data: {
      caseId: case1.id,
      analysisType: "CLAIM_INTERPRETATION",
      status: "COMPLETED",
      result: JSON.stringify({
        claimInterpretation: {
          independentClaims: [
            {
              claimNumber: 1,
              text: "一种5G信号处理方法，包括步骤：接收OFDM信号；进行信道估计；应用MIMO解码...",
              technicalFeatures: ["OFDM信号接收", "信道估计", "MIMO解码", "信号重构"],
              interpretation: "权利要求1保护一种完整的5G信号处理流程，核心在于信道估计与MIMO解码的结合方式",
            },
          ],
          dependentClaims: [
            { claimNumber: 2, text: "根据权利要求1的方法，其中信道估计采用最小二乘法...", interpretation: "从属权利要求2进一步限定了信道估计的具体算法" },
          ],
        },
        infringementComparison: {
          featureComparisons: [
            { feature: "OFDM信号接收", claimElement: "接收OFDM信号", accusedElement: "支持OFDM信号接收", comparison: "identical", reasoning: "被控产品技术规格明确支持OFDM信号接收" },
            { feature: "信道估计", claimElement: "进行信道估计", accusedElement: "采用MMSE信道估计", comparison: "equivalent", reasoning: "MMSE是信道估计的一种具体实现，落入权利要求保护范围" },
            { feature: "MIMO解码", claimElement: "应用MIMO解码", accusedElement: "支持4x4 MIMO", comparison: "identical", reasoning: "被控产品明确支持MIMO解码功能" },
          ],
          overallConclusion: "被控产品技术特征与权利要求1高度吻合，存在侵权可能性较大",
          literalInfringement: true,
          doctrineOfEquivalents: "即使部分技术特征存在差异，采用等同原则仍可能构成侵权",
        },
        confidence: 0.85,
        reasoning: "基于权利要求技术特征分解和被控产品技术规格对比分析",
      }),
      completedAt: new Date("2026-06-08"),
    },
  });

  // Determination for case 1
  await prisma.determination.create({
    data: {
      caseId: case1.id,
      expertId: expert1.id,
      type: "INTERIM",
      content: "经初步审查，被控产品在OFDM信号接收、信道估计和MIMO解码三个方面与专利权利要求1的技术特征高度吻合。建议双方就许可费率进行协商。最终裁决将在补充证据审查后作出。",
    },
  });

  // Messages for case 1
  await prisma.message.create({
    data: {
      fromUserId: expertUser1.id,
      toUserId: applicant.id,
      caseId: case1.id,
      content: "您好，我已接受指派担任本案专家。请补充提供被控产品的详细技术规格文档。",
      readAt: new Date("2026-06-06"),
    },
  });
  await prisma.message.create({
    data: {
      fromUserId: applicant.id,
      toUserId: expertUser1.id,
      caseId: case1.id,
      content: "好的，已上传被控产品技术说明。如需其他材料请告知。",
      readAt: new Date("2026-06-06"),
    },
  });

  // Create case 2: AI image recognition (EXPERT_ASSIGNING)
  const case2 = await prisma.case.create({
    data: {
      caseNumber: "ED-2026-002",
      patentNumber: "ZL202210987654.3",
      patentTitle: "基于深度学习的图像识别系统",
      disputeType: "INFRINGEMENT",
      amountInDispute: 2000000,
      description: "申请人认为被申请人的AI图像识别产品侵犯其深度学习相关专利",
      status: "EXPERT_ASSIGNING",
      applicantId: applicant.id,
      respondentId: respondent.id,
      responseDeadline: new Date("2026-06-20"),
    },
  });

  await prisma.party.create({
    data: { userId: applicant.id, caseId: case2.id, role: "APPLICANT", company: "深圳华芯科技有限公司" },
  });
  await prisma.party.create({
    data: { userId: respondent.id, caseId: case2.id, role: "RESPONDENT", company: "北京创新电子有限公司" },
  });

  await prisma.document.create({
    data: {
      caseId: case2.id,
      uploaderId: applicant.id,
      fileName: "专利证书-图像识别.pdf",
      filePath: `uploads/${case2.id}/专利证书-图像识别.pdf`,
      fileType: "pdf",
      fileSize: 800000,
      category: "PATENT_CERTIFICATE",
    },
  });

  // Create case 3: Semiconductor valuation (DRAFT)
  const case3 = await prisma.case.create({
    data: {
      caseNumber: "ED-2026-003",
      patentNumber: "ZL202410555555.5",
      patentTitle: "新型半导体封装结构",
      disputeType: "VALUATION",
      amountInDispute: 8000000,
      description: "申请人希望对其半导体封装专利进行价值评估，以确定合理许可费率",
      status: "DRAFT",
      applicantId: applicant.id,
    },
  });

  await prisma.party.create({
    data: { userId: applicant.id, caseId: case3.id, role: "APPLICANT", company: "深圳华芯科技有限公司" },
  });

  // ============================================================
  // 新增模型种子数据
  // ============================================================

  // 新用户：周工程师（申请成为专家的 PARTY 用户）
  const user5Password = await bcrypt.hash("test123", 10);
  const user5 = await prisma.user.create({
    data: {
      email: "zhou@ip.com",
      password: user5Password,
      name: "周工程师",
      role: "PARTY",
      company: "华为技术有限公司",
      phone: "13800138005",
    },
  });

  // 专家申请（周工程师申请成为专家）
  await prisma.expertApplication.create({
    data: {
      userId: user5.id,
      name: "周工程师",
      email: "zhou@ip.com",
      phone: "13800138005",
      company: "华为技术有限公司",
      technicalFields: JSON.stringify(["通信", "5G", "物联网"]),
      qualifications: "博士学位, 高级工程师",
      experienceYears: 12,
      bio: "华为技术有限公司高级工程师，5G标准专利主要发明人之一",
      hourlyRateExpect: 3000,
      status: "PENDING",
    },
  });

  // 被申请人回复（case1 - 李强接受评估）
  await prisma.caseResponse.create({
    data: {
      caseId: case1.id,
      respondentId: respondent.id,
      action: "ACCEPT",
      responseText: "同意参与评估程序，愿配合提供相关技术资料",
    },
  });

  // ADR 评估引导（关联到 case2）
  const adrAssessment = await prisma.aDRAssessment.create({
    data: {
      userId: applicant.id,
      disputeType: "INFRINGEMENT",
      hasPatent: true,
      patentNumber: "ZL202210987654.3",
      bothPartiesKnown: true,
      respondentWilling: "YES",
      amountInDispute: "RANGE_100W_500W",
      urgencyLevel: "MEDIUM",
      hasPriorNegotiation: false,
      technicalComplexity: "HIGH",
      recommendedPath: "EXPERT_EVALUATION",
      answers: JSON.stringify({
        disputeType: "INFRINGEMENT",
        hasPatent: true,
        patentNumber: "ZL202210987654.3",
        bothPartiesKnown: true,
        respondentWilling: "YES",
        amountInDispute: "RANGE_100W_500W",
        urgencyLevel: "MEDIUM",
        hasPriorNegotiation: false,
        technicalComplexity: "HIGH",
      }),
    },
  });

  // 关联 case2 的 ADR 评估
  await prisma.case.update({
    where: { id: case2.id },
    data: { adrAssessmentId: adrAssessment.id },
  });

  // ENE 评估（case2 - 使用赵博士作为 ENE 专家）
  await prisma.eNEAssessment.create({
    data: {
      caseId: case2.id,
      expertId: expert3.id,
      scope: "FULL",
      bindingType: "NON_BINDING",
      applicantAgreed: false,
      respondentAgreed: false,
      bothPartiesAgreed: false,
      status: "PENDING_AGREEMENT",
    },
  });

  // 专家评分（王教授在 case1 中获得的评分）
  await prisma.expertRating.create({
    data: {
      expertId: expert1.id,
      caseId: case1.id,
      raterId: applicant.id,
      score: 5,
      comment: "王教授专业水平很高，分析透彻",
      dimensions: JSON.stringify({ professionalism: 5, fairness: 5, timeliness: 4, expertise: 5 }),
    },
  });
  await prisma.expertRating.create({
    data: {
      expertId: expert1.id,
      caseId: case1.id,
      raterId: respondent.id,
      score: 4,
      comment: "分析专业客观，但希望时间更充裕",
      dimensions: JSON.stringify({ professionalism: 4, fairness: 5, timeliness: 3, expertise: 5 }),
    },
  });

  // 更新王教授的平均评分
  await prisma.expert.update({
    where: { id: expert1.id },
    data: { averageRating: 4.5, totalRatings: 2 },
  });

  // 利益冲突记录（陈律师与申请人张明有利益冲突）
  await prisma.conflictOfInterest.create({
    data: {
      expertId: expert2.id,
      partyUserId: applicant.id,
      reason: "PRIOR_REPRESENTATION",
      details: "陈律师曾代理张明所在公司的专利申请事务",
      isActive: true,
    },
  });

  // Audit logs
  const auditEntries = [
    { userId: applicant.id, action: "CASE_CREATED", targetType: "CASE", targetId: case1.id, details: "创建案件 ED-2026-001" },
    { userId: applicant.id, action: "CASE_SUBMITTED", targetType: "CASE", targetId: case1.id, details: "提交案件审核" },
    { userId: admin.id, action: "CASE_ACCEPTED", targetType: "CASE", targetId: case1.id, details: "案件通过审核" },
    { userId: admin.id, action: "EXPERT_ASSIGNED", targetType: "CASE", targetId: case1.id, details: "指派王教授为专家" },
    { userId: expertUser1.id, action: "DECLARATION_SIGNED", targetType: "CASE", targetId: case1.id, details: "签署公正性声明" },
    { userId: expertUser1.id, action: "AI_ANALYSIS_TRIGGERED", targetType: "CASE", targetId: case1.id, details: "触发AI权利要求分析" },
  ];

  for (const entry of auditEntries) {
    await prisma.auditLog.create({ data: entry });
  }

  console.log("Seed data created successfully!");
  console.log({
    admin: { email: "admin@ip.com", password: "admin123" },
    applicant: { email: "applicant@ip.com", password: "test123" },
    respondent: { email: "respondent@ip.com", password: "test123" },
    expert1: { email: "expert@ip.com", password: "test123" },
    expert2: { email: "expert2@ip.com", password: "test123" },
    expert3: { email: "expert3@ip.com", password: "test123" },
    applicantExpert: { email: "zhou@ip.com", password: "test123" },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
