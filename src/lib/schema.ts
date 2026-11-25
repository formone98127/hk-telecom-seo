import { absoluteUrl } from './utils';

const SITE = 'https://example.com';

export function breadcrumbSchema(
  items: { name: string; path: string }[],
  site = SITE,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path, site),
    })),
  };
}

export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function offerSchema(opts: {
  name: string;
  description: string;
  price: number;
  seller: string;
  url: string;
  site?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: opts.name,
    description: opts.description,
    price: opts.price,
    priceCurrency: 'HKD',
    availability: 'https://schema.org/InStock',
    url: absoluteUrl(opts.url, opts.site || SITE),
    seller: {
      '@type': 'Organization',
      name: opts.seller,
    },
  };
}

export function webSiteSchema(site = SITE) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '電訊格價通',
    url: site,
    inLanguage: 'zh-HK',
    description: '香港手機月費及家居寬頻中立格價比較平台',
  };
}
