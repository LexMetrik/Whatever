// S6-W1b (W2·29-WERKBANK-LESER, Befunde E-3/D-3/B-8 vom 23.9.2026) ·
// Ladefehler ≠ «kein Entscheid».
//
// Bis hierher löste `ladeBezugsShard` JEDEN Fehlschlag zu `null` auf — 404
// ebenso wie Netzfehler und 5xx. Der Leser konnte die beiden Lagen darum nicht
// trennen und schrieb nach einem Netzabbruch «Zu Art. 41 ist kein Entscheid
// erfasst» — eine Aussage über den Bestand, wo eine über die Leitung stehen
// müsste (§8). Die Zusage jetzt: 404 ⇒ `null` (belegbar «kein Shard»),
// alles andere ⇒ Wurf, und der Wurf wird NICHT gecacht.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ladeBezugsShard } from '../lib/rechtsprechung/bezuege';

const SHARD = { erzeugt: 'x', erlass: 'T', erlassEbene: 'bund', dokumente: {}, proArtikel: {}, gesamtProArtikel: {} };

function antwort(status: number, body: unknown = SHARD, typ = 'application/json', html = ''): Response {
  const r = {
    status, ok: status >= 200 && status < 300, json: async () => body,
    headers: new Headers({ 'content-type': typ }),
    text: async () => html,
  } as Response;
  return Object.assign(r, { clone: () => r });
}

afterEach(() => { vi.unstubAllGlobals(); });

describe('ladeBezugsShard — Fehler und «kein Shard» sind zwei Lagen', () => {
  it('404 ⇒ null (kein Shard ist Wissen, kein Fehler)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => antwort(404)));
    await expect(ladeBezugsShard('S6-404')).resolves.toBeNull();
  });

  it('SPA-Rückfall (200 mit der App-index.html statt JSON) ⇒ null wie 404, kein Fehler', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => antwort(200, null, 'text/html', '<div id="root"></div>')));
    await expect(ladeBezugsShard('S6-SPA')).resolves.toBeNull();
  });

  // LESER-NAV O-61 (16.10.2026): jede Nicht-JSON-Antwort galt als «Shard fehlt» — auch die
  // Anmeldeseite eines Captive-Portals oder die Fehlerseite eines Proxys (200 text/html ohne
  // App-Wurzel). Das ist keine Auskunft über die Datei, sondern ein Ladefehler (Fehlerklasse
  // O-35 b): der Leser schrieb «kein Entscheid erfasst» (§8). In Prod gibt es für Fehlendes
  // den echten 404.
  it('fremde HTML-Seite (Captive-Portal, Proxy) ⇒ Wurf, nicht null', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => antwort(200, null, 'text/html; charset=utf-8', '<html><body>Bitte anmelden</body></html>')));
    await expect(ladeBezugsShard('S6-PORTAL')).rejects.toThrow(/keine Datendatei/);
  });

  it('fremde HTML-Seite wird nicht gecacht — der nächste Versuch lädt neu', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => antwort(200, null, 'text/html', '<html>Portal</html>')));
    await expect(ladeBezugsShard('S6-PORTAL2')).rejects.toBeInstanceOf(Error);
    vi.stubGlobal('fetch', vi.fn(async () => antwort(200)));
    await expect(ladeBezugsShard('S6-PORTAL2')).resolves.toMatchObject({ erlass: 'T' });
  });

  it('kaputtes JSON bei JSON-Typ ⇒ Wurf', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      status: 200, ok: true, headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => { throw new SyntaxError('Unexpected token'); },
    }) as unknown as Response));
    await expect(ladeBezugsShard('S6-KAPUTT')).rejects.toBeInstanceOf(Error);
  });

  it('Netzfehler ⇒ Wurf, nicht null', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    await expect(ladeBezugsShard('S6-NETZ')).rejects.toBeInstanceOf(Error);
  });

  it('5xx ⇒ Wurf, nicht null', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => antwort(503)));
    await expect(ladeBezugsShard('S6-503')).rejects.toBeInstanceOf(Error);
  });

  it('ein Fehlschlag wird nicht gecacht — der nächste Versuch lädt neu', async () => {
    const f = vi.fn(async () => { throw new TypeError('offline'); });
    vi.stubGlobal('fetch', f);
    await expect(ladeBezugsShard('S6-WIEDER')).rejects.toBeInstanceOf(Error);
    vi.stubGlobal('fetch', vi.fn(async () => antwort(200)));
    await expect(ladeBezugsShard('S6-WIEDER')).resolves.toMatchObject({ erlass: 'T' });
  });

  it('404 bleibt gecacht (ein Fetch je Erlass)', async () => {
    const f = vi.fn(async () => antwort(404));
    vi.stubGlobal('fetch', f);
    await ladeBezugsShard('S6-CACHE');
    await ladeBezugsShard('S6-CACHE');
    expect(f).toHaveBeenCalledTimes(1);
  });
});
