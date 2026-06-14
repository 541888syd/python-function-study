import { v4 as uuidv4 } from 'uuid';
import { readJson, writeJson } from './storageService.js';
import { getAllFunctions, updateFunction, type PythonFunction } from './functionService.js';

export type PracticeMode = 'name2usage' | 'usage2name' | 'code2name' | 'signature2name' | 'name2library';

interface PracticeRecord {
  id: string;
  date: string;
  functionId: string;
  mode: PracticeMode;
  userInput: string;
  result: 'correct' | 'wrong' | 'skip';
  timeSpent: number;
}

interface PracticeRecordsData {
  records: PracticeRecord[];
}

interface Settings {
  dailyGoal: number;
  newWordsPerDay: number;
  practiceMode: PracticeMode | 'mixed';
}

export interface PracticeFunction {
  id: string;
  name: string;
  library: string;
  description: string;
  signature?: string;
  codeExample?: string;
  parameters?: Array<{ name: string; type?: string; description?: string; defaultValue?: string }>;
  returnType?: string;
  mode: PracticeMode;
  prompt: string;
  mastery: number;
  status: string;
}

function getSettings(): Settings {
  const raw = readJson<any>('settings.json');
  return {
    dailyGoal: raw.dailyGoal ?? 20,
    newWordsPerDay: raw.newWordsPerDay ?? 5,
    practiceMode: raw.practiceMode ?? 'mixed',
  };
}

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function getTodayRecords(): PracticeRecord[] {
  const data = readJson<PracticeRecordsData>('practice_records.json');
  const today = getTodayStr();
  return data.records.filter(r => r.date === today);
}

/**
 * Smart function selection algorithm:
 * 1. Pick up to `newWordsPerDay` new functions
 * 2. Fill the rest with review functions prioritized by:
 *    - Lower mastery = higher priority
 *    - Longer since last review = higher priority
 *    - Not reviewed correctly today
 * 3. Shuffle the final list
 */
export function pickPracticeFunctions(): PracticeFunction[] {
  const settings = getSettings();
  const allFunctions = getAllFunctions();
  const todayRecords = getTodayRecords();
  const todayCorrectIds = new Set(todayRecords.filter(r => r.result === 'correct').map(r => r.functionId));
  const todayReviewedIds = new Set(todayRecords.map(r => r.functionId));

  const newFunctions = allFunctions.filter(f => f.status === 'new' && !todayReviewedIds.has(f.id));
  const learningFunctions = allFunctions.filter(f =>
    (f.status === 'learning' || f.status === 'mastered') && !todayCorrectIds.has(f.id)
  );

  // If no functions at all, return empty
  if (allFunctions.length === 0) return [];

  // If no new + learning functions to pick, fall back to all functions
  let pool = [...newFunctions, ...learningFunctions];
  if (pool.length === 0) {
    pool = allFunctions.filter(f => !todayCorrectIds.has(f.id));
    if (pool.length === 0) pool = allFunctions; // all correct today, recycle
  }

  // Shuffle new functions and pick up to newWordsPerDay
  const shuffledNew = shuffle(newFunctions).slice(0, settings.newWordsPerDay);

  // Calculate review priority score
  const scored = learningFunctions.map(f => {
    const daysSinceReview = f.lastReviewedAt
      ? Math.max(0, (Date.now() - new Date(f.lastReviewedAt).getTime()) / (1000 * 60 * 60 * 24))
      : 30;
    const priority = (1 - f.mastery) * 50 + daysSinceReview * 2;
    return { func: f, priority };
  });

  scored.sort((a, b) => b.priority - a.priority);

  const remaining = Math.max(0, settings.dailyGoal - shuffledNew.length);
  const reviewFunctions = scored.slice(0, remaining).map(s => s.func);

  // Combine and shuffle
  const combined = [...shuffledNew, ...reviewFunctions];
  const final = shuffle(combined);

  // Convert to PracticeFunction with random mode
  return final.map(f => ({
    id: f.id,
    name: f.name,
    library: f.library,
    description: f.description,
    signature: f.signature,
    codeExample: f.codeExamples?.[0]?.code,
    parameters: f.parameters,
    returnType: f.returnType,
    mode: getRandomPracticeMode(settings.practiceMode),
    prompt: '',
    mastery: f.mastery,
    status: f.status,
  })).map(pf => ({
    ...pf,
    prompt: generatePrompt(pf),
  }));
}

