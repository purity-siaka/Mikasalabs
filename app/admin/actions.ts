"use server";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole, sha } from "@/lib/auth";
import { sendMail } from "@/lib/mail";
import { audit } from "@/lib/audit";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const done = () => { revalidatePath("/admin"); revalidatePath("/portal"); };

export async function createClient(f: FormData) {
  await requireRole("ADMIN");
  const company = str(f, "company"), name = str(f, "name"), email = str(f, "email").toLowerCase();
  if (!company || !name || !/^\S+@\S+\.\S+$/.test(email)) return;
  if (await db.user.findUnique({ where: { email } })) return;
  const token = crypto.randomBytes(32).toString("hex");
  await db.client.create({ data: { company, users: { create: { email, name, role: "CLIENT", inviteToken: sha(token), inviteExpires: new Date(Date.now() + 7 * 864e5) } } } });
  await sendMail(email, "Your Mikasa Labs client portal", `Hello ${name},\n\nSet your password and open your portal:\n${process.env.APP_URL}/invite/${token}\n\nThis link expires in 7 days.\n\nMikasa Labs`);
  await audit("client.create", "Client", undefined, company);
  done();
}

// New projects and invoices start HIDDEN. The client sees nothing until you show it.
export async function createProject(f: FormData) {
  await requireRole("ADMIN", "STAFF");
  const clientId = str(f, "clientId"), title = str(f, "title");
  if (!clientId || !title) return;
  await db.project.create({ data: { clientId, title, next: str(f, "next") } });
  done();
}

export async function updateProject(f: FormData) {
  await requireRole("ADMIN", "STAFF");
  const progress = Math.max(0, Math.min(100, Number(str(f, "progress")) || 0));
  await db.project.update({ where: { id: str(f, "id") }, data: { status: str(f, "status"), progress, next: str(f, "next") } });
  done();
}

export async function createInvoice(f: FormData) {
  await requireRole("ADMIN");
  const clientId = str(f, "clientId"), number = str(f, "number"), amount = Math.round(Number(str(f, "amount")));
  if (!clientId || !number || !(amount > 0)) return;
  if (await db.invoice.findUnique({ where: { number } })) return;
  const due = str(f, "due");
  await db.invoice.create({ data: { clientId, number, amount, description: str(f, "description"), dueDate: due ? new Date(due) : null } });
  await audit("invoice.create", "Invoice", undefined, `${number} ${amount}`);
  done();
}

export async function setVisibility(f: FormData) {
  const kind = str(f, "kind"), id = str(f, "id"), show = str(f, "show") === "1";
  if (kind === "project") {
    await requireRole("ADMIN", "STAFF");
    await db.project.update({ where: { id }, data: { visible: show } });
  } else {
    await requireRole("ADMIN");
    const inv = await db.invoice.update({ where: { id }, data: { visible: show }, include: { client: { include: { users: true } } } });
    if (show && inv.status === "UNPAID")
      await Promise.all(inv.client.users.map((u) => sendMail(u.email, `New invoice ${inv.number}`, `A new invoice (${inv.number}, KSh ${inv.amount.toLocaleString("en-KE")}) is ready. Sign in to pay with M-Pesa:\n${process.env.APP_URL}/login\n\nMikasa Labs`)));
  }
  await audit("visibility." + kind, kind, id, show ? "shown to client" : "hidden from client");
  done();
}

export async function setNote(f: FormData) {
  await requireRole("ADMIN");
  await db.client.update({ where: { id: str(f, "id") }, data: { note: str(f, "note").slice(0, 1000) } });
  await audit("client.note", "Client", str(f, "id"));
  done();
}

export async function markPaid(f: FormData) {
  await requireRole("ADMIN");
  await db.invoice.update({ where: { id: str(f, "id") }, data: { status: "PAID", paidAt: new Date() } });
  await audit("invoice.mark_paid", "Invoice", str(f, "id"));
  done();
}

export async function handleRequest(f: FormData) {
  await requireRole("ADMIN");
  await db.request.update({ where: { id: str(f, "id") }, data: { done: true } });
  done();
}
