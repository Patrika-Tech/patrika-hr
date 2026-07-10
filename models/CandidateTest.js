'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CandidateTest = sequelize.define('CandidateTest', {
  id:           { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  candidateId:  { type: DataTypes.INTEGER, allowNull: false },
  positionName: { type: DataTypes.STRING(255) },
  token:        { type: DataTypes.STRING(64), unique: true },
  questions:    { type: DataTypes.TEXT('long') },  // JSON: full test with correct answers
  answers:      { type: DataTypes.TEXT },           // JSON: candidate's submitted answers
  score:        { type: DataTypes.INTEGER, defaultValue: null },
  maxScore:     { type: DataTypes.INTEGER, defaultValue: 100 },
  status:       { type: DataTypes.ENUM('pending','completed'), defaultValue: 'pending' },
  sentAt:       { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  submittedAt:  { type: DataTypes.DATE, defaultValue: null }
}, {
  tableName: 'candidate_tests',
  timestamps: false
});

module.exports = CandidateTest;
