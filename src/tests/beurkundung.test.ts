// ─── Allgemeine Beurkundungskosten-Engine (Geschäftsart-Dimension) ──────────
import { describe, expect, it } from 'vitest';
import { berechneBeurkundung, vergleichBeurkundung, tarifFuer, istWertbasiert } from '../lib/beurkundung';
import { berechneNotariatGrundbuch } from '../lib/notariatGrundbuch';
import { notariatsGebuehrGruendung } from '../lib/notariatsgebuehrenGruendung';
import { GESCHAEFTSART_IDS, geschaeftsart } from '../data/tarif/beurkundung-typen';
import { KANTONE, type KantonCode, type KantonalerTarif } from '../data/tarif/typen';
import { SONDERTARIFE } from '../data/tarif/beurkundung';
import { NOTARIAT } from '../data/tarif/notariat-grundbuch';

describe('Beurkundung — Grundstückkauf parity (keine Regression zum Spezialrechner)', () => {
  it('Beurkundungs-Posten = Notariat-Posten des Grundstückkauf-Rechners (alle 26 Kt)', () => {
    for (const k of KANTONE) {
      for (const wert of [0, 500_000, 1_000_000, 5_000_000]) {
        const neu = berechneBeurkundung({ geschaeftsart: 'grundstueckkauf', kanton: k, geschaeftswertCHF: wert });
        const alt = berechneNotariatGrundbuch({ kanton: k, kaufpreisCHF: wert });
        expect(neu.posten, `${k} ${wert}`).not.toBeNull();
        expect(neu.posten!.ergebnis, `${k} ${wert}`).toEqual(alt.beurkundung.ergebnis);
        expect(neu.posten!.quelle.artikel, `${k}`).toBe(alt.beurkundung.quelle.artikel);
      }
    }
  });
});

describe('Beurkundung — Ehrlichkeit & Robustheit (§8)', () => {
  it('wertbasierte Arten ohne hinterlegten Tarif liefern status "offen" (kein Schätzwert)', () => {
    // Solange GENERELLER_WERTTARIF/SONDERTARIFE für eine Art/Kt leer sind, darf
    // NIE ein Betrag erscheinen — nur ehrliches "offen".
    const r = berechneBeurkundung({ geschaeftsart: 'buergschaft', kanton: 'ZH', geschaeftswertCHF: 100_000 });
    if (r.status === 'offen') {
      expect(r.posten).toBeNull();
      expect(tarifFuer('buergschaft', 'ZH')).toBeNull();
    } else {
      // sobald Recherche-Daten vorhanden sind: dann MUSS eine Quelle dranhängen.
      expect(r.posten).not.toBeNull();
      expect(r.posten!.quelle.quelleUrl.startsWith('https://') || !r.posten!.ergebnis.deterministisch).toBe(true);
    }
  });

  it('jede aufgelöste Geschäftsart trägt eine amtliche Quelle (oder ist Rahmen/extern)', () => {
    for (const art of GESCHAEFTSART_IDS) {
      for (const k of KANTONE) {
        const auf = tarifFuer(art, k as KantonCode);
        if (!auf) continue;
        const t = auf.tarif;
        const ok = t.quelleUrl.startsWith('https://') || t.regel.typ === 'formel_extern';
        expect(ok, `${art} ${k} ${t.erlassNr}`).toBe(true);
        expect(t.verifiziert).not.toBe('geprüft' as never);
      }
    }
  });

  it('vergleichBeurkundung: 26 Ergebnisse je Art, kein Crash über breite Wert-Matrix', () => {
    for (const art of GESCHAEFTSART_IDS) {
      const bem = geschaeftsart(art).bemessung;
      for (const wert of [0, 100_000, 1_000_000, 10_000_000]) {
        const v = vergleichBeurkundung(art, bem === 'wert' ? wert : undefined);
        expect(v, `${art} ${wert}`).toHaveLength(26);
      }
    }
  });

  it('Geschäftswert negativ wirft, 0 ok', () => {
    expect(() => berechneBeurkundung({ geschaeftsart: 'grundstueckkauf', kanton: 'ZH', geschaeftswertCHF: -1 })).toThrow();
    expect(() => berechneBeurkundung({ geschaeftsart: 'grundstueckkauf', kanton: 'ZH', geschaeftswertCHF: 0 })).not.toThrow();
  });
});

