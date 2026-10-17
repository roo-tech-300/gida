// Human-readable toasts for Supabase email/password auth failures.
//
// Supabase best practice: switch on `error.code`, never on message text,
// and don't rely solely on HTTP status (statuses may change).
// See: https://supabase.com/docs/guides/auth/debugging/error-codes

export interface AuthServiceError {
  code?: string;
  status?: number;
  message: string;
  weakPasswordReasons?: string[];
}

export interface AuthErrorToast {
  title: string;
  message: string;
  type: 'error' | 'info';
  redirectVerifyEmail?: boolean;
}

/** Longer on-screen time for auth errors so users can actually read them. */
export const AUTH_ERROR_TOAST_DURATION_MS = 6500;

/**
 * Auth failure that keeps Supabase's machine-readable `code`/`status`
 * alongside the message, so UI code can map it to human copy.
 */
export class CodedAuthError extends Error {
  code?: string;
  status?: number;
  weakPasswordReasons?: string[];

  constructor(
    message: string,
    fields?: { code?: string; status?: number; weakPasswordReasons?: string[] },
  ) {
    super(message);
    this.name = 'CodedAuthError';
    this.code = fields?.code;
    this.status = fields?.status;
    this.weakPasswordReasons = fields?.weakPasswordReasons;
  }
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((entry): entry is string => typeof entry === 'string')
  );
}

/** Normalize anything thrown by the auth service into a shaped error. */
export function toAuthServiceError(error: unknown): AuthServiceError {
  if (typeof error !== 'object' || error === null) {
    return { message: 'Something went wrong.' };
  }
  const record = error as {
    code?: unknown;
    status?: unknown;
    message?: unknown;
    reasons?: unknown;
  };
  return {
    code: typeof record.code === 'string' ? record.code : undefined,
    status: typeof record.status === 'number' ? record.status : undefined,
    message:
      typeof record.message === 'string' && record.message.length > 0
        ? record.message
        : 'Something went wrong.',
    weakPasswordReasons: isStringArray(record.reasons) ? record.reasons : undefined,
  };
}

const OFFLINE_PATTERNS = [
  /failed to fetch/i,
  /network request failed/i,
  /networkerror/i,
  /\boffline\b/i,
  /load failed/i,
];

function offlineToast(): AuthErrorToast {
  return {
    title: "You're offline",
    message: 'Check your internet connection and try again.',
    type: 'error',
  };
}

function isOfflineError(error: AuthServiceError): boolean {
  return OFFLINE_PATTERNS.some((pattern) => pattern.test(error.message));
}

function rateLimitToast(title: string): AuthErrorToast {
  return { title, message: 'Too many attempts. Wait a minute, then try again.', type: 'error' };
}

function serverToast(): AuthErrorToast {
  return {
    title: 'Something went wrong',
    message: "We're having trouble on our end. Try again in a moment.",
    type: 'error',
  };
}

/** Turn Supabase's `weak_password` reasons into actionable guidance. */
export function getWeakPasswordMessage(reasons?: string[]): string {
  if (!reasons || reasons.length === 0) {
    return 'Your password is too weak. Try a longer one with mixed characters.';
  }
  if (reasons.includes('pwned')) {
    return 'That password has appeared in data breaches. Please choose a different one.';
  }
  if (reasons.includes('length')) {
    return 'Your password is too short. Use at least 8 characters.';
  }
  if (reasons.includes('characters')) {
    return 'Mix uppercase, lowercase, numbers and symbols for a stronger password.';
  }
  return 'Your password is too weak. Try a longer one with mixed characters.';
}

function alreadyRegisteredToast(): AuthErrorToast {
  return {
    title: 'This email is already registered',
    message: 'An account with this email already exists. Try signing in instead.',
    type: 'error',
  };
}

function verifyEmailToast(): AuthErrorToast {
  return {
    title: 'Verify your email',
    message: 'Check your inbox for the confirmation link.',
    type: 'info',
    redirectVerifyEmail: true,
  };
}

/**
 * Log + re-throw a Supabase auth failure preserving `code`/`status`.
 * Never throws away the machine-readable fields with `new Error(message)`.
 */
