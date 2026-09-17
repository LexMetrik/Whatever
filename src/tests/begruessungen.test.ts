import { describe, it, expect } from 'vitest';
import {
  GRUSS_MAX_ZEICHEN, IMMER, TAGESZEITEN,
  begruessungsPool, tageszeitFuer, waehleBegruessung, waehleBegruessungFuerBuild,
} from '../lib/begruessungen';

// ─── Begrüssungs-Pools (W2·23-STARTSEITE-V4 §4) ─────────────────────────────
//
// Wächter für die vier Zusagen, die der Fahrplan an die Pools stellt: jeder Pool
// gefüllt, keine Doppelung, Tageszeit-Abdeckung 0–23 lückenlos, und (als
// Layout-Zusage) jeder Gruss kurz genug für eine Zeile auf 390 px.
//
// AUSBAU 8.9.2026 (Sidequest David, DEKLARIERTE fachliche Änderung — kein
// Refactoring, §6.3): acht Tageszeit-Fenster statt fünf, je 30–45 Grüsse,
// «immer» 30–40. Angepasst sind darum genau zwei Zusagen — die Pool-Grössen
// und die Fenster-Grenzen. Doppelungs-, Satzzeichen-, Längen- und
// Lückenlosigkeits-Wächter bleiben Wort für Wort, wie sie waren; neu dazu
// kommt ein Wächter auf die gestrichenen Formen (§4-Auflage), der bisher nur
// als Prosa im Kopfkommentar der Pool-Datei stand.
//
// NUR ANKOMMEN 8.9.2026 (dritter Schritt, DEKLARIERTE fachliche Änderung —
// Entscheid David: «keine abschied. nur begrüssung»): ein Wächter mehr, der
// Abschiedsformen mechanisch ausschliesst, und die Landessprachen-Liste trägt
// nur noch reine BEGRÜSSUNGSformen (die romanischen Wunsch-Formen «Bonne
// journée./soirée./nuit.», «Buona giornata./serata.», «Buonanotte.» sind im
// Französischen und Italienischen Abschiedsformeln). Pool-Grössen, Doppelungs-,
// Satzzeichen-, Längen-, Kaffee- und Lückenlosigkeits-Wächter bleiben Wort für
// Wort, wie sie waren.
//
// SCHWEIZER BEZUG 8.9.2026 (zweiter Schritt, ebenfalls DEKLARIERTE fachliche
// Änderung): zwei Wächter kommen dazu — einer deckelt die Kaffee-Häufung auf
// höchstens zwei Einträge im ganzen Bestand («was soll das mit dem kaffee? sei
// kreativ und nicht so plump»), der andere verlangt in JEDEM Fenster je einen
// französischen und einen italienischen Gruss aus einer hier gepflegten Liste
// gängiger Formen. Alle übrigen Zusagen bleiben Wort für Wort, wie sie waren.

const ALLE = [...IMMER, ...TAGESZEITEN.flatMap((t) => t.pool)];

