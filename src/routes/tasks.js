const express = require('express');
const { Op } = require('sequelize');
const { Task, Subject } = require('../models');
const { loginRequired } = require('../app');
const router = express.Router();

router.get('/', loginRequired, async (req, res) => {
  const user = req.user;
  const subjects = await Subject.findAll({ where: { user_id: user.id } });
  const filterBy = req.query.filter || 'all';
  const now = new Date();

  const where = { user_id: user.id };
  if (filterBy === 'pending') where.completed = false;
  else if (filterBy === 'completed') where.completed = true;
  else if (filterBy === 'overdue') {
    where.completed = false;
    where.deadline = { [Op.lt]: now };
  }

  const tasks = await Task.findAll({
    where,
    include: [{ model: Subject, as: 'subject' }],
    order: [['completed', 'ASC'], ['deadline', 'ASC']],
  });

  res.render('tasks', {
    title: 'Tasks',
    tasks,
    subjects,
    now,
    filter_by: filterBy,
    formatDate: (d) => new Date(d).toLocaleString('en-US', {
      month: 'short', day: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }),
  });
});

router.post('/', loginRequired, async (req, res) => {
  const user = req.user;
  const title = (req.body.title || '').trim();
  const description = (req.body.description || '').trim();
  const deadlineStr = req.body.deadline;
  const subjectId = req.body.subject_id;

  if (!title || !deadlineStr || !subjectId) {
    req.flash('danger', 'Title, deadline, and subject are required.');
    return res.redirect('/tasks');
  }

  const subject = await Subject.findOne({
    where: { id: subjectId, user_id: user.id },
  });
  if (!subject) {
    req.flash('danger', 'Invalid subject.');
    return res.redirect('/tasks');
  }

  const deadline = new Date(deadlineStr);
  if (isNaN(deadline.getTime())) {
    req.flash('danger', 'Invalid deadline format.');
    return res.redirect('/tasks');
  }

  await Task.create({
    title, description, deadline,
    subject_id: subject.id, user_id: user.id,
  });
  req.flash('success', 'Task added.');
  res.redirect('/tasks');
});

router.post('/:id/toggle', loginRequired, async (req, res) => {
  const task = await Task.findOne({
    where: { id: req.params.id, user_id: req.user.id },
  });
  if (task) {
    task.completed = !task.completed;
    await task.save();
  }
  res.redirect(req.get('Referer') || '/tasks');
});

router.post('/:id/delete', loginRequired, async (req, res) => {
  const task = await Task.findOne({
    where: { id: req.params.id, user_id: req.user.id },
  });
  if (task) {
    await task.destroy();
    req.flash('info', 'Task deleted.');
  }
  res.redirect(req.get('Referer') || '/tasks');
});

module.exports = router;