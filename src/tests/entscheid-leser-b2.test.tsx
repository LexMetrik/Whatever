/**
 * W2·19-DESIGN-KONSISTENZ · B2/BAU-4 — der Entscheid-Leser zieht nach.
 *
 * Vier Befunde, vier Sonden-Gruppen:
 *   A-2  Der Leser war die EINZIGE pane-fähige Fläche ohne `usePaneKlasse`:
 *        seine layoutbestimmenden Breakpoints massen das FENSTER, während er in
 *        einer halb so breiten Pane stand.
 *   A-5  Der Lesemodus portalierte an `<body>` und deckte im Split-View BEIDE
 *        Panes zu.
 *   B-5  H1 «BGE 146 III 1» und Meta-Chip «146 III 1» sagten dasselbe zweimal.
 *   KANON Die vier geteilten Bausteine (`SeitenTitel` · `QuellLink` · `Datum` ·
 *        `FehlSeite`) und die Satz-Konstante `MASSGEBLICH_SATZ` waren hier als
 *        letzte Fläche noch nicht bezogen.
 *
 * §6.7 (ein Tor muss scheitern können) — am Ist-Stand VOR dem Bau (31.8.2026)
 * war JEDE Sonde dieser Datei rot; die Belege stehen im Bau-Bericht. Die
 * schärfste ist die A-2-Paritätssonde: sie war vor dem Bau an 14 von 14
 * Viewport-Klassen rot, weil es KEINE einzige Container-Entsprechung gab.
 *
 * Reine Darstellung (§3).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { referenzImTitel } from '../pages/entscheidLeserRegeln';
import { QuellLink } from '../components/ui/QuellLink';
import { AMTLICHE_FASSUNG } from '../lib/benennung';

/**
 * DIE FLÄCHE «Entscheid-Leser» — seit dem §6.6-Split vom 31.8.2026 vier
 * Dateien statt einer (`check:schlankheit` war bei 1380 Z. rot; der Schnitt
 * folgt den Kanten, die die Datei schon hatte). Die Sonden lesen darum die
 * VEREINIGUNG: sie sichern eine Eigenschaft der FLÄCHE zu, nicht den Zufall,
 * in welcher der vier Dateien eine Zeile heute steht.
 */
const FLAECHE = [
  'src/pages/EntscheidLeser.tsx',
  // W2·28 (21.9.2026): fünfte Datei der Fläche. Der Rail-/Landkarten-Anschluss
  // ist aus `EntscheidLeser.tsx` geschnitten, weil die Datei über ihre
  // Schlankheits-Baseline gewachsen war (`check:schlankheit`, 1245/1204 Z.).
  // Die Sonden lesen die VEREINIGUNG — ohne diese Zeile hörte die A-2-Parität
  // stillschweigend an der Dateigrenze auf (§6.7).
  'src/pages/entscheidErwBereich.tsx',
  'src/components/rechtsprechung/EntscheidKopfTeile.tsx',
  'src/components/rechtsprechung/LesemodusOverlay.tsx',
  'src/components/rechtsprechung/leseGroesse.ts',
] as const;

/** Quelltext ohne Kommentare — geprüft wird der ausführbare Teil. Die
 *  Begründungen am Fundort zitieren den Vorzustand wörtlich (§2b: datierte
 *  Belege werden nie nachgeführt), sie dürfen die Sonden nicht auslösen. */
