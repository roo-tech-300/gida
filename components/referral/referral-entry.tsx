import { Redirect } from 'expo-router';

const REFERRAL_CODE_PATTERN = /^[A-Za-z0-9]{20,32}$/;

export function ReferralEntry({ code }: { code?: string | string[] }) {
  const referralCode = typeof code === 'string' && REFERRAL_CODE_PATTERN.test(code.trim())
    ? code.trim()
    : undefined;

  return (
    <Redirect
      href={referralCode
        ? { pathname: '/(auth)/signup', params: { referralCode } }
        : '/(auth)/signup'}
    />
  );
}
