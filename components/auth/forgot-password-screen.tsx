import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthFooterLink } from '@/components/auth/auth-footer-link';
import { AuthIconBadge } from '@/components/auth/auth-icon-badge';
import { AuthInput } from '@/components/auth/auth-input';
import { AuthScreenLayout } from '@/components/auth/auth-screen-layout';
import { AuthStepPills } from '@/components/auth/auth-step-pills';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useForgotPassword } from '@/hooks/useForgotPassword';

export function ForgotPasswordScreen() {
    const { email, setEmail, emailError, isSending, handleSendCode } = useForgotPassword();

    return (
        <AuthScreenLayout
            title="Forgot your password?"
            subtitle="No worries — we'll email you a code to set a new one."
            footer={<AuthFooterLink prompt="Remembered your password?" actionLabel="Sign in" href="/login" />}>
            <AuthStepPills totalSteps={2} activeIndex={0} />
            <View style={styles.content}>
                <AuthIconBadge name="lock-closed-outline" />
                <AuthInput
                    autoCapitalize="none"
                    autoComplete="email"
                    error={emailError}
                    keyboardType="email-address"
                    label="Email"
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    textContentType="emailAddress"
                    value={email}
                />
                <View style={styles.tip}>
                    <Ionicons name="time-outline" size={18} color={DesignColors.primaryBright} />
                    <Text style={styles.tipText}>The code expires 60 minutes after it's sent.</Text>
                </View>
                <AuthButton isLoading={isSending} label="Send reset code" onPress={handleSendCode} />
            </View>
        </AuthScreenLayout>
    );
}

const styles = StyleSheet.create({
    content: {
        gap: DesignSpacing.md,
    },
    tip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: DesignSpacing.sm,
        borderRadius: DesignRadius.md,
        backgroundColor: DesignColors.primaryTint,
        borderWidth: 1,
        borderColor: DesignColors.primaryTintBorder,
        padding: DesignSpacing.md,
    },
    tipText: {
        ...DesignTypography.bodyMd,
        color: DesignColors.onSurfaceVariant,
        fontFamily,
        flex: 1,
    },
});
