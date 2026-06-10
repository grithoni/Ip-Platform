"use client";

import { Card, Form, Input, Button, message } from "antd";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/actions/profile";

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  role: string;
}

export default function ProfileClient({ user }: { user: UserData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("phone", values.phone || "");
      formData.append("company", values.company || "");
      const result = await updateProfile(formData);
      setLoading(false);
      if (result.error) { message.error(result.error); } else { message.success("资料更新成功"); router.refresh(); }
    } catch {
      // validation error
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>个人设置</h2>
      <Card style={{ maxWidth: 600 }}>
        <Form form={form} layout="vertical" initialValues={{ name: user.name, phone: user.phone || "", company: user.company || "" }}>
          <Form.Item label="邮箱">
            <Input value={user.email} disabled />
          </Form.Item>
          <Form.Item label="角色">
            <Input value={user.role === "ADMIN" ? "管理员" : user.role === "EXPERT" ? "专家" : "当事人"} disabled />
          </Form.Item>
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: "请输入姓名" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input />
          </Form.Item>
          <Form.Item name="company" label="公司">
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" loading={loading} onClick={handleSubmit}>保存</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
