/**
 * W2·19-DESIGN-KONSISTENZ — Runde 3, Paket β (31.8.2026).
 *
 * Bewacht die vier Kanons dieses Pakets:
 *   B3-1/B3-2 · EIN Gruppenkopf, jetzt auch in seiner DICHTEN Gestalt
 *               (Panels, Kontext-Gruppen, Wizard-Sektionen, Sperrtage-Zähler).
 *   A3-1      · EIN Schliess-✕ (`ui/SchliessKnopf`) samt Komfort-Trefferfläche.
 *   A3-2      · EINE Schwebefläche (`.lc-schwebeflaeche`) für alles, was über
 *               dem Inhalt steht.
 *   A3-3      · EINE Treffer-Zeile — die Live-Suche war die dritte Bauform.
 *
 * QUELLTEXT-SONDE, kein Render-Test: bewacht wird «diese Form kommt in der App
 * genau einmal vor». Das ist am Quelltext messbar, am DOM einer einzelnen Seite
 * nicht (gleiche Bauart wie `design-gruppenkopf-karten-c.test.ts`).
 *
 * ROT-BEWEIS (§6.7): jeder Fall trägt eine NEGATIV-KONTROLLE — derselbe
 * Ausdruck, angewandt auf den Wortlaut, wie er vor diesem Paket im Repo stand.
 * Läuft die Kontrolle grün, prüft der Ausdruck nichts und der Fall ist wertlos.
 */
import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { readdirSync } from 'node:fs';
// R5-A (5.9.2026) · §5: die Verzeichnis-Wanderung, das Kommentar-Sieb und die
// Pfad-Kürzung kamen bis hierher als EIGENE Kopie mit — Wort für Wort
// `appDateien.ts`, also genau der Baustein, den R3-α gegen Listen-Wächter
// gebaut hat, ein zweites Mal. Wer die Regel «die Sonde fegt die App, nicht
// ihre Liste» in zwei Kopien führt, hat sie ab der ersten Abweichung nicht
// mehr. Jetzt hängen beide an der einen Quelle.
import { APP_WURZEL, alleTsx, rel, ohneKommentare, liesRoh } from './appDateien';

const WURZEL = APP_WURZEL;
const CSS = liesRoh(join(WURZEL, 'index.css'));

// QS-UI (5.9.2026, Nebenfund #663-Split, §6.7): `alleTsx()` fegt nur `.tsx` —
// die nach dem ArtikelBody-Split (PR #663) ausgelagerte `ArtikelBody.helfer.ts`
// (reine Funktionen, kein JSX, darum `.ts` ohne `x`) blieb damit unbewacht: ein
// `shadow-lg` dort ohne `.lc-schwebeflaeche` daneben wäre nicht aufgefallen.
// Glob statt fester Pfad — ergänzt jedes `ArtikelBody*.ts` (nicht `.tsx`, das
// deckt `alleTsx()` bereits ab) im Verzeichnis zum Sweep unten.
const ARTIKELBODY_TS_NUR = readdirSync(join(WURZEL, 'components/normtext'))
  .filter((n) => /^ArtikelBody.*\.ts$/.test(n))
  .map((n) => join(WURZEL, 'components/normtext', n));

// Leer-Treffer-Schutz 5.9.2026 (Gegenprüfung #719, §6.7 lit. b)
describe('Glob-Wächter', () => {
  it('Glob findet ArtikelBody-Dateien (.ts ohne x)', () => {
    expect(ARTIKELBODY_TS_NUR.length).toBeGreaterThan(0);
  });
});

/** Roh-Inhalt einer App-Datei, adressiert relativ zu `src/`. */
function lies(pfad: string): string {
  return liesRoh(join(WURZEL, pfad));
}

// ─── B3-1/B3-2 · der dichte Gruppenkopf ─────────────────────────────────────

/**
 * Das dichte Rezept: Overline-Kopf, Zähler unmittelbar am Titel.
 *
 * ── R4-B (5.9.2026) · zweimal zu eng gefasst, beides behoben ───────────────
 * (1) Der Ausdruck verlangte `className="lc-overline"` — die Klasse ALLEIN in
 *     ihren Anführungszeichen. Jeder Kopf, der daneben noch Layout trug
 *     (`className="lc-overline shrink-0 whitespace-nowrap …"`), lief durch.
 * (2) Geprüft wurde eine Vierer-LISTE statt der App. Das ist die Vakuum-Falle,
 *     die R3-α für vier andere Wächter aufgelöst hat (`tests/appDateien.ts`) —
 *     hier stand sie noch.
 * GEMESSEN am 5.9.2026: beides zusammen verdeckte die achte Kopie,
 * `pages/gesetz-leser/parts/BezuegeZeile.tsx` Z. 154–157 («KANTONAL 13»).
 * Der Sweep unten wird ohne deren Migration rot — das ist der Rot-Beweis
 * (§6.7) dieses Pakets.
 */
