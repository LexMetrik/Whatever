// Dossier: bibliothek/recherche/wettbewerbsanalyse-rechtswissen-schweizer-vertraege.md
import type { VorlageSchema, Antworten } from './engine';
import { assemble } from './engine';
import { fmtCHF, zahl, fmtIsoStrict } from './datum';
import { type Detailgrad, DETAILGRAD_DEFAULT, AB_STANDARD, NUR_EXPERTE } from './detailgrad';

// ─── Werkvertrag (Art. 363 ff. OR) ──────────────────────────────────────────
//
// P1-Grundtyp der Wettbewerbsanalyse 12.6.2026 (FAHRPLAN-VORLAGEN-AUSBAU V3):
// zweiter fehlender Grundtyp der Verträge-Sektion. EIN Schema mit Modulen
// (Pauschal-/Aufwandpreis, Abnahmeprotokoll) und der zentralen Weiche
// beweglich/unbeweglich, die Rügefrist (Art. 367 Abs. 1bis) und Verjährung
// (Art. 371) bestimmt.
//
// Wortlaute am Filestore-Cache verifiziert (13.6.2026, OR-Konsolidierung
// 20260101):
// - Art. 363 (Herstellung gegen Vergütung).
// - Art. 366 (Rücktritt bei Verzug; Nachfrist bei voraussehbarer Mangel-
//   haftigkeit).
// - Art. 367 Abs. 1 (Prüfung + Mängelrüge nach Ablieferung), Abs. 1bis
//   (unbewegliches Werk: Rügefrist 60 Tage; kürzere Vereinbarung UNWIRKSAM).
// - Art. 368 (Mängelrechte: Wandelung/Minderung/Nachbesserung).
// - Art. 370 Abs. 2/3 (stillschweigende Genehmigung bei unterlassener Prüfung;
//   verdeckte Mängel sofort nach Entdeckung anzeigen).
// - RL-39 (VC-01/VC-02, Prüfung Rechtslogik 23.9.2026), Wortlaute am
//   Fedlex-Filestore neu abgerufen 25.9.2026 (OR-Konsolidierung 20260101,
//   in Kraft 1.1.–30.9.2026; die bereits publizierten Folgefassungen
//   20261001 und 20270701 sind in Art. 367/368/370/371 wortgleich):
//   Art. 370 Abs. 4 OR: «Mängel eines unbeweglichen Werks, die bei der
//   Abnahme und ordnungsmässigen Prüfung nicht erkennbar waren, sind innert
//   60 Tagen nach ihrer Entdeckung anzuzeigen. Die Vereinbarung kürzerer
//   Fristen ist unwirksam. Dasselbe gilt für die folgenden Mängel eines
//   Werks, die die Mangelhaftigkeit eines unbeweglichen Werks verursacht
//   haben: a. Mängel eines beweglichen Werks, das bestimmungsgemäss in das
//   unbewegliche Werk integriert worden ist; b. Mängel eines Werks, das von
//   einem Architekten oder Ingenieur erstellt und bestimmungsgemäss als
//   Grundlage für die Erstellung des unbeweglichen Werks verwendet worden
//   ist.» Art. 367 Abs. 1bis OR trägt dieselben lit. a/b für die Rügefrist.
//   → «sofort» (Art. 370 Abs. 3) gilt nur noch für das rein bewegliche Werk;
//   das bewegliche Werk mit Bauwerk-Bezug (Feld `bauwerkBezug`) bekommt für
//   bauwerkskausale Mängel die 60 Tage.
//   Art. 368 Abs. 3 OR: «Bei Werken, die auf dem Grund und Boden des
//   Bestellers errichtet sind und ihrer Natur nach nur mit unverhältnis-
//   mässigen Nachteilen entfernt werden können, stehen dem Besteller nur die
//   im zweiten Absatz dieses Artikels genannten Rechte zu.» Art. 368
//   Abs. 2bis OR: Einschränkung/Ausschluss der unentgeltlichen Verbesserung
//   zum Voraus «ist ungültig, wenn der Mangel eine Baute betrifft».
// - Art. 371 Abs. 1 (Verjährung 2 Jahre; 5 Jahre für in unbewegliche Werke
//   integrierte bewegliche Werke), Abs. 2 (unbewegliches Werk: 5 Jahre).
// - Art. 372 Abs. 1 (Vergütung bei Ablieferung fällig).
// - Art. 373 Abs. 1 (Festpreis bindet, keine Erhöhung), Abs. 2 (richterliche
//   Anpassung bei ausserordentlichen Umständen).
// - Art. 377 (Besteller kann jederzeit gegen volle Schadloshaltung zurück-
//   treten, solange das Werk unvollendet ist).
//
// Fachliche Festlegung (§8): Die Rügefrist-Schranke (60 Tage zwingend beim
// unbeweglichen Werk) und das Rücktrittsrecht nach Art. 377 werden offengelegt,
// nicht wegbedungen. Die Mängelrüge-/Verjährungsfristen rechnet der
// Gewährleistungs-Rechner exakt aus (Brücke im Wizard).

