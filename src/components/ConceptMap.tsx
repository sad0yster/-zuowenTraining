import { useState, useMemo } from 'react';
import type { Material, KnowledgeConcept, ConceptTheme } from '../types';
import materials from '../data/materials.json';
import conceptsData from '../data/knowledge/concepts.json';
import themesData from '../data/knowledge/themes.json';
import './ConceptMap.css';

const allMaterials = materials as Material[];
const concepts = conceptsData as KnowledgeConcept[];
const themes = themesData as ConceptTheme[];

interface ConceptMapProps {
  onSelectMaterial: (material: Material) => void;
  onBack: () => void;
}

export function ConceptMap({ onSelectMaterial, onBack }: ConceptMapProps) {
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

  // Navigate to a related concept (may be in a different theme)
  const navigateToConcept = (conceptId: string) => {
    const target = concepts.find(c => c.id === conceptId);
    if (!target) return;
    setView({ themeId: target.theme });
    setExpandedId(conceptId);
  };

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
            const count = conceptsByTheme.get(theme.id)?.length ?? 0;
            return (
              <button
                key={theme.id}
                className="cm-theme-card"
                onClick={() => {
                  setView({ themeId: theme.id });
                  setExpandedId(null);
                }}
              >
                <span className="cm-theme-icon">{theme.icon}</span>
                <div className="cm-theme-info">
                  <div className="cm-theme-name">{theme.name}</div>
                  <div className="cm-theme-desc">{theme.description}</div>
                </div>
                <span className="cm-theme-count">{count} 个概念</span>
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
        {themeConcepts.map(concept => (
          <div key={concept.id} className="cm-concept">
            <button
              className="cm-concept-header"
              aria-expanded={expandedId === concept.id}
              aria-controls={`detail-${concept.id}`}
              onClick={() => setExpandedId(expandedId === concept.id ? null : concept.id)}
            >
              <div className="cm-concept-header-text">
                <div className="cm-concept-name">{concept.concept}</div>
                <div className="cm-concept-hook">{concept.hook}</div>
              </div>
              <span className={`cm-chevron ${expandedId === concept.id ? 'cm-chevron--expanded' : ''}`} />
            </button>
            <div id={`detail-${concept.id}`} className={`cm-concept-detail ${expandedId === concept.id ? 'cm-concept-detail--expanded' : ''}`}>
                <div className="cm-detail-section">
                  <div className="cm-detail-label">分析句式</div>
                  <div className="cm-detail-text">{concept.analysisTpl}</div>
                </div>
                <div className="cm-detail-section">
                  <div className="cm-detail-label">示例</div>
                  <div className="cm-examples">
                    {concept.examples.map((ex, i) => (
                      <div key={i} className="cm-example">
                        <span className="cm-example-type">
                          {ex.type === 'daily' ? '日常' : '论据'}
                        </span>
                        <span className="cm-example-text">{ex.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="cm-detail-section">
                  <div className="cm-detail-label">相关素材</div>
                  <div className="cm-related">
                    {allMaterials
                      .filter(m => {
                        if (concept.relatedMaterials?.includes(m.id)) return true;
                        const searchText = [...m.tags, m.title, m.coreTension].join(' ').toLowerCase();
                        return concept.applicableTo?.some(a => searchText.includes(a.toLowerCase()));
                      })
                      .slice(0, 3)
                      .map(m => (
                        <button
                          key={m.id}
                          className="cm-related-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectMaterial(m);
                          }}
                        >
                          {m.title}
                        </button>
                      ))
                    }
                  </div>
                </div>
                {concept.relatedConcepts && concept.relatedConcepts.length > 0 && (
                  <div className="cm-detail-section">
                    <div className="cm-detail-label">相关概念</div>
                    <div className="cm-related">
                      {concept.relatedConcepts.map(relatedId => {
                        const related = concepts.find(c => c.id === relatedId);
                        if (!related) return null;
                        return (
                          <button
                            key={relatedId}
                            className="cm-related-item cm-related-item--concept"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateToConcept(relatedId);
                            }}
                          >
                            {related.concept}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
          </div>
        ))}
      </div>
    </div>
  );
}
