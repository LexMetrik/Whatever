import { describe, it, expect, vi, afterEach } from 'vitest';
import { kontextFuerArtikel } from '../lib/kontext';
import { _leereKantenShardCache } from '../lib/materialien/kanten-shard';
import { _leereShardCache } from '../lib/rechtsprechung/norm-index';

// ─── W2·5d U-VERWEIS/A7: artikelscharfer Kontext fürs Verweis-Popover ─────────
// kontextFuerArtikel projiziert die BESTEHENDEN Shards (Leitfall + Material-
// Kanten) auf EINEN Artikel — kein neuer Datenpfad (§5), die Promise-Caches
// werden mit dem Reader geteilt. Diese Tests sichern Filterung, Aggregation,
// Sublabel (Fundstellen-Ziffer) und die §8-Auslassung ungelisteter Dokumente.

function stubFetch(map: Record<string, unknown>) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const pfad = url.replace(/^https?:\/\/[^/]+/, '');
    if (pfad in map) return { ok: true, status: 200, json: async () => map[pfad] } as Response;
    return { ok: false, status: 404, json: async () => ({}) } as Response;
  }));
}

const REGISTER = {
  erzeugt: '2026-07-10',
  materialien: [
    { key: 'DOK-A', behoerdeKuerzel: 'ESTV', doktypLabel: 'MWST-Info', nummer: 'MI 04', titel: 'Titel A', stand: '2025-01-01' },
    { key: 'DOK-B', behoerdeKuerzel: 'EDÖB', doktypLabel: 'Leitfaden', nummer: null, titel: 'Titel B', stand: '2024-06-01' },
  ],
};

const KANTEN = {
  erzeugt: '2026-07-10', erlass: 'MWSTG',
  dokumente: { 'DOK-A': { urlBasis: 'https://x', stand: '2025-01-01' } },
  kanten: [
    { dok: 'DOK-A', artikel: '5', quelle: 'amtlich', konfidenz: 'regex-hoch', stand: '2025-01-01', fundstellen: [{ z: 'Ziff. 2.1' }] },
    { dok: 'DOK-A', artikel: '21', quelle: 'amtlich', konfidenz: 'regex-hoch', stand: '2025-01-01', fundstellen: [{ z: 'Ziff. 7' }] },
    { dok: 'DOK-B', artikel: '5', quelle: 'maschinell', konfidenz: 'regex-niedrig', stand: '2024-06-01', fundstellen: [{ z: 'Ziff. 1' }, { z: 'Ziff. 3' }] },
    { dok: 'DOK-UNGELISTET', artikel: '5', quelle: 'amtlich', konfidenz: 'regex-hoch', stand: '2024-01-01', fundstellen: [] },
    { dok: 'DOK-A', quelle: 'amtlich', konfidenz: 'regex-hoch', stand: '2025-01-01', fundstellen: [{ z: 'Ziff. 9' }] }, // Erlass-Ebene
  ],
};

const LEITFAELLE = {
  erzeugt: '2026-07-10', erlass: 'MWSTG', gewichtQuelle: 'alt',
  proArtikel: {
    '5': [
      { key: 'bge-100-ii-1', zitierung: 'BGE 100 II 1', regesteKurz: 'Kurz', datum: '2000-01-01', leitcharakter: 'leitentscheid', gericht: 'BGer', kanton: 'CH', gewicht: 3 },
    ],
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
  _leereKantenShardCache();
  _leereShardCache();
});

// Seit 1.10.2026 (W2·27-BUND-FERTIG) ohne die dünne `materialienFuerArtikel`: dieselbe
// Projektion über `kontextFuerArtikel(…).materialien` (Hilfsfunktion `materialien`),
// dazu die Auskunft `materialienFehler` — ein Leerzustand ist hier nie ein Ladefehler.
async function materialien(erlassKey: string, artikel: string) {
  const k = await kontextFuerArtikel(erlassKey, artikel);
  expect(k.materialienFehler).toBe(false);
  return k.materialien;
}

describe('kontextFuerArtikel(…).materialien — artikelscharfe Kanten-Projektion (A7/A13)', () => {
  it('filtert auf den EINEN Artikel; Sublabel = Fundstellen-Ziffer, «u. a.» bei mehreren', async () => {
    stubFetch({ '/materialien/register.json': REGISTER, '/materialien/kanten/MWSTG.json': KANTEN });
    const out = await materialien('MWSTG', '5');
    // DOK-UNGELISTET fällt §8-still raus; Erlass-Ebene-Kante zählt nicht.
    expect(out.map((m) => m.key)).toEqual(['DOK-B', 'DOK-A']); // Behörde EDÖB < ESTV
    const a = out.find((m) => m.key === 'DOK-A')!;
    expect(a.sublabel).toBe('Ziff. 2.1'); // nur die Art.-5-Fundstelle, nicht Ziff. 7
    expect(a.artikel).toBe('5');
    expect(a.herkunft).toBe('amtlich');
    const b = out.find((m) => m.key === 'DOK-B')!;
    expect(b.sublabel).toBe('Ziff. 1 u. a.');
    expect(b.herkunft).toBe('maschinell');
  });

  it('Artikel ohne Kanten ⇒ leere Liste (ruhiger Leerzustand)', async () => {
    stubFetch({ '/materialien/register.json': REGISTER, '/materialien/kanten/MWSTG.json': KANTEN });
    expect(await materialien('MWSTG', '999')).toEqual([]);
  });

  it('Erlass ohne Shard (404) ⇒ leere Liste, kein Fehler', async () => {
    stubFetch({ '/materialien/register.json': REGISTER });
    expect(await materialien('XYZ', '1')).toEqual([]);
  });
});

describe('kontextFuerArtikel — Entscheide + Materialien parallel (A7)', () => {
  it('liefert beide Gruppen aus den bestehenden Shards', async () => {
    stubFetch({
      '/materialien/register.json': REGISTER,
      '/materialien/kanten/MWSTG.json': KANTEN,
      '/rechtsprechung/norm-index/MWSTG.json': LEITFAELLE,
    });
    const ctx = await kontextFuerArtikel('MWSTG', '5');
    expect(ctx.entscheide.map((e) => e.zitierung)).toEqual(['BGE 100 II 1']);
    expect(ctx.entscheide[0].leitcharakter).toBe('leitentscheid');
    expect(ctx.materialien).toHaveLength(2);
  });

  it('fehlt beides ⇒ leere Gruppen (Popover rendert nichts)', async () => {
    stubFetch({ '/materialien/register.json': REGISTER });
    const ctx = await kontextFuerArtikel('MWSTG', '5');
    expect(ctx.entscheide).toEqual([]);
    expect(ctx.materialien).toEqual([]);
  });
});
