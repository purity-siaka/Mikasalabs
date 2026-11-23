import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD before resetting the password.");
  }
  if (password.length < 10) {
    throw new Error("ADMIN_PASSWORD must contain at least 10 characters.");
  }

  const user = await db.user.findUnique({ where: { email }, select: { id: true, role: true } });
  if (!user || user.role !== "ADMIN") {
    throw new Error("No admin account matches ADMIN_EMAIL. Run npm run seed to create the first admin.");
  }

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(password, 12) },
  });
  console.log(`Updated the admin password for ${email}.`);
}

main()
  .catch((error: unknown) => {
    console.error("Admin password reset failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
