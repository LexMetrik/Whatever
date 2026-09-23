/**
 * D-6 (Audit D, S6-W1a 23.9.2026) — das Erlass-Blatt merkt sich offen/zu und
 * den Reiter JE ERLASS (`v3/blattGedaechtnis.ts`), robust gegen kaputten oder
 * werfenden Speicher. Den Ablauf im Browser (Reload) misst
 * `e2e/leser-v3-scrim-b7n1.e2e.ts` (D-6).
 * Rot zu bekommen: in `liesBlatt` die Reiter-Prüfung gegen `PANEL_REITER`
 * streichen (Fall «unbekannter Reiter»).
 */
import { describe, it, expect } from 'vitest';
import {
  istRueckkehr, ladeTypVon, liesBlatt, merkeBlatt, ortsart, rueckkehrMerker,
} from '../pages/gesetz-leser/v3/blattGedaechtnis';

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

/**
 * D-6 Nachzug (Auflage Gegenprüfung PR #1002, 23.9.2026): WANN wiederhergestellt
 * wird. Bis dahin setzte jedes `popstate` — auch ein Hash-Sprung über ein rohes
 * `<a href="#art-…">` — einen modul-globalen Merker dauerhaft, und der
 * Navigation-Timing-Typ `reload` galt für die ganze Lebensdauer des Dokuments:
 * danach war jede POP-Navigation eine «Rückkehr». Seither ist die Rückkehr an
 * die konkrete Navigation gebunden und wird beim Wiederherstellen verbraucht.
 * Rot zu bekommen: in `istRueckkehr` die Zeile `if (art === 'sprung') return false;`
 * streichen (Fälle «Hash-Sprung …»), oder in `wiederherstellen` das Verbrauchen.
 */
describe('D-6 — Wiederherstellen nur bei echter Rückkehr', () => {
  const OR = { key: 'default', pathname: '/gesetze/bund/OR', search: '' };
  const orHash = (h: string) => ({ ...OR, hash: h });
  const dok = (ladeTyp: string | undefined, popstateSeitLaden = false) => ({ ladeTyp, popstateSeitLaden });

  it('Reload → wiederhergestellt, einmal', () => {
    const d = dok('reload');
    const m = rueckkehrMerker(() => d);
    m.ortGesehen(OR, 'POP');
    expect(m.wiederherstellen(OR.key)).toBe(true);
    expect(m.wiederherstellen(OR.key), 'verbraucht').toBe(false);
  });

  it('Browser-Zurück in den Leser (neuer Rahmen nach popstate) → wiederhergestellt', () => {
    const d = dok('navigate', true);
    const m = rueckkehrMerker(() => d);
    m.ortGesehen({ ...OR, key: 'k0' }, 'POP');
    expect(m.wiederherstellen('k0')).toBe(true);
  });

  it('Browser-Zurück im selben Rahmen (anderer Erlass → OR) → wiederhergestellt', () => {
    const d = dok('navigate');
    const m = rueckkehrMerker(() => d);
    m.ortGesehen(OR, 'POP');
    expect(m.wiederherstellen(OR.key)).toBe(false);
    m.ortGesehen({ key: 'k1', pathname: '/gesetze/bund/ZGB', search: '' }, 'PUSH');
    expect(m.wiederherstellen('k1')).toBe(false);
    d.popstateSeitLaden = true;
    m.ortGesehen(OR, 'POP');
    expect(m.wiederherstellen(OR.key)).toBe(true);
  });

  it('Browser-Zurück auf einen Hash-Eintrag (Zustand null, Schlüssel «default») → wiederhergestellt', () => {
    const d = dok('navigate');
    const m = rueckkehrMerker(() => d);
    m.ortGesehen(orHash('#art-41'), 'POP');
    m.ortGesehen(orHash('#art-5'), 'POP'); // roher Hash-Link
    m.ortGesehen({ key: 'k2', pathname: '/bger/x', search: '' }, 'PUSH');
    d.popstateSeitLaden = true;
    m.ortGesehen(orHash('#art-5'), 'POP'); // Zurück: Pfad wechselt
    expect(m.wiederherstellen('default')).toBe(true);
  });

  it('Hash-Sprung nach früherem popstate → NICHT wiederhergestellt', () => {
    const d = dok('navigate');
    const m = rueckkehrMerker(() => d);
    m.ortGesehen(orHash('#art-41'), 'POP');
    d.popstateSeitLaden = true; // der Hash-Sprung löst ein natives popstate aus
    m.ortGesehen(orHash('#art-1'), 'POP');
    expect(m.wiederherstellen('default')).toBe(false);
    m.ortGesehen(orHash('#art-2'), 'POP');
    expect(m.wiederherstellen('default')).toBe(false);
  });

  it('Hash-Sprung nach Reload → NICHT (der Ladetyp klebt nicht am Dokument)', () => {
    const d = dok('reload');
    const m = rueckkehrMerker(() => d);
    m.ortGesehen(orHash('#art-41'), 'POP');
    d.popstateSeitLaden = true;
    m.ortGesehen(orHash('#art-1'), 'POP');
    expect(m.wiederherstellen('default')).toBe(false);
  });

  it('frischer Aufruf und In-App-Link → NICHT wiederhergestellt', () => {
    const d = dok('navigate');
    const m = rueckkehrMerker(() => d);
    m.ortGesehen(OR, 'POP');
    expect(m.wiederherstellen(OR.key)).toBe(false);
    m.ortGesehen({ key: 'k3', pathname: '/gesetze/bund/OR', search: '' }, 'PUSH');
    expect(m.wiederherstellen('k3')).toBe(false);
    expect(istRueckkehr('REPLACE', 'ortswechsel', dok('reload', true))).toBe(false);
  });

  it('Ladetyp unbekannt (Navigation Timing fehlt/wirft) → NICHT', () => {
    expect(istRueckkehr('POP', 'erstaufbau', dok(undefined))).toBe(false);
    expect(ladeTypVon({ getEntriesByType: () => { throw new Error('gesperrt'); } })).toBeUndefined();
    expect(ladeTypVon({ getEntriesByType: () => [{ type: 'reload' }] as unknown as PerformanceEntryList })).toBe('reload');
    expect(ladeTypVon(undefined)).toBeUndefined();
  });

  it('ortsart: nur Pfad/Suche zählen, der Hash nicht', () => {
    expect(ortsart(null, OR)).toBe('erstaufbau');
    expect(ortsart('/gesetze/bund/OR', orHash('#art-1'))).toBe('sprung');
    expect(ortsart('/gesetze/bund/OR', { ...OR, search: '?stand=2020' })).toBe('ortswechsel');
  });
});
