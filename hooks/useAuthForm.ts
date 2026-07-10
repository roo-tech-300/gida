import { loginUserAccount, registerUserAccount, UserProfileInput } from "@/services/authService";
import { useAppToast } from "@/components/ui/toast-card";
import { useRouter } from "expo-router";
import { useState } from "react";

export function useAuthForm() {
    const { showToast } = useAppToast();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');

    const handleRegister = async () => {
        if(!email || !password || !fullName){
            showToast({type: 'error', message: "Please fill in all required fields."});
            return;
        }
        setLoading(true);
        try {
            const profileData: UserProfileInput = { fullName };
            await registerUserAccount(email, password, profileData);
            showToast({type: 'success', message: "Registration successful!"});
            router.replace('/(onboarding)/city');
        } catch (error) {
            showToast({type: 'error', message: "Registration failed. Please try again."});
        } finally {
            setLoading(false);
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
      router.replace('/(tabs)');
    } catch (err: any) {
      showToast({ title: 'Login Failed', message: err.message || 'An error occurred during login. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };
   return {
    email, setEmail, password, setPassword,
    fullName, setFullName, loading,
    handleRegister, handleLogin
  };
};
