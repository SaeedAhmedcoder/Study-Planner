require('dotenv').config();
const { app, ensureSync } = require('../src/app');

module.exports = async (req, res) => {
  await ensureSync();          // create tables on cold start
  return app(req, res);        // hand off to Express
};