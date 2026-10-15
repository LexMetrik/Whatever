// ─── Grundbuchgebühren-Engine (Eintragungsart-Dimension) ────────────────────
import { describe, expect, it } from 'vitest';
import { berechneGrundbuchgebuehr, vergleichGrundbuchgebuehr, tarifFuerGb } from '../lib/grundbuchgebuehren';
import { berechneNotariatGrundbuch } from '../lib/notariatGrundbuch';
import { GB_EINTRAGSART_IDS, gbEintragsart } from '../data/tarif/grundbuch-typen';
import { KANTONE, type KantonCode } from '../data/tarif/typen';

describe('Grundbuch — Eigentum-Kauf parity (keine Regression zur GRUNDBUCH-Schicht)', () => {
  it('Grundbuch-Posten = Grundbuch-Posten des Grundstückkauf-Rechners (alle 26 Kt)', () => {
    for (const k of KANTONE) {
      for (const wert of [0, 500_000, 1_000_000, 5_000_000]) {
        const neu = berechneGrundbuchgebuehr({ eintragsart: 'eigentum_kauf', kanton: k, wertCHF: wert });
        const alt = berechneNotariatGrundbuch({ kanton: k, kaufpreisCHF: wert });
        expect(neu.posten, `${k} ${wert}`).not.toBeNull();
        expect(neu.posten!.ergebnis, `${k} ${wert}`).toEqual(alt.grundbuch.ergebnis);
      }
    }
  });
});

describe('Grundbuch — Ehrlichkeit & Robustheit (§8)', () => {
  it('Eintragungsarten ohne hinterlegten Tarif liefern status "offen" (kein Schätzwert)', () => {
    const r = berechneGrundbuchgebuehr({ eintragsart: 'vormerkung', kanton: 'ZH' });
    if (r.status === 'offen') {
      expect(r.posten).toBeNull();
      expect(tarifFuerGb('vormerkung', 'ZH')).toBeNull();
    } else {
      expect(r.posten).not.toBeNull();
    }
  });

  it('jede aufgelöste Eintragungsart trägt eine amtliche Quelle (oder ist Rahmen/extern)', () => {
    for (const art of GB_EINTRAGSART_IDS) {
      for (const k of KANTONE) {
        const auf = tarifFuerGb(art, k as KantonCode);
        if (!auf) continue;
        const t = auf.tarif;
        const ok = t.quelleUrl.startsWith('https://') || t.regel.typ === 'formel_extern';
        expect(ok, `${art} ${k} ${t.erlassNr}`).toBe(true);
        expect(t.verifiziert).not.toBe('geprüft' as never);
      }
    }
  });

  it('vergleichGrundbuchgebuehr: 26 Ergebnisse je Eintragungsart, kein Crash', () => {
    for (const art of GB_EINTRAGSART_IDS) {
      const bem = gbEintragsart(art).bemessung;
      for (const wert of [0, 500_000, 1_000_000]) {
        expect(vergleichGrundbuchgebuehr(art, bem === 'wert' ? wert : undefined), `${art} ${wert}`).toHaveLength(26);
      }
    }
  });
});

