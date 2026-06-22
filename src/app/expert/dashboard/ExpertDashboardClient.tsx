"use client";

import { Card, Col, Row, Statistic, Table, Tag } from "antd";
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SolutionOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { STATUS_MAP } from "@/lib/constants";

const ASSIGNMENT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "待接受", color: "orange" },
  ACCEPTED: { label: "已接受", color: "green" },
  DECLINED: { label: "已拒绝", color: "red" },
  COMPLETED: { label: "已完成", color: "blue" },
};

interface DashboardData {
  totalAssignments: number;
  activeAssignments: number;
  pendingAssignments: number;
  completedAssignments: number;
  recentAssignments: Array<{
    id: string;
    caseId: string;
    caseNumber: string;
    patentTitle: string;
    applicantName: string;
    status: string;
    caseStatus: string;
  }>;
}

export default function ExpertDashboardClient({ data }: { data: DashboardData }) {
  const columns = [
    { title: "案件编号", dataIndex: "caseNumber", key: "caseNumber" },
    { title: "专利名称", dataIndex: "patentTitle", key: "patentTitle" },
    { title: "申请人", dataIndex: "applicantName", key: "applicantName" },
    {
      title: "指派状态",
      dataIndex: "status",
      key: "status",
      render: (v: string) => {
        const s = ASSIGNMENT_STATUS_MAP[v];
        return s ? <Tag color={s.color}>{s.label}</Tag> : v;
      },
    },
    {
      title: "案件状态",
      dataIndex: "caseStatus",
      key: "caseStatus",
      render: (v: string) => {
        const s = STATUS_MAP[v];
        return s ? <Tag color={s.color}>{s.label}</Tag> : v;
      },
    },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, r: { caseId: string }) => (
        <Link href={`/expert/cases/${r.caseId}`}>查看详情</Link>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>专家工作台</h2>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总案件数" value={data.totalAssignments} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="进行中" value={data.activeAssignments} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="待处理指派" value={data.pendingAssignments} prefix={<SolutionOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已完成" value={data.completedAssignments} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card title="最近指派的案件">
        <Table
          dataSource={data.recentAssignments}
          columns={columns}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );
}
