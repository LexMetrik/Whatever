/**
 * check:golden-normtext — Tor: Vollständigkeit des Normtext-Golden-Index.
 *
 * ANLASS (PR #383, Runde 2, 27.7.2026). `scripts/normtext-snapshot.ts` schreibt
 * `golden/normtext-snapshot.json` am Ende eines Voll-Laufs PAUSCHAL aus dem in
 * DIESEM Lauf verarbeiteten Korpus (Zeile ~1412). Ein Lauf mit partiellem
 * Kantons-Korpus liess den Index von 55'763 auf 32'639 Einträge schrumpfen
 * (−23'473 Kantons-Knoten) — und KEIN `check:*`-Tor las den Index auf
 * Vollständigkeit: bis heute referenzierten ihn ausschliesslich SCHREIBER
 * (normtext-snapshot.ts, normtext/kanton-spalten-nachzug.ts,
 * normtext/kanton-fuellpunkt-nachzug.ts, normtext/kopf-extrahiere.ts). Das
 * §6-Beweismittel selbst war also ungesichert; der Verlust fiel nur einer
 * manuellen Gegenprüfung auf. CLAUDE.md §6.7: «ein Tor, das nicht scheitern
 * kann, ist gefährlicher als keines» — hier fehlte das Tor ganz.
 *
 * WAS DER INDEX IST. Der Generator setzt je Snapshot-Knoten genau
 * `goldenIndex[snapshot.id] = snapshot.sha` (vier Stellen: LexWork-, HTM-,
 * ZH-PDF-, PDF-Phase und die Bund-Phase). Der Index ist damit eine reine
 * Projektion der committeten Snapshots (§5) und keine zweite Wahrheit. Genau
 * das macht seine Vollständigkeit maschinell prüfbar:
 *
 *   (a) ABDECKUNG   golden ⊇ Snapshot-Knoten — jeder Knoten unter
 *                   public/normtext/{bund,kanton}/*.json hat einen Eintrag.
 *                   Ein fehlender Eintrag heisst: dieser Artikel hat KEINE
 *                   Drift-Basis mehr (§7 lit. d) und ein Fremd-Überschreiben
 *                   des Snapshots fällt niemandem auf.
 *   (b) WAISEN      golden ⊆ Snapshot-Knoten — ein Eintrag ohne Knoten zeigt
 *                   ins Leere (gelöschte/umbenannte Snapshot-Datei, veralteter
 *                   Schlüssel). HART, nicht WARN: der Index ist Projektion,
 *                   also ist ein Schlüssel ohne Quelle eine zweite Wahrheit
 *                   (§5) — und beide Richtungen zusammen machen das Tor
 *                   symmetrisch scheiternd (leeres golden ⇒ alles fehlt;
 *                   leerer Snapshot-Bestand ⇒ alles verwaist). Ein Tor, das
 *                   nur eine Richtung sieht, kann durch Löschen der Gegenseite
 *                   still grün werden.
 *
 * (c) INHALT     golden[id] === Snapshot-sha, seit HN-03 (25.9.2026) HART.
 *                Vormals DIAGNOSE, delegiert an «check:normtext» — das ist
 *                falsifiziert (§7): check-drift.ts liest golden/normtext-
 *                snapshot.json gar nicht (grep golden = 0 Treffer). Kein Tor
 *                prüfte die sha-Werte (pruefsystem-04: manipulierter
 *                Snapshot-sha lief mit Exit 0 durch). Echte Änderung ⇒ Golden
 *                im selben Commit deklariert nachziehen, keine Ausnahmeliste.
 *
 * Offline: liest nur committete Artefakte, kein Netz, kein Cache.
 * Aufruf: vite-node scripts/check-golden-normtext.ts
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const GOLDEN = 'golden/normtext-snapshot.json';
const SNAP_DIRS = ['public/normtext/bund', 'public/normtext/kanton'];

/**
 * Begründete Ausnahmen von (a): Snapshot-Knoten, die BEWUSST keinen
 * Golden-Eintrag tragen. Schlüssel = Knoten-id, Wert = Grund. LEER, das ist
 * der Punkt.
 *
 * Historie: Basis b09e8239 hatte 59 fehlende Knoten (public/normtext/kanton/
 * AR-1203.json). Ursache: Commit 7a14fa06 (23.6.2026, `--nur=kanton
 * --kanton=AR --discovery`) fährt nur die LexWork-Phase; ihr Golden-Merge
 * ersetzt aber ALLE `kanton/AR/*`-Schlüssel (istErsetzbar, Z. ~1043) — AR-1203
 * (PDF-Routen-Erlass, olexAt) blieb auf der Platte, seine Golden-Schlüssel
 * fielen weg. Behoben an der URSACHE: die 59 Einträge sind aus den
 * committeten Snapshots reprojiziert und byte-gleich mit dem Bestand vor dem
 * Verlust (golden@dd17d704: 59/59 sha identisch) — keine Pauschal-Toleranz
 * nötig. Wer hier einträgt, begründet WARUM dieser Artikel keine Drift-Basis
 * haben darf — «historisch gewachsen» genügt nicht.
 */
