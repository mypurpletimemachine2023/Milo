import { useEffect, useMemo, useRef, useState } from 'react';
import './app.css';
import type { Store, AgentState, Task } from './types';
import { apiBase, assignTask, connectWS, createArtifact, createTask, fetchStore, fetchUsage, setAgentProgress } from './api';

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function AgentCard({ agent, task, onDropTaskId }: { agent: AgentState; task?: Task; onDropTaskId?: (taskId: string, agentId: string) => void }) {
  return (
    <div
      className={`agentCard ${agent.status}`}
      onDragOver={(e) => { if (onDropTaskId) e.preventDefault(); }}
      onDrop={(e) => {
        if (!onDropTaskId) return;
        const taskId = e.dataTransfer.getData('text/task-id');
        if (taskId) onDropTaskId(taskId, agent.id);
      }}
    >
      <div className="agentHeader">
        <div className="agentName">
          <span className="agentEmoji">{agent.emoji ?? '🐵'}</span>
          {agent.name}
        </div>
        <div className="agentMeta">{agent.room === 'office' ? 'In office' : 'In break room'} • {agent.status}</div>
      </div>
      <div className="agentTask">
        {task ? (
          <>
            <div className="label">Working on</div>
            <div className="value">{task.title}</div>
          </>
        ) : (
          <div className="value muted">No task assigned</div>
        )}
      </div>
      <div className="progressRow">
        <div className="bar"><div className="fill" style={{ width: `${agent.progress}%` }} /></div>
        <div className="pct">{agent.progress}%</div>
      </div>
    </div>
  );
}

