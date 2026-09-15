/**
 * Orchestrator: erzeugt public/normtext/bund/<GESETZ>.json für alle Gesetze
 * aus scripts/fedlex-cache.sh.
 *
 * Aufruf: npm run normtext -- --datum=YYYY-MM-DD
 * (Das datum kommt aus der Shell: --datum=$(date +%F), NIEMALS new Date() im Skript)
 *
 * §2: kein Date.now()/Math.random() in Logik.
 * §8: keine stillen Fehler — übersprungene Anker werden am Ende aufgelistet.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { parseFedlexCacheEintraege } from './normtext/inventar-bund.ts';
import { pinIdentitaet, pinBefund, warFrischGeschrieben } from './normtext/cache-pin-befund.ts';
import {
  extrahiereArtikel,
  alleArtikelTokens,
  alleSchlussteilAnker,
  extrahiereArtikelAusAnker,
  ankerZuToken,
  schlussteilLabelSuffix,
  alleAnhangAnker,
  extrahiereAnhang,
  anhangLabelVonAnker,
  artikelRohHtml,
} from './normtext/extrahiere-fedlex.ts';
import { doppelIdLabel } from './normtext/doppel-id-label.ts';
import {
  sammleKantonInventar,
  sammleFallback,
  sammleHtmInventar,
  sammleZhPdfInventar,
  sammlePdfInventar,
  parseKantonNurFilter,
  baueKantonNurInventar,
  type KantonInventarGruppe,
} from './normtext/inventar-kanton.ts';
import { enumeriereKanton } from './normtext/lexfind-discovery.ts';
import { discoveryZuInventar } from './normtext/kanton-discovery-quellen.ts';
import pLimit from 'p-limit';
import { holeLexWork } from './normtext/adapter-lexwork.ts';
import { sha256Bloecke } from './normtext/sha-bloecke.ts';
import { holeHtm } from './normtext/adapter-htm.ts';
import { holeZhPdf } from './normtext/adapter-zh-pdf.ts';
import { holePdf, PDF_PROFILE } from './normtext/adapter-pdf.ts';

// Höfliche Nebenläufigkeit gegen Amtsserver (Werkzeug-Audit §Audit-1): die
// Kantons-/HTM-/ZH-/PDF-Fetch-Schleifen holen bis zu FETCH_CONCURRENCY Quellen
// gleichzeitig. DETERMINISMUS: nur die (reinen, seiteneffektfreien) FETCHES
// laufen parallel; die Ergebnisse werden danach in UNVERÄNDERTER Inventar-
// Reihenfolge verarbeitet (Reports, Dateinamen, goldenIndex, §8-Fehlerpfade
// byte-identisch). Der Bund-Loop bleibt seriell (DB-Flip). */
const FETCH_CONCURRENCY = 4;
import { pdfLawIdSafe } from './normtext/lawid-safe.ts';
import { baueManifest } from './normtext/kanton-manifest.ts';
import { mischeGoldenKanton, mischeGoldenVollLauf } from './normtext/golden-kanton-merge.ts';
import { baueBrowseManifest } from './normtext/browse-manifest.ts';
import type { NormSnapshot, NormSnapshotDatei } from '../src/lib/normtext/typen.ts';
import type { BildRef } from './normtext/extrahiere-fedlex.ts';

// ── Argument --datum= auslesen ────────────────────────────────────────────────
function leseDatum(): string {
  const arg = process.argv.find((a) => a.startsWith('--datum='));
  if (!arg) {
    throw new Error(
      'Pflicht-Argument fehlt: --datum=YYYY-MM-DD\n' +
        'Aufruf: npm run normtext -- --datum=$(date +%F)',
    );
  }
  const datum = arg.slice('--datum='.length);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) {
    throw new Error(`Ungültiges Datumsformat: "${datum}" — erwartet YYYY-MM-DD`);
  }
  return datum;
}

// ── Erlass-Abkürzungs-Map ─────────────────────────────────────────────────────
const ERLASS_MAP: Record<string, string> = {
  emrk: 'EMRK', eoebv: 'EÖBV', avg: 'AVG', or: 'OR', // +3 QS-KORPUS 14.9.2026 (zeilen-neutral, §6.6-Deckel erschoepft)
  zgb: 'ZGB',
  zpo: 'ZPO',
  schkg: 'SchKG',
  arg: 'ArG',
  vmwg: 'VMWG',
  stpo: 'StPO',
  vwvg: 'VwVG',
  bgg: 'BGG',
  bgerr: 'BGerR',
  vvg: 'VVG',
  hregv: 'HRegV',
  gebv_hreg: 'GebV-HReg',
  gebv_schkg: 'GebV SchKG',
  stgb: 'StGB',
  stg: 'StG',
  kvg: 'KVG',
  kvv: 'KVV',
  // Erweiterung 17.6.2026 (jedes zitierte Bundesgesetz mit Volltext-Snapshot).
  mwstg: 'MWSTG',
  urg: 'URG',
  bewg: 'BewG',
  eog: 'EOG',
  svg: 'SVG',
  dsg: 'DSG',
  bbg: 'BBG',
  gbv: 'GBV',
  jstpo: 'JStPO',
  // Volltext-Ausbau Bund 23.6.2026 (Promotion aus nur-live-link-Stubs)
  partg: 'PartG',
  jstg: 'JStG',
  iprg: 'IPRG',
  betmg: 'BetmG',
  vstrr: 'VStrR',
  // Batch 2 (23.6.2026)
  atsg: 'ATSG',
  bvg: 'BVG',
  uvg: 'UVG',
  avig: 'AVIG',
  rpg: 'RPG',
  usg: 'USG',
  vgg: 'VGG',
  bgfa: 'BGFA',
  kkg: 'KKG',
  gwg: 'GwG',
  // Batch 3 (23.6.2026)
  ivg: 'IVG',
  famzg: 'FamZG',
  sthg: 'StHG',
  aig: 'AIG',
  asylg: 'AsylG',
  glg: 'GlG',
  finmag: 'FINMAG',
  bgbb: 'BGBB',
  // Batch 4 (23.6.2026)
  ahvg: 'AHVG',
  bankg: 'BankG',
  hmg: 'HMG',
  // ── Punkt 12 Batch 2 (24.6.2026, Bund-VERORDNUNGEN Volltext) ──
  ahvv: 'AHVV',
  ivv: 'IVV',
  elv: 'ELV',
  bvv_2: 'BVV 2',
  uvv: 'UVV',
  aviv: 'AVIV',
  atsv: 'ATSV',
  klv: 'KLV',
  mwstv: 'MWSTV',
  vstv: 'VStV',
  vzae: 'VZAE',
  vrv: 'VRV',
  vzv: 'VZV',
  ssv: 'SSV',
  dsv: 'DSV',
  argv1: 'ArGV 1',
  bewv: 'BewV',
  buev: 'BüV',
  fzv: 'FZV',
  kov: 'KOV',
  rpv: 'RPV',
  vbb: 'VFRR',
  voeb: 'VöB',
  vzg: 'VZG',
  bvv3: 'BVV 3',
  mvv: 'MVV',
  eov: 'EOV',
  famzv: 'FamZV',
  argv2: 'ArGV 2',
  argv3: 'ArGV 3',
  argv4: 'ArGV 4',
  vev: 'VEV',
  vinta: 'VIntA',
  asylv1: 'AsylV 1',
  asylv2: 'AsylV 2',
  asylv3: 'AsylV 3',
  gschv: 'GSchV',
  lrv: 'LRV',
  lsv: 'LSV',
  vvea: 'VVEA',
  chemv: 'ChemV',
  nhv: 'NHV',
  wav: 'WaV',
  vts: 'VTS',
  bankv: 'BankV',
  kkv: 'KKV',
  erv: 'ERV',
  finiv: 'FINIV',
  finfrav: 'FinfraV',
  fidlev: 'FIDLEV',
  avo: 'AVO',
  gwv_finma: 'GwV-FINMA',
  vam: 'VAM',
  ambv: 'AMBV',
  mepv: 'MepV',
  epv: 'EpV',
  bpv: 'BPV',
  rvov: 'RVOV',
  vgke: 'VGKE',
  betmkv: 'BetmKV',
  qstv: 'QStV',
  // ── Punkt 12 Batch 3 (25.6.2026): Promotion nur-live-link-Stub → Volltext ──
  sortg: 'SortG',
  prg: 'PRG',
  beg: 'BEG',
  mstg: 'MStG',
  mstp: 'MStP',
  irsg: 'IRSG',
  mvg: 'MVG',
  eng: 'EnG',
  co2_gesetz: 'CO2-Gesetz',
  epg: 'EpG',
  txg: 'TxG',
  lmg: 'LMG',
  lfg: 'LFG',
  ebg: 'EBG',
  fmg: 'FMG',
  mg: 'MG',
  zstv: 'ZStV',
  thg: 'THG',
  bgbm: 'BGBM',
  // ── Punkt 12 Batch 3 (25.6.2026): kuratierte zentrale Bundes-VERORDNUNGEN ──
  mschv: 'MSchV',
  patv: 'PatV',
  desv: 'DesV',
  urv: 'URV',
  tgbv: 'TGBV',
  bkv: 'BKV',
  zentv: 'ZentV',
  vkkg: 'VKKG',
  argv5: 'ArGV 5',
  vvk: 'VVK',
  vkl: 'VKL',
  vfv: 'VFV',
  bbv: 'BBV',
  bmv: 'BMV',
  // Totalrevision derselben SR 412.103.1 (12.9.2026): `bmv` = historische
  // Fassung von 2009 (aufgehoben 1.3.2026), `bmv_2025` = die seit 1.3.2026
  // geltende Verordnung vom 13. Juni 2025. Beide tragen amtlich das Kürzel BMV
  // — der Register-key (Datei-Stamm) unterscheidet sie, nicht das Kürzel.
  bmv_2025: 'BMV',
  zemis_v: 'ZEMIS-V',
  adov: 'AdoV',
  rdv: 'RDV',
  zavv: 'ZAV',
  akkbv: 'AkkBV',
  finfrav_finma: 'FinfraV-FINMA',
  finma_gebv: 'FINMA-GebV',
  kkv_finma: 'KKV-FINMA',
  nbv: 'NBV',
  pavo: 'PAVO',
  vgr: 'VGR',
  skv: 'SKV',
  vvv: 'VVV',
  vil: 'VIL',
  fdv: 'FDV',
  fav: 'FAV',
  uvpv: 'UVPV',
  chemrrv: 'ChemRRV',
  veva: 'VeVA',
  vgvp: 'VGV',
};

// ── Konsolidierungsdatum YYYYMMDD → ISO YYYY-MM-DD ───────────────────────────
function konsZuIso(kons: string): string {
  return `${kons.slice(0, 4)}-${kons.slice(4, 6)}-${kons.slice(6, 8)}`;
}

// ── Artikel-Label: token → 'Art. 335c' ───────────────────────────────────────
function artikelLabel(token: string): string {
  // Sammel-/Bereichs-Artikel (Fedlex fasst aufgehobene Artikel zusammen, Token
  // «26_28», «28_d_28_f») korrekt mit Trennstrich darstellen (Befund 25.6.2026:
  // vorher «Art. 2628»). Regel: «_» VOR einer Ziffer = Bereichsgrenze → «–»;
  // «_» vor einem Buchstaben = Sub-Artikel («335_c» → «335c») → entfernen.
  // Reine Label-Ableitung; fliesst nicht in den sha (kein Drift-Token).
  return 'Art. ' + token.replace(/_(?=\d)/g, '–').replace(/_/g, '');
}

// ── Token-Sortierung: numerisch nach Artikel-Nr., dann Suffix ─────────────────
// '2' < '10' < '27' < '27_a' < '335' < '335_bis'. Deterministische, diff-stabile
// Reihenfolge der Snapshot-Einträge je Datei.
function sortiereTokens(tokens: string[]): string[] {
  const num = (t: string): number => {
    const m = t.match(/^(\d+)/);
    return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
  };
  return [...tokens].sort((a, b) => {
    const d = num(a) - num(b);
    return d !== 0 ? d : a.localeCompare(b);
  });
}

// ── SHA256 des Block-Texts INKL. Aufzählungs-Items ───────────────────────────
// Der sha muss auch die items abdecken, sonst erkennt der Drift-Check
// Inhaltsänderungen in den lit./Ziff.-Punkten nicht. marke + text je item
// fliessen ein (Reihenfolge stabil).
// ─── Bilder herunterladen + selbst hosten (Bilder&Formeln 1.7.2026) ─────────
// Der Extraktor hat je Bild die RELATIVE Quell-src («image/imageN.png») erfasst.
// Hier: → absolute Filestore-URL (gleiche Basis wie fedlex-cache.sh), herunterladen
// nach public/normtext/bilder/<erlass>/, sha über die Bytes, `datei` auf den lokalen
// Pfad setzen. IDEMPOTENT (Datei existiert → nur sha aus den Bytes; kein Re-Fetch).
// ESCAPE-HATCH: Nicht-200 / Content-Type ≠ image/* → Build-Fehler (nie stilles Loch).
const BILDER_BASIS = 'https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli';

