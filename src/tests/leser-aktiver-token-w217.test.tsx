/**
 * W2·17-UI-BEFUNDE · B10-B01 (HOCH) + B7 — der aktive Artikel ist ein TOKEN,
 * nie ein Label.
 *
 * BEFUND (reproduziert 2.10.2026, Korpus-Sonde über `public/normtext/{bund,kanton}`):
 * «Art. 3» trägt in ZGB der Hauptartikel `3` UND der Schlusstitel-Artikel
 * `disp_u1_art_3`; ebenso OR (13 Übergangsgruppen) und SchKG. 217 Artikel (OR 82,
 * ZGB 131, SchKG 4) teilen ihr Label mit einem früheren Artikel — und der
 * Scroll-Spy meldete das LABEL, `useArtikelTokens` übersetzte es per Umkehrkarte
 * («erstes Vorkommen gewinnt») zurück: wer im Übergangsartikel las, hatte für
 * Gliederungs-Marke, Landkarte, j/k, Panel (Entscheide/Bezüge!) und «Weiterlesen»
 * den HAUPTARTIKEL als Lesestelle (§1/§8).
 *
 * Diese Datei: (1) die Korpus-Sonde als Test (Verwechslungen beim aktiven Token:
 * vorher 217, nachher 0), (2) die Folgen je Konsument gegen die ECHTEN Hooks und
 * Bauteile mit einem echten ZGB-Ausschnitt (Hauptartikel 1–4, Schlusstitel
 * `disp_u1_art_1–4`, Wortlaut-Anhang `disp_u2`) samt echtem Struktur-Sidecar.
 *
 * ROT ZU BEKOMMEN (§6.7): `loeseAktivenArtikel` zurück auf die Umkehrkarte
 * (`for (const [tok, lab] of map) if (!m.has(lab)) m.set(lab, tok)`) — (1)
 * zählt 217, (2) fällt an `aktivToken`, j/k-Index, Marke, Panel, Weiterlesen.
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { parseHTML } from 'linkedom';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { labelMitBereich } from '../lib/normtext/darstellung';
import type { StrukturMap } from '../lib/normtext/browse';
import type { BrowseErlass } from '../lib/normtext/browse-typen';
import type { NormSnapshot } from '../lib/normtext/typen';
import { loeseAktivenArtikel, useArtikelAbleitungen, useArtikelTokens } from '../pages/gesetz-leser/inhalt-ableitungen';
import { useWeiterlesen } from '../pages/gesetz-leser/inhalt-weiterlesen';
import { eindeutigeBezeichnung } from '../pages/gesetz-leser/artikelBezeichnung';
import { holeLesePosition } from '../pages/gesetz-leser/lesePosition';
import { panelBezug } from '../pages/gesetz-leser/v3/panelModell';
import { baueArtikelIndex } from '../pages/gesetz-leser/gliederungsArtikel';
import { ArtikelIndex } from '../pages/gesetz-leser/parts/ArtikelIndex';

const WURZEL = path.join(process.cwd(), 'public/normtext');
const lies = (rel: string) => JSON.parse(fs.readFileSync(path.join(WURZEL, rel), 'utf8'));

/** Die Label-Karte des Lesers — EXAKT die Ableitung aus `useArtikelAbleitungen`. */
const labelKarte = (eintraege: NormSnapshot[]) =>
  new Map(eintraege.map((e) => [e.artikel, labelMitBereich(e.artikelLabel, e.artikel)] as const));

