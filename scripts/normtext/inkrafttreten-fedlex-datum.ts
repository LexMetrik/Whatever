// ─── Signal e — amtliche Fedlex-Angabe «Datum des Inkrafttretens» ─────────────
//
// W2·27-BUND-FERTIG, Nachzug nach widerlegter Gegenprüfung (2.10.2026). Das
// Abstract-`dateEntryInForce` und die Zeitleiste sehen ein Teil-Inkrafttreten nicht:
// Fedlex setzt `dateEntryInForce` auf EIN Datum aus der Teil-Liste (KG: der früheste, ATSG:
// der Haupt-Termin) und beginnt die Zeitleiste oft am selben Tag (KG: Art. 18–25 am
// 1.2.1996, Rest am 1.7.1996 ⇒ Ur-Datum 1996-02-01 = erste Konsolidierung ⇒ das
// Zeitleisten-Signal ist strukturell blind).
// Die amtliche Fassung selbst listet die Teil-Daten: im Akoma-Ntoso-XML (Filestore,
// gepinnte Fassung) steht am Ende der Inkrafttretens-Bestimmung ein Absatz
//   «Datum des Inkrafttretens: <Teil>: <Datum> <br/> <Teil>: <Datum> …»
// (je Zeile Fussnote mit dem Inkraftsetzungs-Beschluss). Der Extraktor behält diese
// Zeile im Normtext nur ausnahmsweise (6/231 Shards) — darum liest dieses Signal das
// XML direkt (Quelle = dieselbe amtliche Fassung wie der Normtext, §7).
//
// Regel (eng, deterministisch, §2): mehr als EIN verschiedenes Datum im Absatz
// ⇒ gestaffelt. Genau ein Datum ⇒ kein Signal (andere Signale können greifen).
// Absatz vorhanden, aber ohne lesbares Datum ⇒ unbekannt (fail-closed, §8).
// Quelle nicht abrufbar ⇒ unbekannt (fail-closed). Abwesenheit des Absatzes ist
// KEIN Beleg für «nicht gestaffelt» — sie bleibt ohne Aussage dieses Signals.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { sparqlBatch, type FetchImpl } from '../fedlex-sparql.ts';
import { baueStaende, baueStaendeQuery } from '../entstehung/synopse.ts';

// Monatswörter in der amtlichen Fedlex-Schreibweise. Gemessen 2.10.2026 an allen 231
// gepinnten XML (Gesamttext, nicht nur Datums-Absätze): «Jan.» 15382, «Dez.» 4894, «Okt.»
// 4063, «Sept.» 3481, «Nov.» 3469, «Aug.» 1563, «Febr.» 1309 (⇒ NICHT «Feb.»: nur 3×),
// «Apr.» 5, «Sep.» 1; ausgeschrieben «Juni», «März», «Juli», «Mai», «April», … Die Liste
// führt zusätzlich die Kurzformen ohne Punkt («Sept», «Dez», «Jan», «Okt», «Aug»), die der
// Regex über das optionale «.» abdeckt.
const MONAT: Record<string, number> = {
  januar: 1, jan: 1, februar: 2, febr: 2, feb: 2, märz: 3, mrz: 3, april: 4, apr: 4, mai: 5,
  juni: 6, jun: 6, juli: 7, jul: 7, august: 8, aug: 8, september: 9, sept: 9, sep: 9,
  oktober: 10, okt: 10, november: 11, nov: 11, dezember: 12, dez: 12,
};
const MONAT_RE = Object.keys(MONAT).sort((a, b) => b.length - a.length).join('|');
const DATUM_RE = new RegExp(`(?<!\\d)(\\d{1,2})\\.\\s*(${MONAT_RE})\\.?\\s*(\\d{4})`, 'gi');
// Zahldatum «1.1.2010» / «01.07.1996» (kein Monatswort). Gemessen 2.10.2026: 0 Treffer in
// den Datums-Absätzen der 231 XML — Latenz-Absicherung, kein Korpus-Befund.
const ZAHLDATUM_RE = /(?<!\d)(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})(?!\d)/g;
// Vierstellige Jahreszahl (1800–2099), die nach Abzug der gelesenen Daten übrig bleibt.
const JAHR_RE = /(?<!\d)(?:18|19|20)\d{2}(?!\d)/;
// Drei amtliche Label-Formen (gemessen 2.10.2026 an allen 231 gepinnten XML): «Datum des
// Inkrafttretens:» (80 Erlasse), die Tippfehler-Variante «Datum des Inkrafttreten:» (ELG,
// ZPO, ZEMIS_V — ZPO Art. 408) und ein Absatz, der mit «Inkrafttreten:» BEGINNT (BEG,
// BUEG, DSG, EPG, FINFRAG, LMG, STBOG). «Inkrafttreten:» mitten im Absatz (EAUE:
// Vertragsnotiz hinter <br/>) ist kein Label und zählt nicht.
const LABEL_RE = /Datum des Inkrafttreten(?:s)?\s*:|<p\b[^>]*>\s*Inkrafttreten\s*:/g;

export type InkrafttretensAngabe = { vorhanden: boolean; daten: string[] };

/** Entfernt Fussnoten (deren Daten sind Beschluss-/AS-Daten, keine Inkrafttretens-Daten) und Tags. */
function nurText(seg: string): string {
  return seg
    .replace(/<authorialNote\b[\s\S]*?<\/authorialNote>/g, ' ')
    .replace(/<[^>]*>/g, ' ');
}

/**
 * REIN: liest die «Datum des Inkrafttretens:»-Angabe(n) aus dem AKN-XML einer Fassung.
 * Der Absatz reicht vom Label bis zum Ende des umschliessenden `<content>` (die Teil-
 * Zeilen stehen in Folge-`<p>` desselben Absatzes). Daten ISO, sortiert, distinkt.
 */
