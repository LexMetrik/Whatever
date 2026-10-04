<!-- @posten
dach: W2·17-UI-BEFUNDE
titel: Finder Bug G: ungeklärt (U-1 naechsteInstanz verwirft Query, U-2 ?r=1, U-3 Alias umbenannter Erlass, U-5 Schriftskala ohne storage-Hörer)
anlass: Abschluss Session «Gesetzesleser Funktionen inventarisieren» 2.10.2026 (Station E)
-->

U-1 lib/tabs.ts:1265 `naechsteInstanz` verwirft andere Query-Parameter (nur Code gelesen; F9-B02 in #1275 betraf dasselbe — Stand prüfen). U-2 tabs.ts:1264 liefert `?r=1` ohne offenen Reiter → zwei Reiter mit Instanz 1 möglich (Aufrufpfad nicht gefunden). U-3 Umbenannter Erlass: keine Alias-Abbildung → «Erlass nicht gefunden» (Produktlücke). U-4 404-Erlass legt einen Reiter an (Browser-Norm, ok). U-5 useSchriftskala.ts ohne storage-Hörer (kosmetisch). Quelle: 2026-10-02-finder-bug-g.md.
