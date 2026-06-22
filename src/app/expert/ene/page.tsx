import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, Table, Tag } from "antd";
import Link from "next/link";
import { ENE_SCOPE_MAP, ENE_BINDING_MAP, ENE_STATUS_MAP } from "@/lib/constants";

export default async function ExpertENEPage() {
  const session = await getSession();
  if (!session || session.role !== "EXPERT") redirect("/login");

  const expert = await prisma.expert.findUnique({
    where: { userId: session.userId },
  });
  if (!expert) redirect("/expert");

  const assessments = await prisma.eNEAssessment.findMany({
    where: { expertId: expert.id },
    include: {
      case: { select: { caseNumber: true, patentTitle: true, id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const columns = [
    { title: "案件编号", dataIndex: "caseNumber", key: "caseNumber" },
    { title: "专利名称", dataIndex: "patentTitle", key: "patentTitle", ellipsis: true },
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
      render: (_: unknown, record: { id: string }) => (
        <Link href={`/expert/ene/${record.id}`}>
          <span style={{ color: "#1890ff", cursor: "pointer" }}>查看详情</span>
        </Link>
      ),
    },
  ];

  const tableData = assessments.map((a) => ({
    id: a.id,
    caseNumber: a.case.caseNumber,
    patentTitle: a.case.patentTitle,
    scope: a.scope,
    bindingType: a.bindingType,
    status: a.status,
  }));

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>ENE 评估任务</h2>
      <Card>
        <Table
          dataSource={tableData}
          columns={columns}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );
}
