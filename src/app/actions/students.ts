"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  canManage,
  canWrite,
  getSessionUser,
  requireSchoolUser,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  importStudents,
  parseStudentCsv,
} from "@/modules/identity/students-import";
import { resolveIssueAccess } from "@/modules/issue/access";

export type StudentState = {
  error?: string;
  ok?: boolean;
  message?: string;
  studentId?: string;
  admissionNo?: string;
  fullName?: string;
  className?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
};

const schema = z.object({
  admissionNo: z.string().min(1),
  fullName: z.string().min(1),
  className: z.string().optional(),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
  schoolId: z.string().optional(),
});

export async function addStudentAction(
  _prev: StudentState,
  formData: FormData,
): Promise<StudentState> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };

  const parsed = schema.safeParse({
    admissionNo: formData.get("admissionNo"),
    fullName: formData.get("fullName"),
    className: formData.get("className") || undefined,
    parentName: formData.get("parentName") || undefined,
    parentPhone: formData.get("parentPhone") || undefined,
    schoolId: formData.get("schoolId") || undefined,
  });
  if (!parsed.success) {
    return { error: "Admission number and full name are required" };
  }

  let schoolId: string;
  try {
    if (user.tenant === "school") {
      if (!canWrite(user.role) && !canManage(user.role)) {
        return { error: "You do not have permission to add students" };
      }
      schoolId = user.schoolId!;
    } else {
      const access = await resolveIssueAccess(user, parsed.data.schoolId);
      schoolId = access.schoolId;
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "You do not have permission to add students",
    };
  }

  const admissionNo = parsed.data.admissionNo.trim().toUpperCase();
  const fullName = parsed.data.fullName.trim();
  const className = parsed.data.className?.trim() || null;
  const parentName = parsed.data.parentName?.trim() || null;
  const parentPhone = parsed.data.parentPhone?.trim() || null;

  let studentId = "";
  try {
    const student = await prisma.student.create({
      data: {
        schoolId,
        admissionNo,
        fullName,
        className,
        parentName,
        parentPhone,
      },
    });
    studentId = student.id;
  } catch {
    return { error: "Student with this admission number already exists" };
  }

  revalidatePath("/students");
  revalidatePath("/issue");
  revalidatePath("/supplier/issue");
  return {
    ok: true,
    studentId,
    admissionNo,
    fullName,
    className,
    parentName,
    parentPhone,
    message: "Student ready for uniform issue",
  };
}

export async function importStudentsAction(
  _prev: StudentState,
  formData: FormData,
): Promise<StudentState> {
  const user = await requireSchoolUser();
  if (!canWrite(user.role) && !canManage(user.role)) {
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
