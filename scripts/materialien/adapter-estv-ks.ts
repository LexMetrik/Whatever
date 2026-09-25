// scripts/materialien/adapter-estv-ks.ts
// E6a Stufe 1 · Etappe M4 (FAHRPLAN-MATERIALIEN-VERZAHNUNG §3 Q4): Adapter ESTV-Kreisschreiben
// DBSt / Verrechnungssteuer / Stempelabgaben. Browserlos (§7 Build-Regel 5/6). Netz-Hülle
// (crawleEstvKs) GETRENNT von den PUR-testbaren Extraktionsfunktionen (Muster adapter-seco/-edoeb).
//
// PRIMÄRQUELLE (live-verifiziert 4.7.2026): die drei server-gerenderten SSR-Indexseiten
//   https://www.estv.admin.ch/de/kreisschreiben-direkten-bundessteuer   (dbst, ~77 PDF)
//   https://www.estv.admin.ch/de/kreisschreiben-verrechnungssteuer      (vst,  ~32 PDF)
//   https://www.estv.admin.ch/de/kreisschreiben-stempelabgaben          (stempel, ~14 PDF)
// Jedes Dokument = <a class="download-item" href="…/dam/de/sd-web/<TOKEN>/<Dateiname>.pdf"> mit
// <h4 class="download-item__title">, optional <p class="download-item__description">, und
// <span class="meta-info__item">-Datumslabel. DEDUPE per URL (§3 Q4: Quer-Listung dv/dvs-Dokumente
// auf mehreren Indexseiten = EIN Dokument, Mehrfach-Kanten).
//
// GESETZ-ZUORDNUNG — Suffix-Kaskade (§3 Q4, ehrlich je Stufe):
//  1. STEUERART-SUFFIX im Dateinamen (d/v/s/dv/ds/vs/dvs, POSITIONsgebunden direkt nach dem
//     KS-Nummernblock `dbst-ks-JJJJ-S-NNN[a]-<ART>` bzw. `estv-mitteilung-NNN-<ART>`):
//     d→DBG, v→VSTG, s→STG — amtliche Dateinamen-Systematik ⇒ quelle='amtlich'.
//     ACHTUNG Positionsbindung: `vst-mb-s-02-122-1b.pdf` trägt ein `s` als SERIEN-Kürzel
//     (Merkblatt S-02.122), NICHT als Steuerart — ein naiver Token-Match wäre falsch.
//  2. BESCHREIBUNG (download-item__description) nennt die Steuer explizit («direkte
//     Bundessteuer»/«Verrechnungssteuer»/«Stempelabgabe») ⇒ quelle='amtlich'.
//  3. SEITEN-KONTEXT (Indexseite dbst→DBG, vst→VSTG, stempel→STG) ⇒ **quelle='maschinell'**
//     (Heuristik, ehrlich deklariert, §0/A3; UI badgt Abweichungen von 'amtlich' in M5).
// Artikelscharf zusätzlich, wo der amtliche TITEL den Artikel nennt (artikelAusTitel, wie M3;
// DBG/VStG/StG sind 'kein-cutoff' §2.4 — kein Revisions-Downgrade, Korpus-Existenz-Check bleibt).
//
// IDs (§2.6, aus der amtlichen Nummern-/Dateinamen-Systematik, NIE aus dem DAM-Token):
//   KS regulär:  ESTV-KS-DBG-50A / ESTV-KS-VSTG-30 / ESTV-KS-STG-12  (primäre Steuerart =
//                erster Suffix-Buchstabe; deckungsgleich mit den kuratierten Registerkeys)
//   KS-Beilagen: ESTV-KS-DBG-45-ANHANG1-1 / …-FAQ / …-SCHEMA / …-FRAGEBOGEN
//   W-Serie:     ESTV-KS-W95-002 (alte Weisungen, Dateiname `dbst-ks-wNN-NNN[-JJJJ]`)
//   Mitteilung:  ESTV-MITTEILUNG-020-DVS-CHECKLISTE · Merkblatt-Beilage: ESTV-MB-S-02-122-1B
// BESTEHENDER KEY GEWINNT (§2.6): vier KS sind bereits kuratiert im MATERIAL_REGISTER
// (ESTV-KS-DBG-5A/-6A/-32A/-37) — der Adapter ÜBERSPRINGT sie (kuratierter Eintrag bleibt
// massgeblich; Migration + artikelscharfe Kanten = M5-Folge-Posten, gleiche Begründung wie M3:
// die Norm-Kontext-Brücke liest bis M5 nur das in-Bundle-Register, §15).
//
// DRIFT: drift_token je Dokument (sha256/16 über titel+datumslabel+url — der volatile DAM-Token in
// der URL ist das Datei-Versions-Signal); Arbiter in check:materialien-netz = Live-Crawl vs.
// Zustands-Manifest (id→drift_token-Diff). Der spec-seitige Ein-Hash über die sortierte URL-Liste
// (Baseline 3.7.: 6c362ffffd781641, damals 120 Anker/94 URLs — live 4.7.: 123/95, Quelle hat seit
// der POC ein Dokument zugelegt) ist im Manifest-Diff-Arbiter enthalten (jede URL-Änderung kippt
// den drift_token des Dokuments); indexSha je Lauf bleibt der Lauf-Fingerabdruck.
//
// FEHLER-ERKENNUNG NUR über Count-Gates (≥70/≥28/≥12 je Indexseite, vor Dedupe) + Struktur-Probe
// (jede Seite muss download-item__title-Struktur liefern) — §3 Q4.
//
// Scraping-Fallen (Skill scraping-swiss-official-sources): Content-Type-Arbiter statt Status-Code;
// Titel/Beschreibung VERBATIM (auch amtliche Tippfehler wie «Kreischreiben Nr. 12 Schema» — nie
// umschreiben); DAM-Token nie hardcoden.

