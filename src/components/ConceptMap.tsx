import { useState, useMemo } from 'react';
import type { KnowledgeConcept, ConceptTheme } from '../types';
import conceptsData from '../data/knowledge/concepts.json';
import themesData from '../data/knowledge/themes.json';
import './ConceptMap.css';

const concepts = conceptsData as KnowledgeConcept[];
const themes = themesData as ConceptTheme[];

// SVG icon components
const ICONS: Record<string, JSX.Element> = {
  user: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    </svg>
  ),
  clock: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  handshake: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 17a4 4 0 0 1-4-4V7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6" />
      <path d="M15 13a4 4 0 0 1 4 4v2a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-6" />
      <path d="M8 11h8" />
    </svg>
  ),
  scale: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18" />
      <path d="M5 7l7-4 7 4" />
      <path d="M5 7v3a7 7 0 0 0 3.5 6" />
      <path d="M19 7v3a7 7 0 0 1-3.5 6" />
    </svg>
  ),
  flame: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 12c0-3 2.5-6 2.5-6s2.5 3 2.5 6-2.5 6-2.5 6-2.5-3-2.5-6z" />
      <path d="M8.5 16c0-2-1.5-4-1.5-4s-1.5 2-1.5 4 1.5 4 1.5 4 1.5-2 1.5-4z" />
      <path d="M15.5 16c0-2 1.5-4 1.5-4s1.5 2 1.5 4-1.5 4-1.5 4-1.5-2-1.5-4z" />
    </svg>
  ),
};

function ThemeIcon({ icon }: { icon: string }) {
  return <span className="cm-theme-icon">{ICONS[icon] || null}</span>;
}

interface ConceptMapProps {
  onSelectConcept: (conceptId: string) => void;
  onBack: () => void;
}

const DEPTH_LABELS: Record<number, { label: string; cls: string }> = {
  1: { label: '基础', cls: 'cm-depth-badge--basic' },
  2: { label: '进阶', cls: 'cm-depth-badge--intermediate' },
  3: { label: '深层', cls: 'cm-depth-badge--deep' },
};

function getDepthInfo(level?: number) {
  if (!level || !DEPTH_LABELS[level]) return null;
  return DEPTH_LABELS[level];
}

function getThemeDepthSummary(themeConcepts: KnowledgeConcept[]) {
  const counts = { 1: 0, 2: 0, 3: 0 };
  for (const c of themeConcepts) {
    if (c.depthLevel && counts[c.depthLevel as keyof typeof counts] !== undefined) {
      counts[c.depthLevel as keyof typeof counts]++;
    }
  }
  const parts: string[] = [];
  if (counts[1]) parts.push(`${counts[1]} 基础`);
  if (counts[2]) parts.push(`${counts[2]} 进阶`);
  if (counts[3]) parts.push(`${counts[3]} 深层`);
  return parts.length > 0 ? parts.join(' · ') : null;
}

export function ConceptMap({ onSelectConcept, onBack }: ConceptMapProps) {
  const [view, setView] = useState<'themes' | { themeId: string }>('themes');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Group concepts by theme
  const conceptsByTheme = useMemo(() => {
    const map = new Map<string, KnowledgeConcept[]>();
    for (const concept of concepts) {
      const list = map.get(concept.theme) ?? [];
      list.push(concept);
      map.set(concept.theme, list);
    }
    return map;
  }, []);

  // Level 1: Theme overview
  if (view === 'themes') {
    return (
      <div className="concept-map">
        <div className="cm-header">
          <button className="cm-back" onClick={onBack}>←</button>
          <h2>概念地图</h2>
        </div>
        <p className="cm-subtitle">按写作主题组织，帮你建立系统思维框架</p>
        <div className="cm-theme-grid">
          {themes.map(theme => {
            const themeConcepts = conceptsByTheme.get(theme.id) ?? [];
            const count = themeConcepts.length;
            const depthSummary = getThemeDepthSummary(themeConcepts);
            return (
              <button
                key={theme.id}
                className="cm-theme-card"
                onClick={() => {
                  setView({ themeId: theme.id });
                  setExpandedId(null);
                }}
              >
                <div className="cm-theme-icon-wrapper">
                  <ThemeIcon icon={theme.icon} />
                </div>
                <div className="cm-theme-info">
                  <div className="cm-theme-name">{theme.name}</div>
                  <div className="cm-theme-desc">{theme.description}</div>
                </div>
                <div className="cm-theme-meta">
                  <span className="cm-theme-count">{count} 个概念</span>
                  {depthSummary && <span className="cm-theme-depth-summary">{depthSummary}</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Level 2 & 3: Theme detail with accordion concepts
  const currentTheme = themes.find(t => t.id === view.themeId);
  const themeConcepts = conceptsByTheme.get(view.themeId) ?? [];

  return (
    <div className="concept-map">
      <div className="cm-header">
        <button className="cm-back" onClick={() => setView('themes')}>←</button>
        <h2>{currentTheme?.name ?? '概念地图'}</h2>
      </div>
      {currentTheme && (
        <p className="cm-subtitle">{currentTheme.description}</p>
      )}
      <div className="cm-list">
        {themeConcepts.map(concept => {
          const depthInfo = getDepthInfo(concept.depthLevel);
          return (
          <div key={concept.id} className="cm-concept">
            <button
              className="cm-concept-header"
              aria-expanded={expandedId === concept.id}
              aria-controls={`detail-${concept.id}`}
              onClick={() => setExpandedId(expandedId === concept.id ? null : concept.id)}
            >
              <div className="cm-concept-header-text">
                <div className="cm-concept-name-row">
                  <span className="cm-concept-name">{concept.concept}</span>
                  {depthInfo && (
                    <span className={`cm-depth-badge ${depthInfo.cls}`}>
                      {depthInfo.label}
                    </span>
                  )}
                </div>
                <div className="cm-concept-hook">{concept.hook}</div>
              </div>
              <span className={`cm-chevron ${expandedId === concept.id ? 'cm-chevron--expanded' : ''}`} />
            </button>
            <div id={`detail-${concept.id}`} className={`cm-concept-detail ${expandedId === concept.id ? 'cm-concept-detail--expanded' : ''}`}>
                {concept.meta.coreTension && (
                  <div className="cm-detail-section">
                    <div className="cm-detail-label">核心张力</div>
                    <div className="cm-detail-text">{concept.meta.coreTension}</div>
                  </div>
                )}
                {concept.meta.sourceQuotes.length > 0 && (
                  <div className="cm-detail-section">
                    <div className="cm-detail-label">经典引文</div>
                    <div className="cm-examples">
                      {concept.meta.sourceQuotes.slice(0, 2).map((q, i) => (
                        <div key={i} className="cm-example">
                          <span className="cm-example-text">"{q.text}"</span>
                          <span className="cm-example-type">{q.source}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {concept.narrative && (
                  <button
                    className="cm-read-more"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectConcept(concept.id);
                    }}
                  >
                    阅读全文 →
                  </button>
                )}
              </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
