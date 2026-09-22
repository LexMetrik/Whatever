// ─── Verfahrenskette einer Vorlage (Fedlex-Gesetzgebungs-Projektgraph) ───────
//
// E1 von «Entstehung am Artikel» (FAHRPLAN-MATERIALIEN-VERZAHNUNG §11.4/§11.7).
// Die `?event`-Knoten am Projekt-Knoten (`jolux:draftHasLegislativeTask`) tragen
// `jolux:legislativeTaskType` aus dem amtlichen Vokabular `type-projet` — das ist
// die Zeitachse einer Vorlage: Vernehmlassung → Botschaft → Beschluss des
// Parlaments → Referendumsfrist → Abstimmung → Inkrafttreten.
//
// §2 Determinismus: die Code→Etikett-Zuordnung ist eine FESTE, amtlich belegte
// Tabelle (unten), keine Heuristik. Ein Code ausserhalb der Tabelle ist ein
// Vokabular-Zuwachs und macht den Generator rot (nie stillschweigend «sonstiges»).
// §3 Schichtentrennung: reine Daten/Typen + eine Nachschlage-Funktion, keine UI.
//
// Quelle der Tabelle: SPARQL gegen <https://fedlex.data.admin.ch/vocabulary/type-projet>
// (`skos:inScheme` + `skos:prefLabel`@de), abgerufen 2026-09-11 — 26 Einträge,
// vollständig (kein OFFSET-Rest: COUNT = 26). Die deutschen Etiketten sind amtlich
// zitiert, nicht umformuliert (§1).

/** Stabiler, sprach-unabhängiger Schlüssel eines Verfahrensschritts. */
export type VerfahrensTyp =
  | 'vernehmlassung'
  | 'erlassentwurf'
  | 'vernehmlassung-geplant'
  | 'vernehmlassung-eroeffnung'
  | 'stellungnahmen-publiziert'
  | 'ergebnisbericht'
  | 'vernehmlassung-eroeffnung-bbl-vern'
  | 'vernehmlassung-eroeffnung-bbl'
  | 'volksabstimmung-ergebnis'
  | 'botschaft'
  | 'stellungnahme-br'
  | 'beschluss-parlament'
  | 'bericht-kommission'
  | 'referendumsfrist'
  | 'referendum-eingereicht'
  | 'referendum-zustandegekommen'
  | 'referendum-nicht-zustandegekommen'
  | 'abstimmungsgegenstaende-br'
  | 'abgestimmt'
  | 'inkrafttreten'
  | 'teilinkraftsetzung'
  | 'geaendert-in-anderem-erlass'
  | 'berichtigung'
  | 'mitteilung'
  | 'aufgehoben-in-anderem-erlass'
  | 'anderweitig-erledigt';

/**
 * Ein Schritt der Verfahrenskette.
 *
 * GESPEICHERT wird NUR der amtliche `type-projet`-Code (plus Datum und Publikation) —
 * Schlüssel (`VerfahrensTyp`) und Etikett sind daraus über die feste Tabelle ableitbar
 * und werden deshalb NICHT mitgespeichert (§5: keine zweite Wahrheit; ausserdem spart
 * es die Hälfte der Nutzlast — gemessen 126.9 → 63.5 KB über 1 609 Ereignisse).
 */
export interface VerfahrensEreignis {
  /** Amtlicher Code — Bund: `type-projet`; BS: BS_GROSSRAT (nur mit `vok: 'bs-gr'`). */
  code: number;
  /** `jolux:decisionDate` ISO (fehlt bei undatierten Schritten, z. B. Typ 1). */
  datum?: string;
  /** ELI-Kurzform der Publikation dieses Schritts («fga/2017/2057»), ohne Host.
   *  Bei `vok: 'bs-gr'` stattdessen die amtliche Dokument-URL, WÖRTLICH übernommen.
   *  Warum nicht die Signatur: `signatur_dok` ist in Basel-Stadt kein Schlüssel, aus
   *  dem sich eine URL bauen liesse — 16 der 440 Dokumente tragen dort zwei Nummern
   *  («18.0110.01 18.0112.01», ein Bericht zu zwei Geschäften) oder einen Zusatz
   *  («04.2014.01 (RA 9424)»), und ihre amtliche Adresse ist ein direkter PDF-Pfad.
   *  Eine konstruierte `?dnr=`-URL wäre dort still tot (§7: URL nie konstruieren). */
  res?: string;
  /** Vokabular des `code`. Fehlt = Bund/`type-projet` (alle Bestandsdaten, §6 byte-gleich).
   *  'bs-gr' = Grosser Rat Basel-Stadt (K-16) — ZWEI Vokabulare, nie ein gemeinsamer
   *  Zahlenraum: dieselbe Zahl bedeutet in beiden etwas anderes (§1, nie stillschweigend
   *  gleichbehandeln). Die BS-Codes liegen zusätzlich ab 1000, damit eine vergessene
   *  `vok`-Angabe auffliegt statt still ein Bundes-Etikett zu erben. */
  vok?: 'bs-gr';
  /** Amtliche Bezeichnung des BS-Dokuments, wörtlich («Bericht der WAK»); nur bei
   *  `vok: 'bs-gr'`. Das Etikett ist damit ein Zitat, keine Umschreibung (§1) — die
   *  Klassen-Tabelle unten gruppiert nur, sie ersetzt die amtliche Bezeichnung nie. */
  bez?: string;
}

