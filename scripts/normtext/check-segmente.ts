/**
 * scripts/normtext/check-segmente.ts — CLI für `check:segmente` (QS-KORPUS).
 *
 * Siehe scripts/normtext/segmente-logik.ts für die reine Logik und die
 * Architektur-Begründung (Herz-und-Nieren-Prüfung 24.9.2026, Befund
 * normtext-treue-11; NACHTRAG 25.9.2026 «eingefrorenes Soll»).
 *
 * ZWEI MODI (NACHTRAG Punkte B/C):
 *  - Modus B (KEIN /tmp-Cache — der Normalfall in PR-CI/Merge-Queue): prüft
 *    die committete Projektion `public/normtext/bund/<KEY>.json` GEGEN das
 *    committete Soll `scripts/normtext/segmente-soll/<name>.json` — scharf,
 *    kein Hinweis-Grün mehr. Das ist der eigentliche PR-Schutz (Rot-Beweis R9).
 *  - Modus C (VOLLER, pin-gültiger /tmp-Cache — lokal nach `fedlex-cache.sh`
 *    oder im Frische-Arm mit `--cache-pflicht`): leitet das Soll frisch aus
 *    der HTML ab, vergleicht es mit dem committeten (Abweichung ⇒ rot, «Soll
 *    veraltet»), prüft danach wie B — mit den frischen (garantiert aktuellen)
 *    Fingerabdrücken. `--schreiben` aktualisiert die committeten Soll-Dateien.
 *
 * Cache-Semantik ausserhalb der Moduswahl (unverändert ggü. `check:p-klassen`,
 * Zeilen ~105/175–205 dort): Teilbestand (0 < vorhanden < alle) ⇒ FEHLER;
 * `--cache-pflicht`/`LEXMETRIK_CACHE_PFLICHT=1` ohne Cache ⇒ FEHLER;
 * pin-ungültiger Cache (bei vollem Bestand) ⇒ FEHLER.
 *
 * `LEXMETRIK_FEDLEX_CACHE_DIR` (Default `/tmp`): NUR für die eigenen Rot-Beweise
 * (R6–R9, s. Bericht) — ein Test-Cache-Verzeichnis statt des mit anderen
 * Sessions GETEILTEN `/tmp`, damit die Rot-Proben den echten Cache nie anfassen.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parseFedlexCacheEintraege, type FedlexCacheEintrag } from './inventar-bund.ts';
import { pinBefund, pinIdentitaet } from './cache-pin-befund.ts';
import {
  fehlendeIndizes,
  fingerabdruck,
  fingerabdrueckeZuSoll,
  gleicheBasislinieAb,
  normalisiere,
  parseErlassHtml,
  pinIdentGleich,
  projektionsBlob,
  segmentiereAnker,
  SEGMENT_MINDESTLAENGE,
  SEGMENTER_VERSION,
  sollZuFingerabdruecke,
  type BasislinienEintrag,
  type Fingerabdruck,
  type ProjektionsEintrag,
  type SollDatei,
  type SollPin,
} from './segmente-logik.ts';

const STANDARD_CACHE_DIR = '/tmp';
const cacheDir = process.env.LEXMETRIK_FEDLEX_CACHE_DIR || STANDARD_CACHE_DIR;
const cachePflicht = process.argv.includes('--cache-pflicht') || process.env.LEXMETRIK_CACHE_PFLICHT === '1';
const schreibenModus = process.argv.includes('--schreiben');

const SOLL_VERZEICHNIS = 'scripts/normtext/segmente-soll';
const BASISLINIEN_PFAD = 'scripts/normtext/segmente-basislinie.json';
const PROJEKTIONS_VERZEICHNIS = 'public/normtext/bund';

// Kollaps-Sperre (wie `check:p-klassen`s `MINDEST_ARTIKELZAHL`): der reale
// Bestand hat ~24'900 `art_`-Einträge + ~700 weitere (`annex_`/`disp_`/`scope_`/
// `decl_`) — ein Einbruch auf (nahe) 0 darf nie als "✓ keine Verluste" durchgehen.
const MINDEST_ARTIKELZAHL = 20_000;

type Fund = { erlass: string; eId: string; hash: string; laenge: number; auszug?: string };

function fehlerUndExit(zeilen: string[]): never {
  for (const z of zeilen) console.error(z);
  process.exit(1);
}

// ── Cache-Zustand ───────────────────────────────────────────────────────────

/**
 * Pin-Prüfung: der Produktionspfad (`/tmp`) nutzt die geteilte Sonde 1:1
 * (§ Architektur Ziff. 1); ein Test-Verzeichnis (`LEXMETRIK_FEDLEX_CACHE_DIR`)
 * prüft denselben Identitäts-String (`pinIdentitaet` — reine Formatierung ohne
 * Pfad) selbst nach, weil `pinBefund` `/tmp` fest verdrahtet liest.
 */
