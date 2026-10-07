// scripts/datenhaltung/suche-kern.ts
// QS-DATA E2: die REINEN Bausteine der Such-Query-Logik (§5: EINE Query-Logik, zwei
// Ausführungswege — Build-Zeit/node:sqlite in suche.ts, Edge/Turso-HTTP in api/suche.ts).
//
// HARTE REGEL dieser Datei: NULL Imports (kein node:*, kein Drittmodul, auch kein
// import type). Grund (Vercel-Fix 3.7.2026): Vercel kompiliert api/** mit EIGENER
// tsconfig (nodenext, ohne Node-Typen) — jeder Import-Pfad aus api/ hinein muss frei
// von Node-Bezügen sein, sonst bricht der Function-Build (real passiert: node:sqlite/
// process-Typfehler über die Import-Kette api/suche.ts → suche.ts → fts.ts).

export const STANDARD_LIMIT = 20;
export const MAX_LIMIT = 50;

/**
 * Spalten von `fts_artikel`, in Index-Reihenfolge (QS-BASIS (d) K1).
 *
 * Sie stehen HIER und nicht in fts.ts, weil diese Datei die einzige ist, die BEIDE
 * Ausführungswege importieren dürfen (fts.ts zieht node:sqlite und ist für api/**
 * gesperrt). fts.ts holt sie sich von hier für die DDL, suche-kern für die
 * Spaltenfilter und die bm25-Gewichte — eine Quelle (§5).
 *
 * Die REIHENFOLGE IST TRAGEND: sie bestimmt die Position der bm25-Gewichte
 * (BM25_GEWICHTE) und muss lokal wie auf Turso identisch deklariert werden. Eine
 * Verschiebung gewichtet still das falsche Feld.
 */
export const FTS_ARTIKEL_SPALTEN = ['text', 'marginalie', 'marginalie_n', 'gliederung', 'tabelle', 'fussnote'] as const;

/** Stufe 0 «Hauptthema»: primäre Marginalie ODER Gliederungs-Titel — der Artikel ist
 *  dem Thema GEWIDMET (OR 127 «Verjährung», OR 253 unter «Achter Titel: Die Miete»). */
export const FTS_SPALTEN_HAUPT = ['marginalie', 'gliederung'] as const;

/** Stufe 1 «Nebenerwähnung»: nur eine nachrangige Marginalie — der Artikel NENNT das
 *  Thema, ist ihm aber nicht gewidmet (OR 121 «Verrechnung … Bei Bürgschaft»). */
export const FTS_SPALTEN_NEBEN = ['marginalie_n'] as const;

export interface SucheOptionen {
  limit?: number;
  offset?: number;
}
export interface Seitenfenster {
  limit: number;
  offset: number;
}
/** Herkunft eines Treffers (amtlicher Live-Link §7 c) — NIE der Volltext selbst. */
export interface Fundstelle {
  erlass?: string;
  artikel?: string;
  quelleUrl: string;
  /**
   * Daten-Ebene des Erlasses ('bund' | 'kanton') — W2·13-KANTONE K-3 / F35.
   * ADDITIV und OPTIONAL: eine Antwort ohne dieses Feld (Alt-Client, gecachte
   * Alt-Antwort, Aufrufer ohne die neuen Spalten) bleibt gültig; der Client
   * fällt dann auf sein bisheriges Verhalten zurück, statt eine Ebene zu raten.
   * Es ist die DATEN-Ebene, nicht das Routen-Segment: was in der Adresse steht,
   * entscheidet clientseitig das Erlass-Register (erlassAdresse.ts) — ein
   * Staatsvertrag trägt hier 'bund' und wohnt trotzdem unter /gesetze/international/.
   */
  ebene?: string;
  /** Kantonskürzel («AG») bei ebene === 'kanton'; bei Bund gar nicht gesetzt. */
  kanton?: string;
}
export interface ArtikelTreffer {
  id: string;
  titel: string;
  snippet: string;
  fundstelle: Fundstelle;
}
export interface EntscheidTreffer {
  id: string;
  titel: string;
  snippet: string;
  fundstelle: Fundstelle;
}
export interface SucheAntwort<T> {
  treffer: T[];
  /** Gesamtzahl der MATCH-Treffer (für Pagination-Anzeige). */
  gesamt: number;
  /** Offset der nächsten Seite oder null, wenn die letzte Seite erreicht ist. */
  naechsteSeite: number | null;
}

