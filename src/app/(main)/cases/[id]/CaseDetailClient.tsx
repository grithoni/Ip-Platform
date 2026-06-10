"use client";

import { Card, Table, Tag, Tabs, Button, Upload, Modal, message, Descriptions, List, Space, Input, Collapse } from "antd";
import { PlusOutlined, UploadOutlined, SendOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadDocument } from "@/actions/documents";
import { sendMessage } from "@/actions/messages";

const { TextArea } = Input;

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "草稿", color: "default" },
  SUBMITTED: { label: "已提交", color: "processing" },
  ACCEPTED: { label: "已受理", color: "blue" },
  EXPERT_ASSIGNING: { label: "专家分配中", color: "orange" },
  IN_EVALUATION: { label: "评估中", color: "cyan" },
  DETERMINATION_ISSUED: { label: "已裁决", color: "green" },
  COMPLETED: { label: "已完成", color: "green" },
  CLOSED: { label: "已关闭", color: "default" },
};

const DISPUTE_MAP: Record<string, string> = {
  INFRINGEMENT: "侵权纠纷",
  VALUATION: "估值评估",
  LICENSING: "许可费率",
  OTHER: "其他",
};

const DOC_CATEGORY_MAP: Record<string, string> = {
  PATENT_CERTIFICATE: "专利证书",
  CLAIMS: "权利要求书",
  EVIDENCE: "证据材料",
  TECHNICAL_DESCRIPTION: "技术说明",
  INFRINGEMENT_EVIDENCE: "侵权证据",
  OTHER: "其他",
};

const ANALYSIS_TYPE_MAP: Record<string, string> = {
  CLAIM_INTERPRETATION: "权利要求解释",
  INFRINGEMENT_COMPARISON: "侵权比对",
  VALUATION: "估值分析",
};

const ANALYSIS_STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "待处理", color: "default" },
  PROCESSING: { label: "处理中", color: "processing" },
  COMPLETED: { label: "已完成", color: "green" },
  FAILED: { label: "失败", color: "red" },
};

const DETERMINATION_TYPE_MAP: Record<string, string> = {
  INTERIM: "临时裁决",
  FINAL: "最终裁决",
};

interface CaseDetailData {
  id: string;
  caseNumber: string;
  patentNumber: string;
  patentTitle: string;
  disputeType: string;
  amountInDispute: number | null;
  description: string | null;
  status: string;
  responseDeadline: string | null;
  createdAt: string;
  applicant: { id: string; name: string; company: string | null; email: string };
  respondent: { id: string; name: string; company: string | null; email: string } | null;
  documents: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    category: string;
    uploadTime: string;
  }>;
  assignments: Array<{
    id: string;
    expertName: string;
    status: string;
    declarationSigned: boolean;
    assignedAt: string;
  }>;
  aiAnalyses: Array<{
    id: string;
    analysisType: string;
    status: string;
    result: string | null;
    createdAt: string;
    completedAt: string | null;
  }>;
  determinations: Array<{
    id: string;
    type: string;
    content: string;
    expertName: string;
    issuedAt: string;
    correctedAt: string | null;
    correctionContent: string | null;
  }>;
  messages: Array<{
    id: string;
    fromName: string;
    fromRole: string;
    toName: string;
    content: string;
    createdAt: string;
    readAt: string | null;
  }>;
  currentUserId: string;
  currentUserRole: string;
}

