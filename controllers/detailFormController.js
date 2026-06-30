const crypto  = require('crypto');
const path     = require('path');
const fs       = require('fs');
const { Candidate, CandidateDetailForm } = require('../models');
const { sendEmail } = require('../utils/emailService');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function safeJSON(str, fallback = []) {
  try { return str ? JSON.parse(str) : fallback; } catch { return fallback; }
}

function dec(v) { return parseFloat(v) || null; }
function bool(v) { return v === '1' || v === 'true' || v === true; }

// ─── Send form link to candidate ──────────────────────────────────────────────

exports.sendDetailForm = async (req, res) => {
  try {
    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });
    if (!candidate.email) return res.status(400).json({ success: false, message: 'Candidate has no email' });

    const token    = generateToken();
    const expires  = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Upsert — replace any previous pending form
    await CandidateDetailForm.destroy({ where: { candidateId: candidate.id, status: 'pending' } });

    await CandidateDetailForm.create({
      candidateId:    candidate.id,
      token,
      tokenExpiresAt: expires,
      status:         'pending',
      department:     candidate.positionApplying || '',
      totalExperience: candidate.parsedTotalExperience || '',
      createdAt:      new Date(),
      updatedAt:      new Date()
    });

    const appUrl  = process.env.APP_URL || 'http://localhost:4000';
    const formUrl = `${appUrl}/detail-form/${token}`;

    await sendEmail({
      to:      candidate.email,
      subject: `Personal Detail Form – Patrika HR | Action Required`,
      html:    detailFormEmailTemplate(candidate.fullName, candidate.positionApplying, formUrl, expires)
    });

    res.json({ success: true, message: 'Form link sent to ' + candidate.email, expires: expires.toISOString() });
  } catch (err) {
    console.error('Send detail form error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Show the form (public – no auth) ─────────────────────────────────────────

exports.showDetailForm = async (req, res) => {
  try {
    const form = await CandidateDetailForm.findOne({
      where: { token: req.params.token },
      include: [{ model: Candidate, as: 'Candidate' }]
    });

    if (!form) return res.status(404).render('detail-form-error', { message: 'This link is invalid or has expired.' });
    if (form.status === 'submitted') return res.render('detail-form-error', { message: 'You have already submitted this form. Thank you!' });
    if (new Date() > new Date(form.tokenExpiresAt)) return res.render('detail-form-error', { message: 'This link has expired. Please contact HR.' });

    const candidate = form.Candidate;
    res.render('detail-form', {
      title:     'Personal Detail Form – Patrika HR',
      form,
      candidate,
      token:     req.params.token
    });
  } catch (err) {
    console.error('Show detail form error:', err);
    res.status(500).send('Server error: ' + err.message);
  }
};

// ─── Submit the form (public – no auth) ───────────────────────────────────────

exports.submitDetailForm = async (req, res) => {
  try {
    const form = await CandidateDetailForm.findOne({ where: { token: req.params.token } });
    if (!form)                                    return res.redirect(`/detail-form/${req.params.token}?error=invalid`);
    if (form.status === 'submitted')              return res.redirect(`/detail-form/${req.params.token}?error=already`);
    if (new Date() > new Date(form.tokenExpiresAt)) return res.redirect(`/detail-form/${req.params.token}?error=expired`);

    const b = req.body;

    // Build JSON arrays
    const qualifications = [];
    const degrees = ['10th','12th','Graduation','PG','Others'];
    degrees.forEach(d => {
      const key = d.replace('/','_').replace(' ','_');
      if (b[`qual_inst_${key}`]) {
        qualifications.push({
          degree:        d,
          institution:   b[`qual_inst_${key}`]   || '',
          board:         b[`qual_board_${key}`]  || '',
          yearOfPassing: b[`qual_year_${key}`]   || '',
          subject:       b[`qual_subj_${key}`]   || '',
          percentage:    b[`qual_pct_${key}`]    || ''
        });
      }
    });

    const experiences = [];
    for (let i = 1; i <= 5; i++) {
      if (b[`exp_employer_${i}`]) {
        experiences.push({
          employer:       b[`exp_employer_${i}`]  || '',
          address:        b[`exp_address_${i}`]   || '',
          fromDate:       b[`exp_from_${i}`]      || '',
          toDate:         b[`exp_to_${i}`]        || '',
          position:       b[`exp_position_${i}`]  || '',
          typeOfWork:     b[`exp_type_${i}`]      || '',
          reasonLeaving:  b[`exp_reason_${i}`]    || '',
          annualCtc:      b[`exp_ctc_${i}`]       || ''
        });
      }
    }

    const personalReferences = [];
    for (let i = 1; i <= 2; i++) {
      if (b[`pref_name_${i}`]) {
        personalReferences.push({
          name:     b[`pref_name_${i}`]     || '',
          relation: b[`pref_relation_${i}`] || '',
          location: b[`pref_location_${i}`] || '',
          contact:  b[`pref_contact_${i}`]  || ''
        });
      }
    }

    const employmentReferences = [];
    for (let i = 1; i <= 2; i++) {
      if (b[`eref_name_${i}`]) {
        employmentReferences.push({
          name:        b[`eref_name_${i}`]        || '',
          affiliation: b[`eref_affiliation_${i}`] || '',
          department:  b[`eref_dept_${i}`]        || '',
          location:    b[`eref_location_${i}`]    || '',
          contact:     b[`eref_contact_${i}`]     || ''
        });
      }
    }

    const patrikaKnown = [];
    for (let i = 1; i <= 3; i++) {
      if (b[`pk_name_${i}`]) {
        patrikaKnown.push({
          name:       b[`pk_name_${i}`]   || '',
          department: b[`pk_dept_${i}`]   || '',
          location:   b[`pk_loc_${i}`]    || '',
          contact:    b[`pk_contact_${i}`]|| ''
        });
      }
    }

    // Chronic conditions
    const chronicArr = [];
    ['Diabetes','Hypertension','Asthma','Heart Disease','Epilepsy','Thyroid'].forEach(c => {
      if (b[`med_chronic_${c.replace(' ','_')}`]) chronicArr.push(c);
    });
    if (b.med_chronic_other) chronicArr.push('Other: ' + b.med_chronic_other);

    // Photo
    let photoPath = form.photoPath || null;
    if (req.file) {
      // Remove old photo if exists
      if (form.photoPath && fs.existsSync(form.photoPath)) fs.unlink(form.photoPath, () => {});
      photoPath = req.file.path;
    }

    await form.update({
      status:    'submitted',
      submittedAt: new Date(),
      updatedAt: new Date(),

      joiningPeriod:   b.joiningPeriod  || '',
      department:      b.department     || '',
      totalExperience: b.totalExperience|| '',

      gender:           b.gender          || '',
      dob:              b.dob             || '',
      age:              b.age             || '',
      domicile:         b.domicile        || '',
      maritalStatus:    b.maritalStatus   || '',
      fatherName:       b.fatherName      || '',
      fatherContact:    b.fatherContact   || '',
      spouseName:       b.spouseName      || '',
      spouseContact:    b.spouseContact   || '',
      presentAddress:   b.presentAddress  || '',
      permanentAddress: b.permanentAddress|| '',
      idNumber:         b.idNumber        || '',
      photoPath,

      qualifications:       JSON.stringify(qualifications),
      itSkills:             b.itSkills             || '',
      professionalTraining: b.professionalTraining || '',

      experiences:           JSON.stringify(experiences),
      employmentGap:         b.employmentGap         || '',
      engagementTerm:        bool(b.engagementTerm),
      engagementTermDetails: b.engagementTermDetails || '',
      canContactEmployer:    bool(b.canContactEmployer),

      lastSalaryRevision:  b.lastSalaryRevision  || '',
      nextSalaryRevision:  b.nextSalaryRevision  || '',
      salBasic:            dec(b.salBasic),
      salDA:               dec(b.salDA),
      salHRA:              dec(b.salHRA),
      salConveyance:       dec(b.salConveyance),
      salMedical:          dec(b.salMedical),
      salOthers:           dec(b.salOthers),
      salIncentives:       dec(b.salIncentives),
      statPF:              dec(b.statPF),
      statESI:             dec(b.statESI),
      statGratuity:        dec(b.statGratuity),
      statMediClaim:       dec(b.statMediClaim),
      statSuperannuation:  dec(b.statSuperannuation),
      statBonus:           dec(b.statBonus),
      statLTA:             dec(b.statLTA),
      ctcPerAnnum:         dec(b.ctcPerAnnum),

      personalReferences:   JSON.stringify(personalReferences),
      employmentReferences: JSON.stringify(employmentReferences),

      medTreatment:           bool(b.medTreatment),
      medChronic:             bool(b.medChronic),
      medChronicDetails:      chronicArr.join(', '),
      medSurgeries:           bool(b.medSurgeries),
      medSurgeriesDetails:    b.medSurgeriesDetails    || '',
      medDisabilities:        bool(b.medDisabilities),
      medDisabilitiesDetails: b.medDisabilitiesDetails || '',
      medAllergies:           bool(b.medAllergies),
      medAllergiesDetails:    b.medAllergiesDetails    || '',
      medCommunicable:        bool(b.medCommunicable),
      medCommunicableDetails: b.medCommunicableDetails || '',
      medHealthInsurance:     bool(b.medHealthInsurance),
      medMedications:         bool(b.medMedications),
      medMedicationsDetails:  b.medMedicationsDetails  || '',

      legalSuit:             bool(b.legalSuit),
      legalSuitDetails:      b.legalSuitDetails      || '',
      appliedBefore:         bool(b.appliedBefore),
      appliedBeforeMonth:    b.appliedBeforeMonth    || '',
      appliedBeforeDept:     b.appliedBeforeDept     || '',
      appliedBeforeLocation: b.appliedBeforeLocation || '',
      appliedBeforePosition: b.appliedBeforePosition || '',
      patrikaKnown:          JSON.stringify(patrikaKnown)
    });

    res.render('detail-form-success', { title: 'Form Submitted – Patrika HR' });
  } catch (err) {
    console.error('Submit detail form error:', err);
    res.status(500).send('Server error while saving form: ' + err.message);
  }
};

// ─── Admin: view submitted form ───────────────────────────────────────────────

exports.viewDetailForm = async (req, res) => {
  try {
    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate) return res.status(404).send('Candidate not found');

    const form = await CandidateDetailForm.findOne({ where: { candidateId: req.params.id } });
    if (!form || form.status !== 'submitted') return res.status(404).send('No submitted form found');

    const safeJ = (v) => safeJSON(v);

    res.render('admin/detail-form-view', {
      title:     `Detail Form – ${candidate.fullName}`,
      adminName: req.session.adminName,
      candidate,
      form,
      qualifications:       safeJ(form.qualifications),
      experiences:          safeJ(form.experiences),
      personalReferences:   safeJ(form.personalReferences),
      employmentReferences: safeJ(form.employmentReferences),
      patrikaKnown:         safeJ(form.patrikaKnown),
      v: res.locals.v
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

// ─── Email template ───────────────────────────────────────────────────────────

function detailFormEmailTemplate(name, position, formUrl, expires) {
  const expiryStr = expires.toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e0c97a;border-radius:8px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#1a1a2e,#8b6914);padding:24px;text-align:center;">
      <h2 style="color:#f0c030;margin:0;font-size:22px;">Rajasthan Patrika | Patrika Group</h2>
      <p style="color:#fff;margin:4px 0 0;font-size:13px;">HR – Recruitment</p>
    </div>
    <div style="padding:32px;background:#fff;">
      <p style="font-size:16px;color:#333;">Dear <strong>${name}</strong>,</p>
      <p style="color:#555;line-height:1.7;">
        Congratulations! We are pleased to inform you that you have been shortlisted for an interview for the position of
        <strong>${position}</strong> at Patrika Group.
      </p>
      <p style="color:#555;line-height:1.7;">
        As part of our selection process, we require you to fill out a <strong>Personal Detail Form</strong> before your interview.
        Please click the button below to complete the form:
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${formUrl}" style="background:linear-gradient(135deg,#c9941a,#8b6914);color:#fff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:16px;font-weight:bold;display:inline-block;">
          Fill Personal Detail Form
        </a>
      </div>
      <div style="background:#fff8e1;border-left:4px solid #d4a017;padding:16px;margin:24px 0;border-radius:4px;">
        <p style="margin:0 0 6px;color:#7a5c00;font-size:13px;"><strong>⚠ Important:</strong></p>
        <p style="margin:0;color:#7a5c00;font-size:13px;">This link is valid until <strong>${expiryStr}</strong>. Please complete the form before the link expires.</p>
      </div>
      <p style="color:#555;line-height:1.7;">If the button does not work, copy and paste this link in your browser:</p>
      <p style="background:#f5f5f5;padding:10px;border-radius:4px;font-size:12px;word-break:break-all;color:#333;">${formUrl}</p>
      <p style="color:#555;margin-top:24px;">Warm regards,<br><strong>HR Team</strong><br>Patrika Group</p>
    </div>
    <div style="background:#f5f5f5;padding:12px;text-align:center;">
      <p style="font-size:11px;color:#999;margin:0;">This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>`;
}
