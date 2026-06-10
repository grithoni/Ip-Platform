"use client";

import { Card, Table, Tag, Button } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import Link from "next/link";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "草稿", color: "default" },
  SUBMITTED: { label: "已提交", color: "processing" },
  ACCEPTED: { label: "已受理", color: "blue" },
  EXPERT_ASSIGNING: { label: "专家分配中", color: "orange" },
  IN_EVALUATION: { label: "评估中", color: "cyan" },
  DETERMINATION_ISSUED: { label: "已裁决", color: "green" },
  COMPLETED: { label: "已完成", color: "green" },
  CLOSED: { label: "已关闭", color: "default" },
};

const DISPUTE_MAP: Record<string, string> = {
  INFRINGEMENT: "侵权纠纷",
  VALUATION: "估值评估",
  LICENSING: "许可费率",
  OTHER: "其他",
};

interface ExpertCaseItem {
  id: string;
  caseNumber: string;
  patentTitle: string;
  disputeType: string;
  status: string;
  amountInDispute: number | null;
  applicantName: string;
  assignmentStatus: string;
  declarationSigned: boolean;
  assignedAt: string;
  updatedAt: string;
}

export default function ExpertCasesClient({ cases }: { cases: ExpertCaseItem[] }) {
  const columns = [
    { title: "案件编号", dataIndex: "caseNumber", key: "caseNumber" },
    { title: "专利名称", dataIndex: "patentTitle", key: "patentTitle", ellipsis: true },
    { title: "申请人", dataIndex: "applicantName", key: "applicantName" },
    {
      title: "纠纷类型", dataIndex: "disputeType", key: "disputeType",
      render: (v: string) => DISPUTE_MAP[v] || v,
    },
    {
      title: "案件状态", dataIndex: "status", key: "status",
      render: (v: string) => {
        const s = STATUS_MAP[v];
        return s ? <Tag color={s.color}>{s.label}</Tag> : v;
      },
    },
    {
      title: "声明签署", dataIndex: "declarationSigned", key: "declarationSigned",
      render: (v: boolean) => v ? <Tag color="green">已签署</Tag> : <Tag color="orange">未签署</Tag>,
    },
    {
      title: "更新时间", dataIndex: "updatedAt", key: "updatedAt",
      render: (v: string) => new Date(v).toLocaleDateString("zh-CN"),
    },
    {
      title: "操作", key: "action",
      render: (_: unknown, record: ExpertCaseItem) => (
        <Link href={`/expert/cases/${record.id}`}>
          <Button type="link" icon={<EyeOutlined />} size="small">查看</Button>
        </Link>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>我的案件</h2>
      <Card>
        <Table dataSource={cases} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
}
