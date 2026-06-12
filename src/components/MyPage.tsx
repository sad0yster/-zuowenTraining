import { useState, useEffect, useCallback } from 'react';
import { loadEssays, loadDrillRecords, getStorageUsage, exportAllData, importAllData } from '../services/storageService';
import type { DrillRecordV2, DrillType, ThinkingSnapshot } from '../types';
import { EmptyState } from './EmptyState';
import { RadarChart } from './RadarChart';
import { renderInlineMarkdown } from './ChatBubble';
import './MyPage.css';

const DRILL_LABELS: Record<DrillType, string> = {
  'deep-analysis': '深度审题',
  'argument': '论证打磨',
  'perspective': '视角突破',
};

const LABEL_TO_KEY: Record<string, keyof ThinkingSnapshot> = {
  '立意': 'originality',
  '推理': 'reasoning',
  '视角': 'perspective',
  '结构': 'structure',
  '语言': 'language',
};

const DIM_TO_RADAR: Record<string, keyof ThinkingSnapshot> = {
  'concept-definition': 'originality',
  'hidden-premise': 'originality',
  'thesis-elevation': 'originality',
  'claim-clarity': 'reasoning',
  'reasoning-chain': 'reasoning',
  'counterexample': 'reasoning',
  'default-angle': 'perspective',
  'framework-switch': 'perspective',
  'meta-awareness': 'perspective',
};

function calcDrillSnapshot(drills: DrillRecordV2[]): ThinkingSnapshot | null {
  if (drills.length === 0) return null;

  const totals = { originality: 0, reasoning: 0, perspective: 0, structure: 0, language: 0 };
  const counts = { originality: 0, reasoning: 0, perspective: 0, structure: 0, language: 0 };

  drills.forEach(d => {
    Object.entries(d.dimensionCoverage).forEach(([dimId, turns]) => {
      const radarDim = DIM_TO_RADAR[dimId];
      if (radarDim && turns > 0) {
        totals[radarDim] += Math.min(turns / 3, 1); // normalize: 3+ turns = max
        counts[radarDim]++;
      }
    });
  });

  // Only return if at least one dimension has data
  const hasData = Object.values(counts).some(c => c > 0);
  if (!hasData) return null;

  return {
    originality: counts.originality ? Math.round((totals.originality / counts.originality) * 5 * 10) / 10 : 0,
    reasoning: counts.reasoning ? Math.round((totals.reasoning / counts.reasoning) * 5 * 10) / 10 : 0,
    perspective: counts.perspective ? Math.round((totals.perspective / counts.perspective) * 5 * 10) / 10 : 0,
    structure: 0, // no training dimensions map to structure
    language: 0,  // no training dimensions map to language
  };
}

function isThisWeek(timestamp: number): boolean {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  return timestamp >= weekStart.getTime();
}

function isLastWeek(timestamp: number): boolean {
  const now = new Date();
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(thisWeekStart.getDate() - now.getDay());
  thisWeekStart.setHours(0, 0, 0, 0);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  return timestamp >= lastWeekStart.getTime() && timestamp < thisWeekStart.getTime();
}

function averageSnapshot(records: { snapshot: ThinkingSnapshot }[]): ThinkingSnapshot {
  const n = records.length;
  const sum = records.reduce(
    (acc, e) => ({
      originality: acc.originality + e.snapshot.originality,
      reasoning: acc.reasoning + e.snapshot.reasoning,
      perspective: acc.perspective + e.snapshot.perspective,
      structure: acc.structure + e.snapshot.structure,
      language: acc.language + e.snapshot.language,
    }),
    { originality: 0, reasoning: 0, perspective: 0, structure: 0, language: 0 }
  );
  return {
    originality: sum.originality / n,
    reasoning: sum.reasoning / n,
    perspective: sum.perspective / n,
    structure: sum.structure / n,
    language: sum.language / n,
  };
}

function generateWeeklySummary(essays: { snapshot: ThinkingSnapshot; createdAt: number }[]): string {
  if (essays.length < 2) return '完成更多训练后，这里会显示你的进步总结。';

  const thisWeek = essays.filter(e => isThisWeek(e.createdAt));
  const lastWeek = essays.filter(e => isLastWeek(e.createdAt));

  if (thisWeek.length === 0) return '本周还没有训练记录，保持节奏很重要。';
  if (lastWeek.length === 0) return `本周完成了${thisWeek.length}篇作文，继续加油。`;

  const thisAvg = averageSnapshot(thisWeek);
  const lastAvg = averageSnapshot(lastWeek);
  const dimNames: Record<string, string> = {
    originality: '立意', reasoning: '推理', perspective: '视角',
    structure: '结构', language: '语言'
  };
  const changes = (Object.keys(dimNames) as Array<keyof ThinkingSnapshot>)
    .map(key => ({ key, diff: thisAvg[key] - lastAvg[key] }))
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  const improved = changes.filter(c => c.diff > 0.1);
  const declined = changes.filter(c => c.diff < -0.1);

  let summary = '';
  if (improved.length > 0) {
    const names = improved.map(c => dimNames[c.key]).join('、');
    summary += `本周${names}维度有进步。`;
  }
  if (declined.length > 0) {
    const names = declined.map(c => dimNames[c.key]).join('、');
    summary += `注意${names}维度有所下降。`;
  }
  if (!summary) summary = '本周各维度保持稳定，继续保持训练节奏。';
  return summary;
}

