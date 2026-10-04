// @vitest-environment node
/**
 * W2·17-UI-BEFUNDE (Nachzug PR #1267) · Zweig und Sprung kanonisieren gegen
 * DIESELBE Token-Liste.
 *
 * Der Gliederungszweig des Tieflinks (`v3/tiefLinkZweig`) glich «#art-1.1» nur
 * gegen die Tokens der Sektionen ab; der Seed-Sprung (`inhalt-hooks-tieflink`)
 * gegen alle Einträge. ZH-211.17: «1.1» (Anhang Ziff. 1.1) ist KEIN Sektions-
 * Token, «11» (§ 11, «C. Akkreditierung») schon — der Sprung ging auf 1.1, der
 * Zweig öffnete § 11. Korpus-Simulation des Prüfers: 8 solche Hashes, alle in
 * ZH-211.17. ECHTE Effekt-Ausführung (linkedom + createRoot + act).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';
import { baueGliederungsbaum } from '../lib/normtext/browse';
import { kuratiereTocSektionen } from '../pages/gesetz-leser/berechnungen';
import { baueGliederungsModell } from '../pages/gesetz-leser/gliederungsModell';
import { pfadZu } from '../pages/gesetz-leser/helpers';

type GlobalPatch = Record<string, unknown>;
const lade = (p: string) => JSON.parse(readFileSync(p, 'utf8'));

async function oeffneFuer(hash: string, ebene = 'kanton', key = 'ZH-211.17'): Promise<{ ids: string[]; sek: ReturnType<typeof baueGliederungsbaum>['sektionen']; alle: string[] }> {
  const d = lade(`public/normtext/${ebene}/${key}.json`);
  const st = lade(`public/normtext/struktur/${ebene}/${key}.json`);
  const eintraege = d.eintraege ?? d;
  const { sektionen, ohneGliederung } = baueGliederungsbaum(eintraege, st.artikel);
  const modell = baueGliederungsModell({ sektionen: kuratiereTocSektionen(sektionen), ohneGliederung, eintraege, struktur: st.artikel, startSichtbarGo: true });
  const artIndex = new Map<string, number>();
  eintraege.forEach((e: { artikel: string }, i: number) => artIndex.set(e.artikel, i));
  const { window, document } = parseHTML('<!doctype html><html><body><div id="root"></div></body></html>');
  (globalThis as GlobalPatch).window = window;
  (globalThis as GlobalPatch).document = document;
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { act } = React as unknown as { act: (fn: () => void | Promise<void>) => Promise<void> };
  const { useTiefLinkZweig } = await import('../pages/gesetz-leser/v3/tiefLinkZweig');
  let gesetzt: Record<string, boolean> = {};
  const ref = <T,>(v: T) => ({ current: v });
  function Harness() {
    useTiefLinkZweig({
      hash, sektionen, erlassMarke: 'k', umhaengPraefix: modell.umhaengPraefix, knoten: modell.knoten,
      artIndex,
      setTocBaum: (f) => { gesetzt = typeof f === 'function' ? f({}) : f; },
      autoOffenRef: ref(new Set<string>()), autoTickRef: ref(new Map<string, number>()), autoTickNowRef: ref(0),
      manuellOffenRef: ref(new Set<string>()), manuellZuRef: ref(new Set<string>()),
    });
    return null;
  }
  const root = createRoot(document.getElementById('root') as unknown as Element);
  await act(async () => { root.render(React.createElement(Harness)); });
  await act(async () => { await Promise.resolve(); });
  await act(async () => { root.unmount(); });
  return { ids: Object.keys(gesetzt), sek: sektionen, alle: [...artIndex.keys()] };
}

afterEach(() => { delete (globalThis as GlobalPatch).window; delete (globalThis as GlobalPatch).document; });

describe('Tieflink-Zweig kanonisiert gegen alle Einträge (ZH-211.17)', () => {
  it('«#art-11» (§ 11) öffnet den Zweig von § 11', async () => {
    const { ids, sek } = await oeffneFuer('#art-11');
    const soll = pfadZu(sek, (s) => s.artikel.some((e) => e.artikel === '11')) ?? [];
    expect(soll.length).toBeGreaterThan(0);
    for (const id of soll) expect(ids).toContain(id);
  });
  it('«#art-1.1» (Anhang Ziff. 1.1) öffnet NIE den Zweig von § 11', async () => {
    const { ids, sek } = await oeffneFuer('#art-1.1');
    const zweig11 = pfadZu(sek, (s) => s.artikel.some((e) => e.artikel === '11')) ?? [];
    expect(zweig11.length).toBeGreaterThan(0);
    for (const id of zweig11) expect(ids, `Zweig von § 11 offen: ${id}`).not.toContain(id);
  });

  it('«#art-1a» (Token «1_a», kein Sektions-Token) trifft die Zeile «Ohne Abschnitt» (ASYLV3, B7 bei Nicht-Kanonik-Schreibweise)', async () => {
    const { ids } = await oeffneFuer('#art-1a', 'bund', 'ASYLV3');
    expect(ids).toContain('gm-vorspann');
  });
});

// W2·27-BUND-FERTIG E2 (Ziffer-Fragment, 2.10.2026): `#art-197-ziff-12` — das Suffix MUSS vor der
// Abbildung auf die Token-Liste ab, sonst trifft «197-ziff-12» nichts und der Zweig bleibt zu
// (derselbe Fehler wie früher bei `#art-1a`).
describe('Ziffer-Fragment: «#art-<token>-ziff-<z>» öffnet den Zweig des ARTIKELS', () => {
  it('BV «#art-197-ziff-12» öffnet exakt denselben Zweig wie «#art-197» (und der ist nicht leer)', async () => {
    const mit = await oeffneFuer('#art-197-ziff-12', 'bund', 'BV');
    const ohne = await oeffneFuer('#art-197', 'bund', 'BV');
    expect(ohne.ids.length).toBeGreaterThan(0);
    expect(mit.ids).toEqual(ohne.ids);
  });
  it('Nicht-kanonischer Artikel-Token mit Ziffer: «#art-1a-ziff-2» trifft die Zeile von «#art-1a» (ASYLV3)', async () => {
    const { ids } = await oeffneFuer('#art-1a-ziff-2', 'bund', 'ASYLV3');
    expect(ids).toContain('gm-vorspann');
  });
  it('unbekannte Ziffer ändert nichts am Zweig — Fallback auf den Artikel, kein Fehler', async () => {
    const mit = await oeffneFuer('#art-197-ziff-99', 'bund', 'BV');
    const ohne = await oeffneFuer('#art-197', 'bund', 'BV');
    expect(mit.ids).toEqual(ohne.ids);
  });
  it('ungültige Prozent-Kodierung: kein Absturz, nichts geöffnet', async () => {
    const { ids } = await oeffneFuer('#art-197%-ziff-12', 'bund', 'BV');
    expect(ids).toEqual([]);
  });
});

