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
//
// Nachzug (Gegenprüfung auf 03edc7696, A1–A3, N1/N3) — Sabotage-Proben, je EINE Zeile, jede macht genau
// die genannten Tests rot (Belege im Auftragsbericht):
//   S1  Seite: `live?.ferien === 'stpo'` aus der Live-Übergabe an AllgemeineFristForm streichen
//   S2  Seite: `stpo: 'allgemein'` aus FERIEN_VERFAHREN streichen
//   S5  Voll-Formular: ICS-Beschreibung nennt immer «Art. 77/78 OR» statt `frist.norm`
//   S6  Voll-Formular: `rechtsgrundlage` nennt immer «Art. 77/78 OR»
//   S8  Voll-Formular: Familien-Preset ohne `kontext: 'allgemein'`
//   A1  Voll-Formular: Mechanik-Preset setzt den Kontext hart auf 'allgemein' (alter Stand)
//   A1b mechanikPresetsFuer('stpo') liefert alle Presets
//   A2  Engine: ALLG_FRIST_HINWEIS auch im StPO-Kontext anhängen
//   N1  Engine: Rechenweg-Grund im StPO-Kontext wie im Standard-Kontext
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { ReactElement } from 'react';
import { act, createElement, useState } from 'react';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { parseHTML } from 'linkedom';
import {
  ALLG_FRIST_HINWEIS, STPO_FRIST_HINWEIS, MECHANIK_PRESETS, allgemeineFristErgebnis, berechneAllgemeineFrist,
  fristQueryKodieren, fristQueryLesen, mechanikPresetsFuer, type AllgFristInput,
} from '../lib/allgemeineFrist';
import { AllgemeineFristForm } from '../components/forms/AllgemeineFristForm';
import { RechnerTagerechner } from '../pages/RechnerTagerechner';
import { KANTON_ANKNUEPFUNG, type EinfacheFristMeldung, type Ferien } from '../components/forms/einfacheFristTexte';
import { LocaleProvider } from '../components/locale';

// ICS-Inhalt und PDF-Konfiguration abgreifen (Nachzug A3): der Klick auf «In Kalender (.ics)» ruft ladeIcs,
// der PDF-Knopf bekommt seine Konfiguration als Prop — beides ohne Download/Render im Test.
const abgriff = vi.hoisted(() => ({ ics: [] as string[], pdf: [] as Array<{ title: string; rechtsgrundlage: string; disclaimer: string }> }));
vi.mock('../components/icsDownload', () => ({ ladeIcs: (_name: string, inhalt: string) => { abgriff.ics.push(inhalt); } }));
vi.mock('../components/PdfExport', () => ({
  PdfExportButton: ({ config }: { config: { title: string; rechtsgrundlage: string; disclaimer: string } }) => {
    abgriff.pdf.push(config);
    return null;
  },
}));

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

// ═══ Nachzug RV-103 (Gegenprüfung A1–A3, N1, N3) ══════════════════════════════════════════════

describe('RV-103 Nachzug · A2: StPO-Ergebnis ohne ZPO-Rechner-Hinweis', () => {
  const faelle: Array<[string, AllgFristInput]> = [
    ['NE Tage', ne],
    ['SO Tage', { start: '2026-04-21', laenge: 10, einheit: 'tage', ...basis, kanton: 'SO' }],
    ['ZH Monate', { start: '2026-01-31', laenge: 1, einheit: 'monate', ...basis, kanton: 'ZH' }],
    ['GL Wochen', { start: '2025-12-23', laenge: 2, einheit: 'wochen', ...basis, kanton: 'GL' }],
  ];
  it('StPO: Hinweise (Engine und Ergebnis-Hülle) tragen STPO_FRIST_HINWEIS, nie ALLG_FRIST_HINWEIS / «ZPO-Fristenrechner»', () => {
    for (const [name, f] of faelle) {
      const r = berechneAllgemeineFrist({ ...f, kontext: 'stpo' });
      expect(r.hinweise, name).toContain(STPO_FRIST_HINWEIS);
      expect(r.hinweise, name).not.toContain(ALLG_FRIST_HINWEIS);
      expect(r.hinweise.join('\n'), name).not.toMatch(/ZPO-Fristenrechner|SchKG-Fristenrechner/);
      const e = allgemeineFristErgebnis({ ...f, kontext: 'stpo' });
      expect(e.warnungen, name).toEqual(r.hinweise);
    }
  });
  it('Gegenprobe: Standard-Kontext und Vertragsfrist führen ALLG_FRIST_HINWEIS unverändert (an erster Stelle bzw. nach dem Vertragstext)', () => {
    for (const [name, f] of faelle) {
      expect(berechneAllgemeineFrist(f).hinweise[0], name).toBe(ALLG_FRIST_HINWEIS);
      expect(berechneAllgemeineFrist({ ...f, kontext: 'allgemein' }).hinweise[0], name).toBe(ALLG_FRIST_HINWEIS);
      const v = berechneAllgemeineFrist({ ...f, fristart: 'vertraglich' }).hinweise;
      expect(v[1], name).toBe(ALLG_FRIST_HINWEIS);
    }
  });
});