export function fedlexInkrafttretensAngabe(xml: string): InkrafttretensAngabe {
  const daten = new Set<string>();
  let vorhanden = false;
  let ungelesenesJahr = false;
  const iso = (j: string, m: number, t: string): string | null =>
    m >= 1 && m <= 12 && +t >= 1 && +t <= 31 ? `${j}-${String(m).padStart(2, '0')}-${t.padStart(2, '0')}` : null;
  for (const m of xml.matchAll(LABEL_RE)) {
    vorhanden = true;
    const rest = xml.slice(m.index! + m[0].length);
    const ende = rest.indexOf('</content>');
    let text = nurText(ende >= 0 ? rest.slice(0, ende) : rest.slice(0, 4000));
    const lesen = (re: RegExp, monat: (feld: string) => number): void => {
      text = text.replace(re, (ganz: string, tag: string, feld: string, jahr: string) => {
        const d = iso(jahr, monat(feld), tag);
        if (d === null) return ganz; // Tag/Monat ausser Bereich ⇒ Jahr bleibt stehen ⇒ fail-closed
        daten.add(d);
        return ' ';
      });
    };
    lesen(DATUM_RE, (feld) => MONAT[feld.toLowerCase()]);
    lesen(ZAHLDATUM_RE, (feld) => +feld);
    // Fail-closed (§8): eine Jahreszahl ohne gelesenes Datum (Fussnoten sind schon entfernt)
    // heisst: der Absatz enthält ein Datum, das wir nicht verstehen.
    if (JAHR_RE.test(text)) ungelesenesJahr = true;
  }
  // Ungelesene Jahreszahl und höchstens ein gelesenes Datum ⇒ Angabe unlesbar ⇒ daten leer
  // (vorhanden bleibt true) ⇒ staffelEntscheid wertet «unbekannt» (gestaffelt: true). Bei
  // ≥ 2 gelesenen Daten ist der Erlass ohnehin gestaffelt; die gelesenen Daten bleiben.
  if (ungelesenesJahr && daten.size <= 1) daten.clear();
  return { vorhanden, daten: [...daten].sort() };
}

export type XmlQuelle = { key: string; eli: string; token: string };

/** Pin-Marker wie scripts/normtext/fedlex-xml-cache.ts («eli|konsolidierung»). */
const pinText = (q: XmlQuelle): string => `${q.eli}|${q.token}`;
const xmlPfad = (key: string, dir: string): string => `${dir}/${key.toLowerCase()}.xml`;

const istXml = (typ: string, body: string): boolean =>
  /xml/i.test(typ) && !/<title>\s*Casemates/i.test(body) && body.includes('<akomaNtoso');

export type LadeOptionen = { cacheDir?: string; pauseMs?: number };

/**
 * Fedlex-XML je Erlass (key → XML oder null). Reihenfolge: (1) gültiger /tmp-Cache
 * (Marker == eli|Fassungstoken, derselbe Cache wie der Struktur-Lauf), (2) sonst
 * SPARQL (Konsolidierung → deutsche XML-Manifestation) + Filestore, SEQUENTIELL und
 * gedrosselt. Fail-closed: jeder Fehlschlag (Netz, HTTP, HTML-Shell mit Status 200)
 * ⇒ null (nie Wurf, nie leerer String). Der Cache wird nur NEU angelegt, nie überschrieben.
 */
export async function ladeFedlexXml(
  quellen: XmlQuelle[], fetchImpl: FetchImpl, opt: LadeOptionen = {},
): Promise<Map<string, string | null>> {
  const dir = opt.cacheDir ?? '/tmp';
  const out = new Map<string, string | null>();
  const fehlend: XmlQuelle[] = [];
  for (const q of quellen) {
    const pfad = xmlPfad(q.key, dir);
    if (existsSync(pfad) && existsSync(`${pfad}.pin`) && readFileSync(`${pfad}.pin`, 'utf8') === pinText(q)) {
      out.set(q.key, readFileSync(pfad, 'utf8'));
    } else fehlend.push(q);
  }
  if (fehlend.length === 0) return out;

  let staende = new Map<string, { datum: string; xmlUrl: string }[]>();
  try {
    const abstracts = [...new Set(fehlend.map((q) => `<https://fedlex.data.admin.ch/eli/${q.eli}>`))];
    staende = baueStaende(await sparqlBatch(abstracts, baueStaendeQuery, { fetchImpl, batchGroesse: 20 }), '1900-01-01');
  } catch { /* fail-closed: alle fehlenden bleiben null */ }

  for (const q of fehlend) {
    out.set(q.key, null);
    const datum = `${q.token.slice(0, 4)}-${q.token.slice(4, 6)}-${q.token.slice(6, 8)}`;
    const st = staende.get(`https://fedlex.data.admin.ch/eli/${q.eli}`)?.find((s) => s.datum === datum);
    if (!st) continue;
    try {
      const res = await fetchImpl(st.xmlUrl);
      const body = await res.text();
      if (!res.ok || !istXml(res.headers.get('content-type') ?? '', body)) continue;
      out.set(q.key, body);
      const pfad = xmlPfad(q.key, dir);
      if (!existsSync(pfad)) { writeFileSync(pfad, body, 'utf8'); writeFileSync(`${pfad}.pin`, pinText(q), 'utf8'); }
    } catch { /* fail-closed: bleibt null */ }
    if (opt.pauseMs !== 0) await new Promise((r) => setTimeout(r, opt.pauseMs ?? 200));
  }
  return out;
}
