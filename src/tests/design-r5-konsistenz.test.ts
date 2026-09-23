/**
 * W2·19-DESIGN-KONSISTENZ — Runde 5 (5.9.2026).
 *
 * Bewacht die drei Kanons dieser Runde:
 *   R5-A · EIN App-Sweep — kein Wächter baut die Verzeichnis-Wanderung nach.
 *   R5-B · EINE Ziffernsatz-Deklaration (`.num` / `.lc-ziffern`), keine rohe
 *          `fontVariantNumeric`-Zeile in der App.
 *   R5-D · EINE neutrale Hover-Fläche (`.lc-hover-flaeche`), nicht drei
 *          Stärken derselben Aussage.
 *
 * QUELLTEXT-SONDE, kein Render-Test: bewacht wird «diese Form kommt in der App
 * genau einmal vor» — am Quelltext messbar, am DOM einer einzelnen Seite nicht
 * (gleiche Bauart wie `design-r3b-chrome.test.ts`).
 *
 * ROT-BEWEIS (§6.7): jeder Fall trägt eine NEGATIV-KONTROLLE mit dem Wortlaut,
 * wie er VOR dieser Runde im Repo stand. Läuft die Kontrolle grün, prüft der
 * Ausdruck nichts und der Fall ist wertlos.
 *
 * EIGENE AUSNAHME: diese Datei steht in ihrer eigenen Sweep-Liste, weil ihre
 * Negativ-Kontrolle die verbotene Form zwangsläufig ZITIERT (§2b/§6.7) — ein
 * Wächter, der seinen eigenen Rot-Beweis als Verstoss liest, zwänge zum Löschen
 * genau des Belegs, der ihn beweisbar macht.
 *
 * LEHRE AUS R4-D, hier angewandt: ein Wächter hängt an der SACHE, nicht an
 * einem Variablennamen. R5-A sucht deshalb nicht «heisst die Funktion
 * alleTsx», sondern «wandert diese Datei selbst durch src und überspringt
 * dabei den tests-Ordner» — das ist die Signatur eines App-Sweeps, gleich wie
 * seine Helfer heissen.
 *
 * Reine Darstellung (§3) — keine Rechtslogik berührt.
 */
import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { readdirSync } from 'node:fs';
import { APP_WURZEL, alleQuellen, alleTsx, rel, ohneKommentare, liesRoh, pruefeAusnahmen } from './appDateien';

const CSS = liesRoh(join(APP_WURZEL, 'index.css'));
const TEST_ORDNER = join(APP_WURZEL, 'tests');

// ─── R5-A · EIN App-Sweep ───────────────────────────────────────────────────

/**
 * Die Signatur eines eigenen App-Sweeps: die Datei ruft selbst `readdirSync`
 * UND kennt den Ordnernamen, den nur ein src-Sweep überspringen muss.
 *
 * An der SACHE, nicht am Namen: `alleTsx`, `alleQuellen`, `dateien`,
 * `darstellungsDateien` — vier Namen für dasselbe standen im Repo. Der
 * Ausdruck fragt nach keinem davon.
 */
