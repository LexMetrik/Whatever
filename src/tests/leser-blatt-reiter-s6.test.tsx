/**
 * W2·29-WERKBANK-LESER S6 · W1cd (23.9.2026) — die Reiter Änderungen,
 * Materialien, Erläuterungen und Werkzeuge des Erlass-Blatts.
 *
 * Anlass: Befund-Sammlung S6 (Prüfer Opus/Sonnet, 23.9.2026) und der Entscheid
 * David 23.9.2026 «es soll werkzeuge und behördliche erläuterungen heissen …»,
 * auf Nachfrage «Zwei eigene Reiter». Geprüft wird je Befund die AUSSAGE, die
 * die Fläche macht — nicht ihr Markup.
 */
import { describe, expect, it } from 'vitest';
import { renderToString as rohRender } from 'react-dom/server';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { PANEL_REITER, alsPanelReiter, reiterTitel } from '../pages/gesetz-leser/v3/panelModell';
import { liesBlatt } from '../pages/gesetz-leser/v3/blattGedaechtnis';
import { VERNEHMLASSUNG_STATUS_LABEL, vernehmlassungInArbeit, type VernehmlassungBezug } from '../lib/materialien/vernehmlassungen';
import { PanelMaterialien } from '../pages/gesetz-leser/v3/PanelMaterialien';
import { PanelErlaeuterungen } from '../pages/gesetz-leser/v3/PanelErlaeuterungen';
import { PanelWerkzeuge } from '../pages/gesetz-leser/v3/PanelWerkzeuge';
import { PanelAenderungen } from '../pages/gesetz-leser/v3/PanelAenderungen';
import { ordneErlaeuterungen, natuerlich } from '../pages/gesetz-leser/v3/erlaeuterungModell';
import { werkzeugAnsicht } from '../pages/gesetz-leser/v3/werkzeugModell';
import { aufhebungsBezug, trifftArtikel, type RevisionZeile } from '../pages/gesetz-leser/v3/aenderungModell';
import { ARTIKEL_WERKZEUGE, ERLASS_WERKZEUGE, type MaterialBezug } from '../lib/normtext/werkzeuge';
import type { BotschaftBezug } from '../lib/materialien/botschaften';
import type { RevisionBezug } from '../lib/normtext/revisionen';
import type { MaterialStand } from '../pages/gesetz-leser/v3/panelKontextLaden';

/** SSR setzt zwischen zwei Textknoten `<!-- -->` — geprüft wird der gelesene
 *  Text, nicht die Knotengrenze. */
function renderToString(el: ReactElement): string {
  return rohRender(el).replace(/<!-- -->/g, '');
}

// ─── Reiter-Ordnung (AN-11, Entscheid David) ────────────────────────────────
describe('PANEL_REITER — fünf Reiter, «Anwendung» geteilt', () => {
  it('Entscheide · Änderungen · Materialien · Erläuterungen · Werkzeuge', () => {
    expect(PANEL_REITER.map((r) => r.label)).toEqual(['Entscheide', 'Änderungen', 'Materialien', 'Erläuterungen', 'Werkzeuge']);
  });
  it('ein gespeicherter Alt-Reiter «anwendung» fällt auf einen GÜLTIGEN Reiter', () => {
    expect(alsPanelReiter('anwendung')).toBe('erlaeuterungen');
    expect(alsPanelReiter('werkzeuge')).toBe('werkzeuge');
    expect(alsPanelReiter('gibtsnicht')).toBeNull();
    expect(alsPanelReiter(undefined)).toBeNull();
  });
  // Zusammenführung mit S6-W1a (#1002): das Blatt-Gedächtnis ist der Leser
  // gespeicherter Reiter-Werte — ein vor S6 gemerktes «anwendung» öffnet den
  // Nachfolger, statt verworfen zu werden (rot vor dem Anschluss: `null`).
  it('das Blatt-Gedächtnis liest einen gemerkten «anwendung» als «erlaeuterungen»', () => {
    const s = { getItem: (k: string) => (k === 'lm-erlass-blatt:OR' ? JSON.stringify({ offen: true, reiter: 'anwendung' }) : null) };
    expect(liesBlatt('OR', s)).toEqual({ offen: true, reiter: 'erlaeuterungen' });
  });
  it('«Materialien» heisst Gesetzgebung, «Erläuterungen» Behörden', () => {
    expect(reiterTitel('materialien', 'Artikel')).toBe('Gesetzgebungsmaterialien zu diesem Erlass');
    expect(reiterTitel('erlaeuterungen', 'Artikel')).toBe('Behördliche Erläuterungen zu diesem Erlass');
  });
});

