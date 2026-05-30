import { useState } from 'react';
import type { Material, LearningPath as LearningPathType } from '../types';
import materials from '../data/materials.json';
import learningPathsData from '../data/learningPaths.json';
import './LearningPaths.css';

const allMaterials = materials as Material[];
const allPaths = learningPathsData as LearningPathType[];

interface LearningPathsProps {
  onSelectMaterial: (material: Material) => void;
  onBack: () => void;
}

export function LearningPaths({ onSelectMaterial, onBack }: LearningPathsProps) {
  const [activeTab, setActiveTab] = useState<'theme' | 'ability'>('theme');

  const themePaths = allPaths.filter(p => p.type === 'theme');
  const abilityPaths = allPaths.filter(p => p.type === 'ability');
  const currentPaths = activeTab === 'theme' ? themePaths : abilityPaths;

  return (
    <div className="learning-paths">
      <div className="lp-header">
        <button className="lp-back" onClick={onBack}>&#8592;</button>
        <h2>学习路径</h2>
      </div>

      <div className="lp-tabs">
        <button
          className={`lp-tab ${activeTab === 'theme' ? 'lp-tab-active' : ''}`}
          onClick={() => setActiveTab('theme')}
        >
          按主题
        </button>
        <button
          className={`lp-tab ${activeTab === 'ability' ? 'lp-tab-active' : ''}`}
          onClick={() => setActiveTab('ability')}
        >
          按能力
        </button>
      </div>

      <div className="lp-list">
        {currentPaths.map(path => (
          <div key={path.id} className="lp-path">
            <div className="lp-path-header">
              <div className="lp-path-name">{path.name}</div>
              <div className="lp-path-desc">{path.description}</div>
            </div>
            <div className="lp-materials">
              {path.materialIds.map(id => {
                const material = allMaterials.find(m => m.id === id);
                if (!material) return null;
                return (
                  <button
                    key={id}
                    className="lp-material"
                    onClick={() => onSelectMaterial(material)}
                  >
                    <span className="lp-material-title">{material.title}</span>
                    <span className="lp-material-tension">{material.coreTension}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
