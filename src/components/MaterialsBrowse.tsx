import { useState, useMemo } from 'react';
import type { Material, MaterialCategory } from '../types';
import materials from '../data/materials.json';
import './MaterialsBrowse.css';

const allMaterials = materials as Material[];

const CATEGORIES: { key: MaterialCategory; label: string }[] = [
  { key: 'self-and-self', label: '我与自我' },
  { key: 'self-and-others', label: '我与他人' },
  { key: 'self-and-world', label: '我与世界' },
  { key: 'self-and-era', label: '我与时代' },
  { key: 'self-and-tradition', label: '我与传统' },
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
          <button
            key={m.id}
            className="mb-card"
            onClick={() => onSelectMaterial(m)}
          >
            <div className="mb-card-title">{m.title}</div>
            <div className="mb-card-tension">{m.coreTension}</div>
            <div className="mb-card-tags">
              {m.tags.map(tag => (
                <span key={tag} className="mb-tag">{tag}</span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
