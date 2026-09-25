// ─── Zuständigkeits-Engine (ZPO) — erstinstanzliche Prüfung ─────────────────
//
// `bestimmeZustaendigkeit` + der zugehörige Berichts-Mapper. Normbasis,
// Schwellen und Eingabe-Typen: siehe `./gemeinsam`. Der Rechtsmittelzug ist
// eine EIGENE Prüfung und liegt in `./rechtsmittel` (CLAUDE.md §4).

import type { Berechnungsergebnis, Normverweis, Rechenschritt } from '../../types/legal';
import {
  ZPO_SCHWELLEN, ungueltig,
  type MieteUnterfall, type ZustaendigkeitInput,
} from './gemeinsam';

type Verfahrensart = 'vereinfacht' | 'ordentlich' | 'scheidungsverfahren';
export type SchlichtungsbehoerdeTyp = 'ordentlich' | 'paritaetisch_miete' | 'paritaetisch_glg';
/** Art der einleitenden Eingabe — steuert den Vorlagen-Verweis (Auftrag §8). */
type EingabeArt = 'schlichtungsgesuch' | 'klage_direkt' | 'scheidungsbegehren_oder_klage';

const MIETE_SCHUTZ: ReadonlySet<MieteUnterfall> = new Set([
  'kuendigungsschutz', 'erstreckung', 'mietzins_anfechtung', 'hinterlegung',
]);

export interface ZustaendigkeitErgebnis {
  verfahrensart: Verfahrensart;
  schlichtung: {
    obligatorisch: boolean;
    entfaelltGrund: string | null;
    verzichtGemeinsam: boolean;
    verzichtEinseitig: boolean;
    behoerdeTyp: SchlichtungsbehoerdeTyp;
    /** Bundesrechtliche Kostenfreiheit des SCHLICHTUNGSverfahrens
     *  (Art. 113 Abs. 2 ZPO, lit. a–g — am Wortlaut verifiziert 5.6.2026;
     *  Vollabgleich 6.6.2026, bibliothek/normen/zustaendigkeit-engine-
     *  verifikation.md): lit. a GlG · lit. c Miete/Pacht Wohn-/Geschäfts-
     *  räume · lit. d Arbeit bis CHF 30 000 · lit. g DSG (Befund B-1,
     *  abgenommen David 6.6.2026). (lit. b/e/f — BehiG, MitwG, KVG-Zusatz —
     *  und die landwirtschaftliche Pacht in lit. c sind nicht abgebildet.) */
    kostenlos: boolean;
    kostenlosGrund: string | null;
  };
  entscheidkompetenz: { entscheidAufAntrag: boolean; entscheidvorschlag: boolean };
  oertlich: { gerichtsstand: string; bindung: 'dispositiv' | 'teilzwingend' | 'zwingend'; teilzwingend: boolean; normen: Normverweis[] };
  eingabeArt: EingabeArt;
  rechenweg: Rechenschritt[];
  warnungen: string[];
  weichen: string[];
  normverweise: Normverweis[];
}

// ── Normverweis-Bausteine ───────────────────────────────────────────────────
const N_243: Normverweis = { artikel: 'Art. 243 ZPO', bemerkung: 'Geltungsbereich vereinfachtes Verfahren' };
const N_197: Normverweis = { artikel: 'Art. 197 ZPO', bemerkung: 'Grundsatz: Schlichtung vorangestellt' };
const N_198: Normverweis = { artikel: 'Art. 198 ZPO', bemerkung: 'Ausnahmen vom Schlichtungsverfahren' };
const N_199: Normverweis = { artikel: 'Art. 199 ZPO', bemerkung: 'Verzicht auf das Schlichtungsverfahren' };

// RL-42 / Z1-03 (Prüfung Rechtslogik 23.9.2026): Art. 199 Abs. 3 ZPO (SR 272,
// Fassung 1.7.2026, Fedlex-Filestore eli/cc/2010/262/20260701, abgerufen
// 25.9.2026): «Bei Streitigkeiten, für die nach den Artikeln 5, 6 und 8 eine
// einzige kantonale Instanz zuständig ist, kann die klagende Partei die Klage
// direkt beim Gericht einreichen.» — ein WAHLRECHT, keine Ausnahme nach
// Art. 198 (lit. f nennt seit 1.1.2025 nur noch Art. 7). Vorher stand dreimal
// wortgleich «Schlichtung entfällt (Art. 199 Abs. 3 ZPO)»; jetzt EIN Satz (§5).
export const SCHLICHTUNG_FREIWILLIG_199_3 = 'Schlichtung nicht zwingend — die klagende Partei kann die Klage direkt beim Gericht einreichen (Art. 199 Abs. 3 ZPO)';
/** entfaelltGrund der einzigen Instanz nach Art. 5 — zugleich Erkennungsmerkmal
 *  für die Darstellung «nicht zwingend» statt «entfällt» (Kopfzeile, Fahrplan). */
