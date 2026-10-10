import { describe, it, expect } from 'vitest';
import { aufloeseZitierteEntscheide } from '../lib/verzahnung/entscheid-kanten';
import { ersteTextFundstelle } from '../lib/rechtsprechung/abschnitte';
import type { BrowseEntscheid } from '../lib/rechtsprechung/register';
import type { EntscheidAbschnitt } from '../lib/rechtsprechung/typen';

// V1.3 (W2·7-VZUI): Auflösung zitierter Entscheide gegen das Manifest + der
// generische in-Text-Fundstellen-Sprung. Reine Datenschicht, deterministisch (§2).

const eintrag = (over: Partial<BrowseEntscheid>): BrowseEntscheid => ({
  key: 'k', gericht: 'bger', gerichtName: 'Bundesgericht', gerichtstyp: 'bundesgericht',
  kanton: 'CH', nummer: '5A_1/2020', bgeReferenz: null, datum: '2020-05-05',
  zitierung: 'BGer 5A_1/2020', leitcharakter: 'routine', regesteVorhanden: false,
  regesteKurz: null, sachgebiet: 'privat',
  sprache: 'de', normKeys: [], bestand: 'snapshot', kuratierung: 'maschinell',
  datei: 'bund/bger/x.json', quelle: 'opencaselaw', quelleUrl: 'https://example.org',
  ...over,
});

const ABSCHNITTE: EntscheidAbschnitt[] = [
  { typ: 'sachverhalt', bloecke: [{ marke: null, text: 'A. Vorgeschichte, BGE 144 II 486 wird hier NICHT gezählt (kein Erwägungs-Anker).' }] },
  {
    typ: 'erwaegung',
    bloecke: [
      { marke: 'E. 1', text: 'Eintretensfragen.' },
      { marke: 'E. 2', text: 'Kopf der zweiten Erwägung.' },
      { marke: 'E. 2.3', text: 'Nach der Rechtsprechung (BGE 144\nII 486 E. 5.2) gilt …' },
      { marke: 'E. 3', text: 'Weiteres zur Kognition.' },
    ],
  },
];

const MANIFEST: BrowseEntscheid[] = [
  eintrag({ key: 'bge_144_II_486', bgeReferenz: '144 II 486', zitierung: 'BGE 144 II 486', leitcharakter: 'leitentscheid' }),
  // Verweis-Karte zum selben BGE — darf NIE das Ziel sein (kein Daten-Duplikat).
  eintrag({ key: 'verweis_144_II_486', bgeReferenz: '144 II 486', datei: null, verweis: { zielKey: 'bge_144_II_486', ansicht: 'voll', bgeReferenz: '144 II 486' } }),
  eintrag({ key: 'bger_5A_99_2021', nummer: '5A_99/2021', zitierung: 'BGer 5A_99/2021' }),
];

describe('ersteTextFundstelle — generischer in-Text-Sprung', () => {
  it('findet die erste Erwägung mit dem Zitat (whitespace-normalisiert)', () => {
    // Der Block trägt «BGE 144\nII 486» — die Suche normalisiert beide Seiten.
    expect(ersteTextFundstelle(ABSCHNITTE, 'BGE 144 II 486')).toBe('e-2-3');
  });
  it('Sachverhalt zählt nicht (nur Erwägungs-Anker)', () => {
    expect(ersteTextFundstelle(ABSCHNITTE, 'wird hier NICHT gezählt')).toBe(null);
  });
  it('kein Vorkommen → null (ehrlicher Fallback)', () => {
    expect(ersteTextFundstelle(ABSCHNITTE, 'BGE 999 IX 999')).toBe(null);
  });
  it('leerer Suchtext → null', () => {
    expect(ersteTextFundstelle(ABSCHNITTE, '   ')).toBe(null);
  });
});

describe('aufloeseZitierteEntscheide — Manifest-Auflösung (§0-1c)', () => {
  it('löst BGE-Zitate über bgeReferenz auf, mit Leitcharakter + Fundstelle', () => {
    const r = aufloeseZitierteEntscheide(['BGE 144 II 486'], MANIFEST, ABSCHNITTE, 'selbst');
    expect(r.gesamt).toBe(1);
    expect(r.imKorpus).toBe(1);
    expect(r.kanten[0].ziel).toEqual({ key: 'bge_144_II_486', zitierung: 'BGE 144 II 486', leitcharakter: 'leitentscheid' });
    expect(r.kanten[0].fundstelleAnker).toBe('e-2-3');
  });
  it('nimmt NIE die Verweis-Karte als Ziel', () => {
    const r = aufloeseZitierteEntscheide(['BGE 144 II 486'], MANIFEST, ABSCHNITTE, 'selbst');
    expect(r.kanten[0].ziel?.key).not.toBe('verweis_144_II_486');
  });
  it('löst Aktenzeichen über nummer auf', () => {
    const r = aufloeseZitierteEntscheide(['5A_99/2021'], MANIFEST, ABSCHNITTE, 'selbst');
    expect(r.imKorpus).toBe(1);
    expect(r.kanten[0].ziel?.key).toBe('bger_5A_99_2021');
  });
  it('unaufgelöste Zitate: gezählt, aber ohne Ziel (kein toter Link)', () => {
    const r = aufloeseZitierteEntscheide(['BGE 77 I 1', 'BGE 144 II 486'], MANIFEST, ABSCHNITTE, 'selbst');
    expect(r.gesamt).toBe(2);
    expect(r.imKorpus).toBe(1);
    // aufgelöste zuerst (stabile Sortierung)
    expect(r.kanten[0].ziel?.key).toBe('bge_144_II_486');
    expect(r.kanten[1].ziel).toBe(null);
  });
  it('dedupliziert Zitate und schliesst den Selbst-Verweis aus', () => {
    const r = aufloeseZitierteEntscheide(
      ['BGE 144 II 486', 'BGE  144 II 486', '5A_99/2021'],
      MANIFEST, ABSCHNITTE, 'bger_5A_99_2021',
    );
    expect(r.gesamt).toBe(2);           // Duplikat weg
    expect(r.imKorpus).toBe(1);         // 5A_99/2021 = selbst → nicht aufgelöst
  });
});
