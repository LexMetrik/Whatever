import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePaneKlasse, usePaneKontext } from '../layout/PaneKontext';
import { GRUSS_ANKER_ID, GRUSS_DATEN_JSON, GRUSS_SKRIPT, useHeute } from './Begruessung';

// ─── Erste Ebene des Pults: die Begrüssung (W2·24-R10, D18, D39) ───────────
//
// Referenzbild `abnahme/design-identitaet/pult-freigegeben.html`, Marke `.such`,
// FORTGESCHRIEBEN mit D39 (David 7.9.2026 — s. unten): die Begrüssung kursiv
// in Literata, darunter klein Wochentag, Datum und Uhrzeit. Kein Kasten, keine
// Fläche — Abgrenzung zur Bereichs-Reihe darunter über die Linie (F0.6).
//
// ── D39 (David 7.9.2026) · KEIN TITELBLATT-WORT MEHR, BEGRÜSSUNG WIRD DIE H1 ─
// Wortlaut: «entferne oberhalb der begrüssung das wort Sammlung und dann mach
// die begrüssung prominenter und klarer von dem darunter abgegrenzt. also das
// hallo und dann etwas kleiner datum und uhrzeit.» Bis hierher trug dieser
// Block ZWEI Zeilen: eine eigene `<h1>{SAMMLUNG_TITEL}</h1>` («Sammlung», Archivo
// 12 px) über der Begrüssung, und Wochentag/Datum standen NEBEN dem Gruss in
// derselben Zeile (R10-NACHZUG D14). Jetzt ist die BEGRÜSSUNG selbst die H1
// (kein zweites Element mehr, das den Rang trüge) — `SAMMLUNG_TITEL` bleibt in
// `lib/seo.ts` als Wortmaterial bestehen (Fuss/Marke), verliert hier nur die
// Rolle als eigene Kopfzeile. Wochentag/Datum ziehen in eine EIGENE, kleinere
// Zeile darunter und bekommen dort die Uhrzeit dazu (neu, minütlich
// nachgeführt — s. `Begruessung.tsx`, `useHeute`).
//
// ── D18 (David 6.9.2026) · HIER STEHT KEINE SUCHE MEHR ──────────────────────
// Wortlaut: «insgesamt braucht es auf der startseite keine suche. nur oben
// reicht». Bis hierher trug dieser Block die grosse Hero-Suche
// (`start/UniversalSuche`) und der Streifen oben zeigte auf «/» dafür KEIN Feld.
// Jetzt gilt das Umgekehrte, und zwar app-weit: die EINE Suche ist die
// Kopf-Suche (`layout/HeaderSuche`), auf jeder Route dieselbe. Mit der
// Hero-Suche entfallen zwei Dinge, die nur an ihr hingen:
//   · die BEISPIEL-LINKS («Art. 336c OR · BGE 152 V 52 · …») samt dem Satz «Die
//     Taste / springt hierher» — Sprach-Diät (§Reglement A), und die Taste
//     springt jetzt in den Kopf, nicht hierher;
//   · die `?q=`-KOPPLUNG. Sie war eine echte Funktion (teilbarer Permalink auf
//     eine Suche) und geht nicht verloren, sondern zieht dorthin, wo sie
//     hingehört: `/?q=…` leitet auf `/suche?q=…` weiter (unten). Die
//     Kopf-Suche ist ein Dropdown ohne Adress-Kopplung (bewusst, `HeaderSuche`:
//     «kein ?q=-Umweg»); die Volltext-Seite `pages/Suche.tsx` führt denselben
//     Hook (`useUniversalSuche`, §5) und liest `?q=` seit jeher.
//
// Die Begrüssung bleibt die grosse Zeile (D14, «begrüssung prominenter»).
//
// Aus `start/Hero` hervorgegangen (R3), mit zwei Rückbauten (§17-Gegengewicht):
//   · KEINE MARGINALIE mehr. Titel, Wochentag und Datum standen links in einer
//     150-px-Spalte; das Pult hat keine solche Spalte, und die Angaben stehen
//     jetzt in der Zeile, in der man sie liest.
//   · DIE BESTANDS-AUFZÄHLUNG IST WEG (`SAMMLUNG_BESTAND`, «Gesetze, Entscheide,
//     Materialien, Rechner, Vorlagen.»). Genau diese fünf stehen seit R10 als
//     BEREICHE mit ihren gemessenen Zahlen unmittelbar darunter — der Satz war
//     dieselbe Auskunft ein zweites Mal und gehört zu dem, was David am
//     6.9.2026 als «zu viel text» gesehen hat. Die Konstante selbst bleibt: der
//     Seitenfuss (`layout/Footer`) trägt sie unverändert auf jeder Seite.
//
// A-1-AUSNAHME (R3-α, 31.8.2026), fortgeschrieben mit D39: kein `SeitenTitel`.
// Der Baustein trägt die Seiten-Titelgrösse (`text-h2 sm:text-h1`) und die
// Pane-Kaskade; das Pult hat keine Titelzeile dieser Art — sein Titel IST die
// Begrüssung selbst (bis D39 war es das kleine Titelblatt-Wort daneben, s.
// oben). Eine <h1> bleibt es weiterhin (genau eine je Seite, SICHTBAR —
// `e2e/a11y.e2e.ts` prüft `h1` auf Sichtbarkeit, eine `sr-only`-H1 wäre dort
// rot); GRÖSSE UND RANG laufen jetzt bewusst ZUSAMMEN statt auseinander (die
// frühere GRÖSSE-≠-RANG-Anmerkung ist mit der zweiten Zeile entfallen).
//
// GRÖSSE seit U6 (David 24.9.2026 «etwas kleiner als heute»): eine Stufe
// zurück, `text-h2 lg:text-h1` — 25.6 px @390, 32 px @1440. Der folgende
// D39-Absatz ist der Stand davor (Beleg, nicht nachgeführt).
//
// GRÖSSE (D39, eine Typo-Stufe über dem R10-NACHZUG-Stand D14 — Skala aus
// `tailwind.config.js`, kein neuer Wert): `text-h1 lg:text-display` — 32 px
// @390, 36 px @1440 (zuvor 25.6/32 px). Im Pane misst `@3xl/pane` denselben
// Wechsel an der Pane-Breite statt am Viewport (B-1, `PaneKontext.ts`).
//
// ABGRENZUNG NACH UNTEN (D39, F0.6): `border-b border-rule` — die 1-px-Kante
// im Haus-Ton, NICHT `--rule-soft` (der ist für Zeilen im Satzspiegel reserviert,
// hier grenzt die ganze erste Ebene des Pults gegen die Bereichs-Reihe ab) —
// plus `pb-8`, das zusätzlich zum bestehenden `gap-y-9` des Pult-Rasters
// (`Startseite.tsx`) einen sichtbar grösseren Abstand ergibt als zwischen den
// übrigen Ebenen. Gilt ungestaffelt auch @390 (keine Breakpoint-Ausnahme).

