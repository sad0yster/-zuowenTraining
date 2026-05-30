import { useState } from 'react';
import type { Material } from '../types';
import { MaterialsHome } from './MaterialsHome';
import { MaterialDetail } from './MaterialDetail';
import './MaterialsPage.css';

type MaterialsView = 'home' | 'detail' | 'browse' | 'paths' | 'concept-map';

export function MaterialsPage() {
  const [view, setView] = useState<MaterialsView>('home');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const handleSelectMaterial = (material: Material) => {
    setSelectedMaterial(material);
    setView('detail');
  };

  const handleBack = () => {
    setSelectedMaterial(null);
    setView('home');
  };

  if (view === 'detail' && selectedMaterial) {
    return (
      <MaterialDetail
        material={selectedMaterial}
        onBack={handleBack}
      />
    );
  }

  // For now, other views just show home
  // In future tasks, we'll implement browse, paths, and concept-map views
  return (
    <MaterialsHome
      onSelectMaterial={handleSelectMaterial}
      onBrowseAll={() => setView('browse')}
      onLearningPaths={() => setView('paths')}
      onConceptMap={() => setView('concept-map')}
    />
  );
}
