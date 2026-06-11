import { useState, useMemo } from 'react';
import type { Question, SpeculativeType } from '../types';
import { loadEssays } from '../services/storageService';
import questions from '../data/questions.json';
import './TopicInput.css';

const allQuestions = questions as Question[];

function getRecommendedQuestions(): Question[] {
  const essays = loadEssays();
  const practicedIds = new Set(essays.map((e) => e.questionId).filter(Boolean));
  const practicedTypes = new Set(essays.map((e) => {
    const q = allQuestions.find((q) => q.id === e.questionId);
    return q?.speculativeType;
  }).filter(Boolean));
  const practicedTags = new Set(essays.flatMap((e) => {
    const q = allQuestions.find((q) => q.id === e.questionId);
    return q?.tags || [];
  }));

  // Score each question: prefer unpracticed types, unpracticed tags, not already done
  const scored = allQuestions
    .filter((q) => !practicedIds.has(q.id))
    .map((q) => {
      let score = 0;
      if (!practicedTypes.has(q.speculativeType)) score += 3;
      const newTags = q.tags.filter((t) => !practicedTags.has(t));
      score += newTags.length;
      return { q, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 3).map((s) => s.q);
}

interface TopicInputProps {
  onConfirm: (topic: string, questionId: string | null) => void;
}

export function TopicInput({ onConfirm }: TopicInputProps) {
  const [mode, setMode] = useState<'pick' | 'custom'>('pick');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customTopic, setCustomTopic] = useState('');
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<SpeculativeType | ''>('');
  const [filterDifficulty, setFilterDifficulty] = useState<number | ''>('');
  const [filterTag, setFilterTag] = useState('');
  const recommended = useMemo(getRecommendedQuestions, []);

  const popularTags = useMemo(() => {
    const tagCount = new Map<string, number>();
    allQuestions.forEach(q => q.tags.forEach(t => tagCount.set(t, (tagCount.get(t) || 0) + 1)));
    return [...tagCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t]) => t);
  }, []);

  const filteredQuestions = useMemo(() => {
    return allQuestions.filter(q => {
      if (searchText && !q.text.includes(searchText) && !q.source.includes(searchText)) return false;
      if (filterType && q.speculativeType !== filterType) return false;
      if (filterDifficulty && q.difficulty !== filterDifficulty) return false;
      if (filterTag && !q.tags.includes(filterTag)) return false;
      return true;
    });
  }, [searchText, filterType, filterDifficulty, filterTag]);

  const clearFilters = () => {
    setSearchText('');
    setFilterType('');
    setFilterDifficulty('');
    setFilterTag('');
  };

  const hasFilters = searchText || filterType || filterDifficulty || filterTag;

  // Temporarily reference these to avoid noUnusedLocals errors until Task 4 JSX uses them
  void popularTags;
  void filteredQuestions;
  void clearFilters;
  void hasFilters;

  const handleStart = () => {
    if (mode === 'pick' && selectedId) {
      const q = allQuestions.find((q) => q.id === selectedId);
      if (q) onConfirm(q.text, q.id);
    } else if (mode === 'custom' && customTopic.trim()) {
      onConfirm(customTopic.trim(), null);
    }
  };

  return (
    <div className="topic-input">
      <h2 className="page-title">今天想写什么题目？</h2>
      <div className="mode-toggle">
        <button
          className={mode === 'pick' ? 'active' : ''}
          onClick={() => setMode('pick')}
        >
          从题库选
        </button>
        <button
          className={mode === 'custom' ? 'active' : ''}
          onClick={() => setMode('custom')}
        >
          自己输入
        </button>
      </div>

      {mode === 'pick' && (
        <div className="question-list">
          {recommended.length > 0 && (
            <div className="recommend-section">
              <span className="recommend-label">推荐练笔</span>
              {recommended.map((q) => (
                <div
                  key={q.id}
                  className={`card card-clickable ${selectedId === q.id ? 'selected' : ''}`}
                  onClick={() => setSelectedId(q.id)}
                >
                  <p className="card-desc">{q.text.slice(0, 80)}...</p>
                  <div className="card-tags">
                    <span className="card-tag">
                      {q.speculativeType === 'single' ? '一元' : q.speculativeType === 'binary' ? '二元' : '三元'}
                    </span>
                    <span className="card-tag">{q.tags[0]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {allQuestions.map((q) => (
            <div
              key={q.id}
              className={`card card-clickable ${selectedId === q.id ? 'selected' : ''}`}
              onClick={() => setSelectedId(q.id)}
            >
              <p className="card-desc">{q.text.slice(0, 80)}...</p>
              <div className="card-tags">
                <span className="card-tag">
                  {q.difficulty === 1
                    ? '基础'
                    : q.difficulty === 2
                      ? '进阶'
                      : '挑战'}
                </span>
                <span className="card-tag">{q.tags[0]}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {mode === 'custom' && (
        <textarea
          className="form-textarea"
          placeholder="输入或粘贴作文题目..."
          value={customTopic}
          onChange={(e) => setCustomTopic(e.target.value)}
          rows={4}
        />
      )}

      <button
        className="btn-primary btn-full"
        disabled={mode === 'pick' ? !selectedId : !customTopic.trim()}
        onClick={handleStart}
      >
        开始写作
      </button>
    </div>
  );
}
