/**
 * W2·19-DESIGN-KONSISTENZ — HN-D2 «Eine Titel- und Abschnittsordnung»
 * (30.9.2026, PR 1: Reglement + Bausteine; Go David 24.9.2026).
 *
 * Bewacht DESIGN-REGLEMENT F0.11: vier Stufen, je EIN Baustein, gleiche Stufe =
 * gleiche Schrift und gleiches Gewicht. Fünf Fragen, je an der Stelle gestellt,
 * wo die Antwort liegt:
 *
 *   A · Reglement: die Titel-Tabelle steht da und sagt dasselbe wie die Tabelle
 *       in dieser Datei (Soll in zwei Händen — driftet eine, fällt der Fall).
 *   B · Bausteine: `SeitenTitel`, `AbschnittKopf`, `GruppenKopf` zeichnen ihre
 *       Stufe mit der Signatur der Tabelle (gerendert, Klassen als Menge).
 *   C · CSS: kein Selektor überstimmt die H1 von aussen (vor HN-D2 tat es
 *       `.ub-kopf h1 { font-weight: 400 }` — die Band-Seiten 400, der Rest 600);
 *       Stufe 3 und 4 tragen ihre Familie an der Klasse.
 *   D · Quellsonde: Formen, die gegen die Tabelle verstossen, gibt es nirgends
 *       mehr — die Schuldliste aus PR 1 ist mit PR 2 (Aufrufer, 30.9.2026)
 *       leer; wer eine neue Stelle gegen die Tabelle baut, scheitert.
 *   E · NEGATIV-KONTROLLEN (§6.7): jeder Ausdruck findet die Vorher-Form, wie sie
 *       am 30.9.2026 im Repo stand.
 *
 * Quellsonden laufen über den einen App-Sweep (`appDateien.ts`, R5-A) und lesen
 * OHNE Kommentare. Reine Darstellung (§3) — keine Rechtslogik berührt.
 */
import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { renderToString } from 'react-dom/server';
import { SeitenTitel } from '../components/ui/SeitenTitel';
import { AbschnittKopf } from '../components/layout/AbschnittKopf';
import { GruppenKopf } from '../components/ui/GruppenKopf';
import { PaneProvider } from '../components/layout/PaneKontext';
import { APP_WURZEL, alleTsx, liesOhneKommentare, liesRoh, ohneKommentare, rel } from './appDateien';

const REGLEMENT = liesRoh(join(APP_WURZEL, '..', 'DESIGN-REGLEMENT.md'));
const CSS = ohneKommentare(liesRoh(join(APP_WURZEL, 'index.css')));

// ─── Das Soll: EINE Tabelle, in Daten ───────────────────────────────────────
const STUFEN = [
  { nr: '1', tag: '`h1`', schrift: 'Literata · 400', baustein: 'ui/SeitenTitel' },
  { nr: '2', tag: '`h2`', schrift: 'Archivo · 600', baustein: 'layout/AbschnittKopf' },
  { nr: '3', tag: '`h2`–`h4` oder `p`', schrift: 'Literata kursiv · 600', baustein: 'ui/GruppenKopf' },
  { nr: '4', tag: '`p`, `span`, `h4`', schrift: 'Archivo · 400', baustein: '.lc-overline' },
] as const;

const tokens = (html: string): string[] => {
  const m = /^<\w+[^>]*?\sclass="([^"]*)"/.exec(html);
  return m ? m[1].split(/\s+/) : [];
};
const KEIN_PANE = { imPane: false as const, rolle: 'primaer' as const, wurzel: null, overlayWurzel: null };
const IM_PANE = { imPane: true as const, rolle: 'sekundaer' as const, wurzel: null, overlayWurzel: null };

// ═══ A · Reglement ══════════════════════════════════════════════════════════
/** Zeilen der Titel-Tabelle in F0.11 (Spalten ohne die äusseren Pipes). */
function tabellenZeilen(reglement: string): string[][] {
  const start = reglement.indexOf('**F0.11');
  if (start < 0) return [];
  const ende = reglement.indexOf('\n- ', start);
  return reglement.slice(start, ende < 0 ? undefined : ende).split('\n')
    .filter((z) => /^\|\s*[1-9]\s*\|/.test(z))
    .map((z) => z.split('|').slice(1, -1).map((c) => c.trim()));
}

