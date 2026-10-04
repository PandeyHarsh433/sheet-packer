export interface Rect<T = unknown> {
  x: number;
  y: number;
  width: number;
  height: number;
  isRotated: boolean;
  oversized?: boolean;
  data: T;
}

export interface Item<T = unknown> {
  width: number;
  height: number;
  data: T;
}

interface Node {
  x: number;
  y: number;
  width: number;
  height: number;
  children?: Node[];
}

/**
 * A single sheet packed with a binary-tree guillotine heuristic.
 * Each placed item splits its free node into a "below" and a "right" child.
 */
export class Sheet<T = unknown> {
  width = 0;
  height = 0;
  readonly rects: Rect<T>[] = [];
  private readonly root: Node;

  constructor(
    readonly maxWidth: number,
    readonly maxHeight: number,
    readonly padding = 0
  ) {
    // Root is enlarged by one padding so items can sit flush with the far edges.
    this.root = { x: 0, y: 0, width: maxWidth + padding, height: maxHeight + padding };
  }

  /** Places an item, rotating it 90° if it only fits that way. Returns undefined if it doesn't fit. */
  add(width: number, height: number, data: T): Rect<T> | undefined {
    const p = this.padding;
    let isRotated = false;
    let node = this.findNode(this.root, width + p, height + p);

    if (!node) {
      node = this.findNode(this.root, height + p, width + p);
      if (!node) return undefined;
      [width, height] = [height, width];
      isRotated = true;
    }

    node.children = this.split(node, width + p, height + p);
    this.width = Math.max(this.width, node.x + width);
    this.height = Math.max(this.height, node.y + height);

    const rect: Rect<T> = { x: node.x, y: node.y, width, height, isRotated, data };
    this.rects.push(rect);
    return rect;
  }

  private findNode(node: Node, width: number, height: number): Node | undefined {
    if (node.children) {
      for (const child of node.children) {
        const found = this.findNode(child, width, height);
        if (found) return found;
      }
      return undefined;
    }
    return width <= node.width && height <= node.height ? node : undefined;
  }

  private split(node: Node, width: number, height: number): Node[] {
    const children: Node[] = [];

    if (node.height - height > 0 && node.x < this.maxWidth) {
      children.push({ x: node.x, y: node.y + height, width: node.width, height: node.height - height });
    }
    if (node.width - width > 0 && node.y < this.maxHeight) {
      children.push({ x: node.x + width, y: node.y, width: node.width - width, height });
    }

    return children;
  }
}

/** A sheet holding one item larger than the sheet size, so it can be handled separately. */
export class OversizedSheet<T = unknown> {
  readonly rects: Rect<T>[];

  constructor(readonly width: number, readonly height: number, data: T) {
    this.rects = [{ x: 0, y: 0, width, height, data, oversized: true, isRotated: false }];
  }

  add(): undefined {
    return undefined;
  }
}

/**
 * Packs items onto as few fixed-size sheets as possible.
 * Items are placed largest-first; a new sheet is opened only when no existing sheet has room.
 */
export class SheetPacker<T = unknown> {
  readonly sheets: (Sheet<T> | OversizedSheet<T>)[] = [];

  constructor(
    readonly maxWidth: number,
    readonly maxHeight: number,
    readonly padding = 0
  ) {}

  add(width: number, height: number, data: T): void {
    const fits = (w: number, h: number) => w <= this.maxWidth && h <= this.maxHeight;

    if (!fits(width, height) && !fits(height, width)) {
      this.sheets.push(new OversizedSheet(width, height, data));
      return;
    }

    const placed = this.sheets.some((s) => s.add(width, height, data) !== undefined);
    if (!placed) {
      const sheet = new Sheet<T>(this.maxWidth, this.maxHeight, this.padding);
      sheet.add(width, height, data);
      this.sheets.push(sheet);
    }
  }

  addAll(items: Item<T>[]): void {
    SheetPacker.sortLargestFirst(items).forEach((i) => this.add(i.width, i.height, i.data));
  }

  static sortLargestFirst<I extends { width: number; height: number }>(items: I[]): I[] {
    return items
      .slice()
      .sort((a, b) => Math.max(b.width, b.height) - Math.max(a.width, a.height));
  }
}

export default SheetPacker;
