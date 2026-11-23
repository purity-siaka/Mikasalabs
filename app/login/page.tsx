import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { checkPassword, createSession, getSession } from "@/lib/auth";

export default async function Login({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const session = await getSession();
  if (session) redirect(session.role === "CLIENT" ? "/portal" : "/admin");
  const { e } = await searchParams;

  async function login(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const user = await db.user.findUnique({ where: { email } });
    const passwordMatches = user?.passwordHash
      ? await checkPassword(password, user.passwordHash)
      : false;

    if (!user || !passwordMatches) redirect("/login?e=1");

    await createSession({ uid: user.id, role: user.role, clientId: user.clientId });
    redirect(user.role === "CLIENT" ? "/portal" : "/admin");
  }

  return (
    <main className="box">
      <h1>Mikasa Labs</h1>
      <p className="mute">Sign in to your portal.</p>
      <form action={login} className="card">
        <p>
          <input name="email" type="email" placeholder="Email" autoComplete="email" required style={{ width: "100%" }} />
        </p>
        <p>
          <input name="password" type="password" placeholder="Password" autoComplete="current-password" required style={{ width: "100%" }} />
        </p>
        {e && <p className="err" role="alert">Email or password is incorrect.</p>}
        <button type="submit">Sign in</button>
      </form>
      <p className="mute"><a href="/">Back to Mikasa Labs</a></p>
    </main>
  );
}
