# Notify Apartment Match Function

Deploys an Edge Function that sends push notifications to users whose `living_preferences` score $\ge 70\%$ against a newly uploaded/published apartment.

## Deployment

Deploy with:
```bash
supabase functions deploy notify-apartment-match --no-verify-jwt
```

## Secrets

Uses the same secrets already present in Supabase for `send-message-push`:
- `FIREBASE_SERVICE_ACCOUNT_JSON`: Firebase service account JSON.
- `MATCH_WEBHOOK_SECRET` (optional): Optional secret passed in header `x-match-webhook-secret` for webhook authentication.

## Database Webhook Setup

In **Supabase Dashboard $\rightarrow$ Database $\rightarrow$ Webhooks**:
- **Name:** `notify-apartment-match`
- **Table:** `public.listings`
- **Events:** `INSERT`, `UPDATE`
- **Type:** Supabase Edge Function
- **Function:** `notify-apartment-match`