/**
 * Durchsuchbarer Plaintext EINES Artikels aus `bloecke_json`: alle `text`-Felder
 * konkateniert (Absatz-Einleitung + lit./Ziff.-Aufzählungspunkte), Whitespace normalisiert.
 * Bewusst dieselbe Extraktion wie der bestehende Client-Suchindex
 * (`scripts/such-index-generieren.ts` → artikelText), damit hot-FTS und statischer
 * Fallback-Index denselben durchsuchbaren Text tragen (§5). NICHT indexiert (kein
 * `text`-Feld, client-index-konform; Gegenprüfungs-Notiz 3.7.2026): Tarif-/Tabellen-
 * Zellen (`tabelle` beschreibung/betrag sowie `mehrspaltig` spalten[].titel + zeilen)
 * und Bild-Metadaten — der Volltext bleibt im prerenderten DOM durchsuchbar (§15);
 * eine Recall-Erweiterung wäre ein bewusster Folge-Schritt für BEIDE Indizes gemeinsam.
 *
 * NACHTRAG 31.8.2026 (QS-BASIS (d) K1) — dieser Folge-Schritt ist getan, und zwar
 * genau so, wie der Satz oben ihn verlangt: für beide Indizes gemeinsam. Diese
 * Funktion bleibt UNVERÄNDERT der reine Artikeltext (Feld `t`/`text`); die Tabellen-,
 * Marginalien-, Gliederungs- und Fussnoten-Tier sind eigene FTS-Spalten geworden
 * (fts.ts → FTS_ARTIKEL_SPALTEN), gespeist aus der geteilten Extraktion in
 * scripts/suche-felder.ts. Der obige Satz beschreibt also weiterhin korrekt, was
 * `bloeckeText` tut — er ist nicht überholt, sondern eingelöst.
 */
interface Block {
  text?: string;
  items?: Array<{ text?: string }>;
}
export function bloeckeText(bloeckeJson: string): string {
  const bloecke = JSON.parse(bloeckeJson) as Block[];
  const teile: string[] = [];
  for (const b of bloecke) {
    if (b.text) teile.push(b.text);
    for (const it of b.items ?? []) if (it.text) teile.push(it.text);
  }
  return teile.join(' ').replace(/\s+/g, ' ').trim();
}

// ── Reine Bausteine ──────────────────────────────────────────────────────────────

/** Klemmt limit (1..MAX_LIMIT, Default 20) + offset (>= 0). Pagination by design. */
export function klemmeFenster(opt?: SucheOptionen): Seitenfenster {
  const roh = opt?.limit ?? STANDARD_LIMIT;
  const limit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(Number.isFinite(roh) ? roh : STANDARD_LIMIT)));
  const rohOff = opt?.offset ?? 0;
  const offset = Math.max(0, Math.floor(Number.isFinite(rohOff) ? rohOff : 0));
  return { limit, offset };
}

/**
 * Baut den FTS5-MATCH-Ausdruck: jeder Term (Unicode-Buchstaben/Ziffern) in Anführungs-
 * zeichen → neutralisiert FTS5-Syntax UND -Injection (implizites AND zwischen Termen).
 * Leere/rein-symbolische Query → null (Aufrufer liefert leere Antwort).
 */
export function baueFtsMatch(query: string): string | null {
  const terme = query.match(/[\p{L}\p{N}]+/gu) ?? [];
  if (terme.length === 0) return null;
  return terme.map((t) => '"' + t + '"').join(' ');
}

