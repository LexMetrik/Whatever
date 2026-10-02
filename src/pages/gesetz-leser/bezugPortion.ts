// ─── Zahlformat der Entscheid-Linien (Rest von B7) ───────────────────────────
//
// RÜCKBAU 2.10.2026 (W2·17-UI-BEFUNDE, Entscheid David 2.10.2026): diese Datei
// trug bis dahin die Portions-Arithmetik der Instanz-Linie am Artikelfuss
// (`PRO_SCHRITT`, `naechsteSichtbar`, `verkuerzungAus`, `zahlText`,
// `istLetzterSchritt`, `URSACHE_LANG`) — ihr einziger Verbraucher war
// `parts/BezuegeZeile.tsx`, und deren Rubrik «Entscheide» steht im Dossier des
// Einzelmodus hinter `RECHTSPRECHUNG_BLOCK_FREI = false` seit M3, in der
// Gesamtansicht seit S6 W1f gar nicht mehr. Beides ist zurückgebaut; was bleibt,
// ist die Schweizer Zahlschreibung, die das Entscheide-Panel (`v3/`) weiter braucht.
//
// DER GRUND, WARUM DER LADE-STAND NIE PERSISTIERT WIRD, gilt unverändert auch für
// die Portionen im Panel (`v3/PanelEntscheide.tsx` verweist hierher; Wortlaut
// des Vorgabe-Datums W2·7-BEZUG/B7, David 29.7.2026):
// «Ich habe hier schon dreimal nachgeladen» ist eine Aussage über den aktuellen
// Blick, nicht über eine Einstellung. Der Leser-Options-Store hält Dinge, die
// eine ABSICHT ausdrücken (welche Instanzen, welcher Zeitraum) — ein Lade-Stand
// gehört nicht dazu, und ihn je Artikel und Klasse zu speichern hiesse, den
// Store mit Sitzungsstaub zu füllen. Jeder Besuch beginnt bei den fünf neusten.
//
// Rein und deterministisch (§2): kein Zustand, kein DOM, keine Uhr.

/** Zahl mit Schweizer Tausendertrennung — «4'140» statt «4140». */
export const zahl = (n: number): string => n.toLocaleString('de-CH');
