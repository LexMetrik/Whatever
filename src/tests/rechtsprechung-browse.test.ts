import { describe, it, expect } from 'vitest';
import {
  themaText, regesteLeitsatz, synthThema, istSynth, istBetreff, normLabel, istBge, hauptIdentitaet,
  nachRelevanz, nachDatum, nachGericht, sortiere, gruppiereNachLeit, gruppiereNachInstanz,
  zaehleSachgebiete, normHaeufigkeit, richterHaeufigkeit, filterEntscheide, filterNachNorm,
} from '../lib/rechtsprechung/browse';
import type { BrowseEntscheid } from '../lib/rechtsprechung/register';

function be(p: Partial<BrowseEntscheid>): BrowseEntscheid {
  return {
    key: 'bund/bger/x', gericht: 'bger', gerichtName: 'Bundesgericht', gerichtstyp: 'bundesgericht',
    kanton: 'CH', nummer: '1C_1/2025', bgeReferenz: null, datum: '2025-01-01',
    zitierung: 'BGer 1C_1/2025 vom 1. Januar 2025', leitcharakter: 'routine',
    regesteVorhanden: false, regesteKurz: null, sachgebiet: 'oeffentlich', sprache: 'de',
    normKeys: [], bestand: 'snapshot', kuratierung: 'maschinell', datei: 'bund/bger/x.json',
    quelle: 'opencaselaw', quelleUrl: 'https://x',
    ...p,
  };
}

describe('normLabel', () => {
  it('lässt Erlass-Kürzel unverändert', () => {
    expect(normLabel('OR')).toBe('OR');
    expect(normLabel('ZPO')).toBe('ZPO');
  });
  it('zerlegt Artikel-Keys in lesbare Form', () => {
    expect(normLabel('OR-336')).toBe('OR Art. 336');
    expect(normLabel('BGG_90')).toBe('BGG Art. 90');
  });
  // LM-102/LM-106: die normKeys sind build-time versal (Schlüssel, kein
  // Anzeigetext). Die Anzeige führt die amtliche Schreibweise aus dem
  // ERLASS_REGISTER (§5/§7) — inkl. Umlaut, der beim Key verlorenging.
  it('stellt die amtliche Schreibweise aus dem Register her', () => {
    expect(normLabel('SCHKG')).toBe('SchKG');
    expect(normLabel('STGB')).toBe('StGB');
    expect(normLabel('STPO')).toBe('StPO');
    expect(normLabel('ASYLG')).toBe('AsylG');
    expect(normLabel('VWVG')).toBe('VwVG');
  });
  it('holt den Umlaut des amtlichen Kürzels zurück (LUGUE → LugÜ)', () => {
    expect(normLabel('LUGUE')).toBe('LugÜ');
  });
  it('nimmt den Register-Eintrag vor der Artikel-Zerlegung (BVV_2 ist ein Erlass, kein Art. 2)', () => {
    expect(normLabel('BVV_2')).toBe('BVV 2');
  });
  it('mappt auch den Erlass-Teil eines Artikel-Keys', () => {
    expect(normLabel('SCHKG-88')).toBe('SchKG Art. 88');
  });
  it('zeigt einen unbekannten Key unverändert (§8: keine Schreibweise erfinden)', () => {
    expect(normLabel('GIBTSNICHT')).toBe('GIBTSNICHT');
  });
});

