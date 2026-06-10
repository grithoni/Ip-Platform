"use client";

import { Layout, Menu, Space, Avatar, Dropdown } from "antd";
import {
  DashboardOutlined,
  FileTextOutlined,
  SolutionOutlined,
  EditOutlined,
  UserOutlined,
  LogoutOutlined,
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

export default function ExpertLayoutClient({
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
      label: <Link href="/expert">工作台</Link>,
    },
    {
      key: "cases",
      icon: <FileTextOutlined />,
      label: <Link href="/expert/cases">我的案件</Link>,
    },
    {
      key: "assignments",
      icon: <SolutionOutlined />,
      label: <Link href="/expert/assignments">指派任务</Link>,
    },
    {
      key: "profile",
      icon: <UserOutlined />,
      label: <Link href="/expert/profile">个人资料</Link>,
    },
  ];

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "个人资料",
      onClick: () => router.push("/expert/profile"),
    },
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
          {collapsed ? "专家" : "专家工作台"}
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
