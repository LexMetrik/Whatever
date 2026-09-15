// scripts/analyse/tor-bewaehrung.test.ts — Spec des Bewährungs-Registers.
//
// Geprüft wird nur der RECHENWEG (Einstufung, Verschmelzung, Abbildung,
// Paritäts-Befund). Die Beschaffung (gh, git, Dateisystem) steht bewusst
// ausserhalb: sie ist im Test nicht prüfbar, und dieselbe Trennung gilt seit
// dem Selbstopt-Sammler (scripts/plan/selbstoptKern.ts) im ganzen Repo.
import { describe, expect, it } from 'vitest';
import {
  SCHWELLE_TAGE,
  LAEUFE_SCHWELLE,
  fangTreffer,
  letztesRotAus,
  mischeBelege,
  paritaetsBefunde,
  parseLokalesLog,
  schrittAbbildung,
  stufeEin,
  tageZwischen,
  type Beleg,
  type Eintrag,
  type Register,
} from './tor-bewaehrung.ts';

const STICHTAG = '2026-09-15';
const eintrag = (teil: Partial<Eintrag> & { name: string }): Eintrag => ({
  art: 'tor',
  seit: null,
  letztesRot: null,
  laeufe: null,
  belege: [],
  ...teil,
});
const beleg = (datum: string, hinweis = 'x'): Beleg => ({ datum, quelle: 'ci-run-URL', hinweis });

describe('tageZwischen', () => {
  it('rechnet über Monatsgrenzen und Sommerzeit hinweg in ganzen Tagen', () => {
    expect(tageZwischen('2026-06-07', '2026-09-15')).toBe(100);
    expect(tageZwischen('2026-09-15', '2026-09-15')).toBe(0);
    // Sommer→Winter: ohne UTC-Verankerung käme hier 89 oder 91 heraus.
    expect(tageZwischen('2026-09-30', '2026-12-29')).toBe(90);
  });
});

describe('stufeEin', () => {
  it('nennt ein Tor mit Rot innerhalb der Schwelle bewährt — auch exakt auf der Schwelle', () => {
    const genauAufSchwelle = eintrag({ name: 'check:a', seit: '2026-01-01', belege: [beleg('2026-06-17')] });
    expect(tageZwischen('2026-06-17', STICHTAG)).toBe(SCHWELLE_TAGE);
    expect(stufeEin(genauAufSchwelle, STICHTAG).klasse).toBe('bewährt');
  });

  it('macht aus einem Rot jenseits der Schwelle einen Rückbau-Kandidaten', () => {
    const e = eintrag({ name: 'check:a', seit: '2026-01-01', belege: [beleg('2026-06-16')] });
    expect(stufeEin(e, STICHTAG)).toMatchObject({ klasse: 'RÜCKBAU-KANDIDAT', tageSeitRot: 91 });
  });

  it('nennt ein junges Tor ohne Rot «jung» — egal wie oft es lief', () => {
    expect(stufeEin(eintrag({ name: 'check:neu', seit: '2026-09-14', laeufe: 500 }), STICHTAG).klasse).toBe('jung');
  });

  it('macht aus «alt, nie rot, oft gelaufen» einen Rückbau-Kandidaten', () => {
    const e = eintrag({ name: 'check:alt', seit: '2026-06-07', laeufe: LAEUFE_SCHWELLE });
    expect(stufeEin(e, STICHTAG).klasse).toBe('RÜCKBAU-KANDIDAT');
  });

  it('macht aus «alt, nie rot, kaum gelaufen» KEINEN Rückbau-Kandidaten, sondern «ungemessen»', () => {
    // Der Kern der Abweichung vom Auftrag: eine Messlücke ist kein Befund.
    for (const laeufe of [null, 0, LAEUFE_SCHWELLE - 1]) {
      const e = eintrag({ name: 'check:alt', seit: '2026-06-07', laeufe });
      expect(stufeEin(e, STICHTAG).klasse, String(laeufe)).toBe('ungemessen (kein Lauf belegt)');
    }
  });

  it('zählt ein Tor ohne Einführungsdatum NICHT als jung — unbekannt ist kein Freibrief', () => {
    expect(stufeEin(eintrag({ name: 'check:x', seit: null, laeufe: 100 }), STICHTAG).klasse).toBe('RÜCKBAU-KANDIDAT');
  });

  it('hält Hooks in jeder Lage bei «unbelegt (Hook ohne Log)» — auch mit Fang-Vermerk', () => {
    const ohne = eintrag({ name: 'tor-schutz.py', art: 'hook', seit: '2026-06-10' });
    const mit = eintrag({ name: 'gate-stopp.py', art: 'hook', seit: '2026-06-11', belege: [beleg('2026-09-14')] });
    expect(stufeEin(ohne, STICHTAG).klasse).toBe('unbelegt (Hook ohne Log)');
    // Der Beleg geht nicht verloren, er wird nur nicht zur Bewährung erklärt.
    expect(stufeEin(mit, STICHTAG)).toMatchObject({ klasse: 'unbelegt (Hook ohne Log)', letztesRot: '2026-09-14' });
  });
});

