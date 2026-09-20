import { Router } from 'express';
import { writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { questions } from '../data/questions.js';
import { sendResultEmail } from '../services/mailer.js';

const router = Router();
const __dirname = dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = join(__dirname, '../../data/results');

if (!existsSync(RESULTS_DIR)) mkdirSync(RESULTS_DIR, { recursive: true });

const questionMap = new Map(questions.map(q => [q.id, q]));

router.post('/', async (req, res) => {
  try {
    const { name, position, answerTexts, questionIds, variantNum } = req.body;

    if (
      !name ||
      !Array.isArray(answerTexts) ||
      !Array.isArray(questionIds) ||
      answerTexts.length !== questionIds.length ||
      answerTexts.length === 0
    ) {
      return res.status(400).json({ error: 'Неверные данные' });
    }

    const selectedQuestions = questionIds.map(id => questionMap.get(id)).filter(Boolean);
    if (selectedQuestions.length !== answerTexts.length) {
      return res.status(400).json({ error: 'Неверные данные' });
    }

    const graded = selectedQuestions.map((q, i) => ({
      questionNumber: i + 1,
      questionId: q.id,
      questionText: q.text,
      selectedText: answerTexts[i] ?? '—',
      correctText: q.options[q.correct],
      isCorrect: answerTexts[i] === q.options[q.correct],
    }));

    const score = graded.filter(a => a.isCorrect).length;
    const result = {
      id: Date.now(),
      name,
      position: position || '',
      variantNum: variantNum || 1,
      score,
      total: selectedQuestions.length,
      answers: graded,
      submittedAt: new Date().toISOString(),
    };

    const filePath = join(RESULTS_DIR, `${result.id}.json`);
    await writeFile(filePath, JSON.stringify(result, null, 2), 'utf8');

    let emailSent = false;
    let emailError = null;
    if (process.env.MANAGER_EMAIL) {
      try {
        await sendResultEmail(result);
        emailSent = true;
      } catch (emailErr) {
        emailError = emailErr.message;
        console.error('Email не отправлен:', emailErr.message);
      }
    } else {
      emailError = 'MANAGER_EMAIL не задан';
    }

    res.json({ score, total: selectedQuestions.length, graded, emailSent, emailError });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

export default router;
