/** Client-safe totals and the standard student uniform card rows. */

export type StandardUniformRow = {
  itemId: string;
  itemName: string;
  qtyNeeded: number;
  qtyReceived: number;
  qtyLeft: number;
  sizeLabel: string;
  sizes: { sizeLabel: string }[];
  unitPriceCents: number;
  fulfil: boolean;
  onHand: number;
  moneyStatus?: string | null;
  holdReason?: string | null;
};

export function selectedGiveNowCents(
  lines: { itemId: string; qtyRequested: number; fulfil: boolean }[],
  items: { id: string; unitPriceCents?: number }[],
) {
  return lines
    .filter((l) => l.fulfil)
    .reduce((sum, l) => {
      const item = items.find((i) => i.id === l.itemId);
      return sum + (item?.unitPriceCents ?? 0) * l.qtyRequested;
    }, 0);
}

export function kesFromCents(cents: number) {
  return Math.round(cents / 100);
}

export function leftoverAlreadyPaidOnSet(
  lines:
    | {
        qtyLeft: number;
        moneyStatus?: string | null;
      }[]
    | undefined,
) {
  return Boolean(
    lines?.some(
      (l) =>
        l.qtyLeft > 0 &&
        (l.moneyStatus === "paid" ||
          l.moneyStatus === "deposit" ||
          l.moneyStatus === "waived"),
    ),
  );
}

/** Same given / not-given card for a new kit issue and for Finish. */
export function buildStandardUniformRows({
  uniformSet,
  kit,
  items,
  lines,
  stockFor,
}: {
  uniformSet?: {
    lines: {
      itemId: string;
      itemName: string;
      qtyNeeded: number;
      qtyReceived: number;
      qtyLeft: number;
      sizeLabel: string | null;
      unitPriceCents: number;
      moneyStatus?: string | null;
      holdReason?: string | null;
    }[];
  } | null;
  kit?: {
    lines: {
      itemId: string;
      qtyDefault: number;
      item: {
        name: string;
        sizes: { sizeLabel: string }[];
        unitPriceCents: number;
      };
    }[];
  } | null;
  items: {
    id: string;
    sizes: { sizeLabel: string }[];
    unitPriceCents: number;
  }[];
  lines: {
    itemId: string;
    sizeLabel: string;
    qtyRequested: number;
    fulfil: boolean;
  }[];
  stockFor: (itemId: string, sizeLabel: string) => number;
}): StandardUniformRow[] {
  const working = new Map(lines.map((l) => [l.itemId, l]));

  if (uniformSet?.lines.length) {
    return uniformSet.lines.map((l) => {
      const item = items.find((i) => i.id === l.itemId);
      const w = working.get(l.itemId);
      const sizeLabel =
        w?.sizeLabel || l.sizeLabel || item?.sizes[0]?.sizeLabel || "M";
      return {
        itemId: l.itemId,
        itemName: l.itemName,
        qtyNeeded: l.qtyNeeded,
        qtyReceived: l.qtyReceived,
        qtyLeft: l.qtyLeft,
        sizeLabel,
        sizes: item?.sizes ?? [],
        unitPriceCents: l.unitPriceCents || item?.unitPriceCents || 0,
        fulfil: l.qtyLeft > 0 ? (w?.fulfil ?? false) : false,
        onHand: stockFor(l.itemId, sizeLabel),
        moneyStatus: l.moneyStatus,
        holdReason: l.holdReason,
      };
    });
  }

  if (kit?.lines.length) {
    return kit.lines.map((kl) => {
      const w = working.get(kl.itemId);
      const sizeLabel =
        w?.sizeLabel || kl.item.sizes[0]?.sizeLabel || "M";
      const qtyNeeded = kl.qtyDefault;
      const qtyLeft = w?.qtyRequested ?? qtyNeeded;
      return {
        itemId: kl.itemId,
        itemName: kl.item.name,
        qtyNeeded,
        qtyReceived: 0,
        qtyLeft,
        sizeLabel,
        sizes: kl.item.sizes,
        unitPriceCents: kl.item.unitPriceCents,
        fulfil: w?.fulfil ?? false,
        onHand: stockFor(kl.itemId, sizeLabel),
      };
    });
  }

  return [];
}
