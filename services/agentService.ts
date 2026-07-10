import { supabase } from '@/lib/supabase';

export type AgentApplicationData = {
  agencyName: string;
  city: string;
  catersToStudents: boolean;
  targetCampus: string | null;
};

export type SugCheckResult =
  | { valid: true; tokenId: string }
  | { valid: false };

export async function verifySugKey(businessName: string, secretToken: string): Promise<SugCheckResult> {
  const { data, error } = await supabase
    .from('sra_verification_tokens')
    .select('id, is_used, allocated_business_name')
    .eq('secret_token', secretToken.trim())
    .maybeSingle();

  if (error || !data) return { valid: false };
  if (data.is_used) return { valid: false };
  if (data.allocated_business_name?.toLowerCase() !== businessName.toLowerCase()) return { valid: false };

  return { valid: true, tokenId: data.id };
}

export type AgentProfile = {
  profile_id: string;
  business_name: string;
  operating_city: string;
  caters_to_students: boolean;
  target_campus: string | null;
  bio: string | null;
  is_active: boolean;
  verified_at: string | null;
  created_at: string;
};

export type AgentListing = {
  id: string;
  title: string;
  price_amount: number;
  location_landmark: string;
  city: string;
  primary_image: string | null;
  featured: boolean;
  status: string;
  created_at: string;
};

export async function fetchAgentListings(agentId: string): Promise<AgentListing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select('id, title, price_amount, location_landmark, city, primary_image, featured, status, created_at')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data as AgentListing[];
}

export async function fetchAgentProfile(profileId: string): Promise<AgentProfile | null> {
  const { data, error } = await supabase
    .from('agent_profiles')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle();

  if (error || !data) return null;
  return data as AgentProfile;
}

export async function submitAgentApplication(profileId: string, data: AgentApplicationData, sugTokenId?: string) {
  const { error: insertError } = await supabase.from('agent_profiles').insert({
    profile_id: profileId,
    business_name: data.agencyName.trim(),
    operating_city: data.city.trim(),
    caters_to_students: data.catersToStudents,
    target_campus: data.targetCampus?.trim() || null,
  });

  if (insertError) throw new Error(insertError.message);

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ is_agent: true })
    .eq('id', profileId);

  if (updateError) throw new Error(updateError.message);

  if (sugTokenId) {
    const { error: tokenError } = await supabase
      .from('sra_verification_tokens')
      .update({ is_used: true, used_by_profile_id: profileId })
      .eq('id', sugTokenId);

    if (tokenError) throw new Error(tokenError.message);
  }
}
