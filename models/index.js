const Candidate = require('./Candidate');
const Communication = require('./Communication');
const Admin = require('./Admin');
const Position = require('./Position');
const Department = require('./Department');
const CandidateDetailForm = require('./CandidateDetailForm');
const ManpowerRequisition = require('./ManpowerRequisition');
const InterviewSheet = require('./InterviewSheet');
const ActivityLog = require('./ActivityLog');
const CandidateTest = require('./CandidateTest');

// Associations
Candidate.hasMany(Communication, { foreignKey: 'candidateId', as: 'communications', onDelete: 'CASCADE' });
Communication.belongsTo(Candidate, { foreignKey: 'candidateId' });
Candidate.hasOne(CandidateDetailForm, { foreignKey: 'candidateId', as: 'detailForm', onDelete: 'CASCADE' });
CandidateDetailForm.belongsTo(Candidate, { foreignKey: 'candidateId' });
Candidate.hasOne(InterviewSheet, { foreignKey: 'candidateId', as: 'interviewSheet', onDelete: 'CASCADE' });
InterviewSheet.belongsTo(Candidate, { foreignKey: 'candidateId' });
Candidate.hasMany(ActivityLog, { foreignKey: 'candidateId', as: 'activityLogs', onDelete: 'CASCADE' });
ActivityLog.belongsTo(Candidate, { foreignKey: 'candidateId', as: 'candidate' });

Candidate.hasMany(CandidateTest, { foreignKey: 'candidateId', as: 'tests', onDelete: 'CASCADE' });
CandidateTest.belongsTo(Candidate, { foreignKey: 'candidateId' });

module.exports = { Candidate, Communication, Admin, Position, Department, CandidateDetailForm, ManpowerRequisition, InterviewSheet, ActivityLog, CandidateTest };
