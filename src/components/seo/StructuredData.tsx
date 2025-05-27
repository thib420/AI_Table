interface StructuredDataProps {
  type?: 'Organization' | 'WebSite' | 'SoftwareApplication' | 'Product';
  data?: Record<string, any>;
}

export function StructuredData({ type = 'Organization', data }: StructuredDataProps) {
  const getStructuredData = () => {
    const baseData = {
      '@context': 'https://schema.org',
    };

    switch (type) {
      case 'Organization':
        return {
          ...baseData,
          '@type': 'Organization',
          name: 'Converr',
          url: 'https://converr.ai',
          logo: 'https://converr.ai/logo.png',
          description: 'AI-powered professional intelligence platform for lead generation and networking',
          foundingDate: '2024',
          industry: 'Software',
          sameAs: [
            'https://twitter.com/converr_ai',
            'https://linkedin.com/company/converr',
          ],
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+1-555-0123',
            contactType: 'Customer Service',
            areaServed: 'Worldwide',
            availableLanguage: 'English',
          },
          ...data,
        };

      case 'WebSite':
        return {
          ...baseData,
          '@type': 'WebSite',
          name: 'Converr',
          url: 'https://converr.ai',
          description: 'Transform your professional network into revenue with AI-powered lead generation',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://converr.ai/search?q={search_term_string}',
            'query-input': 'required name=search_term_string',
          },
          ...data,
        };

      case 'SoftwareApplication':
        return {
          ...baseData,
          '@type': 'SoftwareApplication',
          name: 'Converr',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          description: 'AI-powered professional intelligence platform for lead generation',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            description: 'Free trial available',
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            ratingCount: '500',
          },
          ...data,
        };

      case 'Product':
        return {
          ...baseData,
          '@type': 'Product',
          name: 'Converr Professional Intelligence Platform',
          description: 'AI-powered lead generation and professional networking platform',
          brand: {
            '@type': 'Brand',
            name: 'Converr',
          },
          category: 'Software',
          offers: {
            '@type': 'Offer',
            availability: 'https://schema.org/InStock',
            price: '0',
            priceCurrency: 'USD',
            priceValidUntil: '2025-12-31',
            description: 'Free trial available',
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            ratingCount: '500',
            bestRating: '5',
            worstRating: '1',
          },
          ...data,
        };

      default:
        return { ...baseData, ...data };
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(getStructuredData()),
      }}
    />
  );
} 