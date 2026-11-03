/* Bewegung der Premium-Fassung: Hoffoto wächst beim Scrollen auf volle Breite, Einblendungen,
   fallende Mietpreise. Ohne Bibliotheken; bei „Bewegung reduzieren“ bleibt alles statisch. */
(() => {
  const motion = document.documentElement.classList.contains("motion");

  // Hoffoto im ersten Bildschirm: von leicht eingerückt auf volle Breite (nur transform)
  const photo = document.getElementById("heroPhoto");
  if (motion && photo) {
    let ticking = false;
    const grow = () => {
      ticking = false;
      const r = photo.getBoundingClientRect(), p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight * 0.9)));
      photo.style.setProperty("--s", (0.95 + 0.05 * p).toFixed(4));
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(grow); } }, { passive: true });
    addEventListener("resize", grow);
    grow();
  }

  // Menü schließen, sobald ein Eintrag gewählt wurde
  document.querySelectorAll(".menu a").forEach((a) => a.addEventListener("click", () => a.closest("details").removeAttribute("open")));

  // Einblenden beim Hereinscrollen
  const rv = [...document.querySelectorAll(".rv")];
  if (!motion || !("IntersectionObserver" in window)) rv.forEach((el) => el.classList.add("in"));
  else {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    rv.forEach((el) => io.observe(el));
  }

  // Mietpreise fallen von oben auf den echten Preis
  const prices = [...document.querySelectorAll(".count-down")];
  if (motion && prices.length && "IntersectionObserver" in window) {
    prices.forEach((el) => { const to = +el.dataset.to || 0; el.dataset.from = String(Math.round((to * 2.2) / 10) * 10 - 1); el.textContent = el.dataset.from; });
    const run = () => prices.forEach((el, i) => {
      const to = +el.dataset.to, from = +el.dataset.from, dur = 1300, t0 = performance.now() + i * 150;
      const step = (now) => {
        const t = Math.min(1, Math.max(0, (now - t0) / dur)), e = 1 - Math.pow(1 - t, 2);
        el.textContent = String(Math.round(from + (to - from) * e));
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); run(); } }, { threshold: 0.5 });
    io.observe(document.querySelector(".rates"));
  }
})();
