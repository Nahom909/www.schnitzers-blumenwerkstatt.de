document.getElementById('year').textContent = new Date().getFullYear();

// ---------- Mobile-Nav-Toggle ----------
const navToggle = document.getElementById('nav-toggle');
const mainNav = document.getElementById('main-nav');

navToggle.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
  navToggle.setAttribute('aria-label', isOpen ? 'Menü schließen' : 'Menü öffnen');
});

mainNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// ---------- Lightbox ----------
const lightbox = document.getElementById('lightbox');
const lightboxClose = document.getElementById('lightbox-close');

document.querySelectorAll('[data-lightbox]').forEach((item) => {
  item.addEventListener('click', () => {
    lightbox.hidden = false;
  });
});

function closeLightbox() {
  lightbox.hidden = true;
}

lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
});

// ---------- Kontaktformular ----------
const form = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (form.action.includes('YOUR_FORMSPREE_FORM_ID')) {
    formStatus.textContent = 'Das Kontaktformular ist noch nicht final eingerichtet. Bitte kontaktieren Sie uns in der Zwischenzeit per Instagram-DM.';
    formStatus.className = 'form-status error';
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  formStatus.textContent = 'Wird gesendet …';
  formStatus.className = 'form-status';

  try {
    const response = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
    });

    if (response.ok) {
      formStatus.textContent = 'Danke für Ihre Nachricht! Wir melden uns schnellstmöglich.';
      formStatus.className = 'form-status success';
      form.reset();
    } else {
      formStatus.textContent = 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut oder schreiben Sie uns per Instagram.';
      formStatus.className = 'form-status error';
    }
  } catch (error) {
    formStatus.textContent = 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut oder schreiben Sie uns per Instagram.';
    formStatus.className = 'form-status error';
  } finally {
    submitBtn.disabled = false;
  }
});
