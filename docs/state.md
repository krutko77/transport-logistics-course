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

## Перенос UniSender Go на два других теста ЕС Транс

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
`package.json` через `npm uninstall` в обоих проектах.

### Важное уточнение от пользователя: `es-trans_test_GFD_MOO` = `es-trans-test-OM`
Пользователь подтвердил: слаг `es-trans-test-OM` на портале — это тот же
проект, что и папка `es-trans_test_GFD_MOO`, просто переименованный локально.
Это объясняет, почему `vibe-deploy-service` ругался на "домен уже занят" —
домен `test-1.es-trans.ru` привязан на портале к старому имени `es-trans-test-OM`.

По этому уточнению в `es-trans_test_GFD_MOO` дополнительно проверено и
полностью убрано всё, что касалось Resend (не только код, но и
документация):
- `CLAUDE.md` — раздел "О ПРОЕКТЕ", структура файлов, раздел Email-сервиса,
  `.env`-шаблон, чек-лист, таблица частых ошибок — везде SMTP/Resend
  заменены на UniSender Go (предыдущая чистка в прошлой сессии довела дело
  только до SMTP, не до UniSender Go — теперь доведено).
- `docs/test-app-template.md` — был полной копией старого шаблона на Resend
  (зависимость `resend`, пример кода `new Resend(...)`, инструкция получения
  ключа на resend.com, `RESEND_API_KEY` в чек-листе) — переписан целиком по
  образцу актуального `CLAUDE.md` этого же (transport_logistics) проекта.
- `docs/handoff.md` — уточнено, что упоминание Resend/SMTP относится к дате
  снимка 2026-09-12, актуальный провайдер — UniSender Go.
- `docs/project-brief.md` оставлен как есть — это дневниковая запись
  онбординга 28.06.2026, явно датирована, переписывать историю смысла нет.
- Финальный `grep -rniI resend` по всему проекту (кроме `node_modules`/`.git`)
  чист — единственное совпадение это то самое поясняющее предложение в
  `handoff.md` про дату снимка.
- Закоммичено: `91925bc` (перенос UniSender Go + старые правки CLAUDE.md из
  прошлой сессии) и `3caacfb` (полная зачистка Resend из документации).

`es-trans_test_standard_MOO` — не git-репозиторий, изменения кода
(`mailer.js`, `.env`, `.env.example`, `package.json`) внесены только на диске,
не проверялись на такую же глубину чистки документации (там не поднимался
вопрос совпадения имени с портальным слагом `es-trans-standard`).

### Передеплой `es-trans_test_GFD_MOO` — всё ещё заблокирован, требует администратора
```bash
curl -X POST http://172.30.0.1:8191/deploy -d '{"project": "es-trans_test_GFD_MOO"}'
# → {"error":"domain test-1.es-trans.ru уже занят проектом krutko77::es-trans-test-OM"}

curl -X POST http://172.30.0.1:8191/deploy -d '{"project": "es-trans-test-OM"}'
# → {"error":"no such project: es-trans-test-OM"}
```
`vibe-deploy-service`, судя по всему, матчит проект по имени папки на диске,
а привязку домена к слагу `es-trans-test-OM` изменить нельзя, потому что
папки с таким именем физически не существует (переименована в
`es-trans_test_GFD_MOO`, но домен на портале остался привязан к старому
имени). Это тупик, который нельзя решить из контейнера — по решению
пользователя, откладывается как вопрос к администратору портала.

`es-trans_test_standard_MOO` деплою пока не подвергался — там аналогичный
конфликт ожидаем (`test-2.es-trans.ru` занят `es-trans-standard`), но не
перепроверялся в этой сессии.

## Следующие шаги
1. **Обратиться к администратору портала** с вопросом о привязке домена
   `test-1.es-trans.ru` к новому имени папки `es-trans_test_GFD_MOO` (старый
   слаг `es-trans-test-OM` устарел). Возможно, то же самое понадобится для
   `es-trans_test_standard_MOO` ↔ `es-trans-standard` (домен `test-2.es-trans.ru`).
2. После решения вопроса с доменом — задеплоить `es-trans_test_GFD_MOO`
   (`curl -X POST http://172.30.0.1:8191/deploy -d '{"project": "es-trans_test_GFD_MOO"}'`)
   и проверить реальную доставку письма.
3. Уточнить у пользователя, актуален ли такой же перенос имени для
   `es-trans_test_standard_MOO` (возможно, тоже переименован из
   `es-trans-standard`), и повторить ту же проверку документации на остатки
   Resend, если да.
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
