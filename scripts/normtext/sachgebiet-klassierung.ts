// scripts/normtext/sachgebiet-klassierung.ts
//
// Die Sachgebiets-Achse der Rechtsprechung: aus welchen amtlichen Signalen ein
// Entscheid sein `sachgebiet` bekommt. Herausgelöst aus entscheide-mapping.ts
// am 29.8.2026 (§6.6 — jene Datei war mit der 9C-Korrektur über ihre Schwelle
// gewachsen); der Umzug ist WORTGLEICH und verhaltensneutral (§6), bewiesen
// über unveränderte Tests, byte-gleiche Golden-Outputs und je 0 Wechsel im
// DRY-RUN der drei Regen-Skripte.
//
// Warum ein eigenes Modul und nicht bloss mehr Baseline: Die Regeln hier sind
// der Teil der Extraktion, der am häufigsten und am belegtesten wächst — jede
// Gegenprüfung schärft sie nach, und jede Schärfung trägt ihre amtliche
// Grundlage als Kommentar mit sich. Sie brauchen einen Ort, an dem sie
// zusammenstehen, statt zwischen Norm-Key-Extraktion und Gerichtsnamen
// verstreut zu liegen.
//
// entscheide-mapping.ts re-exportiert alles hier Definierte unverändert
// weiter (Fassade), damit kein Aufrufer angefasst werden musste.

import type { Rechtsgebiet } from '../../src/lib/normtext/register';

// legal_area (OCL) → Sachgebiet-Achse der Gesetze.
const LEGAL_AREA: Array<[string, Rechtsgebiet]> = [
  ['civil', 'privat'], ['zivil', 'privat'], ['private', 'privat'],
  ['criminal', 'straf'], ['straf', 'straf'], ['penal', 'straf'],
  ['debt', 'schkg'], ['betreibung', 'schkg'], ['insolvenc', 'schkg'],
  // W2-TRENNUNG (29.8.2026): Der Doppel-Topf 'sozial-abgaben' ist zerlegt. Die
  // OCL-legal_area unterscheidet die beiden Hälften bereits selbst — die
  // Steuer-Begriffe (tax/steuer) und die Sozialversicherungs-Begriffe (social/
  // sozial, OCL-Wert 'social_insurance') standen schon vorher nebeneinander in
  // dieser Liste und zeigten nur beide auf denselben Topf. Kein neues Signal,
  // nur zwei Ziele statt einem.
  ['tax', 'steuern'], ['steuer', 'steuern'],
  ['social', 'sozialversicherung'], ['sozial', 'sozialversicherung'],
  ['procedure', 'prozess'], ['prozess', 'prozess'],
  ['public', 'oeffentlich'], ['administrativ', 'oeffentlich'], ['oeffentlich', 'oeffentlich'],
];
export function legalAreaZuSachgebiet(area: string | null | undefined): Rechtsgebiet | null {
  if (!area) return null;
  const k = String(area).toLowerCase();
  for (const [frag, geb] of LEGAL_AREA) if (k.includes(frag)) return geb;
  return null;
}

// Abteilungs-Konvention des Bundesgerichts (Aktenzeichen-Präfix) → Sachgebiet.
// Deklariert nach amtlicher Geschäftsverteilung (deterministisch, kein Raten).
const ABTEILUNG: Record<string, Rechtsgebiet> = {
  '4A': 'privat', '4C': 'privat', '5A': 'privat', '5C': 'privat', '5D': 'privat',
  '6B': 'straf', '6S': 'straf',
  '1B': 'prozess', '7B': 'prozess',
  '1C': 'oeffentlich', '1P': 'oeffentlich', '1E': 'oeffentlich',
  // J3 (29.8.2026, Beleg-Korrektur nach Gegenprüfung): Zuständigkeit der II.
  // öffentlich-rechtlichen Abteilung (2A/2C/2D) nach Art. 30 BgerR (SR
  // 173.110.131, Fassung 2026-02-01): Ausländerrecht, internationale Amtshilfe
  // in Steuersachen, öffentliches Wirtschaftsrecht inkl. Beschaffungswesen und
  // freie Berufe — «Steuern und Abgaben» sind SEIT 1.1.2023 bei der III.
  // öffentlich-rechtlichen Abteilung (Art. 31 lit. a BgerR, AS 2023 65); der
  // Altbestand 2A/2C bis 2022 enthält sie noch. Default darum 'oeffentlich';
  // Steuer-/Abgabefälle erkennt die Signal-Kette (NORM_SIGNAL, zweier*-Signale,
  // Kette in mappeEntscheidOCL). Der frühere Default 'sozial-abgaben' war die
  // Pauschale, die BGFA-/Grundrechts-/Vergabe-Fälle als «Steuern &
  // Sozialversicherung» etikettierte (Messung 29.8.2026: 53 Band-I- und 82
  // Band-II-BGE ohne jedes Steuer-Signal in diesem Topf).
  '2C': 'oeffentlich', '2A': 'oeffentlich', '2D': 'oeffentlich',
  // W2-TRENNUNG (29.8.2026), KORRIGIERT nach Gegenprüfung Befund F1 (29.8.2026):
  //
  // 8C und 9C sind die beiden vormals «sozialrechtlichen» Abteilungen, seit dem
  // 1.1.2023 amtlich III. und IV. öffentlich-rechtliche Abteilung (SR
  // 173.110.131, Fassung 2026-02-01):
  //   · Art. 31 BgerR = III. öffentlich-rechtliche Abteilung (Präfix 9C):
  //     «a. Steuern und Abgaben; b. AHV; c. IV; d. EO; e. KV; f. berufliche
  //     Vorsorge» — die Abteilung führt Steuern UND Sozialversicherung.
  //   · Art. 32 BgerR = IV. öffentlich-rechtliche Abteilung (Präfix 8C): UV,
  //     ALV, kantonale Sozialversicherung, Familienzulagen, Sozialhilfe,
  //     Militärversicherung, EL — keine Steuersachen.
  //
  // Die frühere Fassung dieses Kommentars nannte «Art. 34/35 BgerR» und schloss
  // «Steuersachen … nie bei 8C/9C» — beides ist amtlich widerlegt: Art. 34/35
  // sind die zivil- bzw. strafrechtlichen Abteilungen, und Art. 31 lit. a weist
  // die Steuern GERADE der 9C zu (AS 2023 65). Die Pauschale
  // «9C ⇒ sozialversicherung» etikettierte darum jeden 9C-Steuerfall falsch
  // (Messung 29.8.2026: 68 BGE des Abgabe-Bands II mit 9C-aza standen so als
  // «Sozialversicherung», darunter reine DBG-/StHG-/MWSTG-Entscheide).
  //
  // Die Einträge hier bleiben der DEFAULT, der erst greift, NACHDEM die
  // Steuer-Frage beantwortet ist: für 9C läuft `dritteOerSachgebiet` VOR dieser
  // Tabelle (Kette in mappeEntscheidOCL). 8C ist unverändert eindeutig.
  '8C': 'sozialversicherung', '9C': 'sozialversicherung',
};
export function abteilungZuSachgebiet(docket: string): Rechtsgebiet | null {
  const m = /^(\d[A-Z])/.exec(String(docket).trim());
  return m ? (ABTEILUNG[m[1]] ?? null) : null;
}

