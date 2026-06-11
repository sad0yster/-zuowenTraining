import { useState, useMemo } from 'react';
import type { Question, SpeculativeType, QuestionTheme } from '../types';
import { loadEssays } from '../services/storageService';
import questions from '../data/questions.json';
import './TopicInput.css';

const allQuestions = questions as Question[];

const THEMES: QuestionTheme[] = ['科技', '人文', '社会', '成长', '文化', '价值', '自我', '时代'];
const TYPES: SpeculativeType[] = ['single', 'binary', 'ternary'];

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
  const [showFilters, setShowFilters] = useState(false);
  const [selectedThemes, setSelectedThemes] = useState<QuestionTheme[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<SpeculativeType[]>([]);
  const recommended = useMemo(getRecommendedQuestions, []);
  const hasFilters = searchText || selectedThemes.length > 0 || selectedTypes.length > 0;

  const filteredQuestions = useMemo(() => {
    const recommendedIds = new Set(recommended.map(q => q.id));
    return allQuestions.filter(q => {
      if (!hasFilters && recommendedIds.has(q.id)) return false;
      if (searchText && !q.text.includes(searchText) && !q.source.includes(searchText)) return false;
      if (selectedThemes.length > 0 && !selectedThemes.includes(q.theme)) return false;
      if (selectedTypes.length > 0 && !selectedTypes.includes(q.speculativeType)) return false;
      return true;
    });
  }, [searchText, selectedThemes, selectedTypes, recommended, hasFilters]);

  const toggleTheme = (theme: QuestionTheme) => {
    setSelectedThemes(prev =>
      prev.includes(theme) ? prev.filter(t => t !== theme) : [...prev, theme]
    );
  };

  const toggleType = (type: SpeculativeType) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSearchText('');
    setSelectedThemes([]);
    setSelectedTypes([]);
  };

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
        <>
        <div className="search-filters">
          <input
            type="text"
            placeholder="搜索题干或来源..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="search-input"
          />
          <button
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            筛选
          </button>
        </div>
        {showFilters && (
          <div className="filter-panel">
            <div className="filter-section">
              <span className="filter-label">主题：</span>
              <div className="filter-chips">
                {THEMES.map(theme => (
                  <button
                    key={theme}
                    className={`chip ${selectedThemes.includes(theme) ? 'active' : ''}`}
                    onClick={() => toggleTheme(theme)}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-section">
              <span className="filter-label">思辨类型：</span>
              <div className="filter-chips">
                {TYPES.map(type => (
                  <button
                    key={type}
                    className={`chip ${selectedTypes.includes(type) ? 'active' : ''}`}
                    onClick={() => toggleType(type)}
                  >
                    {type === 'single' ? '一元' : type === 'binary' ? '二元' : '三元'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {hasFilters && (
          <div className="filter-status">
            <span>筛选结果：{filteredQuestions.length} 道题</span>
            <button className="clear-filters" onClick={clearFilters}>清空筛选</button>
          </div>
        )}
        <div className="question-list">
          {recommended.length > 0 && !hasFilters && (
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
                    {q.theme && <span className="card-tag">{q.theme}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {filteredQuestions.map((q) => (
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
                {q.theme && <span className="card-tag">{q.theme}</span>}
              </div>
            </div>
          ))}
          {filteredQuestions.length === 0 && hasFilters && (
            <div className="empty-state" style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              没有找到匹配的题目，试试调整筛选条件
            </div>
          )}
        </div>
        </>
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
