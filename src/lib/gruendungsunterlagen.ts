// Dossier: bibliothek/recherche/gesellschaftsgruendung.md
// ─── Gründungsunterlagen GmbH / AG – deterministische Dokumenten-Checkliste ──
//
// Bauspezifikationen (Normen dort verbatim am Fedlex-Cache verifiziert, §7):
//   bibliothek/recherche/gesellschaftsgruendung.md  (Belege-Grundlagen)
//   bibliothek/recherche/gmbh-gruendung.md  Teil 5   (Weichen-Tabelle GmbH)
//   bibliothek/recherche/ag-gruendung.md    Teile 2–4 (AG-Spezifika)
//
// Rechtsgrundlage: Die HRegV listet die REGISTERRECHTLICHEN Belege je
// Rechtsform abschliessend (GmbH Art. 71, AG Art. 43); das OR bestimmt die
// Entstehungsdokumente (Errichtungsakt 777/629, Statuten 776/626, Einlagen
// 777c/632 f.). SPEZIALGESETZLICHE Zusatzbelege treten hinzu (Identifikation
// Art. 24a HRegV, Lex Koller/BewG, ggf. FINMA-Bewilligung) – Review-Befund
// M-1 (6.6.2026): «abschliessend» gilt nur für die HRegV-Schicht, nicht für
// die Gesamtliste. Alle Weichen sind harte Tatbestände (§2) – keine Wertungen.
//
// §4: Geteilt ist nur die fachneutrale Struktur (Unterlage/Phase/Ersteller);
// die Dokument-Kataloge je Rechtsform sind GETRENNT erfasst, weil die
// Beleglisten materiell verschieden sind (z. B. VR-Konstituierungsprotokoll
// nur AG-Pflichtbeleg, Art. 43 Abs. 1 lit. e; GmbH nur «gegebenenfalls»,
// Art. 71 Abs. 1 lit. e/f).
//
// §8-Grenze: Errichtungsakt ist öffentlich zu beurkunden (Art. 777 bzw.
// 629 OR) → die Masken exportieren NICHTS, sie listen nur auf.
//
// Hinweis Stampa: Die separate Stampa-Erklärung ist seit 1.1.2021 kein
// HRegV-Beleg mehr (Art. 43 Abs. 1 lit. h bzw. 71 Abs. 1 lit. i aufgehoben,
// AS 2020 971); ihr Inhalt ist die Gründer-Feststellung IM Errichtungsakt
// (Art. 777 Abs. 2 Ziff. 5 bzw. 629 Abs. 2 Ziff. 4 OR). Veraltete private
// Checklisten führen sie weiter → ausdrücklicher Hinweis in beiden Masken.

export type Phase = 'vorbereitung' | 'beurkundung' | 'anmeldung' | 'nachEintrag';
type Ersteller = 'gruender' | 'notariat' | 'bank' | 'revisor';

interface Unterlage {
  id: string;
  titel: string;
  /** Norm-Anker, z. B. 'Art. 71 Abs. 1 lit. a HRegV' (NormLink-tauglich). */
  norm: string;
  phase: Phase;
  ersteller: Ersteller;
  /** Nur bei bedingten Unterlagen: welche Weiche sie ausgelöst hat. */
  ausgeloestDurch?: string;
  hinweis?: string;
  /** Norm-Anker, wenn der Beleg ENTFÄLLT, sobald sein Inhalt bereits im
   *  Errichtungsakt festgehalten ist (Art. 71 Abs. 2 / 43 Abs. 2 HRegV).
   *  EINE Quelle für Checkliste (Anzeige) und Dokumentmappe (Beilagen-
   *  Filter, weil deren Urkunde den Inhalt immer aufnimmt) — /simplify-
   *  Altitude-Befund 7.6.2026 statt id-Sonderliste in der Mappe (§5). */
  entbehrlichWennInUrkunde?: string;
}

interface StatutenKlauselZeile {
  klausel: string;
  norm: string;
  kern: string;
}

export interface GruendungsunterlagenErgebnis {
  unterlagen: Unterlage[];
  /** Statutarisch zu verankernde Klauseln (nur wirksam mit Statutenbasis). */
  statutenKlauseln: StatutenKlauselZeile[];
  /** Harte Stopper (z. B. fehlende CH-Vertretung). */
  blocker: string[];
  /** Aufklärungen, die immer oder bedingt gezeigt werden. */
  hinweise: string[];
  /** Emissionsabgabe in CHF (1 % des CHF 1 Mio. übersteigenden Teils) oder null. */
  emissionsabgabeChf: number | null;
}

export type EinlageArt = 'bar' | 'sacheinlage' | 'verrechnung' | 'gemischt';

// Statutarische Gestaltungen GmbH – nur wirksam mit Statutenklausel
// (Art. 776a OR ist seit 1.1.2023 aufgehoben; Verankerung je Sachnorm).
export type GmbhStatutKlausel =
  | 'nachschuss'
  | 'nebenleistung'
  | 'konkurrenzverbot'
  | 'vorkaufsrecht'
  | 'stimmrechtNachAnteilen'
  | 'vetorecht';

export interface GmbhGruendungEingaben {
  einlageArt: EinlageArt;
  /** Besondere Vorteile zugunsten von Gründern/Dritten (Art. 777 Abs. 2 Ziff. 5 OR). */
  besondereVorteile: boolean;
  /** Geschäftsführung beruht auf WAHL (sonst statutarische Einsetzung). */
  gfGewaehlt: boolean;
  mehrereGeschaeftsfuehrer: boolean;
  /** Weitere Vertretungsberechtigte (Direktor:innen/Prokurist:innen) einzutragen. */
  weitereVertretungsberechtigte: boolean;
  /** true = Verzicht auf eingeschränkte Revision (Opting-out, Art. 727a Abs. 2 OR). */
  optingOut: boolean;
  /** false = Rechtsdomizil bei Dritten (c/o) → Domizilannahmeerklärung. */
  eigeneBueros: boolean;
  immobilienHauptzweck: boolean;
  auslJurPersonGesellschafter: boolean;
  /** Stammkapital in ausländischer Währung (Anhang 3 HRegV: GBP/EUR/USD/JPY). */
  fremdwaehrung: boolean;
  /** Bank ist in der öffentlichen Urkunde genannt → keine separate Bescheinigung. */
  bankInUrkundeGenannt: boolean;
  /** Mind. eine vertretungsberechtigte Person (GF oder Direktor:in) mit CH-Wohnsitz. */
  chWohnsitzVertretung: boolean;
  statutKlauseln: GmbhStatutKlausel[];
  /** Gesamtleistungen der Gesellschafter in CHF (für den Emissionsabgabe-Hinweis). */
  leistungenChf?: number;
}

