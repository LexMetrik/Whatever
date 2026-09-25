// ─── Build-Orchestrator: Rechtsprechungs-Snapshots erzeugen ──────────────────
//
// Resilient (Fahrplan R1/R9), Detail via OCL keyed-Lookups. Zwei Quellen-Zweige:
//  · Bund (bger): Citation-Graph-BFS (listing-unabhängig) → tief, regeste-reich.
//  · Kantone: Listing je kantonalem Gericht (kein BFS — deren Zitiergraph führt
//    nicht zu bger). /structure ist Bund-only → kantonal greift der ehrliche
//    Fliesstext-Fallback (§8, EntscheidBody).
// Schreibt NIE von Hand editierte Dateien — alles aus diesem Generator (§7).
//
//   vite-node scripts/normtext-entscheide.ts -- --datum=2026-06-23 --limit=45 \
//     --courts=zh_obergericht,be_verwaltungsgericht --kanton-pro=8
//
import {
  holeEntscheidOCL, enumeriereNeueste, enumeriereNeuesteAlle, citedRefZuId, enumeriereBge, enumeriereBgeBaender, holeBgeLeitentscheid,
} from './normtext/adapter-entscheide';
import { schreibeKorpus, ladeBestandSnapshots, berichteBezuege } from './normtext/entscheide-schreiben';
import {
  normKeysVonSnapshot, remapNormKeys, undeklarierteAltKeys, literaturEntfernteNormKeys,
  sperrEntfernteNormKeys,
} from './normtext/entscheide-mapping';
import { sha256EntscheidBloecke } from './normtext/sha-entscheide';
import { holeRegesteSprachfassungen, holeClirHtml, parseClirUrteilskopf, bgeRefZuClirId } from './normtext/clir-regeste';
import { verschlechtertDatum } from './normtext/bge-bandjahr';
import { mergeB1Ergebnis } from './normtext/entscheide-b1-merge';
import { findeFremdeFundstelleImBody } from './normtext/entscheide-koerper-konflation';
import { waehleNeue, fuehreAdditivZusammen } from './normtext/entscheide-additiv';
import type { EntscheidSnapshot } from '../src/lib/rechtsprechung/typen';
import type { Rechtsgebiet } from '../src/lib/normtext/register';
import * as path from 'node:path';

/** Stuft einen BGE auf Auszug-only zurück (Body = Sammlungstext, kein azaUrteil/Volltext,
 *  Bandjahr-Platzhalterdatum). Für die Kollisions-Quarantäne (§8): unsichere aza-Zuordnung. */
function aufAuszugZurueck(s: EntscheidSnapshot): void {
  if (s.auszugAbschnitte && s.auszugAbschnitte.length) {
    s.abschnitte = s.auszugAbschnitte;
    s.auszugAbschnitte = undefined;
    s.sha = sha256EntscheidBloecke(s.abschnitte);
  }
  const band = parseInt(s.bgeReferenz ?? '', 10);
  if (band) s.datum = `${band + 1874}-01-01`;   // Bandjahr-Platzhalter (UI: «BGE-Jahrgang»)
  s.azaUrteil = null;
}

/**
 * Amtlich degradierte DE-clir-Regeste erkennen (Erzeuger-seitiger Spiegel des
 * A29-Anti-Regressions-Tors in check-entscheide, ~Z.138): die flache OCL-Regeste
 * ist mehrteilig (trägt einen «Regeste b»/«Regesto b»-Marker am Zeilenanfang), die
 * amtliche DE-clir-Seite rendert für DIESEN BGE aber nur EINEN Regeste-Block (keine
 * `weitereRegesten`). Eine solche DE-Fassung ist unvollständig und würde die
 * trilinguale Struktur korrumpieren (A29-Tor rot) — sie darf NICHT angehängt werden.
 * Die flache `regeste.text` trägt ALLE Teile treu weiter (§1), also bleibt die
 * Regeste dieses BGE flach (ohne strukturierte Sprachfassungen), statt degradiert
 * anzureichern. Erstbeobachtung BGE 149 IV 1 (6B_978/2020, 16.11.2022): bger.ch-DE-
 * clir zeigt nur Teil a (Sterneintrag, Art. 3 Abs. 1 lit. u UWG); der zweite Teil
 * (Strafantragslegitimation des Bundes, Art. 23 Abs. 2 i.V.m. Art. 10 Abs. 3 lit. b
 * UWG) liegt nur auf der fr/it-clir-Seite + im OCL-Flachtext vor. Deterministisch (§2).
 */
function deClirDegradiert(
  regesteText: string | null | undefined,
  fassungen: { sprache: string; weitereRegesten?: unknown[] }[],
): boolean {
  const flatMehrteilig = /\n\s*Regest[eo]\s+[b-z]\s*\n/.test(regesteText ?? '');
  if (!flatMehrteilig) return false;
  const de = fassungen.find((x) => x.sprache === 'de');
  return !de?.weitereRegesten || de.weitereRegesten.length < 2;
}

