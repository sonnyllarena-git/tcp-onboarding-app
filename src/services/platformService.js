/**
 * platformService.js
 *
 * GET /api/platforms and the two platform-scoped provisioning
 * endpoints, plus the Azure AD connectivity check used by Settings/
 * an admin diagnostics view. RequestDetails uses requestService's
 * updatePlatformStatus (request-scoped) instead of provision/
 * deprovision below for its per-platform buttons - both endpoints
 * exist on the backend for the same reason (see backend/README.md),
 * these are exposed here for completeness/future use.
 */

import { api } from './api';

/** GET /api/platforms */
export async function listPlatforms() {
  const { platforms } = await api.get('/api/platforms');
  return platforms;
}

/** POST /api/platforms/:platform/provision */
export async function provisionPlatform(platformName, { requestId, requestType }) {
  return api.post(`/api/platforms/${encodeURIComponent(platformName)}/provision`, { requestId, requestType });
}

/** POST /api/platforms/:platform/deprovision */
export async function deprovisionPlatform(platformName, { requestId, requestType }) {
  return api.post(`/api/platforms/${encodeURIComponent(platformName)}/deprovision`, { requestId, requestType });
}

/** GET /api/test - real Azure AD connectivity check. */
export async function testAzureConnection() {
  return api.get('/api/test');
}
