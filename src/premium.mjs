// Premium-Fassung: node build.mjs premium  →  dist-premium/
// Gestaltung wie A-Z Haustechnik (helle Fläche #F5F5F7, schwarze Bühnen, runde Karten, Pillen-Knöpfe, Geist).
// Erster Bildschirm: Überschrift + Direktwahl der häufigsten Anliegen (wählt im Kalender vor) + echtes Hoffoto.
// Inhalte aus content/seite.json, Kalender/Chatbot aus src/app.js, Bewegung aus src/premium-motion.js.
const ICON = { inspektion: "wrench", diagnose: "gauge", hu: "seal-check", reifen: "tire", flotte: "van", unfall: "car-profile", bremse: "shield-check", klima: "snowflake", batterie: "car-battery", allgemein: "wrench" };
const QUICK = [
  { t: "Inspektion & Wartung", icon: "wrench" },
  { t: "Reifen & Räder", icon: "tire" },
  { t: "HU / AU", icon: "seal-check" },
  { t: "Transporter mieten", icon: "van", href: "#vermietung", preis: true },
];
const ph = (n) => `<i class="ph-light ph-${n}" aria-hidden="true"></i>`;

export function render(x) {
  const { c, f, tel, leist, rows, rowLabel, rowIdx, list, esc, mapsUrl, clientJson, css, js, motion } = x;
  const werkstattLeist = leist.filter((l) => !l.link);
  const tarife = list(c.vermietung?.tarife);
  const termin = esc(c.hero?.knopf_termin || "Termin buchen");
  const name = (c.hero?.titel || f.name).replace(/\s*GmbH$/, "");
  const [w1, ...wr] = name.split(" ");
  const num = (p) => (String(p).match(/\d+/) || [""])[0];
  const btn = (cls, href, label, icon, extra = "") => `<a href="${href}" class="btn ${cls}"${extra}>${label}${icon ? ` ${ph(icon)}` : ""}</a>`;
  const menu = `<li><a href="#leistungen">Leistungen</a></li>
      ${c.vermietung ? `<li><a href="#vermietung">Vermietung</a></li>` : ""}
      ${c.verkauf ? `<li><a href="#verkauf">Verkauf</a></li>` : ""}
      <li><a href="#termin">Termin</a></li>
      <li><a href="#kontakt">Kontakt</a></li>`;

  return `<!doctype html>
<html lang="de" class="no-motion">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(c.seo?.titel)}</title>
<meta name="description" content="${esc(c.seo?.beschreibung)}">
<meta name="theme-color" content="#000000">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%23000'/%3E%3Ctext x='16' y='23' font-family='Arial,sans-serif' font-size='19' font-weight='700' fill='%23fff' text-anchor='middle'%3ES%3C/text%3E%3C/svg%3E">
<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/geist-var.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/assets/vendor/phosphor/light-sub.woff2" crossorigin>
<link rel="preload" as="image" href="/assets/img/sollath-werkstatt-hd.webp" imagesrcset="/assets/img/sollath-werkstatt-md.webp 1200w, /assets/img/sollath-werkstatt-hd.webp 2600w" imagesizes="100vw" fetchpriority="high">
<script>if(!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.replace("no-motion","motion")</script>
<style>
${css}</style>
</head>
<body id="top">

<header class="nav" id="nav">
  <a href="#top" class="brand" aria-label="${esc(f.name)}, zum Seitenanfang">
    ${f.logo ? `<img src="${esc(f.logo)}" alt="${esc(f.logo_beschreibung || "")}" width="34" height="34">` : ""}
    <span><b>${esc(name)}</b><small>${esc(f.zusatz)}</small></span>
  </a>
  <nav aria-label="Hauptmenü"><ul class="nav-links">${menu}</ul></nav>
  <a class="btn btn-sm nav-call" href="tel:${tel}">${ph("phone")} ${esc(f.telefon)}</a>
  <a class="nav-round nav-tel" href="tel:${tel}" aria-label="Anrufen">${ph("phone")}</a>
  <details class="menu">
    <summary class="nav-round" aria-label="Menü">${ph("list")}</summary>
    <ul>${menu}</ul>
  </details>
</header>

<main>

<!-- Erster Bildschirm: Überschrift, Direktwahl der häufigsten Anliegen, echtes Hoffoto -->
<section class="hero" aria-labelledby="titel">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <p class="kicker"><span class="open-pill" id="heroOpen"><i></i><em>${esc(rows[0] ? `${rowLabel(rows[0])} ${rows[0].t}` : "")}</em></span><span>${esc(c.hero?.kicker)}</span></p>
      <h1 id="titel"><span>${esc(w1)}</span><span>${esc(wr.join(" "))}.</span></h1>
      <p class="lead">${esc(c.hero?.text)}</p>
      <div class="cta">
        ${btn("btn-dark", "#termin", termin, "arrow-right")}
        ${btn("btn-ghost", `tel:${tel}`, esc(f.telefon), "phone")}
      </div>
    </div>
    <nav class="quick-card" aria-label="Was steht an?">
      <p class="quick-title">Was steht an?</p>
      <ul>
${QUICK.map((q) => { const l = leist.find((x) => x.titel === q.t); const sub = q.preis ? `ab ${esc(tarife[0]?.preis || "")}` : esc(l?.dauer || ""); return `        <li><a href="${q.href || "#termin"}"${q.href ? "" : ` data-anliegen="${esc(q.t)}"`}><span class="q-ico">${ph(q.icon)}</span><span class="q-txt"><b>${esc(q.label || q.t)}</b>${sub ? `<small>${sub}</small>` : ""}</span>${ph("arrow-right")}</a></li>`; }).join("\n")}
      </ul>
    </nav>
  </div>
  <figure class="hero-photo" id="heroPhoto">
    <img src="/assets/img/sollath-werkstatt-hd.webp" srcset="/assets/img/sollath-werkstatt-md.webp 1200w, /assets/img/sollath-werkstatt-hd.webp 2600w" sizes="100vw" width="2600" height="1950" alt="${esc(c.hero?.bild_beschreibung)}" fetchpriority="high">
    <figcaption>${ph("map-pin")}${esc(f.strasse)}, ${esc(f.plz_ort)}</figcaption>
  </figure>
</section>

<!-- Leistungen -->
<section class="sec" id="leistungen" aria-labelledby="h-leistungen">
  <div class="wrap">
    <div class="kopf">
      <h2 id="h-leistungen">${esc(c.leistungen?.titel)}</h2>
      <p>${esc(c.leistungen?.text)}</p>
    </div>
    <ul class="svc">
${werkstattLeist.map((l) => `      <li><a class="svc-card rv" href="#termin" data-anliegen="${esc(l.titel)}">
        <span class="svc-ico">${ph(ICON[l.symbol] || "wrench")}</span>
        <h3>${esc(l.titel)}</h3>
        ${l.dauer ? `<span class="svc-dauer">${esc(l.dauer)}</span>` : ""}
        <span class="svc-go">${ph("arrow-up-right")}</span>
      </a></li>`).join("\n")}
    </ul>
    ${list(c.werkstatt?.liste).length ? `<div class="extra rv">
      <p>${esc(c.werkstatt?.titel)}</p>
      <ul class="chips chips-light">${list(c.werkstatt.liste).map((l) => `<li>${esc(l.titel)}</li>`).join("")}</ul>
    </div>` : ""}
  </div>
</section>

${c.vermietung ? `<!-- Vermietung -->
<section class="box box-dark" id="vermietung" aria-labelledby="h-vermietung">
  <div class="wrap rent">
    <div class="rent-txt">
      <h2 id="h-vermietung">${esc(c.vermietung.titel)}</h2>
      <p class="lead">${esc(c.vermietung.text)}</p>
      ${c.vermietung.fahrzeug ? `<p class="rent-car">${ph("van")}${esc(c.vermietung.fahrzeug)}</p>` : ""}
      <ul class="chips">${list(c.vermietung.bedingungen).map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
      <div class="cta">${btn("btn-light", "#termin", esc(c.vermietung.knopf), "arrow-right", ' data-anliegen="Transporter mieten"')}</div>
      ${c.vermietung.hinweis ? `<p class="fine">${esc(c.vermietung.hinweis)}</p>` : ""}
    </div>
    <div class="rates">
${tarife.map((t, i) => `      <div class="rate${i === 1 ? " rate-hi" : ""}"><span class="rate-name">${esc(t.name)}</span><b><span class="count-down" data-to="${esc(num(t.preis))}">${esc(num(t.preis))}</span> €</b><span class="rate-txt">${esc(t.text)}</span></div>`).join("\n")}
    </div>
  </div>
</section>` : ""}

${c.verkauf ? `<!-- Verkauf -->
<section class="sec" id="verkauf" aria-labelledby="h-verkauf">
  <div class="wrap">
    <div class="kopf">
      <h2 id="h-verkauf">${esc(c.verkauf.titel)}</h2>
      <p>${esc(c.verkauf.text)}</p>
    </div>
    <div class="sale">
${list(c.verkauf.punkte).map((p, i) => `      <div class="sale-card rv"><span class="svc-ico">${ph(["seal-check", "handshake", "hand-coins", "van"][i] || "car-profile")}</span><h3>${esc(p.titel)}</h3><p>${esc(p.text)}</p></div>`).join("\n")}
    </div>
    <div class="cta">${btn("btn-dark", "#termin", esc(c.verkauf.knopf), "arrow-right", ' data-anliegen="Kaufberatung &amp; Probefahrt"')}${btn("btn-ghost", `tel:${tel}`, esc(f.telefon), "phone")}</div>
  </div>
</section>` : ""}

<!-- Terminbuchung -->
<section class="sec sec-tight" id="termin" aria-labelledby="h-termin">
  <div class="wrap" id="bookWrap">
    <div class="kopf">
      <h2 id="h-termin">${esc(c.termin?.titel)}</h2>
      ${c.termin?.text ? `<p>${esc(c.termin.text)}</p>` : ""}
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
        <button type="submit" class="btn btn-dark btn-wide" id="sendBtn" disabled>${esc(c.termin?.titel)} ${ph("calendar-check")}</button>
        <p class="fine">Ihre Angaben nutzen wir nur für die Terminabsprache. Siehe <a href="#">Datenschutz</a>.</p>
        <p class="form-error" id="formError" role="alert">Die Buchung konnte gerade nicht gesendet werden. Bitte noch einmal versuchen oder anrufen: ${esc(f.telefon)}.</p>
      </div>
    </form>
    <div class="thanks" id="thanks" tabindex="-1">
      <h3>${esc(c.termin?.danke_titel)}</h3>
      <p id="thanksText">${esc(c.termin?.danke_text)}</p>
      <button class="btn btn-ghost" id="again" type="button">Weiteren Termin buchen ${ph("arrow-clockwise")}</button>
    </div>
  </div>
</section>

<!-- Kontakt -->
<section class="box box-dark" id="kontakt" aria-labelledby="h-kontakt">
  <div class="wrap contact">
    <div>
      <h2 id="h-kontakt">${esc(c.kontakt?.titel)}</h2>
      <a class="big-tel" href="tel:${tel}">${esc(f.telefon)}</a>
      <p class="contact-lines"><a href="mailto:${esc(f.email)}">${esc(f.email)}</a><br>${esc(f.strasse)}, ${esc(f.plz_ort)}</p>
      <div class="cta">${btn("btn-light", esc(mapsUrl), "Route planen", "map-pin", ' target="_blank" rel="noopener"')}</div>
    </div>
    <div class="hours-card rv">
      <p class="open-state" id="openState"><i></i><span>&nbsp;</span></p>
      <h3>${esc(c.kontakt?.zeiten_titel)}</h3>
      <dl class="hours" id="hours">
${rows.map((r) => `        <dt data-d="${rowIdx(r)}">${esc(rowLabel(r))}</dt><dd data-d="${rowIdx(r)}">${esc(r.t)}</dd>`).join("\n")}
      </dl>
      ${c.band?.text ? `<p class="fine">${esc(c.band.text)}</p>` : ""}
    </div>
    <figure class="place rv"><img src="/assets/img/sollath-schild-md.webp" alt="${esc(c.werkstatt?.bild_beschreibung)}" width="1200" height="901" loading="lazy"></figure>
  </div>
</section>
</main>

<footer class="wrap foot">
  <a href="#top" class="brand">${f.logo ? `<img src="${esc(f.logo)}" alt="" width="28" height="28">` : ""}<span><b>${esc(name)}</b></span></a>
  <p>© <span id="year">${new Date().getFullYear()}</span> ${esc(f.name)}. ${esc(c.fusszeile?.text)}</p>
  <nav aria-label="Rechtliches"><a href="#">Impressum</a><a href="#">Datenschutz</a></nav>
</footer>

<button class="ask-btn" id="chatFab" type="button" aria-controls="chat" aria-expanded="false">${ph("chat-circle-dots")}<span>${esc(c.chatbot?.knopf)}</span></button>
<section class="chat" id="chat" role="dialog" aria-modal="false" aria-labelledby="chatTitle">
  <header class="chat-head">
    <div><b id="chatTitle">${esc(c.chatbot?.titel)}</b><small>${esc(c.chatbot?.untertitel)}</small></div>
    <button class="chat-close" id="chatClose" type="button" aria-label="Chat schließen">${ph("x")}</button>
  </header>
  <div class="chat-log" id="chatLog" aria-live="polite"></div>
  <div class="chips-chat" id="chatChips">
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
<script>
${motion}</script>
</body>
</html>
`;
}
