// ============================================================
// server.js
//
// Main Express entry point. Boot order matters here:
//   1. Load .env (or, in production, Key Vault - see the comment
//      block below) before anything reads process.env.
//   2. Run database migrations so every table exists before the
//      first request can hit it.
//   3. Start listening.
//
// PRODUCTION: swap step 1 for Key Vault loading, e.g.:
//
//   let loadSecrets = () => {};
//   if (process.env.NODE_ENV === 'production') {
//     loadSecrets = require('./services/authService').loadSecretsFromKeyVault;
//   } else {
//     require('dotenv').config();
//   }
//   await loadSecrets();
//
// (the loadSecretsFromKeyVault implementation is sketched out as
// a comment at the bottom of services/authService.js)
// ============================================================

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { runMigrations } = require('./services/dbService');
const { verifyAzureConnection } = require('./services/authService');

const usersRouter = require('./routes/users');
const requestsRouter = require('./routes/requests');
const platformsRouter = require('./routes/platforms');
const auditRouter = require('./routes/audit');

const app = express();
const PORT = process.env.PORT || 3001;

// --- CORS ---
// Locked to the frontend's own origin only - not a wildcard "*".
// Add further allowed origins here (comma-separated in .env) if a
// staging frontend needs to reach this API too.
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map((o) => o.trim());
app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));

// Malformed JSON bodies land here as a SyntaxError from
// express.json() - caught explicitly so the client gets a clean
// 400 instead of Express's default HTML error page.
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Malformed JSON in request body.' });
  }
  next(err);
});

// --- Health check ---
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'TCP Backend running' });
});

// --- Azure AD connectivity test ---
// Acquires a real app-only token from Azure AD without calling
// Graph itself - confirms AZURE_TENANT_ID/CLIENT_ID/CLIENT_SECRET
// are correct end-to-end.
app.get('/api/test', async (req, res) => {
  try {
    await verifyAzureConnection();
    res.json({ status: 'ok', message: 'Azure AD connected!' });
  } catch (error) {
    // error.message here is already a safe, user-facing string -
    // see authService.getGraphToken's catch block.
    res.status(502).json({ status: 'error', message: error.message });
  }
});

// --- Routes ---
app.use('/api/users', usersRouter);
app.use('/api/requests', requestsRouter);
app.use('/api/platforms', platformsRouter);
app.use('/api/audit', auditRouter);

// --- 404 for anything else under /api ---
app.use('/api', (req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });
});

// --- Global error handler ---
// Must be registered last. Never forwards err.stack or raw error
// objects to the client - full detail goes to the server console
// only, where an operator (not an API caller) can see it.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[server] Unhandled error:', err.message);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }
  res.status(err.status || 500).json({ error: 'Internal server error.' });
});

// --- Boot ---
function start() {
  try {
    runMigrations();
  } catch (error) {
    console.error('[server] Failed to run database migrations - refusing to start.', error.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`[server] TCP Onboarding backend listening on http://localhost:${PORT}`);
    console.log(`[server] CORS allowed origins: ${allowedOrigins.join(', ')}`);
    console.log('[server] Try: curl http://localhost:' + PORT + '/health');
  });
}

start();

module.exports = app;

// ============================================================
// RATE LIMITING (production)
// ============================================================
// Not enabled by default in local development, but this app is
// structured to make adding it a two-line change once ready for
// production traffic:
//
//   npm install express-rate-limit
//
//   const rateLimit = require('express-rate-limit');
//   const apiLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 100,                 // limit each IP to 100 requests per window
//     standardHeaders: true,
//     legacyHeaders: false,
//   });
//   app.use('/api', apiLimiter);
//
// Place that app.use() call above the route mounts further up
// this file.
// ============================================================

// ============================================================
// HTTPS (production - Azure App Service)
// ============================================================
// Azure App Service terminates TLS at the platform level and
// forwards plain HTTP to this process, so server.js itself does
// not need an https.createServer() call. It should, however,
// redirect any request that reaches it over HTTP in production
// (App Service sets the x-forwarded-proto header):
//
//   if (process.env.NODE_ENV === 'production') {
//     app.use((req, res, next) => {
//       if (req.headers['x-forwarded-proto'] !== 'https') {
//         return res.redirect(`https://${req.headers.host}${req.url}`);
//       }
//       next();
//     });
//   }
// ============================================================
