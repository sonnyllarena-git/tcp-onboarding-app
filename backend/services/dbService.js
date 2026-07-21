// ============================================================
// dbService.js
//
// SQLite database layer for local development, using Node's
// built-in node:sqlite module (DatabaseSync) - no npm package at
// all for the database driver itself. The spec called for the
// "sqlite3" package, and an earlier version of this file used
// "better-sqlite3" instead for its simpler synchronous API - but
// both ship as native addons that need to be compiled for your
// exact Node version/OS via node-gyp, and that compile step failed
// on this machine (no Visual Studio C++ build tools installed).
// node:sqlite gives the same synchronous prepare/run/get/all API
// while shipping inside Node itself (Node >= 22.5, stable enough
// here on Node 24) - genuinely zero install for the database
// layer, which was the whole point of choosing SQLite for local
// dev in the first place. If your environment already has build
// tools and you'd rather use better-sqlite3, the two APIs used
// here are close enough that swapping the require + the two
// PRAGMA calls in getDb() below is the only change needed.
//
// PRODUCTION MIGRATION PATH (Azure SQL Database):
// Swap this file's connection logic for the "mssql" package
// and an Azure SQL connection string, e.g.:
//
//   const sql = require('mssql');
//   const pool = await sql.connect({
//     server: process.env.AZURE_SQL_SERVER,       // e.g. tcp-onboarding.database.windows.net
//     database: process.env.AZURE_SQL_DATABASE,
//     user: process.env.AZURE_SQL_USER,
//     password: process.env.AZURE_SQL_PASSWORD,   // or use AAD auth - see below
//     options: { encrypt: true, trustServerCertificate: false },
//   });
//
// For production, prefer Azure AD authentication over a SQL
// login/password pair:
//
//   const pool = await sql.connect({
//     server: process.env.AZURE_SQL_SERVER,
//     database: process.env.AZURE_SQL_DATABASE,
//     authentication: {
//       type: 'azure-active-directory-default', // uses the App Service managed identity
//     },
//     options: { encrypt: true },
//   });
//
// The CREATE TABLE statements below are written in SQLite dialect
// (TEXT/INTEGER only, no native UUID/BOOLEAN/DATETIME types).
// The inline comments on each table call out the equivalent
// Azure SQL (T-SQL) column types to use when porting the schema.
// ============================================================

const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = process.env.DB_PATH || './data/tcp_onboarding.db';

// Fields that must never be persisted to audit_logs or printed to
// the console, even if they show up nested inside a request body.
// Matched case-insensitively against object keys.
const SENSITIVE_KEY_PATTERN = /password|secret|apikey|api_key|token|ssn|social.?security|dob|dateofbirth|creditcard|credit_card|cardnumber|card_number|cvv/i;

let db = null;

// Opens the SQLite file (creating the parent directory if needed)
// and returns the shared connection. Safe to call multiple times -
// subsequent calls return the already-open connection.
function getDb() {
  if (db) {
    return db;
  }

  const resolvedPath = path.resolve(DB_PATH);
  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new DatabaseSync(resolvedPath);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  return db;
}