describe('letztesRotAus', () => {
  it('nimmt den jüngsten Beleg', () => {
    const e = eintrag({ name: 'check:a', belege: [beleg('2026-07-01'), beleg('2026-09-02'), beleg('2026-08-30')] });
    expect(letztesRotAus(e)).toBe('2026-09-02');
  });

  it('löscht ein von Hand gesetztes Datum NIE, auch wenn kein Beleg es stützt', () => {
    const e = eintrag({ name: 'check:a', letztesRot: '2026-05-05', belege: [] });
    expect(letztesRotAus(e)).toBe('2026-05-05');
  });

  it('schiebt das Datum nur nach vorne, nie zurück', () => {
    const e = eintrag({ name: 'check:a', letztesRot: '2026-09-09', belege: [beleg('2026-07-01')] });
    expect(letztesRotAus(e)).toBe('2026-09-09');
  });
});

describe('mischeBelege', () => {
  it('ist idempotent: derselbe Import zweimal erzeugt keinen zweiten Beleg', () => {
    const neu = [beleg('2026-09-01', 'Lauf 1'), beleg('2026-09-02', 'Lauf 2')];
    const einmal = mischeBelege([], neu);
    expect(mischeBelege(einmal, neu)).toEqual(einmal);
    expect(einmal).toHaveLength(2);
  });

  it('unterscheidet Belege am Hinweis, nicht nur am Datum', () => {
    const gemischt = mischeBelege([beleg('2026-09-01', 'Lauf 1')], [beleg('2026-09-01', 'Lauf 2')]);
    expect(gemischt).toHaveLength(2);
  });
});

describe('schrittAbbildung', () => {
  const yml = [
    'jobs:',
    '  tore:',
    '    steps:',
    '      - name: Plan-Inventar-Konsistenz',
    '        run: npm run check:plan',
    '      - name: Normtext-Struktur (Tabellen · Grundart)',
    '        run: npm run check:tabellen && npm run check:grundart',
    '      - name: Build',
    '        run: npm run build',
    '      - name: Nur im Kommentar',
    '        # run: npm run check:zitate',
    '        run: echo nichts',
  ].join('\n');

  it('bildet einen Step auf alle Tore seiner run-Zeile ab', () => {
    const a = schrittAbbildung(yml);
    expect(a.get('Plan-Inventar-Konsistenz')).toEqual(['check:plan']);
    expect(a.get('Normtext-Struktur (Tabellen · Grundart)')).toEqual(['check:tabellen', 'check:grundart']);
  });

  it('lässt Steps ohne Tor leer und zählt Kommentarzeilen nicht als Lauf', () => {
    const a = schrittAbbildung(yml);
    expect(a.get('Build')).toEqual([]);
    expect(a.get('Nur im Kommentar')).toEqual([]);
  });
});

