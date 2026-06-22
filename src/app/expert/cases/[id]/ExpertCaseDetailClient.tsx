"use client";

import { Card, Table, Tag, Tabs, Button, Upload, Modal, message, Descriptions, List, Space, Input, Collapse, Select, Form } from "antd";
import { PlusOutlined, UploadOutlined, SendOutlined, ExperimentOutlined, FileTextOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadDocument } from "@/actions/documents";
import { sendMessage } from "@/actions/messages";
import { triggerClaimAnalysis, triggerValuation } from "@/actions/ai-analysis";
import { createDetermination } from "@/actions/determinations";
import { signDeclaration } from "@/actions/experts";
import {
  STATUS_MAP,
  DISPUTE_MAP,
  DOC_CATEGORY_MAP,
  ANALYSIS_TYPE_MAP,
  ANALYSIS_STATUS_MAP,
  DETERMINATION_TYPE_MAP,
} from "@/lib/constants";

const { TextArea } = Input;

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
  documents: Array<{ id: string; fileName: string; fileType: string; fileSize: number; category: string; uploadTime: string }>;
  assignments: Array<{ id: string; expertName: string; status: string; declarationSigned: boolean; assignedAt: string }>;
  aiAnalyses: Array<{ id: string; analysisType: string; status: string; result: string | null; createdAt: string; completedAt: string | null }>;
  determinations: Array<{ id: string; type: string; content: string; expertName: string; issuedAt: string; correctedAt: string | null; correctionContent: string | null }>;
  messages: Array<{ id: string; fromName: string; fromRole: string; toName: string; content: string; createdAt: string; readAt: string | null }>;
  currentUserId: string;
  expertId: string;
  assignmentId: string;
  declarationSigned: boolean;
}

