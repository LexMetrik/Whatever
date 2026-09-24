// ─── RL-19 · SchKG Hemmung/Validierung (W2·30-RL-W2A) ────────────────────────
//
// Prüfung Rechtslogik 23.9.2026, Befunde F2-05, F2-06, F2-07 (Bündel A-B3c).
//
// Wortlaut (amtliche Kopie SR 281.1, Konsolidierung 1.1.2026, abgerufen
// 24.9.2026 — Live-Abruf Fedlex zeitweise nicht erreichbar):
//   https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/11/529_488_529/20260101/…-de-xml
//   · Art. 56 Abs. 1 Ziff. 2 SchKG: «… in der Wechselbetreibung gibt es keine
//     Betreibungsferien»; Ziff. 3: keine Betreibungshandlungen «gegen einen
//     Schuldner, dem der Rechtsstillstand (Art. 57–62) gewährt ist» — der
//     Ausschluss in Ziff. 2 erfasst NUR die Ferien.
//   · Art. 63 SchKG: Fällt das Ende einer Frist «in die Zeit der
//     Betreibungsferien oder des Rechtsstillstandes», wird sie «bis zum
//     dritten Tag nach deren Ende verlängert» (Sa/So/Feiertage zählen nicht).
//   · Art. 154 Abs. 1 Satz 2 SchKG: «Ist Rechtsvorschlag erhoben worden, so
//     stehen diese Fristen zwischen der Einleitung und der Erledigung eines
//     dadurch veranlassten gerichtlichen Verfahrens still.» — «diese Fristen»
//     = frühestens UND spätestens (Satz 1).
//   · Art. 188 Abs. 2 Satz 2 SchKG (nicht Abs. 3 wie im Befund zitiert — Art.
//     188 hat zwei Absätze): «… so fällt die Zeit zwischen der Eingabe
//     desselben und dem Entscheid über dessen Bewilligung sowie, im Falle der
//     Bewilligung, die Zeit zwischen der Anhebung und der gerichtlichen
//     Erledigung der Klage nicht in Berechnung.» — ZWEI Zeiträume; die Spanne
//     zwischen Bewilligungsentscheid und Klageanhebung läuft mit.
//   · Art. 116 Abs. 1 SchKG (Verwertung nach Pfändung) kennt KEINEN Stillstand
//     — anders als Art. 88 Abs. 2, 154 Abs. 1, 166 Abs. 2, 188 Abs. 2.
//
// Soll-Fälle von Hand (Kanton ZH):
//   F2-05 · Rechtsvorschlag Wechsel (Art. 179 Abs. 1), ZB Mo 13.7.2026, 5 Tage
//       → Tag 5 = Sa 18.7.2026; Rechtsstillstand 15.–25.7.2026 → Ende im
//       Rechtsstillstand → 3. Werktag nach Sa 25.7.: Mo 27. (1), Di 28. (2),
//       Mi 29.7. (3) → 29.07.2026 (bisher 20.07.2026: RS nur als Warnung).
//       Ohne RS: Sa 18.7. → Mo 20.07.2026 (Sommer-Betreibungsferien 15.–31.7.
//       gelten in der Wechselbetreibung nicht).
//     Konkursbegehren Wechsel (Art. 188 Abs. 2 Satz 1), ZB Fr 19.6.2026,
//       1 Monat → So 19.7.2026; RS 13.–24.7.2026 → 3. Werktag nach Fr 24.7.:
//       27./28./29.7. → 29.07.2026; ohne RS → Mo 20.07.2026.
//   F2-06 · Pfandverwertung Faustpfand (Art. 154 Abs. 1), ZB Mo 2.3.2026:
//       spätestens 1 Jahr → Di 2.3.2027; Stillstand 1.4.–15.5.2026 (45 Tage,
//       beginnt im Lauf) → 2.3.2027 + 45 = Fr 16.04.2027 (Osterferien 2027
//       21.3.–4.4. vorbei).
//       frühestens 1 Monat, ZB Mo 4.5.2026 → Ablauf Do 4.6.2026, frühestens
//       Fr 05.06.2026; Stillstand 11.–20.5.2026 (10 Tage) → Ablauf So 14.6.,
//       frühestens Mo 15.06.2026.
//     Konkursbegehren Wechsel (Art. 188 Abs. 2 Satz 2), ZB Mo 2.3.2026, 1 Monat
//       → Do 2.4.2026. Zeitraum 1: Eingabe RV 5.3. bis Bewilligung 13.3.2026
//       (9 Tage) → Sa 11.4.2026; Zeitraum 2: Klage angehoben 1.4. bis erledigt
//       30.6.2026 (91 Tage, beginnt vor dem 11.4. → im Lauf) → Sa 11.7.2026
//       → Mo 13.07.2026 (Art. 142 Abs. 3 ZPO). Nur Zeitraum 1 → Sa 11.4. →
//       Mo 13.04.2026. EIN Fenster 5.3.–30.6. (118 Tage) gäbe Mi 29.7.2026 —
//       16 Tage zu spät, die Spanne 14.3.–31.3. läuft nach Art. 188 mit.
//   F2-07 · Ereignis 30.2.2026 → Nutzertext statt «Invalid time value»;
//       vertauschte Von/Bis bei Hemmung und Rechtsstillstand → Meldung statt
//       stillem Übergehen.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { PRESETS_SCHKG } from '../lib/schkgPresets';
import { berechneSchkgFrist } from '../lib/schkgFristen';
import type { SchkgInput } from '../types/schkg';
import { SchkgFristenForm } from '../components/forms/SchkgFristenForm';
import { LocaleProvider } from '../components/locale';

