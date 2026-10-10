import { supabase } from "@/lib/supabase";

export interface UserProfileInput {
    fullName: string;
}

export interface UserRegistrationResult {
    requiresEmailConfirmation: boolean;
}

export async function registerUserAccount(email: string, password: string, profile: UserProfileInput): Promise<UserRegistrationResult> {
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: profile.fullName,
            }
        }
    });
    if(authError) {
        console.error("Error registering user:", authError.message);
        throw new Error(authError.message);
    }
    if(!authData || !authData.user) {
        console.error("No user data returned after registration.");
        throw new Error("No user data returned after registration.");
    }
    return {
        requiresEmailConfirmation: authData.session === null,
    };
};

export async function resendSignupConfirmation(email: string): Promise<void> {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) {
        console.error('[Auth] Failed to resend signup confirmation:', error.message);
        throw new Error(error.message);
    }
}

export async function loginUserAccount(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    if(error) {
        console.error("Error logging in user:", error.message);
        throw new Error(error.message);
    }
    return data.user;
};

export async function signOutUserAccount() {
    const { error } = await supabase.auth.signOut();
    if(error) {
        console.error("Error signing out:", error.message);
        throw new Error(error.message);
    }
}

export async function requestPasswordResetEmail(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
        console.error('[Auth] Failed to send password reset email:', error.message);
        throw new Error(error.message);
    }
}

export async function verifyRecoveryCode(email: string, token: string): Promise<void> {
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'recovery' });
    if (error) {
        console.error('[Auth] Failed to verify recovery code:', error.message);
        throw new Error(error.message);
    }
    if (!data.session) {
        console.error('[Auth] Recovery code accepted but no session was returned.');
        throw new Error('Could not start a secure session. Please request a new code.');
    }
}

export async function setNewPassword(password: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
        console.error('[Auth] Failed to update password:', error.message);
        throw new Error(error.message);
    }
}

/** Returns true when a usable auth session is currently persisted on the device. */
export async function hasActiveSession(): Promise<boolean> {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
        console.error('[Auth] Failed to read current session:', error.message);
        return false;
    }
    return data.session !== null;
}

/** Signs out every session except the current one (called after a password reset). */
export async function revokeOtherSessions(): Promise<void> {
    const { error } = await supabase.auth.signOut({ scope: 'others' });
    if (error) {
        console.error('[Auth] Failed to revoke other sessions:', error.message);
        throw new Error(error.message);
    }
}
