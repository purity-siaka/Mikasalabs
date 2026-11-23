import { revalidatePath } from "next/cache";
import Logo from "@/components/Logo";
import PayButton from "@/components/PayButton";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { sendMail } from "@/lib/mail";

const money = (n: number) => "KSh " + n.toLocaleString("en-KE");

export default async function Portal() {
  const s = await requireRole("CLIENT");
  const [client, me] = await Promise.all([
    db.client.findUnique({
      where: { id: s.clientId! },
      include: {
        projects: { where: { visible: true }, orderBy: { updatedAt: "desc" } },
        invoices: { where: { visible: true }, orderBy: { createdAt: "desc" } },
        requests: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    }),
    db.user.findUnique({ where: { id: s.uid } }),
  ]);
  if (!client) return <main className="box"><h1>No workspace yet</h1><p className="mute">Contact Mikasa Labs.</p></main>;
  const due = client.invoices.filter((i) => i.status !== "PAID").reduce((a, i) => a + i.amount, 0);

  async function sendRequest(f: FormData) {
    "use server";
    const sess = await requireRole("CLIENT");
    const text = String(f.get("text") ?? "").trim().slice(0, 2000);
    if (!text) return;
    const c = await db.client.update({ where: { id: sess.clientId! }, data: { requests: { create: { text } } } });
    if (process.env.ADMIN_EMAIL) await sendMail(process.env.ADMIN_EMAIL, `New request from ${c.company}`, text);
    revalidatePath("/portal");
  }

  return (
    <>
      <header className="nav"><div className="wrap">
        <a className="brand" href="/portal"><Logo onLight /><span>MIKASA<small>LABS</small></span></a>
        <form action="/api/logout" method="post"><button className="ghost">Sign out</button></form>
      </div></header>
      <main className="wrap" style={{ padding: "36px 24px 80px" }}>
        <h1>Welcome back, {me?.name.split(" ")[0]}</h1>
        <p className="mute">{client.company}</p>
        {client.note && <div className="card" style={{ borderColor: "var(--sky)" }}>{client.note}</div>}

        <h2 className="sh">Your projects</h2>
        {client.projects.length === 0 && <p className="mute">Your projects will appear here.</p>}
        {client.projects.map((p) => (
          <div className="card" key={p.id}>
            <div className="row between"><h3 style={{ margin: 0 }}>{p.title}</h3><span className="tag">{p.status}</span></div>
            <p style={{ margin: "10px 0" }}>Next: {p.next || "To be confirmed"}</p>
            <div className="bar"><i style={{ width: `${p.progress}%` }} /></div>
            <p className="mute" style={{ margin: "8px 0 0" }}>{p.progress}% complete</p>
          </div>
        ))}

        {client.invoices.length > 0 && <>
          <h2 className="sh">Invoices</h2>
          {due > 0 && <p className="mute">Outstanding: {money(due)}</p>}
          {client.invoices.map((i) => (
            <div className="card" key={i.id}>
              <div className="row between">
                <div><b>{i.number}</b>{i.description && ` · ${i.description}`}<div className="mute">{money(i.amount)}{i.dueDate && ` · due ${i.dueDate.toLocaleDateString("en-KE")}`}</div></div>
                <span className="tag">{i.status === "PENDING" ? "Awaiting confirmation" : i.status === "PAID" ? "Paid" : "Unpaid"}</span>
              </div>
              {i.status === "UNPAID" && <div style={{ marginTop: 12 }}><PayButton invoiceId={i.id} /></div>}
            </div>
          ))}
        </>}

        <h2 className="sh">Send us a request</h2>
        <form action={sendRequest} className="card"><p style={{ margin: "0 0 12px" }}><textarea name="text" rows={3} required placeholder="What do you need or want changed?" style={{ width: "100%" }} /></p><button>Send</button></form>
        {client.requests.map((r) => <p className="mute" key={r.id}>{r.createdAt.toLocaleDateString("en-KE")}: {r.text}</p>)}
      </main>
    </>
  );
}
