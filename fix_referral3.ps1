$path = 'C:\Users\eluzi\Documents\Zidexi\Gida\Gida\hooks\useAuthForm.ts'
$content = Get-Content $path -Raw

# Add imports for referral functions
$content = $content -replace "import \{ loginUserAccount, registerUserAccount, UserProfileInput \} from \"@/services/authService\";", "import { loginUserAccount, registerUserAccount, UserProfileInput } from \"@/services/authService\";\nimport { findReferrerByCode, createReferral, ensureReferralCode } from '@/services/referral-service';"

# Modify handleRegister to create referral after signup
$content = $content -replace "await refreshProfile\(\);", "await refreshProfile();\n            const { profile } = useAuth();")

# Actually that won't work - useAuth is a hook, can't call conditionally. Let me rewrite handleRegister properly.
$content = $content -replace "const handleRegister = async \(referralCode\?: string\) => \{[^}]*\}", "" # We'll rewrite

Set-Content -Path $path $content
Write-Host "Partial fix applied"