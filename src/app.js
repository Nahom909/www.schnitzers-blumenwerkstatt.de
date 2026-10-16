/* Inhalte kommen aus content/seite.json (beim Bauen in die Seite geschrieben) */
const C = JSON.parse(document.getElementById("inhalt").textContent);
document.getElementById("year").textContent = new Date().getFullYear();

/* ================= Öffnungszeiten ================= */
const HOURS = C.hours; // Index 0 = Sonntag; [von, bis] in Stunden oder null
const DAYS = ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"];
const fmtH = x => `${String(Math.floor(x)).padStart(2, "0")}:${String(Math.round((x % 1) * 60)).padStart(2, "0")}`;
function openText() {
  const now = new Date(), wd = now.getDay(), h = now.getHours() + now.getMinutes() / 60, t = HOURS[wd];
  if (t && h >= t[0] && h < t[1]) return { open: true, text: `Jetzt geöffnet, bis ${fmtH(t[1])} Uhr` };
  if (t && h < t[0]) return { open: false, text: `Heute geöffnet ab ${fmtH(t[0])} Uhr` };
  let d = (wd + 1) % 7, n = 0; while (!HOURS[d] && n++ < 7) d = (d + 1) % 7;
  if (!HOURS[d]) return { open: false, text: "Gerade geschlossen" };
  const name = d === (wd + 1) % 7 ? "morgen" : DAYS[d];
  return { open: false, text: `Gerade geschlossen, ${name} ab ${fmtH(HOURS[d][0])} Uhr` };
}
(() => {
  const wd = new Date().getDay(), s = openText();
  document.querySelectorAll("#hours [data-d]").forEach(el => { if (el.dataset.d.split(" ").includes(String(wd))) el.classList.add("is-today"); });
  const box = document.getElementById("openState");
  box.querySelector("span").textContent = s.text; box.classList.toggle("closed", !s.open);
  const hero = document.getElementById("heroOpen");
  hero.querySelector("em").textContent = s.text; hero.classList.toggle("closed", !s.open);
})();