describe('themaText / synthThema / istSynth', () => {
  it('nimmt die amtliche Regeste, wenn vorhanden', () => {
    const e = be({ regesteKurz: 'Bauhandwerkerpfandrecht', regesteVorhanden: true, normKeys: ['ZGB'] });
    expect(themaText(e)).toBe('Bauhandwerkerpfandrecht');
    expect(istSynth(e)).toBe(false);
  });
  it('regesteLeitsatz strippt den vorangestellten Artikel-Block', () => {
    expect(regesteLeitsatz('Art. 88 Abs. 2, Art. 265a Abs. 1 und 4 SchKG; Verfahren betreffend Feststellung neuen Vermögens. Während des Verfahrens steht die Frist still.'))
      .toBe('Verfahren betreffend Feststellung neuen Vermögens.');
  });
  it('regesteLeitsatz überspringt mehrere Artikel-Gruppen', () => {
    expect(regesteLeitsatz('Art. 16 DBG; Art. 34b BPG; Art. 337c OR; steuerliche Behandlung einer Entschädigung. Die Entschädigung ist steuerbar.'))
      .toBe('Steuerliche Behandlung einer Entschädigung.');
  });
  it('regesteLeitsatz lässt einen reinen Schlagwort-Leitsatz unverändert', () => {
    expect(regesteLeitsatz('Bauhandwerkerpfandrecht')).toBe('Bauhandwerkerpfandrecht');
  });
  it('themaText führt mit dem Leitsatz, nicht mit dem Artikel-Block', () => {
    const e = be({ regesteKurz: 'Art. 8 ZGB; Beweislast bei der Vaterschaft. Der Kläger trägt die Beweislast.', regesteVorhanden: true, normKeys: ['ZGB'] });
    expect(themaText(e)).toBe('Beweislast bei der Vaterschaft.');
  });
  // BS-Tranche §7.2/§8 (Block-B-Kontrakt): regesteKurz OHNE regesteVorhanden =
  // amtlicher Betreff/Titel — verbatim führen, nie leitsatz-strippen (er ist
  // keine Regeste; ein normzitat-führender Betreff würde sonst verstümmelt).
  it('istBetreff: Betreff-Titel (regesteVorhanden=false) wird erkannt und verbatim geführt', () => {
    const rk = 'Art. 132 ZPO. Kostenerlass für die Kindesvertretung';
    const e = be({ regesteKurz: rk, quelle: 'gerichte-bs' });
    expect(istBetreff(e)).toBe(true);
    expect(istSynth(e)).toBe(false);
    expect(themaText(e)).toBe(rk);
  });
  it('istBetreff ist false bei echter Regeste und bei Synth-Fällen', () => {
    expect(istBetreff(be({ regesteKurz: 'Mietzins', regesteVorhanden: true }))).toBe(false);
    expect(istBetreff(be({ regesteKurz: null }))).toBe(false);
  });
  it('regesteLeitsatz trennt auch am Punkt nach dem Gesetzeskürzel (statt Semikolon)', () => {
    expect(regesteLeitsatz('Art. 6 Abs. 4 lit. b ZPO; Art. 105 FusG. Die fusionsrechtliche Überprüfungsklage ist zulässig.'))
      .toBe('Die fusionsrechtliche Überprüfungsklage ist zulässig.');
  });
  it('regesteLeitsatz bricht NICHT an einem Abkürzungspunkt (ff./Abs.) ab', () => {
    expect(regesteLeitsatz('Art. 25a Abs. 2 ELV; keine Anwendung gemäss Art. 9 ff. dieser Regel.'))
      .toBe('Keine Anwendung gemäss Art. 9 ff. dieser Regel.');
  });
  it('regesteLeitsatz gibt bei reinem (abgeschnittenem) Artikel-Block ehrlich die volle Regeste zurück — nie ein Fragment', () => {
    const rk = 'Art. 44 SchKG; Art. 184 Abs. 3 BV; Art. 2 des Embargogesetzes; Art. 15 der Ukraine-Verordnung …';
    expect(regesteLeitsatz(rk)).toBe(rk);
  });
  it('baut ohne Regeste eine Synth-Zeile aus Gebiet + Gericht + Normen', () => {
    const e = be({ sachgebiet: 'sozialversicherung', gerichtName: 'Kantonsgericht GR', normKeys: ['ATSG', 'BGG'] });
    expect(istSynth(e)).toBe(true);
    expect(synthThema(e)).toBe('Sozialversicherung — Kantonsgericht GR · angewandt: ATSG, BGG');
  });
  it('fällt ohne Normen auf Gebiet + Gericht + Jahr zurück (kein gefakter Text)', () => {
    const e = be({ sachgebiet: 'privat', gerichtName: 'Obergericht ZH', normKeys: [], datum: '2024-06-30' });
    expect(synthThema(e)).toBe('Privatrecht — Obergericht ZH, 2024');
  });
  it('kappt die Normen-Liste deterministisch auf 3', () => {
    const e = be({ normKeys: ['BV', 'ZGB', 'OR', 'ZPO'], sachgebiet: 'privat', gerichtName: 'G' });
    expect(synthThema(e)).toBe('Privatrecht — G · angewandt: BV, ZGB, OR');
  });
});

