// ============================================================
// routes/users.js
//
// GET   /api/users                  - list every real Azure AD user (full tenant directory)
// GET   /api/users/managed          - list only users onboarded through THIS app (local DB)
// POST  /api/users/create           - create a local DB record, optionally deferring Azure creation
// POST  /api/users/:id/provision-azure - create the REAL Azure AD account for an already-local user
// GET   /api/users/:id              - get one user (local DB record)
// PATCH /api/users/:id              - update user info in Azure + DB
// PATCH /api/users/:id/disable      - disable user (offboarding)
// PATCH /api/users/:id/enable       - re-enable user (reactivation)
// ============================================================

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb, recordAuditLog } = require('../services/dbService');
const graphService = require('../services/graphService');

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value) {
  return typeof value === 'string' && EMAIL_REGEX.test(value.trim());
}

// GET /api/users - proxies straight to Azure AD, since the FULL
// directory (not this app's local DB) is the source of truth for
// "every real employee that exists" - used where that distinction
// matters, e.g. checking a new hire's email against every real
// account, not just ones this app has touched.
router.get('/', async (req, res) => {
  try {
    const users = await graphService.listAzureUsers();
    res.json({ users });
  } catch (error) {
    console.error('[routes/users] GET / failed:', error.message);
    res.status(502).json({ error: 'Failed to list users from Azure AD.' });
  }
});

// GET /api/users/managed - only users this app has actually
// onboarded/managed (the local `users` table), not the full ~1000-
// person tenant directory. This is what ManageUsers/Dashboard/Reports
// show - registered BEFORE the /:id route below so Express doesn't
// match "managed" as an :id.
router.get('/managed', (req, res) => {
  try {
    const db = getDb();
    const users = db.prepare('SELECT * FROM users ORDER BY createdAt DESC').all();
    res.json({ users });
  } catch (error) {
    console.error('[routes/users] GET /managed failed:', error.message);
    res.status(500).json({ error: 'Failed to list managed users.' });
  }
});

// POST /api/users/create - creates the local DB record. By default
// (deferAzure not set) also creates the REAL Azure AD account
// immediately, same as before. When deferAzure is true, the local
// row is created with azureObjectId=null and the real Azure account
// is created later via POST /:id/provision-azure - this is what lets
// OnboardingForm submit a request as PENDING without touching Azure
// AD until an IT admin actually clicks "MS Azure" on RequestDetails.
router.post('/create', async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    department,
    manager,
    floor,
    jobTitle,
    type,
    workEmail,
    displayName,
    role,
    team,
    country,
    workingLocation,
    startDate,
    deferAzure,
  } = req.body;

  const validationErrors = [];
  if (!firstName || !firstName.trim()) validationErrors.push('firstName is required.');
  if (!lastName || !lastName.trim()) validationErrors.push('lastName is required.');
  if (!isValidEmail(email)) validationErrors.push('A valid personal email is required.');
  if (!isValidEmail(workEmail)) validationErrors.push('A valid work email is required.');

  if (validationErrors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: validationErrors });
  }

  const db = getDb();

  const duplicate = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (duplicate) {
    return res.status(409).json({ error: 'A user with this email already exists.' });
  }

  const resolvedDisplayName = (displayName && displayName.trim()) || `${firstName} ${lastName}`.trim();

  let azureUser = null;
  if (!deferAzure) {
    try {
      // Only firstName/lastName/displayName/jobTitle/department are real
      // Graph attributes - "role" (e.g. "IH.SalesAgent") has no Graph
      // equivalent and is stored locally only. See graphService.createAzureUser's
      // own comment for why.
      azureUser = await graphService.createAzureUser({ firstName, lastName, workEmail, department, jobTitle, displayName: resolvedDisplayName });
    } catch (error) {
      console.error('[routes/users] Azure user creation failed:', error.message);
      recordAuditLog({
        action: 'AZURE_USER_CREATE_FAILED',
        affectedUser: resolvedDisplayName,
        details: { department },
        status: 'FAILED',
        ipAddress: req.ip,
      });
      return res.status(502).json({ error: 'Failed to create user in Azure AD.' });
    }
  }

  const id = uuidv4();
  try {
    db.prepare(
      `INSERT INTO users
        (id, firstName, lastName, displayName, email, workEmail, azureObjectId, department, manager, floor, jobTitle, role, team, country, workingLocation, startDate, type, status)
       VALUES (@id, @firstName, @lastName, @displayName, @email, @workEmail, @azureObjectId, @department, @manager, @floor, @jobTitle, @role, @team, @country, @workingLocation, @startDate, @type, @status)`
    ).run({
      id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      displayName: resolvedDisplayName,
      email: email.trim().toLowerCase(),
      workEmail: workEmail.trim().toLowerCase(),
      azureObjectId: azureUser ? azureUser.id : null,
      department: department || null,
      manager: manager || null,
      floor: floor || null,
      jobTitle: jobTitle || null,
      role: role || null,
      team: team || null,
      country: country || null,
      workingLocation: workingLocation || null,
      startDate: startDate || null,
      type: type || 'Internal',
      status: 'PENDING',
    });

    recordAuditLog({
      action: 'USER_CREATED',
      userId: id,
      affectedUser: resolvedDisplayName,
      details: { department, workEmail, role, azureDeferred: Boolean(deferAzure) },
      status: 'SUCCESS',
      ipAddress: req.ip,
    });

    res.status(201).json({ id, azureObjectId: azureUser ? azureUser.id : null, status: 'PENDING' });
  } catch (error) {
    // The Azure account was already created above but the local DB
    // insert failed - flag this loudly so an admin can reconcile it
    // manually rather than silently losing track of a real account.
    console.error('[routes/users] Local DB insert failed after Azure user creation:', error.message);
    res.status(500).json({
      error: 'User was created in Azure AD but failed to save locally. Contact IT to reconcile this account.',
    });
  }
});

