// Golden-Output-Protokoll (§6 CLAUDE.md): friert die Ergebnisse der hier
// importierten Engines und Vorlagen über eine Eingaben-Matrix ein — NICHT aller
// (HN-18/PS-10, 25.9.2026 ehrlich gemacht). Vorlagen: jeder Zusammensteller
// unter src/lib/vorlagen/ ausser gmbhDokumentmappe, keDokumentmappe und
// kvZusammenstellen der Klage vereinfacht (kommen mit RL-41);
// kuendigung-vermieter ist Checkliste ohne Zusammensteller (nur Engine-Auskunft).
// Engines: exportierte berechne*/bestimme* ohne Fall hier (u. a. die
// *Spiegel-Engines, Kostenrisiko/-vorschuss, Sicherheitsleistung) sind NICHT
// abgedeckt — Lücken messen statt behaupten: je Export-Name in dieser Datei
// suchen. Die Basis ist
// COMMITTET (golden/lexmetrik-golden.json) und wird im CI gegated
// (FAHRPLAN-GRUNDLAGEN G2/A1): jeder Push muss byte-gleich sein.
//
//   npm run golden            # Basis NEU schreiben — nur bei deklarierter
//                             # fachlicher Änderung, im selben Commit begründen
//   npm run golden:vergleich  # Gate: aktueller Code vs. committete Basis
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { diffArrays } from 'diff';

import { berechneFrist } from '../src/lib/zpoFristen';
import { berechneSchkgFrist } from '../src/lib/schkgFristen';
import { berechneKuendigungsfrist } from '../src/lib/kuendigungsfrist';
import { berechneSperrfristen } from '../src/lib/sperrfristen';
import { berechneMietkuendigung } from '../src/lib/mietrecht';
import { berechneVerjaehrung } from '../src/lib/verjaehrung';
import { berechneGewaehrleistung } from '../src/lib/gewaehrleistung';
import { berechneVerzugszins } from '../src/lib/verzugszins';
import { berechneLohnfortzahlung } from '../src/lib/lohnfortzahlung';
import { berechneErbteilung } from '../src/lib/erbteilung';
import { berechneAllgemeineFrist, berechneRueckwaertsFrist, tageZwischen, zustellHinweis, icsFuerFrist } from '../src/lib/allgemeineFrist';
import { bestimmeZustaendigkeit, bestimmeRechtsmittel } from '../src/lib/zustaendigkeit';
import { bestimmeSchkgZustaendigkeit } from '../src/lib/schkgZustaendigkeit';
import { bestimmeStrafZustaendigkeit } from '../src/lib/strafZustaendigkeit';

import { testamentZusammenstellen, TESTAMENT_DEFAULTS } from '../src/lib/vorlagen/testament';
import { pvZusammenstellen, PV_DEFAULTS } from '../src/lib/vorlagen/patientenverfuegung';
import { vaZusammenstellen, pruefeVaGates, VA_DEFAULTS } from '../src/lib/vorlagen/vorsorgeauftrag';
import { sgZusammenstellen, SG_DEFAULTS, SG_PERSON_NATUERLICH } from '../src/lib/vorlagen/schlichtungsgesuchBs';
import { koZusammenstellen, KO_DEFAULTS } from '../src/lib/vorlagen/klageOrdentlich';
import { avZusammenstellen, AV_DEFAULTS, pruefeAvGates } from '../src/lib/vorlagen/arbeitsvertrag';
import { lvZusammenstellen, LV_DEFAULTS, pruefeLvGates, type LvAntworten } from '../src/lib/vorlagen/lehrvertrag';
import { hrZusammenstellen, HR_DEFAULTS, pruefeHrGates } from '../src/lib/vorlagen/handelsreisendenvertrag';
import { haZusammenstellen, HA_DEFAULTS, pruefeHaGates } from '../src/lib/vorlagen/heimarbeitsvertrag';
import { agDokumentmappe, AG_DOK_DEFAULTS, type AgDokAntworten } from '../src/lib/vorlagen/gruendungAgDokumente';
import { mvZusammenstellen, MV_DEFAULTS, pruefeMvGates, type MvAntworten } from '../src/lib/vorlagen/mietvertrag';
import { maZusammenstellen, MA_DEFAULTS, pruefeMaGates, type MaAntworten } from '../src/lib/vorlagen/mahnung';
import { rubrumZusammenstellen, RUBRUM_DEFAULTS, pruefeRubrumGates } from '../src/lib/vorlagen/rubrum';
import { formatiereGerichtszitat } from '../src/lib/gerichtszitat';
import { vvZusammenstellen, VV_DEFAULTS, pruefeVvGates } from '../src/lib/vorlagen/verjaehrungsverzicht';
import { faZusammenstellen, FA_DEFAULTS, pruefeFaGates } from '../src/lib/vorlagen/forderungsabtretung';
import { afZusammenstellen, AF_DEFAULTS, pruefeAfGates } from '../src/lib/vorlagen/auftrag';
import { wvZusammenstellen, WV_DEFAULTS, pruefeWvGates } from '../src/lib/vorlagen/werkvertrag';
import { ndaZusammenstellen, NDA_DEFAULTS, pruefeNdaGates } from '../src/lib/vorlagen/nda';
import { kkZusammenstellen, KK_DEFAULTS, pruefeKkGates } from '../src/lib/vorlagen/konkubinat';
import { feZusammenstellen, FE_DEFAULTS, pruefeFeGates } from '../src/lib/vorlagen/fristerstreckung';
import { nbZusammenstellen, NB_DEFAULTS, pruefeNbGates, nbFruehesterGesuchstag } from '../src/lib/vorlagen/nichtbekanntgabe';
import { skZusammenstellen, skWarnungen, SK_DEFAULTS } from '../src/lib/vorlagen/scheidungsklage';
import { sbZusammenstellen, SB_DEFAULTS } from '../src/lib/vorlagen/scheidungsbegehren';
import { egZusammenstellen, EG_DEFAULTS } from '../src/lib/vorlagen/eheschutzgesuch';
import { kmZusammenstellen, KM_DEFAULTS, pruefeKmGates, type KmAntworten } from '../src/lib/vorlagen/kuendigungMieter';
import { kagZusammenstellen, KAG_DEFAULTS, pruefeKagGates, kagIstProbezeit, type KagAntworten } from '../src/lib/vorlagen/kuendigungArbeitgeber';
import { kanZusammenstellen, KAN_DEFAULTS, pruefeKanGates, type KanAntworten } from '../src/lib/vorlagen/kuendigungArbeitnehmer';
import { kvZusammenstellen as kdgKvZusammenstellen, KV_DEFAULTS, pruefeKvGates, type KvAntworten } from '../src/lib/vorlagen/kuendigungAllgemein';
import { vollmachtZusammenstellen, VOLLMACHT_DEFAULTS, pruefeVollmachtGates, type VollmachtAntworten } from '../src/lib/vorlagen/vollmacht';
import { berechneBgerRechtsweg } from '../src/lib/bgerRechtsweg';
import { berechneBggVwvgFrist } from '../src/lib/bggVwvgFristen';
import { begruendungsAbsatz, fristbeginnZusatz } from '../src/lib/begruendung';
import { berechneStreitwert } from '../src/lib/streitwert';
import { berechneTeuerung } from '../src/lib/teuerung';
import { berechneBetreibungskosten } from '../src/lib/gebvKosten';
import { berechneProzesskosten } from '../src/lib/prozesskosten';
import { berechneBeurkundung } from '../src/lib/beurkundung';
import { berechneGrundbuchgebuehr } from '../src/lib/grundbuchgebuehren';
import { berechneNotariatGrundbuch } from '../src/lib/notariatGrundbuch';
import { berechneErbFrist } from '../src/lib/erbFristen';

const faelle: Record<string, unknown> = {};
const f = (id: string, fn: () => unknown) => {
  try { faelle[id] = fn(); } catch (e) { faelle[id] = { FEHLER: String(e) }; }
};

// ── Rechner: je Engine mehrere repräsentative + Kanten-Fälle ────────────────
const KANTONE = ['ZH', 'BS', 'GE', 'TI', 'VS'] as const;

for (const kanton of KANTONE) {
  f(`zpo:tage10:${kanton}`, () => berechneFrist({ ereignis: '2025-12-10', einheit: 'tage', laenge: 10, verfahren: 'ordentlich', kanton, fristnatur: 'gesetzlich' }));
  f(`zpo:monat1:${kanton}`, () => berechneFrist({ ereignis: '2026-01-26', einheit: 'monate', laenge: 1, verfahren: 'ordentlich', kanton, fristnatur: 'gesetzlich' }));
}
f('zpo:sommer30', () => berechneFrist({ ereignis: '2026-07-01', einheit: 'tage', laenge: 30, verfahren: 'ordentlich', kanton: 'ZH', fristnatur: 'gesetzlich' }));
f('zpo:summarisch', () => berechneFrist({ ereignis: '2026-07-01', einheit: 'tage', laenge: 10, verfahren: 'summarisch', kanton: 'ZH', fristnatur: 'gesetzlich' }));
f('zpo:hinweisFehlt', () => berechneFrist({ ereignis: '2026-07-01', einheit: 'tage', laenge: 10, verfahren: 'summarisch', kanton: 'ZH', fristnatur: 'gesetzlich', gerichtshinweisStillstand: false }));
f('zpo:mindermeinung', () => berechneFrist({ ereignis: '2026-01-26', einheit: 'monate', laenge: 1, verfahren: 'ordentlich', kanton: 'ZH', fristnatur: 'gesetzlich', modus: 'mindermeinung' }));

f('schkg:rv10', () => berechneSchkgFrist({ ereignis: '2026-03-20', einheit: 'tage', laenge: 10, modus: 'schkg_betreibungsferien', fristnatur: 'verwirkung', kanton: 'ZH' }));
f('schkg:ostern', () => berechneSchkgFrist({ ereignis: '2026-03-25', einheit: 'tage', laenge: 10, modus: 'schkg_betreibungsferien', fristnatur: 'verwirkung', kanton: 'ZH' }));
f('schkg:weihnachten', () => berechneSchkgFrist({ ereignis: '2025-12-20', einheit: 'tage', laenge: 10, modus: 'schkg_betreibungsferien', fristnatur: 'verwirkung', kanton: 'ZH' }));
f('schkg:zpoStillstand', () => berechneSchkgFrist({ ereignis: '2026-07-01', einheit: 'tage', laenge: 20, modus: 'zpo_stillstand', fristnatur: 'klagefrist', kanton: 'ZH' }));

f('kuendigung:dj1', () => berechneKuendigungsfrist({ vertragsbeginn: '2025-03-01', zugangKuendigung: '2025-09-10', kuendigendePartei: 'arbeitgeber', kuendigungsterminMonatsende: true, probezeitMonate: 1 }));
f('kuendigung:dj10', () => berechneKuendigungsfrist({ vertragsbeginn: '2015-01-01', zugangKuendigung: '2025-09-10', kuendigendePartei: 'arbeitnehmer', kuendigungsterminMonatsende: true, probezeitMonate: 1 }));

f('sperr:krank', () => berechneSperrfristen({ vertragsbeginn: '2020-01-01', zugangKuendigung: '2025-04-20', kuendigendePartei: 'arbeitgeber', probezeitMonate: 1, kuendigungsterminMonatsende: true, sperrereignisse: [{ typ: 'krankheit_unfall', von: '2025-05-01', bis: '2025-05-20' }] }));
f('sperr:nichtig', () => berechneSperrfristen({ vertragsbeginn: '2020-01-01', zugangKuendigung: '2025-03-15', kuendigendePartei: 'arbeitgeber', probezeitMonate: 1, kuendigungsterminMonatsende: true, sperrereignisse: [{ typ: 'militaer_zivil', von: '2025-03-12', bis: '2025-03-20' }, { typ: 'militaer_zivil', von: '2025-03-21', bis: '2025-03-30' }] }));

f('miet:ordentlich', () => berechneMietkuendigung({ kuendigungsart: 'ordentlich', objekt: 'wohnung', zugang: '2026-02-10', kanton: 'ZH', partei: 'mieter' }));
f('miet:zahlungsverzug', () => berechneMietkuendigung({ kuendigungsart: 'zahlungsverzug', objekt: 'wohnung', zugang: '2026-02-10', kanton: 'ZH', partei: 'vermieter' }));
f('miet:geschaeft', () => berechneMietkuendigung({ kuendigungsart: 'ordentlich', objekt: 'geschaeftsraum', zugang: '2026-02-10', kanton: 'ZH', partei: 'mieter' }));

