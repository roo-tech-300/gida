const INVITE_PATH = /^\/join\/[0-9a-f]{32}\/?$/;

/**
 * Where a student may be sent back to after signing in. Only invite links qualify: anything else could be
 * used to bounce someone to a page an attacker chose, so it is ignored.
 */
export function isAllowedRedirect(path: string | null | undefined): path is string {
  return typeof path === 'string' && INVITE_PATH.test(path);
}
