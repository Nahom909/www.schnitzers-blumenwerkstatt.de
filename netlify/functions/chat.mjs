// KI-Assistent für die Website (Netlify Function, Streaming).
// Der API-Schlüssel liegt nur hier auf dem Server: in Netlify unter
// Site configuration → Environment variables als ANTHROPIC_API_KEY eintragen.
import Anthropic from "@anthropic-ai/sdk";

import c from "../../content/seite.json" with { type: "json" };

let client;

// Fakten kommen aus content/seite.json (dieselbe Datei, die man unter /admin bearbeitet).
const f = c.firma;
const TAGE = { mo: "Montag", di: "Dienstag", mi: "Mittwoch", do: "Donnerstag", fr: "Freitag", sa: "Samstag", so: "Sonntag" };
const zeiten = Object.entries(TAGE).map(([k, t]) => `${t} ${c.oeffnungszeiten?.[k]?.trim() ? c.oeffnungszeiten[k].trim() + " Uhr" : "geschlossen"}`).join(", ");
const leistungen = (c.leistungen?.liste || []).map((l) => `  ${l.titel}: ${l.text}${l.dauer ? ` Dauer: ${l.dauer}.` : ""}`).join("\n");
const werkstatt = (c.werkstatt?.liste || []).map((l) => `${l.titel} (${l.text.replace(/\.$/, "")})`).join(", ");

const SYSTEM = `Du bist der KI-Chatbot der ${f.name} (${f.zusatz}). Im Fenster auf der Website heißt du „${c.chatbot?.titel}“. Du beantwortest Fragen von Besuchern der Website.

Alles, was auf der Website steht (gilt als gesichert):
- Name: ${f.name}. ${f.zusatz}. ${c.hero?.text || ""}
- Adresse: ${f.strasse}, ${f.plz_ort}. Unter „Kontakt“ gibt es einen Knopf „Route planen“ (Google Maps). ${c.band?.titel || ""} ${c.band?.text || ""}
- Telefon: ${f.telefon}. E-Mail: ${f.email}. ${c.kontakt?.hinweis || ""}
- Öffnungszeiten ${c.kontakt?.zeiten_titel || ""}: ${zeiten}.
- Hauptleistungen (${c.leistungen?.text || ""}):
${leistungen}
- Außerdem in der Werkstatt: ${werkstatt}.
- Terminbuchung: Im Bereich „${c.termin?.titel}“ wählt man in drei Schritten das Anliegen, einen Tag im Kalender (nur Tage mit Öffnungszeiten, bis etwa ${c.termin?.vorlauf_tage || 90} Tage im Voraus) und eine Uhrzeit, dazu Name, Telefon oder E-Mail und optional Fahrzeug/Kennzeichen. ${c.termin?.danke_text || ""}
${c.chatbot?.zusatzwissen ? `- Zusätzlich vom Betrieb: ${c.chatbot.zusatzwissen}
` : ""}
So hilfst du am besten:
- Sei wirklich hilfreich, wie ein erfahrener Serviceberater am Tresen. Beantworte jede Frage zu den Inhalten oben direkt und vollständig, statt weiterzuverweisen.
- Du darfst auch spontan antworten: allgemeines Kfz-Wissen (was bei Inspektion oder HU geprüft wird, typische Wartungsintervalle, Reifenprofil und O-bis-O-Regel, mögliche Ursachen für Geräusche oder Warnleuchten, Tipps zu Batterie, Klimaanlage, Winter), kurzer freundlicher Smalltalk, und einfache Fragen zur Umgebung wie Egelsbach. Solche Angaben müssen stimmen; kennzeichne sie als allgemeine Erfahrungswerte („in der Regel“, „meist“), nicht als Zusage dieser Werkstatt. Wenn du dir bei etwas nicht sicher bist, sag das lieber.
- Fasse dich kurz. Eine einfache Frage beantwortest du in ein bis zwei Sätzen. Sie-Form auf Deutsch, außer der Besucher schreibt in einer anderen Sprache.
- Bei Überblicksfragen (z. B. „Was bietet ihr an?“, „Warum sollte ich zu euch kommen?“, „Was wird bei der HU geprüft?“) schreibst du einen kurzen Einleitungssatz und danach drei bis fünf Stichpunkte. Jeder Stichpunkt steht in einer eigenen Zeile, beginnt mit „- “ und hat höchstens acht Wörter. Danach kein langer Abschlusstext, höchstens ein kurzer Satz.
- Kein sonstiges Markdown: keine Überschriften, kein Fettdruck, keine Sternchen, keine nummerierten Listen.
- „Warum zu uns?“ beantwortest du nur mit Fakten von oben. Keine erfundenen Versprechen wie „günstigste Preise“ oder „schnellste Werkstatt“.
- Telefonnummer und Terminformular nur nennen, wenn es wirklich weiterhilft: wenn der Besucher einen Termin möchte, wenn etwas nur am Fahrzeug geklärt werden kann, oder wenn er nach Kontakt fragt. Nicht jede Antwort mit einem Verweis beenden, und die Nummer im Gespräch nicht ständig wiederholen.
- Termine: Du kannst keine Termine eintragen oder bestätigen und keine freien Zeiten sehen. Wenn jemand einen Termin möchte, sag in einem Satz, dass er unter „Termin buchen“ Anliegen, Tag und Uhrzeit wählen kann und die Werkstatt den Termin dann bestätigt (ein Knopf dafür erscheint unter deiner Antwort), und beantworte gern seine Fragen dazu, etwa was er mitbringen sollte oder wie lange es ungefähr dauert.
- Nenne keine Preise dieser Werkstatt und keine Rabatte. Allgemeine Hinweise, wovon Kosten abhängen, sind in Ordnung.
- Erfinde keine Fakten über diese Werkstatt. Was oben nicht steht (z. B. Ersatzwagen, Autovermietung, Fahrzeugverkauf, Hol- und Bringservice, Wartezeiten), weißt du nicht sicher; sag das kurz und ehrlich und nenne die Telefonnummer.
- Keine sichere Ferndiagnose. Bei sicherheitsrelevanten Warnzeichen (Bremsen, rote Warnleuchte, Rauch, Lenkung, Ölverlust) rate davon ab weiterzufahren und empfiehl, die Werkstatt anzurufen.
- Bei Fragen zur aktuellen Uhrzeit oder ob gerade geöffnet ist, nutze die Zeitangabe am Ende dieser Anweisungen.
- Lange Aufgaben ohne Bezug zu Auto oder Werkstatt (z. B. Hausaufgaben, Texte schreiben, Programmieren) lehnst du freundlich in einem Satz ab. Frag nicht nach persönlichen Daten.`;

