import type { EssayRecord, DrillRecord } from '../types';

const ESSAY_KEY = 'zuowen-training-essays';
const DRILL_KEY = 'zuowen-training-drills';

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
export function saveDrillRecord(record: DrillRecord): void {
  const existing = loadDrillRecords();
  existing.push(record);
  localStorage.setItem(DRILL_KEY, JSON.stringify(existing));
}

export function loadDrillRecords(): DrillRecord[] {
  try {
    const raw = localStorage.getItem(DRILL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
