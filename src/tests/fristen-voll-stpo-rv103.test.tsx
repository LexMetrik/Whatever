// @vitest-environment node
// ─── RECHTSLOGIK · FB RV-103: Voll-Formular und Permalink des Tagerechners kennen den StPO-Kontext ──
//
// Vorarbeit #1415 (RV-49): die Engine rechnet `kontext: 'stpo'` (Art. 90 Abs. 2 StPO, Fedlex SR 312.0,
// https://www.fedlex.admin.ch/eli/cc/2010/267/de#art_90); der einfache Rechner oben war fertig, das Voll-
// Formular (Tab «Allgemein») und der Permalink rechneten StPO weiter nach Art. 78 OR. Randdaten (dieselben
// wie fristen-tagerechner-rv.test.tsx): NE Ostermontag 6.4.2026 (Schliesstag, LI-CPP Art. 9a) und SO
// 1. Mai 2026 (EG StPO § 10bis) verschieben NUR im StPO-Kontext.
//
// ROT ZU BEKOMMEN (§6.7): in `fristQueryLesen` den Zweig `p.get('r') === 's'` streichen ⇒ «r=s» liest
// keinen Kontext, die Link- und Formular-Fälle messen 06.04.2026 statt 07.04.2026.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, createElement, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { parseHTML } from 'linkedom';
import {
  berechneAllgemeineFrist, fristQueryKodieren, fristQueryLesen, type AllgFristInput,
} from '../lib/allgemeineFrist';
import { AllgemeineFristForm } from '../components/forms/AllgemeineFristForm';
import { KANTON_ANKNUEPFUNG, type EinfacheFristMeldung, type Ferien } from '../components/forms/einfacheFristTexte';
import { LocaleProvider } from '../components/locale';

const basis = { wochenendeVerschieben: true, feiertageVerschieben: true } as const;
const ne: AllgFristInput = { start: '2026-03-27', laenge: 10, einheit: 'tage', ...basis, kanton: 'NE' };

describe('RV-103 · Engine-Guard: Art. 90 Abs. 2 StPO verschiebt zwingend', () => {
  it('stpo ohne Wochenend- und/oder Feiertags-Verschiebung wirft (alle drei Kombinationen)', () => {
    for (const t of [
      { wochenendeVerschieben: false, feiertageVerschieben: false },
      { wochenendeVerschieben: true, feiertageVerschieben: false },
      { wochenendeVerschieben: false, feiertageVerschieben: true },
    ]) {
      expect(() => berechneAllgemeineFrist({ ...ne, ...t, kontext: 'stpo' })).toThrow(/Art\. 90 Abs\. 2 StPO/);
    }
  });
  it('Gegenprobe: mit beiden Verschiebungen rechnet stpo; der Standard-Kontext darf weiter ohne Verschiebung rechnen', () => {
    expect(berechneAllgemeineFrist({ ...ne, kontext: 'stpo' }).endDatum).toBe('07.04.2026');
    const ohne = { ...ne, wochenendeVerschieben: false, feiertageVerschieben: false };
    expect(berechneAllgemeineFrist(ohne).endDatum).toBe('06.04.2026');
    expect(berechneAllgemeineFrist({ ...ohne, kontext: 'allgemein' }).endDatum).toBe('06.04.2026');
  });
});

describe('RV-103 · Permalink', () => {
  it('Rundlauf stpo: NE 27.3.2026 + 10 Tage → Link mit r=s → 07.04.2026', () => {
    const q = fristQueryKodieren({ ...ne, kontext: 'stpo' });
    expect(q).toBe('s=2026-03-27&l=10&e=tage&w=1&f=1&k=NE&r=s');
    const gelesen = fristQueryLesen(q)!;
    expect(gelesen.kontext).toBe('stpo');
    expect(berechneAllgemeineFrist({ ...ne, ...gelesen } as AllgFristInput).endDatum).toBe('07.04.2026');
  });
  it('gesetzliche und allgemeine Links bleiben byte-gleich (fester String, auch mit kontext "allgemein")', () => {
    const g: AllgFristInput = { start: '2026-06-05', laenge: 30, einheit: 'tage', ...basis, kanton: 'ZH' };
    expect(fristQueryKodieren(g)).toBe('s=2026-06-05&l=30&e=tage&w=1&f=1&k=ZH');
    expect(fristQueryKodieren({ ...g, fristart: 'gesetzlich', kontext: 'allgemein' })).toBe('s=2026-06-05&l=30&e=tage&w=1&f=1&k=ZH');
    expect(fristQueryLesen('s=2026-06-05&l=30&e=tage&w=1&f=1&k=ZH')).toEqual({
      start: '2026-06-05', laenge: 30, einheit: 'tage', wochenendeVerschieben: true, feiertageVerschieben: true, kanton: 'ZH',
    });
  });
  it('r=v (Vertragsfrist) unverändert', () => {
    const v: AllgFristInput = { start: '2026-06-05', laenge: 30, einheit: 'tage', ...basis, kanton: 'ZH', fristart: 'vertraglich' };
    expect(fristQueryKodieren(v)).toBe('s=2026-06-05&l=30&e=tage&w=1&f=1&k=ZH&r=v');
    expect(fristQueryLesen('s=2026-06-05&l=30&e=tage&w=1&f=1&k=ZH&r=v')).toMatchObject({ fristart: 'vertraglich' });
    expect(fristQueryLesen('s=2026-06-05&l=30&e=tage&w=1&f=1&k=ZH&r=v')).not.toHaveProperty('kontext');
  });
  it('Randfall: r=s ohne w/f setzt beide Verschiebungen (kein «kein Ergebnis» am Engine-Guard)', () => {
    const gelesen = fristQueryLesen('s=2026-03-27&l=10&e=tage&k=NE&r=s')!;
    expect(gelesen).toMatchObject({ kontext: 'stpo', wochenendeVerschieben: true, feiertageVerschieben: true, kanton: 'NE' });
    expect(berechneAllgemeineFrist({ ...ne, ...gelesen } as AllgFristInput).endDatum).toBe('07.04.2026');
  });
  it('Randfall: unbekannte r-Werte verhalten sich wie heute (kein Kontext, w/f-Abwesenheit = aus)', () => {
    for (const r of ['x', 'S', '', 'vs']) {
      const g = fristQueryLesen(`s=2026-03-27&l=10&e=tage&k=NE&r=${r}`)!;
      expect(g).not.toHaveProperty('kontext');
      expect(g).not.toHaveProperty('fristart');
      expect(g.wochenendeVerschieben).toBe(false);
      expect(g.feiertageVerschieben).toBe(false);
    }
  });
});

