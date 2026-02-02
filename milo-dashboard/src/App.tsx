import "./App.css";
import {
  LOCKSMITH_COLUMNS,
  LOCKSMITH_SWIMLANES,
  MAKER_COLUMNS,
  MAKER_SWIMLANES,
} from "./types";

function Section(props: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h2 style={{ margin: "16px 0 8px" }}>{props.title}</h2>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>{props.children}</div>
    </section>
  );
}

function List(props: { title: string; items: readonly string[] }) {
  return (
    <div style={{ minWidth: 280 }}>
      <h3 style={{ margin: "8px 0" }}>{props.title}</h3>
      <ol style={{ margin: 0, paddingLeft: 18 }}>
        {props.items.map((x) => (
          <li key={x} style={{ margin: "4px 0" }}>
            {x}
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function App() {
  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <h1>MILO Unified Dashboard (v0)</h1>
      <p style={{ opacity: 0.85, marginTop: 0 }}>
        Scaffolding: DB schema is in place. Next step is building the Kanban + CRM
        UI on top.
      </p>

      <Section title="Locksmith Ops Board">
        <List title="Columns" items={LOCKSMITH_COLUMNS} />
        <List title="Swimlanes" items={LOCKSMITH_SWIMLANES} />
      </Section>

      <Section title="Maker Board">
        <List title="Columns" items={MAKER_COLUMNS} />
        <List title="Swimlanes" items={MAKER_SWIMLANES} />
      </Section>
    </div>
  );
}
