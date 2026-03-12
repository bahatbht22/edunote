const db = require('../config/database');

class Combination {
  static async findByLevel(levelId) {
    const [rows] = await db.execute(
      'SELECT * FROM combinations WHERE level_id = ? ORDER BY order_index ASC, name ASC',
      [levelId]
    );
    return rows;
  }
  static async findById(id) {
    const [rows] = await db.execute('SELECT c.*, l.name as level_name, l.slug as level_slug FROM combinations c JOIN levels l ON c.level_id = l.id WHERE c.id = ?', [id]);
    return rows[0] || null;
  }
  static async findBySlug(levelId, slug) {
    const [rows] = await db.execute(
      'SELECT c.*, l.name as level_name, l.slug as level_slug FROM combinations c JOIN levels l ON c.level_id = l.id WHERE c.level_id = ? AND c.slug = ?',
      [levelId, slug]
    );
    return rows[0] || null;
  }
  static async create(data) {
    const [result] = await db.execute(
      'INSERT INTO combinations (level_id, name, slug, description, color, order_index) VALUES (?,?,?,?,?,?)',
      [data.level_id, data.name, data.slug, data.description || '', data.color || '#6366f1', data.order_index || 0]
    );
    return result;
  }
  static async update(id, data) {
    const [result] = await db.execute(
      'UPDATE combinations SET name=?, slug=?, description=?, color=?, order_index=? WHERE id=?',
      [data.name, data.slug, data.description || '', data.color || '#6366f1', data.order_index || 0, id]
    );
    return result;
  }
  static async delete(id) {
    const [result] = await db.execute('DELETE FROM combinations WHERE id = ?', [id]);
    return result;
  }
  static async countAll() {
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM combinations');
    return rows[0].count;
  }

  static async countByLevel(levelId) {
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM combinations WHERE level_id = ?', [levelId]);
    return rows[0].count;
  }
}

module.exports = Combination;