describe('RV-103 Nachzug · N1: Rechenweg im StPO-Kontext ohne OR-Norm für die Tagesfrist', () => {
  const grund = (f: AllgFristInput, label: string) =>
    berechneAllgemeineFrist(f).schritte.filter((s) => s.label.startsWith(label)).map((s) => s.grund);
  it('Tage: «ab Folgetag (Art. 90 Abs. 1 StPO)» statt Art. 77 Abs. 1 Ziff. 1/2 OR; Standard unverändert', () => {
    expect(grund({ ...ne, kontext: 'stpo' }, 'Rohes Fristende')).toEqual(['Kalendertage gezählt ab Folgetag (Art. 90 Abs. 1 StPO)']);
    expect(grund(ne, 'Rohes Fristende')).toEqual(['Kalendertage gezählt ab Folgetag (Art. 77 Abs. 1 Ziff. 1/2 OR)']);
  });
  it('Wochen: StPO nennt Art. 90 Abs. 1 StPO «für Wochen sinngemäss» (die StPO nennt nur «Tage»)', () => {
    const w: AllgFristInput = { ...ne, laenge: 2, einheit: 'wochen' };
    expect(grund({ ...w, kontext: 'stpo' }, 'Rohes Fristende'))
      .toEqual(['Kalendertage gezählt ab Folgetag (Art. 90 Abs. 1 StPO, für Wochen sinngemäss)']);
    expect(grund(w, 'Rohes Fristende')).toEqual(['Kalendertage gezählt ab Folgetag (Art. 77 Abs. 1 Ziff. 1/2 OR)']);
  });
  it('Monate/Jahre: Klemmung bleibt «Art. 77 OR sinngemäss» im StPO-Kontext, Standard wortgleich', () => {
    const geklemmt: AllgFristInput = { start: '2026-01-31', laenge: 1, einheit: 'monate', ...basis, kanton: 'ZH' };
    const glatt: AllgFristInput = { start: '2026-01-15', laenge: 1, einheit: 'monate', ...basis, kanton: 'ZH' };
    expect(grund({ ...geklemmt, kontext: 'stpo' }, 'Rohes Fristende'))
      .toEqual(['Kein gleichbezeichneter Tag im Zielmonat → letzter Tag des Monats (Art. 77 Abs. 1 Ziff. 3 OR sinngemäss)']);
    expect(grund(geklemmt, 'Rohes Fristende'))
      .toEqual(['Kein gleichbezeichneter Tag im Zielmonat → letzter Tag des Monats (Art. 77 Abs. 1 Ziff. 3 OR)']);
    expect(grund({ ...glatt, kontext: 'stpo' }, 'Rohes Fristende'))
      .toEqual(['Gleichbezeichneter Tag des Zielmonats (Art. 77 Abs. 1 Ziff. 3 OR sinngemäss)']);
    expect(grund(glatt, 'Rohes Fristende'))
      .toEqual(['Gleichbezeichneter Tag des Zielmonats (Art. 77 Abs. 1 Ziff. 3 OR; BGE 150 III 367)']);
  });
  it('bedingte Tage (NE-Schliesstag 6.4.2026, SO 1. Mai 2026) heissen «Feiertag bzw. gleichgestellter Tag», nicht «gesetzlicher Feiertag»', () => {
    const so: AllgFristInput = { start: '2026-04-21', laenge: 10, einheit: 'tage', ...basis, kanton: 'SO' };
    expect(berechneAllgemeineFrist({ ...ne, kontext: 'stpo' }).verschiebeGruende).toEqual(['06.04.2026 (Montag): Feiertag bzw. gleichgestellter Tag (NE)']);
    expect(berechneAllgemeineFrist({ ...so, kontext: 'stpo' }).verschiebeGruende[0]).toBe('01.05.2026 (Freitag): Feiertag bzw. gleichgestellter Tag (SO)');
    const rw = allgemeineFristErgebnis({ ...ne, kontext: 'stpo' }).rechenweg.map((z) => z.beschreibung).join('\n');
    expect(rw).toContain('Feiertag bzw. gleichgestellter Tag (NE)');
    expect(rw).not.toContain('gesetzlicher Feiertag');
  });
  it('Gegenprobe: ein Grundfeiertag bleibt auch im StPO-Kontext «gesetzlicher Feiertag» (ZH Ostermontag 6.4.2026); Standard-Wortlaut unverändert', () => {
    const zh: AllgFristInput = { ...ne, kanton: 'ZH' };
    expect(berechneAllgemeineFrist({ ...zh, kontext: 'stpo' }).verschiebeGruende).toEqual(['06.04.2026 (Montag): gesetzlicher Feiertag (ZH)']);
    expect(berechneAllgemeineFrist(zh).verschiebeGruende).toEqual(['06.04.2026 (Montag): gesetzlicher Feiertag (ZH)']);
  });
});

