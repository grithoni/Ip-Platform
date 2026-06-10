"use client";

import { Card, Col, Row, Statistic, Table, Tag } from "antd";
import {
  FileTextOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
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

interface DashboardData {
  totalCases: number;
  activeCases: number;
  totalExperts: number;
  totalUsers: number;
  recentCases: Array<{
    id: string;
    caseNumber: string;
    patentTitle: string;
    status: string;
    applicantName: string;
    expertName: string | null;
    updatedAt: string;
  }>;
}

export default function AdminDashboardClient({ data }: { data: DashboardData }) {
  const columns = [
    { title: "案件编号", dataIndex: "caseNumber", key: "caseNumber" },
    { title: "专利名称", dataIndex: "patentTitle", key: "patentTitle" },
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
      title: "更新时间",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (v: string) => new Date(v).toLocaleDateString("zh-CN"),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>管理仪表盘</h2>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总案件数" value={data.totalCases} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="进行中案件" value={data.activeCases} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="专家数量" value={data.totalExperts} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="用户数量" value={data.totalUsers} prefix={<CheckCircleOutlined />} />
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
