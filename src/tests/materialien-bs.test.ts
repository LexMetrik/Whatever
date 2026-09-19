// K-16 (W2·13-KANTONE-DATEN): die Materialien des Grossen Rates Basel-Stadt.
//
// Geprüft wird, was fachlich FALSCH werden kann (§6.7) — nicht, dass der Code läuft:
//   · eine maschinelle Zuordnung, die sich als amtlich ausgibt (§8);
//   · eine Zuordnung aus blosser Datumsgleichheit (belegte Kollision 161.100/162.100);
//   · ein Verfahrensschritt, dessen Etikett geraten statt zitiert ist (§1/§2);
//   · ein BS-Code, der als Bundes-Code gelesen wird (zwei Vokabulare, ein Feld);
//   · Personendaten im ausgelieferten Bestand;
//   · eine Reihenfolge, die vom Eingabe-Zufall abhängt (§2 Determinismus).
import { describe, it, expect } from 'vitest';
import {
  baueKanten, baueEreignisse, baueBsEintraege, serialisiere, flexMuster, normTitel,
  fussnotenGeschaefte, sgAngaben, datumsAngaben, erlassDatum, keyAusSignatur, standVon,
  VERBOTENE_FELDER, VORSTOSS_TITEL, doktypVonGeschaeftsart, DOKTYP_BS, vergleicheBsDokumente, cu,
  type BsErlassStamm,
} from '../../scripts/materialien/bs-materialien';
import type { BsGeschaeft, BsDokument } from '../../scripts/materialien/adapter-bs-grossrat';
import { FELDER_GESCHAEFT, FELDER_DOKUMENT } from '../../scripts/materialien/adapter-bs-grossrat';
import {
  BS_GROSSRAT, bsCodeVonBezeichnung, verfahrensTypVonCode, verfahrensLabel, verfahrensQuelleUrl,
} from '../lib/materialien/verfahren';
import { BS_MATERIALIEN } from '../lib/materialien/bs-grossrat.generated';

// ── Hilfen: die echten Daten der Vormessung (12.9.2026), gekürzt ─────────────
const erlass = (key: string, titel: string, erlassdatum: string, extra: Partial<BsErlassStamm> = {}): BsErlassStamm => ({
  key, sg: key.slice(3), titel, erlassdatum, stichworte: [], kategorie: 'Gesetz',
  fussnotenGeschaefte: [], ...extra,
});
const geschaeft = (signatur: string, titel: string, art = 'Ratschlag'): BsGeschaeft => ({
  signatur_ges: signatur, titel_ges: titel, ga_rr_gr: art, beginn_ges: '2020-01-01',
  ende_ges: null, status_ges: 'Abgeschlossen', url_ges: `https://grosserrat.bs.ch/?gnr=${signatur}`,
  departement_ges: null,
});
const dok = (ges: string, bez: string, datum: string, url?: string): BsDokument => ({
  signatur_ges: ges, signatur_dok: `${ges}.01`, titel_dok: bez, dokudatum: datum,
  url_dok: url ?? `https://grosserrat.bs.ch/?dnr=${ges}.01`,
});

