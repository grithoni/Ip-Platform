"use client";

import { Card, Form, Input, Button, Select, message, Alert, Result } from "antd";
import { CheckCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitExpertApplication } from "@/actions/expert-admin";

const { TextArea } = Input;

const TECH_OPTIONS = [
  "通信", "半导体", "集成电路", "软件", "互联网", "人工智能",
  "机械", "化学", "医药", "生物", "材料", "光学", "电力",
  "汽车", "航空航天", "物联网", "区块链", "MEMS", "信号处理",
];

export default function ApplyExpertClient({
  userName,
  userEmail,
  existingApplication,
}: {
  userName: string;
  userEmail: string;
  existingApplication: {
    status: string;
    createdAt: string;
    reviewNote: string | null;
  } | null;
}) {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", values.name as string);
      formData.append("technicalFields", JSON.stringify(values.technicalFields));
      if (values.qualifications) formData.append("qualifications", values.qualifications as string);
      if (values.experienceYears) formData.append("experienceYears", String(values.experienceYears));
      if (values.bio) formData.append("bio", values.bio as string);
      if (values.hourlyRateExpect) formData.append("hourlyRateExpect", String(values.hourlyRateExpect));

      const result = await submitExpertApplication(formData);
      if (result.error) {
        message.error(result.error);
      } else {
        message.success("申请已提交，请等待审核");
        router.refresh();
      }
    } catch {
      message.error("提交失败");
    } finally {
      setLoading(false);
    }
  };

  // Already applied
  if (existingApplication) {
    const isApproved = existingApplication.status === "APPROVED";
    const isPending = existingApplication.status === "PENDING";

    return (
      <div>
        <h2 style={{ marginBottom: 24 }}>申请成为专家</h2>
        <Result
          status={isApproved ? "success" : isPending ? "info" : "error"}
          icon={isPending ? <ClockCircleOutlined /> : undefined}
          title={
            isApproved
              ? "申请已通过"
              : isPending
                ? "申请审核中"
                : "申请未通过"
          }
          subTitle={
            isApproved
              ? "恭喜！您的专家申请已通过审核，请重新登录以使用专家功能。"
              : isPending
                ? `您于 ${new Date(existingApplication.createdAt).toLocaleDateString("zh-CN")} 提交的申请正在审核中，请耐心等待。`
                : `很抱歉，您的申请未通过。${existingApplication.reviewNote ? `原因：${existingApplication.reviewNote}` : ""}`
          }
          extra={
            <Button onClick={() => router.push("/profile")}>返回个人中心</Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: 8 }}>申请成为专家</h2>
      <p style={{ color: "#666", marginBottom: 24 }}>
        提交您的专家资质申请，管理员审核通过后您将获得专家身份，可以接受案件指派。
      </p>

      <Card style={{ maxWidth: 700 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ name: userName }}
        >
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: "请输入姓名" }]}>
            <Input />
          </Form.Item>

          <Form.Item
            name="technicalFields"
            label="技术领域"
            rules={[{ required: true, message: "请至少选择一个技术领域" }]}
          >
            <Select mode="multiple" placeholder="选择您的技术专长领域">
              {TECH_OPTIONS.map((t) => (
                <Select.Option key={t} value={t}>
                  {t}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="qualifications" label="专业资质">
            <TextArea rows={2} placeholder="例如：专利代理人资格、律师执业证、博士学位等" />
          </Form.Item>

          <Form.Item name="experienceYears" label="从业年限">
            <Input type="number" placeholder="年" />
          </Form.Item>

          <Form.Item name="bio" label="个人简介">
            <TextArea rows={4} placeholder="简要介绍您的专业背景和相关经验" />
          </Form.Item>

          <Form.Item name="hourlyRateExpect" label="期望时薪（元）">
            <Input type="number" placeholder="选填" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              提交申请
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
