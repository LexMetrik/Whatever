import { describe, it, expect } from 'vitest';
import {
  STATUS_RANG, bezugStatusFuerEntscheid, facettenFuerEntscheid,
  facettenFuerMaterial, vergleicheDatumAbsteigend, vergleicheStatus, zaehleFacetten,
} from '../lib/verzahnung/facetten';
import { extrahiereParagraphGruppen, extrahiereStatutRefs } from '../lib/rechtsprechung/zitat-extraktion';
import {
  SYSTEMATIK_PRAEFIX, amtlichesKuerzel, baueNummernDominanz, kantoneOhneResolver,
  loeseKantonZitate, titelParagraphen, titelWiderspricht,
} from '../../scripts/normtext/kanton-norm-resolver';
import { fremdDefinierteKeys } from '../../scripts/normtext/entscheide-mapping';
import type { EntscheidSnapshot } from '../lib/rechtsprechung/typen';
import { readFileSync } from 'node:fs';
import { bezuegeFuerArtikel, filtereBezuege, klassenImShard, trefferJeStatus } from '../lib/rechtsprechung/bezuege';
import { waehleBezuege } from '../pages/gesetz-leser/bezugAuswahl';
import type { BezugsShard } from '../lib/rechtsprechung/bezuege';

// W2·7-BEZUG B1–B3, Datenschicht. Getestet wird das, was fachlich falsch werden
// KANN: die Status-Achse (§8 — Leitentscheid nie stillschweigend gleichgestellt),
// die kantonale Auflösung samt beidseitigem Ambiguitäts-Ausschluss (§1) und die
// ehrliche Grundgesamtheit.

describe('B1 · Status-Achse trennt, was rechtlich verschieden ist (§8)', () => {
  const bge = { gericht: 'bge', gerichtstyp: 'bundesgericht', kanton: 'CH', leitcharakter: 'leitentscheid' };
  const bger = { gericht: 'bger', gerichtstyp: 'bundesgericht', kanton: 'CH', leitcharakter: 'routine' };
  const bvger = { gericht: 'bvger', gerichtstyp: 'bundesverwaltungsgericht', kanton: 'CH', leitcharakter: 'routine' };
  const bs = { gericht: 'bs_appellationsgericht', gerichtstyp: 'kantonal', kanton: 'BS', leitcharakter: 'routine' };

  it('unterscheidet BGE, übriges BGer-Urteil, eidg. Gericht und kantonalen Entscheid', () => {
    expect(bezugStatusFuerEntscheid(bge)).toBe('bge');
    expect(bezugStatusFuerEntscheid(bger)).toBe('bger');
    expect(bezugStatusFuerEntscheid(bvger)).toBe('eidg');
    expect(bezugStatusFuerEntscheid(bs)).toBe('kantonal');
  });

  it('«routine» allein sagt nichts — BGer-Urteil und BS-Entscheid tragen beide routine', () => {
    // Genau der Grund, warum es die Achse gibt: leitcharakter kollabiert die beiden.
    expect(bger.leitcharakter).toBe(bs.leitcharakter);
    expect(bezugStatusFuerEntscheid(bger)).not.toBe(bezugStatusFuerEntscheid(bs));
  });

  it('das GERICHT entscheidet vor dem leitcharakter — ein kantonaler «leitentscheid» wird nie BGE', () => {
    // Es gibt keine amtliche Sammlung des Bundes für kantonale Entscheide (§8).
    expect(bezugStatusFuerEntscheid({ ...bs, leitcharakter: 'leitentscheid' })).toBe('kantonal');
  });

  it('ebene ist Funktion des Kantons, nicht frei gesetzt', () => {
    expect(facettenFuerEntscheid(bge).ebene).toBe('bund');
    expect(facettenFuerEntscheid(bs).ebene).toBe('kanton');
    expect(facettenFuerEntscheid(bs).kanton).toBe('BS');
  });

  it('Rangordnung: amtlicher Leitentscheid vor allem, Materialien zuletzt', () => {
    expect(vergleicheStatus('bge', 'bger')).toBeLessThan(0);
    expect(vergleicheStatus('bger', 'eidg')).toBeLessThan(0);
    expect(vergleicheStatus('eidg', 'kantonal')).toBeLessThan(0);
    expect(vergleicheStatus('kantonal', 'material')).toBeLessThan(0);
  });
});

describe('B1 · die Schicht ist generisch, nicht nur so genannt (§5)', () => {
  // §6.3-DEKLARATION (B7): dieser Test hiess «… denselben Deckel …» und prüfte
  // `DECKEL_JE_STATUS.material > 0`. Der Deckel ist mit B7 ERSATZLOS entfallen
  // (David-Auftrag 28.7.2026, Begründung in facetten.ts) — die Konstante gibt es
  // nicht mehr, die Zusicherung wäre also nicht «angepasst», sondern gegenstandslos.
  // Der TRAGENDE Teil der Aussage bleibt unverändert stehen und ist es auch, was
  // der Test je gemeint hat: Materialien laufen ohne Sonderweg durch dieselbe
  // Schicht. Getreten wird die Stelle mit dem Rang, der weiterhin existiert.
  it('Materialien-Kanten durchlaufen dieselben Facetten und dieselbe Ordnung', () => {
    const m = facettenFuerMaterial('seco');
    expect(m.quelltyp).toBe('materialien');
    expect(m.ebene).toBe('bund');
    expect(m.status).toBe('material');
    // Kein Sonderweg: der Status hat einen Rang wie jeder andere.
    expect(STATUS_RANG.material).toBeGreaterThan(STATUS_RANG.kantonal);
  });

  it('kantonale Materialien bekommen die kantonale Ebene, ohne zweites Modell', () => {
    expect(facettenFuerMaterial('bs_jd', 'BS').ebene).toBe('kanton');
  });

  it('zaehleFacetten liefert je Achse eine Bilanz mit Grundgesamtheit', () => {
    const b = zaehleFacetten([
      facettenFuerEntscheid({ gericht: 'bge', gerichtstyp: 'bundesgericht', kanton: 'CH', leitcharakter: 'leitentscheid' }),
      facettenFuerEntscheid({ gericht: 'bs_zivilgericht', gerichtstyp: 'kantonal', kanton: 'BS', leitcharakter: 'routine' }),
      facettenFuerMaterial('seco'),
    ]);
    expect(b.gesamt).toBe(3);
    expect(b.status).toEqual({ bge: 1, kantonal: 1, material: 1 });
    expect(b.ebene).toEqual({ bund: 2, kanton: 1 });
  });
});