describe('Zuordnung Erlass ↔ Geschäft — die Datumsfalle', () => {
  // ROT-BEWEIS (echter Fall der Vormessung): BS-161.100 «Gesetz über die Haftung des
  // Staates und seines Personals» und BS-162.100 «Personalgesetz» tragen BEIDE das
  // Erlassdatum 17. November 1999. Ein Geschäft, das nur das Datum nennt, darf
  // deshalb nie beiden zufallen — sonst behauptete die App eine Materialie zum
  // falschen Gesetz.
  const haftung = erlass('BS-161.100', 'Gesetz über die Haftung des Staates und seines Personals', 'Vom 17. November 1999 (Stand 1. Januar 2020)');
  const personal = erlass('BS-162.100', 'Personalgesetz', 'Vom 17. November 1999 (Stand 1. Januar 2025)');
  const g = geschaeft('25.1370', 'Teilrevision des Personalgesetzes vom 17. November 1999 (SG 162.100) betreffend Ferien', 'Bericht');

  it('verbindet nur den Erlass, dessen Titel im Geschäftstitel steht', () => {
    const kanten = baueKanten([g], [haftung, personal]);
    expect(kanten.map((k) => k.erlass)).toEqual(['BS-162.100']);
  });

  it('lässt das gleiche Datum allein NICHT genügen', () => {
    const nurDatum = geschaeft('99.9999', 'Ratschlag betreffend irgendetwas vom 17. November 1999');
    expect(baueKanten([nurDatum], [haftung, personal])).toEqual([]);
  });

  it('nimmt den Genitiv mit («Lohngesetz» ↔ «des Lohngesetzes»), ohne Wortgrenzen aufzugeben', () => {
    const m = flexMuster('lohngesetz');
    expect(m.test(normTitel('Teilrevision des Lohngesetzes vom 18. Januar 1995'))).toBe(true);
    expect(m.test(normTitel('Änderung betreffend Lohngesetz'))).toBe(true);
    // Kein Substring-Treffer: «Lohnmeldepflicht» enthält «Lohn», nicht «Lohngesetz».
    expect(m.test(normTitel('Ratschlag zur Lohnmeldepflicht'))).toBe(false);
  });

  it('erkennt die SG-Nummer im amtlichen Titel als eigenen Weg', () => {
    expect(sgAngaben('Teilrevision des Personalgesetzes vom 17. November 1999 (SG 162.100) betreffend Ferien')).toEqual(['162.100']);
    expect(sgAngaben('Ratschlag ohne Nummer')).toEqual([]);
  });

  it('liest das Erlassdatum auch ohne Leerzeichen («vom 12.Oktober 1967»)', () => {
    expect(datumsAngaben(normTitel('Ratschlag zur Änderung des Gesetzes betreffend Ausbildungsbeiträge vom 12.Oktober 1967')))
      .toEqual([{ tag: 12, monat: 'oktober', jahr: '1967' }]);
    expect(erlassDatum('Vom 12. April 2000 (Stand 1. September 2025)')).toEqual({ tag: 12, monat: 'april', jahr: '2000' });
    expect(erlassDatum('Ohne Datum')).toBeNull();
  });
});

