import { useState } from 'react';
import type { Question } from '../types';
import questions from '../data/questions.json';
import './TopicInput.css';

const allQuestions = questions as Question[];

interface TopicInputProps {
  onConfirm: (topic: string, questionId: string | null) => void;
}

export function TopicInput({ onConfirm }: TopicInputProps) {
  const [mode, setMode] = useState<'pick' | 'custom'>('pick');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customTopic, setCustomTopic] = useState('');

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
      <h2>今天想写什么题目？</h2>
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
          {allQuestions.map((q) => (
            <div
              key={q.id}
              className={`question-card ${selectedId === q.id ? 'selected' : ''}`}
              onClick={() => setSelectedId(q.id)}
            >
              <p className="question-text">{q.text.slice(0, 80)}...</p>
              <span className="question-tag">
                {q.difficulty === 1
                  ? '基础'
                  : q.difficulty === 2
                    ? '进阶'
                    : '挑战'}
                {' · '}
                {q.tags[0]}
              </span>
            </div>
          ))}
        </div>
      )}

      {mode === 'custom' && (
        <textarea
          className="custom-input"
          placeholder="输入或粘贴作文题目..."
          value={customTopic}
          onChange={(e) => setCustomTopic(e.target.value)}
          rows={4}
        />
      )}

      <button
        className="start-btn"
        disabled={mode === 'pick' ? !selectedId : !customTopic.trim()}
        onClick={handleStart}
      >
        开始写作
      </button>
    </div>
  );
}
