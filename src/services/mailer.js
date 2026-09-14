import nodemailer from 'nodemailer';
import { Resend } from 'resend';

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
    subject: `Тест "Транспортная логистика": ${name} — ${score}/${total} (${percent}%)`,
    html: `
    <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto">
      <div style="background:#CC0000;padding:20px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:20px">ЕС Транс — Результат тестирования</h1>
        <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:15px">Тест по курсу "Транспортная логистика"</p>
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
        ЕС Транс © ${new Date().getFullYear()}
      </div>
    </div>`,
  };
}

export async function sendResultEmail(result) {
  const { subject, html } = buildHtml(result);

  // Resend (HTTP API) — работает даже если SMTP порты заблокированы
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM || 'ЕС Транс Тест <onboarding@resend.dev>',
      to: process.env.MANAGER_EMAIL,
      subject,
      html,
    });
    return;
  }

  // Fallback: SMTP через nodemailer
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"ЕС Транс Тест" <${process.env.SMTP_USER}>`,
    to: process.env.MANAGER_EMAIL,
    subject,
    html,
  });
}
