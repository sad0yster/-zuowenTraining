import { useState, useRef, useEffect } from 'react';
import type { DrillType, DrillRecord, ChatMessage } from '../types';
import { generateId, sendDrillMessage, sendDrillFollowUp } from '../services/aiService';
import { saveDrillRecord } from '../services/storageService';
import questions from '../data/questions.json';
import type { Question } from '../types';
import { ChatBubble } from './ChatBubble';
import { LoadingDots } from './LoadingDots';
import './TrainingUnit.css';

interface TrainingUnitProps {
  type: DrillType;
  contextTopic?: string;
  onBack: () => void;
  onRefresh: () => void;
}

const UNIT_LABELS: Record<DrillType, string> = {
  examining: '审题拆解',
  thesis: '立意突破',
  titling: '命题训练',
  reasoning: '论证链',
  perspective: '视角切换',
};

const allQuestions = questions as Question[];

export function TrainingUnit({
  type,
  contextTopic,
  onBack,
  onRefresh,
}: TrainingUnitProps) {
  const [step, setStep] = useState<'topic-select' | 'practice' | 'feedback'>(
    'topic-select'
  );
  const [selectedTopic, setSelectedTopic] = useState(contextTopic || '');
  const [studentInput, setStudentInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [followUpInput, setFollowUpInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSelectTopic = (text: string) => {
    setSelectedTopic(text);
    setStep('practice');
  };

  const handleSubmit = async () => {
    if (!studentInput.trim() || loading) return;
    setLoading(true);
    try {
      const reply = await sendDrillMessage(type, selectedTopic, studentInput.trim());
      const coachMsg: ChatMessage = {
        id: generateId(),
        role: 'coach',
        content: reply,
        timestamp: Date.now(),
      };
      setChatMessages([coachMsg]);

      const record: DrillRecord = {
        id: generateId(),
        type,
        questionId: null,
        questionText: selectedTopic,
        studentInput: studentInput.trim(),
        aiFeedback: reply,
        createdAt: Date.now(),
      };
      saveDrillRecord(record);
      setStep('feedback');
    } catch {
      setChatMessages([
        { id: generateId(), role: 'coach', content: '抱歉，出了点问题。请稍后再试。', timestamp: Date.now() },
      ]);
      setStep('feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUp = async () => {
    const trimmed = followUpInput.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setFollowUpInput('');
    setLoading(true);

    try {
      const reply = await sendDrillFollowUp(type, selectedTopic, studentInput.trim(), chatMessages, trimmed);
      const coachMsg: ChatMessage = {
        id: generateId(),
        role: 'coach',
        content: reply,
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, coachMsg]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { id: generateId(), role: 'coach', content: '抱歉，出了点问题。请稍后再试。', timestamp: Date.now() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (step === 'feedback') handleFollowUp();
    }
  };

  const handleDone = () => {
    onRefresh();
    onBack();
  };

  const contextBanner = contextTopic ? (
    <div className="tu-context-banner">
      基于刚才关于「{contextTopic}」的讨论，来练一练
    </div>
  ) : null;

  if (step === 'topic-select') {
    return (
      <div className="training-unit">
        <div className="tu-header">
          <button className="tu-back" onClick={onBack}>←</button>
          <h3>{UNIT_LABELS[type]}</h3>
        </div>
        {contextTopic && (
          <div className="tu-context-banner">
            基于刚才关于「{contextTopic}」的讨论，选一道题继续练
          </div>
        )}
        <p className="tu-prompt">选择一道题来练习</p>
        <div className="tu-topic-list">
          {allQuestions.slice(0, 20).map((q) => (
            <button
              key={q.id}
              className="tu-topic-card"
              onClick={() => handleSelectTopic(q.text)}
            >
              {q.text.slice(0, 60)}...
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'practice') {
    return (
      <div className="training-unit">
        <div className="tu-header">
          <button className="tu-back" onClick={() => setStep('topic-select')}>←</button>
          <h3>{UNIT_LABELS[type]}</h3>
        </div>
        {contextBanner}
        <div className="tu-topic-banner">{selectedTopic}</div>
        <textarea
          className="tu-input"
          value={studentInput}
          onChange={(e) => setStudentInput(e.target.value)}
          placeholder="在这里写下你的分析..."
          rows={8}
          autoFocus
        />
        <button
          className="tu-submit"
          onClick={handleSubmit}
          disabled={loading || !studentInput.trim()}
        >
          {loading ? <LoadingDots text="教练思考中" /> : '提交'}
        </button>
      </div>
    );
  }

  return (
    <div className="training-unit">
      <div className="tu-header">
        <button className="tu-back" onClick={onBack}>←</button>
        <h3>{UNIT_LABELS[type]}</h3>
      </div>
      <div className="tu-feedback">
        {chatMessages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        {loading && <LoadingDots />}
        <div ref={bottomRef} />
      </div>
      <div className="chat-input-area">
        <textarea
          value={followUpInput}
          onChange={(e) => setFollowUpInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="继续追问..."
          rows={2}
          disabled={loading}
        />
        <button onClick={handleFollowUp} disabled={loading || !followUpInput.trim()}>
          发送
        </button>
      </div>
      <button className="tu-done" onClick={handleDone}>
        结束训练
      </button>
    </div>
  );
}
