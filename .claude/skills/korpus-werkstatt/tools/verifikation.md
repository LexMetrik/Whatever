# Werkzeugkasten — `verifikation`

Mechanik der Prüf-Werkzeuge für beide Korpora (Normtext + Rechtsprechung): welcher Befehl,
**wann** er läuft, was er beweist. **Diese Datei erst beim Verifikations-Schritt in den Kontext
ziehen** — nicht vorab (Progressive Disclosure, siehe `SKILL.md`).

Diese Datei **dupliziert §6 nicht** (Protokoll seit 25.7.2026 im Skill `refactoring`;
`CLAUDE.md` §6 trägt den Kern), sie orchestriert die dort definierten Tore für die
zwei Korpora. Alle Befehle sind gegen `package.json`, `scripts/gate.sh` und `playwright.config.ts`
verifiziert. Erfinde keinen Befehl dazu — was hier nicht steht, existiert nicht.

**Eiserne Regel (§6.5):** Bei rotem Tor **nie** `golden/lexmetrik-golden.json`, `dist/` oder
`package-lock.json` direkt lesen — auch Review-Agenten nicht. Diagnose nur über die hier genannten
gezielten Wege.

---

## Die zwei Routine-Tore (pro Iteration vs. vor Abschluss)

| Befehl | Kette | Dauer | Wann |
|---|---|---|---|
| `npm run gate:schnell` | tsc · vitest · golden:vergleich | ~7 s | **nach jedem Teilschritt** während der Arbeit (iterativer §6-/§14.4-Bug-Check) |
| `npm run gate` | tsc · vitest · golden:vergleich · lint · **check** | länger | **vor Abschluss** jedes Produktions-/Verifikations-Laufs |

Beide laufen über `scripts/gate.sh` (Argument `schnell` bzw. `voll`). Der Wrapper ist **leise bei
Grün, volle Ausgabe nur beim roten Gate** — er versteckt also nie ein Versagen, kürzt nur den
grünen Lärm (§6.1). Endet ein Lauf mit `GATE ROT`, ist die Ursache **im Code/Daten** zu
beheben — niemals `npm run golden` (Neuschreiben der Goldens) oder einen Test aufweichen (§6.3).

**Wann was:** `gate:schnell` ist der Takt **während** der Extraktion/Korrektur. `gate` ist das
Schluss-Tor; es zieht zusätzlich `lint` und das Sammeltor `check`. Erst wenn `gate` grün ist, geht
es weiter zur Pflicht-Gegenprüfung (unten) und danach an `landung` — **bei rotem Tor kein
Push, keine Übergabe an `landung`** (§9).

---

## Sammeltore — `check` (offline) und `check:netz` (live)

- **`npm run check`** — der offline-Sammellauf, der in `gate` (voll) steckt. Kette:
  `report:inventur` (auf Abruf), `check:design-tokens`, `check:bibliothek`, `check:verfall`, `check:verfall-ui`,
  `check:sweep`, `check:smoke`, `check:normtext`, `check:vollstaendigkeit`, `check:entscheide`,
  `check:materialien`, `check:pdf`. Deckt beide Korpora gegen den **eingecheckten** Stand ab.
- **`npm run check:netz`** — die **netzabhängigen** Tore separat (nicht in `gate`, weil sie eine
  Quelle erreichen müssen): `check:caches`, `check:zitate`, `check:fedlex-versionen`,
  `check:normtext-netz`, `check:pdf-netz`.

**Wann was:** `check` läuft als Teil von `gate` ohnehin mit. `check:netz` **bewusst zusätzlich
fahren**, wenn die Quelle wandern kann — also nach jedem Normtext-Bau/-Update und bei einem
Stand-Verdacht (Drift). Bei fehlender Netz-Quelle siehe **Fehlerfälle** unten — Lauf abbrechen,
nicht halben Korpus schreiben (§8).

### Einzeltore, die du gezielt rufst

- **`npm run check:fedlex-versionen`** — Stand-/Drift-Arbiter Bund. **Exit 1 = überholte
  Konsolidierung** (neu pinnen, Update-Pfad in `methodology/normtext.md`). Dies ist der
  Currency-Arbiter, nicht der ELI-Resolver.
- **`npm run check:zitate`** — prüft, dass jeder Norm-Zitatanker live auflösbar ist.
- **`npm run check:vollstaendigkeit`** — Kanton-Zitat-Abdeckung + Manifest-Konsistenz (deckt auch
  die kantonalen pdf-embed-Quellen ab; dafür **nicht** `check:pdf` rufen — das prüft die
  internationalen pdf-embed-Erlasse EMRK/NYÜ).
- **`npm run report:confidence -- --schwelle=0.95 [--schreibe]`** — Treue-Gate der kantonalen
  Extraktion (misst maschinelle **Treue zur Quelle**, NICHT juristische Korrektheit; die bleibt
  Davids Abnahme, §7/§8). Unter Schwelle → Confidence-Quarantäne / Pflicht-Review.