describe('Herkunft — amtlich ist nur die Fussnote', () => {
  // Der amtliche Schlüssel, verifiziert gegen data.bs.ch 100313 (Vormessung §2.1):
  // die Fussnote von BS-132.100 nennt «Ratschlag Nr. 06.1970.01» = signatur_dok.
  it('liest die Geschäftsnummer aus der Fussnote der Gesetzessammlung', () => {
    const fussnote = 'Ingress in der Fassung des GRB vom 27. 6. 2007 (wirksam seit 13. 9. 2007; '
      + 'Ratschlag Nr. 06.1970.01, Kommissionsbericht Nr. 06.1970.02 ).';
    expect(fussnotenGeschaefte(fussnote)).toEqual(['06.1970']);
  });

  it('lässt einen blossen Querverweis NICHT als Geschäftsnummer durchgehen', () => {
    expect(fussnotenGeschaefte('SG 640.100.')).toEqual([]);
    expect(fussnotenGeschaefte('Wirksam seit 1. 1. 2024.')).toEqual([]);
  });

  it('stuft eine Fussnoten-Kante als amtlich ein, alle anderen als maschinell', () => {
    const e = erlass('BS-132.100', 'Gesetz über Wahlen und Abstimmungen', 'Vom 21. April 1994 (Stand 2025)', {
      fussnotenGeschaefte: ['06.1970'],
    });
    const kanten = baueKanten([geschaeft('06.1970', 'Ratschlag und Entwurf zu Änderungen des Gesetzes über Wahlen und Abstimmungen')], [e]);
    expect(kanten).toEqual([{ geschaeft: '06.1970', erlass: 'BS-132.100', quelle: 'amtlich', regel: 'fussnote', beleg: '06.1970' }]);
  });

  it('lässt den amtlichen Beleg nicht von einer maschinellen Regel verdrängen', () => {
    // Dasselbe Geschäft ist über die Fussnote UND über Datum+Titel erreichbar.
    // Bleiben muss der stärkere Beleg — sonst verlöre die App einen amtlichen Nachweis.
    const e = erlass('BS-132.100', 'Gesetz über Wahlen und Abstimmungen', 'Vom 21. April 1994 (Stand 2025)', {
      fussnotenGeschaefte: ['24.1692'],
    });
    const g = geschaeft('24.1692', 'Ratschlag betreffend Änderung des Gesetzes über Wahlen und Abstimmungen vom 21. April 1994');
    const kanten = baueKanten([g], [e]);
    expect(kanten).toHaveLength(1);
    expect(kanten[0].quelle).toBe('amtlich');
    expect(kanten[0].regel).toBe('fussnote');
  });

  it('nimmt ein Geschäft ausserhalb der Vorlage-Arten NUR über die Fussnote auf', () => {
    const e = erlass('BS-119.500', 'Gesetz über kantonale Volksinitiativen', 'Vom 1. Januar 1990 (Stand 2020)', {
      fussnotenGeschaefte: ['21.1247'],
    });
    const initiative = geschaeft('21.1247', 'Initiative betreffend irgendetwas', 'Initiative');
    expect(baueKanten([initiative], [e]).map((k) => k.regel)).toEqual(['fussnote']);
    // ohne Fussnote: gar keine Kante, auch wenn der Titel passte
    const ohne = erlass('BS-119.500', 'Gesetz über kantonale Volksinitiativen', 'Vom 1. Januar 1990 (Stand 2020)');
    const passend = geschaeft('21.1247', 'Änderung des Gesetzes über kantonale Volksinitiativen vom 1. Januar 1990', 'Initiative');
    expect(baueKanten([passend], [ohne])).toEqual([]);
  });
});

describe('Doktyp — die amtliche Geschäftsart, nie binär (Gegenprüfung PR #799)', () => {
  // BEFUND der Gegenprüfung 12.9.2026 (§1/§8): die Ableitung war
  // `ga_rr_gr === 'Ratschlag' ? 'ratschlag' : 'gr-bericht'` — alles, was kein
  // Ratschlag ist, wurde zum «Bericht». Geschäft 21.1247 ist amtlich eine
  // «Initiative» («Kantonale Volksinitiative ‹1% gegen globale Armut›») und trug
  // im Register das Etikett «Bericht an den Grossen Rat». Die Karte hätte dem
  // Nutzer damit eine falsche Rechtsnatur angezeigt — §1: zwei rechtlich
  // verschiedene Dinge nie stillschweigend gleich behandeln.
  const initiativErlass = erlass('BS-119.500', 'Gesetz über die internationale Zusammenarbeit zwecks Armutsbekämpfung', 'Vom 14. Mai 2025 (Stand 2026)', {
    fussnotenGeschaefte: ['21.1247'],
  });
  const initiative = geschaeft('21.1247', 'Kantonale Volksinitiative "1% gegen globale Armut"', 'Initiative');

  it('führt eine Initiative als Initiative, nicht als Bericht', () => {
    const e = baueBsEintraege([initiative], baueKanten([initiative], [initiativErlass]), baueEreignisse([dok('21.1247', 'Ratschlag des RR', '2022-05-04')]).jeGeschaeft);
    expect(e).toHaveLength(1);
    expect(e[0].doktyp).toBe('gr-initiative');
  });

  it('bildet jede belegte Geschäftsart auf einen eigenen Doktyp ab', () => {
    expect(doktypVonGeschaeftsart('Ratschlag')).toBe('ratschlag');
    expect(doktypVonGeschaeftsart('Bericht')).toBe('gr-bericht');
    expect(doktypVonGeschaeftsart('Ausgabenbericht')).toBe('gr-ausgabenbericht');
    expect(doktypVonGeschaeftsart('Initiative')).toBe('gr-initiative');
  });

  it('rät NICHT bei einer unbekannten Geschäftsart (§2: Vokabular-Zuwachs ist rot)', () => {
    expect(() => doktypVonGeschaeftsart('Anzug')).toThrow(/unbekannte Geschäftsart/);
    expect(() => doktypVonGeschaeftsart('')).toThrow(/unbekannte Geschäftsart/);
  });

  it('trägt im ausgelieferten Bestand je Eintrag den Doktyp seiner amtlichen Art', () => {
    for (const m of BS_MATERIALIEN) {
      expect(DOKTYP_BS, m.key).toContain(m.doktyp);
    }
    // Nulltest (§6.7): der Bestand enthält den Fall, um den es geht.
    expect(BS_MATERIALIEN.map((m) => m.key)).toContain('BS-GR-21.1247');
    expect(BS_MATERIALIEN.find((m) => m.key === 'BS-GR-21.1247')?.doktyp).toBe('gr-initiative');
  });
});