describe('B2 · «§»-Tokenizer — dieselbe Grammatik wie «Art.», eigener Pfad', () => {
  it('liest Einzel-Zitat, Kette und Bereich', () => {
    expect(extrahiereParagraphGruppen('§ 93 Abs. 1 Ziff. 1 GOG')[0].artikel).toEqual(['93']);
    expect(extrahiereParagraphGruppen('§§ 88 Abs. 1 und 93 Abs. 1 Ziff. 1 des GOG')[0].artikel).toEqual(['88', '93']);
    expect(extrahiereParagraphGruppen('§ 63b Schulgesetz')[0].artikel).toEqual(['63b']);
  });

  it('erbt den Phantom-Ketten-Schutz: «§ 12 Abs. 1 und 2» ist EIN Artikel', () => {
    expect(extrahiereParagraphGruppen('§ 12 Abs. 1 und 2 VRPG')[0].artikel).toEqual(['12']);
  });

  it('`ende` zeigt hinter die Gruppe — dort sucht der Resolver den Erlass', () => {
    const t = '§ 30 des Gesetzes über die Verfassungs- und Verwaltungsrechtspflege';
    const g = extrahiereParagraphGruppen(t)[0];
    expect(t.slice(g.ende).startsWith(' des Gesetzes')).toBe(true);
  });

  it('KERN-SICHERUNG: der Bundes-Extraktor sieht «§» weiterhin NICHT', () => {
    // Sonst liefe «§ 12 StG» (kantonales Steuerrecht) über normKeyFuerAbk auf
    // einen Bundes-Register-key. Die Trennung der beiden Pfade IST die Sicherung.
    expect(extrahiereStatutRefs('§ 12 Abs. 2 EG ZGB')).toEqual([]);
    expect(extrahiereStatutRefs('§ 93 GOG')).toEqual([]);
  });
});

describe('B2 · kantonaler Resolver — Nummer schlägt Abkürzung', () => {
  const bestand = new Map([
    ['154.100', 'BS-154.100'],
    ['270.100', 'BS-270.100'],
    ['BeE 786.100', 'BS-BeE 786.100'],
  ]);

  it('löst über die amtliche Systematik-Nummer auf', () => {
    const b = loeseKantonZitate(
      '§ 93 Abs. 1 Ziff. 1 des Gerichtsorganisationsgesetzes (GOG, SG 154.100) ist anwendbar.',
      'BS', bestand,
    );
    expect(b.zitate).toEqual([{ erlass: 'BS-154.100', artikel: '93', kanal: 'nummer' }]);
  });

  it('bindet die Abkürzung dokumentlokal und löst Folge-Nennungen auf', () => {
    const b = loeseKantonZitate(
      'Nach § 93 des Gerichtsorganisationsgesetzes (GOG, SG 154.100). Ferner § 44 Abs. 2 GOG.',
      'BS', bestand,
    );
    expect(b.zitate).toContainEqual({ erlass: 'BS-154.100', artikel: '93', kanal: 'nummer' });
    expect(b.zitate).toContainEqual({ erlass: 'BS-154.100', artikel: '44', kanal: 'abkuerzung' });
  });

  it('Gemeinde-Teilsammlungen bleiben unterscheidbar (BeE 786.100 ≠ 786.100)', () => {
    const b = loeseKantonZitate('§ 5 der Abfallordnung (SG BeE 786.100)', 'BS', bestand);
    expect(b.zitate).toEqual([{ erlass: 'BS-BeE 786.100', artikel: '5', kanal: 'nummer' }]);
  });

  it('AMBIGUITÄTS-AUSSCHLUSS (a): kantonale Namensvetter des Bundesrechts werden NIE gebunden', () => {
    // «ZGB» ist ein Bundes-Register-key. Auch wenn ein BS-Entscheid es als
    // Kurzform eines kantonalen Erlasses einführt, darf die Bindung nicht
    // entstehen — lieber die Folge-Nennungen verlieren (§1/§8).
    const b = loeseKantonZitate(
      'Nach § 2 des Einführungsgesetzes (ZGB, SG 270.100). Ferner § 9 ZGB.',
      'BS', bestand,
    );
    expect(b.abkAusgeschlossen).toContain('ZGB');
    expect(b.zitate.some((z) => z.artikel === '9')).toBe(false);
  });

  it('AMBIGUITÄTS-AUSSCHLUSS (b): kein «§»-Zitat erzeugt je einen Bundes-Register-key', () => {
    const b = loeseKantonZitate('§ 12 StG und § 5 KV', 'BS', bestand);
    expect(b.zitate).toEqual([]);
    // strukturell: alle Erlass-keys tragen den Kantons-Präfix
    for (const z of b.zitate) expect(z.erlass.startsWith('BS-')).toBe(true);
  });

  it('eine geschlossene Klammer beendet das Zitat — der nächste Locator gehört nicht dazu', () => {
    // Belegte FP-Klasse (Korpus 28.7.2026): «§ 71 … GOG). Weder aus dem GOG noch
    // aus dem Organisationsreglement des Zivilgerichts (SG 154.170)».
    const b = loeseKantonZitate(
      '§ 71 Abs. 1 GOG). Weder aus dem GOG noch aus dem Verwaltungsrechtspflegegesetz (SG 270.100) folgt etwas.',
      'BS', bestand,
    );
    expect(b.zitate.some((z) => z.artikel === '71' && z.erlass === 'BS-270.100')).toBe(false);
  });

  it('ein Kürzel VOR der Klammer beendet das Zitat ebenfalls', () => {
    // Belegte FP-Klasse: «§ 19 Abs. 1 KESG mangels … nach dem Gesetz über die
    // Verfassungs- und Verwaltungsrechtspflege (VRPG, SG 270.100)».
    const b = loeseKantonZitate(
      '§ 19 Abs. 1 KESG mangels spezialgesetzlicher Regelung nach dem Verwaltungsrechtspflegegesetz (VRPG, SG 270.100)',
      'BS', bestand,
    );
    expect(b.zitate.some((z) => z.artikel === '19')).toBe(false);
  });

  it('Struktur-Marker sind keine Kürzel — legitime Ketten überleben', () => {
    const b = loeseKantonZitate(
      '§§ 88 Abs. 1 und 93 Abs. 1 Ziff. 1 des Gerichtsorganisationsgesetzes [GOG, SG 154.100]',
      'BS', bestand,
    );
    expect(b.zitate.map((z) => z.artikel).sort()).toEqual(['88', '93']);
  });

  it('unbekannte Nummer → Lücke, nie Rateversuch; die Nummer wird ausgewiesen', () => {
    const b = loeseKantonZitate('§ 4 des Gesetzes über X (SG 999.999)', 'BS', bestand);
    expect(b.zitate).toEqual([]);
    expect(b.nummerOhneBestand).toEqual(['999.999']);
  });

  it('Kanton ohne deklarierten Systematik-Präfix liefert nichts (benannte Lücke, §8)', () => {
    expect(loeseKantonZitate('§ 93 GOG (SG 154.100)', 'ZH', bestand).zitate).toEqual([]);
    expect(SYSTEMATIK_PRAEFIX.has('BS')).toBe(true);
    expect(kantoneOhneResolver(['CH', 'BS', 'ZH', 'AG'])).toEqual(['AG', 'ZH']);
  });

  it('ist rein: zweimal derselbe Aufruf, dasselbe Ergebnis (§2)', () => {
    const t = '§ 93 GOG (SG 154.100) und § 12 (SG 270.100)';
    expect(loeseKantonZitate(t, 'BS', bestand)).toEqual(loeseKantonZitate(t, 'BS', bestand));
  });
});

