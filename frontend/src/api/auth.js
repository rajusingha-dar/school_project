import { ApiError, refreshSession, request, setAccessToken } from './client';

/** Log in with email + password. Returns the user. */
export async function login(email, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
  setAccessToken(data.access_token);
  return data.user;
}

/** Register a new parent account and sign in. Returns the user. */
export async function register(fullName, email, password) {
  const data = await request('/auth/register', {
    method: 'POST',
    body: { full_name: fullName, email, password },
    auth: false,
  });
  setAccessToken(data.access_token);
  return data.user;
}

/** End the session on the server and forget the access token. */
export async function logout() {
  try {
    await request('/auth/logout', { method: 'POST', auth: false });
  } finally {
    setAccessToken(null);
  }
}

/** Try to resume a session from the refresh cookie. Returns the user, or null if signed out. */
export async function restoreSession() {
  try {
    const data = await refreshSession();
    return data.user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}
