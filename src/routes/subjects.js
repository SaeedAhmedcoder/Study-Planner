const express = require('express');
const { Subject, Task } = require('../models');
const { loginRequired } = require('../app');
const router = express.Router();

router.get('/', loginRequired, async (req, res) => {
  const subjects = await Subject.findAll({
    where: { user_id: req.user.id },
    include: [{ model: Task }],
  });
  res.render('subjects', { title: 'Subjects', subjects });
});

router.post('/', loginRequired, async (req, res) => {
  const name = (req.body.name || '').trim();
  const color = req.body.color || '#0d6efd';
  if (name) {
    await Subject.create({ name, color, user_id: req.user.id });
    req.flash('success', 'Subject added.');
  }
  res.redirect('/subjects');
});

router.post('/:id/delete', loginRequired, async (req, res) => {
  const subj = await Subject.findOne({
    where: { id: req.params.id, user_id: req.user.id },
  });
  if (subj) {
    await subj.destroy();
    req.flash('info', 'Subject and its tasks deleted.');
  }
  res.redirect('/subjects');
});

module.exports = router;