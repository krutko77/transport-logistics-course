# Состояние проекта

**Последнее обновление:** 2026-09-19

## Где мы сейчас
Проект «Тест по курсу «Транспортная логистика»» задеплоен и работает на
`https://test-logistics.es-trans.ru/` (передеплоен в этой сессии,
`firstRun: false`). Синхронизирован с GitHub-репозиторием
`https://github.com/krutko77/transport-logistics-course.git` (ветка `main`,
полностью запушен — `origin/main` совпадает с локальным HEAD).

**Доставка писем через UniSender Go подтверждена рабочей.** Домен ссылок
(tracking domain) `unisender.es-trans.pro` активировался, пользователь лично
получил тестовое письмо на `kpv@es-trans.pro`. Блокер `code 229` из прошлых
сессий снят.

### Инцидент с утечкой ключа Resend (решён в этой сессии)
При попытке `git push` GitHub push protection заблокировал отправку:
в `docs/state.md` и `docs/last-session.md` двух локальных коммитов
(`064f7b4`, `0bd0ec5`) в открытом виде лежал реальный API-ключ Resend
(использовался ранее в `es-trans_test_standard_MOO`).
Ключ признан скомпрометированным:
1. Пользователь отозвал ключ в личном кабинете resend.com.
2. Я переписал историю (`git reset --soft` до общего предка, слил два
   коммита в один, убрал значение ключа из текста) и запушил чистую
   историю — коммит `36ab5f1`.

**Вывод на будущее:** реальные секреты (ключи API, пароли) нельзя вставлять
в текст `docs/*.md` даже как «историческую справку» — GitHub считает это
утечкой независимо от намерения, и это правило (см. CLAUDE.md, «ключи
никогда не попадают в код и в git») распространяется и на markdown-описания,
не только на `.env`.

## Перенос UniSender Go на два других теста ЕС Транс — частично сделан
По просьбе пользователя тот же паттерн (fetch на
`{UNISENDER_GO_API_URL}/ru/transactional/api/v1/email/send.json`,
apiKey/user_id в теле JSON, общий ключ аккаунта `user_id=8343054`) перенесён
из `src/services/mailer.js` в:
- `/home/my_workspace/es-trans_test_standard_MOO/src/services/mailer.js`
- `/home/my_workspace/es-trans_test_GFD_MOO/src/services/mailer.js`

В обоих: убран `nodemailer`/SMTP-транспорт (сама вёрстка `buildHtml` не
трогалась — там разные названия полей ответа, `questionId` вместо
`questionNumber`, это существующее расхождение, не ошибка). `.env` и
`.env.example` обновлены на `UNISENDER_GO_*`. `nodemailer` удалён из
`package.json` через `npm uninstall` в обоих проектах. В `es-trans_test_GFD_MOO`
(git-репозиторий) изменения закоммичены (`91925bc`), включая более старые
незакоммиченные правки чистки `CLAUDE.md`/`docs/test-app-template.md` из
прошлой сессии. `es-trans_test_standard_MOO` — не git-репозиторий, изменения
только на диске.

### Передеплой — заблокирован конфликтом доменов, не выполнен
```
es-trans_test_GFD_MOO      → .vibe-deploy.json: test-1.es-trans.ru
es-trans_test_standard_MOO → .vibe-deploy.json: test-2.es-trans.ru
```
`vibe-deploy-service` отклонил оба запроса:
- `test-1.es-trans.ru` уже занят проектом `krutko77::es-trans-test-OM`
- `test-2.es-trans.ru` уже занят проектом `krutko77::es-trans-standard`

Пользователь подтвердил: это, по всей видимости, **те же проекты**, но под
другим именем/слагом на портале — `es-trans_test_GFD_MOO` и
`es-trans_test_standard_MOO` в этой рабочей области, скорее всего, черновики
или более старые копии, а актуальные задеплоенные версии живут в папках
`es-trans-test-OM` и `es-trans-standard`, которых **нет в этом контейнере**
(`ls /home/my_workspace/` их не показывает).

**Решение — по согласованию с пользователем — на этом остановились.**
Перенос UniSender Go в реальные задеплоенные `es-trans-test-OM` /
`es-trans-standard` не выполнен: нет доступа к их файлам из этой сессии.

## Следующие шаги
1. **Выяснить, где физически лежат `es-trans-test-OM` и `es-trans-standard`**
   (другой контейнер/сессия/путь) — без этого перенос UniSender Go в реально
   задеплоенные проекты невозможен из текущей рабочей области.
2. Как только доступ найден — перенести изменения `mailer.js` (уже готовый
   патч есть в `es-trans_test_GFD_MOO`/`es-trans_test_standard_MOO`, можно
   скопировать) и передеплоить эти два проекта.
3. Разобраться, актуальны ли вообще папки `es-trans_test_standard_MOO` и
   `es-trans_test_GFD_MOO` — если это устаревшие черновики, решить с
   пользователем, стоит ли их удалить или держать как есть.
4. Решить открытый вопрос: держать ли SMTP-код/зависимость (`nodemailer`)
   как fallback в `es-trans_test_transport_logistics`, или полностью убрать
   теперь, когда UniSender Go подтверждён рабочим — `.env` этого проекта
   всё ещё хранит неиспользуемые `SMTP_*` переменные, `.env.example`
   отсюда тоже не обновлён под UniSender Go (описывает только SMTP) —
   не обсуждалось явно с пользователем.
5. **Важно:** в `.env` `es-trans_test_transport_logistics` в открытом виде
   лежит реальный пароль от почтового ящика `test@es-trans.pro`
   (`SMTP_PASS`). Не в git, но такая утечка уже случалась на этом проекте
   раньше (см.
   `vscode-portal-doctor/docs/incident-transport-logistics-course-deploy-and-leaked-root-password.md`).
   Пользователь ранее просил пока не трогать.
