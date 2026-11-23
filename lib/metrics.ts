import { db } from "./db";

/** Cash received, invoices issued, expenses and net are kept separate on purpose. */
export async function finance(month: boolean) {
  const now = new Date();
  const range = month ? { gte: new Date(now.getFullYear(), now.getMonth(), 1) } : undefined;
  const [inv, rec, out, exp] = await Promise.all([
    db.invoice.aggregate({ _sum: { amount: true }, where: { createdAt: range } }),
    db.invoice.aggregate({ _sum: { amount: true }, where: { status: "PAID", ...(month ? { paidAt: range } : {}) } }),
    db.invoice.aggregate({ _sum: { amount: true }, where: { status: { in: ["UNPAID", "PENDING"] } } }),
    db.expense.aggregate({ _sum: { amount: true }, where: { date: range } }),
  ]);
  const n = (x: number | null) => x ?? 0;
  return { invoiced: n(inv._sum.amount), received: n(rec._sum.amount), outstanding: n(out._sum.amount), expenses: n(exp._sum.amount), net: n(rec._sum.amount) - n(exp._sum.amount) };
}
export const money = (n: number) => "KSh " + n.toLocaleString("en-KE");
export const EXPENSE_CATEGORIES = ["Software and subscriptions", "Hosting and infrastructure", "Internet and communication", "Equipment", "Marketing", "Transport", "Training materials", "Salaries and contractor payments", "Office and administration", "Research and development"];