// ─── Materialien (M-1, M-2, M-3, M-6, M-8) ─────────────────────────────────
function vl(key: string, status: VernehmlassungBezug['status']): VernehmlassungBezug {
  return { key, titel: `Verfahren ${key}`, status, quelleUrl: `https://www.fedlex.admin.ch/eli/dl/proj/${key}/de` };
}
const BOT: BotschaftBezug = {
  key: 'BOT-1', titel: 'Botschaft zur Änderung', nummer: '19.043', quelleUrl: 'https://www.fedlex.admin.ch/eli/fga/2019/1/de',
  stand: '2019-05-29', parlamentUrl: null,
};
function materialien(w: Partial<MaterialStand>, erneut?: () => void) {
  const wert: MaterialStand = { botschaften: [], vernehmlassungen: [], kanton: [], erzeugt: '2026-09-18', ...w };
  return renderToString(<PanelMaterialien stand={{ fertig: true, wert, erneut }} ebene="bund"
    aenderungNachBotschaft={new Map([['BOT-1', 'AS 2020 957']])} />);
}

describe('Reiter «Materialien» — nur Gesetzgebung, amtlich beschriftet', () => {
  it('M-2: Status-Etiketten wörtlich nach Fedlex consultation-status (Abruf 23.9.2026)', () => {
    expect(VERNEHMLASSUNG_STATUS_LABEL['abgeschlossen-bericht']).toBe('Abgeschlossen – abwarten Ergebnisbericht');
    expect(VERNEHMLASSUNG_STATUS_LABEL['abgeschlossen-stellungnahmen']).toBe('Abgeschlossen – abwarten Stellungnahmen und/oder des Ergebnisberichts');
    expect(VERNEHMLASSUNG_STATUS_LABEL.zurueckgezogen).toBe('Zurückgezogen');
  });
  it('M-1: «In Arbeit» zählt nur laufende/geplante/in Vorbereitung', () => {
    expect(['laufend', 'geplant', 'in-vorbereitung'].every((s) => vernehmlassungInArbeit(s as never))).toBe(true);
    expect(['abgeschlossen', 'abgeschlossen-bericht', 'zurueckgezogen'].some((s) => vernehmlassungInArbeit(s as never))).toBe(false);
    const html = materialien({ vernehmlassungen: [vl('a', 'abgeschlossen'), vl('b', 'laufend'), vl('c', 'zurueckgezogen')] });
    const inArbeit = html.slice(html.indexOf('data-v3-panel-material="vernehmlassungen"'), html.indexOf('data-v3-panel-material="vernehmlassungen-erledigt"'));
    expect(inArbeit).toContain('Verfahren b');
    expect(inArbeit).not.toContain('Verfahren a');
    expect(html).toContain('Vernehmlassungen (abgeschlossen oder zurückgezogen)');
  });
  it('nur Abgeschlossenes ⇒ KEIN Abschnitt «In Arbeit»', () => {
    const html = materialien({ vernehmlassungen: [vl('a', 'abgeschlossen')] });
    expect(html).not.toContain('In Arbeit');
    expect(html).toContain('Vernehmlassungen (abgeschlossen)');
  });
  it('M-3: kantonale Ratschläge stehen da', () => {
    const html = materialien({ kanton: [{ key: 'BS-GR-24.1692', titel: 'Ratschlag betreffend Änderung', doktypLabel: 'Ratschlag', behoerdeKuerzel: 'GR BS', nummer: '24.1692', stand: '2024-11-20', quelleUrl: 'https://grosserrat.bs.ch/?gnr=24.1692', hinweis: null }] });
    expect(html).toContain('Ratschläge und Berichte an den Grossen Rat');
    expect(html).toContain('24.1692');
  });
  it('M-6: §8-Zeile mit «nicht geprüft», Abdeckung und Datenstand; Revisions-Verweis nur belegt', () => {
    const html = materialien({ botschaften: [BOT] });
    expect(html).toContain('fachlich nicht geprüft');
    expect(html).toContain('Botschaften ab 31.03.1999');
    expect(html).toContain('Datenstand 18.09.2026');
    expect(html).toContain('führte zur Änderung AS 2020 957');
  });
  it('M-8: Ladefehler mit «Erneut laden», Ausweg heisst «Fedlex», nicht «Amtliche Fassung»', () => {
    const html = renderToString(<PanelMaterialien stand={{ fertig: true, wert: { botschaften: null, vernehmlassungen: null, kanton: null, erzeugt: null }, erneut: () => {} }} ebene="bund" />);
    expect(html).toContain('konnten nicht geladen werden');
    expect(html).toContain('Erneut laden');
    expect(html).toContain('Fedlex ↗');
    expect(html).not.toContain('Amtliche Fassung');
  });
});

