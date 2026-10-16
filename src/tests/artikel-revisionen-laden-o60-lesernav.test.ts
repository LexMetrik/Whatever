// LESER-NAV O-60 (16.10.2026) · `ladeRevisionShard`: 404 ⇒ null («Erlass ohne Revisions-Beleg»),
// Netzfehler/5xx/fremdes HTML ⇒ Wurf. Bis hierher gaben beide `null` zurück; das Blatt schrieb
// nach einem Ausfall des Artikel-Shards «Zu Art. N nichts erfasst.» (§8). Dieselbe Trennung wie
// `ladeBezugsShard` (S6-W1b, O-61).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ladeRevisionShard, ladeRevisionShards } from '../lib/verzahnung/artikel-revisionen';

const SHARD = { erlass: 'T', proArtikel: { '7': { iso: '2001-01-01', as: 'AS 2001 99' } } };

function antwort(status: number, body: unknown = SHARD, typ = 'application/json', html = ''): Response {
  const r = {
    status, ok: status >= 200 && status < 300, json: async () => body,
    headers: new Headers({ 'content-type': typ }), text: async () => html,
  } as Response;
  return Object.assign(r, { clone: () => r });
}

afterEach(() => { vi.unstubAllGlobals(); });

describe('ladeRevisionShard — «kein Shard» und «Abruf gescheitert» sind zwei Lagen', () => {
  it('404 ⇒ null, und gecacht (ein Fetch je Erlass)', async () => {
    const f = vi.fn(async () => antwort(404));
    vi.stubGlobal('fetch', f);
    await expect(ladeRevisionShard('O60-404')).resolves.toBeNull();
    await ladeRevisionShard('O60-404');
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('SPA-Rückfall (App-index.html mit 200, `vite dev`/`preview`) ⇒ null wie 404', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => antwort(200, null, 'text/html', '<div id="root"></div>')));
    await expect(ladeRevisionShard('O60-SPA')).resolves.toBeNull();
  });

  it('Netzfehler ⇒ Wurf, nicht null', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    await expect(ladeRevisionShard('O60-NETZ')).rejects.toBeInstanceOf(Error);
  });

  it('5xx ⇒ Wurf, nicht null', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => antwort(503)));
    await expect(ladeRevisionShard('O60-503')).rejects.toBeInstanceOf(Error);
  });

  it('fremde HTML-Seite (Captive-Portal) ⇒ Wurf, nicht null', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => antwort(200, null, 'text/html', '<html>Bitte anmelden</html>')));
    await expect(ladeRevisionShard('O60-PORTAL')).rejects.toBeInstanceOf(Error);
  });

  it('ein Fehlschlag wird nicht gecacht — der nächste Versuch lädt neu', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline'); }));
    await expect(ladeRevisionShard('O60-WIEDER')).rejects.toBeInstanceOf(Error);
    vi.stubGlobal('fetch', vi.fn(async () => antwort(200)));
    await expect(ladeRevisionShard('O60-WIEDER')).resolves.toMatchObject({ erlass: 'T' });
  });
});

describe('ladeRevisionShards — stille Abnehmer (Revisions-Badge) bleiben bei null', () => {
  it('ein gescheiterter Erlass reisst die anderen nicht mit; er steht als null in der Karte', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (String(url).includes('O60-GUT')) return antwort(200);
      throw new TypeError('offline');
    }));
    const m = await ladeRevisionShards(['O60-GUT', 'O60-SCHLECHT']);
    expect(m.get('O60-GUT')).toMatchObject({ erlass: 'T' });
    expect(m.get('O60-SCHLECHT')).toBeNull();
  });
});
