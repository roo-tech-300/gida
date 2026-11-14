import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InviteLanding } from '@/components/invite/invite-landing';
import { InviteProblemCard } from '@/components/invite/invite-problem-card';
import { QuickDetailsForm } from '@/components/invite/quick-details-form';
import { DesignColors, DesignSpacing, fontFamily } from '@/constants/design';
import { useJoinFlow } from '@/hooks/use-join-flow';

function Centered({ children }: { children: React.ReactNode }) {
  return <View style={styles.centered}>{children}</View>;
}

/** The page behind an invite link. Public: no account needed to look, a few details to join. */
export function JoinScreen({ token }: { token: string }) {
  const router = useRouter();
  const { page, stage, problem, errors, formError, start, submitDetails, backToLanding, runAction } = useJoinFlow(token);

  let body: React.ReactNode;
  if (page.isLoading) {
    body = <Centered><ActivityIndicator size="large" color={DesignColors.primary} /></Centered>;
  } else if (page.isError || !page.data) {
    body = (
      <Centered>
        <Text style={styles.message}>{page.error?.message ?? 'We could not open this invite.'}</Text>
        <Pressable accessibilityRole="button" onPress={() => void page.refetch()} style={styles.retry}><Text style={styles.retryText}>Try again</Text></Pressable>
      </Centered>
    );
  } else if (stage === 'working') {
    body = <Centered><ActivityIndicator size="large" color={DesignColors.primary} /><Text style={styles.message}>Getting your seat ready…</Text></Centered>;
  } else if (stage === 'check-email') {
    body = <Centered><Text style={styles.title}>Check your email</Text><Text style={styles.message}>We sent a message to confirm your address. Confirm it, then open this link again to finish.</Text></Centered>;
  } else if (problem) {
    body = <InviteProblemCard problem={problem} onAction={() => runAction(problem.action)} />;
  } else if (stage === 'details') {
    body = <QuickDetailsForm busy={false} errors={errors} formError={formError} onSubmit={(d) => void submitDetails(d)} onBack={backToLanding} />;
  } else {
    body = (
      <InviteLanding
        page={page.data}
        busy={false}
        onJoin={start}
        onViewPlace={page.data.listingId ? () => router.push({ pathname: '/property/[id]', params: { id: page.data.listingId as string } }) : undefined}
      />
    );
  }

  return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>{body}</SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surface },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: DesignSpacing.md, padding: DesignSpacing.xl },
  title: { fontFamily, fontSize: 22, fontWeight: '800', color: DesignColors.onSurface },
  message: { fontFamily, fontSize: 14, lineHeight: 21, textAlign: 'center', color: DesignColors.onSurfaceVariant },
  retry: { height: 44, paddingHorizontal: 24, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: DesignColors.primaryBright },
  retryText: { fontFamily, fontSize: 14, fontWeight: '700', color: DesignColors.primaryFixed },
});
