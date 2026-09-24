// ─── RL-17 · SchKG Art. 63 Rest (W2·30-RL-W2A) ───────────────────────────────
//
// Prüfung Rechtslogik 23.9.2026, Befunde F2-02, F2-08/R1-07, F2-09, R5-02,
// R5-03, Anker schkgPresets.ts `beschwerde_aufsicht` (A-N5, Q-8); Entscheid
// David W-09 (24.9.2026): Schalter «angefochten ist eine Betreibungshandlung»,
// sichtbar, Voreinstellung «nein».
//
// Wortlaut (amtliche Kopien, abgerufen 24.9.2026, Live-Abruf Fedlex zeitweise
// nicht erreichbar):
//   SR 281.1 (SchKG), Konsolidierung 1.1.2026,
//     https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/11/529_488_529/20260101/…-de-xml
//   SR 272 (ZPO), Konsolidierung 1.7.2026,
//     https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/2010/262/20260701/…-de-xml
//   · Art. 63 SchKG: «Fällt jedoch für den Schuldner, den Gläubiger oder den
//     Dritten das Ende einer Frist in die Zeit der Betreibungsferien …, so wird
//     die Frist bis zum dritten Tag nach deren Ende verlängert.»
//   · Art. 88 Abs. 1 SchKG: Fortsetzungsbegehren «frühestens 20 Tage nach der
//     Zustellung des Zahlungsbefehls», wenn die Betreibung nicht durch
//     Rechtsvorschlag eingestellt ist.
//   · Art. 145 Abs. 4 ZPO (Fassung seit 1.1.2025, AS 2023 491): Satz 1 ZPO-
//     Stillstand für alle SchKG-Klagen vor Gericht; Satz 2 «Sie sind für die
//     Beschwerde vor der Aufsichtsbehörde nicht anwendbar.»
//   · Art. 56 Abs. 2 SchKG (eingefügt 1.1.2025, AS 2023 491): für die Klagen
//     vor Gericht «ausschliesslich» die ZPO-Stillstandsregeln.
//   · Art. 278 Abs. 1 SchKG: Einsprache innert zehn Tagen, «nachdem er von
//     dessen Anordnung Kenntnis erhalten hat».
//   · BGE 149 III 179 E. 4.1 (lokale Korpus-Kopie public/rechtsprechung/bund/
//     bge/149_III_179.json): Art. 63 SchKG setzt eine Betreibungshandlung
//     (Art. 56 SchKG) voraus; Handlungen der Konkursorgane sind keine, «womit
//     die Vorschriften von Art. 56 und 63 SchKG im Konkurs nicht anwendbar sind».
//
// Soll-Fälle von Hand (Kanton ZH; Betreibungsferien Sommer 15.–31.7.,
// Weihnachten 18.12.–1.1.):
//   · Art. 17 SchKG, Kenntnis Fr 10.7.2026, 10 Tage → Tag 10 = Mo 20.7.2026.
//       nein (keine Betreibungshandlung): kein Art. 63 → 20.07.2026.
//       ja: Ende in den Ferien → 3. Werktag nach 31.7. (1.8. Sa/Bundesfeier,
//       2.8. So; 3./4./5.8.) → 05.08.2026.
//   · Art. 239 SchKG, Gläubigerversammlung 10.7.2026, 5 Tage → Mi 15.7.2026
//       (Konkurs, kein Art. 63); bisher 05.08.2026.
//   · Art. 88 Abs. 1 SchKG, ZB 10.7.2026, 20 Tage → Ablauf Do 30.7.2026,
//       frühestens Fr 31.07.2026 (bisher per Art. 63 05.08.2026).
//   · Fristenspiegel Zahlungsbefehl (R1-07): frühestens = der spätere Tag von
//       (Art.-88-Folgetag, Rechtsvorschlagsende + 1):
//       ZB 10.12.2026: RV 20.12. in den Ferien → Mi 6.1.2027; Wartefrist
//       31.12.2026 → Spiegel Do 07.01.2027 (bisher 06.01.2027 = RV-Ende).
//       ZB 10.7.2026: RV → 05.08.2026 → Spiegel Do 06.08.2026.
//       ZB 26.3.2026: RV 5.4. (Ostern) → 15.4.; Wartefrist 16.4. → 16.04.2026.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { PRESETS_SCHKG } from '../lib/schkgPresets';
import { PRESETS as ZPO_PRESETS } from '../lib/zpoPresets';
import { berechneSchkgFrist } from '../lib/schkgFristen';
import { berechneZahlungsbefehlsSpiegel } from '../lib/fristenspiegel/zahlungsbefehl';
import type { SchkgInput } from '../types/schkg';
import { SchkgFristenForm } from '../components/forms/SchkgFristenForm';
import { LocaleProvider } from '../components/locale';

