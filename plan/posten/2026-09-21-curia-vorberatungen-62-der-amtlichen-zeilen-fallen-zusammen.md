<!-- @posten
dach: QS-KORPUS
titel: Curia-Vorberatungen: 62 % der amtlichen Zeilen fallen zusammen — gewollt oder Verlust? (David)
anlass: Vollzensus 21.9.2026 beim Fix des Publikations-Dedupe (fix/curia-publikationen-dedupe)
wartet-auf: david
-->

**WARTET AUF DAVID — fachlicher Entscheid, kein Bau.**

Beim Fix des Publikations-Dedupe (`bauePublikationen`) wurde dieselbe Schlüssel-Falle bei
den Schwester-Entitäten mitgemessen. Bei den **Kommissions-Vorberatungen** ist sie um
Grössenordnungen stärker als im behobenen Fall.

**Messung** (Vollzensus DE, `https://ws.parlament.ch/odata.svc`, Entität `Preconsultation`,
`$select=PreconsultationDate,CommitteeName,BusinessShortNumber`, `$inlinecount=allpages`,
Abruf 21.9.2026; **keine Personenfelder abgefragt**, `Voting` nicht angefasst):

| Menge | amtliche Zeilen | gespeichert | Differenz |
|---|---|---|---|
| über die Shard-Geschäfte | 2093 | **790** | **−1303 (62 %)** |
| korpusweit (DE) | 32 031 | 22 542 | −9489 |

Stichproben: Geschäft 08.053 16 Zeilen → 2 · Geschäft 24.041 23 → 5.
Der Schlüssel in `baueKommissionen` ist `datum|CommitteeName`. Die zusammenfallenden Zeilen
unterscheiden sich **ausschliesslich in `BillNumber`/`IdBill`** (vereinzelt zusätzlich
`TreatmentCategory`) — also: **dieselbe Kommissionssitzung, verschiedene Entwürfe**.

**Die Frage an David.** Genau dieselbe Konstellation war bei den Publikationen ein Datenverlust
und ist behoben. Hier ist sie **plausibel gewollt**: eine Kommissionssitzung behandelt alle
Vorlagen eines Geschäfts, und «wer hat wann beraten» ist einmal pro Sitzung die richtige
Aussage, nicht einmal pro Entwurf. Aber das ist bisher **eine Annahme, keine Messung und
keine Entscheidung** — nirgends dokumentiert.

- **Variante A (Behalt, nur beschriften):** Schlüssel bleibt; im Code und im §11-Eintrag wird
  festgehalten, dass `vorberatungen[]` bewusst je Sitzung und nicht je Entwurf zählt. Günstig,
  ändert keine Daten, macht die Auflage «Daten inhaltlich nicht verändern» aber zur
  Auslegungsfrage.
- **Variante B (wie bei den Publikationen):** `vorlage` in Schlüssel und Datenmodell; der
  Bestand wächst von 790 auf ~2093 Zeilen. Treu zur Quelle, aber die Oberfläche müsste dann
  zeigen, dass dieselbe Sitzung mehrfach erscheint — sonst sieht es nach Doppelung aus.

**Empfehlung:** Variante A, weil die Aussage «Kommission X beriet am Datum Y» durch die
Entwurfs-Aufteilung nicht genauer wird, sondern nur länger. Aber der Entscheid gehört David,
weil er die fachliche Bedeutung der Vorberatungs-Liste festlegt (§7/§8).

**Nicht Teil des Publikations-PR** — dort bewusst ausgeklammert, um Risiko-Flächen nicht zu
mischen.
