import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const pool = new Pool({ connectionString });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const users = await prisma.user.findMany({
    select: {
      email: true,
      name: true,
      role: true,
      active: true,
      school: { select: { code: true } },
      supplier: { select: { code: true } },
    },
    orderBy: { email: "asc" },
  });

  console.log(`total: ${users.length}`);
  for (const u of users) {
    const org = u.school?.code || u.supplier?.code || "-";
    console.log(
      `${u.role.padEnd(16)} ${u.email.padEnd(36)} ${u.name} (${org})`,
    );
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
