// ============================================================
// routes/platforms.js
//
// GET /api/platforms                        - list every platform this app manages
// POST /api/platforms/:platform/provision    - mark a platform PENDING -> COMPLETED for a request
// POST /api/platforms/:platform/deprovision  - mark a platform COMPLETED -> COMPLETED (deprovisioned) for a request
//
// This mirrors the platform_status rows created alongside each
// onboarding/offboarding request (see routes/requests.js) - these
// two POST endpoints are what RequestDetails' "Click to Trigger
// Automation" / "Click to Offboard Manually" buttons call.
// ============================================================

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb, recordAuditLog } = require('../services/dbService');

const router = express.Router();

// Same canonical platform list as the existing frontend
// (src/mockData.js PLATFORMS), so this API and the current
// mock-data frontend describe the same set of platforms - useful
// once the frontend is wired up to call this backend.
const PLATFORMS = [
  { name: 'Azure AD', offboardAction: 'Disable account' },
  { name: 'Keeper', offboardAction: 'Delete credentials' },
  { name: 'Hodu', offboardAction: 'Disable agent' },
  { name: 'Krisp', offboardAction: 'Disable license' },
  { name: 'Jira', offboardAction: 'Remove access' },
  { name: 'Zoho Desk', offboardAction: 'Remove access' },
  { name: 'Acuity', offboardAction: 'Revoke' },
  { name: 'TheCreditPros Portal', offboardAction: 'Remove access' },
  { name: 'Sales IQ', offboardAction: 'Disable' },
  { name: 'StaffCounter', offboardAction: 'Disable' },
];

router.get('/', (req, res) => {
  res.json({ platforms: PLATFORMS });
});

// Shared body validation for both provision/deprovision below.
function validateProvisionBody(body) {
  const errors = [];
  if (!body.requestId || typeof body.requestId !== 'string') {
    errors.push('requestId is required.');
  }
  if (!body.requestType || !['onboarding', 'offboarding'].includes(body.requestType)) {
    errors.push('requestType is required and must be "onboarding" or "offboarding".');
  }
  return errors;
}

router.post('/:platform/provision', (req, res) => {
  const { platform } = req.params;
  const { requestId, requestType, completedBy } = req.body;

  const errors = validateProvisionBody(req.body);
  if (!PLATFORMS.some((p) => p.name === platform)) {
    errors.push(`Unknown platform "${platform}".`);
  }
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  try {
    const db = getDb();
    const now = new Date().toISOString();

    const existing = db
      .prepare('SELECT id FROM platform_status WHERE requestId = ? AND requestType = ? AND platformName = ?')
      .get(requestId, requestType, platform);

    if (existing) {
      db.prepare(
        `UPDATE platform_status
         SET status = ?, completedAt = ?, completedBy = ?, errorMessage = NULL, updatedAt = ?
         WHERE id = ?`
      ).run(completedBy ? 'COMPLETED - BY IT' : 'COMPLETED - AUTOMATED', now, completedBy || null, now, existing.id);
    } else {
      db.prepare(
        `INSERT INTO platform_status
          (id, requestId, requestType, platformName, status, completedAt, completedBy)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(
        uuidv4(),
        requestId,
        requestType,
        platform,
        completedBy ? 'COMPLETED - BY IT' : 'COMPLETED - AUTOMATED',
        now,
        completedBy || null
      );
    }

    recordAuditLog({
      action: 'PLATFORM_PROVISIONED',
      requestId,
      platformName: platform,
      details: { requestType, completedBy: completedBy || 'automated' },
      status: 'SUCCESS',
      ipAddress: req.ip,
    });

    res.json({ platform, status: completedBy ? 'COMPLETED - BY IT' : 'COMPLETED - AUTOMATED' });
  } catch (error) {
    console.error('[routes/platforms] provision failed:', error.message);
    recordAuditLog({
      action: 'PLATFORM_PROVISION_FAILED',
      requestId,
      platformName: platform,
      details: { requestType },
      status: 'FAILED',
      ipAddress: req.ip,
    });
    res.status(500).json({ error: 'Failed to update platform status.' });
  }
});

router.post('/:platform/deprovision', (req, res) => {
  const { platform } = req.params;
  const { requestId, requestType, completedBy, errorMessage } = req.body;

  const errors = validateProvisionBody(req.body);
  if (!PLATFORMS.some((p) => p.name === platform)) {
    errors.push(`Unknown platform "${platform}".`);
  }
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  try {
    const db = getDb();
    const now = new Date().toISOString();
    const status = errorMessage ? 'FAILED' : 'COMPLETED - BY IT';

    const existing = db
      .prepare('SELECT id FROM platform_status WHERE requestId = ? AND requestType = ? AND platformName = ?')
      .get(requestId, requestType, platform);

    if (existing) {
      db.prepare(
        `UPDATE platform_status
         SET status = ?, completedAt = ?, completedBy = ?, errorMessage = ?, updatedAt = ?
         WHERE id = ?`
      ).run(status, errorMessage ? null : now, completedBy || null, errorMessage || null, now, existing.id);
    } else {
      db.prepare(
        `INSERT INTO platform_status
          (id, requestId, requestType, platformName, status, completedAt, completedBy, errorMessage)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(uuidv4(), requestId, requestType, platform, status, errorMessage ? null : now, completedBy || null, errorMessage || null);
    }

    recordAuditLog({
      action: errorMessage ? 'PLATFORM_DEPROVISION_FAILED' : 'PLATFORM_DEPROVISIONED',
      requestId,
      platformName: platform,
      details: { requestType, completedBy: completedBy || null, errorMessage: errorMessage || null },
      status: errorMessage ? 'FAILED' : 'SUCCESS',
      ipAddress: req.ip,
    });

    res.json({ platform, status });
  } catch (error) {
    console.error('[routes/platforms] deprovision failed:', error.message);
    res.status(500).json({ error: 'Failed to update platform status.' });
  }
});

module.exports = router;
