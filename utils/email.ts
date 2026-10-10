const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
    return EMAIL_PATTERN.test(email.trim());
}

/** j••••@domain.com — keeps enough of the address to be recognizable without exposing it fully. */
export function maskEmail(email: string): string {
    const [localPart = '', domain = ''] = email.split('@');
    if (!domain) return email;
    const visiblePrefix = localPart.slice(0, 2);
    const maskedTail = '•'.repeat(Math.max(localPart.length - visiblePrefix.length, 1));
    return `${visiblePrefix}${maskedTail}@${domain}`;
}