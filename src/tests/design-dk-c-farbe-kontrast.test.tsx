/**
 * W2·19-DESIGN-KONSISTENZ — Bündel DK-C «Farbe und Kontrast» (30.9.2026,
 * HN-D4; Herz-und-Nieren-Prüfung 24.9.2026: DK-06, DK-16, DK-17, DK-22).
 *
 *   DK-06 · KEIN TEXT IN ink-300/ink-400 (ausser aria-hidden und begründeter
 *           Ausnahme). Die Token sind Deko-Töne: ink-400 misst auf `paper`
 *           3.44 hell / 3.31 dunkel, ink-300 2.18 / 2.15 (WCAG 1.4.3 verlangt 4.5).
 *   DK-16 · FLÄCHEN-ROLLE «Tinte leise»: jede Registerfläche trägt ihre
 *           gedämpfte Tinte in ink-600 — EINE Regel in `index.css` statt einer
 *           Selektorliste; das Paar ink-500 auf Registerfläche steht im
 *           Farbwelt-Tor (`scripts/farbwelt-tabellen.ts`, RISSE).
 *   DK-17 · Zeitstrahl-Beschriftung in Tinte, Farbe nur am Punkt.
 *   DK-22 · `color-mix` nur `in oklab` (F2b-Nachtrag D-3).
 *
 * QUELLTEXT-SONDEN (gleiche Bauart wie `design-r5-konsistenz.test.ts`): am
 * Quelltext messbar ist «diese Form kommt nicht vor»; der gerechnete Kontrast
 * kommt aus `scripts/farbwelt-messung.ts` (dieselbe Quelle wie das Farbwelt-Tor).
 *
 * GRENZE DIESES WÄCHTERS (Gegenprüfung 30.9.2026): die Quelltext-Sonde sieht
 * die KASKADE nicht — eine später stehende, überschreibende Regel bliebe grün.
 * Dass die Rolle tatsächlich gewinnt (und eine eigene Farb-Utility am Overline
 * NICHT überschreibt), belegt die Messung im Browser:
 * `e2e/design-tinte-leise.e2e.ts` (computed color), nicht dieser Test.
 *
 * ROT-BEWEIS (§6.7): jede Sonde trägt eine NEGATIV-KONTROLLE mit dem Wortlaut
 * VOR dem Bündel (Belege, nie nachgeführt, §2b). Diese Datei steht ausserhalb
 * der App-Sweeps (`tests/` wird nicht gefegt), darf also die verbotenen Formen
 * zitieren.
 *
 * Reine Darstellung (§3) — keine Rechtslogik berührt.
 */
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { kontrast, type Mode } from '../../scripts/farbwelt-messung';
import { KuendigungTimeline } from '../components/KuendigungTimeline';
import type { SperrfristenErgebnis } from '../lib/sperrfristen';
import { APP_WURZEL, alleQuellen, liesRoh, ohneKommentare, pruefeAusnahmen, rel } from './appDateien';

// ─── DK-06 · KEIN ink-300/ink-400 AN TEXT ───────────────────────────────────

