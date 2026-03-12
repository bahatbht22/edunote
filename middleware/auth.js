const isAuthenticated = (req, res, next) => {
  if (req.session.adminId) return next();
  req.flash('error', 'Please login to access the admin panel.');
  return res.redirect('/admin/login');
};

const isGuest = (req, res, next) => {
  if (!req.session.adminId) return next();
  return res.redirect('/admin/dashboard');
};

// Only super admins can access this route
const isSuperAdmin = (req, res, next) => {
  if (req.session.adminRole === 'super') return next();
  req.flash('error', 'Access denied. Super admin only.');
  return res.redirect('/admin/dashboard');
};

// Check sub-admin can only access their assigned level
const canAccessLevel = (req, res, next) => {
  if (req.session.adminRole === 'super') return next();
  const levelId = parseInt(req.params.levelId || req.params.id);
  if (req.session.adminLevelId && req.session.adminLevelId === levelId) return next();
  req.flash('error', 'Access denied. You can only manage your assigned level.');
  return res.redirect('/admin/dashboard');
};

module.exports = { isAuthenticated, isGuest, isSuperAdmin, canAccessLevel };
