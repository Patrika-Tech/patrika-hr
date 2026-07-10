'use strict';
const axios   = require('axios');
const crypto  = require('crypto');
const { CandidateTest, Candidate } = require('../models');
const { sendEmail } = require('../utils/emailService');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ─── Generate test via Groq ────────────────────────────────────────────────────
async function generateTest(positionName) {
  const prompt = `You are an expert HR psychometric test designer for a media company.

Generate a unique Psychometric & Behavioral Assessment for the position: "${positionName}".

Return ONLY valid JSON matching this exact structure (no markdown, no explanation):
{
  "title": "Psychometric & Behavioral Assessment – ${positionName}",
  "duration": "15 Minutes",
  "totalMarks": 100,
  "sections": [
    {
      "name": "Section A – Situational Judgment",
      "marks": 30,
      "marksPerQ": 5,
      "type": "mcq",
      "questions": [
        {
          "q": "situational scenario question text",
          "options": {
            "A": "option A text (incorrect)",
            "B": "option B text (CORRECT – professional approach)",
            "C": "option C text (incorrect)",
            "D": "option D text (incorrect)"
          },
          "correct": "B"
        }
      ]
    },
    {
      "name": "Section B – Analytical Thinking & Problem Solving",
      "marks": 20,
      "marksPerQ": 5,
      "type": "mcq",
      "questions": [
        {
          "q": "analytical problem question",
          "options": {
            "A": "option A text (CORRECT – best approach)",
            "B": "option B text (incorrect)",
            "C": "option C text (incorrect)",
            "D": "option D text (incorrect)"
          },
          "correct": "A"
        }
      ]
    },
    {
      "name": "Section C – Communication & Stakeholder Management",
      "marks": 20,
      "marksPerQ": 5,
      "type": "mcq",
      "questions": [
        {
          "q": "communication scenario question",
          "options": {
            "A": "option A text (CORRECT – best approach)",
            "B": "option B text (incorrect)",
            "C": "option C text (incorrect)",
            "D": "option D text (incorrect)"
          },
          "correct": "A"
        }
      ]
    },
    {
      "name": "Section D – Behaviour & Work Style",
      "marks": 15,
      "marksPerQ": 5,
      "type": "mcq",
      "questions": [
        {
          "q": "behavioral/work style question",
          "options": {
            "A": "option A text (CORRECT – professional behavior)",
            "B": "option B text (incorrect)",
            "C": "option C text (incorrect)",
            "D": "option D text (incorrect)"
          },
          "correct": "A"
        }
      ]
    },
    {
      "name": "Section E – Personality Assessment",
      "marks": 15,
      "type": "rating",
      "note": "Rate yourself on a scale of 1–5 (1 = Strongly Disagree, 5 = Strongly Agree)",
      "questions": [
        { "q": "personality statement 1 relevant to ${positionName}" },
        { "q": "personality statement 2" },
        { "q": "personality statement 3" },
        { "q": "personality statement 4" },
        { "q": "personality statement 5" },
        { "q": "personality statement 6" }
      ]
    }
  ]
}

Rules:
- Section A must have exactly 6 questions, correct answer is always "B"
- Section B must have exactly 4 questions, correct answer is always "A"
- Section C must have exactly 4 questions, correct answer is always "A"
- Section D must have exactly 3 questions, correct answer is always "A"
- Section E must have exactly 6 rating statements
- All questions must be UNIQUE, fresh, and relevant to "${positionName}" in a media/news company
- Do not repeat questions from any known test
- Return ONLY the JSON object, nothing else`;

  const response = await axios.post(GROQ_API_URL, {
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.9,
    max_tokens: 4000
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    timeout: 60000
  });

  const raw = response.data.choices[0].message.content.trim();
  const jsonStr = raw.replace(/^```json\s*/,'').replace(/^```\s*/,'').replace(/\s*```$/,'');
  return JSON.parse(jsonStr);
}

// ─── Auto-mark submitted answers ──────────────────────────────────────────────
function markTest(testData, answers) {
  let score = 0;
  testData.sections.forEach(section => {
    if (section.type === 'mcq') {
      section.questions.forEach((q, qi) => {
        const key = `${section.name}_${qi}`;
        if (answers[key] === q.correct) score += section.marksPerQ;
      });
    } else if (section.type === 'rating') {
      // Section E: sum of ratings / 2 (max 30 → scaled to 15)
      section.questions.forEach((q, qi) => {
        const key = `${section.name}_${qi}`;
        const val = parseInt(answers[key]) || 0;
        score += Math.min(5, Math.max(0, val)) / 2;
      });
    }
  });
  return Math.round(score);
}

// ─── Send test to candidate ────────────────────────────────────────────────────
exports.sendTest = async (req, res) => {
  try {
    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    const positionName = candidate.positionApplying || 'Business Analyst';

    // Generate fresh test
    let testData;
    try {
      testData = await generateTest(positionName);
    } catch(e) {
      console.error('Test generation error:', e.message);
      return res.status(500).json({ error: 'Failed to generate test: ' + e.message });
    }

    // Unique token for the test link
    const token = crypto.randomBytes(24).toString('hex');

    const test = await CandidateTest.create({
      candidateId:  candidate.id,
      positionName,
      token,
      questions:    JSON.stringify(testData),
      status:       'pending',
      sentAt:       new Date()
    });

    // Send email with test link
    const testUrl = `${process.env.APP_URL || 'http://localhost:4000'}/test/${token}`;
    const emailSent = await sendEmail({
      to:      candidate.email,
      subject: `Action Required: ${positionName} Assessment – Patrika HR`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#1a1a2e;padding:24px;text-align:center;">
            <h2 style="color:#d4af37;margin:0;">Patrika HR</h2>
          </div>
          <div style="padding:24px;background:#fff;">
            <p>Dear <strong>${candidate.fullName}</strong>,</p>
            <p>Thank you for applying for the position of <strong>${positionName}</strong> at Patrika.</p>
            <p>As part of our selection process, you are required to complete a <strong>15-minute Psychometric & Behavioral Assessment</strong>.</p>
            <div style="background:#fffdf0;border-left:4px solid #d4af37;padding:16px;margin:20px 0;">
              <p style="margin:0 0 8px;"><strong>Test Details:</strong></p>
              <p style="margin:4px 0;">Duration: 15 Minutes</p>
              <p style="margin:4px 0;">Total Marks: 100</p>
              <p style="margin:4px 0;">Format: Multiple Choice + Personality Rating</p>
            </div>
            <p>Please click the button below to start your assessment:</p>
            <div style="text-align:center;margin:28px 0;">
              <a href="${testUrl}" style="background:#d4af37;color:#1a1a2e;padding:14px 32px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">Start Assessment</a>
            </div>
            <p style="color:#888;font-size:13px;">Or copy this link: <a href="${testUrl}">${testUrl}</a></p>
            <p style="color:#888;font-size:13px;">This link is unique to you. Please do not share it.</p>
          </div>
        </div>`
    }).catch(e => { console.warn('Email failed:', e.message); return false; });

    res.json({ success: true, testId: test.id, token, emailSent: !!emailSent });
  } catch(err) {
    console.error('sendTest error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Show test page (public) ───────────────────────────────────────────────────
exports.showTest = async (req, res) => {
  try {
    const test = await CandidateTest.findOne({ where: { token: req.params.token } });
    if (!test) return res.status(404).send('<h2>Test not found or link is invalid.</h2>');

    if (test.status === 'completed') {
      return res.render('test-done', {
        title: 'Test Already Submitted',
        message: 'You have already submitted this assessment. Thank you!'
      });
    }

    const testData = JSON.parse(test.questions);
    res.render('test', {
      title:    testData.title,
      testData,
      token:    test.token,
      candidate: await Candidate.findByPk(test.candidateId, { attributes: ['fullName'] })
    });
  } catch(err) {
    console.error('showTest error:', err);
    res.status(500).send('Server error: ' + err.message);
  }
};

// ─── Submit test (public) ──────────────────────────────────────────────────────
exports.submitTest = async (req, res) => {
  try {
    const test = await CandidateTest.findOne({ where: { token: req.params.token } });
    if (!test) return res.status(404).json({ error: 'Invalid test link' });
    if (test.status === 'completed') return res.status(400).json({ error: 'Already submitted' });

    const testData = JSON.parse(test.questions);
    const answers  = req.body; // flat key-value: "Section A_0" => "B"
    const score    = markTest(testData, answers);

    await test.update({
      answers:     JSON.stringify(answers),
      score,
      status:      'completed',
      submittedAt: new Date()
    });

    res.json({ success: true, score, maxScore: test.maxScore });
  } catch(err) {
    console.error('submitTest error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Admin: view test result ───────────────────────────────────────────────────
exports.viewResult = async (req, res) => {
  try {
    const test = await CandidateTest.findByPk(req.params.testId, {
      include: [{ model: Candidate, attributes: ['fullName', 'email', 'positionApplying'] }]
    });
    if (!test) return res.status(404).send('Test not found');

    const testData = JSON.parse(test.questions);
    const answers  = test.answers ? JSON.parse(test.answers) : {};

    res.render('admin/test-result', {
      title:       'Test Result',
      adminName:   req.session.adminName,
      adminRole:   req.session.adminRole,
      adminDepartment: req.session.adminDepartment,
      v: res.locals.v,
      test,
      testData,
      answers,
      candidate: test.Candidate
    });
  } catch(err) {
    console.error('viewResult error:', err);
    res.status(500).send('Server error: ' + err.message);
  }
};

// ─── Admin: list all tests for a candidate ────────────────────────────────────
exports.listTests = async (req, res) => {
  try {
    const tests = await CandidateTest.findAll({
      where: { candidateId: req.params.id },
      order: [['sentAt', 'DESC']]
    });
    res.json({ success: true, tests });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};