async function ladeBilder(
  bloecke: Array<{ bild?: BildRef; bildKacheln?: Array<{ bild?: BildRef }> }>,
  name: string,
  eli: string,
  konsolidierung: string,
): Promise<void> {
  const nameLc = name.toLowerCase();
  const dir = `public/normtext/bilder/${nameLc}`;
  const base = `${BILDER_BASIS}/${eli}/${konsolidierung}/de/html/`;
  const refs: BildRef[] = [];
  for (const b of bloecke) {
    if (b.bild) refs.push(b.bild);
    for (const k of b.bildKacheln ?? []) if (k.bild) refs.push(k.bild);
  }
  for (const ref of refs) {
    if (ref.sha) continue; // im selben Lauf bereits verarbeitet
    const relName = ref.datei.split('/').pop() ?? ref.datei; // imageN.png
    const lokal = `${dir}/${relName}`;
    let bytes: Buffer;
    if (existsSync(lokal)) {
      bytes = readFileSync(lokal);
    } else {
      const url = `${base}${ref.datei}`; // base + «image/imageN.png»
      const res = await fetch(url);
      const ct = res.headers.get('content-type') ?? '';
      if (!res.ok || !ct.startsWith('image/')) {
        throw new Error(
          `[Bilder] Download fehlgeschlagen: ${name} ${url} → http=${res.status}, type=${ct}. ` +
            `(Filestore-URL instabil? Escape-Hatch: Erlass ausnehmen statt stilles Bild-Loch.)`,
        );
      }
      bytes = Buffer.from(await res.arrayBuffer());
      mkdirSync(dir, { recursive: true });
      writeFileSync(lokal, bytes);
    }
    ref.sha = createHash('sha256').update(bytes).digest('hex');
    ref.datei = `bilder/${nameLc}/${relName}`;
  }
}

// sha256Bloecke → geteilte Definition (§5 SSoT), siehe unten importiert.

// ── Stabile JSON-Ausgabe (sortierte Schlüssel) ────────────────────────────────
function stabelesJson(obj: unknown): string {
  return JSON.stringify(obj, null, 2);
}

// ── Cache-Inhalts-Sonde ───────────────────────────────────────────────────────
//
// Fundort des Defekts: Gegenprüfung #419, Befund N1 (Vorbestand auf main). Bis
// zum 3.8.2026 prüfte sicherstelleCaches NUR existsSync. Eine als Datei
// abgelegte Soft-404-«Casemates»-Angular-Shell (HTTP 200, ~9 kB, kein Normtext)
// galt damit als gültiger Cache — der Snapshot wäre aus einer leeren SPA-Hülle
// gebaut worden, statt laut zu scheitern (scraping-Fakt: nach Body urteilen,
// nie nach Status).
//
// §5-Hinweis zur Doppelung: dieselbe Sonde steht in scripts/fedlex-cache.sh
// (Grösse :449, Shell-Marker :463, Anker-Zahl :469). Bash und TypeScript können
// keine Funktion teilen; die drei Werte sind darum bewusst dupliziert statt
// wegabstrahiert (§1 — lieber ein sichtbares Duplikat als eine Brücke, die zwei
// Laufzeiten stillschweigend gleichsetzt). Wer dort schraubt, zieht hier nach.
// Die Sonde greift dort beim DOWNLOAD, hier beim LESEN eines vorhandenen Caches.
const CACHE_MINDESTGROESSE = 20_000; // fedlex-cache.sh:449
const CACHE_SHELL_MARKER = /<title>Casemates<\/title>|ng-version|<app-root/; // :463
const CACHE_ANKER_MARKER = /id="(art_|annex_|lvl_)/; // :469

export type CacheBefund = { ok: boolean; grund?: string };

/** Urteilt über einen /tmp-HTML-Cache nach INHALT, nicht nach blosser Existenz. */
export function cacheBefund(name: string): CacheBefund {
  const pfad = `/tmp/${name}.html`;
  if (!existsSync(pfad)) return { ok: false, grund: 'fehlt' };
  let roh: string;
  try {
    roh = readFileSync(pfad, 'utf8');
  } catch (e) {
    return { ok: false, grund: `unlesbar (${(e as Error).message})` };
  }
  const bytes = Buffer.byteLength(roh, 'utf8');
  if (bytes < CACHE_MINDESTGROESSE)
    return { ok: false, grund: `nur ${bytes} B < ${CACHE_MINDESTGROESSE} B (SPA-Shell/Fehlerseite?)` };
  if (CACHE_SHELL_MARKER.test(roh))
    return { ok: false, grund: 'SOFT-404: Casemates-Angular-Shell statt Normtext' };
  if (!CACHE_ANKER_MARKER.test(roh))
    return { ok: false, grund: 'keine art_/annex_/lvl_-Anker (verstümmelter Dump?)' };
  return { ok: true };
}

// Pin-Identitäts-Sonde ausgelagert nach scripts/normtext/cache-pin-befund.ts
// (§6.6 Datei-Schlankheit — Cache-Helfer gehören dorthin). Re-Export hier hält
// den bisherigen Importpfad `../../scripts/normtext-snapshot` für Aufrufer/Tests
// stabil (§5, keine zweite Wahrheit über den richtigen Importort).
export { pinIdentitaet, pinBefund };

/** Inhalt UND Pin-Identität — der vollständige Befund, den `sicherstelleCaches` verlangt. */
function cacheUndPinOk(e: { name: string; eli: string; konsolidierung: string; htmlN: number }): CacheBefund {
  const inhalt = cacheBefund(e.name);
  if (!inhalt.ok) return inhalt;
  return pinBefund(e.name, e.eli, e.konsolidierung, e.htmlN);
}

// ── Caches sicherstellen ──────────────────────────────────────────────────────
function sicherstelleCaches(
  eintraege: Array<{ name: string; eli: string; konsolidierung: string; htmlN: number }>,
): void {
  const fehlende = eintraege.filter((e) => !cacheUndPinOk(e).ok);
  if (fehlende.length === 0) return;

  console.log(
    `\n[Cache] ${fehlende.length} HTML-Cache(s) fehlen oder sind unbrauchbar — lade via bash scripts/fedlex-cache.sh …`,
  );
  for (const e of fehlende) {
    const b = cacheUndPinOk(e);
    if (b.grund && b.grund !== 'fehlt') console.log(`        /tmp/${e.name}.html: ${b.grund}`);
  }

  // Der Fehlschlag wird gemerkt, nicht geschluckt (N1: der frühere `catch {}`
  // verwarf Exit 1 ersatzlos, sobald die Dateien nur existierten).
  // `vorAbruf` (Gegenprüfung #808, Auflage B1): Zeitstempel VOR dem Abruf, damit
  // unten nur Dateien gestempelt werden, die DIESER Lauf tatsächlich neu
  // geschrieben hat (s. Kommentar bei `warFrischGeschrieben`).
  const vorAbruf = Date.now();
  let ladeFehler: Error | null = null;
  try {
    execSync('bash scripts/fedlex-cache.sh', { stdio: 'inherit' });
  } catch (e) {
    ladeFehler = e as Error;
  }

  // Inhalts-Nachprüfung — bewusst NUR `cacheBefund` (Inhalt), nicht der volle
  // Pin-Befund: der Marker wird erst unten geschrieben, ihn hier schon zu
  // verlangen wäre zirkulär (er kann per Definition noch nicht existieren).
  const nochFehlend = fehlende
    .map((e) => ({ name: e.name, befund: cacheBefund(e.name) }))
    .filter((x) => !x.befund.ok);
  if (nochFehlend.length > 0) {
    const liste = nochFehlend.map((x) => `/tmp/${x.name}.html (${x.befund.grund})`).join(', ');
    throw new Error(
      `BLOCKED: fedlex-cache.sh lieferte für folgende Erlasse keinen brauchbaren Cache: ${liste}\n` +
        'Netzwerkzugang prüfen. Bei «SOFT-404» ist nicht das Netz schuld, sondern der Pin: ' +
        'kanonisches html-N in scripts/fedlex-cache.sh nachziehen ' +
        "('npm run fedlex:repin-kanonik -- --write').",
    );
  }

  // Pin-Marker nachziehen: fedlex-cache.sh lädt bei jedem Aufruf AUSNAHMSLOS
  // seine komplette EINTRAEGE-Liste neu (kein Skip-if-exists, s. Kommentar
  // dort) — der /tmp-Inhalt jedes Eintrags dieses Laufs ist also NORMALERWEISE
  // frisch vom aktuell gepinnten html-N. Die Schleife läuft über die volle
  // `eintraege`-Liste (nicht nur `fehlende`), weil auch vormals schon gültige
  // Caches durch den Abruf überschrieben wurden.
  //
  // `warFrischGeschrieben` (Gegenprüfung #808, Auflage B1): bei einem
  // TEILFEHLER (execSync wirft, aber manche Dateien wurden vor dem Abbruch
  // bereits neu geschrieben) stempelt diese Schleife NUR die tatsächlich
  // frisch geschriebenen Dateien (mtime ≥ vorAbruf) — nicht die volle Liste.
  // Eine stehengebliebene Alt-Datei kann `cacheBefund` zufällig weiter
  // bestehen (sie ist ein echter, nur überholter Dump); sie trotzdem zu
  // stempeln wäre exakt die Lücke, die diese Sonde schliessen soll.
  for (const e of eintraege) {
    const pfad = `/tmp/${e.name}.html`;
    if (warFrischGeschrieben(pfad, vorAbruf) && cacheBefund(e.name).ok) {
      writeFileSync(`${pfad}.pin`, pinIdentitaet(e.eli, e.konsolidierung, e.htmlN), 'utf8');
    }
  }

  // Alle ANGEFORDERTEN Erlasse sind brauchbar, das Skript endete trotzdem mit
  // Fehler: fedlex-cache.sh prüft ALLE gepinnten Erlasse, nicht nur die dieses
  // Laufs (bei --erlass ist das der Normalfall). Darum kein harter Abbruch —
  // aber auch kein Schweigen: der Befund wird benannt und bleibt auf stderr
  // stehen. Wer ihn zum Blocker machen will, entscheidet das bewusst.
  if (ladeFehler) {
    console.warn(
      `\n[Cache] WARNUNG: scripts/fedlex-cache.sh endete mit Fehler (${ladeFehler.message}).\n` +
        `        Die ${eintraege.length} Erlass(e) DIESES Laufs sind inhaltlich geprüft und brauchbar;\n` +
        '        der Fehler betrifft also andere gepinnte Erlasse (Ausgabe oben). Dieser Lauf\n' +
        '        läuft weiter, der Zustand ist aber nicht sauber — Pins nachziehen.',
    );
  }
}

