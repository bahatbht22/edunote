const db = require('../config/database');

class Class {
  static async findByCombination(combinationId) {
    const [rows] = await db.execute(
      'SELECT * FROM classes WHERE combination_id = ? ORDER BY order_index ASC, name ASC',
      [combinationId]
    );
    return rows;
  }
  static async findById(id) {
    const [rows] = await db.execute(
      `SELECT cl.*, co.name as combo_name, co.slug as combo_slug, co.color as combo_color,
              l.name as level_name, l.slug as level_slug
       FROM classes cl
       JOIN combinations co ON cl.combination_id = co.id
       JOIN levels l ON co.level_id = l.id
       WHERE cl.id = ?`,
      [id]
    );
    return rows[0] || null;
  }
  static async findBySlug(combinationId, slug) {
    const [rows] = await db.execute(
      `SELECT cl.*, co.name as combo_name, co.slug as combo_slug, co.color as combo_color,
              l.name as level_name, l.slug as level_slug
       FROM classes cl
       JOIN combinations co ON cl.combination_id = co.id
       JOIN levels l ON co.level_id = l.id
       WHERE cl.combination_id = ? AND cl.slug = ?`,
      [combinationId, slug]
    );
    return rows[0] || null;
  }
  static async create(data) {
    const [result] = await db.execute(
      'INSERT INTO classes (combination_id, name, slug, order_index) VALUES (?,?,?,?)',
      [data.combination_id, data.name, data.slug, data.order_index || 0]
    );
    return result;
  }
  static async update(id, data) {
    const [result] = await db.execute(
      'UPDATE classes SET name=?, slug=?, order_index=? WHERE id=?',
      [data.name, data.slug, data.order_index || 0, id]
    );
    return result;
  }
  static async delete(id) {
    const [result] = await db.execute('DELETE FROM classes WHERE id = ?', [id]);
    return result;
  }
  static async countAll() {
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM classes');
    return rows[0].count;
  }

  static async countByLevel(levelId) {
    const [rows] = await db.execute(
      `SELECT COUNT(*) as count FROM classes cl
       JOIN combinations co ON cl.combination_id = co.id
       WHERE co.level_id = ?`, [levelId]);
    return rows[0].count;
  }
}

module.exports = Class;
