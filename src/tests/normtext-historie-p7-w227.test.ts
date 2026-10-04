/**
 * W2·27-BUND-FERTIG · Paket P7 — Historie-Parser und Aufhebungs-Daten (1.10.2026).
 *
 * Eine Datei je Paket, damit die Risiko-Tests der Vorgänger (normtext-historie*, normtext-aufhebung-*) unberührt
 * bleiben (§6.3). Fixtures stammen wörtlich aus den gepinnten Fedlex-Konsolidierungen (Pins: scripts/fedlex-cache.sh;
 * Abruf der Caches 1.10.2026) bzw. aus den Struktur-Sidecars `public/normtext/struktur/bund/*.json`.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fussnoteDiesenArtGegenstandslos } from '../../scripts/normtext/aufhebung-signal';
import { parseFussnoteHistorie, baueArtikelHistorie, type FnEingang } from '../lib/normtext/historie-parse';
import { pruefeAufgehobenGiltSeit, leseHistorieShards } from '../../scripts/normtext/historie-aufgehoben-lebend';

// ── #47 · «ist dieser Art. gegenstandslos» nur UNBEDINGT (GP T2, 1.10.2026) ──────────────────────────────────────
describe('P7 #47 · fussnoteDiesenArtGegenstandslos — bedingte Formen sind kein Ganz-Vermerk', () => {
  it('Bestand bleibt: AsylG Art. 122 (unbedingt) trifft weiterhin', () => {
    expect(fussnoteDiesenArtGegenstandslos(
      'AS 1998 1582 Ziff. III. Aufgrund der Annahme dieses BB in der Volksabstimmung vom 13. Juni 1999 ist dieser Art. gegenstandslos.',
    )).toBe(true);
  });

  it('«… ist dieser Art. gegenstandslos, soweit …» / «, sofern …» / «, wenn …» trifft NICHT (Teil-Gegenstandslosigkeit, §1/§8)', () => {
    for (const t of [
      'AS 2001 1 Ziff. III. Aufgrund der Annahme des BB ist dieser Art. gegenstandslos, soweit er sich auf Abs. 3 bezieht.',
      'Aufgrund des BRB ist dieser Art. gegenstandslos, sofern keine Ausnahme besteht.',
      'Aufgrund des BRB ist dieser Artikel gegenstandslos; soweit der Bund Kosten trägt, gilt er weiter.',
      'Aufgrund des BRB ist dieser Art. gegenstandslos wenn das Gesetz in Kraft tritt.',
      'Aufgrund des BRB ist dieser Art. gegenstandslos, ausgenommen Abs. 2.',
    ]) {
      expect(fussnoteDiesenArtGegenstandslos(t), t).toBe(false);
    }
  });

  it('ein Folgesatz, der zufällig mit «Soweit» beginnt, entkräftet den Vermerk nicht', () => {
    // «… ist dieser Art. gegenstandslos. Soweit …» — der Punkt beendet die Aussage (Satzgrenze), nicht ein Bedingungssatz.
    expect(fussnoteDiesenArtGegenstandslos('Aufgrund des BRB ist dieser Art. gegenstandslos. Soweit nötig, siehe Art. 5.')).toBe(true);
  });
});

// ── #53 · Snapshot «aufgehoben» ⇔ Historie «Gilt seit …» (§8, GP M1 Aufhebungs-Sammel 1.10.2026) ──────────────────
// 7 Artikel zeigten im Reiter «Fassung» «Gilt seit …», obwohl der Normtext amtlich «Aufgehoben» sagt:
//   BKV 8        Fussnote «Aufgehobn durch … mit Wirkung seit 1. Jan. 2016» (amtlicher Tippfehler) lief über den
//                generischen In-Kraft-Fall ⇒ «Gilt seit 2016» statt «Aufgehoben seit 2016»;
//   AIG 72       «Aufgehoben durch … (AS 2006 4745). Fassung gemäss … in Kraft vom 2. Okt. 2021 bis zum 31. Dez. 2022 …
//                verlängert … bis zum 30. Juni 2024» — befristete Wiedereinführung, Fedlex-Körper «…»;
//   ASYLV2 65, HREGV 162–163, ZSTV 75a–75m   die «Eingefügt/Fassung gemäss …»-Fussnote hängt am GLIEDERUNGSTITEL
//                (`sektion`), der Artikel selbst trägt nur den Wortlaut «Aufgehoben» ohne Fussnote;
//   AVO 22a–22c, 50b–50f   Fussnote «Eingefügt durch … in Kraft seit 1. Juli 2015» am Kopf, Körper «Aufgehoben»,
//                die Aufhebung selbst nennt die Fussnote nicht (Datum unbekannt ⇒ keins angezeigt, §2).
describe('P7 #53 · «Aufgehobn durch …» (BKV 8) ist ein Aufhebungs-Ereignis', () => {
  const BKV_8 = 'Aufgehobn durch Ziff. I der V des EFD vom 16. April 2014, mit Wirkung seit  1. Jan. 2016 (AS 2014 1109).';
  const fn = (text: string, extra: Partial<FnEingang> = {}): FnEingang => ({ text, links: [], absatz: null, item: null, ...extra });

  it('Grammatik: typ aufgehoben, Wirkungsdatum aus der amtlichen Klausel', () => {
    const r = parseFussnoteHistorie(fn(BKV_8));
    expect(r.ereignisse.map((e) => [e.typ, e.datum, e.wirkung])).toEqual([['aufgehoben', '2016-01-01', true]]);
  });

  it('Artikelebene: aufgehobenSeit 2016-01-01 (Kopf-Fussnote), kein «Gilt seit»-Anspruch mehr', () => {
    const { historie } = baueArtikelHistorie([fn(BKV_8)], { snapshotAufgehoben: true });
    expect(historie?.aufgehobenSeit).toBe('2016-01-01');
  });

  it('Gegenprobe: ein Wort mit gleichem Anfang («Aufgehobene Bestimmungen …») ist kein Aufhebungs-Kopf', () => {
    expect(parseFussnoteHistorie(fn('Aufgehobene Bestimmungen siehe Art. 5.')).ereignisse.some((e) => e.typ === 'aufgehoben')).toBe(false);
  });
});

describe('P7 #53 · snapshotAufgehoben ⇒ kein «Gilt seit» für einen amtlich aufgehobenen Artikel', () => {
  const fn = (text: string, extra: Partial<FnEingang> = {}): FnEingang => ({ text, links: [], absatz: null, item: null, ...extra });
  const AIG_72 =
    'Aufgehoben durch Ziff. IV 2 des BG vom 16. Dez. 2005 (AS 2006 4745; BBl 2002 3709). Fassung gemäss Ziff. I des BG vom 1. Okt. 2021, in Kraft vom 2. Okt. 2021 bis zum 31. Dez. 2022 (AS 2021 587; BBl 2021 1901), gemäss Ziff. I des BG vom 16. Dez. 2022 (Covid-19-Test bei der Ausschaffung) verlängert vom 17. Dez. 2022 bis zum 30. Juni 2024 (AS 2022 818; BBl 2022 1359).';
  const ASYLV2_65 = 'Fassung gemäss Ziff. I der V vom 24. Okt. 2007, in Kraft seit 1. Jan. 2008 (AS 2007 5585).';
  const AVO_22A = 'Eingefügt durch Ziff. I der V vom 25. März 2015, in Kraft seit 1. Juli 2015 (AS 2015 1147).';

  it('AIG 72 / ASYLV2 65 (Titel-Fussnote) / AVO 22a–22c: giltSeit null, Ereignisse bleiben als Chronik', () => {
    for (const [text, extra, anzahl] of [
      [AIG_72, {}, 2],
      [ASYLV2_65, { sektion: '2. Abschnitt: Rückkehrberatung' }, 1],
      [AVO_22A, {}, 1],
    ] as const) {
      const { historie } = baueArtikelHistorie([fn(text, extra)], { snapshotAufgehoben: true });
      expect(historie?.giltSeit, text.slice(0, 30)).toBeNull();
      expect(historie?.aufgehobenSeit).toBeUndefined();
      expect(historie?.ereignisse).toHaveLength(anzahl);
    }
  });

  it('Standard (ohne Snapshot-Auskunft oder Artikel lebt) bleibt Wort für Wort wie bisher: giltSeit aus dem jüngsten datierten Ereignis', () => {
    expect(baueArtikelHistorie([fn(AVO_22A)]).historie?.giltSeit).toBe('2015-07-01');
    expect(baueArtikelHistorie([fn(AVO_22A)], { snapshotAufgehoben: false }).historie?.giltSeit).toBe('2015-07-01');
  });

  it('mit datiertem aufgehobenSeit bleibt giltSeit unberührt (die Anzeige führt «Aufgehoben seit …» vor «Gilt seit …»)', () => {
    const { historie } = baueArtikelHistorie(
      [fn('Fassung gemäss Ziff. I der V vom 1. Jan. 2000, in Kraft seit 1. Jan. 2001 (AS 2000 1).'), fn('Aufgehoben durch Ziff. I der V vom 1. Jan. 2010, mit Wirkung seit 1. Jan. 2011 (AS 2010 1).')],
      { snapshotAufgehoben: true },
    );
    expect(historie).toMatchObject({ giltSeit: '2001-01-01', aufgehobenSeit: '2011-01-01' });
  });
});

describe('P7 #53 · Tor: Text-Shard «aufgehoben» ⇒ Historie ohne «Gilt seit» (Konsistenz Snapshot ⇔ Historie)', () => {
  const textWurzel = 'public/normtext/bund';

  it('Bestand: kein amtlich aufgehobener Bund-Artikel trägt im Historie-Shard ein «Gilt seit» ohne datierte Aufhebung', () => {
    const { befunde, geprueft } = pruefeAufgehobenGiltSeit(leseHistorieShards('public/normtext/historie'), textWurzel);
    expect(geprueft).toBeGreaterThan(1000); // 1261 am 1.10.2026 — das Tor prüft real, nicht leer
    expect(befunde.map((b) => `${b.erlass} ${b.token}`)).toEqual([]);
  });

  it('Rot-Beweis (§6.7): ein Shard mit giltSeit bei Snapshot «aufgehoben» wird gemeldet', () => {
    const shard = new Map([['AVO', { artikel: { '22_a_22_c': { giltSeit: '2015-07-01' }, '50_a': { giltSeit: '2015-07-01' } } }]]);
    const { befunde } = pruefeAufgehobenGiltSeit(shard, textWurzel);
    expect(befunde.map((b) => `${b.erlass} ${b.token} ${b.giltSeit}`)).toEqual(['AVO 22_a_22_c 2015-07-01']); // 50_a lebt (Snapshot ohne `aufgehoben`)
  });

  it('mit aufgehobenSeit ist «Gilt seit» daneben zulässig (Anzeige führt «Aufgehoben seit»)', () => {
    const shard = new Map([['AVO', { artikel: { '22_a_22_c': { giltSeit: '2015-07-01', aufgehobenSeit: '2020-01-01' } } }]]);
    expect(pruefeAufgehobenGiltSeit(shard, textWurzel).befunde).toEqual([]);
  });
});

// ── #11 · «Ursprünglich» nennt die ALTE Bezeichnung (`frueher`), nie ein geratenes Datum ──────────────────────────────
// Die Zeile «Ursprünglich · Abs. 1, lit./Ziff. cquater» sagte nicht, WAS ursprünglich galt; die Fussnote trägt es im
// Wortlaut («Ursprünglich: Bst. c, dann c. Eingefügt durch …»). Gemessen 1.10.2026 (public/normtext/struktur/bund):
// 284 Vorkommen in 282 Fussnoten. Das Datum der Ur-Bezeichnung nennt die Fussnote NICHT — sie datiert nur den
// folgenden «Eingefügt durch …»-Teil (eigenes Ereignis) bzw. die Versetzung («; hierher versetzt gemäss …, in Kraft
// seit …», AHVV 28/31): beides gehört nicht zur Ur-Bezeichnung und wird ihr nicht zugeschrieben (§7).
describe('P7 #11 · frueher = alte Bezeichnung hinter «Ursprünglich»', () => {
  const fn = (text: string, extra: Partial<FnEingang> = {}): FnEingang => ({ text, links: [], absatz: null, item: null, ...extra });
  const frueher = (text: string, extra: Partial<FnEingang> = {}) =>
    parseFussnoteHistorie(fn(text, extra)).ereignisse.filter((e) => e.typ === 'urspruenglich').map((e) => e.frueher);

  it('EOG 20 Abs. 1 lit. g: «Ursprünglich: Bst. e. Eingefügt durch …» ⇒ frueher «Bst. e», Skopus bleibt, Folge-Ereignis eigen', () => {
    const r = parseFussnoteHistorie(fn(
      'Ursprünglich: Bst. e. Eingefügt durch Ziff. I des BG vom 1. Okt. 2021, in Kraft seit 1. Jan. 2023 (AS 2022 468).', { absatz: '1', item: 'g' },
    ));
    expect(r.ereignisse.map((e) => [e.typ, e.frueher, e.datum, e.absatz, e.item])).toEqual([
      ['urspruenglich', 'Bst. e', null, '1', 'g'],
      ['eingefuegt', undefined, '2023-01-01', '1', 'g'],
    ]);
  });

  it('Belegte Wortlaut-Formen (Korpus): mit/ohne Doppelpunkt, mit/ohne Schlusspunkt, «vor Art.», Sammelform, Mehrfach', () => {
    expect(frueher('Ursprünglich Art. 29. Eingefügt durch Ziff. I des BG vom 21. Dez. 1956 (AS 1957 262).')).toEqual(['Art. 29']);
    expect(frueher('Ursprünglich: Art. 49a. Eingefügt durch Ziff. I des BG vom 23. Juni 2000 (AS 2000 2749).')).toEqual(['Art. 49a']);
    expect(frueher('Ursprünglich vor Art. 56')).toEqual(['vor Art. 56']);
    expect(frueher('Ursprünglich: Vor Art. 103. Fassung gemäss Ziff. I des BG vom 25. Sept. 2015, in Kraft seit 1. März 2019 (AS 2016 3101).')).toEqual(['Vor Art. 103']);
    expect(frueher('Ursprünglich Bst. D, danach Bst. E. Eingefügt durch Ziff. I des BRB vom 10. Jan. 1969 (AS 1969 125).')).toEqual(['Bst. D, danach Bst. E']);
    expect(frueher('Ursprünglich Art. 50 Eingefügt durch Ziff. I der V vom 26. Sept. 1994, in Kraft seit 1. Jan. 1995 (AS 1994 2162).')).toEqual(['Art. 50']);
    expect(frueher('Ursprünglich:Artikel 325. Eingefügt durch Ziff. II Art. 4 des BG vom 15. Dez. 1989 (AS 1990 1).')).toEqual(['Artikel 325']);
    expect(frueher('Ursprünglich: Art. 1a. Ursprünglich Art. 1. Fassung gemäss Ziff. I der V vom 11. Dez. 1995, in Kraft seit 1. Jan. 1996 (AS 1996 295).')).toEqual(['Art. 1a', 'Art. 1']);
  });

  it('Abkürzungs-Punkt gehört zur Ur-Bezeichnung (Kap., Abschn., Tit.), der Satz-Punkt nicht', () => {
    expect(frueher('Ursprünglich 3. Kap. Fassung gemäss Ziff. I des BG vom 21. Dez. 1995, in Kraft seit 1. Juli 1997 (AS 1997 1155).')).toEqual(['3. Kap.']);
    expect(frueher('Ursprünglich: 2. Abschn. Fassung gemäss Ziff. I der V vom 10. und 22. Juni 2011, in Kraft seit 1. Jan. 2012 (AS 2011 3435).')).toEqual(['2. Abschn.']);
    expect(frueher('Ursprünglich 2. Abschn. des 1. Kap. Fassung gemäss Art. 2 Ziff. 1 des BB vom 5. Okt. 2007 (AS 2008 38).')).toEqual(['2. Abschn. des 1. Kap.']);
    expect(frueher('Ursprünglich Tit. vor Art. 27')).toEqual(['Tit. vor Art. 27']);
  });

  it('AHVV 28: «; hierher versetzt gemäss …, in Kraft seit 1. Jan. 1966» gehört NICHT zur Ur-Bezeichnung — weder Text noch Datum noch Fundstelle', () => {
    const link = { label: 'AS 1965 1021', url: 'https://fedlex.data.admin.ch/eli/oc/1965/1021_1033_1019' };
    const r = parseFussnoteHistorie({
      text: 'Ursprünglich Tit. vor Art. 27; hierher versetzt gemäss Ziff. II Abs. 2 des BRB vom 19. Nov. 1965, in Kraft seit 1. Jan. 1966 (AS 1965 1021).',
      links: [link], absatz: null, item: null,
    });
    expect(r.ereignisse).toEqual([{ typ: 'urspruenglich', datum: null, wirkung: false, quellen: [], absatz: null, item: null, frueher: 'Tit. vor Art. 27' }]);
  });

  it('eine Fundstelle in Klammer hinter der Ur-Bezeichnung bleibt Quelle, nicht Teil des Textes (BVV 2 Art. 60e)', () => {
    const link = { label: 'AS 2005 5257', url: 'https://fedlex.data.admin.ch/eli/oc/2005/5257' };
    const r = parseFussnoteHistorie({ text: 'Ursprünglich Art. 60b (AS 2005 5257).', links: [link], absatz: null, item: null });
    expect(r.ereignisse[0]).toMatchObject({ typ: 'urspruenglich', frueher: 'Art. 60b', datum: null });
    expect(r.ereignisse[0].quellen.map((q) => q.label)).toEqual(['AS 2005 5257']);
  });

  it('ohne Wortlaut dahinter («Ursprünglich.»): Ereignis ohne frueher', () => {
    expect(frueher('Ursprünglich.')).toEqual([undefined]);
  });

  it('MWSTG 28 Abs. 3: «… Ursprünglicher Abs. 3 aufgehoben durch …» — «Ursprünglicher» (anderes Wort) liefert kein frueher und schluckt die Vor-Bezeichnung nicht', () => {
    const r = parseFussnoteHistorie(fn(
      'Ursprünglich: Abs. 4. Ursprünglicher Abs. 3 aufgehoben durch Ziff. I des BG vom 30. Sept. 2016, mit Wirkung seit 1. Jan. 2018 (AS 2017 3575).', { absatz: '3' },
    ));
    // Bestand der Grammatik (nicht Teil von #11): «Ursprünglicher» ist weiterhin ein eigener Anker; hier nur: kein Müll-Text.
    expect(r.ereignisse.map((e) => [e.typ, e.frueher, e.datum])).toEqual([
      ['urspruenglich', 'Abs. 4', null],
      ['urspruenglich', undefined, null],
      ['aufgehoben', undefined, '2018-01-01'],
    ]);
  });

  it('andere Ereignis-Typen tragen nie ein frueher (Form des Shards unverändert)', () => {
    const r = parseFussnoteHistorie(fn('Eingefügt durch Ziff. I des BG vom 1. Jan. 2000 (AS 2000 1). Fassung gemäss Ziff. I des BG vom 1. Jan. 2010, in Kraft seit 1. Jan. 2011 (AS 2010 1).'));
    expect(r.ereignisse.some((e) => 'frueher' in e)).toBe(false);
  });

  it('Bestand: Hochstellungen der Fussnote bleiben in frueher (AHVG 29ter «Art. 29bis», OR 336c «Bst. cbis, dann cter»), nicht verstümmelt', () => {
    const lies = (erlass: string, token: string) =>
      (JSON.parse(readFileSync(`public/normtext/historie/${erlass}.json`, 'utf8')) as {
        artikel: Record<string, { ereignisse: Array<{ typ: string; frueher?: string }> }>;
      }).artikel[token].ereignisse.filter((e) => e.typ === 'urspruenglich').map((e) => e.frueher);
    expect(lies('AHVG', '29_ter')).toEqual(['Art. 29bis']);
    expect(lies('OR', '336_c')).toEqual(['Bst. cbis, dann cter']);
    expect(lies('IVG', '14_a')).toEqual(['IIbis']);
  });

  it('Bestand: jedes «urspruenglich»-Ereignis im Shard trägt frueher (ausser leerem Wortlaut) und nie ein Datum', () => {
    const ohne: string[] = [];
    const datiert: string[] = [];
    let n = 0;
    for (const f of readdirSync('public/normtext/historie').filter((x) => x.endsWith('.json'))) {
      const s = JSON.parse(readFileSync(`public/normtext/historie/${f}`, 'utf8')) as {
        artikel: Record<string, { ereignisse: Array<{ typ: string; datum: string | null; frueher?: string }> }>;
      };
      for (const [token, a] of Object.entries(s.artikel)) {
        for (const e of a.ereignisse) {
          if (e.typ !== 'urspruenglich') continue;
          n++;
          if (!e.frueher) ohne.push(`${f} ${token}`);
          if (e.datum) datiert.push(`${f} ${token}`);
        }
      }
    }
    expect(n).toBeGreaterThan(250); // 284 am 1.10.2026 — das Tor liest real
    expect(ohne).toEqual(['MWSTG.json 28']); // «Ursprünglicher Abs. 3 aufgehoben …» (anderes Wort, s. oben) — die einzige Ausnahme
    expect(datiert).toEqual([]);
  });
});

// ── #26 · RECHTSGRUNDLAGE_RE: der ParlG-Zweig ist belegt, nicht nur der GVG-Zweig ─────────────────────────────────
// Die Mutation «nur GVG» liess die Suite grün (Form «Art. N ParlG – AS …» kommt im Korpus heute 0× vor). Die
// Grammatik trägt den Zweig aber bewusst: dieselbe Berichtigungs-Klammer nennt neuere Fussnoten als «(Art. 58 Abs. 1
// ParlG; SR 171.10)»; die AS-Form mit ParlG ist die direkte Parallele zur GVG-Form und darf nie als Quelle der
// BERICHTIGUNG gelten (die Fussnote nennt dort die Rechtsgrundlage samt deren Fundstelle).
describe('P7 #26 · Rechtsgrundlage ParlG – AS … ist keine Fundstelle der Berichtigung', () => {
  const link = { label: 'AS 2003 3000', url: 'https://fedlex.data.admin.ch/eli/oc/2003/3000' };
  const fn = (text: string): FnEingang => ({ text, links: [link], absatz: null, item: null });

  it('runde und eckige Klammer, mit und ohne Absatz: Ereignis «berichtigt» ohne Quelle', () => {
    for (const t of [
      'Berichtigt von der Redaktionskommission der BVers (Art. 58 ParlG – AS 2003 3000).',
      'Berichtigt von der Redaktionskommission der BVers (Art. 58 Abs. 1 ParlG – AS 2003 3000).',
      'Berichtigt von der Redaktionskommission der BVers [Art. 58 Abs. 1 ParlG – AS 2003 3000].',
    ]) {
      const r = parseFussnoteHistorie(fn(t));
      expect(r.ereignisse.map((e) => [e.typ, e.quellen]), t).toEqual([['berichtigt', []]]);
    }
  });

  it('Gegenprobe: dieselbe Klammer mit einem ANDEREN Erlass (Art. 5 BGG – AS …) bleibt Quelle (nie breiter als GVG/ParlG)', () => {
    const r = parseFussnoteHistorie(fn('Berichtigt von der Redaktionskommission der BVers (Art. 5 BGG – AS 2003 3000).'));
    expect(r.ereignisse[0].quellen.map((q) => q.label)).toEqual(['AS 2003 3000']);
  });
});

// ── #50 · «Dieser Art. ist (heute) aufgehoben» an einem ABSATZ-/lit.-Marker ist eine Anmerkung zur ZITIERTEN Bestimmung ─
// Befund 1.10.2026: StGB 66, StPO 173, BGG 83, VVG 47a, OR disp_u13/art_6 trugen die Fussnote «Dieser Art. ist
// (heute) aufgehoben» bei lebendem Body; LFG 100 «nicht mehr in Kraft». Geprüft an den gepinnten Fedlex-HTMLs
// (Kontext des Markers, Abruf der Caches 1.10.2026): in ALLEN Fällen steht der Marker hinter einem ZITAT im
// Absatz-/lit.-Text («… wie eine kurze Freiheitsstrafe vollzogen (Art. 79[Fn])», «Artikel 139 Absatz 3 des
// Zivilgesetzbuchs[Fn]»); die Fussnote sagt, die zitierte Bestimmung sei aufgehoben — nicht den Artikel, in dem sie
// zitiert wird. Anzeige korrekt: der Artikel lebt, kein «aufgehoben»-Ereignis, kein aufgehobenSeit.
describe('P7 #50 · Zitat-Anmerkung «Dieser Art. ist aufgehoben» (Absatz-/lit.-Skopus) ist kein Aufhebungs-Ereignis', () => {
  const FAELLE: Array<{ wo: string; text: string; absatz: string | null; item: string | null }> = [
    { wo: 'StGB 66 Abs. 2 (zitiert Art. 79)', text: 'Dieser Art. ist aufgehoben (AS 2016 1249; BBl 2012 4721).', absatz: '2', item: null },
    { wo: 'StGB 172ter Abs. 2 (zitiert Art. 139 Ziff. 2)', text: 'Diese Ziff. ist heute aufgehoben.', absatz: '2', item: null },
    { wo: 'StPO 173 Abs. 1 lit. b (zitiert Art. 139 Abs. 3 ZGB)', text: 'SR 210. Dieser Art. ist heute aufgehoben.', absatz: '1', item: 'b' },
    { wo: 'BGG 83 lit. r (zitiert Art. 34 VGG)', text: 'SR 173.32. Dieser Art. ist aufgehoben. Siehe heute: Art. 33 Bst. i VGG in Verbindung mit Art. 53 Abs. 1 des BG vom 18. März 1994 über die Krankenversicherung.', absatz: null, item: 'r' },
    { wo: 'VVG 47a lit. a (zitiert Art. 12 Abs. 2 KVG)', text: 'SR 832.10. Dieser Art. ist heute aufgehoben. Siehe seit dem 1. Jan. 2016: Art. 2 Abs. 2 des Krankenversicherungsaufsichtsgesetzes.', absatz: null, item: 'a' },
    { wo: 'OR SchlT 6 Ziff. 12 (zitiert Art. 64)', text: 'Dieser Art. ist heute aufgehoben.', absatz: null, item: '12' },
    { wo: 'OR SchlT 3 Abs. 1 (zitiert Art. 226f–226k)', text: 'Diese Art. sind heute aufgehoben.', absatz: '1', item: null },
    { wo: 'VZV 80 Abs. 1 (zitiert Art. 10 Abs. 3)', text: 'Dieser Abs. ist heute aufgehoben.', absatz: '1', item: null },
    { wo: 'LFG 100 Abs. 2 lit. a (zitiert Art. 13a Abs. 1 Bst. b Ziff. 1)', text: 'SR 120. Dieser Art. ist nicht mehr in Kraft. Siehe heute: Art. 19 Abs. 2 Bst. a des Nachrichtendienstgesetzes vom 25. Sept. 2015 (SR 121).', absatz: '2', item: 'a' },
  ];

  it('kein «aufgehoben»-Ereignis, keine Ganz-Artikel-Historie (weder aufgehobenSeit noch gegenstandslos)', () => {
    for (const f of FAELLE) {
      const fn: FnEingang = { text: f.text, links: [], absatz: f.absatz, item: f.item };
      expect(parseFussnoteHistorie(fn).ereignisse.some((e) => e.typ === 'aufgehoben' || e.typ === 'gegenstandslos'), f.wo).toBe(false);
      const { historie } = baueArtikelHistorie([fn]);
      expect(historie?.aufgehobenSeit, f.wo).toBeUndefined();
      expect(historie?.gegenstandslos, f.wo).toBeUndefined();
    }
  });

  it('auch OHNE Skopus-Marke (Kopf-Anker) entstünde daraus kein datiertes Aufhebungs-Ereignis — undatiert, keine Erfindung (§2)', () => {
    // Gegenprobe zur Grenze: wer die Fussnote an den Artikelkopf legt, bekommt trotzdem kein «aufgehobenSeit».
    const { historie } = baueArtikelHistorie([{ text: 'Dieser Art. ist heute aufgehoben.', links: [], absatz: null, item: null }]);
    expect(historie?.aufgehobenSeit).toBeUndefined();
  });
});

// ── #27 · «Gegenstandslos» ohne Datum wird durch eine SPÄTERE Fassung derselben Fussnote widerlegt ─────────────────
// Bisher widerlegte nur ein DATIERTES gegenstandslos (Vergleich der Daten, GP #1209 Hinweis, Korpus 0 Fälle). Ohne
// Datum fehlt der Vergleich; die Fussnote selbst ordnet aber amtlich chronologisch (ältester Eingriff zuerst, s.
// `baueArtikelHistorie`): folgt dem Vermerk INNERHALB DERSELBEN Fussnote eine Neufassung/Einfügung, lebt der Artikel
// wieder. Über Fussnoten hinweg ist die Reihenfolge nicht chronologisch — dort bleibt der Vermerk (§1/§8, kein Raten).
describe('P7 #27 · undatiertes «Gegenstandslos» + spätere Fassung in derselben Fussnote', () => {
  const fn = (text: string): FnEingang => ({ text, links: [], absatz: null, item: null });

  it('«Gegenstandslos. Fassung gemäss …, in Kraft seit …» ⇒ der Artikel lebt wieder: kein gegenstandslos', () => {
    const { historie } = baueArtikelHistorie([fn('Gegenstandslos. Fassung gemäss Ziff. I des BG vom 1. Jan. 2020, in Kraft seit 1. Jan. 2021 (AS 2020 1).')]);
    expect(historie?.gegenstandslos).toBeUndefined();
  });

  it('auch eine UNDATIERTE spätere Einfügung widerlegt (Reihenfolge, nicht Datum, trägt den Beleg)', () => {
    const { historie } = baueArtikelHistorie([fn('Gegenstandslos. Eingefügt durch Ziff. I des BG vom 1. Jan. 2020 (AS 2020 1).')]);
    expect(historie?.gegenstandslos).toBeUndefined();
  });

  it('Gegenprobe: «Fassung … 2019. Gegenstandslos.» (Vermerk ZULETZT) bleibt gegenstandslos ohne Datum', () => {
    const { historie } = baueArtikelHistorie([fn('Fassung gemäss Ziff. I des BG vom 1. Jan. 2018, in Kraft seit 1. Jan. 2019 (AS 2018 1). Gegenstandslos.')]);
    expect(historie?.gegenstandslos).toEqual({ seit: null });
  });

  it('Gegenprobe: eine Fassung in einer ANDEREN Fussnote ist nicht chronologisch einordenbar ⇒ Vermerk bleibt (OR SchlT 6-Form)', () => {
    const { historie } = baueArtikelHistorie([
      fn('Gegenstandslos.'),
      fn('Fassung gemäss Ziff. I des BG vom 1. Jan. 2020, in Kraft seit 1. Jan. 2021 (AS 2020 1).'),
    ]);
    expect(historie?.gegenstandslos).toEqual({ seit: null });
  });

  it('Gegenprobe: das DATIERTE gegenstandslos folgt weiter dem Datums-Vergleich (StGB 67f bleibt gegenstandslos seit 2018)', () => {
    const { historie } = baueArtikelHistorie([fn('Gegenstandslos gemäss Ziff. IV 1 des BG vom 19. Juni 2015, mit Wirkung seit 1. Jan. 2018 (AS 2016 1249).')]);
    expect(historie?.gegenstandslos).toEqual({ seit: '2018-01-01' });
  });
});
