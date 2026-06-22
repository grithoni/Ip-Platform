"use client";

import {
  Card,
  Button,
  Descriptions,
  Tag,
  Table,
  Space,
  Input,
  Modal,
  message,
  Alert,
  Statistic,
  Radio,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { submitResponse } from "@/actions/case-response";
import {
  STATUS_MAP,
  DISPUTE_MAP,
  DOC_CATEGORY_MAP,
  RESPONSE_ACTION_MAP,
} from "@/lib/constants";

const { TextArea } = Input;

interface ResponseData {
  id: string;
  caseNumber: string;
  patentNumber: string;
  patentTitle: string;
  disputeType: string;
  amountInDispute: number | null;
  description: string | null;
  status: string;
  responseDeadline: string | null;
  applicant: { id: string; name: string; email: string; company: string | null };
  documents: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    category: string;
    uploadTime: string;
  }>;
  caseResponse: {
    action: string;
    responseText: string | null;
    counterclaimDesc: string | null;
    respondedAt: string;
  } | null;
}

export default function ResponseClient({ data }: { data: ResponseData }) {
  const router = useRouter();
  const [action, setAction] = useState<"ACCEPT" | "REJECT" | "COUNTERCLAIM">("ACCEPT");
  const [responseText, setResponseText] = useState("");
  const [counterclaimDesc, setCounterclaimDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const daysRemaining = useMemo(() => {
    if (!data.responseDeadline) return null;
    const now = new Date();
    const deadline = new Date(data.responseDeadline);
    const diff = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [data.responseDeadline]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("responseText", responseText);
      if (action === "COUNTERCLAIM") {
        formData.append("counterclaimDesc", counterclaimDesc);
      }
      const result = await submitResponse(data.id, action, formData);
      if (result.error) {
        message.error(result.error);
      } else {
        message.success("回复提交成功");
        router.push(`/cases/${data.id}`);
      }
    } catch {
      message.error("提交失败");
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  const docColumns = [
    { title: "文件名", dataIndex: "fileName", key: "fileName" },
    {
      title: "类别",
      dataIndex: "category",
      key: "category",
      render: (v: string) => DOC_CATEGORY_MAP[v] || v,
    },
    {
      title: "大小",
      dataIndex: "fileSize",
      key: "fileSize",
      render: (v: number) => `${(v / 1024).toFixed(0)} KB`,
    },
    {
      title: "上传时间",
      dataIndex: "uploadTime",
      key: "uploadTime",
      render: (v: string) => new Date(v).toLocaleDateString("zh-CN"),
    },
  ];

  const actionLabels: Record<string, string> = {
    ACCEPT: "接受评估",
    REJECT: "拒绝参与",
    COUNTERCLAIM: "提出反请求",
  };

  // Already responded
  if (data.caseResponse) {
    const resp = data.caseResponse;
    const respInfo = RESPONSE_ACTION_MAP[resp.action];
    return (
      <div>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push(`/cases/${data.id}`)}
          style={{ marginBottom: 16 }}
        >
          返回案件详情
        </Button>
        <Card title={`案件 ${data.caseNumber} - 回复详情`}>
          <Alert
            type="success"
            message={`您已于 ${new Date(resp.respondedAt).toLocaleDateString("zh-CN")} 回复`}
            description={`回复决定：${respInfo?.label || resp.action}`}
            style={{ marginBottom: 24 }}
          />
          {resp.responseText && (
            <Descriptions title="回复内容" bordered column={1} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="回复说明">{resp.responseText}</Descriptions.Item>
            </Descriptions>
          )}
          {resp.counterclaimDesc && (
            <Descriptions title="反请求内容" bordered column={1}>
              <Descriptions.Item label="反请求描述">{resp.counterclaimDesc}</Descriptions.Item>
            </Descriptions>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push(`/cases/${data.id}`)}
        style={{ marginBottom: 16 }}
      >
        返回案件详情
      </Button>

      {/* Deadline alert */}
      {daysRemaining !== null && (
        <Alert
          type={daysRemaining <= 3 ? "error" : daysRemaining <= 7 ? "warning" : "info"}
          message={`回复截止日期：${new Date(data.responseDeadline!).toLocaleDateString("zh-CN")}`}
          description={
            daysRemaining > 0
              ? `剩余 ${daysRemaining} 天，请在截止日期前完成回复。`
              : "回复期限已过，无法提交回复。请联系管理员。"
          }
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Case summary */}
      <Card title="案件信息" style={{ marginBottom: 24 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="案件编号">{data.caseNumber}</Descriptions.Item>
          <Descriptions.Item label="案件状态">
            <Tag color={STATUS_MAP[data.status]?.color}>
              {STATUS_MAP[data.status]?.label || data.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="专利号">{data.patentNumber}</Descriptions.Item>
          <Descriptions.Item label="专利名称">{data.patentTitle}</Descriptions.Item>
          <Descriptions.Item label="纠纷类型">{DISPUTE_MAP[data.disputeType] || data.disputeType}</Descriptions.Item>
          <Descriptions.Item label="争议金额">
            {data.amountInDispute ? `¥${data.amountInDispute.toLocaleString()}` : "未填写"}
          </Descriptions.Item>
          <Descriptions.Item label="申请人">{data.applicant.name}</Descriptions.Item>
          <Descriptions.Item label="申请人公司">{data.applicant.company || "未填写"}</Descriptions.Item>
          {data.description && (
            <Descriptions.Item label="案件描述" span={2}>
              {data.description}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Documents */}
      <Card title="案件材料（只读）" style={{ marginBottom: 24 }}>
        <Table
          dataSource={data.documents}
          columns={docColumns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>

      {/* Response form */}
      <Card title="您的回复">
        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 12, fontWeight: 500 }}>请选择您的回复方式：</div>
          <Radio.Group
            value={action}
            onChange={(e) => setAction(e.target.value)}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <Radio value="ACCEPT">
              <Space>
                <CheckCircleOutlined style={{ color: "#52c41a" }} />
                <span>接受评估</span>
                <span style={{ color: "#999", fontSize: 12 }}>- 同意参与中立评估程序</span>
              </Space>
            </Radio>
            <Radio value="REJECT">
              <Space>
                <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
                <span>拒绝参与</span>
                <span style={{ color: "#999", fontSize: 12 }}>- 不参与本次评估程序</span>
              </Space>
            </Radio>
            <Radio value="COUNTERCLAIM">
              <Space>
                <ExclamationCircleOutlined style={{ color: "#fa8c16" }} />
                <span>提出反请求</span>
                <span style={{ color: "#999", fontSize: 12 }}>- 接受评估并提出反请求</span>
              </Space>
            </Radio>
          </Radio.Group>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>回复说明（可选）：</div>
          <TextArea
            rows={3}
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="请输入您的回复说明..."
          />
        </div>

        {action === "COUNTERCLAIM" && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>反请求描述：</div>
            <TextArea
              rows={4}
              value={counterclaimDesc}
              onChange={(e) => setCounterclaimDesc(e.target.value)}
              placeholder="请详细描述您的反请求内容..."
            />
          </div>
        )}

        <Button
          type="primary"
          size="large"
          loading={loading}
          onClick={() => setConfirmOpen(true)}
        >
          提交回复
        </Button>

        <Modal
          title="确认提交回复"
          open={confirmOpen}
          onOk={handleSubmit}
          onCancel={() => setConfirmOpen(false)}
          confirmLoading={loading}
          okText="确认提交"
          cancelText="取消"
        >
          <p>
            您确定要<strong>{actionLabels[action]}</strong>吗？
          </p>
          {action === "REJECT" && (
            <p style={{ color: "#ff4d4f" }}>拒绝参与后，案件状态将变更为"被申请人拒绝"。</p>
          )}
          {action === "COUNTERCLAIM" && !counterclaimDesc && (
            <p style={{ color: "#fa8c16" }}>您选择了提出反请求，但未填写反请求描述。</p>
          )}
        </Modal>
      </Card>
    </div>
  );
}
