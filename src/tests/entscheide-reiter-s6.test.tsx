// S6-W1b (W2·29-WERKBANK-LESER) · Reiter «Entscheide» des Erlass-Blatts.
//
// Belegt die Zusagen aus dem Audit vom 23.9.2026 und Davids Entscheid vom
// selben Tag («zuerst bge aber nur die 5 neusten und dann kantonal jeweils 5
// und dann der rest»):
//   · Ordnung: BGE · je kantonales Gericht · Rest (bger, eidg) — nie gemischt.
//   · Portion: je Gruppe 5 beim Öffnen, «weitere N» in Schritten zu 50 (D-4).
//   · Zahlen am Schalter = Artikel, Summe = ungefilterte Kanten (D-9).
//   · Fehler-Lage ≠ Bestands-Lage (E-3/D-3/B-8).
//   · Datum nicht doppelt (E-8), Regeste-Teil benannt (B-2/E-6, Darstellung).
//   · Abdeckungs-Zeile mit Link /abdeckung (E-5).
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import type { Bezug } from '../lib/rechtsprechung/bezuege';
import type { BezugStatus } from '../lib/verzahnung/facetten';
import {
  ERSTE_PORTION, NACHLADE_SCHRITT, datumInZitierung, gerichtAusZitierung, klassenZahlenAmArtikel,
  naechsteMenge, ordneEntscheide, regesteTeil, weitereText,
} from '../pages/gesetz-leser/v3/entscheideOrdnung';
import { PanelEntscheide } from '../pages/gesetz-leser/v3/PanelEntscheide';

function kante(key: string, status: BezugStatus, opt: {
  datum?: string; gericht?: string; kanton?: string; zitierung?: string; regeste?: string | null;
} = {}): Bezug {
  const kanton = opt.kanton ?? (status === 'kantonal' ? 'BS' : 'CH');
  return {
    key,
    zitierung: opt.zitierung ?? key,
    regesteKurz: opt.regeste ?? null,
    datum: opt.datum ?? '2024-01-15',
    gewicht: null,
    facetten: {
      status, ebene: status === 'kantonal' ? 'kanton' : 'bund', kanton,
      gericht: opt.gericht ?? status, quelltyp: 'rechtsprechung',
    },
  } as unknown as Bezug;
}

const bs = (n: string, d = '2024-01-15') => kante(`bs_${n}`, 'kantonal', {
  gericht: 'bs_appellationsgericht', zitierung: `Appellationsgericht BS BES.${n} vom 15.01.2024`, datum: d,
});
const ag = (n: string) => kante(`ag_${n}`, 'kantonal', {
  gericht: 'ag_gerichte', kanton: 'AG', zitierung: `Obergericht AG ZOR.${n} vom 22.08.2025`,
});

describe('Ordnung nach Davids Entscheid 23.9.2026', () => {
  it('BGE zuerst, dann je kantonales Gericht (Kanton alphabetisch), dann der Rest bger → eidg', () => {
    const g = ordneEntscheide([
      kante('e1', 'eidg'), bs('1'), kante('b1', 'bger'), ag('1'), kante('g1', 'bge'),
    ]);
    expect(g.map((x) => x.id)).toEqual(['bge', 'kantonal:ag_gerichte', 'kantonal:bs_appellationsgericht', 'bger', 'eidg']);
    expect(g.map((x) => x.titel)).toEqual([
      'Leitentscheide', 'Obergericht AG', 'Appellationsgericht BS', 'Bundesgericht, übrige', 'Eidg. Gerichte',
    ]);
  });

  it('innerhalb einer Gruppe bleibt die Shard-Ordnung (neu → alt) erhalten', () => {
    const g = ordneEntscheide([bs('3', '2025-05-01'), ag('1'), bs('2', '2024-02-01'), bs('1', '2020-01-01')]);
    expect(g.find((x) => x.gericht === 'bs_appellationsgericht')?.liste.map((b) => b.key))
      .toEqual(['bs_3', 'bs_2', 'bs_1']);
  });

  it('Gerichtsname aus der Zitierung; ohne Kantonskürzel kein erfundener Name', () => {
    expect(gerichtAusZitierung('Verwaltungs-/Versicherungsgericht SG B 2024/164 vom 08.10.2025', 'SG'))
      .toBe('Verwaltungs-/Versicherungsgericht SG');
    expect(gerichtAusZitierung('XY.2024.1', 'BS')).toBeNull();
    const g = ordneEntscheide([kante('k', 'kantonal', { gericht: 'zz', kanton: 'ZZ', zitierung: 'ohne Kürzel' })]);
    expect(g[0]?.titel).toBe('Kantonal ZZ');
  });

  it('leere Eingabe ⇒ keine Gruppe', () => {
    expect(ordneEntscheide([])).toEqual([]);
  });
});

