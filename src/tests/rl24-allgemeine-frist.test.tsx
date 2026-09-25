// ─── RL-24 · Allgemeine Frist / Tagerechner (W2·30-RL-W2A) ──────────────────
//
// Prüfung Rechtslogik 23.9.2026, Befunde F1-02, F1-06, F1-07, R5-06, UI-07,
// UI-08, VS3-08 (S3f-7: Kommentar, kein Test). Soll-Fälle von Hand hergeleitet:
//
// F1-02 (Art. 78 Abs. 1 OR; Fedlex SR 220, Snapshot public/normtext/bund/OR.json,
//   Stand 1.1.2026): Di 22.7.2025 + 10 Tage → Tag 10 = Fr 1.8.2025 (Bundesfeier,
//   in allen Kantonen Feiertag). Vertragsfrist: nur Sonntag und staatlich
//   anerkannter Feiertag verschieben → Sa 2.8.2025. Gesetzliche/behördliche
//   Frist: zusätzlich Samstag (SR 173.110.3) → Sa 2.8. + So 3.8. → Mo 4.8.2025.
// F1-06 (Konvention der Engine: volle Frist zwischen Handlung und Stichtag,
//   also spätester X mit X + Frist < Stichtag): 31.3.2026 − 1 Monat → 28.2.2026
//   (28.2. + 1 Mt = 28.3. < 31.3.; 1.3. + 1 Mt = 1.4. ≥ 31.3.). Heute 27.2.
// F1-07: 2026-02-30 ist kein Kalendertag → kontrollierte Meldung statt
//   date-fns «Invalid time value».
// VS3-08 (Art. 142 Abs. 1bis ZPO, amtliche Fassung 1.7.2026): gewöhnliche Post
//   Fr 1.8.2025 ohne Kanton → der 1. August ist in allen Kantonen Feiertag →
//   Mo 4.8.2025 (bisher 1.8.2025).
// R5-06 (Art. 546 Abs. 1 OR): Zugang 1.2.2026 + 6 Monate → Auflösungstermin
//   Sa 1.8.2026, keine Werktagsverschiebung (bisher 3.8.2026).
// UI-08 (Art. 7 ZGB i.V.m. Art. 78 OR; ZGB-Snapshot Stand 1.7.2026): Ausschlagung
//   Kenntnis 1.5.2026 + 3 Mt = Sa 1.8.2026 → verschoben auf Mo 3.8.2026; die
//   Analogie wird als Annahme offengelegt, die sichere Variante (1.8.) genannt.
// UI-07 (Entscheid W-12 (c), David 24.9.2026): Ferien-Wahl als Pflichtwahl ohne
//   Voreinstellung — ohne Wahl kein Fristende.
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import {
  berechneAllgemeineFrist, allgemeineFristErgebnis, berechneRueckwaertsFrist, zustellHinweis,
  fristQueryKodieren, fristQueryLesen, MECHANIK_PRESETS,
} from '../lib/allgemeineFrist';
import { berechneFrist, zustellfiktion } from '../lib/zpoFristen';
import { FAM_STATUS_PRESETS, famPresetPatch } from '../lib/famStatusPresets';
import { berechneErbFrist } from '../lib/erbFristen';
import { EinfacheFristForm } from '../components/forms/EinfacheFristForm';
import { LocaleProvider } from '../components/locale';

const basis = { start: '2025-07-22', laenge: 10, einheit: 'tage' as const, wochenendeVerschieben: true, feiertageVerschieben: true, kanton: 'ZH' as const };

