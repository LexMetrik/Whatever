<!-- @posten
dach: W2·17-UI-BEFUNDE
titel: BG-07/BG-08/BG-09 (niedrig): Zurück springt in Einzelmodus, Permalink ohne ?ansicht=artikel, Verlauf-Duplikate umgezogener Adressen
anlass: Abschluss Session «Gesetzesleser Funktionen inventarisieren» 2.10.2026 (Station E)
-->

BG-07: «Zurück» nach Wechsel auf «Ganzer Erlass» kippt in den Einzelmodus (v3/useEinzelModus.ts:125 pushState je Blättern vs. :142 nur replace beim Wechsel; Regel :40-42 sagt das Gegenteil). BG-08: Permalink im Einzelmodus verliert `?ansicht=artikel` (parts/ArtikelAktionen.tsx:94 `permalink` aus `basisPfad` ohne Query; Kap. 15.6, LM-202). BG-09: `lexmetrik-zuletzt` führt EMRK doppelt (ZuletztTracker.tsx:60 + lib/verlaufLabel.ts:88; Route vor `merkeBesuch` kanonisieren, nach #1275). Beleg: Finder Bug G7–G12 2.10.2026, Notiz 2026-10-02-finder-bug-g.md.
