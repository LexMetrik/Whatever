<!-- @posten
dach: W2·17-UI-BEFUNDE
titel: BG-05: Lesart-Wechsel in anderem Tab wirft den Leser auf den Einstiegsanker zurück (mittel)
anlass: Abschluss Session «Gesetzesleser Funktionen inventarisieren» 2.10.2026 (Station E)
-->

Tab B liest OR bis Art. 83 (Gesamtansicht); in Tab A «Einzelne Bestimmung» speichern → Tab B schaltet um und zeigt nur art-41 (Adresse unverändert), Lesestelle weg. Ursache: leserOptionen.ts:543-547 (storage-Hörer übernimmt `ansicht` live) + v3/useEinzelModus.ts:97,118-119 mit einzelModus.ts:335 (im Einzelmodus gewinnt der Adress-Anker). Vorschlag: storage-Hörer nur als Präferenz für künftige Aufrufe. Beleg: Finder Bug G7–G12 2.10.2026 (Playwright, kalt, ohne Last), Notiz 2026-10-02-finder-bug-g.md.
