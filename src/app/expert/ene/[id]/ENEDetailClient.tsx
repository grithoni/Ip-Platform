"use client";

import { Card, Descriptions, Tag, Button, Input, message, Alert, Space, Divider } from "antd";
import { ArrowLeftOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { agreeToENE, issuePreliminaryOpinion, issueENEOpinion } from "@/actions/ene";
import { ENE_SCOPE_MAP, ENE_BINDING_MAP, ENE_STATUS_MAP } from "@/lib/constants";

const { TextArea } = Input;

interface ENEDetail {
  id: string;
  caseId: string;
  caseNumber: string;
  patentTitle: string;
  expertId: string;
  expertName: string;
  expertUserId: string;
  scope: string;
  bindingType: string;
  applicantAgreed: boolean;
  respondentAgreed: boolean;
  bothPartiesAgreed: boolean;
  content: string | null;
  preliminaryOpinion: string | null;
  status: string;
  issuedAt: string | null;
  createdAt: string;
  applicantName: string;
  respondentName: string | null;
}

export default function ENEDetailClient({
  data,
  userRole,
}: {
  data: ENEDetail;
  userRole: string;
}) {
  const router = useRouter();
  const [agreeLoading, setAgreeLoading] = useState(false);
  const [opinionText, setOpinionText] = useState("");
  const [preliminaryText, setPreliminaryText] = useState("");
  const [opinionLoading, setOpinionLoading] = useState(false);
  const [preliminaryLoading, setPreliminaryLoading] = useState(false);

  const statusInfo = ENE_STATUS_MAP[data.status];

  const handleAgree = async () => {
    setAgreeLoading(true);
    try {
      const result = await agreeToENE(data.id);
      if (result.error) message.error(result.error);
      else {
        message.success(result.bothAgreed ? "双方已同意，评估已启动" : "已确认同意参与");
        router.refresh();
      }
    } catch {
      message.error("操作失败");
    } finally {
      setAgreeLoading(false);
    }
  };

  const handlePreliminary = async () => {
    if (!preliminaryText.trim()) return;
    setPreliminaryLoading(true);
    try {
      const result = await issuePreliminaryOpinion(data.id, preliminaryText);
      if (result.error) message.error(result.error);
      else {
        message.success("初步评估意见已出具");
        router.refresh();
      }
    } catch {
      message.error("操作失败");
    } finally {
      setPreliminaryLoading(false);
    }
  };

  const handleFinalOpinion = async () => {
    if (!opinionText.trim()) return;
    setOpinionLoading(true);
    try {
      const result = await issueENEOpinion(data.id, opinionText);
      if (result.error) message.error(result.error);
      else {
        message.success("最终评估意见已出具");
        router.refresh();
      }
    } catch {
      message.error("操作失败");
    } finally {
      setOpinionLoading(false);
    }
  };

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => router.back()}
        style={{ marginBottom: 16 }}
      >
        返回
      </Button>

      <Card title={`ENE 评估 - ${data.caseNumber}`} style={{ marginBottom: 24 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="案件编号">{data.caseNumber}</Descriptions.Item>
          <Descriptions.Item label="专利名称">{data.patentTitle}</Descriptions.Item>
          <Descriptions.Item label="评估专家">{data.expertName}</Descriptions.Item>
          <Descriptions.Item label="评估范围">{ENE_SCOPE_MAP[data.scope] || data.scope}</Descriptions.Item>
          <Descriptions.Item label="约束类型">
            <Tag color={data.bindingType === "BINDING" ? "red" : "blue"}>
              {ENE_BINDING_MAP[data.bindingType] || data.bindingType}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusInfo?.color}>{statusInfo?.label || data.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="申请方同意">
            <Tag color={data.applicantAgreed ? "green" : "default"}>
              {data.applicantAgreed ? `已同意 (${data.applicantName})` : `未同意 (${data.applicantName})`}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="被申请方同意">
            <Tag color={data.respondentAgreed ? "green" : "default"}>
              {data.respondentAgreed ? `已同意 (${data.respondentName})` : `未同意 (${data.respondentName || "未指定"})`}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Party agreement action */}
      {userRole === "PARTY" && data.status === "PENDING_AGREEMENT" && (
        <Card title="确认参与" style={{ marginBottom: 24 }}>
          <Alert
            type="info"
            message="请确认是否同意参与本次 ENE 评估"
            description={`评估范围：${ENE_SCOPE_MAP[data.scope]}，约束类型：${ENE_BINDING_MAP[data.bindingType]}`}
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Button type="primary" loading={agreeLoading} onClick={handleAgree}>
            同意参与 ENE 评估
          </Button>
        </Card>
      )}

      {/* Preliminary opinion (expert only, when IN_PROGRESS) */}
      {userRole === "EXPERT" && data.status === "IN_PROGRESS" && (
        <Card title="出具初步评估意见" style={{ marginBottom: 24 }}>
          <TextArea
            rows={6}
            value={preliminaryText}
            onChange={(e) => setPreliminaryText(e.target.value)}
            placeholder="请输入初步评估意见..."
          />
          <Button
            type="primary"
            style={{ marginTop: 16 }}
            loading={preliminaryLoading}
            onClick={handlePreliminary}
            disabled={!preliminaryText.trim()}
          >
            出具初步意见
          </Button>
        </Card>
      )}

      {/* Preliminary opinion display */}
      {data.preliminaryOpinion && (
        <Card title="初步评估意见" style={{ marginBottom: 24 }}>
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{data.preliminaryOpinion}</div>
        </Card>
      )}

      {/* Final opinion (expert only, when IN_PROGRESS or OPINION_ISSUED) */}
      {userRole === "EXPERT" && ["IN_PROGRESS", "OPINION_ISSUED"].includes(data.status) && (
        <Card title="出具最终评估意见" style={{ marginBottom: 24 }}>
          {data.status === "OPINION_ISSUED" && (
            <Alert
              type="info"
              message="初步意见已出具，您可以继续出具最终评估意见。"
              style={{ marginBottom: 16 }}
            />
          )}
          <TextArea
            rows={8}
            value={opinionText}
            onChange={(e) => setOpinionText(e.target.value)}
            placeholder="请输入最终评估意见..."
          />
          <Button
            type="primary"
            style={{ marginTop: 16 }}
            loading={opinionLoading}
            onClick={handleFinalOpinion}
            disabled={!opinionText.trim()}
          >
            出具最终意见
          </Button>
        </Card>
      )}

      {/* Final opinion display */}
      {data.content && (
        <Card title="最终评估意见">
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{data.content}</div>
          {data.issuedAt && (
            <div style={{ marginTop: 16, color: "#999" }}>
              出具时间：{new Date(data.issuedAt).toLocaleDateString("zh-CN")}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