import { createHash } from 'node:crypto';
import { fetchMitWiederholung } from '../normtext/netz-retry.ts';
import { dekodiereEntities } from '../normtext/html-entities.ts';
import { normalisiereZitat } from '../datenhaltung/normalisiere-zitat.ts';
import { datumslabelNachIso, istDeutschesDatumslabel } from './datum-de.ts';
import { artikelAusTitel } from './adapter-edoeb.ts'; // reine, geteilte Titel-Artikel-Extraktion (M3)
import type { SoftLawDok, NormRefKante, AdapterErgebnis } from './adapter-typen.ts';
import { BEHOERDE_RECHTSGEBIET } from './adapter-typen.ts';
import type { DoktypId } from '../../src/lib/materialien/typen.ts';

export const ESTV_KS_USER_AGENT = 'LexMetrik-Materialien/1.0 (+https://lexmetrik.vercel.app)';

export interface EstvKsSeiteDef {
  tag: 'dbst' | 'vst' | 'stempel';
  indexUrl: string;
  /** Seiten-Kontext-Erlass (Kaskaden-Stufe 3, maschinell). */
  kontextErlass: 'DBG' | 'VSTG' | 'STG';
  /** untere Count-Gate-Schwelle (PDF-Anker VOR Dedupe, §3 Q4). */
  min: number;
}

export const ESTV_KS_SEITEN: readonly EstvKsSeiteDef[] = [
  { tag: 'dbst', indexUrl: 'https://www.estv.admin.ch/de/kreisschreiben-direkten-bundessteuer', kontextErlass: 'DBG', min: 70 },
  { tag: 'vst', indexUrl: 'https://www.estv.admin.ch/de/kreisschreiben-verrechnungssteuer', kontextErlass: 'VSTG', min: 28 },
  { tag: 'stempel', indexUrl: 'https://www.estv.admin.ch/de/kreisschreiben-stempelabgaben', kontextErlass: 'STG', min: 12 },
];

/** Alle ESTV-KS-DB-IDs beginnen mit einem dieser Präfixe (Entlistungs-/Netz-Scope). Die
 *  kuratierten Alt-Einträge ESTV-KS-DBG-5A/-6A/-32A/-37 werden übersprungen und sind NIE im
 *  Zustands-Manifest; die kuratierten ESTV-RS-/ESTV-MWST-Einträge sind nicht Teil dieser Quelle. */
export const ESTV_KS_ID_PREFIXE = ['ESTV-KS-', 'ESTV-MITTEILUNG-', 'ESTV-MB-'] as const;

/** Kuratiert-bekannte KS (§2.6 «bestehender Key gewinnt» → skip; M5-Migrations-Posten). */
export const ESTV_KURIERT_BEKANNT: ReadonlySet<string> = new Set([
  'ESTV-KS-DBG-5A', 'ESTV-KS-DBG-6A', 'ESTV-KS-DBG-32A', 'ESTV-KS-DBG-37',
]);

// ── Roh-Item einer Indexseite ─────────────────────────────────────────────────
export interface RohEstvItem {
  href: string;
  titel: string;
  beschreibung: string; // '' wenn keine
  datumLabel: string;
  dateiname: string; // dekodiert
}