describe('RV-103 Nachzug · A1: Mechanik-Presets im StPO-Kontext', () => {
  it('mechanikPresetsFuer: im StPO-Kontext fehlt jeder Preset ohne Verschiebung (kalendertage_pur), im Standard sind alle da', () => {
    const stpo = mechanikPresetsFuer('stpo').map((p) => p.key);
    expect(stpo).toEqual(['tagesfrist', 'monatsfrist_or']);
    expect(mechanikPresetsFuer('allgemein')).toEqual(MECHANIK_PRESETS);
    expect(mechanikPresetsFuer(undefined)).toEqual(MECHANIK_PRESETS);
    expect(MECHANIK_PRESETS.map((p) => p.key)).toContain('kalendertage_pur');
  });
});

// ── Client-Läufe (linkedom): Klicks, Select-Wechsel, Seite ──
type Dom = Document & { defaultView: Window & typeof globalThis };
const klienten: Root[] = [];
afterEach(async () => {
  while (klienten.length) { const r = klienten.pop()!; await act(async () => r.unmount()); }
  vi.useRealTimers();
});
async function klient(el: ReactElement, search = '', hash = ''): Promise<Dom> {
  const { document } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  const ort = { search, hash, pathname: '/rechner/tagerechner', origin: 'https://lexmetrik.test' };
  vi.stubGlobal('window', { document, location: ort });
  vi.stubGlobal('document', document);
  vi.stubGlobal('location', ort);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const root = createRoot(document.getElementById('app') as unknown as HTMLElement);
  klienten.push(root);
  await act(async () => { root.render(el); });
  return document as unknown as Dom;
}
const knoepfe = (d: Dom, text: string) => [...d.querySelectorAll('button')].filter((b) => b.textContent?.trim() === text);
async function klick(d: Dom, el: Element) {
  await act(async () => { el.dispatchEvent(new d.defaultView.Event('click', { bubbles: true })); });
}
const fristende = (d: Dom) => /Fristende \(dies ad quem\)[\s\S]*?(\d\d\.\d\d\.\d{4}) · 24\.00 Uhr/.exec(d.body.innerHTML)?.[1];
const titel = (d: Dom) => (/Strafprozessuale Frist \(Art\. 90 StPO\)|Allgemeine Frist \(Art\. 77\/78 OR\)/.exec(d.body.innerHTML) ?? [])[0];
const GL_Q = '?s=2025-12-23&l=10&e=tage&w=1&f=1&k=GL&r=s';
const huelle = () => <LocaleProvider><MemoryRouter><AllgemeineFristForm /></MemoryRouter></LocaleProvider>;

