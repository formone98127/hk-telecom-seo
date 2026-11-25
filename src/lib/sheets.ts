import Papa from 'papaparse';
import type { BroadbandPlan, Estate, MobilePlan } from './types';
import { parseBool, parseNumber } from './utils';

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
    console.warn('[sheets] fetch failed, using mock fallback:', err);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Mock Data — 香港電訊逼真模擬數據（未接 Google Sheets 時使用）              */
/* -------------------------------------------------------------------------- */

const MOCK_MOBILE_PLANS: MobilePlan[] = [
  {
    id: 'cmhk-5g-168',
    carrier: 'cmhk',
    carrierName: '中國移動香港',
    planName: '5G 極速計劃 168',
    network: '5G',
    monthlyFee: 168,
    dataLocal: '無限本地數據（全速 50GB）',
    dataGba: '大灣區 20GB + 內地號碼',
    voiceMins: '2000 分鐘',
    contractMonths: 24,
    highlights: '免行政費｜攜號轉台送 $300 超市禮券｜一卡兩號',
    isRecommended: true,
    isStudent: false,
    isGba: true,
    isCheap4g: false,
    hiddenPerk: '首 3 個月減 $50，實際低至 $118',
    sortOrder: 1,
  },
  {
    id: 'cmhk-5g-138',
    carrier: 'cmhk',
    carrierName: '中國移動香港',
    planName: '5G 精選 138',
    network: '5G',
    monthlyFee: 138,
    dataLocal: '無限本地數據（全速 30GB）',
    dataGba: '大灣區 10GB',
    voiceMins: '1500 分鐘',
    contractMonths: 24,
    highlights: '免行政費｜高性價比之選｜送 Spotify 3 個月',
    isRecommended: true,
    isStudent: false,
    isGba: true,
    isCheap4g: false,
    hiddenPerk: '經本站登記再送額外 5GB 大灣區數據',
    sortOrder: 2,
  },
  {
    id: 'cmhk-student-98',
    carrier: 'cmhk',
    carrierName: '中國移動香港',
    planName: '學生 5G 計劃 98',
    network: '5G',
    monthlyFee: 98,
    dataLocal: '無限本地數據（全速 20GB）',
    dataGba: '大灣區 5GB',
    voiceMins: '1000 分鐘',
    contractMonths: 12,
    highlights: '學生證專享｜免行政費｜合約最短 12 個月',
    isRecommended: true,
    isStudent: true,
    isGba: true,
    isCheap4g: false,
    hiddenPerk: '畢業後可無縫升級至正式 5G Plan',
    sortOrder: 3,
  },
  {
    id: '3hk-5g-188',
    carrier: '3hk',
    carrierName: '3HK',
    planName: '5G 王牌計劃 188',
    network: '5G',
    monthlyFee: 188,
    dataLocal: '無限本地數據（全速 60GB）',
    dataGba: '大灣區／澳門 15GB',
    voiceMins: '無限通話',
    contractMonths: 24,
    highlights: '網速穩定｜送 Apple Music 6 個月',
    isRecommended: false,
    isStudent: false,
    isGba: true,
    isCheap4g: false,
    hiddenPerk: '上台送 $200 電子現金券',
    sortOrder: 4,
  },
  {
    id: 'csl-5g-198',
    carrier: 'csl',
    carrierName: 'csl.',
    planName: '5G Home Service 198',
    network: '5G',
    monthlyFee: 198,
    dataLocal: '無限本地數據（全速 80GB）',
    dataGba: '大灣區 8GB',
    voiceMins: '無限通話',
    contractMonths: 24,
    highlights: '覆蓋廣泛｜可加購家庭成員',
    isRecommended: false,
    isStudent: false,
    isGba: true,
    isCheap4g: false,
    hiddenPerk: '綁定寬頻可再減 $30／月',
    sortOrder: 5,
  },
  {
    id: 'smartone-5g-178',
    carrier: 'smartone',
    carrierName: 'SmarTone',
    planName: '5G 無限計劃 178',
    network: '5G',
    monthlyFee: 178,
    dataLocal: '無限本地數據（全速 40GB）',
    dataGba: '大灣區 12GB',
    voiceMins: '2000 分鐘',
    contractMonths: 24,
    highlights: '網路質素佳｜送 Disney+ 3 個月',
    isRecommended: false,
    isStudent: false,
    isGba: true,
    isCheap4g: false,
    hiddenPerk: '轉台客戶免$18行政費',
    sortOrder: 6,
  },
  {
    id: 'cmhk-45g-68',
    carrier: 'cmhk',
    carrierName: '中國移動香港',
    planName: '4.5G 平價計劃 68',
    network: '4.5G',
    monthlyFee: 68,
    dataLocal: '30GB 全速，其後無限減速',
    dataGba: '不包大灣區',
    voiceMins: '500 分鐘',
    contractMonths: 12,
    highlights: '超低月費｜免行政費｜適合輕量用戶',
    isRecommended: true,
    isStudent: false,
    isGba: false,
    isCheap4g: true,
    hiddenPerk: '可隨時加購大灣區日費包',
    sortOrder: 7,
  },
  {
    id: '3hk-45g-78',
    carrier: '3hk',
    carrierName: '3HK',
    planName: '4.5G 精選 78',
    network: '4.5G',
    monthlyFee: 78,
    dataLocal: '40GB 全速，其後無限減速',
    dataGba: '不包大灣區',
    voiceMins: '800 分鐘',
    contractMonths: 24,
    highlights: '平價高流量｜攜號轉台可享優惠',
    isRecommended: false,
    isStudent: false,
    isGba: false,
    isCheap4g: true,
    hiddenPerk: '新號碼上台送額外 10GB',
    sortOrder: 8,
  },
  {
    id: 'smartone-student-108',
    carrier: 'smartone',
    carrierName: 'SmarTone',
    planName: '學生 5G 計劃 108',
    network: '5G',
    monthlyFee: 108,
    dataLocal: '無限本地數據（全速 25GB）',
    dataGba: '大灣區 3GB',
    voiceMins: '1000 分鐘',
    contractMonths: 12,
    highlights: '學生專享｜送雲端儲存',
    isRecommended: false,
    isStudent: true,
    isGba: true,
    isCheap4g: false,
    hiddenPerk: '憑學生證額外送 AirPods 折扣券',
    sortOrder: 9,
  },
];