/** `text-ink-300|400`, auch mit Varianten-Präfix (`hover:text-ink-400`). */
const TEXT_TIEF = /(?<![\w-])text-ink-(?:300|400)(?![\w-])/g;
/** Inline-Stil: `color: 'var(--ink-400)'` (Vorschau-Stile u. ä.). */
const STIL_TIEF = /\bcolor\s*:\s*['"`]var\(--ink-(?:300|400)\)/g;

/**
 * Der öffnende Tag, in dem `index` liegt: vom letzten `<Tag` davor bis zum
 * ersten `>` danach, das kein `=>` ist. Reicht für className-Literale — ein
 * `>` in einem Ausdruck innerhalb des Tags wäre ein Fehlalarm (sichtbar, nie
 * ein stilles Durchlassen).
 */
function oeffnenderTag(quelle: string, index: number): string {
  let start = index;
  while (start > 0 && !(quelle[start] === '<' && /[A-Za-z]/.test(quelle[start + 1] ?? ''))) start--;
  let ende = index;
  while (ende < quelle.length && !(quelle[ende] === '>' && quelle[ende - 1] !== '=')) ende++;
  return quelle.slice(start, ende + 1);
}

/** Fundstellen ohne `aria-hidden` im selben Tag. */
function tiefeTinteAnText(quelle: string): string[] {
  const funde: string[] = [];
  for (const m of quelle.matchAll(TEXT_TIEF)) {
    if (!/\baria-hidden\b/.test(oeffnenderTag(quelle, m.index!))) funde.push(m[0]);
  }
  for (const m of quelle.matchAll(STIL_TIEF)) funde.push(m[0]);
  return funde;
}

/**
 * Begründete Ausnahmen — `begruendung` steht WÖRTLICH am Fundort
 * (`pruefeAusnahmen`), `anzahl` hält die Liste eng: eine zweite Fundstelle in
 * derselben Datei ist kein Freibrief.
 */
const AUSNAHMEN_DK06 = [
  {
    datei: 'pages/gesetze-teile/AzRegister.tsx', anzahl: 1,
    begruendung: '`disabled` ist eine inaktive Komponente',
  },
  {
    datei: 'components/layout/reiterleiste/Reiter.tsx', anzahl: 1,
    begruendung: 'einziges Kind ist die aria-hidden-Glyphe ⧉',
  },
] as const;

describe('DK-06 · Text steht nicht in ink-300/ink-400', () => {
  it('die App schreibt keinen Text in die Deko-Töne (aria-hidden und Ausnahmen ausgenommen)', () => {
    const frei = pruefeAusnahmen(AUSNAHMEN_DK06);
    const funde: string[] = [];
    for (const p of alleQuellen()) {
      const treffer = tiefeTinteAnText(ohneKommentare(liesRoh(p)));
      const ausnahme = AUSNAHMEN_DK06.find((a) => join(APP_WURZEL, a.datei) === p);
      if (ausnahme && frei.has(ausnahme.datei)) {
        expect(treffer.length, `${rel(p)}: die Ausnahme deckt genau ${ausnahme.anzahl} Fundstelle(n)`).toBe(ausnahme.anzahl);
        continue;
      }
      for (const t of treffer) funde.push(`${rel(p)} · ${t}`);
    }
    expect(
      funde,
      'ink-400 misst auf `paper` 3.44 hell / 3.31 dunkel, ink-300 2.18 / 2.15 — beide unter den 4.5:1 '
      + 'von WCAG 1.4.3. Schrift gehört in ink-500 (oder dunkler); ein Trennzeichen/Chevron bekommt '
      + '`aria-hidden`; eine echte Ausnahme trägt ihre Begründung AM FUNDORT und steht in AUSNAHMEN_DK06.',
    ).toEqual([]);
  });

  it('ROT-BEWEIS: die Vorher-Formen fallen auf, aria-hidden und Kommentare nicht', () => {
    // Wortlaute im Stand vom 24.9.2026 (DK-06) — Belege, nie nachgeführt (§2b).
    expect(tiefeTinteAnText('<span className="shrink-0 text-ink-400">angeheftet</span>')).toHaveLength(1);       // MappenDialog
    expect(tiefeTinteAnText('<span className="num text-micro text-ink-400">{anzahl}</span>')).toHaveLength(1);    // TabPanel
    expect(tiefeTinteAnText('<span aria-label={E} title={E}\n className="ml-1 font-normal text-ink-400">ⓘ</span>')).toHaveLength(1); // PanelEntscheide
    expect(tiefeTinteAnText("subDash: { color: 'var(--ink-400)' } as CSSProperties")).toHaveLength(1);            // vorschauStil
    expect(tiefeTinteAnText('<span className="px-1 hover:text-ink-400">x</span>')).toHaveLength(1);                // Variante
    // Negativ-Kontrollen: aria-hidden (auch über Zeilen), Nachbar-Token, ink-500.
    expect(tiefeTinteAnText('<span aria-hidden className="text-ink-300">·</span>')).toEqual([]);
    expect(tiefeTinteAnText('<span\n  draggable\n  aria-hidden\n  className="px-0.5 text-ink-400 hover:text-ink-900"\n>⠿</span>')).toEqual([]);
    expect(tiefeTinteAnText('<span className="text-ink-500">x</span>')).toEqual([]);
    expect(tiefeTinteAnText('<span className="text-ink-4000">x</span>')).toEqual([]);
    expect(tiefeTinteAnText("x: { color: 'var(--ink-500)' }")).toEqual([]);
  });
});

// ─── DK-16 · FLÄCHEN-ROLLE «TINTE LEISE» ────────────────────────────────────

const CSS = ohneKommentare(liesRoh(join(APP_WURZEL, 'index.css')));
const FLAECHEN = ['g', 'r', 'm', 'w'] as const;
/**
 * Das Farbwelt-Tor als Text gelesen: `scripts/farbwelt-tabellen.ts` zieht
 * `tailwind.config.js` ein, das die App-tsconfig (`tsc -b`) nicht typisiert —
 * ein Import käme also nur mit einer Typ-Ausnahme durch. Die Zeilen sind
 * einfache Literale; der Text ist dieselbe Quelle.
 */
const TABELLEN = ohneKommentare(readFileSync(join(APP_WURZEL, '..', 'scripts', 'farbwelt-tabellen.ts'), 'utf8'));
const hatPflicht = (fg: string, bg: string): boolean => TABELLEN.includes(`TEXT('${fg}', '${bg}'`);
const hatRiss = (fg: string, bg: string, mode: Mode): boolean =>
  new RegExp(`\\{\\s*fg:\\s*'${fg}',\\s*bg:\\s*'${bg}',\\s*mode:\\s*'${mode}'`).test(TABELLEN);
const MODI: Mode[] = ['hell', 'dunkel'];

/** Der Overline-Zweig der Rolle: nur Overlines OHNE eigene Farb-Utility (Gegenprüfung 30.9.2026). */
const OVERLINE_OHNE_FARBE = String.raw`\.lc-overline:where\(:not\(\[class\^="text-"\],\s*\[class\*=" text-"\],\s*\[class\*=":text-"\]\)\)`;

/**
 * Die Klassen der Rolle: `:is(<liste>) :is(.text-ink-500, <Overline ohne eigene Farbe>)
 * { color: var(--ink-600) }`. Die Liste darf Zeilen umbrechen.
 */
function rollenKlassen(css: string): string[] | null {
  const m = new RegExp(String.raw`:is\(([^)]*)\)\s*:is\(\s*\.text-ink-500\s*,\s*${OVERLINE_OHNE_FARBE}\s*\)\s*\{\s*color\s*:\s*var\(--ink-600\)`).exec(css);
  return m ? m[1].split(',').map((k) => k.trim()).filter(Boolean) : null;
}

/** CSS-Regeln, die eine Registerfläche als Hintergrund malen, deren Selektor die Rolle nicht trägt. */
function flaechenOhneRolle(css: string, rolle: readonly string[]): string[] {
  const offen: string[] = [];
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!/background(?:-color)?\s*:\s*var\(--reg-(?:[grmw]|marke)-flaeche\b/.test(m[2])) continue;
    for (const sel of m[1].split(',').map((x) => x.trim()).filter(Boolean)) {
      if (!rolle.some((k) => new RegExp(`${k.replace(/[.]/g, '\\.')}(?![\\w-])`).test(sel))) offen.push(sel);
    }
  }
  return offen;
}

