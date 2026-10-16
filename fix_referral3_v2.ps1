$path = 'C:\Users\eluzi\Documents\Zidexi\Gida\Gida\hooks\useAuthForm.ts'
$content = @'
import { loginUserAccount, registerUserAccount, UserProfileInput } from "@/services/authService";
import { useAppToast } from "@/components/ui/toast-card";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { findReferrerByCode, createReferral, ensureReferralCode } from "@/services/referral-service";

export function useAuthForm() {
    const { showToast } = useAppToast();
    const { refreshProfile, profile } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");

    const handleRegister = async (referralCode?: string) => {
        if (!email || !password || !fullName) {
            showToast({ type: "error", message: "Please fill in all required fields." });
            return;
        }
        setLoading(true);
        try {
            const profileData: UserProfileInput = { fullName, referralCode };
            const registration = await registerUserAccount(email, password, profileData);
            if (registration.requiresEmailConfirmation) {
                router.replace({ pathname: '/(auth)/verify-email', params: { email } });
                return;
            }
            await refreshProfile();

            // Record referral attribution if a referral code was provided
            if (referralCode && profile?.id) {
                try {
                    const referrer = await findReferrerByCode(referralCode);
                    if (referrer) {
                        await createReferral(referrer.id, profile.id, referralCode);
                    }
                    // Generate this user's own referral code so they can share it
                    await ensureReferralCode(profile.id);
                } catch (referralError) {
                    console.error("[useAuthForm] Failed to process referral attribution:", referralError);
                    // Don't block registration if referral attribution fails
                }
            }

            showToast({ type: 'success', message: "Registration successful!" });
            router.replace('/(onboarding)');
        } catch (error) {
            console.error("[useAuthForm] Registration failed:", error);
            setLoading(false);
            showToast({ type: 'error', message: "Registration failed. Please try again." });
        }
    }

    const handleLogin = async () => {
    if (!email || !password) {
      showToast({ type: 'error', message: 'Please fill in your email and password.' });
      return;
    }
    setLoading(true);
    try {
      await loginUserAccount(email, password);
      await refreshProfile();
      router.replace('/(tabs)');
    } catch (err) {
      setLoading(false);
      const message = err instanceof Error ? err.message : 'An error occurred during login. Please try again.';
      if (/email[_ ]not confirmed/i.test(message)) {
        router.replace({ pathname: '/(auth)/verify-email', params: { email } });
        return;
      }
      showToast({ title: 'Login Failed', message, type: 'error' });
    }
  };
   return {
    email, setEmail, password, setPassword,
    fullName, setFullName, loading,
    handleRegister, handleLogin
  };
};
'@
Set-Content -Path $path $content
Write-Host "useAuthForm.ts rewritten with referral attribution"