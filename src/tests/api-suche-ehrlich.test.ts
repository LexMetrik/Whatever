import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import handler from '../../api/suche';

// E0-BRANDSCHUTZ (HN-11, SA-05 / ZP-SA-N1): die Edge-Suche api/suche.ts meldet einen
// DB-Fehler als FEHLER (502, generisch), nie als «0 Treffer», und gibt anonymen Aufrufern
// keine Fehlerdetails (Token, SQL, Host). Zusätzlich liefert sie den Stand der Replika
// (`sync_meta.stand`) in derselben Pipeline-Anfrage mit (§8: der Nutzer sieht die Frische).
// Turso (Hrana /v2/pipeline) wird über ein gemocktes globales fetch simuliert.

const URL_ENV = 'libsql://test-db.turso.io';
// Token mit eingebettetem LF/CR UND Geheimnis-Muster: ein echtes fetch wirft bei so einem
// Header-Wert einen TypeError, dessen Meldung den Wert enthält (die Leck-Quelle von SA-05).
const BOESER_TOKEN = 'eyJhbGciOiJFZERTQSJ9.GEHEIM-NUTZLAST\r\nX-Injected: 1';

type Stmt = { sql: string; args: Array<{ value: unknown }> };
type PipelineErgebnis =
  | {
      type: 'ok';
      response: {
        type: 'execute';
        result: { cols: Array<{ name: string }>; rows: Array<Array<{ type: string; value: string | null }>> };
      };
    }
  | { type: 'error'; error: { message: string; code?: string } };

function ok(cols: string[], rows: Array<Array<string | null>>): PipelineErgebnis {
  return {
    type: 'ok',
    response: {
      type: 'execute',
      result: { cols: cols.map((name) => ({ name })), rows: rows.map((z) => z.map((value) => ({ type: 'text', value }))) },
    },
  };
}
const fehler = (message: string): PipelineErgebnis => ({ type: 'error', error: { message, code: 'SQLITE_ERROR' } });

/** Antwortet je Anweisung per Regel; Reihenfolge der results = Reihenfolge der requests. */
function turso(regel: (sql: string) => PipelineErgebnis, status = 200) {
  return vi.fn(async (_url: string, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as { requests: Array<{ type: string; stmt?: Stmt }> };
    const results = body.requests.map((r) =>
      r.type === 'execute' ? regel(r.stmt!.sql) : { type: 'ok', response: { type: 'close' } },
    );
    return new Response(JSON.stringify({ results }), { status, headers: { 'Content-Type': 'application/json' } });
  });
}

