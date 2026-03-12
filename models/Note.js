const db = require('../config/database');

class Note {
  static async findByClass(classId) {
    const [rows] = await db.execute(
      `SELECT n.*, cl.name as class_name, cl.slug as class_slug,
              co.name as combo_name, co.slug as combo_slug, co.color as combo_color,
              l.name as level_name, l.slug as level_slug
       FROM notes n
       JOIN classes cl ON n.class_id = cl.id
       JOIN combinations co ON cl.combination_id = co.id
       JOIN levels l ON co.level_id = l.id
       WHERE n.class_id = ?
       ORDER BY n.created_at DESC`,
      [classId]
    );
    return rows;
  }
  static async findById(id) {
    const [rows] = await db.execute(
      `SELECT n.*, cl.name as class_name, cl.slug as class_slug,
              co.name as combo_name, co.slug as combo_slug, co.color as combo_color,
              l.name as level_name, l.slug as level_slug
       FROM notes n
       JOIN classes cl ON n.class_id = cl.id
       JOIN combinations co ON cl.combination_id = co.id
       JOIN levels l ON co.level_id = l.id
       WHERE n.id = ?`,
      [id]
    );
    return rows[0] || null;
  }
  static async create(data) {
    const [result] = await db.execute(
      'INSERT INTO notes (class_id, title, description, file_name, file_original_name, file_size, file_type, file_url) VALUES (?,?,?,?,?,?,?,?)',
      [data.class_id, data.title, data.description || '', data.file_name, data.file_original_name, data.file_size || 0, data.file_type || '', data.file_url || '']
    );
    return result;
  }
  static async update(id, data) {
    const [result] = await db.execute(
      'UPDATE notes SET class_id=?, title=?, description=? WHERE id=?',
      [data.class_id, data.title, data.description || '', id]
    );
    return result;
  }
  static async updateFile(id, data) {
    const [result] = await db.execute(
      'UPDATE notes SET file_name=?, file_original_name=?, file_size=?, file_type=?, file_url=? WHERE id=?',
      [data.file_name, data.file_original_name, data.file_size || 0, data.file_type || '', data.file_url || '', id]
    );
    return result;
  }
  static async delete(id) {
    const [result] = await db.execute('DELETE FROM notes WHERE id = ?', [id]);
    return result;
  }
  static async incrementDownload(id) {
    await db.execute('UPDATE notes SET download_count = download_count + 1 WHERE id = ?', [id]);
  }
  static async countAll() {
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM notes');
    return rows[0].count;
  }
  static async findAll(limit = 50) {
    const safeLimit = parseInt(limit) || 50;
    const [rows] = await db.execute(
      `SELECT n.*, cl.name as class_name, co.name as combo_name, l.name as level_name
       FROM notes n
       JOIN classes cl ON n.class_id = cl.id
       JOIN combinations co ON cl.combination_id = co.id
       JOIN levels l ON co.level_id = l.id
       ORDER BY n.created_at DESC LIMIT ${safeLimit}`
    );
    return rows;
  }

  static async countByLevel(levelId) {
    const [rows] = await db.execute(
      `SELECT COUNT(*) as count FROM notes n
       JOIN classes cl ON n.class_id = cl.id
       JOIN combinations co ON cl.combination_id = co.id
       WHERE co.level_id = ?`, [levelId]);
    return rows[0].count;
  }
  static async findByLevel(levelId, limit = 5) {
    const safe = parseInt(limit) || 5;
    const [rows] = await db.execute(
      `SELECT n.*, cl.name as class_name, co.name as combo_name, l.name as level_name
       FROM notes n
       JOIN classes cl ON n.class_id = cl.id
       JOIN combinations co ON cl.combination_id = co.id
       JOIN levels l ON co.level_id = l.id
       WHERE co.level_id = ?
       ORDER BY n.created_at DESC LIMIT ${safe}`, [levelId]);
    return rows;
  }
}

module.exports = Note;
