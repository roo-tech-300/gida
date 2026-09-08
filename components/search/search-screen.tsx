import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useEscapeKey } from '@/components/claim/use-escape-key';
import { SearchHeader } from '@/components/search/search-header';
import { SearchModeTabs, type SearchMode } from '@/components/search/search-mode-tabs';
import { SearchRecent, getRecents, saveRecent, clearRecents } from '@/components/search/search-recent';
import { SearchSuggestions } from '@/components/search/search-suggestions';
import { SearchResultsList } from '@/components/search/search-results-list';
import { SafeKeyboardView } from '@/components/ui/safe-keyboard-view';
import { useListingSearch, useRoommateSearch } from '@/hooks/use-search';
import { DesignColors, DesignRadius, DesignSpacing } from '@/constants/design';

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
  const [mounted, setMounted] = useState(false);
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
      if (open) setMounted(true);
      setIsOpen(open);
      Animated.timing(anim, {
        toValue: open ? 1 : 0,
        duration: 350,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      }).start(() => {
        if (open) {
          setTimeout(() => inputRef.current?.focus(), 100);
        } else {
          setMounted(false);
        }
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

  useEffect(() => {
    if (!isOpen) return;

    const handleBackPress = () => {
      close();
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => {
      subscription.remove();
    };
  }, [isOpen, close]);

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

  const handleSearchSubmit = useCallback(() => {
    const t = query.trim();
    if (t.length >= 2) {
      saveRecent(t);
      refreshRecents();
    }
  }, [query, refreshRecents]);

  const slideY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1200, 0],
  });

  const backdropOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6],
  });

  return (
    <View style={styles.wrapper} pointerEvents={isOpen ? 'box-none' : 'none'}>
      {mounted ? (
        <>
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
            <SafeKeyboardView style={styles.sheetContent}>
              <View style={styles.dragHandleRow}>
                <View style={styles.dragHandle} />
              </View>

              <SearchHeader
                ref={inputRef}
                value={query}
                onChangeText={setQuery}
                onCancel={close}
                onSubmit={handleSearchSubmit}
              />

              <View style={styles.tabsRow}>
                <SearchModeTabs active={mode} onChange={setMode} />
              </View>

              <View style={styles.body}>
                {!hasQuery ? (
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.scrollBody}
                  >
                    <SearchRecent terms={recentTerms} onSelect={handleSelectTerm} onClear={handleClearRecents} />
                    <SearchSuggestions onSelect={handleSelectTerm} />
                  </ScrollView>
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
            </SafeKeyboardView>
          </Animated.View>
        </>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFill,
    zIndex: 200,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
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
  tabsRow: {
    marginBottom: DesignSpacing.md,
  },
  body: {
    flex: 1,
  },
  scrollBody: {
    paddingBottom: DesignSpacing.xl * 2,
    gap: DesignSpacing.lg,
  },
});
