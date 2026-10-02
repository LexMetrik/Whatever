// @vitest-environment node
/**
 * W2·27-BUND-FERTIG E2 · Ziffer-Fragment (Form A, Entscheid David 2.10.2026):
 * `#art-197-ziff-12` = Suffix am bestehenden Artikel-Anker.
 *
 * Deckt: Zerlegung/Kodierung (rein), den DOM-Anker am ersten Block jeder Ziffer (Leser, nicht
 * Popover), das Sprungziel `findeZiel` (Ziffer, Sammel-Ziffer, unbekannt ⇒ Artikel), die
 * Einzelmodus-/Reiter-Lesestellen und eine Korpus-Wache für die Kollisionsfreiheit des Trenners.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { parseHTML } from 'linkedom';
import { ArtikelBody } from '../components/normtext/ArtikelBody';
import type { NormSnapshot } from '../lib/normtext/typen';
import {
  ZIFFER_TRENNER, istAnkerZiffer, zifferAnkerAttribute, zifferAnkerToken, zerlegeZifferAnker, zifferSuchWert,
} from '../lib/normtext/zifferAnker';
import { findeZiel } from '../pages/gesetz-leser/berechnungen';
import { loeseEinzelToken, tokenAusHash } from '../pages/gesetz-leser/v3/einzelModus';
import { reiterStelle } from '../lib/reiterStelle';

type Block = NormSnapshot['bloecke'][number];

describe('zerlegeZifferAnker — Artikel-Token und Ziffer', () => {
  it.each([
    ['197-ziff-12', '197', '12'],
    ['1a-ziff-2', '1a', '2'],
    ['1_a-ziff-1bis', '1_a', '1bis'],
    ['77_78-ziff-2_3', '77_78', '2_3'],
    ['a1-6-ziff-3', 'a1-6', '3'], // Token mit Bindestrich (Korpus: «a1-6»)
    ['197-ZIFF-12', '197', '12'],
    ['x-ziff-1-ziff-2', 'x-ziff-1', '2'], // das LETZTE «-ziff-» zählt
  ])('«%s» ⇒ Artikel «%s», Ziffer «%s»', (roh, artikel, ziffer) => {
    expect(zerlegeZifferAnker(roh)).toEqual({ artikel, ziffer });
  });

  it('mehrfaches «-ziff-» im Token: das LETZTE trennt (künstlicher Token), der Rest bleibt Artikel-Token', () => {
    // Nagelt die Kommentar-Behauptung in zifferAnker.ts fest. Die Zerlegung ist eindeutig, weil die
    // Ziffer-Klasse «-» nicht enthält: «(.+)» gierig oder «(.+?)» träge ergibt dasselbe (äquivalente
    // Mutante); echt kippt nur eine Ziffer-Klasse MIT «-» (dann zerlegte ein träges Token am ERSTEN).
    expect(zerlegeZifferAnker('art-x-ziff-1-ziff-2'.slice('art-'.length))).toEqual({ artikel: 'x-ziff-1', ziffer: '2' });
    expect(zerlegeZifferAnker('a-ziff-1-ziff-2-ziff-3')).toEqual({ artikel: 'a-ziff-1-ziff-2', ziffer: '3' });
    expect(zerlegeZifferAnker('x-ziff-1-ziff-')).toEqual({ artikel: 'x-ziff-1-ziff-', ziffer: null });
    // …und die Ziffer-Id-Form trägt das Ergebnis verlustfrei zurück.
    const z = zerlegeZifferAnker('x-ziff-1-ziff-2');
    expect(zifferAnkerToken(z.artikel, z.ziffer)).toBe('x-ziff-1-ziff-2');
  });

  it.each(['197', '1_a', 'annex_1', '1.1', '22 a', '36–42', 'x-ziff-', '-ziff-3', 'x-ziff-1.1', 'x-ziff-a b', ''])(
    'ohne gültiges Suffix unverändert: «%s»', (roh) => {
      expect(zerlegeZifferAnker(roh)).toEqual({ artikel: roh, ziffer: null });
    },
  );

  it('zifferAnkerToken baut das Gegenstück; unverankerbare Ziffer fällt auf den Artikel zurück', () => {
    expect(zifferAnkerToken('197', '12')).toBe(`197${ZIFFER_TRENNER}12`);
    expect(zifferAnkerToken('197', null)).toBe('197');
    expect(zifferAnkerToken('197', undefined)).toBe('197');
    expect(zifferAnkerToken('1', '1.1')).toBe('1'); // mehrstufig: kein Ziffer-Anker (das ist ein Anhang-Token)
    expect(istAnkerZiffer('1bis')).toBe(true);
    expect(istAnkerZiffer('1.1')).toBe(false);
  });

  it('Hin und zurück: Zerlegung ∘ Aufbau ist die Identität', () => {
    for (const [a, z] of [['197', '12'], ['1_a', '1bis'], ['77_78', '2_3']] as const) {
      expect(zerlegeZifferAnker(zifferAnkerToken(a, z))).toEqual({ artikel: a, ziffer: z });
    }
  });

  it('zifferSuchWert normalisiert wie die Passus-Auflösung (Punkt, Grossschreibung) und lehnt Müll ab', () => {
    expect(zifferSuchWert('12')).toBe('12');
    expect(zifferSuchWert('12.')).toBe('12');
    expect(zifferSuchWert('1BIS')).toBe('1bis');
    expect(zifferSuchWert('"]x')).toBeNull();
    expect(zifferSuchWert('')).toBeNull();
  });
});

const bv: Block[] = [
  { absatz: null, text: 'Übergangsbestimmungen zu Art. 1' }, // ohne Ziffer
  { absatz: null, text: '1. Beitritt', titel: 3, ziffer: '1' },
  { absatz: '1', text: 'Absatz eins der Ziffer eins.', ziffer: '1' },
  { absatz: null, text: '12. Übergangsbestimmung', titel: 3, ziffer: '12' },
  { absatz: '1', text: 'Absatz eins der Ziffer zwölf.', ziffer: '12' },
  { absatz: '2', text: 'Absatz zwei der Ziffer zwölf.', ziffer: '12' },
  { absatz: null, text: '2. und 3. …', ziffer: '2_3' },
  { absatz: null, text: '4.1 Dezimal', ziffer: '4.1' }, // nicht verankerbar
];

describe('zifferAnkerAttribute — nur der ERSTE Block jeder Ziffer', () => {
  const a = zifferAnkerAttribute('197', bv);
  it('id am ersten Block der Ziffer, nirgends sonst', () => {
    expect(a.map((x) => x?.id)).toEqual([
      undefined, 'art-197-ziff-1', undefined, 'art-197-ziff-12', undefined, undefined, 'art-197-ziff-2_3', undefined,
    ]);
  });
  it('data-ziffer trägt die Einzelziffern der Sammel-Ziffer', () => {
    expect(a[6]?.['data-ziffer']).toBe('2 3');
    expect(a[3]?.['data-ziffer']).toBe('12');
  });
  it('Artikel ohne Ziffer-Ebene: kein Anker (unverändert)', () => {
    expect(zifferAnkerAttribute('5', [{ absatz: '1', text: 'x' }, { absatz: '2', text: 'y' }]).every((x) => x === undefined)).toBe(true);
  });
});

const zk = { artikelLabel: 'Art. 197', kuerzel: 'BV' };
const render = (zitierKontext?: typeof zk) =>
  renderToString(<ArtikelBody bloecke={bv} artikel="197" passus={{ absatz: null }} zitierKontext={zitierKontext} />);

describe('ArtikelBody — Ziffer-Anker im DOM', () => {
  const o = render(zk);
  it('Leser: id `art-197-ziff-<z>` genau einmal je Ziffer, an Überschrift bzw. erstem Block', () => {
    for (const z of ['1', '12', '2_3']) {
      expect((o.match(new RegExp(`id="art-197-ziff-${z}"`, 'g')) ?? []).length, `Ziffer ${z}`).toBe(1);
    }
    // Überschrift-Ziffer: die id sitzt auf der Überschrift selbst (nicht auf dem Folge-Absatz)
    expect(o).toMatch(/<p[^>]*id="art-197-ziff-12"[^>]*>12\. Übergangsbestimmung<\/p>/);
    // …und trägt `nt-anker` (scroll-margin unter der klebenden Krone), sonst landet der Sprung dahinter
    expect(o).toMatch(/<p[^>]*class="[^"]*nt-anker[^"]*"[^>]*>12\. Übergangsbestimmung/);
  });
  it('Absatz-Ziffer: der Absatz-Block selbst trägt id und data-ziffer', () => {
    expect(o).toMatch(/<div[^>]*id="art-197-ziff-2_3"[^>]*data-ziffer="2 3"|<div[^>]*data-ziffer="2 3"[^>]*id="art-197-ziff-2_3"/);
  });
  it('mehrstufige Ziffer «4.1» bekommt keine id (nicht verankerbar), der Text bleibt', () => {
    expect(o).not.toContain('ziff-4.1');
    expect(o).toContain('4.1 Dezimal');
  });
  it('Popover (ohne zitierKontext): KEINE `art-…`-ids (sonst doppelt im DOM und im Scroll-Spy)', () => {
    const p = render(undefined);
    expect(p).not.toContain('-ziff-');
    expect(p).not.toContain('data-ziffer');
  });
  it('Artikel ohne Ziffer-Ebene: kein Ziffer-Anker, kein nt-anker an Blöcken (byte-gleich)', () => {
    const plain = renderToString(
      <ArtikelBody bloecke={[{ absatz: '1', text: 'Eins.' }]} artikel="5" passus={{ absatz: null }} zitierKontext={zk} />,
    );
    expect(plain).not.toContain('ziff');
    expect(plain).not.toContain('nt-anker');
  });
});

describe('findeZiel — Ziffer-Block, sonst Artikel (nie «kein Ziel»)', () => {
  const { document } = parseHTML(`<!doctype html><html><body>
    <article id="art-197"><p id="art-197-ziff-12" data-ziffer="12">12.</p><div id="art-197-ziff-2_3" data-ziffer="2 3">2. und 3. …</div></article>
    <article id="art-5"><div>ohne Ziffern</div></article></body></html>`);
  const g = globalThis as Record<string, unknown>;
  const mit = <T,>(f: () => T): T => { g.document = document; try { return f(); } finally { delete g.document; } };

  it('bekannte Ziffer ⇒ der Ziffer-Block', () => {
    expect(mit(() => findeZiel(null, '197', '12'))?.id).toBe('art-197-ziff-12');
  });
  it('Einzelziffer einer Sammel-Ziffer («3» ⇒ «2_3»), auch exakte Sammel-Schreibweise', () => {
    expect(mit(() => findeZiel(null, '197', '3'))?.id).toBe('art-197-ziff-2_3');
    expect(mit(() => findeZiel(null, '197', '2'))?.id).toBe('art-197-ziff-2_3');
  });
  it('Sammel-Ziffer über ihre EIGENE id («2_3», wie im Anker geschrieben) ⇒ der Block, nicht der Artikel', () => {
    // `data-ziffer` trägt «2 3» (zifferTeile): die id-Schreibweise «2_3» träfe `[data-ziffer~=…]` nie.
    expect(mit(() => findeZiel(null, '197', '2_3'))?.id).toBe('art-197-ziff-2_3');
    expect(mit(() => findeZiel(null, '197', '2_3'))?.getAttribute('data-ziffer')).toBe('2 3');
  });
  it('unbekannte Ziffer ⇒ der Artikel (Fallback, kein Fehler)', () => {
    expect(mit(() => findeZiel(null, '197', '99'))?.id).toBe('art-197');
  });
  it('Artikel ohne Ziffer-Ebene, aber Ziffer im Anker ⇒ der Artikel', () => {
    expect(mit(() => findeZiel(null, '5', '2'))?.id).toBe('art-5');
  });
  it('Selektor-Müll in der Ziffer sprengt nichts ⇒ der Artikel', () => {
    expect(mit(() => findeZiel(null, '197', '"] , article'))?.id).toBe('art-197');
  });
  it('ohne Ziffer ⇒ der Artikel wie bisher; unbekannter Artikel ⇒ null', () => {
    expect(mit(() => findeZiel(null, '197', null))?.id).toBe('art-197');
    expect(mit(() => findeZiel(null, '999', '12'))).toBeNull();
  });
});

describe('Einzelmodus und Reiter lesen den ARTIKEL aus `#art-N-ziff-Z`', () => {
  it('tokenAusHash trennt das Suffix ab; kaputtes Prozent-Escape ⇒ null, kein Absturz', () => {
    expect(tokenAusHash('#art-197-ziff-12')).toBe('197');
    expect(tokenAusHash('#art-197')).toBe('197');
    expect(tokenAusHash('#art-97%')).toBeNull();
    expect(tokenAusHash('#art-%E0-ziff-2')).toBeNull();
    expect(tokenAusHash('#oben')).toBeNull();
  });
  it('loeseEinzelToken: Suffix ab VOR der Token-Abbildung («1a-ziff-2» ⇒ Token «1_a»)', () => {
    expect(loeseEinzelToken('#art-1a-ziff-2', ['1', '1_a', '2'])).toEqual({ token: '1_a', unbekannt: null });
    expect(loeseEinzelToken('#art-99-ziff-2', ['1', '2'])).toEqual({ token: null, unbekannt: '99' });
  });
  it('reiterStelle: das Ziffer-Suffix ändert die Stelle des Reiters nicht', () => {
    const daten = { eintraege: [{ artikel: '197', artikelLabel: 'Art. 197' }], struktur: null };
    expect(reiterStelle('#art-197', 'BV', 'bund', daten)?.stelle).toBe('Art. 197');
    expect(reiterStelle('#art-197-ziff-12', 'BV', 'bund', daten)).toEqual(reiterStelle('#art-197', 'BV', 'bund', daten));
    expect(reiterStelle('#art-197-ziff-12', 'BV', 'bund', null)).toEqual(reiterStelle('#art-197', 'BV', 'bund', null));
    expect(reiterStelle('#art-97%', 'BV', 'bund', daten)).toBeNull();
  });
});

describe('Korpus-Wache — der Trenner ist kollisionsfrei, die Ziffern sind verankerbar', () => {
  const dateien = (ordner: string): string[] =>
    readdirSync(ordner, { recursive: true, withFileTypes: false }).map(String)
      .filter((f) => f.endsWith('.json')).map((f) => `${ordner}/${f}`);
  const alle = [...dateien('public/normtext/bund'), ...dateien('public/normtext/kanton')];

  it('kein Artikel-Token enthält «-ziff-»; jede `Block.ziffer` ist ein verankerbarer Token', () => {
    const tokenMitTrenner: string[] = [];
    const unverankerbar: string[] = [];
    let mitZiffer = 0;
    for (const f of alle) {
      const d = JSON.parse(readFileSync(f, 'utf8'));
      const eintraege: NormSnapshot[] | undefined = Array.isArray(d) ? d : d.eintraege;
      if (!Array.isArray(eintraege)) continue;
      for (const e of eintraege) {
        if (/-ziff-/i.test(e.artikel)) tokenMitTrenner.push(`${f}#${e.artikel}`);
        for (const b of e.bloecke ?? []) {
          if (b.ziffer == null) continue;
          mitZiffer++;
          if (!istAnkerZiffer(b.ziffer)) unverankerbar.push(`${f}#${e.artikel}:${b.ziffer}`);
        }
      }
    }
    expect(alle.length).toBeGreaterThan(50);
    expect(mitZiffer, 'Ziffer-Ebene im Korpus vorhanden (#1251)').toBeGreaterThan(1000);
    expect(tokenMitTrenner).toEqual([]);
    expect(unverankerbar).toEqual([]);
  });
});

describe('Scroll-Spy beobachtet nur ARTIKEL, nie Ziffer-Anker (Quellensonde)', () => {
  // `art-<token>-ziff-<z>` beginnt wie ein Artikel-Anker mit «art-»; ein `[id^="art-"]` ohne `article`
  // würde Ziffer-Blöcke als «Artikel» beobachten und `id.replace(/^art-/, '')` als Token melden
  // («197-ziff-12» hat kein Label ⇒ das Beiwerk fiele auf den ersten Artikel zurück, `panelBezug`).
  // Im Browser ist das nur bei ungünstiger Beobachter-Reihenfolge sichtbar (der Artikel steht im
  // Beobachter vor seinen Ziffern und gewinnt bei Distanz 0) — darum eine Quellensonde statt e2e.
  it('inhalt-hooks.tsx: jede Abfrage auf `[id^="art-"]` steht an `article`', () => {
    const quelle = readFileSync('src/pages/gesetz-leser/inhalt-hooks.tsx', 'utf8');
    const abfragen = [...quelle.matchAll(/querySelector(?:All)?\('([^']*id\^="art-"[^']*)'\)/g)].map((m) => m[1]);
    expect(abfragen.length, 'der Spy fragt Artikel ab').toBeGreaterThanOrEqual(2);
    expect(abfragen.filter((q) => !q.startsWith('article[')), 'Abfrage ohne `article`').toEqual([]);
  });
});

