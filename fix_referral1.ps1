$path = 'C:\Users\eluzi\Documents\Zidexi\Gida\Gida\types\referral.ts'
$content = Get-Content $path -Raw
$content = $content + "`n`nexport type Referral = {`n  id: string;`n  referrer_id: string;`n  referred_id: string;`n  referral_code: string;`n  created_at: string;`n};`n"
Set-Content -Path $path $content
Write-Host "Types fixed"

$path2 = 'C:\Users\eluzi\Documents\Zidexi\Gida\Gida\services\referral-service.ts'
$content2 = Get-Content $path2 -Raw
$content2 = $content2 -replace "import type \{ ReferralEarningsSummary \} from '@types/referral';", "import type { Referral, ReferralEarningsSummary } from '@types/referral';"
Set-Content -Path $path2 $content2
Write-Host "Service import fixed"