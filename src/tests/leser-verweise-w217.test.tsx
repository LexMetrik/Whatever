// W2·17-UI-BEFUNDE · E-D12-B01 (Einzelmodus-Dossier «0 Verweise») + PE-F5-B01
// (Blatt: «Verweise dieses Artikels» fehlt bei ausgeschriebenen Verweisen).
//
// Befund: `sammleVerweise` fuhr eine EIGENE, engere Erkennung (NORM_IM_TEXT, nur
// «Art. N KUERZEL»), waehrend der Wortlaut seine Links ueber NormText rendert
// (Binnenverweise «Artikel 336c», «§ 228», ausgeschriebene «Artikel 51 ATSG»,
// Plural-Ketten, Chapeau-Weichen). Folge: «0 Verweise» / «verweist auf keine
// andere Bestimmung» neben verlinktem Wortlaut (§8).
//
// Vertrag (§5): die Verweis-Liste ist die Menge der Links, die der Wortlaut
// SELBST rendert — nicht eine zweite Erkennung. Der Paritaets-Test unten
// vergleicht gegen das echte SSR-Markup von ArtikelBody.
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ArtikelBody } from '../components/normtext/ArtikelBody';
import type { InternRefs } from '../components/NormText';
import { sammleVerweise } from '../pages/gesetz-leser/parts/ArtikelLeser.fussnoten';
import { art, internFuer, lade, type Eintrag } from './leser-verweise-w217-helfer';


describe('E-D12-B01 · Binnenverweise zaehlen (Wortlaut verlinkt sie)', () => {
  it('OR 336d: «Artikel 336c» steht in der Verweis-Liste (Bund, bare Binnenverweise)', () => {
    const or = lade('bund', 'OR');
    const v = sammleVerweise(art(or, '336_d'), { kuerzel: 'OR', intern: internFuer('bund', 'OR', or) });
    expect(v.map((x) => x.href)).toContain('/gesetze/bund/OR#art-336_c');
    expect(v.find((x) => x.href === '/gesetze/bund/OR#art-336_c')?.anzeige).toBe('Artikel 336c');
  });

  it('BS-640.100 § 2: «§§ 228 und 228b» (kantonal, §-designiert)', () => {
    const bs = lade('kanton', 'BS-640.100');
    const v = sammleVerweise(art(bs, '2'), { kuerzel: 'StG', intern: internFuer('kanton', 'BS-640.100', bs) });
    expect(v.map((x) => x.href)).toContain('/gesetze/kanton/BS-640.100#art-228');
  });

  it('derselbe Artikel zweimal im Text → ein Eintrag (Dedupe am Ziel)', () => {
    const or = lade('bund', 'OR');
    const v = sammleVerweise(art(or, '336_d'), { kuerzel: 'OR', intern: internFuer('bund', 'OR', or) });
    const ziele = v.map((x) => x.href).filter(Boolean);
    expect(new Set(ziele).size).toBe(ziele.length);
  });
});

describe('PE-F5-B01 · ausgeschriebene Fremdverweise zaehlen', () => {
  it('AHVG 14: «Artikel 51 ATSG» ist ein Verweis', () => {
    const ahvg = lade('bund', 'AHVG');
    const v = sammleVerweise(art(ahvg, '14'), { kuerzel: 'AHVG', intern: internFuer('bund', 'AHVG', ahvg) });
    expect(v.map((x) => x.norm)).toContain('Art. 51 ATSG');
  });

  it('abgekuerzte Form «Art. N KUERZEL» bleibt erhalten (kein Rueckschritt)', () => {
    const sample: Eintrag = {
      id: 'x', ebene: 'bund', quelle: 'X', erlass: 'X', artikel: '1', artikelLabel: 'Art. 1',
      bloecke: [{ absatz: '1', text: 'Es gilt Art. 684 ZGB sowie Art. 41 OR.' }],
      stand: '2026-01-01', quelleUrl: '', abgerufen: '2026-01-01', fassungsToken: '', sha: '',
    } as unknown as Eintrag;
    const v = sammleVerweise(sample, { kuerzel: 'X', intern: internFuer('bund', 'X', [sample]) });
    expect(v.map((x) => x.norm)).toEqual(['Art. 684 ZGB', 'Art. 41 OR']);
  });
});

