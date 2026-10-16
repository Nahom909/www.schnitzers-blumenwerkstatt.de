// Baut die Website aus den Inhalten: node build.mjs  →  dist/
// Texte und Bilder stehen in content/seite.json und werden über /admin (Decap CMS) bearbeitet.
// Netlify führt dieses Skript bei jeder Änderung automatisch aus.
import { readFile, writeFile, mkdir, cp, rm } from "node:fs/promises";

const ROOT = new URL("./", import.meta.url);
const OUT = new URL("dist/", ROOT);
const c = JSON.parse(await readFile(new URL("content/seite.json", ROOT), "utf8"));
const css = await readFile(new URL("src/style.css", ROOT), "utf8");
const js = await readFile(new URL("src/app.js", ROOT), "utf8");

/* ---------- Hilfen ---------- */
const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const list = (a) => (Array.isArray(a) ? a : []);
// "06103 731200" → "+496103731200"
const telLink = (t = "") => { const d = t.replace(/[^\d+]/g, ""); return d.startsWith("+") ? d : d.startsWith("0") ? "+49" + d.slice(1) : d; };

// Öffnungszeiten: "07:30-18:00" → [7.5, 18], leer = geschlossen
const KEYS = ["so", "mo", "di", "mi", "do", "fr", "sa"];
const SHORT = { mo: "Mo", di: "Di", mi: "Mi", do: "Do", fr: "Fr", sa: "Sa", so: "So" };
const LONG = { mo: "Montag", di: "Dienstag", mi: "Mittwoch", do: "Donnerstag", fr: "Freitag", sa: "Samstag", so: "Sonntag" };
const toH = (s) => { const [h, m = "0"] = s.trim().split(":"); return +h + +m / 60; };
function parseZeit(v = "") {
  const m = String(v).match(/(\d{1,2}(?::\d{2})?)\s*[-–]\s*(\d{1,2}(?::\d{2})?)/);
  return m ? [toH(m[1]), toH(m[2])] : null;
}
const hours = KEYS.map((k) => parseZeit(c.oeffnungszeiten?.[k]));
const zeitText = (k) => { const z = parseZeit(c.oeffnungszeiten?.[k]); return z ? String(c.oeffnungszeiten[k]).replace(/\s*[-–]\s*/, " – ") : "geschlossen"; };
// Gleiche aufeinanderfolgende Tage zusammenfassen (Mo – Do 07:30 – 18:00)
const ORDER = ["mo", "di", "mi", "do", "fr", "sa", "so"];
const rows = [];
for (const k of ORDER) {
  const t = zeitText(k), last = rows[rows.length - 1];
  if (last && last.t === t) last.days.push(k); else rows.push({ t, days: [k] });
}
const rowLabel = (r) => (r.days.length === 1 ? LONG[r.days[0]] : `${SHORT[r.days[0]]} – ${SHORT[r.days[r.days.length - 1]]}`);
const rowIdx = (r) => r.days.map((k) => KEYS.indexOf(k)).join(" ");

