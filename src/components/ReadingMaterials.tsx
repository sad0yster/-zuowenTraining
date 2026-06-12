import { useState, useMemo, useRef, useCallback } from 'react';
import type { ReadingMaterial, ReadingMaterialType, Material } from '../types';
import readingMaterialsData from '../data/readingMaterials.json';
import materialsData from '../data/materials.json';
import { Collapse } from './Collapse';
import './ReadingMaterials.css';

const allReadingMaterials = readingMaterialsData as ReadingMaterial[];
const allMaterials = materialsData as Material[];

const typeLabels: Record<ReadingMaterialType, string> = {
  philosophy: '哲学观点',
  case: '现实案例',
  history: '历史典故',
  data: '数据事实',
};

const filterTabs = ['all', 'philosophy', 'case', 'history', 'data'] as const;

interface ReadingMaterialsProps {
  materialId: string;
  onSelectMaterial?: (material: Material) => void;
}

export function ReadingMaterials({ materialId, onSelectMaterial }: ReadingMaterialsProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [activeType, setActiveType] = useState<ReadingMaterialType | 'all'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const materials = useMemo(
    () => allReadingMaterials.filter(rm => rm.materialId === materialId),
    [materialId]
  );

  const materialIds = useMemo(
    () => new Set(materials.map(rm => rm.id)),
    [materials]
  );

  const handleNavigateToMaterial = useCallback((targetMaterialId: string) => {
    const targetMaterial = allMaterials.find(m => m.id === targetMaterialId);
    if (targetMaterial && onSelectMaterial) {
      onSelectMaterial(targetMaterial);
    }
  }, [onSelectMaterial]);

  const filteredMaterials = useMemo(
    () => (activeType === 'all' ? materials : materials.filter(rm => rm.type === activeType)),
    [materials, activeType]
  );

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleCopy = useCallback((rm: ReadingMaterial) => {
    navigator.clipboard.writeText(rm.content).then(() => {
      setCopiedId(rm.id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }, []);

  const scrollToCard = useCallback((id: string) => {
    const el = cardRefs.current.get(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setExpandedIds(prev => new Set(prev).add(id));
    }
  }, []);

  if (materials.length === 0) return null;

  const showFilterTabs = materials.length >= 3;

  return (
    <div className="reading-materials">
      <div className="rm-label">
        延伸阅读 <span className="rm-count">{materials.length}篇</span>
      </div>

      {showFilterTabs && (
        <div className="rm-type-tabs">
          {filterTabs.map(t => (
            <button
              key={t}
              className={`rm-type-tab ${activeType === t ? 'rm-type-tab-active' : ''}`}
              onClick={() => setActiveType(t)}
            >
              {t === 'all' ? '全部' : typeLabels[t]}
            </button>
          ))}
        </div>
      )}

      <div className="rm-list">
        {filteredMaterials.map(rm => (
          <div
            key={rm.id}
            className="rm-card"
            ref={el => {
              if (el) {
                cardRefs.current.set(rm.id, el);
              }
            }}
          >
            <div className="rm-tags">
              <span className="rm-type-tag">{typeLabels[rm.type]}</span>
              {rm.quotable && <span className="rm-quotable-tag">可直接引用</span>}
            </div>
            <div className="rm-title">{rm.title}</div>
            <div className="rm-key-insight">{rm.keyInsight}</div>
            <Collapse isOpen={expandedIds.has(rm.id)}>
              <div className="rm-content">{rm.content}</div>
              {rm.source && <div className="rm-source">来源：{rm.source}</div>}
              {rm.quotable && (
                <button className="rm-copy-btn" onClick={() => handleCopy(rm)}>
                  {copiedId === rm.id ? '已复制 ✓' : '复制引文'}
                </button>
              )}
              {rm.relatedRmIds && rm.relatedRmIds.length > 0 && (() => {
                const validRelated = rm.relatedRmIds
                  .filter(rid => materialIds.has(rid))
                  .map(rid => allReadingMaterials.find(r => r.id === rid))
                  .filter(Boolean) as ReadingMaterial[];
                const crossMaterialRelated = rm.relatedRmIds
                  .filter(rid => !materialIds.has(rid))
                  .map(rid => {
                    const readingMaterial = allReadingMaterials.find(r => r.id === rid);
                    if (readingMaterial) {
                      const material = allMaterials.find(m => m.id === readingMaterial.materialId);
                      return material ? { material, readingMaterial } : null;
                    }
                    return null;
                  })
                  .filter(Boolean) as { material: Material; readingMaterial: ReadingMaterial }[];
                const hasRelated = validRelated.length > 0 || crossMaterialRelated.length > 0;
                return hasRelated ? (
                  <div className="rm-related">
                    <span className="rm-related-label">相关阅读：</span>
                    {validRelated.map(related => (
                      <button
                        key={related.id}
                        className="rm-related-link"
                        onClick={() => scrollToCard(related.id)}
                      >
                        {related.title}
                      </button>
                    ))}
                    {crossMaterialRelated.map(({ material, readingMaterial }) => (
                      <button
                        key={readingMaterial.id}
                        className="rm-related-link rm-related-cross"
                        onClick={() => handleNavigateToMaterial(material.id)}
                        title={`跳转到：${material.title}`}
                      >
                        {readingMaterial.title}
                      </button>
                    ))}
                  </div>
                ) : null;
              })()}
            </Collapse>
            <button className="rm-expand-btn" onClick={() => toggleExpand(rm.id)}>
              {expandedIds.has(rm.id) ? '收起' : '展开全文'}
            </button>
          </div>
        ))}
      </div>

      <div className="rm-usage-hint">
        <div className="rm-usage-label">作文素材提示</div>
        <div className="rm-usage-text">
          以上材料可直接用于{materials[0]?.usageHint || '相关主题'}的作文论证
        </div>
      </div>
    </div>
  );
}
