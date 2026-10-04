# sheet-packer

Pack rectangles onto fixed-size sheets using a binary-tree 2D bin-packing heuristic.

I originally built this for a production print workflow: incoming orders of different sizes were packed overnight onto printable sheets, replacing manual layout. This is the packing core, extracted as a standalone TypeScript library.

## Features

- Places items largest-first and opens a new sheet only when no existing sheet has room
- Rotates an item 90° when it only fits sideways
- Configurable padding between items
- Items larger than the sheet go on their own "oversized" sheet instead of being dropped
- Generic `data` field, so each placed rectangle carries your own payload (an order ID, an image buffer, etc.)

## Usage

```ts
import { SheetPacker } from "sheet-packer";

// A4 sheet in mm, 3 mm gap between items
const packer = new SheetPacker<string>(210, 297, 3);

packer.addAll([
  { width: 80, height: 120, data: "order-1" },
  { width: 150, height: 60, data: "order-2" },
  { width: 300, height: 100, data: "order-3" }, // larger than the sheet
]);

for (const [i, sheet] of packer.sheets.entries()) {
  console.log(`Sheet ${i + 1}`);
  for (const r of sheet.rects) {
    console.log(r.data, { x: r.x, y: r.y, w: r.width, h: r.height, rotated: r.isRotated, oversized: !!r.oversized });
  }
}
```

Each placed rectangle has `x`, `y`, `width`, `height` (after rotation), `isRotated`, `oversized` (if set), and your `data`.

## How it works

Each sheet starts as one free node. When an item is placed into a free node, that node is split into two children: the space below the item and the space to its right. To place the next item, the tree is searched depth-first for the first free node large enough. If none fits, the item is tried rotated; if that also fails, the packer moves on to the next sheet.

Sorting by the longest side first places the hardest items while the most space is available, which noticeably reduces the number of sheets.

## Development

```bash
npm install
npm test
npm run build
```

## License

MIT
