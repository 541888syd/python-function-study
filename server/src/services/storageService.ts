import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const DATA_DIR = resolve(process.cwd(), 'data');

function getFilePath(filename: string): string {
  return resolve(DATA_DIR, filename);
}

function ensureDataDir(): void {
  const fs = require('fs');
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readJson<T>(filename: string): T {
  ensureDataDir();
  const filePath = getFilePath(filename);
  if (!existsSync(filePath)) {
    const initialData = filename.includes('words') ? { words: [] } :
                         filename.includes('record') ? { records: [] } :
                         { dailyGoal: 20, newWordsPerDay: 5, practiceMode: 'mixed' };
    writeFileSync(filePath, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData as T;
  }
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

export function writeJson<T>(filename: string, data: T): void {
  ensureDataDir();
  const filePath = getFilePath(filename);
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}
