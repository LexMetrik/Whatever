// W2·27-BUND-FERTIG, Nebenfund P4 (3.10.2026): Darstellung und Zitat der marke-losen Haupttext-Zeile (`marke: ''`).
// Daten-Seite: normtext-haupttext-leitzeile.test.ts. Hier: der echte Renderer (renderToString) über den gebauten
// Korpus (public/normtext/bund) — die Zeile steht an ihrer Stelle, trägt KEINEN Zitierknopf und keine erfundene
// Marke, und sie verändert kein Zitat der markierten Geschwister (§1: ein verkürztes Zitat ist ein falsches).
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { ArtikelBody } from '../components/normtext/ArtikelBody';
import { itemZitatSegmente, markenAnzeige, stufenFuer } from '../components/normtext/ArtikelBody.helfer';
import type { NormSnapshot } from '../lib/normtext/typen';

type Eintrag = { id: string; artikel: string; artikelLabel: string; bloecke: NormSnapshot['bloecke'] };
const laden = (k: string): Eintrag[] =>
  JSON.parse(readFileSync(`public/normtext/bund/${k}.json`, 'utf8')).eintraege as Eintrag[];
const eintrag = (k: string, id: string): Eintrag => laden(k).find((e) => e.id === id)!;
const rendern = (e: Eintrag, kuerzel: string, zitierbar = true) =>
  renderToString(
    <ArtikelBody
      bloecke={e.bloecke}
      artikel={e.artikel}
      passus={{ absatz: null }}
      zitierKontext={zitierbar ? { artikelLabel: e.artikelLabel, kuerzel } : undefined}
    />,
  );
const zitate = (html: string): string[] =>
  [...html.matchAll(/aria-label="([^"]+) — kopieren"/g)].map((m) => m[1].replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&'));
const sichtbar = (html: string): string =>
  html.replace(/<[^>]+>/g, ' ').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ');

describe('Korpus: genau die 18 verlorenen Zeilen stehen jetzt als marke-lose Haupttext-Items', () => {
  it('18 Items mit marke "" in genau 7 Artikeln, keines im Anhang, jedes mit Text', () => {
    const treffer: string[] = [];
    let anhang = 0;
    for (const f of readdirSync('public/normtext/bund').sort()) {
      const d = JSON.parse(readFileSync(`public/normtext/bund/${f}`, 'utf8')) as { eintraege: Eintrag[] };
      for (const e of d.eintraege) {
        for (const b of e.bloecke) {
          for (const it of b.items ?? []) {
            if (it.marke !== '') continue;
            if (/\/annex_/.test(e.id)) anhang++;
            expect(it.text.trim()).not.toBe('');
            treffer.push(e.id);
          }
        }
      }
    }
    expect(treffer).toHaveLength(18);
    expect(anhang).toBe(0);
    expect([...new Set(treffer)].sort()).toEqual([
      'bund/ARGV1/art_30',
      'bund/EBG/art_6',
      'bund/ERV/art_51',
      'bund/ERV/art_52',
      'bund/MSTP/art_119',
      'bund/PATV/art_97',
      'bund/VBB/art_10',
    ]);
  });
});

