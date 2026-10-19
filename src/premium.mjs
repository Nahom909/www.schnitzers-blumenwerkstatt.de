// Premium-Fassung: node build.mjs premium  →  dist-premium/
// Gestaltungssystem wie BCW Beulencenter (Archivo breit, Schwarz, ein Blau, 22px-Rundungen, GSAP + Lenis lokal).
// Inhalte aus content/seite.json, Kalender/Chatbot aus src/app.js, Bewegung aus src/premium-motion.js.
const ICON = { inspektion: "wrench", diagnose: "gauge", hu: "seal-check", reifen: "tire", flotte: "van", unfall: "car-profile", bremse: "shield-check", klima: "snowflake", batterie: "car-battery", allgemein: "wrench" };
const ph = (n) => `<i class="ph-light ph-${n}" aria-hidden="true"></i>`;

export function render(x) {
  const { c, f, tel, leist, rows, rowLabel, rowIdx, list, esc, mapsUrl, clientJson, css, js, motion } = x;
  const werkstattLeist = leist.filter((l) => !l.link);
  const tarife = list(c.vermietung?.tarife);
  const termin = esc(c.hero?.knopf_termin || "Termin buchen");
  const heroDefault = !c.hero?.bild || c.hero.bild === "/assets/img/sollath-werkstatt.webp";
  const heroHd = heroDefault ? "/assets/img/sollath-werkstatt-hd.webp" : c.hero.bild;
  const heroSet = heroDefault ? `srcset="/assets/img/sollath-werkstatt-md.webp 1200w, /assets/img/sollath-werkstatt-hd.webp 2600w" ` : "";
  const name = (c.hero?.titel || f.name).replace(/\s*GmbH$/, "");
  const [w1, ...wr] = name.split(" ");
  const num = (p) => (String(p).match(/\d+/) || [""])[0];
  const btn = (cls, href, label, icon, extra = "") => `<a href="${href}" class="btn ${cls}"${extra}><span class="lbl">${label}</span><span class="ico">${ph(icon)}</span></a>`;

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
<link rel="preload" as="image" href="${heroHd}">
<link rel="stylesheet" href="/assets/vendor/phosphor/light.css">
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
  <nav aria-label="Hauptmenü">
    <ul class="nav-links">
      <li><a href="#leistungen">Leistungen</a></li>
      ${c.vermietung ? `<li><a href="#vermietung">Vermietung</a></li>` : ""}
      ${c.verkauf ? `<li><a href="#verkauf">Verkauf</a></li>` : ""}
      <li><a href="#termin">Termin</a></li>
      <li><a href="#kontakt">Kontakt</a></li>
    </ul>
  </nav>
  <div class="nav-right">
    ${btn("btn-primary btn-sm nav-call", `tel:${tel}`, esc(f.telefon), "phone")}
    <div class="quick">
      <a href="#top" class="pill">Start</a>
      <a href="tel:${tel}" class="pill pill-blue">Anrufen</a>
      <details class="menu">
        <summary class="pill">Menü</summary>
        <ul>
          <li><a href="#leistungen">Leistungen</a></li>
          ${c.vermietung ? `<li><a href="#vermietung">Vermietung</a></li>` : ""}
          ${c.verkauf ? `<li><a href="#verkauf">Verkauf</a></li>` : ""}
          <li><a href="#termin">${esc(c.termin?.titel)}</a></li>
          <li><a href="#kontakt">Kontakt</a></li>
        </ul>
      </details>
    </div>
  </div>
</header>

<main>

<!-- Hero -->
<section class="hero" id="hero" aria-labelledby="titel">
  <div class="hero-media" id="heroMedia"><img src="${heroHd}" ${heroSet}sizes="100vw" alt="${esc(c.hero?.bild_beschreibung)}" fetchpriority="high"></div>
  <div class="hero-scrim"></div>
  <div class="hero-ui">
    <div class="hero-copy">
      <h1 id="titel" class="display"><span class="line"><span>${esc(w1)}</span></span><span class="line"><span class="accent">${esc(wr.join(" "))}.</span></span></h1>
      <p class="lead">${esc(c.hero?.text)}</p>
      <div class="hero-ctas">
        ${btn("btn-primary", "#termin", termin, "calendar-check")}
        ${btn("btn-ghost", "#leistungen", esc(c.hero?.knopf_leistungen), "arrow-down")}
      </div>
    </div>
    <div class="hero-card">
      <p class="hc-row">${ph("clock")}<span id="heroOpen"><em>${esc(rows[0] ? `${rowLabel(rows[0])} ${rows[0].t}` : "")}</em></span></p>
      <p class="hc-row">${ph("map-pin")}<a href="${esc(mapsUrl)}" target="_blank" rel="noopener">${esc(f.strasse)}, ${esc(f.plz_ort)}</a></p>
    </div>
  </div>
</section>

<!-- Aussage -->
<section class="statement" aria-label="Kurz gesagt">
  <div class="wrap">
    <p class="say" id="say">${esc(c.leistungen?.text)} ${esc(c.hero?.text)}</p>
    <div class="facts">
      <div class="fact rv"><b>Bosch</b><span>Car Service Partnerwerkstatt</span></div>
      <div class="fact rv"><b>Alle</b><span>Marken, nach Herstellervorgaben</span></div>
      ${tarife[0] ? `<div class="fact rv"><b><span class="count" data-to="${esc(num(tarife[0].preis))}">${esc(num(tarife[0].preis))}</span> €</b><span>Transporter ab ${esc(tarife[0].name)}</span></div>` : ""}
    </div>
  </div>
</section>

<!-- Leistungen -->
<section class="sec" id="leistungen" aria-labelledby="h-leistungen">
  <div class="wrap svc-grid">
    <div class="svc-head">
      <h2 id="h-leistungen" class="display h2">${esc(c.leistungen?.titel)}<span class="accent">.</span></h2>
      <p class="lead">${esc(c.leistungen?.text)}</p>
      ${btn("btn-primary", "#termin", termin, "calendar-check")}
    </div>
    <ol class="svc-list">
${werkstattLeist.map((l) => `      <li class="svc-row"><a href="#termin" data-anliegen="${esc(l.titel)}">
        <span class="svc-ico">${ph(ICON[l.symbol] || "wrench")}</span>
        <span class="svc-txt"><h3>${esc(l.titel)}</h3><span>${esc(l.text)}</span></span>
        ${l.dauer ? `<span class="tag">${esc(l.dauer)}</span>` : ""}
      </a></li>`).join("\n")}
    </ol>
  </div>
  <div class="wrap duo">
    ${c.vermietung ? `<a class="card card-rent rv" href="#vermietung">
      <div class="card-media"><img src="/assets/img/transporter-seite-dunkel.svg" alt="" loading="lazy"></div>
      <div class="card-txt"><h3>Transporter-Vermietung</h3><p>${esc(c.vermietung.text)}</p><span class="more">Ab ${esc(tarife[0]?.preis || "")} ${ph("arrow-up-right")}</span></div>
    </a>` : ""}
    ${c.verkauf ? `<a class="card card-sale rv" href="#verkauf">
      <div class="card-media"><img src="/assets/img/sollath-werkstatt-md.webp" alt="" loading="lazy"></div>
      <div class="card-txt"><h3>${esc(c.verkauf.titel)}</h3><p>${esc(c.verkauf.text)}</p><span class="more">Mehr zum Verkauf ${ph("arrow-up-right")}</span></div>
    </a>` : ""}
  </div>
</section>

<!-- Werkstatt -->
<section class="shop" id="service" aria-labelledby="h-werkstatt">
  <figure class="shop-band" id="shopBand">
    <img src="/assets/img/sollath-schild-hd.webp" srcset="/assets/img/sollath-schild-md.webp 1200w, /assets/img/sollath-schild-hd.webp 2600w" sizes="100vw" alt="${esc(c.werkstatt?.bild_beschreibung)}" loading="lazy">
    <figcaption><h2 id="h-werkstatt" class="display h2">${esc(c.werkstatt?.titel)}<span class="accent">.</span></h2><p>${esc(f.strasse)}, ${esc(f.plz_ort)}</p></figcaption>
  </figure>
  <div class="wrap">
    <ul class="shop-list">
${list(c.werkstatt?.liste).map((l, i) => `      <li class="rv"><span class="shop-ico">${ph(["shield-check", "snowflake", "car-battery", "drop", "car-profile", "engine"][i] || "wrench")}</span><div><b>${esc(l.titel)}</b><span>${esc(l.text)}</span></div></li>`).join("\n")}
    </ul>
    <div class="center-cta rv">${btn("btn-primary", "#termin", esc(c.werkstatt?.knopf), "calendar-check")}</div>
  </div>
</section>

${c.vermietung ? `<!-- Vermietung (ohne Überschrift) -->
<section class="rent" id="vermietung" aria-label="${esc(c.vermietung.titel)}">
  <div class="rent-stage" id="rentStage">
    <div class="rent-floor"></div>
    <img class="rent-van" id="rentVan" src="/assets/img/transporter-seite-dunkel.svg" alt="${esc(c.vermietung.bild_beschreibung)}" width="1000" height="420" loading="lazy">
    ${c.vermietung.fahrzeug ? `<p class="rent-cap">${esc(c.vermietung.fahrzeug)}</p>` : ""}
  </div>
  <div class="wrap">
    <div class="rates">
${tarife.map((t, i) => `      <div class="rate rv${i === 1 ? " rate-hi" : ""}"><span class="rate-name">${esc(t.name)}</span><b><span class="count" data-to="${esc(num(t.preis))}">${esc(num(t.preis))}</span> €</b><span class="rate-txt">${esc(t.text)}</span></div>`).join("\n")}
    </div>
    <div class="rent-foot">
      <ul class="terms">
${list(c.vermietung.bedingungen).map((b) => `        <li class="rv">${ph("check")}<span>${esc(b)}</span></li>`).join("\n")}
      </ul>
      <div class="rent-cta rv">
        ${btn("btn-primary", "#termin", esc(c.vermietung.knopf), "key", ' data-anliegen="Transporter mieten"')}
        ${c.vermietung.hinweis ? `<p class="fine">${esc(c.vermietung.hinweis)}</p>` : ""}
      </div>
    </div>
  </div>
</section>` : ""}

${c.verkauf ? `<!-- Verkauf -->
<section class="sec" id="verkauf" aria-labelledby="h-verkauf">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="h-verkauf" class="display h2">${esc(c.verkauf.titel)}<span class="accent">.</span></h2>
      <p class="lead">${esc(c.verkauf.text)}</p>
    </div>
    <div class="sale">
${list(c.verkauf.punkte).map((p, i) => `      <div class="sale-card rv"><span class="sale-ico">${ph(["seal-check", "handshake", "hand-coins", "van"][i] || "car-profile")}</span><h3>${esc(p.titel)}</h3><p>${esc(p.text)}</p></div>`).join("\n")}
    </div>
    <div class="row-cta rv">
      ${btn("btn-primary", "#termin", esc(c.verkauf.knopf), "handshake", ' data-anliegen="Kaufberatung &amp; Probefahrt"')}
      ${btn("btn-ghost", `tel:${tel}`, esc(f.telefon), "phone")}
    </div>
  </div>
</section>` : ""}

<!-- Terminbuchung -->
<section class="sec booking" id="termin" aria-labelledby="h-termin">
  <div class="wrap" id="bookWrap">
    <div class="sec-head">
      <h2 id="h-termin" class="display h2">${esc(c.termin?.titel)}<span class="accent">.</span></h2>
      ${c.termin?.text ? `<p class="lead">${esc(c.termin.text)}</p>` : ""}
    </div>
    <form class="booker rv" id="bookForm" name="terminbuchung" method="POST" data-netlify="true" netlify-honeypot="firma-feld" novalidate>
      <input type="hidden" name="form-name" value="terminbuchung">
      <input type="hidden" name="anliegen" id="h-anliegen">
      <input type="hidden" name="datum" id="h-datum">
      <input type="hidden" name="uhrzeit" id="h-uhrzeit">
      <p class="sr"><label>Nicht ausfüllen: <input name="firma-feld" tabindex="-1" autocomplete="off"></label></p>
      <div class="col">
        <h3 class="step"><span>1</span>Anliegen</h3>
        <div class="opts" id="opts"></div>
      </div>
      <div class="col">
        <h3 class="step"><span>2</span>Datum</h3>
        <div class="cal-head"><b id="calMonth">–</b>
          <div class="cal-nav">
            <button type="button" id="calPrev" aria-label="Vorheriger Monat">${ph("caret-left")}</button>
            <button type="button" id="calNext" aria-label="Nächster Monat">${ph("caret-right")}</button>
          </div>
        </div>
        <div class="cal" id="cal" aria-label="Kalender"></div>
        <p class="fine">Buchbar an allen Tagen mit Öffnungszeiten.</p>
      </div>
      <div class="col">
        <h3 class="step"><span>3</span>Uhrzeit und Kontakt</h3>
        <div id="slots"></div>
        <div class="field" id="fa-name">
          <label for="f-name">Name</label>
          <input id="f-name" name="name" autocomplete="name">
          <span class="err">Bitte geben Sie Ihren Namen an.</span>
        </div>
        <div class="field" id="fa-kontakt">
          <label for="f-kontakt">Telefon oder E-Mail</label>
          <input id="f-kontakt" name="telefon_oder_email" autocomplete="tel">
          <span class="err">Bitte Telefon oder E-Mail angeben.</span>
        </div>
        <div class="field">
          <label for="f-kz">Fahrzeug oder Kennzeichen <span class="opt-l">(freiwillig)</span></label>
          <input id="f-kz" name="fahrzeug">
        </div>
        <div class="summary" id="summary"><b>Noch kein Termin gewählt</b><span>Bitte Datum und Uhrzeit wählen.</span></div>
        <button type="submit" class="btn btn-primary btn-wide" id="sendBtn" disabled><span class="lbl">${esc(c.termin?.titel)}</span><span class="ico">${ph("calendar-check")}</span></button>
        <p class="fine">Ihre Angaben nutzen wir nur für die Terminabsprache. Siehe <a href="#">Datenschutz</a>.</p>
        <p class="form-error" id="formError" role="alert">Die Buchung konnte gerade nicht gesendet werden. Bitte noch einmal versuchen oder anrufen: ${esc(f.telefon)}.</p>
      </div>
    </form>
    <div class="thanks" id="thanks" tabindex="-1">
      <h3>${esc(c.termin?.danke_titel)}</h3>
      <p id="thanksText">${esc(c.termin?.danke_text)}</p>
      <button class="btn btn-ghost" id="again" type="button"><span class="lbl">Weiteren Termin buchen</span><span class="ico">${ph("arrow-clockwise")}</span></button>
    </div>
  </div>
</section>

<!-- Kontakt -->
<section class="sec contact" id="kontakt" aria-labelledby="h-kontakt">
  <div class="wrap contact-grid">
    <div>
      <h2 id="h-kontakt" class="display h2">${esc(c.kontakt?.titel)}<span class="accent">.</span></h2>
      <a class="big-tel display" href="tel:${tel}">${esc(f.telefon)}</a>
      <p class="contact-lines"><a href="mailto:${esc(f.email)}">${esc(f.email)}</a><br>${esc(f.strasse)}, ${esc(f.plz_ort)}</p>
      ${c.band?.text ? `<p class="fine">${esc(c.band.text)}</p>` : ""}
      <div class="row-cta">${btn("btn-primary", esc(mapsUrl), "Route planen", "map-pin", ' target="_blank" rel="noopener"')}</div>
    </div>
    <div class="hours-card rv">
      <p class="open-state" id="openState"><i></i><span>&nbsp;</span></p>
      <h3>${esc(c.kontakt?.zeiten_titel)}</h3>
      <dl class="hours" id="hours">
${rows.map((r) => `        <dt data-d="${rowIdx(r)}">${esc(rowLabel(r))}</dt><dd data-d="${rowIdx(r)}">${esc(r.t)}</dd>`).join("\n")}
      </dl>
      ${c.kontakt?.hinweis ? `<p class="fine">${esc(c.kontakt.hinweis)}</p>` : ""}
    </div>
  </div>
  <footer class="wrap foot">
    <a href="#top" class="brand">${f.logo ? `<img src="${esc(f.logo)}" alt="" width="30" height="30">` : ""}<span><b>${esc(name)}</b></span></a>
    <p>© <span id="year">${new Date().getFullYear()}</span> ${esc(f.name)}. ${esc(c.fusszeile?.text)}</p>
    <nav aria-label="Rechtliches"><a href="#">Impressum</a><a href="#">Datenschutz</a></nav>
  </footer>
</section>
</main>

<button class="ask-btn" id="chatFab" type="button" aria-controls="chat" aria-expanded="false">${ph("chat-circle-dots")}<span>${esc(c.chatbot?.knopf)}</span></button>
<section class="chat" id="chat" role="dialog" aria-modal="false" aria-labelledby="chatTitle">
  <header class="chat-head">
    <div><b id="chatTitle">${esc(c.chatbot?.titel)}</b><small>${esc(c.chatbot?.untertitel)}</small></div>
    <button class="chat-close" id="chatClose" type="button" aria-label="Chat schließen">${ph("x")}</button>
  </header>
  <div class="chat-log" id="chatLog" aria-live="polite"></div>
  <div class="chips" id="chatChips">
${list(c.chatbot?.beispielfragen).map((q) => `    <button class="chip" type="button">${esc(q)}</button>`).join("\n")}
  </div>
  <form class="chat-form" id="chatForm">
    <label class="sr" for="chatInput">Ihre Frage</label>
    <textarea id="chatInput" rows="1" maxlength="1000" placeholder="Ihre Frage"></textarea>
    <button class="chat-send" id="chatSend" type="submit" disabled aria-label="Senden">${ph("arrow-up-right")}</button>
  </form>
  <p class="chat-note">Automatische Antworten einer KI, ohne Gewähr. Bitte keine sensiblen Daten eingeben.</p>
</section>

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
