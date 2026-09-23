// ─── Build-Generator: Struktur-Sidecar-Fussnoten → Artikel-Historie (G-HIST) ──
//
// Infonutzungs-Recherche 17.7.2026 (Kandidat G-HIST, David-Bau-GO 17.7.).
// Liest die Bund-Struktur-Sidecars (`public/normtext/struktur/bund/*.json`),
// parst je Artikel die GESPEICHERTE Fussnoten-Prosa deterministisch zu einer
// strukturierten In-Kraft-/Änderungs-Timeline (src/lib/normtext/historie-parse.ts,
// EIN Ort §5) und schreibt je Erlass MIT mindestens einem Ereignis/Residuum
// einen Shard nach `public/normtext/historie/<KEY>.json`.
//
//   npm run gen:historie     erzeugt/aktualisiert die Shards
//   npm run check:historie   prüft Drift (Shards ≠ Sidecars) → exit 1
//
// Architektur-Vorgabe (Kollisionsvermeidung): SEPARATES Artefakt. Die Struktur-/
// Snapshot-Dateien (`public/normtext/struktur/**`, Snapshots) werden NICHT
// verändert (nur gelesen) — die offenen Flotten-PRs (insb. #255) bleiben unberührt.
// Golden ist unberührt (neues Artefakt). Vorbild: extrahiere-artikel-revisionen.ts
// (Serialisierung + --check-Drift). Niemals von Hand editieren.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  baueArtikelHistorie,
  type FnEingang,
  type ArtikelHistorie,
} from '../../src/lib/normtext/historie-parse.ts';
import { pruefeAufgehobenLebend, LEBEND_SCHWELLE } from './historie-aufgehoben-lebend.ts';

const wurzel = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const QUELLE = resolve(wurzel, 'public/normtext/struktur/bund');
const ZIEL = resolve(wurzel, 'public/normtext/historie');
const TEXT = resolve(wurzel, 'public/normtext/bund');

interface Sidecar {
  artikel?: Record<string, { fussnoten?: FnEingang[] }>;
}

interface Abdeckung {
  fussnoten: number;
  ereignis: number;
  referenz: number;
  unparsed: number;
}

/** Aggregierte Korpus-Abdeckung (über alle Erlasse) — für den Report. */
interface Korpus extends Abdeckung {
  erlasse: number;
  shards: number;
  artikelMitHistorie: number;
  ereignisse: number;
  ereignisseDatiert: number;
}

/**
 * Ein Erlass-Sidecar → deterministischer Shard-String (Token sortiert) + Zählwerk.
 * Rückgabe null, wenn der Erlass weder ein Ereignis noch ein Residuum trägt.
 */
function baueShard(erlass: string, doc: Sidecar): { json: string; abdeckung: Abdeckung; artikelMitHistorie: number; ereignisse: number; ereignisseDatiert: number } | null {
  const artikel: Record<string, ArtikelHistorie> = {};
  const residuum: Array<{ token: string; nr: string; roh: string }> = [];
  const abdeckung: Abdeckung = { fussnoten: 0, ereignis: 0, referenz: 0, unparsed: 0 };
  let ereignisse = 0;
  let ereignisseDatiert = 0;

  const tokens = Object.keys(doc.artikel ?? {}).sort();
  for (const token of tokens) {
    const fussnoten = doc.artikel![token].fussnoten ?? [];
    if (fussnoten.length === 0) continue;
    abdeckung.fussnoten += fussnoten.length;
    const { historie, unparsed, refCount, ereignisFnCount } = baueArtikelHistorie(fussnoten);
    abdeckung.ereignis += ereignisFnCount;
    abdeckung.referenz += refCount;
    abdeckung.unparsed += unparsed.length;
    for (const fn of unparsed) {
      residuum.push({ token, nr: fn.nr ?? '', roh: (fn.text ?? '').replace(/<\/?[bi]>/gi, '').replace(/\s+/g, ' ').trim() });
    }
    if (historie) {
      artikel[token] = historie;
      ereignisse += historie.ereignisse.length;
      ereignisseDatiert += historie.ereignisse.filter((e) => e.datum).length;
    }
  }

  if (Object.keys(artikel).length === 0 && residuum.length === 0) return null;

  // Deterministische Serialisierung: Erlass-Meta zuerst, dann sortierte Artikel,
  // dann Residuum in Token-Reihenfolge (stabile Byte-Ausgabe, §2).
  const shard = { erlass, abdeckung, artikel, residuum };
  return {
    json: JSON.stringify(shard, null, 1) + '\n',
    abdeckung,
    artikelMitHistorie: Object.keys(artikel).length,
    ereignisse,
    ereignisseDatiert,
  };
}