/** FESTE amtliche Tabelle `type-projet` → {Schlüssel, deutsches Etikett}. */
export const TYPE_PROJET: Readonly<Record<number, { typ: VerfahrensTyp; label: string }>> = {
  1: { typ: 'vernehmlassung', label: 'Vernehmlassung' },
  2: { typ: 'erlassentwurf', label: 'Erlassentwurf' },
  3: { typ: 'vernehmlassung-geplant', label: 'Geplante Vernehmlassungen' },
  4: { typ: 'vernehmlassung-eroeffnung', label: 'Eröffnung der Vernehmlassung' },
  5: { typ: 'stellungnahmen-publiziert', label: 'Veröffentlichung der Stellungnahmen' },
  6: { typ: 'ergebnisbericht', label: 'Veröffentlichung des Ergebnisberichts' },
  7: { typ: 'vernehmlassung-eroeffnung-bbl-vern', label: 'Publikation der Eröffnung der Vernehmlassung' },
  8: { typ: 'vernehmlassung-eroeffnung-bbl', label: 'Publikation der Eröffnung im BBl' },
  9: { typ: 'volksabstimmung-ergebnis', label: 'Ergebnis der Volksabstimmung' },
  200: { typ: 'botschaft', label: 'Botschaft des Bundesrats' },
  201: { typ: 'stellungnahme-br', label: 'Stellungnahme des Bundesrates' },
  300: { typ: 'beschluss-parlament', label: 'Beschluss des Parlaments' },
  301: { typ: 'bericht-kommission', label: 'Bericht Kommission' },
  400: { typ: 'referendumsfrist', label: 'Ablauf der Referendumsfrist am' },
  450: { typ: 'referendum-eingereicht', label: 'Referendum eingereicht am' },
  480: { typ: 'referendum-zustandegekommen', label: 'Ref. Zustandegekommen' },
  490: { typ: 'referendum-nicht-zustandegekommen', label: 'Ref. nicht zustandegekommen' },
  630: { typ: 'abstimmungsgegenstaende-br', label: 'Festlegung Abstimmungsgegenstände BR' },
  650: { typ: 'abgestimmt', label: 'Abgestimmt am' },
  700: { typ: 'inkrafttreten', label: 'Inkrafttreten am' },
  701: { typ: 'teilinkraftsetzung', label: 'Teilinkraftsetzung' },
  710: { typ: 'geaendert-in-anderem-erlass', label: 'Geändert in anderem Erlass' },
  715: { typ: 'berichtigung', label: 'Berichtigung' },
  716: { typ: 'mitteilung', label: 'Mitteilung' },
  720: { typ: 'aufgehoben-in-anderem-erlass', label: 'Aufgehoben in anderem Erlass' },
  900: { typ: 'anderweitig-erledigt', label: 'Anderweitig erledigt' },
};

// ─── BS: Verfahrensschritte des Grossen Rates Basel-Stadt (K-16) ─────────────
//
// Der Bund hat ein amtliches Vokabular (`type-projet`, 26 Codes) — Basel-Stadt hat
// keines. Was es gibt, ist das Feld `titel_dok` des Datensatzes 100313 («Grosser Rat:
// Dokumente»): eine gewachsene, offene Liste amtlicher Bezeichnungen («Ratschlag des
// RR», «Bericht der WAK», «GR Beschluss», «Bericht der WAK Nr. 9411 (zu 9374A)»).
// Gemessen über die 440 Dokumente der verkanteten Geschäfte: 40 verschiedene Werte,
// mit langem Einzelfall-Schwanz (Vormessung 12.9.2026).
//
// Darum ZWEI Angaben je Ereignis statt einer:
//   · `bez`  = die amtliche Bezeichnung, wörtlich übernommen (das Etikett, §1);
//   · `code` = eine von fünf DEKLARIERTEN Klassen für Sortierung/Filter (die Gruppe).
// Die Klassen-Zuordnung ist eine feste, geordnete Regelliste (unten), keine Ähnlichkeits-
// suche und kein Scoring (§2). Ein Dokument, auf das keine Regel passt, wird NICHT
// geraten und NICHT als «sonstiges» eingereiht, sondern gar nicht als Verfahrensschritt
// geführt — der Generator zählt es und `check:bs-materialien` weist die Liste aus, damit
// ein Zuwachs sichtbar wird statt still zu verschwinden (§8).
//
// NICHT enthalten, weil die amtliche Geschäftsdatenbank sie nicht führt (gemessen):
// Referendumsfrist, Volksabstimmung und Publikation im Kantonsblatt. Sie stehen an der
// Gesetzessammlung (`change_documents`), nicht am Geschäft — lieber eine ehrlich kurze
// Kette als eine erfundene lange (§8).