describe('Verfahrenskette BS — zitieren statt raten', () => {
  it('ordnet die amtlichen Bezeichnungen den fünf Klassen zu (Reihenfolge ist Teil der Regel)', () => {
    expect(bsCodeVonBezeichnung('Ratschlag des RR')).toBe(1010);
    expect(bsCodeVonBezeichnung('Ratschlag und Bericht des RR')).toBe(1010); // Vorlage, nicht Bericht
    expect(bsCodeVonBezeichnung('Ausgabenbericht des RR')).toBe(1010);
    expect(bsCodeVonBezeichnung('Bericht des RR')).toBe(1020);
    expect(bsCodeVonBezeichnung('Zwischenbericht des RR')).toBe(1020);
    expect(bsCodeVonBezeichnung('Bericht der WAK')).toBe(1030);
    expect(bsCodeVonBezeichnung('Bericht SpezKo Verfassung')).toBe(1030);
    expect(bsCodeVonBezeichnung('Schreiben des RR')).toBe(1040);
    expect(bsCodeVonBezeichnung('GR Beschluss')).toBe(1050);
    expect(bsCodeVonBezeichnung('Beschlussdokument')).toBe(1050);
  });

  it('rät NICHT bei unbekannten Bezeichnungen (kein «sonstiges»)', () => {
    // Echte Werte aus dem Bestand: Beilagen, keine Verfahrensschritte.
    for (const bez of ['Synopse', 'Gesetzestext', 'RA 9374 Mantel', '§-29-Schulgesetz']) {
      expect(bsCodeVonBezeichnung(bez), bez).toBeNull();
    }
  });

  it('zählt unklassierte Bezeichnungen, statt sie stumm zu verlieren (§8)', () => {
    const { jeGeschaeft, unklassiert } = baueEreignisse([
      dok('20.0001', 'Ratschlag des RR', '2020-03-01'),
      dok('20.0001', 'Synopse', '2020-03-01'),
      dok('20.0001', 'Synopse', '2020-04-01'),
    ]);
    expect(jeGeschaeft.get('20.0001')).toHaveLength(1);
    expect(unklassiert).toEqual([{ bez: 'Synopse', anzahl: 2 }]);
  });

  it('trennt die Vokabulare: derselbe Code heisst mit und ohne vok etwas anderes', () => {
    expect(verfahrensTypVonCode(300)).toBe('beschluss-parlament');
    expect(verfahrensTypVonCode(1050, 'bs-gr')).toBe('bs-beschluss-gr');
    // Ein BS-Code ohne vok fliegt auf, statt ein Bundes-Etikett zu erben.
    expect(() => verfahrensTypVonCode(1050)).toThrow(/unbekannter type-projet-Code/);
    expect(() => verfahrensTypVonCode(300, 'bs-gr')).toThrow(/unbekannter BS-Grossrat-Code/);
  });

  it('zeigt die amtliche Bezeichnung als Etikett, nicht die Klassen-Umschreibung (§1)', () => {
    expect(verfahrensLabel({ code: 1030, vok: 'bs-gr', bez: 'Bericht der WAK' })).toBe('Bericht der WAK');
    // Ohne Bezeichnung bleibt das Klassen-Etikett als ehrlicher Rückfall.
    expect(verfahrensLabel({ code: 1030, vok: 'bs-gr' })).toBe(BS_GROSSRAT[1030].label);
  });

  it('gibt die amtliche Dokument-URL unverändert zurück, statt eine zu bauen', () => {
    const pdf = 'https://grosserrat.bs.ch/dokumente/100387/000000387111.pdf';
    expect(verfahrensQuelleUrl({ code: 1030, vok: 'bs-gr', res: pdf })).toBe(pdf);
    expect(verfahrensQuelleUrl({ code: 200, res: 'fga/2017/2057' })).toBe('https://www.fedlex.admin.ch/eli/fga/2017/2057/de');
    expect(verfahrensQuelleUrl({ code: 1050, vok: 'bs-gr' })).toBeNull();
  });

  it('nimmt nur datierte Schritte auf und sortiert sie total', () => {
    const { jeGeschaeft } = baueEreignisse([
      dok('20.0001', 'GR Beschluss', '2021-06-09'),
      dok('20.0001', 'Ratschlag des RR', '2020-03-01'),
      { signatur_ges: '20.0001', signatur_dok: null, titel_dok: 'Bericht der WAK', dokudatum: null, url_dok: null },
    ]);
    expect(jeGeschaeft.get('20.0001')?.map((e) => e.datum)).toEqual(['2020-03-01', '2021-06-09']);
  });
});