export function SuchBlock() {
  const { gruss, wochentag, datum, uhrzeit } = useHeute();
  const pk = usePaneKlasse();
  const { imPane } = usePaneKontext();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';

  // `/?q=…` — der Permalink, den die frühere Hero-Suche schrieb (D18). Er bleibt
  // gültig und landet auf der Volltext-Suche; ohne `q` passiert nichts. `replace`,
  // damit die Zurück-Taste nicht in einer Schleife auf «/» zurückführt.
  useEffect(() => {
    if (q.trim()) navigate(`/suche?q=${encodeURIComponent(q.trim())}`, { replace: true });
  }, [q, navigate]);

  // U6 «Kopfzeile ruhig» (David 24.9.2026, FAHRPLAN-WERKBANK-UMBAU §5d-bis):
  // Gruss links, Datum rechts auf derselben Grundlinie (`items-baseline`), die
  // Linie darunter über die VOLLE Inhaltsbreite — der Breiten-Deckel
  // `max-w-[54rem]` (Referenzbild `.such{max-width:860px}`) liess sie über den
  // Kacheln enden und ist darum gestrichen. Weniger Leerraum (`pb-3` statt
  // `pb-8`, Startseite `-mt-3`). Telefon: Gruss und Datum untereinander
  // (`flex-col`), ab `sm` nebeneinander. Die Kinderfolge h1 → pools → wahl → p
  // bleibt unverändert (das Skript liest seine Vorgänger und die h1 im selben
  // Elternknoten); die beiden <script> sind `display:none` und keine Flex-Items
  // mit Fläche.
  return (
    <div className={`flex flex-col gap-y-1 border-b border-rule pb-3 ${pk('sm:flex-row sm:items-baseline sm:justify-between sm:gap-x-6', '@xl/pane:flex-row @xl/pane:items-baseline @xl/pane:justify-between @xl/pane:gap-x-6')}`}>
      {/* Gruss kommt aus `useHeute`. Im Server-HTML steht der Build-Gruss
          (Fallback ohne JavaScript); die zwei <script> direkt danach tauschen
          ihn noch VOR dem ersten Paint gegen einen Gruss der Besuchsstunde
          (16.9.2026, Entscheid David «a» — Herleitung, CSP-Hash und Wächter
          in `Begruessung.tsx`), und der Client übernimmt genau diesen Text:
          kein Tausch nach dem JS-Download (QS-PERF #879, LCP). Die Reihenfolge
          h1 → pools → wahl ist tragend: das Skript liest seine Vorgänger.
          `suppressHydrationWarning` bleibt als Vorsichtsmassnahme stehen; unter
          `hydrateRoot` stimmt der Client-Text ohnehin mit dem umgeschriebenen
          DOM überein. */}
      <h1 suppressHydrationWarning
        className={`min-w-0 font-serif italic text-ink-900 ${pk('text-h2 lg:text-h1', 'text-h2 @3xl/pane:text-h1')}`}>
        {gruss}
      </h1>
      <script type="application/json" data-gruss="pools" dangerouslySetInnerHTML={{ __html: GRUSS_DATEN_JSON }} />
      <script data-gruss="wahl" dangerouslySetInnerHTML={{ __html: GRUSS_SKRIPT }} />
      {/* Wochentag/Datum/Uhrzeit — kleiner, EIGENE Zeile unter der Begrüssung
          (D39). Die Uhrzeit ist `null` vor der Hydration (Prerender UND erster
          Client-Render, `Begruessung.tsx`); der Platz dafür ist über
          `visibility:hidden` an einem `00:00`-Platzhalter UNVERÄNDERT von
          Anfang an reserviert (beide unter `.num` tabellarisch gleich breit),
          statt erst beim Erscheinen der echten Zeit zu öffnen — kein CLS
          (§15). Datum trägt ebenfalls `suppressHydrationWarning` (Build- vs.
          Client-Tag). */}
      {/* id = Anker der Render-Sperre (`GRUSS_ANKER_ID`, Herleitung in
          `Begruessung.tsx`): muss das Element DIREKT hinter dem Wahl-Skript
          tragen. Im Pane nicht — dort läuft kein Skript, und die id bliebe
          sonst neben der Hauptseite doppelt im Dokument. */}
      <p id={imPane ? undefined : GRUSS_ANKER_ID} className="num shrink-0 font-sans text-xs text-ink-500">
        <span suppressHydrationWarning>{wochentag}, {datum}</span>
        <span suppressHydrationWarning style={{ visibility: uhrzeit ? 'visible' : 'hidden' }}>
          {' '}· {uhrzeit ?? '00:00'}
        </span>
      </p>
    </div>
  );
}
