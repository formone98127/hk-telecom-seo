/**
 * 下載求Plan王每一個刊登項目，逐項對比上網站。
 * 價錢以 networks 欄位為準；若為 0／空則由標題／介紹抽價。
 */
import fs from 'node:fs';
import path from 'node:path';
import type { BroadbandPlan, CarrierId, MobilePlan, NetworkType } from './types';

const SOURCE = 'https://findplanking.com';

export interface FpkListing {
  planId?: string;
  provider?: string;
  title?: string;
  intros?: Array<string | null>;
  networks?: Record<string, { price?: number | null } | null>;
  tags?: Record<string, boolean>;
  updatedAt?: string;
  sales?: { isVerified?: boolean; phone?: string; whatsapp?: string };
  type?: string;
  category?: string;
}

const PROVIDER_META: Record<string, { id: CarrierId; name: string }> = {
  cmhk: { id: 'cmhk', name: '中國移動香港' },
  '3hk': { id: '3hk', name: '3HK' },
  csl: { id: 'csl', name: 'csl.' },
  smartone: { id: 'smartone', name: 'SmarTone' },
  hkbn: { id: 'hkbn', name: '香港寬頻' },
  netvigator: { id: 'netvigator', name: '網上行' },
  hgc: { id: 'hgc', name: 'HGC' },
  gba: { id: 'gba', name: '大灣區計劃' },
  cuniq: { id: 'cuniq', name: '中國聯通' },
  imobile: { id: 'imobile', name: 'i-Mobile' },
  icable: { id: 'icable', name: '有線寬頻' },
  other: { id: 'other', name: '其他電訊商' },
};

const MOBILE_NETS: Array<{ key: string; network: NetworkType; label: string }> = [
  { key: 'fiveG', network: '5G', label: '5G' },
  { key: 'lte', network: '4.5G', label: '4.5G' },
  { key: 'fourG', network: '4G', label: '4G' },
];

const BB_NETS: Array<{ key: string; speedMbps: number; label: string }> = [
  { key: 'mb1000', speedMbps: 1000, label: '1000M' },
  { key: 'mb100', speedMbps: 100, label: '100M' },
  { key: 'fiveG', speedMbps: 5, label: '5G家居' },
];

const listingCache = new Map<string, Promise<FpkListing[]>>();
const mobilePlanCache = new Map<string, Promise<MobilePlan[]>>();
const broadbandPlanCache = new Map<string, Promise<BroadbandPlan[]>>();

function validPrice(n: unknown): number | null {
  const v = Number(n);
  return Number.isFinite(v) && v >= 30 && v <= 400 ? v : null;
}

function textOf(p: FpkListing): string {
  return [p.title, ...(p.intros || [])].filter(Boolean).join('\n');
}

function cleanLine(s: string): string {
  return s
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/[✅❌🔥💯✨🚀🎁😍🥰❤️🧡💛💚💙💜🩷💢🤩🌟⭐️⭐️⭐️⭐️⭐️⭐️]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function offerLines(p: FpkListing): string[] {
  const lines = [p.title, ...(p.intros || [])]
    .filter((x): x is string => Boolean(x && String(x).trim()))
    .map((x) => cleanLine(String(x)))
    .filter((x) => x.length >= 4);
  // 去重
  return [...new Set(lines)].slice(0, 4);
}

/** 由文案抽指定網速／網絡嘅價錢 */
function extractPriceFromText(text: string, kind: string): number | null {
  const patterns: RegExp[] = [];
  if (kind === 'mb1000' || kind === '1000M') {
    patterns.push(
      /1000\s*M(?:bps)?[^0-9$￥]{0,16}[\$￥]?\s*(\d{2,3})/i,
      /[\$￥]\s*(\d{2,3})[^0-9]{0,10}1000\s*M/i,
      /1GB[^0-9$￥]{0,12}[\$￥]?\s*(\d{2,3})/i,
      /1G[^0-9a-z$￥]{0,12}[\$￥]?\s*(\d{2,3})/i,
    );
  } else if (kind === 'mb100' || kind === '100M') {
    patterns.push(
      /100\s*M(?:bps)?[^0-9$￥]{0,16}[\$￥]?\s*(\d{2,3})/i,
      /500\s*M(?:bps)?[^0-9$￥]{0,16}[\$￥]?\s*(\d{2,3})/i,
    );
  } else if (kind === '2500M') {
    patterns.push(
      /2500\s*M(?:bps)?[^0-9$￥]{0,16}[\$￥]?\s*(\d{2,3})/i,
      /2\.?5\s*G(?:bps|B)?[^0-9$￥]{0,12}[\$￥]?\s*(\d{2,3})/i,
      /[\$￥]\s*(\d{2,3})[^0-9]{0,10}2500\s*M/i,
    );
  } else if (kind === 'fiveG' || kind === '5G') {
    patterns.push(
      /5G[^0-9$￥]{0,20}[\$￥]?\s*(\d{2,3})/i,
      /[\$￥]\s*(\d{2,3})[^0-9]{0,12}5G/i,
    );
  } else if (kind === 'lte' || kind === '4.5G') {
    patterns.push(
      /4\.5G[^0-9$￥]{0,16}[\$￥]?\s*(\d{2,3})/i,
      /LTE[^0-9$￥]{0,16}[\$￥]?\s*(\d{2,3})/i,
    );
  } else if (kind === 'fourG' || kind === '4G') {
    patterns.push(/4G[^0-9$￥.]{0,16}[\$￥]?\s*(\d{2,3})/i);
  }

  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const v = validPrice(m[1]);
      if (v) return v;
    }
  }
  return null;
}