function liesPinBefund(e: FedlexCacheEintrag): { ok: boolean; grund?: string } {
  if (cacheDir === STANDARD_CACHE_DIR) return pinBefund(e.name, e.eli, e.konsolidierung, e.htmlN);
  const pinPfad = `${cacheDir}/${e.name}.html.pin`;
  if (!existsSync(pinPfad)) return { ok: false, grund: 'Pin-Marker fehlt (Testverzeichnis)' };
  const inhalt = readFileSync(pinPfad, 'utf8').trim();
  const erwartet = pinIdentitaet(e.eli, e.konsolidierung, e.htmlN);
  return inhalt === erwartet
    ? { ok: true }
    : { ok: false, grund: `Pin weicht ab (Testverzeichnis): ${inhalt} ≠ ${erwartet}` };
}

function ermittleCacheZustand(eintraege: FedlexCacheEintrag[]): { vorhanden: number; pinFehler: string[] } {
  let vorhanden = 0;
  const pinFehler: string[] = [];
  for (const e of eintraege) {
    if (!existsSync(`${cacheDir}/${e.name}.html`)) continue;
    vorhanden++;
    const pin = liesPinBefund(e);
    if (!pin.ok) pinFehler.push(`  FEHLER ${e.name}: ${pin.grund}`);
  }
  return { vorhanden, pinFehler };
}

// ── Soll-/Projektions-/Basislinien-I/O ─────────────────────────────────────

function liesSollDatei(name: string): SollDatei | null {
  const pfad = `${SOLL_VERZEICHNIS}/${name}.json`;
  if (!existsSync(pfad)) return null;
  return JSON.parse(readFileSync(pfad, 'utf8')) as SollDatei;
}

function ladeProjektion(key: string): Map<string, ProjektionsEintrag> | null {
  const pfad = `${PROJEKTIONS_VERZEICHNIS}/${key}.json`;
  if (!existsSync(pfad)) return null;
  const daten = JSON.parse(readFileSync(pfad, 'utf8')) as { eintraege: ProjektionsEintrag[] };
  const map = new Map<string, ProjektionsEintrag>();
  for (const e of daten.eintraege) map.set(e.id, e);
  return map;
}

function ladeBasislinie(): BasislinienEintrag[] {
  if (!existsSync(BASISLINIEN_PFAD)) return [];
  return JSON.parse(readFileSync(BASISLINIEN_PFAD, 'utf8')) as BasislinienEintrag[];
}

function sollInhaltGleich(
  a: Record<string, [number, string][]>,
  b: Record<string, [number, string][]>,
): boolean {
  const schluesselA = Object.keys(a).sort();
  const schluesselB = Object.keys(b).sort();
  if (schluesselA.length !== schluesselB.length) return false;
  for (let i = 0; i < schluesselA.length; i++) if (schluesselA[i] !== schluesselB[i]) return false;
  for (const eId of schluesselA) {
    const sa = new Set(a[eId].map(([l, h]) => `${l}:${h}`));
    const sb = new Set(b[eId].map(([l, h]) => `${l}:${h}`));
    if (sa.size !== sb.size) return false;
    for (const v of sa) if (!sb.has(v)) return false;
  }
  return true;
}

// ── Frische Ableitung aus HTML (Modus C / --schreiben) ─────────────────────

interface FrischesSoll {
  pin: SollPin;
  artikel: Record<string, Fingerabdruck[]>;
  auszuegeJeEid: Map<string, Map<string, string>>; // eId -> hash -> Auszug (≤80 Zeichen, NUR Report/Basislinie)
  keinAnkerLokalisierbar: string[];
}

