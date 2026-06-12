import { useState } from 'react';
import type { DrillType, DrillRecordV2 } from '../types';
import { loadDrillRecords } from '../services/storageService';
import { TrainingUnit } from './TrainingUnit';
import { EmptyState } from './EmptyState';
import './TrainingPage.css';

const DRILLS: { type: DrillType; label: string; desc: string }[] = [
  {
    type: 'deep-analysis',
    label: '深度审题',
    desc: '拆概念、找隐含前提、升维立意——AI 引导你一层层看透题目',
  },
  {
    type: 'argument',
    label: '论证打磨',
    desc: '诊断推理漏洞、补全逻辑链——让你的论证无懈可击',
  },
  {
    type: 'perspective',
    label: '视角突破',
    desc: '跳出默认框架、切换分析维度——看到别人看不到的角度',
  },
];

interface TrainingPageProps {
  onOpenEssays?: () => void;
}

export function TrainingPage({ onOpenEssays }: TrainingPageProps) {
  const [activeDrill, setActiveDrill] = useState<DrillType | null>(null);
  const [detailRecord, setDetailRecord] = useState<DrillRecordV2 | null>(null);
  const recentRecords: DrillRecordV2[] = loadDrillRecords().slice(-5).reverse();

  if (detailRecord) {
    return (
      <div className="record-detail">
        <button
          className="tp-detail-back"
          onClick={() => setDetailRecord(null)}
        >
          ← 返回
        </button>
        <div className="tu-topic-banner">{detailRecord.topic}</div>

        <h4 className="tp-detail-label">引导对话</h4>
        <div className="detail-messages">
          {detailRecord.coachingMessages.map((msg) => (
            <div key={msg.id} className={`detail-msg detail-msg-${msg.role}`}>
              <span className="detail-msg-role">
                {msg.role === 'coach' ? '教练' : '我'}
              </span>
              <p className="detail-msg-text">{msg.content}</p>
            </div>
          ))}
        </div>

        <h4 className="tp-detail-label">综合输出</h4>
        <p className="record-content">{detailRecord.synthesisOutput}</p>

        <h4 className="tp-detail-label">教练评估</h4>
        <p className="record-content">{detailRecord.aiEvaluation}</p>
      </div>
    );
  }

  if (activeDrill) {
    return (
      <TrainingUnit
        type={activeDrill}
        onBack={() => setActiveDrill(null)}
        onRefresh={() => setActiveDrill(null)}
      />
    );
  }

  return (
    <div className="training-page">
      <h2 className="page-title">思辨练习场</h2>
      <p className="page-subtitle">
        AI 教练引导式训练——不是交卷，是真正的思维练习
      </p>

      <div className="drill-grid">
        {DRILLS.map((d) => (
          <div
            key={d.type}
            className="card card-clickable"
            onClick={() => setActiveDrill(d.type)}
          >
            <div className="card-title">{d.label}</div>
            <div className="card-desc">{d.desc}</div>
          </div>
        ))}
      </div>

      <button className="btn-secondary btn-full" onClick={onOpenEssays}>
        范文库 · 高分范文与得分点拆解
      </button>

      {recentRecords.length === 0 ? (
        <EmptyState
          icon="📝"
          title="还没有训练记录"
          description="选一个训练单元开始第一次练习，AI 教练会引导你一步步深入思考"
        />
      ) : (
        <section className="recent-section">
          <h3 className="section-title">最近训练</h3>
          {recentRecords.map((r) => (
            <button
              key={r.id}
              className="recent-item"
              onClick={() => setDetailRecord(r)}
            >
              <span className="recent-type">
                {DRILLS.find((d) => d.type === r.type)?.label}
              </span>
              <span className="recent-topic">{r.topic.slice(0, 40)}...</span>
            </button>
          ))}
        </section>
      )}
    </div>
  );
}