// ─── Erläuterungen (AN-3/4/8/9) ─────────────────────────────────────────────
function mb(key: string, p: Partial<MaterialBezug>): MaterialBezug {
  return { key, titel: key, behoerdeKuerzel: 'ESTV', doktypLabel: 'Kreisschreiben', nummer: null, pfad: `/materialien/${key}`, herkunft: 'amtlich', stand: '2024-01-01', ...p };
}
describe('Reiter «Erläuterungen» — Ordnung ohne Aufblähung', () => {
  it('natürliche Sortierung: Nr. 5 < Nr. 11 < Nr. 11a', () => {
    expect(['Nr. 11a', 'Nr. 11', 'Nr. 5'].sort(natuerlich)).toEqual(['Nr. 5', 'Nr. 11', 'Nr. 11a']);
  });
  it('AN-8: Anhänge hängen am Kreisschreiben, artikelweise Wegleitung ist EIN Posten', () => {
    const liste = [
      mb('KS-11', { nummer: 'Nr. 11' }), mb('KS-5', { nummer: 'Nr. 5' }),
      mb('KS-37', { nummer: 'Nr. 37' }), mb('KS-37-A1', { nummer: 'Nr. 37 · Anhang 1', doktypLabel: 'KS-Anhang' }),
      ...['1', '10', '2', '3a'].map((n) => mb(`WL-${n}`, { behoerdeKuerzel: 'SECO', doktypLabel: 'Wegleitung', nummer: `Art. ${n}` })),
    ];
    const posten = ordneErlaeuterungen(liste);
    expect(posten).toHaveLength(4);
    const ks = posten.filter((p) => p.art === 'dokument').map((p) => p.art === 'dokument' ? p.m.nummer : '');
    expect(ks).toEqual(['Nr. 5', 'Nr. 11', 'Nr. 37']);
    const k37 = posten.find((p) => p.art === 'dokument' && p.m.key === 'KS-37');
    expect(k37?.art === 'dokument' && k37.anhaenge.map((a) => a.key)).toEqual(['KS-37-A1']);
    const reihe = posten.find((p) => p.art === 'reihe');
    expect(reihe?.art === 'reihe' && reihe.teile.map((t) => t.nummer)).toEqual(['Art. 1', 'Art. 2', 'Art. 3a', 'Art. 10']);
  });
  it('ein Anhang ohne sein Hauptdokument bleibt sichtbar (§8)', () => {
    const posten = ordneErlaeuterungen([mb('A', { nummer: 'Nr. 99 · Anhang' })]);
    expect(posten).toHaveLength(1);
  });
  it('AN-4: Ladefehler ≠ «nichts erfasst»', () => {
    const html = renderToString(<MemoryRouter><PanelErlaeuterungen stand={{ fertig: true, wert: null, erneut: () => {} }} /></MemoryRouter>);
    expect(html).toContain('konnten nicht geladen werden');
    expect(html).not.toContain('erfasst');
    expect(html).toContain('Erneut laden');
  });
  it('AN-9: Stand beschriftet, Datenstand, Marke «maschinell», Hinweis vor Artikeländerung', () => {
    const shard = { erlass: 'DBG', proArtikel: { '33': { iso: '2025-01-01', as: 'AS 2024 1' } } };
    const html = renderToString(<MemoryRouter><PanelErlaeuterungen
      stand={{ fertig: true, wert: { erzeugt: '2026-09-18', liste: [mb('K', { nummer: 'Nr. 1', herkunft: 'maschinell', artikel: '33', stand: '2020-02-01' })] } }}
      revisionShard={shard} /></MemoryRouter>);
    expect(html).toContain('Stand der Veröffentlichung 01.02.2020');
    expect(html).toContain('Datenstand 18.09.2026');
    expect(html).toContain('kein Gesetzesrang');
    expect(html).toContain('Dokument-Stand vor der letzten Änderung von Art. 33');
    expect(html).toMatch(/maschinell/i);
  });
});

