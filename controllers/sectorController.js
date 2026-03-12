const Sector = require('../models/Sector');

const sectorController = {
  index: async (req, res) => {
    try {
      const sectors = await Sector.findAll();
      res.render('admin/sectors/index', { title: 'Manage Sectors - EduNote Admin', sectors, layout: 'layouts/admin' });
    } catch (e) { console.error(e); req.flash('error','Failed to load sectors.'); res.redirect('/admin/dashboard'); }
  },

  showCreate: (req, res) => {
    res.render('admin/sectors/create', { title: 'New Sector - EduNote Admin', layout: 'layouts/admin' });
  },

  create: async (req, res) => {
    try {
      const { name, description, color } = req.body;
      if (!name?.trim()) { req.flash('error','Name is required.'); return res.redirect('/admin/sectors/new'); }
      let slug = Sector.generateSlug(name.trim());
      if (await Sector.slugExists(slug)) slug += '-' + Date.now();
      await Sector.create({ name: name.trim(), slug, description, color });
      req.flash('success','Sector created!');
      res.redirect('/admin/sectors');
    } catch (e) { console.error(e); req.flash('error','Failed to create sector.'); res.redirect('/admin/sectors/new'); }
  },

  showEdit: async (req, res) => {
    try {
      const sector = await Sector.findById(req.params.id);
      if (!sector) { req.flash('error','Sector not found.'); return res.redirect('/admin/sectors'); }
      res.render('admin/sectors/edit', { title: 'Edit Sector - EduNote Admin', sector, layout: 'layouts/admin' });
    } catch (e) { console.error(e); req.flash('error','Failed to load sector.'); res.redirect('/admin/sectors'); }
  },

  update: async (req, res) => {
    try {
      const { name, description, color } = req.body;
      if (!name?.trim()) { req.flash('error','Name is required.'); return res.redirect(`/admin/sectors/${req.params.id}/edit`); }
      let slug = Sector.generateSlug(name.trim());
      if (await Sector.slugExists(slug, req.params.id)) slug += '-' + Date.now();
      await Sector.update(req.params.id, { name: name.trim(), slug, description, color });
      req.flash('success','Sector updated!');
      res.redirect('/admin/sectors');
    } catch (e) { console.error(e); req.flash('error','Failed to update sector.'); res.redirect(`/admin/sectors/${req.params.id}/edit`); }
  },

  delete: async (req, res) => {
    try {
      await Sector.delete(req.params.id);
      req.flash('success','Sector deleted.');
      res.redirect('/admin/sectors');
    } catch (e) { console.error(e); req.flash('error','Failed to delete sector.'); res.redirect('/admin/sectors'); }
  }
};

module.exports = sectorController;
