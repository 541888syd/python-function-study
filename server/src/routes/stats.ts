import { Router, Request, Response } from 'express';
import { getOverviewStats, getDailyStats } from '../services/practiceService.js';
import { getLibraryDistribution } from '../services/functionService.js';

const router = Router();

// GET /api/stats/overview
router.get('/overview', (_req: Request, res: Response) => {
  const stats = getOverviewStats();
  res.json(stats);
});

// GET /api/stats/trend?days=30
router.get('/trend', (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 30;
  const trend = getDailyStats(days);
  res.json({ trend });
});

// GET /api/stats/distribution
router.get('/distribution', (_req: Request, res: Response) => {
  const distribution = getLibraryDistribution();
  res.json({ distribution });
});

export default router;
