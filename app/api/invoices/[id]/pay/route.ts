import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { normalizePhone, stkPush } from "@/lib/mpesa";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.role !== "CLIENT" || !session.clientId) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const { id } = await params;
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !("phone" in body) || typeof body.phone !== "string") {
    return NextResponse.json({ error: "Enter a valid M-Pesa phone number." }, { status: 400 });
  }

  let phone: string;
  try {
    phone = normalizePhone(body.phone);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Enter a valid M-Pesa phone number." },
      { status: 400 },
    );
  }

  const invoice = await db.invoice.findFirst({
    where: { id, clientId: session.clientId, visible: true },
  });
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }
  if (invoice.status !== "UNPAID") {
    return NextResponse.json({ error: "This invoice is not available for payment." }, { status: 409 });
  }

  const reservation = await db.invoice.updateMany({
    where: { id: invoice.id, clientId: session.clientId, visible: true, status: "UNPAID" },
    data: { status: "PENDING" },
  });
  if (reservation.count !== 1) {
    return NextResponse.json({ error: "This invoice is already being processed." }, { status: 409 });
  }

  let checkoutRequestId: string;
  try {
    checkoutRequestId = await stkPush({
      phone,
      amount: invoice.amount,
      reference: invoice.number,
    });
  } catch (error) {
    await db.invoice.updateMany({
      where: { id: invoice.id, status: "PENDING" },
      data: { status: "UNPAID" },
    });
    console.error("Could not start M-Pesa payment:", error);
    return NextResponse.json(
      { error: "Could not start the payment. Check the M-Pesa settings or try again." },
      { status: 502 },
    );
  }

  try {
    await db.payment.create({
      data: {
        invoiceId: invoice.id,
        phone,
        amount: invoice.amount,
        checkoutRequestId,
      },
    });
  } catch (error) {
    console.error("M-Pesa accepted a payment request, but it could not be recorded:", error);
    return NextResponse.json(
      { error: "The payment request could not be recorded. Contact Mikasa Labs before retrying." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
