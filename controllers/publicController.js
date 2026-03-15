const EducationLevel = require('../models/EducationLevel');
const Combination    = require('../models/Combination');
const Class          = require('../models/Class');
const Note           = require('../models/Note');
const path           = require('path');

function getExt(filename) {
  return path.extname(filename || '').toLowerCase().replace('.', '');
}

const pub = {

  // GET /
  index: async (req, res) => {
    try {
      const levels = await EducationLevel.findAll();
      // Enrich with note counts
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

  // GET /notes  — list all education levels
  getLevels: async (req, res) => {
    try {
      const levels = await EducationLevel.findAll();
      res.render('public/levels', {
        title: 'Browse Notes — EduNote',
        levels,
        layout: 'layouts/public'
      });
    } catch (e) {
      console.error(e);
      res.render('public/error', { title: 'Error', message: 'Something went wrong.', layout: 'layouts/public' });
    }
  },

  // GET /notes/:levelSlug  — list combinations inside a level
  getCombinations: async (req, res) => {
    try {
      const level = await EducationLevel.findBySlug(req.params.levelSlug);
      if (!level) return res.status(404).render('public/error', { title: '404', message: 'Level not found.', layout: 'layouts/public' });
      const combinations = await Combination.findByLevel(level.id);
      res.render('public/combinations', {
        title: `${level.name} — Choose Combination`,
        level,
        combinations,
        layout: 'layouts/public'
      });
    } catch (e) {
      console.error(e);
      res.render('public/error', { title: 'Error', message: 'Something went wrong.', layout: 'layouts/public' });
    }
  },

  // GET /notes/:levelSlug/:comboSlug  — list all notes in a combination (all classes merged)
  getNotes: async (req, res) => {
    try {
      const level = await EducationLevel.findBySlug(req.params.levelSlug);
      const combo = await Combination.findBySlug(req.params.comboSlug);
      if (!level || !combo || combo.education_level_id !== level.id)
        return res.status(404).render('public/error', { title: '404', message: 'Page not found.', layout: 'layouts/public' });

      const classes = await Class.findByCombination(combo.id);
      // Collect all notes across all classes, grouped by class
      const classesWith = await Promise.all(classes.map(async (cl) => {
        const notes = await Note.findByClass(cl.id);
        return { ...cl, notes: notes.map(n => ({ ...n, file_size_formatted: Note.formatFileSize(n.file_size) })) };
      }));
      const allNotes = classesWith.flatMap(cl => cl.notes.map(n => ({ ...n, class_name: cl.name })));

      // All combos in the level for tab switcher
      const allCombos = await Combination.findByLevel(level.id);

      res.render('public/notes', {
        title: `${combo.name} — ${level.name} Notes`,
        level,
        combo,
        allCombos,
        classesWith,
        allNotes,
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
      if (!note.file_url) return res.status(404).render('public/error', { title: 'Error', message: 'File not found.', layout: 'layouts/public' });
      const ext      = getExt(note.file_original_name || note.file_name);
      const readMode = ext === 'pdf' ? 'pdf' : 'unsupported';
      res.render('public/reader', {
        title: note.title + ' — Read Online',
        note: { ...note, file_size_formatted: Note.formatFileSize(note.file_size) },
        readMode, html: null, txtContent: null,
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
      if (!note || !note.file_url) return res.status(404).render('public/error', { title: '404', message: 'Note not found.', layout: 'layouts/public' });
      await Note.incrementDownload(note.id);
      res.redirect(note.file_url);
    } catch (e) {
      console.error(e);
      res.render('public/error', { title: 'Error', message: 'Download failed.', layout: 'layouts/public' });
    }
  },

  // GET /view/:id — inline PDF
  viewNote: async (req, res) => {
    try {
      const note = await Note.findById(req.params.id);
      if (!note || !note.file_url) return res.status(404).send('Not found');
      res.redirect(note.file_url);
    } catch (e) {
      console.error(e);
      res.status(500).send('Error');
    }
  }
};

module.exports = pub;
