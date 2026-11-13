type ErrorLike = { message?: unknown; error_description?: unknown };

/** Extracts a readable message from an unknown thrown value (Error, Supabase error, string). */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (typeof error === 'string' && error.trim()) return error;
  if (error && typeof error === 'object') {
    const { message, error_description: description } = error as ErrorLike;
    if (typeof message === 'string' && message.trim()) return message;
    if (typeof description === 'string' && description.trim()) return description;
  }
  return fallback;
}
