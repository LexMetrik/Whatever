// scripts/materialien/adapter-seco.ts
// E6a Stufe 1 · Etappe M2 (FAHRPLAN-MATERIALIEN-VERZAHNUNG §3 Q2): Adapter SECO-Wegleitungen
// ArG / ArGV 1. Browserlos (§7 Build-Regel 5/6). Netz-Hülle (crawleSeco) GETRENNT von den
// PUR-testbaren Extraktionsfunktionen (Muster adapter-lexwork.ts).
//
// PRIMÄRQUELLE (live-verifiziert 3.7.2026): das server-gerenderte SSR-HTML der Hub-Seiten
//   https://www.seco.admin.ch/de/arbeitsgesetz        (ArG)   — download-item-Anker
//   https://www.seco.admin.ch/de/wegleitung-argv-1     (ArGV 1)
// Jeder Artikel = 1 <a class="download-item" href="…/dam/de/sd-web/<TOKEN>/<Dateiname>.pdf">
//   mit <h4 class="download-item__title">…</h4> + <span class="meta-info__item">3. Februar 2012</span>.
// Deterministisch ohne Headless-Browser parsebar; der Nuxt-Payload ist nur Zweitsignal.
//
// Scraping-Fallen (Skill scraping-swiss-official-sources, live bestätigt):
//  · Erfolg NIE am HTTP-Status festmachen — Content-Type prüfen (Soft-404-Shell trotz 200).
//  · Datumslabel VERBATIM übernehmen, deterministisch nach ISO mappen (deutsche Monatsnamen).
//  · Typografie im Titel VERBATIM (keine ASCII-Faltung).
//  · DAM-<TOKEN> in der URL ist VOLATIL → gehört in quell_ids, NIE in die Dokument-ID (§2.6).
//  · Artikelnummer deterministisch aus dem DATEINAMEN, nicht aus dem Titel.
//
// robots.txt von www.seco.admin.ch ist offen (Quell-Inventar §5). Trotzdem höflich:
// Concurrency ≤ 2 (hier: 2 sequentielle Hub-GETs), kleiner Delay, identifizierender User-Agent.

import { createHash } from 'node:crypto';
import { fetchMitWiederholung } from '../normtext/netz-retry.ts';
import { dekodiereEntities } from '../normtext/html-entities.ts';
import { normalisiereZitat } from '../datenhaltung/normalisiere-zitat.ts';

export const SECO_USER_AGENT = 'LexMetrik-Materialien/1.0 (+https://lexmetrik.vercel.app)';

/** Die zwei Hub-Seiten der M2-Etappe (ArGV 2–5 folgen im selben Adapter, sobald geprobt). */
export interface SecoQuelleDef {
  /** interner Schlüssel des Erlasses. */
  erlassKey: 'ARG' | 'ARGV1';
  /** ID-Infix (GROSS, pfadsicher). */
  idInfix: 'ARG' | 'ARGV1';
  /** amtliche Hub-URL. */
  hubUrl: string;
  /** Präfix für den ID-Prefix-Test (Entlistungs-Scope). */
  idPrefix: string;
  /** ISO-Rang-Basis der DB-Dokumente (SECO-Behörde; nach den 5 kuratierten SECO-Karten). */
  rangBasis: number;
}

export const SECO_QUELLEN: readonly SecoQuelleDef[] = [
  { erlassKey: 'ARG', idInfix: 'ARG', hubUrl: 'https://www.seco.admin.ch/de/arbeitsgesetz', idPrefix: 'SECO-WL-ARG-ART-', rangBasis: 1000 },
  { erlassKey: 'ARGV1', idInfix: 'ARGV1', hubUrl: 'https://www.seco.admin.ch/de/wegleitung-argv-1', idPrefix: 'SECO-WL-ARGV1-ART-', rangBasis: 2000 },
];

/** Untere Count-Gate-Schwelle je Quelle (§3 Q2). */
export const SECO_COUNT_MIN = 60;

// ── Extrahierter Roh-Download (rein aus dem HTML) ──────────────────────────────
export interface RohDownload {
  href: string;
  titel: string;
  datumLabel: string;
  dateiname: string;
}

