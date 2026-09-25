// scripts/normtext/entscheide-text.ts — Leaf-Modul (§6.6): die Text-Assemblage
// eines Entscheid-Snapshots für die Zitat-Extraktion (Regeste, Sprachfassungen,
// Abschnitte, Auszug), ihre Sprach-Zuordnung je Stück (SPRACH_HOMONYME) und die
// Literatur-Kontext-Regel. Wortgleich aus entscheide-mapping.ts ausgelagert
// (QS-KORPUS 25.9.2026, check:schlankheit); entscheide-mapping.ts reicht alle
// Exporte weiter, bestehende Importe bleiben gültig.
import type { EntscheidSnapshot, EntscheidSprache } from '../../src/lib/rechtsprechung/typen';
import { spracheAusBody } from './sprache-aus-body';
import { verbindeMehrwortKuerzel } from './mehrwort-kuerzel';

/**
 * Deterministische Text-Assemblage eines Snapshots für die Zitat-Extraktion
 * (W2·6-NKEY Baustein d): Regeste (flach + alle Sprachfassungen inkl. der
 * mehrteiligen «Regeste a/b/c») und alle Abschnitts-Blöcke (Volltext UND
 * BGE-Auszug). KEINE weiteren Felder — kein Rubrum, keine Dispositiv-Orders,
 * keine Zitierung: dort stehen Parteien-/Verfahrensangaben, keine Norm-Zitate.
 * Rein (§2): gleiche Eingabe → gleicher String.
 */
export function fliesstextVon(snap: EntscheidSnapshot): string {
  return zusammen(stueckeVon(snap).map((st) => st.text));
}

/**
 * Herkunft eines Textstücks — trägt die Sprach-Zuordnung (SPRACH_HOMONYME):
 *  · 'sammel'  — flache Regeste (bei BGE dreisprachig zusammengeführt),
 *  · 'fassung' — eine amtliche Regeste-Sprachfassung (Sprache strukturbasiert),
 *  · 'body'    — Abschnitte (Volltext bzw. Auszug-only-Body),
 *  · 'auszug'  — BGE-Sammlungstext neben dem Volltext.
 */
type StueckArt = 'sammel' | 'fassung' | 'body' | 'auszug';
interface Stueck { readonly art: StueckArt; readonly fassung?: EntscheidSprache; readonly text: string }

/** Die EINE Stück-Folge hinter `fliesstextVon` UND `sprachStueckeVon` (§5). */
function stueckeVon(snap: EntscheidSnapshot): Stueck[] {
  const out: Stueck[] = [];
  const reg = snap.regeste;
  if (reg) {
    out.push({ art: 'sammel', text: reg.text });
    for (const f of reg.sprachfassungen ?? []) {
      for (const t of fassungsTeile(f)) out.push({ art: 'fassung', fassung: f.sprache, text: t });
    }
  }
  for (const t of blockTeile(snap.abschnitte)) out.push({ art: 'body', text: t });
  for (const t of blockTeile(snap.auszugAbschnitte)) out.push({ art: 'auszug', text: t });
  return out.filter((st) => typeof st.text === 'string' && st.text.trim() !== '');
}

/** Ein Textstück mit seiner EINDEUTIGEN Sprache — null, wo sie nicht eindeutig ist. */
export interface SprachStueck { readonly sprache: EntscheidSprache | null; readonly text: string }

/**
 * Sprache der SAMMEL-Teile eines Snapshots — flache Regeste und Roh-statutes
 * (`zitierteNormen`), die keiner einzelnen Textstelle zugeordnet sind.
 * Eindeutig nur bei einem EINSPRACHIGEN Entscheid: kein BGE-Bezug (die BGE-
 * Regeste ist amtlich dreisprachig, OCL führt sie flach zusammen und zieht
 * statutes auch aus der fremdsprachigen Regeste — gemessen 25.9.2026: BGE
 * 147_II_264 (it) trägt «Art. 8 Abs. 1 AIMP» aus der FR-Regeste = IVöB) und keine
 * Regeste-Sprachfassung in anderer Sprache. Sonst null (§8). Rein (§2).
 */
export function spracheDerSammelteile(snap: EntscheidSnapshot): EntscheidSprache | null {
  if (snap.bgeReferenz) return null;
  if ((snap.regeste?.sprachfassungen ?? []).some((f) => f.sprache !== snap.sprache)) return null;
  return snap.sprache ?? null;
}

