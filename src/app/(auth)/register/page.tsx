"use client";

import { Form, Input, Button, Card, message, Radio, Space } from "antd";
import { UserOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { register } from "@/actions/auth";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: {
    email: string;
    password: string;
    name: string;
    role: string;
  }) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("email", values.email);
      formData.append("password", values.password);
      formData.append("name", values.name);
      formData.append("role", values.role);

      const result = await register(formData);

      if (result.error) {
        message.error(result.error);
      } else {
        message.success("注册成功！");
        if (result.role === "EXPERT") {
          router.push("/expert");
        } else {
          router.push("/dashboard");
        }
      }
    } catch {
      message.error("注册失败，请稍后重试");
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
      <Card style={{ width: 420 }} title="注册账号">
        <Form onFinish={onFinish} layout="vertical">
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: "请输入姓名" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: "请输入邮箱" },
              { type: "email", message: "请输入有效的邮箱" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: "请输入密码" },
              { min: 6, message: "密码至少6个字符" },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
          </Form.Item>

          <Form.Item
            name="role"
            label="账号类型"
            rules={[{ required: true, message: "请选择账号类型" }]}
          >
            <Radio.Group>
              <Space direction="vertical">
                <Radio value="PARTY">当事人 - 提交专利纠纷评估申请</Radio>
                <Radio value="EXPERT">专家 - 提供专业裁决服务</Radio>
              </Space>
            </Radio.Group>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              注册
            </Button>
          </Form.Item>

          <div style={{ textAlign: "center" }}>
            已有账号？{" "}
            <Link href="/login" style={{ color: "#1677ff" }}>
              立即登录
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}