// Mehrdeutige BGer-Abteilungen: Die II. öffentlich-rechtliche Abteilung (2A/2C/2D)
// führt SOWOHL Steuer- ALS AUCH Ausländer-/Migrationssachen — der pauschale
// Abteilungs-Default «sozial-abgaben» ist für sie zu grob (C2-1). Für sie wird
// vorrangig das eindeutige Norm-Signal ausgewertet.
const ZWEIER_OER_ABTEILUNG = new Set(['2A', '2C', '2D']);
export function istMehrdeutigeOerAbteilung(docket: string): boolean {
  const m = /^(\d[A-Z])/.exec(String(docket).trim());
  return m ? ZWEIER_OER_ABTEILUNG.has(m[1]) : false;
}

// Eindeutiges Sachgebiets-Signal aus den zitierten Normen (Register-keys):
// Migrations-/Ausländerrecht → öffentlich; Steuerrecht → 'steuern'.
// Kein Treffer → null (der Aufrufer fällt dann auf legal_area / Abteilung zurück).
// DEKLARIERTE Priorität: die Reihenfolge dieser Liste entscheidet, welches
// Signal gewinnt, wenn ein Entscheid mehrere trägt — Migrationsrecht (AIG,
// AsylG, BewG) vor Steuerrecht (DBG, StHG, MWSTG, StG, VStG).
//
// Früher wurde über die ÜBERGEBENEN Keys iteriert; das Ergebnis hing damit an
// der Reihenfolge der statutes[] und kippte je Entscheid: ['Art. 5 AsylG',
// 'Art. 12 DBG'] auf einem 2C-Fall lieferte 'oeffentlich', die umgekehrte
// Nennung derselben zwei Normen 'sozial-abgaben' (empirisch nachgestellt
// 28.7.2026). Gleiche Eingabemenge → gleiches Sachgebiet ist §2; die Priorität
// gehört in die Tabelle, nicht in die Laune der Drittextraktion.
// J3 (29.8.2026): BGFA → öffentlich (Anwaltsaufsicht/Berufsrecht; Anlassfall
// BGE 150 II 300 stand als «Steuern & Sozialversicherung»). Priorität VOR den
// Steuergesetzen: ein BGFA-Fall mit Steuer-Berührung (z.B. Anwaltsgeheimnis in
// der Steueramtshilfe, BGE 151 II 873) bleibt Berufsrecht → öffentlich.
// Die im Fahrplan zusätzlich genannte BV-Regel («BV → öffentlich») ist BEWUSST
// NICHT als Norm-Signal umgesetzt (§7-Abweichung, offengelegt; Gegenprüfung
// 29.8.2026 bestätigt): 60 % der Entscheide mit Steuer-Key zitieren zusätzlich
// die BV (gemessen 109/182 im Register) — als vorrangiges Signal kippte sie
// diese echten Steuerfälle (Gegenbeleg BGE 149 I 125: zitiert Art. 8 BV, ist
// reine Grundstücksteuer). Ihren Zweck (verfassungsrechtliche 2er-Fälle nicht
// als Steuern etikettieren) erfüllt der Abteilungs-Default 'oeffentlich'.
// W2-TRENNUNG (29.8.2026) — DEKLARIERTE §7-ABWEICHUNG vom Auftragswortlaut:
// Der Auftrag verlangte, hier zusätzlich Sozialversicherungs-Signale (AHVG,
// IVG, UVG, ATSG, KVG, BVG, ELG, AVIG → 'sozialversicherung') aufzunehmen. Das
// ist BEWUSST NICHT umgesetzt, weil diese Liste AUSSCHLIESSLICH in der Kette
// der II. öffentlich-rechtlichen Abteilung ausgewertet wird
// (`istMehrdeutigeOerAbteilung`, 2A/2C/2D) — und dort ist Sozialversicherung
// nach Art. 30 BgerR gar keine Zuständigkeit (sie liegt nach Art. 31/32 bei
// der III. und IV. öffentlich-rechtlichen Abteilung; ANKER-KORREKTUR
// 29.8.2026, Gegenprüfung F2: hier stand «Art. 30/34/35 BgerR» — Art. 34/35
// sind die zivil- bzw. strafrechtlichen Abteilungen). Ein Sozialversicherungs-
// Signal an dieser Stelle würde exakt den Defekt wiederherstellen, den die
// J3-Gegenprüfung am 29.8.2026 als Befund B2 beseitigt hat: BGE 151 II 726
// (2C_565/2022, Verbleiberecht nach FZA) nennt das AHVG nur als Altersmassstab
// und wurde davon fälschlich als Sozialversicherungsfall etikettiert. Die
// echten Sozialversicherungsfälle klassiert die Abteilungs-Zeile (8C bzw. 9C
// nach `dritteOerSachgebiet`) bzw. das BGE-Band V — dort, wo die amtliche
// Geschäftsverteilung sie führt.
// Die Steuer-Ziele wechseln nur ihren Namen ('sozial-abgaben' → 'steuern').
const NORM_SIGNAL: ReadonlyArray<readonly [string, Rechtsgebiet]> = [
  ['AIG', 'oeffentlich'], ['ASYLG', 'oeffentlich'], ['BEWG', 'oeffentlich'],
  ['BGFA', 'oeffentlich'],
  ['DBG', 'steuern'], ['STHG', 'steuern'], ['MWSTG', 'steuern'],
  ['STG', 'steuern'], ['VSTG', 'steuern'],
];
export function normSignalSachgebiet(normKeys: Iterable<string>): Rechtsgebiet | null {
  const vorhanden = new Set<string>();
  for (const k of normKeys) vorhanden.add(String(k).toUpperCase());
  for (const [key, geb] of NORM_SIGNAL) if (vorhanden.has(key)) return geb;
  return null;
}

