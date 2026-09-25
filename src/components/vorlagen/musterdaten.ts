// ─── Musterdaten aller Vorlagen (W2·29-WERKBANK-VORLAGEN V5, 23.9.2026) ─────
//
// Wunsch David 23.9.2026: «ich möchte dass alle vorlagen musterdaten möglich
// haben.» EINE Quelle (§5) für den Knopf «Mit Musterdaten füllen»: je Vorlage
// eine Fabrik, die einen klar fiktiven, fachlich stimmigen Datensatz liefert.
// Der Wizard ersetzt damit seinen Stand vollständig (`{ ...defaults, ...muster() }`).
//
// Regeln:
//   • Nur erfundene Personen/Firmen («Anna Muster», «Beispiel Bau AG»),
//     feste ISO-Daten im Jahr 2026 (Determinismus, §2) — nie `Date.now()`.
//   • Fachlich stimmig: mit den Musterdaten liefern die Gates der Vorlage
//     keinen Blocker und der Assistent läuft bis «Prüfen» durch (Wächter:
//     src/tests/vorlagen-musterdaten.test.ts).
//   • Formvorschriften bleiben unberührt (Testament/Vorsorgeauftrag
//     eigenhändig = Abschrift-Vorlage; die Musterdaten schalten nichts frei).
//   • Keine Rechtslogik: reine Beispielwerte. Konstellationen orientieren sich
//     an den Golden-Fällen `vorl:*` (scripts/golden-outputs.ts), aber mit
//     lesbaren Werten.
//
// Schlüssel = Karten-Id des Katalogs (startseiteConfig) plus die drei
// Arbeitsvertrag-Untertypen (eigene Schemas unter /vorlagen/arbeitsvertrag).
// Die Checkliste `kuendigung-vermieter` erzeugt kein Dokument — kein Eintrag.
// Die Mappen GmbH/Kapitalerhöhung: `./musterdaten-mappen.ts` (eigene Datei,
// weil ihre Beispiele Engine-Defaults ausbreiten — die sollen nicht in jede
// Vorlagen-Seite geladen werden, §15).

import type { AfAntworten } from '../../lib/vorlagen/auftrag';
import type { AvAntworten } from '../../lib/vorlagen/arbeitsvertrag';
import type { EgAntworten } from '../../lib/vorlagen/eheschutzgesuch';
import type { FaAntworten } from '../../lib/vorlagen/forderungsabtretung';
import type { FeAntworten } from '../../lib/vorlagen/fristerstreckung';
import type { HaAntworten } from '../../lib/vorlagen/heimarbeitsvertrag';
import type { HrAntworten } from '../../lib/vorlagen/handelsreisendenvertrag';
import type { KoAnswers } from '../../lib/vorlagen/klageOrdentlich';
import type { KvAnswers } from '../../lib/vorlagen/klageVereinfacht';
import type { KkAntworten } from '../../lib/vorlagen/konkubinat';
import type { KvAntworten as KuendigungVertragAntworten } from '../../lib/vorlagen/kuendigungAllgemein';
import type { KagAntworten } from '../../lib/vorlagen/kuendigungArbeitgeber';
import type { KanAntworten } from '../../lib/vorlagen/kuendigungArbeitnehmer';
import type { KmAntworten } from '../../lib/vorlagen/kuendigungMieter';
import type { LvAntworten } from '../../lib/vorlagen/lehrvertrag';
import type { MaAntworten } from '../../lib/vorlagen/mahnung';
import type { MvAntworten } from '../../lib/vorlagen/mietvertrag';
import type { NbAntworten } from '../../lib/vorlagen/nichtbekanntgabe';
import type { NdaAntworten } from '../../lib/vorlagen/nda';
import type { PvAntworten, PvEntscheid, PvMassnahmeId } from '../../lib/vorlagen/patientenverfuegung';
import type { RubrumAntworten } from '../../lib/vorlagen/rubrum';
import type { SbAntworten } from '../../lib/vorlagen/scheidungsbegehren';
import type { SkAntworten } from '../../lib/vorlagen/scheidungsklage';
import type { SgAnswers } from '../../lib/vorlagen/schlichtungsgesuchBs';
import type { TestamentAntworten } from '../../lib/vorlagen/testament';
import type { VaAntworten } from '../../lib/vorlagen/vorsorgeauftrag';
import type { VvAntworten } from '../../lib/vorlagen/verjaehrungsverzicht';
import type { VollmachtAntworten } from '../../lib/vorlagen/vollmacht';
import type { WvAntworten } from '../../lib/vorlagen/werkvertrag';
import type { AgStand } from '../../pages/vorlagenAgGruendungDaten';

