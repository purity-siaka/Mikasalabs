import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { EXPENSE_CATEGORIES, finance, money } from "@/lib/metrics";
import { createExpense } from "../crm-actions";

export default async function Finance({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  await requireRole("ADMIN");
  const { view } = await searchParams;
  const outstanding = view === "outstanding";
  const [all, month, invoices, expenses] = await Promise.all([
    finance(false), finance(true),
    db.invoice.findMany({ where: outstanding ? { status: { in: ["UNPAID", "PENDING"] } } : {}, orderBy: { createdAt: "desc" }, include: { client: true }, take: 100 }),
    db.expense.findMany({ orderBy: { date: "desc" }, take: 50 }),
  ]);
  const Row = ({ label, a, b }: { label: string; a: number; b: number }) => <tr><td style={{ padding: "6px 0" }}>{label}</td><td>{money(b)}</td><td>{money(a)}</td></tr>;
  return (
    <>
      <h1>Finance</h1>
      <p className="mute">Cash received, invoices issued, expenses and net are kept separate. This is a management view, not a statutory accounting or tax system.</p>
      <div className="card"><table style={{ width: "100%", textAlign: "left" }}><thead><tr className="mute"><th></th><th>This month</th><th>All time</th></tr></thead><tbody>
        <Row label="Invoiced" a={all.invoiced} b={month.invoiced} /><Row label="Received" a={all.received} b={month.received} />
        <Row label="Expenses" a={all.expenses} b={month.expenses} /><Row label="Net (received minus expenses)" a={all.net} b={month.net} />
      </tbody></table><p className="mute" style={{ marginBottom: 0 }}>Outstanding invoices: {money(all.outstanding)}. Payments recorded before this update have no payment date, so they appear only in All time.</p></div>

      <h2 className="sh">Record an expense</h2>
      <form action={createExpense} className="card row">
        <input name="date" type="date" aria-label="Date" /><select name="category" aria-label="Category" required>{EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        <input name="description" placeholder="What was it for" required /><input name="amount" type="number" min="1" placeholder="Amount (KSh)" required /><input name="reference" placeholder="Reference (optional)" /><button>Add expense</button>
      </form>

      <h2 className="sh">{outstanding ? "Outstanding invoices" : "Invoices"} <a className="mute" href={outstanding ? "/admin/finance" : "/admin/finance?view=outstanding"}>{outstanding ? "Show all" : "Show only outstanding"}</a></h2>
      {invoices.length === 0 && <p className="mute">None.</p>}
      {invoices.map((i) => <div className="card row between" key={i.id}><span><b>{i.number}</b> · {i.client.company} · {money(i.amount)}</span><span className="tag">{i.status}</span></div>)}

      <h2 className="sh">Expenses</h2>
      {expenses.length === 0 && <p className="mute">None recorded yet.</p>}
      {expenses.map((e) => <div className="card row between" key={e.id}><span><b>{e.description}</b> <span className="mute">· {e.category} · {e.date.toLocaleDateString("en-KE")}{e.reference && ` · ${e.reference}`}</span></span><b>{money(e.amount)}</b></div>)}
    </>
  );
}
