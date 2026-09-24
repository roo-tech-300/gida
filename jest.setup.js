/* global jest */
jest.mock('expo-sqlite/localStorage/install', () => {});

const AuthorizationStatus = {
  NOT_DETERMINED: -1,
  DENIED: 0,
  AUTHORIZED: 1,
  PROVISIONAL: 2,
  EPHEMERAL: 3,
};

jest.mock('@react-native-firebase/messaging', () => ({
  __esModule: true,
  AuthorizationStatus,
  getMessaging: jest.fn(() => {
    throw new Error('messaging unavailable in tests');
  }),
  getToken: jest.fn(),
  hasPermission: jest.fn(),
  requestPermission: jest.fn(),
  onMessage: jest.fn(() => jest.fn()),
  onTokenRefresh: jest.fn(() => jest.fn()),
  registerDeviceForRemoteMessages: jest.fn(async () => {}),
}));

process.env.EXPO_PUBLIC_SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'test-anon-key';

const memoryStore = new Map();
global.localStorage = {
  getItem: (key) => (memoryStore.has(key) ? memoryStore.get(key) : null),
  setItem: (key, value) => {
    memoryStore.set(key, String(value));
  },
  removeItem: (key) => {
    memoryStore.delete(key);
  },
  clear: () => {
    memoryStore.clear();
  },
};
