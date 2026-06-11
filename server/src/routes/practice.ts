import { Router, Request, Response } from 'express';
import { pickPracticeWords, submitAnswer, getTodayProgress } from '../services/practiceService.js';

const router = Router();

// GET /api/practice/today
router.get('/today', (_req: Request, res: Response) => {
  const progress = getTodayProgress();
  res.json(progress);
});

// POST /api/practice/start
router.post('/start', (_req: Request, res: Response) => {
  const words = pickPracticeWords();
  res.json({ words });
});

// POST /api/practice/submit
router.post('/submit', (req: Request, res: Response) => {
  const { wordId, userInput, mode, timeSpent, skip } = req.body;
  if (!wordId || !mode) {
    res.status(400).json({ error: '参数不完整' });
    return;
  }
  try {
    const result = submitAnswer(wordId, userInput || '', mode, timeSpent || 0, skip || false);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
