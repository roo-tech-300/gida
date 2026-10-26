import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { DesignColors, fontFamily } from '@/constants/design';

type PlaceCreatorProps = {
  creatorId: string;
  creatorUsername: string | null;
  creatorName: string | null;
  creatorAvatarUrl: string | null;
};

export function PlaceCreator({
  creatorUsername,
  creatorName,
  creatorAvatarUrl,
}: PlaceCreatorProps) {
  const displayName = creatorUsername ?? creatorName ?? 'Unknown';
  const initialsName = creatorName ?? creatorUsername ?? '';

  return (
    <View style={styles.container}>
      <Avatar imageUrl={creatorAvatarUrl} name={initialsName} size={24} />
      <Text style={styles.username}>{displayName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  username: {
    fontSize: 12,
    fontWeight: '600',
    color: DesignColors.textPrimary,
    fontFamily,
  },
});
