const { gradeWithAI } = require('./groqGrader');
const { analyseCandidate, reportToGrade } = require('./talentAnalyst');

const STOPWORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
  'from','is','are','was','were','be','been','being','have','has','had','do',
  'does','did','will','would','could','should','may','might','shall','can',
  'this','that','these','those','it','its','we','our','you','your','they',
  'their','as','if','so','not','no','all','also','any','each','more','than',
  'into','about','through','during','before','after','above','below','between',
  'i','me','my','he','she','his','her','him','us','them','what','which','who',
  'how','when','where','why','while','within','without','across','along',
  'both','either','other','same','such','up','out','off','over','under','again'
]);

function tokenize(text) {
  if (!text) return new Set();
  return new Set(
    text.toLowerCase()
      .replace(/<[^>]+>/g, ' ')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOPWORDS.has(w))
  );
}

function keywordGrade(candidate, jdHtml) {
  const resumeText = [
    candidate.parsedRawText   || '',
    candidate.parsedSummary   || '',
    candidate.parsedSkills    || '',
    candidate.parsedCurrentRole || '',
    candidate.parsedTotalExperience || ''
  ].join(' ');

  if (!jdHtml || !resumeText.trim()) {
    return { grade: 'D', score: 0, matchedKeywords: [], reason: 'Insufficient data for evaluation.', source: 'keyword' };
  }

  const jdWords  = tokenize(jdHtml);
  const resWords = tokenize(resumeText);
  if (jdWords.size === 0) return { grade: 'D', score: 0, matchedKeywords: [], reason: 'No JD content to match against.', source: 'keyword' };

  const matched = [...jdWords].filter(w => resWords.has(w));
  const score = Math.min(100, Math.round((matched.length / jdWords.size) * 200));
  const grade = score >= 70 ? 'A' : score >= 45 ? 'B' : score >= 20 ? 'C' : 'D';
  const reason = `Keyword match: ${matched.length}/${jdWords.size} JD keywords found in resume (score: ${score}). Top matches: ${matched.slice(0,10).join(', ')}.`;

  return { grade, score, matchedKeywords: matched.slice(0, 20), reason, source: 'keyword' };
}

// Synchronous keyword-only (for backward compat)
exports.computeGrade = function(candidate, jdHtml) {
  const r = keywordGrade(candidate, jdHtml);
  return { grade: r.grade, score: r.score, matchedKeywords: r.matchedKeywords };
};

// Async: Talent Analyst evaluation first (5-dimension weighted rubric),
// then simple AI grader, then keyword fallback
exports.computeGradeAsync = async function(candidate, jdHtml, positionName) {
  // 1) Full Talent Analyst report (same parameters as the Talent Analyst tab)
  const report = await analyseCandidate(candidate, jdHtml, positionName || candidate.positionApplying || '');
  if (report && report.tier) {
    const g = reportToGrade(report);
    return {
      grade:           g.grade,
      score:           g.score,
      gradeReason:     g.gradeReason,
      gradeSource:     g.gradeSource,
      analystReport:   JSON.stringify(report),
      matchedKeywords: []
    };
  }

  // 2) Simple AI grader
  const aiResult = await gradeWithAI(candidate, jdHtml, positionName || candidate.positionApplying || '');
  if (aiResult) {
    return {
      grade:           aiResult.grade,
      score:           aiResult.score,
      gradeReason:     aiResult.reason,
      gradeSource:     'ai',
      analystReport:   null,
      matchedKeywords: []
    };
  }

  // 3) Keyword fallback
  const kw = keywordGrade(candidate, jdHtml);
  return {
    grade:           kw.grade,
    score:           kw.score,
    gradeReason:     kw.reason,
    gradeSource:     'keyword',
    analystReport:   null,
    matchedKeywords: kw.matchedKeywords
  };
};
