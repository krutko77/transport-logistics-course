import { questions as ALL_QUESTIONS } from '/data/questions.js';

// 3 варианта по 25 вопросов — в каждом ровно по 5 вопросов из каждого
// из 5 блоков материалов курса (блок 1: id 1–10, блок 2: id 11–20,
// блок 3: id 21–27, блок 4: id 28–36, блок 5: id 37–45)
const VARIANTS = [
  [1, 2, 3, 4, 5, 11, 12, 13, 14, 15, 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 37, 38, 39, 40, 41],
  [4, 5, 6, 7, 8, 14, 15, 16, 17, 18, 23, 24, 25, 26, 27, 31, 32, 33, 34, 35, 40, 41, 42, 43, 44],
  [1, 7, 8, 9, 10, 11, 17, 18, 19, 20, 21, 22, 25, 26, 27, 28, 29, 34, 35, 36, 37, 38, 43, 44, 45],
];

const STORAGE_KEY = 'tlc_variant';
const ATTEMPT_KEY = 'tlc_last_attempt';
const PASSED_KEY = 'tlc_last_passed';
const COOLDOWN_MS = 8 * 60 * 60 * 1000;

function getCooldownUntil() {
  const last = parseInt(localStorage.getItem(ATTEMPT_KEY) || '0', 10);
  const passed = localStorage.getItem(PASSED_KEY) === 'true';
  if (!last || passed) return null;
  const until = last + COOLDOWN_MS;
  return Date.now() < until ? until : null;
}

function formatMoscowTime(ts) {
  return new Date(ts).toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getVariantIndex() {
  return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10) % VARIANTS.length;
}

function advanceVariant() {
  const next = (getVariantIndex() + 1) % VARIANTS.length;
  localStorage.setItem(STORAGE_KEY, String(next));
}

function buildVariantQuestions() {
  const ids = VARIANTS[getVariantIndex()];
  const map = Object.fromEntries(ALL_QUESTIONS.map(q => [q.id, q]));
  return ids.map(id => map[id]).filter(Boolean);
}

let state = {
  screen: 'start',
  name: '',
  position: '',
  current: 0,
  selected: null,
  answered: false,
  answers: [],
  questions: [],
  variantNum: 0,
};

const app = document.getElementById('app');

function render() {
  if (state.screen === 'start') renderStart();
  else if (state.screen === 'question') renderQuestion();
  else renderResult();
}

function renderStart() {
  const cooldownUntil = getCooldownUntil();
  app.innerHTML = `
    <div class="card">
      <h1 class="start-title">Тест по курсу «Транспортная логистика»</h1>
      <p class="start-desc">25 вопросов · все разделы курса · один правильный ответ на вопрос</p>
      <div class="form-group">
        <label for="name">Ваши имя и фамилия</label>
        <input id="name" type="text" placeholder="Иванов Иван" autocomplete="off" ${cooldownUntil ? 'disabled' : ''} />
      </div>
      <div class="form-group">
        <label for="position">Ваша должность</label>
        <input id="position" type="text" placeholder="Менеджер" autocomplete="off" ${cooldownUntil ? 'disabled' : ''} />
      </div>
      <button class="btn" id="startBtn" disabled>Начать тест</button>
      ${cooldownUntil ? `<p style="margin-top:16px;text-align:center;color:#dc2626;font-size:14px;line-height:1.5">Тест не пройден. Следующая попытка доступна:<br><strong>${formatMoscowTime(cooldownUntil)} (МСК)</strong></p>` : ''}
    </div>
  `;

  if (cooldownUntil) return;

  const input = document.getElementById('name');
  const posInput = document.getElementById('position');
  const btn = document.getElementById('startBtn');

  const checkReady = () => {
    btn.disabled = input.value.trim().length < 2 || posInput.value.trim().length < 2;
  };
  input.addEventListener('input', checkReady);
  posInput.addEventListener('input', checkReady);

  btn.addEventListener('click', () => {
    state.name = input.value.trim();
    state.position = posInput.value.trim();
    state.variantNum = getVariantIndex() + 1;
    state.questions = buildVariantQuestions();
    advanceVariant();
    state.screen = 'question';
    state.current = 0;
    state.answers = [];
    render();
  });
}

