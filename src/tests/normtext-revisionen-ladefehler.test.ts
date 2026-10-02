/**
 * W2·17-UI-BEFUNDE · PE-F4-B01 + PA-13-B03 (1.10.2026): `ladeSidecar` / `revisionenFuerNorm`.
 *
 *  · PE-F4-B01  ein Netz-/HTTP-Fehler wurde als `null` bis zum Neuladen der Seite gecacht
 *               (Muster M-8, `lib/materialien/browse`) — jetzt nicht mehr: der nächste Aufruf
 *               versucht es erneut.
 *  · PA-13-B03  «Datei gibt es nicht» (404, oder SPA-Rückfall 200 text/html) ist KEIN
 *               Ladefehler: `nichtErfasst`, leere Liste. `null` bleibt dem echten Fehler.
 *
 * ROT ZU BEKOMMEN (§6.7): in `ladeSidecar` das `cache.delete` streichen (Cache-Fall) bzw.
 * den 404-Zweig auf `return null` setzen (Fehlt-Fälle).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { revisionenFuerNorm, _leereRevisionenCache } from '../lib/normtext/revisionen';

const SIDECAR = { erlassKey: 'X', sr: '1', abgerufen: '2026-10-01', reichweite: 'ab 2000', revisionen: [
  { art: 'aenderung', dateEntryInForce: '2024-01-01', ocUri: 'https://x/oc/1', quelleUrl: 'https://x' },
] };

type Antwort = { status: number; ct?: string; body?: unknown } | 'netz';
function stub(antworten: Antwort[]) {
  let i = 0;
  const f = vi.fn(async () => {
    const a = antworten[Math.min(i++, antworten.length - 1)];
    if (a === 'netz') throw new TypeError('Failed to fetch');
    return {
      ok: a.status >= 200 && a.status < 300, status: a.status,
      headers: { get: (k: string) => (k.toLowerCase() === 'content-type' ? (a.ct ?? 'application/json') : null) },
      json: async () => {
        if (a.ct?.includes('html')) throw new SyntaxError('Unexpected token <');
        return a.body;
      },
    };
  });
  vi.stubGlobal('fetch', f);
  return f;
}

beforeEach(() => { _leereRevisionenCache(); });
afterEach(() => { vi.unstubAllGlobals(); });

describe('PE-F4-B01 · ein Ladefehler wird nicht bis zum Neuladen festgehalten', () => {
  it('Netzfehler: erst null, nach Rückkehr des Netzes derselbe Aufruf mit Daten', async () => {
    const f = stub(['netz', { status: 200, body: SIDECAR }]);
    expect(await revisionenFuerNorm(['K1'])).toBeNull();
    const zweit = await revisionenFuerNorm(['K1']);
    expect(zweit?.revisionen).toHaveLength(1);
    expect(f).toHaveBeenCalledTimes(2);
  });
  it('HTTP 500: null, danach neuer Versuch', async () => {
    const f = stub([{ status: 500 }, { status: 200, body: SIDECAR }]);
    expect(await revisionenFuerNorm(['K2'])).toBeNull();
    expect((await revisionenFuerNorm(['K2']))?.revisionen).toHaveLength(1);
    expect(f).toHaveBeenCalledTimes(2);
  });
  it('kaputte Nutzlast bei Content-Type JSON: Fehler (null), nicht «nicht erfasst», nicht gecacht', async () => {
    const f = stub([{ status: 200, body: 'kein-objekt' }, { status: 200, body: SIDECAR }]);
    expect(await revisionenFuerNorm(['K3'])).toBeNull();
    expect((await revisionenFuerNorm(['K3']))?.revisionen).toHaveLength(1);
    expect(f).toHaveBeenCalledTimes(2);
  });
  it('gleichzeitige Aufrufer teilen EINEN Fetch; Erfolg bleibt gecacht', async () => {
    const f = stub([{ status: 200, body: SIDECAR }]);
    const [a, b] = await Promise.all([revisionenFuerNorm(['K4']), revisionenFuerNorm(['K4'])]);
    expect(a?.revisionen).toHaveLength(1);
    expect(b?.revisionen).toHaveLength(1);
    await revisionenFuerNorm(['K4']);
    expect(f).toHaveBeenCalledTimes(1);
  });
});

describe('PA-13-B03 · «keine Datei» ist kein Ladefehler', () => {
  it('404: leere Liste mit nichtErfasst — nicht null', async () => {
    stub([{ status: 404 }]);
    const a = await revisionenFuerNorm(['DSGVO']);
    expect(a).not.toBeNull();
    expect(a?.nichtErfasst).toBe(true);
    expect(a?.revisionen).toEqual([]);
  });
  it('200 text/html (SPA-Rückfall von vite dev/preview): ebenfalls nichtErfasst', async () => {
    stub([{ status: 200, ct: 'text/html; charset=utf-8' }]);
    const a = await revisionenFuerNorm(['DSGVO']);
    expect(a?.nichtErfasst).toBe(true);
  });
  it('«nicht erfasst» ist eine Auskunft und bleibt gecacht (kein zweiter Fetch)', async () => {
    const f = stub([{ status: 404 }]);
    await revisionenFuerNorm(['KI_VO']);
    await revisionenFuerNorm(['KI_VO']);
    expect(f).toHaveBeenCalledTimes(1);
  });
  it('ein echter Sidecar trägt NICHT das Flag, auch mit leerer Liste', async () => {
    stub([{ status: 200, body: { ...SIDECAR, revisionen: [] } }]);
    const a = await revisionenFuerNorm(['K5']);
    expect(a).not.toBeNull();
    expect(a?.nichtErfasst).toBeUndefined();
  });
  it('mehrere Keys: ein Treffer + ein Fehler → Daten (Teilbestand wie bisher)', async () => {
    stub([{ status: 200, body: SIDECAR }, 'netz']);
    const a = await revisionenFuerNorm(['A', 'B']);
    expect(a?.revisionen).toHaveLength(1);
    expect(a?.nichtErfasst).toBeUndefined();
  });
  it('mehrere Keys: nichts da + ein Fehler → Fehler (null), nicht «nicht erfasst»', async () => {
    stub([{ status: 404 }, 'netz']);
    expect(await revisionenFuerNorm(['A', 'B'])).toBeNull();
  });
  it('mehrere Keys: alle ohne Datei → nichtErfasst', async () => {
    stub([{ status: 404 }]);
    const a = await revisionenFuerNorm(['A', 'B']);
    expect(a?.nichtErfasst).toBe(true);
  });
});
