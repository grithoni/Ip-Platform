"use client";

import { Form, Input, Button, Card, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { login } from "@/actions/auth";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("email", values.email);
      formData.append("password", values.password);

      const result = await login(formData);

      if (result?.error) {
        message.error(result.error);
      }
    } catch {
      // redirect() throws — ignore it
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #1a365d 0%, #2563eb 100%)",
      }}
    >
      <Card style={{ width: 420 }} title="专利纠纷中立评估平台 — 登录">
        <Form onFinish={onFinish} layout="vertical">
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: "请输入邮箱" },
              { type: "email", message: "请输入有效的邮箱" },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>

          <div style={{ textAlign: "center" }}>
            还没有账号？{" "}
            <Link href="/register" style={{ color: "#1677ff" }}>
              立即注册
            </Link>
          </div>
        </Form>

        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: "#f5f5f5",
            borderRadius: 8,
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: 8 }}>测试账号：</div>
          <div>管理员：admin@ip.com / admin123</div>
          <div>当事人：applicant@ip.com / test123</div>
          <div>专家：expert@ip.com / test123</div>
        </div>
      </Card>
    </div>
  );
}
