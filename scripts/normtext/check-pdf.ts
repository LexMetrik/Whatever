/**
 * check:pdf — doppelte Kontrolle der 'pdf-embed'-Erlasse (EMRK, NYÜ …).
 *
 * OFFLINE (Default, im gate): jedes PDF in public/normtext/pdf/<KEY>.pdf
 *   · existiert, beginnt mit '%PDF', Bytes + sha256 == public/normtext/pdf-index.json;
 *   · pdf-index.json deckt GENAU die PDF_EMBED_QUELLEN ab (kein Drift in der Liste).
 * NETZ (--netz, in check:netz): zweite, unabhängige Kontrolle gegen die Quelle:
 *   · Live-Fedlex-pdf-a re-fetchen → sha == hinterlegt (kein stilles Veralten);
 *   · die gepinnte Konsolidierung IST die geltende (SPARQL, Currency-Arbiter).
 *
 * Exit 1 bei jedem Befund (rot).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { PDF_EMBED_QUELLEN, pdfaUrl } from '../../src/lib/normtext/pdf-embed.ts';

const netz = process.argv.includes('--netz');
const PDF_DIR = join(process.cwd(), 'public', 'normtext', 'pdf');
const INDEX = join(process.cwd(), 'public', 'normtext', 'pdf-index.json');
const fehler: string[] = [];

if (!existsSync(INDEX)) { console.error('check:pdf ROT — pdf-index.json fehlt (npm run normtext:pdf laufen lassen).'); process.exit(1); }
const index = (JSON.parse(readFileSync(INDEX, 'utf8')) as { pdfs: Record<string, { sha: string; bytes: number; eli: string; kons: string }> }).pdfs;

// Index ⇔ Quellen-Liste deckungsgleich?
const quellKeys = new Set(PDF_EMBED_QUELLEN.map((q) => q.key));
for (const k of Object.keys(index)) if (!quellKeys.has(k)) fehler.push(`Index-Eintrag ${k} ohne PDF_EMBED_QUELLE`);

// ── OFFLINE: Integrität jeder gehosteten Datei ──
for (const q of PDF_EMBED_QUELLEN) {
  const idx = index[q.key];
  if (!idx) { fehler.push(`${q.key}: kein pdf-index-Eintrag`); continue; }
  const pfad = join(PDF_DIR, `${q.key}.pdf`);
  if (!existsSync(pfad)) { fehler.push(`${q.key}: Datei fehlt (${pfad})`); continue; }
  const buf = readFileSync(pfad);
  if (!buf.subarray(0, 5).toString('latin1').startsWith('%PDF')) fehler.push(`${q.key}: kein %PDF-Header`);
  if (buf.length !== idx.bytes) fehler.push(`${q.key}: Bytes ${buf.length} ≠ Index ${idx.bytes}`);
  const sha = createHash('sha256').update(buf).digest('hex');
  if (sha !== idx.sha) fehler.push(`${q.key}: sha ${sha.slice(0, 12)}… ≠ Index ${idx.sha.slice(0, 12)}…`);
}

// ── NETZ: Drift gegen Live-Quelle + geltende Konsolidierung ──
// Seit 5.10.2026 (Monitor-Rückbau, Entscheid David «wichtig ist gesetzestext»): ein Abruf-
// Ausfall (HTTP 5xx, Timeout, SPARQL-Fehler oder -Leerantwort) ist KEIN Befund, sondern
// «keine Aussage» ⇒ Exit 2 (sichtbar, nie still grün). DRIFT/ÜBERHOLT/4xx bleiben Exit 1.
const netzfehler: string[] = [];
if (netz && fehler.length === 0) {
  const ENDPOINT = 'https://fedlex.data.admin.ch/sparqlendpoint';
  const heute = new Date().toISOString().slice(0, 10);
  for (const q of PDF_EMBED_QUELLEN) {
    const idx = index[q.key];
    // (a) Live-PDF-sha == hinterlegt (15s-Timeout — kein stilles Hängen, §8)
    try {
      const res = await fetch(pdfaUrl(q.eli, q.kons, q.pdfSuffix), { signal: AbortSignal.timeout(15_000) });
      if (!res.ok) { (res.status >= 500 ? netzfehler : fehler).push(`${q.key}: Live-pdf-a HTTP ${res.status}`); }
      else {
        const sha = createHash('sha256').update(Buffer.from(await res.arrayBuffer())).digest('hex');
        if (sha !== idx.sha) fehler.push(`${q.key}: DRIFT — Live-sha ≠ hinterlegt (neu: npm run normtext:pdf)`);
      }
    } catch (e) { netzfehler.push(`${q.key}: Live-Fetch ${e instanceof Error ? e.message : e}`); }
    // (b) gepinnte Konsolidierung == geltende (SPARQL, Currency-Arbiter). LEERES
    //     Resultat = ROT (Currency nicht verifizierbar) — kein stilles Bestehen (§8).
    //     FALLE (P1-a-Fix 5.7.2026): die frühere notation-Join × `LIMIT 300`-Query
    //     lieferte Partial-Results — geltend fälschlich = ältestes statt neuestes
    //     Datum (EMRK: 20050323 statt 20220916; NYÜ: 20200207 statt 20260506). Direkt
    //     über die ELI-ConsolidationAbstract abfragen (wie check:fedlex-versionen) —
    //     kein Join über die SR-Notation, kein LIMIT.
    try {
      const body = `query=${encodeURIComponent(`PREFIX jolux:<http://data.legilux.public.lu/resource/ontology/jolux#> SELECT ?date WHERE { <https://fedlex.data.admin.ch/eli/${q.eli}> ^jolux:isMemberOf ?c . ?c jolux:dateApplicability ?date . }`)}`;
      const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/sparql-results+json' }, body, signal: AbortSignal.timeout(15_000) });
      const bnd = ((await r.json()) as { results: { bindings: Array<{ date?: { value: string } }> } }).results.bindings;
      const daten = [...new Set(bnd.filter((b) => b.date).map((b) => b.date!.value.slice(0, 10)))].sort();
      const geltend = daten.filter((d) => d <= heute).pop()?.replace(/-/g, '');
      if (!geltend) netzfehler.push(`${q.key}: SPARQL lieferte keine Konsolidierung — Currency NICHT verifizierbar (Exit 2 statt stillem Bestehen)`);
      else if (geltend !== q.kons) fehler.push(`${q.key}: Konsolidierung ${q.kons} ÜBERHOLT — geltend ${geltend}`);
    } catch (e) { netzfehler.push(`${q.key}: SPARQL ${e instanceof Error ? e.message : e}`); }
  }
}

if (fehler.length) {
  console.error(`check:pdf ROT${netz ? ' (offline+netz)' : ''} — ${fehler.length} Befund(e):\n  ${fehler.join('\n  ')}`);
  process.exit(1);
}
if (netzfehler.length) {
  console.error(`check:pdf KEINE AUSSAGE (Exit 2) — Quelle nicht erreichbar:\n  ${netzfehler.join('\n  ')}`);
  process.exit(2);
}
console.log(`check:pdf${netz ? ' (offline+netz)' : ' (offline)'} GRÜN — ${PDF_EMBED_QUELLEN.length} pdf-embed-Erlass(e) integer${netz ? ' + driftfrei + geltende Konsolidierung' : ''}.`);