describe('fangTreffer', () => {
  const hooks = ['tor-schutz.py', 'gate-stopp.py'];

  it('nimmt ein Tor im Umkreis des Fang-Worts', () => {
    expect(fangTreffer('Fehler behoben — gefangen von `check:zaehler`, danke.', hooks)).toEqual(['check:zaehler']);
    expect(fangTreffer('Das Tor check:plan hat es gefangen.', hooks)).toEqual(['check:plan']);
    expect(fangTreffer('gefangen von tor-schutz.py vor dem Push', hooks)).toEqual(['tor-schutz.py']);
  });

  it('wertet eine blosse Erwähnung ohne Fang-Wort NICHT als Fang', () => {
    expect(fangTreffer('Tor check:materialien wieder grün (Register nachgeführt).', hooks)).toEqual([]);
  });

  it('wertet «abgefangen» nicht als Tor-Fang', () => {
    expect(fangTreffer('apt-Stall im Runner mit timeout+Retry abgefangen; check:plan unverändert.', hooks)).toEqual([]);
  });

  it('nimmt kein Tor auf, das weit weg vom Fang-Wort steht', () => {
    const weit = `gefangen von nichts.${' '.repeat(400)}check:sweep steht hier ohne Bezug.`;
    expect(fangTreffer(weit, hooks)).toEqual([]);
  });

  it('matcht Hook-Namen an der Wortgrenze, nicht als Substring', () => {
    expect(fangTreffer('gefangen von xtor-schutz.python', hooks)).toEqual([]);
  });
});

describe('parseLokalesLog', () => {
  const bekannt = new Set(['check:plan', 'check:zh-vollstaendigkeit']);

  it('nimmt nur rote Läufe bekannter Tore und schreibt gate: auf check: um', () => {
    const inhalt = [
      '{"ts":"2026-09-01T10:00:00.000Z","tor":"check:plan","ok":false}',
      '{"ts":"2026-09-02T10:00:00.000Z","tor":"check:plan","ok":true}',
      '{"ts":"2026-09-03T10:00:00.000Z","tor":"gate:zh-vollstaendigkeit","ok":false}',
      '{"ts":"2026-09-04T10:00:00.000Z","tor":"gate:vitest","ok":false}',
      '{"ts":"2026-09-05T10:00:00.000Z","tor":"check:inventur","ok":false}',
    ].join('\n');
    const { rot, laeufe, verworfen } = parseLokalesLog(inhalt, bekannt);
    expect(rot.map((r) => r.tor)).toEqual(['check:plan', 'check:zh-vollstaendigkeit']);
    expect(verworfen).toBe(0);
    // Läufe zählen GRÜN mit — sonst könnte man «lief oft, nie rot» nie von
    // «lief nie» unterscheiden.
    expect(laeufe.get('check:plan')).toBe(2);
    expect(laeufe.get('check:zh-vollstaendigkeit')).toBe(1);
    expect(laeufe.has('check:inventur')).toBe(false);
  });

  it('zählt unlesbare Zeilen, statt sie stillschweigend zu schlucken', () => {
    const { rot, verworfen } = parseLokalesLog('kaputt\n{"ts":"x"}\n', bekannt);
    expect(rot).toEqual([]);
    expect(verworfen).toBe(2);
  });
});

describe('paritaetsBefunde', () => {
  const reg = (namen: Array<[string, 'tor' | 'hook']>): Register => ({
    _generiert: 'test',
    schema: 1,
    ciFenster: null,
    eintraege: namen.map(([name, art]) => eintrag({ name, art })),
  });

  it('schweigt, wenn Register und Wirklichkeit deckungsgleich sind', () => {
    const r = reg([['check:a', 'tor'], ['h.py', 'hook']]);
    expect(paritaetsBefunde(r, ['check:a'], ['h.py'])).toEqual([]);
  });

  it('meldet ein Tor im Register, das package.json nicht mehr kennt', () => {
    const befunde = paritaetsBefunde(reg([['check:weg', 'tor']]), [], []);
    expect(befunde).toHaveLength(1);
    expect(befunde[0]).toContain('check:weg');
  });

  it('meldet einen Hook im Register, den es nicht mehr gibt', () => {
    const befunde = paritaetsBefunde(reg([['weg.py', 'hook']]), [], []);
    expect(befunde[0]).toContain('weg.py');
  });

  it('meldet ein Tor bzw. einen Hook, der im Register fehlt', () => {
    expect(paritaetsBefunde(reg([]), ['check:neu'], ['neu.py'])).toHaveLength(2);
  });

  it('meldet eine falsche Art — ein Hook, der als Tor geführt wird', () => {
    const befunde = paritaetsBefunde(reg([['h.py', 'tor']]), [], ['h.py']);
    expect(befunde.length).toBeGreaterThan(0);
  });
});
