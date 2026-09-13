import { describe, it, expect, beforeEach } from 'vitest';
import { ladeTabs, merkeTab, aktualisiereTabArtikel, tabsGleich } from '../lib/tabs';
import { manifestBedarf } from '../lib/tabGruppen';

// ── W2·18 Punkt 2 (Fahrplan §4.R) · DIE RENDER-KASKADE BEIM SCROLLEN ────────
//
// GEMESSEN 13.9.2026 (Chromium, Dev-Server @1024, 7 Reiter, 20 Rad-Schritte à
// 220 ms auf /gesetze/bund/OR): 44 Renders der Arbeitsleiste und 11 Läufe des
// Manifest-Effekts. Zwei Verstärker, die hier je einzeln gepinnt werden:
//
//  (a) `useTabs` setzte auf JEDES `TABS_EVENT`/`storage` ein frisch aus dem
//      `localStorage` gebautes Array — identischer Inhalt, neue Identität, also
//      ein Render auch dann, wenn sich nichts geändert hat.
//  (b) der Manifest-Effekt der Leiste hing an `[tabs]` und legte bei jedem Lauf
//      ein NEUES `manifeste`-Objekt ab ⇒ ein zweiter Render obendrauf, dazu
//      neue Prop-Identität für jeden einzelnen Reiter. Sein Bedarf hängt aber
//      gar nicht am Anker: ein wandernder `#art-…` macht aus einem
//      Gesetzes-Reiter keinen anderen Manifest-Bedarf.
//
// TESTTECHNIK: node-Env ohne jsdom (Repo-Konvention, vgl. `tabsSsr.test.tsx`).
// Geprüft werden darum die beiden REINEN Ableitungen, aus denen die Hooks ihre
// Entscheidung ziehen — plus eine Nachstellung der Hook-Schleife («was würde
// `useTabs` setzen»), die die Zahl der Identitätswechsel zählt.
//
// ROT ZU BEKOMMEN (§6.7, so gefahren): in `lib/tabs.tabsGleich` den
// Struktur-Vergleich streichen (`return a === b`) ⇒ die Kaskaden-Fälle unten
// zählen wieder 20 statt 0 Wechsel; in `lib/tabGruppen.manifestBedarf` die
// Ableitung durch die Reiterliste selbst ersetzen ⇒ der Anker-Fall wird rot.

beforeEach(() => {
  const speicher = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (k: string) => speicher.get(k) ?? null,
    setItem: (k: string, v: string) => void speicher.set(k, v),
    removeItem: (k: string) => void speicher.delete(k),
    clear: () => speicher.clear(),
    key: () => null,
    length: 0,
  } as unknown as Storage;
});

/** Nachstellung von `useTabs`: jedes Ereignis liest den Speicher; gesetzt wird
 *  nur, was sich strukturell unterscheidet. Gezählt werden die Zustands-
 *  wechsel — und genau die sind die Renders. */
function zustandsWechsel(ereignisse: (() => void)[]): number {
  let stand = ladeTabs();
  let wechsel = 0;
  for (const ereignis of ereignisse) {
    ereignis();
    const neu = ladeTabs();
    if (!tabsGleich(stand, neu)) { stand = neu; wechsel += 1; }
  }
  return wechsel;
}

describe('Reiterleiste — Render-Kaskade (W2·18 Punkt 2)', () => {
  it('(a) 20 Ereignisse ohne Sachänderung ergeben 0 Zustandswechsel', () => {
    merkeTab('/gesetze/bund/OR#art-336_c');
    merkeTab('/rechner/zpo-fristen');
    // Der Scroll-Spy ruft `aktualisiereTabArtikel` mit DERSELBEN Stelle —
    // idempotent, der Speicher ändert sich nicht. Trotzdem feuerte jedes
    // `storage`-Ereignis eines zweiten Browser-Tabs dieselbe Schleife.
    const ereignisse = Array.from({ length: 20 }, () => () => {
      aktualisiereTabArtikel('/gesetze/bund/OR#art-336_c');
    });
    expect(zustandsWechsel(ereignisse)).toBe(0);
  });

  it('(a) eine echte Änderung ergibt genau EINEN Zustandswechsel', () => {
    merkeTab('/gesetze/bund/OR#art-1');
    const ereignisse = [
      () => aktualisiereTabArtikel('/gesetze/bund/OR#art-2'),
      () => aktualisiereTabArtikel('/gesetze/bund/OR#art-2'),
      () => aktualisiereTabArtikel('/gesetze/bund/OR#art-2'),
    ];
    expect(zustandsWechsel(ereignisse)).toBe(1);
  });

  it('(a) tabsGleich unterscheidet Länge, Reihenfolge, Anker und Label', () => {
    const a = [{ path: '/gesetze/bund/OR#art-1' }, { path: '/rechner/zpo-fristen' }];
    expect(tabsGleich(a, [{ path: '/gesetze/bund/OR#art-1' }, { path: '/rechner/zpo-fristen' }])).toBe(true);
    expect(tabsGleich(a, [{ path: '/gesetze/bund/OR#art-2' }, { path: '/rechner/zpo-fristen' }])).toBe(false);
    expect(tabsGleich(a, [{ path: '/rechner/zpo-fristen' }, { path: '/gesetze/bund/OR#art-1' }])).toBe(false);
    expect(tabsGleich(a, [{ path: '/gesetze/bund/OR#art-1' }])).toBe(false);
    expect(tabsGleich([{ path: '/gesetze/bund/OR' }], [{ path: '/gesetze/bund/OR', label: 'OR' }])).toBe(false);
  });

  it('(b) der Manifest-Bedarf ändert sich nicht, wenn nur der Anker wandert', () => {
    const vorher = manifestBedarf([{ path: '/gesetze/bund/OR#art-1' }, { path: '/rechner/zpo-fristen' }]);
    const nachher = manifestBedarf([{ path: '/gesetze/bund/OR#art-957b' }, { path: '/rechner/zpo-fristen' }]);
    expect(nachher).toEqual(vorher);
    expect(vorher).toEqual({ gesetze: true, rechtsprechung: false, materialien: false });
  });

  it('(b) der Bedarf steht trotzdem für jede Art getrennt', () => {
    expect(manifestBedarf([{ path: '/rechtsprechung/bge_146_III_1' }]))
      .toEqual({ gesetze: false, rechtsprechung: true, materialien: false });
    expect(manifestBedarf([{ path: '/materialien/BJ-EHRA-PM-2025-01' }]))
      .toEqual({ gesetze: false, rechtsprechung: false, materialien: true });
    // §15-Nachzug 12.9.2026: Übersicht und /materialien/deckung sind
    // Material-ROUTEN ohne Register-Bedarf — das bleibt so.
    expect(manifestBedarf([{ path: '/materialien' }, { path: '/materialien/deckung' }]))
      .toEqual({ gesetze: false, rechtsprechung: false, materialien: false });
    expect(manifestBedarf([])).toEqual({ gesetze: false, rechtsprechung: false, materialien: false });
  });
});
