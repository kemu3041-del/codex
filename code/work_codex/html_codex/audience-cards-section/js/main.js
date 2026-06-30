(function () {
  const section = document.querySelector(".audience-section");
  const cards = Array.from(document.querySelectorAll(".audience-card"));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!section || cards.length === 0) {
    return;
  }

  if (reduceMotion) {
    cards.forEach((card) => card.classList.add("is-visible"));
    return;
  }

  cards.forEach((card, index) => {
    window.setTimeout(() => {
      card.classList.add("is-visible");
    }, 80 + index * 90);
  });

  section.addEventListener("pointermove", (event) => {
    const rect = section.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    section.style.setProperty("--mx", `${x.toFixed(2)}%`);
    section.style.setProperty("--my", `${y.toFixed(2)}%`);
  });
})();
