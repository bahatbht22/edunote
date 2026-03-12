require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function fixAdmin() {
  const db = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'edunote',
    port:     parseInt(process.env.DB_PORT) || 3306,
  });
  const email = process.env.ADMIN_EMAIL || 'admin@edunote.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123';
  const hashed = await bcrypt.hash(password, 12);
  await db.execute('DELETE FROM admins WHERE email = ?', [email]);
  await db.execute('INSERT INTO admins (email, password, name) VALUES (?,?,?)',
    [email, hashed, 'Administrator']);
  console.log(`✅ Admin fixed! Login: ${email} / ${password}`);
  await db.end();
  process.exit(0);
}

fixAdmin().catch(e => { console.error(e.message); process.exit(1); });
