import { useAppToast } from '@/components/ui/toast-card';
import { useAuth } from '@/context/auth-context';
import { useCooldown } from '@/hooks/useCooldown';
import {
    hasActiveSession,
    requestPasswordResetEmail,
    revokeOtherSessions,
    setNewPassword,
    verifyRecoveryCode,
} from '@/services/authService';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { isValidEmail } from '@/utils/email';

const RESEND_COOLDOWN_SECONDS = 60;
// MUST match Supabase Dashboard → Authentication → Settings → "OTP length"
// (GoTrue only allows 6–10 digits; 4 is not supported server-side).
const OTP_LENGTH = 6;
const MIN_PASSWORD_LENGTH = 8;

export function useForgotPassword() {
    const { showToast } = useAppToast();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState<string | undefined>(undefined);
    const [isSending, setIsSending] = useState(false);
    const cooldown = useCooldown();

    const updateEmail = (value: string) => {
        setEmail(value);
        if (emailError) setEmailError(undefined);
    };

    const handleSendCode = async () => {
        const trimmed = email.trim();
        if (!trimmed) {
            setEmailError('Enter your email address.');
            return;
        }
        if (!isValidEmail(trimmed)) {
            setEmailError('That doesn’t look like a valid email address.');
            return;
        }
        setEmailError(undefined);
        setIsSending(true);
        try {
            await requestPasswordResetEmail(trimmed);
            cooldown.start(RESEND_COOLDOWN_SECONDS);
            showToast({ type: 'success', message: 'Code sent. Check your inbox.' });
            router.push({ pathname: '/(auth)/verify-reset-code', params: { email: trimmed } });
        } catch (error) {
            console.error('[useForgotPassword] Failed to send reset code:', error);
            const message = error instanceof Error ? error.message : 'Something went wrong.';
            showToast({ type: 'error', title: 'Could not send code', message });
        } finally {
            setIsSending(false);
        }
    };

    return {
        email,
        setEmail: updateEmail,
        emailError,
        isSending,
        cooldown,
        cooldownSeconds: RESEND_COOLDOWN_SECONDS,
        handleSendCode,
    };
}

export function useVerifyResetCode(emailParam: string) {
    const { showToast } = useAppToast();
    const { refreshProfile } = useAuth();
    const router = useRouter();
    const [code, setCode] = useState('');
    const [newPassword, setNewPasswordState] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    // The code was requested moments ago, so the resend cooldown starts already running.
    const cooldown = useCooldown(RESEND_COOLDOWN_SECONDS);

    const handleResend = async () => {
        if (cooldown.isActive) return;
        try {
            await requestPasswordResetEmail(emailParam);
            cooldown.start(RESEND_COOLDOWN_SECONDS);
            showToast({ type: 'success', message: 'A new code is on its way.' });
        } catch (error) {
            console.error('[useVerifyResetCode] Failed to resend code:', error);
            showToast({ type: 'error', message: 'Could not resend the code. Try again shortly.' });
        }
    };

    const handleResetPassword = async () => {
        if (code.length !== OTP_LENGTH) {
            showToast({ type: 'error', message: `Enter the ${OTP_LENGTH}-digit code.` });
            return;
        }
        if (newPassword.length < MIN_PASSWORD_LENGTH) {
            showToast({ type: 'error', message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast({ type: 'error', message: 'Passwords do not match.' });
            return;
        }
        setIsSubmitting(true);
        try {
            await verifyRecoveryCode(emailParam, code);
            try {
                await setNewPassword(newPassword);
            } catch (error) {
                console.error('[useVerifyResetCode] Failed to set new password:', error);
                throw error;
            }
            try {
                await revokeOtherSessions();
            } catch (error) {
                // Non-fatal: the password is already updated, just log it.
                console.error('[useVerifyResetCode] Could not revoke other sessions:', error);
            }
            // Smart landing: if Supabase established a session (the normal case),
            // drop the user straight into their profile. Otherwise send them to
            // sign in with the new password.
            if (await hasActiveSession()) {
                await refreshProfile();
                showToast({ type: 'success', message: 'Password updated. Welcome back!' });
                router.replace('/(tabs)/profile');
            } else {
                showToast({ type: 'success', message: 'Password updated. Sign in with your new password.' });
                router.replace('/login');
            }
        } catch (error) {
            console.error('[useVerifyResetCode] Reset failed:', error);
            const message = error instanceof Error ? error.message : 'Something went wrong.';
            showToast({ type: 'error', title: 'Reset failed', message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        code,
        setCode,
        newPassword,
        setNewPassword: setNewPasswordState,
        confirmPassword,
        setConfirmPassword,
        isSubmitting,
        cooldown,
        cooldownSeconds: RESEND_COOLDOWN_SECONDS,
        otpLength: OTP_LENGTH,
        minPasswordLength: MIN_PASSWORD_LENGTH,
        handleResend,
        handleResetPassword,
    };
}
