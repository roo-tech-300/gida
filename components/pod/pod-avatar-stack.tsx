import { StyleSheet, Text, View } from 'react-native';

import { PodAvatar } from '@/components/pod/pod-avatar';
import { DesignColors, fontFamily } from '@/constants/design';
import type { PodMember } from '@/types/liquidity';

type Props = {
  members: readonly PodMember[];
  /** Avatar diameter in px. */
  size?: number;
  /** How many avatars to show before collapsing into a `+N` bubble. */
  max?: number;
  /** Rendered as a dashed empty seat after the avatars. */
  openSeats?: number;
  borderColor?: string;
};

/** Overlapping member avatars plus optional `+N` and empty-seat bubbles. */
export function PodAvatarStack({
  members,
  size = 26,
  max = 3,
  openSeats = 0,
  borderColor = DesignColors.surfaceContainerLow,
}: Props) {
  const shown = members.slice(0, max);
  const hidden = members.length - shown.length;
  const overlap = -Math.round(size * 0.36);

  return (
    <View style={styles.row}>
      {shown.map((member, index) => {
        const name = member.profile?.full_name || member.full_name || 'Roommate';
        const avatarUrl = member.profile?.avatar_url || member.avatar_url;

        return (
          <View
            key={member.user_id}
            style={[
              styles.slot,
              { width: size, height: size, borderRadius: size / 2, borderColor },
              index > 0 && { marginLeft: overlap },
            ]}
          >
            <PodAvatar name={name} avatarUrl={avatarUrl} size={size} />
          </View>
        );
      })}

      {hidden > 0 ? (
        <View
          style={[
            styles.bubble,
            { width: size, height: size, borderRadius: size / 2, borderColor, marginLeft: overlap },
          ]}
        >
          <Text style={[styles.bubbleText, { fontSize: Math.max(9, Math.round(size * 0.34)) }]}>
            +{hidden}
          </Text>
        </View>
      ) : null}

      {openSeats > 0 ? (
        <View
          style={[
            styles.bubble,
            styles.openSeat,
            { width: size, height: size, borderRadius: size / 2, borderColor, marginLeft: overlap },
          ]}
        >
          <Text style={[styles.bubbleText, styles.openSeatText, { fontSize: Math.max(10, Math.round(size * 0.44)) }]}>
            +
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slot: {
    borderWidth: 2,
    overflow: 'hidden',
  },
  bubble: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.surfaceContainerHigh,
    borderWidth: 2,
  },
  bubbleText: {
    fontWeight: '800',
    color: DesignColors.onSurface,
    fontFamily,
  },
  openSeat: {
    backgroundColor: DesignColors.primary,
    borderStyle: 'dashed',
    borderColor: DesignColors.primaryFixed,
  },
  openSeatText: {
    color: DesignColors.onPrimary,
  },
});
