$path = 'C:\Users\eluzi\Documents\Zidexi\Gida\Gida\services\referral-service.ts'
$content = Get-Content $path -Raw
$content = $content -replace "import type \{ ReferralEarningsSummary \} from '@types/referral';", "import type { Referral, ReferralEarningsSummary } from '@types/referral';"
# Append new functions at the end
$content = $content + @"

export async function findReferrerByCode(referralCode: string): Promise<{ id: string; full_name?: string | null } | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('referral_code', referralCode.trim().toUpperCase())
    .maybeSingle();
  if (error || !data) return null;
  return { id: data.id, full_name: data.full_name ?? null };
}

export async function createReferral(
  referrerId: string,
  referredId: string,
  referralCode: string,
): Promise<Referral | null> {
  const { data, error } = await supabase
    .from('referrals')
    .insert({
      referrer_id: referrerId,
      referred_id: referredId,
      referral_code: referralCode,
    })
    .select()
    .maybeSingle();
  if (error || !data) {
    console.error('[ReferralService] Failed to create referral:', error?.message);
    return null;
  }
  return data as Referral;
}
"@
Set-Content -Path $path $content
Write-Host "findReferrerByCode and createReferral added"