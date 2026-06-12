# Changelog

记录每次功能更新和重要改动。

---

## 2026-05-30

### feat: 素材模块重构 — 分层浏览 + 辩论模式 + 阅读材料
- 新增素材首页（今日精选、最近学习、四宫格入口）、全部素材浏览页（分类+搜索）、学习路径、概念地图
- 新增辩论模式（AI当对手 / 用户当裁判），集成到素材详情页
- 新增阅读材料组件，素材详情页支持自由讨论/辩论模式切换
- Mintlify 设计风格更新（accent 色、tag 色、圆角等）
- 新增文件：`MaterialsHome`、`MaterialsBrowse`、`DebateMode`、`ReadingMaterials`、`LearningPaths`、`ConceptMap` 等 13 个文件

---

## 2026-05-29

### feat: 素材库关键词搜索
- 素材库新增搜索框，支持按标题、核心张力、标签、情境描述进行关键词检索
- 搜索与分类筛选可组合使用
- 无匹配结果时显示提示文字
- 改动文件：`MaterialsPage.tsx`、`MaterialsPage.css`

---

## 2026-05-19

### feat: 写作台草稿自动保存
- WritingDesk 状态（步骤、题目、内容、对话记录等）自动持久化到 localStorage
- 1 秒防抖保存，切换 Tab 或关闭浏览器不会丢失进度
- 完成作文或开启新会话时清除草稿
- 改动文件：`WritingDesk.tsx`、`storageService.ts`

### feat: AI 评语提取五维评分
- AI 在写后评价时输出 `[SCORES:originality=X,...]` 格式的评分标记
- 前端解析并限制在 1-5 分范围内，标记本身不在 UI 中显示
- AI 未输出评分时回退到默认 3 分
- 改动文件：`PostWriteReview.tsx`、`aiService.ts`、`prompts/index.ts`

## 2026-05-17

### feat: 高分作文训练平台初始化
- 四大模块：思辨素材、思辨练习场、自由写作台、我的成长
- AI 教练采用苏格拉底式引导，不直接给分、不代写
- 5 种训练类型 × 每类 20 道题，共 100 道练习
- 18 篇思辨素材、8 篇范文库
- DeepSeek API 集成，无 key 时自动降级为 mock 模式
- Vite + React 18 + TypeScript，localStorage 本地存储
