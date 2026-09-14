// ─── check:pdf-quellen — Tor für die amtlichen PDF-Download-URLs (U-PDF/A12) ──
//
// Offline (in `check`/`gate`): pdf-quellen.json ist VOLLSTÄNDIG gegen die
// Snapshot-Menge des Registers, konsistent zu register.json
// und — für Bund — an die überwachten fedlex-cache.sh-Pins gebunden. Damit ist die
// PDF-URL Teil der Pin-Überwachung: ein Re-Pin (fedlex-cache.sh) ohne Neu-Lauf des
// Generators kippt dieses Tor ROT (check:fedlex-versionen bleibt Currency-Arbiter
// der Pins selbst). §7/§8: massgeblich ist die amtliche Quelle.
//
// Netz (--netz, in check:netz): jede Bund-URL + eine Kanton-Stichprobe liefern
// tatsächlich ein PDF (HTTP 200 + application/pdf) — fängt tote/verschobene Dateien.
//
// Exit 0 grün · 1 Befund.
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lesePins } from '../fedlex-pins.ts';

const wurzel = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const REGISTER_JSON = resolve(wurzel, 'public/normtext/register.json');
const PDF_QUELLEN_JSON = resolve(wurzel, 'public/normtext/pdf-quellen.json');

type PdfQuelle = { url: string; stand: string; quelle: 'fedlex' | 'lexwork' };
type Erlass = {
  key: string; ebene: string; status: string; quelleUrl: string; stand: string;
  pdfUrl?: string; pdfStand?: string;
};

const FEDLEX_URL_RE =
  /^https:\/\/fedlex\.data\.admin\.ch\/filestore\/fedlex\.data\.admin\.ch\/eli\/(cc\/[^/]+\/[^/]+)\/(\d{8})\/de\/pdf-a\/[^/]+\.pdf$/;

/** «20260701» → «2026-07-01». */
function isoAusToken(t: string): string {
  return `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}`;
}

/**
 * Bund-Snapshots OHNE amtliche PDF-Manifestation (§8: kein Eintrag, keine
 * Aktion). LEER, weil Fedlex derzeit für alle 231 Bund-Snapshots eine
 * pdf-a-Manifestation führt (`gen:pdf-quellen -- --nur=bund`: «231/231,
 * 0 ohne pdf-a», 14.9.2026). Wer hier etwas einträgt, nennt den Grund und
 * das Datum der Fedlex-Probe — sonst ist es ein stummgeschalteter Mangel.
 */
const BUND_OHNE_PDF_MANIFESTATION: ReadonlySet<string> = new Set<string>([]);

/**
 * Kanton-Basislinie: so viele Kanton-Snapshots haben heute (14.9.2026) KEINEN
 * pdf-quellen-Eintrag — LexWork nennt kein `pdf_link_tol` der gepinnten Fassung
 * (Drift oder gar kein PDF). Kein Freibrief, sondern eine Ratsche: die Zahl darf
 * sinken, nicht steigen. Grösste Einzelposten: ZH 111, JU 7, VD 7, TI 5.
 */
const KANTON_OHNE_PDF_BASISLINIE = 152;

export type Befund = string;