/** Alle Sidecars → {erlass → Shard-JSON} + Korpus-Aggregat. */
function baueAlle(): { shards: Map<string, string>; korpus: Korpus } {
  const shards = new Map<string, string>();
  const korpus: Korpus = {
    erlasse: 0, shards: 0, fussnoten: 0, ereignis: 0, referenz: 0, unparsed: 0,
    artikelMitHistorie: 0, ereignisse: 0, ereignisseDatiert: 0,
  };
  const dateien = readdirSync(QUELLE).filter((f) => f.endsWith('.json')).sort();
  for (const datei of dateien) {
    korpus.erlasse++;
    const erlass = datei.replace(/\.json$/, '');
    const doc = JSON.parse(readFileSync(resolve(QUELLE, datei), 'utf8')) as Sidecar;
    const res = baueShard(erlass, doc);
    // Korpus-Abdeckung IMMER mitzählen (auch Erlasse ohne Shard bleiben Teil des Nenners).
    if (res) {
      shards.set(erlass, res.json);
      korpus.shards++;
      korpus.fussnoten += res.abdeckung.fussnoten;
      korpus.ereignis += res.abdeckung.ereignis;
      korpus.referenz += res.abdeckung.referenz;
      korpus.unparsed += res.abdeckung.unparsed;
      korpus.artikelMitHistorie += res.artikelMitHistorie;
      korpus.ereignisse += res.ereignisse;
      korpus.ereignisseDatiert += res.ereignisseDatiert;
    }
  }
  return { shards, korpus };
}

function berichte(korpus: Korpus): void {
  const parsebar = korpus.fussnoten > 0 ? (100 * (korpus.ereignis + korpus.referenz)) / korpus.fussnoten : 100;
  const residuumQuote = korpus.fussnoten > 0 ? (100 * korpus.unparsed) / korpus.fussnoten : 0;
  console.log(
    `Historie-Abdeckung: ${korpus.erlasse} Erlasse · ${korpus.fussnoten} Fussnoten → ` +
      `${korpus.ereignis} Ereignis-FN / ${korpus.referenz} Verweis-FN / ${korpus.unparsed} unparsed ` +
      `(${parsebar.toFixed(2)} % parsebar · Residuum ${residuumQuote.toFixed(2)} %)`,
  );
  console.log(
    `  ${korpus.shards} Shards · ${korpus.artikelMitHistorie} Artikel mit Historie · ` +
      `${korpus.ereignisse} Ereignisse (${korpus.ereignisseDatiert} datiert)`,
  );
}

if (!process.env.VITEST) {
  const istCheck = process.argv.includes('--check');
  const { shards, korpus } = baueAlle();
  berichte(korpus);

  if (istCheck) {
    if (!existsSync(ZIEL)) {
      console.error(`check:historie: ${ZIEL} fehlt — 'npm run gen:historie' ausführen.`);
      process.exit(1);
    }
    const vorhanden = new Set(readdirSync(ZIEL).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, '')));
    let drift = false;
    for (const [erlass, neu] of shards) {
      let alt: string;
      try { alt = readFileSync(resolve(ZIEL, `${erlass}.json`), 'utf8'); } catch { alt = ''; }
      if (alt !== neu) { console.error(`check:historie: ${erlass}.json VERALTET/fehlt.`); drift = true; }
      vorhanden.delete(erlass);
    }
    for (const uebrig of vorhanden) { console.error(`check:historie: ${uebrig}.json ist verwaist (keine Quelle).`); drift = true; }
    if (drift) { console.error('→ `npm run gen:historie` ausführen und committen.'); process.exit(1); }
    // RL-11 (R2-01): «aufgehobenSeit» nur ohne lebenden Normtext im Text-Shard.
    const parsed = new Map([...shards].map(([k, v]) => [k, JSON.parse(v) as { artikel?: Record<string, ArtikelHistorie> }]));
    const { befunde, geprueft, ohneText } = pruefeAufgehobenLebend(parsed, TEXT);
    if (befunde.length > 0) {
      console.error(
        `check:historie ROT — ${befunde.length} von ${geprueft} Artikeln mit «aufgehobenSeit» tragen lebenden Normtext ` +
          `(> ${LEBEND_SCHWELLE} Zeichen) im Text-Shard:`,
      );
      for (const b of befunde) console.error(`  ${b.erlass} Art. ${b.token} aufgehobenSeit=${b.aufgehobenSeit} (${b.zeichen} Z.) «${b.auszug}»`);
      process.exit(1);
    }
    console.log(`check:historie: ${geprueft} Artikel mit «aufgehobenSeit» ohne lebenden Normtext (${ohneText} ohne Text-Eintrag).`);
    console.log(`check:historie: ${shards.size} Shards synchron mit den Struktur-Sidecars.`);
  } else {
    rmSync(ZIEL, { recursive: true, force: true }); // verwaiste Shards entfernen (kein toter Rest)
    mkdirSync(ZIEL, { recursive: true });
    for (const [erlass, s] of shards) writeFileSync(resolve(ZIEL, `${erlass}.json`), s, 'utf8');
    console.log(`gen:historie: ${shards.size} Shards → public/normtext/historie/`);
  }
}
