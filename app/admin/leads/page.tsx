import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { convertLead, updateLead } from "../crm-actions";
import { money } from "@/lib/metrics";

const STAGES = [["NEW", "New"], ["CONTACTED", "Contacted"], ["DISCOVERY", "Discovery"], ["PROPOSAL", "Proposal"], ["NEGOTIATION", "Negotiation"], ["WON", "Won"], ["LOST", "Lost"]] as const;

export default async function Leads() {
  await requireRole("ADMIN");
  const leads = await db.lead.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <>
      <h1>Leads and pipeline</h1>
      <p className="mute">Every website enquiry lands here as a new lead. Move it through the pipeline, and convert a won lead into a client with one click.</p>
      {leads.length === 0 && <div className="card"><p className="mute" style={{ margin: 0 }}>No leads yet. Submit the contact form on the website to create the first one.</p></div>}
      <div className="kanban">
        {STAGES.map(([key, label]) => {
          const items = leads.filter((l) => l.status === key);
          return (
            <div key={key}>
              <h3>{label} ({items.length})</h3>
              {items.map((l) => (
                <div className="card" key={l.id}>
                  <b>{l.name}</b>{l.organisation && <span className="mute"> · {l.organisation}</span>}
                  <div className="mute">{l.interest} · {l.createdAt.toLocaleDateString("en-KE")}</div>
                  <p style={{ margin: "8px 0", fontSize: 14 }}>{l.message}</p>
                  <div className="mute"><a href={`mailto:${l.email}`}>{l.email}</a>{l.phone && ` · ${l.phone}`}</div>
                  <form action={updateLead} className="row" style={{ marginTop: 10 }}>
                    <input type="hidden" name="id" value={l.id} />
                    <select name="status" defaultValue={l.status} aria-label="Stage">{STAGES.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select>
                    <input name="value" type="number" min="0" defaultValue={l.value ?? ""} placeholder="Value (KSh)" aria-label="Value" />
                    <input name="followUp" type="date" defaultValue={l.followUp ? l.followUp.toISOString().slice(0, 10) : ""} aria-label="Follow-up date" />
                    <input name="notes" defaultValue={l.notes} placeholder="Notes" aria-label="Notes" />
                    <button className="ghost">Save</button>
                  </form>
                  {l.value && <div className="mute" style={{ marginTop: 6 }}>Opportunity: {money(l.value)}</div>}
                  {l.status !== "WON" && l.status !== "LOST" && (
                    <form action={convertLead} style={{ marginTop: 8 }}><input type="hidden" name="id" value={l.id} /><button title="Creates a client and emails them an invite">Convert to client</button></form>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}
