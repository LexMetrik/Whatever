// Regression W2·27-BUND-FERTIG (Fedlex-Frische-Lauf 36838192603, 1.10.2026): Bild-Sync nach Re-Pin.
// Fixture = der echte SSV-Fall im Kleinen: 20260701 hatte «image2.png» = Bild A, «image3.png» =
// Bild B; 20261001 fügt vorn ein Bild ein und nummeriert um («image2.png» = Bild X, «image3.png»
// = Bild A, «image4.png» = Bild B). Der alte Name-Cache hätte image3 = B (alte Bytes) behalten.
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { erstelleBilderSitzung } from './bilder-sync.ts';

const sha = (b: Buffer): string => createHash('sha256').update(b).digest('hex');
const png = (inhalt: string): Buffer => Buffer.from(`PNG:${inhalt}`);

let wurzel: string;
beforeEach(() => {
  wurzel = mkdtempSync(join(tmpdir(), 'bilder-sync-'));
});
afterEach(() => {
  rmSync(wurzel, { recursive: true, force: true });
});

/** Amtliche Quelle (Konsolidierung → imageN → Bytes); zählt Abrufe. */
function quelle(bilder: Record<string, Buffer>) {
  const abrufe: string[] = [];
  const fetchImpl = async (url: string) => {
    abrufe.push(url);
    const name = url.split('/').pop() ?? '';
    const b = bilder[name];
    return {
      ok: !!b,
      status: b ? 200 : 404,
      headers: { get: (h: string) => (h.toLowerCase() === 'content-type' ? (b ? 'image/png' : 'text/html') : null) },
      arrayBuffer: async () => {
        const roh = b ?? Buffer.from('<html>Casemates</html>');
        return roh.buffer.slice(roh.byteOffset, roh.byteOffset + roh.byteLength) as ArrayBuffer;
      },
    };
  };
  return { fetchImpl, abrufe };
}

const blockMit = (...srcs: string[]) => srcs.map((s) => ({ bild: { datei: s, alt: 'Amtliche Abbildung' } as { datei: string; alt: string; sha?: string } }));

function sitzung(f: ReturnType<typeof quelle>['fetchImpl'], konsolidierung: string) {
  return erstelleBilderSitzung({ name: 'SSV', eli: 'cc/1979/1961_1961_1961', konsolidierung, bilderWurzel: wurzel, fetchImpl: f });
}

