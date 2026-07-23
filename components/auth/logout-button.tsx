import { Pressable, StyleSheet, Text } from 'react-native';
import { signOutUserAccount } from '@/services/authService';
import { CustomAlert, useCustomAlert } from '@/components/ui/custom-alert';
import {
  DesignColors,
  DesignLayout,
  DesignRadius,
  DesignTypography,
  fontFamily,
} from '@/constants/design';

export function LogoutButton() {
  const alert = useCustomAlert();

  const handleLogout = () => {
    alert.showAlert({
      title: 'Log out',
      message: 'Are you sure you want to log out?',
      buttons: [
        { label: 'Cancel', style: 'cancel' },
        {
          label: 'Log out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOutUserAccount();
            } catch (error) {}
          },
        },
      ],
    });
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.base,
          pressed && styles.pressed,
        ]}
        onPress={handleLogout}>
        <Text style={styles.label}>Log out</Text>
      </Pressable>
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        buttons={alert.buttons}
        onDismiss={alert.hideAlert}
      />
    </>
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
