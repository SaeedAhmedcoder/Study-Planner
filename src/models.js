const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(80), unique: true, allowNull: false },
  email: { type: DataTypes.STRING(120), unique: true, allowNull: false },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
}, { tableName: 'user' });

const Subject = sequelize.define('Subject', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  color: { type: DataTypes.STRING(20), defaultValue: '#0d6efd' },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'subject' });

const Task = sequelize.define('Task', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT, defaultValue: '' },
  deadline: { type: DataTypes.DATE, allowNull: false },
  completed: { type: DataTypes.BOOLEAN, defaultValue: false },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  subject_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'task', timestamps: false });

// Associations
User.hasMany(Subject, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Subject.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });

User.hasMany(Task, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Task.belongsTo(User, { foreignKey: 'user_id' });

Subject.hasMany(Task, { foreignKey: 'subject_id', onDelete: 'CASCADE' });
Task.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });

module.exports = { User, Subject, Task, sequelize };