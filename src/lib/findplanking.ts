/**
 * 以「求Plan王」findplanking.com 市況價作為計劃基礎。
 * Build 時抓取流動數據／家居寬頻刊登，聚合成我哋站內比較用計劃
 *（用常見價／熱賣檔，唔會原樣抄寫對方銷售文案）。
 */
import type { BroadbandPlan, CarrierId, MobilePlan, NetworkType } from './types';

const SOURCE = 'https://findplanking.com';

interface FpkListing {
  planId?: string;
  provider?: string;
  title?: string;
  intros?: Array<string | null>;
  networks?: Record<string, { price?: number | null } | null>;
  tags?: Record<string, boolean>;
  updatedAt?: string;
  sales?: { isVerified?: boolean };
}

const PROVIDER_META: Record<
  string,
  { id: CarrierId; name: string; mobile?: boolean; broadband?: boolean }
> = {
  cmhk: { id: 'cmhk', name: '中國移動香港', mobile: true, broadband: true },
  '3hk': { id: '3hk', name: '3HK', mobile: true, broadband: true },
  csl: { id: 'csl', name: 'csl.', mobile: true },
  smartone: { id: 'smartone', name: 'SmarTone', mobile: true, broadband: true },
  hkbn: { id: 'hkbn', name: '香港寬頻', mobile: true, broadband: true },
  netvigator: { id: 'netvigator', name: '網上行', broadband: true },
  hgc: { id: 'hgc', name: 'HGC', broadband: true },
};

const MOBILE_NET: Record<string, NetworkType> = {
  fiveG: '5G',
  lte: '4.5G',
  fourG: '4G',
};

const listingCache = new Map<string, Promise<FpkListing[]>>();