function leiteFrischesSollAb(e: FedlexCacheEintrag): FrischesSoll {
  const html = readFileSync(`${cacheDir}/${e.name}.html`, 'utf8');
  const dokument = parseErlassHtml(html);
  const key = e.name.toUpperCase();
  const projektion = ladeProjektion(key);
  const artikel: Record<string, Fingerabdruck[]> = {};
  const auszuegeJeEid = new Map<string, Map<string, string>>();
  const keinAnkerLokalisierbar: string[] = [];

  for (const eintrag of projektion?.values() ?? []) {
    const praefix = `bund/${key}/`;
    if (!eintrag.id.startsWith(praefix)) continue; // sollte laut Schema nie vorkommen (empirisch geprüft, 25601/25601)
    const eId = eintrag.id.slice(praefix.length);
    const rohSegmente = segmentiereAnker(dokument, eId);
    if (rohSegmente === null) {
      keinAnkerLokalisierbar.push(eId);
      continue;
    }
    const fps: Fingerabdruck[] = [];
    const auszuege = new Map<string, string>();
    for (const roh of rohSegmente) {
      const normalisiert = normalisiere(roh.text);
      if (normalisiert.length < SEGMENT_MINDESTLAENGE) continue;
      const fp = fingerabdruck(normalisiert);
      fps.push(fp);
      if (!auszuege.has(fp.hash)) auszuege.set(fp.hash, roh.text.trim().replace(/\s+/g, ' ').slice(0, 80));
    }
    artikel[eId] = fps;
    if (auszuege.size) auszuegeJeEid.set(eId, auszuege);
  }

  return {
    pin: { eli: e.eli, konsolidierung: e.konsolidierung, htmlN: e.htmlN },
    artikel,
    auszuegeJeEid,
    keinAnkerLokalisierbar,
  };
}

// ── Enthaltensein je Erlass (EINE Logik für Modus B und C, § Architektur Ziff. 6) ─

function pruefeErlassGegenProjektion(
  key: string,
  artikelSoll: Record<string, [number, string][]>,
  auszuegeJeEid?: Map<string, Map<string, string>>,
): { funde: Fund[]; keinProjektionsEintrag: string[]; geprueftArtikel: number } {
  const projektion = ladeProjektion(key);
  const funde: Fund[] = [];
  const keinProjektionsEintrag: string[] = [];
  let geprueftArtikel = 0;

  for (const [eId, paare] of Object.entries(artikelSoll)) {
    const eintrag = projektion?.get(`bund/${key}/${eId}`);
    if (!eintrag) {
      keinProjektionsEintrag.push(eId);
      continue;
    }
    geprueftArtikel++;
    const fps = sollZuFingerabdruecke(paare);
    const blob = projektionsBlob(eintrag);
    for (const i of fehlendeIndizes(blob, fps)) {
      const fp = fps[i];
      funde.push({ erlass: key, eId, hash: fp.hash, laenge: fp.laenge, auszug: auszuegeJeEid?.get(eId)?.get(fp.hash) });
    }
  }
  return { funde, keinProjektionsEintrag, geprueftArtikel };
}

// ── --schreiben ─────────────────────────────────────────────────────────────

function schreibeSoll(eintraege: FedlexCacheEintrag[]): void {
  mkdirSync(SOLL_VERZEICHNIS, { recursive: true });
  let gesamtArtikel = 0;
  let gesamtSegmente = 0;
  let gesamtKeinAnker = 0;
  for (const e of eintraege) {
    const frisch = leiteFrischesSollAb(e);
    const sollDatei: SollDatei = {
      pin: frisch.pin,
      segmenterVersion: SEGMENTER_VERSION,
      artikel: Object.fromEntries(
        Object.entries(frisch.artikel).map(([eId, fps]) => [eId, fingerabdrueckeZuSoll(fps)]),
      ),
    };
    writeFileSync(`${SOLL_VERZEICHNIS}/${e.name}.json`, JSON.stringify(sollDatei) + '\n', 'utf8');
    gesamtArtikel += Object.keys(frisch.artikel).length;
    for (const fps of Object.values(frisch.artikel)) gesamtSegmente += fps.length;
    gesamtKeinAnker += frisch.keinAnkerLokalisierbar.length;
  }
  console.log(
    `✓ --schreiben: ${eintraege.length} Soll-Dateien in ${SOLL_VERZEICHNIS}/ geschrieben ` +
      `(${gesamtArtikel} Artikel, ${gesamtSegmente} Segmente, ${gesamtKeinAnker} ohne lokalisierbaren Anker — ausgeklammert).`,
  );
}

// ── Modus B / Modus C ────────────────────────────────────────────────────────

interface Zwischenergebnis {
  modus: 'B' | 'C';
  eintraege: FedlexCacheEintrag[];
  alleFunde: Fund[];
  sollVeraltet: string[];
  keinSoll: string[];
  keinProjektionsEintragGesamt: Array<{ erlass: string; eId: string }>;
  geprueftArtikelGesamt: number;
}