/**
 * Sprache einer Abschnittsfolge: `snap.sprache`, ausser die Body-Erkennung
 * (`spracheAusBody`, dieselbe Funktion, die `snap.sprache` beim Bau setzt)
 * widerspricht — dann null. Belegter Grund (25.9.2026): 2 BGE tragen einen
 * Sammlungs-Auszug in anderer Sprache als ihr Volltext.
 */
function abschnittSprache(snap: EntscheidSnapshot, abschnitte: EntscheidSnapshot['abschnitte'] | undefined): EntscheidSprache | null {
  const erkannt = spracheAusBody(abschnitte ?? []);
  if (erkannt && erkannt !== snap.sprache) return null;
  return snap.sprache ?? null;
}

/**
 * Die Stücke von `fliesstextVon` in derselben Reihenfolge, je mit eindeutiger
 * Sprache oder null (SPRACH_HOMONYME). Rein (§2).
 */
export function sprachStueckeVon(snap: EntscheidSnapshot): SprachStueck[] {
  const stuecke = stueckeVon(snap);
  const sammel = spracheDerSammelteile(snap);
  const body = stuecke.some((st) => st.art === 'body') ? abschnittSprache(snap, snap.abschnitte) : null;
  const auszug = stuecke.some((st) => st.art === 'auszug') ? abschnittSprache(snap, snap.auszugAbschnitte) : null;
  return stuecke.map((st) => ({
    text: st.text,
    sprache: st.art === 'fassung' ? (st.fassung ?? null)
      : st.art === 'sammel' ? sammel
        : st.art === 'body' ? body : auszug,
  }));
}

/** Gemeinsame Endstufe aller Text-Assemblagen: leere Teile weg, mit `\n` fügen. */
function zusammen(teile: readonly (string | undefined)[]): string {
  return teile.filter((t) => typeof t === 'string' && t.trim() !== '').join('\n');
}

/** Regeste-Anteil (flach + alle Sprachfassungen inkl. «Regeste a/b/c»), in Reihenfolge. */
function regesteTeile(snap: EntscheidSnapshot): string[] {
  const teile: string[] = [];
  const reg = snap.regeste;
  if (!reg) return teile;
  teile.push(reg.text);
  for (const f of reg.sprachfassungen ?? []) teile.push(...fassungsTeile(f));
  return teile;
}

/** Kopf, Absätze und «Regeste a/b/c»-Teile EINER Sprachfassung, in Reihenfolge. */
function fassungsTeile(f: NonNullable<NonNullable<EntscheidSnapshot['regeste']>['sprachfassungen']>[number]): string[] {
  const teile: string[] = [f.kopf, ...(f.absaetze ?? [])];
  for (const w of f.weitereRegesten ?? []) teile.push(w.kopf, ...(w.absaetze ?? []));
  return teile;
}

/** Block-Texte einer Abschnittsfolge, in Reihenfolge. */
function blockTeile(abschnitte: EntscheidSnapshot['abschnitte'] | undefined): string[] {
  const teile: string[] = [];
  for (const a of abschnitte ?? []) for (const b of a.bloecke ?? []) teile.push(b.text);
  return teile;
}

/**
 * NUR die Regeste eines Snapshots — der amtliche LEITSATZ. Wird heute nur noch
 * für Messungen und Tests gebraucht (die Korroborations-Regel, die sie als
 * eigenen Zweig führte, ist zurückgebaut); bleibt exportiert, weil der
 * Leitsatz-Anteil die einzige Text-Teilmenge ist, die man ohne zweite
 * Assemblage nicht wieder herstellen kann (§5).
 */
export function regesteTextVon(snap: EntscheidSnapshot): string {
  return zusammen(regesteTeile(snap));
}

