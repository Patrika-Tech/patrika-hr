require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });

  const alterations = [
    "ALTER TABLE candidates ADD COLUMN linkedInProfile VARCHAR(500) AFTER email"
  ];

  for (const sql of alterations) {
    try {
      await conn.execute(sql);
      console.log('OK:', sql.slice(0, 60));
    } catch (e) {
      if (e.errno === 1060) {
        console.log('Already exists, skipping:', sql.slice(0, 60));
      } else {
        throw e;
      }
    }
  }

  await conn.end();
  console.log('Done.');
}

run().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
