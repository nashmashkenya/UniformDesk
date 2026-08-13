import { describe, expect, it } from "vitest";
import {
  buildStandardUniformRows,
  kesFromCents,
  leftoverAlreadyPaidOnSet,
  selectedGiveNowCents,
} from "@/modules/issue/uniform-set";

const shirt = {
  id: "shirt",
  name: "White Shirt",
  sizes: [{ sizeLabel: "M" }, { sizeLabel: "L" }],
  unitPriceCents: 10000,
};
const socks = {
  id: "socks",
  name: "Navy Socks",
  sizes: [{ sizeLabel: "M" }],
  unitPriceCents: 25000,
};

describe("standard student uniform card", () => {
  it("new kit issue lists every item as not given and prices Give now", () => {
    const rows = buildStandardUniformRows({
      kit: {
        lines: [
          { itemId: shirt.id, qtyDefault: 1, item: shirt },
          { itemId: socks.id, qtyDefault: 2, item: socks },
        ],
      },
      items: [shirt, socks],
      lines: [
        { itemId: shirt.id, sizeLabel: "M", qtyRequested: 1, fulfil: true },
        { itemId: socks.id, sizeLabel: "M", qtyRequested: 2, fulfil: false },
      ],
      stockFor: () => 10,
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      itemName: "White Shirt",
      qtyNeeded: 1,
      qtyReceived: 0,
      qtyLeft: 1,
      fulfil: true,
      unitPriceCents: 10000,
    });
    expect(rows[1]).toMatchObject({
      itemName: "Navy Socks",
      qtyLeft: 2,
      fulfil: false,
      unitPriceCents: 25000,
    });

    expect(
      selectedGiveNowCents(
        [
          { itemId: shirt.id, qtyRequested: 1, fulfil: true },
          { itemId: socks.id, qtyRequested: 2, fulfil: false },
        ],
        [shirt, socks],
      ),
    ).toBe(10000);
    expect(kesFromCents(10000)).toBe(100);

    const afterSelectSocks = selectedGiveNowCents(
      [
        { itemId: shirt.id, qtyRequested: 1, fulfil: true },
        { itemId: socks.id, qtyRequested: 2, fulfil: true },
      ],
      [shirt, socks],
    );
    expect(afterSelectSocks).toBe(10000 + 50000);
    expect(kesFromCents(afterSelectSocks)).toBe(600);
  });

  it("finish issue shows given vs leftover on the same card", () => {
    const rows = buildStandardUniformRows({
      uniformSet: {
        lines: [
          {
            itemId: shirt.id,
            itemName: shirt.name,
            qtyNeeded: 1,
            qtyReceived: 1,
            qtyLeft: 0,
            sizeLabel: "M",
            unitPriceCents: 10000,
            moneyStatus: "paid",
            holdReason: null,
          },
          {
            itemId: socks.id,
            itemName: socks.name,
            qtyNeeded: 2,
            qtyReceived: 0,
            qtyLeft: 2,
            sizeLabel: "M",
            unitPriceCents: 25000,
            moneyStatus: "paid",
            holdReason: "held_by_desk",
          },
        ],
      },
      items: [shirt, socks],
      lines: [
        { itemId: socks.id, sizeLabel: "M", qtyRequested: 2, fulfil: true },
      ],
      stockFor: () => 4,
    });

    const given = rows.find((r) => r.itemId === shirt.id);
    const left = rows.find((r) => r.itemId === socks.id);
    expect(given?.qtyLeft).toBe(0);
    expect(given?.fulfil).toBe(false);
    expect(left?.qtyLeft).toBe(2);
    expect(left?.fulfil).toBe(true);
    expect(left?.unitPriceCents).toBe(25000);
    expect(leftoverAlreadyPaidOnSet(rows)).toBe(true);
    expect(
      selectedGiveNowCents(
        [{ itemId: socks.id, qtyRequested: 2, fulfil: true }],
        [socks],
      ),
    ).toBe(50000);
  });
});
