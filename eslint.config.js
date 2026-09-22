import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// ── ARIA_ZUSTANDSNAME · zugänglicher Name darf den Zustand nicht mitführen ───
// (QS-UI Teilpass (e), §17-Sweep aus dem Vorfall vom 4.9.2026.)
//
// BEFUND, gemessen an /gesetze/bund/GEBV_HREG (11 Artikel, kleinster Erlass):
// `aria-label={offen ? 'Artikel einklappen' : 'Artikel ausklappen'}` neben
// `aria-expanded` — zwölf Knöpfe mit WORTGLEICHEM Namen auf einer Seite (auf
// dem OR wären es 1099). Drei Schäden, alle WCAG 4.1.2:
//   1. der Name benennt nicht, WAS bedient wird → in der Knopf-Liste eines
//      Screenreaders sind die Knöpfe ununterscheidbar;
//   2. der Zustand steht doppelt — einmal in `aria-expanded`, einmal im Namen
//      («Artikel einklappen, erweitert»);
//   3. der Name WECHSELT beim Klick → Sprachsteuerung («klicke Artikel
//      einklappen») zielt danach auf einen Namen, den es nicht mehr gibt.
// Richtig ist: der Name benennt konstant das Ding, das Zustands-Attribut
// benennt den Zustand.
//
// ZWEI Verengungen halten die Regel falsch-rot-frei (§6.7 «ein flackerndes Tor
// ist schlechter als keines»), beide am Bestand gemessen:
//   · nur wo ein Zustands-Attribut DANEBEN steht — ohne aria-expanded/pressed
//     darf ein Name selbstverständlich die Lage beschreiben;
//   · nur wenn BEIDE Zweige String-Literale sind. Zwei fest verdrahtete Namen
//     nebeneinander sind praktisch immer «der Name trägt den Zustand». Ein
//     datenabhängiger Name (`waehlbar ? name(k) : `${name(k)} — keine Erlasse``
//     in SchweizKarte.tsx, neben `aria-pressed`) fällt damit heraus: die
//     Bedingung ist die Datenlage, nicht der Zustand, und der Name ist je
//     Kanton stabil. Vor dieser zweiten Verengung war genau das der einzige
//     Falsch-Treffer des ersten Laufs.
// Rot-Beweis (Kommando + Ausgabe) im PR-Body.
const ARIA_ZUSTANDSNAME = {
  selector: 'JSXOpeningElement:has(JSXAttribute[name.name=/^aria-(expanded|pressed|selected|checked)$/]) > JSXAttribute[name.name="aria-label"] > JSXExpressionContainer > ConditionalExpression[consequent.type="Literal"][alternate.type="Literal"]',
  message: 'WCAG 4.1.2: aria-label darf den Zustand nicht mitführen, wenn aria-expanded/pressed/selected/checked ihn schon trägt — konstanter Name, der das BEDIENTE Ding benennt (Zustand bleibt beim ARIA-Attribut).',
}

// R2-Selektoren des Normtext-Lesers (Herleitung unten am Block). Als Konstante,
// weil `no-restricted-syntax` in Flat-Config nicht MERGT: ein späterer Block
// ERSETZT die Optionen eines früheren für dieselbe Datei. Der Leser-Block muss
// ARIA_ZUSTANDSNAME darum ausdrücklich mitführen, sonst gälte dort nur noch die
// eine oder die andere Regel — still.
const NORMTEXT_MAXW = [
  { selector: 'Literal[value=/max-w-\\[[0-9.]+rem\\]/]', message: 'R2 (Linien-/Typo-Kanon): keine arbitrary max-w-[…rem] im Normtext-Reader — nur max-w-reading / max-w-content (Token).' },
  { selector: 'TemplateElement[value.raw=/max-w-\\[[0-9.]+rem\\]/]', message: 'R2 (Linien-/Typo-Kanon): keine arbitrary max-w-[…rem] im Normtext-Reader — nur max-w-reading / max-w-content (Token).' },
]

