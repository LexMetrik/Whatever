/**
 * W2·24-DESIGN-IDENTITAET · R9 «Einheitlichkeit», Fixer 2 — Befund C4-1.
 *
 * DER BEFUND (Finder-Welle C, 6.9.2026): dieselbe Aussage — «diese Eingabe ist
 * fehlerhaft / dieser Schritt ist blockiert» — trug SIEBEN Bauformen, alle von
 * Hand gezeichnet und alle nebeneinander im selben Produkt:
 *   `border border-line bg-danger-bg p-4` · `border bg-danger-bg p-4` ·
 *   `bg-danger-bg p-3` · `border border-danger-700/40 bg-danger-bg p-3` ·
 *   `rounded-md bg-danger-bg p-3`
 * — während `index.css` mit `.lc-notice-danger` seit Langem EINEN Baustein für
 * genau diese Aussage führt (Linie links, Warn-/Danger-Füllung, ein Polster).
 *
 * WAS DIESE SONDE BEWACHT, und warum es eine AUFRUFSTELLEN-Sonde sein muss:
 * ein Unit-Test am Baustein hätte nie gesehen, dass sieben Stellen ihn gar
 * nicht benutzen. Die Regel greift darum am Rohstoff, aus dem die Kopien
 * gebaut wurden: der Füllungs-Utility `bg-danger-bg`. Wer sie in der Hand hat,
 * zeichnet gerade eine achte Fehlerbox.
 *
 * ZWEI AUSNAHMEN, beide nach der FORM abgegrenzt, nicht nach der Datei:
 *   (a) Zustands-Präfixe (`hover:` / `focus:` / …). Eine Fläche, die nur beim
 *       Überfahren erscheint, ist Zustandsauskunft an einem Bedienelement und
 *       keine stehende Meldung (§G-j) — `pages/Einstellungen.tsx:198` färbt so
 *       den «Alles zurücksetzen …»-Knopf ein.
 *   (b) die Ton-Tabelle eines Bausteins in `components/ui/**`: dort ist die
 *       Klasse ein WERT, kein Kasten. Die Begründung dafür steht am Fundort und
 *       wird unten wörtlich zitiert (§6.7: eine Ausnahme, die man nur im Test
 *       sieht, ist eine unsichtbare Ausnahme).
 *
 * §3: reine Darstellung — hier wird über keine Frist und keine Quote entschieden.
 */
import { describe, it, expect } from 'vitest';
import { alleQuellen, liesOhneKommentare, pruefeAusnahmen, rel } from './appDateien';

/**
 * `bg-danger-bg` als GRUNDFLÄCHE — also ohne Zustands-Präfix davor.
 *
 * Der Lookbehind ist die ganze Abgrenzung (a): `hover:bg-danger-bg` fällt nicht
 * auf, `bg-danger-bg` fällt auf. `[\w-]+:` deckt jedes Tailwind-Präfix ab
 * (`hover:`, `focus-visible:`, `group-hover:`, `sm:`) — auch ein künftiges.
 */
const DANGER_FLAECHE = /(?<![\w-]:)\bbg-danger-bg\b/g;

/** Der ganze JSX-Tag, der den Baustein trägt (Attribut-Reihenfolge egal). */
const NOTICE_TAG = /<[^<>]*\blc-notice-danger\b[^<>]*>/g;

/** Die beiden zulässigen ARIA-Rollen einer Danger-Meldung (Herleitung unten). */
const ROLLE = /role="(?:alert|status)"/g;

/** Die eine Ausnahme, mit ihrer Begründung AM FUNDORT (wörtlich zitiert). */
const AUSNAHMEN = [{
  datei: 'components/ui/SelectionGrid.tsx',
  begruendung: 'Verdikt, kein Werkstoff — dieselbe Trennung wie bei danger/warn.',
}];

