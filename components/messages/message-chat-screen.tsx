import { useRouter } from 'expo-router';
import { FeatureUnderConstruction } from '@/components/ui/feature-under-construction';

export function MessageChatScreen() {
  const router = useRouter();
  return <FeatureUnderConstruction onGoBack={() => router.back()} />;
}
