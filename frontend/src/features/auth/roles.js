export const ROLE_PARENT = 'parent';
export const ROLE_SCHOOL_ADMIN = 'school_admin';

/** Where each role lands after signing in. */
export function homePathFor(role) {
  return role === ROLE_SCHOOL_ADMIN ? '/admin' : '/dashboard';
}
