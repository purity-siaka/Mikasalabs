"use server";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole, sha } from "@/lib/auth";
import { sendMail } from "@/lib/mail";
import { audit } from "@/lib/audit";
import { EXPENSE_CATEGORIES } from "@/lib/metrics";

const STATUSES = ["NEW", "CONTACTED", "DISCOVERY", "PROPOSAL", "NEGOTIATION", "WON", "LOST"] as const;
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function updateLead(f: FormData) {
  await requireRole("ADMIN");
  const id = str(f, "id"), status = str(f, "status") as (typeof STATUSES)[number];
  if (!STATUSES.includes(status)) return;
  const value = Math.round(Number(str(f, "value")));
  const fu = str(f, "followUp");
  await db.lead.update({ where: { id }, data: { status, value: value > 0 ? value : null, followUp: fu ? new Date(fu) : null, notes: str(f, "notes").slice(0, 2000) } });
  await audit("lead.update", "Lead", id, status);
  revalidatePath("/admin/leads");
}

export async function convertLead(f: FormData) {
  await requireRole("ADMIN");
  const id = str(f, "id");
  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead) return;
  if (!(await db.user.findUnique({ where: { email: lead.email } }))) {
    const token = crypto.randomBytes(32).toString("hex");
    await db.client.create({ data: { company: lead.organisation || lead.name, users: { create: { email: lead.email, name: lead.name, role: "CLIENT", inviteToken: sha(token), inviteExpires: new Date(Date.now() + 7 * 864e5) } } } });
    await sendMail(lead.email, "Your Mikasa Labs client portal", `Hello ${lead.name},\n\nSet your password and open your portal:\n${process.env.APP_URL}/invite/${token}\n\nThis link expires in 7 days.\n\nMikasa Labs`);
  }
  await db.lead.update({ where: { id }, data: { status: "WON" } });
  await audit("lead.convert", "Lead", id, lead.email);
  revalidatePath("/admin/leads"); revalidatePath("/admin/clients");
}

export async function createExpense(f: FormData) {
  await requireRole("ADMIN");
  const category = str(f, "category"), description = str(f, "description"), amount = Math.round(Number(str(f, "amount")));
  if (!EXPENSE_CATEGORIES.includes(category) || !description || !(amount > 0)) return;
  const date = str(f, "date");
  const e = await db.expense.create({ data: { category, description: description.slice(0, 200), amount, reference: str(f, "reference").slice(0, 80), date: date ? new Date(date) : new Date() } });
  await audit("expense.create", "Expense", e.id, `${category} ${amount}`);
  revalidatePath("/admin/finance"); revalidatePath("/admin");
}
