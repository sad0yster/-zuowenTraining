import { useState } from 'react';
import type { Material, MaterialCategory, DrillType } from '../types';
import materials from '../data/materials.json';
import { MaterialDetail } from './MaterialDetail';
import './MaterialsPage.css';

const allMaterials = materials as Material[];

const CATEGORIES: { key: MaterialCategory; label: string }[] = [
  { key: 'self-and-self', label: '我与自我' },
  { key: 'self-and-others', label: '我与他人' },
  { key: 'self-and-world', label: '我与世界' },
  { key: 'self-and-era', label: '我与时代' },
  { key: 'self-and-tradition', label: '我与传统' },
];

interface MaterialsPageProps {
  onJumpToDrill?: (drillType: DrillType, context?: string) => void;
}

export function MaterialsPage({ onJumpToDrill }: MaterialsPageProps) {
  const [activeCategory, setActiveCategory] = useState<MaterialCategory | 'all'>('all');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  if (selectedMaterial) {
    return (
      <MaterialDetail
        material={selectedMaterial}
        onBack={() => setSelectedMaterial(null)}
        onJumpToDrill={onJumpToDrill}
      />
    );
  }

  const filtered =
    activeCategory === 'all'
      ? allMaterials
      : allMaterials.filter((m) => m.category === activeCategory);

  return (
    <div className="materials-page">
      <h2>思辨素材</h2>
      <p className="materials-subtitle">用真实的情境激发真实的思考</p>

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
    </div>
  );
}
