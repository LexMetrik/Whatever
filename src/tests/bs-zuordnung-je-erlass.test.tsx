// ─── BS-Grossrat: Zuordnungs-Herkunft je ERLASS, nicht je Geschäft (W2·27-BUND-FERTIG) ───
//
// Nachprüfung Bug-Check #1097 (25.9.2026): `PanelMaterialien` deutete das «maschinell»-
// Etikett aus dem Präfix von `hinweis` («Zuordnung amtlich …»). `hinweis` gilt aber je
// GESCHÄFT (der Generator hängt die Texte aller Kanten-Regeln aneinander, amtlich zuerst);
// ein gemischtes Geschäft — amtlich an Erlass A, maschinell an Erlass B — verlöre so am
// maschinell zugeordneten Erlass B das Etikett (§8). Heute 0 gemischte Geschäfte
// (gemessen, unten nochmals belegt); der Test konstruiert den Fall.
//
// Seit dieser Änderung trägt das Browser-Manifest (`register.json`) die Herkunft je Erlass
// (`bsZuordnung`), vom Generator aus `bsKanten[].quelle` geschrieben; die UI liest nur noch
// dieses Feld. Fehlt die Angabe, gilt «maschinell» (§8: die vorsichtige Richtung).

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { PanelMaterialien } from '../pages/gesetz-leser/v3/PanelMaterialien';
import type { MaterialStand } from '../pages/gesetz-leser/v3/panelKontextLaden';
import type { BrowseMaterial, MaterialManifest, MaterialProvenienzManifest, MaterialRegistereintrag } from '../lib/materialien/typen';
import { vollEintrag } from '../../scripts/materialien/material-manifest';

const HINWEIS_AMTLICH = 'Zuordnung amtlich: die Fussnote der Gesetzessammlung Basel-Stadt nennt dieses Geschäft.';
const HINWEIS_MASCH = 'Zuordnung maschinell über die SG-Nummer im amtlichen Geschäftstitel; fachlich nicht geprüft.';

function bs(key: string, nr: string, normKeys: string[], zuordnung: Record<string, 'amtlich' | 'maschinell'> | undefined, hinweis: string): BrowseMaterial {
  return {
    key, behoerde: 'BS-GR', behoerdeName: 'Grosser Rat Basel-Stadt', behoerdeKuerzel: 'GR BS',
    doktyp: 'ratschlag', doktypLabel: 'Ratschlag', titel: `Ratschlag ${nr}`, nummer: nr,
    rechtsgebiet: 'oeffentlich', sprache: 'de', status: 'nur-live-link',
    quelleUrl: `https://grosserrat.bs.ch/?gnr=${nr}`, stand: '2024-01-10', rang: 1, normKeys, hinweis,
    ...(zuordnung ? { bsZuordnung: zuordnung } : {}),
  } as BrowseMaterial;
}

/** Ein GEMISCHTES Geschäft: amtlich (Fussnote) an Erlass A, maschinell an Erlass B. Der
 *  Generator-Hinweis beginnt dann mit «Zuordnung amtlich» (Regel-Reihenfolge fussnote zuerst). */
const GEMISCHT = bs('BS-GR-20.0001', '20.0001', ['BS-100.100', 'BS-200.200'],
  { 'BS-100.100': 'amtlich', 'BS-200.200': 'maschinell' }, `${HINWEIS_AMTLICH} ${HINWEIS_MASCH}`);
const REIN_MASCH = bs('BS-GR-20.0002', '20.0002', ['BS-200.200'], { 'BS-200.200': 'maschinell' }, HINWEIS_MASCH);
const OHNE_ANGABE = bs('BS-GR-20.0003', '20.0003', ['BS-300.300'], undefined, HINWEIS_MASCH);

const MANIFEST: MaterialManifest = { erzeugt: '2026-09-25', materialien: [GEMISCHT, REIN_MASCH, OHNE_ANGABE] };

function zeigePanel(kanton: NonNullable<MaterialStand['kanton']>): string {
  const wert: MaterialStand = { botschaften: [], vernehmlassungen: [], kanton, erzeugt: '2026-09-25' };
  return renderToString(<PanelMaterialien stand={{ fertig: true, wert, erneut: () => {} }} ebene="kanton" />);
}
/** Der Zeilen-Abschnitt nur des einen Geschäfts (der gemeinsame §8-Absatz enthält selbst «maschinell»). */
function zeile(html: string, nr: string): string {
  const i = html.indexOf(`>${nr}<`);
  expect(i, `Geschäft ${nr} fehlt im Panel`).toBeGreaterThan(-1);
  const ende = html.indexOf('</li>', i);
  return html.slice(i, ende);
}

