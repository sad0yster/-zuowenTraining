import { useState } from 'react';
import type { Material } from '../types';
import { MaterialsHome } from './MaterialsHome';
import { MaterialDetail } from './MaterialDetail';
import { MaterialsBrowse } from './MaterialsBrowse';
import { LearningPaths } from './LearningPaths';
import { ConceptMap } from './ConceptMap';
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

  if (view === 'browse') {
    return (
      <MaterialsBrowse
        onSelectMaterial={handleSelectMaterial}
        onBack={() => setView('home')}
      />
    );
  }

  if (view === 'paths') {
    return (
      <LearningPaths
        onSelectMaterial={handleSelectMaterial}
        onBack={() => setView('home')}
      />
    );
  }

  if (view === 'concept-map') {
    return (
      <ConceptMap
        onSelectMaterial={handleSelectMaterial}
        onBack={() => setView('home')}
      />
    );
  }

  return (
    <MaterialsHome
      onSelectMaterial={handleSelectMaterial}
      onBrowseAll={() => setView('browse')}
      onLearningPaths={() => setView('paths')}
      onConceptMap={() => setView('concept-map')}
    />
  );
}
