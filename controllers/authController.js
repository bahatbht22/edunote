const Admin = require('../models/Admin');

module.exports = {
  showLogin: (req, res) => {
    if (req.session.adminId) return res.redirect('/admin/dashboard');
    res.render('admin/login', {
      layout: 'layouts/admin-auth',
      title: 'Admin Login — EduNote'
    });
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        req.flash('error', 'Email and password are required.');
        return res.redirect('/admin/login');
      }

      const admin = await Admin.findByEmail(email.trim().toLowerCase());
      if (!admin) {
        req.flash('error', 'Invalid credentials.');
        return res.redirect('/admin/login');
      }

      const isMatch = await Admin.verifyPassword(password, admin.password);
      if (!isMatch) {
        req.flash('error', 'Invalid credentials.');
        return res.redirect('/admin/login');
      }

      req.session.adminId      = admin.id;
      req.session.adminName    = admin.name;
      req.session.adminEmail   = admin.email;
      req.session.adminAvatar  = admin.avatar || null;
      req.session.adminRole    = admin.role || 'super';
      req.session.adminLevelId = admin.level_id ? parseInt(admin.level_id) : null;

      req.flash('success', `Welcome back, ${admin.name}!`);
      if (admin.role === 'sub' && admin.level_id) {
        return res.redirect(`/admin/levels/${admin.level_id}/combinations`);
      }
      res.redirect('/admin/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      req.flash('error', 'An error occurred. Please try again.');
      res.redirect('/admin/login');
    }
  },

  logout: (req, res) => {
    req.session.destroy(() => {
      res.redirect('/admin/login');
    });
  }
};
