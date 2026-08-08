import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "node:path";

const url = process.env.DATABASE_URL || "file:./prisma/dev.db";
const filePath = url.replace(/^file:/, "");
const abs = path.isAbsolute(filePath)
  ? filePath
  : path.resolve(process.cwd(), filePath);

const adapter = new PrismaBetterSqlite3({ url: abs });
const prisma = new PrismaClient({ adapter });

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