describe('B1-Riegel · das Dokument schlägt die Abkürzungs-Tabelle (Gegenprüfung R1)', () => {
  const snap = (text: string): EntscheidSnapshot => ({
    id: 'kanton/BS/x/T.1', gericht: 'bs_appellationsgericht', gerichtName: 'AG BS',
    gerichtstyp: 'kantonal', kanton: 'BS', abteilung: null, nummer: 'T.1', bgeReferenz: null,
    zitierung: 'T.1', datum: '2025-01-01', sprache: 'de', leitcharakter: 'routine',
    sachgebiet: 'oeffentlich', legalArea: null, rubrum: null, regeste: null, regesteAmtlich: false,
    abschnitte: [{ typ: 'erwaegung', bloecke: [{ marke: null, text }] }],
    dispositivOrders: [], zitierteNormen: [], normKeys: [], zitierteEntscheide: [],
    bestand: 'snapshot', kuratierung: 'maschinell', quelle: 'gerichte-bs',
    quelleUrl: 'https://example.invalid', abgerufen: '2025-01-01', fassungsToken: 'h', sha: 's',
  } as unknown as EntscheidSnapshot);

  it('ARM A — Titel-Definition ohne Überschneidung sperrt den Key (Fall BPR)', () => {
    // Wortlaut aus bs_appellationsgericht/VD.2025.5 (Anlassfall der Gegenprüfung).
    const t = 'Verordnung (EU) Nr. 528/2012 über die Bereitstellung auf dem Markt und die '
      + 'Verwendung von Biozidprodukten (Biozidprodukteverordnung, BPR). Art. 3 Abs. 1 lit. a BPR …';
    expect(fremdDefinierteKeys(snap(t)).has('BPR')).toBe(true);
  });

  it('ARM B — Titel VOR der Klammer, kantonales Sigel dahinter (Fall KAG)', () => {
    // Wortlaut aus be_verwaltungsgericht/2002024417 (eigene Stichprobe).
    const t = 'Gemäss Art. 42 des kantonalen Anwaltsgesetzes vom 28. März 2006 (KAG; BSG 168.11) bezahlt der Kanton …';
    expect(fremdDefinierteKeys(snap(t)).has('KAG')).toBe(true);
  });

  it('sperrt NICHT, wenn der genannte Titel zum Register-Erlass passt', () => {
    // Belegte Über-Sperr-Fälle: kantonales Sigel vor einer BUNDES-Nummer.
    expect(fremdDefinierteKeys(snap('Art. 75 des Ausländer- und Integrationsgesetzes (AIG, SG 142.20)')).has('AIG')).toBe(false);
    expect(fremdDefinierteKeys(snap('zu Art. 24 Verwaltungsverfahrensgesetz [VwVG, SG 172.021]')).has('VWVG')).toBe(false);
  });

  it('sperrt NICHT bei eidgenössischem Locator — der bestätigt die Zuordnung', () => {
    expect(fremdDefinierteKeys(snap('Bundesgesetz über die berufliche Vorsorge (BVG, SR 831.40)')).size).toBe(0);
  });

  it('ein blosses Zitat ist keine Definition', () => {
    expect(fremdDefinierteKeys(snap('(Art. 48 Abs. 1 BGG) und (vgl. Art. 279 Abs. 3 StPO)')).size).toBe(0);
  });
});

describe('B2-Riegel · Quell-Tippfehler in der Systematik-Nummer (Gegenprüfung R1)', () => {
  const bestand = new Map([['154.100', 'BS-154.100'], ['153.100', 'BS-153.100']]);

  it('Korpus-Mehrheit entscheidet; die Minderheits-Nummer wird nicht gebunden', () => {
    const korpus = [
      '§ 93 des Gerichtsorganisationsgesetzes (GOG, SG 154.100)',
      '§ 88 des Gerichtsorganisationsgesetzes (GOG, SG 154.100)',
      '§ 92 des Gerichtsorganisationsgesetzes (GOG, SG 153.100)',   // Tippfehler
    ];
    const dom = baueNummernDominanz(korpus, 'BS');
    expect(dom.get('GOG')).toBe('154.100');
    const b = loeseKantonZitate(korpus[2], 'BS', bestand, dom);
    expect(b.zitate).toEqual([]);
    expect(b.nummerMinderheit).toEqual(['GOG: 153.100 (Korpus-Mehrheit 154.100)']);
  });

  it('bei Gleichstand wird NICHT geraten — kein Eintrag, kein Riegel', () => {
    const dom = baueNummernDominanz([
      '§ 1 des Gesetzes (XYZ, SG 154.100)',
      '§ 2 des Gesetzes (XYZ, SG 153.100)',
    ], 'BS');
    expect(dom.has('XYZ')).toBe(false);
  });

  it('ohne Dominanz-Karte verhält sich der Resolver wie zuvor', () => {
    const b = loeseKantonZitate('§ 92 des Gerichtsorganisationsgesetzes (GOG, SG 153.100)', 'BS', bestand);
    expect(b.zitate).toEqual([{ erlass: 'BS-153.100', artikel: '92', kanal: 'nummer' }]);
  });
});

