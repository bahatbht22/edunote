const Combination = require('../models/Combination');
const Level = require('../models/Level');
const ComboRequest = require('../models/ComboRequest');

const backUrl = (req) => {
  if (req.session.adminRole === 'sub' && req.session.adminLevelId) {
    return `/admin/levels/${req.session.adminLevelId}/combinations`;
  }
  return '/admin/levels';
};

module.exports = {
  index: async (req, res) => {
    const level = await Level.findById(req.params.levelId);
    if (!level) { req.flash('error', 'Level not found.'); return res.redirect(backUrl(req)); }
    const combinations = await Combination.findByLevel(level.id);
    const isSuper = req.session.adminRole === 'super';
    let myRequests = [];
    if (!isSuper) myRequests = await ComboRequest.findBySubAdmin(req.session.adminId);
    res.render('admin/combinations/index', {
      layout: 'layouts/admin',
      title: `${level.name} — Combinations`,
      level, combinations, isSuper, myRequests
    });
  },

  // Show create form
  create: async (req, res) => {
    const level = await Level.findById(req.params.levelId);
    if (!level) { req.flash('error', 'Level not found.'); return res.redirect(backUrl(req)); }
    const isSuper = req.session.adminRole === 'super';
    res.render('admin/combinations/create', {
      layout: 'layouts/admin',
      title: isSuper ? 'Add Combination' : 'Request New Combination',
      level, isSuper
    });
  },

  // Handle create
  store: async (req, res) => {
    try {
      const isSuper = req.session.adminRole === 'super';
      const { name, description, color, order_index } = req.body;

      if (isSuper) {
        // Super admin: add directly
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        await Combination.create({ level_id: req.params.levelId, name, slug, description, color, order_index });
        req.flash('success', 'Combination created.');
      } else {
        // Sub-admin: submit request to super admin
        await ComboRequest.createNew({
          sub_admin_id: req.session.adminId,
          level_id: req.params.levelId,
          requested_data: { name, description, color, order_index }
        });
        req.flash('success', '✅ Request submitted! Super admin will review your new combination request.');
      }
      res.redirect(`/admin/levels/${req.params.levelId}/combinations`);
    } catch (err) {
      console.error('ComboRequest store error:', err);
      req.flash('error', 'Error: ' + err.message);
      res.redirect(`/admin/levels/${req.params.levelId}/combinations/create`);
    }
  },

  // Show edit form
  edit: async (req, res) => {
    const combo = await Combination.findById(req.params.id);
    const level = await Level.findById(req.params.levelId);
    if (!combo) { req.flash('error', 'Not found.'); return res.redirect(backUrl(req)); }
    const isSuper = req.session.adminRole === 'super';
    res.render('admin/combinations/edit', {
      layout: 'layouts/admin',
      title: isSuper ? 'Edit Combination' : 'Request Combination Change',
      combo, level, isSuper
    });
  },

  // Handle edit
  update: async (req, res) => {
    try {
      const isSuper = req.session.adminRole === 'super';
      const { name, description, color, order_index } = req.body;

      if (isSuper) {
        // Super admin: apply directly
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        await Combination.update(req.params.id, { name, slug, description, color, order_index });
        req.flash('success', 'Combination updated.');
      } else {
        // Sub-admin: submit edit request
        await ComboRequest.create({
          sub_admin_id: req.session.adminId,
          level_id: req.params.levelId,
          combo_id: req.params.id,
          request_type: 'edit',
          requested_data: { name, description, color, order_index }
        });
        req.flash('success', '✅ Edit request submitted! Super admin will review your changes.');
      }
      res.redirect(`/admin/levels/${req.params.levelId}/combinations`);
    } catch (err) {
      req.flash('error', 'Error: ' + err.message);
      res.redirect(`/admin/levels/${req.params.levelId}/combinations`);
    }
  },

  // Handle delete
  destroy: async (req, res) => {
    try {
      const isSuper = req.session.adminRole === 'super';
      if (isSuper) {
        await Combination.delete(req.params.id);
        req.flash('success', 'Deleted.');
      } else {
        // Sub-admin: submit delete request
        await ComboRequest.create({
          sub_admin_id: req.session.adminId,
          level_id: req.params.levelId,
          combo_id: req.params.id,
          request_type: 'delete',
          requested_data: {}
        });
        req.flash('success', '✅ Delete request submitted! Super admin will review.');
      }
      res.redirect(`/admin/levels/${req.params.levelId}/combinations`);
    } catch (err) {
      req.flash('error', 'Error: ' + err.message);
      res.redirect(`/admin/levels/${req.params.levelId}/combinations`);
    }
  }
};