function ohneKommentare(pfad: string): string {
  return readFileSync(pfad, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter((z) => !/^\s*(\/\/|\*)/.test(z)).join('\n');
}

/** Ohne Argument: die ganze Fläche. Mit Pfad: genau diese Datei. */
function quelle(pfad?: string): string {
  return (pfad ? [pfad] : [...FLAECHE]).map(ohneKommentare).join('\n');
}

// ── A-2 ────────────────────────────────────────────────────────────────────

/**
 * Viewport-Klasse → die Container-Klasse, die im Pane an ihrer Stelle gilt.
 * `sm:` (40 rem Fenster) → `@xl/pane:` (36 rem Container) ist die Abbildung,
 * die `ui/SeitenTitel` (A-1) im Haus gesetzt hat; die 4-rem-Differenz ist grob
 * die App-Chrome, die die Fensterzahl mitträgt, die Containerzahl aber nicht.
 * `xl:` → `@5xl/pane:` ist EIGENS gerechnet (Herleitung am Zweispalten-Raster
 * in `EntscheidLeser.tsx`): erst ab 64 rem Pane behält die Lesespalte neben dem
 * 15-rem-Rail ihre vollen 40 rem und damit die 60–75-Zeichen-Regel (R1).
 */
const PAAR: Record<string, string> = { 'sm:': '@xl/pane:', 'xl:': '@5xl/pane:' };

/**
 * DEKLARIERTE AUSNAHMEN — Viewport-Klassen ohne Container-Gegenstück, mit
 * Grund. Wer eine hinzufügt, muss sie hier eintragen und begründen; wer eine
 * ungeprüft stehen lässt, wird von der Paritätssonde erwischt.
 */
const AUSNAHMEN: Record<string, string> = {
  'sm:-mx-6': 'Randausgleich der klebenden Leiste — spiegelt die VIEWPORT-gesteuerte '
    + 'Polsterung des Pane-Wrappers (`layout/Pane.tsx`: `px-5 sm:px-6`). Zwei Massstäbe '
    + 'für dieselbe Kante wären schlimmer als ein alter; der Nachzug gehört an den Wrapper.',
  'sm:px-6': 'wie `sm:-mx-6` — dieselbe Kante, dieselbe Begründung.',
};

function viewportKlassen(q: string): string[] {
  return [...new Set(q.match(/\b(?:sm|md|lg|xl|2xl):[\w[\](),./%-]+/g) ?? [])].sort();
}

describe('A-2 — der Leser misst im Pane die Pane, nicht das Fenster', () => {
  it('POSITIV-SONDE: er bezieht `usePaneKlasse` überhaupt', () => {
    expect(quelle()).toMatch(/usePaneKlasse/);
  });

  // JE DATEI, nicht über die Vereinigung. Beim ersten Rot-vor-Grün-Lauf
  // (31.8.2026) war genau das der Fehler: mit `@xl/pane:grid-cols-[7rem_…]`
  // versuchsweise aus `EntscheidLeser.tsx` entfernt blieb die Sonde GRÜN, weil
  // dieselbe Klasse im `LesemodusOverlay` noch stand — ein Tor, das nicht
  // scheitern kann (§6.7). Die Parität gilt dort, wo die Klasse steht.
  it.each([...FLAECHE])('PARITÄT in %s: jede Viewport-Klasse hat ihr Container-Gegenstück', (pfad) => {
    const q = quelle(pfad);
    const fehlend: string[] = [];
    for (const kl of viewportKlassen(q)) {
      if (kl in AUSNAHMEN) continue;
      const praefix = Object.keys(PAAR).find((p) => kl.startsWith(p));
      expect(praefix, `unbekannter Breakpoint in ${kl}`).toBeTruthy();
      const gegen = kl.replace(praefix!, PAAR[praefix!]);
      if (!q.includes(gegen)) fehlend.push(`${kl} → ${gegen}`);
    }
    expect(fehlend, `Viewport-Klassen ohne Pane-Entsprechung:\n${fehlend.join('\n')}`).toEqual([]);
  });

  it('POSITIV-SONDE: die Paritätssonde sieht überhaupt Klassen (sonst prüfte sie nichts)', () => {
    // Ohne diese Zeile wäre die Sonde oben auf einer leeren Menge trivial grün —
    // dieselbe Falle wie ein Tor ohne Rot-Beweis (§6.7).
    expect(viewportKlassen(quelle('src/pages/EntscheidLeser.tsx')).length).toBeGreaterThan(8);
    expect(viewportKlassen(quelle('src/components/rechtsprechung/LesemodusOverlay.tsx')).length).toBeGreaterThan(1);
  });

  it('der Prerender-Pfad bleibt: die Viewport-Klassen stehen NEBEN den Container-Klassen', () => {
    const q = quelle();
    // Ausserhalb eines Panes liefert `pk` weiterhin die Viewport-Kette — die
    // 5'093 prerenderten Entscheid-Seiten ändern sich dadurch nicht.
    expect(q).toContain('xl:grid-cols-[minmax(0,1fr)_15rem]');
    expect(q).toContain('sm:grid-cols-[7rem_minmax(0,1fr)]');
  });

  it('ABGRENZUNG: `imPane` bleibt genau dort, wo eine Breite die Frage nicht beantwortet', () => {
    const q = quelle();
    // Sticky-Offset und sticky-Höhe hängen an der Verschachtelung (liegt eine
    // Topbar über meinem Scroll-Container?), nicht an einer Breite.
    expect(q).toMatch(/const stickHoehe = imPane/);
    expect(q).toMatch(/top: imPane \? '0\.5rem'/);
  });

  it('der Rail folgt DERSELBEN Schwelle wie sein Raster (sonst überlappen die Kinder)', () => {
    const rail = quelle('src/components/rechtsprechung/ErwaegungsRail.tsx');
    expect(rail).toContain('@5xl/pane:col-start-2');
    expect(rail).toContain('@5xl/pane:sticky');
    // §17-Rückbau: die Boolean-Prop trug keine Aussage mehr, die nicht der
    // Kontext schon trägt — sie ist ersatzlos entfallen.
    expect(rail).not.toMatch(/imPane\?: boolean/);
  });
});

// ── A-5 ────────────────────────────────────────────────────────────────────

describe('A-5 — der Lesemodus bleibt im Pane', () => {
  const q = quelle();

  it('portaliert in die Overlay-Schicht des Panes, sonst wie bisher an <body>', () => {
    expect(q).toContain('ziel ?? document.body');
    expect(q).toMatch(/ziel=\{\(imPane && overlayWurzel\?\.current\) \|\| null\}/);
  });

  it('im Pane `absolute` + klickbar, ausserhalb unverändert `fixed`', () => {
    // C3 (5.9.2026): `z-50` → `z-modal` (Schichtungs-Skala, index.css bei
    // --z-modal) — derselbe resolvierte Wert (50), nur benannt.
    expect(q).toContain('pointer-events-auto absolute inset-0 z-modal overflow-y-auto bg-paper');
    expect(q).toContain('fixed inset-0 z-modal overflow-y-auto bg-paper');
  });

  it('trägt seinen eigenen `@container/pane` — sonst feuerte keine Pane-Klasse darin', () => {
    // Die Overlay-Schicht ist ein GESCHWISTER des `@container/pane`-Scrollers
    // (`layout/Pane.tsx`); ohne diesen Container wären alle `@…/pane:`-Klassen
    // im Overlay tote Klassen (§6.7: was nicht feuern kann, ist kein Tor).
    expect(q).toContain('@container/pane pointer-events-auto absolute');
  });

  it('§8/a11y: kein `aria-modal` und keine Body-Sperre, solange nur die Pane gedeckt ist', () => {
    expect(q).toContain('aria-modal={imPane ? undefined : true}');
    expect(q).toContain("if (!imPane) document.body.style.overflow = 'hidden';");
  });
});

// ── B-5 ────────────────────────────────────────────────────────────────────

describe('B-5 — kein Name zweimal (reine Regel, wortgrenzen-genau)', () => {
  it('trägt die Zitierung die Referenz wörtlich, entfällt der Chip', () => {
    expect(referenzImTitel('BGE 146 III 1', '146 III 1')).toBe(true);
    expect(referenzImTitel('BGE 152 IV 14', '152 IV 14')).toBe(true);
  });

  it('WORTGRENZE, nicht Substring (CLAUDE.md §7)', () => {
    // «146 III 1» steckt als Zeichenfolge in «BGE 146 III 12» — ist dort aber
    // ein ANDERER Entscheid. Der Chip muss stehen bleiben.
    expect(referenzImTitel('BGE 146 III 12', '146 III 1')).toBe(false);
    expect(referenzImTitel('BGE 1146 III 1', '146 III 1')).toBe(false);
  });

  it('zweite, echte Identität bleibt sichtbar (der Fall, für den die Regel da ist)', () => {
    expect(referenzImTitel('BGer 4A_100/2020', '146 III 1')).toBe(false);
  });

  it('ohne Referenz gibt es nichts zu wiederholen', () => {
    expect(referenzImTitel('BGE 146 III 1', null)).toBe(false);
    expect(referenzImTitel('BGE 146 III 1', '')).toBe(false);
  });

  it('MESSUNG am ganzen Korpus (§7: prüfen, nicht annehmen)', () => {
    const reg = JSON.parse(readFileSync('public/rechtsprechung/register.json', 'utf8')) as {
      entscheide: { zitierung: string; bgeReferenz: string | null }[];
    };
    const mit = reg.entscheide.filter((e) => e.bgeReferenz);
    const doppelt = mit.filter((e) => referenzImTitel(e.zitierung, e.bgeReferenz));
    // Am Stand 31.8.2026: 1259 von 1259. Bewusst KEINE Gleichheits-Zusage auf
    // die Zahl — der Korpus wächst; zugesichert ist, dass die Regel den Bestand
    // erfasst und die Meta-Zeile heute keine Wiederholung mehr zeigt (§8).
    expect(mit.length, 'kein einziger Entscheid mit BGE-Referenz im Register?').toBeGreaterThan(1000);
    expect(doppelt.length).toBe(mit.length);
  });

  it('beide Kopf-Stellen fragen die Regel (Haupt-Kopf UND Lesemodus)', () => {
    const treffer = quelle().match(/!referenzImTitel\(snap\.zitierung, snap\.bgeReferenz\)/g) ?? [];
    expect(treffer, 'die Regel muss an beiden Meta-Zeilen hängen').toHaveLength(2);
  });
});

// ── Kanon-Nachzüge ─────────────────────────────────────────────────────────

describe('Kanon — der Leser bezieht die geteilten Bausteine (B-1/B-3/B-6/D-6)', () => {
  const q = quelle();

  it('B-1: der Quell-Link kommt aus `ui/QuellLink`, die Handform ist weg', () => {
    expect(q).toContain('<QuellLink href={url}');
    expect(q, 'der abgelöste Wortlaut mit Pfeil VORNE').not.toContain('↗ massgebliche Fassung');
    // Drei Plätze, EINE Fassade — sonst laufen sie wieder auseinander (§5).
    expect((q.match(/<MassgeblicheFassung /g) ?? []).length).toBe(3);
  });

  it('B-1: der §8-Marker bleibt SICHTBARER Teil des Namens', () => {
    const html = renderToStaticMarkup(
      <QuellLink href="https://example.test" className="lc-chip" title="Urteils-Quelle nicht verfügbar">
        {`${AMTLICHE_FASSUNG} (Urteil n. v.)`}
      </QuellLink>,
    );
    expect(html).toContain('Amtliche Fassung (Urteil n. v.)');
    expect(html).toContain('↗');
    expect(html).toContain('title="Urteils-Quelle nicht verfügbar"');
  });

  it('B-3: der sechste Datums-Formatierer ist gelöscht, `ui/Datum` zieht ein', () => {
    expect(q, 'die lokale Kopie von datumCh').not.toMatch(/function formatiereDatum/);
    expect(q).toContain('<Datum iso={snap.datum} />');
    expect(q).toContain('<Datum iso={snap.erstpublikation} />');
    // Mono bleibt exakt dort, wo sie hingehört: Zitierung, Aktenzeichen,
    // Geschäftsnummer — nie am Datum.
    expect(q).not.toMatch(/className="num">\{formatiere/);
  });

  it('B-6: der Vorbehalt kommt aus der einen Konstante — und bleibt «stets»', () => {
    expect((q.match(/\{MASSGEBLICH_SATZ\}/g) ?? []).length).toBe(2);
    expect(q, '«Quelle» statt «Fassung» war die zweite Wahrheit').not.toContain('die amtliche Quelle');
    expect(MASSGEBLICH_SATZ_ENTHAELT_STETS()).toBe(true);
  });

  it('D-6: der Fehl-Zweig ist keine Sackgasse mehr', () => {
    expect(q).toContain('<FehlSeite bereich="Rechtsprechung" objekt="Entscheid" name={schluessel}');
    expect(q).not.toContain('Dieser Entscheid ist nicht verfügbar.');
    // §8: der Satz, der sagt, dass das Fehlen an UNSEREM Bestand liegen kann,
    // bleibt wörtlich stehen.
    expect(q).toContain('Möglicherweise wurde er noch nicht erfasst.');
  });
});

/** §8-Sonde als Funktion, damit der Import der Konstante nicht selbst zur
 *  zweiten Wahrheit über ihren Wortlaut wird. */
function MASSGEBLICH_SATZ_ENTHAELT_STETS(): boolean {
  const benennung = readFileSync('src/lib/benennung.ts', 'utf8');
  return /export const MASSGEBLICH_SATZ = `Massgeblich ist stets \$\{AMTLICHE_FASSUNG_NOMEN\}\.`/.test(benennung);
}
