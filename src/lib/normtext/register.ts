// ─── Erlass-Register: Single Source of Truth für Identität + Taxonomie ──────
//
// Welche Erlasse gibt es, und wie sind sie eingeordnet? Reine Daten (§3) — KEIN
// Normtext (der lebt in den Snapshots public/normtext/*.json, §5/§7). Aus diesem
// Register + den Snapshots generiert scripts/normtext/browse-manifest.ts das
// Browse-Manifest public/normtext/register.json (Rubrik V «Gesetze»).
//
// Invariante (Tor src/tests/normtext-register.test.ts): Register ⊇ Snapshots —
// jedes Bundes-Snapshot hat genau einen Register-Eintrag, jeder Bund-Eintrag mit
// status 'snapshot' eine Datei. Taxonomie ist DEKLARIERT (§2: keine Heuristik),
// nie geraten. Ableitbares (stand/quelleUrl/Artikelzahl) steht NICHT hier,
// sondern wird vom Generator aus den Snapshots gezogen (sonst Drift).

import { FEDLEX, type FedlexGesetz } from '../fedlex';
import { aufhebungFuerRegister } from './aufhebungen';
import { BUND_STUBS } from './bund-stubs.generated';
import { GRUNDART_SEED } from './grundart.generated';
import { INTERNATIONAL_EXTERN } from './international-extern';
import { PDF_EMBED } from './pdf-embed';

// H-8/B22: Typen (Rechtsgebiet/Sprache/ErlassStatus/Grundart/ErlassTyp/
// ErlassRegistereintrag) leben in register-typen.ts (löst den Typ-Zyklus mit
// bund-stubs.generated.ts/grundart.generated.ts/international-extern.ts/
// pdf-embed.ts, die diese Typen importieren). `export type` re-exportiert sie
// unverändert für alle Bestands-Konsumenten (isolatedModules-sicher, kein
// Wert-Import).
export type { Rechtsgebiet, Sprache, ErlassStatus, Grundart, ErlassTyp, ErlassRegistereintrag } from './register-typen';
import type { Rechtsgebiet, ErlassRegistereintrag } from './register-typen';

/** Anzeige-Reihenfolge + Labels der Sach-Achsen (Übersicht Bund). */
export const GEBIETE: ReadonlyArray<{ id: Rechtsgebiet; label: string }> = [
  { id: 'privat', label: 'Privatrecht' },
  { id: 'straf', label: 'Strafrecht' },
  { id: 'prozess', label: 'Verfahrensrecht' },
  { id: 'schkg', label: 'Schuldbetreibung & Konkurs' },
  { id: 'oeffentlich', label: 'Öffentliches Recht' },
  // W2-TRENNUNG (29.8.2026, Entscheid David «ja trennen»): zwei Achsen statt
  // des früheren Doppel-Topfs 'sozial-abgaben' («Steuern, Sozialversicherung &
  // Abgaben»). Reihenfolge bewusst benachbart — wer die alte Rubrik suchte,
  // findet beide Nachfolger nebeneinander.
  { id: 'steuern', label: 'Steuern & Abgaben' },
  { id: 'sozialversicherung', label: 'Sozialversicherung' },
  { id: 'international', label: 'International / Staatsverträge' },
];

/**
 * Abgelöste Rechtsgebiets-Werte → ihre Nachfolger (Filter-/URL-Kompatibilität).
 *
 * W2-TRENNUNG (29.8.2026): Bis zur Trennung trug die Facetten-URL der
 * Rechtsprechung `?rg=sozial-abgaben`; solche Links stehen in Lesezeichen,
 * Mails und Suchmaschinen-Indizes. Der Wert ist kein Rechtsgebiet mehr — ohne
 * Alias liefe er ins Leere und die Seite zeigte «keine Treffer», was schlicht
 * falsch wäre (die Entscheide existieren, sie heissen nur anders).
 *
 * Gewählter Weg (der einfachste ehrliche der drei): der Alt-Wert filtert auf
 * die VEREINIGUNG seiner Nachfolger — die Trefferliste ist exakt dieselbe wie
 * vor der Trennung. Nicht gewählt: (a) auf einen der beiden umleiten (verlöre
 * die Hälfte der Treffer, §8), (b) den Filter still fallen lassen (zeigte
 * plötzlich das ganze Korpus). Der Alias ist reine EINGABE-Toleranz: er wird
 * nie geschrieben, erscheint in keiner Facette und in keinem Zähler.
 */
const ALT_GEBIET_ALIAS: Readonly<Record<string, readonly Rechtsgebiet[]>> = {
  'sozial-abgaben': ['steuern', 'sozialversicherung'],
};

/**
 * Ein Filterwert (auch ein abgelöster) → die Menge der Gebiete, die er meint.
 * Unbekannter Wert → die einelementige Menge mit ihm selbst: ein Tippfehler
 * filtert weiterhin auf null Treffer, statt still das ganze Korpus zu öffnen (§8).
 */
export function gebieteFuerFilter(wert: string): readonly Rechtsgebiet[] {
  return ALT_GEBIET_ALIAS[wert] ?? [wert as Rechtsgebiet];
}

export const GEBIET_LABEL: Record<Rechtsgebiet, string> = Object.fromEntries(
  GEBIETE.map((g) => [g.id, g.label]),
) as Record<Rechtsgebiet, string>;

export const GEBIET_RANG: Record<Rechtsgebiet, number> = Object.fromEntries(
  GEBIETE.map((g, i) => [g.id, i]),
) as Record<Rechtsgebiet, number>;

// Merged die render-dominante Grundart (+ erlassTyp) aus der UX-Audit-
// Klassifikation (GRUNDART_SEED, §5) per key in jeden Eintrag. Reine Daten-
// Projektion (§3/§5): browse-manifest.ts liest diese Felder NICHT, darum bleibt
// public/normtext/register.json byte-gleich (golden). Fehlt ein Seed-Eintrag,
// bleibt grundart undefined → check:grundart meldet die Lücke lesbar (§5.2).
function mitGrundart(e: ErlassRegistereintrag): ErlassRegistereintrag {
  const seed = GRUNDART_SEED[e.key];
  if (!seed) return e;
  return {
    ...e,
    grundart: seed.grundart,
    ...(seed.erlassTyp ? { erlassTyp: seed.erlassTyp } : {}),
    ...(seed.bestimmungsEtikett ? { bestimmungsEtikett: seed.bestimmungsEtikett } : {}),
    ...(seed.bestimmungsEtikettStatus ? { bestimmungsEtikettStatus: seed.bestimmungsEtikettStatus } : {}),
  };
}

// §8-Ehrlichkeit: merged den anerkannten Aufhebungs-Vermerk (seit + nachfolger)
// aus der SSoT aufhebungen.ts per key. Reine Daten-Projektion (§3/§5) — anders
// als mitGrundart LIEST der Generator dieses Feld und projiziert es nach
// register.json (Reader-Banner + Katalog-Badge). Absenz = geltend.
function mitAufhebung(e: ErlassRegistereintrag): ErlassRegistereintrag {
  const auf = aufhebungFuerRegister(e.key);
  return auf ? { ...e, aufgehoben: auf } : e;
}