describe('E-D13-B01 · kantonale Kuerzel-Kollision: «StG» ist in AR nicht das Bundes-StG', () => {
  it('AR-621.111 Art. 41b: «Art. 70a / 69a / 285e StG» steht NICHT als Bundesverweis in der Liste', () => {
    const ar = lade('kanton', 'AR-621.111');
    const v = sammleVerweise(art(ar, '41_b'), { kuerzel: 'StV', intern: internFuer('kanton', 'AR-621.111', ar) });
    expect(v.filter((x) => x.norm && /\bStG$/.test(x.norm))).toEqual([]);
  });

  it('AR-621.111 + AR-625.21 (Gesamtbestand): kein «… StG»-Chip in der kantonalen Liste', () => {
    for (const key of ['AR-621.111', 'AR-625.21']) {
      const eintraege = lade('kanton', key);
      const intern = internFuer('kanton', key, eintraege);
      const treffer = eintraege.flatMap((e) => sammleVerweise(e, { kuerzel: 'StV', intern })
        .filter((x) => x.norm && /\bStG$/.test(x.norm)).map((x) => `${key} ${e.artikel}: ${x.norm}`));
      expect(treffer).toEqual([]);
    }
  });
});

describe('§1 · Chapeau: kein plausibel-falscher Self-Verweis', () => {
  it('ZGB 89a Abs. 6: «Art. 52» unter dem BVG-Chapeau fuehrt NIE auf ZGB Art. 52', () => {
    const zgb = lade('bund', 'ZGB');
    const v = sammleVerweise(art(zgb, '89_a'), { kuerzel: 'ZGB', intern: internFuer('bund', 'ZGB', zgb) });
    expect(v.map((x) => x.href)).not.toContain('/gesetze/bund/ZGB#art-52');
    // … sondern wie im Wortlaut als Fremdverweis auf das Chapeau-Gesetz.
    expect(v.map((x) => x.norm)).toContain('Art. 52 BVG');
  });
});

describe('§5 · Paritaet: Liste == Links des gerenderten Wortlauts', () => {
  // Wortlaut-Links = Anker im SSR-Markup von ArtikelBody (autolink, intern),
  // gerendert wie im Leser. Verglichen wird (a) jedes Sprungziel der Liste steht
  // wortgleich im Wortlaut, (b) jedes Wortlaut-Ziel, das KEIN Sprungziel der Liste
  // ist, ist ein Normverweis der Liste (und umgekehrt: kein Normverweis ohne
  // Wortlaut-Anker). Damit ist die Liste weder zu eng (E-D12-B01/PE-F5-B01) noch
  // zu weit (ein Eintrag, den der Wortlaut nicht verlinkt, waere §8-falsch).
  const wortlautZiele = (e: Eintrag, kuerzel: string, intern: InternRefs): Set<string> => {
    const html = renderToStaticMarkup(
      <ArtikelBody bloecke={e.bloecke} artikel={e.artikel} passus={{ absatz: null }} autolink
        zitierKontext={{ artikelLabel: e.artikelLabel, kuerzel }} intern={intern} />,
    );
    const ziele = new Set<string>();
    for (const m of html.matchAll(/<a\b[^>]*?\shref="([^"]+)"/g)) ziele.add(m[1]);
    return ziele;
  };

  const probe = (ebene: 'bund' | 'kanton', key: string, kuerzel: string, max = 400) => {
    const eintraege = lade(ebene, key);
    const intern = internFuer(ebene, key, eintraege);
    let geprueft = 0;
    const abweichungen: string[] = [];
    for (const e of eintraege.slice(0, max)) {
      const liste = sammleVerweise(e, { kuerzel, intern });
      const wort = wortlautZiele(e, kuerzel, intern);
      const sprung = new Set(liste.flatMap((v) => (v.href ? [v.href] : [])));
      // Erlass-Links ohne Bestimmung («… des StG», href ohne #art) sind im Wortlaut
      // Links, aber keine Verweise auf Bestimmungen — die Liste fuehrt sie nicht.
      const nurWort = [...wort].filter((h) => !sprung.has(h) && /#art[-_]/.test(h));
      const nurListeSprung = [...sprung].filter((h) => !wort.has(h));
      const normen = liste.filter((v) => v.norm).length;
      if (nurListeSprung.length > 0) abweichungen.push(`${key} ${e.artikel}: Liste-Sprung ohne Wortlaut-Anker ${nurListeSprung}`);
      if ((nurWort.length > 0) !== (normen > 0)) abweichungen.push(`${key} ${e.artikel}: Wortlaut-Ziele ${nurWort}, Normverweise ${normen}`);
      geprueft++;
    }
    return { geprueft, abweichungen };
  };

  it('OR (Bund, 400 Artikel): kein Artikel mit Wortlaut-Links ohne Liste und umgekehrt', () => {
    const r = probe('bund', 'OR', 'OR');
    expect(r.geprueft).toBeGreaterThan(300);
    expect(r.abweichungen).toEqual([]);
  });

  it('AHVG (ausgeschriebene Fremdverweise)', () => {
    const r = probe('bund', 'AHVG', 'AHVG');
    expect(r.abweichungen).toEqual([]);
  });

  it('BS-640.100 (kantonal, §)', () => {
    const r = probe('kanton', 'BS-640.100', 'StG');
    expect(r.abweichungen).toEqual([]);
  });
});