function pruefeModusB(eintraege: FedlexCacheEintrag[]): Zwischenergebnis {
  const alleFunde: Fund[] = [];
  const sollVeraltet: string[] = [];
  const keinSoll: string[] = [];
  const keinProjektionsEintragGesamt: Array<{ erlass: string; eId: string }> = [];
  let geprueftArtikelGesamt = 0;

  for (const e of eintraege) {
    const committedSoll = liesSollDatei(e.name);
    if (!committedSoll) {
      keinSoll.push(e.name);
      continue;
    }
    const aktuellerPin: SollPin = { eli: e.eli, konsolidierung: e.konsolidierung, htmlN: e.htmlN };
    if (!pinIdentGleich(committedSoll.pin, aktuellerPin) || committedSoll.segmenterVersion !== SEGMENTER_VERSION) {
      sollVeraltet.push(e.name);
      continue; // ein ungültiges Soll für Enthaltensein zu nutzen wäre wertlos.
    }
    const key = e.name.toUpperCase();
    const { funde, keinProjektionsEintrag, geprueftArtikel } = pruefeErlassGegenProjektion(key, committedSoll.artikel);
    alleFunde.push(...funde);
    for (const eId of keinProjektionsEintrag) keinProjektionsEintragGesamt.push({ erlass: key, eId });
    geprueftArtikelGesamt += geprueftArtikel;
  }
  return { modus: 'B', eintraege, alleFunde, sollVeraltet, keinSoll, keinProjektionsEintragGesamt, geprueftArtikelGesamt };
}

function pruefeModusC(eintraege: FedlexCacheEintrag[]): Zwischenergebnis {
  const alleFunde: Fund[] = [];
  const sollVeraltet: string[] = [];
  const keinSoll: string[] = [];
  const keinProjektionsEintragGesamt: Array<{ erlass: string; eId: string }> = [];
  let geprueftArtikelGesamt = 0;

  for (const e of eintraege) {
    const frisch = leiteFrischesSollAb(e);
    const kompaktesSoll = Object.fromEntries(
      Object.entries(frisch.artikel).map(([eId, fps]) => [eId, fingerabdrueckeZuSoll(fps)]),
    );
    const committedSoll = liesSollDatei(e.name);
    if (!committedSoll) {
      keinSoll.push(e.name);
    } else {
      const pinGleich = pinIdentGleich(committedSoll.pin, frisch.pin) && committedSoll.segmenterVersion === SEGMENTER_VERSION;
      const inhaltGleich = pinGleich && sollInhaltGleich(committedSoll.artikel, kompaktesSoll);
      if (!pinGleich || !inhaltGleich) sollVeraltet.push(e.name);
    }

    const key = e.name.toUpperCase();
    const { funde, keinProjektionsEintrag, geprueftArtikel } = pruefeErlassGegenProjektion(
      key,
      kompaktesSoll,
      frisch.auszuegeJeEid,
    );
    alleFunde.push(...funde);
    for (const eId of keinProjektionsEintrag) keinProjektionsEintragGesamt.push({ erlass: key, eId });
    geprueftArtikelGesamt += geprueftArtikel;
  }
  return { modus: 'C', eintraege, alleFunde, sollVeraltet, keinSoll, keinProjektionsEintragGesamt, geprueftArtikelGesamt };
}

// ── Bericht + Urteil ─────────────────────────────────────────────────────────