describe('RV-103 Nachzug · A1: Klick auf einen Preset wirft den StPO-Modus nicht um', () => {
  it('GL, StPO-Link: «Tagesfrist (Kalendertage)» bleibt bei 02.01.2026 StPO (OR würde 05.01.2026 rechnen, GL 2.1. zählt nur ausserhalb StPO)', async () => {
    const d = await klient(huelle(), GL_Q);
    expect(fristende(d)).toBe('02.01.2026');
    expect(titel(d)).toBe('Strafprozessuale Frist (Art. 90 StPO)');
    expect(knoepfe(d, 'Tagesfrist (Kalendertage)')).toHaveLength(1);
    await klick(d, knoepfe(d, 'Tagesfrist (Kalendertage)')[0]);
    expect(fristende(d)).toBe('02.01.2026');
    expect(titel(d)).toBe('Strafprozessuale Frist (Art. 90 StPO)');
  });
  it('«Monatsfrist (gesetzlich)» übernimmt Länge/Einheit und bleibt im StPO-Kontext', async () => {
    const d = await klient(huelle(), GL_Q);
    await klick(d, knoepfe(d, 'Monatsfrist (gesetzlich)')[0]);
    expect(titel(d)).toBe('Strafprozessuale Frist (Art. 90 StPO)');
    expect(fristende(d)).toBe('23.01.2026');
    expect((d.querySelector('input[type="number"]') as unknown as HTMLInputElement).value).toBe('1');
  });
  it('«Kalendertage ohne Verschiebung» (mit Art. 90 Abs. 2 StPO unvereinbar) wird im StPO-Modus nicht angeboten, im Standard-Modus schon', async () => {
    const d = await klient(huelle(), GL_Q);
    expect(knoepfe(d, 'Kalendertage ohne Verschiebung')).toHaveLength(0);
    expect(form(GL_Q.replace('&r=s', ''))).toContain('Kalendertage ohne Verschiebung');
  });
  it('Standard-Modus: Preset «Kalendertage ohne Verschiebung» rechnet weiter nach OR (GL 23.12.2025 + 10 Tage, ohne Verschiebung: 02.01.2026)', async () => {
    const d = await klient(huelle(), GL_Q.replace('&r=s', ''));
    expect(fristende(d)).toBe('05.01.2026');
    await klick(d, knoepfe(d, 'Kalendertage ohne Verschiebung')[0]);
    expect(titel(d)).toBe('Allgemeine Frist (Art. 77/78 OR)');
    expect(fristende(d)).toBe('02.01.2026');
  });
  it('S8 · Fach-Preset (Familienrecht, ohne Verschiebung) setzt den StPO-Kontext sichtbar zurück und rechnet danach (kein «kein Ergebnis» am Engine-Guard)', async () => {
    const d = await klient(huelle(), GL_Q);
    await klick(d, knoepfe(d, 'Kündigung einfache Gesellschaft – 6 Monate')[0]);
    expect(titel(d)).toBe('Allgemeine Frist (Art. 77/78 OR)');
    expect(fristende(d)).toBe('23.06.2026');
    // sichtbar: Titel und StPO-Disclaimer wechseln mit (linkedom bildet die Select-Auswahl nach React-Updates nicht ab)
    expect(d.body.innerHTML).not.toContain('Art. 90 StPO');
  });
});

