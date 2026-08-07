import { prisma } from "@/lib/db";

export type StudentImportRow = {
  admissionNo: string;
  fullName: string;
  className?: string;
};

export type StudentImportResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
};

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

export function parseStudentCsv(text: string): StudentImportRow[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV needs a header row and at least one student");
  }

  const header = parseCsvLine(lines[0]!).map((h) => h.toLowerCase());
  const admissionIdx = header.findIndex((h) =>
    ["admissionno", "admission_no", "admission", "admno", "adm_no"].includes(
      h.replace(/\s+/g, ""),
    ),
  );
  const nameIdx = header.findIndex((h) =>
    ["fullname", "studentname", "student_name"].includes(h.replace(/\s+/g, "")),
  );
  const classIdx = header.findIndex((h) =>
    ["class", "classname", "class_name", "form"].includes(h.replace(/\s+/g, "")),
  );

  if (admissionIdx < 0 || nameIdx < 0) {
    throw new Error(
      "CSV header must include admission_no (or admission) and full_name (or name)",
    );
  }

  const rows: StudentImportRow[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseCsvLine(lines[i]!);
    const admissionNo = (cells[admissionIdx] ?? "").trim();
    const fullName = (cells[nameIdx] ?? "").trim();
    const className =
      classIdx >= 0 ? (cells[classIdx] ?? "").trim() : undefined;
    if (!admissionNo && !fullName) continue;
    rows.push({ admissionNo, fullName, className });
  }

  if (!rows.length) throw new Error("No student rows found in the CSV");
  return rows;
}

export async function importStudents(input: {
  schoolId: string;
  rows: StudentImportRow[];
}): Promise<StudentImportResult> {
  const result: StudentImportResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  for (const [index, row] of input.rows.entries()) {
    const lineNo = index + 2;
    const admissionNo = row.admissionNo.trim().toUpperCase();
    const fullName = row.fullName.trim();
    const className = row.className?.trim() || null;

    if (!admissionNo || !fullName) {
      result.skipped += 1;
      result.errors.push(`Line ${lineNo}: missing admission or name`);
      continue;
    }

    const existing = await prisma.student.findUnique({
      where: {
        schoolId_admissionNo: {
          schoolId: input.schoolId,
          admissionNo,
        },
      },
    });

    if (existing) {
      await prisma.student.update({
        where: { id: existing.id },
        data: {
          fullName,
          className,
          active: true,
        },
      });
      result.updated += 1;
    } else {
      await prisma.student.create({
        data: {
          schoolId: input.schoolId,
          admissionNo,
          fullName,
          className,
        },
      });
      result.created += 1;
    }
  }

  return result;
}