describe('(1) Korpus-Sonde — der aktive Artikel wird nie mit einem gleichnamigen verwechselt', () => {
  const dateien = fs.readdirSync(path.join(WURZEL, 'bund')).filter((f) => f.endsWith('.json'));

  it('Vorbedingung: das Label ist NICHT eindeutig (ZGB: Hauptartikel 3 und disp_u1_art_3)', () => {
    const e = lies('bund/ZGB.json').eintraege as NormSnapshot[];
    const labels = (t: string) => e.find((x) => x.artikel === t)?.artikelLabel;
    expect(labels('3')).toBe('Art. 3');
    expect(labels('disp_u1_art_3')).toBe('Art. 3');
  });

  it('jeder Artikel jedes Bund-Erlasses: Token → aktiver Token ist die Identität (0 Verwechslungen)', () => {
    const verwechselt: string[] = [];
    let artikel = 0;
    for (const datei of dateien) {
      const eintraege = (lies(`bund/${datei}`).eintraege ?? []) as NormSnapshot[];
      const karte = labelKarte(eintraege);
      for (const e of eintraege) {
        artikel++;
        const { aktivToken, aktArtikel } = loeseAktivenArtikel(karte, e.artikel);
        if (aktivToken !== e.artikel || aktArtikel !== karte.get(e.artikel)) verwechselt.push(`${datei}:${e.artikel}`);
      }
    }
    expect(dateien, 'Vorbedingung: die Erlasse mit Übergangsgruppen sind im Lauf').toEqual(expect.arrayContaining(['OR.json', 'ZGB.json', 'SCHKG.json']));
    expect(artikel, 'Vorbedingung: der Korpus ist gelesen').toBeGreaterThan(20_000);
    expect(verwechselt).toEqual([]);
  });

  it('ein Token, den der Erlass nicht kennt, ergibt keinen aktiven Artikel (nie geraten, §8)', () => {
    const karte = labelKarte(lies('bund/ZGB.json').eintraege);
    expect(loeseAktivenArtikel(karte, 'gibt_es_nicht')).toEqual({ aktivToken: null, aktArtikel: null });
    expect(loeseAktivenArtikel(karte, null)).toEqual({ aktivToken: null, aktArtikel: null });
  });
});

// ─── echter ZGB-Ausschnitt ───────────────────────────────────────────────────
const AUSSCHNITT = ['1', '2', '3', '4', 'disp_u1_art_1', 'disp_u1_art_2', 'disp_u1_art_3', 'disp_u1_art_4', 'disp_u2_art_178'];
function zgbAusschnitt(): { eintraege: NormSnapshot[]; struktur: StrukturMap } {
  const alle = lies('bund/ZGB.json').eintraege as NormSnapshot[];
  const sidecar = lies('struktur/bund/ZGB.json').artikel as StrukturMap;
  const eintraege = AUSSCHNITT.map((t) => alle.find((e) => e.artikel === t)!);
  const struktur: StrukturMap = {};
  for (const t of AUSSCHNITT) struktur[t] = sidecar[t];
  return { eintraege, struktur };
}

let root: Root | null = null;
function aufbauen(): HTMLElement {
  const { document } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  vi.stubGlobal('window', {
    document,
    setTimeout: (...a: Parameters<typeof setTimeout>) => globalThis.setTimeout(...a),
    clearTimeout: (...a: Parameters<typeof clearTimeout>) => globalThis.clearTimeout(...a),
  });
  vi.stubGlobal('document', document);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const speicher = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => speicher.get(k) ?? null,
    setItem: (k: string, v: string) => void speicher.set(k, v),
    removeItem: (k: string) => void speicher.delete(k),
  });
  return document.getElementById('app') as unknown as HTMLElement;
}
afterEach(() => {
  if (root) act(() => root!.unmount());
  root = null;
  vi.unstubAllGlobals();
});
beforeEach(() => { root = null; });