const AUSNAHMEN: Record<string, string> = {};

interface SnapshotKnoten {
  id: string;
  sha: string;
  datei: string;
}

function leseGolden(): Record<string, string> {
  if (!existsSync(GOLDEN)) {
    console.error(`  FEHLER: ${GOLDEN} fehlt — der Golden-Index IST das §6-Beweismittel.`);
    process.exit(1);
  }
  const golden = JSON.parse(readFileSync(GOLDEN, 'utf8')) as Record<string, string>;
  if (Object.keys(golden).length === 0) {
    console.error(`  FEHLER: ${GOLDEN} ist leer.`);
    process.exit(1);
  }
  return golden;
}

/** Alle Snapshot-Knoten der committeten Projektionen, in Datei-/Eintragsreihenfolge. */
function leseSnapshotKnoten(): SnapshotKnoten[] {
  const knoten: SnapshotKnoten[] = [];
  for (const dir of SNAP_DIRS) {
    if (!existsSync(dir)) {
      console.error(`  FEHLER: Snapshot-Verzeichnis ${dir} fehlt — Tor kann nichts prüfen.`);
      process.exit(1);
    }
    // index.json ist das Manifest (quelleUrl → Dateiname), kein Snapshot.
    const dateien = readdirSync(dir)
      .filter((f) => f.endsWith('.json') && f !== 'index.json')
      .sort();
    if (dateien.length === 0) {
      console.error(`  FEHLER: ${dir} enthält keine Snapshot-Datei — Tor kann nichts prüfen.`);
      process.exit(1);
    }
    for (const f of dateien) {
      const pfad = join(dir, f);
      const datei = JSON.parse(readFileSync(pfad, 'utf8')) as {
        eintraege?: Array<{ id?: string; sha?: string }>;
      };
      if (!Array.isArray(datei.eintraege)) {
        console.error(`  FEHLER ${pfad}: kein 'eintraege'-Array — Snapshot-Format verletzt.`);
        process.exit(1);
      }
      for (const e of datei.eintraege) {
        if (!e.id || !e.sha) {
          console.error(`  FEHLER ${pfad}: Eintrag ohne id/sha (${JSON.stringify(e).slice(0, 120)}).`);
          process.exit(1);
        }
        knoten.push({ id: e.id, sha: e.sha, datei: pfad });
      }
    }
  }
  return knoten;
}

