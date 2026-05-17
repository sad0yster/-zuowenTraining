import { useState, useRef, useEffect } from 'react';
import type { Material, ChatMessage, DrillType } from '../types';
import { generateId, sendMaterialDiscussion } from '../services/aiService';
import { ChatBubble } from './ChatBubble';
import { LoadingDots } from './LoadingDots';

interface MaterialDetailProps {
  material: Material;
  onBack: () => void;
  onJumpToDrill?: (drillType: DrillType, context?: string) => void;
}

export function MaterialDetail({
  material,
  onBack,
  onJumpToDrill,
}: MaterialDetailProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showJump, setShowJump] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentFirstRef = useRef(false);

  useEffect(() => {
    if (sentFirstRef.current) return;
    sentFirstRef.current = true;
    const firstQ = material.guideQuestions[0];
    if (firstQ) {
      sendCoach(firstQ);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendCoach = (text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: generateId(), role: 'coach', content: text, timestamp: Date.now() },
    ]);
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
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const reply = await sendMaterialDiscussion(
        material,
        trimmed
      );
      sendCoach(reply);
      if (messages.length >= 3) setShowJump(true);
    } catch {
      sendCoach('抱歉，出了点问题。请稍后再试。');
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

  const handleJumpToDrill = (drillType: DrillType) => {
    onJumpToDrill?.(drillType, material.title);
  };

  return (
    <div className="material-detail">
      <div className="md-header">
        <button className="md-back" onClick={onBack}>
          ←
        </button>
        <h3>{material.title}</h3>
      </div>

      <div className="md-situation">{material.situation}</div>
      <div className="md-tension">{material.coreTension}</div>

      <div className="md-chat-area">
        <div className="md-discussion">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
          {loading && <LoadingDots />}
          <div ref={bottomRef} />
        </div>

        <div className="md-input-row">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="说说你的想法..."
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
          >
            发送
          </button>
        </div>
      </div>

      {showJump && (
        <div className="md-jump">
          {material.linkedDrills.map((d) => (
            <button
              key={d}
              className="md-jump-btn"
              onClick={() => handleJumpToDrill(d)}
            >
              针对这个话题练{d === 'examining' ? '审题' : d === 'thesis' ? '立意' : d === 'titling' ? '命题' : d === 'reasoning' ? '论证' : '视角切换'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
