import { useState, useRef, useEffect } from 'react';
import type { ChatMessage, EssayRecord, ThinkingSnapshot, CompletionSummary } from '../types';
import { sendPostWriteMessage, generateId } from '../services/aiService';
import { saveEssay } from '../services/storageService';
import { ChatBubble } from './ChatBubble';
import { LoadingDots } from './LoadingDots';

interface PostWriteReviewProps {
  topic: string;
  essayContent: string;
  questionId: string | null;
  preWriteMessages: ChatMessage[];
  messages: ChatMessage[];
  onMessagesUpdate: (messages: ChatMessage[]) => void;
  onComplete: (snapshot: ThinkingSnapshot, summary: CompletionSummary) => void;
}

export function PostWriteReview({
  topic,
  essayContent,
  questionId,
  preWriteMessages,
  messages,
  onMessagesUpdate,
  onComplete,
}: PostWriteReviewProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentFirstRef = useRef(false);

  useEffect(() => {
    if (sentFirstRef.current) return;
    sentFirstRef.current = true;
    if (messages.length === 0) {
      sendCoachMessage(
        '写完了！先不急着听我的看法——你自己觉得，哪段写得最有说服力？哪段最没把握？'
      );
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendCoachMessage = async (text: string) => {
    const msg: ChatMessage = {
      id: generateId(),
      role: 'coach',
      content: text,
      timestamp: Date.now(),
    };
    onMessagesUpdate([...messages, msg]);
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };
    const newHistory = [...messages, userMsg];
    onMessagesUpdate(newHistory);
    setInput('');
    setLoading(true);

    try {
      const reply = await sendPostWriteMessage(
        topic,
        essayContent,
        messages,
        trimmed
      );
      const coachMsg: ChatMessage = {
        id: generateId(),
        role: 'coach',
        content: reply,
        timestamp: Date.now(),
      };
      onMessagesUpdate([...newHistory, coachMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: generateId(),
        role: 'coach',
        content: '抱歉，出了点问题。请稍后再试。',
        timestamp: Date.now(),
      };
      onMessagesUpdate([...newHistory, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFinish = () => {
    const snapshot: ThinkingSnapshot = {
      originality: 3,
      reasoning: 3,
      perspective: 3,
      structure: 3,
      language: 3,
    };

    const lastCoachMsg = [...messages].reverse().find((m) => m.role === 'coach');
    const summary: CompletionSummary = {
      wordCount: essayContent.replace(/\s/g, '').length,
      preWriteRounds: preWriteMessages.filter((m) => m.role === 'user').length,
      postWriteRounds: messages.filter((m) => m.role === 'user').length,
      coachTakeaway:
        lastCoachMsg?.content?.split('\n').pop()?.slice(0, 120) ||
        '本次训练完成，继续保持思考的习惯。',
    };

    const record: EssayRecord = {
      id: generateId(),
      questionId,
      topic,
      content: essayContent,
      preWriteMessages,
      postWriteMessages: messages,
      snapshot,
      createdAt: Date.now(),
    };
    saveEssay(record);
    onComplete(snapshot, summary);
  };

  return (
    <div className="post-write-review">
      <div className="review-header">
        <h3>复盘对话</h3>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        {loading && <LoadingDots />}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="说说你的想法..."
          rows={2}
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading || !input.trim()}>
          发送
        </button>
      </div>

      {messages.length >= 3 && (
        <button className="finish-btn" onClick={handleFinish}>
          完成本次训练
        </button>
      )}
    </div>
  );
}
