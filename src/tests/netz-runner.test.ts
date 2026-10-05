// Rückbau MONITOR 5.10.2026 (Entscheid David: «wichtig ist gesetzestext. der rest muss nicht
// zu einem rot führen.») — Klassen-Urteil des Runners scripts/run-netz-alle.ts, ohne Netz.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseKette, urteil, status, ausgabeZeilen, type Verdikt } from '../../scripts/run-netz-alle';

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

// Gegenprüfung 5.10.2026, Befund 1: Exit 2 hatte keine Obergrenze — ein dauerhaft blindes
// Gesetzestext-Glied (z. B. leere SPARQL-Antwort in check:pdf-netz) blieb ewig grün, und
// «Bei Grün» schloss sogar den Alarm-Zettel. Jetzt: unvollständig sichtbar, zweiter Lauf rot.
describe('Netz-Grenze (Exit 2 eines Gesetzestext-Glieds)', () => {
  it('erster Lauf: kein Rot, aber unvollständig ⇒ netz_unvollstaendig=1 (Zettel-Schliessung unterdrückt)', () => {
    const u = urteil([v('check:caches', 'gesetzestext', 0), v('check:pdf-netz', 'gesetzestext', 2)]);
    expect(u.rot).toEqual([]);
    expect(u.netzRot).toBe(false);
    expect(u.blind.map((x) => x.tor)).toEqual(['check:pdf-netz']);
    expect(ausgabeZeilen(u)).toBe('netz_unvollstaendig=1\nrot_grund=\n');
  });
  it('Netz-Zettel schon offen + erneut Exit 2 ⇒ ROT (rot_grund=netz)', () => {
    const u = urteil([v('check:pdf-netz', 'gesetzestext', 2)], true);
    expect(u.netzRot).toBe(true);
    expect(ausgabeZeilen(u)).toBe('netz_unvollstaendig=1\nrot_grund=netz\n');
  });
  it('Netz-Zettel offen, aber Lauf vollständig ⇒ grün und netz_unvollstaendig=0 (Zettel wird geschlossen)', () => {
    const u = urteil([v('check:pdf-netz', 'gesetzestext', 0)], true);
    expect(u.netzRot).toBe(false);
    expect(ausgabeZeilen(u)).toBe('netz_unvollstaendig=0\nrot_grund=\n');
  });
  it('Exit 2 eines BERICHT-Glieds macht den Lauf nicht unvollständig und nie rot', () => {
    const u = urteil([v('check:materialien-netz', 'bericht', 2)], true);
    expect(u.blind).toEqual([]);
    expect(u.netzRot).toBe(false);
  });
  it('echter Gesetzestext-Befund hat Vorrang vor dem Netz-Grund', () => {
    const u = urteil([v('check:zitate', 'gesetzestext', 1), v('check:pdf-netz', 'gesetzestext', 2)], true);
    expect(ausgabeZeilen(u)).toBe('netz_unvollstaendig=1\nrot_grund=gesetzestext\n');
  });
});

// Entscheid David 5.10.2026 (später am Tag): «reduziere sonst einfach nur noch auf bund.» —
// die Kantons-Drift (check:normtext-netz: LexWork, HTM, ZH, kantonale PDFs, ~1300 Erlasse) ist
// Bericht, nicht Kette. Geprüft gegen die ECHTEN Ketten aus package.json (nicht gegen eine
// Test-Attrappe): umgehängt, nicht gelöscht, und Bund bleibt rot-fähig.
describe('Kette nur Bund (package.json)', () => {
  const scripts = (JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> }).scripts;
  const glieder = [
    ...parseKette(scripts['check:netz:kette'], 'gesetzestext'),
    ...parseKette(scripts['check:netz:bericht'], 'bericht'),
  ];
  const mit = (tor: string, exit: number): Verdikt[] =>
    glieder.map((g) => ({ ...g, exit: g.tor === tor ? exit : 0, sekunden: 1, versuche: 1 }));

  it('Kanton-Drift ist Bericht-Glied — erkannt, nicht gelöscht', () => {
    const k = glieder.filter((g) => g.tor === 'check:normtext-netz');
    expect(k.map((g) => g.klasse)).toEqual(['bericht']);
  });
  it('Kette trägt genau die Bundes-Glieder', () => {
    expect(glieder.filter((g) => g.klasse === 'gesetzestext').map((g) => g.tor))
      .toEqual(['check:caches', 'check:zitate', 'check:fedlex-versionen', 'check:pdf-netz']);
  });
  it('Kantons-Glied Exit 1 ⇒ kein Rot, Bericht-Warnung', () => {
    const u = urteil(mit('check:normtext-netz', 1));
    expect(u.rot).toEqual([]);
    expect(u.warnungen.map((x) => x.tor)).toEqual(['check:normtext-netz']);
    expect(ausgabeZeilen(u)).toBe('netz_unvollstaendig=0\nrot_grund=\n');
  });
  it('Kantons-Glied Exit 2 ⇒ kein netz_unvollstaendig, auch bei offenem Netz-Zettel kein Rot', () => {
    const u = urteil(mit('check:normtext-netz', 2), true);
    expect(u.blind).toEqual([]);
    expect(u.netzRot).toBe(false);
    expect(ausgabeZeilen(u)).toBe('netz_unvollstaendig=0\nrot_grund=\n');
  });
  it('Bundes-Glied Exit 1 ⇒ ROT', () => {
    const u = urteil(mit('check:fedlex-versionen', 1));
    expect(u.rot.map((x) => x.tor)).toEqual(['check:fedlex-versionen']);
    expect(ausgabeZeilen(u)).toBe('netz_unvollstaendig=0\nrot_grund=gesetzestext\n');
  });
});