// J3-Korrektur (Gegenprüfung 29.8.2026, Befund F1): Auf der 2er-Abteilung darf
// die OCL-legal_area nur noch die EINE Frage beantworten, die der Abteilungs-
// Default offen lässt — Steuer/Abgabe oder nicht. 'civil'/'criminal'-Werte der
// Drittextraktion sind auf einer öffentlich-rechtlichen Abteilung per se
// unplausibel und kippten Entscheide nach «Privatrecht» (Beleg: BGE 152 II 142,
// 2D_14/2024 = subsidiäre Verfassungsbeschwerde, Beschaffungsrecht, stand als
// 'privat'; ebenso BGE 151 II 46).
// Bug-Check-Nachschärfung (B2 empirisch, 29.8.2026): auf den BEGRIFF filtern,
// nicht auf den Ziel-Topf — der damalige Topf 'sozial-abgaben' bündelte Steuern
// UND Sozialversicherung, und 'social_insurance' passierte so wie zuvor 'civil'
// (seit der W2-TRENNUNG 29.8.2026 sind es zwei Töpfe; der Filter bleibt nötig,
// weil 'social_insurance' auf der 2er-Abteilung weiterhin unplausibel ist)
// (Beleg: BGE 151 II 726, 2C_565/2022 — Verbleiberecht nach FZA, AHVG nur als
// Altersmassstab; Sozialversicherung liegt nach Art. 31/32 BgerR bei der III.
// öffentlich-rechtlichen Abteilung bzw. den sozialrechtlichen, nie bei der 2er).
const ZWEIER_LEGAL_AREA_STEUER = /tax|steuer|imp[oô]t|fiscal/i;
export function zweierLegalAreaSignal(area: string | null | undefined): Rechtsgebiet | null {
  return area && ZWEIER_LEGAL_AREA_STEUER.test(String(area)) ? 'steuern' : null;
}

// J3-Korrektur (Gegenprüfung 29.8.2026, Befund F2/Mindestkorrektur 4):
// KANTONALE Steuergesetze tragen keinen Register-Key — statutesZuNormKeys
// verwirft «StG» bewusst als föderal/kantonal mehrdeutig. Auf der 2er-Abteilung
// ist «StG»/«Steuergesetz» in den ROH-zitierten Normen aber ein eindeutiges
// Abgabe-Signal (Beleg: BGE 149 I 125, Walliser Grundstücksteuer, «Art. 181
// Abs. 2 STG»). Wortgrenze schliesst StGB/VStG aus; NUR in den öör-Ketten
// verwenden (2A/2C/2D und — seit dem F1-Fix — 9C über `dritteSteuerSignal`);
// ausserhalb bleibt StG mehrdeutig.
const ZWEIER_STEUER_ROH = /steuergesetz|\bstg\b/i;

// ─── Zwei Abgabe-Klassen OHNE Bundes-Steuer-Key (Gegenprüfung Runde 2, G2) ────
//
// Beide Muster lesen dieselbe Roh-Quelle wie `ZWEIER_STEUER_ROH` und gelten
// darum unter derselben Einschränkung: NUR in den öffentlich-rechtlichen Ketten
// (2A/2C/2D über `sachgebietFuerEntscheid`, 9C über `dritteSteuerSignal`).
// Ausserhalb sind sie nicht ausgewertet — dort bliebe «DBA» oder ein
// BV-Kompetenzartikel mehrdeutig.
//
// (a) INTERNATIONALE STEUERAMTSHILFE. Das Steueramtshilfegesetz (StAhiG, SR
//     651.1, fr «LAAF») trägt KEINEN Register-Key — es ist im ERLASS_REGISTER
//     nicht geführt, `normSignalSachgebiet` konnte es also nie sehen. Genau
//     darum standen die Amtshilfe-Entscheide als 'oeffentlich', obwohl die
//     amtliche SR-Systematik sie unter 6 «Finanzen» / 65 «Informationsaustausch
//     in Steuersachen» führt und ihr Gegenstand die Steuererhebung eines
//     Vertragsstaats ist. Mitgeführt wird das Doppelbesteuerungsabkommen
//     («DBA»), das in diesen Verfahren die materielle Grundlage bildet.
//     GEMESSEN am Bestand (29.8.2026, 5'093 Snapshots): `StAhiG|LAAF` trifft 9
//     Einträge, `DBA` 8 — Vereinigung 13, davon 4 bereits 'steuern'. ALLE 13
//     sind an ihrer amtlichen Regeste als Steuersache belegt («internationale
//     Amtshilfe in Steuersachen», «Steueramtshilfe», DBA-Auslegung). Null
//     Falschtreffer. Bewusst NICHT aufgenommen ist das französische «CDI»
//     (Convention de double imposition): es trifft 6 Einträge und fügt der
//     Vereinigung KEINEN einzigen hinzu (jeder trägt zusätzlich DBA oder LAAF),
//     wäre also ein Muster ohne Wirkung (§17-Rückbau) — und «CDI» ist im
//     französischen Rechtsgebrauch mit dem contrat de durée indéterminée
//     doppelt belegt.
const AMTSHILFE_STEUER_ROH = /\b(stahig|laaf|dba)\b/i;