describe('C4-1 · die Fehlerbox hat EINE Bauform', () => {
  it('keine App-Datei zeichnet die Danger-Fläche noch von Hand', () => {
    const erlaubt = pruefeAusnahmen(AUSNAHMEN);
    const funde: string[] = [];
    for (const p of alleQuellen()) {
      if (erlaubt.has(rel(p))) continue;
      const quelle = liesOhneKommentare(p);
      for (const zeile of quelle.split('\n')) {
        if (!DANGER_FLAECHE.test(zeile)) { DANGER_FLAECHE.lastIndex = 0; continue; }
        DANGER_FLAECHE.lastIndex = 0;
        // Der Baustein selbst darf sie führen — er IST die eine Bauform.
        if (/\blc-notice-danger\b/.test(zeile)) continue;
        funde.push(`${rel(p)}: ${zeile.trim()}`);
      }
    }
    expect(
      funde,
      'C4-1 (CLAUDE.md §5/§10): eine Fehler-/Blocker-Meldung wird nicht nachgezeichnet, '
      + 'sie wird auf `.lc-notice-danger` gezogen. Sieben Kopien standen am 6.9.2026 '
      + 'neben dem Baustein; jede weitere ist die achte.',
    ).toEqual([]);
  });

  it('jede Aufrufstelle meldet sich auch der Vorlesesoftware (role alert|status)', () => {
    // GEMESSEN beim ersten Lauf dieser Sonde (6.9.2026): von 25 Aufrufstellen des
    // Bausteins trugen 18 GAR KEINE Rolle — ein rotes Banner, das nur das Auge
    // sieht (§8). Die Sonde verlangt darum eine Rolle, nicht eine bestimmte: die
    // Wahl zwischen den beiden ist eine FACHLICHE, und sie fällt nach der Lage —
    //   · `role="alert"` (unterbricht) — die Meldung antwortet auf eine EINGABE
    //     und nennt etwas, das der Nutzer beheben soll: Blocker-/Mängellisten im
    //     Prüfen-Schritt, gesperrte Exporte, ein «nichtig»-Verdikt.
    //   · `role="status"` (höflich) — die Meldung beschreibt einen gewählten
    //     Modus oder eine Abdeckungsgrenze, an der es nichts zu beheben gibt:
    //     `ZpoFristenForm` (Phase «materiell»), `SchkgFristenForm` (Fristtyp ohne
    //     Berechnung), `ErlassLeserKopf` (aufgehobener Erlass — stand schon so).
    // Beides einer Maschine zu überlassen hiesse, eine Strenge zu behaupten, die
    // das Reglement nicht trägt (§8). Die Sonde hält fest, was PRÜFBAR ist: dass
    // die Entscheidung überhaupt getroffen wurde.
    const ohneRolle: string[] = [];
    let gefunden = 0;
    for (const p of alleQuellen()) {
      for (const tag of liesOhneKommentare(p).match(NOTICE_TAG) ?? []) {
        gefunden += 1;
        if (!ROLLE.test(tag)) ohneRolle.push(`${rel(p)}: ${tag.trim()}`);
        ROLLE.lastIndex = 0;
      }
    }
    expect(
      ohneRolle,
      'R9-2 Ziff. 1: der Danger-Ton ist die Auskunft für das Auge, die ARIA-Rolle '
      + 'dieselbe Auskunft für alle anderen (§8). `role="alert"` für eine Meldung, die '
      + 'auf eine Eingabe antwortet; `role="status"` für einen Zustand ohne '
      + 'Behebungsauftrag. Keine Rolle ist keine Wahl, sondern ein Vergessen.',
    ).toEqual([]);
    // Negativ-Kontrolle: der Sweep hat die Aufrufstellen überhaupt gesehen. Ohne
    // sie wäre dieser Test grün, sobald der Baustein ausgebaut wird (§6.7).
    // 23.9.2026 W2·29-WERKBANK-VORLAGEN V2b/V2d: Blocker-Boxen der Vorlagen im
    // Rahmen gebündelt (gemessen 18 Aufrufstellen, vorher ≥ 20); Schwelle auf 15
    // gesenkt, Puffer 3 (Gegenprüfung: 10 zu locker).
    expect(gefunden, 'der Baustein hat Aufrufstellen').toBeGreaterThanOrEqual(15);
  });

  it('ROT-BEWEIS: der Ausdruck erkennt alle fünf Bauformen, die vor R9-2 im Repo standen', () => {
    const vorher = [
      '<div role="alert" className="border border-line bg-danger-bg p-4 space-y-1">',
      '<div className=" border border-line bg-danger-bg p-4">',
      '<div className="border bg-danger-bg p-4 space-y-1.5" role="alert">',
      '<div className="border border-danger-700/40 bg-danger-bg p-3 space-y-1" role="alert">',
      '<div className="rounded-md bg-danger-bg p-3 space-y-0.5">',
    ];
    for (const z of vorher) {
      DANGER_FLAECHE.lastIndex = 0;
      expect(DANGER_FLAECHE.test(z), `muss auffallen: ${z}`).toBe(true);
    }
    // Negativ-Kontrolle 1: die migrierte Form fällt NICHT auf (sie führt den Baustein).
    DANGER_FLAECHE.lastIndex = 0;
    expect(DANGER_FLAECHE.test('<div role="alert" className="lc-notice lc-notice-danger space-y-1">')).toBe(false);
    // Negativ-Kontrolle 2: der Zustands-Hover fällt NICHT auf (Abgrenzung (a)).
    DANGER_FLAECHE.lastIndex = 0;
    expect(DANGER_FLAECHE.test('className="border border-danger-line text-danger-700 hover:bg-danger-bg"')).toBe(false);
  });

  it('ROT-BEWEIS: eine Aufrufstelle ohne ARIA-Rolle fällt auf', () => {
    // Genau die 18 Formen, die der Erstlauf dieser Sonde im Repo gefunden hat.
    for (const roh of [
      '<div className="lc-notice-danger">',
      '<div className="lc-notice-danger space-y-1">',
      '<div key={i} className="lc-notice-danger">',
    ]) {
      const tag = roh.match(NOTICE_TAG);
      expect(tag, `der Ausdruck greift den Tag: ${roh}`).not.toBeNull();
      ROLLE.lastIndex = 0;
      expect(ROLLE.test(tag![0]), `muss auffallen: ${roh}`).toBe(false);
    }
    // Negativ-Kontrolle: beide Rollen und beide Attribut-Reihenfolgen fallen NICHT auf.
    for (const ok of [
      '<div role="alert" className="lc-notice lc-notice-danger">',
      '<div className="lc-notice lc-notice-danger space-y-1.5" role="alert">',
      '<div role="status" className="lc-notice-danger text-body-s">',
    ]) {
      ROLLE.lastIndex = 0;
      expect(ROLLE.test(ok.match(NOTICE_TAG)![0]), ok).toBe(true);
    }
  });
});
