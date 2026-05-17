export type EssayGenre = 'argumentative' | 'narrative';
export type SpeculativeType = 'single' | 'binary' | 'ternary';

export interface Question {
  id: string;
  text: string;
  source: string;
  genre: EssayGenre;
  speculativeType: SpeculativeType;
  difficulty: 1 | 2 | 3;
  tags: string[];
}

export type MessageRole = 'user' | 'coach';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

export type WritingStep =
  | 'topic-input'
  | 'pre-write'
  | 'writing'
  | 'post-write'
  | 'completed';

export interface CompletionSummary {
  wordCount: number;
  preWriteRounds: number;
  postWriteRounds: number;
  coachTakeaway: string;
}

export interface ThinkingSnapshot {
  originality: number;
  reasoning: number;
  perspective: number;
  structure: number;
  language: number;
}

export interface EssayRecord {
  id: string;
  questionId: string | null;
  topic: string;
  content: string;
  preWriteMessages: ChatMessage[];
  postWriteMessages: ChatMessage[];
  snapshot: ThinkingSnapshot;
  createdAt: number;
}

export type DrillType =
  | 'examining'
  | 'thesis'
  | 'titling'
  | 'reasoning'
  | 'perspective';

export interface DrillRecord {
  id: string;
  type: DrillType;
  questionId: string | null;
  questionText: string;
  studentInput: string;
  aiFeedback: string;
  createdAt: number;
}

export type TabId = 'materials' | 'training' | 'writing' | 'me';

export type MaterialCategory =
  | 'self-and-others'
  | 'self-and-world'
  | 'self-and-era'
  | 'self-and-tradition'
  | 'self-and-self';

export interface Material {
  id: string;
  category: MaterialCategory;
  title: string;
  situation: string;        // ≤300字生活化叙事
  coreTension: string;       // 一句话核心冲突
  guideQuestions: string[];  // AI 起始追问方向
  linkedDrills: DrillType[]; // 可关联的训练单元
  tags: string[];
}

export interface ModelEssay {
  id: string;
  title: string;
  topic: string;
  genre: EssayGenre;
  score: number;
  content: string;
  annotations: EssayAnnotation[];
  tags: string[];
}

export interface EssayAnnotation {
  startIndex: number;
  endIndex: number;
  label: string;  // 得分点标签：审题/结构/论证/语言/立意
  comment: string;
}
