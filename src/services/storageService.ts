import type { EssayRecord, DrillRecordV2, WritingStep, ChatMessage, MaterialDiscussionRecord, DebateRecord, ReadingMaterial } from '../types';

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
    localStorage.removeItem(DRAFT_KEY);
    return null;
  }
}

export function clearDraft(): void {
  localStorage.removeItem(DRAFT_KEY);
}

// Material discussion storage
const MATERIAL_DISCUSSION_KEY = 'zuowen_material_discussion';

export function saveMaterialDiscussion(record: MaterialDiscussionRecord): void {
  const all = loadAllMaterialDiscussions();
  all[record.materialId] = record;
  localStorage.setItem(MATERIAL_DISCUSSION_KEY, JSON.stringify(all));
}

export function loadMaterialDiscussion(materialId: string): MaterialDiscussionRecord | null {
  const all = loadAllMaterialDiscussions();
  return all[materialId] || null;
}

export function clearMaterialDiscussion(materialId: string): void {
  const all = loadAllMaterialDiscussions();
  delete all[materialId];
  localStorage.setItem(MATERIAL_DISCUSSION_KEY, JSON.stringify(all));
}

function loadAllMaterialDiscussions(): Record<string, MaterialDiscussionRecord> {
  try {
    const raw = localStorage.getItem(MATERIAL_DISCUSSION_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Debate record storage
const DEBATE_RECORDS_KEY = 'zuowen_debate_records';

export function saveDebateRecord(record: DebateRecord): void {
  const records = loadDebateRecords();
  const existingIndex = records.findIndex(r => r.id === record.id);
  if (existingIndex >= 0) {
    records[existingIndex] = record;
  } else {
    records.push(record);
  }
  localStorage.setItem(DEBATE_RECORDS_KEY, JSON.stringify(records));
}

export function loadDebateRecords(): DebateRecord[] {
  try {
    const data = localStorage.getItem(DEBATE_RECORDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function loadDebateRecordsByMaterial(materialId: string): DebateRecord[] {
  return loadDebateRecords().filter(r => r.materialId === materialId);
}

export function clearDebateRecord(id: string): void {
  const records = loadDebateRecords().filter(r => r.id !== id);
  localStorage.setItem(DEBATE_RECORDS_KEY, JSON.stringify(records));
}

// Reading materials cache
const READING_CACHE_KEY = 'zuowen_reading_cache';

export function cacheReadingMaterials(materialId: string, materials: ReadingMaterial[]): void {
  const cache = loadReadingCache();
  cache[materialId] = { materials, cachedAt: Date.now() };
  localStorage.setItem(READING_CACHE_KEY, JSON.stringify(cache));
}

export function loadCachedReadingMaterials(materialId: string): ReadingMaterial[] | null {
  const cache = loadReadingCache();
  const entry = cache[materialId];
  if (!entry) return null;
  // Cache valid for 7 days
  if (Date.now() - entry.cachedAt > 7 * 24 * 60 * 60 * 1000) return null;
  return entry.materials;
}

function loadReadingCache(): Record<string, { materials: ReadingMaterial[]; cachedAt: number }> {
  try {
    const data = localStorage.getItem(READING_CACHE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

// Storage capacity monitoring
export function getStorageUsage(): { used: number; total: number; percent: number } {
  let used = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('zuowen-')) {
      used += localStorage.getItem(key)?.length || 0;
    }
  }
  // localStorage limit is typically 5MB, measured in characters (2 bytes each in UTF-16)
  const total = 5 * 1024 * 1024; // 5MB in chars
  return { used, total, percent: Math.round((used / total) * 100) };
}

// Data export
export function exportAllData(): string {
  const data: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('zuowen-')) {
      try {
        data[key] = JSON.parse(localStorage.getItem(key) || 'null');
      } catch {
        data[key] = localStorage.getItem(key);
      }
    }
  }
  return JSON.stringify(data, null, 2);
}

// Data import
export function importAllData(jsonStr: string): { success: boolean; message: string } {
  try {
    const data = JSON.parse(jsonStr);
    if (typeof data !== 'object' || data === null) {
      return { success: false, message: '数据格式错误' };
    }
    let imported = 0;
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith('zuowen-')) {
        localStorage.setItem(key, JSON.stringify(value));
        imported++;
      }
    }
    return { success: true, message: `成功导入 ${imported} 项数据` };
  } catch {
    return { success: false, message: 'JSON 解析失败，请检查文件格式' };
  }
}
