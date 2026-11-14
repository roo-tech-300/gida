import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SeatRow } from '@/components/invite/seat-row';
import { BackButton } from '@/components/ui/back-button';
import { useAppToast } from '@/components/ui/toast-card';
import { DesignColors, DesignRadius, DesignSpacing, fontFamily } from '@/constants/design';
import { useAuth } from '@/context/auth-context';
import { useCreateInvite, useHouseholdSeats, useRevokeInvite } from '@/hooks/use-household-invite';
import { useShareInvite } from '@/hooks/use-share-invite';
import { inviteUrlFor } from '@/services/household-invite-service';
import { formatNaira } from '@/utils/format-naira';
import { initialsOf } from '@/utils/invite-parse';
import { ghostSeatLabel, payTimeLeftLabel } from '@/utils/invite-state';

type Props = { podId: string; placeTitle: string; share: number };

const NOTE = 'A seat is held for 2 hours after you send a link, then it opens again. Once a friend joins they have 24 hours to pay, and each link works for 48 hours.';

/** The founder's view of the household: who is in, which links are out, and a button to invite another friend. */
export function FounderInviteScreen({ podId, placeTitle, share }: Props) {
  const { profile } = useAuth();
  const { showToast } = useAppToast();
  const seats = useHouseholdSeats(podId);
  const createInvite = useCreateInvite(podId);
  const revoke = useRevokeInvite();
  const sharing = useShareInvite(placeTitle, profile?.full_name?.split(' ')[0]);

  const data = seats.data;
  const openSeats = data ? Math.max(0, data.target - data.members.length - data.invites.filter((i) => i.held).length) : 0;

  const inviteNew = async () => {
    try {
      const created = await createInvite.mutateAsync();
      await sharing.share(created.url);
    } catch (error) {
      console.error('[FounderInvite] Could not create an invite:', error);
      showToast({ message: error instanceof Error ? error.message : 'Could not create an invite link.', type: 'error' });
    }
  };

  const cancel = async (id: string) => {
    try {
      await revoke.mutateAsync(id);
    } catch (error) {
      console.error('[FounderInvite] Could not cancel a link:', error);
      showToast({ message: 'Could not cancel that link. Please try again.', type: 'error' });
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <BackButton />
        <Text style={styles.title} accessibilityRole="header">Invite your housemates</Text>
        <Text style={styles.sub}>Send each friend a link. They can join and pay without browsing or typing a code.</Text>
        <View style={styles.place}>
          <Text style={styles.placeTitle} numberOfLines={1}>{placeTitle}</Text>
          <Text style={styles.placeSub}>{data ? `${data.target} people` : ''} · {formatNaira(share)} each</Text>
        </View>

        <Pressable accessibilityRole="button" onPress={inviteNew} disabled={createInvite.isPending || openSeats === 0} style={[styles.cta, (createInvite.isPending || openSeats === 0) && styles.ctaOff]}>
          {createInvite.isPending ? <ActivityIndicator color={DesignColors.onPrimary} /> : <Text style={styles.ctaText}>{openSeats === 0 ? 'Every seat is taken or held' : 'Invite a friend'}</Text>}
        </Pressable>

        {seats.isLoading ? <ActivityIndicator color={DesignColors.primary} /> : null}
        {seats.isError ? <Text style={styles.error}>{seats.error.message}</Text> : null}
        {data ? (
          <View style={styles.list}>
            <Text style={styles.label}>{`HOUSEHOLD · ${data.members.length} OF ${data.target} SEATS`}</Text>
            {data.members.map((m, i) => (
              <SeatRow
                key={`m${i}`}
                initials={m.isYou ? 'You' : initialsOf(m.name)}
                title={m.isYou ? 'You' : m.name}
                subtitle={m.state === 'paid' ? 'Paid' : m.state === 'review' ? 'Request is with Gida' : m.deadline ? payTimeLeftLabel(m.deadline) : 'Waiting to pay'}
                tone={m.state === 'paid' ? 'ok' : m.state === 'unpaid' ? 'warn' : 'neutral'}
                chip={m.state === 'paid' ? 'Paid' : m.state === 'review' ? 'In review' : undefined}
              />
            ))}
            {data.invites.map((invite) => (
              <SeatRow
                key={invite.id}
                initials="?"
                title={invite.opened ? 'Link opened' : 'Link sent'}
                subtitle={ghostSeatLabel(invite.seatHeldUntil)}
                tone={invite.held ? 'warn' : 'neutral'}
                actions={[{ label: 'Share again', onPress: () => void sharing.share(inviteUrlFor(invite.token)) }, { label: 'Cancel', onPress: () => void cancel(invite.id) }]}
              />
            ))}
            {Array.from({ length: Math.max(0, data.target - data.members.length - data.invites.length) }, (_, i) => (
              <SeatRow key={`o${i}`} open title="Seat open" subtitle="Tap Invite a friend to fill it" />
            ))}
          </View>
        ) : null}

        <Pressable accessibilityRole="button" onPress={() => router.replace('/(tabs)/my-home')} style={styles.done}>
          <Text style={styles.doneText}>Done, go to My Home</Text>
        </Pressable>

        <View style={styles.note}>
          <Ionicons name="time-outline" size={18} color={DesignColors.warning} />
          <Text style={styles.noteText}>{NOTE}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surface },
  scroll: { gap: DesignSpacing.md, padding: DesignSpacing.marginMobile, paddingBottom: DesignSpacing.xl },
  title: { fontFamily, fontSize: 26, fontWeight: '800', color: DesignColors.onSurface },
  sub: { fontFamily, fontSize: 14, lineHeight: 20, color: DesignColors.onSurfaceVariant },
  place: { gap: 2, padding: DesignSpacing.md, borderRadius: DesignRadius.lg, backgroundColor: DesignColors.surfaceContainerLow },
  placeTitle: { fontFamily, fontSize: 15, fontWeight: '700', color: DesignColors.onSurface },
  placeSub: { fontFamily, fontSize: 12, color: DesignColors.onSurfaceVariant },
  cta: { height: 52, borderRadius: DesignRadius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: DesignColors.primary },
  ctaOff: { opacity: 0.55 },
  ctaText: { fontFamily, fontSize: 16, fontWeight: '700', color: DesignColors.onPrimary },
  list: { gap: DesignSpacing.sm },
  label: { fontFamily, fontSize: 11, fontWeight: '700', letterSpacing: 1.4, color: DesignColors.outline, marginTop: DesignSpacing.sm },
  error: { fontFamily, fontSize: 13, color: DesignColors.danger },
  done: { height: 46, borderRadius: DesignRadius.full, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: DesignColors.primaryBright },
  doneText: { fontFamily, fontSize: 14, fontWeight: '700', color: DesignColors.primaryFixed },
  note: { flexDirection: 'row', gap: DesignSpacing.sm, padding: DesignSpacing.md, borderRadius: DesignRadius.lg, backgroundColor: DesignColors.surfaceContainerLow },
  noteText: { flex: 1, fontFamily, fontSize: 12, lineHeight: 17, color: DesignColors.onSurfaceVariant },
});