// ─── geteilte Bausteine (fachneutral) ───────────────────────────────────────

// Emissionsabgabe-Stammregel (Satz + Freibetrag) liegt zentral in
// `./emissionsabgabe` (§5, A4-3b); hier nur re-exportiert für bestehende
// Verwender/Tests. Bemessung mind. Nennwert, Sachen zum Verkehrswert
// (Art. 8 Abs. 3 StG) – hier bewusst nur die Leistungs-Eingabe, keine Steuerberatung.
import { EMISSIONSABGABE_FREIBETRAG_CHF, emissionsabgabeRoh } from './emissionsabgabe';
export { EMISSIONSABGABE_FREIBETRAG_CHF };

// FINMA-Bewilligungs-Bezeichnungen (Merkblatt HRegA ZH «Belege für die
// Neueintragung», 11.12.2024) — deterministische Wortprüfung über
// Firma + Zweck. Rechtsformneutral (gilt AG wie GmbH); aus der AG-Seite
// hierher gezogen (Bug-Check 7.6.2026 N-4, §3: Rechtsregel in die
// Engine-Schicht — die GmbH-Maske bekommt den Check mit dem G-Programm).
const FINMA_BEGRIFFE: { begriff: string; muster: RegExp }[] = [
  { begriff: 'Bank', muster: /\bbank\b/i },
  { begriff: 'Vermögensverwalter', muster: /vermögensverwalter/i },
  { begriff: 'Trustee', muster: /trustee/i },
  { begriff: 'Verwalter von Kollektivvermögen', muster: /verwalter von kollektivvermögen/i },
  { begriff: 'Fondsleitung', muster: /fondsleitung/i },
  { begriff: 'Wertpapierhaus', muster: /wertpapierhaus/i },
];

/** Bewilligungspflichtige FINMA-Bezeichnungen in Firma/Zweck (Treffer-Labels). */
export function finmaBegriffsTreffer(firma: string, zweck: string): string[] {
  const text = `${firma} ${zweck}`;
  return FINMA_BEGRIFFE.filter((b) => b.muster.test(text)).map((b) => b.begriff);
}

export function emissionsabgabe(leistungenChf: number | undefined): number | null {
  if (leistungenChf === undefined || !Number.isFinite(leistungenChf)) return null;
  if (leistungenChf <= EMISSIONSABGABE_FREIBETRAG_CHF) return null;
  return emissionsabgabeRoh(leistungenChf); // ungerundet (Form-Anzeige), §5-Quelle
}

const STAMPA_HINWEIS =
  'Keine separate Stampa-Erklärung mehr: Der Beleg ist seit 1.1.2021 aus der HRegV ' +
  'gestrichen (AS 2020 971); die Feststellung «keine anderen Sacheinlagen, ' +
  'Verrechnungstatbestände oder besonderen Vorteile als in den Belegen genannt» ' +
  'erfolgt zwingend im Errichtungsakt selbst. Veraltete Checklisten verlangen sie noch.';

const ORIGINAL_HINWEIS =
  'Belege im Original oder in beglaubigter Kopie einreichen (Art. 20 HRegV); ' +
  'per E-Mail eingereichte Unterlagen gelten in der Praxis als Kopien und sind ' +
  'nicht rechtsgenüglich (Merkblatt HRegA ZH).';

// ─── GmbH (Art. 71/72 HRegV · Art. 776–777c OR) ────────────────────────────

const GMBH_KLAUSEL_KATALOG: Record<GmbhStatutKlausel, StatutenKlauselZeile> = {
  nachschuss: {
    klausel: 'Nachschusspflicht',
    norm: 'Art. 795 OR',
    kern: 'Betrag je Stammanteil in den Statuten; höchstens das Doppelte des Nennwerts (Abs. 2).',
  },
  nebenleistung: {
    klausel: 'Nebenleistungspflichten',
    norm: 'Art. 796 OR',
    kern: 'Gegenstand und Umfang in den Statuten; Details an ein Reglement delegierbar (Abs. 3).',
  },
  konkurrenzverbot: {
    klausel: 'Konkurrenzverbot der Gesellschafter',
    norm: 'Art. 803 OR',
    kern: 'Statuten können konkurrenzierende Tätigkeiten untersagen (Abs. 2); Befreiung: schriftliche Zustimmung aller übrigen oder statutarisch die Gesellschafterversammlung (Abs. 3).',
  },
  vorkaufsrecht: {
    klausel: 'Vorhand-/Vorkaufs-/Kaufsrechte',
    norm: 'Art. 786 OR',
    kern: 'Abtretungs-Regime statutarisch gestaltbar (Abs. 2 Ziff. 1–5, bis zum Ausschluss); Hinweispflicht in Zeichnungs- und Abtretungsurkunde (Art. 777a Abs. 2 / 785 Abs. 2 OR).',
  },
  stimmrechtNachAnteilen: {
    klausel: 'Stimmrecht nach Anzahl der Stammanteile',
    norm: 'Art. 806 Abs. 2 OR',
    kern: 'Je Anteil eine Stimme; kleinste Nennwerte mindestens 1/10 der übrigen.',
  },
  vetorecht: {
    klausel: 'Vetorecht',
    norm: 'Art. 807 OR',
    kern: 'Statuten müssen die Beschlüsse umschreiben, für die das Veto gilt; nachträgliche Einführung nur einstimmig.',
  },
};

