import { prisma } from "@/lib/db";

export async function listKits(schoolId: string) {
  return prisma.kit.findMany({
    where: { schoolId },
    include: {
      lines: {
        include: { item: true },
        orderBy: { item: { name: "asc" } },
      },
    },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
}

export async function createKit(input: {
  schoolId: string;
  name: string;
  academicYear: string;
  lines: { itemId: string; qtyDefault: number }[];
}) {
  const name = input.name.trim();
  const academicYear = input.academicYear.trim();
  if (!name || !academicYear) {
    throw new Error("Kit name and academic year are required");
  }
  if (!input.lines.length) {
    throw new Error("Add at least one kit line");
  }

  for (const line of input.lines) {
    if (line.qtyDefault <= 0) {
      throw new Error("Kit line quantity must be greater than zero");
    }
    const item = await prisma.item.findFirst({
      where: {
        id: line.itemId,
        schoolId: input.schoolId,
        active: true,
      },
    });
    if (!item) throw new Error("One or more kit items were not found");
  }

  const uniqueIds = new Set(input.lines.map((l) => l.itemId));
  if (uniqueIds.size !== input.lines.length) {
    throw new Error("Each item can only appear once in a kit");
  }

  return prisma.kit.create({
    data: {
      schoolId: input.schoolId,
      name,
      academicYear,
      lines: {
        create: input.lines.map((line) => ({
          itemId: line.itemId,
          qtyDefault: line.qtyDefault,
        })),
      },
    },
    include: {
      lines: { include: { item: true } },
    },
  });
}

export async function setKitActive(input: {
  schoolId: string;
  kitId: string;
  active: boolean;
}) {
  const kit = await prisma.kit.findFirst({
    where: { id: input.kitId, schoolId: input.schoolId },
  });
  if (!kit) throw new Error("Kit not found");

  return prisma.kit.update({
    where: { id: kit.id },
    data: { active: input.active },
  });
}

export async function updateKit(input: {
  schoolId: string;
  kitId: string;
  name: string;
  academicYear: string;
  lines: { itemId: string; qtyDefault: number }[];
}) {
  const kit = await prisma.kit.findFirst({
    where: { id: input.kitId, schoolId: input.schoolId },
  });
  if (!kit) throw new Error("Kit not found");

  const name = input.name.trim();
  const academicYear = input.academicYear.trim();
  if (!name || !academicYear) {
    throw new Error("Kit name and academic year are required");
  }
  if (!input.lines.length) {
    throw new Error("Add at least one kit line");
  }

  for (const line of input.lines) {
    if (line.qtyDefault <= 0) {
      throw new Error("Kit line quantity must be greater than zero");
    }
    const item = await prisma.item.findFirst({
      where: {
        id: line.itemId,
        schoolId: input.schoolId,
      },
    });
    if (!item) throw new Error("One or more kit items were not found");
    if (!item.active) {
      throw new Error(
        `Activate item ${item.sku} before using it in this kit`,
      );
    }
  }

  const uniqueIds = new Set(input.lines.map((l) => l.itemId));
  if (uniqueIds.size !== input.lines.length) {
    throw new Error("Each item can only appear once in a kit");
  }

  return prisma.$transaction(async (tx) => {
    await tx.kitLine.deleteMany({ where: { kitId: kit.id } });
    return tx.kit.update({
      where: { id: kit.id },
      data: {
        name,
        academicYear,
        lines: {
          create: input.lines.map((line) => ({
            itemId: line.itemId,
            qtyDefault: line.qtyDefault,
          })),
        },
      },
      include: {
        lines: { include: { item: true }, orderBy: { item: { name: "asc" } } },
      },
    });
  });
}
