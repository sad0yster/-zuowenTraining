import { useState, useMemo } from 'react';
import type { Material, MaterialCategory, KnowledgeConcept } from '../types';
import materials from '../data/materials.json';
import conceptsData from '../data/knowledge/concepts.json';
import { MaterialDetail } from './MaterialDetail';
import { Collapse } from './Collapse';
import './MaterialsPage.css';

const allMaterials = materials as Material[];
const concepts = conceptsData as KnowledgeConcept[];

const CATEGORIES: { key: MaterialCategory; label: string }[] = [
  { key: 'self-and-self', label: '我与自我' },
  { key: 'self-and-others', label: '我与他人' },
  { key: 'self-and-world', label: '我与世界' },
  { key: 'self-and-era', label: '我与时代' },
  { key: 'self-and-tradition', label: '我与传统' },
];

export function MaterialsPage() {
  const [activeCategory, setActiveCategory] = useState<MaterialCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [showConcepts, setShowConcepts] = useState(false);
  const [expandedConcept, setExpandedConcept] = useState<string | null>(null);

  if (selectedMaterial) {
    return (
      <MaterialDetail
        material={selectedMaterial}
        onBack={() => setSelectedMaterial(null)}
      />
    );
  }

  const filtered = useMemo(() => {
    let list = allMaterials;
    if (activeCategory !== 'all') {
      list = list.filter((m) => m.category === activeCategory);
    }
    if (search.trim()) {
      const kw = search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(kw) ||
          m.coreTension.toLowerCase().includes(kw) ||
          m.tags.some((t) => t.toLowerCase().includes(kw)) ||
          m.situation.toLowerCase().includes(kw)
      );
    }
    return list;
  }, [activeCategory, search]);

  return (
    <div className="materials-page">
      <h2>思辨素材</h2>
      <p className="materials-subtitle">用真实的情境激发真实的思考</p>

      <div className="concept-map-section">
        <button
          className="concept-map-toggle"
          onClick={() => setShowConcepts(!showConcepts)}
        >
          {showConcepts ? '收起概念地图 ▲' : '概念地图（15个核心概念）▼'}
        </button>
        <Collapse isOpen={showConcepts}>
          <div className="concept-map-list">
            {concepts.map((c) => (
              <div key={c.id} className="concept-map-item">
                <button
                  className="concept-map-name"
                  onClick={() => setExpandedConcept(expandedConcept === c.id ? null : c.id)}
                >
                  <span className="concept-map-label">{c.concept}</span>
                  <span className="concept-map-hook">{c.hook}</span>
                </button>
                <Collapse isOpen={expandedConcept === c.id}>
                  <div className="concept-map-detail">
                    <p className="concept-map-tpl-label">分析句式</p>
                    <p className="concept-map-tpl">{c.analysisTpl}</p>
                    {c.examples.map((ex, i) => (
                      <div key={i} className="concept-map-example">
                        <span className="concept-map-ex-type">
                          {ex.type === 'daily' ? '日常' : '论据'}
                        </span>
                        <span className="concept-map-ex-text">{ex.text}</span>
                      </div>
                    ))}
                  </div>
                </Collapse>
              </div>
            ))}
          </div>
        </Collapse>
      </div>

      <input
        className="mat-search"
        type="text"
        placeholder="搜索素材关键词…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="category-scroll">
        <button
          className={`cat-chip ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          全部
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={`cat-chip ${activeCategory === c.key ? 'active' : ''}`}
            onClick={() => setActiveCategory(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mat-empty">没有匹配的素材</p>
      ) : (
        <div className="material-list">
          {filtered.map((m) => (
            <button
              key={m.id}
              className="material-card"
              onClick={() => setSelectedMaterial(m)}
            >
              <span className="mat-title">{m.title}</span>
              <span className="mat-hook">{m.coreTension}</span>
              <span className="mat-tags">
                {m.linkedDrills.map((d) => (
                  <span key={d} className="mat-tag">{d}</span>
                ))}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