describe('Einträge — Determinismus und Stand', () => {
  const e = erlass('BS-640.100', 'Gesetz über die direkten Steuern', 'Vom 12. April 2000 (Stand 2026)');
  const g1 = geschaeft('22.1784', 'Ratschlag zu einer Teilrevision des Gesetzes über die direkten Steuern vom 12. April 2000');
  const g2 = geschaeft('21.0406', 'Ratschlag zu einer Teilrevision des Gesetzes über die direkten Steuern vom 12. April 2000');
  const dokumente = [
    dok('22.1784', 'Ratschlag des RR', '2022-12-19'),
    dok('22.1784', 'GR Beschluss', '2023-03-27'),
    dok('21.0406', 'Ratschlag des RR', '2021-03-30'),
  ];

  it('liefert bei umgestellter Eingabe dieselbe Datei (§2)', () => {
    const bau = (gs: BsGeschaeft[], ds: BsDokument[]): string =>
      serialisiere(baueBsEintraege(gs, baueKanten(gs, [e]), baueEreignisse(ds).jeGeschaeft), '2026-09-12');
    expect(bau([g1, g2], dokumente)).toBe(bau([g2, g1], [...dokumente].reverse()));
  });

  it('nimmt als Stand das Datum der Vorlage des Regierungsrats, nicht das Abrufdatum', () => {
    const eintraege = baueBsEintraege([g1, g2], baueKanten([g1, g2], [e]), baueEreignisse(dokumente).jeGeschaeft);
    const nach = new Map(eintraege.map((x) => [x.key, x]));
    expect(nach.get('BS-GR-22.1784')?.stand).toBe('2022-12-19');
    expect(nach.get('BS-GR-21.0406')?.stand).toBe('2021-03-30');
    // jüngste zuerst
    expect(eintraege.map((x) => x.key)).toEqual(['BS-GR-22.1784', 'BS-GR-21.0406']);
    expect(eintraege.map((x) => x.rang)).toEqual([1, 2]);
  });

  it('fällt auf das früheste Ereignis zurück, wenn keine RR-Vorlage dabei ist', () => {
    expect(standVon(g1, [{ code: 1050, vok: 'bs-gr', datum: '2023-03-27' }])).toBe('2023-03-27');
    expect(standVon(g1, [])).toBe('2020-01-01'); // beginn_ges
  });

  it('weist eine Geschäftsnummer ausserhalb der amtlichen Form zurück', () => {
    expect(keyAusSignatur('26.0600')).toBe('BS-GR-26.0600');
    expect(() => keyAusSignatur('2026-0600')).toThrow(/unerwartete Geschäftsnummer/);
  });
});

