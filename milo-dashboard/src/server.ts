import express from "express";
import cors from "cors";
import { db } from "./db";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", async (_req, res) => {
  // small DB check
  const count = await db.job.count();
  res.json({ ok: true, jobs: count });
});

app.get("/api/jobs", async (_req, res) => {
  const jobs = await db.job.findMany({
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: { contractAccount: true, customer: true, invoice: true },
  });
  res.json({ jobs });
});

app.post("/api/jobs", async (req, res) => {
  const {
    title,
    jobType,
    source,
    contractAccountName,
    notes,
  }: {
    title?: string;
    jobType: "commercial" | "residential" | "automotive" | "safe";
    source: "organic" | "contract";
    contractAccountName?: "OCU" | "BASS" | "EVO" | "Academy";
    notes?: string;
  } = req.body;

  const contractAccount = contractAccountName
    ? await db.contractAccount.findUnique({ where: { accountName: contractAccountName } })
    : null;

  const job = await db.job.create({
    data: {
      jobType,
      source,
      contractAccountId: contractAccount?.id ?? null,
      siteName: title ?? null,
      notes: notes ?? null,
      status: "intake",
    },
  });

  res.status(201).json({ job });
});

app.patch("/api/jobs/:id", async (req, res) => {
  const id = req.params.id;
  const {
    status,
    assignedTo,
    scheduledStart,
    scheduledEnd,
    notes,
  }: {
    status?:
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
    assignedTo?: string | null;
    scheduledStart?: string | null;
    scheduledEnd?: string | null;
    notes?: string | null;
  } = req.body;

  const job = await db.job.update({
    where: { id },
    data: {
      status: status,
      assignedTo: assignedTo ?? undefined,
      scheduledStart: scheduledStart ? new Date(scheduledStart) : scheduledStart === null ? null : undefined,
      scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : scheduledEnd === null ? null : undefined,
      notes: notes ?? undefined,
    },
  });

  res.json({ job });
});

const port = Number(process.env.PORT ?? 8787);
app.listen(port, "127.0.0.1", () => {
  console.log(`API listening on http://127.0.0.1:${port}`);
});
