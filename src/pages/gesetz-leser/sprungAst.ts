// ═══ Ast-Buchhaltung der Gliederung: was ein SPRUNG öffnet, gehört dem Nutzer ═
//
// Anlass: Fehlerbuch-Befund David 15.9.2026 («der Pfeil klappt teils erst beim
// zweiten Klick»). Die read-only-Sonde vom selben Tag hat den Pfeil selbst
// entlastet — in 112 Klicks (Desktop/Mobil, OR/ZGB) kippte der Chevron in 0
// Fällen erst beim zweiten Mal. Gefunden wurde stattdessen ein echter
// Code-Defekt an der Stelle, die dasselbe ERLEBNIS erzeugt: ein per
// ARTIKEL-Sprung geöffneter Ast war gegen das Auto-Akkordeon nicht geschützt
// und konnte im nächsten Scroll-Spy-Zyklus wieder zugehen — wer danach klickte,
// sah einen Ast, der sich «nicht merken» wollte.
//
// DIE REGEL, die hier wohnt: ein Sprung-Ziel ist MANUELL geöffnet. Der
// SEKTIONS-Sprung (`inhalt-sprung.tsx`) hielt sie seit dem Bug-Check 9.8.2026
// («K»), der ARTIKEL-Sprung (`v3/leserV3Modell.ts`) hielt nur die Hälfte davon:
// er löschte den Eintrag aus `manuellZu`, trug aber nichts in `manuellOffen`
// ein. Zwei Kopien einer Regel, von denen eine driftete — darum steht sie
// seit dem 15.9.2026 an EINEM Ort (§5) und wird von beiden Sprung-Pfaden und
// vom Scroll-Spy aus derselben Datei gelesen.
//
// §3: reine Logik, kein DOM, kein React — die Buchhaltung ist ohne Browser
// prüfbar (`src/tests/leser-sprung-ast-w218.test.ts`).

/** Die vier Mengen, über die Gliederungs-Äste verbucht werden.
 *
 *  `autoOffen`/`autoTick` gehören dem Scroll-Spy (was er selbst aufgeklappt hat
 *  und wie alt es ist), `manuellOffen`/`manuellZu` gehören dem Nutzer. Ein Ast
 *  steht nie in beiden Lagern: was der Nutzer verbucht hat, adoptiert der Spy
 *  nicht mehr — genau das ist der Schutz, den dieser Defekt vermissen liess. */
export interface AstBuchhaltung {
  autoOffen: Set<string>;
  autoTick: Map<string, number>;
  manuellOffen: Set<string>;
  manuellZu: Set<string>;
}

/**
 * Eine Nutzer-Entscheidung über einen Ast verbuchen: aus dem Auto-Lager nehmen
 * (inkl. Nachlauf-Tick) und je nach Zielzustand in `manuellOffen` ODER
 * `manuellZu` eintragen — nie in beides. Genau dieser Mischzustand war die
 * Wurzel von B3 (Bug-Check 9.8.2026): eine Zeile, die sich nie wieder
 * schliessen liess. Idempotent (§2).
 */
export function merkeKlappAstManuell(ids: Iterable<string>, offen: boolean, b: AstBuchhaltung): void {
  for (const id of ids) {
    b.autoOffen.delete(id);
    b.autoTick.delete(id);
    if (offen) { b.manuellOffen.add(id); b.manuellZu.delete(id); }
    else { b.manuellOffen.delete(id); b.manuellZu.add(id); }
  }
}

/**
 * Ein Sprung-Ziel als MANUELL GEÖFFNET verbuchen. Ein Sprung ist immer eine
 * HINbewegung — er kann nur öffnen, nie schliessen (dieselbe Regel, die der
 * Titel-Klick im Baum trägt).
 */
export function merkeSprungAstManuell(ids: Iterable<string>, b: AstBuchhaltung): void {
  merkeKlappAstManuell(ids, true, b);
}

/**
 * Darf der Scroll-Spy diesen Ast ins Auto-Lager adoptieren? Nein, sobald der
 * Nutzer ihn verbucht hat: manuell GEÖFFNETE bleiben dauerhaft offen, manuell
 * ZUgeklappte werden nicht wieder aufgerissen (Entscheid David 26.6.2026, «K»).
 */
export function darfAutoAdoptieren(
  id: string,
  b: Pick<AstBuchhaltung, 'manuellOffen' | 'manuellZu'>,
): boolean {
  return !b.manuellOffen.has(id) && !b.manuellZu.has(id);
}

/**
 * «alles zu» hält den Scroll-Spy nur bis zum nächsten ABSCHNITTSWECHSEL zurück
 * (W2·17-UI-BEFUNDE B1-B04, Entscheid Orchestrator 2.10.2026). Direkt nach dem
 * Knopf reisst der Spy den gelesenen Ast nicht wieder auf (er steht in
 * `manuellZu`, wie nach einem Pfeil-Klick); wechselt die Leseposition aber in
 * einen anderen Abschnitt, folgt die Gliederung wieder wie gewohnt. `pfad` ist
 * der aktive Pfad im Moment des Knopfs, `ids` die dabei zugeklappten Ids.
 * Einzelne Pfeil-Klicks bleiben davon unberührt (Entscheid David 26.6.2026, «K»).
 */
export interface AlleZuSperre { pfad: readonly string[]; ids: readonly string[] }

/**
 * Hebt die «alles zu»-Sperre auf, sobald der aktive Pfad ein anderer ist:
 * nimmt ihre Ids aus `manuellZu` und liefert `null`; sonst die Sperre unverändert.
 * Rein bis auf die erklärte Mutation von `manuellZu` (§2).
 */
export function pruefeAlleZuSperre(
  sperre: AlleZuSperre | null, aktivIds: readonly string[], manuellZu: Set<string>,
): AlleZuSperre | null {
  if (!sperre) return null;
  const gleich = sperre.pfad.length === aktivIds.length && sperre.pfad.every((id, i) => id === aktivIds[i]);
  if (gleich) return sperre;
  for (const id of sperre.ids) manuellZu.delete(id);
  return null;
}
