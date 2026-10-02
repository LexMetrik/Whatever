import { describe, expect, it } from 'vitest';
import {
  ebeneAngabe, overlineGebiet, suchFeldName, suchPlatzhalter,
} from '../pages/gesetz-leser/v3/erlassAnsicht';
import type { BrowseErlass } from '../lib/normtext/browse-typen';
import type { KantonSystematik } from '../lib/normtext/systematik';

// ─── Vertrags-Tests für erlassAnsicht.ts (Auflage David 16.8.2026) ──────────
//
// «Der Rahmen funktioniert für Bund, Kanton und Staatsvertrag identisch —
//  Erlass-spezifisches kommt aus dem Datenmodell, nie aus `if (bund)`.» Diese
// Datei prüft die Ableitungen, aus denen diese Zusage besteht: `ebeneAngabe`,
// `overlineGebiet` (+ Suchfeld-Wortlaut unten). DOM-frei (§2) — reine Funktionen
// auf einem `Pick<BrowseErlass, …>`.
//
// W2·17-UI-BEFUNDE H9-B01 (1.10.2026) · §6.3-DEKLARATION: `uebersichtsZeile`
// und `brotkrume` samt `hatRuecksprung` sind gestrichen (kein Aufrufer in der
// Produktion; die Kopfzeile trägt seit D27 keine Krume, die Box baut ihre
// Zeile in `ruheZeile`). Ihre Fälle bewachten Code ohne Verwender (§6.7,
// §17-Gegengewicht); `ebeneAngabe` bleibt (Overline, Tiefe, Adresse).
//
// Rot zu bekommen: in `ebeneAngabe` den `rechtsgebiet === 'international'`-
// Vorrang entfernen, oder in `overlineGebiet` den Kanton-Zweig auf einen
// Platzhalter statt `null` umstellen.

describe('ebeneAngabe — die drei Ebenen des Korpus', () => {
  // Cowork-Befund 14 (18.8.2026, fachliche Korrektur): das Ziel zeigte vorher
  // auf `/gesetze` — dasselbe Ziel wie die Krumen-Stufe «Gesetze» davor, also
  // faktisch keine Filterung. Jetzt die gefilterte Bund-Übersicht.
  it('Bund: Label «Bund», Ziel die gefilterte Bund-Übersicht', () => {
    const e: Pick<BrowseErlass, 'ebene' | 'kanton' | 'rechtsgebiet'> = {
      ebene: 'bund', kanton: null, rechtsgebiet: 'privat',
    };
    expect(ebeneAngabe(e)).toEqual({ label: 'Bund', to: '/gesetze?ebene=bund' });
  });

  it('Kanton BS: Label «Kanton BS», Ziel mit Ebene- und Kantonsfilter', () => {
    const e: Pick<BrowseErlass, 'ebene' | 'kanton' | 'rechtsgebiet'> = {
      ebene: 'kanton', kanton: 'BS', rechtsgebiet: 'oeffentlich',
    };
    expect(ebeneAngabe(e)).toEqual({ label: 'Kanton BS', to: '/gesetze?ebene=kanton&kt=BS' });
  });

  it('International: Label «International», eigenes Ziel — UNABHÄNGIG von ebene', () => {
    const e: Pick<BrowseErlass, 'ebene' | 'kanton' | 'rechtsgebiet'> = {
      ebene: 'bund', kanton: null, rechtsgebiet: 'international',
    };
    expect(ebeneAngabe(e)).toEqual({ label: 'International', to: '/gesetze?ebene=international' });
  });

  it('rechtsgebiet: "international" schlägt ebene — auch wenn ebene "kanton" wäre', () => {
    // Diese Konstellation kommt im Korpus real nicht vor (Staatsverträge stehen
    // auf Bundesebene), aber der VORRANG ist die Zusage, nicht die Plausibilität
    // der Eingabe — die Funktion prüft rechtsgebiet zuerst, ebene nie parallel.
    const e: Pick<BrowseErlass, 'ebene' | 'kanton' | 'rechtsgebiet'> = {
      ebene: 'kanton', kanton: 'ZH', rechtsgebiet: 'international',
    };
    expect(ebeneAngabe(e)).toEqual({ label: 'International', to: '/gesetze?ebene=international' });
  });

  it('ein Kanton mit Sonderzeichen wird URL-kodiert', () => {
    const e: Pick<BrowseErlass, 'ebene' | 'kanton' | 'rechtsgebiet'> = {
      ebene: 'kanton', kanton: 'A&B', rechtsgebiet: 'oeffentlich',
    };
    const a = ebeneAngabe(e);
    expect(a.to).toBe('/gesetze?ebene=kanton&kt=A%26B');
    // Der rohe Kantonswert darf in der QUERY nicht unkodiert auftauchen —
    // sonst bräche das & den Query-String in zwei Parameter.
    expect(a.to).not.toContain('kt=A&B');
  });
});

