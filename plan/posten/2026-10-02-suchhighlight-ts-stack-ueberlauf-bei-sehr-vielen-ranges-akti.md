<!-- @posten
dach: W2·17-UI-BEFUNDE
titel: suchHighlight.ts: Stack-Überlauf bei sehr vielen Ranges; aktiver-Treffer-Marker zurückgestellt; SynopseKarte brass-200/ink-900
anlass: Abschluss Session «Gesetzesleser Funktionen inventarisieren» 2.10.2026 (Station E)
-->

(1) suchHighlight.ts:510 `new Ctor(...alle)` — Stack-Überlauf bei sehr vielen Ranges (nur ganzer OR mit Suchwort «e»; Sichtband ok; Nachzug #1266, «ROADMAP-Kandidat»). (2) Aktiver-Treffer-Marker bewusst zurückgestellt (#1270). (3) SynopseKarte.tsx:86 `brass-200`/`ink-900` für «neu»-Marken (Kontrast prüfen; index.css wird aus design/tokens.json generiert, `gen:tokens`). Quelle: Session-Notizen 2026-10-01-leser-befunde.md / 2026-10-01-leser-funktionsinventar.md (rekonstruiert 2.10.2026, Original-Befunddateien beim App-Neustart verloren: IDs tragen keinen Detailbeleg). Zeilen- und Stand-Angaben vom 2.10.2026 — vor Bau gegen origin/main prüfen und neu reproduzieren (§0 Ziff. 2).
