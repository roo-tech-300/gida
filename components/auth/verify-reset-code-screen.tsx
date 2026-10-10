import { Ionicons } from '@expo/vector-icons';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthFooterLink } from '@/components/auth/auth-footer-link';
import { AuthIconBadge } from '@/components/auth/auth-icon-badge';
import { AuthInput } from '@/components/auth/auth-input';
import { AuthScreenLayout } from '@/components/auth/auth-screen-layout';
import { AuthStepPills } from '@/components/auth/auth-step-pills';
import { OtpInput } from '@/components/auth/otp-input';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useVerifyResetCode } from '@/hooks/useForgotPassword';
import { maskEmail } from '@/utils/email';

export function VerifyResetCodeScreen() {
    const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
    const email = typeof emailParam === 'string' ? emailParam : '';
    const {
        code,
        setCode,
        newPassword,
        setNewPassword,
        confirmPassword,
        setConfirmPassword,
        isSubmitting,
        cooldown,
        otpLength,
        minPasswordLength,
        handleResend,
        handleResetPassword,
    } = useVerifyResetCode(email);

    if (!email) {
        return <Redirect href="/(auth)/forgot-password" />;
    }

    return (
        <AuthScreenLayout
            title="Enter your code"
            subtitle={`We sent a ${otpLength}-digit code to ${maskEmail(email)}.`}
            footer={<AuthFooterLink prompt="Remembered your password?" actionLabel="Sign in" href="/login" />}>
            <AuthStepPills totalSteps={2} activeIndex={1} />
            <View style={styles.content}>
                <AuthIconBadge name="shield-checkmark-outline" />
                <OtpInput editable={!isSubmitting} length={otpLength} onChange={setCode} value={code} />
                <View style={styles.resendRow}>
                    <Text style={styles.resendPrompt}>Didn't get the code?</Text>
                    {cooldown.isActive ? (
                        <Text style={styles.resendMuted}>Resend in {cooldown.secondsLeft}s</Text>
                    ) : (
                        <Pressable accessibilityRole="button" disabled={isSubmitting} hitSlop={8} onPress={handleResend}>
                            <Text style={styles.resendAction}>Resend code</Text>
                        </Pressable>
                    )}
                </View>
                <View style={styles.divider} />
                <AuthInput
                    autoCapitalize="none"
                    autoComplete="new-password"
                    isPassword
                    label="New password"
                    onChangeText={setNewPassword}
                    placeholder={`At least ${minPasswordLength} characters`}
                    textContentType="newPassword"
                    value={newPassword}
                />
                <AuthInput
                    autoCapitalize="none"
                    autoComplete="new-password"
                    isPassword
                    label="Confirm new password"
                    onChangeText={setConfirmPassword}
                    placeholder="Re-enter your new password"
                    textContentType="newPassword"
                    value={confirmPassword}
                />
                <View style={styles.tip}>
                    <Ionicons name="sparkles-outline" size={18} color={DesignColors.primaryBright} />
                    <Text style={styles.tipText}>Tip: mix letters, numbers and symbols for a stronger password.</Text>
                </View>
                <AuthButton
                    isLoading={isSubmitting}
                    label="Reset password"
                    onPress={handleResetPassword}
                />
            </View>
        </AuthScreenLayout>
    );
}

const styles = StyleSheet.create({
    content: {
        gap: DesignSpacing.md,
    },
    resendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: DesignSpacing.xs,
    },
    resendPrompt: {
        ...DesignTypography.bodyMd,
        color: DesignColors.textSecondary,
        fontFamily,
    },
    resendAction: {
        ...DesignTypography.bodyMd,
        color: DesignColors.primaryBright,
        fontWeight: '600',
        fontFamily,
    },
    resendMuted: {
        ...DesignTypography.bodyMd,
        color: DesignColors.outline,
        fontFamily,
    },
    divider: {
        height: 1,
        backgroundColor: DesignColors.cardBorder,
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
