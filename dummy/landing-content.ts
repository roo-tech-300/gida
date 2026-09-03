import { ImageSourcePropType } from 'react-native';

export interface LandingHeroCopy {
  brandName: string;
  title: string;
  tagline: string;
  primaryCta: string;
  secondaryCta: string;
  bottomNavCta: string;
  copyright: string;
}

export interface LandingOfferItem {
  step: number;
  title: string;
  desc: string;
  image: ImageSourcePropType;
}

export interface LandingHowStepItem {
  num: string;
  screen: number;
  title: string;
  desc: string;
  image: ImageSourcePropType;
}

export interface LandingCtaCopy {
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
}

export interface LandingFooterLegalLink {
  label: string;
  url: string;
}

export interface LandingFooterLinks {
  tagline: string;
  campusCoverage: string;
  campusSubtext: string;
  copyright: string;
  email: string;
  emailUrl: string;
  whatsapp: string;
  whatsappUrl: string;
  legalLinks: LandingFooterLegalLink[];
}

export const SCREENSHOTS: Record<number, ImageSourcePropType> = {
  1: require('@/assets/images/landing/screenshots/1.png'),
  2: require('@/assets/images/landing/screenshots/2.png'),
  3: require('@/assets/images/landing/screenshots/3.png'),
  4: require('@/assets/images/landing/screenshots/4.png'),
};

export const LANDING_IMAGES = {
  logo: require('@/assets/images/landing/logo.png'),
  house: require('@/assets/images/landing/house.png'),
} as const;

export const HERO_COPY: LandingHeroCopy = {
  brandName: 'Gida',
  title: 'Gida',
  tagline:
    'The premier real estate platform for Nigerian students. Seamlessly discover premium lodges and compatible roommates with confidence.',
  primaryCta: 'Get started',
  secondaryCta: 'Log in',
  bottomNavCta: 'Get started',
  copyright: '© 2026',
};

export const OFFERS: LandingOfferItem[] = [
  {
    step: 1,
    title: 'Find Lodges',
    desc: 'Discover the best student accommodations around FUTMINNA tailored to your budget and preferences.',
    image: SCREENSHOTS[1],
  },
  {
    step: 4,
    title: 'Secure Payments',
    desc: 'Experience hassle-free and secure transactions directly through our trusted platform.',
    image: SCREENSHOTS[4],
  },
  {
    step: 2,
    title: 'Connect with Roommates',
    desc: 'Find verified students with similar lifestyles to share your space and split the bills easily.',
    image: SCREENSHOTS[2],
  },
];

export const HOW_STEPS: LandingHowStepItem[] = [
  {
    num: 'Step 1',
    screen: 1,
    title: 'Specify Your Preferences',
    desc: 'Define your budget, location, and amenity requirements. Our matching engine will present highly curated property options tailored exactly to your criteria.',
    image: SCREENSHOTS[1],
  },
  {
    num: 'Step 2',
    screen: 2,
    title: 'Discover Compatible Roommates',
    desc: 'Optimize your housing budget by pairing with verified students whose lifestyle and financial parameters align seamlessly with yours.',
    image: SCREENSHOTS[2],
  },
  {
    num: 'Step 3',
    screen: 3,
    title: 'Secure and Transition',
    desc: 'Finalize your lease and execute secure payments directly through the platform, ensuring a smooth transition into your new residence.',
    image: SCREENSHOTS[3],
  },
];

export const CTA_COPY: LandingCtaCopy = {
  title: 'Ready to find your perfect lodge?',
  subtitle:
    'Join thousands of students who have already found their ideal living space and verified roommates through Gida.',
  primaryCta: 'Get started',
  secondaryCta: 'Log in',
};

export const FOOTER_LINKS: LandingFooterLinks = {
  tagline: 'Just get a lodge, no stress.',
  campusCoverage: 'Campus Coverage: FUT Minna',
  campusSubtext: 'More campuses loading soon.',
  copyright: '© 2026 Gida Apartments. All rights reserved.',
  email: 'help@gida.apartments',
  emailUrl: 'mailto:help@gida.apartments',
  whatsapp: '+234 806 118 6486',
  whatsappUrl: 'https://wa.me/2348061186486',
  legalLinks: [
    { label: 'Privacy Policy', url: '/privacy.html' },
    { label: 'Terms of Service', url: '/terms.html' },
  ],
};
