import { v4 as uuidv4 } from 'uuid';
import { readJson, writeJson } from './storageService.js';
import { getAllWords, updateWord, type Word } from './wordService.js';

interface PracticeRecord {
  id: string;
  date: string;
  wordId: string;
  mode: 'cn2en' | 'en2cn';
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
  practiceMode: 'cn2en' | 'en2cn' | 'mixed';
}

interface PracticeWord {
  id: string;
  word: string;
  meaning: string;
  phonetic?: string;
  mode: 'cn2en' | 'en2cn';
  prompt: string;
  mastery: number;
  status: string;
}

function getSettings(): Settings {
  return readJson<Settings>('settings.json');
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
 * Smart word selection algorithm:
 * 1. Pick up to `newWordsPerDay` new words
 * 2. Fill the rest with review words prioritized by:
 *    - Lower mastery = higher priority
 *    - Longer since last review = higher priority
 *    - Not reviewed correctly today
 * 3. Shuffle the final list
 */
export function pickPracticeWords(): PracticeWord[] {
  const settings = getSettings();
  const allWords = getAllWords();
  const todayRecords = getTodayRecords();
  const todayCorrectIds = new Set(todayRecords.filter(r => r.result === 'correct').map(r => r.wordId));
  const todayReviewedIds = new Set(todayRecords.map(r => r.wordId));

  const newWords = allWords.filter(w => w.status === 'new' && !todayReviewedIds.has(w.id));
  const learningWords = allWords.filter(w =>
    (w.status === 'learning' || w.status === 'mastered') && !todayCorrectIds.has(w.id)
  );

  // Shuffle new words and pick up to newWordsPerDay
  const shuffledNew = shuffle(newWords).slice(0, settings.newWordsPerDay);

  // Calculate review priority score for learning words
  const scored = learningWords.map(w => {
    const daysSinceReview = w.lastReviewedAt
      ? Math.max(0, (Date.now() - new Date(w.lastReviewedAt).getTime()) / (1000 * 60 * 60 * 24))
      : 30; // Never reviewed = treat as 30 days ago
    // Priority = (1 - mastery) * 50 + days_since_review * 2
    const priority = (1 - w.mastery) * 50 + daysSinceReview * 2;
    return { word: w, priority };
  });

  scored.sort((a, b) => b.priority - a.priority);

  const remaining = settings.dailyGoal - shuffledNew.length;
  const reviewWords = scored.slice(0, Math.max(0, remaining)).map(s => s.word);

  // Combine and shuffle
  const combined = [...shuffledNew, ...reviewWords];
  const final = shuffle(combined);

  // Convert to PracticeWord with random mode
  return final.map(w => ({
    id: w.id,
    word: w.word,
    meaning: w.meaning,
    phonetic: w.phonetic,
    mode: getPracticeMode(settings.practiceMode),
    prompt: '', // Will be filled based on mode
    mastery: w.mastery,
    status: w.status,
  })).map(pw => ({
    ...pw,
    prompt: pw.mode === 'cn2en' ? pw.meaning : pw.word,
  }));
}

function getPracticeMode(setting: string): 'cn2en' | 'en2cn' {
  if (setting === 'mixed') {
    return Math.random() < 0.5 ? 'cn2en' : 'en2cn';
  }
  return setting as 'cn2en' | 'en2cn';
}

export function submitAnswer(
  wordId: string,
  userInput: string,
  mode: 'cn2en' | 'en2cn',
  timeSpent: number,
  skip: boolean = false
): { correct: boolean; correctAnswer: string } {
  const word = getAllWords().find(w => w.id === wordId);
  if (!word) throw new Error('单词不存在');

  const correctAnswer = mode === 'cn2en' ? word.word : word.meaning;
  const trimmedInput = userInput.trim().toLowerCase();

  let result: 'correct' | 'wrong' | 'skip';
  if (skip) {
    result = 'skip';
  } else {
    // For cn2en, strict match; for en2cn, fuzzy match
    if (mode === 'cn2en') {
      result = trimmedInput === correctAnswer.toLowerCase() ? 'correct' : 'wrong';
    } else {
      // Fuzzy match for Chinese meaning - check if input contains key parts
      result = trimmedInput === correctAnswer.toLowerCase() ||
               correctAnswer.toLowerCase().includes(trimmedInput) ||
               trimmedInput.includes(correctAnswer.toLowerCase())
        ? 'correct' : 'wrong';
    }
  }

  // Save practice record
  const recordsData = readJson<PracticeRecordsData>('practice_records.json');
  const record: PracticeRecord = {
    id: uuidv4(),
    date: getTodayStr(),
    wordId,
    mode,
    userInput: trimmedInput,
    result,
    timeSpent,
  };
  recordsData.records.push(record);
  writeJson('practice_records.json', recordsData);

  // Update word stats
  const newReviewCount = word.reviewCount + 1;
  const newCorrectCount = result === 'correct' ? word.correctCount + 1 : word.correctCount;
  const newMastery = newReviewCount > 0 ? newCorrectCount / newReviewCount : 0;
  const newStatus: Word['status'] =
    newMastery >= 0.8 ? 'mastered' :
    newReviewCount > 0 ? 'learning' : 'new';

  updateWord(wordId, {
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

export function getTodayProgress(): { completed: number; goal: number; newWordsLearned: number } {
  const settings = getSettings();
  const todayRecords = getTodayRecords();
  const uniqueWordIds = new Set(todayRecords.map(r => r.wordId));
  const todayCorrectIds = new Set(todayRecords.filter(r => r.result === 'correct').map(r => r.wordId));

  // Count new words learned today (words that were "new" status before today)
  const allWords = getAllWords();
  const newWordsLearned = allWords.filter(w =>
    w.status !== 'new' && todayCorrectIds.has(w.id)
  ).length;

  return {
    completed: uniqueWordIds.size,
    goal: settings.dailyGoal,
    newWordsLearned,
  };
}

export function getDailyStats(days: number = 30): Array<{ date: string; count: number; correctRate: number }> {
  const data = readJson<PracticeRecordsData>('practice_records.json');
  const stats: Record<string, { total: number; correct: number }> = {};

  // Initialize last N days
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    stats[dateStr] = { total: 0, correct: 0 };
  }

  // Fill with actual data
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
  const allWords = getAllWords();
  const data = readJson<PracticeRecordsData>('practice_records.json');
  const todayRecords = getTodayRecords();
  const today = getTodayStr();

  // Streak calculation
  const streak = calculateStreak(data.records);

  const uniqueReviewIds = new Set(todayRecords.map(r => r.wordId));

  return {
    totalWords: allWords.length,
    newWords: allWords.filter(w => w.status === 'new').length,
    learningWords: allWords.filter(w => w.status === 'learning').length,
    masteredWords: allWords.filter(w => w.status === 'mastered').length,
    todayCompleted: uniqueReviewIds.size,
    todayCorrect: todayRecords.filter(r => r.result === 'correct').length,
    streak,
    totalPractices: data.records.length,
  };
}

function calculateStreak(records: PracticeRecord[]): number {
  if (records.length === 0) return 0;

  const dates = [...new Set(records.map(r => r.date))].sort().reverse();
  const today = getTodayStr();
  let streak = 0;

  // Check if practiced today or yesterday
  const checkDate = new Date();
  // Start from today
  for (let i = 0; i < dates.length; i++) {
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
