import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, fontFamily } from '@/constants/design';
import { formatNaira } from '@/utils/format-naira';
import { toCdnImageUrl } from '@/utils/image-cdn';
import type { InvitePage } from '@/utils/invite-parse';

type Props = { page: InvitePage; busy: boolean; onJoin: () => void; onViewPlace?: () => void };

function Avatars({ initials, target }: { initials: string[]; target: number }) {
  const open = Math.max(0, target - initials.length);
  return (
    <View style={styles.avatars}>
      {initials.map((text, i) => (
        <View key={`m${i}`} style={styles.avatar}><Text style={styles.avatarText}>{text}</Text></View>
      ))}
      {Array.from({ length: open }, (_, i) => <View key={`o${i}`} style={[styles.avatar, styles.avatarOpen]} />)}
    </View>
  );
}

/** What a friend sees first: the place, their share, who is in, and one button. */
export function InviteLanding({ page, busy, onJoin, onViewPlace }: Props) {
  const lock = page.gender === 'FEMALE' ? 'Women-only household' : page.gender === 'MALE' ? 'Men-only household' : null;
  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        {page.image ? <Image source={{ uri: toCdnImageUrl(page.image) }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="disk" transition={300} /> : null}
        {lock ? <View style={styles.lock}><Text style={styles.lockText}>{lock}</Text></View> : null}
      </View>
      <View style={styles.sheet}>
        <Text style={styles.eyebrow}>{page.inviter ? `${page.inviter.toUpperCase()} INVITED YOU` : 'YOU ARE INVITED'}</Text>
        <Text style={styles.title} accessibilityRole="header">{page.title}</Text>
        <View style={styles.row}>
          <Ionicons name="location-outline" size={16} color={DesignColors.primaryBright} />
          <Text style={styles.location}>{page.location}</Text>
        </View>
        <View style={styles.priceCard}>
          <View>
            <Text style={styles.price}>{formatNaira(page.share)}</Text>
            <Text style={styles.priceNote}>your share · per year</Text>
          </View>
          <View style={styles.whole}>
            <Text style={styles.wholeLabel}>Whole place</Text>
            <Text style={styles.wholePrice}>{formatNaira(page.rent)}</Text>
          </View>
        </View>
        <View style={styles.householdCard}>
          <Avatars initials={page.members} target={page.target} />
          <View>
            <Text style={styles.householdTitle}>{page.joined} of {page.target} joined</Text>
            <Text style={styles.householdSub}>{page.openSeats} {page.openSeats === 1 ? 'seat' : 'seats'} open</Text>
          </View>
        </View>
        <View style={styles.row}>
          <Ionicons name="time-outline" size={16} color={DesignColors.warning} />
          <Text style={styles.clock}>You get 24 hours to pay after you join.</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={onJoin} disabled={busy} style={[styles.cta, busy && styles.ctaBusy]}>
          {busy ? <ActivityIndicator color={DesignColors.onPrimary} /> : <Text style={styles.ctaText}>Join and pay {formatNaira(page.share)}</Text>}
        </Pressable>
        {onViewPlace ? (
          <Pressable accessibilityRole="link" onPress={onViewPlace} hitSlop={8} style={styles.linkWrap}>
            <Text style={styles.link}>See the place first</Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: DesignSpacing.xl },
  hero: { height: 220, backgroundColor: DesignColors.surfaceContainerHigh },
  lock: { position: 'absolute', left: DesignSpacing.md, top: DesignSpacing.md, height: 26, paddingHorizontal: 12, borderRadius: 13, justifyContent: 'center', backgroundColor: DesignColors.scrimHeavy },
  lockText: { fontFamily, fontSize: 12, fontWeight: '700', color: DesignColors.warning },
  sheet: { marginTop: -24, gap: DesignSpacing.md, padding: DesignSpacing.marginMobile, paddingTop: DesignSpacing.lg, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: DesignColors.surface },
  eyebrow: { fontFamily, fontSize: 11, fontWeight: '700', letterSpacing: 1.6, color: DesignColors.primaryBright },
  title: { fontFamily, fontSize: 24, lineHeight: 29, fontWeight: '800', color: DesignColors.onSurface },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  location: { flex: 1, fontFamily, fontSize: 13, color: DesignColors.onSurfaceVariant },
  priceCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: DesignSpacing.md + 4, borderRadius: DesignRadius.xl - 6, backgroundColor: DesignColors.surfaceContainerLow },
  price: { fontFamily, fontSize: 28, fontWeight: '800', letterSpacing: -0.4, color: DesignColors.primaryFixed },
  priceNote: { fontFamily, fontSize: 12, color: DesignColors.onSurfaceVariant },
  whole: { alignItems: 'flex-end', gap: 2 },
  wholeLabel: { fontFamily, fontSize: 11, fontWeight: '600', color: DesignColors.outline },
  wholePrice: { fontFamily, fontSize: 15, fontWeight: '700', color: DesignColors.onSurface },
  householdCard: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.md, padding: DesignSpacing.md, borderRadius: DesignRadius.lg, backgroundColor: DesignColors.surfaceContainerLow },
  avatars: { flexDirection: 'row', gap: 6 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: DesignColors.primary },
  avatarOpen: { backgroundColor: 'transparent', borderWidth: 1.5, borderStyle: 'dashed', borderColor: DesignColors.borderStrong },
  avatarText: { fontFamily, fontSize: 13, fontWeight: '800', color: DesignColors.onPrimary },
  householdTitle: { fontFamily, fontSize: 14, fontWeight: '700', color: DesignColors.onSurface },
  householdSub: { fontFamily, fontSize: 12, color: DesignColors.outline },
  clock: { flex: 1, fontFamily, fontSize: 13, color: DesignColors.onSurfaceVariant },
  cta: { height: 52, borderRadius: DesignRadius.full, alignItems: 'center', justifyContent: 'center', marginTop: DesignSpacing.sm, backgroundColor: DesignColors.primary },
  ctaBusy: { opacity: 0.7 },
  ctaText: { fontFamily, fontSize: 16, fontWeight: '700', color: DesignColors.onPrimary },
  linkWrap: { alignSelf: 'center' },
  link: { fontFamily, fontSize: 13, fontWeight: '700', color: DesignColors.primaryFixed },
});
