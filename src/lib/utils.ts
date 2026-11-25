/** 產生「2026年11月」形式的最新月份標籤 */
export function getCurrentMonthLabel(date = new Date()): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

export function getCurrentYearMonth(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function parseBool(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  const s = String(value ?? '')
    .trim()
    .toLowerCase();
  return s === 'true' || s === '1' || s === 'yes' || s === 'y' || s === '是';
}

export function parseNumber(value: unknown, fallback = 0): number {
  const n = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : fallback;
}

export function splitList(value: unknown): string[] {
  return String(value ?? '')
    .split(/[,|，、]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function absoluteUrl(path: string, site = 'https://example.com'): string {
  try {
    return new URL(path, site).toString();
  } catch {
    return path;
  }
}
