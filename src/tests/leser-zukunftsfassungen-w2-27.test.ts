import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  fassungsLink, zukunftsHinweis,
} from '../pages/gesetz-leser/zukunftsfassungen';
import { naechsteFassungSatz } from '../lib/normtext/erlassKopfText';
import type { BrowseErlass } from '../lib/normtext/browse-typen';
import type { CurrencyEintrag } from '../lib/normtext/browse';

// ═══ W2·27 (BUND-FERTIG §4 b) · ZUKUNFTSFASSUNGEN-HINWEIS ════════════════════
//
// Geprüft wird die AUSSAGE, nicht ihr Aussehen: welcher Satz bei welcher
// Datenlage entsteht, welcher Link daraus wird und wann GESCHWIEGEN wird.
// Die vier Lagen des Auftrags — künftig · inzwischen in Kraft · mehrere · keine
// — plus Kanton, plus der §5-Wächter auf die EINE Satzquelle.

const PUB = join(process.cwd(), 'public');

function erlassBauen(p: Partial<BrowseErlass> = {}): BrowseErlass {
  return {
    key: 'PROBE', ebene: 'bund', kanton: null, kuerzel: 'PROBE', titel: 'Probe-Erlass',
    sr: '999.9', rechtsgebiet: 'privat', sprache: 'de', rang: 1, status: 'snapshot',
    datei: 'bund/PROBE.json', artikelAnzahl: 10, stand: '2026-01-01',
    quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de',
    fassungsToken: '20260101', pdfPfad: null, pdfUrl: null, pdfStand: null,
    inkraftSeit: null,
    ...p,
  } as BrowseErlass;
}

const GEPRUEFT = '2026-09-05';

