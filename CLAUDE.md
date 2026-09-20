# Тест по курсу "Транспортная логистика" — инструкции для Клода

---

## КЛОДУ: Прочитай это первым делом

**Язык рассуждений:** все рассуждения и весь текст, адресованный сотруднику (в чате, в комментариях, в коммитах), веди на русском языке.

Онбординг проекта пройден (см. `.onboarding-done` в корне) — читай раздел
"О ПРОЕКТЕ" и работай в рамках проекта.

**В начале новой сессии:** прочитай только `docs/state.md`, чтобы понять
текущее состояние проекта. Не открывай `docs/last-session.md` и
`docs/handoff.md` автоматически — это экономит контекст. Открывай их
только если: (а) сотрудник явно просит подробности о прошлой сессии,
(б) `state.md` не даёт достаточно контекста для текущей задачи, либо
(в) сессию явно передают другому исполнителю.

**Два режима работы:**
- **Чат** (сотрудник пишет тебе вопросы) — отвечай, объясняй, запускай команды сам через агента.
- **Задача из Kanban** (тебе прилетает задача без диалога) — читай CLAUDE.md, выполняй задачу автономно, без лишних вопросов. Если чего-то не хватает для выполнения — сообщи об этом в конце, не останавливайся на середине.

---

## О ПРОЕКТЕ

> *Этот раздел заполняется автоматически после онбординга. До онбординга — не трогать.*

**Название:** Тест по курсу "Транспортная логистика"
**Описание:** Тест для менеджера операционного отдела ЕС Транс по ГФД. Сотрудник проходит тест по ссылке, результаты сохраняются и отправляются руководителю на почту.
**Размещение:** свой сервер (деплой через `vibe-deploy-service`)
**Где открывается:** отдельная страница в браузере
**Бэкенд:** Node.js (Express) — для сохранения результатов и отправки email через UniSender Go
**Дизайн:** корпоративный стиль ЕС Транс (белый фон, красный акцент, тёмный текст)
**Авторизация:** не нужна — приложение открыто по ссылке

**Специфика проекта** (заполняется по ходу работы):
- SERVER_ID: не определён
- App URL: не определён
- Email руководителя: `MANAGER_EMAIL=kpv@es-trans.pro` (заполнить в `.env`)
- UniSender Go: заполнить `UNISENDER_GO_API_KEY`, `UNISENDER_GO_USER_ID`,
  `UNISENDER_GO_API_URL`, `UNISENDER_GO_FROM` в `.env`

---

## СТЕК И ИНСТРУМЕНТЫ

- **Node.js 20** + ES modules (`"type": "module"` в package.json)
- **Express 4** — веб-сервер
- **Vanilla JS + CSS** — фронтенд без фреймворков (меньше зависимостей → быстрый деплой)
- **UniSender Go** — отправка email (HTTP API)

```json
{
  "type": "module",
  "scripts": {
    "start": "node src/server.js",
    "dev": "node --watch src/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "dotenv": "^16.0.0"
  }
}
```

---

## КЛЮЧИ И БЕЗОПАСНОСТЬ

**Правило №1: Ключи никогда не попадают в код и в git.**

Все ключи хранятся в файле `.env`. Этот файл есть в `.gitignore`.
В git попадает только `.env.example` — шаблон без реальных значений.
Актуальный набор переменных — см. раздел ".env шаблон" ниже.

**Правило №2: При подозрении на утечку ключа — сразу отозвать** в личном кабинете UniSender и создать новый. Обновить `.env` на сервере.

---

## КОМАНДЫ

```bash
npm install        # установить зависимости (первый раз)
npm run dev        # запустить локально с авто-перезагрузкой
npm start          # запустить в продакшн-режиме
```

---

## ПАТТЕРНЫ РАЗРАБОТКИ

- CSS custom properties (`--var`) для цветов и отступов — легко менять тему
- Деплой — только через `vibe-deploy-service` (см. раздел ниже), никогда по SSH