const DICHT_REZEPT = /className="[^"]*\blc-overline\b[^"]*"[^>]*>[\s\S]{0,80}?<span className="num tabular-nums ml-1 font-normal normal-case/;

describe('B3-1/B3-2 · dichte Gruppenköpfe laufen über `ui/GruppenKopf`', () => {
  const migriert = [
    // S6 (23.9.2026, deklariert): `PanelAnwendung.tsx` ist in
    // `PanelErlaeuterungen.tsx` und `PanelWerkzeuge.tsx` aufgegangen — beide
    // konsumieren den Baustein; die Negativ-Kontrolle unten zitiert den
    // Vorher-Wortlaut weiterhin als Beleg ihres Datums (§0 Ziff. 2b).
    'pages/gesetz-leser/v3/PanelErlaeuterungen.tsx',
    'pages/gesetz-leser/v3/PanelWerkzeuge.tsx',
    'pages/gesetz-leser/v3/PanelMaterialien.tsx',
    'pages/gesetz-leser/v3/PanelEntscheide.tsx',
    'components/kontext/KontextGruppe.tsx',
    // R4-B: vom App-weiten Sweep gefunden, nicht von der Liste.
    'pages/gesetz-leser/parts/BezuegeZeile.tsx',
  ];

  it('KEINE Fläche der App zeichnet das dichte Rezept noch selbst', () => {
    const rueckfaelle = alleTsx()
      .filter((p) => DICHT_REZEPT.test(ohneKommentare(liesRoh(p))))
      .map(rel);
    expect(rueckfaelle).toEqual([]);
  });

  it('NEGATIV-KONTROLLE: der Ausdruck findet die Vorher-Form', () => {
    // Wortlaut aus PanelAnwendung.tsx vor dem Fix (Stand 31.8.2026, Z. 127–129).
    const vorher = `
          <p className="lc-overline">Behörden-Praxis
            <span className="num tabular-nums ml-1 font-normal normal-case text-ink-500">{ressourcen.length}</span>
          </p>`;
    expect(DICHT_REZEPT.test(vorher)).toBe(true);
  });

  it('alle vier rendern stattdessen den Baustein', () => {
    for (const r of migriert) {
      expect(lies(r), `${r}: konsumiert ui/GruppenKopf`).toContain('<GruppenKopf');
    }
  });

  it('der Baustein trägt beide Gestalten — und der Zähler bleibt die nackte Zahl', () => {
    const b = lies('components/ui/GruppenKopf.tsx');
    expect(b, '`dicht` als Prop, nicht als zweiter Baustein').toMatch(/dicht\?: boolean/);
    expect(b, '`als="p"` für Köpfe ohne Outline-Wirkung').toMatch(/als\?: 'h' \| 'p'/);
    expect(b, 'Marke links ODER rechts').toMatch(/markeStellung\?: 'links' \| 'rechts'/);
    // C-2 bleibt: keine Klammern, kein Mittelpunkt, keine tote Utility (der
    // Dateikopf ZITIERT die Vorher-Form — geprüft wird das Markup).
    expect(ohneKommentare(b)).not.toContain('tabular-nums');
  });

  it('B3-2: die beiden breiten Kopien sind weg (Wizard-Sektion, Sperrtage-Zähler)', () => {
    // Die Haarlinie ist die Signatur des breiten Rezepts. Geprüft werden hier
    // NUR die beiden Dateien dieses Pakets — der App-weite Sweep über alle
    // Gruppenkopf-Flächen gehört zur Wurzel-Verschärfung des Parallel-Pakets.
    for (const r of ['components/vorlagen/ui.tsx', 'components/SperrtageZaehler.tsx']) {
      expect(ohneKommentare(lies(r)), `${r}: keine eigene Haarlinie mehr`)
        .not.toContain('flex-1 h-px bg-line');
      expect(lies(r), `${r}: konsumiert ui/GruppenKopf`).toContain('GruppenKopf');
    }
  });

  it('NEGATIV-KONTROLLE: die Haarlinien-Signatur trifft die Vorher-Form', () => {
    // Wortlaut aus vorlagen/ui.tsx vor dem Fix (Stand 31.8.2026, Z. 167–174).
    const vorher = `
    <div className="flex items-center gap-3">
      <p className="lc-overline text-brass-700">{children}</p>
      <span aria-hidden className="flex-1 h-px bg-line" />
    </div>`;
    expect(vorher).toContain('flex-1 h-px bg-line');
  });
});

// ─── A3-1 · EIN Schliess-✕ ──────────────────────────────────────────────────

/**
 * Wer das ✕ ausserhalb des Bausteins zeichnen darf — und WARUM. Drei Klassen:
 *   (a) BESCHRIFTETE Griffe: das ✕ steht dort neben einem Wort, ist also nicht
 *       der Knopf, sondern sein Vorzeichen.
 *   (b) ANDERE HANDLUNG: «leeren» und «verwerfen» sind kein «schliessen» —
 *       gleiche Glyphe, andere Aussage (§8); sie zusammenzuziehen wäre die
 *       Abstraktion, vor der §1 warnt.
 *   (c) OFFENER REST, ausdrücklich als solcher ausgewiesen statt weggeglättet.
 */
const X_AUSNAHMEN: Record<string, string> = {
  'components/ui/SchliessKnopf.tsx': 'der Baustein selbst',
  'components/rechtsprechung/LesemodusOverlay.tsx': '(a) beschrifteter Chip «✕ schliessen»',
  'pages/Suche.tsx': '(b) «Suche leeren»',
  'pages/gesetz-leser/v3/SuchSprungFeld.tsx': '(b) «Suche leeren (Esc)»',
  'pages/gesetz-leser/parts/WeiterlesenChip.tsx': '(b) «Angebot verwerfen» — verwirft, schliesst nicht',
};

/**
 * R7-A · die freistehende Steuerungs-Glyphe.
 *
 * FREISTEHEND heisst: die Glyphe IST das ganze Bedienelement. Steht sie neben
 * einem WORT, folgt sie dem Type ihres Wortes — dieselbe Trennung, die R6-C für
 * die beschrifteten ✕ gezogen hat, und der Grund, warum die zweite Klasse unten
 * als Ausnahme geführt wird statt angeglichen zu werden.
 */
const GRIFF_GLYPH_SPAN = /<span[^>]*aria-hidden[^>]*className="([^"]*)"[^>]*>\s*([^\s<{])\s*<\/span>/g;

/** Jede Utility, die Schriftgrösse oder Zeilenhöhe des Spans festschreibt. */
const TYPO_UTILITY = /\b(?:text-(?:xs|sm|base|lg|xl|micro|body-s|body|h1|h2|h3)|leading-none)\b/;