export const GRUND_EINZIGE_INSTANZ_199_3 = `Einzige kantonale Instanz nach Art. 5 ZPO: ${SCHLICHTUNG_FREIWILLIG_199_3}`;
const N_200: Normverweis = { artikel: 'Art. 200 ZPO', bemerkung: 'Paritätische Schlichtungsbehörden' };
const N_210: Normverweis = { artikel: 'Art. 210 ZPO', bemerkung: 'Entscheidvorschlag' };
const N_212: Normverweis = { artikel: 'Art. 212 ZPO', bemerkung: 'Entscheid der Schlichtungsbehörde' };
const N_10: Normverweis = { artikel: 'Art. 10 ZPO', bemerkung: 'Grundsatz: Wohnsitz/Sitz der beklagten Partei' };
const N_32: Normverweis = { artikel: 'Art. 32 ZPO', bemerkung: 'Konsumentenvertrag' };
const N_33: Normverweis = { artikel: 'Art. 33 ZPO', bemerkung: 'Miete/Pacht unbeweglicher Sachen — Ort der Sache' };
const N_34: Normverweis = { artikel: 'Art. 34 ZPO', bemerkung: 'Arbeitsrecht — Beklagtensitz oder Arbeitsort' };
const N_35: Normverweis = { artikel: 'Art. 35 ZPO', bemerkung: 'Teilzwingend: kein Verzicht der geschützten Partei' };
const N_4: Normverweis = { artikel: 'Art. 4 ZPO', bemerkung: 'Sachliche/funktionelle Zuständigkeit nach kantonalem Recht' };
const N_23: Normverweis = { artikel: 'Art. 23 ZPO', bemerkung: 'Eherechtliche Gesuche/Klagen — Wohnsitz einer Partei, zwingend' };
const N_28: Normverweis = { artikel: 'Art. 28 ZPO', bemerkung: 'Erbrechtliche Klagen — letzter Wohnsitz der Erblasserin/des Erblassers' };
const N_274: Normverweis = { artikel: 'Art. 274 ZPO', bemerkung: 'Einleitung: gemeinsames Scheidungsbegehren oder Scheidungsklage' };
// Ausbau 5.6.2026 (Regelwerk):
const N_31: Normverweis = { artikel: 'Art. 31 ZPO', bemerkung: 'Vertrag — Beklagtensitz oder Ort der charakteristischen Leistung' };
const N_36: Normverweis = { artikel: 'Art. 36 ZPO', bemerkung: 'Unerlaubte Handlung — Geschädigten-/Beklagtensitz, Handlungs- oder Erfolgsort' };
const N_37: Normverweis = { artikel: 'Art. 37 ZPO', bemerkung: 'Schadenersatz bei ungerechtfertigten vorsorglichen Massnahmen' };
const N_38: Normverweis = { artikel: 'Art. 38 ZPO', bemerkung: 'Motorfahrzeug-/Fahrradunfälle — Beklagtensitz oder Unfallort' };
const N_20: Normverweis = { artikel: 'Art. 20 ZPO', bemerkung: 'Persönlichkeits-/Datenschutz — Wohnsitz/Sitz einer der Parteien' };
const N_40: Normverweis = { artikel: 'Art. 40 ZPO', bemerkung: 'Gesellschaftsrechtliche Verantwortlichkeit — Beklagtensitz oder Sitz der Gesellschaft' };
const N_5: Normverweis = { artikel: 'Art. 5 ZPO', bemerkung: 'Einzige kantonale Instanz (lit. a–c, e, g–i unbedingt; UWG/Bund-Klagen bedingt)' };
const N_17: Normverweis = { artikel: 'Art. 17 ZPO', bemerkung: 'Gerichtsstandsvereinbarung (Schrift-/Textform; im Zweifel ausschliesslich)' };
const N_18: Normverweis = { artikel: 'Art. 18 ZPO', bemerkung: 'Einlassung begründet die Zuständigkeit des angerufenen Gerichts' };
const N_2: Normverweis = { artikel: 'Art. 2 ZPO', bemerkung: 'Vorbehalt Staatsverträge (LugÜ) und IPRG bei internationalen Verhältnissen' };
const N_64: Normverweis = { artikel: 'Art. 64 ZPO', bemerkung: 'Perpetuatio fori — örtliche Zuständigkeit bleibt ab Rechtshängigkeit erhalten' };

