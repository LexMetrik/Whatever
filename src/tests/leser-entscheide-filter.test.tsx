/**
 * W2·17-UI-BEFUNDE · Entscheide-Filter (Instanz/Kanton/Zeitraum) — Befunde
 * PE-E4 B01–B03/D01/D03 und PE-E5 B01/B03/B04 (Prüflauf 1.10.2026, main 832071b02).
 *
 * Reine Logik und Server-Render der geteilten Bausteine; was nur im Browser
 * prüfbar ist (echte Tastatur im Datumsfeld, Escape in der Zeichenerklärung,
 * gemessene Trefferfläche), steht in `e2e/leser-v3-panel-filter-befunde.e2e.ts`.
 */
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import type { Bezug } from '../lib/rechtsprechung/bezuege';
import type { BezugStatus } from '../lib/verzahnung/facetten';
import { BEDIENBARE_KLASSEN, istEingegrenzt, kantonSchneidet, waehleBezuege } from '../pages/gesetz-leser/bezugAuswahl';
import { istUebernehmbar } from '../pages/gesetz-leser/bezugZeit';
import { instanzStand } from '../pages/gesetz-leser/v3/panelModell';
import { PanelFilterZeile } from '../pages/gesetz-leser/v3/PanelFilterZeile';
import { BezugFacettenWahl } from '../components/verzahnung/BezugFacettenWahl';
import { BezugZeitWahl } from '../components/verzahnung/BezugZeitWahl';

function kante(key: string, status: BezugStatus, kanton: string): Bezug {
  return {
    key, zitierung: key, regesteKurz: null, datum: '2020-01-01', gewicht: null,
    facetten: { quelltyp: 'rechtsprechung', ebene: kanton === 'CH' ? 'bund' : 'kanton', kanton, gericht: status, status },
  };
}

// «Artikel» wie OR Art. 41 (Prüflauf): Bund + Entscheide aus BS und AG, keiner aus ZH.
const OR41: Bezug[] = [
  kante('bge_1', 'bge', 'CH'),
  kante('bger_1', 'bger', 'CH'),
  kante('bs_1', 'kantonal', 'BS'),
  kante('bs_2', 'kantonal', 'BS'),
  kante('ag_1', 'kantonal', 'AG'),
];
const ALLE = [...BEDIENBARE_KLASSEN];
const schluessel = (l: readonly Bezug[]) => l.map((b) => b.key);

describe('E4-B01/B02 · ein Kanton ohne Entscheid am Artikel filtert nicht unsichtbar', () => {
  it('der gespeicherte Fremdkanton (ZH an BGG gewählt) leert OR 41 nicht', () => {
    // Vorher (rot): `{ZH, CH}` liess alle kantonalen Kanten durchfallen — die
    // Liste zeigte nur bge/bger, kein Schalter stand gedrückt (§8).
    expect(schluessel(waehleBezuege(OR41, ALLE, ['ZH']))).toEqual(schluessel(OR41));
  });

  it('ein Kanton MIT Entscheid am Artikel schneidet weiter wie bisher', () => {
    expect(schluessel(waehleBezuege(OR41, ALLE, ['BS']))).toEqual(['bge_1', 'bger_1', 'bs_1', 'bs_2']);
  });

  it('Mischwahl: der fremde Kanton fällt weg, der vorhandene schneidet', () => {
    expect(schluessel(waehleBezuege(OR41, ALLE, ['AG', 'ZH']))).toEqual(['bge_1', 'bger_1', 'ag_1']);
  });

  it('Bundesentscheide bleiben in jedem Fall stehen', () => {
    expect(schluessel(waehleBezuege(OR41, ALLE, ['ZH'])).filter((k) => k.startsWith('bg'))).toEqual(['bge_1', 'bger_1']);
  });

  it('ohne kantonale Klasse bleibt die Kantonwahl wirkungslos (unverändert)', () => {
    expect(schluessel(waehleBezuege(OR41, ['bge'], ['ZH']))).toEqual(['bge_1']);
  });
});

