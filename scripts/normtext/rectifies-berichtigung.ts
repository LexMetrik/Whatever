/**
 * scripts/normtext/rectifies-berichtigung.ts — Rot-Beweis-Fundament für den Netz-Arm
 * `check:revisionen-rectifies` (Fehlerbuch W2·18: «Wächter ‹rectifies-Ziel vs.
 * Berichtigungstext›»).
 *
 * Befund (Gegenprüfung PR #827; §8-Marker `RevisionEintrag.plausibilitaet`
 * 'berichtigung-fremdes-as-dokument', s. revisionen-generieren.ts): Fedlex' `jolux:rectifies`
 * kann auf das FALSCHE AS-Dokument zeigen. Live-Beleg AS 2025 686 (SKV): das rectifies-Ziel
 * ist `eli/oc/2025/648` (TAFV 2, SR 741.413, Fundstelle «AS 2025 648»), der amtliche
 * Berichtigungstext selbst nennt aber wörtlich «SKV Änderung vom 15. Oktober 2025
 * (AS 2025 644; SR 741.013)» — ein belegter Fedlex-Datenfehler.
 *
 * Dieses Modul ist die REINE, testbare Hälfte (§2): Berichtigungstext (bereits geholt) →
 * Headline-Zitat(e) → Klasse. Der Netz-Teil (SPARQL-Auflösung + Fetch) ist injizierbar
 * (`FetchImpl`), damit `check-revisionen-rectifies.ts` ihn cachen kann (Determinismus,
 * Skill `scraping-swiss-official-sources` §Keep current cheaply — ein amtliches Berichtigungs-
 * dokument ist nach Publikation unveränderlich, der Cache also kein zweiter Wahrheits-Ort).
 *
 * ── Extraktion (Headline-Zitat, NICHT jede AS-/SR-Erwähnung) ──
 * Der amtliche Berichtigungstext nennt den korrigierten Erlass/die korrigierte Änderung
 * IMMER in der Form «<Erlasstitel> [Änderung(en)] vom <Tag>. <Monat> <Jahr> (AS <jjjj> <nnn>
 * [; SR <x.y>])» — live an ChemRRV/SKV/SSV/VVEA verifiziert. Eine BLOSSE «AS jjjj nnn»- oder
 * «SR x.y»-Suche (ohne das «vom <Datum> (…)»-Ankerformat) reisst beiläufige Fussnoten mit
 * herein (Gegenbeleg live an ELV/oc/2024/130: Fussnote «Ursprünglich Art. 1 (AS 2020 599)»
 * neben dem echten Ziel «(AS 2007 5155)» — hätte das Zwei-AS-Kriterium für Sammelberichtigung
 * fälschlich ausgelöst). Zwei Fedlex-HTML-Eigenheiten, beide live falsifiziert und in der
 * Regex abgefangen: (a) ein NBSP/Leerzeichen VOR der schliessenden Klammer («SR 741.21 )» —
 * ohne `\s*` vor `\)` verfehlt, s. SSV/oc/2024/144 Erst-Fassung dieses Reglers; (b) ein
 * Leerzeichen NACH der öffnenden Klammer («( AS 2019 1495; SR 814.81)») — ohne `\s*` nach
 * `\(` verfehlt, s. ChemRRV/oc/2026/394.
 *
 * Mehrere Headline-Zitate im selben Text (live an SSV/oc/2024/144: SSV UND NSV je mit
 * eigenem «vom … (AS …)»; VVEA/oc/2023/543: zwei unabhängige Änderungen) = eine echte
 * Sammelberichtigung — der Marker/das rectifies-Tripel bildet dann nur EINE der mehreren
 * betroffenen Fundstellen ab (§8-Ehrlichkeit, wie `baueOcZuRectifiesSr`).
 *
 * ── Ergänzung 12.9.2026, Gegenprüfung PR #834 (Auflage 1) ── (2b: ergänzt, nicht
 * nachgeführt — die Erst-Fassung oben bleibt der SKV-Beleg, unverändert)
 * ZWEITER belegter Fedlex-Datenfehler, live nachgemessen: AIG/oc/2025/342. Der amtliche
 * Berichtigungstext korrigiert ausdrücklich «Änderung vom 25. September 2015 (AS 2016
 * 3101)», Anhang Ziff. 1, AIG (SR 142.20) Art. 80 Abs. 1. Das rectifies-Ziel `eli/oc/2018/438`
 * (Fundstelle AS 2018 2855) ist dagegen NUR eine Inkraftsetzungsverordnung ohne eigenen
 * Normtext — ihr Volltext (PDF-A, verifiziert 12.9.2026) lautet vollständig: «Einziger
 * Artikel: Die Änderung vom 25. September 2015 des AsylG tritt am 1. März 2019
 * abschliessend in Kraft.» Sie kann die im Berichtigungstext zitierte Anhangs-Änderung
 * nicht selbst tragen — jolux:rectifies zeigt auf das falsche AS-Dokument. Beide Funde
 * jetzt in `bibliothek/normtext/rectifies-ausnahmen.json`.
 *
 * ── Falle c, 18.9.2026, Normen-Monitor-Lauf 35353185468 (Parser-Lücke, KEIN Fedlex-
 * Datenfehler) ── EINE Klammer kann MEHRERE komma-getrennte AS-Nummern DESSELBEN Jahrgangs
 * tragen: VTS/oc/2025/691 nennt «Änderung vom 15. Oktober 2025 (AS 2025 646, 665; SR
 * 741.41)» — Filestore-Beleg
 * https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/oc/2025/691/de/html/
 * fedlex-data-admin-ch-eli-oc-2025-691-de-html.html (Abruf 18.9.2026). AS 2025 665 ist
 * selbst eine frühere Berichtigung DERSELBEN Änderung (Genre 900, dateDocument 2025-10-30,
 * SPARQL `eli/oc/2025/665` — Abruf 18.9.2026), keine unabhängige zweite Änderung. Die
 * Erst-Fassung der Regex liess nach der ersten Nummer nur `;SR…` oder die schliessende
 * Klammer zu und verfehlte den Fall vollständig (0 Treffer). Fix: Gruppe 2 der Regex lässt
 * `(?:\s*,\s*\d+)*` weitere Nummern zu, `extrahiereHeadlineZitate` fügt jede einzeln der
 * `as`-Menge hinzu. Klassifikation bewusst UNVERÄNDERT gelassen (§17: nicht umgedeutet, um
 * Grün zu erzwingen) — mehr als eine genannte Fundstelle bleibt `sammelberichtigung`, exakt
 * wie bei VVEA/oc/2023/543 und SSV/oc/2024/144.
 */
