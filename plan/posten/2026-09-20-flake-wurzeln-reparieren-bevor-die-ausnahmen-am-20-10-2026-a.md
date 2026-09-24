<!-- @posten
dach: QS-CI-MINUTEN
titel: Flake-Wurzeln reparieren, bevor die Ausnahmen am 20.10.2026 ablaufen
anlass: Entscheid David 20.9.2026, PR #948
-->

Neun Browser-Tests werden nur im Wiederholungsversuch grün (Messung 18.–20.9.2026: 46 von 46 Code-Läufen betroffen; uinav-j-rechtsprechung 46/46, w224-r11-reiterleiste 43/46, leser-v3-suche-ohne-gliederung 43/46, leser-v3-blatt 13/46, übrige vereinzelt). Sie stehen befristet bis 20.10.2026 in e2e/flake-ausnahmen.json; der Flacker-Wächter ist seit 22.9.2026 hart. Je Spec die Wurzel MESSEN (Verdacht uinav-j/rechtsprechung: Reiterbreite am Ladezeitpunkt, 201 statt 200 Links — FAHRPLAN-OFFENE-BEFUNDE §4), nicht Ausnahmen verlängern und keine waitForTimeout-Pflaster. Vorrang vor neuem Bau im Feld, sobald die Frist näher als 14 Tage ist.

Umgehängt 24.9.2026 von `W2·18-FEHLERBUCH` nach `QS-CI-MINUTEN` (Bauplan-Konsolidierung M-17, QS-DOKU-DIAET).

**Bündel 24.9.2026** (Bauplan-Konsolidierung M-17, QS-DOKU-DIAET): 6 weitere Posten derselben Sorge sind hier im Wortlaut aufgenommen — Titel, Anlass, alter Dach-Schlüssel und alte Datei je Punkt; die Dateien liegen mit Beleg «gebündelt in …» unter `archiv/posten/`. Nichts gekürzt.

