const EducationLevel = require('../models/EducationLevel');
const Combination    = require('../models/Combination');
const Class          = require('../models/Class');
const Note           = require('../models/Note');
const path           = require('path');
const fs             = require('fs');
const os             = require('os');
const { execSync }   = require('child_process');

// ── helpers ───────────────────────────────────────────────────────────────────

function getExt(filename) {
  if (!filename) return '';
  return path.extname(filename).toLowerCase().replace('.', '');
}

function downloadToTemp(url, ext) {
  return new Promise((resolve, reject) => {
    const tmpFile = path.join(os.tmpdir(), `edunote_${Date.now()}.${ext}`);
    const file    = fs.createWriteStream(tmpFile);

    function doRequest(reqUrl, hops) {
      if (hops > 5) return reject(new Error('Too many redirects'));
      const proto = reqUrl.startsWith('https') ? require('https') : require('http');
      proto.get(reqUrl, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          return doRequest(res.headers.location, hops + 1);
        }
        if (res.statusCode !== 200) {
          res.resume(); file.close(); fs.unlink(tmpFile, () => {});
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(tmpFile); });
        file.on('error',  err => { fs.unlink(tmpFile, () => {}); reject(err); });
      }).on('error', err => { file.close(); fs.unlink(tmpFile, () => {}); reject(err); });
    }
    doRequest(url, 0);
  });
}

async function convertToHtml(filePath, ext) {
  if (ext === 'docx') {
    try {
      const mammoth = require('mammoth');
      const result  = await mammoth.convertToHtml({ path: filePath });
      return { html: result.value };
    } catch (e) { console.error('mammoth error:', e.message); }
  }
  if (['doc', 'ppt', 'pptx'].includes(ext)) {
    try {
      const tmpDir = path.join(os.tmpdir(), 'edunote-convert');
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      execSync(`libreoffice --headless --convert-to html --outdir "${tmpDir}" "${filePath}"`,
        { timeout: 30000, stdio: 'pipe' });
      const outFile = path.join(tmpDir, path.basename(filePath, path.extname(filePath)) + '.html');
      if (fs.existsSync(outFile)) {
        let html = fs.readFileSync(outFile, 'utf8');
        const m  = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (m) html = m[1];
        html = html.replace(/<meta[^>]*>/gi, '').replace(/<link[^>]*>/gi, '');
        fs.unlinkSync(outFile);
        return { html };
      }
    } catch (e) { console.error('LibreOffice error:', e.message); }
  }
  return null;
}

async function getFileContent(note) {
  const ext = getExt(note.file_original_name) || getExt(note.file_name);
  if (!ext) return { readMode: 'unsupported', html: null, txtContent: null };
  if (ext === 'pdf') return { readMode: 'pdf', html: null, txtContent: null };

  const fileUrl = note.file_url;

  // No Cloudinary URL — try legacy local uploads
  if (!fileUrl) {
    const fp = path.join(__dirname, '..', 'uploads', note.file_name);
    if (!fs.existsSync(fp)) return { readMode: 'unsupported', html: null, txtContent: null };
    if (ext === 'txt') return { readMode: 'txt', txtContent: fs.readFileSync(fp, 'utf8'), html: null };
    const r = await convertToHtml(fp, ext);
    return r ? { readMode: 'html', html: r.html, txtContent: null }
             : { readMode: 'unsupported', html: null, txtContent: null };
  }

  // Download from Cloudinary then convert
  let tmpPath = null;
  try {
    tmpPath = await downloadToTemp(fileUrl, ext);
    if (ext === 'txt') {
      const txt = fs.readFileSync(tmpPath, 'utf8');
      fs.unlink(tmpPath, () => {});
      return { readMode: 'txt', txtContent: txt, html: null };
    }
    if (['docx','doc','ppt','pptx'].includes(ext)) {
      const r = await convertToHtml(tmpPath, ext);
      fs.unlink(tmpPath, () => {});
      return r ? { readMode: 'html', html: r.html, txtContent: null }
               : { readMode: 'unsupported', html: null, txtContent: null };
    }
    fs.unlink(tmpPath, () => {});
    return { readMode: 'unsupported', html: null, txtContent: null };
  } catch (e) {
    if (tmpPath) fs.unlink(tmpPath, () => {});
    console.error('getFileContent error:', e.message);
    return { readMode: 'unsupported', html: null, txtContent: null };
  }
}

// ── controller ────────────────────────────────────────────────────────────────

