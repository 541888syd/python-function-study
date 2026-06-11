import type { Word, PracticeWord, Settings, OverviewStats, DailyStat, TodayProgress } from '../types';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// Words API
export const wordsApi = {
  list: (params?: { search?: string; tag?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.tag) qs.set('tag', params.tag);
    if (params?.status) qs.set('status', params.status);
    const q = qs.toString();
    return request<{ words: Word[] }>(`/words${q ? '?' + q : ''}`);
  },

  add: (data: { word: string; meaning: string; phonetic?: string; tags?: string[]; source?: string }) =>
    request<Word>('/words', { method: 'POST', body: JSON.stringify(data) }),

  batchAdd: (inputs: Array<{ word: string; meaning: string; tags?: string[] }>) =>
    request<{ added: Word[]; skipped: string[] }>('/words/batch', { method: 'POST', body: JSON.stringify({ inputs }) }),

  update: (id: string, data: Partial<Word>) =>
    request<Word>(`/words/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    request<{ success: boolean }>(`/words/${id}`, { method: 'DELETE' }),

  tags: () =>
    request<{ tags: string[] }>('/words/tags'),
};

// Practice API
export const practiceApi = {
  getToday: () =>
    request<TodayProgress>('/practice/today'),

  start: () =>
    request<{ words: PracticeWord[] }>('/practice/start', { method: 'POST' }),

  submit: (data: { wordId: string; userInput: string; mode: string; timeSpent: number; skip?: boolean }) =>
    request<{ correct: boolean; correctAnswer: string }>('/practice/submit', { method: 'POST', body: JSON.stringify(data) }),
};

// Stats API
export const statsApi = {
  overview: () =>
    request<OverviewStats>('/stats/overview'),

  trend: (days: number = 30) =>
    request<{ trend: DailyStat[] }>(`/stats/trend?days=${days}`),
};

// Settings API
export const settingsApi = {
  get: () =>
    request<Settings>('/settings'),

  update: (data: Partial<Settings>) =>
    request<Settings>('/settings', { method: 'PUT', body: JSON.stringify(data) }),
};

// Data export/import
export const dataApi = {
  export: () =>
    request<any>('/data/export', { method: 'POST' }),

  import: (data: any) =>
    request<{ success: boolean }>('/data/import', { method: 'POST', body: JSON.stringify(data) }),
};
