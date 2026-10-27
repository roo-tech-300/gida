import { ScrollView, Text, View } from 'react-native';

import { JoinInviteCard } from '@/components/claim/join-invite-card';
import { RoommatePrompt } from '@/components/claim/roommate-prompt';
import { WizardFooter } from '@/components/claim/wizard-footer';
import { styles } from '@/components/claim/claim-room-modal.styles';

type Props = {
  value: boolean | null;
  onChange: (value: boolean | null) => void;
  onJoinWithCode: () => void;
  onContinue: () => void;
  loading: boolean;
  disabled: boolean;
};

/** Step one of the claim wizard: live alone, with roommates, or join a group. */
export function RoommateChoiceStep({
  value,
  onChange,
  onJoinWithCode,
  onContinue,
  loading,
  disabled,
}: Props) {
  return (
    <>
      <View style={styles.divider} />
      <ScrollView
        style={styles.scroll}
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        removeClippedSubviews={false}
      >
        <Text style={styles.title}>Would you like to have roommates?</Text>
        <Text style={styles.subtitle}>
          You can live alone, with friends, with matched roommates — or a mix.
        </Text>
        <RoommatePrompt value={value} onChange={onChange} />
        <JoinInviteCard onPress={onJoinWithCode} />
      </ScrollView>
      <WizardFooter
        label="Continue"
        icon="arrow-forward"
        loading={loading}
        disabled={disabled}
        onPress={onContinue}
      />
    </>
  );
}