const pub = {

  // GET /
  index: async (req, res) => {
    try {
      const levels = await EducationLevel.findAll();
      const levelsWithCounts = await Promise.all(levels.map(async (l) => {
        const combos = await Combination.findByLevel(l.id);
        let noteCount = 0;
        for (const c of combos) {
          const classes = await Class.findByCombination(c.id);
          for (const cl of classes) noteCount += (cl.note_count || 0);
        }
        return { ...l, note_count: noteCount, combo_count: combos.length };
      }));
      res.render('public/index', {
        title: 'EduNote — Free Educational Notes for Rwanda',
        levels: levelsWithCounts,
        layout: 'layouts/public'
      });
    } catch (e) {
      console.error(e);
      res.render('public/error', { title: 'Error', message: 'Something went wrong.', layout: 'layouts/public' });
    }
  },

  // GET /notes
  getLevels: async (req, res) => {
    try {
      const levels = await EducationLevel.findAll();
      res.render('public/levels', { title: 'Browse Notes — EduNote', levels, layout: 'layouts/public' });
    } catch (e) {
      console.error(e);
      res.render('public/error', { title: 'Error', message: 'Something went wrong.', layout: 'layouts/public' });
    }
  },

  // GET /notes/:levelSlug  — pick a combination
  getCombinations: async (req, res) => {
    try {
      const level = await EducationLevel.findBySlug(req.params.levelSlug);
      if (!level) return res.status(404).render('public/error', { title: '404', message: 'Level not found.', layout: 'layouts/public' });
      const combinations = await Combination.findByLevel(level.id);
      res.render('public/combinations', {
        title: `${level.name} — Choose Combination`,
        level, combinations,
        layout: 'layouts/public'
      });
    } catch (e) {
      console.error(e);
      res.render('public/error', { title: 'Error', message: 'Something went wrong.', layout: 'layouts/public' });
    }
  },

  // GET /notes/:levelSlug/:comboSlug  — pick a class
  getClasses: async (req, res) => {
    try {
      const level = await EducationLevel.findBySlug(req.params.levelSlug);
      const combo = await Combination.findBySlug(req.params.comboSlug);
      if (!level || !combo || combo.education_level_id !== level.id)
        return res.status(404).render('public/error', { title: '404', message: 'Page not found.', layout: 'layouts/public' });

      const classes   = await Class.findByCombination(combo.id);
      const allCombos = await Combination.findByLevel(level.id);

      res.render('public/classes', {
        title: `${combo.name} — Choose Class`,
        level, combo, classes, allCombos,
        layout: 'layouts/public'
      });
    } catch (e) {
      console.error(e);
      res.render('public/error', { title: 'Error', message: 'Something went wrong.', layout: 'layouts/public' });
    }
  },

  // GET /notes/:levelSlug/:comboSlug/:classSlug  — notes for this class
  getNotes: async (req, res) => {
    try {
      const level = await EducationLevel.findBySlug(req.params.levelSlug);
      const combo = await Combination.findBySlug(req.params.comboSlug);
      const cls   = await Class.findBySlug(req.params.classSlug);

      if (!level || !combo || !cls
          || combo.education_level_id !== level.id
          || cls.combination_id      !== combo.id)
        return res.status(404).render('public/error', { title: '404', message: 'Page not found.', layout: 'layouts/public' });

      const notes     = await Note.findByClass(cls.id);
      const allClasses = await Class.findByCombination(combo.id);
      const allCombos  = await Combination.findByLevel(level.id);

      res.render('public/notes', {
        title: `${cls.name} — ${combo.name} Notes`,
        level, combo, cls,
        allCombos, allClasses,
        notes: notes.map(n => ({ ...n, file_size_formatted: Note.formatFileSize(n.file_size) })),
        layout: 'layouts/public'
      });
    } catch (e) {
      console.error(e);
      res.render('public/error', { title: 'Error', message: 'Something went wrong.', layout: 'layouts/public' });
    }
  },

  // GET /read/:id
  readNote: async (req, res) => {
    try {
      const note = await Note.findById(req.params.id);
      if (!note) return res.status(404).render('public/error', { title: '404', message: 'Note not found.', layout: 'layouts/public' });
      const fileData = await getFileContent(note);
      res.render('public/reader', {
        title: `${note.title} — Read Online`,
        note:  { ...note, file_size_formatted: Note.formatFileSize(note.file_size) },
        readMode: fileData.readMode, html: fileData.html, txtContent: fileData.txtContent,
        layout: 'layouts/reader'
      });
    } catch (e) {
      console.error('readNote error:', e);
      res.render('public/error', { title: 'Error', message: 'Could not open reader.', layout: 'layouts/public' });
    }
  },

  // GET /download/:id
  downloadNote: async (req, res) => {
    try {
      const note = await Note.findById(req.params.id);
      if (!note) return res.status(404).render('public/error', { title: '404', message: 'Note not found.', layout: 'layouts/public' });
      await Note.incrementDownload(note.id);
      if (note.file_url) return res.redirect(note.file_url);
      const fp = path.join(__dirname, '..', 'uploads', note.file_name);
      if (!fs.existsSync(fp)) return res.status(404).render('public/error', { title: 'Error', message: 'File not found.', layout: 'layouts/public' });
      res.download(fp, note.file_original_name);
    } catch (e) {
      console.error(e);
      res.render('public/error', { title: 'Error', message: 'Download failed.', layout: 'layouts/public' });
    }
  },

  // GET /view/:id — inline PDF
  viewNote: async (req, res) => {
    try {
      const note = await Note.findById(req.params.id);
      if (!note) return res.status(404).send('Not found');
      if (note.file_url) return res.redirect(note.file_url);
      const fp = path.join(__dirname, '..', 'uploads', note.file_name);
      if (!fs.existsSync(fp)) return res.status(404).send('File not found');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${note.file_original_name}"`);
      fs.createReadStream(fp).pipe(res);
    } catch (e) {
      console.error(e);
      res.status(500).send('Error');
    }
  }
};

module.exports = pub;
