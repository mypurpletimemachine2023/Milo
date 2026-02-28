import type { Store, Task, Artifact } from './types';

export type UsageAgg = { byModel: Record<string, { sessions: number; totalTokens: number; cost: number }>; count: number };

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8787';

export function apiBase() {
  return API_BASE;
}

export async function fetchStore(): Promise<Store> {
  const r = await fetch(`${API_BASE}/api/store`);
  if (!r.ok) throw new Error('Failed to fetch store');
  return r.json();
}

export async function createTask(title: string, details?: string): Promise<Task> {
  const r = await fetch(`${API_BASE}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, details }),
  });
  if (!r.ok) throw new Error('Failed to create task');
  return r.json();
}

export async function assignTask(taskId: string, agentId: string): Promise<void> {
  const r = await fetch(`${API_BASE}/api/tasks/${taskId}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId }),
  });
  if (!r.ok) throw new Error('Failed to assign task');
}

export async function setAgentProgress(agentId: string, progress: number, status?: string): Promise<void> {
  const r = await fetch(`${API_BASE}/api/agents/${agentId}/progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ progress, status }),
  });
  if (!r.ok) throw new Error('Failed to update progress');
}

export async function createArtifact(title: string, body: string): Promise<Artifact> {
  const r = await fetch(`${API_BASE}/api/artifacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body }),
  });
  if (!r.ok) throw new Error('Failed to create artifact');
  return r.json();
}

export async function fetchUsage(activeMinutes = 24 * 60): Promise<UsageAgg> {
  const r = await fetch(`${API_BASE}/api/openclaw/usage?active=${activeMinutes}`);
  if (!r.ok) throw new Error('Failed to fetch usage');
  return r.json();
}

export function connectWS(onStore: (s: Store) => void) {
  const url = API_BASE.replace('http', 'ws');
  const ws = new WebSocket(url);
  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      if (msg?.type === 'store') onStore(msg.payload);
    } catch {
      // ignore
    }
  };
  return ws;
}
