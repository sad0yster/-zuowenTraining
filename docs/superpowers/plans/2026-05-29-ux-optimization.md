# UX优化实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 解决用户角色扮演模拟中发现的4个体验问题：控制感缺失、复盘看不到原文、成长反馈断层、修改作文bug。

**Architecture:** 4个独立改动，各自修改1-3个文件，不引入新架构。新增1个组件（EssayDrawer），修改3个现有组件（PreWriteChat、PostWriteReview、MyPage）+ 1个bug修复（WritingDesk）。

**Tech Stack:** Vite + React 18 + TypeScript，CSS co-located，无测试框架。验证方式：`npx tsc --noEmit` + `npm run dev` 手动验证。

---

## 文件结构

| 操作 | 文件 | 职责 |
|------|------|------|
| 修改 | `src/components/PreWriteChat.tsx` | 删除coachReady门控，始终显示按钮，加nudge和ready标记 |
| 修改 | `src/components/PreWriteChat.css` | 新增nudge和ready-badge样式 |
| 新增 | `src/components/EssayDrawer.tsx` | 底部抽屉组件，显示作文原文 |
| 新增 | `src/components/EssayDrawer.css` | 抽屉样式（Mintlify tokens） |
| 修改 | `src/components/PostWriteReview.tsx` | 集成EssayDrawer，添加触发按钮 |
| 修改 | `src/components/PostWriteReview.css` | 触发按钮样式 |
| 修改 | `src/components/MyPage.tsx` | 雷达图趋势箭头 + 周总结卡片 |
| 修改 | `src/components/MyPage.css` | 趋势箭头和周总结卡片样式 |
| 修改 | `src/components/WritingDesk.tsx` | 修复handleRevise不清空content |

---

### Task 1: 修复"修改这篇作文"bug

**Files:**
- Modify: `src/components/WritingDesk.tsx:113-119`

最简单的改动，先做。`handleRevise`函数在第113行，删除第115行的`setContent('')`。

- [ ] **Step 1: 修改handleRevise函数**

打开 `src/components/WritingDesk.tsx`，找到第113-119行的`handleRevise`函数：

```tsx
const handleRevise = () => {
    setOriginalContent(content);
    setContent('');                // ← 删除这行
    setPostWriteMessages([]);
    setSummary(null);
    setStep('writing');
};
```

删除 `setContent('');` 这一行。修改后：

```tsx
const handleRevise = () => {
    setOriginalContent(content);
    setPostWriteMessages([]);
    setSummary(null);
    setStep('writing');
};
```

- [ ] **Step 2: 验证类型检查**

```bash
npx tsc --noEmit
```

Expected: 无错误输出

- [ ] **Step 3: 手动验证**

启动 `npm run dev`，完成一篇作文 → 点击"修改这篇作文" → 确认编辑器中显示原文内容。

- [ ] **Step 4: Commit**

```bash
git add src/components/WritingDesk.tsx
git commit -m "fix: preserve essay content when revising"
```

---

### Task 2: PreWriteChat控制权改造

**Files:**
- Modify: `src/components/PreWriteChat.tsx:1-147`
- Modify: `src/components/PreWriteChat.css:1-93`

- [ ] **Step 1: 修改PreWriteChat.tsx**

当前代码有3处需要改动：

**改动1：保留coachReady状态，但不再用它门控按钮**

`coachReady`状态变量（第23行）保留，因为它用于显示ready badge。但删除第136行的`{coachReady && (`条件渲染包裹。

**改动2：按钮始终显示**

将第136-144行的条件渲染：
```tsx
{coachReady && (
  <button
    className="start-writing-btn"
    onClick={handleStartWriting}
    disabled={summaryLoading}
  >
    {summaryLoading ? '正在整理思考...' : '我已经想清楚了，开始写作'}
  </button>
)}
```

改为始终渲染 + ready badge：
```tsx
<button
  className="start-writing-btn"
  onClick={handleStartWriting}
  disabled={summaryLoading}
>
  {summaryLoading ? '正在整理思考...' : '我已经想清楚了，开始写作'}
  {coachReady && <span className="ready-badge">教练认为你已准备好</span>}
</button>
```