describe('B1/R2 · Erlass-Titel mit eigenem «§» (Gegenprüfung Runde 2)', () => {
  // Fuenf BS-Erlasse tragen ein FREMDES «§» im amtlichen Titel. Ohne Sonder-
  // behandlung bindet die Regel «letzte §-Gruppe vor dem Locator» das § DES
  // TITELS — und die richtige Kante geht verloren.
  const bestand = new Map([
    ['164.410', 'BS-164.410'], ['164.160', 'BS-164.160'], ['164.250', 'BS-164.250'],
    ['390.720', 'BS-390.720'], ['390.760', 'BS-390.760'],
  ]);
  const titel = new Map([
    ['164.410', 'Verordnung betreffend Zulagen gemäss § 15a Lohngesetz, Zulagenverordnung (164.410)'],
    ['164.160', 'Verordnung über die Beschleunigung des Stufenaufstiegs gemäss § 10 des Lohngesetzes (164.160)'],
    ['164.250', 'Verordnung über das Dienstaltersgeschenk gemäss § 23 Lohngesetz, Dienstaltersgeschenkverordnung (164.250)'],
    ['390.720', 'Vertrag betreffend die Kremation aufgrund von § 17 des Gesetzes betreffend die Bestattungen (390.720)'],
    ['390.760', 'Vertrag betreffend die Kremation gemäss § 1 der Vollziehungsverordnung (390.760)'],
  ]);

  it('titelParagraphen liest Nummer UND Folgewort aus dem amtlichen Titel', () => {
    expect(titelParagraphen(titel.get('164.410')!).get('15a')).toBe('lohngesetz');
    expect(titelParagraphen(titel.get('164.250')!).get('23')).toBe('lohngesetz');
    expect(titelParagraphen('Advokaturgesetz (291.100)').size).toBe(0);
  });

  it('ANLASSFALL VD.2021.145: § 15a wird NICHT gebunden, § 5 schon', () => {
    const t = 'Gemäss § 5 der Verordnung betreffend Zulagen gemäss § 15a Lohngesetz '
      + '(Zulagenverordnung, SG 164.410) haben Mitarbeiterinnen Anspruch.';
    const z = loeseKantonZitate(t, 'BS', bestand, undefined, titel);
    expect(z.zitate).toEqual([{ erlass: 'BS-164.410', artikel: '5', kanal: 'nummer' }]);
  });

  it('gilt für alle fuenf Titel-§-Erlasse', () => {
    const faelle: Array<[string, string, string, string]> = [
      ['164.410', '15a Lohngesetz', '5', 'BS-164.410'],
      ['164.160', '10 des Lohngesetzes', '3', 'BS-164.160'],
      ['164.250', '23 Lohngesetz', '4', 'BS-164.250'],
      ['390.720', '17 des Gesetzes', '2', 'BS-390.720'],
      ['390.760', '1 der Vollziehungsverordnung', '6', 'BS-390.760'],
    ];
    for (const [nr, titelPar, echt, key] of faelle) {
      const t = `Nach § ${echt} der Verordnung gemäss § ${titelPar} (Kurzform, SG ${nr}) gilt`;
      const z = loeseKantonZitate(t, 'BS', bestand, undefined, titel);
      expect(z.zitate.map((x) => x.artikel)).toEqual([echt]);
      expect(z.zitate[0].erlass).toBe(key);
    }
  });

  it('C2a-PIN: mehrgliedrige Gruppe bindet das Titel-§ nicht mit', () => {
    const t = 'Die §§ 15a und 16 Lohngesetz (Zulagenverordnung, SG 164.410) lauten';
    const z = loeseKantonZitate(t, 'BS', bestand, undefined, titel);
    expect(z.zitate.map((x) => x.artikel)).not.toContain('15a');
    expect(z.zitate.map((x) => x.artikel)).not.toContain('16');
  });

  it('C2b-PIN: die Titel-Signatur trägt drei Wörter, nicht eines', () => {
    // Einzelwort-Signatur wäre für BS-390.720 bloss «des» — dann träfe JEDES
    // Fremdzitat «§ N des Gesetzes über X» die Titel-Signatur und beendete das
    // Fenster nicht mehr.
    expect(titelParagraphen(titel.get('390.720')!).get('17')).toBe('des gesetzes betreffend');
    // Fremdzitat mit ANDEREM dritten Wort beendet das Fenster weiterhin.
    const t = 'Nach § 4 sowie § 1 des Gesetzes über X (Kurzform, SG 390.720) gilt';
    const z = loeseKantonZitate(t, 'BS', bestand, undefined, titel);
    expect(z.zitate.some((x) => x.artikel === '4')).toBe(false);
  });

  it('ein FREMDES § dazwischen bindet weiterhin NICHT (Schutz bleibt scharf)', () => {
    const t = 'Nach § 5 VRPG und § 99 Bundesgesetz (Zulagenverordnung, SG 164.410) folgt';
    const z = loeseKantonZitate(t, 'BS', bestand, undefined, titel);
    expect(z.zitate.some((x) => x.artikel === '5')).toBe(false);
  });
});

