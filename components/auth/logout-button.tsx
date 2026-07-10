import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { signOutUserAccount } from '@/services/authService';
import {
  DesignColors,
  DesignLayout,
  DesignRadius,
  DesignTypography,
  fontFamily,
} from '@/constants/design';

export function LogoutButton() {
  const handleLogout = () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOutUserAccount();
            } catch (error) {}
          },
        },
      ]
    );
  };

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        pressed && styles.pressed,
      ]}
      onPress={handleLogout}>
      <Text style={styles.label}>Log out</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: DesignLayout.buttonHeight,
    borderRadius: DesignRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: DesignColors.error,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    ...DesignTypography.bodyLg,
    fontWeight: '600',
    fontFamily,
    color: DesignColors.error,
  },
});
