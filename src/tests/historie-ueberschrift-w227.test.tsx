import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { ArtikelHistorieZeile } from '../pages/gesetz-leser/parts/ArtikelHistorie';
import type { ArtikelHistorie } from '../lib/normtext/historie-laden';

// W2·27-BUND-FERTIG (2.10.2026): ein Ereignis, das aus einer Fussnote an der Gliederungsüberschrift stammt
// (`ueberschrift`, build-seitig aus dem Sidecar-Feld `sektion`), trägt in der Zeitleiste die Herkunft «an der Überschrift «…»»
// — am Träger-Artikel wie an jedem Artikel darunter. Ereignisse ohne das Feld bleiben Zeichen für Zeichen wie bisher (§3).

const E = { wirkung: false, quellen: [] as ArtikelHistorie['ereignisse'][number]['quellen'], absatz: null, item: null };
const html = (h: ArtikelHistorie) => renderToStaticMarkup(<ArtikelHistorieZeile historie={h} zeitleiste />);
const text = (h: ArtikelHistorie) => html(h).replace(/<[^>]+>/g, '');

describe('ArtikelHistorie · Herkunft «an der Überschrift»', () => {
  const ueberschrift = 'Zehnter Titel: Der Arbeitsvertrag';
  const h: ArtikelHistorie = {
    giltSeit: '2012-01-01',
    ereignisse: [
      { ...E, typ: 'fassung', datum: '1972-01-01', ueberschrift },
      { ...E, typ: 'eingefuegt', datum: '2012-01-01' },
    ],
  };

  it('nennt die Überschrift am Überschrift-Ereignis, nicht am eigenen', () => {
    const t = text(h);
    expect(t).toContain('Neufassung · an der Überschrift «Zehnter Titel: Der Arbeitsvertrag» · in Kraft seit');
    expect(t.match(/an der Überschrift/g)).toHaveLength(1);
  });

  it('ohne `ueberschrift` bleibt die Zeile unverändert (kein Marker, kein «»)', () => {
    const t = html({ giltSeit: '2020-01-01', ereignisse: [{ ...E, typ: 'fassung', datum: '2020-01-01' }] });
    expect(t).not.toContain('Überschrift');
    expect(t).not.toContain('data-historie-ueberschrift');
  });
});

// Nachzug 2.10.2026 (B2): eine gestaffelt/befristet geltende Überschrift-Fussnote erscheint an den Erben OHNE Datum, aber mit
// ihrem Wortlaut — Staffelung und Befristung dürfen nicht verschwinden (§8).
describe('ArtikelHistorie · gestaffelte Überschrift-Fussnote (B2)', () => {
  const wortlaut = 'Fassung gemäss Ziff. I des BG vom 17. Dez. 2021 (AHV 21), in Kraft seit 1. Jan. 2024, Art. 40c in Kraft vom 1. Jan. 2025 bis zum 31. Dez. 2033 (AS 2023 92; BBl 2019 6305).';
  const h: ArtikelHistorie = {
    giltSeit: null,
    ereignisse: [{ ...E, typ: 'fassung', datum: null, ueberschrift: 'IV. Flexibler Rentenbezug', teilweise: wortlaut }],
  };

  it('zeigt Fundort und Wortlaut, aber kein «in Kraft seit»-Datum am Ereignis; ohne giltSeit bleibt das Schild neutral', () => {
    const t = text(h);
    expect(t).toContain('an der Überschrift «IV. Flexibler Rentenbezug»');
    expect(t).toContain('Fussnote an der Überschrift: «Fassung gemäss Ziff. I des BG vom 17. Dez. 2021');
    expect(t).toContain('Art. 40c in Kraft vom 1. Jan. 2025 bis zum 31. Dez. 2033');
    expect(t).not.toContain('Gilt seit');
    expect(t).not.toMatch(/Neufassung · an der Überschrift «[^»]*» · in Kraft seit/);
    expect(html(h)).toContain('data-historie-teilweise');
  });

  it('Ereignis ohne `teilweise` zeigt keinen Wortlaut-Block', () => {
    expect(html({ giltSeit: null, ereignisse: [{ ...E, typ: 'fassung', datum: '2000-01-01', ueberschrift: 'X' }] })).not.toContain('data-historie-teilweise');
  });
});

// B6: die Änderungskarte (EntstehungsBlock) nennt bei einem Überschrift-Ereignis neutral den Fundort statt «Betrifft: die Überschrift».
describe('EntstehungsBlock · Betrifft-Zeile bei Überschrift-Ereignissen (B6)', () => {
  const quelle = readFileSync('src/components/entstehung/EntstehungsBlock.tsx', 'utf8');

  it('«Vermerkt an der Überschrift «…»» statt «die Überschrift «…»» (suggeriert, nur die Überschrift sei geändert)', () => {
    expect(quelle).toContain('Vermerkt an der Überschrift «${e.ueberschrift}»');
    expect(quelle).not.toMatch(/return `die Überschrift «/);
  });
});