// ── lawId → dateisicher ('III B/7/1' → 'III B_7_1') ──────────────────────────
function lawIdSafe(lawId: string): string {
  return lawId.replace(/\//g, '_');
}

// ── Erlass-Bezeichnung lesbar ────────────────────────────────────────────────
// Format: 'Volltitel, Kürzel (SR-Nr.)'. Das nachgelagerte browse-manifest
// (identitaetAusErlass) splittet am LETZTEN Komma: davor der Titel, danach das
// Kürzel; die Klammer ist die SR-Nr. So zeigen Liste UND Reader den echten
// Volltitel, das Kürzel separat.
//
// S9 (BS-Audit 23.6.2026) — VOR dem Fix war «basis = abkuerzung || erlassName»:
// sobald eine Abkürzung vorlag, fiel der Volltitel komplett weg → 129 Erlasse
// zeigten nur «KÜRZEL (SR)», ~406 trugen den Langtitel fälschlich im Kürzel-Feld.
// Jetzt wird der Volltitel (tol.title via meta.titel, sonst erlassName) als Titel
// geführt und die Abkürzung NUR dann separat als Kürzel angehängt, wenn sie
// existiert UND sich vom Titel unterscheidet (keine zweite Wahrheit, §5).
export function erlassBezeichnung(titel: string, abkuerzung: string, erlassNr: string): string {
  const t = titel.trim();
  const abk = abkuerzung.trim();
  const nr = erlassNr.trim();
  // Basis-Anzeige: Titel; fehlt der Titel, das Kürzel als Notbehelf.
  let basis: string;
  if (t && abk && abk !== t) {
    basis = `${t}, ${abk}`;
  } else {
    basis = t || abk;
  }
  return nr ? `${basis} (${nr})` : basis;
}

// S-27.7.2026-B2 (Gegenprüfung PR #391 Befund 2) — Fallback-Akronym aus dem
// repo-kuratierten Erlassnamen, wenn die API-Abkürzung LEER ist.
//
// Manche Kanton-APIs (z.B. AG gesetzessammlungen.ag.ch, Beleg: version_uid
// 1c8fd03927f498fe939c30dd5e6ea7d0, `abbreviation: ''`) liefern kein Kürzel,
// obwohl der repo-kuratierte Zitat-Name (g.erlassName, z.B.
// src/data/tarif/grundbuch.ts: "Gesetz über die Grundbuchabgaben (GBAG)") ein
// amtliches Akronym in Klammern trägt. Seit Zeile ~484 die API-Abkürzung
// bedingungslos übernimmt, ging dieses Akronym beim Kanton-Titel-Nachzug
// (PR #391, AG-725.100) verloren — kein Einzelfall-Hack, sondern eine
// GENERISCHE Regel: ein Grossbuchstaben-Akronym (2+ Zeichen, optional Ziffern)
// in Klammern am ENDE des kuratierten Namens wird als Kürzel-Fallback
// übernommen, unabhängig von Kanton oder Erlass. Kein Treffer (kein
// Klammer-Akronym im Namen) → '' wie bisher, keine Verhaltensänderung.
export function akronymAusErlassName(erlassName: string): string {
  const m = erlassName.trim().match(/\(([A-ZÄÖÜ][A-ZÄÖÜ0-9]{1,14})\)\s*$/);
  return m ? m[1] : '';
}

// ── Coverage-Befunde der Kantons-Phase ───────────────────────────────────────
interface KantonCoverage {
  totalSnapshots: number;
  reportZeilen: string[];
  nurPdf: Array<{ kanton: string; erlass: string; lawId: string }>;
  tokenFehlt: Array<{ kanton: string; lawId: string; token: string; label: string }>;
  fetchFehler: Array<{ kanton: string; lawId: string; fehler: string }>;
}

// ── Kantons-Snapshots (LexWork) erzeugen ─────────────────────────────────────
async function erzeugeKantonsSnapshots(
  abgerufen: string,
  goldenIndex: Record<string, string>,
  kantonFilter?: Set<string>,
  inventarOverride?: KantonInventarGruppe[],
): Promise<KantonCoverage> {
  // Phase-1 (FAHRPLAN-GESETZE-IMPORT-3TIER): mit --discovery liefert der Aufrufer
  // den Vollkorpus eines Kantons (alle Tier-A-Erlasse via LexFind) als Override
  // statt nur der tarif-zitierten Erlasse aus sammleKantonInventar().
  const inventar = (inventarOverride ?? sammleKantonInventar()).filter(
    (g) => !kantonFilter || kantonFilter.has(g.kanton),
  );
  const ausgangsDir = 'public/normtext/kanton';
  mkdirSync(ausgangsDir, { recursive: true });

  // E1-Rest B (QS-DATA): public/normtext/kanton/*.json entsteht aus der DB-PROJEKTION
  // (Spalten-Weg), nicht mehr direkt aus dem Blob. Dynamischer Import, damit der
  // vitest-Import dieser Datei nie node:sqlite lädt (wie der Bund-Flip in main()).
  const { erstelleFlipDb, flipKantonErlass } = await import('./datenhaltung/generator-flip.ts');
  const flipDb = erstelleFlipDb();

  const cov: KantonCoverage = {
    totalSnapshots: 0,
    reportZeilen: [],
    nurPdf: [],
    tokenFehlt: [],
    fetchFehler: [],
  };

  // §8 (kein stilles Überschreiben): zweisprachige Kantone zitieren denselben
  // Erlass über die de- UND die fr-LexWork-URL — verschiedene Sprachfassungen,
  // also verschiedene Gruppen. Damit ihre Dateinamen/ids nicht kollidieren,
  // wird der Sprach-Suffix '-<lang>' angehängt, sobald eine (kanton,lawId)-
  // Kombination in mehr als einer Sprache vorkommt. Einsprachige Erlasse
  // bleiben unverändert (stabile ids).
  const sprachen = new Map<string, Set<string>>();
  for (const g of inventar) {
    const k = `${g.kanton}|${g.lawId}`;
    if (!sprachen.has(k)) sprachen.set(k, new Set());
    sprachen.get(k)!.add(g.lang);
  }
  const mehrsprachig = (g: { kanton: string; lawId: string }): boolean =>
    (sprachen.get(`${g.kanton}|${g.lawId}`)?.size ?? 0) > 1;
  const lawSchluessel = (g: { kanton: string; lawId: string; lang: 'de' | 'fr' }): string =>
    mehrsprachig(g) ? `${lawIdSafe(g.lawId)}-${g.lang}` : lawIdSafe(g.lawId);

  // Fetch-Phase (parallel, Concurrency 4) — nur die reinen Abrufe; die
  // Verarbeitung unten bleibt seriell in Inventar-Reihenfolge (Determinismus).
  const limit = pLimit(FETCH_CONCURRENCY);
  const abrufe = await Promise.all(
    inventar.map((g) =>
      limit(async (): Promise<{ ok: true; ergebnis: Awaited<ReturnType<typeof holeLexWork>> } | { ok: false; fehler: string }> => {
        try {
          return { ok: true, ergebnis: await holeLexWork(g.host, g.lang, g.fetchLawId ?? g.lawId) }; // A1 (PR #828): fetchLawId statt lawId — suffixfrei für zweisprachige Bestands-Keys (s. check-drift.ts)
        } catch (e) {
          return { ok: false, fehler: e instanceof Error ? e.message : String(e) };
        }
      }),
    ),
  );

  for (let idx = 0; idx < inventar.length; idx++) {
    const g = inventar[idx];
    const abruf = abrufe[idx];
    if (!abruf.ok) {
      // §8: Netzfehler pro Gruppe abfangen, nicht crashen, weiter zur nächsten.
      cov.fetchFehler.push({ kanton: g.kanton, lawId: g.lawId, fehler: abruf.fehler });
      continue;
    }
    const ergebnis = abruf.ergebnis;
    // B2-Fallback: API-Abkürzung leer → Akronym aus dem kuratierten Namen (falls
    // vorhanden), sonst unverändert '' (keine Verhaltensänderung ohne Klammer-Akronym).
    const abkuerzung = ergebnis.meta.abkuerzung || akronymAusErlassName(g.erlassName);

    if (ergebnis.meta.nurPdf) {
      cov.nurPdf.push({
        kanton: g.kanton,
        erlass: erlassBezeichnung(ergebnis.meta.titel || g.erlassName, abkuerzung, g.erlassNr),
        lawId: g.lawId,
      });
      continue;
    }

    // S9: Volltitel (tol.title) als Titel, Abkürzung separat als Kürzel.
    const erlass = erlassBezeichnung(ergebnis.meta.titel || g.erlassName, abkuerzung, g.erlassNr);
    const snapshotListe: NormSnapshot[] = [];
    const schluessel = lawSchluessel(g); // filesafe, mit '-de'/'-fr' nur wenn zweisprachig

    // Vollabdeckung (§7, Auftrag David 16.6.2026): ALLE Artikel des Erlasses
    // speichern, nicht nur die zitierten Tokens. artikelLabel einheitlich aus dem
    // Quell-Designator (ergebnis.labels: «§ N»/«Art. N»), NICHT aus dem rohen
    // Tarif-Zitat. Token-Reihenfolge stabil sortiert (Artikel-Nr.).
    for (const token of sortiereTokens(Object.keys(ergebnis.artikel))) {
      const treffer = ergebnis.artikel[token];
      if (!treffer || treffer.bloecke.length === 0) continue;
      const id = `kanton/${g.kanton}/${schluessel}/art_${token}`;
      const snapshot: NormSnapshot = {
        id,
        ebene: 'kanton',
        quelle: g.kanton,
        erlass,
        artikel: token,
        artikelLabel: ergebnis.labels[token] ?? artikelLabel(token),
        // N1: amtlicher Randtitel (article_title) aus der LexWork-Extraktion,
        // falls vorhanden (aufgehobene «…»-Titel liefert der Adapter als undefined).
        ...(treffer.titel ? { titel: treffer.titel } : {}),
        // G-AUFH-ART: ARTIKEL-genau aufgehoben (struktureller Adapter-Befund,
        // s. LexArtikel.aufgehoben-Doku) — NUR gesetzt, wenn der Adapter das
        // Signal amtlich trägt; sonst bleibt das Feld weg (§7).
        ...(treffer.aufgehoben ? { aufgehoben: true as const } : {}),
        bloecke: treffer.bloecke,
        stand: ergebnis.meta.stand,
        // LexWork hat keinen Artikel-Anker → Gesetzes-Seite (originale /app/-URL).
        quelleUrl: g.quelleUrl,
        abgerufen,
        fassungsToken: ergebnis.meta.versionUid,
        sha: sha256Bloecke(treffer.bloecke),
      };
      snapshotListe.push(snapshot);
      goldenIndex[id] = snapshot.sha;
    }

    // §8-Sichtbarkeit: zitierte Tokens, die im extrahierten Erlass FEHLEN
    // (echte Lücke — der zitierte Artikel wurde nicht gefunden), weiterhin melden.
    for (const art of g.artikel) {
      if (!(art.token in ergebnis.artikel)) {
        cov.tokenFehlt.push({
          kanton: g.kanton,
          lawId: g.lawId,
          token: art.token,
          label: art.label,
        });
      }
    }

    // Gruppe ohne einen einzigen extrahierten Artikel (alle Tokens nicht im
    // LexWork-Erlass gefunden) → KEINE Datei schreiben. Sonst entstünde eine
    // leere Snapshot-Datei ohne quelleUrl, die nicht ins Manifest aufgenommen
    // wird (baueManifest überspringt eintragslose Dateien) → Manifest-
    // Inkonsistenz. Der token-nicht-gefunden-Fall ist bereits über cov.tokenFehlt
    // (und die BEKANNTE_LUECKEN-Liste) sichtbar gemacht (§8).
    if (snapshotListe.length === 0) {
      cov.reportZeilen.push(
        `  ${g.kanton}-${schluessel.padEnd(14)} 0 Snapshots → keine Datei (alle Tokens nicht im Erlass)`,
      );
      continue;
    }

    const ausgabePfad = `${ausgangsDir}/${g.kanton}-${schluessel}.json`;
    const projJson = flipKantonErlass(flipDb, { key: `${g.kanton}-${schluessel}`, kanton: g.kanton }, snapshotListe);
    writeFileSync(ausgabePfad, projJson, 'utf8');

    cov.totalSnapshots += snapshotListe.length;
    cov.reportZeilen.push(
      `  ${g.kanton}-${schluessel.padEnd(14)} ${snapshotListe.length} Snapshots → ${ausgabePfad}`,
    );
  }

  return cov;
}

// ── lawIdSafe für HTM-Quellen: letzter Pfadteil ohne .htm ────────────────────
// 'https://silgeneve.ch/legis/data/rsg_e1_05p10.htm' → 'rsg_e1_05p10'
// 'https://rsn.ne.ch/DATA/.../htm/164.1.htm'          → '164.1'
// 'https://m3.ti.ch/.../pdfatto/atto/137'             → 'ti-137' (eindeutiger,
//   nicht-numerischer Dateiname; kongruent zum früheren TI-PDF-Schema)
function htmLawIdSafe(url: string): string {
  const ti = url.match(/\/pdfatto\/atto\/(\d+)$/i);
  if (ti) return `ti-${ti[1]}`;
  const letzter = url.split('/').pop() ?? url;
  return letzter.replace(/\.html?$/i, '');
}

// ── HTM-Befunde (NE/GE) ──────────────────────────────────────────────────────
interface HtmCoverage {
  totalSnapshots: number;
  reportZeilen: string[];
  tokenFehlt: Array<{ kanton: string; lawIdSafe: string; token: string; label: string }>;
  fetchFehler: Array<{ kanton: string; url: string; fehler: string }>;
}

// ── HTM-Snapshots (NE/GE, Word-Export-HTM) erzeugen ──────────────────────────
async function erzeugeHtmSnapshots(
  abgerufen: string,
  goldenIndex: Record<string, string>,
  kantonFilter?: Set<string>,
): Promise<HtmCoverage> {
  const inventar = sammleHtmInventar().filter(
    (g) => !kantonFilter || kantonFilter.has(g.kanton),
  );
  const ausgangsDir = 'public/normtext/kanton';
  mkdirSync(ausgangsDir, { recursive: true });

  // E1-Rest B: Projektion statt Direkt-Blob (s. erzeugeKantonsSnapshots).
  const { erstelleFlipDb, flipKantonErlass } = await import('./datenhaltung/generator-flip.ts');
  const flipDb = erstelleFlipDb();

  const cov: HtmCoverage = {
    totalSnapshots: 0,
    reportZeilen: [],
    tokenFehlt: [],
    fetchFehler: [],
  };

  const limit = pLimit(FETCH_CONCURRENCY);
  const abrufe = await Promise.all(
    inventar.map((g) =>
      limit(async (): Promise<{ ok: true; ergebnis: Awaited<ReturnType<typeof holeHtm>> } | { ok: false; fehler: string }> => {
        try {
          return { ok: true, ergebnis: await holeHtm(g.quelleUrl, g.profil, abgerufen) };
        } catch (e) {
          return { ok: false, fehler: e instanceof Error ? e.message : String(e) };
        }
      }),
    ),
  );

  for (let idx = 0; idx < inventar.length; idx++) {
    const g = inventar[idx];
    const safe = htmLawIdSafe(g.quelleUrl);
    const abruf = abrufe[idx];
    if (!abruf.ok) {
      cov.fetchFehler.push({ kanton: g.kanton, url: g.quelleUrl, fehler: abruf.fehler });
      continue;
    }
    const ergebnis = abruf.ergebnis;

    const erlass = erlassBezeichnung(g.erlassName, '', g.erlassNr);
    const snapshotListe: NormSnapshot[] = [];

    // Vollabdeckung (§7): ALLE Artikel des Erlasses speichern; Label einheitlich
    // aus dem Adapter (ergebnis.labels: «Art. N» für NE/GE/TI).
    for (const token of sortiereTokens(Object.keys(ergebnis.artikel))) {
      const treffer = ergebnis.artikel[token];
      if (!treffer || treffer.bloecke.length === 0) continue;
      const id = `kanton/${g.kanton}/${safe}/art_${token}`;
      const snapshot: NormSnapshot = {
        id,
        ebene: 'kanton',
        quelle: g.kanton,
        erlass,
        artikel: token,
        artikelLabel: ergebnis.labels[token] ?? artikelLabel(token),
        bloecke: treffer.bloecke,
        stand: ergebnis.meta.stand,
        // HTM-Quelle: die exakte Quell-URL (= Manifest-Key, wie im Tarif-Eintrag;
        // TI: die pdfatto/atto-URL — die HTML-Seite wird im Adapter abgeleitet).
        quelleUrl: g.quelleUrl,
        abgerufen,
        // Drift-Token (§7 d): kein version_uid → quelleHash des Volltexts.
        fassungsToken: ergebnis.meta.quelleHash,
        sha: sha256Bloecke(treffer.bloecke),
      };
      snapshotListe.push(snapshot);
      goldenIndex[id] = snapshot.sha;
    }

    // §8-Sichtbarkeit: zitierte Tokens, die im Erlass nicht gefunden wurden.
    for (const art of g.artikel) {
      if (!(art.token in ergebnis.artikel)) {
        cov.tokenFehlt.push({
          kanton: g.kanton,
          lawIdSafe: safe,
          token: art.token,
          label: art.label,
        });
      }
    }

    if (snapshotListe.length === 0) {
      cov.reportZeilen.push(
        `  ${g.kanton}-${safe.padEnd(16)} 0 Snapshots → keine Datei (alle Tokens nicht im Erlass)`,
      );
      continue;
    }

    const ausgabePfad = `${ausgangsDir}/${g.kanton}-${safe}.json`;
    const projJson = flipKantonErlass(flipDb, { key: `${g.kanton}-${safe}`, kanton: g.kanton }, snapshotListe);
    writeFileSync(ausgabePfad, projJson, 'utf8');

    cov.totalSnapshots += snapshotListe.length;
    cov.reportZeilen.push(
      `  ${g.kanton}-${safe.padEnd(16)} ${snapshotListe.length} Snapshots → ${ausgabePfad}`,
    );
  }

  return cov;
}

// lawIdSafe für ZH aus der zhlex-Registry-URL: …/erlass-211_11-… → «211.11».
function zhLawIdSafe(url: string): string {
  const m = url.match(/\/erlass-([^-]+)-/);
  return m ? m[1].replace(/_/g, '.') : url.replace(/[^a-z0-9.]+/gi, '_');
}

/**
 * ZH-4b (§17-Wurzelfix / §8, 31.8.2026): Ein gelisteter ZH-Erlass, der nicht
 * abrufbar war, darf NICHT still fehlen.
 *
 * Vorher wurde der Fetch-Fehler nur in eine Log-Zeile geschrieben und der Lauf
 * baute Manifest/Register/Golden mit der Lücke weiter. Bei drei Erlassen fiel
 * das noch auf; ab ~20 (deklarative Quellenliste) nicht mehr — genau die
 * Fehlerklasse, die das Dossier §7 als «schlägt still zu» benennt. Jetzt:
 * sichtbarer Abbruch mit Fehl-Erlass-Liste VOR dem Golden-Schreiben. Die
 * Soll-Menge ist `ZH_QUELLEN` ∪ Tarif-Ableitung; ein Fehl-Erlass ist ein
 * unvollständiger Korpus, kein Teilerfolg.
 */
function pruefeZhVollstaendig(zhCov: HtmCoverage): void {
  if (zhCov.fetchFehler.length === 0) return;
  const liste = zhCov.fetchFehler.map((f) => `  - ${f.kanton} ${f.url}\n      ${f.fehler}`).join('\n');
  throw new Error(
    `ZH-Import UNVOLLSTÄNDIG: ${zhCov.fetchFehler.length} gelistete(r) Erlass(e) nicht abrufbar —\n${liste}\n` +
      'Lauf abgebrochen vor Manifest/Register/Golden (kein halber Korpus, §8). ' +
      'Netz/Quelle prüfen und erneut fahren.',
  );
}

// ── ZH-Snapshots (zhlex Text-PDF via pdfjs) erzeugen ─────────────────────────
// Spiegelt die HTM-Phase: Inventar → holeZhPdf (Registry→notes.zh.ch-PDF) →
// NormSnapshot. quelleUrl = zhlex-Registry-URL (= Manifest-Key). Drift via
// quelleHash (kein version_uid), §7 d.
async function erzeugeZhPdfSnapshots(
  abgerufen: string,
  goldenIndex: Record<string, string>,
  kantonFilter?: Set<string>,
): Promise<HtmCoverage> {
  const inventar = sammleZhPdfInventar().filter(
    (g) => !kantonFilter || kantonFilter.has(g.kanton),
  );
  const ausgangsDir = 'public/normtext/kanton';
  mkdirSync(ausgangsDir, { recursive: true });

  // E1-Rest B: Projektion statt Direkt-Blob (s. erzeugeKantonsSnapshots).
  const { erstelleFlipDb, flipKantonErlass } = await import('./datenhaltung/generator-flip.ts');
  const flipDb = erstelleFlipDb();

  const cov: HtmCoverage = { totalSnapshots: 0, reportZeilen: [], tokenFehlt: [], fetchFehler: [] };
  // §8-Auslassungen je Erlass (Bug B-6, Gegenprüfung Runde 2, 31.8.2026).
  const luecken: Record<string, { quelleUrl: string; erlass: string; hinweise: string[] }> = {};

  const limit = pLimit(FETCH_CONCURRENCY);
  const abrufe = await Promise.all(
    inventar.map((g) =>
      limit(async (): Promise<{ ok: true; ergebnis: Awaited<ReturnType<typeof holeZhPdf>> } | { ok: false; fehler: string }> => {
        try {
          return { ok: true, ergebnis: await holeZhPdf(g.quelleUrl) };
        } catch (e) {
          return { ok: false, fehler: e instanceof Error ? e.message : String(e) };
        }
      }),
    ),
  );

  for (let idx = 0; idx < inventar.length; idx++) {
    const g = inventar[idx];
    const safe = zhLawIdSafe(g.quelleUrl);
    const abruf = abrufe[idx];
    if (!abruf.ok) {
      cov.fetchFehler.push({ kanton: g.kanton, url: g.quelleUrl, fehler: abruf.fehler });
      continue;
    }
    const ergebnis = abruf.ergebnis;

    const erlass = erlassBezeichnung(g.erlassName, '', g.erlassNr);
    const snapshotListe: NormSnapshot[] = [];

    // Vollabdeckung (§7): ALLE Artikel; Label einheitlich «§ N» (ergebnis.labels).
    for (const token of sortiereTokens(Object.keys(ergebnis.artikel))) {
      const treffer = ergebnis.artikel[token];
      if (!treffer || treffer.bloecke.length === 0) continue;
      const id = `kanton/${g.kanton}/${safe}/art_${token}`;
      const snapshot: NormSnapshot = {
        id,
        ebene: 'kanton',
        quelle: g.kanton,
        erlass,
        artikel: token,
        artikelLabel: ergebnis.labels[token] ?? artikelLabel(token),
        bloecke: treffer.bloecke,
        stand: ergebnis.meta.stand,
        quelleUrl: g.quelleUrl,
        abgerufen,
        fassungsToken: ergebnis.meta.quelleHash,
        sha: sha256Bloecke(treffer.bloecke),
      };
      snapshotListe.push(snapshot);
      goldenIndex[id] = snapshot.sha;
    }

    // §8-Sichtbarkeit: zitierte Tokens, die im Erlass nicht gefunden wurden.
    for (const art of g.artikel) {
      if (!(art.token in ergebnis.artikel)) {
        cov.tokenFehlt.push({ kanton: g.kanton, lawIdSafe: safe, token: art.token, label: art.label });
      }
    }

    if (snapshotListe.length === 0) {
      cov.reportZeilen.push(`  ${g.kanton}-${safe.padEnd(16)} 0 Snapshots → keine Datei (alle Tokens nicht im Erlass)`);
      continue;
    }

    const ausgabePfad = `${ausgangsDir}/${g.kanton}-${safe}.json`;
    const projJson = flipKantonErlass(flipDb, { key: `${g.kanton}-${safe}`, kanton: g.kanton }, snapshotListe);
    writeFileSync(ausgabePfad, projJson, 'utf8');
    cov.totalSnapshots += snapshotListe.length;
    if (ergebnis.hinweise.length > 0) {
      luecken[`${g.kanton}-${safe}`] = {
        quelleUrl: g.quelleUrl,
        erlass,
        hinweise: [...ergebnis.hinweise].sort(),
      };
    }
    cov.reportZeilen.push(
      `  ${g.kanton}-${safe.padEnd(16)} ${snapshotListe.length} Snapshots → ${ausgabePfad}` +
        (ergebnis.hinweise.length > 0 ? ` · ${ergebnis.hinweise.length} §8-Hinweis(e)` : ''),
    );
  }

  schreibeLueckenIndex(abgerufen, luecken, kantonFilter);
  return cov;
}

/**
 * §8-LÜCKEN-INDEX (Bug B-6, Gegenprüfung Runde 2, 31.8.2026).
 *
 * Der ZH-Import lässt Erlassteile bewusst weg — Übergangs-/Schlussbestimmungen
 * und, bei ZH-700.1, den Anhang mit den Altfassungen einzelner §§ (dort 486 von
 * 4327 Textzeilen = 11 %). Beide führen eine zweite, mit dem Haupttext
 * kollidierende §-Zählung; sie wegzulassen ist richtig, sie zu VERSCHWEIGEN
 * nicht (§8: offenlegen statt wegglätten). Bis hierher stand die Auslassung nur
 * in einem Code-Kommentar — im Artefakt war der Erlass scheinbar vollständig.
 *
 * Eigene Datei statt eines Feldes im Erlass-Snapshot: die Snapshot-JSON sind
 * byte-genaue Projektionen aus `daten/lexmetrik.db` (§5, check:paritaet). Ein
 * neues Erlass-Feld verlangte eine Schema-Änderung in scripts/datenhaltung/**,
 * an der parallel gebaut wird. Der Index ist die additive, kollisionsfreie
 * Form; die Überführung in die DB-Projektion ist Nachzug-Stoff, sobald der
 * Datenhaltungs-Umbau gelandet ist.
 *
 * Deterministisch: Erlass-Keys und Hinweise sortiert (§2).
 */
function schreibeLueckenIndex(
  abgerufen: string,
  luecken: Record<string, { quelleUrl: string; erlass: string; hinweise: string[] }>,
  kantonFilter?: Set<string>,
): void {
  const pfad = 'public/normtext/kanton-luecken.json';
  // Teil-Läufe (--nur=zh deckt nur ZH ab) dürfen fremde Kantone nicht löschen:
  // bestehende Einträge ausserhalb des Filters bleiben stehen.
  let bestand: Record<string, { quelleUrl: string; erlass: string; hinweise: string[] }> = {};
  if (existsSync(pfad)) {
    const alt = JSON.parse(readFileSync(pfad, 'utf8')) as {
      erlasse?: Record<string, { quelleUrl: string; erlass: string; hinweise: string[] }>;
    };
    bestand = alt.erlasse ?? {};
  }
  const behalten = Object.fromEntries(
    Object.entries(bestand).filter(([key]) => {
      const kanton = key.split('-')[0];
      // Alles, was dieser Lauf abgedeckt hat, wird ersetzt; der Rest bleibt.
      if (kantonFilter && !kantonFilter.has(kanton)) return true;
      return kanton !== 'ZH';
    }),
  );
  const zusammen = { ...behalten, ...luecken };
  const sortiert: typeof zusammen = {};
  for (const k of Object.keys(zusammen).sort()) sortiert[k] = zusammen[k];
  writeFileSync(
    pfad,
    JSON.stringify({ erzeugt: abgerufen, erlasse: sortiert }, null, 2) + '\n',
    'utf8',
  );
  console.log(
    `  §8-Lücken-Index → ${pfad} (${Object.keys(sortiert).length} Erlass(e) mit Auslassung)`,
  );
}

// pdfLawIdSafe liegt zentral in ./normtext/lawid-safe.ts (§5, C1-1) — importiert oben.

// ── PDF-Snapshots (SZ/TI/VD/JU, generischer Einzelspalten-PDF-Adapter) ────────
// Spiegelt die ZH-Phase: Inventar → holePdf (quelleUrl je Profil → PDF) →
// NormSnapshot. quelleUrl = Tarif-quelleUrl (= Manifest-Key). Drift via
// quelleHash (kein version_uid), §7 d.
async function erzeugePdfSnapshots(
  abgerufen: string,
  goldenIndex: Record<string, string>,
  kantonFilter?: Set<string>,
): Promise<HtmCoverage> {
  const inventar = sammlePdfInventar().filter(
    (g) => !kantonFilter || kantonFilter.has(g.kanton),
  );
  const ausgangsDir = 'public/normtext/kanton';
  mkdirSync(ausgangsDir, { recursive: true });

  // E1-Rest B: Projektion statt Direkt-Blob (s. erzeugeKantonsSnapshots).
  const { erstelleFlipDb, flipKantonErlass } = await import('./datenhaltung/generator-flip.ts');
  const flipDb = erstelleFlipDb();

  const cov: HtmCoverage = { totalSnapshots: 0, reportZeilen: [], tokenFehlt: [], fetchFehler: [] };

  // §8 (kein stilles Überschreiben): mehrere Tarif-quelleUrls können DENSELBEN
  // Erlass meinen (JU: «…&download=1» vs. ohne) → gleicher pdfLawIdSafe → gleiche
  // Datei. Statt der zweiten Gruppe die erste zu überschreiben (und ihre Artikel
  // + Manifest-Key zu verlieren), gruppieren wir nach safe-Dateinamen und führen
  // die Gruppen zusammen: ein Fetch je quelleUrl, je Artikel ein Snapshot, dessen
  // quelleUrl die ORIGINALE Tarif-quelleUrl trägt (→ baueManifest legt für jede
  // distinct quelleUrl einen Manifest-Eintrag auf dieselbe Datei an).
  const nachDatei = new Map<string, typeof inventar>();
  for (const g of inventar) {
    const safe = `${g.kanton}-${pdfLawIdSafe(g.profil, g.quelleUrl)}`;
    let liste = nachDatei.get(safe);
    if (!liste) {
      liste = [];
      nachDatei.set(safe, liste);
    }
    liste.push(g);
  }

  // Fetch-Phase (parallel, Concurrency 4) über ALLE Gruppen; die verschachtelte
  // Verarbeitung unten bleibt in unveränderter (nachDatei × gruppen)-Reihenfolge.
  // Schlüssel = Gruppen-Objektreferenz (jede Gruppe kommt genau einmal vor).
  const alleGruppen = [...nachDatei.values()].flat();
  type PdfAbruf = { ok: true; ergebnis: Awaited<ReturnType<typeof holePdf>> } | { ok: false; fehler: string };
  const pdfLimit = pLimit(FETCH_CONCURRENCY);
  const pdfAbrufe = new Map<(typeof alleGruppen)[number], PdfAbruf>();
  await Promise.all(
    alleGruppen.map((g) =>
      pdfLimit(async () => {
        try {
          pdfAbrufe.set(g, { ok: true, ergebnis: await holePdf(g.quelleUrl, PDF_PROFILE[g.profil], abgerufen) });
        } catch (e) {
          pdfAbrufe.set(g, { ok: false, fehler: e instanceof Error ? e.message : String(e) });
        }
      }),
    ),
  );

  for (const [dateiBasis, gruppen] of nachDatei) {
    const safe = dateiBasis.replace(/^[A-Z]{2}-/, '');
    const kanton = gruppen[0].kanton;
    const snapshotListe: NormSnapshot[] = [];
    const gesehenTokens = new Set<string>();

    for (const g of gruppen) {
      const abruf = pdfAbrufe.get(g)!;
      if (!abruf.ok) {
        cov.fetchFehler.push({ kanton: g.kanton, url: g.quelleUrl, fehler: abruf.fehler });
        continue;
      }
      const ergebnis = abruf.ergebnis;
      const erlass = erlassBezeichnung(g.erlassName, '', g.erlassNr);
      // Vollabdeckung: ALLE Artikel der Quelle; Label einheitlich aus dem Profil-
      // Marker (ergebnis.labels). Pro (Datei, token, quelleUrl) genau ein Eintrag:
      // verschiedene quelleUrls zum selben token (JU-Download-Variante) erzeugen je
      // einen Manifest-fähigen Eintrag; identische werden entdoppelt.
      for (const token of sortiereTokens(Object.keys(ergebnis.artikel))) {
        const treffer = ergebnis.artikel[token];
        if (!treffer || treffer.bloecke.length === 0) continue;
        const dedupeKey = `${g.quelleUrl} ${token}`;
        if (gesehenTokens.has(dedupeKey)) continue;
        gesehenTokens.add(dedupeKey);
        const id = `kanton/${g.kanton}/${safe}/art_${token}`;
        const snapshot: NormSnapshot = {
          id,
          ebene: 'kanton',
          quelle: g.kanton,
          erlass,
          artikel: token,
          artikelLabel: ergebnis.labels[token] ?? artikelLabel(token),
          bloecke: treffer.bloecke,
          stand: ergebnis.meta.stand,
          quelleUrl: g.quelleUrl,
          abgerufen,
          fassungsToken: ergebnis.meta.quelleHash,
          sha: sha256Bloecke(treffer.bloecke),
        };
        snapshotListe.push(snapshot);
        goldenIndex[id] = snapshot.sha;
      }

      // Sichtbarkeit: zitierte Tokens, die im Erlass nicht gefunden wurden.
      for (const art of g.artikel) {
        if (!(art.token in ergebnis.artikel)) {
          cov.tokenFehlt.push({ kanton: g.kanton, lawIdSafe: safe, token: art.token, label: art.label });
        }
      }
    }

    if (snapshotListe.length === 0) {
      cov.reportZeilen.push(`  ${kanton}-${safe.padEnd(16)} 0 Snapshots → keine Datei (alle Tokens nicht im Erlass / Fetch-Fehler)`);
      continue;
    }

    const ausgabePfad = `${ausgangsDir}/${kanton}-${safe}.json`;
    const projJson = flipKantonErlass(flipDb, { key: `${kanton}-${safe}`, kanton }, snapshotListe);
    writeFileSync(ausgabePfad, projJson, 'utf8');
    cov.totalSnapshots += snapshotListe.length;
    cov.reportZeilen.push(`  ${kanton}-${safe.padEnd(16)} ${snapshotListe.length} Snapshots → ${ausgabePfad}`);
  }

  return cov;
}

// ── Hauptprogramm ─────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const abgerufen = leseDatum();

  // ── Nur-ZH-Modus (--nur=zh) ─────────────────────────────────────────────────
  // Regeneriert NUR die ZH-PDF-Snapshots (z. B. nach einer Extraktions-
  // Verbesserung wie der Spalten-Lücken-Erkennung 20.6.2026), ohne Bund/übrige
  // Kantone erneut über das Netz zu ziehen — so bleibt der Diff auf ZH
  // beschränkt (kein stiller Upstream-Drift, §8). Manifest/Register werden aus
  // der Platte neu gebaut (alle Dateien, nur ZH verändert); der Golden-Index
  // wird GEMISCHT: alle Nicht-ZH-Einträge bleiben, ersetzt werden die ZH-Erlasse,
  // die dieser Lauf tatsächlich neu erzeugt hat (golden-kanton-merge.ts).
  if (process.argv.includes('--nur=zh')) {
    const goldenIndex: Record<string, string> = {};
    console.log(`\n[Normtext-Snapshot] --nur=zh, datum=${abgerufen}`);
    const zhCov = await erzeugeZhPdfSnapshots(abgerufen, goldenIndex);
    for (const z of zhCov.reportZeilen) console.log(z);
    console.log(`\nGesamt ZH: ${zhCov.totalSnapshots} Snapshots; fetch-Fehler: ${zhCov.fetchFehler.length}`);
    for (const f of zhCov.fetchFehler) console.log(`  ${f.kanton} ${f.url}: ${f.fehler}`);
    pruefeZhVollstaendig(zhCov);

    // Manifest + Register aus der Platte neu (alle Snapshots; nur ZH verändert).
    const kantonManifest = baueManifest('public/normtext/kanton');
    const kantonManifestSortiert: Record<string, string> = {};
    for (const k of Object.keys(kantonManifest).sort()) kantonManifestSortiert[k] = kantonManifest[k];
    writeFileSync('public/normtext/kanton/index.json', stabelesJson(kantonManifestSortiert), 'utf8');

    const browse = baueBrowseManifest(abgerufen);
    writeFileSync('public/normtext/register.json', JSON.stringify(browse, null, 2) + '\n', 'utf8');

    // Golden mischen: Nicht-ZH bewahren, kanton/ZH/* ersetzen.
    let bestand: Record<string, string>;
    try {
      bestand = JSON.parse(readFileSync('golden/normtext-snapshot.json', 'utf8')) as Record<string, string>;
    } catch {
      throw new Error('--nur=zh: golden/normtext-snapshot.json fehlt — ein Voll-Lauf muss zuerst gelaufen sein.');
    }
    // Dieselbe Merge-Regel wie --nur=kanton (scripts/normtext/golden-kanton-merge.ts):
    // ersetzt wird je ERLASS, nicht pauschal `kanton/ZH/*`. Für einen gesunden
    // ZH-Lauf ist das ergebnisgleich (ZH wird nur über die ZH-PDF-Route
    // erschlossen, also liefert der Lauf jeden ZH-Erlass). Es schliesst aber die
    // §8-Lücke, dass eine ganz oder teilweise fehlgeschlagene ZH-Phase den
    // Golden-Altbestand der nicht gelieferten Erlasse still gelöscht hätte —
    // dieselbe Fehlerklasse wie der AR-1203-Verlust (Commit 7a14fa06).
    const merge = mischeGoldenKanton(bestand, goldenIndex, new Set(['ZH']));
    if (merge.bewahrt.length > 0) {
      console.log(
        `\n⚠️  WARN (§8): ${merge.bewahrt.length} ZH-Erlass(e) OHNE neue Snapshots in diesem Lauf — ` +
          `Golden-Altbestand bewahrt: ${merge.bewahrt.join(', ')}`,
      );
    }
    const gemischt = merge.gemischt;
    const sortiert: Record<string, string> = {};
    for (const k of Object.keys(gemischt).sort()) sortiert[k] = gemischt[k];
    mkdirSync('golden', { recursive: true });
    writeFileSync('golden/normtext-snapshot.json', stabelesJson(sortiert), 'utf8');
    console.log(`\n[--nur=zh] Fertig. Register ${browse.erlasse.length} Erlasse; Golden ${Object.keys(sortiert).length} Einträge (${Object.keys(goldenIndex).length} ZH ersetzt).`);
    return;
  }

  // ── Gezielter Kantons-Modus (--nur=kanton --kanton=AR,NW) ───────────────────
  // Regeneriert NUR die Snapshots der genannten Kantone (über ALLE kantonalen
  // Phasen: LexWork/HTM/ZH/PDF, je nach dem, wo der Kanton geführt wird), ohne
  // Bund oder die übrigen Kantone erneut über das Netz zu ziehen — so bleibt der
  // Diff auf die gewünschten Kantone beschränkt (kein stiller Upstream-Drift, §8;
  // z. B. nach einem Adapter-Fix wie AR-Anhang-Ziffern / NW-§18-Sub-Staffel
  // 22.6.2026). Golden wird GEMISCHT: ersetzt werden genau die ERLASSE der
  // genannten Kantone, die dieser Lauf tatsächlich neu erzeugt hat — nie der
  // ganze Kanton (golden-kanton-merge.ts; ein Teillauf wie --discovery fährt nur
  // EINE Route, s. dort die 7a14fa06-Begründung). Manifest/Register aus der Platte neu.
  if (process.argv.includes('--nur=kanton')) {
    const kantonArg = process.argv.find((a) => a.startsWith('--kanton='));
    if (!kantonArg) {
      throw new Error('--nur=kanton verlangt --kanton=XX[,YY] (z. B. --kanton=AR,NW)');
    }
    const kantone = new Set(
      kantonArg.slice('--kanton='.length).split(',').map((s) => s.trim().toUpperCase()).filter(Boolean),
    );
    // §6.7-Fund #694 (12.9.2026): Erlass-genauer Filter — s. parseKantonNurFilter.
    const { nurKeys, passt: passtNurFilter } = parseKantonNurFilter(process.argv);
    const goldenIndex: Record<string, string> = {};
    // Phase-1 (FAHRPLAN-GESETZE-IMPORT-3TIER): --discovery liest den Kanton-Vollkorpus via LexFind (Tier A) statt nur tarif-zitierter Erlasse; dann nur LexWork (HTM/ZH/PDF entfallen, s. nurUeberspringt).
    const discovery = process.argv.includes('--discovery');
    const nurSuffix = nurKeys ? ` --nur=${[...nurKeys].join(',')}` : '';
    console.log(`\n[Normtext-Snapshot] --nur=kanton ${[...kantone].join(',')}${discovery ? ' --discovery' : ''}${nurSuffix}, datum=${abgerufen}`);

    let cov: KantonCoverage;
    if (discovery) {
      const FR_KANTONE = new Set(['FR', 'VS', 'GE', 'NE', 'JU', 'VD']);
      const gruppen: KantonInventarGruppe[] = [];
      for (const k of kantone) {
        const lang = FR_KANTONE.has(k) ? 'fr' : 'de';
        const erlasse = await enumeriereKanton(k, { lang, nurInKraft: true });
        const routing = discoveryZuInventar(erlasse, k);
        const gefiltert = routing.gruppen.filter(passtNurFilter);
        const nurZeile = nurKeys ? `, --nur filtert auf ${gefiltert.length} Gruppe(n)` : '';
        console.log(`  Discovery ${k}: ${erlasse.length} Erlasse → ${routing.gruppen.length} Tier-A-Gruppen (${routing.uebersprungen.length} übersprungen)${nurZeile}`);
        gruppen.push(...gefiltert);
      }
      if (nurKeys && gruppen.length === 0) {
        throw new Error(`--nur=${[...nurKeys].join(',')}: keine Gruppe traf zu — Key-Format <KT>-<lawId> prüfen (z. B. BS-121.100).`);
      }
      cov = await erzeugeKantonsSnapshots(abgerufen, goldenIndex, kantone, gruppen);
    } else {
      const inv = nurKeys ? baueKantonNurInventar(kantone, passtNurFilter) : undefined; // A1 (PR #828)
      cov = await erzeugeKantonsSnapshots(abgerufen, goldenIndex, kantone, inv);
    }
    for (const z of cov.reportZeilen) console.log(z);
    const nurUeberspringt = discovery || !!nurKeys; // A1 (PR #828): --nur=<KEY> ist erlassgenau — sonst träfen HTM/ZH/PDF ungefiltert fremde Erlasse (Rot-Beweis: VS-1413/PDF)
    const htmCov = nurUeberspringt ? null : await erzeugeHtmSnapshots(abgerufen, goldenIndex, kantone);
    if (htmCov) for (const z of htmCov.reportZeilen) console.log(z);
    const zhCov = nurUeberspringt ? null : await erzeugeZhPdfSnapshots(abgerufen, goldenIndex, kantone);
    if (zhCov) for (const z of zhCov.reportZeilen) console.log(z);
    const pdfCov = nurUeberspringt ? null : await erzeugePdfSnapshots(abgerufen, goldenIndex, kantone);
    if (pdfCov) for (const z of pdfCov.reportZeilen) console.log(z);

    const alleFetchFehler = [
      ...cov.fetchFehler.map((f) => `LexWork ${f.kanton} ${f.lawId}: ${f.fehler}`),
      ...(htmCov?.fetchFehler ?? []).map((f) => `HTM ${f.kanton} ${f.url}: ${f.fehler}`),
      ...(zhCov?.fetchFehler ?? []).map((f) => `ZH ${f.kanton} ${f.url}: ${f.fehler}`),
      ...(pdfCov?.fetchFehler ?? []).map((f) => `PDF ${f.kanton} ${f.url}: ${f.fehler}`),
    ];
    console.log(`\nfetch-Fehler: ${alleFetchFehler.length}`);
    for (const f of alleFetchFehler) console.log(`  ${f}`);

    if (zhCov) pruefeZhVollstaendig(zhCov);

    // Manifest + Register aus der Platte neu (alle Dateien; nur die Ziel-Kantone verändert).
    const kantonManifest = baueManifest('public/normtext/kanton');
    const kantonManifestSortiert: Record<string, string> = {};
    for (const k of Object.keys(kantonManifest).sort()) kantonManifestSortiert[k] = kantonManifest[k];
    writeFileSync('public/normtext/kanton/index.json', stabelesJson(kantonManifestSortiert), 'utf8');

    const browse = baueBrowseManifest(abgerufen);
    writeFileSync('public/normtext/register.json', JSON.stringify(browse, null, 2) + '\n', 'utf8');

    // Golden mischen: Nicht-Ziel-Kantone bewahren; innerhalb der Ziel-Kantone
    // werden NUR die in diesem Lauf tatsächlich gefahrenen Erlasse ersetzt
    // (Erlass-Granularität, golden-kanton-merge.ts — Fix AR-1203/PR #390).
    let bestand: Record<string, string>;
    try {
      bestand = JSON.parse(readFileSync('golden/normtext-snapshot.json', 'utf8')) as Record<string, string>;
    } catch {
      throw new Error('--nur=kanton: golden/normtext-snapshot.json fehlt — ein Voll-Lauf muss zuerst gelaufen sein.');
    }
    // Merge-Regel: scripts/normtext/golden-kanton-merge.ts (eine Quelle, isoliert
    // getestet in src/tests/golden-kanton-merge.test.ts).
    // existsSync als Datei-Sonde: ein Erlass der Ziel-Kantone ohne frische
    // Knoten wird nur dann aus dem Golden entfernt, wenn auch seine
    // Snapshot-Datei fort ist (= aus dem Korpus zurückgezogen). Ausfall bleibt
    // bewahrt (§8) — dieselbe Regel wie im Voll-Lauf.
    const merge = mischeGoldenKanton(bestand, goldenIndex, kantone, existsSync);
    if (merge.verworfen.length > 0) {
      console.log(
        `\nℹ️  §5: ${merge.verworfen.length} Erlass(e) der Ziel-Kantone ohne Snapshot-Datei — ` +
          `Golden-Knoten verworfen (aus dem Korpus zurückgezogen): ${merge.verworfen.join(', ')}`,
      );
    }
    if (merge.fehlgeschlageneKantone.length > 0) {
      console.log(
        `\n⚠️  WARN (§8): Ziel-Kantone OHNE neue Snapshots (Fetch-Fehler?): ${merge.fehlgeschlageneKantone.join(', ')} — ` +
          'ihr Golden-Altbestand bleibt UNVERÄNDERT (kein stiller Verlust).',
      );
    }
    // §8-Sichtbarkeit: Erlasse der Ziel-Kantone, die dieser Lauf NICHT erzeugt hat
    // (bei --discovery der Regelfall: HTM/ZH/PDF-Routen liefen nicht). Ihr
    // Altbestand bleibt — genau das war vor diesem Fix der stille Verlust.
    if (merge.bewahrt.length > 0) {
      const zeige = merge.bewahrt.slice(0, 12).join(', ');
      console.log(
        `\nℹ️  §8: ${merge.bewahrt.length} Erlass(e) der Ziel-Kantone OHNE neue Snapshots in diesem Lauf — ` +
          `Golden-Altbestand bewahrt (nicht gefahrene Route / Fetch-Fehler): ${zeige}` +
          (merge.bewahrt.length > 12 ? ` … (+${merge.bewahrt.length - 12})` : ''),
      );
    }
    const gemischt = merge.gemischt;
    const sortiert: Record<string, string> = {};
    for (const k of Object.keys(gemischt).sort()) sortiert[k] = gemischt[k];
    mkdirSync('golden', { recursive: true });
    writeFileSync('golden/normtext-snapshot.json', stabelesJson(sortiert), 'utf8');
    const zielN = Object.keys(goldenIndex).length;
    console.log(
      `\n[--nur=kanton] Fertig. ${zielN} Snapshots der Kantone ${[...kantone].join(',')} regeneriert; ` +
        `Golden ${Object.keys(sortiert).length} Einträge gesamt. Register ${browse.erlasse.length} Erlasse.`,
    );
    return;
  }

  const shellQuelle = readFileSync('scripts/fedlex-cache.sh', 'utf8');
  const alleEintraege = parseFedlexCacheEintraege(shellQuelle);

  // --erlass=KEY,KEY: Bund-Lauf auf einzelne Erlasse eingrenzen (M10: nur die
  // mehrspaltig-Erlasse regenerieren → minimaler, prüfbarer git-Diff). Setzt
  // --nur=bund-Semantik voraus; Golden wird gemerged (nicht ersetzt), s. unten.
  const erlassArg = process.argv.find((a) => a.startsWith('--erlass='));
  const erlassFilter = erlassArg
    ? new Set(erlassArg.slice('--erlass='.length).toLowerCase().split(',').map((s) => s.trim()).filter(Boolean))
    : null;
  const eintraege = erlassFilter
    ? alleEintraege.filter((e) => erlassFilter.has(e.name.toLowerCase()))
    : alleEintraege;
  if (erlassFilter && eintraege.length !== erlassFilter.size) {
    const gefunden = new Set(eintraege.map((e) => e.name.toLowerCase()));
    const fehlt = [...erlassFilter].filter((k) => !gefunden.has(k));
    throw new Error(`--erlass: unbekannte Erlass-Keys (nicht in fedlex-cache.sh): ${fehlt.join(', ')}`);
  }

  console.log(`\n[Normtext-Snapshot] datum=${abgerufen}, ${eintraege.length} Gesetze${erlassFilter ? ' (--erlass-Filter)' : ''}`);

  // Caches sicherstellen
  sicherstelleCaches(eintraege);

  // Ausgabeverzeichnis
  const ausgangsDir = 'public/normtext/bund';
  mkdirSync(ausgangsDir, { recursive: true });

  // Golden-Index
  const goldenIndex: Record<string, string> = {};

  // Übersprungene Token (gesetz → token)
  const uebersprungen: Array<{ gesetz: string; token: string }> = [];

  // Report-Zeilen
  const reportZeilen: string[] = [];
  let totalSnapshots = 0;

  // ── E1-Flip (QS-DATA, FAHRPLAN-DATENHALTUNG §5): public/*.json entsteht ab hier
  // aus der DB-PROJEKTION (Spalten-Weg: Zeilen in erlasse/erlass_fassungen/artikel →
  // byte-gleiche Projektion), nicht mehr direkt aus dem Blob. Der alte stabelesJson-
  // Direktpfad für die Bund-Dateien ist ENTFERNT (E1-Rest, eigener §6-Schritt 3.7.2026);
  // der stehende Byte-Beweis läuft über `npm run datenhaltung:doppellauf`.
  // Dynamischer Import, damit der vitest-Import dieser Datei nie node:sqlite lädt.
  const { erstelleFlipDb, flipBundErlass } = await import('./datenhaltung/generator-flip.ts');
  const flipDb = erstelleFlipDb();

  for (const eintrag of eintraege) {
    const { name, eli, konsolidierung } = eintrag;
    const gesetzKey = name.toUpperCase();
    const erlass = ERLASS_MAP[name] ?? gesetzKey;
    const stand = konsZuIso(konsolidierung);
    const htmlPfad = `/tmp/${name}.html`;

    let html: string;
    try {
      html = readFileSync(htmlPfad, 'utf8');
    } catch {
      console.error(`[FEHLER] Kann ${htmlPfad} nicht lesen — überspringe ${gesetzKey}`);
      // Überspringe alle Tokens für dieses Gesetz
      uebersprungen.push({ gesetz: gesetzKey, token: '(alle — HTML fehlt)' });
      continue;
    }

    // Alle Artikel-Token aus dem HTML extrahieren (führende Ziffer = Pflicht)
    const tokens = alleArtikelTokens(html);
    const snapshotListe: NormSnapshot[] = [];

    for (const token of tokens) {
      const ankerVoll = `art_${token}`;
      // W2·27 (15.9.2026, Nebenfund Prüfer #851): der Synthese-Suffix «__N» ist
      // UNSERE Eindeutigmachung einer doppelten Fedlex-id — amtlich existiert er
      // nicht. Er bleibt in id/artikel (Schlüssel), darf aber weder ins Label
      // noch in den Anker der quelleUrl. Schlussteil- und Anhang-Pfad unten
      // rechnen seit je auf den rohen Anker zurück; der Haupttext-Pfad zog ihn
      // bis hierher mit («…#art_126_z__2» = amtlich toter Anker).
      const basisToken = token.replace(/__\d+$/, '');
      const ankerAmtlich = `art_${basisToken}`;
      const extrakt = extrahiereArtikel(html, token);

      if (extrakt === null || extrakt.bloecke.length === 0) {
        // Kein extrahierbarer Inhalt → überspringen (kein leerer Snapshot)
        uebersprungen.push({ gesetz: gesetzKey, token: ankerVoll });
        continue;
      }
      await ladeBilder(extrakt.bloecke, name, eli, konsolidierung);

      const id = `bund/${gesetzKey}/${ankerVoll}`;
      const snapshot: NormSnapshot = {
        id,
        ebene: 'bund',
        quelle: gesetzKey,
        erlass,
        artikel: token,
        // M9/G7 + W2·27: Der Synthese-Suffix «__2» geht NIE ins Label. Für das
        // N-te Vorkommen einer doppelten art_id liefert seit W2·27 aber das
        // AMTLICHE Heading das unterscheidende Ordinal (KKV art_126_z Nr. 2:
        // «<sup>tredecies</sup>» → «Art. 126ztredecies», Hausstil der Nachbarn
        // art_126_z_bis … art_126_z_duodecies). Trägt der Kopf kein Ordinal,
        // bleibt es beim Basis-Label (§7: nichts erfinden). Anker/id behalten
        // den Suffix (eindeutig).
        artikelLabel:
          (token === basisToken
            ? null
            : doppelIdLabel(artikelRohHtml(html, ankerVoll), artikelLabel(basisToken))) ??
          artikelLabel(basisToken),
        // Artikel-Metadaten: `aufgehoben` (W2·27 G-AUFH-ART, normtext/aufhebung-signal.ts) und `grundlage` (G23/M8, Delegationsnorm «(Art. N ArG)») — wie `titel` NICHT im Block-sha, also golden-neutral; Reihenfolge titel→aufgehoben→grundlage hält die DB-Projektion byte-gleich.
        ...(extrakt.aufgehoben ? { aufgehoben: true as const } : {}),
        ...(extrakt.grundlage ? { grundlage: extrakt.grundlage } : {}),
        bloecke: extrakt.bloecke,
        stand,
        // W2·27: ROHER amtlicher Anker (ohne «__N»). Bekannte Quell-Unschärfe
        // (§8): bei doppelter id springt Fedlex auf das ERSTE Vorkommen — der
        // Erlass ist damit richtig, die Stelle nur ungenau. Das ist ehrlicher
        // als ein Fragment, das in der amtlichen Fassung gar nicht existiert.
        // Der Verifizier-Deep-Link (src/lib/normtext/verifikationslink.ts)
        // unterdrückt den Artikel-Link bei «__N» weiterhin ganz.
        quelleUrl: `https://www.fedlex.admin.ch/eli/${eli}/de#${ankerAmtlich}`,
        abgerufen,
        fassungsToken: konsolidierung,
        sha: sha256Bloecke(extrakt.bloecke),
      };

      snapshotListe.push(snapshot);
      goldenIndex[id] = snapshot.sha;
    }

    // ── M13: Schlussteil (Schlusstitel/UeB/Schlussbestimmungen) ───────────────
    // Neu-nummerierte Schluss-Divisionen liegen unter eigenem Anker-Schema
    // (`<article id="disp_uN/art_*">`) und fielen vom digit-only-Enumerator weg.
    // ADDITIV an die HAUPTTEXT-Einträge angehängt (HTML-Reihenfolge: nach
    // art_977), mit kollisionsfreiem Token-Namespace («disp_u1_art_1») — der
    // Haupttext bleibt byte-gleich. Die Lese-/Gliederungs-Maschinerie gruppiert
    // sie über das Struktur-Sidecar (gliederung-Label «Schlusstitel: …») von
    // selbst zur eigenen Top-Sektion. quelleUrl trägt den ECHTEN Anker (mit «/»).
    for (const anker of alleSchlussteilAnker(html)) {
      const extrakt = extrahiereArtikelAusAnker(html, anker);
      if (extrakt === null || extrakt.bloecke.length === 0) {
        uebersprungen.push({ gesetz: gesetzKey, token: anker });
        continue;
      }
      await ladeBilder(extrakt.bloecke, name, eli, konsolidierung);
      const token = ankerZuToken(anker);
      const id = `bund/${gesetzKey}/${token}`;
      const snapshot: NormSnapshot = {
        id,
        ebene: 'bund',
        quelle: gesetzKey,
        erlass,
        artikel: token,
        // W2·27: wie im Haupttext-Pfad — bei doppelter id trägt das amtliche
        // Heading des N-ten Vorkommens das Ordinal. Im gepinnten Bund-Korpus
        // gibt es heute keinen «__N»-Schlussteil-Token (Bestand 15.9.2026: der
        // EINZIGE «__N» im ganzen Korpus ist KKV 126_z__2); die Regel steht
        // hier, damit der Pfad nicht still die alte Halbwahrheit erbt.
        artikelLabel:
          (/__\d+$/.test(anker)
            ? doppelIdLabel(artikelRohHtml(html, anker), artikelLabel(schlussteilLabelSuffix(anker)))
            : null) ?? artikelLabel(schlussteilLabelSuffix(anker)),
        ...(extrakt.aufgehoben ? { aufgehoben: true as const } : {}), ...(extrakt.grundlage ? { grundlage: extrakt.grundlage } : {}), // W2·27 + G23, s. Haupttext-Pfad
        bloecke: extrakt.bloecke,
        stand,
        // Roher Anker (mit «/», ohne Synthese-Suffix) als Live-Sprungziel.
        quelleUrl: `https://www.fedlex.admin.ch/eli/${eli}/de#${anker.replace(/__\d+$/, '')}`,
        abgerufen,
        fassungsToken: konsolidierung,
        sha: sha256Bloecke(extrakt.bloecke),
      };
      snapshotListe.push(snapshot);
      goldenIndex[id] = snapshot.sha;
    }

    // ── M13-Annex: Anhänge (annex_N | annex_N_N | annex_N_a) ──────────────────
    // Die Anhänge liegen in einem eigenen Container <div id="annex"> (Geschwister
    // von <main>, nach <div id="dispositions">) als FLACHE <section id="annex_*">
    // — KEINE <article>, KEINE art_-Nummerierung. ADDITIV an Haupttext+Schlussteil
    // angehängt, mit eigenem Token-Namespace («annex_1», «annex_1_1»), der nicht
    // mit dem Haupttext kollidiert. Reine Gruppen-Überschriften ohne eigenen Body
    // (extrahiereAnhang === null) werden übersprungen. Das Struktur-Sidecar
    // (extrahiereAnhangStruktur) gruppiert sie über die Gliederung «Anhänge» zur
    // eigenen Top-Sektion (0 Renderer-Umbau, wie M13-disp).
    for (const anker of alleAnhangAnker(html)) {
      const extrakt = extrahiereAnhang(html, anker);
      if (extrakt === null || extrakt.bloecke.length === 0) {
        uebersprungen.push({ gesetz: gesetzKey, token: anker });
        continue;
      }
      await ladeBilder(extrakt.bloecke, name, eli, konsolidierung);
      const token = ankerZuToken(anker); // annex_1 / annex_1_1 — kein «art_», kein «/» → unverändert
      const id = `bund/${gesetzKey}/${token}`;
      const snapshot: NormSnapshot = {
        id,
        ebene: 'bund',
        quelle: gesetzKey,
        erlass,
        artikel: token,
        artikelLabel: extrakt.titel || anhangLabelVonAnker(anker),
        bloecke: extrakt.bloecke,
        stand,
        // Roher Anker als Live-Sprungziel (Anhänge tragen kein «/», ggf. Synthese-Suffix entfernen).
        quelleUrl: `https://www.fedlex.admin.ch/eli/${eli}/de#${anker.replace(/__\d+$/, '')}`,
        abgerufen,
        fassungsToken: konsolidierung,
        sha: sha256Bloecke(extrakt.bloecke),
      };
      snapshotListe.push(snapshot);
      goldenIndex[id] = snapshot.sha;
    }

    // JSON schreiben — E1-Rest (§6-Schritt, FAHRPLAN-DATENHALTUNG §5): die
    // Bund-Dateien public/normtext/bund/*.json entstehen AUSSCHLIESSLICH aus der
    // DB-Projektion (Spalten-Weg: Zeilen in erlasse/erlass_fassungen/artikel →
    // byte-gleiche Projektion). Der frühere stabelesJson-Direktschreibweg für diese
    // Dateien ist ENTFERNT — die DB ist die EINE Wahrheit (§5, §7 Build-Regel 6);
    // ≥3 grüne Doppelläufe haben die Byte-Gleichheit vorher belegt. Der stehende
    // Byte-Beweis (Projektion == committet) läuft ohne public-Diff über
    // `npm run datenhaltung:doppellauf`.
    const ausgabePfad = `${ausgangsDir}/${gesetzKey}.json`;
    if (snapshotListe.length > 0) {
      const projJson = flipBundErlass(
        flipDb,
        { key: gesetzKey, sr: null, titel: erlass, rechtsgebiet: '', status: 'snapshot' },
        snapshotListe,
      );
      writeFileSync(ausgabePfad, projJson, 'utf8');
    } else {
      // Degenerierter Fall: Erlass ohne einen einzigen extrahierbaren Artikel →
      // keine DB-Zeilen, also nicht projizierbar. Dann eine leere
      // {erzeugt, eintraege:[]}-Datei direkt serialisieren. Kommt im gepinnten
      // Bund-Korpus nicht vor (alle 218 Dateien tragen Einträge; ein leeres Bund-
      // File risse ohnehin den Doppellauf); der Zweig ist reiner §8-Schutz gegen
      // ein stilles Loch, kein konkurrierender Schreibweg zur Projektion.
      const datei: NormSnapshotDatei = { erzeugt: abgerufen, eintraege: snapshotListe };
      writeFileSync(ausgabePfad, stabelesJson(datei), 'utf8');
    }

    totalSnapshots += snapshotListe.length;
    reportZeilen.push(`  ${gesetzKey.padEnd(12)} ${snapshotListe.length} Snapshots → ${ausgabePfad}`);
  }

  // Report ausgeben
  console.log('\n── Ergebnis ──────────────────────────────────────────────────');
  for (const z of reportZeilen) console.log(z);
  console.log(`\nGesamt: ${eintraege.length} Gesetze, ${totalSnapshots} Snapshots`);

  if (uebersprungen.length > 0) {
    console.log('\n── Übersprungene Token (kein extrahierbarer Inhalt) ──────────');
    for (const u of uebersprungen) {
      console.log(`  ${u.gesetz.padEnd(12)} ${u.token}`);
    }
    console.log(`\nTotal übersprungen: ${uebersprungen.length}`);
  } else {
    console.log('\nKeine Token übersprungen.');
  }

  // ── Nur-Bund-Modus (--nur=bund) ─────────────────────────────────────────────
  // Erlaubt das Nachführen NUR der Bund-Snapshots, ohne die kantonalen Quellen
  // (LexWork/ZH/HTM/PDF) erneut über das Netz zu ziehen — so können neue
  // Bundesgesetze ergänzt werden, ohne verifizierte Kantons-Snapshots zu
  // riskieren. Der Golden-Index wird GEMISCHT: die kantonalen Einträge des
  // bestehenden golden/normtext-snapshot.json bleiben unangetastet, nur die
  // bund/*-Schlüssel werden ersetzt. Kanton-Manifest bleibt unverändert.
  if (process.argv.includes('--nur=bund')) {
    const goldenPfad = 'golden/normtext-snapshot.json';
    let bestand: Record<string, string>;
    try {
      bestand = JSON.parse(readFileSync(goldenPfad, 'utf8')) as Record<string, string>;
    } catch {
      throw new Error(
        `--nur=bund: ${goldenPfad} fehlt — ein Voll-Lauf (npm run normtext) muss zuerst die kantonalen Einträge erzeugt haben.`,
      );
    }
    const gemischt: Record<string, string> = {};
    // Die REGENERIERTEN Erlasse (bei --erlass nur der Filter, sonst alle Bund-
    // Erlasse) werden vollständig verworfen und aus goldenIndex frisch ersetzt —
    // so werden GELÖSCHTE/umbenannte Artikel-Keys (eId-Rename, Annex-Reorg,
    // Bereichs-Zusammenfassung) korrekt purgiert. Alle übrigen Keys (Kanton +
    // nicht-regenerierte Bund-Erlasse) bleiben unangetastet. FALLE (5.7.2026):
    // die alte `erlassFilter ? true`-Regel behielt die alten Keys der gefilterten
    // Erlasse → 9 Phantom-Keys (disp_u2_art_108, annex_I_I, art_27_b_bis, …).
    const regenerierteGesetze = new Set(eintraege.map((e) => e.name.toUpperCase()));
    for (const k of Object.keys(bestand)) {
      const m = k.match(/^bund\/([^/]+)\//);
      const istRegeneriert = m !== null && regenerierteGesetze.has(m[1]);
      if (!istRegeneriert) gemischt[k] = bestand[k];
    }
    // frische bund/*-Einträge der regenerierten Erlasse ergänzen
    for (const k of Object.keys(goldenIndex)) gemischt[k] = goldenIndex[k];
    const sortiert: Record<string, string> = {};
    for (const k of Object.keys(gemischt).sort()) sortiert[k] = gemischt[k];
    mkdirSync('golden', { recursive: true });
    writeFileSync(goldenPfad, stabelesJson(sortiert), 'utf8');
    const bundN = Object.keys(goldenIndex).length;
    console.log(
      `\n[--nur=bund] Kantons-/HTM-/ZH-/PDF-Phasen ÜBERSPRUNGEN. Golden gemischt: ` +
        `${bundN} bund/* aktualisiert, ${Object.keys(sortiert).length - bundN} kantonale Einträge bewahrt.`,
    );
    return;
  }

  // ── Kantons-Phase (LexWork) ────────────────────────────────────────────────
  console.log('\n[Normtext-Snapshot] Kantons-Phase (LexWork) …');
  const cov = await erzeugeKantonsSnapshots(abgerufen, goldenIndex);
  const fallback = sammleFallback();
  const fallbackKantone = [...new Set(fallback.map((f) => f.kanton))].sort();

  console.log('\n── Kantons-Snapshots ─────────────────────────────────────────');
  for (const z of cov.reportZeilen) console.log(z);
  console.log(`\nGesamt Kantone: ${cov.totalSnapshots} Snapshots in ${cov.reportZeilen.length} Datei(en)`);

  console.log('\n── Coverage-Report (Kantone) ─────────────────────────────────');
  console.log(`nurPdf (kein Snapshot): ${cov.nurPdf.length}`);
  for (const p of cov.nurPdf) console.log(`  ${p.kanton} ${p.erlass} [${p.lawId}]`);
  console.log(`Token nicht gefunden: ${cov.tokenFehlt.length}`);
  for (const t of cov.tokenFehlt) console.log(`  ${t.kanton} ${t.lawId} art_${t.token} (${t.label})`);
  console.log(`fetch-Fehler: ${cov.fetchFehler.length}`);
  for (const f of cov.fetchFehler) console.log(`  ${f.kanton} ${f.lawId}: ${f.fehler}`);
  console.log(`Fallback-Quellen (Nicht-LexWork/Nicht-HTM, kein Snapshot): ${fallback.length} in ${fallbackKantone.length} Kantonen`);
  console.log(`  Kantone: ${fallbackKantone.join(', ')}`);

  // ── HTM-Phase (NE/GE, Word-Export-HTM) ───────────────────────────────────
  console.log('\n[Normtext-Snapshot] HTM-Phase (NE/GE, Word-Export) …');
  const htmCov = await erzeugeHtmSnapshots(abgerufen, goldenIndex);

  console.log('\n── HTM-Snapshots (NE/GE) ─────────────────────────────────────');
  for (const z of htmCov.reportZeilen) console.log(z);
  console.log(`\nGesamt HTM: ${htmCov.totalSnapshots} Snapshots in ${htmCov.reportZeilen.length} Zeile(n)`);
  console.log(`Token nicht im Erlass (HTM): ${htmCov.tokenFehlt.length}`);
  for (const t of htmCov.tokenFehlt) console.log(`  ${t.kanton} ${t.lawIdSafe} art_${t.token} (${t.label})`);
  console.log(`fetch-Fehler (HTM): ${htmCov.fetchFehler.length}`);
  for (const f of htmCov.fetchFehler) console.log(`  ${f.kanton} ${f.url}: ${f.fehler}`);

  // ── ZH-Phase (zhlex Text-PDF via pdfjs) ──────────────────────────────────
  console.log('\n[Normtext-Snapshot] ZH-Phase (zhlex Text-PDF) …');
  const zhCov = await erzeugeZhPdfSnapshots(abgerufen, goldenIndex);
  console.log('\n── ZH-Snapshots (zhlex PDF) ──────────────────────────────────');
  for (const z of zhCov.reportZeilen) console.log(z);
  console.log(`\nGesamt ZH: ${zhCov.totalSnapshots} Snapshots in ${zhCov.reportZeilen.length} Zeile(n)`);
  console.log(`Token nicht im Erlass (ZH): ${zhCov.tokenFehlt.length}`);
  for (const t of zhCov.tokenFehlt) console.log(`  ${t.kanton} ${t.lawIdSafe} art_${t.token} (${t.label})`);
  console.log(`fetch-Fehler (ZH): ${zhCov.fetchFehler.length}`);
  for (const f of zhCov.fetchFehler) console.log(`  ${f.kanton} ${f.url}: ${f.fehler}`);

  // ── PDF-Phase (SZ/TI/VD/JU, generischer Einzelspalten-PDF-Adapter) ───────
  console.log('\n[Normtext-Snapshot] PDF-Phase (SZ/TI/VD/JU Text-PDF) …');
  const pdfCov = await erzeugePdfSnapshots(abgerufen, goldenIndex);
  console.log('\n── PDF-Snapshots (SZ/TI/VD/JU) ───────────────────────────────');
  for (const z of pdfCov.reportZeilen) console.log(z);
  console.log(`\nGesamt PDF: ${pdfCov.totalSnapshots} Snapshots in ${pdfCov.reportZeilen.length} Zeile(n)`);
  console.log(`Token nicht im Erlass (PDF): ${pdfCov.tokenFehlt.length}`);
  for (const t of pdfCov.tokenFehlt) console.log(`  ${t.kanton} ${t.lawIdSafe} art_${t.token} (${t.label})`);
  console.log(`fetch-Fehler (PDF): ${pdfCov.fetchFehler.length}`);
  for (const f of pdfCov.fetchFehler) console.log(`  ${f.kanton} ${f.url}: ${f.fehler}`);

  // ── Kanton-Manifest (quelleUrl → Dateiname) aktualisieren ────────────────
  const kantonManifest = baueManifest('public/normtext/kanton');
  const kantonManifestSortiert: Record<string, string> = {};
  for (const k of Object.keys(kantonManifest).sort()) {
    kantonManifestSortiert[k] = kantonManifest[k];
  }
  writeFileSync(
    'public/normtext/kanton/index.json',
    stabelesJson(kantonManifestSortiert),
    'utf8',
  );
  console.log(
    `\nKanton-Manifest: public/normtext/kanton/index.json (${Object.keys(kantonManifestSortiert).length} Einträge)`,
  );

  // ── Browse-Manifest (Rubrik V «Gesetze»): Register × Snapshots ───────────
  const browse = baueBrowseManifest(abgerufen);
  writeFileSync(
    'public/normtext/register.json',
    JSON.stringify(browse, null, 2) + '\n',
    'utf8',
  );
  console.log(
    `\nBrowse-Manifest: public/normtext/register.json (${browse.erlasse.length} Erlasse)`,
  );

  // ── Golden-Index schreiben: GEMISCHT, nicht pauschal ──────────────────────
  // Bis zum 13.8.2026 stand hier `goldenIndex` direkt als neuer Bestand. Das
  // machte jeden Routen-Ausfall zu einem stillen Datenverlust: eine Quelle
  // liefert 0 Knoten, ihre Snapshot-Datei bleibt aber liegen (sie wird nur bei
  // Erfolg überschrieben) — und der Erlass verlor seine Drift-Basis (§7 lit. d).
  //
  // ZWEIMAL belegt, mit fast identischer Zahl: 27.7.2026 (PR #383) 55'763 →
  // 32'639, und 10.8.2026 (b84ee8302, Fedlex-Frische-Automatik) 56'113 → 32'640
  // — beide Male −23'473 Kantons-Knoten. Nach dem ersten Mal wurde nur das TOR
  // gebaut (check:golden-normtext), nicht die Ursache behoben; §17 verlangt den
  // Wurzel-Fix, sonst wiederholt sich der Vorfall — was er tat.
  //
  // Merge-Regel: scripts/normtext/golden-kanton-merge.ts (eine Quelle für alle
  // Lauf-Arten, isoliert getestet in src/tests/golden-voll-lauf-merge.test.ts).
  const goldenPfadVoll = 'golden/normtext-snapshot.json';
  let bestandVoll: Record<string, string> = {};
  if (existsSync(goldenPfadVoll)) {
    bestandVoll = JSON.parse(readFileSync(goldenPfadVoll, 'utf8')) as Record<string, string>;
  }
  // Erstlauf (kein Bestand) → der Lauf-Index IST der Bestand; die Merge-Regel
  // liefert dann von selbst genau das.
  const mergeVoll = mischeGoldenVollLauf(bestandVoll, goldenIndex, (p) => existsSync(p));

  if (mergeVoll.bewahrt.length > 0) {
    const zeige = mergeVoll.bewahrt.slice(0, 12).join(', ');
    console.warn(
      `\n⚠  §8: ${mergeVoll.bewahrt.length} Erlass(e) lieferten in diesem Lauf KEINEN Knoten, ` +
        `ihre Snapshot-Datei liegt aber weiterhin vor — Golden-Altbestand BEWAHRT ` +
        `(nicht gefahrene Route / Fetch-Fehler): ${zeige}` +
        `${mergeVoll.bewahrt.length > 12 ? ` … (+${mergeVoll.bewahrt.length - 12})` : ''}`,
    );
  }
  if (mergeVoll.verworfen.length > 0) {
    console.log(
      `\n${mergeVoll.verworfen.length} Erlass-Präfix(e) ohne Knoten UND ohne Snapshot-Datei ` +
        `— aus dem Index entfernt (Korpus-Abgang): ${mergeVoll.verworfen.join(', ')}`,
    );
  }

  const goldenSortiert: Record<string, string> = {};
  for (const k of Object.keys(mergeVoll.gemischt).sort()) {
    goldenSortiert[k] = mergeVoll.gemischt[k];
  }
  mkdirSync('golden', { recursive: true });
  writeFileSync(goldenPfadVoll, stabelesJson(goldenSortiert), 'utf8');
  console.log(
    `\nGolden-Index: ${goldenPfadVoll} (${Object.keys(goldenSortiert).length} Einträge; ` +
      `${Object.keys(goldenIndex).length} in diesem Lauf erzeugt, ` +
      `${mergeVoll.bewahrt.length} Erlasse bewahrt, ${mergeVoll.verworfen.length} verworfen)`,
  );
}

// Nur als CLI-Skript ausführen, NICHT beim Import aus einem Unit-Test (der nur
// erlassBezeichnung u.ä. prüft). Unter vite-node steht der Skriptpfad NICHT in
// process.argv (das ist nur ['node','vite-node', …flags]) — ein Pfad-Regex
// schlägt darum fehl und main() liefe nie (Bug 23.6.). Der einzige Importer ist
// der vitest-Test; vitest setzt process.env.VITEST. Daran erkennen wir den Import
// und überspringen main(); jeder echte CLI-Lauf (vite-node) hat VITEST nicht.
const direktAufruf = typeof process !== 'undefined' && !process.env.VITEST;
if (direktAufruf) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