// POST /api/users/:id/provision-azure - creates the REAL Azure AD
// account for a user whose local row already exists but was created
// with deferAzure (azureObjectId is still null). This is what
// RequestDetails' "MS Azure" platform button calls.
router.post('/:id/provision-azure', async (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  if (user.azureObjectId) {
    return res.status(409).json({ error: 'This user already has a real Azure AD account.' });
  }

  let azureUser;
  try {
    azureUser = await graphService.createAzureUser({
      firstName: user.firstName,
      lastName: user.lastName,
      workEmail: user.workEmail,
      department: user.department,
      jobTitle: user.jobTitle,
      displayName: user.displayName,
    });
  } catch (error) {
    console.error('[routes/users] provision-azure failed:', error.message);
    recordAuditLog({
      action: 'AZURE_USER_CREATE_FAILED',
      userId: user.id,
      affectedUser: user.displayName,
      status: 'FAILED',
      ipAddress: req.ip,
    });
    return res.status(502).json({ error: 'Failed to create user in Azure AD.' });
  }

  try {
    db.prepare("UPDATE users SET azureObjectId = ?, updatedAt = datetime('now') WHERE id = ?").run(azureUser.id, user.id);
    recordAuditLog({
      action: 'USER_CREATED',
      userId: user.id,
      affectedUser: user.displayName,
      details: { azureObjectId: azureUser.id },
      status: 'SUCCESS',
      ipAddress: req.ip,
    });
    res.json({ id: user.id, azureObjectId: azureUser.id });
  } catch (error) {
    console.error('[routes/users] provision-azure DB update failed:', error.message);
    res.status(500).json({
      error: 'User was created in Azure AD but failed to save locally. Contact IT to reconcile this account.',
    });
  }
});

router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ user });
  } catch (error) {
    console.error('[routes/users] GET /:id failed:', error.message);
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

router.patch('/:id', async (req, res) => {
  const { department, manager, floor, jobTitle, type, role, team, country, workingLocation } = req.body;
  const db = getDb();

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  try {
    if (user.azureObjectId && (department !== undefined || jobTitle !== undefined)) {
      await graphService.updateAzureUser(user.azureObjectId, {
        ...(department !== undefined ? { department } : {}),
        ...(jobTitle !== undefined ? { jobTitle } : {}),
      });
    }

    db.prepare(
      `UPDATE users
       SET department = @department, manager = @manager, floor = @floor, jobTitle = @jobTitle, type = @type,
           role = @role, team = @team, country = @country, workingLocation = @workingLocation,
           updatedAt = datetime('now')
       WHERE id = @id`
    ).run({
      id: user.id,
      department: department ?? user.department,
      manager: manager ?? user.manager,
      floor: floor ?? user.floor,
      jobTitle: jobTitle ?? user.jobTitle,
      type: type ?? user.type,
      role: role ?? user.role,
      team: team ?? user.team,
      country: country ?? user.country,
      workingLocation: workingLocation ?? user.workingLocation,
    });

    recordAuditLog({
      action: 'USER_UPDATED',
      userId: user.id,
      affectedUser: `${user.firstName} ${user.lastName}`,
      details: { department, manager, floor, jobTitle, type },
      status: 'SUCCESS',
      ipAddress: req.ip,
    });

    res.json({ updated: true });
  } catch (error) {
    console.error('[routes/users] PATCH /:id failed:', error.message);
    res.status(502).json({ error: 'Failed to update user.' });
  }
});

async function setUserStatus(req, res, { accountEnabled, status }) {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  try {
    if (user.azureObjectId) {
      await graphService.setAzureUserEnabled(user.azureObjectId, accountEnabled);
    }

    db.prepare("UPDATE users SET status = ?, updatedAt = datetime('now') WHERE id = ?").run(status, user.id);

    recordAuditLog({
      action: accountEnabled ? 'USER_ENABLED' : 'USER_DISABLED',
      userId: user.id,
      affectedUser: `${user.firstName} ${user.lastName}`,
      status: 'SUCCESS',
      ipAddress: req.ip,
    });

    res.json({ id: user.id, status });
  } catch (error) {
    console.error(`[routes/users] set status (${status}) failed:`, error.message);
    res.status(502).json({ error: `Failed to ${accountEnabled ? 'enable' : 'disable'} user.` });
  }
}

router.patch('/:id/disable', (req, res) => setUserStatus(req, res, { accountEnabled: false, status: 'INACTIVE' }));
router.patch('/:id/enable', (req, res) => setUserStatus(req, res, { accountEnabled: true, status: 'ACTIVE' }));

module.exports = router;
