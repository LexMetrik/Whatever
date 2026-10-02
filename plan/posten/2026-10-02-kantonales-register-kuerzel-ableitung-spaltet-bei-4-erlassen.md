<!-- @posten
dach: W2·13-KANTONE
titel: Kantonales Register: Kürzel-Ableitung spaltet bei ≥4 Erlassen den Titel-Schluss als «kuerzel» ab (6 Fälle, 41 Fälle Kürzel ≠ Titel > 30 Zeichen)
anlass: Abschluss Session «Gesetzesleser Funktionen inventarisieren» 2.10.2026 (Station E)
-->

Betroffen 6: BS-154.123, BS-390.760, BS-953.900, ZH-211.12, ZH-215.12, VD-vd-210360 (amtlich Titel = titel + ", " + kuerzel, BS-API 2.10.2026). Wurzel-Fix im Register-Generator scripts/normtext/browse-manifest.ts (`identitaetAusErlass`/`istKuerzelFragment`: Split am letzten Komma lässt den Tail durch, sobald irgendein Wort auf Erlassform endet; ERLASSFORM_RE dupliziert KUERZEL_FORM_RE); danach entfällt die Brücke src/pages/gesetz-leser/titelSchluss.ts (#1261). Restrisiko aus der Prüfung #1261: Kürzel-Streifen zeigt bei 6 Fällen den Titelteil als Etikett, Relationswort-Fall, Stolperdraht-Test :340. Risikopfad → Gegenprüfung. Quelle: Session-Notizen 2026-10-01-leser-befunde.md / 2026-10-01-leser-funktionsinventar.md (rekonstruiert 2.10.2026, Original-Befunddateien beim App-Neustart verloren: IDs tragen keinen Detailbeleg). Zeilen- und Stand-Angaben vom 2.10.2026 — vor Bau gegen origin/main prüfen und neu reproduzieren (§0 Ziff. 2).