f('verj:or127', () => berechneVerjaehrung({ regime: 'ordentlich', beginnRelativ: '2020-03-15', stichtag: '2026-06-05', kanton: 'ZH' }));
f('verj:delikt', () => berechneVerjaehrung({ regime: 'delikt', beginnRelativ: '2024-02-29', beginnAbsolut: '2024-02-29', stichtag: '2026-06-05', kanton: 'ZH' }));
f('verj:unterbrochen', () => berechneVerjaehrung({ regime: 'kurz', beginnRelativ: '2022-01-10', stichtag: '2026-06-05', kanton: 'ZH', unterbrechungen: [{ datum: '2024-03-01', art: 'betreibung' }] } as never));

f('gewaehr:alt', () => berechneGewaehrleistung({ vertragstyp: 'fahrniskauf', vertragsdatum: '2025-06-01', objekt: 'beweglich', uebergabe: '2025-07-01', mangelTyp: 'offen', kanton: 'ZH', stichtag: '2026-06-05' }));
f('gewaehr:neu', () => berechneGewaehrleistung({ vertragstyp: 'fahrniskauf', vertragsdatum: '2026-02-01', objekt: 'beweglich', uebergabe: '2026-03-01', mangelTyp: 'versteckt', entdeckung: '2026-04-01', kanton: 'ZH', stichtag: '2026-06-05' }));

f('verzug:einfach', () => berechneVerzugszins({ kapital: 10000, verzugsbeginn: '2025-01-15', stichtag: '2026-02-20' }));
f('verzug:teilzahlung', () => berechneVerzugszins({ kapital: 10000, verzugsbeginn: '2025-01-15', stichtag: '2026-02-20', ereignisse: [{ datum: '2025-07-01', typ: 'teilzahlung', betrag: 4000 }] } as never));

f('lohn:bs', () => berechneLohnfortzahlung({ vertragsbeginn: '2020-01-01', verhinderungBeginn: '2026-02-01', verhinderungEnde: '2026-04-15', arbeitsunfaehigkeitProzent: 100, kanton: 'BS', ktgGleichwertigVorhanden: false }));
f('lohn:teilauf', () => berechneLohnfortzahlung({ vertragsbeginn: '2024-06-01', verhinderungBeginn: '2026-01-10', verhinderungEnde: '2026-03-01', arbeitsunfaehigkeitProzent: 50, kanton: 'ZH', ktgGleichwertigVorhanden: false }));

f('erb:ehegatte2kinder', () => berechneErbteilung({ todesdatum: '2026-03-01', zivilstand: 'verheiratet', kinderLebend: 2 } as never));
f('erb:nurEltern', () => berechneErbteilung({ todesdatum: '2026-03-01', zivilstand: 'ledig', kinderLebend: 0 } as never));

f('allg:30t', () => berechneAllgemeineFrist({ start: '2020-10-23', laenge: 30, einheit: 'tage', wochenendeVerschieben: true, feiertageVerschieben: true, kanton: 'ZH' }));
f('allg:klemm', () => berechneAllgemeineFrist({ start: '2026-01-31', laenge: 1, einheit: 'monate', wochenendeVerschieben: true, feiertageVerschieben: true, kanton: 'ZH' }));
f('allg:rueck', () => berechneRueckwaertsFrist({ stichtag: '2026-06-30', laenge: 3, einheit: 'monate', verschiebung: 'keine' }));
f('allg:zwischen', () => tageZwischen('2026-06-01', '2026-07-01'));
f('allg:zustell', () => zustellHinweis('einschreiben', '2026-04-01'));
f('allg:ics', () => icsFuerFrist({ titel: 'Fristende', endISO: '2026-06-30', vorfristTage: 3 }));

// ── Zuständigkeits-Engines (deklarierte Erweiterung 6.6.2026: neue Fälle,
// bestehende 53 unverändert — Vergleich gegen alte Baseline bleibt gültig,
// neue IDs werden beim ersten Schreiben Teil der Baseline) ──────────────────
f('zust:geld:80k', () => bestimmeZustaendigkeit({ streitsache: 'geldforderung', vermoegensrechtlich: true, streitwertCHF: 80_000 }));
f('zust:miete:kuendigungsschutz', () => bestimmeZustaendigkeit({ streitsache: 'miete_wohn_geschaeft', vermoegensrechtlich: true, streitwertCHF: 25_000, mieteUnterfall: 'kuendigungsschutz' }));
f('zust:gewaltschutz', () => bestimmeZustaendigkeit({ streitsache: 'persoenlichkeit', vermoegensrechtlich: false, streitwertCHF: null, persoenlichkeitUnterfall: 'gewaltschutz' }));
f('zust:ip:gsv', () => bestimmeZustaendigkeit({ streitsache: 'ip_wettbewerb', vermoegensrechtlich: true, streitwertCHF: 12_000, gerichtsstandsvereinbarung: true }));
f('rm:arbeit:15k', () => bestimmeRechtsmittel({ streitsache: 'arbeit', vermoegensrechtlich: true, streitwertCHF: 15_000 }));
f('rm:geld:9999', () => bestimmeRechtsmittel({ streitsache: 'geldforderung', vermoegensrechtlich: true, streitwertCHF: 9_999 }));

// ── BGer-Rechtsweg (FAHRPLAN-BGER-RECHTSWEG R-1, 11.6.2026) ─────────────────
f('bger:zivil:50k', () => berechneBgerRechtsweg({ weg: 'zivil', zivilGebiet: 'schuldrecht', vermoegensrechtlich: true, streitwertCHF: 50_000 }));
f('bger:zivil:schwelle', () => berechneBgerRechtsweg({ weg: 'zivil', zivilGebiet: 'arbeit', vermoegensrechtlich: true, streitwertCHF: 14_999 }));
f('bger:rechtsoeffnung', () => berechneBgerRechtsweg({ weg: 'zivil', zivilGebiet: 'rechtsoeffnung', vermoegensrechtlich: true, streitwertCHF: 50_000, eroeffnung: '2026-07-01', kanton: 'ZH' }));
f('bger:schkg-aufsicht', () => berechneBgerRechtsweg({ weg: 'schkg_aufsicht', eroeffnung: '2026-02-04', kanton: 'ZH' }));
f('bger:wechsel', () => berechneBgerRechtsweg({ weg: 'schkg_aufsicht', wechselbetreibung: true }));
f('bger:eheschutz', () => berechneBgerRechtsweg({ weg: 'zivil', zivilGebiet: 'familienrecht', vermoegensrechtlich: false, eheschutz: true, eroeffnung: '2026-07-01', kanton: 'BS' }));
f('bger:schied', () => berechneBgerRechtsweg({ weg: 'zivil', zivilGebiet: 'schuldrecht', vermoegensrechtlich: true, streitwertCHF: 1_000, schiedsgericht: true }));
f('bger:marke', () => berechneBgerRechtsweg({ weg: 'zivil', markenwiderspruch: true }));
f('bger:straf', () => berechneBgerRechtsweg({ weg: 'straf', objekt: 'zwischen_anderer' }));
f('bger:verwaltung', () => berechneBgerRechtsweg({ weg: 'verwaltung', verwaltungSonderfall: 'rechtshilfe_amtshilfe' }));
f('schkg:einleiten:grundpfand', () => bestimmeSchkgZustaendigkeit({ anliegen: 'betreibung_einleiten', schuldnerTyp: 'jur_person_hr', pfand: 'grundpfand', forderungCHF: 250_000 }));
f('schkg:ro:prov', () => bestimmeSchkgZustaendigkeit({ anliegen: 'rechtsoeffnung', schuldnerTyp: 'natuerlich_wohnsitz', rechtsoeffnungArt: 'provisorisch' }));
f('schkg:widerspruch:dritter_ch', () => bestimmeSchkgZustaendigkeit({ anliegen: 'widerspruch', schuldnerTyp: 'natuerlich_wohnsitz', widerspruchKonstellation: 'gewahrsam_dritter_ch' }));
// Erweiterung Golden-Matrix 7.6.2026: alle 11 SchKG-Anliegen abdecken
// (bislang nur betreibung_einleiten/rechtsoeffnung/widerspruch). Eingaben
// fachlich plausibel, deterministisch.
f('schkg:aberkennung', () => bestimmeSchkgZustaendigkeit({ anliegen: 'aberkennungsklage', schuldnerTyp: 'natuerlich_wohnsitz', forderungCHF: 30_000 }));
f('schkg:anerkennung', () => bestimmeSchkgZustaendigkeit({ anliegen: 'anerkennungsklage', schuldnerTyp: 'jur_person_hr', forderungCHF: 50_000 }));
f('schkg:rueckforderung', () => bestimmeSchkgZustaendigkeit({ anliegen: 'rueckforderung', schuldnerTyp: 'natuerlich_wohnsitz', forderungCHF: 8_000 }));
f('schkg:feststellung', () => bestimmeSchkgZustaendigkeit({ anliegen: 'feststellung', schuldnerTyp: 'natuerlich_wohnsitz', forderungCHF: 15_000 }));
f('schkg:kollokation:konkurs', () => bestimmeSchkgZustaendigkeit({ anliegen: 'kollokation', schuldnerTyp: 'jur_person_hr', kollokationIn: 'konkurs', forderungCHF: 120_000 }));
f('schkg:kollokation:pfaendung', () => bestimmeSchkgZustaendigkeit({ anliegen: 'kollokation', schuldnerTyp: 'natuerlich_wohnsitz', kollokationIn: 'pfaendung', forderungCHF: 20_000 }));
f('schkg:arrest', () => bestimmeSchkgZustaendigkeit({ anliegen: 'arrest', schuldnerTyp: 'ausland_niederlassung', arrestGelegt: true, forderungCHF: 200_000 }));
f('schkg:konkursbegehren:hr', () => bestimmeSchkgZustaendigkeit({ anliegen: 'konkursbegehren', schuldnerTyp: 'jur_person_hr', forderungCHF: 90_000 }));
f('schkg:konkursbegehren:natuerlich', () => bestimmeSchkgZustaendigkeit({ anliegen: 'konkursbegehren', schuldnerTyp: 'natuerlich_wohnsitz', arrestGelegt: true, forderungCHF: 40_000 }));
f('schkg:beschwerde_amt', () => bestimmeSchkgZustaendigkeit({ anliegen: 'beschwerde_amt', schuldnerTyp: 'natuerlich_wohnsitz' }));
f('straf:anzeige:antragsdelikt', () => bestimmeStrafZustaendigkeit({ anliegen: 'anzeige', tatort: 'bekannt', antragsdelikt: true }));
f('straf:kaskade:ergreifung', () => bestimmeStrafZustaendigkeit({ anliegen: 'gerichtsstand', tatort: 'ausland_oder_ungewiss', kaskade32: 'ergreifungsort', mehrereTatenVerschOrte: true }));
// Erweiterung Golden-Matrix 7.6.2026: alle 5 Kaskadenstufen des Art. 32 StPO
// abdecken (bislang nur ergreifungsort). Kaskade greift nur bei
// tatort='ausland_oder_ungewiss' ohne Spezialforum.
f('straf:kaskade:wohnsitz', () => bestimmeStrafZustaendigkeit({ anliegen: 'gerichtsstand', tatort: 'ausland_oder_ungewiss', kaskade32: 'wohnsitz' }));
f('straf:kaskade:aufenthalt', () => bestimmeStrafZustaendigkeit({ anliegen: 'gerichtsstand', tatort: 'ausland_oder_ungewiss', kaskade32: 'aufenthalt' }));
f('straf:kaskade:heimatort', () => bestimmeStrafZustaendigkeit({ anliegen: 'gerichtsstand', tatort: 'ausland_oder_ungewiss', kaskade32: 'heimatort' }));
f('straf:kaskade:auslieferung', () => bestimmeStrafZustaendigkeit({ anliegen: 'gerichtsstand', tatort: 'ausland_oder_ungewiss', kaskade32: 'auslieferung' }));
f('straf:unternehmen', () => bestimmeStrafZustaendigkeit({ anliegen: 'gerichtsstand', tatort: 'bekannt', spezialforum: 'unternehmen', uebertretung: false }));

// ── Tarif-Engines: Golden-Blindspot geschlossen (QS-OPT O-3.1) ──────────────
// prozesskosten / beurkundung / grundbuchgebuehren / notariatGrundbuch trugen
// bislang 0 Golden-Keys — nur strukturell (tarifInvarianten.test.ts) gedeckt;
// ein fachlich falscher, aber monotoner Betrag passierte alle Tore. Diese Matrix
// FRIERT das Ist-Verhalten ein (verhaltensneutral, KEINE Engine-Änderung) und
// macht künftige unbeabsichtigte Betragsänderungen sichtbar. Korrekturen, die
// sie später aufdeckt, sind eigene gegatete Einheiten (O-3-Gate-Note). Eingaben
// fachlich plausibel, rein deterministisch; alle 37 Fälle throw-frei verifiziert.
const TARIF_KANTONE = ['ZH', 'BS', 'TI'] as const;