export type WvWerkArt = 'beweglich' | 'unbeweglich';
export type WvPreis = 'pauschal' | 'aufwand';

export type WvAntworten = {
  detailgrad: Detailgrad;
  bestellerName: string;
  bestellerAdresse: string;        // optional
  unternehmerName: string;
  unternehmerAdresse: string;      // optional
  werkBeschrieb: string;           // das herzustellende Werk
  werkArt: WvWerkArt;
  /** Nur bei werkArt 'beweglich' wirksam (RL-39): das Werk wird
   *  bestimmungsgemäss in ein unbewegliches Werk integriert (Art. 367
   *  Abs. 1bis / 370 Abs. 4 lit. a OR) oder als Architekten-/Ingenieurwerk
   *  als Grundlage für dessen Erstellung verwendet (lit. b). */
  bauwerkBezug: boolean;
  ablieferung: string;             // ISO, optional (vereinbarter Termin)
  preis: WvPreis;
  pauschalCHF: string;             // bei 'pauschal' (Festpreis Art. 373)
  ansatzCHF: string;               // bei 'aufwand' (Ansatz, z. B. Stundensatz)
  ansatzEinheit: string;           // z. B. «pro Stunde», «pro m²»
  anzahlung: boolean;              // Akontozahlung bei Vertragsschluss
  anzahlungCHF: string;
  abnahmeProtokoll: boolean;       // gemeinsames Abnahmeprotokoll vereinbaren
  ort: string;
  datum: string;                   // ISO
};

export const WV_DEFAULTS: WvAntworten = {
  detailgrad: DETAILGRAD_DEFAULT,
  bestellerName: '', bestellerAdresse: '',
  unternehmerName: '', unternehmerAdresse: '',
  werkBeschrieb: '',
  werkArt: 'beweglich',
  bauwerkBezug: false,
  ablieferung: '',
  preis: 'pauschal',
  pauschalCHF: '', ansatzCHF: '', ansatzEinheit: 'pro Stunde',
  anzahlung: false, anzahlungCHF: '',
  abnahmeProtokoll: true,
  ort: '', datum: '',
};

// ── Gates/Hinweise (deterministisch, normverifiziert) ───────────────────────

export type WvGateErgebnis = { blocker: string[]; warnungen: string[]; hinweise: string[] };