/**
 * Wie `baueFtsMatch`, aber auf bestimmte FTS-Spalten eingeschränkt (FTS5-Spaltenfilter
 * `{sp1 sp2} : term`). Trägt die TOPISCHE STUFUNG des Edge-Rankings (K2).
 *
 * Die Spaltennamen werden NICHT aus Nutzereingabe gebildet, sondern kommen aus der
 * festen Liste oben (FTS_SPALTEN_HAUPT/-NEBEN); die Terme bleiben wie in `baueFtsMatch`
 * gequotet, also syntax- und injektionsneutral.
 *
 * ── EIN Term genügt (OR), nicht ALLE (implizites AND) ───────────────────────────────
 * Die Terme werden mit `OR` verknüpft. Das ist keine Geschmacksfrage, sondern die
 * Bedingung dafür, dass die Stufung dasselbe BEDEUTET wie im Client:
 * `artikelRanking.bewerte()` setzt Stufe 0, sobald IRGENDEIN getippter Term die primäre
 * Marginalie oder die Gliederung trifft — es prüft je Term und merkt sich das Ergebnis,
 * es verlangt nicht alle Terme im selben Feld.
 *
 * Bis zum 31.8.2026 stand hier das implizite AND von FTS5, und das kippte mehrwortige
 * Alltags-Queries (gemessen gegen daten/normtext.db, Gegenprüfungs-Befund F2):
 *   «Verjährung Fristen»   → OR 127 auf Rang 8 (AND) statt Rang 1 (OR)
 *   «Verjährung Forderung» → Top-5 ohne einen einzigen Verjährungs-Grundartikel (AND);
 *                            mit OR: 60 · 67 · 130 · 134 · 135
 * Der Client lieferte in denselben Fällen Rang 1. Die behauptete Ranking-Parität bestand
 * also für Einwort-Queries und nur für sie.
 *
 * RECALL-NEUTRAL, konstruktiv und gemessen: dieser Ausdruck geht NICHT in die
 * Treffermenge ein. Die bestimmt allein `baueFtsMatch` im `treffer`-CTE; `haupt` und
 * `neben` sind LEFT-JOIN-Mengen, die nur die Sortierstufe setzen (SQL_ARTIKEL_TREFFER).
 * Eine Verbreiterung kann darum keinen Treffer hinzufügen und keinen verlieren.
 * Gegenprobe über die volle Pagination: «Verjährung Fristen» 23 Treffer vorher wie
 * nachher, «Miete Kündigung» 20 vorher wie nachher, die Mengen elementweise identisch.
 */
export function baueFtsSpaltenMatch(query: string, spalten: readonly string[]): string | null {
  const terme = query.match(/[\p{L}\p{N}]+/gu) ?? [];
  if (terme.length === 0 || spalten.length === 0) return null;
  const praefix = `{${spalten.join(' ')}} : `;
  return terme.map((t) => praefix + '"' + t + '"').join(' OR ');
}

/** Nächster Seiten-Offset oder null. */
export function naechsterOffset(gesamt: number, offset: number, limit: number): number | null {
  return offset + limit < gesamt ? offset + limit : null;
}

/** Diakritik-faltend + kleinschreibend, LÄNGEN-erhaltend (BMP-Text): je Codepoint der
 *  NFD-Basisbuchstabe. So findet das Snippet den Treffer diakritik-insensitiv wie die FTS,
 *  ohne die Index-Zuordnung zum Originaltext zu verschieben. */
function falte(s: string): string {
  let out = '';
  for (const c of s) out += (c.normalize('NFD')[0] ?? c).toLowerCase();
  return out;
}

/**
 * Deterministisches Listen-Snippet (~130 Zeichen um den ersten Treffer-Term). Für Artikel
 * (external-content-FTS ohne native snippet()) aus dem extrahierten Plaintext gebaut;
 * diakritik-insensitive Term-Suche konsistent mit dem FTS-Tokenizer.
 */
export function baueSnippet(text: string, query: string): string {
  const gefaltet = falte(text);
  const term = (query.match(/[\p{L}\p{N}]+/gu) ?? [])
    .map((w) => falte(w))
    .find((w) => w.length > 2 && gefaltet.includes(w));
  if (!term) return text.length > 120 ? text.slice(0, 120).trimEnd() + ' …' : text;
  const i = gefaltet.indexOf(term);
  const start = Math.max(0, i - 45);
  const ende = Math.min(text.length, start + 130);
  return (start > 0 ? '… ' : '') + text.slice(start, ende).trim() + (ende < text.length ? ' …' : '');
}

// ── SQL-Konstanten (geteilt — §5, EINE Query-Logik) ──────────────────────────────

