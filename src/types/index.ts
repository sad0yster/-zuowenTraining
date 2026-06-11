export type EssayGenre = 'argumentative' | 'narrative';
export type SpeculativeType = 'single' | 'binary' | 'ternary';

export type QuestionTheme =
  | '科技'
  | '人文'
  | '社会'
  | '成长'
  | '文化'
  | '价值'
  | '自我'
  | '时代';

export interface Question {
  id: string;
  text: string;
  source: string;
  genre: EssayGenre;
  speculativeType: SpeculativeType;
  difficulty: 1 | 2 | 3;
  tags: string[];
  theme: QuestionTheme;
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

export type DrillType = 'deep-analysis' | 'argument' | 'perspective';

export interface ThinkingDimension {
  id: string;
  name: string;
  description: string;
  referenceAnalysis: string;
  coachingHints: string[];
}

export interface DrillItemV2 {
  id: string;
  type: DrillType;
  topic: string;
  source: string;
  dimensions: ThinkingDimension[];
  synthesisPrompt?: string;
}

export interface DrillRecordV2 {
  id: string;
  type: DrillType;
  topic: string;
  coachingMessages: ChatMessage[];
  synthesisOutput: string;
  aiEvaluation: string;
  dimensionCoverage: Record<string, number>;
  createdAt: number;
}

export type TabId = 'materials' | 'training' | 'writing' | 'me';

export type MaterialCategory =
  | 'self-growth'
  | 'learning'
  | 'family'
  | 'social'
  | 'society'
  | 'tradition'
  | 'technology'
  | 'choice'
  | 'ethics'
  | 'existence'
  | 'deep-water';

export interface Material {
  id: string;
  category: MaterialCategory;
  title: string;
  situation: string;        // ≤300字生活化叙事
  coreTension: string;       // 一句话核心冲突
  guideQuestions: string[];  // AI 起始追问方向
  linkedDrills: DrillType[];
  tags: string[];
  essayAngle?: string;       // 立意切口：可直接写进作文的锐利结论
  thinkingReef?: string;     // 思辨暗礁：真正的悖论
  relatedMaterialIds?: string[]; // 关联的生活场景素材
}

export interface ConceptExample {
  type: 'daily' | 'essay';
  text: string;
}

export interface KnowledgeConcept {
  id: string;
  concept: string;
  hook: string;
  theme: string;
  applicableTo: string[];
  analysisTpl: string;
  examples: ConceptExample[];
  relatedMaterials: string[];
  relatedConcepts?: string[];
  depthLevel?: number;
  references?: string[];
}

export interface ConceptTheme {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export type EssayCategory =
  | 'speculative'   // 思辨方法
  | 'life'          // 人生哲理
  | 'society'       // 社会观察
  | 'tradition'     // 传统文化
  | 'youth'         // 青年成长
  | 'tech';         // 科技与时代

export interface ModelEssay {
  id: string;
  title: string;
  topic: string;
  genre: EssayGenre;
  category: EssayCategory;
  content: string;
  annotations: EssayAnnotation[];
  tags: string[];
  questionId?: string;
  techniques: string[];
}

export interface EssayAnnotation {
  startIndex: number;
  endIndex: number;
  label: string;
  comment: string;
}

export interface MaterialDiscussionRecord {
  materialId: string;
  messages: ChatMessage[];
  harvest: string | null;
  linkedConceptId: string | null;
  savedAt: number;
}

// Reading materials
export type ReadingMaterialType = 'philosophy' | 'case' | 'history' | 'data';

export interface ReadingMaterial {
  id: string;
  materialId: string;
  type: ReadingMaterialType;
  title: string;
  content: string;
  source?: string;
  usageHint: string;
  quotable: boolean;
  keyInsight: string;
  relatedRmIds?: string[];
}

// Debate
export type DebateStage = 'concept' | 'opposition' | 'synthesis' | 'application';
export type DebateSide = 'for' | 'against';

export interface DebateRound {
  round: number;
  side: DebateSide;
  content: string;
  isUser: boolean;
  timestamp: number;
  stage: DebateStage;
}

export interface DebateRecord {
  id: string;
  materialId: string;
  rounds: DebateRound[];
  currentStage: DebateStage;
  completedStages: DebateStage[];
  harvest?: string;
  createdAt: number;
}

// Learning paths
export type PathType = 'theme' | 'ability';

export interface LearningPath {
  id: string;
  type: PathType;
  name: string;
  description: string;
  materialIds: string[];
  order: number;
}