export function gmbhGruendungsunterlagen(e: GmbhGruendungEingaben): GruendungsunterlagenErgebnis {
  const u: Unterlage[] = [];
  const blocker: string[] = [];
  const hinweise: string[] = [STAMPA_HINWEIS, ORIGINAL_HINWEIS];

  const qualifiziert = e.einlageArt !== 'bar' || e.besondereVorteile;
  const mitBareinlage = e.einlageArt === 'bar' || e.einlageArt === 'gemischt';
  const mitSacheinlage = e.einlageArt === 'sacheinlage' || e.einlageArt === 'gemischt';

  // ── Vorbereitung ──
  u.push({
    id: 'statutenentwurf',
    titel: 'Statutenentwurf',
    norm: 'Art. 776 OR',
    phase: 'vorbereitung',
    ersteller: 'gruender',
    hinweis:
      'Mindestinhalt (4 Ziffern): Firma/Sitz · Zweck · Stammkapital mit Anzahl/Nennwert der Stammanteile · Form der Mitteilungen. Amtliche Muster: HRegA ZH (lang/kurz), SG, GL; EHRA-Muster 2017 nur mit Vorsicht (Art. 776a/806b a. F. zitiert, 100er-Nennwert überholt – Art. 774 Abs. 1 OR verlangt nur noch einen Nennwert über null).',
  });
  if (mitBareinlage) {
    u.push({
      id: 'kapitaleinlagekonto',
      titel: 'Kapitaleinzahlung auf Sperrkonto einer Bank',
      norm: 'Art. 777c OR',
      phase: 'vorbereitung',
      ersteller: 'bank',
      hinweis:
        'Volliberierung zwingend: für jeden Stammanteil die dem Ausgabebetrag entsprechende Einlage vollständig (Abs. 1); Geldeinlagen zur ausschliesslichen Verfügung der Gesellschaft hinterlegen (Abs. 2 Ziff. 3 i. V. m. Art. 633 OR).',
    });
    if (!e.bankInUrkundeGenannt) {
      u.push({
        id: 'bankbescheinigung',
        titel: 'Bankbescheinigung über die hinterlegten Einlagen',
        norm: 'Art. 71 Abs. 1 lit. g HRegV',
        phase: 'vorbereitung',
        ersteller: 'bank',
        ausgeloestDurch: 'Bank nicht in der öffentlichen Urkunde genannt',
        hinweis: 'Entbehrlich, wenn die Urkunde Bankinstitut und Sperrung selbst festhält (Merkblatt HReg LU).',
      });
    }
  }
  u.push({
    id: 'ausweise',
    titel: 'Ausweiskopien aller einzutragenden Personen',
    norm: 'Art. 24a HRegV',
    phase: 'vorbereitung',
    ersteller: 'gruender',
    hinweis: 'Gültiger Pass, ID oder schweizerischer Ausländerausweis; in der Praxis als separates loses Dokument (HRegA ZH).',
  });
  if (e.auslJurPersonGesellschafter) {
    u.push({
      id: 'ausl-hr-auszug',
      titel: 'Beglaubigter ausländischer Handelsregisterauszug mit Apostille/Überbeglaubigung',
      norm: 'Art. 20 HRegV',
      phase: 'vorbereitung',
      ersteller: 'gruender',
      ausgeloestDurch: 'Ausländische juristische Person als Gesellschafterin',
      hinweis: 'Praxis HRegA ZH («Ausweis über Handelsgesellschaften und juristische Personen»).',
    });
  }
  if (mitSacheinlage) {
    u.push({
      id: 'sacheinlagevertrag',
      titel: 'Sacheinlagevertrag mit den erforderlichen Beilagen (Inventar/Übernahmebilanz)',
      norm: 'Art. 43 Abs. 3 lit. a HRegV',
      phase: 'vorbereitung',
      ersteller: 'gruender',
      ausgeloestDurch: 'Sacheinlage',
      hinweis: 'Für die GmbH über den Verweis Art. 71 Abs. 3 HRegV; schriftlich, öffentliche Beurkundung nur, wenn die Übertragung des Gegenstands sie verlangt (Art. 634 Abs. 2 OR sinngemäss, Art. 777c Abs. 2 OR).',
    });
  }
  if (qualifiziert) {
    u.push(
      {
        id: 'gruendungsbericht',
        titel: 'Gründungsbericht, von allen Gründerinnen und Gründern unterzeichnet',
        norm: 'Art. 43 Abs. 3 lit. c HRegV',
        phase: 'vorbereitung',
        ersteller: 'gruender',
        ausgeloestDurch: 'Qualifizierte Gründung (Sacheinlage/Verrechnung/besondere Vorteile)',
        hinweis: 'Rechenschaft über Sacheinlagen, Verrechenbarkeit, besondere Vorteile (Art. 635 OR sinngemäss).',
      },
      {
        id: 'pruefungsbestaetigung',
        titel: 'Vorbehaltlose Prüfungsbestätigung eines zugelassenen Revisors',
        norm: 'Art. 43 Abs. 3 lit. d HRegV',
        phase: 'vorbereitung',
        ersteller: 'revisor',
        ausgeloestDurch: 'Qualifizierte Gründung',
        hinweis: 'Prüfung des Gründungsberichts (Art. 635a OR sinngemäss).',
      },
    );
  }
  if (!e.eigeneBueros) {
    u.push({
      id: 'domizilannahme',
      titel: 'Domizilannahmeerklärung der Domizilhalterin / des Domizilhalters',
      norm: 'Art. 71 Abs. 1 lit. h HRegV',
      phase: 'vorbereitung',
      ersteller: 'gruender',
      ausgeloestDurch: 'Kein eigenes Büro am Sitz (c/o-Adresse)',
      hinweis: 'Erklärung, dass der Gesellschaft am Sitz ein Rechtsdomizil gewährt wird (Art. 117 Abs. 3 HRegV).',
    });
  }
  if (e.immobilienHauptzweck) {
    u.push({
      id: 'lex-koller',
      titel: 'Lex-Koller-Erklärung (kantonales Formular)',
      norm: 'Art. 2 BewG',
      phase: 'vorbereitung',
      ersteller: 'gruender',
      ausgeloestDurch: 'Immobilien-Haupttätigkeit',
      hinweis:
        'Kein HRegV-Beleg mehr (lit. i aufgehoben 1.1.2021), kantonal aber weiter verlangt; Bezeichnung uneinheitlich («Lex Koller» ZH/SG/AR, «Lex Friedrich» BE, Formular-Stand 2025). Verlangt die Bewilligungsbehörde nach Verweisung zusätzlich eine Lex-Koller-BEWILLIGUNG (ZH-Checkliste Neueintragung Ziff. 12), ist diese beizubringen – Einzelfall, kein Beleg des Normalfalls (Musterabgleich 10.6.2026, B8).',
    });
  }

  // ── Beurkundung ──
  u.push(
    {
      id: 'errichtungsakt',
      titel: 'Öffentliche Urkunde über den Errichtungsakt',
      norm: 'Art. 71 Abs. 1 lit. a HRegV',
      phase: 'beurkundung',
      ersteller: 'notariat',
      hinweis:
        'Inhalt nach Art. 72 HRegV und Art. 777 OR: Gründungserklärung, Statutenfestlegung, Organbestellung, Zeichnung mit Feststellungen (Abs. 2 Ziff. 1–5, inkl. Stampa-Inhalt als Ziff. 5)' +
        (e.fremdwaehrung ? '; bei Fremdwährungs-Kapital sind die Umrechnungskurse in der Urkunde anzugeben (Art. 72 lit. j HRegV)' : '') +
        (e.optingOut
          ? '; Opting-out direkt in der Urkunde feststellen: keine ordentliche Revisionspflicht, höchstens 10 Vollzeitstellen, Zustimmung aller Gründer (Art. 727a Abs. 2 OR)'
          : '') +
        '. Die Urkundsperson nennt alle Belege einzeln und bestätigt deren Vorliegen (Art. 777b Abs. 1 OR).',
    },
    {
      id: 'statuten',
      titel: 'Statuten (definitive Fassung)',
      norm: 'Art. 71 Abs. 1 lit. b HRegV',
      phase: 'beurkundung',
      ersteller: 'notariat',
      hinweis: 'Durch die Urkundsperson zu beglaubigen; stets vollständige Fassung (Art. 22 Abs. 3/4 HRegV).',
    },
  );
  if (e.gfGewaehlt) {
    u.push({
      id: 'wahlannahme-gf',
      titel: 'Wahlannahme-Nachweis der Geschäftsführerinnen und Geschäftsführer',
      norm: 'Art. 71 Abs. 1 lit. c HRegV',
      phase: 'beurkundung',
      ersteller: 'gruender',
      ausgeloestDurch: 'Geschäftsführung beruht auf Wahl',
      hinweis:
        'Entbehrlich, wenn die Annahme in der Urkunde selbst erfolgt oder die Gewählten die HR-Anmeldung unterzeichnen (Praxis ZH/SG/LU); sonst original handschriftlich.',
    });
  }
  if (!e.optingOut) {
    u.push({
      id: 'wahlannahme-rs',
      titel: 'Wahlannahme-Nachweis der Revisionsstelle',
      norm: 'Art. 71 Abs. 1 lit. d HRegV',
      phase: 'beurkundung',
      ersteller: 'gruender',
      ausgeloestDurch: 'Revisionsstelle bestellt (kein Opting-out)',
    });
  }
  if (e.mehrereGeschaeftsfuehrer) {
    u.push({
      id: 'vorsitz-beschluss',
      titel: 'Beschluss über die Regelung des Vorsitzes der Geschäftsführung',
      norm: 'Art. 71 Abs. 1 lit. e HRegV',
      phase: 'beurkundung',
      ersteller: 'gruender',
      ausgeloestDurch: 'Mehrere Geschäftsführer:innen',
      hinweis: 'Bei mehreren Geschäftsführern muss der Vorsitz geregelt werden (Art. 809 Abs. 3 OR); Beschluss der Gründer oder – soweit statutarisch vorgesehen – der Geschäftsführung. Als separater Beleg entbehrlich, wenn der Vorsitz bereits im Errichtungsakt festgehalten ist (Art. 71 Abs. 2 HRegV).',
      entbehrlichWennInUrkunde: 'Art. 71 Abs. 2 HRegV',
    });
  }
  // lit. f nachgerüstet auf juristischen Review-Befund M-2 (6.6.2026).
  if (e.weitereVertretungsberechtigte) {
    u.push({
      id: 'vertretungs-beschluss',
      titel: 'Beschluss über die Ernennung weiterer zur Vertretung berechtigter Personen',
      norm: 'Art. 71 Abs. 1 lit. f HRegV',
      phase: 'beurkundung',
      ersteller: 'gruender',
      ausgeloestDurch: 'Weitere Vertretungsberechtigte (Direktor:innen/Prokurist:innen)',
      hinweis: 'Beschluss der Gründer oder – soweit statutarisch vorgesehen – der Geschäftsführung.',
    });
  }

  // ── Anmeldung ──
  u.push({
    id: 'hr-anmeldung',
    titel: 'Anmeldung beim Handelsregisteramt',
    norm: 'Art. 18 HRegV',
    phase: 'anmeldung',
    ersteller: 'gruender',
    hinweis:
      'Unterschriften der Anmeldenden und der Zeichnungsberechtigten beglaubigen lassen, sofern nicht schon hinterlegt (Art. 21 Abs. 1 HRegV: beim Amt zeichnen, notariell oder QES); Gebühr CHF 420 (GebV-HReg Anhang Ziff. 1.3).',
  });

  // ── Nach Eintrag ──
  // Freigabe nur bei Geldeinlagen: Art. 633 OR betrifft die bei der Bank
  // hinterlegten Bareinlagen – bei reiner Sacheinlage/Verrechnung gibt es
  // kein Sperrkonto.
  if (mitBareinlage) {
    u.push({
      id: 'freigabe-einlagen',
      titel: 'Freigabe der hinterlegten Einlagen durch die Bank',
      norm: 'Art. 633 OR',
      phase: 'nachEintrag',
      ersteller: 'bank',
      hinweis: 'Die Bank gibt den Betrag erst nach dem Handelsregister-Eintrag frei (Abs. 2); Rechtspersönlichkeit entsteht mit der Eintragung (Art. 779 Abs. 1 OR).',
    });
  }
  u.push(
    {
      id: 'anteilbuch',
      titel: 'Anteilbuch anlegen',
      norm: 'Art. 790 OR',
      phase: 'nachEintrag',
      ersteller: 'gruender',
      hinweis: 'Gesellschafter, Nennwerte, Nutzniesser, Pfandgläubiger; jederzeitiger Zugriff in der Schweiz; Belege 10 Jahre aufbewahren.',
    },
    {
      // RECHTSLOGIK 5.10.2026 (§7, Normen-Monitor check:zitate rot): Art. 697j/697l/
      // 697m und 790a OR aufgehoben, Art. 718 Abs. 4 / 814 Abs. 3 dritter Satz OR neu
      // gefasst durch Anhang Ziff. 2 TJPG vom 26.9.2025, in Kraft seit 1.10.2026
      // (AS 2026 323; BBl 2024 1607). Geltend: TJPG, SR 955.3 —
      // https://www.fedlex.admin.ch/eli/cc/2026/323/de (Konsolidierung 20261001;
      // OR-Konsolidierung 20261001 der Vorfassung 20260101 gegenübergestellt). Die id
      // bleibt «wb-verzeichnis», weil die Dokumentmappen sie als Nicht-Beilage führen.
      // Gegenprüfung 5.10.2026: Tochter-Ausnahme nur «zu mehr als 75 Prozent» (Art. 3
      // lit. a TJPG); HR-Weg nur «wenn sie eine Tatsache ins Handelsregister eintragen
      // lässt» (Art. 11 Abs. 1 TJPG), separates Dokument zur Anmeldung (Art. 33 Abs. 1
      // TJPV, SR 955.31, https://www.fedlex.admin.ch/eli/cc/2026/364/de, Stand 1.10.2026).
      id: 'wb-verzeichnis',
      titel: 'Wirtschaftlich berechtigte Personen dokumentieren und dem Transparenzregister melden',
      norm: 'Art. 9 TJPG',
      phase: 'nachEintrag',
      ersteller: 'gruender',
      hinweis:
        'Wirtschaftlich berechtigt ist, wer die Gesellschaft mit mindestens 25 % des Kapitals oder der Stimmen oder auf andere Weise letztendlich kontrolliert, subsidiär das oberste Mitglied des leitenden Organs (Art. 4 TJPG). Die Gesellschaft identifiziert und überprüft diese Personen, dokumentiert die Angaben aktuell und mit jederzeitigem Zugriff in der Schweiz und bewahrt Informationen und Belege 10 Jahre über den Wegfall der Eigenschaft hinaus auf (Art. 7 und 8 TJPG). Meldung direkt an das Transparenzregister innert eines Monats nach der Handelsregister-Eintragung (Art. 9 Abs. 4 TJPG), Änderungen innert eines Monats ab Kenntnis (Art. 10 TJPG). Sind alle wirtschaftlich berechtigten Personen als Gesellschafter:innen oder Organ im Handelsregister eingetragen, kann die Meldung stattdessen über das Handelsregisteramt erfolgen, aber nur zusammen mit einer Handelsregister-Anmeldung – bei der Gründung also zusammen mit der Anmeldung, in einem separaten Dokument (Art. 11 TJPG, Art. 33 Abs. 1 TJPV). Gesellschafter:innen, deren Anteile die letztendliche Kontrolle ermöglichen, melden der Gesellschaft die wirtschaftlich berechtigte Person innert eines Monats nach Entstehung der Kontrolle (Art. 13 Abs. 3 TJPG). Ausnahmen, etwa börsenkotierte Gesellschaften und Tochtergesellschaften, die zu mehr als 75 % direkt oder indirekt von solchen gehalten werden: Art. 3 TJPG.',
    },
  );

  // ── Blocker / Hinweise ──
  if (!e.chWohnsitzVertretung) {
    blocker.push(
      'Die Gesellschaft muss durch eine Person mit Wohnsitz in der Schweiz vertreten werden können – Geschäftsführer:in oder Direktor:in mit Zugang zum Anteilbuch (Art. 814 Abs. 3 OR) und zu den dokumentierten Angaben über die wirtschaftlich berechtigten Personen (Art. 8 Abs. 4 TJPG). Ohne sie weist das Handelsregisteramt die Eintragung zurück.',
    );
  }
  if (e.fremdwaehrung) {
    hinweise.push(
      'Fremdwährungs-Stammkapital: nur die für die Geschäftstätigkeit wesentliche Währung nach Anhang 3 HRegV (GBP/EUR/USD/JPY); Gegenwert von mindestens CHF 20 000 bei der Errichtung und Rechnungslegung in derselben Währung (Art. 773 Abs. 2 i. V. m. Art. 621 Abs. 2 OR sinngemäss).',
    );
  }
  if (e.einlageArt === 'verrechnung' || e.einlageArt === 'gemischt') {
    hinweise.push(
      'Verrechnungsliberierung: Statuten müssen Betrag der Forderung, Name des Gesellschafters und die zukommenden Stammanteile angeben (Art. 634a Abs. 3 OR i. V. m. Art. 777c Abs. 2 OR).',
    );
  }
  if (mitSacheinlage) {
    hinweise.push(
      'Sacheinlage: Statuten müssen Gegenstand, Bewertung, Name des Einlegers und die ausgegebenen Stammanteile angeben (Art. 634 Abs. 4 OR i. V. m. Art. 777c Abs. 2 OR); eine allfällige weitere Gegenleistung gehört in die Statuten, aber nicht in den HR-Eintrag (EHRA-Praxismitteilung 2023-01).',
    );
  }

  const statutenKlauseln = e.statutKlauseln.map((k) => GMBH_KLAUSEL_KATALOG[k]);
  if (e.statutKlauseln.length > 0) {
    hinweise.push(
      'Bedingt notwendiger Statuteninhalt: Die gewählten Gestaltungen sind nur mit ausdrücklicher Statutenklausel wirksam (Art. 776a OR ist seit 1.1.2023 aufgehoben – Verankerung je Sachnorm); in der Urkunde über die Zeichnung ist auf Nachschuss-/Nebenleistungspflichten, Konkurrenzverbote, Vorhand-/Vorkaufs-/Kaufsrechte und Konventionalstrafen hinzuweisen (Art. 777a Abs. 2 OR).',
    );
  }

  return {
    unterlagen: u,
    statutenKlauseln,
    blocker,
    hinweise,
    emissionsabgabeChf: emissionsabgabe(e.leistungenChf),
  };
}