const EIGENER_SWEEP = (quelle: string): boolean =>
  /\breaddirSync\s*\(/.test(quelle) && /===\s*'tests'/.test(quelle);

/**
 * Die zwei Sonden, die ihren Sweep behalten — beide, weil sie eine ANDERE
 * Frage stellen, nicht weil sie älter sind. Die Begründung steht am Fundort
 * und wird hier wörtlich zitiert: verschwindet sie dort, fällt die Ausnahme.
 */
const SWEEP_AUSNAHMEN = [
  {
    datei: 'tests/appDateien.ts',
    begruendung: '§5: die Verzeichnis-Wanderung liegt genau einmal hier statt viermal kopiert.',
  },
  {
    datei: 'tests/listen-editor-r2f.test.tsx',
    begruendung: 'dieser Sweep\n *  fegt bewusst NUR HANDGESCHRIEBENES',
  },
  {
    datei: 'tests/design-r5-konsistenz.test.ts',
    begruendung: 'der seinen eigenen Rot-Beweis als Verstoss liest',
  },
  {
    datei: 'tests/erlass-adresse.test.ts',
    begruendung: 'sucht nach ADRESSEN, also nach Zeichenketten mit `//` darin',
  },
] as const;

describe('R5-A · die App wird von EINEM Sweep gefegt', () => {
  it('kein Wächter baut die Verzeichnis-Wanderung ein zweites Mal nach', () => {
    const erlaubt = pruefeAusnahmen(SWEEP_AUSNAHMEN);
    const eigene: string[] = [];
    for (const name of readdirSync(TEST_ORDNER)) {
      if (!/\.tsx?$/.test(name)) continue;
      const pfad = `tests/${name}`;
      if (erlaubt.has(pfad)) continue;
      if (EIGENER_SWEEP(liesRoh(join(TEST_ORDNER, name)))) eigene.push(pfad);
    }
    expect(
      eigene,
      'Diese Sonden wandern selbst durch src/. Der Baustein heisst `appDateien.ts` '
      + '(`alleTsx`/`alleQuellen`/`rel`/`ohneKommentare`) — eine zweite Wanderung ist ab '
      + 'ihrer ersten Abweichung ein zweiter, stiller Wächter (§5/§17).',
    ).toEqual([]);
  });

  it('ROT-BEWEIS: der Ausdruck erkennt die Form, die vor R5-A hier stand', () => {
    // Wortlaut aus design-r3b-chrome.test.ts, Stand vor dieser Runde.
    const vorher = [
      "import { readFileSync, readdirSync, statSync } from 'node:fs';",
      'function alleTsx(dir = WURZEL, treffer: string[] = []): string[] {',
      '  for (const name of readdirSync(dir)) {',
      "    if (name === 'tests' || name === 'fixtures') continue;",
      '  }',
    ].join('\n');
    expect(EIGENER_SWEEP(vorher), 'die Vorher-Form muss auffallen').toBe(true);
    // Negativ-Kontrolle: die migrierte Form fällt NICHT auf.
    expect(EIGENER_SWEEP(liesRoh(join(TEST_ORDNER, 'design-r3b-chrome.test.ts')))).toBe(false);
  });

  it('die drei migrierten Sonden hängen wirklich am Baustein', () => {
    for (const n of ['design-r3b-chrome.test.ts', 'design-r2c-bausteine.test.ts', 'design-r2d-mobil-zustaende.test.ts']) {
      expect(liesRoh(join(TEST_ORDNER, n)), `${n}: importiert appDateien`)
        .toMatch(/from '\.\/appDateien'/);
    }
  });
});

// ─── R5-B · EINE Ziffernsatz-Deklaration ────────────────────────────────────

const ZIFFERN_AUSNAHMEN = [
  {
    datei: 'components/vorlagen/vorschauStil.ts',
    begruendung: 'VORSCHAU ist ein\n  // GESCHLOSSENES Stil-Objekt',
  },
] as const;

/**
 * Der Ziffernsatz, roh geschrieben — in JEDER Schreibweise, die ihn erzeugt.
 *
 * R6-B (5.9.2026, §17/§6.7): bis hierher fragte der Wächter nur nach der
 * LANGFORM (`fontVariantNumeric` / `font-variant-numeric`). Genau daran lief
 * die Tailwind-Utility `tabular-nums` vorbei, die dieselbe CSS-Eigenschaft
 * setzt — und zwar HALB (ohne `lining-nums`), also in der Form, die R4-C als
 * Defekt nachgewiesen und R5-B in zwei Flächen behoben hatte. GEMESSEN am
 * Preview (1600×900): auf `/gesetze/bund/OR` standen 12 Elemente mit
 * `tabular-nums` neben 8'254 mit `lining-nums tabular-nums` — EINE Rolle,
 * zwei Werte, Wächter grün. Quelltext-Sweep: 11 Fundstellen in 7 Dateien.
 *
 * Der Ausdruck fragt jetzt nach der SACHE: jede Schreibweise, die den
 * Ziffernsatz setzt. Das ist dieselbe Korrektur wie R3-α bei den Datei-Listen,
 * eine Ebene tiefer — dort war es die Liste, hier die Schreibweise.
 */
const ZIFFERNSATZ_ROH =
  /fontVariantNumeric|font-variant-numeric|\b(?:tabular|lining|proportional|oldstyle)-nums\b|\bslashed-zero\b/;

describe('R5-B · der Ziffernsatz hat EINE Deklaration', () => {
  it('index.css führt die Rolle ohne Familie und die Rolle mit Familie getrennt', () => {
    expect(CSS, '`.lc-ziffern` ist die Rolle ohne Monospace-Familie')
      .toContain('.num, .lc-ziffern { font-variant-numeric: lining-nums tabular-nums; }');
    // NACHZUG W2·24-DESIGN-IDENTITAET R1 (6.9.2026, DEKLARIERTE Änderung §6.3 —
    // hier am 6.9.2026 im R3-Lauf nachgeholt, weil der R1-Nachzug-Commit
    // 0aa7e3244 diesen Wächter rot zurückliess): `.num` trägt KEINE
    // Monospace-Familie mehr. Grund am Fundort (index.css, Zeile «R1-Nachzug»):
    // die Klasse steht auch auf Zeilen mit Wörtern, die dann als Schreibmaschine
    // liefen; Mono bleibt --font-mono für Rechenweg/Code vorbehalten. Der Fall
    // prüft weiterhin die SACHE — dass `.num` und `.lc-ziffern` getrennt geführt
    // sind —, nur ist die Familie kein Bestandteil von `.num` mehr.
    expect(CSS, '`.num` trägt seit R1 KEINE Monospace-Familie mehr')
      .not.toMatch(/\.num\s*\{[^}]*font-family/);
  });

  it('keine App-Datei schreibt den Ziffernsatz noch roh hin', () => {
    const erlaubt = pruefeAusnahmen(ZIFFERN_AUSNAHMEN);
    const funde = alleQuellen()
      .filter((p) => !erlaubt.has(rel(p)))
      .filter((p) => ZIFFERNSATZ_ROH.test(ohneKommentare(liesRoh(p))))
      .map(rel);
    expect(
      funde,
      'Der Ziffernsatz gehört in `.num` (mit Mono) oder `.lc-ziffern` (ohne) — eine rohe '
      + '`fontVariantNumeric`-Zeile ODER eine rohe `tabular-nums`-Utility ist dieselbe '
      + 'Wahrheit ein zweites Mal (§5/F9).',
    ).toEqual([]);
  });

  it('ROT-BEWEIS: der Ausdruck erkennt beide Vorher-Formen', () => {
    // (a) die Langform, die R5-B in `ErgebnisAnzeige` gefunden hat.
    expect(ZIFFERNSATZ_ROH.test(ohneKommentare(
      "<p className={`font-display`} style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}>",
    ))).toBe(true);
    // (b) die UTILITY-Form, die R6-B gefunden hat — an ihr lief der Wächter der
    //     Runde 5 vorbei, weil er nach der SCHREIBWEISE fragte statt nach der Sache.
    expect(ZIFFERNSATZ_ROH.test(ohneKommentare(
      '<span className="w-12 text-center text-micro tabular-nums text-ink-500">{p} %</span>',
    ))).toBe(true);
    // Negativ-Kontrolle 1: ein Kommentar, der die Alt-Form ZITIERT, ist kein Verstoss.
    expect(ZIFFERNSATZ_ROH.test(ohneKommentare('// vorher: fontVariantNumeric roh\nconst x = 1;'))).toBe(false);
    // Negativ-Kontrolle 2: die migrierte Form fällt NICHT auf.
    expect(ZIFFERNSATZ_ROH.test(ohneKommentare(
      '<span className="w-12 text-center text-micro lc-ziffern text-ink-500">{p} %</span>',
    ))).toBe(false);
  });
});

// ─── R5-D · EINE neutrale Hover-Fläche ──────────────────────────────────────

/** Jede Utility, die eine neutrale Fläche beim Überfahren eintönt. */
const HOVER_FLAECHE = /hover:bg-(?:paper-sunken|paper-raised|paper|well|surface)(?:\/\d+)?/g;

describe('R5-D · die anklickbare Zeile tönt sich über EINEN Baustein ein', () => {
  it('index.css führt die Klasse, und sie hängt an der Rolle `--well`', () => {
    expect(CSS, '`.lc-hover-flaeche` existiert').toContain('.lc-hover-flaeche:hover');
    expect(CSS, 'sie nimmt die Rolle, nicht den Rohwert')
      .toContain('.lc-hover-flaeche:hover { background-color: var(--well); }');
  });

  it('keine App-Datei mischt eine eigene Stärke dazu', () => {
    const funde = alleQuellen().flatMap((p) => {
      const t = ohneKommentare(liesRoh(p)).match(HOVER_FLAECHE);
      return t ? t.map((m) => `${rel(p)}: ${m}`) : [];
    });
    expect(
      funde,
      'DESIGN-REGLEMENT §G-j: Interaktions-Zustände laufen über EINE Regel, getragen von einer '
      + 'Rolle. Drei Alpha-Stärken derselben Fläche (voll / 60 % / 70 %) sind drei Regeln — '
      + '`.lc-hover-flaeche` ist die eine.',
    ).toEqual([]);
  });

  it('ROT-BEWEIS: der Ausdruck erkennt alle drei Stärken, die vor R5-D im Repo standen', () => {
    const vorher = [
      'className="rounded px-2 hover:bg-paper-sunken"',
      'className="flex gap-2 hover:bg-paper-sunken/60"',
      'className="w-full hover:bg-paper-sunken/70"',
    ].join('\n');
    expect(vorher.match(HOVER_FLAECHE), 'alle drei müssen auffallen').toEqual([
      'hover:bg-paper-sunken', 'hover:bg-paper-sunken/60', 'hover:bg-paper-sunken/70',
    ]);
    // Negativ-Kontrolle: die migrierte Form fällt nicht auf.
    expect('className="rounded px-2 lc-hover-flaeche"'.match(HOVER_FLAECHE)).toBeNull();
  });
});

// ─── R5-E · der Reiter trägt keinen Kasten (B-R1, R9-1, 6.9.2026) ────────────

/**
 * BEFUND (r9-befunde-b.md B-R1): `ui/Tabs.tsx` zeigte den aktiven Reiter als
 * Box-Chip — `bg-surface-raised text-brass-700 shadow-sm border border-line` —,
 * die Arbeitsleiste desselben Hauses denselben Zustand als Unterstrich. Seit
 * B-R1 steht die Anatomie EINMAL als `.lc-tab` in `index.css`.
 *
 * DIE SONDE HÄNGT AN DER SACHE, nicht an einer Zeilennummer: sie sucht jede
 * App-Datei, die einen `role="tab"`-Knopf baut, und verlangt, dass er den
 * Baustein trägt. Wer eine vierte Reiter-Optik von Hand baut, fällt auf.
 *
 * KASTEN-UTILITIES sind die vier Formen, die den Befund ausmachten: Schatten,
 * Rahmen, Radius und Fläche. `border-b`/`border-transparent` sind ausgenommen —
 * der Unterstrich IST die Zielform, nicht ihr Gegenteil.
 */
const REITER_MARKE = /role=(?:"tab"|\{[^}]*['"]tab['"][^}]*\})/;
const KASTEN_UTILITY = /\b(?:shadow-(?:sm|md|lg|xl)|rounded-[a-z]+(?:-[a-z0-9]+)*|border(?:-(?!b\b|transparent\b)[a-z]+(?:-[a-z0-9]+)*)?|bg-(?:surface|paper|brass)[a-z0-9-]*)\b/g;

/**
 * Reiter-Knöpfe, die ihre eigene Optik noch von Hand tragen. JEDER Eintrag
 * nennt den Grund und die Hand, die ihn abräumt — eine Allowlist ohne
 * Räumungsdatum ist ein stiller Freibrief (§8).
 */
const REITER_AUSNAHMEN = [
  {
    datei: 'components/vorlagen/Dokumentmappe.tsx',
    begruendung: 'APG-Tabs: roving tabindex + Pfeiltasten/Home/End (vgl. ui/Tabs.tsx)',
  },
  {
    datei: 'pages/gesetz-leser/v3/LeserPanel.tsx',
    begruendung: 'role=menu) ist `role="tablist"` hier die richtige Rolle',
  },
] as const;

describe('R5-E · der Reiter trägt den Unterstrich, nicht den Kasten', () => {
  it('index.css führt `.lc-tab`, und die Klasse trägt weder Rahmen noch Fläche noch Schatten', () => {
    expect(CSS, '`.lc-tab` existiert').toContain('.lc-tab {');
    expect(CSS, 'aktiv = Strich in der Tinte, nicht Fläche in Messing')
      .toMatch(/\.lc-tab\[aria-selected="true"\][\s\S]{0,120}border-bottom-color: var\(--ink-900\)/);
    const block = CSS.slice(CSS.indexOf('.lc-tab {'), CSS.indexOf('.lc-tab:hover'));
    expect(block, 'kein Schatten').toContain('box-shadow: none');
    expect(block, 'kein Radius').toContain('border-radius: 0');
    expect(block, 'kein Rahmen ausser dem Strich unten').toContain('border: 0');
  });

  it('kein Reiter-Knopf der App baut sich seine Optik selbst', () => {
    const erlaubt = pruefeAusnahmen(REITER_AUSNAHMEN);
    const funde: string[] = [];
    for (const p of alleTsx()) {
      if (erlaubt.has(rel(p))) continue;
      const quelle = ohneKommentare(liesRoh(p));
      if (!REITER_MARKE.test(quelle)) continue;
      const kasten = quelle.match(KASTEN_UTILITY);
      if (kasten) funde.push(`${rel(p)}: ${[...new Set(kasten)].join(' ')}`);
    }
    expect(
      funde,
      'B-R1/F0.9: die Reiter-Anatomie steht EINMAL als `.lc-tab` in index.css — '
      + 'Kasten-Utilities (Schatten, Rahmen, Radius, Fläche) an einem `role="tab"`-Knopf '
      + 'sind die zweite Anatomie, die der Befund abgeschafft hat.',
    ).toEqual([]);
  });

  it('ROT-BEWEIS: der Ausdruck erkennt die Form, die vor B-R1 in `ui/Tabs.tsx` stand', () => {
    const vorher = "const AKTIV = 'bg-surface-raised text-brass-700 shadow-sm border border-line';";
    expect(vorher.match(KASTEN_UTILITY), 'alle vier Kasten-Formen müssen auffallen')
      .toEqual(['bg-surface-raised', 'shadow-sm', 'border', 'border-line']);
    // Negativ-Kontrolle: die migrierte Form fällt nicht auf.
    expect('className={`lc-tab shrink-0 whitespace-nowrap ${KNOPF[groesse]}`}'.match(KASTEN_UTILITY))
      .toBeNull();
  });
});

// ─── R5-F · Breiten-Varianten in der Einheit der Breakpoints ────────────────
// Tailwind erzeugt `min-[…]:`/`max-[…]:` nur in der Einheit der `screens`
// (hier die px-Vorgabe) und verwirft andere STUMM: `min-[30rem]:grid-cols-2`
// stand in S5-A (W2·29, 23.9.2026) im Code und fehlte im CSS — die
// Nachbarn-Vorschau des Einzel-Artikels war einspaltig.
const REM_BREITE = /\b(?:min|max)-\[[\d.]+(?:rem|em)\]:/;

describe('R5-F · Breiten-Varianten stehen in px', () => {
  it('keine App-Datei schreibt eine `min-[…rem]:`/`max-[…em]:`-Variante', () => {
    const funde = alleQuellen()
      .filter((p) => REM_BREITE.test(ohneKommentare(liesRoh(p))))
      .map(rel);
    expect(funde, 'Tailwind verwirft rem/em-Breitenvarianten ohne Meldung — px schreiben').toEqual([]);
  });

  it('ROT-BEWEIS: der Ausdruck erkennt die Form aus S5-A, nicht die px-Form', () => {
    expect(REM_BREITE.test('className="grid gap-3 min-[30rem]:grid-cols-2"')).toBe(true);
    expect(REM_BREITE.test('className="grid gap-3 min-[480px]:grid-cols-2"')).toBe(false);
    expect(REM_BREITE.test('className="min-h-[var(--tap)] min-w-[9rem]"')).toBe(false);
  });
});
