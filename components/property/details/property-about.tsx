import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignSpacing, fontFamily } from '@/constants/design';
import { SectionLabel } from './section-label';

const COLLAPSED_LINES = 3;
/** Roughly three lines on a phone; shorter text never needs the toggle. */
const LONG_TEXT = 150;

export function PropertyAbout({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false);
  if (!description) return null;
  const isLong = description.length > LONG_TEXT;

  return (
    <View style={styles.section}>
      <SectionLabel>ABOUT THIS PLACE</SectionLabel>
      <Text style={styles.text} numberOfLines={expanded || !isLong ? undefined : COLLAPSED_LINES}>{description}</Text>
      {isLong ? (
        <Pressable accessibilityRole="button" onPress={() => setExpanded((value) => !value)} hitSlop={8}>
          <Text style={styles.toggle}>{expanded ? 'Show less' : 'Read more'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: DesignSpacing.lg, gap: DesignSpacing.sm },
  text: { fontFamily, fontSize: 14, lineHeight: 21, color: DesignColors.onSurfaceVariant },
  toggle: { fontFamily, fontSize: 13, fontWeight: '700', color: DesignColors.primaryFixed },
});
