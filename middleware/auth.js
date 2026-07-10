function requireAdmin(req, res, next) {
  if (req.session && req.session.adminId) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  res.redirect('/admin/login');
}

// Only full admins (role === 'admin') can access this route
function requireSuperAdmin(req, res, next) {
  if (req.session && req.session.adminId) {
    const role = req.session.adminRole;
    if (!role || role === 'admin') return next();
    return res.status(403).send('<h2>Access Denied</h2><p>This page is restricted to administrators.</p><a href="/admin/dashboard">Back to Dashboard</a>');
  }
  req.session.returnTo = req.originalUrl;
  res.redirect('/admin/login');
}

// Department users can only access candidates whose applied position belongs
// to one of their departments. Super-admins (role 'admin') bypass the check.
async function requireCandidateAccess(req, res, next) {
  const role = req.session.adminRole;
  if (!role || role === 'admin') return next();
  const depts = req.session.adminDepartments || (req.session.adminDepartment ? [req.session.adminDepartment] : []);
  if (depts.length === 0) return next();
  try {
    const { sequelize } = require('../config/db');
    const deptsEsc = depts.map(d => sequelize.escape(d)).join(',');
    const rows = await sequelize.query(
      `SELECT id FROM candidates
       WHERE id = ?
         AND positionApplying COLLATE utf8mb4_unicode_ci IN
             (SELECT name COLLATE utf8mb4_unicode_ci FROM positions WHERE department IN (${deptsEsc}))`,
      { replacements: [req.params.id], type: sequelize.QueryTypes.SELECT }
    );
    if (rows.length === 0) {
      const wantsJson = req.xhr || req.method !== 'GET' || (req.headers.accept || '').includes('application/json');
      if (wantsJson) return res.status(403).json({ error: 'Access denied: this candidate belongs to another department.' });
      return res.status(403).send('<h2>Access Denied</h2><p>This candidate belongs to another department.</p><a href="/admin/candidates">Back to Candidates</a>');
    }
    next();
  } catch (e) {
    console.error('requireCandidateAccess error:', e.message);
    res.status(500).send('Server error while checking access');
  }
}

function redirectIfLoggedIn(req, res, next) {
  if (req.session && req.session.adminId) {
    return res.redirect('/admin/dashboard');
  }
  next();
}

module.exports = { requireAdmin, requireSuperAdmin, requireCandidateAccess, redirectIfLoggedIn };