const arg = (name: string): string | null => {
  const p = process.argv.find((a) => a.startsWith(name + '='));
  return p ? p.slice(name.length + 1) : null;
};
const datum = arg('--datum') ?? new Date().toISOString().slice(0, 10);
const bundLimit = Number(arg('--limit') ?? '45');
// --courts/--kanton-pro: im Vollbau Teil der Neuauswahl; mit --additiv (seit 25.9.2026)
// je Gericht die N nach Rang besten NEUEN Urteile (Bestands-ids ausgeschlossen).
const kantonPro = Number(arg('--kanton-pro') ?? '8');
const kantCourts = (arg('--courts') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
// Amtliche Leitentscheide (BGE): --bge-von=YYYY-MM-DD aktiviert den dritten Quell-Zweig.
const bgeVon = arg('--bge-von');
const bgeLimit = Number(arg('--bge-limit') ?? '300');
// Batch 3 (Lane R): die drei weiteren eidg. Gerichte (BVGer/BStGer/BPatGer) als
// eigener OCL-Quellzweig. --eidg=bvger,bstger,bpatger zieht je Gericht die N
// neuesten Urteile. --additiv ergänzt sie zum committeten Bestand (von der Platte
// geladen), OHNE die 272 BGE/Bund/Kanton über die Live-API neu zu ziehen (§6: kein
// Bestand-Drift). Ohne --additiv würde der bestehende Korpus überschrieben.
const eidgCourts = (arg('--eidg') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const eidgPro = Number(arg('--eidg-pro') ?? '5');
const additiv = process.argv.includes('--additiv');
// --bge-refresh (nur additiv): zieht genau die BESTEHENDEN BGE neu, deren Auszug/Volltext
// aktuell mitten im Wort (U+2026) gekappt ist (W2·6-BGE), und überschreibt sie by id —
// kein Vollbau, Bund/Kanton/eidg bleiben unberührt. Selbstheilend nach Adapter-Härtung.
const bgeRefresh = process.argv.includes('--bge-refresh');
// --regeste-refresh (nur additiv, W2·6-B B1+B2+A18): reichert die BESTEHENDEN
// amtlichen BGE an — (B2/A18) strukturierte, dreisprachige Regeste aus bger.ch clir
// (kopf+absaetze je Sprache, sortiert DE→FR→IT) + (B1) aza-Voll-Resolution der BGE
// ohne `azaUrteil`. Bund/Kanton/eidg + die restlichen BGE bleiben byte-treu (§6).
const regesteRefresh = process.argv.includes('--regeste-refresh');
// --bge-baender=146,147 (additiver Voll-Band-Nachzug, W2·6): zieht die VOLLSTÄNDIGEN
// amtlichen BGE-Bände band-basiert (nicht datums-basiert; Q1-Bandjahr-Quirk) nach,
// ergänzt sie zum committeten Bestand (byte-treu, §6), inkl. dreisprachiger clir-
// Regeste (A18) für die NEUEN BGE. Bund/Kanton/eidg + Bestands-BGE bleiben unberührt.
const bgeBaender = (arg('--bge-baender') ?? '').split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n) && n > 0);
// --remap (W2·6-NKEY): rechnet die `normKeys` des BESTEHENDEN Korpus mit der
// abgeleiteten Register-Tabelle + der Fliesstext-Erkennung neu und schreibt den
// Korpus über denselben Writer. STRIKT OFFLINE (kein Netz-Zweig läuft), rein aus
// den committeten Snapshots — mit gleichem --datum byte-gleich wiederholbar (§2).
// Berührt `sha` NICHT (der deckt nur `abschnitte`).
const remap = process.argv.includes('--remap');
// --rubrum-refresh (LM-127/LM-132, Datenschritt 5.9.2026): normalisiert den
// Satzzeichen-Abstand im amtlichen Besetzungs-Freitext des BESTEHENDEN Korpus.
// STRIKT OFFLINE (kein Netz-Zweig läuft), rein aus den committeten Snapshots, über
// denselben Writer (§5) — der Writer ruft `bereinigeBesetzungsFreitext` ohnehin auf
// jedem Snapshot auf, dieser Modus macht daraus nur einen benennbaren, messbaren
// Lauf. Nötig, weil `daten/bs-fiw/raw/` leer ist: eine echte Neu-Extraktion hinge
// am Vollabruf von 3765 Rohdokumenten des BS-Portals. Idempotent (§2) — ein zweiter
// Lauf mit gleichem --datum ändert nichts. Berührt AUSSCHLIESSLICH
// `rubrum.besetzung`; `abschnitte`/`sha`/Volltext bleiben unberührt (§7 Zitattreue).
const rubrumRefresh = process.argv.includes('--rubrum-refresh');
/**
 * DEKLARIERTE Alt-Key-Bewahrung (Linse 3, 28.7.2026) — die Ratsche bekommt eine
 * Sperre.
 *
 * `remapNormKeys` bewahrt jeden Alt-Key, den die Neuberechnung nicht reproduziert
 * (Begründung dort: nicht persistierte aza-statutes sind legitime Roh-Signale ohne
 * Beleg IM Snapshot). Pauschal angewandt ist das eine EINWEG-RATSCHE: sie bewahrt
 * auch einen Alt-Key, den ein Korrektheits-Fix soeben als FALSCH entlarvt hat.
 * Beinahe-Fall aus dieser Bau-Einheit: wäre der Backfill VOR dem Trunkierungs-Fix
 * gelaufen (LPMéd → 'LPM' → MSCHG), hätte ein späterer `--remap` die fünf falschen
 * MSCHG-Keys als «alt-erhalten» zurückgeschrieben — der Fix wäre am Artefakt
 * wirkungslos geblieben, und die Zahl in der Log-Zeile hätte wie eine Rettung
 * ausgesehen statt wie ein Rückfall.
 *
 * Bewahrt wird darum nur noch, was hier DEKLARIERT ist. Alles andere bricht den
 * Lauf ab (fail-closed, §6.7): lieber ein Abbruch mit vollständiger Liste als ein
 * stiller Rückschreiber. Wächst die Liste, ist das eine bewusste Entscheidung mit
 * Herkunfts-Beleg — kein Nebeneffekt.
 *
 * §6.7-Sabotage-Probe 28.7.2026: mit LEERER Deklaration bricht `--remap` ab und
 * nennt «bund/bge/152_I_61: ZPO»; der Abbruch erfolgt VOR `schreibeKorpus`, der
 * committete Korpus blieb byte-gleich (5'254 Dateien geprüft). Die Sperre kann
 * also scheitern, und ihr Scheitern zerstört nichts.
 *
 * HEUTIGER STAND (gemessen am committeten Korpus, 28.7.2026): genau ein Eintrag.
 * bund/bge/152_I_61 trägt 'ZPO', ohne dass 'ZPO'/'CPC' in `zitierteNormen` oder im
 * Fliesstext des Snapshots vorkommt — Herkunft ist der frühere BGE-Merge, der die
 * statutes des unterliegenden aza-Urteils in die normKeys fliessen liess, ohne sie
 * selbst zu persistieren (seit der Adapter-Härtung passiert das nicht mehr).
 *
 * DIE LISTE BLEIBT BEI EINEM EINTRAG, obwohl die Literatur-Kontext-Regel
 * (Gegenprüfung R3) 41 weitere Alt-Keys nicht mehr reproduziert — und das ist die
 * Pointe der Sperre, nicht ihre Umgehung: diese 41 sollen VERSCHWINDEN, nicht
 * bewahrt werden. Sie in ALT_ERHALTEN_ERWARTET zu schreiben hiesse, den soeben
 * gebauten Fix am Artefakt wieder auszuschalten. Sie laufen darum über den
 * Gegenzweig `literaturEntfernteNormKeys` (Ursache je Snapshot mechanisch belegt:
 * roher Text erzeugt den Key, bereinigter nicht) und werden vollständig
 * ausgewiesen, nie still gelöscht. Belege sind Kommentar-Fundstellen wie
 * bge_152_I_9 «N. 16 zu Art. 38 VwVG» (4 Spannen, VwVG sonst nirgends im Text)
 * oder bge_148_II_465 «ad art. 321 CP».
 */
const ALT_ERHALTEN_ERWARTET: ReadonlyMap<string, readonly string[]> = new Map([
  ['bund/bge/152_I_61', ['ZPO']],
]);
// Cache-Verzeichnis der rohen clir-HTML (gitignored; Re-Parse ohne Re-Crawl).
const CLIR_CACHE = path.join(process.cwd(), 'daten', 'cache', 'clir-regeste');
// Court-spezifischer Sachgebiets-Hint (deterministisch, deklariert): Patentstreit =
// Immaterialgüterrecht → privat (OCL legal_area der BPatGer-Fälle ist oft nur eine
// Kosten-/Verfahrens-Notiz und mappt sonst auf den groben Default 'oeffentlich').
const EIDG_SACHGEBIET: Record<string, Rechtsgebiet> = { bpatger: 'privat' };

async function mapLimit<T, R>(items: T[], n: number, fn: (t: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let idx = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (idx < items.length) { const my = idx++; out[my] = await fn(items[my], my); }
  }));
  return out;
}

// Auswahl-Rang: Regeste zuerst, dann Leitentscheid, dann mit Norm-Verknüpfung.
const rang = (s: EntscheidSnapshot) =>
  (s.regeste ? 0 : 2) + (s.leitcharakter === 'leitentscheid' ? 0 : 1) + (s.normKeys.length ? 0 : 0.5);
