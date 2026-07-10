import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type BottomTab = 'discover' | 'messages' | 'saved' | 'profile';

export function DiscoverBottomNav({ activeTab = 'discover' }: { activeTab?: BottomTab }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const navigate = (tab: BottomTab) => {
    const routes: Partial<Record<BottomTab, Href>> = {
      discover: '/(tabs)',
      messages: '/(tabs)/messages',
      saved: '/(tabs)/saved',
      profile: '/(tabs)/profile',
    };

    const route = routes[tab];
    if (route) {
      router.replace(route);
    }
  };

  return (
    <View style={[styles.nav, { paddingBottom: Math.max(insets.bottom, DesignSpacing.sm) }]}>
      <NavItem icon="compass-outline" label="Discover" active={activeTab === 'discover'} onPress={() => navigate('discover')} />
      <NavItem icon="chatbubble-outline" label="Messages" active={activeTab === 'messages'} onPress={() => navigate('messages')} />
      <NavItem icon="heart-outline" label="Saved" active={activeTab === 'saved'} onPress={() => navigate('saved')} />
      <NavItem icon="person-outline" label="Profile" active={activeTab === 'profile'} onPress={() => navigate('profile')} />
    </View>
  );
}

function NavItem({
  icon,
  label,
  active = false,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.item}>
      <Ionicons name={icon} size={22} color={active ? DesignColors.primaryBright : DesignColors.onSurfaceVariant} />
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: DesignSpacing.sm,
    paddingTop: DesignSpacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderTopWidth: 1,
    borderTopColor: DesignColors.cardBorder,
  },
  item: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  label: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  labelActive: {
    color: DesignColors.onSurface,
    fontWeight: '700',
  },
});
