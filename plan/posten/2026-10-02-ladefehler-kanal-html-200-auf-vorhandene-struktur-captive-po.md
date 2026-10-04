<!-- @posten
dach: W2·17-UI-BEFUNDE
titel: Ladefehler-Kanal: HTML-200 auf vorhandene Struktur (Captive-Portal) gilt als «fehlt»; typisiertes fehler-Feld statt Kanal ladefehler.ts
anlass: Abschluss Session «Gesetzesleser Funktionen inventarisieren» 2.10.2026 (Station E)
-->

(1) browse.ts ~Z.293 (Risikopfad src/lib/normtext → Gegenprüfung Pflicht): HTML-200 auf eine VORHANDENE Struktur (Captive-Portal) gilt als «Datei fehlt» — nur ausserhalb Prod bzw. `!res.redirected` so werten; Ausnahmen tabs.ts/gliederung.ts; Fachaenderung `normtext-ladefehler-trennung` (Nachzug #1282). (2) Folge von #1256: neuer Kanal ladefehler.ts durch ein typisiertes `fehler`-Feld in inhalt-zustand ersetzen und den Kanal löschen. Quelle: Session-Notizen 2026-10-01-leser-befunde.md / 2026-10-01-leser-funktionsinventar.md (rekonstruiert 2.10.2026, Original-Befunddateien beim App-Neustart verloren: IDs tragen keinen Detailbeleg). Zeilen- und Stand-Angaben vom 2.10.2026 — vor Bau gegen origin/main prüfen und neu reproduzieren (§0 Ziff. 2).
