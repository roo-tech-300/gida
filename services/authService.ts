import { supabase } from "@/lib/supabase";

export interface UserProfileInput {
    fullName: string;
}

export async function registerUserAccount(email: string, password: string, profile: UserProfileInput){
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
    });
    if(authError) {
        console.error("Error registering user:", authError.message);
        throw new Error(authError.message);
    }
    if(!authData || !authData.user) {
        console.error("No user data returned after registration.");
        throw new Error("No user data returned after registration.");
    }

    const { error: profileError } = await supabase
    .from('profiles')
    .insert([
        {
            id: authData.user.id,
            full_name: profile.fullName,
            onboarded: false,
        }
    ]);

    if (profileError) {
        console.error("Error creating user profile:", profileError.message);
        throw new Error(profileError.message);
    }
    return authData.user;
};

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
