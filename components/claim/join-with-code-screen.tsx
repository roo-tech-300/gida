import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { JoinGroupFlow } from '@/components/claim/join-group-flow';
import { useEscapeKey } from '@/components/claim/use-escape-key';
import { DesignColors } from '@/constants/design';

export function JoinWithCodeScreen() {
  const close = () => router.back();
  useEscapeKey(close);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <JoinGroupFlow onClose={close} onExitJoin={close} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surfaceContainerLowest },
  flex: { flex: 1 },
});
