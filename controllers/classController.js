const Class = require('../models/Class');
const Combination = require('../models/Combination');
const Level = require('../models/Level');

const backToLevels = (req) => {
  if (req.session.adminRole === 'sub' && req.session.adminLevelId) {
    return `/admin/levels/${req.session.adminLevelId}/combinations`;
  }
  return '/admin/levels';
};

module.exports = {
  index: async (req, res) => {
    const level = await Level.findById(req.params.levelId);
    const combo = await Combination.findById(req.params.comboId);
    if (!combo) { req.flash('error', 'Not found.'); return res.redirect(backToLevels(req)); }
    const classes = await Class.findByCombination(combo.id);
    res.render('admin/classes/index', { layout: 'layouts/admin', title: `${combo.name} — Classes`, level, combo, classes });
  },
  create: async (req, res) => {
    const level = await Level.findById(req.params.levelId);
    const combo = await Combination.findById(req.params.comboId);
    res.render('admin/classes/create', { layout: 'layouts/admin', title: 'Add Class', level, combo });
  },
  store: async (req, res) => {
    try {
      const { name, order_index } = req.body;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      await Class.create({ combination_id: req.params.comboId, name, slug, order_index });
      req.flash('success', 'Class created.');
      res.redirect(`/admin/levels/${req.params.levelId}/combinations/${req.params.comboId}/classes`);
    } catch (err) {
      req.flash('error', 'Error: ' + err.message);
      res.redirect(`/admin/levels/${req.params.levelId}/combinations/${req.params.comboId}/classes/create`);
    }
  },
  edit: async (req, res) => {
    const level = await Level.findById(req.params.levelId);
    const combo = await Combination.findById(req.params.comboId);
    const cls = await Class.findById(req.params.id);
    if (!cls) { req.flash('error', 'Not found.'); return res.redirect(backToLevels(req)); }
    res.render('admin/classes/edit', { layout: 'layouts/admin', title: 'Edit Class', level, combo, cls });
  },
  update: async (req, res) => {
    try {
      const { name, order_index } = req.body;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      await Class.update(req.params.id, { name, slug, order_index });
      req.flash('success', 'Updated.');
      res.redirect(`/admin/levels/${req.params.levelId}/combinations/${req.params.comboId}/classes`);
    } catch (err) {
      req.flash('error', 'Error updating.');
      res.redirect(`/admin/levels/${req.params.levelId}/combinations/${req.params.comboId}/classes`);
    }
  },
  destroy: async (req, res) => {
    try {
      await Class.delete(req.params.id);
      req.flash('success', 'Deleted.');
      res.redirect(`/admin/levels/${req.params.levelId}/combinations/${req.params.comboId}/classes`);
    } catch (err) {
      req.flash('error', 'Error deleting.');
      res.redirect(`/admin/levels/${req.params.levelId}/combinations/${req.params.comboId}/classes`);
    }
  }
};
