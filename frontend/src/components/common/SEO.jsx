import React from 'react';
import { Helmet } from 'react-helmet-async';

const DEFAULT_KEYWORDS = [
  'UGC Agency',
  'UGC Creator Platform',
  'Brand Creator Marketing',
  'Dealer Creator Network',
  'UGC Content Creator',
  'Creator Community',
  'Creator Campaign OS',
  'Micro Influencer Agency',
  'Brand Collaboration Hub',
  'Creatokite',
].join(', ');

const DEFAULT_DESCRIPTION =
  'Creatokite is the all-in-one AI-powered UGC agency platform connecting top brands, dealers, and creator communities to run high-converting creator campaigns seamlessly.';

const DEFAULT_TITLE = 'Creatokite — #1 UGC Agency, Brand & Dealer Creator Platform';
const SITE_URL = 'https://creatokite.com';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-banner.png`;

export default function SEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonical,
  ogType = 'website',
  ogImage = DEFAULT_OG_IMAGE,
  jsonLd,
  noindex = false,
}) {
  const pageTitle = title.includes('Creatokite') ? title : `${title} | Creatokite`;
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : SITE_URL;

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="Creatokite" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
