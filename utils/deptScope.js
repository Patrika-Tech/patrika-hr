'use strict';
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');

// Returns null for super-admins (no restriction); otherwise a Sequelize
// where-fragment restricting candidates to positions belonging to the
// logged-in user's departments.
function deptWhere(req) {
  const role = req.session.adminRole;
  if (!role || role === 'admin') return null;
  const depts = req.session.adminDepartments || (req.session.adminDepartment ? [req.session.adminDepartment] : []);
  if (!depts.length) return null;
  const deptsEsc = depts.map(d => sequelize.escape(d)).join(',');
  return {
    positionApplying: {
      [Op.in]: sequelize.literal(
        `(SELECT name COLLATE utf8mb4_unicode_ci FROM positions WHERE department IN (${deptsEsc}))`
      )
    }
  };
}

module.exports = { deptWhere };
