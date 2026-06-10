"use client";

import { Card, Col, Row, Statistic, Table, Tag } from "antd";
import {
  FileTextOutlined,
  SyncOutlined,
  MessageOutlined,
} from "@ant-design/icons";

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

interface DashboardData {
  activeCases: number;
  totalCases: number;
  unreadMessages: number;
  recentCases: Array<{
    id: string;
    caseNumber: string;
    patentTitle: string;
    status: string;
    disputeType: string;
    updatedAt: string;
    expertName: string | null;
  }>;
}

export default function DashboardClient({ data }: { data: DashboardData }) {
  const columns = [
    { title: "案件编号", dataIndex: "caseNumber", key: "caseNumber" },
    { title: "专利名称", dataIndex: "patentTitle", key: "patentTitle" },
    {
      title: "纠纷类型",
      dataIndex: "disputeType",
      key: "disputeType",
      render: (v: string) => DISPUTE_MAP[v] || v,
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
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>控制台</h2>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="进行中的案件"
              value={data.activeCases}
              prefix={<SyncOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="总案件数"
              value={data.totalCases}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="未读消息"
              value={data.unreadMessages}
              prefix={<MessageOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="最近案件">
        <Table
          dataSource={data.recentCases}
          columns={columns}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );
}