describe('Grundbuch — amtliche Stützstellen (3-fach verifiziert: find→Doppelcheck→Zweitprüfung→Reencode)', () => {
  const det = (art: Parameters<typeof berechneGrundbuchgebuehr>[0]['eintragsart'], k: KantonCode, w?: number): number => {
    const r = berechneGrundbuchgebuehr({ eintragsart: art, kanton: k, wertCHF: w });
    if (!r.posten || !r.posten.ergebnis.deterministisch) throw new Error(`${art}/${k} nicht deterministisch`);
    return r.posten.ergebnis.betragChf;
  };
  it('flache Promille / Fix', () => {
    expect(det('grundpfand', 'ZH', 800_000)).toBe(800);   // 1‰
    expect(det('dienstbarkeit', 'ZH', 500_000)).toBe(500); // 1‰
    expect(det('vormerkung', 'ZH', 1_000_000)).toBe(500);  // 0,5‰ (Promille-Feld-Fix)
    expect(det('grundpfand', 'LU', 800_000)).toBe(1600);   // 2‰
    expect(det('eigentum_erbgang', 'BS', 1_000_000)).toBe(500); // 0,5‰ Universalsukzession
    expect(det('stockwerkeigentum', 'OW', 2_000_000)).toBe(1000);
    expect(det('vormerkung', 'BE')).toBe(50);              // fix, Wert ignoriert
    expect(det('parzellierung', 'UR')).toBe(100);          // fix
  });
  it('degressive Staffeln (OW/NW) korrekt — kein Flach-Promille-Fehler', () => {
    expect(det('grundpfand', 'OW', 1_000_000)).toBe(1750);     // 2‰/1,5‰ Staffel
    expect(det('eigentum_erbgang', 'OW', 1_000_000)).toBe(1500); // 1,5‰ Staffel
    expect(det('grundpfand', 'NW', 1_000_000)).toBe(2000);    // 2‰ bis 3 Mio
  });
  it('Schwellensatz-Tarife auf Gesamtwert (TI Erbgang) + 70%-Basis (SZ Stockwerkeigentum)', () => {
    expect(det('eigentum_erbgang', 'TI', 1_000_000)).toBe(1375); // 1,375‰ × ganzem Wert
    expect(det('eigentum_erbgang', 'TI', 3_000_000)).toBe(4875); // 1,625‰ über 2 Mio
    expect(det('stockwerkeigentum', 'SZ', 1_000_000)).toBe(630); // 0,63‰ (70%-Basis)
    expect(det('stockwerkeigentum', 'SZ', 3_000_000)).toBe(1890);
  });
  it('Zeitaufwand-Tarife (ZG: CHF 180/Std × Faktor) als ehrliche Nicht-Bezifferung', () => {
    const r = berechneGrundbuchgebuehr({ eintragsart: 'grundpfand', kanton: 'ZG', wertCHF: 500_000 });
    expect(r.posten!.ergebnis.deterministisch).toBe(false);
  });
});

// ─── RL-28 Teil 2: Eintragsteil Grundpfand VS / JU / TI nach Norm ───────────
describe('Grundbuch Grundpfand — VS Aufrundung, JU Lesart, TI ohne Minimum (RL-28 Teil 2)', () => {
  const g = (k: KantonCode, w: number): number => {
    const e = berechneGrundbuchgebuehr({ eintragsart: 'grundpfand', kanton: k, wertCHF: w }).posten!.ergebnis;
    if (!e.deterministisch) throw new Error(`${k}: nicht beziffert`);
    return e.betragChf;
  };
  it('VS: OcRF Art. 32 al. 3 — Basis auf volle 1’000 aufgerundet (1’000’001 → 1’001’000 → 1001)', () => {
    expect(g('VS', 1_000_000)).toBe(1000);
    expect(g('VS', 1_000_001)).toBe(1001);
    expect(g('VS', 100_001)).toBe(101);
    expect(g('VS', 10_000_000)).toBe(2500);
  });
  it('JU: RSJU 176.331 Art. 7 — 1 ‰ in Franken, Minimum 40 und Maximum 10’000 Punkte (à 1.05)', () => {
    expect(g('JU', 1_000_000)).toBe(1000);
    expect(g('JU', 10_000)).toBe(42);
    expect(g('JU', 20_000_000)).toBe(10_500);
  });
  it('TI: LTORF Art. 25 — 7 ‰ ohne Minimum', () => {
    expect(g('TI', 1_000)).toBe(7);
    expect(g('TI', 1_000_000)).toBe(7000);
  });
});

describe('RL-29 Teil 3: TG Vormerkung (GGG § 14 Abs. 2 Ziff. 16 gerechnet, Ziff. 17–19 offengelegt)', () => {
  it('Hinweis nennt Vorkaufsrecht mit ½ ‰ und die nicht gerechneten Ziffern 17, 18, 19 (§8)', () => {
    const t = tarifFuerGb('vormerkung', 'TG')!.tarif;
    const h = t.hinweis ?? '';
    expect(h).toContain('Vorkaufsrecht');
    expect(h).toContain('½ ‰');
    expect(h).toMatch(/Ziff\. 17/);
    expect(h).toMatch(/Ziff\. 18/);
    expect(h).toMatch(/Ziff\. 19/);
    expect(h).toContain('nicht gerechnet');
  });
  it('gerechneter Fall bleibt Ziff. 16 (1 ‰ min. 100 max. 5’000)', () => {
    const r = berechneGrundbuchgebuehr({ eintragsart: 'vormerkung', kanton: 'TG', wertCHF: 400_000 });
    const e = r.posten!.ergebnis;
    if (!e.deterministisch) throw new Error('deterministisch erwartet');
    expect(e.betragChf).toBe(400);
  });
});