/**
 * Die Glyphen, die ihre Typografie behalten — nach Klasse getrennt, mit Grund.
 *
 * (a) ENTSCHEID DAVIDS · das `☰` steht in ZWEI Anatomien: 16 px/Geist Variable
 *     in der App-Topbar gegen 11 px/«Geist Mono Variable» im Leser-Griff
 *     (`lc-leiste-griff`). Anders als beim ✕ sind das zwei LEISTEN mit je
 *     eigener dokumentierter Anatomie (B6, 28.7.2026) — nach heutiger Regel
 *     also kein Defekt. Die Frage «soll dieselbe Glyphe in zwei Leisten
 *     verschieden aussehen?» ist nie entschieden worden; Runde 7 legt sie vor
 *     und nimmt sie NICHT vorweg (Fahrplan §3, Runde-7-Liste).
 *
 * (b) BESCHRIFTET · die Glyphe steht neben einem Wort und folgt dessen Type.
 *     Sie an die geteilte Gestalt zu binden hiesse, sie aus ihrer eigenen Zeile
 *     zu heben — genau der Fehler, den R6-C für die beschrifteten ✕ vermieden hat.
 */
const GRIFF_AUSNAHMEN: Record<string, string> = {
  'components/layout/Topbar.tsx · ☰': 'ENTSCHEID DAVIDS — Topbar-Anatomie gegen Leser-Griff',
  // W2·29 S3: die Schiene lebt seit 23.9.2026 in `leisteAufbau.tsx` (Datei aufgegangen).
  'pages/gesetz-leser/v3/leisteAufbau.tsx · ☰': 'ENTSCHEID DAVIDS — dieselbe offene Frage',
  'components/Katalog.tsx · →': 'BESCHRIFTET — Affordanz-Pfeil neben dem Karten-Titel',
  'components/normtext/ErlassKarte.tsx · ↗': 'BESCHRIFTET — Aussenlink-Pfeil neben dem Linktext',
  'components/suche/SuchResultate.tsx · →': 'BESCHRIFTET — Affordanz-Pfeil neben dem Treffer-Titel',
  'components/verzahnung/RegestePopover.tsx · ⧉': 'BESCHRIFTET — «⧉ Daneben öffnen» trägt sein Wort',
};