function berichteUndBewerte(z: Zwischenergebnis): void {
  const basislinie = ladeBasislinie();
  const abgleich = gleicheBasislinieAb(z.alleFunde, basislinie);
  let fehler = false;

  console.log(`[check:segmente] Modus ${z.modus} — ${z.eintraege.length} Erlasse, ${z.geprueftArtikelGesamt} Artikel geprüft.`);

  if (z.keinSoll.length > 0) {
    fehler = true;
    console.error(`❌ FEHLER: kein Soll für ${z.keinSoll.length} gepinnte(n) Erlass(e): ${z.keinSoll.join(', ')}`);
    console.error('   → mit vollständigem Cache: npm run check:segmente -- --schreiben');
  }
  if (z.sollVeraltet.length > 0) {
    fehler = true;
    console.error(
      `❌ FEHLER: Soll veraltet (Pin/Segmenter-Version/Inhalt weicht vom aktuellen Stand ab) ` +
        `für ${z.sollVeraltet.length} Erlass(e): ${z.sollVeraltet.join(', ')}`,
    );
    console.error('   → mit vollständigem Cache: npm run check:segmente -- --schreiben');
  }
  if (z.geprueftArtikelGesamt < MINDEST_ARTIKELZAHL) {
    fehler = true;
    console.error(
      `❌ FEHLER: nur ${z.geprueftArtikelGesamt} Artikel geprüft (Mindestzahl ${MINDEST_ARTIKELZAHL}) — Prüfung unzuverlässig statt grün.`,
    );
  }
  if (z.keinProjektionsEintragGesamt.length > 0) {
    fehler = true;
    console.error(
      `❌ FEHLER: ${z.keinProjektionsEintragGesamt.length} im Soll bekannte Artikel haben KEINEN Projektions-Eintrag mehr (Rückschritt):`,
    );
    for (const { erlass, eId } of z.keinProjektionsEintragGesamt.slice(0, 20)) console.error(`   · ${erlass} ${eId}`);
  }
  if (abgleich.neu.length > 0) {
    fehler = true;
    console.error(`❌ NEUE fehlende Segmente (nicht in der Basislinie), ${abgleich.neu.length}:`);
    for (const f of abgleich.neu) {
      console.error(`   · ${f.erlass} ${f.eId} (Länge ${f.laenge}, Hash ${f.hash})${f.auszug ? `: "${f.auszug}"` : ''}`);
    }
  }
  if (abgleich.veraltet.length > 0) {
    fehler = true;
    console.error(`❌ VERALTETE Basislinien-Einträge (heute nicht mehr fehlend — Eintrag entfernen), ${abgleich.veraltet.length}:`);
    for (const e of abgleich.veraltet) console.error(`   · ${e.erlass} ${e.eId} (${e.befund}): "${e.auszug}"`);
  }
  if (abgleich.bekannt.length > 0) {
    const nachBefund = new Map<string, number>();
    for (const e of abgleich.bekannt) nachBefund.set(e.befund, (nachBefund.get(e.befund) ?? 0) + 1);
    console.log(`ℹ  ${abgleich.bekannt.length} bekannte, in der Basislinie erfasste Lücke(n):`);
    for (const [befund, n] of [...nachBefund].sort()) console.log(`   · ${befund}: ${n}`);
  }

  if (fehler) process.exit(1);
  console.log(
    `✓ check:segmente grün — Modus ${z.modus}, ${z.geprueftArtikelGesamt} Artikel, ` +
      `${abgleich.bekannt.length} bekannte Lücke(n), 0 neue.`,
  );
}

// ── Haupt ────────────────────────────────────────────────────────────────

function main(): void {
  const shell = readFileSync('scripts/fedlex-cache.sh', 'utf8');
  const eintraege = parseFedlexCacheEintraege(shell);
  const { vorhanden, pinFehler } = ermittleCacheZustand(eintraege);

  if (vorhanden > 0 && vorhanden < eintraege.length) {
    fehlerUndExit([
      `❌ FEHLER: nur ${vorhanden}/${eintraege.length} Bund-Erlasse haben einen Cache in ${cacheDir} (Teilbestand)`,
      "   — entweder ALLE Caches bereitstellen ('bash scripts/fedlex-cache.sh') oder KEINEN.",
    ]);
  }
  if (vorhanden === 0 && cachePflicht) {
    fehlerUndExit([
      `❌ FEHLER: --cache-pflicht/LEXMETRIK_CACHE_PFLICHT verlangt Bund-Caches, aber 0/${eintraege.length} in ${cacheDir} vorhanden.`,
    ]);
  }
  if (vorhanden === eintraege.length && pinFehler.length > 0) {
    fehlerUndExit([...pinFehler, `❌ FEHLER: ${pinFehler.length} Cache(s) pin-ungültig — Prüfung unzuverlässig statt grün.`]);
  }

  if (schreibenModus) {
    if (vorhanden !== eintraege.length || pinFehler.length > 0) {
      fehlerUndExit([
        `❌ FEHLER: --schreiben verlangt einen VOLLSTÄNDIGEN, pin-gültigen Cache ` +
          `(${vorhanden}/${eintraege.length} in ${cacheDir} vorhanden, ${pinFehler.length} pin-ungültig).`,
      ]);
    }
    schreibeSoll(eintraege);
    return;
  }

  const modusC = vorhanden === eintraege.length; // voller, pin-gültiger Cache (bereits oben geprüft)
  berichteUndBewerte(modusC ? pruefeModusC(eintraege) : pruefeModusB(eintraege));
}

main();