**改动3：添加nudge提示**

在按钮后面（`</button>`之后，`</div>`之前）添加：
```tsx
{messages.filter(m => m.role === 'user').length < 2 && (
  <p className="pre-write-nudge">建议至少和教练聊2轮再开始写</p>
)}
```

完整的新return块（第107-147行区域）：

```tsx
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
```

- [ ] **Step 2: 添加CSS样式**

在 `src/components/PreWriteChat.css` 末尾追加：

```css
.pre-write-nudge {
  font-size: 13px;
  color: var(--color-muted);
  text-align: center;
  margin-top: 8px;
}

.ready-badge {
  display: inline-block;
  background: var(--color-accent);
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  margin-left: 8px;
}
```

- [ ] **Step 3: 验证类型检查**

```bash
npx tsc --noEmit
```

Expected: 无错误输出

- [ ] **Step 4: 手动验证**

启动 `npm run dev`，进入写作 → 选题 → 写前对话：
1. 第1轮对话时，确认按钮已显示，下方有nudge提示
2. 发送1条消息后，nudge仍然显示
3. 发送第2条消息后，nudge消失
4. 继续对话直到AI返回ready信号，确认按钮上出现绿色badge
5. 在任意时刻点击按钮，确认可以正常进入写作步骤

- [ ] **Step 5: Commit**

```bash
git add src/components/PreWriteChat.tsx src/components/PreWriteChat.css
git commit -m "feat: always show start-writing button with nudge and ready badge"
```

---

### Task 3: 创建EssayDrawer组件

**Files:**
- Create: `src/components/EssayDrawer.tsx`
- Create: `src/components/EssayDrawer.css`

- [ ] **Step 1: 创建EssayDrawer.css**

创建 `src/components/EssayDrawer.css`：

```css
/* === 遮罩层 === */
.essay-drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 100;
  opacity: 1;
  transition: opacity 150ms ease;
}

.essay-drawer-overlay.closing {
  opacity: 0;
}

/* === 抽屉主体 === */
.essay-drawer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--color-bg);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  box-shadow: rgba(0, 0, 0, 0.08) 0 4px 12px;
  z-index: 101;
  display: flex;
  flex-direction: column;
  transition: transform 150ms ease;
}

.essay-drawer.closing {
  transform: translateY(100%);
}

/* === 拖拽条 === */
.essay-drawer-handle {
  display: flex;
  justify-content: center;
  padding: 12px 0 8px;
  cursor: grab;
  flex-shrink: 0;
}

.essay-drawer-handle:active {
  cursor: grabbing;
}

.essay-drawer-handle-bar {
  width: 32px;
  height: 4px;
  background: var(--color-border);
  border-radius: var(--radius-pill);
}

/* === 抽屉头部 === */
.essay-drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px 12px;
  flex-shrink: 0;
}

.essay-drawer-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-primary);
}

.essay-drawer-wordcount {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-muted);
  margin-left: 8px;
}

.essay-drawer-close {
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius-pill);
  background: var(--color-primary);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.essay-drawer-close:hover {
  background: var(--color-accent-deep);
}

/* === 作文内容 === */
.essay-drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 24px;
}

.essay-drawer-para {
  font-size: 15px;
  line-height: 1.9;
  margin-bottom: 12px;
  text-indent: 2em;
  color: var(--color-secondary);
}
```

- [ ] **Step 2: 创建EssayDrawer.tsx**

创建 `src/components/EssayDrawer.tsx`：

```tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import './EssayDrawer.css';

interface EssayDrawerProps {
  content: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EssayDrawer({ content, isOpen, onClose }: EssayDrawerProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [drawerHeight, setDrawerHeight] = useState(50); // vh
  const draggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const lastYRef = useRef(0);
  const lastTimeRef = useRef(0);

  const wordCount = content.replace(/\s/g, '').length;

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 150);
  }, [onClose]);

  // Esc key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Drag handlers
  const handleDragStart = (clientY: number) => {
    draggingRef.current = true;
    startYRef.current = clientY;
    startHeightRef.current = drawerHeight;
    lastYRef.current = clientY;
    lastTimeRef.current = Date.now();
  };

  const handleDragMove = (clientY: number) => {
    if (!draggingRef.current) return;
    const delta = startYRef.current - clientY;
    const viewportH = window.innerHeight;
    const deltaVh = (delta / viewportH) * 100;
    const newHeight = Math.min(80, Math.max(30, startHeightRef.current + deltaVh));
    setDrawerHeight(newHeight);
    lastYRef.current = clientY;
    lastTimeRef.current = Date.now();
  };

  const handleDragEnd = (clientY: number) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;

    // Velocity-based snap
    const elapsed = Date.now() - lastTimeRef.current;
    const velocity = elapsed > 0 ? (lastYRef.current - clientY) / elapsed : 0; // px/ms
    if (velocity > 0.5) {
      setDrawerHeight(80); // fast swipe up → full open
    } else if (velocity < -0.5) {
      handleClose(); // fast swipe down → close
    }
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientY);
    const handleMouseMove = (e: MouseEvent) => handleDragMove(e.clientY);
    const handleMouseUp = (e: MouseEvent) => {
      handleDragEnd(e.clientY);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    handleDragEnd(e.changedTouches[0].clientY);
  };

  if (!isOpen) return null;

  const paragraphs = content.split('\n').filter(p => p.trim());

  return (
    <>
      <div
        className={`essay-drawer-overlay${isClosing ? ' closing' : ''}`}
        onClick={handleClose}
      />
      <div
        className={`essay-drawer${isClosing ? ' closing' : ''}`}
        style={{ height: `${drawerHeight}vh` }}
      >
        <div
          className="essay-drawer-handle"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="essay-drawer-handle-bar" />
        </div>

        <div className="essay-drawer-header">
          <div>
            <span className="essay-drawer-title">我的作文</span>
            <span className="essay-drawer-wordcount">{wordCount} 字</span>
          </div>
          <button className="essay-drawer-close" onClick={handleClose}>
            收起
          </button>
        </div>

        <div className="essay-drawer-content">
          {paragraphs.map((para, i) => (
            <p key={i} className="essay-drawer-para">{para}</p>
          ))}
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 3: 验证类型检查**

```bash
npx tsc --noEmit
```

Expected: 无错误输出

- [ ] **Step 4: Commit**

```bash
git add src/components/EssayDrawer.tsx src/components/EssayDrawer.css
git commit -m "feat: add EssayDrawer bottom sheet component"
```

---

### Task 4: PostWriteReview集成EssayDrawer

**Files:**
- Modify: `src/components/PostWriteReview.tsx:1-221`
- Modify: `src/components/PostWriteReview.css:1-88`

- [ ] **Step 1: 修改PostWriteReview.tsx**

**改动1：导入EssayDrawer**

在第7行的import之后添加：
```tsx
import { EssayDrawer } from './EssayDrawer';
```

**改动2：添加drawerOpen状态**

在第37行（`const [loading, setLoading] = useState(false);`）之后添加：
```tsx
const [drawerOpen, setDrawerOpen] = useState(false);
```

**改动3：在chat-input-area上方添加触发按钮**

在第200行（`<div className="chat-input-area">`）之前添加：
```tsx
<button
  className="view-essay-btn"
  onClick={() => setDrawerOpen(true)}
>
  查看我的作文
</button>
```

**改动4：在组件末尾（return的最后，`</div>`之前）添加EssayDrawer**

在第218行（`</div>`闭合标签）之前添加：
```tsx
<EssayDrawer
  content={essayContent}
  isOpen={drawerOpen}
  onClose={() => setDrawerOpen(false)}
