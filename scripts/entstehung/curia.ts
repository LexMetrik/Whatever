// scripts/entstehung/curia.ts
// E4 «Entstehung am Artikel» (FAHRPLAN-MATERIALIEN-VERZAHNUNG §11.4/§11.6/§11.7):
// die Parlaments-Etappen einer Vorlage aus Curia Vista (ws.parlament.ch, OData v3).
//
// PERSONENDATEN — die harte Grenze (§11.8, Kritik B1, Entscheid David 11.9.2026 Nr. 2):
// Namen, `PersonNumber`, Fraktion und Kanton einzelner Ratsmitglieder werden weder
// gespeichert NOCH ABGEFRAGT. Jede Abfrage nennt ihre Felder über `$select`; die
// Voting-Abfrage holt ausschliesslich `IdVote,Decision,DecisionText`. Die Einzelstimmen
// verlassen den Endpunkt damit gar nicht erst in identifizierbarer Form — die Aggregation
// ist keine nachträgliche Anonymisierung, sondern die einzige Form, in der wir die Daten
// je sehen. `$select` halbiert nebenbei die Nutzlast (Business 53 866 → 544 Bytes).
//
// NUTZUNGSAUFLAGE (Zitat, Abruf 11.9.2026): «Die Daten dürfen nur mit Angabe der Quelle
// ‹Parlamentsdienste der Bundesversammlung, Bern› verwendet werden.» / «Die Daten dürfen
// inhaltlich nicht verändert werden.» Übernommene Textfelder stehen deshalb WÖRTLICH im
// Shard, jeder Shard trägt `quellenangabe` + `abgerufen`, und jede abgeleitete Zahl ist
// als eigene Auszählung beschriftet.
//
// §2: reine Parse-Funktionen getrennt vom Fetch, Ausgabe deterministisch sortiert.
import { createHash } from 'node:crypto';

export const CURIA_BASIS = 'https://ws.parlament.ch/odata.svc';
export const CURIA_QUELLENANGABE = 'Parlamentsdienste der Bundesversammlung, Bern';
/** Beschriftung jeder selbst ausgezählten Zahl (§8 + Auflage «nicht verändern»). */
export const AUSZAEHLUNG_HINWEIS = 'eigene Auszählung der amtlichen Einzelstimmen';

export type OdataZeile = Record<string, unknown>;

/**
 * OData v3 antwortet je Entität mal `{d:{results:[…]}}`, mal `{d:[…]}` (live belegt:
 * Business/Bill vs. Preconsultation/Resolution). Beides akzeptieren, alles andere ist
 * ein Fehler — nie stillschweigend als «keine Treffer» lesen (§6.7 lit. b).
 *
 * PAGING-WÄCHTER (21.9.2026): der Client wertet KEIN Paging aus — es gibt kein `$top`,
 * kein `$skip`, keine `__next`-Schleife. Gemessen liefert der Endpunkt Seiten zu 1000
 * Zeilen (`Objective?$filter=Language eq 'DE'`: `__count` 14 669, erste Seite 1000 mit
 * `__next`). Je Geschäft ist das unkritisch (Maximum 39 Zeilen) — aber eine Antwort über
 * der Seitengrenze würde STILL abgeschnitten, also genau derselbe Fehlertyp wie der
 * kollabierende Dedupe-Schlüssel darunter. Darum lieber laut scheitern als leise
 * verlieren (§6.7/§8): trägt die Antwort `__next`, wirft sie hier.
 *
 * `kontext` benennt die Abfrage (URL/Entität), soweit der Aufrufer sie kennt.
 */