- **`npm run check:entscheide`** — Integritäts-Tor Rechtsprechung (BUDGET_MB-Deckel, Invarianten).

---

## Golden-Vergleich — `golden:vergleich` vs. `golden:diff`

- **`npm run golden:vergleich`** — steckt in beiden Gates; prüft den **Engine-Golden**
  (`golden/lexmetrik-golden.json`) byte-gleich. **Wichtig:** das ist NICHT der Normtext-Byte-Index.
  Beim reinen Normtext-Update beweist stattdessen `git diff --stat public/normtext/bund/` +
  `golden/normtext-snapshot.json`, dass nur das Ziel wechselte (Detail in `methodology/normtext.md`).
- **`npm run golden:diff -- <id>`** — bei roter `golden:vergleich` den **einen** abweichenden Fall
  ansehen (§6.5). Nie die ganze Golden-Datei lesen.

---

## Browser-Smoke — `test:e2e` (Playwright VIA BASH, nicht MCP)

```
npm run test:e2e            # = playwright test, gegen vite preview (Port 4317)
```

- Specs liegen in **`e2e/*.e2e.ts`** (so benannt, damit Vitest sie nicht aufsammelt). `testMatch`
  `**/*.e2e.ts`, `baseURL http://localhost:4317`; der `webServer`-Block startet `npm run preview --
  --port 4317 --strictPort` selbst (`playwright.config.ts`).
- **VIA BASH, nie über ein Playwright-MCP** (Lektion: Playwright war im Repo, nicht als
  MCP-Screenshot — das Repo-Werkzeug nutzen).
- **Wann:** prüft, was die node-Suite nicht sieht — Render-Fehler, Console-Errors, Mobil-Overflow.
  Nach jedem UI-/Render-berührenden Schritt (Normtext-Darstellung, Rechtsprechungs-Ansicht).

---

## Screenshots — `scripts/screenshots.ts` (360 / 768 / 1280)

```
npm run preview -- --port 4321 --strictPort        # Server hochfahren (eigener Port)
npx vite-node scripts/screenshots.ts -- --base-url http://localhost:4321 --out <ziel-ordner>
```

- Fotografiert bei **360 / 768 / 1280 px** (`BREITEN`), fullPage, reducedMotion gegen einen
  **laufenden** Server. Kein `*.e2e.ts` — Artefakt-Erzeugung, nicht CI-Test.
- **Wann:** der visuelle Pflicht-Prüfpunkt für **mobil/Lesbarkeit** und für die rein optischen
  Render-Bugklassen in `review.md`, die ein Tor nicht fängt — **text-indent-Clipping** (erste
  Tabellenzeile links abgeschnitten), **verschmolzene Tabellenspalten / verlorene Staffel**,
  Tausendertrenner/Bereichsstrich. Alte Stände loggt das Skript ehrlich als `FEHLT`/
  `AKTION-ÜBERSPRUNGEN` statt zu crashen (§8).

---

## Wörtliche BGE-Zitate — zwei Textschichten im Snapshot (18.9.2026)

- BGE-Snapshots tragen `auszugAbschnitte` (Publikationsfassung, deckungsgleich mit bger.ch) UND
  `abschnitte` (Volltext-Urteil) — mit abweichendem Wortlaut (Beleg BGE 149 I 343: «(LC; BLV 175.11)»
  vs. «(LC; rs/VD 175.11)»). Ein Zitat in Guillemets folgt der Publikationsschicht bzw. bger.ch, nie dem
  Gedächtnis (ein «RSV 175.11» stand in keiner der beiden). Liefert `www.bger.ch` 503, trägt der amtliche
  Zweithost `relevancy.bger.ch/php/clir/http/index.php?highlight_docid=atf%3A%2F%2F<Band>-<Teil>-<Seite>%3A<lang>&lang=<lang>&type=show_document` (per `curl -L`).
- **Tor-Meldung «Text nennt ∅» heisst zuerst «eigener Parser hat nichts erkannt»**, nicht «Quelle falsch»
  (`check:revisionen-rectifies`, VTS `oc/2025/691`, 18.9.2026): vor jedem Ausnahme-Eintrag den amtlichen
  Text öffnen und die Extraktion daran prüfen.

## Weitere offline-Sonden

- **`npm run check:smoke`** — rendert die Ansichten headless durch (Render-Crash-Frühwarnung).
- **`npm run check:sweep`** — Logik-Sweep über die Engines (deterministische Konsistenz).

Beide stecken in `check`; **gezielt** rufen, wenn nur dieser Aspekt verdächtig ist (spart den vollen
`gate`-Lauf während einer Iteration).

---

## Block-Integrität — Klarstellung zu `check:normtext`

**`npm run check:normtext`** prüft die **per-Block-sha-Konsistenz** der Normtext-Snapshots
(`sha` über Text + items, §7 Build-Regel 4/5) — Drift offline, `check:normtext-netz` live. Das ist
**automatisch** über `check`/`gate` und `check:netz` abgedeckt und gehört **NICHT** als eigener,
von Hand zu prüfender Posten in `review.md`. In `review.md` zählen nur die Befunde, die ein Tor
**nicht** fängt (Tabellen-Drop, falsches «aufgehoben», Anker am falschen Erlass, optische Klassen).