// ── Voll-Formular (Server-Render; der Permalink wird aus window.location.search gelesen) ──
afterEach(() => { vi.unstubAllGlobals(); });
function form(search: string, live?: EinfacheFristMeldung): string {
  vi.stubGlobal('window', { location: { search, hash: '', pathname: '/rechner/tagerechner' } });
  return renderToStaticMarkup(
    <LocaleProvider><MemoryRouter initialEntries={['/rechner/tagerechner']}><AllgemeineFristForm live={live} /></MemoryRouter></LocaleProvider>);
}
const NE_Q = '?s=2026-03-27&l=10&e=tage&w=1&f=1&k=NE';
const SO_Q = '?s=2026-04-21&l=10&e=tage&w=1&f=1&k=SO';
const arbeitsfrei = (html: string) => (html.match(/title="arbeitsfrei/g) ?? []).length;

describe('RV-103 · Voll-Formular rechnet und beschriftet StPO', () => {
  it('NE mit r=s: Fristende 07.04.2026, Art. 90 StPO statt Art. 77/78 OR, StPO-Beschriftung des Kantons', () => {
    const html = form(NE_Q + '&r=s');
    expect(html).toContain('07.04.2026 · 24.00 Uhr');
    expect(html).toContain('Strafprozessuale Frist (Art. 90 StPO)');
    expect(html).toContain('<option value="stpo" selected="">Strafprozessuale Frist (StPO)</option>');
    expect(html).not.toContain('Art. 77/78 OR');
    expect(html).toContain(`Kanton (${KANTON_ANKNUEPFUNG.stpo})`);
    expect(html).not.toContain('Erfüllungsort)');
    expect(html).toContain('(Art. 90 Abs. 2 StPO)');
    // beide Verschiebe-Kästchen gesetzt und nicht abwählbar
    expect(html.match(/<input[^>]*type="checkbox"[^>]*>/g)!.filter((i) => i.includes('checked') && i.includes('disabled'))).toHaveLength(2);
  });
  it('NE ohne r=s: Fristende 06.04.2026 nach Art. 77/78 OR (Standard unverändert)', () => {
    const html = form(NE_Q);
    expect(html).toContain('06.04.2026 · 24.00 Uhr');
    expect(html).toContain('Allgemeine Frist (Art. 77/78 OR)');
    expect(html).not.toContain('Art. 90 StPO');
    expect(html).toContain('Kanton (Erfüllungsort)');
    expect(html).toContain('<option value="apostplus">');
    expect(html).toContain('ZPO-Fristen →');
  });
  it('SO 21.4.2026 + 10 Tage: 04.05.2026 mit r=s (1. Mai, EG StPO § 10bis), 01.05.2026 ohne', () => {
    expect(form(SO_Q + '&r=s')).toContain('04.05.2026 · 24.00 Uhr');
    expect(form(SO_Q)).toContain('01.05.2026 · 24.00 Uhr');
  });
  it('Kalender markiert im StPO-Modus die bedingten SO-Tage (1. Mai, Ostermontag, Pfingstmontag) zusätzlich als arbeitsfrei', () => {
    // gemessen: Apr/Mai 2026 — StPO 23 arbeitsfreie Zellen, Standard-Kontext 20 (6.4., 1.5., 25.5. nur im StPO-Kontext)
    expect(arbeitsfrei(form(SO_Q + '&r=s'))).toBe(arbeitsfrei(form(SO_Q)) + 3);
  });
  it('Zustell-Helfer: A-Post Plus (Art. 142 Abs. 1bis ZPO) wird im StPO-Modus nicht angeboten und offengelegt', () => {
    const html = form(NE_Q + '&r=s');
    expect(html).not.toContain('<option value="apostplus">');
    expect(html).toContain('<option value="einschreiben">');
    expect(html).toContain('Art. 142 Abs. 1bis ZPO (Feiertage am Gerichtsort)');
  });
  it('Abgrenzungs-Hinweis mit ZPO-/SchKG-Links entfällt im StPO-Modus (der StPO-Hinweis steht in der Engine, fristen-tagerechner-rv.test.tsx)', () => {
    const html = form(NE_Q + '&r=s');
    expect(html).not.toContain('ZPO-Fristen →');
    expect(html).not.toContain('SchKG-Fristen →');
  });
  it('Fach-Preset per Link (fp=) setzt den StPO-Kontext zurück (sonst Throw «ohne Verschiebung» + StPO)', () => {
    const html = form(NE_Q + '&r=s&fp=einfache_gesellschaft');
    expect(html).not.toContain('Art. 90 StPO');
    expect(html).toContain('Allgemeine Frist (Art. 77/78 OR)');
  });
});

describe('RV-103 · Live-Brücke (Meldung des Regimes oben)', () => {
  const meldung = (ferien: Ferien): EinfacheFristMeldung => ({
    ferien, werte: { start: '2026-03-27', laenge: 10, einheit: 'tage', kanton: 'NE' },
    beruehrt: ['start', 'laenge', 'einheit', 'kanton'],
  });
  it('erste Meldung ferien "stpo" → Formular rechnet StPO (07.04.2026); "keine" → allgemein (06.04.2026)', () => {
    const s = form('', meldung('stpo'));
    expect(s).toContain('07.04.2026 · 24.00 Uhr');
    expect(s).toContain('Strafprozessuale Frist (Art. 90 StPO)');
    const k = form('', meldung('keine'));
    expect(k).toContain('06.04.2026 · 24.00 Uhr');
    expect(k).not.toContain('Art. 90 StPO');
  });

  // Folge statt Schnappschuss: Regime-Wechsel keine → stpo → keine im selben Formular, dazwischen eine
  // Hand-Wahl und eine reine Werte-Meldung.
  let root: Root | null = null;
  afterEach(async () => { if (root) { const r = root; root = null; await act(async () => r.unmount()); } });
  it('Rückwechsel stpo → keine → allgemein; Werte-Meldung im selben Regime überschreibt eine Hand-Wahl nicht', async () => {
    const { document } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
    vi.stubGlobal('window', { document, location: { search: '', hash: '', pathname: '/rechner/tagerechner' } });
    vi.stubGlobal('document', document);
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    let sende: (m: EinfacheFristMeldung) => void = () => {};
    function Huelle() {
      const [live, setLive] = useState<EinfacheFristMeldung | undefined>(undefined);
      sende = setLive;
      return <LocaleProvider><MemoryRouter><AllgemeineFristForm live={live} /></MemoryRouter></LocaleProvider>;
    }
    root = createRoot(document.getElementById('app') as unknown as HTMLElement);
    await act(async () => { root!.render(createElement(Huelle)); });
    const ende = () => /Fristende \(dies ad quem\)[\s\S]*?(\d\d\.\d\d\.\d{4}) · 24\.00 Uhr/.exec(document.body.innerHTML)?.[1];
    const mit = (ferien: Ferien, laenge = 10): EinfacheFristMeldung =>
      ({ ...meldung(ferien), werte: { ...meldung(ferien).werte, laenge } });

    await act(async () => { sende(mit('stpo')); });
    expect(ende()).toBe('07.04.2026');
    // Hand-Wahl unten: «Gesetzliche oder behördliche Frist» (Kontext zurück auf Standard) …
    const fristart = document.querySelector('option[value="stpo"]')!.parentElement as unknown as HTMLSelectElement;
    await act(async () => {
      // linkedom: `value` hat nur einen Getter — die Auswahl läuft über das selected-Attribut der Option.
      fristart.querySelector('option[selected]')?.removeAttribute('selected');
      fristart.querySelector('option[value="gesetzlich"]')!.setAttribute('selected', '');
      fristart.dispatchEvent(new (document.defaultView as unknown as { Event: typeof Event }).Event('change', { bubbles: true }));
    });
    expect(ende()).toBe('06.04.2026');
    // … bleibt bei einer Werte-Meldung im selben Regime (stpo) bestehen; die Länge 11 kommt trotzdem an.
    await act(async () => { sende(mit('stpo', 11)); });
    expect(document.body.innerHTML).not.toContain('Art. 90 StPO');
    expect((document.querySelector('input[type="number"]') as unknown as HTMLInputElement).value).toBe('11');
    await act(async () => { sende(mit('keine')); }); // echter Wechsel zurück
    expect(ende()).toBe('06.04.2026');
    expect(document.body.innerHTML).not.toContain('Art. 90 StPO');
    await act(async () => { sende(mit('stpo')); });
    expect(ende()).toBe('07.04.2026');
  });
});
