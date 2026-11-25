/** 產生帶有 GitHub Pages base 路徑嘅站內連結 */
export function withBase(path = '/'): string {
  const rawBase = import.meta.env.BASE_URL || '/';
  const base = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

  let p = path || '/';
  if (!p.startsWith('/')) p = `/${p}`;

  // 避免重複加上 base（例如 pathname 已包含）
  if (base && (p === base || p.startsWith(`${base}/`))) {
    return p.endsWith('/') ? p : `${p}/`;
  }

  if (p === '/') return base ? `${base}/` : '/';
  return `${base}${p.endsWith('/') ? p : `${p}/`}`;
}