describe('istBge / hauptIdentitaet', () => {
  it('führt mit der BGE-Referenz, wenn vorhanden (zitierbarer Anker)', () => {
    const e = be({ bgeReferenz: '150 III 137', nummer: '5A_242/2025' });
    expect(istBge(e)).toBe(true);
    expect(hauptIdentitaet(e)).toBe('BGE 150 III 137');
  });
  it('fällt ohne BGE-Referenz auf das Aktenzeichen zurück', () => {
    const e = be({ bgeReferenz: null, nummer: '5A_242/2025' });
    expect(istBge(e)).toBe(false);
    expect(hauptIdentitaet(e)).toBe('5A_242/2025');
  });
});

describe('Sortierung — deterministisch, key-stabil', () => {
  const a = be({ key: 'a', leitcharakter: 'routine', datum: '2025-05-01' });
  const b = be({ key: 'b', leitcharakter: 'leitentscheid', datum: '2020-01-01' });
  const c = be({ key: 'c', leitcharakter: 'leitentscheid', datum: '2026-01-01' });
  const d = be({ key: 'd', leitcharakter: 'routine', datum: '2025-05-01', kanton: 'ZH' });

  it('nachRelevanz: Leitentscheide zuerst, dann neueste, dann key', () => {
    expect(nachRelevanz([a, b, c]).map((e) => e.key)).toEqual(['c', 'b', 'a']);
  });
  it('nachRelevanz: unter Leitentscheiden amtlich publizierte (BGE) zuerst — auch wenn älter', () => {
    const bge = be({ key: 'bge', leitcharakter: 'leitentscheid', datum: '2019-01-01', bgeReferenz: '150 III 1' });
    const neu = be({ key: 'neu', leitcharakter: 'leitentscheid', datum: '2026-01-01', bgeReferenz: null });
    expect(nachRelevanz([neu, bge]).map((e) => e.key)).toEqual(['bge', 'neu']);
  });
  it('Tiebreak auf key bei gleichem leit+datum', () => {
    expect(nachRelevanz([d, a]).map((e) => e.key)).toEqual(['a', 'd']);
  });
  it('nachDatum desc/asc mit key-Tiebreak', () => {
    expect(nachDatum([b, c, a], 'desc').map((e) => e.key)).toEqual(['c', 'a', 'b']);
    expect(nachDatum([b, c, a], 'asc').map((e) => e.key)).toEqual(['b', 'a', 'c']);
  });
  it('nachGericht: Bund vor Kantonen, dann neueste, dann key', () => {
    expect(nachGericht([d, a, c]).map((e) => e.key)).toEqual(['c', 'a', 'd']);
  });
  it('sortiere dispatcht und mutiert die Eingabe nicht', () => {
    const eingabe = [a, b, c];
    const kopie = [...eingabe];
    sortiere(eingabe, 'relevanz');
    expect(eingabe).toEqual(kopie);
    expect(sortiere([a, b, c], 'neu').map((e) => e.key)).toEqual(['c', 'a', 'b']);
  });
});

describe('gruppiereNachLeit', () => {
  it('trennt Leitentscheide von Weiteren ohne Reihenfolge zu verlieren', () => {
    const g = gruppiereNachLeit([
      be({ key: 'l1', leitcharakter: 'leitentscheid' }),
      be({ key: 'r1', leitcharakter: 'routine' }),
      be({ key: 'l2', leitcharakter: 'leitentscheid' }),
    ]);
    expect(g.leitentscheide.map((e) => e.key)).toEqual(['l1', 'l2']);
    expect(g.weitere.map((e) => e.key)).toEqual(['r1']);
  });
});

describe('gruppiereNachInstanz (A3-Regel 5)', () => {
  it('gruppiert nach Instanz, Bund vor Kanton, nur belegte Gruppen, stabil', () => {
    const g = gruppiereNachInstanz([
      be({ key: 'k1', gerichtstyp: 'kantonal', kanton: 'ZH' }),
      be({ key: 'b1', gerichtstyp: 'bundesgericht' }),
      be({ key: 'k2', gerichtstyp: 'kantonal', kanton: 'BE' }),
      be({ key: 'b2', gerichtstyp: 'bundesgericht' }),
    ]);
    expect(g.map((x) => x.typ)).toEqual(['bundesgericht', 'kantonal']);
    expect(g.find((x) => x.typ === 'bundesgericht')?.liste.map((e) => e.key)).toEqual(['b1', 'b2']);
    expect(g.find((x) => x.typ === 'kantonal')?.liste.map((e) => e.key)).toEqual(['k1', 'k2']);
    expect(g.find((x) => x.typ === 'kantonal')?.label).toBe('Kantonale Gerichte');
  });
  it('lässt unbelegte Instanzen weg', () => {
    const g = gruppiereNachInstanz([be({ gerichtstyp: 'bundesgericht' })]);
    expect(g.map((x) => x.typ)).toEqual(['bundesgericht']);
  });
});

