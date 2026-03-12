require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/public');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'edunote-secret-key',
  resave: true,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Flash messages
app.use(flash());

// Global variables
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.admin = req.session.adminId ? {
    id: req.session.adminId,
    name: req.session.adminName,
    email: req.session.adminEmail,
    avatar: req.session.adminAvatar
  } : null;
  res.locals.session = req.session;
  // Show pending request count in sidebar for super admins
  if (req.session.adminRole === 'super') {
    try {
      const ComboRequest = require('./models/ComboRequest');
      ComboRequest.countPending().then(count => {
        res.locals.pendingRequestCount = count;
        next();
      }).catch(() => { res.locals.pendingRequestCount = 0; next(); });
    } catch(e) { res.locals.pendingRequestCount = 0; next(); }
  } else {
    res.locals.pendingRequestCount = 0;
    next();
  }
});

// Routes
app.use('/', require('./routes/public'));
app.use('/admin', require('./routes/admin'));

// 404
app.use((req, res) => {
  res.status(404).render('public/error', {
    layout: 'layouts/public',
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist.'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('public/error', {
    layout: 'layouts/public',
    title: 'Server Error',
    message: 'Something went wrong.'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 EduNote is running at http://localhost:${PORT}`);
  console.log(`📚 Admin Panel: http://localhost:${PORT}/admin/login`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