---

## Реализация теста

> Почта отправляется через **UniSender Go** (российский сервис, HTTP Web
> API) — выбран из-за юридических рисков по 152-ФЗ/242-ФЗ при передаче ПДн
> сотрудников за рубеж и блокировки прямого SMTP на хостинге. См.
> `docs/decisions.md`.

---

## Структура файлов

```
project/
├── src/
│   ├── server.js               ← точка входа Express
│   ├── data/
│   │   └── questions.js        ← банк вопросов (export const questions = [...])
│   ├── routes/
│   │   └── results.js          ← POST /api/results
│   ├── services/
│   │   └── mailer.js           ← отправка email через UniSender Go
│   └── public/
│       ├── index.html
│       ├── css/style.css
│       └── js/test.js          ← вся логика теста на фронтенде
├── .env                        ← секреты (не в git)
└── .env.example
```

---

## Банк вопросов

### Формат одного вопроса

```js
// src/data/questions.js
export const questions = [
  {
    id: 1,
    section: 'Название раздела',
    text: 'Текст вопроса?',
    options: [
      'Вариант А',  // индекс 0
      'Вариант Б',  // индекс 1
      'Вариант В',  // индекс 2
      'Вариант Г',  // индекс 3
    ],
    correct: 0,     // индекс правильного ответа
  },
];
```

### Правило распределения правильных ответов

Правильные ответы должны равномерно распределяться по позициям А, Б, В, Г.
При 15 вопросах — примерно по 3–4 на каждую позицию.

Пример распределения для 15 вопросов (А=4, Б=4, В=4, Г=3):
```
correct: 0  // А
correct: 1  // Б
correct: 2  // В
correct: 3  // Г
```

**Запрещено:** все правильные ответы в одной позиции (например, все Б).

---

## Система вариантов (фронтенд)

### Вариант 1: разные наборы вопросов (если вопросов больше чем в тесте)

Используется когда банк вопросов больше числа вопросов в одном тесте.
Например: 25 вопросов в банке, 15 в каждом варианте.

```js
// В каждом варианте ОБЯЗАТЕЛЬНО должны быть ключевые вопросы
// (например, вопросы по замыслу/продукту/метрике должности)
const VARIANTS = [
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 19],
  [1, 2, 5, 7, 8, 10, 11, 12, 13, 18, 20, 21, 22, 23, 25],
  [1, 2, 5, 6, 7, 9, 11, 12, 14, 15, 17, 19, 20, 21, 23],
  [1, 2, 4, 5, 8, 9, 10, 13, 14, 18, 19, 20, 21, 22, 25],
  [1, 2, 5, 8, 9, 12, 13, 15, 17, 18, 19, 21, 22, 23, 25],
];

function buildVariantQuestions() {
  const ids = new Set(VARIANTS[getVariantIndex()]);
  return ALL_QUESTIONS.filter(q => ids.has(q.id));
}
```

### Вариант 2: разный порядок одинаковых вопросов (если вопросов ровно столько)

Используется когда все вопросы должны быть в каждом тесте.

```js
const VARIANTS = [
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  [6, 5, 11, 12, 7, 8, 1, 4, 15, 9, 14, 2, 3, 10, 13],
  [10, 13, 4, 15, 2, 3, 9, 14, 1, 11, 12, 6, 5, 7, 8],
  [7, 8, 9, 14, 5, 6, 10, 13, 11, 12, 2, 3, 4, 15, 1],
  [11, 4, 15, 13, 10, 7, 8, 2, 3, 9, 14, 1, 6, 5, 12],
];

function buildVariantQuestions() {
  const ids = VARIANTS[getVariantIndex()];
  const map = Object.fromEntries(ALL_QUESTIONS.map(q => [q.id, q]));
  return ids.map(id => map[id]);
}
```

### Общий код управления вариантами

