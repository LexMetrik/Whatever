/**
 * Tests für den Curia-Abruf (scripts/entstehung/curia-abruf.ts) — Wiederholversuch,
 * 4xx-Grenze, Paging-Wächter, Takt je Versuch, Log je Wiederholung. Kein echtes Netz,
 * keine echte Zeit: fetchImpl, warte, drossel und log sind injiziert (§2).
 * Anlass: Posten 2026-09-21 «Curia-Retry ist ungetestet — vor dem Monatslauf 1.10.2026».
 */

import { describe, it, expect } from 'vitest';
import { odata, VERSUCHE, BACKOFF_MS } from '../../scripts/entstehung/curia-abruf.ts';

type Schritt = Error | { status: number; body?: unknown; typ?: string };

/** Minimal-Response mit genau den vom Code genutzten Feldern. */
function antwort(s: { status: number; body?: unknown; typ?: string }): Response {
  const typ = s.typ ?? 'application/json';
  return {
    ok: s.status >= 200 && s.status < 300,
    status: s.status,
    headers: { get: (k: string) => (k.toLowerCase() === 'content-type' ? typ : null) },
    json: async () => s.body ?? { d: [] },
  } as unknown as Response;
}

/** Protokolliert Reihenfolge von drossel/fetch/warte/log, damit «Takt vor JEDEM Versuch» prüfbar ist. */
function umgebung(skript: Schritt[]) {
  const spur: string[] = [];
  const wartezeiten: number[] = [];
  const logs: string[] = [];
  let i = 0;
  const fetchImpl = (async () => {
    spur.push('fetch');
    const s = skript[Math.min(i, skript.length - 1)];
    i += 1;
    if (s instanceof Error) throw s;
    return antwort(s);
  }) as unknown as typeof fetch;
  return {
    spur, wartezeiten, logs,
    aufrufe: () => i,
    umg: {
      fetchImpl,
      drossel: async () => { spur.push('drossel'); },
      warte: async (ms: number) => { spur.push('warte'); wartezeiten.push(ms); },
      log: (z: string) => { logs.push(z); },
    },
  };
}

const ZEILE = { d: [{ ID: 1, Title: 'x' }] };

describe('Curia-Abruf: Konstanten des Monatslaufs', () => {
  it('drei Versuche, Backoff 1000/4000 ms', () => {
    expect(VERSUCHE).toBe(3);
    expect(BACKOFF_MS).toEqual([1000, 4000]);
  });
});

describe('Curia-Abruf: Wiederholversuch', () => {
  it('(1) Netzfehler beim 1. Versuch ⇒ 2. Versuch wird gefahren und gelingt, mit Log-Zeile', async () => {
    const t = umgebung([new Error('ConnectTimeoutError'), { status: 200, body: ZEILE }]);
    const zeilen = await odata('Business', "BusinessShortNumber eq '17.059'", 'ID,Title', t.umg);
    expect(zeilen).toEqual([{ ID: 1, Title: 'x' }]);
    expect(t.aufrufe()).toBe(2);
    expect(t.spur).toEqual(['drossel', 'fetch', 'warte', 'drossel', 'fetch']);
    expect(t.wartezeiten).toEqual([1000]);
    expect(t.logs).toHaveLength(1);
    expect(t.logs[0]).toBe(
      "curia: Versuch 1/3 für Business (BusinessShortNumber eq '17.059') gescheitert — "
      + 'Error: ConnectTimeoutError; neuer Versuch in 1000 ms',
    );
  });

  it('(2) 5xx bis zur Erschöpfung ⇒ harter Fehler nach genau 3 Versuchen, Backoff 1000/4000', async () => {
    const t = umgebung([{ status: 503 }]);
    await expect(odata('Bill', 'f', undefined, t.umg))
      .rejects.toThrow('Curia antwortet 503 für Bill (f) — auch nach 3 Versuchen');
    expect(t.aufrufe()).toBe(3);
    expect(t.wartezeiten).toEqual([1000, 4000]);
    expect(t.spur).toEqual(['drossel', 'fetch', 'warte', 'drossel', 'fetch', 'warte', 'drossel', 'fetch']);
    expect(t.logs).toHaveLength(2);
    expect(t.logs[1]).toContain('Versuch 2/3 für Bill (f) gescheitert — HTTP 503; neuer Versuch in 4000 ms');
  });

  it('(2b) Netzfehler bis zur Erschöpfung ⇒ harter Fehler mit Ursache, genau 3 Versuche', async () => {
    const ursache = new Error('UND_ERR_CONNECT_TIMEOUT');
    const t = umgebung([ursache]);
    const fehler = await odata('Vote', 'f', undefined, t.umg).catch((e: unknown) => e as Error);
    expect(fehler).toBeInstanceOf(Error);
    expect((fehler as Error).message).toBe('Curia nicht erreichbar für Vote (f) — 3 Versuche: Error: UND_ERR_CONNECT_TIMEOUT');
    expect((fehler as Error).cause).toBe(ursache);
    expect(t.aufrufe()).toBe(3);
    expect(t.wartezeiten).toEqual([1000, 4000]);
  });
});

describe('Curia-Abruf: was NICHT wiederholt werden darf', () => {
  it('(3) HTTP 404 ⇒ sofort harter Fehler, genau 1 Aufruf, kein Warten, kein Log', async () => {
    const t = umgebung([{ status: 404 }, { status: 200, body: ZEILE }]);
    await expect(odata('Resolution', 'f', undefined, t.umg)).rejects.toThrow('Curia antwortet 404 für Resolution (f)');
    expect(t.aufrufe()).toBe(1);
    expect(t.wartezeiten).toEqual([]);
    expect(t.logs).toEqual([]);
    expect(t.spur).toEqual(['drossel', 'fetch']);
  });

  it('(3b) HTTP 429 ist ein 4xx ⇒ ebenfalls sofort harter Fehler (keine Wiederholung)', async () => {
    const t = umgebung([{ status: 429 }, { status: 200, body: ZEILE }]);
    await expect(odata('Voting', 'f', undefined, t.umg)).rejects.toThrow('Curia antwortet 429 für Voting (f)');
    expect(t.aufrufe()).toBe(1);
  });

  it('(4) Antwort mit __next ⇒ sofortiger Fehler, der Retry überfährt den Paging-Wächter nicht', async () => {
    const t = umgebung([
      { status: 200, body: { d: { results: [{ ID: 1 }], __next: 'https://ws.parlament.ch/odata.svc/Objective?$skiptoken=1' } } },
      { status: 200, body: ZEILE },
    ]);
    await expect(odata('Objective', 'f', undefined, t.umg)).rejects.toThrow(/UNVOLLSTÄNDIG — sie trägt «__next»/);
    expect(t.aufrufe()).toBe(1);
    expect(t.wartezeiten).toEqual([]);
  });

  it('(4b) falscher Content-Type ⇒ sofortiger Fehler ohne Wiederholung', async () => {
    const t = umgebung([{ status: 200, typ: 'text/html' }, { status: 200, body: ZEILE }]);
    await expect(odata('Business', 'f', undefined, t.umg)).rejects.toThrow('Curia antwortet Content-Type «text/html» statt JSON für Business');
    expect(t.aufrufe()).toBe(1);
  });
});