// prozesskosten: Kanton × Streitwert (klein/gross) + Kanten (Phase, Materie mit
// Kostenlos-Schwelle Art. 114 ZPO, nicht-vermögensrechtlich, Instanz, Verfahren).
for (const kanton of KANTONE) {
  f(`pk:entscheid:allg:12k:${kanton}`, () => berechneProzesskosten({ kanton, streitwertCHF: 12_000, phase: 'entscheid', materie: 'allgemein' }));
  f(`pk:entscheid:allg:250k:${kanton}`, () => berechneProzesskosten({ kanton, streitwertCHF: 250_000, phase: 'entscheid', materie: 'allgemein' }));
}
f('pk:entscheid:allg:1mio:ZH', () => berechneProzesskosten({ kanton: 'ZH', streitwertCHF: 1_000_000, phase: 'entscheid', materie: 'allgemein' }));
f('pk:schlichtung:allg:12k:ZH', () => berechneProzesskosten({ kanton: 'ZH', streitwertCHF: 12_000, phase: 'schlichtung', materie: 'allgemein' }));
f('pk:arbeit:25k:ZH', () => berechneProzesskosten({ kanton: 'ZH', streitwertCHF: 25_000, phase: 'entscheid', materie: 'arbeit' }));
f('pk:miete:25k:ZH', () => berechneProzesskosten({ kanton: 'ZH', streitwertCHF: 25_000, phase: 'entscheid', materie: 'miete_pacht' }));
f('pk:nichtvermoegen:ZH', () => berechneProzesskosten({ kanton: 'ZH', streitwertCHF: 30_000, phase: 'entscheid', materie: 'allgemein', nichtVermoegensrechtlich: true }));
f('pk:rechtsmittel:80k:BS', () => berechneProzesskosten({ kanton: 'BS', streitwertCHF: 80_000, phase: 'entscheid', materie: 'allgemein', instanz: 'rechtsmittel' }));
f('pk:bundesgericht:80k:ZH', () => berechneProzesskosten({ kanton: 'ZH', streitwertCHF: 80_000, phase: 'entscheid', materie: 'allgemein', instanz: 'bundesgericht' }));
f('pk:summarisch:40k:ZH', () => berechneProzesskosten({ kanton: 'ZH', streitwertCHF: 40_000, phase: 'entscheid', materie: 'allgemein', verfahren: 'summarisch' }));

// beurkundung: wertbasiert (Grundstückkauf klein/gross) × Kantons-Stichprobe +
// nicht-wertbasiert (Testament-Rahmen) + Gesellschaft (AG-Gründung) + Schuldbrief.
for (const kanton of TARIF_KANTONE) {
  f(`bk:grundstueckkauf:500k:${kanton}`, () => berechneBeurkundung({ geschaeftsart: 'grundstueckkauf', kanton, geschaeftswertCHF: 500_000 }));
  f(`bk:grundstueckkauf:1_5mio:${kanton}`, () => berechneBeurkundung({ geschaeftsart: 'grundstueckkauf', kanton, geschaeftswertCHF: 1_500_000 }));
}
f('bk:testament:ZH', () => berechneBeurkundung({ geschaeftsart: 'testament', kanton: 'ZH' }));
f('bk:ag_gruendung:BS', () => berechneBeurkundung({ geschaeftsart: 'ag_gruendung', kanton: 'BS', geschaeftswertCHF: 100_000 }));
f('bk:schuldbrief:TI', () => berechneBeurkundung({ geschaeftsart: 'schuldbrief', kanton: 'TI', geschaeftswertCHF: 400_000 }));

// grundbuchgebühren: Eigentumsübertragung (Kauf) × Kantons-Stichprobe + Kanten
// (Grundpfand, Dienstbarkeit mit Mindestgebühr, Erbgang).
for (const kanton of TARIF_KANTONE) {
  f(`gb:eigentum_kauf:500k:${kanton}`, () => berechneGrundbuchgebuehr({ eintragsart: 'eigentum_kauf', kanton, wertCHF: 500_000 }));
}
f('gb:eigentum_kauf:1_5mio:ZH', () => berechneGrundbuchgebuehr({ eintragsart: 'eigentum_kauf', kanton: 'ZH', wertCHF: 1_500_000 }));
f('gb:grundpfand:400k:BS', () => berechneGrundbuchgebuehr({ eintragsart: 'grundpfand', kanton: 'BS', wertCHF: 400_000 }));
f('gb:dienstbarkeit:50k:ZH', () => berechneGrundbuchgebuehr({ eintragsart: 'dienstbarkeit', kanton: 'ZH', wertCHF: 50_000 }));
f('gb:eigentum_erbgang:800k:TI', () => berechneGrundbuchgebuehr({ eintragsart: 'eigentum_erbgang', kanton: 'TI', wertCHF: 800_000 }));

// notariatGrundbuch: Erwerbs-Nebenkosten-Bündel × Kantons-Stichprobe + Kanten
// (mit Grundpfand, mit Handänderungssteuer, Voll-Kombination).
for (const kanton of TARIF_KANTONE) {
  f(`ng:kauf:800k:${kanton}`, () => berechneNotariatGrundbuch({ kanton, kaufpreisCHF: 800_000 }));
}
f('ng:kauf:800k:pfand:ZH', () => berechneNotariatGrundbuch({ kanton: 'ZH', kaufpreisCHF: 800_000, mitGrundpfand: true }));
f('ng:kauf:800k:steuer:BS', () => berechneNotariatGrundbuch({ kanton: 'BS', kaufpreisCHF: 800_000, mitHandaenderungssteuer: true }));
f('ng:kauf:2mio:voll:ZH', () => berechneNotariatGrundbuch({ kanton: 'ZH', kaufpreisCHF: 2_000_000, mitGrundpfand: true, pfandsummeCHF: 1_600_000, mitHandaenderungssteuer: true }));

// ── Vorlagen: assemble-Ergebnisse (Dokument + Protokoll) ────────────────────
f('vorl:testament', () => testamentZusammenstellen({
  ...TESTAMENT_DEFAULTS, vorname: 'Anna', nachname: 'Beispiel', geburtsdatum: '1960-04-12',
  heimatort: 'Basel BS', adresse: 'Musterweg 1, 4051 Basel',
  erben: [{ name: 'B', angaben: 'geb. 1990', quoteProzent: 60 }, { name: 'C', angaben: 'geb. 1992', quoteProzent: 40, ersatz: 'deren Nachkommen' }],
  vermaechtnisse: [{ empfaenger: 'Museum', gegenstand: 'CHF 5000' }],
  willensvollstrecker: 'Dr. X', ortErrichtung: 'Basel', datumErrichtung: '2026-06-15',
}));
f('vorl:pv', () => pvZusammenstellen({ ...PV_DEFAULTS, vorname: 'A', name: 'B', geburtsdatum: '1960-01-01', wohnort: 'Basel', ziel: 'palliativ', situationen: ['terminal'], organspende: 'ja' }));
f('vorl:va-eigen', () => vaZusammenstellen({ ...VA_DEFAULTS, volljaehrig: true, urteilsfaehigBestaetigt: true, keineUmfassendeBeistandschaft: true, vorname: 'A', nachname: 'B', geburtsdatum: '1960-01-01', heimatort: 'Basel', adresse: 'X 1', beauftragte: [{ name: 'C', angaben: 'geb. 1990', typ: 'natuerlich', bereiche: ['personensorge'] }], datum: '2026-06-15' }));
f('vorl:va-notar', () => vaZusammenstellen({ ...VA_DEFAULTS, formMode: 'oeffentlich_beurkundet', volljaehrig: true, urteilsfaehigBestaetigt: true, keineUmfassendeBeistandschaft: true, vorname: 'A', nachname: 'B', geburtsdatum: '1960-01-01', heimatort: 'Basel', adresse: 'X 1', beauftragte: [{ name: 'C', angaben: 'geb. 1990', typ: 'natuerlich', bereiche: ['vermoegenssorge'] }], datum: '2026-06-15' }));
// VA-Basis für Varianten-Fälle (W2·8 VA-Ausbau: Verhalten VOR dem Umbau festhalten, §6)
const vaBasis = {
  ...VA_DEFAULTS, volljaehrig: true, urteilsfaehigBestaetigt: true, keineUmfassendeBeistandschaft: true,
  vorname: 'A', nachname: 'B', geburtsdatum: '1960-01-01', heimatort: 'Basel', adresse: 'X 1',
  beauftragte: [{ name: 'C', angaben: 'geb. 1990', typ: 'natuerlich' as const, bereiche: ['personensorge', 'vermoegenssorge', 'rechtsverkehr'] as ('personensorge' | 'vermoegenssorge' | 'rechtsverkehr')[] }],
  module: { personensorge: ['wohnsituation', 'medizin'], vermoegenssorge: ['verwaltung', 'liegenschaften'], rechtsverkehr: ['behoerden'] },
  datum: '2026-06-15',
};
f('vorl:va-voll', () => vaZusammenstellen({
  ...vaBasis,
  beauftragte: [...vaBasis.beauftragte, { name: 'Treuhand AG', angaben: 'Basel', typ: 'juristisch' as const, bereiche: ['vermoegenssorge'] as ('personensorge' | 'vermoegenssorge' | 'rechtsverkehr')[] }],
  ersatzpersonen: [{ name: 'D', angaben: 'geb. 1992', typ: 'natuerlich' as const }, { name: 'E', angaben: '', typ: 'natuerlich' as const }],
  schenkungenErlaubt: true, besondereGeschaefte: true, weisungen: 'Wohnung möglichst lange behalten.',
  entschaedigung: 'pauschale' as const, entschaedigungBetrag: 5000,
  pvVorhanden: true, pvHinterlegung: 'Hausarztpraxis Dr. X', ort: 'Basel',
}));
f('vorl:va-entsch-aufwand', () => vaZusammenstellen({ ...vaBasis, entschaedigung: 'nach_aufwand' as const, entschaedigungBetrag: 120 }));
f('vorl:va-ohne-ersetzt', () => vaZusammenstellen({ ...vaBasis, ersetztFruehere: false }));
f('vorl:va-gates-basis', () => pruefeVaGates(vaBasis));
f('vorl:va-gates-jp-personensorge', () => pruefeVaGates({
  ...vaBasis,
  beauftragte: [{ name: 'Treuhand AG', angaben: 'Basel', typ: 'juristisch' as const, bereiche: ['personensorge'] as ('personensorge' | 'vermoegenssorge' | 'rechtsverkehr')[] }],
  module: { personensorge: ['wohnsituation'], vermoegenssorge: [], rechtsverkehr: [] },
}));
// W2·8/B5: Golden-Lücke aus B3/B4 geschlossen — die Datums-Warnung der
// eigenhändigen Form (Art. 361 Abs. 2 ZGB) war in keinem Golden-Fall erfasst.
f('vorl:va-gates-ohne-datum', () => pruefeVaGates({ ...vaBasis, datum: '' }));
// W2·8/V9.5 (Gegenprüfung Runde 3, Befund N4): Der «Datum: ________»-Zweig der
// Schlusszeile (B8) war im Byte-Orakel nicht erfasst — nur im Unit-Test. Fehlen
// Ort UND Datum, steht der beschriftete Ausfüll-Strich über der
// Unterschriftslinie; das Datum ist nach Art. 361 Abs. 2 ZGB
// Gültigkeitserfordernis der eigenhändigen Errichtung.
f('vorl:va-ohne-ort-ohne-datum', () => vaZusammenstellen({ ...vaBasis, ort: undefined, datum: '' }));
f('vorl:sg', () => sgZusammenstellen({
  ...SG_DEFAULTS, streitgegenstandTyp: 'geldforderung', baselForumBestaetigt: true,
  klaeger: [{ ...SG_PERSON_NATUERLICH, vorname: 'A', name: 'B', strasse: 'S 1', plz: '4051', ort: 'Basel' }],
  beklagte: [{ typ: 'juristisch', firma: 'X GmbH', sitzStrasse: 'S 2', sitzPlz: '4051', sitzOrt: 'Basel' }],
  geld: { betrag: '12000', zins: { satz: '5', abDatum: '2026-01-01' } },
  streitgegenstand: 'Forderung Nr. 2025-117', beilagen: [{ bezeichnung: 'Rechnung' }], datum: '2026-06-15', ort: 'Basel',
}));
const avBasis = {
  ...AV_DEFAULTS, arbeitgeberName: 'AG', arbeitgeberAdresse: 'X 1', arbeitnehmerVorname: 'A', arbeitnehmerName: 'B',
  arbeitnehmerAdresse: 'Y 2', funktion: 'F', arbeitsort: 'Basel', arbeitsortKanton: 'BS', beginn: '2026-08-01',
  lohnBetrag: '6500', ort: 'Basel', datum: '2026-06-15',
} as const;
// Klage ordentliches Verfahren (NEU 10.6.2026, Auftrag David): repräsentativer
// ZH-Fall mit Pflicht-Begründung und dedupliziertem Beweismittelverzeichnis.
f('vorl:ko', () => koZusammenstellen({
  ...KO_DEFAULTS, gerichtsKanton: 'ZH',
  gerichtAufgeloest: { zeilen: ['Bezirksgericht Zürich', 'Postfach', '8036 Zürich'] },
  streitwert: '80000',
  klaeger: { typ: 'natuerlich', vorname: 'A', name: 'B', strasse: 'S 1', plz: '8001', ort: 'Zürich' },
  beklagte: { typ: 'juristisch', firma: 'X AG', sitzStrasse: 'S 2', sitzPlz: '8002', sitzOrt: 'Zürich' },
  streitgegenstand: 'Forderung aus Werkvertrag',
  zins: { satz: '5', abDatum: '2026-04-15' },
  tatsachen: [
    { text: 'Die Parteien schlossen am 1.2.2026 einen Werkvertrag.', beweise: [{ bezeichnung: 'Werkvertrag (Urkunde)' }] },
    { text: 'Die Rechnung blieb trotz Mahnung unbezahlt.', beweise: [{ bezeichnung: 'Mahnung vom 20.4.2026 (Urkunde)' }, { bezeichnung: 'Werkvertrag (Urkunde)' }] },
  ],
  rechtlicheBegruendung: [{ text: 'Der Anspruch stützt sich auf Art. 363 OR.' }],
  klagebewilligungVorhanden: true, klagebewilligungDatum: '2026-05-04',
  vollmachtBeilage: true, ort: 'Zürich', datum: '2026-06-15',
}));