describe('Beurkundung — amtliche Stützstellen (3-fach verifiziert: find→Doppelcheck→Zweitprüfung→Reencode)', () => {
  const det = (art: Parameters<typeof berechneBeurkundung>[0]['geschaeftsart'], k: KantonCode, w?: number): number => {
    const r = berechneBeurkundung({ geschaeftsart: art, kanton: k, geschaeftswertCHF: w });
    if (!r.posten || !r.posten.ergebnis.deterministisch) throw new Error(`${art}/${k} nicht deterministisch`);
    return r.posten.ergebnis.betragChf;
  };
  const spanne = (art: Parameters<typeof berechneBeurkundung>[0]['geschaeftsart'], k: KantonCode, w?: number) => {
    const r = berechneBeurkundung({ geschaeftsart: art, kanton: k, geschaeftswertCHF: w });
    const e = r.posten!.ergebnis;
    if (e.deterministisch) throw new Error('deterministisch erwartet Spanne');
    return [e.vonChf, e.bisChf];
  };

  it('flache Promillesätze / Fixgebühren', () => {
    expect(det('buergschaft', 'ZH', 100_000)).toBe(100);   // 0,5‰ → min 100
    expect(det('stiftung', 'ZH', 1_000_000)).toBe(1000);   // 1‰
    expect(det('ag_gruendung', 'ZH', 1_000_000)).toBe(1000); // 1‰
    expect(det('dienstbarkeit', 'SZ', 500_000)).toBe(450); // 0,9‰
    // GE Bürgschaft: Korrektur 1‰ (nicht 1%), min 100 / max 500.
    expect(det('buergschaft', 'GE', 200_000)).toBe(200);
    expect(det('buergschaft', 'GE', 1_000_000)).toBe(500); // max 500
  });

  it('degressive Wert-Staffeln korrekt (kein Flach-Promille-Überhöhungsfehler mehr)', () => {
    expect(det('schenkung', 'LU', 1_000_000)).toBe(2750);   // § 21 Staffel 3‰/2,5‰
    // §8-Korrektur 16.6.: TNo Art. 26 = Grundgebühr-RAHMEN 200–2000 (Ermessen)
    // PLUS degressiver Wertanteil → ehrliche Spanne [Wertanteil 1650, +1800].
    expect(spanne('ag_gruendung', 'VD', 1_000_000)).toEqual([1650, 3450]);
    expect(det('erbvertrag', 'NW', 1_000_000)).toBe(2100);  // § 18 Staffel
    expect(det('ag_gruendung', 'NW', 1_000_000)).toBe(2900);// § 36 Sockel+Staffel
    expect(det('schenkung', 'GL', 1_000_000)).toBe(1700);   // A1-1 Staffel
  });

  it('UR: alle Einträge ohne amtlichen Tarif, nicht gerechnet (RL-26, W-14, RB 9.2311 Art. 38 Abs. 3)', () => {
    const ur = Object.values(SONDERTARIFE).map((m) => m?.UR).filter((t): t is KantonalerTarif => !!t);
    expect(ur.length).toBe(21);
    for (const t of ur) {
      expect(t.regel.typ).toBe('formel_extern');
      expect(t.erlassNr).toBe('RB 9.2311');
      expect(t.quelleUrl).not.toContain('urilaw');
    }
    expect(berechneBeurkundung({ geschaeftsart: 'testament', kanton: 'UR' }).posten?.ergebnis.deterministisch).toBe(false);
    expect(berechneBeurkundung({ geschaeftsart: 'vollmacht', kanton: 'UR' }).posten?.ergebnis.deterministisch).toBe(false);
  });

  it('UR: genau 22 Einträge formel_extern + RB 9.2311 (21 Sondertarife + NOTARIAT.UR)', () => {
    const alle = [NOTARIAT.UR, ...Object.values(SONDERTARIFE).map((m) => m?.UR)].filter((t): t is KantonalerTarif => !!t);
    const treffer = alle.filter((t) => t.regel.typ === 'formel_extern' && t.erlassNr === 'RB 9.2311');
    expect(treffer.length).toBe(22);
  });

  it('aktuelle Fassung (ZH NotGebV 1.1.2024, nicht aufgehobene v95) als Rahmen', () => {
    expect(spanne('testament', 'ZH')).toEqual([200, 4000]);  // Korrektur 4000 (nicht 5000)
    expect(spanne('erbvertrag', 'ZH')).toEqual([300, 6000]); // Korrektur 6000 (nicht 7500)
    expect(spanne('ag_gruendung', 'SZ', 100_000)).toEqual([200, 1300]);
  });

  it('dieselbe Geschäftsart je Kanton wertbasiert ODER fix (Testament: OW Staffel, ZH Rahmen)', () => {
    expect(istWertbasiert('testament', 'OW')).toBe(true);
    // §8-Korrektur 16.6.: OW Art. 10 = Grundgebühr-RAHMEN 500–1800 (Ermessen)
    // PLUS 1‰ Wertanteil → ehrliche Spanne [Wertanteil 1500, +1300].
    expect(spanne('testament', 'OW', 1_000_000)).toEqual([1500, 2800]);
    expect(istWertbasiert('testament', 'ZH')).toBe(false);  // Rahmen 200–4000
  });

  it('Aufwand-/Stundensatz-Tarife als ehrliche Nicht-Bezifferung (kein Schein-Wert)', () => {
    // ZH Vorsorgeauftrag = CHF 180/Std (Ziff. 4.2.3), nicht «nach Vereinbarung-Fix».
    const zhVa = berechneBeurkundung({ geschaeftsart: 'vorsorgeauftrag', kanton: 'ZH' });
    expect(zhVa.posten!.ergebnis.deterministisch).toBe(false);
    const beEhe = berechneBeurkundung({ geschaeftsart: 'ehevertrag', kanton: 'BE' });
    expect(beEhe.posten!.ergebnis.deterministisch).toBe(false);
  });
});

