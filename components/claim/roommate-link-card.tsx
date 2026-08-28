import React from 'react';
import { StyleSheet, Text, View, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

interface Props {
  matchingMode: 'open_pool' | 'friends';
  onChangeMatchingMode: (mode: 'open_pool' | 'friends') => void;
  friendCode: string;
  onChangeFriendCode: (code: string) => void;
}

export function RoommateLinkCard({
  matchingMode,
  onChangeMatchingMode,
  friendCode,
  onChangeFriendCode,
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>HOW WOULD YOU LIKE TO MOVE IN?</Text>
      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tabButton, matchingMode === 'open_pool' && styles.tabActive]}
          onPress={() => onChangeMatchingMode('open_pool')}
        >
          <Ionicons name="person-outline" size={16} color={matchingMode === 'open_pool' ? DesignColors.onPrimaryContainer : DesignColors.onSurfaceVariant} />
          <Text style={[styles.tabText, matchingMode === 'open_pool' && styles.tabTextActive]}>Solo & Match</Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, matchingMode === 'friends' && styles.tabActive]}
          onPress={() => onChangeMatchingMode('friends')}
        >
          <Ionicons name="people-outline" size={18} color={matchingMode === 'friends' ? DesignColors.onPrimaryContainer : DesignColors.onSurfaceVariant} />
          <Text style={[styles.tabText, matchingMode === 'friends' && styles.tabTextActive]}>With Friends</Text>
        </Pressable>
      </View>

      {matchingMode === 'open_pool' ? (
        <View style={styles.detailCard}>
          <Ionicons name="sparkles" size={22} color={DesignColors.primaryBright} />
          <View style={styles.detailTextWrap}>
            <Text style={styles.detailTitle}>Automated Matchmaking</Text>
            <Text style={styles.detailDesc}>
              We will automatically pair your slot with compatible, verified classmates based on study habits and schedule.
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.friendsContainer}>
          <View style={styles.detailCard}>
            <Ionicons name="link-outline" size={22} color={DesignColors.primaryBright} />
            <View style={styles.detailTextWrap}>
              <Text style={styles.detailTitle}>Link with Friends</Text>
              <Text style={styles.detailDesc}>
                Securing your spot... You will receive an Invite Code after checkout to send to a friend so they can claim the other spot in your arrangement!
              </Text>
            </View>
          </View>

          <View style={styles.joinSection}>
            <Text style={styles.inputLabel}>ALREADY HAVE AN INVITE CODE?</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Code (e.g., GIDA-GRP-8291)"
              placeholderTextColor={DesignColors.onSurfaceVariant}
              value={friendCode}
              onChangeText={onChangeFriendCode}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: DesignColors.surfaceContainerLow, borderRadius: DesignRadius.md, padding: DesignSpacing.md, borderWidth: 1, borderColor: DesignColors.cardBorder, gap: DesignSpacing.sm },
  sectionTitle: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily },
  tabRow: { flexDirection: 'row', backgroundColor: DesignColors.surfaceContainerLowest, borderRadius: DesignRadius.sm, padding: 4, borderWidth: 1, borderColor: DesignColors.cardBorder, gap: 4 },
  tabButton: { flex: 1, paddingVertical: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, borderRadius: DesignRadius.sm },
  tabActive: { backgroundColor: DesignColors.primaryContainer },
  tabText: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontWeight: '600', fontFamily },
  tabTextActive: { color: DesignColors.onPrimaryContainer, fontWeight: '700' },
  friendsContainer: { gap: DesignSpacing.sm, marginTop: 2 },
  detailCard: { flexDirection: 'row', gap: DesignSpacing.sm, backgroundColor: DesignColors.surfaceContainerLowest, padding: DesignSpacing.sm, borderRadius: DesignRadius.sm, borderWidth: 1, borderColor: DesignColors.primaryBright },
  detailTextWrap: { flex: 1, gap: 2 },
  detailTitle: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontWeight: '700', fontFamily },
  detailDesc: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, lineHeight: 18 },
  joinSection: { gap: 6, marginTop: DesignSpacing.xs },
  inputLabel: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontSize: 11 },
  input: { backgroundColor: DesignColors.surfaceContainerLowest, borderWidth: 1, borderColor: DesignColors.cardBorder, borderRadius: DesignRadius.sm, paddingHorizontal: DesignSpacing.md, paddingVertical: DesignSpacing.sm, color: DesignColors.onSurface, ...DesignTypography.bodyMd, fontFamily },
});
