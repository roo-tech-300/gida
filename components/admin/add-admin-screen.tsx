import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthBackgroundBubbles } from '@/components/auth/auth-background-bubbles';
import { BackButton } from '@/components/ui/back-button';
import { useAppToast } from '@/components/ui/toast-card';
import { DesignColors, fontFamily } from '@/constants/design';
import { useAdminCreation } from '@/context/admin-creation-context';
import { useSearchAdminCandidates } from '@/hooks/use-admin-profiles';
import type { AdminCandidate } from '@/types/admin';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function AddAdminScreen() {
  const router = useRouter();
  const { showToast } = useAppToast();
  const { setUser } = useAdminCreation();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selected, setSelected] = useState<AdminCandidate | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const { data: results = [], isFetching, isError } = useSearchAdminCandidates(debouncedQuery);

  useEffect(() => {
    if (isError) {
      showToast({ message: 'Search failed. Please try again.', type: 'error' });
    }
  }, [isError, showToast]);

  const hasSearched = debouncedQuery.trim().length >= 2;

  return (
    <View style={styles.root}>
      <AuthBackgroundBubbles />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow}>
              <View style={styles.backAbs}>
                <BackButton hasBackground />
              </View>
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>Pick User</Text>
                <View style={styles.stepBadge}>
                  <View style={[styles.stepDot, styles.stepDotActive]} />
                  <View style={styles.stepDot} />
                  <Text style={styles.stepLabel}>1/2</Text>
                </View>
              </View>
            </View>
            <View style={styles.centerWrap}>
              <View style={styles.searchSection}>
                <View style={styles.searchRow}>
                  <View style={styles.searchInputWrap}>
                    <TextInput
                      placeholder="Search by name..."
                      placeholderTextColor={DesignColors.onSurfaceVariant}
                      style={styles.searchInput}
                      value={query}
                      autoCorrect={false}
                      onChangeText={(t) => {
                        setQuery(t);
                        setSelected(null);
                      }}
                    />
                    {query.length > 0 && !isFetching && (
                      <Pressable onPress={() => setQuery('')} hitSlop={8}>
                        <Ionicons name="close-circle" size={18} color={DesignColors.onSurfaceVariant} />
                      </Pressable>
                    )}
                  </View>
                  <View style={styles.findBtn}>
                    {isFetching ? (
                      <ActivityIndicator size="small" color={DesignColors.onSurface} />
                    ) : (
                      <Ionicons name="search" size={24} color={DesignColors.onSurface} />
                    )}
                  </View>
                </View>
              </View>

              {selected ? (
                <View style={styles.resultSection}>
                  <View style={styles.resultCard}>
                    <View style={styles.resultLeft}>
                      <View style={styles.avatarWrap}>
                        {selected.avatar_url ? (
                          <Image source={{ uri: selected.avatar_url }} style={styles.avatarImage} contentFit="cover" />
                        ) : (
                          <Text style={styles.avatarText}>{getInitials(selected.full_name)}</Text>
                        )}
                      </View>
                      <View style={styles.resultInfo}>
                        <View style={styles.nameRow}>
                          <Text style={styles.resultName}>{selected.full_name}</Text>
                          <Ionicons name="checkmark-circle" size={18} color={DesignColors.primary} />
                        </View>
                        <Text style={styles.resultEmail}>{selected.email ?? 'No email'}</Text>
                      </View>
                    </View>
                    <View style={styles.statusBadge}>
                      <Ionicons name="checkmark" size={14} color={DesignColors.secondary} />
                      <Text style={styles.statusText}>Found</Text>
                    </View>
                  </View>

                  <View style={styles.infoTextWrap}>
                    <Text style={styles.infoText}>
                      Verify the details above carefully. Once confirmed, this user will be granted administrative rights for Gida Enterprise nodes.
                    </Text>
                  </View>
                </View>
              ) : hasSearched && results.length > 0 ? (
                <View style={styles.resultsList}>
                  {results.map((item) => (
                    <Pressable
                      key={item.id}
                      style={styles.resultRow}
                      onPress={() => { setSelected(item); setUser(item); }}
                    >
                      <View style={styles.resultRowLeft}>
                        <View style={styles.avatarSmall}>
                          {item.avatar_url ? (
                            <Image source={{ uri: item.avatar_url }} style={styles.avatarImage} contentFit="cover" />
                          ) : (
                            <Text style={styles.avatarSmallText}>{getInitials(item.full_name)}</Text>
                          )}
                        </View>
                        <View>
                          <Text style={styles.resultRowName}>{item.full_name}</Text>
                          <Text style={styles.resultRowMeta}>{item.email ?? 'No email'}</Text>
                        </View>
                      </View>
                      <Ionicons name="add-circle-outline" size={22} color={DesignColors.primary} />
                    </Pressable>
                  ))}
                </View>
              ) : hasSearched ? (
                <Text style={styles.noResult}>No user matches your search</Text>
              ) : null}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={[styles.confirmBtn, !selected && styles.confirmBtnDisabled]}
              onPress={() => { if (selected) { setUser(selected); router.push('/admin/assign-role'); } }}
              disabled={!selected}
            >
              <Text style={[styles.confirmText, !selected && styles.confirmTextDisabled]}>Confirm & Next</Text>
              <Ionicons name="arrow-forward" size={20} color={selected ? DesignColors.onSurface : DesignColors.onSurfaceVariant} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DesignColors.surfaceContainerLowest },
  safe: { flex: 1 },
  kav: { flex: 1 },

  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingBottom: 16,
    paddingTop: 8,
  },
  backAbs: {
    position: 'absolute', left: 0,
  },
  headerCenter: {
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 17, fontWeight: '700', color: DesignColors.onSurface, fontFamily,
  },
  stepBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  stepDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: DesignColors.borderMedium,
  },
  stepDotActive: {
    backgroundColor: DesignColors.primary,
    width: 8, height: 8, borderRadius: 4,
  },
  stepLabel: {
    fontSize: 11, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily,
    marginLeft: 2,
  },

  scroll: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 140,
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
  },

  searchSection: { gap: 16 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 9999,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderWidth: 1, borderColor: DesignColors.borderSoft,
    paddingHorizontal: 20,
    height: 48,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: DesignColors.onSurface, fontFamily, paddingVertical: 0 },
  findBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: DesignColors.primaryContainer,
    alignItems: 'center', justifyContent: 'center',
  },

  resultsList: { gap: 8, paddingTop: 20 },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: DesignColors.surface,
    borderWidth: 1, borderColor: DesignColors.cardBorder,
  },
  resultRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarSmall: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: DesignColors.primaryContainer,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarSmallText: { fontSize: 16, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  avatarImage: { width: '100%', height: '100%' },
  resultRowName: { fontSize: 15, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  resultRowMeta: { fontSize: 12, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily, marginTop: 2 },
  noResult: {
    textAlign: 'center', paddingTop: 40,
    fontSize: 14, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily,
  },

  resultSection: { gap: 20, paddingTop: 32 },
  resultCard: {
    borderRadius: 20, padding: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: DesignColors.glassStrong,
    borderWidth: 1, borderColor: DesignColors.primaryTintBorder,
  },
  resultLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: DesignColors.primaryContainer,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: DesignColors.glassBorder,
    overflow: 'hidden',
  },
  avatarText: { fontSize: 24, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  resultInfo: { gap: 4, flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  resultName: { fontSize: 20, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  resultEmail: { fontSize: 14, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 999, backgroundColor: DesignColors.successContainer,
    borderWidth: 1, borderColor: DesignColors.successContainer,
  },
  statusText: { fontSize: 12, fontWeight: '700', color: DesignColors.secondary, fontFamily, letterSpacing: -0.3 },

  infoTextWrap: { paddingHorizontal: 8 },
  infoText: { fontSize: 14, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily, lineHeight: 22, opacity: 0.8 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingVertical: 32,
  },
  confirmBtn: {
    height: 52,
    borderRadius: 9999,
    backgroundColor: DesignColors.primaryContainer,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  confirmBtnDisabled: { backgroundColor: DesignColors.surfaceContainerHighest },
  confirmText: { fontSize: 17, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  confirmTextDisabled: { color: DesignColors.onSurfaceVariant },
});