describe('B2/R3 · zweite Achse: ausgeschriebener Titel (nicht die Buchstaben)', () => {
  const bestand = new Map([['730.110', 'BS-730.110'], ['291.100', 'BS-291.100']]);
  const titel = new Map([
    ['730.110', 'Bau- und Planungsverordnung, BPV (730.110)'],
    ['291.100', 'Advokaturgesetz (291.100)'],
  ]);
  const bestandBreit = new Map([...bestand, ['154.810', 'BS-154.810'], ['270.100', 'BS-270.100'],
    ['162.110', 'BS-162.110'], ['258.210', 'BS-258.210']]);
  const titelBreit = new Map([...titel,
    ['154.810', 'Reglement über die Gerichtsgebühren, Gerichtsgebührenreglement, GGR (SG 154.810)'],
    ['270.100', 'Gesetz über die Verfassungs- und Verwaltungsrechtspflege, VRPG (270.100)'],
    ['162.110', 'Verordnung zum Personalgesetz, VPG (162.110)'],
    ['258.210', 'Verordnung über den Justizvollzug, Justizvollzugsverordnung, JVV (258.210)']]);

  it('amtlichesKuerzel liest nur echte Kürzel', () => {
    expect(amtlichesKuerzel('Bau- und Planungsverordnung, BPV (730.110)')).toBe('BPV');
    expect(amtlichesKuerzel('Verfassung des Kantons Basel-Stadt (111.100)')).toBeNull();
  });

  it('ANLASSFALL HBG: genannter Titel widerspricht dem amtlichen → gesperrt', () => {
    const t = '§ 8 des Hochbaugesetzes (HBG, SG 730.110) sieht vor';
    const b = loeseKantonZitate(t, 'BS', bestand, undefined, titel);
    expect(b.zitate).toEqual([]);
    expect(b.nummerMinderheit.join()).toMatch(/730\.110/);
  });

  it('C1-REGRESSION: vertauschte Kurzform bei RICHTIGEM Titel bleibt erhalten', () => {
    // Die Buchstaben-Achse zerstörte genau diese Klasse (26 Kanten, davon 24 richtig).
    const faelle: Array<[string, string]> = [
      ['§ 23 des Gerichtsgebührenreglements (GRR, SG 154.810) bemisst', 'BS-154.810'],
      ['§ 12 des Verwaltungsrechtspflegegesetzes (VPRG, SG 270.100) regelt', 'BS-270.100'],
      ['§ 14 der Verordnung zum Personalgesetz [PV, SG 162.110] sieht', 'BS-162.110'],
      ['§ 4 der Justizvollzugsverordnung [JW, SG 258.210] bestimmt', 'BS-258.210'],
      ['§ 87 Abs. 1 Bau- und Planungsverordnung (BPV, SG 730.110) verlangt', 'BS-730.110'],
    ];
    for (const [t, key] of faelle) {
      const z = loeseKantonZitate(t, 'BS', bestandBreit, undefined, titelBreit);
      expect(z.zitate.map((x) => x.erlass)).toEqual([key]);
    }
  });

  it('C1-KOLLATERAL: eine Fehlbindung sperrt die Nummer nicht dokumentweit', () => {
    const t = 'Nach § 8 des Hochbaugesetzes (HBG, SG 730.110) und § 87 Abs. 1 '
      + 'Bau- und Planungsverordnung (BPV, SG 730.110) gilt Folgendes.';
    const z = loeseKantonZitate(t, 'BS', bestandBreit, undefined, titelBreit);
    expect(z.zitate.map((x) => x.artikel)).toEqual(['87']);
  });

  it('D1-PIN: ALT-TITEL wird nicht gesperrt, wenn das amtliche Kürzel dasteht', () => {
    // Sieben BS-Erlasse führen einen Titel ohne Überschneidung zum früheren:
    // 154.300 · 164.100 · 212.400 · 300.100 · 610.500 · 789.700 · 911.900.
    // Beleg VD.2024.65 (Lohngesetz, 164.100).
    const amtlich = 'Lohngesetz, LG (164.100)';
    const genannt = 'des Gesetzes betreffend Einreihung und Entlöhnung der Mitarbeiterinnen';
    expect(titelWiderspricht(genannt, amtlich)).toBe(true);                              // ohne Umfeld
    expect(titelWiderspricht(genannt, amtlich, '(Lohngesetz [LG], SG 164.100)')).toBe(false);
    // Die Rettung darf HBG nicht mitnehmen — dort steht «HBG», amtlich ist «BPV».
    expect(titelWiderspricht('des Hochbaugesetzes', 'Bau- und Planungsverordnung, BPV (730.110)',
      '(HBG, SG 730.110)')).toBe(true);
  });

  it('D2-PIN: «des gesetzes über/betreffend» bleibt eine benannte Signatur-Lücke', () => {
    // Ist-Verhalten festgehalten, nicht behoben (§8): das Fremdzitat trifft die
    // Titel-Signatur von BS-390.720 und beendet das Fenster NICHT.
    const titelPar = titelParagraphen('Vertrag betreffend die Kremation aufgrund von § 17 des Gesetzes betreffend die Bestattungen (390.720)');
    expect(titelPar.get('17')).toBe('des gesetzes betreffend');
    // Gleiche Signatur, anderer Erlass — die Kollision ist real.
    expect(titelParagraphen('X gemäss § 1 des Gesetzes betreffend die Sozialhilfe (Y)').get('1'))
      .toBe('des gesetzes betreffend');
  });

  it('schweigt, wo das Dokument gar keinen Titel nennt (benannte Restlücke §8)', () => {
    expect(titelWiderspricht('(PG, ', 'Verordnung zum Personalgesetz, VPG (162.110)')).toBe(false);
  });
});

describe('B5/R2 · Gemeinde-Präfix ist Teil der Erlass-Identität', () => {
  const bestand = new Map([
    ['640.100', 'BS-640.100'],
    ['RiE 640.100', 'BS-RiE 640.100'],
  ]);

  it('TESTPIN: «StO RiE» kollabiert NICHT auf die kantonale Nummer', () => {
    const t = 'Nach der Steuerordnung Riehen [StO RiE, SG RiE 640.100] gilt § 22 StO RiE.';
    const z = loeseKantonZitate(t, 'BS', bestand);
    for (const x of z.zitate) expect(x.erlass).not.toBe('BS-640.100');
  });

  it('die Dominanz-Karte zählt die volle Nummer samt Präfix', () => {
    const dom = baueNummernDominanz(['(StO RiE, SG RiE 640.100)', '(StO RiE, SG RiE 640.100)'], 'BS');
    expect(dom.get('STORIE')).toBe('RiE 640.100');
  });
});

