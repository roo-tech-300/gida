import React from 'react';
import { StyleSheet, Text, View, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

interface Props {
  matchingMode: 'open_pool' | 'friends';
  onChangeMatchingMode: (mode: 'open_pool' | 'friends') => void;
  intentSize: number;
  friendCode: string;
  onChangeFriendCode: (code: string) => void;
  propertyTier: number;
}

export function RoommateLinkCard({
  matchingMode,
  onChangeMatchingMode,
  intentSize,
  friendCode,
  onChangeFriendCode,
  propertyTier,
}: Props) {
  const isMultiSlot = intentSize > 1;
  const isOddCapacity = propertyTier % 2 !== 0;

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
            <Text style={styles.detailTitle}>Automated Classmate Matching</Text>
            <Text style={styles.detailDesc}>
              We automatically pair your reserved slot with compatible, verified classmates based on study habits and schedule. No group codes needed!
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.friendsContainer}>
          {isOddCapacity && isMultiSlot && (
            <View style={styles.oddNotice}>
              <Text style={styles.oddNoticeText}>
                💡 <Text style={{ fontWeight: '700' }}>Fair Rent Policy:</Text> Selecting multiple slots in this {propertyTier}-slot suite automatically divides rent equally across individual student invoices.
              </Text>
            </View>
          )}

          {isMultiSlot ? (
            <View style={styles.detailCard}>
              <Ionicons name="checkmark-circle" size={22} color={DesignColors.primaryBright} />
              <View style={styles.detailTextWrap}>
                <Text style={styles.detailTitle}>Separate Student Invoices</Text>
                <Text style={styles.detailDesc}>
                  Reserving {intentSize} individual slots for your group. Each classmate pays their share independently via your Group Code.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.joinSection}>
              <Text style={styles.inputLabel}>JOIN A FRIEND&apos;S APARTMENT GROUP:</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Group Code (e.g., GIDA-GRP-8291)"
                placeholderTextColor={DesignColors.onSurfaceVariant}
                value={friendCode}
                onChangeText={onChangeFriendCode}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <Text style={styles.hintText}>
                Tip: Select 2 or more slots below to start your own group with separate classmate billing.
              </Text>
            </View>
          )}
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
  oddNotice: { backgroundColor: DesignColors.surfaceContainerHigh, padding: 10, borderRadius: DesignRadius.sm, borderLeftWidth: 3, borderLeftColor: DesignColors.secondary },
  oddNoticeText: { ...DesignTypography.labelSm, color: DesignColors.onSurface, lineHeight: 18 },
  detailCard: { flexDirection: 'row', gap: DesignSpacing.sm, backgroundColor: DesignColors.surfaceContainerLowest, padding: DesignSpacing.sm, borderRadius: DesignRadius.sm, borderWidth: 1, borderColor: DesignColors.primaryBright },
  detailTextWrap: { flex: 1, gap: 2 },
  detailTitle: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontWeight: '700', fontFamily },
  detailDesc: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, lineHeight: 18 },
  joinSection: { gap: 6 },
  inputLabel: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontSize: 11 },
  input: { backgroundColor: DesignColors.surfaceContainerLowest, borderWidth: 1, borderColor: DesignColors.cardBorder, borderRadius: DesignRadius.sm, paddingHorizontal: DesignSpacing.md, paddingVertical: DesignSpacing.sm, color: DesignColors.onSurface, ...DesignTypography.bodyMd, fontFamily },
  hintText: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontStyle: 'italic', marginTop: 2 },
});
