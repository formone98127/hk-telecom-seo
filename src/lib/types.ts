export type CarrierId =
  | 'cmhk'
  | '3hk'
  | 'csl'
  | 'smartone'
  | 'hkbn'
  | 'netvigator'
  | 'hgc'
  | 'gba'
  | 'cuniq'
  | 'imobile'
  | 'icable'
  | 'other';

export type NetworkType = '5G' | '4.5G' | '4G';

export type HousingType = '公屋' | '居屋' | '私樓' | '全部';

export interface MobilePlan {
  id: string;
  carrier: CarrierId;
  carrierName: string;
  planName: string;
  network: NetworkType;
  monthlyFee: number;
  dataLocal: string;
  dataGba: string;
  voiceMins: string;
  contractMonths: number;
  highlights: string;
  isRecommended: boolean;
  isStudent: boolean;
  isGba: boolean;
  isCheap4g: boolean;
  hiddenPerk: string;
  sortOrder: number;
  /** 求Plan王刊登 ID */
  sourceId?: string;
  /** 刊登更新日期 */
  sourceUpdatedAt?: string;
  /** 是否已認證銷售 */
  isVerified?: boolean;
  /** 同一刊登嘅其他網絡價，方便對比 */
  siblingPrices?: string;
}

export interface BroadbandPlan {
  id: string;
  carrier: CarrierId;
  carrierName: string;
  planName: string;
  speedMbps: number;
  monthlyFee: number;
  contractMonths: number;
  housingTypes: string;
  highlights: string;
  isRecommended: boolean;
  installNote: string;
  sortOrder: number;
  sourceId?: string;
  sourceUpdatedAt?: string;
  isVerified?: boolean;
  siblingPrices?: string;
}

export interface Estate {
  slug: string;
  name: string;
  district: string;
  housingType: HousingType | string;
  supportedSpeeds: string;
  installNotes: string;
  recommendedPlanIds: string;
  seoTitle: string;
  seoDescription: string;
}

export interface CarrierMeta {
  id: CarrierId;
  name: string;
  shortName: string;
  slug: string;
}

export interface ScenarioMeta {
  id: string;
  slug: string;
  name: string;
  title: string;
  description: string;
  filter: (plan: MobilePlan) => boolean;
}