/**
 * bm25-Feldgewichte für `fts_artikel`, in der Spaltenreihenfolge
 * text · marginalie · marginalie_n · gliederung · tabelle · fussnote
 * (FTS_ARTIKEL_SPALTEN in fts.ts — die Reihenfolge ist tragend).
 *
 * WARUM ÜBERHAUPT GEWICHTE (QS-BASIS (d) K1/K2, 31.8.2026): Seit K1 indexiert
 * `fts_artikel` sechs Felder statt einem. Ohne Gewichte behandelt bm25 alle gleich —
 * eine Nennung im Fussnoten-Body zählte dann so viel wie der Randtitel, und die
 * Trefferliste würde durch Änderungshinweise und Gebührentabellen verwässert. Die
 * Rangfolge t > m > n > g > tb > f ist NICHT neu erfunden, sondern die bereits im
 * statischen Index geltende Feld-Gewichtung (such-index-generieren.ts, Feld-Doku S4;
 * dort umgesetzt in src/lib/suche/artikelRanking.ts).
 *
 * FACHLICHE BEGRÜNDUNG der Abstufung: trifft die Query die primäre Marginalie oder
 * den Gliederungs-Titel, ist der Artikel dem Thema GEWIDMET (OR 127 «Verjährung»,
 * OR 253 unter «Achter Titel: Die Miete»); trifft sie nur eine nachrangige
 * Marginalie, NENNT er es bloss. Tabellen- und Fussnoten-Tier sind RECALL-only —
 * sie sollen den Artikel auffindbar machen, ihn aber nicht nach oben tragen (eine
 * AS-Fundstelle in einer Fussnote widmet keinen Artikel einem Thema).
 *
 * Höhere Zahl = stärkeres Gewicht (bm25() in SQLite gibt negative Werte zurück und
 * wird darum AUFSTEIGEND sortiert; die Gewichte selbst sind positiv).
 */
export const BM25_GEWICHTE = [10, 8, 4, 5, 1, 0.5] as const;

const BM25 = `bm25(fts_artikel, ${BM25_GEWICHTE.join(', ')})`;

