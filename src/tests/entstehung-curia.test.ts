// E4 «Entstehung am Artikel» (§11.4/§11.6/§11.8): Parlaments-Etappen aus Curia Vista.
//
// Die drei Sätze, die hier fachlich falsch werden können und darum Tests haben:
//  · Personendaten dürfen weder gespeichert NOCH ABGEFRAGT werden (§11.8, Entscheid
//    David 11.9.2026 Nr. 2) — geprüft wird die $select-Liste des Generators, nicht nur
//    das Ergebnis.
//  · Ein unbekannter Decision-Code darf nie in einen Sammeltopf fallen (§2, Kritik A18).
//  · Für den Ständerat wird nie eine Stimmenzahl behauptet (Entscheid Nr. 3): `Voting`
//    hat kein Council-Feld, der Rat ist nur über die Grösse plausibel.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  odataZeilen, odataDatum, aggregiereStimmen, ratAusGroesse, DECISION_CODES,
  baueKommissionen, baueBeschluesse, bauePublikationen, schlussabstimmungsVotes,
  serialisiereShard, curiaUrl, VERBOTENE_FELDER, SCHLUSSABSTIMMUNG_RE,
  type CuriaShard, type OdataZeile,
} from '../../scripts/entstehung/curia';

describe('OData-Hülle und Datumsform', () => {
  it('akzeptiert beide live belegten Antwortformen', () => {
    expect(odataZeilen({ d: [{ a: 1 }] })).toEqual([{ a: 1 }]);
    expect(odataZeilen({ d: { results: [{ a: 1 }] } })).toEqual([{ a: 1 }]);
  });

  it('wirft bei unerwarteter Form, statt sie als «keine Treffer» zu lesen (§6.7 lit. b)', () => {
    expect(() => odataZeilen({ value: [] })).toThrow(/unerwartete OData-Antwortform/);
    expect(() => odataZeilen({ d: { x: 1 } })).toThrow(/unerwartete OData-Antwortform/);
  });

  it('wirft bei «__next» statt die Folgeseiten still zu verlieren (Paging-Wächter)', () => {
    // Gemessen 21.9.2026: der Endpunkt paginiert bei 1000 Zeilen. Der Client kann kein
    // Paging — eine abgeschnittene Antwort muss darum LAUT scheitern, nie stumm kürzen.
    expect(() => odataZeilen({
      d: { results: [{ a: 1 }], __next: 'https://ws.parlament.ch/odata.svc/Objective?$skip=1000' },
    })).toThrow(/UNVOLLSTÄNDIG/);
    expect(() => odataZeilen({ d: { results: [], __next: 'x' } }, 'Objective (01.023)'))
      .toThrow(/für Objective \(01\.023\)/);
    // Ohne `__next` bleibt dieselbe Antwortform gültig — der Wächter darf nicht falsch-rot sein.
    expect(odataZeilen({ d: { results: [{ a: 1 }] } })).toEqual([{ a: 1 }]);
  });

  it('wandelt /Date(ms)/ nach ISO und rät nie', () => {
    expect(odataDatum('/Date(1505433600000)/')).toBe('2017-09-15');
    expect(odataDatum('/Date(1538092800000)/')).toBe('2018-09-28');
    expect(odataDatum('2017-09-15')).toBeNull();
    expect(odataDatum(null)).toBeNull();
  });
});

