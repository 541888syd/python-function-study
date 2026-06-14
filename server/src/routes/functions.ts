import { Router, Request, Response } from 'express';
import {
  getAllFunctions,
  addFunction,
  updateFunction,
  deleteFunction,
  batchAddFunctions,
  getAllLibraries,
  getAllCategoryTags,
  getLibraryDistribution,
} from '../services/functionService.js';

const router = Router();

// GET /api/functions
router.get('/', (req: Request, res: Response) => {
  const { search, library, status, categoryTag, difficulty } = req.query;
  const functions = getAllFunctions(
    search as string | undefined,
    library as string | undefined,
    status as string | undefined,
    categoryTag as string | undefined,
    difficulty as string | undefined
  );
  res.json({ functions });
});

// GET /api/functions/libraries
router.get('/libraries', (_req: Request, res: Response) => {
  const libraries = getAllLibraries();
  res.json({ libraries });
});

// GET /api/functions/categories
router.get('/categories', (_req: Request, res: Response) => {
  const categoryTags = getAllCategoryTags();
  res.json({ categoryTags });
});

// GET /api/functions/distribution
router.get('/distribution', (_req: Request, res: Response) => {
  const distribution = getLibraryDistribution();
  res.json({ distribution });
});

// GET /api/functions/:id
router.get('/:id', (req: Request, res: Response) => {
  const { getFunctionById } = require('../services/functionService.js');
  const func = getFunctionById(req.params.id);
  if (!func) {
    res.status(404).json({ error: '函数不存在' });
    return;
  }
  res.json(func);
});

// POST /api/functions
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, library, description, signature, parameters, returnType,
            codeExamples, etymology, relatedFunctions, categoryTags,
            difficulty, source, notes } = req.body;
    if (!name || !library || !description) {
      res.status(400).json({ error: '函数名、所属库和描述不能为空' });
      return;
    }
    const newFunc = addFunction({
      name, library, description, signature, parameters, returnType,
      codeExamples, etymology, relatedFunctions, categoryTags,
      difficulty, source, notes,
    });
    res.status(201).json(newFunc);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/functions/batch
router.post('/batch', (req: Request, res: Response) => {
  const { inputs } = req.body;
  if (!Array.isArray(inputs) || inputs.length === 0) {
    res.status(400).json({ error: 'inputs 必须是非空数组' });
    return;
  }
  const result = batchAddFunctions(inputs);
  res.status(201).json(result);
});

// PUT /api/functions/:id
router.put('/:id', (req: Request, res: Response) => {
  const updated = updateFunction(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: '函数不存在' });
    return;
  }
  res.json(updated);
});

// DELETE /api/functions/:id
router.delete('/:id', (req: Request, res: Response) => {
  const success = deleteFunction(req.params.id);
  if (!success) {
    res.status(404).json({ error: '函数不存在' });
    return;
  }
  res.json({ success: true });
});

export default router;