const preset = (key: string) => {
  const p = PRESETS_SCHKG.find((x) => x.key === key);
  if (!p) throw new Error(`SchKG-Preset fehlt: ${key}`);
  return p;
};

// Einzel- oder Teilfrist eines Presets als Engine-Eingabe (Regime, Auslöser
// und Hemmungs-Norm aus dem Preset — so rechnet das Formular).
const ausPreset = (
  key: string,
  teil: 'einzel' | 'wartefrist' | 'verwirkung',
  extra: Partial<SchkgInput> = {},
): SchkgInput => {
  const p = preset(key);
  const spec = teil === 'einzel' ? { einheit: p.einheit!, laenge: p.laenge! } : p[teil]!;
  return {
    ereignis: '2026-03-02', einheit: spec.einheit, laenge: spec.laenge, modus: p.modus,
    fristnatur: teil === 'einzel' ? p.fristnatur : teil, kanton: 'ZH', ausloeser: p.ausloeser,
    hemmungNorm: p.hemmungNorm, ...extra,
  };
};

const leer = (html: string) => html.replace(/<!-- -->/g, '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"');

function renderSchkg(search: string): string {
  vi.stubGlobal('window', { location: { search, hash: '', pathname: '/rechner/schkg-fristen', origin: 'https://lexmetrik.ch' } });
  return leer(renderToString(
    <MemoryRouter initialEntries={['/rechner/schkg-fristen' + search]}>
      <LocaleProvider><SchkgFristenForm /></LocaleProvider>
    </MemoryRouter>,
  ));
}

afterEach(() => { vi.unstubAllGlobals(); });

