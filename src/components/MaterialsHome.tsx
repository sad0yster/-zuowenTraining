import { useMemo } from 'react';
import type { Material, KnowledgeConcept } from '../types';
import materials from '../data/materials.json';
import conceptsData from '../data/knowledge/concepts.json';
import './MaterialsHome.css';

const allMaterials = materials as Material[];
const allConcepts = conceptsData as KnowledgeConcept[];

interface MaterialsHomeProps {
  onSelectMaterial: (material: Material) => void;
  onBrowseAll: () => void;
  onLearningPaths: () => void;
  onConceptMap: () => void;
}

export function MaterialsHome({ onSelectMaterial, onBrowseAll, onLearningPaths, onConceptMap }: MaterialsHomeProps) {
  // Compute stats
  const materialCount = allMaterials.length;
  const categoryCount = new Set(allMaterials.map(m => m.category)).size;
  const conceptCount = allConcepts.length;

  // Get today's pick (rotate daily based on date)
  const todayIndex = new Date().getDate() % allMaterials.length;
  const todaysPick = allMaterials[todayIndex];

  // Get recent learning from localStorage
  const recentMaterials = useMemo(() => {
    const saved = localStorage.getItem('zuowen_material_discussions');
    if (!saved) return [];
    const discussions = JSON.parse(saved);
    return discussions
      .slice(-3)
      .reverse()
      .map((d: any) => allMaterials.find(m => m.id === d.materialId))
      .filter(Boolean);
  }, []);

  return (
    <div className="materials-home">
      <div className="mh-header">
        <h2 className="page-title">思辨素材</h2>
        <p className="page-subtitle">用真实的情境激发真实的思考</p>
      </div>

      {/* Today's Pick */}
      <div className="mh-today" onClick={() => onSelectMaterial(todaysPick)}>
        <div className="mh-today-label">今日精选</div>
        <div className="mh-today-title">{todaysPick.title}</div>
        <div className="mh-today-tension">{todaysPick.coreTension}</div>
        <div className="mh-today-tags">
          {todaysPick.tags.map(tag => (
            <span key={tag} className="mh-tag">{tag}</span>
          ))}
        </div>
      </div>

      {/* Recent Learning */}
      {recentMaterials.length > 0 && (
        <div className="mh-recent">
          <div className="mh-section-label">最近学习</div>
          <div className="mh-recent-list">
            {recentMaterials.map((material: Material) => (
              <button
                key={material.id}
                className="mh-recent-item"
                onClick={() => onSelectMaterial(material)}
              >
                <span className="mh-recent-title">{material.title}</span>
                <span className="mh-recent-action">继续</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Entry Grid */}
      <div className="mh-grid">
        <button className="mh-entry" onClick={onBrowseAll}>
          <div className="mh-entry-title">全部素材</div>
          <div className="mh-entry-desc">{materialCount}个素材 · {categoryCount}个分类</div>
        </button>
        <button className="mh-entry" onClick={onLearningPaths}>
          <div className="mh-entry-title">学习路径</div>
          <div className="mh-entry-desc">系统化深入</div>
        </button>
        <button className="mh-entry" onClick={onConceptMap}>
          <div className="mh-entry-title">概念地图</div>
          <div className="mh-entry-desc">{conceptCount}个核心概念</div>
        </button>
        <button className="mh-entry" onClick={() => {
          const randomIndex = Math.floor(Math.random() * allMaterials.length);
          onSelectMaterial(allMaterials[randomIndex]);
        }}>
          <div className="mh-entry-title">随机探索</div>
          <div className="mh-entry-desc">换个角度看</div>
        </button>
      </div>
    </div>
  );
}