describe('RV-103 Nachzug · A3: ICS-Norm und PDF-Rechtsgrundlage nennen das Regime', () => {
  it('S5 · ICS: StPO nennt «Art. 90 StPO» und keinen OR-Artikel; Standard «Art. 77/78 OR»', async () => {
    abgriff.ics.length = 0;
    const d = await klient(huelle(), NE_Q + '&r=s');
    await klick(d, knoepfe(d, 'In Kalender (.ics)')[0]);
    expect(abgriff.ics).toHaveLength(1);
    expect(abgriff.ics[0]).toContain('(Art. 90 StPO)');
    expect(abgriff.ics[0]).toContain('(StPO)');
    expect(abgriff.ics[0]).not.toContain('Art. 77/78 OR');
    const o = await klient(huelle(), NE_Q);
    await klick(o, knoepfe(o, 'In Kalender (.ics)')[0]);
    expect(abgriff.ics).toHaveLength(2);
    expect(abgriff.ics[1]).toContain('(Art. 77/78 OR)');
    expect(abgriff.ics[1]).not.toContain('StPO');
  });
  it('S6 · PDF: StPO «Berechnung nach Art. 90 StPO» / Titel «Strafprozessuale Frist»; Standard «Berechnung nach Art. 77/78 OR»', () => {
    abgriff.pdf.length = 0;
    form(NE_Q + '&r=s');
    form(NE_Q);
    expect(abgriff.pdf).toHaveLength(2);
    expect(abgriff.pdf[0]).toMatchObject({ title: 'Strafprozessuale Frist', rechtsgrundlage: 'Berechnung nach Art. 90 StPO' });
    expect(abgriff.pdf[0].disclaimer).toContain('Art. 90 StPO');
    expect(abgriff.pdf[1]).toMatchObject({ title: 'Allgemeine Frist', rechtsgrundlage: 'Berechnung nach Art. 77/78 OR' });
  });
});

// ── Seite: die Live-Brücke «Strafverfahren (StPO)» oben → Allgemein-Formular unten ──
describe('RV-103 Nachzug · A3: Seiten-Verdrahtung des Tagerechners (Live-Brücke StPO)', () => {
  const seite = (hash = '') => <LocaleProvider><MemoryRouter initialEntries={[`/rechner/tagerechner${hash}`]}><RechnerTagerechner /></MemoryRouter></LocaleProvider>;
  async function waehleRegime(d: Dom, code: string) {
    const radio = d.querySelector(`input[name="einfache-frist-ferien"][value="${code}"]`) as unknown as HTMLInputElement;
    radio.checked = true; // linkedom: das Radio schaltet nicht selbst um; React vergleicht `checked` mit dem Tracker
    await klick(d, radio);
  }
  async function waehleKanton(d: Dom, kanton: string) {
    const sel = d.querySelector('select option[value="NE"]')!.parentElement as unknown as HTMLSelectElement;
    sel.querySelector('option[selected]')?.removeAttribute('selected');
    sel.querySelector(`option[value="${kanton}"]`)!.setAttribute('selected', '');
    await act(async () => { sel.dispatchEvent(new (sel.ownerDocument.defaultView as unknown as { Event: typeof Event }).Event('change', { bubbles: true })); });
  }
  const unten = (d: Dom) => d.body.innerHTML.slice(d.body.innerHTML.indexOf('Mit Vorauswahl'));

  it('S1/S2 · oben «Strafverfahren (StPO)» + NE: das Allgemein-Formular unten rechnet StPO (07.04.2026), «Keine Ferien» zurück → OR (06.04.2026)', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 2, 27, 10, 0, 0));
    const d = await klient(seite());
    await waehleKanton(d, 'NE');
    await waehleRegime(d, 'stpo');
    expect(unten(d)).toContain('Strafprozessuale Frist (Art. 90 StPO)');
    expect(unten(d)).toContain('07.04.2026 · 24.00 Uhr');
    await waehleRegime(d, 'keine');
    expect(unten(d)).toContain('Allgemeine Frist (Art. 77/78 OR)');
    expect(unten(d)).toContain('06.04.2026 · 24.00 Uhr');
    expect(unten(d)).not.toContain('Art. 90 StPO');
  });
  it('S2 · von Tab «ZPO» (#zpo) aus schaltet die Wahl «Strafverfahren (StPO)» auf den Allgemein-Tab um', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 2, 27, 10, 0, 0));
    const d = await klient(seite('#zpo'));
    expect(unten(d)).not.toContain('Strafprozessuale Frist (Art. 90 StPO)');
    await waehleRegime(d, 'stpo');
    expect(unten(d)).toContain('Strafprozessuale Frist (Art. 90 StPO)');
    expect(unten(d)).not.toContain('Gerichtsferien (Art. 145 ZPO)');
  });
  it('N3 · Untertitel des Tabs «Allgemein» nennt auch Strafverfahrensfristen (Fristart StPO)', () => {
    const html = renderToString(seite());
    expect(html).toContain('Vertrags- und Verwirkungsfristen nach OR/ZGB sowie Strafverfahrensfristen (Fristart StPO)');
  });
});
