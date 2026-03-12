const Note = require('../models/Note');
const Class = require('../models/Class');
const Combination = require('../models/Combination');
const Level = require('../models/Level');

module.exports = {
  index: async (req, res) => {
    const level = await Level.findById(req.params.levelId);
    const combo = await Combination.findById(req.params.comboId);
    const cls = await Class.findById(req.params.classId);
    if (!cls) { req.flash('error', 'Not found.'); return res.redirect('/admin/levels'); }
    const notes = await Note.findByClass(cls.id);
    res.render('admin/notes/index', { layout: 'layouts/admin', title: `${cls.name} — Notes`, level, combo, cls, notes });
  },
  create: async (req, res) => {
    const level = await Level.findById(req.params.levelId);
    const combo = await Combination.findById(req.params.comboId);
    const cls = await Class.findById(req.params.classId);
    res.render('admin/notes/create', { layout: 'layouts/admin', title: 'Upload Note', level, combo, cls });
  },
  store: async (req, res) => {
    try {
      if (!req.file) {
        req.flash('error', 'Please select a file to upload.');
        return res.redirect(`/admin/levels/${req.params.levelId}/combinations/${req.params.comboId}/classes/${req.params.classId}/notes/create`);
      }
      const { title, description } = req.body;

      // file_url: only set for Cloudinary HTTP URLs, never for local disk paths
      const fileUrl = (req.file.path && req.file.path.startsWith('http')) ? req.file.path : '';

      // Always derive file_type from original filename extension for reliable PDF detection
      const path = require('path');
      const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');

      await Note.create({
        class_id: req.params.classId,
        title,
        description,
        file_name: req.file.filename,
        file_original_name: req.file.originalname,
        file_size: req.file.size || 0,
        file_type: ext,
        file_url: fileUrl
      });
      req.flash('success', 'Note uploaded successfully.');
      res.redirect(`/admin/levels/${req.params.levelId}/combinations/${req.params.comboId}/classes/${req.params.classId}/notes`);
    } catch (err) {
      console.error(err);
      req.flash('error', 'Error uploading note: ' + err.message);
      res.redirect(`/admin/levels/${req.params.levelId}/combinations/${req.params.comboId}/classes/${req.params.classId}/notes/create`);
    }
  },
  edit: async (req, res) => {
    const level = await Level.findById(req.params.levelId);
    const combo = await Combination.findById(req.params.comboId);
    const cls = await Class.findById(req.params.classId);
    const note = await Note.findById(req.params.id);
    if (!note) { req.flash('error', 'Note not found.'); return res.redirect('/admin/levels'); }
    res.render('admin/notes/edit', { layout: 'layouts/admin', title: 'Edit Note', level, combo, cls, note });
  },
  update: async (req, res) => {
    try {
      const { title, description } = req.body;
      await Note.update(req.params.id, { class_id: req.params.classId, title, description });
      if (req.file) {
        const fileUrl = req.file.path || '';
        await Note.updateFile(req.params.id, {
          file_name: req.file.filename,
          file_original_name: req.file.originalname,
          file_size: req.file.size || 0,
          file_type: req.file.mimetype || '',
          file_url: fileUrl
        });
      }
      req.flash('success', 'Note updated.');
      res.redirect(`/admin/levels/${req.params.levelId}/combinations/${req.params.comboId}/classes/${req.params.classId}/notes`);
    } catch (err) {
      req.flash('error', 'Error updating note.');
      res.redirect(`/admin/levels/${req.params.levelId}/combinations/${req.params.comboId}/classes/${req.params.classId}/notes`);
    }
  },
  destroy: async (req, res) => {
    try {
      await Note.delete(req.params.id);
      req.flash('success', 'Note deleted.');
      res.redirect(`/admin/levels/${req.params.levelId}/combinations/${req.params.comboId}/classes/${req.params.classId}/notes`);
    } catch (err) {
      req.flash('error', 'Error deleting note.');
      res.redirect(`/admin/levels/${req.params.levelId}/combinations/${req.params.comboId}/classes/${req.params.classId}/notes`);
    }
  }
};
