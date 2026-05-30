import { useState, useRef, useEffect } from 'react';
import type { Material, ChatMessage, KnowledgeConcept } from '../types';
import { generateId, sendMaterialDiscussion } from '../services/aiService';
import { saveMaterialDiscussion, loadMaterialDiscussion, clearMaterialDiscussion } from '../services/storageService';
import { ChatBubble, renderInlineMarkdown } from './ChatBubble';
import { LoadingDots } from './LoadingDots';
import { Collapse } from './Collapse';
import conceptsData from '../data/knowledge/concepts.json';
import { DebateMode } from './DebateMode';
import { ReadingMaterials } from './ReadingMaterials';

const concepts: KnowledgeConcept[] = conceptsData as KnowledgeConcept[];

interface MaterialDetailProps {
  material: Material;
  onBack: () => void;
}

function parseHarvest(text: string): string | null {
  const match = text.match(/\[HARVEST_START\]([\s\S]*?)\[HARVEST_END\]/);
  return match ? match[1].trim() : null;
}

function stripHarvest(text: string): string {
  return text
    .replace(/\[HARVEST_START\][\s\S]*?\[HARVEST_END\]/, '')
    .trim();
}

function parseConceptId(harvest: string): string | null {
  const match = harvest.match(/\[CONCEPT:(k\d+)\]/);
  return match ? match[1] : null;
}

function stripConceptMarker(harvest: string): string {
  return harvest.replace(/\[CONCEPT:k\d+\]/, '').trim();
}

export function MaterialDetail({
  material,
  onBack,
}: MaterialDetailProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [harvest, setHarvest] = useState<string | null>(null);
  const [linkedConcept, setLinkedConcept] = useState<KnowledgeConcept | null>(null);
  const [showHarvest, setShowHarvest] = useState(true);
  const [showConcept, setShowConcept] = useState(false);
  const [hasHistory, setHasHistory] = useState(false);
  const [debateMode, setDebateMode] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentFirstRef = useRef(false);
  const restoredRef = useRef(false);

  // Restore saved discussion on mount
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const saved = loadMaterialDiscussion(material.id);
    if (saved && saved.messages.length > 0) {
      setMessages(saved.messages);
      setHasHistory(true);
      if (saved.harvest) {
        setHarvest(saved.harvest);
      }
      if (saved.linkedConceptId) {
        const found = concepts.find(c => c.id === saved.linkedConceptId);
        if (found) setLinkedConcept(found);
      }
      sentFirstRef.current = true; // skip auto-send of first guide question
    }
  }, [material.id]);

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

  // Save discussion on unmount
  useEffect(() => {
    return () => {
      if (messages.length > 0) {
        saveMaterialDiscussion({
          materialId: material.id,
          messages,
          harvest,
          linkedConceptId: linkedConcept?.id ?? null,
          savedAt: Date.now(),
        });
      }
    };
  }, [messages, harvest, material.id, linkedConcept]);

  const sendCoach = (text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: generateId(), role: 'coach', content: text, timestamp: Date.now() },
    ]);
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading || harvest) return;

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
      const reply = await sendMaterialDiscussion(material, trimmed);
      const h = parseHarvest(reply);
      if (h) {
        const conceptId = parseConceptId(h);
        if (conceptId) {
          const found = concepts.find(c => c.id === conceptId);
          if (found) setLinkedConcept(found);
        }
        const strippedHarvest = stripConceptMarker(h);
        setHarvest(strippedHarvest);
        const chatPart = stripHarvest(reply);
        if (chatPart) sendCoach(chatPart);
        // Save discussion with harvest
        const finalMessages: ChatMessage[] = chatPart
          ? [...messages, userMsg, { id: generateId(), role: 'coach' as const, content: chatPart, timestamp: Date.now() }]
          : [...messages, userMsg];
        saveMaterialDiscussion({
          materialId: material.id,
          messages: finalMessages,
          harvest: strippedHarvest,
          linkedConceptId: conceptId,
          savedAt: Date.now(),
        });
      } else {
        sendCoach(reply);
      }
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

  const handleNewChat = () => {
    clearMaterialDiscussion(material.id);
    setMessages([]);
    setHarvest(null);
    setLinkedConcept(null);
    setHasHistory(false);
    setShowConcept(false);
    setShowHarvest(true);
    sentFirstRef.current = false;
    const firstQ = material.guideQuestions[0];
    if (firstQ) {
      setMessages([{ id: generateId(), role: 'coach', content: firstQ, timestamp: Date.now() }]);
    }
    sentFirstRef.current = true;
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

      {hasHistory && (
        <button className="md-new-chat" onClick={handleNewChat}>
          开始新对话
        </button>
      )}

      {/* Mode Selection */}
      <div className="md-mode-select">
        <div className="md-mode-label">选择模式</div>
        <div className="md-mode-buttons">
          <button
            className={`md-mode-btn ${!debateMode ? 'md-mode-btn-active' : ''}`}
            onClick={() => setDebateMode(false)}
          >
            自由讨论
          </button>
          <button
            className={`md-mode-btn ${debateMode ? 'md-mode-btn-active' : ''}`}
            onClick={() => setDebateMode(true)}
          >
            辩论模式
          </button>
        </div>
      </div>

      {debateMode ? (
        <DebateMode material={material} onBack={() => setDebateMode(false)} />
      ) : (
        <div className="md-chat-area">
          <div className="md-discussion" role="log" aria-live="polite" aria-label="对话记录">
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
            {loading && <LoadingDots />}
            <div ref={bottomRef} />
          </div>

          {!harvest ? (
            <>
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
              <div className="md-harvest-hint">当教练认为讨论到位时，会自动产出收获卡</div>
            </>
          ) : (
            <div className="md-done-hint">讨论结束，收获如下 ↓</div>
          )}
        </div>
      )}

      {harvest && (
        <div className="harvest-card">
          <button
            className="harvest-toggle"
            onClick={() => setShowHarvest(!showHarvest)}
          >
            {showHarvest ? '收起收获 ▲' : '展开收获 ▼'}
          </button>
          <Collapse isOpen={showHarvest}>
            <div className="harvest-content">
              {harvest.split('\n').map((line, i) => (
                <p
                  key={i}
                  className={line.startsWith('【') ? 'harvest-heading' : 'harvest-text'}
                  dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(line) }}
                />
              ))}
            </div>
          </Collapse>
        </div>
      )}

      {linkedConcept && (
        <div className="concept-card">
          <button
            className="concept-toggle"
            onClick={() => setShowConcept(!showConcept)}
          >
            {showConcept ? '收起概念 ▲' : `延伸阅读：${linkedConcept.concept} ▼`}
          </button>
          <Collapse isOpen={showConcept}>
            <div className="concept-content">
              <p className="concept-hook">{linkedConcept.hook}</p>
              <p className="concept-section-label">分析句式</p>
              <p className="concept-tpl">{linkedConcept.analysisTpl}</p>
              {linkedConcept.examples.map((ex, i) => (
                <div key={i} className="concept-example">
                  <span className="concept-example-type">
                    {ex.type === 'daily' ? '日常' : '论据'}
                  </span>
                  <span className="concept-example-text">{ex.text}</span>
                </div>
              ))}
            </div>
          </Collapse>
        </div>
      )}

      {!debateMode && <ReadingMaterials materialId={material.id} />}
    </div>
  );
}
