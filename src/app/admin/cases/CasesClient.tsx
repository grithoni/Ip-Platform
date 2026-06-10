"use client";

import { Card, Table, Tag, Button, Select, Space } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useState } from "react";

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

interface CaseItem {
  id: string;
  caseNumber: string;
  patentTitle: string;
  disputeType: string;
  status: string;
  amountInDispute: number | null;
  applicantName: string;
  expertName: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminCasesClient({ cases }: { cases: CaseItem[] }) {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [disputeFilter, setDisputeFilter] = useState<string | undefined>(undefined);

  const filteredCases = cases.filter((c) => {
    if (statusFilter && c.status !== statusFilter) return false;
    if (disputeFilter && c.disputeType !== disputeFilter) return false;
    return true;
  });

  const columns = [
    { title: "案件编号", dataIndex: "caseNumber", key: "caseNumber" },
    { title: "专利名称", dataIndex: "patentTitle", key: "patentTitle", ellipsis: true },
    { title: "申请人", dataIndex: "applicantName", key: "applicantName" },
    {
      title: "指派专家",
      dataIndex: "expertName",
      key: "expertName",
      render: (v: string | null) => v || "-",
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (v: string) => {
        const s = STATUS_MAP[v];
        return s ? <Tag color={s.color}>{s.label}</Tag> : v;
      },
    },
    {
      title: "纠纷类型",
      dataIndex: "disputeType",
      key: "disputeType",
      render: (v: string) => DISPUTE_MAP[v] || v,
    },
    {
      title: "争议金额",
      dataIndex: "amountInDispute",
      key: "amountInDispute",
      render: (v: number | null) => (v ? `¥${v.toLocaleString()}` : "-"),
    },
    {
      title: "更新时间",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (v: string) => new Date(v).toLocaleDateString("zh-CN"),
    },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, record: CaseItem) => (
        <Link href={`/admin/cases/${record.id}`}>
          <Button type="link" icon={<EyeOutlined />} size="small">
            查看
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>案件管理</h2>
      </div>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Select
            allowClear
            placeholder="按状态筛选"
            style={{ width: 160 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={Object.entries(STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label }))}
          />
          <Select
            allowClear
            placeholder="按纠纷类型筛选"
            style={{ width: 160 }}
            value={disputeFilter}
            onChange={setDisputeFilter}
            options={Object.entries(DISPUTE_MAP).map(([k, v]) => ({ value: k, label: v }))}
          />
          <span style={{ color: "#999" }}>共 {filteredCases.length} 条记录</span>
        </Space>
        <Table dataSource={filteredCases} columns={columns} rowKey="id" pagination={{ pageSize: 15 }} />
      </Card>
    </div>
  );
}