describe('E4-B01 Nachzug · «im Kanton» am Gruppenkopf nur, wenn der Kanton hier etwas herausnimmt', () => {
  it('Fremdkanton (ZH an OR 41): kein Kanton-Filter aktiv — auch wenn der Zeitraum kürzt', () => {
    expect(kantonSchneidet(OR41, ALLE, ['ZH'])).toBe(false);
  });

  it('ein Kanton MIT Entscheid am Artikel: aktiv', () => {
    expect(kantonSchneidet(OR41, ALLE, ['BS'])).toBe(true);
    expect(kantonSchneidet(OR41, ALLE, ['ZH', 'AG'])).toBe(true);
  });

  it('ohne Wahl oder ohne kantonale Klasse: nie aktiv', () => {
    expect(kantonSchneidet(OR41, ALLE, [])).toBe(false);
    expect(kantonSchneidet(OR41, ['bge', 'bger'], ['BS'])).toBe(false);
  });

  it('nur Bundeskanten am Artikel (CH ist kein Kanton): nie aktiv', () => {
    expect(kantonSchneidet([kante('bge_1', 'bge', 'CH')], ALLE, ['BS'])).toBe(false);
  });
});

describe('E4-B03/D01 · die Klappe «Instanzen» nennt die Kantonwahl', () => {
  it('Kurzstand mit Kanton, nur wenn «kantonal» an ist', () => {
    expect(instanzStand(ALLE, [])).toBe('BGE +3');
    expect(instanzStand(ALLE, ['BE'])).toBe('BGE +3 · BE');
    expect(instanzStand(ALLE, ['AG', 'BE'])).toBe('BGE +3 · AG, BE');
    expect(instanzStand(ALLE, ['AG', 'BE', 'BS'])).toBe('BGE +3 · 3 Kantone');
    // Ohne «kantonal» wirkt die Kantonwahl nicht — Nennung wäre irreführend.
    expect(instanzStand(['bge', 'bger'], ['BE'])).toBe('BGE +1');
    expect(instanzStand([], ['BE'])).toBe('keine');
  });

  it('abgewichen heisst auch: ein Kanton ist gewählt und «kantonal» ist an', () => {
    expect(istEingegrenzt(ALLE)).toBe(false);
    expect(istEingegrenzt(ALLE, [])).toBe(false);
    expect(istEingegrenzt(ALLE, ['BE'])).toBe(true);
    expect(istEingegrenzt(['bge', 'bger'], ['BE'])).toBe(true); // ohnehin eingegrenzt
  });

  it('die Filterzeile zeigt den Stand samt Kanton an der eingeklappten Klappe', () => {
    const html = renderToString(
      <PanelFilterZeile klassen={ALLE} kantone={['BE']} kantoneVerfuegbar={['AG', 'BE']}
        klassenZahlen={{}} zahlOrt="an Art. 41" histogramm={{ balken: [], ohneJahr: 0 }}
        bereich={{ von: '', bis: '' }} onKlassen={() => {}} onKantone={() => {}} onBereich={() => {}} />,
    );
    expect(html).toContain('BGE +3 · BE');
  });

  it('der Erklärtext nennt die Kantonwahl statt «Grundeinstellung»', () => {
    const html = renderToString(
      <BezugFacettenWahl klassen={ALLE} kantone={['BE']} kantoneVerfuegbar={['AG', 'BE']}
        klassenZahlen={{}} zahlOrt="an Art. 41" onKlassen={() => {}} onKantone={() => {}} />,
    );
    expect(html).not.toContain('Grundeinstellung');
    expect(html).toContain('Eingegrenzt');
    // B02: ehrlicher Hinweis, dass ein Kanton ohne Entscheid am Artikel dort nicht einschränkt.
    expect(html).toMatch(/Hat ein gewählter Kanton an Art\. 41 keinen Entscheid, schränkt er dort nicht ein/);
  });
});

