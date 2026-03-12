const express = require('express');
const router = express.Router();
const { isAuthenticated, isGuest, isSuperAdmin, canAccessLevel } = require('../middleware/auth');
const upload = require('../middleware/upload');
const uploadAvatar = require('../middleware/uploadAvatar');

const auth       = require('../controllers/authController');
const dash       = require('../controllers/dashboardController');
const levelCtrl  = require('../controllers/levelController');
const comboCtrl  = require('../controllers/combinationController');
const classCtrl  = require('../controllers/classController');
const noteCtrl   = require('../controllers/noteController');
const subAdminCtrl = require('../controllers/subAdminController');
const requestCtrl  = require('../controllers/requestController');

// Auth
router.get('/login', isGuest, auth.showLogin);
router.post('/login', isGuest, auth.login);
router.get('/logout', isAuthenticated, auth.logout);

// Dashboard
router.get('/', isAuthenticated, (req, res) => res.redirect('/admin/dashboard'));
router.get('/dashboard', isAuthenticated, dash.dashboard);

// Settings
router.get('/settings', isAuthenticated, dash.showSettings);
router.post('/settings/profile', isAuthenticated, dash.updateProfile);
router.post('/settings/password', isAuthenticated, dash.updatePassword);
router.post('/settings/avatar', isAuthenticated, uploadAvatar.single('avatar'), dash.uploadAvatar);
router.post('/settings/avatar/remove', isAuthenticated, dash.removeAvatar);

// Change Requests (super only)
router.get('/requests', isAuthenticated, isSuperAdmin, requestCtrl.index);
router.post('/requests/:id/approve', isAuthenticated, isSuperAdmin, requestCtrl.approve);
router.post('/requests/:id/reject', isAuthenticated, isSuperAdmin, requestCtrl.reject);

// Sub-Admin Management (super only)
router.get('/subadmins', isAuthenticated, isSuperAdmin, subAdminCtrl.index);
router.get('/subadmins/create', isAuthenticated, isSuperAdmin, subAdminCtrl.create);
router.post('/subadmins', isAuthenticated, isSuperAdmin, subAdminCtrl.store);
router.get('/subadmins/:id/edit', isAuthenticated, isSuperAdmin, subAdminCtrl.edit);
router.post('/subadmins/:id', isAuthenticated, isSuperAdmin, subAdminCtrl.update);
router.post('/subadmins/:id/delete', isAuthenticated, isSuperAdmin, subAdminCtrl.destroy);

// Levels (super only — sub-admins can't create/edit levels)
router.get('/levels', isAuthenticated, isSuperAdmin, levelCtrl.index);
router.get('/levels/create', isAuthenticated, isSuperAdmin, levelCtrl.create);
router.post('/levels', isAuthenticated, isSuperAdmin, levelCtrl.store);
router.get('/levels/:id/edit', isAuthenticated, isSuperAdmin, levelCtrl.edit);
router.post('/levels/:id', isAuthenticated, isSuperAdmin, levelCtrl.update);
router.post('/levels/:id/delete', isAuthenticated, isSuperAdmin, levelCtrl.destroy);

// Combinations — sub-admin can only access their assigned level
router.get('/levels/:levelId/combinations', isAuthenticated, canAccessLevel, comboCtrl.index);
router.get('/levels/:levelId/combinations/create', isAuthenticated, canAccessLevel, comboCtrl.create);
router.post('/levels/:levelId/combinations', isAuthenticated, canAccessLevel, comboCtrl.store);
router.get('/levels/:levelId/combinations/:id/edit', isAuthenticated, canAccessLevel, comboCtrl.edit);
router.post('/levels/:levelId/combinations/:id', isAuthenticated, canAccessLevel, comboCtrl.update);
router.post('/levels/:levelId/combinations/:id/delete', isAuthenticated, canAccessLevel, comboCtrl.destroy);

// Classes — sub-admin access controlled via combination's level
router.get('/levels/:levelId/combinations/:comboId/classes', isAuthenticated, canAccessLevel, classCtrl.index);
router.get('/levels/:levelId/combinations/:comboId/classes/create', isAuthenticated, canAccessLevel, classCtrl.create);
router.post('/levels/:levelId/combinations/:comboId/classes', isAuthenticated, canAccessLevel, classCtrl.store);
router.get('/levels/:levelId/combinations/:comboId/classes/:id/edit', isAuthenticated, canAccessLevel, classCtrl.edit);
router.post('/levels/:levelId/combinations/:comboId/classes/:id', isAuthenticated, canAccessLevel, classCtrl.update);
router.post('/levels/:levelId/combinations/:comboId/classes/:id/delete', isAuthenticated, canAccessLevel, classCtrl.destroy);

// Notes
router.get('/levels/:levelId/combinations/:comboId/classes/:classId/notes', isAuthenticated, canAccessLevel, noteCtrl.index);
router.get('/levels/:levelId/combinations/:comboId/classes/:classId/notes/create', isAuthenticated, canAccessLevel, noteCtrl.create);
router.post('/levels/:levelId/combinations/:comboId/classes/:classId/notes', isAuthenticated, canAccessLevel, upload.single('file'), noteCtrl.store);
router.get('/levels/:levelId/combinations/:comboId/classes/:classId/notes/:id/edit', isAuthenticated, canAccessLevel, noteCtrl.edit);
router.post('/levels/:levelId/combinations/:comboId/classes/:classId/notes/:id', isAuthenticated, canAccessLevel, upload.single('file'), noteCtrl.update);
router.post('/levels/:levelId/combinations/:comboId/classes/:classId/notes/:id/delete', isAuthenticated, canAccessLevel, noteCtrl.destroy);

module.exports = router;
