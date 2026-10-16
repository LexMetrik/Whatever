/**
 * LESER-NAV O-50 · Leser-Panel: Artikel-Teil und Erlass-Teil sagen dasselbe
 * (Posten W3-8 und «Sonden-Familie Artikel-Teil bei ausgefallener Quelle»).
 *
 * (1) Reiter «Werkzeuge»: Erlasse, deren Werkzeuge ALLE nur «in Vorbereitung» sind
 *     (gemessen 16.10.2026 mit `werkzeugAnsicht` über das ganze Register: VVG, AIG,
 *     AHVG, DSG, StG, ArG, DBG) zeigten «Rechner und Vorlagen 0» samt dem Satz
 *     «Dem Erlass als Ganzem zugeordnet …» über einer leeren Liste.
 * (2) Reiter «Änderungen» am Bund: ohne Änderungs-Sidecar (`wert === null`) sagt die
 *     Tafel «keiner erfasst, oder die Quelle war nicht erreichbar»; die Leerzeile des
 *     Artikels sagte «nichts erfasst» — stärker — und die Tafel stand zugeklappt.
 *
 * ROT ZU BEKOMMEN (§6.7, gefahren 16.10.2026): in `PanelWerkzeuge` die Frühweiche
 * `verfuegbar.length === 0` auf `verfuegbar.length === 0 && geplant.length === 0`
 * zurücksetzen ⇒ Fall (1) rot; in `PanelTafeln` `aenderungenOhneAuskunft` auf
 * `ebene === 'kanton' && …` zurücksetzen ⇒ Fall (2) rot.
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { parseHTML } from 'linkedom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePanelTafeln } from '../pages/gesetz-leser/v3/PanelTafeln';
import { PanelWerkzeuge } from '../pages/gesetz-leser/v3/PanelWerkzeuge';
import { werkzeugAnsicht } from '../pages/gesetz-leser/v3/werkzeugModell';
import { ERLASS_REGISTER } from '../lib/normtext/register';
import type { NormSnapshot } from '../lib/normtext/typen';

const html = (key: string) => renderToString(<MemoryRouter><PanelWerkzeuge erlassKey={key} /></MemoryRouter>)
  .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

describe('O-50 · Werkzeuge: kein Kopf «Rechner und Vorlagen 0» über leerer Liste', () => {
  const nurGeplant = ERLASS_REGISTER.map((e) => e.key)
    .filter((k) => { const a = werkzeugAnsicht(k); return a.verfuegbar.length === 0 && a.geplant.length > 0; });

  it('die Messung sieht die Erlasse (ARG, AHVG darunter)', () => {
    expect(nurGeplant).toEqual(expect.arrayContaining(['ARG', 'AHVG']));
  });

  it('jeder dieser Erlasse sagt «keinen Rechner», führt das Vorbereitete auf und trägt weder Kopf noch Zuordnungssatz', () => {
    for (const k of nurGeplant) {
      const t = html(k);
      expect(t, k).toContain('Zu diesem Erlass führen wir bisher keinen Rechner und keine Vorlage.');
      expect(t, k).toContain('In Vorbereitung');
      expect(t, k).not.toContain('Rechner und Vorlagen');
      expect(t, k).not.toContain('Dem Erlass als Ganzem zugeordnet');
    }
  });

  it('Gegenprobe: OR (verfügbare Werkzeuge) behält Kopf und Zuordnungssatz', () => {
    const t = html('OR');
    expect(t).toContain('Rechner und Vorlagen');
    expect(t).toContain('Eindeutige Zuordnungen zu Artikeln');
    expect(t).not.toContain('keinen Rechner und keine Vorlage');
  });

  it('ein Erlass ganz ohne Werkzeug (auch ohne Vorbereitetes) sagt nur den einen Satz', () => {
    const leer = ERLASS_REGISTER.map((e) => e.key).find((k) => { const a = werkzeugAnsicht(k); return a.verfuegbar.length === 0 && a.geplant.length === 0; });
    expect(leer).toBeDefined();
    const t = html(leer!);
    expect(t).toContain('keinen Rechner und keine Vorlage');
    expect(t).not.toContain('In Vorbereitung');
  });
});

// ── Änderungen: Artikel-Teil erbt den Zustand des Erlass-Teils ───────────────
const eintrag = (erlass: string, art: string) => ({
  id: `bund/${erlass}/art_${art}`, ebene: 'bund', quelle: erlass, erlass, artikel: art, artikelLabel: `Art. ${art}`,
  bloecke: [{ absatz: null, text: 'x' }], stand: '2026-05-22', quelleUrl: 'https://www.fedlex.admin.ch/', abgerufen: '2026-10-01', fassungsToken: '20260522', sha: 'x',
} as unknown as NormSnapshot);

let root: Root | null = null;
afterEach(async () => {
  if (root) { const r = root; root = null; await act(async () => r.unmount()); }
  vi.unstubAllGlobals();
});

async function aenderungenText(erlass: string, art: string, ebene: 'bund' | 'kanton', status: number): Promise<string> {
  const { document, window } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  vi.stubGlobal('window', Object.assign(window, { setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout }));
  vi.stubGlobal('document', document);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status, json: async () => null }) as unknown as Response));
  const ziel = document.getElementById('app') as unknown as HTMLElement;
  function Sonde() {
    const t = usePanelTafeln({
      erlassKey: erlass, laden: true, quelleUrl: 'https://www.fedlex.admin.ch/', ebene, stichtag: null,
      aktArtikel: art, artikelLabel: `Art. ${art}`, blatt: { eintrag: eintrag(erlass, art), historie: undefined },
      normZitat: `Art. ${art} ${erlass}`, wort: 'Artikel', erlassSr: '220', inkraftSeit: '1912-01-01', inkraftGestaffelt: false,
      historie: { wert: null, fertig: true },
    });
    return createElement('div', null, t.tafeln.aenderungen);
  }
  root = createRoot(ziel);
  await act(async () => { root!.render(createElement(MemoryRouter, null, createElement(Sonde))); });
  for (let i = 0; i < 5; i++) await act(async () => { await new Promise((r) => setTimeout(r, 5)); });
  return (ziel.textContent ?? '').replace(/\s+/g, ' ');
}

describe('O-50 · Änderungen am Bund ohne Sidecar: keine eigene Leerzeile, die Tafel steht offen', () => {
  it('OR Art. 41, alle Abrufe 404 ⇒ «Kein Änderungsverlauf verfügbar», kein «Zu Art. 41 nichts erfasst», keine Klappzeile', async () => {
    const t = await aenderungenText('OR', '41', 'bund', 404);
    expect(t).toContain('Kein Änderungsverlauf verfügbar');
    expect(t).not.toContain('nichts erfasst');
    expect(t).not.toContain('Alle Änderungen des Erlasses');
  });

  it('Kanton bleibt wie bisher (W3-4): Abdeckungssatz offen, keine Artikel-Leerzeile', async () => {
    const t = await aenderungenText('ZH-GOG', '44', 'kanton', 404);
    expect(t).toContain('für kantonale Erlasse bisher nicht erfasst');
    expect(t).not.toContain('nichts erfasst');
  });
});
