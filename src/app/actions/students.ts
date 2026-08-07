"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { canManage, requireSchoolUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  importStudents,
  parseStudentCsv,
} from "@/modules/identity/students-import";

export type StudentState = {
  error?: string;
  ok?: boolean;
  message?: string;
};

const schema = z.object({
  admissionNo: z.string().min(1),
  fullName: z.string().min(1),
  className: z.string().optional(),
});

export async function addStudentAction(
  _prev: StudentState,
  formData: FormData,
): Promise<StudentState> {
  const user = await requireSchoolUser();
  if (!canManage(user.role) && user.role !== "storekeeper") {
    return { error: "You do not have permission to add students" };
  }

  const parsed = schema.safeParse({
    admissionNo: formData.get("admissionNo"),
    fullName: formData.get("fullName"),
    className: formData.get("className") || undefined,
  });
  if (!parsed.success) {
    return { error: "Admission number and full name are required" };
  }

  try {
    await prisma.student.create({
      data: {
        schoolId: user.schoolId,
        admissionNo: parsed.data.admissionNo.trim().toUpperCase(),
        fullName: parsed.data.fullName.trim(),
        className: parsed.data.className?.trim() || null,
      },
    });
  } catch {
    return { error: "Student with this admission number already exists" };
  }

  revalidatePath("/students");
  revalidatePath("/issue");
  return { ok: true };
}

export async function importStudentsAction(
  _prev: StudentState,
  formData: FormData,
): Promise<StudentState> {
  const user = await requireSchoolUser();
  if (!canManage(user.role) && user.role !== "storekeeper") {
    return { error: "You do not have permission to import students" };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a CSV file to import" };
  }
  if (file.size > 1_000_000) {
    return { error: "CSV file must be under 1 MB" };
  }

  try {
    const text = await file.text();
    const rows = parseStudentCsv(text);
    const result = await importStudents({
      schoolId: user.schoolId,
      rows,
    });

    revalidatePath("/students");
    revalidatePath("/issue");

    const errorHint =
      result.errors.length > 0
        ? ` · ${result.errors.slice(0, 3).join("; ")}`
        : "";

    return {
      ok: true,
      message: `Imported ${result.created} new, updated ${result.updated}, skipped ${result.skipped}${errorHint}`,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not import CSV",
    };
  }
}
