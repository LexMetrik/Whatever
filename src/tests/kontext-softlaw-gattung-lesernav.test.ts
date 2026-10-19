// ═══ LESER-NAV O-45 / O-05 · Erläuterungen und «Amtliche Materialien» führen
// nur Verwaltungspraxis, nie Gesetzgebung.
//
// Messung 16.10.2026 (Kommando in der PR-Beschreibung): die 9 Kanten-Shards
// tragen 0 Dokumente der Gattung «materialien», das kuratierte Register 0 —
// die Doppelanzeige (Botschaft in zwei Reitern) tritt heute nicht auf. Die Sperre
// in `kontextSoftLawErgebnis` (über `gattungVon`, §5) hält sie auch dann aus, wenn
// ein Generator-Lauf Kanten auf Botschaften/Vernehmlassungen/Ratschläge schriebe.
//
// ROT ZU BEKOMMEN (§6.7, gefahren 16.10.2026): in `kontext.ts` die Zeile
// `if (gattungVon(reg.doktyp) !== 'erlaeuterungen') continue;` entfernen ⇒ Fall 1 rot.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { kontextSoftLawErgebnis } from '../lib/kontext';
import { _leereKantenShardCache } from '../lib/materialien/kanten-shard';

function stubFetch(map: Record<string, unknown>) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const pfad = url.replace(/^https?:\/\/[^/]+/, '');
    if (pfad in map) return { ok: true, status: 200, json: async () => map[pfad] } as Response;
    return { ok: false, status: 404, json: async () => ({}) } as Response;
  }));
}

const kante = (dok: string) => ({ dok, artikel: '5', quelle: 'maschinell', konfidenz: 'regex-hoch', stand: '2025-01-01', fundstellen: [] });
const eintrag = (key: string, doktyp: string) => ({
  key, doktyp, behoerdeKuerzel: 'X', doktypLabel: doktyp, nummer: null, titel: `Titel ${key}`, stand: '2025-01-01',
});

afterEach(() => { vi.unstubAllGlobals(); _leereKantenShardCache(); });

describe('kontextSoftLawErgebnis — Gattungssperre (O-45, O-05)', () => {
  it('Kanten auf Botschaft, Vernehmlassung, Ratschlag bleiben draussen; Kreisschreiben, Tätigkeitsbericht, Mitteilung bleiben', async () => {
    stubFetch({
      '/materialien/register.json': {
        erzeugt: '2026-10-16',
        materialien: [
          eintrag('B', 'botschaft'), eintrag('V', 'vernehmlassung'), eintrag('R', 'ratschlag'),
          eintrag('K', 'kreisschreiben'), eintrag('T', 'taetigkeitsbericht'), eintrag('M', 'mitteilung'),
        ],
      },
      '/materialien/kanten/MWSTG.json': {
        erzeugt: '2026-10-16', erlass: 'MWSTG', dokumente: {},
        kanten: ['B', 'V', 'R', 'K', 'T', 'M'].map(kante),
      },
    });
    const e = await kontextSoftLawErgebnis('norm', ['MWSTG']);
    expect(e.fehler).toBe(false);
    expect(e.liste.map((m) => m.key).sort()).toEqual(['K', 'M', 'T']);
  });
});
