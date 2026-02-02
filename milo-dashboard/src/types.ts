// UI-facing labels that match your JSON spec.
// These are the canonical board columns + swimlanes.

export const LOCKSMITH_COLUMNS = [
  "Intake",
  "Quoted",
  "Scheduled",
  "In Progress",
  "Waiting on Parts/Approval",
  "Completed",
  "Invoiced",
  "Paid",
  "Follow-up/Review Request",
  "Archived",
] as const;

export const LOCKSMITH_SWIMLANES = [
  "Contract Work: OCU",
  "Contract Work: BASS",
  "Contract Work: EVO",
  "Contract Work: Academy",
  "Organic: GMB",
  "Organic: Word of Mouth",
  "Commercial",
  "Safe",
  "Residential",
  "Automotive",
] as const;

export const MAKER_COLUMNS = [
  "Ideas",
  "Specs/Requirements",
  "Build",
  "QA",
  "Publish",
  "Market",
  "Optimize",
  "Library/Reuse",
] as const;

export const MAKER_SWIMLANES = [
  "Apps (utility + business tools)",
  "Games (Unity)",
  "KDP Comics",
  "Graphic Assets",
  "Video Scripts/Shorts",
  "SEO Articles",
] as const;
