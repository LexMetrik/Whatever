<!-- @posten
dach: W2·17-UI-BEFUNDE
titel: Schlankheitsgrenze: EntscheidLeser.tsx 1204/1204, PanelEntscheide.tsx 417/420 — nächster Zuwachs braucht Split (NormText.tsx/leserV3Modell siehe bestehende Posten)
anlass: Abschluss Session «Gesetzesleser Funktionen inventarisieren» 2.10.2026 (Station E)
-->

EntscheidLeser.tsx 1204/1204 (#1267), PanelEntscheide-Deckel 417/420 (#1281). Für NormText.tsx (800/800) und leserV3Modell.ts (418/418) bestehen schon Posten unter W2·29-WERKBANK-NACHLAUF (2026-09-23-normtext-tsx-795-800…, 2026-09-23-adapter-leserv3modell-ts-schneiden…) — nicht doppelt. Schneiden zuerst (§6.6), nie Deckel anheben. Dazu EntscheidLeser.tsx:1195/MaterialLeser.tsx:39: doppeltes Dekodieren; null-Dekodierung ohne Hinweis; Test tieflink-zweig-kanonisierung meldet «act environment» (IS_REACT_ACT_ENVIRONMENT fehlt) (#1267). Quelle: Session-Notizen 2026-10-01-leser-befunde.md / 2026-10-01-leser-funktionsinventar.md (rekonstruiert 2.10.2026, Original-Befunddateien beim App-Neustart verloren: IDs tragen keinen Detailbeleg). Zeilen- und Stand-Angaben vom 2.10.2026 — vor Bau gegen origin/main prüfen und neu reproduzieren (§0 Ziff. 2).
