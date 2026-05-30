import { useState } from 'react';
import type { Material, KnowledgeConcept } from '../types';
import materials from '../data/materials.json';
import conceptsData from '../data/knowledge/concepts.json';
import './ConceptMap.css';

const allMaterials = materials as Material[];
const concepts = conceptsData as KnowledgeConcept[];

interface ConceptMapProps {
  onSelectMaterial: (material: Material) => void;
  onBack: () => void;
}

export function ConceptMap({ onSelectMaterial, onBack }: ConceptMapProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="concept-map">
      <div className="cm-header">
        <button className="cm-back" onClick={onBack}>←</button>
        <h2>概念地图</h2>
      </div>

      <p className="cm-subtitle">15个核心概念，帮你建立思维框架</p>

      <div className="cm-list">
        {concepts.map(concept => (
          <div key={concept.id} className="cm-concept">
            <button
              className="cm-concept-header"
              onClick={() => setExpandedId(expandedId === concept.id ? null : concept.id)}
            >
              <div className="cm-concept-name">{concept.concept}</div>
              <div className="cm-concept-hook">{concept.hook}</div>
            </button>
            {expandedId === concept.id && (
              <div className="cm-concept-detail">
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
                      .filter(m => m.tags.some(t =>
                        concept.concept.includes(t) || t.includes(concept.concept)
                      ))
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
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
