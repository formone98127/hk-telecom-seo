#!/usr/bin/env node
/**
 * 每週從 findplanking.com（求Plan王）抓取市況並輸出總結。
 * 用法：node scripts/summarize-findplanking.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const PROVIDERS = {
  cmhk: '中國移動香港 CMHK',
  '3hk': '3HK',
  csl: 'csl.',
  smartone: 'SmarTone',
  hkbn: '香港寬頻 HKBN',
  netvigator: '網上行 Netvigator',
  hgc: 'HGC',
  gba: '大灣區相關',
};

const NET_LABEL = {
  fiveG: '5G',
  lte: '4.5G／LTE',
  fourG: '4G',
  mb1000: '1000M',
  mb100: '100M／較低速',
};

async function fetchPlans(page) {
  const res = await fetch(`https://findplanking.com/${page}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${page}`);
  const html = await res.text();
  const m = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  );
  if (!m) throw new Error(`找不到資料：${page}`);
  const json = JSON.parse(m[1]);
  return json.props?.pageProps?.data || [];
}

function networkFees(networks) {
  if (!networks || typeof networks !== 'object') return [];
  return Object.entries(networks)
    .map(([key, v]) => ({ key, price: Number(v?.price) }))
    .filter((x) => Number.isFinite(x.price) && x.price >= 30 && x.price <= 400);
}

function stats(prices) {
  const sorted = [...prices].sort((a, b) => a - b);
  const freq = {};
  for (const p of sorted) freq[p] = (freq[p] || 0) + 1;
  const mode = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
  return {
    min: sorted[0],
    med: sorted[Math.floor(sorted.length / 2)],
    max: sorted[sorted.length - 1],
    mode: mode ? Number(mode[0]) : null,
    modeCount: mode ? Number(mode[1]) : 0,
  };
}

function summarize(plans) {
  const by = {};
  for (const p of plans) {
    const prov = p.provider || 'unknown';
    if (!by[prov]) by[prov] = { count: 0, byNet: {} };
    by[prov].count++;
    for (const n of networkFees(p.networks)) {
      if (!by[prov].byNet[n.key]) by[prov].byNet[n.key] = [];
      by[prov].byNet[n.key].push(n.price);
    }
  }
  return by;
}

function renderSection(title, by) {
  const lines = [`## ${title}`, ''];
  const ordered = Object.entries(by).sort((a, b) => b[1].count - a[1].count);
  for (const [prov, info] of ordered) {
    lines.push(`### ${PROVIDERS[prov] || prov}（${info.count} 則）`);
    for (const [net, prices] of Object.entries(info.byNet)) {
      const s = stats(prices);
      lines.push(
        `- **${NET_LABEL[net] || net}**：常見 $${s.mode}｜最低 $${s.min}｜中位 $${s.med}｜最高 $${s.max}`,
      );
    }
    lines.push('');
  }
  return lines.join('\n');
}

const now = new Date();
const stamp = now.toISOString().slice(0, 10);
const mobile = await fetchPlans('mobile');
const broadband = await fetchPlans('broadband');

const md = [
  `# 求Plan王市況總結｜${stamp}`,
  '',
  `來源：[findplanking.com](https://findplanking.com/)（僅作市場參考，唔會原樣抄寫對方文案）`,
  '',
  `手機刊登：**${mobile.length}** 則｜寬頻刊登：**${broadband.length}** 則`,
  '',
  renderSection('手機月費', summarize(mobile)),
  renderSection('家居寬頻', summarize(broadband)),
  '## 我哋網站可跟嘅參考價（常見價為主）',
  '',
  '| 類別 | 建議參考 |',
  '|---|---|',
  '| CMHK 5G | 約 $98（熱賣常見） |',
  '| 3HK 5G | 約 $88 |',
  '| csl. 5G | 約 $98 |',
  '| SmarTone 5G | 約 $119–$149 |',
  '| 平價 4.5G／4G | 約 $38–$68 |',
  '| CMHK 1000M 寬頻 | 約 $78 |',
  '| HKBN 1000M | 約 $98（快閃可低至 $62） |',
  '| 網上行 1000M | 約 $108 |',
  '| HGC 1000M | 約 $75（公居屋快閃） |',
  '| 2500M | 網上行約 $148–$168；HKBN 約 $129–$149 |',
  '',
].join('\n');

const outDir = path.resolve('data/weekly');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `${stamp}.md`);
fs.writeFileSync(outFile, md, 'utf8');
console.log(md);
console.log(`\n已儲存：${outFile}`);