// ─── Werkzeuge (AN-7/B-10, AN-12) ───────────────────────────────────────────
describe('Reiter «Werkzeuge» — je Werkzeug EINE Zeile', () => {
  const erlasse = [...new Set([...ARTIKEL_WERKZEUGE.map((k) => k.erlass), ...Object.keys(ERLASS_WERKZEUGE)])];
  it('AN-7: kein Werkzeug steht zweimal, an keinem Erlass', () => {
    for (const e of erlasse) {
      const a = werkzeugAnsicht(e);
      const ids = [...a.verfuegbar, ...a.geplant].map((z) => z.id);
      expect(new Set(ids).size, e).toBe(ids.length);
    }
  });
  it('OR: der Verjährungsrechner steht einmal, mit mehreren Artikelbereichen', () => {
    const v = werkzeugAnsicht('OR').verfuegbar.find((z) => z.id === 'verjaehrung');
    expect(v).toBeDefined();
    expect(v!.artikel.length).toBeGreaterThan(1);
  });
  it('AN-12: geplante Werkzeuge erscheinen «In Vorbereitung» und nie verlinkt', () => {
    const geplant = erlasse.flatMap((e) => werkzeugAnsicht(e).geplant);
    expect(geplant.length).toBeGreaterThan(0);
    expect(geplant.every((z) => z.href === null && z.status === 'geplant')).toBe(true);
    const mit = erlasse.find((e) => werkzeugAnsicht(e).geplant.length > 0)!;
    const html = renderToString(<MemoryRouter><PanelWerkzeuge erlassKey={mit} /></MemoryRouter>);
    expect(html).toContain('In Vorbereitung');
  });
  it('B-10: die Zahl im Kopf ist die Zahl der verfügbaren Werkzeuge', () => {
    const a = werkzeugAnsicht('OR');
    const html = renderToString(<MemoryRouter><PanelWerkzeuge erlassKey="OR" /></MemoryRouter>);
    expect((html.match(/data-v3-werkzeug="/g) ?? []).length).toBe(a.verfuegbar.length);
  });
  // Nachzug #1016 (S6-D6, 24.9.2026): die Kanten tragen exakte Suffix-Grenzen.
  // Das Etikett nennt sie («Art. 324a–324b», nicht «Art. 324» — Art. 324 OR ist
  // der Annahmeverzug des Arbeitgebers), und die Reihenfolge ist die amtliche.
  it('D6: Artikel-Etikett suffix-exakt, amtliche Reihenfolge', () => {
    const artikelVon = (e: string, id: string) =>
      [...werkzeugAnsicht(e).verfuegbar, ...werkzeugAnsicht(e).geplant].find((z) => z.id === id)?.artikel.map((a) => a.label);
    expect(artikelVon('OR', 'lohnfortzahlung')).toEqual(['Art. 324a–324b']);
    expect(artikelVon('SCHKG', 'nichtbekanntgabe-betreibung')).toEqual(['Art. 8a']);
    expect(artikelVon('OR', 'kuendigung-sperrfristen')).toEqual(['Art. 335–335c', 'Art. 336c']);
  });
  it('AN-14: der Beleg ist per Aufklappen erreichbar (nicht nur im title)', () => {
    const html = renderToString(<MemoryRouter><PanelWerkzeuge erlassKey="OR" /></MemoryRouter>);
    expect(html).toContain('data-v3-werkzeug-beleg');
    expect(html).toContain('<summary');
  });
});

// ─── Änderungen (AE-6, AE-7, AE-8, AE-9) ────────────────────────────────────
function rev(p: Partial<RevisionBezug>): RevisionBezug {
  return { art: 'aenderung', dateEntryInForce: '2020-01-01', titelDe: 'Änderung', quelleUrl: 'https://www.fedlex.admin.ch/eli/oc/2020/1/de', ...p };
}
function aenderungen(revisionen: RevisionZeile[], extra: Partial<Parameters<typeof PanelAenderungen>[0]> = {}) {
  return renderToString(<PanelAenderungen stand={{ fertig: true, wert: { revisionen, reichweite: null } }}
    quelleUrl="https://www.fedlex.admin.ch/eli/cc/x/de" stichtag="2026-09-21" {...extra} />);
}
const BMV_AUFHEBUNG = { seit: '2026-03-01', nachfolger: { sr: '412.103.1', titel: 'Verordnung vom 13. Juni 2025 …', eli: 'cc/2025/408', inKraftSeit: '2026-03-01' } };
const NACHFOLGER = rev({ dateEntryInForce: '2026-03-01', nichtKonsolidiert: true, ocUri: 'https://fedlex.data.admin.ch/eli/oc/2025/408', roFundstelle: 'AS 2025 408' });

describe('Reiter «Änderungen» — Schärfung', () => {
  it('AE-6: der Nachfolger eines aufgehobenen Erlasses ist keine «Änderung, in Kraft»', () => {
    expect(aufhebungsBezug(NACHFOLGER, BMV_AUFHEBUNG)).toBe('nachfolger');
    expect(aufhebungsBezug(rev({ dateEntryInForce: '2016-08-01' }), BMV_AUFHEBUNG)).toBeNull();
    const html = aenderungen([NACHFOLGER, rev({ dateEntryInForce: '2016-08-01' })], { aufhebung: BMV_AUFHEBUNG });
    expect(html).toContain('Nachfolge-Erlass');
    expect(html).not.toContain('in Kraft seit 01.03.2026, im hier gezeigten Text');
  });
  it('AE-7: «in Kraft für die Schweiz seit», Berichtigungs-Hinweis, Botschafts-Link', () => {
    const html = aenderungen([
      rev({ dateEntryInForce: '2021-02-01', dateInKraftFuerCh: '2020-06-01', botschaftKey: 'BOT-1' }),
      rev({ dateEntryInForce: '2019-01-01', plausibilitaet: 'berichtigung-fremdes-as-dokument' }),
    ], { botschaftNachKey: new Map([['BOT-1', BOT]]) });
    expect(html).toContain('in Kraft für die Schweiz seit 01.06.2020');
    expect(html).toContain('Botschaft 19.043');
    expect(html).toContain('jolux:rectifies');
  });
  it('AE-8: die letzte Änderung des gelesenen Artikels ist markiert und genannt', () => {
    expect(trifftArtikel({ roFundstelle: 'AS 2023  680' }, { iso: '2024-01-01', as: 'AS 2023 680' })).toBe(true);
    expect(trifftArtikel({ roFundstelle: 'AS 2023 680' }, { iso: '2024-01-01', as: '' })).toBe(false);
    const html = aenderungen([rev({ dateEntryInForce: '2024-01-01', roFundstelle: 'AS 2023 680' })],
      { artikel: { label: 'Art. 336c', revision: { iso: '2024-01-01', as: 'AS 2023 680' } } });
    expect(html).toContain('Art. 336c zuletzt geändert durch AS 2023 680');
    expect(html).toContain('betrifft Art. 336c');
    expect(html).toContain('data-v3-panel-aenderung-artikel');
  });
  it('AE-9: das Datum trägt «in Kraft seit»; Kanton ohne Sidecar sagt, dass nichts erfasst ist', () => {
    expect(aenderungen([rev({ dateEntryInForce: '2020-01-01' })])).toContain('in Kraft seit 01.01.2020');
    const kanton = renderToString(<PanelAenderungen stand={{ fertig: true, wert: null }} quelleUrl="https://x" stichtag={null} ebene="kanton" />);
    expect(kanton).toContain('für kantonale Erlasse bisher nicht erfasst');
    expect(kanton).not.toContain('nicht erreichbar');
  });
});

// ─── Vorwärts-verträglich mit den Pfad-(c)-Sidecars (#1001, Hinweis Haupt-Session) ─
// Alle Felder optional: die Anzeige muss mit alten UND neuen Sidecars stimmen.
describe('Reiter «Änderungen» — neue Sidecar-Felder (#1001), optional gelesen', () => {
  const OC = 'https://fedlex.data.admin.ch/eli/oc/2020/4005';
  const E1 = { ...rev({ dateEntryInForce: '2021-01-01', ocUri: OC, roFundstelle: 'AS 2020 4005' }), etappen: ['2021-01-01', '2023-01-01'] };
  const E2 = { ...rev({ dateEntryInForce: '2023-01-01', ocUri: OC, roFundstelle: 'AS 2020 4005' }), etappen: ['2021-01-01', '2023-01-01'] };
  it('gestaffelte Etappen: beide Zeilen stehen, jede nennt die Etappen', () => {
    const html = aenderungen([E2, E1]);
    expect((html.match(/data-v3-panel-aenderung-etappen/g) ?? []).length).toBe(2);
    expect(html).toContain('gestaffelt in Kraft: 01.01.2021 · 01.01.2023');
  });
  it('AE-8 mit Etappen: markiert wird die Etappe mit dem Datum des Artikel-Shards', () => {
    const html = aenderungen([E2, E1], { artikel: { label: 'Art. 1', revision: { iso: '2023-01-01', as: 'AS 2020 4005' } } });
    expect((html.match(/data-v3-panel-aenderung-artikel=""/g) ?? []).length).toBe(1);
  });
  it('Wirkung «Berichtigung» als Marke; «vollständige Aufhebung» auch ohne Register-Eintrag', () => {
    const html = aenderungen([
      { ...rev({ dateEntryInForce: '2016-08-23' }), wirkungen: ['berichtigung'] },
      { ...rev({ dateEntryInForce: '2026-03-01', nichtKonsolidiert: true }), wirkungen: ['vollstaendige-aufhebung'] },
    ]);
    expect(html).toContain('Berichtigung');
    expect(html).toContain('Hebt diesen Erlass auf');
    expect(html).not.toContain('in Kraft seit 01.03.2026, im hier gezeigten Text');
  });
  it('datumAusErlass: §8-Hinweis, dass das Datum abweichen kann', () => {
    const html = aenderungen([{ ...rev({ dateEntryInForce: '2019-01-01' }), datumAusErlass: true }]);
    expect(html).toContain('Inkrafttreten des ändernden Erlasses');
  });
  it('Marker heisst «Fassung ohne zugeordneten Erlass» (richtig für alte und neue Sidecars)', () => {
    const html = aenderungen([rev({ art: 'sammelerlass-marker', dateEntryInForce: '2013-01-01', titelDe: undefined })]);
    expect(html).toContain('Fassung ohne zugeordneten Erlass');
    expect(html).not.toMatch(/>Sammelerlass</);
  });
});
