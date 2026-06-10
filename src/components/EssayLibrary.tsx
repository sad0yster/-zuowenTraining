import { useState, useMemo, useCallback, useRef } from 'react';
import type { ModelEssay, EssayCategory, EssayAnnotation } from '../types';
import { AnnotatedContent } from './AnnotatedContent';
import { AnnotationSidebar } from './AnnotationSidebar';
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

const ALL_TECHNIQUES = [
  '先驳后立', '意象闭环', '三元递进', '然后推进',
  '经典当跳转', '比喻破题', '多维展开', '辩证统一',
];

interface EssayLibraryProps {
  onPractice?: (topic: string, questionId?: string) => void;
}

export function EssayLibrary({ onPractice }: EssayLibraryProps) {
  const [selected, setSelected] = useState<ModelEssay | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<EssayCategory | null>(null);
  const [activeTechnique, setActiveTechnique] = useState<string | null>(null);
  const [activeParaIndex, setActiveParaIndex] = useState<number | null>(null);
  const [activeAnnotations, setActiveAnnotations] = useState<EssayAnnotation[]>([]);
  const [highlightedAnnIndex, setHighlightedAnnIndex] = useState<number | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Available techniques for current category filter
  const availableTechniques = useMemo(() => {
    let list = allEssays;
    if (activeCategory) list = list.filter(e => e.category === activeCategory);
    const techSet = new Set<string>();
    list.forEach(e => e.techniques.forEach(t => techSet.add(t)));
    return ALL_TECHNIQUES.filter(t => techSet.has(t));
  }, [activeCategory]);

  // Available categories for current technique filter
  const availableCategories = useMemo(() => {
    let list = allEssays;
    if (activeTechnique) list = list.filter(e => e.techniques.includes(activeTechnique));
    const catSet = new Set<EssayCategory>();
    list.forEach(e => catSet.add(e.category));
    return CATEGORIES.filter(c => catSet.has(c.key));
  }, [activeTechnique]);

  // Filtered essay list
  const filtered = useMemo(() => {
    let list = allEssays;
    if (activeCategory) list = list.filter(e => e.category === activeCategory);
    if (activeTechnique) list = list.filter(e => e.techniques.includes(activeTechnique));
    if (search.trim()) {
      const kw = search.trim().toLowerCase();
      list = list.filter(
        e => e.title.toLowerCase().includes(kw) || e.topic.toLowerCase().includes(kw)
      );
    }
    return list;
  }, [search, activeCategory, activeTechnique]);

  // Annotation interaction handlers
  const handleParagraphClick = useCallback((paraIndex: number, anns: EssayAnnotation[]) => {
    setActiveParaIndex(paraIndex);
    setActiveAnnotations(anns);
    setHighlightedAnnIndex(0);
    setShowSheet(true);
  }, []);

  const handleAnnotationClick = useCallback((annotation: EssayAnnotation) => {
    if (!contentRef.current || !selected) return;
    const paragraphs = contentRef.current.querySelectorAll('.ann-paragraph');
    const paraCount = selected.content.split('\n').filter(p => p.trim()).length;
    const maxEnd = Math.max(...selected.annotations.map(a => a.endIndex), 0);
    const isParagraphIndex = maxEnd <= paraCount;

    let targetPara: number;
    if (isParagraphIndex) {
      targetPara = annotation.startIndex;
    } else {
      targetPara = Math.floor((annotation.startIndex / selected.content.length) * paraCount);
    }

    const el = paragraphs[targetPara];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('is-flashing');
      setTimeout(() => el.classList.remove('is-flashing'), 600);
    }
    setShowSheet(false);
  }, [selected]);

  const handleSheetClose = useCallback(() => {
    setShowSheet(false);
  }, []);

  const handleTechniqueTagClick = useCallback((tech: string) => {
    setActiveTechnique(activeTechnique === tech ? null : tech);
  }, [activeTechnique]);

  // Detail view
  if (selected) {
    return (
      <div className="essay-detail">
        <div className="ed-top-bar">
          <button className="ed-back" onClick={() => {
            setSelected(null);
            setActiveParaIndex(null);
            setActiveAnnotations([]);
          }}>
            ←
          </button>
          <h3 className="ed-title">{selected.title}</h3>
          <button
            className="btn-primary ed-practice-btn"
            onClick={() => onPractice?.(selected.topic, selected.questionId)}
          >
            用此题练习
          </button>
        </div>

        <div className="ed-layout" ref={contentRef}>
          <div className="ed-main">
            <p className="ed-topic">题目：{selected.topic}</p>
            <AnnotatedContent
              content={selected.content}
              annotations={selected.annotations}
              activeParaIndex={activeParaIndex}
              onParagraphClick={handleParagraphClick}
            />
            {selected.techniques.length > 0 && (
              <div className="ed-techniques">
                {selected.techniques.map(t => (
                  <span key={t} className="card-tag">{t}</span>
                ))}
              </div>
            )}
          </div>

          <AnnotationSidebar
            annotations={activeAnnotations}
            highlightedIndex={highlightedAnnIndex}
            onAnnotationClick={handleAnnotationClick}
            showSheet={showSheet}
            onSheetClose={handleSheetClose}
          />
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="essay-library">
      <h2>范文库</h2>
      <p className="essay-subtitle">精选高分范文，每篇附写作技法拆解</p>

      <input
        className="essay-search form-input"
        type="text"
        placeholder="搜索标题或题目..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="essay-filter-row">
        <button
          className={`essay-tag-chip${activeCategory === null ? ' active' : ''}`}
          onClick={() => setActiveCategory(null)}
        >
          全部
        </button>
        {availableCategories.map(c => (
          <button
            key={c.key}
            className={`essay-tag-chip${activeCategory === c.key ? ' active' : ''}`}
            onClick={() => setActiveCategory(activeCategory === c.key ? null : c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="essay-filter-row">
        <button
          className={`essay-tag-chip${activeTechnique === null ? ' active' : ''}`}
          onClick={() => setActiveTechnique(null)}
        >
          全部
        </button>
        {availableTechniques.map(t => (
          <button
            key={t}
            className={`essay-tag-chip${activeTechnique === t ? ' active' : ''}`}
            onClick={() => setActiveTechnique(activeTechnique === t ? null : t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="essay-list">
        {filtered.length === 0 && (
          <p className="essay-empty">没有匹配的范文</p>
        )}
        {filtered.map(e => (
          <button
            key={e.id}
            className="essay-card"
            onClick={() => setSelected(e)}
          >
            <span className="essay-title">{e.title}</span>
            <span className="essay-topic-preview">{e.topic}</span>
            <div className="essay-card-tags">
              <span className="essay-tag-chip essay-tag-category">
                {CATEGORIES.find(c => c.key === e.category)?.label}
              </span>
              {e.techniques.map(t => (
                <span
                  key={t}
                  className="card-tag"
                  onClick={ev => {
                    ev.stopPropagation();
                    handleTechniqueTagClick(t);
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
