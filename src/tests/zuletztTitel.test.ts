import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loeseZuletztTitel } from '../lib/zuletztTitel';

// Schreibzeit-Titelauflösung (lib/zuletztTitel.ts): löst Gesetz-/Entscheid-Pfade
// LAZY über die (dynamisch importierten) Manifest-Lader auf. Getestet gegen einen
// gemockten fetch — die Manifest-Lader in normtext/browse + rechtsprechung/browse
// cachen modulweit, das Mock liefert darum über den ganzen Lauf DASSELBE Manifest
// (verschiedene Szenarien über verschiedene Pfade gegen dieselben Daten).

const GESETZE = {
  erzeugt: '2026-07-03',
  erlasse: [
    { key: 'OR', ebene: 'bund', kanton: null, kuerzel: 'OR', titel: 'Obligationenrecht', sr: '220', rechtsgebiet: 'obligationenrecht', sprache: 'de', rang: 1, status: 'snapshot', datei: 'bund/OR.json', artikelAnzahl: 1, stand: '2026-01-01', quelleUrl: 'https://x', fassungsToken: 't', pdfPfad: null },
    // Erlass OHNE Kürzel → langer Titel-Fallback wird gekappt.
    { key: 'LANG', ebene: 'bund', kanton: null, kuerzel: '', titel: 'Bundesgesetz über einen ausserordentlich langen Titel', sr: '999', rechtsgebiet: 'obligationenrecht', sprache: 'de', rang: 2, status: 'snapshot', datei: 'bund/LANG.json', artikelAnzahl: 1, stand: '2026-01-01', quelleUrl: 'https://x', fassungsToken: 't', pdfPfad: null },
  ],
};
const ENTSCHEIDE = {
  erzeugt: '2026-07-03',
  entscheide: [
    { key: 'bge-151-iii-377', zitierung: 'BGE 151 III 377', nummer: '4A_1/2025', bgeReferenz: '151 III 377', datei: 'bund/bge-151-iii-377.json' },
  ],
};
const MATERIALIEN = {
  erzeugt: '2026-07-03',
  materialien: [
    { key: 'estv-ks-42', titel: 'Kreisschreiben Nr. 42', behoerdeKuerzel: 'ESTV', nummer: '42' },
  ],
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const body = url.includes('/normtext/register.json') ? GESETZE
      : url.includes('/rechtsprechung/entscheid-index.json') ? ENTSCHEIDE
      : url.includes('/materialien/register.json') ? MATERIALIEN
      : null;
    return { ok: body !== null, json: async () => body } as unknown as Response;
  }));
});
afterEach(() => vi.unstubAllGlobals());

describe('loeseZuletztTitel — Schreibzeit-Auflösung', () => {
  it('Gesetz: Kürzel aus dem Manifest (OR)', async () => {
    expect(await loeseZuletztTitel('/gesetze/bund/OR')).toBe('OR');
  });

  it('Gesetz ohne Kürzel: langer Titel wird an der Wortgrenze gekappt (Kurzform-Vorgabe)', async () => {
    const t = await loeseZuletztTitel('/gesetze/bund/LANG');
    expect(t).toBeTruthy();
    expect(t!.length).toBeLessThanOrEqual(40);
    // Wortgrenze, kein Mitten-im-Wort-Schnitt («… ausserordentli…»):
    expect(t).toBe('Bundesgesetz über einen…');
  });

  it('Gesetz mit unbekanntem Schlüssel → null (kein Roh-Slug, §8)', async () => {
    expect(await loeseZuletztTitel('/gesetze/bund/GIBTESNICHT')).toBeNull();
  });

  it('Entscheid: Zitierung aus dem Manifest (BGE)', async () => {
    expect(await loeseZuletztTitel('/rechtsprechung/bge-151-iii-377')).toBe('BGE 151 III 377');
  });

  it('Entscheid mit unbekanntem Schlüssel → null', async () => {
    expect(await loeseZuletztTitel('/rechtsprechung/foo')).toBeNull();
  });

  it('Material: Titel aus dem Manifest (O1 — Tracking auf Materialien ausgeweitet)', async () => {
    expect(await loeseZuletztTitel('/materialien/estv-ks-42')).toBe('Kreisschreiben Nr. 42');
  });

  it('Material mit unbekanntem Schlüssel → null', async () => {
    expect(await loeseZuletztTitel('/materialien/foo')).toBeNull();
  });

  it('kein Gesetz-/Entscheid-/Katalog-Pfad → null', async () => {
    expect(await loeseZuletztTitel('/irgendwas/xyz')).toBeNull();
  });
});
