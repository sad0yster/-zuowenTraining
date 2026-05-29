# UX优化设计 — 用户体验四大改进

> 日期：2026-05-29
> 状态：待实现
> 基于：用户角色扮演模拟发现的3个核心痛点 + 1个bug

---

## 背景

通过目标用户（高三学生，55分段，想冲58+）的角色扮演模拟，发现以下问题：

1. **控制感缺失** — 写前对话和训练对话中，用户必须等AI判定"准备好"才能进入下一步，无法主动控制节奏
2. **复盘时看不到原文** — PostWriteReview页面无法查看作文原文，用户只能凭记忆对照AI反馈
3. **成长反馈断层** — MyPage的雷达图是静态平均值，无趋势变化、无维度-训练关联
4. **Bug: "修改作文"清空编辑器** — `handleRevise`将content设为空字符串，用户看到空白编辑器

---

## 改动一：写前对话控制权

### 改动文件

- `src/components/PreWriteChat.tsx`
- `src/components/PreWriteChat.css`

### 设计方案

**当前行为**：`coachReady`状态由AI返回的`ready`信号控制，"我已经想清楚了，开始写作"按钮仅在AI判定用户准备好后出现。

**新行为**：双轨制——按钮始终可点击，AI的ready信号作为建议而非门控。

### 交互细节

1. **按钮始终显示**：删除`coachReady`条件渲染，按钮从第1轮对话开始就可见
2. **早期nudge提示**（第0-1轮用户消息时）：
   - 按钮下方显示一行文字：`"建议至少和教练聊2轮再开始写"`
   - 样式：`{typography.caption}` (13px), `{colors.steel}`
   - 按钮本身不禁用，用户仍可点击
3. **AI ready信号**：当AI返回`ready: true`时，按钮上出现绿色标记
   - 标记样式：`{colors.brand-green}` 背景小badge，文字"教练认为你已准备好"
   - 样式：`{typography.micro}` (12px), `{rounded.full}`, padding `2px 8px`
4. **第2轮起**：nudge提示消失，按钮变为正常状态

### 代码改动

```tsx
// 删除 coachReady 状态变量
// 按钮始终渲染，不再依赖条件
<button
  className="start-writing-btn"
  onClick={handleStartWriting}
  disabled={summaryLoading}
>
  {summaryLoading ? '正在整理思考...' : '我已经想清楚了，开始写作'}
</button>

// nudge提示：根据用户消息轮数判断
{messages.filter(m => m.role === 'user').length < 2 && (
  <p className="pre-write-nudge">建议至少和教练聊2轮再开始写</p>
)}

// AI ready标记
{coachReady && (
  <span className="ready-badge">教练认为你已准备好</span>
)}
```

### CSS新增

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

---

## 改动二：复盘底部抽屉

### 改动文件

- `src/components/PostWriteReview.tsx`（集成抽屉）
- `src/components/PostWriteReview.css`（抽屉样式）
- 新增 `src/components/EssayDrawer.tsx`
- 新增 `src/components/EssayDrawer.css`

### 设计方案

在复盘对话页面添加底部抽屉组件，用户可随时查看作文原文。

### 交互流程

1. 复盘页面输入区上方始终显示一个触发按钮："查看我的作文"
2. 点击后，从底部滑出半屏抽屉显示作文全文
3. 抽屉可拖拽调整高度（最低30vh，最高80vh）
4. 收起方式：点击收起按钮、点击遮罩层、按Esc键
5. 抽屉展开时，复盘对话区域自动缩小，两者可同时可见

### 视觉规范（遵循Mintlify DESIGN.md）

| 属性 | Token | 值 |
|------|-------|-----|
| 背景 | `{colors.canvas}` | #ffffff |
| 顶部圆角 | `{rounded.lg}` | 12px |
| 阴影 | Level 2 | `rgba(0,0,0,0.08) 0 4px 12px` |
| 拖拽条 | `{colors.hairline}` + `{rounded.full}` | #e5e5e5, 32px宽, 4px高 |
| 标题文字 | `{typography.body-sm-medium}` | 14px, 500, `{colors.ink}` |
| 字数标签 | `{typography.micro}` | 12px, 500, `{colors.steel}` |
| 关闭按钮 | `button-primary` | `{colors.primary}` 底, `{colors.on-primary}` 文字, `{rounded.full}` |
| 触发按钮 | `button-secondary` | 透明底, 1px `{colors.hairline}` 边框, `{rounded.full}` |
| 遮罩层 | — | `rgba(0,0,0,0.3)` |
| 内边距 | `{spacing.xl}` | 24px |
| 段落间距 | `{spacing.sm}` | 12px |
| 动画 | — | 150ms ease |

### 组件接口

```tsx
interface EssayDrawerProps {
  content: string;       // 作文全文
  isOpen: boolean;
  onClose: () => void;
}
```

### EssayDrawer实现要点

