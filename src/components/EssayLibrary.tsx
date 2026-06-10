import { useState, useMemo } from 'react';
import type { ModelEssay, EssayCategory } from '../types';
import essays from '../data/essays.json';
import './EssayLibrary.css';

const allEssays = essays as ModelEssay[];

const CATEGORIES: { key: EssayCategory; label: string }[] = [
  { key: 'speculative', label: '思辨方法' },
  { key: 'life', label: '人生哲理' },
  { key: 'society', label: '社会观察' },
  { key: 'tradition', label: '传统文化' },
  { key: 'youth', label: '青年成长' },
  { key: 'tech', label: '科技与时代' },
];

interface EssayLibraryProps {
  onPractice?: (topic: string) => void;
}

export function EssayLibrary({ onPractice }: EssayLibraryProps) {
  const [selected, setSelected] = useState<ModelEssay | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<EssayCategory | null>(null);

  const filtered = useMemo(() => {
    let list = allEssays;
    if (activeCategory) {
      list = list.filter((e) => e.category === activeCategory);
    }
    if (search.trim()) {
      const kw = search.trim().toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(kw) ||
          e.topic.toLowerCase().includes(kw)
      );
    }
    return list;
  }, [search, activeCategory]);

  if (selected) {
    return (
      <div className="essay-detail">
        <div className="ed-header">
          <button className="ed-back" onClick={() => setSelected(null)}>
            ←
          </button>
          <div>
            <h3>{selected.title}</h3>
            <button
              className="ed-practice-btn"
              onClick={() => onPractice?.(selected.topic)}
            >
              用此题练习
            </button>
          </div>
        </div>
        <p className="ed-topic">题目：{selected.topic}</p>
        <div className="ed-content">
          {selected.content.split('\n').map((para, i) => (
            <p key={i} className="ed-para">{para}</p>
          ))}
        </div>
        <div className="ed-annotations">
          <h4>得分点标注</h4>
          {selected.annotations.map((a, i) => (
            <div key={i} className="annotation-item">
              <span className="ann-label">{a.label}</span>
              <span className="ann-comment">{a.comment}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="essay-library">
      <h2>范文库</h2>
      <p className="essay-subtitle">精选高分范文，每篇附得分点拆解</p>

      <input
        className="essay-search"
        type="text"
        placeholder="搜索标题或题目..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="essay-tags">
        <button
          className={`essay-tag-chip ${activeCategory === null ? 'active' : ''}`}
          onClick={() => setActiveCategory(null)}
        >
          全部
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={`essay-tag-chip ${activeCategory === c.key ? 'active' : ''}`}
            onClick={() => setActiveCategory(activeCategory === c.key ? null : c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="essay-list">
        {filtered.length === 0 && (
          <p className="essay-empty">没有匹配的范文</p>
        )}
        {filtered.map((e) => (
          <button
            key={e.id}
            className="essay-card"
            onClick={() => setSelected(e)}
          >
            <span className="essay-title">{e.title}</span>
            <span className="essay-topic">{e.topic.slice(0, 35)}...</span>
            <span className="essay-meta">
              {CATEGORIES.find((c) => c.key === e.category)?.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
