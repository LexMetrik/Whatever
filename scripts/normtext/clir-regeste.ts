// ─── clir-Regeste-Adapter: bger.ch clir → strukturierte, dreisprachige Regeste ──
//
// Zweck (W2·6-B B2 + A18): die amtlich publizierte BGE-Regeste TREU als Struktur
// nachextrahieren — Regestenkopf (massgebliche Artikel + Regestentitel, in der
// amtlichen Sammlung FETT) + Textabsätze, je Sprachfassung (DE/FR/IT), sortiert.
//
// QUELL-WAHL (§7, empirisch 5.7.2026): Die OpenCaseLaw-Rohregeste (`det.regeste`)
// ist EIN flacher, EINsprachiger (Entscheidsprache) String ohne Absatz-/Kopf-
// Struktur — sie trägt A18 (dreisprachig) und B2 (Absätze/fette Artikel) NICHT.
// Die EINZIGE amtliche Quelle mit dieser Struktur ist bger.ch/search.bger.ch clir:
// pro BGE existieren getrennte Sprach-Dokumente `atf://<band>:de|fr|it`, jedes mit
//   <div id="regeste" lang="de|fr|it">
//     <div class="big bold">Regeste</div>
//     <div class="paraatf">KOPF …  <div class="paratf">ABSATZ</div> …</div>
//   </div>
// `paraatf` = Regestenkopf (Artikel + Regestentitel = der fette Teil der amtl.
// Sammlung), `paratf` = die Textabsätze der Regeste. Die Sprachfassung ist über
// das `lang`-Attribut STRUKTURELL bestimmt — keine Wortraten-Heuristik (A18/§2).
// Fehlt eine Sprachfassung in der Quelle, wird sie WEGGELASSEN, nie geraten (§1).
//
// Charset der clir-Seiten ist iso-8859-1 (latin-1) — der Fetcher dekodiert
// entsprechend (sonst zerfallen ä/é/à zu Ersatzzeichen; Fidelity-Falle).
// Recht: Urteils-/Regestetext gemeinfrei (Art. 5 URG). Netz höflich: identifi-
// zierender User-Agent, gedrosselt, Rohantwort gecacht (Re-Parse ohne Re-Crawl).

import type { EntscheidSprache } from '../../src/lib/rechtsprechung/typen';
import { promises as fs, writeSync } from 'node:fs';
import * as path from 'node:path';

export interface RegesteTeilRoh {
  label: string | null;        // Teil-Buchstabe der amtl. Sammlung ('a'|'b'|'c'…) — null bei Einfach-Regeste
  kopf: string;                // Regestenkopf (fett): Artikel + Regestentitel
  absaetze: string[];          // Textabsätze (paratf) in Quell-Reihenfolge
}

export interface RegesteSprachfassungRoh {
  sprache: EntscheidSprache;   // 'de' | 'fr' | 'it'
  kopf: string;                // Regestenkopf (fett) des ERSTEN Teils (a) — Rückwärtskompat/Fallback
  absaetze: string[];          // Textabsätze des ERSTEN Teils
  // Mehrteilige Regeste (amtl. «Regeste a / b / c»): ALLE Teile inkl. a, mit Label,
  // in Quell-Reihenfolge. NUR gesetzt, wenn die Quelle >1 Regeste-Block trägt (§1:
  // nie erfunden). Fehlt das Feld ⇒ Einfach-Regeste (kopf/absaetze tragen alles).
  weitereRegesten?: RegesteTeilRoh[];
}

/** HTTP-Header: identifizierend, höflich (bger.ch schonen). Die EINE Konstante
 *  für die Rechtsprechungs-Abrufe — auch OCL (`jget`, adapter-entscheide.ts). */
export const RECHTSPRECHUNG_UA = 'LexMetrik/1.0 (+https://lexmetrik.vercel.app; research crawler; david.graf95@gmail.com)';

/**
 * BGE-Referenz («152 V 2», «151 IV 357») → clir-docid-Segment «152-V-2».
 * Deterministisch; null bei unerwartetem Format (dann kein clir-Abruf).
 */
