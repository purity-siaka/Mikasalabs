import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD before running the seed.");
  }
  if (password.length < 10) {
    throw new Error("ADMIN_PASSWORD must contain at least 10 characters.");
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== "ADMIN") {
      throw new Error("ADMIN_EMAIL belongs to a non-admin account; choose a different email.");
    }
    console.log("Admin account already exists; leaving its credentials unchanged.");
    return;
  }

  await db.user.create({
    data: {
      email,
      name: process.env.ADMIN_NAME?.trim() || "Mikasa Labs Admin",
      role: "ADMIN",
      passwordHash: await bcrypt.hash(password, 12),
    },
  });
  console.log(`Created the admin account for ${email}.`);
}

main()
  .catch((error: unknown) => {
    console.error("Admin seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