function main(): void {
  console.log('\n── Tor: Golden-Vollständigkeit (Normtext-Snapshots ↔ Golden-Index) ───────');

  const golden = leseGolden();
  const goldenKeys = new Set(Object.keys(golden));
  const knoten = leseSnapshotKnoten();
  const knotenIds = new Set(knoten.map((k) => k.id));

  let exitCode = 0;

  // Doppelte Knoten-ids über Dateigrenzen: der Index kann sie nicht auseinander-
  // halten (ein Schlüssel, zwei sha) — stiller Verlust genau wie ein Überschreiben.
  if (knotenIds.size !== knoten.length) {
    const gesehen = new Set<string>();
    const doppelt = new Map<string, string[]>();
    for (const k of knoten) {
      if (gesehen.has(k.id)) doppelt.set(k.id, [...(doppelt.get(k.id) ?? []), k.datei]);
      gesehen.add(k.id);
    }
    console.error(`  FEHLER: ${doppelt.size} DOPPELTE Knoten-id über Dateigrenzen:`);
    for (const [id, dateien] of [...doppelt].slice(0, 20)) {
      console.error(`    ${id} — auch in ${dateien.join(', ')}`);
    }
    exitCode = 1;
  }

  // ── (a) Abdeckung: golden ⊇ Snapshot-Knoten ──────────────────────────────
  const fehlend = knoten.filter((k) => !goldenKeys.has(k.id));
  const fehlendOhneAusnahme = fehlend.filter((k) => !(k.id in AUSNAHMEN));
  const fehlendMitAusnahme = fehlend.filter((k) => k.id in AUSNAHMEN);

  if (fehlendOhneAusnahme.length > 0) {
    // Nach Datei gruppiert — ein ganzer Erlass ohne Drift-Basis ist der Regelfall
    // dieser Fehlerklasse (pauschales Überschreiben trifft Erlass-weise).
    const nachDatei = new Map<string, string[]>();
    for (const k of fehlendOhneAusnahme) {
      nachDatei.set(k.datei, [...(nachDatei.get(k.datei) ?? []), k.id]);
    }
    console.error(
      `  FEHLER: ${fehlendOhneAusnahme.length} Snapshot-Knoten OHNE Golden-Eintrag ` +
        `(${nachDatei.size} Datei(en)) — diese Artikel haben keine Drift-Basis (§7 lit. d):`,
    );
    for (const [datei, ids] of [...nachDatei].sort()) {
      console.error(`    ${datei} (${ids.length}): ${ids.slice(0, 8).join(', ')}${ids.length > 8 ? ' …' : ''}`);
    }
    console.error(
      `  → Ursache im Generator suchen (pauschales Golden-Schreiben aus einem\n` +
        `    partiellen Korpus?), Index aus den committeten Snapshots reprojizieren\n` +
        `    und die Erweiterung als DEKLARIERTEN Commit landen. Kein stilles\n` +
        `    Eintragen in AUSNAHMEN ohne Grund (scripts/check-golden-normtext.ts).`,
    );
    exitCode = 1;
  }

  // ── (b) Waisen: golden ⊆ Snapshot-Knoten ─────────────────────────────────
  const waisen = [...goldenKeys].filter((k) => !knotenIds.has(k));
  if (waisen.length > 0) {
    const nachErlass = new Map<string, number>();
    for (const w of waisen) {
      // bund/<KEY>/<eId> bzw. kanton/<KT>/<NR>/<eId> → Erlass-Präfix ohne eId
      const teile = w.split('/');
      const praefix = teile.slice(0, teile.length - 1).join('/');
      nachErlass.set(praefix, (nachErlass.get(praefix) ?? 0) + 1);
    }
    console.error(
      `  FEHLER: ${waisen.length} VERWAISTE Golden-Einträge ohne Snapshot-Knoten ` +
        `(${nachErlass.size} Erlass-Präfix(e)) — der Index zeigt ins Leere (§5):`,
    );
    for (const [praefix, n] of [...nachErlass].sort().slice(0, 20)) {
      console.error(`    ${praefix}/* (${n})`);
    }
    if (nachErlass.size > 20) console.error(`    … (${nachErlass.size - 20} weitere Präfixe)`);
    console.error(
      `  → Entweder fehlt die Snapshot-Datei (Datenverlust: wiederherstellen)\n` +
        `    oder der Schlüssel ist veraltet (Index reprojizieren, deklariert).`,
    );
    exitCode = 1;
  }

  // ── Verrottete Ausnahmen: ein Eintrag, der nicht (mehr) fehlt, ist tote Regel.
  for (const [id, grund] of Object.entries(AUSNAHMEN)) {
    if (goldenKeys.has(id)) {
      console.error(
        `  FEHLER: AUSNAHME ${id} ist überholt — der Knoten hat inzwischen einen ` +
          `Golden-Eintrag. Eintrag streichen. (Grund war: ${grund})`,
      );
      exitCode = 1;
    } else if (!knotenIds.has(id)) {
      console.error(
        `  FEHLER: AUSNAHME ${id} betrifft keinen existierenden Snapshot-Knoten ` +
          `(mehr) — Eintrag streichen. (Grund war: ${grund})`,
      );
      exitCode = 1;
    }
  }

  // ── (c) Inhalt: golden-sha === Snapshot-sha (hart, s. Kopfkommentar) ─────
  const shaAbweichend = knoten.filter((k) => goldenKeys.has(k.id) && golden[k.id] !== k.sha);
  if (shaAbweichend.length > 0) {
    const nachDatei = new Map<string, string[]>();
    for (const k of shaAbweichend) nachDatei.set(k.datei, [...(nachDatei.get(k.datei) ?? []), k.id]);
    console.error(
      `  FEHLER: ${shaAbweichend.length} Knoten mit sha ≠ Golden-sha (${nachDatei.size} Datei(en)) ` +
        `— ohne deklarierte Regeneration:`,
    );
    for (const [datei, ids] of [...nachDatei].sort()) {
      console.error(`    ${datei} (${ids.length}): ${ids.slice(0, 8).join(', ')}${ids.length > 8 ? ' …' : ''}`);
    }
    exitCode = 1;
  }

  console.log(`  Snapshot-Knoten:      ${knoten.length}`);
  console.log(`  Golden-Einträge:      ${goldenKeys.size}`);
  console.log(`  fehlend (ohne Ausn.): ${fehlendOhneAusnahme.length}`);
  console.log(`  Ausnahmen (genutzt):  ${fehlendMitAusnahme.length} von ${Object.keys(AUSNAHMEN).length} deklariert`);
  console.log(`  Waisen:               ${waisen.length}`);
  console.log(`  sha-Abweichungen:     ${shaAbweichend.length}`);

  if (exitCode !== 0) {
    console.error(
      '\ncheck:golden-normtext ROT — der Golden-Index ist unvollständig, verwaist oder inhaltlich abweichend.\n' +
        'Der Index ist das §6-Beweismittel: ohne Eintrag/Übereinstimmung ist ein Snapshot-Überschreiben unsichtbar.',
    );
    process.exit(exitCode);
  }

  console.log(
    `check:golden-normtext OK — ${knoten.length} Snapshot-Knoten vollständig im Index, ` +
      `keine Waisen, ${Object.keys(AUSNAHMEN).length} Ausnahmen deklariert.`,
  );
}

main();
