import type { EssayRecord, DrillRecordV2, WritingStep, ChatMessage } from '../types';

const ESSAY_KEY = 'zuowen-training-essays';
const DRILL_KEY = 'zuowen-training-drills';
const DRAFT_KEY = 'zuowen-training-draft';

// Essay storage
export function saveEssay(essay: EssayRecord): void {
  const existing = loadEssays();
  existing.push(essay);
  localStorage.setItem(ESSAY_KEY, JSON.stringify(existing));
}

export function loadEssays(): EssayRecord[] {
  try {
    const raw = localStorage.getItem(ESSAY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function loadEssay(id: string): EssayRecord | undefined {
  return loadEssays().find((e) => e.id === id);
}

export function deleteEssay(id: string): void {
  const filtered = loadEssays().filter((e) => e.id !== id);
  localStorage.setItem(ESSAY_KEY, JSON.stringify(filtered));
}

// Drill storage
export function saveDrillRecord(record: DrillRecordV2): void {
  const existing = loadDrillRecords();
  existing.push(record);
  localStorage.setItem(DRILL_KEY, JSON.stringify(existing));
}

export function loadDrillRecords(): DrillRecordV2[] {
  try {
    const raw = localStorage.getItem(DRILL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Filter out old-format records that don't have the new fields
    return parsed.filter((r: Record<string, unknown>) => 'coachingMessages' in r);
  } catch {
    return [];
  }
}

// Draft storage
export interface WritingDraft {
  step: WritingStep;
  topic: string;
  questionId: string | null;
  preWriteMessages: ChatMessage[];
  content: string;
  postWriteMessages: ChatMessage[];
  preWriteSummary: string;
  savedAt: number;
}

export function saveDraft(draft: WritingDraft): void {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function loadDraft(): WritingDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WritingDraft;
    // Don't restore completed sessions
    if (parsed.step === 'completed') {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  localStorage.removeItem(DRAFT_KEY);
}
