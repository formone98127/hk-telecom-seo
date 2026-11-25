import type { CarrierMeta, ScenarioMeta, MobilePlan } from './types';

export const mobileCarriers: CarrierMeta[] = [
  { id: 'cmhk', name: '中國移動香港', shortName: 'CMHK', slug: 'cmhk' },
  { id: '3hk', name: '3HK', shortName: '3HK', slug: '3hk' },
  { id: 'csl', name: 'csl.', shortName: 'csl.', slug: 'csl' },
  { id: 'smartone', name: 'SmarTone', shortName: 'SmarTone', slug: 'smartone' },
  { id: 'hkbn', name: '香港寬頻 N-Mobile', shortName: 'HKBN', slug: 'hkbn' },
];

export const broadbandCarriers: CarrierMeta[] = [
  { id: 'cmhk', name: '中國移動香港', shortName: 'CMHK', slug: 'cmhk' },
  { id: 'hkbn', name: '香港寬頻', shortName: 'HKBN', slug: 'hkbn' },
  { id: 'netvigator', name: '網上行', shortName: 'Netvigator', slug: 'netvigator' },
  { id: 'hgc', name: 'HGC', shortName: 'HGC', slug: 'hgc' },
  { id: '3hk', name: '3HK 寬頻', shortName: '3HK', slug: '3hk' },
  { id: 'smartone', name: 'SmarTone', shortName: 'SmarTone', slug: 'smartone' },
];

export const scenarios: ScenarioMeta[] = [
  {
    id: 'gba-roaming',
    slug: 'gba-roaming',
    name: '大灣區一卡兩號',
    title: '大灣區一卡兩號／漫遊月費比較',
    description:
      '比較各大電訊商大灣區數據、一卡兩號及跨境通話優惠，適合經常往返粵港澳的用戶。',
    filter: (p: MobilePlan) => p.isGba,
  },
  {
    id: 'student',
    slug: 'student',
    name: '學生 Plan',
    title: '香港學生手機月費比較',
    description: '精選學生證專屬 5G／4.5G 月費，平價高流量，適合大專及中學生。',
    filter: (p: MobilePlan) => p.isStudent,
  },
  {
    id: 'cheap-4g',
    slug: 'cheap-4g',
    name: '平價 4.5G',
    title: '平價 4.5G／4G 月費比較',
    description: '專為慳錢用戶精選低月費 4.5G／4G Plan，免行政費、攜號轉台都啱用。',
    filter: (p: MobilePlan) => p.isCheap4g || p.network !== '5G',
  },
];

export const carrierBadgeClass: Record<string, string> = {
  cmhk: 'badge-cmhk',
  '3hk': 'badge-3hk',
  csl: 'badge-csl',
  smartone: 'badge-smartone',
  hkbn: 'badge-hkbn',
  netvigator: 'badge-netvigator',
  hgc: 'badge-hgc',
};
