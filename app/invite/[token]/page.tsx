import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, hashPassword, sha } from "@/lib/auth";

export default async function Invite({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ e?: string }>;
}) {
  const [{ token }, { e }] = await Promise.all([params, searchParams]);
  const inviteToken = sha(token);
  const user = await db.user.findUnique({ where: { inviteToken } });
  const validInvite = user?.inviteExpires && user.inviteExpires > new Date();

  if (!user || !validInvite) {
    return (
      <main className="box">
        <h1>Invite link expired</h1>
        <p className="mute">Ask Mikasa Labs to send you a new invite.</p>
        <a href="/">Back to Mikasa Labs</a>
      </main>
    );
  }

  const invitedUser = user;

  async function accept(formData: FormData) {
    "use server";
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    if (password.length < 10 || password !== confirmPassword) {
      redirect(`/invite/${token}?e=1`);
    }

    const passwordHash = await hashPassword(password);
    const accepted = await db.user.updateMany({
      where: {
        id: invitedUser.id,
        inviteToken,
        inviteExpires: { gt: new Date() },
        passwordHash: null,
      },
      data: { passwordHash, inviteToken: null, inviteExpires: null },
    });

    if (accepted.count !== 1) redirect(`/invite/${token}?e=1`);

    await createSession({
      uid: invitedUser.id,
      role: invitedUser.role,
      clientId: invitedUser.clientId,
    });
    redirect(invitedUser.role === "CLIENT" ? "/portal" : "/admin");
  }

  return (
    <main className="box">
      <h1>Welcome, {user.name.split(" ")[0]}</h1>
      <p className="mute">Choose a password with at least 10 characters to open your portal.</p>
      <form action={accept} className="card">
        <p>
          <input name="password" type="password" minLength={10} placeholder="New password" autoComplete="new-password" required style={{ width: "100%" }} />
        </p>
        <p>
          <input name="confirmPassword" type="password" minLength={10} placeholder="Confirm password" autoComplete="new-password" required style={{ width: "100%" }} />
        </p>
        {e && <p className="err" role="alert">Passwords must match and contain at least 10 characters. The invite may also have expired.</p>}
        <button type="submit">Set password</button>
      </form>
    </main>
  );
}