import { sparqlSelect, type FetchImpl } from '../fedlex-sparql.ts';
import type { RectifiesInfo } from './revisionen-generieren.ts';

const LANG_DE = '<http://publications.europa.eu/resource/authority/language/DEU>';

/** Headline-Zitat: «vom <Tag>. <Monat> <Jahr> ( AS <jjjj> <nnn>[, <mmm>[, …]] [; SR <x.y> ] )».
 *  `\s*` beidseitig der Klammern (s. Docstring, Fallen a/b, beide live belegt). Gruppe 2 kann
 *  mehrere komma-getrennte Nummern DESSELBEN Jahrgangs tragen (Falle c, s. Docstring) — die
 *  Aufsplittung passiert in `extrahiereHeadlineZitate`, nicht hier in der Regex. */
const HEADLINE_ZITAT =
  /vom\s+\d{1,2}\.\s*\p{L}+\s+\d{4}\s*\(\s*AS\s+(\d{4})\s+(\d+(?:\s*,\s*\d+)*)(?:;\s*SR\s+([\d.]+)\s*)?\)/gu;

export interface HeadlineZitate {
  /** Distinkte «AS jjjj nnn»-Fundstellen, sortiert. */
  as: string[];
  /** Distinkte SR-Notationen (nur wo im selben Zitat genannt), sortiert. */
  sr: string[];
}

/** Reine Extraktion (§2, kein Netz) — Fedlex-Filestore-HTML → Headline-Zitate.
 *  Tags werden vor der Regex entfernt (Fedlex verteilt ein Zitat oft über mehrere
 *  `<span>`, z. B. `<span>AS</span><span> </span>2016<span> 3101)</span>` — eine Regex
 *  über den rohen HTML-String verfehlt das systematisch, live an AIG/oc/2025/342 belegt). */
export function extrahiereHeadlineZitate(html: string): HeadlineZitate {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
  const asSet = new Set<string>();
  const srSet = new Set<string>();
  for (const m of text.matchAll(HEADLINE_ZITAT)) {
    for (const nummer of m[2].split(',')) asSet.add(`AS ${m[1]} ${nummer.trim()}`);
    if (m[3]) srSet.add(m[3]);
  }
  return { as: [...asSet].sort(), sr: [...srSet].sort() };
}

export type RectifiesKlasse = 'uebereinstimmend' | 'abweichend' | 'sammelberichtigung';

/** Ein Eintrag in `bibliothek/normtext/rectifies-ausnahmen.json` (Gegenprüfung PR #834,
 *  Auflage 3, §6.7-Stale-Schutz): eine Ausnahme trägt NICHT nur die oc-Identität, sondern
 *  das PAAR, das sie ursprünglich belegt hat — welches Ziel das rectifies-Tripel nannte
 *  UND welche Fundstelle der Berichtigungstext selbst nannte. Ändert sich eines von beiden
 *  (Fedlex korrigiert das Tripel, oder ein neuer Text erscheint unter derselben oc), gilt
 *  die Ausnahme NICHT mehr automatisch weiter — sonst wäre sie ein stiller Freibrief, der
 *  nie wieder scheitern kann (§6.7 «ein Tor, das nicht scheitern kann, ist gefährlicher
 *  als keines»). */
export interface RectifiesAusnahme {
  oc: string;
  seit: string;
  belegUrl: string;
  begruendung: string;
  erwartetesZielOc: string;
  erwarteteZielFundstelle?: string;
  erwarteteTextFundstelle?: string;
}

