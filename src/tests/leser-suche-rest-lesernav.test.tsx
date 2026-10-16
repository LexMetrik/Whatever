/**
 * LESER-NAV · Rest der Leser-Suche (FB O-58 und die Auflagen der Prüfung von #1383).
 *
 *  (a) O-58 · Klick der Treffer-Landkarte in ein Feld OHNE Treffer gibt die laufende
 *      Fundstelle frei. Vorher blieb sie (gemalt, im Zähler und in der Listenzeile) an
 *      einem Artikel stehen, den der Leser verlassen hatte (OR «Kündigung», 8 von 8
 *      Klicks, aktive Stelle blieb an Art. 102). Gegen den ECHTEN Hook `useSuchTreffer`
 *      (linkedom + react-dom/client), und gegen die ECHTE `LandkarteZone` für die
 *      Verdrahtung des Klicks.
 *  (b) WCAG 2.5.3 · die sichtbare Beschriftung der Zähler-Zeile steht am Stück im
 *      zugänglichen Namen, schmal wie breit. Der Name wird aus dem Markup der ECHTEN
 *      `SuchZone` nachgebildet (Tailwind-Zustände `hidden`, `@[31rem]/zaehl:*`, `sr-only`,
 *      `aria-hidden` als kleine Regelmenge) — der Browser-Beleg steht in
 *      `e2e/leser-w228-landkarte.e2e.ts` (g2).
 *  (c) Tooltip einer Marke, deren Zeile NUR einen Kopf-Treffer trägt, nennt das Badge der
 *      Listenzeile («Überschrift · Art. …») statt «Art. N» allein.
 *
 * ROT ZU BEKOMMEN (§6.7), am Bau gesehen:
 *  (a) in `inhalt-suchtreffer.tsx` `springeZuTreffer` auf den alten Rumpf (nur
 *      `if (n >= 0) zeigeFundstelle(n)`) ⇒ «keine aktive Stelle» und «keine Nummer» fallen.
 *      In `LandkarteZone.tsx` die Zeile `m.springeZuTreffer?.(token)` vor dem
 *      Artikel-Sprung streichen ⇒ der Verdrahtungs-Fall fällt.
 *  (b) in `v3/SuchZone.tsx` das `sr-only`-Segment hinter den Fundstellen entfernen und das
 *      vordere Segment wieder `sr-only … @[31rem]/zaehl:not-sr-only` setzen ⇒ der Name
 *      schmal liest «69 Artikel 28 Überschriften 143 Fundstellen» gegen das Bild.
 *  (c) in `components/leser/TrefferLandkarte.tsx` `hinweise?.get(m.id) ||` streichen ⇒
 *      der Tooltip der Kopf-Zeile sagt «Art. N · 1 Fundstelle».
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { parseHTML } from 'linkedom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSuchTreffer } from '../pages/gesetz-leser/inhalt-suchtreffer';
import { LandkarteZone } from '../pages/gesetz-leser/v3/LandkarteZone';
import { SuchZone } from '../pages/gesetz-leser/v3/SuchZone';
import { baueLeserSuchIndex, sucheImErlass, zaehleTreffer } from '../pages/gesetz-leser/leserSuche';
import type { LeserV3Modell } from '../pages/gesetz-leser/v3/leserV3Modell';
import type { NormSnapshot } from '../lib/normtext/typen';
import { baueGliederungsbaum, type StrukturMap } from '../lib/normtext/browse';
import { ladeNormFixture } from './fixtures/normtext-fixture';

// Die Landkarte wird durchgereicht UND erfasst: so sieht der Verdrahtungs-Fall die Props,
// die `LandkarteZone` an sie gibt (`onSprung`, `hinweise`), und (c) rendert trotzdem die echte.
const erfasst: { props: { onSprung: (id: string) => void; hinweise?: ReadonlyMap<string, string> } | null } = { props: null };
vi.mock('../components/leser/TrefferLandkarte', async (orig) => {
  const echt = await orig<typeof import('../components/leser/TrefferLandkarte')>();
  return {
    TrefferLandkarte: (p: Parameters<typeof echt.TrefferLandkarte>[0]) => {
      erfasst.props = p;
      return echt.TrefferLandkarte(p);
    },
  };
});

let root: Root | null = null;

function aufbauen(): HTMLElement {
  const { document } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  vi.stubGlobal('window', {
    document,
    setTimeout: (...a: Parameters<typeof setTimeout>) => globalThis.setTimeout(...a),
    clearTimeout: (...a: Parameters<typeof clearTimeout>) => globalThis.clearTimeout(...a),
    requestAnimationFrame: () => 0,
  });
  vi.stubGlobal('document', document);
  vi.stubGlobal('MutationObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  return document.getElementById('app') as unknown as HTMLElement;
}

afterEach(async () => {
  if (root) { const r = root; root = null; await act(async () => r.unmount()); }
  vi.unstubAllGlobals();
  erfasst.props = null;
});

// ── (a) O-58 · Hook ──────────────────────────────────────────────────────────
// «Zaunkoenig» steht im Wortlaut von Art. 1 und 2 und im Kopf über Art. 3; Art. 4 trägt keine Fundstelle.
function kunstErlass(): { eintraege: NormSnapshot[]; struktur: StrukturMap } {
  const basis = {
    ebene: 'bund' as const, quelle: 'X', erlass: 'X',
    stand: '2026-01-01', quelleUrl: 'https://example.invalid', abgerufen: '2026-01-01',
    fassungsToken: '20260101', sha: 'x',
  };
  const art = (n: string, text: string): NormSnapshot => ({
    ...basis, id: `x/${n}`, artikel: n, artikelLabel: `Art. ${n}`, bloecke: [{ absatz: '1', text }],
  });
  const eintraege = [
    art('1', 'Der Zaunkoenig ist geschuetzt.'), art('2', 'Der Zaunkoenig nistet.'),
    art('3', 'Ohne Fundstelle.'), art('4', 'Auch ohne Fundstelle.'),
  ];
  const struktur: StrukturMap = {
    '1': { gliederung: [], marginalie: [] },
    '2': { gliederung: [], marginalie: [] },
    '3': { gliederung: [{ ebene: 1, label: 'Zaunkoenig' }], marginalie: [] },
    '4': { gliederung: [{ ebene: 1, label: 'Anderes' }], marginalie: [] },
  };
  return { eintraege, struktur };
}

describe('(a) O-58 · ein Ziel ohne Fundstelle gibt die laufende Fundstelle frei', () => {
  type Api = ReturnType<typeof useSuchTreffer>;
  async function starte() {
    const ziel = aufbauen();
    const { eintraege, struktur } = kunstErlass();
    const sektionen = baueGliederungsbaum(eintraege, struktur).sektionen;
    const holder: { api: Api | null } = { api: null };
    function Sonde() {
      holder.api = useSuchTreffer({
        erlassKey: 'X', eintraege, struktur, sucheTrim: 'zaunkoenig', sucheFeldLeer: false,
        sektionen, aktivIds: [], internRefs: undefined, aktArtikel: null,
        offen: {}, setOffen: () => {}, imPane: false, wurzel: null,
      });
      return null;
    }
    root = createRoot(ziel);
    await act(async () => { root!.render(createElement(Sonde)); });
    return holder;
  }

  it('Fundstelle gewählt, Klick auf Art. 4 (ohne Treffer): keine Nummer, keine aktive Stelle, ↓ beginnt vorn', async () => {
    const h = await starte();
    expect(h.api!.fundstellen, 'Vorbedingung: mehrere Fundstellen').toBeGreaterThan(2);
    await act(async () => { h.api!.springeZuFundstelle(1); });
    await act(async () => { h.api!.springeZuFundstelle(1); });
    expect(h.api!.trefferPos, 'Vorbedingung: zweite Fundstelle gewählt').toBe(1);
    expect(h.api!.aktivStelle, 'Vorbedingung').not.toBeNull();

    await act(async () => { h.api!.springeZuTreffer('4'); });
    expect(h.api!.trefferPos, '«Fundstelle 2 von N» an einem verlassenen Artikel wäre eine Falschauskunft (§8)').toBe(-1);
    expect(h.api!.aktivStelle, 'die Listenzeile darf nicht weiter «aktiv» sein').toBeNull();
    expect(h.api!.aktivToken).toBeNull();

    await act(async () => { h.api!.springeZuFundstelle(1); });
    expect(h.api!.trefferPos, 'das nächste ↓ beginnt wieder bei der ersten').toBe(0);
  });

  it('Gegenprobe: ein Treffer-Artikel springt zu SEINER Fundstelle und gibt nichts frei', async () => {
    const h = await starte();
    await act(async () => { h.api!.springeZuTreffer('2'); });
    expect(h.api!.aktivStelle?.token).toBe('2');
    expect(h.api!.trefferPos).toBeGreaterThanOrEqual(0);
  });
});

// ── (a) O-58 + (c) · LandkarteZone ───────────────────────────────────────────
function zoneMitOrKuendigung() {
  const { eintraege, struktur } = ladeNormFixture('bund', 'OR');
  const treffer = sucheImErlass(baueLeserSuchIndex('OR', eintraege, struktur), 'Kündigung');
  const aufrufe: string[] = [];
  const m = {
    sucheAktiv: true, eintraege, struktur, treffer, markenAus: false, aktivToken: null,
    fundstellen: zaehleTreffer(treffer).fundstellen, aenderungenAus: true,
    springeZuTreffer: (t: string) => { aufrufe.push(`treffer:${t}`); },
    springeZuArtikel: (t: string, behalte?: boolean) => { aufrufe.push(`artikel:${t}:${behalte}`); },
  } as unknown as LeserV3Modell;
  const html = renderToStaticMarkup(createElement(LandkarteZone, {
    m, bestimmungsWort: 'Artikel', randluft: true, listeSteht: false, onVorSprung: () => aufrufe.push('vor'),
  }));
  return { treffer, aufrufe, html };
}

describe('(a) O-58 · LandkarteZone verdrahtet den Klick in ein Feld ohne Treffer', () => {
  it('Feld ohne Treffer: zuerst frei geben (springeZuTreffer), dann zum Artikel (Suche bleibt)', () => {
    const { treffer, aufrufe } = zoneMitOrKuendigung();
    const ohne = ladeNormFixture('bund', 'OR').eintraege.find((e) => !treffer.some((t) => t.token === e.artikel));
    expect(ohne, 'Vorbedingung: ein Artikel ohne Treffer').toBeDefined();
    erfasst.props!.onSprung(ohne!.artikel);
    expect(aufrufe).toEqual(['vor', `treffer:${ohne!.artikel}`, `artikel:${ohne!.artikel}:true`]);
  });

  it('Feld mit Treffer: nur die Fundstellen-Sprungmechanik, kein Artikel-Sprung daneben', () => {
    const { treffer, aufrufe } = zoneMitOrKuendigung();
    erfasst.props!.onSprung(treffer[0].token);
    expect(aufrufe).toEqual(['vor', `treffer:${treffer[0].token}`]);
  });
});

describe('(c) Tooltip einer Marke nur mit Kopf-Treffer nennt die Herkunft', () => {
  it('OR «Kündigung»: Kopf-Zeilen tragen «Überschrift · Art. …»/«Randtitel · …», Artikel-Zeilen ihr Label', () => {
    const { treffer, html } = zoneMitOrKuendigung();
    const titel = [...html.matchAll(/<title>([^<]*)<\/title>/g)].map((x) => x[1]);
    const nurKopf = treffer.filter((t) => zaehleTreffer([t]).artikel === 0);
    const eigen = treffer.filter((t) => zaehleTreffer([t]).artikel > 0);
    expect(nurKopf.length, 'Vorbedingung (§6.7): OR «Kündigung» trägt Zeilen nur mit Kopf-Treffer').toBeGreaterThan(0);
    expect(eigen.length, 'Vorbedingung: und Zeilen mit eigener Fundstelle').toBeGreaterThan(0);
    const hinweise = erfasst.props!.hinweise!;
    for (const t of nurKopf) {
      const h = hinweise.get(t.token);
      expect(h, `Hinweis fehlt für ${t.label}`).toMatch(/^(Überschrift|Randtitel) · Art\. /);
      expect(titel, `Tooltip für ${t.label}`).toContain(`${h} · ${t.fundstellen} ${t.fundstellen === 1 ? 'Fundstelle' : 'Fundstellen'}`);
    }
    for (const t of eigen) {
      expect(hinweise.has(t.token), `${t.label}: der Artikel trifft selbst, kein Kopf-Hinweis`).toBe(false);
      expect(titel).toContain(`${t.label} · ${t.fundstellen} ${t.fundstellen === 1 ? 'Fundstelle' : 'Fundstellen'}`);
    }
  });
});

// ── (b) WCAG 2.5.3 ───────────────────────────────────────────────────────────
type Knoten = { nodeType: number; textContent: string | null; childNodes: ArrayLike<Knoten>; getAttribute?: (n: string) => string | null };

/** Name (Inhalt ohne `aria-hidden`) und sichtbares Wortbild (ohne `sr-only`, ohne Dekor) bei schmaler bzw. breiter Zeile. */
function nameUndBild(breit: boolean): { name: string; bild: string } {
  const markup = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(SuchZone, {
    suchFeld: null, sucheAktiv: true, bestimmungen: 69, ueberschriften: 28, fundstellen: 143,
    bestimmungsWort: 'Artikel', onListe: () => {},
  })));
  const { document } = parseHTML(`<!doctype html><html><body>${markup}</body></html>`);
  const knopf = document.querySelector('[data-v3-treffer-weg]') as unknown as Knoten;
  const lauf = (n: Knoten, mitSrOnly: boolean): string[] => {
    if (n.nodeType === 3) return [n.textContent ?? ''];
    const cls = (n.getAttribute?.('class') ?? '').split(/\s+/);
    // Zeilenbreite ≥ 31 rem: `@[31rem]/zaehl:hidden` greift, ein nacktes `hidden` wird von `@[31rem]/zaehl:flex` überstimmt.
    if (breit ? cls.includes('@[31rem]/zaehl:hidden') : cls.includes('hidden')) return [];
    if (n.getAttribute?.('aria-hidden') === 'true') return [];
    if (!mitSrOnly && cls.includes('sr-only')) return [];
    return Array.from(n.childNodes).flatMap((c) => lauf(c, mitSrOnly));
  };
  const norm = (teile: string[]) => teile.join(' ').replace(/\s+/g, ' ').trim();
  return { name: norm(lauf(knopf, true)), bild: norm(lauf(knopf, false)) };
}

describe('(b) WCAG 2.5.3 · die sichtbare Beschriftung der Zähler-Zeile steht am Stück im Namen', () => {
  it('schmal: Bild «69 Artikel 143 Fundstellen», die Überschriften hängen HINTER dem Namen', () => {
    const { name, bild } = nameUndBild(false);
    expect(bild).toBe('69 Artikel 143 Fundstellen');
    expect(name).toBe('69 Artikel 143 Fundstellen 28 Überschriften');
    expect(name.startsWith(bild), 'sichtbare Beschriftung nicht am Stück im Namen').toBe(true);
  });

  it('breit: Bild und Name lesen «69 Artikel 28 Überschriften 143 Fundstellen» — kein Segment doppelt', () => {
    const { name, bild } = nameUndBild(true);
    expect(bild).toBe('69 Artikel 28 Überschriften 143 Fundstellen');
    expect(name).toBe(bild);
  });
});
