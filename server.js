require('dotenv').config();
const express    = require('express');
const session    = require('express-session');
const flash      = require('connect-flash');
const ejsLayouts = require('express-ejs-layouts');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(ejsLayouts);
app.set('layout', 'layouts/public');

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'edunote-v2-secret-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(flash());

app.use((req, res, next) => {
  res.locals.success_msg  = req.flash('success');
  res.locals.error_msg    = req.flash('error');
  res.locals.adminId      = req.session.adminId    || null;
  res.locals.adminName    = req.session.adminName  || null;
  res.locals.adminEmail   = req.session.adminEmail || null;
  res.locals.adminAvatar  = req.session.adminAvatar || null;
  next();
});

app.use('/',      require('./routes/public'));
app.use('/admin', require('./routes/admin'));

// 404
app.use((req, res) => {
  res.status(404).render('public/error', {
    title: '404 — Not Found',
    message: 'The page you are looking for does not exist.',
    layout: 'layouts/public'
  });
});

// 500
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('public/error', {
    title: '500 — Server Error',
    message: 'Something went wrong on our end.',
    layout: 'layouts/public'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 EduNote v2 running at http://localhost:${PORT}`);
  console.log(`📚 Admin: http://localhost:${PORT}/admin/login`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
