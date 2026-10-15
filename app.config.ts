import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'gida',
  slug: 'gida',
  // Explicit URL scheme so Paystack's post-payment redirect
  // (gida://property/location-unlock-callback?...) is recognized by the OS
  // and hands the user back to the app from the payment browser tab.
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
      'expo-channel-name': process.env.EXPO_UPDATES_CHANNEL ?? 'production',
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
  android: {
    ...config.android,
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        category: ['BROWSABLE', 'DEFAULT'],
        data: [
          {
            scheme: 'https',
            host: 'gida.apartments',
            pathPrefix: '/property/',
          },
        ],
      },
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
