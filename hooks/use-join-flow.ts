import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '@/context/auth-context';
import { setPendingRedirect } from '@/lib/pending-redirect';
import { useInvitePage, useJoinInvite } from '@/hooks/use-household-invite';
import { createGuestAccount } from '@/services/guest-account-service';
import { validateGuestDetails, type GuestDetails, type GuestErrors } from '@/utils/guest-details';
import { inviteProblem, joinFailure, type InviteProblem, type ProblemAction } from '@/utils/invite-state';

export type JoinStage = 'landing' | 'details' | 'working' | 'check-email';

/** Runs a friend through an invite link: see the place, give four details, take the seat, go to pay. */
export function useJoinFlow(token: string | undefined) {
  const router = useRouter();
  const { isAuthenticated, profile, refreshProfile } = useAuth();
  const page = useInvitePage(token);
  const { mutateAsync: joinInvite } = useJoinInvite();

  const [stage, setStage] = useState<JoinStage>('landing');
  const [failure, setFailure] = useState<InviteProblem | null>(null);
  const [errors, setErrors] = useState<GuestErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);
  const triedClaimed = useRef(false);

  const canJoinDirectly = isAuthenticated && !!profile?.onboarded;

  const joinNow = useCallback(async () => {
    if (!token) return;
    setStage('working');
    try {
      const { creditId } = await joinInvite(token);
      router.replace({ pathname: '/property/pay-slot', params: { id: creditId } });
    } catch (error) {
      console.error('[JoinFlow] Could not take the seat:', error);
      setFailure(joinFailure(error instanceof Error ? error.message : undefined));
      setStage('landing');
    }
  }, [token, joinInvite, router]);

  // Opening a link you already used (a refresh, or coming back after paying) takes you to your reservation.
  useEffect(() => {
    if (page.data?.status === 'claimed' && canJoinDirectly && !triedClaimed.current) {
      triedClaimed.current = true;
      void joinNow();
    }
  }, [page.data?.status, canJoinDirectly, joinNow]);

  /** Sign in first, then come straight back to this link. */
  const signIn = useCallback(() => {
    if (!token) return;
    setPendingRedirect(`/join/${token}`);
    router.push('/(auth)/login');
  }, [token, router]);

  const start = useCallback(() => {
    setFailure(null);
    if (canJoinDirectly) {
      void joinNow();
    } else if (isAuthenticated && token) {
      // Signed in but never finished onboarding: finish it, and the gate brings them back here.
      setPendingRedirect(`/join/${token}`);
      router.replace('/(onboarding)');
    } else {
      setStage('details');
    }
  }, [canJoinDirectly, isAuthenticated, token, joinNow, router]);

  const submitDetails = useCallback(async (details: GuestDetails) => {
    const found = validateGuestDetails(details);
    setErrors(found);
    setFormError(null);
    setEmailTaken(false);
    if (Object.keys(found).length > 0) return;
    setStage('working');
    try {
      const result = await createGuestAccount(details);
      if (result.status === 'email_taken') {
        setFormError('This email already has a Gida account. Sign in and we will bring you straight back to this invite.');
        setEmailTaken(true);
        setStage('details');
        return;
      }
      if (result.status === 'needs_confirmation') {
        setStage('check-email');
        return;
      }
      await refreshProfile();
      await joinNow();
    } catch (error) {
      console.error('[JoinFlow] Could not create the account:', error);
      setFormError(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
      setStage('details');
    }
  }, [refreshProfile, joinNow]);

  const problem: InviteProblem | null = failure ?? (page.data ? inviteProblem(page.data.status, page.data.inviter) : null);

  const runAction = useCallback((action: ProblemAction) => {
    const inviter = page.data?.inviter;
    switch (action) {
      case 'ask-founder': {
        const text = encodeURIComponent(`Hi${inviter ? ` ${inviter}` : ''}, your Gida invite link no longer works. Please send me a new one.`);
        void Linking.openURL(`https://wa.me/?text=${text}`);
        return;
      }
      case 'join-again':
        setFailure(null);
        return;
      case 'open-my-spot':
        router.replace('/(tabs)/my-home');
        return;
      case 'browse':
        router.replace(isAuthenticated ? '/(tabs)' : '/');
        return;
      case 'none':
        return;
    }
  }, [page.data?.inviter, router, isAuthenticated]);

  return { page, stage, problem, errors, formError, emailTaken, isSignedIn: isAuthenticated, signIn, start, submitDetails, backToLanding: () => setStage('landing'), runAction };
}
