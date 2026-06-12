import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { sendInWriteHelp, generateId } from '../services/aiService';
import { ChatBubble } from './ChatBubble';
import { LoadingDots } from './LoadingDots';
import { Collapse } from './Collapse';
import './Editor.css';

interface EditorProps {
  topic: string;
  content: string;
  onContentChange: (content: string) => void;
  onSubmit: () => void;
  preWriteSummary?: string;
  saveStatus?: 'saved' | 'saving' | '';
}

export function Editor({ topic, content, onContentChange, onSubmit, preWriteSummary, saveStatus }: EditorProps) {
  const [wordCount, setWordCount] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showSummary, setShowSummary] = useState(true);
  const [helpInput, setHelpInput] = useState('');
  const [helpMessages, setHelpMessages] = useState<ChatMessage[]>([]);
  const [helpLoading, setHelpLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const helpBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    helpBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [helpMessages]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    onContentChange(text);
    setWordCount(text.replace(/\s/g, '').length);
  };

  const handleSendHelp = async () => {
    const question = helpInput.trim();
    if (!question || helpLoading) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: question,
      timestamp: Date.now(),
    };
    setHelpMessages((prev) => [...prev, userMsg]);
    setHelpInput('');
    setHelpLoading(true);

    try {
      const reply = await sendInWriteHelp(topic, content, question);
      const coachMsg: ChatMessage = {
        id: generateId(),
        role: 'coach',
        content: reply,
        timestamp: Date.now(),
      };
      setHelpMessages((prev) => [...prev, coachMsg]);
    } catch {
      setHelpMessages((prev) => [
        ...prev,
        { id: generateId(), role: 'coach', content: '抱歉，出了点问题。请稍后再试。', timestamp: Date.now() },
      ]);
    } finally {
      setHelpLoading(false);
    }
  };

  const handleHelpKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendHelp();
    }
  };

  const handleToggleHelp = () => {
    setShowHelp(!showHelp);
  };

  return (
    <div className="editor">
      <div className="topic-banner">
        <span className="topic-banner-label">作文题目</span>
        <p className="topic-banner-text">{topic}</p>
      </div>

      {preWriteSummary && (
        <div className="summary-panel">
          <button
            className="summary-toggle"
            onClick={() => setShowSummary(!showSummary)}
          >
            {showSummary ? '收起思考地图 ▲' : '展开思考地图 ▼'}
          </button>
          <Collapse isOpen={showSummary}>
            <div className="summary-content">
              {preWriteSummary.split('\n').map((line, i) => (
                <p key={i} className={line.startsWith('【') ? 'summary-heading' : 'summary-text'}>
                  {line}
                </p>
              ))}
            </div>
          </Collapse>
        </div>
      )}

      <div className="editor-toolbar">
        <span className="word-count">{wordCount} 字</span>
        <div className="toolbar-right">
          {wordCount > 0 && wordCount < 700 && (
            <span className="word-warning">建议 800 字以上</span>
          )}
          {saveStatus && (
            <span className={`save-status ${saveStatus}`}>
              {saveStatus === 'saving' ? '保存中...' : '✓ 已保存'}
            </span>
          )}
        </div>
      </div>

      <textarea
        ref={textareaRef}
        className="editor-textarea"
        value={content}
        onChange={handleChange}
        placeholder="开始写你的文章..."
        autoFocus
      />

      <Collapse isOpen={showHelp}>
        <div className="coach-help-panel">
          <div className="help-panel-header">
            <span>向教练提问</span>
            <button className="help-collapse-btn" onClick={handleToggleHelp}>
              收起
            </button>
          </div>
          <div className="help-panel-messages" role="log" aria-live="polite" aria-label="对话记录">
            {helpMessages.length === 0 && (
              <p className="help-empty-hint">写作中遇到困惑？随时向教练提问</p>
            )}
            {helpMessages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
            {helpLoading && <LoadingDots />}
            <div ref={helpBottomRef} />
          </div>
          <div className="help-input-area">
            <input
              type="text"
              value={helpInput}
              onChange={(e) => setHelpInput(e.target.value)}
              onKeyDown={handleHelpKeyDown}
              placeholder="向教练提问..."
              disabled={helpLoading}
            />
            <button
              onClick={handleSendHelp}
              disabled={helpLoading || !helpInput.trim()}
            >
              发送
            </button>
          </div>
        </div>
      </Collapse>

      <div className="editor-actions">
        <button
          className="ask-coach-btn"
          onClick={handleToggleHelp}
        >
          问教练
        </button>
        <button
          className="submit-btn"
          onClick={onSubmit}
          disabled={wordCount < 100}
        >
          提交作文
        </button>
      </div>
    </div>
  );
}
