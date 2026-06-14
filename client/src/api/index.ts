import type { PythonFunction, PracticeFunction, Settings, OverviewStats, DailyStat, TodayProgress, LibraryDistItem } from '../types';

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

// Functions API
export const functionsApi = {
  list: (params?: { search?: string; library?: string; status?: string; categoryTag?: string; difficulty?: string }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.library) qs.set('library', params.library);
    if (params?.status) qs.set('status', params.status);
    if (params?.categoryTag) qs.set('categoryTag', params.categoryTag);
    if (params?.difficulty) qs.set('difficulty', params.difficulty);
    const q = qs.toString();
    return request<{ functions: PythonFunction[] }>(`/functions${q ? '?' + q : ''}`);
  },

  getById: (id: string) =>
    request<PythonFunction>(`/functions/${id}`),

  add: (data: {
    name: string; library: string; description: string;
    signature?: string; parameters?: PythonFunction['parameters'];
    returnType?: string; codeExamples?: PythonFunction['codeExamples'];
    etymology?: string; relatedFunctions?: string[];
    categoryTags?: string[]; difficulty?: string;
    source?: string; notes?: string;
  }) =>
    request<PythonFunction>('/functions', { method: 'POST', body: JSON.stringify(data) }),

  batchAdd: (inputs: Array<{ name: string; library: string; description: string; categoryTags?: string[] }>) =>
    request<{ added: PythonFunction[]; skipped: string[] }>('/functions/batch', { method: 'POST', body: JSON.stringify({ inputs }) }),

  update: (id: string, data: Partial<PythonFunction>) =>
    request<PythonFunction>(`/functions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    request<{ success: boolean }>(`/functions/${id}`, { method: 'DELETE' }),

  libraries: () =>
    request<{ libraries: string[] }>('/functions/libraries'),

  categories: () =>
    request<{ categoryTags: string[] }>('/functions/categories'),

  distribution: () =>
    request<{ distribution: LibraryDistItem[] }>('/functions/distribution'),
};

// Practice API
export const practiceApi = {
  getToday: () =>
    request<TodayProgress>('/practice/today'),

  start: () =>
    request<{ functions: PracticeFunction[] }>('/practice/start', { method: 'POST' }),

  submit: (data: { functionId: string; userInput: string; mode: string; timeSpent: number; skip?: boolean }) =>
    request<{ correct: boolean; correctAnswer: string }>('/practice/submit', { method: 'POST', body: JSON.stringify(data) }),
};

// Stats API
export const statsApi = {
  overview: () =>
    request<OverviewStats>('/stats/overview'),

  trend: (days: number = 30) =>
    request<{ trend: DailyStat[] }>(`/stats/trend?days=${days}`),

  distribution: () =>
    request<{ distribution: LibraryDistItem[] }>('/stats/distribution'),
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

  seed: () =>
    request<{ seeded: boolean; count?: number; message?: string }>('/data/seed', { method: 'POST' }),
};
