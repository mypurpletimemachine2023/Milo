import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export type SessionUsage = {
  key: string;
  updatedAt: number;
  model?: string;
  totalTokens?: number;
  usage?: any;
};

export async function listSessionsJson(activeMinutes?: number) {
  const args = ['sessions', '--json'];
  if (activeMinutes != null) args.push('--active', String(activeMinutes));
  const { stdout } = await execFileAsync('openclaw', args, { maxBuffer: 10 * 1024 * 1024 });
  return JSON.parse(stdout);
}

export function aggregateUsage(sessions: any) {
  const list = sessions?.sessions ?? [];
  const byModel: Record<string, { sessions: number; totalTokens: number; cost: number }> = {};

  for (const s of list) {
    const model = s.model ?? 'unknown';
    const totalTokens = s.totalTokens ?? 0;
    const cost = s.messages?.[0]?.usage?.cost?.total ?? 0; // best-effort (may be missing)

    if (!byModel[model]) byModel[model] = { sessions: 0, totalTokens: 0, cost: 0 };
    byModel[model].sessions += 1;
    byModel[model].totalTokens += totalTokens;
    byModel[model].cost += cost;
  }

  return { byModel, count: list.length };
}
