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

/* ================= Hero verblasst beim Scrollen ================= */
(() => {
  const hero = document.querySelector(".hero"), inner = document.querySelector(".hero-inner");
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let raf = 0;
  const update = () => {
    raf = 0;
    const p = Math.min(1, Math.max(0, scrollY / (hero.offsetHeight * 0.9)));
    inner.style.opacity = (1 - p).toFixed(3);
  };
  addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  update();
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
  const hoursText = () => C.zeilen.map(([tage, zeit]) => `${tage} ${zeit}`).join(", ") + ".";
  const dauerText = () => C.anliegen.map(([t, d]) => `${t}: ${d}`).join(", ") + ".";
  const FAQ = [
    [/hallo|guten (tag|morgen|abend)|^hi\b|servus|moin/i, () => "Guten Tag! Fragen Sie mich gern zu unserer Werkstatt, zu Leistungen, Öffnungszeiten, Terminen oder allgemein rund ums Auto."],
    [/danke|vielen dank|super|perfekt/i, () => "Gern geschehen. Wenn noch etwas offen ist, fragen Sie einfach."],
    [/wer bist|bist du|ki\b|künstlich|mensch|bot/i, () => `Ich bin der KI-Chatbot der ${C.name} und beantworte Fragen rund um die Werkstatt. Verbindliche Zusagen macht unser Team persönlich.`],
    [/heute|jetzt|gerade|offen|geöffnet|öffnungs|uhrzeit|wann.*(auf|da|zu)|samstag|sonntag|feierabend|schließ/i, () => `${openText().text}. Unsere Zeiten: ${hoursText()}`],
    [/termin|buchen|vereinbar|anmeld|kalender|vorbeikommen|wann kann ich/i, () => `Unter „Termin buchen“ wählen Sie Ihr Anliegen, einen Tag im Kalender und eine Uhrzeit, dazu Name und Telefon oder E-Mail. Wir bestätigen den Termin dann per Telefon oder E-Mail. Schneller geht es telefonisch: ${TEL}.`],
    [/preis|kost|teuer|günstig|angebot|€|euro|kostenvoranschlag/i, () => `Feste Preise nennen wir hier nicht, weil sie vom Fahrzeug und vom Umfang abhängen. Für eine Inspektion zählen zum Beispiel Modell, Laufleistung und das Wartungsintervall laut Serviceheft. Ein kurzer Anruf unter ${TEL} bringt Ihnen eine verlässliche Auskunft.`],
    [/dauer|wie lange|lang dauert|zeit brauch|warten/i, () => `Grobe Richtwerte: ${dauerText()}`],
    [/\bhu\b|\bau\b|tüv|dekra|hauptuntersuchung|abgasuntersuchung|plakette/i, () => "Ja, HU und AU machen wir direkt bei uns im Haus. Rechnen Sie mit etwa einer Stunde."],
    [/garantie|gewährleistung|scheckheft|serviceheft|inspektion|wartung|durchsicht|service fällig/i, () => "Wir warten nach Herstellervorgaben, Ihre Herstellergarantie bleibt also erhalten. Eine Inspektion dauert je nach Umfang etwa zwei bis vier Stunden."],
    [/reifen|räder|\brad\b|radwechsel|felge|einlager|winter|sommer|achsvermess|spur/i, () => "Wir wechseln Reifen und Räder, lagern sie ein und vermessen die Achse. Ein Reifenwechsel dauert etwa 30 Minuten. Als Faustregel gilt: Winterreifen von O bis O, also etwa Oktober bis Ostern."],
    [/brems|fahrwerk|stoßdämpfer|quietsch|schleif/i, () => `Bremsen und Fahrwerk machen wir komplett: Beläge, Scheiben, Stoßdämpfer und Achsvermessung. Wenn die Bremse auffällig ist, fahren Sie bitte nicht weiter und rufen Sie uns an: ${TEL}.`],
    [/warnleucht|kontrollleucht|leuchte|rauch|lenkung|öl ?verlust|tropft/i, () => `Bei einer roten Warnleuchte, Rauch, Problemen mit Bremsen oder Lenkung oder Ölverlust fahren Sie bitte nicht weiter und rufen Sie uns an: ${TEL}. Gelbe Leuchten lesen wir per Diagnose aus dem Fehlerspeicher aus.`],
    [/diagnos|fehlerspeicher|fehler|elektronik|geräusch|ruckelt|springt nicht/i, () => "Wir lesen den Fehlerspeicher aus und prüfen Motor, Elektrik und Elektronik. Wie lange die Reparatur dauert, hängt vom Befund ab."],
    [/unfall|karosserie|delle|kratzer|beule|versicherung|lack|gutacht/i, () => "Nach einem Unfall setzen wir Ihr Fahrzeug instand und übernehmen die Abwicklung mit der Versicherung. Eine Besichtigung dauert etwa 30 Minuten."],
    [/glas|steinschlag|scheibe|frontscheibe|riss/i, () => "Steinschläge reparieren wir, und Scheiben tauschen wir auch. Ein Steinschlag sollte früh gemacht werden, bevor ein Riss entsteht."],
    [/klima/i, () => "Den Klimaservice machen wir das ganze Jahr: Wartung, Desinfektion und Kältemittel."],
    [/batterie|elektrik|\blicht|lampe|starter|anlasser|lichtmaschine/i, () => "Wir testen die Batterie und prüfen Licht, Starter und Lichtmaschine."],
    [/öl|ölwechsel|filter/i, () => "Den Ölwechsel machen wir mit Öl, das der Hersteller freigegeben hat, inklusive Filter."],
    [/motor|zahnriem|kupplung|auspuff|partikelfilter|dpf|abgas/i, () => "Auch Arbeiten an Motor und Abgasanlage gehören dazu: Zahnriemen, Kupplung, Auspuff und Partikelfilter."],
    [/transporter|flotte|firm|gewerb|lieferwagen/i, () => "Für Transporter und Firmenflotten planen wir die Wartung so, dass möglichst wenig Ausfallzeit entsteht. Wählen Sie bei „Termin buchen“ das passende Anliegen, dann rufen wir Sie zur Planung an."],
    [/marke|ford|vw|volkswagen|opel|bmw|audi|mercedes|toyota|skoda|seat|fiat|hyundai|kia|renault|peugeot|bosch/i, () => "Als Bosch Car Service sind wir eine Meisterwerkstatt für alle Marken."],
    [/adresse|wo (seid|sind|ist|finde)|anfahrt|\bweg\b|route|egelsbach/i, () => `Sie finden uns am ${ADR}. ${C.wissen || ""}`.trim()],
    [/park/i, () => C.wissen || `Sie finden uns am ${ADR}.`],
    [/telefon|anruf|nummer|erreich|mail|kontakt/i, () => `Sie erreichen uns unter ${TEL} oder per E-Mail an ${MAIL}.`],
    [/ersatzwagen|leihwagen|mietwagen|vermiet|verleih|miete|holservice|bringservice|abhol|hol- und|e-auto|elektroauto|hybrid|bezahl|kartenzahlung|ec-karte|\bbar\b|paypal/i, () => `Dazu steht auf unserer Seite nichts, deshalb möchte ich Ihnen nichts Falsches sagen. Fragen Sie am besten kurz telefonisch nach: ${TEL}.`],
  ];
  function offline(q) {
    const hits = FAQ.filter(([re]) => re.test(q)).slice(0, 2).map(([, fn]) => fn());
    if (hits.length) return [...new Set(hits)].join("\n");
    return `Das kann ich Ihnen leider nicht sicher beantworten. Ich helfe gern bei Leistungen, Öffnungszeiten, Terminen, Dauer von Arbeiten oder Anfahrt. Alles andere klärt unser Team persönlich unter ${TEL}.`;
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
  const KEYS = [[/hu|au|tüv|hauptunters/i, /hu|au/i], [/reifen|räder|\brad\b|winter|sommer/i, /reifen/i], [/unfall|karosser|delle|kratzer|versicherung/i, /unfall/i], [/transporter|flotte|firm/i, /flotte|transporter/i], [/inspektion|wartung|service|öl/i, /inspektion|wartung/i], [/diagnos|reparat|geräusch|warnleucht|motor|kupplung|zahnriem|batterie|auspuff|brems/i, /diagnose|reparatur/i]];
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
