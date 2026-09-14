// ─── Fedlex · Achse 3a: Erlassnamen-Positivliste (V-7/V-8, W2·20-VERWEIS-SCHAERFE) ───
//
// Drei KURATIERTE Tabellen, die ausgeschriebene oder abweichend geschriebene
// Nennungen eines Bundeserlasses deterministisch auf den FEDLEX-Key abbilden.
// Keine Heuristik, kein Fuzzy-Matching (§1: kein Link ist besser als ein
// falscher) — jeder Eintrag ist ein Identitäts-Treffer mit Wortgrenze und
// trägt seinen Beleg. Wächter: `src/tests/fedlex-positivliste.test.ts` prüft
// jeden Eintrag gegen das Bund-Register (`public/normtext/register.json`,
// Titel aus der Fedlex-Extraktion mit `quelleUrl`/`stand`) bzw. gegen die
// FEDLEX-URL des Ziels — ein Eintrag ohne belegbaren Anker reisst das Tor.
//
// Kette ohne Zyklus: tabelle ← positivliste ← erkennung ← parser.
//
// Anlass (Messung 1.9.2026, Basislinie messwerte/verweis-inventar.json auf
// main 70002a287): 1 281 «Art. N des/der …»-Stellen und 916 «§ N des/der …»-
// Stellen fielen pauschal in den des/der-Guard (TEXT); 601 «Art. N KÜRZEL»-
// Stellen blieben unerkannt, weil der Text die AMTLICHE Schreibweise («BankG»,
// «AsylG», «FinfraG») trägt, die FEDLEX-Tabelle aber den Grossbuchstaben-Key.
// Gemessen ausserdem EIN falscher Link auf main: BE-154.21 «Artikel 21 des
// Datenschutzgesetzes vom 19. Februar 1986 (KDSG)» sprang auf das Bundes-DSG —
// das kantonale Datenschutzgesetz (AR-146.1, BE KDSG) trägt denselben Namen.
// Darum die GELTUNG je Eintrag: Kurznamen, die auch ein kantonaler Erlass tragen
// kann, lösen NUR in Bundeserlassen auf (`bund`); amtliche Volltitel
// («Bundesgesetzes über …») sind ebenenübergreifend eindeutig (`alle`).

import { FEDLEX, type FedlexGesetz } from './tabelle';

/** Ebene des LESENDEN Erlasses — steuert, welche Kurznamen auflösen dürfen. */
export type FremdEbene = 'bund' | 'kanton';
/** `alle` = in jedem Erlass eindeutig · `bund` = nur in Bundeserlassen (ein
 *  gleichnamiger kantonaler Erlass ist möglich oder belegt). */
export type Geltung = 'alle' | 'bund';

export interface GenitivEintrag {
  /** Genitiv-Form, wie sie nach «des/der» im Text steht (exakt, Wortgrenze). */
  name: string;
  gesetz: FedlexGesetz;
  geltung: Geltung;
  /** Beleg: Teilstring des Bund-Register-Titels (Fedlex-Kurztitel) ODER die
   *  FEDLEX-URL des Ziels, wenn das Register den Kurztitel nicht führt. */
  beleg: string;
}

