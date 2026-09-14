/**
 * check:struktur-konsistenz — Tor: Struktur-Sidecar ↔ Snapshot je Erlass (Bund + Kanton).
 *
 * Snapshot und Struktur-Sidecar werden von ZWEI getrennten Generatoren erzeugt
 * (`npm run normtext` vs. `normtext:struktur`/`normtext:struktur-kanton`). Wird nur
 * einer neu gebaut, driften sie STILL: Artikel rendern ohne Gliederung/Randtitel,
 * Struktur-Schlüssel zeigen ins Leere. Dieser Defekt lag am 30.6.2026 unbemerkt in
 * Produktion (OR, Bund) und erneut am 27.7.2026 im Kanton-Bestand (Gegenprüfung zu
 * PR #391: 289 Snapshot-Artikel in 34 Kantons-Erlassen ohne Sidecar-Eintrag, weil
 * ein Kanton-Titel-Nachzug die Snapshots neu erzeugte, aber die Sidecars vom 18.7.
 * unangetastet liess). Das Tor verhindert, dass solcher Drift je wieder still
 * verschifft wird (§7/§8) — für BEIDE Ebenen.
 *
 * Kanton-Sonderfall (kein stiller Fehler, sondern dokumentierte Ausnahme): Sidecars
 * entstehen nur aus der LexWork-API (`struktur-kanton-run.ts`); Kanton-Erlasse aus
 * anderen Quellen (HTM/PDF/ZH-PDF/lexfind) haben BEWUSST nie einen Sidecar — der
 * Reader fällt dort auf die flache Darstellung zurück. Diese Dateien werden anhand
 * derselben LEXWORK-Erkennung wie im Runner identifiziert und vom Sidecar-Zwang
 * ausgenommen; ihre Zahl wird im ok-Fall sichtbar ausgewiesen (§8: keine stille
 * Toleranz), nicht nur weggelassen.
 *
 * Offline (kein Netz, kein /tmp-Cache): liest nur die committeten Artefakte.
 * Aufruf: vite-node scripts/normtext/check-struktur-konsistenz.ts
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pruefeStrukturKonsistenz } from './vollstaendigkeit-logik.ts';

const BUND_SNAP_DIR = 'public/normtext/bund';
const BUND_STRUKTUR_DIR = 'public/normtext/struktur/bund';
const KANTON_SNAP_DIR = 'public/normtext/kanton';
const KANTON_STRUKTUR_DIR = 'public/normtext/struktur/kanton';

// Kongruent zur Quell-Erkennung in struktur-kanton-run.ts: nur LexWork-Erlasse
// erhalten je einen Struktur-Sidecar; alle anderen Quellen sind eine dokumentierte
// Ausnahme vom Sidecar-Zwang (kein Fehler).
const LEXWORK = /\/app\/(de|fr|it)\/texts_of_law\//;

function tokensVonSnapshot(pfad: string): string[] {
  const datei = JSON.parse(readFileSync(pfad, 'utf8')) as { eintraege?: Array<{ artikel: string; quelleUrl?: string }> };
  return (datei.eintraege ?? []).map((e) => e.artikel);
}

function ersteQuelleUrl(pfad: string): string {
  const datei = JSON.parse(readFileSync(pfad, 'utf8')) as { eintraege?: Array<{ quelleUrl?: string }> };
  return datei.eintraege?.[0]?.quelleUrl ?? '';
}

function keysVonStruktur(pfad: string): string[] {
  const doc = JSON.parse(readFileSync(pfad, 'utf8')) as { artikel?: Record<string, unknown> };
  return Object.keys(doc.artikel ?? {});
}

type VersionsMarke = { stand: string; fassungsToken: string } | null;

/** Version des ERSTEN Snapshot-Eintrags (innerhalb eines Erlasses identisch, s. normtext-snapshot.ts). */
function versionVonSnapshot(pfad: string): VersionsMarke {
  const datei = JSON.parse(readFileSync(pfad, 'utf8')) as {
    eintraege?: Array<{ stand?: string; fassungsToken?: string }>;
  };
  const e = datei.eintraege?.[0];
  return e?.stand && e?.fassungsToken ? { stand: e.stand, fassungsToken: e.fassungsToken } : null;
}

/** Version, aus der der Struktur-Sidecar gebaut wurde (struktur-run.ts, §6.7 — additives Feld). */
function versionVonStruktur(pfad: string): VersionsMarke {
  const doc = JSON.parse(readFileSync(pfad, 'utf8')) as { stand?: string; fassungsToken?: string };
  return doc.stand && doc.fassungsToken ? { stand: doc.stand, fassungsToken: doc.fassungsToken } : null;
}