function OfficeRoom({ title, agents, tasksById, onDropTaskId }: { title: string; agents: AgentState[]; tasksById: Map<string, Task>; onDropTaskId?: (taskId: string, agentId: string) => void }) {
  return (
    <div className="room">
      <div className="roomTitle">{title}</div>
      <div className="roomGrid">
        {agents.map(a => (
          <AgentCard key={a.id} agent={a} task={a.taskId ? tasksById.get(a.taskId) : undefined} onDropTaskId={onDropTaskId} />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [store, setStore] = useState<Store | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDetails, setNewDetails] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('planner');
  const [artifactTitle, setArtifactTitle] = useState('');
  const [artifactBody, setArtifactBody] = useState('');
  const [usage, setUsage] = useState<any>(null);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    fetchStore()
      .then(setStore)
      .catch((e) => setError(String(e?.message || e)));

    wsRef.current = connectWS(setStore);
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  const tasksById = useMemo(() => new Map((store?.tasks ?? []).map(t => [t.id, t] as const)), [store]);

  const officeAgents = (store?.agents ?? []).filter(a => a.room === 'office');
  const breakAgents = (store?.agents ?? []).filter(a => a.room === 'break');

  useEffect(() => {
    let alive = true;
    async function tick() {
      try {
        const u = await fetchUsage(24 * 60);
        if (alive) setUsage(u);
      } catch {
        // ignore (best-effort)
      }
    }
    tick();
    const id = setInterval(tick, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const queuedTasks = (store?.tasks ?? []).filter(t => t.status === 'queued');
  const activeTasks = (store?.tasks ?? []).filter(t => t.status === 'assigned');

  async function onCreateTask() {
    if (!newTitle.trim()) return;
    await createTask(newTitle.trim(), newDetails.trim() || undefined);
    setNewTitle('');
    setNewDetails('');
  }

  async function onAssign() {
    if (!selectedTaskId || !selectedAgentId) return;
    await assignTask(selectedTaskId, selectedAgentId);
    setSelectedTaskId('');
  }

  async function onDropAssign(taskId: string, agentId: string) {
    await assignTask(taskId, agentId);
  }

  async function onQuickProgress(agentId: string, progress: number) {
    await setAgentProgress(agentId, progress);
  }

  async function onCreateArtifact() {
    if (!artifactTitle.trim() || !artifactBody.trim()) return;
    await createArtifact(artifactTitle.trim(), artifactBody);
    setArtifactTitle('');
    setArtifactBody('');
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <div className="logo">MILO OFFICE</div>
          <div className="subtitle">Sims-style control room (MVP) • API: {apiBase()}</div>
        </div>
        <div className="status">
          {store ? (
            <>
              <span className="pill">Agents: {store.agents.length}</span>
              <span className="pill">Queued: {queuedTasks.length}</span>
              <span className="pill">Active: {activeTasks.length}</span>
              <span className="pill">Updated: {fmtTime(Math.max(...store.agents.map(a => a.updatedAt)))}</span>
            </>
          ) : (
            <span className="pill">Loading…</span>
          )}
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      <main className="main">
        <section className="map">
          <div className="mapTitle">Office Floor</div>
          <div className="mapGrid">
            <div className="mapCell office">
              <OfficeRoom title="Offices (working)" agents={officeAgents} tasksById={tasksById} onDropTaskId={onDropAssign} />
            </div>
            <div className="mapCell break">
              <OfficeRoom title="Break Room (idle/blocked)" agents={breakAgents} tasksById={tasksById} onDropTaskId={onDropAssign} />
            </div>
            <div className="mapCell bulletin">
              <div className="room">
                <div className="roomTitle">Bulletin Board</div>
                <div className="bulletinBody">
                  <div className="boardSection">
                    <div className="boardTitle">Queue</div>
                    <ul className="taskList">
                      {queuedTasks.map(t => (
                        <li
                          key={t.id}
                          className="taskItem"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/task-id', t.id);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          title="Drag onto an agent to assign"
                        >
                          <div className="taskTitle">{t.title}</div>
                          {t.details && <div className="taskDetails">{t.details}</div>}
                        </li>
                      ))}
                      {queuedTasks.length === 0 && <li className="taskItem muted">No queued tasks</li>}
                    </ul>
                  </div>
                  <div className="boardSection">
                    <div className="boardTitle">In Progress</div>
                    <ul className="taskList">
                      {activeTasks.map(t => (
                        <li key={t.id} className="taskItem">
                          <div className="taskTitle">{t.title}</div>
                          <div className="taskDetails">Assigned to: {t.assignedTo}</div>
                        </li>
                      ))}
                      {activeTasks.length === 0 && <li className="taskItem muted">Nothing in progress</li>}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="mapCell control">
              <div className="room">
                <div className="roomTitle">Control Room</div>

                <div className="panel">
                  <div className="panelTitle">Model Usage (Codex / Gemini)</div>
                  {!usage && <div className="hint">Fetching usage…</div>}
                  {usage && (
                    <div className="usageGrid">
                      {Object.entries(usage.byModel ?? {}).map(([model, v]: any) => (
                        <div key={model} className="usageRow">
                          <div className="usageModel">{model}</div>
                          <div className="usageNums">{v.totalTokens.toLocaleString()} tokens • ${Number(v.cost ?? 0).toFixed(2)}</div>
                        </div>
                      ))}
                      {Object.keys(usage.byModel ?? {}).length === 0 && <div className="hint">No recent sessions found.</div>}
                    </div>
                  )}
                </div>

                <div className="panel">
                  <div className="panelTitle">Create Task</div>
                  <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Task title" />
                  <textarea value={newDetails} onChange={(e) => setNewDetails(e.target.value)} placeholder="Details (optional)" rows={3} />
                  <button onClick={onCreateTask}>Add to Queue</button>
                </div>

                <div className="panel">
                  <div className="panelTitle">Assign Task</div>
                  <select value={selectedTaskId} onChange={(e) => setSelectedTaskId(e.target.value)}>
                    <option value="">Select queued task…</option>
                    {queuedTasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                  </select>
                  <select value={selectedAgentId} onChange={(e) => setSelectedAgentId(e.target.value)}>
                    {(store?.agents ?? []).map(a => <option key={a.id} value={a.id}>{a.name} ({a.status})</option>)}
                  </select>
                  <button onClick={onAssign} disabled={!selectedTaskId}>Assign</button>
                </div>

                <div className="panel">
                  <div className="panelTitle">Quick Sim Controls</div>
                  <div className="hint">MVP: manual progress buttons (later we’ll hook real agent outputs)</div>
                  <div className="quickGrid">
                    {(store?.agents ?? []).map(a => (
                      <div key={a.id} className="quickRow">
                        <div className="quickName">{a.name}</div>
                        <div className="quickBtns">
                          <button onClick={() => onQuickProgress(a.id, 25)}>25%</button>
                          <button onClick={() => onQuickProgress(a.id, 60)}>60%</button>
                          <button onClick={() => onQuickProgress(a.id, 100)}>Done</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel">
                  <div className="panelTitle">Post Artifact (agent output)</div>
                  <input value={artifactTitle} onChange={(e) => setArtifactTitle(e.target.value)} placeholder="Artifact title" />
                  <textarea value={artifactBody} onChange={(e) => setArtifactBody(e.target.value)} placeholder="Paste output…" rows={5} />
                  <button onClick={onCreateArtifact}>Publish Artifact</button>
                </div>
              </div>
            </div>

            <div className="mapCell artifacts">
              <div className="room">
                <div className="roomTitle">Artifacts</div>
                <div className="artifactsBody">
                  {(store?.artifacts ?? []).map(a => (
                    <details key={a.id} className="artifact">
                      <summary>
                        <span className="artifactTitle">{a.title}</span>
                        <span className="artifactMeta">{fmtTime(a.createdAt)}</span>
                      </summary>
                      <pre className="artifactBody">{a.body}</pre>
                    </details>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </section>
      </main>

      <footer className="footer">
        MVP notes: offices = working agents, break room = idle/blocked. Next: drag/drop, real agent hooks, avatars, and a nicer office layout.
      </footer>
    </div>
  );
}
