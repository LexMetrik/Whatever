// clir-Abruf: Ausweichen zwischen search.bger.ch und www.bger.ch + sichtbarer
// Ausfall (Anlass #1099, 25.9.2026: www.bger.ch lieferte 503, der BGE-Nachzug
// lief still ohne Urteilskopf/Regesten; Node-fetch scheitert an www.bger.ch
// zudem mit UNABLE_TO_VERIFY_LEAF_SIGNATURE, weil das Zwischenzertifikat fehlt).
// Netzfrei: fetch ist gestubbt, der Cache liegt in einem Temp-Ordner.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  holeClirHtml, clirKandidaten, clirUrl, clirAusfallZeile, clirStatistikZuruecksetzen,
} from '../../scripts/normtext/clir-regeste';

const TLS = () => Object.assign(new TypeError('fetch failed'), { cause: { code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' } });
const ok = (html = '<html>Urteilskopf</html>') => new Response(html, { status: 200 });

let cache: string;
let aufrufe: string[];
function stub(antwort: (host: string) => Response | Error) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const host = new URL(url).host;
    aufrufe.push(host);
    const a = antwort(host);
    if (a instanceof Error) throw a;
    return a;
  }));
}
const hole = () => holeClirHtml('152-V-2', 'de', cache, 0, { backoffMs: 0 });

beforeEach(() => {
  cache = mkdtempSync(join(tmpdir(), 'clir-test-'));
  aufrufe = [];
  clirStatistikZuruecksetzen();
});
afterEach(() => {
  vi.unstubAllGlobals();
  rmSync(cache, { recursive: true, force: true });
  clirStatistikZuruecksetzen();
});

describe('clirKandidaten / clirUrl', () => {
  it('Abruf-Reihenfolge search.bger.ch → www.bger.ch, gleicher Pfad', () => {
    const k = clirKandidaten('152-V-2', 'de');
    expect(k.map((u) => new URL(u).host)).toEqual(['search.bger.ch', 'www.bger.ch']);
    expect(new URL(k[0]).pathname + new URL(k[0]).search).toBe(new URL(k[1]).pathname + new URL(k[1]).search);
  });
  it('gespeicherter Provenienz-Link bleibt www.bger.ch', () => {
    expect(new URL(clirUrl('152-V-2', 'de')).host).toBe('www.bger.ch');
    expect(clirKandidaten('152-V-2', 'de')).toContain(clirUrl('152-V-2', 'de'));
  });
});

describe('holeClirHtml — Ausweichen', () => {
  it('weicht bei TLS-Fehler des ersten Hosts auf den zweiten aus', async () => {
    stub((h) => (h === 'search.bger.ch' ? TLS() : ok()));
    expect(await hole()).toBe('<html>Urteilskopf</html>');
    expect(aufrufe).toEqual(['search.bger.ch', 'www.bger.ch']);
    expect(clirAusfallZeile()).toBeNull();
  });
  it('weicht bei 503 des ersten Hosts auf den zweiten aus', async () => {
    stub((h) => (h === 'search.bger.ch' ? new Response('', { status: 503 }) : ok()));
    expect(await hole()).toBe('<html>Urteilskopf</html>');
    expect(aufrufe).toEqual(['search.bger.ch', 'www.bger.ch']);
    expect(clirAusfallZeile()).toBeNull();
  });
  it('weicht auch in umgekehrter Lage aus (www-Ausfall wie #1099 bleibt folgenlos)', async () => {
    stub((h) => (h === 'www.bger.ch' ? new Response('', { status: 503 }) : ok()));
    expect(await hole()).toBe('<html>Urteilskopf</html>');
    expect(aufrufe).toEqual(['search.bger.ch']);
  });
  it('kein Ausweichen bei 404 (Dokument fehlt ⇒ null, kein Ausfall)', async () => {
    stub(() => new Response('', { status: 404 }));
    expect(await hole()).toBeNull();
    expect(aufrufe).toEqual(['search.bger.ch']);
    expect(clirAusfallZeile()).toBeNull();
  });
  it('Cache-Treffer löst keinen Abruf aus', async () => {
    stub(() => ok('<html>erst</html>'));
    await hole();
    stub(() => { throw new Error('darf nicht abrufen'); });
    expect(await hole()).toBe('<html>erst</html>');
  });
});

describe('holeClirHtml — sichtbarer Ausfall', () => {
  it('Summenzeile nennt Zahl, Nenner und Gründe je Host', async () => {
    stub((h) => (h === 'search.bger.ch' ? new Response('', { status: 503 }) : TLS()));
    expect(await hole()).toBeNull();
    expect(aufrufe).toHaveLength(6);   // 3 Runden × 2 Hosts
    expect(clirAusfallZeile()).toBe(
      '[clir] AUSFALL: 1 von 1 Abrufen fehlgeschlagen '
      + '(search.bger.ch: HTTP 503 ×1; www.bger.ch: UNABLE_TO_VERIFY_LEAF_SIGNATURE ×1)',
    );
  });
  it('zählt gelungene Abrufe in den Nenner, nicht in den Zähler', async () => {
    stub(() => ok());
    await holeClirHtml('152-V-3', 'de', cache, 0, { backoffMs: 0 });
    stub(() => new Response('', { status: 502 }));
    await hole();
    expect(clirAusfallZeile()).toMatch(/^\[clir\] AUSFALL: 1 von 2 Abrufen fehlgeschlagen \(/);
  });
});