/**
 * §6.7 (Gegenprüfung #808 B4): Artikel-Keys können übereinstimmen, obwohl der Sidecar
 * aus einer ÄLTEREN Snapshot-Version stammt — der Generator kann einen neuen
 * `fassungsToken` auf einem unveränderten Artikel-Bestand stempeln (Beleg DBG #695).
 * Der bisherige Vergleich (nur Artikel-Keys) übersieht diesen Fall. Nur ein Befund,
 * wenn BEIDE Seiten die Versions-Felder tragen: additiver Rollout (wie `kl`,
 * W2·5i) — ältere Sidecars ohne das Feld werden dadurch NICHT rückwirkend rot; sie
 * erhalten es beim nächsten regulären `normtext:struktur`-Lauf.
 */
export function standDriftBefund(snap: VersionsMarke, stru: VersionsMarke): string | null {
  if (!snap || !stru) return null;
  if (snap.stand === stru.stand && snap.fassungsToken === stru.fassungsToken) return null;
  return `Snapshot-Version (stand=${snap.stand}, fassungsToken=${snap.fassungsToken}) ≠ Sidecar-Version (stand=${stru.stand}, fassungsToken=${stru.fassungsToken})`;
}

/**
 * W2·27 — «Fünf-Artefakte-Klammer», Bund-Ast (Fahrplan BUND-FERTIG §1.1).
 *
 * Ein Gesetz liegt bei uns in mehreren Dateien, die GETRENNT altern (Snapshot ·
 * Struktur-Sidecar · Historie-Shard · Revisionen · globale Register). Die
 * Zusammengehörigkeit wird nicht durch Zusammenlegen hergestellt (das kostet
 * Ladezeit, QS-PERF), sondern durch eine KLAMMER: jedes Artefakt trägt die
 * Fassung, aus der es stammt, und dieses Tor erzwingt Gleichheit.
 *
 * `standDriftBefund` (oben) war dafür der additive erste Schritt: er schlug nur
 * an, wenn BEIDE Seiten die Felder tragen — am 14.9.2026 trafen darum 216 von 228
 * Bund-Sidecars auf gar keine Prüfung («Randtitel und Fussnoten altern unbemerkt»,
 * Fahrplan §2/Nebenfunde). Ein Tor, das für 95 % des Bestands nicht scheitern
 * kann, ist gefährlicher als keines (§6.7). Nach dem Nachzug aller 228 Sidecars
 * (`npm run normtext:struktur -- --datum=…`) gilt die Pflicht-Fassung hier:
 * FEHLT die Marke, ist das der Befund — nicht länger ein stiller Freibrief.
 *
 * Gilt nur für den BUND. Der Kanton-Ast bleibt beim additiven `standDriftBefund`
 * (eigener Generator, eigener Rollout — Phase 2).
 */
export function versionsKlammerBefund(snap: VersionsMarke, stru: VersionsMarke): string | null {
  if (!snap) return 'Snapshot ohne stand/fassungsToken — die Fassung des Erlasses ist nicht deklariert (§7).';
  if (!stru)
    return (
      `Struktur-Sidecar ohne stand/fassungsToken (Snapshot: stand=${snap.stand}, ` +
      `fassungsToken=${snap.fassungsToken}) — Gliederung/Randtitel/Fussnoten altern ungeprüft.`
    );
  return standDriftBefund(snap, stru);
}

/**
 * W2·27 — die Fassung muss INNERHALB eines Snapshots einheitlich sein: der
 * Generator stempelt sie je Eintrag, die Klammer liest sie aber am ersten Eintrag
 * (`versionVonSnapshot`). Wäre sie uneinheitlich, prüfte die Klammer eine Fassung,
 * die für den Rest der Datei nicht gilt — ein Tor, das am eigenen Messpunkt
 * vorbeisieht. Messung 14.9.2026: 0 von 228 Bund-Dateien uneinheitlich.
 */
export function uneinheitlicheSnapshotVersion(
  eintraege: ReadonlyArray<{ stand?: string; fassungsToken?: string }>,
): string | null {
  const marken = new Set(eintraege.map((e) => `${e.stand ?? '—'}|${e.fassungsToken ?? '—'}`));
  if (marken.size <= 1) return null;
  return `Snapshot trägt ${marken.size} verschiedene Fassungen (${[...marken].slice(0, 4).join(' · ')}) — die Klammer hat keinen eindeutigen Messpunkt.`;
}

function eintraegeVonSnapshot(pfad: string): Array<{ stand?: string; fassungsToken?: string }> {
  const datei = JSON.parse(readFileSync(pfad, 'utf8')) as {
    eintraege?: Array<{ stand?: string; fassungsToken?: string }>;
  };
  return datei.eintraege ?? [];
}