const preset = (key: string) => {
  const p = PRESETS_SCHKG.find((x) => x.key === key);
  if (!p) throw new Error(`SchKG-Preset fehlt: ${key}`);
  return p;
};

const ausPreset = (key: string, extra: Partial<SchkgInput> = {}): SchkgInput => {
  const p = preset(key);
  return {
    ereignis: '2026-07-10', einheit: p.einheit!, laenge: p.laenge!, modus: p.modus,
    fristnatur: p.fristnatur, kanton: 'ZH', ausloeser: p.ausloeser, ...extra,
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

describe('F2-02 / W-09 · Aufsichtsbeschwerde Art. 17 SchKG: Art. 63 nur bei angefochtener Betreibungshandlung', () => {
  it('Voreinstellung «nein»: Preset rechnet ohne Art. 63 → 20.07.2026', () => {
    const p = preset('beschwerde_aufsicht');
    expect(p.modus).toBe('kein');
    expect(berechneSchkgFrist(ausPreset('beschwerde_aufsicht')).diesAdQuem).toBe('20.07.2026');
  });

  it('Schalter «ja»: Regime Betreibungsferien → Art. 63 → 05.08.2026', () => {
    const p = preset('beschwerde_aufsicht');
    expect(p.modusBeiBetreibungshandlung).toBe('schkg_betreibungsferien');
    const r = berechneSchkgFrist(ausPreset('beschwerde_aufsicht', { modus: p.modusBeiBetreibungshandlung! }));
    expect(r.diesAdQuem).toBe('05.08.2026');
  });

  it('Anker Q-8: ZPO-Stillstand ausgeschlossen nach Art. 145 Abs. 4 Satz 2 ZPO (geltende Fassung), Art. 63 an die Betreibungshandlung gebunden', () => {
    const h = preset('beschwerde_aufsicht').hinweis ?? '';
    expect(h).toMatch(/\bArt\. 145 Abs\. 4 Satz 2 ZPO\b/);
    expect(h).toMatch(/\bBGE 149 III 179\b/);
    expect(h).toMatch(/\bBetreibungshandlung\b/);
  });

  it('Formular: Schalter sichtbar, Voreinstellung «nein» → 20.07.2026', () => {
    const html = renderSchkg('?p=beschwerde_aufsicht&ph=rechtsmittel&e=2026-07-10&u=tage&l=10&m=kein&n=beschwerdefrist&k=ZH');
    expect(html).toMatch(/Angefochten ist eine Betreibungshandlung/);
    expect(html).toMatch(/20\.07\.2026/);
    expect(html).not.toMatch(/05\.08\.2026/);
  });

  it('Formular: Schalter «ja» (Regime im Link) → 05.08.2026', () => {
    const html = renderSchkg('?p=beschwerde_aufsicht&ph=rechtsmittel&e=2026-07-10&u=tage&l=10&m=schkg_betreibungsferien&n=beschwerdefrist&k=ZH');
    expect(html).toMatch(/Angefochten ist eine Betreibungshandlung/);
    expect(html).toMatch(/05\.08\.2026/);
  });

  it('Gegenprobe: Presets ohne Schalter zeigen ihn nicht', () => {
    const html = renderSchkg('?p=rechtsvorschlag&ph=einleitung&e=2026-07-10&u=tage&l=10&m=schkg_betreibungsferien&n=frist&k=ZH');
    expect(html).not.toMatch(/Angefochten ist eine Betreibungshandlung/);
  });
});

describe('F2-02 · Art. 239 SchKG: Beschwerde gegen Beschlüsse der Gläubigerversammlung ohne Art. 63', () => {
  it('Konkurs: keine Betreibungshandlung (BGE 149 III 179 E. 4.1) → 15.07.2026', () => {
    const p = preset('anfechtung_glaeubigerversammlung');
    expect(p.modus).toBe('kein');
    expect(p.modusBeiBetreibungshandlung).toBeUndefined();
    expect(p.hinweis ?? '').toMatch(/\bBGE 149 III 179\b/);
    expect(berechneSchkgFrist(ausPreset('anfechtung_glaeubigerversammlung')).diesAdQuem).toBe('15.07.2026');
  });
});

describe('F2-08 · Wartefrist wird durch Art. 63 SchKG nicht hinausgeschoben', () => {
  it('Fortsetzungsbegehren, ZB 10.7.2026: frühestens 31.07.2026 (nicht 05.08.2026)', () => {
    const fb = preset('fortsetzungsbegehren');
    const r = berechneSchkgFrist({
      ereignis: '2026-07-10', einheit: fb.wartefrist!.einheit, laenge: fb.wartefrist!.laenge,
      modus: fb.modus, fristnatur: 'wartefrist', kanton: 'ZH', ausloeser: fb.ausloeser,
    });
    expect(r.diesAdQuem).toBe('31.07.2026');
    // Offenlegung: Art. 63 verlängert keine Wartefrist; Vollzug erst nach den Ferien.
    expect(r.warnungen.join(' ')).toMatch(/\bArt\. 63 SchKG\b[^.]*\bWartefrist\b/);
  });

  it('Wartefrist-Ablauf ausserhalb der Ferien bleibt unverändert (ZB 1.4.2026 → 22.04.2026)', () => {
    const r = berechneSchkgFrist({ ereignis: '2026-04-01', einheit: 'tage', laenge: 20, modus: 'schkg_betreibungsferien', fristnatur: 'wartefrist', kanton: 'ZH' });
    expect(r.diesAdQuem).toBe('22.04.2026');
  });
});

describe('R1-07 · Fristenspiegel: frühestes Fortsetzungsbegehren nicht vor Ablauf der Rechtsvorschlagsfrist', () => {
  const warte = (zustellung: string) =>
    berechneZahlungsbefehlsSpiegel({ zustellung, kanton: 'ZH' }).zeilen.find((z) => z.key === 'fortsetzung_warte')!;
  const rv = (zustellung: string) =>
    berechneZahlungsbefehlsSpiegel({ zustellung, kanton: 'ZH' }).zeilen.find((z) => z.key === 'rechtsvorschlag')!;

  it('ZB 10.12.2026: RV bis 06.01.2027 → Fortsetzung frühestens 07.01.2027', () => {
    expect(rv('2026-12-10').endeISO).toBe('2027-01-06');
    expect(warte('2026-12-10').endeISO).toBe('2027-01-07');
  });

  it('ZB 10.7.2026: RV bis 05.08.2026 → Fortsetzung frühestens 06.08.2026', () => {
    expect(rv('2026-07-10').endeISO).toBe('2026-08-05');
    expect(warte('2026-07-10').endeISO).toBe('2026-08-06');
    expect(warte('2026-07-10').bedingung).toMatch(/\bRechtsvorschlag/);
  });

  it('Normalfall ZB 26.3.2026: Wartefrist-Folgetag 16.04.2026 unverändert', () => {
    expect(warte('2026-03-26').endeISO).toBe('2026-04-16');
  });
});

describe('R5-03 · Arresteinsprache: Fristbeginn «Kenntnis», Art. 56 Abs. 2 SchKG offengelegt', () => {
  it('Auslöser folgt Art. 278 Abs. 1 SchKG', () => {
    const p = preset('arresteinsprache');
    expect(p.ausloeser).toBe('Kenntnis der Arrestanordnung');
    expect(p.hinweis ?? '').toMatch(/\bArt\. 56 Abs\. 2 SchKG\b/);
  });
});

describe('R5-02 · Arrestprosekution: Betreibungsweg (SchKG) und Klageweg (ZPO) beschriftet', () => {
  it('SchKG-Preset nennt den Betreibungsweg und verweist auf den Klageweg', () => {
    const p = preset('arrestprosekution');
    expect(p.label).toMatch(/\bBetreibungsbegehren\b/);
    expect(p.hinweis ?? '').toMatch(/\bBGE 96 III 46\b/);
    expect(p.hinweis ?? '').toMatch(/\bArt\. 56 Abs\. 2 SchKG\b/);
  });

  it('ZPO-Preset nennt den Klageweg; kein Hinweis «SchKG-Ferien gesondert prüfen» mehr', () => {
    const p = ZPO_PRESETS.find((x) => x.key === 'arrestprosekution')!;
    expect(p.label).toMatch(/\bKlage\b/);
    expect(p.hinweispflichtEntfaellt).toBe(true); // RL-20 unverändert
    expect(p.hinweis ?? '').not.toMatch(/gesondert prüfen/);
    expect(p.hinweis ?? '').toMatch(/\bArt\. 56 Abs\. 2 SchKG\b/);
    expect(p.hinweis ?? '').toMatch(/\bArt\. 145 Abs\. 2 lit\. a\b/);
  });
});