// ── Topische Stufung + Rangordnung (K2) ──────────────────────────────────────────
//
// WARUM bm25 ALLEIN NICHT REICHT — gemessen am 31.8.2026 gegen daten/normtext.db,
// nach der K1-Recall-Erweiterung und MIT den Feldgewichten oben:
//
//   Query «Miete»      → OR 253 auf bm25-Rang 128 von 165 · OR 267 auf 111
//   Query «Verjährung» → OR 127 auf bm25-Rang  89 von 259
//   Query «Eigentum»   → ZGB 641 auf bm25-Rang 466 von 658
//
// Das ist der Befund, der die Bau-Richtung dieses Schritts umgedreht hat. Die
// naheliegende Lösung — die Edge-Zeilen clientseitig durch `artikelRanking.rangiere()`
// schicken — kann NICHT funktionieren: sie re-rangiert das Fenster, das die Abfrage
// zurückgibt (max. 50 Zeilen), und OR 253 liegt auf Rang 128. Ein Re-Ranking rettet
// keinen Kandidaten, den die Abfrage nie geliefert hat. Die Stufung muss darum IN die
// Abfrage, wo sie über die ganze Treffermenge wirkt.
//
// Die Stufen sind dieselben drei wie in src/lib/suche/artikelRanking.ts:
//   Stufe 0 HAUPTTHEMA     — Query trifft primäre Marginalie ODER Gliederung
//   Stufe 1 NEBENERWÄHNUNG — Query trifft nur eine nachrangige Marginalie
//   Stufe 2 TEXTTREFFER    — innerhalb der Stufe entscheidet bm25 (statt, wie im
//                            Client, die FlexSearch-Ankunftsordnung)
//
// ⚠ SPIEGEL-PFLICHT (§5). Die Rang-POLITIK steht damit an ZWEI Stellen: hier als SQL
// (Edge-/DB-Weg) und in src/lib/suche/artikelRanking.ts als TypeScript (statischer
// Client-Weg). Das ist bewusst in Kauf genommen und NICHT durch einen geteilten Import
// auflösbar: diese Datei trägt die Null-Import-Regel für api/**, und ein Import aus
// scripts/ nach src/ gibt es im Produktivcode nirgends — ihn hier einzuführen, zöge
// Build-Code in das Client-Bundle.
// Die Doppelung wird darum nicht versteckt, sondern BEWACHT: die Prüfung
// «Edge-Ranking gegen dasselbe S4-Testset» und der Konstanten-Abgleich stehen in
// scripts/datenhaltung/suche-rang.test.ts. Wer KERNERLASSE hier oder dort ändert,
// läuft dort rot.
//
// ── WO DIE PARITÄT GILT — UND WO NICHT (ehrlich, 31.8.2026) ──────────────────────
// Nachtrag nach Gegenprüfungs-Befund F2. Die ursprüngliche Fassung dieses Blocks las
// sich, als sei der Edge-Weg dem Client-Weg rundum gleichwertig. Das war überzeichnet.
// Die Bilanz nach dem Fix, gemessen gegen daten/normtext.db:
//
//   GILT · Stufenmodell (Hauptthema / Nebenerwähnung / Texttreffer) — identisch
//          BEI EXAKT-TOKEN; bei Präfix-Treffern weicht die Stufe ab (s. GILT NICHT).
//   GILT · Stufen-Auslösung bei mehreren Termen: EIN Term im Feld genügt beidseits.
//          Bis zum 31.8. verlangte der SQL-Spaltenfilter ALLE Terme in derselben
//          Spaltengruppe («Verjährung Fristen» → OR 127 auf Rang 8 statt 1); behoben
//          in `baueFtsSpaltenMatch` (dort die Messreihe).
//   GILT · Ordnung innerhalb der topischen Stufen: Kernerlass, Ebene, Artikelnummer.
//
//   GILT NICHT · PRÄFIX-TREFFER. Der Client sucht mit FlexSearch `tokenize: 'forward'`,
//          also ist ein Token über jeden seiner Präfixe auffindbar; `artikelRanking.trifft()`
//          prüft entsprechend mit `startsWith`. Der DB-Weg sucht mit gequoteten,
//          VOLLSTÄNDIGEN Tokens. Folge, gemessen: «Verjähr» → Client findet, DB 0 Treffer.
//          Das ist eine BEWUSSTE Abweichung, kein Versehen. FTS5 könnte es (`"Verjähr"*`),
//          aber Angleichen ist eine RECALL-, RANG- UND LATENZ-Änderung auf jeder Query.
//          Und der Präfix verschiebt nicht nur die Treffermenge, sondern auch STUFEN und RÄNGE derselben Treffer (GP-Messung 31.8.2026, echter Client-rangiere() gegen identische DB-Treffermenge, ohne Recall-Confound): «Eigentum» n=658 — OR 261 («Wechsel des Eigentümers») und ZGB 200 («Eigentumsverhältnisse») stehen beim Client via startsWith auf Stufe 0/Seite 1, am Edge auf Stufe 2; «Eigentum Grundstück» n=87 — 15 Stufen-Divergenzen, 33 Positionswechsel >5 Plätze; «Miete Kündigung» n=20 — Top-20 nicht identisch.
//          Und sie ist teuer: lokal, warm, n=3 Median über daten/normtext.db
//            «Verjährung»  4,5 ms /  259 Treffer  →  präfix  8,2 ms /  299
//            «Miete»       3,1 ms /  165          →  präfix  9,6 ms /  309
//            «Eigentum»   15,6 ms /  658          →  präfix 107,1 ms / 1502   (6,9x)
//            «Kündigung»   8,3 ms /  376          →  präfix 20,0 ms /  519
//          Über den Turso-HTTP-Weg kommt das ungemessen obendrauf. Eine Änderung, die
//          Treffermenge UND Latenz jeder Query verschiebt, gehört in einen eigenen Schritt
//          mit eigener Messung und eigener Gegenprüfung — nicht in eine Fix-Runde.
//          Roadmap-Punkt: QS-BASIS «Präfix-Parität des Edge-Weges».
//   GILT NICHT · Synonym-Expansion. Der Client zieht über `vokabular.expandiereSuchbegriff`
//          zusätzliche Recall-Terme; der DB-Weg sucht nur die getippten. Das war schon vor
//          diesem Schritt so und ist hier nur der Vollständigkeit halber benannt.

/** Kern-Kodifikationen in Rang-Reihenfolge — SPIEGEL von KERNERLASSE in
 *  src/lib/suche/artikelRanking.ts (dort begründet: die im juristischen Alltag am
 *  häufigsten gemeinten Grund-Kodifikationen). Reihenfolge ist der Rang. */
