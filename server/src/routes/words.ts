import { Router, Request, Response } from 'express';
import { getAllWords, addWord, updateWord, deleteWord, batchAddWords, getAllTags, type Word } from '../services/wordService.js';

const router = Router();

// GET /api/words
router.get('/', (req: Request, res: Response) => {
  const { search, tag, status } = req.query;
  const words = getAllWords(
    search as string | undefined,
    tag as string | undefined,
    status as string | undefined
  );
  res.json({ words });
});

// GET /api/words/tags
router.get('/tags', (_req: Request, res: Response) => {
  const tags = getAllTags();
  res.json({ tags });
});

// POST /api/words
router.post('/', (req: Request, res: Response) => {
  try {
    const { word, meaning, phonetic, tags, source } = req.body;
    if (!word || !meaning) {
      res.status(400).json({ error: '单词和释义不能为空' });
      return;
    }
    const newWord = addWord({ word, meaning, phonetic, tags, source });
    res.status(201).json(newWord);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/words/batch
router.post('/batch', (req: Request, res: Response) => {
  const { inputs } = req.body;
  if (!Array.isArray(inputs) || inputs.length === 0) {
    res.status(400).json({ error: 'inputs 必须是非空数组' });
    return;
  }
  const result = batchAddWords(inputs);
  res.status(201).json(result);
});

// PUT /api/words/:id
router.put('/:id', (req: Request, res: Response) => {
  const updated = updateWord(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: '单词不存在' });
    return;
  }
  res.json(updated);
});

// DELETE /api/words/:id
router.delete('/:id', (req: Request, res: Response) => {
  const success = deleteWord(req.params.id);
  if (!success) {
    res.status(404).json({ error: '单词不存在' });
    return;
  }
  res.json({ success: true });
});

export default router;