describe('zaehleSachgebiete', () => {
  it('zählt in GEBIETE-Reihenfolge, nur belegte Gebiete', () => {
    const z = zaehleSachgebiete([
      be({ sachgebiet: 'sozialversicherung' }),
      be({ sachgebiet: 'privat' }),
      be({ sachgebiet: 'sozialversicherung' }),
    ]);
    expect(z.map((g) => g.sachgebiet)).toEqual(['privat', 'sozialversicherung']);
    expect(z.find((g) => g.sachgebiet === 'sozialversicherung')?.count).toBe(2);
  });
});

describe('normHaeufigkeit', () => {
  it('zählt Erlasse absteigend, key-stabil bei Gleichstand', () => {
    const n = normHaeufigkeit([
      be({ normKeys: ['ZPO', 'BV'] }),
      be({ normKeys: ['ZPO'] }),
      be({ normKeys: ['OR'] }),
    ]);
    expect(n[0]).toEqual({ normKey: 'ZPO', count: 2 });
    expect(n.slice(1)).toEqual([{ normKey: 'BV', count: 1 }, { normKey: 'OR', count: 1 }]);
  });
});

describe('filterEntscheide', () => {
  const liste = [
    be({ key: 'p1', sachgebiet: 'privat', kanton: 'CH', normKeys: ['OR', 'ZGB'], regesteKurz: 'Mietzins', leitcharakter: 'leitentscheid', datum: '2025-03-01' }),
    be({ key: 'o1', sachgebiet: 'oeffentlich', kanton: 'ZH', normKeys: ['BV'], gerichtName: 'Obergericht ZH', datum: '2024-01-01' }),
    be({ key: 's1', sachgebiet: 'sozialversicherung', kanton: 'CH', normKeys: ['ATSG'], regesteKurz: 'Invalidenrente', datum: '2026-02-02' }),
  ];
  it('filtert nach Sachgebiet', () => {
    expect(filterEntscheide(liste, { sachgebiet: 'privat' }).map((e) => e.key)).toEqual(['p1']);
  });
  it('filtert nach angewandter Norm (zweite Achse)', () => {
    expect(filterEntscheide(liste, { norm: 'OR' }).map((e) => e.key)).toEqual(['p1']);
    expect(filterNachNorm(liste, 'BV').map((e) => e.key)).toEqual(['o1']);
  });
  it('Suche trifft das Thema inkl. Synth-Zeile und das Gericht', () => {
    expect(filterEntscheide(liste, { q: 'mietzins' }).map((e) => e.key)).toEqual(['p1']);
    expect(filterEntscheide(liste, { q: 'obergericht' }).map((e) => e.key)).toEqual(['o1']);
    // Synth-Zeile von o1 enthält 'Öffentliches Recht'
    expect(filterEntscheide(liste, { q: 'öffentliches recht' }).map((e) => e.key)).toEqual(['o1']);
  });
  it('kombiniert Filter (UND) und respektiert nurLeitentscheide + Datum', () => {
    expect(filterEntscheide(liste, { kanton: 'CH', nurLeitentscheide: true }).map((e) => e.key)).toEqual(['p1']);
    expect(filterEntscheide(liste, { datumVon: '2025-01-01' }).map((e) => e.key).sort()).toEqual(['p1', 's1']);
  });
  it('filtert nurBge auf amtlich publizierte Entscheide', () => {
    const mitBge = [...liste, be({ key: 'bge1', bgeReferenz: '150 III 1' })];
    expect(filterEntscheide(mitBge, { nurBge: true }).map((e) => e.key)).toEqual(['bge1']);
  });
  it('trennt Ebene Bund vs. Kantone', () => {
    expect(filterEntscheide(liste, { ebene: 'bund' }).map((e) => e.key).sort()).toEqual(['p1', 's1']);
    expect(filterEntscheide(liste, { ebene: 'kanton' }).map((e) => e.key)).toEqual(['o1']);
  });
  it('leere Werte filtern nicht', () => {
    expect(filterEntscheide(liste, {}).length).toBe(3);
  });
});

