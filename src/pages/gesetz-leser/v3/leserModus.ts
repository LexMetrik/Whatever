// ═══ W2·5m · DIE LESART ALS TYP UND VORGABE — sonst nichts ══════════════════
//
// EIGENE, WINZIGE DATEI, und das ist kein Ordnungssinn, sondern eine gemessene
// Notwendigkeit: `../leserOptionen.ts` braucht beides (das Store-Feld `ansicht`
// und seine Vorgabe), und der Options-Store liegt im ENTRY-Chunk — `main.tsx`
// ruft `wendeLeserOptionenAn()` vor dem ersten Paint, damit die gespeicherten
// Schalter ohne Flackern gelten.
//
// Läge die Konstante in `./einzelModus.ts`, zöge dieser eine Import die ganze
// Datei mit: Gliederungspfad, `pfadZu`, die Sektions-Typen — Code, den nur der
// LESER braucht und der bis dahin im Leser-Chunk lag. GEMESSEN am gebauten
// Stand (14.9.2026): Entry 60.7 KB gzip gegen ein Budget von 60.0 KB, also
// `check:perf-budget` ROT. Mit diesem Schnitt kostet der Modus den Entry nur
// noch das, was er wirklich braucht — zwei Literale und einen Typ.
//
// `./einzelModus.ts` re-exportiert beides, damit die Aufrufer EINE Adresse
// haben (§5) und niemand raten muss, welche der zwei Dateien er importiert.

/** Die zwei Lesarten des Erlasses (D-E2: eine OPTION, kein zweiter Leser). */
export type LeserModus = 'erlass' | 'artikel';

/** Der Query-Schlüssel. Ein Wort, kleingeschrieben, wie die Adressen des Hauses. */
export const MODUS_PARAM = 'ansicht';

/**
 * F-E3 (entschieden David 14.9.2026: «ja») · «Ganzer Erlass» bleibt der
 * Vorgabewert für alle, die nichts umstellen — wer einen Link auf ein Gesetz
 * öffnet, erwartet das Gesetz. Der Wert wird darum NIE in die Adresse
 * geschrieben (`?ansicht=erlass` gibt es nicht): eine Adresse, die den
 * Grundzustand ausschreibt, macht aus jedem geteilten Link zwei Schreibweisen
 * für dieselbe Seite.
 */
export const MODUS_VORGABE: LeserModus = 'erlass';