function generatePrompt(pf: PracticeFunction): string {
  switch (pf.mode) {
    case 'name2usage':
    case 'name2library':
      return pf.name;
    case 'usage2name':
      return pf.description;
    case 'code2name':
      return pf.codeExample || `# ${pf.name} 代码示例`;
    case 'signature2name':
      return pf.signature || `${pf.library}.${pf.name}(...)`;
  }
}

function getRandomPracticeMode(setting: string): PracticeMode {
  const allModes: PracticeMode[] = ['name2usage', 'usage2name', 'code2name', 'signature2name', 'name2library'];
  if (setting === 'mixed') {
    return allModes[Math.floor(Math.random() * allModes.length)];
  }
  return setting as PracticeMode;
}

/**
 * Jaccard similarity for Chinese keyword matching (name2usage mode)
 */
function jaccardSimilarity(a: string, b: string): number {
  const extractKeywords = (s: string) => {
    const matches = s.match(/[一-龥]{2,}/g) || [];
    return new Set(matches);
  };
  const setA = extractKeywords(a);
  const setB = extractKeywords(b);
  if (setA.size === 0 && setB.size === 0) return 1;
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  return intersection.size / Math.max(1, setA.size + setB.size - intersection.size);
}

/**
 * Simple Levenshtein distance for fuzzy name matching
 */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Check name match: user input matches function name (with optional library prefix)
 */
function matchFunctionName(userInput: string, funcName: string, library: string): boolean {
  const input = userInput.trim().toLowerCase();
  const name = funcName.toLowerCase();
  const fullName = `${library}.${name}`;

  // Exact match on name or library.name
  if (input === name || input === fullName) return true;

  // Fuzzy match with edit distance tolerance
  const maxDist = Math.max(1, Math.floor(name.length * 0.2));
  if (levenshtein(input, name) <= maxDist) return true;
  if (levenshtein(input, fullName) <= maxDist + 1) return true;

  // If input is just the function name part (without library prefix), accept that too
  // e.g. "join" for "os.path.join"
  const shortName = funcName.split('.').pop() || funcName;
  if (input === shortName.toLowerCase()) return true;
  if (levenshtein(input, shortName.toLowerCase()) <= 1) return true;

  return false;
}

const LIBRARY_ALIASES: Record<string, string[]> = {
  'os': ['os'],
  'os.path': ['os', 'os.path'],
  'sys': ['sys'],
  'itertools': ['itertools'],
  'functools': ['functools'],
  'collections': ['collections'],
  'datetime': ['datetime'],
  'json': ['json'],
  'pathlib': ['pathlib'],
  're': ['re'],
  'builtins': ['builtins', 'builtin', 'built-in'],
};

function getLibraryAliases(library: string): string[] {
  return LIBRARY_ALIASES[library] || [library];
}

