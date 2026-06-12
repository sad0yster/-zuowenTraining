import { useState, useRef, useEffect } from 'react';
import type { Material, DebateStage, DebateSide, DebateRound } from '../types';
import { generateId, sendDebateMessage } from '../services/aiService';
import { DEBATE_PROMPTS } from '../prompts/debate';
import { saveDebateRecord, loadDebateRecordsByMaterial, clearDebateRecord } from '../services/storageService';
import { LoadingDots } from './LoadingDots';
import './DebateMode.css';

interface DebateModeProps {
  material: Material;
  onBack: () => void;
}

const STAGES: { key: DebateStage; label: string }[] = [
  { key: 'concept', label: '概念界定' },
  { key: 'opposition', label: '寻找对立' },
  { key: 'synthesis', label: '更高维度' },
  { key: 'application', label: '现实联系' },
];

function getStageForRound(round: number): DebateStage {
  if (round <= 2) return 'concept';
  if (round <= 4) return 'opposition';
  if (round <= 6) return 'synthesis';
  return 'application';
}

function getCompletedStages(rounds: DebateRound[]): DebateStage[] {
  const stageRoundCounts = new Map<DebateStage, number>();
  for (const r of rounds) {
    stageRoundCounts.set(r.stage, (stageRoundCounts.get(r.stage) || 0) + 1);
  }
  const completed: DebateStage[] = [];
  for (const [stage, count] of stageRoundCounts) {
    if (count >= 2) completed.push(stage);
  }
  return completed;
}

