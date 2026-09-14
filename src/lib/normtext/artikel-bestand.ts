// ─── Z6c (W2·22) · «Gibt es diese Bestimmung im Zielerlass?» ────────────────
//
// Reine Auflösungsschicht (§3): keine Rechtsregel, kein Normtext — nur die
// Frage, ob ein Artikel-Token im Bund-Snapshot eines Erlasses vorkommt. Der
// Norm-Chip entscheidet daran, ob ein Verweis einen ARTIKEL-Anker bekommt oder
// auf den ERLASS-Link zurückfällt (kein toter Sprung, §1/§8).
//
// Datenquelle ist die generierte Projektion der Snapshots
// (`artikel-bestand.generated.ts`, Generator `scripts/normtext/
// artikel-bestand-generieren.ts`) — dieselbe Datei, aus der der Leser den
// Artikel rendert, nur auf die Token-Menge eingedampft (§5).
//
// §15: nichts wird expandiert. Ganzzahl-Token werden gegen die Läufe geprüft,
// die Sonderformen («92_a», «335_c_bis», Anhang-Ziffern) gegen eine Menge, die
// je Erlass EINMAL und nur bei Bedarf entsteht. Ein Erlass, den niemand zitiert,
// kostet damit nichts ausser seinen Bytes im Modul.

import { ARTIKEL_BESTAND } from './artikel-bestand.generated';

interface Bestand {
  /** Geschlossene Ganzzahl-Läufe, aufsteigend und überschneidungsfrei. */
  laeufe: ReadonlyArray<readonly [number, number]>;
  /** Normalisierte Sonderformen (alles, was keine reine Ganzzahl ist). */
  sonder: ReadonlySet<string>;
  /** Sammelblöcke «Art. a–b» als EIN Snapshot-Eintrag (Token «a_b»), z. B.
   *  ZGB «Art. 876–883» (aufgehoben). Gemessen 14.9.2026: 232 solcher Blöcke im
   *  Bund. Für die Anker-Frage zählen sie NICHT als Treffer — der Eintrag heisst
   *  `876_883`, ein Sprung auf `#art-882` findet ihn nicht. Sie werden trotzdem
   *  geführt, damit die Messung «Bestimmung fehlt ganz» von «Bestimmung liegt in
   *  einem Sammelblock» unterscheiden kann (§1: zwei verschiedene Fälle, nicht
   *  stillschweigend derselbe). */
  sammel: ReadonlyArray<readonly [number, number, string]>;
}

/**
 * Token-Normalisierung — zeichengleich zur Absicht von `normRef` in NormText:
 * Kleinschreibung, alles ausser [a-z0-9] weg. Damit sind «92_a», «92a» und
 * «92 a» dasselbe Token, und die Schreibweise des Zitats entscheidet nicht
 * über die Auflösung.
 *
 * KEINE Suffix-Grammatik hier (§5, bewusst): dieses Modul ZERLEGT keine
 * Artikelnummer, es vergleicht zwei bereits gebildete Token — das aus dem Zitat
 * (`parsePassus`/`artikelToken`) und das aus dem Snapshot. Die geteilte
 * Nummern-Grammatik wird parallel erweitert (Z6a, `src/lib/fedlex/nummer.ts`,
 * PR #852); wächst sie um einen Suffix, trägt dieses Modul ihn ohne Änderung
 * mit — es kennt ihn gar nicht.
 *
 * EXPORTIERT allein für den Gleichheits-Wächter
 * `src/tests/z6c-normalisierer-gleichheit.test.ts` (Nebenfund §5 der
 * Gegenprüfung, 14.9.2026): dieselbe Definition liegt zeichengleich auch in
 * NormText.tsx und in der Transkription des V-1-Tors. Die drei werden NICHT
 * zusammengeführt — die Transkription MUSS eine eigene Kopie haben, sonst
 * prüft sie sich selbst (§6.7) — sondern aneinander gebunden. Kein
 * Produktions-Code ausserhalb dieses Moduls ruft sie.
 */
export const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const zwischenspeicher = new Map<string, Bestand>();

