"use client";

import { Card, Col, Row, Statistic, Table, Tag, Button, Alert } from "antd";
import {
  FileTextOutlined,
  SyncOutlined,
  MessageOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { STATUS_MAP, DISPUTE_MAP, RESPONSE_ACTION_MAP } from "@/lib/constants";

interface DashboardData {
  activeCases: number;
  totalCases: number;
  unreadMessages: number;
  pendingResponses: number;
  recentCases: Array<{
    id: string;
    caseNumber: string;
    patentTitle: string;
    status: string;
    disputeType: string;
    updatedAt: string;
    expertName: string | null;
  }>;
  respondentCases: Array<{
    id: string;
    caseNumber: string;
    patentTitle: string;
    status: string;
    disputeType: string;
    applicantName: string;
    hasResponded: boolean;
    updatedAt: string;
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

  const respondentColumns = [
    { title: "案件编号", dataIndex: "caseNumber", key: "caseNumber" },
    { title: "专利名称", dataIndex: "patentTitle", key: "patentTitle" },
    { title: "申请人", dataIndex: "applicantName", key: "applicantName" },
    {
      title: "案件状态",
      dataIndex: "status",
      key: "status",
      render: (v: string) => {
        const s = STATUS_MAP[v];
        return s ? <Tag color={s.color}>{s.label}</Tag> : v;
      },
    },
    {
      title: "回复状态",
      key: "responseStatus",
      render: (_: unknown, record: DashboardData["respondentCases"][0]) => {
        if (record.hasResponded) {
          return <Tag color="green">已回复</Tag>;
        }
        if (record.status === "RESPONDENT_PENDING") {
          return (
            <Link href={`/cases/${record.id}/response`}>
              <Tag color="orange" style={{ cursor: "pointer" }}>待回复</Tag>
            </Link>
          );
        }
        return <Tag>-</Tag>;
      },
    },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, record: DashboardData["respondentCases"][0]) => (
        <Link href={`/cases/${record.id}`}>
          <Button type="link" size="small">查看详情</Button>
        </Link>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>控制台</h2>

      {/* Pending response alert */}
      {data.pendingResponses > 0 && (
        <Alert
          type="warning"
          message={`您有 ${data.pendingResponses} 起案件等待回复`}
          description="请在截止日期前完成回复，逾期可能影响案件处理。"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: 24 }}
          action={
            <Link href={`/cases/${data.respondentCases.find((c) => c.status === "RESPONDENT_PENDING")?.id || ""}/response`}>
              <Button size="small" type="primary" danger>
                立即回复
              </Button>
            </Link>
          }
        />
      )}

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="进行中的案件"
              value={data.activeCases}
              prefix={<SyncOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总案件数"
              value={data.totalCases}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="未读消息"
              value={data.unreadMessages}
              prefix={<MessageOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待回复案件"
              value={data.pendingResponses}
              prefix={<ExclamationCircleOutlined />}
              styles={data.pendingResponses > 0 ? { content: { color: "#fa8c16" } } : {}}
            />
          </Card>
        </Col>
      </Row>

      {/* Respondent cases */}
      {data.respondentCases.length > 0 && (
        <Card title="被申请人案件" style={{ marginBottom: 24 }}>
          <Table
            dataSource={data.respondentCases}
            columns={respondentColumns}
            rowKey="id"
            pagination={false}
          />
        </Card>
      )}

      <Card title="最近申请案件">
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