// ══ Reine Extraktionsfunktionen ══════════════════════════════════════════════

/** Steuerart-Buchstaben → Korpus-Erlass-Keys (Reihenfolge d→v→s = kanonisch). */
export function erlasseAusArt(art: string): ('DBG' | 'VSTG' | 'STG')[] {
  const out: ('DBG' | 'VSTG' | 'STG')[] = [];
  if (art.includes('d')) out.push('DBG');
  if (art.includes('v')) out.push('VSTG');
  if (art.includes('s')) out.push('STG');
  return out;
}

const ART_RE = '(dvs|dv|ds|vs|d|v|s)';

/** Zerlegtes Dateinamen-Wissen (null-Felder = Muster griff nicht). */
export interface DateinamenBefund {
  /** 'ks' | 'w' | 'mitteilung' | 'mb' | null (unbekanntes Muster) */
  familie: 'ks' | 'w' | 'mitteilung' | 'mb' | null;
  /** KS-Nummer ohne führende Nullen + Kleinbuchstabe ('50a'); nur familie='ks'. */
  nummer: string | null;
  /** Steuerart-Suffix ('d','dv','dvs' …) POSITIONsgebunden; null = keiner. */
  art: string | null;
  /** Beilagen-Kennung ('anhang1-1','faq','schema','fragebogen'); nur familie='ks'. */
  beilage: string | null;
  /** Stem für W-/Mitteilungs-/MB-IDs ('w95-002', '020-dvs-checkliste', 's-02-122-1b'). */
  stem: string | null;
}

/**
 * Parst den amtlichen Dateinamen POSITIONSGEBUNDEN (§3 Q4). Live-Muster 4.7.2026:
 *   dbst-ks-2020-1-050a-d-de.pdf          → ks, 50a, d
 *   dbst-ks-2020-1-049-dv-de.pdf          → ks, 49, dv
 *   dbst-ks-2019-1-045-d-anhang1-1-de.pdf → ks, 45, d, beilage anhang1-1
 *   dbst-ks-2022-1-045-d-faq-de.pdf       → ks, 45, d, beilage faq
 *   dbst-ks-2011-1-012-s-schema-de.pdf    → ks, 12, s, beilage schema
 *   dbst-ks-2005-1-011-d-fragebogen-de.pdf→ ks, 11, d, beilage fragebogen
 *   dbst-ks-w95-002-de.pdf                → w,  stem w95-002 (kein Steuerart-Suffix)
 *   dbst-ks-w95-003-2024-de.pdf           → w,  stem w95-003-2024
 *   estv-mitteilung-020-dvs-checkliste-de.pdf → mitteilung, art dvs, stem 020-dvs-checkliste
 *   vst-mb-s-02-122-1b-de.pdf             → mb, stem s-02-122-1b (das `s` ist SERIEN-Kürzel!)
 */
export function parseDateiname(dateiname: string): DateinamenBefund {
  const stemVoll = dateiname.replace(/\.pdf$/i, '').replace(/-(de|fr|it)$/i, '');
  let m = new RegExp(`^dbst-ks-(w\\d{2}-\\d{3}(?:-\\d{4})?)$`, 'i').exec(stemVoll);
  if (m) return { familie: 'w', nummer: null, art: null, beilage: null, stem: m[1].toLowerCase() };
  // Standard-Systematik `dbst-ks-JJJJ-S-NNN[a]-ART[-beilage]`; der Serien-Block `-S-` fehlt bei
  // neueren Dateien (live: `dbst-ks-2024-006a-dvs` = das kuratierte KS 6a) → optional.
  m = new RegExp(`^dbst-ks-\\d{4}-(?:\\d+-)?0*(\\d+)([a-z]?)-${ART_RE}(?:-(.+))?$`, 'i').exec(stemVoll);
  if (m) {
    return {
      familie: 'ks',
      nummer: `${m[1]}${m[2].toLowerCase()}`,
      art: m[3].toLowerCase(),
      beilage: m[4] ? m[4].toLowerCase() : null,
      stem: null,
    };
  }
  // Neue 2026er-Systematik `1-NNN[a][-Anhang]-ART-JJJJ` (live: `1-011a-D-2026`,
  // `1-011a-Anhang-D-2026` = KS Nr. 11a + Beilage); Steuerart GROSS.
  m = new RegExp(`^1-0*(\\d+)([a-z]?)(-Anhang)?-${ART_RE}-\\d{4}$`, 'i').exec(stemVoll);
  if (m) {
    return {
      familie: 'ks',
      nummer: `${m[1]}${m[2].toLowerCase()}`,
      art: m[4].toLowerCase(),
      beilage: m[3] ? 'anhang' : null,
      stem: null,
    };
  }
  m = new RegExp(`^estv-mitteilung-(\\d+)-${ART_RE}(?:-(.+))?$`, 'i').exec(stemVoll);
  if (m) {
    const stem = `${m[1]}-${m[2]}${m[3] ? `-${m[3]}` : ''}`.toLowerCase();
    return { familie: 'mitteilung', nummer: m[1], art: m[2].toLowerCase(), beilage: null, stem };
  }
  m = /^vst-mb-(.+)$/i.exec(stemVoll);
  if (m) return { familie: 'mb', nummer: null, art: null, beilage: null, stem: m[1].toLowerCase() };
  return { familie: null, nummer: null, art: null, beilage: null, stem: stemVoll.toLowerCase() };
}