f('vorl:av', () => avZusammenstellen({ ...avBasis }));
f('vorl:av-gates', () => pruefeAvGates({ ...avBasis, lohnfortzahlung: 'ktg', ktgWartefristTage: 60, ktgWartefristLohnProzent: 0 }));
f('vorl:av-kv', () => avZusammenstellen({ ...avBasis, konkurrenzverbot: true, kvEinblickBestaetigt: true, kvGegenstand: 'Treuhand', kvOrt: 'BS', kvDauerMonate: 12, kvKonventionalstrafeCHF: '20000', kvKarenz: true, kvKarenzCHFProMonat: '2000', kvKarenzVerzichtsrecht: true }));
// Detailgrad-Vollausbau Einzelarbeitsvertrag (FAHRPLAN-VERTRAGS-VARIANTEN P1a):
// standard = byte-identischer Dokumenttext (vorl:av oben; nur Protokoll-
// Begründungen der gegateten Klauseln A10/A11 deklariert geändert). einfach
// blendet Treuepflicht/Datenschutz aus; experte ergänzt Nebenbeschäftigung
// (321a III), Erfindungen/Arbeitsergebnisse (332 OR/17 URG), Recht &
// Gerichtsstand (34 f. ZPO).
f('vorl:av-einfach', () => avZusammenstellen({ ...avBasis, detailgrad: 'einfach' }));
f('vorl:av-experte', () => avZusammenstellen({ ...avBasis, detailgrad: 'experte' }));
// Untertyp Kader/Manager (P1b): gleiches 319-ff-Regime, additiv — leitende
// Stellung (3 lit. d ArG), Bonus (322d), Freistellung (324 II, nur experte).
// einzel bleibt byte-identisch (vorl:av oben).
f('vorl:av-kader', () => avZusammenstellen({ ...avBasis, untertyp: 'kader' }));
f('vorl:av-kader-experte', () => avZusammenstellen({ ...avBasis, untertyp: 'kader', detailgrad: 'experte' }));
// Lehrvertrag (Art. 344–346a OR; P1c) – Sonderregime, eigenes Schema.
// Typ-Annotation statt `as const` (QS-TYP-LUECKE 15.8.2026, Muster von `maBasis`
// unten): `as const` machte `lohnLehrjahre` readonly und damit unzuweisbar an
// `LvAntworten` — die Fixture lief nur deshalb durch, weil scripts/ ungeprüft war.
// Die WERTE sind unverändert; der Golden-Byte-Vergleich beweist es.
const lvBasis: LvAntworten = {
  ...LV_DEFAULTS, betriebName: 'Muster AG', betriebAdresse: 'X 1, 4051 Basel',
  lernendeVorname: 'Lea', lernendeName: 'Beispiel', lernendeAdresse: 'Y 2, 4052 Basel',
  lernendeGeburtsdatum: '2009-05-01', gesetzlicheVertretung: 'Maria Beispiel',
  beruf: 'Kauffrau', beginn: '2026-08-01', dauerJahre: 3,
  lohnLehrjahre: [{ jahr: 1, chf: '700' }, { jahr: 2, chf: '900' }, { jahr: 3, chf: '1200' }],
  ort: 'Basel', datum: '2026-06-15',
};
f('vorl:lv-standard', () => lvZusammenstellen(lvBasis));
f('vorl:lv-experte', () => lvZusammenstellen({ ...lvBasis, detailgrad: 'experte', berufswerkzeuge: true, unterkunftVerpflegung: true, versicherungspraemien: true }));
f('vorl:lv-volljaehrig-einfach', () => lvZusammenstellen({ ...lvBasis, detailgrad: 'einfach', lernendeGeburtsdatum: '2000-01-01', gesetzlicheVertretung: '' }));
f('vorl:lv-blanko', () => lvZusammenstellen({ ...LV_DEFAULTS }));
f('vorl:lv-gates', () => pruefeLvGates({ ...lvBasis, probezeitMonate: 4, ferienWochen: 4 }));
// Handelsreisendenvertrag (Art. 347–350a OR; P1d) – Sonderregime, eigenes Schema.
const hrBasis = {
  ...HR_DEFAULTS, arbeitgeberName: 'Muster AG', arbeitgeberAdresse: 'X 1, 8000 Zürich',
  reisenderVorname: 'Rolf', reisenderName: 'Beispiel', reisenderAdresse: 'Y 2, 3000 Bern',
  gegenstand: 'Werkzeugmaschinen', reisegebiet: 'Kantone BE und SO',
  beginn: '2026-08-01', fixCHF: '5000', provisionProzent: '3',
  ort: 'Zürich', datum: '2026-06-15',
} as const;
f('vorl:hr-fixprovision', () => hrZusammenstellen(hrBasis));
f('vorl:hr-provision-experte', () => hrZusammenstellen({ ...hrBasis, detailgrad: 'experte', lohnmodell: 'provision', vollmacht: 'abschluss', auslagen: 'pauschal', auslagenPauschaleCHF: '600', saisonschwankung: true, delkredere: true, delkredereProvisionProzent: '2', ausschliesslich: false }));
f('vorl:hr-fix-einfach', () => hrZusammenstellen({ ...hrBasis, detailgrad: 'einfach', lohnmodell: 'fix' }));
f('vorl:hr-blanko', () => hrZusammenstellen({ ...HR_DEFAULTS }));
f('vorl:hr-gates', () => pruefeHrGates({ ...hrBasis, delkredere: true, lohnmodell: 'provision', vollmacht: 'abschluss', saisonschwankung: true }));
// Heimarbeitsvertrag (Art. 351–354 OR; P1e) – Sonderregime, eigenes Schema.
const haBasis = {
  ...HA_DEFAULTS, arbeitgeberName: 'Muster AG', arbeitgeberAdresse: 'X 1, 8000 Zürich',
  heimarbeiterVorname: 'Heidi', heimarbeiterName: 'Beispiel', heimarbeiterAdresse: 'Y 2, 8400 Winterthur',
  arbeitsbeschrieb: 'Konfektionierung von Verpackungen', lohnAngabe: '4.50', lohnEinheit: 'pro Stück',
  ort: 'Zürich', datum: '2026-06-15',
} as const;
f('vorl:ha-ununterbrochen', () => haZusammenstellen(haBasis));
f('vorl:ha-stueck-experte', () => haZusammenstellen({ ...haBasis, detailgrad: 'experte', ununterbrochen: false, materialVomArbeitgeber: false, materialBeschafftHeimarbeiter: true, materialEntschaedigung: 'CHF 0.20 pro Stück', probearbeit: true }));
f('vorl:ha-einfach', () => haZusammenstellen({ ...haBasis, detailgrad: 'einfach' }));
f('vorl:ha-blanko', () => haZusammenstellen({ ...HA_DEFAULTS }));
f('vorl:ha-gates', () => pruefeHaGates({ ...haBasis, materialBeschafftHeimarbeiter: true, ununterbrochen: false }));
// Wie `lvBasis`: Annotation statt `as const` — `as const` machte `nkPositionen`
// readonly und damit unzuweisbar an `MvAntworten` (QS-TYP-LUECKE 15.8.2026).
const mvBasis: MvAntworten = {
  ...MV_DEFAULTS, vermieterName: 'V', vermieterAdresse: 'X 1', mieterName: 'M', mieterAdresse: 'Y 2',
  objektBeschrieb: '3.5-Zi', objektAdresse: 'Z 3', beginn: '2026-10-01', mietzinsNettoCHF: '2000',
  nebenkostenCHF: '250', nkPositionen: ['Heizung'], ort: 'Basel', datum: '2026-06-15',
};
f('vorl:mv', () => mvZusammenstellen({ ...mvBasis }));
f('vorl:mv-gates', () => pruefeMvGates({ ...mvBasis, kautionCHF: '6800' }));
f('vorl:mv-staffel', () => mvZusammenstellen({ ...mvBasis, mietzinsModell: 'staffel', mindestdauerJahre: 3, staffeln: [{ ab: '2027-10-01', erhoehungCHF: '50' }] }));
// Detailgrad Mietvertrag (FAHRPLAN-VERTRAGS-VARIANTEN P2): standard byte-gleich
// (vorl:mv; nur M06b-Begründung deklariert geändert). einfach blendet die
// deklaratorische Zahlungsverzugs-Klausel aus; experte ergänzt Mietzins-
// vorbehalt (18 VMWG) und Duldungspflicht (257h OR).
f('vorl:mv-einfach', () => mvZusammenstellen({ ...mvBasis, detailgrad: 'einfach' }));
f('vorl:mv-experte', () => mvZusammenstellen({ ...mvBasis, detailgrad: 'experte', mietzinsvorbehalt: true, vorbehaltProzent: '3', vorbehaltGrund: 'nicht ausgeschöpfte Kostenmiete' }));
// Mahnung & Inverzugsetzung (11.6.2026): beide Varianten + Verfalltag-/
// Vertragszins-/Mahngebühren-Weichen + Gates.
const maBasis: MaAntworten = {
  ...MA_DEFAULTS, absenderName: 'A', absenderAdresse: 'X 1', adressatName: 'B', adressatAdresse: 'Y 2',
  betrag: '1250', rechtsgrund: 'Rechnung Nr. 4711 vom 12. Mai 2026', faelligSeit: '2026-05-15',
  vertragBezeichnung: 'Werkvertrag vom 1. Februar 2026', leistungBeschrieb: 'Lieferung und Montage der Kücheneinrichtung',
  zahlungsverbindung: 'IBAN CH00 0000 0000 0000 0000 0',
  ort: 'Basel', datum: '2026-06-11',
};
f('vorl:ma-zahlung', () => maZusammenstellen({ ...maBasis }));
f('vorl:ma-verfalltag', () => maZusammenstellen({ ...maBasis, verfalltagVereinbart: true, verfalltag: '2026-05-31', zinsVertraglich: true, zinssatzProzent: '8' }));
f('vorl:ma-mahngebuehr', () => maZusammenstellen({ ...maBasis, mahngebuehrErfassen: true, mahngebuehr: '20', mahngebuehrVertraglich: true, betreibungAndrohen: false }));
f('vorl:ma-nachfrist', () => maZusammenstellen({ ...maBasis, variante: 'nachfrist' }));

// Rubrum (Gerichts-Baustein-Set, ROADMAP W2·7): Maximalkombi (alle optionalen
// Bausteine), BGer-Variante, Blanko + Gates. Reiner Nutzer-Eingabe-Builder;
// Norm-Anker Art. 238 ZPO / Art. 112 BGG live verifiziert 2026-07-05.
const ruBasis = {
  ...RUBRUM_DEFAULTS, gericht: 'Bezirksgericht Zürich', besetzung: 'Einzelgericht',
  verfahrenNr: 'CG26 12345', klaeger: 'A. Muster', beklagte: 'B. Beispiel AG',
  streitgegenstand: 'Forderung', ort: 'Zürich', datum: '2026-06-11',
};
f('vorl:rubrum', () => rubrumZusammenstellen({ ...ruBasis, klaegerVertretung: 'Rechtsanwältin X', beklagteVertretung: 'Rechtsanwalt Y' }));
f('vorl:rubrum-bger', () => rubrumZusammenstellen({ ...ruBasis, instanz: 'bger', gericht: 'Bundesgericht' }));
f('vorl:rubrum-blanko', () => rubrumZusammenstellen({ ...RUBRUM_DEFAULTS }));
f('vorl:rubrum-gates', () => pruefeRubrumGates(ruBasis));