/* ================= Terminbuchung (Kalender) ================= */
(() => {
  const ANLIEGEN = C.anliegen; // [[Titel, Dauer], …]
  const form = document.getElementById("bookForm"), wrap = document.getElementById("bookWrap");
  const optsEl = document.getElementById("opts"), calEl = document.getElementById("cal"), monthEl = document.getElementById("calMonth");
  const slotsEl = document.getElementById("slots"), sumEl = document.getElementById("summary"), btn = document.getElementById("sendBtn");
  const name = document.getElementById("f-name"), kontakt = document.getElementById("f-kontakt"), errBox = document.getElementById("formError");
  const prev = document.getElementById("calPrev"), next = document.getElementById("calNext");
  const btnText = btn.textContent;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const last = new Date(today); last.setDate(last.getDate() + (C.vorlauf || 90));
  const state = { a: ANLIEGEN[0] ? ANLIEGEN[0][0] : "", view: new Date(first), date: null, slot: null };
  const fmtM = new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" });
  const fmtD = new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long" });
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const bookable = d => d > today && d <= last && !!HOURS[d.getDay()];

  // Zeiten aus den Öffnungszeiten: stündlich, letzter Termin eine Stunde vor Schluss
  function slotsFor(d) {
    const [from, to] = HOURS[d.getDay()], out = [];
    for (let t = from; t <= to - 1; t += 1) out.push(fmtH(t));
    return out;
  }

  ANLIEGEN.forEach(([t, s]) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "opt";
    b.innerHTML = `<b></b><small></small>`; b.querySelector("b").textContent = t; b.querySelector("small").textContent = s;
    b.addEventListener("click", () => { state.a = t; render(); });
    optsEl.appendChild(b);
  });
  window.pickAnliegen = (t) => { if (ANLIEGEN.some(([x]) => x === t)) { state.a = t; render(); } };
  document.querySelectorAll("[data-anliegen]").forEach(a => a.addEventListener("click", () => window.pickAnliegen(a.dataset.anliegen)));

  prev.addEventListener("click", () => { state.view.setMonth(state.view.getMonth() - 1); renderCal(); });
  next.addEventListener("click", () => { state.view.setMonth(state.view.getMonth() + 1); renderCal(); });

  function renderCal() {
    const v = state.view, y = v.getFullYear(), m = v.getMonth();
    monthEl.textContent = fmtM.format(v);
    prev.disabled = +v <= +first;
    next.disabled = new Date(y, m + 1, 1) > last;
    let html = ["Mo","Di","Mi","Do","Fr","Sa","So"].map(d => `<div class="dow">${d}</div>`).join("");
    const lead = (new Date(y, m, 1).getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
    for (let i = 0; i < lead; i++) html += "<div></div>";
    for (let d = 1; d <= days; d++) {
      const dt = new Date(y, m, d), ok = bookable(dt);
      const cls = ["day", state.date && iso(state.date) === iso(dt) ? "sel" : "", +dt === +today ? "today" : ""].join(" ");
      html += `<button type="button" class="${cls}" data-d="${d}" ${ok ? "" : "disabled"} aria-label="${fmtD.format(dt)}">${d}</button>`;
    }
    calEl.innerHTML = html;
    calEl.querySelectorAll(".day:not(:disabled)").forEach(b => b.addEventListener("click", () => {
      state.date = new Date(y, m, +b.dataset.d); state.slot = null; render();
      if (innerWidth < 640) slotsEl.scrollIntoView({ block: "start" });
    }));
  }
  function renderSlots() {
    if (!state.date) { slotsEl.innerHTML = `<div class="slots-empty">Bitte zuerst einen Tag wählen.</div>`; return; }
    slotsEl.innerHTML = `<div class="slots">${slotsFor(state.date).map(t => `<button type="button" class="slot" aria-pressed="${state.slot === t}">${t}</button>`).join("")}</div>`;
    slotsEl.querySelectorAll(".slot").forEach(b => b.addEventListener("click", () => { state.slot = b.textContent; renderSlots(); renderSum(); }));
  }
  function renderSum() {
    const ok = state.date && state.slot;
    sumEl.innerHTML = `<b></b><span></span>`;
    sumEl.querySelector("b").textContent = state.a;
    sumEl.querySelector("span").textContent = ok ? `${fmtD.format(state.date)}, ${state.slot} Uhr` : state.date ? "Bitte eine Uhrzeit wählen." : "Bitte Datum und Uhrzeit wählen.";
    btn.disabled = !ok;
    document.getElementById("h-anliegen").value = state.a;
    document.getElementById("h-datum").value = state.date ? fmtD.format(state.date) : "";
    document.getElementById("h-uhrzeit").value = state.slot || "";
  }
  function render() {
    optsEl.querySelectorAll(".opt").forEach(b => b.setAttribute("aria-pressed", b.querySelector("b").textContent === state.a));
    renderCal(); renderSlots(); renderSum();
  }

  const mark = (id, bad) => document.getElementById(id).classList.toggle("invalid", bad);
  function check() {
    const n = !name.value.trim(), k = !kontakt.value.trim();
    mark("fa-name", n); mark("fa-kontakt", k);
    return !n && !k;
  }
  [name, kontakt].forEach(el => el.addEventListener("input", () => { if (form.dataset.tried) check(); }));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (btn.disabled) return;
    form.dataset.tried = "1"; errBox.classList.remove("show");
    if (!check()) { form.querySelector(".invalid input")?.focus(); return; }
    btn.disabled = true; btn.textContent = "Wird gesendet …";
    try {
      const res = await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(new FormData(form)).toString() });
      if (!res.ok) throw new Error(res.status);
      document.getElementById("thanksText").textContent = `${state.a} am ${fmtD.format(state.date)} um ${state.slot} Uhr. ${C.danke}`;
      wrap.classList.add("is-sent");
      document.getElementById("thanks").focus();
    } catch {
      errBox.classList.add("show");
    } finally {
      btn.textContent = btnText; renderSum();
    }
  });
  document.getElementById("again").addEventListener("click", () => {
    form.reset(); delete form.dataset.tried; state.date = null; state.slot = null; render(); wrap.classList.remove("is-sent");
  });
  render();
})();