/** «Version vom D.M.YYYY» im amtlichen Titel → Jahr (ESTV co-listet revidierte KS-Versionen
 *  NEBEN dem Original, z. B. KS Nr. 26 von 2009 UND «Version vom 6. Februar 2024» — die
 *  Version braucht eine eigene, aus dem Dokument selbst ableitbare ID). */
export function versionsJahrAusTitel(titel: string): string | null {
  const m = /\bVersion vom\s+\d{1,2}\.\s*(?:[A-Za-zÄÖÜäöü]+|\d{1,2}\.?)\s*(\d{4})/.exec(titel);
  return m ? m[1] : null;
}

/** Dokument-ID aus dem Befund (§2.6, pfadsicher GROSS). */
export function dokIdVon(b: DateinamenBefund, seiteTag: string, versionsJahr: string | null = null): string {
  if (b.familie === 'ks' && b.nummer && b.art) {
    const primaer = erlasseAusArt(b.art)[0]; // erster Buchstabe = primäre Steuerart
    let basis = `ESTV-KS-${primaer}-${b.nummer.toUpperCase()}`;
    if (versionsJahr) basis += `-V${versionsJahr}`;
    return b.beilage ? `${basis}-${b.beilage.toUpperCase()}` : basis;
  }
  if (b.familie === 'w' && b.stem) return `ESTV-KS-${b.stem.toUpperCase()}`;
  if (b.familie === 'mitteilung' && b.stem) return `ESTV-MITTEILUNG-${b.stem.toUpperCase()}`;
  if (b.familie === 'mb' && b.stem) return `ESTV-MB-${b.stem.toUpperCase()}`;
  // Unbekanntes Muster: Seiten-Tag + Stem (deterministisch, pfadsicher).
  return `ESTV-KS-${seiteTag.toUpperCase()}-${(b.stem ?? '').toUpperCase()}`;
}

/** Doktyp je Familie (§0/B6: nur registrierte DoktypIds; 'ks-anhang' + 'weisung' = M4-Erweiterung).
 *  W-Datei mit «Kreisschreiben»-Titel (revidierte Version eines alten W-Dokuments, live:
 *  `dbst-ks-w95-003-2024` = «Kreisschreiben Nr. 3; Version vom 7. Februar 2024») → kreisschreiben;
 *  deckt auch den amtlichen Tippfehler «Kreischreiben» (verbatim belassen, nie umschreiben). */
export function doktypVon(b: DateinamenBefund, titel: string): DoktypId {
  if (b.familie === 'ks') return b.beilage ? 'ks-anhang' : 'kreisschreiben';
  if (b.familie === 'w') return /^Kreiss?chreiben/i.test(titel) ? 'kreisschreiben' : 'weisung';
  if (b.familie === 'mitteilung') return 'mitteilung';
  if (b.familie === 'mb') return 'merkblatt';
  return 'kreisschreiben';
}

/** Beschreibungs-Kaskade (Stufe 2): nennt die Beschreibung die Steuer EXPLIZIT? */
export function erlasseAusBeschreibung(beschreibung: string): ('DBG' | 'VSTG' | 'STG')[] {
  const out: ('DBG' | 'VSTG' | 'STG')[] = [];
  if (/direkte\s*n?\s+Bundessteuer/i.test(beschreibung)) out.push('DBG');
  if (/Verrechnungssteuer/i.test(beschreibung)) out.push('VSTG');
  if (/Stempelabgabe/i.test(beschreibung)) out.push('STG');
  return out;
}

