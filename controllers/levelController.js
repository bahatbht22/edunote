const Level = require('../models/Level');

module.exports = {
  index: async (req, res) => {
    const levels = await Level.findAll();
    res.render('admin/levels/index', { layout: 'layouts/admin', title: 'Education Levels', levels });
  },
  create: (req, res) => {
    res.render('admin/levels/create', { layout: 'layouts/admin', title: 'Add Level' });
  },
  store: async (req, res) => {
    try {
      const { name, description, color, order_index } = req.body;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      await Level.create({ name, slug, description, color, order_index });
      req.flash('success', 'Level created successfully.');
      res.redirect('/admin/levels');
    } catch (err) {
      req.flash('error', 'Error creating level: ' + err.message);
      res.redirect('/admin/levels/create');
    }
  },
  edit: async (req, res) => {
    const level = await Level.findById(req.params.id);
    if (!level) { req.flash('error', 'Level not found.'); return res.redirect('/admin/levels'); }
    res.render('admin/levels/edit', { layout: 'layouts/admin', title: 'Edit Level', level });
  },
  update: async (req, res) => {
    try {
      const { name, description, color, order_index } = req.body;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      await Level.update(req.params.id, { name, slug, description, color, order_index });
      req.flash('success', 'Level updated successfully.');
      res.redirect('/admin/levels');
    } catch (err) {
      req.flash('error', 'Error updating level.');
      res.redirect('/admin/levels');
    }
  },
  destroy: async (req, res) => {
    try {
      await Level.delete(req.params.id);
      req.flash('success', 'Level deleted.');
      res.redirect('/admin/levels');
    } catch (err) {
      req.flash('error', 'Error deleting level.');
      res.redirect('/admin/levels');
    }
  }
};
