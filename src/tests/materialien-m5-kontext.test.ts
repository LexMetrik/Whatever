import { describe, it, expect, vi, afterEach } from 'vitest';
import { materialienFuerNorm } from '../lib/normtext/werkzeuge';
import { kontextSoftLawErgebnis, mischeMaterialien, type MaterialBezug } from '../lib/kontext';
import { ladeKantenShardErgebnis, _leereKantenShardCache } from '../lib/materialien/kanten-shard';

// ─── E6a·M5: Amtliche-Materialien-Delta ─────────────────────────────────────
// (1) Kuratierte artikelscharfe Nachtrags-Anker (§2.4/§7): DATABREACH→Art. 24 DSG,
//     KS 6a→Art. 65 DBG; DSFA bleibt Erlass-Ebene (Stand < revDSG-Cutoff).
// (2) mischeMaterialien: dedupe per key, Sortierung Behörde→key.
// (3) kontextSoftLawErgebnis + ladeKantenShardErgebnis (die dünnen Fassungen
//     kontextSoftLaw/ladeKantenShard sind seit 1.10.2026 entfernt): Shard-/Bucket-Fetch, Aggregation je
//     Dokument, Sublabel, Herkunft, Register-Join.

describe('materialienFuerNorm — kuratierte Artikel-Nachträge (M5, §2.4/§7)', () => {
  it('DATABREACH trägt via Art. 24 DSG (Stand ≥ revDSG-Cutoff)', () => {
    const dsg = materialienFuerNorm('DSG');
    const db = dsg.find((m) => m.key === 'EDOEB-LEITFADEN-DATABREACH');
    expect(db).toBeTruthy();
    expect(db!.herkunft).toBe('kuratiert');
    expect(db!.artikel).toBe('24');
    expect(db!.sublabel).toBe('via Art. 24');
    expect(db!.stand).toBe('2025-04-23');
  });

  it('KS 6a trägt via Art. 65 DBG (DBG ohne Revisions-Cutoff)', () => {
    const dbg = materialienFuerNorm('DBG');
    const ks = dbg.find((m) => m.key === 'ESTV-KS-DBG-6A');
    expect(ks!.artikel).toBe('65');
    expect(ks!.sublabel).toBe('via Art. 65');
  });

  it('DSFA bleibt Erlass-Ebene (Stand 2023-08-04 vor revDSG-Cutoff → kein Artikel)', () => {
    const dsg = materialienFuerNorm('DSG');
    const dsfa = dsg.find((m) => m.key === 'EDOEB-MERKBLATT-DSFA');
    expect(dsfa).toBeTruthy();
    expect(dsfa!.artikel).toBeUndefined();
    expect(dsfa!.sublabel).toBeUndefined();
  });

  it('jeder Bezug trägt herkunft=kuratiert und einen Stand', () => {
    for (const m of materialienFuerNorm('DSG')) {
      expect(m.herkunft).toBe('kuratiert');
      expect(m.stand).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe('mischeMaterialien — dedupe + Sortierung', () => {
  const mk = (key: string, behoerdeKuerzel: string, herkunft: MaterialBezug['herkunft'] = 'kuratiert'): MaterialBezug => ({
    key, titel: key, behoerdeKuerzel, doktypLabel: 'Leitfaden', nummer: null,
    pfad: `/materialien/${key}`, herkunft, stand: '2025-01-01',
  });

  it('bestehender (sync-)Key gewinnt gegen async-Dublette', () => {
    const sync = [mk('A', 'ESTV', 'kuratiert')];
    const async = [mk('A', 'ESTV', 'amtlich'), mk('B', 'EDÖB', 'amtlich')];
    const out = mischeMaterialien(sync, async);
    expect(out.map((m) => m.key)).toEqual(['B', 'A']); // Behörde EDÖB < ESTV
    expect(out.find((m) => m.key === 'A')!.herkunft).toBe('kuratiert');
  });

  it('leere Eingaben ergeben leere Liste', () => {
    expect(mischeMaterialien([], [])).toEqual([]);
  });
});

// ── Fetch-Mock für Register + Shards ─────────────────────────────────────────
function stubFetch(map: Record<string, unknown>) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const pfad = url.replace(/^https?:\/\/[^/]+/, '');
    if (pfad in map) return { ok: true, status: 200, json: async () => map[pfad] } as Response;
    return { ok: false, status: 404, json: async () => ({}) } as Response;
  }));
}

const REGISTER = {
  erzeugt: '2026-07-04',
  materialien: [
    { key: 'DOK-A', behoerdeKuerzel: 'ESTV', doktypLabel: 'MWST-Info', nummer: 'MI 04', titel: 'Titel A', stand: '2025-01-01' },
    { key: 'DOK-B', behoerdeKuerzel: 'ESTV', doktypLabel: 'Kreisschreiben', nummer: null, titel: 'Titel B', stand: '2024-06-01' },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
  _leereKantenShardCache();
  // Manifest-Promise-Cache in browse.ts überlebt Tests → aber jeder Test stubbt
  // dieselbe Register-Antwort, daher unkritisch; kanten-Cache wird geleert.
});

// Die Liste der Soft-Law-Bezüge; jeder Aufruf hier ist ein Nicht-Fehler-Fall (§8:
// Ladefehler sind eigene Tests, kanten-shard-weitere-konsumenten).
async function softLaw(typ: 'norm' | 'material', keys: string[]) {
  const e = await kontextSoftLawErgebnis(typ, keys);
  expect(e.fehler).toBe(false);
  return e.liste;
}

describe('kontextSoftLawErgebnis — Aggregation je Dokument (M5)', () => {
  it('artikelscharf: repräsentativer (kleinster) Artikel + «u. a.» bei mehreren', async () => {
    stubFetch({
      '/materialien/register.json': REGISTER,
      '/materialien/kanten/MWSTG.json': {
        erzeugt: '2026-07-04', erlass: 'MWSTG',
        dokumente: { 'DOK-A': { urlBasis: 'https://x', stand: '2025-01-01' } },
        kanten: [
          { dok: 'DOK-A', artikel: '21', quelle: 'amtlich', konfidenz: 'regex-hoch', stand: '2025-01-01', fundstellen: [] },
          { dok: 'DOK-A', artikel: '11', quelle: 'amtlich', konfidenz: 'regex-hoch', stand: '2025-01-01', fundstellen: [] },
        ],
      },
    });
    const out = await softLaw('norm', ['MWSTG']);
    expect(out).toHaveLength(1);
    expect(out[0].key).toBe('DOK-A');
    expect(out[0].artikel).toBe('11'); // kleinster Token repräsentativ
    expect(out[0].sublabel).toBe('via Art. 11 u. a.');
    expect(out[0].herkunft).toBe('amtlich');
    expect(out[0].titel).toBe('Titel A');
    expect(out[0].pfad).toBe('/materialien/DOK-A');
  });

  it('Bucket-Split wird transparent vereinigt; maschinell-Herkunft aggregiert', async () => {
    stubFetch({
      '/materialien/register.json': REGISTER,
      '/materialien/kanten/DBG.json': {
        erzeugt: '2026-07-04', erlass: 'DBG',
        dokumente: { 'DOK-B': { urlBasis: 'https://y', stand: '2024-06-01' } },
        buckets: ['1', '2'],
      },
      '/materialien/kanten/DBG/1.json': {
        erzeugt: '2026-07-04', erlass: 'DBG',
        kanten: [{ dok: 'DOK-B', quelle: 'maschinell', konfidenz: 'regex-niedrig', stand: '2024-06-01', fundstellen: [] }],
      },
      '/materialien/kanten/DBG/2.json': {
        erzeugt: '2026-07-04', erlass: 'DBG',
        kanten: [{ dok: 'DOK-B', quelle: 'maschinell', konfidenz: 'regex-niedrig', stand: '2024-06-01', fundstellen: [] }],
      },
    });
    const shard = await ladeKantenShardErgebnis('DBG');
    expect(shard.zustand === 'ok' && shard.shard.kanten).toHaveLength(2); // beide Buckets vereinigt
    const out = await softLaw('norm', ['DBG']);
    expect(out).toHaveLength(1);
    expect(out[0].herkunft).toBe('maschinell'); // Badge-relevante Abweichung
    expect(out[0].artikel).toBeUndefined(); // reine Erlass-Ebene
  });

  it('Material-Reader zeigt keine Materialien (Selbst-Korpus)', async () => {
    stubFetch({ '/materialien/register.json': REGISTER });
    expect(await softLaw('material', ['MWSTG'])).toEqual([]);
  });

  it('Erlass ohne Shard (404) → leer, kein Fehler', async () => {
    stubFetch({ '/materialien/register.json': REGISTER });
    expect(await softLaw('norm', ['OR'])).toEqual([]);
  });
});
