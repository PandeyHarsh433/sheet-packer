import { describe, expect, it } from "vitest";
import { Sheet, SheetPacker, type Rect } from "../src/index";

const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

describe("Sheet", () => {
  it("places the first item at the origin", () => {
    const sheet = new Sheet(100, 100);
    expect(sheet.add(40, 30, "a")).toMatchObject({ x: 0, y: 0, width: 40, height: 30, isRotated: false });
  });

  it("rotates an item that only fits sideways", () => {
    const sheet = new Sheet(100, 50);
    const rect = sheet.add(40, 90, "a");
    expect(rect).toMatchObject({ width: 90, height: 40, isRotated: true });
  });

  it("returns undefined when an item does not fit", () => {
    const sheet = new Sheet(50, 50);
    sheet.add(50, 50, "full");
    expect(sheet.add(10, 10, "b")).toBeUndefined();
  });

  it("keeps items inside the sheet and apart by the padding", () => {
    const pad = 2;
    const sheet = new Sheet(100, 100, pad);
    for (let i = 0; i < 30; i++) sheet.add(10 + (i % 5) * 3, 8 + (i % 4) * 4, i);

    for (const r of sheet.rects) {
      expect(r.x + r.width).toBeLessThanOrEqual(100);
      expect(r.y + r.height).toBeLessThanOrEqual(100);
    }
    const grown = sheet.rects.map((r) => ({ ...r, width: r.width + pad, height: r.height + pad }));
    for (let i = 0; i < grown.length; i++)
      for (let j = i + 1; j < grown.length; j++) expect(overlaps(grown[i], grown[j])).toBe(false);
  });
});

describe("SheetPacker", () => {
  it("opens a new sheet only when needed", () => {
    const packer = new SheetPacker(100, 100);
    packer.addAll([
      { width: 50, height: 50, data: 1 },
      { width: 50, height: 50, data: 2 },
      { width: 50, height: 50, data: 3 },
      { width: 50, height: 50, data: 4 },
      { width: 50, height: 50, data: 5 },
    ]);
    expect(packer.sheets).toHaveLength(2);
    expect(packer.sheets[0].rects).toHaveLength(4);
  });

  it("puts items larger than the sheet on their own oversized sheet", () => {
    const packer = new SheetPacker(100, 100);
    packer.add(150, 80, "big");
    expect(packer.sheets[0].rects[0]).toMatchObject({ oversized: true, width: 150, height: 80 });
  });

  it("does not treat an item as oversized if it fits rotated", () => {
    const packer = new SheetPacker(100, 50);
    packer.add(40, 90, "tall");
    expect(packer.sheets[0].rects[0]).toMatchObject({ isRotated: true });
    expect(packer.sheets[0].rects[0].oversized).toBeUndefined();
  });

  it("sorts items largest side first", () => {
    const sorted = SheetPacker.sortLargestFirst([
      { width: 10, height: 10 },
      { width: 5, height: 40 },
      { width: 30, height: 2 },
    ]);
    expect(sorted.map((s) => Math.max(s.width, s.height))).toEqual([40, 30, 10]);
  });
});