export function pruefeWvGates(a: WvAntworten): WvGateErgebnis {
  const hinweise: string[] = [];
  const unbeweglich = a.werkArt === 'unbeweglich';
  const bauwerkBezug = !unbeweglich && a.bauwerkBezug;
  if (unbeweglich) {
    hinweise.push(
      'UNBEWEGLICHES WERK: Die Frist für die Mängelrüge beträgt 60 Tage; die Vereinbarung einer '
      + 'kürzeren Frist ist unwirksam (Art. 367 Abs. 1bis OR). Die Mängelansprüche verjähren in '
      + 'fünf Jahren nach der Abnahme (Art. 371 Abs. 2 OR).',
    );
  } else {
    hinweise.push(
      'BEWEGLICHES WERK: Mängel sind nach Ablieferung sobald tunlich zu prüfen und zu rügen '
      + '(Art. 367 Abs. 1 OR); die Mängelansprüche verjähren in zwei Jahren nach der Abnahme '
      + '(Art. 371 Abs. 1 OR). Wird ein bewegliches Werk bestimmungsgemäss in ein unbewegliches '
      + 'integriert und verursacht dessen Mangelhaftigkeit, gilt die fünfjährige Frist.',
    );
  }
  if (bauwerkBezug) {
    hinweise.push(
      'BAUWERK-BEZUG: Das Werk wird bestimmungsgemäss in ein unbewegliches Werk integriert oder '
      + 'als Architekten- bzw. Ingenieurwerk als Grundlage für dessen Erstellung verwendet. Für '
      + 'Mängel, die die Mangelhaftigkeit des unbeweglichen Werks verursacht haben, beträgt die '
      + 'Frist für die Mängelrüge 60 Tage, bei verdeckten Mängeln 60 Tage ab Entdeckung; die '
      + 'Vereinbarung kürzerer Fristen ist unwirksam (Art. 367 Abs. 1bis und Art. 370 Abs. 4, '
      + 'je lit. a/b OR).',
    );
  }
  const verdecktHinweis = unbeweglich
    ? 'Mängel, die bei der Abnahme und ordnungsmässigen Prüfung nicht erkennbar waren, sind innert '
      + '60 Tagen nach ihrer Entdeckung anzuzeigen; die Vereinbarung kürzerer Fristen ist unwirksam '
      + '(Art. 370 Abs. 4 OR).'
    : bauwerkBezug
      ? 'verdeckte Mängel sind sofort nach ihrer Entdeckung anzuzeigen (Art. 370 Abs. 3 OR), '
        + 'soweit sie die Mangelhaftigkeit des unbeweglichen Werks verursacht haben innert 60 Tagen '
        + 'nach ihrer Entdeckung (Art. 370 Abs. 4 OR).'
      : 'verdeckte Mängel sind sofort nach ihrer Entdeckung anzuzeigen (Art. 370 Abs. 3 OR).';
  hinweise.push(
    'RÜGEOBLIEGENHEIT: Unterlässt der Besteller die Prüfung und Anzeige, gilt das Werk als '
    + `genehmigt (Art. 370 Abs. 2 OR); ${verdecktHinweis} Die Fristen rechnet der `
    + 'Gewährleistungs-Rechner exakt aus.',
  );
  hinweise.push(
    'RÜCKTRITTSRECHT DES BESTELLERS: Solange das Werk unvollendet ist, kann der Besteller '
    + 'jederzeit vom Vertrag zurücktreten, schuldet dann aber die Vergütung der geleisteten '
    + 'Arbeit und die volle Schadloshaltung des Unternehmers (Art. 377 OR).',
  );
  return { blocker: [], warnungen: [], hinweise };
}

// ── Schema ──────────────────────────────────────────────────────────────────