describe('DK-16 · Flächen-Rolle «Tinte leise» statt Selektorliste', () => {
  it('die Rolle steht in index.css und trägt alle vier bg-reg-*-flaeche-Utilities', () => {
    const rolle = rollenKlassen(CSS);
    expect(rolle, 'Regel `:is(…) :is(.text-ink-500, .lc-overline:where(:not(…text-…))) { color: var(--ink-600) }` fehlt').not.toBeNull();
    for (const f of FLAECHEN) expect(rolle, `bg-reg-${f}-flaeche`).toContain(`.bg-reg-${f}-flaeche`);
  });

  it('der Overline-Zweig trifft nur Overlines ohne eigene Farbe (`text-danger-700` bleibt Warnfarbe)', () => {
    const m = /:where\(:not\(([^)]*)\)\)/.exec(CSS.slice(CSS.indexOf('.lc-overline:where(')));
    expect(m, '`.lc-overline:where(:not(…))` fehlt an der Rolle').not.toBeNull();
    for (const muster of ['[class^="text-"]', '[class*=" text-"]', '[class*=":text-"]']) {
      expect(m![1], muster).toContain(muster);
    }
  });

  it('ROT-BEWEIS: die Rolle VOR der Nachbesserung (`.lc-overline` unbedingt) wird nicht als Rolle erkannt', () => {
    // Wortlaut vor 30.9.2026 (Gegenprüfung): der Overline-Zweig ohne Ausschluss
    // schlug per Ungeschichtet-Vorrang auch `lc-overline text-danger-700`.
    const vorher = ':is(.bg-reg-g-flaeche, .ub-kopf) :is(.text-ink-500, .lc-overline) { color: var(--ink-600); }';
    expect(rollenKlassen(vorher)).toBeNull();
    const nachher = ':is(.bg-reg-g-flaeche, .ub-kopf) :is(.text-ink-500, .lc-overline:where(:not([class^="text-"], [class*=" text-"], [class*=":text-"]))) { color: var(--ink-600); }';
    expect(rollenKlassen(nachher)).toEqual(['.bg-reg-g-flaeche', '.ub-kopf']);
  });

  it('jede CSS-Fläche mit --reg-*-flaeche als Hintergrund gehört zur Rolle', () => {
    const rolle = rollenKlassen(CSS)!;
    expect(
      flaechenOhneRolle(CSS, rolle),
      'Eine neue CSS-Registerfläche muss in die Liste der Rolle «Tinte leise» (index.css, DK-16), '
      + 'sonst fällt `.text-ink-500` darauf still unter AA (ink-500 auf reg-*-flaeche 4.15–4.59:1).',
    ).toEqual([]);
  });

  it('keine Registerfläche wird am CSS vorbei aus TS/TSX gemalt', () => {
    const funde: string[] = [];
    for (const p of alleQuellen()) {
      if (/--reg-(?:[grmw]|marke)-flaeche/.test(ohneKommentare(liesRoh(p)))) funde.push(rel(p));
    }
    expect(funde, 'Inline-`var(--reg-*-flaeche)` umgeht die Rolle — Utility `bg-reg-*-flaeche` nehmen').toEqual([]);
  });

  it('kein Einzel-Selektor mehr an Kachel/Spalte (`[&_.text-ink-500]:text-ink-600`)', () => {
    const funde = alleQuellen().filter((p) => /\[&_\.text-ink-500\]:text-ink-600/.test(ohneKommentare(liesRoh(p)))).map(rel);
    expect(funde, 'die Rolle in index.css trägt das; ein Einzel-Selektor ist die abgelöste Selektorliste').toEqual([]);
  });

  it('das Farbwelt-Tor kennt das Paar: jedes Paar ink-500/Fläche unter 4.5 steht in RISSE, ink-600 in PFLICHT', () => {
    for (const f of FLAECHEN) {
      const bg = `reg-${f}-flaeche`;
      expect(
        hatPflicht('ink-600', bg),
        `PFLICHT ink-600/${bg} (das Paar der Rolle)`,
      ).toBe(true);
      for (const mode of MODI) {
        expect(kontrast('ink-600', bg, mode), `ink-600/${bg} ${mode}`).toBeGreaterThanOrEqual(4.5);
        if (kontrast('ink-500', bg, mode) < 4.5) {
          expect(
            hatRiss('ink-500', bg, mode),
            `ink-500/${bg} ${mode} = ${kontrast('ink-500', bg, mode).toFixed(2)}:1 liegt unter 4.5 und gehört in RISSE (scripts/farbwelt-tabellen.ts)`,
          ).toBe(true);
        }
      }
    }
  });

  it('die Rolle ist begründet: auf mindestens einem Flächen-Paar liegt ink-500 unter AA (Rückbau-Signal)', () => {
    // Wird ink-500 auf ALLEN acht Paaren ≥ 4.5, ist die Rolle überflüssig
    // (§17-Gegengewicht): dann Rolle samt RISSE zurückbauen.
    const unter = FLAECHEN.flatMap((f) => MODI.filter((m) => kontrast('ink-500', `reg-${f}-flaeche`, m) < 4.5));
    expect(unter.length).toBeGreaterThan(0);
  });

  it('ROT-BEWEIS: eine CSS-Fläche ausserhalb der Rolle fällt auf, die Rollen-Klassen nicht', () => {
    const rolle = ['.bg-reg-g-flaeche', '.lc-titelblatt-band', '.ub-kopf'];
    // Wortlaut: die Selektorliste VOR DK-16 kannte nur drei Flächen — eine vierte,
    // `.lc-akzent-w` ohne Eintrag, wäre durchgefallen (Beispiel, Stand 24.9.2026).
    expect(flaechenOhneRolle('.lc-akzent-w { background: var(--reg-w-flaeche); }', rolle)).toEqual(['.lc-akzent-w']);
    expect(flaechenOhneRolle('.lc-neu-kopf { border: 0; background-color: var(--reg-m-flaeche) }', rolle)).toEqual(['.lc-neu-kopf']);
    expect(flaechenOhneRolle('.lc-route[data-reg="m"] .lc-titelblatt-band { background: var(--reg-m-flaeche); }', rolle)).toEqual([]);
    expect(flaechenOhneRolle('.ub-kopf { background: var(--reg-marke-flaeche, var(--well)); }', rolle)).toEqual([]);
    expect(flaechenOhneRolle('.lc-x { color: var(--reg-g-flaeche); }', rolle)).toEqual([]);
    expect(rollenKlassen('.lc-titelblatt-band .text-ink-500 { color: var(--ink-600); }')).toBeNull();
    // Die Tabellen-Sonde unterscheidet Modus und Fläche (hell reg-m trägt 4.59 und steht nicht in RISSE).
    expect(hatRiss('ink-500', 'reg-m-flaeche', 'dunkel')).toBe(true);
    expect(hatRiss('ink-500', 'reg-m-flaeche', 'hell')).toBe(false);
    expect(hatPflicht('ink-600', 'reg-x-flaeche')).toBe(false);
  });
});

