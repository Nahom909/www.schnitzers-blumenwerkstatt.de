// Premium-Fassung: node build.mjs premium  →  dist-premium/
// Schwarz wie die erste Premium-Fassung (die der Kunde mochte), aufgewertet: nummerierte Abschnitte, Leistungen als Index,
// echte Fotos je einmal, Bosch-Car-Service-Block, Ablauf, Kontaktformular statt Kalender.
// Inhalte aus content/seite.json, Formular aus src/app.js, Bewegung aus src/premium-motion.js (GSAP + Lenis lokal).
const QUICK = [
  { t: "Inspektion & Wartung", icon: "wrench" },
  { t: "Reifen & Räder", icon: "tire" },
  { t: "HU / AU", icon: "seal-check" },
  { t: "Transporter mieten", icon: "van", href: "#vermietung", preis: true },
];
const ICON = { inspektion: "wrench", diagnose: "gauge", hu: "seal-check", reifen: "tire", flotte: "van", unfall: "car-profile", allgemein: "wrench" };
const SALE_ICON = ["car-profile", "handshake", "hand-coins", "van"];
const ph = (n) => `<i class="ph-light ph-${n}" aria-hidden="true"></i>`;
const nr = (i) => String(i + 1).padStart(2, "0");

export function render(x) {
  const { c, f, tel, leist, rows, rowLabel, rowIdx, list, esc, mapsUrl, clientJson, css, js, motion } = x;
  const werkstattLeist = leist.filter((l) => !l.link);
  const tarife = list(c.vermietung?.tarife);
  const anfrage = esc(c.hero?.knopf_termin || "Anfrage senden");
  const name = (c.hero?.titel || f.name).replace(/\s*GmbH$/, "");
  const [w1, ...wr] = name.split(" ");
  const num = (p) => (String(p).match(/\d+/) || [""])[0];
  const status = esc(rows[0] ? `${rowLabel(rows[0])} ${rows[0].t}` : "");
  const btn = (cls, href, label, icon, extra = "") => `<a href="${href}" class="btn ${cls}"${extra}><span class="lbl">${label}</span><span class="ico">${ph(icon)}</span></a>`;
  const eyebrow = (n, t) => `<p class="eyebrow"><span>${n}</span>${esc(t)}</p>`;
  const spec = String(c.vermietung?.fahrzeug || "").split(/,\s+/).filter(Boolean); // „2,5 m“ bleibt ganz
  const menu = `<li><a href="#werkstatt">Werkstatt</a></li>
      ${c.vermietung ? `<li><a href="#vermietung">Vermietung</a></li>` : ""}
      ${c.verkauf ? `<li><a href="#verkauf">Verkauf</a></li>` : ""}
      <li><a href="#termin">Kontakt</a></li>`;

  return `<!doctype html>
<html lang="de" class="no-motion">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(c.seo?.titel)}</title>
<meta name="description" content="${esc(c.seo?.beschreibung)}">
<meta name="theme-color" content="#000000">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%23000'/%3E%3Ctext x='16' y='23' font-family='Arial,sans-serif' font-size='19' font-weight='800' fill='%234c8ff0' text-anchor='middle'%3ES%3C/text%3E%3C/svg%3E">
<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/archivo-var.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/assets/vendor/phosphor/light-sub.woff2" crossorigin>
<link rel="preload" as="image" href="/assets/img/sollath-werkstatt-hd.webp" imagesrcset="/assets/img/sollath-werkstatt-md.webp 1200w, /assets/img/sollath-werkstatt-hd.webp 2600w" imagesizes="100vw" fetchpriority="high">
<script>if(!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.replace("no-motion","motion")</script>
<style>
${css}</style>
</head>
<body id="top">

<header class="nav" id="nav">
  <a href="#top" class="brand" aria-label="${esc(f.name)}, zum Seitenanfang">
    ${f.logo ? `<img src="${esc(f.logo)}" alt="${esc(f.logo_beschreibung || "")}" width="36" height="36">` : ""}
    <span><b>${esc(name)}</b><small>${esc(f.zusatz)}</small></span>
  </a>
  <nav aria-label="Hauptmenü"><ul class="nav-links">${menu}</ul></nav>
  ${btn("btn-primary btn-sm nav-call", `tel:${tel}`, esc(f.telefon), "phone")}
  <details class="menu">
    <summary aria-label="Menü">${ph("list")}</summary>
    <ul>${menu}</ul>
  </details>
</header>

<main>

<!-- Erster Bildschirm: echtes Hoffoto, Name, Direktwahl, Faktenleiste -->
<section class="hero" id="hero" aria-labelledby="titel">
  <div class="hero-media" id="heroMedia"><img src="/assets/img/sollath-werkstatt-hd.webp" srcset="/assets/img/sollath-werkstatt-md.webp 1200w, /assets/img/sollath-werkstatt-hd.webp 2600w" sizes="100vw" width="2600" height="1950" alt="${esc(c.hero?.bild_beschreibung)}" fetchpriority="high"></div>
  <div class="hero-scrim"></div>
  <div class="hero-body wrap">
    <div class="hero-copy">
      <p class="hero-kicker">${esc(c.hero?.kicker)}</p>
      <h1 id="titel" class="display"><span class="line"><span>${esc(w1)}</span></span><span class="line"><span class="accent">${esc(wr.join(" "))}.</span></span></h1>
      <p class="lead">${esc(c.hero?.text)}</p>
      <div class="cta">
        ${btn("btn-primary", "#termin", anfrage, "arrow-right")}
        ${c.vermietung ? btn("btn-ghost", "#vermietung", esc(c.hero?.knopf_leistungen || "Transporter mieten"), "van") : ""}
      </div>
    </div>
    <nav class="quick" aria-label="Was steht an?">
      <p class="quick-title">Was steht an?</p>
      <ul>
${QUICK.map((q) => { const l = leist.find((y) => y.titel === q.t); const sub = q.preis ? (tarife[0] ? `ab ${esc(tarife[0].preis)} · Beispielpreis` : "") : esc(l?.dauer || ""); return `        <li><a href="${q.href || "#termin"}"${q.href ? "" : ` data-anliegen="${esc(q.t)}"`}><span class="q-ico">${ph(q.icon)}</span><span class="q-txt"><b>${esc(q.t)}</b>${sub ? `<small>${sub}</small>` : ""}</span>${ph("arrow-right")}</a></li>`; }).join("\n")}
      </ul>
    </nav>
  </div>
  <div class="rail">
    <div class="wrap rail-in">
      <p class="rail-item" id="heroOpen"><i class="dot"></i><em>${status}</em></p>
      <a class="rail-item" href="${esc(mapsUrl)}" target="_blank" rel="noopener">${ph("map-pin")}<span>${esc(f.strasse)}, ${esc(f.plz_ort)}</span></a>
      <a class="rail-item rail-tel" href="tel:${tel}">${ph("phone")}<span>${esc(f.telefon)}</span></a>
    </div>
  </div>
</section>

<!-- 01 Werkstatt -->
<section class="sec" id="werkstatt" aria-labelledby="h-werkstatt">
  <div class="wrap split">
    <div class="split-head">
      ${eyebrow("01", "Werkstatt")}
      <h2 id="h-werkstatt" class="display h2">${esc(c.leistungen?.titel)}</h2>
      <p class="lead">${esc(c.leistungen?.text)}</p>
      ${btn("btn-primary", "#termin", anfrage, "arrow-right")}
    </div>
    <ol class="index">
${werkstattLeist.map((l, i) => `      <li><a class="idx-row" href="#termin" data-anliegen="${esc(l.titel)}">
        <span class="idx-ico">${ph(ICON[l.symbol] || "wrench")}</span>
        <div class="idx-main"><h3>${esc(l.titel)}</h3><span>${esc(l.text)}</span></div>
        ${l.dauer ? `<span class="idx-meta">${esc(l.dauer)}</span>` : "<span></span>"}
        <span class="idx-go">${ph("arrow-right")}</span>
      </a></li>`).join("\n")}
    </ol>
  </div>
  ${list(c.werkstatt?.liste).length ? `<div class="wrap more">
    <h3 class="more-title">${esc(c.werkstatt?.titel)}</h3>
    <ul class="more-list">
${list(c.werkstatt.liste).map((l) => `      <li class="rv"><b>${esc(l.titel)}</b><span>${esc(l.text)}</span></li>`).join("\n")}
    </ul>
  </div>` : ""}
</section>

${c.bosch ? `<!-- Bosch Car Service: Einfahrt mit Mast und Hausnummer -->
<section class="band" aria-labelledby="h-bosch">
  <figure class="band-fig" id="band">
    <img src="/assets/img/sollath-schild-hd.webp" srcset="/assets/img/sollath-schild-md.webp 1200w, /assets/img/sollath-schild-hd.webp 2600w" sizes="100vw" width="2600" height="1953" alt="${esc(c.werkstatt?.bild_beschreibung)}" loading="lazy">
    <figcaption class="band-cap">
      <p class="eyebrow eyebrow-light">${esc(c.bosch.kicker)}</p>
      <h2 id="h-bosch" class="display h2">${esc(c.bosch.titel)}</h2>
      <p>${esc(c.bosch.text)}</p>
      ${list(c.bosch.punkte).length ? `<ul class="ticks">${list(c.bosch.punkte).map((p) => `<li>${ph("check")}${esc(p)}</li>`).join("")}</ul>` : ""}
    </figcaption>
  </figure>
</section>` : ""}

${c.vermietung ? `<!-- 02 Vermietung -->
<section class="sec" id="vermietung" aria-labelledby="h-vermietung">
  <div class="wrap">
    <div class="rent-top">
      <div class="rent-head">
        ${eyebrow("02", "Vermietung")}
        <h2 id="h-vermietung" class="display h2">${esc(c.vermietung.titel)}</h2>
        <p class="lead">${esc(c.vermietung.text)}</p>
        ${spec.length ? `<dl class="spec">${spec.map((s, i) => `<div><dt>${["Fahrzeug", "Sitze", "Ladelänge"][i] || "Ausstattung"}</dt><dd>${esc(s.replace(/^Ladefläche\s*/i, "").replace(/\s*Sitze$/i, ""))}</dd></div>`).join("")}</dl>` : ""}
      </div>
      <figure class="rent-photo rv"><img src="/assets/img/sollath-transit.webp" srcset="/assets/img/sollath-transit-s.webp 900w, /assets/img/sollath-transit.webp 1560w" sizes="(max-width: 980px) 100vw, 58vw" width="1560" height="702" alt="Reihe weißer Ford Transit Custom auf dem Hof der Autohaus Sollath GmbH" loading="lazy"></figure>
    </div>
    <div class="rates rv" id="rates">
${tarife.map((t) => `      <div class="rate"><span class="rate-name">${esc(t.name)}</span><b><span class="count-down" data-to="${esc(num(t.preis))}">${esc(num(t.preis))}</span><small>€</small></b><span class="rate-txt">${esc(t.text)}</span></div>`).join("\n")}
    </div>
    ${c.vermietung.hinweis ? `<p class="fine rates-note">${esc(c.vermietung.hinweis)}</p>` : ""}
    <div class="rent-foot">
      <ul class="terms">
${list(c.vermietung.bedingungen).map((b) => `        <li>${ph("check")}<span>${esc(b)}</span></li>`).join("\n")}
      </ul>
      <div class="rent-cta">
        ${btn("btn-primary", "#termin", esc(c.vermietung.knopf), "arrow-right", ' data-anliegen="Transporter mieten"')}
      </div>
    </div>
  </div>
</section>` : ""}

${c.verkauf ? `<!-- 03 Verkauf -->
<section class="sec sec-line" id="verkauf" aria-labelledby="h-verkauf">
  <div class="wrap split">
    <div class="split-head">
      ${eyebrow("03", "Verkauf")}
      <h2 id="h-verkauf" class="display h2">${esc(c.verkauf.titel)}</h2>
      <p class="lead">${esc(c.verkauf.text)}</p>
      <div class="cta">${btn("btn-primary", "#termin", esc(c.verkauf.knopf), "arrow-right", ' data-anliegen="Kaufberatung &amp; Probefahrt"')}${btn("btn-ghost", `tel:${tel}`, esc(f.telefon), "phone")}</div>
    </div>
    <div class="sale-side">
    <figure class="sale-photo rv"><img src="/assets/img/sollath-hof.webp" width="807" height="586" alt="Mast mit Sollath-Schriftzug und Hausnummer 8, daneben ein Wagen auf dem Hof" loading="lazy"><figcaption>${esc(f.strasse)}</figcaption></figure>
    <ol class="index index-static">
${list(c.verkauf.punkte).map((p, i) => `      <li class="idx-row"><span class="idx-ico">${ph(SALE_ICON[i] || "car-profile")}</span><div class="idx-main"><h3>${esc(p.titel)}</h3><span>${esc(p.text)}</span></div></li>`).join("\n")}
    </ol>
    </div>
  </div>
</section>` : ""}

${c.ablauf ? `<!-- 04 Ablauf -->
<section class="sec sec-line" aria-labelledby="h-ablauf">
  <div class="wrap">
    <div class="head-row">
      ${eyebrow("04", c.ablauf.titel)}
      <h2 id="h-ablauf" class="display h2">In ${["", "einem Schritt", "zwei Schritten", "drei Schritten", "vier Schritten", "fünf Schritten"][list(c.ablauf.schritte).length] || "wenigen Schritten"}</h2>
    </div>
    <ol class="steps" id="steps">
${list(c.ablauf.schritte).map((s, i) => `      <li class="step rv"><span class="step-nr">${nr(i)}</span><h3>${esc(s.titel)}</h3><p>${esc(s.text)}</p></li>`).join("\n")}
    </ol>
  </div>
</section>` : ""}

<!-- 05 Kontakt und Anfrage -->
<section class="sec sec-line" id="termin" aria-labelledby="h-termin">
  <div class="wrap contact" id="kontakt">
    <div class="contact-info">
      ${eyebrow("05", c.kontakt?.titel || "Kontakt")}
      <h2 id="h-termin" class="display h2">${esc(c.termin?.titel)}</h2>
      ${c.termin?.text ? `<p class="lead">${esc(c.termin.text)}</p>` : ""}
      <p class="tel-label">Telefon</p>
      <a class="big-tel" href="tel:${tel}">${esc(f.telefon)}</a>
      <p class="contact-lines"><a href="mailto:${esc(f.email)}">${esc(f.email)}</a><br>${esc(f.strasse)}, ${esc(f.plz_ort)}</p>
      <div class="hours-card">
        <p class="open-state" id="openState"><i></i><span>&nbsp;</span></p>
        <dl class="hours" id="hours">
${rows.map((r) => `          <dt data-d="${rowIdx(r)}">${esc(rowLabel(r))}</dt><dd data-d="${rowIdx(r)}">${esc(r.t)}</dd>`).join("\n")}
        </dl>
        ${c.band?.text ? `<p class="fine">${esc(c.band.text)}</p>` : ""}
        <a class="text-link" href="${esc(mapsUrl)}" target="_blank" rel="noopener">Route planen ${ph("arrow-up-right")}</a>
      </div>
    </div>
    <div id="bookWrap" class="form-wrap">
      <form class="form" id="anfrageForm" name="anfrage" method="POST" data-netlify="true" netlify-honeypot="firma-feld" novalidate>
        <input type="hidden" name="form-name" value="anfrage">
        <p class="sr"><label>Nicht ausfüllen: <input name="firma-feld" tabindex="-1" autocomplete="off"></label></p>
        <div class="field field-full">
          <label for="f-anliegen">Anliegen</label>
          <div class="select"><select id="f-anliegen" name="anliegen"></select>${ph("caret-down")}</div>
        </div>
        <div class="field" id="fa-name">
          <label for="f-name">Name</label>
          <input id="f-name" name="name" autocomplete="name" aria-required="true" aria-describedby="e-name">
          <span class="err" id="e-name">Bitte geben Sie Ihren Namen an.</span>
        </div>
        <div class="field" id="fa-kontakt">
          <label for="f-kontakt">Telefon oder E-Mail</label>
          <input id="f-kontakt" name="telefon_oder_email" autocomplete="tel" aria-required="true" aria-describedby="e-kontakt">
          <span class="err" id="e-kontakt">Bitte Telefon oder E-Mail angeben.</span>
        </div>
        <div class="field">
          <label for="f-kz">Fahrzeug oder Kennzeichen <span class="opt-l">(freiwillig)</span></label>
          <input id="f-kz" name="fahrzeug">
        </div>
        <div class="field">
          <label for="f-wunsch">Wunschtermin <span class="opt-l">(freiwillig)</span></label>
          <input id="f-wunsch" name="wunschtermin" placeholder="z. B. Dienstag vormittags">
        </div>
        <div class="field field-full">
          <label for="f-nachricht">Nachricht <span class="opt-l">(freiwillig)</span></label>
          <textarea id="f-nachricht" name="nachricht" rows="4"></textarea>
        </div>
        <div class="form-foot field-full">
          <button type="submit" class="btn btn-primary" id="sendBtn"><span class="lbl">${anfrage}</span><span class="ico">${ph("arrow-right")}</span></button>
          <p class="fine">Ihre Angaben nutzen wir nur für die Rückmeldung. Siehe <a href="#">Datenschutz</a>.</p>
        </div>
        <p class="form-error field-full" id="formError" role="alert">Die Anfrage konnte gerade nicht gesendet werden. Bitte noch einmal versuchen oder anrufen: ${esc(f.telefon)}.</p>
      </form>
      <div class="thanks" id="thanks" tabindex="-1">
        <span class="thanks-ico">${ph("check")}</span>
        <h3>${esc(c.termin?.danke_titel)}</h3>
        <p id="thanksText">${esc(c.termin?.danke_text)}</p>
        <button class="btn btn-ghost" id="again" type="button"><span class="lbl">Weitere Anfrage</span><span class="ico">${ph("arrow-clockwise")}</span></button>
      </div>
    </div>
  </div>
</section>
</main>

<footer class="foot">
  <div class="wrap foot-in">
    <a href="#top" class="brand">${f.logo ? `<img src="${esc(f.logo)}" alt="" width="30" height="30">` : ""}<span><b>${esc(name)}</b><small>${esc(f.zusatz)}</small></span></a>
    <p>© <span id="year">${new Date().getFullYear()}</span> ${esc(f.name)}. ${esc(c.fusszeile?.text)}</p>
    <nav aria-label="Rechtliches"><a href="#">Impressum</a><a href="#">Datenschutz</a></nav>
  </div>
</footer>

<nav class="mbar" aria-label="Schnellzugriff">
  <a href="tel:${tel}">${ph("phone")}<span>Anrufen</span></a>
  <a href="#termin">${ph("paper-plane-tilt")}<span>Anfrage</span></a>
</nav>


<script id="inhalt" type="application/json">${clientJson}</script>
<script>
${js}</script>
<script src="/assets/vendor/gsap.min.js"></script>
<script src="/assets/vendor/ScrollTrigger.min.js"></script>
<script src="/assets/vendor/lenis.min.js"></script>
<script>
${motion}</script>
</body>
</html>
`;
}
