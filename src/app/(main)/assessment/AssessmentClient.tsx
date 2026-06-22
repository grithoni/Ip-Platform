"use client";

import { Card, Steps, Button, Radio, Input, Select, Space, Alert, Result } from "antd";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CompassOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveAssessment } from "@/actions/adr-assessment";
import {
  DISPUTE_OPTIONS,
  AMOUNT_RANGE_OPTIONS,
  URGENCY_OPTIONS,
  TECHNICAL_COMPLEXITY_OPTIONS,
  RESOLUTION_PATH_MAP,
} from "@/lib/constants";

export default function AssessmentClient() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    assessmentId: string;
    recommendedPath: string;
  } | null>(null);

  // Form state
  const [disputeType, setDisputeType] = useState("");
  const [hasPatent, setHasPatent] = useState(true);
  const [patentNumber, setPatentNumber] = useState("");
  const [bothPartiesKnown, setBothPartiesKnown] = useState(false);
  const [respondentWilling, setRespondentWilling] = useState("UNKNOWN");
  const [amountInDispute, setAmountInDispute] = useState("");
  const [urgencyLevel, setUrgencyLevel] = useState("MEDIUM");
  const [hasPriorNegotiation, setHasPriorNegotiation] = useState(false);
  const [technicalComplexity, setTechnicalComplexity] = useState("MEDIUM");

  const handleNext = () => {
    if (current === 0 && !disputeType) return;
    setCurrent(current + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await saveAssessment({
        disputeType,
        hasPatent,
        patentNumber: patentNumber || undefined,
        bothPartiesKnown,
        respondentWilling,
        amountInDispute,
        urgencyLevel,
        hasPriorNegotiation,
        technicalComplexity,
      });
      if (res.success) {
        setResult({ assessmentId: res.assessmentId, recommendedPath: res.recommendedPath });
        setCurrent(3);
      }
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: "纠纷类型",
      content: (
        <div style={{ maxWidth: 600 }}>
          <h3 style={{ marginBottom: 16 }}>请选择您的纠纷类型</h3>
          <Radio.Group
            value={disputeType}
            onChange={(e) => setDisputeType(e.target.value)}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            {DISPUTE_OPTIONS.map((opt) => (
              <Radio key={opt.value} value={opt.value}>
                {opt.label}
              </Radio>
            ))}
          </Radio.Group>
        </div>
      ),
    },
    {
      title: "专利信息",
      content: (
        <div style={{ maxWidth: 600 }}>
          <h3 style={{ marginBottom: 16 }}>请填写专利相关信息</h3>

          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>是否已获得专利号？</div>
            <Radio.Group value={hasPatent} onChange={(e) => setHasPatent(e.target.value)}>
              <Radio value={true}>是</Radio>
              <Radio value={false}>否</Radio>
            </Radio.Group>
          </div>

          {hasPatent && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>专利号</div>
              <Input
                value={patentNumber}
                onChange={(e) => setPatentNumber(e.target.value)}
                placeholder="例如：ZL202310123456.7"
              />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>双方当事人是否已知？</div>
            <Radio.Group
              value={bothPartiesKnown}
              onChange={(e) => setBothPartiesKnown(e.target.value)}
            >
              <Radio value={true}>是，已确定对方当事人</Radio>
              <Radio value={false}>否，尚不明确</Radio>
            </Radio.Group>
          </div>

          {bothPartiesKnown && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>对方当事人是否可能配合评估？</div>
              <Radio.Group
                value={respondentWilling}
                onChange={(e) => setRespondentWilling(e.target.value)}
              >
                <Radio value="YES">可能配合</Radio>
                <Radio value="NO">不太配合</Radio>
                <Radio value="UNKNOWN">不确定</Radio>
              </Radio.Group>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "纠纷详情",
      content: (
        <div style={{ maxWidth: 600 }}>
          <h3 style={{ marginBottom: 16 }}>请提供更多纠纷细节</h3>

          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>争议金额范围</div>
            <Select
              value={amountInDispute || undefined}
              onChange={setAmountInDispute}
              placeholder="请选择"
              style={{ width: "100%" }}
              options={AMOUNT_RANGE_OPTIONS}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>紧急程度</div>
            <Radio.Group value={urgencyLevel} onChange={(e) => setUrgencyLevel(e.target.value)}>
              {URGENCY_OPTIONS.map((opt) => (
                <Radio key={opt.value} value={opt.value}>
                  {opt.label}
                </Radio>
              ))}
            </Radio.Group>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>是否曾尝试协商？</div>
            <Radio.Group
              value={hasPriorNegotiation}
              onChange={(e) => setHasPriorNegotiation(e.target.value)}
            >
              <Radio value={true}>是</Radio>
              <Radio value={false}>否</Radio>
            </Radio.Group>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>技术复杂度</div>
            <Select
              value={technicalComplexity}
              onChange={setTechnicalComplexity}
              style={{ width: "100%" }}
              options={TECHNICAL_COMPLEXITY_OPTIONS}
            />
          </div>
        </div>
      ),
    },
    {
      title: "评估结果",
      content: result ? (
        <Result
          icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
          title="评估完成"
          subTitle={
            <div>
              <p style={{ fontSize: 16, marginBottom: 16 }}>
                根据您的情况，我们推荐以下解决路径：
              </p>
              <Alert
                type="info"
                message={
                  <span style={{ fontSize: 18, fontWeight: "bold" }}>
                    {RESOLUTION_PATH_MAP[result.recommendedPath]?.label || result.recommendedPath}
                  </span>
                }
                description={RESOLUTION_PATH_MAP[result.recommendedPath]?.description}
                showIcon
                style={{ textAlign: "left" }}
              />
            </div>
          }
          extra={[
            <Button
              type="primary"
              key="create"
              size="large"
              onClick={() =>
                router.push(`/cases/new?assessmentId=${result.assessmentId}&disputeType=${disputeType}`)
              }
            >
              立即创建案件
            </Button>,
            <Button key="restart" onClick={() => { setCurrent(0); setResult(null); }}>
              重新评估
            </Button>,
          ]}
        />
      ) : null,
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 8 }}>
        <CompassOutlined style={{ marginRight: 8 }} />
        纠纷评估引导
      </h2>
      <p style={{ color: "#666", marginBottom: 24 }}>
        回答几个简单问题，帮助您选择最合适的纠纷解决方式。
      </p>

      <Steps
        current={current}
        items={steps.map((s) => ({ title: s.title }))}
        style={{ marginBottom: 32 }}
      />

      <Card style={{ minHeight: 300 }}>
        {steps[current].content}
      </Card>

      {current < 3 && (
        <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between" }}>
          <Button
            disabled={current === 0}
            onClick={() => setCurrent(current - 1)}
            icon={<ArrowLeftOutlined />}
          >
            上一步
          </Button>
          {current < 2 ? (
            <Button
              type="primary"
              onClick={handleNext}
              disabled={current === 0 && !disputeType}
            >
              下一步 <ArrowRightOutlined />
            </Button>
          ) : (
            <Button type="primary" loading={loading} onClick={handleSubmit}>
              获取评估结果
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
