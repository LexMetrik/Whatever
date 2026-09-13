import { describe, it, expect, beforeEach } from 'vitest';
import {
  ladeMappen, speichereMappe, loescheMappe, mappeMitNamen,
  kodiereMappe, dekodiereMappe, mappeAusSuche, ohneMappe, MAPPE_PARAM,
  MAPPEN_MAX,
} from '../lib/mappen';
import { ladeTabs, merkeTab, hefteAn, uebernehmeMappe, letzterGeschlossener } from '../lib/tabs';

// ═══ W2·25 TEIL 2 · DIE ARBEITSMAPPE (Spec §7, §5a Ziff. 9) ═════════════════
//
// «Offene Reiter als benannte Mappe lokal speichern und öffnen, als Adresse
// teilbar — deterministisch (§2), ohne Konto, ohne Server.»
//
// ZWEI SPEICHER, EINE WAHRHEIT: eine Mappe ist eine Liste von TabEinträgen,
// nichts anderes — dieselben Felder wie `lexmetrik-tabs` (Pfad inkl.
// `#art-…`-Anker = Lesestellung, plus `fest`). Es gibt keine zweite
// Reiter-Darstellung und keinen zweiten Identitätsbegriff (§5).
//
// ROT-PROBE (§6.7, gefahren 13.9.2026 gegen `22968fa0f`): `src/lib/mappen.ts`
// gab es nicht, `lib/tabs.uebernehmeMappe` auch nicht — die Datei scheiterte
// am Import. Der gemessene Wortlaut steht in der Commit-Message.
// WIEDER ROT ZU BEKOMMEN: in `kodiereMappe` das `encodeURIComponent` durch
// den rohen Pfad ersetzen (dann zerreisst ein `?e=1&k=ZH`-Rechner die Adresse)
// bzw. in `uebernehmeMappe` den `fest`-Erhalt streichen.

beforeEach(() => {
  const speicher = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (k: string) => speicher.get(k) ?? null,
    setItem: (k: string, v: string) => void speicher.set(k, v),
    removeItem: (k: string) => void speicher.delete(k),
    clear: () => speicher.clear(),
    key: () => null,
    length: 0,
  } as unknown as Storage;
});

const OR = '/gesetze/bund/OR#art-336_c';
const ZGB = '/gesetze/bund/ZGB#art-1';
const RECHNER = '/rechner/zustaendigkeit?e=5000&k=ZH';

describe('Mappen — Speichern, Öffnen, Löschen (localStorage, deterministisch)', () => {
  it('eine gespeicherte Mappe kommt mit Reihenfolge, Lesestellung und Anheftung zurück', () => {
    speichereMappe('Mietrecht', [
      { path: OR, fest: true }, { path: ZGB }, { path: RECHNER },
    ]);
    const m = mappeMitNamen('Mietrecht');
    expect(m?.reiter.map((t) => t.path)).toEqual([OR, ZGB, RECHNER]);
    expect(m?.reiter[0].fest).toBe(true);
    expect(m?.reiter[1].fest).toBeUndefined();
  });

  it('derselbe Name überschreibt, statt eine zweite Mappe anzulegen', () => {
    speichereMappe('Fall A', [{ path: OR }]);
    speichereMappe('Fall A', [{ path: ZGB }, { path: RECHNER }]);
    expect(ladeMappen().length).toBe(1);
    expect(mappeMitNamen('Fall A')?.reiter.length).toBe(2);
  });

  it('die Liste steht alphabetisch — deterministisch, ohne Zeitstempel (§2)', () => {
    speichereMappe('Zürich', [{ path: OR }]);
    speichereMappe('Arbeitsrecht', [{ path: ZGB }]);
    speichereMappe('Mietrecht', [{ path: RECHNER }]);
    expect(ladeMappen().map((m) => m.name)).toEqual(['Arbeitsrecht', 'Mietrecht', 'Zürich']);
  });

  it('Löschen entfernt genau eine Mappe; ein unbekannter Name tut nichts', () => {
    speichereMappe('A', [{ path: OR }]);
    speichereMappe('B', [{ path: ZGB }]);
    loescheMappe('A');
    expect(ladeMappen().map((m) => m.name)).toEqual(['B']);
    loescheMappe('gibt es nicht');
    expect(ladeMappen().map((m) => m.name)).toEqual(['B']);
  });

  it('eine Mappe ohne Namen oder ohne Reiter wird nicht angelegt', () => {
    speichereMappe('   ', [{ path: OR }]);
    speichereMappe('leer', []);
    expect(ladeMappen()).toEqual([]);
  });

  it(`mehr als ${MAPPEN_MAX} Mappen: die älteste weicht, die neue steht drin`, () => {
    for (let i = 0; i < MAPPEN_MAX + 3; i++) speichereMappe(`M${i}`, [{ path: `/rechner/r${i}` }]);
    expect(ladeMappen().length).toBe(MAPPEN_MAX);
    expect(mappeMitNamen(`M${MAPPEN_MAX + 2}`)).not.toBeNull();
  });

  it('korrupter Speicher ergibt eine leere Liste, keinen Absturz', () => {
    localStorage.setItem('lexmetrik-mappen', '{kein json');
    expect(ladeMappen()).toEqual([]);
    localStorage.setItem('lexmetrik-mappen', JSON.stringify([{ name: 'x' }, 42, { reiter: [] }]));
    expect(ladeMappen()).toEqual([]);
  });
});