// ── Adapter-Ergebnis-Typen (Ergebnisvertrag §3) ────────────────────────────────
/** Ein Dokument, §7-a–d-fähig; trägt alle Karten-Felder für Browse (§0/B6) + JSONL-Rekonstruktion. */
export interface SoftLawDok {
  id: string;
  behoerde: 'SECO';
  doktyp: 'wegleitung';
  titel: string;
  nummer: string; // 'Art. N'
  // Literal-eng (dieser Adapter kennt nur SECO). Der Wert MUSS zu
  // BEHOERDE_RECHTSGEBIET.SECO in adapter-typen.ts passen — das Tor in
  // materialien-register.test.ts prüft das am ausgelieferten Bestand (F5).
  rechtsgebiet: 'oeffentlich';
  sprache: 'de';
  rang: number;
  normKeys: string[];
  hinweis: string | null;
  quelle_url: string; // kanonische DAM-PDF-URL (§7 b)
  stand: string; // ISO, PER ARTIKEL (§7 a)
  stand_quelle: 'hub-label';
  abgerufen: string;
  drift_token: string; // Hash über (dateiname + datumslabel + url) — Insert MUSS liefern (§0/A8)
  quell_ids: { dam_token: string; url_basis: string };
  sha: string; // Provenienz-Hash über Identitätsfelder
}

/** Eine artikelscharfe Norm-Referenz-Kante (soft_law → Erlass-Artikel). */
export interface SecoKante {
  quelldok_id: string;
  erlass_key: string;
  artikel: string; // Korpus-Token-Format ('3_a'); '' nur bei Downgrade (hier nie)
  zitat_key: string;
  roh_zitat: string; // Dateiname (Audit)
  konfidenz: 'regex-hoch';
  quelle: 'amtlich';
  fundstelle: '';
  fundstelle_url: null;
  stand: string;
  abgerufen: string;
}

export interface SecoErgebnis {
  dokumente: SoftLawDok[];
  kanten: SecoKante[];
  indexSha: string;
  abgerufen: string;
}

// ══ Reine Extraktionsfunktionen ══════════════════════════════════════════════

const MONATE: Record<string, string> = {
  Januar: '01', Februar: '02', März: '03', April: '04', Mai: '05', Juni: '06',
  Juli: '07', August: '08', September: '09', Oktober: '10', November: '11', Dezember: '12',
};

/** Deutsches Datumslabel «3. Februar 2012» → ISO «2012-02-03». Wirft bei Unbekanntem (§8). */
export function datumslabelNachIso(label: string): string {
  const m = /^(\d{1,2})\.\s+([A-Za-zÄÖÜäöüß]+)\s+(\d{4})$/.exec(label.trim());
  if (!m) throw new Error(`adapter-seco: unparsbares Datumslabel «${label}».`);
  const monat = MONATE[m[2]];
  if (!monat) throw new Error(`adapter-seco: unbekannter Monatsname «${m[2]}» in «${label}».`);
  return `${m[3]}-${monat}-${m[1].padStart(2, '0')}`;
}

/**
 * Zerlegt einen Anker-Block (das innere HTML EINES <a class="download-item">) in Titel, Datumslabel.
 * Der href kommt separat aus dem Anker-Tag. Gibt null zurück, wenn Titel/Datum fehlen.
 */
