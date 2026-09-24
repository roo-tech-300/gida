import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { SlotCredit } from '@/types/liquidity';

type Props = {
  expiredLodges: SlotCredit[];
};

function isExpiredWithin48h(credit: SlotCredit): boolean {
  const fortyEightHoursMs = 48 * 60 * 60 * 1000;

  // Primary: check expired_at
  if (credit.expired_at) {
    const expiredTime = new Date(credit.expired_at).getTime();
    const within48h = Date.now() - expiredTime <= fortyEightHoursMs;
    const expiredDate = new Date(credit.expired_at).toLocaleString();
    console.log('[Marquee] Checking reservation ' + credit.id + ': expired_at=' + expiredDate + ' within 48h: ' + within48h);
    return within48h;
  }

  // Fallback: check payment_deadline if expired_at is null
  if (!credit.expired_at && credit.payment_deadline) {
    const paymentDeadline = new Date(credit.payment_deadline).getTime();
    const within48h = Date.now() - paymentDeadline <= fortyEightHoursMs;
    const paymentDeadlineDate = new Date(credit.payment_deadline).toLocaleString();
    console.log('[Marquee] Checking reservation ' + credit.id + ': expired_at=null, using payment_deadline=' + paymentDeadlineDate + ' within 48h: ' + within48h);
    return within48h;
  }

  // Neither timestamp available
  console.log('[Marquee] Checking reservation ' + credit.id + ': no expired_at or payment_deadline - not showing in banner');
  return false;
}

export function ExpiredMarqueeBanner({ expiredLodges }: Props) {
  if (expiredLodges.length === 0) return null;

  const lodgesToShow = expiredLodges.filter((credit) => isExpiredWithin48h(credit));
  if (lodgesToShow.length === 0) return null;

  const message = lodgesToShow
    .map((credit) => `Reservation in ${credit.estate?.name ?? 'your lodge'} has expired`)
    .join('     •     ');
  const repeatedMessage = `${message}     •     ${message}`;

  return (
    <View style={styles.banner}>
      <View style={styles.iconWrap}>
        <Ionicons name="time-outline" size={17} color={DesignColors.danger} />
      </View>
      <View style={styles.trackViewport}>
        <MarqueeTrack text={repeatedMessage} />
      </View>
    </View>
  );
}

function MarqueeTrack({ text }: { text: string }) {
  const [offset] = useState(() => new Animated.Value(0));
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    if (!trackWidth) return;

    const animation = Animated.loop(
      Animated.timing(offset, {
        toValue: -trackWidth / 2,
        duration: Math.max(12000, trackWidth * 22),
        useNativeDriver: true,
      }),
    );
    animation.start();

    return () => animation.stop();
  }, [offset, trackWidth]);

  return (
    <Animated.View
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      style={[styles.track, { transform: [{ translateX: offset }] }]}
    >
      <Text style={styles.message} numberOfLines={1}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    paddingHorizontal: DesignSpacing.md,
    marginBottom: DesignSpacing.sm,
    backgroundColor: '#2b171b',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 180, 171, 0.22)',
  },
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: DesignRadius.full,
    backgroundColor: 'rgba(255, 180, 171, 0.14)',
  },
  trackViewport: {
    flex: 1,
    overflow: 'hidden',
  },
  track: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
  },
  message: {
    ...DesignTypography.labelLg,
    color: DesignColors.danger,
    fontFamily,
    letterSpacing: 0.1,
    paddingRight: DesignSpacing.xl,
  },
});