// DIESELBE Fehlerklasse wie im proNorm-Komparator (entscheide-schreiben.ts, Linse 4,
// 28.7.2026): `(a.datum < b.datum ? 1 : -1)` liefert bei GLEICHEM Rang UND gleichem
// Datum −1 für BEIDE Richtungen — keine Ordnung, sondern eine Behauptung. Hier wiegt
// es zusätzlich, weil danach `.slice(0, limit)` läuft: WELCHE Entscheide überhaupt in
// den Korpus kommen, hing damit an der Fetch-Reihenfolge (nebenläufig, `mapLimit`).
// Totaler Tiebreaker ist die Snapshot-`id` — sie ist je Entscheid eindeutig.
const sortAuswahl = (xs: EntscheidSnapshot[]) =>
  [...xs].sort((a, b) =>
    rang(a) - rang(b)
    || (a.datum < b.datum ? 1 : a.datum > b.datum ? -1 : 0)
    || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

/** Bund: Citation-Graph-BFS ab Seeds (+ Listing-Bonus-Seeds), allsprachiger Pool, gewählt nach Rang. */
async function bundKorpus(): Promise<EntscheidSnapshot[]> {
  const SEEDS = (arg('--seeds') ?? 'bger_5A_1100_2025').split(',').filter(Boolean);
  let startIds = [...SEEDS];
  const bonus = await enumeriereNeueste('bger', bundLimit * 2);
  if (bonus.length) { startIds.push(...bonus); console.log(`[bund] Listing bger: +${bonus.length} Bonus-Seeds`); }
  startIds = [...new Set(startIds)];

  const maxFetch = Math.max(150, bundLimit * 6);
  const visited = new Set<string>();
  const pool: EntscheidSnapshot[] = [];
  let queue = [...startIds];
  let fetched = 0;
  while (queue.length && fetched < maxFetch) {
    const layer = queue.filter((id) => !visited.has(id)).slice(0, 16);
    layer.forEach((id) => visited.add(id));
    queue = queue.filter((id) => !layer.includes(id));
    fetched += layer.length;
    const snaps = await mapLimit(layer, 4, async (id) => {
      const s = await holeEntscheidOCL(id, datum, { sprache: null });
      process.stdout.write(s ? (s.sprache === 'de' ? '.' : '·') : 'x');
      return s;
    });
    for (const s of snaps) {
      if (!s) continue;
      // O-4 (David-Freigabe 16.7.2026): der harte de-Filter fällt. BGer-Bund-Entscheide
      // sind einsprachige amtliche Originale — FR/IT ergehen real (~⅓ der BGE frz.) und
      // kommen mit Sprach-Badge in den Korpus (kein LLM, keine Übersetzung). holeEntscheidOCL
      // liefert mit {sprache:null} bereits alle Sprachen; der Pool nimmt sie nun alle auf.
      // Kantone (kantonKorpus) bleiben bewusst de-parametriert.
      pool.push(s);
      for (const ref of s.zitierteEntscheide) {
        const cid = citedRefZuId(ref);
        if (cid && !visited.has(cid)) queue.push(cid);
      }
    }
  }
  process.stdout.write('\n');
  const seen = new Set<string>();
  const uniq = pool.filter((s) => { if (seen.has(s.id)) return false; seen.add(s.id); return true; });
  const gewaehlt = sortAuswahl(uniq).slice(0, bundLimit);
  const spr = gewaehlt.reduce((m, s) => ((m[s.sprache] = (m[s.sprache] ?? 0) + 1), m), {} as Record<string, number>);
  console.log(`[bund] BFS ${fetched} geholt, ${uniq.length} unique → ${gewaehlt.length} gewählt (${Object.entries(spr).map(([k, v]) => `${k}:${v}`).join(' ')}; Regeste: ${gewaehlt.filter((s) => s.regeste).length})`);
  return gewaehlt;
}

/** Datumsspanne einer Auswahl für das Lauf-Log (Diagnose «wie neu ist das Neue?»). */
const spanne = (xs: EntscheidSnapshot[]) => {
  const d = xs.map((s) => s.datum).filter(Boolean).sort();
  return d.length ? `${d[0]}…${d[d.length - 1]}` : '–';
};

/**
 * Kantone: je Gericht Listing → keyed Detail (de), gewählt nach Rang (kantonPro).
 * `ausschluss` (nur additiv, 25.9.2026): Bestands-ids fallen VOR der Rang-Auswahl
 * heraus, damit N wirklich neue Urteile dazukommen; im Vollbau leer (Verhalten
 * unverändert). `geholt` zählt die erfolgreich geholten Snapshots für den Leer-Guard.
 */
async function kantonKorpus(ausschluss: ReadonlySet<string> = new Set()): Promise<{ snaps: EntscheidSnapshot[]; geholt: number }> {
  const out: EntscheidSnapshot[] = [];
  let geholt = 0;
  for (const court of kantCourts) {
    const ids = await enumeriereNeueste(court, kantonPro * 4);
    if (!ids.length) { console.log(`[kanton] ${court}: 0 IDs (Listing nicht erreichbar)`); continue; }
    const snaps = await mapLimit(ids.slice(0, kantonPro * 4), 4, async (id) => {
      const s = await holeEntscheidOCL(id, datum, { sprache: 'de' });
      process.stdout.write(s ? '.' : 'x');
      return s;
    });
    process.stdout.write('\n');
    const ok = snaps.filter((s): s is EntscheidSnapshot => !!s);
    geholt += ok.length;
    const imBestand = ok.filter((s) => ausschluss.has(s.id)).length;
    const gewaehlt = waehleNeue(ok, ausschluss, kantonPro, sortAuswahl);
    out.push(...gewaehlt);
    console.log(`[kanton] ${court}: ${ok.length} de${ausschluss.size ? ` (davon ${imBestand} schon im Bestand)` : ''} → ${gewaehlt.length} gewählt (Regeste: ${gewaehlt.filter((s) => s.regeste).length}; Datum ${spanne(gewaehlt)})`);
  }
  return { snaps: out, geholt };
}

/** Amtliche Leitentscheide (BGE): Enumeration → angereicherter A2-Merge je BGE. */
async function bgeKorpus(): Promise<EntscheidSnapshot[]> {
  const ids = await enumeriereBge(bgeVon!, bgeLimit);
  if (!ids.length) { console.log('[bge] 0 IDs (Listing nicht erreichbar)'); return []; }
  const snaps = await mapLimit(ids, 4, async (id) => {
    const s = await holeBgeLeitentscheid(id, datum);
    process.stdout.write(s ? (s.azaUrteil ? '.' : '·') : 'x');
    return s;
  });
  process.stdout.write('\n');
  const ok = snaps.filter((s): s is EntscheidSnapshot => !!s);
  const mitVoll = ok.filter((s) => s.azaUrteil).length;
  console.log(`[bge] ${ids.length} BGE → ${ok.length} erfasst (Volltext: ${mitVoll}, Auszug: ${ok.length - mitVoll})`);
  return ok;
}

/**
 * Eidg. Gerichte (BVGer/BStGer/BPatGer): je Gericht die `eidgPro` NEUESTEN Urteile
 * (Datum desc) über denselben OCL-Adapter wie Bund/Kanton. sprache:null — diese
 * Gerichte publizieren stark FR/IT (A2 ist Voraussetzung). Kein BGE/Leitentscheid-
 * Status (bgeReferenz bleibt null → leitcharakter 'routine', Invariante gewahrt);
 * gerichtstyp/Anzeigename kommen aus dem Mapping. id-Pfad: bund/<court>/<docket>.
 */
async function eidgKorpus(ausschluss: ReadonlySet<string> = new Set()): Promise<{ snaps: EntscheidSnapshot[]; geholt: number }> {
  const out: EntscheidSnapshot[] = [];
  let geholt = 0;
  for (const court of eidgCourts) {
    const ids = await enumeriereNeuesteAlle(court, eidgPro * 4);
    if (!ids.length) { console.log(`[eidg] ${court}: 0 IDs (Listing nicht erreichbar)`); continue; }
    const sachgebietHint = EIDG_SACHGEBIET[court] ?? null;
    const snaps = await mapLimit(ids.slice(0, eidgPro * 4), 4, async (id) => {
      const s = await holeEntscheidOCL(id, datum, { sprache: null, sachgebietHint });
      process.stdout.write(s ? (s.sprache === 'de' ? '.' : '·') : 'x');
      return s;
    });
    process.stdout.write('\n');
    const ok = snaps.filter((s): s is EntscheidSnapshot => !!s);
    geholt += ok.length;
    const imBestand = ok.filter((s) => ausschluss.has(s.id)).length;
    // Die N neuesten, die NICHT schon im Bestand sind (Datum desc; id als stabiler
    // Tiebreaker, §2-Determinismus). Ausschluss vor dem slice (25.9.2026): sonst
    // belegten Bestandsurteile Plätze der N und fielen danach im Dedupe weg.
    const gewaehlt = waehleNeue(ok, ausschluss, eidgPro, (xs) => [...xs]
      .sort((a, b) => (a.datum < b.datum ? 1 : a.datum > b.datum ? -1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0)));
    out.push(...gewaehlt);
    const spr = gewaehlt.reduce((m, s) => ((m[s.sprache] = (m[s.sprache] ?? 0) + 1), m), {} as Record<string, number>);
    console.log(`[eidg] ${court}: ${ok.length} geholt${ausschluss.size ? ` (davon ${imBestand} schon im Bestand)` : ''} → ${gewaehlt.length} gewählt (${Object.entries(spr).map(([k, v]) => `${k}:${v}`).join(' ')}; Datum ${spanne(gewaehlt)})`);
  }
  return { snaps: out, geholt };
}

/** docket → dateisicheres Slug-Tail (identisch zu mappeEntscheidOCL, §5). */
const docketSlug = (d: string) => d.replace(/\s+/g, '').replace(/[^A-Za-z0-9]/g, '_');

async function main() {
  // ── Rubrum-Satzzeichen (LM-127/LM-132) — OFFLINE, vor allen Netz-Zweigen ────
  if (rubrumRefresh) {
    const basis = ladeBestandSnapshots();
    if (!basis.length) {
      console.log('[rubrum-refresh] 0 Snapshots geladen (kein Bestand?) — Korpus unberührt.');
      return;
    }
    const defekt = /\s[,;:.]/;
    const vorher = basis.filter((s2) => defekt.test(s2.rubrum?.besetzung ?? '')).length;
    const proKanton = new Map<string, number>();
    for (const s2 of basis) {
      if (!defekt.test(s2.rubrum?.besetzung ?? '')) continue;
      proKanton.set(s2.kanton || 'BUND', (proKanton.get(s2.kanton || 'BUND') ?? 0) + 1);
    }
    // Der Writer säubert jeden Besetzungs-Freitext mit `bereinigeBesetzungsFreitext`
    // und schreibt die Snapshots neu; die Zählung danach liest die geschriebenen
    // Objekte (der Writer mutiert `snap.rubrum.besetzung` in place).
    const res = schreibeKorpus(basis, datum);
    const nachher = basis.filter((s2) => defekt.test(s2.rubrum?.besetzung ?? '')).length;
    console.log(`[rubrum-refresh] ${basis.length} Snapshots · Besetzung mit Whitespace vor Satzzeichen: ${vorher} → ${nachher}`);
    console.log(`[rubrum-refresh] vorher je Raum: ${[...proKanton].sort().map(([k, n]) => `${k}:${n}`).join(' ') || '—'}`);
    console.log(`[rubrum-refresh] geschrieben: ${res.anzahl} Manifest-Einträge, ${res.normBuckets} Norm-Buckets.`);
    if (nachher !== 0) { console.error('[rubrum-refresh] ABBRUCH-BEFUND: Rest > 0 — Regel greift nicht vollständig.'); process.exit(1); }
    return;
  }

  // ── Re-Map der normKeys (W2·6-NKEY) — OFFLINE, vor allen Netz-Zweigen ───────
  if (remap) {
    const basis = ladeBestandSnapshots();
    if (!basis.length) {
      console.log('[remap] 0 Snapshots geladen (kein Bestand?) — Korpus unberührt.');
      return;
    }
    const vorher = basis.filter((s) => (s.normKeys ?? []).length > 0).length;
    let veraendert = 0;
    // Alt-Keys, die die Neuberechnung nicht reproduziert, werden BEWAHRT statt
    // gelöscht — Regel und Begründung in `remapNormKeys` (§5: eine Stelle).
    // NUR das in ALT_ERHALTEN_ERWARTET Deklarierte darf so überleben; alles
    // andere bricht den Lauf ab, statt still zurückgeschrieben zu werden.
    let altErhaltenKeys = 0;
    let altErhaltenSnaps = 0;
    const bewahrt = new Map<string, readonly string[]>();
    // GEGENRICHTUNG der Sperre (Gegenprüfung R3): ein Alt-Key, den die
    // Literatur-Kontext-Regel soeben als Phantom entlarvt hat, darf NICHT bewahrt
    // werden — sonst schriebe dieser Lauf den Fix wieder weg. Die Ursache wird je
    // Snapshot mechanisch BELEGT (roher Text erzeugt den Key, bereinigter nicht),
    // nicht angenommen; alles andere läuft weiter in den fail-closed Abbruch.
    const litVerworfen = new Map<string, readonly string[]>();
    let litVerworfenKeys = 0;
    const sperrVerworfen = new Map<string, readonly string[]>();
    let sperrVerworfenKeys = 0;
    for (const s of basis) {
      const alt = s.normKeys ?? [];
      // Zweite Gegenrichtung (QS-KORPUS 25.9.2026): Keys, die NUR aus einem jetzt
      // in ABK_AUSSCHLUSS gesperrten Alias stammten (AIMP → IRSG …), je Snapshot
      // mechanisch belegt durch `sperrEntfernteNormKeys`, ebenfalls nicht bewahren.
      const gesperrt = new Set(sperrEntfernteNormKeys(s));
      const nichtBewahren = new Set([...literaturEntfernteNormKeys(s), ...gesperrt]);
      // ohne hint: rein aus dem Snapshot
      const { keys: neu, nurAlt, verworfen } = remapNormKeys(alt, normKeysVonSnapshot(s), nichtBewahren);
      if (nurAlt.length) {
        altErhaltenKeys += nurAlt.length;
        altErhaltenSnaps++;
        bewahrt.set(s.id, nurAlt);
      }
      const ausSperre = verworfen.filter((k) => gesperrt.has(k));
      const ausLiteratur = verworfen.filter((k) => !gesperrt.has(k));
      if (ausSperre.length) { sperrVerworfenKeys += ausSperre.length; sperrVerworfen.set(s.id, ausSperre); }
      if (ausLiteratur.length) {
        litVerworfenKeys += ausLiteratur.length;
        litVerworfen.set(s.id, ausLiteratur);
      }
      if (neu.length !== alt.length || neu.some((k, i) => k !== alt[i])) veraendert++;
      s.normKeys = neu;
    }
    const undeklariert = undeklarierteAltKeys(bewahrt, ALT_ERHALTEN_ERWARTET);
    if (undeklariert.length) {
      console.error(
        `\n[remap] ABBRUCH — ${undeklariert.length} Snapshot(s) mit nicht deklarierten `
        + 'Alt-Keys. Ein Alt-Key, den die Neuberechnung nicht reproduziert, kann ein '
        + 'legitimes Roh-Signal ODER eine soeben korrigierte Fehlzuordnung sein; '
        + 'welches von beidem, entscheidet kein Automatismus (§1/§6.7). Prüfen und '
        + 'entweder in ALT_ERHALTEN_ERWARTET (scripts/normtext-entscheide.ts) mit '
        + 'Herkunfts-Beleg deklarieren oder die Ursache beheben:',
      );
      for (const z of undeklariert) console.error(`  · ${z}`);
      process.exit(1);
    }
    const nachher = basis.filter((s) => s.normKeys.length > 0).length;
    const res = schreibeKorpus(basis, datum);
    console.log(`[remap] ${basis.length} Snapshots · normKeys verändert: ${veraendert}`);
    console.log(`[remap] mit ≥1 normKey: vorher ${vorher} → nachher ${nachher}`);
    console.log(`[remap] alt-erhalten: ${altErhaltenKeys} Keys über ${altErhaltenSnaps} Snapshots — alle deklariert (${ALT_ERHALTEN_ERWARTET.size} Eintrag/Einträge in ALT_ERHALTEN_ERWARTET).`);
    // Vollständig ausgeben, nicht bloss zählen: ein aus dem Bestand ENTFERNTER Key
    // ist eine Korrektur an ausgelieferten Daten und gehört ins Lauf-Protokoll (§8).
    console.log(`[remap] alt-verworfen (Literatur-Phantome, NICHT bewahrt): ${litVerworfenKeys} Keys über ${litVerworfen.size} Snapshots.`);
    for (const [id, keys] of [...litVerworfen].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))) {
      console.log(`  · ${id}: ${[...keys].join(', ')}`);
    }
    console.log(`[remap] alt-verworfen (gesperrtes Alias-Kürzel, ABK_AUSSCHLUSS, NICHT bewahrt): ${sperrVerworfenKeys} Keys über ${sperrVerworfen.size} Snapshots.`);
    for (const [id, keys] of [...sperrVerworfen].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))) {
      console.log(`  · ${id}: ${[...keys].join(', ')}`);
    }
    console.log(`[remap] geschrieben: ${res.anzahl} Manifest-Einträge, ${res.normBuckets} Norm-Buckets, ${res.artikelBuckets} Artikel-Buckets, ${res.shards} Shards.`);
    // §6.7: die Wirkung der Literatur-Kontext-Regel (Gegenprüfung R3) wird GEZÄHLT
    // ausgewiesen, nicht bloss behauptet. Springt eine der Zahlen gegenüber dem
    // Vorlauf, ist entweder die Extraktion, der Korpus oder die Marker-Liste gewandert.
    const lv = res.literaturVerwurf;
    console.log(`[remap] Literatur-Kontext-Regel: ${lv.spannen} Zitier-Apparat-Spannen entfernt, darin ${lv.nennungen} Roh-Nennungen; ${lv.paare} (Snapshot, Artikel)-Paare stammten AUSSCHLIESSLICH daraus.`);
    berichteBezuege(res.bezugsShards, res.bezugsBefund);
    return;
  }

  console.log(`[entscheide] Build ${datum} · BGE ${bgeVon ?? '–'} · Bund-Limit ${bundLimit} · Kantone [${kantCourts.join(',') || '–'}] je ${kantonPro}${additiv ? ` · ADDITIV eidg [${eidgCourts.join(',') || '–'}] je ${eidgPro}` : ''}`);

  // ── BGE-Band-Nachzug (W2·6): vollständige Bände additiv ergänzen ─────────────
  // Band-basiert (Q1-Quirk: date_from lässt platzhalter-datierte BGE fallen). Lädt
  // den committeten Bestand byte-treu, ergänzt NUR die noch fehlenden BGE der
  // Zielbände (Volltext-Merge + Kollisions-/Inversions-Quarantäne wie im Vollbau)
  // und reichert die NEUEN mit dreisprachiger clir-Regeste an (A18). §6: Bestand
  // (BGE 150–152 + Bund/Kanton/eidg) bleibt unverändert.
  if (bgeBaender.length) {
    const basis = ladeBestandSnapshots();
    const bestandIds = new Set(basis.map((s) => s.id));
    console.log(`[bge-baender] Zielbände [${bgeBaender.join(',')}] · Bestand ${basis.length} (davon BGE ${basis.filter((s) => s.gericht === 'bge').length}).`);

    const idZuRef = (id: string) =>
      id.replace(/^bge_/i, '').replace(/^BGE[_ ]/i, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    const alleIds = await enumeriereBgeBaender(bgeBaender);
    if (!alleIds.length) { console.log('[bge-baender] 0 IDs enumeriert (OCL nicht erreichbar?) — Korpus unberührt.'); return; }
    // Vollständigkeits-Ausweis je Band (gegen die amtliche Bandliste zu prüfen).
    const proBand: Record<number, number> = {};
    for (const id of alleIds) { const b = parseInt(idZuRef(id), 10); if (b) proBand[b] = (proBand[b] ?? 0) + 1; }
    console.log(`[bge-baender] enumeriert (band-basiert): ${alleIds.length} — ${Object.entries(proBand).sort((a, b) => +a[0] - +b[0]).map(([b, n]) => `${b}:${n}`).join(' ')}`);
    let neueIds = alleIds.filter((id) => !bestandIds.has(`bund/bge/${idZuRef(id).replace(/ /g, '_')}`));
    // §8-Quarantäne (W2·6 PR-B): BGE, deren amtliche bger.ch-clir-DE-Seite die mehrteilige
    // Regeste NICHT vollständig rendert. GELEERT (17.7.2026, GP-Befund): der Befund «DE-clir
    // amtlich degradiert» bleibt dokumentiert (Erstfall BGE 149 IV 1 / 6B_978/2020: DE-Seite
    // nur Teil a = Sterneintrag Art. 3 Abs. 1 lit. u UWG; Teil b = Strafantragslegitimation
    // des Bundes Art. 23 Abs. 2 i.V.m. Art. 10 Abs. 3 lit. b UWG liegt nur auf fr/it-clir +
    // im OCL-Flachtext), wird aber NICHT mehr zum Ausschluss genutzt: statt zu quarantänieren
    // wird der BGE über den etablierten Weg aufgenommen. Die flache `regeste.text` trägt
    // beide Teile treu; der Degradations-Guard (deClirDegradiert, unten) hängt die
    // unvollständige DE-Sprachfassung nicht an (statt die trilinguale Struktur zu korrumpieren
    // — A29-Tor bleibt grün). §8: aufnehmen ohne degradierte Anreicherung, nichts verloren.
    const QUARANTAENE_BGE = new Set<string>([]);
    const vorQuar = neueIds.length;
    neueIds = neueIds.filter((id) => !QUARANTAENE_BGE.has(idZuRef(id)));
    if (neueIds.length !== vorQuar) console.log(`[bge-baender] §8-Quarantäne: ${vorQuar - neueIds.length} BGE ausgeschlossen (bger.ch-DE-Regeste unvollständig): ${[...QUARANTAENE_BGE].join(', ')}`);
    console.log(`[bge-baender] davon neu (noch nicht im Bestand): ${neueIds.length}`);
    // Optionaler Deckel (Smoke-Test / gestaffelter Resume): die N ältesten neuen zuerst
    // (Enumeration ist date_desc → tail = älteste; deterministisch, §2).
    const neuLimit = Number(arg('--bge-neu-limit') ?? '0');
    if (neuLimit > 0 && neueIds.length > neuLimit) { neueIds = neueIds.slice(0, neuLimit); console.log(`[bge-baender] Deckel --bge-neu-limit=${neuLimit} → ${neueIds.length} bearbeitet.`); }

    // Amtliche aza↔BGE-Bindung + Urteilsdatum je BGE ZUERST aus dem bger.ch clir-
    // Urteilskopf (DE-Fassung; Cache geteilt mit der Regeste-Anreicherung) — OCLs
    // docket_number_2/Kopf-Regex sind nur Fallbacks (Befund Gegenprüfung 12.7.2026).
    const neu = (await mapLimit(neueIds, 4, async (id) => {
      const clirId = bgeRefZuClirId(idZuRef(id));
      const html = clirId ? await holeClirHtml(clirId, 'de', CLIR_CACHE, 300) : null;
      const kopf = html ? parseClirUrteilskopf(html) : { aza: null, datumIso: null };
      const s = await holeBgeLeitentscheid(id, datum, { azaAz: kopf.aza, datumFallback: kopf.datumIso });
      process.stdout.write(s ? (s.azaUrteil ? '.' : '·') : 'x');
      return s;
    })).filter((s): s is EntscheidSnapshot => !!s);
    process.stdout.write('\n');
    // Leer-Guard (§6): fehlgeschlagener Lauf entwertet nie den Bestand.
    if (neueIds.length && neu.length === 0) { console.log('[bge-baender] 0 geholt (Quelle nicht erreichbar?) — Korpus unberührt.'); return; }
    // Duplikat-Guard: nie ein bereits erfasstes id doppelt (idempotent bei Re-Run).
    // Konflations-Guard (§8, Band-Nachzug 25.9.2026): trägt der Sammlungs-Auszug ODER
    // der Volltext eines NEUEN BGE den laufenden Seitenkopf eines ANDEREN BGE desselben
    // Bandes, ist OCLs Basis-Record vermischt — Anlassfall 152 I 2: auszugAbschnitte
    // = vollständiger Text von 152 I 20, während Regeste (clir) und aza-Volltext
    // (1C_435/2024) korrekt waren. Der Tor-Wächter in check-entscheide.ts prüft nur
    // `abschnitte`, nicht den Auszug — darum hier VOR dem Schreiben: nicht aufnehmen
    // statt einen fremden Text unter der eigenen Fundstelle zeigen (wie Exakt-Id-Guard).
    const koerperText = (a: EntscheidSnapshot['abschnitte'] | undefined) => (a ?? []).flatMap((x) => x.bloecke.map((b) => b.text)).join('\n');
    const konflatiert: string[] = [];
    const neuUniq = neu.filter((s) => !bestandIds.has(s.id)).filter((s) => {
      const fremd = findeFremdeFundstelleImBody(koerperText(s.auszugAbschnitte), s.bgeReferenz)
        ?? findeFremdeFundstelleImBody(koerperText(s.abschnitte), s.bgeReferenz);
      if (fremd) konflatiert.push(`${s.bgeReferenz} (trägt Kopf von ${fremd})`);
      return !fremd;
    });
    if (konflatiert.length) console.log(`[bge-baender] §8-Konflations-Guard: ${konflatiert.length} neue BGE NICHT aufgenommen (OCL-Basis-Record vermischt): ${konflatiert.join(', ')}`);
    const mitVoll = neuUniq.filter((s) => s.azaUrteil).length;
    console.log(`[bge-baender] neu erfasst: ${neuUniq.length} (Volltext ${mitVoll}, Auszug ${neuUniq.length - mitVoll})`);

    // Kollisions-Quarantäne (§8) über den GANZEN BGE-Satz (Bestand + neu): teilt sich
    // ein aza-key auf mehrere BGE, ist ≥1 Zuordnung falsch → NUR die NEUEN Kollidierer
    // auf Auszug zurückstufen (die Bestands-Auflösungen wurden beim Bau validiert).
    const alleBge = [...basis.filter((s) => s.gericht === 'bge'), ...neuUniq];
    const azaN: Record<string, number> = {};
    for (const s of alleBge) if (s.azaUrteil) azaN[s.azaUrteil.key] = (azaN[s.azaUrteil.key] ?? 0) + 1;
    let quar = 0;
    for (const s of neuUniq) if (s.azaUrteil && azaN[s.azaUrteil.key] > 1) { aufAuszugZurueck(s); quar++; }
    if (quar) console.log(`[bge-baender] Kollisions-Quarantäne: ${quar} neue BGE auf Auszug zurückgestuft.`);

    // A18: dreisprachige, strukturierte clir-Regeste NUR für die neuen amtlichen BGE
    // (Bestand behält seine — §6 byte-treu). Cache (daten/cache/clir-regeste) macht
    // Re-Runs crawl-frei.
    const amtlichNeu = neuUniq.filter((s) => s.regeste && s.regesteAmtlich && s.bgeReferenz);
    const fassungen = await mapLimit(amtlichNeu, 2, async (s) => {
      const f = await holeRegesteSprachfassungen(s.bgeReferenz!, CLIR_CACHE, 300);
      process.stdout.write(f.length === 3 ? '.' : f.length ? '+' : 'x');
      return { s, f };
    });
    process.stdout.write('\n');
    let mitFassung = 0; const luecken: string[] = [];
    for (const { s, f } of fassungen) {
      // Degradations-Guard (§1): eine amtlich unvollständige DE-clir-Fassung NICHT
      // anhängen (sie würde die trilinguale Struktur korrumpieren, A29-Tor rot) — die
      // flache regeste.text trägt alle Teile treu weiter. Siehe deClirDegradiert.
      if (deClirDegradiert(s.regeste?.text, f)) {
        luecken.push(`${s.bgeReferenz} [DE-clir degradiert (nur Teil a) — flache Regeste trägt alle Teile, §1]`);
      } else if (f.length && f.some((x) => x.sprache === 'de')) {
        s.regeste = { ...s.regeste!, sprachfassungen: f };
        mitFassung++;
        if (f.length < 3) luecken.push(`${s.bgeReferenz} [${f.map((x) => x.sprache).join('/')}]`);
      } else luecken.push(`${s.bgeReferenz} [ohne dt. clir-Regeste — §1 unverändert]`);
    }
    console.log(`[bge-baender] clir-Regeste: ${mitFassung}/${amtlichNeu.length} neue BGE dreisprachig strukturiert.`);
    if (luecken.length) console.log(`[bge-baender] nicht vollständig dreisprachig (${luecken.length}): ${luecken.join(', ')}`);

    // Dedup wie im Vollbau: ein bger-Routine-Bestand, der jetzt als BGE-aza-Volltext
    // dient, würde sonst doppelt geführt (Leit-UND-Routine, §8) → aus dem Bestand nehmen.
    const neueAzaIds = new Set(neuUniq.filter((s) => s.azaUrteil).map((s) => `bund/bger/${docketSlug(s.azaUrteil!.aktenzeichen)}`));
    const basisGefiltert = basis.filter((s) => !(s.gericht === 'bger' && neueAzaIds.has(s.id)));
    if (basisGefiltert.length !== basis.length) console.log(`[bge-baender] ${basis.length - basisGefiltert.length} bger-Routine-Einträge entfernt (nun BGE-aza-Volltext).`);

    const seen = new Set<string>();
    const auswahl = [...basisGefiltert, ...neuUniq].filter((s) => { if (seen.has(s.id)) return false; seen.add(s.id); return true; });
    const res = schreibeKorpus(auswahl, datum);
    console.log(`[bge-baender] geschrieben: ${res.anzahl} Manifest-Einträge (Bestand ${basisGefiltert.length} + neu ${neuUniq.length} BGE), ${res.normBuckets} Norm-Buckets.`);
    return;
  }

  // ── Regeste-Refresh (W2·6-B B1+B2+A18): amtliche BGE anreichern ──────────────
  if (regesteRefresh) {
    const basis = ladeBestandSnapshots();
    const bge = basis.filter((s) => s.gericht === 'bge');
    console.log(`[regeste-refresh] Bestand ${basis.length}, davon ${bge.length} BGE.`);

    // ── B1: BGE ohne Vollurteil (azaUrteil:null) via aza-Resolver nachladen ──
    // Amtliches Urteilsdatum + eigenes aza-Az. ZUERST aus dem bger.ch clir-Urteilskopf
    // holen (wie im Band-Nachzug, --bge-baender) — OCLs decision_date ist bei etlichen
    // BGE ein Platzhalter/Fehlwert (Befund 12.9.2026, bge_151_II_475: persistiert war
    // 1999-06-21 = Datum des in der Regeste zitierten Luftverkehrsabkommens, nicht des
    // Urteils; amtlich verifiziert 2C_64/2023 vom 26.11.2024, bger.ch clir + aktuelle
    // OCL-decision_date stimmen überein). Ohne kopf.datumFallback bliebe ein
    // Auszug-only-Treffer auf den gröberen Bandjahr-Platzhalter angewiesen.
    const b1 = bge.filter((s) => !s.azaUrteil);
    console.log(`[b1] ${b1.length} BGE ohne Vollurteil → aza-Resolver (bger.ch/OCL)`);
    const b1neu = await mapLimit(b1, 3, async (s) => {
      const clirId = s.bgeReferenz ? bgeRefZuClirId(s.bgeReferenz) : null;
      const html = clirId ? await holeClirHtml(clirId, 'de', CLIR_CACHE, 300) : null;
      // A1 (Gegenprüfungs-Auflage 12.9.2026, PR #816): eine NETZSTÖRUNG beim
      // clir-Kopf-Fetch (html === null, obwohl eine clirId existiert) darf NIE mit
      // degradiertem kopf (aza:null, datumIso:null) weiterverarbeitet werden — sonst
      // fiele holeBgeLeitentscheid im Auszug-only-Fall auf den groben Bandjahr-
      // Platzhalter zurück und würde ein bereits exaktes Bestandsdatum verschlechtern.
      // Dieser Kandidat bleibt für den nächsten Lauf offen (Bestand unangetastet).
      if (clirId && html === null) {
        process.stdout.write('n');
        return { id: s.id, neu: null as EntscheidSnapshot | null };
      }
      const kopf = html ? parseClirUrteilskopf(html) : { aza: null, datumIso: null };
      const neu = await holeBgeLeitentscheid(
        s.id.replace(/^bund\/bge\//, ''), datum, { azaAz: kopf.aza, datumFallback: kopf.datumIso },
      );
      process.stdout.write(neu?.azaUrteil ? '.' : neu ? '·' : 'x');
      return { id: s.id, neu };
    });
    process.stdout.write('\n');
    if (b1.length && b1neu.every((x) => !x.neu)) {
      console.log('[b1] 0 Ergebnisse (OCL nicht erreichbar?) — Korpus unberührt.'); return;
    }
    // Wurzel-Fix (Fund 12.9.2026, W2·18-FEHLERBUCH): ein frisches Auszug-only-
    // Ergebnis (azaUrteil:null) wurde bisher hier VERWORFEN — der korrigierte
    // Datums-Fallback (kopf.datumFallback bzw. Bandjahr-Platzhalter statt eines
    // fehlerhaften decision_date) blieb dadurch stumm ungeschrieben und der alte
    // Fehlwert stand weiter im Bestand. Jetzt wird jedes erfolgreich geholte
    // Ergebnis übernommen (auch Auszug-only) — AUSSER es verschlechtert das Datum
    // (A1, `verschlechtertDatum`: ein bereits exaktes Bestandsdatum wird NIE durch
    // den groben Bandjahr-Platzhalter ersetzt). Ein gescheiterter Fetch
    // (neu === null) lässt den Bestandseintrag ohnehin unangetastet.
    // B (Gegenprüfungs-Auflage 12.9.2026, PR #816): `neu` ERSETZTE bisher den
    // ganzen Bestandseintrag — `regeste.sprachfassungen` stammt aber aus einem
    // ANDEREN Refresh-Zweig (B2/A18, `holeRegesteSprachfassungen`), nicht aus
    // `holeBgeLeitentscheid`, und ging beim reinen Überschreiben verloren (6/6
    // betroffene BGE, korpusweit 1258→1252 mit Sprachfassungen). `mergeB1Ergebnis`
    // holt sie zurück, wenn der flache Regeste-Text unverändert ist.
    const b1ById = new Map(b1.map((s) => [s.id, s]));
    const byId = new Map<string, EntscheidSnapshot>();
    for (const { id, neu: neuRoh } of b1neu) {
      if (!neuRoh) continue;
      const alt = b1ById.get(id)!;
      const neu = mergeB1Ergebnis(alt, neuRoh);
      if (verschlechtertDatum(alt, neu)) {
        console.log(`[b1] ${alt.bgeReferenz}: frisches Ergebnis verschlechtert das Datum (${alt.datum} → ${neu.datum}) — verworfen (A1).`);
        continue;
      }
      byId.set(neu.id, neu);
    }
    for (let i = 0; i < basis.length; i++) { const r = byId.get(basis[i].id); if (r) basis[i] = r; }
    // Kollisions-Quarantäne (§8) über ALLE BGE: teilt sich ein aza-key auf mehrere
    // BGE (OCL-Konflation, z.B. «152 V 2»↔«152 V 20»), ist ≥1 Zuordnung falsch → die
    // FRISCH aufgelösten mit kollidierendem key auf Auszug zurückstufen (die 260
    // Bestands-Auflösungen wurden beim Bau validiert; nie ein frischer Fehl-Body).
    const azaN: Record<string, number> = {};
    for (const s of basis) if (s.gericht === 'bge' && s.azaUrteil) azaN[s.azaUrteil.key] = (azaN[s.azaUrteil.key] ?? 0) + 1;
    let quar = 0;
    for (const s of basis) if (s.gericht === 'bge' && byId.has(s.id) && s.azaUrteil && azaN[s.azaUrteil.key] > 1) { aufAuszugZurueck(s); quar++; }
    const geloest = [...byId.values()].filter((s) => s.azaUrteil && azaN[s.azaUrteil.key] === 1).length;
    console.log(`[b1] aufgelöst: ${geloest} · Kollisions-Quarantäne: ${quar} · weiterhin Auszug: ${b1.length - geloest}`);

    // ── B2 + A18: strukturierte, dreisprachige Regeste (bger.ch clir) an alle amtl. BGE ──
    const amtlich = basis.filter((s) => s.gericht === 'bge' && s.regeste && s.regesteAmtlich && s.bgeReferenz);
    const fassungenAlle = await mapLimit(amtlich, 2, async (s) => {
      const f = await holeRegesteSprachfassungen(s.bgeReferenz!, CLIR_CACHE, 300);
      process.stdout.write(f.length === 3 ? '.' : f.length ? '+' : 'x');
      return { s, f };
    });
    process.stdout.write('\n');
    let mitFassung = 0, ohne = 0; const luecken: string[] = [];
    for (const { s, f } of fassungenAlle) {
      // Degradations-Guard (§1, wie im Band-Nachzug): unvollständige DE-clir-Fassung
      // nicht anhängen — flache regeste.text trägt alle Teile. Behält 149 IV 1 & Co.
      // auch bei einem künftigen Vollrefresh flach statt sie zu re-degradieren.
      if (deClirDegradiert(s.regeste?.text, f)) {
        ohne++; luecken.push(`${s.bgeReferenz} [DE-clir degradiert (nur Teil a) — flache Regeste trägt alle Teile, §1]`);
      } else if (f.length && f.some((x) => x.sprache === 'de')) {
        s.regeste = { ...s.regeste!, sprachfassungen: f };
        mitFassung++;
        if (f.length < 3) luecken.push(`${s.bgeReferenz} [${f.map((x) => x.sprache).join('/')}]`);
      } else { ohne++; luecken.push(`${s.bgeReferenz} [KEINE — §1 unverändert]`); }
    }
    console.log(`[b2/a18] ${mitFassung}/${amtlich.length} BGE mit strukturierter Regeste; ${ohne} ohne.`);
    if (luecken.length) console.log(`[b2/a18] Nicht vollständig dreisprachig/leer (${luecken.length}): ${luecken.join(', ')}`);

    const res = schreibeKorpus(basis, datum);
    console.log(`[regeste-refresh] geschrieben: ${res.anzahl} Manifest-Einträge, ${res.normBuckets} Norm-Buckets.`);
    return;
  }

  // ── Additiver Lauf (Batch 3): Bestand von der Platte + neue eidg./kant. Gerichte ──
  // Zieht den committeten Korpus (272 BGE/Bund/Kanton) NICHT über die Live-API neu
  // (§6: kein Drift), sondern lädt ihn byte-treu von der Platte und ergänzt nur die
  // frisch geholten BVGer/BStGer/BPatGer-Urteile (--eidg) und — seit 25.9.2026 —
  // kantonale Urteile (--courts/--kanton-pro). Schreibt über denselben Writer (§5).
  if (additiv) {
    let basis = ladeBestandSnapshots();
    console.log(`[additiv] Bestand geladen: ${basis.length} Snapshots (Verweise rekonstruiert der Writer).`);
    if (bgeRefresh) {
      const gekappt = (s: EntscheidSnapshot) =>
        [...(s.abschnitte ?? []), ...(s.auszugAbschnitte ?? [])]
          .some((a) => a.bloecke.some((b) => /(?<!\()…\s*$/u.test(b.text)));
      const zu = basis.filter((s) => s.gericht === 'bge' && gekappt(s));
      console.log(`[bge-refresh] ${zu.length} gekappte BGE → frisch nachladen (W2·6-BGE)`);
      const frisch = (await mapLimit(zu, 4, async (s) => {
        const neu = await holeBgeLeitentscheid(s.id.replace(/^bund\/bge\//, ''), datum);
        process.stdout.write(neu ? '.' : 'x');
        return neu;
      })).filter((s): s is EntscheidSnapshot => !!s);
      process.stdout.write('\n');
      // Leer-Guard (§6): nie den Bestand durch einen fehlgeschlagenen OCL-Lauf entwerten.
      if (zu.length && frisch.length === 0) {
        console.log('[bge-refresh] 0 geholt (Quelle nicht erreichbar?) — Korpus unberührt.');
        return;
      }
      const byId = new Map(frisch.map((s) => [s.id, s]));
      basis = basis.map((s) => byId.get(s.id) ?? s);
      // Kollisions-Quarantäne über den GANZEN BGE-Satz nach dem Ersetzen (§8, wie im Vollbau).
      const alleBge = basis.filter((s) => s.gericht === 'bge');
      const azaN: Record<string, number> = {};
      for (const s of alleBge) if (s.azaUrteil) azaN[s.azaUrteil.key] = (azaN[s.azaUrteil.key] ?? 0) + 1;
      let quar = 0;
      for (const s of alleBge) if (s.azaUrteil && azaN[s.azaUrteil.key] > 1) { aufAuszugZurueck(s); quar++; }
      if (quar) console.log(`[bge-refresh] Kollisions-Quarantäne: ${quar} auf Auszug zurückgestuft.`);
      console.log(`[bge-refresh] ${frisch.length}/${zu.length} BGE ersetzt.`);
    }
    // Eidg. (--eidg) und kantonale (--courts, seit 25.9.2026) Gerichte: je Gericht die
    // N neuesten, die NOCH NICHT im Bestand sind. Zusammenführen + Leer-Guard (je
    // Zweig: angefordert, aber 0 geholt ⇒ Korpus unberührt) im reinen Kern
    // `entscheide-additiv.ts` (Unit-Test: src/tests/entscheide-additiv.test.ts).
    const bestandIds = new Set(basis.map((s) => s.id));
    const eidg = eidgCourts.length ? await eidgKorpus(bestandIds) : { snaps: [], geholt: 0 };
    const kanton = kantCourts.length ? await kantonKorpus(bestandIds) : { snaps: [], geholt: 0 };
    const erg = fuehreAdditivZusammen(basis, [
      { name: 'eidg.', angefordert: eidgCourts.length, geholt: eidg.geholt, neu: eidg.snaps },
      { name: 'kantonale', angefordert: kantCourts.length, geholt: kanton.geholt, neu: kanton.snaps },
    ]);
    if (erg.abbruch) {
      console.log(erg.abbruch);
      return;
    }
    const res = schreibeKorpus(erg.auswahl, datum);
    console.log(`[additiv] geschrieben: ${res.anzahl} Manifest-Einträge (Bestand ${basis.length} + neu ${erg.neuJeZweig['eidg.'] ?? 0} eidg. + ${erg.neuJeZweig['kantonale'] ?? 0} kantonal), ${res.normBuckets} Norm-Buckets.`);
    return;
  }

  const bge = bgeVon ? await bgeKorpus() : [];
  // Kollisions-Quarantäne (§8): griff dieselbe aza-id für ZWEI BGE, ist mindestens eine
  // Zuordnung falsch (OCL-Quirk/zitiertes Präjudiz) — beide auf Auszug zurückstufen, nie
  // ein potenziell falscher Volltext unter einem Leitentscheid.
  const azaN: Record<string, number> = {};
  for (const s of bge) if (s.azaUrteil) azaN[s.azaUrteil.key] = (azaN[s.azaUrteil.key] ?? 0) + 1;
  let quar = 0;
  for (const s of bge) if (s.azaUrteil && azaN[s.azaUrteil.key] > 1) { aufAuszugZurueck(s); quar++; }
  if (quar) console.log(`[bge] Kollisions-Quarantäne: ${quar} BGE auf Auszug zurückgestuft (aza-Mehrfachzuordnung).`);
  const bund = await bundKorpus();
  const kanton = kantCourts.length ? (await kantonKorpus()).snaps : [];

  // Dedup (Budget + §8): bger-Urteile, die bereits als BGE-Volltext erfasst sind, nicht
  // zusätzlich als Routine-Eintrag führen (sonst derselbe Entscheid als Leit- UND Routine).
  const bgeAzaIds = new Set(
    bge.filter((s) => s.azaUrteil).map((s) => `bund/bger/${docketSlug(s.azaUrteil!.aktenzeichen)}`),
  );
  const bundGefiltert = bund.filter((s) => !bgeAzaIds.has(s.id));

  // Vereinen + global dedupen (id stabil; BGE ZUERST = kanonisch bei Kollision).
  const seen = new Set<string>();
  const auswahl = [...bge, ...bundGefiltert, ...kanton].filter((s) => { if (seen.has(s.id)) return false; seen.add(s.id); return true; });

  // Leer-Guard: nie einen bestehenden Korpus durch einen fehlgeschlagenen Lauf überschreiben.
  if (auswahl.length === 0) {
    console.log('[entscheide] 0 Treffer (Quelle nicht erreichbar?) — bestehender Korpus bleibt unberührt.');
    return;
  }
  const res = schreibeKorpus(auswahl, datum);
  const bgeN = auswahl.filter((s) => s.gericht === 'bge').length;
  const kantN = auswahl.filter((s) => s.kanton !== 'CH').length;
  console.log(`[entscheide] geschrieben: ${res.anzahl} Snapshots (BGE ${bgeN}, Bund ${res.anzahl - bgeN - kantN}, Kanton ${kantN}), ${res.normBuckets} Norm-Buckets.`);
  berichteBezuege(res.bezugsShards, res.bezugsBefund);
}

main().catch((e) => { console.error(e); process.exit(1); });