function bestand(quelle: string): Bestand | null {
  const roh = ARTIKEL_BESTAND[quelle];
  if (roh === undefined) return null;
  const schon = zwischenspeicher.get(quelle);
  if (schon) return schon;
  const laeufe: [number, number][] = [];
  const sonder = new Set<string>();
  const sammel: [number, number, string][] = [];
  for (const stueck of roh.split(',')) {
    const lauf = /^(\d+)-(\d+)$/.exec(stueck);
    if (lauf) { laeufe.push([Number(lauf[1]), Number(lauf[2])]); continue; }
    if (/^\d+$/.test(stueck)) { laeufe.push([Number(stueck), Number(stueck)]); continue; }
    sonder.add(norm(stueck));
    const block = /^(\d+)_(\d+)$/.exec(stueck);
    if (block) sammel.push([Number(block[1]), Number(block[2]), stueck]);
  }
  const gebaut: Bestand = { laeufe, sonder, sammel };
  zwischenspeicher.set(quelle, gebaut);
  return gebaut;
}

/**
 * Existiert `token` als Artikel im Bund-Snapshot von `quelle` (Register-Key,
 * genau der Wert aus `bundSnapshotRef().quelle`)?
 *
 * `null` = NICHT PRÜFBAR: für diesen Erlass liegt kein Bund-Snapshot vor
 * (Stub, Kanton, Live-Verweis). §8 — ein unprüfbares Ziel wird nicht zum
 * toten erklärt; der Aufrufer verhält sich dann wie bisher.
 */
export function artikelImErlass(quelle: string, token: string): boolean | null {
  const b = bestand(quelle);
  if (!b) return null;
  const t = norm(token);
  if (/^\d+$/.test(t)) {
    const n = Number(t);
    return b.laeufe.some(([von, bis]) => n >= von && n <= bis);
  }
  return b.sonder.has(t);
}

/**
 * Z6c-Messung (§8-Aufschlüsselung, KEIN Auflösungspfad): liegt `token` in einem
 * SAMMELBLOCK des Erlasses — also in einem Eintrag «Art. a–b», der die zitierte
 * Bestimmung mit anderen zusammenfasst? Liefert dessen Token («876_883») oder
 * `null`.
 *
 * Bewusst NICHT als Anker-Ersatz genutzt: der Block ist ein ANDERER Eintrag als
 * die zitierte Bestimmung (in aller Regel ein Aufhebungs-Block), und ihn
 * stillschweigend anzuspringen hiesse, «Art. 882 ZGB» auf «Art. 876–883» zu
 * biegen. Die Unterscheidung gehört in die Messung, die Auflösung in einen
 * eigenen, deklarierten Schritt (ROADMAP W2·22 Z6c-Folge).
 *
 * GRENZE (§8, nicht wegglätten): erkannt werden nur REIN NUMERISCHE Blöcke
 * «a_b». Amtliche Sammel-Anker mit Suffix — Fedlex führt STGB 275bis/275ter
 * unter `art_275_bis_275_ter`, AHVG 50e unter `art_50_d_50_g`, BetmG 28b unter
 * `art_28_b_28_l` — zählt diese Funktion NICHT mit; ihre Zerlegung hinge an der
 * Nummern-Grammatik, die parallel umgebaut wird (Z6a). Gemessen 14.9.2026
 * gegen Fedlex: von 26 VERSCHIEDENEN toten Zielen des Bund-Zweigs liegen
 * amtlich 19 in einem Sammel-Anker; diese Funktion erkennt davon 15 (= 20 der
 * 36 Bund-Fundstellen, Feld `fremdZiele.sammelblock` im Inventar).
 *
 * BERICHTIGT 14.9.2026 (Gegenprüfungs-Befund E): hier stand «13». Nachgezählt
 * aus dem Artefakt, Ziele statt Fundstellen —
 *   node -e "const t=require('./messwerte/verweis-inventar.json').toteFremdanker;
 *     console.log(new Set(t.filter(e=>e.sammelblock).map(e=>e.quelle+'|'+e.token)).size)"
 *   → 15
 * (ARGV1 55 · BBG 71 · JSTG 39 · KVG 11 · KVG 12 · KVV 14 · KVV 86 · PARTG 6 ·
 * STGB 39 · STGB 202 · VAG 55 · VZV 126 · ZGB 139 · ZGB 620 · ZGB 882). Die
 * Fundstellen-Zahl 20 war richtig — verwechselt worden waren Ziele und Stellen.
 *
 * Die Untererfassung gegenüber den 19 amtlichen Sammel-Ankern ist bekannt und
 * wirkt sich NICHT auf die Auflösung aus — beide Lagen bekommen denselben
 * Erlass-Fallback; sie färbt allein die Aufschlüsselung.
 */
export function sammelblockFuer(quelle: string, token: string): string | null {
  const b = bestand(quelle);
  if (!b) return null;
  const t = norm(token);
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  return b.sammel.find(([von, bis]) => n >= von && n <= bis)?.[2] ?? null;
}