function renderQuestion() {
  const q = state.questions[state.current];
  const total = state.questions.length;
  const progress = Math.round((state.current / total) * 100);
  const labels = ['А', 'Б', 'В', 'Г'];

  const optionsHtml = q.options.map((opt, i) => {
    let cls = 'option';
    if (state.answered) {
      cls += ' disabled';
      if (i === state.selected) cls += i === q.correct ? ' correct' : ' wrong';
    } else if (i === state.selected) {
      cls += ' selected';
    }
    return `
      <div class="${cls}" data-index="${i}">
        <span class="option__marker">${labels[i]}</span>
        <span class="option__text">${opt}</span>
      </div>`;
  }).join('');

  const btnLabel = state.answered
    ? (state.current < total - 1 ? 'Следующий вопрос →' : 'Завершить тест')
    : 'Ответить';

  app.innerHTML = `
    <div class="card">
      <div class="progress-header">
        <span>Вопрос ${state.current + 1} из ${total}</span>
        <span>${progress}%</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
      <div class="section-tag">${q.section}</div>
      <p class="question-text">${q.text}</p>
      <div class="options">${optionsHtml}</div>
      <button class="btn btn-nav" id="actionBtn" ${state.selected === null ? 'disabled' : ''}>${btnLabel}</button>
    </div>
  `;

  document.querySelectorAll('.option:not(.disabled)').forEach(el => {
    el.addEventListener('click', () => {
      state.selected = Number(el.dataset.index);
      render();
    });
  });

  document.getElementById('actionBtn').addEventListener('click', () => {
    if (!state.answered) {
      state.answered = true;
      state.answers.push(state.selected);
      render();
    } else {
      state.current += 1;
      state.selected = null;
      state.answered = false;
      if (state.current >= total) {
        state.screen = 'result';
      }
      render();
    }
  });
}

async function renderResult() {
  const score = state.answers.reduce((acc, ans, i) => acc + (ans === state.questions[i].correct ? 1 : 0), 0);
  const total = state.questions.length;
  const percent = Math.round((score / total) * 100);
  const pass = percent === 100;

  localStorage.setItem(ATTEMPT_KEY, String(Date.now()));
  localStorage.setItem(PASSED_KEY, String(pass));

  const itemsHtml = state.questions.map((q, i) => {
    const ok = state.answers[i] === q.correct;
    return `
      <div class="result-item ${ok ? 'correct' : 'wrong'}">
        <div class="result-item__header">
          <span class="result-item__icon">${ok ? '✓' : '✗'}</span>
          <span class="result-item__q">${q.id}. ${q.text}</span>
        </div>
        ${!ok ? `<div class="result-item__answer">
          Ваш ответ: ${q.options[state.answers[i]]}<br>
          <span class="result-item__correct-label">Правильно: ${q.options[q.correct]}</span>
        </div>` : ''}
      </div>`;
  }).join('');

  app.innerHTML = `
    <div class="card">
      <div class="result-score">
        <div class="result-score__number ${pass ? 'pass' : 'fail'}">${score}/${total}</div>
        <div class="result-score__label">${pass ? 'Тест пройден!' : 'Тест не пройден'}</div>
        <div class="result-score__sub">${percent}% правильных ответов · необходимо 100%</div>
      </div>
      <div class="result-list">${itemsHtml}</div>
      <p class="sending-msg" id="sendingMsg">Отправляю результаты руководителю…</p>
      <button class="btn" id="retryBtn" style="display:none">Пройти ещё раз</button>
    </div>
  `;

  document.getElementById('retryBtn').addEventListener('click', () => {
    state = { screen: 'start', name: '', position: '', current: 0, selected: null, answered: false, answers: [], questions: [], variantNum: 0 };
    render();
  });

  try {
    await fetch('/api/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: state.name,
        position: state.position,
        answers: state.answers,
        questionIds: state.questions.map(q => q.id),
        variantNum: state.variantNum,
      }),
    });
    document.getElementById('sendingMsg').textContent = 'Результаты сохранены и отправлены руководителю.';
  } catch {
    document.getElementById('sendingMsg').textContent = 'Результаты сохранены.';
  }

  document.getElementById('retryBtn').style.display = 'block';
}

render();