describe('Begrüssungs-Pools', () => {
  it('kein Pool ist leer', () => {
    expect(IMMER.length).toBeGreaterThan(0);
    for (const t of TAGESZEITEN) {
      expect(t.pool.length, `Pool ${t.id} leer`).toBeGreaterThan(0);
    }
  });

  it('jede Tageszeit trägt genügend Abwechslung (Ausbau 8.9.2026: 30–45 je Fenster)', () => {
    for (const t of TAGESZEITEN) {
      expect(t.pool.length, `Pool ${t.id}`).toBeGreaterThanOrEqual(30);
      expect(t.pool.length, `Pool ${t.id}`).toBeLessThanOrEqual(45);
    }
  });

  // SPRACHREGIONEN 16.9.2026 (DEKLARIERTE fachliche Änderung, Auftrag David
  // «mach noch mehr grüsse aus allen sprachregionen der schweiz»): Obergrenze
  // 40 → 70, weil der «immer»-Pool 27 tageszeit-neutrale Grüsse aus Mundart,
  // Romandie, Tessin und Rätoromanisch dazubekommt (Stand 65). Rot gesehen:
  // «expected 65 to be less than or equal to 40». Untergrenze unverändert.
  it('der «immer»-Pool trägt 30–70 Grüsse', () => {
    expect(IMMER.length).toBeGreaterThanOrEqual(30);
    expect(IMMER.length).toBeLessThanOrEqual(70);
  });

  it('kein Gruss steht zweimal — auch nicht über Pool-Grenzen hinweg', () => {
    const doppelt = ALLE.filter((g, i) => ALLE.indexOf(g) !== i);
    expect(doppelt).toEqual([]);
  });

  it('jeder Gruss endet mit einem Satzzeichen (ganzer Satz oder Gruss mit Punkt)', () => {
    expect(ALLE.filter((g) => !/[.?!]$/.test(g))).toEqual([]);
  });

  it('kein Gruss ist länger als GRUSS_MAX_ZEICHEN (Einzeiligkeit @390 px)', () => {
    expect(ALLE.filter((g) => g.length > GRUSS_MAX_ZEICHEN)).toEqual([]);
  });

  it('die Tageszeit-Zuordnung deckt 0–23 lückenlos ab', () => {
    for (let h = 0; h < 24; h++) {
      const t = tageszeitFuer(h);
      expect(t, `Stunde ${h} ohne Tageszeit`).toBeTruthy();
      expect(begruessungsPool(h).length).toBeGreaterThan(IMMER.length);
    }
    // Fenster-Grenzen explizit (die Nacht überspannt Mitternacht). Acht
    // Fenster seit dem Ausbau 8.9.2026 — je erste UND letzte Stunde geprüft,
    // damit eine verschobene Grenze nicht zwischen zwei Stichproben durchfällt.
    expect(tageszeitFuer(0).id).toBe('nacht');
    expect(tageszeitFuer(4).id).toBe('nacht');
    expect(tageszeitFuer(5).id).toBe('fruehmorgen');
    expect(tageszeitFuer(6).id).toBe('fruehmorgen');
    expect(tageszeitFuer(7).id).toBe('morgen');
    expect(tageszeitFuer(9).id).toBe('morgen');
    expect(tageszeitFuer(10).id).toBe('vormittag');
    expect(tageszeitFuer(11).id).toBe('vormittag');
    expect(tageszeitFuer(12).id).toBe('mittag');
    expect(tageszeitFuer(13).id).toBe('mittag');
    expect(tageszeitFuer(14).id).toBe('nachmittag');
    expect(tageszeitFuer(16).id).toBe('nachmittag');
    expect(tageszeitFuer(17).id).toBe('feierabend');
    expect(tageszeitFuer(18).id).toBe('feierabend');
    expect(tageszeitFuer(19).id).toBe('abend');
    expect(tageszeitFuer(21).id).toBe('abend');
    expect(tageszeitFuer(22).id).toBe('nacht');
    expect(tageszeitFuer(23).id).toBe('nacht');
  });

  it('der «immer»-Pool kommt zu JEDER Tageszeit dazu', () => {
    for (const t of TAGESZEITEN) {
      const pool = begruessungsPool(t.ab);
      for (const g of IMMER) expect(pool, `${t.id} ohne «${g}»`).toContain(g);
    }
  });

  it('waehleBegruessung ist bei fester Zufallsquelle deterministisch und bleibt im Pool', () => {
    const pool = begruessungsPool(8);
    expect(waehleBegruessung(8, () => 0)).toBe(pool[0]);
    // Randfall: 1 darf nicht über das Pool-Ende laufen.
    expect(waehleBegruessung(8, () => 0.999999)).toBe(pool[pool.length - 1]);
    expect(waehleBegruessung(8, () => 1)).toBe(pool[pool.length - 1]);
    for (const p of [0, 0.25, 0.5, 0.75, 0.99]) {
      expect(pool).toContain(waehleBegruessung(8, () => p));
    }
  });

  it('Kaffee bleibt die Ausnahme: höchstens zwei Grüsse im ganzen Bestand', () => {
    // Entscheid David 8.9.2026: «was soll das mit dem kaffee? sei kreativ und
    // nicht so plump». Der Wächter deckelt die HÄUFUNG, er verbietet das Motiv
    // nicht — zwei Käfeli dürfen bleiben, ein drittes ist rot.
    const KAFFEE = /kaffee|käfeli|espresso/i;
    const treffer = ALLE.filter((g) => KAFFEE.test(g));
    expect(treffer.length, `zu viele Kaffee-Grüsse: ${treffer.join(' · ')}`).toBeLessThanOrEqual(2);
    // Der Wächter kann scheitern (§6.7) — die Muster zeigen es.
    expect(KAFFEE.test('Ein Käfeli gefällig?')).toBe(true);
    expect(KAFFEE.test('Erst Kaffee, dann Akten.')).toBe(true);
    expect(KAFFEE.test('Zeit für ein Zvieri.')).toBe(false);
  });

  it('jedes Fenster trägt je einen französischen und einen italienischen Gruss', () => {
    // Auftrag David 8.9.2026 «gerne schweizer bezug»: die Landessprachen sind
    // keine Dekoration eines einzelnen Fensters, sondern in allen acht da.
    // Gepflegte Liste statt Regex — nur Formen, die als gängig belegt sind.
    // NUR ANKOMMEN 8.9.2026: die Liste führt ausschliesslich Begrüssungen —
    // die Wunsch-Formen («Bonne journée.», «Buona serata.» …) sind in beiden
    // Sprachen Abschiedsformeln und stehen darum weder hier noch im Pool.
    const FRANZOESISCH = [
      'Bonjour.', 'Bonjour à tous.', 'Bonjour à vous.', 'Bonjour et bienvenue.',
      'Bonsoir.', 'Bonsoir à tous.', 'Bonsoir à vous.', 'Bonsoir, bienvenue.',
      'Bienvenue.', 'Bienvenue à vous.',
    ];
    const ITALIENISCH = [
      'Buongiorno.', 'Buongiorno a voi.', 'Buongiorno a tutti.', 'Salve.',
      'Salve a tutti.', 'Buonasera.', 'Buonasera a tutti.', 'Buonasera a voi.',
      'Buonasera, benvenuti.', 'Benvenuti.',
    ];
    for (const t of TAGESZEITEN) {
      expect(
        t.pool.filter((g) => FRANZOESISCH.includes(g)).length,
        `Pool ${t.id} ohne französischen Gruss`,
      ).toBeGreaterThan(0);
      expect(
        t.pool.filter((g) => ITALIENISCH.includes(g)).length,
        `Pool ${t.id} ohne italienischen Gruss`,
      ).toBeGreaterThan(0);
    }
    // Der Wächter kann scheitern (§6.7): Hochdeutsch zählt nicht mit — und
    // seit dem 8.9.2026 auch keine Abschiedsformel mehr.
    expect(FRANZOESISCH.includes('Guten Morgen.')).toBe(false);
    expect(ITALIENISCH.includes('Guten Abend.')).toBe(false);
    expect(FRANZOESISCH.includes('Bonne nuit.')).toBe(false);
    expect(ITALIENISCH.includes('Buona serata.')).toBe(false);
  });

  it('kein Gruss ist eine Abschiedsform — nur Ankommen (David 8.9.2026)', () => {
    // «keine abschied. nur begrüssung»: behalten wird, was man sagt, wenn
    // jemand ANKOMMT (Gruss, Willkommen, Wunsch für die laufende Tageszeit,
    // freundliche Ansprache); gestrichen ist alles, was man beim Gehen oder
    // zum Schlafengehen sagt. Der Wächter greift die mechanisch fassbaren
    // Formen ab — die Beurteilung im Zweifel bleibt beim Kopfkommentar der
    // Pool-Datei, die Regressionssperre steht hier.
    const ABSCHIED =
      /\bAdie\b|\bAdieu\b|\bTschüss\b|\bUf Widerluege\b|Gute Nacht|Gueti Nacht|schöni Nacht|Schlaf|Bonne nuit|Buonanotte|Buona notte|Buon riposo|Buna notg|Bonne soirée|Buona serata|Bonne journée|Buona giornata|fin de journée|noch\.$|ausklingen|Ausklang|Heimweg|Zeit fürs Bett|Ruhe\./i;
    const treffer = ALLE.filter((g) => ABSCHIED.test(g));
    expect(treffer, `Abschiedsformen im Pool: ${treffer.join(' · ')}`).toEqual([]);
    // Der Wächter kann scheitern (§6.7) — die gestrichenen Originale zeigen es.
    expect(ABSCHIED.test('Adie mitenand.')).toBe(true);
    expect(ABSCHIED.test('Gueti Nacht mitenand.')).toBe(true);
    expect(ABSCHIED.test('Schlaf guet.')).toBe(true);
    expect(ABSCHIED.test('Bonne nuit.')).toBe(true);
    expect(ABSCHIED.test('Buona giornata.')).toBe(true);
    expect(ABSCHIED.test('Schönen Tag noch.')).toBe(true);
    expect(ABSCHIED.test('Lassen Sie den Tag ausklingen.')).toBe(true);
    expect(ABSCHIED.test('Gönnen Sie sich Ruhe.')).toBe(true);
    // … und er darf die Begrüssungen NICHT fangen.
    expect(ABSCHIED.test('Grüezi mitenand.')).toBe(false);
    expect(ABSCHIED.test('Guten Abend.')).toBe(false);
    expect(ABSCHIED.test('Schönen Feierabend.')).toBe(false);
    expect(ABSCHIED.test('Willkommen zu später Stunde.')).toBe(false);
    expect(ABSCHIED.test('Bonsoir à vous.')).toBe(false);
  });

  it('kein Gruss trägt eine der gestrichenen Formen (§4-Auflage)', () => {
    // Sprichwort-Fragmente, Anbiederndes und Werbe-Formeln — der Kopfkommentar
    // der Pool-Datei zählt sie auf, hier stehen sie mechanisch. Emoji-Bereich
    // mit dabei: die Zeile ist Literata-Fliesstext, kein Icon-Platz.
    const GESTRICHEN =
      /Hallöchen|Servus|Vogel|Morgenstund|Schaffe|Willkommen im|[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/iu;
    expect(ALLE.filter((g) => GESTRICHEN.test(g))).toEqual([]);
    // Der Wächter kann scheitern (§6.7) — die gestrichenen Originale zeigen es.
    expect(GESTRICHEN.test('Der frühe Vogel fängt den Wurm.')).toBe(true);
    expect(GESTRICHEN.test('Willkommen im Paragraphendickicht.')).toBe(true);
    expect(GESTRICHEN.test('Grüezi mitenand.')).toBe(false);
  });

  it('NEGATIV-KONTROLLE: die Wächter greifen bei den gestrichenen Formen', () => {
    // §4-Auflage: Sprichwort-Fragmente sind raus. Der Längen- bzw.
    // Satzzeichen-Wächter fängt genau solche Einträge.
    expect(/[.?!]$/.test('Der frühe Vogel …')).toBe(false);
    expect('Schön, dass Sie Recht behalten wollen.'.length).toBeGreaterThan(GRUSS_MAX_ZEICHEN);
  });

  // ─── QS-PERF (15.9.2026) · Build-Seed statt Live-Zufall ──────────────────
  //
  // BEFUND: `waehleBegruessung(stunde, Math.random)` wurde bis hierher beim
  // Prerender UND beim Client-Mount je EIGENSTÄNDIG gezogen — zwei
  // unabhängige `Math.random()`-Aufrufe, real fast immer zwei verschiedene
  // Texte. Die grösste Zeile der Startseite (der Gruss-h1) tauschte darum
  // nach dem JS-Download; Lighthouse hat das als LCP bei 9.38 s gemessen
  // (CI-Lauf 40f634b3d). Der Rot-Beweis unten bildet GENAU dieses Szenario
  // nach: gleiche Stunde, aber Prerender und Client ziehen (wie real) je eine
  // EIGENE Zufallszahl — die alte Kopplung liefert dann i. A. verschiedene
  // Texte. `waehleBegruessungFuerBuild` ersetzt das durch eine reine Funktion
  // EINES gemeinsamen Seeds.
  it('ROT-BEWEIS: zwei unabhängige Math.random()-Züge zur selben Stunde weichen typischerweise voneinander ab', () => {
    // Reproduziert den alten Pfad (Prerender-Prozess vs. Client-Prozess,
    // JE EIN eigener Zufallsaufruf) mit zwei FESTEN, verschiedenen Ziehungen —
    // deterministisch rot, keine Flake-Wahrscheinlichkeit (Dispatch-§0 Ziff. 3c).
    const stunde = 10;
    const prerenderZug = waehleBegruessung(stunde, () => 0.02);
    const clientZug = waehleBegruessung(stunde, () => 0.87);
    expect(prerenderZug).not.toBe(clientZug);
  });

  it('waehleBegruessungFuerBuild: Prerender-Auswahl == Client-Auswahl bei gleichem Seed', () => {
    // Der eigentliche Fix: EIN Seed (im Bau `import.meta.env.VITE_BUILD_ID`,
    // von Prerender-Prozess UND Client-Bundle identisch gelesen) ⇒ IMMER
    // derselbe Gruss — unabhängig davon, wie oft oder wo die Funktion
    // aufgerufen wird. Reine Funktion, darum hier ohne Mocking direkt
    // prüfbar: zwei "Aufrufer" (Prerender/Client simuliert durch zwei
    // unabhängige Aufrufe) mit demselben Seed müssen übereinstimmen.
    for (const seed of ['a1b2c3d4', 'deadbeef', 'dev', '00000000', 'ffffffff']) {
      const prerenderAuswahl = waehleBegruessungFuerBuild(seed);
      const clientAuswahl = waehleBegruessungFuerBuild(seed);
      expect(clientAuswahl, `Seed ${seed}`).toBe(prerenderAuswahl);
    }
  });

  // NACHBESSERUNG (15.9.2026, selber Tag): die erste Fassung hashte zusätzlich
  // eine «Stunde» aus dem Seed und zog aus DEREN Tageszeit-Pool — ein
  // Inhaltsfehler (ein um 09:00 gebauter Stand konnte um 09:00 real einen
  // Abend-Gruss zeigen), nicht landbar. ROT-BEWEIS dieser Nachbesserung
  // (real gemessen, nicht nur behauptet): mit dem alten Stunden-Hash liefert
  // der Seed 'a2' unten «Bonsoir à vous.» (Pool `abend`) — kein Mitglied von
  // `IMMER`. Der Wächter fängt genau das.
  it('waehleBegruessungFuerBuild liefert für JEDEN Seed einen tageszeit-neutralen Gruss (nur `IMMER`)', () => {
    const seeds = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'a10',
      'a1b2c3d4', 'deadbeef', 'dev', '00000000', 'ffffffff'];
    for (const seed of seeds) {
      expect(IMMER, `Seed ${seed}`).toContain(waehleBegruessungFuerBuild(seed));
    }
  });

  it('waehleBegruessungFuerBuild bleibt im tageszeit-neutralen Pool und liefert bei verschiedenem Seed nicht immer denselben Gruss', () => {
    // Kein Logikverlust: die Zufalls-Vielfalt innerhalb von `IMMER` bleibt
    // erhalten, nur die Kadenz wechselt von PRO BESUCH auf PRO DEPLOY (im PR
    // als Produkt-Nuance benannt). Mehrere Seeds müssen darum nicht alle
    // denselben Gruss ziehen.
    const seeds = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'a10'];
    const ergebnisse = seeds.map((s) => waehleBegruessungFuerBuild(s));
    for (const g of ergebnisse) expect(IMMER).toContain(g);
    expect(new Set(ergebnisse).size, ergebnisse.join(' · ')).toBeGreaterThan(1);
  });
});
