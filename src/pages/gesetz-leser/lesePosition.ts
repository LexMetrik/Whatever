import { lokalSpeicher } from '../../lib/sichererSpeicher';
// ─── W2·10-UI-NAV/R4 · Positions-Persistenz «Weiterlesen bei Art. X» ──────────
//
// Fahrplan R4: «den scrollAnker `{token, offset}` je Erlass-Pfad in localStorage
// spiegeln (§5-sauber: nur Token+Zahl, nie Falldaten); beim erneuten Öffnen KEIN
// Auto-Sprung, sondern ein unaufdringlicher Chip; Stand-Marker des Snapshots als
// Invalidierungs-Arbiter.»
//
// WARUM EIN EIGENES MODUL statt einer Erweiterung von `scrollAnker.ts` (die vom
// Fahrplan genannte Fläche): scrollAnker.ts ist die FLÜCHTIGE Registry der
// laufenden Sitzung (in-memory Map, von App.tsx:ScrollWiederherstellung beim
// Zurück-/Reiter-Wechsel gelesen). Diese Datei ist der DAUERHAFTE Spiegel über
// Sitzungsgrenzen hinweg. Zwei verschiedene Lebensdauern, zwei verschiedene
// Verfalls-Arbiter (dort: das DOM; hier: der Snapshot-Stand) — sie zu mischen
// hiesse, den Verfall der einen an den der anderen zu koppeln. Gleiche Schicht,
// gleicher Ordner, Präzedenz `scrollAnker.ts` (Darstellungs-Infrastruktur, §3).
//
// ABGRENZUNG zum R5-Rücksprung-Chip: der ist «nach einem Sprung zurück» (flüchtig,
// Sekunden, innerhalb einer Lesesitzung). Dieser hier ist «beim WIEDERKOMMEN
// anbieten» (über Sitzungen hinweg). Kein gemeinsamer Zustand, kein Doppel.
//
// ABGRENZUNG zu `lib/zuletztVerwendet.ts`: dort liegt der VERLAUF (welche Route
// wann besucht) als SSoT des Keys 'lexmetrik-zuletzt'. Hier liegt die POSITION IM
// Dokument. Verschiedene Formen, verschiedene Kappungen — ein gemeinsamer Store
// hätte den einen Eintrag am Lebenszyklus des anderen aufgehängt (§5: eine Quelle
// je Sache, nicht eine Quelle für alles).
//
// §8-Ehrlichkeit: rein lokal, «nur auf diesem Gerät» — die UI sagt es am Chip.
// §5-sauber: gespeichert werden ausschliesslich Erlass-Key, Artikel-Token, das
// bereits im DOM stehende Anzeige-Label und der Snapshot-Stand. Nie Falldaten,
// nie Formularinhalte, nie eine Suchanfrage.
// SSR-sicher + defensiv wie `zuletztVerwendet.ts`: kein localStorage im
// Prerender-Node, jeder Zugriff in try/catch — Komfort darf nie eine Seite
// zerlegen, und im Prerender liefert `holeLesePosition` null ⇒ das prerenderte
// Markup bleibt unberührt (golden byte-gleich).

/** Zuletzt gelesene Stelle EINES Erlasses. */
export interface LesePosition {
  /** Erlass-Key (BrowseErlass.key) — die Identität des Dokuments. */
  key: string;
  /** Artikel-Token (id ohne «art-»-Präfix), z. B. «335_c». */
  token: string;
  /** Anzeige-Label, wörtlich wie im Reader gezeigt («Art. 335c», «Art. 31–32»).
   *  Wird MITGESPEICHERT statt aus dem Token gebaut: Schlusstitel-/Bereichs-
   *  Labels lassen sich nicht heuristisch zurückrechnen (M13), und ein Chip, der
   *  einen anderen Artikel nennt als den, zu dem er springt, wäre eine Lüge (§8). */
  label: string;
  /** Snapshot-Stand (BrowseErlass.stand, ISO) zum Zeitpunkt des Lesens.
   *  INVALIDIERUNGS-ARBITER: weicht der heutige Stand ab, ist der Erlass
   *  revidiert worden — dann kann derselbe Token einen anderen Text tragen oder
   *  ganz fehlen, und das Angebot wird verworfen statt «ungefähr» wiederhergestellt. */
  stand: string;
}

const KEY = 'lexmetrik-leseposition';
// Kappung: mehr Erlasse, als jemand in einer Arbeitsphase parallel offen hat,
// braucht niemand — und der Store bleibt klein genug, dass Lesen/Schreiben nie
// spürbar wird (§15). Reihenfolge = zuletzt gelesen zuerst (Array-Position,
// deterministisch, kein Date.now nötig — Muster `zuletztVerwendet.ts`).
const MAX = 20;

function lese(): LesePosition[] {
  try {
    const roh = lokalSpeicher.lies(KEY);
    const arr = roh ? JSON.parse(roh) : [];
    if (!Array.isArray(arr)) return [];
    return arr.filter((e): e is LesePosition =>
      !!e && typeof e.key === 'string' && typeof e.token === 'string'
      && typeof e.label === 'string' && typeof e.stand === 'string');
  } catch {
    return [];
  }
}

/**
 * Die gemerkte Stelle eines Erlasses — oder null, wenn keine existiert ODER der
 * Snapshot seither einen anderen Stand trägt. Der Stand-Vergleich ist die
 * Invalidierung: er passiert HIER, nicht beim Aufrufer, damit es genau einen Ort
 * gibt, an dem über die Gültigkeit entschieden wird (§5).
 */
export function holeLesePosition(key: string, stand: string): LesePosition | null {
  const treffer = lese().find((e) => e.key === key);
  if (!treffer) return null;
  if (treffer.stand !== stand) return null;
  return treffer;
}

/** Merkt die Stelle (dedupe je Erlass-Key, neueste nach vorn, auf MAX gekappt). */
export function merkeLesePosition(pos: LesePosition): void {
  if (!pos.key || !pos.token || !pos.label) return; // ohne Label kein ehrlicher Chip (§8)
  const ohne = lese().filter((e) => e.key !== pos.key);
  // Gesperrt / Quota → still: «Weiterlesen» ist reiner Komfort.
  lokalSpeicher.schreib(KEY, JSON.stringify([pos, ...ohne].slice(0, MAX)));
}

/** Vergisst die Stelle eines Erlasses (Chip weggeklickt: «nicht mehr anbieten»). */
export function vergissLesePosition(key: string): void {
  const rest = lese().filter((e) => e.key !== key);
  if (rest.length) lokalSpeicher.schreib(KEY, JSON.stringify(rest));
  else lokalSpeicher.entferne(KEY);
}
