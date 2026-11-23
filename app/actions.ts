"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/mail";

const str = (f: FormData, k: string, max: number) => String(f.get(k) ?? "").trim().slice(0, max);

export async function submitEnquiry(f: FormData) {
  if (str(f, "website", 50)) redirect("/?sent=1#contact"); // honeypot: bots fill this hidden field
  const name = str(f, "name", 120), email = str(f, "email", 160).toLowerCase(), phone = str(f, "phone", 40);
  const interest = str(f, "interest", 80), message = str(f, "message", 3000);
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || message.length < 10 || f.get("consent") !== "on") redirect("/?e=1#contact");

  const recent = await db.lead.count({ where: { email, createdAt: { gt: new Date(Date.now() - 3600e3) } } });
  if (recent < 3) {
    await db.lead.create({ data: { name, email, phone, interest, message, consent: true } });
    if (process.env.ADMIN_EMAIL) await sendMail(process.env.ADMIN_EMAIL, `New enquiry: ${interest}`, `${name} <${email}> ${phone}\n\n${message}`);
  }
  redirect("/?sent=1#contact");
}