// ─── V-7a · Kurztitel-Genitive ───────────────────────────────────────────────
//
// Bestand bis 31.8.2026 (26 Einträge, A10/A11 David 5.7.2026, verifiziert
// 2026-07-10 gegen `kopf.titel`) — jetzt mit Geltung und Beleg. Neu (1.9.2026)
// die im Korpus gemessenen Kurztitel ohne Klammer-Kürzel; Kandidaten OHNE
// FEDLEX-Ziel (Gaststaatgesetz, Nachrichtendienstgesetz, Zollgesetz,
// Subventionsgesetz, Revisionsaufsichtsgesetz …) bleiben bewusst draussen —
// Tabellen-Ausbau ist ein eigener Schritt, kein Raten.
const U = (g: FedlexGesetz): string => FEDLEX[g];
export const GENITIV_EINTRAEGE: ReadonlyArray<GenitivEintrag> = [
  // Verfassung, Kodifikationen, Prozessordnungen — ebenenübergreifend eindeutig.
  { name: 'Bundesverfassung', gesetz: 'BV', geltung: 'alle', beleg: 'Bundesverfassung' },
  { name: 'Strafgesetzbuches', gesetz: 'StGB', geltung: 'alle', beleg: 'Strafgesetzbuch' },
  { name: 'Strafgesetzbuchs', gesetz: 'StGB', geltung: 'alle', beleg: 'Strafgesetzbuch' },
  { name: 'Schweizerischen Strafgesetzbuches', gesetz: 'StGB', geltung: 'alle', beleg: 'Strafgesetzbuch' },
  { name: 'Schweizerischen Strafgesetzbuchs', gesetz: 'StGB', geltung: 'alle', beleg: 'Strafgesetzbuch' },
  { name: 'Militärstrafgesetzes', gesetz: 'MStG', geltung: 'alle', beleg: 'Militärstrafgesetz' },
  { name: 'Zivilgesetzbuches', gesetz: 'ZGB', geltung: 'alle', beleg: 'Zivilgesetzbuch' },
  { name: 'Zivilgesetzbuchs', gesetz: 'ZGB', geltung: 'alle', beleg: 'Zivilgesetzbuch' },
  { name: 'Schweizerischen Zivilgesetzbuches', gesetz: 'ZGB', geltung: 'alle', beleg: 'Zivilgesetzbuch' },
  { name: 'Schweizerischen Zivilgesetzbuchs', gesetz: 'ZGB', geltung: 'alle', beleg: 'Zivilgesetzbuch' },
  { name: 'Obligationenrechts', gesetz: 'OR', geltung: 'alle', beleg: 'Obligationenrecht' },
  { name: 'Schweizerischen Obligationenrechts', gesetz: 'OR', geltung: 'alle', beleg: 'Obligationenrecht' },
  { name: 'Strafprozessordnung', gesetz: 'StPO', geltung: 'alle', beleg: 'Strafprozessordnung' },
  { name: 'Schweizerischen Strafprozessordnung', gesetz: 'StPO', geltung: 'alle', beleg: 'Strafprozessordnung' },
  { name: 'Zivilprozessordnung', gesetz: 'ZPO', geltung: 'alle', beleg: 'Zivilprozessordnung' },
  { name: 'Schweizerischen Zivilprozessordnung', gesetz: 'ZPO', geltung: 'alle', beleg: 'Zivilprozessordnung' },
  { name: 'Schweizerischen Jugendstrafprozessordnung', gesetz: 'JStPO', geltung: 'alle', beleg: 'Jugendstrafprozessordnung' },
  { name: 'Bundesgerichtsgesetzes', gesetz: 'BGG', geltung: 'alle', beleg: 'Bundesgerichtsgesetz' },
  { name: 'Militärstrafprozesses', gesetz: 'MStP', geltung: 'alle', beleg: 'Militärstrafprozess' },
  // Bundesgesetze mit Kurztitel, die kein Kanton so nennt.
  { name: 'Asylgesetzes', gesetz: 'ASYLG', geltung: 'alle', beleg: 'Asylgesetz' },
  { name: 'Strassenverkehrsgesetzes', gesetz: 'SVG', geltung: 'alle', beleg: 'Strassenverkehrsgesetz' },
  { name: 'Versicherungsvertragsgesetzes', gesetz: 'VVG', geltung: 'alle', beleg: U('VVG') },
  { name: 'Freizügigkeitsgesetzes', gesetz: 'FZG', geltung: 'alle', beleg: 'Freizügigkeitsgesetz' },
  { name: 'Lebensmittelgesetzes', gesetz: 'LMG', geltung: 'alle', beleg: 'Lebensmittelgesetz' },
  { name: 'Fusionsgesetzes', gesetz: 'FusG', geltung: 'alle', beleg: 'Fusionsgesetz' },
  { name: 'Bundespersonalgesetzes', gesetz: 'BPG', geltung: 'alle', beleg: 'Bundespersonalgesetz' },
  { name: 'Unfallversicherungsgesetzes', gesetz: 'UVG', geltung: 'alle', beleg: U('UVG') },
  { name: 'Mehrwertsteuergesetzes', gesetz: 'MWSTG', geltung: 'alle', beleg: U('MWSTG') },
  { name: 'Kartellgesetzes', gesetz: 'KG', geltung: 'alle', beleg: 'Kartellgesetz' },
  { name: 'Bankengesetzes', gesetz: 'BANKG', geltung: 'alle', beleg: 'Bankengesetz' },
  { name: 'Finanzmarktaufsichtsgesetzes', gesetz: 'FINMAG', geltung: 'alle', beleg: 'Finanzmarktaufsichtsgesetz' },
  { name: 'Finanzmarktinfrastrukturgesetzes', gesetz: 'FINFRAG', geltung: 'alle', beleg: 'Finanzmarktinfrastrukturgesetz' },
  { name: 'Finanzinstitutsgesetzes', gesetz: 'FINIG', geltung: 'alle', beleg: 'Finanzinstitutsgesetz' },
  { name: 'Finanzdienstleistungsgesetzes', gesetz: 'FIDLEG', geltung: 'alle', beleg: 'Finanzdienstleistungsgesetz' },
  { name: 'Kollektivanlagengesetzes', gesetz: 'KAG', geltung: 'alle', beleg: 'Kollektivanlagengesetz' },
  { name: 'eidgenössischen Kollektivanlagengesetzes', gesetz: 'KAG', geltung: 'alle', beleg: 'Kollektivanlagengesetz' },
  { name: 'Versicherungsaufsichtsgesetzes', gesetz: 'VAG', geltung: 'alle', beleg: 'Versicherungsaufsichtsgesetz' },
  { name: 'Geldwäschereigesetzes', gesetz: 'GWG', geltung: 'alle', beleg: 'Geldwäschereigesetz' },
  { name: 'Bucheffektengesetzes', gesetz: 'BEG', geltung: 'alle', beleg: 'Bucheffektengesetz' },
  { name: 'Betäubungsmittelgesetzes', gesetz: 'BETMG', geltung: 'alle', beleg: 'Betäubungsmittelgesetz' },
  { name: 'Heilmittelgesetzes', gesetz: 'HMG', geltung: 'alle', beleg: 'Heilmittelgesetz' },
  { name: 'Epidemiengesetzes', gesetz: 'EpG', geltung: 'alle', beleg: 'Epidemiengesetz' },
  { name: 'Transplantationsgesetzes', gesetz: 'TxG', geltung: 'alle', beleg: 'Transplantationsgesetz' },
  { name: 'Militärgesetzes', gesetz: 'MG', geltung: 'alle', beleg: 'Militärgesetz' },
  { name: 'Partnerschaftsgesetzes', gesetz: 'PARTG', geltung: 'alle', beleg: 'Partnerschaftsgesetz' },
  { name: 'Jugendstrafgesetzes', gesetz: 'JSTG', geltung: 'alle', beleg: 'Jugendstrafgesetz' },
  { name: 'Opferhilfegesetzes', gesetz: 'OHG', geltung: 'alle', beleg: 'Opferhilfegesetz' },
  { name: 'Rechtshilfegesetzes', gesetz: 'IRSG', geltung: 'alle', beleg: 'Rechtshilfegesetz' },
  { name: 'Arbeitslosenversicherungsgesetzes', gesetz: 'AVIG', geltung: 'alle', beleg: 'Arbeitslosenversicherungsgesetz' },
  { name: 'Entsendegesetzes', gesetz: 'ENTSG', geltung: 'alle', beleg: 'Entsendegesetz' },
  { name: 'Steuerharmonisierungsgesetzes', gesetz: 'STHG', geltung: 'alle', beleg: 'Steuerharmonisierungsgesetz' },
  { name: 'Ausländer- und Integrationsgesetzes', gesetz: 'AIG', geltung: 'alle', beleg: 'Ausländer- und Integrationsgesetz' },
  { name: 'Fernmeldegesetzes', gesetz: 'FMG', geltung: 'alle', beleg: 'Fernmeldegesetz' },
  { name: 'Luftfahrtgesetzes', gesetz: 'LFG', geltung: 'alle', beleg: 'Luftfahrtgesetz' },
  { name: 'Eisenbahngesetzes', gesetz: 'EBG', geltung: 'alle', beleg: 'Eisenbahngesetz' },
  { name: 'Patentgesetzes', gesetz: 'PatG', geltung: 'alle', beleg: 'Patentgesetz' },
  { name: 'Markenschutzgesetzes', gesetz: 'MSchG', geltung: 'alle', beleg: 'Markenschutzgesetz' },
  { name: 'Designgesetzes', gesetz: 'DESG', geltung: 'alle', beleg: 'Designgesetz' },
  { name: 'Sortenschutzgesetzes', gesetz: 'SortG', geltung: 'alle', beleg: 'Sortenschutzgesetz' },
  { name: 'Binnenmarktgesetzes', gesetz: 'BGBM', geltung: 'alle', beleg: 'Binnenmarktgesetz' },
  { name: 'Preisüberwachungsgesetzes', gesetz: 'PUEG', geltung: 'alle', beleg: 'Preisüberwachungsgesetz' },
  // Amtlich zitierte Kurzformen ohne Register-Kurztitel (Beleg: FEDLEX-URL; im
  // Korpus vom Bundesgesetzgeber selbst so zitiert — OR Art. 93 «des
  // Schuldbetreibungs- und Konkursgesetzes vom 11. April 1889», ArG Art. 6 «des
  // Verwaltungsstrafrechtsgesetzes vom 22. März 1974», ZGB Art. 21a «des
  // Erwerbsersatzgesetzes vom 25. September 1952»).
  { name: 'Schuldbetreibungs- und Konkursgesetzes', gesetz: 'SchKG', geltung: 'alle', beleg: U('SchKG') },
  { name: 'Verwaltungsstrafrechtsgesetzes', gesetz: 'VSTRR', geltung: 'alle', beleg: U('VSTRR') },
  { name: 'Erwerbsersatzgesetzes', gesetz: 'EOG', geltung: 'alle', beleg: U('EOG') },
  { name: 'Urheberrechtsgesetzes', gesetz: 'URG', geltung: 'alle', beleg: U('URG') },
  { name: 'Konsumkreditgesetzes', gesetz: 'KKG', geltung: 'alle', beleg: U('KKG') },
  // NUR in Bundeserlassen: ein gleichnamiger kantonaler Erlass ist belegt
  // (Register 1.9.2026: AR-146.1 Datenschutzgesetz, BS-780.100 Umweltschutz-
  // gesetz, AR-814.0 Umwelt- und Gewässerschutzgesetz, BS-420.200 Gesetz über
  // die Berufsbildung, AR-145.52/ZH-215.1 Anwaltsgesetz, BS-772.100 Energie-
  // gesetz, AR-931.1/BS-911.600 Waldgesetz) oder üblich (Verantwortlichkeits-,
  // Bürgerrechts-, Familienzulagen-, Publikations-, Öffentlichkeits-,
  // Gleichstellungs-, Parlaments-, Raumplanungs-, Verwaltungsverfahrens- und
  // Organisationsgesetze der Kantone; «Arbeitsgesetz» ist in BS das Register-
  // Kürzel des Einführungsgesetzes BS-812.100).
  { name: 'Verwaltungsgerichtsgesetzes', gesetz: 'VGG', geltung: 'bund', beleg: 'Verwaltungsgerichtsgesetz' },
  { name: 'Verwaltungsverfahrensgesetzes', gesetz: 'VwVG', geltung: 'bund', beleg: U('VwVG') },
  { name: 'Umweltschutzgesetzes', gesetz: 'USG', geltung: 'bund', beleg: 'Umweltschutzgesetz' },
  { name: 'Gewässerschutzgesetzes', gesetz: 'GSCHG', geltung: 'bund', beleg: 'Gewässerschutzgesetz' },
  { name: 'Arbeitsgesetzes', gesetz: 'ArG', geltung: 'bund', beleg: 'Arbeitsgesetz' },
  { name: 'Datenschutzgesetzes', gesetz: 'DSG', geltung: 'bund', beleg: U('DSG') },
  { name: 'Berufsbildungsgesetzes', gesetz: 'BBG', geltung: 'bund', beleg: U('BBG') },
  { name: 'Raumplanungsgesetzes', gesetz: 'RPG', geltung: 'bund', beleg: 'Raumplanungsgesetz' },
  { name: 'Regierungs- und Verwaltungsorganisationsgesetzes', gesetz: 'RVOG', geltung: 'bund', beleg: 'Regierungs- und Verwaltungsorganisationsgesetz' },
  { name: 'Parlamentsgesetzes', gesetz: 'PARLG', geltung: 'bund', beleg: 'Parlamentsgesetz' },
  { name: 'Strafbehördenorganisationsgesetzes', gesetz: 'STBOG', geltung: 'bund', beleg: 'Strafbehördenorganisationsgesetz' },
  { name: 'Verantwortlichkeitsgesetzes', gesetz: 'VG', geltung: 'bund', beleg: 'Verantwortlichkeitsgesetz' },
  { name: 'Anwaltsgesetzes', gesetz: 'BGFA', geltung: 'bund', beleg: 'Anwaltsgesetz' },
  { name: 'Energiegesetzes', gesetz: 'EnG', geltung: 'bund', beleg: 'Energiegesetz' },
  { name: 'Bürgerrechtsgesetzes', gesetz: 'BUEG', geltung: 'bund', beleg: 'Bürgerrechtsgesetz' },
  { name: 'Gleichstellungsgesetzes', gesetz: 'GLG', geltung: 'bund', beleg: 'Gleichstellungsgesetz' },
  { name: 'Öffentlichkeitsgesetzes', gesetz: 'BGOE', geltung: 'bund', beleg: 'Öffentlichkeitsgesetz' },
  { name: 'Familienzulagengesetzes', gesetz: 'FAMZG', geltung: 'bund', beleg: 'Familienzulagengesetz' },
  { name: 'Publikationsgesetzes', gesetz: 'PUBLG', geltung: 'bund', beleg: 'Publikationsgesetz' },
  { name: 'Waldgesetzes', gesetz: 'WAG', geltung: 'bund', beleg: 'Waldgesetz' },
  // ── V-7-Bund-Rest (14.9.2026): amtliche Kurztitel aus der Titel-KLAMMER des
  //    Ziels, deren Erlass im Korpus liegt. Gemessen als unaufgelöste Form-B-
  //    Köpfe (Sonde über alle Bund-Snapshots, 14.9.2026; Stellenzahl in
  //    Klammern). Geltung durchgehend `bund`: es sind Verordnungs-Kurztitel,
  //    die ein Kanton gleich benennen kann («Datenschutzverordnung»,
  //    «Raumplanungsverordnung», «Abfallverordnung») — alle gemessenen Stellen
  //    stehen ohnehin in Bundeserlassen, die Einschränkung kostet nichts (§1).
  //    Kandidaten OHNE Korpus-Erlass (Revisionsaufsichts-, Subventions-,
  //    Zoll-, Strafregister-, Post-, Gaststaat-, Medizinalberufegesetz …)
  //    bleiben bewusst draussen: der Wächter verlangt ein Erlassdatum aus dem
  //    Struktur-Sidecar, das es ohne Snapshot nicht gibt (Begründung im
  //    Dossier `bibliothek/normtext/verweis-traegergesetz-messung-2026-09-14.md`).
  { name: 'Arzneimittelverordnung', gesetz: 'VAM', geltung: 'bund', beleg: 'Arzneimittelverordnung' }, // 3
  { name: 'Datenschutzverordnung', gesetz: 'DSV', geltung: 'bund', beleg: 'Datenschutzverordnung' }, // 2
  { name: 'Raumplanungsverordnung', gesetz: 'RPV', geltung: 'bund', beleg: 'Raumplanungsverordnung' }, // 2
  { name: 'Bundespersonalverordnung', gesetz: 'BPV', geltung: 'bund', beleg: 'Bundespersonalverordnung' }, // 2
  { name: 'Chemikalienverordnung', gesetz: 'ChemV', geltung: 'bund', beleg: 'Chemikalienverordnung' }, // 2
  { name: 'Lärmschutz-Verordnung', gesetz: 'LSV', geltung: 'bund', beleg: 'Lärmschutz-Verordnung' }, // 2
  { name: 'Erwerbsersatzverordnung', gesetz: 'EOV', geltung: 'bund', beleg: 'Erwerbsersatzverordnung' }, // 2
  { name: 'Handelsregisterverordnung', gesetz: 'HRegV', geltung: 'bund', beleg: 'Handelsregisterverordnung' }, // 1
  { name: 'Abfallverordnung', gesetz: 'VVEA', geltung: 'bund', beleg: 'Abfallverordnung' }, // 1
  { name: 'Bankenverordnung', gesetz: 'BankV', geltung: 'bund', beleg: 'Bankenverordnung' }, // 1
  { name: 'Medizinprodukteverordnung', gesetz: 'MepV', geltung: 'bund', beleg: 'Medizinprodukteverordnung' }, // 1
  { name: 'Finanzmarktinfrastrukturverordnung', gesetz: 'FinfraV', geltung: 'bund', beleg: 'Finanzmarktinfrastrukturverordnung' }, // 1
  { name: 'Verkehrszulassungsverordnung', gesetz: 'VZV', geltung: 'bund', beleg: 'Verkehrszulassungsverordnung' }, // 1
  { name: 'Freizügigkeitsverordnung', gesetz: 'FZV', geltung: 'bund', beleg: 'Freizügigkeitsverordnung' }, // 1
  { name: 'Adoptionsverordnung', gesetz: 'AdoV', geltung: 'bund', beleg: 'Adoptionsverordnung' }, // 1
];

