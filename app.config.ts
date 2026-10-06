import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'gida',
  slug: 'gida',
  runtimeVersion: {
    policy: 'appVersion',
  },
  updates: {
    ...config.updates,
    url: `https://u.expo.dev/${process.env.EXPO_PROJECT_ID ?? '010b9c26-acf0-4e9c-b630-247857b66151'}`,
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
    ],
  },
});

// iOS reminder: before iOS rollout, add associatedDomains for applinks:gida.apartments
// and host the Apple App Site Association file. iOS linking is intentionally not configured yet.