export function DebateMode({ material, onBack }: DebateModeProps) {
  const [rounds, setRounds] = useState<DebateRound[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [harvest, setHarvest] = useState<string | null>(null);
  const [userSide, setUserSide] = useState<DebateSide>('for');
  const [prevSide, setPrevSide] = useState<DebateSide | null>(null);
  const [guideMessage, setGuideMessage] = useState<string | null>(null);
  const [showEndPrompt, setShowEndPrompt] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const restoredRef = useRef(false);

  const currentStage = getStageForRound(currentRound);
  const completedStages = getCompletedStages(rounds);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [rounds, guideMessage]);

  // Restore saved debate on mount
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const records = loadDebateRecordsByMaterial(material.id);
    if (records.length > 0) {
      const latest = records[records.length - 1];
      setRounds(latest.rounds);
      setCurrentRound(latest.rounds.length + 1);
      if (latest.harvest) setHarvest(latest.harvest);
      if (latest.rounds.length > 0) {
        const lastRound = latest.rounds[latest.rounds.length - 1];
        setPrevSide(lastRound.side);
      }
    }
  }, [material.id]);

  // Auto-send opening prompt (skip if restored)
  useEffect(() => {
    if (restoredRef.current && rounds.length > 0) return;
    const openingPrompt = DEBATE_PROMPTS.opening(material);
    sendDebateMessage(openingPrompt, material).then((response) => {
      setGuideMessage(response);
    });
  }, []);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading || harvest) return;

    const sideSwitched = prevSide !== null && prevSide !== userSide;
    const stage = getStageForRound(currentRound);

    const userRound: DebateRound = {
      round: currentRound,
      side: userSide,
      content: trimmed,
      isUser: true,
      timestamp: Date.now(),
      stage,
    };

    setRounds((prev) => [...prev, userRound]);
    setInput('');
    setPrevSide(userSide);
    setLoading(true);

    try {
      const prompt = DEBATE_PROMPTS.respond(
        material,
        trimmed,
        userSide,
        stage,
        currentRound,
        sideSwitched,
      );
      const response = await sendDebateMessage(prompt, material);

      const aiRound: DebateRound = {
        round: currentRound,
        side: userSide === 'for' ? 'against' : 'for',
        content: response,
        isUser: false,
        timestamp: Date.now(),
        stage,
      };
      setRounds((prev) => [...prev, aiRound]);
      setCurrentRound((prev) => prev + 1);

      // Check end conditions: all 4 stages have 2+ rounds, or 8 rounds total
      const updatedRounds = [...rounds, userRound, aiRound];
      const allDone = getCompletedStages(updatedRounds).length >= 4;
      if (allDone || currentRound >= 8) {
        setShowEndPrompt(true);
      }
    } catch {
      setRounds((prev) => [
        ...prev,
        {
          round: currentRound,
          side: userSide === 'for' ? 'against' : 'for',
          content: '抱歉，出了点问题。请稍后再试。',
          isUser: false,
          timestamp: Date.now(),
          stage,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleEndDebate = async () => {
    setShowEndPrompt(false);
    setLoading(true);
    try {
      const harvestPrompt = DEBATE_PROMPTS.harvest(material, rounds);
      const harvestText = await sendDebateMessage(harvestPrompt, material);
      setHarvest(harvestText);

      // Save record
      saveDebateRecord({
        id: generateId(),
        materialId: material.id,
        rounds,
        currentStage,
        completedStages,
        harvest: harvestText,
        createdAt: Date.now(),
      });
    } catch {
      setHarvest('生成收获卡时出错，请重试。');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyHarvest = () => {
    if (harvest) {
      navigator.clipboard.writeText(harvest);
    }
  };

  const handleNewDebate = () => {
    // Clear saved records for this material
    const records = loadDebateRecordsByMaterial(material.id);
    records.forEach(r => clearDebateRecord(r.id));
    // Reset state
    setRounds([]);
    setCurrentRound(1);
    setHarvest(null);
    setPrevSide(null);
    setShowEndPrompt(false);
    // Re-send opening
    const openingPrompt = DEBATE_PROMPTS.opening(material);
    sendDebateMessage(openingPrompt, material).then((response) => {
      setGuideMessage(response);
    });
  };

  const hasHistory = rounds.length > 0 && !harvest;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="debate-mode">
      {/* Header */}
      <div className="dm-header">
        <button className="dm-back" onClick={onBack}>
          &larr;
        </button>
        <h3 className="dm-title">{material.title}</h3>
        {hasHistory && (
          <button className="dm-new-debate" onClick={handleNewDebate}>
            开始新辩论
          </button>
        )}
      </div>

      {/* Stage indicator */}
      <div className="dm-stages">
        {STAGES.map((s) => (
          <span
            key={s.key}
            className={`dm-stage ${
              s.key === currentStage
                ? 'dm-stage-active'
                : completedStages.includes(s.key)
                ? 'dm-stage-done'
                : ''
            }`}
          >
            {completedStages.includes(s.key) && s.key !== currentStage ? '✓ ' : ''}
            {s.label}
          </span>
        ))}
      </div>

      {/* Debate card */}
      <div className="dm-card">
        {/* Guide message */}
        {guideMessage && (
          <div className="dm-guide">{guideMessage}</div>
        )}

        {/* Rounds */}
        {rounds.length > 0 && (
          <div className="dm-rounds">
            {rounds.map((round, index) => (
              <div key={index} className="dm-round">
                <div className="dm-round-label">
                  <span className={`dm-round-side ${round.side === 'for' ? 'dm-round-side-for' : 'dm-round-side-against'}`}>
                    {round.side === 'for' ? '正方' : '反方'}
                  </span>
                  <span className="dm-round-meta">
                    {round.isUser ? '我' : 'AI'} · 第{round.round}轮
                  </span>
                </div>
                <div className="dm-round-content">{round.content}</div>
              </div>
            ))}
            {loading && <LoadingDots />}
          </div>
        )}

        {/* End prompt */}
        {showEndPrompt && (
          <div className="dm-end-prompt">
            <p>你想继续深入，还是总结今天的收获？</p>
            <div className="dm-end-buttons">
              <button className="dm-btn-secondary" onClick={() => setShowEndPrompt(false)}>
                继续辩论
              </button>
              <button className="dm-btn-primary" onClick={handleEndDebate}>
                总结收获
              </button>
            </div>
          </div>
        )}

        {/* Input area */}
        {!harvest && !showEndPrompt && (
          <div className="dm-input-area">
            <div className="dm-side-tabs">
              <button
                className={`dm-side-tab ${userSide === 'for' ? 'dm-side-tab-active' : ''}`}
                onClick={() => setUserSide('for')}
              >
                正方
              </button>
              <button
                className={`dm-side-tab ${userSide === 'against' ? 'dm-side-tab-active' : ''}`}
                onClick={() => setUserSide('against')}
              >
                反方
              </button>
            </div>
            <textarea
              className="dm-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`写下你的${userSide === 'for' ? '正方' : '反方'}论点...`}
              disabled={loading}
            />
            <div className="dm-input-footer">
              <button
                className="dm-btn-primary"
                onClick={handleSend}
                disabled={loading || !input.trim()}
              >
                提交
              </button>
            </div>
          </div>
        )}

        {/* Harvest card */}
        {harvest && (
          <div className="dm-harvest">
            <div className="dm-harvest-content">
              {harvest.split('\n').map((line, i) => (
                <p
                  key={i}
                  className={line.startsWith('【') ? 'dm-harvest-heading' : 'dm-harvest-text'}
                >
                  {line}
                </p>
              ))}
            </div>
            <div className="dm-harvest-actions">
              <button className="dm-btn-secondary" onClick={handleCopyHarvest}>
                复制
              </button>
              <button className="dm-btn-primary" onClick={onBack}>
                保存并返回
              </button>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
