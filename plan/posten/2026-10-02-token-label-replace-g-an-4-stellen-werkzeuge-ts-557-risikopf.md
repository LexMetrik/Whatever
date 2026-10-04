<!-- @posten
dach: W2·17-UI-BEFUNDE
titel: Token→Label: replace(/_/g,"") in werkzeuge.ts:557 (Sublabel «via Art. …», Risikopfad)
anlass: Abschluss Session «Gesetzesleser Funktionen inventarisieren» 2.10.2026 (Station E)
-->

Dieselbe Wurzel wie DFG-F01 (Reiter-Label aus Anker-Token): src/lib/normtext/werkzeuge.ts:557 baut das Sublabel «via Art. …» mit `bezug.artikel.replace(/_/g,'')` und streicht `_` ersatzlos (SchlT-/Anhang-/Bereichs-Token wie scope_u1, annex_1, 49_50). Risikopfad → Gegenprüfung. Die drei UI-Stellen KontextPanel.tsx, lib/kontext.ts und PanelErlaeuterungen.tsx sind mit #1283 (`nummerAusToken`) erledigt; dieselbe Funktion bzw. artikelBezeichnung.ts (#1274) nutzen. Quelle: Session-Notizen 2026-10-01-leser-befunde.md / 2026-10-01-leser-funktionsinventar.md (rekonstruiert 2.10.2026, Original-Befunddateien beim App-Neustart verloren: IDs tragen keinen Detailbeleg). Zeilen- und Stand-Angaben vom 2.10.2026 — vor Bau gegen origin/main prüfen und neu reproduzieren (§0 Ziff. 2).
