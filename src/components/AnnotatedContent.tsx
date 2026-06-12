import { useMemo, useCallback } from 'react';
import type { EssayAnnotation } from '../types';
import './AnnotatedContent.css';

interface ParagraphData {
  text: string;
  annotations: EssayAnnotation[];
}

interface AnnotatedContentProps {
  content: string;
  annotations: EssayAnnotation[];
  expandedParaIndex: number | null;
  onToggleExpand: (paraIndex: number) => void;
}

function mapAnnotationsToParagraphs(
  content: string,
  annotations: EssayAnnotation[]
): ParagraphData[] {
  const paragraphs = content.split('\n').filter(p => p.trim());
  const paraCount = paragraphs.length;
  const maxEnd = Math.max(...annotations.map(a => a.endIndex), 0);
  const isParagraphIndex = maxEnd <= paraCount;

  const paraAnnotations: EssayAnnotation[][] = paragraphs.map(() => []);

  annotations.forEach(ann => {
    let startPara: number;
    let endPara: number;

    if (isParagraphIndex) {
      startPara = ann.startIndex;
      endPara = Math.min(ann.endIndex, paraCount - 1);
    } else {
      startPara = Math.floor((ann.startIndex / content.length) * paraCount);
      endPara = Math.min(
        Math.floor((ann.endIndex / content.length) * paraCount),
        paraCount - 1
      );
    }

    startPara = Math.max(0, Math.min(startPara, paraCount - 1));
    endPara = Math.max(startPara, Math.min(endPara, paraCount - 1));

    for (let i = startPara; i <= endPara; i++) {
      paraAnnotations[i].push(ann);
    }
  });

  return paragraphs.map((text, i) => ({
    text,
    annotations: paraAnnotations[i],
  }));
}

export function AnnotatedContent({
  content,
  annotations,
  expandedParaIndex,
  onToggleExpand,
}: AnnotatedContentProps) {
  const paragraphData = useMemo(
    () => mapAnnotationsToParagraphs(content, annotations),
    [content, annotations]
  );

  const handleClick = useCallback(
    (index: number, anns: EssayAnnotation[]) => {
      if (anns.length > 0) {
        onToggleExpand(index);
      }
    },
    [onToggleExpand]
  );

  return (
    <div className="ann-content">
      {paragraphData.map((para, i) => {
        const hasAnn = para.annotations.length > 0;
        const isExpanded = expandedParaIndex === i;

        const elements: React.ReactNode[] = [
          <p
            key={`p-${i}`}
            className={[
              'ann-paragraph',
              hasAnn && 'has-annotation',
              isExpanded && 'is-expanded',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => handleClick(i, para.annotations)}
            data-para-index={i}
          >
            {para.text}
            {hasAnn && (
              <span className="ann-inline-badge">
                {para.annotations.length === 1
                  ? para.annotations[0].label
                  : `${para.annotations.length} 个得分点`}
              </span>
            )}
          </p>,
        ];

        if (isExpanded && hasAnn) {
          elements.push(
            <div key={`ann-${i}`} className="ann-inline-cards">
              {para.annotations.map((ann, j) => (
                <div key={j} className="ann-inline-card">
                  <span className="ann-inline-label">{ann.label}</span>
                  <p className="ann-inline-comment">{ann.comment}</p>
                </div>
              ))}
            </div>
          );
        }

        return elements;
      })}
    </div>
  );
}
