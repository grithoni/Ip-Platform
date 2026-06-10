"use client";

import { Card, Table, Tag, Space, Select } from "antd";
import { useState } from "react";

const ROLE_MAP: Record<string, { label: string; color: string }> = {
  PARTY: { label: "当事人", color: "blue" },
  EXPERT: { label: "专家", color: "green" },
  ADMIN: { label: "管理员", color: "red" },
};

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string | null;
  phone: string | null;
  createdAt: string;
}

export default function UsersClient({ users }: { users: UserItem[] }) {
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);

  const filtered = roleFilter ? users.filter((u) => u.role === roleFilter) : users;

  const columns = [
    { title: "姓名", dataIndex: "name", key: "name" },
    { title: "邮箱", dataIndex: "email", key: "email" },
    {
      title: "角色", dataIndex: "role", key: "role",
      render: (v: string) => {
        const r = ROLE_MAP[v];
        return r ? <Tag color={r.color}>{r.label}</Tag> : v;
      },
    },
    { title: "公司", dataIndex: "company", key: "company", render: (v: string | null) => v || "-" },
    { title: "手机号", dataIndex: "phone", key: "phone", render: (v: string | null) => v || "-" },
    {
      title: "注册时间", dataIndex: "createdAt", key: "createdAt",
      render: (v: string) => new Date(v).toLocaleDateString("zh-CN"),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>用户管理</h2>
      </div>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Select allowClear placeholder="按角色筛选" style={{ width: 140 }} value={roleFilter} onChange={setRoleFilter}
            options={Object.entries(ROLE_MAP).map(([k, v]) => ({ value: k, label: v.label }))}
          />
          <span style={{ color: "#999" }}>共 {filtered.length} 位用户</span>
        </Space>
        <Table dataSource={filtered} columns={columns} rowKey="id" pagination={{ pageSize: 20 }} />
      </Card>
    </div>
  );
}