/** «vom DD.MM.YYYY» im amtlichen Titel (W-Serie/Mitteilung) → ISO; null wenn nicht vorhanden. */
export function titelDatumNachIso(titel: string): string | null {
  const m = /\bvom\s+(\d{1,2})\.(\d{1,2})\.(\d{4})\b/.exec(titel);
  if (!m) return null;
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

/**
 * AN-2 (W2·29-WERKBANK-LESER, 25.9.2026): Dokumentdatum aus der amtlichen Beschreibung der
 * Indexseite — ESTV schreibt es dort als «<Gegenstand> vom DD.MM.YYYY (<Steuerart>)» (live
 * 25.9.2026: «… vom 31.08.2005 (Direkte Bundessteuer)» an KS Nr. 11, dessen Upload-Label
 * «10. Oktober 2023» lautet). NUR die erste Zeile (Folgezeilen listen Anhänge mit FREMDEN
 * Daten, z. B. «Kreisschreiben Nr. 30 der SSK vom 22. August 2007» an KS Nr. 20) und NUR die
 * numerische Form. Rein; null = keine Aussage.
 */
export function beschreibungDatumNachIso(beschreibung: string): string | null {
  return titelDatumNachIso(beschreibung.split('\n')[0] ?? '');
}

/** AN-13: amtliche Signatur der W-Serie im Titel («W01-006D vom 06.06.2001» → «W01-006»; das
 *  «D» ist das Sprachkürzel). Der Dateiname (dbst-ks-w03-006) gruppiert ESTV-intern anders —
 *  live 25.9.2026 w03-006 ↔ W01-006D, w03-008 ↔ W02-008D —, darum trägt die ANZEIGE die
 *  Titel-Signatur, der Key bleibt dateinamen-stabil (§2.6). */
export function wSignaturAusTitel(titel: string): string | null {
  const m = /^(W\d{2}-\d{3})D?\b/.exec(titel);
  return m ? m[1] : null;
}

/** Anzeige-Nummer je Familie ('Nr. 50a' | 'Nr. 45 · Anhang 1-1' | 'W95-002' | 'Mitteilung 020' |
 *  'S-02.122.1b'). Beilagen tragen die Beilage IN der Nummer — sonst kollidierte (behoerde+nummer)
 *  mit dem Haupt-KS (Dubletten-Tor §2.6, live gefangen bei KS 37 Anhang 1–5). */
export function anzeigeNummer(b: DateinamenBefund): string | null {
  if (b.familie === 'ks' && b.nummer) {
    if (!b.beilage) return `Nr. ${b.nummer}`;
    const label = b.beilage === 'faq' ? 'FAQ'
      : b.beilage === 'schema' ? 'Schema'
      : b.beilage === 'fragebogen' ? 'Fragebogen'
      : `Anhang${b.beilage.replace(/^anhang/, '').replace(/^(\d)/, ' $1') || ''}`;
    return `Nr. ${b.nummer} · ${label}`;
  }
  if (b.familie === 'w' && b.stem) return b.stem.toUpperCase().replace(/-(\d{3})/, '-$1');
  if (b.familie === 'mitteilung' && b.nummer) return `Mitteilung ${b.nummer}`;
  return null;
}

/** Rang deterministisch aus der Systematik: KS d < KS v < KS s < W-Serie < MB < Mitteilung;
 *  innerhalb aufsteigend nach Nummer, Beilagen direkt hinter dem Haupt-KS (Key-Tiebreak). */
export function dokRang(b: DateinamenBefund): number {
  if (b.familie === 'ks' && b.nummer && b.art) {
    const nr = parseInt(b.nummer, 10);
    const buchst = /[a-z]$/.test(b.nummer) ? b.nummer.charCodeAt(b.nummer.length - 1) - 96 : 0;
    const serie = b.art.startsWith('d') ? 1000 : b.art.startsWith('v') ? 3000 : 4000;
    return serie + nr * 20 + buchst * 2 + (b.beilage ? 1 : 0);
  }
  if (b.familie === 'w' && b.stem) {
    const m = /^w(\d{2})-(\d{3})/.exec(b.stem);
    return 5000 + (m ? parseInt(m[1], 10) * 10 + parseInt(m[2], 10) : 999);
  }
  if (b.familie === 'mb') return 6000;
  if (b.familie === 'mitteilung' && b.nummer) return 7000 + parseInt(b.nummer, 10);
  return 8000;
}

/** DAM-<TOKEN> aus der URL (volatil; nur quell_ids). */
export function damTokenAusUrl(url: string): string {
  const m = /\/dam\/[a-z]{2}\/sd-web\/([^/]+)\//.exec(url);
  return m ? m[1] : '';
}

/** Drift-Token = sha256/16 über (titel + datumslabel + url) — §0/A8: kein Default. */
export function driftToken(titel: string, datumLabel: string, url: string): string {
  return createHash('sha256').update(`${titel} ${datumLabel} ${url}`, 'utf8').digest('hex').slice(0, 16);
}

// ── HTML-Parsing einer Indexseite ─────────────────────────────────────────────

/** Zerlegt einen download-item-Anker (inneres HTML) in Titel/Beschreibung/Datumslabel. */
export function parseAnkerInhalt(inner: string): { titel: string; beschreibung: string; datumLabel: string } | null {
  const t = /<h4[^>]*class="[^"]*download-item__title[^"]*"[^>]*>([\s\S]*?)<\/h4>/.exec(inner);
  if (!t) return null;
  const titel = dekodiereEntities(t[1].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
  const d = /<p[^>]*class="[^"]*download-item__description[^"]*"[^>]*>([\s\S]*?)<\/p>/.exec(inner);
  const beschreibung = d ? dekodiereEntities(d[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim() : '';
  let datumLabel = '';
  for (const s of inner.matchAll(/<span class="meta-info__item">([^<]*)<\/span>/g)) {
    const v = dekodiereEntities(s[1]).trim();
    if (istDeutschesDatumslabel(v)) { datumLabel = v; break; }
  }
  if (!titel || !datumLabel) return null;
  return { titel, beschreibung, datumLabel };
}

/** Alle PDF-download-items einer Indexseite (rein; Struktur-Probe im Aufrufer). */
export function parseIndexSeite(html: string): RohEstvItem[] {
  const out: RohEstvItem[] = [];
  for (const m of html.matchAll(/<a class="download-item"[^>]*?href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const href = dekodiereEntities(m[1]).trim();
    if (!/\.pdf$/i.test(href.split('?')[0])) continue;
    const inhalt = parseAnkerInhalt(m[2]);
    if (!inhalt) continue;
    out.push({ href, ...inhalt, dateiname: decodeURIComponent(href.split('/').pop() ?? '') });
  }
  return out;
}

// ── Dokument + Kanten bauen (rein) ────────────────────────────────────────────

const HINWEIS_ESTV = 'Amtliche ESTV-Publikation (Verwaltungsverordnung), kein Gesetzesrang.';
const HINWEIS_MASCHINELL =
  'Amtliche ESTV-Publikation (Verwaltungsverordnung), kein Gesetzesrang. Zuordnung zur Steuerart maschinell aus der Indexseite abgeleitet.';

const ERLASS_ABK: Record<'DBG' | 'VSTG' | 'STG', string[]> = {
  DBG: ['DBG'],
  VSTG: ['VStG'],
  STG: ['StG'],
};

/**
 * Baut aus einem dedupliziertem Roh-Item + seinen Listungs-Seiten Dokument + Kanten.
 * Kaskade: Dateinamen-Suffix (amtlich) → Beschreibung (amtlich) → Seiten-Kontext (maschinell).
 * Artikelscharf zusätzlich, wo der amtliche Titel «Art. N <ABK>» des zugeordneten Erlasses nennt.
 */
export function baueDokUndKanten(
  roh: RohEstvItem,
  seiten: EstvKsSeiteDef[],
  abgerufen: string,
): { dok: SoftLawDok; kanten: NormRefKante[] } {
  const b = parseDateiname(roh.dateiname);
  const id = dokIdVon(b, seiten[0].tag, versionsJahrAusTitel(roh.titel));

  // Kaskade der Erlass-Zuordnung (ehrlich je Stufe, §0/A3).
  let erlasse: ('DBG' | 'VSTG' | 'STG')[];
  let zuordnung: 'amtlich' | 'maschinell';
  let rohZitatBasis: string;
  if (b.art) {
    erlasse = erlasseAusArt(b.art);
    zuordnung = 'amtlich';
    rohZitatBasis = roh.dateiname;
  } else {
    const ausBeschreibung = erlasseAusBeschreibung(roh.beschreibung);
    if (ausBeschreibung.length > 0) {
      erlasse = ausBeschreibung;
      zuordnung = 'amtlich';
      rohZitatBasis = roh.beschreibung;
    } else {
      erlasse = [...new Set(seiten.map((s) => s.kontextErlass))];
      zuordnung = 'maschinell';
      rohZitatBasis = `Indexseite(n): ${seiten.map((s) => s.tag).join('+')}`;
    }
  }

  // Datum: Titel (W-Serie/Mitteilung) → Beschreibung (AN-2; nur Haupt-Dokumente, eine
  // Beilage-Beschreibung nennt das Datum ihres Haupt-KS «gemäss Kreisschreiben Nr. 23 vom …»)
  // → Upload-Label der Indexseite (letzter Rückfall, als 'hub-label' deklariert).
  const titelDatum = titelDatumNachIso(roh.titel);
  const beschreibungDatum = (titelDatum || b.beilage) ? null : beschreibungDatumNachIso(roh.beschreibung);
  const stand = titelDatum ?? beschreibungDatum ?? datumslabelNachIso(roh.datumLabel);
  const standQuelle = beschreibungDatum ? 'hub-beschreibung' as const : 'hub-label' as const;
  const doktyp = doktypVon(b, roh.titel);
  // AN-13: W-Serie — Titel ist nur «Signatur vom Datum», der Gegenstand steht allein in der
  // ersten Zeile der amtlichen Beschreibung. Beide Teile wörtlich, verbunden wie ESTV die
  // Kreisschreiben selbst betitelt («Kreisschreiben Nr. 50: <Gegenstand>»).
  const wSignatur = b.familie === 'w' ? wSignaturAusTitel(roh.titel) : null;
  const gegenstand = (roh.beschreibung.split('\n')[0] ?? '').trim();
  const titel = wSignatur && /^W\d{2}-\d{3}D? vom \d{1,2}\.\d{1,2}\.\d{4}$/.test(roh.titel.trim()) && gegenstand
    ? `${roh.titel.trim()}: ${gegenstand}`
    : roh.titel;
  const shaId = createHash('sha256')
    .update([id, titel, roh.href, stand, erlasse.join(','), zuordnung].join(' '), 'utf8')
    .digest('hex');

  const dok: SoftLawDok = {
    id,
    behoerde: 'ESTV',
    doktyp,
    titel,
    nummer: wSignatur ?? anzeigeNummer(b),
    // W2-TRENNUNG (29.8.2026): ESTV = Eidgenössische STEUERverwaltung —
    // Kreis-/Rundschreiben zur direkten Bundessteuer und zur Verrechnungs-
    // steuer sind ausnahmslos Steuerdokumente, nie Sozialversicherung.
    rechtsgebiet: BEHOERDE_RECHTSGEBIET.ESTV,
    sprache: 'de',
    rang: dokRang(b),
    normKeys: erlasse,
    hinweis: zuordnung === 'maschinell' ? HINWEIS_MASCHINELL : HINWEIS_ESTV,
    quelle_url: roh.href,
    stand,
    stand_quelle: standQuelle,
    abgerufen,
    drift_token: driftToken(roh.titel, roh.datumLabel, roh.href),
    quell_ids: { dam_token: damTokenAusUrl(roh.href), url_basis: roh.href, seiten: seiten.map((s) => s.tag) },
    sha: shaId,
  };

  const kanten: NormRefKante[] = [];
  for (const erlass of erlasse) {
    // Artikelscharf, wo der amtliche Titel den Artikel des Erlasses nennt (z. B. «Art. 65 DBG»).
    const artikel = ERLASS_ABK[erlass].flatMap((abk) => artikelAusTitel(roh.titel, abk));
    if (artikel.length > 0) {
      for (const a of [...new Set(artikel)]) {
        kanten.push({
          quelldok_id: id,
          erlass_key: erlass,
          artikel: a,
          zitat_key: normalisiereZitat(`${erlass} Art. ${a.replace('_', '')}`),
          roh_zitat: roh.titel,
          konfidenz: 'regex-hoch',
          quelle: 'amtlich',
          fundstelle: '',
          fundstelle_url: null,
          stand,
          abgerufen,
        });
      }
    } else {
      kanten.push({
        quelldok_id: id,
        erlass_key: erlass,
        artikel: '',
        zitat_key: normalisiereZitat(erlass),
        roh_zitat: rohZitatBasis,
        konfidenz: zuordnung === 'maschinell' ? 'regex-niedrig' : 'regex-hoch',
        quelle: zuordnung,
        fundstelle: '',
        fundstelle_url: null,
        stand,
        abgerufen,
      });
    }
  }
  return { dok, kanten };
}

/**
 * Verarbeitet die (bereits geladenen) drei Indexseiten: Count-Gates (vor Dedupe) + Struktur-Probe,
 * URL-Dedupe (Quer-Listung = ein Dokument, Seiten-Union), kuratiert-bekannte übersprungen,
 * Key-Eindeutigkeit erzwungen. Wirft bei ROT (§8: kein stiller Teil-Snapshot).
 */
export function verarbeiteIndexSeiten(
  seitenHtml: { def: EstvKsSeiteDef; html: string }[],
  abgerufen: string,
): { dokumente: SoftLawDok[]; kanten: NormRefKante[] } {
  const proUrl = new Map<string, { roh: RohEstvItem; seiten: EstvKsSeiteDef[] }>();
  for (const { def, html } of seitenHtml) {
    const items = parseIndexSeite(html);
    if (items.length < def.min) {
      throw new Error(`adapter-estv-ks: ${def.tag} nur ${items.length} PDF-Anker (< ${def.min}) — Quell-Bruch/Redesign? Snapshot NICHT schreiben.`);
    }
    for (const roh of items) {
      const e = proUrl.get(roh.href);
      if (e) {
        if (!e.seiten.some((s) => s.tag === def.tag)) e.seiten.push(def);
      } else {
        proUrl.set(roh.href, { roh, seiten: [def] });
      }
    }
  }
  const dokumente: SoftLawDok[] = [];
  const kanten: NormRefKante[] = [];
  const gesehen = new Set<string>();
  for (const { roh, seiten } of proUrl.values()) {
    const { dok, kanten: ks } = baueDokUndKanten(roh, seiten, abgerufen);
    if (ESTV_KURIERT_BEKANNT.has(dok.id)) continue; // bestehender Key gewinnt (§2.6) → skip
    if (gesehen.has(dok.id)) {
      throw new Error(`adapter-estv-ks: Key-Kollision '${dok.id}' (${roh.dateiname}) — ID-Systematik schärfen (§2.6).`);
    }
    gesehen.add(dok.id);
    dokumente.push(dok);
    kanten.push(...ks);
  }
  return { dokumente, kanten };
}

// ══ Netz-Hülle ═══════════════════════════════════════════════════════════════

/** Höflicher GET einer Indexseite; Content-Type-Arbiter (Soft-404, §Skill). */
export async function ladeIndex(url: string, fetchImpl?: typeof fetch): Promise<string> {
  const res = await fetchMitWiederholung(url, { headers: { 'User-Agent': ESTV_KS_USER_AGENT, Accept: 'text/html' } }, { fetchImpl });
  const ct = res.headers.get('content-type') ?? '';
  if (!res.ok) throw new Error(`adapter-estv-ks: ${url} HTTP ${res.status}.`);
  if (!/text\/html/i.test(ct)) throw new Error(`adapter-estv-ks: ${url} kein text/html (Content-Type «${ct}») — Soft-404-Verdacht.`);
  const html = await res.text();
  if (html.length < 5000) throw new Error(`adapter-estv-ks: ${url} verdächtig kurz (${html.length} B) — Shell?`);
  return html;
}

export interface CrawlOptionen {
  abgerufen: string; // ISO (kein Date.now, §2)
  fetchImpl?: typeof fetch;
  warte?: (ms: number) => Promise<void>;
  substrat?: (tag: string, html: string) => void;
}

/** Extrahiert das <main>-Substrat (Snapshot-Belegkern, §2.2); Fallback = volles HTML. */
export function mainSubstrat(html: string): string {
  const m = /<main[\s\S]*?<\/main>/i.exec(html);
  return m ? m[0] : html;
}

/** Voll-Crawl der drei Indexseiten (höflich, sequentiell). Ergebnisvertrag §3. */
export async function crawleEstvKs(opt: CrawlOptionen): Promise<AdapterErgebnis> {
  const warte = opt.warte ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const seitenHtml: { def: EstvKsSeiteDef; html: string }[] = [];
  let erste = true;
  for (const def of ESTV_KS_SEITEN) {
    if (!erste) await warte(400);
    erste = false;
    const html = await ladeIndex(def.indexUrl, opt.fetchImpl);
    opt.substrat?.(def.tag, mainSubstrat(html));
    seitenHtml.push({ def, html });
  }
  const { dokumente, kanten } = verarbeiteIndexSeiten(seitenHtml, opt.abgerufen);
  const idx = [...dokumente].map((d) => `${d.id}=${d.drift_token}`).sort().join('\n');
  const indexSha = createHash('sha256').update(idx, 'utf8').digest('hex').slice(0, 16);
  return { dokumente, kanten, indexSha, abgerufen: opt.abgerufen };
}
