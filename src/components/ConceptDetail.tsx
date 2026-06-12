import { useState, useEffect, useRef, useCallback } from 'react';
import type { Material, KnowledgeConcept } from '../types';
import conceptsData from '../data/knowledge/concepts.json';
import materialsData from '../data/materials.json';
import './ConceptDetail.css';

const concepts = conceptsData as KnowledgeConcept[];
const allMaterials = materialsData as Material[];

const DEPTH_LABELS: Record<number, { label: string; cls: string }> = {
  1: { label: '基础', cls: 'cd-depth--basic' },
  2: { label: '进阶', cls: 'cd-depth--intermediate' },
  3: { label: '深层', cls: 'cd-depth--deep' },
};

interface ConceptDetailProps {
  conceptId: string;
  onBack: () => void;
  onSelectMaterial: (material: Material) => void;
  onNavigateConcept: (conceptId: string) => void;
}

export function ConceptDetail({ conceptId, onBack, onSelectMaterial, onNavigateConcept }: ConceptDetailProps) {
  const concept = concepts.find(c => c.id === conceptId);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const scrollTop = el.scrollTop;
    const scrollHeight = el.scrollHeight - el.clientHeight;
    const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
    setScrollProgress(progress);
    setShowBackToTop(scrollTop > 300);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Reset scroll position when concept changes
  useEffect(() => {
    containerRef.current?.scrollTo(0, 0);
  }, [conceptId]);

  if (!concept) return null;

  const depthInfo = DEPTH_LABELS[concept.depthLevel ?? 0];

  // Split narrative into paragraphs
  const paragraphs = concept.narrative
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="concept-detail" ref={containerRef}>
      {/* Reading progress bar */}
      <div className="cd-progress-bar">
        <div className="cd-progress-fill" style={{ width: `${scrollProgress * 100}%` }} />
      </div>

      <div className="cd-header">
        <button className="cd-back" onClick={onBack}>←</button>
      </div>

      <div className="cd-title-area">
        <h1 className="cd-title">{concept.concept}</h1>
        {depthInfo && (
          <span className={`cd-depth ${depthInfo.cls}`}>{depthInfo.label}</span>
        )}
      </div>

      <p className="cd-hook">{concept.hook}</p>

      <div className="cd-narrative">
        {paragraphs.map((p, i) => {
          // Render --- as section dividers
          if (p === '---') {
            return <hr key={i} className="cd-divider" />;
          }
          return <p key={i} className="cd-paragraph" style={{ animationDelay: `${Math.min(i * 0.05, 0.5)}s` }}>{p}</p>;
        })}
      </div>

      {/* Back to top button */}
      {showBackToTop && (
        <button className="cd-back-to-top" onClick={scrollToTop} aria-label="返回顶部">
          ↑
        </button>
      )}

      {/* Source quotes */}
      {concept.meta.sourceQuotes.length > 0 && (
        <div className="cd-section">
          <h3 className="cd-section-title">经典引文</h3>
          <div className="cd-quotes">
            {concept.meta.sourceQuotes.map((q, i) => (
              <blockquote key={i} className="cd-quote">
                <p className="cd-quote-text">"{q.text}"</p>
                <cite className="cd-quote-source">——{q.source}</cite>
              </blockquote>
            ))}
          </div>
        </div>
      )}

      {/* Key concepts */}
      {concept.meta.keyConcepts.length > 0 && (
        <div className="cd-section">
          <h3 className="cd-section-title">核心概念</h3>
          <div className="cd-tags">
            {concept.meta.keyConcepts.map((kc, i) => (
              <span key={i} className="cd-tag">{kc}</span>
            ))}
          </div>
        </div>
      )}

      {/* Core tension */}
      {concept.meta.coreTension && (
        <div className="cd-section">
          <h3 className="cd-section-title">核心张力</h3>
          <p className="cd-tension">{concept.meta.coreTension}</p>
        </div>
      )}

      {/* Related materials */}
      {concept.relatedMaterials.length > 0 && (
        <div className="cd-section">
          <h3 className="cd-section-title">相关素材</h3>
          <div className="cd-related">
            {concept.relatedMaterials.map(mId => {
              const material = allMaterials.find(m => m.id === mId);
              if (!material) return null;
              return (
                <button
                  key={mId}
                  className="cd-related-item"
                  onClick={() => onSelectMaterial(material)}
                >
                  {material.title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Related concepts */}
      {concept.relatedConcepts && concept.relatedConcepts.length > 0 && (
        <div className="cd-section">
          <h3 className="cd-section-title">相关概念</h3>
          <div className="cd-related">
            {concept.relatedConcepts.map(rId => {
              const related = concepts.find(c => c.id === rId);
              if (!related) return null;
              return (
                <button
                  key={rId}
                  className="cd-related-item cd-related-item--concept"
                  onClick={() => onNavigateConcept(rId)}
                >
                  {related.concept}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