// ─── F2-05 · Wechselbetreibung: keine Ferien, aber Rechtsstillstand ─────────
describe('F2-05 · Wechselbetreibung: Rechtsstillstand verlängert nach Art. 63 SchKG', () => {
  const rs = { rechtsstillstandVon: '2026-07-15', rechtsstillstandBis: '2026-07-25' };

  it('Rechtsvorschlag Wechsel, ZB 13.7.2026, RS 15.–25.7.2026 → 29.07.2026', () => {
    const r = berechneSchkgFrist(ausPreset('rechtsvorschlag_wechsel', 'einzel', { ereignis: '2026-07-13', ...rs }));
    expect(r.diesAdQuem).toBe('29.07.2026');
    expect(r.warnungen.some((w) => w.includes('unberücksichtigt'))).toBe(false);
  });

  it('ohne Rechtsstillstand: keine Betreibungsferien → Mo 20.07.2026', () => {
    const r = berechneSchkgFrist(ausPreset('rechtsvorschlag_wechsel', 'einzel', { ereignis: '2026-07-13' }));
    expect(r.diesAdQuem).toBe('20.07.2026');
    expect(r.warnungen.some((w) => w.includes('Betreibungsferien (Art. 56 SchKG) – NICHT identisch'))).toBe(false);
  });

  it('Regression B2 (6.6.2026): 5 Tage ab 25.07.2025 → 30.07.2025 (keine Sommerferien)', () => {
    const r = berechneSchkgFrist(ausPreset('rechtsvorschlag_wechsel', 'einzel', { ereignis: '2025-07-25' }));
    expect(r.diesAdQuem).toBe('30.07.2025');
  });

  it('Konkursbegehren Wechsel, ZB 19.6.2026, RS 13.–24.7.2026 → 29.07.2026; ohne RS 20.07.2026', () => {
    const mit = berechneSchkgFrist(ausPreset('konkursbegehren_wechsel', 'einzel', {
      ereignis: '2026-06-19', rechtsstillstandVon: '2026-07-13', rechtsstillstandBis: '2026-07-24',
    }));
    expect(mit.diesAdQuem).toBe('29.07.2026');
    const ohne = berechneSchkgFrist(ausPreset('konkursbegehren_wechsel', 'einzel', { ereignis: '2026-06-19' }));
    expect(ohne.diesAdQuem).toBe('20.07.2026');
  });

  it('Rechenweg und Normen nennen Art. 56 Abs. 1 Ziff. 2/3 und Art. 63 SchKG', () => {
    const r = berechneSchkgFrist(ausPreset('rechtsvorschlag_wechsel', 'einzel', { ereignis: '2026-07-13', ...rs }));
    expect(r.normverweise.map((n) => n.artikel)).toContain('Art. 63 SchKG');
    expect(r.annahmen.join(' ')).toMatch(/Wechselbetreibung/);
  });

  it('Beschwerde Wechsel (Art. 20): Voreinstellung «nein» ohne Art. 63; Schalter «ja» → 29.07.2026', () => {
    const p = preset('beschwerde_wechsel');
    expect(p.modus).toBe('kein');
    expect(p.modusBeiBetreibungshandlung).toBe('schkg_wechsel');
    const nein = berechneSchkgFrist(ausPreset('beschwerde_wechsel', 'einzel', { ereignis: '2026-07-13', ...rs }));
    expect(nein.diesAdQuem).toBe('20.07.2026');
    const ja = berechneSchkgFrist(ausPreset('beschwerde_wechsel', 'einzel', { ereignis: '2026-07-13', modus: p.modusBeiBetreibungshandlung!, ...rs }));
    expect(ja.diesAdQuem).toBe('29.07.2026');
  });

  it('Formular: Preset Rechtsvorschlag Wechsel mit RS im Link → 29.07.2026', () => {
    const p = preset('rechtsvorschlag_wechsel');
    const html = renderSchkg(`?p=rechtsvorschlag_wechsel&ph=einleitung&e=2026-07-13&u=tage&l=5&m=${p.modus}&n=frist&k=ZH&ra=1&rv=2026-07-15&rb=2026-07-25`);
    expect(html).toMatch(/29\.07\.2026/);
  });
});

