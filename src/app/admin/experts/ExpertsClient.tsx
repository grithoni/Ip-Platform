"use client";

import {
  Card,
  Table,
  Tag,
  Tabs,
  Button,
  Modal,
  Select,
  Input,
  message,
  Space,
  Rate,
  Form,
  Descriptions,
} from "antd";
import {
  TeamOutlined,
  UserAddOutlined,
  WarningOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  reviewApplication,
  addConflictOfInterest,
  removeConflictOfInterest,
  updateExpertPanel,
} from "@/actions/expert-admin";
import {
  PANEL_CATEGORY_MAP,
  EXPERT_APPLICATION_STATUS_MAP,
  CONFLICT_REASON_MAP,
} from "@/lib/constants";

// Local availability map (not in shared constants yet)
const AVAIL: Record<string, { label: string; color: string }> = {
  AVAILABLE: { label: "可用", color: "green" },
  BUSY: { label: "忙碌", color: "orange" },
  UNAVAILABLE: { label: "不可用", color: "red" },
};

interface ExpertsData {
  experts: Array<{
    id: string;
    name: string;
    technicalFields: string;
    qualifications: string | null;
    availability: string;
    hourlyRate: number | null;
    bio: string | null;
    panelCategory: string | null;
    averageRating: number | null;
    totalRatings: number;
    email: string;
    company: string | null;
    createdAt: string;
  }>;
  applications: Array<{
    id: string;
    userId: string;
    name: string;
    email: string;
    company: string | null;
    technicalFields: string;
    qualifications: string | null;
    experienceYears: number | null;
    bio: string | null;
    hourlyRateExpect: number | null;
    status: string;
    createdAt: string;
  }>;
  conflicts: Array<{
    id: string;
    expertId: string;
    expertName: string;
    partyUserId: string;
    partyName: string;
    partyCompany: string | null;
    reason: string;
    details: string | null;
  }>;
  expertsForSelect: Array<{ id: string; name: string }>;
  usersForSelect: Array<{ id: string; label: string }>;
}

