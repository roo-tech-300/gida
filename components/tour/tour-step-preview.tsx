import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, fontFamily } from '@/constants/design';
import type { AppTourStepId } from '@/types/app-tour';

export function TourStepPreview({ stepId }: { stepId: AppTourStepId }) {
  return (
    <View style={styles.previewContainer}>
      <View style={styles.previewCard}>
        {renderPreview(stepId)}
      </View>
    </View>
  );
}

function renderPreview(stepId: AppTourStepId) {
  if (stepId === 'search') {
    return (
      <View style={styles.gap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={15} color={DesignColors.primaryBright} />
          <Text style={styles.searchText}>Bosso, Gidan Kwano, Gate 2...</Text>
          <Ionicons name="swap-vertical" size={15} color={DesignColors.onSurfaceVariant} />
        </View>
        <View style={styles.row}>
          <View style={[styles.pill, styles.pillActive]}><Text style={styles.pillActiveText}>All</Text></View>
          <View style={styles.pill}><Text style={styles.pillText}>Self-Contained</Text></View>
          <View style={styles.pill}><Text style={styles.pillText}>Flat</Text></View>
        </View>
      </View>
    );
  }

  if (stepId === 'switch-views' || stepId === 'booking') {
    const isSwitch = stepId === 'switch-views';
    return (
      <View style={styles.row}>
        <View style={styles.box}>
          <Ionicons name={isSwitch ? 'business-outline' : 'person-outline'} size={18} color={DesignColors.primaryBright} />
          <Text style={styles.title}>{isSwitch ? 'Find a Space' : 'Solo Claim'}</Text>
          <Text style={styles.sub}>{isSwitch ? 'Hostels' : 'Private'}</Text>
        </View>
        <View style={[styles.box, styles.boxActive]}>
          <Ionicons name="people-outline" size={18} color={DesignColors.onPrimaryContainer} />
          <Text style={styles.titleActive}>{isSwitch ? 'Find a Peer' : 'Shared Pod'}</Text>
          <Text style={styles.subActive}>{isSwitch ? 'Roommates' : 'Split 50/50'}</Text>
        </View>
      </View>
    );
  }

  if (stepId === 'tours') {
    return (
      <View style={styles.gap}>
        <View style={styles.optionBox}>
          <Ionicons name="calendar-outline" size={16} color={DesignColors.primaryBright} />
          <Text style={styles.optionTitle}>Assisted Tour: Walkthrough with Admin</Text>
        </View>
        <View style={[styles.optionBox, styles.optionBoxDim]}>
          <Ionicons name="navigate-outline" size={16} color={DesignColors.onSurface} />
          <Text style={styles.optionTitle}>Non-Assisted: Direct GPS Route Pass</Text>
        </View>
      </View>
    );
  }

  if (stepId === 'messages') {
    return (
      <View style={styles.optionBox}>
        <Ionicons name="chatbubble-ellipses-outline" size={16} color={DesignColors.primaryBright} />
        <Text style={styles.optionTitle}>“Hey! Want to team up for this 2-bed flat?”</Text>
      </View>
    );
  }

  if (stepId === 'saved') {
    return (
      <View style={styles.optionBox}>
        <Ionicons name="heart" size={16} color={DesignColors.primaryBright} />
        <Text style={styles.optionTitle}>Saved Lodges: Compare rent, light & water</Text>
      </View>
    );
  }

  return (
    <View style={styles.optionBox}>
      <Ionicons name="key-outline" size={16} color={DesignColors.primaryBright} />
      <Text style={[styles.optionTitle, { flex: 1 }]}>Invite Code: #POD-7821</Text>
      <View style={styles.tag}><Text style={styles.tagText}>Join</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  previewContainer: { marginVertical: DesignSpacing.xs },
  previewCard: {
    backgroundColor: DesignColors.surfaceContainerLowest,
    borderRadius: DesignRadius.md,
    borderWidth: 1,
    borderColor: DesignColors.borderSoft,
    padding: DesignSpacing.sm,
  },
  gap: { gap: 6 },
  row: { flexDirection: 'row', gap: 6 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchText: { flex: 1, fontSize: 11, color: DesignColors.onSurfaceVariant, fontFamily },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: DesignRadius.full, backgroundColor: DesignColors.surfaceContainerLow },
  pillActive: { backgroundColor: DesignColors.primaryTint },
  pillText: { fontSize: 10, color: DesignColors.onSurfaceVariant, fontFamily },
  pillActiveText: { fontSize: 10, color: DesignColors.primaryBright, fontFamily, fontWeight: '700' },
  box: { flex: 1, padding: 8, borderRadius: DesignRadius.md, backgroundColor: DesignColors.surfaceContainerLow, alignItems: 'center', gap: 2 },
  boxActive: { backgroundColor: DesignColors.primaryContainer },
  title: { fontSize: 11, color: DesignColors.onSurface, fontWeight: '700', fontFamily },
  titleActive: { fontSize: 11, color: DesignColors.onPrimaryContainer, fontWeight: '700', fontFamily },
  sub: { fontSize: 10, color: DesignColors.onSurfaceVariant, fontFamily },
  subActive: { fontSize: 10, color: DesignColors.onPrimaryContainer, fontFamily },
  optionBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: DesignColors.primaryTint, borderRadius: DesignRadius.md, padding: 8 },
  optionBoxDim: { backgroundColor: DesignColors.surfaceContainerLow },
  optionTitle: { fontSize: 11, fontWeight: '600', color: DesignColors.onSurface, fontFamily },
  tag: { backgroundColor: DesignColors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: DesignRadius.full },
  tagText: { fontSize: 10, color: DesignColors.onPrimary, fontWeight: '700', fontFamily },
});
