import { useState, useEffect, useRef, useCallback } from 'react';
import type { WritingStep, ChatMessage, ThinkingSnapshot, CompletionSummary } from '../types';
import { TopicInput } from './TopicInput';
import { PreWriteChat } from './PreWriteChat';
import { Editor } from './Editor';
import { PostWriteReview } from './PostWriteReview';
import { saveDraft, loadDraft, clearDraft } from '../services/storageService';

export function WritingDesk() {
  const [step, setStep] = useState<WritingStep>('topic-input');
  const [topic, setTopic] = useState('');
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [preWriteMessages, setPreWriteMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState('');
  const [postWriteMessages, setPostWriteMessages] = useState<ChatMessage[]>([]);
  const [summary, setSummary] = useState<CompletionSummary | null>(null);
  const [preWriteSummary, setPreWriteSummary] = useState('');
  const [originalContent, setOriginalContent] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setStep(draft.step);
      setTopic(draft.topic);
      setQuestionId(draft.questionId);
      setPreWriteMessages(draft.preWriteMessages);
      setContent(draft.content);
      setPostWriteMessages(draft.postWriteMessages);
      setPreWriteSummary(draft.preWriteSummary);
    }
    setRestored(true);
  }, []);

  // Debounced save whenever relevant state changes
  const debouncedSave = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      // Don't save on topic-input (nothing meaningful) or completed
      if (step === 'topic-input' || step === 'completed') return;
      saveDraft({
        step,
        topic,
        questionId,
        preWriteMessages,
        content,
        postWriteMessages,
        preWriteSummary,
        savedAt: Date.now(),
      });
    }, 1000);
  }, [step, topic, questionId, preWriteMessages, content, postWriteMessages, preWriteSummary]);

  useEffect(() => {
    if (!restored) return;
    debouncedSave();
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      // Flush save immediately on unmount to avoid data loss
      if (step !== 'topic-input' && step !== 'completed') {
        saveDraft({ step, topic, questionId, preWriteMessages, content, postWriteMessages, preWriteSummary, savedAt: Date.now() });
      }
    };
  }, [restored, debouncedSave]);

  const handleTopicConfirm = (t: string, qId: string | null) => {
    setTopic(t);
    setQuestionId(qId);
    setStep('pre-write');
  };

  const handleComplete = (_snapshot: ThinkingSnapshot, s: CompletionSummary) => {
    setSummary(s);
    setStep('completed');
    clearDraft();
    setOriginalContent(null);
  };

  const handleStartNew = () => {
    setStep('topic-input');
    setTopic('');
    setQuestionId(null);
    setPreWriteMessages([]);
    setContent('');
    setPostWriteMessages([]);
    setSummary(null);
    setPreWriteSummary('');
    setOriginalContent(null);
    clearDraft();
  };

  const handleRevise = () => {
    setOriginalContent(content);
    setContent('');
    setPostWriteMessages([]);
    setSummary(null);
    setStep('writing');
  };

  if (step === 'topic-input') {
    return <TopicInput onConfirm={handleTopicConfirm} />;
  }

  if (step === 'pre-write') {
    return (
      <PreWriteChat
        topic={topic}
        messages={preWriteMessages}
        onMessagesUpdate={setPreWriteMessages}
        onStartWriting={(s: string) => {
          setPreWriteSummary(s);
          setStep('writing');
        }}
      />
    );
  }

  if (step === 'writing') {
    return (
      <Editor
        topic={topic}
        content={content}
        onContentChange={setContent}
        onSubmit={() => setStep('post-write')}
        preWriteSummary={preWriteSummary}
      />
    );
  }

  if (step === 'post-write') {
    return (
      <PostWriteReview
        topic={topic}
        essayContent={content}
        questionId={questionId}
        preWriteMessages={preWriteMessages}
        messages={postWriteMessages}
        onMessagesUpdate={setPostWriteMessages}
        onAppendMessage={(msg) => setPostWriteMessages((prev) => [...prev, msg])}
        onComplete={handleComplete}
        originalContent={originalContent}
      />
    );
  }

  if (step === 'completed' && summary) {
    return (
      <div className="completion-card">
        <div className="completion-check">&#10003;</div>
        <h2>本次训练完成</h2>
        <div className="completion-stats">
          <div className="stat">
            <span className="stat-value">{summary.wordCount}</span>
            <span className="stat-label">字数</span>
          </div>
          <div className="stat">
            <span className="stat-value">{summary.preWriteRounds}</span>
            <span className="stat-label">写前对话</span>
          </div>
          <div className="stat">
            <span className="stat-value">{summary.postWriteRounds}</span>
            <span className="stat-label">复盘对话</span>
          </div>
        </div>
        <p className="completion-takeaway">"{summary.coachTakeaway}"</p>
        <div className="completion-actions">
          <button className="completion-btn" onClick={handleStartNew}>
            开始新的训练
          </button>
          <button className="completion-btn completion-btn-revise" onClick={handleRevise}>
            修改这篇作文
          </button>
        </div>
      </div>
    );
  }

  return null;
}
