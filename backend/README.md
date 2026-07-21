# TCP Onboarding App - Backend (Phase 2)

Express backend with Azure AD / Microsoft Graph integration for the
TCP Employee Onboarding Portal. Assumes Phase 1 (Azure App
Registration, API permissions, client secret) is already done.

## Deviations from the original spec (read this first)

- **Node's built-in `node:sqlite` instead of the `sqlite3` npm
  package.** First tried `better-sqlite3` for its simpler synchronous
  API - both `sqlite3` and `better-sqlite3` ship as native addons that
  npm has to compile for your exact Node version via node-gyp, and
  that compile step actually failed in this environment (no Visual
  Studio C++ build tools installed on Windows). Rather than asking you
  to install several GB of build tools just to run a local SQLite
  file, this uses `node:sqlite` (built into Node 22.5+, stable here on
  Node 24) - zero install for the database driver, which was the
  whole reason SQLite was chosen for local dev in the first place. Its
  API (`db.prepare(sql).run()/.get()/.all()`, named `@param` binding)
  is close enough to better-sqlite3 that porting to `better-sqlite3`
  or `sqlite3` later is a small, contained change if your deployment
  environment has build tools available.
- **`platform_status` gained a `requestType` column** (`'onboarding'`
  or `'offboarding'`) not in the original schema list. Onboarding and
  offboarding requests live in two separate tables, so a bare
  `requestId` foreign key is ambiguous without it.
- **Both platform-update endpoints are implemented**, since the spec
  listed them under two different sections: `PATCH
  /api/requests/:id/platform/:platform` (request-scoped) and `POST
  /api/platforms/:platform/provision` / `.../deprovision`
  (platform-scoped, takes `requestId`+`requestType` in the body). In
  a from-scratch design you'd normally pick one; both are here so
  nothing from the spec is missing.

## Setup

```bash
cd backend
npm install
```

Fill in `.env` (already created with placeholders) with your real
Phase 1 values:

```
AZURE_TENANT_ID=<your tenant ID>
AZURE_CLIENT_ID=<your app registration's client ID>
AZURE_CLIENT_SECRET=<the client secret VALUE, not its ID>
```

Then start the dev server (auto-restarts on file changes):

```bash
npm run dev
```

You should see:

```
[dbService] Migrations complete - all tables ready.
[server] TCP Onboarding backend listening on http://localhost:3001
[server] CORS allowed origins: http://localhost:5173
```

A SQLite file is created automatically at `backend/data/tcp_onboarding.db`
on first run - no separate database setup step.

## Testing the API

### 1. Health check (no Azure AD required)

```bash
curl http://localhost:3001/health
```

Expected:
```json
{ "status": "ok", "message": "TCP Backend running" }
```

### 2. Azure AD connectivity test

```bash
curl http://localhost:3001/api/test
```

Expected (success):
```json
{ "status": "ok", "message": "Azure AD connected!" }
```

Expected (missing/invalid `.env` values):
```json
{ "status": "error", "message": "Azure AD is not configured. Set AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET in backend/.env (see Phase 1 - Azure App Registration)." }
```

### 3. List Azure AD users

```bash
curl http://localhost:3001/api/users
```

### 4. Create a user (Azure AD account + local DB record)

```bash
curl -X POST http://localhost:3001/api/users/create \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane.doe.personal@gmail.com",
    "workEmail": "jane.doe@thecreditpros.com",
    "department": "IT",
    "jobTitle": "Support Specialist"
  }'
```

Expected (success): `201` with `{ "id": "...", "azureObjectId": "...", "status": "PENDING" }`

Expected (duplicate email): `409` with `{ "error": "A user with this email already exists." }`

Expected (missing field): `400` with `{ "error": "Validation failed", "details": ["..."] }`

### 5. Submit an onboarding request

```bash
curl -X POST http://localhost:3001/api/requests/onboarding \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<user id from step 4>",
    "submittedBy": "admin@thecreditpros.com",
    "department": "IT",
    "manager": "Robert Chen",
    "role": "Engineer",
    "floor": "C1",
    "jobTitle": "Support Specialist",
    "type": "Internal",
    "platforms": ["Azure AD", "Keeper", "Jira"]
  }'
```