describe('Ausgelieferter Bestand — Personendaten und Provenienz', () => {
  it('führt kein Personenfeld der Quelle', () => {
    const roh = JSON.stringify(BS_MATERIALIEN);
    for (const feld of VERBOTENE_FELDER) expect(roh.includes(feld), feld).toBe(false);
  });

  it('holt kein Personenfeld (Positivliste des Adapters)', () => {
    for (const feld of VERBOTENE_FELDER) {
      expect((FELDER_GESCHAEFT as readonly string[]).includes(feld), feld).toBe(false);
      expect((FELDER_DOKUMENT as readonly string[]).includes(feld), feld).toBe(false);
    }
  });

  it('führt keinen Vorstoss (dort stehen Namen im Titel)', () => {
    const vorstoesse = BS_MATERIALIEN.filter((m) => VORSTOSS_TITEL.test(m.titel));
    expect(vorstoesse.map((m) => m.key)).toEqual([]);
  });

  it('trägt an jedem Eintrag Herkunft, Live-Link und Verfahrenskette', () => {
    expect(BS_MATERIALIEN.length).toBeGreaterThan(0);
    for (const m of BS_MATERIALIEN) {
      expect(m.behoerde, m.key).toBe('BS-GR');
      expect(m.bsKanten?.length, m.key).toBeGreaterThan(0);
      expect(m.normKeys?.length, m.key).toBeGreaterThan(0);
      expect(m.quelleUrl, m.key).toMatch(/^https:\/\/grosserrat\.bs\.ch\//);
      expect(m.hinweis, m.key).toBeTruthy();
      for (const k of m.bsKanten ?? []) {
        expect(k.erlass, m.key).toMatch(/^BS-/);
        if (k.quelle === 'amtlich') expect(k.regel, m.key).toBe('fussnote');
        else expect(['sg-nummer', 'datum-titel'], m.key).toContain(k.regel);
      }
      for (const v of m.ereignisse ?? []) {
        expect(v.vok, m.key).toBe('bs-gr');
        expect(BS_GROSSRAT[v.code], `${m.key}: Code ${v.code}`).toBeTruthy();
      }
    }
  });

  it('sagt an jedem maschinell zugeordneten Eintrag, dass er fachlich ungeprüft ist (§8)', () => {
    const maschinell = BS_MATERIALIEN.filter((m) => (m.bsKanten ?? []).some((k) => k.quelle === 'maschinell'));
    expect(maschinell.length).toBeGreaterThan(0);
    for (const m of maschinell) expect(m.hinweis, m.key).toMatch(/fachlich nicht geprüft/);
  });
});

describe('Dokument-Ordnung — totale Sortierung vor der Roh-Ablage (Automatik-PR #913)', () => {
  // Rot-Beweis (§17-Wurzelfix, echter Fall #913, 18.9.2026): zwei Dokumente mit
  // identischem Tupel (Geschäft, Dokudatum, Dok-Signatur=null, Titel) — bis zum
  // Fix ohne letzten Schlüssel unentscheidbar, die Roh-Ablage übernahm die
  // (arbiträre) Export-Reihenfolge unverändert. `url_dok` ist bei solchen
  // Duplikaten immer verschieden (eigene PDF-Ablage) und macht die Ordnung total.
  const gleichesTupel = (url: string): BsDokument => ({
    signatur_ges: '04.8107', signatur_dok: null, titel_dok: 'GR Beschluss',
    dokudatum: '2005-01-12', url_dok: url,
  });

  it('bricht ein identisches Tupel über url_dok auf, statt 0 zu liefern', () => {
    const a = gleichesTupel('https://grosserrat.bs.ch/dokumente/100170/000000170962.pdf');
    const b = gleichesTupel('https://grosserrat.bs.ch/dokumente/100170/000000170684.pdf');
    expect(vergleicheBsDokumente(a, b)).not.toBe(0);
    // Ordnung ist die des Textvergleichs (`cu`) auf url_dok, unabhängig davon,
    // welches Dokument zuerst im Export stand (kein Zufall aus der Quelle, §2).
    expect(vergleicheBsDokumente(a, b)).toBe(cu(a.url_dok ?? '', b.url_dok ?? ''));
    expect(vergleicheBsDokumente(b, a)).toBe(-vergleicheBsDokumente(a, b));
  });

  it('sortiert einen Export mit vier Tie-Gruppen deterministisch, unabhängig von der Eingabe-Reihenfolge', () => {
    // Die vier amtlichen Tie-Gruppen aus bibliothek/materialien/bs-grossrat-raw/
    // dokumente.json (Messung 18.9.2026, 9 von 441 Zeilen).
    const gruppe = (ges: string, datum: string, urls: string[]): BsDokument[] => urls.map((url) => ({
      signatur_ges: ges, signatur_dok: null, titel_dok: 'GR Beschluss', dokudatum: datum, url_dok: url,
    }));
    const eingabe = [
      ...gruppe('03.2068', '2004-11-10', [
        'https://grosserrat.bs.ch/dokumente/100165/000000165922.pdf',
        'https://grosserrat.bs.ch/dokumente/100166/000000166148.pdf',
        'https://grosserrat.bs.ch/dokumente/100166/000000166100.pdf',
      ]),
      ...gruppe('03.2068', '2004-12-08', [
        'https://grosserrat.bs.ch/dokumente/100168/000000168104.pdf',
        'https://grosserrat.bs.ch/dokumente/100168/000000168107.pdf',
      ]),
      ...gruppe('04.8107', '2005-01-12', [
        'https://grosserrat.bs.ch/dokumente/100170/000000170962.pdf',
        'https://grosserrat.bs.ch/dokumente/100170/000000170684.pdf',
      ]),
      ...gruppe('06.1706', '2008-04-09', [
        'https://grosserrat.bs.ch/dokumente/100273/000000273725.pdf',
        'https://grosserrat.bs.ch/dokumente/100274/000000274004.pdf',
      ]),
    ];
    const sortiert = [...eingabe].sort(vergleicheBsDokumente);
    const rueckwaerts = [...eingabe].reverse().sort(vergleicheBsDokumente);
    // Ergebnis hängt nicht von der Eingabe-Reihenfolge ab (Kern der Fehlerklasse #913).
    expect(sortiert.map((d) => d.url_dok)).toEqual(rueckwaerts.map((d) => d.url_dok));
    expect(sortiert.map((d) => d.url_dok)).toEqual([
      'https://grosserrat.bs.ch/dokumente/100165/000000165922.pdf',
      'https://grosserrat.bs.ch/dokumente/100166/000000166100.pdf',
      'https://grosserrat.bs.ch/dokumente/100166/000000166148.pdf',
      'https://grosserrat.bs.ch/dokumente/100168/000000168104.pdf',
      'https://grosserrat.bs.ch/dokumente/100168/000000168107.pdf',
      'https://grosserrat.bs.ch/dokumente/100170/000000170684.pdf',
      'https://grosserrat.bs.ch/dokumente/100170/000000170962.pdf',
      'https://grosserrat.bs.ch/dokumente/100273/000000273725.pdf',
      'https://grosserrat.bs.ch/dokumente/100274/000000274004.pdf',
    ]);
  });
});