// Creates every table if it doesn't already exist. Safe to run on
// every server start - CREATE TABLE IF NOT EXISTS is a no-op once
// the schema is in place, which is this project's whole "migration"
// story for now. If the schema needs to change later, add a new
// ALTER TABLE statement guarded by a check against a schema_version
// row instead of editing these CREATE statements in place.
function runMigrations() {
  const connection = getDb();

  connection.exec(`
    -- Azure SQL: id NVARCHAR(36) PRIMARY KEY, status NVARCHAR(20),
    -- createdAt/updatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      workEmail TEXT,
      azureObjectId TEXT,
      department TEXT,
      manager TEXT,
      floor TEXT,
      jobTitle TEXT,
      type TEXT NOT NULL DEFAULT 'Internal',
      status TEXT NOT NULL DEFAULT 'PENDING',
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS onboarding_requests (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      submittedBy TEXT NOT NULL,
      department TEXT,
      manager TEXT,
      floor TEXT,
      role TEXT,
      jobTitle TEXT,
      type TEXT,
      platforms TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'PENDING',
      slaStartTime TEXT,
      slaEndTime TEXT,
      completedAt TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS offboarding_requests (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      submittedBy TEXT NOT NULL,
      platforms TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'PENDING',
      slaStartTime TEXT,
      slaEndTime TEXT,
      completedAt TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    -- requestType disambiguates which of the two request tables
    -- "requestId" points into, since onboarding and offboarding
    -- requests are separate tables rather than a single polymorphic
    -- one. Not in the original spec's schema, but required for the
    -- foreign key to be resolvable.
    CREATE TABLE IF NOT EXISTS platform_status (
      id TEXT PRIMARY KEY,
      requestId TEXT NOT NULL,
      requestType TEXT NOT NULL DEFAULT 'onboarding',
      platformName TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      completedAt TEXT,
      completedBy TEXT,
      errorMessage TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- "details" stores a JSON-encoded string. Every value written
    -- into it must already be passed through redactSensitiveFields()
    -- before it reaches this table - see routes/*.js call sites.
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      userId TEXT,
      userEmail TEXT,
      affectedUser TEXT,
      requestId TEXT,
      platformName TEXT,
      details TEXT,
      status TEXT NOT NULL DEFAULT 'SUCCESS',
      ipAddress TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_onboarding_userId ON onboarding_requests(userId);
    CREATE INDEX IF NOT EXISTS idx_onboarding_status ON onboarding_requests(status);
    CREATE INDEX IF NOT EXISTS idx_offboarding_userId ON offboarding_requests(userId);
    CREATE INDEX IF NOT EXISTS idx_offboarding_status ON offboarding_requests(status);
    CREATE INDEX IF NOT EXISTS idx_platform_status_requestId ON platform_status(requestId);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_requestId ON audit_logs(requestId);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_createdAt ON audit_logs(createdAt);
  `);

  console.log('[dbService] Migrations complete - all tables ready.');
  return connection;
}

// node:sqlite's DatabaseSync has no built-in `.transaction()` helper
// (unlike better-sqlite3), so multi-statement writes that must
// succeed or fail together (e.g. inserting a request plus its
// platform_status rows) go through this instead: BEGIN, run the
// callback, COMMIT - or ROLLBACK and re-throw if anything in the
// callback throws.
function runInTransaction(fn) {
  const connection = getDb();
  connection.exec('BEGIN');
  try {
    const result = fn();
    connection.exec('COMMIT');
    return result;
  } catch (error) {
    connection.exec('ROLLBACK');
    throw error;
  }
}

// Recursively walks an object/array and replaces the value of any
// key that looks sensitive with '[REDACTED]'. Used before writing
// to audit_logs.details and before any console.log of a request
// body, so secrets/PII never end up on disk or in server logs.
function redactSensitiveFields(value) {
  if (Array.isArray(value)) {
    return value.map(redactSensitiveFields);
  }

  if (value && typeof value === 'object') {
    const redacted = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      redacted[key] = SENSITIVE_KEY_PATTERN.test(key) ? '[REDACTED]' : redactSensitiveFields(nestedValue);
    }
    return redacted;
  }

  return value;
}

// Inserts one row into audit_logs. `details` may be any
// JSON-serializable value - it's redacted and stringified here so
// every call site gets consistent, safe logging for free.
function recordAuditLog({
  action,
  userId = null,
  userEmail = null,
  affectedUser = null,
  requestId = null,
  platformName = null,
  details = null,
  status = 'SUCCESS',
  ipAddress = null,
}) {
  const connection = getDb();
  const safeDetails = details ? JSON.stringify(redactSensitiveFields(details)) : null;

  connection
    .prepare(
      `INSERT INTO audit_logs
        (id, action, userId, userEmail, affectedUser, requestId, platformName, details, status, ipAddress)
       VALUES (@id, @action, @userId, @userEmail, @affectedUser, @requestId, @platformName, @details, @status, @ipAddress)`
    )
    .run({
      id: require('uuid').v4(),
      action,
      userId,
      userEmail,
      affectedUser,
      requestId,
      platformName,
      details: safeDetails,
      status,
      ipAddress,
    });
}

module.exports = {
  getDb,
  runMigrations,
  runInTransaction,
  redactSensitiveFields,
  recordAuditLog,
};
