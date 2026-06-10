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
  activeParaIndex: number | null;
  onParagraphClick: (paraIndex: number, annotations: EssayAnnotation[]) => void;
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
  activeParaIndex,
  onParagraphClick,
}: AnnotatedContentProps) {
  const paragraphData = useMemo(
    () => mapAnnotationsToParagraphs(content, annotations),
    [content, annotations]
  );

  const handleClick = useCallback(
    (index: number, anns: EssayAnnotation[]) => {
      if (anns.length > 0) {
        onParagraphClick(index, anns);
      }
    },
    [onParagraphClick]
  );

  return (
    <div className="ann-content">
      {paragraphData.map((para, i) => {
        const hasAnn = para.annotations.length > 0;
        const isActive = activeParaIndex === i;

        return (
          <p
            key={i}
            className={[
              'ann-paragraph',
              hasAnn && 'has-annotation',
              isActive && 'is-active',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => handleClick(i, para.annotations)}
            data-para-index={i}
          >
            {para.text}
            {hasAnn && para.annotations.length === 1 && (
              <span className="ann-inline-badge">
                {para.annotations[0].label}
              </span>
            )}
            {hasAnn && para.annotations.length > 1 && (
              <span className="ann-inline-badge">
                {para.annotations.length} 个标注
              </span>
            )}
          </p>
        );
      })}
    </div>
  );
}