// (b) BUNDESVERFASSUNGS-ABGABEARTIKEL. Abgabefälle ohne jeden Erlass-Key
//     (kantonale Erbschaftssteuer, Radio-/TV-Abgabe, Zollabgabe) zitieren
//     regelmässig die BV-Norm, die den Bund zur betreffenden Abgabe ermächtigt:
//     Art. 128 (direkte Bundessteuer), 129 (Steuerharmonisierung), 130 (MWST),
//     131 (besondere Verbrauchssteuern), 132 (Stempelabgabe/Verrechnungs-
//     steuer), 133 (Zölle).
//     AUSGESCHLOSSEN sind Art. 127 und Art. 134 — und zwar aus einem
//     sachlichen, an der Messung belegten Grund, nicht als nachträgliche
//     Anpassung an Ausreisser: beide begründen KEINE Abgabe. Art. 127
//     («Grundsätze der Besteuerung») ist die Grundsatznorm, die in JEDEM
//     Kausalabgabe- und Gebührenfall beliebigen Gegenstands angerufen wird
//     (Legalitäts-, Kostendeckungs-, Äquivalenzprinzip), Art. 134 ist eine
//     negative Abgrenzungsnorm.
//     GEMESSEN (29.8.2026): Die volle Spanne 127–134 trifft 44 Einträge, davon
//     9 nicht-'steuern'. VIER dieser Fehlgriffe hängen an 127/134 und fallen
//     mit der Verengung weg (BGE 147 I 16 Erschliessungsgebühr, 149 I 305
//     Gewässerschutz-Kostendeckungsprinzip, 149 I 33 Genfer Volksinitiative,
//     SG B 2023/225 Notfalldienstersatzabgabe).
//     KORRIGIERT nach Gegenprüfung Runde 3 (Befund H1, 29.8.2026): BGE 151 I
//     225 (Abstimmungsbeschwerde zur AHV-Finanzierung) gehört NICHT in diese
//     Liste — er trägt «Art. 130 Abs. 3ter CST» und matcht die verengte Spanne
//     128–133 sehr wohl. Er bleibt 'oeffentlich' aus einem anderen Grund: sein
//     unterliegendes Urteil ist 1C_487/2024, und die Roh-Signale laufen NUR in
//     den öör-Ketten der 2er- und der 9C-Abteilung. Die I. öffentlich-
//     rechtliche Abteilung (1C) erreicht das Muster nie — die Verengung schützt
//     ihn nicht, das Abteilungs-Gate tut es. Die frühere Fassung schrieb der
//     Verengung damit eine Wirkung zu, die sie in diesem Fall nicht hat.
//     Die Spanne 128–133 trifft 12 Einträge; innerhalb der öör-Ketten, wo das
//     Muster überhaupt läuft, sind es 11 (die zwölfte ist eben 151 I 225) —
//     7 bereits 'steuern' und 4 echte Abgabefälle (150 II 98
//     Handänderungssteuer, 151 II 442 Radio-/TV-Abgabe, 151 II 533 Zollabgabe,
//     152 II 1 Erbschaftssteuer LU). Null Falschtreffer.
//     Der Rest von Q-J3-5 bleibt bestehen: Kausalabgaben, die nur Art. 127
//     tragen, bleiben 'oeffentlich' — deklarierte Grenze, keine Kuration.
const BV_ABGABE_ROH = /\bart\.\s*1(2[89]|3[0-3])\b.*\b(bv|cst|cost)\b/i;

/** Roh-String-Signale für Steuern & Abgaben (§7-Beleg je Muster oben).
 *  NUR in den öffentlich-rechtlichen Ketten aufrufen. */
export function zweierRohSteuerSignal(zitierteNormen: Iterable<string>): Rechtsgebiet | null {
  for (const z of zitierteNormen) {
    const s = String(z);
    if (ZWEIER_STEUER_ROH.test(s) || AMTSHILFE_STEUER_ROH.test(s) || BV_ABGABE_ROH.test(s)) {
      return 'steuern';
    }
  }
  return null;
}

// ─── III. öffentlich-rechtliche Abteilung (9C): Steuern UND Sozialversicherung ──
//
// ANLASS: Gegenprüfung 29.8.2026, Befund F1. Die Zeile `'9C': 'sozialversicherung'`
// war eine Pauschale. Nach Art. 31 BgerR (SR 173.110.131, Fassung 2026-02-01)
// führt die III. öffentlich-rechtliche Abteilung «a. Steuern und Abgaben»
// NEBEN AHV/IV/EO/KV/beruflicher Vorsorge — sie ist damit, genau wie die 2er,
// eine GEMISCHTE Abteilung und braucht dieselbe Behandlung: erst die
// Sachfrage klären, dann den Default anwenden.
const DRITTE_OER_ABTEILUNG = new Set(['9C']);
export function istGemischteDritteOerAbteilung(docket: string): boolean {
  const m = /^(\d[A-Z])/.exec(String(docket).trim());
  return m ? DRITTE_OER_ABTEILUNG.has(m[1]) : false;
}