// Amtlicher Gerichts-Zitierer (BGE/BGer): deterministischer Formatierer.
f('zitat:bge', () => formatiereGerichtszitat({ typ: 'bge', band: '140', teil: 'III', seite: '409', erwaegung: '4.3' }));
f('zitat:bge-ohne-erw', () => formatiereGerichtszitat({ typ: 'bge', band: '147', teil: 'III', seite: '419' }));
f('zitat:bger', () => formatiereGerichtszitat({ typ: 'bger', aktenzeichen: '5A_691/2023', datum: '2024-08-13', erwaegung: '2.1' }));
f('zitat:unzulaessig', () => formatiereGerichtszitat({ typ: 'bger', aktenzeichen: '5A-691-2023', datum: '2024-08-13' }));

// Verjährungsverzicht (Art. 141 OR; FAHRPLAN-VORLAGEN-AUSBAU V2, 12.6.2026)
const vvBasis = {
  ...VV_DEFAULTS, absenderName: 'S AG', absenderAdresse: 'X 1, 4051 Basel',
  adressatName: 'G GmbH', adressatAdresse: 'Y 2, 8000 Zürich',
  forderungBeschrieb: 'Werklohnforderung aus Werkvertrag vom 1. Februar 2026',
  verzichtBis: '2027-12-31', ort: 'Basel', datum: '2026-06-12',
};
f('vorl:vv-standard', () => vvZusammenstellen(vvBasis));
f('vorl:vv-betrag-ohne-vorbehalte', () => vvZusammenstellen({ ...vvBasis, betragErfassen: true, betrag: '25000', vorbehaltEingetreten: false, keineAnerkennung: false }));
f('vorl:vv-blanko', () => vvZusammenstellen({ ...VV_DEFAULTS }));
f('vorl:vv-gates-hoechstdauer', () => pruefeVvGates({ ...vvBasis, verzichtBis: '2036-06-13' }));

// Abtretungserklärung/Zession (Art. 164 ff. OR; FAHRPLAN-VORLAGEN-AUSBAU V2-Rest, 13.6.2026)
const faBasis = {
  ...FA_DEFAULTS, absenderName: 'Z AG', absenderAdresse: 'X 1, 4051 Basel',
  adressatName: 'E GmbH', adressatAdresse: 'Y 2, 8000 Zürich',
  schuldnerName: 'S Bau AG', schuldnerAdresse: 'Z 3, 3000 Bern',
  forderungBeschrieb: 'Kaufpreisforderung aus Kaufvertrag vom 1. Februar 2026',
  ort: 'Basel', datum: '2026-06-13',
};
f('vorl:fa-standard', () => faZusammenstellen(faBasis));
f('vorl:fa-betrag-minimal', () => faZusammenstellen({ ...faBasis, betragErfassen: true, betrag: '25000', zinsenAusdruecklich: false, urkundenUebergabe: false, anzeigeAnkuendigen: false, annahmeZeile: false }));
f('vorl:fa-blanko', () => faZusammenstellen({ ...FA_DEFAULTS }));
f('vorl:fa-gates', () => pruefeFaGates());

// Auftrag/Dienstleistungsvertrag (Art. 394 ff. OR; FAHRPLAN-VORLAGEN-AUSBAU V3, 13.6.2026)
const afBasis = {
  ...AF_DEFAULTS, auftraggeberName: 'Muster AG', auftraggeberAdresse: 'X 1, 8000 Zürich',
  beauftragteName: 'Treuhand Beispiel GmbH', beauftragteAdresse: 'Y 2, 8000 Zürich',
  gegenstand: 'Buchführung und Erstellung des Jahresabschlusses 2026',
  ort: 'Zürich', datum: '2026-06-13',
};
f('vorl:af-pauschal', () => afZusammenstellen({ ...afBasis, mandatstyp: 'treuhand', verguetung: 'pauschal', pauschalCHF: '5000', beginn: '2026-07-01' }));
f('vorl:af-aufwand-substitution', () => afZusammenstellen({ ...afBasis, mandatstyp: 'beratung', verguetung: 'aufwand', stundensatzCHF: '250', substitution: true, vollmachtErweitert: true, weisungsKlausel: false, auslagenErsatz: false }));
f('vorl:af-inkasso-unentgeltlich', () => afZusammenstellen({ ...afBasis, mandatstyp: 'inkasso', verguetung: 'unentgeltlich' }));
f('vorl:af-blanko', () => afZusammenstellen({ ...AF_DEFAULTS }));
f('vorl:af-gates', () => pruefeAfGates());
// Detailgrad-Pilot (FAHRPLAN-VERTRAGS-VARIANTEN P0): standard = unverändert
// (vorl:af-pauschal oben), einfach blendet Umfang/Vollmacht aus, experte
// ergänzt Geheimhaltung/Haftung/Gerichtsstand.
f('vorl:af-einfach', () => afZusammenstellen({ ...afBasis, detailgrad: 'einfach', mandatstyp: 'treuhand', verguetung: 'pauschal', pauschalCHF: '5000' }));
f('vorl:af-experte', () => afZusammenstellen({ ...afBasis, detailgrad: 'experte', mandatstyp: 'beratung', verguetung: 'aufwand', stundensatzCHF: '250' }));

// Werkvertrag (Art. 363 ff. OR; FAHRPLAN-VORLAGEN-AUSBAU V3, 13.6.2026)
const wvBasis = {
  ...WV_DEFAULTS, bestellerName: 'Muster AG', bestellerAdresse: 'X 1, 8000 Zürich',
  unternehmerName: 'Bau Beispiel GmbH', unternehmerAdresse: 'Y 2, 8000 Zürich',
  werkBeschrieb: 'Einbau einer Küche gemäss Plan vom 1. März 2026',
  ort: 'Zürich', datum: '2026-06-13',
};
f('vorl:wv-beweglich-pauschal', () => wvZusammenstellen({ ...wvBasis, werkArt: 'beweglich', preis: 'pauschal', pauschalCHF: '12000', ablieferung: '2026-09-01' }));
f('vorl:wv-unbeweglich-aufwand', () => wvZusammenstellen({ ...wvBasis, werkArt: 'unbeweglich', preis: 'aufwand', ansatzCHF: '120', ansatzEinheit: 'pro Stunde', anzahlung: true, anzahlungCHF: '4000', abnahmeProtokoll: true }));
f('vorl:wv-blanko', () => wvZusammenstellen({ ...WV_DEFAULTS }));
f('vorl:wv-gates-unbeweglich', () => pruefeWvGates({ ...WV_DEFAULTS, werkArt: 'unbeweglich' }));
f('vorl:wv-gates-beweglich', () => pruefeWvGates({ ...WV_DEFAULTS, werkArt: 'beweglich' }));
f('vorl:wv-einfach', () => wvZusammenstellen({ ...wvBasis, detailgrad: 'einfach', werkArt: 'beweglich', preis: 'pauschal', pauschalCHF: '12000' }));
f('vorl:wv-experte', () => wvZusammenstellen({ ...wvBasis, detailgrad: 'experte', werkArt: 'unbeweglich', preis: 'pauschal', pauschalCHF: '12000' }));

// Geheimhaltungsvereinbarung/NDA (Art. 19/160 ff. OR; FAHRPLAN-VORLAGEN-AUSBAU V3, 13.6.2026)
const ndaBasis = {
  ...NDA_DEFAULTS, parteiAName: 'Muster AG', parteiAAdresse: 'X 1, 8000 Zürich',
  parteiBName: 'Beispiel GmbH', parteiBAdresse: 'Y 2, 8000 Zürich',
  zweck: 'Prüfung einer möglichen Zusammenarbeit im Bereich Softwareentwicklung',
  ort: 'Zürich', datum: '2026-06-13',
};
f('vorl:nda-gegenseitig-strafe', () => ndaZusammenstellen({ ...ndaBasis, gegenseitig: true, infoBeschrieb: 'Quellcode, Kundenlisten', konventionalstrafe: true, strafeCHF: '20000' }));
f('vorl:nda-einseitig-minimal', () => ndaZusammenstellen({ ...ndaBasis, gegenseitig: false, dauerErfassen: false, rueckgabe: false, konventionalstrafe: false }));
f('vorl:nda-blanko', () => ndaZusammenstellen({ ...NDA_DEFAULTS }));
f('vorl:nda-gates-strafe', () => pruefeNdaGates({ ...ndaBasis, konventionalstrafe: true, strafeCHF: '20000' }));
f('vorl:nda-gates-einseitig', () => pruefeNdaGates({ ...ndaBasis, gegenseitig: false }));
f('vorl:nda-einfach', () => ndaZusammenstellen({ ...ndaBasis, detailgrad: 'einfach' }));
f('vorl:nda-experte', () => ndaZusammenstellen({ ...ndaBasis, detailgrad: 'experte', konventionalstrafe: true, strafeCHF: '20000' }));

// Konkubinatsvertrag (Art. 19 OR / Art. 646 ff. ZGB; FAHRPLAN-VORLAGEN-AUSBAU V3, 13.6.2026)
const kkBasis = {
  ...KK_DEFAULTS, partner1Name: 'Anna Muster', partner1Adresse: 'X 1, 8000 Zürich',
  partner2Name: 'Beat Beispiel', partner2Adresse: 'X 1, 8000 Zürich',
  ort: 'Zürich', datum: '2026-06-13',
};
f('vorl:kk-haelftig-voll', () => kkZusammenstellen({ ...kkBasis, kostenschluessel: 'haelftig', wohnenAufnehmen: true, wohnBeschrieb: 'gemeinsame Mietwohnung, Hauptmieterin ist Partnerin 1', einfacheGesellschaft: true, einfacheGesellschaftZweck: 'Erwerb und Umbau der Ferienliegenschaft in Flims', kinderHinweis: true, vorsorgeHinweis: true }));
f('vorl:kk-fix-minimal', () => kkZusammenstellen({ ...kkBasis, kostenschluessel: 'fix', fix1CHF: '1500', fix2CHF: '1200', wohnenAufnehmen: false, gemeinsamesKonto: false, inventarAufnehmen: false, einfacheGesellschaft: false, kinderHinweis: false, vorsorgeHinweis: false }));
f('vorl:kk-blanko', () => kkZusammenstellen({ ...KK_DEFAULTS }));
f('vorl:kk-gates-kinder', () => pruefeKkGates({ ...kkBasis, kinderHinweis: true }));
f('vorl:kk-experte', () => kkZusammenstellen({ ...kkBasis, detailgrad: 'experte' }));

// Verwaltungs-Stillstand (Art. 22a VwVG) + BGG-Stillstand (Art. 46 BGG) im
// Fristenrechner (Auftrag David 13.6.2026). Tagesfristen ruhen über die
// Sommer-/Weihnachts-Periode; Monatsfristen stehen NICHT still (Geltungsbereich
// «nach Tagen bestimmt»).
f('frist:vwvg-tage30-sommer', () => berechneBggVwvgFrist({ regime: 'vwvg', ereignis: '2026-07-10', einheit: 'tage', laenge: 30, kanton: 'ZH' }));
f('frist:vwvg-monat1-keinstillstand', () => berechneBggVwvgFrist({ regime: 'vwvg', ereignis: '2026-07-10', einheit: 'monate', laenge: 1, kanton: 'ZH' }));
f('frist:vwvg-tage10-ausserhalb', () => berechneBggVwvgFrist({ regime: 'vwvg', ereignis: '2026-03-02', einheit: 'tage', laenge: 10, kanton: 'BE' }));
f('frist:bgg-tage10-weihnacht', () => berechneBggVwvgFrist({ regime: 'bgg', ereignis: '2026-12-15', einheit: 'tage', laenge: 10, kanton: 'ZH' }));
f('frist:bgg-tage30-ostern', () => berechneBggVwvgFrist({ regime: 'bgg', ereignis: '2026-03-25', einheit: 'tage', laenge: 30, kanton: 'TI' }));
f('frist:bgg-jahr1-keinstillstand', () => berechneBggVwvgFrist({ regime: 'bgg', ereignis: '2026-07-20', einheit: 'jahre', laenge: 1, kanton: 'GE' }));

