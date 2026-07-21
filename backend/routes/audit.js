// ============================================================
// routes/audit.js
//
// GET /api/audit             - list audit logs (filters: user, action, dateFrom, dateTo)
// GET /api/audit/:requestId  - logs for one specific request
//
// audit_logs.details is stored as a JSON string that has already
// been through redactSensitiveFields() at write time (see every
// recordAuditLog() call across routes/*.js) - it's parsed back to
// an object here for the response, never re-redacted, since it
// was never allowed to hold anything sensitive in the first place.
// ============================================================

const express = require('express');
const { getDb } = require('../services/dbService');

const router = express.Router();

function parseDetails(row) {
  let details = null;
  if (row.details) {
    try {
      details = JSON.parse(row.details);
    } catch {
      details = row.details;
    }
  }
  return { ...row, details };
}

router.get('/', (req, res) => {
  const { user, action, dateFrom, dateTo } = req.query;

  try {
    const db = getDb();
    const conditions = [];
    const params = {};

    if (user) {
      conditions.push('(userEmail = @user OR userId = @user OR affectedUser LIKE @userLike)');
      params.user = user;
      params.userLike = `%${user}%`;
    }
    if (action) {
      conditions.push('action = @action');
      params.action = action;
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
    const rows = db.prepare(`SELECT * FROM audit_logs ${whereClause} ORDER BY createdAt DESC LIMIT 500`).all(params);

    res.json({ logs: rows.map(parseDetails), total: rows.length });
  } catch (error) {
    console.error('[routes/audit] GET / failed:', error.message);
    res.status(500).json({ error: 'Failed to list audit logs.' });
  }
});

router.get('/:requestId', (req, res) => {
  try {
    const db = getDb();
    const rows = db
      .prepare('SELECT * FROM audit_logs WHERE requestId = ? ORDER BY createdAt ASC')
      .all(req.params.requestId);

    res.json({ logs: rows.map(parseDetails), total: rows.length });
  } catch (error) {
    console.error('[routes/audit] GET /:requestId failed:', error.message);
    res.status(500).json({ error: 'Failed to fetch audit logs for request.' });
  }
});

module.exports = router;