---

## Adversariale Gegenprüfung — PFLICHT auf Risiko-Pfaden (§14.4)

Jede **Extraktions-Produktion** (Normtext-Bau, Entscheid-Bau) und jeder **Rechnen-/Norm-Tarif**-
Pfad ist ein Risiko-Pfad. Dort ist die adversariale Gegenprüfung **verpflichtend, nicht auf Abruf**
— sie läuft zum Produktionsabschluss, getrennt vom user-getriggerten `review.md`-Audit.

- **Muster:** unabhängige Sub-Agenten (Fan-out, mehrere Linsen) gegen die Quelle, Ergebnis als
  **Befund-Tabelle mit `Datei:Zeile` + Auflösung** — Vorbild `bibliothek/register/AUDIT-TARIF-2026-06-17.md`
  (z. B. Abschnitt B: richtiger Text unter falschem Erlass-Label gefangen). Konkreter
  Gegentest-Kandidat: der dokumentierte **Tabelle-verloren / Spaltenmerge**-Befund (52 Gesetze +
  22 Kantonstarife, `STRUKTUR.md`).
- **Tor:** das maschinelle `check:gegenpruefung` ist **implementiert und in `npm run check`
  verdrahtet** (CI-ausgenommen; Querschnitt **`QS-GP`** im Querschnitt-Band der `ROADMAP.md`): es
  liest `bibliothek/.gegenpruefung-pending` und geht **nur wenn Risiko-Globs im Diff sind**
  (`scripts/normtext/**`, `public/normtext/*.json`, `src/lib/normtext/**`, `scripts/fedlex-*`, …)
  bei fehlendem Nachweis, Hash-Mismatch oder Verdikt ≠ «bestanden» ROT. **Reine Entscheid-Outputs
  (`public/rechtsprechung/**`) deckt es NICHT** — dort die Pflicht-Gegenprüfung trotzdem fahren und
  nur im §14.5-Trailer quittieren. Quittiert wird über den persönlichen Skill **»gegenpruefung«**
  (der `npm run gegenpruefung:ok` erst bei Verdikt «bestanden» aufruft), nicht als Direktbefehl:
  das Verdikt an den Diff-Hash binden und im §14.5-Commit-Trailer festhalten
  (`Gegenpruefung: <Verdikt> (<Modell>, <Linsen>) — <Befunde>`, bzw. `n/a — reine Prüflogik` bei
  Tor-/Test-Code ohne Inhaltsänderung).
- David-Daueranweisung: **immer Opus**, auch in Sub-Agenten/Workflows (`model:'opus'` explizit
  setzen, sonst Default Haiku).

---

## Fehlerfälle — wenn ein Tor rot ist oder eine Quelle fehlt

Je Fall eine Sofortmassnahme; kein Duplikat der §§ (Details dort).

1. **Gate / vitest rot** → **Diagnoseweg nach §6.5:** nur die **eine** rote vitest-Datei
   einzeln nachfahren (`npx vitest run src/tests/<datei>`), nicht die Suite. Golden-Abweichung über
   `npm run golden:diff -- <id>`. Die drei Dateien der **Eiserne Regel** (oben) bleiben tabu.
2. **`check:fedlex-versionen` Exit 1** (Stand-Drift Bund) → geltende Konsolidierung **neu pinnen**,
   die Zeile in `scripts/fedlex-cache.sh` aktualisieren, Cache neu laden — **nicht aus dem
   Gedächtnis rekonstruieren**. Update-Pfad in `methodology/normtext.md`.
3. **Quelle / OCL nicht erreichbar** (Rechtsprechung) → **Lauf abbrechen statt halben Korpus
   schreiben**; offline über `npm run entscheide:seed -- --datum=$(date +%F)` (Fixtures)
   weiterarbeiten; ehrlicher **§8-Fallback-Status** statt erfundener Werte.
4. **`report:confidence` unter Schwelle** (Kanton) → Confidence-Quarantäne / manueller Pflicht-Review
   (~25–40 % bleiben); kein Snapshot auf «geprüft»/«verified» ohne Davids Abnahme (§8). Unter der
   Schwelle bleibend → ehrlicher PDF-embed-Fallback (Tier C).
5. **SR-Kollision** (Pflicht-Anker/SR-Sonde schlägt an) → Quarantäne; Identität über den Eintrag in
   `ERLASS_REGISTER` (`src/lib/normtext/register.ts`, Feld `fedlexKey`) + die `FEDLEX`-Schlüsselkarte
   in `src/lib/fedlex.ts` klären (Identität ≠ Normtext); erst dann Snapshot.

**Abschluss-Regel:** bei rotem Tor **kein Push, keine Übergabe an `landung`** (§9).