describe('Panel «Materialien» am Kantonserlass — Etikett je Erlass (Bug-Check #1097, Nachprüfung)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => MANIFEST })));
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  // `ladeMaterialManifest` cached die Promise je Modul-Instanz → frisch importieren.
  async function ladeFuer(erlass: string) {
    const { kantonaleGesetzgebungFuer: frisch } = await import('../lib/materialien/ratschlaege');
    const liste = await frisch([erlass]);
    expect(liste).not.toBeNull();
    return liste!;
  }

  it('gemischtes Geschäft: an Erlass B (maschinell) steht das Etikett, an Erlass A (amtlich) nicht', async () => {
    const anB = await ladeFuer('BS-200.200');
    const htmlB = zeigePanel(anB);
    expect(zeile(htmlB, '20.0001')).toContain('maschinell');
    expect(zeile(htmlB, '20.0002')).toContain('maschinell');
    const anA = await ladeFuer('BS-100.100');
    expect(zeile(zeigePanel(anA), '20.0001')).not.toContain('maschinell');
  });

  it('fehlt die Herkunftsangabe im Manifest, gilt «maschinell» (§8, vorsichtige Richtung)', async () => {
    const htmlC = zeigePanel(await ladeFuer('BS-300.300'));
    expect(zeile(htmlC, '20.0003')).toContain('maschinell');
  });

  it('Mehrfach-Treffer über mehrere normKeys: maschinell gewinnt vor amtlich', async () => {
    const { kantonaleGesetzgebungFuer: frisch } = await import('../lib/materialien/ratschlaege');
    const liste = await frisch(['BS-100.100', 'BS-200.200']);
    const g = liste!.find((x) => x.key === 'BS-GR-20.0001')!;
    expect(g.zuordnung).toBe('maschinell');
    expect(liste!.filter((x) => x.key === 'BS-GR-20.0001')).toHaveLength(1);
  });
});

describe('Generator — Herkunft je Erlass aus bsKanten[].quelle (Kern-Projektion)', () => {
  const reg = (kanten: NonNullable<MaterialRegistereintrag['bsKanten']>): MaterialRegistereintrag => ({
    key: 'BS-GR-20.0001', behoerde: 'BS-GR', doktyp: 'ratschlag', titel: 'T', nummer: '20.0001',
    rechtsgebiet: 'oeffentlich', sprache: 'de', status: 'nur-live-link',
    quelleUrl: 'https://grosserrat.bs.ch/?gnr=20.0001', stand: '2024-01-10', rang: 1,
    normKeys: ['BS-100.100', 'BS-200.200'], hinweis: 'H', bsKanten: kanten,
  });
  it('schreibt je Kante Erlass → Herkunft (gemischtes Geschäft: beide Werte)', () => {
    const v = vollEintrag(reg([
      { erlass: 'BS-100.100', quelle: 'amtlich', regel: 'fussnote', beleg: '20.0001' },
      { erlass: 'BS-200.200', quelle: 'maschinell', regel: 'sg-nummer', beleg: 'SG 200.200' },
    ]));
    expect(v.bsZuordnung).toEqual({ 'BS-100.100': 'amtlich', 'BS-200.200': 'maschinell' });
  });
  it('führt das Feld nur an BS-GR-Einträgen', () => {
    const v = vollEintrag({ ...reg([]), behoerde: 'BUND', bsKanten: undefined });
    expect('bsZuordnung' in v).toBe(false);
  });
});

describe('Ausgelieferter Bestand — Etiketten vorher = nachher (Verhaltensneutralität)', () => {
  const kern = JSON.parse(readFileSync('public/materialien/register.json', 'utf8')) as MaterialManifest;
  const prov = JSON.parse(readFileSync('public/materialien/register-provenienz.json', 'utf8')) as MaterialProvenienzManifest;
  const bsEintraege = kern.materialien.filter((m) => m.behoerde === 'BS-GR');

  it('trägt je BS-Eintrag die Herkunft jeder Kante, deckungsgleich mit der Provenienz', () => {
    expect(bsEintraege.length).toBeGreaterThan(0);
    for (const m of bsEintraege) {
      const kanten = prov.eintraege[m.key].bsKanten ?? [];
      const soll = Object.fromEntries(kanten.map((k) => [k.erlass, k.quelle]));
      expect((m as BrowseMaterial & { bsZuordnung?: unknown }).bsZuordnung, m.key).toEqual(soll);
      expect(Object.keys(soll).sort(), m.key).toEqual([...m.normKeys].sort());
    }
  });
  it('das je-Erlass-Etikett stimmt mit der bisherigen Präfix-Deutung überein (heute keine gemischten Geschäfte)', () => {
    let n = 0;
    for (const m of bsEintraege) {
      const z = (m as BrowseMaterial & { bsZuordnung?: Record<string, string> }).bsZuordnung ?? {};
      const herkuenfte = new Set(Object.values(z));
      expect(herkuenfte.size, `${m.key}: gemischt — Präfix-Deutung wäre unzulässig`).toBe(1);
      const alt = (m.hinweis && !m.hinweis.startsWith('Zuordnung amtlich')) ? 'maschinell' : 'amtlich';
      for (const nk of m.normKeys) { expect(z[nk], `${m.key}/${nk}`).toBe(alt); n += 1; }
    }
    expect(n).toBeGreaterThan(0);
  });
});
