import { useState } from 'react';
import type { Material, DrillType } from '../types';
import { MaterialsHome } from './MaterialsHome';
import { MaterialDetail } from './MaterialDetail';
import { MaterialsBrowse } from './MaterialsBrowse';
import { LearningPaths } from './LearningPaths';
import { ConceptMap } from './ConceptMap';
import { ConceptDetail } from './ConceptDetail';
import './MaterialsPage.css';

type MaterialsView = 'home' | 'detail' | 'browse' | 'paths' | 'concept-map' | 'concept-detail';

interface MaterialsPageProps {
  onNavigateToTraining?: (drillType: DrillType) => void;
}

export function MaterialsPage({ onNavigateToTraining }: MaterialsPageProps) {
  const [view, setView] = useState<MaterialsView>('home');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);

  const handleSelectMaterial = (material: Material) => {
    setSelectedMaterial(material);
    setView('detail');
  };

  const handleSelectConcept = (conceptId: string) => {
    setSelectedConceptId(conceptId);
    setView('concept-detail');
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
        onNavigateToTraining={onNavigateToTraining}
        onSelectMaterial={handleSelectMaterial}
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

  if (view === 'concept-detail' && selectedConceptId) {
    return (
      <ConceptDetail
        conceptId={selectedConceptId}
        onBack={() => setView('concept-map')}
        onSelectMaterial={handleSelectMaterial}
        onNavigateConcept={handleSelectConcept}
      />
    );
  }

  if (view === 'concept-map') {
    return (
      <ConceptMap
        onSelectConcept={handleSelectConcept}
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