/* ================= KI-Chatbot ================= */
(() => {
  const fab = document.getElementById("chatFab"), log = document.getElementById("chatLog");
  const form = document.getElementById("chatForm"), input = document.getElementById("chatInput"), send = document.getElementById("chatSend");
  const chips = document.getElementById("chatChips");
  const history = [];
  let busy = false, greeted = false;

  // Eingebaute Antworten mit den Infos der Seite. Greifen, wenn der KI-Dienst
  // nicht erreichbar ist (z. B. lokale Vorschau ohne API-Schlüssel).
  const TEL = C.telefon, MAIL = C.email, ADR = `${C.strasse} in ${C.plzOrt}`;
  const hoursList = () => C.zeilen.map(([tage, zeit]) => `- ${tage}: ${zeit}`).join("\n");
  const dauerList = () => C.anliegen.filter(([, d]) => d).map(([t, d]) => `- ${t}: ${d}`).join("\n");
  const BUCHEN = "- Termin: oben „Termin buchen“ oder " + TEL;
  // Kurz und in Stichpunkten, die erste passende Antwort gewinnt (Reihenfolge zählt)
  // Die ersten INTENTS Einträge sind feste Absichten (vor der Suche), der Rest greift nur, wenn die Suche nichts findet
  const INTENTS = 11;
  const FAQ = [
    [/was (macht|bietet|könnt|koennt|habt) ihr|was (machen|bieten|haben) sie|was gibt es (bei|hier)|überblick|ueberblick|euer angebot|ihr angebot/i, () =>
      `- Meisterwerkstatt für alle Marken (Bosch Car Service)\n- Transporter-Vermietung ab ${(C.miete.tarife[0] || [, , ""])[1]}\n- Gebrauchtwagen, Inzahlungnahme, Finanzierung`],
    [/^(vermietet|verleiht|vermieten|verleihen) (ihr|sie)|kann (man|ich) (bei euch|bei ihnen|hier)? ?(was|etwas|ein auto|autos|einen transporter)? ?(mieten|leihen)\??$/i, () =>
      `Ja, Transporter${C.miete.fahrzeug ? ` (${C.miete.fahrzeug})` : ""}:\n${C.miete.tarife.map(([n, p, t]) => `- ${n}: ${p}${t ? `, ${t}` : ""}`).join("\n")}\n- Reservieren: „Termin buchen“ → „Transporter mieten“`],
    [/^(verkauft|verkaufen) (ihr|sie)/i, () =>
      `Ja:\n${C.verkauf.map(([t]) => `- ${t}`).join("\n")}\n- Beratung: „Termin buchen“ → „Kaufberatung & Probefahrt“`],
    [/hallo|guten (tag|morgen|abend)|^hi\b|servus|moin/i, () => "Guten Tag! Wobei kann ich helfen?"],
    [/danke|vielen dank|super|perfekt/i, () => "Gern geschehen."],
    [/wer bist|bist du|ki\b|künstlich|mensch|\bbot\b|chatbot/i, () => `KI-Chatbot der ${C.name}. Verbindliche Zusagen macht unser Team.`],
    [/warnleucht|kontrollleucht|leuchte|\brauch\b|qualm|lenkung|öl ?verlust|tropft/i, () => `- Rot, Rauch, Lenkung oder Ölverlust: nicht weiterfahren, anrufen: ${TEL}\n- Gelbe Leuchte: Fehlerspeicher auslesen lassen`],
    [/heute|jetzt|gerade|offen|geöffnet|öffnungs|uhrzeit|wann.*(auf|da|zu)|samstag|sonntag|feierabend|schließ/i, () => `${openText().text}.\n${hoursList()}`],
    [/termin|buchen|vereinbar|anmeld|kalender|vorbeikommen|wann kann ich/i, () => `- „Termin buchen“: Anliegen, Tag, Uhrzeit wählen\n- Bis ${C.vorlauf} Tage im Voraus\n- Wir bestätigen per Telefon oder E-Mail\n- Schneller: ${TEL}`],
    [/telefon|anruf|nummer|erreich|mail|kontakt/i, () => `- Telefon: ${TEL}\n- E-Mail: ${MAIL}`],
    [/ersatzwagen|holservice|bringservice|abhol|hol- und|e-auto|elektroauto|hybrid|bezahl|kartenzahlung|ec-karte|\bbar\b|paypal/i, () => `Weiß ich leider nicht sicher.\n- Bitte kurz anrufen: ${TEL}`],
    [/miet|verleih|vermiet|ausleih|umzug|sprinter|\bbus\b|kaution|kilometer|\bkm\b|kost.*transporter|transporter.*kost/i, () =>
      `Transporter mieten${C.miete.fahrzeug ? ` (${C.miete.fahrzeug})` : ""}:\n${C.miete.tarife.map(([n, p, t]) => `- ${n}: ${p}${t ? `, ${t}` : ""}`).join("\n")}\n- ${C.miete.bedingungen.slice(0, 3).join(", ")}\n- Reservieren: „Termin buchen“ → „Transporter mieten“`],
    [/kaufen|verkauf|gebrauchtwagen|gebrauchte|neuwagen|inzahlung|in zahlung|finanzier|leasing|probefahrt|ankauf/i, () =>
      `Ja, wir verkaufen auch:\n${C.verkauf.map(([t]) => `- ${t}`).join("\n")}\n- Beratung: „Termin buchen“ → „Kaufberatung & Probefahrt“`],
    [/preis|kost|teuer|günstig|angebot|€|euro|kostenvoranschlag/i, () =>
      `- Werkstatt: Preis je nach Fahrzeug, kurz anfragen: ${TEL}\n- Transporter mieten ab ${(C.miete.tarife[0] || [, , "auf Anfrage"])[1]}`],
    [/dauer|wie lange|lang dauert|zeit brauch|warten/i, () => `Richtwerte:\n${dauerList()}`],
    [/\bhu\b|\bau\b|tüv|dekra|hauptuntersuchung|abgasuntersuchung|plakette/i, () => `- HU/AU direkt bei uns\n- Dauer ca. 1 Std.\n${BUCHEN}`],
    [/garantie|gewährleistung|scheckheft|serviceheft|inspektion|wartung|durchsicht|service fällig/i, () => `- Nach Herstellervorgaben\n- Herstellergarantie bleibt erhalten\n- Dauer ca. 2–4 Std.`],
    [/reifen|räder|\brad\b|radwechsel|felge|einlager|winter|sommer|achsvermess|spur/i, () => `- Wechsel, Einlagerung, Achsvermessung\n- Radwechsel ca. 30 Min.\n- Faustregel: Winterreifen von O bis O (Oktober bis Ostern)`],
    [/brems|fahrwerk|stoßdämpfer|quietsch|schleif/i, () => `- Beläge, Scheiben, Stoßdämpfer, Achsvermessung\n- Bremse auffällig? Nicht weiterfahren, anrufen: ${TEL}`],
    [/diagnos|fehlerspeicher|fehler|elektronik|geräusch|ruckelt|springt nicht/i, () => `- Fehlerspeicher auslesen\n- Motor, Elektrik, Elektronik\n- Dauer nach Befund`],
    [/unfall|karosserie|delle|kratzer|beule|versicherung|lack|gutacht/i, () => `- Instandsetzung nach Unfall\n- Abwicklung mit der Versicherung\n- Besichtigung ca. 30 Min.`],
    [/glas|steinschlag|scheibe|frontscheibe|riss/i, () => `- Steinschlag-Reparatur und Scheibentausch\n- Steinschlag früh machen, bevor ein Riss entsteht`],
    [/klima/i, () => `- Klimaservice ganzjährig\n- Wartung, Desinfektion, Kältemittel`],
    [/batterie|elektrik|\blicht|lampe|starter|anlasser|lichtmaschine/i, () => `- Batterietest\n- Licht, Starter, Lichtmaschine`],
    [/öl|ölwechsel|filter/i, () => `- Öl mit Herstellerfreigabe\n- Inklusive Filter`],
    [/motor|zahnriem|kupplung|auspuff|partikelfilter|dpf|abgas/i, () => `- Zahnriemen, Kupplung\n- Auspuff, Partikelfilter`],
    [/transporter|flotte|firm|gewerb|lieferwagen/i, () => `- Planbare Wartung für Firmenfahrzeuge\n- Anliegen „Transporter & Flotten“ wählen, wir rufen zurück`],
    [/marke|ford|vw|volkswagen|opel|bmw|audi|mercedes|toyota|skoda|seat|fiat|hyundai|kia|renault|peugeot|bosch/i, () => `- Bosch Car Service\n- Meisterwerkstatt für alle Marken`],
    [/adresse|wo (seid|sind|ist|finde)|anfahrt|\bweg\b|route|egelsbach|park/i, () => `- ${ADR}${C.wissen ? `\n- ${C.wissen}` : ""}`],
  ];
  // Suche über alle Inhalte der Seite (Wissensliste aus content/seite.json)
  const norm = (t) => t.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
  const STOP = new Set("ich du er sie es wir ihr der die das den dem des ein eine einen einem einer und oder aber was wie wo wann warum wer welche welcher welches kann koennt koennen kannst habt haben hat hast gibt gibts geht bei euch ihnen mir mich mein meine meinen fuer mit von zu zum zur im in am an auf aus ist sind seid bin sein auch noch man muss muessen soll sollte viel viele macht machen mach tut tun bitte gerne gern denn mal so schon nur nicht kein keine keinen ja nein dass wenn ob ueber um bis ab uns unser euer eure da hier dort bei mal etwa ca wie lange alles wechselt repariert bietet anbieten angebot leistet".split(" "));
  const PRICE = /preis|kost|teuer|guenstig|euro|€|bezahl|angebot/;
  const TYPE_KEYS = {
    miete: "vermietung vermieten vermietet mieten miete leihen verleih verleiht ausleihen transporter auto autos fahrzeug wagen kilometer",
    verkauf: "verkauf verkaufen verkauft kaufen kauf gebrauchtwagen gebraucht auto autos fahrzeug wagen",
    preis: "preis preise kosten kostet euro",
    termin: "termin termine buchen kalender anmelden vereinbaren reservieren",
    adresse: "wo adresse anfahrt parken parkplatz parkplaetze hof finden",
    kontakt: "telefon nummer email mail anrufen erreichen kontakt",
    firma: "bosch marken marke autohaus werkstatt meister meisterwerkstatt",
    leistung: "werkstatt reparatur reparieren machen",
  };
  const IDX = (C.wissen_liste || []).map(([typ, titel, a]) => ({ typ, titel, a, title: norm(titel), text: norm(`${titel} ${a} ${TYPE_KEYS[typ] || ""}`) }));
  const stem = (w) => (w.length > 6 ? w.slice(0, 5) : w.length > 4 ? w.slice(0, w.length - 1) : w);
  function suche(q) {
    const nq = norm(q), priceIntent = PRICE.test(nq);
    const toks = [...new Set(nq.split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !STOP.has(w) && !PRICE.test(w)).map(stem))];
    if (!toks.length && !priceIntent) return null;
    const df = Object.fromEntries(toks.map((t) => [t, IDX.filter((e) => e.text.includes(t)).length || 1]));
    const scored = IDX.map((e) => {
      let s = 0;
      for (const t of toks) if (e.text.includes(t)) s += (1 + Math.log(IDX.length / df[t])) * (e.title.includes(t) ? 1.5 : 1);
      if (priceIntent && /€/.test(e.a) && s > 0) s += 1.5;
      if (priceIntent && !toks.length && e.typ === "preis") s += 1;
      if (e.typ === "firma") s *= 0.6; // allgemeiner Eintrag nur, wenn nichts Genaueres passt
      return { e, s };
    }).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
    if (!scored.length) return null;
    const best = scored[0].s, top = scored.filter((x) => x.s >= best * 0.85).slice(0, priceIntent && !toks.length ? 10 : 3);
    return top.map(({ e }) => `- ${e.titel ? `${e.titel}: ` : ""}${e.a.replace(/\.? · /g, ", ")}`).join("\n");
  }
  function offline(q) {
    const intent = FAQ.slice(0, INTENTS).find(([re]) => re.test(q));
    if (intent) return intent[1](q);
    const found = suche(q);
    if (found) return PRICE.test(norm(q)) && !found.includes("€") ? `${found}
- Preis: je nach Fahrzeug, kurz anfragen: ${TEL}` : found;
    const hit = FAQ.slice(INTENTS).find(([re]) => re.test(q));
    if (hit) return hit[1](q);
    return `Dazu weiß ich nichts Sicheres.
- Bitte kurz anrufen: ${TEL}`;
  }

  // Text sicher darstellen: Zeilen mit "- " werden zur Liste, Sternchen fallen weg
  function renderMsg(el, text) {
    el.replaceChildren();
    let list = null;
    for (const raw of text.replace(/\*\*/g, "").split(/\n+/)) {
      const line = raw.trim(); if (!line) continue;
      const m = line.match(/^[-•*]\s+(.*)/);
      if (m) {
        if (!list) { list = document.createElement("ul"); el.appendChild(list); }
        const li = document.createElement("li"); li.textContent = m[1]; list.appendChild(li);
      } else {
        list = null;
        const p = document.createElement("p"); p.textContent = line; el.appendChild(p);
      }
    }
  }
  function bubble(cls, text = "") {
    const el = document.createElement("div");
    el.className = "msg " + cls; el.textContent = text;
    log.appendChild(el); log.scrollTop = log.scrollHeight;
    return el;
  }
  // Passendes Anliegen für den Knopf „Termin buchen“ unter einer Antwort
  const KEYS = [[/miet|verleih|leih|umzug/i, /transporter mieten/i], [/kauf|gebraucht|probefahrt|finanz|leasing/i, /kaufberatung/i], [/hu|au|tüv|hauptunters/i, /hu|au/i], [/reifen|räder|\brad\b|winter|sommer/i, /reifen/i], [/unfall|karosser|delle|kratzer|versicherung/i, /unfall/i], [/transporter|flotte|firm/i, /flotte|transporter/i], [/inspektion|wartung|service|öl/i, /inspektion|wartung/i], [/diagnos|reparat|geräusch|warnleucht|motor|kupplung|zahnriem|batterie|auspuff|brems/i, /diagnose|reparatur/i]];
  function cta(context) {
    const hit = KEYS.find(([re]) => re.test(context));
    const target = hit && C.anliegen.find(([t]) => hit[1].test(t));
    const box = document.createElement("div"); box.className = "msg-cta";
    box.innerHTML = `<a href="#termin">Termin buchen</a><a href="tel:${C.telLink}">Anrufen</a>`;
    box.querySelector('a[href="#termin"]').addEventListener("click", () => { if (target) window.pickAnliegen(target[0]); toggle(false); });
    log.appendChild(box); log.scrollTop = log.scrollHeight;
  }
  function toggle(open) {
    document.body.classList.toggle("chat-open", open);
    fab.setAttribute("aria-expanded", open);
    if (open) {
      if (!greeted) { greeted = true; bubble("bot", C.begruessung); }
      if (matchMedia("(hover:hover)").matches) input.focus();
    } else fab.focus({ preventScroll: true });
  }
  async function ask(q) {
    q = q.trim(); if (!q || busy) return;
    busy = true; send.disabled = true; chips.hidden = true;
    bubble("me", q); history.push({ role: "user", content: q });
    input.value = ""; input.style.height = "";
    const wait = bubble("bot wait", "Antwort wird geschrieben …");
    let answer = "", el = null;
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history.slice(-16) }) });
      if (!res.ok || !res.body) throw new Error("offline");
      const reader = res.body.getReader(), dec = new TextDecoder();
      for (;;) {
        const { value, done } = await reader.read(); if (done) break;
        answer += dec.decode(value, { stream: true });
        if (answer.includes("\u0000FEHLER")) throw new Error("offline");
        if (!el && answer.trim()) { wait.remove(); el = bubble("bot"); }
        if (el) { renderMsg(el, answer); log.scrollTop = log.scrollHeight; }
      }
      if (!answer.trim()) throw new Error("offline");
    } catch {
      answer = offline(q);
      wait.remove(); renderMsg(el || (el = bubble("bot")), answer);
    }
    answer = answer.replace("\u0000FEHLER", "").trim();
    history.push({ role: "assistant", content: answer });
    if (/termin|buchen|vereinbar|vorbeikommen|vorbei kommen|wann kann ich/i.test(q) || /„Termin buchen“/.test(answer)) cta(history.filter(m => m.role === "user").map(m => m.content).join(" "));
    busy = false; send.disabled = !input.value.trim();
  }

  fab.addEventListener("click", () => toggle(true));
  document.getElementById("chatClose").addEventListener("click", () => toggle(false));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && document.body.classList.contains("chat-open")) toggle(false); });
  chips.querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => ask(c.textContent)));
  input.addEventListener("input", () => {
    send.disabled = busy || !input.value.trim();
    input.style.height = ""; input.style.height = Math.min(input.scrollHeight, 120) + "px";
  });
  input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input.value); } });
  form.addEventListener("submit", (e) => { e.preventDefault(); ask(input.value); });
})();
