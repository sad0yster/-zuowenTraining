import { useEffect, useRef } from 'react';
import type { EssayAnnotation } from '../types';
import './AnnotationSidebar.css';

interface AnnotationSidebarProps {
  annotations: EssayAnnotation[];
  highlightedIndex: number | null;
  onAnnotationClick: (annotation: EssayAnnotation) => void;
  showSheet: boolean;
  onSheetClose: () => void;
}

function AnnotationList({
  annotations,
  highlightedIndex,
  onAnnotationClick,
}: {
  annotations: EssayAnnotation[];
  highlightedIndex: number | null;
  onAnnotationClick: (annotation: EssayAnnotation) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightedIndex !== null && listRef.current) {
      const items = listRef.current.querySelectorAll('.ann-sidebar-item');
      items[highlightedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [highlightedIndex]);

  if (annotations.length === 0) {
    return <p className="ann-sidebar-empty">点击高亮段落查看批注</p>;
  }

  return (
    <div ref={listRef}>
      {annotations.map((ann, i) => (
        <div
          key={i}
          className={`ann-sidebar-item${highlightedIndex === i ? ' is-highlighted' : ''}`}
          onClick={() => onAnnotationClick(ann)}
        >
          <span className="ann-sidebar-label">{ann.label}</span>
          <p className="ann-sidebar-comment">{ann.comment}</p>
        </div>
      ))}
    </div>
  );
}

export function AnnotationSidebar({
  annotations,
  highlightedIndex,
  onAnnotationClick,
  showSheet,
  onSheetClose,
}: AnnotationSidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <div className="ann-sidebar ann-sidebar-desktop">
        <div className="ann-sidebar-title">得分点拆解</div>
        <AnnotationList
          annotations={annotations}
          highlightedIndex={highlightedIndex}
          onAnnotationClick={onAnnotationClick}
        />
      </div>

      {/* Mobile bottom sheet */}
      {showSheet && (
        <div className="ann-sheet-overlay" onClick={onSheetClose}>
          <div className="ann-sheet" onClick={e => e.stopPropagation()}>
            <div className="ann-sheet-handle" />
            <div className="ann-sheet-title">得分点拆解</div>
            <AnnotationList
              annotations={annotations}
              highlightedIndex={highlightedIndex}
              onAnnotationClick={onAnnotationClick}
            />
          </div>
        </div>
      )}
    </>
  );
}
