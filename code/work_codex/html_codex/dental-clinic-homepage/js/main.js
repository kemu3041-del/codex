const revealItems = document.querySelectorAll('[data-reveal]');

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.16 });

revealItems.forEach((item) => observer.observe(item));

document.querySelectorAll('.faq-list details').forEach((detail) => {
  detail.addEventListener('toggle', () => {
    if (!detail.open) return;
    document.querySelectorAll('.faq-list details').forEach((item) => {
      if (item !== detail) item.open = false;
    });
  });
});

const menuTrigger = document.querySelector('.menu-trigger');
const menuOverlay = document.querySelector('.menu-overlay');
const menuClose = document.querySelector('.menu-close');

const setMenuState = (isOpen) => {
  if (!menuTrigger || !menuOverlay) return;
  menuOverlay.classList.toggle('is-open', isOpen);
  menuTrigger.classList.toggle('is-active', isOpen);
  menuOverlay.setAttribute('aria-hidden', String(!isOpen));
  menuTrigger.setAttribute('aria-expanded', String(isOpen));
};

menuTrigger?.addEventListener('click', () => {
  setMenuState(!menuOverlay?.classList.contains('is-open'));
});

menuClose?.addEventListener('click', () => setMenuState(false));

menuOverlay?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setMenuState(false));
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setMenuState(false);
});

const specialtyTrack = document.querySelector('.specialty-track');
const specialtyCards = [...document.querySelectorAll('.specialty-card')];
let activeCardIndex = Math.max(0, specialtyCards.findIndex((card) => card.classList.contains('active')));

const setActiveCard = (nextIndex) => {
  if (!specialtyCards.length) return;
  activeCardIndex = (nextIndex + specialtyCards.length) % specialtyCards.length;
  specialtyCards.forEach((card, index) => {
    card.classList.toggle('active', index === activeCardIndex);
  });
  specialtyCards[activeCardIndex].scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'center',
  });
};

document.querySelectorAll('[data-card-shift]').forEach((button) => {
  button.addEventListener('click', () => {
    setActiveCard(activeCardIndex + Number(button.dataset.cardShift || 0));
  });
});

specialtyTrack?.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  const card = event.target.closest('.specialty-card');
  if (!card) return;
  setActiveCard(specialtyCards.indexOf(card));
});

document.querySelector('.contact-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
});
