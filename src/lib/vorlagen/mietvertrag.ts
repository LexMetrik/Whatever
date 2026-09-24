// Dossier: bibliothek/recherche/mietrecht-ausbau.md · bibliothek/recherche/untermietvertrag.md
import type { VorlageSchema, Antworten } from './engine';
import { assemble } from './engine';
import { fmtDatumLang, fmtDatum, fmtCHF, zahl } from './datum';
import { type Detailgrad, DETAILGRAD_DEFAULT, AB_STANDARD, NUR_EXPERTE } from './detailgrad';
import { MWST_NORMALSATZ_PROZENT } from '../../data/tarif/typen';

// ─── Mietvertrag Wohn- & Geschäftsräume (Art. 253 ff. OR) – sechste Vorlage ──
//
// Grundlage: normverifiziertes Rechtsgutachten «Schweizer Mietvertrag»
// (5.6.2026). Zentrale Verzweigung gemäss Gutachten: objektTyp (Wohnraum |
// Geschäftsraum) und Kanton. Validierungskern:
//   · absolut zwingend  → Blocker (Kautionsmaximum Wohnraum Art. 257e Abs. 2,
//     Anfechtungssystem Art. 270 ff., Kündigungs-Formvorschriften 266l–266o,
//     Verrechnungsverzicht Art. 265)
//   · relativ zwingend  → mieterungünstige Abweichungen gesperrt
//     (Erhaltungspflicht 256, kleiner Unterhalt 259, Mindestfristen 266c/d)
//   · Schriftform-Klauseln → Index-/Staffelmiete (269b/269c; Mindestdauern
//     5 bzw. 3 Jahre DIREKT am Fedlex-Wortlaut verifiziert, 5.6.2026)
//   · Form-Gates als Disclosure: kantonale Formularpflicht Anfangsmietzins
//     (Art. 270 Abs. 2 OR), amtliches Formular bei Vermieterkündigung,
//     Familienwohnung (266m/266n)
// Alle zitierten OR-Anker empirisch gegen das Fedlex-Filestore-HTML
// verifiziert (5.6.2026). Kein LLM: feste Bausteine, deterministisch.

// ── Wartbare, DATIERTE Parameter (Gutachten Stufe 4) ────────────────────────
export const MV_PARAMETER = {
  referenzzinssatz: { wert: 1.25, stand: '2.9.2026', quelle: 'BWO (gültig seit 2.9.2025, unverändert ab 2.9.2026, publiziert 1.9.2026, https://www.bwo.admin.ch/de/referenzzinssatz; quartalsweise publiziert)' },
  mwstSatz: { wert: MWST_NORMALSATZ_PROZENT, stand: '1.1.2024' },
} as const;

// Kantone mit Formularpflicht für den Anfangsmietzins (Art. 270 Abs. 2 OR).
// Quelle: BWO-Verzeichnis vom 4.2.2026 – DYNAMISCH (Anordnung/Aufhebung
// jährlich per 1. November), jährlich nachzuführen.
export const MV_FORMULARPFLICHT: { kanton: string; umfang: 'ganz' | 'teilweise'; hinweis?: string }[] = [
  { kanton: 'BS', umfang: 'ganz' },
  { kanton: 'BE', umfang: 'ganz', hinweis: 'Miet-Initiative angenommen 28.9.2025; Formularpflicht für ab 1.12.2025 geschlossene Verträge' },
  { kanton: 'FR', umfang: 'ganz' },
  { kanton: 'GE', umfang: 'ganz' },
  { kanton: 'LU', umfang: 'ganz' },
  { kanton: 'NE', umfang: 'teilweise', hinweis: '2–5-Zimmer-Wohnungen in bestimmten Gemeinden' },
  { kanton: 'VD', umfang: 'teilweise', hinweis: 'bestimmte Bezirke' },
  { kanton: 'ZG', umfang: 'ganz' },
  { kanton: 'ZH', umfang: 'ganz' },
];

export const MV_OFFENE_VERIFIKATIONEN: string[] = [
  'Formularpflicht-Kantone (Art. 270 Abs. 2 OR) sind dynamisch (jährlich per 1. November); Stand BWO-Verzeichnis 4.2.2026. Bern-Diskrepanz aufgelöst (Vertiefungs-Gutachten 5.6.2026): Miet-Initiative am 28.9.2025 angenommen, Formularpflicht ab 1.12.2025.',
  'Referenzzinssatz 1.25 % (gültig seit 2.9.2025, unverändert ab 2.9.2026, publiziert 1.9.2026 [Durchschnittszinssatz per 30.6.2026: 1.31 %]; nächste Anpassung erst bei Durchschnittszinssatz < 1.13 % oder > 1.37 %; nächste Publikation 1.12.2026) – quartalsweise auf bwo.admin.ch/de/referenzzinssatz prüfen.',
  'MWST-Normalsatz 8.1 % (seit 1.1.2024) – bei Satzänderung Parameter nachführen.',
  'Geschäftsraum: Umsatzmiete und Konkurrenzschutz sind gesetzlich nicht spezifisch geregelt; Klauselpraxis vor Verwendung anwaltlich prüfen.',
  'Untermiete: BGE 119 II 353 (Gewinnverbot), BGE 134 III 446 (Kündigung 257f Abs. 3 nach Abmahnung) und der Praxis-Richtwert «~50 % Aufschlag ohne Mehrleistungen missbräuchlich» sind zu verifizieren; die abgelehnte Untermiete-Revision (Abstimmung 24.11.2024) darf NICHT als geltendes Recht übernommen werden.',
];

// Übliche Nebenkosten-Positionen (müssen EINZELN im Vertrag stehen –
// Auflistung nur in AGB genügt nicht, BGer 4C.250/2006).
export const MV_NEBENKOSTEN_WOHNEN = [
  'Heizung', 'Warmwasser', 'Wasser/Abwasser', 'Kehrichtgrundgebühr',
  'Hauswartung', 'Treppenhausreinigung', 'Allgemeinstrom', 'Lift (Betrieb/Service)',
  'Gartenunterhalt', 'TV-/Internet-Grundgebühr',
] as const;
export const MV_NEBENKOSTEN_GESCHAEFT = [
  ...MV_NEBENKOSTEN_WOHNEN,
  'Klima-/Lüftungsanlagen (Betrieb/Service)', 'Brandschutzanlagen', 'Bewachung/Sicherheit',
  'Verwaltungshonorar',
] as const;

// ── Eingaben ────────────────────────────────────────────────────────────────

export type MvObjektTyp = 'wohnung' | 'geschaeftsraum';
type MvMietzinsModell = 'standard' | 'index' | 'staffel';
/** Untermiete-Ausbau 6.6.2026 (bibliothek/recherche/untermietvertrag.md):
 *  Art. 262 OR GELTENDE Fassung (die Revision «Untermiete» wurde in der
 *  Volksabstimmung vom 24.11.2024 ABGELEHNT – Zustimmung bleibt formfrei,
 *  Verweigerungsgründe Abs. 2 lit. a–c abschliessend). Default 'hauptmiete'
 *  lässt das bisherige Verhalten byte-identisch (§6, golden-bewiesen). */
type MvMietverhaeltnis = 'hauptmiete' | 'untermiete';
type MvZustimmungStatus = 'schriftlich' | 'muendlich' | 'angefragt' | 'nicht_angefragt';

export type MvStaffel = { ab: string; erhoehungCHF: string };

