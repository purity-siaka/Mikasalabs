import Logo from "@/components/Logo";
import { requireRole } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await requireRole("ADMIN", "STAFF");
  const admin = s.role === "ADMIN";
  return (
    <div className="shell">
      <aside className="side">
        <a className="brand" href="/admin"><Logo /><span>MIKASA<small>LABS</small></span></a>
        {admin && <a href="/admin">Dashboard</a>}
        {admin && <a href="/admin/leads">Leads and pipeline</a>}
        <a href="/admin/clients">Clients and projects</a>
        {admin && <a href="/admin/finance">Finance</a>}
        {admin && <a href="/admin/audit">Activity log</a>}
        <a href="/" target="_blank">View website</a>
        <div className="grow" />
        <form action="/api/logout" method="post"><button className="ghost" style={{ width: "100%" }}>Sign out</button></form>
      </aside>
      <div className="content">{children}</div>
    </div>
  );
}