export function parseAnkerInhalt(inner: string): { titel: string; datumLabel: string } | null {
  const t = /<h4[^>]*class="[^"]*download-item__title[^"]*"[^>]*>([\s\S]*?)<\/h4>/.exec(inner);
  if (!t) return null;
  const titel = dekodiereEntities(t[1].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
  // Datumslabel = das meta-info__item, das dem deutschen Datumsmuster entspricht (robust gegen
  // die Reihenfolge PDF · Grösse · Datum).
  let datumLabel = '';
  for (const s of inner.matchAll(/<span class="meta-info__item">([^<]*)<\/span>/g)) {
    const v = dekodiereEntities(s[1]).trim();
    if (/^\d{1,2}\.\s+[A-Za-zÄÖÜäöüß]+\s+\d{4}$/.test(v)) { datumLabel = v; break; }
  }
  if (!datumLabel) return null;
  return { titel, datumLabel };
}

/**
 * Extrahiert alle download-item-Anker aus dem SSR-HTML. Rein; keine Netz-/Zeit-Abhängigkeit.
 * Filtert NICHT auf Artikel-Dateinamen — das macht der Aufrufer (Regex-Klassifikation).
 */
export function parseDownloadItems(html: string): RohDownload[] {
  const out: RohDownload[] = [];
  const re = /<a class="download-item"[^>]*?href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  for (const m of html.matchAll(re)) {
    const href = dekodiereEntities(m[1]).trim();
    const inhalt = parseAnkerInhalt(m[2]);
    if (!inhalt) continue;
    const dateiname = href.split('/').pop() ?? '';
    out.push({ href, titel: inhalt.titel, datumLabel: inhalt.datumLabel, dateiname });
  }
  return out;
}

/**
 * Artikelnummer + Erlass DETERMINISTISCH aus dem Dateinamen (nicht aus dem Titel, §3 Q2).
 * Deckt alle live beobachteten Muster (3.7.2026):
 *   ArG-Artikel-01-SECO-AB-2012-DE.pdf        ArGV1-Artikel-01-SECO-AB-2012-DE.pdf
 *   ArGV1_art02_de.pdf   ArGV1_Art32a_de.pdf   ArGV1-Art60-SECO-AB-2025-DE.pdf
 * Buchstaben-Suffix (a–z) wird MITGENOMMEN. Gibt null zurück, wenn kein Artikel-PDF.
 */
export function artikelAusDateiname(dateiname: string): { erlass: 'ARG' | 'ARGV1'; num: string; suffix: string } | null {
  // ArGV1 zuerst prüfen (ArGV1 startet mit «ArG»).
  const m = /^(ArGV1|ArG)[-_](?:Artikel|Art)[-_]?0*(\d+)([a-z]?)(?=[-_.])/i.exec(dateiname);
  if (!m) return null;
  const erlass = /^ArGV1/i.test(m[1]) ? 'ARGV1' : 'ARG';
  return { erlass, num: m[2], suffix: m[3].toLowerCase() };
}

/** SECO-Artikel (num,suffix) → Normtext-Korpus-Token: «3»,«a» → «3_a»; «9»,«» → «9». */
export function korpusToken(num: string, suffix: string): string {
  return suffix ? `${num}_${suffix}` : num;
}

/** Anzeige-Nummer «Art. 3a» / «Art. 9». */
export function anzeigeNummer(num: string, suffix: string): string {
  return `Art. ${num}${suffix}`;
}

/** Dokument-ID (pfadsicher, GROSS): SECO-WL-ARG-ART-3A / SECO-WL-ARGV1-ART-32A. */
export function dokId(idInfix: 'ARG' | 'ARGV1', num: string, suffix: string): string {
  return `SECO-WL-${idInfix}-ART-${num}${suffix.toUpperCase()}`;
}

/** ISO-Rang: rangBasis + num*10 + Buchstaben-Offset (a=1…) → 3 < 3a < 4, kollisionsfrei. */
export function dokRang(rangBasis: number, num: string, suffix: string): number {
  const off = suffix ? suffix.charCodeAt(0) - 96 : 0;
  return rangBasis + parseInt(num, 10) * 10 + off;
}

/** DAM-<TOKEN> aus der URL (volatil; nur in quell_ids). */
export function damTokenAusUrl(url: string): string {
  const m = /\/dam\/[a-z]{2}\/sd-web\/([^/]+)\//.exec(url);
  return m ? m[1] : '';
}

/** Drift-Token = sha256/16 über (dateiname + datumslabel + url) — kein Default (§0/A8). */
export function driftToken(dateiname: string, datumLabel: string, url: string): string {
  return createHash('sha256').update(`${dateiname}\u0000${datumLabel}\u0000${url}`, 'utf8').digest('hex').slice(0, 16);
}

const HINWEIS_SECO = 'Amtliche SECO-Wegleitung, artikelscharf verlinkt.';

/** Baut aus einem Roh-Download + Quelle-Definition ein Dokument + seine Kante (rein). */
export function baueDokUndKante(
  roh: RohDownload,
  def: SecoQuelleDef,
  art: { num: string; suffix: string },
  abgerufen: string,
): { dok: SoftLawDok; kante: SecoKante } {
  const id = dokId(def.idInfix, art.num, art.suffix);
  const stand = datumslabelNachIso(roh.datumLabel);
  const token = korpusToken(art.num, art.suffix);
  const shaId = createHash('sha256')
    .update([id, roh.titel, roh.href, stand, def.erlassKey, token].join('\u0000'), 'utf8')
    .digest('hex');
  const dok: SoftLawDok = {
    id,
    behoerde: 'SECO',
    doktyp: 'wegleitung',
    titel: roh.titel,
    nummer: anzeigeNummer(art.num, art.suffix),
    rechtsgebiet: 'oeffentlich',
    sprache: 'de',
    rang: dokRang(def.rangBasis, art.num, art.suffix),
    normKeys: [def.erlassKey],
    hinweis: HINWEIS_SECO,
    quelle_url: roh.href,
    stand,
    stand_quelle: 'hub-label',
    abgerufen,
    drift_token: driftToken(roh.dateiname, roh.datumLabel, roh.href),
    quell_ids: { dam_token: damTokenAusUrl(roh.href), url_basis: roh.href },
    sha: shaId,
  };
  const kante: SecoKante = {
    quelldok_id: id,
    erlass_key: def.erlassKey,
    artikel: token,
    zitat_key: normalisiereZitat(`${def.erlassKey} Art. ${art.num}${art.suffix}`),
    roh_zitat: roh.dateiname,
    konfidenz: 'regex-hoch',
    quelle: 'amtlich',
    fundstelle: '',
    fundstelle_url: null,
    stand,
    abgerufen,
  };
  return { dok, kante };
}

// ══ Vollständigkeits-Gate (§0/A14, §3 Q2) ════════════════════════════════════
// Korpus-Artikelbestand (nur einzelne, nummerierte Artikel: /^\d+(_[a-z])?$/ — Bereichs-/
// Anhang-Token wie ARG «67_70», ARGV1 «47_59»/«annex_u1» sind KEINE Einzelartikel und zählen
// nicht) MINUS die begründete Ausnahmeliste == PDF-Menge. Neue unerklärte Lücke ⇒ ROT.
//
// AUSNAHMEN empirisch erhoben am 3.7.2026 (erster Live-Crawl, gegen public/normtext/bund/*.json):
// jede Zeile = Korpus-Artikel OHNE SECO-Einzel-Kommentar-PDF, mit Grund. «aufgehoben/verschoben»
// = Korpus führt den Artikel als «…»-Platzhalter (aufgehoben oder in anderen Artikel verschoben);
// «Schluss-/Übergangsbestimmung» = SECO kommentiert Aufhebungs-/Inkrafttretens-Artikel nicht.

export interface Ausnahme {
  artikel: string; // Korpus-Token
  datum: string; // Erhebungsdatum
  grund: string;
}

const A = (artikel: string, grund: string): Ausnahme => ({ artikel, datum: '2026-07-03', grund });

export const AUSNAHMEN_ARG: readonly Ausnahme[] = [
  A('14', 'im Korpus «…» (aufgehoben/verschoben) — keine SECO-Kommentierung'),
  A('23', 'im Korpus «…» (aufgehoben/verschoben) — keine SECO-Kommentierung'),
  A('33', 'im Korpus «…» (aufgehoben/verschoben) — keine SECO-Kommentierung'),
  A('55', 'im Korpus «…» (aufgehoben/verschoben) — keine SECO-Kommentierung'),
  A('57', 'im Korpus «…» (aufgehoben/verschoben) — keine SECO-Kommentierung'),
  A('63', 'im Korpus «…» (aufgehoben/verschoben) — keine SECO-Kommentierung'),
  A('65', 'im Korpus «…» (aufgehoben/verschoben) — keine SECO-Kommentierung'),
  A('66', 'im Korpus «…» (aufgehoben/verschoben) — keine SECO-Kommentierung'),
  A('72', 'Aufhebungsbestimmung (aufgehobene Bundesgesetze) — SECO kommentiert nicht'),
  A('73', 'Aufhebungsbestimmung — SECO kommentiert nicht'),
  A('74', 'Schlussbestimmung (Inkrafttreten) — SECO kommentiert nicht'),
];

export const AUSNAHMEN_ARGV1: readonly Ausnahme[] = [
  A('3', 'im Korpus «…» (aufgehoben/verschoben) — keine SECO-Kommentierung'),
  A('76', 'im Korpus «…» (aufgehoben/verschoben) — keine SECO-Kommentierung'),
  A('91', 'Aufhebungsbestimmung (ArGV 1 von 1966) — SECO kommentiert nicht'),
  A('92', 'Übergangsbestimmung (Arbeitszeitbewilligungen) — SECO kommentiert nicht'),
  A('93', 'im Korpus «…» (aufgehoben/verschoben) — keine SECO-Kommentierung'),
  A('94', 'Schlussbestimmung (Inkrafttreten) — SECO kommentiert nicht'),
];

export function ausnahmenVon(erlassKey: 'ARG' | 'ARGV1'): readonly Ausnahme[] {
  return erlassKey === 'ARG' ? AUSNAHMEN_ARG : AUSNAHMEN_ARGV1;
}

/** Einzelartikel-Token des Korpus (Bereichs-/Anhang-Token ausgeschlossen). */
export function einzelArtikel(korpusTokens: Iterable<string>): Set<string> {
  const out = new Set<string>();
  for (const t of korpusTokens) if (/^\d+(_[a-z])?$/.test(t)) out.add(t);
  return out;
}

export interface VollstaendigkeitsBefund {
  ok: boolean;
  fehlendImPdf: string[]; // erwartet (Korpus−Ausnahmen), aber kein PDF ⇒ neue Lücke ⇒ ROT
  ueberzaehligImPdf: string[]; // PDF vorhanden, aber weder Korpus-erwartet noch begründete Ausnahme
  ausnahmeMitPdf: string[]; // als Ausnahme geführt, aber JETZT als PDF da ⇒ Ausnahme streichen
}

/**
 * Vollständigkeits-Gate (rein): (Einzelartikel-Korpus − Ausnahmen) == PDF-Menge.
 * @param korpusTokens alle Artikel-Token des Erlasses aus dem Normtext-Korpus.
 * @param pdfTokens Korpus-Token der tatsächlich gefundenen SECO-PDFs.
 */
export function vollstaendigkeitsGate(
  erlassKey: 'ARG' | 'ARGV1',
  korpusTokens: Iterable<string>,
  pdfTokens: Iterable<string>,
): VollstaendigkeitsBefund {
  const korpus = einzelArtikel(korpusTokens);
  const pdf = new Set(pdfTokens);
  const ausnahmen = new Set(ausnahmenVon(erlassKey).map((a) => a.artikel));
  const erwartet = new Set([...korpus].filter((t) => !ausnahmen.has(t)));
  const fehlendImPdf = [...erwartet].filter((t) => !pdf.has(t)).sort(vglToken);
  const ueberzaehligImPdf = [...pdf].filter((t) => !erwartet.has(t) && !ausnahmen.has(t)).sort(vglToken);
  const ausnahmeMitPdf = [...ausnahmen].filter((t) => pdf.has(t)).sort(vglToken);
  return {
    ok: fehlendImPdf.length === 0 && ueberzaehligImPdf.length === 0 && ausnahmeMitPdf.length === 0,
    fehlendImPdf,
    ueberzaehligImPdf,
    ausnahmeMitPdf,
  };
}

function vglToken(a: string, b: string): number {
  const na = parseInt(a, 10);
  const nb = parseInt(b, 10);
  return na - nb || (a < b ? -1 : a > b ? 1 : 0);
}

// ══ Netz-Hülle ═══════════════════════════════════════════════════════════════

/** Höflicher GET einer Hub-Seite: prüft Content-Type (Soft-404-Erkennung, §Skill). */
export async function ladeHub(url: string, fetchImpl?: typeof fetch): Promise<string> {
  const res = await fetchMitWiederholung(url, { headers: { 'User-Agent': SECO_USER_AGENT, Accept: 'text/html' } }, { fetchImpl });
  const ct = res.headers.get('content-type') ?? '';
  if (!res.ok) throw new Error(`adapter-seco: ${url} HTTP ${res.status}.`);
  if (!/text\/html/i.test(ct)) throw new Error(`adapter-seco: ${url} kein text/html (Content-Type «${ct}») — Soft-404-Verdacht.`);
  const html = await res.text();
  if (html.length < 5000) throw new Error(`adapter-seco: ${url} verdächtig kurz (${html.length} B) — Shell?`);
  return html;
}

/** Extrahiert das <main>-Substrat (Snapshot-Belegkern, §2.2); Fallback = volles HTML. */
export function mainSubstrat(html: string): string {
  const m = /<main[\s\S]*?<\/main>/i.exec(html);
  return m ? m[0] : html;
}

export interface CrawlOptionen {
  abgerufen: string; // ISO (kein Date.now, §2)
  fetchImpl?: typeof fetch;
  /** Delay-Hook zwischen Hub-GETs (Default 400 ms echt; in Tests injizierbar). */
  warte?: (ms: number) => Promise<void>;
  /** Roh-Substrat je Quelle einsammeln (für quell_snapshot). */
  substrat?: (erlassKey: string, html: string) => void;
}

/**
 * Baut aus einem geladenen Hub-HTML die Dokumente + Kanten EINER Quelle (rein bis auf das HTML).
 * Führt das Count-Gate + Vollständigkeits-Gate; wirft bei ROT (§8: kein stiller Teil-Snapshot).
 */
export function verarbeiteHub(
  html: string,
  def: SecoQuelleDef,
  korpusTokens: Iterable<string>,
  abgerufen: string,
): { dokumente: SoftLawDok[]; kanten: SecoKante[] } {
  const items = parseDownloadItems(html);
  const dokumente: SoftLawDok[] = [];
  const kanten: SecoKante[] = [];
  const gesehen = new Set<string>();
  for (const roh of items) {
    const art = artikelAusDateiname(roh.dateiname);
    if (!art || art.erlass !== def.erlassKey) continue;
    const id = dokId(def.idInfix, art.num, art.suffix);
    if (gesehen.has(id)) continue; // Doppel-Listung ⇒ ein Dokument
    gesehen.add(id);
    const { dok, kante } = baueDokUndKante(roh, def, art, abgerufen);
    dokumente.push(dok);
    kanten.push(kante);
  }
  if (dokumente.length < SECO_COUNT_MIN) {
    throw new Error(`adapter-seco: ${def.erlassKey} nur ${dokumente.length} Artikel-PDFs (< ${SECO_COUNT_MIN}) — Quell-Bruch? Snapshot NICHT schreiben.`);
  }
  const pdfTokens = kanten.map((k) => k.artikel);
  const vb = vollstaendigkeitsGate(def.erlassKey, korpusTokens, pdfTokens);
  if (!vb.ok) {
    throw new Error(
      `adapter-seco: Vollständigkeits-Gate ${def.erlassKey} ROT — ` +
        `fehlend im PDF: [${vb.fehlendImPdf.join(', ')}] · überzählig: [${vb.ueberzaehligImPdf.join(', ')}] · ` +
        `Ausnahme jetzt mit PDF: [${vb.ausnahmeMitPdf.join(', ')}]. Ausnahmeliste kuratieren (§0/A14).`,
    );
  }
  return { dokumente, kanten };
}

/**
 * Voll-Crawl beider SECO-Quellen (höflich, sequentiell). Ergebnisvertrag §3:
 * { dokumente, kanten, indexSha, abgerufen }. indexSha = sha256/16 über die sortierte
 * (id → drift_token)-Menge (deterministischer Index-Fingerabdruck).
 */
export async function crawleSeco(
  korpusFuer: (erlassKey: string) => Iterable<string>,
  opt: CrawlOptionen,
): Promise<SecoErgebnis> {
  const warte = opt.warte ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const dokumente: SoftLawDok[] = [];
  const kanten: SecoKante[] = [];
  let erste = true;
  for (const def of SECO_QUELLEN) {
    if (!erste) await warte(400);
    erste = false;
    const html = await ladeHub(def.hubUrl, opt.fetchImpl);
    opt.substrat?.(def.erlassKey, mainSubstrat(html));
    const teil = verarbeiteHub(html, def, korpusFuer(def.erlassKey), opt.abgerufen);
    dokumente.push(...teil.dokumente);
    kanten.push(...teil.kanten);
  }
  const idx = [...dokumente].map((d) => `${d.id}=${d.drift_token}`).sort().join('\n');
  const indexSha = createHash('sha256').update(idx, 'utf8').digest('hex').slice(0, 16);
  return { dokumente, kanten, indexSha, abgerufen: opt.abgerufen };
}