export type MvAntworten = {
  // Detailgrad (FAHRPLAN-VERTRAGS-VARIANTEN P2): einfach blendet die rein
  // deklaratorische Zahlungsverzugs-Klausel aus, experte ergänzt Mietzins-
  // vorbehalt (Art. 18 VMWG) und Duldungspflicht (Art. 257h OR). Default
  // 'standard' = byte-identischer Bestand (§6).
  detailgrad: Detailgrad;
  objektTyp: MvObjektTyp;
  /** Untermiete-Weiche: bei 'untermiete' sind vermieter*-Felder der UNTER-
   *  vermieter (= Hauptmieter) und mieter*-Felder der Untermieter. */
  mietverhaeltnis?: MvMietverhaeltnis;     // Default 'hauptmiete'
  // Hauptmietvertrag-Referenz (nur untermiete)
  hmVermieterName?: string;
  hmDatum?: string;                        // ISO, optional
  hmMietzinsCHF?: string;                  // Vergleichsgrösse Missbrauchs-Gate
  // Zustimmung des Hauptvermieters (Art. 262 Abs. 1 OR – formfrei)
  zustimmungStatus?: MvZustimmungStatus;
  zustimmungDatum?: string;
  // Umfang & Mietzins-Rechtfertigung
  untermieteUmfang?: 'ganz' | 'teilweise';
  untermieteZimmerBeschrieb?: string;      // bei 'teilweise': Räume/Mitbenutzung
  mehrleistungBegruendung?: string;        // rechtfertigt Aufschlag (262 II lit. b)
  moebliert?: boolean;                     // 266e-Hinweis (2-Wochen-Frist)
  // Parteien
  vermieterName: string;
  vermieterAdresse: string;
  mieterName: string;
  mieterAdresse: string;
  zweiterMieterName?: string;        // → Solidarhaftungs-Klausel
  // Objekt
  objektAdresse: string;
  objektBeschrieb: string;           // z. B. «3.5-Zimmer-Wohnung im 2. OG»
  nebenraeume?: string;              // z. B. «Kellerabteil Nr. 7, Estrich»
  kanton?: string;                   // Formularpflicht-Prüfung
  mietzweck?: string;                // Geschäftsraum: Pflicht
  familienwohnung?: boolean;         // nur Wohnraum (Art. 266m/266n)
  // Beginn & Dauer
  beginn: string;                    // ISO
  befristet: boolean;
  befristetBis?: string;
  mindestdauerJahre?: number;        // feste Erstlaufzeit (für Index-/Staffelmiete)
  // Mietzins
  mietzinsNettoCHF: string;          // pro Monat
  mietzinsModell: MvMietzinsModell;
  indexBasisMonat?: string;          // LIK-Basis, z. B. «Mai 2026» (Vertiefungs-Gutachten 5.6.2026)
  indexBasisPunkte?: string;         // optionaler Punktestand
  staffeln?: MvStaffel[];            // bei 'staffel': jährliche Erhöhungen in CHF
  // Nebenkosten
  nebenkosten: 'keine' | 'akonto' | 'pauschale';
  nebenkostenCHF?: string;           // pro Monat
  nkPositionen: string[];
  // Kaution (Art. 257e)
  kautionCHF?: string;
  // Vertragsklauseln
  tierhaltung: 'zustimmung' | 'kleintiere' | 'erlaubt';
  versicherungspflicht: boolean;     // Privat-/Betriebshaftpflicht des Mieters
  hausordnung: boolean;              // als Vertragsbestandteil
  // Kündigung
  kuendigungsfristMonate?: number;   // Default 3 (Wohnung) / 6 (Geschäftsraum)
  // Geschäftsraum-Spezifika
  mwstOption?: boolean;              // Art. 22 MWSTG – nur Geschäftsraum
  konkurrenzschutz?: boolean;
  konkurrenzschutzText?: string;
  konkurrenzschutzStrafeCHF?: string; // empfohlen: blosses Verbot erzwingt keine Vertragsauflösung beim Konkurrenten
  // Mietzinsvorbehalt (Art. 18 VMWG) – experte
  mietzinsvorbehalt?: boolean;
  vorbehaltProzent?: string;         // Vorbehalt in Prozenten des Mietzinses (Art. 18 VMWG)
  vorbehaltGrund?: string;           // z. B. «nicht ausgeschöpfte Kostenmiete»
  // Abschluss
  ort: string;
  datum: string;
};

export const MV_DEFAULTS: MvAntworten = {
  detailgrad: DETAILGRAD_DEFAULT,
  objektTyp: 'wohnung',
  vermieterName: '', vermieterAdresse: '',
  mieterName: '', mieterAdresse: '',
  objektAdresse: '', objektBeschrieb: '',
  beginn: '', befristet: false,
  mietzinsNettoCHF: '', mietzinsModell: 'standard',
  nebenkosten: 'akonto', nkPositionen: [],
  tierhaltung: 'kleintiere',
  versicherungspflicht: true,
  hausordnung: true,
  ort: '', datum: '',
};

// ── Helfer ──────────────────────────────────────────────────────────────────




export const mvGesetzlicheFrist = (t: MvObjektTyp) => (t === 'geschaeftsraum' ? 6 : 3);

// Kalenderjahr-genau: umfasst die Mietdauer beginn…bis (beide Tage
// eingeschlossen) mindestens n volle Jahre (Art. 269b / 269c lit. a OR)?
// Der Tag des Mietbeginns zählt mit, das Enddatum («endet am …») ebenfalls:
// erreicht ist die Dauer, wenn das Ende mindestens auf den Tag VOR dem n-ten
// Jahrestag des Beginns fällt — 1.10.2026–30.9.2031 = fünf Jahre (VB-02,
// W2·30-RL-W1; früher verlangte die Prüfung fälschlich den 1.10.2031).
// Schaltjahr: Date.UTC(y, m, d − 1) rollt über — Beginn 29.2.2028 → Ende
// 28.2.2033 (= Art. 77 Abs. 1 Ziff. 3 OR analog, Anknüpfungstag 28.2.2028);
// Beginn 1.3.2029 → Ende 29.2.2032 (drittes Mietjahr bis zum Vortag des
// Jahrestags 1.3.2032).
const jahreErreicht = (beginnISO: string, bisISO: string, n: number): boolean => {
  const [by, bm, bd] = beginnISO.split('-').map(Number);
  const [zy, zm, zd] = bisISO.split('-').map(Number);
  if (![by, bm, bd, zy, zm, zd].every(Number.isFinite)) return false;
  return Date.UTC(zy, zm - 1, zd) >= Date.UTC(by + n, bm - 1, bd - 1);
};

// ── Gates (deterministische Validierung nach der Gutachtens-Matrix) ─────────

export type MvGateErgebnis = { blocker: string[]; warnungen: string[]; hinweise: string[] };

