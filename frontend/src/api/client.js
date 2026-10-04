/**
 * Minimal fetch wrapper for the LearnCurve API.
 *
 * - The access token lives only in memory (never localStorage).
 * - The refresh token is an httpOnly cookie managed by the browser.
 * - On a 401 the client silently refreshes once and retries the request.
 */

const API_BASE = '/api/v1';

let accessToken = null;
let refreshPromise = null;
let authFailureHandler = null;

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function setAccessToken(token) {
  accessToken = token;
}

/** Register a callback invoked when the session can no longer be refreshed. */
export function setAuthFailureHandler(handler) {
  authFailureHandler = handler;
}

/** Turn a FastAPI error body (string or validation array) into a readable message. */
function extractMessage(body, fallback) {
  const detail = body?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    const field = Array.isArray(first.loc) ? first.loc[first.loc.length - 1] : null;
    const label = field && field !== 'body' ? `${String(field).replace('_', ' ')}: ` : '';
    return `${label}${first.msg}`;
  }
  return fallback;
}

async function send(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
}

async function parse(response) {
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      response.status,
      extractMessage(data, 'Something went wrong. Please try again.'),
    );
  }
  return data;
}

/**
 * Exchange the refresh cookie for a new access token. Concurrent callers share one request,
 * because refresh tokens rotate and a second parallel call would look like token reuse.
 *
 * @returns {Promise<object>} the AuthResponse ({ access_token, user, ... })
 */
export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = send('/auth/refresh', { method: 'POST', auth: false })
      .then(parse)
      .then((data) => {
        accessToken = data.access_token;
        return data;
      })
      .catch((error) => {
        accessToken = null;
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/**
 * Call the API, transparently refreshing the session once on 401.
 *
 * @param {string} path path under /api/v1
 * @param {{method?: string, body?: unknown, auth?: boolean}} options
 */
export async function request(path, options = {}) {
  let response = await send(path, options);
  if (response.status === 401 && options.auth !== false) {
    try {
      await refreshSession();
    } catch {
      if (authFailureHandler) authFailureHandler();
      return parse(response);
    }
    response = await send(path, options);
  }
  return parse(response);
}