async function fetchListings(page: 'mobile' | 'broadband'): Promise<FpkListing[]> {
  const cached = listingCache.get(page);
  if (cached) return cached;

  const pending = (async () => {
    const res = await fetch(`${SOURCE}/${page}`, {
      headers: {
        Accept: 'text/html',
        'User-Agent': 'hk-telecom-seo-bot/1.0 (price-research; weekly-build)',
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
    return json.props?.pageProps?.data || [];
  })();

  listingCache.set(page, pending);
  try {
    return await pending;
  } catch (err) {
    listingCache.delete(page);
    throw err;
  }
}

const mobilePlanCache = new Map<string, Promise<MobilePlan[]>>();
const broadbandPlanCache = new Map<string, Promise<BroadbandPlan[]>>();

function textOf(p: FpkListing): string {
  return [p.title, ...(p.intros || [])].filter(Boolean).join(' ');
}

function priceOf(p: FpkListing, netKey: string): number | null {
  const n = Number(p.networks?.[netKey]?.price);
  return Number.isFinite(n) && n >= 30 && n <= 400 ? n : null;
}

function topPrices(prices: number[], limit = 3): { price: number; count: number }[] {
  const freq: Record<number, number> = {};
  for (const p of prices) freq[p] = (freq[p] || 0) + 1;
  return Object.entries(freq)
    .map(([price, count]) => ({ price: Number(price), count }))
    .sort((a, b) => b.count - a.count || a.price - b.price)
    .slice(0, limit);
}

function guessLocalData(text: string, network: NetworkType): string {
  const gb = text.match(/(\d{2,3})\s*GB/i);
  if (gb) {
    return network === '5G'
      ? `全速約 ${gb[1]}GB，其後無限減速（視計劃）`
      : `約 ${gb[1]}GB 全速／其後減速（視計劃）`;
  }
  if (network === '5G') return '全速本地數據其後無限減速（視計劃細節）';
  return '本地數據視計劃而定';
}

function guessGba(text: string, network: NetworkType): string {
  if (/中澳|大灣區|內地|大陸|一卡兩號|中港/i.test(text)) {
    const gb = text.match(/(\d{1,2})\s*GB[^0-9]{0,8}(中澳|大灣區|內地|大陸)/i);
    if (gb) return `約 ${gb[1]}GB 中澳／大灣區數據（視計劃）`;
    return '可配中澳／大灣區數據（視計劃）';
  }
  return network === '5G' ? '大灣區／中澳數據視計劃加配' : '通常不包大灣區（可加購）';
}

function isStudentListing(text: string): boolean {
  return /學生|student|大專|18-29|18–29|青年/i.test(text);
}

/** 由求Plan王流動數據刊登聚合成站內手機計劃 */
export function aggregateMobilePlans(listings: FpkListing[]): MobilePlan[] {
  const plans: MobilePlan[] = [];
  let sort = 1;

  const providers = ['cmhk', '3hk', 'csl', 'smartone', 'hkbn'] as const;

  for (const provider of providers) {
    const meta = PROVIDER_META[provider];
    const rows = listings.filter((p) => p.provider === provider);
    if (!rows.length) continue;

    for (const [netKey, network] of Object.entries(MOBILE_NET) as [
      string,
      NetworkType,
    ][]) {
      const priced = rows
        .map((p) => ({ p, price: priceOf(p, netKey) }))
        .filter((x): x is { p: FpkListing; price: number } => x.price != null);

      if (!priced.length) continue;

      const tops = topPrices(
        priced.map((x) => x.price),
        network === '5G' ? 3 : 2,
      );

      for (const [idx, { price, count }] of tops.entries()) {
        // 跳過同價差太近嘅第二檔（少過 $8）
        if (idx > 0 && Math.abs(price - tops[0].price) < 8) continue;

        const sample =
          priced.find((x) => x.price === price && isStudentListing(textOf(x.p)))?.p ||
          priced.find((x) => x.price === price)?.p ||
          priced[0].p;
        const text = textOf(sample);
        const student = isStudentListing(text) || (network === '5G' && price <= 108 && /學生|18-29/.test(text));
        const freeAdmin = Boolean(sample.tags?.freeAdminFee) || /免行政費/.test(text);
        const transfer = Boolean(sample.tags?.transfer) || /轉台|攜號/.test(text);

        const tierLabel =
          network === '5G'
            ? idx === 0
              ? '熱賣'
              : price > tops[0].price
                ? '高用量'
                : '入門'
            : '平價';

        plans.push({
          id: `${provider}-${network.toLowerCase().replace('.', '')}-${price}`,
          carrier: meta.id,
          carrierName: meta.name,
          planName: `${network} ${tierLabel}計劃 ${price}`,
          network,
          monthlyFee: price,
          dataLocal: guessLocalData(text, network),
          dataGba: guessGba(text, network),
          voiceMins: network === '5G' ? '視計劃（常見無限／高分鐘）' : '視計劃',
          contractMonths: 24,
          highlights: [
            freeAdmin ? '免行政費常見' : null,
            transfer ? '適合攜號轉台' : null,
            `市況常見檔（${count} 則參考）`,
            '價格以求Plan王市況為基礎',
          ]
            .filter(Boolean)
            .join('｜'),
          isRecommended: provider === 'cmhk' && (network === '5G' ? idx === 0 : network !== '5G' && idx === 0),
          isStudent: student,
          isGba: network === '5G' || /中澳|大灣區|內地/.test(text),
          isCheap4g: network !== '5G',
          hiddenPerk: `參考來源：求Plan王即時市況；實際以確認報價為準。最低曾見約 $${Math.min(...priced.map((x) => x.price))}`,
          sortOrder: sort++,
        });
      }
    }
  }

  // CMHK 推介排前
  return plans.sort((a, b) => {
    if (a.isRecommended !== b.isRecommended) return a.isRecommended ? -1 : 1;
    if (a.carrier === 'cmhk' && b.carrier !== 'cmhk') return -1;
    if (b.carrier === 'cmhk' && a.carrier !== 'cmhk') return 1;
    return a.monthlyFee - b.monthlyFee || a.sortOrder - b.sortOrder;
  });
}

function extract2500Fees(listings: FpkListing[]): number[] {
  const out: number[] = [];
  for (const p of listings) {
    const text = textOf(p);
    const matches = [...text.matchAll(/2500\s*M[^$￥\d]{0,12}[\$￥]?\s*(\d{2,3})/gi)];
    for (const m of matches) {
      const n = Number(m[1]);
      if (n >= 80 && n <= 300) out.push(n);
    }
    const alt = [...text.matchAll(/[\$￥]\s*(\d{2,3})[^0-9]{0,8}2500/gi)];
    for (const m of alt) {
      const n = Number(m[1]);
      if (n >= 80 && n <= 300) out.push(n);
    }
  }
  return out;
}

/** 由求Plan王家居寬頻刊登聚合成站內寬頻計劃 */
export function aggregateBroadbandPlans(listings: FpkListing[]): BroadbandPlan[] {
  const plans: BroadbandPlan[] = [];
  let sort = 1;
  const providers = ['cmhk', 'hkbn', 'netvigator', 'hgc', '3hk', 'smartone'] as const;

  for (const provider of providers) {
    const meta = PROVIDER_META[provider];
    const rows = listings.filter((p) => p.provider === provider);
    if (!rows.length) continue;

    // 1000M 光纖
    const fiber = rows
      .map((p) => ({ p, price: priceOf(p, 'mb1000') }))
      .filter((x): x is { p: FpkListing; price: number } => x.price != null);
    if (fiber.length) {
      for (const [idx, { price, count }] of topPrices(
        fiber.map((x) => x.price),
        2,
      ).entries()) {
        if (idx > 0 && Math.abs(price - topPrices(fiber.map((x) => x.price), 1)[0].price) < 6) {
          continue;
        }
        const sample = fiber.find((x) => x.price === price)?.p || fiber[0].p;
        const text = textOf(sample);
        plans.push({
          id: `${provider}-bb-1000-${price}`,
          carrier: meta.id,
          carrierName: meta.name,
          planName: idx === 0 ? `家居寬頻 1000M` : `家居寬頻 1000M 特選 ${price}`,
          speedMbps: 1000,
          monthlyFee: price,
          contractMonths: 24,
          housingTypes: /公.?屋|居屋/.test(text)
            ? '公屋,居屋,私樓'
            : '公屋,居屋,私樓',
          highlights: [
            sample.tags?.freeInstallFee || /免安裝/.test(text) ? '免安裝費常見' : null,
            `市況常見檔（${count} 則參考）`,
            '價格以求Plan王市況為基礎',
          ]
            .filter(Boolean)
            .join('｜'),
          isRecommended: provider === 'cmhk' && idx === 0,
          installNote: '拉線時間視屋苑／物業而定，建議先查覆蓋',
          sortOrder: sort++,
        });
      }
    }

    // 2500M（文案抽取）
    const fees2500 = extract2500Fees(rows);
    if (fees2500.length) {
      const top = topPrices(fees2500, 1)[0];
      plans.push({
        id: `${provider}-bb-2500-${top.price}`,
        carrier: meta.id,
        carrierName: meta.name,
        planName: '家居寬頻 2500M',
        speedMbps: 2500,
        monthlyFee: top.price,
        contractMonths: 24,
        housingTypes: '居屋,私樓',
        highlights: `市況常見檔（${top.count} 則參考）｜價格以求Plan王市況為基礎`,
        isRecommended: provider === 'cmhk',
        installNote: '需確認大廈已支援 2500M',
        sortOrder: sort++,
      });
    }

    // 5G 家居／無線寬頻
    const fiveG = rows
      .map((p) => ({ p, price: priceOf(p, 'fiveG') }))
      .filter((x): x is { p: FpkListing; price: number } => x.price != null);
    if (fiveG.length) {
      const top = topPrices(
        fiveG.map((x) => x.price),
        1,
      )[0];
      plans.push({
        id: `${provider}-bb-5g-${top.price}`,
        carrier: meta.id,
        carrierName: meta.name,
        planName: '5G 家居寬頻',
        speedMbps: 1000,
        monthlyFee: top.price,
        contractMonths: 24,
        housingTypes: '公屋,居屋,私樓',
        highlights: `適合村屋／唐樓／難拉線單位｜市況常見約 $${top.price}（${top.count} 則參考）`,
        isRecommended: false,
        installNote: '無線／5G 寬頻，覆蓋視訊號而定',
        sortOrder: sort++,
      });
    }
  }

  return plans.sort((a, b) => {
    if (a.isRecommended !== b.isRecommended) return a.isRecommended ? -1 : 1;
    if (a.carrier === 'cmhk' && b.carrier !== 'cmhk') return -1;
    if (b.carrier === 'cmhk' && a.carrier !== 'cmhk') return 1;
    return a.monthlyFee - b.monthlyFee || a.speedMbps - b.speedMbps;
  });
}

export async function getFindplankingMobilePlans(): Promise<MobilePlan[]> {
  const hit = mobilePlanCache.get('all');
  if (hit) return hit;

  const pending = (async () => {
    const listings = await fetchListings('mobile');
    const plans = aggregateMobilePlans(listings);
    if (!plans.length) throw new Error('[findplanking] 未能聚合手機計劃');
    console.log(`[findplanking] mobile listings=${listings.length} → plans=${plans.length}`);
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
    const plans = aggregateBroadbandPlans(listings);
    if (!plans.length) throw new Error('[findplanking] 未能聚合寬頻計劃');
    console.log(`[findplanking] broadband listings=${listings.length} → plans=${plans.length}`);
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