```js
const STORAGE_KEY = 'project_variant'; // уникальный ключ для проекта

function getVariantIndex() {
  return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10) % VARIANTS.length;
}

function advanceVariant() {
  const next = (getVariantIndex() + 1) % VARIANTS.length;
  localStorage.setItem(STORAGE_KEY, String(next));
}
```

### Когда вызывать advanceVariant()

```js
// При нажатии "Начать тест" — ДО перехода к вопросам
btn.addEventListener('click', () => {
  state.name = input.value.trim();
  state.position = posInput.value.trim();
  state.questions = buildVariantQuestions(); // сначала берём вопросы
  advanceVariant();                          // потом сдвигаем для следующей попытки
  state.screen = 'question';
  state.current = 0;
  state.answers = [];
  render();
});
```

---

## Стартовый экран

Обязательные поля:
- **Имя и фамилия** — минимум 2 символа
- **Должность** — минимум 2 символа
- Кнопка "Начать тест" заблокирована пока оба поля не заполнены

```js
const checkReady = () => {
  btn.disabled = input.value.trim().length < 2 || posInput.value.trim().length < 2;
};
input.addEventListener('input', checkReady);
posInput.addEventListener('input', checkReady);
```

---

## Маршрут результатов (бэкенд)

```js
// src/routes/results.js
import express from 'express';
import { questions } from '../data/questions.js';
import { sendResultEmail } from '../services/mailer.js';

const router = express.Router();

router.post('/api/results', async (req, res) => {
  const { name, position, answers, questionIds, variantNum } = req.body;

  // Восстанавливаем вопросы по ID из запроса
  const qMap = Object.fromEntries(questions.map(q => [q.id, q]));
  const selectedQuestions = questionIds.map(id => qMap[id]).filter(Boolean);

  const graded = selectedQuestions.map((q, i) => ({
    questionId: q.id,
    questionText: q.text,
    selectedIndex: answers[i],
    selectedText: q.options[answers[i]] ?? '—',
    correctIndex: q.correct,
    correctText: q.options[q.correct],
    isCorrect: answers[i] === q.correct,
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

  await sendResultEmail(result);
  res.json({ ok: true });
});

export default router;
```

---

## Email-сервис (UniSender Go)

