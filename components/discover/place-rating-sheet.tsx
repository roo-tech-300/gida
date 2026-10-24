import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignSpacing, fontFamily } from '@/constants/design';
import { useWebModalEscape } from '@/hooks/use-web-modal-escape';

const STARS = [1, 2, 3, 4, 5];

type Props = {
  visible: boolean;
  placeName: string;
  onClose: () => void;
  onSubmit: (rating: number, text: string) => void;
};

export function PlaceRatingSheet({ visible, placeName, onClose, onSubmit }: Props) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');

  useWebModalEscape(visible, onClose);

  useEffect(() => {
    if (!visible) {
      setRating(0);
      setText('');
    }
  }, [visible]);

  const canSubmit = rating > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(rating, text.trim());
    onClose();
  };

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.backdrop} />
        <View style={styles.sheet}>
          <Text style={styles.title}>Rate {placeName}</Text>
          <View style={styles.stars}>
            {STARS.map((value) => (
              <Pressable
                key={value}
                accessibilityLabel={`${value} star`}
                accessibilityRole="button"
                onPress={() => setRating(value)}
              >
                <Ionicons
                  color={DesignColors.rating}
                  name={value <= rating ? 'star' : 'star-outline'}
                  size={32}
                />
              </Pressable>
            ))}
          </View>
          <TextInput
            maxLength={280}
            multiline
            onChangeText={setText}
            placeholder="What did you think? (optional)"
            placeholderTextColor={DesignColors.textSecondary}
            style={styles.input}
            textAlignVertical="top"
            value={text}
          />
          <Pressable
            accessibilityRole="button"
            disabled={!canSubmit}
            onPress={handleSubmit}
            style={[styles.submit, !canSubmit && styles.submitDisabled]}
          >
            <Text style={styles.submitLabel}>Submit rating</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: DesignColors.scrim,
  },
  sheet: {
    padding: DesignSpacing.lg,
    paddingBottom: 36,
    gap: 14,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: DesignColors.surfaceContainerLow,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: DesignColors.textPrimary,
    fontFamily,
  },
  stars: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    minHeight: 96,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    color: DesignColors.textPrimary,
    fontFamily,
  },
  submit: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: DesignColors.primary,
  },
  submitDisabled: {
    opacity: 0.45,
  },
  submitLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: DesignColors.onPrimary,
    fontFamily,
  },
});