// ─── AG (Art. 43–45 HRegV · Art. 620–635a OR) ───────────────────────────────

export interface AgGruendungEingaben {
  einlageArt: EinlageArt;
  besondereVorteile: boolean;
  /** true = Verzicht auf eingeschränkte Revision (Opting-out, Art. 727a Abs. 2 OR). */
  optingOut: boolean;
  eigeneBueros: boolean;
  immobilienHauptzweck: boolean;
  /** Inhaberaktien vorgesehen → Gate Art. 622 Abs. 1bis OR. */
  inhaberaktien: boolean;
  /** Aktienkapital in ausländischer Währung (Anhang 3 HRegV). */
  fremdwaehrung: boolean;
  bankInUrkundeGenannt: boolean;
  /** Mind. eine vertretungsberechtigte Person (VR-Mitglied oder Direktor:in) mit CH-Wohnsitz. */
  chWohnsitzVertretung: boolean;
  /** Gesamtleistungen der Aktionäre in CHF (Emissionsabgabe-Hinweis). */
  leistungenChf?: number;
}

export function agGruendungsunterlagen(e: AgGruendungEingaben): GruendungsunterlagenErgebnis {
  const u: Unterlage[] = [];
  const blocker: string[] = [];
  const hinweise: string[] = [STAMPA_HINWEIS, ORIGINAL_HINWEIS];

  const qualifiziert = e.einlageArt !== 'bar' || e.besondereVorteile;
  const mitBareinlage = e.einlageArt === 'bar' || e.einlageArt === 'gemischt';
  const mitSacheinlage = e.einlageArt === 'sacheinlage' || e.einlageArt === 'gemischt';

  // ── Vorbereitung ──
  u.push({
    id: 'statutenentwurf',
    titel: 'Statutenentwurf',
    norm: 'Art. 626 OR',
    phase: 'vorbereitung',
    ersteller: 'gruender',
    hinweis:
      'Mindestinhalt Abs. 1 (Ziff. 1–4 und 7; Ziff. 5/6 aufgehoben): Firma/Sitz · Zweck · Höhe und Währung des Aktienkapitals samt geleisteten Einlagen · Anzahl/Nennwert/Art der Aktien · Form der Mitteilungen. Amtliche Muster: HRegA ZH («AG kurz/lang»), SG (mit Vinkulierung), BE (vom HRegA vorgeprüft).',
  });
  if (mitBareinlage) {
    u.push({
      id: 'kapitaleinlagekonto',
      titel: 'Kapitaleinzahlung auf Sperrkonto einer Bank',
      norm: 'Art. 633 OR',
      phase: 'vorbereitung',
      ersteller: 'bank',
      hinweis:
        'Mindesteinlage: 20 % je Aktie, gesamthaft mindestens CHF 50 000 (Art. 632 OR); Hinterlegung zur ausschliesslichen Verfügung der Gesellschaft.',
    });
    if (!e.bankInUrkundeGenannt) {
      u.push({
        id: 'bankbescheinigung',
        titel: 'Bankbescheinigung über die hinterlegten Einlagen',
        norm: 'Art. 43 Abs. 1 lit. f HRegV',
        phase: 'vorbereitung',
        ersteller: 'bank',
        ausgeloestDurch: 'Bank nicht in der öffentlichen Urkunde genannt',
      });
    }
  }
  u.push({
    id: 'ausweise',
    titel: 'Ausweiskopien aller einzutragenden Personen',
    norm: 'Art. 24a HRegV',
    phase: 'vorbereitung',
    ersteller: 'gruender',
  });
  if (mitSacheinlage) {
    u.push({
      id: 'sacheinlagevertrag',
      titel: 'Sacheinlagevertrag mit den erforderlichen Beilagen (Inventar/Übernahmebilanz)',
      norm: 'Art. 43 Abs. 3 lit. a HRegV',
      phase: 'vorbereitung',
      ersteller: 'gruender',
      ausgeloestDurch: 'Sacheinlage',
      hinweis: 'Schriftlich; öffentliche Beurkundung, wenn die Übertragung des Gegenstands sie verlangt (Art. 634 Abs. 2 OR); eine Urkunde genügt auch bei Grundstücken in mehreren Kantonen (Abs. 3).',
    });
  }
  if (qualifiziert) {
    u.push(
      {
        id: 'gruendungsbericht',
        titel: 'Gründungsbericht, von allen Gründerinnen und Gründern unterzeichnet',
        norm: 'Art. 635 OR',
        phase: 'vorbereitung',
        ersteller: 'gruender',
        ausgeloestDurch: 'Qualifizierte Gründung (Sacheinlage/Verrechnung/besondere Vorteile)',
      },
      {
        id: 'pruefungsbestaetigung',
        titel: 'Vorbehaltlose Prüfungsbestätigung eines zugelassenen Revisors',
        norm: 'Art. 635a OR',
        phase: 'vorbereitung',
        ersteller: 'revisor',
        ausgeloestDurch: 'Qualifizierte Gründung',
      },
    );
  }
  if (!e.eigeneBueros) {
    u.push({
      id: 'domizilannahme',
      titel: 'Domizilannahmeerklärung der Domizilhalterin / des Domizilhalters',
      norm: 'Art. 43 Abs. 1 lit. g HRegV',
      phase: 'vorbereitung',
      ersteller: 'gruender',
      ausgeloestDurch: 'Kein eigenes Büro am Sitz (c/o-Adresse)',
      hinweis: 'Art. 117 Abs. 3 HRegV; amtliche Vorlage beim HRegA ZH.',
    });
  }
  if (e.immobilienHauptzweck) {
    u.push({
      id: 'lex-koller',
      titel: 'Lex-Koller-Erklärung (kantonales Formular)',
      norm: 'Art. 2 BewG',
      phase: 'vorbereitung',
      ersteller: 'gruender',
      ausgeloestDurch: 'Immobilien-Haupttätigkeit',
      hinweis: 'Durch ein VR-Mitglied zu unterzeichnen (Praxis ZH); BE nennt sie weiterhin «Lex-Friedrich-Erklärung». Verlangt die Bewilligungsbehörde nach Verweisung zusätzlich eine Lex-Koller-BEWILLIGUNG (ZH-Checkliste Neueintragung Ziff. 12), ist diese beizubringen – Einzelfall, kein Beleg des Normalfalls (Musterabgleich 10.6.2026, B8).',
    });
  }
  if (e.inhaberaktien) {
    u.push({
      id: 'inhaberaktien-nachweis',
      titel: 'Nachweis Börsenkotierung oder Ausgestaltung der Inhaberaktien als Bucheffekten',
      norm: 'Art. 43 Abs. 1 lit. i HRegV',
      phase: 'vorbereitung',
      ersteller: 'gruender',
      ausgeloestDurch: 'Inhaberaktien',
      hinweis:
        'Inhaberaktien sind nur zulässig bei Börsenkotierung oder als Bucheffekten mit Verwahrungsstelle in der Schweiz (Art. 622 Abs. 1bis OR); der gewählte Fall wird ins HR eingetragen (Abs. 2bis).',
    });
  }

  // ── Beurkundung ──
  u.push(
    {
      id: 'errichtungsakt',
      titel: 'Öffentliche Urkunde über den Errichtungsakt',
      norm: 'Art. 43 Abs. 1 lit. a HRegV',
      phase: 'beurkundung',
      ersteller: 'notariat',
      hinweis:
        'Inhalt nach Art. 44 HRegV und Art. 629 OR: Gründungserklärung, Statutenfestlegung, Organbestellung, Aktienzeichnung mit Feststellungen (Abs. 2 Ziff. 1–4, inkl. Stampa-Inhalt als Ziff. 4)' +
        (e.fremdwaehrung ? '; Umrechnungskurse in der Urkunde (Art. 629 Abs. 3 OR, Art. 44 lit. j HRegV)' : '') +
        (e.optingOut
          ? '; Opting-out direkt in der Urkunde feststellen: keine ordentliche Revisionspflicht, höchstens 10 Vollzeitstellen, Zustimmung aller Gründer (Art. 727a Abs. 2 OR)'
          : '') +
        '. Die Urkundsperson nennt alle Belege einzeln und bestätigt deren Vorliegen (Art. 631 OR).',
    },
    {
      id: 'statuten',
      titel: 'Statuten (definitive Fassung)',
      norm: 'Art. 43 Abs. 1 lit. b HRegV',
      phase: 'beurkundung',
      ersteller: 'notariat',
      hinweis: 'Durch die Urkundsperson zu beglaubigen; stets vollständige Fassung (Art. 22 Abs. 3/4 HRegV).',
    },
    {
      id: 'wahlannahme-vr',
      titel: 'Wahlannahme-Nachweis der Mitglieder des Verwaltungsrats',
      norm: 'Art. 43 Abs. 1 lit. c HRegV',
      phase: 'beurkundung',
      ersteller: 'gruender',
      hinweis:
        'Entbehrlich, wenn die Annahme in der Urkunde selbst erfolgt oder die Gewählten die HR-Anmeldung unterzeichnen (Praxis ZH/LU/BE); sonst original handschriftlich; amtliches ZH-Muster vorhanden.',
    },
    {
      id: 'vr-konstituierung',
      titel: 'Protokoll des Verwaltungsrats über Konstituierung, Vorsitz und Zeichnungsbefugnisse',
      norm: 'Art. 43 Abs. 1 lit. e HRegV',
      phase: 'beurkundung',
      ersteller: 'gruender',
      hinweis:
        'Pflichtbeleg der AG (anders als bei der GmbH): Präsidentenwahl bei mehrgliedrigem VR (Art. 712 OR), Zeichnungsberechtigte mit Unterschriftsart; vier Einreichungsformen (Vollprotokoll/Auszug/Zirkularbeschluss/beglaubigte Kopie), Unterschriften der Vertretungsberechtigten amtlich beglaubigt (Art. 20, 23 HRegV).',
    },
  );
  if (!e.optingOut) {
    u.push({
      id: 'wahlannahme-rs',
      titel: 'Wahlannahme-Nachweis der Revisionsstelle',
      norm: 'Art. 43 Abs. 1 lit. d HRegV',
      phase: 'beurkundung',
      ersteller: 'gruender',
      ausgeloestDurch: 'Revisionsstelle bestellt (kein Opting-out)',
    });
  }

  // ── Anmeldung ──
  u.push({
    id: 'hr-anmeldung',
    titel: 'Anmeldung beim Handelsregisteramt',
    norm: 'Art. 18 HRegV',
    phase: 'anmeldung',
    ersteller: 'gruender',
    hinweis:
      'Unterschriften beglaubigen, sofern nicht hinterlegt (Art. 21 Abs. 1 HRegV); Gebühr CHF 420 (GebV-HReg Anhang Ziff. 1.3).',
  });

  // ── Nach Eintrag ──
  // Freigabe nur bei Geldeinlagen (Art. 633 OR, wie GmbH).
  if (mitBareinlage) {
    u.push({
      id: 'freigabe-einlagen',
      titel: 'Freigabe der hinterlegten Einlagen durch die Bank',
      norm: 'Art. 633 OR',
      phase: 'nachEintrag',
      ersteller: 'bank',
      hinweis: 'Freigabe erst nach Eintrag (Abs. 2); Rechtspersönlichkeit entsteht mit der Eintragung (Art. 643 Abs. 1 OR).',
    });
  }
  u.push(
    {
      id: 'aktienbuch',
      titel: 'Aktienbuch anlegen (Namenaktien)',
      norm: 'Art. 686 OR',
      phase: 'nachEintrag',
      ersteller: 'gruender',
      hinweis: 'Eigentümer/Nutzniesser mit Namen und Adresse; jederzeitiger Zugriff in der Schweiz; Belege 10 Jahre aufbewahren.',
    },
    {
      // RECHTSLOGIK 5.10.2026 (§7, Normen-Monitor check:zitate rot): Art. 697j/697l/
      // 697m und 790a OR aufgehoben, Art. 718 Abs. 4 / 814 Abs. 3 dritter Satz OR neu
      // gefasst durch Anhang Ziff. 2 TJPG vom 26.9.2025, in Kraft seit 1.10.2026
      // (AS 2026 323; BBl 2024 1607). Geltend: TJPG, SR 955.3 —
      // https://www.fedlex.admin.ch/eli/cc/2026/323/de (Konsolidierung 20261001;
      // OR-Konsolidierung 20261001 der Vorfassung 20260101 gegenübergestellt). Die id
      // bleibt «wb-verzeichnis», weil die Dokumentmappen sie als Nicht-Beilage führen.
      // Gegenprüfung 5.10.2026: Tochter-Ausnahme nur «zu mehr als 75 Prozent» (Art. 3
      // lit. a TJPG); HR-Weg nur «wenn sie eine Tatsache ins Handelsregister eintragen
      // lässt» (Art. 11 Abs. 1 TJPG), separates Dokument zur Anmeldung (Art. 33 Abs. 1
      // TJPV, SR 955.31, https://www.fedlex.admin.ch/eli/cc/2026/364/de, Stand 1.10.2026).
      id: 'wb-verzeichnis',
      titel: 'Wirtschaftlich berechtigte Personen dokumentieren und dem Transparenzregister melden',
      norm: 'Art. 9 TJPG',
      phase: 'nachEintrag',
      ersteller: 'gruender',
      hinweis:
        'Wirtschaftlich berechtigt ist, wer die Gesellschaft mit mindestens 25 % des Kapitals oder der Stimmen oder auf andere Weise letztendlich kontrolliert, subsidiär das oberste Mitglied des leitenden Organs (Art. 4 TJPG). Die Gesellschaft identifiziert und überprüft diese Personen, dokumentiert die Angaben aktuell und mit jederzeitigem Zugriff in der Schweiz und bewahrt Informationen und Belege 10 Jahre über den Wegfall der Eigenschaft hinaus auf (Art. 7 und 8 TJPG). Meldung direkt an das Transparenzregister innert eines Monats nach der Handelsregister-Eintragung (Art. 9 Abs. 4 TJPG), Änderungen innert eines Monats ab Kenntnis (Art. 10 TJPG). Sind alle wirtschaftlich berechtigten Personen als Organ im Handelsregister eingetragen, kann die Meldung stattdessen über das Handelsregisteramt erfolgen, aber nur zusammen mit einer Handelsregister-Anmeldung – bei der Gründung also zusammen mit der Anmeldung, in einem separaten Dokument (Art. 11 TJPG, Art. 33 Abs. 1 TJPV). Aktionär:innen, deren Anteile die letztendliche Kontrolle ermöglichen, melden der Gesellschaft die wirtschaftlich berechtigte Person innert eines Monats nach Entstehung der Kontrolle (Art. 13 Abs. 3 TJPG). Ausnahmen, etwa börsenkotierte Gesellschaften und Tochtergesellschaften, die zu mehr als 75 % direkt oder indirekt von solchen gehalten werden: Art. 3 TJPG.',
    },
  );

  // ── Blocker / Hinweise ──
  if (!e.chWohnsitzVertretung) {
    blocker.push(
      'Die Gesellschaft muss durch eine Person mit Wohnsitz in der Schweiz vertreten werden können – VR-Mitglied oder Direktor:in mit Zugang zum Aktienbuch (Art. 718 Abs. 4 OR) und zu den dokumentierten Angaben über die wirtschaftlich berechtigten Personen (Art. 8 Abs. 4 TJPG). Ohne sie weist das Handelsregisteramt die Eintragung zurück.',
    );
  }
  if (e.fremdwaehrung) {
    hinweise.push(
      'Fremdwährungs-Aktienkapital: nur die für die Geschäftstätigkeit wesentliche Währung nach Anhang 3 HRegV (GBP/EUR/USD/JPY); Gegenwert von mindestens CHF 100 000 bei der Errichtung, geleistete Einlagen im Gegenwert von mindestens CHF 50 000, Buchführung und Rechnungslegung in derselben Währung (Art. 621 Abs. 2, Art. 632 Abs. 2 OR).',
    );
  }
  if (e.einlageArt === 'verrechnung' || e.einlageArt === 'gemischt') {
    hinweise.push(
      'Verrechnungsliberierung: Statuten müssen Betrag der Forderung, Name des Aktionärs und die ihm zukommenden Aktien angeben (Art. 634a Abs. 3 OR).',
    );
  }
  if (mitSacheinlage) {
    hinweise.push(
      'Sacheinlage: Statuten müssen Gegenstand, Bewertung, Name des Einlegers, ausgegebene Aktien und allfällige weitere Gegenleistungen angeben (Art. 634 Abs. 4 OR); die weitere Gegenleistung unterliegt nicht der HR-Publizität (EHRA-Praxismitteilung 2023-01).',
    );
  }

  return {
    unterlagen: u,
    statutenKlauseln: [],
    blocker,
    hinweise,
    emissionsabgabeChf: emissionsabgabe(e.leistungenChf),
  };
}
