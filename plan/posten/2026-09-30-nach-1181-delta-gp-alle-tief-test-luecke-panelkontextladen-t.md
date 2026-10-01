<!-- @posten
dach: W2·27-BUND-FERTIG
titel: Nach #1181 (Delta-GP, alle tief), Rest: Teilzahl im Gruppenkopf der Rest-Liste, kuratierte Liste verschwindet nach «Erneut laden» kurz, AN-4-Begründung prüfen
anlass: Session-Notizen 2026-09-30
-->

Nach #1181 (Delta-GP, alle tief): Rest nach der Erledigung vom 1.10.2026.

Erledigt (Beleg 1.10.2026, Branch chore/w227-kontext-rueckbau):
- Test-Lücke «Manifest-Ausfall ⇒ kein `rest`» (panelKontextLaden.ts `ladeErlaeuterungen`): war schon mit #1196 geschlossen (kontext-panel-ladefehler.test.tsx, R3, «Manifest 500 (Shard da): weder `rest` noch kuratierte Einträge»). Mutation heute erneut gezeigt: `if (!manifest) return { stand: null, rest: {…} }` ⇒ genau dieser Test rot (1 failed | 32 passed), Original grün. Seit dem Reset des Manifest-Caches (`_leereMaterialManifestCache`) auch reihenfolgeunabhängig (Shuffle-Seeds 1–7 grün).
- Kommentar PanelTafeln.tsx:108-110: bereits mit #1196 durch den Absatz «ERGÄNZUNG 30.9.2026 (#1181 …)» (zweite Fehlerzeile mit eigenem Knopf bei aufgeklapptem Reiter) nachgezogen; Code geprüft (PanelErlaeuterungen: `AbrufFehler … onErneut={stand.erneut}`) — keine weitere Änderung nötig.

Offen (nur bewertet, nicht gebaut):
- Rest-Liste zeigt `zahl={posten.length}` im Gruppenkopf (`PanelErlaeuterungen.tsx` ErlaeuterungListe) — bei Shard-Ausfall mit kuratiertem Rest als Gesamtzahl lesbar, obwohl die Fehlerzeile «Ein Teil …» darüber die Unvollständigkeit sagt. Klein (Prop weglassen, wenn `stand` ein Rest ist), aber eine Design-Entscheidung (Gruppenkopf-Baustein, offene Design-Spur W2·19) — bei Gelegenheit.
- Nach «Erneut laden» verschwindet die kuratierte Liste kurz (`useNachladen` setzt zurück auf «nicht fertig»): UX-Frage, kein Fehlverhalten; nur mit stabilem Zwischenstand zu beheben.
- AN-4-Begründung (panelKontextLaden.ts, Kommentar zu «Manifest-Ausfall blendet kuratierte Bundle-Liste weiter aus»): Stand stimmt mit dem Code überein (Manifest `null` ⇒ `stand: null, rest: null`, durch R3 bewacht).