export function bgeRefZuClirId(ref: string): string | null {
  const m = /^(\d+)\s+([IVX]+)\s+(\d+)$/.exec(String(ref).trim());
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/** clir-URL einer Sprachfassung (amtliche Quelle-URL, §7). */
export function clirUrl(clirId: string, sprache: EntscheidSprache): string {
  return clirUrlAufHost('www.bger.ch', clirId, sprache);
}

function clirUrlAufHost(host: string, clirId: string, sprache: EntscheidSprache): string {
  const docid = encodeURIComponent(`atf://${clirId}:${sprache}`);
  return `https://${host}/ext/eurospider/live/${sprache}/php/clir/http/index.php`
    + `?highlight_docid=${docid}&lang=${sprache}&type=show_document`;
}

/**
 * Abruf-Spiegel für clir, in Abruf-Reihenfolge — die EINE Stelle (§5; die
 * Wochenlauf-Stichprobe baute dieselbe Idee lokal nach). Beide Hosts liefern
 * denselben Pfad, der fachliche Teil (Urteilskopf/Regeste) ist byte-identisch
 * (Messung 25.9.2026). search.bger.ch ZUERST: www.bger.ch schickt kein
 * Zwischenzertifikat, Node-fetch scheitert dort sofort mit
 * UNABLE_TO_VERIFY_LEAF_SIGNATURE (Node 24.16, auch mit --use-system-ca;
 * curl/Browser ergänzen die Kette selbst) — www zuerst kostete je Abruf einen
 * Fehlversuch. Ausweichen auf den nächsten Host bei Netz-/TLS-Fehler oder
 * Status ≥ 500 (Anlass #1099, 25.9.2026: www.bger.ch durchgehend 503, 0/81
 * Regesten, bis von Hand auf search.bger.ch umgestellt wurde).
 * Gespeicherte/angezeigte Links bleiben `clirUrl()` = www.bger.ch (Provenienz).
 */
export const CLIR_HOSTS = ['search.bger.ch', 'www.bger.ch'] as const;

/** Alle Abruf-URLs einer Sprachfassung in Abruf-Reihenfolge (s. CLIR_HOSTS). */
export function clirKandidaten(clirId: string, sprache: EntscheidSprache): string[] {
  return CLIR_HOSTS.map((h) => clirUrlAufHost(h, clirId, sprache));
}

/**
 * Schneidet den `<div id="regeste" …>`-Teilbaum durch DIV-Balancierung heraus
 * (robuster als ein Ende-Marker: die Regeste schliesst mit mehreren </div> und
 * es folgt variabel `<br><div>` bzw. der Sachverhalt-Anker). null ⇒ kein
 * Regeste-Block in dieser Sprachfassung vorhanden.
 */
export function schneideRegesteDiv(html: string): { sprache: string; inner: string } | null {
  const alle = schneideAlleRegesteDivs(html);
  return alle.length ? { sprache: alle[0].sprache, inner: alle[0].inner } : null;
}

/**
 * Schneidet ALLE `<div id="regeste" lang="…">`-Teilbäume heraus (Bug-Fix A29,
 * 16.7.2026): eine amtlich MEHRTEILIGE Regeste («Regeste a / b / c») liegt im
 * clir-HTML als MEHRERE aufeinanderfolgende `<div id="regeste">`-Blöcke vor (je
 * ein Teil, jeder mit eigenem `<div class="big bold">Regeste&nbsp;x</div>`-Titel).
 * Der alte `.exec`-Einzelschnitt nahm nur den ERSTEN Block → Regeste b/c gingen
 * still verloren. Hier balanciert je Block über die DIVs und iteriert weiter.
 * (Die Quelle vergibt denselben `id="regeste"` mehrfach — technisch invalides,
 * aber stabiles amtliches Markup; wir lesen strukturell, nicht per id-Eindeutigkeit.)
 */
export function schneideAlleRegesteDivs(html: string): { sprache: string; inner: string }[] {
  const out: { sprache: string; inner: string }[] = [];
  const oeffner = /<div id="regeste"\s+lang="([a-z]+)"\s*>/gi;
  for (let start; (start = oeffner.exec(html)); ) {
    const sprache = start[1];
    const i = start.index + start[0].length;
    let tiefe = 1;
    const tag = /<\/?div\b[^>]*>/gi;
    tag.lastIndex = i;
    for (let m; (m = tag.exec(html)); ) {
      if (m[0][1] === '/') tiefe--;
      else tiefe++;
      if (tiefe === 0) {
        out.push({ sprache, inner: html.slice(i, m.index) });
        oeffner.lastIndex = tag.lastIndex;   // hinter dem Block-Ende weitersuchen
        break;
      }
    }
    if (tiefe !== 0) break;   // unbalanciert → nicht weiter raten (§1)
  }
  return out;
}

/** HTML-Inline eines Regeste-Fragments → treuer Klartext.
 *  - `<sup>x</sup>` → x ohne Trennzeichen an den Vortoken gehängt (Art. 61 lit.
 *    f<sup>bis</sup> → «Art. 61 lit. fbis»; die amtl. Zitierform, verbatim erhalten).
 *  - `<i>/<em>/<b>/<span>/<a name>` etc. → nur Textinhalt behalten.
 *  - Entities dekodiert; NBSP/schmales NBSP/Guillemets/Dezimalkomma verbatim. */
export function inlineZuText(fragment: string): string {
  let s = fragment;
  s = s.replace(/<sup\b[^>]*>(.*?)<\/sup>/gis, (_m, x) => String(x).replace(/<[^>]+>/g, ''));
  s = s.replace(/<br\s*\/?>/gi, ' ');
  s = s.replace(/<[^>]+>/g, '');          // restliche Tags entfernen (Inhalt bleibt)
  s = entdecodeEntities(s);
  s = s.replace(/[ \t\r\n]*\n[ \t\r\n]*/g, ' ');  // Zeilenumbrueche -> Space (NBSP/U+202F im Text bleiben)
  s = s.replace(/[ \t]{2,}/g, ' ');
  return s.trim();
}

/** Nur die im clir-HTML real vorkommenden Named/Numeric-Entities. */
function entdecodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0*39;|&apos;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_m, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_m, d) => String.fromCodePoint(parseInt(d, 10)));
}

