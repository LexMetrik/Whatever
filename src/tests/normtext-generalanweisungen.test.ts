/**
 * W2·32-GENERALANWEISUNGEN — Anweisungen des Änderungserlasses als Artikel-Ereignis (5.10.2026).
 *
 * «Ersatz von Ausdrücken» (GTR Rz. 327–330) und die Neufassung eines Buches ändern den Körper eines Artikels, ohne dass am Artikel
 * eine Fussnote steht. `generalanweisungen.ts` führt sie als Daten (AS-Fundstelle, Link, In-Kraft-Datum, Artikelliste im Wortlaut);
 * `baueArtikelHistorie` nimmt sie wie Körper-Fussnoten in «Gilt seit» auf. Die Wortlaute der Listen sind aus den AS-Erlassen
 * (PDF-A der Amtlichen Sammlung, Abruf 5.10.2026); das Soll der Korpus-Sonden wurde je Artikel gegen die Fedlex-Konsolidierungen
 * (pdf-a, Stände 2000–2026) belegt: bibliothek/normtext/generalanweisungen-gilt-seit-2026-10-05.md.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { ANWEISUNGEN, anweisungsEreignisse, parseListe, tokenZuLabel } from '../lib/normtext/generalanweisungen';
import { baueArtikelHistorie, type FnEingang, type HistorieEreignis } from '../lib/normtext/historie-parse';
import type { HistorieShard } from '../lib/normtext/historie-laden';
import { lebenderText, tokenAusId } from '../../scripts/normtext/historie-aufgehoben-lebend';

const anw = (id: string) => ANWEISUNGEN.find((a) => a.id === id)!;
const ZGB_1999_1 = anw('ZGB-AS-1999-1118-richter-gericht');
const ZGB_1999_2 = anw('ZGB-AS-1999-1118-richterlich-gerichtlich');
const ZGB_1999_3 = anw('ZGB-AS-1999-1118-gewalt-sorge');
const ZGB_2011 = anw('ZGB-AS-2011-725-vormundschaftsbehoerde-kindesschutzbehoerde');
const OR_2020 = anw('OR-AS-2020-957-richter-gericht');
const OR_4005 = anw('OR-AS-2020-4005-richter-gericht');
const STGB_2006 = anw('STGB-AS-2006-3459-erstes-buch');
const liste = (a: typeof ZGB_1999_1) => ('liste' in a.umfang ? a.umfang.liste : '');

describe('parseListe · Artikelliste im AS-Wortlaut', () => {
  it('AS 1999 1118 Abs. 1: 88 Körper-Stellen, Absatz-/Ziffer-Angaben richtig zerlegt, «Randtitel von» zählt nicht', () => {
    const l = parseListe(liste(ZGB_1999_1));
    expect(l.koerper.size).toBe(88);
    expect(l.koerper.get('1')).toEqual({ absatz: '2', item: null });
    expect(l.koerper.get('4')).toEqual({ absatz: null, item: null }); // «Art. 1 Abs. 2, 4, 28 Abs. 1»: 4 ist ein Artikel, kein Absatz
    expect(l.koerper.get('28c')).toEqual({ absatz: '2 und 3', item: null });
    expect(l.koerper.get('28l')).toEqual({ absatz: '1–3', item: null }); // «Randtitel von Art. 28l und Art. 28l Abs. 1–3»
    expect(l.koerper.get('88')).toEqual({ absatz: '2', item: null });
    expect(l.koerper.get('166')).toEqual({ absatz: '2', item: '1' });
    expect(l.koerper.get('397e')).toEqual({ absatz: null, item: '1–4' });
    expect(l.koerper.get('808')).toEqual({ absatz: '1 und 2', item: null });
    expect(l.koerper.get('762')).toEqual({ absatz: null, item: null }); // «Randtitel von Art. 736, 762»: Randtitel gilt nur 736
    expect(l.nurRandtitel).toEqual(['736']);
    expect(l.schlusstitel).toEqual(['54']);
  });

  it('AS 1999 1118 Abs. 2 und 3: «richterlich» (5 Körper-Stellen, Randtitel 4/172 nur Randtitel), «Gewalt» (13, «383 Ziff. 3 und 385 Abs. 3» getrennt)', () => {
    const z2 = parseListe(liste(ZGB_1999_2));
    expect([...z2.koerper.keys()]).toEqual(['649a', '649b', '656', '712r', '966']);
    expect(z2.nurRandtitel).toEqual(['4', '172']);
    const z3 = parseListe(liste(ZGB_1999_3));
    expect(z3.koerper.size).toBe(13);
    expect(z3.koerper.get('311')).toEqual({ absatz: '1 und 2', item: null });
    expect(z3.koerper.get('383')).toEqual({ absatz: null, item: '3' }); // «Ziff. 3 und 385 Abs. 3»: 385 ist ein neuer Artikel
    expect(z3.koerper.get('385')).toEqual({ absatz: '3', item: null });
    expect(z3.nurRandtitel).toEqual([]);
  });

  it('AS 2011 725 (24) und AS 2020 957 (38, Schreibweise «Absatz/Absätze/Ziffer»): Komma-Listen im Plural, «und» schliesst die Gruppe', () => {
    const z = parseListe(liste(ZGB_2011));
    expect(z.koerper.size).toBe(24);
    expect(z.koerper.get('179')).toEqual({ absatz: '1', item: null }); // «zweiter Teilsatz» ist kein Artikel
    expect(z.koerper.get('309')).toEqual({ absatz: null, item: null });
    const o = parseListe(liste(OR_2020));
    expect(o.koerper.size).toBe(38);
    expect(o.koerper.get('903')).toEqual({ absatz: '2, 4 und 5', item: null }); // «Absätze 2, 4 und 5, 904 Absatz 3»
    expect(o.koerper.get('904')).toEqual({ absatz: '3', item: null });
    expect(o.koerper.get('731b')).toEqual({ absatz: '1–3', item: null }); // Bis-Strich U+2013 wie U+2212
    expect(o.koerper.get('577')).toEqual({ absatz: null, item: null }); // «Randtitel und Text»: Körper ganz
    expect(o.koerper.get('716a')).toEqual({ absatz: '1', item: '7' });
    expect(o.koerper.get('918')).toEqual({ absatz: '2', item: null }); // «Absatz 2 und 924 Absatz 2»
    expect(o.koerper.get('924')).toEqual({ absatz: '2', item: null });
  });

  it('StGB-Neufassung: die 127 Artikelüberschriften des ersten Buches; später eingefügte Artikel (66a–d, 67c–f, 79a/b, 92a, 55a) stehen nicht darin', () => {
    const l = parseListe(liste(STGB_2006));
    expect(l.koerper.size).toBe(127);
    for (const a of ['1', '52', '62d', '67b', '110']) expect(l.koerper.has(a), a).toBe(true);
    for (const a of ['55a', '66a', '66b', '66c', '66d', '67c', '67d', '67e', '67f', '79a', '79b', '92a']) expect(l.koerper.has(a), a).toBe(false);
  });

  it('AS 2020 4005: «Randtitel» allein / «Randtitel und Absätze 1 und 3» / «Randtitel und Text», «Buchstabe d», «Gliederungstitel vor den Artikeln»', () => {
    const o = parseListe(liste(OR_4005));
    expect(o.koerper.size).toBe(43);
    expect(o.koerper.get('941a')).toEqual({ absatz: '1 und 3', item: null }); // «Randtitel und Absätze 1 und 3»
    expect(o.koerper.get('1080')).toEqual({ absatz: '1', item: null });
    expect(o.koerper.get('1162')).toEqual({ absatz: '3 und 4', item: null }); // «… sowie Artikel 1182»
    expect(o.koerper.get('1182')).toEqual({ absatz: null, item: null });
    expect(o.koerper.get('1072')).toEqual({ absatz: null, item: null }); // «1072, 1073, 1075»: ganze Artikel
    const r = parseListe('858 Randtitel, 859 Absätze 1–3, 861 Randtitel und Absätze 1‒3');
    expect(r.nurRandtitel).toEqual(['858']);
    expect(r.koerper.get('861')).toEqual({ absatz: '1–3', item: null });
    const f = parseListe('Gliederungstitel vor den Artikeln 9, 32 und 57 sowie Artikel 11, 16 Absatz 1 Buchstabe d, 80 und 89');
    expect(f.nurGliederungstitel).toEqual(['9', '32', '57']);
    expect([...f.koerper.keys()]).toEqual(['11', '16', '80', '89']);
    expect(f.koerper.get('16')).toEqual({ absatz: '1', item: 'd' });
  });

  it('wirft bei unbekanntem Stück statt still zu raten (§8)', () => {
    expect(() => parseListe('Art. 1 Abs. 2, Beispiel')).toThrow(/Artikelnummer erwartet/);
    expect(() => parseListe('Art. 1 Abs. x')).toThrow(/Nummer erwartet/);
  });
});

describe('anweisungsEreignisse · Ereignis je Artikel', () => {
  it('ZGB 299: ein Ereignis «Gewalt» → «Sorge», 1.1.2000, AS 1999 1118 mit amtlichem Link', () => {
    const t = anweisungsEreignisse('ZGB', '299');
    expect(t).toHaveLength(1);
    expect(t[0].ueberschriftVorbehalt).toBe(false);
    expect(t[0].ereignis).toEqual({
      typ: 'ausdruck', datum: '2000-01-01', wirkung: false, absatz: null, item: null, anweisung: '«Gewalt» → «Sorge»',
      quellen: [{ label: 'AS 1999 1118', url: 'https://fedlex.data.admin.ch/eli/oc/1999/149' }],
    });
  });

  it('ZGB 288 nennt beide Anweisungen: chronologisch 2000 (Richter → Gericht) vor 2013 (Kindesschutzbehörde), je mit Absatz/Ziffer', () => {
    const t = anweisungsEreignisse('ZGB', '288').map((x) => x.ereignis);
    expect(t.map((e) => [e.datum, e.absatz, e.item, e.quellen[0].label])).toEqual([
      ['2000-01-01', '2', '1', 'AS 1999 1118'],
      ['2013-01-01', '2', '1', 'AS 2011 725'],
    ]);
  });

  it('Token «28_a» trifft Label «28a»; nur-Randtitel (ZGB 736), Schlusstitel und Bereichs-Token ohne Ereignis', () => {
    expect(anweisungsEreignisse('ZGB', '28_a')).toHaveLength(1);
    expect(anweisungsEreignisse('ZGB', '736')).toEqual([]);
    expect(anweisungsEreignisse('ZGB', 'disp_u1_art_54')).toEqual([]);
    expect(anweisungsEreignisse('ZGB', '28_d_28_f')).toEqual([]);
    expect(tokenZuLabel('652_c')).toBe('652c');
  });

  it('ZGB 172: «Randtitel von Art. 172» (Abs. 2) UND Körper (Abs. 1) ⇒ genau EIN Körper-Ereignis (Randtitel zählt nicht)', () => {
    expect(anweisungsEreignisse('ZGB', '172').map((x) => x.ereignis.anweisung)).toEqual(['«der Richter» → «das Gericht»']);
  });

  it('Text-Prüfung: trägt der heutige Text den Ersatzausdruck nicht mehr (ZGB 410, Erwachsenenschutz 2013), entfällt das Ereignis', () => {
    expect(anweisungsEreignisse('ZGB', '410', 'Der Beistand führt Rechnung und legt sie der Erwachsenenschutzbehörde vor.')).toEqual([]);
    expect(anweisungsEreignisse('ZGB', '410', 'Das Gericht prüft die Rechnung.')).toHaveLength(1);
    expect(anweisungsEreignisse('ZGB', '410')).toHaveLength(1); // ohne Text (Unit-Fälle) keine Prüfung
  });

  it('`ausser`: ZGB 430 (Wortlaut seit 2013, Abteilungs-Fussnote) trägt kein Ereignis, auch wenn der Text den Stamm enthält; OR 565 (Wortlaut seit 2023) nur das von AS 2020 4005, nicht das von AS 2020 957', () => {
    expect(anweisungsEreignisse('ZGB', '430', 'Das Gericht …')).toEqual([]);
    const o565 = anweisungsEreignisse('OR', '565', 'gerichtliche …').map((x) => x.ereignis);
    expect(o565.map((e) => [e.datum, e.quellen[0].label])).toEqual([['2023-01-01', 'AS 2020 4005']]);
    expect(ZGB_1999_1.ausser?.map((x) => x.artikel)).toEqual(['430']);
    expect(OR_2020.ausser?.map((x) => x.artikel)).toEqual(['565']);
  });

  it('AS 2020 4005 (Aktienrecht, 1.1.2023): Richter/Reinertrag/Zwischenbilanzen als Ereignis; wo AS 2020 957 schon am 1.1.2021 ersetzt hat, trägt Abs. 1 keine Wirkung (`ausser`)', () => {
    // OR 743: Absatz 2 «Richter» (schon 2021 «Gericht» → ausser) UND Absatz 5 «Zwischenbilanzen» → «Zwischenabschlüsse» (2023): je EIN Ereignis
    expect(anweisungsEreignisse('OR', '743', 'Zwischenabschlüsse … Gericht').map((x) => [x.ereignis.datum, x.ereignis.quellen[0].label, x.ereignis.absatz])).toEqual([
      ['2021-01-01', 'AS 2020 957', '2'],
      ['2023-01-01', 'AS 2020 4005', '5'],
    ]);
    expect(anweisungsEreignisse('OR', '860', 'Jahresgewinn').map((x) => [x.ereignis.datum, x.ereignis.anweisung, x.ereignis.absatz])).toEqual([['2023-01-01', '«Reinertrag» → «Jahresgewinn»', '1']]);
    expect(anweisungsEreignisse('OR', '858', 'Jahresgewinn')).toEqual([]); // nur Randtitel
    expect(anweisungsEreignisse('OR', '981', 'durch das Gericht').map((x) => x.ereignis.datum)).toEqual(['2023-01-01']);
    expect(anweisungsEreignisse('OR', '706', 'Gericht').map((x) => x.ereignis.datum)).toEqual(['2021-01-01']); // Abs. 1 von 4005 ohne Wirkung
    expect(OR_4005.ausser?.length).toBe(24);
  });

  it('AS 2020 4005 FusG: «Zwischenbilanz» → «Zwischenabschluss» in Artikeln mit lit. d; Gliederungstitel zählen nicht', () => {
    for (const t of ['16', '41', '63']) expect(anweisungsEreignisse('FUSG', t, 'ein Zwischenabschluss')[0].ereignis).toMatchObject({ datum: '2023-01-01', absatz: '1', item: 'd', anweisung: '«Zwischenbilanz» → «Zwischenabschluss»' });
    expect(anweisungsEreignisse('FUSG', '80', 'Zwischenabschluss').map((x) => x.ereignis.absatz)).toEqual([null]);
    for (const t of ['9', '32', '57']) expect(anweisungsEreignisse('FUSG', t, 'Zwischenabschluss')).toEqual([]);
  });

  it('«Im ganzen Erlass» (PATG «Institut» → «IGE»): nur mit heutigem Text «IGE», nur echte Artikel, mit Überschrift-Vorbehalt', () => {
    const t = anweisungsEreignisse('PATG', '110', 'Die Anmeldung wird dem IGE übermittelt.');
    expect(t).toHaveLength(1);
    expect(t[0].ueberschriftVorbehalt).toBe(true);
    expect(t[0].ereignis).toMatchObject({ typ: 'ausdruck', datum: '2017-01-01', anweisung: '«Institut» → «IGE»', absatz: null });
    expect(anweisungsEreignisse('PATG', '110', 'Das Institut …')).toEqual([]);
    expect(anweisungsEreignisse('PATG', '110')).toEqual([]);
    expect(anweisungsEreignisse('PATG', 'disp_u1_art_146', 'IGE')).toEqual([]);
    expect(anweisungsEreignisse('PATG', '140_a', 'des IGE')).toHaveLength(1);
    expect(anweisungsEreignisse('PATG', '110', 'BIGE')).toEqual([]); // Wortgrenze
  });

  it('StGB: jeder Artikel der AS-Liste bekommt «Neufassung 1.1.2007», später eingefügte (67e) nicht', () => {
    const t = anweisungsEreignisse('STGB', '52');
    expect(t).toHaveLength(1);
    expect(t[0].ereignis).toMatchObject({ typ: 'fassung', datum: '2007-01-01', anweisung: 'Erstes Buch: Allgemeine Bestimmungen neu gefasst' });
    expect(t[0].ereignis.quellen).toEqual([{ label: 'AS 2006 3459', url: 'https://fedlex.data.admin.ch/eli/oc/2006/549' }]);
    expect(anweisungsEreignisse('STGB', '67_e')).toEqual([]);
    expect(anweisungsEreignisse('STGB', '111')).toEqual([]);
  });

  it('Register: jede Anweisung trägt Fundstelle, Link auf fedlex.data.admin.ch, Beleg, ISO-Datum und Abrufdatum (§7 a–c)', () => {
    expect(ANWEISUNGEN.length).toBe(11);
    for (const a of ANWEISUNGEN) {
      expect(a.as, a.id).toMatch(/^AS \d{4} \d+$/);
      expect(a.eli, a.id).toMatch(/^https:\/\/fedlex\.data\.admin\.ch\/eli\/oc\/\d{4}\/\d+$/);
      expect(a.inKraft, a.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(a.abgerufen, a.id).toBe('2026-10-05');
      expect(a.beleg.length, a.id).toBeGreaterThan(40);
    }
  });
});

describe('baueArtikelHistorie · Anweisungen als Ereignis', () => {
  const fn = (text: string, extra: Partial<FnEingang> = {}): FnEingang => ({ nr: '1', text, links: [], absatz: null, item: null, ...extra });
  const F1978 = 'Fassung gemäss Ziff. I 1 des BG vom 25. Juni 1976, in Kraft seit 1. Jan. 1978 (AS 1977 237; BBl 1974 II 1).';
  const F2018 = 'Fassung gemäss Ziff. I des BG vom 16. Juni 2016, in Kraft seit 1. Jan. 2018 (AS 2017 3699).';
  const treffer = (erlass: string, token: string, text?: string) => anweisungsEreignisse(erlass, token, text);

  it('ZGB 299-Form: Fassung 1978 + Randtitel 2018 + Anweisung 2000 ⇒ «Gilt seit» 2000, Zeitleiste chronologisch (1978, 2000, Randtitel 2018)', () => {
    const h = baueArtikelHistorie([fn(F1978), fn(F2018, { sektion: 'Asexies. Stiefeltern' })], {
      geteilteUeberschriften: new Set(['Asexies. Stiefeltern']),
      anweisungen: treffer('ZGB', '299'),
    }).historie!;
    expect(h.giltSeit).toBe('2000-01-01');
    expect(h.ereignisse.map((e) => [e.datum, e.ueberschrift ?? null, e.anweisung ?? null])).toEqual([
      ['1978-01-01', null, null],
      ['2000-01-01', null, '«Gewalt» → «Sorge»'],
      ['2018-01-01', 'Asexies. Stiefeltern', null],
    ]);
  });

  it('ein jüngeres Fussnoten-Ereignis gewinnt (Maximum): Anweisung 2000, Fassung 2013 ⇒ 2013', () => {
    const h = baueArtikelHistorie([fn(F1978), fn(F2018.replace('2018', '2013').replace('2017 3699', '2011 725'))], { anweisungen: treffer('ZGB', '299') }).historie!;
    expect(h.giltSeit).toBe('2013-01-01');
    expect(h.ereignisse.map((e) => e.datum)).toEqual(['1978-01-01', '2000-01-01', '2013-01-01']);
  });

  it('Artikel ohne jede Fussnote (StGB-Form) bekommt einen Historie-Eintrag allein aus der Anweisung', () => {
    const r = baueArtikelHistorie([], { anweisungen: treffer('STGB', '1') });
    expect(r.historie?.giltSeit).toBe('2007-01-01');
    expect(r.historie?.ereignisse).toHaveLength(1);
  });

  it('amtlich aufgehobener Artikel (Text-Shard): keine Anweisung, kein «Gilt seit»', () => {
    const r = baueArtikelHistorie([], { anweisungen: treffer('STGB', '1'), snapshotAufgehoben: true });
    expect(r.historie).toBeNull();
  });

  it('Überschrift-Vorbehalt («Im ganzen Erlass»): ein JÜNGERES Überschrift-Ereignis (geerbt oder eigen) streicht das Ereignis; ein älteres nicht', () => {
    const t = treffer('PATG', '140_o', 'des IGE');
    const jung = fn('Fassung gemäss Ziff. I des BG vom 18. Juni 2018, in Kraft seit 1. Jan. 2019 (AS 2018 3575).', { sektion: '2. Abschnitt: Verlängerung' });
    const alt = fn('Fassung gemäss Ziff. I des BG vom 18. Juni 2008, in Kraft seit 1. Jan. 2009 (AS 2008 1).', { sektion: '2. Abschnitt: Verlängerung' });
    // geerbt (Träger-Fussnote an einem früheren Artikel)
    expect(baueArtikelHistorie([], { geerbt: [jung], anweisungen: t }).historie?.giltSeit ?? null).toBeNull();
    expect(baueArtikelHistorie([], { geerbt: [jung], anweisungen: t }).historie?.ereignisse.some((e) => e.anweisung)).toBe(false);
    // eigen (Träger-Artikel)
    expect(baueArtikelHistorie([jung], { anweisungen: t }).historie?.ereignisse.some((e) => e.anweisung)).toBe(false);
    // älter als die Anweisung: bleibt
    const ok = baueArtikelHistorie([], { geerbt: [alt], anweisungen: t }).historie!;
    expect(ok.giltSeit).toBe('2017-01-01');
    // genannte Artikel (`liste`, kein Vorbehalt): auch mit jüngerer Überschrift datiert (ZGB 299-Form, Randtitel 2018)
    expect(baueArtikelHistorie([fn(F2018, { sektion: 'Asexies. Stiefeltern' })], { anweisungen: treffer('ZGB', '299') }).historie?.giltSeit).toBe('2000-01-01');
  });

  it('Ereignis-Typen: «ausdruck» und «fassung» aus Anweisungen gehen in «giltSeit» ein, tragen aber nie `ueberschrift`', () => {
    const e: HistorieEreignis[] = [...treffer('ZGB', '299'), ...treffer('STGB', '1')].map((x) => x.ereignis);
    for (const x of e) expect(x.ueberschrift).toBeUndefined();
  });
});

// ── Korpus (committete Shards) ──────────────────────────────────────────────────────────────────────────────────────
const lade = (erlass: string) => JSON.parse(readFileSync(`public/normtext/historie/${erlass}.json`, 'utf8')) as HistorieShard;
const text = (erlass: string) =>
  JSON.parse(readFileSync(`public/normtext/bund/${erlass}.json`, 'utf8')) as { eintraege: Array<{ id: string; bloecke?: []; aufgehoben?: boolean | null }> };

describe('Korpus · «Gilt seit» der Artikel aus W2·32 (Soll gegen die Fedlex-Konsolidierungen belegt)', () => {
  // [Erlass, Token, Soll, Herkunft]. Soll je Artikel: erster Konsolidierungsstand (pdf-a), dessen Wortlaut dem heutigen entspricht,
  // bzw. — vor dem frühesten Stand (ZGB/OR/LFG 1.1.2000, PATG 1.1.2001, VWVG 1.3.2000) — das Fussnoten-Datum.
  const SOLL: Array<[string, string, string]> = [
    // Anweisung AS 1999 1118 (1.1.2000): Fussnote am Artikel nennt nur 1978/1985/2007 bzw. gar keine
    ['ZGB', '28_a', '2000-01-01'], ['ZGB', '299', '2000-01-01'], ['ZGB', '300', '2000-01-01'], ['ZGB', '313', '2000-01-01'],
    // Anweisung AS 2011 725 (1.1.2013)
    ['ZGB', '287', '2013-01-01'], ['ZGB', '288', '2013-01-01'], ['ZGB', '307', '2013-01-01'], ['ZGB', '310', '2013-01-01'], ['ZGB', '316', '2013-01-01'],
    ['ZGB', '320', '2013-01-01'], ['ZGB', '322', '2013-01-01'], ['ZGB', '324', '2013-01-01'], ['ZGB', '325', '2013-01-01'],
    // Fussnoten-Datum gilt (Entscheid-A-Proxy zurückgebaut): 12 «zurückzubringende» + 11 «ungeprüfte» Daten
    ['ZGB', '28_g', '1985-07-01'], ['ZGB', '85', '2006-01-01'], ['ZGB', '86', '2006-01-01'], ['ZGB', '255', '2000-01-01'], ['ZGB', '256', '2013-01-01'],
    ['ZGB', '286', '2000-01-01'], ['ZGB', '303', '1978-01-01'], ['ZGB', '304', '2013-01-01'],
    ['OR', '640', '2008-01-01'], ['OR', '652_c', '1992-07-01'], ['OR', '652_f', '2008-01-01'], ['OR', '677', '1992-07-01'], ['OR', '679', '2014-01-01'], // Abs. 2 aufgehoben (AS 2013 4111, 1.1.2014): Teilaufhebung zählt (R2-02)
    ['OR', '631', '2023-01-01'], // Generalanweisung AS 2020 4005 + Teilaufhebung; siehe Bibliothek-Doku
    ['NHG', '3', '2014-09-01'], // Abs. teilaufgehoben (Teilaufhebung zählt)
    ['OR', '706_b', '1992-07-01'], ['OR', '709', '1992-07-01'], ['OR', '717', '1992-07-01'], ['OR', '721', '1992-07-01'],
    ['OR', '706', '2021-01-01'], // Anweisung AS 2020 957 (Richter → Gericht, 1.1.2021); Fussnote nur 1992/2008
    ['PATG', '36', '1995-07-01'], ['PATG', '50', '1978-01-01'],
    ['PATG', '110', '2017-01-01'], // Anweisung AS 2015 3631 («Institut» → «IGE», 1.1.2017)
    ['STGB', '355_b', '2006-04-01'], ['LFG', '37_u', '2018-01-01'], ['VWVG', '76', '1992-02-15'],
    // Nachzug Gegenprüfung 5.10.2026 (B1): AS 2020 4005 Ziff. I «Ersatz von Ausdrücken», in Kraft 1.1.2023 (AS 2022 109). Soll je Artikel am Text
    // belegt (Fedlex-Konsolidierung AKN-XML 1.1.2022 «Richter»/«Reinertrag»/«Zwischenbilanzen» → 1.1.2023 «Gericht»/«Jahresgewinn»/«Zwischenabschlüsse»)
    ['OR', '743', '2023-01-01'], ['OR', '860', '2023-01-01'], ['OR', '981', '2023-01-01'], ['OR', '1072', '2023-01-01'], ['OR', '565', '2023-01-01'],
    ['OR', '859', '2023-01-01'], ['OR', '861', '2023-01-01'], ['OR', '863', '2023-01-01'], ['OR', '1182', '2023-01-01'],
    ['OR', '928_c', '2022-01-01'], ['OR', '973_c', '2021-02-01'], // Konsolidierung 1.1.2022 = 1.1.2023: AS 2020 4005 ändert den Wortlaut nicht
    ['FUSG', '16', '2023-01-01'], ['FUSG', '41', '2023-01-01'], ['FUSG', '63', '2023-01-01'], ['FUSG', '80', '2023-01-01'], ['FUSG', '89', '2023-01-01'],
    ['STGB', '52', '2007-01-01'], // Neufassung erstes Buch AS 2006 3459; die Sachüberschrift-Fussnote 2004 änderte nur den Randtitel (AS 2004 1403)
  ];

  it.each(SOLL)('%s Art. %s: «Gilt seit» %s', (erlass, token, soll) => {
    expect(lade(erlass).artikel[token]?.giltSeit).toBe(soll);
  });

  it('ZGB 299/300/310/28a: Zeitleiste trägt Anweisung UND Randtitel-Eingriff (Randtitel zählt nicht, bleibt aber sichtbar)', () => {
    const z = lade('ZGB');
    for (const t of ['299', '300', '310', '28_a']) {
      const e = z.artikel[t].ereignisse;
      expect(e.some((x) => x.anweisung && !x.ueberschrift), t).toBe(true);
      expect(e.some((x) => x.ueberschrift && x.datum && x.datum > '2000-12-31'), t).toBe(true);
    }
  });

  it('bewusst OHNE Anweisungs-Ereignis: ZGB 430 (`ausser`), OR 565 (nur von AS 2020 957 aus; `ausser`), ZGB 410/368/383/385/860/864 (Text trägt den Ersatzausdruck nicht mehr), PATG 140n–v (jüngere Überschrift), STGB 67e/67f/66a', () => {
    const hat = (erlass: string, t: string) => lade(erlass).artikel[t]?.ereignisse.some((e) => e.anweisung) ?? false;
    for (const t of ['430', '410', '368', '383', '385', '860', '864']) expect(hat('ZGB', t), `ZGB ${t}`).toBe(false);
    const hat957 = (t: string) => lade('OR').artikel[t]?.ereignisse.some((e) => e.anweisung && e.quellen[0].label === 'AS 2020 957') ?? false;
    expect(hat957('565')).toBe(false); // «richterliche» → «gerichtliche» erst durch AS 2020 4005 (2023); `ausser` der 957-Zeile
    for (const t of ['140_n', '140_o', '140_p', '140_r', '140_s', '140_t', '140_v']) expect(hat('PATG', t), `PATG ${t}`).toBe(false);
    for (const t of ['67_e', '67_f', '66_a']) expect(hat('STGB', t), `STGB ${t}`).toBe(false);
  });

  it('Invariante: jedes Anweisungs-Ereignis stimmt in Datum, Fundstelle und Link mit dem Register überein und wird ein «Gilt seit»-Beitrag (kein `ueberschrift`)', () => {
    const nachAs = new Map(ANWEISUNGEN.map((a) => [`${a.erlass}|${a.as}`, a]));
    const zaehl: Record<string, number[]> = {};
    for (const erlass of ['ZGB', 'OR', 'PATG', 'STGB', 'FUSG']) {
      let artikel = 0;
      let ereignisse = 0;
      for (const [token, a] of Object.entries(lade(erlass).artikel)) {
        const evs = a.ereignisse.filter((x) => x.anweisung);
        if (evs.length) artikel++;
        for (const e of evs) {
          ereignisse++;
          const reg = nachAs.get(`${erlass}|${e.quellen[0].label}`)!;
          expect(reg, `${erlass} ${token}`).toBeDefined();
          expect(e.datum, `${erlass} ${token}`).toBe(reg.inKraft);
          expect(e.quellen[0].url, `${erlass} ${token}`).toBe(reg.eli);
          expect(e.ueberschrift, `${erlass} ${token}`).toBeUndefined();
        }
      }
      zaehl[erlass] = [artikel, ereignisse];
    }
    // Stand 5.10.2026 (Artikel, Ereignisse): ZGB 89/94 (88+5+13+24 genannte Stellen, minus aufgehobene/zusammengelegte/Text-Prüfung/ausser),
    // OR 33/33, PATG 41/41 («IGE» im Text, ohne jüngere Überschrift), STGB 121/121 (127 der AS-Liste, 6 heute nicht im Korpus).
    // Nachzug 5.10.2026: OR + AS 2020 4005 (22 Artikel mit Ereignis, 23 Ereignisse), FUSG 8/8.
    expect(zaehl).toEqual({ ZGB: [89, 94], OR: [55, 56], PATG: [41, 41], STGB: [121, 121], FUSG: [8, 8] });
  });

  it('Tripwire Register ↔ Korpus: jede genannte Stelle ist ein Ereignis ODER hat einen belegten Grund (nicht im Korpus, aufgehoben, `ausser`, Stamm fehlt)', () => {
    for (const a of ANWEISUNGEN) {
      if (!('liste' in a.umfang)) continue;
      const doc = text(a.erlass);
      const shard = lade(a.erlass);
      const nachLabel = new Map(doc.eintraege.map((e) => [tokenZuLabel(tokenAusId(e.id)), e]));
      const stellen = parseListe(a.umfang.liste).koerper;
      let ohne = 0;
      for (const label of stellen.keys()) {
        const e = nachLabel.get(label);
        const token = e ? tokenAusId(e.id) : '';
        const ausdruck = a.art === 'ausdruck' ? `«${a.alt}» → «${a.neu}»` : null;
        const hat = !!e && (shard.artikel[token]?.ereignisse.some((x) => x.anweisung && x.quellen[0].label === a.as && (ausdruck === null || x.anweisung === ausdruck)) ?? false);
        if (hat) continue;
        const belegt = a.ausser?.some((x) => x.artikel === label) ?? false; // `ausser` trägt je Artikel einen amtlichen Beleg (kein Zähl-Limit)
        if (!belegt) ohne++;
        const grund =
          !e || e.aufgehoben === true || belegt ||
          (!!a.stamm && !lebenderText(e).toLowerCase().includes(a.stamm));
        expect(grund, `${a.id} «${label}» hat weder Ereignis noch Grund`).toBe(true);
      }
      // Die Ausnahmen sind klein: höchstens ein Viertel der genannten Artikel (STGB: die Liste nennt auch Artikel, die heute
      // aufgehoben/zusammengelegt sind — 37–39, 42–44 u. a.).
      expect(ohne, a.id).toBeLessThanOrEqual(Math.ceil(stellen.size * 0.4));
    }
  });

  it('PATG: «Institut» → «IGE» datiert jeden PATG-Artikel, dessen Text «IGE» trägt und der älter ist (n = 38 mit Ereignis); Schlussbestimmungen nie', () => {
    const doc = text('PATG');
    const shard = lade('PATG');
    let mit = 0;
    for (const e of doc.eintraege) {
      const token = tokenAusId(e.id);
      const hat = shard.artikel[token]?.ereignisse.some((x) => x.anweisung) ?? false;
      if (hat) mit++;
      if (!/^\d+(?:_[a-z]+)*$/.test(token)) expect(hat, token).toBe(false);
    }
    expect(mit).toBeGreaterThanOrEqual(35);
    expect(shard.artikel['15'].giltSeit).toBe('2017-01-01'); // Fussnote 1978, Wortlaut «IGE» seit 2017
    expect(shard.artikel['4'].giltSeit).toBe('2017-01-01');
  });

  it('STGB erstes Buch: jeder Artikel aus der AS-Liste, der heute lebt und nicht neuer gefasst wurde, gilt seit 1.1.2007; keiner davor', () => {
    const shard = lade('STGB');
    let n = 0;
    for (const [token, a] of Object.entries(shard.artikel)) {
      const nr = /^\d+/.test(token) ? parseInt(token, 10) : 999;
      if (nr > 110 || !/^\d+(?:_[a-z]+)*$/.test(token)) continue;
      if (a.giltSeit) expect(a.giltSeit >= '2007-01-01', `STGB ${token}`).toBe(true);
      if (a.ereignisse.some((x) => x.anweisung)) n++;
    }
    expect(n).toBeGreaterThanOrEqual(80);
  });
});

describe('Teilaufhebung zählt für «Gilt seit» (OR 631/679, W2·32, 5.10.2026)', () => {
  const fussnote = (text: string, absatz: string): FnEingang => ({ nr: '1', text, links: [], absatz, item: null });
  it('aufgehobener Absatz eines weiterlebenden Artikels datiert «Gilt seit» (jünger als die Fassung)', () => {
    const h = baueArtikelHistorie([
      fussnote('Fassung gemäss Ziff. I 3 des BG vom 16. Dez. 2005, in Kraft seit 1. Jan. 2008 (AS 2007 4791; BBl 2002 3148).', '1'),
      fussnote('Aufgehoben durch Ziff. I des BG vom 19. Juni 2020 (Aktienrecht), mit Wirkung seit 1. Jan. 2023 (AS 2020 4005; BBl 2017 399).', '2'),
    ]).historie!;
    expect(h.giltSeit).toBe('2023-01-01');
  });
  it('eine ältere Aufhebung verdrängt eine jüngere Fassung nicht', () => {
    const h = baueArtikelHistorie([
      fussnote('Aufgehoben durch Ziff. I des BG vom 1. Jan. 1990, in Kraft seit 1. Jan. 1991 (AS 1990 99).', '2'),
      fussnote('Fassung gemäss Ziff. I des BG vom 1. Jan. 2000, in Kraft seit 1. Jan. 2001 (AS 2000 99).', '1'),
    ]).historie!;
    expect(h.giltSeit).toBe('2001-01-01');
  });
});
