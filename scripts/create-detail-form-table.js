require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER, password: process.env.DB_PASS,
    database: process.env.DB_NAME, ssl: { rejectUnauthorized: false }
  });

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS candidate_detail_forms (
      id               INT AUTO_INCREMENT PRIMARY KEY,
      candidateId      INT NOT NULL,
      token            VARCHAR(64) NOT NULL UNIQUE,
      tokenExpiresAt   DATETIME NOT NULL,
      status           ENUM('pending','submitted') DEFAULT 'pending',
      submittedAt      DATETIME,

      joiningPeriod    VARCHAR(100),
      department       VARCHAR(100),
      totalExperience  VARCHAR(100),

      gender           VARCHAR(20),
      dob              VARCHAR(20),
      age              VARCHAR(10),
      domicile         VARCHAR(100),
      maritalStatus    VARCHAR(30),
      fatherName       VARCHAR(255),
      fatherContact    VARCHAR(30),
      spouseName       VARCHAR(255),
      spouseContact    VARCHAR(30),
      presentAddress   TEXT,
      permanentAddress TEXT,
      idNumber         VARCHAR(100),
      photoPath        VARCHAR(500),

      qualifications       LONGTEXT,
      itSkills             TEXT,
      professionalTraining TEXT,

      experiences           LONGTEXT,
      employmentGap         TEXT,
      engagementTerm        TINYINT(1),
      engagementTermDetails TEXT,
      canContactEmployer    TINYINT(1),

      lastSalaryRevision  VARCHAR(50),
      nextSalaryRevision  VARCHAR(50),
      salBasic            DECIMAL(10,2),
      salDA               DECIMAL(10,2),
      salHRA              DECIMAL(10,2),
      salConveyance       DECIMAL(10,2),
      salMedical          DECIMAL(10,2),
      salOthers           DECIMAL(10,2),
      salIncentives       DECIMAL(10,2),
      statPF              DECIMAL(10,2),
      statESI             DECIMAL(10,2),
      statGratuity        DECIMAL(10,2),
      statMediClaim       DECIMAL(10,2),
      statSuperannuation  DECIMAL(10,2),
      statBonus           DECIMAL(10,2),
      statLTA             DECIMAL(10,2),
      ctcPerAnnum         DECIMAL(12,2),

      personalReferences    TEXT,
      employmentReferences  TEXT,

      medTreatment            TINYINT(1),
      medChronic              TINYINT(1),
      medChronicDetails       TEXT,
      medSurgeries            TINYINT(1),
      medSurgeriesDetails     TEXT,
      medDisabilities         TINYINT(1),
      medDisabilitiesDetails  TEXT,
      medAllergies            TINYINT(1),
      medAllergiesDetails     TEXT,
      medCommunicable         TINYINT(1),
      medCommunicableDetails  TEXT,
      medHealthInsurance      TINYINT(1),
      medMedications          TINYINT(1),
      medMedicationsDetails   TEXT,

      legalSuit              TINYINT(1),
      legalSuitDetails       TEXT,
      appliedBefore          TINYINT(1),
      appliedBeforeMonth     VARCHAR(50),
      appliedBeforeDept      VARCHAR(100),
      appliedBeforeLocation  VARCHAR(100),
      appliedBeforePosition  VARCHAR(100),
      patrikaKnown           TEXT,

      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      INDEX idx_candidateId (candidateId),
      INDEX idx_token (token),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  console.log('candidate_detail_forms table created (or already exists).');
  await conn.end();
}

run().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