describe('HN-D2 A — das Reglement führt die Titel-Tabelle (F0.11)', () => {
  const zeilen = tabellenZeilen(REGLEMENT);

  it('POSITIV-SONDE: die Tabelle hat genau die vier Stufen', () => {
    expect(zeilen.map((z) => z[0])).toEqual(STUFEN.map((s) => s.nr));
  });

  it.each(STUFEN)('Stufe $nr: Tag, Schrift·Gewicht und Baustein stehen wie im Soll', (s) => {
    const z = zeilen.find((r) => r[0] === s.nr);
    expect(z, `Stufe ${s.nr} fehlt in der Tabelle`).toBeDefined();
    expect(z![2].startsWith(s.tag), `Stufe ${s.nr}: Tag «${z![2]}» ≠ «${s.tag}»`).toBe(true);
    expect(z![3].startsWith(s.schrift), `Stufe ${s.nr}: «${z![3]}» ≠ «${s.schrift}»`).toBe(true);
    expect(z![5]).toContain(s.baustein);
  });

  it('§R-11 trägt den Ist-Stand: Ergebnis-Titel h2 (axe heading-order), nicht h3', () => {
    const r11 = REGLEMENT.slice(REGLEMENT.indexOf('### §R-11'), REGLEMENT.indexOf('### §R-12'));
    expect(r11).toContain('F0.11');
    expect(r11).toMatch(/Ergebnis-Titel ist `h2`/);
    expect(r11, 'die alte Aussage «Ergebnis-Titel als h3» steht noch da').not.toMatch(/Ergebnis-Titel als h3/);
    expect(r11, 'die alte Aussage «h1 nur im RechnerKopf» steht noch da').not.toMatch(/h1 nur im RechnerKopf/);
  });
});

// ═══ B · Bausteine ══════════════════════════════════════════════════════════
const FREMDE_GEWICHTE = ['font-semibold', 'font-medium', 'font-bold', 'font-light'];
const FREMDE_FAMILIEN = ['font-display', 'font-sans', 'font-mono'];

describe('HN-D2 B — Stufe 1: SeitenTitel = Literata 400, von sich aus', () => {
  it('ausserhalb eines Panes: serif + normal, nichts Fremdes', () => {
    const t = tokens(renderToString(<SeitenTitel>Streitwert</SeitenTitel>));
    expect(t).toEqual(expect.arrayContaining(['font-serif', 'font-normal', 'text-ink-900']));
    for (const k of [...FREMDE_GEWICHTE, ...FREMDE_FAMILIEN]) expect(t, k).not.toContain(k);
  });

  it('im Pane: dieselbe Schrift·Gewicht-Signatur (nur die Kaskade misst anders)', () => {
    const t = tokens(renderToString(<PaneProvider value={IM_PANE}><SeitenTitel>Streitwert</SeitenTitel></PaneProvider>));
    expect(t).toEqual(expect.arrayContaining(['font-serif', 'font-normal', '@xl/pane:text-h1']));
    for (const k of [...FREMDE_GEWICHTE, ...FREMDE_FAMILIEN]) expect(t, k).not.toContain(k);
  });

  it('die Übergangs-Prop `stimme="serif"` ändert nichts; es gibt keine Display-Stimme mehr', () => {
    const ohne = renderToString(<PaneProvider value={KEIN_PANE}><SeitenTitel>OR</SeitenTitel></PaneProvider>);
    const mit = renderToString(<PaneProvider value={KEIN_PANE}><SeitenTitel stimme="serif">OR</SeitenTitel></PaneProvider>);
    expect(mit).toBe(ohne);
  });

  it('die Klassen des Aufrufers kommen dazu, ersetzen die Stufe aber nicht', () => {
    const t = tokens(renderToString(<SeitenTitel className="num min-h-titel-2z">BGE 1</SeitenTitel>));
    expect(t).toEqual(expect.arrayContaining(['num', 'min-h-titel-2z', 'font-serif', 'font-normal']));
  });
});

describe('HN-D2 B — Stufe 2: AbschnittKopf = Archivo 600, text-h3', () => {
  it('Standard: h2, display + semibold + text-h3', () => {
    const html = renderToString(<AbschnittKopf titel="Verzugszins" />);
    const h = /<h2[^>]*class="([^"]*)"/.exec(html);
    expect(h, 'kein <h2> im Abschnittskopf').not.toBeNull();
    const t = h![1].split(/\s+/);
    expect(t).toEqual(expect.arrayContaining(['font-display', 'font-semibold', 'text-h3', 'text-ink-900']));
    expect(t).not.toContain('font-serif');
  });

  it('stufe=3: dieselbe Darstellung, nur das Outline-Tag wechselt', () => {
    const h2 = renderToString(<AbschnittKopf titel="Teil" />);
    const h3 = renderToString(<AbschnittKopf titel="Teil" stufe={3} />);
    expect(h3).toContain('<h3');
    expect(h3).not.toContain('<h2');
    expect(h3.replace('<h3', '<h2').replace('</h3>', '</h2>')).toBe(h2);
  });

  it('Fokus-Ziel und Anker des Wizard-Schritttitels: id + tabIndex=-1 stehen am Titel', () => {
    const html = renderToString(<AbschnittKopf titel="Parteien" id="schritt-titel" tabIndex={-1} />);
    expect(html).toMatch(/<h2[^>]*id="schritt-titel"/);
    expect(html).toMatch(/<h2[^>]*tabindex="-1"/);
  });

  it('Overline und Einleitung bleiben Nachbarn des Titels, nicht sein Inhalt', () => {
    const html = renderToString(<AbschnittKopf overline="Ergebnis" titel="Frist">Text</AbschnittKopf>);
    expect(html).toMatch(/<p class="lc-overline">Ergebnis<\/p><h2/);
  });
});

