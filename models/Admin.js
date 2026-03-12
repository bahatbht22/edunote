// Admin model v2 - sub-admin support
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
  static async findAll() {
    const [rows] = await db.execute(
      `SELECT a.*, l.name as level_name 
       FROM admins a 
       LEFT JOIN levels l ON a.level_id = l.id 
       ORDER BY a.role DESC, a.created_at ASC`
    );
    return rows;
  }
  static async create(data) {
    const hashed = await bcrypt.hash(data.password, 12);
    const [result] = await db.execute(
      'INSERT INTO admins (name, email, password, role, level_id) VALUES (?,?,?,?,?)',
      [data.name, data.email, hashed, data.role || 'sub', data.level_id || null]
    );
    return result.insertId;
  }
  static async updateProfile(id, data) {
    const [result] = await db.execute(
      'UPDATE admins SET name=?, email=? WHERE id=?',
      [data.name, data.email, id]
    );
    return result;
  }
  static async updateSubAdmin(id, data) {
    const [result] = await db.execute(
      'UPDATE admins SET name=?, email=?, level_id=? WHERE id=? AND role="sub"',
      [data.name, data.email, data.level_id || null, id]
    );
    return result;
  }
  static async resetPassword(id, password) {
    const hashed = await bcrypt.hash(password, 12);
    const [result] = await db.execute(
      'UPDATE admins SET password=? WHERE id=?', [hashed, id]
    );
    return result;
  }
  static async updatePassword(id, password) {
    const [result] = await db.execute('UPDATE admins SET password=? WHERE id=?', [password, id]);
    return result;
  }
  static async updateAvatar(id, avatar) {
    const [result] = await db.execute('UPDATE admins SET avatar=? WHERE id=?', [avatar, id]);
    return result;
  }
  static async removeAvatar(id) {
    const [result] = await db.execute('UPDATE admins SET avatar=NULL WHERE id=?', [id]);
    return result;
  }
  static async delete(id) {
    const [result] = await db.execute('DELETE FROM admins WHERE id=? AND role="sub"', [id]);
    return result;
  }
  static async verifyPassword(plain, hashed) {
    return await bcrypt.compare(plain, hashed);
  }
}

module.exports = Admin;
