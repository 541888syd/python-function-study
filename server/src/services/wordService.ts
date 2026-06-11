import { readJson, writeJson } from './storageService.js';
import { v4 as uuidv4 } from 'uuid';

export interface Word {
  id: string;
  word: string;
  meaning: string;
  phonetic?: string;
  tags: string[];
  source?: string;
  createdAt: string;
  reviewCount: number;
  correctCount: number;
  lastReviewedAt: string | null;
  mastery: number;
  status: 'new' | 'learning' | 'mastered';
}

interface WordsData {
  words: Word[];
}

export function getAllWords(search?: string, tag?: string, status?: string): Word[] {
  const data = readJson<WordsData>('words.json');
  let words = data.words;

  if (search) {
    const s = search.toLowerCase();
    words = words.filter(w =>
      w.word.toLowerCase().includes(s) ||
      w.meaning.toLowerCase().includes(s)
    );
  }
  if (tag) {
    words = words.filter(w => w.tags.includes(tag));
  }
  if (status) {
    words = words.filter(w => w.status === status);
  }

  return words.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getWordById(id: string): Word | undefined {
  const data = readJson<WordsData>('words.json');
  return data.words.find(w => w.id === id);
}

export function addWord(input: {
  word: string;
  meaning: string;
  phonetic?: string;
  tags?: string[];
  source?: string;
}): Word {
  const data = readJson<WordsData>('words.json');

  // Check duplicate
  const existing = data.words.find(w => w.word.toLowerCase() === input.word.toLowerCase());
  if (existing) {
    throw new Error(`单词 "${input.word}" 已存在`);
  }

  const newWord: Word = {
    id: uuidv4(),
    word: input.word.trim(),
    meaning: input.meaning.trim(),
    phonetic: input.phonetic?.trim(),
    tags: input.tags || [],
    source: input.source?.trim(),
    createdAt: new Date().toISOString(),
    reviewCount: 0,
    correctCount: 0,
    lastReviewedAt: null,
    mastery: 0,
    status: 'new',
  };

  data.words.push(newWord);
  writeJson('words.json', data);
  return newWord;
}

export function batchAddWords(inputs: Array<{ word: string; meaning: string; tags?: string[] }>): { added: Word[]; skipped: string[] } {
  const data = readJson<WordsData>('words.json');
  const added: Word[] = [];
  const skipped: string[] = [];

  for (const input of inputs) {
    const existing = data.words.find(w => w.word.toLowerCase() === input.word.toLowerCase());
    if (existing) {
      skipped.push(input.word);
      continue;
    }
    const newWord: Word = {
      id: uuidv4(),
      word: input.word.trim(),
      meaning: input.meaning.trim(),
      tags: input.tags || [],
      createdAt: new Date().toISOString(),
      reviewCount: 0,
      correctCount: 0,
      lastReviewedAt: null,
      mastery: 0,
      status: 'new',
    };
    data.words.push(newWord);
    added.push(newWord);
  }

  writeJson('words.json', data);
  return { added, skipped };
}

export function updateWord(id: string, updates: Partial<Omit<Word, 'id' | 'createdAt'>>): Word | null {
  const data = readJson<WordsData>('words.json');
  const index = data.words.findIndex(w => w.id === id);
  if (index === -1) return null;

  data.words[index] = { ...data.words[index], ...updates, id: data.words[index].id, createdAt: data.words[index].createdAt };
  writeJson('words.json', data);
  return data.words[index];
}

export function deleteWord(id: string): boolean {
  const data = readJson<WordsData>('words.json');
  const index = data.words.findIndex(w => w.id === id);
  if (index === -1) return false;

  data.words.splice(index, 1);
  writeJson('words.json', data);
  return true;
}

export function getAllTags(): string[] {
  const data = readJson<WordsData>('words.json');
  const tagSet = new Set<string>();
  data.words.forEach(w => w.tags.forEach(t => tagSet.add(t)));
  return Array.from(tagSet).sort();
}
