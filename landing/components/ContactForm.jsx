'use client';

import { useState } from 'react';
import Reveal from './Reveal';

const PHONE = /^\+?[0-9][0-9\s().-]{5,28}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputCls =
  'w-full border border-ink bg-white px-4 py-3 text-base outline-none transition-colors placeholder:text-ink-soft/70 focus:border-accent focus:ring-1 focus:ring-accent';

function Field({ label, htmlFor, error, hint, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.14em] text-ink-mid">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="mt-1 text-xs font-medium text-accent">
          {error}
        </p>
      )}
    </div>
  );
}

/** "Ask us anything" form. Name + message required; email OR phone required. */
export default function ContactForm() {
  const [values, setValues] = useState({ name: '', email: '', phone: '', message: '', hp_confirm: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | sent
  const [serverError, setServerError] = useState('');

  const set = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: '', contact: field === 'email' || field === 'phone' ? '' : er.contact }));
  };

  function validate() {
    const er = {};
    const email = values.email.trim();
    const phone = values.phone.trim();
    if (!values.name.trim()) er.name = 'Please enter your name';
    if (!email && !phone) er.contact = 'Please enter an email address or a phone number (one is enough)';
    if (email && !EMAIL.test(email)) er.email = 'Please enter a valid email address';
    if (phone && !PHONE.test(phone)) er.phone = 'Please enter a valid phone number';
    if (!values.message.trim()) er.message = 'Please type your message or question';
    return er;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setServerError('');
    const er = validate();
    setErrors(er);
    if (Object.keys(er).length > 0) return;

    setStatus('sending');
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          message: values.message.trim(),
          hp_confirm: values.hp_confirm,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const detail = Array.isArray(data.details) && data.details[0] ? data.details[0].message : '';
        throw new Error(detail || data.error || 'Something went wrong. Please try again.');
      }
      setStatus('sent');
    } catch (err) {
      setServerError(err.message || 'Something went wrong. Please try again.');
      setStatus('idle');
    }
  }

  return (
    <section id="contact" aria-labelledby="contact-heading" className="border-b border-ink">
      <div className="wrap grid gap-8 py-12 md:grid-cols-[1fr_1.3fr] md:gap-14 md:py-16">
        <Reveal>
          <p className="mb-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[.14em] text-accent">
            <span aria-hidden="true" className="h-0.5 w-8 bg-accent" />
            Get in Touch
          </p>
          <h2 id="contact-heading" className="mb-4 font-serif text-3xl font-bold leading-tight md:text-4xl">
            Have a question? Ask us.
          </h2>
          <p className="max-w-md text-ink-mid">
            Send your question or message with your name and an email address or phone number, whichever you prefer.
            We&apos;ll get back to you personally.
          </p>
        </Reveal>

        <Reveal>
          {status === 'sent' ? (
            <div role="status" className="border border-ink bg-white p-8 text-center">
              <p className="mb-2 font-serif text-2xl font-bold">Thank you!</p>
              <p className="text-ink-mid">Your message has been received. We&apos;ll get back to you soon.</p>
              <button
                type="button"
                onClick={() => {
                  setValues({ name: '', email: '', phone: '', message: '', hp_confirm: '' });
                  setStatus('idle');
                }}
                className="mt-5 border-b border-ink text-[12px] font-semibold uppercase tracking-wider hover:border-accent hover:text-accent"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="space-y-5 border border-ink bg-white p-5 sm:p-7">
              {/* Honeypot: hidden from people, bots tend to fill it */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <input
                  type="text"
                  name="hp_confirm"
                  tabIndex={-1}
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  value={values.hp_confirm}
                  onChange={set('hp_confirm')}
                />
              </div>

              <Field label="Your name *" htmlFor="cf-name" error={errors.name}>
                <input
                  id="cf-name"
                  type="text"
                  autoComplete="name"
                  maxLength={100}
                  value={values.name}
                  onChange={set('name')}
                  aria-invalid={errors.name ? 'true' : 'false'}
                  className={inputCls}
                />
              </Field>

              <div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Email" htmlFor="cf-email" error={errors.email}>
                    <input
                      id="cf-email"
                      type="email"
                      autoComplete="email"
                      maxLength={255}
                      value={values.email}
                      onChange={set('email')}
                      aria-invalid={errors.email ? 'true' : 'false'}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Phone number" htmlFor="cf-phone" error={errors.phone}>
                    <input
                      id="cf-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      maxLength={30}
                      value={values.phone}
                      onChange={set('phone')}
                      aria-invalid={errors.phone ? 'true' : 'false'}
                      className={inputCls}
                    />
                  </Field>
                </div>
                {errors.contact ? (
                  <p role="alert" className="mt-2 text-xs font-medium text-accent">
                    {errors.contact}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-ink-soft">* Provide an email <b>or</b> a phone number — at least one is required.</p>
                )}
              </div>

              <Field label="Message / question *" htmlFor="cf-message" error={errors.message}>
                <textarea
                  id="cf-message"
                  rows={5}
                  maxLength={2000}
                  value={values.message}
                  onChange={set('message')}
                  aria-invalid={errors.message ? 'true' : 'false'}
                  className={inputCls}
                />
              </Field>

              {serverError && (
                <p role="alert" className="border border-accent bg-accent/5 px-4 py-3 text-sm text-accent">
                  {serverError}
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="inline-block border-[1.5px] border-accent bg-accent px-7 py-3.5 text-[13px] font-semibold uppercase tracking-wider text-white transition-colors hover:border-ink hover:bg-ink disabled:opacity-60"
              >
                {status === 'sending' ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