/**
 * ── LITERATUR-KONTEXT-REGEL (Gegenprüfung R3, Entscheid Orchestrator 28.7.2026)
 *
 * WAS SIE TUT. Sie entfernt aus dem Fliesstext die deklarierten ZITIER-APPARAT-
 * SPANNEN, BEVOR die Zitat-Extraktion darüber läuft. Eine Spanne beginnt an
 * einem der unten aufgeführten Marker und endet am nächsten Segment-Ende —
 * `;`, `)`, `»` oder Zeilenende. Alles ausserhalb bleibt unberührt.
 *
 * WARUM DAS UND NICHT ZÄHLEN. Der Vorläufer war eine Häufigkeits-Schwelle
 * («eine Nennung ist Literatur, zwei sind Erörterung»). Sie ist an der eigenen
 * Messung gescheitert: in der gleichverteilten Stichprobe der von ihr
 * verworfenen Paare war rund die Hälfte ECHTE Rechtsanwendung (ATSG/17, ZPO/138,
 * OR/30, STPO/428, EMRK/6). Häufigkeit misst nicht, ob eine Norm trägt — eine
 * einmal, aber tragend erörterte Norm sieht gezählt aus wie eine beiläufige.
 * Der KONTEXT dagegen unterscheidet genau die Klasse, um die es geht: «N. 508/509
 * zu Art. 517-518 ZGB» ist eine Angabe ÜBER ein Buch, nicht über den Fall.
 *
 * REICHWEITE: BEIDE EBENEN. `normKeysVonSnapshot` (Erlass) und
 * `artikelSchluesselVonSnapshot` (Artikel) lesen denselben bereinigten Text
 * (`fliesstextOhneApparat`, §5). Das ist kein Kompromiss, sondern die richtige
 * Symmetrie: ein Literaturnachweis ist auch keine Erlass-Nennung des Gerichts.
 * Der Dekret-Stand «erst vollständig erkennen, dann kuratieren» (David
 * 27.7.2026) bleibt damit unangetastet — es wird nichts nach Häufigkeit,
 * Wichtigkeit oder Rang verworfen, sondern genau eine syntaktisch benannte
 * Textsorte.
 *
 * AUFNAHME-REGEL FÜR MARKER (§7): nur mit Korpus-Beleg (Entscheid-ID + Zitat)
 * und gemessener Häufigkeit. Im Zweifel NICHT aufnehmen — die nicht
 * aufgenommenen Klassen stehen unten benannt, damit die Lücke sichtbar ist (§8)
 * statt sich als «vollständig» auszugeben.
 *
 * NICHT AUFGENOMMEN, obwohl hochfrequent — bekannte REST-KLASSE (§8). Die
 * verbreitetste deutsche Kommentar-Form nennt den Artikel OHNE «zu»-Anker, hinter
 * dem blossen Werktitel: «Jean-Richard-dit-Bressel, in: Basler Kommentar,
 * 3. Auflage 2023, Art. 279 StPO N 13» (6'781 Vorkommen von «Basler/Berner/
 * Zürcher Kommentar» in 2'292 Snapshots; «in:» allein 21'179 in 3'421). Ein
 * Marker auf den blossen Werktitel hätte keine verlässliche Spannen-Grenze — er
 * träfe auch «Nach dem Basler Kommentar ist Art. 41 OR anwendbar», also eine
 * Aussage des Gerichts. Diese Klasse bleibt darum bewusst unerfasst: eine
 * benannte Lücke ist einer stillen Fehl-Löschung immer vorzuziehen (§1).
 */
interface LiteraturMarker {
  /** Sprechender Name (erscheint in der Tor-/Lauf-Ausgabe). */
  readonly name: string;
  /** Regex-Quelle des MARKERS (ohne Spannen-Schwanz), case-insensitiv gelesen. */
  readonly muster: string;
  /** Korpus-Beleg: Entscheid-ID + Wortlaut (§7 — kein Marker ohne Fundstelle). */
  readonly beleg: string;
  /** Gemessene Häufigkeit am committeten Korpus (5'093 Snapshots, 28.7.2026). */
  readonly korpus: string;
}

