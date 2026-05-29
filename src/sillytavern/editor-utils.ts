/**
 * Pure utilities for the lorebook/preset editor UIs.
 * No React, no IndexedDB — only data transformations.
 */

import type { Lorebook, LorebookEntry } from './types';

const ENTRY_DEFAULTS: Omit<LorebookEntry, 'id'> = {
  keys: [],
  secondaryKeys: [],
  content: '',
  order: 100,
  position: 'after_char',
  selective: false,
  selectiveLogic: 'and_any',
  constant: false,
  probability: 100,
  useProbability: false,
  addMemo: false,
};

export function createDefaultEntry(): LorebookEntry {
  return {
    id: crypto.randomUUID(),
    ...ENTRY_DEFAULTS,
  };
}

export function applyEntryDefaults(partial: Partial<LorebookEntry>): LorebookEntry {
  return {
    id: partial.id ?? crypto.randomUUID(),
    ...ENTRY_DEFAULTS,
    ...partial,
  };
}

export function createDefaultLorebook(name: string): Lorebook {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name,
    entries: [],
    recursiveScanning: false,
    caseSensitive: false,
    matchWholeWords: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateEntry(
  book: Lorebook,
  entryId: string,
  patch: Partial<LorebookEntry>,
): Lorebook {
  const idx = book.entries.findIndex((e) => e.id === entryId);
  if (idx < 0) return book;
  const nextEntries = book.entries.slice();
  nextEntries[idx] = { ...nextEntries[idx], ...patch };
  return { ...book, entries: nextEntries, updatedAt: Date.now() };
}

export function removeEntry(book: Lorebook, entryId: string): Lorebook {
  const idx = book.entries.findIndex((e) => e.id === entryId);
  if (idx < 0) return book;
  const nextEntries = book.entries.slice();
  nextEntries.splice(idx, 1);
  return { ...book, entries: nextEntries, updatedAt: Date.now() };
}

export function movePromptItem<T>(arr: T[], from: number, to: number): T[] {
  if (from === to) return arr;
  if (from < 0 || from >= arr.length) return arr;
  if (to < 0 || to >= arr.length) return arr;
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

import type { ChatEntry } from './types';

/** Convert ChatEntry to XML string for storage in lorebook */
export function chatEntryToXml(entry: ChatEntry): string {
  const attrs: string[] = [`type="${entry.type}"`];
  if (entry.time) attrs.push(`time="${entry.time}"`);
  if (entry.duration !== undefined) attrs.push(`duration="${entry.duration}"`);
  if (entry.amount !== undefined) attrs.push(`amount="${entry.amount}"`);
  if (entry.transferNote) attrs.push(`note="${entry.transferNote}"`);
  if (entry.fileName) attrs.push(`filename="${entry.fileName}"`);
  if (entry.fileSize) attrs.push(`filesize="${entry.fileSize}"`);
  if (entry.address) attrs.push(`address="${entry.address}"`);
  if (entry.lat !== undefined) attrs.push(`lat="${entry.lat}"`);
  if (entry.lng !== undefined) attrs.push(`lng="${entry.lng}"`);
  return `<chat ${attrs.join(' ')}>${entry.content}</chat>`;
}

/** Convert array of ChatEntry to XML for lorebook storage */
export function chatEntriesToXml(entries: ChatEntry[], separator = '\n'): string {
  return entries.map(chatEntryToXml).join(separator);
}

/** Parse XML chat entries from a lorebook entry's content back to ChatEntry array */
export function parseChatEntriesFromXml(xml: string): ChatEntry[] {
  const entries: ChatEntry[] = [];
  const regex = /<chat\s+([^>]*)>([\s\S]*?)<\/chat>/gi;
  let m;
  while ((m = regex.exec(xml)) !== null) {
    const attrsStr = m[1] || '';
    const content = (m[2] || '').trim();
    const attrs = parseAttrsString(attrsStr);
    entries.push({
      type: (attrs.type as ChatEntry['type']) || 'text',
      content,
      time: attrs.time || undefined,
      duration: attrs.duration ? Number(attrs.duration) : undefined,
      amount: attrs.amount ? Number(attrs.amount) : undefined,
      transferNote: attrs.note || undefined,
      fileName: attrs.filename || undefined,
      fileSize: attrs.filesize || undefined,
      address: attrs.address || undefined,
      lat: attrs.lat ? Number(attrs.lat) : undefined,
      lng: attrs.lng ? Number(attrs.lng) : undefined,
    });
  }
  return entries;
}

function parseAttrsString(str: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const regex = /(\w+)=["']([^"']*)["']/g;
  let m;
  while ((m = regex.exec(str)) !== null) {
    attrs[m[1]] = m[2];
  }
  return attrs;
}

export function clampNumber(
  value: unknown,
  min: number,
  max: number,
  fallback?: number,
): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback ?? min;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}
