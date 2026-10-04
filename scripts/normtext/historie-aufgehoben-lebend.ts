// ─── Tor-Kern: «Aufgehoben seit …» nur ohne lebenden Normtext (RL-11) ─────────
//
// ANLASS (Prüfung Rechtslogik 23.9.2026, Befund R2-01, Go David 23.9.2026): Der
// Gesetzesleser zeigte bei geltenden Artikeln «Aufgehoben seit …» — z. B. AVIG
// Art. 60 (SR 837.0, Fedlex Stand 1.1.2026) «Aufgehoben seit 01.04.2011», obwohl
// Abs. 1 «in Kraft seit 1. Jan. 2026» gilt. Ursache: die Aufhebungs-Fussnote
// hängt an der (aufgehobenen) Sachüberschrift «…», nicht am Artikel, und eine
// spätere Neufassung/Einfügung wurde nicht berücksichtigt.
//
// INVARIANTE (quellennah, unabhängig vom Historie-Parser): Ein Artikel, dem die
// Historie-Projektion `aufgehobenSeit` zuschreibt, darf im zugehörigen
// Text-Shard (public/normtext/bund/<ERLASS>.json, amtliche konsolidierte
// Fassung) KEINEN lebenden Normtext tragen. «Lebend» = nach Entfernen der
// Aufhebungs-Platzhalter («…», «...», «Aufgehoben») mehr als 40 Zeichen Text in
// Blöcken/Items. Der Text-Shard ist die unabhängige zweite Quelle: er kommt aus
// dem Artikel-KÖRPER, die Historie aus der Fussnoten-Prosa.
//
// GRENZE der Unabhängigkeit (offengelegt): der Generator nutzt `lebenderText`
// seit RL-11 auch selbst als Tie-Breaker für den im Sidecar mehrdeutigen
// Kopf-Anker («Art. N …[Fn]» Sachüberschrift vs. «Art. N[Fn]» Artikel; 4 Fälle
// am 23.9.2026). Für diese Klasse ist das Tor ein Konsistenz-Wächter, kein
// unabhängiger Zweitbeweis; alle übrigen Regeln (Körper-Anker, Teil-Skopus,
// spätere Fassung, Gliederungs-Titel) entscheiden allein aus der Fussnote und
// werden hier unabhängig geprüft. Rot-Beweis §6.7 am 23.9.2026 vor dem Fix:
// 83 von 1305 Artikeln rot.
//
// Eingehängt in `check:historie` (historie-generieren.ts --check) — läuft damit
// in CI (ci.yml, Schritt mit check:historie) und in check:seriell.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/** Schwelle «lebender Normtext» (Zeichen nach Platzhalter-Abzug). */
export const LEBEND_SCHWELLE = 40;

interface TextBlock {
  text?: string | null;
  items?: Array<{ text?: string | null; items?: unknown[] }>;
}
interface TextEintrag {
  id: string;
  bloecke?: TextBlock[];
  /** Amtliches Signal «ganzer Artikel aufgehoben» (`NormSnapshot.aufgehoben`, aufhebung-signal.ts). */
  aufgehoben?: boolean | null;
}

/** Rekursiv alle Text-Fragmente eines Blocks (inkl. verschachtelter Items). */
function texte(b: { text?: string | null; items?: unknown[] }, aus: string[]): void {
  if (b.text) aus.push(b.text);
  for (const it of (b.items ?? []) as Array<{ text?: string | null; items?: unknown[] }>) texte(it, aus);
}