/** Reine Offline-Prüfung (testbar). */
export function pruefeOffline(
  quellen: Record<string, PdfQuelle>,
  erlasse: Erlass[],
  pins: { eli: string; kons: string }[],
): Befund[] {
  const befunde: Befund[] = [];
  const perKey = new Map(erlasse.map((e) => [e.key, e]));
  const pinProEli = new Map(pins.map((p) => [p.eli, p.kons]));

  for (const [key, q] of Object.entries(quellen)) {
    const e = perKey.get(key);
    if (!e) { befunde.push(`${key}: kein Register-Erlass (verwaister PDF-Quellen-Eintrag).`); continue; }
    if (e.status !== 'snapshot') { befunde.push(`${key}: Status '${e.status}' (nur snapshot trägt pdf-quellen; pdf-embed nutzt pdfPfad).`); continue; }
    // Projektions-Integrität: register.json muss den Sidecar spiegeln (sonst stale).
    if (e.pdfUrl !== q.url) befunde.push(`${key}: register.pdfUrl ≠ pdf-quellen.url → 'npm run normtext:register' nachziehen.`);
    if (e.pdfStand !== q.stand) befunde.push(`${key}: register.pdfStand ≠ pdf-quellen.stand → Projektion nachziehen.`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(q.stand)) befunde.push(`${key}: stand '${q.stand}' ist kein ISO-Datum.`);

    if (q.quelle === 'fedlex') {
      const m = q.url.match(FEDLEX_URL_RE);
      if (!m) { befunde.push(`${key}: URL ist kein Fedlex-Filestore-pdf-a-Pfad: ${q.url}`); continue; }
      const [, eli, kons] = m;
      const konsIso = isoAusToken(kons);
      if (konsIso !== q.stand) befunde.push(`${key}: URL-Konsolidierung ${konsIso} ≠ stand ${q.stand}.`);
      const pinKons = pinProEli.get(eli);
      if (pinKons === undefined) {
        befunde.push(`${key}: kein fedlex-cache.sh-Pin für ELI ${eli} — PDF-URL ausserhalb der Pin-Überwachung.`);
      } else if (pinKons !== konsIso) {
        befunde.push(`${key}: PDF-Konsolidierung ${konsIso} ≠ Pin ${pinKons} (fedlex-cache.sh re-gepinnt? Generator neu laufen).`);
      }
    } else if (q.quelle === 'lexwork') {
      let sidecarHost: string;
      try { sidecarHost = new URL(q.url).host; } catch { befunde.push(`${key}: LexWork-URL unparsbar: ${q.url}`); continue; }
      let regHost = '';
      try { regHost = new URL(e.quelleUrl).host; } catch { /* ignore */ }
      if (regHost && sidecarHost !== regHost) befunde.push(`${key}: PDF-Host ${sidecarHost} ≠ Quelle-Host ${regHost}.`);
      if (q.stand !== e.stand) befunde.push(`${key}: LexWork-stand ${q.stand} ≠ Snapshot-stand ${e.stand} (Drift → Eintrag entfernen).`);
    } else {
      befunde.push(`${key}: unbekannte quelle '${(q as PdfQuelle).quelle}'.`);
    }
  }

  // ─── Vollständigkeit gegen die Snapshot-Menge (§6.7-Wurzelfix) ─────────────
  //
  // WARUM: Bis 14.9.2026 prüfte dieses Tor ausschliesslich die VORHANDENEN
  // Sidecar-Einträge und meldete zufrieden «228 Bund» — gegen 231 Bund-Snapshots
  // im Register. Drei frisch aufgenommene Kernerlasse (EMRK, EÖBV, AVG) kamen
  // ohne pdf-quellen-Eintrag durch; EMRK verlor dabei den amtlichen PDF-Zugang
  // ersatzlos (eingebettetes PDF entfernt, kein Link an seiner Stelle). Ein Tor,
  // das bei FEHLENDEN Einträgen nicht scheitern kann, ist gefährlicher als keines
  // (CLAUDE.md §6.7) — Befund der Gegenprüfung zu PR #860.
  //
  // Der frühere unscharfe Coverage-Floor (`BUND_FLOOR = 200`) trug dieselbe Sorge
  // und ist ersatzlos gestrichen: die scharfe Prüfung subsumiert ihn vollständig
  // (§17-Gegengewicht — ersetzen statt danebenstellen).
  const fehlendBund: string[] = [];
  const fehlendKanton: string[] = [];
  for (const e of erlasse) {
    if (e.status !== 'snapshot') continue;
    if (quellen[e.key]) continue;
    if (e.ebene === 'bund') {
      if (!BUND_OHNE_PDF_MANIFESTATION.has(e.key)) fehlendBund.push(e.key);
    } else if (e.ebene === 'kanton') {
      fehlendKanton.push(e.key);
    }
  }

  // Bund SCHARF: jeder Bund-Snapshot trägt einen Eintrag oder steht begründet
  // auf der Ausnahmeliste. Fedlex liefert für alle 231 heute eine pdf-a-
  // Manifestation ⇒ die Liste ist leer (siehe Konstante).
  if (fehlendBund.length) {
    befunde.push(
      `${fehlendBund.length} Bund-Snapshot(s) ohne pdf-quellen-Eintrag — amtlicher PDF-Zugang fehlt ` +
        `(\`npm run gen:pdf-quellen -- --nur=bund\` + \`npm run normtext:register\`): ` +
        `${fehlendBund.slice(0, 20).join(', ')}${fehlendBund.length > 20 ? ' …' : ''}`,
    );
  }
  // Ausnahmeliste darf nicht verrotten: ein Eintrag darauf, der inzwischen ein
  // PDF hat oder kein Bund-Snapshot mehr ist, ist selbst ein Befund.
  const bundSnapshotKeys = new Set(erlasse.filter((e) => e.ebene === 'bund' && e.status === 'snapshot').map((e) => e.key));
  for (const key of BUND_OHNE_PDF_MANIFESTATION) {
    if (!bundSnapshotKeys.has(key)) befunde.push(`Ausnahmeliste: '${key}' ist kein Bund-Snapshot mehr — Eintrag streichen.`);
    else if (quellen[key]) befunde.push(`Ausnahmeliste: '${key}' hat inzwischen einen PDF-Eintrag — Eintrag streichen.`);
  }

  // Kanton mit BASISLINIE statt scharf: LexWork liefert für 152 der 1339
  // Kanton-Snapshots kein pdf_link_tol der gepinnten Fassung (Drift oder gar
  // kein PDF) — die werden nach §8 ehrlich weggelassen, nicht erfunden. Scharf
  // wäre das Tor darum heute korpusweit rot. Die Basislinie friert den Ist-Stand
  // ein: eine VERSCHLECHTERUNG kippt rot, eine Verbesserung senkt die Zahl.
  // Nicht stumm: die Lücke wird auch im grünen Lauf ausgewiesen (main()).
  if (fehlendKanton.length > KANTON_OHNE_PDF_BASISLINIE) {
    befunde.push(
      `${fehlendKanton.length} Kanton-Snapshot(s) ohne pdf-quellen-Eintrag > Basislinie ${KANTON_OHNE_PDF_BASISLINIE} ` +
        `(Verschlechterung; Generator nachziehen oder Basislinie bewusst heben): ` +
        `${fehlendKanton.slice(0, 20).join(', ')}${fehlendKanton.length > 20 ? ' …' : ''}`,
    );
  }

  return befunde;
}

