import express from 'express';
import cors from 'cors';
import { resolve } from 'path';
import wordsRouter from './routes/words.js';
import practiceRouter from './routes/practice.js';
import statsRouter from './routes/stats.js';
import { readJson, writeJson } from './services/storageService.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/words', wordsRouter);
app.use('/api/practice', practiceRouter);
app.use('/api/stats', statsRouter);

// Settings routes
app.get('/api/settings', (_req, res) => {
  const settings = readJson('settings.json');
  res.json(settings);
});

app.put('/api/settings', (req, res) => {
  const current = readJson('settings.json');
  const merged = { ...current, ...req.body };
  writeJson('settings.json', merged);
  res.json(merged);
});

// Data export
app.post('/api/data/export', (_req, res) => {
  const words = readJson('words.json');
  const records = readJson('practice_records.json');
  const settings = readJson('settings.json');
  res.json({
    exportedAt: new Date().toISOString(),
    words,
    records,
    settings,
  });
});

// Data import
app.post('/api/data/import', (req, res) => {
  try {
    const { words, records, settings } = req.body;
    if (words) writeJson('words.json', words);
    if (records) writeJson('practice_records.json', records);
    if (settings) writeJson('settings.json', settings);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = resolve(process.cwd(), '../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(resolve(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`📚 English Study Server running at http://localhost:${PORT}`);
});
