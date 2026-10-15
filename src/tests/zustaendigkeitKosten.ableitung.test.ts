import { describe, it, expect } from 'vitest';
import { ZUSTAENDIGKEIT_KOSTEN } from '../data/zustaendigkeitKosten';
import { SCHLICHTUNG } from '../data/tarif/schlichtung';
import { GERICHTSKOSTEN } from '../data/tarif/gerichtskosten';
import { GERICHTSKOSTEN_NV } from '../data/tarif/nicht-vermoegensrechtlich';
import { auswertenTarif } from '../lib/tarif/staffel';
import { KANTONE } from '../lib/kantone';

// RL-36 Teil 2 (RV-27 / VS1-01): Die Kostenanzeige der Zuständigkeitsprüfung
// ist KEINE Handkopie der Tarifdaten mehr (§5), sondern wird aus
// SCHLICHTUNG / GERICHTSKOSTEN / GERICHTSKOSTEN_NV abgeleitet. Dieser Test hält
// (a) die vier amtlich belegten Prüfwerte fest und (b) für alle 26 Kantone,
// dass der angezeigte Zahlenrahmen den Tarifquellen entspricht. Unabhängiger
// Pfad: die Erwartung wird hier über `auswertenTarif` an Stützwerten gebildet,
// nicht über die Ableitungsfunktion des Moduls.

const fmt = (n: number): string => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");

describe('RL-36 Teil 2 · amtliche Prüfwerte', () => {
  it("AI Schlichtung: 100–1'000 (Art. 7 lit. b–d GGV AI 173.810), nicht 50–300", () => {
    const s = ZUSTAENDIGKEIT_KOSTEN.AI.schlichtung;
    expect(s.text).toContain("100–1'000");
    expect(s.text).not.toContain('50–300');
    for (const teil of ['200–1000', '300–1000', '100–600']) expect(s.hinweis ?? '', teil).toContain(teil);
  });

  it("VS Schlichtung: Vorladung 50–100 + Verhandlung 120–250 (Normalfall 170–350), Abs. 2 60–500 (Art. 15 LTar VS 173.8)", () => {
    const s = ZUSTAENDIGKEIT_KOSTEN.VS.schlichtung;
    expect(s.text).toContain("50–500");
    expect(s.text).not.toContain('60–120');
    for (const teil of ['50–100', '120–250', '170–350', '60–500']) expect(s.hinweis ?? '', teil).toContain(teil);
  });

  it("TI Gericht: 30'000–50'000 CHF 2'500–5'000, 50'000–100'000 CHF 3'000–8'000 (Art. 7 LTG TI 178.200)", () => {
    const g = ZUSTAENDIGKEIT_KOSTEN.TI.gericht.text;
    expect(g).toContain("2'500–5'000");
    expect(g).toContain("3'000–8'000");
    expect(g).not.toContain("1'500–8'000");
  });

  it("TG nicht vermögensrechtlich: 300–20'000 (§ 11 Ziff. 2 VGG TG 638.1), nicht 300–5'000", () => {
    const n = ZUSTAENDIGKEIT_KOSTEN.TG.nichtVermoegensrechtlich!.text;
    expect(n).toContain("300–20'000");
    expect(n).not.toContain("300–5'000");
  });
});

