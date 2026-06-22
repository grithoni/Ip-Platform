// ============================================================
// 共享常量 - 专利纠纷中立评估平台
// ============================================================

// --- 案件状态 ---
export const STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "草稿", color: "default" },
  SUBMITTED: { label: "已提交", color: "processing" },
  RESPONDENT_PENDING: { label: "待被申请人回复", color: "warning" },
  RESPONDENT_REJECTED: { label: "被申请人拒绝", color: "error" },
  COUNTERCLAIM_PENDING: { label: "反请求处理中", color: "orange" },
  ACCEPTED: { label: "已受理", color: "blue" },
  EXPERT_ASSIGNING: { label: "专家分配中", color: "orange" },
  IN_EVALUATION: { label: "评估中", color: "cyan" },
  DETERMINATION_ISSUED: { label: "已裁决", color: "green" },
  COMPLETED: { label: "已完成", color: "green" },
  CLOSED: { label: "已关闭", color: "default" },
};

export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["RESPONDENT_PENDING", "CLOSED"],
  RESPONDENT_PENDING: ["ACCEPTED", "RESPONDENT_REJECTED"],
  RESPONDENT_REJECTED: ["CLOSED"],
  COUNTERCLAIM_PENDING: ["ACCEPTED"],
  ACCEPTED: ["EXPERT_ASSIGNING"],
  EXPERT_ASSIGNING: ["IN_EVALUATION"],
  IN_EVALUATION: ["DETERMINATION_ISSUED"],
  DETERMINATION_ISSUED: ["COMPLETED"],
  COMPLETED: ["CLOSED"],
};

// --- 纠纷类型 ---
export const DISPUTE_MAP: Record<string, string> = {
  INFRINGEMENT: "侵权纠纷",
  VALUATION: "估值评估",
  LICENSING: "许可费率",
  OTHER: "其他",
};

export const DISPUTE_OPTIONS = [
  { value: "INFRINGEMENT", label: "侵权纠纷" },
  { value: "VALUATION", label: "估值评估" },
  { value: "LICENSING", label: "许可费率" },
  { value: "OTHER", label: "其他" },
];

// --- 文档分类 ---
export const DOC_CATEGORY_MAP: Record<string, string> = {
  PATENT_CERTIFICATE: "专利证书",
  CLAIMS: "权利要求书",
  EVIDENCE: "证据材料",
  TECHNICAL_DESCRIPTION: "技术说明",
  INFRINGEMENT_EVIDENCE: "侵权证据",
  OTHER: "其他",
};

export const DOC_CATEGORY_OPTIONS = [
  { value: "PATENT_CERTIFICATE", label: "专利证书" },
  { value: "CLAIMS", label: "权利要求书" },
  { value: "EVIDENCE", label: "证据材料" },
  { value: "TECHNICAL_DESCRIPTION", label: "技术说明" },
  { value: "INFRINGEMENT_EVIDENCE", label: "侵权证据" },
  { value: "OTHER", label: "其他" },
];

// --- AI 分析 ---
export const ANALYSIS_TYPE_MAP: Record<string, string> = {
  CLAIM_INTERPRETATION: "权利要求解释",
  INFRINGEMENT_COMPARISON: "侵权比对",
  VALUATION: "估值分析",
};

export const ANALYSIS_STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "待处理", color: "default" },
  PROCESSING: { label: "处理中", color: "processing" },
  COMPLETED: { label: "已完成", color: "green" },
  FAILED: { label: "失败", color: "red" },
};

// --- 裁决 ---
export const DETERMINATION_TYPE_MAP: Record<string, string> = {
  INTERIM: "临时裁决",
  FINAL: "最终裁决",
};

// --- 被申请人回复 ---
export const RESPONSE_ACTION_MAP: Record<string, { label: string; color: string }> = {
  ACCEPT: { label: "接受评估", color: "green" },
  REJECT: { label: "拒绝参与", color: "red" },
  COUNTERCLAIM: { label: "提出反请求", color: "orange" },
};

// --- ADR 推荐路径 ---
export const RESOLUTION_PATH_MAP: Record<string, { label: string; description: string }> = {
  EXPERT_EVALUATION: {
    label: "专家评估",
    description: "推荐由平台专家进行中立评估，结合 AI 分析出具专业评估意见。",
  },
  ENE: {
    label: "早期中立评估",
    description: "推荐通过早期中立评估程序，由中立专家对争议焦点出具初步意见，促进双方和解。",
  },
  MEDIATION: {
    label: "调解",
    description: "推荐通过调解方式解决纠纷，由中立调解员协助双方达成和解协议。（即将上线）",
  },
  ARBITRATION: {
    label: "仲裁",
    description: "推荐通过仲裁方式获得具有约束力的裁决。（即将上线）",
  },
};

// --- ADR 评估问卷选项 ---
export const AMOUNT_RANGE_OPTIONS = [
  { value: "UNDER_100W", label: "100 万元以下" },
  { value: "RANGE_100W_500W", label: "100 - 500 万元" },
  { value: "RANGE_500W_1M", label: "500 - 1000 万元" },
  { value: "OVER_1M", label: "1000 万元以上" },
];

export const URGENCY_OPTIONS = [
  { value: "LOW", label: "不紧急" },
  { value: "MEDIUM", label: "一般" },
  { value: "HIGH", label: "紧急" },
];

export const TECHNICAL_COMPLEXITY_OPTIONS = [
  { value: "LOW", label: "低（简单结构/外观设计）" },
  { value: "MEDIUM", label: "中（一般发明）" },
  { value: "HIGH", label: "高（前沿技术/复杂系统）" },
];

// --- ENE 评估 ---
export const ENE_SCOPE_MAP: Record<string, string> = {
  INFRINGEMENT_ONLY: "仅侵权分析",
  VALUATION_ONLY: "仅估值分析",
  FULL: "全面评估",
};

export const ENE_BINDING_MAP: Record<string, string> = {
  BINDING: "约束性",
  NON_BINDING: "非约束性",
};

export const ENE_STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "草稿", color: "default" },
  PENDING_AGREEMENT: { label: "等待双方同意", color: "warning" },
  IN_PROGRESS: { label: "评估进行中", color: "processing" },
  OPINION_ISSUED: { label: "初步意见已出具", color: "cyan" },
  COMPLETED: { label: "已完成", color: "green" },
};

// --- 专家管理 ---
export const PANEL_CATEGORY_MAP: Record<string, string> = {
  ELECTRONICS: "电子/通信",
  SOFTWARE: "软件/互联网",
  MECHANICAL: "机械/制造",
  CHEMICAL: "化学/材料",
  PHARMACEUTICAL: "医药/生物",
  OTHER: "其他",
};

export const EXPERT_APPLICATION_STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "待审核", color: "warning" },
  APPROVED: { label: "已通过", color: "green" },
  REJECTED: { label: "已拒绝", color: "red" },
};

export const CONFLICT_REASON_MAP: Record<string, string> = {
  SAME_COMPANY: "同一公司/关联公司",
  PRIOR_REPRESENTATION: "曾代理过该方当事人",
  FAMILY: "亲属关系",
  FINANCIAL: "经济利益关系",
  OTHER: "其他",
};
