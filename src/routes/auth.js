const express = require('express');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const router = express.Router();

router.get('/register', (req, res) => {
  res.render('register', { title: 'Register' });
});

router.post('/register', async (req, res) => {
  try {
    const username = (req.body.username || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!username || !email || !password) {
      req.flash('danger', 'All fields are required.');
      return res.redirect('/register');
    }

    const existing = await User.findOne({
      where: { [require('sequelize').Op.or]: [{ username }, { email }] },
    });
    if (existing) {
      req.flash('danger', 'Username or email already exists.');
      return res.redirect('/register');
    }

    const hash = await bcrypt.hash(password, 10);
    await User.create({ username, email, password_hash: hash });
    req.flash('success', 'Account created! Please log in.');
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    req.flash('danger', 'Registration failed.');
    res.redirect('/register');
  }
});

router.get('/login', (req, res) => {
  res.render('login', { title: 'Login' });
});

router.post('/login', async (req, res) => {
  const username = (req.body.username || '').trim();
  const password = req.body.password || '';
  const user = await User.findOne({ where: { username } });

  if (user && await bcrypt.compare(password, user.password_hash)) {
    req.session.userId = user.id;
    req.session.username = user.username;
    req.flash('success', `Welcome back, ${user.username}!`);
    return res.redirect('/dashboard');
  }

  req.flash('danger', 'Invalid credentials.');
  res.redirect('/login');
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;