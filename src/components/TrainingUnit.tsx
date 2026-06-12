import { useState, useRef, useEffect, useMemo } from 'react';
import type { DrillType, DrillItemV2, ChatMessage } from '../types';
import {
  generateId,
  sendCoachingMessage,
  sendSynthesisPrompt,
  sendReviewEvaluation,
} from '../services/aiService';
import { saveDrillRecord, loadDrillRecords } from '../services/storageService';
import { ChatBubble } from './ChatBubble';
import { LoadingDots } from './LoadingDots';
import './TrainingUnit.css';

import deepAnalysisData from '../data/drills/deep-analysis.json';
import argumentData from '../data/drills/argument.json';
import perspectiveData from '../data/drills/perspective.json';

interface TrainingUnitProps {
  type: DrillType;
  onBack: () => void;
  onRefresh: () => void;
}

const UNIT_LABELS: Record<DrillType, string> = {
  'deep-analysis': '深度审题',
  'argument': '论证打磨',
  'perspective': '视角突破',
};

const DRILL_DATA_MAP: Record<DrillType, DrillItemV2[]> = {
  'deep-analysis': deepAnalysisData as DrillItemV2[],
  'argument': argumentData as DrillItemV2[],
  'perspective': perspectiveData as DrillItemV2[],
};

const MAX_COACHING_TURNS = 10;

type Step = 'select' | 'coaching' | 'synthesis' | 'review';

