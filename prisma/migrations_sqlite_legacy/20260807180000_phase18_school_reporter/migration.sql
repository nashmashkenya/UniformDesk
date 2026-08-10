-- Supplier-first roles: migrate legacy school roles to school_reporter.
-- Role is stored as TEXT in SQLite; Prisma client enum gains school_reporter.

UPDATE "User"
SET "role" = 'school_reporter'
WHERE "role" IN ('school_admin', 'storekeeper', 'auditor');
