import { useState } from 'react';
import { loadEssays, loadDrillRecords } from '../services/storageService';
import type { DrillType } from '../types';
import { EmptyState } from './EmptyState';
import './MyPage.css';

const DRILL_LABELS: Record<DrillType, string> = {
  examining: '审题拆解',
  thesis: '立意突破',
  titling: '命题训练',
  reasoning: '论证链',
  perspective: '视角切换',
};

export function MyPage() {
  const essays = loadEssays();
  const drills = loadDrillRecords();
  const [detailEssayId, setDetailEssayId] = useState<string | null>(null);

  const detailEssay = detailEssayId ? essays.find((e) => e.id === detailEssayId) : null;

  const drillCounts: Partial<Record<DrillType, number>> = {};
  drills.forEach((d) => {
    drillCounts[d.type] = (drillCounts[d.type] || 0) + 1;
  });

  const totalWords = essays.reduce(
    (sum, e) => sum + e.content.replace(/\s/g, '').length,
    0
  );

  const hasData = essays.length > 0 || drills.length > 0;

  return (
    <div className="my-page">
      <h2>我的成长</h2>

      {!hasData && (
        <EmptyState
          icon="🌱"
          title="成长记录即将开始"
          description="完成一次写作或专项训练后，你的思维成长足迹会在这里呈现"
        />
      )}

      {hasData && (
      <>
      <section className="my-stats">
        <div className="my-stat">
          <span className="my-stat-value">{essays.length}</span>
          <span className="my-stat-label">完整作文</span>
        </div>
        <div className="my-stat">
          <span className="my-stat-value">{drills.length}</span>
          <span className="my-stat-label">专项训练</span>
        </div>
        <div className="my-stat">
          <span className="my-stat-value">{totalWords}</span>
          <span className="my-stat-label">累计字数</span>
        </div>
      </section>

      <section className="my-section">
        <h3>训练足迹</h3>
        {(Object.keys(DRILL_LABELS) as DrillType[]).map((type) => (
          <div key={type} className="footprint-row">
            <span className="fp-label">{DRILL_LABELS[type]}</span>
            <div className="fp-bar-wrap">
              <div
                className="fp-bar"
                style={{
                  width: `${Math.min((drillCounts[type] || 0) * 20, 100)}%`,
                }}
              />
            </div>
            <span className="fp-count">{drillCounts[type] || 0}</span>
          </div>
        ))}
      </section>

      {essays.length > 0 && (
        <section className="my-section">
          <h3>最近作文</h3>
          {essays
            .slice(-3)
            .reverse()
            .map((e) => (
              <button
                key={e.id}
                className="recent-essay clickable"
                onClick={() => setDetailEssayId(e.id)}
              >
                <span className="re-essay-topic">
                  {e.topic.slice(0, 40)}...
                </span>
                <span className="re-essay-words">
                  {e.content.replace(/\s/g, '').length} 字
                </span>
              </button>
            ))}
        </section>
      )}

      {detailEssay && (
        <div className="recent-detail-overlay" onClick={() => setDetailEssayId(null)}>
          <div className="recent-detail" onClick={(e) => e.stopPropagation()}>
            <button className="tu-back" onClick={() => setDetailEssayId(null)}>
              关闭
            </button>
            <h4>{detailEssay.topic.slice(0, 60)}</h4>
            <p className="record-content">{detailEssay.content}</p>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