// Fristerstreckungsgesuch (Art. 144 ZPO; FAHRPLAN-VORLAGEN-AUSBAU V2-Rest, 13.6.2026)
const feBasis = {
  ...FE_DEFAULTS, absenderName: 'P AG', absenderAdresse: 'X 1, 4051 Basel',
  adressatName: 'Zivilgericht Basel-Stadt', adressatAdresse: 'Bäumleingasse 5, 4051 Basel',
  verfahrenBeschrieb: 'Muster AG gegen Beispiel GmbH betreffend Forderung', verfahrenNr: 'ZG.2026.123',
  fristBeschrieb: 'Frist zur Erstattung der Klageantwort',
  fristEnde: '2026-07-15', erstreckungBis: '2026-08-14',
  begruendung: 'Die Akten umfassen über 800 Seiten; die unterzeichnete Vertretung ist vom 1. bis 12. Juli 2026 landesabwesend.',
  ort: 'Basel', datum: '2026-06-13',
};
f('vorl:fe-standard', () => feZusammenstellen(feBasis));
f('vorl:fe-platzhalter-verfuegung', () => feZusammenstellen({ ...feBasis, begruendungPlatzhalter: true, begruendung: '', verfuegungVomErfassen: true, verfuegungVom: '2026-06-02', ersteErstreckung: false }));
f('vorl:fe-blanko', () => feZusammenstellen({ ...FE_DEFAULTS }));
f('vorl:fe-gates-gesetzlich', () => pruefeFeGates({ ...feBasis, fristTyp: 'gesetzlich' }));
f('vorl:fe-gates-zu-spaet', () => pruefeFeGates({ ...feBasis, datum: '2026-07-16', erstreckungBis: '2026-07-10' }));
f('vorl:fe-gates-letzter-tag', () => pruefeFeGates({ ...feBasis, datum: '2026-07-15', fristTyp: 'unsicher' }));

// Nichtbekanntgabe Betreibung (Art. 8a III lit. d SchKG, Fassung 1.1.2026; V2-Rest, 13.6.2026)
const nbBasis = {
  ...NB_DEFAULTS, absenderName: 'S Muster', absenderAdresse: 'X 1, 4051 Basel',
  adressatName: 'Betreibungsamt Basel-Stadt', adressatAdresse: 'Bäumleingasse 1, 4051 Basel',
  betreibungNr: '2026/12345', glaeubigerName: 'G Inkasso AG',
  zustellungZb: '2026-02-15', ort: 'Basel', datum: '2026-06-13',
};
f('vorl:nb-standard', () => nbZusammenstellen(nbBasis));
f('vorl:nb-minimal', () => nbZusammenstellen({ ...nbBasis, glaeubigerName: '', keinVerfahrenBekannt: false, beilageZb: false }));
f('vorl:nb-blanko', () => nbZusammenstellen({ ...NB_DEFAULTS }));
f('vorl:nb-gates-zu-frueh', () => pruefeNbGates({ ...nbBasis, zustellungZb: '2026-04-01', datum: '2026-06-13' }));
f('vorl:nb-gates-ohne-rv', () => pruefeNbGates({ ...nbBasis, rechtsvorschlag: false }));
// Konservative ZPO-Rechnung (Review-Befund 13.6.2026): Lauf ab Folgetag der
// Zustellung (Art. 142 Abs. 1 ZPO), Ende am gleichbezeichneten Tag (Abs. 2),
// frühester Gesuchstag = Folgetag. Handgerechnet: Zustellung 15.02. → Lauf ab
// 16.02. → Ende 16.05. → 17.05.; Klemmung: Zustellung 29.11. → Lauf ab 30.11.
// → 28.02. (kein 30.02.) → 01.03.
f('vorl:nb-fruehester-klemmung', () => ({
  normal: nbFruehesterGesuchstag('2026-02-15'),
  klemmung: nbFruehesterGesuchstag('2026-11-29'),
}));

// Scheidungsklage (Art. 290 ZPO; Musterklagen-Auftrag David 12.6.2026)
const skBasis = {
  ...SK_DEFAULTS, gerichtsKanton: 'BS' as const,
  klaeger: { typ: 'natuerlich' as const, vorname: 'Anna', name: 'Muster', firma: '', strasse: 'A-Gasse 1', plz: '4051', ort: 'Basel' },
  beklagte: { typ: 'natuerlich' as const, vorname: 'Beat', name: 'Muster', firma: '', strasse: 'B-Weg 2', plz: '4052', ort: 'Basel' },
  grund: '114' as const, trennungSeit: '2024-03-01',
  ort: 'Basel', datum: '2026-06-12',
};
f('vorl:sk-standard', () => skZusammenstellen(skBasis));
f('vorl:sk-kinder-115', () => skZusammenstellen({ ...skBasis, grund: '115' as const, trennungSeit: '', kinderErfassen: true, kinder: [{ vorname: 'Carla', geburtsdatum: '2019-05-04' }], obhut: 'alternierend' as const, unterhaltEhegatte: 'beziffert' as const, unterhaltBetrag: '2500' }));
f('vorl:sk-blanko', () => skZusammenstellen({ ...SK_DEFAULTS }));
f('vorl:sk-warnung-zweijahre', () => skWarnungen({ ...skBasis, trennungSeit: '2025-01-01' }));

// Gemeinsames Scheidungsbegehren (Art. 285/286 ZPO; Musterklagen 12.6.2026)
const sbBasis = {
  ...SB_DEFAULTS, gerichtsKanton: 'BS' as const,
  ehegatte1: { typ: 'natuerlich' as const, vorname: 'Anna', name: 'Muster', firma: '', strasse: 'A-Gasse 1', plz: '4051', ort: 'Basel' },
  ehegatte2: { typ: 'natuerlich' as const, vorname: 'Beat', name: 'Muster', firma: '', strasse: 'A-Gasse 1', plz: '4051', ort: 'Basel' },
  vereinbarungDatum: '2026-05-20', ort: 'Basel', datum: '2026-06-12',
};
f('vorl:sb-voll', () => sbZusammenstellen(sbBasis));
f('vorl:sb-teil-kinder', () => sbZusammenstellen({ ...sbBasis, einigung: 'teil' as const, streitigePunkte: ['nachehelicher Unterhalt'], antraegeEhegatte1: ['Es sei kein nachehelicher Unterhalt zuzusprechen.'], kinderErfassen: true, kinder: [{ vorname: 'Carla', geburtsdatum: '2019-05-04' }] }));
f('vorl:sb-blanko', () => sbZusammenstellen({ ...SB_DEFAULTS }));

// Eheschutzgesuch (Art. 175 ff. ZGB; Musterklagen 12.6.2026)
const egBasis = {
  ...EG_DEFAULTS, gerichtsKanton: 'BS' as const,
  gesuchsteller: { typ: 'natuerlich' as const, vorname: 'Anna', name: 'Muster', firma: '', strasse: 'A-Gasse 1', plz: '4051', ort: 'Basel' },
  gesuchsgegner: { typ: 'natuerlich' as const, vorname: 'Beat', name: 'Muster', firma: '', strasse: 'A-Gasse 1', plz: '4051', ort: 'Basel' },
  getrenntSeit: '2026-04-01', ort: 'Basel', datum: '2026-06-12',
};
f('vorl:eg-standard', () => egZusammenstellen(egBasis));
f('vorl:eg-vollkatalog', () => egZusammenstellen({ ...egBasis, kinderErfassen: true, kinder: [{ vorname: 'Carla', geburtsdatum: '2019-05-04' }], obhut: 'gesuchsteller' as const, kindesunterhalt: 'beziffert' as const, barunterhaltBetrag: '1200', betreuungsunterhaltBetrag: '800', ehegattenunterhalt: 'beziffert' as const, ehegattenBetrag: '2500', rueckwirkung: true, gueterTrennung: true, schuldneranweisung: true, arbeitgeberName: 'Muster AG, Zürich', verfuegungsbeschraenkung: true, vermoegenswert: 'Konto IBAN CH00 0000 0000 0000 0000 0 bei der Bank X' }));
f('vorl:eg-blanko', () => egZusammenstellen({ ...EG_DEFAULTS }));
f('vorl:ma-gates', () => pruefeMaGates({ ...maBasis, mahngebuehrErfassen: true, mahngebuehr: '20' }));
f('vorl:ma-gates-nachfrist', () => pruefeMaGates({ ...maBasis, variante: 'nachfrist' }));

// ── AG-Gründungsmappe (Perfektions-Runde 12, 7.6.2026): repräsentative
// Konstellationen über ALLE Schemas/Weichen — schützt jedes künftige
// Refactoring byte-genau (§6). Erfasst werden Gates + alle Dokumente
// (Titel, ausgabeArt, Absätze).
const agGolden = (id: string, antworten: AgDokAntworten) => f(`ag:${id}`, () => {
  const m = agDokumentmappe(antworten);
  return {
    blocker: m.gates.blocker,
    warnungen: m.gates.warnungen,
    dokumente: m.dokumente.map((d) => ({
      id: d.id, titel: d.titel, ausgabeArt: d.ergebnis.dokument.ausgabeArt,
      absaetze: d.ergebnis.dokument.absaetze,
    })),
  };
});

const AG_BASIS: AgDokAntworten = {
  einlageArt: 'bar', besondereVorteile: false, optingOut: true,
  eigeneBueros: true, immobilienHauptzweck: false, inhaberaktien: false,
  fremdwaehrung: false, bankInUrkundeGenannt: true, chWohnsitzVertretung: true,
  leistungenChf: undefined,
  ...AG_DOK_DEFAULTS,
  firma: 'Golden Muster AG', sitz: 'Zürich', kanton: 'ZH', zweck: 'Beteiligungen',
  gruender: [{ name: 'Anna Muster', angaben: 'von Basel, in Zürich', anzahl: '100', liberierung: '' }],
  verwaltungsraete: [{ name: 'Anna Muster', herkunft: 'Basel', wohnort: 'Zürich', adresse: 'Weg 1, 8000 Zürich', praesident: true, zeichnungsArt: 'einzelunterschrift' }],
  bankName: 'Zürcher Kantonalbank', bankOrt: 'Zürich',
  rechtsdomizilAdresse: 'Weg 1, 8000 Zürich',
  ort: 'Zürich', datum: '2026-06-15',
};

agGolden('bar-voll-singular', AG_BASIS);
agGolden('bar-teil-individuell-lang', {
  ...AG_BASIS,
  statutenUmfang: 'lang', vinkulierung: true, virtuelleGv: true,
  aktienkapitalChf: "200'000", anzahlAktien: '200',
  gruender: [
    { name: 'Anna Muster', angaben: 'von Basel, in Zürich', anzahl: '120', liberierung: '50' },
    { name: 'Beat Beispiel', angaben: 'von Bern, in Bern', anzahl: '80', liberierung: '' },
  ],
  verwaltungsraete: [
    { name: 'Anna Muster', herkunft: 'Basel', wohnort: 'Zürich', adresse: 'W 1', praesident: true, zeichnungsArt: 'einzelunterschrift' },
    { name: 'Beat Beispiel', herkunft: 'Bern', wohnort: 'Bern', adresse: 'W 2', praesident: false, zeichnungsArt: 'ohne' },
  ],
  sitzungBeginn: '11.00', sitzungEnde: '11.30',
});
agGolden('gemischt-qualifiziert', {
  ...AG_BASIS,
  einlageArt: 'gemischt', besondereVorteile: true, optingOut: false, eigeneBueros: false,
  immobilienHauptzweck: true, lexKollerGrundstueckErwerb: true,
  aktienkapitalChf: "400'000", anzahlAktien: '400',
  gruender: [
    { name: 'Anna Muster', angaben: 'von Basel, in Zürich', anzahl: '300', liberierung: '' },
    { name: 'Beat Beispiel', angaben: 'von Bern, in Bern', anzahl: '100', liberierung: '' },
  ],
  verwaltungsraete: [
    { name: 'Anna Muster', herkunft: 'Basel', wohnort: 'Zürich', adresse: 'W 1', praesident: true, zeichnungsArt: 'einzelunterschrift' },
    { name: 'Beat Beispiel', herkunft: 'Bern', wohnort: 'Bern', adresse: 'W 2', praesident: false, zeichnungsArt: 'kollektivzuzweien' },
  ],
  domizilhalterName: 'Treuhand Muster AG', domizilhalterAdresse: 'Bahnhofstrasse 10, 8001 Zürich',
  revisionsstelleName: 'Revisia AG', revisionsstelleSitz: 'Zürich', revisorName: 'Revisia AG',
  sacheinlagen: [{
    typ: 'geschaeft', bezeichnung: 'Werkbau Muster', belegDatum: '2025-12-31', wertChf: "110'000",
    grundstueck: true, einlegerName: 'Anna Muster', aktienAnzahl: '100', gutschriftChf: "10'000",
    zustand: 'Liegenschaft zum Fortführungswert; Maschinenpark gemäss Anlagespiegel.',
    imHrEingetragen: true, cheNr: 'CHE-111.222.333', aktivenChf: "260'000", passivenChf: "150'000",
    rueckwirkungDatum: '2026-01-01',
  }],
  verrechnungen: [{ glaeubigerName: 'Beat Beispiel', forderungChf: "50'000", aktienAnzahl: '50', begruendungTxt: 'Darlehen vom 01.02.2025, valutiert und fällig.' }],
  vorteile: [{ beguenstigter: 'Anna Muster', inhalt: 'Vorkaufsrecht an der Werkhalle zum Verkehrswert', wertChf: "5'000", begruendungTxt: 'Abgeltung der Aufbauarbeit.' }],
});
agGolden('fw-agio', {
  ...AG_BASIS,
  fremdwaehrung: true, waehrung: 'EUR', kursChf: '0.93', kursQuelle: 'Zürcher Kantonalbank',
  aktienkapitalChf: "120'000", anzahlAktien: '120', ausgabebetragChf: "1'200",
  gruender: [{ name: 'Anna Muster', angaben: 'von Basel, in Zürich', anzahl: '120', liberierung: '' }],
});
// Stufe 2 (Perfektion P1–P4, 7.6.2026): neue Konstellationen einfrieren.
agGolden('inhaber-bucheffekten', {
  ...AG_BASIS,
  inhaberaktien: true, verwahrungsstelle: 'SIX SIS AG, Olten',
});
agGolden('gemischt-teil-agio', {
  ...AG_BASIS,
  einlageArt: 'gemischt',
  aktienkapitalChf: "200'000", anzahlAktien: '200',
  liberierungProzent: '50', ausgabebetragChf: "1'200",
  gruender: [{ name: 'Anna Muster', angaben: 'von Basel, in Zürich', anzahl: '200', liberierung: '' }],
  sacheinlagen: [{
    typ: 'sachgesamtheit', bezeichnung: 'eine Werkstatteinrichtung', belegDatum: '2026-06-01',
    wertChf: "120'000", grundstueck: false, einlegerName: 'Anna Muster', aktienAnzahl: '100',
    gutschriftChf: '', zustand: 'gebraucht, betriebsbereit', imHrEingetragen: false, cheNr: '',
    aktivenChf: '', passivenChf: '', rueckwirkungDatum: '',
  }],
  revisorName: 'Revisia AG',
});
agGolden('zusatzklauseln', {
  ...AG_BASIS,
  optingOut: false, revisionsstelleName: 'Revisia AG', revisionsstelleSitz: 'Zürich',
  schiedsklausel: true, schiedsOrt: 'Zürich',
  kapitalband: true, kbRichtung: 'beide', kbUntergrenze: "50'000", kbObergrenze: "150'000", kbEndeDatum: '2031-06-01',
  bedingtesKapital: true, bkBetrag: "50'000", bkKreis: 'den Arbeitnehmerinnen und Arbeitnehmern der Gesellschaft',
  gjErstesEnde: '31. Dezember 2026',
});
agGolden('urkunden-optionen-nachtrag', {
  ...AG_BASIS,
  konstituierungInUrkunde: true, domizilNurAnmeldung: true,
  verwaltungsraete: [{ ...AG_BASIS.verwaltungsraete[0], annahmeInUrkunde: true }],
  nachtragsbevollmaechtigter: 'Max Muster, 01.01.1990, von Chur, Weg 1, 7000 Chur',
  nachtragAktiv: true, nachtragGruendungsdatum: '2026-06-01',
  nachtragStatutenArtikel: '3', nachtragStatutenAbsatz: '1', nachtragStatutenText: 'Neuer Wortlaut.',
});