/>
```

完整的return块变为：
```tsx
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
```

- [ ] **Step 2: 添加触发按钮样式**

在 `src/components/PostWriteReview.css` 末尾追加：

```css
.view-essay-btn {
  width: 100%;
  padding: 8px 16px;
  margin-bottom: 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.view-essay-btn:hover {
  background: var(--color-bg-hover);
}
```

- [ ] **Step 3: 验证类型检查**

```bash
npx tsc --noEmit
```

Expected: 无错误输出

- [ ] **Step 4: 手动验证**

启动 `npm run dev`，完成一篇作文 → 进入复盘页面：
1. 确认"查看我的作文"按钮显示在输入区上方
2. 点击按钮，确认抽屉从底部滑出
3. 确认作文内容按段落显示，字数正确
4. 拖拽拖拽条，确认高度可调整（30vh-80vh范围）
5. 点击遮罩层/收起按钮/Esc，确认抽屉关闭
6. 确认关闭后复盘对话可以正常继续

- [ ] **Step 5: Commit**

```bash
git add src/components/PostWriteReview.tsx src/components/PostWriteReview.css
git commit -m "feat: add essay drawer to post-write review"
```

---

### Task 5: MyPage成长反馈增强

**Files:**
- Modify: `src/components/MyPage.tsx:1-287`
- Modify: `src/components/MyPage.css:1-259`

- [ ] **Step 1: 添加趋势箭头到雷达图**

在 `src/components/MyPage.tsx` 中，在第9行（`DRILL_LABELS`定义）之后添加label到snapshot key的映射：

```tsx
const LABEL_TO_KEY: Record<string, keyof ThinkingSnapshot> = {
  '立意': 'originality',
  '推理': 'reasoning',
  '视角': 'perspective',
  '结构': 'structure',
  '语言': 'language',
};
```

然后修改第148-156行的radar-legend渲染。当前代码：

```tsx
<div className="radar-legend">
  {radarData.map((d) => (
    <div key={d.label} className="radar-legend-item">
      <span className="rl-label">{d.label}</span>
      <span className="rl-value">{d.value}</span>
    </div>
  ))}
</div>
```

改为：

```tsx
<div className="radar-legend">
  {radarData.map((d) => {
    const key = LABEL_TO_KEY[d.label];
    let trendDiff = 0;
    if (essays.length >= 2) {
      const latest = essays[essays.length - 1].snapshot;
      const prev = essays[essays.length - 2].snapshot;
      trendDiff = Math.round((latest[key] - prev[key]) * 10) / 10;
    }
    return (
      <div key={d.label} className="radar-legend-item">
        <span className="rl-label">{d.label}</span>
        <span className="rl-value">{d.value}</span>
        {trendDiff > 0 && <span className="trend-up">↑{trendDiff.toFixed(1)}</span>}
        {trendDiff < 0 && <span className="trend-down">↓{Math.abs(trendDiff).toFixed(1)}</span>}
      </div>
    );
  })}
</div>
```

- [ ] **Step 2: 添加周总结卡片**

在 `src/components/MyPage.tsx` 中，定义周总结生成函数（在组件外部，`LABEL_TO_KEY`之后）：

```tsx
function isThisWeek(timestamp: number): boolean {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  return timestamp >= weekStart.getTime();
}

function isLastWeek(timestamp: number): boolean {
  const now = new Date();
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(thisWeekStart.getDate() - now.getDay());
  thisWeekStart.setHours(0, 0, 0, 0);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  return timestamp >= lastWeekStart.getTime() && timestamp < thisWeekStart.getTime();
}

function averageSnapshot(records: EssayRecord[]): ThinkingSnapshot {
  const n = records.length;
  const sum = records.reduce(
    (acc, e) => ({
      originality: acc.originality + e.snapshot.originality,
      reasoning: acc.reasoning + e.snapshot.reasoning,
      perspective: acc.perspective + e.snapshot.perspective,
      structure: acc.structure + e.snapshot.structure,
      language: acc.language + e.snapshot.language,
    }),
    { originality: 0, reasoning: 0, perspective: 0, structure: 0, language: 0 }
  );
  return {
    originality: sum.originality / n,
    reasoning: sum.reasoning / n,
    perspective: sum.perspective / n,
    structure: sum.structure / n,
    language: sum.language / n,
  };
}

function generateWeeklySummary(essays: EssayRecord[]): string {
  if (essays.length < 2) return '完成更多训练后，这里会显示你的进步总结。';

  const thisWeek = essays.filter(e => isThisWeek(e.createdAt));
  const lastWeek = essays.filter(e => isLastWeek(e.createdAt));

  if (thisWeek.length === 0) return '本周还没有训练记录，保持节奏很重要。';
  if (lastWeek.length === 0) return `本周完成了${thisWeek.length}篇作文，继续加油。`;

  const thisAvg = averageSnapshot(thisWeek);
  const lastAvg = averageSnapshot(lastWeek);
  const dimNames: Record<string, string> = {
    originality: '立意', reasoning: '推理', perspective: '视角',
    structure: '结构', language: '语言'
  };
  const changes = (Object.keys(dimNames) as Array<keyof ThinkingSnapshot>)
    .map(key => ({ key, diff: thisAvg[key] - lastAvg[key] }))
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  const improved = changes.filter(c => c.diff > 0.1);
  const declined = changes.filter(c => c.diff < -0.1);

  let summary = '';
  if (improved.length > 0) {
    const names = improved.map(c => dimNames[c.key]).join('、');
    summary += `本周${names}维度有进步。`;
  }
  if (declined.length > 0) {
    const names = declined.map(c => dimNames[c.key]).join('、');
    summary += `注意${names}维度有所下降。`;
  }
  if (!summary) summary = '本周各维度保持稳定，继续保持训练节奏。';
  return summary;
}
```

然后在radar section之后（第157行`</section>`之后），添加周总结卡片：

```tsx
{essays.length > 0 && (
  <section className="my-section">
    <h3>本周总结</h3>
    <div className="weekly-summary-card">
      <p className="weekly-summary-text">{generateWeeklySummary(essays)}</p>
    </div>
  </section>
)}
```

- [ ] **Step 3: 添加CSS样式**

在 `src/components/MyPage.css` 末尾追加：

```css
/* === 趋势箭头 === */
.trend-up {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-accent);
  margin-left: 4px;
}

