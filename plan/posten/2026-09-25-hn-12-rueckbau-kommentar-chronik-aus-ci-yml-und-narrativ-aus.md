<!-- @posten
dach: QS-DOKU-DIAET
titel: HN-12 — Rückbau: Kommentar-Chronik aus `ci.yml` und Narrativ aus `shard-gruppen.json` auslagern
anlass: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN HN-12 (VS-03, VS-11); Einbuchung: Go David 24.9.2026 («gleich die befunde einbaust»)
-->

- Befunde: VS-03 (mittel · b — HN-00 bestätigt 25.9.2026: 1066 von 1714 Zeilen Kommentar, 71,4 %), VS-11 (tief · EA).
- Dateien: `.github/workflows/ci.yml` (1'066 Kommentarzeilen = 77'465 B); `e2e/shard-gruppen.json` (`_kommentar` 10'891 B) und `scripts/e2e-shard-gruppen-generieren.mjs:32`; Ziel ist ein Archiv-Dokument ausserhalb der Steuerfläche (z. B. unter `archiv/`), im YAML je ein Einzeiler mit Verweis.
- Klasse mechanisch · Tor-Pfad (`ci.yml`) → GP Pflicht · verhaltensneutral ja.
- Beweis: kommentarfreie Projektion `yq -o=json .github/workflows/ci.yml` vorher = nachher byte-gleich; `jq .gruppen e2e/shard-gruppen.json` byte-gleich; `check:steuerflaeche`, `check:tor-paritaet`, `check:e2e-shards` grün. Datierte Belege wörtlich verschieben, nie umschreiben (§2b); die CI-Überspring-Markierung nie wörtlich in einen Commit-Text übernehmen (§0 Ziff. 4, Squash-Schutz).
- Steuerfläche: bis −75,6 KB. Danach die Grenze **nicht auf Ist**, sondern auf **Ist + Reserve ≈ 15 KB** senken (geschätzter Zuwachs HN-14 … HN-17 und HN-D4, Abschnitt 7), datiert kommentiert; nach HN-17 auf Ist nachziehen (Sperrklinke).
- PRs 1–2 · Abh.: — (darf vor HN-00 starten) · Blocker: keiner.

**Stand 25.9.2026:** Nach #1073 steht `check:steuerflaeche` bei 1295.0 von 1295.0 KB (Luft 0.0) — jede Einheit mit Flächen-Zuwachs (HN-14 … HN-17, HN-D4-Tor) wartet auf diesen Rückbau.

**HN-00 erledigt 25.9.2026:** Die Zweitprüfung (Sonnet, `berichte/zweitpruefung-nachzug-hn00.md` im Projektordner) hat PS-02, PS-06, PS-07, PS-08, PS-11, PS-12, VS-02, VS-03 und ZP-SA-N1 bestätigt, keiner widerlegt — Abhängigkeiten auf HN-00 sind erfüllt.

Quelle: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN.md Einheit HN-12 (Projektordner `~/Documents/David/03_Projekte/LexMetrik/pruefung-herz-nieren-2026-09-24/`; Belege in BEFUNDLISTE.md und berichte/). Kürzel: NT normtext-treue · PS pruefsystem · VS verschlankung · SA sicherheit-a11y · DK design-konsistenz · RR rechtslogik-rest; b = zweitgeprüft bestätigt, EA = nur Erstprüfer (vor dem Fix reproduzieren, sonst fällt der Beifang mit Begründungszeile im PR weg). Zeilenangaben Stand main 1d6eeb3c5 (24.9.2026) — vor dem Bau nachmessen.

**Stand 25.9.2026 (PR 1, #1094):** `ci.yml`-Kommentar-Chronik wörtlich nach `archiv/ci-yml-kommentare.md` verschoben (62 Blöcke, 936 Zeilen; `ci.yml` 108 466 → 44 176 B), Grenze `messwerte/steuerflaeche.json` auf 1 277 952 B gesenkt (Ist + 15 KB). Gegenprüfung (Opus) bestanden, Bericht `berichte/gegenpruefung-hn12-ci-kommentare-2026-09-25.md` im Projektordner. **Offen für PR 2:** (1) `e2e/shard-gruppen.json`-Narrativ (`_kommentar`, 10 890 B) + Generator `scripts/e2e-shard-gruppen-generieren.mjs:32` — vorher mit laufenden Leser-Sessions abstimmen; (2) GP-Befund F1: die Verweise `#ci-NNN` springen auf GitHub nicht an (Anker-ID aus der ganzen Überschrift) — `<a id="ci-NNN"></a>` vor jede Archiv-Überschrift, Blöcke unberührt; (3) GP-Befund F4: die Beweise (a) JSON-Projektion und (b) Rückweg erkennen eine falsch eingerückte Verweiszeile nicht — die Vorwärts-Ableitung aus den Verschiebe-Regeln als dritten Beweis vorgeben; (4) `archiv/README.md` hat keine Zeile für die neue Datei. Nach HN-17 die Grenze auf Ist nachziehen (Sperrklinke).