export function odataZeilen(json: unknown, kontext?: string): OdataZeile[] {
  const d = (json as { d?: unknown }).d;
  const wo = kontext ? ` für ${kontext}` : '';
  if (d && typeof d === 'object' && !Array.isArray(d)) {
    const next = (d as { __next?: unknown }).__next;
    if (next !== undefined && next !== null) {
      throw new Error(
        `curia: OData-Antwort${wo} ist UNVOLLSTÄNDIG — sie trägt «__next» (${String(next)}), es folgt `
        + 'also mindestens eine weitere Server-Seite. Dieser Client wertet kein Paging aus; die Zeilen '
        + 'der Folgeseiten gingen still verloren (§6.7/§8: lieber laut scheitern als leise verlieren). '
        + 'Paging in scripts/entstehung/curia-run.ts nachrüsten, bevor dieser Lauf wieder grün wird.',
      );
    }
  }
  if (Array.isArray(d)) return d as OdataZeile[];
  if (d && typeof d === 'object' && Array.isArray((d as { results?: unknown }).results)) {
    return (d as { results: OdataZeile[] }).results;
  }
  throw new Error(`curia: unerwartete OData-Antwortform${wo} (weder d[] noch d.results[])`);
}

/** `/Date(1505433600000)/` → `2017-09-15` (UTC). Unlesbar ⇒ null, nie geraten. */
export function odataDatum(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const m = /^\/Date\((-?\d+)(?:[+-]\d+)?\)\/$/.exec(v);
  if (!m) return null;
  return new Date(Number(m[1])).toISOString().slice(0, 10);
}

// ── Decision-Codes: FESTE, live belegte Tabelle (§2) ───────────────────────────
// `$metadata` deklariert kein Enum (R4 §2 Ziff. 4). Die Tabelle ist deshalb EMPIRISCH
// erhoben: je Code eine Abfrage `Voting?$filter=Decision eq N&$top=1` gegen den amtlichen
// Endpunkt, Abruf 11.9.2026. Codes 0, 9 und 10 liefern keine Zeile — sie existieren nicht.
// Ein unbekannter Code macht den Lauf ROT (nie in einen Sammeltopf werfen: er könnte
// «Enthaltung» heissen und würde das Stimmenverhältnis verfälschen).
export const DECISION_CODES: Readonly<Record<number, { feld: keyof StimmAggregat; amtlich: string }>> = {
  1: { feld: 'ja', amtlich: 'Ja' },
  2: { feld: 'nein', amtlich: 'Nein' },
  3: { feld: 'enthaltung', amtlich: 'Enthaltung' },
  4: { feld: 'anwesend', amtlich: 'Anwesend' },
  5: { feld: 'nichtTeilgenommen', amtlich: 'Hat nicht teilgenommen' },
  6: { feld: 'entschuldigt', amtlich: 'Entschuldigt gemäss Art. 57 Abs. 4' },
  7: { feld: 'praesidiumStimmtNicht', amtlich: 'Die Präsidentin/der Präsident stimmt nicht' },
  8: { feld: 'demissioniert', amtlich: 'Demissioniert' },
};

export interface StimmAggregat {
  ja: number; nein: number; enthaltung: number; anwesend: number;
  nichtTeilgenommen: number; entschuldigt: number;
  praesidiumStimmtNicht: number; demissioniert: number;
  /** Summe aller Zeilen = Zahl der Ratsmitglieder in dieser Abstimmung. */
  total: number;
}

export function leeresAggregat(): StimmAggregat {
  return {
    ja: 0, nein: 0, enthaltung: 0, anwesend: 0, nichtTeilgenommen: 0,
    entschuldigt: 0, praesidiumStimmtNicht: 0, demissioniert: 0, total: 0,
  };
}

/**
 * REIN: Voting-Zeilen → Aggregat. Ein unbekannter `Decision`-Code wirft (§2).
 * Es werden NUR Zähler gebildet; keine Zeile wird gespeichert.
 */
export function aggregiereStimmen(zeilen: OdataZeile[]): StimmAggregat {
  const a = leeresAggregat();
  for (const z of zeilen) {
    const code = Number(z.Decision);
    const t = DECISION_CODES[code];
    if (!t) {
      throw new Error(
        `curia: unbekannter Voting.Decision-Code ${code} («${String(z.DecisionText)}») — `
        + 'Tabelle in scripts/entstehung/curia.ts und bibliothek/register/curia-decision-codes.md '
        + 'gegen den amtlichen Endpunkt nachführen (nie in einen Sammeltopf werfen, §2).',
      );
    }
    a[t.feld] += 1;
    a.total += 1;
  }
  return a;
}