/* ---------- Symbole für die Leistungen ---------- */
const ICONS = {
  inspektion: '<path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5a4 4 0 0 0-2-2Z"/><path d="M14.5 6.5 17 4"/>',
  diagnose: '<path d="M3 12h3l2-5 4 10 2-5h7"/>',
  hu: '<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.2 2.4 2.4 4.6-4.9"/>',
  reifen: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/><path d="M12 3.5v5M12 15.5v5M3.5 12h5M15.5 12h5"/>',
  flotte: '<path d="M2.5 16V7.5A1.5 1.5 0 0 1 4 6h10v10M14 9h4l3.5 4v3H14"/><circle cx="7" cy="17" r="2"/><circle cx="17.5" cy="17" r="2"/>',
  unfall: '<path d="M4 15.5 5.6 10a2 2 0 0 1 1.9-1.5h9a2 2 0 0 1 1.9 1.5l1.6 5.5"/><rect x="3" y="15" width="18" height="4" rx="1.5"/><path d="M9 4l1 2.5M15 4l-1 2.5M12 3v3"/>',
  bremse: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.5"/><path d="M12 3.5v6M5 16.5l5-3M19 16.5l-5-3"/>',
  klima: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/>',
  batterie: '<rect x="3" y="7" width="18" height="12" rx="2"/><path d="M7 7V5M17 7V5M8 13h3M15 11.5v3M13.5 13h3"/>',
  allgemein: '<path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5a4 4 0 0 0-2-2Z"/>',
};
const icon = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k] || ICONS.allgemein}</svg>`;
const PHONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4.5h3l1.5 4-2 1.3a10 10 0 0 0 6.7 6.7l1.3-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 3.5 6.1 1.5 1.5 0 0 1 5 4.5Z"/></svg>';

const f = c.firma, tel = telLink(f.telefon), leist = list(c.leistungen?.liste);
const mapsUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(`${f.name}, ${f.strasse}, ${f.plz_ort}`);

// Daten für das Skript im Browser (Kalender, Öffnungszeiten, Chatbot)
const client = {
  name: f.name, telefon: f.telefon, telLink: tel, email: f.email, strasse: f.strasse, plzOrt: f.plz_ort,
  hours, zeilen: rows.map((r) => [rowLabel(r), r.t === "geschlossen" ? "geschlossen" : r.t + " Uhr"]),
  anliegen: [...leist.filter((l) => !l.link), ...list(c.termin?.zusatz_anliegen)].map((l) => [l.titel, l.dauer || ""]),
  preise: list(c.preise?.liste).map((p) => [p.leistung, p.preis]),
  miete: { tarife: list(c.vermietung?.tarife).map((t) => [t.name, t.preis, t.text || ""]), bedingungen: list(c.vermietung?.bedingungen), fahrzeug: c.vermietung?.fahrzeug || "" },
  verkauf: list(c.verkauf?.punkte).map((p) => [p.titel, p.text]),
  vorlauf: c.termin?.vorlauf_tage || 90, danke: c.termin?.danke_text || "",
  begruessung: c.chatbot?.begruessung || "", wissen: c.chatbot?.zusatzwissen || "",
};
// Wissensliste für den Chatbot: jede Info der Seite als kurzer Eintrag [Typ, Titel, Antwort]
const W = [];
const add = (typ, titel, ...teile) => { const a = teile.filter(Boolean).join(" · "); if (titel || a) W.push([typ, titel || "", a]); };
add("firma", f.name, f.zusatz, c.hero?.text);
add("adresse", "Adresse", `${f.strasse}, ${f.plz_ort}`, c.band?.text);
add("kontakt", "Kontakt", `Telefon ${f.telefon}`, `E-Mail ${f.email}`, c.kontakt?.hinweis);
for (const l of leist) add("leistung", l.titel, l.text, l.dauer && `Dauer ${l.dauer}`, l.preis && `Preis ${l.preis}`);
for (const l of list(c.werkstatt?.liste)) add("leistung", l.titel, l.text);
for (const p of list(c.preise?.liste)) add("preis", p.leistung, `Preis ${p.preis}`);
if (c.preise?.hinweis) add("preis", "Hinweis zu Preisen", c.preise.hinweis);
if (c.vermietung) {
  add("miete", c.vermietung.titel, c.vermietung.text, c.vermietung.fahrzeug);
  for (const t of list(c.vermietung.tarife)) add("miete", `Transporter mieten, ${t.name}`, `Preis ${t.preis}`, t.text);
  for (const b of list(c.vermietung.bedingungen)) add("miete", "Bedingung Vermietung", b);
}
if (c.verkauf) {
  add("verkauf", c.verkauf.titel, c.verkauf.text);
  for (const p of list(c.verkauf.punkte)) add("verkauf", p.titel, p.text);
}
add("termin", c.termin?.titel, c.termin?.text, `Bis ${c.termin?.vorlauf_tage || 90} Tage im Voraus`);
for (const z of list(c.termin?.zusatz_anliegen)) add("termin", z.titel, z.dauer, "über „Termin buchen“");
if (c.chatbot?.zusatzwissen) add("info", "", c.chatbot.zusatzwissen);
client.wissen_liste = W;

const clientJson = JSON.stringify(client).replace(/</g, "\\u003c");

/* ---------- Seite ---------- */
const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(c.seo?.titel)}</title>
<meta name="description" content="${esc(c.seo?.beschreibung)}">
<meta name="theme-color" content="#0f2d44">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='5' fill='%231f78c8'/%3E%3Ctext x='16' y='23' font-family='Arial,sans-serif' font-size='20' font-weight='700' fill='%23fff' text-anchor='middle'%3E${esc((f.kurzname || f.name || "S").trim()[0])}%3C/text%3E%3C/svg%3E">
<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/barlow-latin-400-normal.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/barlow-semi-condensed-latin-600-normal.woff2" crossorigin>
<link rel="preload" as="image" href="${esc(c.hero?.bild)}">
<style>
${css.replace(/url\(assets\//g, "url(/assets/")}</style>
</head>
<body id="top">

<!-- ================= Kopfzeile ================= -->
<header class="top">
  <div class="wrap">
    <a href="#top" class="logo" aria-label="${esc(f.name)}, zum Seitenanfang">${f.logo ? `<img src="${esc(f.logo)}" alt="${esc(f.logo_beschreibung || "")}" height="48">` : `<b>${esc(f.kurzname)}</b>`}<span><strong>${esc(f.name)}</strong>${esc(f.zusatz)}</span></a>
    <nav aria-label="Hauptmenü">
      <a href="#top">Start</a>
      <a href="#leistungen">Leistungen</a>
      ${c.vermietung ? `<a href="#vermietung">Vermietung</a>` : ""}
      ${c.verkauf ? `<a href="#verkauf">Verkauf</a>` : ""}
      <a href="#termin">Termin</a>
      <a href="#kontakt">${esc(c.kontakt?.titel)}</a>
      <a href="tel:${tel}" class="btn btn-primary">${PHONE}${esc(f.telefon)}</a>
    </nav>
    <div class="quick">
      <a href="#top" class="btn btn-secondary">Start</a>
      <a href="tel:${tel}" class="btn btn-primary">${PHONE}Anrufen</a>
      <details class="menu">
        <summary>Menü</summary>
        <ul>
          <li><a href="#leistungen">Leistungen</a></li>
          ${c.vermietung ? `<li><a href="#vermietung">Vermietung</a></li>` : ""}
          ${c.verkauf ? `<li><a href="#verkauf">Verkauf</a></li>` : ""}
          <li><a href="#termin">${esc(c.termin?.titel)}</a></li>
          <li><a href="#kontakt">${esc(c.kontakt?.kicker)}</a></li>
        </ul>
      </details>
    </div>
  </div>
</header>

<main>

<!-- ================= Hero ================= -->
<section class="hero" aria-labelledby="titel">
  <div class="hero-inner">
    <img src="${esc(c.hero?.bild)}" alt="${esc(c.hero?.bild_beschreibung)}" fetchpriority="high">
    <div class="scrim"></div>
    <div class="wrap">
      <p class="kicker">${esc(c.hero?.kicker)}</p>
      <h1 id="titel">${esc(c.hero?.titel)}</h1>
      <p class="sub">${esc(c.hero?.text)}</p>
      <div class="ctas">
        <a href="#termin" class="btn btn-white">${esc(c.hero?.knopf_termin)}</a>
        <a href="#leistungen" class="btn btn-outline-white">${esc(c.hero?.knopf_leistungen)}</a>
      </div>
      <div class="meta">
        <span id="heroOpen"><i></i><em style="font-style:normal">${esc(rows[0] ? `${rowLabel(rows[0])} ${rows[0].t}` : "")}</em></span>
        <span>${esc(f.strasse)}</span>
      </div>
    </div>
  </div>
</section>

<!-- ================= Leistungen ================= -->
<section class="sec" id="leistungen" aria-labelledby="h-leistungen">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="h-leistungen">${esc(c.leistungen?.titel)}</h2>
      ${c.leistungen?.text ? `<p class="intro">${esc(c.leistungen.text)}</p>` : ""}
    </div>
    <div class="services">
${leist.map((l, i) => `      <a href="${esc(l.link || "#termin")}" class="card${i === 0 ? " card-dark" : ""}"${l.link ? "" : ` data-anliegen="${esc(l.titel)}"`}>
        <span class="ico">${icon(l.symbol)}</span>
        <h3>${esc(l.titel)}</h3><p>${esc(l.text)}</p><span class="go">${l.link ? "Mehr dazu" : esc(c.hero?.knopf_termin || "Termin buchen")} →</span>
      </a>`).join("\n")}
    </div>
  </div>
</section>

<!-- ================= Werkstatt ================= -->
<section class="sec" id="service" aria-labelledby="h-werkstatt">
  <div class="wrap">
    <div class="sec-head">
      ${c.werkstatt?.kicker ? `<p class="kicker">${esc(c.werkstatt.kicker)}</p>` : ""}
      <h2 id="h-werkstatt">${esc(c.werkstatt?.titel)}</h2>
    </div>
  </div>
  <div class="wrap split">
    <div>
      ${c.werkstatt?.bild ? `<img src="${esc(c.werkstatt.bild)}" alt="${esc(c.werkstatt.bild_beschreibung)}" loading="lazy">` : ""}
    </div>
    <div>
      <ul class="list">
${list(c.werkstatt?.liste).map((l) => `        <li><b>${esc(l.titel)}</b><span>${esc(l.text)}</span></li>`).join("\n")}
      </ul>
      <a href="#termin" class="btn btn-primary">${esc(c.werkstatt?.knopf)}</a>
    </div>
  </div>
</section>
${c.vermietung ? `
<!-- ================= Vermietung: Transporter + Mietpreise, ohne Überschrift ================= -->
<section class="sec rent-sec" id="vermietung" aria-label="${esc(c.vermietung.titel || "Transporter mieten")}">
  <div class="wrap">
    ${c.vermietung.bild ? `<figure class="rent-pic"><img src="${esc(c.vermietung.bild)}" alt="${esc(c.vermietung.bild_beschreibung)}" loading="lazy" width="1000" height="420">${c.vermietung.fahrzeug ? `<figcaption>${esc(c.vermietung.fahrzeug)}</figcaption>` : ""}</figure>` : ""}
    <div class="rent">
      <div class="rates">
