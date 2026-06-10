"use client";

import { Card, Table, Tag, Button, Space, message as antMsg, Tabs } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { markMessageRead } from "@/actions/messages";

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
  isInbox: boolean;
}

export default function MessagesClient({ messages, currentUserId }: { messages: MessageItem[]; currentUserId: string }) {
  const router = useRouter();
  const [markingId, setMarkingId] = useState<string | null>(null);

  const inbox = messages.filter((m) => m.isInbox);
  const sent = messages.filter((m) => !m.isInbox);
  const unreadCount = inbox.filter((m) => !m.readAt).length;

  const handleMarkRead = async (id: string) => {
    setMarkingId(id);
    const result = await markMessageRead(id);
    setMarkingId(null);
    if (result.error) { antMsg.error(result.error); } else { router.refresh(); }
  };

  const columns = [
    { title: "发送人", key: "from", render: (_: unknown, r: MessageItem) => `${r.fromName} (${ROLE_MAP[r.fromRole] || r.fromRole})` },
    { title: "接收人", key: "to", render: (_: unknown, r: MessageItem) => `${r.toName} (${ROLE_MAP[r.toRole] || r.toRole})` },
    { title: "内容", dataIndex: "content", key: "content", ellipsis: true },
    { title: "关联案件", dataIndex: "caseNumber", key: "caseNumber", render: (v: string | null) => v || "-" },
    { title: "时间", dataIndex: "createdAt", key: "createdAt", render: (v: string) => new Date(v).toLocaleString("zh-CN") },
    {
      title: "状态", key: "status",
      render: (_: unknown, r: MessageItem) => {
        if (!r.isInbox) return <Tag color="blue">已发送</Tag>;
        if (r.readAt) return <Tag color="green">已读</Tag>;
        return <Tag color="red">未读</Tag>;
      },
    },
    {
      title: "操作", key: "action",
      render: (_: unknown, r: MessageItem) => {
        if (!r.isInbox || r.readAt) return null;
        return (
          <Button type="link" size="small" icon={<CheckOutlined />} loading={markingId === r.id} onClick={() => handleMarkRead(r.id)}>
            标为已读
          </Button>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>消息中心</h2>
        {unreadCount > 0 && <Tag color="red" style={{ fontSize: 14 }}>{unreadCount} 条未读</Tag>}
      </div>
      <Card>
        <Tabs items={[
          { key: "inbox", label: `收件箱 (${inbox.length})`, children: <Table dataSource={inbox} columns={columns} rowKey="id" pagination={{ pageSize: 15 }} /> },
          { key: "sent", label: `已发送 (${sent.length})`, children: <Table dataSource={sent} columns={columns} rowKey="id" pagination={{ pageSize: 15 }} /> },
        ]} />
      </Card>
    </div>
  );
}