// ─── F2-06 · Stillstand Art. 154 Abs. 1 / Art. 188 Abs. 2 SchKG ────────────
describe('F2-06 · Hemmung in der Pfandverwertung (Art. 154) und der Wechselbetreibung (Art. 188)', () => {
  it('Pfandverwertungs-Presets und Konkursbegehren Wechsel erlauben die Hemmung, mit eigener Norm', () => {
    expect(preset('pfandverwertung_faust').hemmungMoeglich).toBe(true);
    expect(preset('pfandverwertung_grund').hemmungMoeglich).toBe(true);
    expect(preset('konkursbegehren_wechsel').hemmungMoeglich).toBe(true);
    expect(preset('pfandverwertung_faust').hemmungNorm).toBe('art154');
    expect(preset('pfandverwertung_grund').hemmungNorm).toBe('art154');
    expect(preset('konkursbegehren_wechsel').hemmungNorm).toBe('art188');
  });

  it('§7: Art. 116 Abs. 1 SchKG kennt keinen Stillstand — Verwertung nach Pfändung ohne Hemmung', () => {
    expect(preset('verwertung_beweglich').hemmungMoeglich).toBeFalsy();
    expect(preset('verwertung_grundstueck').hemmungMoeglich).toBeFalsy();
  });

  it('Faustpfand spätestens: ZB 2.3.2026, Stillstand 1.4.–15.5.2026 → 16.04.2027 (ohne: 02.03.2027)', () => {
    const ohne = berechneSchkgFrist(ausPreset('pfandverwertung_faust', 'verwirkung'));
    expect(ohne.diesAdQuem).toBe('02.03.2027');
    const mit = berechneSchkgFrist(ausPreset('pfandverwertung_faust', 'verwirkung', { hemmungVon: '2026-04-01', hemmungBis: '2026-05-15' }));
    expect(mit.diesAdQuem).toBe('16.04.2027');
    const schritt = mit.rechenweg.find((s) => /Stillstand/.test(s.beschreibung));
    expect(schritt?.normen?.map((n) => n.artikel)).toEqual(['Art. 154 Abs. 1 SchKG']);
  });

  it('Faustpfand frühestens: Art. 154 Abs. 1 «diese Fristen» — auch die Wartefrist steht still (05.06. → 15.06.2026)', () => {
    const ohne = berechneSchkgFrist(ausPreset('pfandverwertung_faust', 'wartefrist', { ereignis: '2026-05-04' }));
    expect(ohne.diesAdQuem).toBe('05.06.2026');
    const mit = berechneSchkgFrist(ausPreset('pfandverwertung_faust', 'wartefrist', { ereignis: '2026-05-04', hemmungVon: '2026-05-11', hemmungBis: '2026-05-20' }));
    expect(mit.diesAdQuem).toBe('15.06.2026');
  });

  it('Konkursbegehren Wechsel: zwei Zeiträume (Art. 188 Abs. 2 Satz 2) → 13.07.2026; nur Zeitraum 1 → 13.04.2026', () => {
    const zwei = berechneSchkgFrist(ausPreset('konkursbegehren_wechsel', 'einzel', {
      hemmungVon: '2026-03-05', hemmungBis: '2026-03-13', hemmung2Von: '2026-04-01', hemmung2Bis: '2026-06-30',
    }));
    expect(zwei.diesAdQuem).toBe('13.07.2026');
    const eins = berechneSchkgFrist(ausPreset('konkursbegehren_wechsel', 'einzel', { hemmungVon: '2026-03-05', hemmungBis: '2026-03-13' }));
    expect(eins.diesAdQuem).toBe('13.04.2026');
    const schritt = zwei.rechenweg.find((s) => /Stillstand/.test(s.beschreibung));
    expect(schritt?.normen?.map((n) => n.artikel)).toEqual(['Art. 188 Abs. 2 SchKG']);
  });

  it('Formular: Faustpfand zeigt die Hemmung mit Art. 154 Abs. 1 und rechnet sie ein', () => {
    const html = renderSchkg('?p=pfandverwertung_faust&ph=verwertung&e=2026-03-02&m=schkg_betreibungsferien&n=verwirkung&k=ZH&ha=1&hv=2026-04-01&hb=2026-05-15');
    expect(html).toMatch(/Art\. 154 Abs\. 1/);
    expect(html).toMatch(/16\.04\.2027/);
  });

  it('Formular: Faustpfand-Wartefrist rechnet den Stillstand ebenfalls ein → frühestens 15.06.2026', () => {
    const html = renderSchkg('?p=pfandverwertung_faust&ph=verwertung&e=2026-05-04&m=schkg_betreibungsferien&n=verwirkung&k=ZH&ha=1&hv=2026-05-11&hb=2026-05-20');
    expect(html).toMatch(/15\.06\.2026/);
    expect(html).not.toMatch(/05\.06\.2026/);
  });

  it('Formular: Preset ohne Hemmungsrecht (Art. 116) ignoriert eine Hemmung aus dem Link', () => {
    const html = renderSchkg('?p=verwertung_beweglich&ph=verwertung&e=2026-03-02&m=schkg_betreibungsferien&n=verwirkung&k=ZH&ha=1&hv=2026-04-01&hb=2026-05-15');
    expect(html).toMatch(/02\.03\.2027/);
    expect(html).not.toMatch(/16\.04\.2027/);
  });

  it('Formular: Konkursbegehren Wechsel mit zwei Zeiträumen aus dem Link → 13.07.2026', () => {
    const p = preset('konkursbegehren_wechsel');
    const html = renderSchkg(`?p=konkursbegehren_wechsel&ph=konkurs&e=2026-03-02&u=monate&l=1&m=${p.modus}&n=verwirkung&k=ZH&ha=1&hv=2026-03-05&hb=2026-03-13&h2v=2026-04-01&h2b=2026-06-30`);
    expect(html).toMatch(/Art\. 188 Abs\. 2/);
    expect(html).toMatch(/13\.07\.2026/);
  });

  it('Gegenprobe: Fortsetzungsbegehren behält Art. 88 Abs. 2 / 166 Abs. 2 (Bestand unverändert)', () => {
    const r = berechneSchkgFrist({
      ereignis: '2025-01-15', einheit: 'monate', laenge: 15, modus: 'schkg_betreibungsferien', fristnatur: 'verwirkung',
      kanton: 'ZH', hemmungVon: '2025-03-01', hemmungBis: '2025-03-31',
    });
    const schritt = r.rechenweg.find((s) => /Stillstand/.test(s.beschreibung));
    expect(schritt?.normen?.map((n) => n.artikel)).toEqual(['Art. 88 Abs. 2 SchKG', 'Art. 166 Abs. 2 SchKG']);
  });
});

