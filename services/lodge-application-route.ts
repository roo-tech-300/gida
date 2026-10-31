import { supabase } from '@/lib/supabase';

export type AdminLodgeApplicationRoute = `/admin/lodge-reservation/${string}`;

export type ApplicantLodgeApplicationRoute = {
  pathname: '/property/pay-slot';
  params: { id: string };
};

export type LodgeApplicationIds = {
  podId?: string | null;
  creditId?: string | null;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Single source of truth for opening an application in the admin review queue.
 * The applications list and every DM attachment must use this helper so they
 * always land on the same route.
 */
export function adminLodgeApplicationRoute(podId: string): AdminLodgeApplicationRoute {
  return `/admin/lodge-reservation/${podId}`;
}

/** Single source of truth for an applicant opening their payment/status screen. */
export function applicantLodgeApplicationRoute(creditId: string): ApplicantLodgeApplicationRoute {
  return { pathname: '/property/pay-slot', params: { id: creditId } };
}

/**
 * Resolve the real `pods.id` behind a message attachment.
 *
 * Older DMs stored only `creditId`, and a few legacy rows contain a local
 * `pod-dyn-*` id. Verify the pod first, then fall back to the credit link in
 * `pod_members` so an old DM still opens the exact same application as the
 * queue.
 */
export async function resolveLodgeApplicationPodId({
  podId,
  creditId,
}: LodgeApplicationIds): Promise<string | null> {
  if (podId) {
    try {
      const { data, error } = await supabase
        .from('pods')
        .select('id')
        .eq('id', podId)
        .maybeSingle();

      if (!error && data?.id) return data.id;

      if (error) {
        console.error('[LodgeRoute] Failed to verify pod id:', error.message);
        // A UUID is most likely a real pod that we simply could not reach
        // (offline). Keep the existing behaviour instead of blocking the tap.
        if (UUID_PATTERN.test(podId)) return podId;
      }
    } catch (error) {
      console.error('[LodgeRoute] Exception verifying pod id:', error);
      if (UUID_PATTERN.test(podId)) return podId;
    }
  }

  if (!creditId) return null;

  try {
    const { data, error } = await supabase
      .from('pod_members')
      .select('pod_id')
      .eq('slot_credit_id', creditId)
      .maybeSingle();

    if (error) {
      console.error('[LodgeRoute] Failed to resolve pod from credit:', error.message);
      return null;
    }
    return data?.pod_id ?? null;
  } catch (error) {
    console.error('[LodgeRoute] Exception resolving pod from credit:', error);
    return null;
  }
}

/**
 * Resolve the applicant's credit id for legacy decision DMs that predate the
 * `creditId` attachment field. The pod member row is the authoritative link.
 */
export async function resolveLodgeApplicationCreditId({
  podId,
  creditId,
  userId,
}: LodgeApplicationIds & { userId?: string | null }): Promise<string | null> {
  if (creditId) return creditId;
  if (!podId || !userId) return null;

  try {
    const { data, error } = await supabase
      .from('pod_members')
      .select('slot_credit_id')
      .eq('pod_id', podId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[LodgeRoute] Failed to resolve credit from pod:', error.message);
      return null;
    }
    return data?.slot_credit_id ?? null;
  } catch (error) {
    console.error('[LodgeRoute] Exception resolving credit from pod:', error);
    return null;
  }
}
