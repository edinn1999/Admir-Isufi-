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

  // Hero video: soft fade at the loop point, pause button, no autoplay with reduced motion
  const video = document.querySelector('.hero-video');
  const videoToggle = document.querySelector('.video-toggle');
  if (video && videoToggle) {
    let userPaused = false;
    const setPaused = (paused) => {
      videoToggle.setAttribute('aria-pressed', String(paused));
      videoToggle.setAttribute('aria-label', paused ? 'Video abspielen' : 'Video pausieren');
    };
    const play = () => video.play().then(() => setPaused(false)).catch(() => setPaused(true));

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      userPaused = true;
      video.removeAttribute('autoplay');
      video.pause();
      setPaused(true);
    } else {
      play();
    }

    videoToggle.addEventListener('click', () => {
      userPaused = !video.paused;
      if (userPaused) { video.pause(); setPaused(true); } else { play(); }
    });

    video.addEventListener('timeupdate', () => {
      if (!video.duration) return;
      if (video.duration - video.currentTime < 0.55) video.classList.add('is-fading');
      else if (video.currentTime > 0.1 && video.currentTime < 0.6) video.classList.remove('is-fading');
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        if (userPaused) return;
        if (entry.isIntersecting) play(); else video.pause();
      }).observe(video);
    }
  }

  // Section videos: pause while off screen, soft fade at the loop point
  document.querySelectorAll('.section-video').forEach((v) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { v.removeAttribute('autoplay'); v.pause(); return; }
    v.play().catch(() => {});
    v.addEventListener('timeupdate', () => {
      if (!v.duration) return;
      if (v.duration - v.currentTime < 0.5) v.classList.add('is-fading');
      else if (v.currentTime > 0.1 && v.currentTime < 0.6) v.classList.remove('is-fading');
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }).observe(v);
    }
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

  // Hero e-mail button: pick a service, then continue in the contact form
  const mailToggle = document.querySelector('.btn-mail');
  const picker = document.getElementById('service-picker');
  const setPicker = (open) => {
    mailToggle.setAttribute('aria-expanded', String(open));
    picker.hidden = !open;
  };
  mailToggle.addEventListener('click', () => setPicker(picker.hidden));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !picker.hidden) { setPicker(false); mailToggle.focus(); }
  });
  document.addEventListener('click', (e) => {
    if (!picker.hidden && !e.target.closest('.hero-mail')) setPicker(false);
  });
  picker.addEventListener('click', (e) => {
    const pick = e.target.closest('.pick');
    if (!pick) return;
    setPicker(false);
    fields.service.value = pick.dataset.pick;
    status.classList.remove('is-error');
    status.textContent = `Leistung „${pick.dataset.pick}“ ausgewählt. Ergänzen Sie Ihre Daten und tippen Sie auf „Per E-Mail senden“.`;
    document.getElementById('kontakt').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    fields.name.focus({ preventScroll: true });
  });

  // Google Maps loads only after the visitor agrees (DSGVO)
  const map = document.querySelector('.map');
  document.getElementById('map-load')?.addEventListener('click', () => {
    const frame = document.createElement('iframe');
    frame.src = map.dataset.src;
    frame.title = 'Karte: Im Breinfeld 12, 4531 Neuhofen an der Krems';
    frame.loading = 'lazy';
    frame.referrerPolicy = 'no-referrer-when-downgrade';
    map.replaceChildren(frame);
  });

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
