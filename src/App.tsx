import { useState, useCallback } from 'react';
import type { TabId } from './types';
import { TabBar } from './components/TabBar';
import { MaterialsPage } from './components/MaterialsPage';
import { TrainingPage } from './components/TrainingPage';
import { WritingDesk } from './components/WritingDesk';
import { MyPage } from './components/MyPage';
import { EssayLibrary } from './components/EssayLibrary';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('training');
  const [trainingScreen, setTrainingScreen] = useState<'main' | 'essays'>('main');

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
  }, []);

  const renderTrainingContent = () => {
    if (trainingScreen === 'essays') {
      return (
        <div>
          <button
            className="tp-detail-back"
            onClick={() => setTrainingScreen('main')}
          >
            ← 返回训练
          </button>
          <EssayLibrary onPractice={() => {
            setActiveTab('writing');
            setTrainingScreen('main');
          }} />
        </div>
      );
    }
    return (
      <TrainingPage
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
        <div className="tab-panel" data-active={activeTab === 'materials'} aria-hidden={activeTab !== 'materials'}>
          <ErrorBoundary fallbackTitle="素材模块出了点问题">
            <MaterialsPage onNavigateToTraining={() => setActiveTab('training')} />
          </ErrorBoundary>
        </div>
        <div className="tab-panel" data-active={activeTab === 'training'} aria-hidden={activeTab !== 'training'}>
          <ErrorBoundary fallbackTitle="训练模块出了点问题">
            {renderTrainingContent()}
          </ErrorBoundary>
        </div>
        <div className="tab-panel" data-active={activeTab === 'writing'} aria-hidden={activeTab !== 'writing'}>
          <ErrorBoundary fallbackTitle="写作模块出了点问题">
            <WritingDesk />
          </ErrorBoundary>
        </div>
        <div className="tab-panel" data-active={activeTab === 'me'} aria-hidden={activeTab !== 'me'}>
          <ErrorBoundary fallbackTitle="成长页出了点问题">
            <MyPage />
          </ErrorBoundary>
        </div>
      </main>
      <TabBar active={activeTab} onChange={handleTabChange} />
    </div>
  );
}

export default App;
