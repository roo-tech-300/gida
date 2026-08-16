import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useVerifyLocationPayment } from '@/hooks/use-location-access';

type Status = 'verifying' | 'unlocked' | 'failed';

export default function LocationUnlockCallbackScreen() {
  const params = useLocalSearchParams<{
    listingId?: string;
    reference?: string;
    trxref?: string;
    kind?: string;
    bookingId?: string;
    date?: string;
    time?: string;
  }>();
  const { mutateAsync: verify } = useVerifyLocationPayment();
  const [status, setStatus] = useState<Status>('verifying');

  const listingId = params.listingId ?? '';
  const reference = params.reference ?? params.trxref ?? '';
  const kind = params.kind === 'tour' ? 'tour' : 'location';

  useEffect(() => {
    if (!reference || !listingId) {
      setStatus('failed');
      return;
    }
    let cancelled = false;
    verify(reference)
      .then((result) => {
        if (cancelled) return;
        if (result.unlocked && result.kind === 'tour') {
          router.replace(
            `/property/tour-pass?id=${encodeURIComponent(listingId)}&bookingId=${encodeURIComponent(result.bookingId ?? '')}&date=${encodeURIComponent(params.date ?? '')}&time=${encodeURIComponent(params.time ?? '')}`,
          );
          return;
        }
        setStatus(result.unlocked ? 'unlocked' : 'failed');
      })
      .catch(() => {
        if (!cancelled) setStatus('failed');
      });
    return () => {
      cancelled = true;
    };
  }, [reference, listingId, verify, params.date, params.time, params.bookingId]);

  const goToProperty = () => {
    router.replace({ pathname: '/property/[id]', params: { id: listingId } });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        {status === 'verifying' && (
          <>
            <View style={styles.badge}>
              <ActivityIndicator color={DesignColors.primaryBright} />
            </View>
            <Text style={styles.title}>Confirming your payment</Text>
            <Text style={styles.subtitle}>Verifying your unlock for this property…</Text>
          </>
        )}

        {status === 'unlocked' && (
          <>
            <View style={styles.badge}>
              <Ionicons name="checkmark-done" size={40} color={DesignColors.onPrimary} />
            </View>
            <Text style={styles.title}>Location Unlocked</Text>
            <Text style={styles.subtitle}>
              You now have access to the exact GPS coordinates and directions for this property.
            </Text>
          </>
        )}

        {status === 'failed' && (
          <>
            <View style={[styles.badge, styles.badgeError]}>
              <Ionicons name="alert-circle-outline" size={40} color={DesignColors.error} />
            </View>
            <Text style={styles.title}>Payment not found</Text>
            <Text style={styles.subtitle}>
              We couldn&apos;t confirm your payment. If you were charged, your unlock will appear automatically.
            </Text>
          </>
        )}
      </View>

      {status !== 'verifying' && (
        <View style={styles.footer}>
          <Pressable accessibilityRole="button" style={styles.button} onPress={goToProperty}>
            <Ionicons name="arrow-back" size={18} color={DesignColors.onPrimary} />
            <Text style={styles.buttonText}>{kind === 'tour' ? 'Back to Property' : 'Back to Property'}</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surface },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DesignSpacing.xl,
    gap: DesignSpacing.md,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primary,
    marginBottom: DesignSpacing.sm,
  },
  badgeError: {
    backgroundColor: DesignColors.dangerContainer,
  },
  title: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  footer: {
    paddingHorizontal: DesignSpacing.xl,
    paddingBottom: DesignSpacing.xl,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSpacing.sm,
    height: 54,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.primary,
  },
  buttonText: {
    ...DesignTypography.labelLg,
    color: DesignColors.onPrimary,
    fontFamily,
    fontWeight: '700',
  },
});
