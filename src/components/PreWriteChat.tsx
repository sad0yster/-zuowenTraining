import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { sendPreWriteMessage, generateId } from '../services/aiService';
import { ChatBubble } from './ChatBubble';
import { LoadingDots } from './LoadingDots';

interface PreWriteChatProps {
  topic: string;
  messages: ChatMessage[];
  onMessagesUpdate: (messages: ChatMessage[]) => void;
  onStartWriting: () => void;
}

export function PreWriteChat({
  topic,
  messages,
  onMessagesUpdate,
  onStartWriting,
}: PreWriteChatProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
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
      const reply = await sendPreWriteMessage(topic, messages, trimmed);
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

  return (
    <div className="pre-write-chat">
      <div className="pre-write-topic-banner">
        <span className="topic-label">当前题目</span>
        <p>{topic}</p>
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

      {messages.length >= 4 && (
        <button className="start-writing-btn" onClick={onStartWriting}>
          我已经想清楚了，开始写作
        </button>
      )}
    </div>
  );
}