describe('HN-D2 B — Stufe 3: GruppenKopf = .lc-randtitel', () => {
  it('breite und dichte Gestalt tragen dieselbe Klassen-Stimme', () => {
    for (const dicht of [false, true]) {
      const html = renderToString(<GruppenKopf titel="Fristen" dicht={dicht} />);
      expect(html, `dicht=${String(dicht)}`).toMatch(/<h3[^>]*class="lc-overline lc-randtitel"/);
    }
  });
});

// ═══ C · CSS ════════════════════════════════════════════════════════════════
type Regel = { selektor: string; koerper: string };
/** Alle einfachen Regeln (Blätter) des Stylesheets, auch in @layer/@media. */
function regeln(css: string): Regel[] {
  const aus: Regel[] = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  for (let m = re.exec(css); m; m = re.exec(css)) aus.push({ selektor: m[1].trim(), koerper: m[2] });
  return aus;
}
const ALS_H1 = /(^|[\s>+~,])h1(?![-\w])/;
/** Regeln, die die SCHRIFT einer H1 setzen — ausser der einen Basis-Regel. */
function h1Ueberstimmungen(css: string): string[] {
  return regeln(css)
    .filter((r) => r.selektor.split(',').some((s) => ALS_H1.test(s.trim())))
    .filter((r) => /font-(weight|family|style)\s*:/.test(r.koerper))
    .filter((r) => r.selektor.replace(/\s+/g, ' ') !== 'h1, h2, h3')
    .map((r) => r.selektor.replace(/\s+/g, ' '));
}
const ersteRegel = (selektor: string): string => regeln(CSS).find((r) => r.selektor === selektor)?.koerper ?? '';

describe('HN-D2 C — das Stylesheet hält die Stufen', () => {
  it('kein Selektor überstimmt die Schrift der H1 von aussen (das Gewicht trägt der Baustein)', () => {
    expect(h1Ueberstimmungen(CSS)).toEqual([]);
  });

  it('die Basis-Regel h1–h3 bleibt (Stufe 2 ohne Klassen = Archivo 600)', () => {
    const k = regeln(CSS).find((r) => r.selektor.replace(/\s+/g, ' ') === 'h1, h2, h3')?.koerper ?? '';
    expect(k).toMatch(/font-family:\s*var\(--font-display\)/);
    expect(k).toMatch(/font-weight:\s*600/);
  });

  it('Stufe 3 (.lc-randtitel): Literata kursiv', () => {
    const k = ersteRegel('.lc-randtitel');
    expect(k).toMatch(/font-family:\s*var\(--font-serif\)/);
    expect(k).toMatch(/font-style:\s*italic/);
  });

  it('Stufe 4 (.lc-overline): Archivo 12 px, keine Versalien', () => {
    const k = ersteRegel('.lc-overline');
    expect(k).toMatch(/font-family:\s*var\(--font-sans\)/);
    expect(k).toMatch(/font-size:\s*\.75rem/);
    expect(k).toMatch(/text-transform:\s*none/);
    expect(k, 'ein Gewicht an der Klasse würde Gruppenköpfe (.lc-randtitel) und Utilities überstimmen').not.toMatch(/font-weight/);
  });
});

// ═══ D · Quellsonde: die Schuldliste von PR 2 ═══════════════════════════════
const ELEMENTE = /<h([2-6])\b[^>]*>/g;
/** `<h2…>`-Öffnungs-Tags mit ihrem Klassen-Text (mehrzeilig, ohne Kommentare). */
function ueberschriften(quelle: string): { ebene: string; klassen: string }[] {
  const aus: { ebene: string; klassen: string }[] = [];
  for (const m of quelle.matchAll(ELEMENTE)) {
    const k = /className=(?:"([^"]*)"|\{`([^`]*)`\})/.exec(m[0]);
    aus.push({ ebene: m[1], klassen: (k?.[1] ?? k?.[2] ?? '') });
  }
  return aus;
}
const hatKlasse = (klassen: string, k: string): boolean => klassen.split(/\s+/).includes(k);

/** Stufe 2 in der falschen Familie: Abschnittstitel in Literata. */
const serifAbschnitt = (q: string): boolean =>
  ueberschriften(q).some((h) => hatKlasse(h.klassen, 'text-h3') && hatKlasse(h.klassen, 'font-serif'));