describe('overlineGebiet — Bund zeigt das Rechtsgebiet, Kanton nur Verifiziertes', () => {
  it('Bund: liefert das Rechtsgebiet-Etikett', () => {
    const e: Pick<BrowseErlass, 'ebene' | 'kanton' | 'rechtsgebiet' | 'sr'> = {
      ebene: 'bund', kanton: null, rechtsgebiet: 'privat', sr: '210',
    };
    const label = overlineGebiet(e, {});
    expect(label).not.toBeNull();
    expect(typeof label).toBe('string');
  });

  it('Kanton OHNE verifizierte Systematik: null — nie ein Platzhalter (§8)', () => {
    const e: Pick<BrowseErlass, 'ebene' | 'kanton' | 'rechtsgebiet' | 'sr'> = {
      ebene: 'kanton', kanton: 'AG', rechtsgebiet: 'oeffentlich', sr: 'SAR 152.110',
    };
    // Leere Systematik-Map ⇒ kein Eintrag für 'AG' ⇒ verifiziertesSachgebiet
    // liefert null ⇒ overlineGebiet liefert null, NIE "Bereich AG" o.ä.
    expect(overlineGebiet(e, {})).toBeNull();
  });

  it('Kanton MIT verifizierter Systematik: das aufgelöste Top-Sachgebiet', () => {
    const kantonSys: Record<string, KantonSystematik> = {
      AG: {
        roots: [{ nummer: '6', name: 'Finanzrecht', kinder: [{ nummer: '64', name: 'Steuern' }] }],
        index: { '640100': ['6', '64'] },
      },
    };
    const e: Pick<BrowseErlass, 'ebene' | 'kanton' | 'rechtsgebiet' | 'sr'> = {
      ebene: 'kanton', kanton: 'AG', rechtsgebiet: 'oeffentlich', sr: '640.100',
    };
    expect(overlineGebiet(e, kantonSys)).toBe('Finanzrecht');
  });
});

