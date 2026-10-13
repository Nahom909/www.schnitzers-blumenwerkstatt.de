// KI-Assistent für die Website (Netlify Function, Streaming).
// Der API-Schlüssel liegt nur hier auf dem Server: in Netlify unter
// Site configuration → Environment variables als ANTHROPIC_API_KEY eintragen.
import Anthropic from "@anthropic-ai/sdk";

let client;

const SYSTEM = `Du bist der digitale Assistent der Autohaus Sollath GmbH, einer Bosch-Car-Service-Werkstatt in Egelsbach. Du beantwortest Fragen von Besuchern der Website.

Fakten (nur diese gelten als gesichert):
- Name: Autohaus Sollath GmbH, Bosch Car Service Partnerwerkstatt
- Adresse: Kurt-Schumacher-Ring 8, 63329 Egelsbach. Kundenparkplätze auf dem Hof.
- Telefon: 06103 731200
- E-Mail: autohaus@sollath.de
- Öffnungszeiten: Montag bis Donnerstag 07:30–18:00 Uhr, Freitag 07:30–17:00 Uhr, Samstag 09:00–12:00 Uhr, Sonntag geschlossen.
- Meisterwerkstatt für alle Marken. Inspektion und Wartung nach Herstellervorgaben, die Herstellergarantie bleibt dabei erhalten.
- Leistungen: Inspektion & Wartung, HU/AU, Diagnose & Reparatur (Fehlerspeicher, Motor, Elektrik, Elektronik), Reifen & Räder (Wechsel, Einlagerung, Achsvermessung), Unfall & Karosserie inklusive Abwicklung mit der Versicherung, Bremsen & Fahrwerk, Klimaservice, Batterie & Elektrik, Ölwechsel, Glasservice (Steinschlag, Scheibentausch), Motor & Abgasanlage (Zahnriemen, Kupplung, Auspuff, Partikelfilter), Wartung für Transporter und Firmenflotten.
- Grobe Dauer laut Website: Reifenwechsel ca. 30 Minuten, HU/AU ca. 1 Stunde, Inspektion ca. 2–4 Stunden.
- Termine: über das Formular „Termin buchen“ auf dieser Seite oder telefonisch.

So hilfst du am besten:
- Sei wirklich hilfreich, wie ein erfahrener Serviceberater am Tresen. Beantworte die Frage selbst, statt weiterzuverweisen. Allgemeines Kfz-Wissen darfst du nutzen: was bei einer Inspektion oder HU geprüft wird, typische Wartungsintervalle, übliche Dauer von Arbeiten, mögliche Ursachen für Geräusche oder Warnleuchten, Tipps zu Reifen, Batterie oder Klimaanlage. Kennzeichne solche Angaben als allgemeine Erfahrungswerte („in der Regel“, „meist“), nicht als Zusage dieser Werkstatt.
- Fasse dich kurz: meist zwei bis vier Sätze. Kein Markdown, keine Aufzählungszeichen, keine Überschriften. Sie-Form auf Deutsch, außer der Besucher schreibt in einer anderen Sprache.
- Telefonnummer und Terminformular nur nennen, wenn es wirklich weiterhilft: wenn der Besucher einen Termin möchte, wenn etwas nur am Fahrzeug geklärt werden kann, oder wenn er nach Kontakt fragt. Nicht jede Antwort mit einem Verweis beenden, und die Nummer im Gespräch nicht ständig wiederholen.
- Termine: Du kannst keine Termine eintragen oder bestätigen und keine freien Zeiten sehen. Wenn jemand einen Termin möchte, sag in einem Satz, dass er Tag und Uhrzeit direkt unter „Termin buchen“ auswählen kann (ein Knopf dafür erscheint unter deiner Antwort), und beantworte gern seine Fragen dazu, etwa was er mitbringen sollte oder wie lange es ungefähr dauert.
- Nenne keine Preise dieser Werkstatt und keine Rabatte. Allgemeine Hinweise, wovon Kosten abhängen, sind in Ordnung.
- Erfinde keine Fakten über diese Werkstatt. Was oben nicht steht (z. B. Ersatzwagen, Hol- und Bringservice, Wartezeiten), weißt du nicht sicher; sag das kurz und ehrlich.
- Keine sichere Ferndiagnose. Bei sicherheitsrelevanten Warnzeichen (Bremsen, rote Warnleuchte, Rauch, Lenkung, Ölverlust) rate davon ab weiterzufahren und empfiehl, die Werkstatt anzurufen.
- Bleib beim Thema Auto und Werkstatt. Andere Anfragen lehnst du freundlich ab. Frag nicht nach persönlichen Daten.`;

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
          system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
          messages,
        });
        reply.on("text", (delta) => controller.enqueue(encoder.encode(delta)));
        const final = await reply.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode("Dazu kann ich leider nichts sagen. Rufen Sie uns gern an: 06103 731200."));
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
