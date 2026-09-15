import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePaneKlasse } from '../layout/PaneKontext';
import { useHeute } from './Begruessung';

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
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';

  // `/?q=…` — der Permalink, den die frühere Hero-Suche schrieb (D18). Er bleibt
  // gültig und landet auf der Volltext-Suche; ohne `q` passiert nichts. `replace`,
  // damit die Zurück-Taste nicht in einer Schleife auf «/» zurückführt.
  useEffect(() => {
    if (q.trim()) navigate(`/suche?q=${encodeURIComponent(q.trim())}`, { replace: true });
  }, [q, navigate]);

  // Breiten-Deckel wie im Referenzbild (`.such{max-width:860px}`).
  return (
    <div className="max-w-[54rem] border-b border-rule pb-8">
      {/* Gruss kommt aus `useHeute` — seit QS-PERF (15.9.2026) deterministisch
          aus dem Build-Seed, also IDENTISCH zwischen Prerender und Client
          (`lib/begruessungen.ts`, `waehleBegruessungFuerBuild`); kein Tausch
          mehr nach dem Mount. `suppressHydrationWarning` bleibt als
          Bau-then-replace-Vorsichtsmassnahme stehen (kein `hydrateRoot`,
          `docs/ssg-diagnose.md` §5), ist aber nicht mehr wegen einer
          erwarteten Text-Abweichung nötig. */}
      <h1 suppressHydrationWarning
        className={`font-serif italic text-ink-900 ${pk('text-h1 lg:text-display', 'text-h1 @3xl/pane:text-display')}`}>
        {gruss}
      </h1>
      {/* Wochentag/Datum/Uhrzeit — kleiner, EIGENE Zeile unter der Begrüssung
          (D39). ALLE DREI sind `null` vor der Hydration (Prerender UND erster
          Client-Render, `Begruessung.tsx`) und kommen erst aus dem
          Mount-Effect: welchen Tag und welche Stunde der Besucher hat, kann
          ein Prerender nicht wissen. Der Platz ist für beide über
          `visibility:hidden` an einem Platzhalter von Anfang an reserviert
          (Ziffern unter `.num` tabellarisch gleich breit), statt erst beim
          Erscheinen des echten Werts zu öffnen — kein CLS (§15).
          KEIN `suppressHydrationWarning` mehr an dieser Zeile, und das ist der
          Punkt: unter `hydrateRoot` hiesse Unterdrücken, dass React den
          SERVER-Text stehen lässt — die Zeile zeigte dann dauerhaft das
          Baudatum (Herleitung und Messung in `Begruessung.tsx`). Server- und
          erster Client-Render sind hier jetzt zeichengleich, es gibt nichts zu
          unterdrücken. */}
      <p className="num mt-1.5 font-sans text-xs text-ink-500">
        <span style={{ visibility: datum ? 'visible' : 'hidden' }}>
          {wochentag ?? 'Montag'}, {datum ?? '1. Januar 2026'}
        </span>
        <span style={{ visibility: uhrzeit ? 'visible' : 'hidden' }}>
          {' '}· {uhrzeit ?? '00:00'}
        </span>
      </p>
    </div>
  );
}
