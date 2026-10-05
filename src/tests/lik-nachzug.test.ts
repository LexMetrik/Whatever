// Bot-Tor «nur Anfügung» des LIK-Nachzugs (scripts/lik/vergleich-kern.ts, MONITOR 5.10.2026).
// Ein geänderter Bestandswert ist rechtsrelevant (Indexmieten) — er darf nie als
// normaler Nachzug-PR durchgehen, sondern nur als Entwurf mit Begründung.
import { describe, expect, it } from 'vitest';
import { LIK_REIHEN } from '../data/likReihe';
import { vergleicheLik, belegMarkdown, type Reihen } from '../../scripts/lik/vergleich-kern';

const kopie = (r: Reihen): Reihen => JSON.parse(JSON.stringify(r)) as Reihen;
/** XLSX-Sicht = generierte Reihe plus die bewusst nicht übernommenen Altbasen. */
const xlsxVon = (r: Reihen): Reihen => ({ ...kopie(r), '1914-06': { '2026-01': 999.1 }, '1939-08': {} });

const ALT: Reihen = {
  '2020-12': { '2026-06': 108.1, '2026-07': 108.3 },
  '2025-12': { '2026-06': 101.0, '2026-07': 101.2 },
};
const mitAnfuegung = (): Reihen => {
  const n = kopie(ALT);
  n['2020-12']['2026-08'] = 108.4;
  n['2025-12']['2026-08'] = 101.4;
  return n;
};

describe('LIK-Nachzug: Bot-Tor «nur Anfügung»', () => {
  it('keine neuen Werte ⇒ status keine (kein PR)', () => {
    const v = vergleicheLik(ALT, kopie(ALT), xlsxVon(ALT));
    expect(v.status).toBe('keine');
    expect(v.gruende).toEqual([]);
    expect(v.gegenlesung.geprueft).toBe(4);
  });

  it('reine Anfügung am Reihenende ⇒ status anfuegung', () => {
    const neu = mitAnfuegung();
    const v = vergleicheLik(ALT, neu, xlsxVon(neu));
    expect(v.status).toBe('anfuegung');
    expect(v.angefuegt.map((w) => `${w.basis}:${w.monat}`)).toEqual(['2020-12:2026-08', '2025-12:2026-08']);
    expect(belegMarkdown(v, xlsxVon(neu))).toContain('| 2020-12 | 2026-08 | 108.4 | 108.4 |');
  });

  it('geänderter Bestandswert ⇒ pruefen (Entwurf), auch neben Anfügungen', () => {
    const neu = mitAnfuegung();
    neu['2020-12']['2026-06'] = 108.2;
    const v = vergleicheLik(ALT, neu, xlsxVon(neu));
    expect(v.status).toBe('pruefen');
    expect(v.geaendert).toEqual([{ basis: '2020-12', monat: '2026-06', alt: 108.1, neu: 108.2 }]);
    expect(belegMarkdown(v, xlsxVon(neu))).toContain('rechtsrelevant für Indexmieten');
  });

  it('entfernter Bestandswert ⇒ pruefen', () => {
    const neu = mitAnfuegung();
    delete neu['2025-12']['2026-06'];
    expect(vergleicheLik(ALT, neu, xlsxVon(neu)).entfernt).toHaveLength(1);
    expect(vergleicheLik(ALT, neu, xlsxVon(neu)).status).toBe('pruefen');
  });

  it('Wert vor dem Reihenende eingefügt ⇒ pruefen', () => {
    const neu = kopie(ALT);
    neu['2020-12']['2026-05'] = 107.9;
    const v = vergleicheLik(ALT, neu, xlsxVon(neu));
    expect(v.eingefuegt).toHaveLength(1);
    expect(v.status).toBe('pruefen');
  });

  it('Lücke zwischen Reihenende und neuem Monat ⇒ pruefen (auch über den Jahreswechsel gezählt)', () => {
    const alt: Reihen = { '2025-12': { '2026-11': 101.9, '2026-12': 102.0 } };
    const lueckenlos: Reihen = { '2025-12': { ...alt['2025-12'], '2027-01': 102.1 } };
    expect(vergleicheLik(alt, lueckenlos, xlsxVon(lueckenlos)).status).toBe('anfuegung');
    const mitLuecke: Reihen = { '2025-12': { ...alt['2025-12'], '2027-02': 102.3 } };
    const v = vergleicheLik(alt, mitLuecke, xlsxVon(mitLuecke));
    expect(v.luecken).toEqual([{ basis: '2025-12', erwartet: '2027-01', gefunden: '2027-02' }]);
    expect(v.status).toBe('pruefen');
  });

  it('Abweichung Generator ↔ Neu-Einlesung ⇒ pruefen', () => {
    const neu = mitAnfuegung();
    const xlsx = xlsxVon(neu);
    xlsx['2025-12']['2026-08'] = 101.5;
    const v = vergleicheLik(ALT, neu, xlsx);
    expect(v.gegenlesung.abweichungen).toEqual([{ basis: '2025-12', monat: '2026-08', generator: 101.4, xlsx: 101.5 }]);
    expect(v.status).toBe('pruefen');
  });

  it('XLSX trägt eine dem Generator unbekannte Basis (Rebasierung) ⇒ pruefen; Altbasen 1914/1939 nicht', () => {
    const neu = mitAnfuegung();
    expect(vergleicheLik(ALT, neu, xlsxVon(neu)).gegenlesung.unbekannteBasen).toEqual([]);
    const v = vergleicheLik(ALT, neu, { ...xlsxVon(neu), '2030-12': { '2031-01': 100 } });
    expect(v.gegenlesung.unbekannteBasen).toEqual(['2030-12']);
    expect(v.status).toBe('pruefen');
  });

  it('neue oder entfallene Basis in der generierten Reihe ⇒ pruefen', () => {
    const neu = { ...mitAnfuegung(), '2030-12': { '2031-01': 100 } };
    expect(vergleicheLik(ALT, neu, xlsxVon(neu)).neueBasen).toEqual(['2030-12']);
    const ohne = kopie(ALT);
    delete ohne['2025-12'];
    expect(vergleicheLik(ALT, ohne, xlsxVon(ohne)).status).toBe('pruefen');
  });

  it('echte Reihe: unverändert ⇒ keine; ein Monat angehängt ⇒ anfuegung; ein Bestandswert geändert ⇒ pruefen', () => {
    const alt = kopie(LIK_REIHEN);
    expect(vergleicheLik(alt, kopie(alt), xlsxVon(alt)).status).toBe('keine');
    const neu = kopie(alt);
    for (const basis of Object.keys(neu)) neu[basis]['2099-01'] = 200;
    // '2099-01' folgt nicht lückenlos — der Monat direkt nach dem Reihenende ist zu nehmen:
    const echt = kopie(alt);
    for (const basis of Object.keys(echt)) {
      const ende = Object.keys(echt[basis]).sort().at(-1)!;
      const [j, m] = ende.split('-').map(Number);
      echt[basis][m === 12 ? `${j + 1}-01` : `${j}-${String(m + 1).padStart(2, '0')}`] = 150;
    }
    expect(vergleicheLik(alt, echt, xlsxVon(echt)).status).toBe('anfuegung');
    expect(vergleicheLik(alt, neu, xlsxVon(neu)).status).toBe('pruefen');
    const geaendert = kopie(echt);
    geaendert['2020-12']['2024-01'] += 0.1;
    expect(vergleicheLik(alt, geaendert, xlsxVon(geaendert)).status).toBe('pruefen');
  });
});