/** Reine Prüfung (§2): passt die dokumentierte Ausnahme noch zur AKTUELL gemessenen
 *  Realität (frisches rectifies-Ziel + frisch extrahierte Text-Fundstelle)? `false` ⇒ die
 *  Ausnahme ist stale — der Aufrufer listet sie dann als eigene, rote Klasse statt sie
 *  stillschweigend weiter greifen zu lassen. */
export function ausnahmeGueltig(
  ausnahme: Pick<RectifiesAusnahme, 'erwartetesZielOc' | 'erwarteteZielFundstelle' | 'erwarteteTextFundstelle'>,
  aktuell: { zielOc: string; zielFundstelle?: string; textFundstelle?: string },
): boolean {
  return ausnahme.erwartetesZielOc === aktuell.zielOc
    && (ausnahme.erwarteteZielFundstelle ?? '') === (aktuell.zielFundstelle ?? '')
    && (ausnahme.erwarteteTextFundstelle ?? '') === (aktuell.textFundstelle ?? '');
}

/** Reine Komposition (§2): Headline-Zitate + rectifies-Zielinfo → Klasse.
 *  - >1 distinktes AS-Zitat ⇒ Sammelberichtigung (der Text korrigiert mehr als eine
 *    Fundstelle; das rectifies-Tripel trägt nur eine davon, §8-Ehrlichkeit).
 *  - genau 1 (oder 0) AS-Zitat: übereinstimmend gdw. es die vom rectifies-Ziel abgeleitete
 *    Fundstelle trifft (oder, wenn `fundstelle()` keine ableiten konnte, die SR-Notation) —
 *    sonst abweichend (Befund, NIE in Prosa übersetzt — §7/§17-Fehlerbuch W2·18). */
export function klassifiziereBerichtigung(
  zitate: HeadlineZitate,
  ziel: Pick<RectifiesInfo, 'fremdeSr' | 'zielFundstelle'>,
): RectifiesKlasse {
  if (zitate.as.length > 1) return 'sammelberichtigung';
  if (ziel.zielFundstelle) return zitate.as.includes(ziel.zielFundstelle) ? 'uebereinstimmend' : 'abweichend';
  return zitate.sr.includes(ziel.fremdeSr) ? 'uebereinstimmend' : 'abweichend';
}

/** Löst die DE-HTML-Filestore-URL des berichtigenden oc via die amtliche
 *  `isRealizedBy → isEmbodiedBy(html) → isExemplifiedBy`-Kette auf (Skill
 *  `scraping-swiss-official-sources`, Rezept 2). `null`, wenn keine HTML-Manifestation
 *  existiert (live beobachtet bei Alt-Berichtigungen mit nur pdf-a/docx) — dann ist der
 *  Abruf eine LÜCKE, nicht zu erraten (Skill-Falle 3). */
export async function loeseBerichtigungsHtmlUrl(oc: string, fetchImpl: FetchImpl = fetch): Promise<string | null> {
  const query = `PREFIX jolux: <http://data.legilux.public.lu/resource/ontology/jolux#>
SELECT ?file WHERE {
  <${oc}> jolux:isRealizedBy ?expr .
  ?expr jolux:language ${LANG_DE} ; jolux:isEmbodiedBy ?manif .
  ?manif jolux:isExemplifiedBy ?file ; jolux:userFormat <https://fedlex.data.admin.ch/vocabulary/user-format/html> .
}`;
  const bindings = await sparqlSelect(query, fetchImpl);
  return bindings[0]?.file?.value ?? null;
}

/** Ein 200 kann die ~9 KB Casemates-Angular-Hülle sein statt des Dokuments (Skill-Falle 3,
 *  live verifiziert 12.9.2026: eine erratene/verwaiste Filestore-URL liefert HTTP 200,
 *  `Content-Type: text/html`, Titel «Casemates», OHNE `id="lawcontent"`). Content-Type
 *  allein trennt NICHT (die Hülle ist ebenfalls text/html) — massgeblich ist der Marker. */
export function istCasematesHuelle(html: string): boolean {
  return html.includes('<title>Casemates</title>') || !html.includes('id="lawcontent"');
}

/** Holt den Berichtigungstext; wirft bei Netz-/Format-Fehler oder Casemates-Hülle (NIE
 *  einen Fehler stumm als «kein Beleg» durchgehen lassen — der Aufrufer entscheidet, ob
 *  daraus eine Lücke wird). */
export async function holeBerichtigungstext(url: string, fetchImpl: FetchImpl = fetch): Promise<string> {
  const res = await fetchImpl(url);
  const typ = res.headers?.get?.('content-type') ?? null;
  const text = await res.text();
  if (!res.ok || (typ !== null && !typ.includes('html')) || istCasematesHuelle(text)) {
    throw new Error(`Berichtigungstext ${url} nicht abrufbar (Status ${res.status}, Content-Type «${typ}»).`);
  }
  return text;
}
