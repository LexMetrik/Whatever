// scripts/normtext/churn-reset.ts — reine Logik des Datums-Churn-Resets (§17, QS-MONITOR-ROT
// Befund (a2), 1.9.2026). CLI: churn-reset-run.ts.
//
// WARUM: Jeder Generator-Lauf schreibt `erzeugt` (Dateikopf) und `abgerufen` (je Eintrag) neu.
// Ein Reparatur-Lauf, der EINEN Pin hebt, fasst so 100+ Dateien an, deren Inhalt unverändert
// ist. Die Frische-PRs #572/#596 trugen dadurch je >100 Snapshot-Dateien mit reinem Datums-
// Churn — #596 kollidierte an vier davon mit der ZH-Tranche (#606) und blieb liegen, während
// der Monitor auf main am selben Pin rot stand (Verteilung 24.8.–1.9.2026). Die Reset-Regel
// («reine Datum-Churn zurückgesetzt», scripts/fedlex-cache.sh) galt bisher nur von Hand.
//
// REGEL: Eine Datei ist reiner Datums-Churn, wenn alt und neu nach Entfernen der Felder
// `erzeugt` und `abgerufen` (auf jeder Tiefe) strukturell gleich sind. Alles andere — auch
// `stand`, `fassungsToken`, `sha`, Text — ist Substanz und bleibt. Kein Regex über Text:
// beide Seiten werden als JSON gelesen; Nicht-JSON gilt nie als Churn (fail-closed).

export const CHURN_FELDER: ReadonlySet<string> = new Set(['erzeugt', 'abgerufen']);

/** Entfernt die Churn-Felder rekursiv (Objekte und Arrays), sonst identische Struktur. Rein. */
export function ohneChurnFelder(wert: unknown): unknown {
  if (Array.isArray(wert)) return wert.map(ohneChurnFelder);
  if (wert !== null && typeof wert === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(wert as Record<string, unknown>)) {
      if (CHURN_FELDER.has(k)) continue;
      out[k] = ohneChurnFelder(v);
    }
    return out;
  }
  return wert;
}

/**
 * true, wenn `neu` gegenüber `alt` NUR in `erzeugt`/`abgerufen` abweicht. Nicht parsebares
 * JSON auf einer Seite ⇒ false (nie stillschweigend zurücksetzen). Byte-gleiche Dateien sind
 * kein Churn (nichts zu tun) ⇒ false.
 */
export function istReinerDatumsChurn(alt: string, neu: string): boolean {
  if (alt === neu) return false;
  let a: unknown; let n: unknown;
  try {
    a = JSON.parse(alt);
    n = JSON.parse(neu);
  } catch {
    return false;
  }
  return JSON.stringify(ohneChurnFelder(a)) === JSON.stringify(ohneChurnFelder(n));
}

// ── Je Eintrag (W2·27-BUND-FERTIG P1; #1204: 1289 unveränderte Einträge trugen neues `abgerufen`) ──
// Eine Datei MIT Substanz fällt aus der Datei-Regel oben heraus; ihre unveränderten Einträge
// sollen trotzdem das alte `abgerufen` behalten. Je Eintrag (gleiche `id`): strukturell gleich
// ohne Churn-Felder ⇒ der ganze alte Eintrag ersetzt den neuen. Kopf (`erzeugt`) bleibt neu.
// Fail-closed (null): Nicht-JSON, kein `eintraege`-Array, fehlende/doppelte ids, oder die Datei
// lässt sich nicht byte-gleich als JSON.stringify(…, null, 2) (± Schlusszeilenumbruch) schreiben.
type Obj = Record<string, unknown>;
const istObj = (x: unknown): x is Obj => x !== null && typeof x === 'object' && !Array.isArray(x);

function eintraegeNachId(o: unknown): Map<string, Obj> | null {
  if (!istObj(o) || !Array.isArray(o.eintraege)) return null;
  const m = new Map<string, Obj>();
  for (const e of o.eintraege) {
    if (!istObj(e) || typeof e.id !== 'string' || m.has(e.id)) return null;
    m.set(e.id, e);
  }
  return m;
}

export function setzeUnveraenderteEintraegeZurueck(
  alt: string,
  neu: string,
): { text: string; zurueckgesetzt: number } | null {
  let a: unknown; let n: unknown;
  try {
    a = JSON.parse(alt);
    n = JSON.parse(neu);
  } catch {
    return null;
  }
  const altMap = eintraegeNachId(a);
  if (altMap === null || eintraegeNachId(n) === null) return null;
  const schluss = neu.endsWith('\n') ? '\n' : '';
  if (`${JSON.stringify(n, null, 2)}${schluss}` !== neu) return null;
  const liste = (n as { eintraege: Obj[] }).eintraege;
  let zurueckgesetzt = 0;
  liste.forEach((e, i) => {
    const vorher = altMap.get(e.id as string);
    if (vorher === undefined || JSON.stringify(vorher) === JSON.stringify(e)) return;
    if (JSON.stringify(ohneChurnFelder(vorher)) !== JSON.stringify(ohneChurnFelder(e))) return;
    liste[i] = vorher;
    zurueckgesetzt += 1;
  });
  return { text: zurueckgesetzt === 0 ? neu : `${JSON.stringify(n, null, 2)}${schluss}`, zurueckgesetzt };
}
