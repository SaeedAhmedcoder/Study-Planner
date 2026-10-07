const path = require('path');
const express = require('express');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');

const { sequelize, User, Subject, Task } = require('./models');

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
app.use(expressLayouts);
app.set('layout', 'partials/base');

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Static files
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

// Sessions (stored in DB — required for serverless)
const sessionStore = new SequelizeStore({ db: sequelize });
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-to-a-random-secret-key',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
  },
}));

// Make user + flash available to all views
app.use(async (req, res, next) => {
  res.locals.session = req.session;
  res.locals.user = null;
  if (req.session.userId) {
    try {
      const user = await User.findByPk(req.session.userId);
      req.user = user;
      res.locals.user = user;
    } catch (e) { /* ignore */ }
  }
  // Flash messages
  res.locals.flashes = req.session.flashes || [];
  delete req.session.flashes;
  next();
});

// Flash helper
function flash(req, category, message) {
  if (!req.session.flashes) req.session.flashes = [];
  req.session.flashes.push({ category, message });
}
app.use((req, res, next) => {
  req.flash = (category, message) => flash(req, category, message);
  next();
});

// Auth middleware
function loginRequired(req, res, next) {
  if (!req.session.userId) {
    req.flash('warning', 'Please log in first.');
    return res.redirect('/login');
  }
  next();
}
app.locals.loginRequired = loginRequired;

// Routes
app.use('/', require('./routes/auth'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/subjects', require('./routes/subjects'));
app.use('/tasks', require('./routes/tasks'));

// Home redirect
app.get('/', (req, res) => {
  res.redirect(req.session.userId ? '/dashboard' : '/login');
});

// 404
app.use((req, res) => {
  res.status(404).send('Not Found');
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Server Error');
});

// Sync DB (in serverless, tables are created on first cold start)
let synced = false;
async function ensureSync() {
  if (!synced) {
    await sequelize.authenticate();
    await sequelize.sync();
    synced = true;
  }
}

module.exports = { app, ensureSync, sequelize, User, Subject, Task, loginRequired };