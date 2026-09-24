// ─── Wortlaut der Entwurf-Kennzeichnung — EINE Quelle (§5, RL-12 PR 2) ───────
//
// Bis RL-12 stand der Wortlaut nur in `EntwurfLegende` (Katalog-Kopf). Seit
// die Werkzeug-Köpfe (Rechner und Vorlagen, `layout/WerkzeugKopf`) den Status
// ihrer Karte ebenfalls zeigen (Befund R3-06, Prüfung Rechtslogik 23.9.2026),
// lesen beide Flächen dieselben Konstanten — kein zweiter Wortlaut. KEIN
// Status-Upgrade (§7/§8): nur die vorhandene Aussage an einer zweiten Stelle.
// Eigene Datei (nicht in der Komponente), weil Komponenten-Dateien nur
// Komponenten exportieren (react-refresh).

/** Die Marke («lc-badge-entwurf»). */
export const ENTWURF_MARKE = 'Entwurf';
/** Der Kurzsatz neben der Marke. */
export const ENTWURF_KURZ = 'erstellt, fachlich noch nicht geprüft';
/** Die ausführliche Erklärung (Popover der Legende). */
export const ENTWURF_ERKLAERUNG =
  'Das Werkzeug ist erstellt, aber fachlich noch nicht geprüft. Zahlen und Aussagen im Einzelfall gegen Gesetz und Sachverhalt verifizieren.';