export const WV_SCHEMA: VorlageSchema = {
  id: 'werkvertrag',
  format: 'vertrag',
  ausgabeArt: 'fertig',
  version: '1.0.0 (Wettbewerbsanalyse V3; Art. 363/366/367/368/370/371/372/373/377 OR verifiziert 20260101)',
  titel: 'Werkvertrag',
  disclaimer:
    'Erstellt mit LexMetrik. Keine Rechtsberatung. Der Werkvertrag ist formfrei gültig; die '
    + 'beidseitige Unterzeichnung dient dem Beweis. Die Rügefrist beim unbeweglichen Werk '
    + '(60 Tage, Art. 367 Abs. 1bis OR) und das Rücktrittsrecht nach Art. 377 OR sind zwingend. '
    + 'Massgebend sind Gesetz (Art. 363 ff. OR) und der konkrete Einzelfall.',
  bausteine: [
    { id: 'WV01_parteien', rolle: 'parteien',
      text: 'zwischen\n\n{{bestellerBlock}}\n(Besteller)\n\nund\n\n{{unternehmerBlock}}\n(Unternehmer)',
      begruendung: 'Bezeichnung der Vertragsparteien – immer enthalten.',
      norm: 'Art. 363 OR' },
    { id: 'WV02_werk', ueberschrift: 'Werk',
      text: 'Der Unternehmer stellt für den Besteller das folgende Werk her: {{werkBeschrieb}} '
        + '({{werkArtWort}}).{{ablieferungSatz}}',
      nummeriert: true,
      begruendung: 'Gegenstand des Werkvertrags (herzustellendes Werk + Art beweglich/unbeweglich) – immer enthalten.',
      norm: 'Art. 363 OR' },
    { id: 'WV03_verguetung', ueberschrift: 'Vergütung',
      text: '{{verguetungText}} Die Vergütung ist bei der Ablieferung des Werkes zur Zahlung fällig '
        + '(Art. 372 Abs. 1 OR).{{anzahlungSatz}}',
      nummeriert: true,
      begruendung: 'Vergütungsregelung (Festpreis oder nach Aufwand) und Fälligkeit bei Ablieferung (Art. 372 Abs. 1 OR).',
      norm: 'Art. 372 Abs. 1 OR' },
    { id: 'WV04_ausfuehrung', ueberschrift: 'Ausführung und Termine',
      text: 'Der Unternehmer führt das Werk sorgfältig und vertragsgemäss aus. Beginnt er das Werk '
        + 'nicht rechtzeitig, verzögert er die Ausführung vertragswidrig oder ist eine mangelhafte '
        + 'Erstellung durch sein Verschulden bestimmt voraussehbar, so stehen dem Besteller die '
        + 'Rechte nach Art. 366 OR zu (Rücktritt bzw. Ersatzvornahme nach angemessener Nachfrist).',
      includeIf: AB_STANDARD, nummeriert: true,
      begruendung: 'Ausführungspflicht und Verzugs-/Abhilferechte (Art. 366 OR) – ab Detailgrad «standard» (in «einfach» ausgeblendet).',
      norm: 'Art. 366 OR' },
    { id: 'WV05_abnahme', ueberschrift: 'Abnahme und Mängelrüge',
      text: 'Nach Ablieferung prüft der Besteller das Werk, sobald es nach dem üblichen '
        + 'Geschäftsgang tunlich ist, und zeigt dem Unternehmer Mängel an (Art. 367 Abs. 1 OR). '
        + '{{ruegefristSatz}} {{verdecktSatz}}{{abnahmeProtokollSatz}}',
      nummeriert: true,
      begruendung: 'Prüf- und Rügeobliegenheit (Art. 367/370 OR); Rügefrist- und Verdeckte-Mängel-Satz je Werkart (60 Tage zwingend beim unbeweglichen Werk und bei bauwerkskausalen Mängeln eines beweglichen Werks, Art. 367 Abs. 1bis / 370 Abs. 4 OR; sonst «sofort», Art. 370 Abs. 3 OR).',
      norm: 'Art. 367 OR' },
    { id: 'WV06_maengelrechte', ueberschrift: 'Mängelrechte',
      text: 'Bei mangelhaftem Werk stehen dem Besteller die gesetzlichen Mängelrechte zu: '
        + 'Verweigerung der Annahme bei Unbrauchbarkeit, Minderung des Lohnes oder unentgeltliche '
        + 'Nachbesserung, soweit diese dem Unternehmer keine übermässigen Kosten verursacht, '
        + 'sowie Schadenersatz bei Verschulden (Art. 368 OR).{{bautenSatz}}',
      nummeriert: true,
      begruendung: 'Mängelrechte nach Art. 368 OR – immer enthalten; beim unbeweglichen Werk mit Vorbehalt Art. 368 Abs. 3 OR (keine Annahmeverweigerung bei nicht ohne unverhältnismässige Nachteile entfernbaren Bauten) und Hinweis Art. 368 Abs. 2bis OR.',
      norm: 'Art. 368 OR' },
    { id: 'WV07_verjaehrung', ueberschrift: 'Verjährung der Mängelansprüche',
      text: '{{verjaehrungSatz}}',
      nummeriert: true,
      begruendung: 'Verjährung der Mängelansprüche (Art. 371 OR) – Frist je Werkart.',
      norm: 'Art. 371 OR' },
    { id: 'WV08_ruecktritt', ueberschrift: 'Rücktritt des Bestellers',
      text: 'Solange das Werk unvollendet ist, kann der Besteller jederzeit vom Vertrag '
        + 'zurücktreten; er schuldet dann die Vergütung der bereits geleisteten Arbeit und die '
        + 'volle Schadloshaltung des Unternehmers (Art. 377 OR).',
      nummeriert: true,
      begruendung: 'Zwingendes Rücktrittsrecht des Bestellers gegen volle Schadloshaltung (Art. 377 OR) – offengelegt (§8), nicht wegbedungen.',
      norm: 'Art. 377 OR' },
    { id: 'WV08b_verzug', ueberschrift: 'Zahlungsverzug und Konventionalstrafe',
      text: 'Bei Verzug mit einer fälligen Vergütung schuldet der Besteller Verzugszins von 5 % '
        + '(Art. 104 Abs. 1 OR). Für den Fall verspäteter Fertigstellung können die Parteien in der '
        + 'Beilage eine Konventionalstrafe vereinbaren; eine übermässige Strafe setzt der Richter '
        + 'herab (Art. 163 Abs. 3 OR).',
      includeIf: NUR_EXPERTE, nummeriert: true,
      begruendung: 'Verzugszins (Art. 104 OR) und Konventionalstrafen-Rahmen (Art. 163 Abs. 3 OR) – Detailgrad «experte».',
      norm: 'Art. 104 Abs. 1 OR' },
    { id: 'WV08c_gerichtsstand', ueberschrift: 'Anwendbares Recht und Gerichtsstand',
      text: 'Dieser Vertrag untersteht schweizerischem Recht. Ausschliesslicher Gerichtsstand ist '
        + 'der Sitz des Bestellers, soweit nicht zwingende Gerichtsstände entgegenstehen.',
      includeIf: NUR_EXPERTE, nummeriert: true,
      begruendung: 'Rechtswahl- und Gerichtsstandsklausel mit Vorbehalt zwingender Gerichtsstände – Detailgrad «experte».',
      norm: 'Art. 363 OR' },
    { id: 'WV09_schluss', ueberschrift: 'Schlussbestimmungen',
      text: 'Änderungen und Ergänzungen dieses Vertrags bedürfen der Schriftform. Dieser Vertrag '
        + 'wird in zwei Exemplaren ausgefertigt; jede Partei erhält ein unterzeichnetes Exemplar. '
        + 'Im Übrigen gelten die Bestimmungen des Obligationenrechts über den Werkvertrag '
        + '(Art. 363 ff. OR).',
      nummeriert: true,
      begruendung: 'Schriftformvorbehalt, Ausfertigung und Gesetzesverweis – immer enthalten.',
      norm: 'Art. 363 OR' },
    { id: 'WV10_unterschriften', rolle: 'unterschrift',
      text: '{{ort}}, {{datumFmt}}\n\n\nDer Besteller:\n\n___________________________\n{{bestellerName}}\n\n\nDer Unternehmer:\n\n___________________________\n{{unternehmerName}}',
      begruendung: 'Ort, Datum und beidseitige Unterschriften – dienen dem Beweis (formfreier Vertrag).',
      norm: 'Art. 363 OR' },
  ],
};