/** Reine Engine: Bundesrechtliche Zuständigkeitsbestimmung. */
export function bestimmeZustaendigkeit(input: ZustaendigkeitInput): ZustaendigkeitErgebnis {
  if (input.vermoegensrechtlich && input.streitwertCHF == null) {
    throw new Error('Bei vermögensrechtlichen Streitigkeiten ist der Streitwert erforderlich.');
  }
  if (ungueltig(input.streitwertCHF)) {
    throw new Error('Streitwert muss eine Zahl ≥ 0 sein.');
  }
  // Massgeblicher Streitwert: nur bei vermögensrechtlichen Streitigkeiten.
  const sw = input.vermoegensrechtlich ? input.streitwertCHF : null;
  const istMiete = input.streitsache === 'miete_wohn_geschaeft';
  const istScheidung = input.streitsache === 'scheidung';
  const mieteSchutz = istMiete && MIETE_SCHUTZ.has(input.mieteUnterfall ?? 'sonstige');
  const streitwertunabhaengigVereinfacht = mieteSchutz || !!input.glgBetroffen;

  const istGewaltschutz = input.streitsache === 'persoenlichkeit' && input.persoenlichkeitUnterfall === 'gewaltschutz';
  // Art. 5 ZPO: lit. a–c, e, g–i unbedingt; lit. d (UWG)/f (Bund) NUR über 30 000
  // (H1-Fix 6.6.2026). Bei uwg_oder_bund ≤30k läuft der ordentliche Weg.
  const ipU = input.ipUnterfall ?? 'ip_kartell_firma';
  const istEinzigeInstanz = input.streitsache === 'ip_wettbewerb'
    && (ipU === 'ip_kartell_firma'
      || (sw !== null && sw > ZPO_SCHWELLEN.VEREINFACHT)
      || (ipU === 'uwg' && input.bundKlagerecht === true));

  const rechenweg: Rechenschritt[] = [];
  const warnungen: string[] = [];
  const weichen: string[] = [];

  // Prüfreihenfolge (Entscheid David 5.6.2026, klassische Methodik):
  // 1 · ÖRTLICH → 2 · SACHLICH → 3 · FUNKTIONELL (Schlichtung/Behörde/
  // Kompetenz) → 4 · Verfahrensart → 5 · einleitende Eingabe.

  // ── 1 · Örtliche Zuständigkeit (Art. 10/23/32/33/34/35 ZPO) ───────────────
  let gerichtsstand: string;
  let bindung: 'dispositiv' | 'teilzwingend' | 'zwingend' = 'dispositiv';
  let oertlichNormen: Normverweis[];
  if (istScheidung) {
    gerichtsstand = 'Gericht am Wohnsitz einer der Parteien';
    bindung = 'zwingend'; // Art. 23 Abs. 1 ZPO: «zwingend zuständig»
    oertlichNormen = [N_23];
  } else if (input.streitsache === 'erbrecht') {
    // Art. 28 Abs. 1: nicht als zwingend bezeichnet → dispositiv (Art. 9 ZPO)
    gerichtsstand = 'Gericht am letzten Wohnsitz der Erblasserin/des Erblassers';
    oertlichNormen = [N_28];
  } else if (istMiete) {
    gerichtsstand = 'Gericht am Ort der gelegenen Sache';
    bindung = 'teilzwingend'; // Art. 35 Abs. 1 lit. b (Wohn-/Geschäftsräume)
    oertlichNormen = [N_33, N_35];
  } else if (input.streitsache === 'arbeit') {
    gerichtsstand = 'Gericht am Wohnsitz/Sitz der beklagten Partei oder am gewöhnlichen Arbeitsort (Wahl der klagenden Partei)';
    bindung = 'teilzwingend'; // Art. 35 Abs. 1 lit. d
    oertlichNormen = [N_34, N_35];
  } else if (input.konsumentenvertrag && input.streitsache === 'geldforderung') {
    gerichtsstand = input.klaegeristGeschuetzt
      ? 'Gericht am Wohnsitz/Sitz einer der Parteien (Wahl der klagenden Konsumentin/des Konsumenten)'
      : 'Gericht am Wohnsitz der beklagten Konsumentin/des Konsumenten';
    bindung = 'teilzwingend'; // Art. 35 Abs. 1 lit. a
    oertlichNormen = [N_32, N_35];
  } else if (input.streitsache === 'delikt') {
    // Art. 36: vier alternative Anknüpfungen (inkl. forum actoris); Spezialforen 37/38.
    const u = input.deliktUnterfall ?? 'allgemein';
    if (u === 'verkehrsunfall') {
      gerichtsstand = 'Gericht am Wohnsitz/Sitz der beklagten Partei oder am Unfallort (Wahl der klagenden Partei)';
      oertlichNormen = [N_38];
    } else if (u === 'ungerechtfertigte_massnahme') {
      gerichtsstand = 'Gericht am Wohnsitz/Sitz der beklagten Partei oder am Ort, an dem die vorsorgliche Massnahme angeordnet wurde';
      oertlichNormen = [N_37];
    } else {
      gerichtsstand = 'Gericht am Wohnsitz/Sitz der geschädigten oder der beklagten Partei, am Handlungs- oder am Erfolgsort (Wahl der klagenden Partei)';
      oertlichNormen = [N_36];
    }
  } else if (input.streitsache === 'persoenlichkeit') {
    // Art. 20: Wahlgerichtsstand am Wohnsitz/Sitz EINER der Parteien.
    gerichtsstand = 'Gericht am Wohnsitz/Sitz einer der Parteien (Wahl der klagenden Partei)';
    oertlichNormen = [N_20];
  } else if (input.streitsache === 'gesellschaft') {
    // Art. 40 Abs. 1: Verantwortlichkeitsklagen.
    gerichtsstand = 'Gericht am Wohnsitz/Sitz der beklagten Partei oder am Sitz der Gesellschaft (Wahl der klagenden Partei)';
    oertlichNormen = [N_40];
  } else if (input.streitsache === 'ip_wettbewerb') {
    // Art. 5: örtlich gelten die allgemeinen Regeln (10/36); SACHLICH einzige
    // kantonale Instanz — die Weiche folgt in Schritt 2.
    gerichtsstand = 'Gericht am Wohnsitz/Sitz der beklagten Partei; bei Verletzungsklagen zusätzlich Handlungs-/Erfolgsort (Art. 36)';
    oertlichNormen = [N_10, N_36];
  } else if (input.ausVertrag) {
    // Art. 31: Beklagtensitz ODER Ort der charakteristischen Leistung. Die
    // charakteristische Leistung ist die vertragstypprägende (i. d. R. NICHT
    // die Geld-)Leistung — kein Klägerforum am eigenen Sitz für Geldschulden.
    gerichtsstand = 'Gericht am Wohnsitz/Sitz der beklagten Partei oder am Ort, an dem die charakteristische Leistung zu erbringen ist (Wahl der klagenden Partei)';
    oertlichNormen = [N_31];
  } else {
    // dispositiv: Gerichtsstandsvereinbarung möglich
    gerichtsstand = 'Gericht am Wohnsitz/Sitz der beklagten Partei';
    oertlichNormen = [N_10];
  }
  // Arbeit mit Personalverleih/-vermittlung: Zusatzforum Art. 34 Abs. 2.
  if (input.streitsache === 'arbeit' && input.avgVerleih) {
    gerichtsstand += '; bei Personalverleih/-vermittlung zusätzlich am Ort der Geschäftsniederlassung der verleihenden/vermittelnden Person (Art. 34 Abs. 2 ZPO)';
  }
  const bindungText = bindung === 'zwingend'
    ? ' (zwingend — weder Vereinbarung noch Einlassung möglich, Art. 9 ZPO)'
    : bindung === 'teilzwingend'
      ? ' (teilzwingend — Verzicht der geschützten Partei zum Voraus unzulässig)'
      : ' (dispositiv)';
  rechenweg.push({ beschreibung: `1 · Örtliche Zuständigkeit: ${gerichtsstand}${bindungText}`, zwischenergebnis: gerichtsstand, normen: oertlichNormen });
  if (bindung === 'teilzwingend' && !input.gerichtsstandsvereinbarung) {
    // Mit GSV folgt unten die spezifische Warnung — keine Doppelmeldung (N2).
    weichen.push('Gerichtsstandsvereinbarung nur NACH Entstehung der Streitigkeit gültig — die geschützte Partei kann zum Voraus nicht verzichten (Art. 35 ZPO).');
  }
  // Prorogation/Einlassung (Art. 17/18) — Wirkung hängt am Bindungsgrad.
  if (input.gerichtsstandsvereinbarung) {
    if (bindung === 'zwingend') {
      warnungen.push('Die Gerichtsstandsvereinbarung ist UNWIRKSAM: Vom zwingenden Gerichtsstand können die Parteien nicht abweichen (Art. 9 Abs. 2 ZPO); auch Einlassung heilt nicht.');
    } else if (bindung === 'teilzwingend') {
      warnungen.push('Gerichtsstandsvereinbarung nur wirksam, wenn sie NACH Entstehung der Streitigkeit geschlossen wurde (Art. 35 Abs. 2 ZPO) — ein Vorausverzicht der geschützten Partei ist unwirksam.');
    } else {
      weichen.push('Gerichtsstandsvereinbarung (Art. 17 ZPO): schriftlich oder in Textform; im Zweifel AUSSCHLIESSLICH — dann ist nur das vereinbarte Gericht zuständig.');
    }
  } else if (bindung === 'dispositiv') {
    weichen.push('Dispositiver Gerichtsstand: Abweichung durch Gerichtsstandsvereinbarung (Art. 17 ZPO, Schrift-/Textform) oder durch vorbehaltlose Einlassung der beklagten Partei (Art. 18 ZPO) möglich.');
  }

  // ── 2 · Sachliche Zuständigkeit (Art. 4/5/6/8 ZPO — Kantonsschicht) ────────
  // Handelsgericht: nur Geldforderung (Miete & Arbeit sind nach Art. 6 Abs. 2
  // lit. d ausgeschlossen); nur in Kantonen mit Handelsgericht.
  let hgWeiche = false;
  let direktklageWeiche = false;
  // HG-Weiche: Geldforderung wie bisher; gesellschaftsrechtliche Verantwort-
  // lichkeit zusätzlich (Art. 6 Abs. 4 lit. b — kantonale Erweiterung möglich).
  const hgFaehig = input.streitsache === 'geldforderung' || input.streitsache === 'gesellschaft';
  if (hgFaehig && input.geschaeftlicheTaetigkeit && input.beklagteImHR) {
    const swOk = sw === null || sw > ZPO_SCHWELLEN.HANDELSGERICHT_MIN;
    if (swOk && input.klaegerImHR) {
      hgWeiche = true;
      weichen.push(`Handelsgericht prüfen: handelsrechtliche Streitigkeit nach Art. 6 ZPO (nur in Kantonen mit Handelsgericht, real ZH/BE/AG/SG). Beim Handelsgericht als einziger kantonaler Instanz gilt: ${SCHLICHTUNG_FREIWILLIG_199_3}.`);
    } else if (swOk) {
      hgWeiche = true;
      weichen.push('Nur die beklagte Partei ist im Handelsregister eingetragen: Die klagende Partei kann zwischen Handelsgericht und ordentlichem Gericht wählen (Art. 6 Abs. 3 ZPO; nur HG-Kantone).');
    }
  }
  // M-2-Fix Bug-Check 6.6.2026: Art. 6 Abs. 4 lit. b ZPO ist eine EIGEN-
  // STÄNDIGE kantonale Kann-Erweiterung («Die Kantone können das Handels-
  // gericht ausserdem zuständig erklären für: … b. Streitigkeiten aus dem
  // Recht der Handelsgesellschaften und Genossenschaften» — Wortlaut am
  // Fedlex-Cache verifiziert, Stand 20260701) und setzt die Abs.-2-Merkmale
  // (HR-Eintrag, Schwelle >30 000) gerade NICHT voraus. Vorher lief
  // 'gesellschaft' über den Abs.-2-Pfad und die Weiche fehlte genau im
  // Praxisfall Verantwortlichkeitsklage gegen Organe (natürliche Personen
  // ohne HR-Eintrag).
  if (input.streitsache === 'gesellschaft' && !hgWeiche) {
    hgWeiche = true;
    weichen.push('Handelsgericht prüfen: Für Streitigkeiten aus dem Recht der Handelsgesellschaften und Genossenschaften KÖNNEN die Kantone das Handelsgericht zuständig erklären (Art. 6 Abs. 4 lit. b ZPO) — anders als nach Abs. 2 ohne Handelsregister- und Streitwert-Voraussetzung; ob der Kanton davon Gebrauch gemacht hat, regelt das kantonale Recht (nur HG-Kantone, real ZH/BE/AG/SG).');
  }
  // B-2-Fix (Verifikations-Dossier 6.6.2026, bibliothek/normen/
  // zustaendigkeit-engine-verifikation.md; Freigabe David): Art. 6 Abs. 4
  // lit. c ZPO (eingefügt per 1.1.2025, Wortlaut am Cache verifiziert) —
  // internationale Handelsstreitigkeit. Kantone können das HG zuständig
  // erklären, wenn kumulativ: Ziff. 1 geschäftliche Tätigkeit mind. einer
  // Partei · Ziff. 2 Streitwert ≥ 100 000 · Ziff. 3 Zustimmung der Parteien ·
  // Ziff. 4 mind. eine Partei mit Wohnsitz/gewöhnlichem Aufenthalt/Sitz im
  // Ausland. Zustimmung (künftige Vereinbarung) und die Auslands-Eigenschaft
  // (das Eingabefeld erfasst «Ausland ODER unbekannt»; der Auslandsbezug der
  // KLAGENDEN Partei wird gar nicht abgefragt) sind nicht subsumierbar →
  // offengelegte WEICHE, keine stille Subsumtion (§8). Bewusst nur für die
  // HG-fähigen Streitsachen: ob Abs. 4 lit. c auch die nach Abs. 2 lit. d
  // ausgeschlossenen Schutzmaterien (Arbeit/Miete) erfasst, ist ungeklärt
  // und wird nicht behauptet (§1).
  if (hgFaehig && input.geschaeftlicheTaetigkeit && input.beklagteAuslandOderUnbekannt
    && sw !== null && sw >= ZPO_SCHWELLEN.HG_INTERNATIONAL_MIN) {
    hgWeiche = true;
    weichen.push(`Internationale Handelsstreitigkeit: Die Kantone können das Handelsgericht AUCH hierfür zuständig erklären (Art. 6 Abs. 4 lit. c ZPO, seit 1.1.2025), wenn kumulativ die geschäftliche Tätigkeit mindestens einer Partei betroffen ist, der Streitwert mindestens CHF ${ZPO_SCHWELLEN.HG_INTERNATIONAL_MIN.toLocaleString('de-CH')} beträgt, die Parteien ZUSTIMMEN und mindestens eine Partei ihren Wohnsitz, gewöhnlichen Aufenthalt oder Sitz im AUSLAND hat (blosse Unbekanntheit des Aufenthalts genügt nicht). Ein Handelsregister-Eintrag ist — anders als nach Abs. 2 — nicht vorausgesetzt; ob der Kanton davon Gebrauch gemacht hat, regelt das kantonale Recht (nur HG-Kantone, real ZH/BE/AG/SG).`);
  }
  // Naht-Fix 6.6.2026 (Tiefencheck David): Bei der SCHEIDUNG feuerte die
  // Art.-8-Weiche, wenn (atypisch) vermögensrechtlich+Streitwert gesetzt waren —
  // das Scheidungsverfahren (Art. 274 ff. ZPO, zwingender Gerichtsstand Art. 23)
  // kennt keine Direktklage ans obere Gericht.
  if (!istEinzigeInstanz && !istScheidung && sw !== null && sw >= ZPO_SCHWELLEN.DIREKTKLAGE_MIN) {
    direktklageWeiche = true;
    weichen.push(`Direkte Klage ans obere Gericht möglich (Streitwert ≥ CHF ${ZPO_SCHWELLEN.DIREKTKLAGE_MIN.toLocaleString('de-CH')}, Zustimmung der beklagten Partei, Art. 8 ZPO). Auf diesem Weg gilt: ${SCHLICHTUNG_FREIWILLIG_199_3}.`);
  }
  if (istEinzigeInstanz) {
    rechenweg.push({
      beschreibung: '2 · Sachliche Zuständigkeit: EINZIGE kantonale Instanz — das kantonale Recht bezeichnet das zuständige Gericht (in HG-Kantonen oft das Handelsgericht, Art. 6 Abs. 4 lit. a ZPO); kein zweiter kantonaler Instanzenzug',
      zwischenergebnis: 'einzige kantonale Instanz (Art. 5 ZPO)',
      normen: [N_5, N_4],
    });
    weichen.push('Einordnung unter den Katalog von Art. 5 Abs. 1 lit. a–i ZPO prüfen — UNBEDINGT einzige Instanz: lit. a–c (IP/Kartell/Firma) sowie lit. e (Kernenergiehaftpflicht), g (Sonderuntersuchung Art. 697c–697hbis OR), h (KAG/FinfraG/FINIG) und i (Wappen-/Rotkreuz-/UNO-Zeichenschutz); BEDINGT: lit. d (UWG über CHF 30 000 ODER bei Klagerecht des Bundes) und lit. f (Klagen gegen den Bund nur über CHF 30 000).');
    // Art.-5-Nachuntersuchung 6.6.2026 (Auftrag David): Abs. 2 war bisher
    // nirgends ausgewiesen — die einzige Instanz ist AUCH für vorsorgliche
    // Massnahmen VOR Rechtshängigkeit zuständig (Wortlaut am Cache verifiziert).
    weichen.push('Vorsorgliche Massnahmen VOR Eintritt der Rechtshängigkeit sind ebenfalls bei der einzigen kantonalen Instanz zu beantragen (Art. 5 Abs. 2 ZPO) — nicht beim ordentlichen Massnahmegericht.');
  } else {
    if (input.streitsache === 'ip_wettbewerb') {
      if (sw !== null) {
        warnungen.push(`${ipU === 'uwg' ? 'UWG-Klage' : 'Klage gegen den Bund'} mit Streitwert bis CHF ${ZPO_SCHWELLEN.VEREINFACHT.toLocaleString('de-CH')}${ipU === 'uwg' ? ' (und ohne Klagerecht des Bundes)' : ''}: KEINE einzige kantonale Instanz (Art. 5 Abs. 1 lit. ${ipU === 'uwg' ? 'd' : 'f'} ZPO) — es gilt der ordentliche Weg inklusive Schlichtung und kantonalem Rechtsmittelzug.`);
      } else {
        // M-3-Fix Bug-Check 6.6.2026: sw === null heisst hier NICHT vermögens-
        // rechtlich (fehlender Streitwert bei vermögensrechtlichen Fällen wirft
        // in der Eingabe-Validierung) — die frühere Aufforderung «Streitwert
        // beziffern» war irreführend: Bei einer echten nicht vermögensrecht-
        // lichen Klage (Unterlassung/Beseitigung als Regelfall) GIBT es keinen
        // Streitwert, die Schwellen-Alternative von Art. 5 Abs. 1 lit. d/f
        // («sofern der Streitwert mehr als 30 000 Franken beträgt», Wortlaut am
        // Fedlex-Cache 20260701 verifiziert) kann nie erfüllt sein. Ehrlich
        // offenlegen statt Eingabe einfordern (§8).
        weichen.push(`Nicht vermögensrechtliche ${ipU === 'uwg' ? 'UWG-Klage' : 'Klage gegen den Bund'}: Die Streitwert-Alternative von Art. 5 Abs. 1 lit. ${ipU === 'uwg' ? 'd' : 'f'} ZPO (über CHF 30 000) kann ohne Streitwert nicht erfüllt sein${ipU === 'uwg' ? ' — als zweite Alternative bliebe nur das Klagerecht des Bundes' : ''}. Ob die einzige kantonale Instanz auf nicht vermögensrechtliche Klagen dieser Art anwendbar ist, ist nicht abschliessend geklärt — Zuordnung gesondert prüfen; berechnet wird der ordentliche Weg.`);
      }
    }
    rechenweg.push({
      beschreibung: `2 · Sachliche Zuständigkeit: ordentliches erstinstanzliches Zivilgericht; Organisation und Streitwertgrenzen regelt das kantonale Recht${hgWeiche ? ' — Handelsgerichts-Weiche offen (Art. 6 ZPO)' : ''}${direktklageWeiche ? ' — Direktklage-Weiche offen (Art. 8 ZPO)' : ''}`,
      zwischenergebnis: hgWeiche || direktklageWeiche ? 'ordentliches Gericht (Weichen offen)' : 'ordentliches Gericht',
      normen: [N_4],
    });
  }

  // ── 3 · Funktionell: Schlichtungspflicht (Art. 197–199 ZPO) ────────────────
  let entfaelltGrund: string | null = null;
  if (istScheidung) {
    entfaelltGrund = 'Scheidungsverfahren (Art. 198 lit. c ZPO)';
  } else if (istGewaltschutz) {
    entfaelltGrund = 'Klagen wegen Gewalt, Drohungen oder Nachstellungen bzw. elektronischer Überwachung (Art. 198 lit. abis ZPO)';
  } else if (istEinzigeInstanz) {
    entfaelltGrund = GRUND_EINZIGE_INSTANZ_199_3;
  } else if (input.widerklageOderGerichtlicheFrist) {
    entfaelltGrund = 'Widerklage/Hauptintervention bzw. gerichtlich gesetzte Klagefrist (Art. 198 lit. g/h ZPO)';
  }
  const obligatorisch = entfaelltGrund === null;
  const nurFreiwillig = entfaelltGrund === GRUND_EINZIGE_INSTANZ_199_3;
  // Verzichts-Flags nur, wo überhaupt geschlichtet würde (Präzisierung 5.6.2026).
  const verzichtGemeinsam = obligatorisch && sw !== null && sw >= ZPO_SCHWELLEN.VERZICHT_GEMEINSAM;
  const verzichtEinseitig = obligatorisch && (!!input.beklagteAuslandOderUnbekannt || !!input.glgBetroffen);
  rechenweg.push({
    beschreibung: obligatorisch
      ? '3 · Funktionell: Schlichtungsversuch geht dem Entscheidverfahren grundsätzlich voraus'
      : nurFreiwillig
        ? `3 · Funktionell: ${entfaelltGrund}`
        : `3 · Funktionell: Schlichtung entfällt — ${entfaelltGrund}`,
    zwischenergebnis: obligatorisch ? 'Schlichtung obligatorisch' : nurFreiwillig ? 'Schlichtung freiwillig (Direktklage möglich)' : 'keine Schlichtung',
    normen: obligatorisch ? [N_197] : nurFreiwillig ? [N_199] : [N_198],
  });
  if (verzichtGemeinsam) {
    weichen.push(`Streitwert ≥ CHF ${ZPO_SCHWELLEN.VERZICHT_GEMEINSAM.toLocaleString('de-CH')}: Die Parteien können gemeinsam auf das Schlichtungsverfahren verzichten (Art. 199 Abs. 1 ZPO).`);
  }
  if (verzichtEinseitig) {
    weichen.push('Einseitiger Verzicht der klagenden Partei möglich (beklagte Partei im Ausland/unbekannt oder Streit nach Gleichstellungsgesetz, Art. 199 Abs. 2 ZPO).');
  }

  // Schlichtungsbehörde-Typ (Art. 200 ZPO) — Tiefencheck-Fix 6.6.2026:
  // ohne obligatorische Schlichtung gibt es keine Schlichtungsbehörde; vorher
  // trug das Ergebnisobjekt in 686 Raster-Fällen einen paritätischen Typ trotz
  // entfallender Schlichtung (nicht nutzersichtbar, aber in sich widersprüchlich).
  const behoerdeTyp: SchlichtungsbehoerdeTyp = !obligatorisch
    ? 'ordentlich'
    : istMiete
      ? 'paritaetisch_miete'
      : input.glgBetroffen ? 'paritaetisch_glg' : 'ordentlich';

  // Kostenfreiheit der SCHLICHTUNG (Art. 113 Abs. 2 ZPO; Praxis-Ausbau
  // 5.6.2026). Nur die hier abgebildeten Katalog-Fälle; lit. abis (Gewalt)
  // ist gegenstandslos, weil dort die Schlichtung entfällt (198 lit. abis).
  let kostenlosGrund: string | null = null;
  if (obligatorisch) {
    if (input.glgBetroffen) kostenlosGrund = 'Streitigkeit nach dem Gleichstellungsgesetz (Art. 113 Abs. 2 lit. a ZPO)';
    else if (istMiete) kostenlosGrund = 'Miete/Pacht von Wohn- und Geschäftsräumen (Art. 113 Abs. 2 lit. c ZPO)';
    else if (input.streitsache === 'arbeit' && sw !== null && sw <= ZPO_SCHWELLEN.VEREINFACHT) {
      // Ohne bezifferten Streitwert ist «bis 30 000» nicht subsumierbar →
      // dann KEINE Kostenfreiheits-Behauptung (ehrlich, §8).
      kostenlosGrund = `Arbeitsverhältnis bis CHF ${ZPO_SCHWELLEN.VEREINFACHT.toLocaleString('de-CH')} (Art. 113 Abs. 2 lit. d ZPO)`;
    } else if (input.streitsache === 'persoenlichkeit' && input.persoenlichkeitUnterfall === 'datenschutz') {
      // Befund B-1 (Deep-Research-Verifikation 6.6.2026, abgenommen David;
      // bibliothek/normen/zustaendigkeit-engine-verifikation.md): Art. 113
      // Abs. 2 zählt lit. a–g — lit. g (DSG, eingefügt mit dem DSG vom
      // 25.9.2020) fehlte hier, während die Engine die DSG-Kostenfreiheit
      // des ENTSCHEIDverfahrens (Art. 114 lit. g) bereits auswies.
      kostenlosGrund = 'Streitigkeit nach dem Datenschutzgesetz (Art. 113 Abs. 2 lit. g ZPO)';
    }
  }
  const schlichtungKostenlos = kostenlosGrund !== null;
  if (obligatorisch) {
    rechenweg.push({
      beschreibung: behoerdeTyp === 'paritaetisch_miete'
        ? 'Miete/Pacht von Wohn-/Geschäftsräumen → paritätische Schlichtungsbehörde'
        : behoerdeTyp === 'paritaetisch_glg'
          ? 'Streit nach Gleichstellungsgesetz → paritätische Schlichtungsbehörde'
          : 'Ordentliche Schlichtungsbehörde (Friedensrichteramt/Vermittleramt — kantonale Bezeichnung)',
      zwischenergebnis: behoerdeTyp === 'ordentlich' ? 'ordentliche Schlichtungsbehörde' : 'paritätische Schlichtungsbehörde',
      normen: behoerdeTyp === 'ordentlich' ? [N_4] : [N_200],
    });
  }

  // Entscheidkompetenz der Schlichtungsbehörde (Art. 210/212 ZPO) — nur
  // sinnvoll, wenn überhaupt geschlichtet wird (Präzisierung 5.6.2026).
  const entscheidAufAntrag = obligatorisch && sw !== null && sw <= ZPO_SCHWELLEN.ENTSCHEID_AUF_ANTRAG;
  const entscheidvorschlag = obligatorisch && (!!input.glgBetroffen || mieteSchutz || (sw !== null && sw <= ZPO_SCHWELLEN.ENTSCHEIDVORSCHLAG));
  if (entscheidAufAntrag || entscheidvorschlag) {
    const teile: string[] = [];
    if (entscheidAufAntrag) teile.push(`Entscheid auf Antrag der klagenden Partei (bis CHF ${ZPO_SCHWELLEN.ENTSCHEID_AUF_ANTRAG.toLocaleString('de-CH')}, Art. 212 ZPO)`);
    if (entscheidvorschlag) teile.push(`Entscheidvorschlag der Behörde möglich (Art. 210 ZPO)`);
    rechenweg.push({
      beschreibung: `Kompetenz der Schlichtungsbehörde: ${teile.join('; ')}`,
      zwischenergebnis: entscheidAufAntrag ? 'Entscheid möglich' : 'Entscheidvorschlag möglich',
      normen: [entscheidAufAntrag ? N_212 : N_210],
    });
  }

  // ── 4 · Verfahrensart (Art. 243 ZPO; Scheidung: Art. 274 ff. ZPO) ──────────
  let verfahrensart: Verfahrensart;
  let vGrund: string;
  if (istScheidung) {
    verfahrensart = 'scheidungsverfahren';
    vGrund = 'Scheidung → eigenes Scheidungsverfahren (Einleitung durch gemeinsames Begehren oder Klage, Art. 274 ff. ZPO)';
  } else if (istEinzigeInstanz) {
    // Art. 243 Abs. 3: vor der einzigen kantonalen Instanz (Art. 5) findet
    // das vereinfachte Verfahren keine Anwendung.
    verfahrensart = 'ordentlich';
    vGrund = 'Einzige kantonale Instanz (Art. 5 ZPO) → ordentliches Verfahren; das vereinfachte Verfahren findet dort keine Anwendung (Art. 243 Abs. 3 ZPO)';
  } else if (istGewaltschutz) {
    verfahrensart = 'vereinfacht';
    vGrund = 'Gewalt/Drohungen/Nachstellungen bzw. elektronische Überwachung (Art. 28b/28c ZGB) → vereinfacht ohne Rücksicht auf den Streitwert (Art. 243 Abs. 2 lit. b ZPO)';
  } else if (streitwertunabhaengigVereinfacht) {
    verfahrensart = 'vereinfacht';
    vGrund = mieteSchutz
      ? 'Miete-Schutzmaterie (Hinterlegung/Missbrauch/Kündigungsschutz/Erstreckung) → vereinfacht ohne Rücksicht auf den Streitwert (Art. 243 Abs. 2 lit. c ZPO)'
      : 'Streitigkeit nach dem Gleichstellungsgesetz → vereinfacht ohne Rücksicht auf den Streitwert (Art. 243 Abs. 2 lit. a ZPO)';
  } else if (sw !== null && sw <= ZPO_SCHWELLEN.VEREINFACHT) {
    verfahrensart = 'vereinfacht';
    vGrund = `Vermögensrechtlich bis CHF ${ZPO_SCHWELLEN.VEREINFACHT.toLocaleString('de-CH')} → vereinfachtes Verfahren (Art. 243 Abs. 1 ZPO)`;
  } else {
    verfahrensart = 'ordentlich';
    vGrund = sw === null
      ? 'Nicht vermögensrechtlich und keine Sondermaterie → ordentliches Verfahren'
      : `Vermögensrechtlich über CHF ${ZPO_SCHWELLEN.VEREINFACHT.toLocaleString('de-CH')} → ordentliches Verfahren`;
  }
  rechenweg.push({
    beschreibung: `4 · Verfahrensart: ${vGrund}`,
    zwischenergebnis: verfahrensart === 'vereinfacht' ? 'vereinfachtes Verfahren'
      : verfahrensart === 'scheidungsverfahren' ? 'Scheidungsverfahren (Art. 274 ff. ZPO)' : 'ordentliches Verfahren',
    normen: istScheidung ? [N_274] : [N_243],
  });
  // Art. 243 Abs. 3: Das vereinfachte Verfahren findet KEINE Anwendung vor der
  // einzigen kantonalen Instanz (Art. 5/8) und vor dem Handelsgericht (Art. 6).
  if (verfahrensart === 'vereinfacht' && (hgWeiche || direktklageWeiche)) {
    warnungen.push('Wird das Handelsgericht bzw. die direkte Klage an das obere Gericht gewählt, findet das vereinfachte Verfahren dort KEINE Anwendung (Art. 243 Abs. 3 ZPO) — es gilt das ordentliche Verfahren.');
  }

  // ── Warnungen (Ehrlichkeit, §13) ──────────────────────────────────────────
  warnungen.push('Welches konkrete kantonale Gericht erst- und zweitinstanzlich zuständig ist (Streitwertgrenze Einzelgericht/Kollegium, Bezirks-/Kreiseinteilung), richtet sich nach kantonalem Recht (Art. 4 ZPO) und wird in dieser Phase noch nicht kantonsspezifisch aufgelöst.');
  // Kantonale SPEZIALBEHÖRDEN ausserhalb der Bundes-Systematik offenlegen:
  if (input.streitsache === 'arbeit') {
    warnungen.push('Einige Kantone kennen für arbeitsrechtliche Streitigkeiten besondere Spruchkörper (z. B. Arbeitsgerichte) oder eigene Schlichtungsbehörden — kantonales Recht (Art. 4 ZPO); die konkrete Stelle folgt mit der Kantonsschicht.');
  }
  if (input.streitsache === 'erbrecht') {
    warnungen.push('Für MASSNAHMEN im Zusammenhang mit dem Erbgang (z. B. Testamentseröffnung, Sicherungsmassregeln, Entgegennahme der Ausschlagung) ist die BEHÖRDE am letzten Wohnsitz der Erblasserin/des Erblassers zwingend zuständig (Art. 28 Abs. 2 ZPO) — kantonal organisiert (z. B. Erbschaftsbehörde/Erbschaftsamt), NICHT der Klageweg dieses Rechners.');
  }
  if (!input.vermoegensrechtlich) {
    warnungen.push('Nicht vermögensrechtliche Streitigkeit: streitwertabhängige Schwellen (vereinfachtes Verfahren, Entscheid/Entscheidvorschlag, Verzicht) sind nicht anwendbar.');
  }
  // IPRG/LugÜ-Weiche (Art. 2 ZPO): bei Auslandsbezug gelten die ZPO-Gerichts-
  // stände NICHT — Staatsverträge (insb. LugÜ) und das IPRG gehen vor.
  if (input.beklagteAuslandOderUnbekannt) {
    warnungen.push('AUSLANDSBEZUG: Die örtlichen ZPO-Gerichtsstände gelten nur im Binnenverhältnis — bei internationalen Sachverhalten bestimmen Staatsverträge (insb. LugÜ) und das IPRG die Zuständigkeit (Art. 2 ZPO). Dieses Ergebnis ist dann NICHT massgeblich.');
  }
  if (istGewaltschutz) {
    warnungen.push('Im Entscheidverfahren werden keine Gerichtskosten gesprochen (Art. 114 lit. f ZPO); die Parteientschädigung bleibt vorbehalten. Der unterliegenden Partei können die Kosten auferlegt werden, wenn gegen sie ein Verbot nach Art. 28b ZGB oder eine elektronische Überwachung nach Art. 28c ZGB angeordnet wird (Art. 115 Abs. 2 ZPO).');
  }
  // Art.-114-Spiegelung (Auftrag David 6.6.2026, Wortlaut am Cache verifiziert):
  // Die Kostenfreiheit des ENTSCHEIDverfahrens galt bisher nur für den
  // Gewaltschutz (lit. f) — lit. a (GlG), lit. c (Arbeit/AVG bis 30 000) und
  // lit. g (DSG) werden jetzt ebenfalls ausgewiesen. (lit. b/d/e — BehiG,
  // MitwG, KVG-Zusatz — sind als Streitsachen nicht abgebildet.)
  {
    const istDatenschutz = input.streitsache === 'persoenlichkeit' && input.persoenlichkeitUnterfall === 'datenschutz';
    const e114 = input.glgBetroffen
      ? 'Streitigkeit nach dem Gleichstellungsgesetz (Art. 114 lit. a ZPO)'
      : input.streitsache === 'arbeit' && sw !== null && sw <= ZPO_SCHWELLEN.VEREINFACHT
        ? `arbeitsrechtliche Streitigkeit bis CHF ${ZPO_SCHWELLEN.VEREINFACHT.toLocaleString('de-CH')} (Art. 114 lit. c ZPO)`
        : istDatenschutz ? 'Streitigkeit nach dem Datenschutzgesetz (Art. 114 lit. g ZPO)' : null;
    if (e114) {
      warnungen.push(`Im ENTSCHEIDVERFAHREN werden keine Gerichtskosten gesprochen: ${e114}. Vorbehalten bleibt die Kostenauflage bei bös- oder mutwilliger Prozessführung (Art. 115 Abs. 1 ZPO); die Parteientschädigung richtet sich nach Art. 106 ZPO.`);
    }
  }
  if (input.streitsache === 'delikt' && (input.deliktUnterfall ?? 'allgemein') === 'allgemein') {
    warnungen.push('Spezialforen gehen vor: Motorfahrzeug-/Fahrradunfälle (Art. 38), ungerechtfertigte vorsorgliche Massnahmen (Art. 37), Nuklearschäden (Art. 38a — zwingend am Ereigniskanton); Adhäsionsklagen im Strafverfahren bleiben dem Strafgericht vorbehalten (Art. 39 ZPO).');
  }
  // Verfahrensrechtliche Sicherungs-Hinweise (Regelwerk Teil 3):
  weichen.push('Ab Rechtshängigkeit (Einreichung Schlichtungsgesuch bzw. Klage, Art. 62 ZPO) bleibt die örtliche Zuständigkeit erhalten, auch wenn sich die Anknüpfung später ändert (perpetuatio fori, Art. 64 Abs. 1 lit. b ZPO).');
  if (hgWeiche || direktklageWeiche || istEinzigeInstanz) {
    weichen.push('Bei Nichteintreten wegen Unzuständigkeit oder falscher Verfahrensart: Neueinreichung innert eines Monats wahrt das ursprüngliche Rechtshängigkeitsdatum (Art. 63 ZPO; seit 1.1.2025 auch bei amtlicher Weiterleitung nach Art. 143 Abs. 1bis ZPO).');
  }

  // ── 5 · Art der einleitenden Eingabe (→ Vorlagen-Verweis, Auftrag §8) ──────
  const eingabeArt: EingabeArt = istScheidung
    ? 'scheidungsbegehren_oder_klage'
    : obligatorisch ? 'schlichtungsgesuch' : 'klage_direkt';
  rechenweg.push({
    beschreibung: eingabeArt === 'scheidungsbegehren_oder_klage'
      ? '5 · Einleitende Eingabe: gemeinsames Scheidungsbegehren (bei Einigung) oder Scheidungsklage'
      : eingabeArt === 'schlichtungsgesuch'
        ? '5 · Einleitende Eingabe: Schlichtungsgesuch an die Schlichtungsbehörde (Art. 202 ZPO)'
        : '5 · Einleitende Eingabe: Klage direkt beim Gericht (keine Schlichtung)',
    zwischenergebnis: eingabeArt === 'scheidungsbegehren_oder_klage' ? 'Scheidungsbegehren / Scheidungsklage'
      : eingabeArt === 'schlichtungsgesuch' ? 'Schlichtungsgesuch' : 'Klage',
    normen: eingabeArt === 'scheidungsbegehren_oder_klage' ? [N_274] : eingabeArt === 'schlichtungsgesuch' ? [N_197] : [N_198],
  });

  const normverweise: Normverweis[] = [
    ...(istScheidung ? [N_274] : [N_243]), obligatorisch ? N_197 : N_198,
    ...(obligatorisch && (verzichtGemeinsam || verzichtEinseitig) ? [N_199] : []),
    ...(obligatorisch && behoerdeTyp !== 'ordentlich' ? [N_200] : []),
    ...oertlichNormen,
    ...(istEinzigeInstanz ? [N_5] : []),
    ...(input.gerichtsstandsvereinbarung ? [N_17, N_18] : []),
    ...(input.beklagteAuslandOderUnbekannt ? [N_2] : []),
    N_64, N_4,
  ];

  return {
    verfahrensart,
    schlichtung: { obligatorisch, entfaelltGrund, verzichtGemeinsam, verzichtEinseitig, behoerdeTyp, kostenlos: schlichtungKostenlos, kostenlosGrund },
    entscheidkompetenz: { entscheidAufAntrag, entscheidvorschlag },
    oertlich: { gerichtsstand, bindung, teilzwingend: bindung === 'teilzwingend', normen: oertlichNormen },
    eingabeArt,
    rechenweg, warnungen, weichen, normverweise,
  };
}