/** BGE-Band (römisch) aus der Sammlungs-Nummer «150 II 300» / «150_II_300».
 *  Unterstriche werden normalisiert (Bug-Check B4, 29.8.2026: `_` ist ein
 *  Wortzeichen, `\b` feuerte in der Unterstrich-Form nie — Einträge fielen
 *  still aus dem Scope). Alt-Bände «Ia»/«Ib» (vor 1995) matcht das Muster
 *  bewusst nicht — sie sind nicht im Korpus.
 *  EINE Quelle (§5): lag bis zum F1-Fix (29.8.2026) als Kopie in
 *  remap-sachgebiet-j3.ts UND remap-sachgebiet-trennung.ts. */
export function bgeBand(nummer: string): string | null {
  const m = /\b(IV|III|II|I|V)\b/.exec(String(nummer).replace(/_/g, ' '));
  return m ? m[1] : null;
}

// Sozialversicherungs-Erlasse (SR 830–838). Ihre Mit-Zitierung macht ein
// Steuer-Signal auf der 9C MEHRDEUTIG: die AHV-Beiträge Selbstständiger werden
// nach Art. 23 AHVV aus der Steuermeldung der kantonalen Steuerbehörde
// abgeleitet, ein echter AHV-Beitragsfall zitiert darum regelmässig das DBG.
// GEMESSEN am Bestand (29.8.2026): von 69 Einträgen der 9C mit Steuer-Signal
// tragen 16 zusätzlich einen dieser Erlasse — die Gegenbeispiele sind real und
// nicht vernachlässigbar, darum der Guard (und nicht die rohe Signal-Kette).
const SV_ERLASS_KEYS: ReadonlySet<string> = new Set([
  'ATSG', 'ATSV', 'AHVG', 'AHVV', 'IVG', 'IVV', 'ELG', 'BVG', 'BVV2',
  'KVG', 'KVV', 'UVG', 'UVV', 'MVG', 'EOG', 'FAMZG', 'AVIG', 'AVIV',
]);
export function hatSozialversicherungsErlass(normKeys: Iterable<string>): boolean {
  for (const k of normKeys) if (SV_ERLASS_KEYS.has(String(k).toUpperCase())) return true;
  return false;
}

/** Steuer-Signalkette der 9C — dieselben drei Signale wie auf der 2er, aber NUR
 *  mit Steuer-Ausgang. Ein vorrangiges NORM_SIGNAL nach 'oeffentlich' (AIG,
 *  AsylG, BewG, BGFA) heisst «kein Steuerfall» und liefert hier null; der
 *  Aufrufer fällt dann auf den Abteilungs-Default. */
export function dritteSteuerSignal(
  normKeys: Iterable<string>,
  zitierteNormen: Iterable<string>,
  legalArea: string | null | undefined,
): Rechtsgebiet | null {
  if (normSignalSachgebiet(normKeys) === 'steuern') return 'steuern';
  return zweierRohSteuerSignal(zitierteNormen) ?? zweierLegalAreaSignal(legalArea);
}

/**
 * Sachgebiet eines Entscheids der III. öffentlich-rechtlichen Abteilung (9C).
 * Liefert IMMER ein Gebiet — die Funktion ersetzt für 9C den Abteilungs-Default.
 *
 * Vorrang des BGE-BANDES (amtliche Systematik der Sammlung, §7): Band II ist
 * das Band für Verwaltungs- und Abgaberecht, Band V das Sozialrechts-Band. Ein
 * vom Bundesgericht selbst in Band II publizierter Entscheid ist nach eben
 * dieser amtlichen Einordnung KEIN Sozialversicherungsfall — der Band schlägt
 * darum den SV-Erlass-Guard, SOLANGE ein Steuer-Signal vorliegt.
 *
 * NEU GEMESSEN (Gegenprüfung Runde 2, Befund G1/G3, 29.8.2026) — die frühere
 * Fassung dieses Satzes behauptete, «alle 68 Band-II-Einträge mit 9C-aza» seien
 * Steuerfälle. Das ist zu weit und wird hier durch die Messung ersetzt:
 *   · 68 Band-II-Einträge mit 9C-aza, davon 60 MIT Steuer-Signal → 'steuern'
 *     (darunter die mit BVG-/ATSG-/AHVG-Zitat: BGE 150 II 20 «Art. 32 Abs. 2
 *     DBG, Erneuerungsfonds», BGE 150 II 409 «Beschwerdelegitimation … direkte
 *     Bundessteuer», BGE 151 II 345 «Art. 85 MWSTG»);
 *   · 8 OHNE Steuer-Signal, davon 7 ohne jeden Sozialversicherungs-Erlass
 *     (Wasserrechtszins, Spruchgebühr, GAV-Anschlusspflicht …) → 'oeffentlich';
 *   · GENAU EINER trägt einen SV-Erlass und kein Steuer-Signal: BGE 149 II 381
 *     (9C_259/2023, Parteientschädigung bei «Überarztung», ATSG/KVG).
 *
 * DARUM DIE AUSNAHME (§1 vor amtlicher Systematik-Pauschale): Band II schliesst
 * die Sozialversicherung nur so lange aus, wie kein positives, eigenständiges
 * SV-Signal dagegensteht. Ein Entscheid, der ausschliesslich Erlasse der
 * SR-Gruppe 830–838 trägt und KEIN Steuer-Signal, ist Sozialversicherungsrecht
 * — die Bandzuteilung ist dann eine Publikationsentscheidung der Sammlung, kein
 * Gegenbeweis. Die Ausnahme ist deterministisch (zwei geprüfte Bedingungen,
 * keine Einzelfall-Liste) und am Bestand mit genau einem Treffer belegt.
 *
 * ENG GEHALTEN, weil die breite Fassung nachweislich schadet: «Band II ⇒
 * sozialversicherung, sobald ein SV-Erlass vorliegt» hätte am Bestand SECHS
 * Einträge gekippt und vier davon falsch — BGE 148 II 73 (Staatshaftung ETHL,
 * AHVG/BVG nur mitzitiert), BGE 151 II 726 (Verbleiberecht FZA, AHVG als
 * Altersmassstab — der Anlassfall des J3-Befunds B2), BGE 151 II 277 (AIG/FZA
 * mit IVG-Zitat), BGE 148 II 16 (BPG/ArG mit BVG-Zitat). Die Ausnahme greift
 * darum NUR auf der 9C — der Abteilung, die nach Art. 31 BgerR die
 * Sozialversicherung überhaupt führt; die 8C- und 2er-Fälle bleiben vom
 * generellen Band-II-Veto in `bgeSachgebietHint` gedeckt.
 */
