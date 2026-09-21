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
    m.set(`${k.datum ?? ''}|${k.name}`, k);
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
    m.set(`${b.datum ?? ''}|${b.rat ?? ''}|${b.vorlage ?? ''}|${b.text}`, b);
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
 * ECHTE Duplikate gibt es wirklich — der Dedupe hat einen belegten Anlass: das Geschäft
 * 08.053 liefert 12 Objective-Zeilen, davon nur 8 distinkte (zwei Fundstellen kommen je
 * dreifach byte-gleich, Messung 21.9.2026). Gegengerechnet wird offline über die
 * UNABHÄNGIGE Auszählung `distinkteObjectiveZeilen()` (siehe dort).
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
    };
    m.set(JSON.stringify([p.datum, p.art, p.jahr, p.nummer, p.text, p.referendumsfrist]), p);
  }
  // Sortierschlüssel = alle sechs Felder ⇒ STRIKTE Totalordnung: zwei verschiedene
  // Einträge können nie gleich vergleichen, die Reihenfolge hängt damit nirgends an der
  // Zeilenfolge der Endpunkt-Antwort (§2). Reihung wie bisher datum → jahr → nummer,
  // danach die neuen Tiebreaker text → art → referendumsfrist.
  const sortSchluessel = (p: CuriaPublikation): string => JSON.stringify([
    p.datum ?? '9999', p.jahr ?? '', (p.nummer ?? '').padStart(8, '0'),
    p.text ?? '', p.art ?? '', p.referendumsfrist ?? '',
  ]);
  return [...m.values()].sort((a, b) => {
    const ka = sortSchluessel(a);
    const kb = sortSchluessel(b);
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
}

/**
 * REIN: Zahl der DISTINKTEN Objective-Zeilen einer amtlichen Antwort — der zweite,
 * UNABHÄNGIGE Weg auf dieselbe Zahl (Kreuzprobe für `check:entstehung`, Befund 21.9.2026).
 *
 * Bewusst NICHT über `bauePublikationen()` gerechnet: ein Zähler, der den geprüften Weg
 * benutzt, kann dessen Fehler nicht finden (Tautologie-Falle, §6.7). Diese Funktion baut
 * ihre Identität selbst — Objekt-Form statt Tupel, direkt aus der Roh-Zeile, ohne
 * `CuriaPublikation`, ohne Map-Schlüssel, ohne Sortierung. Geteilt werden nur die
 * NORMALISIERER `txt`/`odataDatum`: die Normalisierung ist nicht die geprüfte Entscheidung
 * (und ihre Falle ist eine andere, siehe `txt`), die IDENTITÄTS-Entscheidung ist es.
 *
 * `objectiveZeilen − distinkteObjectiveZeilen` = Zahl der echt doppelt gelieferten Zeilen.
 */
export function distinkteObjectiveZeilen(zeilen: OdataZeile[]): number {
  const gesehen = new Set<string>();
  for (const z of zeilen) {
    gesehen.add(JSON.stringify({
      art: txt(z.PublicationTypeName),
      datum: odataDatum(z.PublicationDate),
      frist: odataDatum(z.ReferendumDeadline),
      jahr: txt(z.PublicationYear),
      nummer: txt(z.PublicationNumber),
      text: txt(z.ReferenceText),
    }));
  }
  return gesehen.size;
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
