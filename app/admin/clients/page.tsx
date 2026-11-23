import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { createClient, createInvoice, createProject, handleRequest, markPaid, setNote, setVisibility, updateProject } from "../actions";

const money = (n: number) => "KSh " + n.toLocaleString("en-KE");
const STAT = ["Planning", "In progress", "In review", "Delivered"];

function Toggle({ kind, id, on }: { kind: string; id: string; on: boolean }) {
  return (
    <form action={setVisibility}>
      <input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={id} /><input type="hidden" name="show" value={on ? "0" : "1"} />
      <button className={on ? "pill on" : "pill"} title="Click to change what the client sees">{on ? "Visible to client" : "Hidden from client"}</button>
    </form>
  );
}

export default async function Admin() {
  const s = await requireRole("ADMIN", "STAFF");
  const isAdmin = s.role === "ADMIN";
  const me = await db.user.findUnique({ where: { id: s.uid } });
  const clients = await db.client.findMany({
    orderBy: { createdAt: "desc" },
    include: { users: true, projects: { orderBy: { updatedAt: "desc" } }, invoices: { orderBy: { createdAt: "desc" } }, requests: { where: { done: false }, orderBy: { createdAt: "desc" } } },
  });
  const active = clients.flatMap((c) => c.projects).filter((p) => p.status !== "Delivered").length;
  const unpaid = clients.flatMap((c) => c.invoices).filter((i) => i.status !== "PAID").reduce((a, i) => a + i.amount, 0);
  const open = clients.reduce((a, c) => a + c.requests.length, 0);
  const pick = <select name="clientId" required aria-label="Client">{clients.map((c) => <option key={c.id} value={c.id}>{c.company}</option>)}</select>;

  return (
    <div>
      <h1>Clients and projects</h1>
      <p className="mute">You decide what each client sees. New projects and invoices stay hidden until you show them.</p>
        <h2 className="sh" id="new">Add new</h2>
        {isAdmin && (
          <details className="card"><summary>Add a client (sends an email invite)</summary>
            <form action={createClient} className="row" style={{ marginTop: 12 }}><input name="company" placeholder="Company" required /><input name="name" placeholder="Contact name" required /><input name="email" type="email" placeholder="Contact email" required /><button>Invite</button></form>
          </details>
        )}
        {clients.length > 0 && (
          <details className="card"><summary>Add a project</summary>
            <form action={createProject} className="row" style={{ marginTop: 12 }}>{pick}<input name="title" placeholder="Project name" required /><input name="next" placeholder="Next step" /><button>Add (hidden)</button></form>
          </details>
        )}
        {isAdmin && clients.length > 0 && (
          <details className="card"><summary>Add an invoice</summary>
            <form action={createInvoice} className="row" style={{ marginTop: 12 }}>{pick}<input name="number" placeholder="INV-001" required /><input name="description" placeholder="What it covers" /><input name="amount" type="number" min="1" placeholder="Amount (KSh)" required /><input name="due" type="date" aria-label="Due date" /><button>Add (hidden)</button></form>
          </details>
        )}

        <h2 className="sh" id="clients">Clients</h2>
        {clients.length === 0 && <p className="mute">No clients yet. Add your first one above.</p>}
        {clients.map((c) => (
          <section key={c.id} className="card" style={{ padding: 22 }}>
            <div className="row between"><h3 style={{ margin: 0 }}>{c.company}</h3><span className="mute">{c.users.map((u) => u.email).join(", ")}</span></div>

            {isAdmin && (
              <form action={setNote} className="row" style={{ margin: "14px 0" }}>
                <input type="hidden" name="id" value={c.id} />
                <input name="note" defaultValue={c.note} placeholder="Message shown at the top of this client’s dashboard" />
                <button className="ghost">Save message</button>
              </form>
            )}

            {c.requests.map((r) => (
              <form action={handleRequest} className="row card" key={r.id} style={{ borderColor: "var(--sky)" }}>
                <input type="hidden" name="id" value={r.id} /><span style={{ flex: 1 }}>Request: {r.text}</span>{isAdmin && <button className="ghost">Mark handled</button>}
              </form>
            ))}

            <h3 className="sh">Projects</h3>
            {c.projects.length === 0 && <p className="mute">None yet.</p>}
            {c.projects.map((p) => (
              <div className="card" key={p.id} style={{ background: "var(--bg)" }}>
                <div className="row between"><b>{p.title}</b><Toggle kind="project" id={p.id} on={p.visible} /></div>
                <form action={updateProject} className="row" style={{ marginTop: 10 }}>
                  <input type="hidden" name="id" value={p.id} />
                  <select name="status" defaultValue={p.status} aria-label="Status">{STAT.map((x) => <option key={x}>{x}</option>)}</select>
                  <input name="progress" type="number" min="0" max="100" defaultValue={p.progress} aria-label="Progress %" />
                  <input name="next" defaultValue={p.next} placeholder="Next step" /><button>Save</button>
                </form>
                <div className="bar" style={{ marginTop: 10 }}><i style={{ width: `${p.progress}%` }} /></div>
              </div>
            ))}

            {isAdmin && (<>
              <h3 className="sh">Invoices</h3>
              {c.invoices.length === 0 && <p className="mute">None yet.</p>}
              {c.invoices.map((i) => (
                <div className="card row between" key={i.id} style={{ background: "var(--bg)" }}>
                  <span><b>{i.number}</b> · {money(i.amount)} · <span className="mute">{i.status}</span></span>
                  <div className="row">
                    <Toggle kind="invoice" id={i.id} on={i.visible} />
                    {i.status !== "PAID" && <form action={markPaid}><input type="hidden" name="id" value={i.id} /><button className="ghost" title="Cash or bank payment">Mark paid</button></form>}
                  </div>
                </div>
              ))}
            </>)}
          </section>
        ))}
    </div>
  );
}