export function pruefeMvGates(a: MvAntworten): MvGateErgebnis {
  const blocker: string[] = [];
  const warnungen: string[] = [];
  const hinweise: string[] = [];
  const wohnung = a.objektTyp === 'wohnung';

  // G1 – Kaution: Wohnraum max. drei Monatszinse (Art. 257e Abs. 2 OR,
  // absolut zwingend). Geschäftsraum: keine Obergrenze, aber Augenmass.
  const netto = zahl(a.mietzinsNettoCHF);
  // Massgeblich ist nach h.L. der BRUTTO-Monatszins inkl. Nebenkosten-
  // Akonto/-Pauschale (Vertiefungs-Gutachten 5.6.2026 – zu verifizieren).
  const nk = a.nebenkosten !== 'keine' ? (zahl(a.nebenkostenCHF) ?? 0) : 0;
  const brutto = netto !== null ? netto + nk : null;
  const kaution = zahl(a.kautionCHF);
  if (kaution !== null && brutto !== null && netto !== null) {
    if (wohnung && kaution > 3 * brutto) {
      blocker.push(`Die Kaution für Wohnräume darf drei Monatszinse nicht übersteigen (Art. 257e Abs. 2 OR; massgeblich ist nach h.L. der Bruttomietzins inkl. Nebenkosten – zu verifizieren) – höchstens CHF ${fmtCHF(String(3 * brutto))}.`);
    }
    if (!wohnung && kaution > 6 * brutto) {
      warnungen.push('Geschäftsraum: Die Kaution unterliegt keiner gesetzlichen Obergrenze, sollte aber in einem angemessenen Verhältnis zum Risiko stehen – mehr als sechs Monatszinse sind begründungsbedürftig.');
    }
  }

  // G2 – Formularpflicht Anfangsmietzins (Art. 270 Abs. 2 OR; kantonal)
  if (wohnung && a.kanton) {
    const fp = MV_FORMULARPFLICHT.find((k) => k.kanton === a.kanton);
    if (fp) {
      warnungen.push(`Kanton ${fp.kanton}: ${fp.umfang === 'ganz' ? 'Formularpflicht' : 'TEILWEISE Formularpflicht'} für den Anfangsmietzins (Art. 270 Abs. 2 OR)${fp.hinweis ? ` – ${fp.hinweis}` : ''}. Der Anfangsmietzins ist dem Mieter mit dem amtlichen Formular mitzuteilen (Inhalt: Art. 19 VMWG; seit 1.10.2025 inkl. Referenzzins und Teuerung); ohne Formular ist die Mietzinsabrede NICHTIG. Stand BWO-Verzeichnis 4.2.2026 – dynamisch, jährlich prüfen.`);
    }
  }

  // G3 – Kündigungsfrist: Mindestfristen relativ zwingend (Art. 266c/266d OR).
  // Bei Befristung übersprungen – der Kündigungsbaustein erscheint dann gar
  // nicht im Dokument (Audit 5.6.2026: Blocker auf unsichtbarem Feld;
  // konsistent zum Arbeitsvertrag-G2).
  const fristMin = mvGesetzlicheFrist(a.objektTyp);
  const frist = a.kuendigungsfristMonate ?? fristMin;
  // Bug-Check 10.6.2026 (MITTEL, deklarierte fachliche Änderung): Beim
  // möblierten Zimmer (teilweise Untermiete) gilt Art. 266e OR als lex
  // specialis — gesetzliche Frist zwei Wochen; der 3-Monats-Blocker des
  // Art. 266c darf dort nicht feuern (der bestehende 266e-Hinweis bleibt).
  const moebliertesZimmer = a.mietverhaeltnis === 'untermiete'
    && a.untermieteUmfang === 'teilweise' && a.moebliert === true;
  if (!a.befristet && frist < fristMin && !moebliertesZimmer) {
    blocker.push(wohnung
      ? 'Die Kündigungsfrist für Wohnungen beträgt mindestens drei Monate (Art. 266c OR) – kürzere Abreden sind ungültig.'
      : 'Die Kündigungsfrist für Geschäftsräume beträgt mindestens sechs Monate (Art. 266d OR) – kürzere Abreden sind ungültig.');
  }

  // G4 – Indexmiete: nur gültig bei Vertragsdauer ≥ 5 Jahre und LIK
  // (Art. 269b OR – Wortlaut am Fedlex-Text verifiziert)
  if (a.mietzinsModell === 'index') {
    const erfuellt = a.befristet && a.befristetBis && a.beginn
      ? jahreErreicht(a.beginn, a.befristetBis, 5)
      : (a.mindestdauerJahre ?? 0) >= 5;
    if (!erfuellt) {
      blocker.push('Indexmiete ist nur gültig, wenn der Vertrag für mindestens fünf Jahre abgeschlossen wird (Art. 269b OR) – feste Dauer bzw. Mindestlaufzeit von 5 Jahren erfassen.');
    }
    if (!a.indexBasisMonat?.trim()) {
      blocker.push('Indexmiete: Basisstand des Landesindexes angeben (Monat/Jahr, z. B. «Mai 2026») – ohne definierte Basis ist die Anpassung nicht bestimmbar (Art. 269b OR; Art. 17 VMWG).');
    }
    hinweise.push('Indexmiete: zulässig ist ausschliesslich die Bindung an den Landesindex der Konsumentenpreise; Mischklauseln (teils Index, teils Referenzzins) sind unzulässig (Kombination Index/Staffel: BGE 124 III 57 – zu verifizieren). Während der Indexbindung sind andere Anpassungsgründe ausgeschlossen (Anfechtung über Art. 270c OR); die Anpassung ist mit 30 Tagen Frist auf einen Monatsanfang anzukündigen (Art. 17 VMWG – zu verifizieren).');
  }

  // G5 – Staffelmiete: Vertrag ≥ 3 Jahre, höchstens eine Erhöhung pro Jahr,
  // Betrag in Franken (Art. 269c OR – Wortlaut am Fedlex-Text verifiziert)
  if (a.mietzinsModell === 'staffel') {
    const erfuellt = a.befristet && a.befristetBis && a.beginn
      ? jahreErreicht(a.beginn, a.befristetBis, 3)
      : (a.mindestdauerJahre ?? 0) >= 3;
    if (!erfuellt) {
      blocker.push('Staffelmiete ist nur gültig, wenn der Vertrag für mindestens drei Jahre abgeschlossen wird (Art. 269c lit. a OR).');
    }
    const staffeln = (a.staffeln ?? []).filter((s) => s.ab && zahl(s.erhoehungCHF) !== null);
    if (staffeln.length === 0) {
      blocker.push('Staffelmiete: mindestens eine Staffel mit Datum und Erhöhungsbetrag in Franken erfassen (Art. 269c lit. c OR).');
    }
    // höchstens einmal jährlich: Abstände der Staffeln prüfen (deterministisch)
    const daten = staffeln.map((s) => new Date(s.ab).getTime()).sort((x, y) => x - y);
    const beginnMs = a.beginn ? new Date(a.beginn).getTime() : null;
    const JAHR = 365 * 24 * 3600 * 1000;
    if (beginnMs !== null && daten.length > 0 && daten[0] - beginnMs < JAHR) {
      blocker.push('Staffelmiete: Die erste Erhöhung darf frühestens ein Jahr nach Mietbeginn greifen (höchstens eine Erhöhung pro Jahr, Art. 269c lit. b OR).');
    }
    for (let i = 1; i < daten.length; i++) {
      if (daten[i] - daten[i - 1] < JAHR) {
        blocker.push('Staffelmiete: Zwischen den Erhöhungen muss mindestens ein Jahr liegen (Art. 269c lit. b OR).');
        break;
      }
    }
    // §7-Korrektur 7.6.2026 (ersetzt den überholten «Audit-Fix 6.6.2026»):
    // Art. 19a VMWG EXISTIERT seit 1.10.2025 (V vom 21.3.2025, AS 2025 191) –
    // der alte Befund «existiert nicht» beruhte auf dem Cache-Stand 20250101;
    // die 20251001-Manifestation liegt am Filestore OHNE «-N»-Suffix (n=0).
    // Die Vier-Monats-Regel («Bei gestaffelten Mietzinsen darf die schriftliche
    // Mitteilung frühestens vier Monate vor Eintritt jeder Mietzinserhöhung
    // erfolgen») steht seither in Art. 19a; am Cache 20251001 wörtlich
    // verifiziert. Dossier: bibliothek/normen/fedlex-pin-nachverifikation-2026-06.md
    hinweise.push('Während der Staffelung sind andere Mietzinsanpassungen ausgeschlossen (BGE 121 III 397 – zu verifizieren); die Anfechtung richtet sich nach Art. 270d OR. Seit 1.10.2025 genügt für die Mitteilung der Staffelerhöhung eine formlose SCHRIFTLICHE Mitteilung (kein amtliches Formular), frühestens vier Monate vor dem Erhöhungszeitpunkt (Art. 269d Abs. 5 OR i.V.m. Art. 19a VMWG).');
  }

  // G6 – Nebenkosten: nur geschuldet, wenn besonders vereinbart und EINZELN
  // aufgeführt (Art. 257a Abs. 2 OR; BGer 4C.250/2006 – zu verifizieren)
  if (a.nebenkosten !== 'keine' && a.nkPositionen.length === 0) {
    blocker.push('Nebenkosten sind nur geschuldet, wenn sie besonders vereinbart und die Positionen einzeln aufgeführt sind (Art. 257a Abs. 2 OR) – mindestens eine Position wählen oder «im Mietzins inbegriffen» wählen.');
  }
  if (a.nebenkosten !== 'keine' && a.nkPositionen.length > 0) {
    hinweise.push('Nur Nebenkosten-Positionen aufnehmen, die beim Objekt TATSÄCHLICH anfallen – werden nicht anfallende Positionen aufgeführt, riskiert die ganze Nebenkostenabrede die Nichtigkeit (BGE 121 III 460 – zu verifizieren); nicht rechtsgenügend vereinbarte Nebenkosten gelten als im Nettomietzins inbegriffen.');
  }
  if (a.nebenkosten === 'pauschale') {
    hinweise.push('Pauschale Nebenkosten: massgeblich sind die Durchschnittswerte dreier Jahre (Art. 4 Abs. 2 VMWG); eine Abrechnungspflicht besteht nicht.');
  }
  if (a.nebenkosten === 'akonto') {
    hinweise.push('Akonto-Nebenkosten: Der Vermieter rechnet mindestens einmal jährlich ab (Art. 4 Abs. 1 VMWG); der Mieter hat Anspruch auf Belegeinsicht (Art. 257b Abs. 2 OR).');
  }

  // G7 – MWST-Option nur bei Geschäftsraum (Art. 22 Abs. 2 lit. b MWSTG)
  if (wohnung && a.mwstOption) {
    blocker.push('Die MWST-Option ist ausgeschlossen, wenn das Objekt ausschliesslich für Wohnzwecke genutzt wird (Art. 22 Abs. 2 lit. b MWSTG).');
  }

  // G8 – Geschäftsraum: Mietzweck ist Pflicht (Nutzungsumfang/Optionsfähigkeit)
  if (!wohnung && !a.mietzweck?.trim()) {
    blocker.push('Geschäftsraum: Den Mietzweck genau umschreiben (massgeblich für Gebrauchsumfang, Untermiete und MWST-Option).');
  }

  // G9 – Konkurrenzschutz: nicht vertragsimmanent – nur mit Umschreibung
  if (a.konkurrenzschutz && !a.konkurrenzschutzText?.trim()) {
    blocker.push('Konkurrenzschutz ist nicht vertragsimmanent und muss ausdrücklich umschrieben werden (geschützte Branche/Nutzung angeben).');
  }
  if (a.konkurrenzschutz && !zahl(a.konkurrenzschutzStrafeCHF)) {
    hinweise.push('Konkurrenzschutz ohne Konventionalstrafe: Ein blosses vertragliches Verbot erzwingt die Auflösung eines mit dem Konkurrenten geschlossenen Mietvertrags nicht – der geschützte Mieter wird auf Schadenersatz verwiesen. Eine Konventionalstrafe wird empfohlen (Vertiefungs-Gutachten 5.6.2026).');
  }

  // G10 – Mietzinsvorbehalt muss in Franken oder Prozenten beziffert sein
  // (Art. 18 VMWG); nur im Detailgrad «experte» wählbar.
  if (a.detailgrad === 'experte' && a.mietzinsvorbehalt && !zahl(a.vorbehaltProzent)) {
    warnungen.push('Mietzinsvorbehalt: Der Vorbehalt einer nicht ausgeschöpften Mietzinsanpassung ist in Franken oder in Prozenten des Mietzinses zu beziffern, sonst geht er verloren (Art. 18 VMWG).');
  }

  // Familienwohnung (nur Hinweis – Schutz gilt von Gesetzes wegen)
  if (wohnung && a.familienwohnung) {
    hinweise.push('Familienwohnung: Kündigung durch die Mieterseite nur mit ausdrücklicher Zustimmung des Ehegatten/eingetragenen Partners (Art. 266m OR); der Vermieter muss Kündigungen und Zahlungsfristen beiden Ehegatten SEPARAT zustellen (Art. 266n OR), sonst Nichtigkeit (Art. 266o OR).');
  }

  // Geschäftsraum-Disclosures (Vertiefungs-Gutachten 5.6.2026)
  if (!wohnung) {
    hinweise.push('Geschäftsraum von Gesetzes wegen: Retentionsrecht des Vermieters an beweglichen Einrichtungsgegenständen (Art. 268 OR), Erstreckung bis höchstens sechs Jahre (Art. 272b OR), Übertragung des Mietverhältnisses auf einen Dritten mit schriftlicher Zustimmung (Art. 263 OR; Solidarhaftung des bisherigen Mieters max. zwei Jahre).');
  }
  if (!a.befristet && (a.mindestdauerJahre ?? 0) > 10) {
    hinweise.push('Sehr lange feste Erstlaufzeit: Eine übermässig lange beidseitige Bindung kann nach Art. 27 Abs. 2 ZGB teilnichtig sein – feste zahlenmässige Obergrenze besteht im Schweizer Recht nicht, massgeblich ist die Einzelfallabwägung (zu verifizieren).');
  }

  // ── Untermiete-Gates (Ausbau 6.6.2026, Dossier untermietvertrag.md §3c) ──
  if (a.mietverhaeltnis === 'untermiete') {
    // G-Z – Zustimmung des Hauptvermieters: WARNUNG, kein Blocker. Der
    // Untermietvertrag ist auch ohne (noch) erteilte Zustimmung zivilrechtlich
    // gültig; das reale Risiko ist die ausserordentliche Kündigung des
    // HAUPTmietvertrags nach schriftlicher Abmahnung (Art. 257f Abs. 3 OR).
    if (a.zustimmungStatus === 'angefragt' || a.zustimmungStatus === 'nicht_angefragt' || !a.zustimmungStatus) {
      warnungen.push('ZUSTIMMUNG DES HAUPTVERMIETERS fehlt bzw. steht aus (Art. 262 Abs. 1 OR): Der Untermietvertrag ist zwar gültig, aber ohne Zustimmung riskiert der Untervermieter nach schriftlicher Abmahnung die ausserordentliche Kündigung des HAUPTMIETVERTRAGS (Art. 257f Abs. 3 OR; BGE 134 III 446 – zu verifizieren). Zustimmung vor Bezug einholen – sie ist formfrei, beweishalber schriftlich festhalten; verweigern darf der Hauptvermieter nur aus den Gründen von Art. 262 Abs. 2 OR.');
    }
    // G-M – Missbräuchlicher Untermietzins (Art. 262 Abs. 2 lit. b OR): nur
    // Vergleich + Begründungspflicht, KEIN gerechneter Höchstzins (§2 – die
    // zulässige Aufschlagshöhe ist Würdigung).
    const um = zahl(a.mietzinsNettoCHF);
    const hm = zahl(a.hmMietzinsCHF);
    if (um !== null && hm !== null && um > hm && !a.mehrleistungBegruendung?.trim()) {
      warnungen.push(`Der Untermietzins (CHF ${fmtCHF(a.mietzinsNettoCHF)}) liegt über dem ${a.untermieteUmfang === 'teilweise' ? 'anteilig zu bestimmenden ' : ''}Hauptmietzins (CHF ${fmtCHF(a.hmMietzinsCHF!)}): Ein Aufschlag ist nur zulässig, soweit ihn MEHRLEISTUNGEN (Möblierung, Nebenleistungen) rechtfertigen (Art. 262 Abs. 2 lit. b OR; Gewinnverbot, BGE 119 II 353 – zu verifizieren) – sonst kann der Hauptvermieter die Zustimmung verweigern. Begründung im Feld «Mehrleistungen» erfassen; Praxis-Richtwert: Aufschläge über rund 50 % gelten ohne Mehrleistungen als missbräuchlich (kein gesetzlicher Satz, zu verifizieren).`);
    }
    if (a.untermieteUmfang === 'teilweise' && !a.untermieteZimmerBeschrieb?.trim()) {
      warnungen.push('Teilweise Untermiete: Die überlassenen Räume und die Mitbenutzung (Küche/Bad/Nebenräume) genau umschreiben – massgeblich für Gebrauchsumfang und Mietzinsvergleich.');
    }
    if (a.moebliert) {
      hinweise.push('Möbliertes Zimmer: Für die Kündigung gilt die verkürzte Frist von zwei Wochen auf Ende einer einmonatigen Mietdauer (Art. 266e OR).');
    }
    hinweise.push('Endet der HAUPTMIETVERTRAG, hat der Untermieter keinen Anspruch auf Eintritt und keinen Erstreckungsanspruch gegen den Hauptvermieter; der Untermietvertrag endet dadurch nicht automatisch und ist eigenständig zu kündigen – der Untervermieter kann schadenersatzpflichtig werden.');
    hinweise.push('Die Formularpflicht für den Anfangsmietzins (Art. 270 Abs. 2 OR) gilt in den Formularpflicht-Kantonen AUCH für den Untermietzins; die Vermieterkündigung des Untervermieters braucht das amtliche Formular (Art. 266l Abs. 2 OR).');
    hinweise.push('Nicht geeignet für Pacht/Unterpacht (Art. 291 OR) und nicht zu verwechseln mit der ÜBERTRAGUNG der Geschäftsmiete auf einen Dritten (Art. 263 OR – schriftliche Zustimmung, Parteiwechsel).');
  }

  // Standard-Disclosures
  hinweise.push(`Mietzins-Basis: hypothekarischer Referenzzinssatz ${MV_PARAMETER.referenzzinssatz.wert.toFixed(2)} % (Stand ${MV_PARAMETER.referenzzinssatz.stand}) – Basis künftiger Anpassungen (Art. 269a lit. b OR, Art. 13 VMWG); quartalsweise publiziert, vor Verwendung prüfen.`);
  if (wohnung) {
    hinweise.push('Der Mieter kann den Anfangsmietzins innert 30 Tagen nach Übernahme anfechten (Art. 270 OR); ein vertraglicher Ausschluss der Herabsetzung wäre nichtig (BGE 125 III 358 – zu verifizieren).');
  }
  hinweise.push('Streitigkeiten: obligatorische, kostenlose Schlichtung am Ort der gelegenen Sache (Art. 33/197/200 ZPO); auf diesen Gerichtsstand kann der Mieter nicht im Voraus verzichten (Art. 35 ZPO).');

  return { blocker, warnungen, hinweise };
}

