// ============================================================
// authService.js
//
// Acquires app-only (client-credentials) access tokens for
// calling Microsoft Graph as the backend service itself, not on
// behalf of a signed-in user. This is the right flow for an
// admin-facing provisioning tool like this one: the App
// Registration is granted application permissions (e.g.
// User.ReadWrite.All) once, in the Azure Portal, and every
// request the backend makes to Graph uses this same token.
//
// This file never logs AZURE_CLIENT_SECRET or the raw access
// token it acquires - only whether acquisition succeeded.
// ============================================================

const msal = require('@azure/msal-node');

let confidentialClientApp = null;

// Lazily builds the MSAL confidential client. Throws a clear,
// actionable error if the required .env values are missing,
// instead of letting MSAL fail later with a cryptic message.
function getConfidentialClient() {
  if (confidentialClientApp) {
    return confidentialClientApp;
  }

  const { AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET } = process.env;

  if (!AZURE_TENANT_ID || !AZURE_CLIENT_ID || !AZURE_CLIENT_SECRET) {
    throw new Error(
      'Azure AD is not configured. Set AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET in backend/.env ' +
        '(see Phase 1 - Azure App Registration).'
    );
  }

  confidentialClientApp = new msal.ConfidentialClientApplication({
    auth: {
      clientId: AZURE_CLIENT_ID,
      authority: `https://login.microsoftonline.com/${AZURE_TENANT_ID}`,
      clientSecret: AZURE_CLIENT_SECRET,
    },
  });

  return confidentialClientApp;
}

// Returns a valid Graph access token, acquiring (or, once MSAL's
// internal cache holds a still-valid one, reusing) it as needed.
// Callers should treat the resolved string as a secret in its own
// right - never log it, never return it in an API response.
async function getGraphToken() {
  const client = getConfidentialClient();

  try {
    const result = await client.acquireTokenByClientCredential({
      scopes: ['https://graph.microsoft.com/.default'],
    });

    if (!result || !result.accessToken) {
      throw new Error('MSAL returned no access token.');
    }

    return result.accessToken;
  } catch (error) {
    // error.errorCode/error.message from MSAL can be verbose but
    // does not include the client secret itself - safe to log.
    console.error('[authService] Failed to acquire Graph token:', error.errorCode || error.message);
    throw new Error('Unable to authenticate with Azure AD. Check AZURE_TENANT_ID/AZURE_CLIENT_ID/AZURE_CLIENT_SECRET.');
  }
}

// Quick connectivity check used by GET /api/test - acquires a
// token without calling Graph, so it verifies the App Registration
// credentials are valid without spending a real Graph API call.
async function verifyAzureConnection() {
  await getGraphToken();
  return { connected: true };
}

module.exports = {
  getGraphToken,
  verifyAzureConnection,
};

// ============================================================
// PRODUCTION: Azure Key Vault secret loading
// ============================================================
// To stop reading AZURE_CLIENT_SECRET (and the other values in
// .env) from environment variables in production, install
// @azure/identity and @azure/keyvault-secrets, then load secrets
// into process.env before anything else in server.js runs:
//
//   const { DefaultAzureCredential } = require('@azure/identity');
//   const { SecretClient } = require('@azure/keyvault-secrets');
//
//   async function loadSecretsFromKeyVault() {
//     const vaultUrl = `https://${process.env.KEY_VAULT_NAME}.vault.azure.net`;
//     // DefaultAzureCredential uses the App Service's managed identity
//     // in production - no secret of its own to manage.
//     const credential = new DefaultAzureCredential();
//     const client = new SecretClient(vaultUrl, credential);
//
//     const tenantId = await client.getSecret('AZURE-TENANT-ID');
//     const clientId = await client.getSecret('AZURE-CLIENT-ID');
//     const clientSecret = await client.getSecret('AZURE-CLIENT-SECRET');
//
//     process.env.AZURE_TENANT_ID = tenantId.value;
//     process.env.AZURE_CLIENT_ID = clientId.value;
//     process.env.AZURE_CLIENT_SECRET = clientSecret.value;
//   }
//
//   module.exports.loadSecretsFromKeyVault = loadSecretsFromKeyVault;
//
// Then in server.js, replace `require('dotenv').config()` with
// `await loadSecretsFromKeyVault()` when NODE_ENV === 'production'.
