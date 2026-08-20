import { useCallback, useImperativeHandle, useRef, useState, forwardRef } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useEscapeKey } from '@/components/claim/use-escape-key';
import { SearchModeTabs, type SearchMode } from '@/components/search/search-mode-tabs';
import { SearchRecent, getRecents, saveRecent, clearRecents } from '@/components/search/search-recent';
import { SearchSuggestions } from '@/components/search/search-suggestions';
import { SearchResultsList } from '@/components/search/search-results-list';
import { useListingSearch, useRoommateSearch } from '@/hooks/use-search';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

export type SearchScreenRef = {
  open: () => void;
};

type Props = {
  onPressListing: (id: string) => void;
  onPressRoommate: (id: string) => void;
};

export const SearchScreen = forwardRef<SearchScreenRef, Props>(function SearchScreen(
  { onPressListing, onPressRoommate },
  ref,
) {
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  const isOpenRef = useRef(false);
  const anim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('listings');
  const [recentTerms, setRecentTerms] = useState<string[]>(() => getRecents());

  const listingSearch = useListingSearch(query);
  const roommateSearch = useRoommateSearch(query);
  const hasQuery = query.trim().length >= 2;

  const animateTo = useCallback(
    (open: boolean) => {
      isOpenRef.current = open;
      setIsOpen(open);
      Animated.timing(anim, {
        toValue: open ? 1 : 0,
        duration: 350,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }).start(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 100);
      });
    },
    [anim],
  );

  const close = useCallback(() => {
    animateTo(false);
    setTimeout(() => setQuery(''), 350);
  }, [animateTo]);

  useImperativeHandle(ref, () => ({ open: () => animateTo(true) }), [animateTo]);
  useEscapeKey(close, isOpen);

  const overlayPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: (_, g) => isOpenRef.current && Math.abs(g.dy) > 5,
      onPanResponderMove: (_, g) => {
        if (!isOpenRef.current) return;
        anim.setValue(Math.max(0, Math.min(1, 1 + g.dy / 400)));
      },
      onPanResponderRelease: (_, g) => {
        if (!isOpenRef.current) return;
        if (g.dy < -60 || g.vy < -0.5) close();
        else animateTo(true);
      },
    }),
  ).current;

  const refreshRecents = useCallback(() => {
    setRecentTerms(getRecents());
  }, []);

  const handleSelectTerm = useCallback(
    (term: string) => {
      setQuery(term);
      saveRecent(term);
      refreshRecents();
    },
    [refreshRecents],
  );

  const handleClearRecents = useCallback(() => {
    clearRecents();
    setRecentTerms([]);
  }, []);

  const slideY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [800, 0],
  });

  const backdropOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6],
  });

  return (
    <View style={styles.wrapper} pointerEvents={isOpen ? 'box-none' : 'none'}>
      <Animated.View
        style={[styles.backdrop, { opacity: backdropOpacity }]}
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>

      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: slideY }], paddingTop: insets.top }]}
        pointerEvents={isOpen ? 'auto' : 'none'}
        {...overlayPan.panHandlers}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.sheetContent}>
          <View style={styles.dragHandleRow}>
            <View style={styles.dragHandle} />
          </View>

          <View style={styles.inputRow}>
            <Ionicons name="search" size={18} color={DesignColors.onSurfaceVariant} />
            <TextInput
              ref={inputRef}
              placeholder="Search listings, locations..."
              placeholderTextColor={DesignColors.outline}
              returnKeyType="search"
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => {
                const t = query.trim();
                if (t.length >= 2) {
                  saveRecent(t);
                  refreshRecents();
                }
              }}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={18} color={DesignColors.onSurfaceVariant} />
              </Pressable>
            )}
          </View>

          <View style={styles.topRow}>
            <SearchModeTabs active={mode} onChange={setMode} />
            <Pressable onPress={close} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>

          <View style={styles.body}>
            {!hasQuery ? (
              <>
                <SearchRecent terms={recentTerms} onSelect={handleSelectTerm} onClear={handleClearRecents} />
                <SearchSuggestions onSelect={handleSelectTerm} />
              </>
            ) : (
              <SearchResultsList
                mode={mode}
                query={query}
                isLoading={mode === 'listings' ? listingSearch.isLoading : roommateSearch.isLoading}
                listings={listingSearch.data ?? []}
                roommates={roommateSearch.data ?? []}
                onPressListing={(id) => {
                  close();
                  onPressListing(id);
                }}
                onPressRoommate={(id) => {
                  close();
                  onPressRoommate(id);
                }}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: DesignColors.surfaceContainerLowest,
    zIndex: 201,
    borderTopLeftRadius: DesignRadius.lg,
    borderTopRightRadius: DesignRadius.lg,
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: DesignSpacing.marginMobile,
  },
  dragHandleRow: {
    alignItems: 'center',
    paddingTop: DesignSpacing.sm,
    paddingBottom: DesignSpacing.xs,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: DesignColors.outlineVariant,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: DesignSpacing.sm,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.surfaceContainer,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  input: {
    flex: 1,
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    paddingVertical: 0,
  },
  clearBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DesignSpacing.md,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelText: {
    ...DesignTypography.labelLg,
    color: DesignColors.primaryBright,
    fontFamily,
  },
  body: {
    flex: 1,
  },
});
