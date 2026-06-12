import { useState, useMemo } from 'react';
import type { Material, MaterialCategory } from '../types';
import materials from '../data/materials.json';
import './MaterialsBrowse.css';

const allMaterials = materials as Material[];

const CATEGORIES: { key: MaterialCategory; label: string }[] = [
  { key: 'self-growth', label: '自我与成长' },
  { key: 'learning', label: '学习与教育' },
  { key: 'family', label: '家庭与代际' },
  { key: 'social', label: '友谊与社交' },
  { key: 'society', label: '社会与制度' },
  { key: 'tradition', label: '传统与文化' },
  { key: 'technology', label: '技术与人性' },
  { key: 'choice', label: '选择与价值' },
  { key: 'ethics', label: '道德与伦理' },
  { key: 'existence', label: '时间与存在' },
  { key: 'deep-water', label: '思辨深水区' },
];

interface MaterialsBrowseProps {
  onSelectMaterial: (material: Material) => void;
  onBack: () => void;
}

export function MaterialsBrowse({ onSelectMaterial, onBack }: MaterialsBrowseProps) {
  const [activeCategory, setActiveCategory] = useState<MaterialCategory | 'all'>('all');
  const [search, setSearch] = useState('');

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
    <div className="materials-browse">
      <div className="mb-header">
        <button className="mb-back" onClick={onBack}>←</button>
        <h2>全部素材</h2>
      </div>

      <input
        className="mb-search"
        type="text"
        placeholder="搜索素材关键词…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="mb-categories">
        <button
          className={`mb-category ${activeCategory === 'all' ? 'mb-category-active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          全部
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={`mb-category ${activeCategory === c.key ? 'mb-category-active' : ''}`}
            onClick={() => setActiveCategory(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mb-list">
        {filtered.map((m) => (
          <div
            key={m.id}
            className="card card-clickable"
            onClick={() => onSelectMaterial(m)}
          >
            <div className="card-title">{m.title}</div>
            <div className="card-desc">{m.coreTension}</div>
            <div className="card-tags">
              {m.tags.map(tag => (
                <span key={tag} className="card-tag">{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