describe('Mappen — die Adresse trägt die Reiterfolge', () => {
  it('Hin und zurück: Pfad, Anker und Anheftung überstehen die Kodierung', () => {
    const reiter = [{ path: OR, fest: true }, { path: ZGB }, { path: RECHNER }];
    const kodiert = kodiereMappe(reiter);
    expect(dekodiereMappe(kodiert)).toEqual(reiter);
  });

  it('der Anker ist kodiert, der Schrägstrich bleibt lesbar — eine kompakte Adresse', () => {
    expect(kodiereMappe([{ path: OR, fest: true }, { path: '/rechner/tagerechner' }]))
      .toBe('*/gesetze/bund/OR%23art-336_c,/rechner/tagerechner');
  });

  it('ein Rechner mit `&` in der Adresse zerreisst die Mappe NICHT', () => {
    const kodiert = kodiereMappe([{ path: RECHNER }, { path: ZGB }]);
    expect(kodiert, 'das & ist kodiert, sonst bräche es die Query auf').not.toContain('&');
    expect(kodiert, 'und das Komma des Rechners wäre ein falscher Trenner').toBe(
      '/rechner/zustaendigkeit%3Fe%3D5000%26k%3DZH,/gesetze/bund/ZGB%23art-1');
    expect(dekodiereMappe(kodiert).map((t) => t.path)).toEqual([RECHNER, ZGB]);
  });

  it('aus der Suchzeile gelesen wird der ROHE Wert, nicht der doppelt dekodierte', () => {
    const suche = `?${MAPPE_PARAM}=${kodiereMappe([{ path: RECHNER }])}&p=/gesetze/bund/OR`;
    expect(mappeAusSuche(suche)?.map((t) => t.path)).toEqual([RECHNER]);
  });

  it('keine oder defekte Angabe ergibt null — nie eine halbe Mappe', () => {
    expect(mappeAusSuche('?p=/gesetze/bund/OR')).toBeNull();
    expect(mappeAusSuche(`?${MAPPE_PARAM}=`)).toBeNull();
    expect(mappeAusSuche(`?${MAPPE_PARAM}=nicht-absolut`)).toBeNull();
  });

  it('`ohneMappe` nimmt genau diesen Parameter aus der Suchzeile, sonst nichts', () => {
    expect(ohneMappe(`?p=/x&${MAPPE_PARAM}=/gesetze/bund/OR&r=2`)).toBe('?p=/x&r=2');
    expect(ohneMappe(`?${MAPPE_PARAM}=/gesetze/bund/OR`)).toBe('');
    expect(ohneMappe('?r=2')).toBe('?r=2');
  });
});

describe('Mappen — Öffnen ersetzt die offenen Reiter, feste bleiben', () => {
  it('die Mappe steht danach als Reiterfolge da; die alten liegen im Ring', () => {
    merkeTab('/vorlagen/nda');
    merkeTab('/rechner/tagerechner');
    uebernehmeMappe([{ path: OR }, { path: ZGB }]);
    expect(ladeTabs().map((t) => t.path)).toEqual([OR, ZGB]);
    expect(letzterGeschlossener()?.path, 'die Rückfahrkarte trägt die verdrängten Reiter')
      .toBe('/vorlagen/nda');
  });

  it('ein ANGEHEFTETER Reiter bleibt stehen und behält seinen Platz vorn', () => {
    merkeTab('/gesetze/bund/ZPO');
    hefteAn('/gesetze/bund/ZPO');
    merkeTab('/vorlagen/nda');
    uebernehmeMappe([{ path: OR }, { path: ZGB }]);
    expect(ladeTabs().map((t) => t.path)).toEqual(['/gesetze/bund/ZPO', OR, ZGB]);
    expect(ladeTabs()[0].fest).toBe(true);
  });

  it('eine Mappe mit eigener Anheftung bringt sie mit — und bleibt zonentreu', () => {
    merkeTab('/vorlagen/nda');
    uebernehmeMappe([{ path: ZGB }, { path: OR, fest: true }]);
    const t = ladeTabs();
    expect(t.map((x) => x.path)).toEqual([OR, ZGB]);
    expect(t[0].fest).toBe(true);
  });

  it('ist ein Mappen-Reiter schon angeheftet offen, wird er nicht verdoppelt', () => {
    merkeTab(OR);
    hefteAn(OR);
    uebernehmeMappe([{ path: OR }, { path: ZGB }]);
    expect(ladeTabs().map((x) => x.path)).toEqual([OR, ZGB]);
    expect(ladeTabs()[0].fest, 'die Anheftung des offenen Reiters gewinnt').toBe(true);
  });

  it('eine leere Mappe schliesst nichts — sie wird gar nicht erst übernommen', () => {
    merkeTab('/vorlagen/nda');
    uebernehmeMappe([]);
    expect(ladeTabs().map((x) => x.path)).toEqual(['/vorlagen/nda']);
  });
});
