require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seed() {
  const db = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'edunote',
    port:     parseInt(process.env.DB_PORT) || 3306,
  });

  try {
    console.log('🌱 Setting up tables...');

    // ── Create tables (safe, won't drop existing data) ──────────────────
    await db.execute(`CREATE TABLE IF NOT EXISTS admins (
      id INT NOT NULL AUTO_INCREMENT, email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL, name VARCHAR(100) NOT NULL DEFAULT 'Admin',
      avatar VARCHAR(255) DEFAULT NULL,
      role ENUM('super','sub') NOT NULL DEFAULT 'super',
      level_id INT NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id))`);

    await db.execute(`CREATE TABLE IF NOT EXISTS levels (
      id INT NOT NULL AUTO_INCREMENT, name VARCHAR(150) NOT NULL,
      slug VARCHAR(150) NOT NULL UNIQUE, description TEXT,
      color VARCHAR(20) DEFAULT '#4f46e5',
      image_url VARCHAR(500) DEFAULT NULL,
      order_index INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id))`);

    await db.execute(`CREATE TABLE IF NOT EXISTS combinations (
      id INT NOT NULL AUTO_INCREMENT, level_id INT NOT NULL, name VARCHAR(150) NOT NULL,
      slug VARCHAR(200) NOT NULL UNIQUE, description TEXT,
      color VARCHAR(20) DEFAULT '#6366f1', order_index INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id),
      FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE)`);

    await db.execute(`CREATE TABLE IF NOT EXISTS classes (
      id INT NOT NULL AUTO_INCREMENT, combination_id INT NOT NULL,
      name VARCHAR(100) NOT NULL, slug VARCHAR(200) NOT NULL UNIQUE,
      order_index INT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id), FOREIGN KEY (combination_id) REFERENCES combinations(id) ON DELETE CASCADE)`);

    await db.execute(`CREATE TABLE IF NOT EXISTS notes (
      id INT NOT NULL AUTO_INCREMENT, class_id INT NOT NULL,
      title VARCHAR(255) NOT NULL, description TEXT,
      file_name VARCHAR(255) NOT NULL, file_original_name VARCHAR(255) NOT NULL,
      file_size BIGINT DEFAULT 0, file_type VARCHAR(100), file_url TEXT,
      download_count INT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id), FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE)`);

    await db.execute(`CREATE TABLE IF NOT EXISTS combo_requests (
      id INT NOT NULL AUTO_INCREMENT, sub_admin_id INT NOT NULL,
      level_id INT NOT NULL, combo_id INT NULL DEFAULT NULL,
      request_type ENUM('create','edit','delete') NOT NULL DEFAULT 'edit',
      requested_data JSON NULL,
      status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
      rejection_reason TEXT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      reviewed_at TIMESTAMP NULL, reviewed_by INT NULL,
      PRIMARY KEY (id),
      FOREIGN KEY (sub_admin_id) REFERENCES admins(id) ON DELETE CASCADE,
      FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE)`);

    console.log('✅ Tables ready');

    // ── Safe column migrations (add if missing) ──────────────────────────
    const migrations = [
      `ALTER TABLE admins ADD COLUMN IF NOT EXISTS role ENUM('super','sub') NOT NULL DEFAULT 'super' AFTER avatar`,
      `ALTER TABLE admins ADD COLUMN IF NOT EXISTS level_id INT NULL DEFAULT NULL AFTER role`,
      `ALTER TABLE levels ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) DEFAULT NULL AFTER color`,
    ];
    for (const sql of migrations) {
      try { await db.execute(sql); } catch(e) { /* column already exists */ }
    }
    console.log('✅ Migrations applied');
    // Fix combo_requests: drop FK on combo_id, fix ENUM and nullable
    try {
      // Drop any FK referencing combinations from combo_requests
      const [fks] = await db.execute(
        `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
         WHERE TABLE_NAME='combo_requests' AND COLUMN_NAME='combo_id'
         AND TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL`);
      for (const fk of fks) {
        await db.execute(`ALTER TABLE combo_requests DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
      }
    } catch(e) { /* no FK */ }
    try { await db.execute(`ALTER TABLE combo_requests MODIFY COLUMN combo_id INT NULL DEFAULT NULL`); } catch(e) {}
    try { await db.execute(`ALTER TABLE combo_requests MODIFY COLUMN request_type ENUM('create','edit','delete') NOT NULL DEFAULT 'edit'`); } catch(e) {}


    // ── Super admin (only if none exists) ────────────────────────────────
    const [adminRows] = await db.execute("SELECT id FROM admins WHERE role='super' LIMIT 1");
    if (adminRows.length === 0) {
      const email = process.env.ADMIN_EMAIL || 'admin@edunote.com';
      const password = process.env.ADMIN_PASSWORD || 'Admin@123';
      const hashed = await bcrypt.hash(password, 12);
      await db.execute('INSERT INTO admins (email, password, name, role) VALUES (?,?,?,?)',
        [email, hashed, 'Administrator', 'super']);
      console.log(`✅ Admin created: ${email} / ${password}`);
    } else {
      console.log('✅ Admin already exists');
    }

    // ── Levels (INSERT IGNORE = skip if exists) ───────────────────────────
    const levelImages = {
      olevel: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Rwanda_classroom.jpg/1280px-Rwanda_classroom.jpg',
      alevel: 'https://images.unsplash.com/photo-1532094349884-543559b8e9e4?w=800&q=80',
      tvet:   'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&q=80',
    };

    const levelsData = [
      ["Ordinary Level (O'Level)", 'olevel', 'Secondary education for S1 to S3 students', '#3b82f6', 1],
      ["Advanced Level (A'Level)", 'alevel', 'General education for S4, S5, S6 — science and humanities combinations', '#6366f1', 2],
      ['TVET (Technical & Vocational)', 'tvet', 'Technical and vocational education — L3, L4, L5 levels', '#f59e0b', 3],
    ];
    for (const [name, slug, desc, color, order] of levelsData) {
      await db.execute(
        'INSERT IGNORE INTO levels (name,slug,description,color,image_url,order_index) VALUES (?,?,?,?,?,?)',
        [name, slug, desc, color, levelImages[slug] || null, order]
      );
      // Update image_url for existing rows that don't have it yet
      await db.execute(
        'UPDATE levels SET image_url=? WHERE slug=? AND (image_url IS NULL OR image_url="")',
        [levelImages[slug] || null, slug]
      );
    }

    // ── Get level IDs ─────────────────────────────────────────────────────
    const [levelRows] = await db.execute('SELECT id, slug FROM levels');
    const levelMap = {};
    levelRows.forEach(r => levelMap[r.slug] = r.id);

    // ── Combinations (INSERT IGNORE) ──────────────────────────────────────
    const aLevelCombos = [
      ['MPC','mpc','Mathematics, Physics, Computer Science','#6366f1'],
      ['PCB','pcb','Physics, Chemistry, Biology','#10b981'],
      ['MPG','mpg','Mathematics, Physics, Geography','#3b82f6'],
      ['MCE','mce','Mathematics, Computer Science, Economics','#8b5cf6'],
      ['MCB','mcb','Mathematics, Chemistry, Biology','#06b6d4'],
      ['MEG','meg','Mathematics, Economics, Geography','#f59e0b'],
      ['HEG','heg','History, Economics, Geography','#ef4444'],
      ['HGL','hgl','History, Geography, Literature','#ec4899'],
      ['HEL','hel','History, Economics, Literature','#f97316'],
      ['LEG','leg','Literature, Economics, Geography','#14b8a6'],
      ['MEL','mel','Mathematics, Economics, Literature','#84cc16'],
    ];
    for (let i = 0; i < aLevelCombos.length; i++) {
      const [name, slug, desc, color] = aLevelCombos[i];
      await db.execute(
        'INSERT IGNORE INTO combinations (level_id,name,slug,description,color,order_index) VALUES (?,?,?,?,?,?)',
        [levelMap['alevel'], name, slug, desc, color, i]
      );
    }

    await db.execute(
      'INSERT IGNORE INTO combinations (level_id,name,slug,description,color,order_index) VALUES (?,?,?,?,?,?)',
      [levelMap['olevel'], "O'Level General", 'olevel-general', 'Core subjects for S1, S2, S3', '#3b82f6', 0]
    );

    const tvetTrades = [
      ['SOD','sod','Software Development','#6366f1'],
      ['CSA','csa','Computer System and Architecture','#8b5cf6'],
      ['NIT','nit','Networking and ICT Infrastructure','#3b82f6'],
      ['MMP','mmp','Manufacturing and Mechanical Production','#f59e0b'],
      ['AUT','aut','Automobile Technology','#ef4444'],
      ['GME','gme','General Mechanics and Electricity','#f97316'],
      ['BDC','bdc','Building and Construction','#84cc16'],
      ['PLT','plt','Plumbing Technology','#06b6d4'],
      ['CAP','cap','Computer Applications and Programming','#10b981'],
      ['ELT','elt','Electricity Technology','#facc15'],
      ['ETE','ete','Electronics Technology','#ec4899'],
      ['TOR','tor','Tourism and Recreation','#14b8a6'],
      ['FBO','fbo','Food and Beverages Operations','#f59e0b'],
    ];
    for (let i = 0; i < tvetTrades.length; i++) {
      const [name, slug, desc, color] = tvetTrades[i];
      await db.execute(
        'INSERT IGNORE INTO combinations (level_id,name,slug,description,color,order_index) VALUES (?,?,?,?,?,?)',
        [levelMap['tvet'], name, slug, desc, color, i]
      );
    }

    console.log('✅ Levels and combinations ready');

    // ── Sample classes (INSERT IGNORE) ────────────────────────────────────
    const [mpcRows] = await db.execute("SELECT id FROM combinations WHERE slug='mpc' LIMIT 1");
    if (mpcRows.length > 0) {
      for (const [cls, order] of [['S4',0],['S5',1],['S6',2]]) {
        await db.execute('INSERT IGNORE INTO classes (combination_id,name,slug,order_index) VALUES (?,?,?,?)',
          [mpcRows[0].id, cls, `mpc-${cls.toLowerCase()}`, order]);
      }
    }
    const [olRows] = await db.execute("SELECT id FROM combinations WHERE slug='olevel-general' LIMIT 1");
    if (olRows.length > 0) {
      for (const [cls, order] of [['S1',0],['S2',1],['S3',2]]) {
        await db.execute('INSERT IGNORE INTO classes (combination_id,name,slug,order_index) VALUES (?,?,?,?)',
          [olRows[0].id, cls, `olevel-${cls.toLowerCase()}`, order]);
      }
    }

    console.log('✅ Sample classes ready');
    console.log('');
    console.log('🎉 EduNote is ready!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await db.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    await db.end();
    process.exit(1);
  }
}

seed();
