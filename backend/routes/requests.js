// ============================================================
// routes/requests.js
//
// POST  /api/requests/onboarding          - submit an onboarding request
// POST  /api/requests/offboarding         - submit an offboarding request
// GET   /api/requests                     - list requests (filters: status, user, dateFrom, dateTo)
// GET   /api/requests/:id                 - one request + its platform rows + audit trail
// PATCH /api/requests/:id                 - update request status
// PATCH /api/requests/:id/platform/:platform - update one platform's status on a request
//
// Onboarding and offboarding requests live in two separate
// tables (onboarding_requests / offboarding_requests) rather than
// one polymorphic table, matching the schema given in the spec.
// Every route below that takes just an :id has to figure out
// which table it lives in - see findRequestById().
// ============================================================

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb, runInTransaction, recordAuditLog } = require('../services/dbService');

const router = express.Router();

// SLA windows, matching the frontend's own SLA_CONFIG_MS
// (src/mockData.js) - onboarding gets a full business day,
// offboarding (far more time-sensitive - access should close
// fast) gets 2 hours.
const SLA_HOURS = {
  onboarding: 24,
  offboarding: 2,
};

function addHours(isoString, hours) {
  const date = new Date(isoString);
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

// Looks up a request by id across both tables, returning
// { request, requestType } or null. Centralizing this means every
// :id route below behaves the same regardless of which table the
// id actually lives in.
function findRequestById(id) {
  const db = getDb();
  const onboarding = db.prepare('SELECT * FROM onboarding_requests WHERE id = ?').get(id);
  if (onboarding) {
    return { request: onboarding, requestType: 'onboarding' };
  }
  const offboarding = db.prepare('SELECT * FROM offboarding_requests WHERE id = ?').get(id);
  if (offboarding) {
    return { request: offboarding, requestType: 'offboarding' };
  }
  return null;
}

function parsePlatforms(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((name) => typeof name === 'string' && name.trim().length > 0);
}

router.post('/onboarding', (req, res) => {
  const {
    userId,
    submittedBy,
    department,
    manager,
    floor,
    role,
    jobTitle,
    type,
    platforms,
    displayName,
    team,
    country,
    workingLocation,
    startDate,
  } = req.body;

  const errors = [];
  if (!userId) errors.push('userId is required.');
  if (!submittedBy) errors.push('submittedBy is required.');
  const platformList = parsePlatforms(platforms);
  if (platformList.length === 0) errors.push('At least one platform must be selected.');

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();
  const slaEndTime = addHours(now, SLA_HOURS.onboarding);

  try {
    runInTransaction(() => {
      db.prepare(
        `INSERT INTO onboarding_requests
          (id, userId, submittedBy, department, manager, floor, role, jobTitle, type, platforms, status, slaStartTime, slaEndTime, displayName, team, country, workingLocation, startDate)
         VALUES (@id, @userId, @submittedBy, @department, @manager, @floor, @role, @jobTitle, @type, @platforms, 'PENDING', @slaStartTime, @slaEndTime, @displayName, @team, @country, @workingLocation, @startDate)`
      ).run({
        id,
        userId,
        submittedBy,
        department: department || null,
        manager: manager || null,
        floor: floor || null,
        role: role || null,
        jobTitle: jobTitle || null,
        type: type || 'Internal',
        platforms: JSON.stringify(platformList),
        slaStartTime: now,
        slaEndTime,
        displayName: displayName || null,
        team: team || null,
        country: country || null,
        workingLocation: workingLocation || null,
        startDate: startDate || null,
      });

      const insertPlatform = db.prepare(
        `INSERT INTO platform_status (id, requestId, requestType, platformName, status)
         VALUES (?, ?, 'onboarding', ?, 'PENDING')`
      );
      platformList.forEach((platformName) => insertPlatform.run(uuidv4(), id, platformName));
    });

    recordAuditLog({
      action: 'ONBOARDING_SUBMITTED',
      userId,
      userEmail: submittedBy,
      requestId: id,
      details: { department, platforms: platformList },
      status: 'SUCCESS',
      ipAddress: req.ip,
    });

    res.status(201).json({ id, status: 'PENDING', slaEndTime });
  } catch (error) {
    console.error('[routes/requests] onboarding submit failed:', error.message);
    res.status(500).json({ error: 'Failed to submit onboarding request.' });
  }
});

router.post('/offboarding', (req, res) => {
  const { userId, submittedBy, platforms } = req.body;

  const errors = [];
  if (!userId) errors.push('userId is required.');
  if (!submittedBy) errors.push('submittedBy is required.');
  const platformList = parsePlatforms(platforms);
  if (platformList.length === 0) errors.push('At least one platform must be selected.');

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();
  const slaEndTime = addHours(now, SLA_HOURS.offboarding);

  try {
    runInTransaction(() => {
      db.prepare(
        `INSERT INTO offboarding_requests
          (id, userId, submittedBy, platforms, status, slaStartTime, slaEndTime)
         VALUES (@id, @userId, @submittedBy, @platforms, 'PENDING', @slaStartTime, @slaEndTime)`
      ).run({ id, userId, submittedBy, platforms: JSON.stringify(platformList), slaStartTime: now, slaEndTime });

      const insertPlatform = db.prepare(
        `INSERT INTO platform_status (id, requestId, requestType, platformName, status)
         VALUES (?, ?, 'offboarding', ?, 'PENDING')`
      );
      platformList.forEach((platformName) => insertPlatform.run(uuidv4(), id, platformName));
    });

    recordAuditLog({
      action: 'OFFBOARDING_SUBMITTED',
      userId,
      userEmail: submittedBy,
      requestId: id,
      details: { platforms: platformList },
      status: 'SUCCESS',
      ipAddress: req.ip,
    });

    res.status(201).json({ id, status: 'PENDING', slaEndTime });
  } catch (error) {
    console.error('[routes/requests] offboarding submit failed:', error.message);
    res.status(500).json({ error: 'Failed to submit offboarding request.' });
  }
});

// GET /api/requests?status=PENDING&userId=...&dateFrom=...&dateTo=...
// Unions both tables (tagged with a `type` column) so the frontend
// gets one combined, sorted list rather than two separate calls.
router.get('/', (req, res) => {
  const { status, userId, dateFrom, dateTo } = req.query;

  try {
    const db = getDb();
    const conditions = [];
    const params = {};

    if (status) {
      conditions.push('status = @status');
      params.status = status;
    }
    if (userId) {
      conditions.push('userId = @userId');
      params.userId = userId;
    }
    if (dateFrom) {
      conditions.push('createdAt >= @dateFrom');
      params.dateFrom = dateFrom;
    }
    if (dateTo) {
      conditions.push('createdAt <= @dateTo');
      params.dateTo = dateTo;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const onboarding = db
      .prepare(`SELECT *, 'onboarding' as type FROM onboarding_requests ${whereClause} ORDER BY createdAt DESC`)
      .all(params);
    const offboarding = db
      .prepare(`SELECT *, 'offboarding' as type FROM offboarding_requests ${whereClause} ORDER BY createdAt DESC`)
      .all(params);

    const combined = [...onboarding, ...offboarding].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ requests: combined, total: combined.length });
  } catch (error) {
    console.error('[routes/requests] GET / failed:', error.message);
    res.status(500).json({ error: 'Failed to list requests.' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const found = findRequestById(req.params.id);
    if (!found) {
      return res.status(404).json({ error: 'Request not found.' });
    }

    const db = getDb();
    const platforms = db
      .prepare('SELECT * FROM platform_status WHERE requestId = ? AND requestType = ? ORDER BY createdAt ASC')
      .all(req.params.id, found.requestType);
    const auditTrail = db
      .prepare('SELECT * FROM audit_logs WHERE requestId = ? ORDER BY createdAt ASC')
      .all(req.params.id);

    res.json({ request: { ...found.request, type: found.requestType }, platforms, auditTrail });
  } catch (error) {
    console.error('[routes/requests] GET /:id failed:', error.message);
    res.status(500).json({ error: 'Failed to fetch request.' });
  }
});

router.patch('/:id', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['PENDING', 'COMPLETED'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const found = findRequestById(req.params.id);
    if (!found) {
      return res.status(404).json({ error: 'Request not found.' });
    }

    const db = getDb();
    const table = found.requestType === 'onboarding' ? 'onboarding_requests' : 'offboarding_requests';
    const completedAt = status === 'COMPLETED' ? new Date().toISOString() : null;

    db.prepare(`UPDATE ${table} SET status = ?, completedAt = ?, updatedAt = datetime('now') WHERE id = ?`).run(
      status,
      completedAt,
      req.params.id
    );

    recordAuditLog({
      action: `${found.requestType.toUpperCase()}_${status}`,
      requestId: req.params.id,
      userEmail: found.request.submittedBy,
      details: { previousStatus: found.request.status, newStatus: status },
      status: 'SUCCESS',
      ipAddress: req.ip,
    });

    res.json({ id: req.params.id, status });
  } catch (error) {
    console.error('[routes/requests] PATCH /:id failed:', error.message);
    res.status(500).json({ error: 'Failed to update request.' });
  }
});

router.patch('/:id/platform/:platform', (req, res) => {
  const { status, completedBy, errorMessage } = req.body;
  const validStatuses = ['PENDING', 'COMPLETED - AUTOMATED', 'COMPLETED - BY IT', 'FAILED'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const found = findRequestById(req.params.id);
    if (!found) {
      return res.status(404).json({ error: 'Request not found.' });
    }

    const db = getDb();
    const now = new Date().toISOString();
    const completedAt = status.startsWith('COMPLETED') ? now : null;

    const result = db
      .prepare(
        `UPDATE platform_status
         SET status = ?, completedAt = ?, completedBy = ?, errorMessage = ?, updatedAt = ?
         WHERE requestId = ? AND requestType = ? AND platformName = ?`
      )
      .run(status, completedAt, completedBy || null, errorMessage || null, now, req.params.id, found.requestType, req.params.platform);

    if (result.changes === 0) {
      return res.status(404).json({ error: `Platform "${req.params.platform}" not found on this request.` });
    }

    recordAuditLog({
      action: 'PLATFORM_STATUS_UPDATED',
      requestId: req.params.id,
      platformName: req.params.platform,
      details: { status, completedBy: completedBy || null, errorMessage: errorMessage || null },
      status: status === 'FAILED' ? 'FAILED' : 'SUCCESS',
      ipAddress: req.ip,
    });

    res.json({ requestId: req.params.id, platform: req.params.platform, status });
  } catch (error) {
    console.error('[routes/requests] PATCH /:id/platform/:platform failed:', error.message);
    res.status(500).json({ error: 'Failed to update platform status.' });
  }
});

module.exports = router;