describe('A3-1 · das Schliess-✕ kommt aus EINEM Baustein', () => {
  it('keine weitere Fläche zeichnet das Glyph noch selbst', () => {
    const funde = alleTsx()
      .filter((p) => ohneKommentare(liesRoh(p)).includes('✕'))
      .map(rel)
      .filter((r) => !(r in X_AUSNAHMEN));
    expect(funde).toEqual([]);
  });

  // ── R6-A (5.9.2026) · das ✕ hat auch EINEN Schnitt, nicht nur EINE Quelle ──
  //
  // GEMESSEN am Preview (1600×900, frischer Kontext je Route, zehn Ansichten,
  // vierzehn ✕): die Glyphe stand überall in 16 px, aber in ZWEI Schnitten —
  // «Geist Mono Variable» im `InhaltsKopf` gegen «Geist Variable» sonst, weil
  // der Baustein am Glyph-Span nur die GRÖSSE festschrieb (`text-base
  // leading-none`) und die FAMILIE erben liess; genau ein Aufrufer bringt eine
  // mit (`klasse="lc-leiste-griff"`). Sichtbare Folge bei identischer
  // Schriftgrösse: 9.64 px ✕-Tinte gegen 12.20 px.
  //
  // Die halbe Deklaration ist dieselbe Bauart, die R4-C/R5-B beim Ziffernsatz
  // als Defekt nachgewiesen haben — darum wird hier BEIDES verlangt: der
  // Baustein trägt Grösse UND Schnitt, und zwar in der CSS-Regel, nicht am
  // Span (sonst lägen die zwei Hälften wieder an zwei Orten, §5).
  it('der Glyph-Schnitt liegt im Baustein, nicht in der Umgebung', () => {
    const block = /\.lc-griff-glyph \{([\s\S]*?)\}/.exec(CSS)?.[1] ?? '';
    expect(block, '.lc-griff-glyph existiert').not.toBe('');
    expect(block, 'der Schnitt steht im Baustein (sonst erbt die Glyphe die Mono der Leiste)')
      .toContain('font-family: var(--font-sans)');
    expect(block, 'die Grösse steht daneben, nicht am Span').toContain('font-size: 1rem');

    // Der Span holt seine Typografie NUR von dort — keine zweite Hälfte im TSX.
    const tsx = ohneKommentare(liesRoh(
      alleTsx().find((p) => rel(p) === 'components/ui/SchliessKnopf.tsx')!,
    ));
    const span = /<span aria-hidden className="([^"]*)">✕<\/span>/.exec(tsx)?.[1];
    expect(span, 'der ✕-Span trägt genau den Baustein').toBe('lc-griff-glyph');
  });

  // ── R6-C (5.9.2026) · die Gestalt gilt auch dort, wo die HANDLUNG eine ────
  //    andere ist. Die A3-1-Ausnahmeliste hält «leeren» zu Recht neben
  //    «schliessen» (§1/§8) — sie hat aber nie gefragt, ob die (b)-Klasse mit
  //    SICH SELBST übereinstimmt. GEMESSEN am Preview, drei Flächen mit
  //    identischem `aria-label` «Suche leeren»:
  //      start/UniversalSuche   16 px · Tinte 12.20 · Box 28×28 r8   ← Datei
  //                             entfallen mit D18 (6.9.2026), Messwert bleibt
  //                             als Beleg der damaligen Lage stehen (§0 Ziff. 2b)
  //      pages/Suche            16 px · Tinte 12.20 · Box 28×28 r8
  //      v3/SuchSprungFeld      14 px · Tinte 10.67 · Box 24×24 rund   ← Ausreisser
  //    Ein freistehendes ✕ trägt darum die geteilte Gestalt, egal welche
  //    Handlung daran hängt. Die BOX bleibt der Zeile (Baustein-Vertrag).
  it('kein freistehendes ✕ schreibt seine Typografie selbst hin', () => {
    const funde: string[] = [];
    for (const p of alleTsx()) {
      for (const m of ohneKommentare(liesRoh(p))
        .matchAll(/<span[^>]*aria-hidden[^>]*className="([^"]*)"[^>]*>\s*✕\s*<\/span>/g)) {
        if (m[1].trim() !== 'lc-griff-glyph') funde.push(`${rel(p)} · className="${m[1]}"`);
      }
    }
    expect(
      funde,
      'Ein freistehendes ✕ holt Grösse UND Schnitt aus `.lc-griff-glyph`; wer nur eine '
      + 'Hälfte hinschreibt (`text-base leading-none`), erbt die andere von der Umgebung (R6-A/R6-C).',
    ).toEqual([]);
  });

  // ── R7-A (5.9.2026) · DIESELBE FRAGE, AN DIE SACHE GESTELLT ──────────────
  //    Der Wächter darüber fragt nach EINEM Zeichen. Genau daran lief die halbe
  //    Deklaration an achtzehn weiteren Glyph-Spans vorbei — dieselbe Korrektur
  //    wie R6-B beim Ziffernsatz (dort die Schreibweise, hier das Zeichen).
  //    GEMESSEN am Preview (1600×900, echtes Split-Paar `?p=%2F…` nach R6-M) in
  //    EINER Zeile, der Pane-Titelleiste von `/gesetze/bund/OR?p=%2Frechtsprechung`:
  //      ◂ 14 px/Tinte 6.45 · ▸ 14 px/6.45 · ⇱ 14 px/8.44
  //      ⧉ 16 px/12.73    · ✕ 16 px/12.20
  //    Fünf Griffe derselben 28-px-Zeile in ZWEI Grössen. App-weit: 99
  //    freistehende Steuerungs-Glyphen in VIER Grössen (11/14/16/20 px).
  it('keine freistehende Steuerungs-Glyphe schreibt ihre Typografie selbst hin', () => {
    const funde: string[] = [];
    for (const p of alleTsx()) {
      for (const m of ohneKommentare(liesRoh(p)).matchAll(GRIFF_GLYPH_SPAN)) {
        const [, klasse, glyph] = m;
        if (klasse.trim() === 'lc-griff-glyph') continue;
        if (!TYPO_UTILITY.test(klasse)) continue;
        if (GRIFF_AUSNAHMEN[`${rel(p)} · ${glyph}`]) continue;
        funde.push(`${rel(p)} · «${glyph}» · className="${klasse}"`);
      }
    }
    expect(
      funde,
      'Eine freistehende Steuerungs-Glyphe holt Grösse UND Schnitt aus `.lc-griff-glyph`. '
      + 'Wer nur die Grösse hinschreibt (`text-base`/`text-body-s`/`text-micro` + `leading-none`), '
      + 'erbt den Schnitt von der Umgebung — dieselbe halbe Deklaration wie R4-C/R5-B beim '
      + 'Ziffernsatz und R6-A/R6-C beim ✕. Steht die Glyphe neben einem WORT, folgt sie dem Type '
      + 'ihres Wortes und gehört in GRIFF_AUSNAHMEN.',
    ).toEqual([]);
  });

  it('ROT-BEWEIS: die vier Vorher-Formen der Runde 7 fallen auf, die Ausnahmen nicht', () => {
    const sonde = (q: string): string[] => [...q.matchAll(GRIFF_GLYPH_SPAN)]
      .filter((m) => m[1].trim() !== 'lc-griff-glyph' && TYPO_UTILITY.test(m[1]))
      .map((m) => `${m[2]}:${m[1]}`);
    // Wortlaute im Stand vom 5.9.2026 VOR R7-A — Belege, nie nachgeführt (§2b).
    expect(sonde('<span aria-hidden className="text-body-s leading-none">◂</span>'))
      .toEqual(['◂:text-body-s leading-none']);          // PaneKopf, 14 px
    expect(sonde('<span aria-hidden className="text-base leading-none">⧉</span>'))
      .toEqual(['⧉:text-base leading-none']);            // PaneKopf, 16 px — dieselbe Zeile
    expect(sonde('<span aria-hidden className="text-micro leading-none">▲</span>'))
      .toEqual(['▲:text-micro leading-none']);           // TabPanel, 11 px
    expect(sonde('<span aria-hidden className="text-base leading-none">↓</span>'))
      .toEqual(['↓:text-base leading-none']);            // TrefferLeiste
    // Negativ-Kontrolle 1: die migrierte Form fällt NICHT auf.
    expect(sonde('<span aria-hidden className="lc-griff-glyph">◂</span>')).toEqual([]);
    // Negativ-Kontrolle 2: eine Glyphe OHNE Typo-Utility schreibt nichts hin und
    // erbt darum auch nichts Halbes — der Breadcrumb-Trenner, die Farbe allein.
    expect(sonde('<span aria-hidden className="mr-0.5 text-ink-400">‹</span>')).toEqual([]);
    // Negativ-Kontrolle 3: die Kopf-Griffe des Lesers holen ihre Gestalt aus
    // `kopfGlypheKlassen()` — ein Ausdruck, kein String-Literal, also EINE
    // benannte Stelle statt einer halben Deklaration.
    expect(sonde('<span aria-hidden className={kopfGlypheKlassen(kompakt)}>⚖</span>')).toEqual([]);
  });

  it('die Ausnahmen sind nach Klasse getrennt — ein offener Entscheid ist kein Defekt', () => {
    // Zwei Klassen, zwei Gründe. Sie dürfen nicht verschwimmen: die eine wartet
    // auf David, die andere ist bereits entschieden (Glyphe folgt ihrem Wort).
    const davids = Object.entries(GRIFF_AUSNAHMEN).filter(([, g]) => g.startsWith('ENTSCHEID DAVIDS'));
    const beschriftet = Object.entries(GRIFF_AUSNAHMEN).filter(([, g]) => g.startsWith('BESCHRIFTET'));
    expect(davids.length + beschriftet.length, 'jede Ausnahme trägt genau einen der zwei Gründe')
      .toBe(Object.keys(GRIFF_AUSNAHMEN).length);
    // Der offene Entscheid betrifft AUSSCHLIESSLICH das ☰ (Fahrplan §3, Runde-7-Liste).
    expect(davids.map(([k]) => k.split(' · ')[1]).every((g) => g === '☰'), 'nur das ☰ wartet auf David')
      .toBe(true);
    // W2·24-DESIGN-IDENTITAET R2 (6.9.2026): die dritte ☰-Fundstelle war der
    // Reiter-Trigger in `ReiterUebersicht.tsx`. Der Baustein ist mit R2
    // GELÖSCHT (die offenen Reiter stehen sichtbar in der Arbeitsleiste,
    // §5a) — die Ausnahme fällt mit ihm weg, statt auf einen anderen Fundort
    // umgehängt zu werden. Der offene David-Entscheid selbst ist unberührt und
    // betrifft weiter die zwei verbliebenen ☰.
    expect(davids.length, 'zwei ☰-Fundstellen: Topbar, Gliederungs-Schiene').toBe(2);
  });

  it('ROT-BEWEIS: beide Vorher-Formen der freistehenden ✕ fallen auf', () => {
    const sweep = (q: string): string[] => [...q.matchAll(
      /<span[^>]*aria-hidden[^>]*className="([^"]*)"[^>]*>\s*✕\s*<\/span>/g,
    )].map((m) => m[1]).filter((k) => k.trim() !== 'lc-griff-glyph');
    // Wortlaute im Stand vom 5.9.2026 vor R6-A/R6-C — Belege, nie nachgeführt (§2b).
    expect(sweep('<span aria-hidden className="text-base leading-none">✕</span>')).toEqual(['text-base leading-none']);
    expect(sweep('<span aria-hidden className="text-body-s leading-none">✕</span>')).toEqual(['text-body-s leading-none']);
    // Negativ-Kontrolle 1: die migrierte Form fällt NICHT auf.
    expect(sweep('<span aria-hidden className="lc-griff-glyph">✕</span>')).toEqual([]);
    // Negativ-Kontrolle 2: ein BESCHRIFTETES ✕ (Klasse (a)) schreibt gar keine
    // Typografie hin und wird von der Sonde darum nicht berührt — es soll der
    // Type seines Wortes folgen, nicht der geteilten Gestalt.
    expect(sweep('<span aria-hidden>✕</span><span>ausblenden</span>')).toEqual([]);
  });

  it('ROT-BEWEIS: die Vorher-Form des Spans fällt auf', () => {
    // Wortlaut aus `ui/SchliessKnopf.tsx` im Stand vom 5.9.2026 vor R6-A —
    // Beleg, nie nachgeführt (§2b). Er nannte die Grösse und schwieg zum Schnitt.
    const vorher = '<span aria-hidden className="text-base leading-none">✕</span>';
    const klasse = /<span aria-hidden className="([^"]*)">✕<\/span>/.exec(vorher)?.[1];
    expect(klasse).toBe('text-base leading-none');
    expect(klasse).not.toBe('lc-griff-glyph');
  });

  it('NEGATIV-KONTROLLE: der Sweep sieht das Glyph im Markup, nicht im Kommentar', () => {
    const vorher = `<button aria-label="Navigation schliessen"><span aria-hidden>✕</span></button>`;
    expect(ohneKommentare(vorher)).toContain('✕');
    expect(ohneKommentare('/* die Leiste endet mit ✕ */\nconst x = 1;')).not.toContain('✕');
  });

  it('die sieben Konsumenten rendern den Baustein', () => {
    const konsumenten = [
      'components/layout/Shell.tsx',
      'components/layout/HeaderSuche.tsx',
      'components/layout/InhaltsKopf.tsx',
      'components/layout/TabPanel.tsx',
      'components/NormPopover.tsx',
      'components/ui/SheetRahmen.tsx',
      'pages/gesetz-leser/v3/LeserPanel.tsx',
      // Achte Fundstelle, im Bau dazugekommen: die zeichengleiche Kopie der
      // NormPopover-Kopfzeile in `vorlagen/NormChip.tsx` (§5).
      'components/vorlagen/NormChip.tsx',
      // R4-A (5.9.2026): die als «(c) OFFEN (R3-γ)» ausgewiesene neunte Fläche
      // ist eingesammelt — der Klassen-String der Pane-Titelleiste ist in BOX
      // (`GRIFF_BOX`) und Hover-Fläche (`GRIFF_FLAECHE`) geteilt, das ✕ holt
      // seinen Ton als `ton="destruktiv"` aus dem Baustein.
      'components/layout/PaneKopf.tsx',
    ];
    for (const r of konsumenten) {
      expect(lies(r), `${r}: rendert <SchliessKnopf`).toContain('<SchliessKnopf');
    }
  });

  it('genau drei Töne, und der destruktive ist DEKLARIERT (nicht eine Farb-Utility)', () => {
    const b = lies('components/ui/SchliessKnopf.tsx');
    expect(b).toContain("ruhig: 'text-ink-500 hover:text-brass-700'");
    expect(b).toContain("destruktiv: 'text-ink-500 hover:text-danger-700'");
    expect(b).toContain("geerbt: ''");
    expect(lies('components/layout/TabPanel.tsx'), 'Reiter schliessen = destruktiv')
      .toContain('ton="destruktiv"');
    // Die Farbe darf nicht wieder als lose Utility neben dem Baustein stehen.
    expect(ohneKommentare(lies('components/layout/TabPanel.tsx')))
      .not.toContain('hover:text-danger-700');
    // R4-A: dieselbe Regel für die Pane-Titelleiste — dort stand der Ton als
    // Anhängsel an einem Klassen-String, der bereits `hover:text-brass-700`
    // trug. GEMESSEN am Preview (5.9.2026): beide Utilities auf EINEM Knopf,
    // gemalt wurde `rgb(122,47,35)` (danger-700) — allein wegen der Sortierung
    // im Stylesheet. Kein Knopf der App trägt zwei Hover-Töne gleichzeitig.
    const pk = ohneKommentare(lies('components/layout/PaneKopf.tsx'));
    expect(pk, 'Pane-✕ = destruktiv, deklariert').toContain('ton="destruktiv"');
    expect(pk, 'kein loser danger-Ton neben dem Baustein').not.toContain('hover:text-danger-700');
    const doppelHover = (quelle: string): string[] =>
      (quelle.match(/class[nN]ame=\{?[`"'][^`"']*[`"']/g) ?? [])
        .filter((m) => m.includes('hover:text-brass-700') && m.includes('hover:text-danger-700'));
    // NEGATIV-KONTROLLE (§6.7): der Ausdruck sieht die Vorher-Form. Wortlaut aus
    // PaneKopf.tsx Z. 159 im Stand vom 31.8.2026 — `knopf` trug den Brass-Ton,
    // der Fundort hängte den Danger-Ton an; Tailwind mischt beide in EINE
    // Klassenliste. Der Beleg wird NIE nachgeführt (§2b).
    const vorherPaneX = 'className={`${knopf} hover:text-danger-700`}';
    const knopfString = 'className="inline-flex h-7 w-7 text-ink-500 hover:text-brass-700 hover:text-danger-700"';
    expect(vorherPaneX).toContain('hover:text-danger-700');
    expect(doppelHover(knopfString)).toHaveLength(1);
    for (const r of alleTsx()) {
      const funde = doppelHover(ohneKommentare(liesRoh(r)));
      expect(funde, `${rel(r)}: zwei Hover-Töne in EINEM Klassen-String`).toEqual([]);
    }
  });

  it('die Trefferfläche wächst per ::after auf das Komfort-Token (F9: kein roher Wert)', () => {
    const block = /\.lc-schliessknopf-komfort::after \{([\s\S]*?)\}/.exec(CSS)?.[1] ?? '';
    expect(block, '.lc-schliessknopf-komfort::after existiert').not.toBe('');
    expect(block, 'Komfortmass aus dem Token').toContain('min-width: var(--tap-ziel-komfort)');
    expect(block, 'Komfortmass aus dem Token').toContain('min-height: var(--tap-ziel-komfort)');
    const basis = /\.lc-schliessknopf \{([\s\S]*?)\}/.exec(CSS)?.[1] ?? '';
    expect(basis, 'sichtbare Untergrenze aus dem Token').toContain('var(--tap-ziel)');
    expect(basis, 'die Pseudo-Fläche braucht einen Positionsanker').toContain('relative');
  });

  it('die Komfort-Fläche ist an, ausser in den drei begründeten dichten Zeilen', () => {
    // Das Pseudo-Element liegt ÜBER dem Nachbarn und nähme ihm die Klicks —
    // wer es abschaltet, tut das sichtbar und mit Grund am Fundort. Ein
    // stiller vierter Ausstieg wird hier rot.
    //
    // R4-A (5.9.2026): die Pane-Titelleiste ist die dritte solche Zeile —
    // ⠿ ◂ ▸ ⇱ ⧉ ✕ stehen dort in einer 36 px hohen Leiste unmittelbar
    // nebeneinander; 44 px um das ✕ lägen über ⧉ und ▸. Der Test hat die
    // Ausnahme beim Bau selbst gefunden (rot, bevor sie deklariert war).
    //
    // W2·24 R2 (6.9.2026): die Arbeitsleiste ist die VIERTE solche Zeile — ein
    // Reiter ist 28 px hoch und trägt Beschriftung, ⧉ und ✕ unmittelbar
    // nebeneinander, daneben steht schon der nächste Reiter. 44 px um das ✕
    // lägen über beiden. Deklariert, nicht still: derselbe Weg wie R4-A.
    const dicht = [
      'components/layout/TabPanel.tsx',
      'components/layout/InhaltsKopf.tsx',
      'components/layout/PaneKopf.tsx',
      // W2·24-R13 (7.9.2026): der Reiter wohnt seit dem §6.6-Split der
      // Arbeitsleiste in einer eigenen Datei — dieselbe Zeile, derselbe Grund,
      // nur ein neuer Pfad.
      'components/layout/reiterleiste/Reiter.tsx',
    ];
    const funde = alleTsx()
      .filter((p) => ohneKommentare(liesRoh(p)).includes('komfort={false}'))
      .map(rel);
    expect(funde.sort()).toEqual([...dicht].sort());
    for (const r of dicht) {
      expect(lies(r), `${r}: die Ausnahme ist am Fundort begründet`)
        .toMatch(/komfort=\{false\}|`komfort=\{false\}`/);
    }
  });
});

// ─── R4-C · `.num` UND `tabular-nums` sind kein Paar, sondern ein Konflikt ──

/**
 * GEMESSEN am Preview (5.9.2026, Chromium 1440×900, `getComputedStyle`):
 *
 *   `<span class="num">`                → font-variant-numeric: lining-nums tabular-nums
 *   `<span class="num tabular-nums">`   → font-variant-numeric: tabular-nums
 *
 * Die Utility ist also NICHT bloss tot (so stand es in der R3-γ-Liste), sie ist
 * SCHÄDLICH: `.num` lebt in `@layer components`, `tabular-nums` in
 * `@layer utilities` — die spätere Schicht gewinnt und ersetzt die ganze
 * Deklaration, `lining-nums` fällt dabei weg. Genau das, was der Kommentar an
 * `.num` (index.css) als «ausdrücklich Versal- UND Tabellenziffern» verlangt,
 * schaltete das vermeintlich redundante Wort ab.
 *
 * Betroffen waren 16 Fundstellen in 11 Dateien; Ziffern derselben Rolle liefen
 * dadurch in zwei Rendering-Modi — der Kernbefund dieses Fahrplans.
 *
 * `tabular-nums` OHNE `.num` bleibt zulässig und unberührt: dort trägt die
 * Utility die Textstimme (`ui/Datum`, Stand-Zeilen, Treffer-Zähler) und hat
 * keinen Konflikt-Partner.
 */
/**
 * STREICH-ENTSCHEID RUNDE 7 (5.9.2026, §17-Gegengewicht): GEPRÜFT, BEHALTEN.
 *
 * Runde 6 hatte diese Sonde als Rückbau-Kandidaten notiert — seit R6-B verbietet
 * der verbreiterte R5-B-Wächter (`ZIFFERNSATZ_ROH`) die Zutat `tabular-nums`
 * app-weit, also kann hier nichts mehr ankommen, was dort nicht schon aufgefallen
 * wäre. Runde 7 hat das GEMESSEN statt geerbt, mit zwei Mutationen am echten
 * Quelltext:
 *
 *   (1) `<span className="num tabular-nums">{2024}</span>` in eine echte .tsx
 *       (`verzahnung/KanteMitVorschau.tsx`) eingesetzt
 *       → BEIDE rot: R4-C «App-weit keine Fundstelle mehr» UND R5-B «keine
 *         App-Datei schreibt den Ziffernsatz noch roh hin».
 *   (2) derselbe Konflikt in die EINZIGE R5-B-Ausnahme
 *       (`vorlagen/vorschauStil.ts`) eingesetzt
 *       → BEIDE grün: die Ausnahme ist eine `.ts`-Datei, und `alleTsx()` liest
 *         sie gar nicht. Es gibt also keine Lücke, in der R4-C allein anschlüge.
 *
 * BEFUND: die Sonde kann nicht mehr allein scheitern; sie ist von R5-B
 * vollständig überdeckt. Sie ist damit REDUNDANT, aber nicht TOT (§6.7): unter
 * Mutation (1) wird sie nachweislich rot.
 *
 * ENTSCHEID: BEHALTEN. Das §17-Gegengewicht lässt den Rückbau gewinnen, «ausser
 * die Stelle hat einen datierten Vorfall verhindert» — und genau das ist hier
 * der Fall: 16 Fundstellen in 11 Dateien, der Kernbefund dieses Fahrplans. Der
 * Rest-Nutzen ist die DIAGNOSE: R5-B meldet «irgendwo roher Ziffernsatz», diese
 * Sonde benennt den teuren Sonderfall («`tabular-nums` neben `.num` nimmt
 * `lining-nums` weg»). Wer sie künftig streichen will, misst zuerst neu — die
 * zwei Mutationen oben sind der Weg, nicht dieser Kommentar.
 */
describe('R4-C · keine Klassenliste trägt `.num` und `tabular-nums` zugleich', () => {
  const konflikt = (quelle: string): string[] =>
    (quelle.match(/class[nN]ame=\{?[`"][^`"]*[`"]/g) ?? [])
      .filter((t) => /\bnum\b/.test(t.replace(/tabular-nums/g, '')) && t.includes('tabular-nums'));

  it('NEGATIV-KONTROLLE: die Sonde sieht die Vorher-Form, und nur sie', () => {
    // Wortlaut aus `verzahnung/BezugZeitWahl.tsx` Z. 212 im Stand vom
    // 31.8.2026 — Beleg, nie nachgeführt (§2b).
    expect(konflikt('<span className="num tabular-nums">{jahr}</span>')).toHaveLength(1);
    // Die zwei erlaubten Nachbarschaften bleiben grün:
    expect(konflikt('<span className="num text-ink-500">{n}</span>')).toEqual([]);
    expect(konflikt('<p className="text-xs tabular-nums">{stand}</p>')).toEqual([]);
  });

  it('App-weit keine Fundstelle mehr', () => {
    for (const p of alleTsx()) {
      const funde = konflikt(ohneKommentare(liesRoh(p)));
      expect(funde, `${rel(p)}: \`tabular-nums\` neben \`.num\` nimmt \`lining-nums\` weg`).toEqual([]);
    }
  });
});

// ─── A3-2 · EINE Schwebefläche ──────────────────────────────────────────────

/**
 * `shadow-lg` ist die Signatur einer schwebenden Fläche. Wer sie trägt, trägt
 * `.lc-schwebeflaeche` — ausser die Fläche ist gar keine RECHTECKIGE Tafel:
 */
const SCHWEBE_AUSNAHMEN: Record<string, string> = {
  'components/ui/SchwebeMeldung.tsx': 'Pille (rounded-full, ohne Rahmen) — andere Gestalt',
  'components/ui/SheetRahmen.tsx': 'Bottom-Sheet: an die Kante gebaut (rounded-t-xl, border-t)',
  'components/layout/Shell.tsx': 'Navigations-Schublade: volle Höhe, border-r, ohne Radius',
  'components/vorlagen/wizard.tsx': 'runder Aktionsknopf (FAB), keine Fläche',
};

describe('A3-2 · schwebende Flächen teilen EINE Anatomie', () => {
  // ── R6/R7 (Prüfer D23/R11, 6.9.2026) · DEKLARIERTE TEST-ÄNDERUNG (§6.3) ────
  // Der WÄCHTER bleibt derselbe — «alle schwebenden Flächen teilen EINE
  // Anatomie, und die steht in EINER Klasse». Was sich geändert hat, ist die
  // Anatomie selbst: Kissen (`bg-paper-raised`), Radius (`rounded-lg`) und
  // Schlagschatten (`shadow-lg`) sind mit dem Menü-Nachzug gefallen; die Fläche
  // trägt jetzt Papier + 1 px `--rule`, kantig und schattenlos (Herleitung an
  // der Klasse in `index.css`). Die Liste zieht darum mit, der Fall selbst
  // nicht: er zählt weiterhin die Glieder der EINEN Kette ab.
  // ── W2·29-WERKBANK-GRUNDTON (David 23.9.2026) · DEKLARIERTE TEST-ÄNDERUNG (§6.3)
  // «ingesamt dürfen wieder mehr rudungen eingeführt werden … als grundregel für
  // den gesamten umbau»: das Radius-Glied ist jetzt die Karten-Stufe
  // `var(--radius-lg)` (10 px) statt 0. Der Wächter bleibt: EINE Kette, EINE Klasse.
  it('die Klasse führt alle vier Glieder der gemessenen Kette', () => {
    const block = /\.lc-schwebeflaeche \{([\s\S]*?)\}/.exec(CSS)?.[1] ?? '';
    for (const glied of ['var(--paper)', '1px solid var(--rule)', 'border-radius: var(--radius-lg)', 'box-shadow: none']) {
      expect(block, `.lc-schwebeflaeche führt ${glied}`).toContain(glied);
    }
    // Und die drei gefallenen Glieder stehen nicht mehr da (Rot-Probe gegen ein
    // stilles Zurückrutschen auf die Kissen-Anatomie).
    for (const weg of ['bg-paper-raised', 'rounded-lg', 'shadow-lg']) {
      expect(block, `.lc-schwebeflaeche führt ${weg} NICHT mehr`).not.toContain(weg);
    }
  });

  it('keine Fläche baut die Kette noch selbst', () => {
    const funde: string[] = [];
    for (const p of [...alleTsx(), ...ARTIKELBODY_TS_NUR]) {
      if (rel(p) in SCHWEBE_AUSNAHMEN) continue;
      for (const zeile of ohneKommentare(liesRoh(p)).split('\n')) {
        if (zeile.includes('shadow-lg') && !zeile.includes('lc-schwebeflaeche')) {
          funde.push(`${rel(p)} · ${zeile.trim().slice(0, 80)}`);
        }
      }
    }
    expect(funde).toEqual([]);
  });

  it('NEGATIV-KONTROLLE: der Sweep findet die Vorher-Form', () => {
    // Wortlaut aus LeserTrefferBlatt.tsx vor dem Fix (Stand 31.8.2026, Z. 102).
    const vorher = 'className="absolute left-0 top-full z-30 flex max-h-[50dvh] w-72 max-w-full flex-col rounded-lg border border-line bg-paper shadow-lg">';
    expect(vorher.includes('shadow-lg') && !vorher.includes('lc-schwebeflaeche')).toBe(true);
  });

  it('die sieben Konsumenten tragen die Klasse — samt des verbliebenen Fixes', () => {
    const konsumenten = [
      'components/SprachUmschalter.tsx',
      'components/DatumsFeld.tsx',
      'components/layout/VerlaufUebersicht.tsx',
      // W2·24-R13 (7.9.2026): das Überlauf-Blatt der Arbeitsleiste steht seit
      // dem §6.6-Split in `reiterleiste/ReiterBlatt.tsx`.
      'components/layout/reiterleiste/ReiterBlatt.tsx',
      'pages/gesetz-leser/v3/LeserAnsichtV3.tsx',
      'pages/gesetz-leser/v3/LeserPanel.tsx',
      // D38 (7.9.2026): `LeserTrefferBlatt.tsx` ist gelöscht — die Trefferliste
      // liegt seither über der Lesespalte statt als Blatt am Feld
      // (`v3/LeserTrefferSpalte.tsx`, keine schwebende Fläche mehr). Die
      // NEGATIV-KONTROLLE oben behält ihren historischen Wortlaut: sie ist ein
      // String im Test, kein Verweis auf eine Datei (§2b — ein Beleg wird nicht
      // an den neuen Ist-Stand nachgeführt).
      'components/normtext/ArtikelBody.tsx',
    ];
    for (const r of konsumenten) {
      expect(lies(r), `${r}: trägt .lc-schwebeflaeche`).toContain('lc-schwebeflaeche');
    }
    // Die zwei Fixes: keine schwebende Fläche steht mehr in der GRUNDfarbe der
    // Seite — ein Schatten über `--paper` behauptet eine Ebene, die die Fläche
    // dementiert.
    for (const r of ['components/normtext/ArtikelBody.tsx']) {
      expect(ohneKommentare(lies(r)), `${r}: nicht mehr bg-paper`).not.toMatch(/bg-paper[^-]/);
    }
  });
});

// ─── A3-3 · EINE Treffer-Zeile ──────────────────────────────────────────────

describe('A3-3 · die Live-Suche konsumiert `ui/TrefferZeile`', () => {
  it('Baustein und gemeinsamer Rahmen statt lokaler Kopie', () => {
    const q = lies('components/rechtsprechung/LiveSuche.tsx');
    expect(q, 'rendert den Baustein').toContain('<TrefferZeile');
    expect(q, 'teilt die Flex-Geometrie/den Gruppen-Namen').toContain('TREFFER_ZEILE_RAHMEN');
    expect(ohneKommentare(q), 'keine eigene Zeilen-Geometrie mehr')
      .not.toContain('group flex items-stretch gap-3');
  });

  it('NUR der Baustein definiert eine Treffer-Zeile — auch ohne `export`', () => {
    // Der Sweep aus Runde 2 (`design-r2c-bausteine.test.ts`) prüfte auf
    // `export function TrefferZeile(` und ging an der Live-Suche vorbei, weil
    // deren Kopie modul-lokal war. Vakuum-Lücke geschlossen (§6.7).
    const funde = alleTsx()
      .filter((p) => /function TrefferZeile\(/.test(liesRoh(p)))
      .map(rel);
    expect(funde).toEqual(['components/ui/TrefferZeile.tsx']);
  });

  it('NEGATIV-KONTROLLE: der Ausdruck findet die modul-lokale Kopie', () => {
    expect(/function TrefferZeile\(/.test('function TrefferZeile({ t }: { t: LiveTreffer }) {')).toBe(true);
  });

  it('die zwei additiven Slots stehen im Baustein, nicht in der Fläche', () => {
    const b = lies('components/ui/TrefferZeile.tsx');
    expect(b, 'Herkunfts-Zeile als Slot').toContain('meta?: ReactNode');
    expect(b, '«führt hinaus» als Pfeil-Wert').toContain("pfeil?: '→' | '↵' | '↗' | null");
  });
});
