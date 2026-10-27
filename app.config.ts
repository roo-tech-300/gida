import type { ExpoConfig, ConfigContext } from 'expo/config';

// APP_VARIANT=preview builds "Gida Preview": a separate app (own package
// name and update channel) that testers install next to the production app.
// See docs/RELEASING.md.
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

// Android versionCode; CI passes the GitHub Actions run number.
const BUILD_NUMBER = Number(process.env.BUILD_NUMBER) || undefined;

// Property and referral links on www.gida.apartments are verified for the
// production app only; Preview must not take them over.
const productionAppLinks: NonNullable<NonNullable<ExpoConfig['android']>['intentFilters']> = [
  // Property deep links — www only (apex redirects → can't be autoVerified)
  {
    action: 'VIEW',
    autoVerify: true,
    category: ['BROWSABLE', 'DEFAULT'],
    data: [
      {
        scheme: 'https',
        host: 'www.gida.apartments',
        pathPrefix: '/property/',
      },
    ],
  },
  // Referral deep links — www only
  {
    action: 'VIEW',
    autoVerify: true,
    category: ['BROWSABLE', 'DEFAULT'],
    data: [
      {
        scheme: 'https',
        host: 'www.gida.apartments',
        pathPrefix: '/r/',
      },
    ],
  },
];

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_PREVIEW ? `${config.name ?? 'Gida'} Preview` : config.name ?? 'gida',
  slug: 'gida',
  // Explicit URL scheme so Paystack's post-payment redirect
  // (gida://property/location-unlock-callback?...) is recognized by the OS
  // and hands the user back to the app from the payment browser tab.
  // Preview keeps it too: production users only have one app installed, and
  // testers get Android's "open with" chooser after paying in Preview.
  scheme: 'gida',
  runtimeVersion: {
    policy: 'appVersion',
  },
  updates: {
    ...config.updates,
    enabled: true,
    url: `https://u.expo.dev/${process.env.EXPO_PROJECT_ID ?? '010b9c26-acf0-4e9c-b630-247857b66151'}`,
    requestHeaders: {
      ...config.updates?.requestHeaders,
      'expo-channel-name': process.env.EXPO_UPDATES_CHANNEL ?? (IS_PREVIEW ? 'preview' : 'production'),
    },
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 0,
  },
  extra: {
    ...config.extra,
    eas: {
      ...config.extra?.eas,
      projectId: process.env.EXPO_PROJECT_ID ?? '010b9c26-acf0-4e9c-b630-247857b66151',
    },
  },
  ios: {
    ...config.ios,
    bundleIdentifier: IS_PREVIEW ? `${config.ios?.bundleIdentifier}.preview` : config.ios?.bundleIdentifier,
  },
  android: {
    ...config.android,
    package: IS_PREVIEW ? `${config.android?.package}.preview` : config.android?.package,
    versionCode: BUILD_NUMBER ?? config.android?.versionCode,
    intentFilters: [
      ...(IS_PREVIEW ? [] : productionAppLinks),
      // Custom-scheme fallback for referral (gida://referral?code=…)
      {
        action: 'VIEW',
        category: ['BROWSABLE', 'DEFAULT'],
        data: [
          {
            scheme: 'gida',
            host: 'referral',
          },
        ],
      },
      // Deep link for the payment callback: lets the Paystack checkout tab
      // redirect (gida://property/location-unlock-callback?...) reopen the app.
      {
        action: 'VIEW',
        category: ['BROWSABLE', 'DEFAULT'],
        data: [
          {
            scheme: 'gida',
            host: 'property',
            pathPrefix: '/location-unlock-callback',
          },
        ],
      },
    ],
  },
});

// iOS reminder: before iOS rollout, add associatedDomains for applinks:gida.apartments
// and host the Apple App Site Association file. iOS linking is intentionally not configured yet.
