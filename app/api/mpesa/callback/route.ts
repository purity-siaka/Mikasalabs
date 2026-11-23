import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { stkQuery } from "@/lib/mpesa";

const ack = () => NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });

export async function POST(req: Request) {
  // Safaricom does not sign callbacks, so the URL carries a secret and we re-verify with a direct query.
  if (new URL(req.url).searchParams.get("s") !== process.env.MPESA_CALLBACK_SECRET) return new NextResponse("Forbidden", { status: 403 });

  const cb = (await req.json().catch(() => null))?.Body?.stkCallback;
  if (!cb?.CheckoutRequestID) return ack();

  const payment = await db.payment.findUnique({ where: { checkoutRequestId: cb.CheckoutRequestID }, include: { invoice: { include: { client: { include: { users: true } } } } } });
  if (!payment || payment.status !== "PENDING") return ack();

  const items: { Name: string; Value?: string | number }[] = cb.CallbackMetadata?.Item ?? [];
  const get = (n: string) => items.find((i) => i.Name === n)?.Value;
  const paid = cb.ResultCode === 0 && Number(get("Amount")) === payment.amount && (await stkQuery(cb.CheckoutRequestID).catch(() => false));

  if (paid) {
    const receipt = String(get("MpesaReceiptNumber") ?? "");
    await db.$transaction([
      db.payment.update({ where: { id: payment.id }, data: { status: "SUCCESS", mpesaReceipt: receipt, resultDesc: cb.ResultDesc } }),
      db.invoice.update({ where: { id: payment.invoiceId }, data: { status: "PAID", paidAt: new Date() } }),
    ]);
    const inv = payment.invoice;
    const msg = `Invoice ${inv.number} (KSh ${inv.amount.toLocaleString("en-KE")}) is paid. M-Pesa receipt: ${receipt}.\n\nThank you.\nMikasa Labs`;
    await Promise.all([
      ...inv.client.users.map((u) => sendMail(u.email, `Payment received: ${inv.number}`, msg)),
      process.env.ADMIN_EMAIL ? sendMail(process.env.ADMIN_EMAIL, `${inv.client.company} paid ${inv.number}`, msg) : null,
    ]);
  } else {
    await db.$transaction([
      db.payment.update({ where: { id: payment.id }, data: { status: "FAILED", resultDesc: String(cb.ResultDesc ?? "") } }),
      db.invoice.update({ where: { id: payment.invoiceId }, data: { status: "UNPAID" } }),
    ]);
  }
  return ack();
}
