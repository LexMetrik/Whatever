// @vitest-environment node
/**
 * O-03-Rest · Reiter «Änderungen» im Gesetz-Leser nennt seinen Datenstand: das Abrufdatum
 * des Revisions-Sidecars (`abgerufen`), wie der Reiter «Entscheide» sein `erzeugt`
 * (`entscheide-datenstand-o03.test.tsx`). Gemessen 16.10.2026 (Skript, `node`, Verzeichnis
 * `public/normtext/revisionen`): 231 von 231 Sidecars tragen `abgerufen` als ISO-Datum.
 * Fehlt es in den Daten, steht «Datenstand unbekannt», nie ein Ersatzdatum (§7/§8).
 *
 * ROT ZU BEKOMMEN (§6.7): in `PanelAenderungen.tsx` die `datenstand`-Zeile streichen →
 * SSR-Fälle rot; in `revisionen.ts` `abgerufen` aus dem Rückgabewert nehmen → Lade-Fälle rot.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToString as rohRender } from 'react-dom/server';
import type { ReactElement } from 'react';
import { PanelAenderungen } from '../pages/gesetz-leser/v3/PanelAenderungen';
import { revisionenFuerNorm, _leereRevisionenCache, type RevisionAnsicht, type RevisionBezug } from '../lib/normtext/revisionen';

const html = (el: ReactElement) => rohRender(el).replace(/<!-- -->/g, '');
const QUELLE = 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de';
const rev = (p: Partial<RevisionBezug> = {}): RevisionBezug => ({
  art: 'aenderung', dateEntryInForce: '2020-01-01', titelDe: 'Änderung', quelleUrl: 'https://www.fedlex.admin.ch/eli/oc/2020/1/de', ...p,
});
const mit = (wert: RevisionAnsicht) => html(<PanelAenderungen stand={{ fertig: true, wert }} quelleUrl={QUELLE} stichtag={null} ebene="bund" />);

describe('O-03 · PanelAenderungen zeigt den Datenstand', () => {
  it('mit Abrufdatum: «Datenstand 01.10.2026»', () => {
    const h = mit({ revisionen: [rev()], reichweite: 'Maschinell zusammengestellt.', abgerufen: '2026-10-01' });
    expect(h).toContain('data-v3-panel-aenderungen-datenstand');
    expect(h).toContain('Datenstand 01.10.2026');
  });
  it('ohne Abrufdatum (null oder fehlend): «Datenstand unbekannt», kein Datum', () => {
    for (const abgerufen of [null, undefined]) {
      const h = mit({ revisionen: [rev()], reichweite: null, abgerufen });
      expect(h).toContain('Datenstand unbekannt');
      expect(h).not.toMatch(/Datenstand \d/);
    }
  });
  it('kein ISO-Datum (kaputter Wert): «unbekannt», nie der Rohwert', () => {
    const h = mit({ revisionen: [rev()], reichweite: null, abgerufen: 'gestern' });
    expect(h).toContain('Datenstand unbekannt');
    expect(h).not.toContain('gestern');
  });
  it('leere Liste einer echten Datei: «keine Änderung erfasst» UND der Datenstand dazu', () => {
    const h = mit({ revisionen: [], reichweite: null, abgerufen: '2026-10-01' });
    expect(h).toContain('Für diesen Erlass ist keine Änderung erfasst.');
    expect(h).toContain('Datenstand 01.10.2026');
  });
  it('«nicht erfasst» und Ladefehler tragen KEINEN Datenstand (es gibt keinen Abruf)', () => {
    expect(mit({ revisionen: [], reichweite: null, nichtErfasst: true })).not.toContain('Datenstand');
    expect(html(<PanelAenderungen stand={{ fertig: true, wert: null }} quelleUrl={QUELLE} stichtag={null} ebene="bund" />)).not.toContain('Datenstand');
    expect(html(<PanelAenderungen stand={{ fertig: false, wert: null }} quelleUrl={QUELLE} stichtag={null} ebene="bund" />)).not.toContain('Datenstand');
  });
});

const VERZ = 'public/normtext/revisionen';
describe('O-03 · die Daten tragen das Datum, und der Lader reicht es durch', () => {
  beforeEach(() => {
    _leereRevisionenCache();
    vi.stubGlobal('fetch', vi.fn(async (url: string) => ({
      ok: true, status: 200, headers: { get: () => 'application/json' },
      json: async () => JSON.parse(readFileSync(`public${decodeURIComponent(String(url))}`, 'utf8')),
    }) as unknown as Response));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('alle Sidecars: `abgerufen` ist ein ISO-Datum UND kommt aus `revisionenFuerNorm` an', async () => {
    const keys = readdirSync(VERZ).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));
    expect(keys.length).toBeGreaterThanOrEqual(200);
    for (const k of keys) {
      const roh = JSON.parse(readFileSync(`${VERZ}/${k}.json`, 'utf8')) as { abgerufen: string };
      expect(roh.abgerufen, k).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect((await revisionenFuerNorm([k]))?.abgerufen, k).toBe(roh.abgerufen);
    }
  });
  it('Sidecar ohne `abgerufen` → null (kein Ersatzdatum)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true, status: 200, headers: { get: () => 'application/json' },
      json: async () => ({ erlassKey: 'X', sr: '1', reichweite: 'r', revisionen: [rev()] }),
    }) as unknown as Response));
    expect((await revisionenFuerNorm(['OHNE-ABRUF']))?.abgerufen).toBeNull();
  });
});
