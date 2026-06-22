"use client";

import { Card, Table, Tag, Button, Modal, Select, message, Space } from "antd";
import { AuditOutlined, PlusOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createENEAssessment } from "@/actions/ene";
import { ENE_SCOPE_MAP, ENE_BINDING_MAP, ENE_STATUS_MAP } from "@/lib/constants";

interface ENEData {
  assessments: Array<{
    id: string;
    caseId: string;
    caseNumber: string;
    patentTitle: string;
    expertId: string;
    expertName: string;
    scope: string;
    bindingType: string;
    applicantAgreed: boolean;
    respondentAgreed: boolean;
    bothPartiesAgreed: boolean;
    status: string;
    createdAt: string;
  }>;
  availableCases: Array<{ id: string; label: string }>;
  experts: Array<{ id: string; name: string }>;
}

export default function ENEMgmtClient({ data }: { data: ENEData }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [newCaseId, setNewCaseId] = useState("");
  const [newExpertId, setNewExpertId] = useState("");
  const [newScope, setNewScope] = useState("FULL");
  const [newBinding, setNewBinding] = useState("NON_BINDING");
  const [createLoading, setCreateLoading] = useState(false);

  const handleCreate = async () => {
    if (!newCaseId || !newExpertId) {
      message.error("请选择案件和专家");
      return;
    }
    setCreateLoading(true);
    try {
      const result = await createENEAssessment(newCaseId, newExpertId, newScope, newBinding);
      if (result.error) message.error(result.error);
      else {
        message.success("ENE 评估已创建");
        setCreateOpen(false);
        setNewCaseId("");
        setNewExpertId("");
      }
    } catch {
      message.error("创建失败");
    } finally {
      setCreateLoading(false);
    }
  };

  const columns = [
    { title: "案件编号", dataIndex: "caseNumber", key: "caseNumber" },
    { title: "专利名称", dataIndex: "patentTitle", key: "patentTitle", ellipsis: true },
    { title: "评估专家", dataIndex: "expertName", key: "expertName" },
    {
      title: "评估范围",
      dataIndex: "scope",
      key: "scope",
      render: (v: string) => ENE_SCOPE_MAP[v] || v,
    },
    {
      title: "约束类型",
      dataIndex: "bindingType",
      key: "bindingType",
      render: (v: string) => (
        <Tag color={v === "BINDING" ? "red" : "blue"}>
          {ENE_BINDING_MAP[v] || v}
        </Tag>
      ),
    },
    {
      title: "双方同意",
      key: "agreed",
      render: (_: unknown, record: ENEData["assessments"][0]) => (
        <Space size={4}>
          <Tag color={record.applicantAgreed ? "green" : "default"}>
            申请方{record.applicantAgreed ? "已同意" : "未同意"}
          </Tag>
          <Tag color={record.respondentAgreed ? "green" : "default"}>
            被申请方{record.respondentAgreed ? "已同意" : "未同意"}
          </Tag>
        </Space>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (v: string) => {
        const s = ENE_STATUS_MAP[v];
        return s ? <Tag color={s.color}>{s.label}</Tag> : v;
      },
    },
    {
      title: "操作",
      key: "actions",
      render: (_: unknown, record: ENEData["assessments"][0]) => (
        <Button
          type="link"
          size="small"
          onClick={() => router.push(`/expert/ene/${record.id}`)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>
          <AuditOutlined style={{ marginRight: 8 }} />
          ENE 评估管理
        </h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateOpen(true)}
          disabled={data.availableCases.length === 0}
        >
          创建 ENE 评估
        </Button>
      </div>

      <Table
        dataSource={data.assessments}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 20 }}
      />

      <Modal
        title="创建 ENE 评估"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={handleCreate}
        confirmLoading={createLoading}
        okText="创建"
        cancelText="取消"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>选择案件</div>
            <Select
              value={newCaseId || undefined}
              onChange={setNewCaseId}
              placeholder="选择案件"
              style={{ width: "100%" }}
              showSearch
              optionFilterProp="label"
              options={data.availableCases.map((c) => ({ value: c.id, label: c.label }))}
            />
          </div>
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>选择评估专家</div>
            <Select
              value={newExpertId || undefined}
              onChange={setNewExpertId}
              placeholder="选择专家"
              style={{ width: "100%" }}
              options={data.experts.map((e) => ({ value: e.id, label: e.name }))}
            />
          </div>
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>评估范围</div>
            <Select
              value={newScope}
              onChange={setNewScope}
              style={{ width: "100%" }}
              options={Object.entries(ENE_SCOPE_MAP).map(([k, v]) => ({ value: k, label: v }))}
            />
          </div>
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>约束类型</div>
            <Select
              value={newBinding}
              onChange={setNewBinding}
              style={{ width: "100%" }}
              options={Object.entries(ENE_BINDING_MAP).map(([k, v]) => ({ value: k, label: v }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
          onClick={() => router.push(`/admin/ene/${record.id}`)}
