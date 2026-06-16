import express from 'express';
import cors from 'cors';
import { resolve, dirname } from 'path';
import { existsSync } from 'fs';
import functionsRouter from './routes/functions.js';
import practiceRouter from './routes/practice.js';
import statsRouter from './routes/stats.js';
import { readJson, writeJson } from './services/storageService.js';

const app = express();
const PORT = process.env.PORT || 3001;

const isPackaged = typeof (process as any).pkg !== 'undefined';
const BASE_DIR = isPackaged ? dirname(process.execPath) : process.cwd();

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/functions', functionsRouter);
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
  const functions = readJson('functions.json');
  const records = readJson('practice_records.json');
  const settings = readJson('settings.json');
  res.json({
    exportedAt: new Date().toISOString(),
    functions,
    records,
    settings,
  });
});

// Data import
app.post('/api/data/import', (req, res) => {
  try {
    const { functions, records, settings } = req.body;
    if (functions) writeJson('functions.json', functions);
    if (records) writeJson('practice_records.json', records);
    if (settings) writeJson('settings.json', settings);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Seed data loader — on first run, load seed functions
app.post('/api/data/seed', (_req, res) => {
  try {
    const current = readJson<any>('functions.json');
    if (current.functions && current.functions.length > 0) {
      res.json({ seeded: false, message: '已有数据，跳过种子加载', count: current.functions.length });
      return;
    }
    const seed = readJson<any>('seed_functions.json');
    if (seed.functions && seed.functions.length > 0) {
      writeJson('functions.json', seed);
      res.json({ seeded: true, count: seed.functions.length });
    } else {
      res.json({ seeded: false, message: '种子数据为空' });
    }
  } catch (err: any) {
    res.json({ seeded: false, error: err.message });
  }
});

// Heartbeat: auto-shutdown when browser closes (packaged mode only)
let lastHeartbeat = Date.now();
app.get('/api/heartbeat', (_req, res) => {
  lastHeartbeat = Date.now();
  res.json({ ok: true });
});

if (isPackaged) {
  setInterval(() => {
    if (Date.now() - lastHeartbeat > 5000) {
      console.log('🛑 Browser closed, shutting down...');
      process.exit(0);
    }
  }, 2000);
}

// Serve static files — check multiple possible locations
const publicDir = resolve(BASE_DIR, 'public');
const devClientDist = resolve(process.cwd(), '../client/dist');
const builtinPublic = resolve(__dirname, 'public');
let staticDir: string | null = null;
for (const d of [publicDir, devClientDist, builtinPublic]) {
  if (existsSync(d)) { staticDir = d; break; }
}

if (isPackaged || process.env.NODE_ENV === 'production') {
  if (staticDir) {
    app.use(express.static(staticDir));
    app.get('*', (_req, res) => {
      res.sendFile(resolve(staticDir!, 'index.html'));
    });
  } else {
    console.warn('⚠ No static frontend found, serving API only');
  }
}

function startServer(port: number) {
  const server = app.listen(port, () => {
    console.log(`🐍 Python Function Study Server running at http://localhost:${port}`);

    // Auto-seed disabled — user manages their own functions
    // try { ... } catch (_) {}

    // Auto-open browser in production or packaged mode
    if (isPackaged || process.env.NODE_ENV === 'production') {
      const openUrl = `http://localhost:${port}`;
      console.log(`Opening ${openUrl} ...`);
      const platform = process.platform;
      try {
        if (platform === 'win32') {
          require('child_process').exec(`start "" "${openUrl}"`);
        } else if (platform === 'darwin') {
          require('child_process').exec(`open "${openUrl}"`);
        } else {
          require('child_process').exec(`xdg-open "${openUrl}"`);
        }
      } catch (_) {}
    }
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} in use, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      throw err;
    }
  });
}

startServer(Number(PORT));
