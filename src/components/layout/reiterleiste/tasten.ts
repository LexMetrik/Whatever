// ═══ W2·18 Punkt 1 · WELCHE TASTE GEDRÜCKT WURDE (Mac-Option) ═══════════════
//
// GEMESSEN/BELEGT 13.9.2026 (Fahrplan §4.R Ziff. 1): die Leiste las die
// Alt-Kürzel aus `KeyboardEvent.key` (`e.key === 't'`, `'w'`, `/^[1-9]$/`).
// macOS legt auf Option+Buchstabe/Ziffer aber ein SONDERZEICHEN — Option+T
// liefert `key = '†'`, Option+W `'∑'`, Option+1 `'¡'`. Die Bedingung traf nie,
// also waren Alt+T (neuer Reiter), Alt+W (schliessen), Alt+1…9 (springen) und
// Alt+⇧+T (wiederherstellen) am Mac tot — während CI und Linux grün blieben,
// weil dort `key` der Buchstabe IST. Ein Kürzel, das die Oberfläche anbietet
// (`aria-keyshortcuts`, Blatt-Legende) und das auf dem Gerät des Nutzers nichts
// tut, ist eine Zusage, die nicht gilt (§8).
//
// DIE ANTWORT: `KeyboardEvent.code` — die PHYSISCHE Taste (`KeyT`, `Digit3`),
// unabhängig von Modifikator und Tastaturbelegung. `key` bleibt als zweiter
// Weg daneben: Belegungen, die den Buchstaben an eine andere physische Taste
// legen (Dvorak, Neo), sollen weiter das treffen, was auf ihrer Taste STEHT.
// Beides zu akzeptieren ist hier gefahrlos — die betroffenen Kürzel hängen
// alle an Alt, und Alt+Buchstabe hat sonst keine Bedeutung in der App.
//
// Rein und ohne DOM (§3): geprüft wird ein Objekt mit `key`/`code`, kein
// Event — darum liegt der Test in `src/tests/reiter-tasten-mac.test.ts` und
// braucht kein jsdom (Repo-Technik, vgl. `lib/normtext/tasten`).

/** Der Teil eines Tastendrucks, auf den die Leiste schaut. */
export interface TastenDruck { key: string; code: string }

/**
 * Trifft dieser Druck den gesuchten Buchstaben?
 *
 * @param e     Tastendruck (`key` + `code`).
 * @param taste Der Buchstabe in Kleinschreibung, z.B. `'t'`.
 */
export function istBuchstabenTaste(e: TastenDruck, taste: string): boolean {
  return e.code === `Key${taste.toUpperCase()}` || e.key.toLowerCase() === taste;
}

/**
 * Die Ziffer 1…9 dieses Drucks, oder `null`. Zifferblock (`Numpad1`) zählt
 * mit: dieselbe Ziffer, dieselbe Absicht.
 */
export function zifferTaste(e: TastenDruck): number | null {
  const physisch = /^(?:Digit|Numpad)([1-9])$/.exec(e.code);
  if (physisch) return Number(physisch[1]);
  return /^[1-9]$/.test(e.key) ? Number(e.key) : null;
}
