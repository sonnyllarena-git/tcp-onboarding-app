// ============================================================
// routes/users.js
//
// GET   /api/users             - list all Azure AD users
// POST  /api/users/create      - create Azure AD user + local DB record
// GET   /api/users/:id         - get one user (local DB record)
// PATCH /api/users/:id         - update user info in Azure + DB
// PATCH /api/users/:id/disable - disable user (offboarding)
// PATCH /api/users/:id/enable  - re-enable user (reactivation)
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

// GET /api/users - proxies straight to Azure AD, since the
// directory itself (not this app's local DB) is the source of
// truth for "every user that exists".
router.get('/', async (req, res) => {
  try {
    const users = await graphService.listAzureUsers();
    res.json({ users });
  } catch (error) {
    console.error('[routes/users] GET / failed:', error.message);
    res.status(502).json({ error: 'Failed to list users from Azure AD.' });
  }
});

// POST /api/users/create - creates the Azure AD account first
// (the source of truth for auth/identity), then mirrors the
// result into the local `users` table for fast lookups by the
// rest of this API without round-tripping to Graph every time.
router.post('/create', async (req, res) => {
  const { firstName, lastName, email, department, manager, floor, jobTitle, type, workEmail } = req.body;

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

  let azureUser;
  try {
    azureUser = await graphService.createAzureUser({ firstName, lastName, workEmail, department, jobTitle });
  } catch (error) {
    console.error('[routes/users] Azure user creation failed:', error.message);
    recordAuditLog({
      action: 'AZURE_USER_CREATE_FAILED',
      affectedUser: `${firstName} ${lastName}`,
      details: { department },
      status: 'FAILED',
      ipAddress: req.ip,
    });
    return res.status(502).json({ error: 'Failed to create user in Azure AD.' });
  }

  const id = uuidv4();
  try {
    db.prepare(
      `INSERT INTO users
        (id, firstName, lastName, email, workEmail, azureObjectId, department, manager, floor, jobTitle, type, status)
       VALUES (@id, @firstName, @lastName, @email, @workEmail, @azureObjectId, @department, @manager, @floor, @jobTitle, @type, @status)`
    ).run({
      id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      workEmail: workEmail.trim().toLowerCase(),
      azureObjectId: azureUser.id,
      department: department || null,
      manager: manager || null,
      floor: floor || null,
      jobTitle: jobTitle || null,
      type: type || 'Internal',
      status: 'PENDING',
    });

    recordAuditLog({
      action: 'USER_CREATED',
      userId: id,
      affectedUser: `${firstName} ${lastName}`,
      details: { department, workEmail },
      status: 'SUCCESS',
      ipAddress: req.ip,
    });

    res.status(201).json({ id, azureObjectId: azureUser.id, status: 'PENDING' });
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
  const { department, manager, floor, jobTitle, type } = req.body;
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
           updatedAt = datetime('now')
       WHERE id = @id`
    ).run({
      id: user.id,
      department: department ?? user.department,
      manager: manager ?? user.manager,
      floor: floor ?? user.floor,
      jobTitle: jobTitle ?? user.jobTitle,
      type: type ?? user.type,
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
