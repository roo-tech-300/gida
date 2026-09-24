# Message push function

Deploy with `supabase functions deploy send-message-push --no-verify-jwt`.

Set these function secrets before deployment:

- `FIREBASE_SERVICE_ACCOUNT_JSON`: Firebase service-account JSON for the same project as the app's `google-services.json`. Grant the account the Firebase Cloud Messaging API role; keep this secret server-side.
- `MESSAGE_WEBHOOK_SECRET`: a long random value used to authenticate the Database Webhook.

Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to deployed functions. Configure a Database Webhook on `public.messages`, event `INSERT`, targeting this function; send `x-message-webhook-secret: <same secret>`. The webhook should include the standard Supabase database webhook payload. Do not also call this function from the app, as that can produce duplicates.
