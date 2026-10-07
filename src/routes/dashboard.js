const express = require('express');
const { Op } = require('sequelize');
const { Task, Subject } = require('../models');
const { loginRequired } = require('../app');
const router = express.Router();

router.get('/', loginRequired, async (req, res) => {
  const user = req.user;
  const now = new Date();

  const allTasks = await Task.findAll({ where: { user_id: user.id } });

  const upcoming = await Task.findAll({
    where: { user_id: user.id, completed: false, deadline: { [Op.gte]: now } },
    include: [{ model: Subject, as: 'subject' }],
    order: [['deadline', 'ASC']],
    limit: 5,
  });

  const overdue = await Task.findAll({
    where: { user_id: user.id, completed: false, deadline: { [Op.lt]: now } },
    include: [{ model: Subject, as: 'subject' }],
    order: [['deadline', 'ASC']],
  });

  const stats = {
    total: allTasks.length,
    completed: allTasks.filter(t => t.completed).length,
    pending: allTasks.filter(t => !t.completed).length,
    overdue: overdue.length,
  };

  res.render('dashboard', {
    title: 'Dashboard',
    user,
    upcoming,
    overdue,
    stats,
    now,
    formatDate: (d) => new Date(d).toLocaleString('en-US', {
      month: 'short', day: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }),
  });
});

module.exports = router;