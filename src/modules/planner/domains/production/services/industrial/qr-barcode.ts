/**
 * SVG determinístico de QR/Barcode (pseudo — apenas preview em tela).
 */
function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pseudoQrMatrix(payload: string, size = 21): boolean[][] {
  const m: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const drawFinder = (cx: number, cy: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const outer = x === 0 || y === 0 || x === 6 || y === 6;
        const inner = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        m[cy + y][cx + x] = outer || inner;
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);
  let h = hashString(payload);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inFinder = (x < 8 && y < 8) || (x >= size - 8 && y < 8) || (x < 8 && y >= size - 8);
      if (inFinder) continue;
      h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
      m[y][x] = (h & 1) === 1;
    }
  }
  return m;
}

export function barcodeBars(payload: string, count = 42): number[] {
  const bars: number[] = [];
  let h = hashString(payload);
  for (let i = 0; i < count; i++) {
    h = (Math.imul(h, 22695477) + 1) >>> 0;
    bars.push(1 + (h % 3));
  }
  return bars;
}
