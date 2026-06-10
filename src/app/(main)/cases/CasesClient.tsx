"use client";

import { Card, Table, Tag, Button, Space, Tabs } from "antd";
import {
  PlusOutlined,
  EyeOutlined,
} from "@ant-design/icons";
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

export default function CasesClient({ cases }: { cases: CaseItem[] }) {
  const [activeTab, setActiveTab] = useState("all");

  const filteredCases = activeTab === "all"
    ? cases
    : cases.filter((c) => {
        if (activeTab === "active") return !["DRAFT", "COMPLETED", "CLOSED"].includes(c.status);
        if (activeTab === "draft") return c.status === "DRAFT";
        if (activeTab === "completed") return ["COMPLETED", "CLOSED"].includes(c.status);
        return true;
      });

  const columns = [
    { title: "案件编号", dataIndex: "caseNumber", key: "caseNumber" },
    { title: "专利名称", dataIndex: "patentTitle", key: "patentTitle", ellipsis: true },
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
      render: (v: number | null) => v ? `¥${v.toLocaleString()}` : "-",
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
      title: "指派专家",
      dataIndex: "expertName",
      key: "expertName",
      render: (v: string | null) => v || "-",
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
        <Link href={`/cases/${record.id}`}>
          <Button type="link" icon={<EyeOutlined />} size="small">查看</Button>
        </Link>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>我的案件</h2>
        <Link href="/cases/new">
          <Button type="primary" icon={<PlusOutlined />}>新建案件</Button>
        </Link>
      </div>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: "all", label: `全部 (${cases.length})` },
            { key: "active", label: `进行中 (${cases.filter((c) => !["DRAFT", "COMPLETED", "CLOSED"].includes(c.status)).length})` },
            { key: "draft", label: `草稿 (${cases.filter((c) => c.status === "DRAFT").length})` },
            { key: "completed", label: `已完成 (${cases.filter((c) => ["COMPLETED", "CLOSED"].includes(c.status)).length})` },
          ]}
        />
        <Table
          dataSource={filteredCases}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