describe('E4-B01 · gewählte Kantone sind immer sichtbar und abwählbar', () => {
  function kantonKnopf(html: string, k: string): string | null {
    const m = new RegExp(`<button[^>]*data-bezug-kanton="${k}"[^>]*>`).exec(html);
    return m ? m[0] : null;
  }

  it('ein gespeicherter Kanton, den der Erlass nicht führt, steht als gedrückter Chip da', () => {
    const html = renderToString(
      <BezugFacettenWahl klassen={ALLE} kantone={['ZH']} kantoneVerfuegbar={['AG', 'BS']}
        klassenZahlen={{}} zahlOrt="an Art. 41" onKlassen={() => {}} onKantone={() => {}} />,
    );
    const zh = kantonKnopf(html, 'ZH');
    expect(zh, 'ZH-Chip fehlt').not.toBeNull();
    expect(zh).toContain('aria-pressed="true"');
    expect(zh).toMatch(/title="[^"]*in diesem Erlass[^"]*"/);
    // «alle» ist NICHT gedrückt (es ist ja ein Kanton gewählt).
    expect(html).toMatch(/aria-pressed="false"[^>]*>alle</);
  });

  it('die Kantonzeile steht auch dann da, wenn der Erlass keinen Kanton führt, aber einer gewählt ist', () => {
    const html = renderToString(
      <BezugFacettenWahl klassen={ALLE} kantone={['ZH']} kantoneVerfuegbar={[]}
        klassenZahlen={{}} zahlOrt="an § 44" onKlassen={() => {}} onKantone={() => {}} />,
    );
    expect(kantonKnopf(html, 'ZH')).not.toBeNull();
  });

  it('ohne Wahl und ohne Kantone im Erlass bleibt die Zeile weg (unverändert, §13 F4)', () => {
    const html = renderToString(
      <BezugFacettenWahl klassen={ALLE} kantone={[]} kantoneVerfuegbar={[]}
        klassenZahlen={{}} zahlOrt="an § 44" onKlassen={() => {}} onKantone={() => {}} />,
    );
    expect(html).not.toContain('data-bezug-kanton');
    expect(html).toContain('Grundeinstellung');
  });

  it('ohne kantonale Klasse steht die Kantonzeile nicht da (unverändert)', () => {
    const html = renderToString(
      <BezugFacettenWahl klassen={['bge']} kantone={['ZH']} kantoneVerfuegbar={['AG']}
        klassenZahlen={{}} zahlOrt="an Art. 41" onKlassen={() => {}} onKantone={() => {}} />,
    );
    expect(html).not.toContain('data-bezug-kanton');
  });
});

describe('E5-B01 · Tastatur im Datumsfeld: Zwischenwerte werden nicht übernommen', () => {
  it('leer (offenes Ende) und volles Jahr ab 1000 sind übernehmbar', () => {
    expect(istUebernehmbar('')).toBe(true);
    expect(istUebernehmbar('2023-12-31')).toBe(true);
    expect(istUebernehmbar('1875-01-01')).toBe(true);
    expect(istUebernehmbar('1000-01-01')).toBe(true);
  });

  it('die Jahr-Zwischenstufen beim Tippen «2023» sind es nicht', () => {
    for (const z of ['0002-03-11', '0020-03-11', '0202-03-11', '0999-12-31']) {
      expect(istUebernehmbar(z), z).toBe(false);
    }
  });

  it('Unsinn ist nicht übernehmbar', () => {
    expect(istUebernehmbar('abc')).toBe(false);
    expect(istUebernehmbar('23-01-01')).toBe(false);
  });
});

describe('E5-B03 · Leertext des Zeitstrahls nennt den wahren Grund', () => {
  const leer = { balken: [], ohneJahr: 0 };
  const offen = { von: '', bis: '' };

  it('alle Instanzen abgewählt: kein «noch nicht geladen»', () => {
    const html = renderToString(<BezugZeitWahl bereich={offen} histogramm={leer} onBereich={() => {}} keineInstanz />);
    expect(html).not.toContain('noch keine Verteilung geladen');
    expect(html).toContain('Alle Instanzen sind abgewählt');
    expect(html).toContain('Die Datumsfelder wirken trotzdem');
  });

  it('ohne Grund bleibt der bisherige Satz', () => {
    const html = renderToString(<BezugZeitWahl bereich={offen} histogramm={leer} onBereich={() => {}} />);
    expect(html).toContain('noch keine Verteilung geladen');
  });
});

describe('E5-B04 · «in diesem Erlass» sagt, wenn die Zahl instanzgefiltert ist', () => {
  const histo = { balken: [{ jahr: 2020, anzahl: 3 }, { jahr: 2021, anzahl: 2 }], ohneJahr: 0 };
  const offen = { von: '', bis: '' };

  it('ohne Eingrenzung: wie bisher', () => {
    const html = renderToString(<BezugZeitWahl bereich={offen} histogramm={histo} onBereich={() => {}} />);
    expect(html).toMatch(/Verknüpfungen<!-- --> in diesem Erlass(?!<!-- --> \()/);
    expect(html).not.toContain('eingeschalteten Instanzen)');
  });

  it('mit Eingrenzung: der Zusatz steht da', () => {
    const html = renderToString(<BezugZeitWahl bereich={offen} histogramm={histo} onBereich={() => {}} instanzEingegrenzt />);
    expect(html).toContain('in diesem Erlass');
    expect(html).toContain('nur eingeschaltete Instanzen');
  });
});
