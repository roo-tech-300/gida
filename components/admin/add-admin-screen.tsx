import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthBackgroundBubbles } from '@/components/auth/auth-background-bubbles';
import { BackButton } from '@/components/ui/back-button';
import { SafeKeyboardView } from '@/components/ui/safe-keyboard-view';
import { useAppToast } from '@/components/ui/toast-card';
import { DesignColors } from '@/constants/design';
import { useAdminCreation } from '@/context/admin-creation-context';
import { useSearchAdminCandidates } from '@/hooks/use-admin-profiles';
import type { AdminCandidate } from '@/types/admin';

import { styles } from './add-admin-screen.styles';

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
        <SafeKeyboardView style={styles.kav}>
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
        </SafeKeyboardView>
      </SafeAreaView>
    </View>
  );
}