// ── Begründungs-Absatz (FAHRPLAN-BEGRUENDUNGS-ABSATZ B0-2) ──────────────────
// Erst-Baseline (kollisionsfreier Präfix `absatz:`) der ECHTEN
// begruendungsAbsatz()-Ausgabe — eingefroren VOR jedem Generator-Umbau (Phase 1+),
// damit dieser §6-verhaltensneutral bewiesen werden kann. Nur Engines, deren Form
// das ROHE Engine-Ergebnis an begruendungsAbsatz() gibt; die `zusatz`-Forms
// werden mit ihrem byte-exakten Inline-Ausdruck reproduziert. Bewusst NICHT hier
// (B0-2-Rest, B0-1-Bugcheck 28.6.): `allg` UND `zust`/`rm` (die Form wickelt das
// Engine-Ergebnis UI-seitig in ein Berechnungsergebnis — der rohe Engine-Output
// hat kein `.ergebnis`-Feld; faithful erst über den Phase-2-`BegruendungSlot`)
// sowie streitwert/teuerung/gebvKosten/erbFristen (Engines noch nicht in dieser
// Datei importiert).
f('absatz:zpo:tage10:ZH', () => {
  const r = berechneFrist({ ereignis: '2025-12-10', einheit: 'tage', laenge: 10, verfahren: 'ordentlich', kanton: 'ZH', fristnatur: 'gesetzlich' });
  return begruendungsAbsatz(r, fristbeginnZusatz(r.diesAQuoISO, r.fristbeginnNorm));
});
f('absatz:schkg:rv10', () => {
  const r = berechneSchkgFrist({ ereignis: '2026-03-20', einheit: 'tage', laenge: 10, modus: 'schkg_betreibungsferien', fristnatur: 'verwirkung', kanton: 'ZH' });
  return begruendungsAbsatz(r, fristbeginnZusatz(r.diesAQuoISO, r.fristbeginnNorm));
});
f('absatz:kuendigung:sperr:krank', () => begruendungsAbsatz(berechneSperrfristen({ vertragsbeginn: '2020-01-01', zugangKuendigung: '2025-04-20', kuendigendePartei: 'arbeitgeber', probezeitMonate: 1, kuendigungsterminMonatsende: true, sperrereignisse: [{ typ: 'krankheit_unfall', von: '2025-05-01', bis: '2025-05-20' }] })));
f('absatz:miet:ordentlich', () => begruendungsAbsatz(berechneMietkuendigung({ kuendigungsart: 'ordentlich', objekt: 'wohnung', zugang: '2026-02-10', kanton: 'ZH', partei: 'mieter' })));
f('absatz:verj:or127', () => begruendungsAbsatz(berechneVerjaehrung({ regime: 'ordentlich', beginnRelativ: '2020-03-15', stichtag: '2026-06-05', kanton: 'ZH' })));
f('absatz:gewaehr:neu', () => begruendungsAbsatz(berechneGewaehrleistung({ vertragstyp: 'fahrniskauf', vertragsdatum: '2026-02-01', objekt: 'beweglich', uebergabe: '2026-03-01', mangelTyp: 'versteckt', entdeckung: '2026-04-01', kanton: 'ZH', stichtag: '2026-06-05' })));
f('absatz:verzug:einfach', () => begruendungsAbsatz(berechneVerzugszins({ kapital: 10000, verzugsbeginn: '2025-01-15', stichtag: '2026-02-20' })));
f('absatz:lohn:bs', () => begruendungsAbsatz(berechneLohnfortzahlung({ vertragsbeginn: '2020-01-01', verhinderungBeginn: '2026-02-01', verhinderungEnde: '2026-04-15', arbeitsunfaehigkeitProzent: 100, kanton: 'BS', ktgGleichwertigVorhanden: false })));
f('absatz:erb:ehegatte2kinder', () => begruendungsAbsatz(berechneErbteilung({ todesdatum: '2026-03-01', zivilstand: 'verheiratet', kinderLebend: 2 } as never)));
f('absatz:bger:zivil:50k', () => begruendungsAbsatz(berechneBgerRechtsweg({ weg: 'zivil', zivilGebiet: 'schuldrecht', vermoegensrechtlich: true, streitwertCHF: 50_000 })));
// B0-2-Rest (28.6.): bislang nicht importierte Roh-Ergebnis-Engines.
f('absatz:streitwert:einmalig50k', () => begruendungsAbsatz(berechneStreitwert({ begehren: [{ typ: 'einmalig', betragCHF: 50_000 }] })));
f('absatz:teuerung:indexmiete', () => begruendungsAbsatz(berechneTeuerung({ modus: 'indexmiete', betrag: 2500, vonMonat: '2007-10', bisMonat: '2012-03' })));
f('absatz:gebv:zb5000', () => begruendungsAbsatz(berechneBetreibungskosten({ forderungCHF: 5_000, zahlungsbefehl: { zustellversuche: 2, weitereAusfertigungen: 1 } })));
f('absatz:erbfrist:ausschlagung', () => begruendungsAbsatz(berechneErbFrist({ key: 'ausschlagung_gesetzlich', trigger: '2026-03-10' })));

