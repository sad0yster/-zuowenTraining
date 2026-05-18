# Mintlify 风格视觉重设计

## 概述

将高分作文训练 app 的视觉风格全面切换为 Mintlify 设计系统。采用方案 B：全局 CSS 变量映射 + 核心组件样式重写。不改动 TSX 结构和页面布局，仅通过 CSS 实现视觉升级。

**设计来源：** `awesome-design-md-main/design-md/mintlify/DESIGN.md`

**范围：** 约 10 个 CSS 文件，0 个 TSX 文件

---

## 1. 色彩系统

### 全局变量映射

| 变量 | 当前值 | 新值 | Token 名 |
|------|--------|------|----------|
| `--color-primary` | `#1a1a1a` | `#0a0a0a` | Ink |
| `--color-secondary` | `#444` | `#3a3a3c` | Slate |
| `--color-body` | `#666` | `#5a5a5c` | Steel |
| `--color-muted` | `#999` | `#888888` | Stone |
| `--color-disabled` | `#ccc` | `#a8a8aa` | Muted |
| `--color-border` | `#eee` | `#e5e5e5` | Hairline |
| `--color-border-dark` | `#ddd` | `#ededed` | Hairline Soft |
| `--color-bg-subtle` | `#f9f9f9` | `#fafafa` | Surface Soft |
| `--color-bg-hover` | `#fafafa` | `#f7f7f7` | Surface |
| `--color-bg-neutral` | `#f5f5f5` | `#f7f7f7` | Surface |
| `--color-bg` | `#fff` | `#ffffff` | Canvas |
| `--color-page` | `#f5f5f5` | `#f7f7f7` | Surface |
| `--color-warning` | `#d44` | `#d44` | 不变 |

### 新增变量

| 变量 | 值 | 用途 |
|------|-----|------|
| `--color-accent` | `#00d4a4` | Mint 绿 — 活跃状态、焦点边框、特色卡片 |
| `--color-accent-deep` | `#00b48a` | 按下状态 |
| `--color-accent-soft` | `rgba(0,212,164,0.08)` | 品牌色微光阴影 |
| `--color-tag` | `#3772cf` | 标签/标注色 |
| `--color-surface-code` | `#1c1c1e` | 深色代码块背景 |

---

## 2. 字体与排版

### 字体引入

在 `index.html` 中添加 Google Fonts 引入：

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### CSS 变量

```css
--font-ui: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
--font-code: 'Geist Mono', 'SF Mono', Menlo, Consolas, monospace;
```

### 排版层级

| 用途 | 当前 | 新值 | 说明 |
|------|------|------|------|
| 页面标题 | 20px/600 | 28px/600, letter-spacing: -0.5px | heading-3 |
| 卡片标题 | 15px/600 | 18px/600 | heading-5 |
| 正文 | 14px | 16px/1.50 | body-md |
| 辅助文字 | 12px | 13px/1.40 | caption |
| 标签文字 | 12px | 11px/600/letter-spacing: 0.5px | micro-uppercase |
| 按钮文字 | 15px | 14px/500 | button-md |

### 原则

- 标题使用负字间距（`letter-spacing: -0.5px` 起）
- 正文行高 1.50
- Inter 用于所有 UI 文字
- 徽章/标签使用大写 + 0.5px 字间距

---

## 3. 组件样式

### 按钮

所有按钮统一 pill 造型（`border-radius: 9999px`）。

| 类型 | 样式 |
|------|------|
| 主按钮 | 黑底白字 pill，`10px 20px` 内间距 |
| 次要按钮 | 透明底 pill，1px hairline 边框 |
| Ghost 按钮 | 透明底，8px 圆角 |
| 活跃/聚焦 | mint 绿边框或背景 |
| 按下 | `--color-accent-deep` |

### TabBar

- 纯白背景 + 顶部 1px hairline 边框
- 活跃状态：文字 `--color-primary`（黑色），无颜色高亮
- 非活跃：`--color-body`（灰色）
- 去掉背景色变化，极简风格

### ChatBubble

- 用户气泡：右对齐，`--color-surface`（#f7f7f7）背景，12px 圆角
- 教练气泡：左对齐，白底 + 1px hairline 边框，12px 圆角
- 头像改为 pill 形状小标签，micro-uppercase 风格
- 内间距统一 16px

### 卡片

适用于：material-card, drill-card, essay-card, tu-topic-card, question-card

- 白底 + 1px hairline 边框 + 12px 圆角
- 内间距 24px
- hover：边框变 `--color-primary`，加 `--shadow-sm`
- 去掉暖灰背景，全部纯白

### 输入框

- 白底 + 1px hairline 边框 + 8px 圆角
- 聚焦：2px mint 绿边框（`--color-accent`）
- 单行高度 40px

### 标签/徽章

- pill 圆角
- 非选中：白底 + 1px hairline 边框
- 选中：黑底白字
- 训练类型标签：蓝底半透明（tag 风格）

### 空状态/完成卡片

- 居中布局不变
- 完成卡片圆形图标改为 pill 形状
- 统计数字使用大号排版

---

## 4. 间距与形状

### 圆角

| 变量 | 当前 | 新值 |
|------|------|------|
| `--radius-sm` | 6px | 6px |
| `--radius-md` | 8px | 8px |
| `--radius-lg` | 12px | 12px |
| `--radius-pill` | 20px | **9999px** |

### 阴影

| 变量 | 当前 | 新值 |
|------|------|------|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.04)` | `rgba(0,0,0,0.04) 0 1px 2px` |
| `--shadow-md` | `0 2px 8px rgba(0,0,0,0.06)` | `rgba(0,0,0,0.08) 0 4px 12px` |
| `--shadow-accent` | 无 | `rgba(0,212,164,0.08) 0 8px 24px` |

### 间距

- 页面标题下方 24px
- 卡片间距 16px
- 卡片内间距 24px
- 区块间距 32px

### 过渡动画

保持 150ms ease。

---

## 5. 文件改动清单

| 文件 | 改动内容 |
|------|----------|
| `index.html` | 添加 Inter 字体引入 |
| `src/App.css` | 更新全部 CSS 变量 + body font-family |
| `src/components/TabBar.css` | 极简化，hairline 分隔线 |
| `src/components/ChatBubble.css` | 新气泡风格 |
| `src/components/TrainingUnit.css` | 卡片和按钮 pill 化 |
| `src/components/TrainingPage.css` | 卡片和按钮 pill 化 |
| `src/components/MaterialsPage.css` | 标签和卡片样式 |
| `src/components/MaterialDetail.css` | 卡片样式 |
| `src/components/Editor.css` | 输入框 mint 聚焦 |
| `src/components/MyPage.css` | 统计和卡片样式 |
| `src/components/TopicInput.css` | 问题卡片样式 |
| `src/components/DrillGuide.css` | 卡片和按钮样式 |
| `src/components/EmptyState.css` | 微调 |
| `src/components/LoadingDots.css` | 微调 |
| `src/components/PostWriteReview.css` | 微调 |
| `src/components/PreWriteChat.css` | 微调 |
| `src/components/EssayLibrary.css` | 卡片样式 |
| `src/components/DrillGuide.css` | 按钮 pill 化 |

---

## 6. 不改动的部分

- TSX 组件结构
- 页面布局（单栏 720px）
- 底部 TabBar 的 HTML 结构
- 数据模型和 AI 服务逻辑
- 状态管理和路由逻辑