export function TrainingUnit({ type, onBack, onRefresh }: TrainingUnitProps) {
  const drillItems = DRILL_DATA_MAP[type];
  const [step, setStep] = useState<Step>('select');
  const [selectedItem, setSelectedItem] = useState<DrillItemV2 | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentDimensionId, setCurrentDimensionId] = useState('');
  const [exploredDimensions, setExploredDimensions] = useState<string[]>([]);
  const [dimensionTurns, setDimensionTurns] = useState<Record<string, number>>({});
  const [turnCount, setTurnCount] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [synthesisInput, setSynthesisInput] = useState('');
  const [synthesisPromptMsg, setSynthesisPromptMsg] = useState('');
  const [reviewData, setReviewData] = useState<{
    evaluation: string;
    referenceText: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewItem, setPreviewItem] = useState<DrillItemV2 | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const practicedTopics = useMemo(() => {
    const records = loadDrillRecords();
    return new Set(records.map(r => r.topic));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, reviewData]);

  const handleSelectItem = async (item: DrillItemV2) => {
    setSelectedItem(item);
    setChatMessages([]);
    setExploredDimensions([]);
    setTurnCount(0);
    setUserInput('');
    setStep('coaching');
    setLoading(true);

    const firstDimension = item.dimensions[0];
    setCurrentDimensionId(firstDimension.id);

    try {
      // Send initial coaching message (AI asks the first question)
      const result = await sendCoachingMessage(
        type,
        item.topic,
        item,
        firstDimension,
        [],
        1,
        [],
        '请开始引导我分析这道题。'
      );

      const coachMsg: ChatMessage = {
        id: generateId(),
        role: 'coach',
        content: result.message,
        timestamp: Date.now(),
      };
      setChatMessages([coachMsg]);
      setCurrentDimensionId(result.currentDim);
      if (result.ready) {
        setExploredDimensions((prev) =>
          prev.includes(result.currentDim) ? prev : [...prev, result.currentDim]
        );
      }
    } catch {
      const fallbackMsg: ChatMessage = {
        id: generateId(),
        role: 'coach',
        content: `让我们开始分析这道题。${firstDimension.coachingHints[0] || '你对这道题的第一反应是什么？'}`,
        timestamp: Date.now(),
      };
      setChatMessages([fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCoachingSubmit = async () => {
    if (!userInput.trim() || loading || !selectedItem) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: userInput.trim(),
      timestamp: Date.now(),
    };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setUserInput('');
    setLoading(true);

    const newTurnCount = turnCount + 1;
    setTurnCount(newTurnCount);

    // Find current dimension
    const currentDim =
      selectedItem.dimensions.find((d) => d.id === currentDimensionId) ||
      selectedItem.dimensions[0];

    try {
      const result = await sendCoachingMessage(
        type,
        selectedItem.topic,
        selectedItem,
        currentDim,
        exploredDimensions,
        newTurnCount,
        updatedMessages,
        userMsg.content
      );

      const coachMsg: ChatMessage = {
        id: generateId(),
        role: 'coach',
        content: result.message,
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, coachMsg]);
      setCurrentDimensionId(result.currentDim);

      // Track explored dimensions
      const newExplored = exploredDimensions.includes(result.currentDim)
        ? exploredDimensions
        : [...exploredDimensions, result.currentDim];
      setExploredDimensions(newExplored);

      // Track per-dimension turn counts
      setDimensionTurns((prev) => ({
        ...prev,
        [result.currentDim]: (prev[result.currentDim] || 0) + 1,
      }));

      // Check if should move to synthesis
      if (result.ready || newTurnCount >= MAX_COACHING_TURNS) {
        // Auto-transition to synthesis after a brief delay
        setTimeout(() => handleEnterSynthesis(newExplored), 500);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: 'coach',
          content: '抱歉，出了点问题。请再试一次。',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterSynthesis = async (_explored?: string[]) => {
    if (!selectedItem) return;
    setLoading(true);

    try {
      const prompt = await sendSynthesisPrompt(
        type,
        selectedItem.topic,
        selectedItem,
        chatMessages
      );
      setSynthesisPromptMsg(prompt);
    } catch {
      setSynthesisPromptMsg(
        '现在请把你在引导中发现的思考整合起来，写一段 200-400 字的综合分析。要有自己的核心主张，体现你探索过的思维层次。'
      );
    } finally {
      setLoading(false);
      setStep('synthesis');
    }
  };

  const handleSynthesisSubmit = async () => {
    if (!synthesisInput.trim() || loading || !selectedItem) return;
    setLoading(true);

    try {
      const result = await sendReviewEvaluation(
        type,
        selectedItem.topic,
        selectedItem,
        chatMessages,
        synthesisInput.trim()
      );

      setReviewData(result);

      // Save complete drill record
      saveDrillRecord({
        id: generateId(),
        type,
        topic: selectedItem.topic,
        coachingMessages: chatMessages,
        synthesisOutput: synthesisInput.trim(),
        aiEvaluation: result.evaluation,
        dimensionCoverage: Object.fromEntries(
          selectedItem.dimensions.map((d) => [
            d.id,
            dimensionTurns[d.id] || 0,
          ])
        ),
        createdAt: Date.now(),
      });

      setStep('review');
    } catch {
      setReviewData({
        evaluation: '评估暂时不可用，但你的分析已经完成了重要一步。',
        referenceText: selectedItem.dimensions
          .map((d) => `## ${d.name}\n${d.referenceAnalysis}`)
          .join('\n\n'),
      });
      setStep('review');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (step === 'coaching') handleCoachingSubmit();
      if (step === 'synthesis') handleSynthesisSubmit();
    }
  };

  const handleDone = () => {
    onRefresh();
    onBack();
  };

  const handleNextQuestion = () => {
    // Reset all state for a new question
    setStep('select');
    setSelectedItem(null);
    setChatMessages([]);
    setCurrentDimensionId('');
    setExploredDimensions([]);
    setDimensionTurns({});
    setTurnCount(0);
    setUserInput('');
    setSynthesisInput('');
    setSynthesisPromptMsg('');
    setReviewData(null);
  };

  // --- Select step ---
  if (step === 'select') {
    return (
      <div className="training-unit">
        <div className="tu-header">
          <button className="tu-back" onClick={onBack}>
            ←
          </button>
          <h3>{UNIT_LABELS[type]}</h3>
        </div>
        <p className="tu-prompt">选择一道题来练习</p>

        {previewItem && (
          <div className="tu-preview-card">
            <div className="tu-preview-topic">{previewItem.topic}</div>
            {previewItem.source && (
              <div className="tu-preview-source">{previewItem.source}</div>
            )}
            <div className="tu-preview-dims">
              {previewItem.dimensions.map((dim) => (
                <span key={dim.id} className="tu-preview-dim-tag">{dim.name}</span>
              ))}
            </div>
            <div className="tu-preview-actions">
              <button
                className="btn-primary"
                onClick={() => handleSelectItem(previewItem)}
              >
                开始训练
              </button>
              <button
                className="btn-secondary"
                onClick={() => setPreviewItem(null)}
              >
                取消
              </button>
            </div>
          </div>
        )}

        <div className="tu-topic-list">
          {drillItems.map((item) => (
            <button
              key={item.id}
              className={`tu-topic-card ${previewItem?.id === item.id ? 'tu-topic-card--selected' : ''}`}
              onClick={() => setPreviewItem(item)}
            >
              <span className="tu-card-topic">
                {item.topic}
              </span>
              <div className="tu-card-footer">
                {item.source && (
                  <span className="tu-card-source">{item.source}</span>
                )}
                {practicedTopics.has(item.topic) && (
                  <span className="tu-card-practiced">✓ 已练</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // --- Coaching step ---
  if (step === 'coaching') {
    const currentItem = selectedItem!;
    const currentDimObj = currentItem.dimensions.find(
      (d) => d.id === currentDimensionId
    );

    return (
      <div className="training-unit">
        <div className="tu-header">
          <button className="tu-back" onClick={() => setStep('select')}>
            ←
          </button>
          <h3>{UNIT_LABELS[type]}</h3>
        </div>
        <div className="tu-topic-banner">{currentItem.topic}</div>

        {/* Dimension progress indicator */}
        <div className="tu-dim-progress">
          {currentItem.dimensions.map((dim) => (
            <span
              key={dim.id}
              className={`tu-dim-dot ${
                exploredDimensions.includes(dim.id)
                  ? 'explored'
                  : dim.id === currentDimensionId
                  ? 'active'
                  : ''
              }`}
              title={dim.name}
            />
          ))}
          {currentDimObj && (
            <span className="tu-dim-label">
              正在探索：{currentDimObj.name}
            </span>
          )}
        </div>

        <div className="tu-feedback" role="log" aria-live="polite" aria-label="对话记录">
          {chatMessages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
          {loading && <LoadingDots />}
          <div ref={bottomRef} />
        </div>

        <div className="tu-coaching-input">
          <textarea
            className="form-textarea"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="写下你的思考..."
            rows={3}
            disabled={loading}
            autoFocus
          />
          <div className="tu-coaching-actions">
            <button
              className="btn-primary btn-full"
              onClick={handleCoachingSubmit}
              disabled={loading || !userInput.trim()}
            >
              {loading ? <LoadingDots text="教练思考中" /> : '发送'}
            </button>
            <button
              className="btn-secondary btn-sm"
              onClick={() => handleEnterSynthesis()}
              disabled={loading}
            >
              进入综合输出
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Synthesis step ---
  if (step === 'synthesis') {
    return (
      <div className="training-unit">
        <div className="tu-header">
          <button className="tu-back" onClick={() => setStep('coaching')}>
            ←
          </button>
          <h3>{UNIT_LABELS[type]} · 综合输出</h3>
        </div>
        <div className="tu-topic-banner">{selectedItem!.topic}</div>

        <div className="tu-synthesis-prompt">
          <ChatBubble
            message={{
              id: 'synthesis-prompt',
              role: 'coach',
              content: synthesisPromptMsg,
              timestamp: Date.now(),
            }}
          />
        </div>

        <textarea
          className="form-textarea"
          value={synthesisInput}
          onChange={(e) => setSynthesisInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="写下你的综合分析（200-400字）..."
          rows={10}
          autoFocus
        />

        <div className="tu-synthesis-actions">
          <span className="tu-word-count">
            {synthesisInput.replace(/\s/g, '').length} 字
          </span>
          <button
            className="btn-primary"
            onClick={handleSynthesisSubmit}
            disabled={loading || !synthesisInput.trim()}
          >
            {loading ? <LoadingDots text="教练评估中" /> : '提交分析'}
          </button>
        </div>
      </div>
    );
  }

  // --- Review step ---
  return (
    <div className="training-unit">
      <div className="tu-header">
        <button className="tu-back" onClick={handleDone}>
          ←
        </button>
        <h3>{UNIT_LABELS[type]} · 训练总结</h3>
      </div>

      {/* AI Evaluation */}
      {reviewData && (
        <>
          <div className="tu-review-evaluation">
            <ChatBubble
              message={{
                id: 'review-eval',
                role: 'coach',
                content: reviewData.evaluation,
                timestamp: Date.now(),
              }}
            />
          </div>

          {/* Reference Analysis */}
          <div className="tu-reference-section">
            <h4 className="tu-reference-title">这个题目值得深入的方向</h4>
            <div className="tu-reference-content">
              {reviewData.referenceText.split(/\n## /).filter(Boolean).map((section, i) => {
                const lines = section.split('\n');
                const title = lines[0]?.replace(/^#+\s*/, '') || '';
                const content = lines.slice(1).join('\n').trim();
                return (
                  <div key={i} className="tu-reference-dim">
                    <h5>{title}</h5>
                    <p>{content}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Exploration Journey */}
          <div className="tu-journey-section">
            <h4 className="tu-journey-title">你的探索旅程</h4>
            <div className="tu-journey-dims">
              {selectedItem!.dimensions.map((dim) => (
                <div key={dim.id} className="tu-journey-dim">
                  <span
                    className={`tu-journey-dot ${
                      exploredDimensions.includes(dim.id) ? 'explored' : ''
                    }`}
                  />
                  <span className="tu-journey-name">{dim.name}</span>
                  <span className="tu-journey-status">
                    {(dimensionTurns[dim.id] || 0) > 0
                      ? `${dimensionTurns[dim.id]}轮`
                      : '未触及'}
                  </span>
                </div>
              ))}
            </div>
            <p className="tu-journey-turns">
              共 {turnCount} 轮对话
            </p>
          </div>
        </>
      )}

      <div className="tu-review-actions">
        <button className="btn-primary" onClick={handleNextQuestion}>
          再来一题
        </button>
        <button className="btn-secondary" onClick={handleDone}>
          结束训练
        </button>
      </div>
    </div>
  );
}
