import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { DesignColors, fontFamily } from '@/constants/design';
import { useUnreadMessages } from '@/hooks/use-unread-messages';

type IconName = keyof typeof Ionicons.glyphMap;

const TAB_BAR_HEIGHT = 72;

function tabIcon(filled: IconName, outline: IconName) {
  return function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Ionicons name={focused ? filled : outline} size={24} color={color} />;
  };
}

export default function TabLayout() {
  const unread = useUnreadMessages();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: DesignColors.primaryBright,
        tabBarInactiveTintColor: DesignColors.outline,
        tabBarLabelStyle: { fontFamily, fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: DesignColors.surfaceContainerLowest,
          borderTopColor: DesignColors.borderSoft,
          borderTopWidth: 1,
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 6),
        },
        sceneStyle: { backgroundColor: DesignColors.surfaceContainerLowest },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Discover', tabBarIcon: tabIcon('compass', 'compass-outline') }} />
      <Tabs.Screen name="my-home" options={{ title: 'My Home', tabBarIcon: tabIcon('home', 'home-outline') }} />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Chats',
          tabBarIcon: tabIcon('chatbubble', 'chatbubble-outline'),
          tabBarBadge: unread > 0 ? (unread > 9 ? '9+' : unread) : undefined,
          tabBarBadgeStyle: { backgroundColor: DesignColors.primary, color: DesignColors.onPrimary, fontFamily, fontWeight: '800' },
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('person', 'person-outline') }} />
      {/* Template leftover, not a real destination. */}
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
