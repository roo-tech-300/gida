import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
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
    ],
  },
});

// iOS reminder: before iOS rollout, add associatedDomains for applinks:gida.apartments
// and host the Apple App Site Association file. iOS linking is intentionally not configured yet.