```js
// src/services/mailer.js
function buildHtml(result) {
  const { name, position, score, total, answers, submittedAt } = result;
  const percent = Math.round((score / total) * 100);

  const answersHtml = answers.map(a => `
    <tr style="background:${a.isCorrect ? '#f0fdf4' : '#fef2f2'}">
      <td style="padding:8px;border:1px solid #e5e7eb;color:#6b7280">${a.questionNumber}</td>
      <td style="padding:8px;border:1px solid #e5e7eb">${a.questionText}</td>
      <td style="padding:8px;border:1px solid #e5e7eb">${a.selectedText}</td>
      <td style="padding:8px;border:1px solid #e5e7eb;text-align:center">${a.isCorrect ? '✓' : '✗'}</td>
    </tr>`).join('');

  return {
    subject: `Тест [Название]: ${name} — ${score}/${total} (${percent}%)`,
    html: `
    <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto">
      <div style="background:#CC0000;padding:20px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:20px">Название компании — Результат тестирования</h1>
        <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:15px">Название теста</p>
      </div>
      <div style="padding:24px;background:#fff;border:1px solid #e5e7eb">
        <p style="margin:0 0 8px"><strong>Сотрудник:</strong> ${name}</p>
        <p style="margin:0 0 8px"><strong>Должность:</strong> ${position || '—'}</p>
        <p style="margin:0 0 8px"><strong>Дата прохождения:</strong> ${new Date(submittedAt).toLocaleDateString('ru-RU')}</p>
        <p style="margin:0 0 20px"><strong>Результат:</strong>
          <span style="font-size:20px;font-weight:bold;color:${percent >= 70 ? '#16a34a' : '#dc2626'}">${score} из ${total} (${percent}%)</span>
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <thead>
            <tr style="background:#f3f4f6">
              <th style="padding:8px;border:1px solid #e5e7eb;width:40px">№</th>
              <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Вопрос</th>
              <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Ответ</th>
              <th style="padding:8px;border:1px solid #e5e7eb;width:50px">Итог</th>
            </tr>
          </thead>
          <tbody>${answersHtml}</tbody>
        </table>
      </div>
      <div style="padding:12px;background:#f9fafb;text-align:center;font-size:12px;color:#9ca3af">
        Название компании © ${new Date().getFullYear()}
      </div>
    </div>`,
  };
}

export async function sendResultEmail(result) {
  const { subject, html } = buildHtml(result);

  const response = await fetch(`${process.env.UNISENDER_GO_API_URL}/ru/transactional/api/v1/email/send.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-API-KEY': process.env.UNISENDER_GO_API_KEY,
    },
    body: JSON.stringify({
      message: {
        recipients: [{ email: process.env.MANAGER_EMAIL }],
        subject,
        from_email: process.env.UNISENDER_GO_FROM,
        from_name: 'Компания Тест',
        body: { html },
      },
    }),
  });

  const data = await response.json();
  if (!response.ok || data.status === 'error') {
    throw new Error(`UniSender Go: ${data.message || response.statusText}`);
  }
}
```

Ключ передаётся в заголовке **`X-API-KEY`**, не в теле JSON — подтверждено
эмпирически прямым curl-запросом к API 2026-09-20 (`apiKey` в теле давал
`code 101: API key is missing`, а `X-API-KEY` в заголовке — `status:
success`). `user_id` в запросе не требуется. Прежняя версия этого раздела
утверждала обратное («в теле JSON, не в заголовке») — этот вывод оказался
ошибочным (либо контракт API изменился) и стал причиной того, что письма
с результатами тестов переставали доходить до руководителя.

### Ключевые правила email

- Дата — только дата, без времени: `toLocaleDateString('ru-RU')` (не `toLocaleString`)
- В шапке — две строки: название компании + название теста
- В теле — всегда: Сотрудник, Должность, Дата, Результат, таблица с ответами
- Зелёный/красный цвет строк по результату (`#f0fdf4` / `#fef2f2`)

---

## .env шаблон

```
PORT=3000
NODE_ENV=production

# Email руководителя
MANAGER_EMAIL=manager@company.ru

# UniSender Go (go2.unisender.ru → Настройки → API)
UNISENDER_GO_API_KEY=...
UNISENDER_GO_USER_ID=...
UNISENDER_GO_API_URL=https://go2.unisender.ru
UNISENDER_GO_FROM=noreply@company.ru
```

### Получение UniSender Go API ключа

1. Зарегистрироваться на unisender.com → раздел Go.
2. Подтвердить домен отправки (DKIM) в личном кабинете.
3. Настроить хотя бы один рабочий домен ссылок (tracking domain) —
   без него API возвращает `code 229` и письма не отправляются.
4. Настройки → API → скопировать ключ и `user_id` в `.env`.

---

## Сервер (Express)

```js
// src/server.js
import express from 'express';
import resultsRouter from './routes/results.js';

const app = express();
app.use(express.json());
app.use(express.static('src/public'));
app.use(resultsRouter);

// SPA fallback — всегда отдаём index.html
app.get('*', (req, res) => {
  res.sendFile(new URL('../public/index.html', import.meta.url).pathname);
});

app.listen(process.env.PORT || 3000);
```

---

## Деплой — через `vibe-deploy-service`, не по SSH

Проект размещается на хосте портала и деплоится **только** через штатный
сервис платформы `vibe-deploy-service` — это часть инфраструктуры портала,
доступная изнутри контейнера студента, а не внешний сервер. **Прямой
SSH/scp-доступ с этого контейнера на публичный IP хоста заблокирован
намеренно** (анти-SSRF/анти-NAT-loopback защита) — если SSH таймаутит, это
ожидаемое поведение файрвола, а не повод искать пароль или другой порт.

