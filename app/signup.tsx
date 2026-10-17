import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * Web-only entry point for referral sign-ups.
 *
 * The referral interstitial page (/r-invite/index.html) sends users here:
 *   https://www.gida.apartments/signup?referralCode=ABC123
 *
 * This route just passes the code through to the real signup screen.
 */
export default function SignupRedirect() {
  const { referralCode } = useLocalSearchParams<{ referralCode?: string }>();

  return (
    <Redirect
      href={
        referralCode
          ? { pathname: '/(auth)/signup', params: { referralCode } }
          : '/(auth)/signup'
      }
    />
  );
}