describe('Renderer: Text an seiner Stelle, kein Zitierknopf, keine erfundene Marke', () => {
  const fall: Array<[string, string, string, string[]]> = [
    ['ARGV1', 'bund/ARGV1/art_30', 'ARGV1', ['1. in fünf von sieben aufeinander folgenden Nächten; oder', '2. in sechs von neun aufeinander folgenden Nächten; und']],
    ['VBB', 'bund/VBB/art_10', 'VBB', ['DB = Durchführung mit voller Befriedigung.', 'K = Konkurs.']],
    ['EBG', 'bund/EBG/art_6', 'EBG', ['die Änderung der Konzession, mit Ausnahme der Ausdehnung;', 'die Erneuerung der Konzession.']],
    ['MSTP', 'bund/MSTP/art_119', 'MSTP', ['1. eine Freiheitsstrafe von höchstens 30 Tagen,', '5. eine Verbindung der Strafen nach den Ziffern 1–4; und']],
  ];
  for (const [k, id, kuerzel, saetze] of fall) {
    it(`${id}: Zeilen sichtbar (Lese- und Popover-Sicht), kein loses «.»-Marker-Element`, () => {
      for (const zitierbar of [true, false]) {
        const html = rendern(eintrag(k, id), kuerzel, zitierbar);
        const text = sichtbar(html);
        for (const s of saetze) expect(text).toContain(s);
        // Eine marke-lose Zeile darf keine Marke «.» bekommen (markenAnzeige('') war vorher «.»).
        expect(html).not.toMatch(/>\.<\/span>/);
      }
    });
  }

  it('ARGV1 art_30 Abs. 3: Zitate der markierten Punkte unverändert («Abs. 3 lit. a» / «lit. b»), keines für die Zeilen', () => {
    const z = zitate(rendern(eintrag('ARGV1', 'bund/ARGV1/art_30'), 'ARGV1'));
    expect(z).toContain('Art. 30 Abs. 3 lit. a ARGV1');
    expect(z).toContain('Art. 30 Abs. 3 lit. b ARGV1');
    expect(z.filter((x) => /fünf|sechs|lit\.\s+ARGV1|lit\.\s*$/.test(x))).toEqual([]);
  });

  it('VBB art_10: die sechs Legenden-Zeilen tragen keinen Zitierknopf', () => {
    const e = eintrag('VBB', 'bund/VBB/art_10');
    const n = e.bloecke.flatMap((b) => b.items ?? []).filter((i) => i.marke === '').length;
    expect(n).toBe(6);
    const mit = zitate(rendern(e, 'VBB')).length;
    const ohne = zitate(
      rendern({ ...e, bloecke: e.bloecke.map((b) => (b.items ? { ...b, items: b.items.filter((i) => i.marke !== '') } : b)) }, 'VBB'),
    ).length;
    expect(mit).toBe(ohne);
  });
});

describe('Zitat-Bilanz: die marke-lose Zeile verändert kein Zitat eines markierten Punkts', () => {
  it('je Block mit marke-losen Items: Segmente der markierten Items = Segmente der Liste OHNE die Zeilen', () => {
    let geprueft = 0;
    for (const [k, id] of [
      ['ARGV1', 'bund/ARGV1/art_30'], ['ERV', 'bund/ERV/art_51'], ['ERV', 'bund/ERV/art_52'], ['MSTP', 'bund/MSTP/art_119'],
      ['EBG', 'bund/EBG/art_6'], ['PATV', 'bund/PATV/art_97'], ['VBB', 'bund/VBB/art_10'],
    ] as const) {
      for (const b of eintrag(k, id).bloecke) {
        const items = b.items ?? [];
        if (!items.some((i) => i.marke === '')) continue;
        const alt = items.filter((i) => i.marke !== ''); // so stand die Liste vor dem Fix im Snapshot
        const stufenNeu = stufenFuer(items);
        const stufenAlt = stufenFuer(alt);
        let a = 0;
        items.forEach((it, j) => {
          if (it.marke === '') return;
          expect(itemZitatSegmente(items, stufenNeu, j)).toEqual(itemZitatSegmente(alt, stufenAlt, a));
          a++;
          geprueft++;
        });
      }
    }
    expect(geprueft).toBeGreaterThan(0);
  });
});

describe('Helfer: marke-lose Zeile (`marke: \'\'`)', () => {
  it('markenAnzeige liefert nichts statt eines erfundenen «.»', () => {
    expect(markenAnzeige('')).toBe('');
    expect(markenAnzeige('a')).toBe('a.'); // unverändert
  });
  it('stufenFuer (ohne tiefe): eine führende Leerzeile kippt die folgenden Ziffern nicht auf Stufe 1', () => {
    expect(stufenFuer([{ marke: '' }, { marke: '1' }, { marke: '2' }] as Array<{ marke: string }>)).toEqual([0, 0, 0]);
    expect(stufenFuer([{ marke: '' }, { marke: 'a' }, { marke: '1' }] as Array<{ marke: string }>)).toEqual([0, 0, 1]);
  });
  it('Zitatkette: eine marke-lose Zeile ist nie Glied («Ziff. 1», nicht «lit. »)', () => {
    const items = [
      { marke: 'a', text: 'x', tiefe: 0 },
      { marke: '', text: '1. Zeile', tiefe: 1 },
      { marke: '1', text: 'y', tiefe: 1 },
    ];
    expect(itemZitatSegmente(items, stufenFuer(items), 2)).toEqual(['lit. a', 'Ziff. 1']);
    // Eltern-Ebene ist selbst marke-los: kein «lit. »-Segment aus der leeren Marke
    const unterLeer = [
      { marke: '', text: 'Leitzeile', tiefe: 0 },
      { marke: '1', text: 'y', tiefe: 1 },
    ];
    expect(itemZitatSegmente(unterLeer, stufenFuer(unterLeer), 1)).toEqual(['Ziff. 1']);
  });
});