describe('Decision-Codes — feste, live belegte Tabelle (Kritik A18)', () => {
  it('deckt genau die acht am 11.9.2026 belegten Codes ab', () => {
    expect(Object.keys(DECISION_CODES).map(Number).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(DECISION_CODES[3].amtlich).toBe('Enthaltung');
    expect(DECISION_CODES[4].amtlich).toBe('Anwesend');
  });

  it('aggregiert die DSG-Schlussabstimmung (25.9.2020) summenrein', () => {
    const z: OdataZeile[] = [
      ...Array.from({ length: 141 }, () => ({ Decision: 1 })),
      ...Array.from({ length: 54 }, () => ({ Decision: 2 })),
      { Decision: 3 }, { Decision: 5 }, { Decision: 5 }, { Decision: 6 }, { Decision: 7 },
    ];
    const a = aggregiereStimmen(z);
    expect(a.ja).toBe(141);
    expect(a.nein).toBe(54);
    expect(a.enthaltung).toBe(1);
    expect(a.total).toBe(200);
    const summe = a.ja + a.nein + a.enthaltung + a.anwesend + a.nichtTeilgenommen
      + a.entschuldigt + a.praesidiumStimmtNicht + a.demissioniert;
    expect(summe).toBe(a.total);
  });

  it('macht einen unbekannten Code ROT, statt ihn zu verbuchen (§2)', () => {
    expect(() => aggregiereStimmen([{ Decision: 9, DecisionText: 'Neu' }]))
      .toThrow(/unbekannter Voting.Decision-Code 9/);
  });
});

describe('Ratszuordnung — nie eine Ständerats-Zahl behaupten (Entscheid Nr. 3)', () => {
  it('nennt den Nationalrat nur bei plausibler NR-Grösse', () => {
    expect(ratAusGroesse(200)).toBe('Nationalrat');
    expect(ratAusGroesse(199)).toBe('Nationalrat');
    expect(ratAusGroesse(46)).toBeNull();
    expect(ratAusGroesse(0)).toBeNull();
    expect(ratAusGroesse(240)).toBeNull();
  });
});

describe('Schlussabstimmung sprachübergreifend erkennen (R4 §2: Subject ist nicht sprachrein)', () => {
  it('trifft DE, FR und IT', () => {
    for (const s of ['Schlussabstimmung', 'Vote final', 'Votazione finale']) {
      expect(SCHLUSSABSTIMMUNG_RE.test(s)).toBe(true);
    }
    expect(SCHLUSSABSTIMMUNG_RE.test('Abstimmung über den Ordnungsantrag')).toBe(false);
  });

  it('dedupliziert und sortiert die Vote-IDs deterministisch', () => {
    const v = schlussabstimmungsVotes([
      { ID: 25260, Subject: 'Vote final', VoteEnd: '/Date(1601026593318)/', BillNumber: 3 },
      { ID: 21464, Subject: 'Schlussabstimmung', VoteEnd: '/Date(1538130211542)/', BillNumber: 1 },
      { ID: 21464, Subject: 'Schlussabstimmung', VoteEnd: '/Date(1538130211542)/', BillNumber: 1 },
      { ID: 30000, Subject: 'Gesamtabstimmung', VoteEnd: '/Date(1538130211542)/', BillNumber: 1 },
    ]);
    expect(v.map((x) => x.id)).toEqual([21464, 25260]);
    expect(v[0].datum).toBe('2018-09-28');
  });
});

describe('Parse-Funktionen — deterministisch und wörtlich (Curia-Auflage)', () => {
  it('Kommissionen: Organ, nie Person; dedupliziert und sortiert', () => {
    const k = baueKommissionen([
      { CommitteeName: 'Staatspolitische Kommission Ständerat', Abbreviation1: 'SPK-S', PreconsultationDate: '/Date(1505433600000)/' },
      { CommitteeName: 'Staatspolitische Kommission Nationalrat', Abbreviation1: 'SPK-N', PreconsultationDate: '/Date(1505433600000)/' },
      { CommitteeName: 'Staatspolitische Kommission Nationalrat', Abbreviation1: 'SPK-N', PreconsultationDate: '/Date(1505433600000)/' },
    ]);
    expect(k.map((x) => x.kuerzel)).toEqual(['SPK-N', 'SPK-S']);
    expect(Object.keys(k[0]).sort()).toEqual(['datum', 'kuerzel', 'name']);
  });

  it('Beschlüsse: ResolutionText wörtlich, Vorlage über die Bill-Zuordnung', () => {
    const b = baueBeschluesse(
      [{ ResolutionText: 'Beschluss abweichend vom Entwurf', ResolutionDate: '/Date(1528761600000)/', CouncilName: 'Nationalrat', CouncilAbbreviation: 'NR', IdBill: 'x' }],
      new Map([['x', 1]]),
    );
    expect(b).toEqual([{ datum: '2018-06-12', rat: 'Nationalrat', ratKuerzel: 'NR', text: 'Beschluss abweichend vom Entwurf', vorlage: 1 }]);
  });

  it('Publikationen: der literale String «null» zählt als fehlender Wert, nie als Text', () => {
    const p = bauePublikationen([{
      PublicationDate: '/Date(1565913600000)/', PublicationTypeName: 'Bundesblatt',
      PublicationYear: 'null', PublicationNumber: 'null', ReferenceText: 'Entwurf der SPK-N',
      ReferendumDeadline: null,
    }]);
    expect(p[0].jahr).toBeNull();
    expect(p[0].nummer).toBeNull();
    expect(p[0].text).toBe('Entwurf der SPK-N');
  });

  // ── Publikationen: der Dedupe-Schlüssel MUSS `ReferenceText` führen ──────────────
  // Befund 21.9.2026: ohne ihn kollabierten am Geschäft 01.023 32 amtliche
  // Objective-Zeilen auf 21 — alte BBl-Fundstellen tragen weder Jahr noch Nummer,
  // dort ist `ReferenceText` das einzige unterscheidende Feld.
  it('Publikationen: gleiches Datum, kein Jahr/Nummer, anderer Text ⇒ ZWEI Fundstellen', () => {
    const p = bauePublikationen([
      {
        PublicationDate: '/Date(1214352000000)/', PublicationTypeName: 'Bundesblatt',
        PublicationYear: 'null', PublicationNumber: 'null',
        ReferenceText: 'Bundesgesetz über die Mehrwertsteuer (Mehrwertsteuergesetz, MWSTG)',
        ReferendumDeadline: null,
      },
      {
        PublicationDate: '/Date(1214352000000)/', PublicationTypeName: 'Bundesblatt',
        PublicationYear: 'null', PublicationNumber: 'null',
        ReferenceText: 'Bundesbeschluss über die Vereinfachung der Mehrwertsteuer',
        ReferendumDeadline: null,
      },
    ]);
    expect(p).toHaveLength(2);
    expect(p.map((x) => x.text)).toEqual([
      'Bundesbeschluss über die Vereinfachung der Mehrwertsteuer',
      'Bundesgesetz über die Mehrwertsteuer (Mehrwertsteuergesetz, MWSTG)',
    ]);
  });

  // ── Der Kernfall der zweiten Runde: NUR die Vorlage unterscheidet ───────────────
  // Berichtigung zur ersten Runde (F8 — der alte Satz bleibt lesbar): dort hiess es,
  // 08.053 liefere «zwei Fundstellen je dreifach byte-gleich». Das war mit dem
  // Sechs-Feld-Schlüssel gemessen und darum falsch. Der Vollzensus aller 14 669
  // DE-Objective-Zeilen (21.9.2026) zeigt: an 08.053 sind alle 12 Zeilen verschieden,
  // sie unterscheiden sich AUSSCHLIESSLICH in `BillNumber` (03.047: 17 statt 14).
  it('Publikationen: gleiche Fundstelle zu DREI Entwürfen ⇒ DREI Publikationen', () => {
    const basis = {
      PublicationDate: '/Date(1214352000000)/', PublicationTypeName: 'Bundesblatt',
      PublicationYear: 'null', PublicationNumber: 'null',
      ReferenceText: 'Bundesgesetz über die Mehrwertsteuer (Mehrwertsteuergesetz, MWSTG)',
      ReferendumDeadline: null,
    };
    const p = bauePublikationen([
      { ...basis, BillNumber: 2 },
      { ...basis, BillNumber: 1 },
      { ...basis, BillNumber: 3 },
    ]);
    expect(p).toHaveLength(3);
    expect(p.map((x) => x.vorlage)).toEqual([1, 2, 3]);
  });

  it('Publikationen: `vorlage` kommt aus zahl(), nie aus txt() — BillNumber ist ein int', () => {
    // DIE MESSFALLE, an der ein naiver Fix wirkungslos durchginge: `BillNumber` ist in
    // 14 669 von 14 669 DE-Objective-Zeilen `typeof 'number'` (Vollzensus 21.9.2026).
    // `txt()` prüft `typeof v === 'string'` und lieferte deshalb für JEDE Zeile `null` —
    // der Schlüssel bliebe unverändert, der Fix sähe trotzdem nach Fix aus. Dieser Test
    // wird bei `txt(z.BillNumber)` doppelt rot: `vorlage` wäre null statt 7, und die drei
    // Zeilen fielen wieder auf eine zusammen.
    const basis = {
      PublicationDate: '/Date(1214352000000)/', PublicationTypeName: 'Bundesblatt',
      PublicationYear: 'null', PublicationNumber: 'null',
      ReferenceText: 'Entwurf der SPK-N', ReferendumDeadline: null,
    };
    const p = bauePublikationen([{ ...basis, BillNumber: 7 }]);
    expect(p[0].vorlage).toBe(7);
    expect(typeof p[0].vorlage).toBe('number');
    expect(bauePublikationen([
      { ...basis, BillNumber: 7 }, { ...basis, BillNumber: 8 }, { ...basis, BillNumber: 9 },
    ])).toHaveLength(3);
  });

  it('Publikationen: Vorlage 2 steht vor Vorlage 10 (Padding im Vergleicher)', () => {
    // Ohne Padding verglichen die JSON-Tupel als Text: «10» käme vor «2».
    const basis = {
      PublicationDate: '/Date(1214352000000)/', PublicationTypeName: 'Bundesblatt',
      PublicationYear: 'null', PublicationNumber: 'null',
      ReferenceText: 'Entwurf', ReferendumDeadline: null,
    };
    const p = bauePublikationen([{ ...basis, BillNumber: 10 }, { ...basis, BillNumber: 2 }]);
    expect(p.map((x) => x.vorlage)).toEqual([2, 10]);
  });

  it('Publikationen: umgekehrte Eingabereihenfolge ⇒ byte-gleiche Ausgabe, auch über Vorlagen (§2)', () => {
    const basis = {
      PublicationDate: '/Date(1214352000000)/', PublicationTypeName: 'Bundesblatt',
      PublicationYear: 'null', PublicationNumber: 'null', ReferendumDeadline: null,
    };
    const zeilen: OdataZeile[] = [
      { ...basis, ReferenceText: 'B-Vorlage', BillNumber: 2 },
      { ...basis, ReferenceText: 'A-Vorlage', BillNumber: 3 },
      { ...basis, ReferenceText: 'B-Vorlage', BillNumber: 1 },
      { ...basis, ReferenceText: 'A-Vorlage', BillNumber: 1 },
    ];
    const vorwaerts = JSON.stringify(bauePublikationen(zeilen));
    expect(JSON.stringify(bauePublikationen([...zeilen].reverse()))).toBe(vorwaerts);
    expect(JSON.parse(vorwaerts)).toHaveLength(4);
  });

  it('Publikationen: eine byte-gleich doppelte Zeile bleibt EINE Fundstelle', () => {
    // Der Dedupe bleibt wirksam: ECHTE Doppellieferungen existieren korpusweit an den
    // Geschäften 22.417, 26.023 und 19.464 (vier Zeilen, Vollzensus 21.9.2026) — nur
    // trägt keines davon heute einen Shard. Eine wirklich doppelt gelieferte Zeile ist
    // eine Wiederholung, keine zweite Fundstelle.
    const zeile: OdataZeile = {
      PublicationDate: '/Date(1214352000000)/', PublicationTypeName: 'Bundesblatt',
      PublicationYear: 'null', PublicationNumber: 'null',
      ReferenceText: 'Bundesbeschluss über die Vereinfachung der Mehrwertsteuer',
      ReferendumDeadline: null, BillNumber: 1,
    };
    expect(bauePublikationen([zeile, { ...zeile }, { ...zeile }])).toHaveLength(1);
  });

  it('Publikationen: umgekehrte Eingabereihenfolge ⇒ byte-gleiche Ausgabe (§2)', () => {
    // Ohne Tiebreaker im Vergleicher hing die Reihenfolge an der Zeilenfolge der
    // Endpunkt-Antwort — unsichtbar, solange der Schlüssel die Gleichstände wegwarf.
    const zeilen: OdataZeile[] = [
      { PublicationDate: '/Date(1214352000000)/', PublicationTypeName: 'Bundesblatt', PublicationYear: 'null', PublicationNumber: 'null', ReferenceText: 'C-Vorlage', ReferendumDeadline: null },
      { PublicationDate: '/Date(1214352000000)/', PublicationTypeName: 'Amtliche Sammlung', PublicationYear: 'null', PublicationNumber: 'null', ReferenceText: 'A-Vorlage', ReferendumDeadline: null },
      { PublicationDate: '/Date(1214352000000)/', PublicationTypeName: 'Bundesblatt', PublicationYear: 'null', PublicationNumber: 'null', ReferenceText: 'B-Vorlage', ReferendumDeadline: '/Date(1219363200000)/' },
      { PublicationDate: '/Date(1214352000000)/', PublicationTypeName: 'Bundesblatt', PublicationYear: 'null', PublicationNumber: 'null', ReferenceText: 'B-Vorlage', ReferendumDeadline: null },
    ];
    const vorwaerts = JSON.stringify(bauePublikationen(zeilen));
    const rueckwaerts = JSON.stringify(bauePublikationen([...zeilen].reverse()));
    expect(vorwaerts).toBe(rueckwaerts);
    expect(JSON.parse(vorwaerts)).toHaveLength(4);
  });

  it('Publikationen: ein «|» im Freitext verschmilzt keine Fundstellen (JSON-Tupel statt Join)', () => {
    const zeilen: OdataZeile[] = [
      { PublicationDate: '/Date(1214352000000)/', PublicationTypeName: 'Bundesblatt', PublicationYear: 'null', PublicationNumber: 'null', ReferenceText: 'a|b', ReferendumDeadline: null },
      { PublicationDate: '/Date(1214352000000)/', PublicationTypeName: 'Bundesblatt', PublicationYear: 'null', PublicationNumber: 'null', ReferenceText: 'a', ReferendumDeadline: null },
      { PublicationDate: '/Date(1214352000000)/', PublicationTypeName: 'Bundesblatt|null', PublicationYear: 'null', PublicationNumber: 'null', ReferenceText: 'b', ReferendumDeadline: null },
    ];
    expect(bauePublikationen(zeilen)).toHaveLength(3);
  });

  it('baut den amtlichen Deep-Link aus der Geschäftsnummer', () => {
    expect(curiaUrl('17.059')).toContain('AffairId=20170059');
    expect(curiaUrl('1999.093')).toContain('AffairId=19990093');
    expect(curiaUrl('kaputt')).toBeNull();
  });
});

describe('Personendaten-Grenze (§11.8) — im Generator, nicht erst im Artefakt', () => {
  const runner = readFileSync('scripts/entstehung/curia-run.ts', 'utf8');

  it('die Voting-Abfrage holt genau IdVote, Decision, DecisionText', () => {
    expect(runner).toContain("'IdVote,Decision,DecisionText'");
  });

  it('nennt kein verbotenes Feld in irgendeiner $select-Liste', () => {
    for (const feld of VERBOTENE_FELDER) {
      expect(runner.includes(`,${feld}`)).toBe(false);
      expect(runner.includes(`'${feld}`)).toBe(false);
    }
  });

  it('der Shard-Typ selbst führt kein Personenfeld', () => {
    const shard: CuriaShard = {
      nummer: '17.059', titel: null, geschaeftstyp: null, status: null, eingereicht: null,
      erstrat: null, quelleUrl: 'x', quellenangabe: 'Parlamentsdienste der Bundesversammlung, Bern',
      abgerufen: '2026-09-11', kommissionen: [], beschluesse: [], publikationen: [], schlussabstimmungen: [],
    };
    const roh = serialisiereShard(shard);
    for (const feld of VERBOTENE_FELDER) expect(roh).not.toContain(`"${feld}"`);
    expect(roh.endsWith('\n')).toBe(true);
  });
});