const MOCK_BROADBAND_PLANS: BroadbandPlan[] = [
  {
    id: 'cmhk-bb-1000',
    carrier: 'cmhk',
    carrierName: '中國移動香港',
    planName: '家居寬頻 1000M',
    speedMbps: 1000,
    monthlyFee: 128,
    contractMonths: 24,
    housingTypes: '公屋,居屋,私樓',
    highlights: '免安裝費｜送 Router｜可綁手機月費再減',
    isRecommended: true,
    installNote: '大部分屋苑 7–14 個工作天完成拉線',
    sortOrder: 1,
  },
  {
    id: 'cmhk-bb-2500',
    carrier: 'cmhk',
    carrierName: '中國移動香港',
    planName: '家居寬頻 2500M',
    speedMbps: 2500,
    monthlyFee: 168,
    contractMonths: 24,
    housingTypes: '居屋,私樓',
    highlights: '超高速｜免行政費｜適合 4K／雲端辦公',
    isRecommended: true,
    installNote: '需確認大廈已鋪設對應光纖',
    sortOrder: 2,
  },
  {
    id: 'hkbn-bb-1000',
    carrier: 'hkbn',
    carrierName: '香港寬頻',
    planName: 'HKBN 1000M 光纖',
    speedMbps: 1000,
    monthlyFee: 148,
    contractMonths: 24,
    housingTypes: '公屋,居屋,私樓',
    highlights: '覆蓋廣｜公屋適用｜送智能家居配件',
    isRecommended: false,
    installNote: '公屋／居屋一般 5–10 個工作天',
    sortOrder: 3,
  },
  {
    id: 'netvigator-bb-1000',
    carrier: 'netvigator',
    carrierName: '網上行',
    planName: 'Netvigator 1000M',
    speedMbps: 1000,
    monthlyFee: 198,
    contractMonths: 24,
    housingTypes: '居屋,私樓',
    highlights: '穩定可靠｜可加購 Wi-Fi 6 Router',
    isRecommended: false,
    installNote: '部分舊式樓宇需額外拉線評估',
    sortOrder: 4,
  },
  {
    id: 'hkbn-bb-2500',
    carrier: 'hkbn',
    carrierName: '香港寬頻',
    planName: 'HKBN 2500M 光纖',
    speedMbps: 2500,
    monthlyFee: 188,
    contractMonths: 24,
    housingTypes: '私樓',
    highlights: '企業級網速｜適合串流＋電競',
    isRecommended: false,
    installNote: '以現場勘察為準',
    sortOrder: 5,
  },
  {
    id: '3hk-bb-1000',
    carrier: '3hk',
    carrierName: '3HK',
    planName: '3HK 家居寬頻 1000M',
    speedMbps: 1000,
    monthlyFee: 138,
    contractMonths: 24,
    housingTypes: '公屋,居屋,私樓',
    highlights: '可與手機 Plan 綑綁｜免安裝費',
    isRecommended: false,
    installNote: '綑綁上台通常更快批核',
    sortOrder: 6,
  },
];