// ── Bundesgesetze (27) — Schlüssel == Snapshot-Datei (UPPERCASE). SR/Titel
//    aus den verifizierten ELI-Pins in fedlex.ts (§7), Gebiet deklariert. ──────
export const ERLASS_REGISTER: ReadonlyArray<ErlassRegistereintrag> = ([
  // Privatrecht
  bund('ZGB', 'ZGB', 'Schweizerisches Zivilgesetzbuch', '210', 'privat', 1),
  bund('OR', 'OR', 'Bundesgesetz betreffend die Ergänzung des ZGB (Obligationenrecht)', '220', 'privat', 2),
  bund('VVG', 'VVG', 'Bundesgesetz über den Versicherungsvertrag', '221.229.1', 'privat', 3),
  bund('VMWG', 'VMWG', 'Verordnung über die Miete und Pacht von Wohn- und Geschäftsräumen', '221.213.11', 'privat', 4),
  bund('GBV', 'GBV', 'Grundbuchverordnung', '211.432.1', 'privat', 5),
  bund('HREGV', 'HRegV', 'Handelsregisterverordnung', '221.411', 'privat', 6, 'HRegV'),
  bund('GEBV_HREG', 'GebV-HReg', 'Gebührenverordnung für das Handelsregister', '221.411.1', 'privat', 7, 'GebVHReg'),
  bund('URG', 'URG', 'Bundesgesetz über das Urheberrecht und verwandte Schutzrechte', '231.1', 'privat', 8),
  bund('FUSG', 'FusG', 'Bundesgesetz über Fusion, Spaltung, Umwandlung und Vermögensübertragung (Fusionsgesetz)', '221.301', 'privat', 9, 'FusG'),
  bund('UWG', 'UWG', 'Bundesgesetz gegen den unlauteren Wettbewerb', '241', 'privat', 10),
  bund('MSCHG', 'MSchG', 'Bundesgesetz über den Schutz von Marken und Herkunftsangaben (Markenschutzgesetz)', '232.11', 'privat', 11, 'MSchG'),
  bund('PATG', 'PatG', 'Bundesgesetz über die Erfindungspatente (Patentgesetz)', '232.14', 'privat', 12, 'PatG'),
  // Privatrecht — Volltext-Ausbau 23.6.2026 (Promotion aus nur-live-link-Stubs)
  bund('PARTG', 'PartG', 'Bundesgesetz über die eingetragene Partnerschaft gleichgeschlechtlicher Paare (Partnerschaftsgesetz, PartG)', '211.231', 'privat', 21),
  bund('IPRG', 'IPRG', 'Bundesgesetz über das Internationale Privatrecht (IPRG)', '291', 'privat', 22),
  // Strafrecht
  bund('STGB', 'StGB', 'Schweizerisches Strafgesetzbuch', '311.0', 'straf', 1, 'StGB'),
  // Strafrecht — Volltext-Ausbau 23.6.2026 (Promotion aus nur-live-link-Stubs)
  bund('JSTG', 'JStG', 'Bundesgesetz über das Jugendstrafrecht (Jugendstrafgesetz, JStG)', '311.1', 'straf', 11),
  bund('BETMG', 'BetmG', 'Bundesgesetz über die Betäubungsmittel und die psychotropen Stoffe (Betäubungsmittelgesetz, BetmG)', '812.121', 'straf', 12),
  bund('VSTRR', 'VStrR', 'Bundesgesetz über das Verwaltungsstrafrecht (VStrR)', '313.0', 'straf', 13),
  // ── Volltext-Ausbau Bund Batch 2 (23.6.2026, Promotion aus Stubs) ──
  bund('KKG', 'KKG', 'Bundesgesetz über den Konsumkredit (KKG)', '221.214.1', 'privat', 23),
  bund('VGG', 'VGG', 'Bundesgesetz über das Bundesverwaltungsgericht (Verwaltungsgerichtsgesetz, VGG)', '173.32', 'prozess', 20),
  bund('BGFA', 'BGFA', 'Bundesgesetz über die Freizügigkeit der Anwältinnen und Anwälte (Anwaltsgesetz, BGFA)', '935.61', 'prozess', 21),
  bund('RPG', 'RPG', 'Bundesgesetz über die Raumplanung (Raumplanungsgesetz, RPG)', '700', 'oeffentlich', 20),
  bund('USG', 'USG', 'Bundesgesetz über den Umweltschutz (Umweltschutzgesetz, USG)', '814.01', 'oeffentlich', 21),
  bund('GWG', 'GwG', 'Bundesgesetz über die Bekämpfung der Geldwäscherei und der Terrorismusfinanzierung (Geldwäschereigesetz, GwG)', '955.0', 'oeffentlich', 22),
  bund('ATSG', 'ATSG', 'Bundesgesetz über den Allgemeinen Teil des Sozialversicherungsrechts (ATSG)', '830.1', 'sozialversicherung', 20),
  bund('BVG', 'BVG', 'Bundesgesetz über die berufliche Alters-, Hinterlassenen- und Invalidenvorsorge (BVG)', '831.40', 'sozialversicherung', 21),
  bund('UVG', 'UVG', 'Bundesgesetz über die Unfallversicherung (UVG)', '832.20', 'sozialversicherung', 22),
  bund('AVIG', 'AVIG', 'Bundesgesetz über die obligatorische Arbeitslosenversicherung und die Insolvenzentschädigung (Arbeitslosenversicherungsgesetz, AVIG)', '837.0', 'sozialversicherung', 23),
  // ── Volltext-Ausbau Bund Batch 3 (23.6.2026, Promotion aus Stubs) ──
  bund('IVG', 'IVG', 'Bundesgesetz über die Invalidenversicherung (IVG)', '831.20', 'sozialversicherung', 24),
  bund('FAMZG', 'FamZG', 'Bundesgesetz über die Familienzulagen und Finanzhilfen an Familienorganisationen (Familienzulagengesetz, FamZG)', '836.2', 'sozialversicherung', 25),
  bund('STHG', 'StHG', 'Bundesgesetz über die Harmonisierung der direkten Steuern der Kantone und Gemeinden (Steuerharmonisierungsgesetz, StHG)', '642.14', 'steuern', 26),
  bund('AIG', 'AIG', 'Bundesgesetz über die Ausländerinnen und Ausländer und über die Integration (Ausländer- und Integrationsgesetz, AIG)', '142.20', 'oeffentlich', 23),
  bund('ASYLG', 'AsylG', 'Asylgesetz (AsylG)', '142.31', 'oeffentlich', 24),
  bund('GLG', 'GlG', 'Bundesgesetz über die Gleichstellung von Frau und Mann (Gleichstellungsgesetz, GlG)', '151.1', 'oeffentlich', 25),
  bund('FINMAG', 'FINMAG', 'Bundesgesetz über die Eidgenössische Finanzmarktaufsicht (Finanzmarktaufsichtsgesetz, FINMAG)', '956.1', 'oeffentlich', 26),
  bund('BGBB', 'BGBB', 'Bundesgesetz über das bäuerliche Bodenrecht (BGBB)', '211.412.11', 'privat', 24),
  // ── Volltext-Ausbau Bund Batch 4 (23.6.2026, Promotion aus Stubs) ──
  bund('AHVG', 'AHVG', 'Bundesgesetz über die Alters- und Hinterlassenenversicherung (AHVG)', '831.10', 'sozialversicherung', 27),
  bund('BANKG', 'BankG', 'Bundesgesetz über die Banken und Sparkassen (Bankengesetz, BankG)', '952.0', 'oeffentlich', 27),
  bund('HMG', 'HMG', 'Bundesgesetz über Arzneimittel und Medizinprodukte (Heilmittelgesetz, HMG)', '812.21', 'oeffentlich', 28),
  // Verfahrensrecht
  bund('ZPO', 'ZPO', 'Schweizerische Zivilprozessordnung', '272', 'prozess', 1),
  bund('STPO', 'StPO', 'Schweizerische Strafprozessordnung', '312.0', 'prozess', 2, 'StPO'),
  bund('BGG', 'BGG', 'Bundesgesetz über das Bundesgericht (Bundesgerichtsgesetz)', '173.110', 'prozess', 3),
  bund('JSTPO', 'JStPO', 'Schweizerische Jugendstrafprozessordnung', '312.1', 'prozess', 4, 'JStPO'),
  bund('VWVG', 'VwVG', 'Bundesgesetz über das Verwaltungsverfahren', '172.021', 'prozess', 5, 'VwVG'),
  bund('BGERR', 'BGerR', 'Reglement für das Bundesgericht', '173.110.131', 'prozess', 6, 'BGerR'),
  // Schuldbetreibung & Konkurs
  bund('SCHKG', 'SchKG', 'Bundesgesetz über Schuldbetreibung und Konkurs', '281.1', 'schkg', 1, 'SchKG'),
  bund('GEBV_SCHKG', 'GebV SchKG', 'Gebührenverordnung zum SchKG', '281.35', 'schkg', 2, 'GebVSchKG'),
  // Öffentliches Recht
  bund('BV', 'BV', 'Bundesverfassung der Schweizerischen Eidgenossenschaft', '101', 'oeffentlich', 0),
  bund('SVG', 'SVG', 'Strassenverkehrsgesetz', '741.01', 'oeffentlich', 1),
  bund('DSG', 'DSG', 'Bundesgesetz über den Datenschutz', '235.1', 'oeffentlich', 2),
  bund('BBG', 'BBG', 'Bundesgesetz über die Berufsbildung', '412.10', 'oeffentlich', 3),
  bund('BEWG', 'BewG', 'Bundesgesetz über den Erwerb von Grundstücken durch Personen im Ausland (Lex Koller)', '211.412.41', 'oeffentlich', 4, 'BewG'),
  bund('KG', 'KG', 'Bundesgesetz über Kartelle und andere Wettbewerbsbeschränkungen (Kartellgesetz)', '251', 'oeffentlich', 5),
  // ── Punkt 12 Batch 1 (24.6.2026, Promotion aus nur-live-link-Stubs;
  //    Bund-Gesetze aus Davids Anwaltsprüfungs-Bookmark-Liste). ELI/Konsolidierung
  //    via date-geordnete Taxonomie-Abfrage (Resolver-Altfassungen verworfen),
  //    gegen check:fedlex-versionen + Filestore-HTML-Sonde + ELI-Titel
  //    doppelt-verifiziert (§7). Rechtsgebiet nach Bookmark-Ordner deklariert. ──
  // Staat & Verfassung
  bund('BPR', 'BPR', 'Bundesgesetz über die politischen Rechte (BPR)', '161.1', 'oeffentlich', 6),
  bund('PARLG', 'ParlG', 'Bundesgesetz über die Bundesversammlung (Parlamentsgesetz, ParlG)', '171.10', 'oeffentlich', 7),
  bund('RVOG', 'RVOG', 'Regierungs- und Verwaltungsorganisationsgesetz (RVOG)', '172.010', 'oeffentlich', 8),
  bund('PUBLG', 'PublG', 'Bundesgesetz über die Sammlungen des Bundesrechts und das Bundesblatt (Publikationsgesetz, PublG)', '170.512', 'oeffentlich', 9),
  bund('BPG', 'BPG', 'Bundespersonalgesetz (BPG)', '172.220.1', 'oeffentlich', 10),
  bund('BGOE', 'BGÖ', 'Bundesgesetz über das Öffentlichkeitsprinzip der Verwaltung (Öffentlichkeitsgesetz, BGÖ)', '152.3', 'oeffentlich', 11),
  bund('BUEG', 'BüG', 'Bundesgesetz über das Schweizer Bürgerrecht (Bürgerrechtsgesetz, BüG)', '141.0', 'oeffentlich', 30),
  // Verfahren & Rechtspflege
  bund('VG', 'VG', 'Bundesgesetz über die Verantwortlichkeit des Bundes sowie seiner Behördemitglieder und Beamten (Verantwortlichkeitsgesetz, VG)', '170.32', 'prozess', 22),
  bund('STBOG', 'StBOG', 'Bundesgesetz über die Organisation der Strafbehörden des Bundes (Strafbehördenorganisationsgesetz, StBOG)', '173.71', 'prozess', 23),
  // Privatrecht
  bund('DESG', 'DesG', 'Bundesgesetz über den Schutz von Design (Designgesetz, DesG)', '232.12', 'privat', 25),
  // Strafrecht
  bund('OHG', 'OHG', 'Bundesgesetz über die Hilfe an Opfer von Straftaten (Opferhilfegesetz, OHG)', '312.5', 'straf', 14),
  // Öffentliches Recht — Umwelt, Beschaffung, Enteignung, Finanzmarkt
  bund('NHG', 'NHG', 'Bundesgesetz über den Natur- und Heimatschutz (NHG)', '451', 'oeffentlich', 31),
  bund('GSCHG', 'GSchG', 'Bundesgesetz über den Schutz der Gewässer (Gewässerschutzgesetz, GSchG)', '814.20', 'oeffentlich', 32),
  bund('WAG', 'WaG', 'Bundesgesetz über den Wald (Waldgesetz, WaG)', '921.0', 'oeffentlich', 33),
  bund('ENTG', 'EntG', 'Bundesgesetz über die Enteignung (EntG)', '711', 'oeffentlich', 34),
  bund('BOEB', 'BöB', 'Bundesgesetz über das öffentliche Beschaffungswesen (BöB)', '172.056.1', 'oeffentlich', 35),
  bund('PUEG', 'PüG', 'Preisüberwachungsgesetz (PüG)', '942.20', 'oeffentlich', 36),
  bund('FIDLEG', 'FIDLEG', 'Bundesgesetz über die Finanzdienstleistungen (Finanzdienstleistungsgesetz, FIDLEG)', '950.1', 'oeffentlich', 37),
  bund('KAG', 'KAG', 'Bundesgesetz über die kollektiven Kapitalanlagen (Kollektivanlagengesetz, KAG)', '951.31', 'oeffentlich', 38),
  bund('FINIG', 'FINIG', 'Bundesgesetz über die Finanzinstitute (Finanzinstitutsgesetz, FINIG)', '954.1', 'oeffentlich', 39),
  bund('FINFRAG', 'FinfraG', 'Bundesgesetz über die Finanzmarktinfrastrukturen und das Marktverhalten im Effekten- und Derivatehandel (Finanzmarktinfrastrukturgesetz, FinfraG)', '958.1', 'oeffentlich', 40),
  bund('VAG', 'VAG', 'Bundesgesetz betreffend die Aufsicht über Versicherungsunternehmen (Versicherungsaufsichtsgesetz, VAG)', '961.01', 'oeffentlich', 41),
  // Sozialversicherung
  bund('ELG', 'ELG', 'Bundesgesetz über Ergänzungsleistungen zur Alters-, Hinterlassenen- und Invalidenversicherung (ELG)', '831.30', 'sozialversicherung', 28),
  bund('FZG', 'FZG', 'Bundesgesetz über die Freizügigkeit in der beruflichen Alters-, Hinterlassenen- und Invalidenvorsorge (Freizügigkeitsgesetz, FZG)', '831.42', 'sozialversicherung', 29),
  bund('ENTSG', 'EntsG', 'Bundesgesetz über die flankierenden Massnahmen bei entsandten Arbeitnehmerinnen und Arbeitnehmern (Entsendegesetz, EntsG)', '823.20', 'oeffentlich', 125),
  // Steuern, Sozialversicherung & Abgaben
  bund('KVG', 'KVG', 'Bundesgesetz über die Krankenversicherung', '832.10', 'sozialversicherung', 1),
  bund('KVV', 'KVV', 'Verordnung über die Krankenversicherung', '832.102', 'sozialversicherung', 2),
  bund('MWSTG', 'MWSTG', 'Bundesgesetz über die Mehrwertsteuer', '641.20', 'steuern', 3),
  bund('STG', 'StG', 'Bundesgesetz über die Stempelabgaben', '641.10', 'steuern', 4, 'StG'),
  bund('EOG', 'EOG', 'Bundesgesetz über den Erwerbsersatz (Erwerbsersatzordnung)', '834.1', 'sozialversicherung', 5),
  bund('ARG', 'ArG', 'Bundesgesetz über die Arbeit in Industrie, Gewerbe und Handel (Arbeitsgesetz)', '822.11', 'oeffentlich', 119, 'ArG'),
  bund('DBG', 'DBG', 'Bundesgesetz über die direkte Bundessteuer', '642.11', 'steuern', 7),
  bund('VSTG', 'VStG', 'Bundesgesetz über die Verrechnungssteuer (Verrechnungssteuergesetz)', '642.21', 'steuern', 8, 'VStG'),
  // ── Punkt 12 Batch 2 (24.6.2026, Bund-VERORDNUNGEN Volltext, Promotion aus
  //    nur-live-link-Stubs). Geltende Konsolidierung via date-geordnete Taxonomie-
  //    Abfrage (Resolver lieferte für viele die REPEALTE Vorgänger-VO) + Filestore-
  //    HTML-Inhalts-Sonde (art_1 + Artikelzahl == Snapshot) doppelt verifiziert
  //    (§7). Ausführungsrecht zu den Leitgesetzen. ──
  bund('AHVV', 'AHVV', 'Verordnung über die Alters- und Hinterlassenenversicherung (AHVV)', '831.101', 'sozialversicherung', 51),
  bund('IVV', 'IVV', 'Verordnung über die Invalidenversicherung (IVV)', '831.201', 'sozialversicherung', 52),
  bund('ELV', 'ELV', 'Verordnung über die Ergänzungsleistungen zur Alters-, Hinterlassenen- und Invalidenversicherung (ELV)', '831.301', 'sozialversicherung', 53),
  bund('BVV_2', 'BVV 2', 'Verordnung über die berufliche Alters-, Hinterlassenen- und Invalidenvorsorge (BVV 2)', '831.441.1', 'sozialversicherung', 54, 'BVV 2'),
  bund('UVV', 'UVV', 'Verordnung über die Unfallversicherung (UVV)', '832.202', 'sozialversicherung', 55),
  bund('AVIV', 'AVIV', 'Verordnung über die obligatorische Arbeitslosenversicherung und die Insolvenzentschädigung (Arbeitslosenversicherungsverordnung, AVIV)', '837.02', 'sozialversicherung', 56),
  bund('ATSV', 'ATSV', 'Verordnung über den Allgemeinen Teil des Sozialversicherungsrechts (ATSV)', '830.11', 'sozialversicherung', 57),
  bund('KLV', 'KLV', 'Verordnung des EDI über Leistungen in der obligatorischen Krankenpflegeversicherung (Krankenpflege-Leistungsverordnung, KLV)', '832.112.31', 'sozialversicherung', 58),
  bund('MWSTV', 'MWSTV', 'Mehrwertsteuerverordnung (MWSTV)', '641.201', 'steuern', 59),
  bund('VSTV', 'VStV', 'Verordnung über die Verrechnungssteuer (Verrechnungssteuerverordnung, VStV)', '642.211', 'steuern', 60, 'VStV'),
  bund('VZAE', 'VZAE', 'Verordnung über Zulassung, Aufenthalt und Erwerbstätigkeit (VZAE)', '142.201', 'oeffentlich', 51),
  bund('VRV', 'VRV', 'Verkehrsregelnverordnung (VRV)', '741.11', 'oeffentlich', 52),
  bund('VZV', 'VZV', 'Verordnung über die Zulassung von Personen und Fahrzeugen zum Strassenverkehr (Verkehrszulassungsverordnung, VZV)', '741.51', 'oeffentlich', 53),
  bund('SSV', 'SSV', 'Signalisationsverordnung (SSV)', '741.21', 'oeffentlich', 54),
  bund('DSV', 'DSV', 'Verordnung über den Datenschutz (Datenschutzverordnung, DSV)', '235.11', 'oeffentlich', 55),
  bund('ARGV1', 'ArGV 1', 'Verordnung 1 zum Arbeitsgesetz (Allgemeine Verordnung)', '822.111', 'oeffentlich', 120, 'ArGV 1'),
  bund('BEWV', 'BewV', 'Verordnung über den Erwerb von Grundstücken durch Personen im Ausland (BewV)', '211.412.411', 'oeffentlich', 56, 'BewV'),
  bund('BUEV', 'BüV', 'Verordnung über das Schweizer Bürgerrecht (Bürgerrechtsverordnung, BüV)', '141.01', 'oeffentlich', 57, 'BüV'),
  bund('FZV', 'FZV', 'Verordnung über die Freizügigkeit in der beruflichen Alters-, Hinterlassenen- und Invalidenvorsorge (Freizügigkeitsverordnung, FZV)', '831.425', 'sozialversicherung', 62),
  bund('KOV', 'KOV', 'Verordnung über die Geschäftsführung der Konkursämter (KOV)', '281.32', 'schkg', 51),
  bund('RPV', 'RPV', 'Raumplanungsverordnung (RPV)', '700.1', 'oeffentlich', 58),
  bund('VBB', 'VFRR', 'Verordnung über die im Betreibungs- und Konkursverfahren zu verwendenden Formulare und Register sowie die Rechnungsführung (VFRR)', '281.31', 'schkg', 52, 'VFRR'),
  bund('VOEB', 'VöB', 'Verordnung über das öffentliche Beschaffungswesen (VöB)', '172.056.11', 'oeffentlich', 59, 'VöB'),
  bund('VZG', 'VZG', 'Verordnung des Bundesgerichts über die Zwangsverwertung von Grundstücken (VZG)', '281.42', 'schkg', 53),
  bund('BVV3', 'BVV 3', 'Verordnung über die steuerliche Abzugsberechtigung für Beiträge an anerkannte Vorsorgeformen (BVV 3)', '831.461.3', 'sozialversicherung', 63, 'BVV 3'),
  bund('MVV', 'MVV', 'Verordnung über die Militärversicherung (MVV)', '833.11', 'sozialversicherung', 64),
  bund('EOV', 'EOV', 'Erwerbsersatzverordnung (EOV)', '834.11', 'sozialversicherung', 65),
  bund('FAMZV', 'FamZV', 'Verordnung über die Familienzulagen (Familienzulagenverordnung, FamZV)', '836.21', 'sozialversicherung', 66, 'FamZV'),
  bund('ARGV2', 'ArGV 2', 'Verordnung 2 zum Arbeitsgesetz (ArGV 2) (Sonderbestimmungen für bestimmte Gruppen von Betrieben oder Arbeitnehmern und Arbeitnehmerinnen)', '822.112', 'oeffentlich', 121, 'ArGV 2'),
  bund('ARGV3', 'ArGV 3', 'Verordnung 3 zum Arbeitsgesetz (ArGV 3) (Gesundheitsschutz)', '822.113', 'oeffentlich', 122, 'ArGV 3'),
  bund('ARGV4', 'ArGV 4', 'Verordnung 4 zum Arbeitsgesetz (ArGV 4) (Industrielle Betriebe, Plangenehmigung und Betriebsbewilligung)', '822.114', 'oeffentlich', 123, 'ArGV 4'),
  bund('VEV', 'VEV', 'Verordnung über die Einreise und die Visumerteilung (VEV)', '142.204', 'oeffentlich', 60),
  bund('VINTA', 'VIntA', 'Verordnung über die Integration von Ausländerinnen und Ausländern (VIntA)', '142.205', 'oeffentlich', 61, 'VIntA'),
  bund('ASYLV1', 'AsylV 1', 'Asylverordnung 1 über Verfahrensfragen (Asylverordnung 1, AsylV 1)', '142.311', 'oeffentlich', 62, 'AsylV 1'),
  bund('ASYLV2', 'AsylV 2', 'Asylverordnung 2 über Finanzierungsfragen (Asylverordnung 2, AsylV 2)', '142.312', 'oeffentlich', 63, 'AsylV 2'),
  bund('ASYLV3', 'AsylV 3', 'Asylverordnung 3 über die Bearbeitung von Personendaten (Asylverordnung 3, AsylV 3)', '142.314', 'oeffentlich', 64, 'AsylV 3'),
  bund('GSCHV', 'GSchV', 'Gewässerschutzverordnung (GSchV)', '814.201', 'oeffentlich', 65, 'GSchV'),
  bund('LRV', 'LRV', 'Luftreinhalte-Verordnung (LRV)', '814.318.142.1', 'oeffentlich', 66),
  bund('LSV', 'LSV', 'Lärmschutz-Verordnung (LSV)', '814.41', 'oeffentlich', 67),
  bund('VVEA', 'VVEA', 'Verordnung über die Vermeidung und die Entsorgung von Abfällen (Abfallverordnung, VVEA)', '814.600', 'oeffentlich', 68),
  bund('CHEMV', 'ChemV', 'Verordnung über den Schutz vor gefährlichen Stoffen und Zubereitungen (Chemikalienverordnung, ChemV)', '813.11', 'oeffentlich', 69, 'ChemV'),
  bund('NHV', 'NHV', 'Verordnung über den Natur- und Heimatschutz (NHV)', '451.1', 'oeffentlich', 70),
  bund('WAV', 'WaV', 'Verordnung über den Wald (Waldverordnung, WaV)', '921.01', 'oeffentlich', 71, 'WaV'),
  bund('VTS', 'VTS', 'Verordnung über die technischen Anforderungen an Strassenfahrzeuge (VTS)', '741.41', 'oeffentlich', 72),
  bund('BANKV', 'BankV', 'Verordnung über die Banken und Sparkassen (Bankenverordnung, BankV)', '952.02', 'oeffentlich', 73, 'BankV'),
  bund('KKV', 'KKV', 'Verordnung über die kollektiven Kapitalanlagen (Kollektivanlagenverordnung, KKV)', '951.311', 'oeffentlich', 74),
  bund('ERV', 'ERV', 'Verordnung über die Eigenmittel und Risikoverteilung der Banken und Wertpapierhäuser (Eigenmittelverordnung, ERV)', '952.03', 'oeffentlich', 75),
  bund('FINIV', 'FINIV', 'Verordnung über die Finanzinstitute (Finanzinstitutsverordnung, FINIV)', '954.11', 'oeffentlich', 76),
  bund('FINFRAV', 'FinfraV', 'Verordnung über die Finanzmarktinfrastrukturen und das Marktverhalten im Effekten- und Derivatehandel (Finanzmarktinfrastrukturverordnung, FinfraV)', '958.11', 'oeffentlich', 77, 'FinfraV'),
  bund('FIDLEV', 'FIDLEV', 'Verordnung über die Finanzdienstleistungen (Finanzdienstleistungsverordnung, FIDLEV)', '950.11', 'oeffentlich', 78),
  bund('AVO', 'AVO', 'Verordnung über die Beaufsichtigung von privaten Versicherungsunternehmen (Aufsichtsverordnung, AVO)', '961.011', 'oeffentlich', 79),
  bund('GWV_FINMA', 'GwV-FINMA', 'Verordnung der Eidgenössischen Finanzmarktaufsicht über die Bekämpfung von Geldwäscherei und Terrorismusfinanzierung im Finanzsektor (Geldwäschereiverordnung-FINMA, GwV-FINMA)', '955.033.0', 'oeffentlich', 80, 'GwV-FINMA'),
  bund('VAM', 'VAM', 'Verordnung über die Arzneimittel (Arzneimittelverordnung, VAM)', '812.212.21', 'oeffentlich', 81),
  bund('AMBV', 'AMBV', 'Verordnung über die Bewilligungen im Arzneimittelbereich (Arzneimittel-Bewilligungsverordnung, AMBV)', '812.212.1', 'oeffentlich', 82),
  bund('MEPV', 'MepV', 'Medizinprodukteverordnung (MepV)', '812.213', 'oeffentlich', 83, 'MepV'),
  bund('EPV', 'EpV', 'Verordnung über die Bekämpfung übertragbarer Krankheiten des Menschen (Epidemienverordnung, EpV)', '818.101.1', 'oeffentlich', 84, 'EpV'),
  bund('BPV', 'BPV', 'Bundespersonalverordnung (BPV)', '172.220.111.3', 'oeffentlich', 85),
  bund('RVOV', 'RVOV', 'Regierungs- und Verwaltungsorganisationsverordnung (RVOV)', '172.010.1', 'oeffentlich', 86),
  bund('VGKE', 'VGKE', 'Reglement über die Kosten und Entschädigungen vor dem Bundesverwaltungsgericht (VGKE)', '173.320.2', 'prozess', 51),
  bund('BETMKV', 'BetmKV', 'Verordnung über die Betäubungsmittelkontrolle (Betäubungsmittelkontrollverordnung, BetmKV)', '812.121.1', 'straf', 51, 'BetmKV'),
  bund('QSTV', 'QStV', 'Verordnung des EFD über die Quellensteuer bei der direkten Bundessteuer (Quellensteuerverordnung, QStV)', '642.118.2', 'steuern', 70, 'QStV'),
  // ── Punkt 12 Batch 3 (25.6.2026): Promotion nur-live-link-Stub → Volltext ──
  bund('SORTG', 'SortG', 'Bundesgesetz über den Schutz von Pflanzenzüchtungen (Sortenschutzgesetz)', '232.16', 'privat', 18, 'SortG'),
  bund('PRG', 'PRG', 'Bundesgesetz über Pauschalreisen', '944.3', 'privat', 19, 'PRG'),
  bund('BEG', 'BEG', 'Bundesgesetz über Bucheffekten (Bucheffektengesetz, BEG)', '957.1', 'privat', 20, 'BEG'),
  bund('MSTG', 'MStG', 'Militärstrafgesetz (MStG)', '321.0', 'straf', 30, 'MStG'),
  bund('MSTP', 'MStP', 'Militärstrafprozess (MStP)', '322.1', 'straf', 31, 'MStP'),
  bund('IRSG', 'IRSG', 'Bundesgesetz über internationale Rechtshilfe in Strafsachen (Rechtshilfegesetz, IRSG)', '351.1', 'straf', 32, 'IRSG'),
  bund('MVG', 'MVG', 'Bundesgesetz über die Militärversicherung (MVG)', '833.1', 'sozialversicherung', 71, 'MVG'),
  bund('ENG', 'EnG', 'Energiegesetz (EnG)', '730.0', 'oeffentlich', 90, 'EnG'),
  bund('CO2_GESETZ', 'CO2-Gesetz', 'Bundesgesetz über die Reduktion der CO2-Emissionen (CO2-Gesetz)', '641.71', 'oeffentlich', 91, 'CO2-Gesetz'),
  bund('EPG', 'EpG', 'Bundesgesetz über die Bekämpfung übertragbarer Krankheiten des Menschen (Epidemiengesetz, EpG)', '818.101', 'oeffentlich', 92, 'EpG'),
  bund('TXG', 'TxG', 'Bundesgesetz über die Transplantation von Organen, Geweben und Zellen (Transplantationsgesetz)', '810.21', 'oeffentlich', 93, 'TxG'),
  bund('LMG', 'LMG', 'Bundesgesetz über Lebensmittel und Gebrauchsgegenstände (Lebensmittelgesetz, LMG)', '817.0', 'oeffentlich', 94, 'LMG'),
  bund('LFG', 'LFG', 'Bundesgesetz über die Luftfahrt (Luftfahrtgesetz, LFG)', '748.0', 'oeffentlich', 95, 'LFG'),
  bund('EBG', 'EBG', 'Eisenbahngesetz (EBG)', '742.101', 'oeffentlich', 96, 'EBG'),
  bund('FMG', 'FMG', 'Fernmeldegesetz (FMG)', '784.10', 'oeffentlich', 97, 'FMG'),
  bund('MG', 'MG', 'Bundesgesetz über die Armee und die Militärverwaltung (Militärgesetz, MG)', '510.10', 'oeffentlich', 98, 'MG'),
  bund('ZSTV', 'ZStV', 'Zivilstandsverordnung (ZStV)', '211.112.2', 'privat', 21, 'ZStV'),
  bund('THG', 'THG', 'Bundesgesetz über die technischen Handelshemmnisse (THG)', '946.51', 'oeffentlich', 99, 'THG'),
  bund('BGBM', 'BGBM', 'Bundesgesetz über den Binnenmarkt (Binnenmarktgesetz, BGBM)', '943.02', 'oeffentlich', 100, 'BGBM'),
  // ── Punkt 12 Batch 3 (25.6.2026): kuratierte zentrale Bundes-VERORDNUNGEN ──
  bund('MSCHV', 'MSchV', 'Verordnung über den Schutz von Marken und Herkunftsangaben (MSchV)', '232.111', 'privat', 22, 'MSchV'),
  bund('PATV', 'PatV', 'Verordnung über die Erfindungspatente (Patentverordnung, PatV)', '232.141', 'privat', 23, 'PatV'),
  bund('DESV', 'DesV', 'Verordnung über den Schutz von Design (Designverordnung, DesV)', '232.121', 'privat', 24, 'DesV'),
  bund('URV', 'URV', 'Verordnung über das Urheberrecht und verwandte Schutzrechte (Urheberrechtsverordnung, URV)', '231.11', 'privat', 25, 'URV'),
  bund('TGBV', 'TGBV', 'Technische Verordnung des EJPD und des VBS über das Grundbuch (TGBV)', '211.432.11', 'privat', 26, 'TGBV'),
  bund('VKKG', 'VKKG', 'Verordnung zum Konsumkreditgesetz (VKKG)', '221.214.11', 'privat', 27, 'VKKG'),
  bund('ADOV', 'AdoV', 'Verordnung über die Adoption (Adoptionsverordnung, AdoV)', '211.221.36', 'privat', 28, 'AdoV'),
  bund('PAVO', 'PAVO', 'Verordnung über die Aufnahme von Pflegekindern (Pflegekinderverordnung, PAVO)', '211.222.338', 'privat', 29, 'PAVO'),
  bund('ZENTV', 'ZentV', 'Verordnung über kriminalpolizeiliche Zentralstellen des Bundes (ZentV)', '360.1', 'straf', 33, 'ZentV'),
  bund('ZAVV', 'ZAV', 'Verordnung über die Anwendung polizeilichen Zwangs und polizeilicher Massnahmen im Zuständigkeitsbereich des Bundes (Zwangsanwendungsverordnung, ZAV)', '364.3', 'straf', 34, 'ZAV'),
  bund('VGR', 'VGR', 'Geschäftsreglement für das Bundesverwaltungsgericht (VGR)', '173.320.1', 'prozess', 52, 'VGR'),
  bund('BKV', 'BKV', 'Verordnung des EFD über den Abzug der Berufskosten unselbstständig Erwerbstätiger bei der direkten Bundessteuer (Berufskostenverordnung)', '642.118.1', 'steuern', 72, 'BKV'),
  bund('VFV', 'VFV', 'Verordnung über die freiwillige Alters-, Hinterlassenen- und Invalidenversicherung (VFV)', '831.111', 'sozialversicherung', 73, 'VFV'),
  bund('VVK', 'VVK', 'Verordnung über die Versichertenkarte für die obligatorische Krankenpflegeversicherung (VVK)', '832.105', 'sozialversicherung', 74, 'VVK'),
  bund('VKL', 'VKL', 'Verordnung über die Kostenermittlung und die Leistungserfassung durch Spitäler, Geburtshäuser und Pflegeheime in der Krankenversicherung (VKL)', '832.104', 'sozialversicherung', 75, 'VKL'),
  bund('ARGV5', 'ArGV 5', 'Verordnung 5 zum Arbeitsgesetz (Jugendarbeitsschutzverordnung, ArGV 5)', '822.115', 'oeffentlich', 124, 'ArGV 5'),
  bund('BBV', 'BBV', 'Verordnung über die Berufsbildung (Berufsbildungsverordnung, BBV)', '412.101', 'oeffentlich', 101, 'BBV'),
  // ── SR 412.103.1 · Totalrevision (12.9.2026) ───────────────────────────────
  // Der SR-Slot trägt ZWEI Erlasse: die geltende Verordnung vom 13. Juni 2025
  // (ELI cc/2025/408, in Kraft seit 1.3.2026) und ihre in Art. 34 ausdrücklich
  // aufgehobene Vorgängerin von 2009 (ELI cc/2009/423). Beide bleiben im
  // Korpus — die geltende, damit der Nutzer sie überhaupt findet (§8), die
  // historische, weil altes Recht auf den Sachverhalt seiner Zeit anwendbar
  // bleibt und die Aufhebungs-Deklaration an ihrem key hängt. Der Rang der
  // aufgehobenen Fassung wandert ans Ende der Rubrik (die geltende steht
  // neben der BBV, wo man sie sucht); die Liste markiert sie zusätzlich rot
  // mit «aufgehoben» (ErlassKarte).
  bund('BMV_2025', 'BMV', 'Verordnung vom 13. Juni 2025 über die eidgenössische Berufsmaturität (Berufsmaturitätsverordnung, BMV)', '412.103.1', 'oeffentlich', 102, 'BMV-2025'),
  bund('BMV', 'BMV', 'Verordnung über die Berufsmaturität (Berufsmaturitätsverordnung)', '412.103.1', 'oeffentlich', 126, 'BMV'),
  bund('ZEMIS_V', 'ZEMIS-V', 'Verordnung über das Zentrale Migrationsinformationssystem (ZEMIS-Verordnung)', '142.513', 'oeffentlich', 103, 'ZEMIS-V'),
  bund('RDV', 'RDV', 'Verordnung über die Ausstellung von Reisedokumenten für ausländische Personen (RDV)', '143.5', 'oeffentlich', 104, 'RDV'),
  bund('UVPV', 'UVPV', 'Verordnung über die Umweltverträglichkeitsprüfung (UVPV)', '814.011', 'oeffentlich', 105, 'UVPV'),
  bund('CHEMRRV', 'ChemRRV', 'Chemikalien-Risikoreduktions-Verordnung (ChemRRV)', '814.81', 'oeffentlich', 106, 'ChemRRV'),
  bund('VEVA', 'VeVA', 'Verordnung über den Verkehr mit Abfällen (VeVA)', '814.610', 'oeffentlich', 107, 'VeVA'),
  bund('VGVP', 'VGV', 'Verordnung über Getränkeverpackungen (VGV)', '814.621', 'oeffentlich', 108, 'VGV'),
  bund('SKV', 'SKV', 'Strassenverkehrskontrollverordnung (SKV)', '741.013', 'oeffentlich', 109, 'SKV'),
  bund('VVV', 'VVV', 'Verkehrsversicherungsverordnung (VVV)', '741.31', 'oeffentlich', 110, 'VVV'),
  bund('VIL', 'VIL', 'Verordnung über die Infrastruktur der Luftfahrt (VIL)', '748.131.1', 'oeffentlich', 111, 'VIL'),
  bund('FDV', 'FDV', 'Verordnung über Fernmeldedienste (FDV)', '784.101.1', 'oeffentlich', 112, 'FDV'),
  bund('FAV', 'FAV', 'Verordnung über Fernmeldeanlagen (FAV)', '784.101.2', 'oeffentlich', 113, 'FAV'),
  bund('AKKBV', 'AkkBV', 'Akkreditierungs- und Bezeichnungsverordnung (AkkBV)', '946.512', 'oeffentlich', 114, 'AkkBV'),
  bund('NBV', 'NBV', 'Verordnung zum Bundesgesetz über die Schweizerische Nationalbank (Nationalbankverordnung, NBV)', '951.131', 'oeffentlich', 115, 'NBV'),
  bund('KKV_FINMA', 'KKV-FINMA', 'Verordnung der FINMA über die kollektiven Kapitalanlagen (Kollektivanlagenverordnung-FINMA, KKV-FINMA)', '951.312', 'oeffentlich', 116, 'KKV-FINMA'),
  bund('FINFRAV_FINMA', 'FinfraV-FINMA', 'Verordnung der FINMA über die Finanzmarktinfrastrukturen und das Marktverhalten im Effekten- und Derivatehandel (FinfraV-FINMA)', '958.111', 'oeffentlich', 117, 'FinfraV-FINMA'),
  bund('FINMA_GEBV', 'FINMA-GebV', 'FINMA-Gebühren- und Abgabenverordnung (FINMA-GebV)', '956.122', 'oeffentlich', 118, 'FINMA-GebV'),
  // ── International: Staatsverträge SR 0.* als VOLLTEXT (Auftrag David 25.6.2026,
  //    Promotion nur-live-link → Volltext via Fedlex-Pipeline; je SR-Sonde+Anker
  //    verifiziert). Rechtsgebiet 'international' → Rubrik «International» + Tab. ──
  // EMRK (SR 0.101): bleibt nur-live-link — Fedlex liefert für die geltende
  // Konsolidierung nur eine ~9-kB-Shell ohne <article>-Anker (kein extrahierbarer
  // Volltext, §8); steht weiter als Stub in bund-stubs.generated.ts.
  bund('CISG', 'CISG', 'Übereinkommen der Vereinten Nationen vom 11. April 1980 über Verträge über den internationalen Warenkauf (Wiener Kaufrecht, CISG)', '0.221.211.1', 'international', 91),
  bund('LUGUE', 'LugÜ', 'Übereinkommen vom 30. Oktober 2007 über die gerichtliche Zuständigkeit und die Anerkennung und Vollstreckung von Entscheidungen in Zivil- und Handelssachen (Lugano-Übereinkommen, LugÜ)', '0.275.12', 'international', 92),
  bund('HZUE', 'HZÜ', 'Übereinkommen vom 15. November 1965 über die Zustellung gerichtlicher und aussergerichtlicher Schriftstücke im Ausland in Zivil- oder Handelssachen (HZÜ)', '0.274.131', 'international', 93),
  bund('HBEWUE', 'HBewÜ', 'Übereinkommen vom 18. März 1970 über die Beweisaufnahme im Ausland in Zivil- oder Handelssachen (HBewÜ)', '0.274.132', 'international', 94),
  bund('HKUE', 'HKÜ', 'Übereinkommen vom 25. Oktober 1980 über die zivilrechtlichen Aspekte internationaler Kindesentführung (HKÜ)', '0.211.230.02', 'international', 95),
  bund('FZA', 'FZA', 'Abkommen vom 21. Juni 1999 zwischen der Schweiz und der EG und ihren Mitgliedstaaten über die Freizügigkeit (FZA)', '0.142.112.681', 'international', 96),
  bund('VRK', 'VRK', 'Wiener Übereinkommen vom 23. Mai 1969 über das Recht der Verträge (VRK)', '0.111', 'international', 97),
  bund('UNO_PAKT_II', 'UNO-Pakt II', 'Internationaler Pakt vom 16. Dezember 1966 über bürgerliche und politische Rechte (UNO-Pakt II)', '0.103.2', 'international', 98),
  // ── International P2 (25.6.2026): weitere Staatsverträge SR 0.* als Volltext;
  //    ELI/Kons + Filestore-HTML-Gehalt je Vertrag verifiziert. ──
  bund('UNO_PAKT_I', 'UNO-Pakt I', 'Internationaler Pakt vom 16. Dezember 1966 über wirtschaftliche, soziale und kulturelle Rechte (UNO-Pakt I)', '0.103.1', 'international', 99),
  bund('KRK', 'KRK', 'Übereinkommen vom 20. November 1989 über die Rechte des Kindes (Kinderrechtskonvention, KRK)', '0.107', 'international', 100),
  bund('CEDAW', 'CEDAW', 'Übereinkommen vom 18. Dezember 1979 zur Beseitigung jeder Form von Diskriminierung der Frau (CEDAW)', '0.108', 'international', 101),
  bund('UNO_ANTIFOLTER', 'UN-Antifolterkonvention', 'Übereinkommen vom 10. Dezember 1984 gegen Folter und andere grausame, unmenschliche oder erniedrigende Behandlung oder Strafe', '0.105', 'international', 102),
  bund('HEUE', 'HEsÜ', 'Übereinkommen vom 13. Januar 2000 über den internationalen Schutz von Erwachsenen (Haager Erwachsenenschutzübereinkommen)', '0.211.232.1', 'international', 103),
  bund('HAUE', 'HAdoptÜ', 'Übereinkommen vom 29. Mai 1993 über den Schutz von Kindern und die Zusammenarbeit auf dem Gebiet der internationalen Adoption (Haager Adoptionsübereinkommen)', '0.211.221.311', 'international', 104),
  bund('PVUE', 'PVÜ', 'Pariser Verbandsübereinkunft zum Schutz des gewerblichen Eigentums (revidiert in Stockholm am 14. Juli 1967)', '0.232.04', 'international', 105),
  bund('ICAO', 'ICAO-Übk.', 'Übereinkommen vom 7. Dezember 1944 über die internationale Zivilluftfahrt', '0.748.0', 'international', 106),
  bund('GFK', 'GFK', 'Abkommen vom 28. Juli 1951 über die Rechtsstellung der Flüchtlinge (Genfer Flüchtlingskonvention, GFK)', '0.142.30', 'international', 107),
  bund('STAATENLOSE', 'Staatenlose', 'Übereinkommen vom 28. September 1954 über die Rechtsstellung der Staatenlosen', '0.142.40', 'international', 108),
  // ── International P4 (Fedlex-Portfolio Paket 4, 10.7.2026): kuratierte
  //    Staatsverträge SR 0.* als Volltext. Königsweg = konsolidierte eli/cc-
  //    Pipeline (nicht eli/treaty); html-N SPARQL-kanonisch (isExemplifiedBy)
  //    gepinnt — html-0 war bei EAUe/CMR/RBÜ/Istanbul/HUVÜ stale (P1-a-Falle).
  //    Beleg: bibliothek/register/fedlex-staatsvertraege-2026-07-10.md. ──
  bund('HKSUE96', 'HKsÜ', 'Übereinkommen vom 19. Oktober 1996 über die Zuständigkeit, das anzuwendende Recht, die Anerkennung, Vollstreckung und Zusammenarbeit auf dem Gebiet der elterlichen Verantwortung und der Massnahmen zum Schutz von Kindern (Haager Kindesschutzübereinkommen, HKsÜ)', '0.211.231.011', 'international', 110),
  bund('HUVUE', 'HUVÜ', 'Übereinkommen vom 2. Oktober 1973 über die Anerkennung und Vollstreckung von Unterhaltsentscheidungen', '0.211.213.02', 'international', 111),
  bund('EAUE', 'EAUe', 'Europäisches Auslieferungsübereinkommen vom 13. Dezember 1957 (EAUe)', '0.353.1', 'international', 112),
  bund('CMR', 'CMR', 'Übereinkommen vom 19. Mai 1956 über den Beförderungsvertrag im internationalen Strassengüterverkehr (CMR)', '0.741.611', 'international', 113),
  bund('MONTREAL', 'Montrealer Übk.', 'Übereinkommen vom 28. Mai 1999 zur Vereinheitlichung bestimmter Vorschriften über die Beförderung im internationalen Luftverkehr (Montrealer Übereinkommen)', '0.748.411', 'international', 114),
  bund('RBUE', 'RBÜ', 'Berner Übereinkunft zum Schutz von Werken der Literatur und Kunst (revidiert in Paris am 24. Juli 1971, RBÜ)', '0.231.15', 'international', 115),
  bund('UNO_BRK', 'UNO-BRK', 'Übereinkommen vom 13. Dezember 2006 über die Rechte von Menschen mit Behinderungen (UNO-Behindertenrechtskonvention, BRK)', '0.109', 'international', 116),
  bund('ISTANBUL', 'Istanbul-Konv.', 'Übereinkommen des Europarats vom 11. Mai 2011 zur Verhütung und Bekämpfung von Gewalt gegen Frauen und häuslicher Gewalt (Istanbul-Konvention)', '0.311.35', 'international', 117),
  bund('APOSTILLE', 'Apostille-Übk.', 'Übereinkommen vom 5. Oktober 1961 zur Befreiung ausländischer öffentlicher Urkunden von der Beglaubigung (Apostille-Übereinkommen)', '0.172.030.4', 'international', 118),
  // ── Wichtige weitere Bundesgesetze als «nur-live-link»-Stubs (kein Volltext;
  //    Fedlex-Link), verifiziert via SPARQL — bund-stubs.generated.ts (§7). ──
  ...BUND_STUBS,
  // ── International: nicht-Fedlex-Erlasse (EU-Recht) als «nur-live-link»,
  //    amtliche EUR-Lex-Quelle. Rubrik «International» (§7/§8). ──
  ...INTERNATIONAL_EXTERN,
  // ── pdf-embed: amtliches PDF in-app (kein extrahierbarer Volltext-HTML),
  //    z.B. EMRK, New Yorker Schiedsspruch-Übk. (§7/§8). ──
  // ── QS-KORPUS · Kernerlasse-Luecken Bund geschlossen (14.9.2026) ─────────────
  //    Bestandsmessung 1.9.2026: EMRK nur pdf-embed, EOEBV und AVG fehlten ganz.
  //    ELI + geltende Konsolidierung je Fedlex-SPARQL, html-N kanonisch via
  //    isExemplifiedBy; Pins und §7-Beleg: scripts/fedlex-cache.sh +
  //    bibliothek/register/fedlex-kernerlasse-2026-09-14.md.
  //    EMRK wandert von status 'pdf-embed' auf 'snapshot' (rang 89 unveraendert):
  //    Fedlex fuehrt den Konsolidierungstext 20220916 vollstaendig als HTML
  //    (Praeambel, Art. 1-59 lueckenlos, Unterschriften, Geltungsbereich). Die
  //    pdf-embed-Begruendung vom 25.6.2026 bleibt fuer ihren damaligen Pin
  //    (Kons. 20050323, pdf-a war die EINZIGE deutsche Manifestation) richtig.
  bund('EMRK', 'EMRK', 'Konvention vom 4. November 1950 zum Schutze der Menschenrechte und Grundfreiheiten (EMRK)', '0.101', 'international', 89),
  bund('EOEBV', 'EÖBV', 'Verordnung vom 8. Dezember 2017 über die Erstellung elektronischer öffentlicher Urkunden und elektronischer Beglaubigungen (EÖBV)', '211.435.1', 'privat', 30),
  bund('AVG', 'AVG', 'Bundesgesetz vom 6. Oktober 1989 über die Arbeitsvermittlung und den Personalverleih (Arbeitsvermittlungsgesetz, AVG)', '823.11', 'oeffentlich', 127),
  ...PDF_EMBED,
] as ErlassRegistereintrag[]).map(mitGrundart).map(mitAufhebung);