export function dritteOerSachgebiet(opts: {
  normKeys: Iterable<string>;
  zitierteNormen: Iterable<string>;
  legalArea: string | null | undefined;
  /** BGE-Band (röm.) oder null für ein bger-Urteil ohne Sammlungs-Band. */
  band: string | null;
}): Rechtsgebiet {
  const normKeys = [...opts.normKeys];
  const steuer = dritteSteuerSignal(normKeys, opts.zitierteNormen, opts.legalArea);
  // Band V: Sozialrechts-Band der amtlichen Sammlung — eindeutig.
  if (opts.band === 'V') return 'sozialversicherung';
  // Band III/IV (Gegenprüfung Runde 3, Auflage 1, 29.8.2026): die Fach-Bände
  // Zivilrecht/SchKG bzw. Strafrecht. Der Band-Vorrang, den
  // `bgeRoemischSachgebiet` für sie ohnehin deklariert (III→privat, IV→straf),
  // muss VOR dem SV-Default dieser Funktion greifen — sonst überstimmt der
  // Abteilungs-Default der 9C die amtliche Bandzuteilung. Der Vorrang ist hier
  // HART (kein Steuer-Vorbehalt wie bei Band II): Band II grenzt als Abgabe-/
  // Verwaltungsrecht-Band sachlich an Steuern UND Sozialversicherung, Band III
  // und IV führen nach der Systematik der Sammlung weder das eine noch das
  // andere. GEMESSEN am Bestand (29.8.2026, 6'341 Registerzeilen): vier
  // Band-III-Leitentscheide mit 9C-aza standen so als «Sozialversicherung» —
  // BGE 151 III 168, 151 III 28, 151 III 143 (Allgemeinverbindlicherklärung
  // bzw. Vollzug eines Gesamtarbeitsvertrags, Art. 356 ff. OR / AVEG) und
  // BGE 148 III 201 (Informationsanspruch aus dem Privatversicherungsvertrag,
  // Art. 36 VAG / Art. 92 ff. VVG); alle vier sind an ihrer amtlichen Regeste
  // als Zivilsache belegt. Band IV: null Treffer — der Zweig ist trotzdem
  // deklariert, weil er dieselbe eine Regel trägt und nicht eine zweite.
  // Am Tor festgenagelt (Tor C, rechtsprechung-sachgebiet-tore.test.ts).
  if (opts.band === 'III') return 'privat';
  if (opts.band === 'IV') return 'straf';
  // Band II: Verwaltungs-/Abgaberecht. Steuer-Signal gewinnt; ohne Steuer-Signal
  // schlägt ein positives SV-Erlass-Signal den Band (G3, Beleg im Kopf oben),
  // sonst Verwaltungsrecht.
  if (opts.band === 'II') {
    if (steuer) return steuer;
    return hatSozialversicherungsErlass(normKeys) ? 'sozialversicherung' : 'oeffentlich';
  }
  // Sonst (bger-Urteil, BGE Band I): Steuer-Signal nur, wenn KEIN
  // Sozialversicherungs-Erlass mitzitiert ist (Art.-23-AHVV-Fälle, s.o.).
  if (steuer && !hatSozialversicherungsErlass(normKeys)) return steuer;
  return 'sozialversicherung';
}

// Kantonale Aktenzeichen-Präfixe → Sachgebiet (best-effort, deklariert, 'maschinell').
// W2-TRENNUNG (29.8.2026): Beide Zeilen, die vorher auf den Doppel-Topf
// 'sozial-abgaben' zeigten, sind REINE Sozialversicherungs-Zeilen und zeigen
// jetzt auf 'sozialversicherung' — EL Ergänzungsleistungen · IV Invaliden- ·
// UV Unfall- · ALV/AL Arbeitslosen- · EO Erwerbsersatz · AHV/AH Alters- ·
// BV berufliche Vorsorge (NICHT Bundesverfassung, Q-J3-4) · KV Kranken- ·
// FZ Freizügigkeit · MV Militärversicherung · SG Schiedsgericht Sozial-
// versicherung BS (NICHT St. Gallen, Q-J3-4). Kein Präfix trug je Steuersachen:
// kantonale Steuerrekurse laufen unter den Verwaltungs-Präfixen (WBE/VB/VD),
// die schon vorher auf 'oeffentlich' zeigten (gemessen 29.8.2026: 0 der 904
// kantonalen Treffer wechselt nach 'steuern').
const KANT_PRAEFIX: Array<[RegExp, Rechtsgebiet]> = [
  [/^(EL|IV|UV|ALV|EO|AHV|BV|KV|FZ)\b/i, 'sozialversicherung'],
  [/^(ZR|ZB|ZK|ZG|PS|PQ|PC|PD|PF|RE|RU|NP|LB|LC|LF|RB|HG)\b/i, 'privat'],
  [/^(SB|SK|UE|UH|US|BK|SU)\b/i, 'straf'],
  [/^(WBE|VB|VWBE)\b/i, 'oeffentlich'],
  // BS-Geschäftsarten (BS-Tranche §3.4) — jede Zeile an ≥3 echten Portal-Titeln
  // verifiziert (Inventar 19.7.2026; bei Kleinst-Beständen MV/SG/K5/KR an ALLEN
  // existierenden Dokumenten + Kopf-Instanz); unsichere Präfixe (DGZ/BO)
  // bewusst weggelassen (ehrlich Default statt geraten):
  //  AL Arbeitslosenversicherung · AH AHV · MV Militärversicherung · SG Schieds-
  //  gericht Sozialversicherung (KVG-Tarif) — Sozialversicherung.
  [/^(AL|AH|MV|SG)\b/i, 'sozialversicherung'],
  //  BES Beschwerde Strafsachen · HB Haftsachen · DGS Dreiergericht Strafsachen ·
  //  ZS Strafsachen (Landesverweisung/Verkehrsregeln/erkennungsdienstlich).
  [/^(BES|HB|DGS|ZS)\b/i, 'straf'],
  //  BEZ Beschwerde Zivilsachen · KE Kindes-/Erwachsenenschutz · ZV Versicherungs-
  //  gericht VVG (privatrechtliche Zusatzversicherung) · K5 Zivilgericht Kammer 5
  //  (Bauhandwerkerpfandrecht/Arbeitsvertrag) · KR Kindesrückführung (HKÜ).
  [/^(BEZ|KE|ZV|K5|KR)\b/i, 'privat'],
  //  VD Verwaltungsrekurse · AUS Ausschaffungs-/Vorbereitungshaft · VG Verfassungs-
  //  gericht · AK Anwaltsaufsicht (Disziplinarrecht BGFA) · DGV Dreiergericht Verwaltung.
  [/^(VD|AUS|VG|AK|DGV)\b/i, 'oeffentlich'],
];
export function kantonalSachgebiet(docket: string): Rechtsgebiet | null {
  const d = String(docket).trim();
  for (const [re, g] of KANT_PRAEFIX) if (re.test(d)) return g;
  return null;
}

