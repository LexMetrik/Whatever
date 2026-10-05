// Rückbau MONITOR 5.10.2026 (Entscheid David: «wichtig ist gesetzestext. der rest muss nicht
// zu einem rot führen.») — Klassen-Urteil des Runners scripts/run-netz-alle.ts, ohne Netz.
import { describe, it, expect } from 'vitest';
import { parseKette, urteil, status, type Verdikt } from '../../scripts/run-netz-alle';

const v = (tor: string, klasse: Verdikt['klasse'], exit: number): Verdikt =>
  ({ tor, args: [], klasse, exit, sekunden: 1, versuche: 1 });

describe('parseKette', () => {
  it('liest Glieder samt Argumenten', () => {
    const g = parseKette('npm run check:a && npm run check:b -- --x', 'gesetzestext');
    expect(g).toEqual([
      { tor: 'check:a', args: [], klasse: 'gesetzestext' },
      { tor: 'check:b', args: ['--', '--x'], klasse: 'gesetzestext' },
    ]);
  });
  it('leere Kette ⇒ keine Glieder', () => {
    expect(parseKette('', 'bericht')).toEqual([]);
  });
});

describe('urteil', () => {
  it('ROT bei Exit 1 eines Gesetzestext-Glieds', () => {
    const r = urteil([v('check:zitate', 'gesetzestext', 1), v('check:verfall', 'bericht', 0)]);
    expect(r.rot.map((x) => x.tor)).toEqual(['check:zitate']);
  });
  it('KEIN Rot bei Exit 1 eines Bericht-Glieds — nur Warnung', () => {
    const r = urteil([v('check:caches', 'gesetzestext', 0), v('check:materialien-netz', 'bericht', 1)]);
    expect(r.rot).toEqual([]);
    expect(r.warnungen.map((x) => x.tor)).toEqual(['check:materialien-netz']);
  });
  it('KEIN Rot bei Exit 2 (Quelle nicht erreichbar) eines Gesetzestext-Glieds', () => {
    const r = urteil([v('check:caches', 'gesetzestext', 2)]);
    expect(r.rot).toEqual([]);
    expect(status(r.warnungen[0])).toBe('NETZ');
  });
  it('ein unerwarteter Exit (z. B. 127, Skript fehlt) eines Gesetzestext-Glieds ist ROT', () => {
    expect(urteil([v('check:nope', 'gesetzestext', 127)]).rot).toHaveLength(1);
  });
});
