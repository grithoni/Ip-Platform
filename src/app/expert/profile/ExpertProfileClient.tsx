"use client";

import { Card, Form, Input, Select, Button, message, InputNumber } from "antd";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateExpertProfile } from "@/actions/experts";

const { TextArea } = Input;

interface ExpertProfileData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  technicalFields: string;
  qualifications: string | null;
  availability: string;
  hourlyRate: number | null;
  bio: string | null;
}

export default function ExpertProfileClient({ profile }: { profile: ExpertProfileData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("technicalFields", values.technicalFields);
      formData.append("qualifications", values.qualifications || "");
      formData.append("availability", values.availability);
      formData.append("hourlyRate", values.hourlyRate?.toString() || "");
      formData.append("bio", values.bio || "");
      const result = await updateExpertProfile(formData);
      setLoading(false);
      if (result.error) { message.error(result.error); } else { message.success("资料更新成功"); router.refresh(); }
    } catch {
      // validation error
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>专家资料</h2>
      <Card style={{ maxWidth: 600 }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            name: profile.name,
            technicalFields: profile.technicalFields,
            qualifications: profile.qualifications || "",
            availability: profile.availability,
            hourlyRate: profile.hourlyRate,
            bio: profile.bio || "",
          }}
        >
          <Form.Item label="邮箱">
            <Input value={profile.email} disabled />
          </Form.Item>
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: "请输入姓名" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="technicalFields" label="技术领域 (JSON数组)" rules={[{ required: true, message: "请输入技术领域" }]}>
            <Input placeholder='["电子工程", "通信技术"]' />
          </Form.Item>
          <Form.Item name="qualifications" label="资质证书">
            <TextArea rows={3} placeholder="请输入资质证书信息" />
          </Form.Item>
          <Form.Item name="availability" label="可用状态">
            <Select options={[
              { value: "AVAILABLE", label: "可用" },
              { value: "BUSY", label: "忙碌" },
              { value: "UNAVAILABLE", label: "不可用" },
            ]} />
          </Form.Item>
          <Form.Item name="hourlyRate" label="时薪 (元/小时)">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="bio" label="个人简介">
            <TextArea rows={4} placeholder="请输入个人简介" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" loading={loading} onClick={handleSubmit}>保存</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
