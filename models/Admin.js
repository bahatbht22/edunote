const db = require('../config/database');
const bcrypt = require('bcryptjs');

class Admin {
  static async findByEmail(email) {
    const [rows] = await db.execute('SELECT * FROM admins WHERE email = ?', [email]);
    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM admins WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async updateProfile(id, { name, email }) {
    await db.execute('UPDATE admins SET name=?, email=? WHERE id=?', [name, email, id]);
  }

  static async updatePassword(id, newPassword) {
    const hashed = await bcrypt.hash(newPassword, 12);
    await db.execute('UPDATE admins SET password=? WHERE id=?', [hashed, id]);
  }

  static async updateAvatar(id, avatar) {
    await db.execute('UPDATE admins SET avatar=? WHERE id=?', [avatar, id]);
  }

  static async verifyPassword(plain, hashed) {
    return await bcrypt.compare(plain, hashed);
  }

  static async findAll() {
    const [rows] = await db.execute('SELECT * FROM admins ORDER BY created_at ASC');
    return rows;
  }

  static async create({ name, email, password, role = 'sub', level_id = null }) {
    const hashed = await bcrypt.hash(password, 12);
    const [result] = await db.execute(
      'INSERT INTO admins (name, email, password) VALUES (?,?,?)',
      [name, email, hashed]
    );
    return result.insertId;
  }

  static async updateSubAdmin(id, { name, email, level_id }) {
    await db.execute('UPDATE admins SET name=?, email=? WHERE id=?', [name, email, id]);
  }

  static async resetPassword(id, newPassword) {
    const hashed = await bcrypt.hash(newPassword, 12);
    await db.execute('UPDATE admins SET password=? WHERE id=?', [hashed, id]);
  }

  static async delete(id) {
    await db.execute('DELETE FROM admins WHERE id=?', [id]);
  }
}

module.exports = Admin;
