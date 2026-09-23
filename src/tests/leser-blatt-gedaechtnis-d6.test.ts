/**
 * D-6 (Audit D, S6-W1a 23.9.2026) — das Erlass-Blatt merkt sich offen/zu und
 * den Reiter JE ERLASS (`v3/blattGedaechtnis.ts`), robust gegen kaputten oder
 * werfenden Speicher. Den Ablauf im Browser (Reload) misst
 * `e2e/leser-v3-scrim-b7n1.e2e.ts` (D-6).
 * Rot zu bekommen: in `liesBlatt` die Reiter-Prüfung gegen `PANEL_REITER`
 * streichen (Fall «unbekannter Reiter»).
 */
import { describe, it, expect } from 'vitest';
import { liesBlatt, merkeBlatt } from '../pages/gesetz-leser/v3/blattGedaechtnis';

function speicher(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => { m.set(k, v); },
    removeItem: (k: string) => { m.delete(k); },
    clear: () => m.clear(),
    key: () => null,
    get length() { return m.size; },
  } as Storage;
}

describe('D-6 — Blatt-Gedächtnis je Erlass', () => {
  it('schreibt und liest je Erlass getrennt', () => {
    const s = speicher();
    merkeBlatt('OR', { offen: true, reiter: 'materialien' }, s);
    merkeBlatt('ZGB', { offen: false, reiter: 'aenderungen' }, s);
    expect(liesBlatt('OR', s)).toEqual({ offen: true, reiter: 'materialien' });
    expect(liesBlatt('ZGB', s)).toEqual({ offen: false, reiter: 'aenderungen' });
    expect(liesBlatt('StGB', s)).toBeNull();
  });

  it('verwirft Unbrauchbares statt es einzusetzen', () => {
    const s = speicher();
    s.setItem('lm-erlass-blatt:OR', '{kaputt');
    expect(liesBlatt('OR', s)).toBeNull();
    s.setItem('lm-erlass-blatt:OR', JSON.stringify({ offen: true, reiter: 'gibtsnicht' }));
    expect(liesBlatt('OR', s)).toBeNull();
    s.setItem('lm-erlass-blatt:OR', JSON.stringify({ offen: 'ja', reiter: 'entscheide' }));
    expect(liesBlatt('OR', s)).toBeNull();
  });

  it('ein werfender oder fehlender Speicher bricht nichts', () => {
    const wirft = { getItem: () => { throw new Error('gesperrt'); }, setItem: () => { throw new Error('Quote'); } };
    expect(liesBlatt('OR', wirft)).toBeNull();
    expect(() => merkeBlatt('OR', { offen: true, reiter: 'entscheide' }, wirft)).not.toThrow();
    expect(liesBlatt('OR', null)).toBeNull();
  });
});
