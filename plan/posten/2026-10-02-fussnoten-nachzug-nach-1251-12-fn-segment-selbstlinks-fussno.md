<!-- @posten
dach: W2·17-UI-BEFUNDE
titel: Fussnoten-Nachzug nach #1251: 12 FN-Segment-Selbstlinks, fussnotenAnzeige dupliziert vergleicheFnNr, Option «vermerke: an» ohne Marken
anlass: Abschluss Session «Gesetzesleser Funktionen inventarisieren» 2.10.2026 (Station E)
-->

(1) 12 Fussnoten-Segment-Selbstlinks bleiben falsch (z. B. ZPO 250 → ZPO 107): nach #1251 `npm run check:verweis-inventar -- --schreiben` und die FN_SEGMENT-Einträge prüfen (Prüfbericht #1264). (2) `fussnotenAnzeige` (ArtikelLeser.fussnoten.ts:50) dupliziert `vergleicheFnNr` (§5, Nachzug #1266). (3) Finder DFG 2.10.: Option `vermerke: 'an'` per localStorage erzeugte in OR Art. 40a keine sichtbaren Marken — ungeklärt, ob Bedienung oder Daten. Quelle: Session-Notizen 2026-10-01-leser-befunde.md / 2026-10-01-leser-funktionsinventar.md (rekonstruiert 2.10.2026, Original-Befunddateien beim App-Neustart verloren: IDs tragen keinen Detailbeleg). Zeilen- und Stand-Angaben vom 2.10.2026 — vor Bau gegen origin/main prüfen und neu reproduzieren (§0 Ziff. 2).