export const KERNERLASSE: readonly string[] = ['OR', 'ZGB', 'STGB', 'ZPO', 'STPO', 'BV', 'SCHKG'];

/** Bund vor Kanton bei sonst gleichem Rang — SPIEGEL von EBENEN_RANG in
 *  artikelRanking.ts. Reine Anzeige-Ordnung (§3), KEINE Normenhierarchie; der
 *  Relevanz-Entscheid liegt weiterhin offen bei David (Stand 25.7.2026). */
const SQL_EBENEN_RANG = "CASE e.ebene WHEN 'bund' THEN 0 ELSE 1 END";

const SQL_KERN_RANG =
  'CASE a.erlass_key ' +
  KERNERLASSE.map((k, i) => `WHEN '${k}' THEN ${i}`).join(' ') +
  ` ELSE ${KERNERLASSE.length} END`;

// Natürliche Artikel-Ordnung («253» < «253a» < «254»), SPIEGEL von artikelSchluessel():
// führende Zahl numerisch, Rest lexikografisch; nicht-numerische Artikel ans Ende.
// SQLite kennt kein Regex — `CAST` liest die führenden Ziffern, `ltrim` schneidet sie ab.
const SQL_ART_NUM = "CASE WHEN a.artikel GLOB '[0-9]*' THEN CAST(a.artikel AS INTEGER) ELSE 999999999 END";
const SQL_ART_SUF = "ltrim(a.artikel, '0123456789')";

export const SQL_ARTIKEL_COUNT = 'SELECT count(*) AS n FROM fts_artikel WHERE fts_artikel MATCH ?';

/**
 * Treffer-Abfrage MIT topischer Stufung.
 *
 * Parameter in dieser Reihenfolge (positionell — Hrana/Turso wie node:sqlite):
 *   1 match_alle    (baueFtsMatch)
 *   2 match_haupt   (baueFtsSpaltenMatch über marginalie + gliederung)
 *   3 match_neben   (baueFtsSpaltenMatch über marginalie_n)
 *   4 limit · 5 offset
 *
 * Die beiden Stufen-CTEs sind reine rowid-Mengen über denselben Index — sie kosten
 * je einen zusätzlichen MATCH über kurze Felder, nicht einen zweiten Volltext-Scan.
 */
export const SQL_ARTIKEL_TREFFER = `WITH treffer AS (SELECT rowid AS rid, ${BM25} AS bm FROM fts_artikel WHERE fts_artikel MATCH ?),
     haupt AS (SELECT rowid AS rid FROM fts_artikel WHERE fts_artikel MATCH ?),
     neben AS (SELECT rowid AS rid FROM fts_artikel WHERE fts_artikel MATCH ?),
     roh AS (
       SELECT a.erlass_key AS erlass_key, a.art_id AS art_id, a.artikel AS artikel,
              a.artikel_label AS artikel_label, a.quelle_url AS quelle_url,
              a.bloecke_json AS bloecke_json, e.abkuerzung AS abkuerzung,
              e.ebene AS ebene, e.kanton AS kanton, t.bm AS bm, a.ord AS ord,
              CASE WHEN h.rid IS NOT NULL THEN 0 WHEN n.rid IS NOT NULL THEN 1 ELSE 2 END AS stufe,
              ${SQL_KERN_RANG} AS kern, ${SQL_EBENEN_RANG} AS ebene_rang,
              ${SQL_ART_NUM} AS art_num, ${SQL_ART_SUF} AS art_suf
       FROM treffer t
       JOIN artikel a ON a.rowid = t.rid
       JOIN erlasse e ON e.key = a.erlass_key
       LEFT JOIN haupt h ON h.rid = t.rid
       LEFT JOIN neben n ON n.rid = t.rid
     )
SELECT erlass_key, art_id, artikel, artikel_label, quelle_url, bloecke_json, abkuerzung, ebene, kanton
FROM roh
ORDER BY stufe,
         -- Topische Stufen (0/1): Kernerlass ↑, Bund vor Kanton, dann die Artikelnummer
         -- (definitorischer Eröffnungsartikel zuerst → «253 ff.»). Für Stufe 2 sind diese
         -- Schlüssel neutralisiert, damit dort ALLEIN bm25 ordnet — das entspricht der
         -- FlexSearch-Ankunftsordnung, die artikelRanking.ts für Gruppe B beibehält.
         CASE WHEN stufe = 2 THEN 0 ELSE kern END,
         CASE WHEN stufe = 2 THEN 0 ELSE ebene_rang END,
         CASE WHEN stufe = 2 THEN '' ELSE erlass_key END,
         CASE WHEN stufe = 2 THEN 0 ELSE art_num END,
         CASE WHEN stufe = 2 THEN '' ELSE art_suf END,
         bm,
         -- Fachlicher Tie-Break (stabile rowid, E0-BRANDSCHUTZ): bei gleichem bm25 — haeufig, z. B. bei
         -- gleichlautenden «aufgehoben»-Artikeln — entschied bisher die rowid (rid), die Einfuegereihenfolge
         -- (Datei-Pfad, dann Position). Die rowid ist jetzt ein Hash und ordnet nichts Fachliches mehr;
         -- dieselbe Reihenfolge steht darum als Schluessel da: Bund vor Kanton, Dateiname des Erlasses
         -- (erlass_key || '.json' — NICHT erlass_key allein: 'ZH-242.26.json' sortiert vor
         -- 'ZH-242.json', der blosse Schluessel umgekehrt; gemessen 7.10.2026, ein Tausch in 1 von
         -- 110 Anfragen), Position im Erlass, art_id. Fuer Stufe 2 gilt das ebenso (dort sind nur
         -- die Rang-Schluessel oben neutralisiert, bm25 bleibt der Hauptschluessel).
         ebene_rang, erlass_key || '.json', ord, art_id
LIMIT ? OFFSET ?`;