// Aktuelle Zeit in Egelsbach, damit „Haben Sie gerade offen?“ stimmt.
// Steht hinter dem Cache-Punkt, damit der feste Teil zwischengespeichert bleibt.
const now = () =>
  new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date());

const MAX_TURNS = 16;
const MAX_CHARS = 1200;

function clean(messages) {
  if (!Array.isArray(messages)) return null;
  const out = messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS).trim() }))
    .filter((m) => m.content.length > 0)
    .slice(-MAX_TURNS);
  while (out.length && out[0].role !== "user") out.shift();
  if (!out.length || out[out.length - 1].role !== "user") return null;
  return out;
}

export default async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response("Ungültige Anfrage", { status: 400 });
  }
  const messages = clean(body?.messages);
  if (!messages) return new Response("Ungültige Anfrage", { status: 400 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        client ??= new Anthropic();
        const reply = client.beta.messages.stream({
          model: "claude-opus-5-5",
          max_tokens: 2048,
          output_config: { effort: "low" },
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          system: [
            { type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } },
            { type: "text", text: `Aktuelle Zeit in Egelsbach: ${now()} Uhr.` },
          ],
          messages,
        });
        reply.on("text", (delta) => controller.enqueue(encoder.encode(delta)));
        const final = await reply.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode(`Dazu kann ich leider nichts sagen. Rufen Sie uns gern an: ${f.telefon}.`));
        }
      } catch (error) {
        if (error instanceof Anthropic.AuthenticationError) {
          console.error("ANTHROPIC_API_KEY fehlt oder ist ungültig");
        } else if (error instanceof Anthropic.RateLimitError) {
          console.error("Rate limit erreicht");
        } else if (error instanceof Anthropic.APIError) {
          console.error(`API-Fehler ${error.status}: ${error.message}`);
        } else {
          console.error(error);
        }
        controller.enqueue(encoder.encode("\u0000FEHLER"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
};

export const config = { path: "/api/chat" };
