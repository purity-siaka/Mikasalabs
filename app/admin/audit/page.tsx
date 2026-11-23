import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export default async function Audit() {
  await requireRole("ADMIN");
  const logs = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  const users = await db.user.findMany({ where: { id: { in: logs.map((l) => l.userId).filter((x): x is string => !!x) } } });
  const name = (id: string | null) => users.find((u) => u.id === id)?.name ?? "System";
  return (
    <>
      <h1>Activity log</h1>
      <p className="mute">Who did what, and when. Records the latest 100 sensitive actions.</p>
      {logs.length === 0 && <p className="mute">Nothing recorded yet.</p>}
      {logs.map((l) => <div className="card row between" key={l.id}><span><b>{l.action}</b> <span className="mute">· {l.entity}{l.detail && ` · ${l.detail}`}</span></span><span className="mute">{name(l.userId)} · {l.createdAt.toLocaleString("en-KE")}</span></div>)}
    </>
  );
}
