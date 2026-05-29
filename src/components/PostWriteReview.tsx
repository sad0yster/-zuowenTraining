import { useState, useRef, useEffect } from 'react';
import type { ChatMessage, EssayRecord, ThinkingSnapshot, CompletionSummary } from '../types';
import { sendPostWriteMessage, generateId, parseScores } from '../services/aiService';
import { saveEssay } from '../services/storageService';
import { ChatBubble } from './ChatBubble';
import { LoadingDots } from './LoadingDots';
import './PostWriteReview.css';
import { EssayDrawer } from './EssayDrawer';

interface PostWriteReviewProps {
  topic: string;
  essayContent: string;
  questionId: string | null;
  preWriteMessages: ChatMessage[];
  messages: ChatMessage[];
  onMessagesUpdate: (messages: ChatMessage[]) => void;
  onAppendMessage: (msg: ChatMessage) => void;
  onComplete: (snapshot: ThinkingSnapshot, summary: CompletionSummary) => void;
  originalContent?: string | null;
}

function stripScoreMarker(content: string): string {
  return content.replace(/\n?\[SCORES:originality=\d,reasoning=\d,perspective=\d,structure=\d,language=\d\]\s*$/, '').trim();
}

export function PostWriteReview({
  topic,
  essayContent,
  questionId,
  preWriteMessages,
  messages,
  onMessagesUpdate,
  onAppendMessage,
  onComplete,
  originalContent,
}: PostWriteReviewProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentFirstRef = useRef(false);

  useEffect(() => {
    if (sentFirstRef.current) return;
    sentFirstRef.current = true;
    if (messages.length === 0) {
      const firstMsg = originalContent
        ? '你修改了作文！先不急着听我的看法——你自己觉得，两稿之间最大的变化是什么？哪些地方改好了？'
        : '写完了！先不急着听我的看法——你自己觉得，哪段写得最有说服力？哪段最没把握？';
      sendCoachMessage(firstMsg);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendCoachMessage = (text: string) => {
    const msg: ChatMessage = {
      id: generateId(),
      role: 'coach',
      content: text,
      timestamp: Date.now(),
    };
    onAppendMessage(msg);
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
    onAppendMessage(userMsg);
    setInput('');
    setLoading(true);

    try {
      const reply = await sendPostWriteMessage(
        topic,
        essayContent,
        messages,
        trimmed,
        originalContent
      );
      const coachMsg: ChatMessage = {
        id: generateId(),
        role: 'coach',
        content: reply,
        timestamp: Date.now(),
      };
      onAppendMessage(coachMsg);
    } catch {
      const errorMsg: ChatMessage = {
        id: generateId(),
        role: 'coach',
        content: '抱歉，出了点问题。请稍后再试。',
        timestamp: Date.now(),
      };
      onAppendMessage(errorMsg);
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

  const handleFinish = async () => {
    const DEFAULT_SNAPSHOT: ThinkingSnapshot = {
      originality: 3,
      reasoning: 3,
      perspective: 3,
      structure: 3,
      language: 3,
    };

    // Search from end without mutating
    let scoredCoachMsg: ChatMessage | undefined;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'coach' && parseScores(messages[i].content) !== null) {
        scoredCoachMsg = messages[i];
        break;
      }
    }

    let finalMessages = messages;

    // If no scores found, request them explicitly
    if (!scoredCoachMsg) {
      setLoading(true);
      try {
        const reply = await sendPostWriteMessage(topic, essayContent, messages, '请对我的作文给出五维评分。', originalContent);
        const scoreMsg: ChatMessage = {
          id: generateId(),
          role: 'coach',
          content: reply,
          timestamp: Date.now(),
        };
        finalMessages = [...messages, scoreMsg];
        onMessagesUpdate(finalMessages);
        if (parseScores(reply)) {
          scoredCoachMsg = scoreMsg;
        }
      } catch {
        // Fall through to defaults
      } finally {
        setLoading(false);
      }
    }

    const snapshot = (scoredCoachMsg ? parseScores(scoredCoachMsg.content) : null) || DEFAULT_SNAPSHOT;
    const lastCoachContent = scoredCoachMsg ? stripScoreMarker(scoredCoachMsg.content) : '';
    const summary: CompletionSummary = {
      wordCount: essayContent.replace(/\s/g, '').length,
      preWriteRounds: preWriteMessages.filter((m) => m.role === 'user').length,
      postWriteRounds: finalMessages.filter((m) => m.role === 'user').length,
      coachTakeaway:
        lastCoachContent.split('\n').pop()?.slice(0, 120) ||
        '本次训练完成，继续保持思考的习惯。',
    };

    const record: EssayRecord = {
      id: generateId(),
      questionId,
      topic,
      content: essayContent,
      preWriteMessages,
      postWriteMessages: finalMessages,
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

      <div className="chat-messages" role="log" aria-live="polite" aria-label="对话记录">
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            message={msg.role === 'coach' ? { ...msg, content: stripScoreMarker(msg.content) } : msg}
          />
        ))}
        {loading && <LoadingDots />}
        <div ref={bottomRef} />
      </div>

      <button
        className="view-essay-btn"
        onClick={() => setDrawerOpen(true)}
      >
        查看我的作文
      </button>

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
        <button className="finish-btn" onClick={handleFinish} disabled={loading}>
          {loading ? '正在生成评分...' : '完成本次训练'}
        </button>
      )}

      <EssayDrawer
        content={essayContent}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
