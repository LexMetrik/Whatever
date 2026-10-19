// scripts/gegenpruefung/register-bindung.ts — Hash-Bindung der Quittung
// (PRUEF-AUTOMATIK, Entscheid David 19.10.2026). Reine Funktionen, kein git.
//
// Anlass: `check:merge-schutz` verlangte bei Risiko-Dateien nur einen formgültigen
// Trailer plus IRGENDEINE neue Zeile im Register — kein Abgleich Register-Hash ↔
// Diff, also selbst-attestierbar und nach der Prüfung nicht an den Inhalt
// gebunden. Jetzt muss eine im Bereich NEU hinzugefügte Registerzeile den Hash
// tragen, den `risikoBereichHash()` über genau diesen Bereich rechnet.
//
// Grenze, ehrlich benannt: der Hash bindet nur an den INHALT (er wird ungültig,
// wenn sich der Inhalt ändert), nicht an den Prüfer. Die Selbst-Attestierung
// (wer `gegenpruefung:ok` selbst aufruft, quittiert sich selbst) ist damit NICHT
// behoben, nur die Entkopplung vom geprüften Diff.
//
// Queue-Stapelung: im merge_group-Lauf kann der Bereich basis..KOPF mehrere
// gestapelte Squash-Commits (Vordermänner) enthalten; deren Quittungen gelten je
// für den EIGENEN Commit. Darum zwei Wege: (1) Hash des Gesamtbereichs, sonst
// (2) jede Einheit (First-Parent-Commit mit Risiko-Dateien) einzeln.
import { VERDIKT } from './squash-trailer';

export type RegisterQuittung = { hash: string; verdikt: string };

const HASH = /^[0-9a-f]{64}$/;

/**
 * Liest aus hinzugefügten Registerzeilen (`| datum | engine | hash | verdikt | … |`)
 * die Quittungen. Zellen werden an unmaskierten Pipes getrennt (gegenpruefung-ok
 * maskiert `|` als `\|`). Zeilen ohne 64-hex-Hash in Zelle 3 zählen nicht.
 */
export function leseRegisterQuittungen(zeilen: string[]): RegisterQuittung[] {
  const aus: RegisterQuittung[] = [];
  for (const z of zeilen) {
    if (!z.trimStart().startsWith('|')) continue;
    const zellen = z.split(/(?<!\\)\|/).map((c) => c.trim());
    // zellen[0] = '' vor dem ersten Pipe; datum, engine, hash, verdikt = 1..4
    const hash = (zellen[3] ?? '').toLowerCase();
    if (!HASH.test(hash)) continue;
    aus.push({ hash, verdikt: zellen[4] ?? '' });
  }
  return aus;
}

/** Verdikt der Registerzeile akzeptiert (bestanden/behoben, wie der Trailer). */
export function verdiktGilt(v: string): boolean {
  return VERDIKT.test(v.trim());
}

export type Einheit = { ref: string; hash: string | null };

export type Bindung =
  | { ok: true; art: 'voll' | 'einheiten'; gedeckt: number }
  | { ok: false; grund: string };

/**
 * Entscheidet, ob die neu hinzugefügten Quittungen den Diff decken.
 * @param voll   Hash über basis..KOPF (null = kein Risiko-Hash bestimmbar)
 * @param einheiten  Hash je First-Parent-Commit (null = keine Risiko-Datei darin)
 */
export function bewerteBindung(quittungen: RegisterQuittung[], voll: string | null, einheiten: Einheit[]): Bindung {
  const gut = new Set(quittungen.filter((q) => verdiktGilt(q.verdikt)).map((q) => q.hash));
  const schlecht = new Set(quittungen.filter((q) => !verdiktGilt(q.verdikt)).map((q) => q.hash));

  if (voll && gut.has(voll)) return { ok: true, art: 'voll', gedeckt: 1 };

  const mitRisiko = einheiten.filter((e) => e.hash !== null);
  if (mitRisiko.length > 1 && mitRisiko.every((e) => gut.has(e.hash as string))) {
    return { ok: true, art: 'einheiten', gedeckt: mitRisiko.length };
  }

  if (voll && schlecht.has(voll)) {
    return {
      ok: false,
      grund:
        `Die Quittung zum Diff-Hash ${voll.slice(0, 12)}… trägt kein gültiges Verdikt ` +
        `(erwartet 'bestanden' oder 'behoben') — nicht quittiert.`,
    };
  }

  const gefunden = quittungen.length
    ? quittungen.map((q) => `${q.hash.slice(0, 12)}…`).join(', ')
    : '(keine Zeile mit Hash)';
  const offen =
    mitRisiko.length > 1
      ? ` Einheiten ohne passende Quittung: ` +
        mitRisiko.filter((e) => !gut.has(e.hash as string)).map((e) => `${e.ref.slice(0, 10)} (${(e.hash as string).slice(0, 12)}…)`).join(', ') + '.'
      : '';
  return {
    ok: false,
    grund:
      `Quittung passt nicht zum Diff — Inhalt nach der Prüfung geändert? Neu prüfen. ` +
      `Der Risiko-Diff hat den Hash ${voll ? voll.slice(0, 12) + '…' : '(nicht bestimmbar)'}; ` +
      `im Bereich neu hinzugefügte Registerzeilen tragen: ${gefunden}.${offen}`,
  };
}
