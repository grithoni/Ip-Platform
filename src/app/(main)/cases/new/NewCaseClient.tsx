"use client";

import { Card, Form, Input, Select, Button, Steps, message, Upload, Space, Descriptions, Tag, Alert } from "antd";
import { InboxOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createCase } from "@/actions/cases";
import { createCase, submitCase } from "@/actions/cases";
import { uploadDocument } from "@/actions/documents";
import { getAssessment } from "@/actions/adr-assessment";
import { DISPUTE_OPTIONS, DOC_CATEGORY_OPTIONS } from "@/lib/constants";

const { TextArea } = Input;
const { Dragger } = Upload;

export default function NewCaseClient({
  assessmentId,
  initialDisputeType,
}: {
  assessmentId?: string;
  initialDisputeType?: string;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [adrAssessmentId, setAdrAssessmentId] = useState<string | null>(assessmentId || null);
  const [caseInfo, setCaseInfo] = useState<{
    patentNumber: string;
    patentTitle: string;
    disputeType: string;
    amountInDispute: string;
    description: string;
    respondentEmail: string;
  } | null>(null);
  const [form] = Form.useForm();

  // Pre-fill from ADR assessment
  useEffect(() => {
    if (assessmentId) {
      getAssessment(assessmentId).then((assessment) => {
        if (assessment && !("error" in assessment)) {
          const fieldsToSet: Record<string, string> = {};
          if (assessment.disputeType) fieldsToSet.disputeType = assessment.disputeType;
          if (assessment.patentNumber) fieldsToSet.patentNumber = assessment.patentNumber;
          form.setFieldsValue(fieldsToSet);
        }
      });
    } else if (initialDisputeType) {
      form.setFieldsValue({ disputeType: initialDisputeType });
    }
  }, [assessmentId, initialDisputeType, form]);

  const handleCreateCase = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value) formData.append(key, value as string);
      });
      if (adrAssessmentId) {
        formData.append("adrAssessmentId", adrAssessmentId);
      }

      const result = await createCase(formData);
      if (result.error) {
        message.error(result.error);
        return;
      }

      setCaseId(result.caseId!);
      setCaseInfo(values);
      setCurrent(1);
    } catch {
      // validation error
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File, category: string) => {
    if (!caseId) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);

    const result = await uploadDocument(caseId, formData);
    if (result.error) {
      message.error(result.error);
    } else {
      message.success(`${file.name} 上传成功`);
    }
  };

  const handleSubmit = async () => {
    if (!caseId) return;
    setLoading(true);
    try {
      const result = await submitCase(caseId);
      if (result.error) {
        message.error(result.error);
        return;
      }
      setCurrent(2);
    } catch {
      message.error("提交失败");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: "基本信息",
      content: (
        <Form form={form} layout="vertical" style={{ maxWidth: 600 }}>
          <Form.Item name="patentNumber" label="专利号" rules={[{ required: true, message: "请输入专利号" }]}>
            <Input placeholder="例：ZL202310123456.7" />
          </Form.Item>
          <Form.Item name="patentTitle" label="专利名称" rules={[{ required: true, message: "请输入专利名称" }]}>
            <Input placeholder="例：一种5G信号处理方法及装置" />
          </Form.Item>
          <Form.Item name="disputeType" label="纠纷类型" rules={[{ required: true, message: "请选择纠纷类型" }]}>
            <Select options={DISPUTE_OPTIONS} placeholder="请选择纠纷类型" />
          </Form.Item>
          <Form.Item name="amountInDispute" label="争议金额（元）">
            <Input type="number" placeholder="选填" />
          </Form.Item>
          <Form.Item name="description" label="案件描述">
            <TextArea rows={4} placeholder="请简要描述纠纷情况" />
          </Form.Item>
          <Form.Item name="respondentEmail" label="被申请人邮箱">
            <Input placeholder="选填，如已知对方邮箱" />
          </Form.Item>
        </Form>
      ),
    },
    {
      title: "上传材料",
      content: (
        <div style={{ maxWidth: 600 }}>
          <p style={{ marginBottom: 16, color: "#666" }}>请上传与案件相关的材料文件（支持 PDF、Word、图片，单文件最大 50MB）</p>
          <Upload.Dragger
            multiple
            beforeUpload={(file) => {
              handleUpload(file, "OTHER");
              return false;
            }}
            showUploadList={true}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          >
            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">支持 PDF、DOC、DOCX、JPG、PNG 格式</p>
          </Upload.Dragger>
        </div>
      ),
    },
    {
      title: "确认提交",
      content: (
        <div style={{ maxWidth: 600 }}>
          <Descriptions bordered column={1}>
            <Descriptions.Item label="案件编号">{caseId ? "已生成" : "-"}</Descriptions.Item>
            <Descriptions.Item label="专利号">{caseInfo?.patentNumber}</Descriptions.Item>
            <Descriptions.Item label="专利名称">{caseInfo?.patentTitle}</Descriptions.Item>
            <Descriptions.Item label="纠纷类型">{DISPUTE_OPTIONS.find((o) => o.value === caseInfo?.disputeType)?.label}</Descriptions.Item>
            <Descriptions.Item label="争议金额">{caseInfo?.amountInDispute ? `¥${Number(caseInfo.amountInDispute).toLocaleString()}` : "未填写"}</Descriptions.Item>
            <Descriptions.Item label="案件描述">{caseInfo?.description || "未填写"}</Descriptions.Item>
          </Descriptions>
          <div style={{ marginTop: 24, padding: 16, background: "#f6ffed", border: "1px solid #b7eb8f", borderRadius: 6 }}>
            <p style={{ margin: 0, color: "#389e0d" }}>案件创建成功！材料可在案件详情页继续上传。提交后将进入审核流程。</p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push("/cases")}>返回</Button>
        <h2 style={{ margin: 0 }}>新建案件</h2>
      </div>

      <Card>
        {adrAssessmentId && (
          <Alert
            type="info"
            message="已从评估引导预填信息"
            description="部分字段已根据您的评估结果自动填充，请核实并补充完整。"
            showIcon
            closable
            style={{ marginBottom: 24 }}
          />
        )}
        <Steps current={current} items={steps.map((s) => ({ title: s.title }))} style={{ marginBottom: 32 }} />
        <div style={{ minHeight: 300 }}>{steps[current].content}</div>
        <div style={{ marginTop: 24, textAlign: "right" }}>
          {current > 0 && current < 2 && (
            <Button style={{ marginRight: 8 }} onClick={() => setCurrent(current - 1)}>上一步</Button>
          )}
          {current === 0 && (
            <Button type="primary" loading={loading} onClick={handleCreateCase}>创建案件</Button>
          )}
          {current === 1 && (
            <Button type="primary" onClick={handleSubmit}>下一步</Button>
          )}
          {current === 2 && (
            <Space>
              <Button onClick={() => router.push(`/cases/${caseId}`)}>查看案件详情</Button>
              <Button type="primary" onClick={() => router.push("/cases")}>返回案件列表</Button>
            </Space>
          )}
        </div>
      </Card>
    </div>
  );
}
