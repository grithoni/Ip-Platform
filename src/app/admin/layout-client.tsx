"use client";

import { Layout, Menu, Space, Avatar, Dropdown } from "antd";
import {
  DashboardOutlined,
  FileTextOutlined,
  TeamOutlined,
  UserOutlined,
  MessageOutlined,
  AuditOutlined,
  LogoutOutlined,
  ExperimentOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const { Header, Sider, Content } = Layout;

interface UserInfo {
  userId: string;
  email: string;
  role: string;
}

export default function AdminLayoutClient({
  children,
  user,
}: {
  children: React.ReactNode;
  user: UserInfo;
}) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const menuItems = [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: <Link href="/admin">仪表盘</Link>,
    },
    {
      key: "cases",
      icon: <FileTextOutlined />,
      label: <Link href="/admin/cases">案件管理</Link>,
    },
    {
      key: "experts",
      icon: <TeamOutlined />,
      label: <Link href="/admin/experts">专家库</Link>,
    },
    {
      key: "users",
      icon: <UserOutlined />,
      label: <Link href="/admin/users">用户管理</Link>,
    },
    {
      key: "messages",
      icon: <MessageOutlined />,
      label: <Link href="/admin/messages">消息监控</Link>,
    },
    {
      key: "audit",
      icon: <AuditOutlined />,
      label: <Link href="/admin/audit">审计日志</Link>,
    },
    {
      key: "ene",
      icon: <ExperimentOutlined />,
      label: <Link href="/admin/ene">ENE管理</Link>,
    },
  ];

  const userMenuItems = [
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "退出登录",
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
      >
        <div
          style={{
            height: 32,
            margin: 16,
            background: "rgba(255,255,255,0.2)",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
            fontSize: collapsed ? 12 : 14,
          }}
        >
          {collapsed ? "管理" : "评估平台管理"}
        </div>
        <Menu
          theme="dark"
          defaultSelectedKeys={["dashboard"]}
          mode="inline"
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: "#fff",
            padding: "0 24px",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,.1)",
          }}
        >
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: "pointer" }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user.email}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: "#fff" }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
