"use client";

import { Layout, Menu, Button, Space, Avatar, Dropdown } from "antd";
import {
  HomeOutlined,
  FileTextOutlined,
  DashboardOutlined,
  MessageOutlined,
  UserOutlined,
  LogoutOutlined,
  LoginOutlined,
  CompassOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const { Header, Content, Footer } = Layout;

interface UserInfo {
  userId: string;
  email: string;
  role: string;
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  };

  const menuItems = [
    {
      key: "home",
      icon: <HomeOutlined />,
      label: <Link href="/">首页</Link>,
    },
    {
      key: "assessment",
      icon: <CompassOutlined />,
      label: <Link href="/assessment">评估引导</Link>,
    },
    {
      key: "cases",
      icon: <FileTextOutlined />,
      label: <Link href="/cases">我的案件</Link>,
    },
    ...(user
      ? [
          {
            key: "dashboard",
            icon: <DashboardOutlined />,
            label: <Link href="/dashboard">控制台</Link>,
          },
          {
            key: "messages",
            icon: <MessageOutlined />,
            label: <Link href="/messages">消息</Link>,
          },
        ]
      : []),
  ];

  const userMenuItems = [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: "控制台",
      onClick: () => router.push("/dashboard"),
    },
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "个人设置",
      onClick: () => router.push("/profile"),
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
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#001529",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              color: "white",
              fontSize: 18,
              fontWeight: "bold",
              marginRight: 40,
              cursor: "pointer",
            }}
            onClick={() => router.push("/")}
          >
            专利纠纷中立评估平台
          </div>
          <Menu
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={["home"]}
            items={menuItems}
            style={{ flex: 1, minWidth: 0, background: "transparent" }}
          />
        </div>
        <Space>
          {user ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: "pointer", color: "white" }}>
                <Avatar icon={<UserOutlined />} />
                <span>{user.email}</span>
              </Space>
            </Dropdown>
          ) : (
            <Space>
              <Button
                type="text"
                style={{ color: "white" }}
                icon={<LoginOutlined />}
                onClick={() => router.push("/login")}
              >
                登录
              </Button>
              <Button
                type="primary"
                onClick={() => router.push("/register")}
              >
                注册
              </Button>
            </Space>
          )}
        </Space>
      </Header>
      <Content style={{ padding: "24px 48px", flex: 1 }}>{children}</Content>
      <Footer style={{ textAlign: "center" }}>
        专利纠纷中立评估平台 &copy; {new Date().getFullYear()}
      </Footer>
    </Layout>
  );
}
