import type { Env } from './env';

export async function confirmTourBooking(env: Env, bookingId: string): Promise<boolean> {
  const baseUrl = env.SUPABASE_URL.replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/rest/v1/tour_bookings?id=eq.${bookingId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ status: 'booked' }),
  });
  if (!response.ok) {
    const text = await response.text();
    console.error(`[Paystack] Tour booking confirm failed: ${response.status} — ${text}`);
    return false;
  }
  await notifyAdminOfTour(env, bookingId);
  return true;
}

type TourBookingRow = {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  admin_id: string | null;
  user_id: string;
  listings: { title: string } | null;
};

type AdminProfileRow = {
  id: string;
  profile: { email: string | null; full_name: string | null } | null;
};

async function notifyAdminOfTour(env: Env, bookingId: string): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.warn('[Paystack] RESEND_API_KEY not configured; skipping tour email.');
    return;
  }
  const baseUrl = env.SUPABASE_URL.replace(/\/$/, '');
  const headers = {
    'Content-Type': 'application/json',
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  };

  try {
    const bookingResponse = await fetch(
      `${baseUrl}/rest/v1/tour_bookings?select=id,scheduled_date,scheduled_time,admin_id,user_id,listings(title)&id=eq.${bookingId}`,
      { headers },
    );
    if (!bookingResponse.ok) {
      return;
    }
    const [booking] = (await bookingResponse.json()) as TourBookingRow[];
    if (!booking || !booking.admin_id) {
      console.warn('[Paystack] No admin assigned for tour; skipping email.');
      return;
    }

    const adminResponse = await fetch(
      `${baseUrl}/rest/v1/admin_profiles?select=id,profile:profiles(email,full_name)&id=eq.${booking.admin_id}`,
      { headers },
    );
    if (!adminResponse.ok) {
      return;
    }
    const [adminRow] = (await adminResponse.json()) as AdminProfileRow[];
    const adminEmail = adminRow?.profile?.email;
    if (!adminEmail) {
      console.warn('[Paystack] Admin has no email on file; skipping tour email.');
      return;
    }

    const profileResponse = await fetch(
      `${baseUrl}/rest/v1/profiles?select=full_name&id=eq.${booking.user_id}`,
      { headers },
    );
    const studentName = profileResponse.ok
      ? ((await profileResponse.json()) as { full_name: string | null }[])[0]?.full_name ?? 'A resident'
      : 'A resident';

    const listingTitle = booking.listings?.title ?? 'a Gida property';
    const html =
      `<div style="font-family: Arial, sans-serif; color: #1b1b1d; line-height: 1.5;">` +
      `<h2 style="margin-bottom: 4px;">New guided tour booked</h2>` +
      `<p style="margin-top: 0; color: #555;">${studentName} has booked a guided tour of <strong>${listingTitle}</strong>.</p>` +
      `<p><strong>Date:</strong> ${booking.scheduled_date}<br/>` +
      `<strong>Time:</strong> ${booking.scheduled_time}</p>` +
      `<p>Open the Gida admin app to view and manage this tour.</p>` +
      `</div>`;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL ?? 'Gida Tours <help@gida.apartments>',
        to: [adminEmail],
        subject: `New guided tour: ${listingTitle}`,
        html,
      }),
    });
    if (!emailResponse.ok) {
      const text = await emailResponse.text();
      console.error(`[Paystack] Tour email failed: ${emailResponse.status} — ${text}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[Paystack] Tour email exception:', message);
  }
}
