import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type TextLayoutEventData,
  type TextStyle,
} from 'react-native';

import { DesignColors, DesignTypography, fontFamily } from '@/constants/design';

type Props = {
  text: string;
  /** Line cap before the text is clamped; a Read more link appears past this. */
  collapsedLines: number;
  /** Color/font overrides from the bubble (me vs them). */
  style?: StyleProp<TextStyle>;
  /** Color/font overrides for the Read more / Show less link. */
  linkStyle?: StyleProp<TextStyle>;
};

const HEIGHT_EPSILON_PX = 1;

function hasNewlineOverflow(text: string, maxLines: number): boolean {
  return (text.match(/\n/g) || []).length + 1 > maxLines;
}

function asDomElement(node: Text | null): HTMLElement | null {
  if (!node || typeof (node as unknown as HTMLElement).clientHeight !== 'number') {
    return null;
  }
  return node as unknown as HTMLElement;
}

/**
 * Chat body text with a line clamp and an inline Read more / Show less toggle.
 *
 * Truncation is detected via:
 * 1. Immediate newline count check (zero-delay for multi-line returns).
 * 2. Unclamped probe onTextLayout on native (full line count while visible text is clamped).
 * 3. Height comparison of unclamped probe vs clamped text (works on web + native backup).
 *
 * Measuring the clamped node alone is unreliable on web: -webkit-line-clamp with
 * overflow:clip often makes scrollHeight === clientHeight even when text is truncated.
 */
export function MessageTruncatedText({ text, collapsedLines, style, linkStyle }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(() => hasNewlineOverflow(text, collapsedLines));
  const textRef = useRef<Text | null>(null);
  const probeRef = useRef<Text | null>(null);
  const clampedHeightRef = useRef(0);
  const probeHeightRef = useRef(0);
  const prevTextRef = useRef(text);
  const prevCapRef = useRef(collapsedLines);

  useEffect(() => {
    if (prevTextRef.current === text && prevCapRef.current === collapsedLines) return;
    prevTextRef.current = text;
    prevCapRef.current = collapsedLines;
    clampedHeightRef.current = 0;
    probeHeightRef.current = 0;
    setExpanded(false);
    setIsTruncated(hasNewlineOverflow(text, collapsedLines));
  }, [text, collapsedLines]);

  const markTruncatedIfNeeded = (probeHeight: number, clampedHeight: number) => {
    if (clampedHeight > 0 && probeHeight > clampedHeight + HEIGHT_EPSILON_PX) {
      setIsTruncated(true);
    }
  };

  // Web: compare unclamped probe height to clamped visible height.
  // onTextLayout is unsupported; clamp-node scrollHeight alone is unreliable.
  useLayoutEffect(() => {
    if (Platform.OS !== 'web' || isTruncated || expanded) return;

    const measure = () => {
      const clamped = asDomElement(textRef.current);
      const probe = asDomElement(probeRef.current);
      if (!clamped || !probe) return;
      markTruncatedIfNeeded(probe.scrollHeight, clamped.clientHeight);
    };

    measure();
    const rafId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafId);
  }, [text, collapsedLines, isTruncated, expanded]);

  const handleTextLayout = (event: NativeSyntheticEvent<TextLayoutEventData>) => {
    if (event.nativeEvent.lines.length > collapsedLines) {
      setIsTruncated(true);
    }
  };

  const handleClampedLayout = (event: LayoutChangeEvent) => {
    clampedHeightRef.current = event.nativeEvent.layout.height;
    markTruncatedIfNeeded(probeHeightRef.current, clampedHeightRef.current);
  };

  const handleProbeLayout = (event: LayoutChangeEvent) => {
    probeHeightRef.current = event.nativeEvent.layout.height;
    markTruncatedIfNeeded(probeHeightRef.current, clampedHeightRef.current);
  };

  return (
    <View style={styles.container}>
      <Text
        ref={textRef}
        testID="message-truncated-body"
        style={style}
        numberOfLines={expanded ? undefined : collapsedLines}
        onTextLayout={handleTextLayout}
        onLayout={handleClampedLayout}
      >
        {text}
      </Text>

      {/*
        Unclamped invisible probe.
        Native: onTextLayout reports the true total line count.
        Web + native: onLayout / DOM height is compared against the clamped body.
        Unmounts once truncation is confirmed to keep the tree lean.
      */}
      {!isTruncated && !expanded ? (
        <View
          style={styles.probeContainer}
          pointerEvents="none"
          aria-hidden={true}
        >
          <Text
            ref={probeRef}
            testID="message-truncation-probe"
            style={[style, styles.probeText]}
            onTextLayout={handleTextLayout}
            onLayout={handleProbeLayout}
          >
            {text}
          </Text>
        </View>
      ) : null}

      {isTruncated ? (
        <Pressable
          testID="message-truncate-toggle"
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Show less of this message' : 'Read the full message'}
          onPress={() => setExpanded((value) => !value)}
          hitSlop={6}
          style={styles.linkWrap}
        >
          <Text style={[styles.link, linkStyle]}>{expanded ? 'Show less' : 'Read more'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
  probeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    opacity: 0,
  },
  probeText: {
    color: 'transparent',
  },
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
