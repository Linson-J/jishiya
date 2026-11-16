'use strict';

const mysql = require('mysql2/promise');

// dotenv is loaded and validated in server.js before this module is required.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

/**
 * Builds the SET clause for a partial UPDATE.
 * `allowed` is a hard-coded whitelist of column names supplied by the controller
 * (never user input); values always travel as `?` placeholders.
 */
function buildUpdate(allowed, body) {
  const sets = [];
  const values = [];
  for (const field of allowed) {
    if (body[field] !== undefined) {
      sets.push(`\`${field}\` = ?`);
      values.push(body[field]);
    }
  }
  return { sets, values };
}

async function testConnection() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
}

module.exports = { pool, buildUpdate, testConnection };