export function throwAuthServiceError(
  context: string,
  rawError: unknown,
  fallbackMessage: string,
): never {
  const normalized = toAuthServiceError(rawError);
  console.error(`[Auth] ${context}:`, rawError);
  throw new CodedAuthError(normalized.message || fallbackMessage, {
    code: normalized.code,
    status: normalized.status,
    weakPasswordReasons: normalized.weakPasswordReasons,
  });
}

/** Map a signup failure to hand-written, readable toast copy. */
export function getSignupErrorToast(error: unknown): AuthErrorToast {
  const err = toAuthServiceError(error);
  if (isOfflineError(err)) return offlineToast();

  switch (err.code) {
    case 'user_already_exists':
    case 'email_exists':
      return alreadyRegisteredToast();
    case 'weak_password':
      return {
        title: 'Password too weak',
        message: getWeakPasswordMessage(err.weakPasswordReasons),
        type: 'error',
      };
    case 'email_address_invalid':
      return {
        title: 'Check your email',
        message: "That address doesn't look valid. Check for typos.",
        type: 'error',
      };
    case 'validation_failed':
      return {
        title: 'Check your details',
        message: 'Something in the form looks off. Review and try again.',
        type: 'error',
      };
    case 'signup_disabled':
      return {
        title: 'Signups paused',
        message: "We're not accepting new accounts right now. Try again later.",
        type: 'error',
      };
    case 'captcha_failed':
      return {
        title: 'Verification failed',
        message: 'Please complete the check and try again.',
        type: 'error',
      };
    default:
      break;
  }

  if (
    err.status === 429 ||
    err.code === 'over_email_send_rate_limit' ||
    err.code === 'over_request_rate_limit'
  ) {
    return rateLimitToast('Slow down');
  }
  if (typeof err.status === 'number' && err.status >= 500) return serverToast();

  const msg = err.message.toLowerCase();
  if (msg.includes('already') && (msg.includes('exist') || msg.includes('registered'))) {
    return alreadyRegisteredToast();
  }
  if (msg.includes('weak') && msg.includes('password')) {
    return {
      title: 'Password too weak',
      message: getWeakPasswordMessage(err.weakPasswordReasons),
      type: 'error',
    };
  }
  if (msg.includes('email') && msg.includes('not confirmed')) return verifyEmailToast();

  return {
    title: 'Signup failed',
    message: 'We could not create your account. Please try again.',
    type: 'error',
  };
}

/** Map a login failure to hand-written, readable toast copy. */
export function getLoginErrorToast(error: unknown): AuthErrorToast {
  const err = toAuthServiceError(error);
  if (isOfflineError(err)) return offlineToast();

  switch (err.code) {
    case 'invalid_credentials':
    case 'user_not_found':
      return {
        title: "Couldn't sign you in",
        message: "That email and password don't match our records.",
        type: 'error',
      };
    case 'email_not_confirmed':
      return verifyEmailToast();
    case 'user_banned':
      return {
        title: 'Account restricted',
        message: 'This account has been restricted. Contact support if this is a mistake.',
        type: 'error',
      };
    case 'user_sso_managed':
      return {
        title: 'Use organisation login',
        message: 'This account signs in through your organisation.',
        type: 'error',
      };
    case 'validation_failed':
      return {
        title: 'Check your details',
        message: 'Something in the form looks off. Review and try again.',
        type: 'error',
      };
    case 'captcha_failed':
      return {
        title: 'Verification failed',
        message: 'Please complete the check and try again.',
        type: 'error',
      };
    default:
      break;
  }

  if (err.status === 429 || err.code === 'over_request_rate_limit') {
    return rateLimitToast('Too many attempts');
  }
  if (typeof err.status === 'number' && err.status >= 500) return serverToast();

  const msg = err.message.toLowerCase();
  if (msg.includes('email') && msg.includes('not confirmed')) return verifyEmailToast();

  return {
    title: 'Login failed',
    message: 'We could not sign you in. Please try again.',
    type: 'error',
  };
}