- 使用`position: fixed`定位，`bottom: 0`，`left: 0`，`right: 0`
- 遮罩层覆盖全屏，点击关闭
- 拖拽条支持touch和mouse事件，动态计算drawer高度
- 拖拽时高度实时更新，松手后clamp到[30vh, 80vh]范围
- 拖拽速度超过阈值（>500px/s）时自动全开或收起
- 作文内容按段落（`\n`分割）渲染，空段落跳过
- 收起时先播放关闭动画（translateY下移 + opacity降低），动画结束后卸载

### PostWriteReview集成

- 在`chat-input-area`上方添加触发按钮
- 将`essayContent` prop传递给EssayDrawer
- 新增`drawerOpen`状态管理

---

## 改动三：成长反馈增强

### 改动文件

- `src/components/MyPage.tsx`
- `src/components/MyPage.css`

### 设计方案

在现有雷达图基础上增加趋势箭头和AI周总结卡片。

### 3a. 雷达图趋势箭头

**数据来源**：取每个维度最近2次essay的snapshot分数，计算差值。

**显示逻辑**：
- 差值 > 0：绿色 `↑0.3`（`{colors.brand-green}`）
- 差值 < 0：红色 `↓0.2`（`{colors.brand-error}`）
- 差值 = 0 或只有1次essay：不显示箭头

**样式**：
- 箭头使用 `{typography.micro}` (12px, 500)
- 位置：在radar-legend-item的数值右侧

```tsx
// label → snapshot key 映射
const LABEL_TO_KEY: Record<string, keyof ThinkingSnapshot> = {
  '立意': 'originality', '推理': 'reasoning', '视角': 'perspective',
  '结构': 'structure', '语言': 'language',
};

// 在 radar-legend 中添加趋势箭头
{essays.length >= 2 && (() => {
  const latest = essays[essays.length - 1].snapshot;
  const prev = essays[essays.length - 2].snapshot;
  const key = LABEL_TO_KEY[d.label];
  const diff = latest[key] - prev[key];
  if (diff > 0) return <span className="trend-up">↑{diff.toFixed(1)}</span>;
  if (diff < 0) return <span className="trend-down">↓{Math.abs(diff).toFixed(1)}</span>;
  return null;
})()}
```

### 3b. AI周总结卡片

**位置**：雷达图section下方

**样式**：`card-base`（`{colors.canvas}`, `{rounded.lg}`, `{spacing.xl}` padding, `{colors.hairline}` 边框）

**内容生成逻辑**（纯前端，无AI调用）：

```typescript
function generateWeeklySummary(essays: EssayRecord[]): string {
  if (essays.length < 2) return '完成更多训练后，这里会显示你的进步总结。';

  const thisWeek = essays.filter(e => isThisWeek(e.createdAt));
  const lastWeek = essays.filter(e => isLastWeek(e.createdAt));

  if (thisWeek.length === 0) return '本周还没有训练记录，保持节奏很重要。';
  if (lastWeek.length === 0) return `本周完成了${thisWeek.length}篇作文，继续加油。`;

  // 计算维度变化
  const thisAvg = averageSnapshot(thisWeek);
  const lastAvg = averageSnapshot(lastWeek);
  const changes = Object.entries(thisAvg)
    .map(([key, val]) => ({ key, diff: val - lastAvg[key] }))
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  const improved = changes.filter(c => c.diff > 0.1);
  const declined = changes.filter(c => c.diff < -0.1);

  const dimNames: Record<string, string> = {
    originality: '立意', reasoning: '推理', perspective: '视角',
    structure: '结构', language: '语言'
  };

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

**文字样式**：`{typography.body-sm}` (14px), `{colors.slate}`

---

## 改动四：修复"修改这篇作文"

### 改动文件

- `src/components/WritingDesk.tsx`

### 当前问题

```js
const handleRevise = () => {
    setOriginalContent(content);  // 保存原稿快照
    setContent('');                // ← 清空了编辑器
    setPostWriteMessages([]);
    setSummary(null);
    setStep('writing');
};
```

用户点击"修改这篇作文"后，Editor组件收到空字符串，显示空白编辑器。

### 修复方案

将 `setContent('')` 删除。content状态已经包含原文，不需要清空。`originalContent`仍保存一份快照用于复盘对比。

```js
const handleRevise = () => {
    setOriginalContent(content);  // 保存原稿快照
    // 不再setContent('')，保留原文供用户修改
    setPostWriteMessages([]);
    setSummary(null);
    setStep('writing');
};
```

### 复盘对比逻辑

修改后提交的作文进入PostWriteReview时：
- `essayContent` = 修改后的版本（当前content）
- `originalContent` = 原稿快照
- AI的`sendPostWriteMessage`已接收`originalContent`参数，可正常对比两稿差异

---

## 设计原则

1. **控制权归还用户** — AI的判断从"开关"变为"建议"
2. **信息就近可得** — 复盘时原文不需要跳转页面
3. **正反馈循环** — 练了→看到进步→继续练
4. **最小改动** — 每个改动独立，不引入新架构复杂度

---

## 不做的事

- 不引入新的状态管理方案
- 不改变AI prompt结构
- 不添加新的API调用（周总结纯前端计算）
- 不改变现有的Tab路由逻辑
- 不添加新的数据存储字段（复用现有snapshot结构）