/**
 * Parst EINE clir-Sprachfassungs-Seite → strukturierte Regeste (Kopf + Absätze).
 * Rein (netzfrei) → unit-testbar gegen gecachtes HTML. null ⇒ keine sichere
 * Regeste-Struktur ableitbar (dann Fall dokumentieren, §1: nie raten).
 */
export function parseClirRegeste(html: string): RegesteSprachfassungRoh | null {
  const divs = schneideAlleRegesteDivs(html);
  if (!divs.length) return null;
  const spr = divs[0].sprache;
  if (spr !== 'de' && spr !== 'fr' && spr !== 'it') return null;
  const teile: RegesteTeilRoh[] = [];
  for (const div of divs) {
    // Alle Blöcke einer Seite tragen dieselbe Sprache (clir liefert je Sprache eine
    // Seite); ein abweichender lang wäre ein Quell-Bruch → dann Block auslassen (§1).
    if (div.sprache !== spr) continue;
    const t = parseRegesteBlockInner(div.inner);
    if (t) teile.push(t);
  }
  if (!teile.length) return null;
  const [erster, ...rest] = teile;
  const roh: RegesteSprachfassungRoh = { sprache: spr, kopf: erster.kopf, absaetze: erster.absaetze };
  if (rest.length) roh.weitereRegesten = teile;   // alle Teile inkl. a, nur bei Mehrteiligkeit
  return roh;
}

/**
 * Regeste-Teil-Label aus dem «big bold»-Titel («Regeste&nbsp;a» → 'a', «Regesto&nbsp;b»
 * → 'b', schlichtes «Regeste» → null bei Einfach-Regeste). Deterministisch (§2).
 */
export function parseRegesteLabel(titelRoh: string): string | null {
  const t = inlineZuText(titelRoh).trim();
  // \s deckt in JS auch NBSP (U+00A0, aus &nbsp;) und schmales NBSP (U+202F) ab.
  const m = /^Regest[eo](?:\s+([a-z]+))?$/i.exec(t);
  return m && m[1] ? m[1].toLowerCase() : null;
}

/**
 * Parst EINEN `<div id="regeste">`-Block-Inhalt → {label, kopf, absaetze}.
 * `null`, wenn kein sicherer Kopf ableitbar ist (§1: nie raten).
 */
export function parseRegesteBlockInner(inner: string): RegesteTeilRoh | null {
  // Label aus dem big-bold-Titel, BEVOR er entfernt wird.
  const titelM = /<div class="big bold">([\s\S]*?)<\/div>/i.exec(inner);
  const label = parseRegesteLabel(titelM?.[1] ?? '');
  const ohneTitel = inner.replace(/<div class="big bold">[\s\S]*?<\/div>/i, '');
  // Regestenkopf = <div class="paraatf"> … (bis zum ersten verschachtelten paratf).
  const kopfM = /<div class="paraatf"\s*>([\s\S]*)$/i.exec(ohneTitel);
  if (!kopfM) return null;
  const kopfRoh = kopfM[1].split(/<div class="paratf"\s*>/i)[0];
  const kopf = inlineZuText(kopfRoh);
  if (!kopf) return null;
  // Absätze = jeder <div class="paratf"> … </div> (nur der erste </div> schliesst
  // ihn; im clir sind paratf nicht weiter verschachtelt).
  const absaetze: string[] = [];
  const abs = /<div class="paratf"\s*>([\s\S]*?)<\/div>/gi;
  for (let m; (m = abs.exec(ohneTitel)); ) {
    const t = inlineZuText(m[1]);
    if (t) absaetze.push(t);
  }
  return { label, kopf, absaetze };
}