describe('(2) Folgen je Konsument — Lesestelle `disp_u1_art_3` (Label «Art. 3»)', () => {
  const DISP = 'disp_u1_art_3';
  const erlass = { key: 'bund/ZGB', stand: '2026-07-01' } as unknown as BrowseErlass;

  function sonde(ziel: HTMLElement, aktToken: string | null, mitWeiterlesen = false) {
    const { eintraege, struktur } = zgbAusschnitt();
    const holder: { api: ReturnType<typeof useArtikelTokens> | null } = { api: null };
    function Sonde() {
      const { artLabelByToken } = useArtikelAbleitungen({ sektionen: [], eintraege, struktur });
      holder.api = useArtikelTokens({ artLabelByToken, eintraege, aktToken });
      useWeiterlesen({
        erlass, eintraege, struktur: mitWeiterlesen ? struktur : null, istSekundaer: false, locationHash: '',
        aktArtikel: holder.api.aktArtikel, aktivToken: holder.api.aktivToken, springeZuArtikel: () => {},
      });
      return null;
    }
    root = createRoot(ziel);
    return { holder, eintraege, struktur, rendern: () => act(async () => { root!.render(createElement(Sonde)); }) };
  }

  it('aktivToken ist der Übergangsartikel, das Label bleibt «Art. 3»', async () => {
    const s = sonde(aufbauen(), DISP);
    await s.rendern();
    expect(s.holder.api!.aktivToken).toBe(DISP);
    expect(s.holder.api!.aktArtikel).toBe('Art. 3');
  });

  it('j/k-Start: die Position in der Dokument-Reihenfolge ist die des Übergangsartikels, nicht des Hauptartikels', async () => {
    const s = sonde(aufbauen(), DISP);
    await s.rendern();
    const { aktivToken, artTokens } = s.holder.api!;
    expect(artTokens.indexOf(aktivToken!)).toBe(artTokens.indexOf(DISP));
    expect(artTokens.indexOf(aktivToken!)).not.toBe(artTokens.indexOf('3'));
    expect(artTokens[artTokens.indexOf(aktivToken!) + 1]).toBe('disp_u1_art_4');
  });

  it('Gliederungs-Marke (flacher Artikel-Index): genau EINE Zeile trägt sie — die des Übergangsartikels', async () => {
    const s = sonde(aufbauen(), DISP);
    await s.rendern();
    const gr = baueArtikelIndex([], [], s.eintraege, null);
    const out = renderToStaticMarkup(<ArtikelIndex gruppen={gr} aktivToken={s.holder.api!.aktivToken} onSprung={() => {}} />);
    const zeilen = out.split('<li>').slice(1);
    const aktiv = zeilen.map((z, i) => (z.includes('data-toc-aktiv') ? i : -1)).filter((i) => i >= 0);
    expect(aktiv).toEqual([AUSSCHNITT.indexOf(DISP)]);
  });

  it('Panel (Entscheide/Bezüge): der Bezugs-Token ist der Übergangsartikel, nicht der Hauptartikel (§8)', async () => {
    const s = sonde(aufbauen(), DISP);
    await s.rendern();
    const { aktArtikel, aktivToken } = s.holder.api!;
    expect(panelBezug(aktArtikel, aktivToken, s.eintraege[0]).token).toBe(DISP);
  });

  it('Weiterlesen speichert den richtigen Token, beschriftet ihn aber eindeutig (B7: Gruppe, nicht blosses «Art. 3»)', async () => {
    const s = sonde(aufbauen(), DISP, true);
    await s.rendern();
    await act(async () => { await new Promise((r) => globalThis.setTimeout(r, 5)); });
    const pos = holeLesePosition(erlass.key, erlass.stand);
    expect(pos?.token).toBe(DISP);
    expect(pos?.label).toBe('Art. 3 (Schlusstitel: Anwendungs- und Einführungsbestimmungen)');
  });

  it('Weiterlesen im Hauptteil: Label unverändert «Art. 3», Token `3`', async () => {
    const s = sonde(aufbauen(), '3', true);
    await s.rendern();
    await act(async () => { await new Promise((r) => globalThis.setTimeout(r, 5)); });
    expect(holeLesePosition(erlass.key, erlass.stand)).toMatchObject({ token: '3', label: 'Art. 3' });
  });
});

describe('(3) B7 · eindeutigeBezeichnung', () => {
  const { struktur } = zgbAusschnitt();
  it('Hauptartikel: das Anzeige-Label unverändert', () => {
    expect(eindeutigeBezeichnung('3', 'Art. 3', struktur)).toBe('Art. 3');
  });
  it('Übergangsartikel mit Sidecar: amtliche Gruppe aus der Gliederung (Ebene 1)', () => {
    expect(eindeutigeBezeichnung('disp_u2_art_178', 'Art. 178', struktur))
      .toBe('Art. 178 (Wortlaut der früheren Bestimmungen des sechsten Titels)');
  });
  it('Übergangsartikel OHNE Sidecar: eindeutige Rückfallform, nie stillschweigend «Art. 3»', () => {
    const a = eindeutigeBezeichnung('disp_u1_art_3', 'Art. 3', null);
    const b = eindeutigeBezeichnung('disp_u2_art_3', 'Art. 3', null);
    expect(a).not.toBe('Art. 3');
    expect(a).toContain('Art. 3');
    expect(a).not.toBe(b);
  });
});
