/**
 * scripts/normtext/segmente-beleg-io.ts — I/O-Teil von B6 und Modus-C-Beleg
 * für `check:segmente` (QS-KORPUS): git-Diff gegen die Basis, Soll-Dateien
 * und Beleg auf der Platte. Ausgelagert aus `check-segmente.ts` (Nachzug R3,
 * 25.9.2026 — §6.6 Datei-Schlankheit, Fassaden-Muster, verhaltensgleich);
 * die reine Urteilslogik bleibt in `segmente-soll.ts`.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import {
  BELEG_DATEINAME,
  klassiereSollAenderung,
  pruefeBeleg,
  sollBelegHash,
  urteileB6,
  type B6Urteil,
  type ModusCBeleg,
} from './segmente-soll.ts';
import { SEGMENTER_VERSION } from './segmente-logik.ts';

export const SOLL_VERZEICHNIS = 'scripts/normtext/segmente-soll';

// ── B6: Modus-B-Schutz gegen koordinierte Soll+Projektions-Manipulation ────
//
// Modus B vergleicht die Projektion NUR gegen das committete Soll — löscht ein
// Commit denselben Fingerabdruck aus BEIDEN gemeinsam, bleibt B grün (Modus C
// erkennt es über die frische HTML-Ableitung, läuft aber nur im Cache-Pfad).
// B-Regel: eine Soll-Datei darf sich im COMMITTETEN Bereich nur ändern, wenn
// Pin ODER Segmenter-Version mitgewandert sind. Diff-Basis WIE
// `check:merge-schutz` (git merge-base origin/main HEAD, per Umgebung
// überschreibbar). G4 (Runde 3): ohne auflösbare Basis ROT wie dort (vorher
// «übersprungen» + grün); Dateien OHNE Vergleichsbasis (neu/Versionswechsel)
// werden gezählt und verlangen einen gültigen Modus-C-Beleg (segmente-soll.ts).
export const B6_BASIS_REF = process.env.MERGE_SCHUTZ_BASIS ?? 'origin/main';
export const B6_KOPF_REF = process.env.MERGE_SCHUTZ_KOPF ?? 'HEAD';

function gitStill(args: string[]): string | null {
  try {
    return execFileSync('git', args, { stdio: ['ignore', 'pipe', 'ignore'] }).toString('utf8');
  } catch {
    return null;
  }
}

function liesOderNull(pfad: string): string | null {
  return existsSync(pfad) ? readFileSync(pfad, 'utf8') : null;
}

/** Alle Soll-Dateien (ohne den Beleg selbst) — Grundlage des Beleg-Hashes. */
function sollDateienAufPlatte(): Array<{ name: string; inhalt: string }> {
  if (!existsSync(SOLL_VERZEICHNIS)) return [];
  return readdirSync(SOLL_VERZEICHNIS)
    .filter((n) => n.endsWith('.json') && n !== BELEG_DATEINAME)
    .map((name) => ({ name, inhalt: readFileSync(`${SOLL_VERZEICHNIS}/${name}`, 'utf8') }));
}

function aktuellerSollHash(): string {
  return sollBelegHash(sollDateienAufPlatte());
}

function ladeBeleg(): ModusCBeleg | null {
  const roh = liesOderNull(`${SOLL_VERZEICHNIS}/${BELEG_DATEINAME}`);
  if (roh === null) return null;
  try {
    return JSON.parse(roh) as ModusCBeleg;
  } catch {
    return null;
  }
}

/** --schreiben: Beleg nachführen; bei unverändertem Hash bleibt die Datei byte-gleich (Datum steht). */
export function schreibeBeleg(): void {
  const sollHash = aktuellerSollHash();
  const alt = ladeBeleg();
  if (alt && alt.segmenterVersion === SEGMENTER_VERSION && alt.sollHash === sollHash) return;
  const beleg: ModusCBeleg = {
    segmenterVersion: SEGMENTER_VERSION,
    sollHash,
    dateien: sollDateienAufPlatte().length,
    datum: new Date().toISOString().slice(0, 10), // Werkzeug-Metadatum, keine Rechenlogik (§2 unberührt)
  };
  writeFileSync(`${SOLL_VERZEICHNIS}/${BELEG_DATEINAME}`, JSON.stringify(beleg, null, 2) + '\n', 'utf8');
}

export function pruefeB6(): B6Urteil | { basisFehler: string } {
  const basis = gitStill(['merge-base', B6_BASIS_REF, B6_KOPF_REF]);
  if (basis === null) {
    return {
      basisFehler:
        `Referenz '${B6_BASIS_REF}' nicht auflösbar — erst 'git fetch origin', dann erneut ` +
        `(kein stiller Skip: ein Tor ohne Referenz ist kein Tor, wie check:merge-schutz).`,
    };
  }
  const b = basis.trim();
  const diffOut = gitStill(['diff', '--name-only', `${b}..${B6_KOPF_REF}`, '--', SOLL_VERZEICHNIS]);
  if (diffOut === null) return { basisFehler: 'git diff auf die Soll-Dateien fehlgeschlagen.' };
  const aenderungen = diffOut
    .split('\n')
    .map((z) => z.trim())
    .filter((p) => p && !p.endsWith(`/${BELEG_DATEINAME}`))
    .map((pfad) => ({ pfad, art: klassiereSollAenderung(gitStill(['show', `${b}:${pfad}`]), liesOderNull(pfad)) }));
  return urteileB6(aenderungen, () =>
    pruefeBeleg(ladeBeleg(), { segmenterVersion: SEGMENTER_VERSION, sollHash: aktuellerSollHash() }),
  );
}

/** Modus C: passt der committete Beleg zu den Soll-Dateien auf der Platte? */
export function pruefeBelegAufPlatte(): { ok: true } | { ok: false; grund: string } {
  return pruefeBeleg(ladeBeleg(), { segmenterVersion: SEGMENTER_VERSION, sollHash: aktuellerSollHash() });
}