// ── Zusammenstellung ────────────────────────────────────────────────────────
//
// Blanko-Grundsatz (Daueranweisung David 12.6.2026): leere Pflicht-Platzhalter
// füllt die ENGINE als «________»; optionale Fragmente enden auf «…Satz» und
// verschwinden leer (Konvention engine.ts formatiere()).

export function wvZusammenstellen(a: WvAntworten) {
  const unbeweglich = a.werkArt === 'unbeweglich';
  // Bauwerk-Bezug nur beim beweglichen Werk; beim unbeweglichen gilt ohnehin
  // die 60-Tage-Regel für alle Mängel (RL-39).
  const bauwerkBezug = !unbeweglich && a.bauwerkBezug;

  const pauschalFmt = zahl(a.pauschalCHF) !== null ? fmtCHF(a.pauschalCHF) : '________';
  const ansatzFmt = zahl(a.ansatzCHF) !== null ? fmtCHF(a.ansatzCHF) : '________';
  const anzahlungFmt = zahl(a.anzahlungCHF) !== null ? fmtCHF(a.anzahlungCHF) : '________';
  const verguetungText = a.preis === 'pauschal'
    ? `Die Vergütung ist als Festpreis von CHF ${pauschalFmt} fest vereinbart. Der Unternehmer `
      + `stellt das Werk um diese Summe fertig und darf auch bei höherem Aufwand keine Erhöhung `
      + `fordern; vorbehalten bleibt die richterliche Anpassung bei ausserordentlichen, nicht `
      + `voraussehbaren Umständen (Art. 373 OR).`
    : `Die Vergütung bemisst sich nach Aufwand zu einem Ansatz von CHF ${ansatzFmt} ${a.ansatzEinheit.trim() || '________'}. `
      + `Der Unternehmer weist den Aufwand nachvollziehbar aus.`;

  const ruegefristSatz = unbeweglich
    ? 'Bei diesem unbeweglichen Werk beträgt die Frist für die Mängelrüge 60 Tage; die Vereinbarung '
      + 'einer kürzeren Frist ist unwirksam (Art. 367 Abs. 1bis OR).'
    : bauwerkBezug
      ? 'Für Mängel dieses Werks, die die Mangelhaftigkeit des unbeweglichen Werks verursacht '
        + 'haben, beträgt die Frist für die Mängelrüge 60 Tage; die Vereinbarung einer kürzeren '
        + 'Frist ist unwirksam (Art. 367 Abs. 1bis OR). Im Übrigen sind die Mängel nach der '
        + 'Prüfung ohne Verzug anzuzeigen.'
      : 'Die Mängel sind nach der Prüfung ohne Verzug anzuzeigen.';

  // Verdeckte Mängel (VC-01): Art. 370 Abs. 4 OR ersetzt beim unbeweglichen
  // Werk und bei bauwerkskausalen Mängeln (lit. a/b) das «sofort» aus Abs. 3.
  // Der Satz für das rein bewegliche Werk bleibt wortgleich wie vor RL-39.
  const verdecktSatz = unbeweglich
    ? 'Mängel, die bei der Abnahme und ordnungsmässigen Prüfung nicht erkennbar waren '
      + '(verdeckte Mängel), sind innert 60 Tagen nach ihrer Entdeckung anzuzeigen; die '
      + 'Vereinbarung kürzerer Fristen ist unwirksam (Art. 370 Abs. 4 OR). Unterlässt der '
      + 'Besteller die Prüfung oder die rechtzeitige Anzeige, gilt das Werk als genehmigt '
      + '(Art. 370 Abs. 2 und 3 OR).'
    : bauwerkBezug
      ? 'Verdeckte Mängel sind sofort nach ihrer Entdeckung anzuzeigen; haben sie die '
        + 'Mangelhaftigkeit des unbeweglichen Werks verursacht, sind sie innert 60 Tagen nach '
        + 'ihrer Entdeckung anzuzeigen, und die Vereinbarung kürzerer Fristen ist unwirksam '
        + '(Art. 370 Abs. 4 OR). Unterlässt der Besteller die Prüfung oder die rechtzeitige '
        + 'Anzeige, gilt das Werk als genehmigt (Art. 370 Abs. 2 und 3 OR).'
      : 'Verdeckte Mängel sind sofort nach ihrer Entdeckung anzuzeigen; unterlässt der Besteller '
        + 'die Prüfung und Anzeige, gilt das Werk als genehmigt (Art. 370 Abs. 2 und 3 OR).';

  // VC-02: Art. 368 Abs. 3 OR schliesst die Annahmeverweigerung bei Bauten auf
  // dem Grund des Bestellers aus; Abs. 2bis macht die Nachbesserung bei Bauten
  // unentziehbar. Nur beim unbeweglichen Werk.
  const bautenSatz = unbeweglich
    ? ' Bei Werken, die auf dem Grund und Boden des Bestellers errichtet sind und ihrer Natur '
      + 'nach nur mit unverhältnismässigen Nachteilen entfernt werden können, entfällt das Recht, '
      + 'die Annahme zu verweigern; dem Besteller stehen dann nur Minderung, unentgeltliche '
      + 'Nachbesserung und Schadenersatz zu (Art. 368 Abs. 3 OR). Eine zum Voraus getroffene '
      + 'Abrede, die den Anspruch auf unentgeltliche Nachbesserung bei einem Mangel an einer '
      + 'Baute einschränkt oder ausschliesst, ist ungültig (Art. 368 Abs. 2bis OR).'
    : '';

  const verjaehrungSatz = unbeweglich
    ? 'Die Ansprüche des Bestellers wegen Mängel des Werkes verjähren mit Ablauf von fünf Jahren '
      + 'nach der Abnahme des Werkes (Art. 371 Abs. 2 OR).'
    : 'Die Ansprüche des Bestellers wegen Mängel des Werkes verjähren mit Ablauf von zwei Jahren '
      + 'nach der Abnahme des Werkes; für bewegliche Werke, die bestimmungsgemäss in ein '
      + 'unbewegliches Werk integriert werden und dessen Mangelhaftigkeit verursachen, beträgt die '
      + 'Frist fünf Jahre (Art. 371 Abs. 1 OR).';

  const antworten: Antworten = {
    ...a,
    bestellerBlock: [a.bestellerName, a.bestellerAdresse].filter((s) => s.trim()).join('\n'),
    unternehmerBlock: [a.unternehmerName, a.unternehmerAdresse].filter((s) => s.trim()).join('\n'),
    werkArtWort: unbeweglich
      ? 'unbewegliches Werk'
      : bauwerkBezug
        ? 'bewegliches Werk, das bestimmungsgemäss in ein unbewegliches Werk integriert oder als '
          + 'Grundlage für dessen Erstellung verwendet wird'
        : 'bewegliches Werk',
    ablieferungSatz: a.ablieferung.trim()
      ? ` Das Werk ist bis zum ${fmtIsoStrict(a.ablieferung)} abzuliefern.`
      : '',
    verguetungText,
    anzahlungSatz: a.anzahlung
      ? ` Der Besteller leistet bei Vertragsschluss eine Akontozahlung von CHF ${anzahlungFmt}, die mit der Schlussvergütung verrechnet wird.`
      : '',
    ruegefristSatz,
    verdecktSatz,
    bautenSatz,
    abnahmeProtokollSatz: a.abnahmeProtokoll
      ? ' Über die Abnahme erstellen die Parteien ein gemeinsames Protokoll.'
      : '',
    verjaehrungSatz,
    datumFmt: fmtIsoStrict(a.datum),
  };
  return { ergebnis: assemble(WV_SCHEMA, antworten) };
}
