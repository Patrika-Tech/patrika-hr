const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CandidateDetailForm = sequelize.define('CandidateDetailForm', {
  id:             { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  candidateId:    { type: DataTypes.INTEGER, allowNull: false },
  token:          { type: DataTypes.STRING(64), allowNull: false, unique: true },
  tokenExpiresAt: { type: DataTypes.DATE, allowNull: false },
  status:         { type: DataTypes.ENUM('pending','submitted'), defaultValue: 'pending' },
  submittedAt:    { type: DataTypes.DATE },

  // ── Header ────────────────────────────────────────────────────────────────
  joiningPeriod:    { type: DataTypes.STRING(100) },
  department:       { type: DataTypes.STRING(100) },
  totalExperience:  { type: DataTypes.STRING(100) },

  // ── Personal Detail ───────────────────────────────────────────────────────
  gender:           { type: DataTypes.STRING(20) },
  dob:              { type: DataTypes.STRING(20) },
  age:              { type: DataTypes.STRING(10) },
  domicile:         { type: DataTypes.STRING(100) },
  maritalStatus:    { type: DataTypes.STRING(30) },
  fatherName:       { type: DataTypes.STRING(255) },
  fatherContact:    { type: DataTypes.STRING(30) },
  spouseName:       { type: DataTypes.STRING(255) },
  spouseContact:    { type: DataTypes.STRING(30) },
  presentAddress:   { type: DataTypes.TEXT },
  permanentAddress: { type: DataTypes.TEXT },
  idNumber:         { type: DataTypes.STRING(100) }, // Aadhar/PAN/Passport
  photoPath:        { type: DataTypes.STRING(500) },

  // ── Qualifications ────────────────────────────────────────────────────────
  qualifications:       { type: DataTypes.TEXT('long') }, // JSON array
  itSkills:             { type: DataTypes.TEXT },
  professionalTraining: { type: DataTypes.TEXT },

  // ── Experience ────────────────────────────────────────────────────────────
  experiences:            { type: DataTypes.TEXT('long') }, // JSON array
  employmentGap:          { type: DataTypes.TEXT },
  engagementTerm:         { type: DataTypes.BOOLEAN },
  engagementTermDetails:  { type: DataTypes.TEXT },
  canContactEmployer:     { type: DataTypes.BOOLEAN },

  // ── Remuneration ──────────────────────────────────────────────────────────
  lastSalaryRevision:  { type: DataTypes.STRING(50) },
  nextSalaryRevision:  { type: DataTypes.STRING(50) },
  salBasic:            { type: DataTypes.DECIMAL(10,2) },
  salDA:               { type: DataTypes.DECIMAL(10,2) },
  salHRA:              { type: DataTypes.DECIMAL(10,2) },
  salConveyance:       { type: DataTypes.DECIMAL(10,2) },
  salMedical:          { type: DataTypes.DECIMAL(10,2) },
  salOthers:           { type: DataTypes.DECIMAL(10,2) },
  salIncentives:       { type: DataTypes.DECIMAL(10,2) },
  statPF:              { type: DataTypes.DECIMAL(10,2) },
  statESI:             { type: DataTypes.DECIMAL(10,2) },
  statGratuity:        { type: DataTypes.DECIMAL(10,2) },
  statMediClaim:       { type: DataTypes.DECIMAL(10,2) },
  statSuperannuation:  { type: DataTypes.DECIMAL(10,2) },
  statBonus:           { type: DataTypes.DECIMAL(10,2) },
  statLTA:             { type: DataTypes.DECIMAL(10,2) },
  ctcPerAnnum:         { type: DataTypes.DECIMAL(12,2) },

  // ── References ────────────────────────────────────────────────────────────
  personalReferences:   { type: DataTypes.TEXT }, // JSON array
  employmentReferences: { type: DataTypes.TEXT }, // JSON array

  // ── Medical History ───────────────────────────────────────────────────────
  medTreatment:           { type: DataTypes.BOOLEAN },
  medChronic:             { type: DataTypes.BOOLEAN },
  medChronicDetails:      { type: DataTypes.TEXT },  // comma-sep conditions + other
  medSurgeries:           { type: DataTypes.BOOLEAN },
  medSurgeriesDetails:    { type: DataTypes.TEXT },
  medDisabilities:        { type: DataTypes.BOOLEAN },
  medDisabilitiesDetails: { type: DataTypes.TEXT },
  medAllergies:           { type: DataTypes.BOOLEAN },
  medAllergiesDetails:    { type: DataTypes.TEXT },
  medCommunicable:        { type: DataTypes.BOOLEAN },
  medCommunicableDetails: { type: DataTypes.TEXT },
  medHealthInsurance:     { type: DataTypes.BOOLEAN },
  medMedications:         { type: DataTypes.BOOLEAN },
  medMedicationsDetails:  { type: DataTypes.TEXT },

  // ── General ───────────────────────────────────────────────────────────────
  legalSuit:              { type: DataTypes.BOOLEAN },
  legalSuitDetails:       { type: DataTypes.TEXT },
  appliedBefore:          { type: DataTypes.BOOLEAN },
  appliedBeforeMonth:     { type: DataTypes.STRING(50) },
  appliedBeforeDept:      { type: DataTypes.STRING(100) },
  appliedBeforeLocation:  { type: DataTypes.STRING(100) },
  appliedBeforePosition:  { type: DataTypes.STRING(100) },
  patrikaKnown:           { type: DataTypes.TEXT }, // JSON array

  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName:  'candidate_detail_forms',
  timestamps: false
});

module.exports = CandidateDetailForm;