Раньше в этом разделе был паттерн `scp + sshpass + pm2` с паролем сервера
в открытом виде — так делать нельзя: пароль в файле проекта считается
скомпрометированным секретом (см.
`vscode-portal-doctor/docs/incident-transport-logistics-course-deploy-and-leaked-root-password.md`
за разбором инцидента, к которому это привело). nginx и SSL
(certbot/Let's Encrypt) сервис тоже настраивает сам при первом деплое домена
— вручную их поднимать не требуется.

### Конфигурация деплоя

В корне проекта — файл `.vibe-deploy.json`:
```json
{
  "domain": "<slug>.es-trans.ru",
  "entry": "src/server.js"
}
```
Домен согласовывается с администратором портала при первом деплое.

### Как задеплоить (первый раз и при каждом обновлении кода)

Выполнить из этого же контейнера:
```bash
curl -X POST http://172.30.0.1:8191/deploy \
  -H "Content-Type: application/json" \
  -d '{"project": "<имя_папки_проекта>"}'
```
Сервис сам делает `rsync`, ставит зависимости (`npm install --omit=dev`),
запускает/перезапускает процесс через `pm2` и (при первом деплое домена)
выпускает сертификат Let's Encrypt. Полный контракт и разбор частых проблем
(DNS ещё не готов, прокси блокирует certbot, `pm2 --update-env` берёт не тот
`PORT`) — см. `vscode-portal-doctor/docs/template-claude-test-app.md`.

Никакого SSH/scp/пароля/IP сервера для деплоя не требуется.

---

## Чек-лист нового проекта

- [ ] `npm init` с `"type": "module"`
- [ ] Создать банк вопросов в `src/data/questions.js`
- [ ] Проверить распределение правильных ответов (А/Б/В/Г примерно поровну)
- [ ] Создать 5 вариантов в `test.js` (разные наборы или порядок)
- [ ] Убедиться что ключевые вопросы есть в каждом варианте
- [ ] Настроить поля стартового экрана: ФИО + Должность
- [ ] Настроить email: заголовок + подзаголовок + должность + дата (без времени)
- [ ] Заполнить `.env`: UNISENDER_GO_API_KEY, UNISENDER_GO_USER_ID, UNISENDER_GO_FROM, MANAGER_EMAIL, PORT
- [ ] Создать `.vibe-deploy.json` с доменом и `entry`
- [ ] Задеплоить через `vibe-deploy-service` (`curl -X POST http://172.30.0.1:8191/deploy ...`)
- [ ] Проверить: пройти тест → прийти письмо руководителю

---

## Частые ошибки

| Ошибка | Причина | Решение |
|--------|---------|---------|
| Email не приходит | SMTP заблокирован на VPS | Использовать UniSender Go (HTTP API), не SMTP |
| API возвращает `code 229` | Нет рабочего домена ссылок (tracking domain) в UniSender | Настроить и дождаться подтверждения хотя бы одного домена ссылок |
| Все правильные ответы — Б | Не проверили распределение | Пересмотреть `correct` в questions.js |
| Вариант не меняется при повторе | `advanceVariant()` не вызван | Вызвать при клике "Начать тест" |
| Время показывается в дате | Использован `toLocaleString()` | Заменить на `toLocaleDateString('ru-RU')` |
| Должность не попадает в письмо | Забыли передать `position` в fetch | Добавить `position: state.position` в тело запроса |
| SSH на порт 22/443 таймаутит, «сервер недоступен» | Анти-SSRF файрвол портала намеренно блокирует контейнеру доступ к публичному IP собственного хоста | Не обходить — деплоить через `vibe-deploy-service` |
| certbot/сайт не отвечает сразу после первого деплоя | DNS-запись ещё не распространилась | Подождать 10–30 минут, проверить `nslookup`, повторить деплой |