/** Stufe 4 als fette Zwischenüberschrift statt `.lc-overline`. */
const fetteH4 = (q: string): boolean =>
  ueberschriften(q).some((h) => h.ebene === '4' && ['font-semibold', 'font-medium', 'font-bold'].some((k) => hatKlasse(h.klassen, k)));
/** F0.7: Versalien UND Sperrsatz in einer Klassen-Zeichenkette. */
const versalEtikett = (q: string): boolean =>
  [...q.matchAll(/["'`]([^"'`\n]*)["'`]/g)].some((m) => {
    const t = m[1].split(/\s+/);
    return t.includes('uppercase') && t.some((k) => /^tracking-(wide|wider|widest)$/.test(k));
  });

function funde(probe: (quelle: string) => boolean): string[] {
  return alleTsx().filter((d) => probe(liesOhneKommentare(d))).map(rel).sort();
}

describe('HN-D2 D — Quellsonde: die Schuldliste von PR 1 ist abgetragen (PR 2, 30.9.2026)', () => {
  const WIE = 'Eine NEUE Stelle gegen die Tabelle → nicht eintragen, sondern nach F0.11 bauen (Baustein statt Einzelklasse).';

  it('Abschnittstitel (text-h3) in Literata: keine Stelle mehr (Wizard → AbschnittKopf)', () => {
    expect(funde(serifAbschnitt), WIE).toEqual([]);
  });

  it('Zwischenüberschrift als fetter h4 statt .lc-overline: keine Stelle mehr', () => {
    expect(funde(fetteH4), WIE).toEqual([]);
  });

  it('Etikett in Versalien mit Sperrsatz (F0.7): keine Stelle mehr', () => {
    expect(funde(versalEtikett), WIE).toEqual([]);
  });

  it('POSITIV-SONDE: der Sweep sieht den Baustein selbst (sonst fegte er ins Leere)', () => {
    expect(alleTsx().map(rel)).toContain('components/layout/AbschnittKopf.tsx');
  });
});

// ═══ E · NEGATIV-KONTROLLEN (§6.7) ══════════════════════════════════════════
describe('HN-D2 E — jeder Ausdruck findet die Vorher-Form (Wortlaut 30.9.2026)', () => {
  it('H1-Überstimmung: `.ub-kopf h1 { font-weight: 400 }` fällt auf, die Basis-Regel nicht', () => {
    const vorher = '.ub-kopf { padding: 1rem; }\n.ub-kopf h1 { font-weight: 400; }\n';
    expect(h1Ueberstimmungen(vorher)).toEqual(['.ub-kopf h1']);
    expect(h1Ueberstimmungen('  h1, h2, h3 { font-family: var(--font-display); font-weight: 600; }')).toEqual([]);
    expect(h1Ueberstimmungen('.h1-kopf { font-weight: 400 } h10 { font-weight: 1 }'), 'h1 nur als Element').toEqual([]);
  });

  it('Stufe 2 in Serif: die Wizard-Zeile fällt auf, AbschnittKopf nicht', () => {
    const wizard = '<h2 ref={titelRef} tabIndex={-1} className="text-h3 font-serif font-semibold text-ink-900">{x}</h2>';
    expect(serifAbschnitt(wizard)).toBe(true);
    expect(serifAbschnitt('<h2 className="text-h3 font-display font-semibold text-ink-900">x</h2>')).toBe(false);
    expect(serifAbschnitt('<h1 className="text-h1 font-serif">x</h1>'), 'h1 ist Stufe 1, nicht 2').toBe(false);
  });

  it('fetter h4: die Formular-Zeile fällt auf, der Overline-h4 nicht', () => {
    expect(fetteH4('<h4 className="text-body-s font-semibold text-ink-700">T</h4>')).toBe(true);
    expect(fetteH4('<h4 className="lc-overline">T</h4>')).toBe(false);
  });

  it('Versal-Etikett: die ZweiachsigerEinstieg-Zeile fällt auf, das Sprach-Kürzel nicht', () => {
    expect(versalEtikett('<p className="text-xs font-medium uppercase tracking-wide text-ink-500">x</p>')).toBe(true);
    expect(versalEtikett('<span className="num uppercase text-xs mr-2">de</span>')).toBe(false);
  });

  it('Reglement-Tabelle: eine geänderte Gewichts-Angabe würde den Fall A brechen', () => {
    const kaputt = REGLEMENT.replace('| Literata · 400 |', '| Literata · 600 |');
    expect(kaputt).not.toBe(REGLEMENT);
    expect(tabellenZeilen(kaputt).find((z) => z[0] === '1')![3].startsWith('Literata · 400')).toBe(false);
  });
});
