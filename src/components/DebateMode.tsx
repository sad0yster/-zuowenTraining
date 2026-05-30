import { useState, useRef, useEffect } from 'react';
import type { Material, DebateMode as DebateModeType, DebateSide, DebateRound } from '../types';
import { generateId, sendDebateMessage } from '../services/aiService';
import { DEBATE_PROMPTS } from '../prompts/debate';
import { saveDebateRecord } from '../services/storageService';
import { LoadingDots } from './LoadingDots';
import './DebateMode.css';

interface DebateModeProps {
  material: Material;
  onBack: () => void;
}

export function DebateMode({ material, onBack }: DebateModeProps) {
  const [mode, setMode] = useState<DebateModeType | null>(null);
  const [userSide, setUserSide] = useState<DebateSide | null>(null);
  const [rounds, setRounds] = useState<DebateRound[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [rounds]);

  const handleStartDebate = (selectedMode: DebateModeType) => {
    setMode(selectedMode);
    if (selectedMode === 'opponent') {
      // In opponent mode, user needs to choose side first
    } else {
      // In judge mode, start with for side
      setRounds([]);
      setCurrentRound(1);
    }
  };

  const handleSelectSide = (side: DebateSide) => {
    setUserSide(side);
    setRounds([]);
    setCurrentRound(1);
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userRound: DebateRound = {
      round: currentRound,
      side: mode === 'opponent' ? userSide! : (currentRound % 2 === 1 ? 'for' : 'against'),
      content: trimmed,
      isUser: true,
      timestamp: Date.now(),
    };

    setRounds(prev => [...prev, userRound]);
    setInput('');
    setLoading(true);

    try {
      if (mode === 'opponent') {
        // AI generates opponent argument
        const prompt = DEBATE_PROMPTS.generateOpponent(material, userSide!, trimmed, currentRound);
        const response = await sendDebateMessage(prompt);

        const aiRound: DebateRound = {
          round: currentRound,
          side: userSide === 'for' ? 'against' : 'for',
          content: response,
          isUser: false,
          timestamp: Date.now(),
        };
        setRounds(prev => [...prev, aiRound]);
        setCurrentRound(prev => prev + 1);
      } else {
        // Judge mode - after both sides presented, AI evaluates
        if (currentRound >= 2) {
          const forArg = rounds.find(r => r.side === 'for')?.content || '';
          const againstArg = rounds.find(r => r.side === 'against')?.content || '';
          const prompt = DEBATE_PROMPTS.judgeEvaluation(material, forArg, againstArg);
          const response = await sendDebateMessage(prompt);
          setSummary(response);
        } else {
          setCurrentRound(prev => prev + 1);
        }
      }
    } catch {
      setRounds(prev => [...prev, {
        round: currentRound,
        side: userSide || 'for',
        content: '抱歉，出了点问题。请稍后再试。',
        isUser: false,
        timestamp: Date.now(),
      }]);
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

  const handleSaveDebate = () => {
    const record = {
      id: generateId(),
      materialId: material.id,
      mode: mode!,
      rounds,
      summary: summary || undefined,
      createdAt: Date.now(),
    };
    saveDebateRecord(record);
    onBack();
  };

  // Mode selection screen
  if (!mode) {
    return (
      <div className="debate-mode">
        <div className="dm-header">
          <button className="dm-back" onClick={onBack}>&larr;</button>
          <h3>{material.title}</h3>
        </div>
        <div className="dm-situation">{material.situation}</div>
        <div className="dm-tension">
          <div className="dm-tension-label">核心张力</div>
          <div className="dm-tension-value">{material.coreTension}</div>
        </div>
        <div className="dm-mode-select">
          <div className="dm-mode-label">选择模式</div>
          <div className="dm-mode-buttons">
            <button className="dm-mode-btn" onClick={() => handleStartDebate('judge')}>
              用户当裁判
            </button>
            <button className="dm-mode-btn dm-mode-btn-active" onClick={() => handleStartDebate('opponent')}>
              AI当对手
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Side selection screen (opponent mode only)
  if (mode === 'opponent' && !userSide) {
    return (
      <div className="debate-mode">
        <div className="dm-header">
          <button className="dm-back" onClick={() => setMode(null)}>&larr;</button>
          <h3>选择立场</h3>
        </div>
        <div className="dm-side-select">
          <button className="dm-side-btn" onClick={() => handleSelectSide('for')}>
            正方：支持
          </button>
          <button className="dm-side-btn" onClick={() => handleSelectSide('against')}>
            反方：反对
          </button>
        </div>
      </div>
    );
  }

  // Debate screen
  return (
    <div className="debate-mode">
      <div className="dm-header">
        <button className="dm-back" onClick={onBack}>&larr;</button>
        <h3>辩论：{material.title}</h3>
      </div>

      <div className="dm-debate-area">
        {/* Round indicator */}
        <div className="dm-round-indicator">
          <div className="dm-sides">
            <span className={`dm-side ${rounds.length % 2 === 0 ? 'dm-side-active' : ''}`}>
              正方
            </span>
            <span className={`dm-side ${rounds.length % 2 === 1 ? 'dm-side-active' : ''}`}>
              反方
            </span>
          </div>
          <span className="dm-round-number">第 {currentRound} 轮</span>
        </div>

        {/* Rounds display */}
        <div className="dm-rounds">
          {rounds.map((round, index) => (
            <div key={index} className={`dm-round ${round.isUser ? 'dm-round-user' : 'dm-round-ai'}`}>
              <div className="dm-round-header">
                <span className={`dm-round-side ${round.side === 'for' ? 'dm-round-side-for' : 'dm-round-side-against'}`}>
                  {round.side === 'for' ? '正方' : '反方'}
                </span>
                <span className="dm-round-role">{round.isUser ? '我' : 'AI'}</span>
              </div>
              <div className="dm-round-content">{round.content}</div>
            </div>
          ))}
          {loading && <LoadingDots />}
          <div ref={bottomRef} />
        </div>

        {/* Summary */}
        {summary && (
          <div className="dm-summary">
            <div className="dm-summary-label">综合评估</div>
            <div className="dm-summary-content">{summary}</div>
            <button className="dm-save-btn" onClick={handleSaveDebate}>
              保存并返回
            </button>
          </div>
        )}

        {/* Input */}
        {!summary && (
          <div className="dm-input-area">
            <textarea
              className="dm-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={mode === 'opponent'
                ? `写下你的${userSide === 'for' ? '正方' : '反方'}论点...`
                : `写下${currentRound % 2 === 1 ? '正方' : '反方'}论点...`
              }
              disabled={loading}
            />
            <button
              className="dm-send-btn"
              onClick={handleSend}
              disabled={loading || !input.trim()}
            >
              提交
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