export const LITERATUR_MARKER: readonly LiteraturMarker[] = [
  {
    name: 'Kommentar-Titel («… Kommentar zu Art. X»)',
    muster: 'Kommentar zu\\s+Art\\.',
    beleg:
      'bge_150_IV_10: «MARCEL ALEXANDER NIGGLI, Rassendiskriminierung, Ein Kommentar '
      + 'zu Art. 261bis StGB und Art. 171c MStG, 2a ed. 2007, n. 405 e 407)» — das '
      + 'Gericht wendet Art. 171c MStG nirgends an (Phantom-Fund der Gegenprüfung R2).',
    korpus: '52 Vorkommen in 27 Snapshots',
  },
  {
    name: 'Randnummer-Fundstelle («N. 508/509 zu Art. X»)',
    // ABWEICHUNG vom Auftrags-Wortlaut (§7), belegt statt behauptet: der Auftrag
    // nannte nur die Form mit Punkt («N. 12 zu Art.»). Am Korpus stehen daneben
    // die punktlose Form («N 51 zu Art.», 316 Vorkommen in 117 Snapshots, Beleg
    // bs_sozialversicherungsgericht/BV.2026.5 «N 51 zu Art. 26 BVG») und die
    // Randziffer («Rz 46 zu Art.», 84 in 49, Beleg bs_.../KV.2025.2 «Rz 46 zu
    // Art. 64a KVG») — dieselbe Textsorte, derselbe Anker «zu Art.». Sie hier
    // NICHT zu führen hiesse, dieselbe Klasse je nach Setzergewohnheit
    // verschieden zu behandeln (§1).
    muster: '\\b(?:N|Rz|Rn)\\.?\\s*\\d+[a-z]?(?:\\s*[/–-]\\s*\\d+[a-z]?)?(?:\\s*f{1,2}\\.)?\\s+zu\\s+Art\\.',
    beleg:
      'bge_146_III_106: «(KÜNZLE, Berner Kommentar, 2011, N. 508/509 zu Art. 517-518 '
      + 'ZGB; PILLER, in: Commentaire romand, Code civil II, 2016, N. 131 zu '
      + 'Art. 518 ZGB)» — ZGB/517 stand allein aus dieser Fundstelle im Index.',
    korpus: '7\'111 Vorkommen «N. … zu Art.» in 689 Snapshots (+ 316 punktlos, + 84 «Rz»)',
  },
  {
    name: 'fr/it Kommentar-Fundstelle («n° 10 ad art. X»)',
    // Der Anker ist «ad art.» selbst, nicht die vorangehende Randnummer: die
    // Schreibungen wechseln («n° 10», «n o 2», «no 66», «n. 1 e segg.»), das
    // «ad» nicht. «AD» steht bereits in INVALID_LAW_CODES, ist also nie
    // law-Kandidat; die Form «ad art.» ist in DE/FR/IT-Urteilstext ausnahmslos
    // ein Verweis auf eine Fundstelle (Kommentar oder Botschaft), nie eine
    // Subsumtion — deshalb aufgenommen.
    muster: '\\bad\\s+art\\.',
    beleg:
      'bge_152_I_105: «NORA MARKWALDER, in St. Galler Kommentar, …, 4e éd. 2023, '
      + 'n° 2 ad art. 123c Cst.; CHRISTIAN DENYS, in Commentaire romand, '
      + 'Constitution fédérale, 2021, n° 10 ad art. 123c Cst.»',
    korpus: '4\'463 Vorkommen in 324 Snapshots (davon 3\'084 in der Form «n° … ad art.»)',
  },
];

/**
 * Segment-Ende einer Zitier-Apparat-Spanne. Bewusst KURZ gehalten: der Apparat
 * endet in Schweizer Urteilstext am Semikolon (nächster Autor), an der
 * schliessenden Klammer (Ende des Klammer-Nachweises), am schliessenden
 * Anführungszeichen oder an der Absatzgrenze. Ein längerer Schwanz risse
 * Gerichtstext mit heraus (§1).
 */
const SPANNEN_ENDE = '[^;)»\\n]*';

const LITERATUR_SPANNE = new RegExp(
  `(?:${LITERATUR_MARKER.map((m) => m.muster).join('|')})${SPANNEN_ENDE}`,
  'gi',
);

/**
 * Fliesstext OHNE die deklarierten Zitier-Apparat-Spannen. Rein und
 * deterministisch (§2): kein Zustand, keine Reihenfolge-Abhängigkeit — `replace`
 * mit einem /g-Muster setzt `lastIndex` selbst zurück.
 *
 * Ersetzt wird durch ein LEERZEICHEN, nicht durch nichts: sonst klebten die
 * Textränder links und rechts der Spanne zusammen und könnten ein Zitat
 * ERZEUGEN, das im Original nicht steht (die Regel darf nur wegnehmen, §1).
 */
export function ohneLiteraturApparat(text: string): string {
  if (!text) return text;
  return text.replace(LITERATUR_SPANNE, ' ');
}

/** Die entfernten Spannen selbst — Grundlage der Verwurf-Statistik (§6.7). */
export function literaturSpannen(text: string): string[] {
  if (!text) return [];
  return [...text.matchAll(LITERATUR_SPANNE)].map((m) => m[0]);
}

/**
 * Die EINE Text-Quelle beider Extraktions-Ebenen (§5). Wer hier etwas ändert,
 * ändert Erlass- und Artikel-Ebene gemeinsam — genau das ist der Zweck.
 */
export function fliesstextOhneApparat(snap: EntscheidSnapshot): string {
  // Belegte Mehrwort-Kürzel («GebV SchKG») als EIN Code — sonst kappt der Extraktor am Leerzeichen (mehrwort-kuerzel.ts).
  return verbindeMehrwortKuerzel(ohneLiteraturApparat(fliesstextVon(snap)));
}