// ── Kündigungs-Familie + Vollmacht (HN-18/PS-10, 25.9.2026): Erstaufnahme ──
// Je Vorlage ein Standard-Fall und Gates-Fälle, welche die includeIf-Weichen
// bzw. Gate-Zweige auslösen. Jeder Fall friert Zusammenstellung (Dokument +
// Protokoll + Engine-Ergebnis) UND Gate-Ergebnis ein. kag/kan: Probezeit- und
// ordentliche Konstellation laufen durch berechneKuendigungsfrist (RL-16).
const kdgMitGates = <A, Z extends object, G>(zus: (a: A) => Z, gates: (a: A, z: Z) => G) => (a: A) => { const z = zus(a); return { ...z, gates: gates(a, z) }; };
const km = kdgMitGates(kmZusammenstellen, (a: KmAntworten, z) => pruefeKmGates(a, z.engine));
const kmBasis: KmAntworten = { ...KM_DEFAULTS, absenderName: 'Mia Muster', absenderAdresse: 'Y 2, 4051 Basel', adressatName: 'V Immobilien AG', adressatAdresse: 'X 1, 4001 Basel', mietobjektAdresse: 'Y 2, 4051 Basel, 3. OG', kanton: 'BS', mietbeginn: '2020-04-01', zugang: '2026-06-20', ort: 'Basel', datum: '2026-06-15' };
for (const [id, d] of Object.entries<Partial<KmAntworten>>({
  standard: {},
  'gates-familie-264-vertragstermine': { familienwohnung: true, zustimmungEhegatte: true, ehegatteName: 'Max Muster', mitmieter: ['Zoe Muster'], ausserterminlich: true, nachmieterName: 'Nina Neu', rueckgabeWunschdatum: '2026-07-31', terminQuelle: 'vertraglich_monate', vertragsTermineMonate: [3, 9] },
  'gates-nichtig-ohne-zustimmung': { familienwohnung: true, zustimmungEhegatte: false },
})) f(`vorl:km-${id}`, () => km({ ...kmBasis, ...d }));
// kuendigung-vermieter ist bewusst Checkliste OHNE Zusammensteller (amtliches
// Formular, Art. 266l Abs. 2 OR); eingefroren wird die Engine-Auskunft mit exakt
// dem Aufruf der Seite (src/pages/VorlageKuendigungVermieter.tsx) — Weiche: Objekt.
for (const objekt of ['wohnung', 'geschaeftsraum'] as const) f(`vorl:kuendigung-vermieter-auskunft-${objekt}`, () => berechneMietkuendigung({ kuendigungsart: 'ordentlich', objekt, zugang: '2026-06-20', kanton: 'BS', partei: 'vermieter', terminQuelle: 'ortsueblich', amtlichesFormular: true, separateZustellung: true }));
const kag = kdgMitGates(kagZusammenstellen, (a: KagAntworten, z) => ({ ...pruefeKagGates(a, z.engine), istProbezeit: kagIstProbezeit(a) }));
const kagBasis: KagAntworten = { ...KAG_DEFAULTS, absenderName: 'Muster AG', absenderAdresse: 'X 1, 8000 Zürich', adressatName: 'Beat Beispiel', adressatAdresse: 'Y 2, 8000 Zürich', unterzeichner: 'Anna Muster, Geschäftsführerin', vertragsbeginn: '2020-01-01', zugangKuendigung: '2026-03-10', probezeit: 'gesetzlich', ort: 'Zürich', datum: '2026-03-09' };
for (const [id, d] of Object.entries<Partial<KagAntworten>>({
  ordentlich: {},
  'probezeit-freistellung-begruendung': { vertragsbeginn: '2026-01-05', zugangKuendigung: '2026-02-20', probezeit: 'vereinbart', probezeitMonate: 3, freistellung: true, freistellungAb: '2026-02-21', begruendungAufnehmen: true, begruendungText: 'Umstrukturierung der Abteilung.' },
  'probezeit-letzter-tag': { vertragsbeginn: '2026-01-01', zugangKuendigung: '2026-03-31', probezeit: 'vereinbart', probezeitMonate: 3 },
  'probezeit-folgetag': { vertragsbeginn: '2026-01-01', zugangKuendigung: '2026-04-01', probezeit: 'vereinbart', probezeitMonate: 3 },
  'gates-nichtig-sperrfrist': { sperrereignisse: [{ typ: 'krankheit_unfall', von: '2026-03-01', bis: '2026-03-20' }] },
  'gates-gehemmt-abweichend-vaterschaft': { sperrereignisse: [{ typ: 'krankheit_unfall', von: '2026-04-01', bis: '2026-04-20' }], fristQuelle: 'abweichend', abweichendeFristMonate: 3, abweichendeFristFormGueltig: true, vaterschaftsurlaubResttage: 5 },
})) f(`vorl:kag-${id}`, () => kag({ ...kagBasis, ...d }));
const kan = kdgMitGates(kanZusammenstellen, (a: KanAntworten, z) => pruefeKanGates(a, z.engine));
const kanBasis: KanAntworten = { ...KAN_DEFAULTS, absenderName: 'Beat Beispiel', absenderAdresse: 'Y 2, 8000 Zürich', adressatName: 'Muster AG', adressatAdresse: 'X 1, 8000 Zürich', vertragsbeginn: '2020-01-01', zugangKuendigung: '2026-03-10', probezeit: 'gesetzlich', ort: 'Zürich', datum: '2026-03-09' };
for (const [id, d] of Object.entries<Partial<KanAntworten>>({
  ordentlich: {},
  'probezeit-ohne-zeugnis-abrechnung': { vertragsbeginn: '2026-02-01', zugangKuendigung: '2026-03-15', probezeit: 'vereinbart', probezeitMonate: 2, zeugnisVerlangen: false, schlussabrechnungVerlangen: false },
  'gates-abweichend-formungueltig': { fristQuelle: 'abweichend', abweichendeFristMonate: 3, abweichendeFristFormGueltig: false, kuendigungsterminMonatsende: false },
})) f(`vorl:kan-${id}`, () => kan({ ...kanBasis, ...d }));
f('vorl:kan-gates-blanko-abweichend', () => kan({ ...KAN_DEFAULTS, fristQuelle: 'abweichend' }));
const kdgKv = (a: KvAntworten) => ({ ...kdgKvZusammenstellen(a), gates: pruefeKvGates(a) });
const kdgKvBasis: KvAntworten = { ...KV_DEFAULTS, absenderName: 'Anna Muster', absenderAdresse: 'X 1, 4051 Basel', adressatName: 'Beispiel AG', adressatAdresse: 'Y 2, 8000 Zürich', vertragsBezeichnung: 'Fitness-Abonnement', vertragsnummer: 'A-123', zugang: '2026-06-20', ort: 'Basel', datum: '2026-06-15' };
for (const [id, d] of Object.entries<Partial<KvAntworten>>({
  generisch: {},
  'gates-versicherung': { preset: 'versicherung', lebensversicherung: true, krankenzusatz: true, vertragsdauerUeber3Jahre: false, policennummer: 'P-9', aufNaechstmoeglich: false, kuendigungsterminWunsch: '2026-12-31' },
  'gates-kk-praemie-ausstaende': { preset: 'krankenkasse', kkGrund: 'praemienmitteilung', kkAusstaende: true, kkVersichertennummer: 'V-42' },
  'gates-kk-ordentlich': { preset: 'krankenkasse', kkGrund: 'ordentlich' },
  'gates-kk-ordentlich-besondere-form': { preset: 'krankenkasse', kkGrund: 'ordentlich', kkBesondereForm: true },
  'gates-darlehen': { preset: 'darlehen', aufforderungDatum: '2026-06-01' },
  'gates-auftrag': { preset: 'auftrag' },
  'gates-abo-telecom': { preset: 'abo_telecom' },
})) f(`vorl:kdg-kv-${id}`, () => kdgKv({ ...kdgKvBasis, ...d }));
const vm = (a: VollmachtAntworten) => ({ ...vollmachtZusammenstellen(a), gates: pruefeVollmachtGates(a) });
const vmBasis: VollmachtAntworten = { ...VOLLMACHT_DEFAULTS, vorname: 'Anna', nachname: 'Muster', geburtsdatum: '1970-05-04', adresse: 'X 1, 4051 Basel', bevollmaechtigte: [{ name: 'Beat Beispiel', angaben: 'geb. 1975, Y 2, 4051 Basel' }], ort: 'Basel', datum: '2026-06-15' };
const vmZwei = [{ name: 'Beat Beispiel', angaben: '' }, { name: 'Carla Beispiel', angaben: 'Rechtsanwältin' }];
for (const [id, d] of Object.entries<Partial<VollmachtAntworten>>({
  general: {},
  'gates-anwalt-juristisch-gemeinsam': { typ: 'anwalt', geberTyp: 'juristisch', firma: 'Muster AG', sitz: 'Basel', vertretenDurch: 'Anna Muster, Präsidentin', mandatsgegenstand: 'Muster AG gegen Beispiel GmbH betreffend Forderung', prozessbefugnisse: true, geheimnisentbindung: true, bevollmaechtigte: vmZwei, vertretung: 'gemeinsam', substitution: 'erlaubt', befristetBis: '2027-06-30', fortgeltungTod: true },
  'gates-spezial-geschaeft-buergschaft': { typ: 'spezial', geschaeft: 'Verkauf der Liegenschaft Y 2, 4051 Basel', bereiche: ['bank', 'immobilien', 'post', 'prozess'], ermaechtigungen: ['grundstuecke', 'vergleich'], buergschaft: true, bevollmaechtigte: vmZwei, vertretung: 'einzeln' },
  'spezial-nur-bereiche': { typ: 'spezial', bereiche: ['behoerden', 'versicherungen'] },
})) f(`vorl:vm-${id}`, () => vm({ ...vmBasis, ...d }));
f('vorl:vm-gates-blanko-spezial', () => vm({ ...VOLLMACHT_DEFAULTS, typ: 'spezial' }));

// ── Schreiben oder Vergleichen ──────────────────────────────────────────────
// Bug-Check 10.6.2026 (NIEDRIG): fileURLToPath statt .pathname — Letzteres
// liefert prozent-kodierte Pfade (Leerzeichen/Umlaute/Windows-Laufwerke).
const PFAD = fileURLToPath(new URL('../golden/lexmetrik-golden.json', import.meta.url));
const json = JSON.stringify(faelle, null, 1);

/** Myers-Diff-Diagnose (B6, Werkzeug-Audit 3.7.2026). Richtet Basis/Neu
 *  Zeile-für-Zeile korrekt aus, statt naivem Index-Vergleich, der bei EINER
 *  eingefügten/entfernten Zeile alles darunter fälschlich als «geändert» meldet
 *  (die Zeilen verschieben sich um 1, jeder Folge-Index wich ab). `diffArrays`
 *  löst die kürzeste Editierfolge — nur die real geänderten Zeilen erscheinen
 *  als − / +, verschobene Kontextzeilen bleiben als Kontext. REINE DIAGNOSE:
 *  das Gate bleibt der Byte-Vergleich (`golden:vergleich`), diese Ausgabe fällt
 *  in kein Tor-Verdikt ein. Lange unveränderte Läufe werden auf `kontext` Zeilen
 *  je Seite gekürzt; die Gesamtausgabe auf `maxZeilen` gedeckelt. */
function druckeMyersDiff(altZeilen: string[], neuZeilen: string[], kontext = 3, maxZeilen = 200): void {
  const teile = diffArrays(altZeilen, neuZeilen);
  const zeilen: string[] = [];
  teile.forEach((teil, idx) => {
    if (teil.added || teil.removed) {
      const zeichen = teil.added ? '+' : '−';
      for (const l of teil.value) zeilen.push(`${zeichen} ${l}`);
      return;
    }
    // Unveränderter Block: nur bis zu `kontext` Zeilen zu benachbarten
    // Änderungen zeigen, den Rest zusammenfassen (unified-diff-Kontext).
    const v = teil.value;
    const vorAenderung = idx > 0;
    const nachAenderung = idx < teile.length - 1;
    if (v.length <= kontext * 2 || (!vorAenderung && !nachAenderung)) {
      for (const l of v) zeilen.push(`  ${l}`);
      return;
    }
    const kopf = vorAenderung ? v.slice(0, kontext) : [];
    const fuss = nachAenderung ? v.slice(v.length - kontext) : [];
    for (const l of kopf) zeilen.push(`  ${l}`);
    const versteckt = v.length - kopf.length - fuss.length;
    if (versteckt > 0) zeilen.push(`  … ${versteckt} unveränderte Zeile${versteckt === 1 ? '' : 'n'} …`);
    for (const l of fuss) zeilen.push(`  ${l}`);
  });
  for (let i = 0; i < zeilen.length && i < maxZeilen; i++) console.log(zeilen[i]);
  if (zeilen.length > maxZeilen) console.log(`… gekürzt (${zeilen.length - maxZeilen} weitere Diff-Zeilen; Fall stark verändert).`);
}
if (process.argv[2] === 'vergleich') {
  if (!existsSync(PFAD)) { console.error('Kein Golden-Stand vorhanden — zuerst ohne Argument laufen lassen.'); process.exit(2); }
  const alt = readFileSync(PFAD, 'utf-8');
  if (alt === json) {
    console.log(`IDENTISCH — ${Object.keys(faelle).length} Fälle byte-gleich (verhaltensneutral).`);
  } else {
    const altObj = JSON.parse(alt) as Record<string, unknown>;
    const geaendert = Object.keys(faelle).filter((k) => k in altObj && JSON.stringify(altObj[k]) !== JSON.stringify(faelle[k]));
    const neu = Object.keys(faelle).filter((k) => !(k in altObj));
    const entfernt = Object.keys(altObj).filter((k) => !(k in faelle));
    console.error(`ABWEICHUNG von der committeten Basis (${PFAD}):`);
    if (geaendert.length) console.error(`  geändert (${geaendert.length}): ${geaendert.join(', ')}`);
    if (neu.length) console.error(`  neu (${neu.length}): ${neu.join(', ')}`);
    if (entfernt.length) console.error(`  entfernt (${entfernt.length}): ${entfernt.join(', ')}`);
    console.error('Fachliche Änderung? → `npm run golden` + Begründung im Commit. Refactoring? → Bug.');
    process.exit(1);
  }
} else if (process.argv[2] === 'diff') {
  // Diagnose-Modus (Token-Disziplin 11.6.2026): NUR den Alt/Neu-Diff eines
  // Falls zeigen statt golden/lexmetrik-golden.json (11'900 Zeilen) zu lesen.
  // Ohne Fall-ID: kompakte Liste der abweichenden IDs. Reine Diagnose —
  // das Gate bleibt `golden:vergleich`.
  if (!existsSync(PFAD)) { console.error('Kein Golden-Stand vorhanden — zuerst ohne Argument laufen lassen.'); process.exit(2); }
  const altObj = JSON.parse(readFileSync(PFAD, 'utf-8')) as Record<string, unknown>;
  const id = process.argv[3];
  if (!id) {
    const geaendert = Object.keys(faelle).filter((k) => k in altObj && JSON.stringify(altObj[k]) !== JSON.stringify(faelle[k]));
    const neu = Object.keys(faelle).filter((k) => !(k in altObj));
    const entfernt = Object.keys(altObj).filter((k) => !(k in faelle));
    if (!geaendert.length && !neu.length && !entfernt.length) {
      console.log(`IDENTISCH — ${Object.keys(faelle).length} Fälle byte-gleich.`);
    } else {
      if (geaendert.length) console.log(`geändert (${geaendert.length}): ${geaendert.join(', ')}`);
      if (neu.length) console.log(`neu (${neu.length}): ${neu.join(', ')}`);
      if (entfernt.length) console.log(`entfernt (${entfernt.length}): ${entfernt.join(', ')}`);
      console.log('Einzelfall ansehen: npm run golden:diff -- <id>');
    }
  } else if (!(id in altObj) && !(id in faelle)) {
    console.error(`Unbekannte Fall-ID: ${id}`);
    process.exit(2);
  } else {
    const altZeilen = id in altObj ? JSON.stringify(altObj[id], null, 1).split('\n') : [];
    const neuZeilen = id in faelle ? JSON.stringify(faelle[id], null, 1).split('\n') : [];
    if (altZeilen.join('\n') === neuZeilen.join('\n')) {
      console.log(`IDENTISCH — Fall ${id} byte-gleich.`);
    } else {
      console.log(`DIFF ${id} (− Basis ${PFAD} / + aktueller Code):`);
      druckeMyersDiff(altZeilen, neuZeilen);
    }
  }
} else if (process.argv[2] === undefined) {
  writeFileSync(PFAD, json);
  const fehler = Object.entries(faelle).filter(([, v]) => (v as { FEHLER?: string })?.FEHLER);
  console.log(`Golden-Stand geschrieben: ${Object.keys(faelle).length} Fälle → ${PFAD}`);
  if (fehler.length) console.log('Mit FEHLER erfasst (Signatur prüfen):', fehler.map(([k]) => k).join(', '));
} else {
  // Schutz (11.6.2026): JEDES unbekannte Argument fiel früher in den
  // Schreib-Zweig und überschrieb still die committete Basis.
  console.error(`Unbekanntes Argument «${process.argv[2]}» — erlaubt: (ohne) = Basis schreiben · vergleich · diff [id]. Basis NICHT angefasst.`);
  process.exit(2);
}