describe('RL-36 Teil 2 · Konsistenz Zuständigkeits-Anzeige = Tarifquellen, alle 26 Kantone', () => {
  it('Schlichtung: jeder Tarifwert an den Stützwerten liegt im angezeigten Rahmen; Rahmen-Tarife exakt', () => {
    for (const k of KANTONE) {
      const text = ZUSTAENDIGKEIT_KOSTEN[k].schlichtung.text;
      const regel = SCHLICHTUNG[k].regel;
      const m = /CHF ([\d']+)(?:–([\d']+))?/.exec(text);
      expect(m, `${k}: ${text}`).not.toBeNull();
      const a = Number(m![1].replace(/'/g, ''));
      const b = Number((m![2] ?? m![1]).replace(/'/g, ''));
      if (regel.typ === 'rahmen') {
        expect([a, b], k).toEqual([Math.round(regel.vonChf), Math.round(regel.bisChf)]);
        continue;
      }
      for (const s of [0, 500, 1000, 2000, 5000, 10000, 30000, 50000, 100000, 500000]) {
        const e = auswertenTarif(regel, s);
        const von = e.deterministisch ? e.betragChf : e.vonChf;
        const bis = e.deterministisch ? e.betragChf : e.bisChf;
        if (von !== undefined) expect(Math.round(von), `${k}@${s} von`).toBeGreaterThanOrEqual(a);
        if (bis !== undefined) expect(Math.round(bis), `${k}@${s} bis`).toBeLessThanOrEqual(Math.max(b, 0) || Infinity);
      }
    }
  });

  it("Gericht: Tarifwerte an den Stützwerten 30'001–100'000 stehen im angezeigten Text (Rahmen) bzw. liegen darin (Formel-Tarife)", () => {
    for (const k of KANTONE) {
      const text = ZUSTAENDIGKEIT_KOSTEN[k].gericht.text;
      for (const s of [30001, 40000, 50000, 50001, 75000, 100000]) {
        const e = auswertenTarif(GERICHTSKOSTEN[k].regel, s);
        if (e.deterministisch) {
          // Formel-/Pauschal-Tarif: angezeigt wird die Spanne der Stützwerte 30'001–100'000
          const m = /CHF ([\d']+)(?:–([\d']+))?/.exec(text.slice(text.indexOf(':')));
          const a = Number(m![1].replace(/'/g, ''));
          const bb = Number((m![2] ?? m![1]).replace(/'/g, ''));
          expect(Math.round(e.betragChf), `${k}@${s}`).toBeGreaterThanOrEqual(a);
          expect(Math.round(e.betragChf), `${k}@${s}`).toBeLessThanOrEqual(bb);
          continue;
        }
        const zahlen = [e.vonChf, e.bisChf];
        for (const z of zahlen) {
          expect(z, `${k}@${s}`).toBeDefined();
          expect(text, `${k}@${s}`).toContain(fmt(z!));
        }
      }
    }
  });

  it('Nicht vermögensrechtlich: Von/Bis der Tarifquelle stehen im angezeigten Text', () => {
    for (const k of KANTONE) {
      const text = ZUSTAENDIGKEIT_KOSTEN[k].nichtVermoegensrechtlich!.text;
      const regel = GERICHTSKOSTEN_NV[k].regel;
      if (regel.typ !== 'rahmen') continue; // SH: formel_extern, ohne Zahlenrahmen
      expect(text, k).toContain(fmt(regel.bisChf));
      if (regel.vonChf > 0) expect(text, k).toContain(fmt(regel.vonChf));
    }
  });

  it('Erlass-Angabe trägt die Erlassnummer der Tarifquelle (Schlichtung, Gericht, nicht vermögensrechtlich)', () => {
    for (const k of KANTONE) {
      expect(ZUSTAENDIGKEIT_KOSTEN[k].schlichtung.erlass, k).toContain(SCHLICHTUNG[k].erlassNr);
      expect(ZUSTAENDIGKEIT_KOSTEN[k].gericht.erlass, k).toContain(GERICHTSKOSTEN[k].erlassNr);
      expect(ZUSTAENDIGKEIT_KOSTEN[k].nichtVermoegensrechtlich!.erlass, k).toContain(GERICHTSKOSTEN_NV[k].erlassNr);
    }
  });

  it("Format: keine französische «de N à M francs»-Form und kein typografischer Tausenderstrich", () => {
    for (const k of KANTONE) {
      const e = ZUSTAENDIGKEIT_KOSTEN[k];
      for (const r of [e.schlichtung, e.gericht, e.nichtVermoegensrechtlich!]) {
        expect(r.text, k).not.toMatch(/\bde\s+\d[\d' ]*\s+à\s+\d/);
        expect(r.text, k).not.toContain('’');
      }
    }
  });
});