/**
 * NR oder SR? `Voting` hat KEIN `Council`-Feld (R4 §2 Ziff. 3, `$metadata` geprüft).
 * Das einzige Unterscheidungsmerkmal ist die Zeilenzahl: der Nationalrat zählt 200
 * Sitze, der Ständerat 46. Wir behaupten «Nationalrat» deshalb NUR bei einer
 * plausiblen NR-Grösse und sagen sonst «Rat nicht bestimmbar» (§8) — lieber keine
 * Zahl als eine falsch beschriftete.
 */
export function ratAusGroesse(total: number): 'Nationalrat' | null {
  return total >= 150 && total <= 200 ? 'Nationalrat' : null;
}

/** Erkennt die Schlussabstimmung sprachübergreifend (R4 §2 Ziff. 1: `Subject` ist nicht sprachrein). */
export const SCHLUSSABSTIMMUNG_RE = /Schlussabstimmung|Vote\s+final|Votazione\s+finale/i;

// ── Shard-Typen ───────────────────────────────────────────────────────────────
export interface CuriaKommission { datum: string | null; name: string; kuerzel: string | null }
export interface CuriaBeschluss {
  datum: string | null; rat: string | null; ratKuerzel: string | null;
  /** WÖRTLICH aus `ResolutionText` (Auflage «nicht verändern»). */
  text: string;
  vorlage: number | null;
}
export interface CuriaPublikation {
  datum: string | null; art: string | null; jahr: string | null; nummer: string | null;
  /** WÖRTLICH aus `ReferenceText`. */
  text: string | null;
  referendumsfrist: string | null;
  /** Vorlage (Entwurf) des Geschäfts, aus `Objective.BillNumber` — gleiche Benennung und
   *  gleicher Typ wie `CuriaBeschluss.vorlage` (§5: eine Sache, ein Name). */
  vorlage: number | null;
}
export interface CuriaSchlussabstimmung {
  datum: string | null;
  vorlage: number | null;
  /** Rat, sofern aus der Grösse bestimmbar — sonst null (§8). */
  rat: 'Nationalrat' | null;
  aggregat: StimmAggregat;
  /** Pflicht-Beschriftung der selbst ausgezählten Zahlen. */
  beschriftung: string;
}
export interface CuriaShard {
  nummer: string;
  /** WÖRTLICH aus `Business.Title`. */
  titel: string | null;
  geschaeftstyp: string | null;
  status: string | null;
  eingereicht: string | null;
  erstrat: string | null;
  quelleUrl: string;
  quellenangabe: string;
  abgerufen: string;
  kommissionen: CuriaKommission[];
  beschluesse: CuriaBeschluss[];
  publikationen: CuriaPublikation[];
  schlussabstimmungen: CuriaSchlussabstimmung[];
}

/** Felder, die NIE in einem Shard stehen dürfen (Personendaten-Tor, §11.8). */
export const VERBOTENE_FELDER: readonly string[] = [
  'FirstName', 'LastName', 'PersonNumber', 'PersonIdCode', 'CouncillorName',
  'ParlGroupCode', 'ParlGroupName', 'Canton', 'CantonName', 'CantonAbbreviation',
  'Rapporteur', 'RapporteurName', 'SubmittedBy',
];

/** Byte-deterministische Serialisierung eines Shards. */
export function serialisiereShard(s: CuriaShard): string {
  return JSON.stringify(s, null, 2) + '\n';
}

export function shaShard(s: CuriaShard): string {
  return createHash('sha256').update(serialisiereShard(s), 'utf8').digest('hex');
}

/** Curia «17.059» → AffairId «20170059» → amtlicher Deep-Link (§7c). */
export function curiaUrl(nummer: string): string | null {
  const m = /^(\d{2}|\d{4})\.(\d{1,4})$/.exec(nummer.trim());
  if (!m) return null;
  let jahr = m[1];
  if (jahr.length === 2) jahr = (Number(jahr) <= 30 ? '20' : '19') + jahr;
  return `https://www.parlament.ch/de/ratsbetrieb/suche-curia-vista/geschaeft?AffairId=${jahr}${m[2].padStart(4, '0')}`;
}