describe('B3 · gewicht ist in nicht messbaren Klassen null, nicht 0 (§8)', () => {
  it('der Typ lässt null zu, die Ladeschicht reicht es unverändert durch', () => {
    const s: BezugsShard = {
      erzeugt: '2026-07-28', erlass: 'OR', erlassEbene: 'bund',
      dokumente: {
        K: { zitierung: 'AGE BEZ.2020.1', regesteKurz: null, datum: '2020-01-01', facetten: { quelltyp: 'rechtsprechung', ebene: 'kanton', kanton: 'BS', gericht: 'bs_appellationsgericht', status: 'kantonal' } },
      },
      proArtikel: { '41': [{ key: 'K', gewicht: null }] },
      gesamtProArtikel: { '41': { kantonal: 5 } },
    };
    expect(bezuegeFuerArtikel(s, '41')[0].gewicht).toBeNull();
  });
});

describe('Ladeschicht · Auflösung, Filter und ehrliche Grundgesamtheit (§8)', () => {
  const shard: BezugsShard = {
    erzeugt: '2026-07-28', erlass: 'OR', erlassEbene: 'bund',
    dokumente: {
      A: { zitierung: 'BGE 1 I 1', regesteKurz: null, datum: '2020-01-01', facetten: { quelltyp: 'rechtsprechung', ebene: 'bund', kanton: 'CH', gericht: 'bge', status: 'bge' } },
      B: { zitierung: 'BGer 4A_1/2020', regesteKurz: null, datum: '2020-02-01', facetten: { quelltyp: 'rechtsprechung', ebene: 'bund', kanton: 'CH', gericht: 'bger', status: 'bger' } },
      C: { zitierung: 'AGE BEZ.2020.1', regesteKurz: null, datum: '2020-03-01', facetten: { quelltyp: 'rechtsprechung', ebene: 'kanton', kanton: 'BS', gericht: 'bs_appellationsgericht', status: 'kantonal' } },
    },
    proArtikel: { '41': [{ key: 'A', gewicht: 3 }, { key: 'B', gewicht: 0 }, { key: 'C', gewicht: 0 }] },
    gesamtProArtikel: { '41': { bge: 12, bger: 1, kantonal: 214 } },
  };

  it('löst Kanten gegen die Dokument-Tabelle auf', () => {
    expect(bezuegeFuerArtikel(shard, '41').map((b) => b.zitierung))
      .toEqual(['BGE 1 I 1', 'BGer 4A_1/2020', 'AGE BEZ.2020.1']);
  });

  it('überspringt einen Eintrag ohne Kopf, statt ihn halb zu rendern (§7)', () => {
    const kaputt = { ...shard, proArtikel: { '41': [{ key: 'FEHLT', gewicht: 0 }] } };
    expect(bezuegeFuerArtikel(kaputt, '41')).toEqual([]);
  });

  it('filtert je Achse; leere Auswahl schränkt nicht ein', () => {
    const alle = bezuegeFuerArtikel(shard, '41');
    expect(filtereBezuege(alle, {}).length).toBe(3);
    expect(filtereBezuege(alle, { status: new Set(['bge']) }).map((b) => b.key)).toEqual(['A']);
    expect(filtereBezuege(alle, { ebene: new Set(['kanton']) }).map((b) => b.key)).toEqual(['C']);
    expect(filtereBezuege(alle, { kanton: new Set(['BS']) }).map((b) => b.key)).toEqual(['C']);
  });

  it('weist je Status «gezeigt von gesamt» aus — nie nur das Gezeigte', () => {
    expect(trefferJeStatus(shard, '41')).toEqual([
      { status: 'bge', gezeigt: 1, gesamt: 12 },
      { status: 'bger', gezeigt: 1, gesamt: 1 },
      { status: 'kantonal', gezeigt: 1, gesamt: 214 },
    ]);
  });

  it('fehlende Grundgesamtheit wird gleichgesetzt, nie erfunden', () => {
    const ohne = { ...shard, gesamtProArtikel: {} };
    expect(trefferJeStatus(ohne, '41').every((t) => t.gesamt === t.gezeigt)).toBe(true);
  });
});

// ─── B7: Deckel aufgehoben, Ordnung chronologisch (David-Auftrag 28.7.2026) ──
//
// Diese Zusagen laufen gegen die AUSGELIEFERTEN Shards, nicht gegen Attrappen:
// prüfenswert ist nicht, dass eine Funktion tut, was sie tut, sondern dass das,
// was ein Nutzer bekommt, vollständig und chronologisch ist (§6, §7).
describe('B7 · Vollständigkeit und Ordnung der ausgelieferten Shards', () => {
  const bezugsShard = (erlass: string): BezugsShard =>
    JSON.parse(readFileSync(`public/rechtsprechung/bezuege/${erlass}.json`, 'utf8')) as BezugsShard;

  it('chronologische Ordnung: Datum absteigend, Unbekanntes ans Ende (rein, §2)', () => {
    expect(vergleicheDatumAbsteigend('2025-01-01', '2020-01-01')).toBeLessThan(0);
    expect(vergleicheDatumAbsteigend('2020-01-01', '2025-01-01')).toBeGreaterThan(0);
    expect(vergleicheDatumAbsteigend('2020-01-01', '2020-01-01')).toBe(0);
    // Ein Entscheid ohne Datum ist nicht «von 0001», er ist unbekannt — und
    // Unbekanntes besetzt nie die Spitze der Zeitachse (§8).
    expect(vergleicheDatumAbsteigend('', '2020-01-01')).toBeGreaterThan(0);
    expect(vergleicheDatumAbsteigend('2020-01-01', '')).toBeLessThan(0);
  });

  it('OR/41 — David-Befund: ALLE Kanten geliefert, keine mehr gedeckelt', () => {
    const s = bezugsShard('OR');
    const kanten = bezuegeFuerArtikel(s, '41');
    const je: Record<string, number> = {};
    for (const b of kanten) je[b.facetten.status] = (je[b.facetten.status] ?? 0) + 1;
    // Bis B6 standen hier 8 bge und 8 kantonale von 30 bzw. 21 (der Befund, der
    // den Auftrag ausgelöst hat: «dort sind nur ein teil der entscheide verlinkt»).
    expect(je).toEqual(s.gesamtProArtikel['41']);
    expect(je.bge).toBeGreaterThan(8);
  });

  it('jede Klasse jedes Artikels: geliefert == gesamtProArtikel (Stichprobe über 4 Erlasse)', () => {
    for (const erlass of ['OR', 'STPO', 'ZGB', 'BS-154.100']) {
      const s = bezugsShard(erlass);
      for (const [token, eintraege] of Object.entries(s.proArtikel)) {
        const je: Record<string, number> = {};
        for (const e of eintraege) {
          const st = s.dokumente[e.key]?.facetten.status;
          if (st) je[st] = (je[st] ?? 0) + 1;
        }
        expect({ erlass, token, je }).toEqual({ erlass, token, je: s.gesamtProArtikel[token] });
      }
    }
  });

  // §6.3-DEKLARATION (25.9.2026, QS-KORPUS BS-Delta): der Test verglich auch den
  // Platzhalter einer `datumUnbekannt`-Kante (1. Januar des GN-Jahrs) wie ein
  // echtes Datum — gegen die B-1-Regel des Generators (bezuege-bauen.ts, #1072:
  // unbekannt ans Klassenende). Unsichtbar, bis der erste datumUnbekannt-
  // Entscheid kam (BS DGS.2025.13; STPO/21 u.a. rot). Seither: die DATIERTEN
  // Kanten laufen monoton rückwärts, die unbekannten stehen hinter ihnen.
  // Gleiche Regel wie Tor T3g in scripts/normtext/check-bezuege.ts.
  it('innerhalb jeder Status-Klasse läuft die Zeit monoton rückwärts', () => {
    for (const erlass of ['OR', 'STPO', 'BGG']) {
      const s = bezugsShard(erlass);
      for (const [token, eintraege] of Object.entries(s.proArtikel)) {
        const jeKlasse = new Map<string, Array<{ datum: string; unbekannt: boolean }>>();
        for (const e of eintraege) {
          const k = s.dokumente[e.key];
          if (!k) continue;
          const liste = jeKlasse.get(k.facetten.status) ?? [];
          liste.push({ datum: k.datum, unbekannt: k.datumUnbekannt === true });
          jeKlasse.set(k.facetten.status, liste);
        }
        for (const [status, zs] of jeKlasse) {
          const daten = zs.filter((z) => !z.unbekannt).map((z) => z.datum);
          const unbekanntFolge = zs.map((z) => z.unbekannt);
          expect({ erlass, token, status, daten, unbekanntFolge }).toEqual({
            erlass, token, status, daten: [...daten].sort().reverse(),
            unbekanntFolge: [...unbekanntFolge].sort((a, b) => Number(a) - Number(b)),
          });
        }
      }
    }
  });
});

