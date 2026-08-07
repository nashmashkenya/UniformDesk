import { createHash, randomBytes } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { appBaseUrl } from "@/lib/url";
import {
  importStudents,
  type StudentImportRow,
} from "@/modules/identity/students-import";
import type { Role } from "@/generated/prisma/client";

const SCHOOL_ROLES: Role[] = ["school_admin", "storekeeper", "auditor"];

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

function hashApiSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

export function getSchoolIntegration(schoolId: string) {
  return prisma.school.findUnique({
    where: { id: schoolId },
    select: {
      id: true,
      name: true,
      code: true,
      schoolMasterExternalId: true,
      apiKeyPrefix: true,
      apiKeyHash: true,
      lastRosterSyncAt: true,
      lastRosterSyncNote: true,
    },
  });
}

export async function setSchoolMasterExternalId(
  schoolId: string,
  externalId: string,
) {
  const value = externalId.trim() || null;
  return prisma.school.update({
    where: { id: schoolId },
    data: { schoolMasterExternalId: value },
  });
}

export async function rotateSchoolApiKey(schoolId: string) {
  const prefix = randomBytes(4).toString("hex");
  const secret = randomBytes(24).toString("base64url");
  const apiKey = `udsk_${prefix}_${secret}`;

  await prisma.school.update({
    where: { id: schoolId },
    data: {
      apiKeyPrefix: prefix,
      apiKeyHash: hashApiSecret(secret),
    },
  });

  return { apiKey, prefix };
}

export async function clearSchoolApiKey(schoolId: string) {
  return prisma.school.update({
    where: { id: schoolId },
    data: { apiKeyPrefix: null, apiKeyHash: null },
  });
}

export async function authenticateSchoolApiKey(authorization: string | null) {
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  const match = /^udsk_([a-f0-9]+)_([A-Za-z0-9_-]+)$/.exec(token);
  if (!match) return null;

  const [, prefix, secret] = match;
  const school = await prisma.school.findFirst({
    where: { apiKeyPrefix: prefix },
  });
  if (!school?.apiKeyHash) return null;
  if (school.apiKeyHash !== hashApiSecret(secret!)) return null;
  return school;
}

export async function syncRosterFromSchoolMaster(input: {
  schoolId: string;
  students: StudentImportRow[];
  source?: string;
}) {
  if (!input.students.length) {
    throw new Error("students array is required");
  }

  const result = await importStudents({
    schoolId: input.schoolId,
    rows: input.students,
  });

  const note = `${input.source ?? "school_master"} · +${result.created} / ~${result.updated} / skip ${result.skipped}`;
  await prisma.school.update({
    where: { id: input.schoolId },
    data: {
      lastRosterSyncAt: new Date(),
      lastRosterSyncNote: note,
    },
  });

  return result;
}

export async function issueSchoolMasterSso(input: {
  schoolId: string;
  email: string;
  name: string;
  role?: Role;
}) {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  if (!email || !name) throw new Error("email and name are required");

  const role: Role =
    input.role && SCHOOL_ROLES.includes(input.role)
      ? input.role
      : "storekeeper";

  let user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    if (user.schoolId !== input.schoolId) {
      throw new Error("User belongs to another school");
    }
    if (
      user.role === "supplier_admin" ||
      user.role === "supplier_staff"
    ) {
      throw new Error("Supplier users cannot SSO into a school desk");
    }
    user = await prisma.user.update({
      where: { id: user.id },
      data: { name, role, active: true },
    });
  } else {
    const passwordHash = await hashPassword(randomBytes(24).toString("hex"));
    user = await prisma.user.create({
      data: {
        schoolId: input.schoolId,
        email,
        name,
        role,
        passwordHash,
      },
    });
  }

  const token = await new SignJWT({
    sub: user.id,
    purpose: "school_master_sso",
    schoolId: input.schoolId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(secretKey());

  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    loginUrl: `${appBaseUrl()}/sso?token=${encodeURIComponent(token)}`,
    expiresInSeconds: 300,
  };
}

export async function consumeSchoolMasterSsoToken(token: string) {
  const { payload } = await jwtVerify(token, secretKey());
  const purpose = String(payload.purpose ?? "");
  if (purpose !== "school_master_sso" || !payload.sub) {
    throw new Error("Invalid SSO token");
  }
  const user = await prisma.user.findFirst({
    where: { id: payload.sub, active: true },
  });
  if (!user?.schoolId) throw new Error("SSO user not found");
  const schoolId = payload.schoolId ? String(payload.schoolId) : null;
  if (schoolId && schoolId !== user.schoolId) {
    throw new Error("SSO school mismatch");
  }
  return user.id;
}
