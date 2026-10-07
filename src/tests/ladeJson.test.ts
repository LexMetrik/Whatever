/**
 * ARCH-REVIEW · zentraler JSON-Lader mit Formprüfung (7.10.2026).
 *
 * Anlass: ~25 Lade-Stellen castete `(await res.json()) as Ziel` ungeprüft. JSON
 * unter public/ wird 1 h gecacht, JS ist immutable — nach einem Deploy kann ein
 * offener Tab altes JS mit neuem JSON mischen. Eine geänderte Form lief dann
 * STILL durch («nichts erfasst», «keine Anker», später ein TypeError) statt als
 * Ladefehler zu erscheinen (§8).
 *
 * Teil 1: der Lader selbst. Teil 2: der Formfehler an echten Lade-Stellen —
 * jede läuft in ihren BESTEHENDEN Fehlerpfad (fehler-Zustand / null ohne Cache /
 * Wurf), nicht in neue UI. Teil 2 ist der Rot-Beweis: gegen die Lader VOR der
 * Umstellung schlägt er fehl (siehe PR-Body).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ladeJson, ladeJsonStreng, pruefeFelder } from '../lib/ladeJson';
import { ladeKantenShardErgebnis, _leereKantenShardCache } from '../lib/materialien/kanten-shard';
import { ladeErlassDateiStreng } from '../lib/normtext/browse';
import { ladeHistorieShard } from '../lib/normtext/historie-laden';
import { ladeLeitfallShard, _leereShardCache } from '../lib/rechtsprechung/norm-index';
import { ladeAnkerSidecar } from '../lib/entstehung/anker';
import { ladeBezugsShard } from '../lib/rechtsprechung/bezuege';

type Antwort = { status: number; body?: unknown; typ?: string };

function stubFetch(map: Record<string, Antwort>) {
  const f = vi.fn(async (url: string) => {
    const a = map[url] ?? { status: 404 };
    return {
      ok: a.status >= 200 && a.status < 300, status: a.status,
      headers: { get: () => a.typ ?? 'application/json' },
      json: async () => a.body,
    } as unknown as Response;
  });
  vi.stubGlobal('fetch', f);
  return f;
}

afterEach(() => { vi.unstubAllGlobals(); _leereKantenShardCache(); _leereShardCache(); });

const P = pruefeFelder('test/x.json', { eintraege: 'array', kopf: 'objekt', name: 'string' });
const GUT = { eintraege: [], kopf: {}, name: 'x' };

describe('ladeJson — Status und Form', () => {
  it('gültige Form: Wert unverändert (gleiche Referenz) zurück', async () => {
    stubFetch({ '/a.json': { status: 200, body: GUT } });
    expect(await ladeJson('/a.json', P)).toBe(GUT);
  });

  it('404 → null (Datei fehlt), jeder andere Status wirft mit URL', async () => {
    stubFetch({ '/b.json': { status: 500 } });
    expect(await ladeJson('/fehlt.json', P)).toBeNull();
    await expect(ladeJson('/b.json', P)).rejects.toThrow('HTTP 500 für /b.json');
  });

  it('Formfehler wirft mit benannter Quelle und benanntem Feld', async () => {
    stubFetch({
      '/c.json': { status: 200, body: { ...GUT, eintraege: 'kaputt' } },
      '/d.json': { status: 200, body: { eintraege: [], kopf: {} } },
      '/e.json': { status: 200, body: [] },
      '/f.json': { status: 200, body: null },
    });
    await expect(ladeJson('/c.json', P)).rejects.toThrow(/test\/x\.json: Pflichtfeld «eintraege» fehlt oder ist kein Array/);
    await expect(ladeJson('/d.json', P)).rejects.toThrow(/Pflichtfeld «name» fehlt oder ist kein String/);
    await expect(ladeJson('/e.json', P)).rejects.toThrow(/Wurzel ist kein Objekt/);
    await expect(ladeJson('/f.json', P)).rejects.toThrow(/Wurzel ist kein Objekt/);
  });

  it('alsFehlend: SPA-Rückfall (200 text/html) gilt wie eine fehlende Datei', async () => {
    stubFetch({ '/g.json': { status: 200, typ: 'text/html', body: undefined } });
    expect(await ladeJson('/g.json', P, { alsFehlend: (r) => /html/.test(r.headers.get('content-type') ?? '') })).toBeNull();
  });

  it('ladeJsonStreng: auch die 404 wirft', async () => {
    stubFetch({});
    await expect(ladeJsonStreng('/fehlt.json', P)).rejects.toThrow('HTTP 404 für /fehlt.json');
  });

  it('Eintrags-Prüfer läuft auf der Stichprobe der Record-Wurzel', async () => {
    const p = pruefeFelder('test/map.json', {}, (k, w) => (typeof w === 'string' ? null : 'Wert ist kein String'));
    stubFetch({ '/h.json': { status: 200, body: { a: 'x', b: 7 } } });
    await expect(ladeJson('/h.json', p)).rejects.toThrow(/Eintrag «b»: Wert ist kein String/);
  });
});

describe('Formfehler an echten Lade-Stellen — bestehender Fehlerpfad, kein stilles «leer»', () => {
  it('Kanten-Shard mit umbenanntem Feld: fehler (vorher: ok + leere Kanten = «nichts erfasst»)', async () => {
    stubFetch({ '/materialien/kanten/ARG.json': { status: 200, body: { erzeugt: '2026-10-07', neu: [] } } });
    expect(await ladeKantenShardErgebnis('ARG')).toEqual({ zustand: 'fehler' });
  });

  it('Erlass-Datei ohne eintraege: WIRFT und wird nicht gecacht (vorher: null = «nicht im Bestand», dauerhaft)', async () => {
    const f = stubFetch({ '/normtext/bund/OR.json': { status: 200, body: { erzeugt: 'x', eintraege: 'kaputt' } } });
    await expect(ladeErlassDateiStreng('bund/OR.json')).rejects.toThrow(/Pflichtfeld «eintraege»/);
    stubFetch({ '/normtext/bund/OR.json': { status: 200, body: { erzeugt: 'x', eintraege: [] } } });
    expect((await ladeErlassDateiStreng('bund/OR.json'))?.eintraege).toEqual([]);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('Historie-Shard ohne artikel: null und nicht gecacht (vorher: Objekt durchgereicht, TypeError im Leser)', async () => {
    const f = stubFetch({ '/normtext/historie/HFORM.json': { status: 200, body: { erlass: 'HFORM' } } });
    expect(await ladeHistorieShard('HFORM')).toBeNull();
    expect(await ladeHistorieShard('HFORM')).toBeNull();
    expect(f).toHaveBeenCalledTimes(2);
  });

  it('Leitfall-Shard ohne proArtikel: null und nicht gecacht', async () => {
    const f = stubFetch({ '/rechtsprechung/norm-index/LFORM.json': { status: 200, body: { erlass: 'LFORM' } } });
    expect(await ladeLeitfallShard('LFORM')).toBeNull();
    expect(await ladeLeitfallShard('LFORM')).toBeNull();
    expect(f).toHaveBeenCalledTimes(2);
  });

  it('Anker-Sidecar ohne anker: null (vorher: Objekt, `s.anker.find` warf später)', async () => {
    stubFetch({ '/materialien/anker/AFORM.json': { status: 200, body: { botschaft: 'AFORM' } } });
    expect(await ladeAnkerSidecar('AFORM')).toBeNull();
  });

  it('Bezugs-Shard ohne proArtikel: wirft (der Aufrufer weist den Ladefehler aus), nicht gecacht', async () => {
    const f = stubFetch({ '/rechtsprechung/bezuege/BFORM.json': { status: 200, body: { erlass: 'BFORM' } } });
    await expect(ladeBezugsShard('BFORM')).rejects.toThrow(/Pflichtfeld/);
    await expect(ladeBezugsShard('BFORM')).rejects.toThrow(/Pflichtfeld/);
    expect(f).toHaveBeenCalledTimes(2);
  });
});
