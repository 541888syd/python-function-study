import { readJson, writeJson } from './storageService.js';
import { v4 as uuidv4 } from 'uuid';

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

interface FunctionsData {
  functions: PythonFunction[];
}

export function getAllFunctions(
  search?: string,
  library?: string,
  status?: string,
  categoryTag?: string,
  difficulty?: string
): PythonFunction[] {
  const data = readJson<FunctionsData>('functions.json');
  let functions = data.functions;

  if (search) {
    const s = search.toLowerCase();
    functions = functions.filter(f =>
      f.name.toLowerCase().includes(s) ||
      f.description.toLowerCase().includes(s) ||
      f.library.toLowerCase().includes(s)
    );
  }
  if (library) {
    functions = functions.filter(f => f.library === library);
  }
  if (status) {
    functions = functions.filter(f => f.status === status);
  }
  if (categoryTag) {
    functions = functions.filter(f => f.categoryTags?.includes(categoryTag));
  }
  if (difficulty) {
    functions = functions.filter(f => f.difficulty === difficulty);
  }

  return functions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getFunctionById(id: string): PythonFunction | undefined {
  const data = readJson<FunctionsData>('functions.json');
  return data.functions.find(f => f.id === id);
}

export function addFunction(input: {
  name: string;
  library: string;
  description: string;
  signature?: string;
  parameters?: FunctionParameter[];
  returnType?: string;
  codeExamples?: CodeExample[];
  etymology?: string;
  relatedFunctions?: string[];
  categoryTags?: string[];
  difficulty?: 'basic' | 'intermediate' | 'advanced';
  source?: string;
  notes?: string;
}): PythonFunction {
  const data = readJson<FunctionsData>('functions.json');

  // Check duplicate: same name + same library
  const existing = data.functions.find(
    f => f.name.toLowerCase() === input.name.toLowerCase() &&
         f.library.toLowerCase() === input.library.toLowerCase()
  );
  if (existing) {
    throw new Error(`函数 "${input.name}" 在库 "${input.library}" 中已存在`);
  }

  const newFunc: PythonFunction = {
    id: uuidv4(),
    name: input.name.trim(),
    library: input.library.trim(),
    description: input.description.trim(),
    signature: input.signature?.trim() || `${input.library}.${input.name}(...)`,
    parameters: input.parameters || [],
    returnType: input.returnType?.trim(),
    codeExamples: input.codeExamples || [],
    etymology: input.etymology?.trim(),
    relatedFunctions: input.relatedFunctions || [],
    categoryTags: input.categoryTags || [],
    difficulty: input.difficulty || 'basic',
    source: input.source?.trim(),
    notes: input.notes?.trim(),
    createdAt: new Date().toISOString(),
    reviewCount: 0,
    correctCount: 0,
    lastReviewedAt: null,
    mastery: 0,
    status: 'new',
  };

  data.functions.push(newFunc);
  writeJson('functions.json', data);
  return newFunc;
}

export function batchAddFunctions(
  inputs: Array<{
    name: string;
    library: string;
    description: string;
    categoryTags?: string[];
    difficulty?: 'basic' | 'intermediate' | 'advanced';
  }>
): { added: PythonFunction[]; skipped: string[] } {
  const data = readJson<FunctionsData>('functions.json');
  const added: PythonFunction[] = [];
  const skipped: string[] = [];

  for (const input of inputs) {
    const existing = data.functions.find(
      f => f.name.toLowerCase() === input.name.toLowerCase() &&
           f.library.toLowerCase() === input.library.toLowerCase()
    );
    if (existing) {
      skipped.push(`${input.library}.${input.name}`);
      continue;
    }
    const newFunc: PythonFunction = {
      id: uuidv4(),
      name: input.name.trim(),
      library: input.library.trim(),
      description: input.description.trim(),
      signature: `${input.library}.${input.name}(...)`,
      parameters: [],
      codeExamples: [],
      categoryTags: input.categoryTags || [],
      difficulty: input.difficulty || 'basic',
      createdAt: new Date().toISOString(),
      reviewCount: 0,
      correctCount: 0,
      lastReviewedAt: null,
      mastery: 0,
      status: 'new',
    };
    data.functions.push(newFunc);
    added.push(newFunc);
  }

  writeJson('functions.json', data);
  return { added, skipped };
}

export function updateFunction(
  id: string,
  updates: Partial<Omit<PythonFunction, 'id' | 'createdAt'>>
): PythonFunction | null {
  const data = readJson<FunctionsData>('functions.json');
  const index = data.functions.findIndex(f => f.id === id);
  if (index === -1) return null;

  data.functions[index] = {
    ...data.functions[index],
    ...updates,
    id: data.functions[index].id,
    createdAt: data.functions[index].createdAt,
  };
  writeJson('functions.json', data);
  return data.functions[index];
}

export function deleteFunction(id: string): boolean {
  const data = readJson<FunctionsData>('functions.json');
  const index = data.functions.findIndex(f => f.id === id);
  if (index === -1) return false;

  data.functions.splice(index, 1);
  writeJson('functions.json', data);
  return true;
}

export function getAllLibraries(): string[] {
  const data = readJson<FunctionsData>('functions.json');
  const libSet = new Set<string>();
  data.functions.forEach(f => libSet.add(f.library));
  return Array.from(libSet).sort();
}

export function getAllCategoryTags(): string[] {
  const data = readJson<FunctionsData>('functions.json');
  const tagSet = new Set<string>();
  data.functions.forEach(f => f.categoryTags?.forEach(t => tagSet.add(t)));
  return Array.from(tagSet).sort();
}

export function getLibraryDistribution(): Array<{ library: string; count: number }> {
  const data = readJson<FunctionsData>('functions.json');
  const dist: Record<string, number> = {};
  data.functions.forEach(f => {
    dist[f.library] = (dist[f.library] || 0) + 1;
  });
  return Object.entries(dist)
    .map(([library, count]) => ({ library, count }))
    .sort((a, b) => b.count - a.count);
}