// ── Schema (Bausteine) ──────────────────────────────────────────────────────

export const MV_SCHEMA: VorlageSchema = {
  id: 'mietvertrag',
  version: '1.2.0 (Rechtsstand OR Art. 253 ff./VMWG; + Untermiete 6.6.2026: Art. 262 GELTENDE Fassung – Revision in der Volksabstimmung 24.11.2024 abgelehnt)',
  titel: 'Mietvertrag',
  format: 'vertrag',
  disclaimer:
    'Entwurf – erstellt mit LexMetrik. Keine Rechtsberatung. Der Mietvertrag ist formfrei gültig; ' +
    'Index- und Staffelmiete bedürfen der Schriftform – die beidseitige Unterzeichnung erfüllt sie. ' +
    'Kantonale Formularpflichten für den Anfangsmietzins (Art. 270 Abs. 2 OR) sind zusätzlich zu ' +
    'beachten; massgeblich sind Gesetz (OR/VMWG) und der konkrete Einzelfall.',
  bausteine: [
    { id: 'M01_parteien', rolle: 'parteien',
      text: 'zwischen\n\n{{vermieterBlock}}\n(Vermieter)\n\nund\n\n{{mieterBlock}}\n(Mieter)',
      begruendung: 'Bezeichnung der Vertragsparteien – immer enthalten.',
      norm: 'Art. 253 OR' },
    // ── Untermiete-Bausteine (Ausbau 6.6.2026, Art. 262 OR geltende Fassung) ──
    { id: 'U01_praeambel', ueberschrift: 'Untermietverhältnis',
      text: 'Der Untervermieter ist Hauptmieter der Mietsache gemäss Hauptmietvertrag mit {{hmVermieterName}} (Hauptvermieter){{hmDatumSatz}}{{hmMietzinsSatz}}. Mit diesem Vertrag vermietet er die Mietsache {{untermieteUmfangWort}} unter (Art. 262 OR).{{mehrleistungSatz}}',
      includeIf: { feld: 'istUntermiete', eq: true }, nummeriert: true,
      begruendung: 'Präambel mit Hauptmietvertrag-Referenz – verankert das Untermietverhältnis und die Vergleichsgrösse für Art. 262 Abs. 2 lit. b.',
      norm: 'Art. 262 OR' },
    { id: 'U02_zustimmung', ueberschrift: 'Zustimmung des Hauptvermieters',
      text: 'Der Hauptvermieter hat der Untervermietung zugestimmt{{zustimmungDatumSatz}} (Art. 262 Abs. 1 OR). Die Zustimmung ist formfrei gültig; ihre schriftliche Festhaltung dient dem Beweis.',
      includeIf: { feld: 'zustimmungVorhanden', eq: true }, nummeriert: true,
      begruendung: 'Zustimmungs-Klausel – nur wenn die Zustimmung erteilt ist (sonst greift die Gate-Warnung G-Z).',
      norm: 'Art. 262 Abs. 1 OR' },
    { id: 'M02_objekt', ueberschrift: 'Mietobjekt',
      text: 'Vermietet wird: {{objektBeschrieb}}, {{objektAdresse}}.{{untermieteTeilSatz}}{{nebenraeumeSatz}}{{zweckSatz}} Der Zustand des Mietobjekts wird bei der Übergabe in einem gemeinsamen Protokoll festgehalten.',
      nummeriert: true,
      begruendung: 'Mietobjekt mit Beschrieb, Nebenräumen und Zweck – immer enthalten.',
      norm: 'Art. 253 OR' },
    { id: 'M03_beginn_unbefristet', ueberschrift: 'Mietbeginn und Dauer',
      text: 'Das Mietverhältnis beginnt am {{beginnFmt}} und läuft auf unbestimmte Zeit.{{mindestdauerSatz}}',
      includeIf: { feld: 'befristet', eq: false }, nummeriert: true,
      begruendung: 'Unbefristetes Mietverhältnis.',
      norm: 'Art. 255 OR' },
    { id: 'M03_beginn_befristet', ueberschrift: 'Mietbeginn und Dauer',
      text: 'Das Mietverhältnis beginnt am {{beginnFmt}} und endet am {{befristetBisFmt}}, ohne dass es einer Kündigung bedarf. Wird es danach stillschweigend fortgesetzt, gilt es als unbefristetes Mietverhältnis.',
      includeIf: { feld: 'befristet', eq: true }, nummeriert: true,
      begruendung: 'Befristetes Mietverhältnis (endet ohne Kündigung; stillschweigende Fortsetzung → unbefristet).',
      norm: 'Art. 255 OR' },
    { id: 'M04_mietzins', ueberschrift: 'Mietzins und Nebenkosten',
      text: 'Der monatliche Nettomietzins beträgt CHF {{nettoFmt}}.{{nkSatz}} Mietzins und Nebenkosten sind monatlich im Voraus, jeweils auf den Ersten des Monats, zu bezahlen.{{refZinsSatz}}',
      nummeriert: true,
      begruendung: 'Nettomietzins, Nebenkosten-Modus und Referenzzins-Basis (Grundlage künftiger Anpassungen) – immer enthalten.',
      norm: 'Art. 257 OR' },
    { id: 'M04b_nkliste',
      text: '– {{item.label}}',
      includeIf: { feld: 'nkListe', nichtLeer: true },
      wiederholeUeber: 'nkListe',
      begruendung: 'Nebenkosten-Positionen einzeln aufgeführt (Pauschalverweis genügt nicht).',
      norm: 'Art. 257a OR' },
    { id: 'M05_index', ueberschrift: 'Indexmiete',
      text: 'Der Nettomietzins ist an den Landesindex der Konsumentenpreise (LIK) gebunden; Basis ist der Indexstand von {{indexBasisMonat}}{{indexBasisPunkteSatz}}. Eine Anpassung kann höchstens im Umfang der Veränderung des Indexes verlangt werden und ist mit einer Frist von 30 Tagen auf einen Monatsanfang anzukündigen (Art. 17 VMWG). Diese Vereinbarung setzt die feste Vertragsdauer von mindestens fünf Jahren gemäss Ziffer «Mietbeginn und Dauer» voraus; andere Anpassungsgründe sind während der Indexbindung ausgeschlossen.',
      includeIf: { feld: 'mietzinsModell', eq: 'index' }, nummeriert: true,
      begruendung: 'Indexmiete (Schriftform durch diesen Vertrag erfüllt; nur LIK).',
      norm: 'Art. 269b OR',
      hinweis: 'Nur gültig bei Vertragsdauer von mindestens fünf Jahren; Mischklauseln sind unzulässig.' },
    { id: 'M05_staffel', ueberschrift: 'Staffelmiete',
      text: 'Der Nettomietzins erhöht sich wie folgt (höchstens einmal jährlich, Beträge in Franken):',
      includeIf: { feld: 'mietzinsModell', eq: 'staffel' }, nummeriert: true,
      begruendung: 'Staffelmiete (Schriftform durch diesen Vertrag erfüllt).',
      norm: 'Art. 269c OR',
      hinweis: 'Nur gültig bei Vertragsdauer von mindestens drei Jahren; während der Staffelung keine anderen Anpassungen.' },
    { id: 'M05b_staffelliste',
      text: '– ab {{item.abFmt}}: Erhöhung um CHF {{item.erhoehungFmt}} pro Monat',
      includeIf: { feld: 'staffelListe', nichtLeer: true },
      wiederholeUeber: 'staffelListe',
      begruendung: 'Je Staffel eine Zeile (Datum + Frankenbetrag).',
      norm: 'Art. 269c OR' },
    { id: 'M05c_mietzinsvorbehalt', ueberschrift: 'Mietzinsvorbehalt',
      text: 'Der Vermieter macht die ihm zustehende Mietzinsanpassung nicht vollständig geltend und behält sich eine spätere Erhöhung im Umfang von {{vorbehaltProzentText}} % des Nettomietzinses vor{{vorbehaltGrundSatz}}. Der Vorbehalt ist in Prozenten des Mietzinses festgelegt (Art. 18 VMWG).',
      includeIf: { feld: 'mietzinsvorbehaltZeigen', eq: true }, nummeriert: true,
      begruendung: 'Mietzinsvorbehalt bei unvollständiger Mietzinsanpassung, in Prozenten beziffert (Art. 18 VMWG) – Detailgrad «experte».',
      norm: 'Art. 18 VMWG',
      hinweis: 'Ohne ziffernmässige Festlegung in Franken oder Prozenten geht der Vorbehalt verloren (Art. 18 VMWG).' },
    { id: 'M06_kaution', ueberschrift: 'Sicherheitsleistung',
      text: 'Der Mieter leistet eine Sicherheit von CHF {{kautionFmt}}{{kautionMonateSatz}}. Der Vermieter hinterlegt die Sicherheit bei einer Bank auf einem Sparkonto oder Depot, das auf den Namen des Mieters lautet. Macht der Vermieter innert eines Jahres nach Beendigung des Mietverhältnisses keinen Anspruch gegenüber dem Mieter geltend, kann dieser die Rückerstattung verlangen.',
      includeIf: { feld: 'kautionZeigen', eq: true }, nummeriert: true,
      begruendung: 'Kaution mit zwingender Hinterlegung auf Mietername und Rückgaberegel.',
      norm: 'Art. 257e OR' },
    { id: 'M06b_zahlungsverzug', ueberschrift: 'Zahlungsverzug',
      text: 'Ist der Mieter mit der Zahlung von Mietzins oder Nebenkosten im Rückstand, kann ihm der Vermieter schriftlich eine Zahlungsfrist von mindestens 30 Tagen setzen und ihm für den Fall der Nichtzahlung die Kündigung androhen; bezahlt der Mieter innert Frist nicht, kann der Vermieter mit einer Frist von mindestens 30 Tagen auf das Ende eines Monats kündigen. Bei einer Familienwohnung sind Fristansetzung und Androhung dem Ehegatten bzw. der eingetragenen Partnerin/dem eingetragenen Partner separat zuzustellen.',
      includeIf: AB_STANDARD, nummeriert: true,
      begruendung: 'Zahlungsverzugs-Folge (deklaratorisch; Art. 257d OR) – ab «standard» (in «einfach» ausgeblendet, da Art. 257d ohnehin gilt).',
      norm: 'Art. 257d OR' },
    { id: 'M07_unterhalt', ueberschrift: 'Unterhalt und Mängel',
      text: 'Der Vermieter erhält das Mietobjekt in einem zum vorausgesetzten Gebrauch tauglichen Zustand. Der Mieter trägt den kleinen Unterhalt, d. h. Reinigungen und Ausbesserungen, die für den gewöhnlichen Gebrauch erforderlich sind und die er ohne besonderen Aufwand selbst vornehmen kann. Mängel sind dem Vermieter unverzüglich zu melden; die gesetzlichen Mängelrechte des Mieters bleiben vorbehalten.',
      nummeriert: true,
      begruendung: 'Erhaltungspflicht (relativ zwingend) und kleiner Unterhalt in den gesetzlichen Schranken – immer enthalten.',
      norm: 'Art. 256 OR' },
    { id: 'M07b_duldung', ueberschrift: 'Duldung von Arbeiten und Besichtigungen',
      text: 'Der Mieter duldet Arbeiten an der Mietsache, wenn sie zur Beseitigung von Mängeln oder zur Behebung oder Vermeidung von Schäden notwendig sind, und gestattet dem Vermieter die Besichtigung, soweit dies für Unterhalt, Verkauf oder Wiedervermietung notwendig ist. Der Vermieter kündigt Arbeiten und Besichtigungen rechtzeitig an und nimmt bei der Durchführung auf die Interessen des Mieters Rücksicht; allfällige Ansprüche des Mieters auf Herabsetzung des Mietzinses und auf Schadenersatz bleiben vorbehalten (Art. 257h OR).',
      includeIf: NUR_EXPERTE, nummeriert: true,
      begruendung: 'Duldungspflicht für Arbeiten/Besichtigungen mit Ankündigung und Rücksichtnahme (Art. 257h OR) – Detailgrad «experte».',
      norm: 'Art. 257h OR' },
    { id: 'M08_gebrauch', ueberschrift: 'Gebrauch, Untermiete und bauliche Änderungen',
      text: 'Der Mieter gebraucht das Mietobjekt sorgfältig und nimmt Rücksicht auf Hausbewohner und Nachbarn.{{untermieteSatz}} Erneuerungen und Änderungen am Mietobjekt durch den Mieter bedürfen der schriftlichen Zustimmung des Vermieters; hat der Vermieter zugestimmt, kann er die Wiederherstellung des früheren Zustands nur verlangen, wenn dies schriftlich vereinbart wurde. Weist das Mietobjekt bei Mietende dank solcher Arbeiten einen erheblichen Mehrwert auf, kann der Mieter dafür eine entsprechende Entschädigung verlangen (Art. 260a Abs. 3 OR).{{tierhaltungSatz}}{{hausordnungSatz}}',
      nummeriert: true,
      begruendung: 'Sorgfaltspflicht, Untermiete (gesetzliche Verweigerungsgründe) und Art. 260a – immer enthalten.',
      norm: 'Art. 262 OR' },
    { id: 'U03_gebrauch_haftung', ueberschrift: 'Gebrauchsumfang und Haftung gegenüber dem Hauptvermieter',
      text: 'Der Untermieter darf die Mietsache nur in dem Umfang gebrauchen, der dem Untervermieter nach dem Hauptmietvertrag gestattet ist. Der Untervermieter haftet dem Hauptvermieter dafür, dass der Untermieter die Sache nicht anders gebraucht, als es ihm selbst gestattet ist; der Hauptvermieter kann den Untermieter unmittelbar dazu anhalten (Art. 262 Abs. 3 OR). Eine Weitervermietung durch den Untermieter bedarf der Zustimmung des Untervermieters.',
      includeIf: { feld: 'istUntermiete', eq: true }, nummeriert: true,
      begruendung: 'Gebrauchskopplung an den Hauptmietvertrag und Haftungskette nach Art. 262 Abs. 3 – bei Untermiete immer enthalten.',
      norm: 'Art. 262 Abs. 3 OR' },
    { id: 'U04_endigung_hauptmiete', ueberschrift: 'Hinweis: Ende des Hauptmietvertrags',
      text: 'Die Parteien nehmen zur Kenntnis: Endet der Hauptmietvertrag, kann der Untervermieter dem Untermieter den weiteren Gebrauch nicht mehr verschaffen. Der Untermieter hat keinen Anspruch, in den Hauptmietvertrag einzutreten, und keinen Erstreckungsanspruch gegen den Hauptvermieter. Dieser Untermietvertrag endet dadurch jedoch nicht automatisch; er ist eigenständig form- und fristgerecht zu kündigen (Art. 266a ff. OR). Der Untervermieter kann gegenüber dem Untermieter schadenersatzpflichtig werden.',
      includeIf: { feld: 'istUntermiete', eq: true }, nummeriert: true,
      begruendung: 'Endigungs-Kopplung als WARN-Baustein – rechtlich keine automatische Auflösung (bewusst keine auflösende Bedingung, Dossier §1.4).',
      norm: 'Art. 262 OR' },
    { id: 'M09_versicherung', ueberschrift: 'Versicherung',
      text: '{{versicherungText}}',
      includeIf: { feld: 'versicherungspflicht', eq: true }, nummeriert: true,
      begruendung: 'Haftpflichtversicherung des Mieters (übliche Klausel).',
      norm: 'Art. 257f OR' },
    { id: 'M10_mwst', ueberschrift: 'Mehrwertsteuer',
      text: 'Der Vermieter optiert für die Versteuerung der Mietzinseinnahmen (Art. 22 MWSTG). Der Mieter schuldet zusätzlich zum Mietzins und zu den Nebenkosten die gesetzliche Mehrwertsteuer zum jeweils geltenden Satz (zurzeit {{mwstSatz}} %); Satzänderungen berechtigen zur entsprechenden Anpassung.',
      includeIf: { feld: 'mwstZeigen', eq: true }, nummeriert: true,
      begruendung: 'MWST-Option (nur Geschäftsraum; bei reiner Wohnnutzung ausgeschlossen).',
      norm: 'Art. 22 MWSTG' },
    { id: 'M11_konkurrenzschutz', ueberschrift: 'Konkurrenzschutz',
      text: 'Der Vermieter verpflichtet sich, in der gleichen Liegenschaft keine Räume an direkte Konkurrenten des Mieters im folgenden Bereich zu vermieten: {{konkurrenzschutzText}}.{{ksStrafeSatz}}',
      includeIf: { feld: 'konkurrenzschutzZeigen', eq: true }, nummeriert: true,
      begruendung: 'Konkurrenzschutz ist nicht vertragsimmanent – ausdrücklich vereinbart und umschrieben.',
      norm: 'Art. 253 OR',
      hinweis: 'Gesetzlich nicht spezifisch geregelt; Reichweite vor Verwendung anwaltlich prüfen.' },
    { id: 'M12_kuendigung', ueberschrift: 'Kündigung',
      text: '{{kuendigungText}} Die Kündigung bedarf der Schriftform; der Vermieter kündigt mit dem vom Kanton genehmigten amtlichen Formular, sonst ist die Kündigung nichtig.{{familienwohnungSatz}} Vorbehalten bleiben die ausserordentlichen Kündigungsgründe des Gesetzes.',
      includeIf: { feld: 'befristet', eq: false }, nummeriert: true,
      begruendung: 'Kündigungsfristen/-termine und zwingende Formvorschriften (Art. 266l–266o OR).',
      norm: 'Art. 266l OR' },
    { id: 'M13_rueckgabe', ueberschrift: 'Rückgabe',
      text: 'Bei Beendigung des Mietverhältnisses gibt der Mieter das Mietobjekt in dem Zustand zurück, der sich aus vertragsgemässem Gebrauch ergibt. Über die Rückgabe wird ein gemeinsames Protokoll erstellt; der Vermieter prüft den Zustand sofort und meldet Mängel, für die der Mieter einzustehen hat, umgehend.',
      nummeriert: true,
      begruendung: 'Rückgabe und sofortige Prüf-/Rügeobliegenheit des Vermieters – immer enthalten.',
      norm: 'Art. 267 OR' },
    { id: 'M14_schluss', ueberschrift: 'Schlussbestimmungen',
      text: 'Änderungen und Ergänzungen dieses Vertrags bedürfen der Schriftform, soweit das Gesetz nichts anderes zulässt. Dieser Vertrag wird in zwei Exemplaren ausgefertigt; jede Partei erhält ein unterzeichnetes Exemplar. Streitigkeiten aus diesem Vertrag werden zunächst der Schlichtungsbehörde am Ort des Mietobjekts unterbreitet. Im Übrigen gelten die Bestimmungen des Obligationenrechts (Art. 253 ff. OR) und der VMWG.',
      nummeriert: true,
      begruendung: 'Schriftformvorbehalt, Schlichtung am Ort der Sache, Gesetzesverweis – immer enthalten.',
      // §7-Korrektur 14.6.2026: vormals Art. 274 ff. OR – die mietrechtlichen
      // Verfahrensartikel sind mit der ZPO (1.1.2011) aufgehoben; die
      // Schlichtung am Ort der gelegenen Sache richtet sich nach der ZPO.
      norm: 'Art. 33 ZPO' },
    { id: 'M15_unterschriften', rolle: 'unterschrift',
      text: '{{ort}}, {{datumFmt}}\n\n\nDer Vermieter:\n\n___________________________\n{{vermieterName}}\n\n\nDer Mieter / Die Mieter:\n\n___________________________\n{{mieterUnterschrift}}{{zweiteUnterschriftSatz}}',
      begruendung: 'Ort, Datum und Unterschriften – erfüllt die Schriftform der formbedürftigen Klauseln.',
      norm: 'Art. 255 OR' },
  ],
};

