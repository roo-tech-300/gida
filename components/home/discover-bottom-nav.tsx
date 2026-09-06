import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useUnreadMessages } from '@/hooks/use-unread-messages';

type BottomTab = 'discover' | 'messages' | 'saved' | 'profile';

export function DiscoverBottomNav({ activeTab = 'discover' }: { activeTab?: BottomTab }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const unreadCount = useUnreadMessages();

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
      <NavItem icon="chatbubble-outline" label="Messages" active={activeTab === 'messages'} onPress={() => navigate('messages')} showDot={unreadCount > 0} />
      <NavItem icon="heart-outline" label="Saved" active={activeTab === 'saved'} onPress={() => navigate('saved')} />
      <NavItem icon="person-outline" label="Profile" active={activeTab === 'profile'} onPress={() => navigate('profile')} />
    </View>
  );
}

function NavItem({
  icon,
  label,
  active = false,
  showDot = false,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  showDot?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.item}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={22} color={active ? DesignColors.primaryBright : DesignColors.onSurface} />
        {showDot ? <View style={styles.dot} testID={`nav-dot-${label}`} /> : null}
      </View>
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
    backgroundColor: DesignColors.scrimDeep,
    borderTopWidth: 1,
    borderTopColor: DesignColors.cardBorder,
  },
  item: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  iconWrap: {
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DesignColors.primary,
  },
  label: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurface,
    fontFamily,
  },
  labelActive: {
    color: DesignColors.primaryBright,
    fontWeight: '700',
  },
});