/** Lebender Normtext eines Text-Shard-Eintrags nach Abzug der Aufhebungs-Platzhalter. */
export function lebenderText(e: TextEintrag): string {
  const teile: string[] = [];
  for (const b of e.bloecke ?? []) texte(b, teile);
  return teile
    .join(' ')
    .replace(/…|\.\.\./g, ' ')
    .replace(/\bAufgehoben\b\.?/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Artikel-Token wie im Struktur-/Historie-Schlüssel (identisch zu ankerZuToken). */
export function tokenAusId(id: string): string {
  const anker = id.replace(/^bund\/[^/]+\//, '');
  return anker.startsWith('art_') ? anker.slice(4) : anker.replace(/\//g, '_');
}

export interface AufgehobenLebendBefund {
  erlass: string;
  token: string;
  aufgehobenSeit: string;
  zeichen: number;
  auszug: string;
}

/**
 * Prüft je Historie-Shard jeden Artikel mit `aufgehobenSeit` gegen den Text-Shard.
 * `historie` = Erlass → Shard-Objekt (wie in public/normtext/historie/<ERLASS>.json).
 */
export function pruefeAufgehobenLebend(
  historie: ReadonlyMap<string, { artikel?: Record<string, { aufgehobenSeit?: string }> }>,
  textWurzel: string,
): { befunde: AufgehobenLebendBefund[]; geprueft: number; ohneText: number } {
  const befunde: AufgehobenLebendBefund[] = [];
  let geprueft = 0;
  let ohneText = 0;
  for (const [erlass, shard] of [...historie].sort(([a], [b]) => a.localeCompare(b))) {
    const kandidaten = Object.entries(shard.artikel ?? {}).filter(([, h]) => h.aufgehobenSeit);
    if (kandidaten.length === 0) continue;
    const pfad = resolve(textWurzel, `${erlass}.json`);
    const index = new Map<string, TextEintrag>();
    if (existsSync(pfad)) {
      const doc = JSON.parse(readFileSync(pfad, 'utf8')) as { eintraege?: TextEintrag[] };
      for (const e of doc.eintraege ?? []) index.set(tokenAusId(e.id), e);
    }
    for (const [token, h] of kandidaten) {
      const e = index.get(token);
      if (!e) { ohneText++; continue; }
      geprueft++;
      const lebend = lebenderText(e);
      if (lebend.length > LEBEND_SCHWELLE) {
        befunde.push({ erlass, token, aufgehobenSeit: h.aufgehobenSeit!, zeichen: lebend.length, auszug: lebend.slice(0, 60) });
      }
    }
  }
  return { befunde, geprueft, ohneText };
}

export interface AufgehobenGiltSeitBefund {
  erlass: string;
  token: string;
  giltSeit: string;
}

/**
 * Gegenrichtung zu `pruefeAufgehobenLebend` (P7 #53, GP M1 Aufhebungs-Sammel 1.10.2026): trägt der Text-Shard den
 * Artikel amtlich als aufgehoben (`aufgehoben: true`), darf die Historie kein «Gilt seit …» zeigen — ausser sie nennt
 * selbst das datierte `aufgehobenSeit` (die Anzeige führt «Aufgehoben seit …» vor «Gilt seit …», fassungsEtikett.ts).
 * Vor dem Fix: 7 Artikel (AIG 72, ASYLV2 65, AVO 22a–c/50b–f, BKV 8, HREGV 162–163, ZSTV 75a–m).
 *
 * GRENZE (offengelegt): der Generator liest dasselbe Feld, um `giltSeit` zu unterdrücken — das Tor ist ein
 * Konsistenz-Wächter über seine eigene Regel, kein unabhängiger Zweitbeweis. Die Richtigkeit des Feldes `aufgehoben`
 * selbst hängt an `check:leerstellen`/aufhebung-signal.ts und den amtlichen Fedlex-HTMLs.
 */
export function pruefeAufgehobenGiltSeit(
  historie: ReadonlyMap<string, { artikel?: Record<string, { giltSeit?: string | null; aufgehobenSeit?: string }> }>,
  textWurzel: string,
): { befunde: AufgehobenGiltSeitBefund[]; geprueft: number } {
  const befunde: AufgehobenGiltSeitBefund[] = [];
  let geprueft = 0;
  for (const [erlass, shard] of [...historie].sort(([a], [b]) => a.localeCompare(b))) {
    const pfad = resolve(textWurzel, `${erlass}.json`);
    if (!existsSync(pfad)) continue;
    const doc = JSON.parse(readFileSync(pfad, 'utf8')) as { eintraege?: TextEintrag[] };
    for (const e of doc.eintraege ?? []) {
      if (e.aufgehoben !== true) continue;
      const token = tokenAusId(e.id);
      const h = shard.artikel?.[token];
      if (!h) continue;
      geprueft++;
      if (h.giltSeit && !h.aufgehobenSeit) befunde.push({ erlass, token, giltSeit: h.giltSeit });
    }
  }
  return { befunde, geprueft };
}

/** Historie-Shards eines Verzeichnisses einlesen (für den Stand-alone-/Rot-Beweis-Lauf). */
export function leseHistorieShards(dir: string): Map<string, { artikel?: Record<string, { giltSeit?: string | null; aufgehobenSeit?: string }> }> {
  const m = new Map<string, { artikel?: Record<string, { giltSeit?: string | null; aufgehobenSeit?: string }> }>();
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
    m.set(f.replace(/\.json$/, ''), JSON.parse(readFileSync(resolve(dir, f), 'utf8')));
  }
  return m;
}