describe('Portion (D-4)', () => {
  it('erste Portion 5, Nachladeschritt 50, an die Menge geklammert', () => {
    expect(ERSTE_PORTION).toBe(5);
    expect(NACHLADE_SCHRITT).toBe(50);
    expect(naechsteMenge(5, 4144)).toBe(55);
    expect(naechsteMenge(5, 12)).toBe(12);
  });

  it('«weitere N» nennt nie mehr, als der Klick bringt', () => {
    expect(weitereText(5, 12)).toBe('weitere 7');
    expect(weitereText(5, 4144)).toBe("weitere 50 von 4'139");
  });
});

describe('Zahlen am Instanz-Schalter gelten dem Artikel (D-9)', () => {
  it('nicht geladen ⇒ keine Zahl; geladen ⇒ jede Klasse gezählt, Summe = Kanten', () => {
    expect(klassenZahlenAmArtikel(undefined, false)).toEqual({});
    const alle = [kante('g1', 'bge'), kante('g2', 'bge'), bs('1'), ag('1'), kante('b1', 'bger')];
    const z = klassenZahlenAmArtikel(alle, true);
    expect(z.bge?.dokumente).toBe(2);
    expect(z.kantonal?.dokumente).toBe(2);
    expect(z.eidg?.dokumente).toBe(0);
    const summe = Object.values(z).reduce((n, k) => n + (k?.dokumente ?? 0), 0);
    expect(summe).toBe(alle.length);
  });
});

describe('Anzeige-Helfer', () => {
  it('E-8: Datum in der Zitierung wird erkannt, BGE-Zitierung trägt keines', () => {
    expect(datumInZitierung('Appellationsgericht BS BES.2020.86 vom 12.04.2022')).toBe(true);
    expect(datumInZitierung('BGer 2C_1060/2020 vom 19. Februar 2021')).toBe(true);
    expect(datumInZitierung('BGE 151 III 95')).toBe(false);
  });

  it('B-2/E-6: führendes «a» wird als Teil benannt, «ad 1» und Satzanfänge nicht', () => {
    expect(regesteTeil('a Art. 41 OR; Haftung')).toEqual({ teil: 'a', rest: 'Art. 41 OR; Haftung' });
    expect(regesteTeil('a aArt. 12 BV; alt')).toEqual({ teil: 'a', rest: 'aArt. 12 BV; alt' });
    expect(regesteTeil('ad 1 Zulässigkeit')).toEqual({ teil: null, rest: 'ad 1 Zulässigkeit' });
    expect(regesteTeil('Art. 41 OR')).toEqual({ teil: null, rest: 'Art. 41 OR' });
  });
});

// ── Render: Lagen und Portion im ausgelieferten Markup ──────────────────────
const basis = {
  aktArtikel: '41', revisionShard: null, normZitat: 'Art. 41 OR', artikelLabel: 'Art. 41',
  bestimmungsWort: 'Artikel' as const, klassen: ['bge', 'bger', 'eidg', 'kantonal'] as BezugStatus[],
  kantone: [] as string[], kantoneVerfuegbar: [] as string[],
  histogramm: { balken: [], ohneJahr: 0 }, bereich: { von: '', bis: '' },
  onKlassen: () => {}, onKantone: () => {}, onBereich: () => {},
};
const html = (p: Partial<Parameters<typeof PanelEntscheide>[0]>) =>
  renderToString(<MemoryRouter><PanelEntscheide {...basis} geladen {...p} /></MemoryRouter>);

