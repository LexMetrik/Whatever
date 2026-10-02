<!-- @posten
dach: W2·27-BUND-FERTIG
titel: giltSeit stammt für 559 Bund-Artikel NUR aus der Fussnote des Gliederungstitels davor (sektion), bei 92 weiteren ist sie jünger als jede eigene Fussnote
-->

Befund P7 (1.10.2026, Messung per vite-node über public/normtext/struktur/bund + parseFussnoteHistorie): baueArtikelHistorie zählt Fussnoten mit sektion (hängen am vorangehenden Gliederungstitel, nicht am Artikel) in giltSeit ein. Beispiel AHVG Art. 23: giltSeit 1997-01-01 stammt allein aus der Titel-Fussnote «III. Der Anspruch auf Witwen- und Witwerrente» (Fassung gemäss 10. AHV-Revision); eigene Fussnote nur ein Verweis. 1340 Artikel tragen ein datiertes Sektions-Ereignis; 559 davon haben KEIN eigenes datiertes Ereignis, bei 92 ist das Sektions-Datum jünger als das eigene. Die Anzeige «Gilt seit …» sagt dann das Datum der Titel-Änderung, nicht des Artikels. Frage vor dem Bau (Darstellungs-/Fachentscheid, nicht von P7 entschieden): soll ein Titel-Datum den Artikel-Stand vorrücken (Titel neu gefasst = ganzer Abschnitt neu?), oder nur die Chronik speisen? Betroffen: src/lib/normtext/historie-parse.ts baueArtikelHistorie, Historie-Shards, Anzeige fassungsEtikett. P7 hat nur den Fall «Artikel amtlich aufgehoben» korrigiert (ASYLV2 65, HREGV 162–163, ZSTV 75a–75m).

**Erledigt 2026-10-02:** PR #1286: Regel C — Überschrift-Ereignisse speisen nur die Chronik, nie giltSeit (Fachfrage A/B/C an David als eigener Posten)