.trend-down {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-warning);
  margin-left: 4px;
}

/* === 周总结卡片 === */
.weekly-summary-card {
  background: var(--color-bg);
  border-radius: var(--radius-lg);
  padding: 24px;
  border: 1px solid var(--color-border);
}

.weekly-summary-text {
  font-size: 14px;
  color: var(--color-body);
  line-height: 1.5;
}
```

注意：`var(--color-warning)` 在App.css中定义为 `#d44`，接近Mintlify的 `{colors.brand-error}`。对于"下降"状态是合适的。

- [ ] **Step 4: 验证类型检查**

```bash
npx tsc --noEmit
```

Expected: 无错误输出

- [ ] **Step 5: 手动验证**

启动 `npm run dev`，进入"我的"页面：
1. 如果只有0-1篇作文：确认不显示趋势箭头，周总结显示"完成更多训练后..."
2. 如果有2篇以上作文：确认雷达图数值旁出现趋势箭头（↑/↓）
3. 确认周总结卡片显示，内容与实际维度变化一致
4. 确认卡片样式符合Mintlify规范（圆角、边框、间距）

- [ ] **Step 6: Commit**

```bash
git add src/components/MyPage.tsx src/components/MyPage.css
git commit -m "feat: add trend arrows and weekly summary to growth page"
```

---

### Task 6: 最终验证

- [ ] **Step 1: TypeScript检查**

```bash
npx tsc --noEmit
```

Expected: 无错误

- [ ] **Step 2: 生产构建**

```bash
npm run build
```

Expected: 构建成功，无错误

- [ ] **Step 3: 完整流程手动测试**

走一遍完整的用户旅程：
1. 写作 → 选题 → 写前对话（验证按钮始终显示、nudge、ready badge）→ 写作 → 提交 → 复盘（验证抽屉可打开/关闭/拖拽）→ 完成 → 修改作文（验证编辑器有原文）→ 再次提交 → 完成
2. 训练 → 选题 → 对话 → 综合输出 → 总结
3. 我的 → 验证趋势箭头、周总结卡片、雷达图正常显示

- [ ] **Step 4: Final commit (if needed)**

如有小修复，amend到对应task的commit中。