// ═══ Ä126 (Bug-Check P1-1 / Architektur P3-2, 18.8.2026) · DAS SUCHFELD ══════
//
// GEMESSEN am Live-Stand nach der Säuberung: an ZH-211.11 lautete der
// Platzhalter «Im Gebührenverordnung des Obergerichts (GebV OG) suchen oder
// «§ 1» …» — 465 px in einem 280 px breiten Feld (@390), also über die halbe
// Auskunft abgeschnitten, und dazu grammatisch falsch («die Verordnung»).
//
// ZWEI FEHLER, EINE URSACHE: Ä112 hatte den Erlass in den SICHTBAREN Platzhalter
// gesetzt und dabei zwei Eigenschaften des Registerfelds `kuerzel` übersehen —
// es ist NICHT längenbeschränkt (753 der 1469 Werte sind länger als 20 Zeichen,
// der längste 521) und es hat ein beliebiges Genus, das der feste Artikel «Im»
// nicht treffen kann (StPO/ZPO/BV sind Feminina).
//
// DIE TRENNUNG, die beides löst: der sichtbare Platzhalter trägt gar keine
// Daten mehr («Im Erlass suchen oder «§ 1» …» — konstante Länge, das
// Sprung-Beispiel bleibt erlassgerecht aus Ä20); der Erlass wandert in den
// ZUGÄNGLICHEN NAMEN, wo Pixel nicht zählen, und steht dort als Apposition zu
// «Erlass» — damit regiert der Artikel das Substantiv und nie das Kürzel, in
// jedem Genus. Über der Längenschwelle entfällt das Kürzel auch dort: was
// länger ist als 20 Zeichen, ist im Register kein Kürzel mehr, sondern ein
// Volltitel, und der ist gesprochen Lärm statt Orientierung.
//
// PROXY UND SEINE KALIBRIERUNG (die Sonde ist DOM-frei, §2): gemessen wird die
// ZEICHENZAHL. Der Faktor stammt aus genau jener Live-Messung — 68 Zeichen
// ≙ 465 px bei `text-body-s`, also ~6,84 px/Zeichen; das nutzbare Innenmass des
// Felds @390 sind 280 px abzüglich Polsterung und Lupe ≈ 256 px ⇒ 37 Zeichen.
// Ein Proxy ist kein Pixelmass; er fängt die Fehlerklasse, die hier auftrat
// (eine unbegrenzte DATENlänge im Platzhalter), und er kann scheitern (§6.7 —
// rot gefahren 18.8.2026 gegen den Vorzustand: 68 > 37).
const PLATZHALTER_MAX_ZEICHEN = 37;

describe('Ä126 · Such-Platzhalter und Feldname: erlassneutral, genusfrei, längenfest', () => {
  /** Der ECHTE Registerwert von ZH-211.11 — der Fall aus der Live-Messung. */
  const VOLLTITEL = 'Gebührenverordnung des Obergerichts (GebV OG)';

  it('der Platzhalter wächst nicht mit dem Kürzel', () => {
    // ROT-BEWEIS 18.8.2026: mit der Ä112-Signatur — `suchPlatzhalter(beispiel,
    // VOLLTITEL)`, wie sie `LeserRahmenV3` aufrief — stand hier «Im
    // Gebührenverordnung des Obergerichts (GebV OG) suchen oder «§ 1» …»,
    // 68 statt ≤ 37 Zeichen. Dass das Kürzel gar nicht mehr HINEINGEREICHT
    // werden kann, hält die Quellensonde in `leser-benennung.test.ts` fest;
    // hier steht die Wirkung.
    for (const beispiel of ['§ 1', 'Art. 1', null]) {
      expect(suchPlatzhalter(beispiel).length,
        `Platzhalter «${suchPlatzhalter(beispiel)}» überschreitet das Feld @390`,
      ).toBeLessThanOrEqual(PLATZHALTER_MAX_ZEICHEN);
    }
  });

  it('das Sprung-Beispiel bleibt erlassgerecht (Ä20 unangetastet)', () => {
    expect(suchPlatzhalter('§ 1')).toContain('«§ 1»');
    expect(suchPlatzhalter('Art. 1')).toContain('«Art. 1»');
    // Ohne Etikett verspricht das Feld keinen Sprung (§8).
    expect(suchPlatzhalter(null)).not.toContain('«');
  });

  it('der zugängliche Name nennt ein wirkliches Kürzel — und sonst nichts', () => {
    expect(suchFeldName('StPO')).toBe('Im Erlass StPO suchen oder zu einer Bestimmung springen');
    const ohne = 'Im Erlass suchen oder zu einer Bestimmung springen';
    expect(suchFeldName(VOLLTITEL)).toBe(ohne);
    expect(suchFeldName(undefined)).toBe(ohne);
    expect(suchFeldName('   ')).toBe(ohne);
  });

  it('der Artikel regiert «Erlass», nie das Kürzel — in jedem Genus', () => {
    for (const k of ['StPO', 'ZPO', 'BV', 'OR', 'GebV OG', VOLLTITEL, '']) {
      expect(suchFeldName(k), `Genus-Falle bei «${k}»`).toMatch(/^Im Erlass\b/);
    }
  });
});