/** V5 (W2·29-WERKBANK-VORLAGEN): EINE Nachfrage-Regel für alle
 *  Musterdaten-Knöpfe (Wizard-Seiten, AG-Wizard, Mappen). Hat die Person
 *  schon etwas eingegeben, wird vor dem Ersetzen gefragt; sonst wird sofort
 *  gefüllt. Reine Zustands-Hygiene, keine Fachlogik (§3). */
export function musterdatenAnwenden(eigeneEingaben: boolean, anwenden: () => void): void {
  if (eigeneEingaben && !window.confirm('Eigene Eingaben durch Musterdaten ersetzen?')) return;
  anwenden();
}

// ── Wiederkehrende fiktive Parteien ─────────────────────────────────────────
const ANNA = { name: 'Anna Muster', adresse: 'Beispielstrasse 1, 4051 Basel' } as const;
const BEAT = { name: 'Beat Beispiel', adresse: 'Musterweg 5, 4052 Basel' } as const;
const FIRMA = { name: 'Beispiel Bau AG', adresse: 'Musterplatz 3, 4053 Basel' } as const;
const ANNA_PERSON = { typ: 'natuerlich' as const, vorname: 'Anna', name: 'Muster', strasse: 'Beispielstrasse 1', plz: '4051', ort: 'Basel' };
const BEAT_PERSON = { typ: 'natuerlich' as const, vorname: 'Beat', name: 'Muster', strasse: 'Beispielstrasse 1', plz: '4051', ort: 'Basel' };

/** AG-Gründung: kompletter Demo-Datensatz, Werte unverändert aus
 *  VorlageAgGruendung.tsx übernommen (dort seit P9 «Perfektion») — aus
 *  Golden-Fall ag:gemischt-qualifiziert (scripts/golden-outputs.ts):
 *  gemischte qualifizierte Gründung mit Sacheinlage (Geschäft, Grundstück),
 *  Verrechnung, besonderen Vorteilen, c/o-Domizil, Revisionsstelle und Lex
 *  Koller. `neuerKey` vergibt die Zeilen-Keys (die Seite reicht ihren
 *  Zähler durch, damit spätere Zeilen kollisionsfrei bleiben). Die Seite legt
 *  den Datensatz über `agStandDefaults()` — daher stammen gjBeginn/gjEnde
 *  (AG_DOK_DEFAULTS, wie zuvor explizit gesetzt). */