// Bund-Eintrag mit Default-Sprache de + status 'snapshot'. fedlexKey default ==
// key, wenn der FEDLEX-Schlüssel identisch ist (sonst explizit übergeben).
function bund(
  key: string, kuerzel: string, titel: string, sr: string,
  rechtsgebiet: Rechtsgebiet, rang: number, fedlexKey?: FedlexGesetz,
): ErlassRegistereintrag {
  const fk = (fedlexKey ?? key) as FedlexGesetz;
  if (!(fk in FEDLEX)) throw new Error(`bund(): FEDLEX-Schlüssel fehlt für ${key} (${fk})`);
  return { key, ebene: 'bund', kuerzel, titel, sr, rechtsgebiet, sprache: 'de', rang, status: 'snapshot', fedlexKey: fk };
}

// ── Kantonale Erlasse: Identität (Kürzel/Titel/SR/Sprache) leitet der Generator
//    aus dem Snapshot + Dateinamen ab. Das Rechtsgebiet ist hier deklariert
//    (Default unten); Abweichungen als Override. Erstklassifikation 17.6.2026 —
//    von David fall-für-fall verfeinerbar (kantonale Gruppierung primär nach
//    Kanton, Gebiet sekundär). ────────────────────────────────────────────────
const KANTON_GEBIET_DEFAULT: Rechtsgebiet = 'oeffentlich';

/** Override key (Datei-Stamm) → Rechtsgebiet für kantonale Erlasse. */
const KANTON_GEBIET: Readonly<Record<string, Rechtsgebiet>> = {
  // (wird mit der kantonalen Klassifikation gefüllt; leer = überall Default)
};

/** Schlägt das Rechtsgebiet eines kantonalen Erlasses nach (Override → Default). */
export function kantonGebiet(key: string): Rechtsgebiet {
  return KANTON_GEBIET[key] ?? KANTON_GEBIET_DEFAULT;
}