// ─── F2-07 · Datums- und Reihenfolgeprüfung ────────────────────────────────
describe('F2-07 · ungültige Daten und vertauschte Zeiträume werden gemeldet', () => {
  const basis: SchkgInput = { ereignis: '2026-03-10', einheit: 'tage', laenge: 10, modus: 'schkg_betreibungsferien', fristnatur: 'frist', kanton: 'ZH' };

  it('Ereignis 30.2.2026 → Nutzertext, kein «Invalid time value»', () => {
    expect(() => berechneSchkgFrist({ ...basis, ereignis: '2026-02-30' })).toThrow(/Ereignis.*kein gültiges Datum/);
  });

  it('Rechtsstillstand bis vor von → Meldung', () => {
    expect(() => berechneSchkgFrist({ ...basis, rechtsstillstandVon: '2026-03-25', rechtsstillstandBis: '2026-03-15' }))
      .toThrow(/Rechtsstillstand.*vor dem Beginn/);
  });

  it('Hemmung bis vor von → Meldung', () => {
    expect(() => berechneSchkgFrist({ ...basis, fristnatur: 'verwirkung', hemmungVon: '2026-03-25', hemmungBis: '2026-03-15' }))
      .toThrow(/Stillstand.*vor dem Beginn/);
  });

  it('Ungültiges Datum im Rechtsstillstand → Meldung', () => {
    expect(() => berechneSchkgFrist({ ...basis, rechtsstillstandVon: '2026-13-01', rechtsstillstandBis: '2026-03-15' }))
      .toThrow(/Rechtsstillstand.*kein gültiges Datum/);
  });

  it('Gegenprobe: eintägiger Zeitraum (von = bis) ist gültig', () => {
    expect(() => berechneSchkgFrist({ ...basis, rechtsstillstandVon: '2026-03-15', rechtsstillstandBis: '2026-03-15' })).not.toThrow();
  });

  // Die Meldung selbst zeigt die FehlerBox erst nach der ersten Eingabe
  // (BeruehrtRahmen, «kein Eingabefehler vor der ersten Eingabe») — im
  // Server-Render prüfbar ist, dass kein Ergebnis mit dem vertauschten
  // Zeitraum erscheint; den Text belegen die Engine-Fälle oben.
  it('Formular: vertauschter Rechtsstillstand ergibt kein Ergebnis', () => {
    const html = renderSchkg('?e=2026-03-10&u=tage&l=10&m=schkg_betreibungsferien&n=frist&k=ZH&ra=1&rv=2026-03-25&rb=2026-03-15');
    expect(html).not.toMatch(/Fristende \(dies ad quem\)/);
    const gegenprobe = renderSchkg('?e=2026-03-10&u=tage&l=10&m=schkg_betreibungsferien&n=frist&k=ZH&ra=1&rv=2026-03-15&rb=2026-03-25');
    expect(gegenprobe).toMatch(/Fristende \(dies ad quem\)/);
  });
});
