import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, refreshSession, request, setAccessToken, setAuthFailureHandler } from './client';

function jsonResponse(status, body) {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('api client', () => {
  beforeEach(() => {
    setAccessToken(null);
    setAuthFailureHandler(null);
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends the bearer token and credentials', async () => {
    setAccessToken('abc');
    fetch.mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    await request('/auth/me');
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe('/api/v1/auth/me');
    expect(options.headers.Authorization).toBe('Bearer abc');
    expect(options.credentials).toBe('include');
  });

  it('refreshes once on 401 and retries with the new token', async () => {
    setAccessToken('expired');
    fetch
      .mockResolvedValueOnce(jsonResponse(401, { detail: 'Not authenticated' }))
      .mockResolvedValueOnce(jsonResponse(200, { access_token: 'fresh', user: { id: 1 } }))
      .mockResolvedValueOnce(jsonResponse(200, { id: 1 }));

    const result = await request('/auth/me');

    expect(result).toEqual({ id: 1 });
    expect(fetch.mock.calls[1][0]).toBe('/api/v1/auth/refresh');
    expect(fetch.mock.calls[2][1].headers.Authorization).toBe('Bearer fresh');
  });

  it('calls the failure handler and throws when refresh fails', async () => {
    const onFailure = vi.fn();
    setAuthFailureHandler(onFailure);
    setAccessToken('expired');
    fetch
      .mockResolvedValueOnce(jsonResponse(401, { detail: 'Not authenticated' }))
      .mockResolvedValueOnce(jsonResponse(401, { detail: 'Session expired' }));

    await expect(request('/auth/me')).rejects.toMatchObject({ status: 401 });
    expect(onFailure).toHaveBeenCalledOnce();
  });

  it('shares one in-flight refresh between concurrent callers', async () => {
    fetch.mockResolvedValue(jsonResponse(200, { access_token: 'fresh', user: { id: 1 } }));
    await Promise.all([refreshSession(), refreshSession(), refreshSession()]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('does not try to refresh when auth is disabled (login)', async () => {
    fetch.mockResolvedValueOnce(jsonResponse(401, { detail: 'Incorrect email or password' }));
    await expect(request('/auth/login', { method: 'POST', body: {}, auth: false })).rejects.toThrow(
      'Incorrect email or password',
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('turns FastAPI validation errors into a readable message', async () => {
    fetch.mockResolvedValueOnce(
      jsonResponse(422, {
        detail: [{ loc: ['body', 'password'], msg: 'String should have at least 8 characters' }],
      }),
    );
    const error = await request('/auth/register', { method: 'POST', body: {}, auth: false }).catch(
      (caught) => caught,
    );
    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe('password: String should have at least 8 characters');
  });
});
