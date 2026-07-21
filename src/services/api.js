/**
 * api.js
 *
 * Thin fetch client for the real Phase 2 Express backend
 * (http://localhost:3001). Every domain service (userService,
 * requestService, platformService, auditService) calls through this
 * instead of hitting fetch() directly, so timeout handling, error
 * message mapping, and request/response logging live in one place.
 *
 * The backend does NOT wrap responses in a {success, data, message}
 * envelope - it returns the resource directly on success (e.g.
 * { users: [...] }, { id, status }) and { error, details? } on
 * failure. This client normalizes failures into a thrown ApiError so
 * every caller can just try/catch instead of checking response.success.
 */

const API_BASE_URL = 'http://localhost:3001';
const REQUEST_TIMEOUT_MS = 30000;

export class ApiError extends Error {
  constructor(message, { status = null, code = 'API_ERROR', details = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request(method, path, body) {
  const url = `${API_BASE_URL}${path}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`[API] ${method} ${path}: timeout after ${REQUEST_TIMEOUT_MS}ms`);
      throw new ApiError('⏱️ Request timed out. Please try again.', { code: 'TIMEOUT' });
    }
    console.error(`[API] ${method} ${path}: network error -`, error.message);
    throw new ApiError(
      '❌ Backend server not running. Start it with: npm run dev (in the backend folder)',
      { code: 'NETWORK_ERROR' }
    );
  } finally {
    clearTimeout(timeoutId);
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const backendMessage = payload?.error || payload?.message;
    console.error(`[API] ${method} ${path}:`, response.status, backendMessage || '(no response body)');

    if (response.status === 401) {
      throw new ApiError('🔐 Session expired. Please login again.', { status: 401, code: 'UNAUTHORIZED' });
    }
    if (response.status === 403) {
      throw new ApiError("🚫 You don't have permission for this action.", { status: 403, code: 'FORBIDDEN' });
    }
    if (response.status === 404) {
      throw new ApiError(`❌ ${backendMessage || 'Not found.'}`, { status: 404, code: 'NOT_FOUND' });
    }
    if (response.status === 409) {
      throw new ApiError(`❌ ${backendMessage || 'This already exists.'}`, { status: 409, code: 'CONFLICT' });
    }
    if (response.status === 400) {
      throw new ApiError(`❌ ${backendMessage || 'Invalid request.'}`, {
        status: 400,
        code: 'BAD_REQUEST',
        details: payload?.details,
      });
    }
    if (response.status === 502) {
      throw new ApiError('🔗 Azure integration failed. Contact IT.', {
        status: 502,
        code: 'AZURE_FAILURE',
        details: backendMessage,
      });
    }
    throw new ApiError('⚠️ Server error. Please try again later.', {
      status: response.status,
      code: 'SERVER_ERROR',
      details: backendMessage,
    });
  }

  console.log(`[API] ${method} ${path}: ${response.status}`);
  return payload;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body === undefined ? {} : body),
  patch: (path, body) => request('PATCH', path, body === undefined ? {} : body),
};