// ─── DK-17 · ZEITSTRAHL: BESCHRIFTUNG IN TINTE ──────────────────────────────

function zeitstrahl(status: string): string {
  const e = {
    status, zugangISO: '2025-04-15', beendigungISO: '2025-06-30', fruehesteNeueKuendigungISO: '2025-09-30',
    sperrIntervalle: [],
  } as unknown as SperrfristenErgebnis;
  return renderToStaticMarkup(<KuendigungTimeline e={e} />);
}

/** Die Beschriftungs-`span`s der Marker: `text-micro` + `font-medium`. */
function beschriftungen(html: string): string[] {
  return [...html.matchAll(/<span[^>]*font-medium[^>]*>[^<]*<\/span>/g)].map((m) => m[0]);
}

describe('DK-17 · KuendigungTimeline: Farbe am Punkt, Beschriftung in Tinte', () => {
  for (const [status, label] of [['ok', 'Beendigung'], ['nichtig', 'frühestens neu kündbar']] as const) {
    it(`«${label}» trägt text-ink-900 und keine Inline-Schriftfarbe (status=${status})`, () => {
      const span = beschriftungen(zeitstrahl(status)).filter((s) => s.includes(`>${label}<`));
      expect(span, `Beschriftung «${label}» gerendert`).toHaveLength(1);
      expect(span[0]).toContain('text-ink-900');
      expect(span[0], 'Schriftfarbe per style — Nicht-Text-Rolle als Text (DK-17)').not.toMatch(/style="[^"]*(?<![-\w])color:/);
    });
  }

  it('die Farbe bleibt am Punkt (Lot und Punkt tragen background)', () => {
    const html = zeitstrahl('nichtig');
    expect(html).toContain('background:var(--brass-500)');
    expect(zeitstrahl('ok')).toContain('background:var(--ok-solid)');
  });

  it('ROT-BEWEIS: die Vorher-Form (Schrift per Inline-Farbe) fällt auf', () => {
    // Wortlaut im Stand vom 24.9.2026 (KuendigungTimeline.tsx, Marker) — Beleg, nie nachgeführt (§2b).
    const vorher = '<span class="whitespace-nowrap font-medium leading-tight text-micro" style="color:var(--ok-solid);order:1">Beendigung</span>';
    expect(vorher).toMatch(/style="[^"]*(?<![-\w])color:/);
    expect(vorher).not.toContain('text-ink-900');
    // GEMESSEN 30.9.2026 (gerechnet aus den Tokens, 11 px): die Vorher-Schrift lag unter AA.
    expect(kontrast('ok-solid', 'surface', 'dunkel')).toBeLessThan(4.5);       // 3.49 (live 3.68 auf der lc-card)
    expect(kontrast('ink-900', 'surface', 'dunkel')).toBeGreaterThanOrEqual(4.5);
    expect(kontrast('ink-900', 'surface', 'hell')).toBeGreaterThanOrEqual(4.5);
  });
});

