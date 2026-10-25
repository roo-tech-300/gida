import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

import { AnimatedErrorModal } from '@/components/ui/animated-error-modal';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useAuth } from '@/context/auth-context';
import {
  adminLodgeApplicationRoute,
  applicantLodgeApplicationRoute,
  resolveLodgeApplicationCreditId,
  resolveLodgeApplicationPodId,
} from '@/services/lodge-application-route';
import type { LodgeDecisionAttachment } from '@/types/messages';

type CardError = { title: string; message: string };

/**
 * Renders the admin's decision on a lodge application.
 *
 * Routing is sender-aware:
 *   - the admin (sender) reopens the pod in the review queue,
 *   - the applicant (recipient) jumps to the payment screen, which already
 *     renders the approved / rejected / pending states.
 *
 * Route ownership is centralized in @/services/lodge-application-route so the DM
 * lands on exactly the same `/admin/lodge-reservation/:podId` route used from the
 * Applications queue. Legacy decision DMs that predate the `creditId` field have
 * their credit id resolved against `pod_members` before navigating.
 *
 * Admin identity is checked against `admin_profiles` directly so a cached/stale
 * profile cannot route an admin to the applicant pay-slot screen.
 */
export function MessageLodgeDecisionCard({
  attachment,
  isMe = false,
}: {
  attachment: LodgeDecisionAttachment;
  isMe?: boolean;
}) {
  const router = useRouter();
  const { profile } = useAuth();
  const [error, setError] = useState<CardError | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const approved = attachment.decision === 'accepted';
  const accent = approved ? DesignColors.success : DesignColors.error;

  const checkIsAdmin = async (): Promise<boolean> => {
    if (profile?.is_admin) return true;
    if (!profile?.id) return false;
    try {
      const { data: adminRow } = await supabase
        .from('admin_profiles')
        .select('id')
        .eq('id', profile.id)
        .maybeSingle();
      return Boolean(adminRow);
    } catch (err) {
      console.error('[LodgeDecisionCard] Admin check failed:', err);
      return false;
    }
  };

  const handlePress = async () => {
    if (isResolving) return;
    setIsResolving(true);
    setError(null);
    try {
      const isAdmin = await checkIsAdmin();
      if (isMe || isAdmin) {
        // The sender is the admin who made the decision.
        const podId = await resolveLodgeApplicationPodId({
          podId: attachment.podId || undefined,
          creditId: attachment.creditId || undefined,
        });
        if (!podId) {
          setError({
            title: 'Application not found',
            message: "We couldn't match this decision to an application. Open the Applications queue to find it.",
          });
          return;
        }
        router.push(adminLodgeApplicationRoute(podId));
        return;
      }

      const creditId = await resolveLodgeApplicationCreditId({
        podId: attachment.podId || undefined,
        creditId: attachment.creditId || undefined,
        userId: profile?.id ?? null,
      });
      if (!creditId) {
        setError({
          title: 'Payment link unavailable',
          message: "We couldn't find the payment details for this application. Open your reservations from the property page to continue.",
        });
        return;
      }
      router.push(applicantLodgeApplicationRoute(creditId));
    } catch (err) {
      console.error('[LodgeDecisionCard] Failed to open application:', err);
      setError({
        title: 'Could not open application',
        message: 'Please try again, or open the Applications queue to find this application.',
      });
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <>
      <Pressable
        testID="lodge-decision-card"
        style={({ pressed }) => [styles.card, isMe && styles.cardMe, pressed && styles.cardPressed]}
        onPress={handlePress}
        disabled={isResolving}
      >
        {attachment.image ? (
          <Image source={{ uri: attachment.image }} style={styles.image} contentFit="cover" transition={150} />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Ionicons
              name={approved ? 'checkmark-circle-outline' : 'close-circle-outline'}
              size={24}
              color={accent}
            />
          </View>
        )}

        <View style={styles.body}>
          <View style={[styles.badge, { borderColor: accent, backgroundColor: approved ? DesignColors.successContainer : undefined }]}>
            <Ionicons
              name={approved ? 'checkmark-circle-outline' : 'close-circle-outline'}
              size={11}
              color={accent}
            />
            <Text style={[styles.badgeText, { color: approved ? DesignColors.primary : accent, fontWeight: '700' }]}>
              {approved ? 'Accepted' : 'Declined'}
            </Text>
          </View>

          <Text style={styles.title} numberOfLines={2}>{attachment.title}</Text>

          {!approved && attachment.reason ? (
            <Text style={styles.reason} numberOfLines={3}>{attachment.reason}</Text>
          ) : null}

          <Text style={styles.caption} numberOfLines={2}>
            {isMe
              ? 'Tap to reopen this application in the review queue.'
              : approved
                ? 'Your application has been accepted — tap to complete payment.'
                : 'Your application was not accepted — tap to view status.'}
          </Text>
        </View>
      </Pressable>

      {isResolving ? (
        <View style={styles.resolvingOverlay}>
          <ActivityIndicator size="small" color={DesignColors.primary} />
        </View>
      ) : null}

      {error ? (
        <AnimatedErrorModal
          visible
          onClose={() => setError(null)}
          title={error.title}
          message={error.message}
          testID="lodge-decision-error"
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minWidth: 240,
    maxWidth: 340,
    flexDirection: 'column',
    backgroundColor: DesignColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    borderRadius: DesignRadius.lg,
    overflow: 'hidden',
    marginBottom: DesignSpacing.xs,
  },
  cardMe: {
    backgroundColor: DesignColors.primaryTint,
    borderColor: DesignColors.primaryTint,
  },
  cardPressed: {
    opacity: 0.85,
  },
  image: {
    width: '100%',
    height: 84,
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    gap: 6,
    paddingHorizontal: DesignSpacing.sm,
    paddingVertical: DesignSpacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: DesignRadius.full,
    borderWidth: 1,
    borderColor: DesignColors.secondary,
  },
  badgeText: {
    ...DesignTypography.labelSm,
    fontFamily,
    fontWeight: '700',
  },
  title: {
    ...DesignTypography.labelLg,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
    marginTop: 2,
  },
  reason: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    lineHeight: 20,
  },
  caption: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    lineHeight: 20,
    marginTop: 2,
  },
  resolvingOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
});
