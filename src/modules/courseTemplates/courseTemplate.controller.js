const courseTemplateService = require('./courseTemplate.service');
const catchAsync = require('../../common/utils/catchAsync');
const { sendSuccess } = require('../../common/utils/response');
const { ValidationError } = require('../../common/utils/AppError');

function parseDocToCategories(text) {
  const rawLines = text.split(/\r?\n/);
  const categories = [];
  let currentCategory = null;
  let currentQuestion = "";

  const commitCurrentQuestion = () => {
    if (currentCategory && currentQuestion.trim()) {
      const q = currentQuestion.trim();
      if (!currentCategory.suggestions.includes(q)) {
        currentCategory.suggestions.push(q);
      }
      currentQuestion = "";
    }
  };

  const isDocumentTitle = (line, index) => {
    if (index > 4) return false;
    const lower = line.toLowerCase();
    return lower.includes('interview question bank') ||
           lower.includes('question bank') ||
           (lower.includes('interview') && lower.includes('questions') && !/^\d+[\.\)]/.test(line));
  };

  const isHeadingLine = (line, nextLine) => {
    const trimmed = line.trim();
    if (!trimmed) return false;

    // Explicit markdown heading
    if (/^#{1,4}\s+/.test(trimmed)) return true;
    if (/^\*\*.*\*\*$/.test(trimmed) && trimmed.length < 80) return true;

    // Pattern: "1. Interpersonal & Behavioral Questions" or "2. JavaScript Fundamentals"
    const numberedHeadingMatch = trimmed.match(/^\s*(\d+)[\.\)]\s+(.+)$/);
    if (numberedHeadingMatch) {
      const labelPart = numberedHeadingMatch[2].trim();

      // Question opener verbs: if it starts with these, it's definitely a question, NOT a heading!
      const questionVerbs = /^(tell\s+me|describe|explain|what|why|how|design|who|when|where|which|can\s+you|is\s+it|write|compare|given|suppose|look\s+for)\b/i;
      if (questionVerbs.test(labelPart)) {
        return false;
      }

      // If it ends with question mark, it's a question
      if (labelPart.endsWith('?') || labelPart.endsWith('？')) {
        return false;
      }

      // Distinct heading words
      const headingKeywords = /(questions|fundamentals|architecture|authentication|database|security|quality|docker|ci\/cd|system\s+design|scenarios|basics|advanced|concepts|interpersonal|behavioral|frontend|backend|framework|library)/i;
      if (headingKeywords.test(labelPart)) {
        return true;
      }

      // If next non-empty line starts with "1. " or "1) ", this is a section heading whose question list starts from 1
      if (nextLine && /^\s*1[\.\)]\s+/i.test(nextLine)) {
        return true;
      }

      // If short title-like text with no sentence-ending punctuation
      if (labelPart.length <= 50 && !labelPart.includes('?') && !labelPart.endsWith('.')) {
        return true;
      }
    }

    // Subheadings like "PostgreSQL / SQL" or "MongoDB"
    const subHeadingKeywords = /^(postgresql\s*\/\s*sql|mongodb|sql|react|node\.js|typescript|javascript|behavioral)$/i;
    if (subHeadingKeywords.test(trimmed)) {
      return true;
    }

    return false;
  };

  const getHeadingLabel = (line) => {
    return line
      .replace(/^#{1,4}\s+/, '')
      .replace(/^\s*\d+[\.\)]\s*/, '')
      .replace(/^\*\*|\*\*$/g, '')
      .replace(/^__|\__$/g, '')
      .replace(/:$/, '')
      .trim();
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) continue;

    // Find next non-empty line
    let nextLine = '';
    for (let j = i + 1; j < rawLines.length; j++) {
      if (rawLines[j].trim()) {
        nextLine = rawLines[j].trim();
        break;
      }
    }

    // Skip overarching document title (e.g. Together Initiatives Ltd. Question Bank)
    if (isDocumentTitle(line, i)) {
      continue;
    }

    // Section Heading detection
    if (isHeadingLine(line, nextLine)) {
      commitCurrentQuestion();
      const label = getHeadingLabel(line);
      if (label) {
        const existing = categories.find(c => c.label.toLowerCase() === label.toLowerCase());
        if (existing) {
          currentCategory = existing;
        } else {
          const id = label.toLowerCase().replace(/[^a-z0-9]/g, '') || `cat_${categories.length + 1}`;
          currentCategory = { id, label, suggestions: [] };
          categories.push(currentCategory);
        }
      }
      continue;
    }

    // Scenario questions (e.g. "Scenario 1 — Production API Failure")
    if (/^Scenario\s+\d+/i.test(line)) {
      commitCurrentQuestion();
      currentQuestion = line;
      continue;
    }

    // Numbered Question (e.g. "1. Tell me about...", "2. Tell me about...")
    // Each numbering is preserved as ONE complete question without splitting sentences
    const questionMatch = line.match(/^\s*(\d+)[\.\)]\s+(.+)$/);
    if (questionMatch) {
      commitCurrentQuestion();

      if (!currentCategory) {
        currentCategory = { id: 'general', label: 'Interpersonal & Behavioral Questions', suggestions: [] };
        categories.push(currentCategory);
      }

      currentQuestion = questionMatch[2].trim();
      continue;
    }

    // Bullet point questions ("- ...", "• ...", "* ...")
    if (/^[-*•–—]\s+/.test(line)) {
      commitCurrentQuestion();

      if (!currentCategory) {
        currentCategory = { id: 'general', label: 'Interpersonal & Behavioral Questions', suggestions: [] };
        categories.push(currentCategory);
      }

      currentQuestion = line.replace(/^[-*•–—]\s+/, '').trim();
      continue;
    }

    // Continuation lines: if line is wrapped across lines or has explanation notes, append to current question
    if (currentQuestion) {
      currentQuestion += " " + line;
    } else if (currentCategory) {
      currentQuestion = line;
    }
  }

  commitCurrentQuestion();

  return categories.filter(c => c.suggestions.length > 0);
}

const courseTemplateController = {
  getTemplate: catchAsync(async (req, res) => {
    const template = await courseTemplateService.getTemplate(req.params.course);
    return sendSuccess(res, { data: template });
  }),

  upsertTemplate: catchAsync(async (req, res) => {
    const template = await courseTemplateService.upsertTemplate(req.params.course, req.body, req.user);
    return sendSuccess(res, { data: template });
  }),

  importDoc: catchAsync(async (req, res) => {
    const { docUrl, content } = req.body;
    let text = content || '';

    if (docUrl) {
      const match = docUrl.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) {
        throw new ValidationError('Invalid Google Docs URL. Make sure it contains /document/d/<ID>');
      }
      const docId = match[1];
      const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;

      let response;
      try {
        response = await fetch(exportUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          redirect: 'follow',
        });
      } catch (err) {
        throw new ValidationError('Failed to reach Google Docs. Check your internet connection.');
      }

      if (!response.ok) {
        throw new ValidationError('Could not fetch Google Doc. Make sure access is set to "Anyone with the link can view".');
      }

      text = await response.text();

      if (text.trim().startsWith('<!DOCTYPE html>') || text.includes('accounts.google.com')) {
        throw new ValidationError('The document is private. Please set access to "Anyone with the link can view".');
      }
    }

    if (!text || !text.trim()) {
      throw new ValidationError('No document content found to import.');
    }

    const categories = parseDocToCategories(text);
    return sendSuccess(res, {
      data: {
        categories,
        totalCategories: categories.length,
        totalQuestions: categories.reduce((sum, c) => sum + c.suggestions.length, 0),
      },
    });
  }),
};

module.exports = courseTemplateController;
