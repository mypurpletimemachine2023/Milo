import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { listSessionsJson, aggregateUsage } from './openclaw.js';

type AgentState = {
  id: string;
  name: string;
  room: 'office' | 'break';
  status: 'idle' | 'working' | 'blocked';
  taskId?: string;
  progress: number; // 0-100
  updatedAt: number;
};

type Task = {
  id: string;
  title: string;
  details?: string;
  status: 'queued' | 'assigned' | 'done' | 'canceled';
  assignedTo?: string; // agentId
  createdAt: number;
  updatedAt: number;
};

type Artifact = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
};

type Store = {
  agents: AgentState[];
  tasks: Task[];
  artifacts: Artifact[];
};

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function now() {
  return Date.now();
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function defaultStore(): Store {
  const t = now();
  return {
    agents: [
      { id: 'planner', name: 'Planner', emoji: '🧠', room: 'break', status: 'idle', progress: 0, updatedAt: t },
      { id: 'builder', name: 'Builder', emoji: '🛠️', room: 'break', status: 'idle', progress: 0, updatedAt: t },
      { id: 'seo', name: 'SEO', emoji: '🔎', room: 'break', status: 'idle', progress: 0, updatedAt: t },
      { id: 'copy', name: 'Copywriter', emoji: '✍️', room: 'break', status: 'idle', progress: 0, updatedAt: t },
      { id: 'ops', name: 'Ops', emoji: '📦', room: 'break', status: 'idle', progress: 0, updatedAt: t },
    ],
    tasks: [
      {
        id: uid('task'),
        title: 'Example: Write homepage hero copy',
        details: 'Keep it call/text first. Use (407) 860-9524.',
        status: 'queued',
        createdAt: t,
        updatedAt: t,
      },
    ],
    artifacts: [
      {
        id: uid('artifact'),
        title: 'Welcome artifact',
        body: 'This is where agent outputs land. Click an artifact to view it.',
        createdAt: t,
      },
    ],
  };
}

function loadStore(): Store {
  ensureDataDir();
  if (!fs.existsSync(STORE_PATH)) {
    const s = defaultStore();
    fs.writeFileSync(STORE_PATH, JSON.stringify(s, null, 2));
    return s;
  }
  return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8')) as Store;
}

function saveStore(store: Store) {
  ensureDataDir();
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

let store = loadStore();

function broadcast(wss: WebSocketServer, event: any) {
  const msg = JSON.stringify(event);
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(msg);
  }
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/store', (_req, res) => {
  res.json(store);
});

// OpenClaw usage snapshots (best-effort)
app.get('/api/openclaw/sessions', async (req, res) => {
  try {
    const active = req.query.active ? Number(req.query.active) : undefined;
    const data = await listSessionsJson(active);
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.get('/api/openclaw/usage', async (req, res) => {
  try {
    const active = req.query.active ? Number(req.query.active) : 24 * 60;
    const data = await listSessionsJson(active);
    res.json(aggregateUsage(data));
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.post('/api/tasks', (req, res) => {
  const { title, details } = req.body ?? {};
  if (!title || typeof title !== 'string') return res.status(400).json({ error: 'title required' });
  const t = now();
  const task: Task = {
    id: uid('task'),
    title,
    details: typeof details === 'string' ? details : undefined,
    status: 'queued',
    createdAt: t,
    updatedAt: t,
  };
  store.tasks.unshift(task);
  saveStore(store);
  res.json(task);
});

app.post('/api/tasks/:taskId/assign', (req, res) => {
  const { taskId } = req.params;
  const { agentId } = req.body ?? {};
  const task = store.tasks.find(t => t.id === taskId);
  const agent = store.agents.find(a => a.id === agentId);
  if (!task) return res.status(404).json({ error: 'task not found' });
  if (!agent) return res.status(404).json({ error: 'agent not found' });
  if (task.status === 'done' || task.status === 'canceled') return res.status(400).json({ error: 'task closed' });

  // unassign from previous agent if needed
  if (task.assignedTo) {
    const prev = store.agents.find(a => a.id === task.assignedTo);
    if (prev && prev.taskId === task.id) {
      prev.taskId = undefined;
      prev.status = 'idle';
      prev.room = 'break';
      prev.progress = 0;
      prev.updatedAt = now();
    }
  }

  task.status = 'assigned';
  task.assignedTo = agent.id;
  task.updatedAt = now();

  agent.taskId = task.id;
  agent.status = 'working';
  agent.room = 'office';
  agent.progress = 5;
  agent.updatedAt = now();

  saveStore(store);
  res.json({ ok: true });
});

app.post('/api/agents/:agentId/progress', (req, res) => {
  const { agentId } = req.params;
  const { progress, status } = req.body ?? {};
  const agent = store.agents.find(a => a.id === agentId);
  if (!agent) return res.status(404).json({ error: 'agent not found' });
  if (typeof progress === 'number') agent.progress = Math.max(0, Math.min(100, Math.round(progress)));
  if (status && ['idle', 'working', 'blocked'].includes(status)) agent.status = status;
  agent.room = agent.status === 'working' ? 'office' : 'break';
  agent.updatedAt = now();

  // auto-complete task at 100
  if (agent.progress >= 100 && agent.taskId) {
    const task = store.tasks.find(t => t.id === agent.taskId);
    if (task) {
      task.status = 'done';
      task.updatedAt = now();
    }
    agent.taskId = undefined;
    agent.status = 'idle';
    agent.room = 'break';
    agent.progress = 0;
    agent.updatedAt = now();
  }

  saveStore(store);
  res.json({ ok: true });
});

app.post('/api/artifacts', (req, res) => {
  const { title, body } = req.body ?? {};
  if (!title || typeof title !== 'string') return res.status(400).json({ error: 'title required' });
  if (!body || typeof body !== 'string') return res.status(400).json({ error: 'body required' });
  const artifact: Artifact = { id: uid('artifact'), title, body, createdAt: now() };
  store.artifacts.unshift(artifact);
  saveStore(store);
  res.json(artifact);
});

// hard reset (MVP convenience)
app.post('/api/reset', (_req, res) => {
  store = defaultStore();
  saveStore(store);
  res.json({ ok: true });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'store', payload: store }));
});

// naive file poll to broadcast changes (MVP)
let lastHash = '';
setInterval(() => {
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    const hash = `${raw.length}:${raw.slice(0, 64)}:${raw.slice(-64)}`;
    if (hash !== lastHash) {
      lastHash = hash;
      store = JSON.parse(raw) as Store;
      broadcast(wss, { type: 'store', payload: store });
    }
  } catch {
    // ignore
  }
}, 800);

const PORT = Number(process.env.PORT ?? 8787);
server.listen(PORT, () => {
  console.log(`Milo Office server listening on http://localhost:${PORT}`);
});