async function pruefeNetz(quellen: Record<string, PdfQuelle>): Promise<Befund[]> {
  const befunde: Befund[] = [];
  const fedlex = Object.entries(quellen).filter(([, q]) => q.quelle === 'fedlex');
  const lexwork = Object.entries(quellen).filter(([, q]) => q.quelle === 'lexwork');
  // Alle Bund + Kanton-Stichprobe (jede Nte, gedeckelt bei 30) — höflich.
  const schritt = Math.max(1, Math.ceil(lexwork.length / 30));
  const stichprobe = lexwork.filter((_, i) => i % schritt === 0).slice(0, 30);
  const ziel = [...fedlex, ...stichprobe];

  let i = 0;
  async function arbeiter() {
    while (i < ziel.length) {
      const [key, q] = ziel[i++];
      try {
        const res = await fetch(q.url, { method: 'HEAD' });
        const ct = res.headers.get('content-type') ?? '';
        if (!res.ok) befunde.push(`${key}: HTTP ${res.status} auf ${q.url}`);
        else if (!/pdf/i.test(ct)) befunde.push(`${key}: Content-Type '${ct}' (kein PDF) auf ${q.url}`);
      } catch (err) {
        befunde.push(`${key}: Netz-Fehler ${err instanceof Error ? err.message : err}`);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(8, ziel.length || 1) }, arbeiter));
  return befunde;
}

async function main() {
  const netz = process.argv.includes('--netz');
  let quellen: Record<string, PdfQuelle>;
  try {
    quellen = JSON.parse(readFileSync(PDF_QUELLEN_JSON, 'utf8')) as Record<string, PdfQuelle>;
  } catch {
    console.error('check:pdf-quellen: public/normtext/pdf-quellen.json fehlt/unlesbar (npm run gen:pdf-quellen).');
    process.exit(1);
    return;
  }
  const erlasse = (JSON.parse(readFileSync(REGISTER_JSON, 'utf8')) as { erlasse: Erlass[] }).erlasse;

  const befunde = pruefeOffline(quellen, erlasse, lesePins());
  if (netz) befunde.push(...await pruefeNetz(quellen));

  if (befunde.length) {
    console.error(`check:pdf-quellen ROT — ${befunde.length} Befund(e):`);
    for (const b of befunde.slice(0, 40)) console.error(`  · ${b}`);
    if (befunde.length > 40) console.error(`  … und ${befunde.length - 40} weitere.`);
    process.exit(1);
  }
  const bund = Object.values(quellen).filter((q) => q.quelle === 'fedlex').length;
  const kanton = Object.values(quellen).filter((q) => q.quelle === 'lexwork').length;
  const snaps = erlasse.filter((e) => e.status === 'snapshot');
  const bundSnap = snaps.filter((e) => e.ebene === 'bund').length;
  const kantonSnap = snaps.filter((e) => e.ebene === 'kanton').length;
  const kantonLuecke = snaps.filter((e) => e.ebene === 'kanton' && !quellen[e.key]).length;
  console.log(`check:pdf-quellen grün${netz ? ' (inkl. Netz)' : ''}: ${bund}/${bundSnap} Bund + ${kanton}/${kantonSnap} Kanton amtliche PDF-URLs, Bund an Pins gebunden.`);
  // §8: die Kanton-Lücke wird auch im grünen Lauf benannt, nie stumm geschluckt.
  console.log(`  Kanton-Lücke ${kantonLuecke} (Basislinie ${KANTON_OHNE_PDF_BASISLINIE}) — LexWork ohne pdf_link_tol der gepinnten Fassung.`);
}

if (!process.env.VITEST) void main();