const MOCK_ESTATES: Estate[] = [
  {
    slug: 'lohas-park',
    name: '日出康城',
    district: '西貢區／將軍澳',
    housingType: '私樓',
    supportedSpeeds: '1000M,2500M',
    installNotes:
      '各期大廈大多已預留光纖入屋；部分較新期數支援 2500M。預約師傅前建議先確認座數同樓層有無訊號箱。',
    recommendedPlanIds: 'cmhk-bb-1000,cmhk-bb-2500,hkbn-bb-1000',
    seoTitle: '日出康城寬頻比較｜1000M／2500M 月費同拉線攻略',
    seoDescription:
      '比較日出康城（LOHAS Park）各電訊商家居寬頻月費、網速同拉線時間，包 CMHK、HKBN、網上行最新優惠。',
  },
  {
    slug: 'taikoo-shing',
    name: '太古城',
    district: '東區／鰂魚涌',
    housingType: '私樓',
    supportedSpeeds: '1000M,2500M',
    installNotes:
      '太古城樓齡較高，部分單位需經管理處申請入屋工程；建議預留 10–14 個工作天。',
    recommendedPlanIds: 'cmhk-bb-1000,netvigator-bb-1000,hkbn-bb-1000',
    seoTitle: '太古城寬頻比較｜邊間平邊間快？拉線注意事項',
    seoDescription:
      '太古城家居寬頻格價：1000M／2500M 月費比較，涵蓋拉線、管理處申請及最新電訊商優惠。',
  },
  {
    slug: 'south-horizons',
    name: '海怡半島',
    district: '南區／鴨脷洲',
    housingType: '私樓',
    supportedSpeeds: '1000M,2500M',
    installNotes:
      '海怡半島光纖覆蓋成熟，多數單位可直接安裝 1000M；2500M 需先查詢該座有無升級。',
    recommendedPlanIds: 'cmhk-bb-1000,cmhk-bb-2500,3hk-bb-1000',
    seoTitle: '海怡半島寬頻比較｜1000M 月費同安裝時間',
    seoDescription:
      '海怡半島寬頻邊間好？比較 CMHK、3HK、HKBN 月費、網速同拉線流程。',
  },
  {
    slug: 'discovery-bay',
    name: '愉景灣',
    district: '離島區／大嶼山',
    housingType: '私樓',
    supportedSpeeds: '1000M',
    installNotes:
      '愉景灣屬離島物業，安裝檔期可能較市區長；部分屋苑只支援指定電訊商，預約前務必查詢覆蓋。',
    recommendedPlanIds: 'netvigator-bb-1000,cmhk-bb-1000',
    seoTitle: '愉景灣寬頻比較｜覆蓋、月費同拉線須知',
    seoDescription:
      '愉景灣家居寬頻格價同覆蓋一覽，了解邊間電訊商可安裝、月費同拉線注意事項。',
  },
  {
    slug: 'public-housing',
    name: '公屋寬頻專頁',
    district: '全港公屋／居屋',
    housingType: '公屋',
    supportedSpeeds: '1000M',
    installNotes:
      '公屋／居屋一般有指定合資格電訊商；安裝需配合房屋署／屋邨辦事處安排，請預留彈性檔期，切勿自行鑽牆。',
    recommendedPlanIds: 'cmhk-bb-1000,hkbn-bb-1000,3hk-bb-1000',
    seoTitle: '公屋／居屋寬頻比較｜合資格電訊商同月費',
    seoDescription:
      '公屋、居屋寬頻邊間平？比較合資格電訊商 1000M 月費、免安裝費優惠同拉線流程。',
  },
];

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

function sortByOrder<T extends { sortOrder: number; isRecommended?: boolean }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (Boolean(a.isRecommended) !== Boolean(b.isRecommended)) {
      return a.isRecommended ? -1 : 1;
    }
    return a.sortOrder - b.sortOrder;
  });
}

export async function getMobilePlans(): Promise<MobilePlan[]> {
  const rows = await fetchSheetData<Record<string, unknown>>(
    import.meta.env.MOBILE_PLANS_CSV_URL,
  );
  if (!rows?.length) return sortByOrder(MOCK_MOBILE_PLANS);
  return sortByOrder(rows.map(mapMobileRow).filter((p) => p.id && p.planName));
}

export async function getBroadbandPlans(): Promise<BroadbandPlan[]> {
  const rows = await fetchSheetData<Record<string, unknown>>(
    import.meta.env.BROADBAND_PLANS_CSV_URL,
  );
  if (!rows?.length) return sortByOrder(MOCK_BROADBAND_PLANS);
  return sortByOrder(rows.map(mapBroadbandRow).filter((p) => p.id && p.planName));
}

export async function getEstates(): Promise<Estate[]> {
  const rows = await fetchSheetData<Record<string, unknown>>(
    import.meta.env.ESTATES_CSV_URL,
  );
  if (!rows?.length) return MOCK_ESTATES;
  return rows.map(mapEstateRow).filter((e) => e.slug && e.name);
}

export async function getEstateBySlug(slug: string): Promise<Estate | undefined> {
  const estates = await getEstates();
  return estates.find((e) => e.slug === slug);
}

export { fetchSheetData, MOCK_MOBILE_PLANS, MOCK_BROADBAND_PLANS, MOCK_ESTATES };