/**
 * Urteilskopf der DE-clir-Seite → eigenes aza-Aktenzeichen + echtes Urteilsdatum.
 * AMTLICHE Quelle der aza↔BGE-Bindung (Befund Gegenprüfung 12.7.2026: OCLs
 * `docket_number_2` ist vereinzelt falsch — BGE 146 II 304 trägt dort das in den
 * Erwägungen nur ZITIERTE 1C_345/2014; der clir-Urteilskopf nennt strukturell das
 * eigene Az. «1C_22/2019 / 1C_476/2019 vom 6. April 2020» direkt vor «Regeste»).
 * Bei verbundenen Verfahren wird das ERSTE Az. genommen (Leiturteil, gleiche
 * Konvention wie azaAusBgeKopf). Rein (netzfrei) → unit-testbar.
 */
export function parseClirUrteilskopf(html: string): { aza: string | null; datumIso: string | null } {
  const i = html.indexOf('Urteilskopf');
  if (i < 0) return { aza: null, datumIso: null };
  // Segment bis «Regeste» (dort beginnt der Regesten-Block), höchstens 2500 Z.
  let seg = html.slice(i, i + 2500);
  const r = seg.indexOf('Regeste');
  if (r > 0) seg = seg.slice(0, r);
  const text = inlineZuText(seg);
  // Eigenfall-Signatur: «<Az.>( / <Az.>)* vom|du|del <T>(.|er|°) <Monat> <JJJJ>» —
  // der Urteilskopf steht auch auf der DE-Seite in der VERFAHRENSSPRACHE
  // («Extrait de l'arrêt … 4A_606/2020 du 1er septembre 2021»).
  const m = /(\d[A-Z][._ ]\d+\/\d{4})(?:\s*\/\s*\d[A-Z][._ ]\d+\/\d{4})*\s+(?:vom|du|del|dell['’])\s*(\d{1,2})(?:\.|er|°)?\s*([A-Za-zàâéèêôûäöüÀÂÉ]+)\s+(\d{4})/.exec(text);
  if (!m) return { aza: null, datumIso: null };
  const MONATE: Record<string, string> = {
    // de
    januar: '01', februar: '02', 'märz': '03', april: '04', mai: '05', juni: '06',
    juli: '07', august: '08', september: '09', oktober: '10', november: '11', dezember: '12',
    // fr
    janvier: '01', 'février': '02', mars: '03', avril: '04', juin: '06',
    juillet: '07', 'août': '08', septembre: '09', octobre: '10', novembre: '11', 'décembre': '12',
    // it
    gennaio: '01', febbraio: '02', marzo: '03', aprile: '04', maggio: '05', giugno: '06',
    luglio: '07', agosto: '08', settembre: '09', ottobre: '10', dicembre: '12',
  };
  const mm = MONATE[m[3].toLowerCase()];
  const datumIso = mm ? `${m[4]}-${mm}-${m[2].padStart(2, '0')}` : null;
  return { aza: m[1].replace(/^(\d[A-Z])[._ ]/, '$1_'), datumIso };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Ausfall-Buchhaltung je Prozess (kein stilles Schlucken, Anlass #1099) ──
// Zählt Netz-Abrufe (Cache-Treffer nicht) und endgültig gescheiterte Abrufe
// samt Grund. Beim Prozessende steht EINE Summenzeile auf stderr, sobald ≥ 1
// Abruf scheiterte — der aufrufende Generator muss dafür nichts tun.
const statistik = { abrufe: 0, ausfaelle: 0, gruende: new Map<string, number>() };
let exitHookGesetzt = false;

/** Summenzeile `[clir] AUSFALL: …` oder null, solange kein Abruf scheiterte. */
export function clirAusfallZeile(): string | null {
  if (statistik.ausfaelle === 0) return null;
  const gruende = [...statistik.gruende].map(([g, n]) => `${g} ×${n}`).join('; ');
  return `[clir] AUSFALL: ${statistik.ausfaelle} von ${statistik.abrufe} Abrufen fehlgeschlagen (${gruende})`;
}

/** Nur für Tests: Buchhaltung zurücksetzen. */
export function clirStatistikZuruecksetzen(): void {
  statistik.abrufe = 0; statistik.ausfaelle = 0; statistik.gruende.clear();
}

function exitHookSetzen(): void {
  if (exitHookGesetzt) return;
  exitHookGesetzt = true;
  // 'exit' feuert bei natürlichem Ende UND bei process.exit(); writeSync, weil
  // im exit-Handler keine asynchrone Ausgabe mehr abläuft.
  process.once('exit', () => {
    const zeile = clirAusfallZeile();
    if (zeile) { try { writeSync(2, zeile + '\n'); } catch { /* stderr zu */ } }
  });
}

function fehlerGrund(e: unknown): string {
  const err = e as { name?: string; code?: string; cause?: { code?: string } };
  if (err?.name === 'AbortError') return 'Timeout';
  return err?.cause?.code ?? err?.code ?? err?.name ?? 'Netzfehler';
}

/**
 * Holt EINE clir-Sprachfassung (mit Datei-Cache; Re-Parse ohne Re-Crawl).
 * iso-8859-1-Dekodierung. Höflich: identifizierender UA, Timeout, Retry, Drossel.
 * Abruf über `clirKandidaten()` (search.bger.ch, dann www.bger.ch): je Runde
 * jeder Host einmal, Ausweichen bei Netz-/TLS-Fehler oder Status ≥ 500 (auch
 * sonstiges !ok); 404 = Dokument fehlt ⇒ sofort null, KEIN Ausweichen.
 * Rückgabe: das rohe HTML (oder null bei hartem Fehler/404). Harte Fehler
 * zählen in die Summenzeile (`clirAusfallZeile`).
 */
export async function holeClirHtml(
  clirId: string, sprache: EntscheidSprache, cacheDir: string, drosselMs = 500,
  opt: { backoffMs?: number } = {},
): Promise<string | null> {
  const cacheDatei = path.join(cacheDir, `${clirId}_${sprache}.html`);
  try { return await fs.readFile(cacheDatei, 'utf8'); } catch { /* nicht gecacht */ }
  exitHookSetzen();
  statistik.abrufe++;
  const backoff = opt.backoffMs ?? 800;
  const urls = clirKandidaten(clirId, sprache);
  const letzte: string[] = [];
  for (let i = 0; i < 3; i++) {
    letzte.length = 0;
    for (const url of urls) {
      const host = new URL(url).host;
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), 45000);
      try {
        const res = await fetch(url, { signal: ac.signal, headers: { 'User-Agent': RECHTSPRECHUNG_UA }, redirect: 'follow' });
        clearTimeout(t);
        if (res.status === 404) return null;
        if (!res.ok) { letzte.push(`${host}: HTTP ${res.status}`); continue; }
        const buf = new Uint8Array(await res.arrayBuffer());
        const html = new TextDecoder('iso-8859-1').decode(buf);
        await fs.mkdir(cacheDir, { recursive: true });
        await fs.writeFile(cacheDatei, html, 'utf8');
        await sleep(drosselMs);   // Netz höflich
        return html;
      } catch (e) { clearTimeout(t); letzte.push(`${host}: ${fehlerGrund(e)}`); }
    }
    if (i < 2) await sleep(backoff * (i + 1));
  }
  statistik.ausfaelle++;
  for (const g of letzte) statistik.gruende.set(g, (statistik.gruende.get(g) ?? 0) + 1);
  return null;
}

/**
 * Alle vorhandenen Sprachfassungen einer BGE-Regeste holen + parsen, sortiert
 * DE→FR→IT (A18). Nur Sprachfassungen, die die Quelle STRUKTURELL hergibt (§1:
 * fehlende/uneindeutige werden weggelassen — nie geraten). Der Aufrufer verknüpft
 * die amtliche `quelleUrl` je Fassung.
 */
export const SPRACH_ORDNUNG: EntscheidSprache[] = ['de', 'fr', 'it'];

export interface RegesteSprachfassungMitUrl extends RegesteSprachfassungRoh {
  quelleUrl: string;
}

export async function holeRegesteSprachfassungen(
  bgeRef: string, cacheDir: string, drosselMs = 500,
): Promise<RegesteSprachfassungMitUrl[]> {
  const clirId = bgeRefZuClirId(bgeRef);
  if (!clirId) return [];
  const out: RegesteSprachfassungMitUrl[] = [];
  for (const spr of SPRACH_ORDNUNG) {
    const html = await holeClirHtml(clirId, spr, cacheDir, drosselMs);
    if (!html) continue;
    const parsed = parseClirRegeste(html);
    if (!parsed) continue;
    const f: RegesteSprachfassungMitUrl = {
      sprache: parsed.sprache, kopf: parsed.kopf, absaetze: parsed.absaetze, quelleUrl: clirUrl(clirId, spr),
    };
    if (parsed.weitereRegesten) f.weitereRegesten = parsed.weitereRegesten;
    out.push(f);
  }
  return out;
}