describe('F1-02 · Vertragsfrist vs. gesetzliche Frist (Art. 78 OR / SR 173.110.3)', () => {
  it('22.7.2025 + 10 T: vertraglich → Sa 2.8.2025, gesetzlich → Mo 4.8.2025', () => {
    expect(berechneAllgemeineFrist({ ...basis, fristart: 'vertraglich' }).endDatumISO).toBe('2025-08-02');
    expect(berechneAllgemeineFrist({ ...basis, fristart: 'gesetzlich' }).endDatumISO).toBe('2025-08-04');
    // Standard bleibt «gesetzlich» (Golden allg:30t/allg:klemm unverändert).
    expect(berechneAllgemeineFrist(basis).endDatumISO).toBe('2025-08-04');
  });

  it('vertraglich: Samstag verschiebt auch im reinen Wochenend-Modus nicht, Sonntag schon', () => {
    // 22.7.2025 + 11 T = Sa 2.8.2025; + 12 T = So 3.8.2025 → Mo 4.8.2025.
    const nurWe = { ...basis, feiertageVerschieben: false, fristart: 'vertraglich' as const };
    expect(berechneAllgemeineFrist({ ...nurWe, laenge: 11 }).endDatumISO).toBe('2025-08-02');
    expect(berechneAllgemeineFrist({ ...nurWe, laenge: 12 }).endDatumISO).toBe('2025-08-04');
  });

  it('vertraglich: Ergebnis legt Art. 78 Abs. 2 OR offen und nennt SR 173.110.3 nicht als Norm', () => {
    const e = allgemeineFristErgebnis({ ...basis, fristart: 'vertraglich' });
    expect(e.normverweise.map((n) => n.artikel).join(' ')).not.toMatch(/173\.110\.3/);
    expect([...e.annahmen, ...e.warnungen].join(' ')).toMatch(/Art\. 78 Abs\. 2 OR/);
  });

  it('Teilen-Link trägt die Fristart; gesetzliche Links bleiben byte-gleich', () => {
    const q = fristQueryKodieren({ ...basis, fristart: 'vertraglich' });
    expect(fristQueryLesen(q)?.fristart).toBe('vertraglich');
    expect(fristQueryKodieren(basis)).toBe('s=2025-07-22&l=10&e=tage&w=1&f=1&k=ZH');
    expect(fristQueryLesen(fristQueryKodieren(basis))?.fristart).toBeUndefined();
  });

  it('Preset-Beschriftung nennt das Regime (nicht mehr «Monatsfrist nach OR»)', () => {
    const p = MECHANIK_PRESETS.find((x) => x.key === 'monatsfrist_or')!;
    expect(p.label).not.toBe('Monatsfrist nach OR');
    expect(p.label).toMatch(/gesetzlich/i);
    expect(p.patch.fristart).toBe('gesetzlich');
  });
});

describe('F1-06 · Rückwärtsrechnung über das Monatsende', () => {
  const rw = (stichtag: string, laenge: number, einheit: 'monate' | 'jahre') =>
    berechneRueckwaertsFrist({ stichtag, laenge, einheit, verschiebung: 'keine' }).endDatumISO;
  it('31.3.2026 − 1 Monat → 28.2.2026', () => expect(rw('2026-03-31', 1, 'monate')).toBe('2026-02-28'));
  it('31.5.2026 − 1 Monat → 30.4.2026', () => expect(rw('2026-05-31', 1, 'monate')).toBe('2026-04-30'));
  it('29.2.2028 − 1 Jahr → 28.2.2027', () => expect(rw('2028-02-29', 1, 'jahre')).toBe('2027-02-28'));
  it('ohne Klemmung unverändert: 30.6.2026 − 3 Monate → 29.3.2026; 1.3.2026 − 1 Monat → 31.1.2026', () => {
    expect(rw('2026-06-30', 3, 'monate')).toBe('2026-03-29');
    expect(rw('2026-03-01', 1, 'monate')).toBe('2026-01-31');
  });
});

describe('F1-07 · ungültiges Datum → kontrollierte Meldung (ZPO)', () => {
  it('berechneFrist und zustellfiktion melden «Ungültiges … Datum» statt RangeError', () => {
    expect(() => berechneFrist({ ereignis: '2026-02-30', einheit: 'tage', laenge: 10, verfahren: 'ordentlich', kanton: 'ZH', fristnatur: 'gesetzlich' }))
      .toThrow(/Ungültig/);
    expect(() => zustellfiktion('2026-02-30')).toThrow(/Ungültig/);
  });
});

