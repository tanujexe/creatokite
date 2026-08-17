import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ROUTE_SEO = {
  '/': {
    title: 'Creatokite — AI UGC Agency, Brand & Dealer Creator Platform',
    description: 'Creatokite is India\'s premier AI-powered UGC agency OS connecting top brands, dealer networks, and creator communities for high-performing video campaigns.',
    keywords: 'UGC Agency, UGC Creator Platform, Brand Creator Marketing, Dealer Creator Network, Creator Community, UGC Video Agency, Influencer Campaign OS, Creatokite',
  },
  '/login': {
    title: 'Login to Creatokite — AI UGC Agency & Campaign OS',
    description: 'Sign in to your Creatokite account to manage UGC campaigns, review creator submissions, track real-time analytics, and access collaboration rooms.',
    keywords: 'Creatokite Login, Creator Sign In, Brand Portal Login, UGC Campaign Login',
  },
  '/register': {
    title: 'Join Creatokite — Register as Creator or Brand Partner',
    description: 'Create your account on Creatokite. Join top UGC creators, launch brand campaigns, and scale video content production seamlessly.',
    keywords: 'Join Creatokite, UGC Creator Signup, Brand Registration, Influencer Onboarding',
  },
  '/opportunities': {
    title: 'UGC Campaign Opportunities & Brand Gigs — Creatokite',
    description: 'Browse active UGC creator opportunities, brand deals, sponsored challenges, and high-payout video campaigns on Creatokite.',
    keywords: 'UGC Deals, Creator Opportunities, Sponsored Video Gigs, Brand Collaborations, Creatokite Jobs',
  },
  '/knowledge': {
    title: 'Creatokite Knowledge Base & Creator Academy',
    description: 'Learn UGC video creation strategies, brand guidelines, campaign execution best practices, and creator growth tactics.',
    keywords: 'Creator Academy, UGC Guide, Video Campaign Best Practices, Creatokite Learning',
  },
  '/leaderboard': {
    title: 'Top Creator Community Leaderboard — Creatokite',
    description: 'Explore Creatokite top-ranked UGC creators, high-performing video strategists, and monthly community leaderboard rankings.',
    keywords: 'Top UGC Creators, Creator Leaderboard, Influencer Rankings, Creatokite Community',
  },
  '/admin/dashboard': {
    title: 'Control Center Dashboard — Creatokite Admin',
    description: 'Monitor real-time campaign health, creator approvals, revenue analytics, and brand activities on Creatokite.',
    keywords: 'Creatokite Admin, Campaign Control Center, Admin Dashboard',
  },
};

export default function DynamicSEO() {
  const location = useLocation();

  useEffect(() => {
    const currentPath = location.pathname;
    const seo = ROUTE_SEO[currentPath] || {
      title: 'Creatokite — AI UGC Agency & Creator Campaign OS',
      description: 'Scale your brand with top UGC creators, dealer network campaigns, and automated creator workflows on Creatokite.',
      keywords: 'Creatokite, UGC Platform, Creator OS, Brand Campaigns',
    };

    // 1. Update Document Title
    document.title = seo.title;

    // 2. Helper to set or create meta tags
    const setMetaTag = (selector, attribute, value, content) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, value);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 3. Update Meta Description & Keywords
    setMetaTag('meta[name="description"]', 'name', 'description', seo.description);
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', seo.keywords);

    // 4. Update OpenGraph Tags
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', seo.title);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', seo.description);
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', `https://creatokite.com${currentPath}`);

    // 5. Update Twitter Card Tags
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', seo.title);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', seo.description);

    // 6. Update Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `https://creatokite.com${currentPath}`);

  }, [location.pathname]);

  return null;
}