export function submitAnswer(
  functionId: string,
  userInput: string,
  mode: PracticeMode,
  timeSpent: number,
  skip: boolean = false
): { correct: boolean; correctAnswer: string } {
  const func = getAllFunctions().find(f => f.id === functionId);
  if (!func) throw new Error('函数不存在');

  const trimmedInput = userInput.trim().toLowerCase();

  let result: 'correct' | 'wrong' | 'skip';

  if (skip) {
    result = 'skip';
  } else {
    switch (mode) {
      case 'name2library': {
        // Strict match on library name + aliases
        const aliases = getLibraryAliases(func.library);
        result = aliases.some(a => a.toLowerCase() === trimmedInput)
          ? 'correct' : 'wrong';
        break;
      }
      case 'name2usage': {
        // Chinese keyword Jaccard similarity >= 0.6
        const similarity = jaccardSimilarity(trimmedInput, func.description);
        result = similarity >= 0.6 ? 'correct' : 'wrong';
        break;
      }
      case 'usage2name':
      case 'code2name':
      case 'signature2name': {
        // Name matching with fuzzy tolerance
        result = matchFunctionName(trimmedInput, func.name, func.library)
          ? 'correct' : 'wrong';
        break;
      }
      default:
        result = 'wrong';
    }
  }

  // Determine correct answer string based on mode
  let correctAnswer: string;
  switch (mode) {
    case 'name2library':
      correctAnswer = func.library;
      break;
    case 'name2usage':
      correctAnswer = func.description;
      break;
    case 'usage2name':
    case 'code2name':
    case 'signature2name':
      correctAnswer = func.name;
      break;
    default:
      correctAnswer = func.name;
  }

  // Save practice record
  const recordsData = readJson<PracticeRecordsData>('practice_records.json');
  const record: PracticeRecord = {
    id: uuidv4(),
    date: getTodayStr(),
    functionId,
    mode,
    userInput: trimmedInput,
    result,
    timeSpent,
  };
  recordsData.records.push(record);
  writeJson('practice_records.json', recordsData);

  // Update function stats
  const newReviewCount = func.reviewCount + 1;
  const newCorrectCount = result === 'correct' ? func.correctCount + 1 : func.correctCount;
  const newMastery = newReviewCount > 0 ? newCorrectCount / newReviewCount : 0;
  const newStatus: PythonFunction['status'] =
    newMastery >= 0.8 ? 'mastered' :
    newReviewCount > 0 ? 'learning' : 'new';

  updateFunction(functionId, {
    reviewCount: newReviewCount,
    correctCount: newCorrectCount,
    lastReviewedAt: new Date().toISOString(),
    mastery: newMastery,
    status: newStatus,
  });

  return { correct: result === 'correct', correctAnswer };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getTodayProgress(): { completed: number; goal: number; newFunctionsLearned: number } {
  const settings = getSettings();
  const todayRecords = getTodayRecords();
  const uniqueFunctionIds = new Set(todayRecords.map(r => r.functionId));
  const todayCorrectIds = new Set(todayRecords.filter(r => r.result === 'correct').map(r => r.functionId));

  const allFunctions = getAllFunctions();
  const newFunctionsLearned = allFunctions.filter(f =>
    f.status !== 'new' && todayCorrectIds.has(f.id)
  ).length;

  return {
    completed: uniqueFunctionIds.size,
    goal: settings.dailyGoal,
    newFunctionsLearned,
  };
}

export function getDailyStats(days: number = 30): Array<{ date: string; count: number; correctRate: number }> {
  const data = readJson<PracticeRecordsData>('practice_records.json');
  const stats: Record<string, { total: number; correct: number }> = {};

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    stats[dateStr] = { total: 0, correct: 0 };
  }

  data.records.forEach(r => {
    if (stats[r.date]) {
      stats[r.date].total++;
      if (r.result === 'correct') stats[r.date].correct++;
    }
  });

  return Object.entries(stats).map(([date, s]) => ({
    date,
    count: s.total,
    correctRate: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
  }));
}

export function getOverviewStats() {
  const allFunctions = getAllFunctions();
  const data = readJson<PracticeRecordsData>('practice_records.json');
  const todayRecords = getTodayRecords();

  const streak = calculateStreak(data.records);

  const uniqueReviewIds = new Set(todayRecords.map(r => r.functionId));

  return {
    totalFunctions: allFunctions.length,
    newFunctions: allFunctions.filter(f => f.status === 'new').length,
    learningFunctions: allFunctions.filter(f => f.status === 'learning').length,
    masteredFunctions: allFunctions.filter(f => f.status === 'mastered').length,
    todayCompleted: uniqueReviewIds.size,
    todayCorrect: todayRecords.filter(r => r.result === 'correct').length,
    streak,
    totalPractices: data.records.length,
  };
}

function calculateStreak(records: PracticeRecord[]): number {
  if (records.length === 0) return 0;

  const dates = [...new Set(records.map(r => r.date))].sort().reverse();
  let streak = 0;

  for (let i = 0; i < 365; i++) {
    const expected = new Date();
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().split('T')[0];
    if (dates.includes(expectedStr)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