describe('PanelEntscheide — Lagen (E-3/D-3/B-8)', () => {
  it('Ladefehler zeigt die Fehler-Lage mit «Erneut laden», NIE «kein Entscheid erfasst»', () => {
    const h = html({ geladen: false, fehler: true, onNeuLaden: () => {} });
    expect(h).toContain('data-v3-panel-lage="fehler"');
    expect(h).toContain('Erneut laden');
    expect(h).not.toContain('kein Entscheid');
    expect(h).not.toContain('data-v3-panel-lage="laedt"');
  });

  it('404 (geladen, leer) bleibt die Bestands-Lage', () => {
    const h = html({ kanten: [] });
    expect(h).toContain('data-v3-panel-lage="bestand"');
    expect(h).not.toContain('data-v3-panel-lage="fehler"');
  });
});

describe('PanelEntscheide — Portion, Ordnung, Darstellung', () => {
  const viele = Array.from({ length: 12 }, (_, i) => kante(`g${i}`, 'bge', { zitierung: `BGE 15${i % 3} III ${i}` }));
  const alle = [...viele, bs('1'), bs('2'), kante('b1', 'bger', { zitierung: 'BGer 4A_1/2024 vom 3. Mai 2024' })];

  it('je Gruppe höchstens 5 Zeilen initial, «weitere 7» an der BGE-Gruppe', () => {
    const h = html({ kanten: alle, alleKanten: alle });
    expect(h.match(/data-v3-panel-entscheid=/g)?.length).toBe(5 + 2 + 1);
    expect(h).toContain('data-v3-panel-weitere="bge"');
    expect(h).toContain('weitere 7');
    expect(h).not.toContain('data-v3-panel-weitere="bger"');
  });

  it('Gruppenfolge im Markup: bge → kantonales Gericht → bger', () => {
    const h = html({ kanten: alle, alleKanten: alle });
    const a = h.indexOf('data-v3-panel-gruppe="bge"');
    const b = h.indexOf('data-v3-panel-gericht="bs_appellationsgericht"');
    const c = h.indexOf('data-v3-panel-gruppe="bger"');
    expect(a).toBeGreaterThan(-1);
    expect(a).toBeLessThan(b);
    expect(b).toBeLessThan(c);
  });

  it('E-8: kantonales Datum steht einmal (aus der Zitierung), BGE-Datum als Unterzeile', () => {
    const h = html({ kanten: [bs('1'), kante('g', 'bge', { zitierung: 'BGE 151 III 95', datum: '2025-03-04' })] });
    // Sichtbarer Text (ohne Tags/Attribute — der `title` der Zitierung zählt nicht).
    const text = h.replace(/<[^>]+>/g, '');
    expect(text.split('15.01.2024').length - 1).toBe(1);
    expect(text).toContain('04.03.2025');
  });

  it('B-2: Regeste-Teil wird benannt', () => {
    const h = html({ kanten: [kante('g', 'bge', { zitierung: 'BGE 151 III 95', regeste: 'a Art. 41 OR; Haftung' })] });
    expect(h).toContain('data-v3-panel-regeste-teil="a"');
    expect(h).toContain('Regeste a: </span>');
  });

  it('E-5: Abdeckungs-Zeile mit Link auf /abdeckung steht in jeder Lage', () => {
    for (const p of [{ kanten: alle }, { kanten: [] }, { geladen: false, fehler: true }]) {
      const h = html(p);
      expect(h).toContain('data-v3-panel-abdeckung-zeile');
      expect(h).toContain('href="/abdeckung"');
    }
  });

  it('D-9: die Schalter-Zahlen sind die des Artikels (Instanzen-Klappe offen ⇒ geprüft über den Titel-Wortlaut)', () => {
    // Die Klappe ist zu, die Zahlen stehen dann nicht im Markup — geprüft wird
    // darum der Kurzstand, der ohne Klappe steht, und die reine Funktion oben.
    const h = html({ kanten: alle, alleKanten: alle });
    expect(h).toContain('BGE +3');
  });
});