export function agMusterdaten(neuerKey: () => number): Partial<AgStand> {
  return {
    einlageArt: 'gemischt', besondereVorteile: true, optingOut: false,
    eigeneBueros: false, immobilienHauptzweck: true, inhaberaktien: false,
    fremdwaehrung: false, bankInUrkunde: true, chVertretung: true, leistungen: '',
    firma: 'Golden Muster AG', sitz: 'Zürich', kanton: 'ZH', zweck: 'Beteiligungen',
    zweckErweiterung: true, statutenUmfang: 'kurz', vinkulierung: false, virtuelleGv: false,
    inhaberKotiert: false, verwahrungsstelle: '',
    schiedsklausel: false, schiedsOrt: '', kapitalband: false, bedingtesKapital: false,
    gjErstesEnde: '', // gjBeginn/gjEnde: unverändert die AG_DOK_DEFAULTS aus agStandDefaults()
    ak: "400'000", anzahl: '400', nennwert: "1'000", liberierung: '100', ausgabebetrag: '',
    bankName: 'Zürcher Kantonalbank', bankOrt: 'Zürich',
    gruender: [
      { key: neuerKey(), name: 'Anna Muster', angaben: 'von Basel, in Zürich', anzahl: '300', liberierung: '' },
      { key: neuerKey(), name: 'Beat Beispiel', angaben: 'von Bern, in Bern', anzahl: '100', liberierung: '' },
    ],
    vr: [
      { key: neuerKey(), name: 'Anna Muster', herkunft: 'Basel', wohnort: 'Zürich', adresse: 'W 1', praesident: true, zeichnungsArt: 'einzelunterschrift' },
      { key: neuerKey(), name: 'Beat Beispiel', herkunft: 'Bern', wohnort: 'Bern', adresse: 'W 2', praesident: false, zeichnungsArt: 'kollektivzuzweien' },
    ],
    vertretungen: [],
    sacheinlagen: [{
      key: neuerKey(), typ: 'geschaeft', bezeichnung: 'Werkbau Muster', belegDatum: '2025-12-31',
      wertChf: "110'000", grundstueck: true, einlegerName: 'Anna Muster', aktienAnzahl: '100',
      gutschriftChf: "10'000", zustand: 'Liegenschaft zum Fortführungswert; Maschinenpark gemäss Anlagespiegel.',
      imHrEingetragen: true, cheNr: 'CHE-111.222.333', aktivenChf: "260'000", passivenChf: "150'000",
      rueckwirkungDatum: '2026-01-01',
    }],
    verrechnungen: [{ key: neuerKey(), glaeubigerName: 'Beat Beispiel', forderungChf: "50'000", aktienAnzahl: '50', begruendungTxt: 'Darlehen vom 01.02.2025, valutiert und fällig.' }],
    vorteile: [{ key: neuerKey(), beguenstigter: 'Anna Muster', inhalt: 'Vorkaufsrecht an der Werkhalle zum Verkehrswert', wertChf: "5'000", begruendungTxt: 'Abgeltung der Aufbauarbeit.' }],
    revisorName: 'Revisia AG', rsName: 'Revisia AG', rsSitz: 'Zürich',
    protokollfuehrer: '', sitzungBeginn: '11.00', sitzungEnde: '11.30',
    rechtsdomizil: '', domizilhalterName: 'Treuhand Muster AG', domizilhalterAdresse: 'Bahnhofstrasse 10, 8001 Zürich',
    konstituierungInUrkunde: false, domizilNurAnmeldung: false, nachtragsbevollmaechtigter: '',
    lkAusland: false, lkNeuerwerb: false, lkGrundstueck: true,
    nachtragAktiv: false,
    ort: 'Zürich', datum: '2026-06-15',
  };
}

/** Palliativ-Ziel: die lebensverlängernden Massnahmen (CPR, Beatmung,
 *  Dialyse) abgelehnt, der Rest offen — derselbe Stand, den die Zielwahl
 *  «palliativ» per zielDefaults (R1) aus den Defaults erzeugt. Als Literal,
 *  damit dieses Modul keine Engine in jede Vorlagen-Seite zieht (§15). */
const PV_MUSTER_MASSNAHMEN: Record<PvMassnahmeId, PvEntscheid> = {
  cpr: 'ablehnen', beatmung: 'ablehnen', ernaehrungTemporaer: 'keine_angabe',
  ernaehrungDauerhaft: 'keine_angabe', fluessigkeit: 'keine_angabe', dialyse: 'ablehnen',
  antibiotika: 'keine_angabe', spitaleinweisung: 'keine_angabe',
};

/** Musterdaten der Wizard-Vorlagen (VorlagenSeite), je Karten-Id. Nur
 *  `import type` aus src/lib: das Modul hängt an jeder Vorlagen-Seite. */
