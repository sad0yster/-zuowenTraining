import { useState, useRef, useEffect, useCallback } from 'react';
import './EssayDrawer.css';

interface EssayDrawerProps {
  content: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EssayDrawer({ content, isOpen, onClose }: EssayDrawerProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [drawerHeight, setDrawerHeight] = useState(50); // vh
  const draggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const lastYRef = useRef(0);
  const lastTimeRef = useRef(0);

  const wordCount = content.replace(/\s/g, '').length;

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 150);
  }, [onClose]);

  // Esc key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Drag handlers
  const handleDragStart = (clientY: number) => {
    draggingRef.current = true;
    startYRef.current = clientY;
    startHeightRef.current = drawerHeight;
    lastYRef.current = clientY;
    lastTimeRef.current = Date.now();
  };

  const handleDragMove = (clientY: number) => {
    if (!draggingRef.current) return;
    const delta = startYRef.current - clientY;
    const viewportH = window.innerHeight;
    const deltaVh = (delta / viewportH) * 100;
    const newHeight = Math.min(80, Math.max(30, startHeightRef.current + deltaVh));
    setDrawerHeight(newHeight);
    lastYRef.current = clientY;
    lastTimeRef.current = Date.now();
  };

  const handleDragEnd = (clientY: number) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;

    // Velocity-based snap
    const elapsed = Date.now() - lastTimeRef.current;
    const velocity = elapsed > 0 ? (lastYRef.current - clientY) / elapsed : 0;
    if (velocity > 0.5) {
      setDrawerHeight(80);
    } else if (velocity < -0.5) {
      handleClose();
    }
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientY);
    const handleMouseMove = (e: MouseEvent) => handleDragMove(e.clientY);
    const handleMouseUp = (e: MouseEvent) => {
      handleDragEnd(e.clientY);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    handleDragEnd(e.changedTouches[0].clientY);
  };

  if (!isOpen) return null;

  const paragraphs = content.split('\n').filter(p => p.trim());

  return (
    <>
      <div
        className={`essay-drawer-overlay${isClosing ? ' closing' : ''}`}
        onClick={handleClose}
      />
      <div
        className={`essay-drawer${isClosing ? ' closing' : ''}`}
        style={{ height: `${drawerHeight}vh` }}
      >
        <div
          className="essay-drawer-handle"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="essay-drawer-handle-bar" />
        </div>

        <div className="essay-drawer-header">
          <div>
            <span className="essay-drawer-title">我的作文</span>
            <span className="essay-drawer-wordcount">{wordCount} 字</span>
          </div>
          <button className="essay-drawer-close" onClick={handleClose}>
            收起
          </button>
        </div>

        <div className="essay-drawer-content">
          {paragraphs.map((para, i) => (
            <p key={i} className="essay-drawer-para">{para}</p>
          ))}
        </div>
      </div>
    </>
  );
}
