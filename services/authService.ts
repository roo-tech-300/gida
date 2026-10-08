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
