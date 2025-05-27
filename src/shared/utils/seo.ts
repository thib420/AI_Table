import { Metadata } from 'next';

interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  noIndex?: boolean;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
}

export function generateSEOMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    canonical,
    noIndex = false,
    ogImage = '/og-image.png',
    ogType = 'website'
  } = config;

  const baseUrl = 'https://converr.ai';
  const fullCanonical = canonical ? `${baseUrl}${canonical}` : undefined;

  return {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    robots: {
      index: !noIndex,
      follow: !noIndex,
    },
    alternates: fullCanonical ? {
      canonical: fullCanonical,
    } : undefined,
    openGraph: {
      title,
      description,
      type: ogType,
      url: fullCanonical,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      siteName: 'Converr',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export function generatePageTitle(pageTitle: string): string {
  return `${pageTitle} | Converr`;
}

export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateFAQStructuredData(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export const DEFAULT_KEYWORDS = [
  'AI lead generation',
  'professional networking',
  'LinkedIn automation',
  'sales intelligence',
  'prospect research',
  'contact enrichment',
  'B2B sales tools',
  'CRM integration',
  'email campaigns',
  'professional search'
];

export const SITE_CONFIG = {
  name: 'Converr',
  description: 'Transform your professional network into revenue with AI-powered lead generation',
  url: 'https://converr.ai',
  ogImage: '/og-image.png',
  creator: '@converr_ai',
}; 