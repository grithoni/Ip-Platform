"use client";

import { Card, Tag, Button, Space, message, Row, Col, Empty } from "antd";
import { CheckOutlined, CloseOutlined, EditOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptAssignment, declineAssignment, signDeclaration } from "@/actions/experts";

const DISPUTE_MAP: Record<string, string> = {
  INFRINGEMENT: "侵权纠纷",
  VALUATION: "估值评估",
  LICENSING: "许可费率",
  OTHER: "其他",
};

interface AssignmentItem {
  id: string;
  caseId: string;
  caseNumber: string;
  patentTitle: string;
  disputeType: string;
  status: string;
  declarationSigned: boolean;
  applicantName: string;
  assignedAt: string;
}

export default function AssignmentsClient({ assignments }: { assignments: AssignmentItem[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleAccept = async (id: string) => {
    setLoadingId(id);
    const result = await acceptAssignment(id);
    setLoadingId(null);
    if (result.error) { message.error(result.error); } else { message.success("已接受指派"); router.refresh(); }
  };

  const handleDecline = async (id: string) => {
    setLoadingId(id);
    const result = await declineAssignment(id);
    setLoadingId(null);
    if (result.error) { message.error(result.error); } else { message.success("已拒绝指派"); router.refresh(); }
  };

  const handleSign = async (id: string) => {
    setLoadingId(id);
    const result = await signDeclaration(id);
    setLoadingId(null);
    if (result.error) { message.error(result.error); } else { message.success("已签署独立性声明"); router.refresh(); }
  };

  const pending = assignments.filter((a) => a.status === "PENDING");
  const accepted = assignments.filter((a) => a.status === "ACCEPTED");
  const others = assignments.filter((a) => !["PENDING", "ACCEPTED"].includes(a.status));

  const renderCard = (item: AssignmentItem) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      PENDING: { label: "待处理", color: "orange" },
      ACCEPTED: { label: "已接受", color: "green" },
      DECLINED: { label: "已拒绝", color: "red" },
      COMPLETED: { label: "已完成", color: "blue" },
    };
    const s = statusMap[item.status];

    return (
      <Card key={item.id} style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h3 style={{ margin: 0, marginBottom: 8 }}>{item.caseNumber}</h3>
            <p style={{ margin: 0, marginBottom: 4, color: "#666" }}>{item.patentTitle}</p>
            <Space style={{ marginTop: 8 }}>
              <Tag>{DISPUTE_MAP[item.disputeType] || item.disputeType}</Tag>
              <Tag color={s?.color}>{s?.label || item.status}</Tag>
              {item.declarationSigned ? <Tag color="green">已签署声明</Tag> : <Tag color="default">未签署声明</Tag>}
            </Space>
            <p style={{ margin: "8px 0 0", color: "#999", fontSize: 12 }}>
              申请人: {item.applicantName} | 指派时间: {new Date(item.assignedAt).toLocaleDateString("zh-CN")}
            </p>
          </div>
          <Space>
            {item.status === "PENDING" && (
              <>
                <Button type="primary" icon={<CheckOutlined />} loading={loadingId === item.id} onClick={() => handleAccept(item.id)}>接受</Button>
                <Button danger icon={<CloseOutlined />} loading={loadingId === item.id} onClick={() => handleDecline(item.id)}>拒绝</Button>
              </>
            )}
            {item.status === "ACCEPTED" && !item.declarationSigned && (
              <Button type="primary" icon={<EditOutlined />} loading={loadingId === item.id} onClick={() => handleSign(item.id)}>签署声明</Button>
            )}
            {item.status === "ACCEPTED" && (
              <Button onClick={() => router.push(`/expert/cases/${item.caseId}`)}>查看案件</Button>
            )}
          </Space>
        </div>
      </Card>
    );
  };

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>指派任务</h2>

      {assignments.length === 0 && (
        <Card><Empty description="暂无指派任务" /></Card>
      )}

      {pending.length > 0 && (
        <>
          <h3 style={{ marginBottom: 12, color: "#fa8c16" }}>待处理 ({pending.length})</h3>
          {pending.map(renderCard)}
        </>
      )}

      {accepted.length > 0 && (
        <>
          <h3 style={{ marginBottom: 12, color: "#52c41a" }}>进行中 ({accepted.length})</h3>
          {accepted.map(renderCard)}
        </>
      )}

      {others.length > 0 && (
        <>
          <h3 style={{ marginBottom: 12, color: "#999" }}>历史记录 ({others.length})</h3>
          {others.map(renderCard)}
        </>
      )}
    </div>
  );
}
