import { supabase } from "@/lib/supabase";
import { throwAuthServiceError } from "@/utils/auth-errors";

export interface UserProfileInput {
    fullName: string;
    referralCode?: string;
}

export interface UserRegistrationResult {
    requiresEmailConfirmation: boolean;
}

export async function registerUserAccount(email: string, password: string, profile: UserProfileInput): Promise<UserRegistrationResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedFullName = profile.fullName.trim();
    const normalizedReferralCode = profile.referralCode?.trim() ? profile.referralCode.trim() : undefined;
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
            data: {
                full_name: normalizedFullName,
                ...(normalizedReferralCode ? { referral_code: normalizedReferralCode } : {}),
            }
        }
    });
    if(authError) {
        throwAuthServiceError("Error registering user", authError, "Registration failed.");
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
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim().toLowerCase() });
    if (error) {
        throwAuthServiceError("Failed to resend signup confirmation", error, "Could not resend confirmation email.");
    }
}

export async function loginUserAccount(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
    });
    if(error) {
        throwAuthServiceError("Error logging in user", error, "Login failed.");
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
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
    if (error) {
        throwAuthServiceError("Failed to send password reset email", error, "Could not send reset email.");
    }
}

export async function verifyRecoveryCode(email: string, token: string): Promise<void> {
    const { data, error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: token.trim(), type: 'recovery' });
    if (error) {
        throwAuthServiceError("Failed to verify recovery code", error, "Could not verify reset code.");
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