/** Klassen-Schlüssel eines BS-Verfahrensschritts. */
export type VerfahrensTypBs =
  | 'bs-vorlage-rr'
  | 'bs-bericht-rr'
  | 'bs-bericht-kommission'
  | 'bs-schreiben-rr'
  | 'bs-beschluss-gr';

/** FESTE Klassen-Tabelle des BS-Vokabulars (Codes ab 1000, s. `vok`-Kommentar). */
export const BS_GROSSRAT: Readonly<Record<number, { typ: VerfahrensTypBs; label: string }>> = {
  1010: { typ: 'bs-vorlage-rr', label: 'Vorlage des Regierungsrats (Ratschlag)' },
  1020: { typ: 'bs-bericht-rr', label: 'Bericht des Regierungsrats' },
  1030: { typ: 'bs-bericht-kommission', label: 'Bericht der Kommission' },
  1040: { typ: 'bs-schreiben-rr', label: 'Schreiben/Stellungnahme des Regierungsrats' },
  1050: { typ: 'bs-beschluss-gr', label: 'Beschluss des Grossen Rates' },
};

/**
 * GEORDNETE Regelliste `titel_dok` → Klasse. Die Reihenfolge ist Teil der Regel
 * (erste Übereinstimmung gewinnt): «Ratschlag und Bericht des RR» ist eine Vorlage,
 * kein Bericht. Alle Muster sind am Anfang verankert — ein Wort irgendwo im Titel
 * reicht nie (das wäre die Substring-Falle, CLAUDE.md §7).
 */
const BS_DOKTYP_REGELN: ReadonlyArray<{ muster: RegExp; code: number }> = [
  { muster: /^Ratschlag\b/, code: 1010 },
  { muster: /^Ausgabenbericht\b/, code: 1010 },
  { muster: /^(Zwischen)?[Bb]ericht des RR\b/, code: 1020 },
  { muster: /^Bericht\b/, code: 1030 },
  { muster: /^(Schreiben|Stellungnahme) (des|der) \S+/, code: 1040 },
  { muster: /^(GR Beschluss|Beschluss|Beschlussdokument)\b/, code: 1050 },
];

/** Amtliche Bezeichnung → Klassen-Code; `null`, wenn keine Regel greift (nie raten, §2). */
export function bsCodeVonBezeichnung(bez: string): number | null {
  for (const r of BS_DOKTYP_REGELN) if (r.muster.test(bez)) return r.code;
  return null;
}

/** Amtlicher Code → Schlüssel. Unbekannter Code ⇒ Fehler (§2: nie raten). */
export function verfahrensTypVonCode(code: number, vok?: 'bs-gr'): VerfahrensTyp | VerfahrensTypBs {
  if (vok === 'bs-gr') {
    const b = BS_GROSSRAT[code];
    if (!b) {
      throw new Error(
        `verfahren: unbekannter BS-Grossrat-Code ${code} — Klassen-Tabelle in `
        + 'src/lib/materialien/verfahren.ts nachführen (nie raten, §2).',
      );
    }
    return b.typ;
  }
  const t = TYPE_PROJET[code];
  if (!t) {
    throw new Error(
      `verfahren: unbekannter type-projet-Code ${code} — Vokabular-Zuwachs. `
      + 'Tabelle in src/lib/materialien/verfahren.ts gegen den amtlichen Vokabular-Graphen nachführen (nie raten, §2).',
    );
  }
  return t.typ;
}

/** Stabiler Schlüssel eines gespeicherten Ereignisses (abgeleitet, nie gespeichert). */
function verfahrensTyp(e: VerfahrensEreignis): VerfahrensTyp | VerfahrensTypBs {
  return verfahrensTypVonCode(e.code, e.vok);
}

/** Amtliches deutsches Etikett eines Schritts (Zitat, nie umformuliert §1).
 *  BS: die wörtliche Bezeichnung des Dokuments, sonst das Klassen-Etikett. */
export function verfahrensLabel(e: VerfahrensEreignis): string {
  if (e.vok === 'bs-gr') return e.bez ?? BS_GROSSRAT[e.code]?.label ?? String(verfahrensTyp(e));
  return TYPE_PROJET[e.code]?.label ?? (verfahrensTypVonCode(e.code) as string);
}

/** Live-Link zur Publikation eines Schritts (§7c), null ohne `res`.
 *  Bund: Fedlex-ELI aus der Kurzform · BS: die amtliche URL, unverändert. */
export function verfahrensQuelleUrl(e: VerfahrensEreignis): string | null {
  if (!e.res) return null;
  if (e.vok === 'bs-gr') return e.res;
  return `https://www.fedlex.admin.ch/eli/${e.res}/de`;
}
