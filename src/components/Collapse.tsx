import { useRef, useEffect, useState } from 'react';
import './Collapse.css';

interface CollapseProps {
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Collapse({ isOpen, children, className = '' }: CollapseProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      setHeight(contentHeight);
    }
  }, [children, isOpen]);

  return (
    <div
      className={`collapse ${isOpen ? 'collapse-open' : ''} ${className}`}
      style={{
        maxHeight: isOpen ? height : 0,
      }}
    >
      <div ref={contentRef} className="collapse-inner">
        {children}
      </div>
    </div>
  );
}
