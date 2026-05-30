import { useState } from 'react';
import type { ReadingMaterial } from '../types';
import readingMaterialsData from '../data/readingMaterials.json';
import './ReadingMaterials.css';

const allReadingMaterials = readingMaterialsData as ReadingMaterial[];

interface ReadingMaterialsProps {
  materialId: string;
}

export function ReadingMaterials({ materialId }: ReadingMaterialsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const materials = allReadingMaterials.filter(rm => rm.materialId === materialId);

  if (materials.length === 0) return null;

  const typeLabels: Record<string, string> = {
    philosophy: '哲学观点',
    case: '现实案例',
    history: '历史典故',
    data: '数据事实',
  };

  return (
    <div className="reading-materials">
      <div className="rm-label">延伸阅读</div>
      <div className="rm-list">
        {materials.map(rm => (
          <div key={rm.id} className="rm-card">
            <div className="rm-tags">
              <span className="rm-type-tag">{typeLabels[rm.type]}</span>
              {rm.quotable && <span className="rm-quotable-tag">可直接引用</span>}
            </div>
            <div className="rm-title">{rm.title}</div>
            <div className="rm-content">
              {expandedId === rm.id ? rm.content : rm.content.slice(0, 100) + '...'}
            </div>
            {rm.content.length > 100 && (
              <button
                className="rm-expand-btn"
                onClick={() => setExpandedId(expandedId === rm.id ? null : rm.id)}
              >
                {expandedId === rm.id ? '收起' : '展开全文'}
              </button>
            )}
            {rm.source && <div className="rm-source">来源：{rm.source}</div>}
          </div>
        ))}
      </div>
      <div className="rm-usage-hint">
        <div className="rm-usage-label">作文素材提示</div>
        <div className="rm-usage-text">
          以上材料可直接用于{materials[0]?.usageHint?.split('可用于')[1] || '相关主题'}的作文论证
        </div>
      </div>
    </div>
  );
}