${list(c.vermietung.tarife).map((t, i) => `        <div class="rate${i === 1 ? " rate-dark" : ""}"><span class="rate-name">${esc(t.name)}</span><b>${esc(t.preis)}</b><span>${esc(t.text)}</span></div>`).join("\n")}
      </div>
      <div class="rent-info">
        <ul class="checks">
${list(c.vermietung.bedingungen).map((b) => `          <li>${esc(b)}</li>`).join("\n")}
        </ul>
        <a href="#termin" class="btn btn-primary" data-anliegen="Transporter mieten">${esc(c.vermietung.knopf)}</a>
        ${c.vermietung.hinweis ? `<p class="fine">${esc(c.vermietung.hinweis)}</p>` : ""}
      </div>
    </div>
  </div>
</section>` : ""}
${c.verkauf ? `
<!-- ================= Verkauf ================= -->
<section class="sec" id="verkauf" aria-labelledby="h-verkauf">
  <div class="wrap">
    <div class="sec-head">
      <p class="kicker">Verkauf</p>
      <h2 id="h-verkauf">${esc(c.verkauf.titel)}</h2>
      ${c.verkauf.text ? `<p class="intro">${esc(c.verkauf.text)}</p>` : ""}
    </div>
    <div class="services services-4">
${list(c.verkauf.punkte).map((p) => `      <div class="card card-static">
        <span class="ico">${icon(p.symbol)}</span>
        <h3>${esc(p.titel)}</h3><p>${esc(p.text)}</p>
      </div>`).join("\n")}
    </div>
    <div class="row-cta"><a href="#termin" class="btn btn-primary" data-anliegen="Kaufberatung & Probefahrt">${esc(c.verkauf.knopf)}</a><a href="tel:${tel}" class="btn btn-secondary">${PHONE}${esc(f.telefon)}</a></div>
  </div>
