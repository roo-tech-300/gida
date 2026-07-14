import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AuthBackgroundBubbles } from '@/components/auth/auth-background-bubbles';
import { BackButton } from '@/components/ui/back-button';
import { DesignColors, fontFamily } from '@/constants/design';
import { roommateProfiles } from '@/dummy/roommates-mock';
import { useAdminCreation } from '@/context/admin-creation-context';
import type { RoommateProfile } from '@/types/roommates';

export function AddAdminScreen() {
  const router = useRouter();
  const { setUser } = useAdminCreation();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<RoommateProfile | null>(null);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const results = useMemo(
    () => roommateProfiles.filter((m) => m.name.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  useEffect(() => { return () => { if (timerRef.current) clearTimeout(timerRef.current); }; }, []);

  const handleSearch = () => {
    if (!query.trim() || searching) return;
    setSearching(true);
    setSearched(false);
    setSelected(null);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSearching(false);
      setSearched(true);
    }, 1300);
  };

  return (
    <View style={styles.root}>
      <AuthBackgroundBubbles />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
                    placeholder="Type username or email..."
                    placeholderTextColor={DesignColors.onSurfaceVariant}
                    style={styles.searchInput}
                    value={query}
                    onChangeText={(t) => { setQuery(t); setSelected(null); setSearched(false); }}
                    onSubmitEditing={handleSearch}
                  />
                </View>
                <Pressable style={styles.findBtn} onPress={handleSearch}>
                  {searching ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Ionicons name="search" size={24} color="#ffffff" />
                  )}
                </Pressable>
              </View>
            </View>

            {selected ? (
              <View style={styles.resultSection}>
                <View style={styles.resultCard}>
                  <View style={styles.resultLeft}>
                    <View style={styles.avatarWrap}>
                      <Text style={styles.avatarText}>{selected.name.split(' ').map((s: string) => s[0]).join('').slice(0, 2)}</Text>
                    </View>
                    <View style={styles.resultInfo}>
                      <View style={styles.nameRow}>
                        <Text style={styles.resultName}>{selected.name}</Text>
                        <Ionicons name="checkmark-circle" size={18} color={DesignColors.primary} />
                      </View>
                      <Text style={styles.resultEmail}>{selected.department} • {selected.university}</Text>
                    </View>
                  </View>
                  <View style={styles.statusBadge}>
                    <Ionicons name="checkmark" size={14} color={DesignColors.secondary} />
                    <Text style={styles.statusText}>Found</Text>
                  </View>
                </View>

                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoText}>
                    Verify the details above carefully. Once confirmed, this user will be granted preliminary administrative rights for Gida Enterprise nodes.
                  </Text>
                </View>
              </View>
            ) : searched && results.length > 0 ? (
              <View style={styles.resultsList}>
                {results.map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.resultRow}
                    onPress={() => { setSelected(item); setUser(item); }}
                  >
                    <View style={styles.resultRowLeft}>
                      <View style={styles.avatarSmall}>
                        <Text style={styles.avatarSmallText}>{item.name.split(' ').map((s: string) => s[0]).join('').slice(0, 2)}</Text>
                      </View>
                      <View>
                        <Text style={styles.resultRowName}>{item.name}</Text>
                        <Text style={styles.resultRowMeta}>{item.department} • {item.university}</Text>
                      </View>
                    </View>
                    <Ionicons name="add-circle-outline" size={22} color={DesignColors.primary} />
                  </Pressable>
                ))}
              </View>
            ) : searched && query.trim() && results.length === 0 ? (
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
            <Ionicons name="arrow-forward" size={20} color={selected ? '#ffffff' : DesignColors.onSurfaceVariant} />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  safe: { flex: 1 },

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
    backgroundColor: 'rgba(255,255,255,0.15)',
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
    borderRadius: 9999,
    backgroundColor: '#141414',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 20,
    height: 48,
    justifyContent: 'center',
  },
  searchInput: { fontSize: 15, color: DesignColors.onSurface, fontFamily, paddingVertical: 0 },
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
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  resultRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarSmall: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: DesignColors.primaryContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarSmallText: { fontSize: 16, fontWeight: '700', color: '#ffffff', fontFamily },
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
    backgroundColor: 'rgba(19, 19, 21, 0.6)',
    borderWidth: 1, borderColor: 'rgba(79, 70, 229, 0.4)',
  },
  resultLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: DesignColors.primaryContainer,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)',
  },
  avatarText: { fontSize: 24, fontWeight: '700', color: '#ffffff', fontFamily },
  resultInfo: { gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  resultName: { fontSize: 20, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  resultEmail: { fontSize: 14, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 999, backgroundColor: 'rgba(0, 165, 114, 0.1)',
    borderWidth: 1, borderColor: 'rgba(0, 165, 114, 0.3)',
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
  confirmBtnDisabled: { backgroundColor: '#6b64b0' },
  confirmText: { fontSize: 17, fontWeight: '700', color: '#ffffff', fontFamily },
  confirmTextDisabled: { color: DesignColors.onSurfaceVariant },
});