export default function ExpertsClient({ data }: { data: ExpertsData }) {
  const router = useRouter();
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<ExpertsData["applications"][0] | null>(null);
  const [reviewDecision, setReviewDecision] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reviewNote, setReviewNote] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  // Conflict modal
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflictExpertId, setConflictExpertId] = useState("");
  const [conflictPartyId, setConflictPartyId] = useState("");
  const [conflictReason, setConflictReason] = useState("OTHER");
  const [conflictDetails, setConflictDetails] = useState("");
  const [conflictLoading, setConflictLoading] = useState(false);

  // Panel category modal
  const [panelModalOpen, setPanelModalOpen] = useState(false);
  const [panelExpertId, setPanelExpertId] = useState("");
  const [panelCategory, setPanelCategory] = useState("");

  const handleReview = async () => {
    if (!selectedApp) return;
    setReviewLoading(true);
    try {
      const result = await reviewApplication(selectedApp.id, reviewDecision, reviewNote || undefined);
      if (result.error) {
        message.error(result.error);
      } else {
        message.success(`申请已${reviewDecision === "APPROVED" ? "通过" : "拒绝"}`);
        setReviewModalOpen(false);
        setReviewNote("");
      }
    } catch {
      message.error("操作失败");
    } finally {
      setReviewLoading(false);
    }
  };

  const handleAddConflict = async () => {
    if (!conflictExpertId || !conflictPartyId) {
      message.error("请选择专家和当事人");
      return;
    }
    setConflictLoading(true);
    try {
      const result = await addConflictOfInterest(
        conflictExpertId,
        conflictPartyId,
        conflictReason,
        conflictDetails || undefined
      );
      if (result.error) {
        message.error(result.error);
      } else {
        message.success("冲突记录已添加");
        setConflictModalOpen(false);
        setConflictExpertId("");
        setConflictPartyId("");
        setConflictDetails("");
      }
    } catch {
      message.error("操作失败");
    } finally {
      setConflictLoading(false);
    }
  };

  const handleRemoveConflict = async (conflictId: string) => {
    const result = await removeConflictOfInterest(conflictId);
    if (result.error) message.error(result.error);
    else message.success("冲突记录已移除");
  };

  const handleUpdatePanel = async () => {
    if (!panelExpertId || !panelCategory) return;
    const result = await updateExpertPanel(panelExpertId, panelCategory);
    if (result.error) message.error(result.error);
    else {
      message.success("面板分类已更新");
      setPanelModalOpen(false);
    }
  };

  const parseFields = (json: string) => {
    try {
      return JSON.parse(json) as string[];
    } catch {
      return [];
    }
  };

  // Expert List columns
  const expertColumns = [
    { title: "姓名", dataIndex: "name", key: "name" },
    {
      title: "技术领域",
      dataIndex: "technicalFields",
      key: "technicalFields",
      render: (v: string) =>
        parseFields(v).map((f) => (
          <Tag key={f} color="blue">
            {f}
          </Tag>
        )),
    },
    {
      title: "面板分类",
      dataIndex: "panelCategory",
      key: "panelCategory",
      render: (v: string | null) => (v ? PANEL_CATEGORY_MAP[v] || v : <Tag>未设置</Tag>),
    },
    {
      title: "可用状态",
      dataIndex: "availability",
      key: "availability",
      render: (v: string) => {
        const s = AVAIL[v];
        return s ? <Tag color={s.color}>{s.label}</Tag> : v;
      },
    },
    {
      title: "评分",
      key: "rating",
      render: (_: unknown, record: ExpertsData["experts"][0]) =>
        record.totalRatings > 0 ? (
          <span>
            <Rate disabled value={record.averageRating || 0} allowHalf style={{ fontSize: 14 }} />{" "}
            ({record.totalRatings})
          </span>
        ) : (
          <span style={{ color: "#999" }}>暂无评分</span>
        ),
    },
    {
      title: "时薪(元)",
      dataIndex: "hourlyRate",
      key: "hourlyRate",
      render: (v: number | null) => (v ? `¥${v}` : "-"),
    },
    {
      title: "操作",
      key: "actions",
      render: (_: unknown, record: ExpertsData["experts"][0]) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => {
              setPanelExpertId(record.id);
              setPanelCategory(record.panelCategory || "");
              setPanelModalOpen(true);
            }}
          >
            设置分类
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => router.push(`/admin/experts/${record.id}`)}
          >
            详情
          </Button>
        </Space>
      ),
    },
  ];

  // Application columns
  const appColumns = [
    { title: "姓名", dataIndex: "name", key: "name" },
    { title: "邮箱", dataIndex: "email", key: "email" },
    { title: "公司", dataIndex: "company", key: "company", render: (v: string | null) => v || "-" },
    {
      title: "技术领域",
      dataIndex: "technicalFields",
      key: "technicalFields",
      render: (v: string) =>
        parseFields(v).map((f) => (
          <Tag key={f} color="blue">
            {f}
          </Tag>
        )),
    },
    { title: "从业年限", dataIndex: "experienceYears", key: "experienceYears", render: (v: number | null) => v ? `${v}年` : "-" },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (v: string) => {
        const s = EXPERT_APPLICATION_STATUS_MAP[v];
        return s ? <Tag color={s.color}>{s.label}</Tag> : v;
      },
    },
    {
      title: "操作",
      key: "actions",
      render: (_: unknown, record: ExpertsData["applications"][0]) =>
        record.status === "PENDING" ? (
          <Button
            type="link"
            size="small"
            onClick={() => {
              setSelectedApp(record);
              setReviewModalOpen(true);
            }}
          >
            审核
          </Button>
        ) : (
          <span style={{ color: "#999" }}>已处理</span>
        ),
    },
  ];

  // Conflict columns
  const conflictColumns = [
    { title: "专家", dataIndex: "expertName", key: "expertName" },
    { title: "当事人", dataIndex: "partyName", key: "partyName" },
    { title: "公司", dataIndex: "partyCompany", key: "partyCompany", render: (v: string | null) => v || "-" },
    {
      title: "冲突原因",
      dataIndex: "reason",
      key: "reason",
      render: (v: string) => CONFLICT_REASON_MAP[v] || v,
    },
    { title: "详情", dataIndex: "details", key: "details", render: (v: string | null) => v || "-" },
    {
      title: "操作",
      key: "actions",
      render: (_: unknown, record: ExpertsData["conflicts"][0]) => (
        <Button
          type="link"
          size="small"
          danger
          onClick={() => handleRemoveConflict(record.id)}
        >
          移除
        </Button>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>
        <TeamOutlined style={{ marginRight: 8 }} />
        专家库管理
      </h2>

      <Tabs
        items={[
          {
            key: "list",
            label: "专家列表",
            children: (
              <Table
                dataSource={data.experts}
                columns={expertColumns}
                rowKey="id"
                pagination={{ pageSize: 20 }}
              />
            ),
          },
          {
            key: "applications",
            label: `申请审核${data.applications.filter((a) => a.status === "PENDING").length > 0 ? ` (${data.applications.filter((a) => a.status === "PENDING").length})` : ""}`,
            children: (
              <Table
                dataSource={data.applications}
                columns={appColumns}
                rowKey="id"
                pagination={{ pageSize: 20 }}
              />
            ),
          },
          {
            key: "conflicts",
            label: (
              <span>
                <WarningOutlined style={{ marginRight: 4 }} />
                冲突管理
                {data.conflicts.length > 0 && (
                  <Tag color="red" style={{ marginLeft: 4 }}>
                    {data.conflicts.length}
                  </Tag>
                )}
              </span>
            ),
            children: (
              <div>
                <Button
                  type="primary"
                  style={{ marginBottom: 16 }}
                  onClick={() => setConflictModalOpen(true)}
                >
                  新增冲突记录
                </Button>
                <Table
                  dataSource={data.conflicts}
                  columns={conflictColumns}
                  rowKey="id"
                  pagination={{ pageSize: 20 }}
                />
              </div>
            ),
          },
        ]}
      />

      {/* Review Application Modal */}
      <Modal
        title="审核专家申请"
        open={reviewModalOpen}
        onCancel={() => setReviewModalOpen(false)}
        onOk={handleReview}
        confirmLoading={reviewLoading}
        okText="提交审核"
        cancelText="取消"
      >
        {selectedApp && (
          <div>
            <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="姓名">{selectedApp.name}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{selectedApp.email}</Descriptions.Item>
              <Descriptions.Item label="公司">{selectedApp.company || "未填写"}</Descriptions.Item>
              <Descriptions.Item label="技术领域">
                {parseFields(selectedApp.technicalFields).join(", ")}
              </Descriptions.Item>
              <Descriptions.Item label="资质">{selectedApp.qualifications || "未填写"}</Descriptions.Item>
              <Descriptions.Item label="从业年限">
                {selectedApp.experienceYears ? `${selectedApp.experienceYears}年` : "未填写"}
              </Descriptions.Item>
              <Descriptions.Item label="简介">{selectedApp.bio || "未填写"}</Descriptions.Item>
            </Descriptions>
            <div style={{ marginBottom: 12 }}>
              <span style={{ marginRight: 16 }}>审核决定：</span>
              <Select
                value={reviewDecision}
                onChange={setReviewDecision}
                style={{ width: 120 }}
                options={[
                  { value: "APPROVED", label: "通过" },
                  { value: "REJECTED", label: "拒绝" },
                ]}
              />
            </div>
            <Input.TextArea
              rows={3}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="审核备注（可选）"
            />
          </div>
        )}
      </Modal>

      {/* Add Conflict Modal */}
      <Modal
        title="新增利益冲突记录"
        open={conflictModalOpen}
        onCancel={() => setConflictModalOpen(false)}
        onOk={handleAddConflict}
        confirmLoading={conflictLoading}
        okText="添加"
        cancelText="取消"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>专家</div>
            <Select
              value={conflictExpertId || undefined}
              onChange={setConflictExpertId}
              placeholder="选择专家"
              style={{ width: "100%" }}
              options={data.expertsForSelect.map((e) => ({ value: e.id, label: e.name }))}
            />
          </div>
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>当事人</div>
            <Select
              value={conflictPartyId || undefined}
              onChange={setConflictPartyId}
              placeholder="选择当事人"
              style={{ width: "100%" }}
              showSearch
              optionFilterProp="label"
              options={data.usersForSelect.map((u) => ({ value: u.id, label: u.label }))}
            />
          </div>
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>冲突原因</div>
            <Select
              value={conflictReason}
              onChange={setConflictReason}
              style={{ width: "100%" }}
              options={Object.entries(CONFLICT_REASON_MAP).map(([k, v]) => ({ value: k, label: v }))}
            />
          </div>
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>详情说明</div>
            <Input.TextArea
              rows={3}
              value={conflictDetails}
              onChange={(e) => setConflictDetails(e.target.value)}
              placeholder="补充说明（可选）"
            />
          </div>
        </div>
      </Modal>

      {/* Panel Category Modal */}
      <Modal
        title="设置面板分类"
        open={panelModalOpen}
        onCancel={() => setPanelModalOpen(false)}
        onOk={handleUpdatePanel}
        okText="保存"
        cancelText="取消"
      >
        <Select
          value={panelCategory || undefined}
          onChange={setPanelCategory}
          placeholder="选择面板分类"
          style={{ width: "100%" }}
          options={Object.entries(PANEL_CATEGORY_MAP).map(([k, v]) => ({ value: k, label: v }))}
        />
      </Modal>
    </div>
  );
}
