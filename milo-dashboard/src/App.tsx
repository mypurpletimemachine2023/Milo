import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { LOCKSMITH_COLUMNS, LOCKSMITH_SWIMLANES } from "./types";

type Job = {
  id: string;
  createdAt: string;
  updatedAt: string;
  jobType: "commercial" | "residential" | "automotive" | "safe";
  source: "organic" | "contract";
  status:
    | "intake"
    | "quoted"
    | "scheduled"
    | "in_progress"
    | "waiting_on_parts_or_approval"
    | "completed"
    | "invoiced"
    | "paid"
    | "follow_up_review_request"
    | "archived";
  siteName: string | null;
  notes: string | null;
  contractAccount?: { accountName: "OCU" | "BASS" | "EVO" | "Academy" } | null;
};

const STATUS_TO_COLUMN: Record<Job["status"], (typeof LOCKSMITH_COLUMNS)[number]> = {
  intake: "Intake",
  quoted: "Quoted",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  waiting_on_parts_or_approval: "Waiting on Parts/Approval",
  completed: "Completed",
  invoiced: "Invoiced",
  paid: "Paid",
  follow_up_review_request: "Follow-up/Review Request",
  archived: "Archived",
};

const COLUMN_TO_STATUS: Record<(typeof LOCKSMITH_COLUMNS)[number], Job["status"]> = {
  Intake: "intake",
  Quoted: "quoted",
  Scheduled: "scheduled",
  "In Progress": "in_progress",
  "Waiting on Parts/Approval": "waiting_on_parts_or_approval",
  Completed: "completed",
  Invoiced: "invoiced",
  Paid: "paid",
  "Follow-up/Review Request": "follow_up_review_request",
  Archived: "archived",
};

function laneFor(job: Job): (typeof LOCKSMITH_SWIMLANES)[number] {
  if (job.source === "contract" && job.contractAccount?.accountName) {
    return `Contract Work: ${job.contractAccount.accountName}` as any;
  }
  // v0 heuristic: map by jobType
  if (job.jobType === "commercial") return "Commercial";
  if (job.jobType === "safe") return "Safe";
  if (job.jobType === "residential") return "Residential";
  return "Automotive";
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`http://127.0.0.1:8787${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

function Chip({ children }: { children: string }) {
  return (
    <span
      style={{
        fontSize: 12,
        padding: "2px 8px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
        opacity: 0.9,
      }}
    >
      {children}
    </span>
  );
}

function Card({ job }: { job: Job }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 12,
        padding: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <strong style={{ fontSize: 14 }}>{job.siteName ?? "(untitled)"}</strong>
        <span style={{ fontSize: 12, opacity: 0.7 }}>{job.jobType}</span>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
        <Chip>{job.source}</Chip>
        {job.contractAccount?.accountName ? (
          <Chip>{job.contractAccount.accountName}</Chip>
        ) : null}
      </div>
      {job.notes ? (
        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8, whiteSpace: "pre-wrap" }}>
          {job.notes}
        </div>
      ) : null}
    </div>
  );
}

function Column(props: {
  title: (typeof LOCKSMITH_COLUMNS)[number];
  jobs: Job[];
  onDropToColumn: (jobId: string, column: (typeof LOCKSMITH_COLUMNS)[number]) => void;
}) {
  return (
    <div
      style={{
        minWidth: 260,
        width: 260,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 14,
        padding: 10,
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const jobId = e.dataTransfer.getData("text/jobId");
        if (jobId) props.onDropToColumn(jobId, props.title);
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <strong>{props.title}</strong>
        <span style={{ opacity: 0.7 }}>{props.jobs.length}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {props.jobs.map((job) => (
          <div
            key={job.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/jobId", job.id);
              e.dataTransfer.effectAllowed = "move";
            }}
          >
            <Card job={job} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await api<{ jobs: Job[] }>("/api/jobs");
      setJobs(data.jobs);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const byLaneAndColumn = useMemo(() => {
    const out: Record<string, Record<string, Job[]>> = {};
    for (const lane of LOCKSMITH_SWIMLANES) {
      out[lane] = {};
      for (const col of LOCKSMITH_COLUMNS) out[lane][col] = [];
    }
    for (const job of jobs) {
      const lane = laneFor(job);
      const col = STATUS_TO_COLUMN[job.status];
      if (!out[lane]) continue;
      out[lane][col].push(job);
    }
    return out;
  }, [jobs]);

  async function move(jobId: string, toColumn: (typeof LOCKSMITH_COLUMNS)[number]) {
    const status = COLUMN_TO_STATUS[toColumn];
    // optimistic update
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status } : j)));
    try {
      await api(`/api/jobs/${jobId}`, { method: "PATCH", body: JSON.stringify({ status }) });
    } catch (e) {
      // rollback by refresh
      await refresh();
    }
  }

  async function quickAdd(kind: "contract" | "organic") {
    const title = prompt("Job title/site (short):") ?? "";
    if (!title.trim()) return;

    const jobType = (prompt("jobType? commercial | residential | automotive | safe", "commercial") ?? "commercial") as any;
    const contractAccountName =
      kind === "contract"
        ? ((prompt("Contract account? OCU | BASS | EVO | Academy", "OCU") ?? "OCU") as any)
        : undefined;

    await api("/api/jobs", {
      method: "POST",
      body: JSON.stringify({
        title,
        jobType,
        source: kind,
        contractAccountName,
      }),
    });
    await refresh();
  }

  return (
    <div style={{ padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0 }}>MILO Unified Dashboard</h1>
          <div style={{ fontSize: 13, opacity: 0.75 }}>Locksmith Ops (v1: working kanban + local API)</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => quickAdd("organic")}>+ Organic job</button>
          <button onClick={() => quickAdd("contract")}>+ Contract job</button>
          <button onClick={refresh}>Refresh</button>
        </div>
      </div>

      {loading ? <p>Loading…</p> : null}
      {error ? <p style={{ color: "salmon" }}>API error: {error}</p> : null}

      <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 18 }}>
        {LOCKSMITH_SWIMLANES.map((lane) => (
          <div key={lane}>
            <h2 style={{ margin: "10px 0" }}>{lane}</h2>
            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
              {LOCKSMITH_COLUMNS.map((col) => (
                <Column
                  key={col}
                  title={col}
                  jobs={byLaneAndColumn[lane][col]}
                  onDropToColumn={move}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
