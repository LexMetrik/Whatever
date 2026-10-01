/**
 * W2·17-UI-BEFUNDE · Gesetzes-Leser, Such-Navigation (Befunde PE-C4/C5/C6/C8,
 * 1.10.2026) — Render-Zustands-Sonden gegen die ECHTEN Hooks (linkedom +
 * react-dom/client, kein Browser):
 *
 *  (a) PE-C4-B01 `useMarkenSchalter`: Leeren des Feldes setzt «Hervorhebung»
 *      auf «an» zurück — nicht nur MASKIERT. (Rest des Postens
 *      `2026-09-25-marken-schalter-…`, Entscheid-Leser-Teil: `rest-s1-…`.)
 *  (b) PE-C4-B02 / PE-C5-B02 `useTrefferSicht`: dieselbe Eingabe nach Leeren
 *      holt die Trefferliste zurück (Vertrag im Hook-Kopf).
 *  (c) PE-C6-B01 / PE-C8-B02 `useSuchTreffer`: ein Bereichswechsel verwirft die
 *      Fundstellen-Nummer («Fundstelle 20 von 11» darf es nicht geben).
 *
 * ROT ZU BEKOMMEN (§6.7): jeweils den Fix in `inhalt-suchtreffer.tsx` bzw.
 * `v3/useTrefferSicht.ts` zurücknehmen — (a), (b), (c) fallen (Beleg im
 * Commit-Text, vor dem Fix gesehen).
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { parseHTML } from 'linkedom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMarkenSchalter, useSuchTreffer } from '../pages/gesetz-leser/inhalt-suchtreffer';
import { useTrefferSicht } from '../pages/gesetz-leser/v3/useTrefferSicht';
import type { SuchBereich } from '../pages/gesetz-leser/leserSuche';
import type { NormSnapshot } from '../lib/normtext/typen';
import type { StrukturMap } from '../lib/normtext/browse';

let root: Root | null = null;

function aufbauen(): HTMLElement {
  const { document } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  vi.stubGlobal('window', {
    document,
    setTimeout: (...a: Parameters<typeof setTimeout>) => globalThis.setTimeout(...a),
    clearTimeout: (...a: Parameters<typeof clearTimeout>) => globalThis.clearTimeout(...a),
  });
  vi.stubGlobal('document', document);
  vi.stubGlobal('MutationObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  return document.getElementById('app') as unknown as HTMLElement;
}

async function abbauen() {
  if (root) { const r = root; root = null; await act(async () => r.unmount()); }
  vi.unstubAllGlobals();
}
afterEach(abbauen);

describe('(a) PE-C4-B01 · Marken-Schalter fällt nach Leeren auf «an» zurück', () => {
  it('aus → Feld leeren → neu suchen: Hervorhebung ist wieder AN', async () => {
    const ziel = aufbauen();
    let api: ReturnType<typeof useMarkenSchalter> | null = null;
    function Sonde({ leer }: { leer: boolean }) { api = useMarkenSchalter(leer); return null; }
    root = createRoot(ziel);
    const rendern = (leer: boolean) => act(async () => { root!.render(createElement(Sonde, { leer })); });

    await rendern(false);                                       // gesucht
    await act(async () => { api!.setzeMarkenAus(true); });
    expect(api!.markenAus, 'Klick: aus').toBe(true);
    await rendern(false);                                       // Verfeinern leert nicht
    expect(api!.markenAus, 'Tippen ohne Leeren lässt den Schalter stehen').toBe(true);
    await rendern(true);                                        // Feld geleert
    expect(api!.markenAus, 'leeres Feld: nie «aus»').toBe(false);
    await rendern(false);                                       // neu gesucht
    expect(api!.markenAus, 'beim nächsten Suchen wieder Farbe (§8)').toBe(false);
  });
});

describe('(b) PE-C4-B02 · Trefferliste kommt nach Leeren + gleichem Begriff zurück', () => {
  it('Enter (Liste weg) → leeren → denselben Begriff neu tippen: offen', async () => {
    const ziel = aufbauen();
    let api: ReturnType<typeof useTrefferSicht> | null = null;
    function Sonde({ begriff }: { begriff: string }) { api = useTrefferSicht(begriff); return null; }
    root = createRoot(ziel);
    const rendern = (begriff: string) => act(async () => { root!.render(createElement(Sonde, { begriff })); });

    await rendern('Kündigung');
    expect(api!.offen, 'erscheint selbst').toBe(true);
    await act(async () => { api!.schliesse(); });               // Enter / Sprung
    expect(api!.offen).toBe(false);
    await rendern('Kündigungen');                               // Eingabe ändert sich
    expect(api!.offen, 'Eingabe geändert ⇒ zurück').toBe(true);
    await rendern('Kündigung');
    await act(async () => { api!.schliesse(); });
    await rendern('');                                          // Feld leeren
    await rendern('Kündigung');                                 // DERSELBE Begriff
    expect(api!.offen, 'gleicher Begriff nach Leeren: Liste wieder da').toBe(true);
  });

  it('Nur-Leerraum zählt als leer (Aufrufer übergibt `suche.trim()`)', async () => {
    const ziel = aufbauen();
    let api: ReturnType<typeof useTrefferSicht> | null = null;
    function Sonde({ begriff }: { begriff: string }) { api = useTrefferSicht(begriff); return null; }
    root = createRoot(ziel);
    const rendern = (begriff: string) => act(async () => { root!.render(createElement(Sonde, { begriff })); });
    await rendern('Miete');
    await act(async () => { api!.schliesse(); });
    expect(api!.offen).toBe(false);
    await rendern('');
    await rendern('Miete');
    expect(api!.offen).toBe(true);
  });

  it('«Treffer anzeigen →» (oeffne) holt sie weiter zurück', async () => {
    const ziel = aufbauen();
    let api: ReturnType<typeof useTrefferSicht> | null = null;
    function Sonde() { api = useTrefferSicht('Miete'); return null; }
    root = createRoot(ziel);
    await act(async () => { root!.render(createElement(Sonde)); });
    await act(async () => { api!.schliesse(); });
    expect(api!.offen).toBe(false);
    await act(async () => { api!.oeffne(); });
    expect(api!.offen).toBe(true);
  });
});

// ── (c) ───────────────────────────────────────────────────────────────────────
// Mini-Erlass nach dem Muster von `leser-suche-w219.test.ts`: «Zaunkoenig» steht
// in Art. 1 und Art. 2 im Text, in Art. 2 zusätzlich als Randtitel und in Art. 3
// dreimal im Gliederungstitel. «alles» ⇒ 6 Fundstellen, «titel» ⇒ 4, «text» ⇒ 2.
function kunstErlass(): { eintraege: NormSnapshot[]; struktur: StrukturMap } {
  const basis = {
    ebene: 'bund' as const, quelle: 'X', erlass: 'X',
    stand: '2026-01-01', quelleUrl: 'https://example.invalid', abgerufen: '2026-01-01',
    fassungsToken: '20260101', sha: 'x',
  };
  const eintraege: NormSnapshot[] = [
    { ...basis, id: 'x/1', artikel: '1', artikelLabel: 'Art. 1', bloecke: [{ absatz: '1', text: 'Der Zaunkoenig ist geschuetzt.' }] },
    { ...basis, id: 'x/2', artikel: '2', artikelLabel: 'Art. 2', bloecke: [{ absatz: '1', text: 'Der Zaunkoenig nistet.' }] },
    { ...basis, id: 'x/3', artikel: '3', artikelLabel: 'Art. 3', bloecke: [{ absatz: '1', text: 'Ohne Fundstelle.' }] },
  ];
  const struktur: StrukturMap = {
    '1': { gliederung: [], marginalie: [] },
    '2': { gliederung: [], marginalie: ['Zaunkoenig'] },
    '3': { gliederung: [{ ebene: 1, label: 'Zaunkoenig, Zaunkoenig und Zaunkoenig' }], marginalie: [] },
  };
  return { eintraege, struktur };
}

describe('(c) PE-C6-B01 / PE-C8-B02 · Bereichswechsel verwirft die Fundstellen-Nummer', () => {
  type Api = ReturnType<typeof useSuchTreffer>;
  function sonde(ziel: HTMLElement) {
    const { eintraege, struktur } = kunstErlass();
    const holder: { api: Api | null } = { api: null };
    function Sonde({ bereich }: { bereich: SuchBereich }) {
      holder.api = useSuchTreffer({
        erlassKey: 'X', eintraege, struktur, sucheTrim: 'Zaunkoenig', sucheFeldLeer: false,
        sektionen: [], aktivIds: [], internRefs: undefined, aktArtikel: null,
        tokenByLabel: new Map(), offen: {}, setOffen: () => {}, imPane: false, wurzel: null, bereich,
      });
      return null;
    }
    root = createRoot(ziel);
    const rendern = (bereich: SuchBereich) => act(async () => { root!.render(createElement(Sonde, { bereich })); });
    return { holder, rendern };
  }

  it('Vorbedingung: «alles» ≠ «titel» in der Länge der Folge (sonst wäre der Test trivial)', async () => {
    const { holder, rendern } = sonde(aufbauen());
    await rendern('alles');
    const alles = holder.api!.fundstellen;
    await rendern('titel');
    expect(holder.api!.fundstellen).toBeLessThan(alles);
    expect(holder.api!.fundstellen).toBeGreaterThan(0);
  });

  it('Fundstelle gewählt, Bereich gewechselt: keine Nummer, keine aktive Zeile, kein aktiver Artikel', async () => {
    const { holder, rendern } = sonde(aufbauen());
    await rendern('alles');
    await act(async () => { holder.api!.springeZuFundstelle(1); });
    await act(async () => { holder.api!.springeZuFundstelle(1); });
    await act(async () => { holder.api!.springeZuFundstelle(1); });
    await act(async () => { holder.api!.springeZuFundstelle(1); });
    expect(holder.api!.trefferPos, 'Vorbedingung: vierte Fundstelle').toBe(3);
    expect(holder.api!.aktivStelle).not.toBeNull();
    await rendern('titel');
    expect(holder.api!.trefferPos, '«Fundstelle 4 von 4/2» wäre eine Falschauskunft (§8)').toBe(-1);
    expect(holder.api!.aktivStelle).toBeNull();
    expect(holder.api!.aktivToken).toBeNull();
    // Das nächste ↓ beginnt wieder bei der ersten Fundstelle des neuen Bereichs.
    await act(async () => { holder.api!.springeZuFundstelle(1); });
    expect(holder.api!.trefferPos).toBe(0);
  });

  it('derselbe Bereich bleibt gültig (Neu-Render ohne Wechsel verliert die Nummer nicht)', async () => {
    const { holder, rendern } = sonde(aufbauen());
    await rendern('alles');
    await act(async () => { holder.api!.springeZuFundstelle(1); });
    await act(async () => { holder.api!.springeZuFundstelle(1); });
    await rendern('alles');
    expect(holder.api!.trefferPos).toBe(1);
  });
});
