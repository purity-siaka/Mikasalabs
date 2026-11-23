const baseUrl = () =>
  process.env.MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

const requiredEnv = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
};

async function accessToken() {
  const credentials = Buffer.from(
    `${requiredEnv("MPESA_CONSUMER_KEY")}:${requiredEnv("MPESA_CONSUMER_SECRET")}`,
  ).toString("base64");
  const response = await fetch(`${baseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("M-Pesa authentication failed");
  return (await response.json()).access_token as string;
}

export function normalizePhone(input: string) {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `254${digits.slice(1)}`;
  else if (digits.startsWith("7") || digits.startsWith("1")) digits = `254${digits}`;
  if (!/^254[17]\d{8}$/.test(digits)) {
    throw new Error("Enter a valid Safaricom number, e.g. 0712345678");
  }
  return digits;
}

const timestamp = () => new Date().toISOString().replace(/\D/g, "").slice(0, 14);
const password = (time: string) =>
  Buffer.from(requiredEnv("MPESA_SHORTCODE") + requiredEnv("MPESA_PASSKEY") + time).toString("base64");

export async function stkPush(options: { phone: string; amount: number; reference: string }) {
  const time = timestamp();
  const response = await fetch(`${baseUrl()}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      BusinessShortCode: requiredEnv("MPESA_SHORTCODE"),
      Password: password(time),
      Timestamp: time,
      TransactionType: "CustomerPayBillOnline",
      Amount: options.amount,
      PartyA: options.phone,
      PartyB: requiredEnv("MPESA_SHORTCODE"),
      PhoneNumber: options.phone,
      CallBackURL: `${requiredEnv("APP_URL")}/api/mpesa/callback?s=${requiredEnv("MPESA_CALLBACK_SECRET")}`,
      AccountReference: options.reference.slice(0, 12),
      TransactionDesc: "Invoice",
    }),
  });
  const result = await response.json();
  if (!response.ok || result.ResponseCode !== "0") {
    throw new Error(result.errorMessage || result.ResponseDescription || "M-Pesa request failed");
  }
  return result.CheckoutRequestID as string;
}

export async function stkQuery(checkoutRequestId: string) {
  const time = timestamp();
  const response = await fetch(`${baseUrl()}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      BusinessShortCode: requiredEnv("MPESA_SHORTCODE"),
      Password: password(time),
      Timestamp: time,
      CheckoutRequestID: checkoutRequestId,
    }),
  });
  const result = await response.json();
  return String(result.ResultCode) === "0";
}
