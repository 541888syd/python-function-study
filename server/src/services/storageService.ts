import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';

// In packaged exe, use exe directory; in dev, use cwd
const BASE_DIR = (typeof (process as any).pkg !== 'undefined')
  ? dirname(process.execPath)
  : process.cwd();
const DATA_DIR = resolve(BASE_DIR, 'data');

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
    const initialData = filename.includes('function') ? { functions: [] } :
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