### 1 · Flacker-Fall leser-v3-blatt (c) ⌘K im Split *(Anlass: CI #844, 13.9.2026; isoliert 6/6 grün auf Branch und main; vormals Dach `W2·18-FEHLERBUCH`, `plan/posten/2026-09-13-flacker-fall-leser-v3-blatt-c-k-im-split.md`)*

  - [ ] **Flacker-Fall `leser-v3-blatt` (c) ⌘K im Split** *(CI #844, 13.9.2026; isoliert 6/6 grün auf Branch und main)* — last-/parallelbedingt, deckt sich mit «⌘K-Vorlauf im Split» (CI #711); Fahrplan §4.

### 2 · e2e-Klasse «einmalige count()/Zähler-Lesung direkt nach Klick/URL-Prüfung» *(Anlass: Session-Notizen 2026-09-23; vormals Dach `W2·18-FEHLERBUCH`, `plan/posten/2026-09-23-e2e-klasse-einmalige-count-zaehler-lesung-direkt-nach-klick.md`)*

Sweep über weitere Specs (expect.poll)

### 3 · e2e w224-r11-reiterleiste «inaktive Reiter» lokal auch auf main rot (1 statt 3), CI grün → Umgebungsabhängigkeit *(Anlass: Session-Notizen 2026-09-23; vormals Dach `W2·18-FEHLERBUCH`, `plan/posten/2026-09-23-e2e-w224-r11-reiterleiste-inaktive-reiter-lokal-auch-auf-mai.md`)*

e2e w224-r11-reiterleiste «inaktive Reiter» lokal auch auf main rot (1 statt 3), CI grün → Umgebungsabhängigkeit

### 4 · Fehlerbuch fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md: Befund 14.9. + Messung 20.9. zu rechtsprechung-Flackern → Wurzeln/Streichung (#994) nachtragen *(Anlass: Session-Notizen 2026-09-23; vormals Dach `W2·18-FEHLERBUCH`, `plan/posten/2026-09-23-fehlerbuch-fahrplaene-fahrplan-offene-befunde-md-befund-14-9.md`)*

Fehlerbuch fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md: Befund 14.9. + Messung 20.9. zu rechtsprechung-Flackern → Wurzeln/Streichung (#994) nachtragen

### 5 · e2e w224-r11 :764 Mappe speichern/öffnen: Rechner-Reiter mit Query statt ohne *(Anlass: Session-Notizen 2026-09-24 W2·29-MARKE; vormals Dach `W2·18-FEHLERBUCH`, `plan/posten/2026-09-24-e2e-w224-r11-764-mappe-speichern-oeffnen-rechner-reiter-mit.md`)*

Lokal 24.9.2026 1× rot, 1× grün (CI grün): nach «speichern → alle schliessen → öffnen» stand /rechner/zpo-fristen mit Formular-Query (?e=2025-01-15&u=tage…) statt ohne im Speicher. Rennen zwischen Rechner-URL-Sync und Mappen-Schnappschuss? Wurzel messen, nicht Ausnahme eintragen.

### 6 · FRIST 22.9.2026: Flacker-Wächter wird automatisch hart *(Anlass: Session 20.9.2026, Prozess-Messung; vormals Dach `QS-CI-MINUTEN`, `plan/posten/2026-09-20-frist-22-9-2026-flacker-waechter-wird-automatisch-hart.md`)*

Der Melde-Modus in `e2e/flake-modus.json` endet am 22.9.2026; danach ist der Flacker-Wächter hart. Die verwaiste Übergabe `.claude/notizen/2026-09-19-org-umzug-uebergabe.md` im Haupt-Checkout nennt das DRINGEND, aber keine Session hat sie übernommen. Vor dem Stichtag die offenen Flake-Specs sichten.

**Nachzug 24.9.2026** (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET): 12 Fahrplan-Einträge derselben Sorge sind hier im Wortlaut aufgenommen; im Fahrplan steht an ihrer Stelle je ein Zeiger hierher. Nichts gekürzt.

### 7 · DIAGNOSE · e2e-Flake suche-seite.e2e.ts («Deep-Link ?q=Miete … ungekappt») *(aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md`, §4, vormals Z. 194)*

- [ ] **DIAGNOSE · e2e-Flake `suche-seite.e2e.ts` («Deep-Link ?q=Miete … ungekappt»)** *(Agent-Befund 31.8.2026, Volllauf zu PR #587)* — `expect.poll` auf >6 Treffer erhielt 0 (Timeout 10 s). Messbedingung (F3): 1× rot im Volllauf 663 Tests/5 Worker/KALT; isoliert 5/5 grün; unter warmer Last 30/30 grün (`--repeat-each=6 --workers=6`). Nicht reproduziert unter Warm-Last — Kalt-/Erstlauf-Verdacht (Familie F2g/⌘K-Wächter). Erst Verteilung messen, dann Fix; nichts «umschiffen». **Messpunkte 2 (31.8.2026, Branch feat/w213-kantone, Maschine unter Agenten-Last):** Volllauf 5 Worker → 3 rot (Deep-Link 0 Treffer · «alle N»-Option nicht sichtbar · V5-CLS 0.0006 statt 0 — zwei NEUE Signaturen derselben Familie, alle drei laden den 17,7-MB-Suchindex bzw. throtteln CPU); Wiederholung 5 Worker/3× → 1 rot (Deep-Link); isoliert 2 Worker/6× + 1 Worker/3× → 9/9 grün. Verdachtsverdichtung: Ressourcen-Kontention beim Erstladen des Client-Index, nicht datenabhängig (Diff berührt artikelVolltext nicht). **Messpunkt 3 (31.8., dritter Volllauf nach main-Einzug Test-Diät):** wieder genau 1 rot, wieder ANDERE Signatur (`international-kanonik-ia6` Deep-Link-Scroll, viewport ratio 0); isoliert 33/33 grün. Vier Vollläufe, vier verschiedene Einzel-Signaturen, alle isoliert grün — die Familie ist Erstlade-/Scroll-Timing unter Parallel-Last, nicht testspezifisch. **Messpunkt 4 (31.8., Design-Branch, zwei Vollläufe):** je 2–3 rot aus derselben Familie (Deep-Link-0, «alle N», leser-position-CLS byte-identisch 0.0506, leser-kopf-cls 0.060); ALLE isoliert grün (5/5, 6/6, 8/8, 5/5). Muster stabil: jeder Volllauf unter Last wirft 1–3 Familienmitglieder, isoliert nie reproduzierbar.

### 8 · druck-fundstellen-z2 flakt NUR auf CI-Runnern *(aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md`, §4, vormals Z. 206)*

  - [ ] **druck-fundstellen-z2 flakt NUR auf CI-Runnern** *(CI-Forensik 14.8.: 10 Vorkommen/30 Tage; lokal 11/11 sauber bei 19,8 s gegen 30-s-Budget — braucht Runner-Messung, kein lokaler Fix; blosses Budget-Hochsetzen ohne Messreihe bleibt ausgeschlossen.)*

### 9 · Alt-Flake qsui-hierarchie.e2e.ts (Vorlagen-Block, ~25 %/Fall, Nullprobe-belegt 25/84 auf main) *(aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md`, §4, vormals Z. 213)*

  - [ ] **Alt-Flake `qsui-hierarchie.e2e.ts` (Vorlagen-Block, ~25 %/Fall, Nullprobe-belegt 25/84 auf main):** Wurzel-Fix mit Mandat; Familie + Zahlen im a33-Dossier-Nachtrag (PR #480).

### 10 · Alt-Flake leser-weiterlesen-r4-r8 (Shard-Kontext, vorbestehend, Befund 9.8.2026) *(aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md`, §4, vormals Z. 214)*

  - [ ] **Alt-Flake `leser-weiterlesen-r4-r8` (Shard-Kontext, vorbestehend, Befund 9.8.2026):** gleiche Familie; Wurzel-Fix mit Mandat, Messbedingung protokollieren.

### 11 · Alt-Flake leser-ohne-gliederungslinie.e2e.ts:71 (OR Art. 319, Befund 16.8.2026, Vorprobe LESER-V3) *(aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md`, §4, vormals Z. 215)*

  - [ ] **Alt-Flake `leser-ohne-gliederungslinie.e2e.ts:71` (OR Art. 319, Befund 16.8.2026, Vorprobe LESER-V3):** 20-s-Timeout auf `getByRole('button', {name:'Ansicht'})`. Nullprobe-belegt auf `main` — **Flag aus** 1/3 rot, Flag an 2/5 rot, gepoolt 3/8 ≈ 38 %; Messbedingung lokal/warm/5 Worker/60 Tests im Lauf, isoliert 0/1 rot. Gleiche Familie wie oben; die Wurzel ist in `e2e/shard-gruppen.json` bereits benannt («zweiter schwerer OR-Reader je Chromium-Worker») und weiterhin ungefixt. CI unauffällig (`workers:1`, 90 s, `retries:2`) — der Preis fällt lokal an. Wurzel-Fix mit Mandat, nicht per Timeout maskieren. Zahlen: `docs/ux-audit-2026-07/reader/leser-v3-vorprobe.md`.

### 12 · Flake-Beobachtung 14.8.2026 (Voll-Suite, isoliert grün) *(aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md`, §4, vormals Z. 216)*

  - [ ] **Flake-Beobachtung 14.8.2026 (Voll-Suite, isoliert grün):** `gesetze-historie-badge` Lade-CLS-Budget (§15-Messrauschen unter Last) + `leser-kontext-e4` Deeplink — je 1× rot bei 539 grün, Wiederholung 8/8 grün; bei Wiederkehr zur CLS-/Leser-Flake-Familie schlagen.

### 13 · Tor gegen die Flake-Familie «einmaliges DOM-Lesen ohne Wartung» *(aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md`, §4, vormals Z. 222)*

  - [ ] **Tor gegen die Flake-Familie «einmaliges DOM-Lesen ohne Wartung»** (`boundingBox()!`, ungewartete Einzel-Lesungen in `page.evaluate`): vier belegte Fälle, je ein Diagnose-Zyklus Kosten; einmal rot zeigen (§6.7).

### 14 · Flake-Sammlung 5.9.2026 (je 1 failed, Retry grün) *(aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md`, §4, vormals Z. 238)*

- [ ] **Flake-Sammlung 5.9.2026 (je 1 failed, Retry grün):** `gesetze-ia-v2-walks:65` (#691/#711), `split-erwaegungssprung.e2e.ts:47` ⧉-Pane auf Erwägung, `tastatur.e2e.ts:81` Skip-Link (#715), `leser-v3-blatt:105` ⌘K-Split — alle Hydration-/Timing-Klasse; nach der 60-s-Härtung Rate neu messen (`zaehleFlakySpecs` in der Selbstopt-Zeitreihe). **Nachtrag 20.9.2026:** Selbstopt-Zeitreihe entfallen (retro:17-Rückbau); Nachmessung über `npm run tor:bewaehrung`.

### 15 · ⌘K-Vorlauf im Split *(aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md`, §4, vormals Z. 240)*

- [ ] **⌘K-Vorlauf im Split** (CI #711, `leser-v3-blatt.e2e.ts:105` flaky) — Verdacht Nebenwirkung von #682 (vor Hydration löst der Vorlauf in der Kopf-Suche aus, nicht im fokussierten Pane); bei Wiederholung `fruehesSuchKuerzel.ts`: Vorlauf nur einlösen, wenn kein Pane-Fokus.

### 16 · Flacker-Fall leser-v3-blatt (c), gemessen 13.9.2026 *(aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md`, §4, vormals Z. 241)*

- [ ] **Flacker-Fall leser-v3-blatt (c), gemessen 13.9.2026** — CI-Rot Shard 1/4 (Lauf 34783413401) auf PR #844, «(c) im Split trifft das Kürzel nie das fremde Pane»: 1× rot, Retry grün («Fokus stand im Pane «sekundaer», ⌘K landete woanders»). Nullprobe: isoliert (`--repeat-each=6`, 5 Worker, `dist`) auf Branch `feat/w2-18-reiterleiste-teil3` (c020885a5) 6/6 grün, auf `origin/main` (ae63949d3) ebenfalls 6/6 grün — Fall lässt sich isoliert nicht reproduzieren, weder mit noch ohne Welle-2/3-Code. Deckt sich mit der bereits offenen Zeile «⌘K-Vorlauf im Split» oben (dieselbe Spec/Zeile, seit CI #711) — Klasse Last-/Parallel-bedingt (4 Shards gleichzeitig in CI), kein Beleg für eine Welle-2/3-Ursache. Nicht gefixt; Wurzel bleibt bei der bestehenden Zeile offen.

### 17 · Flackernde Browser-Tests, Wurzel messen *(aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md`, §4, vormals Z. 244–267)*

- [ ] **Flackernde Browser-Tests, Wurzel messen** *(Fund des neuen Flacker-Wächters, Lauf 34231123731, 8.9.2026; Ausnahmen in `e2e/flake-ausnahmen.json` bis 8.10.2026)* — `leser-r1-r2.e2e.ts` «Ohne aktive Suche kein Zähler …» und `w224-reiterverhalten.e2e.ts` «(d) ⌘/Ctrl+Enter öffnet neuen Reiter» wurden nur im Wiederholungsversuch grün. Wurzel je Spec messen (Timing/Race, nicht «retry»), dann Ausnahme streichen; verfällt die Ausnahme ungemessen, wird der Wächter rot. Klasse wie «E2E-Flake Shard 2/8 — Wurzel messen statt neu starten».

  **Nachtrag 8.9.2026 (Messung Orchestrator, drei Wächter-Läufe im eigenen PR #779):** die Browser-Suite flackert breit — 6 verschiedene Specs nur im Retry grün, je Lauf andere: `leser-r1-r2.e2e.ts`, `w224-reiterverhalten.e2e.ts`, `leser-v3-blatt.e2e.ts`, `leser-v3-suche-ohne-gliederung.e2e.ts`, `w224-r11-reiterleiste.e2e.ts`, `leser-v3-panel-zaehler.e2e.ts`. Ein harter Wächter mit Ausnahmeliste kann so nicht landen, ohne dass die Liste jeden Lauf wächst. **Entscheid (abweichend von «sofort rot», offengelegt):** Melde-Modus über `e2e/flake-modus.json` — bis dahin nur `::warning`/Exit 0, danach hart wie oben. **Stichtag hart 22.9.2026.** Auftrag: Wurzel je Spec messen (Race/Timing), nicht Ausnahmen sammeln.

  **Nachtrag 19.9.2026 (PR #917, Lauf 35445618485) — Spur mit fester Zeichenzahl:**
  `e2e/leser-r1-r2.e2e.ts:420` (S8 «Normtext-DOM unverändert») war im PR-Lauf **auch im
  automatischen Retry rot**; `gh run rerun --failed` lief danach grün. Die verglichene
  DOM-Signatur weicht in vielen Artikeln um **genau +27 Zeichen** ab — art-2 2989→3016,
  art-7 1006→1033, art-8 1154→1181, art-10_a 444→471, art-12 1819→1846, art-15 625→652.
  Ein konstanter Betrag über verschiedene Artikel ist kein Timing-Zufall, sondern ein
  nachladendes Element fester Länge in Artikeln mit einem gemeinsamen Merkmal; naheliegend
  ist, dass der Test den `vorher`-Wert nimmt, bevor dieses Element steht. **Das ist eine
  Hypothese, kein Beleg** — das Merkmal ist nicht bestimmt und das Element nicht benannt.
  Zwei weitere Specs waren im selben Lauf nur im Retry grün: `e2e/rechtsprechung.e2e.ts:107`
  und `e2e/uinav-j-rechtsprechung.e2e.ts:30`.
  **Warum das seit 19.9.2026 schwerer wiegt:** unter der Merge-Queue prüft jeder Eintrag alle
  vier Required-Checks noch einmal; ein Flake wirft den Eintrag aus der Warteschlange und
  lässt die Nachfolger neu bauen — der Schaden ist nicht mehr ein Retry, sondern eine Kette.

  **Wurzel gefunden 19.9.2026 — `leser-r1-r2.e2e.ts` «Ohne aktive Suche kein Zähler …» (1 von 2 Ausnahmen erledigt).** Anlass: der Fall fiel am 19.9.2026 zweimal HART (auch im Retry rot) — Läufe 35445618485 (PR #917) und 35446174293 (PR #920), je Shard 4/4; seit der Merge-Queue wirft ein solcher Fehlschlag Queue-Einträge und baut Nachfolger neu.
  *Befund, gemessen:* in genau sechs Artikeln wuchs die Wortlaut-Signatur um exakt 27 Zeichen (art-2 2989→3016 · art-7 1006→1033 · art-8 1154→1181 · art-10_a 444→471 · art-12 1819→1846 · art-15 625→652 — byte-gleich mit dem CI-Log). Der Zusatz ist «FassungGilt seit TT.MM.JJJJ» aus `ArtikelHistorieZeile` (`src/pages/gesetz-leser/parts/ArtikelHistorie.tsx`) im Druck-Wrapper `[data-hist-druck]` (`src/pages/gesetz-leser/parts/ArtikelLeser.tsx`, `hidden print:block`). Betroffen ist genau die Artikelmenge mit Eintrag in `public/normtext/historie/BGFA.json`; der Shard wird idle geladen und trifft auf einem langsamen Runner erst NACH der `vorher`-Messung ein.
  *Urteil: TEST-Fehler, kein App-Defekt.* Der Wrapper ist am Bildschirm in jeder Vermerke-Stellung `display:none`, und der Such-Walker der App überspringt nicht gerenderte Teilbäume ohnehin (`istGerendert`, `src/pages/gesetz-leser/suchHighlight.ts`) — dort wird nie gemalt, gezählt oder hingesprungen. Die Signatur des Tests war als einzige der drei Walker-Stellen ohne `display:none`-Regel und mass damit eine Fläche, die die Suche gar nicht erreichen kann.
  *Fix:* `signatur()` schneidet `display:none`-Teilbäume ab — dieselbe Regel, die `malbareFundstellen` in derselben Datei und `istGerendert` in der App schon führen. Kein `waitForTimeout`, kein angehobenes Budget, Aussage unverändert scharf.
  *Belege:* Rot vor dem Fix — echte Rückstands-Mutation in `setzeSuchHighlightRanges` (Textknoten beim Abräumen der Suche), geschärfter Test rot mit art-2 1610→1621, Exit 1. Die CI-Reihenfolge lokal deterministisch nachgestellt (Historie-Shard bis nach der `vorher`-Messung angehalten, 6× CPU-Drossel): alte Signatur divergiert byte-gleich mit dem CI-Log, neue bleibt konstant. Grün nach dem Fix: 20/20 Wiederholungen des Falls, 20/20 unter Drossel + angehaltenem Shard, volle Spec 11/11. Ausnahme in `e2e/flake-ausnahmen.json` gestrichen (nur diese eine; `w224-reiterverhalten.e2e.ts` bleibt offen).

### 18 · E2E-Flake Shard 2/8 — Wurzel messen statt neu starten *(aus `fahrplaene/FAHRPLAN-BASIS-AUSBAU.md`, §2, Restposten aus ROADMAP.md, vormals Z. 195)*

  - [ ] **E2E-Flake Shard 2/8 — Wurzel messen statt neu starten** *(Befund QS-FREMDAGENTEN, Session 4.9.2026)* — Befund-Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (5); Bau-Einheit offen, Zeiger genügt zur Steuerung.