/** Textfeld übernehmen — WÖRTLICH (Auflage «nicht verändern»), aber leere Hüllen aussortieren.
 *  Der Endpunkt liefert stellenweise den LITERALEN String «null» (live belegt an 17.059,
 *  Objective.PublicationYear/-Number): ihn als Wert zu übernehmen hiesse, «null» als
 *  Jahrgang anzuzeigen. Er zählt deshalb als fehlender Wert, nicht als Text.
 *
 *  DIE FALLE IM KLARTEXT (nachgemessen 21.9.2026, bisher nirgends festgehalten): Curia
 *  sendet für ein fehlendes Feld NICHT JSON-`null`, sondern den vierbuchstabigen String
 *  `"null"`. Wer `z.PublicationYear ?? …` oder `typeof v === 'string'` allein prüft, hält
 *  ihn für einen Wert. Jede neue Feld-Übernahme geht deshalb durch `txt()`.
 *  Und: `IsOldPublicationFormat` taugt NICHT als Erkennungsmerkmal dafür — an allen 32
 *  DE-Zeilen des Geschäfts 01.023 steht es auf `false`, obwohl 12 dieser Zeilen weder
 *  Jahr noch Nummer tragen. Nichts darauf bauen. */
const txt = (v: unknown): string | null =>
  (typeof v === 'string' && v.trim() && v.trim().toLowerCase() !== 'null' ? v : null);
const zahl = (v: unknown): number | null => (typeof v === 'number' ? v : null);

/** REIN: Preconsultation-Zeilen → Kommissionen (Organ, nie Person), dedupliziert + sortiert. */
export function baueKommissionen(zeilen: OdataZeile[]): CuriaKommission[] {
  const m = new Map<string, CuriaKommission>();
  for (const z of zeilen) {
    const name = txt(z.CommitteeName);
    if (!name) continue;
    const k: CuriaKommission = {
      datum: odataDatum(z.PreconsultationDate),
      name,
      kuerzel: txt(z.Abbreviation1) ?? txt(z.Abbreviation) ?? txt(z.Abbreviation2),
    };
    // Map-Schlüssel als JSON-Tupel (21.9.2026, wie bei den Publikationen): ein `|` im
    // Freitext darf zwei verschiedene Zeilen nicht zusammenfallen lassen. Der SORTIER-
    // Schlüssel darunter bleibt unverändert (er bestimmt die Shard-Bytes).
    m.set(JSON.stringify([k.datum ?? '', k.name]), k);
  }
  return [...m.values()].sort((a, b) => (`${a.datum ?? ''}|${a.name}` < `${b.datum ?? ''}|${b.name}` ? -1 : 1));
}

