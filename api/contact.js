'use strict';
// POST /api/contact — emails the "Get in Touch" form to CONTACT_TO (jishiya@gmail.com)
// using the Gmail SMTP credentials from the environment (.env locally, Vercel env vars in production).
const nodemailer = require('nodemailer');

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clean = (v, max) => String(v == null ? '' : v).replace(/[\r\n]+/g, ' ').trim().slice(0, max);

// Light in-memory rate limit (per warm instance): 5 messages / 10 min per IP.
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 5;
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  // Honeypot: bots fill the hidden field. Pretend success.
  if (body.website) return res.end(JSON.stringify({ ok: true }));

  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').toString().split(',')[0].trim();
  if (limited(ip)) {
    res.statusCode = 429;
    return res.end(JSON.stringify({ error: 'Too many messages. Please try again later.' }));
  }

  const name = clean(body.name, 100);
  const email = clean(body.email, 150);
  const phone = clean(body.phone, 30);
  const subject = clean(body.subject, 150);
  const message = String(body.message || '').trim().slice(0, 3000);

  if (!name || !message || !/^\S+@\S+\.\S+$/.test(email)) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'Please provide your name, a valid email and a message.' }));
  }

  const user = process.env.EMAIL_HOST_USER;
  const pass = process.env.EMAIL_HOST_PASSWORD;
  if (!user || !pass) {
    console.error('[contact] EMAIL_HOST_USER / EMAIL_HOST_PASSWORD not set');
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: 'Mail service is not configured.' }));
  }

  const port = Number(process.env.EMAIL_PORT) || 587;
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from: `"Jishya Website" <${user}>`,
      to: process.env.CONTACT_TO || 'jishiya@gmail.com',
      replyTo: `"${name.replace(/"/g, '')}" <${email}>`,
      subject: `[Website] ${subject || 'New enquiry'} — ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || '-'}\nSubject: ${subject || '-'}\n\n${message}`,
      html:
        `<h2>New message from jishya.com</h2>` +
        `<p><b>Name:</b> ${esc(name)}<br><b>Email:</b> ${esc(email)}<br><b>Phone:</b> ${esc(phone || '-')}<br>` +
        `<b>Subject:</b> ${esc(subject || '-')}</p><p>${esc(message).replace(/\n/g, '<br>')}</p>`,
    });
    return res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    console.error('[contact] send failed:', err.message);
    res.statusCode = 502;
    return res.end(JSON.stringify({ error: 'Could not send your message right now. Please email info@jishya.com.' }));
  }
};