export const SQL_ENTSCHEIDE_COUNT =
  'SELECT count(*) AS n FROM fts_entscheide_schaufenster WHERE fts_entscheide_schaufenster MATCH ?';
export const SQL_ENTSCHEIDE_TREFFER = `SELECT id AS id, titel AS titel, quelle_url AS quelle_url,
       snippet(fts_entscheide_schaufenster, -1, '[', ']', '…', 8) AS snip
FROM fts_entscheide_schaufenster
WHERE fts_entscheide_schaufenster MATCH ?
ORDER BY bm25(fts_entscheide_schaufenster), rowid
LIMIT ? OFFSET ?`;

/** Roh-Zeile aus SQL_ARTIKEL_TREFFER (bloecke_json wird NUR intern fürs Snippet gelesen, NIE zurückgegeben). */
export interface ArtikelRohzeile {
  erlass_key: string;
  art_id: string;
  artikel: string;
  artikel_label: string;
  quelle_url: string;
  bloecke_json: string;
  abkuerzung: string;
  /** 'bund' | 'kanton' (F35) — optional, damit ein Aufrufer ohne die neuen
   *  Spalten weiterhin typkonform ist. */
  ebene?: string | null;
  /** Kantonskürzel; bei Bundeserlassen NULL (Spalte `erlasse.kanton`). */
  kanton?: string | null;
}
export function formeArtikelTreffer(r: ArtikelRohzeile, query: string): ArtikelTreffer {
  return {
    id: `art:${r.erlass_key}:${r.art_id}`,
    titel: `${r.artikel_label} ${r.abkuerzung}`.trim(),
    snippet: baueSnippet(bloeckeText(r.bloecke_json), query),
    fundstelle: {
      erlass: r.erlass_key,
      artikel: r.artikel,
      quelleUrl: r.quelle_url,
      // Leere Werte werden WEGGELASSEN, nicht als '' gesendet (F35): ein leeres
      // Feld im Draht liesse sich vom «kenne ich nicht» nicht unterscheiden —
      // und genau daran hängt clientseitig der Alt-Verhaltens-Fallback (§8).
      ...(r.ebene ? { ebene: r.ebene } : {}),
      ...(r.kanton ? { kanton: r.kanton } : {}),
    },
  };
}

/** Roh-Zeile aus SQL_ENTSCHEIDE_TREFFER (native FTS-Snippet). */
export interface EntscheidRohzeile {
  id: string;
  titel: string;
  quelle_url: string;
  snip: string;
}
export function formeEntscheidTreffer(r: EntscheidRohzeile): EntscheidTreffer {
  return { id: r.id, titel: r.titel, snippet: r.snip, fundstelle: { quelleUrl: r.quelle_url } };
}