// ─── Richter-/Spruchkörper-Achse (R-RICHTER Block B) ────────────────────────
describe('filterEntscheide — Richter-Achse', () => {
  const mitR = be({ key: 'a', richter: [{ s: 'gelzer-claudius', r: 'vorsitz' }, { s: 'oser-marc', r: 'mitglied' }] });
  const nurGs = be({ key: 'b', richter: [{ s: 'gelzer-claudius', r: 'gerichtsschreiber' }] });
  const ohne = be({ key: 'c' });

  it('trifft Vorsitz und Mitglied', () => {
    expect(filterEntscheide([mitR, nurGs, ohne], { richter: 'gelzer-claudius' }).map((e) => e.key)).toEqual(['a']);
    expect(filterEntscheide([mitR, nurGs, ohne], { richter: 'oser-marc' }).map((e) => e.key)).toEqual(['a']);
  });
  it('trifft NICHT, wenn die Person nur Gerichtsschreiber:in war', () => {
    expect(filterEntscheide([nurGs], { richter: 'gelzer-claudius' })).toEqual([]);
  });
  it('Entscheide ohne erfasste Besetzung sind nie ein Treffer (§8)', () => {
    expect(filterEntscheide([ohne], { richter: 'gelzer-claudius' })).toEqual([]);
  });
  it('leerer Wert filtert nicht', () => {
    expect(filterEntscheide([mitR, nurGs, ohne], { richter: null })).toHaveLength(3);
  });
  it('kombiniert mit der Gericht-Achse (Schnittmenge)', () => {
    const bs = be({ key: 'd', gericht: 'bs_appellationsgericht', richter: [{ s: 'gelzer-claudius', r: 'mitglied' }] });
    const treffer = filterEntscheide([mitR, bs], { richter: 'gelzer-claudius', gericht: 'bs_appellationsgericht' });
    expect(treffer.map((e) => e.key)).toEqual(['d']);
  });
});

describe('richterHaeufigkeit', () => {
  const reg = { erzeugt: '2026-07-20', richter: {
    'gelzer-claudius': { name: 'Claudius Gelzer', count: 486 },
    'oser-marc': { name: 'Marc Oser', count: 425 },
  } };
  it('zählt absteigend, Gerichtsschreiber:innen NICHT als Richter:in', () => {
    const liste = [
      be({ key: 'a', richter: [{ s: 'gelzer-claudius', r: 'vorsitz' }, { s: 'oser-marc', r: 'mitglied' }] }),
      be({ key: 'b', richter: [{ s: 'gelzer-claudius', r: 'mitglied' }, { s: 'oser-marc', r: 'gerichtsschreiber' }] }),
    ];
    expect(richterHaeufigkeit(liste, reg)).toEqual([
      { slug: 'gelzer-claudius', name: 'Claudius Gelzer', count: 2 },
      { slug: 'oser-marc', name: 'Marc Oser', count: 1 },
    ]);
  });
  it('zählt eine Person je Entscheid nur EINMAL (Doppelrolle Richter + GS)', () => {
    const liste = [be({ key: 'a', richter: [{ s: 'seiler', r: 'vorsitz' }, { s: 'seiler', r: 'gerichtsschreiber' }] })];
    expect(richterHaeufigkeit(liste, null)).toEqual([{ slug: 'seiler', name: 'seiler', count: 1 }]);
  });
  it('lässt Verweis-Einträge aus (sonst zählt ein BGE doppelt)', () => {
    const liste = [
      be({ key: 'a', richter: [{ s: 'gelzer-claudius', r: 'vorsitz' }] }),
      be({ key: 'b', richter: [{ s: 'gelzer-claudius', r: 'vorsitz' }],
        verweis: { zielKey: 'a', ansicht: 'voll', bgeReferenz: '150 III 1' } }),
    ];
    expect(richterHaeufigkeit(liste, reg)[0].count).toBe(1);
  });
  it('zeigt ohne Register ehrlich den Slug statt eines geratenen Namens (§8)', () => {
    const liste = [be({ key: 'a', richter: [{ s: 'unbekannt-x', r: 'vorsitz' }] })];
    expect(richterHaeufigkeit(liste, null)).toEqual([{ slug: 'unbekannt-x', name: 'unbekannt-x', count: 1 }]);
  });
  it('ist deterministisch bei Gleichstand (slug-stabil, §2)', () => {
    const liste = [be({ key: 'a', richter: [{ s: 'b-zwei', r: 'vorsitz' }, { s: 'a-eins', r: 'mitglied' }] })];
    expect(richterHaeufigkeit(liste, null).map((r) => r.slug)).toEqual(['a-eins', 'b-zwei']);
  });
});