export default function ExpertCaseDetailClient({ data }: { data: CaseDetailData }) {
  const router = useRouter();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("OTHER");
  const [uploading, setUploading] = useState(false);
  const [msgContent, setMsgContent] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [detType, setDetType] = useState("INTERIM");
  const [detContent, setDetContent] = useState("");
  const [submittingDet, setSubmittingDet] = useState(false);
  const [signingDecl, setSigningDecl] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", uploadCategory);
    const result = await uploadDocument(data.id, formData);
    setUploading(false);
    if (result.error) { message.error(result.error); } else { message.success("上传成功"); setUploadOpen(false); router.refresh(); }
    return false;
  };

  const handleSendMessage = async () => {
    if (!msgContent.trim()) return;
    setSendingMsg(true);
    const formData = new FormData();
    formData.append("toUserId", data.applicant.id);
    formData.append("caseId", data.id);
    formData.append("content", msgContent);
    const result = await sendMessage(formData);
    setSendingMsg(false);
    if (result.error) { message.error(result.error); } else { message.success("已发送"); setMsgContent(""); router.refresh(); }
  };

  const handleAiAnalysis = async (type: string) => {
    setAiLoading(type);
    const result = type === "CLAIM_INTERPRETATION"
      ? await triggerClaimAnalysis(data.id)
      : await triggerValuation(data.id);
    setAiLoading(null);
    if (result?.error) { message.error(result.error); } else { message.success("分析已触发"); router.refresh(); }
  };

  const handleSubmitDetermin = async () => {
    if (!detContent.trim()) { message.error("请输入裁决内容"); return; }
    setSubmittingDet(true);
    const formData = new FormData();
    formData.append("type", detType);
    formData.append("content", detContent);
    const result = await createDetermination(data.id, formData);
    setSubmittingDet(false);
    if (result.error) { message.error(result.error); } else { message.success("裁决已提交"); setDetContent(""); router.refresh(); }
  };

  const handleSignDeclaration = async () => {
    setSigningDecl(true);
    const result = await signDeclaration(data.assignmentId);
    setSigningDecl(false);
    if (result.error) { message.error(result.error); } else { message.success("独立性声明已签署"); router.refresh(); }
  };

  const docColumns = [
    { title: "文件名", dataIndex: "fileName", key: "fileName", ellipsis: true },
    { title: "类型", dataIndex: "category", key: "category", render: (v: string) => DOC_CATEGORY_MAP[v] || v },
    { title: "大小", dataIndex: "fileSize", key: "fileSize", render: (v: number) => `${(v / 1024).toFixed(1)} KB` },
    { title: "上传时间", dataIndex: "uploadTime", key: "uploadTime", render: (v: string) => new Date(v).toLocaleString("zh-CN") },
  ];

  const overviewContent = (
    <div>
      {!data.declarationSigned && (
        <Card style={{ marginBottom: 16, background: "#fff7e6", border: "1px solid #ffd591" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>您尚未签署独立性声明，请先签署后方可进行评估工作。</span>
            <Button type="primary" loading={signingDecl} onClick={handleSignDeclaration}>签署独立性声明</Button>
          </div>
        </Card>
      )}

      <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
        <Descriptions.Item label="案件编号">{data.caseNumber}</Descriptions.Item>
        <Descriptions.Item label="专利号">{data.patentNumber}</Descriptions.Item>
        <Descriptions.Item label="专利名称">{data.patentTitle}</Descriptions.Item>
        <Descriptions.Item label="纠纷类型">{DISPUTE_MAP[data.disputeType] || data.disputeType}</Descriptions.Item>
        <Descriptions.Item label="状态"><Tag color={STATUS_MAP[data.status]?.color}>{STATUS_MAP[data.status]?.label || data.status}</Tag></Descriptions.Item>
        <Descriptions.Item label="争议金额">{data.amountInDispute ? `¥${data.amountInDispute.toLocaleString()}` : "未填写"}</Descriptions.Item>
        <Descriptions.Item label="创建时间">{new Date(data.createdAt).toLocaleString("zh-CN")}</Descriptions.Item>
        <Descriptions.Item label="答辩截止">{data.responseDeadline ? new Date(data.responseDeadline).toLocaleDateString("zh-CN") : "-"}</Descriptions.Item>
      </Descriptions>

      {data.description && (
        <Card title="案件描述" size="small" style={{ marginBottom: 24 }}>
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{data.description}</p>
        </Card>
      )}

      <Card title="当事人信息" size="small">
        <Descriptions column={2}>
          <Descriptions.Item label="申请人">{data.applicant.name}</Descriptions.Item>
          <Descriptions.Item label="公司">{data.applicant.company || "-"}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{data.applicant.email}</Descriptions.Item>
        </Descriptions>
        {data.respondent && (
          <Descriptions column={2} style={{ marginTop: 12 }}>
            <Descriptions.Item label="被申请人">{data.respondent.name}</Descriptions.Item>
            <Descriptions.Item label="公司">{data.respondent.company || "-"}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{data.respondent.email}</Descriptions.Item>
          </Descriptions>
        )}
      </Card>
    </div>
  );

  const documentsContent = (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setUploadOpen(true)}>上传文件</Button>
      </div>
      <Table dataSource={data.documents} columns={docColumns} rowKey="id" pagination={{ pageSize: 10 }} />
    </div>
  );

  const aiContent = (
    <div>
      <Card title="运行AI分析" size="small" style={{ marginBottom: 16 }}>
        <Space>
          <Button type="primary" icon={<ExperimentOutlined />} loading={aiLoading === "CLAIM_INTERPRETATION"} onClick={() => handleAiAnalysis("CLAIM_INTERPRETATION")}>权利要求解释</Button>
          <Button icon={<ExperimentOutlined />} loading={aiLoading === "VALUATION"} onClick={() => handleAiAnalysis("VALUATION")}>估值分析</Button>
        </Space>
      </Card>
      {data.aiAnalyses.length === 0 ? (
        <Card><p style={{ textAlign: "center", color: "#999" }}>暂无AI分析记录，点击上方按钮开始分析</p></Card>
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
                <Collapse size="small" items={[{ key: "r", label: "查看分析结果", children: <pre style={{ fontSize: 12, maxHeight: 400, overflow: "auto", background: "#f5f5f5", padding: 12, borderRadius: 4 }}>{JSON.stringify(JSON.parse(item.result), null, 2)}</pre> }]} />
              )}
            </Card>
          )}
        />
      )}
    </div>
  );

  const determinationsContent = (
    <div>
      <Card title="发布裁决" size="small" style={{ marginBottom: 16 }}>
        <Form layout="vertical">
          <Form.Item label="裁决类型">
            <Select value={detType} onChange={setDetType} options={[
              { value: "INTERIM", label: "临时裁决" },
              { value: "FINAL", label: "最终裁决" },
            ]} />
          </Form.Item>
          <Form.Item label="裁决内容">
            <TextArea rows={6} value={detContent} onChange={(e) => setDetContent(e.target.value)} placeholder="请输入裁决内容..." />
          </Form.Item>
          <Button type="primary" icon={<FileTextOutlined />} loading={submittingDet} onClick={handleSubmitDetermin}>提交裁决</Button>
        </Form>
      </Card>

      {data.determinations.length > 0 && (
        <List
          dataSource={data.determinations}
          renderItem={(item) => (
            <Card style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <Space>
                  <Tag color={item.type === "FINAL" ? "green" : "blue"}>{DETERMINATION_TYPE_MAP[item.type] || item.type}</Tag>
                  <span>{item.expertName}</span>
                </Space>
                <span style={{ color: "#999", fontSize: 12 }}>{new Date(item.issuedAt).toLocaleString("zh-CN")}</span>
              </div>
              <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{item.content}</p>
              {item.correctionContent && (
                <div style={{ marginTop: 12, padding: 12, background: "#fff7e6", borderRadius: 4, border: "1px solid #ffd591" }}>
                  <p style={{ margin: 0, fontWeight: 500 }}>补正 ({item.correctedAt ? new Date(item.correctedAt).toLocaleDateString("zh-CN") : ""})</p>
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
            const isMine = m.fromRole === "EXPERT";
            return (
              <div key={m.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom: 12 }}>
                <div style={{ maxWidth: "70%", padding: "8px 12px", borderRadius: 8, background: isMine ? "#52c41a" : "#fff", color: isMine ? "#fff" : "#333", border: isMine ? "none" : "1px solid #e8e8e8" }}>
                  <div style={{ fontSize: 12, marginBottom: 4, opacity: 0.8 }}>
                    {m.fromName} ({m.fromRole === "ADMIN" ? "管理员" : m.fromRole === "EXPERT" ? "专家" : "当事人"})
                  </div>
                  <div>{m.content}</div>
                  <div style={{ fontSize: 11, marginTop: 4, opacity: 0.6, textAlign: "right" }}>{new Date(m.createdAt).toLocaleString("zh-CN")}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <TextArea rows={2} placeholder="输入消息..." value={msgContent} onChange={(e) => setMsgContent(e.target.value)} style={{ flex: 1 }} />
        <Button type="primary" icon={<SendOutlined />} loading={sendingMsg} onClick={handleSendMessage} style={{ alignSelf: "flex-end" }}>发送</Button>
      </div>
    </div>
  );

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Space size="middle">
            <h2 style={{ margin: 0 }}>{data.caseNumber}</h2>
            <Tag color={STATUS_MAP[data.status]?.color} style={{ fontSize: 14, padding: "2px 12px" }}>{STATUS_MAP[data.status]?.label || data.status}</Tag>
          </Space>
          <Button onClick={() => router.push("/expert/cases")}>返回列表</Button>
        </div>
      </Card>

      <Card>
        <Tabs items={[
          { key: "overview", label: "概览", children: overviewContent },
          { key: "documents", label: "材料", children: documentsContent },
          { key: "ai", label: "AI分析", children: aiContent },
          { key: "determinations", label: "裁决", children: determinationsContent },
          { key: "messages", label: "消息", children: messagesContent },
        ]} />
      </Card>

      <Modal title="上传文件" open={uploadOpen} onCancel={() => setUploadOpen(false)} footer={null}>
        <div style={{ marginBottom: 16 }}>
          <span style={{ marginRight: 8 }}>文件类别:</span>
          <select value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)} style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #d9d9d9" }}>
            {Object.entries(DOC_CATEGORY_MAP).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
          </select>
        </div>
        <Upload.Dragger beforeUpload={(file) => { handleUpload(file); return false; }} showUploadList={false} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" disabled={uploading}>
          <p style={{ fontSize: 32, color: "#1890ff" }}><UploadOutlined /></p>
          <p>点击或拖拽文件到此区域上传</p>
        </Upload.Dragger>
      </Modal>
    </div>
  );
}
