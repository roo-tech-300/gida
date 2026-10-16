import { useLocalSearchParams } from 'expo-router';
import { ReferralEntry } from '@/components/referral/referral-entry';

export default function ReferralRoute() {
  const { code } = useLocalSearchParams<{ code?: string | string[] }>();
  return <ReferralEntry code={code} />;
}
