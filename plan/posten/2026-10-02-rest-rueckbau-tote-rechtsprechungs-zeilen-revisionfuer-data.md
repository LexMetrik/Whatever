<!-- @posten
dach: W2·17-UI-BEFUNDE
titel: Rest-Rückbau tote Rechtsprechungs-Zeilen: revisionFuer, data-leitfaelle, Revisions-Shard ohne Verbraucher, nicht scheiternde e2e-Zeilen
anlass: Abschluss Session «Gesetzesleser Funktionen inventarisieren» 2.10.2026 (Station E)
-->

Entscheid David 2.10.2026: zurückbauen; #1273 (548c32c12) und Rest #1276 (9bb82d7de) sind gelandet. Platte 2.10.2026 (grep gegen origin/main): `oeffneBlatt` ist weg, aber `revisionFuer` steht noch in src/pages/gesetz-leser/inhalt-zustand.tsx (lädt den Revisions-Shard ohne Verbraucher, Netz!) und `data-leitfaelle` in inhalt-suchtreffer.tsx. Laut Notiz ebenfalls offen/zu prüfen: LeserLesespalte.tsx:77 Typ-Rest, e2e leser-bezuege-inhalt-d30:69 und leser-einzelmodus:292 können nicht scheitern (§6.7), Kommentare index.css:4422 und BezugFacettenWahl:207, LADER-Liste entscheidZahl, leserV3Modell.ts:101/404. «revisionFuer weg» kostet evtl. das «revidiert»-Kennzeichen — dann beim Öffnen laden. ED13-B03 nicht auffindbar. Quelle: Session-Notizen 2026-10-01-leser-befunde.md / 2026-10-01-leser-funktionsinventar.md (rekonstruiert 2.10.2026, Original-Befunddateien beim App-Neustart verloren: IDs tragen keinen Detailbeleg). Zeilen- und Stand-Angaben vom 2.10.2026 — vor Bau gegen origin/main prüfen und neu reproduzieren (§0 Ziff. 2).
