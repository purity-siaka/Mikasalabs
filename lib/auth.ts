import crypto from "crypto";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type Role = "ADMIN" | "STAFF" | "CLIENT";
export type Session = { uid: string; role: Role; clientId: string | null };

const key = () => {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must be set to 32+ characters");
  return new TextEncoder().encode(secret);
};

export const sha = (text: string) => crypto.createHash("sha256").update(text).digest("hex");
export const hashPassword = (password: string) => bcrypt.hash(password, 12);
export const checkPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export async function createSession(session: Session) {
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("12h")
    .sign(key());

  (await cookies()).set("ml_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get("ml_session")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, key());
    if (
      typeof payload.uid !== "string" ||
      (payload.role !== "ADMIN" && payload.role !== "STAFF" && payload.role !== "CLIENT") ||
      (payload.clientId !== null && typeof payload.clientId !== "string")
    ) {
      return null;
    }
    return { uid: payload.uid, role: payload.role, clientId: payload.clientId };
  } catch {
    return null;
  }
}

export async function requireRole(...roles: Role[]) {
  const session = await getSession();
  if (!session || !roles.includes(session.role)) redirect("/login");
  return session;
}