describe('bilder-sync — Re-Pin mit umnummerierten Bildern', () => {
  it('stale-by-name: eine lokale Datei gleichen Namens aus der ALTEN Fassung wird durch die amtlichen Bytes der NEUEN ersetzt (sha aus den neuen Bytes)', async () => {
    const A = png('A'), B = png('B'), X = png('X');
    // Lauf 1: Konsolidierung 20260701 (image2 = A, image3 = B)
    const alt = quelle({ 'image2.png': A, 'image3.png': B });
    const s1 = sitzung(alt.fetchImpl, '20260701');
    const bl1 = blockMit('image/image2.png', 'image/image3.png');
    await s1.lade(bl1);
    expect(readFileSync(join(wurzel, 'ssv/image3.png'))).toEqual(B);
    // Lauf 2: Re-Pin 20261001 (image2 = X, image3 = A, image4 = B)
    const neu = quelle({ 'image2.png': X, 'image3.png': A, 'image4.png': B });
    const s2 = sitzung(neu.fetchImpl, '20261001');
    const bl2 = blockMit('image/image2.png', 'image/image3.png', 'image/image4.png');
    await s2.lade(bl2);
    expect(readFileSync(join(wurzel, 'ssv/image2.png'))).toEqual(X);
    expect(readFileSync(join(wurzel, 'ssv/image3.png'))).toEqual(A); // NICHT mehr B
    expect(readFileSync(join(wurzel, 'ssv/image4.png'))).toEqual(B);
    expect(bl2.map((b) => b.bild.sha)).toEqual([sha(X), sha(A), sha(B)]);
    expect(bl2.map((b) => b.bild.datei)).toEqual(['bilder/ssv/image2.png', 'bilder/ssv/image3.png', 'bilder/ssv/image4.png']);
    // die Abrufe gingen an die Konsolidierung des Pins
    expect(neu.abrufe.every((u) => u.includes('/20261001/de/html/image/'))).toBe(true);
  });

  it('verwaist: nach einem Re-Pin, der Bilder streicht, entfernt raeumeAuf genau die nicht referenzierten Dateien dieses Erlasses', async () => {
    const A = png('A'), B = png('B'), C = png('C');
    const s1 = sitzung(quelle({ 'image1.png': A, 'image2.png': B, 'image3.png': C }).fetchImpl, '20260701');
    await s1.lade(blockMit('image/image1.png', 'image/image2.png', 'image/image3.png'));
    expect(s1.raeumeAuf()).toEqual([]); // alles referenziert → nichts weg
    // fremder Erlass im selben Wurzelordner darf NIE angefasst werden
    mkdirSync(join(wurzel, 'vts'), { recursive: true });
    writeFileSync(join(wurzel, 'vts/image1.png'), png('VTS'));

    const s2 = sitzung(quelle({ 'image1.png': A, 'image2.png': B }).fetchImpl, '20261001');
    await s2.lade(blockMit('image/image1.png', 'image/image2.png'));
    expect(s2.raeumeAuf()).toEqual(['image3.png']);
    expect(readdirSync(join(wurzel, 'ssv')).sort()).toEqual(['image1.png', 'image2.png']);
    expect(existsSync(join(wurzel, 'vts/image1.png'))).toBe(true);
  });

  it('ein Erlass ohne Bilder mehr verliert seinen Ordner ganz', async () => {
    const s1 = sitzung(quelle({ 'image1.png': png('A') }).fetchImpl, '20260701');
    await s1.lade(blockMit('image/image1.png'));
    const s2 = sitzung(quelle({}).fetchImpl, '20261001');
    await s2.lade([{ bild: undefined } as never]);
    expect(s2.raeumeAuf()).toEqual(['image1.png']);
    expect(existsSync(join(wurzel, 'ssv'))).toBe(false);
  });

  it('idempotent: identische Bytes → Datei wird nicht neu geschrieben, sha identisch, nichts verwaist', async () => {
    const A = png('A');
    const mk = () => sitzung(quelle({ 'image1.png': A }).fetchImpl, '20260701');
    const bl1 = blockMit('image/image1.png');
    await mk().lade(bl1);
    const pfad = join(wurzel, 'ssv/image1.png');
    const mtime1 = readFileSync(pfad);
    const bl2 = blockMit('image/image1.png');
    const s2 = mk();
    await s2.lade(bl2);
    expect(readFileSync(pfad)).toEqual(mtime1);
    expect(bl2[0].bild.sha).toBe(bl1[0].bild.sha);
    expect(s2.raeumeAuf()).toEqual([]);
  });

  it('ein mehrfach referenziertes Bild wird nur einmal abgerufen', async () => {
    const q = quelle({ 'image1.png': png('A') });
    const s = sitzung(q.fetchImpl, '20260701');
    await s.lade(blockMit('image/image1.png'));
    await s.lade(blockMit('image/image1.png'));
    expect(q.abrufe).toHaveLength(1);
  });

  it('Escape-Hatch: Nicht-200 / Nicht-Bild (Soft-404-Shell) → Fehler, keine Datei, kein stilles Loch', async () => {
    const s = sitzung(quelle({}).fetchImpl, '20261001');
    await expect(s.lade(blockMit('image/image9.png'))).rejects.toThrow(/Download fehlgeschlagen/);
    expect(existsSync(join(wurzel, 'ssv/image9.png'))).toBe(false);
  });
});