export const MUSTER = {
  mahnung: (): Partial<MaAntworten> => ({
    absenderName: ANNA.name, absenderAdresse: ANNA.adresse,
    adressatName: BEAT.name, adressatAdresse: BEAT.adresse,
    betrag: '1250', rechtsgrund: 'Rechnung Nr. 2026-117 vom 12. Mai 2026', faelligSeit: '2026-05-15',
    vertragBezeichnung: 'Werkvertrag vom 1. Februar 2026',
    leistungBeschrieb: 'Lieferung und Montage der Kücheneinrichtung',
    zahlungsverbindung: 'IBAN CH00 0000 0000 0000 0000 0 (Beispiel)',
    ort: 'Basel', datum: '2026-06-11',
  }),
  'kuendigung-mieter': (): Partial<KmAntworten> => ({
    absenderName: ANNA.name, absenderAdresse: ANNA.adresse,
    adressatName: 'Immobilien Beispiel AG', adressatAdresse: 'Musterplatz 3, 4053 Basel',
    mietobjektAdresse: 'Beispielstrasse 1, 4051 Basel (3½-Zimmer-Wohnung, 2. OG links)',
    objekt: 'wohnung', kanton: 'BS', mietbeginn: '2021-04-01', zugang: '2026-06-20',
    terminQuelle: 'ortsueblich',
    ort: 'Basel', datum: '2026-06-15',
  }),
  'kuendigung-arbeitgeber': (): Partial<KagAntworten> => ({
    absenderName: 'Beispiel Treuhand AG', absenderAdresse: 'Musterplatz 3, 4053 Basel',
    adressatName: ANNA.name, adressatAdresse: ANNA.adresse,
    unterzeichner: 'Beat Beispiel, Geschäftsführer',
    vertragsbeginn: '2022-03-01', zugangKuendigung: '2026-06-20',
    probezeit: 'gesetzlich',
    ort: 'Basel', datum: '2026-06-18',
  }),
  'kuendigung-arbeitnehmer': (): Partial<KanAntworten> => ({
    absenderName: ANNA.name, absenderAdresse: ANNA.adresse,
    adressatName: 'Beispiel Treuhand AG', adressatAdresse: 'Musterplatz 3, 4053 Basel',
    vertragsbeginn: '2022-03-01', zugangKuendigung: '2026-06-20',
    probezeit: 'gesetzlich',
    ort: 'Basel', datum: '2026-06-18',
  }),
  'kuendigung-vertrag': (): Partial<KuendigungVertragAntworten> => ({
    absenderName: ANNA.name, absenderAdresse: ANNA.adresse,
    adressatName: 'Beispiel Haustechnik GmbH', adressatAdresse: 'Musterplatz 3, 4053 Basel',
    preset: 'generisch',
    vertragsBezeichnung: 'Wartungsvertrag für die Heizungsanlage vom 1. März 2024',
    vertragsnummer: 'WV-2024-0815', zugang: '2026-06-20', aufNaechstmoeglich: true,
    ort: 'Basel', datum: '2026-06-18',
  }),
  rubrum: (): Partial<RubrumAntworten> => ({
    gericht: 'Bezirksgericht Zürich', besetzung: 'Einzelgericht', verfahrenNr: 'CG260012',
    klaeger: 'Anna Muster, Beispielstrasse 1, 8001 Zürich',
    beklagte: 'Beispiel Bau AG, Musterplatz 3, 8002 Zürich',
    streitgegenstand: 'Forderung aus Werkvertrag',
    ort: 'Zürich', datum: '2026-06-11',
  }),
  verjaehrungsverzicht: (): Partial<VvAntworten> => ({
    absenderName: FIRMA.name, absenderAdresse: FIRMA.adresse,
    adressatName: ANNA.name, adressatAdresse: ANNA.adresse,
    forderungBeschrieb: 'Ansprüche aus Mängelhaftung gemäss Werkvertrag vom 1. Februar 2024 (Küchenumbau)',
    verzichtBis: '2027-12-31', ort: 'Basel', datum: '2026-06-12',
  }),
  forderungsabtretung: (): Partial<FaAntworten> => ({
    absenderName: 'Beispiel Handels AG', absenderAdresse: 'Musterweg 5, 4052 Basel',
    adressatName: 'Muster Finanz GmbH', adressatAdresse: 'Beispielstrasse 1, 8001 Zürich',
    schuldnerName: FIRMA.name, schuldnerAdresse: 'Musterplatz 3, 3011 Bern',
    forderungBeschrieb: 'Kaufpreisforderung aus Kaufvertrag vom 1. Februar 2026',
    ort: 'Basel', datum: '2026-06-13',
  }),
  auftrag: (): Partial<AfAntworten> => ({
    auftraggeberName: 'Beispiel Handels AG', auftraggeberAdresse: 'Musterweg 5, 8001 Zürich',
    beauftragteName: 'Muster Treuhand GmbH', beauftragteAdresse: 'Beispielstrasse 1, 8002 Zürich',
    gegenstand: 'Buchführung und Erstellung des Jahresabschlusses 2026',
    mandatstyp: 'treuhand', verguetung: 'pauschal', pauschalCHF: '5000', beginn: '2026-07-01',
    ort: 'Zürich', datum: '2026-06-13',
  }),
  werkvertrag: (): Partial<WvAntworten> => ({
    bestellerName: ANNA.name, bestellerAdresse: ANNA.adresse,
    unternehmerName: 'Beispiel Schreinerei GmbH', unternehmerAdresse: 'Musterplatz 3, 4053 Basel',
    werkBeschrieb: 'Anfertigung eines Esstischs aus Eiche nach Skizze vom 1. März 2026',
    werkArt: 'beweglich', bauwerkBezug: false, preis: 'pauschal', pauschalCHF: '4800', ablieferung: '2026-09-01',
    ort: 'Basel', datum: '2026-06-13',
  }),
  nda: (): Partial<NdaAntworten> => ({
    parteiAName: 'Beispiel Software AG', parteiAAdresse: 'Musterweg 5, 8001 Zürich',
    parteiBName: 'Muster Consulting GmbH', parteiBAdresse: 'Beispielstrasse 1, 8002 Zürich',
    zweck: 'Prüfung einer möglichen Zusammenarbeit im Bereich Softwareentwicklung',
    gegenseitig: true, infoBeschrieb: 'Quellcode, Kundenlisten und Preiskalkulationen',
    ort: 'Zürich', datum: '2026-06-13',
  }),
  konkubinat: (): Partial<KkAntworten> => ({
    partner1Name: ANNA.name, partner1Adresse: ANNA.adresse,
    partner2Name: BEAT.name, partner2Adresse: ANNA.adresse,
    wohnBeschrieb: 'gemeinsame Mietwohnung an der Beispielstrasse 1 in Basel; Hauptmieterin ist Anna Muster',
    ort: 'Basel', datum: '2026-06-13',
  }),
  fristerstreckungsgesuch: (): Partial<FeAntworten> => ({
    absenderName: FIRMA.name, absenderAdresse: FIRMA.adresse,
    adressatName: 'Zivilgericht Basel-Stadt', adressatAdresse: 'Bäumleingasse 5, 4001 Basel',
    verfahrenBeschrieb: 'Anna Muster gegen Beispiel Bau AG betreffend Forderung', verfahrenNr: 'ZG.2026.123',
    fristBeschrieb: 'Frist zur Erstattung der Klageantwort',
    fristEnde: '2026-07-15', erstreckungBis: '2026-08-14',
    begruendung: 'Die Akten umfassen über 800 Seiten; die zuständige Sachbearbeiterin ist vom 1. bis 12. Juli 2026 landesabwesend.',
    ort: 'Basel', datum: '2026-06-13',
  }),
  'nichtbekanntgabe-betreibung': (): Partial<NbAntworten> => ({
    absenderName: ANNA.name, absenderAdresse: ANNA.adresse,
    adressatName: 'Betreibungsamt Basel-Stadt', adressatAdresse: 'Postfach, 4001 Basel',
    betreibungNr: '2026/12345', glaeubigerName: 'Beispiel Inkasso AG',
    zustellungZb: '2026-02-15', ort: 'Basel', datum: '2026-06-13',
  }),
  scheidungsklage: (): Partial<SkAntworten> => ({
    gerichtsKanton: 'BS',
    klaeger: { ...ANNA_PERSON },
    beklagte: { ...BEAT_PERSON, strasse: 'Musterweg 5', plz: '4052' },
    grund: '114', trennungSeit: '2024-03-01',
    ort: 'Basel', datum: '2026-06-12',
  }),
  'scheidungsbegehren-gemeinsam': (): Partial<SbAntworten> => ({
    gerichtsKanton: 'BS',
    ehegatte1: { ...ANNA_PERSON },
    ehegatte2: { ...BEAT_PERSON },
    vereinbarungDatum: '2026-05-20', ort: 'Basel', datum: '2026-06-12',
  }),
  eheschutzgesuch: (): Partial<EgAntworten> => ({
    gerichtsKanton: 'BS',
    gesuchsteller: { ...ANNA_PERSON },
    gesuchsgegner: { ...BEAT_PERSON, strasse: 'Musterweg 5', plz: '4052' },
    getrenntSeit: '2026-04-01', ort: 'Basel', datum: '2026-06-12',
  }),
  'klage-ordentlich': (): Partial<KoAnswers> => ({
    gerichtsKanton: 'BS', streitwert: '80000',
    klaeger: { ...ANNA_PERSON },
    beklagte: { typ: 'juristisch', firma: FIRMA.name, sitzStrasse: 'Musterplatz 3', sitzPlz: '4053', sitzOrt: 'Basel' },
    streitgegenstand: 'Forderung aus Werkvertrag',
    zins: { satz: '5', abDatum: '2026-04-15' },
    tatsachen: [
      { text: 'Die Parteien schlossen am 1. Februar 2026 einen Werkvertrag über den Umbau der Küche.', beweise: [{ bezeichnung: 'Werkvertrag vom 1. Februar 2026 (Urkunde)' }] },
      { text: 'Die Klägerin leistete eine Anzahlung; die Beklagte erbrachte das Werk nicht und blieb trotz Mahnung säumig.', beweise: [{ bezeichnung: 'Mahnung vom 20. April 2026 (Urkunde)' }] },
    ],
    rechtlicheBegruendung: [{ text: 'Der Anspruch stützt sich auf Art. 107 ff. OR.' }],
    klagebewilligungVorhanden: true, klagebewilligungDatum: '2026-05-04',
    vollmachtBeilage: false, ort: 'Basel', datum: '2026-06-15',
  }),
  'klage-vereinfacht': (): Partial<KvAnswers> => ({
    materie: 'vermoegensrechtlich', streitwert: '12000', gerichtsKanton: 'BS',
    klaeger: { ...ANNA_PERSON },
    beklagte: { typ: 'juristisch', firma: FIRMA.name, sitzStrasse: 'Musterplatz 3', sitzPlz: '4053', sitzOrt: 'Basel' },
    begehrenTyp: 'beziffert', zins: { satz: '5', abDatum: '2026-04-15' },
    streitgegenstand: 'Rückerstattung einer Anzahlung aus Werkvertrag vom 1. Februar 2026',
    klagebewilligungVorhanden: true, klagebewilligungDatum: '2026-05-04',
    ort: 'Basel', datum: '2026-06-15',
  }),
  schlichtungsgesuch: (): Partial<SgAnswers> => ({
    gerichtsKanton: 'BS', streitgegenstandTyp: 'geldforderung', baselForumBestaetigt: true,
    klaeger: [{ ...ANNA_PERSON }],
    beklagte: [{ typ: 'juristisch', firma: 'Beispiel Handels GmbH', sitzStrasse: 'Musterplatz 3', sitzPlz: '4053', sitzOrt: 'Basel' }],
    geld: { betrag: '12000', zins: { satz: '5', abDatum: '2026-01-01' } },
    streitgegenstand: 'Forderung aus Rechnung Nr. 2025-117 vom 1. Dezember 2025',
    beilagen: [{ bezeichnung: 'Rechnung Nr. 2025-117 vom 1. Dezember 2025' }],
    ort: 'Basel', datum: '2026-06-15',
  }),
  vollmacht: (): Partial<VollmachtAntworten> => ({
    typ: 'general', geberTyp: 'natuerlich',
    vorname: 'Anna', nachname: 'Muster', geburtsdatum: '1965-04-12', adresse: ANNA.adresse,
    bevollmaechtigte: [{ name: BEAT.name, angaben: `geb. 1968, ${BEAT.adresse}` }],
    bereiche: ['behoerden', 'post', 'versicherungen'],
    ort: 'Basel', datum: '2026-06-15',
  }),
  'eigenhaendiges-testament': (): Partial<TestamentAntworten> => ({
    vorname: 'Anna', nachname: 'Muster', geburtsdatum: '1958-04-12',
    heimatort: 'Basel BS', adresse: ANNA.adresse,
    erben: [
      { name: 'Clara Muster', angaben: 'geb. 1990, Tochter', quoteProzent: 60 },
      { name: 'David Muster', angaben: 'geb. 1992, Sohn', quoteProzent: 40, ersatz: 'dessen Nachkommen' },
    ],
    vermaechtnisse: [{ empfaenger: 'Verein Beispiel Basel', gegenstand: 'CHF 5000' }],
    willensvollstrecker: 'Eva Beispiel, Musterweg 5, 4052 Basel',
    ortErrichtung: 'Basel', datumErrichtung: '2026-06-15',
  }),
  patientenverfuegung: (): Partial<PvAntworten> => ({
    vorname: 'Anna', name: 'Muster', geburtsdatum: '1958-04-12', wohnort: 'Basel',
    ziel: 'palliativ', situationen: ['terminal'],
    massnahmen: { ...PV_MUSTER_MASSNAHMEN },
    organspende: 'ja',
  }),
  vorsorgeauftrag: (): Partial<VaAntworten> => ({
    volljaehrig: true, urteilsfaehigBestaetigt: true, keineUmfassendeBeistandschaft: true,
    vorname: 'Anna', nachname: 'Muster', geburtsdatum: '1958-04-12', heimatort: 'Basel BS', adresse: ANNA.adresse,
    beauftragte: [{ name: BEAT.name, angaben: `geb. 1968, ${BEAT.adresse}`, typ: 'natuerlich', bereiche: ['personensorge', 'vermoegenssorge', 'rechtsverkehr'] }],
    module: { personensorge: ['wohnsituation', 'medizin'], vermoegenssorge: ['verwaltung', 'liegenschaften'], rechtsverkehr: ['behoerden'] },
    ort: 'Basel', datum: '2026-06-15',
  }),
  arbeitsvertrag: (): Partial<AvAntworten> => ({
    arbeitgeberName: 'Beispiel Treuhand AG', arbeitgeberAdresse: 'Musterplatz 3, 4053 Basel',
    arbeitnehmerVorname: 'Anna', arbeitnehmerName: 'Muster', arbeitnehmerAdresse: ANNA.adresse,
    funktion: 'Sachbearbeiterin Buchhaltung', arbeitsort: 'Basel', arbeitsortKanton: 'BS',
    beginn: '2026-08-01', lohnBetrag: '6500', ort: 'Basel', datum: '2026-06-15',
  }),
  lehrvertrag: (): Partial<LvAntworten> => ({
    betriebName: 'Beispiel Treuhand AG', betriebAdresse: 'Musterplatz 3, 4053 Basel',
    lernendeVorname: 'Lea', lernendeName: 'Muster', lernendeAdresse: ANNA.adresse,
    lernendeGeburtsdatum: '2010-05-01', gesetzlicheVertretung: 'Anna Muster',
    beruf: 'Kauffrau EFZ', beginn: '2026-08-01', dauerJahre: 3,
    lohnLehrjahre: [{ jahr: 1, chf: '700' }, { jahr: 2, chf: '900' }, { jahr: 3, chf: '1200' }],
    ort: 'Basel', datum: '2026-06-15',
  }),
  handelsreisendenvertrag: (): Partial<HrAntworten> => ({
    arbeitgeberName: 'Beispiel Maschinen AG', arbeitgeberAdresse: 'Musterweg 5, 8001 Zürich',
    reisenderVorname: 'Beat', reisenderName: 'Beispiel', reisenderAdresse: 'Beispielstrasse 1, 3011 Bern',
    gegenstand: 'Werkzeugmaschinen', reisegebiet: 'Kantone BE und SO',
    beginn: '2026-08-01', fixCHF: '5000', provisionProzent: '3',
    ort: 'Zürich', datum: '2026-06-15',
  }),
  heimarbeitsvertrag: (): Partial<HaAntworten> => ({
    arbeitgeberName: 'Beispiel Verpackungen AG', arbeitgeberAdresse: 'Musterweg 5, 8001 Zürich',
    heimarbeiterVorname: 'Anna', heimarbeiterName: 'Muster', heimarbeiterAdresse: 'Beispielstrasse 1, 8400 Winterthur',
    arbeitsbeschrieb: 'Konfektionierung von Verpackungen', lohnAngabe: '4.50', lohnEinheit: 'pro Stück',
    ort: 'Zürich', datum: '2026-06-15',
  }),
  'mietvertrag-wohnen': (): Partial<MvAntworten> => ({
    vermieterName: 'Immobilien Beispiel AG', vermieterAdresse: 'Musterplatz 3, 4053 Basel',
    mieterName: ANNA.name, mieterAdresse: 'Altweg 7, 4057 Basel',
    objektBeschrieb: '3½-Zimmer-Wohnung, 2. OG links, mit Kellerabteil',
    objektAdresse: ANNA.adresse, beginn: '2026-10-01',
    mietzinsNettoCHF: '2000', nebenkostenCHF: '250', nkPositionen: ['Heizung', 'Warmwasser'],
    ort: 'Basel', datum: '2026-06-15',
  }),
};