/** REIN: Resolution-Zeilen → Rats-Beschlüsse, dedupliziert + sortiert. */
export function baueBeschluesse(zeilen: OdataZeile[], vorlageJeBill: Map<string, number>): CuriaBeschluss[] {
  const m = new Map<string, CuriaBeschluss>();
  for (const z of zeilen) {
    const text = txt(z.ResolutionText);
    if (!text) continue;
    const b: CuriaBeschluss = {
      datum: odataDatum(z.ResolutionDate),
      rat: txt(z.CouncilName),
      ratKuerzel: txt(z.CouncilAbbreviation),
      text,
      vorlage: vorlageJeBill.get(String(z.IdBill)) ?? null,
    };
    // Map-Schlüssel als JSON-Tupel (21.9.2026): mit `|`-Join fielen z. B. rat «Nationalrat|1»
    // ohne Vorlage und rat «Nationalrat» mit Vorlage 1 + Text «|…» still zusammen.
    // Gleiche Felder, gleiche `?? ''`-Abbildungen; `ratKuerzel` bewusst NICHT (erst nach dem
    // Monatslauf, änderte Bestand). Der SORTIER-Schlüssel darunter bleibt unverändert.
    m.set(JSON.stringify([b.datum ?? '', b.rat ?? '', b.vorlage ?? '', b.text]), b);
  }
  return [...m.values()].sort((a, b) => {
    const ka = `${a.datum ?? '9999'}|${String(a.vorlage ?? 99).padStart(2, '0')}|${a.rat ?? ''}|${a.text}`;
    const kb = `${b.datum ?? '9999'}|${String(b.vorlage ?? 99).padStart(2, '0')}|${b.rat ?? ''}|${b.text}`;
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
}

/**
 * REIN: Objective-Zeilen → Publikationen inkl. Referendumsfrist, dedupliziert + sortiert.
 *
 * SCHLÜSSEL = FUNDSTELLEN-IDENTITÄT, `text` EINGESCHLOSSEN (Korrektur 21.9.2026).
 * Der Schlüssel identifiziert EINE Publikations-Fundstelle und führt deshalb alle
 * unterscheidenden Felder. `text` (= `ReferenceText`) ist eines davon: alte
 * BBl-Fundstellen liefern `PublicationYear`/`PublicationNumber` als literalen String
 * «null», den `txt()` zu Recht als fehlenden Wert liest — dann ist `ReferenceText` das
 * EINZIGE Feld, das zwei Fundstellen desselben Publikationsdatums auseinanderhält.
 * Ohne ihn fielen am Geschäft 01.023 32 amtliche Objective-Zeilen auf 21 zusammen, und
 * die jeweils letzte überschrieb still die vorherigen — das verletzt zugleich die
 * Nutzungsauflage im Kopf dieser Datei («Die Daten dürfen inhaltlich nicht verändert
 * werden»). Die Map BLEIBT trotzdem: eine byte-gleich doppelt gelieferte Zeile ist eine
 * Wiederholung, keine zweite Fundstelle.
 *
 * DER VERGLEICHER ZIEHT ZWINGEND MIT (§2). Er sortierte nur nach `datum|jahr|nummer` und
 * hatte damit für genau die Zeilen KEINEN Tiebreaker, die der Schlüssel bisher wegwarf;
 * er führt darum jetzt zusätzlich `text` und `art`. Wer den Schlüssel erweitert, erweitert
 * den Vergleicher — sonst hinge die Reihenfolge an der Zeilenfolge der Endpunkt-Antwort.
 *
 * BERICHTIGUNG 21.9.2026 (zweite Runde, F8: datierte Messsätze werden ergänzt, nie
 * überschrieben). An dieser Stelle stand seit der ersten Runde, das Geschäft 08.053 liefere
 * «zwei Fundstellen je dreifach byte-gleich» und sei damit der belegte Anlass des Dedupe.
 * Das war FALSCH gemessen: die erste Runde verglich nur die sechs Felder oben und hielt
 * darum für byte-gleich, was sich in `BillNumber` unterscheidet. Der Vollzensus aller
 * 14 669 DE-`Objective`-Zeilen (Abruf 21.9.2026, `$inlinecount=allpages`, 15 Seiten) zeigt:
 * an 08.053 sind alle 12 Zeilen verschieden (12 roh = 12 vollzeilen-distinkt), sie
 * unterscheiden sich ausschliesslich in der VORLAGE. Darum steht `vorlage` jetzt im
 * Schlüssel — ohne sie fielen 12 Zeilen auf 8 zusammen (03.047: 17 auf 14).
 *
 * `BillNumber` GENÜGT, `IdBill` ist redundant. Kardinalität über alle 3 763 DE-Geschäfte:
 * roh 14 669 · Vollzeile (ohne `__metadata`/`Modified`/`ID`/`Bills`) 14 665 · sechs Felder
 * 14 506 · sechs + `BillNumber` 14 665 · sechs + `BillNumber` + `IdBill` ebenfalls 14 665.
 * Es gibt NULL Gruppen, die sich nur in `IdBill` unterscheiden; die GUID käme nur als
 * Golden-Rauschen ins Artefakt. `Bills` scheidet ohnehin aus: sein `__deferred`-URI enthält
 * die eigene `ID` der Zeile, ein Inhaltsvergleich darüber misst tautologisch grün.
 *
 * ECHTE Doppellieferungen gibt es — nur nicht bei uns. Korpusweit vier Zeilen in drei
 * Geschäften (22.417, 26.023, 19.464), keines davon mit Shard. Über unsere 385 Shards gilt
 * roh == vollzeilen-distinkt == 2055, der Lauf ist also VERLUSTFREI; die Map bleibt
 * trotzdem, weil eine wirklich doppelt gelieferte Zeile eine Wiederholung ist und keine
 * zweite Fundstelle. Weil der Bestand verlustfrei ist, rechnet `check:entstehung` gegen die
 * ROHE Zeilenzahl gegen und wird rot, sobald ein Shard weniger speichert als der Endpunkt
 * liefert (§6.7: fail-loud statt still dedupen).
 *
 * `BillNumber` IST EIN `int`, KEIN STRING (gemessen: 14 669 von 14 669 Zeilen `typeof
 * 'number'`). `txt(z.BillNumber)` liefert deshalb für JEDE Zeile `null` — ein Fix über
 * `txt()` änderte exakt nichts und sähe trotzdem nach Fix aus. Darum `zahl()`, und darum
 * ein eigener Test, der genau diesen Irrweg rot macht.
 *
 * Schlüssel und Sortierschlüssel sind `JSON.stringify`-Tupel, kein `|`-Join: seit
 * `ReferenceText` im Schlüssel steht, trägt er Freitext, und ein `|` darin würde zwei
 * verschiedene Fundstellen zu einer verschmelzen (§1 — lieber trennscharf als hübsch).
 */
export function bauePublikationen(zeilen: OdataZeile[]): CuriaPublikation[] {
  const m = new Map<string, CuriaPublikation>();
  for (const z of zeilen) {
    const p: CuriaPublikation = {
      datum: odataDatum(z.PublicationDate),
      art: txt(z.PublicationTypeName),
      jahr: txt(z.PublicationYear),
      nummer: txt(z.PublicationNumber),
      text: txt(z.ReferenceText),
      referendumsfrist: odataDatum(z.ReferendumDeadline),
      vorlage: zahl(z.BillNumber),
    };
    m.set(JSON.stringify([p.datum, p.art, p.jahr, p.nummer, p.text, p.referendumsfrist, p.vorlage]), p);
  }
  // Sortierschlüssel = alle sieben Felder ⇒ STRIKTE Totalordnung: zwei verschiedene
  // Einträge können nie gleich vergleichen, die Reihenfolge hängt damit nirgends an der
  // Zeilenfolge der Endpunkt-Antwort (§2). Reihung wie bisher datum → jahr → nummer,
  // danach die Tiebreaker text → art → referendumsfrist.
  // `vorlage` kommt ANS ENDE, nicht nach vorn: die bisherige fachliche Reihung (eine
  // Publikationsliste liest sich chronologisch, dann nach Fundstelle) bleibt damit
  // unverändert, und `vorlage` entscheidet nur dort, wo bisher gar nichts mehr entschied —
  // nämlich zwischen den Zeilen, die der alte Schlüssel wegwarf. Padding wie bei
  // `baueBeschluesse`, damit Vorlage 2 vor Vorlage 10 steht und nicht danach.
  const sortSchluessel = (p: CuriaPublikation): string => JSON.stringify([
    p.datum ?? '9999', p.jahr ?? '', (p.nummer ?? '').padStart(8, '0'),
    p.text ?? '', p.art ?? '', p.referendumsfrist ?? '',
    String(p.vorlage ?? 9999).padStart(4, '0'),
  ]);
  return [...m.values()].sort((a, b) => {
    const ka = sortSchluessel(a);
    const kb = sortSchluessel(b);
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
}

/** REIN: Vote-Zeilen → die Schlussabstimmungs-IDs (sprachübergreifend erkannt). */
export function schlussabstimmungsVotes(zeilen: OdataZeile[]): { id: number; datum: string | null; vorlage: number | null }[] {
  const m = new Map<number, { id: number; datum: string | null; vorlage: number | null }>();
  for (const z of zeilen) {
    if (!SCHLUSSABSTIMMUNG_RE.test(txt(z.Subject) ?? '')) continue;
    const id = Number(z.ID);
    if (!Number.isFinite(id)) continue;
    m.set(id, { id, datum: odataDatum(z.VoteEnd), vorlage: zahl(z.BillNumber) });
  }
  return [...m.values()].sort((a, b) => a.id - b.id);
}