const istStand = (sql: string) => sql.includes('sync_meta');
const istCount = (sql: string) => /count\(/i.test(sql);
const istEntscheid = (sql: string) => sql.toLowerCase().includes('entscheid');
const ARTIKEL_ZEILE = {
  erlass_key: 'OR',
  art_id: 'art_253',
  artikel: '253',
  artikel_label: 'Art. 253',
  quelle_url: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_253',
  bloecke_json: JSON.stringify([{ text: 'Durch den Mietvertrag verpflichtet sich der Vermieter, dem Mieter eine Sache zu überlassen.' }]),
  abkuerzung: 'OR',
};

async function ruf(
  query = 'miete',
  extra = '',
): Promise<{ status: number; text: string; json: Record<string, unknown> }> {
  const res = await handler(new Request(`https://lexmetrik.test/api/suche?q=${query}${extra}`));
  const text = await res.text();
  return { status: res.status, text, json: JSON.parse(text) as Record<string, unknown> };
}

beforeEach(() => {
  process.env.TURSO_DATABASE_URL = URL_ENV;
  process.env.TURSO_AUTH_TOKEN = 'tok-harmlos';
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.TURSO_DATABASE_URL;
  delete process.env.TURSO_AUTH_TOKEN;
});

describe('api/suche — keine Fehlerdetails an Aufrufer (SA-05 / ZP-SA-N1)', () => {
  it('Token mit LF/CR: die Fetch-Ausnahme (Header-Wert in der Meldung) steht NICHT im Antworttext', async () => {
    process.env.TURSO_AUTH_TOKEN = BOESER_TOKEN;
    // Echtes Header-Validierungsverhalten von undici/Node: der TypeError nennt den Wert.
    vi.stubGlobal('fetch', async (_u: string, init?: RequestInit) => {
      new Headers(init?.headers as Record<string, string>);
      return new Response('{}');
    });
    const { status, text, json } = await ruf();
    expect(status).toBe(502);
    expect(json).toEqual({ fehler: 'Suche vorübergehend nicht verfügbar', code: 'suche-nicht-verfuegbar' });
    expect(text).not.toContain('GEHEIM-NUTZLAST');
    expect(text).not.toContain('eyJhbGci');
    expect(text).not.toContain('X-Injected');
    expect(json).not.toHaveProperty('detail');
  });

  it('Diagnosespur bleibt: console.error trägt die Ursache, aber geschwärzt und einzeilig', async () => {
    process.env.TURSO_AUTH_TOKEN = BOESER_TOKEN;
    vi.stubGlobal('fetch', async () => {
      throw new Error(`Invalid header value Bearer ${BOESER_TOKEN} (Host test-db.turso.io)`);
    });
    await ruf();
    expect(console.error).toHaveBeenCalledTimes(1);
    const zeile = String(vi.mocked(console.error).mock.calls[0]?.[0]);
    expect(zeile).toContain('api/suche');
    expect(zeile).toContain('[token]');
    expect(zeile).not.toContain('GEHEIM-NUTZLAST');
    expect(zeile).not.toMatch(/[\r\n]/);
  });

  it('Turso-Fehlermeldung mit Geheimnis-Muster (HTTP 200, Fehler in einer Anweisung) landet nicht im Antworttext', async () => {
    vi.stubGlobal(
      'fetch',
      turso((sql) =>
        istCount(sql)
          ? fehler('no such table: artikel_fts at libsql://secret-host.turso.io token=abc123SECRET')
          : ok(['n'], [['0']]),
      ),
    );
    const { status, text } = await ruf();
    expect(status).toBe(502);
    expect(text).not.toContain('abc123SECRET');
    expect(text).not.toContain('secret-host');
    expect(text).not.toContain('no such table');
  });

  it('HTTP-Fehler von Turso (500) → 502, generisch', async () => {
    vi.stubGlobal('fetch', async () => new Response('interner Fehler mit SECRET-XYZ', { status: 500 }));
    const { status, text } = await ruf();
    expect(status).toBe(502);
    expect(text).not.toContain('SECRET-XYZ');
    expect(text).not.toContain('Turso HTTP');
  });

  it('Antwort ohne results (Müll) → 502, nie 200', async () => {
    vi.stubGlobal('fetch', async () => new Response('{"x":1}', { status: 200 }));
    expect((await ruf()).status).toBe(502);
  });
});

describe('api/suche — Teil-Fehler ist ein Fehler, nie «0 Treffer»', () => {
  it('Treffer-Anweisung scheitert, Count läuft → 502 statt 200/0 Treffer', async () => {
    vi.stubGlobal('fetch', turso((sql) => (istCount(sql) ? ok(['n'], [['3']]) : fehler('fts5: syntax error'))));
    const { status, json } = await ruf();
    expect(status).toBe(502);
    expect(json).not.toHaveProperty('artikel');
    expect(json).not.toHaveProperty('entscheide');
  });

  it('Count-Anweisung scheitert, Treffer laufen → 502', async () => {
    vi.stubGlobal('fetch', turso((sql) => (istCount(sql) ? fehler('boom') : ok(['id'], []))));
    expect((await ruf()).status).toBe(502);
  });

  it('Scheitert nur die Entscheide-Hälfte (typ=alle), scheitert die ganze Antwort', async () => {
    vi.stubGlobal(
      'fetch',
      turso((sql) => {
        if (istStand(sql)) return ok(['wert'], [['2026-10-07T03:00:00.000Z']]);
        if (istEntscheid(sql)) return fehler('entscheide kaputt');
        return istCount(sql) ? ok(['n'], [['1']]) : ok(Object.keys(ARTIKEL_ZEILE), [Object.values(ARTIKEL_ZEILE)]);
      }),
    );
    expect((await ruf()).status).toBe(502);
  });
});

describe('api/suche — Suchindex-Stand (§8)', () => {
  const stdRegel = (stand: PipelineErgebnis) => (sql: string) =>
    istStand(sql) ? stand : istCount(sql) ? ok(['n'], [['0']]) : ok(['id'], []);

  it('liefert `stand` (ISO) aus sync_meta, in DERSELBEN Pipeline-Anfrage (kein Zusatz-Request)', async () => {
    const f = turso(stdRegel(ok(['wert'], [['2026-10-05T04:17:09.123Z']])));
    vi.stubGlobal('fetch', f);
    const { status, json } = await ruf('miete', '&typ=artikel');
    expect(status).toBe(200);
    expect(json.stand).toBe('2026-10-05T04:17:09.123Z');
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('typ=alle: Stand nur EINMAL angefragt (erste Pipeline), zwei Requests insgesamt', async () => {
    const f = turso(stdRegel(ok(['wert'], [['2026-10-05T04:17:09.123Z']])));
    vi.stubGlobal('fetch', f);
    const { json } = await ruf();
    expect(json.stand).toBe('2026-10-05T04:17:09.123Z');
    expect(f).toHaveBeenCalledTimes(2);
    const standAnfragen = f.mock.calls.flatMap(([, init]) =>
      (JSON.parse(String(init?.body)) as { requests: Array<{ stmt?: Stmt }> }).requests.filter(
        (r) => r.stmt && istStand(r.stmt.sql),
      ),
    );
    expect(standAnfragen).toHaveLength(1);
  });

  it('typ=entscheide: Stand kommt aus der Entscheide-Pipeline', async () => {
    vi.stubGlobal('fetch', turso(stdRegel(ok(['wert'], [['2026-10-06T00:00:00Z']]))));
    expect((await ruf('miete', '&typ=entscheide')).json.stand).toBe('2026-10-06T00:00:00.000Z');
  });

  it('Marke fehlt (leere Tabelle) → kein `stand`-Schlüssel, Suche bleibt 200', async () => {
    vi.stubGlobal('fetch', turso(stdRegel(ok(['wert'], []))));
    const { status, json } = await ruf();
    expect(status).toBe(200);
    expect(json).not.toHaveProperty('stand');
    expect(json).toHaveProperty('artikel');
  });

  it('sync_meta existiert nicht (Stand-Anweisung scheitert) → 200 ohne `stand` — kein Suchfehler', async () => {
    vi.stubGlobal('fetch', turso(stdRegel(fehler('no such table: sync_meta'))));
    const { status, json } = await ruf();
    expect(status).toBe(200);
    expect(json).not.toHaveProperty('stand');
  });

  it('Marke ist kein Datum → kein erfundener Stand', async () => {
    vi.stubGlobal('fetch', turso(stdRegel(ok(['wert'], [['gestern Abend']]))));
    const { status, json } = await ruf();
    expect(status).toBe(200);
    expect(json).not.toHaveProperty('stand');
  });

  it('Treffer und Gesamtzahl bleiben unverändert (additive Antwortform)', async () => {
    vi.stubGlobal(
      'fetch',
      turso((sql) =>
        istStand(sql)
          ? ok(['wert'], [['2026-10-05T04:17:09.123Z']])
          : istCount(sql)
            ? ok(['n'], [['1']])
            : istEntscheid(sql)
              ? ok(['id'], [])
              : ok(Object.keys(ARTIKEL_ZEILE), [Object.values(ARTIKEL_ZEILE)]),
      ),
    );
    const { status, json } = await ruf('miete', '&typ=artikel');
    expect(status).toBe(200);
    expect(Object.keys(json).sort()).toEqual(['artikel', 'stand']);
    const art = json.artikel as { gesamt: number; treffer: Array<{ id: string; titel: string }> };
    expect(art.gesamt).toBe(1);
    expect(art.treffer[0]).toMatchObject({ id: 'art:OR:art_253', titel: 'Art. 253 OR' });
  });
});

describe('api/suche — Ränder', () => {
  it('ohne Env-Variablen weiterhin ehrlicher 503 (unverändert)', async () => {
    delete process.env.TURSO_DATABASE_URL;
    const { status, json } = await ruf();
    expect(status).toBe(503);
    expect(json.fehler).toBe('Suche über die Masse noch nicht aktiviert');
  });

  it('leere/ungültige Query → 200 mit leeren Gruppen, ohne Turso-Aufruf (kein Stand)', async () => {
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    const { status, json } = await ruf('***');
    expect(status).toBe(200);
    expect(f).not.toHaveBeenCalled();
    expect(json).not.toHaveProperty('stand');
  });
});
