import Papa from 'papaparse';
import cmhkCuratedJson from '../../data/cmhk/mobile-plans.json';
import type { BroadbandPlan, Estate, MobilePlan } from './types';
import { parseBool, parseNumber } from './utils';
import {
  getFindplankingBroadbandPlans,
  getFindplankingMobilePlans,
} from './findplanking';

async function fetchSheetData<T extends Record<string, unknown>>(
  csvUrl: string | undefined,
): Promise<T[] | null> {
  if (!csvUrl || !csvUrl.trim()) return null;

  try {
    const res = await fetch(csvUrl, {
      headers: { Accept: 'text/csv,text/plain,*/*' },
    });
    if (!res.ok) {
      console.warn(`[sheets] HTTP ${res.status} for ${csvUrl}`);
      return null;
    }
    const text = await res.text();
    const parsed = Papa.parse<T>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });
    if (parsed.errors.length) {
      console.warn('[sheets] CSV parse warnings:', parsed.errors.slice(0, 3));
    }
    return parsed.data.filter((row) => Object.keys(row).length > 0);
  } catch (err) {
    console.warn('[sheets] fetch failed:', err);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* 最後兜底 Mock（只喺 Google Sheets 同求Plan王都失敗時使用）                 */
/* -------------------------------------------------------------------------- */

const FALLBACK_MOBILE: MobilePlan[] = [
  {
    id: 'cmhk-5g-98',
    carrier: 'cmhk',
    carrierName: '中國移動香港',
    planName: '5G 熱賣計劃 98',
    network: '5G',
    monthlyFee: 98,
    dataLocal: '全速本地數據其後無限減速（視計劃）',
    dataGba: '可配中澳／大灣區數據',
    voiceMins: '視計劃',
    contractMonths: 24,
    highlights: '兜底數據｜請稍後重新 Build 以同步求Plan王',
    isRecommended: true,
    isStudent: true,
    isGba: true,
    isCheap4g: false,
    hiddenPerk: '資料來源暫時離線',
    sortOrder: 1,
  },
];

const FALLBACK_BROADBAND: BroadbandPlan[] = [
  {
    id: 'cmhk-bb-1000-78',
    carrier: 'cmhk',
    carrierName: '中國移動香港',
    planName: '家居寬頻 1000M',
    speedMbps: 1000,
    monthlyFee: 78,
    contractMonths: 24,
    housingTypes: '公屋,居屋,私樓',
    highlights: '兜底數據｜請稍後重新 Build 以同步求Plan王',
    isRecommended: true,
    installNote: '需確認覆蓋',
    sortOrder: 1,
  },
];

const FALLBACK_ESTATES: Estate[] = [
  {
    slug: 'lohas-park',
    name: '日出康城',
    district: '西貢區／將軍澳',
    housingType: '私樓',
    supportedSpeeds: '1000M,2500M',
    installNotes:
      '各期大廈大多已預留光纖入屋；部分較新期數支援 2500M。預約前建議確認座數同樓層。',
    recommendedPlanIds: '',
    seoTitle: '日出康城寬頻比較｜1000M／2500M 月費同拉線攻略',
    seoDescription:
      '比較日出康城各電訊商家居寬頻月費、網速同拉線時間，跟市況價更新。',
  },
  {
    slug: 'taikoo-shing',
    name: '太古城',
    district: '東區／鰂魚涌',
    housingType: '私樓',
    supportedSpeeds: '1000M,2500M',
    installNotes: '樓齡較高，部分單位需經管理處申請入屋工程；建議預留 10–14 個工作天。',
    recommendedPlanIds: '',
    seoTitle: '太古城寬頻比較｜邊間平邊間快？拉線注意事項',
    seoDescription: '太古城家居寬頻格價：1000M／2500M 月費比較同拉線須知。',
  },
  {
    slug: 'south-horizons',
    name: '海怡半島',
    district: '南區／鴨脷洲',
    housingType: '私樓',
    supportedSpeeds: '1000M,2500M',
    installNotes: '光纖覆蓋成熟，多數單位可直接安裝 1000M；2500M 需先查詢該座。',
    recommendedPlanIds: '',
    seoTitle: '海怡半島寬頻比較｜1000M 月費同安裝時間',
    seoDescription: '海怡半島寬頻邊間好？比較月費、網速同拉線流程。',
  },
  {
    slug: 'discovery-bay',
    name: '愉景灣',
    district: '離島區／大嶼山',
    housingType: '私樓',
    supportedSpeeds: '1000M',
    installNotes: '離島物業安裝檔期可能較長；部分屋苑只支援指定電訊商。',
    recommendedPlanIds: '',
    seoTitle: '愉景灣寬頻比較｜覆蓋、月費同拉線須知',
    seoDescription: '愉景灣家居寬頻格價同覆蓋一覽。',
  },
  {
    slug: 'public-housing',
    name: '公屋寬頻專頁',
    district: '全港公屋／居屋',
    housingType: '公屋',
    supportedSpeeds: '1000M',
    installNotes:
      '公屋／居屋通常只有合資格電訊商可入邨拉線，需配合屋邨辦事處檔期。',
    recommendedPlanIds: '',
    seoTitle: '公屋／居屋寬頻比較｜合資格電訊商同月費',
    seoDescription: '公屋、居屋寬頻邊間平？比較 1000M 月費同拉線流程。',
  },
];

/* -------------------------------------------------------------------------- */
/* 中國移動人手維護清單（data/cmhk/mobile-plans.json）                        */
/* -------------------------------------------------------------------------- */

function loadCmhkCuratedPlans(): MobilePlan[] {
  return (cmhkCuratedJson as unknown as MobilePlan[]).filter((p) => p?.id && p?.planName);
}

function mapMobileRow(row: Record<string, unknown>): MobilePlan {
  return {
    id: String(row.id ?? ''),
    carrier: String(row.carrier ?? 'cmhk') as MobilePlan['carrier'],
    carrierName: String(row.carrierName ?? row.carrier_name ?? ''),
    planName: String(row.planName ?? row.plan_name ?? ''),
    network: String(row.network ?? '5G') as MobilePlan['network'],
    monthlyFee: parseNumber(row.monthlyFee ?? row.monthly_fee),
    dataLocal: String(row.dataLocal ?? row.data_local ?? ''),
    dataGba: String(row.dataGba ?? row.data_gba ?? ''),
    voiceMins: String(row.voiceMins ?? row.voice_mins ?? ''),
    contractMonths: parseNumber(row.contractMonths ?? row.contract_months, 24),
    highlights: String(row.highlights ?? ''),
    isRecommended: parseBool(row.isRecommended ?? row.is_recommended),
    isStudent: parseBool(row.isStudent ?? row.is_student),
    isGba: parseBool(row.isGba ?? row.is_gba),
    isCheap4g: parseBool(row.isCheap4g ?? row.is_cheap_4g),
    hiddenPerk: String(row.hiddenPerk ?? row.hidden_perk ?? ''),
    sortOrder: parseNumber(row.sortOrder ?? row.sort_order, 99),
  };
}

function mapBroadbandRow(row: Record<string, unknown>): BroadbandPlan {
  return {
    id: String(row.id ?? ''),
    carrier: String(row.carrier ?? 'cmhk') as BroadbandPlan['carrier'],
    carrierName: String(row.carrierName ?? row.carrier_name ?? ''),
    planName: String(row.planName ?? row.plan_name ?? ''),
    speedMbps: parseNumber(row.speedMbps ?? row.speed_mbps),
    monthlyFee: parseNumber(row.monthlyFee ?? row.monthly_fee),
    contractMonths: parseNumber(row.contractMonths ?? row.contract_months, 24),
    housingTypes: String(row.housingTypes ?? row.housing_types ?? ''),
    highlights: String(row.highlights ?? ''),
    isRecommended: parseBool(row.isRecommended ?? row.is_recommended),
    installNote: String(row.installNote ?? row.install_note ?? ''),
    sortOrder: parseNumber(row.sortOrder ?? row.sort_order, 99),
  };
}

function mapEstateRow(row: Record<string, unknown>): Estate {
  return {
    slug: String(row.slug ?? ''),
    name: String(row.name ?? ''),
    district: String(row.district ?? ''),
    housingType: String(row.housingType ?? row.housing_type ?? ''),
    supportedSpeeds: String(row.supportedSpeeds ?? row.supported_speeds ?? ''),
    installNotes: String(row.installNotes ?? row.install_notes ?? ''),
    recommendedPlanIds: String(row.recommendedPlanIds ?? row.recommended_plan_ids ?? ''),
    seoTitle: String(row.seoTitle ?? row.seo_title ?? ''),
    seoDescription: String(row.seoDescription ?? row.seo_description ?? ''),
  };
}

function sortMobile(items: MobilePlan[]): MobilePlan[] {
  return [...items].sort((a, b) => {
    if (a.isRecommended !== b.isRecommended) return a.isRecommended ? -1 : 1;
    return a.sortOrder - b.sortOrder || a.monthlyFee - b.monthlyFee;
  });
}

function sortBroadband(items: BroadbandPlan[]): BroadbandPlan[] {
  return [...items].sort((a, b) => {
    if (a.isRecommended !== b.isRecommended) return a.isRecommended ? -1 : 1;
    return a.sortOrder - b.sortOrder || a.monthlyFee - b.monthlyFee;
  });
}

/**
 * 資料優先序：
 * 1) Google Sheets CSV（人手覆寫）
 * 2) 求Plan王即時市況（計劃內容基礎）
 * 3) 本地兜底
 * 4) data/cmhk/mobile-plans.json —— 中國移動人手維護清單，永遠覆蓋 CMHK 手機計劃
 */
export async function getMobilePlans(): Promise<MobilePlan[]> {
  const rows = await fetchSheetData<Record<string, unknown>>(
    import.meta.env.MOBILE_PLANS_CSV_URL,
  );
  let base: MobilePlan[];
  if (rows?.length) {
    base = rows.map(mapMobileRow).filter((p) => p.id && p.planName);
  } else {
    try {
      base = await getFindplankingMobilePlans();
    } catch (err) {
      console.warn('[sheets] findplanking mobile failed, using fallback:', err);
      base = FALLBACK_MOBILE;
    }
  }

  const curated = loadCmhkCuratedPlans();
  if (curated.length) {
    // 中國移動以人手維護清單為準，其他台沿用原有資料
    return sortMobile([...curated, ...base.filter((p) => p.carrier !== 'cmhk')]);
  }
  return sortMobile(base);
}

export async function getBroadbandPlans(): Promise<BroadbandPlan[]> {
  const rows = await fetchSheetData<Record<string, unknown>>(
    import.meta.env.BROADBAND_PLANS_CSV_URL,
  );
  if (rows?.length) {
    return sortBroadband(rows.map(mapBroadbandRow).filter((p) => p.id && p.planName));
  }

  try {
    return sortBroadband(await getFindplankingBroadbandPlans());
  } catch (err) {
    console.warn('[sheets] findplanking broadband failed, using fallback:', err);
    return FALLBACK_BROADBAND;
  }
}

function attachRecommendedPlans(estates: Estate[], plans: BroadbandPlan[]): Estate[] {
  const fiber1000 = plans.filter((p) => p.speedMbps === 1000).slice(0, 4);
  const publicFriendly = plans
    .filter((p) => p.housingTypes.includes('公屋') && p.speedMbps === 1000)
    .slice(0, 3);
  const defaultIds = (fiber1000.length ? fiber1000 : plans.slice(0, 3))
    .map((p) => p.id)
    .join(',');
  const publicIds = (publicFriendly.length ? publicFriendly : fiber1000)
    .map((p) => p.id)
    .join(',');

  return estates.map((e) => {
    if (e.recommendedPlanIds?.trim()) return e;
    return {
      ...e,
      recommendedPlanIds: e.housingType === '公屋' ? publicIds || defaultIds : defaultIds,
    };
  });
}

export async function getEstates(): Promise<Estate[]> {
  const plans = await getBroadbandPlans();
  const rows = await fetchSheetData<Record<string, unknown>>(
    import.meta.env.ESTATES_CSV_URL,
  );
  const base = rows?.length
    ? rows.map(mapEstateRow).filter((e) => e.slug && e.name)
    : FALLBACK_ESTATES;
  return attachRecommendedPlans(base, plans);
}

export async function getEstateBySlug(slug: string): Promise<Estate | undefined> {
  const estates = await getEstates();
  return estates.find((e) => e.slug === slug);
}

export { fetchSheetData };