function resolveNetworkPrice(p: FpkListing, netKey: string): number | null {
  const raw = p.networks?.[netKey]?.price;
  const direct = validPrice(raw);
  if (direct) return direct;
  // 0 / null / 無效 → 由文案補價
  return extractPriceFromText(textOf(p), netKey);
}

function guessData(text: string, network: NetworkType): { local: string; gba: string } {
  const gbAll = [...text.matchAll(/(\d{2,3})\s*GB/gi)].map((m) => m[1]);
  const gbaMatch = text.match(/(\d{1,2})\s*GB[^0-9\n]{0,12}(中澳|大灣區|內地|大陸|澳門)/i);
  const localMatch = text.match(/(\d{2,3})\s*GB[^0-9\n]{0,12}(香港|本地|全速)?/i);

  let local = '見刊登詳情';
  if (localMatch) local = `約 ${localMatch[1]}GB（刊登所述）`;
  else if (gbAll[0]) local = `約 ${gbAll[0]}GB（刊登所述）`;
  else if (network === '5G') local = '5G 數據詳見刊登';

  let gba = '見刊登詳情';
  if (gbaMatch) gba = `約 ${gbaMatch[1]}GB 中澳／大灣區（刊登所述）`;
  else if (/中澳|大灣區|內地|大陸|一卡兩號|中港/.test(text)) gba = '含／可配中澳或大灣區（見刊登）';
  else if (network !== '5G') gba = '通常不包（見刊登）';

  return { local, gba };
}

function siblingMobilePrices(p: FpkListing): string {
  const parts: string[] = [];
  for (const net of MOBILE_NETS) {
    const price = resolveNetworkPrice(p, net.key);
    if (price) parts.push(`${net.label} $${price}`);
  }
  return parts.join('｜');
}

function siblingBroadbandPrices(p: FpkListing): string {
  const parts: string[] = [];
  for (const net of BB_NETS) {
    const price = resolveNetworkPrice(p, net.key);
    if (price) parts.push(`${net.label} $${price}`);
  }
  const p2500 = extractPriceFromText(textOf(p), '2500M');
  if (p2500) parts.push(`2500M $${p2500}`);
  return parts.join('｜');
}

function tagHighlights(p: FpkListing): string[] {
  const tags: string[] = [];
  if (p.tags?.freeAdminFee) tags.push('免行政費');
  if (p.tags?.transfer) tags.push('轉台');
  if (p.tags?.renewContract) tags.push('續約');
  if (p.tags?.freeInstallFee) tags.push('免安裝費');
  if (p.sales?.isVerified) tags.push('已認證');
  return tags;
}

