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

export interface PracticeRecord {
  id: string;
  date: string;
  wordId: string;
  mode: 'cn2en' | 'en2cn';
  userInput: string;
  result: 'correct' | 'wrong' | 'skip';
  timeSpent: number;
}

export interface PracticeWord {
  id: string;
  word: string;
  meaning: string;
  phonetic?: string;
  mode: 'cn2en' | 'en2cn';
  prompt: string;
  mastery: number;
  status: string;
}

export interface Settings {
  dailyGoal: number;
  newWordsPerDay: number;
  practiceMode: 'cn2en' | 'en2cn' | 'mixed';
}

export interface OverviewStats {
  totalWords: number;
  newWords: number;
  learningWords: number;
  masteredWords: number;
  todayCompleted: number;
  todayCorrect: number;
  streak: number;
  totalPractices: number;
}

export interface DailyStat {
  date: string;
  count: number;
  correctRate: number;
}

export interface TodayProgress {
  completed: number;
  goal: number;
  newWordsLearned: number;
}
