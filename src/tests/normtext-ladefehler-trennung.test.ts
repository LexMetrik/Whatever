// @vitest-environment node
/**
 * W2·17-UI-BEFUNDE · PA-3-B01/B02, PE-E7-B02 (Leser-Befunde 1.10.2026) —
 * «nicht vorhanden» (404 / nicht im Register) ist etwas anderes als ein
 * LADEFEHLER (Netz, 5xx, Abbruch). `browse.ts` machte beides zu `null`; der
 * Leser sagte bei einem Funkloch «‹OR› ist nicht als Erlass im Bestand» und
 * cachte einen gescheiterten `register.json`-Abruf bis zum Neuladen des Tabs.
 *
 * Frisches Modul je Fall: Manifest und Dateien werden modulweit gehalten.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

afterEach(() => vi.unstubAllGlobals());

const jsonOk = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as unknown as Response;
const status = (code: number) => ({ ok: false, status: code, json: async () => ({}) }) as unknown as Response;
const REGISTER = { erlasse: [{ key: 'OR', ebene: 'bund', kuerzel: 'OR', titel: 'Obligationenrecht', datei: 'bund/OR.json' }] };

async function browse() {
  vi.resetModules();
  return import('../lib/normtext/browse');
}

describe('register.json — ein Ladefehler wird nicht gecacht (PA-3-B02)', () => {
  it('503 → null; der nächste Abruf versucht neu und trifft', async () => {
    let ruf = 0;
    const fetchMock = vi.fn(async () => (++ruf === 1 ? status(503) : jsonOk(REGISTER)));
    vi.stubGlobal('fetch', fetchMock);
    const b = await browse();
    expect(await b.ladeBrowseManifest()).toBeNull();
    expect(await b.ladeBrowseManifest()).toEqual(REGISTER);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('Netzfehler (reject) → null; der nächste Abruf versucht neu', async () => {
    let ruf = 0;
    vi.stubGlobal('fetch', vi.fn(async () => { if (++ruf === 1) throw new Error('Netz'); return jsonOk(REGISTER); }));
    const b = await browse();
    expect(await b.ladeBrowseManifest()).toBeNull();
    expect((await b.ladeErlass('OR'))?.key).toBe('OR');
  });

  it('Erfolgsfall bleibt gecacht: ein Fetch für beliebig viele Aufrufe', async () => {
    const fetchMock = vi.fn(async () => jsonOk(REGISTER));
    vi.stubGlobal('fetch', fetchMock);
    const b = await browse();
    await Promise.all([b.ladeBrowseManifest(), b.ladeBrowseManifest(), b.ladeErlass('OR')]);
    await b.ladeErlass('OR');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('ladeErlassStreng — nicht im Register ≠ Register nicht erreichbar (PA-3-B01)', () => {
  it('Schlüssel fehlt im Register → null (kein Fehler)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonOk(REGISTER)));
    const b = await browse();
    await expect(b.ladeErlassStreng('ORR')).resolves.toBeNull();
    await expect(b.ladeErlassStreng('OR')).resolves.toMatchObject({ key: 'OR' });
  });

  it('Register 503 → die Promise wird abgelehnt (der Leser darf «nicht im Bestand» nicht behaupten)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => status(503)));
    const b = await browse();
    await expect(b.ladeErlassStreng('OR')).rejects.toThrow(/503/);
    // Die abwärtskompatible Fassung bleibt null (Start-Blätter, Suche).
    expect(await b.ladeErlass('OR')).toBeNull();
  });
});

describe('ladeErlassDateiStreng — 404 ist null, alles andere ein Fehler', () => {
  it('404 → null (und gecacht); 503 → abgelehnt und NICHT gecacht', async () => {
    const fetchMock = vi.fn(async (url: string) => (String(url).includes('FEHLT') ? status(404) : status(503)));
    vi.stubGlobal('fetch', fetchMock);
    const b = await browse();
    await expect(b.ladeErlassDateiStreng('bund/FEHLT.json')).resolves.toBeNull();
    await expect(b.ladeErlassDateiStreng('bund/FEHLT.json')).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await expect(b.ladeErlassDateiStreng('bund/OR.json')).rejects.toThrow(/503/);
    await expect(b.ladeErlassDateiStreng('bund/OR.json')).rejects.toThrow(/503/);
    expect(fetchMock).toHaveBeenCalledTimes(3); // zweimal OR: beide Male neu geholt
  });
});

describe('ladeBezuegeZaehler — Sidecar-Ladefehler ist kein «keine Zähler» (PE-E7-B02)', () => {
  it('5xx → abgelehnt, nicht gecacht; danach trifft der Neuversuch', async () => {
    let ruf = 0;
    vi.stubGlobal('fetch', vi.fn(async () => (++ruf === 1 ? status(500) : jsonOk({ zaehler: { '1': [2, 3] } }))));
    const b = await browse();
    await expect(b.ladeBezuegeZaehler('bund', 'OR')).rejects.toThrow(/500/);
    await expect(b.ladeBezuegeZaehler('bund', 'OR')).resolves.toEqual({ '1': [2, 3] });
  });

  it('404 → null (kein Sidecar: gültige Auskunft)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => status(404)));
    const b = await browse();
    await expect(b.ladeBezuegeZaehler('bund', 'OR')).resolves.toBeNull();
  });

  it('ladeStruktur bleibt null-bei-Fehler (NormChip, Tieflink: «entschieden» unverändert)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => status(500)));
    const b = await browse();
    await expect(b.ladeStruktur('bund', 'OR')).resolves.toBeNull();
  });

  it('ladeStrukturDokumentStreng (BG-04): 500 → abgelehnt, nicht gecacht; 404 → leer; Neuversuch trifft', async () => {
    let ruf = 0;
    const doc = { artikel: { '1': { gliederung: [] } }, kopf: { titel: 'OR' } };
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (String(url).includes('FEHLT')) return status(404);
      return ++ruf === 1 ? status(500) : jsonOk(doc);
    }));
    const b = await browse();
    await expect(b.ladeStrukturDokumentStreng('bund', 'OR')).rejects.toThrow(/500/);
    await expect(b.ladeStrukturDokumentStreng('bund', 'OR')).resolves.toEqual({ artikel: doc.artikel, kopf: doc.kopf });
    await expect(b.ladeStrukturDokumentStreng('bund', 'FEHLT')).resolves.toEqual({ artikel: null, kopf: null });
  });
});
