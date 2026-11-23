"use client";

import { useState } from "react";

export default function PayButton({ invoiceId }: { invoiceId: string }) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function pay() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const result = await response.json().catch(() => ({}));
      setMessage(
        response.ok
          ? "Check your phone and enter your M-Pesa PIN. This page updates once payment is confirmed."
          : result.error || "Could not start payment.",
      );
    } catch {
      setMessage("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="row">
      <input
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        placeholder="M-Pesa number, e.g. 0712345678"
        inputMode="tel"
        aria-label="M-Pesa phone number"
      />
      <button type="button" onClick={pay} disabled={busy}>
        {busy ? "Sending…" : "Pay with M-Pesa"}
      </button>
      {message && <p className="mute" style={{ width: "100%" }}>{message}</p>}
    </div>
  );
}
