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

/** react-native-safe-area-context reads native insets that do not exist in the test runner. */
jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  return {
    ...actual,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

/** react-native-reanimated touches native worklets that do not exist in the test runner. */
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    ...React,
    View,
    Animated: {
      View,
      spring: jest.fn(),
      timing: jest.fn(),
      decay: jest.fn(),
      delay: jest.fn(),
      sequence: jest.fn(),
      parallel: jest.fn(),
      event: jest.fn(),
    },
    useSharedValue: () => ({ value: 0 }),
    useAnimatedStyle: () => ({}),
    useAnimatedReaction: jest.fn(),
    useAnimatedGestureHandler: () => ({}),
    withSpring: (value) => value,
    withTiming: (value) => value,
    withDecay: (value) => value,
    runOnJS: (fn) => fn,
    runOnUI: (fn) => fn,
    cancelAnimation: jest.fn(),
  };
});

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
