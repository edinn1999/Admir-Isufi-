(() => {
  'use strict';

  const PHONE = '436644284016';
  const EMAIL = 'admirisufi1@icloud.com';
  const DEFAULT_MESSAGE = 'Hallo, ich interessiere mich für Ihre Gartenpflege- und Entrümpelungsservices. Können Sie mir bitte weitere Informationen geben?';

  const waLink = (text) => `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`;

  // WhatsApp links: service cards get a message naming the service
  document.querySelectorAll('.js-wa').forEach((link) => {
    const service = link.dataset.service;
    link.href = waLink(service
      ? `Hallo, ich interessiere mich für Ihren Service „${service}“. Können Sie mir bitte weitere Informationen geben?`
      : DEFAULT_MESSAGE);
    link.target = '_blank';
    link.rel = 'noopener';
    if (service) link.setAttribute('aria-label', `${service} per WhatsApp anfragen`);
  });

  // Mobile navigation
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('site-nav');
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    nav.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });
  window.matchMedia('(min-width: 961px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  // Header shadow once the page scrolls
  const header = document.querySelector('.site-header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Highlight the nav item of the section in view
  const navLinks = [...document.querySelectorAll('.nav ul a')];
  const sections = navLinks.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => {
          const active = a.getAttribute('href') === `#${entry.target.id}`;
          a.classList.toggle('is-active', active);
          if (active) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => io.observe(s));
  }

  // Contact form → opens WhatsApp or the mail app with the request filled in
  const form = document.getElementById('contact-form');
  const status = form.querySelector('.form-status');
  const fields = {
    name: form.elements.name,
    phone: form.elements.phone,
    service: form.elements.service,
    message: form.elements.message,
  };
  const required = [fields.name, fields.phone];

  const validate = (input) => {
    const value = input.value.trim();
    const ok = input === fields.phone ? value.replace(/[^\d]/g, '').length >= 6 : value.length > 0;
    input.setAttribute('aria-invalid', String(!ok));
    document.getElementById(`${input.id}-err`).hidden = ok;
    return ok;
  };
  required.forEach((input) => {
    input.addEventListener('blur', () => { if (input.value) validate(input); });
    input.addEventListener('input', () => { if (input.getAttribute('aria-invalid') === 'true') validate(input); });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const invalid = required.filter((input) => !validate(input));
    if (invalid.length) {
      status.textContent = 'Bitte füllen Sie die markierten Felder aus.';
      status.classList.add('is-error');
      invalid[0].focus();
      return;
    }
    status.classList.remove('is-error');

    const lines = [
      'Hallo, ich habe eine Anfrage über Ihre Website:',
      '',
      `Name: ${fields.name.value.trim()}`,
      `Telefon: ${fields.phone.value.trim()}`,
    ];
    if (fields.service.value) lines.push(`Dienstleistung: ${fields.service.value}`);
    if (fields.message.value.trim()) lines.push('', fields.message.value.trim());
    const text = lines.join('\n');

    const channel = e.submitter?.dataset.channel || 'whatsapp';
    if (channel === 'email') {
      const subject = `Anfrage${fields.service.value ? `: ${fields.service.value}` : ''} – ${fields.name.value.trim()}`;
      window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
      status.textContent = 'Ihr E-Mail-Programm wird geöffnet. Bitte senden Sie die Nachricht dort ab.';
    } else {
      const win = window.open(waLink(text), '_blank', 'noopener');
      status.textContent = 'WhatsApp wird geöffnet. Bitte senden Sie die Nachricht dort ab. ';
      if (!win) {
        const fallback = document.createElement('a');
        fallback.href = waLink(text);
        fallback.target = '_blank';
        fallback.rel = 'noopener';
        fallback.textContent = 'Falls nichts passiert: hier tippen.';
        status.append(fallback);
      }
    }
  });

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