// ─── Die Ketten: aus den Signalen wird ein Sachgebiet ────────────────────────
//
// Aus adapter-entscheide.ts hierher gezogen (§6.6, 29.8.2026) — wortgleich, nur
// als benannte Funktion statt als Ausdruck mitten im Mapper. Sie gehören zu den
// Regeln, nicht zum Zusammenbau des Snapshots.

/** BGE-Band → Sachgebiet: I/II öffentl., III privat, IV straf, V Sozialvers.
 *  (Band V ist das Sozialrechts-Band; Steuersachen stehen in I/II.) */
export function bgeRoemischSachgebiet(docket: string): Rechtsgebiet | null {
  const m = /\b(IV|III|II|I|V)\b/.exec(String(docket));
  switch (m?.[1]) {
    case 'I': case 'II': return 'oeffentlich';
    case 'III': return 'privat';
    case 'IV': return 'straf';
    case 'V': return 'sozialversicherung';   // W2-TRENNUNG 29.8.2026
    default: return null;
  }
}

/**
 * Sachgebiet eines einzelnen Entscheids (bger oder kantonal) aus seinen
 * Signalen. Reihenfolge ist die Aussage:
 *
 *   1. Ein übergebener Hint gewinnt (der BGE-Pfad bringt den Band mit).
 *   2. C2-1/J3 — für die mehrdeutige II. öffentlich-rechtliche Abteilung
 *      (2A/2C/2D) entscheidet die Signal-Kette NUR die Steuer/Abgabe-Frage:
 *      Norm-Signal (AIG→öffentlich, DBG/StHG→'steuern', BGFA→öffentlich), dann
 *      Roh-«StG/Steuergesetz» (kantonale Steuergesetze ohne Register-Key), dann
 *      legal_area GEFILTERT auf Steuer-Begriffe (Gegenprüfung 29.8.2026, F1:
 *      ungefiltertes 'civil' kippte 2D-Beschaffungsfälle nach «privat»). Kein
 *      Treffer → Abteilungs-Default 'oeffentlich' (Art. 30 BgerR).
 *   3. F1 (Gegenprüfung 29.8.2026) — die III. öffentlich-rechtliche Abteilung
 *      (9C) führt nach Art. 31 lit. a BgerR AUCH «Steuern und Abgaben»; ihr
 *      Default 'sozialversicherung' greift erst, NACHDEM die Steuerfrage
 *      beantwortet ist. `band: null`, weil hier ein bger-Urteil klassiert wird —
 *      den Sammlungs-Band bringt `bgeSachgebietHint` ein.
 *   4. Abteilungs-Präfix (5A→privat) ist präziser als …
 *   5. … kantonale Aktenzeichen-Präfixe — NUR für kantonale Gerichte (`kanton` ≠
 *      'CH'): BStGer «BV.2026.10» (Beschwerdeverfahren Verwaltungsstrafrecht) traf
 *      sonst «BV = berufliche Vorsorge» ⇒ «sozialversicherung» (Probelauf
 *      Wochenlauf 25.9.2026, Tor B); bvger/bstger/bpatger gehen über 6. —, und
 *      beide präziser als …
 *   6. … die grobe OCL-legal_area (erst Fallback). Sonst 'oeffentlich'.
 */
export function sachgebietFuerEntscheid(opts: {
  hint: Rechtsgebiet | null;
  docket: string;
  normKeys: Iterable<string>;
  zitierteNormen: string[];
  legalArea: string | null | undefined;
  /** OCL `canton` ('CH' = Bundesgericht/eidg. Gericht); nur kantonal greift KANT_PRAEFIX. */
  kanton: string;
}): Rechtsgebiet {
  return (
    opts.hint
    ?? (istMehrdeutigeOerAbteilung(opts.docket)
        ? (normSignalSachgebiet(opts.normKeys)
          ?? zweierRohSteuerSignal(opts.zitierteNormen)
          ?? zweierLegalAreaSignal(opts.legalArea))
        : null)
    ?? (istGemischteDritteOerAbteilung(opts.docket)
        ? dritteOerSachgebiet({
            normKeys: opts.normKeys,
            zitierteNormen: opts.zitierteNormen,
            legalArea: opts.legalArea,
            band: null,
          })
        : null)
    ?? abteilungZuSachgebiet(opts.docket)
    ?? (opts.kanton !== 'CH' ? kantonalSachgebiet(opts.docket) : null)
    ?? legalAreaZuSachgebiet(opts.legalArea)
    ?? 'oeffentlich'
  );
}