function saveSnapshot(page: string, data: FpkListing[]) {
  try {
    const dir = path.resolve('data/findplanking');
    fs.mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().slice(0, 10);
    fs.writeFileSync(
      path.join(dir, `${page}.json`),
      JSON.stringify(
        {
          fetchedAt: new Date().toISOString(),
          source: `${SOURCE}/${page}`,
          count: data.length,
          data,
        },
        null,
        2,
      ),
      'utf8',
    );
    fs.writeFileSync(
      path.join(dir, `${page}-${stamp}.json`),
      JSON.stringify({ fetchedAt: new Date().toISOString(), count: data.length, data }, null, 2),
      'utf8',
    );
  } catch (err) {
    console.warn('[findplanking] snapshot write skipped:', err);
  }
}

async function fetchListings(page: 'mobile' | 'broadband'): Promise<FpkListing[]> {
  const cached = listingCache.get(page);
  if (cached) return cached;

  const pending = (async () => {
    const res = await fetch(`${SOURCE}/${page}`, {
      headers: {
        Accept: 'text/html',
        'User-Agent': 'hk-telecom-seo-bot/1.0 (listing-sync; compare-all)',
      },
    });
    if (!res.ok) throw new Error(`[findplanking] HTTP ${res.status} /${page}`);
    const html = await res.text();
    const m = html.match(
      /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
    );
    if (!m) throw new Error(`[findplanking] 找不到 __NEXT_DATA__ /${page}`);
    const json = JSON.parse(m[1]) as {
      props?: { pageProps?: { data?: FpkListing[] } };
    };
    const data = json.props?.pageProps?.data || [];
    saveSnapshot(page, data);
    return data;
  })();

  listingCache.set(page, pending);
  try {
    return await pending;
  } catch (err) {
    listingCache.delete(page);
    throw err;
  }
}

/** 每個刊登 × 每個有效網絡價 = 一條對比計劃 */
export function listingsToMobilePlans(listings: FpkListing[]): MobilePlan[] {
  const plans: MobilePlan[] = [];
  let sort = 1;

  const sorted = [...listings].sort((a, b) => {
    const av = a.sales?.isVerified ? 0 : 1;
    const bv = b.sales?.isVerified ? 0 : 1;
    if (av !== bv) return av - bv;
    return String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
  });

  for (const listing of sorted) {
    const providerKey = listing.provider || 'other';
    const meta = PROVIDER_META[providerKey] || PROVIDER_META.other;
    const text = textOf(listing);
    const offers = offerLines(listing);
    const tags = tagHighlights(listing);
    const siblings = siblingMobilePrices(listing);
    const updated = listing.updatedAt?.slice(0, 10) || '';

    for (const net of MOBILE_NETS) {
      const price = resolveNetworkPrice(listing, net.key);
      if (!price) continue;

      const { local, gba } = guessData(text, net.network);
      const student = /學生|student|大專|18-29|18–29|青年/i.test(text);
      const isCmhkValue =
        meta.id === 'cmhk' && net.network === '5G' && price >= 68 && price <= 129;

      plans.push({
        id: `fpk-m-${listing.planId || 'x'}-${net.key}-${price}`,
        carrier: meta.id,
        carrierName: meta.name,
        planName: `${meta.name} ${net.label} $${price}`,
        network: net.network,
        monthlyFee: price,
        dataLocal: local,
        dataGba: gba,
        voiceMins: '見刊登詳情',
        contractMonths: 24,
        highlights: [...tags, ...offers.slice(0, 2)].filter(Boolean).join('｜'),
        isRecommended: Boolean(isCmhkValue && listing.sales?.isVerified),
        isStudent: student,
        isGba: net.network === '5G' || /中澳|大灣區|內地|大陸|一卡兩號/.test(text),
        isCheap4g: net.network !== '5G',
        hiddenPerk: [
          siblings ? `同刊登其他價：${siblings}` : null,
          updated ? `求Plan王更新：${updated}` : null,
          `來源刊登 #${listing.planId || '—'}`,
        ]
          .filter(Boolean)
          .join('｜'),
        sortOrder: sort++,
        sourceId: String(listing.planId || ''),
        sourceUpdatedAt: updated,
        isVerified: Boolean(listing.sales?.isVerified),
        siblingPrices: siblings,
      });
    }
  }

  return plans;
}

