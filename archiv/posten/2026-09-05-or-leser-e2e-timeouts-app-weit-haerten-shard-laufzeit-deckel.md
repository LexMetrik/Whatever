<!-- @posten
dach: QS-CI-MINUTEN
titel: Test-Laufzeit unter Last — OR-Leser-e2e-Timeouts, Shard-Laufzeit-Deckel, Suchindex-Zeitbudget, CPU-Aushungerung (6 Punkte gebündelt)
anlass: CI 5.9.2026
-->

*Titel bis 24.9.2026: «OR-Leser-e2e-Timeouts app-weit härten · Shard-Laufzeit-Deckel» — seither Kopf eines Bündels (unten).*

  - [ ] **OR-Leser-e2e-Timeouts app-weit härten · Shard-Laufzeit-Deckel** *(CI 5.9.2026)* — Fahrplan §4.

Umgehängt 24.9.2026 von `W2·18-FEHLERBUCH` nach `QS-CI-MINUTEN` (Bauplan-Konsolidierung M-17, QS-DOKU-DIAET).

**Bündel 24.9.2026** (Bauplan-Konsolidierung M-17, QS-DOKU-DIAET): 1 weiterer Posten derselben Sorge ist hier im Wortlaut aufgenommen — Titel, Anlass, alter Dach-Schlüssel und alte Datei je Punkt; die Dateien liegen mit Beleg «gebündelt in …» unter `archiv/posten/`. Nichts gekürzt.

### 1 · Suchindex-Tests (suche-rang, suche, rankingTestset) reissen unter Last ihr Zeitbudget → lokales gate unzuverlässig bei paralleler Last *(Anlass: Session-Notizen 2026-09-23; vormals Dach `W2·18-FEHLERBUCH`, `plan/posten/2026-09-23-suchindex-tests-suche-rang-suche-rankingtestset-reissen-unte.md`)*

Suchindex-Tests (suche-rang, suche, rankingTestset) reissen unter Last ihr Zeitbudget → lokales gate unzuverlässig bei paralleler Last

- 24.9.2026 (W2·29-MARKE, lokal): `scripts/datenhaltung/suche-rang.test.ts` Hook-Timeout 95 s im vollen `gate`, einzeln 29 s grün.

**Nachzug 24.9.2026** (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET): 4 Fahrplan-Einträge derselben Sorge sind hier im Wortlaut aufgenommen; im Fahrplan steht an ihrer Stelle je ein Zeiger hierher. Nichts gekürzt.

### 2 · e2e-Assertions-Latten unter CPU-Aushungerung *(aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md`, §4, vormals Z. 205)*

  - [ ] **e2e-Assertions-Latten unter CPU-Aushungerung** *(QS-E2E-STABIL-Messreihe 14.8.: eigene Klasse, kein Timeout — international-kanonik-ia6 3× toBeInViewport, gesetze-ia-v2-walks, suche-seite:27 expect.poll, verlauf-o1, qsui-Vorlagen; wandert je Lauf mit Aushungerungstiefe; weitere Mitglieder 21.8.2026: leser-position-u:147, rechtsprechung.e2e:318 Rail-CLS, leser-gliederung-a33, norm-sprung Ctrl+K-Fokus — alle standalone grün nachgewiesen. Methode wie QS-E2E-STABIL, aber gedeckelte Lastbedingung — nie die verworfene Übersättigung. Weitere Mitglieder 29.8.2026 (drei Prüf-Sessions unabhängig): international-kanonik-ia6, leser-kopf-cls-s3, rechtsprechung-richter, datenhaltung/suche, leser-v3-h4-Familie, suche/rankingTestset-vitest-Hooks — je seriell grün, unter 5-Worker-Last wandernd.)*

### 3 · Kontention (5.9.2026, Nachmittag) *(aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md`, §4, vormals Z. 237)*

- [ ] **Kontention (5.9.2026, Nachmittag):** bei ≥ 4 parallelen Bau-Agenten + Stop-Hook-Gate auf einer Maschine reissen `scripts/datenhaltung/suche.test.ts`/`suche-rang.test.ts` ihr 95-s-Setup-Limit (Vollsuite 224 s statt 40 s) und E2E-Latten (`international-kanonik-ia6` toBeInViewport, `leser-kopf-cls-s3` CLS, `a11y` dunkel BS-640.100) — isoliert stets grün (belegt 4×). Kein Code-Fix; Regel: Tore seriell fahren, wenn Bauer laufen; Stop-Hook-Gate unter Last als Hinweis lesen, nicht als Rot. **Wurzel-Fix-Kandidat (Opus-Prüfer 5.9.2026):** `suche.test.ts` baut je Lauf den In-memory-FTS-Index auf (Budget 14.8. schon 60→95 s gehoben) — vorgebaute DB-Fixture statt Aufbau je Lauf; eigener Schritt unter QS-DATA-INGEST-DRIFT oder QS-BASIS.

### 4 · check:e2e-shards deckelt Laufzeit je Shard *(aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md`, §4, vormals Z. 242)*

- [ ] **`check:e2e-shards` deckelt Laufzeit je Shard** — Balance über mehrere CI-Läufe mitteln (Streuung ≈ verschobener Betrag).

### 5 · Such-Tests (FlexSearch ~54k Artikel) unter Parallel-Last in Hook-Timeouts *(aus `fahrplaene/FAHRPLAN-CI-MINUTEN.md`, §1, vormals Z. 62)*

  - [ ] **Such-Tests (FlexSearch ~54k Artikel) unter Parallel-Last in Hook-Timeouts** *(2 Belege 19.9.2026, isoliert + Re-Run grün)* — `scripts/datenhaltung/suche*.test.ts`, `src/tests/suche/rankingTestset.test.ts`, `allgemeineFrist.property.test.ts`.
