/**
 * W2·19-DESIGN-KONSISTENZ — Runde 2, Paket D «Mobil & Zustände» (31.8.2026).
 *
 * Bewacht die sechs Kanons dieses Pakets:
 *   F2-1  EIN Scrim: `--scrim*` + `.lc-scrim*`; keine Ad-hoc-Abdunklung mehr,
 *         und keine, die mit dem Thema flippt (`bg-ink-900/…` hellt im
 *         Dunkelmodus AUF). Der scharfe Wächter dazu ist Prüfung 5 in
 *         `scripts/check-design-tokens.ts` — hier steht die Konsumenten-Sonde.
 *   F2-2  EIN Bottom-Sheet-Rahmen (`ui/SheetRahmen`) für Gliederung/Treffer und
 *         Mobil-Filter; die Anschlagshöhe ist ein Token, kein calc-Literal.
 *   F2-3  Klebende Kopfleisten sind VOLLDECKEND (kein Glas/Blur) — die Regel
 *         steht seit LM-001/K-01 bei `.lc-glass` in `src/index.css`.
 *   F2-4  EINE Abruf-Fehler-Zeile (`ui/AbrufFehler`): warn-Ton + `ui/QuellLink`.
 *   F2-5  EINE schwebende Meldung (`ui/SchwebeMeldung`): Offset aus `--nt-stick`,
 *         Pillen-Optik — kein geratenes `top-20` mehr über den Kopf-Griffen.
 *   F2-6  Komfort-Trefferfläche als Token (`--tap-ziel-komfort`, 44 px) statt
 *         `min-h-8` (32 px) an den Kopf-Griffen des Lesers.
 *
 * QUELLTEXT-Sonde, kein Render-Test (Idiom aus `design-r2c-bausteine.test.ts`):
 * bewacht wird «diese Form kommt in der App genau einmal vor» — am Quelltext
 * messbar, am DOM einer einzelnen Seite nicht.
 *
 * ROT-BEWEIS (§6.7): jeder Ausdruck trägt eine NEGATIV-KONTROLLE mit dem
 * Wortlaut, wie er VOR dem Bau im Repo stand. Läuft die Kontrolle grün, prüft
 * der Ausdruck nichts und der Fall ist wertlos.
 *
 * Reine Darstellung (§3) — keine Rechtslogik berührt.
 */
import { describe, it, expect } from 'vitest';
// R5-A (5.9.2026) · §5: Verzeichnis-Wanderung und Kommentar-Sieb standen hier
// als eigene Kopie von `appDateien.ts`. Ein Wächter, der seinen Sweep selbst
// nachbaut, ist ab der ersten Abweichung ein anderer Wächter als sein
// Nachbar — beide hängen jetzt an der einen Quelle.
import { join } from 'node:path';
import { APP_WURZEL, alleQuellen, ohneKommentare, liesRoh } from './appDateien';

const WURZEL = APP_WURZEL;

const rohLies = (pfad: string) => liesRoh(join(WURZEL, pfad));

/** Quelltext OHNE Kommentare — die Herleitungen dürfen den Vorzustand beim
 *  Namen nennen (§2b), ohne die Sonde für immer rot zu färben. */

const lies = (rel: string) => ohneKommentare(rohLies(rel));


const CSS = rohLies('index.css');

// ─── F2-1 · EIN Scrim ───────────────────────────────────────────────────────

