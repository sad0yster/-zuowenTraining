import { useState, useEffect } from 'react';
import type { DrillType, DrillRecord } from '../types';
import { loadDrillRecords } from '../services/storageService';
import { TrainingUnit } from './TrainingUnit';
import { EmptyState } from './EmptyState';
import './TrainingPage.css';

const DRILLS: { type: DrillType; label: string; desc: string }[] = [
  {
    type: 'examining',
    label: '审题拆解',
    desc: '拆关键概念、找隐含前提、列多向立意',
  },
  {
    type: 'thesis',
    label: '立意突破',
    desc: '同一题目的三层立意对比和升维',
  },
  {
    type: 'titling',
    label: '命题训练',
    desc: '同一立意拟多个标题并自评优劣',
  },
  {
    type: 'reasoning',
    label: '论证链',
    desc: '理由→证据→推理→反驳逐环检测',
  },
  {
    type: 'perspective',
    label: '视角切换',
    desc: '同一主题用不同概念框架各写一段',
  },
];

interface TrainingPageProps {
  jumpToDrill?: DrillType | null;
  jumpContext?: string;
  onClearJump?: () => void;
  onOpenEssays?: () => void;
}

export function TrainingPage({
  jumpToDrill,
  jumpContext,
  onClearJump,
  onOpenEssays,
}: TrainingPageProps) {
  const [activeDrill, setActiveDrill] = useState<DrillType | null>(null);

  useEffect(() => {
    if (jumpToDrill) {
      setActiveDrill(jumpToDrill);
      onClearJump?.();
    }
  }, [jumpToDrill, onClearJump]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [detailRecord, setDetailRecord] = useState<DrillRecord | null>(null);
  const recentRecords: DrillRecord[] = loadDrillRecords()
    .slice(-5)
    .reverse();

  if (detailRecord) {
    return (
      <div className="record-detail">
        <button className="tu-back" onClick={() => setDetailRecord(null)} style={{ marginBottom: 16 }}>
          ← 返回
        </button>
        <div className="tu-topic-banner">{detailRecord.questionText}</div>
        <h4 style={{ fontSize: 13, color: '#999', marginBottom: 8 }}>你的分析</h4>
        <p className="record-content">{detailRecord.studentInput}</p>
        <h4 style={{ fontSize: 13, color: '#999', marginBottom: 8, marginTop: 16 }}>教练反馈</h4>
        <p className="record-content">{detailRecord.aiFeedback}</p>
      </div>
    );
  }

  if (activeDrill) {
    return (
      <TrainingUnit
        key={`${activeDrill}-${refreshKey}`}
        type={activeDrill}
        contextTopic={jumpContext}
        onBack={() => setActiveDrill(null)}
        onRefresh={() => setRefreshKey((k) => k + 1)}
      />
    );
  }

  return (
    <div className="training-page">
      <h2>思辨练习场</h2>
      <p className="training-subtitle">每次 5-10 分钟，专攻一个得分点</p>

      <div className="drill-grid">
        {DRILLS.map((d) => (
          <button
            key={d.type}
            className="drill-card"
            onClick={() => setActiveDrill(d.type)}
          >
            <span className="drill-label">{d.label}</span>
            <span className="drill-desc">{d.desc}</span>
          </button>
        ))}
      </div>

      <button
        className="essay-lib-btn"
        onClick={onOpenEssays}
        style={{
          width: '100%',
          padding: '14px',
          border: '1px dashed #ddd',
          borderRadius: '10px',
          background: '#fafafa',
          fontSize: '14px',
          cursor: 'pointer',
          marginBottom: '24px',
        }}
      >
        范文库 · 高分范文与得分点拆解
      </button>

      {recentRecords.length === 0 ? (
        <EmptyState
          icon="📝"
          title="还没有训练记录"
          description="选一个训练单元开始第一次练习，每次只需 5-10 分钟"
        />
      ) : (
        <section className="recent-section">
          <h3>最近训练</h3>
          {recentRecords.map((r) => (
            <button
                key={r.id}
                className="recent-item"
                onClick={() => setDetailRecord(r)}
              >
              <span className="recent-type">
                {DRILLS.find((d) => d.type === r.type)?.label}
              </span>
              <span className="recent-topic">
                {r.questionText.slice(0, 40)}...
              </span>
            </button>
          ))}
        </section>
      )}
    </div>
  );
}
