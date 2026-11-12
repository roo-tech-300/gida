export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  PAYSTACK_SECRET_KEY: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  /** Where the parent pay page is served, e.g. https://gida.apartments. No trailing slash. */
  PAY_PAGE_ORIGIN?: string;
  /** Override only for local development against a stand-in Paystack. */
  PAYSTACK_BASE_URL?: string;
}
