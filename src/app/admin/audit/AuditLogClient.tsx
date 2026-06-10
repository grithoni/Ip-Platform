"use client";

import { Card, Table, Tag, Select, Space } from "antd";
import { useState } from "react";

const ROLE_MAP: Record<string, string> = {
  ADMIN: "管理员",
  EXPERT: "专家",
  PARTY: "当事人",
};

interface AuditLogItem {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string | null;
  userName: string;
  userRole: string;
  createdAt: string;
}

export default function AuditLogClient({ logs }: { logs: AuditLogItem[] }) {
  const [targetFilter, setTargetFilter] = useState<string | undefined>(undefined);

  const filtered = targetFilter ? logs.filter((l) => l.targetType === targetFilter) : logs;
  const targetTypes = [...new Set(logs.map((l) => l.targetType))];

  const columns = [
    { title: "操作", dataIndex: "action", key: "action" },
    {
      title: "目标类型", dataIndex: "targetType", key: "targetType",
      render: (v: string) => {
        const colorMap: Record<string, string> = { CASE: "blue", USER: "green", EXPERT: "cyan", ASSIGNMENT: "orange", DETERMINATION: "purple", DOCUMENT: "geekblue" };
        return <Tag color={colorMap[v] || "default"}>{v}</Tag>;
      },
    },
    { title: "目标ID", dataIndex: "targetId", key: "targetId", ellipsis: true },
    { title: "详情", dataIndex: "details", key: "details", ellipsis: true },
    {
      title: "操作人", key: "user",
      render: (_: unknown, r: AuditLogItem) => `${r.userName} (${ROLE_MAP[r.userRole] || r.userRole})`,
    },
    {
      title: "时间", dataIndex: "createdAt", key: "createdAt",
      render: (v: string) => new Date(v).toLocaleString("zh-CN"),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>审计日志</h2>
      </div>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Select allowClear placeholder="按目标类型筛选" style={{ width: 160 }} value={targetFilter} onChange={setTargetFilter}
            options={targetTypes.map((t) => ({ value: t, label: t }))}
          />
          <span style={{ color: "#999" }}>共 {filtered.length} 条记录</span>
        </Space>
        <Table dataSource={filtered} columns={columns} rowKey="id" pagination={{ pageSize: 20 }} />
      </Card>
    </div>
  );
}