export default defineConfig([
  // .claude: Agent-Worktrees (isolierte Arbeitskopien) nicht mitlinten —
  // sonst kippen Läufe durch halbfertige Stände fremder Sessions (6.6.2026).
  // .scratch: gitignorierte Wegwerf-Skripte/Messläufe — machten das Gate rot,
  // obwohl sie nie deployt werden (8.8.2026, QS-SKILL-DIAET-Session; eslint
  // liest .gitignore nicht von selbst).
  globalIgnores(['dist', '.claude', '.scratch']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  // §2 Determinismus mechanisch gesperrt (FAHRPLAN-GRUNDLAGEN G2/A2): in der
  // Logikschicht src/lib/** sind Date.now(), Math.random() und arg-loses
  // new Date() verboten — gleiche Eingabe muss gleiche Ausgabe geben;
  // Stichtage/Zufall sind als Eingabe zu führen. Ausnahme src/lib/pdf/**:
  // der Erstellungs-Zeitstempel im PDF-Kopf ist Darstellung, nicht
  // Rechtslogik (die Engine-Ergebnisse stehen dort bereits fest).
  {
    files: ['src/lib/**/*.{ts,tsx}'],
    ignores: ['src/lib/pdf/**'],
    rules: {
      'no-restricted-properties': ['error',
        { object: 'Date', property: 'now', message: '§2 Determinismus: kein Date.now() in src/lib — Stichtag als Eingabe führen.' },
        { object: 'Math', property: 'random', message: '§2 Determinismus: kein Math.random() in src/lib.' },
        { object: 'performance', property: 'now', message: '§2 Determinismus: kein performance.now() in src/lib.' },
      ],
      'no-restricted-syntax': ['error',
        { selector: 'NewExpression[callee.name="Date"][arguments.length=0]', message: '§2 Determinismus: arg-loses new Date() in src/lib — Datum als Eingabe führen.' },
        { selector: 'CallExpression[callee.name="Date"]', message: '§2 Determinismus: Date() als Funktionsaufruf liefert die aktuelle Zeit — in src/lib verboten.' },
      ],
    },
  },
  // §3 Schichtentrennung mechanisch gesperrt (QS-AUDIT-VERWEISE 8.8.2026,
  // Übertragung des §2-Musters): Darstellungsschicht rechnet keine Fristen —
  // Datums-Arithmetik gehört in src/lib (eine Rechtsregel, eine Stelle).
  // Bestand beim Bau: einzig DatumsFeld.tsx (Kalender-Raster-Navigation,
  // begründet per Inline-Ausnahme gegrandfathert).
  {
    files: ['src/pages/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{
          name: 'date-fns',
          importNames: [
            'addDays', 'addBusinessDays', 'addWeeks', 'addMonths', 'addYears',
            'subDays', 'subWeeks', 'subMonths', 'subYears',
            'differenceInDays', 'differenceInCalendarDays', 'differenceInBusinessDays',
            'differenceInMonths', 'differenceInYears',
          ],
          message: '§3 Schichtentrennung: Datums-Arithmetik ist Rechtslogik-nah und lebt in src/lib (Engine/fristen) — die Darstellungsschicht rendert Ergebnisse, sie rechnet keine.',
        }],
      }],
    },
  },
  // R2 (W2·5d G1 / DESIGN-REGLEMENT §N-4b Lese-Typografie): der Normtext-Reader
  // verwendet KEINE arbitrary rem-basierte `max-w-[…rem]` mehr — die Lesespalte
  // kommt ausschliesslich aus den Tokens `max-w-reading` (40rem) bzw.
  // `max-w-content`. So kann keine Ad-hoc-Lesebreite (52rem/56rem) wieder
  // einschleichen. Nicht-rem-Werte (vw/%/px, z. B. Popover `max-w-[78vw]`,
  // Scale-Rule `max-w-[200px]`) bleiben zulässig (Chrome, kein Lesemass).
  {
    files: ['src/pages/gesetz-leser/**/*.{ts,tsx}', 'src/components/normtext/**/*.{ts,tsx}'],
    rules: {
      // ARIA_ZUSTANDSNAME muss hier mitlaufen — sonst ersetzte dieser Block ihn
      // für den gesamten Leser (Flat-Config merged Regel-Optionen nicht).
      'no-restricted-syntax': ['error', ...NORMTEXT_MAXW, ARIA_ZUSTANDSNAME],
    },
  },
  // §13/WCAG 4.1.2 in der Darstellungsschicht mechanisch gesperrt: ein
  // zugänglicher Name, der den Zustand mitführt (Herleitung oben bei
  // ARIA_ZUSTANDSNAME). Steht NACH dem Leser-Block, damit die Reihenfolge der
  // Blöcke nichts stillschweigend abschaltet — der Leser-Block führt die Regel
  // ohnehin selbst.
  {
    files: ['src/pages/**/*.tsx', 'src/components/**/*.tsx'],
    ignores: ['src/pages/gesetz-leser/**', 'src/components/normtext/**'],
    rules: {
      'no-restricted-syntax': ['error', ARIA_ZUSTANDSNAME],
    },
  },
])