</section>` : ""}

<!-- ================= Terminbuchung ================= -->
<section class="sec booking" id="termin" aria-labelledby="h-termin">
  <div class="wrap" id="bookWrap">
    <div class="sec-head">
      <h2 id="h-termin">${esc(c.termin?.titel)}</h2>
      ${c.termin?.text ? `<p class="intro">${esc(c.termin.text)}</p>` : ""}
    </div>

    <form class="booker" id="bookForm" name="terminbuchung" method="POST" data-netlify="true" netlify-honeypot="firma-feld" novalidate>
      <input type="hidden" name="form-name" value="terminbuchung">
      <input type="hidden" name="anliegen" id="h-anliegen">
      <input type="hidden" name="datum" id="h-datum">
      <input type="hidden" name="uhrzeit" id="h-uhrzeit">
      <p class="sr"><label>Nicht ausfüllen: <input name="firma-feld" tabindex="-1" autocomplete="off"></label></p>

      <div class="col">
        <div class="step"><span class="n">1</span><h3>Anliegen</h3></div>
        <div class="opts" id="opts"></div>
      </div>

      <div class="col">
        <div class="step"><span class="n">2</span><h3>Datum</h3></div>
        <div class="cal-head"><b id="calMonth">–</b>
          <div class="cal-nav">
            <button type="button" id="calPrev" aria-label="Vorheriger Monat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg></button>
            <button type="button" id="calNext" aria-label="Nächster Monat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button>
          </div>
        </div>
        <div class="cal" id="cal" aria-label="Kalender"></div>
        <p class="cal-note">Buchbar an allen Tagen mit Öffnungszeiten.</p>
      </div>

      <div class="col">
        <div class="step"><span class="n">3</span><h3>Uhrzeit &amp; Kontakt</h3></div>
        <div id="slots"></div>
        <div class="field" id="fa-name">
          <label for="f-name">Name</label>
          <input id="f-name" name="name" autocomplete="name" placeholder="Vor- und Nachname">
          <span class="err">Bitte geben Sie Ihren Namen an.</span>
        </div>
        <div class="field" id="fa-kontakt">
          <label for="f-kontakt">Telefon oder E-Mail</label>
          <input id="f-kontakt" name="telefon_oder_email" autocomplete="tel" placeholder="Für die Bestätigung">
          <span class="err">Bitte Telefon oder E-Mail angeben.</span>
        </div>
        <div class="field">
          <label for="f-kz">Fahrzeug oder Kennzeichen <span class="opt-l">(freiwillig)</span></label>
          <input id="f-kz" name="fahrzeug" placeholder="z. B. Ford Focus, OF-AB 123">
        </div>
        <div class="summary" id="summary"><b>Noch kein Termin gewählt</b><span>Bitte Datum und Uhrzeit wählen.</span></div>
        <button type="submit" class="btn btn-primary" id="sendBtn" disabled>${esc(c.termin?.titel)}</button>
        <p class="small">Ihre Angaben nutzen wir nur für die Terminabsprache. Siehe <a href="#">Datenschutz</a>.</p>
        <p class="form-error" id="formError" role="alert">Die Buchung konnte gerade nicht gesendet werden. Bitte noch einmal versuchen oder anrufen: ${esc(f.telefon)}.</p>
      </div>
    </form>

    <div class="thanks" id="thanks" tabindex="-1">
      <h3>${esc(c.termin?.danke_titel)}</h3>
      <p id="thanksText">${esc(c.termin?.danke_text)}</p>
      <button class="btn btn-secondary" id="again" type="button">Weiteren Termin buchen</button>
    </div>
  </div>
</section>

<!-- ================= Anfahrt ================= -->
<section class="band" aria-label="Anfahrt">
  <div class="wrap">
    <div><h2>${esc(c.band?.titel)}</h2>${c.band?.text ? `<p>${esc(c.band.text)}</p>` : ""}</div>
    <a href="#kontakt" class="btn btn-white">${esc(c.band?.knopf)}</a>
  </div>
</section>

<!-- ================= Kontakt ================= -->
<section class="sec" id="kontakt" aria-labelledby="h-kontakt">
  <div class="wrap">
    <div class="sec-head">
      ${c.kontakt?.kicker ? `<p class="kicker">${esc(c.kontakt.kicker)}</p>` : ""}
      <h2 id="h-kontakt">${esc(c.kontakt?.titel)}</h2>
    </div>
    <div class="contact">
      <div class="box">
        <p class="open-state" id="openState"><i></i><span>&nbsp;</span></p>
        <h3>${esc(c.kontakt?.zeiten_titel)}</h3>
        <dl class="hours" id="hours">
${rows.map((r) => `          <dt data-d="${rowIdx(r)}">${esc(rowLabel(r))}</dt><dd data-d="${rowIdx(r)}">${esc(r.t)}</dd>`).join("\n")}
        </dl>
        ${c.kontakt?.hinweis ? `<p class="note">${esc(c.kontakt.hinweis)}</p>` : ""}
        <a href="tel:${tel}" class="btn btn-secondary">${esc(f.telefon)}</a>
      </div>
      <div class="box box-dark">
        <div><h2>${esc(f.name)}</h2><address>${esc(f.strasse)}, ${esc(f.plz_ort)}</address></div>
        <div class="contact-list">
          <a href="tel:${tel}"><span>Telefon</span><b>${esc(f.telefon)}</b></a>
          <a href="mailto:${esc(f.email)}"><span>E-Mail</span><b>${esc(f.email)}</b></a>
        </div>
        <div class="btns">
          <a class="btn btn-white" href="${esc(mapsUrl)}" target="_blank" rel="noopener">Route planen</a>
          <a class="btn btn-outline-white" href="#termin">${esc(c.termin?.titel)}</a>
        </div>
      </div>
    </div>
  </div>
</section>
</main>

<footer>
  <div class="wrap">
    <a href="#top" class="logo">${f.logo ? `<img src="${esc(f.logo)}" alt="${esc(f.logo_beschreibung || "")}" height="46" loading="lazy">` : `<b>${esc(f.kurzname)}</b>`}<span><strong>${esc(f.name)}</strong>${esc(f.strasse)}, ${esc(f.plz_ort)}</span></a>
    <nav aria-label="Rechtliches">
      <a href="#leistungen">${esc(c.leistungen?.titel)}</a><a href="#termin">Termin</a><a href="#kontakt">${esc(c.kontakt?.titel)}</a><a href="#">Impressum</a><a href="#">Datenschutz</a>
    </nav>
    <p class="credits">© <span id="year">${new Date().getFullYear()}</span> ${esc(f.name)}. ${esc(c.fusszeile?.text)}</p>
  </div>
</footer>

<!-- ================= KI-Chatbot ================= -->
<button class="ask-btn" id="chatFab" type="button" aria-controls="chat" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5h16v10H9l-5 4v-14Z"/></svg>${esc(c.chatbot?.knopf)}</button>
<section class="chat" id="chat" role="dialog" aria-modal="false" aria-labelledby="chatTitle">
  <header class="chat-head">
    <div><b id="chatTitle">${esc(c.chatbot?.titel)}</b><small>${esc(c.chatbot?.untertitel)}</small></div>
    <button class="chat-close" id="chatClose" type="button" aria-label="Chat schließen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
  </header>
  <div class="chat-log" id="chatLog" aria-live="polite"></div>
  <div class="chips" id="chatChips">
${list(c.chatbot?.beispielfragen).map((q) => `    <button class="chip" type="button">${esc(q)}</button>`).join("\n")}
  </div>
  <form class="chat-form" id="chatForm">
    <label class="sr" for="chatInput">Ihre Frage</label>
    <textarea id="chatInput" rows="1" maxlength="1000" placeholder="Ihre Frage"></textarea>
    <button class="chat-send" id="chatSend" type="submit" disabled>Senden</button>
  </form>
  <p class="chat-note">Automatische Antworten einer KI, ohne Gewähr. Bitte keine sensiblen Daten eingeben.</p>
</section>

<script id="inhalt" type="application/json">${clientJson}</script>
<script>
${js}</script>
</body>
</html>
`;

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
await cp(new URL("static/", ROOT), OUT, { recursive: true });
await writeFile(new URL("index.html", OUT), html);
console.log(`Fertig: dist/index.html (${(html.length / 1024).toFixed(0)} KB), ${leist.length} Leistungen, ${rows.length} Zeilen Öffnungszeiten`);