// ─── B7/c: die «Eidg.»-Facette — Diagnose und Ehrlichkeit ───────────────────
//
// David 28.7.2026: «Eidg. das scheint keine funktion zu haben?» Der Befund ist
// unten festgehalten, damit er nicht als Vermutung im Chat verloren geht: das
// Prädikat IST verdrahtet, die Klasse hat nur fast nirgends eine Kante. Wird
// eines der beiden je anders, meldet sich dieser Test.
describe('B7/c · «Eidg.» ist verdrahtet, aber korpusweit selten (§8)', () => {
  const bilanz = JSON.parse(
    readFileSync('public/rechtsprechung/bezuege-bilanz.json', 'utf8'),
  ) as { kantenJeStatus: Record<string, number>; artikelJeStatus: Record<string, number>;
        erlasseJeStatus: Record<string, number>; artikelGesamt: number; erlasseGesamt: number };

  it('BEFUND: die Klasse trägt korpusweit 159 Kanten an 88 von 6335 Artikeln', () => {
    // §6.3-DEKLARATION (25.9.2026, QS-KORPUS, Sperre AIMP/OCP/OS): damals 164
    // Kanten / 93 Artikel / 18 Erlasse. Die eidg-Klasse verliert die IRSG-Kanten
    // von bund/bstger/RR_2026_46 (it, nennt das IRSG nur als «AIMP», das seit der
    // Sperre nicht mehr auflöst — benannte Lücke, §8). Aussage des Tests steht.
    // §6.3-DEKLARATION (25.9.2026, QS-KORPUS Stichproben-Nachzug eidg. 3×5 +
    // ZH/BE je 6; SG/AG/GR wegen falschen Datums ausgenommen): eidg 159 → 404 Kanten, 88 → 184 Artikel, 17 → 25 Erlasse —
    // 15 neue BVGer/BStGer/BPatGer-Urteile (vorher 15, jetzt 30 eidg. Snapshots;
    // Asyl-/Ausländerrecht zitiert breit). Nullprobe origin/main 284deacdb = 159/88/17.
    // Die Klasse bleibt gegenüber kantonal (> 50 000) klein; die Aussage steht.
    expect(bilanz.kantenJeStatus.eidg).toBe(404);
    expect(bilanz.artikelJeStatus.eidg).toBe(184);
    expect(bilanz.erlasseJeStatus.eidg).toBe(25);
    // 6217 → 6228 (25.9.2026, W2·29-WERKBANK-LESER Welle 2 D2): die committeten
    // Bezugs-Projektionen hinkten dem Generator seit #860/#911 nach — der AVG
    // kam in den Normtext-Korpus, seine Kanten (11 Artikel, 1 Erlass) nie in
    // die Shards. Reine Projektions-Nachführung, die eidg-Werte bleiben gleich.
    // 6228 → 6352 (25.9.2026, QS-KORPUS BGE-Band-Nachzug 152, +80 BGE): die neuen
    // Leitentscheide zitieren 124 bisher unzitierte Artikel. Nullprobe origin/main
    // = 6228; eidg-Werte (164/93/18) unverändert — die Aussage des Tests steht.
    // 6352 → 6357 (25.9.2026, QS-KORPUS GERICHTS_KUERZEL «CV» → VRK, SR 0.111):
    // die bisher lautlos verlorenen CV-Zitate treffen fünf zusätzliche VRK-Artikel
    // (19, 24, 25, 30, 41; Sidecar struktur/bund/VRK.json). eidg-Werte unverändert.
    // 6357 → 6335 (25.9.2026, Sperre AIMP/OCP/OS): die Fehlzuordnungen an IRSG
    // (Beschaffungs-BGE), VKL (Jagd, V-StGB-MStGB) und AVO (Kartell) entfallen,
    // dazu die IRSG-Artikel von RR_2026_46 (s. oben).
    // 6335 → 6404 (25.9.2026, QS-KORPUS BS-Delta +185 neu / 41 aktualisiert): die
    // neuen BS-Urteile zitieren 69 bisher unzitierte Artikel (Bund + BS-Erlasse).
    // eidg-Werte (159/88/17) unverändert — die Aussage des Tests steht.
    // 6404 → 6431 (25.9.2026, Stichproben-Nachzug, s. oben): die 27 neuen Urteile
    // zitieren 27 bisher unzitierte Artikel. Nullprobe origin/main 284deacdb = 6404.
    expect(bilanz.artikelGesamt).toBe(6431);
    // Zum Vergleich, damit die Grössenordnung nicht im Ungefähren bleibt:
    expect(bilanz.kantenJeStatus.kantonal).toBeGreaterThan(50_000);
  });

  it('BEFUND: an Art. 41 OR — dem Artikel des Auftrags — hat sie null Kanten', () => {
    const s = JSON.parse(readFileSync('public/rechtsprechung/bezuege/OR.json', 'utf8')) as BezugsShard;
    expect(bezuegeFuerArtikel(s, '41').some((b) => b.facetten.status === 'eidg')).toBe(false);
    // KEIN Bug im Filter: dieselbe Auswahl findet an demselben Artikel die
    // Klassen, die es dort gibt. Das Prädikat arbeitet — es hat nur nichts.
    expect(waehleBezuege(bezuegeFuerArtikel(s, '41'), ['eidg'], [])).toEqual([]);
    expect(waehleBezuege(bezuegeFuerArtikel(s, '41'), ['bge'], []).length).toBeGreaterThan(0);
  });

  it('das Prädikat greift, wo es etwas gibt — Gegenprobe an einem eidg-tragenden Erlass', () => {
    const s = JSON.parse(readFileSync('public/rechtsprechung/bezuege/ASYLG.json', 'utf8')) as BezugsShard;
    const eidg = Object.keys(s.proArtikel)
      .flatMap((t) => waehleBezuege(bezuegeFuerArtikel(s, t), ['eidg'], []));
    expect(eidg.length).toBeGreaterThan(0);
    expect(eidg.every((b) => b.facetten.status === 'eidg')).toBe(true);
  });

  it('klassenImShard zählt je Klasse — Entscheide UND Fundstellen getrennt', () => {
    const s = JSON.parse(readFileSync('public/rechtsprechung/bezuege/OR.json', 'utf8')) as BezugsShard;
    const n = klassenImShard(s);
    // §6.3-DEKLARATION (25.9.2026, Stichproben-Nachzug): bis dahin trug das OR
    // keine eidg-Fundstelle (`n.eidg` undefined). Die neuen BPatGer-Urteile
    // (O2023_002/008, O2023_017, S2025_003) zitieren das OR: 3 Entscheide, 4 Kanten.
    expect(n.eidg).toEqual({ dokumente: 3, kanten: 4 });
    // Die frühere Aussage «0 Fundstellen ⇒ gar kein Eintrag» bleibt geprüft:
    for (const z of Object.values(n)) expect(z.kanten).toBeGreaterThan(0);
    expect(n.bge!.dokumente).toBeGreaterThan(0);
    // Summe der KANTEN == Kanten des Shards (keine doppelte Zählung).
    const summe = Object.values(n).reduce((a, b) => a + b.kanten, 0);
    const kanten = Object.values(s.proArtikel).reduce((a, e) => a + e.length, 0);
    expect(summe).toBe(kanten);
    // Und die Entscheide sind NIE mehr als die Fundstellen — je Klasse.
    for (const z of Object.values(n)) expect(z.dokumente).toBeLessThanOrEqual(z.kanten);
  });

  it('BEFUND I1 (Gegenprüfung R1): Fundstellen ≠ Entscheide, gemessen am BGG', () => {
    // Der Schalter beschriftete bis zur Gegenprüfung die KANTEN als «Entscheide».
    // Am einzelnen Artikel ist das dasselbe, über einen Erlass nicht — hier steht
    // die Zahl, die es widerlegt hat (§8): ursprünglich 10'559 gegen 1'253, Faktor
    // 8,4, bei einem Korpus von insgesamt 1'259 BGE. Kanten-Zahl EINMALIG
    // nachgezogen (12.9.2026, PR #816, W2·18-FEHLERBUCH): die aza-Auflösung von
    // 151 I 73/151 II 710/152 V 20 (vorher Auszug-only) brachte deren echte
    // BGG-Zitate hinzu, die Basis-Body-Konflation von 152 V 2 (fälschlich
    // 152-V-20-Inhalt, u.a. BGG-Zitate) wurde entfernt — keine Rechenlogik-
    // Änderung, reine Datenkorrektur; dokumente 1253 → 1254 (zwei aza-Volltexte
    // zitieren BGG neu als eigenständiges Dokument, einer weniger durch die
    // entfernte Fremdkontamination — netto +1).
    // ZWEITE Nachführung (25.9.2026, Welle 2 D2 / Befund E-1): Artikel, die ein
    // BGE nur in einer NICHT amtlich publizierten Erwägung seines Volltext-
    // Urteils nennt, hängen nicht mehr am BGE, sondern am Urteil (Klasse bger,
    // «nicht publ. in BGE …»). Beim BGG trifft das den Grossteil — Eintretens-
    // fragen (E. 1) stehen fast nie im publizierten Auszug. Die Aussage des
    // Tests bleibt: Fundstellen ≠ Entscheide, in BEIDEN Klassen.
    // DRITTE Nachführung (25.9.2026, QS-KORPUS BGE-Band-Nachzug 152, +80 BGE mit
    // aza-Volltext): damals bge 1565/525 · bger 9205/1235 (Nullprobe origin/main);
    // seither bge 1647/559 · bger 9920/1314 — reiner Korpus-Zuwachs, keine
    // Rechenlogik-Änderung; Faktor Fundstellen/Entscheide bleibt in beiden Klassen > 2.
    const s = JSON.parse(readFileSync('public/rechtsprechung/bezuege/BGG.json', 'utf8')) as BezugsShard;
    const n = klassenImShard(s);
    expect(n.bge!.kanten).toBe(1647);
    expect(n.bge!.dokumente).toBe(559);
    expect(n.bger!.kanten).toBe(9920);
    expect(n.bger!.dokumente).toBe(1314);
  });
});
