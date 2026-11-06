/* Bewegung der Premium-Fassung (GSAP + ScrollTrigger + Lenis, lokal). Bei „Bewegung reduzieren“ bleibt alles statisch. */
(() => {
  const nav = document.getElementById("nav");
  const onScroll = () => nav.classList.toggle("scrolled", scrollY > 40);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // Menü schließen, sobald ein Eintrag gewählt wurde
  document.querySelectorAll(".menu a").forEach((a) => a.addEventListener("click", () => a.closest("details").removeAttribute("open")));

  const motion = document.documentElement.classList.contains("motion");
  const rv = [...document.querySelectorAll(".rv")];
  if (!motion || !window.gsap || !window.ScrollTrigger) { rv.forEach((el) => el.classList.add("in")); return; }
  gsap.registerPlugin(ScrollTrigger);
  const fine = matchMedia("(hover:hover) and (pointer:fine)").matches;

  // Weiches Scrollen nur mit Maus; auf Touch-Geräten scrollt das System selbst
  const lenis = window.Lenis && fine ? new Lenis({ lerp: 0.1 }) : null;
  if (lenis) {
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const id = a.getAttribute("href"); if (id.length < 2) { e.preventDefault(); lenis.scrollTo(0); return; }
      const el = document.querySelector(id); if (!el) return;
      e.preventDefault();
      // Fokus mitnehmen, damit Tastatur und Bildschirmleser im Ziel landen
      lenis.scrollTo(el, { offset: -90, onComplete: () => { const t = id === "#termin" ? document.getElementById("f-anliegen") : el; if (t === el && !el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1"); t.focus({ preventScroll: true }); } });
    }));
  }

  // Erster Bildschirm: Zeilen steigen aus der Maske, Foto zoomt beim Laden heraus und läuft beim Scrollen langsamer
  gsap.from(".hero h1 .line > span", { yPercent: 105, duration: 1.1, ease: "expo.out", stagger: 0.08, delay: 0.1 });
  gsap.from([".hero-kicker", ".hero .lead", ".hero .cta", ".quick", ".rail"], { opacity: 0, y: 18, duration: 1, ease: "expo.out", stagger: 0.07, delay: 0.35, clearProps: "transform,opacity" });
  gsap.from("#heroMedia", { scale: 1.07, duration: 2.4, ease: "expo.out" });
  gsap.to("#heroMedia", { yPercent: 10, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  // Leistungszeilen blenden beim Durchscrollen auf
  document.querySelectorAll(".index .idx-row").forEach((row) => gsap.fromTo(row, { opacity: fine ? 0.25 : 0.5 }, { opacity: 1, ease: "none", scrollTrigger: { trigger: row, start: fine ? "top 94%" : "top 100%", end: fine ? "top 66%" : "top 84%", scrub: 0.5 } }));

  // Bosch-Bildband öffnet sich (Desktop per clip-path, auf Touch nur per Skalierung)
  const band = document.getElementById("band");
  if (band) {
    if (fine) gsap.fromTo(band, { clipPath: "inset(7% 5% 7% 5% round 22px)" }, { clipPath: "inset(0% 0% 0% 0% round 22px)", ease: "none", scrollTrigger: { trigger: band, start: "top 95%", end: "center 58%", scrub: 0.6 } });
    else gsap.fromTo(band, { scale: 0.94 }, { scale: 1, ease: "none", scrollTrigger: { trigger: band, start: "top 95%", end: "center 60%", scrub: 0.6 } });
    gsap.fromTo(band.querySelector("img"), { scale: 1.08 }, { scale: 1, ease: "none", scrollTrigger: { trigger: band, start: "top bottom", end: "bottom top", scrub: true } });
  }

  // Mietpreise fallen schnell von oben auf den echten Preis
  const prices = [...document.querySelectorAll(".count-down")];
  if (prices.length) {
    prices.forEach((el) => { const to = +el.dataset.to || 0; el.dataset.from = String(Math.round((to * 2.2) / 10) * 10 - 1); el.textContent = el.dataset.from; });
    ScrollTrigger.create({ trigger: "#rates", start: "top 82%", once: true, onEnter: () => prices.forEach((el, i) => {
      const o = { v: +el.dataset.from };
      gsap.to(o, { v: +el.dataset.to, duration: 1.3, delay: i * 0.15, ease: "power2.out", onUpdate: () => { el.textContent = Math.round(o.v); } });
    }) });
  }

  // Alles mit .rv: weich von unten einblenden (Ablauf-Linien laufen über die Klasse .in ein)
  ScrollTrigger.batch(".rv", { start: "top 88%", once: true, onEnter: (els) => els.forEach((el) => el.classList.add("in")) });

  addEventListener("load", () => ScrollTrigger.refresh());
})();
