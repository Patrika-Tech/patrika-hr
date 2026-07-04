'use strict';

const path = require('path');
const fs   = require('fs');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

/**
 * Resolve a candidate's resume file to a path that exists on THIS machine.
 * The DB may store absolute paths from another deployment (e.g. a Linux
 * server: /home/ubuntu/patrika-hr/uploads/xyz.pdf). Fall back to looking up
 * the same filename in the local uploads/ directory.
 * Returns the resolved path, or null if the file is not available locally.
 */
function resolveResumePath(candidate) {
  const stored = candidate.resumePath;
  const storedName = candidate.resumeStoredName;

  if (stored && fs.existsSync(stored)) return stored;

  // Try local uploads dir with the basename of the stored path
  if (stored) {
    const local = path.join(UPLOADS_DIR, path.basename(stored));
    if (fs.existsSync(local)) return local;
  }

  // Try the stored filename column
  if (storedName) {
    const local = path.join(UPLOADS_DIR, storedName);
    if (fs.existsSync(local)) return local;
  }

  return null;
}

module.exports = { resolveResumePath, UPLOADS_DIR };