function main(): void {
  let exitCode = 0;

  // ── Bund ────────────────────────────────────────────────────────────────────
  console.log('\n── Tor: Struktur-Konsistenz (Sidecar ↔ Snapshot, Bund) ───────────────────');
  let bundGeprueft = 0;
  let bundMitKlammer = 0;

  for (const f of readdirSync(BUND_SNAP_DIR).filter((f) => f.endsWith('.json'))) {
    const gesetz = f.replace(/\.json$/, '');
    const snapPfad = join(BUND_SNAP_DIR, f);
    const struPfad = join(BUND_STRUKTUR_DIR, f);

    // Ein Bund-Snapshot OHNE Struktur-Sidecar ist selbst ein Drift-Befund
    // (der Reader erwartet das Sidecar für die Gliederung).
    if (!existsSync(struPfad)) {
      console.error(`  FEHLER ${gesetz}: Snapshot vorhanden, aber Struktur-Sidecar fehlt (${struPfad}).`);
      exitCode = 1;
      continue;
    }

    const r = pruefeStrukturKonsistenz(tokensVonSnapshot(snapPfad), keysVonStruktur(struPfad));
    bundGeprueft++;

    if (r.verwaist.length > 0) {
      console.error(
        `  FEHLER ${gesetz}: ${r.verwaist.length} VERWAISTE Struktur-Schlüssel ` +
          `(veraltete Struktur — Sidecar nicht mit Snapshot neu gebaut): ${r.verwaist.slice(0, 10).join(', ')}`,
      );
      exitCode = 1;
    }
    if (r.fehlend.length > 0) {
      console.error(
        `  FEHLER ${gesetz}: ${r.fehlend.length} Snapshot-Artikel OHNE Struktur ` +
          `(rendern ohne Gliederung/Randtitel): ${r.fehlend.slice(0, 10).join(', ')}`,
      );
      exitCode = 1;
    }
    if (r.fehlendDoppelId.length > 0) {
      // W2·27 (RÜCKBAU der Toleranz): «__N»-Token (2. Vorkommen einer doppelten
      // Fedlex-art_id) galten hier als dokumentierte Grenze und wurden nur gezählt.
      // Seit der Struktur-Extraktor denselben Synthese-Suffix vergibt wie der
      // Snapshot-Generator (struktur-extrahiere.ts, W2·27), gibt es diese Grenze
      // nicht mehr: ein fehlender «__N»-Schlüssel heisst, dass ein Artikel den
      // Randtitel/die Gliederung seines Namensvetters trägt — genau der KKV-Befund
      // (Art. 126z zeigte die Marginalie von Art. 126z^tredecies). Darum FEHLER.
      console.error(
        `  FEHLER ${gesetz}: ${r.fehlendDoppelId.length} Doppelartikel-Token OHNE Struktur ` +
          `(${r.fehlendDoppelId.slice(0, 10).join(', ')}) — der Sidecar keyt zwei <article> mit ` +
          `gleicher Fedlex-id auf EINEN Schlüssel; das zweite überschreibt das erste.`,
      );
      exitCode = 1;
    }

    // §6.7-Ast (Gegenprüfung #808 B4) + W2·27-Klammer: gleiche Artikel-Keys reichen
    // nicht — der Sidecar kann aus einer älteren Snapshot-Version stammen ODER die
    // Fassungs-Marke ganz vermissen lassen (216/228 am 14.9.2026).
    const uneinheitlich = uneinheitlicheSnapshotVersion(eintraegeVonSnapshot(snapPfad));
    if (uneinheitlich) {
      console.error(`  FEHLER ${gesetz}: ${uneinheitlich}`);
      exitCode = 1;
    }
    const drift = versionsKlammerBefund(versionVonSnapshot(snapPfad), versionVonStruktur(struPfad));
    if (drift) {
      console.error(`  FEHLER ${gesetz}: ${drift}`);
      exitCode = 1;
    } else {
      bundMitKlammer++;
    }
  }

  if (exitCode === 0) {
    console.log(
      `  ok: ${bundGeprueft} Bund-Gesetze — Struktur ↔ Snapshot konsistent · ` +
        `${bundMitKlammer}/${bundGeprueft} mit geschlossener Fassungs-Klammer (stand + fassungsToken beidseitig gleich)`,
    );
  }

  // ── Kanton ──────────────────────────────────────────────────────────────────
  console.log('\n── Tor: Struktur-Konsistenz (Sidecar ↔ Snapshot, Kanton) ──────────────────');
  let kantonGeprueft = 0;
  let kantonDoppelIdHinweise = 0;
  let nichtLexworkOhneSidecar = 0;
  // N1 (QS-GP 27.7.2026): eigener Kanton-Fehlerzähler — der frühere Vergleich
  // gegen das globale exitCode-Flag konnte nach einem Bund-Fehler einen
  // Kanton-Fehler nicht mehr unterscheiden und druckte die ok-Zeile trotzdem.
  let kantonFehler = 0;

  for (const f of readdirSync(KANTON_SNAP_DIR).filter((f) => f.endsWith('.json') && f !== 'index.json')) {
    const erlass = f.replace(/\.json$/, '');
    const snapPfad = join(KANTON_SNAP_DIR, f);
    const struPfad = join(KANTON_STRUKTUR_DIR, f);
    const tokens = tokensVonSnapshot(snapPfad);
    if (tokens.length === 0) continue; // leere Snapshot-Datei (kann nicht vorkommen, defensiv)

    const istLexwork = LEXWORK.test(ersteQuelleUrl(snapPfad));

    if (!existsSync(struPfad)) {
      if (istLexwork) {
        // LexWork-Erlass OHNE Sidecar ist ein echter Drift-Befund (Runner hätte
        // einen Sidecar erzeugen müssen).
        console.error(`  FEHLER ${erlass}: LexWork-Snapshot vorhanden, aber Struktur-Sidecar fehlt (${struPfad}).`);
        exitCode = 1;
        kantonFehler++;
      } else {
        // Dokumentierte Ausnahme: Nicht-LexWork-Quellen (PDF/HTM/ZH-PDF/lexfind)
        // erhalten nie einen Sidecar (struktur-kanton-run.ts überspringt sie).
        nichtLexworkOhneSidecar++;
      }
      continue;
    }

    const r = pruefeStrukturKonsistenz(tokens, keysVonStruktur(struPfad));
    kantonGeprueft++;

    if (r.verwaist.length > 0) {
      console.error(
        `  FEHLER ${erlass}: ${r.verwaist.length} VERWAISTE Struktur-Schlüssel ` +
          `(veraltete Struktur — Sidecar nicht mit Snapshot neu gebaut): ${r.verwaist.slice(0, 10).join(', ')}`,
      );
      exitCode = 1;
      kantonFehler++;
    }
    if (r.fehlend.length > 0) {
      console.error(
        `  FEHLER ${erlass}: ${r.fehlend.length} Snapshot-Artikel OHNE Struktur ` +
          `(rendern ohne Gliederung/Randtitel VOR den Sektionen, im TOC unerreichbar): ${r.fehlend.slice(0, 10).join(', ')}`,
      );
      exitCode = 1;
      kantonFehler++;
    }
    if (r.fehlendDoppelId.length > 0) {
      kantonDoppelIdHinweise += r.fehlendDoppelId.length;
    }
  }

  if (kantonFehler === 0) {
    console.log(
      `  ok: ${kantonGeprueft} Kanton-Erlasse (LexWork) — Struktur ↔ Snapshot konsistent` +
        (kantonDoppelIdHinweise > 0 ? ` (${kantonDoppelIdHinweise} dokumentierte Doppelartikel-__N ohne Struktur, bekannt)` : '') +
        ` · ${nichtLexworkOhneSidecar} Nicht-LexWork-Erlasse ohne Sidecar (dokumentierte Ausnahme, Reader nutzt flache Darstellung)`,
    );
  } else {
    console.error(
      `\n  ℹ️  ${nichtLexworkOhneSidecar} Nicht-LexWork-Erlasse ohne Sidecar sind eine dokumentierte Ausnahme (kein Fehler).`,
    );
  }

  if (exitCode !== 0) {
    console.error('\n  Struktur-Drift gefunden → `npm run normtext:struktur -- --datum=<F>` (Bund) bzw. `npm run normtext:struktur-kanton -- --datum=<F> --kanton=<KT>` (Kanton) neu bauen.');
  }
  process.exit(exitCode);
}

// CLI-Guard (wie struktur-run.ts): erlaubt Tests, `standDriftBefund` (§6.7) zu
// importieren, ohne dass main() (readdirSync über die echten public/-Verzeichnisse,
// process.exit) beim Test-Import mitläuft. `process.argv[1]` zeigt unter vite-node
// auf das vite-node-Binary, nicht auf diese Datei — Pfad-Regex wäre für den echten
// CLI-Lauf blind. `VITEST` setzt Vitest in jedem Testprozess zuverlässig (verifiziert).
const istCliLauf = !process.env.VITEST;
if (istCliLauf) main();
