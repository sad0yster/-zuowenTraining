import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { sendPreWriteMessage, sendPreWriteSummary, generateId } from '../services/aiService';
import { ChatBubble } from './ChatBubble';
import { LoadingDots } from './LoadingDots';
import './PreWriteChat.css';

interface PreWriteChatProps {
  topic: string;
  messages: ChatMessage[];
  onMessagesUpdate: (messages: ChatMessage[]) => void;
  onStartWriting: (summary: string) => void;
}

export function PreWriteChat({
  topic,
  messages,
  onMessagesUpdate,
  onStartWriting,
}: PreWriteChatProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [coachReady, setCoachReady] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentFirstRef = useRef(false);

  useEffect(() => {
    if (sentFirstRef.current) return;
    sentFirstRef.current = true;
    if (messages.length === 0) {
      sendCoachMessage(
        '读完这道题，你的第一感觉是什么？先别急着下笔，我们聊聊。'
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
      const { message, ready } = await sendPreWriteMessage(topic, messages, trimmed);
      if (ready) setCoachReady(true);
      const coachMsg: ChatMessage = {
        id: generateId(),
        role: 'coach',
        content: message,
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

  const handleStartWriting = async () => {
    setSummaryLoading(true);
    try {
      const summary = await sendPreWriteSummary(topic, messages);
      onStartWriting(summary);
    } catch {
      onStartWriting('');
    }
  };

  return (
    <div className="pre-write-chat">
      <div className="pre-write-topic-banner">
        <span className="topic-label">当前题目</span>
        <p>{topic}</p>
      </div>

      <div className="chat-messages" role="log" aria-live="polite" aria-label="对话记录">
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

      <button
        className="start-writing-btn"
        onClick={handleStartWriting}
        disabled={summaryLoading}
      >
        {summaryLoading ? '正在整理思考...' : '我已经想清楚了，开始写作'}
        {coachReady && <span className="ready-badge">教练认为你已准备好</span>}
      </button>

      {messages.filter(m => m.role === 'user').length < 2 && (
        <p className="pre-write-nudge">建议至少和教练聊2轮再开始写</p>
      )}
    </div>
  );
}
