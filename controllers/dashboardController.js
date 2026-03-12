const Admin = require('../models/Admin');
const Level = require('../models/Level');
const Combination = require('../models/Combination');
const Class = require('../models/Class');
const Note = require('../models/Note');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

module.exports = {
  dashboard: async (req, res) => {
    try {
      const isSuper = req.session.adminRole === 'super';

      // Sub-admins should not see dashboard — redirect to their level
      if (!isSuper && req.session.adminLevelId) {
        return res.redirect(`/admin/levels/${req.session.adminLevelId}/combinations`);
      }
      let levelCount, comboCount, classCount, noteCount, recentNotes, assignedLevel = null;

      if (isSuper) {
        [levelCount, comboCount, classCount, noteCount, recentNotes, subAdmins] = await Promise.all([
          Level.countAll(), Combination.countAll(), Class.countAll(), Note.countAll(), Note.findAll(5),
        Admin.findAll()
        ]);
      } else {
        // Sub-admin: only show stats for their level
        const levelId = req.session.adminLevelId;
        assignedLevel = await Level.findById(levelId);
        [comboCount, classCount, noteCount, recentNotes] = await Promise.all([
          Combination.countByLevel(levelId),
          Class.countByLevel(levelId),
          Note.countByLevel(levelId),
          Note.findByLevel(levelId, 5)
        ]);
        levelCount = 1;
      }

      res.render('admin/dashboard', {
        layout: 'layouts/admin',
        title: 'Dashboard — EduNote Admin',
        levelCount, comboCount, classCount, noteCount, recentNotes,
        isSuper, assignedLevel, subAdmins: (subAdmins||[]).filter(a=>a.role==='sub')
      });
    } catch (err) {
      console.error(err);
      req.flash('error', 'Error loading dashboard');
      res.redirect('/admin/login');
    }
  },

  showSettings: async (req, res) => {
    try {
      const admin = await Admin.findById(req.session.adminId);
      res.render('admin/settings', {
        layout: 'layouts/admin',
        title: 'Settings — EduNote Admin',
        admin,
        isSuper: req.session.adminRole === 'super'
      });
    } catch (err) {
      console.error('Settings error:', err);
      req.flash('error', 'Error loading settings');
      res.redirect('/admin/dashboard');
    }
  },

  updateProfile: async (req, res) => {
    try {
      const { name, email } = req.body;
      await Admin.updateProfile(req.session.adminId, { name, email });
      req.session.adminName = name;
      req.session.adminEmail = email;
      req.flash('success', 'Profile updated successfully.');
      res.redirect('/admin/settings');
    } catch (err) {
      req.flash('error', 'Error updating profile.');
      res.redirect('/admin/settings');
    }
  },

  updatePassword: async (req, res) => {
    try {
      const { current_password, new_password, confirm_password } = req.body;
      if (new_password !== confirm_password) {
        req.flash('error', 'New passwords do not match.');
        return res.redirect('/admin/settings');
      }
      const admin = await Admin.findById(req.session.adminId);
      const isMatch = await Admin.verifyPassword(current_password, admin.password);
      if (!isMatch) {
        req.flash('error', 'Current password is incorrect.');
        return res.redirect('/admin/settings');
      }
      const hashed = await bcrypt.hash(new_password, 12);
      await Admin.updatePassword(req.session.adminId, hashed);
      req.flash('success', 'Password updated successfully.');
      res.redirect('/admin/settings');
    } catch (err) {
      req.flash('error', 'Error updating password.');
      res.redirect('/admin/settings');
    }
  },

  uploadAvatar: async (req, res) => {
    try {
      if (!req.file) { req.flash('error', 'No file uploaded.'); return res.redirect('/admin/settings'); }
      const admin = await Admin.findById(req.session.adminId);
      if (admin.avatar) {
        const oldPath = path.join(__dirname, '../public/avatars', admin.avatar);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      await Admin.updateAvatar(req.session.adminId, req.file.filename);
      req.session.adminAvatar = req.file.filename;
      req.flash('success', 'Profile photo updated.');
      res.redirect('/admin/settings');
    } catch (err) {
      req.flash('error', 'Error uploading photo.');
      res.redirect('/admin/settings');
    }
  },

  removeAvatar: async (req, res) => {
    try {
      const admin = await Admin.findById(req.session.adminId);
      if (admin.avatar) {
        const oldPath = path.join(__dirname, '../public/avatars', admin.avatar);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      await Admin.removeAvatar(req.session.adminId);
      req.session.adminAvatar = null;
      req.flash('success', 'Profile photo removed.');
      res.redirect('/admin/settings');
    } catch (err) {
      req.flash('error', 'Error removing photo.');
      res.redirect('/admin/settings');
    }
  }
};
