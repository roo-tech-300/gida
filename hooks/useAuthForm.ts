import { loginUserAccount, registerUserAccount, UserProfileInput } from "@/services/authService";
import { useAppToast } from "@/components/ui/toast-card";
import { useAuth } from "@/context/auth-context";
import {
    AUTH_ERROR_TOAST_DURATION_MS,
    getLoginErrorToast,
    getSignupErrorToast,
} from "@/utils/auth-errors";
import { useRouter } from "expo-router";
import { useState } from "react";

export function useAuthForm() {
    const { showToast } = useAppToast();
    const { refreshProfile } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');

    const handleRegister = async (referralCode?: string) => {
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedFullName = fullName.trim();
        const trimmedReferralCode = referralCode?.trim() ? referralCode.trim() : undefined;
        if(!trimmedEmail || !password || !trimmedFullName){
            showToast({type: 'error', message: "Please fill in all required fields."});
            return;
        }
        setLoading(true);
        try {
            const profileData: UserProfileInput = { fullName: trimmedFullName, referralCode: trimmedReferralCode };
            const registration = await registerUserAccount(trimmedEmail, password, profileData);
            if (registration.requiresEmailConfirmation) {
                router.replace({ pathname: '/(auth)/verify-email', params: { email: trimmedEmail } });
                return;
            }
            await refreshProfile();
            showToast({type: 'success', message: "Registration successful!"});
            router.replace('/(onboarding)');
        } catch (error) {
            console.error("[useAuthForm] Registration failed:", error);
            setLoading(false);
            const toast = getSignupErrorToast(error);
            showToast({ type: 'error', title: toast.title, message: toast.message, durationMs: AUTH_ERROR_TOAST_DURATION_MS });
        }
    }

    const handleLogin = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      showToast({ type: 'error', message: 'Please fill in your email and password.' });
      return;
    }
    setLoading(true);
    try {
      await loginUserAccount(trimmedEmail, password);
      await refreshProfile();
      router.replace('/(tabs)');
    } catch (err) {
      setLoading(false);
      console.error("[useAuthForm] Login failed:", err);
      const toast = getLoginErrorToast(err);
      if (toast.redirectVerifyEmail) {
        router.replace({ pathname: '/(auth)/verify-email', params: { email: trimmedEmail } });
        showToast({ title: toast.title, message: toast.message, type: 'info', durationMs: AUTH_ERROR_TOAST_DURATION_MS });
        return;
      }
      showToast({ title: toast.title, message: toast.message, type: 'error', durationMs: AUTH_ERROR_TOAST_DURATION_MS });
    }
  };
   return {
    email, setEmail, password, setPassword,
    fullName, setFullName, loading,
    handleRegister, handleLogin
  };
};
