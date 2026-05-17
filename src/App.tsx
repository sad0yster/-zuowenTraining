import { useState, useCallback } from 'react';
import type { TabId, DrillType } from './types';
import { TabBar } from './components/TabBar';
import { MaterialsPage } from './components/MaterialsPage';
import { TrainingPage } from './components/TrainingPage';
import { WritingDesk } from './components/WritingDesk';
import { MyPage } from './components/MyPage';
import { EssayLibrary } from './components/EssayLibrary';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('training');
  const [trainingScreen, setTrainingScreen] = useState<'main' | 'essays'>('main');
  const [jumpDrill, setJumpDrill] = useState<DrillType | null>(null);
  const [jumpContext, setJumpContext] = useState<string>('');

  const handleJumpToDrill = useCallback((drillType: DrillType, context?: string) => {
    setJumpDrill(drillType);
    setJumpContext(context || '');
    setTrainingScreen('main');
    setActiveTab('training');
  }, []);

  const handleClearJump = useCallback(() => {
    setJumpDrill(null);
    setJumpContext('');
  }, []);

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
    setJumpDrill(null);
  }, []);

  const renderTrainingContent = () => {
    if (trainingScreen === 'essays') {
      return (
        <div>
          <button
            className="back-to-training"
            onClick={() => setTrainingScreen('main')}
            style={{
              padding: '4px 8px',
              border: 'none',
              background: 'none',
              fontSize: '16px',
              cursor: 'pointer',
              marginBottom: '12px',
            }}
          >
            ← 返回训练
          </button>
          <EssayLibrary />
        </div>
      );
    }
    return (
      <TrainingPage
        jumpToDrill={jumpDrill}
        jumpContext={jumpContext}
        onClearJump={handleClearJump}
        onOpenEssays={() => setTrainingScreen('essays')}
      />
    );
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>高分作文训练</h1>
      </header>
      <main className="app-main">
        {activeTab === 'materials' && (
          <MaterialsPage onJumpToDrill={handleJumpToDrill} />
        )}
        {activeTab === 'training' && renderTrainingContent()}
        {activeTab === 'writing' && <WritingDesk />}
        {activeTab === 'me' && <MyPage />}
      </main>
      <TabBar active={activeTab} onChange={handleTabChange} />
    </div>
  );
}

export default App;
