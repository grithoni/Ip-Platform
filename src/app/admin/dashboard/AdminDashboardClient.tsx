"use client";

import { Card, Col, Row, Statistic, Table, Tag } from "antd";
import {
  FileTextOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  AuditOutlined,
  SolutionOutlined,
} from "@ant-design/icons";
import { STATUS_MAP } from "@/lib/constants";

interface DashboardData {
  totalCases: number;
  activeCases: number;
  totalExperts: number;
  totalUsers: number;
  pendingApplications: number;
  activeENE: number;
  pendingResponses: number;
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
      <Row gutter={16} style={{ marginBottom: 16 }}>
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
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="待审核专家申请"
              value={data.pendingApplications}
              prefix={<SolutionOutlined />}
              styles={data.pendingApplications > 0 ? { content: { color: "#fa8c16" } } : {}}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="进行中 ENE 评估"
              value={data.activeENE}
              prefix={<AuditOutlined />}
              styles={data.activeENE > 0 ? { content: { color: "#1890ff" } } : {}}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="待被申请人回复"
              value={data.pendingResponses}
              prefix={<ExclamationCircleOutlined />}
              styles={data.pendingResponses > 0 ? { content: { color: "#fa8c16" } } : {}}
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
