import { supabase } from '@/lib/supabase';
import type { Application, ApplicationRoommate, ClaimWithRoommates } from '@/types/claim';

export async function getActiveClaimForListing(listingId: string): Promise<Application | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rmRows, error: rmError } = await supabase
    .from('application_roommates')
    .select('application_id')
    .eq('student_id', user.id);

  if (rmError) throw rmError;
  if (!rmRows?.length) return null;

  const appIds = rmRows.map((r) => r.application_id);

  const { data: app, error: appError } = await supabase
    .from('applications')
    .select('*')
    .in('id', appIds)
    .eq('listing_id', listingId)
    .in('status', ['locked_pending_roommate', 'locked_pending_payment', 'partially_paid'])
    .maybeSingle();

  if (appError) throw appError;
  return app;
}

export async function getActiveClaimAnyListing(): Promise<Application | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rmRows, error: rmError } = await supabase
    .from('application_roommates')
    .select('application_id')
    .eq('student_id', user.id);

  if (rmError) throw rmError;
  if (!rmRows?.length) return null;

  const appIds = rmRows.map((r) => r.application_id);

  const { data: app, error: appError } = await supabase
    .from('applications')
    .select('*')
    .in('id', appIds)
    .in('status', ['locked_pending_roommate', 'locked_pending_payment', 'partially_paid'])
    .maybeSingle();

  if (appError) throw appError;
  return app;
}

export async function createClaim(
  listingId: string,
  studentId: string,
  splitAmount: number,
): Promise<Application> {
  const existing = await getActiveClaimForListing(listingId);
  if (existing) {
    throw new Error('This listing already has an active claim.');
  }

  const anyActive = await getActiveClaimAnyListing();
  if (anyActive) {
    throw new Error('You already have an active claim on another property.');
  }

  const { data: application, error: appError } = await supabase
    .from('applications')
    .insert({
      listing_id: listingId,
      student_id: studentId,
      status: 'locked_pending_payment',
      lock_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (appError) throw appError;

  const { error: rmError } = await supabase
    .from('application_roommates')
    .insert({
      application_id: application.id,
      student_id: studentId,
      invite_status: 'accepted',
      split_amount: splitAmount,
      has_paid: false,
    });

  if (rmError) throw rmError;
  return application;
}

export async function addRoommate(
  applicationId: string,
  studentId: string,
  splitAmount: number,
): Promise<ApplicationRoommate> {
  const { data, error } = await supabase
    .from('application_roommates')
    .insert({
      application_id: applicationId,
      student_id: studentId,
      invite_status: 'pending',
      split_amount: splitAmount,
      has_paid: false,
    })
    .select()
    .single();

  if (error) throw error;

  await supabase
    .from('applications')
    .update({ status: 'locked_pending_roommate' })
    .eq('id', applicationId);

  return data;
}

export async function removeRoommate(applicationId: string, studentId: string): Promise<void> {
  const { error } = await supabase
    .from('application_roommates')
    .delete()
    .eq('application_id', applicationId)
    .eq('student_id', studentId)
    .eq('invite_status', 'pending');

  if (error) throw error;
}

export async function acceptInvite(applicationId: string, studentId: string): Promise<void> {
  const { error } = await supabase
    .from('application_roommates')
    .update({ invite_status: 'accepted' })
    .eq('application_id', applicationId)
    .eq('student_id', studentId);

  if (error) throw error;

  const { data: roommates } = await supabase
    .from('application_roommates')
    .select('invite_status')
    .eq('application_id', applicationId);

  const allAccepted = roommates?.every((r) => r.invite_status === 'accepted');
  if (allAccepted) {
    await supabase
      .from('applications')
      .update({ status: 'locked_pending_payment' })
      .eq('id', applicationId);
  }
}

export async function declineInvite(applicationId: string, studentId: string): Promise<void> {
  const { error } = await supabase
    .from('application_roommates')
    .update({ invite_status: 'declined' })
    .eq('application_id', applicationId)
    .eq('student_id', studentId);

  if (error) throw error;
}

export async function markPaid(applicationId: string, studentId: string): Promise<void> {
  const { error } = await supabase
    .from('application_roommates')
    .update({ has_paid: true, invite_status: 'paid' })
    .eq('application_id', applicationId)
    .eq('student_id', studentId);

  if (error) throw error;

  const { data: roommates } = await supabase
    .from('application_roommates')
    .select('has_paid')
    .eq('application_id', applicationId);

  const allPaid = roommates?.every((r) => r.has_paid);
  if (allPaid) {
    await supabase
      .from('applications')
      .update({ status: 'completed' })
      .eq('id', applicationId);
  } else {
    await supabase
      .from('applications')
      .update({ status: 'partially_paid' })
      .eq('id', applicationId);
  }
}

export async function getClaimByApplicationId(applicationId: string): Promise<ClaimWithRoommates> {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      application_roommates(*),
      listing:applications_listing_id_fkey(id, title, price_amount, primary_image, max_roommates, rules)
    `)
    .eq('id', applicationId)
    .single();

  if (error) throw error;
  return await enrichWithProfiles(data as ClaimWithRoommates);
}

export async function getClaimByListingId(listingId: string): Promise<ClaimWithRoommates> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: rmRows, error: rmError } = await supabase
    .from('application_roommates')
    .select('application_id')
    .eq('student_id', user.id);

  if (rmError) throw rmError;
  if (!rmRows?.length) throw new Error('No claim found for this listing');

  const appIds = rmRows.map((r) => r.application_id);

  const { data: app, error: appError } = await supabase
    .from('applications')
    .select('id')
    .in('id', appIds)
    .eq('listing_id', listingId)
    .maybeSingle();

  if (appError) throw appError;
  if (!app) throw new Error('No claim found for this listing');

  return getClaimByApplicationId(app.id);
}

async function enrichWithProfiles(data: ClaimWithRoommates): Promise<ClaimWithRoommates> {
  const roommates = data.application_roommates;
  const studentIds = roommates.map((r) => r.student_id);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', studentIds);

  const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) ?? []);

  return {
    ...data,
    application_roommates: roommates.map((r) => ({
      ...r,
      full_name: profileMap.get(r.student_id) ?? null,
    })),
  };
}

export async function getStudentClaims(studentId: string): Promise<Application[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function cancelClaim(applicationId: string): Promise<void> {
  const { error } = await supabase
    .from('applications')
    .update({ status: 'expired' })
    .eq('id', applicationId);

  if (error) throw error;
}

export async function searchProfiles(query: string): Promise<{ id: string; full_name: string | null }[]> {
  if (!query.trim()) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .ilike('full_name', `%${query.trim()}%`)
    .limit(10);

  if (error) throw error;
  return data || [];
}