### 6. List requests, filtered

```bash
curl "http://localhost:3001/api/requests?status=PENDING"
```

### 7. Get one request with its full platform + audit trail

```bash
curl http://localhost:3001/api/requests/<request id>
```

### 8. Update one platform's status on a request

```bash
curl -X PATCH http://localhost:3001/api/requests/<request id>/platform/Azure%20AD \
  -H "Content-Type: application/json" \
  -d '{ "status": "COMPLETED - AUTOMATED" }'
```

### 9. Complete the request

```bash
curl -X PATCH http://localhost:3001/api/requests/<request id> \
  -H "Content-Type: application/json" \
  -d '{ "status": "COMPLETED" }'
```

### 10. View the audit trail

```bash
curl http://localhost:3001/api/audit
curl "http://localhost:3001/api/audit?action=ONBOARDING_SUBMITTED"
curl http://localhost:3001/api/audit/<request id>
```

### 11. Disable / re-enable a user (offboarding / reactivation)

```bash
curl -X PATCH http://localhost:3001/api/users/<user id>/disable
curl -X PATCH http://localhost:3001/api/users/<user id>/enable
```

## What gets logged (and what never does)

Every write endpoint calls `recordAuditLog()` in `services/dbService.js`,
which:

- Stores only: action type, user id/email, affected employee name,
  request id, platform name, a small `details` object, status, and
  IP address.
- Runs `details` through `redactSensitiveFields()` first, which
  replaces the value of any key matching
  `password|secret|apikey|token|ssn|dob|creditcard|cvv` (case
  insensitive) with `'[REDACTED]'`, recursively.
- Never receives the Azure client secret, a Graph access token, or a
  user's temporary password - those values never leave
  `services/authService.js` / `services/graphService.js` in the
  first place, so there's nothing to redact even if a caller tried
  to log them by mistake.

## Production deployment notes

### Database: SQLite -> Azure SQL

See the comment block at the top of `services/dbService.js` for the
exact `mssql` connection code, including the Azure AD
(`azure-active-directory-default`) authentication option so the App
Service's managed identity - not a SQL login/password - is what
authenticates to the database.

### Secrets: `.env` -> Azure Key Vault

See the comment block at the bottom of `services/authService.js` for
a ready-to-use `loadSecretsFromKeyVault()` function using
`@azure/identity` + `@azure/keyvault-secrets`. Swap the `dotenv.config()`
call at the top of `server.js` for it when `NODE_ENV === 'production'`.

### Hosting: Azure App Service

1. `az webapp up --name <your-app-name> --runtime "NODE:20-lts"` (or
   deploy via GitHub Actions / Azure DevOps - either works with this
   as a plain Node app, no Dockerfile required).
2. Set the App Service's Application Settings to the same keys as
   `.env` (`AZURE_TENANT_ID`, etc.) - or, once Key Vault is wired up,
   just `KEY_VAULT_NAME` and `NODE_ENV=production`.
3. Enable the App Service's system-assigned managed identity, then
   grant it "Key Vault Secrets User" on your vault and the
   appropriate role on your Azure SQL database.
4. App Service terminates TLS for you - see the HTTPS comment block
   at the bottom of `server.js`.

### Rate limiting

Not enabled in development. See the comment block at the bottom of
`server.js` for the two-line `express-rate-limit` addition to make
before going to production.

## File structure

```
backend/
  package.json
  .env                  # local secrets - gitignored, never commit
  .gitignore
  server.js             # Express app, CORS, routes, error handling, boot
  services/
    authService.js      # MSAL client-credentials token acquisition
    graphService.js     # Microsoft Graph API calls (users)
    dbService.js        # SQLite connection, migrations, audit log writer + redaction
  routes/
    users.js
    requests.js
    platforms.js
    audit.js
  data/                 # SQLite file lives here once the server has run once (gitignored)
```
