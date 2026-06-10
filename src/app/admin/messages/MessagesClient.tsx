"use client";

import { Card, Table, Tag } from "antd";

const ROLE_MAP: Record<string, string> = {
  ADMIN: "管理员",
  EXPERT: "专家",
  PARTY: "当事人",
};

interface MessageItem {
  id: string;
  fromName: string;
  fromRole: string;
  toName: string;
  toRole: string;
  content: string;
  caseNumber: string | null;
  createdAt: string;
  readAt: string | null;
}

export default function MessagesClient({ messages }: { messages: MessageItem[] }) {
  const columns = [
    { title: "发送人", key: "from", render: (_: unknown, r: MessageItem) => `${r.fromName} (${ROLE_MAP[r.fromRole] || r.fromRole})` },
    { title: "接收人", key: "to", render: (_: unknown, r: MessageItem) => `${r.toName} (${ROLE_MAP[r.toRole] || r.toRole})` },
    { title: "内容", dataIndex: "content", key: "content", ellipsis: true },
    { title: "关联案件", dataIndex: "caseNumber", key: "caseNumber", render: (v: string | null) => v || "-" },
    { title: "时间", dataIndex: "createdAt", key: "createdAt", render: (v: string) => new Date(v).toLocaleString("zh-CN") },
    {
      title: "状态", key: "read",
      render: (_: unknown, r: MessageItem) => r.readAt ? <Tag color="green">已读</Tag> : <Tag color="red">未读</Tag>,
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>消息监控</h2>
      <Card>
        <Table dataSource={messages} columns={columns} rowKey="id" pagination={{ pageSize: 20 }} />
      </Card>
    </div>
  );
}
