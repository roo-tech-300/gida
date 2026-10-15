import { useState } from 'react';
import { Pressable, StyleSheet, Text, type NativeSyntheticEvent, type StyleProp, type TextLayoutEventData, type TextStyle } from 'react-native';

import { DesignColors, DesignTypography, fontFamily } from '@/constants/design';

type Props = {
  text: string;
  /** Line cap before the text is clamped; a Read more link appears past this. */
  collapsedLines: number;
  /** Color/font overrides from the bubble (me vs them). */
  style?: StyleProp<TextStyle>;
};

/**
 * Chat body text with a line clamp and an inline Read more / Show less toggle.
 * onTextLayout reports the FULL line set even while clamped, which is how we
 * detect truncation without measuring character counts.
 */
export function MessageTruncatedText({ text, collapsedLines, style }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [truncated, setTruncated] = useState(false);

  const handleTextLayout = (event: NativeSyntheticEvent<TextLayoutEventData>) => {
    const didTruncate = event.nativeEvent.lines.length > collapsedLines;
    setTruncated((previous) => (previous === didTruncate ? previous : didTruncate));
  };

  return (
    <>
      <Text
        style={style}
        numberOfLines={expanded ? undefined : collapsedLines}
        onTextLayout={handleTextLayout}
      >
        {text}
      </Text>
      {truncated ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Show less of this message' : 'Read the full message'}
          onPress={() => setExpanded((value) => !value)}
          hitSlop={6}
          style={styles.linkWrap}
        >
          <Text style={styles.link}>{expanded ? 'Show less' : 'Read more'}</Text>
        </Pressable>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  linkWrap: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  link: {
    ...DesignTypography.labelSm,
    fontSize: 12,
    color: DesignColors.primaryBright,
    fontFamily,
    fontWeight: '700',
  },
});