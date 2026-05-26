// Legacy MongoDB connector retained for compatibility only.
// The app now uses PostgreSQL/Neon via backend/src/lib/db.js.
// This module proxies to the Postgres connector so older imports don't break.

const { connectDB } = require('../lib/db');

module.exports = connectDB;
