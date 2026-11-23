import { db } from "./db";
import { getSession } from "./auth";

export async function audit(action: string, entity: string, entityId?: string, detail = "") {
  try {
    const s = await getSession();
    await db.auditLog.create({ data: { userId: s?.uid ?? null, action, entity, entityId: entityId ?? null, detail: detail.slice(0, 500) } });
  } catch (e) { console.error("audit failed", e); }
}