describe('F2-1 · die abdunkelnde Fläche hinter einem Overlay hat EINE Quelle', () => {
  it('index.css führt die drei Rollen als Token und als Klasse', () => {
    for (const token of ['--scrim:', '--scrim-dialog:', '--scrim-voll:']) {
      expect(CSS, `Token ${token} ist gesetzt`).toContain(token);
    }
    for (const klasse of ['.lc-scrim {', '.lc-scrim-dialog {', '.lc-scrim-voll {']) {
      expect(CSS, `Klasse ${klasse} existiert`).toContain(klasse);
    }
  });

  it('alle drei Deckungen sind SCHWARZ, nicht --ink-900 (Dunkelmodus-Falle)', () => {
    // `--ink-900` ist hell `#201E16`, dunkel `#E9E7E2`: als Scrim hellte es im
    // Dunkelmodus AUF, statt abzudunkeln (B7-N1, `v3/LeserScrim.tsx`).
    const zeilen = CSS.split('\n').filter((z) => /^\s*--scrim(-\w+)?:/.test(z));
    expect(zeilen.length, 'drei Scrim-Token').toBe(3);
    for (const z of zeilen) {
      expect(z, `Scrim-Token schwarz statt themenabhängig: ${z.trim()}`).toMatch(/rgb\(0 0 0 \//);
      expect(z, `kein Tinten-Token im Scrim: ${z.trim()}`).not.toContain('--ink-');
    }
  });

  /** Ad-hoc-Scrim: dieselbe Klassen-Kette trägt `inset-0` UND eine
   *  Deckkraft-Fläche in black/ink — der Ausdruck des Wächters (Prüfung 5 in
   *  `scripts/check-design-tokens.ts`), hier gegen den Baumbestand geführt. */
  const ADHOC_SCRIM = (z: string) => /\bbg-(?:black|ink-\d{3})\/[0-9.]+\b/.test(z) && /\binset-0\b/.test(z);

  it('kein Ad-hoc-Scrim mehr im Baum', () => {
    const funde: string[] = [];
    for (const datei of alleQuellen()) {
      ohneKommentare(liesRoh(datei)).split('\n').forEach((z, i) => {
        if (ADHOC_SCRIM(z)) funde.push(`${datei.slice(WURZEL.length + 1)}:${i + 1}`);
      });
    }
    expect(funde, 'Scrims laufen über .lc-scrim/.lc-scrim-dialog/.lc-scrim-voll').toEqual([]);
  });

  it('NEGATIV-KONTROLLE: der Ausdruck trifft die sieben Vorzustände', () => {
    // Wortlaut, wie er am 31.8.2026 vor dem Bau im Repo stand.
    for (const vorher of [
      'className="fixed inset-0 z-[16] bg-black/30"',                                     // v3/LeserScrim:57
      "'pointer-events-auto absolute inset-0 z-40 bg-black/30'",                           // v3/LeserPanelZone:306
      "'fixed inset-0 z-40 bg-black/30'",                                                  // v3/LeserPanelZone:306
      'className="fixed inset-0 z-40 bg-ink-900/30"',                                      // rechtsprechung/FilterSheet:107
      "'fixed inset-0 z-40 bg-ink-900/30'",                                                // parts/GliederungSheet:121
      "'fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4'",           // vorlagen/NormChip:439
      'className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-4"', // parts/LeserTastatur:209
      'className="fixed inset-0 z-30 bg-black/50"',                                        // layout/Shell:485
    ]) {
      expect(ADHOC_SCRIM(vorher), `Vorzustand wird erkannt: ${vorher}`).toBe(true);
    }
  });

  // D41 (7.9.2026): SECHS statt sieben — `v3/LeserScrim.tsx` ist ersatzlos
  // entfallen (das «Ansicht ▾»-Menü trägt keine Abdunklung mehr, Herleitung
  // dort, wo die Montage stand: `v3/LeserAnsichtV3.tsx`). Die Negativ-Kontrolle
  // oben behält ihren Vorzustand-Wortlaut von damals unverändert (§2b): sie
  // prüft den AUSDRUCK, nicht den heutigen Dateibestand.
  it('die sechs Fundstellen konsumieren die Klasse ihrer ROLLE', () => {
    const rolle: Array<[string, string]> = [
      ['pages/gesetz-leser/v3/LeserPanelZone.tsx', 'lc-scrim'],
      ['pages/gesetz-leser/parts/GliederungSheet.tsx', 'lc-scrim'],
      ['components/rechtsprechung/FilterSheet.tsx', 'lc-scrim'],
      ['pages/gesetz-leser/parts/LeserTastatur.tsx', 'lc-scrim-dialog'],
      ['components/vorlagen/NormChip.tsx', 'lc-scrim-dialog'],
      ['components/layout/Shell.tsx', 'lc-scrim-voll'],
    ];
    for (const [datei, klasse] of rolle) {
      expect(lies(datei), `${datei} trägt ${klasse}`).toContain(klasse);
    }
  });
});

// ─── F2-2 · EIN Bottom-Sheet-Rahmen ─────────────────────────────────────────

describe('F2-2 · Gliederungs- und Filter-Blatt teilen EINEN Rahmen', () => {
  const gliederung = lies('pages/gesetz-leser/parts/GliederungSheet.tsx');
  const filter = lies('components/rechtsprechung/FilterSheet.tsx');

  it('beide rendern `ui/SheetRahmen`', () => {
    for (const [name, q] of [['GliederungSheet', gliederung], ['FilterSheet', filter]] as const) {
      expect(q, `${name}: konsumiert den Baustein`).toContain('<SheetRahmen');
    }
  });

  it('keines der beiden zeichnet Griffleiste, Titelzeile oder ✕ noch selbst', () => {
    // Die drei Formen, die vor dem Bau in BEIDEN Dateien zeichengleich standen.
    const griffleiste = /mx-auto mt-2 h-1 w-10 rounded-full bg-line/;
    const schliessKnopf = /-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-md/;
    const scroller = /min-h-0 flex-1 overflow-(?:x-hidden overflow-)?y-auto overscroll-contain/;
    for (const [name, q] of [['GliederungSheet', gliederung], ['FilterSheet', filter]] as const) {
      expect(griffleiste.test(q), `${name}: keine eigene Griffleiste`).toBe(false);
      expect(schliessKnopf.test(q), `${name}: kein eigener ✕-Knopf`).toBe(false);
      expect(scroller.test(q), `${name}: kein eigener Scroller`).toBe(false);
    }
    // NEGATIV-KONTROLLE: die drei Ausdrücke treffen den Vorzustand.
    expect(griffleiste.test('<div aria-hidden className="mx-auto mt-2 h-1 w-10 rounded-full bg-line" />')).toBe(true);
    expect(schliessKnopf.test('className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-md text-ink-500 hover:text-brass-700"')).toBe(true);
    expect(scroller.test('className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-3 py-2"')).toBe(true);
  });

  it('die Anschlagshöhe ist ein Token, kein calc-Literal', () => {
    expect(CSS, '--sheet-anschlag ist gesetzt').toContain('--sheet-anschlag:');
    const rahmen = lies('components/ui/SheetRahmen.tsx');
    expect(rahmen, 'Vorgabe kommt aus dem Token').toContain('var(--sheet-anschlag)');
    // Der Leser misst seine Kopfhöhe und reicht sie durch (§5: eine Messung
    // schlägt eine Annahme, nicht ein zweiter Wert eine erste).
    expect(gliederung, 'Leser reicht die gemessene Kopfhöhe durch').toContain('var(--leser-kopf-h)');
    // NEGATIV-KONTROLLE: genau dieses Literal stand im FilterSheet.
    const LITERAL = /calc\(4rem \+ 2\.25rem\)/;
    expect(LITERAL.test("style={{ top: 'calc(4rem + 2.25rem)' }}"), 'Ausdruck trifft den Vorzustand').toBe(true);
    expect(LITERAL.test(filter), 'FilterSheet trägt das Literal nicht mehr').toBe(false);
  });
});

// ─── F2-3 · klebende Kopfleisten sind volldeckend ───────────────────────────

describe('F2-3 · kein Glas/Blur auf einer klebenden Kopfleiste', () => {
  it('das Lesemodus-Overlay trägt die volldeckende Fläche', () => {
    const q = lies('components/rechtsprechung/LesemodusOverlay.tsx');
    expect(q, 'Kopfleiste volldeckend').toContain('border-b border-line bg-paper px-5 py-2.5');
    const GLAS = /bg-paper\/\d+|backdrop-blur/;
    expect(GLAS.test(q), 'kein Transluzenz-/Blur-Rest').toBe(false);
    // NEGATIV-KONTROLLE: der Ausdruck trifft den Vorzustand.
    expect(GLAS.test('className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-paper/95 px-5 py-2.5 backdrop-blur-sm"')).toBe(true);
  });

  it('die Regel steht bei `.lc-glass` — sie ist zitiert, nicht erfunden', () => {
    expect(CSS, 'Herleitung der Rolle').toContain('Volldeckend statt 96 % + Blur');
  });
});

// ─── F2-4 · EINE Abruf-Fehler-Zeile ─────────────────────────────────────────

describe('F2-4 · «… konnte nicht geladen werden» läuft über EINEN Baustein', () => {
  const baustein = lies('components/ui/AbrufFehler.tsx');

  it('der Baustein trägt Ton und Quell-Link des Kanons', () => {
    expect(baustein, 'warn-Ton').toContain('text-warn-700');
    expect(baustein, 'Kanon-Link statt handgeschriebenem <a>').toContain('<QuellLink');
  });

  it('die fünf Fundstellen konsumieren ihn', () => {
    for (const datei of [
      'pages/gesetz-leser/v3/PanelMaterialien.tsx',
      'components/kontext/KontextPanel.tsx',
      // DEKLARIERTE FACHLICHE ERWEITERUNG (§6.3, 12.9.2026): vierte Fundstelle —
      // «Die Übersetzung der Titel konnte nicht geladen werden» (Auflage der
      // Gegenprüfung zu PR #802). Sie steht in einer eigenen Datei, damit
      // KontextPanel unter der §6.6-Schwelle bleibt; der Kanon gilt auch für sie,
      // und ohne diese Zeile wäre der neue Konsument unbewacht.
      'components/kontext/TitelRueckfallZeile.tsx',
      // WÄCHTER-DATEILISTE UM LEAF-MODUL ERGÄNZT (§6.6-Split, 12.9.2026, PR #830):
      // fünfte Fundstelle — der Revisionen-AbrufFehler («Änderungsverlauf konnte
      // nicht geladen werden») wanderte aus KontextPanel.tsx in dieses eigene
      // Leaf-Modul (Zeilen-Schwelle §6.6). Rein additiv: dieselbe Verwendung,
      // anderer Ort — ohne diese Zeile wäre der Konsument unbewacht.
      'components/kontext/RevisionenGruppe.tsx',
    ]) {
      expect(lies(datei), `${datei} konsumiert AbrufFehler`).toContain('<AbrufFehler');
    }
    // §6.6-Split (12.9.2026, PR #830): die drei Abruf-Fehler (Botschaften,
    // Revisionen, Vernehmlassungen) verteilen sich seither über zwei Dateien —
    // Revisionen zog nach `RevisionenGruppe.tsx` um. Die Gesamtzahl bleibt 3
    // (rein additiv gezählt, keine Datei trägt den Revisionen-Fund doppelt).
    // DEKLARIERTE FACHLICHE ERWEITERUNG (§6.3, 30.9.2026, W2·27-BUND-FERTIG): seither
    // VIER — die Zeile «Amtliche Materialien konnten nicht geladen werden» (Shard-/
    // Manifest-Ausfall der Erläuterungen im KontextPanel). Der Kanon gilt auch für
    // sie; die Zählung ist der Wächter, dass kein fünfter Fund unbemerkt dazukommt.
    expect(
      (lies('components/kontext/KontextPanel.tsx').match(/<AbrufFehler/g) ?? []).length
      + (lies('components/kontext/RevisionenGruppe.tsx').match(/<AbrufFehler/g) ?? []).length,
      'KontextPanel + RevisionenGruppe haben zusammen vier Abruf-Fehler (Botschaften, Revisionen, Vernehmlassungen, Amtliche Materialien)',
    ).toBe(4);
  });

  it('keine handgeschriebene Fehlerzeile mehr im Baum', () => {
    const HANDGEBAUT = /konnten? nicht geladen werden\. Amtliche Quelle/;
    const funde: string[] = [];
    for (const datei of alleQuellen()) {
      if (datei.endsWith('AbrufFehler.tsx')) continue;   // dort steht der Kanon
      if (HANDGEBAUT.test(ohneKommentare(liesRoh(datei)))) {
        funde.push(datei.slice(WURZEL.length + 1));
      }
    }
    expect(funde, 'der Satz steht genau einmal — im Baustein').toEqual([]);
    // NEGATIV-KONTROLLE: der Ausdruck trifft beide Vorzustände.
    expect(HANDGEBAUT.test('Materialien konnten nicht geladen werden. Amtliche Quelle:')).toBe(true);
    expect(HANDGEBAUT.test('Änderungsverlauf konnte nicht geladen werden. Amtliche Quelle:')).toBe(true);
  });
});

// ─── F2-5 · EINE schwebende Meldung ─────────────────────────────────────────

describe('F2-5 · die drei schwebenden Meldungen teilen EINE Geometrie', () => {
  const baustein = lies('components/ui/SchwebeMeldung.tsx');

  it('der Baustein rechnet den oberen Offset aus `--nt-stick`', () => {
    expect(baustein, 'EINE Quelle der realen Sticky-Höhe').toContain('var(--nt-stick, 6.25rem)');
    expect(baustein, 'Pillen-Optik').toContain('rounded-full bg-paper-raised shadow-lg');
    expect(baustein, 'der Streifen sperrt den Text darunter nicht').toContain('pointer-events-none');
  });

  it('die drei Fundstellen konsumieren ihn', () => {
    for (const datei of [
      'pages/gesetz-leser/parts/WeiterlesenChip.tsx',
      'components/layout/RuecksprungChip.tsx',
      'pages/gesetz-leser/v3/LeserRahmenV3.tsx',
    ]) {
      expect(lies(datei), `${datei} konsumiert SchwebeMeldung`).toContain('<SchwebeMeldung');
    }
  });

  it('kein geratener Toast-Offset mehr (@390 lag er über den Kopf-Griffen)', () => {
    const GERATEN = /fixed right-3 top-20/;
    expect(GERATEN.test(lies('pages/gesetz-leser/v3/LeserRahmenV3.tsx')), 'Toast rechnet aus --nt-stick').toBe(false);
    // NEGATIV-KONTROLLE: der Ausdruck trifft den Vorzustand.
    expect(GERATEN.test('className="fixed right-3 top-20 z-50 flex items-center gap-2 rounded-lg border border-line bg-paper-raised px-3 py-2 text-body-s text-ink-700 shadow-lg"')).toBe(true);
  });
});

// ─── F2-6 · Komfort-Trefferfläche als Token ─────────────────────────────────

describe('F2-6 · die Kopf-Griffe tragen auf dem Handy 44 px aus EINEM Token', () => {
  it('das Token ist gesetzt und erfüllt WCAG 2.5.5 (AAA, ≥44px)', () => {
    const t = /--tap-ziel-komfort:\s*(\d+)px/.exec(CSS);
    expect(t, '--tap-ziel-komfort ist in src/index.css gesetzt').not.toBeNull();
    expect(Number(t?.[1]), 'WCAG 2.2 SC 2.5.5 «Target Size (Enhanced)»').toBeGreaterThanOrEqual(44);
  });

  it('die Klasse zieht den Token, nicht die Zahl', () => {
    expect(CSS, 'Klasse existiert').toContain('.lc-leiste-griff-komfort {');
    const block = /\.lc-leiste-griff-komfort \{([^}]*)\}/.exec(CSS)?.[1] ?? '';
    expect(block, 'min-height aus dem Token').toContain('min-height: var(--tap-ziel-komfort)');
    expect(block, 'min-width aus dem Token').toContain('min-width: var(--tap-ziel-komfort)');
  });

  it('kopfGriffKlassen konsumiert die Klasse statt einer rohen Zahl', () => {
    const q = lies('pages/gesetz-leser/v3/kopfStufen.ts');
    expect(q, 'Komfort-Klasse am mini-Zweig').toContain('lc-leiste-griff-komfort');
    const ROH = /min-h-\d+ min-w-\d+/;
    expect(ROH.test(q), 'keine rohe Untergrenze mehr').toBe(false);
    // NEGATIV-KONTROLLE: der Ausdruck trifft den Vorzustand.
    expect(ROH.test('return mini ? `${KOPF_GRIFF} min-h-8 min-w-8` : KOPF_GRIFF;')).toBe(true);
  });
});