export function MyPage() {
  const essays = loadEssays();
  const drills = loadDrillRecords();
  const storageInfo = getStorageUsage();
  const [detailEssayId, setDetailEssayId] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const detailEssay = detailEssayId ? essays.find((e) => e.id === detailEssayId) : null;

  const closeDetail = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setDetailEssayId(null);
      setIsClosing(false);
    }, 200);
  }, []);

  useEffect(() => {
    if (!detailEssayId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDetail();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [detailEssayId, closeDetail]);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: prev[key] === false ? true : false }));
  };

  const isOpen = (key: string) => openSections[key] !== false;

  const drillCounts: Partial<Record<DrillType, number>> = {};
  const drillLastDate: Partial<Record<DrillType, number>> = {};
  drills.forEach((d) => {
    drillCounts[d.type] = (drillCounts[d.type] || 0) + 1;
    if (!drillLastDate[d.type] || d.createdAt > drillLastDate[d.type]!) {
      drillLastDate[d.type] = d.createdAt;
    }
  });

  const totalWords = essays.reduce(
    (sum, e) => sum + e.content.replace(/\s/g, '').length,
    0
  );

  const hasData = essays.length > 0 || drills.length > 0;

  // Radar: average snapshot across all essays
  const avgSnapshot: ThinkingSnapshot | null =
    essays.length > 0
      ? (() => {
          const sum = essays.reduce(
            (acc, e) => ({
              originality: acc.originality + e.snapshot.originality,
              reasoning: acc.reasoning + e.snapshot.reasoning,
              perspective: acc.perspective + e.snapshot.perspective,
              structure: acc.structure + e.snapshot.structure,
              language: acc.language + e.snapshot.language,
            }),
            { originality: 0, reasoning: 0, perspective: 0, structure: 0, language: 0 }
          );
          const n = essays.length;
          return {
            originality: Math.round((sum.originality / n) * 10) / 10,
            reasoning: Math.round((sum.reasoning / n) * 10) / 10,
            perspective: Math.round((sum.perspective / n) * 10) / 10,
            structure: Math.round((sum.structure / n) * 10) / 10,
            language: Math.round((sum.language / n) * 10) / 10,
          };
        })()
      : null;

  // Radar: average from training drills
  const drillSnapshot = calcDrillSnapshot(drills);

  // Merge: if both exist, weighted average (essays 0.7, drills 0.3)
  let finalSnapshot = avgSnapshot;
  if (avgSnapshot && drillSnapshot) {
    finalSnapshot = {
      originality: Math.round((avgSnapshot.originality * 0.7 + drillSnapshot.originality * 0.3) * 10) / 10,
      reasoning: Math.round((avgSnapshot.reasoning * 0.7 + drillSnapshot.reasoning * 0.3) * 10) / 10,
      perspective: Math.round((avgSnapshot.perspective * 0.7 + drillSnapshot.perspective * 0.3) * 10) / 10,
      structure: avgSnapshot.structure, // training doesn't cover structure
      language: avgSnapshot.language,   // training doesn't cover language
    };
  } else if (drillSnapshot) {
    finalSnapshot = drillSnapshot;
  }

  const radarData = finalSnapshot
    ? [
        { label: '立意', value: finalSnapshot.originality },
        { label: '推理', value: finalSnapshot.reasoning },
        { label: '视角', value: finalSnapshot.perspective },
        { label: '结构', value: finalSnapshot.structure },
        { label: '语言', value: finalSnapshot.language },
      ]
    : [];

  // Weekly trend: group essays by week
  const weeklyData: { label: string; count: number }[] = [];
  if (essays.length > 0) {
    const now = new Date();
    for (let w = 3; w >= 0; w--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - w * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const count = essays.filter(
        (e) => e.createdAt >= weekStart.getTime() && e.createdAt < weekEnd.getTime()
      ).length;
      const label = w === 0 ? '本周' : w === 1 ? '上周' : `${w}周前`;
      weeklyData.push({ label, count });
    }
  }
  const maxWeekly = Math.max(...weeklyData.map((w) => w.count), 1);

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

      {radarData.length > 0 && (
        <section className="my-section">
          <h3>能力雷达</h3>
          <div className="radar-section">
            <RadarChart data={radarData} size={180} />
            <div className="radar-legend">
              {radarData.map((d) => {
                const key = LABEL_TO_KEY[d.label];
                let trendDiff = 0;
                if (essays.length >= 2) {
                  const latest = essays[essays.length - 1].snapshot;
                  const prev = essays[essays.length - 2].snapshot;
                  trendDiff = Math.round((latest[key] - prev[key]) * 10) / 10;
                }
                return (
                  <div key={d.label} className="radar-legend-item">
                    <span className="rl-label">{d.label}</span>
                    <span className="rl-value">{d.value}</span>
                    {trendDiff > 0 && <span className="trend-up">↑{trendDiff.toFixed(1)}</span>}
                    {trendDiff < 0 && <span className="trend-down">↓{Math.abs(trendDiff).toFixed(1)}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {essays.length > 0 && (
        <section className="my-section">
          <h3>本周总结</h3>
          <div className="weekly-summary-card">
            <p className="weekly-summary-text">{generateWeeklySummary(essays)}</p>
          </div>
        </section>
      )}

      {weeklyData.length > 0 && (
        <section className="my-section">
          <h3>写作趋势</h3>
          <div className="weekly-chart">
            {weeklyData.map((w) => (
              <div key={w.label} className="weekly-bar-group">
                <div className="weekly-bar-wrap">
                  <div
                    className="weekly-bar"
                    style={{ height: `${(w.count / maxWeekly) * 100}%` }}
                  />
                </div>
                <span className="weekly-count">{w.count || ''}</span>
                <span className="weekly-label">{w.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

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
            <span className="fp-count">
              {drillCounts[type] || 0}
              {drillLastDate[type] && (
                <span className="fp-date">
                  {new Date(drillLastDate[type]!).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                </span>
              )}
            </span>
          </div>
        ))}
      </section>

      {detailEssay && (
        <div className={`recent-detail-overlay${isClosing ? ' overlay-closing' : ''}`} onClick={closeDetail}>
          <div className="recent-detail" onClick={(e) => e.stopPropagation()}>
            <button className="tu-back" onClick={closeDetail}>
              关闭
            </button>

            <h4 className="detail-topic">{detailEssay.topic}</h4>

            {detailEssay.preWriteMessages.length > 0 && (
              <div className="detail-section">
                <button className="detail-section-title" onClick={() => toggleSection('pre')}>
                  审题思考 {isOpen('pre') ? '▲' : '▼'}
                </button>
                {isOpen('pre') && (
                  <div className="detail-messages">
                    {detailEssay.preWriteMessages.map((msg) => (
                      <div key={msg.id} className={`detail-msg detail-msg-${msg.role}`}>
                        <span className="detail-msg-role">{msg.role === 'coach' ? '教练' : '我'}</span>
                        <p className="detail-msg-text" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(msg.content) }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="detail-section">
              <button className="detail-section-title" onClick={() => toggleSection('essay')}>
                作文 {isOpen('essay') ? '▲' : '▼'}
              </button>
              {isOpen('essay') && (
                <>
                  <div className="detail-essay-content">
                    {detailEssay.content.split('\n').map((para, i) => (
                      para.trim() && <p key={i} className="detail-para">{para}</p>
                    ))}
                  </div>
                  <span className="detail-word-count">{detailEssay.content.replace(/\s/g, '').length} 字</span>
                </>
              )}
            </div>

            {detailEssay.postWriteMessages.length > 0 && (
              <div className="detail-section">
                <button className="detail-section-title" onClick={() => toggleSection('post')}>
                  复盘对话 {isOpen('post') ? '▲' : '▼'}
                </button>
                {isOpen('post') && (
                  <div className="detail-messages">
                    {detailEssay.postWriteMessages.map((msg) => (
                      <div key={msg.id} className={`detail-msg detail-msg-${msg.role}`}>
                        <span className="detail-msg-role">{msg.role === 'coach' ? '教练' : '我'}</span>
                        <p className="detail-msg-text" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(msg.content) }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      </>
      )}

      <section className="data-management">
        <h3>数据管理</h3>
        <div className="dm-storage">
          <span>本地存储：{storageInfo.percent}% 已用</span>
          {storageInfo.percent > 80 && (
            <span className="dm-warning">存储空间不足，建议导出备份</span>
          )}
        </div>
        <div className="dm-actions">
          <button onClick={() => {
            const data = exportAllData();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `zuowen-backup-${new Date().toISOString().slice(0,10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}>
            导出数据
          </button>
          <label className="dm-import-btn">
            导入数据
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  const result = importAllData(reader.result as string);
                  alert(result.message);
                  if (result.success) window.location.reload();
                };
                reader.readAsText(file);
              }}
            />
          </label>
        </div>
      </section>

    </div>
  );
}