describe('W2·27 · Zukunftsfassungen-Hinweis im Leserkopf', () => {
  it('KÜNFTIG: Datum nach dem Stichtag → «nächste Fassung ab …» + datierte Fedlex-Manifestation', () => {
    const c: CurrencyEintrag = { geprueftAm: GEPRUEFT, naechsteFassungAb: '2026-10-01' };
    const h = zukunftsHinweis(erlassBauen(), c);
    expect(h).not.toBeNull();
    expect(h!.art).toBe('kuenftig');
    expect(h!.ab).toBe('2026-10-01');
    expect(h!.weitere).toBe(0);
    expect(h!.link).toBe('https://www.fedlex.admin.ch/eli/cc/27/317_321_377/20261001/de');
  });

  it('§5-WÄCHTER: der künftige Satz IST der eine Satz aus `erlassKopfText`, keine zweite Formulierung', () => {
    // Fällt jemand hier auf einen eigenen String zurück, laufen Leserkopf und
    // prerenderter SEO-Kopf (`lib/seo-detail.ts`) wieder auseinander — genau die
    // Doppel-Wahrheit, die S3/F5 beseitigt hat.
    const c: CurrencyEintrag = { geprueftAm: GEPRUEFT, naechsteFassungAb: '2027-01-01' };
    expect(zukunftsHinweis(erlassBauen(), c)!.satz).toBe(naechsteFassungSatz('2027-01-01'));
  });

  it('INZWISCHEN IN KRAFT: Datum am/vor dem Stichtag → ehrlicher Satz statt stiller Ausblendung (§8)', () => {
    // Entsteht, sobald ein Currency-Lauf altert, ohne dass der Snapshot nachgezogen
    // wird. Der Hinweis verschwindet dann NICHT — er sagt beide Daten.
    const c: CurrencyEintrag = { geprueftAm: GEPRUEFT, naechsteFassungAb: '2026-08-01' };
    const h = zukunftsHinweis(erlassBauen({ stand: '2026-01-01' }), c);
    expect(h!.art).toBe('inzwischen');
    expect(h!.satz).toBe('seit 01.08.2026 gilt eine neuere Fassung — hier steht die Kopie vom 01.01.2026');
    expect(h!.satz).not.toContain('nächste Fassung');
    // Der Link zeigt auf die Fassung, die GILT — das ist hier dieselbe Adresse.
    expect(h!.link).toBe('https://www.fedlex.admin.ch/eli/cc/27/317_321_377/20260801/de');
  });

  it('INZWISCHEN IN KRAFT ohne Stand: kein erfundenes zweites Datum (§8)', () => {
    const c: CurrencyEintrag = { geprueftAm: GEPRUEFT, naechsteFassungAb: '2026-08-01' };
    const h = zukunftsHinweis(erlassBauen({ stand: '' }), c);
    expect(h!.satz).toBe('seit 01.08.2026 gilt eine neuere Fassung');
  });

  it('MEHRERE: weitere künftige Inkrafttreten werden gezählt, Doppeldaten nur einmal', () => {
    const c: CurrencyEintrag = { geprueftAm: GEPRUEFT, naechsteFassungAb: '2026-10-01' };
    const h = zukunftsHinweis(erlassBauen(), c,
      ['2026-10-01', '2027-01-01', '2027-01-01', '2034-01-01']);
    expect(h!.ab).toBe('2026-10-01');
    // 2027-01-01 (doppelt geliefert) + 2034-01-01 = ZWEI weitere Fassungen.
    expect(h!.weitere).toBe(2);
  });

  it('MEHRERE: die Zahl hängt nicht an der Reihenfolge der Eingabe (§2, deterministisch)', () => {
    const c: CurrencyEintrag = { geprueftAm: GEPRUEFT, naechsteFassungAb: '2026-10-01' };
    const a = zukunftsHinweis(erlassBauen(), c, ['2034-01-01', '2026-10-01', '2027-01-01']);
    const b = zukunftsHinweis(erlassBauen(), c, ['2026-10-01', '2027-01-01', '2034-01-01']);
    expect(a).toEqual(b);
  });

  it('KEINER: ohne `naechsteFassungAb` gibt es keinen Hinweis — kein leeres Element', () => {
    expect(zukunftsHinweis(erlassBauen(), { geprueftAm: GEPRUEFT })).toBeNull();
    expect(zukunftsHinweis(erlassBauen(), undefined)).toBeNull();
    // Auch künftige Inkrafttreten allein reichen nicht: die Kopfzeile spricht
    // über FASSUNGEN, und die eine Fassungs-Wahrheit ist `naechsteFassungAb`.
    expect(zukunftsHinweis(erlassBauen(), undefined, ['2027-01-01'])).toBeNull();
  });

  it('AUFGEHOBEN: am aufgehobenen Erlass ist die Aufhebung die Aussage — kein Fassungs-Hinweis', () => {
    const c: CurrencyEintrag = { geprueftAm: GEPRUEFT, naechsteFassungAb: '2026-10-01' };
    expect(zukunftsHinweis(erlassBauen({ aufgehoben: { seit: '2025-01-01' } }), c)).toBeNull();
  });

  it('KANTON: rendert unverändert — kein Zukunftsdatum, also kein Element', () => {
    const kantonal = erlassBauen({
      key: 'BS-155.100', ebene: 'kanton', kanton: 'BS', sr: null,
      quelleUrl: 'https://www.gesetzessammlung.bs.ch/app/de/texts_of_law/155.100',
    } as Partial<BrowseErlass>);
    expect(zukunftsHinweis(kantonal, { geprueftAm: GEPRUEFT })).toBeNull();
    // Und selbst MIT Datum bekäme er keinen erfundenen Fedlex-Link (§8).
    const h = zukunftsHinweis(kantonal, { geprueftAm: GEPRUEFT, naechsteFassungAb: '2027-01-01' });
    expect(h!.link).toBeNull();
  });

  it('LOAD-BEARING: `fassungsLink` schiebt YYYYMMDD vor das Sprachsegment, sonst null', () => {
    expect(fassungsLink('https://www.fedlex.admin.ch/eli/cc/2007/686/de', '2026-10-01'))
      .toBe('https://www.fedlex.admin.ch/eli/cc/2007/686/20261001/de');
    expect(fassungsLink('https://www.fedlex.admin.ch/eli/cc/2007/686/fr', '2027-01-01'))
      .toBe('https://www.fedlex.admin.ch/eli/cc/2007/686/20270101/fr');
    // Kein Sprachsegment, Fragment, fremde Herkunft, unbrauchbares Datum → null.
    expect(fassungsLink('https://www.fedlex.admin.ch/eli/cc/2007/686', '2026-10-01')).toBeNull();
    expect(fassungsLink('https://www.fedlex.admin.ch/eli/cc/2007/686/de#art_1', '2026-10-01')).toBeNull();
    expect(fassungsLink('https://www.admin.ch/eli/cc/2007/686/de', '2026-10-01')).toBeNull();
    expect(fassungsLink('https://www.fedlex.admin.ch/eli/cc/2007/686/de', '2026-10')).toBeNull();
  });

  it('LIVE-BESTAND: jeder Bundeserlass mit `naechsteFassungAb` bekommt einen Hinweis MIT Link', () => {
    const register = JSON.parse(readFileSync(join(PUB, 'normtext', 'register.json'), 'utf8')) as
      { erlasse: BrowseErlass[] };
    const currency = JSON.parse(readFileSync(join(PUB, 'normtext', 'currency.json'), 'utf8')) as
      Record<string, CurrencyEintrag>;
    const mit = register.erlasse.filter((e) => currency[e.key]?.naechsteFassungAb);
    // Gemessen 14.9.2026: 62 Erlasse (FAHRPLAN-BUND-FERTIG §1, Zeile
    // «Stand / Fassung / Zukunftsfassungen»). Untergrenze statt Gleichheit —
    // die Zahl wächst mit jedem Currency-Lauf, das Verhalten nicht.
    expect(mit.length).toBeGreaterThanOrEqual(1);
    const ohneLink = mit.filter((e) => {
      const h = zukunftsHinweis(e, currency[e.key]);
      return h !== null && h.link === null;
    });
    expect(ohneLink.map((e) => e.key)).toEqual([]);
  });
});