export function listingsToBroadbandPlans(listings: FpkListing[]): BroadbandPlan[] {
  const plans: BroadbandPlan[] = [];
  let sort = 1;

  const sorted = [...listings].sort((a, b) => {
    const av = a.sales?.isVerified ? 0 : 1;
    const bv = b.sales?.isVerified ? 0 : 1;
    if (av !== bv) return av - bv;
    return String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
  });

  for (const listing of sorted) {
    const providerKey = listing.provider || 'other';
    const meta = PROVIDER_META[providerKey] || PROVIDER_META.other;
    const text = textOf(listing);
    const offers = offerLines(listing);
    const tags = tagHighlights(listing);
    const siblings = siblingBroadbandPrices(listing);
    const updated = listing.updatedAt?.slice(0, 10) || '';
    const housing = /公.?屋|居屋/.test(text)
      ? '公屋,居屋,私樓'
      : /村屋|唐樓|單棟/.test(text)
        ? '私樓,村屋／唐樓'
        : '公屋,居屋,私樓';

    for (const net of BB_NETS) {
      const price = resolveNetworkPrice(listing, net.key);
      if (!price) continue;

      const isCmhkFiber =
        meta.id === 'cmhk' && net.speedMbps === 1000 && price >= 60 && price <= 100;

      plans.push({
        id: `fpk-b-${listing.planId || 'x'}-${net.key}-${price}`,
        carrier: meta.id,
        carrierName: meta.name,
        planName: `${meta.name} ${net.label} $${price}`,
        speedMbps: net.speedMbps,
        monthlyFee: price,
        contractMonths: 24,
        housingTypes: housing,
        highlights: [...tags, ...offers.slice(0, 2)].filter(Boolean).join('｜'),
        isRecommended: Boolean(isCmhkFiber && listing.sales?.isVerified),
        installNote:
          net.speedMbps === 5
            ? '5G／無線家居寬頻，覆蓋視訊號（求Plan王刊登）'
            : '拉線視屋苑而定（求Plan王刊登）',
        sortOrder: sort++,
        sourceId: String(listing.planId || ''),
        sourceUpdatedAt: updated,
        isVerified: Boolean(listing.sales?.isVerified),
        siblingPrices: siblings,
      });
    }

    // 額外：文案有 2500M 價但 networks 無對應欄
    const p2500 = extractPriceFromText(text, '2500M');
    if (p2500) {
      plans.push({
        id: `fpk-b-${listing.planId || 'x'}-mb2500-${p2500}`,
        carrier: meta.id,
        carrierName: meta.name,
        planName: `${meta.name} 2500M $${p2500}`,
        speedMbps: 2500,
        monthlyFee: p2500,
        contractMonths: 24,
        housingTypes: housing,
        highlights: [...tags, ...offers.slice(0, 2)].filter(Boolean).join('｜'),
        isRecommended: meta.id === 'cmhk' && Boolean(listing.sales?.isVerified),
        installNote: '需確認大廈支援 2500M（求Plan王刊登）',
        sortOrder: sort++,
        sourceId: String(listing.planId || ''),
        sourceUpdatedAt: updated,
        isVerified: Boolean(listing.sales?.isVerified),
        siblingPrices: siblings,
      });
    }
  }

  return plans;
}

export async function getFindplankingMobilePlans(): Promise<MobilePlan[]> {
  const hit = mobilePlanCache.get('all');
  if (hit) return hit;

  const pending = (async () => {
    const listings = await fetchListings('mobile');
    const plans = listingsToMobilePlans(listings);
    if (!plans.length) throw new Error('[findplanking] 手機刊登無有效價錢');
    console.log(
      `[findplanking] mobile listings=${listings.length} → compare rows=${plans.length}`,
    );
    return plans;
  })();

  mobilePlanCache.set('all', pending);
  try {
    return await pending;
  } catch (err) {
    mobilePlanCache.delete('all');
    throw err;
  }
}

export async function getFindplankingBroadbandPlans(): Promise<BroadbandPlan[]> {
  const hit = broadbandPlanCache.get('all');
  if (hit) return hit;

  const pending = (async () => {
    const listings = await fetchListings('broadband');
    const plans = listingsToBroadbandPlans(listings);
    if (!plans.length) throw new Error('[findplanking] 寬頻刊登無有效價錢');
    console.log(
      `[findplanking] broadband listings=${listings.length} → compare rows=${plans.length}`,
    );
    return plans;
  })();

  broadbandPlanCache.set('all', pending);
  try {
    return await pending;
  } catch (err) {
    broadbandPlanCache.delete('all');
    throw err;
  }
}