// ── Zusammenstellen ─────────────────────────────────────────────────────────

export function mvZusammenstellen(a: MvAntworten) {
  const wohnung = a.objektTyp === 'wohnung';
  // Untermiete-Ausbau 6.6.2026 (Dossier untermietvertrag.md): Default
  // 'hauptmiete' hält das bisherige Verhalten byte-identisch (§6, golden).
  const untermiete = a.mietverhaeltnis === 'untermiete';
  const zustimmungVorhanden = untermiete
    && (a.zustimmungStatus === 'schriftlich' || a.zustimmungStatus === 'muendlich');
  const netto = zahl(a.mietzinsNettoCHF);
  const kaution = zahl(a.kautionCHF);
  const fristMin = mvGesetzlicheFrist(a.objektTyp);
  const frist = a.kuendigungsfristMonate ?? fristMin;

  const nkSatz = a.nebenkosten === 'keine'
    ? ' Sämtliche Nebenkosten sind im Mietzins inbegriffen.'
    : a.nebenkosten === 'akonto'
      ? ` Zusätzlich leistet der Mieter monatliche Akontozahlungen von CHF ${a.nebenkostenCHF ? fmtCHF(a.nebenkostenCHF) : '________'} an die folgenden Nebenkosten (jährliche Abrechnung):`
      : ` Zusätzlich bezahlt der Mieter eine monatliche Nebenkosten-Pauschale von CHF ${a.nebenkostenCHF ? fmtCHF(a.nebenkostenCHF) : '________'} für die folgenden Positionen:`;

  const tierhaltungSatz = a.tierhaltung === 'erlaubt'
    ? ' Die Tierhaltung ist gestattet.'
    : a.tierhaltung === 'kleintiere'
      ? ' Übliche Kleintiere dürfen frei gehalten werden; übrige Haustiere bedürfen der Zustimmung des Vermieters.'
      : ' Die Haltung von Haustieren bedarf der vorgängigen Zustimmung des Vermieters.';

  const kuendigungText = `Das Mietverhältnis kann von beiden Parteien mit einer Frist von ${frist} Monaten auf einen ortsüblichen Termin, mangels Ortsüblichkeit auf das Ende einer dreimonatigen Mietdauer, gekündigt werden${frist > fristMin ? ' (vertraglich verlängerte Frist)' : ''}.`;

  const staffelListe = (a.staffeln ?? [])
    .filter((s) => s.ab && zahl(s.erhoehungCHF) !== null)
    .map((s) => ({ abFmt: fmtDatum(s.ab), erhoehungFmt: fmtCHF(s.erhoehungCHF) }));

  const antworten: Antworten = {
    ...a,
    vermieterBlock: [a.vermieterName, a.vermieterAdresse].filter(Boolean).join('\n'),
    mieterBlock: [
      [a.mieterName, a.zweiterMieterName].filter(Boolean).join(' und '),
      a.mieterAdresse,
      ...(a.zweiterMieterName ? ['(beide haften solidarisch für sämtliche Verpflichtungen aus diesem Vertrag, Art. 143 ff. OR)'] : []),
    ].filter(Boolean).join('\n'),
    objektBeschrieb: a.objektBeschrieb || '________',
    nebenraeumeSatz: a.nebenraeume?.trim() ? ` Mitvermietet sind: ${a.nebenraeume.trim()}.` : '',
    zweckSatz: wohnung
      ? ' Das Mietobjekt dient zu Wohnzwecken.'
      : ` Das Mietobjekt dient ausschliesslich zum folgenden Zweck: ${a.mietzweck?.trim() || '________'}; eine Zweckänderung bedarf der schriftlichen Zustimmung des Vermieters.`,
    beginnFmt: fmtDatum(a.beginn),
    befristetBisFmt: fmtDatum(a.befristetBis),
    mindestdauerSatz: !a.befristet && (a.mindestdauerJahre ?? 0) > 0
      ? ` Es ist beidseitig erstmals nach Ablauf von ${a.mindestdauerJahre === 1 ? 'einem Jahr' : `${a.mindestdauerJahre} Jahren`} kündbar (feste Erstlaufzeit; die ausserordentliche Kündigung aus wichtigen Gründen nach Art. 266g OR bleibt vorbehalten).`
      : '',
    nettoFmt: a.mietzinsNettoCHF ? fmtCHF(a.mietzinsNettoCHF) : '________',
    nkSatz,
    nkListe: a.nebenkosten === 'keine' ? [] : a.nkPositionen.map((label) => ({ label })),
    // Referenzzins-Basis NUR im Standard-Modell – bei Index-/Staffelmiete
    // sind andere Anpassungsgründe ausgeschlossen (Vertiefungs-Gutachten
    // 5.6.2026: der Satz wäre dort materiell falsch).
    refZinsSatz: a.mietzinsModell === 'standard'
      ? ` Der Mietzins basiert auf dem hypothekarischen Referenzzinssatz von ${MV_PARAMETER.referenzzinssatz.wert.toFixed(2)} % (Stand ${MV_PARAMETER.referenzzinssatz.stand}).`
      : '',
    indexBasisMonat: a.indexBasisMonat?.trim() || '________',
    indexBasisPunkteSatz: a.indexBasisPunkte?.trim() ? ` (${a.indexBasisPunkte.trim()} Punkte)` : '',
    staffelListe,
    kautionZeigen: kaution !== null && kaution > 0,
    kautionFmt: a.kautionCHF ? fmtCHF(a.kautionCHF) : '________',
    kautionMonateSatz: (() => {
      const nkZ = a.nebenkosten !== 'keine' ? (zahl(a.nebenkostenCHF) ?? 0) : 0;
      const bruttoZ = netto !== null ? netto + nkZ : null;
      return kaution !== null && bruttoZ !== null && bruttoZ > 0
        ? ` (entspricht ${Math.round((kaution / bruttoZ) * 10) / 10} ${nkZ > 0 ? 'Brutto-' : ''}Monatszinsen${wohnung ? '; gesetzliches Maximum drei' : ''})`
        : '';
    })(),
    tierhaltungSatz,
    hausordnungSatz: a.hausordnung ? ' Die Hausordnung bildet einen integrierenden Bestandteil dieses Vertrags.' : '',
    versicherungText: wohnung
      ? 'Der Mieter schliesst eine Privathaftpflichtversicherung ab, die Mieterschäden deckt, und hält sie während der Mietdauer aufrecht.'
      : 'Der Mieter schliesst eine Betriebshaftpflichtversicherung ab, die Mieterschäden deckt, und hält sie während der Mietdauer aufrecht.',
    mwstZeigen: !wohnung && !!a.mwstOption,
    mwstSatz: MV_PARAMETER.mwstSatz.wert.toFixed(1),
    konkurrenzschutzZeigen: !wohnung && !!a.konkurrenzschutz && !!a.konkurrenzschutzText?.trim(),
    konkurrenzschutzText: a.konkurrenzschutzText?.trim() ?? '',
    ksStrafeSatz: zahl(a.konkurrenzschutzStrafeCHF)
      ? ` Bei Verletzung dieser Pflicht schuldet der Vermieter dem Mieter eine Konventionalstrafe von CHF ${fmtCHF(a.konkurrenzschutzStrafeCHF!)} je Verletzungsfall; der Ersatz weiteren Schadens bleibt vorbehalten.`
      : '',
    mietzinsvorbehaltZeigen: a.detailgrad === 'experte' && !!a.mietzinsvorbehalt && zahl(a.vorbehaltProzent) !== null,
    vorbehaltProzentText: zahl(a.vorbehaltProzent) !== null ? String(zahl(a.vorbehaltProzent)) : '________',
    vorbehaltGrundSatz: a.vorbehaltGrund?.trim() ? ` (Grund: ${a.vorbehaltGrund.trim()})` : '',
    kuendigungText,
    familienwohnungSatz: wohnung && a.familienwohnung
      ? ' Das Mietobjekt dient als Familienwohnung; die besonderen Schutzbestimmungen (Art. 266m–266n OR) sind zu beachten.'
      : '',
    mieterUnterschrift: a.mieterName || '________',
    zweiteUnterschriftSatz: a.zweiterMieterName
      ? `\n\n\n___________________________\n${a.zweiterMieterName}`
      : '',
    datumFmt: fmtDatumLang(a.datum),
    // ── Untermiete-Platzhalter (alle leer/false bei Hauptmiete) ──
    istUntermiete: untermiete,
    zustimmungVorhanden,
    hmVermieterName: a.hmVermieterName?.trim() || '________',
    hmDatumSatz: untermiete && a.hmDatum ? ` vom ${fmtDatum(a.hmDatum)}` : '',
    hmMietzinsSatz: untermiete && zahl(a.hmMietzinsCHF) !== null
      ? ` (Hauptmietzins netto CHF ${fmtCHF(a.hmMietzinsCHF!)} pro Monat)` : '',
    untermieteUmfangWort: a.untermieteUmfang === 'teilweise' ? 'teilweise' : 'ganz',
    mehrleistungSatz: untermiete && a.mehrleistungBegruendung?.trim()
      ? ` Der Untermietzins berücksichtigt folgende Mehrleistungen des Untervermieters (Art. 262 Abs. 2 lit. b OR): ${a.mehrleistungBegruendung.trim()}.`
      : '',
    zustimmungDatumSatz: zustimmungVorhanden && a.zustimmungDatum ? ` am ${fmtDatum(a.zustimmungDatum)}` : '',
    untermieteTeilSatz: untermiete && a.untermieteUmfang === 'teilweise'
      ? ` Die Untermiete umfasst: ${a.untermieteZimmerBeschrieb?.trim() || '________'}.`
      : '',
    // M08-Untermiete-Satz: bei Hauptmiete der bisherige Wortlaut (byte-
    // identisch); im Untermietvertrag übernimmt U03 (262 Abs. 3).
    untermieteSatz: untermiete
      ? ''
      : ' Untervermietung bedarf der Zustimmung des Vermieters; dieser kann sie nur aus den gesetzlichen Gründen verweigern.',
  };

  const ergebnis = assemble(MV_SCHEMA, antworten);
  if (!untermiete) return ergebnis;

  // ── Rollen-Parametrisierung Untermiete (Darstellungsebene, §3) ──
  // Zentral statt 26 Baustein-Duplikate: «Vermieter»→«Untervermieter»,
  // «Mieter»→«Untermieter» (Wortanfang gross; «Hauptvermieter»/«Untermieter»
  // in den U-Bausteinen bleiben unberührt, da dort klein eingebettet).
  // Nur das ganze Rollenwort «Mieter»/«Mieters» (S3c-a, W2·30-RL-W1):
  // «Mieterschäden» ist der Versicherungsbegriff und bleibt stehen.
  const rollen = (t: string) => t.replace(/Vermieter/g, 'Untervermieter').replace(/\bMieter(s?)\b/g, 'Untermieter$1');
  return {
    ...ergebnis,
    dokument: {
      ...ergebnis.dokument,
      titel: 'Untermietvertrag',
      absaetze: ergebnis.dokument.absaetze.map((abs) => ({
        ...abs,
        ...(abs.text ? { text: rollen(abs.text) } : {}),
        ...(abs.ueberschrift ? { ueberschrift: rollen(abs.ueberschrift) } : {}),
      })),
      disclaimer: rollen(ergebnis.dokument.disclaimer) +
        ' Untermietverhältnis: Die Zustimmung des Hauptvermieters (Art. 262 OR) und das Schicksal bei Ende des Hauptmietvertrags sind besonders zu beachten.',
    },
  };
}