// ─── V-7b · Amtliche Volltitel «Bundesgesetzes/Verordnung [vom Datum] über …» ──
//
// Der Text nennt den Erlass mit seinem amtlichen Titel, oft mit Datums-
// Einschub («des Bundesgesetzes vom 20. Dezember 1946 über die Alters- und
// Hinterlassenenversicherung»). Kopfwort + Titelfragment sind zusammen der
// Erlass — ein Kanton erlässt kein «Bundesgesetz», darum gilt der Kopf
// `Bundesgesetzes` ebenenübergreifend. Der Kopf `Verordnung` ist generisch
// (kantonale «Verordnung über den Datenschutz» …) und löst NUR in
// Bundeserlassen auf. Jedes Fragment ist wörtlich der Register-Titel des Ziels
// ohne Kopfwort und Klammer-Zusatz (Wächter vergleicht auf Gleichheit).
export type TitelKopf = 'Bundesgesetzes' | 'Verordnung';
export interface TitelEintrag { kopf: TitelKopf; fragment: string; gesetz: FedlexGesetz }
export const TITEL_EINTRAEGE: ReadonlyArray<TitelEintrag> = [
  { kopf: 'Bundesgesetzes', fragment: 'über den Versicherungsvertrag', gesetz: 'VVG' },
  { kopf: 'Bundesgesetzes', fragment: 'über das Urheberrecht und verwandte Schutzrechte', gesetz: 'URG' },
  { kopf: 'Bundesgesetzes', fragment: 'über Fusion, Spaltung, Umwandlung und Vermögensübertragung', gesetz: 'FusG' },
  { kopf: 'Bundesgesetzes', fragment: 'gegen den unlauteren Wettbewerb', gesetz: 'UWG' },
  { kopf: 'Bundesgesetzes', fragment: 'über den Schutz von Marken und Herkunftsangaben', gesetz: 'MSchG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Erfindungspatente', gesetz: 'PatG' },
  { kopf: 'Bundesgesetzes', fragment: 'über den Schutz von Pflanzenzüchtungen', gesetz: 'SortG' },
  { kopf: 'Bundesgesetzes', fragment: 'über Pauschalreisen', gesetz: 'PRG' },
  { kopf: 'Bundesgesetzes', fragment: 'über Bucheffekten', gesetz: 'BEG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die eingetragene Partnerschaft gleichgeschlechtlicher Paare', gesetz: 'PARTG' },
  { kopf: 'Bundesgesetzes', fragment: 'über das Internationale Privatrecht', gesetz: 'IPRG' },
  { kopf: 'Bundesgesetzes', fragment: 'über den Konsumkredit', gesetz: 'KKG' },
  { kopf: 'Bundesgesetzes', fragment: 'über das bäuerliche Bodenrecht', gesetz: 'BGBB' },
  { kopf: 'Bundesgesetzes', fragment: 'über den Schutz von Design', gesetz: 'DESG' },
  { kopf: 'Bundesgesetzes', fragment: 'über das Jugendstrafrecht', gesetz: 'JSTG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Betäubungsmittel und die psychotropen Stoffe', gesetz: 'BETMG' },
  { kopf: 'Bundesgesetzes', fragment: 'über das Verwaltungsstrafrecht', gesetz: 'VSTRR' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Hilfe an Opfer von Straftaten', gesetz: 'OHG' },
  { kopf: 'Bundesgesetzes', fragment: 'über internationale Rechtshilfe in Strafsachen', gesetz: 'IRSG' },
  { kopf: 'Bundesgesetzes', fragment: 'über das Bundesgericht', gesetz: 'BGG' },
  { kopf: 'Bundesgesetzes', fragment: 'über das Verwaltungsverfahren', gesetz: 'VwVG' },
  { kopf: 'Bundesgesetzes', fragment: 'über das Bundesverwaltungsgericht', gesetz: 'VGG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Freizügigkeit der Anwältinnen und Anwälte', gesetz: 'BGFA' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Verantwortlichkeit des Bundes sowie seiner Behördemitglieder und Beamten', gesetz: 'VG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Organisation der Strafbehörden des Bundes', gesetz: 'STBOG' },
  { kopf: 'Bundesgesetzes', fragment: 'über Schuldbetreibung und Konkurs', gesetz: 'SchKG' },
  { kopf: 'Bundesgesetzes', fragment: 'über den Datenschutz', gesetz: 'DSG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Berufsbildung', gesetz: 'BBG' },
  { kopf: 'Bundesgesetzes', fragment: 'über den Erwerb von Grundstücken durch Personen im Ausland', gesetz: 'BewG' },
  { kopf: 'Bundesgesetzes', fragment: 'über Kartelle und andere Wettbewerbsbeschränkungen', gesetz: 'KG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die politischen Rechte', gesetz: 'BPR' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Bundesversammlung', gesetz: 'PARLG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Sammlungen des Bundesrechts und das Bundesblatt', gesetz: 'PUBLG' },
  { kopf: 'Bundesgesetzes', fragment: 'über das Öffentlichkeitsprinzip der Verwaltung', gesetz: 'BGOE' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Raumplanung', gesetz: 'RPG' },
  { kopf: 'Bundesgesetzes', fragment: 'über den Umweltschutz', gesetz: 'USG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Bekämpfung der Geldwäscherei und der Terrorismusfinanzierung', gesetz: 'GWG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Ausländerinnen und Ausländer und über die Integration', gesetz: 'AIG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Gleichstellung von Frau und Mann', gesetz: 'GLG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Eidgenössische Finanzmarktaufsicht', gesetz: 'FINMAG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Banken und Sparkassen', gesetz: 'BANKG' },
  { kopf: 'Bundesgesetzes', fragment: 'über Arzneimittel und Medizinprodukte', gesetz: 'HMG' },
  { kopf: 'Bundesgesetzes', fragment: 'über das Schweizer Bürgerrecht', gesetz: 'BUEG' },
  { kopf: 'Bundesgesetzes', fragment: 'über den Natur- und Heimatschutz', gesetz: 'NHG' },
  { kopf: 'Bundesgesetzes', fragment: 'über den Schutz der Gewässer', gesetz: 'GSCHG' },
  { kopf: 'Bundesgesetzes', fragment: 'über den Wald', gesetz: 'WAG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Enteignung', gesetz: 'ENTG' },
  { kopf: 'Bundesgesetzes', fragment: 'über das öffentliche Beschaffungswesen', gesetz: 'BOEB' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Finanzdienstleistungen', gesetz: 'FIDLEG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die kollektiven Kapitalanlagen', gesetz: 'KAG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Finanzinstitute', gesetz: 'FINIG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Finanzmarktinfrastrukturen und das Marktverhalten im Effekten- und Derivatehandel', gesetz: 'FINFRAG' },
  { kopf: 'Bundesgesetzes', fragment: 'betreffend die Aufsicht über Versicherungsunternehmen', gesetz: 'VAG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Reduktion der CO2-Emissionen', gesetz: 'CO2-Gesetz' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Bekämpfung übertragbarer Krankheiten des Menschen', gesetz: 'EpG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Transplantation von Organen, Geweben und Zellen', gesetz: 'TxG' },
  { kopf: 'Bundesgesetzes', fragment: 'über Lebensmittel und Gebrauchsgegenstände', gesetz: 'LMG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Luftfahrt', gesetz: 'LFG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Armee und die Militärverwaltung', gesetz: 'MG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die technischen Handelshemmnisse', gesetz: 'THG' },
  { kopf: 'Bundesgesetzes', fragment: 'über den Binnenmarkt', gesetz: 'BGBM' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Arbeit in Industrie, Gewerbe und Handel', gesetz: 'ArG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die flankierenden Massnahmen bei entsandten Arbeitnehmerinnen und Arbeitnehmern', gesetz: 'ENTSG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Mehrwertsteuer', gesetz: 'MWSTG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Stempelabgaben', gesetz: 'StG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die direkte Bundessteuer', gesetz: 'DBG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Verrechnungssteuer', gesetz: 'VStG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Harmonisierung der direkten Steuern der Kantone und Gemeinden', gesetz: 'STHG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Krankenversicherung', gesetz: 'KVG' },
  { kopf: 'Bundesgesetzes', fragment: 'über den Erwerbsersatz', gesetz: 'EOG' },
  { kopf: 'Bundesgesetzes', fragment: 'über den Allgemeinen Teil des Sozialversicherungsrechts', gesetz: 'ATSG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die berufliche Alters-, Hinterlassenen- und Invalidenvorsorge', gesetz: 'BVG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Unfallversicherung', gesetz: 'UVG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die obligatorische Arbeitslosenversicherung und die Insolvenzentschädigung', gesetz: 'AVIG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Invalidenversicherung', gesetz: 'IVG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Familienzulagen und Finanzhilfen an Familienorganisationen', gesetz: 'FAMZG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Alters- und Hinterlassenenversicherung', gesetz: 'AHVG' },
  { kopf: 'Bundesgesetzes', fragment: 'über Ergänzungsleistungen zur Alters-, Hinterlassenen- und Invalidenversicherung', gesetz: 'ELG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Freizügigkeit in der beruflichen Alters-, Hinterlassenen- und Invalidenvorsorge', gesetz: 'FZG' },
  { kopf: 'Bundesgesetzes', fragment: 'über die Militärversicherung', gesetz: 'MVG' },
  // Verordnungen (nur Bund-Kontext, s. o.).
  { kopf: 'Verordnung', fragment: 'über die Miete und Pacht von Wohn- und Geschäftsräumen', gesetz: 'VMWG' },
  { kopf: 'Verordnung', fragment: 'über den Schutz von Marken und Herkunftsangaben', gesetz: 'MSchV' },
  { kopf: 'Verordnung', fragment: 'über die Erfindungspatente', gesetz: 'PatV' },
  { kopf: 'Verordnung', fragment: 'über den Schutz von Design', gesetz: 'DesV' },
  { kopf: 'Verordnung', fragment: 'über das Urheberrecht und verwandte Schutzrechte', gesetz: 'URV' },
  { kopf: 'Verordnung', fragment: 'zum Konsumkreditgesetz', gesetz: 'VKKG' },
  { kopf: 'Verordnung', fragment: 'über die Adoption', gesetz: 'AdoV' },
  { kopf: 'Verordnung', fragment: 'über die Aufnahme von Pflegekindern', gesetz: 'PAVO' },
  { kopf: 'Verordnung', fragment: 'über kriminalpolizeiliche Zentralstellen des Bundes', gesetz: 'ZentV' },
  { kopf: 'Verordnung', fragment: 'über die Betäubungsmittelkontrolle', gesetz: 'BetmKV' },
  { kopf: 'Verordnung', fragment: 'über die Geschäftsführung der Konkursämter', gesetz: 'KOV' },
  { kopf: 'Verordnung', fragment: 'über Zulassung, Aufenthalt und Erwerbstätigkeit', gesetz: 'VZAE' },
  { kopf: 'Verordnung', fragment: 'über die Zulassung von Personen und Fahrzeugen zum Strassenverkehr', gesetz: 'VZV' },
  { kopf: 'Verordnung', fragment: 'über den Datenschutz', gesetz: 'DSV' },
  { kopf: 'Verordnung', fragment: 'über den Erwerb von Grundstücken durch Personen im Ausland', gesetz: 'BewV' },
  { kopf: 'Verordnung', fragment: 'über die Einreise und die Visumerteilung', gesetz: 'VEV' },
  { kopf: 'Verordnung', fragment: 'über die Integration von Ausländerinnen und Ausländern', gesetz: 'VIntA' },
  { kopf: 'Verordnung', fragment: 'über die Vermeidung und die Entsorgung von Abfällen', gesetz: 'VVEA' },
  { kopf: 'Verordnung', fragment: 'über den Schutz vor gefährlichen Stoffen und Zubereitungen', gesetz: 'ChemV' },
  { kopf: 'Verordnung', fragment: 'über den Natur- und Heimatschutz', gesetz: 'NHV' },
  { kopf: 'Verordnung', fragment: 'über den Wald', gesetz: 'WaV' },
  { kopf: 'Verordnung', fragment: 'über die technischen Anforderungen an Strassenfahrzeuge', gesetz: 'VTS' },
  { kopf: 'Verordnung', fragment: 'über die Banken und Sparkassen', gesetz: 'BankV' },
  { kopf: 'Verordnung', fragment: 'über die kollektiven Kapitalanlagen', gesetz: 'KKV' },
  { kopf: 'Verordnung', fragment: 'über die Eigenmittel und Risikoverteilung der Banken und Wertpapierhäuser', gesetz: 'ERV' },
  { kopf: 'Verordnung', fragment: 'über die Finanzinstitute', gesetz: 'FINIV' },
  { kopf: 'Verordnung', fragment: 'über die Finanzmarktinfrastrukturen und das Marktverhalten im Effekten- und Derivatehandel', gesetz: 'FinfraV' },
  { kopf: 'Verordnung', fragment: 'über die Finanzdienstleistungen', gesetz: 'FIDLEV' },
  { kopf: 'Verordnung', fragment: 'über die Beaufsichtigung von privaten Versicherungsunternehmen', gesetz: 'AVO' },
  { kopf: 'Verordnung', fragment: 'über die Arzneimittel', gesetz: 'VAM' },
  { kopf: 'Verordnung', fragment: 'über die Bewilligungen im Arzneimittelbereich', gesetz: 'AMBV' },
  { kopf: 'Verordnung', fragment: 'über die Bekämpfung übertragbarer Krankheiten des Menschen', gesetz: 'EpV' },
  { kopf: 'Verordnung', fragment: 'über die Berufsbildung', gesetz: 'BBV' },
  { kopf: 'Verordnung', fragment: 'über die Berufsmaturität', gesetz: 'BMV' },
  { kopf: 'Verordnung', fragment: 'über das Zentrale Migrationsinformationssystem', gesetz: 'ZEMIS-V' },
  { kopf: 'Verordnung', fragment: 'über die Ausstellung von Reisedokumenten für ausländische Personen', gesetz: 'RDV' },
  { kopf: 'Verordnung', fragment: 'über die Umweltverträglichkeitsprüfung', gesetz: 'UVPV' },
  { kopf: 'Verordnung', fragment: 'über den Verkehr mit Abfällen', gesetz: 'VeVA' },
  { kopf: 'Verordnung', fragment: 'über die Infrastruktur der Luftfahrt', gesetz: 'VIL' },
  { kopf: 'Verordnung', fragment: 'über Fernmeldedienste', gesetz: 'FDV' },
  { kopf: 'Verordnung', fragment: 'über Fernmeldeanlagen', gesetz: 'FAV' },
  { kopf: 'Verordnung', fragment: 'zum Bundesgesetz über die Schweizerische Nationalbank', gesetz: 'NBV' },
  { kopf: 'Verordnung', fragment: 'über die Verrechnungssteuer', gesetz: 'VStV' },
  { kopf: 'Verordnung', fragment: 'über die Krankenversicherung', gesetz: 'KVV' },
  { kopf: 'Verordnung', fragment: 'über die Alters- und Hinterlassenenversicherung', gesetz: 'AHVV' },
  { kopf: 'Verordnung', fragment: 'über die Invalidenversicherung', gesetz: 'IVV' },
  { kopf: 'Verordnung', fragment: 'über die Ergänzungsleistungen zur Alters-, Hinterlassenen- und Invalidenversicherung', gesetz: 'ELV' },
  { kopf: 'Verordnung', fragment: 'über die berufliche Alters-, Hinterlassenen- und Invalidenvorsorge', gesetz: 'BVV 2' },
  { kopf: 'Verordnung', fragment: 'über die Unfallversicherung', gesetz: 'UVV' },
  { kopf: 'Verordnung', fragment: 'über die obligatorische Arbeitslosenversicherung und die Insolvenzentschädigung', gesetz: 'AVIV' },
  { kopf: 'Verordnung', fragment: 'über den Allgemeinen Teil des Sozialversicherungsrechts', gesetz: 'ATSV' },
  { kopf: 'Verordnung', fragment: 'über die Freizügigkeit in der beruflichen Alters-, Hinterlassenen- und Invalidenvorsorge', gesetz: 'FZV' },
  { kopf: 'Verordnung', fragment: 'über die steuerliche Abzugsberechtigung für Beiträge an anerkannte Vorsorgeformen', gesetz: 'BVV 3' },
  { kopf: 'Verordnung', fragment: 'über die Militärversicherung', gesetz: 'MVV' },
  { kopf: 'Verordnung', fragment: 'über die Familienzulagen', gesetz: 'FamZV' },
  { kopf: 'Verordnung', fragment: 'über die freiwillige Alters-, Hinterlassenen- und Invalidenversicherung', gesetz: 'VFV' },
  { kopf: 'Verordnung', fragment: 'über die Versichertenkarte für die obligatorische Krankenpflegeversicherung', gesetz: 'VVK' },
  { kopf: 'Verordnung', fragment: 'über die Kostenermittlung und die Leistungserfassung durch Spitäler, Geburtshäuser und Pflegeheime in der Krankenversicherung', gesetz: 'VKL' },
];

/** Geltung eines Titel-Kopfs: nur `Bundesgesetzes` ist ebenenübergreifend. */
export const titelGeltung = (kopf: TitelKopf): Geltung => (kopf === 'Bundesgesetzes' ? 'alle' : 'bund');

// ─── V-8 · Amtliche Kürzel-Schreibweisen → FEDLEX-Key ──────────────────────
//
// Die FEDLEX-Tabelle führt jüngere Keys in Grossbuchstaben (BANKG, ASYLG …);
// der Gesetzestext schreibt das amtliche Kürzel gemischt («BankG», «AsylG»).
// Ohne diese Tabelle blieb «Art. 1b BankG» ein unbekanntes Kürzel (M12,
// Text) — 601 Stellen im Korpus (1.9.2026). Beleg je Eintrag: das Kürzel
// steht in der Klammer des Bund-Register-Titels («… (Bankengesetz, BankG)»).
export const KUERZEL_SCHREIBWEISEN: ReadonlyArray<readonly [string, FedlexGesetz]> = [
  ['FinfraG', 'FINFRAG'], ['BankG', 'BANKG'], ['AsylG', 'ASYLG'], ['GSchG', 'GSCHG'],
  ['BetmG', 'BETMG'], ['FamZG', 'FAMZG'], ['GwG', 'GWG'], ['JStG', 'JSTG'],
  ['PartG', 'PARTG'], ['DesG', 'DESG'], ['EntG', 'ENTG'], ['VStrR', 'VSTRR'],
  ['WaG', 'WAG'], ['StHG', 'STHG'], ['EntsG', 'ENTSG'], ['ParlG', 'PARLG'],
  ['PublG', 'PUBLG'], ['StBOG', 'STBOG'], ['GlG', 'GLG'], ['BüG', 'BUEG'],
  ['BGÖ', 'BGOE'], ['BöB', 'BOEB'], ['PüG', 'PUEG'], ['EAUe', 'EAUE'],
];

export function schreibweiseZuKey(schreibweise: string): FedlexGesetz | null {
  return KUERZEL_SCHREIBWEISEN.find(([s]) => s === schreibweise)?.[1] ?? null;
}

// ─── V-7c · Trägergesetz-Kontext «Artikel N des Gesetzes» ────────────────────
//
// PROBLEM (gemessen 14.9.2026 über alle Bund-Snapshots): 35 Bund-Stellen
// zitieren «Artikel N des Gesetzes» — ohne Namen. Der des/der-Guard macht
// daraus Text. Der Verweis ist aber nicht unbestimmt: in einer Vollzugs-
// verordnung meint «das Gesetz» das Gesetz, auf das sie sich stützt.
//
// AMTLICHER BELEG, nicht Vermutung (§1/§7): der Gesetzgeber DEFINIERT die
// Kurzform selbst im Ingress, in der Klammer hinter dem zitierten Erlass —
// «gestützt auf Artikel 27 des Arbeitsgesetzes vom 13. März 1964 (Gesetz),».
// Ein Ingress mit mehreren zitierten Erlassen bleibt eindeutig, weil die
// Legaldefinition an genau einem davon hängt (ARGV1 nennt ArG, UVG und DSG —
// «(Gesetz, ArG)» steht nur beim Arbeitsgesetz).
//
// QUELLE (§5): `kopf.praeambel[rolle='ingress']` des Struktur-Sidecars
// `public/normtext/struktur/bund/<KEY>.json`, aus der amtlichen Fedlex-Fassung
// übernommen; das Register führt `quelleUrl`/`stand`. Diese Tabelle ist eine
// KURATIERTE Auswahl daraus, keine Ableitung: ein neuer Erlass mit derselben
// Wendung bekommt den Link erst, wenn er hier steht. Der Wächter
// `src/tests/fedlex-traegergesetz.test.ts` prüft JEDEN Eintrag gegen den
// Ingress (genau eine «(… Gesetz …)»-Klammer; das davor zitierte Erlassdatum
// ist das Erlassdatum des Ziels) — ein erfundener Eintrag reisst das Tor.
//
// NICHT aufgenommen (gemessene Gegenprobe, bleiben Text):
//   · bund/BANKG art_16 und bund/GSCHG art_83 — Gesetze ohne solche
//     Legaldefinition im Ingress;
//   · bund/LUGUE annex_I (2 Stellen) — «des Gesetzes zur Lösung von
//     Gesetzeskollisionen …» ist ein AUSLÄNDISCHES Gesetz, kein Trägergesetz.
export interface TraegerEintrag {
  /** Register-Key der Verordnung (= letztes Segment des Lese-Basispfads). */
  verordnung: string;
  /** Das im Ingress als «Gesetz» legaldefinierte Trägergesetz. */
  gesetz: FedlexGesetz;
  /** Beleg: der Ingress-Wortlaut mit der Legaldefinition, wörtlich. */
  beleg: string;
}
export const TRAEGER_EINTRAEGE: ReadonlyArray<TraegerEintrag> = [
  {
    verordnung: 'ARGV1', gesetz: 'ArG',
    beleg: 'gestützt auf Artikel 40 des Arbeitsgesetzes vom 13. März 1964 (Gesetz, ArG)',
  },
  {
    verordnung: 'ARGV2', gesetz: 'ArG',
    beleg: 'gestützt auf Artikel 27 des Arbeitsgesetzes vom 13. März 1964 (Gesetz),',
  },
  {
    verordnung: 'UVV', gesetz: 'UVG',
    beleg: 'auf das Bundesgesetz vom 20. März 1981 über die Unfallversicherung (Gesetz/UVG)',
  },
  {
    verordnung: 'MVV', gesetz: 'MVG',
    beleg: 'des Bundesgesetzes vom 19. Juni 1992 über die Militärversicherung (Gesetz),',
  },
  {
    verordnung: 'LSV', gesetz: 'USG',
    beleg: 'des Umweltschutzgesetzes vom 7. Oktober 1983 (Gesetz),',
  },
  {
    verordnung: 'LRV', gesetz: 'USG',
    beleg: 'des Bundesgesetzes vom 7. Oktober 1983 über den Umweltschutz (Gesetz),',
  },
  {
    verordnung: 'VKL', gesetz: 'KVG',
    beleg: 'gestützt auf Artikel 96 des Bundesgesetzes vom 18. März 1994 über die Krankenversicherung (Gesetz),',
  },
];

const TRAEGER_BY_KEY = new Map<string, FedlexGesetz>(
  TRAEGER_EINTRAEGE.map((e) => [e.verordnung.toUpperCase(), e.gesetz]),
);

/**
 * Trägergesetz des GELESENEN Erlasses — das Gesetz, das sein Ingress als
 * «Gesetz» legaldefiniert. Ohne Eintrag null (⇒ «des Gesetzes» bleibt Text).
 *
 * @param erlassKey Register-Key des gelesenen Erlasses (letztes Segment des
 *        Lese-Basispfads, z. B. `ARGV1`).
 */
export function traegergesetzFuerErlass(erlassKey: string | undefined): FedlexGesetz | null {
  return erlassKey ? TRAEGER_BY_KEY.get(erlassKey.toUpperCase()) ?? null : null;
}

// ─── V-5 · Erlassdatum je Ziel-Erlass (Zeit-Kante, Fix-Runde 1 zu W2·20) ──────
//
// PROBLEM (Gegenprüfung 1.9.2026, Blocker 2): Die Zitier-Konvention nennt den
// Erlass mit Datum («des Bundesgesetzes vom 20. September 1949 über die
// Militärversicherung»). Der Parser las das Datum, verwarf es aber ungeprüft —
// ein zitierter AUFGEHOBENER Vorgänger-Erlass landete damit auf dem GELTENDEN
// Gesetz mit anderer Nummerierung. Belegte Falschlinks vor dem Fix:
//   · bund/STHG/art_76       «Bundesgesetzes vom 20. September 1949 über die
//                             Militärversicherung» → MVG (geltend: 19.6.1992)
//   · bund/OR/disp_u13_art_6  Berufsbildungsgesetz 1963 → BBG (13.12.2002)
//   · bund/BBV/art_74         Berufsbildungsgesetz 1978 → BBG
//   · bund/LMG/art_43         Beschaffungsgesetz 1994 → BöB (21.6.2019)
//
// FIX (§1): Ein im Text ZITIERTES Datum wird gegen das Erlassdatum des Ziels
// geprüft. Passt es nicht — oder ist für das Ziel kein Erlassdatum bekannt —,
// wird NICHT verlinkt. Zitier-Tippfehler der Quelle (ZH-211.11 art_13 IPRG
// «17.9.1987», ATSV art_17_b IVG «19.6.1995») werden dabei zu Text; das ist die
// konservative und damit richtige Seite.
//
// QUELLE (§5, §7): `kopf.erlassdatum` des Struktur-Sidecars
// `public/normtext/struktur/bund/<KEY>.json` — von `scripts/normtext/
// kopf-extrahiere.ts` aus der amtlichen Fedlex-Fassung übernommen
// (`<p class="erlassdatum">vom 19. Juni 1992 (Stand am 1. Januar 2024)</p>`);
// Quelle-URL und Stand stehen im Register. Diese Tabelle ist eine
// deterministische PROJEKTION davon, keine zweite Wahrheit: der Wächter
// `src/tests/fedlex-positivliste.test.ts` vergleicht JEDEN Wert gegen das
// Sidecar und reisst bei Abweichung oder fehlendem Eintrag.
export const ERLASSDATUM: Partial<Record<FedlexGesetz, string>> = {
  'AHVG': '1946-12-20',
  'AHVV': '1947-10-31',
  'AIG': '2005-12-16',
  'AMBV': '2018-11-14',
  'ASYLG': '1998-06-26',
  'ATSG': '2000-10-06',
  'ATSV': '2002-09-11',
  'AVIG': '1982-06-25',
  'AVIV': '1983-08-31',
  'AVO': '2005-11-09',
  'AdoV': '2011-06-29',
  'ArG': '1964-03-13',
  'BANKG': '1934-11-08',
  'BBG': '2002-12-13',
  'BBV': '2003-11-19',
  'BEG': '2008-10-03',
  'BETMG': '1951-10-03',
  'BGBB': '1991-10-04',
  'BGBM': '1995-10-06',
  'BGFA': '2000-06-23',
  'BGG': '2005-06-17',
  'BGOE': '2004-12-17',
  'BMV': '2009-06-24',
  'BOEB': '2019-06-21',
  'BPG': '2000-03-24',
  'BPR': '1976-12-17',
  'BPV': '2001-07-03',
  'BUEG': '2014-06-20',
  'BV': '1999-04-18',
  'BVG': '1982-06-25',
  'BVV 2': '1984-04-18',
  'BVV 3': '1985-11-13',
  'BankV': '2014-04-30',
  'BetmKV': '2011-05-25',
  'BewG': '1983-12-16',
  'BewV': '1984-10-01',
  'CO2-Gesetz': '2011-12-23',
  'ChemV': '2015-06-05',
  'DBG': '1990-12-14',
  'DESG': '2001-10-05',
  'DSG': '2020-09-25',
  'DSV': '2022-08-31',
  'DesV': '2002-03-08',
  'EBG': '1957-12-20',
  'ELG': '2006-10-06',
  'ELV': '1971-01-15',
  'ENTG': '1930-06-20',
  'ENTSG': '1999-10-08',
  'EOG': '1952-09-25',
  'EOV': '2004-11-24',
  'ERV': '2012-06-01',
  'EnG': '2016-09-30',
  'EpG': '2012-09-28',
  'EpV': '2015-04-29',
  'FAMZG': '2006-03-24',
  'FAV': '2015-11-25',
  'FDV': '2007-03-09',
  'FIDLEG': '2018-06-15',
  'FIDLEV': '2019-11-06',
  'FINFRAG': '2015-06-19',
  'FINIG': '2018-06-15',
  'FINIV': '2019-11-06',
  'FINMAG': '2007-06-22',
  'FMG': '1997-04-30',
  'FZG': '1993-12-17',
  'FZV': '1994-10-03',
  'FamZV': '2007-10-31',
  'FinfraV': '2015-11-25',
  'FusG': '2003-10-03',
  'GLG': '1995-03-24',
  'GSCHG': '1991-01-24',
  'GWG': '1997-10-10',
  'HMG': '2000-12-15',
  'HRegV': '2007-10-17',
  'IPRG': '1987-12-18',
  'IRSG': '1981-03-20',
  'IVG': '1959-06-19',
  'IVV': '1961-01-17',
  'JSTG': '2003-06-20',
  'JStPO': '2009-03-20',
  'KAG': '2006-06-23',
  'KG': '1995-10-06',
  'KKG': '2001-03-23',
  'KKV': '2006-11-22',
  'KOV': '1911-07-13',
  'KVG': '1994-03-18',
  'KVV': '1995-06-27',
  'LFG': '1948-12-21',
  'LMG': '2014-06-20',
  'LSV': '1986-12-15',
  'MG': '1995-02-03',
  'MSchG': '1992-08-28',
  'MSchV': '1992-12-23',
  'MStG': '1927-06-13',
  'MStP': '1979-03-23',
  'MVG': '1992-06-19',
  'MVV': '1993-11-10',
  'MWSTG': '2009-06-12',
  'MepV': '2020-07-01',
  'NBV': '2004-03-18',
  'NHG': '1966-07-01',
  'NHV': '1991-01-16',
  'OHG': '2007-03-23',
  'OR': '1911-03-30',
  'PARLG': '2002-12-13',
  'PARTG': '2004-06-18',
  'PAVO': '1977-10-19',
  'PRG': '1993-06-18',
  'PUBLG': '2004-06-18',
  'PUEG': '1985-12-20',
  'PatG': '1954-06-25',
  'PatV': '1977-10-19',
  'RDV': '2012-11-14',
  'RPG': '1979-06-22',
  'RPV': '2000-06-28',
  'RVOG': '1997-03-21',
  'STBOG': '2010-03-19',
  'STHG': '1990-12-14',
  'SVG': '1958-12-19',
  'SchKG': '1889-04-11',
  'SortG': '1975-03-20',
  'StG': '1973-06-27',
  'StGB': '1937-12-21',
  'StPO': '2007-10-05',
  'THG': '1995-10-06',
  'TxG': '2004-10-08',
  'URG': '1992-10-09',
  'URV': '1993-04-26',
  'USG': '1983-10-07',
  'UVG': '1981-03-20',
  'UVPV': '1988-10-19',
  'UVV': '1982-12-20',
  'UWG': '1986-12-19',
  'VAG': '2004-12-17',
  'VAM': '2018-09-21',
  'VEV': '2018-08-15',
  'VFV': '1961-05-26',
  'VG': '1958-03-14',
  'VGG': '2005-06-17',
  'VIL': '1994-11-23',
  'VIntA': '2018-08-15',
  'VKKG': '2002-11-06',
  'VKL': '2002-07-03',
  'VMWG': '1990-05-09',
  'VSTRR': '1974-03-22',
  'VStG': '1965-10-13',
  'VStV': '1966-12-19',
  'VTS': '1995-06-19',
  'VVEA': '2015-12-04',
  'VVG': '1908-04-02',
  'VVK': '2007-02-14',
  'VZAE': '2007-10-24',
  'VZV': '1976-10-27',
  'VeVA': '2005-06-22',
  'VwVG': '1968-12-20',
  'WAG': '1991-10-04',
  'WaV': '1992-11-30',
  'ZEMIS-V': '2006-04-12',
  'ZGB': '1907-12-10',
  'ZPO': '2008-12-19',
  'ZentV': '2001-11-30',
};

// Monatsnamen der amtlichen Zitier-Konvention; die Abkürzung («18. Dez. 1987»)
// löst über ein EINDEUTIGES Präfix ab drei Buchstaben auf. Mehrdeutiges («Ju»)
// bleibt unauflösbar → kein Link (§1, nie raten).
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli',
  'August', 'September', 'Oktober', 'November', 'Dezember'] as const;

/** Zitiertes Datum («20. Dezember 1946», «18. Dez. 1987») → ISO, sonst null. */
export function zitiertesDatumIso(roh: string): string | null {
  const m = /^\s*(\d{1,2})\.\s*([A-Za-zÄÖÜäöüß]+)\.?\s+(\d{4})\s*$/.exec(roh.replace(/­/g, ''));
  if (!m) return null;
  const wort = m[2].toLowerCase();
  const treffer = MONATE.map((x, i) => [x.toLowerCase(), i] as const)
    .filter(([x]) => x === wort || (wort.length >= 3 && x.startsWith(wort)));
  if (treffer.length !== 1) return null; // unbekannt oder mehrdeutig → kein Link
  return `${m[3]}-${String(treffer[0][1] + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

/**
 * Zeit-Kante (§1): Passt ein im Text zitiertes Erlassdatum zum Ziel-Erlass?
 * Ohne zitiertes Datum gibt es nichts zu widerlegen → true. Mit Datum muss das
 * Ziel ein bekanntes Erlassdatum haben UND übereinstimmen — sonst zitiert der
 * Text einen anderen (i. d. R. aufgehobenen) Erlass und wird nicht verlinkt.
 */
export function datumPasst(gesetz: FedlexGesetz, rohDatum: string | null | undefined): boolean {
  if (!rohDatum) return true;
  const soll = ERLASSDATUM[gesetz];
  if (!soll) return false; // Ziel ohne belegtes Erlassdatum → nicht prüfbar → kein Link
  return zitiertesDatumIso(rohDatum) === soll;
}

// ─── Z5 (W2·22) · Kürzel, die im Kantonsrecht einen ANDEREN Erlass bezeichnen ─
//
// Der ausgeschriebene Artikelverweis (`ausgeschriebeneVerweiseImText`,
// `spannen.ts`) bindet an ein BLOSSES Kürzel. Für die grossen Bundeserlasse
// («ZGB», «StPO», «SchKG») ist das ebenenübergreifend eindeutig — für
// Kürzel, die JEDER Kanton auch für einen EIGENEN Erlass verwendet, ist es das
// nicht. Dieselbe Sorge, die oben die GELTUNG der Kurztitel-Genitive trägt,
// nur auf der Kürzel-Ebene; die Geltungs-Angabe der NAMEN hilft hier nicht
// («Bundesgesetz über die Stempelabgaben» ist als Name eindeutig, sein Kürzel
// «StG» ist es nicht).
//
// BELEGE (gemessen 2.9.2026 über den ganzen Snapshot-Korpus, vor dem Guard):
//   · kanton/AR/621.111 art_48 «Einkünfte nach Art. 98 Abs. 2 lit. a und b StG»
//     — gemeint ist das AR-Steuergesetz, verlinkt wurde SR 641.10
//     (Stempelabgaben-StG des Bundes).
//   · kanton/BE/215.326.2 art_28 «Zuständige Behörde im Sinne von Artikel 225
//     Absatz 2 StG» — gemeint ist das BE-Steuergesetz, verlinkt wurde SR 641.10.
// Beide Stellen sind für die ABGEKÜRZTE Zitatform (NORM_IM_TEXT) nicht
// erreichbar, entstünden also erst durch Z5 — darum der Guard hier und nicht
// weiter unten (§1: kein Link ist besser als ein falscher).
//
// AUFNAHME-REGEL (kein Vorrat auf Verdacht, §17-Gegengewicht): ein Eintrag
// braucht eine gemessene Korpus-Stelle, an der ein Kantonserlass dieses Kürzel
// für sich selbst oder für einen anderen Kantonserlass verwendet. Fehlt der
// Beleg, gehört das Kürzel NICHT hierher — sonst gehen richtige Links verloren
// (gemessen: der Guard kostet im Kantonskorpus 2 von 335 Z5-Links).
//
// ZWEITE AUFNAHME-KLASSE (W2·18-FEHLERBUCH, 12.9.2026): ein Kürzel kann auch
// OHNE einen gleichnamigen Kantonserlass falsch sein, wenn der Register-Key
// einen SPÄTEREN Bundeserlass trägt, der eine ÄLTERE, im Korpus nicht geführte
// Fassung mit demselben amtlichen Kürzel abgelöst hat. Beleg: kanton/SG/3849
// art_7 «Eidgenössische Schutzbautenverordnung vom 27. November 1978 (BMV) …
// Prüfung und Genehmigung von Projekten für private Schutzräume (Art. 9 BMV;
// …)» — gemeint ist diese 1978er Verordnung, verlinkt wurde `BMV` = SR
// 412.103.1 (Berufsmaturitätsverordnung, ein VÖLLIG anderes Sachgebiet;
// Register-Key `BMV` = Fassung cc/2009/423, per 1.3.2026 aufgehoben, geltend
// ist `BMV_2025` = cc/2025/408 — Gegenprüfung 12.9.2026). Die 1978er Schutzbautenverordnung ist im Korpus nicht als
// eigener Snapshot geführt — es gibt kein richtiges Ziel, an das der Guard
// stattdessen binden könnte; er unterdrückt darum nur (§1: kein Link statt
// eines falschen), wie bei StG. Ebenfalls Rot-Beweis fürs zweite Leck der
// Kürzel-Bindung: die primäre `NORM_IM_TEXT`-Anker-Form («Art. 9 BMV» ganz
// ohne Passus) lief bis hierher am Z5-Pfad und damit an DIESEM Guard vorbei
// (Fix: `normVerweiseImText`, spannen.ts).
export const KUERZEL_NUR_BUND: ReadonlySet<FedlexGesetz> = new Set<FedlexGesetz>([
  'StG', // Steuergesetz — jeder Kanton führt eines (Belege oben)
  'BMV', // Berufsmaturitätsverordnung — kollidiert mit der 1978er eidg.
         // Schutzbautenverordnung desselben Kürzels, nicht im Korpus (Beleg oben)
]);

// ─── Z5-Nachzug (GP zu PR #635) · Kürzel + ZUSATZWORT = ein ANDERER Erlass ───
//
// Ein bare Bundes-Kürzel bindet nur dann an den Bundeserlass, wenn es FÜR SICH
// steht. Folgt ihm ein Wort, das den Kurztitel WEITERFÜHRT, meint der Text
// einen anderen — hier: interkantonalen — Erlass mit demselben Stamm-Kürzel.
//
// BELEGE (gemessen 2.9.2026 über den ganzen Snapshot-Korpus, vor dem Guard):
//   · kanton/BS/419.905 art_2 «Gemäss Art. 10 der AVO Inland sind …» (2 Z5-
//     Stellen) und kanton/BS/419.902 art_11 «gemäss Art. 11 Abs. 3 AVO Inland
//     vom 20. Mai 1999» — gemeint ist die interkantonale «Anerkennungs-
//     verordnung Inland (AVO Inland)» der SDK/GDK, die als kanton/BS/419.901
//     SELBST im Korpus liegt; verlinkt wurde SR 961.011 (eidgenössische
//     Aufsichtsverordnung AVO). Das Zusatzwort blockiert zugleich die
//     Zeit-Kante: «vom 20. Mai 1999» steht HINTER «Inland» und wird von
//     DATUM_NACH_NAME (`^\s*vom`) nicht mehr gesehen.
//   · «VO Ausland der GDK» (kanton/BS/419.903) belegt das Gegenstück; «AVO
//     Inland» kommt im Korpus 21-mal vor.
//
// AUFNAHME-REGEL (wie bei KUERZEL_NUR_BUND: kein Vorrat auf Verdacht,
// §17-Gegengewicht): nur Wörter mit einer gemessenen Korpus-Stelle, an der sie
// einem Fedlex-Kürzel UNMITTELBAR folgen und dort den Titel eines anderen
// Erlasses weiterführen.
//   · GEPRÜFT UND NICHT AUFGENOMMEN: «GDK», «EDK», «SODK» — im ganzen Korpus
//     folgt keines davon je einem Fedlex-Kürzel (gemessen: «Die GDK», «NW EDK»,
//     «Vorstand SODK»). Ein Guard, der nicht scheitern kann, wird nicht gebaut.
//   · VERWORFEN: die allgemeine Regel «irgendein grossgeschriebenes Folgewort
//     sperrt». Gemessen 60 Z5-Stellen mit grossgeschriebenem Folgewort — 57
//     davon sind RICHTIGE Links, deren Folgewort blosser Satz-Fortgang ist
//     («… die nach Artikel 7 USG Abfälle sind», «… findet Artikel 333 OR
//     Anwendung», «… gemäss Artikel 11 AHVG Anspruch …»). Die Regel hätte 57
//     richtige Links gekostet, um 3 falsche zu heilen (§1 schneidet in beide
//     Richtungen: ein fehlender Link ist auch ein Mangel).
export const KUERZEL_ZUSATZ_SPERRE: readonly string[] = ['Inland', 'Ausland'];

const ZUSATZWORT_RE = new RegExp('^\\s+(?:' + KUERZEL_ZUSATZ_SPERRE.join('|') + ')\\b');

/**
 * Folgt dem eben erkannten Kürzel ein titel-weiterführendes Zusatzwort? Dann
 * nennt der Text einen ANDEREN Erlass → kein Link (§1).
 *
 * @param nachKuerzel Quelltext UNMITTELBAR hinter dem Kürzel.
 */
export function zusatzwortSperre(nachKuerzel: string): boolean {
  return ZUSATZWORT_RE.test(nachKuerzel);
}

// ─── Z5-Nachzug (GP zu PR #635) · Verweis auf eine HISTORISCHE Fassung ───────
//
// «Artikel 18 Absatz 3 KAG in der Fassung vom 28. September 2012» meint eine
// AUFGEHOBENE Fassung, nicht die geltende — der Leser zeigt aber immer die
// geltende (§7). Der Zielartikel existiert dort oft gar nicht mehr: belegt an
// bund/FINIV art_93 (KAG art_18 ist in der geltenden Fassung weg). Also KEIN
// Link — bewusste Unter-Verlinkung, historische Fassungen sind nicht der
// Zielraum des Lesers (§8).
//
// Die Zeit-Kante `datumPasst` fasst diese Stellen NICHT: sie sucht das
// ERLASSdatum unmittelbar hinter dem Namen (`DATUM_NACH_NAME`, `^\s*vom`),
// hier steht «in der Fassung» dazwischen — und das genannte Datum ist ohnehin
// ein Revisions-, kein Erlassdatum.
//
// ENG gefasst auf die Formen, die eine BESTIMMTE VERGANGENE Fassung nennen.
// Bewusst NICHT erfasst sind die DYNAMISCHEN Verweise auf die jeweils geltende
// Fassung — sie zeigen genau dorthin, wohin der Leser führt, und bleiben
// verlinkt (gemessen im Korpus: «in der jeweils geltenden Fassung» 3×, «in der
// jeweils gültigen Fassung» 1×, «in der für die Schweiz verbindlichen Fassung»
// 22×).
const HISTORISCHE_FASSUNG = new RegExp(
  // Vorspann `[\\s,;]`: die amtliche Zitierweise schiebt zwischen Kürzel und
  // Fassungs-Angabe gelegentlich ein Satzzeichen ein (belegt bund/FIDLEV art_105:
  // «Artikel 20 des Kollektivanlagengesetzes vom 23. Juni 2006 (KAG); in der
  // Fassung vom 1. März 2013;»).
  '^[\\s,;]*in\\s+(?:der|seiner|ihrer)\\s+(?:'
    // «in der Fassung vom 1. März 2013» · «in seiner Fassung vom …»
    + 'Fassung\\s+vom\\b'
    // «in der bis zum 31. Dezember 2019 geltenden Fassung» — wortweise
    // begrenzt (bis sechs Wörter), damit das Muster nie über einen Satz läuft.
    + '|bis\\s+(?:\\S+\\s+){1,6}?geltenden\\s+Fassung\\b'
    + ')',
);

/**
 * Zielt der Verweis ausdrücklich auf eine bestimmte VERGANGENE Fassung? Dann
 * kein Link (§7/§8). Herleitung und Abgrenzung oben.
 *
 * @param nachKuerzel Quelltext UNMITTELBAR hinter dem Kürzel bzw. Erlassnamen.
 */
export function historischeFassung(nachKuerzel: string): boolean {
  return HISTORISCHE_FASSUNG.test(nachKuerzel);
}