// ── Abbildung in das einheitliche Anzeige-/Berichtsformat ───────────────────
export function zustaendigkeitErgebnis(
  input: ZustaendigkeitInput,
): Berechnungsergebnis & { resultat: ZustaendigkeitErgebnis } {
  const r = bestimmeZustaendigkeit(input);
  const verfahren = r.verfahrensart === 'vereinfacht' ? 'Vereinfachtes Verfahren'
    : r.verfahrensart === 'scheidungsverfahren' ? 'Scheidungsverfahren' : 'Ordentliches Verfahren';
  const schlicht = r.schlichtung.obligatorisch
    ? (r.schlichtung.behoerdeTyp === 'paritaetisch_miete' ? 'Schlichtung: paritätische Behörde (Miete)'
      : r.schlichtung.behoerdeTyp === 'paritaetisch_glg' ? 'Schlichtung: paritätische Behörde (GlG)'
      : 'Schlichtung: ordentliche Behörde')
    : r.schlichtung.entfaelltGrund === GRUND_EINZIGE_INSTANZ_199_3
      ? 'Schlichtung nicht zwingend (Art. 199 Abs. 3 ZPO)'
      : 'Schlichtung entfällt';
  return {
    ergebnis: `${verfahren} · ${schlicht} · ${r.oertlich.gerichtsstand}`,
    status: 'ok',
    rechenweg: r.rechenweg,
    annahmen: [
      'Binnenverhältnis Schweiz (kein internationaler Sachverhalt; IPRG/LugÜ ausgeklammert).',
      'Streitwert wird vom Nutzer eingegeben; keine Streitwertberechnung durch die Engine.',
      'Summarische Verfahren (Art. 248 ff. ZPO – klare Fälle, vorsorgliche Massnahmen, freiwillige Gerichtsbarkeit) sind nicht abgebildet; dort entfiele die Schlichtung (Art. 198 lit. a ZPO).',
      // RL-42 / Z1-05: Art. 15 Abs. 1 ZPO (Fassung 1.7.2026): «Richtet sich die
      // Klage gegen mehrere Streitgenossen, so ist das für eine beklagte Partei
      // zuständige Gericht für alle beklagten Parteien zuständig, sofern diese
      // Zuständigkeit nicht nur auf einer Gerichtsstandsvereinbarung beruht.»
      // Keine Eingabe für mehrere Beklagte → offenlegen statt rechnen (§8).
      'Berechnet für EINE beklagte Partei. Richtet sich die Klage gegen mehrere Streitgenossen, ist das für eine beklagte Partei zuständige Gericht für alle beklagten Parteien zuständig, sofern diese Zuständigkeit nicht nur auf einer Gerichtsstandsvereinbarung beruht (Art. 15 Abs. 1 ZPO).',
    ],
    warnungen: r.warnungen,
    normverweise: r.normverweise,
    resultat: r,
  };
}
