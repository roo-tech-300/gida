/* global jest */
jest.mock('expo-sqlite/localStorage/install', () => {});

jest.mock('@react-native-firebase/messaging', () => ({
  __esModule: true,
  default: {
    requestPermission: jest.fn(),
    getToken: jest.fn(),
    send: jest.fn(),
    onMessage: jest.fn(),
    onNotificationOpenedApp: jest.fn(),
    getInitialNotification: jest.fn(),
    authorizationStatus: { AUTHORIZED: 1, PROVISIONAL: 2 },
  },
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
