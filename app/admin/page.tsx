import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { finance, money } from "@/lib/metrics";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.role !== "ADMIN") redirect("/admin/clients");
  const { r } = await searchParams;
  const month = r !== "all";
  const [me, f, clients, active, delivered, newLeads, pipe, requests] = await Promise.all([
    db.user.findUnique({ where: { id: s.uid } }),
    finance(month),
    db.client.count(),
    db.project.count({ where: { status: { not: "Delivered" } } }),
    db.project.count({ where: { status: "Delivered" } }),
    db.lead.count({ where: { status: "NEW" } }),
    db.lead.aggregate({ _count: true, _sum: { value: true }, where: { status: { notIn: ["WON", "LOST"] } } }),
    db.request.count({ where: { done: false } }),
  ]);
  const Stat = ({ label, value, href, note }: { label: string; value: string | number; href: string; note?: string }) => (
    <a className="card stat" href={href}><span className="mute">{label}</span><b>{value}</b>{note && <span className="mute">{note}</span>}</a>
  );
  return (
    <>
      <div className="row between">
        <div><h1>Welcome back, {me?.name.split(" ")[0] ?? "Admin"}</h1><p className="mute">Everything here comes from your real records. Click any card to open the records behind it.</p></div>
        <div className="row"><a className={month ? "btn" : "btn ghost"} href="/admin">This month</a><a className={month ? "btn ghost" : "btn"} href="/admin?r=all">All time</a></div>
      </div>

      <h2 className="sh">Money</h2>
      <div className="stats">
        <Stat label="Invoiced" value={money(f.invoiced)} href="/admin/finance" note="Invoices issued" />
        <Stat label="Received" value={money(f.received)} href="/admin/finance" note="Paid invoices" />
        <Stat label="Expenses" value={money(f.expenses)} href="/admin/finance" />
        <Stat label="Net (received minus expenses)" value={money(f.net)} href="/admin/finance" />
      </div>
      <div className="stats" style={{ marginTop: -14 }}>
        <Stat label="Outstanding (all time)" value={money(f.outstanding)} href="/admin/finance?view=outstanding" />
      </div>

      <h2 className="sh">Business</h2>
      <div className="stats">
        <Stat label="New leads" value={newLeads} href="/admin/leads" />
        <Stat label="Open pipeline" value={pipe._sum.value ? money(pipe._sum.value) : `${pipe._count} leads`} href="/admin/leads" note={pipe._sum.value ? `${pipe._count} open leads` : "Add values to leads"} />
        <Stat label="Clients" value={clients} href="/admin/clients" />
        <Stat label="Open client requests" value={requests} href="/admin/clients" />
      </div>
      <div className="stats" style={{ marginTop: -14 }}>
        <Stat label="Active projects" value={active} href="/admin/clients" />
        <Stat label="Delivered projects" value={delivered} href="/admin/clients" />
      </div>

      <h2 className="sh">Coming next</h2>
      <div className="card"><p className="mute" style={{ margin: 0 }}>Not built yet, so no numbers are shown: Academy students and enrolments, proposals and contracts, team and HR, products and subscriptions, support tickets, and Mikasa Intelligence. See docs/ARCHITECTURE.md for the release plan.</p></div>
    </>
  );
}