/**
 * Sachgebiets-Hint für einen amtlichen Leitentscheid (BGE).
 *
 * Der Hint nähme sonst ungeprüft das Sachgebiet des unterliegenden aza-Urteils.
 * Zwei Korrekturen der Gegenprüfung vom 29.8.2026 stehen dagegen:
 *
 * F1 — BAND-VORRANG bei 9C-aza: Die III. öffentlich-rechtliche Abteilung führt
 * nach Art. 31 lit. a BgerR Steuern UND Sozialversicherung, während der BGE-BAND
 * die amtliche Einordnung der Sammlung selbst trägt (II = Verwaltungs-/Abgabe-,
 * V = Sozialrecht). Ein 9C-aza mit Default 'sozialversicherung' zog vorher alle
 * 68 Band-II-Leitentscheide mit — darunter reine DBG-/StHG-/MWSTG-Entscheide.
 *
 * F3 — BAND-II-VETO, GENERELL: Band II ist das Band für Verwaltungs- und
 * Abgaberecht; 'sozialversicherung' ist dort nach der amtlichen Systematik
 * ausgeschlossen (Sozialrecht steht in Band V). Das gilt nicht nur für 9C: die
 * IV. öffentlich-rechtliche Abteilung (8C) führt neben der Sozialversicherung
 * auch öffentliches Personalrecht und Staatshaftung, und ihr Default zog zwei
 * weitere Leitentscheide mit (BGE 149 II 337, BPG-Kündigung einer
 * SBB-Angestellten; BGE 148 II 73, Staatshaftung der ETHL). Fällt der Hint weg,
 * greift der Band-Default 'oeffentlich'. Am Tor festgenagelt
 * (rechtsprechung-sachgebiet-tore.test.ts).
 *
 * G3 (Gegenprüfung Runde 2, 29.8.2026) — REICHWEITE DES VETOS PRÄZISIERT: Es
 * gilt für die Zweige, die den Band nicht selbst auswerten (8C-, 2er- und
 * kantonale Hints). Der 9C-Zweig wertet ihn in `dritteOerSachgebiet` bereits
 * aus, samt der dort belegten Ausnahme (nur SV-Erlasse, kein Steuer-Signal —
 * BGE 149 II 381). Ein Veto darüber wäre eine zweite, widersprechende Wahrheit.
 *
 * J4 (Gegenprüfung Runde 3, Auflage 1, 29.8.2026) — VETO AUF DIE FACH-BÄNDE
 * AUSGEDEHNT: Dieselbe Systematik schliesst das Sozialrecht auch aus Band III
 * (Zivilrecht/SchKG) und Band IV (Strafrecht) aus. Der 8C-Default trug BGE 148
 * III 126 (GAV der SBB i.V.m. Art. 335b OR) hinein — ein Fall, den der
 * band-bewusste 9C-Zweig nie sieht. Am Tor C festgenagelt.
 */
/** Bände, in denen die amtliche Sammlung kein Sozialversicherungsrecht führt —
 *  II (Verwaltungs-/Abgaberecht), III (Zivilrecht/SchKG), IV (Strafrecht); das
 *  Sozialrecht steht in Band V. Trägt das Veto unten für alle Zweige, die den
 *  Band nicht selbst auswerten. III/IV nachgezogen in Runde 3 (Auflage 1,
 *  29.8.2026): BGE 148 III 126 (GAV der SBB i.V.m. Art. 335b OR) kam über den
 *  8C-Default, nicht über die 9C, und wäre vom band-bewussten 9C-Zweig allein
 *  nie erreicht worden. Band I bleibt bewusst DRAUSSEN: das
 *  Verfassungsrechts-Band führt Grundrechtsfälle jeden Gegenstands, darunter
 *  echte sozialversicherungsrechtliche (z.B. BGE 149 I 172, Prämienverbilligung
 *  nach Art. 65 Abs. 3 KVG) — dort wäre ein Veto falsch (offener Rest, siehe
 *  bibliothek/rechtsprechung/sachgebiet-klassierung-j3-2026-08-29.md). */
const BAND_OHNE_SOZIALVERSICHERUNG = new Set(['II', 'III', 'IV']);

export function bgeSachgebietHint(opts: {
  /** Fundstelle des BGE, z.B. «150 II 20» — Quelle des Bandes. */
  fundstelle: string;
  /** Aktenzeichen des unterliegenden Urteils, z.B. «9C_391/2023». */
  azaAz: string | null;
  /** Sachgebiet des unterliegenden Urteils, falls aufgelöst. */
  azaSachgebiet: Rechtsgebiet | null;
  /** Normen beider Seiten (Sammlungs-Auszug + unterliegendes Urteil). */
  normKeys: Iterable<string>;
  zitierteNormen: string[];
  legalArea: string | null | undefined;
}): Rechtsgebiet | null {
  const band = bgeBand(opts.fundstelle);
  // 9C: `dritteOerSachgebiet` ist SELBST band-bewusst — sie kennt die
  // Band-II-Regel samt ihrer einen deklarierten Ausnahme (SV-Erlass ohne
  // Steuer-Signal, G3). Das generelle Veto unten würde diese Ausnahme sofort
  // wieder kassieren und wäre damit eine zweite, widersprechende Wahrheit (§5);
  // es gilt darum nur für die Zweige, die den Band NICHT selbst auswerten.
  if (istGemischteDritteOerAbteilung(String(opts.azaAz ?? ''))) {
    return dritteOerSachgebiet({
      normKeys: opts.normKeys,
      zitierteNormen: opts.zitierteNormen,
      legalArea: opts.legalArea,
      band,
    });
  }
  const roh = opts.azaSachgebiet;
  return (BAND_OHNE_SOZIALVERSICHERUNG.has(String(band)) && roh === 'sozialversicherung') ? null : roh;
}