describe('Beurkundung — AG-Gründung: Adapter liefert Engine-Wert (RL-36, ersetzt den Zwei-Encodings-Paritätstest)', () => {
  // Bis RL-36 hielten notariatsGebuehrGruendung (Spezial-Kopie) und die allgemeine
  // Engine zwei LIVE geschaltete Encodings derselben Gründungstarife; ein Paritätstest
  // (6 Kantone, dichter Sweep) hielt sie zusammen. Der Spezial-Rechner ist jetzt ein
  // dünner Adapter auf berechneBeurkundung('ag_gruendung'): die Parität ist
  // konstruktionsbedingt, der Test prüft stattdessen, dass der Adapter den
  // Engine-Wert nicht verfälscht — und zwar für ALLE 26 Kantone (zuvor 6) und
  // ohne BE-Ausnahme über 20 Mio. Deklarierter Rückbau (W-05, Sammelfreigabe a).

  type Kanon =
    | { kind: 'betrag'; chf: number }
    | { kind: 'rahmen'; von: number; bis: number }
    | { kind: 'offen' };

  const kanonSpezial = (k: string, kap: number): Kanon => {
    const a = notariatsGebuehrGruendung(k, kap);
    if (!a) return { kind: 'offen' };
    const e = a.ergebnis;
    if (e.typ === 'betrag') return { kind: 'betrag', chf: Math.round(e.chf) };
    if (e.typ === 'rahmen') return { kind: 'rahmen', von: e.vonChf, bis: e.bisChf };
    return { kind: 'offen' }; // 'nicht_beziffert'
  };
  const kanonAllg = (k: KantonCode, kap: number): Kanon => {
    const r = berechneBeurkundung({ geschaeftsart: 'ag_gruendung', kanton: k, geschaeftswertCHF: kap });
    if (!r.posten) return { kind: 'offen' };
    const e = r.posten.ergebnis;
    if (e.deterministisch) return { kind: 'betrag', chf: Math.round(e.betragChf) };
    if (e.vonChf != null && e.bisChf != null) return { kind: 'rahmen', von: e.vonChf, bis: e.bisChf };
    return { kind: 'offen' }; // 'formel_extern'/Aufwand → nicht beziffert
  };

  // Konvergenz beider Systeme — dicht verifiziert (0 Abweichungen). Fix 16.6.2026:
  // SG floored auf ganze Tranchen (GebT Nr. 60.13 «je weitere VOLLE 100 000»; das
  // allg. System rechnete zuvor kontinuierlich 0,08‰ und widersprach seinem eigenen
  // Hinweis), BE liest jetzt die kapitalspezifische Anhang-4-Stufe (GebVN Art. 21)
  // statt einer flachen Gesamtspanne. Beide Encodings sind damit angeglichen.
  // Tripwire gegen jede künftige einseitige Tarif-Änderung in EINEM der Systeme.
  it('alle 26 Kantone: Adapter == Engine über dichten Kapital-Sweep', () => {
    for (const k of KANTONE as readonly KantonCode[]) {
      for (let w = 0; w <= 3_000_000; w += 25_000) {
        expect(kanonSpezial(k, w), `${k} @ ${w}`).toEqual(kanonAllg(k, w));
      }
      for (const w of [5_000_000, 10_000_000, 20_000_000, 50_000_000]) {
        expect(kanonSpezial(k, w), `${k} @ ${w}`).toEqual(kanonAllg(k, w));
      }
    }
  });

  it('BE: Anhang-4-Stufe und Höchststufe über 20 Mio. (16\'450–27\'350)', () => {
    expect(kanonSpezial('BE', 1_000_000)).toEqual({ kind: 'rahmen', von: 2200, bis: 3600 });
    expect(kanonSpezial('BE', 50_000_000)).toEqual({ kind: 'rahmen', von: 16450, bis: 27350 });
  });
});
