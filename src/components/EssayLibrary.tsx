import { useState } from 'react';
import type { ModelEssay } from '../types';
import essays from '../data/essays.json';
import './EssayLibrary.css';

const allEssays = essays as ModelEssay[];

export function EssayLibrary() {
  const [selected, setSelected] = useState<ModelEssay | null>(null);

  if (selected) {
    return (
      <div className="essay-detail">
        <div className="ed-header">
          <button className="ed-back" onClick={() => setSelected(null)}>
            ←
          </button>
          <div>
            <h3>{selected.title}</h3>
            <span className="ed-score">得分 {selected.score}/60</span>
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
      <div className="essay-list">
        {allEssays.map((e) => (
          <button
            key={e.id}
            className="essay-card"
            onClick={() => setSelected(e)}
          >
            <span className="essay-title">{e.title}</span>
            <span className="essay-topic">{e.topic.slice(0, 35)}...</span>
            <span className="essay-meta">
              {e.score}/60 · {e.tags[0]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
