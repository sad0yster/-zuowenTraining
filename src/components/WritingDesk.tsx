import { useState } from 'react';
import type { WritingStep, ChatMessage, ThinkingSnapshot, CompletionSummary } from '../types';
import { TopicInput } from './TopicInput';
import { PreWriteChat } from './PreWriteChat';
import { Editor } from './Editor';
import { PostWriteReview } from './PostWriteReview';

export function WritingDesk() {
  const [step, setStep] = useState<WritingStep>('topic-input');
  const [topic, setTopic] = useState('');
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [preWriteMessages, setPreWriteMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState('');
  const [postWriteMessages, setPostWriteMessages] = useState<ChatMessage[]>([]);
  const [summary, setSummary] = useState<CompletionSummary | null>(null);

  const handleTopicConfirm = (t: string, qId: string | null) => {
    setTopic(t);
    setQuestionId(qId);
    setStep('pre-write');
  };

  const handleComplete = (_snapshot: ThinkingSnapshot, s: CompletionSummary) => {
    setSummary(s);
    setStep('completed');
  };

  const handleStartNew = () => {
    setStep('topic-input');
    setTopic('');
    setQuestionId(null);
    setPreWriteMessages([]);
    setContent('');
    setPostWriteMessages([]);
    setSummary(null);
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
        onStartWriting={() => setStep('writing')}
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
        onComplete={handleComplete}
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
        <button className="completion-btn" onClick={handleStartNew}>
          开始新的训练
        </button>
      </div>
    );
  }

  return null;
}
