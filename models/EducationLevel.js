const db = require('../config/database');

class EducationLevel {
  static async findAll() {
    const [rows] = await db.execute('SELECT * FROM education_levels ORDER BY order_index ASC, name ASC');
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM education_levels WHERE id=?', [id]);
    return rows[0] || null;
  }

  static async findBySlug(slug) {
    const [rows] = await db.execute('SELECT * FROM education_levels WHERE slug=?', [slug]);
    return rows[0] || null;
  }

  static async create({ name, slug, description, color, icon, orderIndex }) {
    const [result] = await db.execute(
      'INSERT INTO education_levels (name,slug,description,color,icon,order_index) VALUES (?,?,?,?,?,?)',
      [name, slug, description || '', color || '#4f46e5', icon || '📚', orderIndex || 0]
    );
    return result.insertId;
  }

  static async update(id, { name, slug, description, color, icon, orderIndex }) {
    await db.execute(
      'UPDATE education_levels SET name=?,slug=?,description=?,color=?,icon=?,order_index=? WHERE id=?',
      [name, slug, description || '', color || '#4f46e5', icon || '📚', orderIndex || 0, id]
    );
  }

  static async delete(id) {
    await db.execute('DELETE FROM education_levels WHERE id=?', [id]);
  }

  static toSlug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
}

module.exports = EducationLevel;
