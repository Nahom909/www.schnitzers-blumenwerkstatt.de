/* Bewegung der Premium-Fassung (GSAP + ScrollTrigger + Lenis, lokal). Bei „Bewegung reduzieren“ bleibt alles statisch. */
(() => {
  const nav = document.getElementById("nav");
  const onScroll = () => nav.classList.toggle("scrolled", scrollY > 40);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
  if (!document.documentElement.classList.contains("motion") || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  const lenis = window.Lenis ? new Lenis({ lerp: 0.1 }) : null;
  if (lenis) {
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const id = a.getAttribute("href"); if (id.length < 2) { e.preventDefault(); lenis.scrollTo(0); return; }
      const el = document.querySelector(id); if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -90 }); }
    }));
  }

  // Hero: Zeilen steigen auf, Foto zoomt beim Laden heraus, beim Scrollen langsamer
  gsap.from(".hero h1 .line > span", { yPercent: 105, duration: 1.1, ease: "expo.out", stagger: 0.08, delay: 0.1 });
  gsap.from([".hero .lead", ".hero-ctas", ".hero-card"], { opacity: 0, y: 18, duration: 1, ease: "expo.out", stagger: 0.07, delay: 0.4, clearProps: "transform" });
  gsap.from("#heroMedia", { scale: 1.08, duration: 2.4, ease: "expo.out" });
  gsap.to("#heroMedia", { yPercent: 12, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  // Aussage: Wort für Wort aufhellen
  const say = document.getElementById("say");
  if (say) {
    say.innerHTML = say.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
    gsap.fromTo(say.querySelectorAll(".w"), { opacity: 0.16 }, { opacity: 1, stagger: 0.05, ease: "none", scrollTrigger: { trigger: say, start: "top 82%", end: "bottom 45%", scrub: 0.6 } });
  }

  // Leistungszeilen: blenden beim Durchscrollen auf
  document.querySelectorAll(".svc-row a").forEach((li) => gsap.fromTo(li, { opacity: 0.25 }, { opacity: 1, ease: "none", scrollTrigger: { trigger: li, start: "top 92%", end: "top 60%", scrub: 0.5 } }));

  // Werkstatt-Bildband: öffnet sich und zoomt heraus
  gsap.fromTo("#shopBand", { clipPath: "inset(8% 6% 8% 6% round 22px)" }, { clipPath: "inset(0% 0% 0% 0% round 22px)", ease: "none", scrollTrigger: { trigger: "#shopBand", start: "top 95%", end: "center 55%", scrub: 0.6 } });
  gsap.fromTo("#shopBand img", { scale: 1.18 }, { scale: 1, ease: "none", scrollTrigger: { trigger: "#shopBand", start: "top bottom", end: "bottom top", scrub: true } });

  // Transporter fährt ins Bild
  gsap.fromTo("#rentVan", { xPercent: -70, opacity: 0 }, { xPercent: 0, opacity: 1, ease: "power2.out", scrollTrigger: { trigger: "#rentStage", start: "top 85%", end: "center 55%", scrub: 0.8 } });

  // Zahlen zählen hoch
  document.querySelectorAll(".count").forEach((el) => {
    const to = +el.dataset.to || 0; if (!to) return;
    ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: () => {
      const o = { v: 0 }; gsap.to(o, { v: to, duration: 1.4, ease: "expo.out", onUpdate: () => { el.textContent = Math.round(o.v); } });
    } });
  });

  // Alles mit .rv: weich von unten einblenden
  ScrollTrigger.batch(".rv", { start: "top 88%", once: true, onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.06 }) });

  addEventListener("load", () => ScrollTrigger.refresh());
})();