export default function CaseDetailClient({ data }: { data: CaseDetailData }) {
  const router = useRouter();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("OTHER");
  const [uploading, setUploading] = useState(false);
  const [msgContent, setMsgContent] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", uploadCategory);
    const result = await uploadDocument(data.id, formData);
    setUploading(false);
    if (result.error) {
      message.error(result.error);
    } else {
      message.success("文件上传成功");
      setUploadOpen(false);
      router.refresh();
    }
    return false;
  };

  const handleSendMessage = async () => {
    if (!msgContent.trim()) return;
    setSendingMsg(true);
    const toUser = data.currentUserId === data.applicant.id
      ? data.respondent
      : data.applicant;
    const formData = new FormData();
    formData.append("toUserId", toUser?.id || data.applicant.id);
    formData.append("caseId", data.id);
    formData.append("content", msgContent);
    const result = await sendMessage(formData);
    setSendingMsg(false);
    if (result.error) {
      message.error(result.error);
    } else {
      message.success("消息已发送");
      setMsgContent("");
      router.refresh();
    }
  };

  const docColumns = [
    { title: "文件名", dataIndex: "fileName", key: "fileName", ellipsis: true },
    { title: "类型", dataIndex: "category", key: "category", render: (v: string) => DOC_CATEGORY_MAP[v] || v },
    { title: "大小", dataIndex: "fileSize", key: "fileSize", render: (v: number) => `${(v / 1024).toFixed(1)} KB` },
    { title: "上传时间", dataIndex: "uploadTime", key: "uploadTime", render: (v: string) => new Date(v).toLocaleString("zh-CN") },
  ];

  const overviewContent = (
    <div>
      <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
        <Descriptions.Item label="案件编号">{data.caseNumber}</Descriptions.Item>
        <Descriptions.Item label="专利号">{data.patentNumber}</Descriptions.Item>
        <Descriptions.Item label="专利名称">{data.patentTitle}</Descriptions.Item>
        <Descriptions.Item label="纠纷类型">{DISPUTE_MAP[data.disputeType] || data.disputeType}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={STATUS_MAP[data.status]?.color}>{STATUS_MAP[data.status]?.label || data.status}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="争议金额">
          {data.amountInDispute ? `¥${data.amountInDispute.toLocaleString()}` : "未填写"}
        </Descriptions.Item>
        <Descriptions.Item label="创建时间">{new Date(data.createdAt).toLocaleString("zh-CN")}</Descriptions.Item>
        <Descriptions.Item label="答辩截止">{data.responseDeadline ? new Date(data.responseDeadline).toLocaleDateString("zh-CN") : "-"}</Descriptions.Item>
      </Descriptions>

      {data.description && (
        <Card title="案件描述" size="small" style={{ marginBottom: 24 }}>
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{data.description}</p>
        </Card>
      )}

      <Card title="当事人信息" size="small" style={{ marginBottom: 24 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="申请人" span={1}>{data.applicant.name}</Descriptions.Item>
          <Descriptions.Item label="公司">{data.applicant.company || "-"}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{data.applicant.email}</Descriptions.Item>
        </Descriptions>
        {data.respondent && (
          <>
            <div style={{ margin: "12px 0", borderTop: "1px solid #f0f0f0" }} />
            <Descriptions column={2}>
              <Descriptions.Item label="被申请人" span={1}>{data.respondent.name}</Descriptions.Item>
              <Descriptions.Item label="公司">{data.respondent.company || "-"}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{data.respondent.email}</Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Card>

      {data.assignments.length > 0 && (
        <Card title="专家指派" size="small">
          <Table
            dataSource={data.assignments}
            rowKey="id"
            pagination={false}
            columns={[
              { title: "专家", dataIndex: "expertName", key: "expertName" },
              { title: "状态", dataIndex: "status", key: "status", render: (v: string) => {
                const map: Record<string, { label: string; color: string }> = {
                  PENDING: { label: "待接受", color: "orange" },
                  ACCEPTED: { label: "已接受", color: "green" },
                  DECLINED: { label: "已拒绝", color: "red" },
                  COMPLETED: { label: "已完成", color: "blue" },
                };
                const s = map[v];
                return s ? <Tag color={s.color}>{s.label}</Tag> : v;
              }},
              { title: "独立性声明", dataIndex: "declarationSigned", key: "declarationSigned", render: (v: boolean) => v ? <Tag color="green">已签署</Tag> : <Tag color="default">未签署</Tag> },
              { title: "指派时间", dataIndex: "assignedAt", key: "assignedAt", render: (v: string) => new Date(v).toLocaleDateString("zh-CN") },
            ]}
          />
        </Card>
      )}
    </div>
  );

  const documentsContent = (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setUploadOpen(true)}>
          上传文件
        </Button>
      </div>
      <Table dataSource={data.documents} columns={docColumns} rowKey="id" pagination={{ pageSize: 10 }} />
    </div>
  );

  const aiContent = (
    <div>
      {data.aiAnalyses.length === 0 ? (
        <Card><p style={{ textAlign: "center", color: "#999" }}>暂无AI分析记录</p></Card>
      ) : (
        <List
          dataSource={data.aiAnalyses}
          renderItem={(item) => (
            <Card style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <Space>
                  <Tag>{ANALYSIS_TYPE_MAP[item.analysisType] || item.analysisType}</Tag>
                  <Tag color={ANALYSIS_STATUS_MAP[item.status]?.color}>{ANALYSIS_STATUS_MAP[item.status]?.label || item.status}</Tag>
                </Space>
                <span style={{ color: "#999", fontSize: 12 }}>{new Date(item.createdAt).toLocaleString("zh-CN")}</span>
              </div>
              {item.status === "COMPLETED" && item.result && (
                <Collapse
                  size="small"
                  items={[{
                    key: "result",
                    label: "查看分析结果",
                    children: <pre style={{ fontSize: 12, maxHeight: 400, overflow: "auto", background: "#f5f5f5", padding: 12, borderRadius: 4 }}>{JSON.stringify(JSON.parse(item.result), null, 2)}</pre>,
                  }]}
                />
              )}
              {item.status === "FAILED" && <p style={{ color: "#ff4d4f", margin: 0 }}>分析失败，请重试</p>}
            </Card>
          )}
        />
      )}
    </div>
  );

  const determinationsContent = (
    <div>
      {data.determinations.length === 0 ? (
        <Card><p style={{ textAlign: "center", color: "#999" }}>暂无裁决记录</p></Card>
      ) : (
        <List
          dataSource={data.determinations}
          renderItem={(item) => (
            <Card style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <Space>
                  <Tag color={item.type === "FINAL" ? "green" : "blue"}>
                    {DETERMINATION_TYPE_MAP[item.type] || item.type}
                  </Tag>
                  <span>专家: {item.expertName}</span>
                </Space>
                <span style={{ color: "#999", fontSize: 12 }}>{new Date(item.issuedAt).toLocaleString("zh-CN")}</span>
              </div>
              <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{item.content}</p>
              {item.correctionContent && (
                <div style={{ marginTop: 12, padding: 12, background: "#fff7e6", borderRadius: 4, border: "1px solid #ffd591" }}>
                  <p style={{ margin: 0, fontWeight: 500 }}>补正内容 ({item.correctedAt ? new Date(item.correctedAt).toLocaleDateString("zh-CN") : ""})</p>
                  <p style={{ margin: "4px 0 0" }}>{item.correctionContent}</p>
                </div>
              )}
            </Card>
          )}
        />
      )}
    </div>
  );

  const messagesContent = (
    <div style={{ display: "flex", flexDirection: "column", height: 500 }}>
      <div style={{ flex: 1, overflow: "auto", padding: 16, background: "#fafafa", borderRadius: 8, marginBottom: 16 }}>
        {data.messages.length === 0 ? (
          <p style={{ textAlign: "center", color: "#999", marginTop: 40 }}>暂无消息</p>
        ) : (
          data.messages.map((m) => {
            const isMine = m.fromRole === data.currentUserRole || m.fromName === data.applicant.name && data.currentUserId === data.applicant.id;
            return (
              <div key={m.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom: 12 }}>
                <div style={{ maxWidth: "70%", padding: "8px 12px", borderRadius: 8, background: isMine ? "#1890ff" : "#fff", color: isMine ? "#fff" : "#333", border: isMine ? "none" : "1px solid #e8e8e8" }}>
                  <div style={{ fontSize: 12, marginBottom: 4, opacity: 0.8 }}>
                    {m.fromName} ({m.fromRole === "ADMIN" ? "管理员" : m.fromRole === "EXPERT" ? "专家" : "当事人"})
                  </div>
                  <div>{m.content}</div>
                  <div style={{ fontSize: 11, marginTop: 4, opacity: 0.6, textAlign: "right" }}>
                    {new Date(m.createdAt).toLocaleString("zh-CN")}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <TextArea
          rows={2}
          placeholder="输入消息内容..."
          value={msgContent}
          onChange={(e) => setMsgContent(e.target.value)}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          style={{ flex: 1 }}
        />
        <Button type="primary" icon={<SendOutlined />} loading={sendingMsg} onClick={handleSendMessage} style={{ alignSelf: "flex-end" }}>
          发送
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Space size="middle">
            <h2 style={{ margin: 0 }}>{data.caseNumber}</h2>
            <Tag color={STATUS_MAP[data.status]?.color} style={{ fontSize: 14, padding: "2px 12px" }}>
              {STATUS_MAP[data.status]?.label || data.status}
            </Tag>
          </Space>
          <Button onClick={() => router.push("/cases")}>返回列表</Button>
        </div>
      </Card>

      <Card>
        <Tabs
          items={[
            { key: "overview", label: "概览", children: overviewContent },
            { key: "documents", label: "材料", children: documentsContent },
            { key: "ai", label: "AI分析", children: aiContent },
            { key: "determinations", label: "裁决", children: determinationsContent },
            { key: "messages", label: "消息", children: messagesContent },
          ]}
        />
      </Card>

      <Modal
        title="上传文件"
        open={uploadOpen}
        onCancel={() => setUploadOpen(false)}
        footer={null}
      >
        <div style={{ marginBottom: 16 }}>
          <span style={{ marginRight: 8 }}>文件类别:</span>
          <select
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value)}
            style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #d9d9d9" }}
          >
            {Object.entries(DOC_CATEGORY_MAP).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <Upload.Dragger
          beforeUpload={(file) => {
            handleUpload(file);
            return false;
          }}
          showUploadList={false}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          disabled={uploading}
        >
          <p style={{ fontSize: 32, color: "#1890ff" }}><UploadOutlined /></p>
          <p>点击或拖拽文件到此区域上传</p>
          <p style={{ color: "#999" }}>支持 PDF、DOC、DOCX、JPG、PNG 格式，最大 50MB</p>
        </Upload.Dragger>
      </Modal>
    </div>
  );
}
