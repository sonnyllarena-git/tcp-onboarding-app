// ============================================================
// graphService.js
//
// Thin wrapper around the Microsoft Graph SDK for the handful of
// user-management calls this app needs: list/get/create/update
// users, and enable/disable accounts (offboarding/reactivation).
// Every function here throws a plain Error with a message safe to
// surface to an API caller - raw Graph error bodies (which can
// include internal request IDs) are logged server-side only.
// ============================================================

require('isomorphic-fetch');
const { Client } = require('@microsoft/microsoft-graph-client');
const { getGraphToken } = require('./authService');

// Builds a Graph client that fetches a fresh app-only token per
// request via the authProvider callback. authService caches/renews
// the underlying MSAL token, so this stays cheap to call often.
function getGraphClient() {
  return Client.init({
    authProvider: async (done) => {
      try {
        const token = await getGraphToken();
        done(null, token);
      } catch (error) {
        done(error, null);
      }
    },
  });
}

// Fields requested from Graph on every read - keeps responses
// small and avoids accidentally exposing fields the frontend has
// no use for.
const USER_SELECT_FIELDS = [
  'id',
  'displayName',
  'givenName',
  'surname',
  'userPrincipalName',
  'mail',
  'department',
  'jobTitle',
  'accountEnabled',
  'createdDateTime',
].join(',');

async function listAzureUsers() {
  try {
    const client = getGraphClient();
    const response = await client.api('/users').select(USER_SELECT_FIELDS).top(999).get();
    return response.value;
  } catch (error) {
    console.error('[graphService] listAzureUsers failed:', error.message);
    throw new Error('Failed to list users from Azure AD.');
  }
}

async function getAzureUser(azureObjectId) {
  try {
    const client = getGraphClient();
    return await client.api(`/users/${azureObjectId}`).select(USER_SELECT_FIELDS).get();
  } catch (error) {
    console.error('[graphService] getAzureUser failed:', error.message);
    throw new Error('Failed to fetch user from Azure AD.');
  }
}

// Creates a new Azure AD user account. `workEmail` becomes both
// the userPrincipalName and mailNickname; Graph requires a
// temporary password with forceChangePasswordNextSignIn so the
// new hire sets their own on first login.
//
// `role` (e.g. "IH.SalesAgent") has no standard Graph attribute to
// land in - Graph has no generic "role code" field, only jobTitle -
// so it is NOT sent to Azure here. It's still stored locally (users
// table + the onboarding request). Wiring it into Azure for real
// would need a custom directory extension attribute, left for a
// later phase per the Phase 4 spec's own "will finalize later" note.
async function createAzureUser({ firstName, lastName, workEmail, department, jobTitle, displayName }) {
  if (!firstName || !lastName || !workEmail) {
    throw new Error('firstName, lastName, and workEmail are required to create an Azure AD user.');
  }

  const temporaryPassword = generateTemporaryPassword();
  const mailNickname = workEmail.split('@')[0];

  try {
    const client = getGraphClient();
    const created = await client.api('/users').post({
      accountEnabled: true,
      displayName: displayName || `${firstName} ${lastName}`,
      givenName: firstName,
      surname: lastName,
      mailNickname,
      userPrincipalName: workEmail,
      department: department || undefined,
      jobTitle: jobTitle || undefined,
      passwordProfile: {
        forceChangePasswordNextSignIn: true,
        password: temporaryPassword,
      },
    });
    // The temporary password is never logged or returned by this
    // function - only the caller that generated it (this function)
    // ever sees it, and it isn't persisted anywhere.
    return created;
  } catch (error) {
    console.error('[graphService] createAzureUser failed:', error.message);
    throw new Error('Failed to create user in Azure AD.');
  }
}

async function updateAzureUser(azureObjectId, updates) {
  try {
    const client = getGraphClient();
    await client.api(`/users/${azureObjectId}`).patch(updates);
    return { updated: true };
  } catch (error) {
    console.error('[graphService] updateAzureUser failed:', error.message);
    throw new Error('Failed to update user in Azure AD.');
  }
}

async function setAzureUserEnabled(azureObjectId, accountEnabled) {
  try {
    const client = getGraphClient();
    await client.api(`/users/${azureObjectId}`).patch({ accountEnabled });
    return { accountEnabled };
  } catch (error) {
    console.error('[graphService] setAzureUserEnabled failed:', error.message);
    throw new Error(`Failed to ${accountEnabled ? 'enable' : 'disable'} user in Azure AD.`);
  }
}

// Generates a one-time temporary password meeting Azure AD's
// default complexity policy (upper/lower/digit/symbol, 12+ chars).
// This is a local, in-memory value only - it is handed to Graph in
// the create-user call above and never persisted or logged.
function generateTemporaryPassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%^&*';
  const pick = (chars) => chars[Math.floor(Math.random() * chars.length)];

  const required = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  const all = upper + lower + digits + symbols;
  const rest = Array.from({ length: 8 }, () => pick(all));

  return [...required, ...rest].sort(() => Math.random() - 0.5).join('');
}

module.exports = {
  listAzureUsers,
  getAzureUser,
  createAzureUser,
  updateAzureUser,
  setAzureUserEnabled,
};