describe('VS3-08 · A-Post Plus ohne Kanton (Art. 142 Abs. 1bis ZPO)', () => {
  it('Fr 1.8.2025 ohne Kanton → Mo 4.8.2025 (Bundesfeier überall Feiertag), mit Hinweis auf den Kanton', () => {
    const z = zustellHinweis('apostplus', '2025-08-01');
    expect(z.vorschlagISO).toBe('2025-08-04');
    expect(z.hinweise.join(' ')).toMatch(/Kanton/);
    expect(zustellHinweis('apostplus', '2025-08-01', 'ZH').vorschlagISO).toBe('2025-08-04');
  });
});

describe('R5-06 · Kündigung einfache Gesellschaft: Auflösungstermin ohne Verschiebung', () => {
  it('Preset schaltet die Verschiebung aus; 1.2.2026 + 6 Mt → Sa 1.8.2026', () => {
    const p = FAM_STATUS_PRESETS.find((x) => x.key === 'einfache_gesellschaft')!;
    const patch = famPresetPatch(p);
    expect(patch).toMatchObject({ laenge: 6, einheit: 'monate', wochenendeVerschieben: false, feiertageVerschieben: false });
    expect(berechneAllgemeineFrist({ start: '2026-02-01', kanton: 'ZH', ...patch }).endDatumISO).toBe('2026-08-01');
    expect(p.info).toMatch(/Auflösungstermin/);
  });
  it('die übrigen Fach-Presets verschieben weiterhin (gesetzliche Fristen)', () => {
    for (const p of FAM_STATUS_PRESETS.filter((x) => x.key !== 'einfache_gesellschaft')) {
      expect(famPresetPatch(p), p.key).toMatchObject({ wochenendeVerschieben: true, feiertageVerschieben: true });
    }
  });
});

describe('UI-08 · Erb-Fristen: Werktagsverschiebung als Annahme offengelegt', () => {
  it('Ausschlagung 1.5.2026 + 3 Mt → 3.8.2026 verschoben; Annahme Art. 7 ZGB / Art. 78 OR, sichere Variante 01.08.2026', () => {
    const r = berechneErbFrist({ key: 'ausschlagung_gesetzlich', trigger: '2026-05-01', werktagsVerschiebung: true, kanton: 'ZH' });
    expect(r.resultat.endDatumISO).toBe('2026-08-03');
    expect(r.annahmen.join(' ')).toMatch(/Art\. 7 ZGB/);
    expect(r.annahmen.join(' ')).toMatch(/Art\. 78 OR/);
    expect(r.warnungen.join(' ')).toMatch(/01\.08\.2026/);
  });
  it('ohne Verschiebung: keine Verschiebe-Annahme, Ende 1.8.2026', () => {
    const r = berechneErbFrist({ key: 'ausschlagung_gesetzlich', trigger: '2026-05-01' });
    expect(r.resultat.endDatumISO).toBe('2026-08-01');
    expect(r.annahmen.join(' ')).not.toMatch(/Art\. 7 ZGB/);
  });
});

describe('UI-07 · Tagerechner: Ferien-Wahl ohne Voreinstellung (W-12 c)', () => {
  const render = (props: Parameters<typeof EinfacheFristForm>[0] = {}) => renderToString(
    <MemoryRouter><LocaleProvider><EinfacheFristForm {...props} /></LocaleProvider></MemoryRouter>,
  );
  it('Voll-Variante: kein Regime vorgewählt, kein Fristende vor der Wahl', () => {
    const html = render();
    expect(html).not.toMatch(/name="einfache-frist-ferien"[^>]*checked/);
    expect(html).not.toContain('id="lc-ergebnis-einfach"');
    expect(html).toMatch(/Ferien\/Stillstand wählen/);
  });
  it('knappe Variante (Startseite): Auswahlfeld steht auf «– wählen –»', () => {
    const html = render({ minimal: true });
    expect(html).toMatch(/<option value="" selected="">– wählen –<\/option>/);
    expect(html).not.toContain('id="lc-ergebnis-einfach"');
  });
});
