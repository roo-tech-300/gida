import { useCallback, type ReactElement } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { RoommateOnboardingSheet } from '@/components/roommate/roommate-onboarding-sheet';
import { ListState } from '@/components/ui/list-state';
import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { usePeopleFeed, type PersonMatch } from '@/hooks/use-people-feed';
import { useRoommateVisibility } from '@/hooks/useRoommateVisibility';

import { PersonCard } from './person-card';

const COLUMNS = 2;

export function PeopleGrid({ header }: { header: ReactElement }) {
  const router = useRouter();
  const { needsOnboarding } = useRoommateVisibility();
  const { people, isLoading, isError, isRefetching, refetch } = usePeopleFeed();

  const openProfile = useCallback((id: string) => router.push(`/roommate/${id}`), [router]);
  const sayHi = useCallback((id: string) => router.push(`/messages/${id}`), [router]);
  const renderItem = useCallback(
    ({ item }: { item: PersonMatch }) => <PersonCard match={item} onOpen={openProfile} onSayHi={sayHi} />,
    [openProfile, sayHi],
  );

  // Students appear in this list only once they opt in, so ask before showing anyone.
  if (needsOnboarding) return <RoommateOnboardingSheet visible onDismiss={() => undefined} />;

  return (
    <FlatList
      data={people}
      numColumns={COLUMNS}
      keyExtractor={(item) => item.person.id}
      renderItem={renderItem}
      columnWrapperStyle={styles.row}
      ListHeaderComponent={
        <View style={styles.header}>
          {header}
          {!isLoading && !isError ? <Text style={styles.count} testID="people-count">{people.length === 1 ? '1 student' : `${people.length} students`} near you</Text> : null}
        </View>
      }
      ListEmptyComponent={
        isLoading ? <ListState kind="loading" message="Finding students…" /> :
        isError ? <ListState kind="error" message="We could not load students. Try again." onRetry={() => { void refetch(); }} /> :
        <ListState kind="empty" icon="people-outline" message="No students here yet. Check back soon." />
      }
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { void refetch(); }} tintColor={DesignColors.primaryBright} colors={[DesignColors.primaryBright]} />}
      contentContainerStyle={styles.content}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: DesignSpacing.lg },
  header: { gap: DesignSpacing.md, paddingBottom: DesignSpacing.md },
  count: { ...DesignTypography.labelLg, color: DesignColors.onSurfaceVariant, fontFamily, marginHorizontal: DesignSpacing.marginMobile },
  row: { gap: DesignSpacing.sm, paddingHorizontal: DesignSpacing.marginMobile, marginBottom: DesignSpacing.sm },
});
