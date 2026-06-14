// --- Python Function ---
export interface FunctionParameter {
  name: string;
  type?: string;
  description?: string;
  defaultValue?: string;
}

export interface CodeExample {
  code: string;
  description?: string;
  output?: string;
}

export type PracticeMode = 'name2usage' | 'usage2name' | 'code2name' | 'signature2name' | 'name2library';

export interface PythonFunction {
  id: string;
  name: string;
  library: string;
  description: string;
  signature?: string;
  parameters?: FunctionParameter[];
  returnType?: string;
  codeExamples: CodeExample[];
  etymology?: string;
  relatedFunctions?: string[];
  categoryTags?: string[];
  difficulty?: 'basic' | 'intermediate' | 'advanced';
  source?: string;
  notes?: string;
  createdAt: string;
  reviewCount: number;
  correctCount: number;
  lastReviewedAt: string | null;
  mastery: number;
  status: 'new' | 'learning' | 'mastered';
}

// --- Practice ---
export interface PracticeRecord {
  id: string;
  date: string;
  functionId: string;
  mode: PracticeMode;
  userInput: string;
  result: 'correct' | 'wrong' | 'skip';
  timeSpent: number;
}

export interface PracticeFunction {
  id: string;
  name: string;
  library: string;
  description: string;
  signature?: string;
  codeExample?: string;
  parameters?: FunctionParameter[];
  returnType?: string;
  mode: PracticeMode;
  prompt: string;
  mastery: number;
  status: string;
}

// --- Settings ---
export interface Settings {
  dailyGoal: number;
  newWordsPerDay: number;
  practiceMode: PracticeMode | 'mixed';
}

// --- Stats ---
export interface OverviewStats {
  totalFunctions: number;
  newFunctions: number;
  learningFunctions: number;
  masteredFunctions: number;
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
  newFunctionsLearned: number;
}

export interface LibraryDistItem {
  library: string;
  count: number;
}