// ─── DK-22 · color-mix NUR in oklab ─────────────────────────────────────────

/** `color-mix(in <Raum>, …)` mit einem anderen Raum als oklab. */
const COLOR_MIX_FREMD = /color-mix\(\s*in\s+(?!oklab\b)[a-z0-9-]+/g;

describe('DK-22 · jedes color-mix interpoliert in oklab (F2b-Nachtrag D-3)', () => {
  it('kein color-mix in srgb/hsl/… in CSS, TS und TSX', () => {
    const funde: string[] = [];
    for (const p of [...alleQuellen(), join(APP_WURZEL, 'index.css')]) {
      for (const m of ohneKommentare(liesRoh(p)).matchAll(COLOR_MIX_FREMD)) funde.push(`${rel(p)} · ${m[0]}`);
    }
    expect(funde, 'D-3: Farbrezepte nur `in oklab` (DESIGN-REGLEMENT F2b-Nachtrag D-3, «Ausnahme: keine bekannt»)').toEqual([]);
  });

  it('ROT-BEWEIS: die Vorher-Form (Shell.tsx, Seitenleiste) fällt auf, oklab nicht', () => {
    // Wortlaut im Stand vom 24.9.2026 — Beleg, nie nachgeführt (§2b).
    const vorher = "background: 'color-mix(in srgb, var(--paper-sunken) 35%, var(--paper))'";
    expect(vorher.match(COLOR_MIX_FREMD)).toHaveLength(1);
    expect('color-mix(in oklab, var(--paper-sunken) 35%, var(--paper))'.match(COLOR_MIX_FREMD)).toBeNull();
    expect('color-mix(in oklch, red, blue)'.match(COLOR_MIX_FREMD)).toHaveLength(1);
  });
});
