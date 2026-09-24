# ROADMAP — Erledigt-Chronik (Detail-Archiv erledigter Schritte)

## Ablösung 22.9.2026 (Werkbank-Umbau) — `W2·11-DESIGN` (Design-Wärme) gestrichen (Wortlaut)

**Begründung der Streichung.** Davids Go zum Werkbank-Umbau (22.9.2026, «go») nach dem Rats-Verdikt desselben Tages macht den Schritt gegenstandslos: `W2·11-DESIGN` war der Ausbau der Brass-Wärme auf der bestehenden Token-Schicht; der Umbau tauscht genau diese Token-Schicht gegen `tokens.json` des Werkbank-Design-Systems aus (`W2·29-WERKBANK-TOKENS`, Auflage 2 «eine Token-Quelle»). Ein Ausbau dessen, was im selben Zug ersetzt wird, ist kein offener Schritt, sondern doppelte Arbeit. Bereits am 5.9.2026 hatte `FAHRPLAN-DESIGN-IDENTITAET.md` §4 festgehalten, dass die Design-Identität `W2·11-DESIGN` «inhaltlich ablöst» — diese Streichung vollzieht das. Der Fahrplan ist nach `archiv/FAHRPLAN-DESIGN-WAERME.md` verschoben (Dateiname unverändert, Index-Zeile in `archiv/README.md`); seine sechs offenen Posten hängen seit heute unter `W2·29-WERKBANK-TOKENS` (D-6 Dunkel-Paket, D-7 Lese-Register), `W2·29-WERKBANK-REST` (D-8a/b/c) und `W2·29-WERKBANK-LESER` (Qualitäts-Pass Gesetzes-Bereich). Die gemessenen Kontrast- und Token-Belege der Wellen D-1 bis D-5 (`abnahme/design-waerme/**`, `abnahme/design-d5/**`, `DESIGN-REGLEMENT.md` F2b-Nachträge) bleiben unverändert stehen — sie sind datierte Belege und werden nicht nachgeführt.

Wortlaut des gestrichenen Schrittes:

- [ ] **Design-Wärme & Atmosphäre** *(`W2·11-DESIGN`, Ultracode-Synthese 11.7., reine Token-Schicht)*
  <!-- @meta id: W2·11-DESIGN · status: parked · blocker: zielbild-gesetzesleser · dep: [] · feld: design · fahrplan: fahrplaene/FAHRPLAN-DESIGN-WAERME.md -->
  Farbklima/Wärme/Typografie nach §13; Normtext-Körper bleibt farbfrei, golden byte-gleich.
  **Detail:** [FAHRPLAN-DESIGN-WAERME.md](fahrplaene/FAHRPLAN-DESIGN-WAERME.md) §5.


## Umschichtung 18.9.2026 (Leser-Mitlaufen) — drei erledigte Unterpunkte von `W2·5m-LESER-V3` (Wortlaut)

**Anlass.** Steuerdeckel ROADMAP (132 KB bei 120 KB Budget, gelb) nach der Buchung der Session 18.9.2026 (3). Der Dach-Schritt `W2·5m-LESER-V3` bleibt offen (Auf/Zu-Handling, Einzelartikel E3, Fassungs-Diff-Tab); nur die drei erledigten Unterpunkte wandern hierher, die ROADMAP trägt eine Zeiger-Zeile. Wortlaut unverändert:

- [x] **Mitlaufen beim Lesen** — ✅ 18.9.2026. Marke und Baum-Akkordeon lagen in **einem** 200-ms-Trailing-Timer, den jeder Artikelwechsel neu ansetzt; beim Lesen kommen die Artikelgrenzen schneller ⇒ der Timer verhungerte, `setAktivIds` lief **nie** (gemessen: 27 Artikelwechsel → 27 Neuansetzungen, `anwenden` lief 1×). `setAktivIds` aus dem entprellten Closure gelöst (`inhalt-hooks.tsx`), Akkordeon + Ruhe-Tor unverändert. Prod-Build: erste Marke **3891 → 88 ms** (Gegenprüfung unabhängig 57 ms; BV 52 ms), Proben ohne Marke **76/113 → 0/114**, distinkte Etiketten **3 → 11**. Wächter `e2e/leser-marke-mitlaufen.e2e.ts` mit Rot-Beweis (§6.7).
- [x] **Standort-Fläche war ein Fehlalarm** — die `brass-100`-Fläche (1,03–1,13:1) ist **nicht** das tragende Signal; der Standort-Strich ist ein Geschwister-`<span>` (`w-[3px] bg-brass-600`, Radius 0), gemessen **8,26:1 hell / 10,62:1 dunkel** gegen `--paper`, bei 1440 px und 390 px gleich. Design-Handschrift Nr. 4/7 bereits erfüllt, seit PR #894 (`fb0ab0249`). Kein Token-Entscheid nötig — Zeile geschlossen (§17 Gegengewicht: keine Zutat ohne Mangel).
- [x] **Wächter `leser-marke-mitlaufen` geschärft** — ✅ 18.9.2026. Die alten Schranken liessen einen **Halb-Fix durch** (konstruierte 120-ms-Trailing-Debounce bestand alle drei Proben). Blosses Senken der ms-Schranke war **nicht** der Weg: die Weite ist begründet (2-vCPU-Runner, reflow-schwerste Seite) und hätte Lücke gegen Flakiness getauscht. Neue vierte Probe misst **Rückstand in Gliederungs-Einträgen statt Millisekunden**: SOLL = letzter Eintrag, dessen Abschnitt bei/vor dem Artikel an der Bezugslinie beginnt (unabhängig aus `a[href^="#art-"]` + DOM-Artikelfolge abgeleitet, **nicht** aus der bewachten Marke), IST = Eintrag mit `[data-toc-aktiv]`. Eine Ordnungszahl hat keine Einheit — ein langsamerer Runner schiebt SOLL und IST gemeinsam, die Probe wird milder statt flackrig. Schranken auf **Anteilen** (≥ 90 % treu, ≤ 5 % der Proben ≥ 2 Einträge zurück), plus Selbstschutz `visibilityState === 'visible'` und `distinktSoll ≥ 5`. Beweise: rot gegen den Original-Defekt (**0/40** treu), rot gegen den 120-ms-Halb-Fix bei `--workers=1` = CI-Bedingung (**9/40**, 3 von 3 Läufen), 3× grün, gedrosselt 6×/10× grün.


## Umschichtung 15.9.2026 (dep-Umbau) — drei erledigte Schritte mit lebenden `dep`-Kanten (Wortlaut)

**Anlass und was sich geändert hat.** Bis heute mussten erledigte Schritte in `ROADMAP.md` stehen bleiben, sobald irgendein lebender Schritt `dep` auf sie hielt: `check:plan` Regel 4 («dep-IDs existieren») kannte nur `ROADMAP.md` und hätte die Überführung rot gemacht. Der Steuerdeckel (120 KiB) liess sich damit nur noch senken, indem man entweder die `dep`-Kante fälscht oder den Deckel reisst — beides macht den Plan unwahr. Die Umschichtung 15.9.2026 (Entstehung) weiter unten hat darum die PROSA ausgelagert und die Anker bewusst stehen lassen («Anker bleiben wegen `dep`»); dieser Abschnitt zieht sie nach, nachdem der Wurzel-Fix gebaut ist (Schritt `QS-EFFIZIENZ`, PR dieser Session): Regel 4 akzeptiert ein `dep`-Ziel, das hier als `done` archiviert ist, und `plan:next`/`plan:bild`/`plan:set` lösen mit derselben Menge auf. Der frühere Vermerk bleibt als Beleg seines Datums stehen und wird nicht nachgeführt.

Damit hängt die Auflösung an DIESEN Ankern — sie sind ab hier die einzige Fundstelle der drei IDs und dürfen nicht entfernt werden, solange ein lebender Schritt auf sie zeigt (`R12a-ENTSTEHUNG-BS` → `W2·6c-ENTSTEHUNG-SYNOPSE`). Wortlaut der Erledigt-Prosa je Schritt: Abschnitt «Umschichtung 15.9.2026 (Entstehung)».

- [x] **Entstehung am Artikel — Daten: Verfahrens-Ereignisse, Historie-Kopf, Botschafts-Keys, Anker, Parlament** *(`W2·6c-ENTSTEHUNG-DATEN`, §14-Intake 6.9.2026, Design-Freigabe David 6.9.2026)*
  <!-- @meta id: W2·6c-ENTSTEHUNG-DATEN · status: done · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md -->
  ✅ Erledigt 11.9.2026 — Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 15.9.2026 (Entstehung).

- [x] **Entstehung am Artikel — Synopse alt/neu ab 2021 und Entwurf↔Beschluss** *(`W2·6c-ENTSTEHUNG-SYNOPSE`, 6.9.2026; absorbiert den Datenanteil von M16)*
  <!-- @meta id: W2·6c-ENTSTEHUNG-SYNOPSE · status: done · blocker: null · dep: [W2·6c-ENTSTEHUNG-DATEN] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md -->
  ✅ Erledigt 11.9.2026 — Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 15.9.2026 (Entstehung).

- [x] **Drift-Nachverifikation der Tarif-Stammdaten (34 Erlasse, 93 Einträge)** *(`W3-TARIF-NACHVERIFIKATION`, Auftrag David 6.9.2026, Befund Tor-Erstlauf `check:tarif-drift`)*
  <!-- @meta id: W3-TARIF-NACHVERIFIKATION · status: done · blocker: null · dep: [] · feld: werkzeuge -->
  ✅ Erledigt — Wortlaut der Erledigt-Prosa: ROADMAP-CHRONIK.md, Umschichtung 15.9.2026 (Entstehung).


## Umschichtung 15.9.2026 (Entstehung) — Erledigt-Prosa `W2·6c-ENTSTEHUNG-DATEN` + `-SYNOPSE` (Wortlaut), Anker bleiben wegen `dep`

**Anlass.** Steuerdeckel ROADMAP 120 KB bei der Verankerung der Stufe-4-Schritte `W2·6d-*` (Session 15.9.2026 (3)). Die beiden Schritte sind seit 11.9.2026 `done`; ihre Titel- und `@meta`-Zeilen bleiben in der ROADMAP, weil lebende Schritte (`R12a-ENTSTEHUNG-BS`) `dep` auf sie halten (Befund ROADMAP «ROADMAP-Deckel bleibt knapp»). Hier der Wortlaut der ausgelagerten Prosa:

### **Entstehung am Artikel — Daten: Verfahrens-Ereignisse, Historie-Kopf, Botschafts-Keys, Anker, Parlament** *(`W2·6c-ENTSTEHUNG-DATEN`, §14-Intake 6.9.2026, Design-Freigabe David 6.9.2026)*

  Ziel: die Fassungskette je Artikel (liegt als G-HIST-Shard vor) mit der Verfahrenskette der Vorlage
  (Fedlex-Projektgraph, Curia Vista) und der Botschaft verbinden — ohne zweiten Parser, ohne Volltext,
  ohne Personendaten. Grenzen: Bund zuerst; Historie-Generator und -Shard bleiben unangetastet; Curia
  nur aggregiert, Monatslauf statt Gate-Kette. Etappen E1, E2, E4. **Bau erst auf Davids Go.**
  **Detail:** [FAHRPLAN-MATERIALIEN-VERZAHNUNG.md](fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md) §11.

### **Entstehung am Artikel — Synopse alt/neu ab 2021 und Entwurf↔Beschluss** *(`W2·6c-ENTSTEHUNG-SYNOPSE`, 6.9.2026; absorbiert den Datenanteil von M16)*

  Diff zweier Fedlex-Konsolidierungen je Artikel (HTML nur ab Stand 1.1.2021), gespeichert wird nur der
  Alt-Block als §7-Zitat mit Deckel 8 MB / 2 MB je Erlass; Vor-Messung E5.0 vor dem Bau. Etappen E5.0, E5, E6.
  **Detail:** [FAHRPLAN-MATERIALIEN-VERZAHNUNG.md](fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md) §11.

### **Drift-Nachverifikation der Tarif-Stammdaten (34 Erlasse, 93 Einträge)** *(`W3-TARIF-NACHVERIFIKATION`, Auftrag David 6.9.2026, Befund Tor-Erstlauf `check:tarif-drift`)*

*(Begründung: 4,0 KB erledigte Prosa im Werkzeuge-Feld; Titel und `@meta`-Anker bleiben in der ROADMAP.)*

  ✅ Gelandet 8.9.2026 (PR #764, Gegenprüfung bestanden) — Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (6). Ziel/Grenzen/Belegkette wörtlich: ROADMAP-CHRONIK.md, Umschichtung 8.9.2026 (Landung). Offene Folgeschritte unten.
  - [ ] **OW Beurkundungstarif Ziff. 35 lit. a/b — Zuordnungsverdacht** *(Nebenfund 6.9.2026)* — `beurkundung.ts` (OW) etikettiert die Staffel als lit. a; amtlich ist lit. a ein Rahmen 500–2000, und erst lit. b verweist auf Ziff. 31 Bst. a. Kodiert ist lit. b. Eigener Prüfschritt: Wert und Etikett zusammenführen.
  - [ ] **VS LTar Art. 15 — zwei Einträge, dieselbe Norm, verschiedene Begründung** *(§5, 6.9.2026)* — `schlichtung.ts` (50–500) und `nicht-vermoegensrechtlich.ts` (60–500) berufen sich beide auf Art. 15 mit demselben Hinweis-Baustein; amtlich sind Abs. 1 lit. a/b (170–350) und Abs. 2 (60–500) verschiedene Tatbestände. Klären, welcher Absatz je Rechner gilt, dann EINE Quelle.
  - [ ] **Härtungen `check:tarif-drift`** *(Wurzelbefunde 6.9.2026, je mit Rot-Beweis; `scripts/tarif/**` ist Risikopfad)* — (a) zeigen `artikel` und `quelleUrl` auf verschiedene Erlasse, urteilt das Tor über den falschen (belegt AG 725.100/725.110, SH 221.101/211.433) ⇒ «unklar/Zuordnung» statt DRIFT; (b) pinnt die URL die geltende Fassung, bleibt ein uralter `stand` unsichtbar (11 FR-261.16-Einträge trugen «7.10.1986» bei Pin auf 2016) ⇒ Zusatzbefund «Pin aktuell, stand > 1 Jahr daneben»; (c) 13 Einträge nannten das Beschlussdatum GENAU DIESER Fassung (FR 214.5.16, BS 154.810) ⇒ als gültigen Stand akzeptieren.
  - [x] **Werkzeug-Falle Norm-PDFs** *(✅ #895 15.9.2026; 6.9.2026, gehört ins Fehlerbuch-Dach `W2·18-FEHLERBUCH`)* — `Read` auf PDF > 200 KB blockt `lese-schutz.py`, `pdftotext` fehlt auf dieser Maschine; funktionierender Ersatz: PyMuPDF (`python3 -c "import fitz; …"`).
  - [x] **Werkzeug-Falle Lese-Schutz im Scratchpad** *(✅ #895; 15.9.2026)* — `lese-schutz.py` blockt PDF > 200 KB auch im Scratchpad, Hinweis auf PyMuPDF fehlt; Hook-Edit ⇒ Diff für David. Detail: Fahrplan Materialien §12.5.
  - [ ] **Konflations-Wächter breiter** *(Gegenprüfungs-Nachtrag D2, 12.9.2026, PR #816, gehört ins Fehlerbuch-Dach `W2·18-FEHLERBUCH`)* — Befund-Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (5); Bau-Einheit offen, Zeiger genügt zur Steuerung.
  - [ ] **`BMV`-Zitat löst auf die aufgehobene Fassung auf** *(Nebenfund PR #823, 12.9.2026, gehört ins Fehlerbuch-Dach `W2·18-FEHLERBUCH`)* — Befund-Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (5); Bau-Einheit offen, Zeiger genügt zur Steuerung.
  - [ ] **Prerender-Shell nennt aufgehobene Erlasse «geltend»** *(Nebenfund PR #823, 12.9.2026, gehört ins Fehlerbuch-Dach `W2·18-FEHLERBUCH`)* — Befund-Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (5); Bau-Einheit offen, Zeiger genügt zur Steuerung.
  - [ ] **Tabellen-`<dt>`-Marken «–»/[tab] als Aufzählungsmarken extrahiert** *(Nebenfund PR #836, 12.9.2026, gehört ins Fehlerbuch-Dach `W2·18-FEHLERBUCH`)* — betrifft ZPO art_250, StG art_5 f., BV art_197: Extraktions-Altlast, bei der `extrahiere-fedlex.ts` Tabellen-`<dt>`-Zellen wie Aufzählungs-`<dt>` behandelt und ihnen fälschlich eine Aufzählungsmarke zuweist. Fix im Extraktor — Tabellen-`<dt>` von Aufzählungs-`<dt>` trennen —, nie in den Daten selbst geflickt (§5).
  - [ ] **216 Struktur-Sidecars ohne `stand`/`fassungsToken`** *(Nebenfund PR #836, 12.9.2026, gehört ins Fehlerbuch-Dach `W2·18-FEHLERBUCH`)* — additiver Alt-Rollout aus #824: nur die 12 Sidecars aus #838 tragen die Felder bereits, die übrigen 216 noch nicht. Eigener Regenerations-Schritt aus dem Cache mit Skelett-Nullprobe, kein Inhaltsdiff erwartet.
  - [ ] **Test-Budget `scripts/datenhaltung/suche.test.ts`** *(Messung 6.9.2026 zum bekannten Wurzel-Fix-Kandidaten)* — der `beforeAll` baut den ganzen Suchindex bei 95 s Budget. Seriell je ein Lauf: sauberer `main` 91.79 s grün (3 s Luft), Worktree kalt 119.72 s rot, warm 43.28 s grün. Ausschlag ist kalt/warm, nicht Inhalt (+0.07 % Korpus). Fixture verkleinern oder Budget an die kalte Messung binden.

## Umschichtung 15.9.2026 (1) — `W2·5m-LESER-V3`: vier gebaute, nie abgehakte Checklisten-Posten (Wortlaut) + Auflösung der S4-Begriffskollision

**Anlass.** Auftrag David 15.9.2026: «bereinige die Checkliste und überprüfe, warum es nicht
abgehakt wurde». Die Verifikation (je Posten Fahrplan/Chronik + Code/Test + `git log`) ergab:
**alle vier offenen Posten waren gebaut** — D0 seit 16.8.2026, S1 und S2 seit 17.8.2026, die
Kantons-Probe seit 18.8.2026. Sie standen vier Wochen lang falsch offen.

**Ursache, je Posten mechanisch belegt — vier verschiedene Wege zu demselben Ergebnis:**

| Posten | Bau | Was mit der ROADMAP-Zeile geschah |
|---|---|---|
| **D0** | PR #534, `47f805423`, 16.8.2026 | Der Bau-PR hakte ab — aber die **andere** Zeile. `DESIGN-D0` stand doppelt im Plan: einmal im Design-Dach (dort `- [x]` gesetzt, am 29.8. mit #577 in die Chronik ausgelagert, s. Abschnitt «Plan-Neuschnitt 29.8.2026») und einmal als Vorbedingungs-Kopie unter `W2·5m-LESER-V3`. Die Kopie blieb stehen. Zwei Zeilen für einen Sachverhalt (§5). |
| **S1** | PR #547, `2538dd356`, 17.8.2026 | Der Bau-PR **hat** ROADMAP.md angefasst — aber nur, um drei NEUE §17-Funde einzutragen (Nullprobe-Messreihe, Reader-Kopf-Reflow, `QS-DATA-INGEST-DRIFT`). Die eigene Checkbox blieb unberührt: Nebenfunde wurden gebucht, der Vollzug nicht. |
| **S2** | PR #550, `afc008c19`, 17.8.2026 | Der Bau-PR fasste ROADMAP.md **gar nicht** an, nur `fahrplaene/FAHRPLAN-LESER-V3.md` — dort steht seit dem 17.8.2026 «**S2** ✅ **gebaut**». Der Fahrplan wurde geführt, der Plan nicht: zwei Wahrheiten (§5), und kein Tor las beide. |
| **S4** | Sortierung: PR #539, `19a989f93`, 16.8.2026 · Kantons-Probe: PR #552, 18.8.2026 | Der Bau-PR #539 fasste die Zeile an und **meldete die Begriffskollision ausdrücklich** («Namenskonflikt, 16.8.2026 gemeldet statt stillschweigend aufgelöst … Welcher Inhalt die Kennung S4 behält, entscheidet das nächste Plan-Aufräumen»). Das nächste Plan-Aufräumen war die Steuerungs-Diät #577 (29.8.2026) — sie **löschte den Warn-Absatz und kondensierte die Zeile**, ohne den darin hinterlegten Auftrag auszuführen. Die Übergabe ging beim Verdichten verloren. |

**Muster.** Eine Bau-Session führt zuverlässig, was ihr im Weg steht (Fahrplan-Vollzugsvermerk,
neue Nebenfunde) — die eigene Checkbox ist das Einzige, was sie nicht behindert, wenn sie
stehenbleibt. Und ein Doku-Aufräumen, das nach Zeichen verdichtet, entfernt Warn-Absätze
zuverlässiger als es die darin hinterlegten Aufträge ausführt. Gegenmittel: `check:plan`
**Regel 14** (Fahrplan-✅ ↔ ROADMAP-Checkbox derselben Etappe), gebaut 15.9.2026,
Geburtsbeweis rot auf `e94a3dc90` mit genau den S2- und S4-Treffern
(`scripts/plan/etappenBuchung.ts`, `src/tests/plan-check.etappen-buchung.test.ts`).

**Nachweis der Kantons-Probe** (weil sie nie eine eigene Etappe hatte und darum nirgends
abgehakt wurde): `docs/ux-audit-2026-07/reader/leser-v3-h4/README.md` Ziff. 7 und Abschnitt
«Proben — Kanton und Bund unter `?leser=v3`» — **BS-640.100** (StG BS, 292 Bestimmungen) und
**ZH-211.11** (GebV OG, 23), je V3-Rahmen · V3-Kopf · Gliederung vorhanden, **0 Konsolenfehler**,
mit und ohne Adresszusatz; Bund-Gegenprobe StPO (480) · VMWG (32) · LugÜ (91). Damit ist die
Fahrplan-Auflage aus Kap. 1 Ziff. 4 (H-Etappen gegen einen Bund- UND einen Kantons-Erlass)
erfüllt.

**Wortlaut, wie er bis 15.9.2026 in `ROADMAP.md` stand** (§2b — nicht nachgeführt, nur ausgelagert):

>   - [ ] **D0 · Farb-Vorarbeit** — Tailwind-Deckkraft-Klassen (`bg-brass-100/70`) erzeugen keine CSS-Regel; Wurzel-Fix + Rot-Beweis, eigener kleiner PR. Kap. 14.

>   - [ ] **S1 · Historie-Modell** — «Änderungsvermerke: an/aus», bei «aus» keine Spur im Lesetext (Sichtbarkeits-Wächter §8) — **wartet auf F1/F2**. Kap. 7.

>   - [ ] **S2 · Typografie + Artikel-Raster** — Variante nach Bildvergleich (**F3**), gleichmässige Abstände, CLS 0. Kap. 7/8.

>   - [ ] **S4 · Kantons-Probe** — Kantonserlasse rendern unverändert (Fokus Bund, nichts bricht); der H2-Kontaktbogen deckt nur Bund ab. Kap. 7.

**Zwei weitere Wortlaute, bei dieser Gelegenheit ausgelagert** (§2b — nicht nachgeführt):

> *(Zusatz an der abgehakten Zeile «Einzelartikel-Ansicht E1 + E2», gestrichen 15.9.2026, weil
> **überholt**: #869 ist am 14.9.2026 als `946cb155d` auf main gelandet und die Zeile ist seit
> `4be6e9797` abgehakt — die Begründung erklärte, warum sie es damals NICHT war.)*
> «Warum offen: der Doku-PR #870 hat dieselbe ROADMAP-Zeile umgeschrieben und ist zuerst gelandet
> — #869 steht seither auf DIRTY und braucht einen Rebase durch die bauende Session (§12: fremder
> Worktree, nicht von hier anfassen).»

> *(Begründungs-Hälfte der Zeile «Rohdaten-Zeiger ohne `fassungsToken`», Wortlaut bis 15.9.2026 —
> in der ROADMAP steht die Kurzform mit Zeiger hierher:)*
> «der Zeiger nennt Stand und Quelle, **nicht** den `fassungsToken`: §7 d verlangt
> Drift-**Erkennung**, keinen Hash-Abdruck im UI (Ä71, 18.8.2026); der Token steht in der
> verlinkten Datei. Fahrplan §1 entsprechend präzisiert.»

> *(Prosa-Hälfte der abgehakten Zeile «Einzelartikel-Ansicht E1 + E2», ausgelagert 15.9.2026 —
> in der ROADMAP bleibt Titel, Datum, PR + Merge-SHA und der Zeiger hierher:)*
> «Umschalter «Ganzer Erlass | Einzelner Artikel», Blättern, Dossier-Blöcke
> Historie/Verweise/Materialien/Werkzeuge; die Nachbar-Pfeile aus #854 erscheinen nur noch
> hier (Davids Befund «das bringt aber nur etwas wenn man einzeln einen artikel hat»).»

**Entscheid zur Kennung S4** (§5, eine Bedeutung): **S4 = Sortierung der Suchtreffer auf
Erlass-Reihenfolge**, wie der Fahrplan sie seit dem 16.8.2026 führt. Die Kantons-Probe behält
keine Etappen-Kennung — sie war ein Nachweis innerhalb von H4, kein Bauschritt. Die
ROADMAP-Bedeutung «S4 · Kantons-Probe» ist damit **stillgelegt**; wer sie in einem alten
Dokument liest, findet hier, was daraus wurde.

## Umschichtung 14.9.2026 (6) — Erledigt-Prosa der Phase-1-Welle (#846–#869), Wortlaut ausgelagert

**Begründung.** Der Session-Abschluss vom 14.9.2026 bucht sechzehn gelandete PRs und rund
dreissig Nebenfunde in ROADMAP.md. Der 120-KB-Deckel (`struktur-rotieren.py --check`) liess vor
dem Schreiben nur ~3 KB Luft. Ausgelagert wird ausschliesslich **Prosa bereits erledigter
Posten**; in der ROADMAP bleibt je Zeile Titel, Datum, PR + Merge-SHA und der Zeiger hierher.
Nichts gestrichen, nichts inhaltlich geändert (§2b — die Zahlen stehen im Wortlaut ihres Datums).

**`W2·27-BUND-FERTIG` — Wortlaut bis 14.9.2026 (erledigte Posten aus #851 und #859):**

>   - [x] **Sidecar-Drift-Riegel 216/228** — der Struktur-Sidecar trug in 216 von 228 Dateien keinen eigenen `stand`/`fassungsToken`; Randtitel und Fussnoten alterten unbemerkt (passt zu «Golden-Token blind für Randtitel», `sha-bloecke.ts:50`). Erledigt 14.9.2026: Generator-Lauf zog alle 228 nach (215 davon substanz-byte-gleich = die Marke ist reproduziert, nicht behauptet), `check:struktur-konsistenz` verlangt sie im Bund-Ast neu als Pflicht statt additiv. *Risikopfad ⇒ Gegenprüfung.*

>   - [x] **KKV-Token `126_z__2`** — ein Artikel existierte im Snapshot, nicht im Struktur-Sidecar (25 463 vs. 25 462). Geklärt 14.9.2026: **Quell-Effekt** — Fedlex vergibt die id `art_126_z` zweimal (Art. 126z und Art. 126z^tredecies, dessen Ordinal-Suffix fehlt in der eId); unser Struktur-Extraktor kannte den Synthese-Suffix `__2` des Snapshot-Generators nicht und liess das zweite `<article>` das erste überschreiben. Es fehlte also nicht nur ein Eintrag, Art. 126z trug **fremde** Marginalie und Gliederung. Fix an der Pipeline-Quelle, Tor meldet den Fall neu als Fehler. *Risikopfad ⇒ Gegenprüfung.*

>   - [x] **`aufgehoben` strukturell statt Text-Heuristik** — Artikel galten nur deshalb als aufgehoben, weil ihr Body leer oder «…» ist; ein Extraktionsfehler sähe identisch aus (§7/§8). Erledigt 14.9.2026: amtliches Signal = Aufhebungs-Vermerk der Fedlex-Fussnote; `aufgehoben` 0 → **1 277/25 463**, Golden byte-gleich. Neuer Wächter `check:leerstellen` deckelt die 98 ungeklärten Bund-Leerstellen. Zahlen, Restklassen und ein Historie-Nebenbefund: Fahrplan §1 (Nachtrag 14.9.). *Risikopfad ⇒ Gegenprüfung.*

**`W2·22-VERWEIS-FEDLEX` — Wortlaut Z6 (a)/(c) bis 14.9.2026 (#852, #856):**

>     (a) ✅ erledigt 14.9.2026 — die Suffix-Reihe (bis…duodecies) steht jetzt EINMAL in
> `src/lib/fedlex/nummer.ts`; alle vier Konsumenten lesen sie. 13 Fundstellen in 9 Bundes-
> erlassen lösen neu auf (41 unterdrückte Aufzählungs-Glieder → 50 Links, +2 Selbstsprünge),
> 0 kantonale Stellen, 0 neue tote Anker; (b) ✅ erledigt (Wortlaut: Chronik, Umschichtung 6.9.2026);
> (c) **Artikel-Anker gegen den Ziel-Snapshot prüfen, Fallback Erlass-Link** —
> ✅ **gebaut 14.9.2026**: **39 tote Fremd-Anker** von 10 254 prüfbaren, 28 Ziele (36 Bund /
> 3 Kanton), Wächter `check:verweis-inventar`; amtlich gegengeprüft, keine Extraktionslücke.

*Nachtrag zur ausgelagerten Fassung (nicht in sie hineingeschrieben, §2b):* die Zahl «10 254
prüfbare Ziele» ist der Stand VOR PR #852; das Artefakt nach #852 führt 10 276. Der Kommentar in
`src/components/normtext/NormChip.tsx:105` trug dieselbe Altzahl. Ebenso war «vier Konsumenten»
der Suffix-Reihe (`spannen.ts:502`) zu tief gezählt — es sind sechs.

**W2·27-BUND-FERTIG — erledigte Posten 14.9.2026 — Wortlaut bis 14.9.2026:**

> - [x] **Sollbild + Messung 14.9.2026** (dieser PR) — elf Bausteine mit Soll/Ist-Bund/Leser/Zuständigkeit, Fünf-Artefakte-Befund, Randtitel-Doppelmodell, zehn Lücken (Fahrplan §1/§2).

> - [x] **Zukunftsfassungen-Hinweis im Leserkopf** — ✅ erledigt 14.9.2026, PR #863 (`7f5aa592e`); *(Entscheid David 14.9.2026, Fahrplan §4 b)* — «ab <Datum> gilt eine neue Fassung» + amtlicher Link aus `naechsteFassungAb`/Inkrafttreten-Register (62 Erlasse, 93 künftige Inkrafttreten liegen als Daten vor); reiner Hinweis, kein Umschalter (Phase 3). Hülle, kein Risikopfad.

> - [x] **`aufgehoben` strukturell statt Text-Heuristik** — ✅ erledigt 14.9.2026, PR #859 (`d16acf466`); Gegenprüfung bestanden. `aufgehoben` 0 → **1 277/25 463**, Golden byte-gleich, neuer Wächter `check:leerstellen`. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (6). *Risikopfad.*

> - [x] **Sidecar-Drift-Riegel 216/228** — ✅ erledigt 14.9.2026, PR #851 (`6c4f9fa2f`); Gegenprüfung bestanden. 228 Sidecars tragen `stand`/`fassungsToken`, `check:struktur-konsistenz` verlangt sie im Bund-Ast als Pflicht. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (6). *Risikopfad.*

> - [x] **`confidence.json`-Neulauf** — ✅ erledigt 14.9.2026, PR #848 (`90cb59fff`); Gegenprüfung bestanden. Qualitätsbild 23.6. → 14.9.2026, das Artefakt liegt öffentlich unter `/normtext/confidence.json` (~500 KB, heute ohne UI-Leser). Zwei Folgeposten stehen im Fehlerbuch (§4): `[N]`-Heuristik falsch-positiv (FIDLEV Anh. 9) und die auto-akzeptierte Tabellen-Verklebung VD-vd-106879 Art. 81.

> - [x] **KKV-Token `126_z__2`** — ✅ geklärt 14.9.2026, PR #851 (`6c4f9fa2f`): Quell-Effekt (Fedlex vergibt `art_126_z` zweimal), Fix an der Pipeline-Quelle, Tor meldet den Fall neu als Fehler. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (6). *Risikopfad.*

**W2·13-KANTONE-DATEN — erledigte Posten 12.9.2026 — Wortlaut bis 14.9.2026:**

> - [x] **K-15 · Sprengel-Zuordnung BE aus amtlichen Geodaten** — erledigt 12.9.2026, PR #810 (`064d191f6`): 334/334 Gemeinden, 5 Gerichtsstandorte, 4 regionale Staatsanwaltschaften; Normbasis GSOG Art. 80/81/88a/92 (BSG 161.1); Artefakt `src/data/zustaendigkeit/beSprengel.json`; Tore `check:be-sprengel`/`check:be-sprengel-netz`. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 12.9.2026.

> - [x] **K-16 (BS-Teil) · Kantonale Materialien Basel-Stadt an die Botschaften-Pipeline** — erledigt 12.9.2026, PR #799 (`c83501304`): Grosser Rat (data.bs.ch, CC BY 4.0), 117 Geschäfte, 122 Kanten (8 amtlich, 114 maschinell gekennzeichnet), 409 Verfahrens-Ereignisse. ZH-Teil bleibt offen (Präzisierung 6.9.2026: Bund → BS → ZH; ZH-Pendant FAHRPLAN-KANTONE §5 R12b). Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 12.9.2026.

> - [x] **Deckel-Reserven vor ZH (R12b) — erledigt 12.9.2026 (PR #802, `c0acd4557`):** Register in drei Projektionen geteilt (Kern/i18n/Provenienz nach Nutzungszeitpunkt) — Kern 118/280 KB gzip (42 %), i18n 84/140 KB (60 %), Provenienz 93/240 KB (39 %), Verfahrens-Ereignisse 16/60 KB (27 %, jetzt alle Herkünfte statt nur Bund); ZH-Prognose Kern 49 %. — ✅ Wortlaut: ROADMAP-CHRONIK.md.

**W2·13-KANTONE-DRIFT — erledigte Posten 12.9.2026 — Wortlaut bis 14.9.2026:**

> - [x] **`check:fedlex-versionen` rot: Pin `erv` html-6 ≠ kanonisch html-7** *(gemeldet von zwei Prüfern 12.9.2026, Vorbestand, Netz-Tor)* — gelöst mit PR #806 (`56d33dae8`): Pin auf die kanonische Fedlex-Manifestation html-7 nachgeführt (Republish derselben Konsolidierung 2025-01-24). Erster Beleg «byte-identisch» war falsch, in der Gegenprüfung (Opus, #808) korrigiert (§2b, ergänzt statt überschrieben): richtig ist **textgleich, Markup abweichend** — Extraktionsgleichheit über 224/224 Artikel-SHAs belegt.

> - [x] **`QS-CURRENCY-KANON-FRISCHE`** — gelöst mit PR #808: `fedlex-frische.yml` regenerierte das Manifest nur bei einem `cache.sh`-Diff, während `gen:fedlex-wiedervorlage` `currency.json` (ingestierte DB-Quelle) in JEDEM Lauf schreibt — Lauf 34107274098 scheiterte an `check:datenhaltung`, PR-Schritt `skipped`. `datenhaltung:manifest` läuft jetzt unbedingt nach der Regenerierung. Dazu Pin-Identitäts-Sonde in `scripts/normtext/cache-pin-befund.ts`: ein `/tmp`-Cache gilt erst nach Marker-Abgleich (`eli|konsolidierung|html-N`) als gültig, nicht mehr nach reiner Inhalts-Sonde.

**QS-UI/Design — Reiterleiste 13.9.2026 — Wortlaut bis 14.9.2026:**

> - [x] **Reiterleiste: sechs stille Fehler** — ✅ 13.9.2026, PR #842 (+ Nachzug R8-Sweep mobil), dazu Welle 2 #843 (Tastatur-Ring, Alt+Q, Ring-Ordnung, Menü-Vorlauf, 24-px-Griffe) und Welle 3 #844 (Kopf weicht am Anschlag, Rand-Schub, Reiter als Links, Hover-Karte, Touch-Umordnen); Specs Fahrplan §4.R/§4.R2/§4.R3. *(Sichtprüfung + Code-Zweitblick 13.9.2026, Auftrag David «bau 1 bis 6»)* — Alt-Kürzel am Mac (`e.key` statt `e.code`), Render-Kaskade beim Scrollen, Kappungs-Verluste ohne Ring, gestutzte Beschriftungen ab 7 Reitern, Nachbar-Wahl nach Schliessen, stehender Blatt-Filter. Spec: Fahrplan §4.R «Reiterleiste 13.9.2026».

**`QS-KORPUS` — erledigte Posten 7.9.–12.9.2026, Wortlaut bis 14.9.2026:**

> - [x] **`adapter-lexwork.ts:778` Fetch-Ergebnis unvalidiert** — ✅ erledigt 12.9.2026, PR #813 (`af5e35ce9`); Gegenprüfung ausstehend. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (2).

> - [x] **Geltende BMV in den Korpus aufnehmen** — ✅ erledigt 12.9.2026 (#823, gelandet). Wortlaut: ROADMAP-CHRONIK.md.

> - [x] **scope/decl-Sektionen von 12 Staatsverträgen ingestieren** — ✅ erledigt 12.9.2026, PR #838; Gegenprüfung bestanden. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (2).

> - [x] **Entscheid-Datumsfehler bereinigen** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 12.9.2026).

> - [x] **Erledigt:** VZV Art. 3/4 · AMBV — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 7.9.2026 (2).

> - [x] **Erledigt:** Deckungs-Seite «was wir nicht haben» — ✅ Wortlaut: ROADMAP-CHRONIK.md, PR #807 (12.9.2026).

> - [x] **Ingest-Wächter `ungedeckteTopLevelJson`** (#807) fand vier vorbestehende Lücken (`inkrafttreten`, `kanton-luecken`, `pdf-quellen`, `bezuege-bilanz`) — geschlossen; Ausnahme-Mechanik ohne Verfall bewusst nicht gebaut.

**W2·20-VERWEIS-SCHAERFE — Stand-Prosa bis 14.9.2026:**

> «Art. xx dieses Gesetzes» springt im Gesetz; Verweise nach ausserhalb sind als solche
> erkennbar; Inventar-Schärfe messbar statt Kommentar-Zahlen. **Stand 14.9.2026 (Prosa
> nachgezogen):** V-1 (Mess-Tor `check:verweis-inventar`) · V-2 · V-3 · V-4 · V-6 gebaut 1.9.2026
> (PR #599), V-7/V-8 1.9.2026, **V-7c Trägergesetz + 15 Kurztitel 14.9.2026** («des Gesetzes» = das
> im Ingress legaldefinierte Trägergesetz, 169 Glieder, davon 97 vorher FALSCHE Self-Links).
> **Offen (Phase 1):** Kurztitel OHNE Korpus-Erlass (Gaststaat-, Zoll-, Subventionsgesetz … ~146
> Stellen) — hängt am KORPUS, nicht am Erkenner (Wächter braucht das Erlassdatum aus dem Sidecar);
> Wurzel-Fix ist ein Snapshot dieser Erlasse, nie eine Wächter-Lockerung. **Phase 2:** kantonale
> Namensliste (916). **Phase 3:** V-5 (Zeit-Kante) an W2·5g-ZEIT. Kein Link besser als falscher (§1).

**QS-BASIS (d) — Landungs-Protokoll aus F1, Wortlaut bis 14.9.2026:**

> **VOR DEM MERGE (Landungs-Protokoll aus F1):** Sync und Deploy hängen am selben Push und warten NICHT aufeinander — gemessen 5,3–6,6 min (Sync) gegen 14,8 min (Prod live), im Normalfall also die sichere Reihenfolge, aber ein Rennen. **Ohne `TURSO_AUTH_TOKEN` überspringt der Sync-Job und endet grün, während der Deploy ausliefert** — dann bleibt das Fenster offen bis zu einem Sync von Hand. Billigster Riegel: «Turso-Serving-Sync» per `workflow_dispatch` auf dem Branch fahren, **bevor** gemergt wird (die alte Edge-Funktion verträgt den neuen Index — verifiziert; `daten-manifest.json` unverändert, `check:turso-frische` bleibt also grün).

**W2·13-KANTONE-DATEN — ZH-Tranche Stufe 1, Wortlaut bis 14.9.2026:**

> Stufe 1 erledigt: 944 in-Kraft-Erlasse via amtlichem JSON-Endpunkt gezählt, Volltext nur PDF (beweisgeführt), Systematik-Ebene 1 = 14 Ordner browserlos, Drift-Token = PDF-ETag; Dossier [zh-quellinventar-2026-08-31.md](bibliothek/recherche/zh-quellinventar-2026-08-31.md). Stufe 2

**Werkzeuge/Tarif — Landungs-Prosa PR #764, Wortlaut bis 14.9.2026:**

> ✅ Gelandet 8.9.2026 (PR #764, Gegenprüfung Opus bestanden: 4 Wertkorrekturen amtlich nachgerechnet, DRIFT 0, `check:tarif-drift` in der Netz-Kette; Drift-Tor: unerreichbar ⇒ rot).

**Rechtsprechung — Bezüge-Zeile, Wortlaut bis 14.9.2026:**

> - [x] **Bezüge-Zeile: Kopfzähler gefiltert/ungefiltert** — ✅ entschieden 11.9.2026 (Mandat David «führe alles durch»): EINE Zahl, gefiltert bei aktivem Filter, Gesamtzahl nur im `title`. Detail: `FAHRPLAN-DESIGN-IDENTITAET.md` §9 Z3.

**QS-FREMDAGENTEN — selbstoptKern-Befund, Wortlaut bis 14.9.2026:**

> - [ ] **`scripts/plan/selbstoptKern.ts` über der Schlankheits-Schwelle, unregistriert gefunden** *(Nebenfund Abschluss-Session 4.9.2026)* — 1094 Z. (Schwelle 800), vermutlich durch #666 gewachsen, ohne dass jemand `npm run schlankheit:update` fuhr; diese Session hat die Datei nur ins Baseline-Register aufgenommen (kein Split, Doku-Auftrag), Split bleibt offen. `src/tests/plan-selbstopt.test.ts` (1087 Z., ebenfalls jetzt registriert statt gesplittet) — *seit PR #699 (Jules 8, 5.9.2026) gesplittet: 500/236/382 Z., Baseline-Eintrag entfernt* hängt dran — beide teilen sich denselben Wächter-Blick.

**QS-CI-MINUTEN — BEHIND-Zeile (Dublette zu QS-BASIS), Wortlaut bis 14.9.2026:**

> - [ ] **Plan-Buchungs-Commit macht jede wartende PR BEHIND** *(Befund 11.9.2026, #791/#793)* — der automatische `docs(plan): … [skip ci]`-Commit nach jedem Merge zieht jeden offenen
> Branch hinter `origin/main` zurück ⇒ ein zusätzlicher CI-Lauf je Landung, bevor gemergt
> werden kann. Wurzel-Optionen: GitHub Merge Queue (Repo-Setting, David) oder die Buchung
> im PR selbst statt danach.

**QS-VERWENDEN — V7-Messdetail, Wortlaut bis 14.9.2026:**

> `src/tests/feiertage-gegenprobe.test.ts`, 26 Kantone × 2024–2027; 45 Rohabweichungen, 43 über eine kommentierte Ausnahmeliste (Norm/Kommentar-Beleg je Eintrag) als gewollt erklärt, 1 offen:

**`W2·5m-LESER-V3` — Wortlaut Deckel-Fix bis 14.9.2026 (#868):**

>   - [x] **Tor-Konflikt `erlassAnsicht.ts`-Deckel** *(§17-Wurzel-Fix)* — ✅ **erledigt 14.9.2026, PR #868**: Datei in zwei Schwestern geschnitten (`erlassAnsicht.ts` 419→198, neu `erlassWortlaut.ts` 267), Deckel unverändert 420, Tor aufs Paar gezogen. Vermerkt offen: `leserV3Modell.ts` 420/420 (Schnitt dort dokumentiert gescheitert).

---

## Umschichtung 14.9.2026 (5) — 5 offene Befund-Zeilen, Wortlaut ausgelagert (Steuerdeckel)

**Begründung.** ROADMAP.md stand nach den Landungen des 14.9.2026 (#846–#866) bei 120,0 KB und riss den 120-KB-Deckel im CI-Lauf von PR #864. Diese OFFENEN Zeilen trugen je 500–1 000 Zeichen Befund-Prosa (Nebenfunde 3.9./4.9./12.9.2026); steuernd ist Titel, Datum, PR-Bezug und Zeiger — der Wortlaut steht hier unverändert. Nichts erledigt, nichts gestrichen.

> - [ ] **`check:paritaet` ist gegen Datei-LÖSCHUNG blind** *(Nebenfund ZH-Fix-Runde 3, 31.8.2026 — bewusst NICHT hier gefixt, fremde Baufläche `scripts/datenhaltung/**`)* — Am Code belegt (`scripts/datenhaltung/check-paritaet.ts`, gelesen 31.8.2026): das Tor baut seine DB durch INGEST DER VORHANDENEN DATEIEN (`ingestNormtext(db)`) und vergleicht danach jeden Pfad, den diese DB kennt, byte-weise mit der Datei. Eine gelöschte Datei wird nie ingestiert, steht nie in `alleEintragPfade()` und wird nie verglichen — die Löschung ist für dieses Tor unsichtbar, nicht wegen eines Fehlers, sondern wegen der Richtung des Beweises. Auffallen kann sie nur einem Tor, das eine andere Frage stellt (`check:golden-normtext` vermisst die sha-Einträge). Nötig ist die Gegenrichtung im Paritäts-Tor: DB-Erlassmenge ⊆ Dateimenge. Fläche `scripts/datenhaltung/check-paritaet.ts`, zu bauen zusammen mit dem Datenhaltungs-Strang (§12: die beiden Stränge landen abwechselnd, nie gleichzeitig auf dieselben Artefakte).

> - [ ] **Konflations-Wächter breiter** *(Gegenprüfungs-Nachtrag D2, 12.9.2026, PR #816, gehört ins Fehlerbuch-Dach `W2·18-FEHLERBUCH`)* — `findeFremdeFundstelleImBody` (`scripts/normtext/entscheide-koerper-konflation.ts`) sieht nur Bodies mit einem laufenden Seitenkopf-Marker («BGE … S. …»); Prüfmenge effektiv 6/1259 BGE (0,5 % Abdeckung), kurze Auszüge ohne Seitenumbruch bleiben blind. Zwei zusätzliche, unabhängige Signale würden den Anlassfall `bge_152_V_2` BEIDE gefangen haben: (a) Regeste-Normen vs. Body-normKeys — die amtliche Regeste nennt ATSG/IVG, der (damals kontaminierte) Body zitierte KLV/MVG/BV/OR/SVG, keine Schnittmenge; (b) Regeste-Sprache vs. Body-Sprache — die Regeste von 152 V 2 ist italienisch (`Regesto`), der kontaminierte Body deutsch. Beide Signale sind rein aus bereits persistierten Feldern ableitbar (kein Netz nötig); als eigener Schritt zu bauen, mit Rot-Beweis am (inzwischen quarantänierten) Alt-Zustand von `bge_152_V_2`.

> - [ ] **`BMV`-Zitat löst auf die aufgehobene Fassung auf** *(Nebenfund PR #823, 12.9.2026, gehört ins Fehlerbuch-Dach `W2·18-FEHLERBUCH`)* — `src/lib/fedlex/tabelle.ts` führt den FEDLEX-Schlüssel `BMV` weiter auf `cc/2009/423`; ein blosses Zitat «Art. 5 BMV» im Fliesstext endet über die Token-Erkennung (`erkenneFedlexGesetz`) darum auf der **aufgehobenen** Fassung, und `src/lib/fedlex/positivliste.ts` kennt zur geltenden Verordnung vom 13.6.2025 weder einen `TITEL_EINTRAEGE`-Eintrag (Fragment «über die eidgenössische Berufsmaturität») noch ein `ERLASSDATUM` (2025-06-13). **Heute wirkungslos** (korpusweite Messung 12.9.2026: null echte Zitate der Berufsmaturitätsverordnung) — darum eigener Schritt statt Mitnahme. Zu klären ist dabei die GENERELLE Regel für Totalrevisionen: soll das nackte Kürzel auf die geltende Fassung zeigen und die aufgehobene einen eigenen Schlüssel tragen (`BMV-2009`), oder bleibt die Datums-Prüfung aus §V-7 der einzige Arbiter? Mit Rot-Beweis an einem konstruierten Zitat.

> - [ ] **Prerender-Shell nennt aufgehobene Erlasse «geltend»** *(Nebenfund PR #823, 12.9.2026, gehört ins Fehlerbuch-Dach `W2·18-FEHLERBUCH`)* — `src/lib/seo-detail.ts:359` schreibt in die crawlbare Kopfzeile JEDES Erlasses fest «amtliche Fassung (geltend)», auch wenn `e.aufgehoben` gesetzt ist (zwei Zeilen darüber wird das Feld bereits ausgewertet). Gemessen an `dist/gesetze/bund/BMV.html` (Build 12.9.2026): Zeile «BMV · SR 412.103.1 · Stand 2016-08-23 · amtliche Fassung (geltend)», kein Aufhebungs-Hinweis, kein Nachfolge-Link — der Reader-Kopf ist seit PR #823 ehrlich, die prerenderte Fassung für Suchmaschinen und Nutzer ohne JS nicht (§8). Fix: Wortlaut am `aufgehoben`-Feld ausrichten und den Nachfolger (sofern im Korpus, `erlassKeyVonEli`) auch dort verlinken; Rot-Beweis über die erzeugte BMV-Shell.

> - [ ] **E2E-Flake Shard 2/8 — Wurzel messen statt neu starten** *(Befund QS-FREMDAGENTEN, Session 4.9.2026)* — «IA-1 Named-Article-Klick» OR 336c/257d sowie die Richter-Facetten-Trefferzahl flackerten 3× auf Branches OHNE App-Änderung (#650, #658 ×2), Rerun jeweils grün. Möglicherweise dieselbe Hydrations-Wurzel wie der Eintrag oben, möglicherweise eine eigene Wartezeit-/Prerender-Race — vor dem nächsten Rerun-only-Fix die Wurzel messen (Wartezeit-Histogramm der zwei Specs über mehrere Läufe), nicht nur den Shard neu starten.

## Umschichtung 14.9.2026 (4) — W2·5m Pfeile/Rohdaten-Link (Wortlaut) + Platz für das Einzelartikel-Konzept

**Begründung.** Beide Punkte sind mit PR #854 (`7b0338916`, 13.9.2026) gebaut, standen in der ROADMAP aber weiter als offen — das Abhaken war beim Landen unterblieben (§14). Gleichzeitig fügt das Konzept «Einzelartikel-Ansicht» (Auftrag David 14.9.2026) dem Schritt `W2·5m-LESER-V3` eine Zeile hinzu; ROADMAP.md stand danach bei 119,9 KB von 120 KB Budget, also rund 80 Bytes Luft. Der Wortlaut beider erledigter Punkte wandert darum hierher, die ROADMAP behält die Erledigt-Zeile mit PR-Zeiger. Inhaltlich unverändert.

**`W2·5m-LESER-V3` — Wortlaut bis 14.9.2026:**

>   - [ ] **Nachbar-Artikel-Pfeile** (← Art. 89 · Art. 90a →) im Artikelkopf; Muster gesetze-im-internet/dejure/buzer. Reine Hülle, Kern unangetastet. Quelle: Fremdnutzen-Suchrunde 2 (6.9.2026) §3 #1.
>   - [ ] **Rohdaten-Link je Erlass** (JSON-Snapshot/AKN-Quelle, Stand, Fassungs-Token) im Leser-Kopf — §7-Transparenz, Muster legislation.gov.uk «Print Options». Quelle: Fremdnutzen-Suchrunde 2 (6.9.2026) §3 #11.

**Einordnung.** Die Pfeile bleiben gebaut, wechseln aber mit dem Konzept Kap. 15 (E1) den Ort: sie verschwinden aus der Scroll-Ansicht und erscheinen nur noch im Einzelmodus — Anlass ist Davids Befund vom 14.9.2026, «das bringt aber nur etwas wenn man einzeln einen artikel hat». Das ist kein Rückbau des Nutzens, sondern seine Verlagerung dorthin, wo er wirkt; der Wortlaut oben bleibt als Beleg des Ist-Standes vom 13.9.2026 stehen (§2b).

---

## Umschichtung 14.9.2026 (3) — QS-CI-MINUTEN Erledigt-Prosa und Entscheide 8.9.2026 (Wortlaut)

**Begründung.** PR #859 fügt W2·27 die Auflage-Zeile «§8-Anzeige der ungeklärten Leerstellen» hinzu; ROADMAP.md stand danach bei 120,4 KB (Budget 120 KB). Die Erledigt-Prosa von QS-CI-MINUTEN wandert wörtlich hierher; die ROADMAP behält Nachmessung, offene Posten und Zeiger. Inhaltlich unverändert.

**QS-PERF — Ergänzung 1.9.2026, Wortlaut bis 14.9.2026:**

>   **Ergänzt 1.9.2026 (Leser-Tempo gebaut, A/B n=5, alte Zahl bleibt stehen — §0/2b):** Das
>   753-KB-`rechtsprechung/register.json` lädt nicht mehr auf Gesetzes-Leserseiten, und der Prerender
>   lädt Register/Struktur im Kopf vor → OR **10 368 → 7 899 ms @4×+4G (−23,8 %)**,
>   **38 296 → 27 432 ms @6×+3G (−28,4 %)**; ungedrosselt misst derselbe Basis-Stand **780 ms**, die
>   17.8.-Zahl ist dort also nicht mehr reproduzierbar. **Bestands-Defekt dabei gefunden UND gefixt:**
>   `InhaltsKopf` montierte die Sprung-Rückmeldungen beim Wechsel auf `kopfzeileSelbst` um → die
>   Deep-Link-Ansage «Springe zur verlinkten Stelle …» blinkte (Aus-Flanke auf die Millisekunde mit
>   dem Zweigwechsel, 3/3); jetzt EIN Träger mit zwei Zuständen, Markup byte-gleich, R7 50/50 grün,
>   volle e2e 722/722. **Offen:** der Snapshot-Preload (+3–10 %) hängt an einer ZWEITEN
>   Reihenfolge-Stelle im Spy-Effekt (`inhalt-hooks.tsx`, 20 Specs, nicht untersucht) ·
>   K3-Chunk-Kaskade · Reader-Kopf-Reflow (Design-Entscheid §13) · `hydrateRoot` (eigener PR unter
>   `QS-BASIS`).

**QS-CI-MINUTEN — Wortlaut bis 14.9.2026:**

> ✅ M2 (#767) · M1/M3/M4/M5 (#773) · Flacker-Wächter (#779, Melde-Modus bis 22.9.2026, dann hart) · Ergebnis-Job (#780) · Playwright-Install-Retry dpkg-Sperre (#785); Regeln: Skill `landung` §«Prüfstrasse seit 8.9.2026». **Nachmessung 8.10.2026.** Offen: Merge Queue (Gate) · Wurzel der 6 flackernden Specs (Fehlerbuch §4, bis 22.9.).
>
> **Entscheide David 8.9.2026:** Weg **A** (Repo bleibt öffentlich, Sparplan bauen; privat nur zusammen mit VPS/Self-hosted Runner) · **M2 freigegeben und gelandet** (Dependabot monatlich, `rebase-strategy: disabled`).
## Umschichtung 14.9.2026 (3) — W2·22 Z6c Bau-Befund und Sammel-Anker-Vorarbeit (Wortlaut)

**Begründung.** Der Z6c-Nachzug zu PR #856 (Gegenprüfungs-Befunde A–F) trägt +18 ROADMAP-Zeilen
ein und bringt ROADMAP.md auf 120,8 KB (Budget 120 KB, `struktur-rotieren --check` rot im PR;
Nullprobe: origin/main misst 119,6 KB und ist grün — das Delta ist eigenes). Die beiden
Befund-Prosen wandern darum wörtlich hierher; die ROADMAP behält je Zeile Ziel, Zahl und Zeiger.
Inhaltlich unverändert, nichts neu erledigt.

**Z6c (c) — Zielbild und Vor-Messung, Wortlaut bis 14.9.2026:**

> **Artikel-Anker gegen den Ziel-Snapshot prüfen, Fallback Erlass-Link** — ein Fremd-Anker
> entsteht heute allein aus Kürzel + Nummer, ohne dass die Zielbestimmung im Snapshot des
> Zielerlasses nachgeschlagen wird. Gemessen 2.9.2026: 16 tote Artikel-Anker aus Z5 (StGB
> `art_91_a` ×4, StGB `art_340` …); dieselbe Mechanik trägt auch die ALTEN Anker-Pfade, der
> Bestand ist also mitzumessen. Zielbild: existiert das Ziel-Token nicht, auf den Erlass-Link
> zurückfallen statt auf einen toten Sprung (§8). Risikopfad — Gegenprüfung Pflicht.

**Z6c — Bau-Befund, Wortlaut vom 14.9.2026:**

> ✅ **gebaut 14.9.2026** — korpusweit über ALLE Anker-Pfade nachgemessen, nicht nur Z5:
> **36 tote Fremd-Anker** von 9 675 prüfbaren, 26 verschiedene Ziele, 25 Bund / 11 Kanton.
> Wächter: `check:verweis-inventar` → `toteFremdanker` + `fremdZiele`. Amtlich gegengeprüft
> (Fedlex-SPARQL + AKN-XML, 26/26): keines existiert in der geltenden Fassung — **keine**
> Extraktionslücke, und auch Fedlex trägt keinen `id="art_<token>"`, der Anker war dort
> ebenso tot.

**Nachtrag zu diesem Wortlaut (Gegenprüfung, 14.9.2026 — Ergänzung, keine Korrektur):** die
Messung «36 von 9 675» galt dem Bund-Zweig. Die kantonale V-3-Weiche `paragraf-kanton-kuerzel`
(579 ausgelieferte Stellen) baut ihren Anker in NormText.tsx selbst, ohne NormChip und ohne
`bundSnapshotRef`, und war darum in keiner Messung. Seit Befund C misst das Inventar sie mit:
**39 tote Fremd-Anker von 10 254 prüfbaren, 28 verschiedene Ziele** (36 Bund / 3 Kanton). Die
drei kantonalen sind BS-154.200 §20 → GOG BS-154.100 §56h sowie BS-861.520 §28 und §29 → BRG
BS-140.500 §16b; der Prüfer hat sie an der LexWork-API belegt, die Messung reproduziert sie
unabhängig aus den Snapshots.

**Z6c-Folge Sammel-Anker — Wortlaut vom 14.9.2026:**

> von den 26 toten Zielen führt Fedlex **19** als aufgehobene Nummer in einem SAMMEL-Anker
> («Art. 876–883 Aufgehoben», `id="art_876_883"`); heute fallen auch sie auf den Erlass-Link
> zurück. Den Block anzuspringen ist mehr als ein Anker-Wechsel — Popover-Inhalt, Sachtitel und
> Passus-Markierung zeigen dann eine ANDERE Bestimmung — und braucht darum einen eigenen
> deklarierten Schritt. Vorarbeit liegt: `sammelblockFuer()` in
> `src/lib/normtext/artikel-bestand.ts` misst die Lage (erkennt 13 der 19 — rein numerische
> Blöcke; suffixbehaftete wie `art_275_bis_275_ter` erst nach Z6a).

**Nachtrag (Befund E, 14.9.2026):** «13 der 19» war falsch gezählt — verwechselt worden waren
Ziele und Fundstellen. `sammelblockFuer()` erkennt **15** der 19 Ziele (= 20 der 36
Bund-Fundstellen). Nachzählen:
`node -e "const t=require('./messwerte/verweis-inventar.json').toteFremdanker; console.log(new Set(t.filter(e=>e.sammelblock).map(e=>e.quelle+'|'+e.token)).size)"`


## Umschichtung 14.9.2026 (2) — W2·7-VZUI Fertig-Kriterium und QS-KORPUS adapter-lexwork (Wortlaut)

**Begründung.** Die Quittungs-Commits der Gegenprüfungen #848/#851 und die zwei neuen W2·27-Zeilen
(Randtitel-Entscheid, Zukunftsfassungen-Hinweis) brachten ROADMAP.md auf 120,1 KB (Budget 120 KB,
`struktur-rotieren --check` rot im PR #851). Zwei Erledigt-Prosen wandern darum wörtlich hierher; die
ROADMAP behält je Zeile Ziel, Datum und Zeiger. Inhaltlich unverändert, nichts neu erledigt.

**W2·7-VZUI — Wortlaut bis 14.9.2026:**

> **Fertig, wenn** die Panel-Reiter fachlich sauber geschnitten sind («Passende Werkzeuge» und
> `kontextSoftLaw` gehören nicht in «Materialien») — ✅ **erfüllt 31.8.2026** mit dem vierten Reiter
> «Anwendung» (s. Checkliste). *(Quell-Zeiger berichtigt 31.8.2026: die Zeile nannte «Kontaktbogen H4
> §7a»; dort steht die Vollzugs-Tabelle der B-Spec-Umhängung. Der Wortlaut steht in
> `archiv/fahrplaene/FAHRPLAN-LESER-V3.md` C6/W2·7-VZUI-Restzeilen.)*

**QS-KORPUS scope/decl-Sektionen — Wortlaut bis 14.9.2026:**

> ✅ erledigt 12.9.2026, PR #838 (`87db8a514`); Gegenprüfung bestanden. Nebenfund «Anhänge»-Label → PR #840 (offen). Wortlaut: FAHRPLAN-OFFENE-BEFUNDE.md.

**QS-KORPUS Geltende BMV — Wortlaut bis 14.9.2026:** *(Zusatz: der Stand «noch nicht gemergt» war überholt — #823 ist am 12.9.2026 gelandet, s. Mandat-Karte 12.9.)*

> ✅ erledigt 12.9.2026 (Wortlaut: ROADMAP-CHRONIK.md); Gegenprüfung ausstehend, noch nicht gemergt.

**QS-KORPUS `adapter-lexwork.ts:778` — Wortlaut bis 14.9.2026:**

> erledigt 12.9.2026, PR #813 (`af5e35ce9`), Gegenprüfung ausstehend: Laufzeit-Validierung `validiereTextOfLaw()` statt Compile-Cast, Nullprobe mit drei vorher rot laufenden Tests. Wortlaut: ROADMAP-CHRONIK.md.

## Umschichtung 14.9.2026 — ZH-4d und R1-Restposten (Befund-Wortlaut, `W2·13-KANTONE-DATEN`)

**Begründung.** Beide Zeilen trugen ihre vollständige Befund-Geschichte in ROADMAP.md; steuernd ist
davon nur, was noch offen ist. Die Steuer-Doku-Welle vom 14.9.2026 (Phasen-Dekret) brachte die Datei
auf 0,4 % unter das 120-KB-Ceiling — der Wortlaut wandert darum hierher, die ROADMAP behält je Zeile
Ziel, Grenze und den Zeiger. Inhaltlich unverändert, nichts erledigt.

**R1-Restposten — Wortlaut bis 14.9.2026:**

> **R1-Restposten (Auflage Gegenprüfung PR #629, 2.9.2026):** ZH-615 §§ 1–2 tragen im PDF die Randtitel «Beitritt»/«Vollzug», Sidecar und Messreihe melden `randtitel: 0` (stille Auslassung; Verdacht: Bandbestimmung auf einer von der angehängten Rahmenvereinbarung dominierten Seite). Dazu ZH-615/691: 14 amtliche Randtitel fallen wegen der Marker-Zählweise (Art. vs. §) der Snapshots weg — Folgeschritt an der Snapshot-Zählweise, nicht am Sidecar. §1-A.

**ZH-4d — Wortlaut bis 14.9.2026:**

> **ZH-4d · Gliederungs-Überschriften + Übergangsbestimmungen** *(Befund 31.8.2026, nach der Fix-Runde neu geschnitten)* — «4. Abschnitt: Medien» u. ä. landet am Ende des VORANGEHENDEN § (129 Blöcke). Teilentlastet 31.8.2026: römische Gliederungsziffern werden jetzt wie die Buchstaben-Gliederung verworfen; die Marginalien-/Randnoten-Ebene bleibt offen und braucht den Tag-Leser. **Neu dazu:** Übergangs- und Schlussbestimmungen sind seit der Fix-Runde bewusst NICHT mehr im Snapshot (§8: ausgewiesene Lücke statt falscher Zuordnung an den letzten §) — ihre Aufnahme als eigener Eintragstyp gehört hierher, ebenso der PBG-Anhang mit den nachgedruckten Altfassungen. Der Loseblatt-Änderungsapparat im letzten § ist erledigt (43 → 0 Blöcke). *Ergänzung 31.8.2026 (Fix-Runde 2, der Satz oben bleibt als Stand nach Runde 1 stehen):* Die ZÄHLENDE Gliederungsform («2. Kapitel:», «1. Abschnitt:», «Erster Teil:») ist seither ebenfalls erledigt (103 → 0 Blöcke); offen bleibt allein die Marginalien-/Randnoten-Ebene. Die Auslassung der Übergangsbestimmungen und des PBG-Anhangs ist seither im Artefakt ausgewiesen (`kanton-luecken.json`) — ihre Aufnahme als eigener Eintragstyp bleibt hier. Sollte vor ZH-Stufe 3. §1-A.

## Phasen-Dekret 14.9.2026 — Bund zuerst, drei Phasen statt vier Blöcke (`W2·27-BUND-FERTIG`)

**Anlass.** Entscheide Davids im Chat vom 14.9.2026, nach der Ist-Messung des Bundes-Normtext-Korpus
vom selben Tag. Wortlaut (unverändert, §0/2b — Belege altern nicht):

> «ok dann lass uns erst das fundament fertig bauen und vps erst danach»
> «das wirkt alles sehr kompliziert. können wir das klarer aufbauen? ich denke der erste schritt
> sollte sein den gesetzesleser und die struktur der daten die wir darstellen zu optimieren»
> «grundsätzlich würde ich zuerst mit dem bund beginnen»
> «ja das passt grundsätzlich aber lass uns zuerst das für den bund machen»

**Wirkung.** Der Vier-Block-Aufbau des Zielbild-Dekrets 1.9.2026 ist durch drei Phasen ersetzt
(1 Bund fertig machen · 2 Kantone · 3 Mehr als Fedlex); das Zielbild selbst — bester Gesetzesleser
für Schweizer Juristen, nur amtliche Quellen — bleibt unverändert. Neuer Dach-Schritt
`W2·27-BUND-FERTIG` mit Sollbild «Was ist ein Gesetz bei LexMetrik» und der Messung 14.9.2026
(Detail: `fahrplaene/FAHRPLAN-BUND-FERTIG.md`). Die VPS-Bestellung rückt hinter Phase 2, der Termin
«Sonntag 13.9.2026» ist hinfällig. Der bestehende kantonale Online-Bestand bleibt bis Phase 2
unverändert; nur echte Fehler laufen übers Fehlerbuch.

**Ersetzter Wortlaut (ROADMAP.md, Zielbild-Prosa bis 14.9.2026, wörtlich):**

> **⬆ OBERSTER OFFENER SCHRITT: `W2·13-KANTONE-DATEN`** (ZH-Programm: Randtitel R1 in Landung, danach
> Tag-Leser-Rest). Block 1 gelandet 1./2.9.2026: K3 (#610), Leser-Tempo (#612), Normen-Monitor (#623) —
> deren Restlisten bleiben in den Schritten, sind nicht mehr Queue-Kopf.
> **Zielbild-Dekret 1.9.2026 (David):** der Gesetzesleser steht im Vordergrund — Ziel sind
> möglichst alle Gesetze, die ein Schweizer Jurist braucht, und der beste Gesetzesdarsteller für
> Schweizer Juristen auf dem Markt; Fundament zuerst, wo es dem Leser dient. Die `@queue` bildet
> die vier Blöcke ab: **1 Fundament** (Suche-Edge · Leser-Tempo · Normen-Monitor · Tag-Leser) →
> **2 Text-Treue Bund** (Schlusstitel/Fussnoten · Korpus-Lücken · Verweis-Schärfe · Leser-V3-Rest)
> → **2b Zulieferer-Entscheid** (`W2·21-ZULIEFERER`: OpenCaseLaw & Co. anbinden statt nachbauen? —
> Entscheid David) → **3 Kantone und Bund-Breite, nur Deutschschweiz** (Entscheid David 1.9.2026: ZH
> und BS zuerst perfektionieren, dann **Bund-Vollabdeckung SR** (`W2·5n-BUND-VOLL`, billiger als jeder
> Kanton), dann BE, AG, SG, LU mit fremdem Portal-Wissen als Vorlage und Zweitlesung; VD, GE, TI und
> fr/it-Fassungen ausdrücklich später) → **4 Differenzierung**
> (Zeitmaschine · Watchlist · Rechtsprechungs-Nachweis). Rechner, Vorlagen, Design-Wärme, FINMA
> und Prozess-Schritte ohne Vorfall sind geparkt (`zielbild-gesetzesleser`). Fokus-Dekret 24.7.2026
> bleibt darin enthalten. Wortlaute der Dekrete → `ROADMAP-CHRONIK.md`.

**Begründung der Streichung:** Der Block-Aufbau steuert nicht mehr — er nennt eine Reihenfolge, die
der Entscheid vom 14.9.2026 ersetzt hat; der Wortlaut bleibt hier erhalten, weil die
Block-1-Landungen (K3 #610, Leser-Tempo #612, Normen-Monitor #623) daran datiert sind.

## Leser-Wurzel «Anhänge» uneinheitlich für scope/decl-Sektionen — gelöst 12.9.2026 (W2·18-FEHLERBUCH)

**Ursprünglicher Befund (Wortlaut, bis 12.9.2026 offen, `W2·18-FEHLERBUCH`):** «**Leser-Wurzel «Anhänge» uneinheitlich für scope/decl-Sektionen** *(Nebenfund PR #838, 12.9.2026, gehört ins Fehlerbuch-Dach `W2·18-FEHLERBUCH`)* — die Leser-Wurzel für scope/decl-Sektionen (Geltungsbereich, CH-Erklärungen/Vorbehalte) heisst synthetisch «Anhänge»; uneinheitlich bei den 14 LUGUE-Verträgen und den 12 aus #838. §3/§8-Darstellungsschritt; Empfehlung der Gegenprüfung zu PR #838 abwarten, bevor gebaut wird.»

- [x] **Gelöst 12.9.2026, PR #840.** `gliederungsModell.ts`: die synthetische Wurzel übernimmt das
  Struktur-Sidecar-Label («Geltungsbereich» / «Geltungsbereich und Erklärungen»), wenn ausnahmslos
  jeder Beitrag die scope-Container-eId trägt; gemischt oder ohne Sidecar-Eintrag bleibt «Anhänge»
  (§8 konservativ, Empfehlung der Gegenprüfung #838 umgesetzt). Wirksam für die 12 Staatsverträge
  aus #838; LUGUE-Klasse (eId annex) unverändert. 5 Tests additiv, Rot-Beweis 2/5, Golden 256
  byte-gleich, reine Darstellung (§3).

## Wächter «rectifies-Ziel vs. Berichtigungstext» — gelöst 12.9.2026 (W2·18-FEHLERBUCH)

**Ursprünglicher Befund (Wortlaut, bis 12.9.2026 offen, `W2·18-FEHLERBUCH`):** «**Wächter «rectifies-Ziel vs. Berichtigungstext»** *(Gegenprüfung PR #827, 12.9.2026)* — Fedlex' `jolux:rectifies` kann auf das falsche AS-Dokument zeigen (AS 2025 686/SKV: Ziel AS 2025 648 = TAFV 2, im amtlichen Text steht AS 2025 644 = SKV; AS 2024 144/SSV: Sammelberichtigung mit nur einem `rectifies`). Tor: die im Berichtigungstext (Filestore-HTML, «(AS … ; SR …)») genannte AS-Fundstelle gegen das `rectifies`-Ziel messen, Abweichung als Befund listen statt in Prosa übersetzen (§7/§17; heute nur Docstring-Vermerk in `scripts/normtext/revisionen-generieren.ts`).»

- [x] **Gelöst 12.9.2026, PR #834 (`e51b5b64b`).** Netz-Arm `check:revisionen-rectifies` in der
  normen-monitor-Kette: Kopfzitate «(AS … ; SR …)» aus dem Filestore-HTML des berichtigenden AS
  gegen das rectifies-Ziel gemessen — 25 Kanten: 14 übereinstimmend · 2 abweichend (SKV oc/2025/686,
  AIG oc/2025/342 = Ziel reine Inkraftsetzungs-VO ohne Normtext; beide als belegte Fedlex-Datenfehler
  in `bibliothek/normtext/rectifies-ausnahmen.json`) · 2 Sammelberichtigungen · 7 nur doc/pdf-a
  (Nachfund-Zeile im Fehlerbuch). Ausnahmen an erwartetes Ziel + Text-Fundstelle gebunden, Abweichung
  ⇒ stale ⇒ rot (Rot-Beweis). Gegenprüfung Opus bestanden (Regex 0/18 falsch-positiv).

## Falscher Freund «BMV» im Kanton-Pfad — gelöst 12.9.2026 (W2·18-FEHLERBUCH)

**Ursprünglicher Befund (Wortlaut, bis 12.9.2026 offen, `W2·18-FEHLERBUCH`):** «**Falscher
Freund «BMV» im Kanton-Pfad** *(Fixer #823, 12.9.2026)* — `kanton/SG-3849` meint mit «BMV» die
Schutzbautenverordnung, der Normtext-Link zeigt auf die Berufsmaturitätsverordnung (Bund);
Kürzel-Auflösung im Kanton-Pfad muss kantonale Kürzel vor Bund-Kürzeln prüfen oder benannt
ausschliessen (§7).»

- [x] **Gelöst 12.9.2026, PR #833 (`5b4aa17a7`).** Root Cause zweistufig: fehlender Eintrag in
  `KUERZEL_NUR_BUND` UND eine Guard-Lücke am primären `NORM_IM_TEXT`-Anker («Art. N KÜRZEL»,
  auch Passus-Formen), die auch StG-Fehlverlinkungen in AR-621.111/AR-625.21/AI-640.000
  durchliess. Kein Link statt falscher Link (§1/§8) — korpusweites Delta StG 25 + BMV 10 in
  4 Dateien, Verweis-Basislinie nachgeführt. **Gegenprüfung bestanden** (Opus,
  `spannen.ts`/`positivliste.ts`; eigene Rot-Beweise Art. 9 BMV 1→0 und Art. 35 StG 1→0).
  **Begründung:** wörtliche Fehlerbuch-Zeile durch Fix erledigt, Überführung in die Chronik
  (Steuer-Doku-Welle 5, 12.9.2026).

## Kontext-Panel zeigt bei Finding-4b-Fällen nur `dateEntryInForce` — gelöst 12.9.2026 (W2·18-FEHLERBUCH)

**Ursprünglicher Befund (Wortlaut, bis 12.9.2026 offen, `W2·18-FEHLERBUCH`):** «**KontextPanel
zeigt bei Finding-4b-Fällen nur `dateEntryInForce`, nicht das frühere «in Kraft seit»-Datum**
*(Hinweis 3, Gegenprüfung PR #820, 12.9.2026)* — bei FZA/AS 2021 12 zeigt
`src/components/kontext/KontextPanel.tsx` (Revisions-Zeile) das «angewendet ab»-Datum
1.1.2021, ohne dass «in Kraft für die Schweiz seit 15.12.2020» sichtbar wird
(§8-Ehrlichkeit: nicht falsch, aber unvollständig für den einen Fall, wo Text-Beleg und
Datumsfeld auseinanderfallen). Beobachtung, nicht gebaut — kein Bau-Auftrag dieses Schritts.»

- [x] **Gelöst 12.9.2026, PR #832 (`66c7d74be`).** Fedlex-Graph liefert kein
  `dateApplicability`, `dateDocument` ist kein Proxy (Vollerhebung 757 Marker-Fälle, 240
  Korpus-Caches: «angewendet ab» nur bei FZA) — darum additive, amtlich belegte Whitelist
  `dateInKraftFuerCh` im Revisionen-Generator statt Heuristik (Fedlex `cc/2002/243/20201215`:
  «in Kraft für die Schweiz seit 15. Dez. 2020 und angewendet ab 1. Jan. 2021 (AS 2021 12)»),
  neue Invariante in `check-revisionen`, Hausbegriff `IN_KRAFT_FUER_CH_LABEL`, Render-Test.
  **Gegenprüfung bestanden** (Opus, Norm-Wortlaut/Breite/Determinismus/Rot-Beweis).
  **Begründung:** wörtliche Fehlerbuch-Zeile durch Fix erledigt, Überführung in die Chronik
  (Steuer-Doku-Welle 5, 12.9.2026).

## `check:schlankheit`-Restfeld adapter-lexwork.ts + KontextPanel.tsx — gelöst 12.9.2026 (W2·18-FEHLERBUCH)

**Ursprünglicher Befund (Wortlaut, bis 12.9.2026 offen, `W2·18-FEHLERBUCH`):** «**`check:schlankheit`
rot auf main: `scripts/normtext/adapter-lexwork.ts` 926 Z. (Baseline 839)** *(Nullprobe zweier Fixer
12.9.2026 auf 6aca2901e)* — §6.6-Split in Leaf-Module, Baseline nicht anheben; Risikopfad ⇒ Golden
byte-gleich + Gegenprüfung (kein Jules-Ticket). Zusätzlich seit PR #827 (12.9.2026)
`src/components/kontext/KontextPanel.tsx` 813 Z. (Schwelle 800) — reine UI-Komponente, kein
Risikopfad; Split ohne Gegenprüfungspflicht.»

- [x] **Gelöst 12.9.2026:**
  - `adapter-lexwork.ts`: 926 → **921 Z.** durch PR #828 (`bc3e65eb8`, Kanton-Fremd-Drift-Auflage
    C1) — kein Split, allein Regex-Vereinheitlichung (fr-Stand-Erkennung, ein Ausdruck statt zwei
    Alternativen) und Kommentar-Straffung; Baseline unverändert (839, erlaubt bis 922). Volles
    Nachtrags-Protokoll dieser Session: Abschnitt „Kanton-Fremd-Drift AR/BS … — gelöst 12.9.2026"
    weiter unten in dieser Datei, Nachtrag-Absatz zu Auflagen B1/B2/C1.
  - `KontextPanel.tsx`: 813 → **740 Z.** durch PR #830 (`a115a27cf`) — §6.6-Split, Revisions-
    Abschnitt als eigenes Leaf-Modul `src/components/kontext/RevisionenGruppe.tsx` ausgelagert
    (verhaltensneutral: Tests 7924/7924 grün, Golden 256 byte-gleich); zwei Datei-Wächter
    (`leser-benennung`, `design-r2d-mobil-zustaende`) additiv um das neue Modul ergänzt.
  - **Begründung:** beide Restfelder waren bereits vor dieser Buchung technisch erledigt (Commits
    liegen auf `main`); die Buchung überführt nur die noch offene ROADMAP-Fehlerbuch-Zeile in die
    Chronik. `npm run check:schlankheit` lief bei der Überführung NACKT grün: „1581 Datei(en)
    geprüft, 15 Bestands-Einträge, keine Neuzugänge/Überschreitungen über der §6.6-Schwelle
    (800 Z., Toleranz 10%)."

## Geltende BMV (SR 412.103.1) im Korpus — Wortlaut vor der Lösung + Lösung 12.9.2026 (W2·18-FEHLERBUCH)

**Ursprünglicher Befund (Wortlaut, bis 12.9.2026 offen, ROADMAP.md `QS-KORPUS`-Umfeld):**
«**Geltende BMV in den Korpus aufnehmen** — Totalrevision `cc/2025/408` (gleiche SR 412.103.1)
fehlt; Nutzer finden nur den historischen Text.» Ausführlicher in
`fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md`: «… die seit 1.3.2026 geltende Nachfolge-Verordnung
(Totalrevision `cc/2025/408`, gleiche SR 412.103.1) fehlt; Nutzer finden nur den historischen
Text. **Risikopfad** ⇒ Gegenprüfung.» Bau-Spec: `FAHRPLAN-FEDLEX-PORTFOLIO.md` §20.4
(«regulärer Bundeserlass-Ingest …, neuer Register-Key neben dem historischen `bmv`»).

- [x] **Gelöst 12.9.2026.** **Nullprobe:** Register/Snapshot führten SR 412.103.1 einzig als
  `BMV` (ELI `cc/2009/423`, Stand 2016-08-23, 37 Artikel) mit korrektem Aufhebungs-Vermerk
  (`aufgehoben.seit 2026-03-01`, Nachfolger `cc/2025/408`); der Leser zeigte Banner
  «Aufgehoben per …» plus einen **externen** Fedlex-Link auf die Nachfolgerin — der geltende
  Text selbst lag nirgends im Korpus. **Amtlich erhoben** (Fedlex-SPARQL, Abruf 12.9.2026):
  `cc/2025/408` hat genau eine Konsolidierung 2026-03-01, kein `dateNoLongerInForce`,
  `dateDocument` 2025-06-13; Taxonomie `legal-taxonomy/6599` trägt `skos:notation` **412.103.1**
  (Status CURRENT) und als `prefLabel` «Verordnung vom 13. Juni 2025 über die eidgenössische
  Berufsmaturität (Berufsmaturitätsverordnung, BMV)»; kanonische html-Manifestation über
  `isExemplifiedBy` = **html-N 0** (echt suffixlos, keine Alias-Konstruktion). Der Erlass belegt
  die Ablösung selbst: Art. 34 hebt die Verordnung vom 24. Juni 2009 auf, Art. 36 setzt den
  1. März 2026 als Inkrafttreten.
  **Schlüssel-Entscheid: neuer Key `BMV_2025` neben dem historischen `BMV`** (kein Re-Pin).
  Ein Re-Pin hätte den historischen Text ersatzlos entfernt, und die Aufhebungs-Deklaration
  (`ANERKANNTE_AUFHEBUNGEN`), der Nachfolge-Vermerk und die Wiedervorlage-Mechanik hängen an
  der ELI `cc/2009/423`. Der Key trägt das **Erlassdatum** (2025 = ELI-Jahr), nicht das
  Inkrafttretens-Jahr: er bezeichnet den Erlass, nicht seine Fassung, und bleibt über künftige
  Konsolidierungen stabil (der Fund-Text nannte `BMV_2026` als Beispiel — abweichend umgesetzt
  und offengelegt, §7). §8 in der Oberfläche: geltende Fassung auf Rang 102 neben der BBV,
  aufgehobene Fassung auf Rang 126 ans Ende der Rubrik, dort mit rotem «aufgehoben»-Marker und
  Aufhebungs-Banner.
  **Pflegeweg** (Skill `korpus-werkstatt`): Pin in `scripts/fedlex-cache.sh`
  (`bmv_2025|cc/2025/408|20260301|0|art_1,art_34,art_36|412.103.1`, Cache-Lauf «3/36 Anker +
  SR 412.103.1 geprüft») · `ERLASS_MAP` · `FEDLEX`-Schlüssel `BMV-2025` · Register-Eintrag ·
  Systematik-Gruppe «Arbeit, Bildung & Anwaltsrecht» · Audit-Klassifikation + `GRUNDART_SEED`
  (`FLACHER_KURZERLASS`, Signale generator-gemessen) · Snapshot (`--nur=bund --erlass=bmv_2025`,
  36 Artikel) · Struktur-Sidecar · PDF-Quelle · Ur-Inkrafttreten · Revisions-Sidecar ·
  Bezüge-Zähler · Historie · Suchindex · Manifest · Startseiten-Zähler. Der reine
  Datums-Churn der 227 fremden Struktur-Sidecars wurde nach der Regeln-Logik von
  `scripts/normtext/churn-reset.ts` gegen `origin/main` zurückgesetzt — der Diff trägt nur
  Substanz.
  **Verifikation:** deterministischer Volltext-Diff Snapshot ↔ amtliche Manifestation über
  **alle 36 Artikel: null Abweichung** (`scripts/analyse/gemini-diskrepanz.ts --nur-diff`);
  zusätzlich Stichprobe n=10 (Art. 1/3/5/9/14/20/27/30/34/36) mit wörtlicher
  Identitätsprüfung jedes Blocks und Aufzählungspunkts gegen die amtliche HTML-Fassung:
  **10/10**. Golden: 36 neue `bund/BMV_2025/*`-Knoten, kein fremder Knoten bewegt;
  `golden:vergleich` IDENTISCH (256 Fälle).
  **§17-Wurzelfix aus dem Bau:** die SR-Nummer ist seit dieser Totalrevision **kein eindeutiger
  Schlüssel** mehr. `lesePinsMitSr()` in `scripts/normtext/revisionen-generieren-run.ts` baute
  eine reine SR-Map — **Rot-Beweis 12.9.2026:** `SR 412.103.1 → cc/2025/408 / 2026-03-01` statt
  `cc/2009/423 / 2016-08-23`; die nächste Vollregeneration hätte dem historischen Erlass still
  ELI und Korpus-Stand seiner Nachfolgerin untergeschoben (Pfad-(a)-Stände 6 → 1,
  Sammelerlass-Marker 2013-01-01 weg, `nichtKonsolidiert` durchweg falsch). Fix: Lookup nach
  Register-key (== Pin-Name in Grossbuchstaben, Invariante des Snapshot-Generators) mit SR als
  Rückfall, plus SR-Dedupe vor der SPARQL-Abfrage (ohne sie stand die SR doppelt im
  VALUES-Block und `store-raw` wuchs von 31 auf 62 Bindings). Gegenprobe: `revisionen-raw/BMV.json`
  nach dem Fix byte-identisch zum Bestand.
  **Offener Restpunkt (gemessen, nicht geraten):** ein blosses Zitat «Art. 5 BMV» im Fliesstext
  löst über die FEDLEX-Token-Erkennung weiterhin auf den Schlüssel `BMV` = aufgehobene Fassung.
  Korpusweite Messung 12.9.2026: **null** echte Zitate der Berufsmaturitätsverordnung, also
  heute wirkungslos. Einziger «BMV»-Treffer ist `kanton/SG-3849`, wo «BMV» die *Eidgenössische
  Schutzbautenverordnung vom 27.11.1978* meint — ein falscher Freund, der schon vorher falsch
  verlinkte (eigener Befund).
  Beleg §11: `bibliothek/register/bmv-totalrevision-2026-09-12.md`.
  **Gegenprüfung ausstehend, noch nicht gemergt.**

## Kanton-Fremd-Drift AR/BS (26 Erlasse) + Vollabdeckungs-Tor — gelöst 12.9.2026 (W2·18-FEHLERBUCH)

**Ursprünglicher Befund (Wortlaut, bis 12.9.2026 offen, `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md` §1,
Fund #694):** «**Kanton-Fremd-Drift 19 Struktur-Sidecars** — BS Bürgerrechtsgesetz Stand 1.7.2026,
AR/BS-PDF-Versionen; Drift-PR. `confidence.json` seit 23.6. stale (150/1565).»

- [x] **Gelöst 12.9.2026, PR fix/kantondrift:**
  - **§6.7-Nullprobe zuerst:** `check:struktur-konsistenz` (nur Sidecar↔Snapshot-Konsistenz,
    keine Fassungsprüfung) und `check:normtext-netz` (Kanton-Drift-Ast) liefen NACKT — beide grün,
    0 Drift gemeldet, obwohl BS-121.100 (Bürgerrechtsgesetz) live seit 1.7.2026 in neuer Fassung
    steht (per LexWork-API bestätigt: `version_uid` 81ce1fd9… ≠ Snapshot 6793e446…, Snapshot-Stand
    2018-01-01). Ursache gefunden: `check-drift.ts`s Kanton-Drift-Prüfung liest ihre Gruppen aus
    `sammleKantonInventar()`, das **nur tarif-zitierte LexWork-Erlasse** liefert — empirisch 69 von
    1189 committeten LexWork-Kanton-Snapshots (Nullprobe 12.9.2026). Ein Erlass ohne Tarif-Zitat
    driftet dadurch strukturell unbemerkt gegen die amtliche Fassung — ein Tor, das nicht scheitern
    kann (§6.7).
  - **Tor-Ast ergänzt (Wurzel-Fix, kein Sonderfall AR/BS):** neue Funktion
    `sammleKantonVollinventarLexWork()` (`scripts/normtext/inventar-kanton.ts`) liest statt der
    Tarif-Tabellen den GESAMTEN committeten `public/normtext/kanton/*.json`-Bestand und liefert eine
    Gruppe je LexWork-Erlass (keine Artikel-Filterung nötig — der Drift-Vergleich braucht nur
    kanton/host/lang/lawId). `check-drift.ts` bildet die Vereinigung aus Tarif-Gruppen und
    Vollinventar (dedupliziert). Rot-Beweis 12.9.2026: `check:normtext-netz` prüfte danach 1185
    statt 69 Kanton-Gruppen und fand **exakt 26 driftende AR/BS-Erlasse** — deckungsgleich mit einer
    unabhängigen Handmessung gegen die LexWork-API. Kosten: läuft nur im wöchentlichen
    `normen-monitor.yml` (NICHT PR-CI), zusätzliche Netzlast dort einkalkuliert.
  - **Content-Generator-Lücke geschlossen:** `normtext-snapshot.ts --nur=kanton --kanton=…
    --discovery` kannte bisher NUR Kanton-Granularität — ein erster Testlauf ohne Filter hätte alle
    1124 committeten AR/BS-Dateien angefasst (Datums-/Feature-Churn statt eines chirurgischen
    Diffs, git-revertiert statt committet). Neuer, wiederverwendbarer `--nur=<KEY[,KEY2]>`-Filter
    (`parseKantonNurFilter()` in `inventar-kanton.ts`, analog zum bestehenden `--nur=` bei
    struktur-run.ts/struktur-kanton-run.ts) regeneriert seither erlassgenau. Golden/Register-Diff
    danach exakt 26 Kanton-Dateien + `register.json` + `golden/normtext-snapshot.json` — für keinen
    anderen der 1124 AR/BS-Erlasse eine Änderung (verifiziert per Key-für-Key-Vergleich alt/neu).
  - **Nachgeführt:** die 26 driftenden Erlasse (Inhalt aus derselben LexWork-API, die auch den
    Drift meldete) + `normtext:struktur-kanton --nur=<...>` (26 Sidecars) + zusätzlich
    `BS-BaB 152.100` in `public/normtext/pdf-quellen.json` (`gen:pdf-quellen -- --nur=kanton
    --kanton=AR,BS`, kantonsscharf statt Vollkorpus) — die im Fund explizit erwähnte
    «AR/BS-PDF-Versionen»-Drift, unabhängig von den 26 Content-Treffern. Downstream-Artefakte
    (`daten-manifest.json`, `messwerte/verweis-inventar.json`, `public/materialien/deckungs-sicht.json`,
    `public/feed/erlasse.xml`, `src/data/startseiteZaehler.generated.ts`) über ihre jeweiligen
    Generatoren mitgezogen (§5, keine Hand-Edits). Stichprobe: 3 Paragraphen je nachgeführtem
    Erlass (81 Stellen total) gegen die live LexWork-API — 81/81 Identitäts-Treffer.
  - **`confidence.json` (150/1565 stale seit 23.6.):** kein totes Werkzeug — `report:confidence`
    ist bewusst nicht verdrahtetes, aktiv dokumentiertes Treue-Gate (QS-CONFIDENCE-EHRLICH,
    8.8.2026) und bereits als **eigener** ROADMAP-Schritt erfasst (`ROADMAP.md`, Befund PR #668,
    4.9.2026: neu erzeugen + Quarantäne-Liste sichten + Tor-/Wächter-Entscheid). Hier bewusst NICHT
    mitregeneriert — ausserhalb der Kanton-Struktur-Whitelist dieses Fixes und ein eigener,
    grösserer Entscheid (Schwelle/Wächter-Art), keine Drift-Reparatur. Nebeneffekt dieses PRs: die
    Differenz wächst geringfügig (1566 statt 1565 Erlasse insgesamt) — ändert nichts an der
    anstehenden Entscheidung.
  - **Bewusst offen gelassen (Nebenfund, nicht Teil dieser Bau-Einheit):** `check:schlankheit`
    zeigt `scripts/normtext/adapter-lexwork.ts` bereits auf unverändertem `origin/main` rot (926 Z.,
    Baseline 839, erlaubt bis 922 — per Nullprobe/`git stash` bestätigt, VOR dieser Session
    entstanden). `scripts/normtext-snapshot.ts` wäre durch den neuen `--nur`-Filter ebenfalls über
    die Schwelle gerutscht (1736→1761 Z., erlaubt bis 1747) — hier behoben durch Auslagern der
    Filter-Logik nach `inventar-kanton.ts` (1743 Z., unter der Schwelle), OHNE Baseline-Bump.
    `adapter-lexwork.ts` bleibt ein eigener, unabhängiger §17-Befund für eine künftige Session
    (Datei splitten oder Baseline bewusst mit Begründung heben).
  - Alle Tore grün ausser den beiden erwarteten: `check:gegenpruefung` (wartet auf die
    Pflicht-Gegenprüfung, wird vom Orchestrator dispatcht) und das oben dokumentierte, aus main
    ererbte `check:schlankheit`-Restfeld (adapter-lexwork.ts). Wortlaut: ROADMAP-CHRONIK.md (dieser
    Eintrag).

**Nachtrag 12.9.2026 (Gegenprüfung PR #828, Auflage A1 — Wortlaut ergänzt, nicht ersetzt, §2b):**
`sammleKantonVollinventarLexWork()` leitete `lawId` allein aus dem Snapshot-`id`-Pfad ab; bei den
vier zweisprachigen Erlassen (FR-130.11-de/-fr, VS-173.8-de/-fr) trägt dieser Pfad den Sprachsuffix,
die LexWork-API-URL nicht → Netz-Abruf HTTP 404, von `check-drift.ts` als transiente WARNUNG (exit 0)
klassiert — Drift dieser vier wäre unsichtbar geblieben. Fix: neues Feld `fetchLawId` (suffixfreie,
URL-taugliche Form, gesetzt nur wenn sie vom Bestands-Key abweicht) in `inventar-kanton.ts`,
konsumiert in `check-drift.ts` UND in `normtext-snapshot.ts`s `erzeugeKantonsSnapshots` (Content-
Generator hatte denselben Bug). Rot-Beweis: `check:normtext-netz` vorher 1185 Kanton-Gruppen/4
Netz-Warnungen (HTTP 404 FR-130.11-de/-fr, VS-173.8-de/-fr) → nachher 1189 Gruppen/0 Warnungen, 0 Drift.
Nebenfund gleichen Mechanismus (§8): `inKraftSeit()` (adapter-lexwork.ts) kannte für die
französische «ohne le»-Form («en vigueur depuis DD.MM.YYYY») keinen optionalen Doppelpunkt — lex.vs.ch
liefert «en vigueur depuis: DD.MM.YYYY» (VS-173.8-fr), das Muster traf nicht und fiel still auf
`enactment` zurück; VS-173.8-fr zeigte dadurch `stand: 2011-01-01` statt amtlich `2025-01-01` (Token
unverändert — reiner Stand-Fehler). Regex um `\s*:?\s*` ergänzt (analog zum deutschen Muster), Rot-
Beweis per Vitest-Regressionsfall (`inKraftSeit` liefert jetzt `2025-01-01`), Snapshot chirurgisch
nachgeführt (`--nur=VS-173.8-fr`, EINE Datei + register.json + Struktur-Sidecar geändert, Stichprobe
2 Paragraphen live 2/2 Identität). Dabei entdeckter Zusatz-Bug (§17, in derselben Auflage behoben):
die kantonsweiten HTM/ZH/PDF-Phasen kannten `--nur=<KEY>` nicht und regenerierten beim ersten
Testlauf ungewollt auch fremde Erlasse desselben Kantons (VS-1413) — Guard `nurUeberspringt` ergänzt,
git-revertiert vor dem Commit. `adapter-lexwork.ts` bleibt bei 928 Z. (vorher 926, weiterhin über der
Baseline-Schwelle, s. o. — die zwei zusätzlichen Zeilen sind die Regex-Begründung dieses Fixes).
Tore erneut nackt gefahren: `check:struktur-konsistenz`, `check:normkeys-kanton`, `check:datenhaltung`,
`check:paritaet`, `check:normtext-netz`, `golden:vergleich`, `tsc -b`, `lint`, vitest (7905 Tests,
davon 3 neu für A1) — alle grün ausser dem unveränderten `check:gegenpruefung`/`check:schlankheit`-Paar.

**Nachtrag 12.9.2026 (Nachprüfung PR #828, Auflagen B1/B2/C1 — Wortlaut ergänzt, §2b):** B1 bestätigte
dieselbe fr-Stand-Bugklasse UID-identisch in zwei weiteren VS-Snapshots (`VS-178.104.json`: committet
2009-01-01, amtlich 2011-01-01; `VS-211.611.json`: committet 2015-01-02, amtlich 2025-10-01) —
`inKraftSeit()`s Regex war für BEIDE bereits durch den A1-Fix ausreichend (liefert korrekt 2011-01-01/
2025-10-01), reiner Zeit-Nachzug per `--nur=VS-178.104,VS-211.611`; zusätzlich `en vigueur dès:
DD.MM.YYYY` (ohne «le», mit Doppelpunkt) additiv abgedeckt, obwohl real noch nicht beobachtet — die
vereinheitlichte Regex (EIN Ausdruck statt zwei Alternativen, Nebeneffekt: `adapter-lexwork.ts` sank
dadurch auf 921 Z., C1 damit erledigt, s. u.) deckt «depuis»/«dès» ohnehin gemeinsam ab. B2 deckte einen
eigenen Bug auf: `sammleKantonVollinventarLexWork()` liess `erlassName`/`erlassNr` leer (Konstanten),
`erzeugeKantonsSnapshots` baut daraus aber die Systematiknummer-Klammer — VS-173.8-fr verlor durch den
A1-Regen die Nummer (`erlass` «…, LTar» statt «…, LTar (RS 173.8)», `register.json` `sr: null`).
Root-Fix NICHT «vom eigenen Snapshot zurückparsen» (der historische Wert von VS-173.8-fr selbst trug
fälschlich «SR» statt «RS» — vermutlich aus der Tarif-DE-Gruppe kopiert, als beide Sprachen einst in
einem Lauf kombiniert wurden), sondern MEHRHEITS-Präfix aus den GESCHWISTERN desselben (Kanton,
Sprache) (VS-178.104/-211.611/-643.1-fr tragen alle «RS»), kombiniert mit der amtlichen
Systematiknummer (URL-lawId, die stimmt immer) — «geprüft, nicht geraten». Bestätigt an FR-130.11:
DE→«SGF 130.11», FR→«RSF 130.11» (kanton-eigene Abkürzung, kein generisches SR→RS). Rot-Beweis-Test
(vorher: `erlassNr` für JEDE Vollinventar-Gruppe `''`) + gezielter Test (VS-173.8-fr/-de exakte Werte).
VS-173.8-fr neu erzeugt (`erlass` trägt «(RS 173.8)» wieder, `register.json sr: "RS 173.8"`), Feed/
Manifest nachgezogen. C1: `adapter-lexwork.ts` 928→**921 Z.** (Baseline 839, erlaubt 922) —
`check:schlankheit` wieder VOLLSTÄNDIG GRÜN (nicht nur «nicht schlechter als main [926]»), ohne Split
und ohne Baseline-Anhebung, allein durch die Regex-Vereinheitlichung (B1) und Kommentar-Straffung.
Stichproben: VS-178.104/-211.611 je 1 Paragraph live — 2/2 Identität. Tore erneut nackt: `tsc -b`,
`lint`, `check:struktur-konsistenz`, `check:normkeys-kanton`, `check:datenhaltung`, `check:paritaet`,
`check:normtext-netz` (1189 Gruppen, Drift 0, 0 Warnungen), `check:golden-normtext`, `golden:vergleich`
(256 identisch), `check:perf-budget`, vitest (7909 Tests, 4 neu) — alle grün ausser dem unveränderten
`check:gegenpruefung` (wartet auf Orchestrator-Dispatch).


## `normtext:struktur`-Erlassfilter + Pin-Sonde auf drei Konsumenten ausgeweitet — gelöst 12.9.2026 (W2·18-FEHLERBUCH)

**Ursprünglicher Befund (Wortlaut, bis 12.9.2026 offen, `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md` §4,
«Nebenfunde Nacht 5.9.2026», Gegenprüfungen #679/#691/#694/#695):**
«**`normtext:struktur` ohne Erlass-Filter** — je Lauf 227 `erzeugt`-Felder (Churn); `--nur=<key>`
analog `--nur=bund`.» sowie «**§17 /tmp-HTML-Cache invalidiert nicht bei Re-Pin** —
`struktur-run.ts:61` refetcht nur bei Abwesenheit, `normtext-snapshot.ts:387` nur bei <20 KB;
Generator stempelt neuen `fassungsToken` auf alten Text (Beleg DBG #695). Wurzel:
Cache-Schlüssel um fassungsToken/html-N. Dazu (§6.7): `check-struktur-konsistenz.ts` vergleicht
nur Artikel-Keys, nicht `stand`/`fassungsToken`.»

- [x] **Gelöst 12.9.2026, PR fix/strukturfilter:**
  - **Erlass-Filter** (`scripts/normtext/struktur-run.ts`): `--nur=<KEY[,KEY2]>` — dieselbe
    Filterform wie `struktur-kanton-run.ts`/`revisionen-generieren-run.ts`. Nullprobe:
    Breitband-Lauf (`npm run normtext:struktur -- --datum=…`) berührt alle 227 Bund-Sidecars
    (`git status` 227 Treffer), `--nur=OR` genau `OR.json`.
  - **Churn-Wurzel behoben** (nicht nur umschifft, §17): `sollSchreiben()` stempelt `erzeugt`
    nur, wenn sich Struktur/Kopf/Fussnoten inhaltlich geändert haben — reine Datums-Churn-Regel
    wiederverwendet aus `scripts/normtext/churn-reset.ts` (`istReinerDatumsChurn`, dieselben
    Felder `erzeugt`/`abgerufen`) statt zweimal definiert. Empirisch belegt: `OR.json` zweimal
    mit `--nur=OR` gebaut, zweiter Lauf mit einem ANDEREN `--datum` (2026-09-12 → 2026-09-13) —
    Datei nach dem zweiten Lauf byte-identisch zum ersten (kein `erzeugt`-Sprung).
  - **Pin-Sonde ausgeweitet** (§17, Gegenprüfung #808 Auflage B4): geprüft, ob die drei
    genannten Stellen den /tmp-Cache weiterhin ohne die in PR #808 gebaute Pin-Identitäts-Sonde
    (`scripts/normtext/cache-pin-befund.ts`, `pinBefund`) lasen — ja, alle drei nur `existsSync`.
    Dieselbe Sonde eingebaut: `struktur-run.ts` (neue `cacheGueltig()`, PLUS Pin-Nachzug nach dem
    Fetch mit `warFrischGeschrieben`/`pinIdentitaet` — ohne den Nachzug hätte kein Cache je wieder
    als gültig gegolten, im ersten Testlauf dieses Fixes selbst als Rot-Beweis erlebt: alle 227
    Erlasse fälschlich «ohne verwertbaren Cache»), `check-vollstaendigkeit.ts:392`,
    `check-p-klassen.ts:106`. Statt eines Cache-Schlüssel-Umbaus (invasiv, hätte
    `fedlex-cache.sh`/`normtext-snapshot.ts` global berührt, ausserhalb der Whitelist dieser
    Bau-Einheit) wird damit dieselbe, bereits gebaute Sonde konsequent wiederverwendet (§5).
  - **§6.7-Ast ergänzt** (`check-struktur-konsistenz.ts`): `standDriftBefund()` vergleicht
    zusätzlich zu den Artikel-Keys `stand`/`fassungsToken` zwischen Snapshot und Sidecar — deckt
    den Fall ab, dass der Generator einen neuen `fassungsToken` auf unverändertem Artikel-Bestand
    stempelt (Beleg DBG #695), was der reine Key-Vergleich übersah. Additiver Rollout (wie `kl`,
    W2·5i): nur ein Befund, wenn BEIDE Seiten die Felder tragen — ältere Sidecars ohne die Felder
    werden nicht rückwirkend rot, sie erhalten `stand`/`fassungsToken` beim nächsten regulären
    `normtext:struktur`-Lauf (`struktur-run.ts` stempelt sie ab sofort, aus dem zugehörigen
    Snapshot gelesen).
  - **Werkzeug-Falle gefunden und dokumentiert** (eigener §17-Fund dieser Session, kein Vorfalls-
    Fahrplaneintrag nötig, da sofort selbst gefixt): ein CLI-Guard `process.argv[1]` zur
    Testbarkeit (`if (istCliLauf) main();`) ist unter `vite-node` BLIND — `process.argv[1]` zeigt
    dort auf das `vite-node`-Binary, nicht auf die Zieldatei, wodurch `npm run
    normtext:struktur`/`check:struktur-konsistenz` wortlos exit 0 liefen (still, ohne main()).
    Fix: Guard auf `!process.env.VITEST` umgestellt (Vitest setzt die Variable in jedem
    Testprozess zuverlässig; vite-node/tsx/node nie) — vor dem Fix am eigenen Testlauf reproduziert.
  - **Rot-Beweis vorher** (Unit-Tests, alle vorher rot demonstriert per `git stash` auf den
    Quelldateien): `src/tests/normtext-struktur-run-logik.test.ts` (`parseNurFilter`,
    `sollSchreiben`, `cacheGueltig` — 13 Fälle), `src/tests/normtext-struktur-konsistenz-stand.test.ts`
    (`standDriftBefund` — 6 Fälle). Alle 19 grün nach dem Fix; `npm run check:struktur-konsistenz`,
    `check:vollstaendigkeit`, `check:p-klassen`, `check:golden-normtext`, `golden:vergleich` grün
    auf dem committeten Bestand; `tsc -b`/`lint` grün. `git status` bei Abschluss ohne
    `public/**`-Diff (alle Experimentalläufe per `git checkout` zurückgesetzt).
## `standRechtsprechung` = max(abgerufen) statt Register-Erzeugungsdatum — 12.9.2026 (#691, W2·18-FEHLERBUCH)

**Ursprünglicher Befund (Wortlaut, bis 12.9.2026 offen, `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md` §1):**
«**`standRechtsprechung` = Erzeugungs- statt Abrufdatum** (#691, latent, nirgends gerendert) —
Stand aus max(abgerufen) (§8).»

- [x] **Gelöst 12.9.2026.** Nullprobe: `scripts/gen-startseite-zaehler.ts:205` (vor dem Fix) las
  `standRechtsprechung: r.erzeugt` — `r.erzeugt` ist `public/rechtsprechung/register.json`s
  Top-Level-Feld, das `entscheide-schreiben.ts` bei JEDEM (auch partiellen) Registerlauf auf das
  globale `--datum` setzt, unabhängig davon, ob überhaupt ein Entscheid neu abgerufen wurde — ein
  Bau-Zeitstempel, keine Inhaltsangabe. **Die Klammer «nirgends gerendert» stimmte am 5.9.2026 bei
  Fund-Erfassung, ist seit dem D8-Umbau vom 6.9.2026 aber überholt** (Beleg altert nicht, wird nur
  ergänzt, §2b): `src/components/ui/KorpusStand.tsx` bildet seither `[standGesetze,
  standRechtsprechung, standMaterialien].filter(Boolean).sort().at(-1)` und zeigt das Resultat als
  «Register erzeugt am …» in Topbar, Sidebar und Shell — der Wert ist seit 6.9. live gerendert.
  **Fix:** neuer Helfer `scripts/startseite-zaehler-stand.ts` (keine Top-Level-Seiteneffekte, damit
  isoliert testbar) mit `berechneStandRechtsprechung(entscheide, liesAbgerufen)` — filtert
  Nicht-Verweise mit eigener `datei`, liest je Snapshot dessen eigenes `erzeugt`-Feld (das
  `entscheide-schreiben.ts` beim Schreiben bereits auf `snap.abgerufen` setzt — Stichprobe 30/30
  ohne Abweichung geprüft) und nimmt das lexikografische Maximum (`juengstes`, dieselbe
  ISO-Tag-Regel wie bei `standGesetze`/`standMaterialien`). Fallback auf `r.erzeugt` nur bei
  vollständig leerem Bestand (Typ bleibt `string`, kein API-Bruch — ein solcher Bestand reisst
  ohnehin `check:entscheide`s Mindestzahl-Tor). **Rot-Beweis** (Fixture: reales Register mit
  fingiertem `erzeugt: '2099-01-01'` gegen den echten Snapshot-Bestand): ALT lieferte `2099-01-01`
  (kein einziger Entscheid wurde 2099 abgerufen), NEU lieferte `2026-09-12`. **Determinismus-Beleg
  am realen Korpus:** der reale Wert blieb vor/nach dem Fix identisch `2026-09-12`, weil derselbe
  Tag tatsächlich der jüngste echte Abruf war (kein Zufall der Formel, sondern Koinzidenz der
  Daten) — `git diff` an `src/data/startseiteZaehler.generated.ts` zeigt für dieses Feld nur den
  Doc-Kommentar geändert, den Wert unverändert. 7 neue Vitest-Fälle
  (`src/tests/startseite-zaehler-stand-rechtsprechung.test.ts`): Maximum über mehrere Daten,
  Verweise werden übersprungen (Datei nie gelesen), fehlendes `datei`-Feld wirft nicht,
  ungültige/leere Abrufdaten fallen weg (§8), leerer Bestand ⇒ `null`, Determinismus (gleiche
  Eingabe → gleiches Ergebnis, kein `Date.now()`, §2). Tore: `check:zaehler`, `check:feed`,
  `check:datenhaltung`, `golden:vergleich` (256 Fälle byte-gleich), `check:gegenpruefung` (grün —
  keine Risiko-Datei berührt), Lint (0 Fehler), `npx tsc -b` — alle grün.

## `nichtKonsolidiert`-Marker falsch-positiv (FZA) — Wortlaut + Fix 12.9.2026 (PR #820, Gegenprüfung ausstehend — nicht gemergt)

**Ursprünglicher Befund (Wortlaut, W2·18-FEHLERBUCH #19 / FAHRPLAN-OFFENE-BEFUNDE.md:203,
Gegenprüfung S3 16.8.2026):** «`nichtKonsolidiert`-Marker bei Staatsverträgen
falsch-positiv (FZA)» — `scripts/normtext/revisionen-generieren.ts:233` setzte
`dateForce > korpusStand`, kannte aber «in Kraft ≠ angewendet ab» nicht.

- [x] **Gefixt 12.9.2026, PR #820, Gegenprüfung ausstehend — nicht gemergt:** Amtlich
  live nachvollzogen (Skill `scraping-swiss-official-sources`, abgerufen 12.9.2026):
  SPARQL bestätigt, dass die FZA-Konsolidierung `eli/cc/2002/243/20201215`
  (SR 0.142.112.681) noch die AKTIVE Fassung ist (`dateApplicability=2020-12-15`, kein
  `dateEndApplicability` — es existiert bis heute KEINE neuere Konsolidierung). Deren
  DE-XML (aufgelöst über `isRealizedBy→isEmbodiedBy→isExemplifiedBy`) zitiert bereits
  per `<ref href="https://fedlex.data.admin.ch/eli/oc/2021/12">`: „… Art. 1 des
  Beschlusses Nr. 1/2020 des Gemischten Ausschusses vom 15. Dez. 2020, in Kraft für die
  Schweiz seit 15. Dez. 2020 und angewendet ab 1. Jan. 2021 (AS 2021 12)." —
  `jolux:dateEntryInForce` dieser oc-URI ist jedoch 2021-01-01 (das «angewendet
  ab»-Datum, nicht das «in Kraft seit»-Datum), was den reinen Datumsvergleich in die
  Irre führte.
  Wurzel-Fix: `belegtImXml()` (reine Funktion) + Netz-Helfer `ermittleBelegteOcs()`/
  `loeseKonsolidierungsXmlUrl()` (`scripts/normtext/revisionen-generieren.ts`) prüfen,
  ob die oc-URI eines `nichtKonsolidiert`-Kandidaten NEBEN der Wendung «angewendet ab»
  im Konsolidierungstext zitiert ist; `baueRevisionen()` bleibt rein (`belegteOcs`-Set
  injiziert), der Netz-Schritt lebt im Runner und wird per store-raw (`belegteOcs`-Feld)
  deterministisch re-parsebar abgelegt (kein zweiter Live-Fetch in
  `check-revisionen.ts`). Rot-Beweis vorher: Unit-Tests (`belegtImXml` × 4,
  `baueRevisionen`-Fall FZA) schlugen fehl, bevor die Funktionen existierten
  (`normtext-revisionen.test.ts`).
  **Verworfene erste Fassung, gegen einen Fund-Fehlschluss korrigiert (§0 Regel 3, noch
  in derselben Session):** eine erste Version prüfte nur die blosse href-Präsenz und
  stufte dabei zusätzlich zwei KLV-Einträge (SR 832.112.31, `eli/oc/2025/852`/
  `eli/oc/2026/348`) fälschlich als «bereits konsolidiert» ein. Live-Gegenprobe am
  KLV-Konsolidierungstext (`eli/cc/1995/4964_4964_4964/20260801`) zeigte: die href kommt
  dort in einer reinen Änderungs-HISTORIE vor bzw. bei einem NUR TEILWEISEN
  Inkrafttreten («Abs. 1 Bst. a und c in Kraft seit 1. Aug. 2026 … Die anderen
  Bestimmungen treten zu einem späteren Zeitpunkt in Kraft.») — der Marker war dort
  korrekt, «angewendet ab» kommt im gesamten KLV-Text kein einziges Mal vor (0 Treffer,
  gegen 1 Treffer im FZA-Text, direkt bei der fraglichen href). Der Fix verlangt daher
  zusätzlich, dass die Wendung «angewendet ab» in der Nähe der href steht — das ist das
  Fedlex-Vokabular für genau die in §7-Auftrag beschriebene «in Kraft ≠ angewendet
  ab»-Konstellation, keine blosse Nachbarschaft.
  **Vollerhebung** (Netz-Lauf über die volle Grundmenge, 227 Erlasse,
  `--datum=2026-09-12`): 96 `nichtKonsolidiert`-Marker gesamt, davon 34 `art=aenderung`
  mit AS-Fundstelle (prüfbar) und 62 `sammelerlass-marker` ohne AS-Fundstelle (kein
  Text-Beleg gegen eine konkrete oc-URI möglich — ausserhalb der Reichweite dieses
  Fixes). Von den 34 geprüften trägt GENAU EINER (FZA/`eli/oc/2021/12`) die
  «angewendet ab»-Signatur; alle übrigen 33 (inkl. der beiden KLV-Kandidaten) bleiben
  zu Recht `nichtKonsolidiert`. Nur FZA wurde regeneriert und committet — kein
  Blanket-Re-Run über den ganzen Korpus; die übrigen 226 Sidecars bleiben byte-gleich
  (kein Golden-Diff ausserhalb des einen korrigierten Erlasses).
  Nebenpunkte des Fund-Wortlauts NICHT Teil dieses Fixes (offen, ggf. eigener
  Folgeschritt): `revisionen.ts:130`-Kommentar (BMV-Begründung) berichtigen; Warnung in
  den Prerender-Standausweis (`seo-detail.ts`) übernehmen.
  Tore: `check:revisionen` grün (227 Sidecars, 5151 Einträge) · `check:normtext`
  (offline) grün (25404 Snapshots) · `check:golden-normtext` grün (60283 Knoten, 0
  Waisen) · `check:historie` grün (209 Shards synchron) · `check:datenhaltung` grün
  (nach `datenhaltung:build` + `datenhaltung:manifest`) · `check:paritaet` grün (9194
  Dateien byte-gleich) · `golden:vergleich` IDENTISCH (256 Fälle) · `npx tsc -b` sauber ·
  `lint` 0 Fehler (1 vorbestehende, unrelated Warning) · `vitest
  normtext-revisionen.test.ts` 18/18 grün.
## Entscheid-Datumsfehler `bge_151_II_475` — Wortlaut vor der Lösung + Lösung 12.9.2026 (W2·18-FEHLERBUCH)

**Ursprünglicher Befund (Wortlaut, bis 12.9.2026 offen, ROADMAP.md `W2·6-B`-Umfeld):**
«**Entscheid-Datumsfehler bereinigen** — `bge_151_II_475` trägt 1999 statt 2025; Register-Sweep
nach weiteren Band/Jahr-Diskrepanzen.» Ausführlicher in `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md`
§4: «**Entscheid-Datumsfehler im Rechtsprechungs-Register bereinigen** — `bge_151_II_475` trägt
1999 statt 2025; Datum gegen bger.ch verifizieren, in der Pipeline-Quelle korrigieren (nie im
Projektions-JSON, §5), Register-Sweep nach weiteren Band/Jahr-Diskrepanzen, Projektion neu
erzeugen. **Risikopfad** ⇒ Gegenprüfung.»

- [x] **Gelöst 12.9.2026 (Finder-Fund 12.9.2026, Fix-Session gleichentags):** Nullprobe bestätigte
  den Fund im Snapshot (`public/rechtsprechung/bund/bge/151_II_475.json`, `datum: "1999-06-21"`,
  `azaUrteil: null` — Auszug-only). **Amtlich verifiziert** (bger.ch clir,
  `search.bger.ch/ext/eurospider/live/de/php/clir/...highlight_docid=atf://151-II-475:de`, Abruf
  12.9.2026): «151 II 475 — 2C_64/2023 vom 26. November 2024»; aktuelle OCL-`decision_date`
  (`mcp.opencaselaw.ch/api/decisions/bge_151%20II%20475`) stimmt damit überein. Das persistierte
  1999-06-21 ist das Datum des in der Regeste zitierten Luftverkehrsabkommens («Accord conclu le
  21 juin 1999 …»), nicht des Urteils — ein OCL-`decision_date`-Fehlwert, wie ihn
  `adapter-entscheide.ts` für genau diese Bande-Familie (Band 151 → 2025) bereits kennt und seit
  ec5ac2211 (5.7.2026) über die Bandjahr-Regel abfängt. **Die eigentliche Wurzel lag aber NICHT
  mehr im Adapter**, sondern im Refresh-Orchestrator `scripts/normtext-entscheide.ts`: der
  B1-Zweig von `--regeste-refresh` (aza-Nachresolution der BGE ohne Vollurteil) verwarf ein frisch
  geholtes Ergebnis, sobald es Auszug-only blieb (`if (neu?.azaUrteil) byId.set(...)`) — der
  korrigierte Datums-Fallback wurde dadurch berechnet, aber nie geschrieben, und der Fehlwert vom
  Bau vor dem 5.7.-Fix (Datei-`abgerufen`: 2026-06-29) blieb über zwei additive Nachpflege-Läufe
  (faed1f48c 5.7., d47234add 28.7. — beide bewusst additiv, rührten `datum` nicht an) unverändert
  stehen. Zusätzlich fehlte im B1-Zweig die clir-Kopf-Datumsanreicherung (`holeClirHtml` +
  `parseClirUrteilskopf`), die der Band-Nachzug (`--bge-baender`) bereits nutzt. **Fix:** (1) B1
  übernimmt jetzt jedes erfolgreich geholte Ergebnis, auch Auszug-only (nur ein gescheiterter Fetch
  lässt den Bestand unangetastet); (2) B1 holt vorab denselben clir-Kopf wie `--bge-baender`.
  Effekt beim erneuten Lauf: der aza-Resolver löste `2C_64/2023` diesmal sogar vollständig auf
  (Inversions-Schutz griff nicht mehr) — der Entscheid trägt jetzt das echte Vollurteil samt
  Datum 2024-11-26, Besetzung und Zitaten statt nur des Sammlungs-Auszugs. **Vollerhebung**
  (Skript gegen den ganzen BGE-Bestand, Regel Bandjahr−Jahr(datum) > 5): 1259 amtliche BGE geprüft,
  genau 1 Treffer — nur dieser Fund; nach dem Fix 0 Treffer. **Dauer-Tor ergänzt:**
  `check:entscheide` prüft neu je BGE die Bandjahr-Plausibilität (dasselbe ±5-Jahr-Fenster wie der
  aza-Resolver) und schlägt hart fehl, wenn ein `decision_date` mehr als 5 Jahre vor dem
  BGE-Bandjahr liegt — Rot-Beweis vor dem Fix erbracht (exakt dieser eine Treffer, exit 1), grün
  danach. Regeneration ausschliesslich über den Pflegeweg (Adapter-Funktionen, `schreibeKorpus`),
  kein Hand-Edit im Artefakt (§5); reiner `erzeugt`-Zeitstempel-Churn in unbeteiligten Shards wurde
  vor dem Commit verworfen (bekanntes Muster, vgl. `normtext:struktur`-Churn-Befund). **Nachtrag
  Gegenprüfung 12.9.2026 (A1+A2, PR #816):** A1 — der B1-Zweig übernahm ein frisches Ergebnis bis
  dahin bedingungslos; bei einer Netzstörung im clir-Fetch hätte das ein bereits exaktes
  Bestandsdatum durch den Bandjahr-Platzhalter ersetzt (1254/1259 BGE tragen exakte Daten, das
  Fenster-Tor ist dafür blind). Fix: geteiltes, unit-getestetes Modul
  `scripts/normtext/bge-bandjahr.ts` (`verschlechtertDatum` als Übernahme-Gate,
  `src/tests/entscheid-bandjahr.test.ts`). A2 — gezielter Nachlauf für die 5 «weiterhin Auszug»
  gebliebenen BGE, amtlich verifiziert: `151 I 73`/`151 II 710`/`152 V 20` voll aufgelöst,
  `151 III 336` Datum gehoben (Auszug bleibt, aza-Kandidat kürzer als Auszug), `152 V 2` NEUER
  Befund — OCLs eigener Basis-Record ist bei full_text/docket_number_2/decision_date komplett mit
  `152 V 20` konfliert (nicht nur die aza-Auswahl); auf Bandjahr-Platzhalter zurückgestuft,
  Content-Korrektur bleibt eigener offener Befund (`fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md`).
  **Nachtrag Delta-Prüfung 12.9.2026 (B, PR #816):** der A1/A2-B1-Lauf hatte
  `regeste.sprachfassungen` (dreisprachig, B2/A18) bei allen 6 angefassten BGE verloren — der
  B1-Zweig ERSETZTE den Bestandseintrag durch das frische `holeBgeLeitentscheid`-Ergebnis, das
  dieses Feld nicht trägt (kommt aus `holeRegesteSprachfassungen`, anderer Refresh-Zweig; korpusweit
  1258→1252 mit Sprachfassungen). Fix: neues Modul `entscheide-b1-merge.ts`
  (`mergeB1Ergebnis`, unit-getestet, Rot-Beweis erbracht) — übernimmt `alt.regeste.sprachfassungen`
  in `neu`, wenn `neu` selbst keine trägt und der flache Regeste-Text unverändert ist. Neuer Wächter
  in `check:entscheide`: amtlicher BGE mit Regeste ohne sprachfassungen ⇒ FEHLER (Ausnahme
  `bge_149_IV_1`, dokumentiert seit 5.7.2026). Die 6 Einträge aus dem unveränderten
  origin/main-Bestand gemergt (kein Neu-Abruf, Text-Gleichheit geprüft); Vollerhebung 1258/1259.
  **A3:** `bge_152_V_2`s Urteilsdatum (2026-01-29, amtlich eindeutig aus zwei unabhängigen Quellen)
  darf die Body-Quarantäne überleben — gesetzt, Body/azaUrteil bleiben Auszug/quarantäniert.
  Kommentar zur A1-Restlücke ergänzt: ein plausibel-aber-falsches Bestandsdatum (wie 152_V_2s
  vorheriges 2025-06-23, aus der OCL-Konflation geerbt) wird von `verschlechtertDatum` konserviert,
  nicht automatisch korrigiert. **Nachtrag C1+D1+D2+E (Delta-Prüfungen 12.9.2026, PR #816):**
  C1 — `bge_152_V_2` trug weiterhin 44'817 Zeichen des FREMDEN Urteils 152 V 20 im Body (nur der
  aza-Body war quarantäniert, nicht der Basis-Record); `abschnitte`/`rubrum`/`zitierteNormen`/
  `dispositivOrders` genullt, neues additives Feld `quarantaene` an `EntscheidSnapshot`, neuer
  korpusweiter Wächter `findeFremdeFundstelleImBody` (laufender Seitenkopf-Vergleich, Rot-Beweis
  erbracht, effektive Prüfmenge 6/1259 BGE — Roadmap-Folgeschritt für einen breiteren
  Konflations-Wächter unter `W2·18-FEHLERBUCH` in ROADMAP.md vorgemerkt). D1 — der Leer-Body-
  Hinweis in `EntscheidBody.tsx` präzisiert sich bei gesetztem `quarantaene` («… mit BGE 152 V 20
  vermischt …»), unit-getestet. E — CI-Rot Browser-Smoke Shard 4/4: `quarantaene` fehlte in der
  Manifest-Projektion (register.json), die Übersicht klickte darum blind auf den quarantänierten,
  jüngst-datierten Eintrag; Chip «Volltext nicht verfügbar» jetzt auch in Karte/Zeile
  (`data-quarantaene` DIREKT am `<Link>` — in `EntscheidZeile.tsx` ist der Link ein leerer
  Stretched-Link, der Chip ein Geschwister, kein Nachfahre, ein `:has()`-Selektor traf darum nie
  zu), e2e-Testvoraussetzung («erster Treffer hat Volltext») jetzt explizit erzwungen + neuer Fall
  für den quarantänierten Zustand.

## Reparatur-Arm ohne `normtext:revisionen` — Wortlaut + Lösung 12.9.2026 (PR folgt)

**Ursprünglicher Befund (Wortlaut, bis 12.9.2026 offen, FAHRPLAN-OFFENE-BEFUNDE.md:94,
Nacht 5.9.2026, #703):** «Reparatur-Arm ohne `normtext:revisionen`» — Arm fährt nur
`gen:artikel-revisionen`; DBG-Drift 54→55 blieb liegen. Dazu `--nur-geaendert` für den
Revisionen-Lauf (227 `abgerufen`-Bumps je Lauf blähen den Diff ×20).

- [x] **Gelöst 12.9.2026:** Nullprobe zuerst — `grep normtext:revisionen
  .github/workflows/fedlex-frische.yml` traf vor dem Fix nichts; der Arm rief nur die
  gleichnamig klingende, aber andere `gen:artikel-revisionen` (Artikel-Fussnoten-Extrakt,
  `scripts/verzahnung/extrahiere-artikel-revisionen.ts`) — eine andere Datenquelle als die
  «Änderungen/Revisionen»-Timeline je Erlass (`public/normtext/revisionen/<KEY>.json`,
  Paket 5/W2·6-REV, `scripts/normtext/revisionen-generieren-run.ts`). Fix: fehlenden Schritt
  `npm run normtext:revisionen -- --datum=…` in `fedlex-frische.yml` nachgezogen, platziert
  NACH `normtext:struktur` und VOR `normtext:churn-reset --pfad=public/normtext` (Bund-only
  per Konstruktion, kein `--nur=bund` nötig — das `--nur=`-Flag dieses Generators filtert nach
  Erlass-KEY, nicht nach Ebene, und ein `--nur=bund` hätte fälschlich eine leere Grundmenge
  gesucht und den Lauf abgebrochen).
  **Abweichung vom Fund-Wortlaut, §7-offengelegt:** `--nur-geaendert` im Generator wurde NICHT
  gebaut. Der Fund verlangte das gegen die 227 `abgerufen`-Bumps je Netz-Lauf. Rot-Beweis
  (empirisch gegen das echte committete `public/normtext/revisionen/DBG.json` gefahren, per
  `vite-node`): ein reiner `abgerufen`-Bump wird von `istReinerDatumsChurn`
  (`scripts/normtext/churn-reset.ts`, seit 1.9.2026/Befund a2) bereits erkannt (`true`), eine
  gekürzte Revisionen-Liste — die DBG-54→55-Drift-Klasse selbst simuliert — dagegen nie
  (`false`), trotz gleichzeitigem Bump. `normtext:churn-reset --pfad=public/normtext` läuft im
  selben Workflow bereits direkt nach dem neuen Schritt und entfernt reine Datums-Churn-Dateien
  rekursiv für JEDE Datei unter `public/normtext` — der Sidecar-Feldname ist wortgleich
  `abgerufen`. Ein zweites, generator-eigenes `--nur-geaendert` wäre dieselbe Prüfung ein
  zweites Mal (§5, zwei Wahrheiten) und das Duplikat, das §10/§17-Gegengewicht verbietet,
  solange eine bestehende Stelle dieselbe Sorge schon trägt. Dauerhaft als Regressionstest
  verankert: `src/tests/normtext-revisionen.test.ts`, Block „Rot-Beweis §703“ (3 Fälle:
  reiner Bump = Churn, gekürzte Liste = nie Churn, byte-gleiche Eingabe = kein Churn-Fall).
  Zusätzlicher Rot-Beweis für die beiden genannten Tore (temporär gegen die echten
  committeten Dateien gefahren, danach `git checkout` — keine bleibende Änderung):
  `check:revisionen` wird rot («Determinismus: DBG — Neubau aus raw ≠ committetes Sidecar»,
  Exit 1), wenn ein Eintrag aus `public/normtext/revisionen/DBG.json` entfernt wird;
  `check:artikel-revisionen` wird rot («DBG.json VERALTET/fehlt.», Exit 1), wenn ein Artikel
  aus `public/verzahnung/artikel-revisionen/DBG.json` entfernt wird — beide fangen die
  Drift-Klasse, die der Fund benannte. Tore: `check:revisionen`/`check:artikel-revisionen`/
  `check:historie`/`check:datenhaltung`/`check:paritaet`/`golden:vergleich`/
  `check:tor-paritaet`/`check:plan` grün, `vitest src/tests/*revision*` grün, lint/tsc grün.
  Keine Netz-Regenerierung in diesem PR (TABU `public/**` ausser deklariert) — der neue
  Schritt läuft erstmals im nächsten geplanten Frische-Lauf und zieht den DBG-Stand sowie
  jede weitere Bund-Revisions-Timeline dann automatisch nach.

## Register-sha rotiert mit stand — Wortlaut vor der Lösung + Lösung 12.9.2026 (PR #814)

**Ursprünglicher Befund (Wortlaut, bis 12.9.2026 offen, FAHRPLAN-OFFENE-BEFUNDE.md:93,
Nacht 5.9.2026, #687/#695):** «Register-`sha` rotiert mit `stand`» — `material-manifest.ts:45`
hasht `r.stand`; stand-freie `shaVernehmlassung()` nur im Test (§5/§6.7).

- [x] **Gelöst 12.9.2026, PR #814:** Nullprobe zuerst — Rot-Beweis-Test bewies, dass
  `shaEintrag()` bei identischem Inhalt und unterschiedlichem `stand` verschiedene sha
  erzeugte; Messreihe Lauf #789→#803 (register.json, Commits e1e0e708e→6456dcf00): 831 von
  831 Vernehmlassungs-sha änderten sich, bei nur 1 tatsächlichem Statusübergang. Fix:
  `r.stand` aus dem Identitäts-sha in `shaEintrag()` entfernt (stand bleibt eigenes
  Provenienz-/Kern-Feld, §7, unverändert ausgeliefert); die stand-freie Formel
  `shaVernehmlassung()` (nie im Generator-Pfad verdrahtet, nur eigener Test) entfernt statt
  als zweite Formel weitergepflegt — eine Funktion für Generator UND Test (§5). Konsumenten
  geprüft: `check-materialien.ts` prüft nur Format + Byte-Gleichheit zur frischen
  Projektion, kein Vergleich gegen eine Alt-Fassung; `check:entstehung`
  (Anker-sha-Determinismus-Wächter) ist ein eigenständiges Sidecar-sha-System ohne Import
  aus `material-manifest.ts` — unberührt. Register neu erzeugt (`materialien
  --datum=2026-09-12`, `datenhaltung:manifest`): 1383/1681 sha ändern sich EINMALIG
  (Formel-Wechsel), alle anderen Felder byte-gleich (register.json/register-i18n.json
  unverändert). Tore: `check:materialien`/`check:bs-materialien`/`check:entstehung`/
  `check:datenhaltung`/`check:paritaet`/`check:zaehler`/`check:feed` grün,
  `golden:vergleich` 256 Fälle byte-gleich, `vitest src/tests/*materialien*` 16
  Dateien/274 Tests grün, `lint` 0 Fehler. Damit sind alle drei Befunde der Nacht-5.9.2026-
  Sammelzeile (ROADMAP.md:416) gelöst: Finding 7 ohne Reparaturweg (PR #803) ·
  Register-sha rotiert mit stand (PR #814) · Arm-Tor wanduhrabhängig (PR #803).

## `adapter-lexwork.ts:778` Fetch-Ergebnis unvalidiert — Wortlaut + Fix 12.9.2026 (PR #813, Gegenprüfung ausstehend)

**Ursprünglicher Befund (Wortlaut, ROADMAP.md Stand 29.8.2026 / FAHRPLAN-OFFENE-BEFUNDE.md §1):**
«`adapter-lexwork.ts:778` Fetch-Ergebnis unvalidiert — `Response.json()` liefert unter `lib: DOM`
`any`; Shape vor Verwendung prüfen (Nebenfund QS-TYP-LUECKE 15.8., Gegenprüfungs-Auflage A1;
Risikopfad Extraktion ⇒ QS-GP)».

- [x] **Gefixt 12.9.2026, PR #813 (`af5e35ce9`), Gegenprüfung ausstehend — nicht gemergt:** Der
  frühere `let json: {...}`-Cast auf das Ergebnis von `Response.json()` prüfte nur beim Compile,
  nie zur Laufzeit. Nullprobe (drei Tests in `src/tests/normtext-lexwork.test.ts`, empirisch gegen
  den alten Code verifiziert — `git stash` auf `adapter-lexwork.ts` allein, alle drei liefen rot):
  `text_of_law` als String statt Objekt lief still durch (leeres nurPdf-Ergebnis ohne Hinweis),
  `current_version` als Array statt Objekt ebenso (Feld schweigend ignoriert), `xhtml_tol` als
  Zahl crashte erst tief im XHTML-Parser mit URL-loser Meldung («xhtml.split is not a function»).
  Fix: `Response.json()` bleibt `unknown`; neue Laufzeit-Validierung `validiereTextOfLaw()` (+
  Guard `istPlainObject`) prüft Objekt-Form und die tatsächlich verwendeten Feldtypen, wirft bei
  Verstoss sofort mit URL + Feldpfad + gefundenem Typ (§6.7). Gleiches Muster wie
  `scripts/materialien/adapter-bs-grossrat.ts` (`unknown` + `typeof`/`Array.isArray`-Wächter,
  keine neue Bibliothek). Determinismus/Extraktions-Logik unverändert; `golden:vergleich` 256
  Fälle byte-gleich, `check:golden-normtext` 60283 Knoten/0 Waisen unverändert.

## Deckungs-Seite «was wir nicht haben» — Wortlaut vor der Lösung + Lösung 12.9.2026 (PR #807)

**Ursprünglicher Befund (Wortlaut, bis 12.9.2026 offen):** «Deckungs-Seite «was wir nicht haben»
offen (§11.5 FAHRPLAN-MATERIALIEN-VERZAHNUNG.md, Befund 11.9.2026) — 1286 von 4770 Synopse-Alt-
Blöcken (27 %) tragen kein Fussnoten-Ereignis; Stichprobe belegt echte Änderungen ohne Fussnote
(Berichtigungen, Terminologie), Quote aber nicht erlassweise geprüft — eigener Schritt zur
Vollständigkeit des amtlichen Fussnoten-Apparats wert.»

- [x] **Gelöst 12.9.2026, PR #807:** öffentliche Seite **`/materialien/deckung`**, Projektion
  **`public/materialien/deckungs-sicht.json`** (generiert aus dem Mess-Register
  `bibliothek/register/entstehung-deckung.json`, Byte-Vergleich via `check:entstehung`; Basisname
  bewusst verschieden vom Register — dort Diagnose je Erlass, hier ausgelieferte Sicht). Ist-Stand
  bei Bau (nach den Normalisierungs-Korrekturen aus #798/#801, andere Grundgesamtheit als am
  11.9.): **1144 von 4641 Alt-Blöcken (24,7 %) ohne Fussnoten-Ereignis** — der Messwert vom
  11.9.2026 (1286/4770, 27 %) bleibt als datierter Beleg unverändert stehen (§2b), keine
  Ersetzung. Daneben ausgewiesen, ebenfalls ungelöst: 1008 Fussnoten-Ereignisse ohne beobachtete
  Textänderung, 22 Quelllücken, 385 Curia-Geschäfte, BS 117 Ketten (8 amtlich/114 maschinell).
  Grundgesamtheit = Vereinigung über alle Quellen (nicht nur das Deckungs-Register, sonst fielen
  14 Staatsverträge mit Synopse-Fenster heraus). Gegenprüfung Sonnet mit Auflage Paritäts-Ingest —
  Nachtrag: Ingest-Wächter `ungedeckteTopLevelJson` gebaut (`scripts/datenhaltung/ingest.ts`), fand
  beim ersten Lauf vier vorbestehende, nie erfasste Top-Level-JSONs (`inkrafttreten.json`,
  `kanton-luecken.json`, `pdf-quellen.json`, `bezuege-bilanz.json`) — eingetragen statt in eine
  Ausnahmeliste gelegt (Normtext-Seitendateien 4→7, Rechtsprechung-Manifeste 5→6).

## K-16 (BS-Teil) — Kantonale Materialien Basel-Stadt an die Botschaften-Pipeline, erledigt 12.9.2026

PR #799 (`c83501304`): Grosser Rat Basel-Stadt (data.bs.ch, CC BY 4.0) an die Botschaften-Pipeline
angeschlossen — 117 Geschäfte, 122 Kanten (8 amtlich aus einem deklarierten Schlüssel, 114
maschinell über Datum/Titel-Heuristik gekennzeichnet, `quelle: maschinell` §8), 409
Verfahrens-Ereignisse. Gegenprüfung Sonnet mit Auflage doktyp bestanden. Zwei Punkte bleiben offen
und stehen als eigene Unterpunkte unter `W2·13-KANTONE-DATEN`: CC-BY-Namensnennung von data.bs.ch
in der UI (Entscheid David) und die fachliche Abnahme der 114 maschinellen Kanten (David, §7). Der
ZH-Teil von K-16 ist NICHT Teil dieses Abschlusses — Präzisierung 6.9.2026 (Bund → BS → ZH),
ZH-Pendant FAHRPLAN-KANTONE §5 R12b.

## W2·26-FUNKTIONSZEILE-Planung 11.9.2026 — vier §8-Nachzüge umgebucht/entschieden

Mandat David 11.9.2026 («überarbeite insgesamt die Funktionszeile am Artikelende … führe alles
durch») löste vier offene Nachzüge aus `FAHRPLAN-DESIGN-IDENTITAET.md` §8 auf, die als
ROADMAP-Unterpunkte unter `W2·24-DESIGN-IDENTITAET` standen. Wortlaut der erledigten/abgehakten
Zeilen (Steuer-Doku §4 der ROADMAP):

- **«Bezüge-Zeile: Kopfzähler gefiltert/ungefiltert» (R5-F1K §7; löst D20 ab)** — Kopfzähler =
  Bezugsgrösse (Entscheid N1), Panel filtert; Anzeige beider Zahlen offen. → entschieden
  11.9.2026: EINE Zahl, bei aktivem Filter die gefilterte, Gesamtzahl nur im `title`. Detail:
  `FAHRPLAN-DESIGN-IDENTITAET.md` §9 Z3.
- **«D45 · Entscheid-Klick in der Fusszeile öffnet daneben»** — heute navigiert er die ganze Seite
  (`randNotizZiel` greift nur in `.lr-notiz`, `v3/LeserLesespalte.tsx`); Soll nach D30-Spec/
  Split-Regel M3, ⌘-Klick neuer Reiter. → umgebucht 11.9.2026 nach `FAHRPLAN-DESIGN-IDENTITAET.md`
  §9 Z5, Teil des Schritts `W2·26-FUNKTIONSZEILE`.
- **«Bezüge-Zähler in den Erlass-Payload» (D34-Nachfix, Korpus ⇒ Gegenprüfung Pflicht)** — statt
  eigenem Fetch; heute entstehen die 145 Fuss-Zeilen erst in der zweiten Render-Runde. → umgebucht
  11.9.2026 als eigener Schritt `W2·26-FUNKTIONSZEILE-ZAEHLER` (`feld: korpus`).
- **«OR-Leser trägt 15'239 Knöpfe im DOM» (§15, seit F1 sichtbar)** — 1686 Artikel × ~4 Aktionen;
  Rollen-Abfragen und Screenreader werden teuer. Aktionen erst beim Aufklappen/Hover rendern oder
  Ereignis-Delegation. → umgebucht 11.9.2026 nach `FAHRPLAN-DESIGN-IDENTITAET.md` §9 Z6.

Zusätzlich aufgelöst (kein Umbuchen, sondern Widerspruch): der §8-Nachzug Nr. 12 «Daneben öffnen»
mit `?r=`-Instanz (F1-Rest) stand im Widerspruch zu ROADMAP.md:464, wonach D44 (#760, 7.9.2026)
die Aktion «⧉ Artikel daneben» bereits bewusst ersatzlos entfernt hatte — gestrichen, D44 gilt.

Das David-Gate `david-go-entstehung` (ROADMAP.md §@blockers) wurde mit demselben Mandat erteilt;
die drei `W2·6c-ENTSTEHUNG-*`-Schritte liefen von `blocked` auf `status: ready`.

## Umbenennungen 8.9.2026 — Nicht-Tore aus der Wächter-Fläche

PR #779 (`feat/qs-ci-flake-waechter`) riss den Steuerungs-Deckel `scripts/check-*.ts`
≤ 204 KB (Ist 212.1 KB). Entscheid Orchestrator: die Fläche zählte Dateien, die
keine eigenständigen Tore sind — Fehlklassierung, kein Grund zur Deckel-Anhebung.
Mechanisch umbenannt, je mit Beweis, damit es keine stille Umgehung des Deckels ist:

- **`scripts/check-parallel.ts` → `scripts/run-parallel.ts`** — Runner, der die
  `check:seriell`-Kette parallel abfährt und deren Sub-Check-Exitcodes 1:1
  durchreicht; kein eigenständiges Prüfkriterium, taucht in `check-tor-paritaet.ts`
  nirgends als Tor-Name auf, wird nur unter dem Script-Namen `check` (nicht
  `check:parallel`) aufgerufen.
- **`scripts/check-netz-alle.ts` → `scripts/run-netz-alle.ts`** — Runner der
  `check:netz:kette`, fährt deren Glieder sequentiell statt `&&`-Abbruch beim
  ersten Rot; ebenfalls kein eigener Tor-Name in `check-tor-paritaet.ts`, nur
  unter `check:netz` aufgerufen.
- **`scripts/check-zitatgraph-warnungen.ts` → `scripts/report-zitatgraph-warnungen.ts`**
  — Datei-Kopf seit Bau wörtlich «BEWUSST KEIN TOR: Exit stets 0, nicht Teil von
  `npm run gate`»; Code hat keinen `process.exit(1)`-Pfad.

Script-**Namen** (`check`, `check:netz`, `check:zitatgraph`) bewusst unverändert
gelassen — nur die Dateipfade geändert —, damit Skills/Doku, die den Script-Namen
statt des Dateipfads zitieren, nicht brechen. Alle Datei-Referenzen nachgezogen
(package.json, `.github/workflows/fedlex-frische.yml`, `.gitignore`,
`DESIGN-REGLEMENT.md`, `fahrplaene/FAHRPLAN-EFFIZIENZ-CHECKLISTE.md`,
`bibliothek/normen/hist-ansicht-h0-trennbarkeit.md`, sowie die Live-Code-Kommentare
in `scripts/gate.sh`, `scripts/check-farbwelt.ts`, `scripts/plan/selbstoptKern.ts`,
`scripts/normtext/check-sidecar-differ.ts`, `scripts/fedlex-zitatgraph.ts`,
`scripts/zitatgraph-vergleich.ts`, inkl. der Runner-eigenen Log-Präfixe
`check-parallel:`/`check-netz-alle:` → `run-parallel:`/`run-netz-alle:`).
Dated historische Belege (ROADMAP-CHRONIK-Altbestand, `archiv/**`, `STRUKTUR.md`
„Gelandet"-Liste, `BACKLOG-AUDIT-WERKZEUGE-2026-07.md`, `abnahme/design-d5/BERICHT.md`)
**bewusst nicht** nachgeführt (§2b — Belege altern nicht).

**`scripts/check-raw-store.ts` NICHT umbenannt**, stattdessen zum echten Tor
gemacht: `.github/workflows/korpus-raw-release.yml` bekam einen neuen Schritt
„Frischeprüfung — Release deckt alle aktuellen Pins (--streng)"
(`npm run check:raw-store -- --streng`) direkt nach der Release-Veröffentlichung.
Rot-Beweis **ohne Manipulation nötig** — der reale Ist-Zustand war beim Bau
bereits rot: `npx vite-node scripts/check-raw-store.ts -- --streng` gegen den
damals jüngsten Release `korpus-raw-20260902` meldete Pin `dbg` mit
abweichendem Stand (Release 2026-01-01 vs. Pin 2026-09-02), Exit 1. Der
Datenbefund selbst (warum `dbg` divergiert) ist Korpus-Territorium (§7,
Gegenprüfungspflicht) und liegt ausserhalb dieser mechanischen Umbenennung —
nicht mitgefixt, nur gemeldet.

## Zielbild-Dekret Gesetzesleser + Plan-Umbau 1.9.2026 *(Chat David, Session 1.9.2026)*

**Wortlaut David (Chat, 1.9.2026):** «aktuell ist gesetzesleser im vordergrund. also ziel soll es
sein möglichst alle gesetze zu haben die ein schweizer jurist benötigt. und das zu perfektionieren.
es soll der beste gesetzesdarsteller für schweizer juristen sein den es auf dem markt gibt.» —
«aber es ist schon gut, dass wir zuerst fundamentarbeit machen wenn das sinnvoll ist.» —
«ok bau den bauplan so um … und dann beginne mit dem arbeiten. verwende die richtigen skills. bau
nach diesem muster bis ich stop sage und versuche token zu spahren.»

**Bestandsmessung, die den Umbau trägt (1.9.2026, `public/normtext/register.json`):** Bund 238
Erlasse / 25'404 Artikel, Kernbestand praktisch komplett (Lücken: EMRK nur PDF-Einbettung, EÖBV und
AVG fehlen); Kantone 1'253 Dateien — BS 859 und AR 266 vollständig, ZH 24, 22 Kantone nur Tarife;
Sprache 1'488 de / 2 fr. Tempo: OR-Erstrender 8,4–17,2 s bis bedienbar (QS-PERF). Vertrauen:
Normen-Monitor seit ≥5 Wochen rot; 18'854 von 75'365 Artikel↔Entscheid-Kanten Phantom-Zitate.
Massstab «bester Gesetzesdarsteller» = besser als Fedlex/lexfind: wortgetreu bis in Fussnoten,
Anhänge und Übergangsbestimmungen · schnell · Verweise springen richtig · Bund + Kanton an einem Ort.

**Umbau:** `@queue` neu in vier Blöcken (1 Fundament: QS-BASIS/K3 · QS-PERF · QS-MONITOR-ROT ·
W2·13-KANTONE-DATEN/Tag-Leser — 2 Text-Treue Bund: W2·5l-NORMTEXT-B2 · QS-KORPUS · W2·20 ·
W2·5m — 3 Kantone: W2·13-KANTONE-DRIFT · W3·12 — 4 Differenzierung: W2·5g-ZEIT · W2·14-SIGNAL ·
W2·6). Geparkt mit Token `zielbild-gesetzesleser`: W2·6b-MAT-FINMA, W2·11-DESIGN, W1·4,
W1·5-PRAXIS, W2·8, W3-AUSBAU, W2·16-INVENTAR, SEO-A11Y, QS-OPT, QS-GP, QS-AUTOMATIK. Auf `ready`
zurück: QS-BASIS (Sequenz-Marker erfüllt), W2·13-KANTONE-DATEN (Programm läuft), und die vier
`wip`-Leichen ohne Bau-Spur W2·20 / W2·7-VZUI / W2·17 / W2·19 (blockierten Leser- und Design-Feld
seit Tagen). «Tabellen lesbar» von W2·5g-ZEIT nach W2·5l-NORMTEXT-B2 verschoben (Text-Treue,
nicht Zeit). Zwei David-Fragen neu: FR/IT-Zielbild, Kantons-Reihenfolge.

**Nachtrag David (Chat, 1.9.2026) zu den zwei offenen Fragen:** «nur deutschschweiz, kantonsreihenfolge
passt. mach aber zuerst zh und bs und dann der rest. vorallem später die franz italienischen» —
Zielbild = Deutschschweiz; Reihenfolge ZH → BS → BE → AG → SG → LU, fr/it-Kantone und -Fassungen
zuletzt. Beide `@david-fragen` damit gelöscht. Dazu «bau bis ich stop sage» (Dauer-Baumandat erneuert).

**Begründungszeile zur Zurückstellung:** kein Schritt gestrichen; die Prüfstrasse ist reif genug
(CI-Fehlerrate 10 %, 0 von 338 Tor-Läufen rot seit letztem Snapshot), Prozessarbeit läuft nach §17
reaktiv weiter. Analytics bewusst nicht aktiviert — David ist heute der einzige Nutzer.


## W2·18-FEHLERBUCH — Repro-Durchgang + UI-Fix-Batch 29.8.2026 *(Branch `feat/w2-18-fehlerbuch-ui1`; überführt 29.8.2026)*

Sieben Fehlerbuch-Zeilen abgeschlossen. Vier davon durch einen Fix, drei durch Messung: zwei waren längst erledigt bzw. widerlegt, eine hatte einen falschen Wortlaut. Die Reproduktion lief gegen den Prod-Stand, die Sichtprüfung gegen einen lokalen `vite preview`-Build (eigener Playwright-Prozess, hell + dunkel).

Durchgehendes Muster der vier echten Fehler: **nicht ein fehlendes Feature, sondern eine Regel, die nur an EINEM ihrer Ausspielungsorte lief** (§5). Die Anhang-Dominanz-Regel gab es seit Fahrplan Kap. 14 — sie lief im Erlass-Kopf, nicht in der Erlass-Übersicht und nicht in der Ruhezeile der Seitenleisten-Box (drei Formatierer für eine Zahl). Der Erfassungsgrad stand im `aria-label` der Seitenleiste, aber nirgends sichtbar. Die H1 kannte die Kürzel-Redundanz-Weiche, der Browser-Reiter nicht. Wer solche Befunde einzeln fixt, baut die vierte Kopie.

- [x] **Wording bei Anhang-Dominanz:** «N Artikel» → «Einträge», Kopf UND Erlass-Übersicht zugleich (§5; SG-3849 97 % Anhang). Reproduziert und gefixt 29.8.2026. Befund war NICHT das fehlende Wording, sondern ein zweiter Formatierer: `zaehlWort`/`ANHANG_DOMINANZ` lief längst — aber nur im Erlass-Kopf, während die Übersicht `bestimmungsWort` roh druckte («Übersicht 607 Artikel» bei 590 Anhang-Einträgen). Beide konsumieren jetzt dieselbe Funktion. Zusätzlich «· Anhang» → «· davon N im Anhang» (Zahl aus denselben Gliederungs-Kennzahlen); neutrale Benennung statt «Anhang-Ziffern», weil je Erlass wechselt, wie die Einträge amtlich heissen (§8).
- [x] **Katalog `/gesetze`: Suchfeld-Geltungsbereich nur im `aria-label`** — Wortlaut nach Reproduktion korrigiert (29.8.2026): es sind **zwei** Felder, nicht vier, und der Geltungsbereich ist nicht «unklar», sondern **nur im `aria-label` hinterlegt, nirgends sichtbar** — für Screenreader abgegrenzt, für Sehende nicht. Derselbe Mechanismus wie Befund 44 (Sidebar-Einstufung), dort am 29.8. gefixt. Der sichtbare Scope-Ausweis am Feld ist Wortlaut-/Layout-Arbeit und bleibt als **Rest im Design-Pass** — nicht im Fix-Batch. *(Cowork-Befund 18, 18.8.2026; am Prod-Stand verifiziert 29.8.2026.)*
- [x] **A–Z-Register startet leer** — **bereits gefixt am 18.8.2026** in `src/pages/gesetze-teile/AzRegister.tsx` (Fix-Kommentar «Befund 19» ebenda, Z. 149: solange nichts gewählt ist, steht nur noch eine Zeile statt eines halben Bildschirms). Beim Fehlerbuch-Durchgang 29.8.2026 als längst erledigt festgestellt — offen war nur die Zeile hier. *(Cowork-Befund 19, 18.8.2026.)*
- [x] **Entwicklertexte in Palette/Panel prüfen** — **gemessen 29.8.2026, kein Defekt; bewusst NICHT geändert.** Der Verdacht lautete, die Sektion «GESETZESTEXT» lasse den Lade-Platzhalter «wird durchsucht …» stehen, wenn keine Treffer kommen. Messung am gebauten Stand (Query «Miete», lokaler `vite preview`): der Platzhalter verschwand nach **3'447 ms** — das ist die Ladezeit des lazy Artikel-Volltext-Index (48 MB roh / 9.9 MB gzip, lädt erst beim ersten Tastendruck). Der ursprüngliche Repro-Lauf hatte nur 700 ms gewartet. Gegenprobe mit einer echten Nulltreffer-Query («qqqzzzxyk»): das Panel zeigt korrekt «Keine Treffer zu «qqqzzzxyk». Versuchen Sie einen Erlass, eine Norm oder ein Stichwort.» — der ehrliche Leerzustand existiert also und greift. `sucheAlles` entfernt geladene leere Gruppen (`universalSuche.ts`), nur `laedt`/`unvollstaendig` bleiben stehen. **Der Platzhalter darf NICHT durch «keine Treffer» ersetzt werden:** das behauptete «nichts gefunden» über einen Bestand, den die Suche noch gar nicht gelesen hat — genau der §8-Verstoss, gegen den der Kommentar bei `sucheAlles` ausdrücklich warnt. *(Cowork-Befund 33, 18.8.2026; am gebauten Stand widerlegt 29.8.2026.)*
- [x] **International-Karten: Metadatenzeile uneinheitlich** — reproduziert 29.8.2026 und gefixt: MENGE und FORMAT teilten sich einen Slot als Entweder-oder, darum las EMRK «SR 0.101 · amtliches PDF» und CISG «SR … · 101 Artikel». Jetzt zwei getrennte Slots — Zahl nur wo `artikelAnzahl > 0` (bindet an die Zahl, nicht an den Status; zugleich Wache gegen ein «0 Artikel», §8), Format als Badge. Volltext-Snapshots tragen bewusst kein Tag (1'300 Karten mit «Volltext» wären Lärm). *(Cowork-Befund 47, 18.8.2026; gefixt 29.8.2026.)*
- [x] **Abdeckungs-Einordnung fehlt in der Seitenleiste** — reproduziert 29.8.2026 und gefixt: das Zustands-Wort lag längst im `aria-label` (`navigation.ts`), war also für Screenreader da und für Sehende nicht — «Basel-Stadt 859» neben «Aargau 4» ohne Einordnung liest sich wie die Grösse des Kantons statt wie die Grösse unserer Erfassung (§8). Jetzt Wort + Zahl sichtbar, aus **derselben** `erfassungsgrad()`-Ableitung, die das `aria-label` schon speist (§5, keine zweite Einstufungslogik). *(Cowork-Befund 44, 18.8.2026; gefixt 29.8.2026.)*
- [x] **Browser-Reiter doppelte das Kürzel: «EMRK (EMRK) — LexMetrik»** — reproduziert 29.8.2026 auf `/gesetze/bund/EMRK` und gefixt. Der Kurztitel ist per LEGES-Konvention der Klammer-Inhalt am Ende des Volltitels — bei Staatsverträgen IST das genau das Kürzel. Redundanz-Weiche jetzt als reine Funktion `tabTitel()` in `src/pages/gesetz-leser/helpers.tsx` (BEWUSST NICHT in erlassKopfText.ts — Risikopfad; analoge, nicht identische Regel zur H1-Weiche `titelRedundant`: tabTitel vergleicht den Klammerinhalt, die H1-Weiche den Titel ohne Suffix), Rot-Beweis in `src/tests/tab-titel-redundanz.test.ts`. *(Fehlerbuch 29.8.2026.)*

## QS-PLAN-EINFACH — Plan-System vereinfachen *(done 14.8.2026, PRs #489 + #490 Squash `a7ffd90b7`/`bf213a768`; überführt 14.8.2026)*

- [x] **`QS-PLAN-EINFACH` · Plan-System vereinfachen: kürzere Roadmap, offenere Schritte, billigere Pflege** *(Auftrag David 14.8.2026, **bewusst offener Auftrag**)* — verbindlich ist nur «alles wird weniger kompliziert»; die Session entscheidet selbst. **Kern gelandet 14.8.2026** (tote Felder gestrichen · ROADMAP 100→78 KB, Schritte auf Zielform · Rotations-Hysterese · zwei Schein-Tore ehrlich). Ausgangslage, Zäune, offene David-Entscheide: **Detail:** [FAHRPLAN-PLAN-STEUERUNG.md](fahrplaene/FAHRPLAN-PLAN-STEUERUNG.md) §Einfach.
  <!-- @meta id: QS-PLAN-EINFACH · status: done · blocker: null · dep: [] · kollision: [ROADMAP.md, scripts/plan, .claude/skills, .claude/hooks, fahrplaene, archiv] · worktree: ja · 26x: nein · groesse: L · fahrplan: fahrplaene/FAHRPLAN-PLAN-STEUERUNG.md -->
  - [x] **Skills `auftrag`/`bauschritt`/`aufraeumen.md` verschlanken** — dieselbe Diät wie die ROADMAP: Ziel statt Weg, Historien-Prosa in die Chronik; Handgriffe je Schritt zählen und senken. *(#490: −40/−32/−33 %; Einsortier-Tabelle neu; Regelverlust-Tor bedient.)*
  - [x] **Drei Halden ohne Leser abbauen** — `archiv/STRUKTUR-SESSIONKARTEN.md` (791 KB, +12 KB/Tag: Deckel oder Jahres-Split) · 17 tote Archivdateien (155 KB) · 50 selbsterklärt nicht-steuernde Fahrplan-Abschnitte (188 KB) → `archiv/`. *(#490: Monats-Split byte-treu; 15 Dateien mit Null-Verweis gelöscht [Audit-Wert korrigiert]; 22 Abschnitte verschoben, 2 Grenzfälle belassen.)*
  - [x] **Etiketten-Sterblichkeit senken** — 50 von 79 offenen Etiketten wurden nie in einem Commit genannt; Kandidaten je Dach prüfen und zusammenlegen oder als Ideen-Zeile ohne `@meta` weiterführen (§17-Gegengewicht Satz 4). *(#490: 16 → 7 Dächer, Bestand 79→63; Einsortierung unabhängig geprüft, Auflagen umgesetzt.)*

Dazu über den offenen Auftrag hinaus (Davids Punkte 1–3 vom 14.8.): Auto-Buchung
`Roadmap-Status:`-Trailer (`plan-buchung.yml`, Injection-Befund der Gegenprüfung vor
Merge geschlossen) · CI-Klasse `code-fern` (Browser-Shards nur bei App-Diffs) ·
Lagebild mit Anstehend-Karten, Verknüpfungs-Chips und neuem Bau-Prompt.

## Etiketten-Konsolidierung + Halden-Abbau 14.8.2026 (`QS-PLAN-EINFACH`, Auftrag David)

**16 Kleinst-Etiketten aufgegangen** (nicht gestrichen — jede lebt als Checklisten-Zeile in ihrem
Dach weiter, Risiko-Vermerke an der Zeile; Dach-`kollision` je um die aufgenommene Fläche erweitert):
`QS-GP-PRERENDER`/`QS-GP-PREPUSH`/`QS-GP-NACHBEFUNDE` → `QS-GP` · `QS-BASIS-TOT`/`QS-BASIS-DEPS` →
`QS-BASIS` · `QS-AUTOMATIK-BERICHT`/`QS-AUTOMATIK-PARITAET`/`QS-MERGE-AUTOZUG` → `QS-AUTOMATIK` ·
`W2·14-SIGNAL-B1`/`-B2`/`-GER` → `W2·14-SIGNAL` (Bau-Reihenfolge als Prosa-Note statt `dep`-Kette) ·
`W2·7-BEZUG-LADEN` → `W2·7-VZUI` · `W2·5k-LINIEN-RUECKBAU` → `W2·5h-GESETZ-UI` · `W3·14-B3`/`-S`/
`-a11y` → `W3·14`. Anlass: Audit 13./14.8. — 50 von 79 Etiketten nie in einem Commit genannt;
Etiketten-Bestand 79 → 63. Risiko-Klassen nicht als Bau-Einheit gemischt: Zeilen mit Risikopfad-
Anteil (`QS-GP-NACHBEFUNDE` b/c) bzw. deklarierter Verhaltensänderung (`W2·5k`) tragen den Vermerk
wörtlich an der Zeile — eine Session nimmt sortenreine Teilmengen (Muster `W2·13-KANTONE-DATEN`).

**15 tote Archivdateien gelöscht** (130 KB, null lebende Verweise, unabhängig nachgemessen —
der Audit-Wert «17/155 KB» war um 2 Dateien zu hoch): Liste in `archiv/README.md`
§«Gelöscht 14.8.2026»; git-Historie trägt sie weiter.

## ROADMAP-Verschlankung 14.8.2026 (`QS-PLAN-EINFACH`, Auftrag David)

**Streichungs-Begründung (Protokoll Ziff. 5):** Die Schritt-Prosa der ROADMAP wurde auf Zielform
gekürzt — Ziel, Risiko-Klassierung und harte Auflagen bleiben an der Zeile, Anlass-Erzählungen,
Datums-/PR-Historie und Weg-Vorschriften sind entfernt (sie stehen in den verlinkten Fahrplan-§§
und in dieser Chronik). **Vollständiger Wortlaut vor der Kürzung: `ROADMAP.md` im Commit
`cc89fd3d0`.** Beweis der Steuerungs-Neutralität: `plan:dump` vorher/nachher byte-gleich (alle 79
Etiketten, @queue, @blockers unverändert). Im selben Zug als erledigt hierher geräumt:

- [x] **W2·17 B3–B7 (inkl. B4-N1, B5-N1)** ✅ 8.8.2026, PRs #471–#477.
- [x] **W2·18: Artikel-Ebene in der Gliederung — in JEDEM Erlass** ✅ PR #486 (13.8.2026).
- [x] **W2·18: a33-Zielkonflikt Auto-Aufklapp ↔ CLS-Kontrakt** (PR #480) **· Baum-Fokus beim Auto-Zuklappen retten** (B8, WCAG 2.4.3, PR #486) ✅ 13.8.2026.
- [x] **W2·13: 37 der 42 zeigen eine LEERE Leiste** ✅ PR #486 (13.8.2026) — b3-leer-Familie (68 Erlasse) zeigt den flachen Artikel-Index; korpusweiter Sweep über 1458 Erlasse: 0 leere Leisten.

Gestrichene tote Etikett-Felder (`of`, `seq-hart`, `seq-weich`, `statusAgent`) und die
`groesse`-Vokabelprüfung: Begründung und Messwerte im Commit «QS-PLAN-EINFACH 1/3» sowie
`fahrplaene/FAHRPLAN-PLAN-STEUERUNG.md` §Einfach.

## QS-BASIS-DOKU-CI — Doku-Kurzpfad auch für main-Pushes *(erledigt 14.8.2026, PR #488 Squash `13a3d05ad`; überführt 14.8.2026)*

- [x] **`QS-BASIS-DOKU-CI` · Doku-Kurzpfad auch für main-Pushes** *(**FREIGEGEBEN David 14.8.2026**: «wird freigegeben» — der Grundsatz «ein Deploy-Stand wird nie nach Dateiendungen abgekürzt» wird für reine `.md`-Pushes auf `main` bewusst gelockert; Anlass war ~75 CI-Minuten pro Tag für reine Plan-Buchhaltung)* — Ziel: Ein Push, der ausschliesslich `.md` berührt, läuft den Kurzpfad statt des Volllaufs. Prüfungen, die `.md`-Inhalte wirklich lesen, bleiben **echt**; im Zweifel Volllauf. **Detail:** [FAHRPLAN-BASIS-AUSBAU.md](fahrplaene/FAHRPLAN-BASIS-AUSBAU.md) §3.4.

**Die Prämisse des Schritts war überholt — gemessen, bevor gebaut wurde.** Der Fahrplan (angelegt
3.8.2026) beschreibt Voll-CI für reine `.md`-Pushes. Tatsächlich trug `on.push` seit der
CI-Härtung `paths-ignore: '**.md'`: ein reiner .md-Push erzeugte **gar keinen** Lauf. Die Messung
über 419 main-Commits der letzten 30 Tage fand den wahren Kostentreiber:

| Klasse | Commits | vorher |
|---|---:|---|
| rein `.md` | 158 | kein Lauf — und damit auch **keine** Prüfung |
| `.md` + **nur** `scripts/plan/inventar.ts` | 42 | volles Programm |
| echter Code | 219 | volles Programm (richtig so) |

Die Inventarliste ist der von `aufraeumen.md` vorgeschriebene Zweitschritt jeder Rotation — eine
ID-Zeile Buchhaltung zog 42-mal das volle Programm nach sich. Zugleich war der Filter ein **Loch**:
für die 158 reinen .md-Pushes liefen auch `Merge-Schutz` und `check:plan` nicht, die im PR-Doku-Pfad
ausdrücklich ECHT laufen.

**Gebaut:** `paths-ignore` auf `push` entfernt, der `diff`-Job klassiert jetzt auch push-Events;
Doku-Menge = alle `.md` **plus** `scripts/plan/inventar.ts` (reine ID-Buchhaltung, einziger Leser
ist `check:plan`, und das läuft im Doku-Pfad echt). `perf`/Lighthouse zusätzlich auf `art == code`
gestellt (sonst liefe es künftig bei jeder Roadmap-Pflege). `merge_group` unberührt. Fehlerseite
(§6.7): kein Vorgänger-Commit · Compare-API nicht auswertbar · 0 Dateien · ≥300 Dateien
(API-Kappungsgrenze) fallen alle auf `code`.

**§6.7-Beweis, beide Richtungen live auf main gemessen (14.8.2026):**

| | Klassierung | Bau | Tore | Shard 1/8 |
|---|---|---:|---:|---:|
| Doku-Push `3c908cce2` (1 × `.md`) | `art=doku` | 0.1 min | 0.8 min | 0.1 min |
| Code-Push `13a3d05ad` (11 Dateien) | `art=code` | 2.1 min | 4.9 min | 3.1 min |

Protokoll-Zitate: «Reiner Doku-Push (1 Datei(en)) — Merge-Schutz, Testtreue und check:plan laufen
ECHT, restliche Code-Tore quittieren» bzw. «Nicht-Doku-Dateien im Push — volles Programm».

**Ehrlich zur Erwartung (§8):** Der Gewinn ist kleiner, als der Fahrplan von 3.8. annahm — nicht
«15 Minuten gespart», sondern die schweren Jobs fallen von 2.1/4.9/3.1 auf 0.1/0.8/0.1 Minuten.
Die Runner-Grundlast (Checkout, `npm ci`) läuft im Doku-Pfad weiterhin mit; sie zu überspringen ist
ein Kandidat für `QS-PLAN-EINFACH`, kein offener Mangel dieses Schritts.

## W2·17 B3–B7 + Fehlerbuch-Erledigungen (8./9.8.2026, übertragen 9.8.2026)

Aus ROADMAP verdichtet (QS-TOK-Budget):

  - [x] **B3 · Klebende Leisten (K-01)** — 7 Befunde (Blocker 2 · Hoch 4). §4. ✅ 8.8.2026, PR #471.
  - [x] **B4 · Leseansicht Gesetz (K-14)** — 12 Befunde (Blocker 2 · Hoch 4). ✅ 8.8.2026, PR #472 (LM-155: Verwerfen-Entscheid von David am 8.8.2026 REVIDIERT — Neubau freigegeben, siehe Position B4-N1; LM-158 → `W2·5h-GESETZ-UI` K6 gemäss Grenz-Auflage §24.1; Rest gebaut/überholt). §5.
  - [x] **B4-N1 · LM-155-Neubau: Gliederungs-Tiefenführung im Gesetzes-Leser** — Freigabe David 8.8.2026. ✅ 8.8.2026, PR #475 (Baum-Ebenen typografisch + per gestufter Schrittweite unterscheidbar; Entwurf gegen die A28-Scheiter-Gründe begründet, nur SektionBaumTOC). §5 (LM-155).
  - [x] **B5 · Druck, Farbschema, Reiter- und Split-Ansicht (K-16 + K-17 + K-18)** — 8 Befunde (Blocker 2 · Hoch 2). ✅ 8.8.2026, PR #473 (7/8 + LM-174: David hat am 8.8.2026 auf System-Schema umentschieden — 19.6.-Entscheid «Tageszeit» revidiert, Bau-Position B5-N1; Rest gebaut/nachgemessen-überholt). §6.
  - [x] **B5-N1 · LM-174-Umbau: Farbschema folgt beim Erstbesuch dem System** — Entscheid David 8.8.2026 (revidiert 19.6.2026). ✅ 8.8.2026, PR #474 (pristine liest prefers-color-scheme, Label «Automatisch (System)», Live-Listener auch pristine). §6 (LM-174).
  - [x] **B6 · Fehler-, Leer- und Ladezustände (K-15)** — 14 Befunde (Blocker 1 · Hoch 9). ✅ 8.8.2026, PR #476 (10/14; übersprungen mit Begründung in §7: LM-162/LM-164 warten auf David, LM-166 Risikopfad → Daten-Session, LM-163 Browser-Rendering — eigene Untersuchung). §7.
  - [x] **B7 · Overlays und Menüfenster (K-02)** — 8 Befunde (Blocker 1 · Hoch 3). ✅ 8.8.2026, PR #477 (5/8: LM-010/LM-015 Scrim-Frage → @david-fragen; LM-016 eigener Schritt → Fehlerbuch). §8.
  - [x] **Gliederung im Gesetzes-Leser (Davids Befunde 8.8.2026 abends)** — ✅ überführt: Diagnose im [Dossier](bibliothek/betrieb/gliederung-perf-diagnose-2026-08-08.md), Bau als eigener Schritt `W2·19-GLIEDERUNG` (Queue-Spitze, eigene Session auf Davids Wunsch).
  - [x] **Beobachtungsposten `verzahnung.e2e.ts:201`:** ✅ Wurzel gefixt 9.8.2026 (`ea1fcedf3`): zwei `boundingBox()!` ohne Stabilitäts-Wartung; atomare Poll-Messung, unter 8 Workern + repeat-each 15/15 und 52/52 grün (vorher 2/3 rot).


> **Angelegt 10.7.2026 (QS-TOK / T7 «ROADMAP-Chronik-Split», Detailquelle `FAHRPLAN-TOKEN-OEKONOMIE.md` §3).**
> Diese Datei nimmt die **Erledigt-Prosa abgeschlossener (`[x]`) Schritte** aus `ROADMAP.md` auf —
> **verschoben, nie zusammengefasst** (kein Retrieval-Verlust; voller Wortlaut erhalten). In
> `ROADMAP.md` bleibt je Schritt: Checkbox + `@meta`-Etikett + Einzeiler + Pointer hierher.
> `ROADMAP.md` ist damit wieder der schlanke Session-Einstieg; hier steht das «Wie es gebaut wurde»
> zum Nachschlagen.
>
> **Nachhalte-Konvention (T7-K, Spec-Pflicht):** Wird ein Schritt künftig erledigt, wandert seine
> Abschluss-Prosa **direkt hierher** (Protokoll-Konvention in `ROADMAP.md` ▶ Ausführungs-Protokoll);
> in `ROADMAP.md` verbleibt sofort nur Einzeiler + Pointer. Der mechanische Re-Akkumulations-Wächter
> gehört in das QS-TOK-T1-Rotations-Skript (noch offen — kein Doku-Umschichtungs-Gegenstand).
>
> Reihenfolge = wie in `ROADMAP.md` (Wellen-Ordnung). Kein Steuerungs-Dokument: es **steuert nicht**,
> es archiviert nur. Der eine Plan bleibt `ROADMAP.md`.
>
> **Konventions-Erweiterung (Entscheid David 22.7.2026):** Auch **datierte ✅-Teilerfolgs-Prosa
> aus noch OFFENEN (`[ ]`) Schritten** wandert hierher (wörtlich, nie zusammengefasst); im Plan
> bleibt je Teilerfolg ein ✅-Einzeiler + Pointer. **Im Plan bleiben vollständig:** Status-
> Korrekturen, Bau-Warnungen («vor Bau-Start nachmessen»), offene Restposten und alles, was
> künftige Bau-Entscheide steuert. Beweis der Steuerungs-Neutralität je Umschichtung:
> `npm run plan:next` byte-identisch vorher/nachher + `check:plan` grün.

---

<!-- CHRONIK-EINTRAEGE (neue Einträge in ROADMAP-Wellen-Ordnung anhängen) -->

## S0 — Verfallsregister mechanisch *(fristgetrieben, done)*

**Erledigt 28.6.2026 (gebaut + gegated, deployt 2.7.2026):** Parse-Grammatik in eine geteilte
Quelle gezogen (`scripts/verfall-parse.ts`, §5) — `check:verfall` (Tor) und neuer Generator
`gen:verfall` teilen sie. Generator schreibt `src/data/verfallTermine.generated.ts` aus dem
Register; Drift-Tor `check:verfall-ui` in der `check`-Kette. Benannte UI-Fläche: Abschnitt
**«Aktualität & Pflege der Parameter»** auf `/methodik` (`src/components/VerfallUebersicht.tsx`)
listet die 15 datierten Parameter mit nächstem Prüftermin; Tagesbezug (verfallen / bald fällig /
aktuell) client-seitig (prerender-/hydration-sicher). SG-GKV 30.6. erscheint als «bald fällig»,
ab 1.7. «verfallen». `npm run gate` grün, Golden byte-gleich. Deployt 2.7.2026 (a3769d72).

## W1·1 — Begründungs-Absatz *(BEGRUENDUNGS-ABSATZ, done)*

Aus dem Rechen-Ergebnis ein **kopierfertiger, normgestützter Absatz**, jeder Wert mit
Norm+Link+Stand (schliesst die Rückrichtung *Werkzeug→Norm*). **Erst EIN Flaggschiff-
Vertikalschnitt komplett** (Prozesskosten), dann Rollout. §8-Rahmung «keine Rechtsberatung».

**Abschluss-Stand 28.6.2026 (deployt im §9-Batch 2.7.2026, `a3769d72`):** Phasen 0–2 umgesetzt —
`begruendungsAbsatz()` / `fristbeginnZusatz` / `BEGRUENDUNG_VORBEHALT`, `BegruendungSlot` als EINE
Aufrufstelle in 16 Forms, `useKopieren`-Hook, benanntes Engine-Feld `fristbeginnNorm` an ZPO/SchKG
(Magic-Index dort geschlossen, Wächter `src/tests/fristbeginnNorm.test.ts`), 14 `absatz:`-Goldens +
Linter über 14 Engines. Die 4 David-Entscheide sind gefallen; **Entscheid #3 = PDF-Absatz AUS**
(«Ansatz in UI reicht») ⇒ der frühere «nächste Schritt» PDF-Block + Kopier-Hook ist **erledigt bzw.
entfallen**: `PdfDocConfig.begruendung` in `src/lib/pdf/pdfModel.ts` bleibt gebaute, bewusst
abgeschaltete Kapazität ohne Aufrufer (weder entfernen noch stillschweigend anschalten — ein
Wiedereinschalten wäre ein eigener §6-deklarierter Schritt). Restpunkte → `ROADMAP.md`
«Nachträge aus der Archiv-Welle 31.7.2026»; Detail `archiv/FAHRPLAN-BEGRUENDUNGS-ABSATZ.md`.

## W1·2 — Norm↔Werkzeug-Brücke *(RECHTSSAMMLUNG P4/D1, done)*

**Index-Teil erledigt 28.6.2026 (gegated, deployt 2.7.2026).** `werkzeugeFuerNorm` (erlass-granular,
17 Erlasse) benannt + Map `ERLASS_WERKZEUGE` exportiert + Konsistenz-Tor `werkzeuge.test.ts` (kein
stiller Tippfehler → heimlich fehlendes Werkzeug, §8). Anzeige im Reader (KontextPanel «Passende
Werkzeuge») bestand schon; **neu** dezenter «N passende Werkzeuge»-Hinweis auf der Erlass-Karte
(`/gesetze`, Task 4.3). SSoT = Katalog (§5). **Der zweiachsige Startseiten-Einstieg (Rechtsgebiet ×
Aufgabe) ist Schritt 5** (Welle 2) und nutzt denselben Index — kein zweiter Pfad.

## W1·3 — Alltags-Rechner als Cockpits *(neu-Verpackung vorhandener Engines, done)*

**abgearbeitet 28.6.2026:** #2 neu gebaut (Grenzwert-Abgleich); #3 + #4 bestanden bereits
(kein §5-Duplikat gebaut); #1 zurückgestellt (S-5c-Konflikt, Davids Entscheid offen):
- **Fristen-Cockpit** (Vorwärts/Rückwärts/Stillstand) über `fristenspiegel/` + `icsExport`.
  ⚠️ **Zurückgestellt:** kollidiert mit S-5c (10.6.: eigenständiger Fristenspiegel bewusst
  aufgelöst, Ereignisse in Fach-Rechnern). David möchte den eigenständigen Einstieg NICHT
  wieder einführen → nicht gebaut.
- **Streitwert + Grenzwert-Abgleich** ✅ 28.6.2026 (gegated, deployt 2.7.2026): `streitwertGrenzwerte()`
  in `streitwert.ts` ordnet den Verfahrens-Streitwert STRIKT getrennt der ZPO-Verfahrensart
  (Art. 243 I, 30k) und der BGG-Beschwerde-Schwelle (Art. 74 I, 30k/15k Miete-Arbeit) zu; nicht-
  rechenbare Tore (243 II / 74 II / kant. Zuständigkeit / Art. 51–53 BGG) als «selbst prüfen» (§8).
  Schwellen am Snapshot verifiziert (§7). In `StreitwertForm` mit Gebiets-Toggle; Test + visuell.
- **Zuständigkeits-/Verfahrensnavigator** (`zustaendigkeit/straf/schkg`) — ✅ bestand bereits
  vollständig: Rechtsweg-Switcher Zivil/SchKG/Straf, je Weg voller Flow + Hero + Permalink + PDF,
  6 Test-Dateien (inkl. `*Bericht`-Adapter), e2e. Verwaltung bewusst `aktiv:false` (nicht im Scope,
  bräuchte Verifikation). Adress-Ausbau = Schritt 6.
- **Rechtsmittel-/Eintretensprüfung** — ✅ Logik bestand bereits: kantonal `bestimmeRechtsmittel()`
  (Berufung/Beschwerde, Fristen, Art. 314 Familienrecht, Stillstand) + BGG `berechneBgerRechtsweg()`,
  integriert in der Rechtsmittel-Gabelung des Navigators. Eine separate `rechtsmittel.ts` wäre
  §5-Duplikat → bewusst NICHT gebaut.

## W2·5c — Startseite V3 + Branding I2 *(STARTSEITE-V3, done)*

**✅ GEBAUT 3.7.2026 — Bausequenz S1–S5 komplett** (PRs #106 Messaging-SSoT ·
#107 Plumbing · #108 Bugfixes · #111 Neukomposition · S5 Brass-Hero; je Schritt Tore grün,
golden 201 byte-gleich, S4 e2e VOLL 89 passed, S5 Kontrast GEMESSEN hell+dunkel mit 2×
ink-500→ink-600-Ausweich [axe fing den zweiten] + dokumentierter Input-Ruhe-Grenze
[nicht-regressiv]; **Abnahme-Mappe `abnahme/startseite-v3/`** für Davids spätere Sichtung —
kein Druck, Zeitsperre). **Gesetz-/Entscheid-Titel im Zuletzt-Tracker ✅ 3.7.2026**
(Schreibzeit-Auflösung via lazy Manifest-Lader in `lib/zuletztTitel.ts` — dynamic import
erst beim Track-Event per requestIdleCallback+setTimeout-Fallback; Startseiten-/Shell-Chunk
ohne Register-Import [browse-Chunk hash-identisch, +1,1 KB reiner Tracker-Code], Kurzform
Kürzel/Zitierung mit Wortgrenzen-Kappung, Alt-Einträge ohne Titel crash-frei gefiltert;
Playwright-Nachweis OR→«OR», Entscheid→Zitierung, Rechner unverändert). **Rest offen (kein
Blocker):** Doks-Wording «deterministisch statt KI-geschätzt» ✅ nachgezogen (5.7.2026) · Wash-Ton-Veto =
Ein-Klassen-Fallback `bg-surface` in `Hero.tsx`. *Ursprünglicher Auftrag:* Neubau der Einstiegsseite: **modular** (Modul-Registry als FUNDAMENT-Vorleistung),
einfacher Einstieg in alle Funktionen, willkommend + modern OHNE Startup-Look. **Design-Richtung
durch DMAD-Council BINDEND entschieden** (Delegation David): Hybrid «A-Basis + Brass-Hero» als
Schalter-Liste — `bg-brass-100`-Hero mit integrierter Suche als einzige Wärme-Dosis (Fallback
`bg-surface`), KEINE Deko-SVG/Badges/XL-Typo/Gruss-Wort; Schnellrechner VOR den Kacheln;
Favoriten → «Zuletzt verwendet»; Zeiterfassung als Sektion auf `/rechner` (keine neue Route,
`ERWARTETE_ROUTEN` bleibt 57); H1 wird Value Proposition, I2-Messaging-SSoT in `seo.ts` +
neues Tor `check:seo-index`. **Bündelt:** geparkten Startseiten-Merker (30.6.) + I1
Sidebar-Reihenfolge + I2 Branding + W2·5-Startseiten-Modul-Rahmen + Redesign-zurückgestellt
(16.6., Kernideen im Council verwertet). **Bau-Spec (bau-fertig für autonome Opus-Session,
10 verbindliche Auflagen + erzwungene Bausequenz Plumbing→Hero-zuletzt):**
`archiv/FAHRPLAN-STARTSEITE-V3.md`; Herleitung + volles Council-Verdikt:
`bibliothek/recherche/startseite-v3-design.md`. **Auflagen-Kern:** Status-Wording §8-ehrlich
(kein «jede Angabe»-Absolutum, kein «geprüfte Bausteine»), Kontrast-MESSUNG vor Merge,
golden byte-gleich, e2e-Anker erhalten, §12-Koordination (tailwind↔W3·14, seo/prerender↔SEO-A11Y,
Topbar/UniversalSuche↔E2-Suche), Pflicht-Screenshot-Serie + Abnahme-Mappe. Trailer `Roadmap: W2·5c`.

## W2·6 / Verweis-Präzision im Entscheid-Leser (Referenz BGE 151 III 377) *(W2·6, QS-GP, done)*

**Teil 1 (Bug, §1-nah):** i.V.m.-Ketten-Verlinkung. Nur das letzte Glied trägt das Kürzel
(«Art. 684 i.V.m. Art. 679 ZGB»); das Kürzel wird jetzt auf die vorangehenden bare Glieder
**propagiert** und jedes einzeln verlinkt — EINE Wahrheit `normVerweiseImText` (`fedlex.ts`),
konsumiert von `NormText` (Inline-Linker) UND der Fundstellensuche. §1-Vorsicht: Propagation
NUR über echte Konnektoren (i.V.m./in Verbindung mit/und/sowie/Komma) auf bare Glieder; bricht
an Semikolon/BGE-Zitat/Satzgrenze/fremdem Kürzel; «f./ff.»+Abs./lit. brechen nicht; Anzeige
zeichenidentisch (Auflösungsziel synthetisiert). Doppelt verifiziert: 342 Snapshots, **890
propagierte Glieder / 686 Blöcke** (19870→20760 Links), 8 Handproben §1-korrekt.
**Teil 2 (Feature):** (a) Erwägungs-Anker (`e-2-4`, marke-basiert, schon vorhanden) +
Deep-Link-Scroll nach on-demand-Laden; (b) **Zitierte-Normen-Chips im Kopf → Sprung zur ersten
Erwägung mit Fundstelle** (`ersteFundstelle`, gleiche Ketten-Logik → «Art. 679 ZGB»-Chip trifft
die «Art. 684 i.V.m. Art. 679 ZGB»-Stelle in **E. 2.3.1**), lc-ziel-blink-Highlight, Regeste-
Fallback. Tore grün (golden 201, tsc/lint/3127 Tests inkl. neuer Units, `check:entscheide`/
`check:struktur-konsistenz`, Playwright), Snapshots unberührt (additiv).

## W2·6 / BGE-Auszug abgeschnitten — vollständig gefixt (34/34) *(W2·6-BGE, Inhaltsverlust, done)*

29.6.2026 GEFIXT + verifiziert (gate/golden byte-gleich, zwei adversariale Gegenprüfungen
gegen amtliche Quelle; die 1. fand einen Schutz-Tor-Blindfleck — Regex verlangte einen
Buchstaben vor U+2026 und übersah 5 auf Space/Punkt/Ziffer endende Kappungen → Regex auf
`(?<!\()…\s*$` geweitet, 5 nachgezogen, 2. Pass bestätigt). Die Default-«Auszug»-Ansicht der BGE-Leitentscheide schnitt Erwägungen
>5000 Z. **still mitten im Wort** ab (U+2026): `holeBgeLeitentscheid` lud — anders als der
Urteils-Body — den OCL-`/structure`-Auszug nicht voll nach (Datenfehler, nicht CSS).
**Fix** (`scripts/normtext/adapter-entscheide.ts`): geteilter Helfer `fuelleGekappteErwaegungen`
lädt gekappte Erwägungen (`holeErwaegung`) in BEIDEN Pfaden voll nach (Trigger: `text_chars
≥4900` ODER Ellipsis-Ende); **Id-Disambiguierung** gegen die präfixunscharfe OCL-Keyed-Lookup:
mehrere Id-Formen probieren (`151_V_1` · `151 V 1` · `bge_BGE_151_V_1`), nur die EXAKT passende
Entscheidung nehmen, Struktur über die kanonische `decision_id` holen.
**Regenerierung** ohne Vollbau via neuem Flag `npm run entscheide -- --additiv --bge-refresh`
(zieht nur die aktuell gekappten BGE neu, by-id-Überschreib; Bund/Kanton/eidg unberührt,
§7 kein Hand-Edit). **Schutz-Tor** in `check:entscheide`: Block, der auf U+2026 endet
(`(?<!\()…\s*$` — ausser amtl. «(…)»), ist ein gekapptes Excerpt → FEHLER/exit 1; deckt
`abschnitte` + `auszugAbschnitte`. **Ergebnis:** ALLE 34 BGE regeneriert + voll, gate/golden
byte-gleich, `check:entscheide` 0 Kappungen. **Öffnet keinen 26×-Slot.**

**Rest 30.6.2026 geschlossen** — `bge_151_V_1`/`bge_151_V_30` (kurze Seiten-Ids, deren
`/decisions/151_V_1` präfixunscharf auf `151_V_194` matchte) jetzt über die Id-Disambiguierung
(`151 V 1` bzw. `bge_BGE_151_V_1` lösen eindeutig auf, ref=`BGE 151 V 1`) sauber re-gefetcht —
kein Hand-Edit (§7). WARN-Quarantäne wieder entfernt, Tor ist reines FEHLER.

## W2·6a-MAT — Materialien-Verzahnung Stufe 1 *(DATA+UI, done)*

Verwaltungsverordnungen/Wegleitungen als Kanten am Norm-Artikel (David 3.7.: «SECO für ArG, EDÖB für DSG, ESTV für MWSTG»),
E6a Stufe 1 = NUR Verweis-/Register-Ebene (Index-Karte + Norm-Mapping + amtlicher Link, §7 a–d
korrekt gemappt inkl. sichtbarem Live-Link-Beweis, KEIN Volltext). **4 POC-bewiesene Quellen:**
ESTV-MWST (artikelscharf via Fedlex-#art_N-Anker, ToC-Hash-Drift-Arbiter) · SECO ArG/ArGV 1
(artikelscharf via Payload/Dateiname) · EDÖB Leitfäden (Erlass-Ebene ehrlich; VBGÖ gestrichen —
nicht im Korpus) · ESTV KS/RS (Suffix-Kaskade; Seiten-Fallback ehrlich `quelle='maschinell'`).
**Revisions-Invariante:** Cutoff-Tabelle je Erlass (revDSG/MWSTG-Teilrev) — artikelscharfe Kante
nur bei Dokument-Stand ≥ Cutoff, sonst Downgrade Erlass-Ebene; UI sagt «verweist auf … (Stand des
Dokuments)». SSoT `daten/soft-law.db` (gitignored) + **committeter Zustandsträger**
`bibliothek/register/soft-law-zustand.jsonl` (append-only; Entlistetes nie löschen, aus Projektionen
raus) → deterministische Projektion `public/materialien/kanten/<ERLASS>[/<bucket>].json`
(Kanten je (Dokument, Artikel) aggregiert, Bucket-Split ab M0, Weiche C = Rebuild aus
Manifest+Snapshot). Kanten im §3.2-Schema (zitat_key/roh_zitat/konfidenz; quelle-Enum +'amtlich').
Etappen M0 Fundament (check:materialien-NEUBAU) → M1–M4 Adapter (je PR = Prod-sichtbarer
Content-Release in Suche+Browse; browserlos, Drift in normen-monitor.yml) → **M5 UI-Delta GATED
auf V1a-Merge** (dep W2·7-VZUI, nur Etappe M5; BESTEHENDE Materialien-Gruppe, `VerzahnungsKante`
ziel.typ 'verwaltungsverordnung', StatusBadge 'nur-verweis' als bewusster V3-Vorzug; kein
Registry-Refactor). **M1 (ESTV-MWST) gated auf Davids robots-Freigabe Q1 (Fahrplan §8)**; M0/M2–M4
ohne Blocker sofort baubar. Tore: `check:materialien` (Neubau, +Wortfeld+Cutoff+Entlistungs-Quote) ·
`check:materialien-netz` (+normen-monitor.yml-Step) · gegenpruefung-Globs NEU `scripts/materialien/**`
· `gen:zaehler`. Stufe 2 benannt (BSV nach POC, FINMA/SEM nein, PDF-Volltext-Kanten nein). Kein
26×-Bezug — parallel zu E3/VPS fahrbar. Aufwand ehrlich ~7–10 Tage.
**Detailquelle:** `FAHRPLAN-MATERIALIEN-VERZAHNUNG.md` (§0 = Kritik-Einarbeitung, §8 = der eine
offene David-Punkt robots Q1). **Stand 4.7.2026: M0 ✅ (#126) · M2 SECO ✅ (#127) · M3 EDÖB ✅
(#128, 10 Dok DSG/BGÖ) · M4 ESTV-KS ✅ (90 Dok, 121 Kanten DBG/VSTG/STG) · M1 ESTV-MWST ✅
(robots-Freigabe David 4.7.2026 im Chat; 48 Dok MI+MBI, 3375 Roh-/1739 aggregierte Kanten
MWSTG/MWSTV, 1417 artikelscharf, 1186 Cutoff-Downgrades, MWSTG-Bucket-Split real,
§2.4-Revisions-Listen doppelt erhoben; Gegenprüfung 2 Durchgänge — D1 fand Anker-Drop
durch Fundstellen-Merge, gefixt via Teil-Kontext + Disambiguierung) · **M5 UI-Delta ✅ 4.7.2026**
(async `kontextSoftLaw`-Loader Shard/Buckets, «Amtliche Materialien»-Gruppe sync+async gemerged
mit Fundstellen-Sublabel «via Art. N u. a.»/Stand + Staleness §2.4 + «maschinell»-Badge; `StatusBadge
'nur-verweis'` als V3-Vorzug auf der MaterialLeser-Karte; `gen:zaehler` +Materialien-Zähler [326] +
Startseiten-Kachel; kuratierter Nachtrag als in-Bundle-Artikel-Anker STATT DB-Migration [DATABREACH→
Art. 24 DSG, KS 6a→Art. 65 DBG, DSFA §2.4-Downgrade — 3/3 gegen Live-Fedlex CONFIRMED]; 10 Unit + 3
e2e grün, CLS 0 auf OR/Startseite). **6a-MAT komplett (M0–M5).**

## W2·7-VZUI — Verzahnung sichtbar machen: V1a/V1c/V1b *(offener Schritt; ✅-Prosa wörtlich verschoben 24.7.2026)*

Ursprünglicher ROADMAP-Wortlaut (Schritt-Kopfzeile, Stand 24.7.2026):

- [ ] **6-VZUI · Verzahnung sichtbar machen** *(David-Auftrag 3.7.2026; reine UI auf vorhandenen Daten)* — **V1a ✅ GEBAUT 3.7.2026** (PRs #118/#121/#122 + e2e/Doku-PR; Fundament + Vereinheitlichung + Entscheid beide Richtungen + alle 4 Zusatzaufträge; 13 Verzahnungs-e2e grün, Referenzfall ZGB 684→BGE 151 III 377 = E. 2.3.1) · **V1c ✅ GEBAUT 4.7.2026** (Normrevisions-Ehrlichkeit: Build-Extrakt `public/verzahnung/artikel-revisionen/` 201 Erlasse/12702 Artikel + `klassifiziereFassungsBezug` in LeitfallZeile/KontextPanel/EntscheidLeser + `StatusBadge revidiert` ↻ mit Revisionsdatum+AS; Gegenprüfung bestanden — 3 reale Parser-Bugs gefixt, 0 Rest über 12702 Belege + 10 Artikel gegen Fedlex; 22 Unit + e2e AIG Art. 5/34); **V1b ✅ GEBAUT 4.7.2026** (Branch `feat/vzui-v1b-rangliste`; E4-Rangliste in die 19 Leitfall-Shards eingebacken: `norm_rangliste`-`gewicht` ersetzt build-time das kuratierte, Provenienz NIE gemischt — `gewichtQuelle:'e4'|'alt'` je Shard, 5 e4 [AHVG/AVIG/BVG/ELG/VVG] / 14 alt [vintage-absent Band-152-BGE oder Recall-Lücke]; masse.db-Rebuild deterministisch [195 342 Entscheide, Resolve-Quote 0,8245], Oracle-Tor GRÜN 931 Tripel/0 UNERKLÄRT, `check:entscheide` prüft Membership+Monotonie masse-frei; **727a-Vorbestands-Bug gefixt** [`normArtikelToken` strippt `_`, Reader-Query `727_a`→Shard `727a`]; Gegenprüfung bestanden) · **offen: V2 (E3-Serving) · V2 (E3-Serving) · V3 (E6a)**:

---

## W2·7 — Verzahnungs-Klingen *(done)*

**GEBAUT 5.7.2026** (Worktree `feat/w27-verzahnungs-klingen`, Dossier
`bibliothek/recherche/verzahnungs-klingen-w27.md`, STRUKTUR-Karte 5.7.). **(a) Verjährungs-/
Gewährleistungs-Board** (`/rechner/verjaehrung-board`): `verjaehrung.ts`-Regime-Matrix +
Gewährleistungs-Sonderfall + AT-Brücke; CISG nur Link. **(b) Verzugszins-/Forderungs-/Inkasso-
Strecke** (`/rechner/inkasso-strecke`): stateless Reverse-Reader Verzug→Verzugszins→Mahnung→
Betreibung→Fristen. **(c) Gerichts-Baustein-Set**: amtlicher Zitierer BGE/BGer
(`/rechner/gerichtszitat`, `gerichtszitat.ts`) + Rubrum-Vorlage (`/vorlagen/rubrum`, Art. 238
ZPO/112 BGG live verifiziert + gegengeprüft bestanden). Reine Darstellung auf bestehenden Engines
(§3); Golden 201 unverändert (+8 additiv), Gate grün, e2e 163, Gegenprüfung bestanden.

## W3·14-Responsive-Audit — Bildschirm-/Responsive-Audit *(SPLIT-VIEW, done)*

**ein** `ultracode`-Workflow — **AUDIT GEFAHREN 5.7.2026 (rein lesend, PR `chore/responsive-audit`):
30 Motive × 5 Breiten (390/768/1280/1536/2560) = 150 Aufnahmen; 0 Seiten-Overflow, 0 Konsolenfehler;
12 Defekte geflaggt (1 hoch: Vorschau-Knopf im Vertragstyp-Raster @390 · 2 mittel: Header-Tap-Ziele
<44px @390, methodik-Einzelspalte @2560 · 9 niedrig, 2 davon «manuell verifizieren»). Befund +
Anleitung `abnahme/responsive-audit/BERICHT.md`; Fixes = spätere Schritt-14-Einheiten.**

*Ursprüngliche Bau-Anweisung (Plan):* fotografiert **Seiten × Breakpoints** (Handy hoch ~390 ·
Tablet ~768 · Laptop ~1280 · Desktop ~1536 · Ultrawide ~2560) und flaggt Layout/Umbruch/**Tabellen-
Overflow** (maschinell je `<table>`/Pane über `scrollWidth>clientWidth`, deterministisch §2).
**Werkzeug zuerst prüfen (§5/§10): auf dem bestehenden Playwright-bash-Harness `scripts/screenshots.ts`
aufsetzen** — Playwright-Start, Motiv→Route, Arg-Parsing und ehrliches FEHLT-Logging (§8) sind dort
schon da; nur die Breitenliste (heute 360/768/1280) auf die fünf erweitern und die Seitenmenge
ergänzen, **nicht** neu erfinden. **NICHT** der Playwright-MCP (Bash-Lektion 22.6.); Playwright ist
bereits Dependency. **Aufruf** (kontextlos lauffähig): `npm run preview -- --port 4321 --strictPort`,
dann `npx vite-node scripts/screenshots.ts -- --base-url http://localhost:4321 --out
abnahme/responsive-audit/ist-<sha7>` — neuer Ausgabe-Pfad ⇒ eine `.gitignore`-Zeile
`abnahme/responsive-audit/` ergänzen, Binär-PNGs nie committen (§6). **Rein lesend:** berührt selbst
keine §12-Kollisionsdatei und kein Golden-/Logik-Tor (§6), Status-Modell unberührt (§8), kein Deploy
ohne Davids Ja (§9); Befund = Screenshot-Mappe + Defektliste, **rein visuell verifizierbar, keine
Davids-Fachzeit**. **Kein eigener Strang — gehört in Schritt 14** (dasselbe Breakpoint-/Container-
Query-Subsystem), denn die aus dem Audit folgenden Fixes treffen **dieselben §12-Kollisionsdateien wie
Schritt 14** → **im selben Worktree wie Strang B, nie als paralleler Strang** (kein 26×-Bezug).

## W2·5d — Gesetzes-UX: Teilerfolge G0–G6 + Anmerkungs-Welle A1–A18 *(offener Schritt; ✅-Prosa wörtlich verschoben 22.7.2026)*

  **Stand 4.7.2026:** **G0** (Grundart-Register/`check:grundart`) **und G1**
  (Linien-Kanon 3 Rollen-Tokens + `max-w-reading` + Einzug-Skala/Mobil-Kollaps +
  `hyphens:manual` + Randtitel-Hänge-Einzug; Tore R1 `check:linien-kanon` /
  R2 eslint / R4·R5 e2e; Reglement-Falt in `DESIGN-REGLEMENT-NORMTEXT.md §4b`;
  Wortlaut + Engine-Golden byte-gleich) **gebaut**. **G2a** (Leser-Options-Leiste
  Linien/Fussnoten/Verweise als reine `data-*`/CSS-Toggles am `<html>`,
  localStorage + Pre-Paint via `main.tsx` CSP-konform ohne Inline-Script;
  `leserOptionen.ts` + `LeserOptionenLeiste.tsx`; R6 golden byte-gleich bewiesen
  [`golden:vergleich` IDENTISCH 201], R9 Fussnoten-«AUS» dämpft/versteckt nie
  [e2e]; global = beide Reader-Instanzen synchron ohne Re-Render §15) **gebaut**.
  Bewusste G2a-Grenze: Linien-Default global AN (grundart-abhängiger Default =
  G2b, `grundart` nicht auf `BrowseErlass`); Fussnoten-Options-Toggle koexistiert
  mit dem bestehenden Apparat-Schalter (Unifizierung = G2b Kopf-Zusammenführung).
  Nächste Etappe **G2b** (Kopf-Merge/Fussnoten-Render-Fix/Sticky-Kontextkopf).
  R5-Mobil offengelegt auf ~30ch statt aspirativ 40ch (physikalisch gedeckelt
  @390, s. FAHRPLAN + Spec-Kommentar). **G4** (Einstieg /gesetze + Cmd/Ctrl-K,
  eigener Worktree, kollisionsarm) **gebaut**: (a) Landeplatz löst die Dreifach-
  Redundanz auf — drei gleichwertige Einstiegskacheln mit Live-Statistik statt
  stillem Bund-Default, neutrale Overline, Segment/Tab-Panel erst NACH Säulen-Wahl
  (`?ebene=`); alte Deep-Links (`?ebene=`/`?kt=`/`#sys-`/`?q=`) bleiben erreichbar.
  (b) Globale **Befehls-/Sprung-Palette** (`Cmd/Ctrl-K` + Mobil-Knopf in der Topbar)
  mit deterministischem **Norm-Query-Parser** (`src/lib/suche/normQuery.ts`):
  «OR 257d»/«Art. 5 AIG»/«ZGB 684 II»/«VMWG»/Kanton mit Code «StG AI 5» →
  `#art-<token>`-Deep-Link in ≤2 Interaktionen; Token-Ableitung kongruent
  passus.ts (257d→257_d, 49abis→49_a_bis), KEIN neuer Index (sitzt auf dem
  Browse-Manifest), Freitext → normale Suche (kein Fehl-Sprung). Lazy (§15, kein
  Eager-Load im Erst-Paint), a11y role="dialog"/Fokus-Falle/Esc via `useDialogFokus`.
  29 Unit-Akzeptanztests (`normQuery.test.ts`), 6 e2e (`befehlspalette.e2e.ts`);
  golden byte-gleich (kein Normtext/Engine); `gegenpruefung: n/a — reine UI`.
  **G5** (Kantons-Seite entrümpelt, eigener Worktree, kollisionsarm) **gebaut**:
  Kontext-Zeile Mengen-Asymmetrie (§8) · Sicht-Umschalter **Karte | Liste**
  (Karte default sichtbar statt zugeklapptem `<details>`) · Sortierung
  **Alphabet/Erlass-Zahl/Region** (Region = BFS-Grossregionen `grossregionen.ts`) ·
  Ordnung vereinheitlicht (Sidebar-Kantone alphabetisch nach Vollname statt föderal,
  `navigation.ts`) · Roh-Code→Klartext (Sammlungs-Kürzel-Buckets «LS»/«bGS» → ein
  ehrlicher «Nicht systematisiert»-Block statt «Bereich LS», Roh-Code bleibt je
  Erlass an der Nummer) · Mobil-Vollnamen (kein `truncate`, wrap). Reine Darstellung
  (§3), kein Risiko-Pfad im Diff → `gegenpruefung: n/a`; golden `golden:vergleich`
  IDENTISCH; 8 Unit (`grossregionen`/`navigation`) + 6 e2e (`gesetze-kanton-g5`),
  volle Suite 139 grün.
  **G2b** (Kopf-Merge `ErlassLeserKopf` + Fussnoten-Unifizierung + Sticky-Section-
  Kontextkopf + «Zitat kopieren», eigener Worktree) **gebaut** (s. STRUKTUR-Karte).
  **G3a** (Per-Grundart-Darstellung, Worktree `feat/gesetzes-ux-g3a`) **gebaut
  (5.7.2026):** Laufzeit-Grundart aus `GRUNDART_SEED` via `grundartMeta()` in der
  Darstellungsschicht (`helpers.tsx`, §5 — kantonale Erlasse stehen nicht im
  `ERLASS_REGISTER`, darum Seed als SSoT; **kein Risiko-Pfad im Diff**). **erlassTyp-
  Kopf-Label** (`kopfOverline`): 103 Verordnungen heissen jetzt «Verordnung» statt
  «Bundesgesetz», BV «Bundesverfassung», 18 Staatsverträge «Staatsvertrag», Kanton
  «Kanton XX · Gesetz|Verordnung». **⑥ KANTON §-Label:** «§ N» steht schon im
  Snapshot-`artikelLabel` → `bestimmungsEtikett` steuert nur das Kopf-Zähl-Substantiv
  «N Paragraphen» (775 §-Kantone); Anker bleibt **überall** `art-<token>` (R8, e2e).
  **⑤ Staatsvertrag** Präambel (bereits `ErlassKopfBlock`) + Label; **⑦ PDF-Rahmen**
  `border-rule-struktur`; **⑧ LIVE_VERWEIS** ehrliche Verweiskarte statt Fehlerseite
  (amtlicher Live-Link + Stand + §8-Hinweis) für die 9 `nur-live-link`-Erlasse; **④**
  Kurzerlass-Lesespalte lag durch G1 schon auf `max-w-reading`. **K11 umgesetzt**
  (grundart-abhängiger Linien-Default): Tri-State `data-linien:auto` + `data-grundart`
  am `.lc-leser` — nur KODIFIKATION zeigt den Guide im Default, expliziter Klick
  übersteuert; CLS 0. **Nebenfix:** Options-Switch OFF-Zustand `text-ink-500`→
  `text-ink-600` (WCAG 4.47→~6.7:1, latenter G2a-a11y-Bug, durch K11-Default-OFF
  aufgedeckt). Reine Darstellung (§3) → **`gegenpruefung: n/a`**; `golden:vergleich`
  IDENTISCH (201) + Prosa-Byte-Beweis ZGB/OR/VMWG/BV/AG-Kanton gegen `origin/main`;
  `check:grundart`/`check:linien-kanon`/`check:normtext`/`check:struktur-konsistenz`
  grün; neuer e2e `gesetze-ux-g3a` (6) + a11y/leser-Specs grün.
  **G6** (Rechtsgebiets-Sicht «Gerüst», Worktree `feat/gesetzes-ux-g6`,
  kollisionsarm) **gebaut (5.7.2026):** zweite, achsen-orthogonale Gliederung über
  eine vierte Landeplatz-Tür (`?ansicht=rechtsgebiet`) in `src/pages/Gesetze.tsx` —
  (a) **Auto-Grundgerüst** aus der vorhandenen `rechtsgebiet`-Achse (7 GEBIETE,
  aufklappbar, deckt JEDEN Bund-Erlass) + (b) **Querschnitts-Delta**: 8 kuratierte
  Praxisfelder (Arbeit / Miete & Pacht / Vertrag & Haftung / Gesellschaft & Handel /
  Familie & Erbrecht / Sachenrecht & Grundeigentum / Zwangsvollstreckung / Steuern &
  Abgaben) in `src/lib/normtext/rechtsgebiet-thema.ts` (SSoT — **kein** dupliziertes
  Register-Feld `rechtsgebietThema`, Abweichung von Spec §5.1 offengelegt, §5), enge
  Norm-Verankerung mit funktionierendem Deep-Link (OR Art. 319–362 → `#art-319`,
  Anker bleibt `art-<token>`, K2/R8) + je Thema **Verzahnung** (Rechner-Slug +
  `/rechtsprechung?rg=`) + `status: entwurf` (§8, K8). **Tolerantes Tor**
  `src/tests/rechtsgebiet-thema.test.ts`: Mitglieder-/Werkzeug-Slugs müssen
  existieren, 6–8 Themen, §7-Beleg je Zeile; Abdeckung wird beziffert (40/229
  Bund-Erlasse thematisiert), «unzugeordnet» ist zulässig (nie rot). Reine
  Darstellung/Klassifikation (§3); `golden:vergleich` IDENTISCH (201); neuer e2e
  `gesetze-rechtsgebiet-g6` (2) + Landeplatz-/Kanton-Regressionen grün; Visual-Review
  Desktop 1440 + Mobil 390 (0 Overflow). **Vollkuration bleibt späterer Strang**
  (nach Abnahme-Zeitsperre). **G3b Schritt 1 · Kanton-Tarif-Tabellen Stufe 2, Klasse A+D
  (Risiko-Pfad, 5.7.2026) gebaut:** die bereits extrahierten ·/—-Kanton-Tabellen
  (NW-265.51, BS-154.810, BS-291.400, SO-614.11, VS-173.8-de+fr; 32 Blöcke) vom
  Legacy-`{kopf,zeilen}` aufs kanonische typisierte `{spalten:[{typ,titel}],zeilen}`-
  Modell (T-B1/T-B4) nachgezogen → typgesteuerte Ausrichtung + Klasse-D-Tausender-
  gruppierung NUR in betrag/zahl/bereich (T-C5). Behebt einen §7-Faithfulness-Bug
  des Legacy-Renderers (globales `gruppiereTausender` verunstaltete Zitat-Jahre:
  «1937»→«1'937» in BS-154.810 Verfahrens-Spalten). Deterministischer Spalten-Typer
  `typisiereSpalten` (Prosa/Position→text, Staffel→bereich, Betrag→betrag, Satz/%→zahl,
  ziffernloses Einzelwort «gebührenfrei»→betrags-kompatibel); Werte (`zeilen`)
  byte-gleich (nur Typ-Metadaten+`sha` neu). Offline-Re-Projektion über den
  generator-eigenen Typer+`sha256Bloecke` (kein LexWork-Refetch → 0 Fremd-Drift).
  `check:gegenpruefung` **bestanden** (unabhängiger Opus-Pass gegen LexWork-APIs
  NW/BS/SO/VS, alle Stichproben byte-exakt, 0 Zeile verloren). Tore
  golden/tsc/vitest/lint/check:tabellen/paritaet/normtext grün, e2e 12/12; Visual
  Desktop+Mobil (0 Overflow @390). Zusatz: e2e-Flake `gesetze.e2e.ts` (OR
  fill-Timeout) gehärtet (Scroll-Spy/Suche-Kontrakt auf VGKE seitengrössen-
  unabhängig, App-Ready-Wait; 6× CPU-Throttle-Probe 5/5). **G3b Schritt 2 ·
  Anhang-Block-Rendering ③/⑤ (reine Darstellung, 5.7.2026) gebaut:** Anhänge
  (`annex_*`) + Staatsvertrags-Protokolle (`lvl_*`, LugÜ) rendern jetzt als
  eigenständig erkennbare, klar abgesetzte Blöcke (Struktur-Trenner + «Anhang N»/
  «Protokoll N» als Struktur-Überschrift, `data-anhang`; Anker bleibt `#art-`/R8;
  Ziffer-Zwischentitel via bestehendem `titel`-Block/M13). **LugÜ-Mobil-Overflow
  (scrollW 790 @390) gefixt** — Ursache war empirisch NICHT die Tabelle (die
  scrollt im `overflow-x-auto`-Container), sondern der `shrink-0`-Bereich-Badge der
  Anhang-Sektion (Lang-Labels 770px) → für Anhang-Sektionen unterdrückt + generisch
  umbruchfähig. Mehrspalten-Tabellen: `lc-scroll-x` + `min-w-full w-max` → breite
  Tabellen scrollen seitlich statt Zellen zu zerquetschen. **`gegenpruefung: n/a`
  literal** (nur `src/pages/gesetz-leser/**` + `ArtikelBody.tsx` + e2e — keine
  Risiko-Datei). Wortlaut-Byte-Beweis GSchV/ChemRRV/LugÜ/ZGB byte-identisch gegen
  `origin/main`; voller `gate` grün; e2e 1 Worker grün + neuer Spec
  `gesetze-ux-g3b-anhang` (5); Visual Desktop 1440 + Mobil 390 (0 Overflow @390).
  Trailer `Roadmap: W2·5d`.
  **G3b Schritt 2 (Tarif-Strang) · Klasse B (verklebte Zahlen, 5.7.2026,
  parallel zur Anhang-Einheit) fertig:** die x-koordinaten-rekonstruierten
  Streitwert-Staffeln ZH-215.3 §4, ZH-211.11 §3+§4 (zhlex-PDF) sowie ZG-163.4 §3,
  TG-176.31 §5 (LexWork-·/—) aufs kanonische `spalten`-Modell nachgezogen (5
  Tabellen / 44 Zeilen; `zeilen` byte-gleich). **Befund (§7, wie Schritt 1):** die
  x-Spaltenrekonstruktion war für ZH bereits committet (Commits e17793e8/559b1d9a),
  ZG/TG kommen vor-gespalten aus den LexWork-Zellen — kein NEUer Extraktions-Code
  nötig; der ZH-Adapter emittiert die Staffel jetzt kanonisch (kein Legacy-Regress).
  Verkleben-Befunde `100001250`=`10 000`|`1'250` und `5000250`=`5 000`|`250`
  x-getrennt verifiziert. `check:gegenpruefung` **bestanden** (unabhängiger Opus,
  44 Zeilen gegen zhlex-PDF via pdfplumber + LexWork-xhtml; Konkatenation==Roh,
  0 verloren/erfunden/geändert). Tore golden/tsc/vitest/lint/check:tabellen/
  paritaet grün, e2e 158; Visual ZH-215.3 §4 + ZH-211.11 §4 Desktop+Mobil (Tabelle
  scrollt im Container, 0 Page-Overflow @390, Tausender-Apostroph korrekt).
  **G3b Schritt 3 (Tarif-Strang) · Klasse C (SG-Füllpunkt-Rest, 5.7.2026) fertig —
  G3b KOMPLETT (A+B+C+D):** Diagnose der 159 nicht erfassten SG-Blöcke (SG-3849 135/
  SG-2935 20/SG-2808 4) = **kein** Block-Grenzen-Problem, sondern der **DEFECT-1-Guard**
  (Block als Plaintext gedroppt, sobald das letzte Leader-Segment nach dem Betrag noch
  angeklebten Folge-Inhalt trug — nächste Position/Überschrift/Folge-Artikel/Seitenzahl).
  Fix §1-konservativ: DEFECT-1 → **`nachtext`** (saubere Leader-Zeilen tableisiert, trailing
  Rest verlustfrei als Folge-Textblock; **Konkatenations-Invariante** als Unit-Test).
  Mehrdeutiges bleibt Text (mittleres Segment ohne Betrag, eingebetteter No-Leader-Betrag,
  No-Dash). **127 Einträge → +127 Tabellen** (SG-3849 110/SG-2935 15/SG-2808 2), **32 §1-
  konservativ Plaintext** (14 eingebettete Beträge + 18 Nicht-Tarif-Füllpunkte, unverändert
  zu HEAD). **Blast-Radius bewiesen SG-only** (0 Fremd-Kanton neu tableisiert; AUSSCHLUSS
  BL/FR unberührt). Klasse D für SG-`tabelle` durch bestehenden `TarifTabelle`-Renderer
  gedeckt (`gruppiereTausender` → `4'000`/`15'000`). Offline-Nachzug `kanton-fuellpunkt-
  nachzug.ts` (exakte produktive `reichereTabellen`, kein PDF-Refetch → 0 Drift); leader-
  freier Inhalt aller 728 SG-Einträge byte-identisch HEAD↔regeneriert. `check:gegenpruefung`
  **bestanden** (unabhängiger Opus, neue Tabellen zeichenweise gegen SG-PDFs via pdfplumber).
  Tore golden `IDENTISCH`/tsc/vitest/lint/check:tabellen/paritaet/normtext/struktur-konsistenz
  grün, e2e 163/163; Visual SG Desktop 1200 + Mobil 390 (0 Overflow @390, Apostroph korrekt).
  `ArtikelBody`/Reader unberührt (TABU). Detail: `FAHRPLAN-TARIF-TABELLEN-STUFE2.md`.
  **Stand 5.7.: G0–G6 ✅ gemergt** (#132/#135/#136/#141/#143/#145/#147/#148/#149,
  golden byte-gleich). **Anmerkungs-Welle A1–A18 (David 5.7., Go erteilt im Chat
  «run till dry»; Wortlaut-Quelle `docs/ux-audit-2026-07/ANMERKUNGEN-DAVID-2026-07-05.md`,
  Bau-Spec `FAHRPLAN-GESETZES-UX.md` §10):** revidiert die GEMERGTEN Etappen —
  **U-LINIEN ✅ gebaut** (PR `feat/u-linien-a8`: Linien-Default aufbau-basiert statt
  grundart-Kategorie — SSoT `linienAufbau.ts`, Schwellen empirisch aus 1135 Sidecars,
  Reglement §4b-A, Tor `check:linien-kanon` = R1/R4-Nachfolger; ZGB ruhig, ArG
  sichtbar; Wortlaut/Golden byte-gleich) → **U-KOPF ✅ gebaut** (PR
  `feat/u-kopf-a1-a3-a4`, Auto-Merge armiert; Ausführungsvermerk §10.7): A1
  Fussnoten-AUS = VERSCHWINDEN (display:none, überstimmt R9 — David-Entscheid;
  Normtext bleibt durchsuchbar, Print folgt Toggle, CLS 0) · A3 Positions-Leiste =
  echte klickbare Breadcrumbs (nav/ol/li, aria-current, springeZuSektion) · A4
  «Ansicht»-Dropdown im Kopf (`LeserAnsichtMenu`, ehrliche Disclosure + useDialog-
  Fokus; Chip-Leiste entfällt); P1 golden-ändernd (Kopf-Markup), Artikel-Prosa
  byte-gleich; Gate + e2e (inkl. neuer A9-Throttle `leser-kopf-a9`) grün →
  **U-VERWEIS ✅ gebaut (10.7., PR `feat/u-verweis-a7-a10-a11-a13`;
  Ausführungsvermerk §10.7):** A10 Plural-Linker `artikelnPluralVerweise`
  (MWSTG Art. 5 = GENAU 5 Links art_31/35/37/38/45; bounded, §1-Unterdrückungs-
  Regeln BGSA/Code-civil/42octies; Korpus 2091 Regionen/5187 Glieder) · A11
  Präambel-Verweise (kuratierte Genitiv-Map «der Bundesverfassung»→BV, 26 belegte
  Einträge + **aBV-Schutz**: Ingress-Linkung nur Erlassdatum ≥ 2000) · A7
  Verweis-Popover strukturiert (Wortlaut → Provenienz → Massgebliche Entscheide →
  abgetrennt Amtliche Materialien; `VerweisKontext`, geteilte Shards, Top-3+Zähler,
  CLS 0 by construction) · A13 Materialien-Kanten klarer (artikelscharf prominent,
  Erlass-Ebene hinter `<details>`-Zähler). Reglement §5a; Gate voll grün, Engine-
  Golden byte-gleich, e2e 188/188 inkl. `verweis-u` (A9-Throttle) →**
  **U-POSITION ✅ gebaut (11.7., PR `feat/u-position-a2-a16-a17`;
  Ausführungsvermerk §10.7):** A2 inhalts-proportionale content-visibility-
  Platzhalterhöhe (`schaetzeArtikelHoehe`, überschreibt den Flach-320px →
  proportionaler Scrollbalken, content-visibility bleibt = kein Logikverlust) ·
  A16 anker-basierte Scroll-Restoration (`scrollAnker.ts`, oberster Artikel +
  Offset, element-basiert robust gegen die Höhenschätzung; interne Verweise
  navigieren über den Router = echter History-Eintrag; NormPopover «Im Gesetz
  öffnen» SPA-`<Link>` → Cross-Erlass-Zurück landet am Ausgangs-Artikel) · A17
  Split-View liest den Pane-lokalen Hash/`?norm` ⇒ Norm-⧉ öffnet an Art.+Passus,
  Entscheid-⧉ an der Erwägung (nie stumm falsch). Golden byte-gleich (Client-
  Reader; kein `public/normtext`), Gate voll grün, e2e `leser-position-u` (P4 +
  A9-Throttle CLS 0). Parallel kollisionsarm:
  **U-SUCHE ✅ AUSGEFÜHRT (5.7., PR feat/u-suche-a5-a6, Auto-Merge armiert;
  Ausführungsvermerk `FAHRPLAN-GESETZES-UX.md` §10.7):** normQuery aus der
  gelöschten `BefehlsPalette` in die NORMALE Suchleiste (Sprung = oberster
  Treffer, Enter springt), Palette entfällt, ⌘K/«/» fokussieren die HeaderSuche;
  A6-Relevanz-Gruppierung (Rechtsinhalte vor Werkzeugen); KEIN Zweit-Index; Gate
  + e2e grün, `Gegenpruefung: n/a` · U-UEBERSICHT (A14/A15: Titel umbrechen statt kappen,
  Relevanz-Sortierung dokumentiert-deterministisch, Gliederungs-Umschalter
  Relevanz/Systematisch/Rechtsgebiet auf allen 3 Säulen; G6 = Modus statt vierte
  Tür) · **U-PDF ✅ AUSGEFÜHRT (11.7., PR `feat/u-pdf-a12`, Auto-Merge armiert;
  Ausführungsvermerk `FAHRPLAN-GESETZES-UX.md` §10.7):** Download = amtliches PDF
  der gepinnten Fassung (Bund Fedlex-`isExemplifiedBy` build-time — Suffix-Falle `-2`
  durch exakte URL statt Konstruktion gelöst, 227/227; Kanton LexWork bei Versions-
  Gleichstand, 1184/1231; Staatsvertrag self-hosted; render-eigenes `.txt` entfernt,
  §10.5); neues Tor `check:pdf-quellen` bindet die PDF-URL an die `fedlex-cache.sh`-
  Pins; `Gegenpruefung: bestanden` (P5-Stichprobe 12, Fassungsdatum-im-PDF-Beweis
  inkl. `-2`). **Damit ist die kollisionsarme A1–A18-Welle gebaut; offen nur das in
  CI laufende U-POSITION (A2/A16/A17).** A18 (BGE-Regeste nach Sprachen) → W2·6-B B2.
  A9 = DoD-Querschnitt (CPU-Throttle-Beweis) in jedem Bau-Prompt. **Kollisions-
  Precheck gegen laufende Worktrees (lm-qsperf/lm-l0) vor jeder Einheit; W2·7-Klingen
  #154 und W2·6a-MAT sind gemergt — nicht mehr live.** Trailer `Roadmap: W2·5d`.
  **U-UEBERSICHT ✅ (5.7., Opus, Worktree `feat/u-uebersicht-a14-a15`):** A14
  (Kanton-Titel umbrechen statt kappen + Relevanz-Sortierung = dokumentierte
  Kern-Erlass-Kategorie, dann Systematik) + A15 (Gliederungs-Umschalter
  Relevanz/Systematisch/Rechtsgebiet auf allen 3 Säulen, G6 = Modus + Tür bleibt;
  Wahl persistent `?gliederung=`/localStorage, alle bestehenden Deep-Links
  erreichbar). SR-0.*-Labels per Gegenprüfung korrigiert (0.5 → «Krieg und
  Neutralität»). Gate 25/25 grün, golden identisch, e2e 173/173 (inkl. A9
  6×-Throttle). Detail: `FAHRPLAN-GESETZES-UX.md` §10.7. Rest der Welle offen
  (U-LINIEN/U-KOPF/U-VERWEIS/U-POSITION Reader-Kette nach QS-PERF; U-SUCHE; U-PDF).

## W2·5b — Reader-Darstellung Bund: Bündel R/N + Phase-1-Batch + Restblock *(offener Schritt; ✅-Prosa wörtlich verschoben 22.7.2026)*

  - **+ Auftrags-Eingang 30.6.:** **[x] Bündel R ✅ FERTIG + LIVE** (PR #59 `0560fd87`, prod-verifiziert 30.6.
    via Perf-Deploy): R1 Scroll-Spy Kopf+Gliederung · R2 Gliederung links ab 1024 px · R3 A−/A+ Schriftgrösse
    statt Kompakt/Breit. **[x] Bündel N ✅ FERTIG (1.7., Worktree, gegated — deployt 2.7.2026):**
    **N1** zerrissene Artikelnummer «329 g»→«329g» am Extraktor (`entferneTags` strippt Inline-Tags
    leerzeichenlos, Ziffern-sup/sub behalten Abstand; 194 Bund-Snapshots regeneriert, golden byte-gleich,
    Opus-Gegenprüfung BESTANDEN). **N2** falscher Self-Link auf benanntes Fremdgesetz unterdrückt
    (`fremdgesetzNachArtikel`, ~1195 Fälle, render-only; §7-Abweichung: ELI-Ziel steht NICHT im HTML-Body
    → erlass-genaue Chips = Phase-1-Folge; Gegenprüfung fand+fixte FinfraV-FINMA-Kürzel-Regression).
    **+ Verifikations-Tor** `check:invarianten` (Markup-/Entity-/Suffix-Leak). **+ Status-Marker:
    empirisch schon erfüllt** (aufgehoben = «· aufgehoben»-Statuszeile + Einklappen; noch-nicht-in-Kraft
    kommt bei current-consolidation-Pinning nicht vor) → §7-dokumentiert, kein Neubau. Details Eingangsblock.
  - **+ 2.7.: Verlässliche-Umwandlung-Spec (Fable-Ultracode) + Phase-1-Fundament-Batch.** Spec
    `docs/superpowers/specs/2026-07-02-verlaessliche-normtext-umwandlung-bund.md` (Verdikt Hybrid «XML-Träger,
    HTML-Arbiter»; verlinkt aus `FAHRPLAN-NORMTEXT-DARSTELLUNG.md §Quell-Architektur`). **[x]** erster Bau-Schritt
    rein HTML gebaut+gegated+gegenprüft: **P2** Split-sup-Merge (6 Blöcke: GEBV/HMG×2/KLV/CO2/VRV), **P4**
    SSV-Kachel-379-Leak, **P1** sha deckt `mehrspaltig.spalten`, **P5** `[tab]`-Negativ-Lexikon (Expected-Fail-Register).
    **[x] P3** Drop-Klasse laut ✅ 5.7.2026 (W2·5b-Restblock, s.u.). Detail STRUKTUR-Karte 2.7. + Spec §7.
  - [x] **+ Audit-Andockung 3.7.2026 (Audit 1, `BACKLOG-AUDIT-WERKZEUGE-2026-07.md`):** **N3 · `he` statt
    Handtabelle ✅ 3.7.2026** (Branch `feat/nulltarif-werkzeuge`: Ergebnis BESSER als erwartet — Bund-Regen aus
    gepinnten Caches **0-Byte-Diff** (golden-neutral; die `&ge;`/`&le;`-Klasse sitzt in Kanton-Quellen und
    greift bei deren nächstem Regen); einzige Divergenzen der Alt-Tabelle: `&nbsp;`/`&mu;` als dokumentierte
    Sonderfälle BEHALTEN, `&ldquo;`/`&rdquo;`-ASCII-Abflachung als deklarierte Korrektur auf WHATWG (Korpus-Impact
    heute null); Beleg `bibliothek/register/he-entity-korrekturen-2026-07-03.md`, QS-GP-Quittung).
    **✅ W2·5b-Restblock KOMPLETT 5.7.2026 (Worktree `feat/w25b-l0-haertung`, alle vier Posten):**
    **P3 Drop-Klasse laut ✅** — korpusweite `<p>`-Klassen-Inventur (218 Erlasse/24 602 Artikel,
    `p3-drop-inventar.ts`): Verdikt je Klasse in `bibliothek/register/p3-drop-klassen-inventar-2026-07-05.md`;
    EXTRAHIERT: standalone `man-template-tab-krpr` (OR art_361/362 = 28+61 Vorschriften-Zeilen inkl.
    aufgehobener «…»-Platzhalter, VRV 8
    Verweis-Noten; neue Block-Alternative 7) + bare `class="referenz"`→`grundlage` (347 Trägernorm-Verweise
    in ATSV/FZV/BankV/FINIV/FinfraV/ArGV5; Regex `\breferenz\b` deckt beide Formen); BEWUSST IGNORIERT
    (belegt): inkrafttreten/abstand1seite/tab-utit-Titel/tab-kpf/italic-Note; DEFERIERT (dokumentiert):
    absatz-pt-Varianten (ParlG-Eid, UVPV 13 III/IV) + GBV-34i-Textformel. **Stille Drops sind LAUT:** neues
    Tor **`check:p-klassen`** (Manifest entschiedener Klassen; jede neue Fedlex-Drop-Klasse bricht das Tor).
    **N3-B1 `he`-Entities ✅** — war schon 3.7. gelandet (Commit `50fd4e15`, main): Bund-Regen 0-Byte-Diff,
    Sonderfälle `&nbsp;`/`&mu;` dokumentiert BEHALTEN; hier verifiziert, kein Rest offen.
    **linkedom-POC ✅ GEMESSEN, Verdikt: KEINE Migration** — 9 562 `<dl>`- + 35 178 `<dd>`-Grenzen über den
    ganzen Korpus: **0 Abweichungen** Regex-Tiefenzähler vs. DOM (linkedom devDep nur für den POC;
    `poc-linkedom-tiefenzaehler.ts`, Beleg `bibliothek/register/poc-linkedom-tiefenzaehler-2026-07-05.md`) —
    Regex ist DOM-äquivalent, Umbau wäre verhaltensneutral = nur Risiko/Laufzeit ohne Gewinn (§7-Messpflicht
    erfüllt; E0/E1 bauen bewusst auf dem BEWIESENEN Parser). **SVG-style-Leak ✅** — `<style>/<script>`-
    Element-INHALT wird vor dem Tag-Strip entfernt (`NICHT_TEXT_ELEMENTE`); SSV-Signalkatalog-Kacheln von
    «.cls-1 { fill: #010101; }»-CSS bereinigt (5 Stellen, Signal-Nr/Name/Artikel vollständig erhalten;
    einziger `<style>`-Träger im Korpus). Daten-Regen 9 Erlasse (OR +4 713 Z., VRV +409 Z., 6 VO +348
    grundlage, SSV −CSS), golden klassifiziert-additiv, Engine-Golden byte-gleich, QS-GP-Quittung.

## W2·5 — Auffindbarkeits-Schicht: Zweiachsiger Einstieg + Artikel-Volltextsuche *(ABGESCHLOSSEN 25.7.2026; ✅-Prosa verschoben 22.7., Abschluss ergänzt 25.7.2026)*

### Restposten «Kanton-Volltext im Index» ✅ 25.7.2026 (PR #365, Trailer `Roadmap: W2·5`)

**Ausgangslage (gemessen):** `scripts/such-index-generieren.ts` las ausschliesslich
`public/normtext/bund` und schrieb `artikel-bund.json` mit hartcodiertem `ebene: 'bund'`.
**Gebaut:** die Ebene ist jetzt **Parameter** (`EBENEN = ['bund','kanton']`, `baueEbenenIndex(ebene)`
→ `baueIndex()`); Artefakt heisst `public/such-index/artikel.json`. **54 444 Artikel: Bund 25 389 +
Kanton 29 055 aus allen 26 Kantonen** (1 231 kantonale Erlasse). Prod-Smoke-Pfad mitgezogen.

- **Herkunft ehrlich (§8):** jeder Eintrag trägt `eb` (Ebene) + `kt` (Kantonskürzel). Der Treffer
  nennt den Kanton doppelt — Label-Suffix «· AI» **und** Marke «AI» **ohne** `redundant`, weil
  `redundant: true` die Marke auf Mobile ausblendet (`SuchResultate.tsx`, `max-sm:hidden`): beim
  Bund-«Gesetzestext» richtig (wiederholt nur den Gruppentitel), beim Kanton hätte es die
  Herkunftsangabe auf dem Handy komplett gelöscht. href geht auf `/gesetze/<eb>/<key>`.
- **Ranking-Regression gefunden UND behoben (der eigentliche Fund dieser Einheit):** das
  Query-Testset wurde auf den **vollen** Index umgestellt (bund-only wäre ab jetzt Fiktion) — und
  lief prompt rot: **«Miete» fand OR 253 überhaupt nicht mehr.** Ursache gemessen: FlexSearch kappt
  **je Feld** bei `limit`; im gemeinsamen Index teilen sich die Ebenen dieses Kontingent, die 193
  kantonalen Gliederungs-Treffer drückten OR 253 im `g`-Feld von Rang 259 auf **339** und damit aus
  dem 300er-Fenster. OR 253 führt «Miete» nur in der Gliederung («Achter Titel: Die Miete»), war
  also unauffindbar. **Fix: ein FlexSearch-Index JE EBENE** — der Bund-Recall ist damit exakt der
  von vorher und hängt nicht mehr davon ab, wie viel kantonales Recht im Korpus liegt; jeder weitere
  Kanton kann die Bund-Trefferlage nicht mehr verschlechtern. Dazu ein Tiebreak **Bund vor Kanton**
  bei gleicher Themennähe/Kernerlass-Rang (`EBENEN_RANG`, `artikelRanking.ts`) — sonst entschiede die
  Key-Alphabetik («AG-291.150» < «AHVG»), also der Zufall. Nach dem Fix: «Miete» → OR 253 **Rang 1**.
- **Kein stiller Verlust (§8):** der Generator protokolliert jede nicht indexierte Datei mit Grund
  (`unlesbar` / `kein-eintraege-array` / `kein-volltext`) im Artefakt **und** in der CLI-Ausgabe;
  vorher schluckte ein blosses `catch { continue }` kaputtes JSON spurlos. Real übersprungen: **genau
  eine** Datei, `kanton/index.json` (URL→Datei-Karte, kein Erlass). Neues Tor `suchIndex.test.ts`
  vergleicht gegen `public/normtext/register.json` in **beide** Richtungen.
- **§6.7-Sabotage-Probe gefahren:** Erlass still fallen lassen → rot («spurlos aus dem Index gefallen:
  kanton/AG-291.150»); `kt` blanken → rot (1 229 Erlasse ohne Kanton + Manifest-Abweichung).
- **Geräte-Last gemessen (§15):** Index **25.97 MB → 47.96 MB** roh, **5.44 MB → 9.94 MB** gzip
  (+83 %). **Lazy-Loading hält:** der Index lädt erst beim ersten Tastendruck in der Suche —
  Vollaufbau von `/gesetze` löst empirisch **0** Index-Anfragen aus. First Paint unberührt.
- **Praxisbeweis im Browser:** «Handänderungssteuer» (rein kantonale Steuer, vorher artikelseitig
  nicht auffindbar) liefert jetzt AI- und AR-Steuergesetzartikel; Klick landet auf
  `/gesetze/kanton/AI-640.000#art-116`, keine Konsolenfehler.
- **Beweis:** `npm run gate` voll grün · `check:suchindex` grün · Golden byte-gleich 249/249 ·
  `check:gegenpruefung` grün (kein Risiko-Pfad berührt — weder Rechnen noch Extraktion noch Norm-Tarif).
- **CI-Befund + Behebung (Nachtrag David 25.7.2026):** `Browser-Smoke Shard 1/3` war rot,
  `Perf-Budget` dadurch übersprungen. Drei Such-Specs liefen nach 2 Retries in `Timeout: 10000ms`
  mit `Received: 0` — Assertions korrekt, Treffer zu spät. Gemessene Ursache: clientseitiger
  FlexSearch-Aufbau **3 153 → 6 143 ms (+95 %)**. Behoben durch **gestaffelten Aufbau** (David
  gab Weg 1 frei): `baueSucher` ist inkrementell, die Doc-IDs sind globale Positionen im
  Eintrags-Array — der Kanton rückt nach, ohne dass der Bund-Index neu gebaut wird (der wäre
  sonst zweimal zu zahlen). Kanton in 2000er-Häppchen mit Yield, damit der Hauptthread frei bleibt.
  **Der volle Index wird weiterhin vollständig geladen; gestaffelt ist nur der Zeitpunkt.**
  Zwei Auflagen, beide gegated (`src/tests/suche/gestaffelterIndex.test.ts`):
    · **Teilzustand sichtbar** — `hinweis` an der Gesetzestext-Gruppe nennt die fehlende Ebene im
      Klartext, die Kopfzeile trägt «— wird noch ergänzt». Die Gruppe bleibt dabei **auch bei null
      Treffern** stehen: bei einer rein kantonalen Query verschwände sonst der Hinweis mitsamt der
      Gruppe, und die Suche behauptete stumm «nichts gefunden» über einen ungelesenen Bestand.
    · **Automatische Neuauswertung** — der Nachlade-Callback setzt ein neues `ArtikelSuche`-Objekt;
      die neue Identität lässt die React-Memo neu rechnen. Niemand tippt dieselbe Query zweimal.
  **Zeitmessung im Browser (lokal, `vite preview`):** erste Trefferanzeige **5 328 → 3 668 ms**,
  Kopfzeile mit Aufschlüsselung **5 344 → 3 941 ms**. Volle E2E-Suite lokal **314/314 grün**.
- **Index-Grösse im Perf-Budget verankert:** `check:perf-budget` deckelt
  `public/such-index/artikel.json` auf **10 400 KB gzip** (heute 9 667 KB). Hergeleitet, nicht
  gegriffen: ~3.6 KB gzip je Kanton-Erlass ⇒ ~200 weitere Erlasse Luft — ein weiterer mittlerer
  Kanton passt durch, ein Massenimport schlägt an. Der eigentliche Kostentreiber ist nicht die
  Leitung, sondern der clientseitige Aufbau; das steht als Warnung am Budget. Sabotage-Probe rot
  gezeigt (Deckel 9 000 KB ⇒ exit 1).
- **Ebenen-Tiebreak als PROVISORISCH gekennzeichnet** (Logik unverändert — sie hat eine echte
  Regression behoben): der Kommentar am Fundort hält fest, dass «Bund vor Kanton» eine Anzeige-
  Ordnung und keine entschiedene Relevanz-Politik ist, und dass sie in Gebieten kantonaler
  Zuständigkeit (Einführungsgesetze, Notariat, Steuern, Gerichtsorganisation) die einschlägige
  Norm systematisch nach hinten schiebt. **Entscheid David 25.7.2026: «Bund vor Kanton bleibt
  vorerst so.»** Damit ist die Ordnung bestätigt, aber ausdrücklich als vorläufig — die
  Kennzeichnung im Code bleibt darum bestehen und ist nicht zu entfernen.

  (Rechtsgebiet × Aufgabe)** ✅ **28.6.2026 (gegated, deployt 2.7.2026):** `einstiegMatrix()`
  (`src/lib/einstieg.ts`) projiziert den Katalog (§5) auf Rechtsgebiet × Aufgabe; Komponente
  `ZweiachsigerEinstieg` als zweite Achse auf `/rechner` (aufklappbare Gebiets-Kacheln, Werkzeuge
  nach Aufgabe gruppiert, nur verfügbar §8). Konsistenz-Tor `einstieg.test.ts`. Visuell bestätigt.
  **Globale Artikel-Volltextsuche** ✅ **28.6.2026 (David: «FlexSearch ja»; gegated, deployt 2.7.2026):**
  FlexSearch über alle **24 183 Bund-Artikel** (`bloecke`-Text), in DIE bestehende Suche integriert
  (neue Gruppe «Gesetzestext», `universalSuche`/`useUniversalSuche`, §5 ein Such-Workstream). Index
  build-time generiert (`gen:suchindex` → `public/such-index/`, gitignored, im `build`), lazy + eigener
  Chunk (FlexSearch 17 kB gz, NICHT im Haupt-Bundle — Task 4.4); Lib+Index ~4 MB gz erst auf erste
  Suche. Zitat-/Term-Suche stark («243 ZPO» → Art. 243 ZPO; Notwehr→Art. 16 StGB), Deklinations-
  Phrasen unscharf (§8-ehrlich). Snippet + Sprung `#art-`. Visuell bestätigt.

## QS-PERF — Teilerfolge Tor/Härtung/Kalibrierung *(offener Schritt; ✅-Prosa wörtlich verschoben 22.7.2026)*

  - **a · Tor `check:perf-budget`** — **`[✓]` KOMPLETT (5.7.2026, PR feat/qs-perf-a-b).** Bundle-Teil
    (Chrome-frei, `scripts/check-perf-budget.ts`) war seit 30.6. da; jetzt ergänzt: **`check:perf-lighthouse`**
    (`scripts/perf/lighthouse-budget.ts`) misst CLS/LCP/TBT/TTI/Score auf `/gesetze/bund/OR` + Startseite im
    Lighthouse-**Mobil-Preset (4× CPU + langsames 4G)** und ist als **letzte CI-Stufe** nach Build + allen
    Treue-Toren (golden/smoke/struktur-konsistenz/e2e) verdrahtet → §15-**Gegenkopplung** über die
    Schritt-Reihenfolge (Treue rot ⇒ Job bricht vor der Messung; nicht im schnellen `gate`, der nicht baut).
    **Median aus 3 Läufen** (CI; lokal 1) gegen Ausreisser-Flake. Schwellen an der **CI-Baseline**
    kalibriert (dort läuft das Tor — der 2-Kern-Runner legt unter 4×-CPU echten Spät-Shift/Blocking offen,
    stärker als lokal): CLS OR ≤ **0,15** / Start ≤ 0,10 (Regressions-Fänger, kappt die alte 0,64/0,57 mit
    Marge; FAHRPLAN-Eintritt war 0,25 → Ziel 0,10); LCP/TBT/TTI/Score grosszügige Deckel. **Ist Mobil-Preset:**
    OR CLS lokal 0,005 / CI ~0,10, Score CI ~38–56; Startseite CLS **0,000**. CI-Impact ~2 Min. Verschärfung =
    dokumentierter Folgeschritt nach breiterer CI-Baseline.

  - **e · CLS-Race-Härtung Reader-e2e** — **`[✓]` KOMPLETT (10.7.2026, `fix/cls-race-haertung`).**
    Drei byte-identische, nur unter CI-Parallel-Last reproduzierbare e2e-Rotfälle mit LayoutShift-
    Attribution auf die Wurzel gefixt (§15.2/§15.3), 12-s/CLS-Schwellen UNVERÄNDERT: (1) `verweis-u`
    0,49-CLS = `istXlVp`-Post-Mount-Flip 1→2-Spalten (`inhalt.tsx`, jetzt lazy-`useState` = Client-
    Initialstate gepinnt); (2) `leser-kopf-a9` 0,0001-Mikro-Shift = TOC-Akkordeon-Höhen-ANIMATION +
    spät committende `springeZuSektion`-Zweigöffnung (`parts.tsx` Akkordeon sofort statt animiert;
    `flushSync` + jumpLock 500 ms in `inhalt.tsx`); (3) `norm-sprung` Sprung >12 s = teure 4-MB-
    Artikelsuche blockierte den Sprung-Aufbau (`useUniversalSuche` `useDeferredValue` entkoppelt).
    Golden byte-gleich (nur React-Reader/Such-Hook); 10× lokal grün unter 6× Drossel. Detail:
    STRUKTUR-Karte 10.7.

  - [~] **TBT-Deckel je Job normieren statt absolut prüfen** *(gebaut, gemessen, VERWORFEN 20.7.2026)*.
    Umgesetzt und empirisch geprüft: eine synthetische, deterministische CPU-Last
    (`dist/_perf-kalibrier.html`) wird über dieselbe Lighthouse-Kette gemessen und als Divisor
    genutzt. **Ergebnis: funktioniert nicht zuverlässig.** Zwei Reihen zu je 8 unabhängigen Runnern
    (identischer App-Code) widersprechen sich: Reihe 1 senkt die OR-TBT-Streuung von CV 31.2 % auf
    16.5 % und räumt die Runner-Korrelation ab (r +0.83 → −0.21); Reihe 2 kehrt das Vorzeichen um
    (roh r −0.43) und das Normieren VERSCHLECHTERT auf CV 29.9 %. Gepoolt (n=16) bleibt eine
    Scheinverbesserung 26.8 % → 23.3 %. Auch eine abgeschwächte Korrektur `roh·(BASIS/kalib)^α`
    rettet es nicht: das gepoolt beste α=0.70 wirkt in den beiden Reihen in ENTGEGENGESETZTE
    Richtungen. Die Regressions-Steigung log(TBT)~log(kalib) ist 0.65 statt 1 — die unterstellte
    Proportionalität besteht nicht (eine Integer-Schleife misst die Kernfrequenz, die OR-TBT hängt
    daneben an Speicherbandbreite/Cache/Nachbarlast). **Assertiert wird darum weiter der Rohwert.**
    Die Kalibrierung bleibt als Diagnose-Ausgabe stehen (~15 s je Job) — Rohmaterial für einen
    späteren, besseren Normierer und im Log sofort sichtbar, ob ein Job langsam lief.
    **Damit ist «TBT auf OR wieder scharf» NICHT erreicht** und bleibt offen (§8, kein
    stillschweigend abgehaktes Ziel).

  - [x] **Chrome-Isolation je Lighthouse-Lauf + Neukalibrierung** *(erledigt 20.7.2026)*.
    `einLauf()` startet je Messung eine frische Chrome-Instanz und killt sie danach (~1–2 s/Lauf,
    ~15 s je CI-Job). Die kumulative Instanz-Drift ist weg (belegt: Startseite sprang zuvor von
    143–237 auf 1543 ms TBT ohne App-Code-Änderung), jeder Lauf ist definierte Kalt-Last.
    Schwellen im SELBEN Schritt neu erhoben über **16 Messpunkte auf 16 unabhängigen Runnern**;
    die Historie des alten Regimes wurde verworfen, nicht übernommen. **Verschärft** (echte
    Schärfe, runner-unabhängige Metriken): Start-TBT 1500 → **400** (Deckel lag 571 % über dem Ist),
    Start-LCP 11000 → **10000** (sd nur 37 ms über alle 16 Runner!), OR-TTI 15000 → **13000**,
    Start-Score 40 → **55**. **Unverändert** OR-TBT 6500 (siehe Schritt oben) und CLS 0.05.

  - **b · Billig & verlustfrei zuerst** — Wortlaut der Quick-Win-Liste *(wörtlich verschoben 31.7.2026)*

    `React.memo(ArtikelLeser)` + `SektionBaumTOC` (`parts.tsx`),
    token-Mindesthöhen (`min-h-screen` Suspense-Fallback `App.tsx` + Reader-Ladezustand `inhalt.tsx`,
    `min-h-modul-news` `NewsHeader`), Reader-Chunk-Vorladen, `vendor-react`-manualChunks (`vite.config.ts`).

  - [x] **Bimodaler ~48-s-Stall in der ersten gedrosselten Such-Interaktion — AUFGEKLÄRT + BEHOBEN** *(26.7.2026, PR #382; Wortlaut wörtlich verschoben 31.7.2026)*

    `norm-sprung`
    A9 war als 2-vCPU-Flake gemeldet; gemessen war es ein **Messfehler des Tests**: der Warmlauf
    wartete auf den «Sprung»-Treffer, der aus Register/Parser deterministisch berechnet wird und
    schon steht, **während der Artikel-Suchindex noch aufgebaut wird**. Nach dem Erscheinen von
    «Sprung» waren gemessen noch **11 586 – 14 484 ms** Ladearbeit offen; diese Restlast fiel in die
    GEDROSSELTE Messphase und erschien dort ×4 als ~48-s-Stall — streng bimodal, weil es ein Rennen
    zwischen Einmal-Load und Query-Reset ist (zwei Zustände, kein Kontinuum). Auf dem Runner riss das
    alle drei Versuche (PR #382 Shard 7/8). **Fix:** der Warmlauf wartet jetzt auf den Ladezustand,
    den er zu erreichen behauptet — Ergebnis-Kopfzeile sichtbar UND Vorbehalt «wird noch ergänzt»
    weg (letzteres deckt die gestaffelte 2. Aufbaustufe, die `unvollstaendig` statt `laedt` setzt und
    von `allesGeladen` NICHT erfasst wird).

## W2·6-B — Bündel B: B1 aza-Resolver + B2/A18 Regeste dreisprachig + B3 *(done; Prosa wörtlich verschoben 22.7.2026)*

    - [x] **+ Auftrags-Eingang 30.6.: Bündel B** — **B1+B2+A18 ✅ GEBAUT 5.7.2026** (Branch
      `feat/w26b-regeste-a18`). **Korrektur 20.7.2026:** die frühere Klammer «B3 offen = reine UI» war stale —
      **B3 ist erledigt und empirisch verifiziert** (10.7.2026, s. Zeile «Bündel B» oben: der Sticky-Kopf-Defekt
      wurde durch den U-KOPF/Split-View-Refactor `60988318` geschlossen, Playwright-Beweis an BGE 152 I 65).
      Damit sind alle drei Posten des Bündels erledigt ⇒ Status `wip` → **`done`**. **B1** BGE ohne «vollständiges Urteil»:
      aza-Resolver gehärtet (2. OCL-Kopfformat «BGE … (aza)» + Bandjahr statt fehlerhaftem
      `decision_date` als Plausibilitäts-Referenz) — **5/12 voll aufgelöst** (150 I 183/151 V 30/
      151 I 41/150 II 334/151 IV 316), **2 Kollisions-quarantäniert** (152 V 2/20 = OCL-Konflation,
      korrekt Auszug-only §8), **5 weiter Auszug** (151 I 73/151 II 710 kein aza im Kopf;
      151 III 336/151 II 475/151 V 100 Inversions-/Fetch-Grenze — ehrlicher Auszug §8).
      **B2+A18** (EIN Regeste-Pass, Quell-Wahl §7): die amtliche BGE-Regeste ist als flacher
      OCL-String weder dreisprachig noch strukturiert → aus **bger.ch clir** (`atf://<band>:de|fr|it`)
      nachextrahiert: Regestenkopf (massgebliche Artikel **fett**) + Absätze, je Sprachfassung,
      **strukturbasiert getrennt** (`<div id="regeste" lang>`) und **sortiert DE→FR→IT** — **272/272
      BGE, 0 Lücken**, additiv (`regeste.sprachfassungen`; `regeste.text` byte-stabil, Engine-Golden
      unberührt). `RegesteBlock.tsx`: DE prominent, FR/IT dezent einklappbar. Tor
      `check:entscheide` erzwingt Sortierung+Kopf+clir-Quelle; Gegenprüfung **bestanden** (Opus-
      Zweitpass 6 BGE × 3 Sprachen byte-genau vs. bger.ch). Detail `FAHRPLAN-GESETZES-UX.md`
      §10/U-REGESTE. · **B3** Sticky-Kopf überdeckt Body in `EntscheidLeser.tsx`
      (*reine UI, eigener Commit — NICHT in dieser Einheit*). Details im Eingangsblock oben.

## W2·6-NKEY — normKeys-Abdeckung generalisieren: Register-Ableitung + FR/IT-Aliase + Sichtbarkeits-Tor *(done 28.7.2026; Plan-Prosa wörtlich verschoben, Abschluss-Prosa ergänzt)*

### Die Plan-Prosa des Schritts (wörtlich, Stand vor dem Bau)

  **Befund (empirisch, 21.7.2026, Anlassfall `bge_148_II_475` ohne KG-Verzahnung):** Von 9 905
  Norm-Zitat-Nennungen über 5 093 Entscheide mappt die Hand-Whitelist `ABK_REGISTER`
  (`scripts/normtext/entscheide-mapping.ts`, 26 Einträge) nur **43 %** auf `normKeys`; der Rest wird
  **still verworfen** (§6.7-Verstoss dem Geist nach). Davon: **97 Erlasse sind längst im Korpus**,
  fehlen nur in der Tabelle (+13 %: IPRG, KVG, RPG, MWSTG, SVG, VwVG, USG, KG, …); **~40 % sind
  FR/IT-Abkürzungen** (CST→BV, CP→StGB, CPP→StPO, LTF→BGG, CO→OR, CPC→ZPO, CC→ZGB, LP/LEF→SchKG,
  LIFD→DBG, LAMal→KVG, LCart→KG, …), die die Tabelle gar nicht kennt. Drei Bausteine, Reihenfolge
  **a → c → b**:
  - **a · Mapping aus dem Register generieren (§5):** Die deutsche Abkürzung IST der Register-Key
    (`src/lib/normtext/register.ts`, 227 Bund-Erlasse) — Tabelle build-time ableiten statt parallel
    pflegen; jeder künftige Erlass wird automatisch verzahnbar (Ende der «BGFA-Fix»-Fehlerklasse,
    PR #290). Deklarierte Kollisions-/Ausschlussliste bleibt (Muster StG≠StGB; kantonale Namensvetter
    StG/KV/BauG dürfen NIE auf Bundesrecht mappen — §1).
  - **c · Sichtbarkeits-Tor gegen stilles Verwerfen (§6.7):** Wächter listet ungemappte Abkürzungen
    nach Häufigkeit gegen eine deklarierte Ignore-Liste (kantonal/ausserhalb Korpus/Rauschen wie
    «BGE» = bewusst); Neues darüber = rot. Sabotage-Probe Pflicht. Nebenprodukt: datenbasierte
    Korpus-Kandidaten (KVG 108+ Nennungen).
  - **b · Amtliche DE/FR/IT-Aliase aus Fedlex-Metadaten:** SPARQL liefert die amtliche Abkürzung je
    SR-Nummer und Sprache (Pipeline spricht Fedlex-SPARQL bereits, `scripts/fedlex-cache.sh`);
    generiertes Alias-Artefakt (`*.generated.ts`, Quelle+Stand §7, `merge=regen` §12), kein Hand-
    Erraten von Paaren. Ziel-Abdeckung **85–90 %**.
  **Backfill:** Entscheid-Snapshots + `norm-index`/Leitfall-Shards regenerieren (5 093 Entscheide,
  deterministisch, 2 Läufe byte-gleich). **Bündelung geprüft (§14.2/§14.3):** NICHT in `W2·6-FILTER`
  (andere Risiko-Klasse: hier Extraktion/Mapping = Risikopfad, dort Abfrage/Projektion) — löst aber
  dessen 🔴-Blocker «normKeys 18 %» und ist Fundament für `W2·6-ZNETZ`/`W2·7-VZUI`-Normfilter.
  Kollisionsfläche mit ZNETZ/FILTER (`public/rechtsprechung`) ⇒ Worktree + serielle Landung (§12).
  **DoD:** `check:entscheide` grün · Wächter-Tor einmal rot gezeigt · Abdeckungs-Quote vorher/nachher
  im PR ausgewiesen (§8) · `check:gegenpruefung` **bestanden** (Opus, unabhängig gegen Fedlex-
  Abkürzungen) · golden byte-gleich. Trailer `Roadmap: W2·6-NKEY` + `Gegenpruefung: <Verdikt>`.

### Wie es gebaut wurde (28.7.2026, Worktree `w26-nkey`, ULTRACODE)

**a · Register-Ableitung statt Hand-Whitelist (§5).** Die Tabelle wird aus `ERLASS_REGISTER`
abgeleitet, mit zwei Kandidaten je Eintrag (Anzeige-Abkürzung `kuerzel` und dateisicherer `key`,
beide über `normalisiereAbk` normalisiert): **654 auflösbare Abkürzungs-Formen auf 237 Erlasse**
(238 Bund-Einträge). Zeigt eine normalisierte Abkürzung auf ZWEI Register-keys, wird sie
**beidseitig verworfen** und als Kollision ausgewiesen — nie geraten (§1). `ABK_AUSSCHLUSS` hält
`StG` (SR 641.10) draussen: föderal UND kantonal, pro Zitat nicht sicher trennbar — lieber eine
Lücke als eine falsche Bundesrechts-Zuordnung (§8).

**b · Fedlex-Alias-Ebene.** `src/lib/normtext/abk-aliase.generated.ts` trägt **597 amtliche
DE/FR/IT-Kurzbezeichnungen** aus `jolux:titleShort` (Currency-Fenster über
`dateEntryInForce`/`dateNoLongerInForce`), über die SR-Nummer an den Register-key gebunden —
«art. 42 LTF» = Art. 42 BGG, «art. 41 CO» = Art. 41 OR. Vorher verschwand jedes Zitat eines
französisch- oder italienischsprachigen Entscheids lautlos. Die Aliase sind **keine zweite
Wahrheit** (§5): der Erlass-Bestand bleibt das Register, das Artefakt trägt nur dessen
fremdsprachige Namen. Der SR-Index nimmt **nur Bund-Einträge** — bei kantonalen Einträgen trägt
`sr` die kantonale Systematiknummer, die einer Bundes-SR zufällig gleichen kann. Der Ausschluss
wirkt auch auf Aliase: «LT» (fr) und «LTB» (it) hätten `STG` sonst durch die Hintertür in den
Korpus getragen — das wäre eine fachliche Entscheidung, und die trifft kein Build-Schritt nebenbei
(§7/§8). Methodik + Regenerier-Befehl: `bibliothek/recherche/fedlex-abkuerzungen-titleshort.md`.

**c · Sichtbarkeits-Tor `check:normkeys`.** Schwelle 20 Snapshots, **11 deklarierte
Ignore-Einträge** je mit Grund (aufgehoben / ausserhalb-korpus / kantonal / rauschen). Das Tor
beziffert die Restlücke, statt sie zu verschweigen: es weist die **62 von 597 Aliase** aus, die im
Fliesstext-Pfad strukturell unerreichbar sind — je mit Ursache (Leerzeichen 32 · Trennzeichen
kappt den Code 17 · Akzent/Umlaut im Wortinnern 9 · nur 1 Grossbuchstabe bei Länge > 3 3 ·
Sperrliste 1) und mit Korpus-Beleg (34 Formen in 207 Snapshots, 264 Artikel-Zitate ausserhalb des
Quoten-Nenners). Es nennt **Korpus-Kandidaten ohne Register-Eintrag** (BZP SR 273 · WG SR 514.54)
und meldet Ignore-Einträge, die unter die Schwelle gefallen sind, als Streich-Kandidaten.

**d · Fliesstext-Artikel (Zusatzauftrag David 27.7.).** Artikel-Zitate im Erwägungstext werden
erkannt und zugeordnet, nicht mehr nur die `statutes`-Kopfzeile — dort liegt die Masse:
**88 913 der 98 755 Nennungen** stammen aus dem Fliesstext.

**Ergebnis am Landungsstand.** Nennungs-Abdeckung **93.6 %** (statutes 89.3 % · Fliesstext 94.1 %);
Snapshots mit `normKeys` **21.9 % → 99.9 %** über 5093 Entscheide; Norm-Index-Buckets von 25 auf
**156 Erlasse / 4452 Artikel**.

**§15-Laufzeit-Projektion.** Der Backfill hob `norm-index.json` auf 724 KB gzip — gegen eine
260-KB-Schranke. Statt den Deckel zu heben, wurde die **Erlass-Ebene als eigene Projektion**
ausgeschrieben (`norm-index-erlasse.json`, **92.7 KB gzip**, Budget 120 KB); nur sie liegt auf dem
Nutzerpfad (`rechtsprechungFuerErlass()`), der Monolith ist reines Build-/Prüf-Artefakt.
Logikverlust-Bewertung: **keiner** — identische Daten, identische Rückgabe, nur weniger Bytes.
Die andere Hälfte derselben Messung ist ehrlich mitgezählt: derselbe Backfill hob `register.json`
auf 756.9 KB gzip = **97 % des 780-KB-Deckels**. Bewusst NICHT durch Anheben gelöst (§8) — die
Verschlankung bleibt als Folgearbeit im Plan stehen.

**Vier adversariale Gegenprüfungs-Runden (Opus, frischer Kontext).**
- **R1 widerlegt:** unvollständige Ordinal-Serie; fr «par.» als Absatzmarker nicht erkannt.
- **R2 widerlegt:** Literatur-Phantome + Folge-/Wortbereichs-Zitate ⇒ Artikel-Index-Korroboration.
- **R3 widerlegt:** die eingebaute Häufigkeits-Schwelle löschte **echte Rechtsanwendung**
  (OR/30 Furchterregung, StPO/428, EMRK/6). Eine Regel, die echte Rechtsanwendung löscht, um eine
  schmale Phantom-Klasse zu treffen, verletzt §1 — **Häufigkeit ist kein Signal für
  Tragfähigkeit**. Die Schwelle wurde **zurückgebaut** und durch eine gezielte, deklarierte
  **Literatur-Kontext-Regel** (`ohneLiteraturApparat`) ersetzt: nicht WIE OFT eine Norm genannt
  wird entscheidet, sondern WO. Nennungen innerhalb einer Zitier-Apparat-Spanne (Kommentar-Titel,
  Randnummer-Fundstelle, fr/it «ad art.») sind Angaben ÜBER Literatur, nicht Rechtsanwendung des
  Gerichts; sie werden vor der Extraktion aus dem Text genommen — auf BEIDEN Ebenen gleich
  (13 041 Spannen in 1120 Snapshots). Damit bleibt der Dekret-Stand «erst vollständig erkennen»
  unangetastet: jede erkannte Nennung im Erwägungstext zählt wieder, ohne Schwelle.
- **R4 bestanden:** 12 amtliche Einzel-Belege gegen bger.ch, korpusweite Verlust-Bilanz **13/13
  deklariert** (11 STG-Ausschluss, 2 Literatur mechanisch belegt).

**Nachtrag am Landungsstand:** der Begründungs-Kommentar in `scripts/check-perf-budget.ts` trug
noch die Zahlen VOR dem R3-Rückbau (157 Erlass-/4473 Artikel-Buckets, 731 KB gzip) — auf die
nachgemessenen 156/4452/724 richtiggestellt, mit Vermerk warum.

## W2·6-DATA — Etappen-Erzählung E0/E0+/E1/E2/E3 *(offener Schritt; ✅-Prosa wörtlich verschoben 22.7.2026)*

      Änderung golden byte-gleich (§6) + `QS-GP`. OCL-Pakete W12 (Bulk-Parquet) + F2 gehen hier auf. **E0 ✅ 2.7.2026** (PR #80/81, `ad065c03`: 218 Bund-Normtext byte-gleich DB↔JSON, `check:paritaet` in der Gate-Kette, doppelt verifiziert). **E0+ ✅ 3.7.2026** (Branch `feat/qs-data-e0-plus`, expliziter Sub-Schritt, KEIN neuer ROADMAP-Schritt — §14): Ziel-Schema §3 angelegt (erlasse/erlass_fassungen/artikel/entscheide inkl. `ecli_key`/`bge_key`+Indizes/soft_law + leere norm_referenzen/zitat_kanten/norm_rangliste) · Partitionierung je Doktyp (`daten/normtext.db`·`rechtsprechung.db`·`soft-law.db`; Monolith `lexmetrik.db` entfällt ersatzlos) · `normalisiere-zitat.ts` + DB-freie Unit-Tests · Reverse-Ingest ausgedehnt (Kanton-Normtext 1231 · Rechtsprechung 342 · 4 Manifeste inkl. Trailing-Newline · Materialien 1) — **`check:paritaet` byte-gleich über 1796 Dateien**, golden-neutral, doppelt verifiziert. **Nächstes: E1** (Generator-Flip). **Klarstellung Leitprinzip 4:** der Reverse-Ingest bereits committeter Kantons-JSONs öffnet **KEINEN** 26×-Slot (Leitprinzip 4 meint neuen Massenimport, nicht Reverse-Befüllung committeter Daten). **Weichen entschieden 3.7.:** Kontext-Auslieferung = Hybrid (Shards+Edge, `FAHRPLAN-DATENHALTUNG.md` §10(6)/§11.5) · Massen-Rebuild = Voll-Rebuild (§10(7)). **E1 ✅ 3.7.2026** (Branch `feat/qs-data-e1-flip`): Generator-Flip Bund-Normtext auf das Spalten-Zielschema (`erlasse`/`erlass_fassungen`/`artikel`), `public/*.json` = Projektion (Wächter alt≠neu → hart ab); neues Tor **`check:datenhaltung`** (Dump-Manifest-Determinismus + Drift gegen committetes `daten-manifest.json` + Invarianten Orphans/§7-Spalten/ATTACH); Risiko-Globs um `scripts/datenhaltung/**`+`daten/**`+`normtext-snapshot.ts` erweitert; Stabilitäts-Report. Byte-Beweis 3 Doppelläufe alt==neu==committet (218 Erlasse/24858 Artikel), `check:paritaet` unverändert 1796, golden byte-gleich, `QS-GP` bestanden. **VORBEHALT:** alter Direktpfad bleibt Wächter (Entfernen = eigener §6-Schritt); Kanton/Rechtsprechung/Materialien noch Blob-Weg. **E2 ✅ 3.7.2026** (Edge-Suche live: `api/suche.ts` + Turso-Hot-Replika; Sync-Timeout-Wurzel behoben 20.7., PR #313). **E3 ✅** (`rechtsprechung.db`, 488 MB).

## Fedlex-Datenarten-Portfolio — Pakete 1/2/5/4 Erledigt-Erzählung *(✅-Prosa wörtlich verschoben 22.7.2026)*

      **Paket 1 (Gesetze-Currency, `QS-CURRENCY`) ✅.** **Paket 2 (Botschaften/«Entstehungsgeschichte», W2·6) ✅ 10.7.2026** —
      401 Botschaften des Bundesrates über die 218 Volltext-Erlasse (Projekt-Graph, `nur-live-link`), im Norm-Kontext-Bus
      (Bridge B1); Join-Felder `projEli/ocUris/botschaftDate` für Paket 5 persistiert. **Paket 5 (Änderungshistorie/AS, W2·6-REV) ✅ 10.7.2026** —
      3108 AS/RO-Änderungs-Erlasse über die 218 Volltext-Erlasse (SPARQL Pfad (b) SR-Taxonomie), RO-Fundstelle aus oc-URI (100 %),
      Botschafts-Join über `ocUris` (477), `nichtKonsolidiert`-Marker (93) + Sammelerlass-Cross-Check gegen Pfad (a) ab 2000 (1942);
      Sidecar `public/normtext/revisionen/` (Übergangslösung bis E1→`erlass_fassungen`), im Norm-Kontext-Bus «Änderungen / Revisionen»
      neben der Entstehungsgeschichte (Bridge B1); Tore `check:revisionen`(-netz), Gegenprüfung bestanden. **Alle 5 Pakete (1/2/5/3/4) ✅ AUSGEFÜHRT** — Detail `FAHRPLAN-FEDLEX-PORTFOLIO.md`.

      (Bridge B1); Join-Felder `projEli/ocUris/botschaftDate` für Paket 5 persistiert. Paket 5/3 (Änderungshistorie/AS,
      Vernehmlassungen) via eigene PRs. **Paket 4 (Staatsverträge, `W2·6`) ✅ 10.7.2026** — 9 kuratierte SR-0.*-Verträge
      (HKsÜ 96/HUVÜ/EAUe/CMR/Montreal/RBÜ/UNO-BRK/Istanbul/Apostille) als Volltext über die bestehende `eli/cc`-Pipeline
      (kein `eli/treaty`-Extraktor); International-Volltext 18→27; POC: keine strukturierte Parteien-Kante → «Geltungsbereich»-Anhang
      verbatim, html-0 bei 5/9 stale → kanonische html-N gepinnt; Gegenprüfung bestanden. Detailquelle
      `bibliothek/register/fedlex-staatsvertraege-2026-07-10.md`. **Damit sind alle 5 Portfolio-Pakete gebaut.**

## W1·4 — Prozesskosten-Cockpit: I4 Bemessungskriterien + I9-Rest *(geparkter Schritt; ✅-Prosa wörtlich verschoben 22.7.2026)*

  **I4 ✅** (1.7.2026): `kriterien`/`kriterienNorm` auf `KantonalerTarif` — Bemessungskriterien je
  Tarif (25 GK + 26 PE, Kanton × GK/PE frisch am amtlichen Erlass extrahiert, §7-belegt in
  `bibliothek/register/bemessungskriterien-tarife-kantone.md`), Anzeige im Ermessensrahmen-Block bei
  Spanne (§8); GR gk ohne Kriteriennorm → generischer Fallback. Adversariale Gegenprüfung (QS-GP,
  2 Opus-Agenten): 1 Fund korrigiert (OW pe Art. 4a→Art. 32), 4 Titel-Korrekturen bestätigt. Golden
  byte-gleich (Engine liest kriterien nicht). **I9-Rest ✅**: Notariats-/Grundbuch-Querverweis im
  Cockpit.

## Auftrags-Eingang 30.6.2026 — erledigte Bündel/Einzelposten (R · N · B3 · I1/I2) *(✅-Prosa wörtlich verschoben 22.7.2026)*

> **Bündel R · Gesetz-Reader-Lesesteuerung → Schritt 5b** *(reine UI, eigener Worktree, golden-neutral):*
> - **R1 Scroll-Spy:** mitscrollender **Kopf UND Gliederung** markieren den **zuoberst im Viewport
>   angeschnittenen** Artikel, nicht einen mittigen (`gesetz-leser/`, eine „aktiver-Artikel"-Bestimmung).
> - **R2 Gliederung links auch auf kleineren Laptops:** Schwelle `istXl` (~1280px) in
>   `gesetz-leser/inhalt.tsx` ~Z.754 senken → linke TOC grundsätzlich, nur bei echt-zu-klein in den
>   Drawer. Wechselwirkung `PANE_BREIT_PX` + `max-w-reading` prüfen. (Quer zu Schritt 14 Responsive-Audit.)
> - **R3 Schriftgrösse +/− statt «Kompakt/Breit»:** Breiten-Umschalter (`Topbar.tsx` Z.54–62 +
>   `useInhaltsbreite.ts`, localStorage) durch **+/−-Schriftgrössen-Steller** ersetzen (persistent,
>   §13-Tokens/rem-Faktor, keine `text-[..px]`). Global (Topbar) → trifft alle Seiten.
>
> **Bündel N · Normtext-Fidelity/Verweise → Schritt 5b (Extraktor-Härtung, L0) bzw. Schritt 6:**
> - **N1 Zerrissene Artikelnummer** «Artikel 7 b»→«7b» (auch «43 a», «28–28 b», «14 a», «1 bis»):
>   Muster `Art. <zahl> <buchstabe>` in **111/218 Bund-Erlassen** (steht im Block-/items-`text`).
>   Fix am **Generator/Extraktor** (§7 kein Hand-Edit), Quelle-vs-Extraktion bestätigen
>   (`scripts/fedlex-cache.sh`). **§1/§2:** keine blinde Zahl-Leer-Buchstabe-Regex (echte «1 a)»-Listen).
>   *Daten/Pipeline → golden + `QS-GP`.* Bsp. David: Art. 7e ATSV; Art. 16/14a BetmKV.
>   **Ursache (Probe 30.6.):** Quelle hat `7<i>b</i>` (kein Leerzeichen, b kursiv) — unser Extraktor
>   fügt das Leerzeichen beim Strippen der Inline-Tags `<i>`/`<sup>` selbst ein. Fix = **kein Whitespace
>   zwischen Ziffer und Inline-getaggtem Buchstaben/`bis`/`ter`** (gilt für HTML *und* XML, kein Quell-Wechsel).
> - **N2 Falsche Verweis-Auflösung** *(§1-NAH, heikler):* interner Artikel-Link zeigt auf den
>   **aktuellen** Erlass, obwohl ein anderer genannt ist (Bsp.: «Artikel 14a … BetmG» in BetmKV Art. 16
>   → Klick landet bei Art. 14a der BetmKV statt im BetmG). Resolver ignoriert die nachgestellte
>   Erlass-Abkürzung. Nähe `norm-link`/`fntext-links`/`NormChip`. *Erst Häufigkeit messen, dann fixen;
>   golden/Tests + `QS-GP`.*
>   **Befund (Probe 30.6.):** das ELI-Verweisziel steht **schon im HTML** (`<a href="…/eli/…">`, 19 in
>   BetmKV, identisch im XML, z.B. StGB) — der Resolver liest es nur nicht. Fix = **Ziel lesen statt raten**
>   (erlass-genau; `#art` selbst auflösen). **Geschwister von M12** → Verweis-Chips als Feature.

>   ✅ **10.7.2026 — bereits behoben, empirisch verifiziert** (kein neuer Code nötig): Der U-KOPF/Split-
>   View-Refactor (Commit `60988318`) hat alle drei Kandidaten geschlossen — Block zu **EINEM** sticky-
>   Element konsolidiert, `top`-Offset von `top-16`→`calc(4rem + 2.25rem)` (sitzt jetzt UNTER dem
>   InhaltsKopf-Breadcrumb statt ihn zu überdecken), opaker `bg-paper`, `z-[15]` (< Topbar `z-20`,
>   > Breadcrumb `z-10`), `scroll-margin-top:var(--rsp-stick)` = 12.75rem. Playwright-Beweis 152 I 65
>   (Desktop 1280 + Mobil 390, Light+Dark, 3 Scroll-Stände, alle 3 Sprung-Chips, beide Tab-Fassungen):
>   **0 Overpaint**, Sprung-Ziele landen sichtbar unter dem 185/193px-Kopf; die alte `top-16`-Fassung
>   reproduziert den Überdeckungs-Defekt (Breadcrumb verschwindet). Golden byte-gleich (Doku-only).

> - **I1 Seitenleisten-/Rubriken-Reihenfolge** → **✅ gebündelt in W2·5c (3.7.2026):** `navigation.ts`-
>   SSoT-Array auf **Gesetze → Rechtsprechung → Materialien → Rechner → Vorlagen** — Bau im
>   Plumbing-Schritt von `archiv/FAHRPLAN-STARTSEITE-V3.md` §10 (treibt Sidebar UND Startseiten-Kacheln).
> - **I2 Branding-Neuausrichtung** → **✅ gebündelt in W2·5c (3.7.2026):** das geforderte
>   **Messaging-Konzept ist erledigt** (Ultracode-Recherche + DMAD-Council, gegen «nicht nach KI
>   klingen» geprüft; Wortlaut + SSoT-Architektur `seo.ts`→Projektionen + Tor `check:seo-index` in
>   `archiv/FAHRPLAN-STARTSEITE-V3.md` §6, Herleitung `bibliothek/recherche/startseite-v3-design.md`);
>   Ausrollen = Bausequenz-Schritt 1 des W2·5c. *(Ursprünglicher Auftragstext:)* weg von
>   «Berechnen statt KI» → **KI-freies Übersichtstool über amtliche Quellen, inkl. Rechner + Vorlagen**;
>   «KI-frei» als Vertrauensmerkmal (positiv), nicht als Headline. Surfaces ohne SSoT (§5-Geruch,
>   mitkonsolidieren): `index.html` (title/meta/og/twitter), `seo.ts` (`SITE_TITEL`/`SITE_DESCRIPTION`/
>   Route-Beschreibungen/`/methodik`), `Startseite.tsx` Hero, `KatalogHinweis.tsx`. **Deliverable:
>   Messaging-Konzept zuerst** (brainstorming/council, gegen «nicht nach KI klingen» geprüft), DANN
>   ausrollen + auf EINE SSoT ziehen (`seo.ts` Quelle, `index.html` daraus). Doks-Wording
>   (ROADMAP/PROJEKTBESCHRIEB «deterministisch statt KI-geschätzt») **✅ nachgezogen (5.7.2026,
>   W2·5c-Rest):** `Methodik.tsx`-Abschnittstitel umgestellt, Erinnerungs-Marker aufgelöst.

## Steuerungs-Prosa — abgelöste Dekret-/Essay-Passagen des Abarbeitungs-Kopfs *(wörtlich verschoben 24.7.2026, @queue-Einbau)*

Kontext: Mit dem `@queue`-Einbau (24.7.2026) trägt die Queue-Zeile die Bau-Reihenfolge; die
folgenden Passagen verloren ihre Steuer-Funktion bzw. sind vollständig in ihren
FAHRPLAN-Detailquellen enthalten (Verifikation 24.7.2026) und wurden hierher rotiert.

**Aus dem QS-TOK-Dekret (10.7.2026), abgelöster Schlusssatz:**

> Die Reader-Kette **W2·5d U-POSITION → U-PDF** ist danach der nächste
> Feature-Schritt.

**Quell-Architektur-Entscheid (Council 30.6.2026), ROADMAP-Wortlaut** (Vollinhalt weiterhin in
`FAHRPLAN-NORMTEXT-DARSTELLUNG.md §Quell-Architektur-Entscheid`):

> **Quell-Architektur-Entscheid (Council 30.6.2026) → Detail `FAHRPLAN-NORMTEXT-DARSTELLUNG.md
> §Quell-Architektur-Entscheid`, Memory `lexmetrik-akn-xml-architektur-entscheid`.** N1/N2 sind **Phase 0**
> (jetzt, variantenunabhängig) zusammen mit einem **asymmetrischen Verifikations-Tor** (Containment: jedes
> Quell-Wort verbucht → fängt stille Drops + Struktur-Invarianten) + **Status-Marker** (in Kraft/aufgehoben/
> noch-nicht-in-Kraft). Der **HTML→AKN-XML-Wechsel ist Phase 1** — inkrementell über den Drift-Zyklus, **nie
> Big-Bang** (B «XML direkt rendern» verworfen); empirisch freigegeben (eId 99,7 % stabil über Konsolidierungen,
> DE/FR/IT ~95–99 % ausgerichtet) → schaltet `#art`-genaue Chips, ELI-Zitations-Graph, M15 (DE/FR/IT) und
> M16 (Point-in-Time) frei. **M16 ist seit dem Ideen-Intake 20.7.2026 als eigene Bau-Einheit
> `W2·5g-ZEIT` getrackt** (Norm-Zeitmaschine + Fassungs-Diff, `blocked` auf `zeit-historik-poc`) —
> diese Stelle hier bleibt die *Architektur*-Begründung, die *Bau*-Planung steht dort und wird hier
> nicht doppelt geführt (§14.3).

**Intake «Informations-Nutzung der Gesetze» (David 17.7.2026), ROADMAP-Wortlaut** (Vollinhalt
weiterhin in `FAHRPLAN-NORMTEXT-DARSTELLUNG.md §Intake`):

> **Intake «Informations-Nutzung der Gesetze» (David 17.7.2026) → hierher:** Recherche-Verdikt
> = Normtext-KÖRPER nahezu erschöpfend genutzt; die handlungsreifen Lücken sind **G-REF** (externe
> amtliche ELI-Verweise, verworfen via `entferneTags` — konkretisiert N2/Phase-1-ELI-Graph) und
> **G-HIST** (artikel-genaue Historie liegt nur als Fussnoten-Prosa — Daten-Unterbau von M16, und
> damit ausdrücklich Vorbedingung des Blockers `zeit-historik-poc` in `W2·5g-ZEIT`). Beide
> = **Extraktions-Risikopfad** (`QS-GP`, golden byte-gleich; **Bau-GO je Kandidat ausstehend, David**),
> verortet in `FAHRPLAN-NORMTEXT-DARSTELLUNG.md §Intake`. Der **Suchindex** (G-SUCH, Fussnoten/Tabellen
> nicht indexiert, kein Risikopfad) liegt getrennt in `FAHRPLAN-UI-NAVIGATION.md §7b`, **G-PRERENDER**
> (SEO/§15) in `FAHRPLAN-SEO-A11Y-GOVERNANCE.md §11`. **Detailquelle (§11):**
> `bibliothek/normen/informations-nutzung-gesetze-2026-07-17.md`.

**«Einzeln»-Posten + Startseiten-Merker (30.6.-Eingang), ROADMAP-Wortlaut:**

> **Einzeln:**
> - **I1 Seitenleisten-Reihenfolge** + **I2 Branding-Neuausrichtung** → **✅ beide gebündelt in
>   W2·5c (3.7.2026) und dort gebaut** (SSoT `navigation.ts` bzw. Messaging-SSoT `seo.ts` +
>   Tor `check:seo-index`; Doks-Wording ✅ 5.7.). Wortlaut → `ROADMAP-CHRONIK.md` → Eingang-30.6.
>
> **Merker Startseiten-Überarbeitung: ✅ entparkt 3.7.2026 → Schritt W2·5c** (Ultracode-Recherche
> + bindendes Council-Verdikt liegen vor; Redesign-zurückgestellt 16.6. + FUNDAMENT-Startseitenrahmen
> dort abgeglichen).

## W2·5b — Abschluss-Prosa + QA-Sweep-Spec des abgeschlossenen Schritts *(done; Wortlaut wörtlich verschoben 26.7.2026)*

Aus `ROADMAP.md` Schritt 5b; im Plan verbleiben Checkbox + `@meta` + Einzeiler + der offene M12-Unterpunkt:

  **ABGESCHLOSSEN 25.7.2026** — alle Einheiten M1–M12 des QA-Sweeps ✅ (zuletzt in dieser
  Kampagne: **M12** Randtitel-Naht-Fix + Tor `check:verklebung`, PR #340 · **M11 + M6-D**
  Verweis-Popover mit Artikel-Bezeichnung + Chapeau-Item-Auflösung, PR #342 · **HAENGEND-
  Folge-Härtung**, PR #343 · Batch C M4/M5/M7/M8 per Nachmessung als durch W2·5d faktisch
  erledigt belegt). Je Risikopfad-Einheit adversariale Gegenprüfung (2–3 Runden, zwei davon
  widerlegten zunächst → Nachfixe). Status-Log je Einheit: `FAHRPLAN-GESETZESDARSTELLUNG-BUND.md`.
  **Status-Korrektur 20.7.2026: `wip(reader-wt)` → `ready`.** Der Marker zeigte auf einen Worktree, den es
  **nicht mehr gibt** (`git worktree list` kennt nur LexMetrik/lm-ci/lm-fundament/lm-planintake; kein Branch
  `*w25b*`/`*reader*`). Der Restblock ist gelandet: **PR #156, Merge-Commit `9b0f9e48` (5.7.2026)**.
  **Vor einem Bau-Start zwingend nachmessen (§8, nicht abhaken ohne Beleg):** `FAHRPLAN-GESETZESDARSTELLUNG-BUND.md`
  führt Batch C (M4 Suche/Gliederung responsiv · M5 kompakt zum Header · M7 Scroll-Offset nach Suche ·
  M8 Treffer-Highlight) und Batch D (M11 Verweis-Popup + Artikel-Bezeichnung · M6-Renderteil) noch unabgehakt —
  **M5 und M8 sind aber vermutlich durch W2·5d-Arbeit faktisch erledigt** (PR #284 «A35 Suche in Kopfzeile +
  A40 Highlight», PR #301 «Suchfeld in die Kopfzeile»), ohne dass die Fahrplan-Checkboxen nachgezogen wurden.
  Erst am heutigen Reader verifizieren, dann bauen — sonst wird zweimal dasselbe gebaut.
  konsolidierter QA-Sweep der **Bund-Gesetzesdarstellung** (29.6.2026): 11 Defekt-/Ausbau-Punkte
  (Präambel-Fussnoten · Fussnoten einheitlich erst auf Klick · Randtitel-/Gruppierungslinien je
  Gesetz + Umschalter · Suche↔Gliederung responsiv + kompakt zum Header · Verweis ZGB→BVG via
  ELI/`data-rs` · Treffer-Highlight · Sprung-Offset nach Suche · aufgehobene Artikel bündig ·
  **Tabellen-Regelwerk T-A…T-F seitenweit** · Verweis-Popup + Artikel-Bezeichnung) unter der
  **Leitlinie L0** «Extraktor strukturerhaltend härten statt pro Gesetz patchen» (Fedlex-HTML
  empirisch einheitlich, verifiziert 29.6.). **Plan = `FAHRPLAN-GESETZESDARSTELLUNG-BUND.md`**
  (4 Batches: A Extraktor/Pipeline konfliktfrei zuerst → B Render zuletzt, **Split-View-Konflikt auf
  `ArtikelBody.tsx`** abstimmen → C Suche/Layout → D Popover). **Auflagen:** zuerst nur Bund;
  **Renderer abwärtskompatibel** (Kanton-Altdaten nicht brechen); golden byte-gleich + §6.3;
  neuer `check:tabellen`-Validator. Tabellen-Detail quer in `FAHRPLAN-TARIF-TABELLEN-STUFE2.md`,
  Layout/a11y in `DESIGN-REGLEMENT-NORMTEXT.md`, Popover in `archiv/FAHRPLAN-GESETZESTEXT-POPUP.md`.
  - **Gebaut (✅; Wortlaut → `ROADMAP-CHRONIK.md` → W2·5b, 22.7.2026):** Bündel R (Scroll-Spy/
    Gliederung/A−A+, PR #59, prod 30.6.) · Bündel N (N1 zerrissene Artikelnummern am Extraktor +
    N2 Self-Link-Unterdrückung + Tor `check:invarianten`, deployt 2.7.) · Phase-1-Fundament-Batch
    P1/P2/P4/P5 (Spec 2.7.) · N3 `he`-Entities (0-Byte-Diff) · **W2·5b-Restblock komplett 5.7.**
    (P3 Drop-Klassen-Inventur + Tor `check:p-klassen` · linkedom-POC gemessen → KEINE Migration ·
    SVG-style-Leak; QS-GP-Quittungen). Spec-Heimat unverändert (s. oben).

## W2·5d — Nachzug-Welle A19–A25: erledigte Einheiten (A19 · A21 · A22 · A23 · L-1+L-2 · C-1–C-3) *(offener Schritt; ✅-Prosa wörtlich verschoben 26.7.2026)*

Aus `ROADMAP.md` Schritt 5d, Liste «Nachzug-Welle A19–A25»; im Plan verbleiben je Einheit Einzeiler + Pointer (A20, das offene L-3 und FN-5/M14 blieben vollständig im Plan):

  - [x] **A19** (FN-1+FN-2 +Drop-Fix `disp_*`): **✅ GEBAUT 10.7.2026 (Bau-Go David «go
    zu allem», `feat/v2-fn1-fn2`).** VZG-Alt-Form-Fussnoten erhalten nr (873 nr='' → echt,
    22 Erlasse), Präambel-`fnNrs` erfasst. **Abweichung (§7): Drop-Fix breiter als geplant** —
    recovert die verworfenen Schlusstitel-Fussnoten (`disp_uN/art_*`) korpusweit (227 recovert,
    u.a. OR/ZGB); «OR/ZGB byte-gleich» galt NICHT, stattdessen strukturell nicht-regressions-
    bewiesen (nur additiv, 0 Verlust). Gegenprüfung gegen Fedlex bestanden; Detail V2 §2 F1. V2 §2 F1.

  - [x] **A21** (FN-4): Absatz-Zuordnung Alt-Form. V2 §2 F1. **✅ ERLEDIGT OHNE BAU 25.7.2026
    (PR #354, Blanko-Go 24.7.):** Defekt nicht mehr reproduzierbar — der P1-a/b-Pin-Refresh
    (11.7.) ersetzte die Aspose-Alt-Form; Korpus-Audit 230 Caches: 0 fn-Definitionen ohne
    Backlink, 0 Fussnoten mit absatz=null in nummeriertem Absatz; Regeneration byte-identisch
    (git diff leer). Statt Nichts-Fix: e2e-Wächter `fussnote-absatz-altform` (Sabotage-Probe
    §6.7) + FN-4-Vermerk in V2 §2 F1. FN-5/M14 (wortgenau, XL) als Task-Chip verortet.

  - [x] **A22** (K-1+K-2): Kopf nützlicher + Fussnoten-Anwahl. V2 §2 F2. **K-2 ✅ GEBAUT
    11.7.2026 (`feat/v2-kopf-pr`, PR #194) — Fussnoten-Chip. K-1 ✅ GEBAUT 12.7.2026
    (`feat/v2-k1`, PR #213, `9e7e505b`): «in Kraft seit» im Erlass-Kopf, build-time SPARQL
    `jolux:dateEntryInForce` → `public/normtext/inkrafttreten.json` + `inkraftSeit` in
    browse-typen.** *(Plan-Korrektur 25.7.2026: der «weiterhin offen»-Vermerk war stale —
    Git-Abgleich fand den gemergten PR; live im OR-Kopf sichtbar.)* Detail §10.8.

  - [x] **A23** (B-1+B-2): BGE Ab-/Anwahl + Zeitfilter in Rubrik-Ansicht, Kappung
    `LEITFAELLE_SICHTBAR` 5→10 (überstimmt §3.1-«3 Toggles»; nach U-VERWEIS).
    V2 §2 F3. **✅ GEBAUT 11.7.2026 (`feat/v2-kopf-pr`, PR #194).** Detail §10.8.

    - [x] **L-1+L-2 ✅ GEBAUT 11.7.2026 (feat/v2-l1-l2):** Einzug-Cap 3→5 + Mobil-
      Token `einzug-mobil` (0.75rem statt Kollaps auf 0; `data-linien=aus` kollabiert
      weiter alle Ebenen) + Guide-Ton 10 %/14 % → 18 %/24 % (= `--line-strong`).
      Golden byte-gleich (reine Reader-CSS/TS, kein Snapshot); `check:linien-kanon`
      GRÜN unverändert (Aufbau-Regelwerk/Referenz-Verdikte unberührt). Playwright-
      Beleg Light+Dark, Desktop+Mobil@390: Guide 0.18/0.24 gemessen; ZGB indentet
      neu Ebene 1–5 (6–7 gekappt); Mobil-Einzug 12px; CLS 0 (padding/border). V2 §2 F4.

    - [x] **C-1 ✅ (10.7.2026, feat/v2-c1-kantenchip):** KantenChip `kategorie`-Prop
      (Norm=brass byte-identisch / Entscheid=slate-Tick+Hover), ↻ Revision→warn-700
      (★ bleibt brass), slate-Doppelbelegung aufgelöst → DESIGN-REGLEMENT-NORMTEXT
      §4b-B (Farb-Wörterbuch). Golden byte-gleich, Kontrast als Gate gemessen, CLS 0.
    - [x] **C-2 ✅ (11.7.2026, feat/v2-c2, #201):** Overline-Farbpunkte Leitfälle/
      Verweise (`lc-punkt`/`lc-punkt-entscheid`) + Currency-Chip-Tonung
      (`lc-chip-geltend` sage «geltend geprüft (maschinell)» / `lc-chip-vorbehalt`
      warn «nächste Fassung ab»). Kontrast gemessen, golden byte-gleich, CLS 0.
    - [x] **C-3 ✅ (11.7.2026, feat/v2-c3) — Farb-Wörterbuch KOMPLETT:**
      Materialien-Familie sage (`lc-punkt-material` + `punkt`-Prop an KontextGruppe:
      Materialien/Norm/Entscheid-Gruppen tragen ihren Familien-Punkt) + NormChip-
      Verweisfarbe (`hover:border-brass-400`, brass-Hover-Familie vereinheitlicht).
      Kontrast gemessen (sage 4.48/3.84 ≥3:1), golden byte-gleich, CLS 0. V2 §2 F5,
      DESIGN-REGLEMENT §4b-B Abschluss.

## W2·10-UI-NAV — Teillieferung Suche-Race (12.7.) + N0 Quick-Win-Paket (Stand 11.7.) *(offener Schritt; ✅-Prosa wörtlich verschoben 26.7.2026)*

  **Teillieferung 12.7.2026 (`fix/suche-aktivindex-race`):** Such-Dropdown-Race
  gegen die deferred Artikelgruppe (#183/§15.3) an der Wurzel geschlossen — die
  Pfeil-Auswahl folgt jetzt einem STABILEN Treffer-Key (`src/components/suche/trefferAuswahl.ts`,
  geteilt von HeaderSuche + Hero) statt einem Positions-Index; nachwachsende
  Treffer verschieben das Enter-Ziel nicht mehr (empirisch war Enter auf
  SCHKG#art-257 statt OR#art-257_d gelandet). Deterministischer Repro-Test +
  10×-Drossel-Beweis grün; die #210-A9-Reset-Härtung bleibt als Redundanz.
  **Stand 11.7.:** Einheit **N0 (Quick-Win-Paket, N0a–N0d) ✅ gebaut+belegt** (Opus, Playwright
  Desktop+Mobil): tote Rückwege · Erlass-Key-case-insensitiv+hilfreiche Fehlseite · Anker-`--nt-stick` ·
  Kleinposten (Ergebnis-FAB-IO · Rechner-Filter · Streitwert-Leerzustand · Entwurf-Legende-Popover ·
  Entscheid-`?ansicht=` · «In neuem Reiter»-Toast+☰-Tooltip). Rest der Kette (Suche S1–S6 …) offen.

## W2·6-BS — Kanton BS: Rechtsprechungs-Vollimport seit 2022 *(done-Unterschritt von W2·6; Wortlaut wörtlich verschoben 26.7.2026)*

    - [x] **Kanton BS: Rechtsprechungs-Vollimport seit 2022 (amtliches Portal)** *(BS-Tranche
      des P3+-Slices, FAHRPLAN-RECHTSPRECHUNG §10; Direktauftrag David 19.7.2026 — zieht die
      erste Kanton-Tranche VOR die E5-Slot-Kette; committete `public/`-Projektion, DB-Angleichung
      = Folge-Einheit F4 in E5)*: ~3'765 Dokumente (2022–2026, inkl. 42 datumlose) aller 4
      BS-Instanzen von `rechtsprechung.gerichte.bs.ch` (Findinfo/Omnis, GET-only-CGI); Pipeline
      `scripts/rechtsprechung/bs-*` (`npm run entscheide:bs`, resumierbar, golden raw), Count-Gates
      Portal==Inventar==Snapshots + entscheidsuche-Untergrenze, Latin-1/Windows-1252-Fidelity,
      neues Offline-Tor **`check:bs-entscheide`** in der Gate-Kette, `BUDGET_MB` 200→1024 (David
      19.7.2026). Detail: `FAHRPLAN-KANTONALE-ENTSCHEIDE.md` §7a + Dossier
      `bibliothek/register/BS-RECHTSPRECHUNG-QUELLE-2026-07.md`. Trailer `Roadmap: W2·6-BS`.

## W2·6-B — Restzeilen des ROADMAP-Blocks *(Nachtrag zum W2·6-B-Eintrag oben; wörtlich verschoben 26.7.2026)*

      `feat/w26b-regeste-a18`); B3 war schon 10.7. durch den U-KOPF-Refactor `60988318` geschlossen
      (Playwright-Beweis BGE 152 I 65) ⇒ alle drei Posten erledigt, Status `done`. B2/A18: Regeste
      dreisprachig aus bger.ch clir, 272/272 BGE, Tor `check:entscheide`, Gegenprüfung bestanden.
      Wortlaut → `ROADMAP-CHRONIK.md` → W2·6-B (22.7.2026).

## W2·12-HYGIENE — Plan-Prosa des abgeschlossenen Schritts (H-1…H-14, Beweisregeln G1–G3) *(done; Wortlaut wörtlich verschoben 26.7.2026)*

Aus `ROADMAP.md` Schritt 12 (Kopfzeile, `@meta`, ABGESCHLOSSEN-Einzeiler und die Gesperrt-/Eskaliert-Hinweise stehen weiterhin dort; die erste Zeile unten wiederholt den im Plan verbliebenen Halbsatz «41 Befunde …», damit der Wortlaut hier vollständig lesbar ist):

  41 Befunde + 3 Kritik-Linsen mit Repo-Stichproben)* — 14 Bau-Einheiten **H-1…H-14** in
  Risikoklassen-Reihenfolge: P0 Doku-/Git-Hygiene (Bibliothek-Wahrheits-Sweep inkl.
  SH-Doppel-Wahrheit §5/S8, check-Scope, 16 gemergte Branches) → P1 verhaltensneutraler Code
  (Tot-Sweeps src/scripts, Kanton-Typ-Konsolidierung, SG-60.13-Staffel-Generator, Import-Zyklen
  + `check:zyklen`-Tor) → P2 gegated (Format-SSOT `lib/format.ts` + Gegenprüfung,
  §6.6-Splits billig, `zahl()`-Eingabe-Entdopplung [Commit B = deklarierte UI-Änderung],
  Vorlagen-Schema-Konventionstest) → P3 nach PR-Kette #164/#165 (grosse §6.6-Splits,
  engine-map). **GESPERRT ohne David:** Alt-Engine-Ablösung Gründungsgebühren (BE>20-Mio-
  Divergenz, Entscheid-Queue). **Eskaliert (scope-fremd):** NE-Umzugsprüfung (per 12.7.
  FÄLLIG) + 10 Fedlex-Wiedervorlagen 1.8. → Currency-Slot, s. «Pflege & Termine».
  Beweisregeln G1–G3 (richtiger Beweis-Anker je Fläche, keine Beweisklassen-Mischung pro PR,
  Gegenprüfungs-Pflicht Risikopfade) im Plan. Detail: **`archiv/FAHRPLAN-CODE-HYGIENE.md`**.
  Trailer `Roadmap: W2·12-HYGIENE`.

## W3·11 — Teil-Erledigt: Vernehmlassungen (Fedlex-Portfolio Paket 3) *(offener Schritt; ✅-Prosa wörtlich verschoben 26.7.2026)*

  **Teil-ERLEDIGT 10.7.2026 (Fedlex-Portfolio Paket 3):** Vernehmlassungen über den Fedlex-Graphen
  (822 Verfahren, direkte `foreseenImpactToLegalResource`-Kante; Status/Frist/DE·FR·IT; Norm-Kontext-Bus
  «Gesetzgebung in Arbeit», laufend zuerst). Currency-Tor `check:vernehmlassungen-netz` + Offline-Assertion.
  Detail `FAHRPLAN-FEDLEX-PORTFOLIO.md §Paket 3` + `bibliothek/materialien/vernehmlassungen-2026-07-10.md`.

## W3·14-Responsive-Defekte — D1–D10 abgearbeitet *(done; Wortlaut wörtlich verschoben 26.7.2026)*

  - [x] **Responsive-Audit-Defekte D1–D10 abgearbeitet** *(reines UI, Go David 10.7.2026, Branch `fix/responsive-audit-defekte`)* — **gefixt:** D1 Vorschau-FAB (Karten-Optik → gefülltes Pill), D2 Shell-Kopf/Fuss-Tap-Ziele auf 44px, D3 Methodik-Pflegeliste mehrspaltig (Höhe −43 %), D5 «A− A+»-Steller + Header-Suche, D9 Gesetze-Placeholder, D10 Chip-Band-Scroll-Affordance. **Bereits geheilt (empirisch belegt):** D7 (Container-Breiten jetzt konsistent 1120px, via A15-Refactor #908bf143) · D8 (Ingress jetzt max-w-reading). **Caveat/nicht Code-Defekt:** D4 (Headless-PDF-Artefakt, Fallbacks vorhanden) · D6 (Sticky-Sidebar-Screenshot-Artefakt) — beide zudem im TABU-Pfad `gesetz-leser/**`. Status je Defekt in `abnahme/responsive-audit/BERICHT.md`.

## Strang-Detailpunkte / SG-2935-Rohtext-Reparatur *(erledigt 5.7.2026; Wortlaut wörtlich verschoben 26.7.2026)*

  **ERLEDIGT 5.7. (SG-2935-Rohtext-Reparatur, Branch `fix/sg2935-x-spalten`):** der
  Gegenprüfungs-Vorbefund (SG-2935 21.03–21.06/3.04–3.07/24.01 fehlten komplett) ist behoben —
  Wurzel war KEIN Zweispalten-Merge, sondern das Kopf-/Fussband im falschen Koordinatenraum
  (MediaBox-Ursprung y0≈123 vs. `viewport.height*0.9`-Schwelle → oberste Positionszeilen jeder
  Anhang-Seite als Schein-Kopfband verworfen) + verworfene ~0-breite Wort-Trenner-Fragmente
  (Verklebungen) + umgebrochene Querverweis-Zeilen als Schein-Positions-Köpfe (Gegenprüfungs-D1–D3
  → Geometrie-Orakel `istZifferKopfZeile`: Kopf nur in der Nr.-Spalte). Fix in `adapter-pdf.ts`
  (`bandSchwellen` MediaBox-relativ, origin-0 byte-identisch) + `anhang-segmenter.ts` (Orakel);
  SG-2935 83→112 Positionen (25.10 zeigt wieder amtliche 100.–), SG-2808/3849 wortlaut-treuer
  (verlustfrei; 3849: 4 Phantom-Positionen aus Nachtrags-Historie entfernt). Korpus-Probe über
  alle 27 PDF-Kanton-Snapshots: 10 weitere Nicht-SG-Dateien tragen Wortlaut-Verbesserungen durch
  denselben Fix (LU/FR/VS/SZ×4/VD×3, davon SZ-280.411 auch MediaBox-versetzt=Band-Klasse) —
  Nachzug via `normen-monitor`-Drift (`check:pdf-netz` wird rot) bzw. gezielte Regeneration,
  Detail `FAHRPLAN-TARIF-TABELLEN-STUFE2.md` §SG-2935-Reparatur.

## W2·5d / FN-5 — Bau-Auftrags-Wortlaut des erledigten Postens *(erledigt 26.7.2026; Wortlaut wörtlich verschoben 26.7.2026)*

- [ ] **FN-5/M14** wortgenaue Fussnoten-Marker (XL). V2 §2 F1. **BAU-AUFTRAG STEHT
  (David 25.7.2026, wörtlich: «vermerke 3 im bauplan, dass nächste session es am
  richtigen ort macht»)** — das frühere separate David-Go ist erteilt, die
  Sequenz-Vorbedingungen (QS-PERF, U-POSITION) sind erfüllt. **Nächste Bau-Session
  nimmt FN-5 als EIGENE Einheit** (nicht nebenbei): Extraktor-Offset/Platzhalter im
  Haupt-Snapshot = Risikopfad `scripts/normtext` mit grossem deklariertem §6.3-
  Snapshot-Diff ⇒ volle adversariale Gegenprüfung (Skill »gegenpruefung«), Differ-
  Beweis (nur Marker-Positions-Felder, kein Textverlust), Wortlaut-Stichproben je
  Defektklasse gegen den Fedlex-Cache, Reader-Render (FnRef am Wort-Offset) + CLS.
  Bis dahin bleibt der Marker am Absatz-/Item-Ende (ausgewiesene Rest-Ungenauigkeit).

*(Umsetzungs-Anm. 26.7.2026: gebaut wurde die SIDECAR-Variante der M14-Spec —
Haupt-Snapshots byte-unverändert statt des hier angenommenen grossen
Snapshot-Diffs; §7-Abweichung im ROADMAP-Einzeiler und im PR offengelegt.)*

## QS-CURRENCY — Gesetze-Currency & Coverage: Paket 1 *(done; Wortlaut wörtlich verschoben 26.7.2026)*

**Stand 5.7.2026:
P1-a + P1-b gebaut (dieser PR) — Paket 1 damit komplett (P1-c/d schon in main, PR #142).**
**P1-b (Monitoring dicht):** Regex-Fix `fedlex-pins.ts` `[a-z_]+`→`[a-z0-9_]+` (11 parser-blinde
Ziffern-Pins jetzt überwacht, 207→218) + Parser-Selbsttest + Coverage-Assertion (kein gehosteter
Bund-Volltext ohne Pin, rot bei Verstoss) + PDF-Embed-Pins (EMRK/NYÜ) ins `check:fedlex-versionen`.
**P1-a (Datenlauf):** 18 überholte Snapshots + 2 PDF-Embeds auf die geltende Fassung gehoben
(html-N SPARQL-kanonisch via isExemplifiedBy; klv/vrv=8, ssv=14; Artikel-Diff +85, 9 eId-Renames
1:1, 0 Verlust); `check:fedlex-versionen` **Exit 0 (0 stale)**. Nebenbei zwei Mechanik-Bugs gefixt
(Golden-`--erlass`-Merge behielt Phantom-Keys; check:pdf-netz notation-Join-Partial-Result).
Gegenprüfung bestanden. Trailer `Roadmap: QS-CURRENCY`. **Status: `[✓]` (Paket 1 abgeschlossen).**
**Etikett-Korrektur 20.7.2026:** Der Schritt stand trotz dieses `[✓]` noch auf `wip` ⇒ jetzt **`done`**.
Geprüft, dass der Schritt-Umfang wirklich nur **Paket 1** ist: `FAHRPLAN-FEDLEX-PORTFOLIO.md` ordnet die
Pakete 2/5/3/4 fremden IDs zu (`W2·6`, `W2·6-REV`, `W3·11`, `W3·13`), `W2·14-SIGNAL` hängt nur lose daran —
es bleibt also kein Rest unter diesem Etikett liegen. Die laufende **Korpus-Pflege** (`check:fedlex-versionen`,
Wiedervorlage-Läufe, z. B. `5b676c3b`) läuft als Automatik weiter und ist **kein** offener Bau-Schritt;
die Gesundheit dieser Automatik wird neu von **`QS-AUTOMATIK`** überwacht (dort ist `fedlex-frische.yml` rot).

## R-RICHTER — Richter-/Spruchkörper-Filter, Block A (Daten/Risiko) *(offener Schritt; Block-A-Prosa wörtlich verschoben 26.7.2026)*

**Block A (Daten/Risiko, erledigt):** Schnitt `scripts/rechtsprechung/bs-besetzung.ts`
(BS-Deckblatt + Signatur, Re-Parse der 3765 aus dem Roh-Golden **ohne Re-Crawl**), reiner
Parser/Kanon `src/lib/rechtsprechung/besetzung.ts` (deterministisch, §2), Projektion
`BrowseEntscheid.richter[{s,r}]` + neues `public/rechtsprechung/richter.json`
(Slug → Anzeigename + Trefferzahl), neues Tor **`check:besetzung`** in der Gate-Kette
(Leak/Konsistenz/Determinismus hart, Abdeckung mit Schwelle, Kollisions-Report).
Abdeckung BS 98.6 % · Bund 96.1 %, 511 Slugs (208 Richter:innen, 303 Gerichtsschreiber:innen),
**Anonymisierungs-Leak-Scan korpusweit 0**. `abschnitte`/`sha` byte-unverändert (§6).


## W2·5i-HIST-ANSICHT — Fassungshistorie an-/abwählbar: H0-Verdikt + H1-Bau + Gegenprüfungs-Erzählung *(erledigt 26.7.2026, PR #375 Squash `de8f294a`; Wortlaut wörtlich verschoben 26.7.2026)*

  *(§14-Intake 20.7.2026, David — Queue-Platz 4 · Darstellung + Datenklassifikation, kein Rechtsinhalt)*.
  **Der Befund, der den Schritt trägt (gemessen, nicht geschätzt):** im OR sind **778 von 933 Fussnoten
  Änderungsvermerke** und nur **77 echte Verweise**. Die Fussnoten-Spalte ist damit zu ~83 % Fassungs-
  historie, die als «Fussnote» getarnt den Lesefluss trägt — wer Fussnoten abschaltet, verliert die
  echten Verweise mit; wer sie anlässt, liest überwiegend Revisionsprosa.
  **Bau-Vorschlag:** dreiwertige Auswahl **«Änderungshistorie: aus / als Fussnoten / als Chronologie»**
  im bestehenden **«Ansicht ▾»-Menü** (`src/pages/gesetz-leser/LeserAnsichtMenu.tsx` hat Persistenz **und** Pre-Paint-Mechanik
  schon — dort einklinken, kein neues Menü), **Verweis-Fussnoten unabhängig davon** schaltbar. Löst
  nebenbei das bekannte Leerraum-Residuum.
  **ZWINGENDE VORSTUFE H0 — Trennbarkeit MESSEN, bevor irgendetwas gebaut wird (§8):** die 778/77-Zahl
  belegt, *dass* es zwei Klassen gibt, **nicht**, dass sie maschinell **sauber trennbar** sind. Vor dem Bau
  ist korpusweit (nicht nur am OR — Leitplanke «nie aus einem Beispiel aufs Ganze») zu erheben, mit welcher
  Präzision/Recall die Klassifikation Änderungsvermerk ↔ Verweis gelingt und **wie die Grauzone aussieht**
  (Fussnoten, die beides tun). Ergebnis ist ein Verdikt mit Zahlen; fällt es schlecht aus, wird der
  Umschalter **nicht** gebaut (eine Ansicht, die 5 % der Fussnoten falsch einordnet, verliert Normtext-
  Information und verstösst gegen §15-Funktions-Treue). **Erst H0, dann H1 (UI).**
  **Fassungs-Fundament (§14-Intake 20.7., David — gilt über diesen Schritt hinaus):** Dieser Schritt ist die
  erste aktive Fläche, an der es greift — darum hier verankert statt im geparkten `W2·5g-ZEIT`:
  **(i)** Fassungs-Schlüssel (`fassungsToken`/`stand`/`sha`) **durchgängig** mitführen, auch wo heute nur die
  geltende Fassung gezeigt wird · **(ii)** Anker **fassungsstabil** halten (`#art-` darf nicht kippen, wenn
  später eine zweite Fassung danebentritt) · **(iii)** §8 «nicht geltendes Recht» **unmissverständlich**
  auszeichnen. Das ist **kein eigener Bau-Schritt**, sondern eine Auflage an **jede** Normtext-Arbeit;
  Begründung und Detail: `FAHRPLAN-GESETZESDARSTELLUNG-V2.md` §7.
  **DoD:** H0-Verdikt mit Korpus-Zahlen **vor** H1 · `check:normtext`/`check:historie` · golden byte-gleich
  (§6/§15 — kein Fussnoten-Verlust in KEINER der drei Ansichten) · axe · `check:perf-budget`.
  Trailer `Roadmap: W2·5i-HIST-ANSICHT`.
  **H0 ✅ 25.7.2026 (Fable 5): VERDIKT BESTANDEN** — 37'849 Fussnoten korpusweit klassifiziert,
  Substanz→ausgeblendet empirisch 0.008–0.04 % (≪ 5 %-Schwelle; Stichprobe n=300 gelabelt +
  Vollscan aller 25'367 AENDERUNG); Kanton nur 11 % Historie (Nutzen = Bund-Fläche). H1 darf
  gebaut werden, Auflagen 1–5 in `bibliothek/normen/hist-ansicht-h0-trennbarkeit.md`
  (nur AENDERUNG ausblendbar · Klassifikation build-seitig ⇒ Risiko-Pfad/Gegenprüfung ·
  ZITAT-Behandlung = David-Entscheid). Messwerkzeug `scripts/analyse/hist-h0.ts`.
  **H1 ✅ GEBAUT 26.7.2026 (Branch `feat/w25i-hist-ansicht`, Tore grün — Merge steht aus).**
  Klassifikator in die Generator-Schicht gehoben (`scripts/normtext/fussnoten-klassifikation.ts`
  = SSoT, `hist-h0.ts` importiert sie); Auflage 2 eingebaut (13 Fussnoten verlassen AENDERUNG,
  **alle kantonal** → korpusweit 25'354; Bund unverändert 24'693). NUR Bund regeneriert:
  227 Sidecars, 31'786 neue `kl`-Felder (A 24'693 · V 5'759 · G 292 · Z 632 · U 410) —
  **Additivität bewiesen** (`check-sidecar-differ.ts`: 0 unerlaubte Abweichungen, `pos{b,it,o,l}`
  aus FN-5 byte-identisch). UI dreiwertig im bestehenden «Ansicht ▾»-Menü (`data-histansicht`
  am `<html>`, Pre-Paint, Default = heutige Darstellung ⇒ R6-No-op); **nur `[data-fn-klasse="A"]`
  ist dämpfbar** (Auflage 1), Fussnoten OHNE Klasse (ganzer Kanton) bleiben immer sichtbar.
  Tore: `npm run gate` grün (golden byte-gleich) · `check:normtext`/`check:historie`/
  `check:struktur-konsistenz` · `check:perf-budget` · 41 neue Unit-Tests + 8 e2e (inkl.
  axe-Scan des offenen Panels und §6.7-Sabotage-Proben, je einmal rot gezeigt).
  Nebenbefund gefixt: latenter WCAG-Kontrast-Verstoss `ink-400` am OptSwitch-AUS-Zustand
  (serious, seit A4 latent — erst der Scan des GEÖFFNETEN Panels deckte ihn auf).
  **Gegenprüfung ✅ 26.7.2026 (Auflage 3): VERDIKT BESTANDEN, 6 Befunde — alle umgesetzt.**
  Sachlich tragend waren zwei: **B1** — 62 Bund-Fussnoten tragen ein Geltungs-ENDdatum
  (27 davon ≥ 2026, laufende Befristungen: `ASYLG 95a` fn300 «gilt bis 31. Dez. 2027»,
  `KVG 37` fn116/117, `VTS 95` fn438) und waren als `A` ausblendbar → Regel «Befristung»
  → `G`; **B3** — `AVIV 51a` fn168 «Laut Ziff. II kann die Karenzfrist …» = operative
  Fristenlauf-Regel → `G`. **§2-Entscheid dabei:** auch ABGELAUFENE Befristungen werden
  `G`; eine Unterscheidung nach «heute» wäre `Date.now()` in der Klassifikation und
  machte das Sidecar unreproduzierbar (eigener Unit-Test sichert die Gleichbehandlung).
  Wirkung, gemessen: **62× A→G** (einzeln im Differ ausgewiesen), Bund A 24'693 → **24'631**,
  G 292 → **354**. B4 Fussnoten-Nr in der Chronologie-Zeile · B5 e2e deckt jetzt auch je
  einen `G`- und `U`-Fall (`ELG` Art. 10) · B6 `check-sidecar-differ` ehrlich als
  Einmalbeweis-Skript benannt und als `npm run normtext:sidecar-differ` verankert.
  **Offen vor Merge:** nur noch die **fachliche Abnahme David** inkl. **ZITAT-Entscheid**
  (Auflage 5: heute sichtbar = Empfehlung, nicht entschieden).

*(Nachtrag 26.7.2026: «Merge steht aus» ist überholt — PR #375 wurde nach 4 Gegenprüfungs-Runden
(R1/Delta/Delta-2 inkl. #376-Konfliktauflösung als reine Verschiebung) gemergt und deployt.)*

## Auftrags-Eingang 30.6.2026 / Bündel B — Detail-Wortlaut B1 · B2 · B3 *(erledigt via `W2·6-B` 5.7.2026 und `W2·6-BGE`/U-KOPF 10.7.2026; Wortlaut wörtlich verschoben 31.7.2026)*

> **Bündel B · Rechtsprechungs-Leser → Schritt 6 / W2·6-BGE:**
> - **B1 BGE ohne «vollständiges Urteil»** (Bsp. BGE 152 V 2): `azaUrteil:null` + kein
>   `auszugAbschnitte` ⇒ `switcherSichtbar=false`, Ansicht fest auf «Auszug». **12/272 BGE** betroffen
>   (151_I_73, 151_III_336, 152_V_20, 152_V_2, 150_I_183, 151_V_30, 151_I_41, 150_II_334, 151_II_475,
>   151_V_100, 151_IV_316, 151_II_710). *Daten/Pipeline (AZA-Resolver, vgl. W2·6-Id-Disambiguierung) → `QS-GP`.*
> - **B2 Regeste wie amtlich:** **Absätze + massgebliche Artikel FETT**. Heute `regeste.text` flacher
>   String ohne `\n`/Markup → Struktur **aus der Quelle nachextrahieren** (kein Raten, §1/§2). *Daten/
>   Pipeline → `QS-GP`; Geschwister von B1 (gemeinsamer Korpus-Re-Lauf denkbar).*
> - **B3 Sticky-Kopf überdeckt Body** im Entscheid-Leser (Screenshot BGE 152 I 65): Hintergrund nicht
>   deckend / z-index / scroll-margin in `EntscheidLeser.tsx`. *Reine UI (§13-F) — eigener Commit, NICHT mit B1/B2.*
>   ✅ **10.7.2026 — bereits behoben, empirisch verifiziert** (U-KOPF/Split-View-Refactor `60988318`,
>   Playwright-Beweis BGE 152 I 65). Wortlaut → `ROADMAP-CHRONIK.md` → Eingang-30.6. (22.7.2026).

## W2·7-BEZUG — Bezüge am Artikel: Facetten-Fundament alle Instanzen (inkl. B7) *(done 28./29.7.2026, PRs #401–#406; Wortlaut wörtlich verschoben 31.7.2026)*

- [x] **7-BEZUG · Bezüge am Artikel — Facetten-Fundament alle Instanzen** — **✅ 28.7.2026 GEBAUT,
  B1–B6 komplett** (PRs #401 `5e461f5f5` · #403 `4e160737b` · #404 `d42322ed1` · #405 `efba2dceb`):
  Facetten-Datenmodell + BS-Korpus + BGer-Nicht-Leitentscheide (24'173 Kanten, 311 Shards, **9
  Gegenprüfungs-Runden**, R1–R8 widerlegt+gefixt, R9 bestanden) · Auflistung direkt am Artikel ohne
  Zwischenzeile (David-Vorgaben Minimalismus) · Rechtsprechungs-Dropdown in der Werkzeugleiste ·
  interaktiver Zeitstrahl + Von-Bis-Datum statt Perioden-Buckets · Werkzeugleisten-Gesamtüberarbeitung.
  Übergabe-Restposten siehe Block «Folgeaufträge Verzahnungs-Session 28.7.» unter QS-OPT.
  - [x] **B7 · Voll-Auflistung + Eidg.-Facette** — **✅ 29.7.2026 GEBAUT** (PR #406 `5a10f8150`, 4
    GP-Runden: R1–R3 widerlegt+gefixt, R4 bestanden; 75'365 Kanten voll ausgeliefert, Mengen-
    Invarianz korpusweit 8'368/8'368 bewiesen; 5er-Portionierung mit ehrlichen Filter-Zählern;
    «Eidg.» = kein Bug, Klasse dünn — Schalter zeigen jetzt distinkte Entscheid-Zahlen)
    *(§14-Intake David 28.7.2026 abends, klein → inline:
    «or 41 dort sind nur ein teil der entscheide verlinkt … mach es so dass man durchscrollen kann
    und dann je eine linie für jede instanz und alle sichtbar. chronologisch vom neusten zum
    ältesten» + «Eidg. das scheint keine funktion zu haben?»)* — (a) Auslieferungs-Deckel 8 je
    Status aufheben: ALLE Kanten je Artikel in den Shards (Generator-Änderung ⇒ Risikopfad-Fläche,
    Determinismus + Grössen-Budgets mit Begründung nachziehen, §15 on-demand bleibt); (b) UI: je
    Instanz EINE scrollbare Linie, alle Entscheide sichtbar, chronologisch neu→alt; (c) Diagnose
    «Eidg.»-Facette (funktionslos? leer-Zustand ehrlich zeigen oder Bug fixen).
  *(§14-Intake 24.7.2026;
  **Fokus-Dekret-Priorität**, Wortlaut David: Verzahnung Gesetz↔Entscheide «sehr gutes Feature, das
  ich mit Priorität einbauen will»; **Dekret David 27.7.2026: Vorstufe ist `W2·6-NKEY`** — erst das
  Entscheid-Screening generalisieren, damit ALLE Norm-Zitate erkannt und zugeordnet sind (heute 43 %),
  dann erst die Bezüge-Schicht darauf bauen; darum `dep: [W2·6-NKEY]` + Queue-Platz davor)* — das Verzahnungs-Fundament wird von «BGE-Leitfälle an
  Bundesnormen» auf **alle Instanzen und Entscheidkategorien** erweitert: **(a)** kantonale
  Entscheide am Artikel (Start BS-Korpus 3765 aus W2·6-BS; kantonaler Norm-Resolver/P0 zuerst) ·
  **(b)** BGer-**Nicht-Leitentscheide** aus dem kuratierten Korpus — Leitentscheid vs. übriges
  Urteil bleibt als Status **unterschieden** (§8, nie stillschweigend gleichgestellt) · **(c)** jede
  Kante trägt **filterbare Facetten** (Quelltyp · Ebene · Kanton · Gericht · Leitentscheid-Status) —
  EINE generische «Bezüge am Artikel»-Schicht, an der auch Materialien-Kanten andocken (W2·6a-MAT,
  künftig `W2·6b-MAT-FINMA`), kein Zweitmodell (§5) · **(d)** Filter-UI im Gesetz-Leser
  (Instanz/Ebene/Kanton an-/abwählbar, Default konservativ: Leitentscheide an; Persistenz im
  Ansicht-Menü) · **(e = B5, §14-Intake David 28.7.2026)** eigenes Rechtsprechungs-Dropdown in der
  **Leser-Werkzeugleiste** (analog «Ansicht ▾») als reine **Ansichtsauswahl** der Verzahnung:
  Facetten + interaktiver **Zeitstrahl** + Von-Bis-Datumseingabe statt Perioden-Buckets;
  Entscheide bleiben unter den Artikeln (Detail Fahrplan §9 B5) · **(f = B6, §14-Intake David
  28.7.2026)** Gesamtüberarbeitung der Leser-Werkzeugleiste — minimalistischer und praktischer,
  ohne Funktionsabbau (Detail Fahrplan §9 B6; seriell nach B5, gleiche Fläche).
  **Abgrenzung (§14.3):** Long-Tail 195k Massen-Entscheide bleibt `W2·6-DATA` E3/E4;
  UI-Grammatik bleibt `W2·7-VZUI`. Facetten = Datenschicht, Filter = Darstellung (§3). Kantonale
  Zitat-/Norm-Resolver-Extraktion = Risiko-Pfad ⇒ `check:gegenpruefung`; Generator deterministisch,
  2 Läufe byte-gleich. Detail: `FAHRPLAN-VERZAHNUNG-UI.md` §9. Trailer `Roadmap: W2·7-BEZUG`.

## LERNPHASE-AB — Werkzeug-Andockung Audit 1: die drei erfüllten Andockungen *(offener Schritt; Erledigt-Prosa wörtlich verschoben 31.7.2026)*

  **Stand 5.7.2026 (PR `feat/lernphase-verifikations-infra`): alle drei
  Werkzeug-Andockungen erfüllt** — (1) Property-Tests um 3 Klassen erweitert (`tarifStaffel.property.test.ts`, jetzt 9
  Tests: Stetigkeit/Sprung an der `abChf`-Kante inkl. Hinweis-Sprache · Rahmen nie invertiert · Rundungs-Invarianz; alle
  grün, keine Engine-Änderung) · (2) Gate-Parallelisierung nachgemessen (seriell 16,2 s → parallel 6,5 s, 10-Kern; durch
  langsamsten Einzel-Check gedeckelt; Rot-Propagation adversarial bewiesen) · (3) B6 Myers-`diff` in `golden:diff` (Gate
  bleibt Byte-Vergleich).

## QS-GP — Bausteine a·b·c (gebaut/gemergt 1.7.2026, PR #67) samt Glob-Hinweis *(offener Schritt; Erledigt-Prosa wörtlich verschoben 31.7.2026)*

  **Hinweis:** die
  Risiko-Glob-Formen unten sind der *ursprüngliche Plan* — beim Bau korrigiert (verschachtelte
  `public/normtext/**` statt Top-Level-`*.json`, hand-gerolltes Pfad-Prädikat statt kaputter
  `*(a|b)*`-Alternation, `git status -uall`); die **as-built**-Wahrheit steht in
  `scripts/gegenpruefung/kern.ts` + der Spec. Bausteine:
  - **a · Gegenprüfungs-Gate `check:gegenpruefung`** — eingehängt in `npm run gate` (**nur lokal**,
    CI unverändert). Schneidet `git diff` ∩ Risiko-Pfade: **Extraktion** `scripts/normtext/**`,
    `src/lib/normtext/**`, `public/normtext/*.json` · **Rechnen** `src/lib/*(tarif|kosten|gebuehr|`
    `zustaendigkeit|frist|verjaehr|streitwert|beurkund|gruendung|schkg|straf|bger)*.ts` plus die
    Engine-Verzeichnisse `src/lib/tarif/**`, `src/lib/fristenspiegel/**` · **Norm/Tarif**
    `src/data/tarif/**`, `src/lib/vorlagen/**`. Trifft der Diff diese Globs, verlangt das Tor einen
    **Nachweis** (Commit-Trailer `Gegenpruefung:`; vor dem Commit liegt das Token in
    `bibliothek/.gegenpruefung-pending`, **gitignored** — Eintrag in `.gitignore` ergänzen), sonst
    **rot**. Über-Triggerung auf reine Tor-/Test-Änderungen wird mit Trailer
    `Gegenpruefung: n/a — reine Prüflogik` quittiert. **ERSTE AKTION beim Bau:** die Glob-Form gegen
    den real existierenden Baum prüfen (Verzeichnisse vs. `*.ts` — `src/lib/tarif`/`fristenspiegel`
    sind Ordner), sonst läuft das Tor leer. Das Tor selbst ist reine Prüflogik → golden byte-gleich (§6).
  - **b · Adversariales Protokoll als feste Skill** — unabhängiger Opus-Agent, frischer Kontext, vor
    sich Output **und** amtliche Quelle, Auftrag: widerlegen; **beim Rechnen** unabhängig aus der
    Norm nachrechnen (nicht den Code lesen). Gibt dem Trailer `Gegenpruefung:` überall dieselbe,
    nachvollziehbare Bedeutung.
  - **c · Gegenprüfungs-Register mit «Stand»** (`bibliothek/`, §11) — hält je Snapshot/Engine fest,
    welcher protokollierte Durchgang vorliegt (Datum, Verdikt, **gepinnte Quell-Version**) →
    Rück-Prüfung als Burn-down. Gekoppelt an `check:fedlex-versionen`: überholter Pin ⇒ Eintrag wird
    «**neu fällig**».

## QS-DATA — Stand 3.7.2026 (E0…E2, §11.2-Chips) + Sync-Reparatur 20.7.2026 *(offener/blockierter Schritt; Erledigt-Prosa wörtlich verschoben 31.7.2026)*

  **(a) Detail zu «Stand 3.7.2026: E0/E0+/E1/E1-Rest-A + E2-Vorarbeiten durch»:**
  (E1 = Generator-Flip Bund + Tor `check:datenhaltung`; **E2-Vorarbeiten = hot-FTS build-time [`fts_artikel` external content + `fts_entscheide_schaufenster` standalone, Tokenizer `unicode61 remove_diacritics 2`, HOT-Replika 178 MiB/1 GB] + Such-Query-Modul `scripts/datenhaltung/suche.ts` mit Pagination-by-design + Edge-Funktion `api/suche.ts` [503 ohne Turso]**; **E2-Anbindung ✅ 3.7.2026 = Gruppe «Volltext-Suche (online)» im geteilten `useUniversalSuche`/`SuchResultate` [`src/lib/suche/onlineVolltext.ts`, debounced Fetch, AbortController ~4 s, §8-Offenlegung, ehrliches Degradieren bei 503/Netz/Timeout/200-leer, 5-min-Feature-Cache]**)

  **(b) Detail zu «§11.2 Leitfälle-Chips (3.7.2026): das tote `proNormArtikel`-Modell ist verdrahtet»:**
  — Schaufenster-Shards je Erlass (`public/rechtsprechung/norm-index/<ERLASS>.json`, 19) + `leitfaelleFuerArtikel`-Lazy-Lader + Chip-Zeile im `ArtikelLeser` (Chip → Entscheid + «⧉ daneben öffnen»)

  **Reparatur 20.7.2026 — Sync-Transport + Frische-Wächter (E2 betriebsfest).** Der Workflow
  `turso-sync.yml` lief seit dem 18.7. sechsmal in den 20-min-Job-Timeout und wurde jedes Mal
  `cancelled` (grau, nicht rot) — BS-Import #300, G-REF #299, ASYLV2 #304, Richter #309/#310
  erreichten die Suche nie. Ursache war NICHT der Timeout: der Sync schickte je Zeile ein eigenes
  Hrana-`execute`, also einen durablen Commit pro Zeile (**gemessen 33 Zeilen/s** → ~46 min für
  61k Zeilen). Behoben durch **Mehrzeilen-INSERT in BEGIN/COMMIT** (gemessen **1429 Zeilen/s**,
  43×) + **Schatten-Tabellen mit atomarem Tausch** (ein Abbruch lässt den alten Stand stehen,
  statt wie bisher eine halb gedroppte Prod-Replika zu hinterlassen — genau das lag tagelang live:
  `artikel` 16'400 von 55'822, `fts_entscheide_schaufenster` gar nicht vorhanden). Die Atomarität
  trägt erst über den Hrana-**`baton`** (BEGIN und COMMIT in getrennten Requests): ein einzelner
  Request mit `BEGIN/…/COMMIT` ist NICHT atomar — die Pipeline bricht bei einem fehlgeschlagenen
  Statement nicht ab und das COMMIT schreibt den Teilzustand fest (von der Gegenprüfung empirisch
  widerlegt, im Wegwerf-Test verschwand eine Live-Tabelle dauerhaft). Neu:
  **`check:turso-frische`** — vierfach: Struktur · **Vollständigkeit** (Ist-Zeilenzahl gegen die
  vom letzten Sync protokollierten Soll-Zahlen; eine reine «nicht leer»-Prüfung hätte den
  historischen Schaden von 16'400 statt 55'822 Zeilen passieren lassen) · `manifest_sha` gegen
  `daten-manifest.json` · Alter — als harter Schritt im Sync **und** als täglicher cron-Job mit
  eigenem Token-Riegel; bewusst NICHT in `check:netz` (dort ohne Token = Schein-Abdeckung).
  Ein abgebrochener Sync schweigt nicht mehr (§8).

## QS-BASIS — Tor-Parität: Stand 20.7.2026 (16/36 in CI) *(offener Schritt; Erledigt-Prosa wörtlich verschoben 31.7.2026)*

  **Stand 20.7.2026 (PR `docs/bau-fundament`): 16/36 in CI** — `check:merge-schutz` · `check:tor-paritaet` · `check:dispatch-klausel` · `check:besetzung` · `check:entscheide` · `check:bs-entscheide` neu verdrahtet; die drei Rechtsprechungs-Tore standen mit der sachlich FALSCHEN Begründung «braucht rechtsprechung.db (488 MB)» auf der Allowlist, sie lesen in Wahrheit die committeten Projektionen (je ~1 s grün unter `CI=1`).

---

<!-- Umschichtung 3.8.2026 (Doku-Finale der Aufräum-Session): erledigte Schritte und
     abgelöste Steuerungs-Prosa aus ROADMAP.md hierher verschoben — WÖRTLICH, nie
     zusammengefasst (ROADMAP ▶ Ausführungs-Protokoll Ziff. 6). Streichungen tragen am
     Ende dieses Blocks eine Begründungszeile. -->

# Umschichtung 3.8.2026 — erledigte Schritte aus dem Steuerungsplan

## Ausführungs-Protokoll Ziff. 6 — abgelöste Fassung *(verschoben 3.8.2026)*

6. **Erledigt-Prosa gehört in die Chronik (Token-Ökonomie, QS-TOK/T7).** Wird ein Schritt
   abgeschlossen, kommt die ausführliche Abschluss-Prosa («gebaut/PR#…/Beweise») **direkt** nach
   [`ROADMAP-CHRONIK.md`](ROADMAP-CHRONIK.md); hier bleibt nur Checkbox + `@meta` + Einzeiler +
   Pointer. So bläht `ROADMAP.md` (der Session-Einstieg) nicht wieder auf. **Nie zusammenfassen**
   (voller Wortlaut in der Chronik) — nur verschieben.
   **Nachhalte-Konvention (QS-TOK/AP-11, 31.7.2026): am Zielort schreiben, nicht später
   umräumen.** Abschluss-/Erledigt-Prosa wird von Anfang an **direkt in `ROADMAP-CHRONIK.md`**
   verfasst (hier nur Einzeiler + Pointer); die **Spec-Prosa eines neuen Schrittes** ebenso von
   Anfang an **direkt in die zugehörige `fahrplaene/FAHRPLAN-*.md`** (hier nur Titel, `@meta`,
   ein bis zwei Sätze Zweck, `**Detail:**`-Link). Wer erst hier ausformuliert und später
   auslagert, zahlt die Diät zweimal — die Welle vom 31.7.2026 hat genau das gekostet.
   **Kontrolle ist kein neues Tor**, sondern der bestehende Re-Akkumulations-Wächter
   `python3 .claude/hooks/struktur-rotieren.py --check` (läuft bei SessionStart; Ceilings
   `ROADMAP.md` 100 KB · `STRUKTUR.md` 60 KB). Meldet er rot, ist Prosa am falschen Ort
   gelandet — dann verschieben, nicht das Ceiling heben.

## QS-PH — Plan-Hygiene-Wächter *(done, verschoben 3.8.2026)*

- **Plan-Hygiene-Wächter** *(QS-PH, `[OF]`)*. Mechanischer Check im Tor `check:plan`
  (**Regel 7**, `scripts/plan/check.ts` — *nicht* im SessionStart-Hook `struktur-aktuell.py`;
  Zuschreibung korrigiert 31.7.2026, QS-TOK/AP-11): meldet **rot**, sobald eine neu hinzugefügte `fahrplaene/FAHRPLAN-*.md`
  **nicht aus `ROADMAP.md` verlinkt** ist — setzt die Plan-Hygiene-Regel durch (jede `fahrplaene/FAHRPLAN-*.md`
  muss aus der ROADMAP referenziert sein, sonst steuert sie unsichtbar; CLAUDE.md §14 Ziff. 1). Detail + Etikett-System: **`fahrplaene/FAHRPLAN-PLAN-STEUERUNG.md`** (Tor `check:plan` = Etikett-Konsistenz + FAHRPLAN-Verlinkung der referenzierten Dateien).

## QS-WISSEN — Wissens-/Werkzeug-Infrastruktur (NotebookLM) *(bereitgestellt, verschoben 3.8.2026)*

- **Wissens-/Werkzeug-Infrastruktur** *(QS-WISSEN, `[OF]`, neu 10.7.2026)*.
  NotebookLM als **menschen-seitige** Recall-/Recherche-Oberfläche über den stabilen
  LexMetrik-Doku-Korpus (David lädt FAHRPLÄNE/ROADMAP/Register/Dossiers hoch; Quellenzitat je
  Antwort, Audio-Overview). **Kein** Ersatz für die `STRUKTUR.md`-Navigation und **kein**
  In-Session-Query des Assistenten — kein ToS-konformer Consumer-API zum programmatischen
  Abfragen/Bespielen. Schwester zu `[[werkzeuge-zuerst-pruefen]]`. Detailquelle:
  **`fahrplaene/FAHRPLAN-NOTEBOOKLM-EINSATZ.md`** (Machbarkeits-Matrix, 6.7.2026). **Status: bereitgestellt**
  — die Notebook-Befüllung selbst ist Davids Handschritt, kein Bau-Auftrag.

## QS-CURRENCY — Gesetze-Currency & Coverage *(done, verschoben 3.8.2026)*

- **Gesetze-Currency & Coverage** *(QS-CURRENCY, `[OF]`, neu 4.7.2026 — Fedlex-Portfolio Paket 1)*.
  Kein Bund-Erlass wird veraltet ausgeliefert, keine Currency-Lücke bleibt strukturell
  unsichtbar. Detailquelle **`fahrplaene/FAHRPLAN-FEDLEX-PORTFOLIO.md`** (Paket 1, P1-a…d). **Paket 1
  komplett 5.7.2026 (P1-a–d, Gegenprüfung bestanden); Etikett-Korrektur 20.7.2026 ⇒ `done`,
  kein Rest unter diesem Etikett.** Laufende Korpus-Pflege läuft als Automatik weiter (Gesundheit
  überwacht `QS-AUTOMATIK`). Wortlaut → `ROADMAP-CHRONIK.md` → QS-CURRENCY (26.7.2026).
  - [ ] **CURRENCY-KANON · `fza`/`cmr` NICHT-KANONISCH klären und kanonisch nachführen** *(Befund 2.8.2026, **Risikopfad**)* — `check:fedlex-versionen` meldet im Kanonik-Arbiter beide Staatsverträge mit falscher `html-N`-Wurzel (`fza` html-5 statt html-9 · `cmr` html-3 statt html-6); die **Fassung** ist aktuell, die **Wurzel** nicht. **Bestandsdefekt auf `main`** — Nullprobe 2.8.2026 im unveränderten Haupt-Checkout ebenfalls Exit 1, `fedlex-cache.sh`-Zeilen byte-identisch zu `origin/main` (§3 Verteilung statt Einzelwert). Erst Ursache klären, dann re-pinnen + regenerieren + §7-Verifikation der Anker. **Detail:** [FAHRPLAN-FEDLEX-PORTFOLIO.md](fahrplaene/FAHRPLAN-FEDLEX-PORTFOLIO.md) §17. Trailer `Roadmap: QS-CURRENCY-KANON`.

## QS-PERF — erledigte Befund-Zeilen *(verschoben 3.8.2026)*

  - [~] **TBT-Deckel je Job normieren statt absolut prüfen** — gebaut, gemessen, **VERWORFEN 20.7.2026**; assertiert wird weiter der Rohwert, «TBT auf OR scharf» bleibt offen (§8).
  - [x] **Chrome-Isolation je Lighthouse-Lauf + Neukalibrierung** — erledigt 20.7.2026, Schwellen über 16 Runner neu erhoben.
  - [ ] **OR-LCP ist bimodal — Ursache offen** *(20.7.2026)* — ~3.5 s oder ~11.3–11.6 s, nichts dazwischen; Deckel 13500 bleibt bis zur verstandenen Bimodalität (§8).
  - [x] **Bimodaler ~48-s-Stall in der ersten gedrosselten Such-Interaktion — AUFGEKLÄRT + BEHOBEN** *(26.7.2026, PR #382)* — Deckel byte-gleich.
  - [ ] **Artikel-Suchindex kostet ~28.5 s Main-Thread-Aufbau** *(26.7.2026)* — Client-Rebuild des Index, kein Flake.
  - [ ] **§8-Auskunftslücke im Fehlerpfad der Artikel-Suche** *(26.7.2026)* — der Fehlschlag wird still geschluckt statt ausgewiesen.
  - [ ] **«~4 MB Artikel-Index» ist in ~10 Kommentaren falsch — real 45.7 MiB** *(26.7.2026)* — reine Kommentar-Korrektur (§5).
  - [ ] **Dauer-rAF-Sampler in `e2e/helpers/cls.ts` ohne Abschalt-Bedingung** *(26.7.2026)* — belastet jede gedrosselte Messung; Abschalt-Bedingung wäre verlustfrei.
  - [ ] **e2e-Shard-Balance gegen GEMESSENE CI-Dauern packen** — geparkt, an Davids Merge-Queue-Entscheid gekoppelt.

## S0 — Spec-Wortlaut *(done, verschoben 3.8.2026)*

## ⚡ S0 — fristgetrieben (FRIST 30.6.2026) — ✅ gebaut + gegated 28.6.2026 (live 2.7.2026, Deploy a3769d72)

**Verfallsregister mechanisch.** `check:verfall` muss den am 30.6. ablaufenden SG-GKV-Tarif +
die weiteren datierten Verfälle (s. «Pflege & Termine») erfassen und auf einer benannten UI-Fläche
sichtbar machen. `[OF]`. «Sichtbar» = verhaltensändernd → golden-gegated; bis 30.6. realistisch
**gebaut + gegated**, Live erst im Batch-Deploy-Fenster.

> **Erledigt 28.6.2026 (gebaut + gegated, deployt 2.7.2026):** geteilte Parse-Grammatik
> (`scripts/verfall-parse.ts`) für `check:verfall` + `gen:verfall`; Drift-Tor `check:verfall-ui`;
> UI-Fläche «Aktualität & Pflege der Parameter» auf `/methodik`. **Chronik:** `ROADMAP-CHRONIK.md` → S0.

## QS-TOK — Stand-Block 24.7.2026 *(verschoben 3.8.2026)*

> **Stand 24.7.2026 (Nachmessung, Session III): autonomer Bau-Rest LEER** — T1/T2/T3/T5/T6/T7/
> T9/T15/T17/T18/T19 + Dispatch-Template + `map`/`zeige`/`fahrplan` sind gebaut (Belege:
> FAHRPLAN §Stand + Repo-Nachmessung); für die verbleibenden Posten hat David das
> Go erteilt (**Go David 27.7.2026: T10 · T12-Stufe-2 · T14 · T16 · T20**) — sie sind damit
> autonom baubar, mit drei Massgaben: T16 weiterhin NUR in einer frischen Session (T19-
> Vorbedingung, chirurgischer CLAUDE.md-Eingriff); T12-Stufe-2: die im Fahrplan dokumentierte
> Weglassungs-Begründung vor dem Bau neu bewerten (Go hebt das Gate, nicht das Urteil);
> T20 = stehendes Einsatz-Instrument, kein Einmal-Bau. Unwirtschaftlich zurückgestellt
> bleibt T13-Rest (Risikopfade).

## Fokus-Dekret 24.7.2026 *(Wortlaut, verschoben 3.8.2026)*

> **■ Fokus-Dekret 24.7.2026 (David, §14-Intake — 14 Anmerkungen, präzisiert die
> Feature-Reihenfolge oben): die Gesetzesdarstellung steht im Vordergrund.** Reihenfolge:
> **(1)** zuerst Code-Anpassungen, die den **Aufbau der Gesetzes-Strecke einfacher** machen
> (verhaltensneutral nach §6, golden byte-gleich; Vehikel: `W2·12-HYGIENE`-Slices auf
> `gesetz-leser`/`normtext` + §6.6-Splits — kein neuer Parallel-Schritt) → **(2)** danach die
> **Gesetzes-Schritte des Plans prioritär** (W2·5-Familie inkl. neuem Kopfzeilen-Bündel in
> `W2·5h`, M12 in `W2·5b`, `W2·13-KANTONE`) → **(3)** mit Priorität daneben:
> **Verzahnungs-Fundament `W2·7-BEZUG`** (Gesetz ↔ Gerichtsentscheide = Kern-Differenzierung,
> Wortlaut David «sehr gutes Feature, das ich mit Priorität einbauen will») und
> **FINMA-Materialien `W2·6b-MAT-FINMA`** (Kontext: externer FINMA-Termin mit Verweis auf
> LexMetrik — der Bereich muss vorzeigbar sein). **SSoT der Reihenfolge = `@queue`-Zeile oben** —
> dieser Block ist die Begründung, nicht die Mechanik.
> **Stand 31.7.2026 zu (3):** `W2·7-BEZUG` ist eingelöst und `done` (B1–B7, PRs #401–#406);
> offen bleibt aus diesem Punkt nur `W2·6b-MAT-FINMA`.

## Auftrags-Eingang 30.6.2026 — Verortungs-Block *(verschoben 3.8.2026)*

> **■ Auftrags-Eingang 30.6.2026 (David) — §14 gebündelt + verortet.** 13 Aufträge, alle `[OF]`;
> Risiko-Klassen getrennt halten (§14.2), Daten-/Verweis-Pfade ⇒ `QS-GP` + golden byte-gleich.
> Bündel R + N ✅ in `W2·5b` · Bündel B ✅ (W2·6-B/U-KOPF) · I1/I2 + Merker ✅ in `W2·5c` ·
> **Bündel S** offen als `W3·14-S`. Quell-Architektur-Entscheid (AKN-XML Phase 1) und der Intake
> «Informations-Nutzung der Gesetze» (G-REF/G-HIST, Bau-GO je Kandidat offen) stehen im Volltext in
> [`FAHRPLAN-NORMTEXT-DARSTELLUNG.md`](fahrplaene/FAHRPLAN-NORMTEXT-DARSTELLUNG.md) `§Quell-Architektur-Entscheid` bzw. `§Intake`.
> **Wortlaut des ganzen Blocks:** [FAHRPLAN-GESAMTAUFBAU.md](fahrplaene/FAHRPLAN-GESAMTAUFBAU.md) §2.

## W1·1 / W1·2 / W1·3 — Einzeiler *(done, verschoben 3.8.2026)*

- [x] **1 · Begründungs-Absatz** *(BEGRUENDUNGS-ABSATZ, ~5 %)*. Kopierfertiger, normgestützter Absatz (UI; PDF-Kapazität bewusst aus — David-Entscheid #3 vom 28.6.2026), jeder Wert mit Norm+Link+Stand; schliesst die Rückrichtung Werkzeug→Norm. **Chronik:** `ROADMAP-CHRONIK.md` → W1·1.
- [x] **2 · Norm↔Werkzeug-Brücke** *(RECHTSSAMMLUNG P4/D1)* — Index-Teil erledigt 28.6.2026 (gegated, deployt 2.7.2026): `werkzeugeFuerNorm` + `ERLASS_WERKZEUGE` + Konsistenz-Tor; «N passende Werkzeuge»-Hinweis auf der Erlass-Karte. **Chronik:** `ROADMAP-CHRONIK.md` → W1·2.
- [x] **3 · Alltags-Rechner als Cockpits** *(neu-Verpackung vorhandener Engines, `[OF]`)* — abgearbeitet 28.6.2026: Streitwert-Grenzwert-Abgleich neu gebaut (gegated, deployt 2.7.2026); Zuständigkeits-Navigator + Rechtsmittelprüfung bestanden bereits (kein §5-Duplikat); Fristen-Cockpit zurückgestellt (S-5c-Konflikt). **Chronik:** `ROADMAP-CHRONIK.md` → W1·3.

## W2·5 — Auffindbarkeits-Schicht *(done, verschoben 3.8.2026)*

- [x] **5 · Auffindbarkeits-Schicht** *(ein Index → mehrere Oberflächen)*. **Zweiachsiger Einstieg
  (Rechtsgebiet × Aufgabe)** ✅ **28.6.2026** (gegated, deployt 2.7.) · **Globale Artikel-
  Volltextsuche** ✅ **28.6.2026** (FlexSearch, build-time-Index, lazy) · **Kanton-Volltext im
  Index** ✅ **25.7.2026** (PR #365 — 54 444 Artikel: Bund 25 389 + Kanton 29 055 aus 26 Kantonen;
  Ebene ist Generator-Parameter statt Literal, Treffer nennt seinen Kanton, Recall je Ebene getrennt).
  Wortlaut → `ROADMAP-CHRONIK.md` → W2·5 (22.7. + 25.7.2026).
  **ABGESCHLOSSEN 25.7.2026.** ~~Startseiten-Modul-Rahmen~~ → **wird in W2·5c gebaut**
  (Modul-Registry, `archiv/FAHRPLAN-STARTSEITE-V3.md` §4 — FUNDAMENT-Vorleistung), gehörte nie hierher.
  **Zur Klarstellung (Befund 20.7.):** `W2·5b`/`5c`/`5d`/`5g`/`5h` sind **keine Kinder** dieses Schritts —
  `scripts/plan/*` kennt kein Eltern-/Kind-Konzept, jeder trägt eigenes `@meta` mit eigenem Status. Es ist
  eine **Nummern-Familie, keine Hierarchie**; W2·5 ist selbsttragend und wurde eigenständig abgeschlossen.

## W2·5b — Reader-Darstellung Bund *(done, verschoben 3.8.2026)*

- [x] **5b · Reader-Darstellung Bund** *(GESETZESDARSTELLUNG-BUND, `[OF]`)* —
  **ABGESCHLOSSEN 25.7.2026** — alle Einheiten M1–M12 des QA-Sweeps ✅ (zuletzt M12 PR #340 · M11+M6-D PR #342 · HAENGEND-Folge-Härtung PR #343). Wortlaut (inkl. QA-Sweep-Spec, Status-Korrektur 20.7., Nachmess-Warnung Batch C/D) → `ROADMAP-CHRONIK.md` → W2·5b (26.7.2026); Tabellen-Detail quer in `archiv/FAHRPLAN-TARIF-TABELLEN-STUFE2.md`, Popover in `archiv/FAHRPLAN-GESETZESTEXT-POPUP.md`.
  - [x] **M12 · Randtitel-Leerzeichen-Verklebung** — **✅ GEBAUT + GEGENGEPRÜFT + GEMERGT
    24./25.7.2026** (PR #340 `c872e4a9` + Folge-Härtung PR #343 `e3622991`): Generator-Fix am
    Join (`loeseTrennung`/`biErsetzung`), Tor `check:verklebung` (Sabotage rot gezeigt),
    231 Sidecars regeneriert, 2+2 Opus-Gegenprüfungs-Durchgänge (Register `ce06aa72`/`e964599c`).
    Dieser Marker stand stale auf offen (Etikett-Korrektur 26.7.); Wortlaut + Beweise:
    `archiv/FAHRPLAN-GESETZESDARSTELLUNG-BUND.md` §M12.

## W2·5c — Startseite V3 + Branding I2 *(done, verschoben 3.8.2026)*

- [x] **5c · Startseite V3 + Branding I2** *(STARTSEITE-V3, done)* — ✅ GEBAUT 3.7.2026 (Bausequenz S1–S5 komplett, PRs #106/#107/#108/#111 + S5 Brass-Hero) + Zuletzt-Tracker. **Rest offen (kein Blocker):** Wash-Ton-Veto `bg-surface`-Fallback in `Hero.tsx`. Spec `archiv/FAHRPLAN-STARTSEITE-V3.md`. Trailer `Roadmap: W2·5c`. **Chronik:** `ROADMAP-CHRONIK.md` → W2·5c.

## W2·5d — FN-5/M14 wortgenaue Fussnoten-Marker *(done, verschoben 3.8.2026)*

  - [x] **FN-5/M14** wortgenaue Fussnoten-Marker — **✅ GEBAUT 26.7.2026** als
    SIDECAR-Variante nach M14-Spec (`fahrplaene/FAHRPLAN-NORMTEXT-DARSTELLUNG.md` §M14) statt
    Haupt-Snapshot-Diff: Snapshots byte-unverändert (§7-Abweichung von der hier
    früher angenommenen Snapshot-Diff-Mechanik offengelegt). `pos{b,it,o,l}` je
    Marker im Struktur-Sidecar, 16'894 Marker wortgenau (97.7 % der text-verorteten;
    `<dt>`-Marken/Kopf/Sektion ausgewiesen ohne Textstelle), Differ-Beweis nur
    erzeugt+pos, Gegenprüfung, Wächter `e2e/fn5-wortposition.e2e.ts` + Unit-Negativfälle.
    Dossier `bibliothek/normen/fn5-wortgenaue-marker-2026-07-26.md`; Bau-Auftrags-
    Wortlaut → `ROADMAP-CHRONIK.md` → W2·5d/FN-5 (26.7.2026). V2 §2 F1.

## W2·5d — A25 (C-1/C-2/C-3, Farb-Wörterbuch) *(done, verschoben 3.8.2026)*

  - **A25** (C-1+C-2+C-3): Farbe nur Referenzschicht (Chips/Badges/Kopf),
    Normtext-Körper farbfrei. V2 §2 F5. Bau-Go David 10.7. «go zu allem».
    - [x] **C-1 ✅ 10.7.2026 · C-2 ✅ 11.7.2026 (#201) · C-3 ✅ 11.7.2026 — Farb-Wörterbuch KOMPLETT** (DESIGN-REGLEMENT §4b-B Abschluss). Wortlaut → `ROADMAP-CHRONIK.md` → W2·5d/A19–A25 (26.7.2026). V2 §2 F5.

## W2·5d — A24/L-1+L-2 *(done, verschoben 3.8.2026)*

    - [x] **L-1+L-2 ✅ GEBAUT 11.7.2026** (`feat/v2-l1-l2`). Wortlaut → `ROADMAP-CHRONIK.md` → W2·5d/A19–A25 (26.7.2026). V2 §2 F4.

## W2·5d — A19–A23 *(done, verschoben 3.8.2026)*

  - [x] **A19** (FN-1+FN-2 + Drop-Fix `disp_*`) — **✅ GEBAUT 10.7.2026** (`feat/v2-fn1-fn2`). Wortlaut → `ROADMAP-CHRONIK.md` → W2·5d/A19–A25 (26.7.2026). V2 §2 F1.
  - [x] **A20** (FN-3): Präambel-Fussnoten inline (nach U-VERWEIS-Merge). V2 §2 F1.
    **✅ GEBAUT 12.7.2026 (`feat/v2-fn3`, PR #212).** Detail §10.8.
  - [x] **A21** (FN-4) — **✅ ERLEDIGT OHNE BAU 25.7.2026** (PR #354; e2e-Wächter `fussnote-absatz-altform`). Wortlaut → `ROADMAP-CHRONIK.md` → W2·5d/A19–A25 (26.7.2026). V2 §2 F1.
  - [x] **A22** (K-1+K-2) — **K-2 ✅ GEBAUT 11.7.2026** (`feat/v2-kopf-pr`, PR #194) · **K-1 ✅ GEBAUT 12.7.2026** (`feat/v2-k1`, PR #213, `9e7e505b`). Wortlaut → `ROADMAP-CHRONIK.md` → W2·5d/A19–A25 (26.7.2026). V2 §2 F2.
  - [x] **A23** (B-1+B-2) — **✅ GEBAUT 11.7.2026** (`feat/v2-kopf-pr`, PR #194). Wortlaut → `ROADMAP-CHRONIK.md` → W2·5d/A19–A25 (26.7.2026). V2 §2 F3.

## W2·5i-HIST-ANSICHT — Fassungshistorie an-/abwählbar *(done, verschoben 3.8.2026)*

- [x] **5i-HIST-ANSICHT · Fassungshistorie an-/abwählbar** — **✅ GEBAUT + GEMERGT 26.7.2026**
  (PR #375, Squash `de8f294a`): H0-Verdikt BESTANDEN (25.7.) → H1 dreiwertige Ansicht
  «Änderungshistorie: aus / als Fussnoten / als Chronologie», Klassifikation `kl` build-seitig
  (227 Bund-Sidecars; nur Klasse A dämpfbar, Auflage 1 strukturell erzwungen), 4 Gegenprüfungs-
  Runden (B1 Befristungen + B3 Fristenlauf gefixt, 62 A→G). **Offen bei David:** fachliche
  Abnahme + ZITAT-Entscheid (Auflage 5; gebaut = Empfehlung «sichtbar») + D1–D3 (niedrig).
  Wortlaut → `ROADMAP-CHRONIK.md` → W2·5i-HIST-ANSICHT (26.7.2026); Dossier
  `bibliothek/normen/hist-ansicht-h0-trennbarkeit.md`. Trailer `Roadmap: W2·5i-HIST-ANSICHT`.

## W2·6 — Sammel-Unterliste *(abgelöst durch die Einzelschritte, verschoben 3.8.2026)*

  - **Mehrsprachiger Normvergleich DE/FR/IT** (Art. 14 PublG) · **Recherche Norm → amtlicher Entscheid**
    (deterministisch, kein LLM-Ranking) · **Gerichts-/Behörden-Adressregister** (Lese-Schicht, kein
    Duplikat) · **BGE-Band-Nachzug 146–149** (PR-A 146+147 ✅, PR-B 148+149 offen) · **Rechtsprechungs-
    Übersicht** (P0-Fix SG-Regeste + kant. Norm-Resolver, Korpus-Breite `[OF]`).
    **Detail:** [FAHRPLAN-RECHTSPRECHUNG.md](fahrplaene/FAHRPLAN-RECHTSPRECHUNG.md) §13.
  **Session-Granularität (AP-6, 31.7.2026):** Schnitt-Begründung und die bewusst nicht portionierten Posten wörtlich in [FAHRPLAN-RECHTSPRECHUNG.md](fahrplaene/FAHRPLAN-RECHTSPRECHUNG.md) §13 (ROADMAP-Spec W2·6). Trailer `Roadmap: W2·6`.

## W2·6-BS — Kanton BS Rechtsprechungs-Vollimport *(done, verschoben 3.8.2026)*

    - [x] **Kanton BS: Rechtsprechungs-Vollimport seit 2022 (amtliches Portal)** *(Direktauftrag David 19.7.2026)* — ✅; ~3'765 Dokumente (2022–2026) aller 4 BS-Instanzen, Tor `check:bs-entscheide`. Wortlaut → `ROADMAP-CHRONIK.md` → W2·6-BS (26.7.2026). Trailer `Roadmap: W2·6-BS`.

## W2·6 — Quellen-Steinbruch OpenCaseLaw *(Richtungsentscheid, verschoben 3.8.2026)*

    - [D] **Quellen-Steinbruch OpenCaseLaw** *(Analyse 2.7.2026; **Richtungsentscheid gefallen 2.7.: KONSUMIEREN statt scrapen** — Massen-/Graph-Verwertung läuft im DB-Strang **W2·6-DATA**/`fahrplaene/FAHRPLAN-DATENHALTUNG.md`; Technik-Ports W1/W4–W13 unverändert nach `PLAN-OCL-ABBAU.md`)* — Auswertung
      von opencaselaw.ch/`caselaw-repo-1` (Daten CC0, Code MIT) — Leit-Doktrin: OCL nie load-bearing, nur
      Seed/Diff-Orakel, Endpunkt-Wissen selbst gegen die amtliche Quelle nachbauen. Baustein ① LexWork-
      Kantons-API ✅ verifiziert 11.7.2026 (kein Neubau, §1/§6). **Detail:** [FAHRPLAN-OPENCASELAW-QUELLEN.md](fahrplaene/FAHRPLAN-OPENCASELAW-QUELLEN.md) §1.

## W2·6 — Fedlex-Datenarten-Portfolio *(alle 5 Pakete ausgeführt, verschoben 3.8.2026)*

    - [~] **Fedlex-Datenarten-Portfolio** *(Plan 2.7.2026; Go David 10.7.2026 «go zu allem», Reihenfolge 1→2→5→3→4)* — 6 verwertbare
      Fedlex-Datenarten (Erlasse/Materialien/Verfahren/Staatsverträge u.a.), ausschliesslich amtliche
      Fedlex-Stelle (SPARQL + Filestore, nie Dritt-Repo); **alle 5 Pakete ✅ ausgeführt (10.7.2026)**.
      **Detail:** [FAHRPLAN-FEDLEX-PORTFOLIO.md](fahrplaene/FAHRPLAN-FEDLEX-PORTFOLIO.md) §15.

## W2·6-B / Verweis-Präzision / BGE-Auszug *(done, verschoben 3.8.2026)*

    - [x] **+ Auftrags-Eingang 30.6.: Bündel B** — **B1+B2+A18 ✅ GEBAUT 5.7.2026** (Branch
      `feat/w26b-regeste-a18`); B3 via U-KOPF-Refactor `60988318` ⇒ alle drei Posten erledigt, Status `done`. Wortlaut → `ROADMAP-CHRONIK.md` → W2·6-B (22.7. + 26.7.2026).
    - [x] **Verweis-Präzision im Entscheid-Leser (Referenz BGE 151 III 377)** *(W2·6, `QS-GP`, 3.7.2026)*. i.V.m.-Ketten-Verlinkung (Kürzel auf bare Glieder propagiert, `normVerweiseImText`) + Zitierte-Normen-Chips → Sprung zur ersten Fundstelle-Erwägung; Tore grün, Snapshots additiv. **Chronik:** `ROADMAP-CHRONIK.md` → W2·6/Verweis-Präzision.
    - [x] **BGE-Auszug abgeschnitten — vollständig gefixt (34/34)** *(W2·6-BGE, Inhaltsverlust, `[OF]`)*. 29.6.2026: still mitten im Wort gekappte Auszug-Erwägungen voll nachgeladen (`fuelleGekappteErwaegungen` + Id-Disambiguierung) + Schutz-Tor U+2026 in `check:entscheide`; alle 34 BGE regeneriert, golden byte-gleich. Öffnet keinen 26×-Slot. **Chronik:** `ROADMAP-CHRONIK.md` → W2·6/BGE-Auszug.
      - [x] **Rest 30.6.2026 geschlossen** — `bge_151_V_1`/`bge_151_V_30` via Id-Disambiguierung sauber re-gefetcht (kein Hand-Edit §7), WARN-Quarantäne entfernt. **Chronik:** `ROADMAP-CHRONIK.md` → W2·6/BGE-Auszug.

## W2·6-NKEY — normKeys-Abdeckung generalisieren *(done, verschoben 3.8.2026)*

- [x] **6-NKEY · normKeys-Abdeckung generalisieren — Register-Ableitung + FR/IT-Aliase + Sichtbarkeits-Tor** *(§14-Intake 21.7.2026, David · Extraktion/Mapping — Risikopfad, `QS-GP`; Dekret David 27.7.2026)* — **✅ 28.7.2026 GEBAUT** (Worktree `w26-nkey`, ULTRACODE): Hand-Whitelist 26 Einträge → Register-Ableitung + Fedlex-Alias-Ebene (597 amtliche DE/FR/IT-Kürzel); Nennungs-Abdeckung 43 % → **93.6 %**, Snapshots mit `normKeys` 21.9 % → **99.9 %** (5093 Entscheide); Sichtbarkeits-Tor `check:normkeys` (Schwelle 20, 11 deklarierte Ignore-Einträge). Gegenprüfung **bestanden** (Opus, 4 Runden). Status `done`. Wortlaut → `ROADMAP-CHRONIK.md` → W2·6-NKEY (28.7.2026).
  **Offen als Folgearbeit (nicht Teil dieses Schritts):** `register.json` trägt `normKeys` je Entscheid
  und steht damit bei **97 % des 780-KB-gzip-Deckels** (756.9 KB) — die Verschlankung (eigene Projektion,
  wie `richter.json` sie für die Spruchkörper-Slugs vormacht) ist **nicht** durch Anheben der Schranke
  zu lösen (§8). Wer `register.json` weiter belädt, reisst `check:perf-budget`.

## W2·7-BEZUG + W2·7-BEZUG-B7 — Bezüge am Artikel *(done, verschoben 3.8.2026)*

- [x] **7-BEZUG · Bezüge am Artikel — Facetten-Fundament alle Instanzen** — ✅ **done 28.7.2026**,
  B1–B6 + B7 komplett (PRs #401–#406).
  Übergabe-Restposten (G-a…G-g, «Folgeaufträge Verzahnungs-Session 28.7.») → [FAHRPLAN-OPTIMIERUNG-2026-07.md](fahrplaene/FAHRPLAN-OPTIMIERUNG-2026-07.md) §1.
  - [x] **B7 · Voll-Auflistung + Eidg.-Facette** — ✅ **done 29.7.2026** (PR #406 `5a10f8150`,
    4 GP-Runden; Voll-Auslieferung ohne Deckel, 5er-Portionierung, «Eidg.»-Facette ehrlich).

## W2·6a-MAT — Materialien-Verzahnung Stufe 1 *(done, verschoben 3.8.2026)*

- [x] **6a-MAT · Materialien-Verzahnung Stufe 1** *(DATA+UI, Worktree)* — Verwaltungsverordnungen/Wegleitungen als Kanten am Norm-Artikel (E6a Stufe 1 = nur Verweis-/Register-Ebene, §7 a–d). Komplett 4.7.2026 (M0–M5, PRs #126/#127/#128 + ESTV-KS/MWST + UI-Delta; 4 Quellen SECO/EDÖB/ESTV-KS/ESTV-MWST, Cutoff-Revisions-Invariante, Gegenprüfung bestanden, CLS 0). Kein 26×-Bezug. Spec `fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md`. **Chronik:** `ROADMAP-CHRONIK.md` → W2·6a-MAT.

## W2·7 — Verzahnungs-Klingen *(done, verschoben 3.8.2026)*

- [x] **7 · Verzahnungs-Klingen** *(`[OF]`, amtlich)* — GEBAUT 5.7.2026: (a) Verjährungs-/Gewährleistungs-Board · (b) Verzugs-/Inkasso-Strecke · (c) Gerichts-Baustein-Set (Zitierer + Rubrum-Vorlage). Reine Darstellung auf bestehenden Engines (§3), golden 201 (+8 additiv), Gegenprüfung bestanden. **Chronik:** `ROADMAP-CHRONIK.md` → W2·7.

## W2·12-HYGIENE — Code- & Bibliothek-Hygiene *(done, verschoben 3.8.2026)*

- [x] **12 · Code- & Bibliothek-Hygiene** *(Auftrag David 12.7.2026, `[OF]`; Ultracode-Audit
  **ABGESCHLOSSEN 24.7.2026** — alle baubaren Einheiten H-1…H-14 + B24 ✅ (zuletzt B24
  inhalt.tsx-Split 1494→781 Z., PR #338 `b56b9193`; H-3 No-op, Git-Stand bereits sauber).
  Status-Log je Einheit: `archiv/FAHRPLAN-CODE-HYGIENE.md §S`. Gesperrt-/Eskaliert-Posten laufen
  ausserhalb weiter: Alt-Engine-Ablösung Gründungsgebühren (Entscheid-Queue David) ·
  NE-Umzugsprüfung + Fedlex-Wiedervorlagen (Currency-Slot, «Pflege & Termine»).
  41 Befunde + 3 Kritik-Linsen mit Repo-Stichproben)* — Plan-Prosa-Wortlaut (14 Bau-Einheiten H-1…H-14, Beweisregeln G1–G3) → `ROADMAP-CHRONIK.md` → W2·12-HYGIENE (26.7.2026).

## W2·17-UI-BEFUNDE B1 + B2 *(done, verschoben 3.8.2026)*

  - [x] **B1 · Chips, Badges und Normzitate (K-05 + K-10)** — 16 Befunde (Blocker 3 · Hoch 3). §2.
  - [x] **B2 · Verlauf und Zustand in der URL (K-20)** — 11 Befunde (Blocker 2 · Hoch 5). §3.

## W2·17-UI-BEFUNDE B20 + N1 *(done, verschoben 3.8.2026)*

  - [x] **B20 · Prüf-Batch — «bereits gebaut» am Prod-Stand nachmessen (alle Bauteile)** — 15 Befunde (Blocker 1 · Hoch 5). §21.
    **`dep: []` seit 31.7.2026 (Endprüfungs-Fund 18):** B20 ist kein Neubau, sondern Nachmessung,
    und trägt mit LM-062 den einzigen Blocker der «bereits gebaut»-Klasse. Am Kettenende hätte die
    Behauptung «ist gebaut» erst nach 19 Bau-Batches geprüft — erwiese sie sich als falsch, entstünde
    der Bau-Posten am spätesten möglichen Punkt. B20 ist damit **unabhängig und vorziehbar**; die
    Bau-Kette B1→…→B19 bleibt unverändert seriell. `plan:next` führt B20 dadurch gewollt in ready-now.
  - [x] **N1 · LM-044-Nachzug: Chip-Grammatik `lc-chip-zeile` ausrollen** *(David-Entscheid 2.8.2026; klein, reines UI)* — Container-Klasse `lc-chip-zeile` (`src/index.css:742–755`, in B1 gebaut) auf die Chip-Reihen der Materialien-/Vorlagen-Routen und `EntscheidFilter.tsx` ziehen. **Ehrliche Abgrenzung:** deckt **nur die Element-Art-Achse** (`a`/`button`/`span`); die **Metadatum-Achse** gehört zu [FAHRPLAN-UI-QUALITAET.md](fahrplaene/FAHRPLAN-UI-QUALITAET.md) §3(c) / `W2·10-UI-NAV` und wird hier **nicht** vorgegriffen. §23.
    **`N` statt `B21`:** Nachzug zu B1, **kein** Glied der Bau-Kette B1→…→B19 (B20 bleibt der
    Prüf-Batch am Ende). **Bau erst nach Landung von PR #408 + #409** — PR-Landungen sind keine
    Plan-IDs, darum `seq-hart` statt `dep`. Begründung beider Punkte: §23.

## W3·14-Responsive-Audit + W3·14-Responsive-Defekte *(done, verschoben 3.8.2026)*

  - [x] **Gebündelt (Auftrag David 29.6.2026): Bildschirm-/Responsive-Audit** *(SPLIT-VIEW, `[OF]`)* — AUDIT GEFAHREN 5.7.2026 (rein lesend, PR `chore/responsive-audit`): 30 Motive × 5 Breiten = 150 Aufnahmen, 0 Seiten-Overflow, 12 Defekte geflaggt; Befund `abnahme/responsive-audit/BERICHT.md`, Fixes = spätere Schritt-14-Einheiten. **Chronik:** `ROADMAP-CHRONIK.md` → W3·14-Responsive-Audit.
  - [x] **Responsive-Audit-Defekte D1–D10 abgearbeitet** *(reines UI, Go David 10.7.2026, Branch `fix/responsive-audit-defekte`)* — ✅; Status je Defekt in `abnahme/responsive-audit/BERICHT.md`. Wortlaut → `ROADMAP-CHRONIK.md` → W3·14-Responsive-Defekte (26.7.2026).

## Batch-Deploy-Fenster *(abgelöst, verschoben 3.8.2026)*

## 🚀 Batch-Deploy-Fenster (eigenes Item)

✅ **Erledigt 2.7.2026** — der aufgestaute Stand (Beurkundungs-Ausbau, Vertrags-Varianten P0–P2, S0,
Welle-1-Ergebnisse, M13, Bündel N, AKN-Batch PR #78) ist auf PROD (Deploy `a3769d72`). Das Fenster
bleibt als **Mechanismus**: künftige gegatete Stände sammeln, Push/Deploy **nur auf Davids frisches
Ja** (§9), aus sauberem HEAD-Worktree (§12).

---

## Nachträge aus der Archiv-Welle 31.7.2026 — Strang-Liste *(verschoben 3.8.2026)*

### Nachträge aus der Archiv-Welle 31.7.2026 (20 Fahrpläne, verify-then-archive)

*20 `FAHRPLAN-*.md` sind am 31.7.2026 verify-then-archive nach `archiv/` gewandert (je Datei ein
Nur-Lese-Opus-Verdikt, alle NUR-MIT-NACHTRAG). Ihre Restpunkte stehen **wörtlich** in
[FAHRPLAN-ARCHIV-RESTPUNKTE.md](fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md) — je Strang ein §, dort auch die
Herkunft (AP-3/AP-4) und die drei begründet im Root gebliebenen Dateien. Sie steuern nicht.*

- **Beurkundungs-Ausbau** — 4 Restpunkte → [FAHRPLAN-ARCHIV-RESTPUNKTE.md](fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md) §1
- **BGer-Rechtsweg** — 1 Restpunkt → [FAHRPLAN-ARCHIV-RESTPUNKTE.md](fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md) §2
- **Fall-Rückgrat** — 3 Restpunkte *(David-Entscheid enthalten)* → [FAHRPLAN-ARCHIV-RESTPUNKTE.md](fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md) §3
- **Fundament-Umbau** — 6 Restpunkte *(David-Entscheid enthalten)* → [FAHRPLAN-ARCHIV-RESTPUNKTE.md](fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md) §4
- **Grundlagen** — 4 Restpunkte *(David-Entscheid enthalten)* → [FAHRPLAN-ARCHIV-RESTPUNKTE.md](fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md) §5
- **International-Volltext** — 2 Restpunkte → [FAHRPLAN-ARCHIV-RESTPUNKTE.md](fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md) §6
- **Kantonale Entscheide** — 5 Restpunkte → [FAHRPLAN-ARCHIV-RESTPUNKTE.md](fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md) §7
- **Lücken schliessen** — 2 Restpunkte → [FAHRPLAN-ARCHIV-RESTPUNKTE.md](fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md) §8
- **Notariat & Grundbuch** — 3 Restpunkte → [FAHRPLAN-ARCHIV-RESTPUNKTE.md](fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md) §9
- **Vertrags-Varianten** — 6 Restpunkte → [FAHRPLAN-ARCHIV-RESTPUNKTE.md](fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md) §10
- **GmbH-Gründung** — 9 Restpunkte *(David-Entscheid enthalten)* → [FAHRPLAN-ARCHIV-RESTPUNKTE.md](fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md) §11
- **Rechtssammlung (Rubrik V «Gesetze»)** — 3 Restpunkte → [FAHRPLAN-ARCHIV-RESTPUNKTE.md](fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md) §12
- **Begründungs-Absatz** — 6 Restpunkte *(David-Entscheid enthalten)* → [FAHRPLAN-ARCHIV-RESTPUNKTE.md](fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md) §13
- **BS-Vorbildkanton** — 4 Restpunkte *(David-Entscheid enthalten)* → [FAHRPLAN-ARCHIV-RESTPUNKTE.md](fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md) §14
- **Code- & Bibliothek-Hygiene** — 4 Restpunkte → [FAHRPLAN-ARCHIV-RESTPUNKTE.md](fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md) §15
- **Gesetzesdarstellung Bund** — 5 Restpunkte → [FAHRPLAN-ARCHIV-RESTPUNKTE.md](fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md) §16
- **Gesetzestext-Popup (Norm-Vorschau)** — 1 Restpunkt → [FAHRPLAN-ARCHIV-RESTPUNKTE.md](fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md) §17
- **Startseite V3 + Branding I2** — 2 Restpunkte → [FAHRPLAN-ARCHIV-RESTPUNKTE.md](fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md) §18
- **Tarif-Tabellen Stufe 2** — 2 Restpunkte → [FAHRPLAN-ARCHIV-RESTPUNKTE.md](fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md) §19
- **UX-Punkteliste** — 2 Restpunkte (A3-Abnahme, E-Optional) + 1 Statusbefund → [FAHRPLAN-ARCHIV-RESTPUNKTE.md](fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md) §20

## Streichungen 3.8.2026 (Begründungen)

### Bauplan-QS 3.8.2026 (zweiter Durchgang — Klarheit · Dedup · Zuteilung)

*Auftrag David 3.8.2026: «nochmals bauplan überarbeiten, dass alles klar ist und nicht doppelt*
*enthalten ist und alles sinnvoll zugeteilt ist.» Streich-/Fusions-Entscheide delegiert.*

- **`QS-AUTOMATIK-WT` → fusioniert in `QS-AUTOMATIK-BERICHT`** — beide Schritte entstanden am
  3.8.2026 im selben §14-Intake, bauen in **derselben Datei** (`scripts/check-ci-laeufe.ts`),
  tragen dieselbe Risiko-Klasse (reine Prüflogik) und sind je ein Kleinposten. Skill `auftrag`
  Ziff. 3 verlangt für diesen Fall Bündelung — «einmal bauen, prüfen, deployen». Beide Anlässe
  (80 Läufe Run-Forensik ohne Übersicht · PR #417 verwaister Worktree) stehen im Wortlaut am
  überlebenden Schritt; Bau-Spec `fahrplaene/FAHRPLAN-BASIS-AUSBAU.md` §3.1. Der überlebende
  ist der besser verortete: der Zustandsbericht ist der Rahmen, die Worktree-Sonde ein Abschnitt
  darin. ID aus `scripts/plan/inventar.ts` entfernt.

- **`QS-DATA` — Geltungsbereich auf das VPS-David-Gate verengt** (keine Streichung des Schrittes).
  Der Schritt führte den kompletten Datenhaltungs-Umfang ein zweites Mal neben `W2·6-DATA`: DB-
  Artefakt als eine Quelle, Etappen, Datenhaltungs-Optimierung. `fahrplaene/FAHRPLAN-DATENHALTUNG.md`
  §13 sagte im selben Absatz «Bau-Strang = W2·6-DATA» **und** «Serving-Bau bleibt QS-DATA» — zwei
  Wahrheiten über denselben Bau (§5). **Nicht gestrichen**, weil er als einziger Schritt das
  David-Gate `vps-bestellung-david` sichtbar hält (`plan:next` würde es sonst nur noch im
  Blocker-Register führen). Er trägt jetzt genau das und nichts sonst; Stand-Notiz im Fahrplan §13.

- **Datenhaltungs-Optimierung — von drei Stellen auf eine** (`QS-DATA` · `W2·6-DATA` (ii) ·
  `QS-BASIS` (d)). Owner ist **`W2·6-DATA`**; die anderen beiden verweisen nur noch. `QS-BASIS`
  (a) Turso-Wächter-Abdeckung wandert aus demselben Grund zu **`QS-AUTOMATIK`**, das sie ohnehin
  als einzigen offenen Rest führte; (b) CI-Fehlläufe #30 ist mit PR #419 erledigt. Eigener
  Bau-Umfang von `QS-BASIS` ist damit Posten (c) Tor-Parität plus die offenen B-Einheiten.

- **`R-RICHTER` Block B — als offener Posten gestrichen.** Er stand gleichzeitig unter `W2·6`
  («Block B offen, reines UI: Autocomplete-Facette + `?richter`-URL-Achse») und als Inhalt von
  `W2·6-FILTER` («Richter-Facette aus R-RICHTER Block B»). Träger ist `W2·6-FILTER` — dort liegt
  die gemeinsame Bau-Fläche mit den allgemeinen Facetten (Turso-Schema + `api/suche.ts`).
  `R-RICHTER` behält nur den Beleg für Block A (gebaut 20.7.2026).

- **36 `Trailer: Roadmap: <ID>`-Wiederholungen + 6 «Session-Granularität (AP-6)»-Zeilen entfernt.**
  Beide sagten je Schritt dasselbe, was einmal gilt: der Trailer ist immer die `@meta id`
  (Skill `auftrag`, Ziff. 5), die Schnitt-Begründung steht immer im `ROADMAP-Spec`-§ des
  Fahrplans. Regel steht jetzt einmal im Ausführungs-Protokoll Ziff. 6. Ersparnis ~2,3 KB —
  der Grund ist aber die Lesbarkeit, nicht die Grösse.

- **`W3·10` — Archiv-Vorbehalt gekürzt** (7 Zeilen → 4). Wortlaut der ausführlichen Fassung:
  «Für W3·10 gibt es **keinen aktiven Nachfolger** — die 20 §§ von
  `fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md` decken PRODUKTAUSBAU/BURGGRABEN nicht ab, anders als
  bei `W3·13`. Der Zeiger bleibt darum auf die Archivdatei; deren Kopf trägt **Stand 14.6.2026**
  und ist nach §0 der Archiv-Restpunkte **teilweise stale**. Die Restpunkte-Extraktion
  (Zustellfiktion, OR-Schwellen, IGE-Gebühren, kant. Gerichtsferien) **steht aus** und gehört in
  den Bau-Batch dieses Schritts. Massgeblich ist bis dahin §P3, gelesen mit diesem Vorbehalt.»
  (Endprüfungs-Fund R3-3/R3-11, deklariert 31.7.2026.) In der ROADMAP steht die Ausnahme jetzt
  in vier Zeilen, mit der Extraktion als erstem Arbeitsschritt.

- **`QS-PERF` — Wortlaut der `wip`-Prüfung vom 3.8.2026** (ersetzt, weil der Anlass erledigt ist):
  «Der Marker steht seit **1.7.2026** (Einführung der @meta-Etiketten, `927f8c517`) und wurde
  seither nie freigegeben — er belegt also nicht fünf Wochen Bauarbeit. Er bleibt trotzdem stehen,
  weil er **heute** wieder zutrifft: die Runner-Robustheit auf `chore/runner-robustheit` baut den
  TBT-Posten (Normierung) und die OR-e2e-Timeouts.» Mit der Landung von **PR #421 (`23f4be7fb`)**
  ist dieser Grund entfallen; `QS-PERF` steht wieder auf `ready`. Ebenfalls erledigt und aus der
  Liste genommen: der Posten «TBT-Deckel je Job normieren statt absolut prüfen» (David-Entscheid
  3.8.2026, gebaut in #421 — normierter Wert, Budget 6500 ms unverändert, §6.7-Rot-Nachweis
  erbracht).

- **`npm audit`** — aus der Geparkt-Liste «Betriebs-Instrumente (später)» genommen: die
  **Meldungs**-Variante wird als `QS-BASIS-DEPS` gebaut, geparkt bleibt nur die Stopper-Variante.
  Ein Posten, der gleichzeitig geparkt und in Arbeit ist, steuert in zwei Richtungen.

- **`QS-BASIS-MQ` (G7 Merge Queue)** — gestrichen 3.8.2026 auf **David-Entscheid (Verzicht)**: GitHub bietet Merge Queues nur für Organisations-Repos an; LexMetrik liegt auf dem persönlichen Account (Feature-Gate, Ruleset-API 422 beim Aktivierungsversuch 3.8. nach TBT-Landung #421). Absicherung bleibt `strict: true` (aktiv seit 3.8.) + serielle Landung nach Skill `landung`. Falls das Repo je in eine Organisation wandert, ist die Queue in `fahrplaene/FAHRPLAN-BASIS-AUSBAU.md` §2 beschrieben; der `merge_group`-Trigger in `ci.yml` bleibt stehen (schadet ohne Queue nicht).

- **`26x-slot` (Blocker-Register)** — gestrichen 3.8.2026: seit 20.7.2026 ausdrücklich AUFGELÖST und von keinem Schritt mehr referenziert; die Slot-Kette steht im `@slot-kette`-Block der ROADMAP. Wortlaut: «FREI seit 3.7.2026 (E3 fertig), aber bis 20.7.2026 nicht zurückgegeben — 17 Tage grundlose Blockade von W3·12. Slot am 20.7.2026 per @slot-kette an W3·12 übergeben (Kanton-Gesetze, Leitprinzip 4 + Davids Reihenfolge-Entscheid 2.7.: «E3 zuerst, W3·12 danach»).»

- **`QS-WISSEN` (NotebookLM-Einsatz)** — aus der ROADMAP genommen 3.8.2026: die Lieferung ist erbracht («Status: bereitgestellt»), die Notebook-Befüllung ist ausdrücklich Davids Handschritt und **kein Bau-Auftrag** — der Schritt steuerte nichts mehr. `fahrplaene/FAHRPLAN-NOTEBOOKLM-EINSATZ.md` (Machbarkeits-Matrix 6.7.2026) → `archiv/`, dort unverändert nachlesbar.

- **W2·6-Sammel-Unterliste** — gestrichen 3.8.2026: sie zählte dieselben vier Posten auf, die seit AP-6 (31.7.2026) als eigene etikettierte Schritte `W2·6-MEHRSPRACH`/`-RESOLVER`/`-ADRESSEN`/`-UEBERSICHT` darunter stehen — zwei Wahrheiten über denselben Bau-Umfang (§5). Der besser verortete überlebt.

- **Quellen-Steinbruch OpenCaseLaw** — gestrichen 3.8.2026: der Richtungsentscheid vom 2.7.2026 lautet **KONSUMIEREN statt scrapen**; die Massen-/Graph-Verwertung läuft seither im DB-Strang `W2·6-DATA` (`fahrplaene/FAHRPLAN-DATENHALTUNG.md`), Baustein ① (LexWork-Kantons-API) ist am 11.7.2026 als «kein Neubau» verifiziert. Der Posten führte damit einen Weg, den der Plan nicht mehr geht. `fahrplaene/FAHRPLAN-OPENCASELAW-QUELLEN.md` → `archiv/` (Technik-Ports W1/W4–W13 dort unverändert).

- **Abschnitt «🚀 Batch-Deploy-Fenster»** — gestrichen 3.8.2026: der Mechanismus ist seit dem §9-Weg-1-Entscheid (David 3.7.2026, «Merge nach `main` = Deploy-Entscheid») abgelöst; das Ausführungs-Protokoll Ziff. 5 hält das ausdrücklich fest («Ersetzt das frühere Push/Deploy nicht selbst — sammeln fürs Batch-Deploy-Fenster»). Der aufgestaute Stand ging am 2.7.2026 mit Deploy `a3769d72` live. Zwei Regeln zur selben Frage sind eine zu viel (§5).

- **Geparkt-Eintrag «Grundsätzliche Startseiten-Überarbeitung»** — gestrichen 3.8.2026: am 3.7.2026 entparkt und als `W2·5c` gebaut (PRs #106/#107/#108/#111 + S5 Brass-Hero); ein durchgestrichener Eintrag in der Geparkt-Liste führt eine Parkposition, die es nicht mehr gibt. Spec bleibt `archiv/FAHRPLAN-STARTSEITE-V3.md`.

## Nachtrag zur Umschichtung 3.8.2026 (zweite Runde, Feinschliff)

### Produktvision — Verzahnungs-Rückgrat, Glieder-Aufzählung *(verschoben 3.8.2026)*

**Verzahnung als Rückgrat (Organisationsprinzip, kein Einzelfeature):** die tragenden Schritte
dieses Plans sind Glieder EINES Graphen — W1·2 (Norm↔Werkzeug, live) · W2·6 Norm→Entscheid +
W2·6-DATA E4 Zitat-Graph · W2·7 Verzahnungs-Klingen · E5/E6a/E6b (Kanton-Entscheide, VerwVO,
Materialien) · W3·14 Split-View (macht den Graphen sichtbar). Das kann kein einzelnes Amtsportal —
darum ist die Verzahnung Burggraben UND das Kriterium, nach dem neue Schritte einsortiert werden
(§14: neue Doktypen docken immer an den Graphen an, nie als Silo). Der bestehende Code-Bestand dazu
(kontext.ts/KontextPanel/norm-index) ist in `fahrplaene/FAHRPLAN-DATENHALTUNG.md` §0bis inventarisiert.
*Ehrliche Grenze: das Rückgrat ist Plan-Doktrin, kein maschinelles Tor — es wird über
§14-Einsortierung und Review gelebt, nicht von einem `check:` erzwungen.*

### W2·9 — Herkunft der Verengung und Abgrenzung zur Bedienungsanleitung *(verschoben 3.8.2026)*

  **Detail:** [FAHRPLAN-ARCHIV-RESTPUNKTE.md](fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md) §20 — dort steht
  die massgebliche Fassung der zwei Restpunkte (A3 / E-Optional) samt Herkunftsbeleg auf
  `archiv/FAHRPLAN-UX-PUNKTELISTE.md`. Der frühere `fahrplan:`-Zeiger auf die Archivdatei lieferte
  die überholte 20-Punkte-Liste statt der Verengung (Endprüfungs-Fund 14, 31.7.2026).
  **§14-Intake 20.7.2026 (David):** Bedienungsanleitung/Onboarding für LexMetrik — Ersteinstieg «was kann das Werkzeug», je Rubrik ein Kurzpfad; **Träger sind `W2·16-INVENTAR` und `W2·16-ANLEITUNG`** (`fahrplan: fahrplaene/FAHRPLAN-UI-QUALITAET.md`), **nicht** dieser Schritt — die UX-Punkteliste enthält zu Bedienungsanleitung/Onboarding kein Wort (Grep-Befund 31.7.2026), der frühere Zeiger hierher war faktisch falsch.
  Die Prämisse «*bevor* Restpunkte C2/C5 angefasst werden» ist aufgelöst: C2 und C5 sind gebaut.
  Das Deliverable **Mapping-Tabelle alt-Punkt → Code-Pfad → Status** ist durch das Archiv-Verdikt
  31.7.2026 geliefert (18/20 live, Batch D über IV-1/IV-2, Batch F über
  `archiv/FAHRPLAN-KANTONALE-ENTSCHEIDE.md`).

### Leitprinzip 7 — Wortlaut der Geräte-Last-Regel *(verschoben 3.8.2026; Vollfassung steht in CLAUDE.md §15)*

7. **Geräte-Last: nicht merklich langsamer — ausser bei Logikverlust** (Anweisung David 30.6.2026,
   voll in **CLAUDE.md §15**). Lexmetrik darf den Computer des Nutzers nicht merklich verlangsamen,
   **solange daraus kein Logikverlust** (Inhalts-/Rechtsregel-/Funktions-Treue, golden-Byte-Gleichheit)
   entsteht; bei Konflikt gewinnt **immer die Treue** (§1-untergeordnet). Jede Optimierung trägt eine
   explizite Logikverlust-Bewertung. Operationalisiert durch das Tor **`check:perf-budget`** →
   Querschnitt **`QS-PERF`** / **`fahrplaene/FAHRPLAN-PERFORMANCE.md`**.

## W2·5d — Stand-/Beschreibungs-Prosa des Dach-Schritts *(done, verschoben 4.8.2026)*

Wörtlich aus ROADMAP.md überführt (Diät 4.8.2026):

  **Stand 26.7.2026:** G0–G6, A1–A18, A19–A25 (ohne zurückgezogenes L-3/A28), E-Reihe A29–A40/E1–E7,
  §11 IA-1–IA-7, EID-1/EID-2 und FN-5/M14 gebaut — **offener Rest = EID-3** + Härtungs-/Politur-Posten.
  UX/Lesbarkeit des Gesetz-Lesers auf State-of-the-Art (Fedlex = Mindestlatte): EINE Linien-Sprache,
  Lesespalte `max-w-reading`, Leser-Kopf-Optionen, je Grundart eine Designvorschrift; G3b ist Risiko-Pfad.

---

<!-- Umschichtung 4.8.2026 (ROADMAP-Diät Welle 2; Anlass: der Re-Akkumulations-Wächter
     `struktur-rotieren.py --check` meldete ROADMAP.md mit 120.6 KB über dem 100-KB-Ceiling,
     QS-TOK): die zu diesem Zeitpunkt erledigten Schritte aus ROADMAP.md hierher verschoben —
     WÖRTLICH samt `@meta`-Zeile, nie zusammengefasst (ROADMAP ▶ Ausführungs-Protokoll Ziff. 6).
     Muster und Ablage-Form der Welle 1 vom 3.8.2026 (Commit 793e9aee3) unverändert übernommen.
     NICHT verschoben, obwohl `done`: **W2·5d** — zwei OFFENE Schritte (`W2·10-UI-NAV`,
     `W2·5h-GESETZ-UI`) tragen `dep: [W2·5d]`, und `check:plan` Regel 4 verlangt, dass jede
     dep-ID im Plan existiert. Ein Umzug hätte den Steuerungsplan unwahr gemacht. -->

# Umschichtung 4.8.2026 — erledigte Schritte aus dem Steuerungsplan (Welle 2)

## QS-UI-WARNLINE — `--warn-line`-Kontrast 3.008 minimal abdunkeln *(done, verschoben 4.8.2026)*

  - [x] **UI-WARNLINE · `--warn-line`-Kontrast 3.008 minimal abdunkeln** *(Anlass: Kontrast-Messung 3.8.2026 — der Wert liegt 0.008 über der 3:1-Schwelle für nicht-textliche Kontraste, also innerhalb jeder Mess-Streuung; ein Token-Tick Abdunklung macht die Einhaltung robust)* — reine Token-Änderung, `check:farbwelt` + axe, flip-reversibel. Priorität **niedrig**. **Detail:** [FAHRPLAN-UI-QUALITAET.md](fahrplaene/FAHRPLAN-UI-QUALITAET.md) §11. §13/DESIGN-REGLEMENT.
    <!-- @meta id: QS-UI-WARNLINE · status: done · of: ja · blocker: null · dep: [] · kollision: [src/index.css, scripts/check-farbwelt.ts] · worktree: ja · 26x: nein · fahrplan: fahrplaene/FAHRPLAN-UI-QUALITAET.md -->

## QS-PLAN-BILD — Lagebild-Generator `npm run plan:bild` *(done, verschoben 4.8.2026)*

- [x] **`QS-PLAN-BILD` · Lagebild-Generator `npm run plan:bild`** *(Auftrag David 4.8.2026 — das handgebaute HTML-Lagebild dieser Session hat sich bewährt («ja gefällt mir»); als Schnappschuss veraltet es, darum als Generator verankern)* — ein Skript auf dem bestehenden Parser (`scripts/plan/parse.ts`), das die **laienverständliche** Übersichtsseite deterministisch erzeugt: Bestand-Kacheln · Phasen-Position (GESAMTAUFBAU) · «Wartet auf David» (Blocker + offene Entscheide) · `@queue` in Klartext · Baustellen-Karten je `fahrplan:`-Gruppe mit Fortschritt und nächstem Schritt. **Erweitert zum Steuerpult (Go David 4.8.2026):** je `ready`-Schritt ein generierter, kopierbarer Bau-Prompt für Untersessions (inkl. wip-Setzen, Worktree, Slice-Befehl, DoD, §14.7 wörtlich) + Sektion «Gerade im Bau» (`wip`-Schritte, offene PRs mit CI-Status, Worktrees) mit `--watch`-Auto-Refresh; kein Server. Reine Lese-/Werkzeug-Schicht: kein `src/`-Code, kein Deploy-Artefakt, Ausgabe als eigenständige HTML-Datei ausserhalb von `public/`. Kein Risikopfad. **Detail:** [FAHRPLAN-PLAN-STEUERUNG.md](fahrplaene/FAHRPLAN-PLAN-STEUERUNG.md) §«Lagebild-Generator `plan:bild`».
  <!-- @meta id: QS-PLAN-BILD · status: done · of: ja · blocker: null · dep: [] · kollision: [scripts/plan, package.json] · worktree: ja · 26x: nein · fahrplan: fahrplaene/FAHRPLAN-PLAN-STEUERUNG.md -->

## QS-CODE-FRISTENKERN — Grenzwert-Batterie für `fristenEngine.ts` *(done, verschoben 4.8.2026)*

- [x] **`QS-CODE-FRISTENKERN` · Grenzwert-Batterie für `fristenEngine.ts`** *(Anlass: Code-Inventur 4.8.2026 — die von 5 Rechtsgebiets-Engines geteilte Fristen-Infrastruktur hat 6 direkte Testfälle; ein Fehler dort schlägt auf ZPO-, SchKG-, Verjährungs- und Mietfristen gleichzeitig durch)* — reiner Test-ZUBAU (Monatsenden, Feiertags-Kaskaden, Stillstands-Überschneidungen, Jahreswechsel), jeder Fall mit Norm-Anker; Scheiterns-Fähigkeit per Mutation **einmal rot** zeigen (§6.7). `Gegenpruefung: n/a — reine Prüflogik`; findet die Batterie einen echten Fehler, ist dessen Fix ein eigener Risikopfad-Schritt. **Detail:** [FAHRPLAN-CODE-VERBESSERUNG.md](fahrplaene/FAHRPLAN-CODE-VERBESSERUNG.md) §2.
  <!-- @meta id: QS-CODE-FRISTENKERN · status: done · of: ja · blocker: null · dep: [] · kollision: [src/tests] · worktree: ja · 26x: nein · fahrplan: fahrplaene/FAHRPLAN-CODE-VERBESSERUNG.md -->

## W2·5d-EID3 — Linien-Tiefe aus der eId-Pfadlänge *(done, verschoben 4.8.2026)*

  - [x] **5d-EID3 · EID-3 Teil (b): Linien-Tiefe aus der eId-Pfadlänge** — Guide-/Einzugstiefe aus dem kumulativen eId-Pfad statt aus der Sidecar-Rekursionstiefe; golden-neutral, Tor `check:linien-kanon`.
    <!-- @meta id: W2·5d-EID3 · status: done · of: ja · blocker: null · dep: [] · kollision: [src/pages/gesetz-leser/linienAufbau.ts] · worktree: ja · 26x: nein · fahrplan: fahrplaene/FAHRPLAN-GESETZES-UX.md -->

## W2·5d-ANNEX — eId-Anker für Annex-Sections *(done, verschoben 4.8.2026)*

  - [x] **5d-ANNEX · eId-Anker für Annex-Sections** — die aus EID-1 bekannte Grenze schliessen: Container-eIds auch auf dem separaten Anhang-Pfad mitschneiden. **Extraktion = Risikopfad.**
    <!-- @meta id: W2·5d-ANNEX · status: done · of: ja · blocker: null · dep: [] · kollision: [scripts/normtext/struktur-extrahiere.ts, public/normtext/bund] · worktree: ja · 26x: nein · fahrplan: fahrplaene/FAHRPLAN-GESETZES-UX.md -->

## W2·5d-SPY — Scroll-Spy-Härtung (rootMargin ↔ Bezugslinie) *(done, verschoben 4.8.2026)*

  - [x] **5d-SPY · V3/H6 — Scroll-Spy-Härtung (rootMargin ↔ Bezugslinie)** — der einzige offene Härtungs-Posten der E-Reihe; **erst reproduzieren, dann fixen** (H6 ist unreproduziert).
    <!-- @meta id: W2·5d-SPY · status: done · of: ja · blocker: null · dep: [] · kollision: [src/pages/gesetz-leser/parts/SektionBaumTOC.tsx, src/pages/gesetz-leser/scrollAnker.ts] · worktree: ja · 26x: nein · fahrplan: fahrplaene/FAHRPLAN-GESETZES-UX.md -->

## W2·5d-YC — IA-Rest Y-C: `/international` Stufe 2 *(done, verschoben 4.8.2026)*

  - [x] **5d-YC · IA-Rest Y-C: `/international` Stufe 2** — echter Redirect mit Hash-Mapping; §11 ist sonst komplett, Stufe 2 war dem Stufe-1-Betrieb nachgelagert.
    <!-- @meta id: W2·5d-YC · status: done · of: ja · blocker: null · dep: [] · kollision: [src/lib/seo.ts, src/lib/navigation.ts] · worktree: ja · 26x: nein · fahrplan: fahrplaene/FAHRPLAN-GESETZES-UX.md -->

## W2·10-UI-NAV-VR — Verzahnung auf Reader-Fläche (V3 + V5) *(done, verschoben 4.8.2026)*

  - [x] **UI-NAV-VR · Verzahnung auf Reader-Fläche (V3 + V5)** — Regeste-Popover am KantenChip + Erwägungs-Navigation im Entscheid-Leser; `parts.tsx`-Kollisions-Precheck Pflicht (§0.2). §3.
    <!-- @meta id: W2·10-UI-NAV-VR · status: done · of: ja · blocker: null · dep: [W2·5d] · kollision: [src/pages/EntscheidLeser.tsx, src/lib/rechtsprechung/abschnitte.ts, src/pages/gesetz-leser/parts.tsx] · worktree: ja · 26x: nein · fahrplan: fahrplaene/FAHRPLAN-UI-NAVIGATION.md -->

## W2·10-UI-NAV-R1 — Reader: Finden im Gesetz (R1 + R2) *(done, verschoben 4.8.2026)*

  - [x] **UI-NAV-R1 · Reader: Finden im Gesetz (R1 + R2)** — In-Gesetz-Suche mit Treffer-Highlight + mobile Gliederung als Bottom-Sheet mit «Sie sind hier». §4.
    <!-- @meta id: W2·10-UI-NAV-R1 · status: done · of: ja · blocker: null · dep: [W2·5d] · kollision: [src/pages/gesetz-leser/inhalt.tsx, src/pages/gesetz-leser/parts] · worktree: ja · 26x: nein · fahrplan: fahrplaene/FAHRPLAN-UI-NAVIGATION.md -->

## W2·10-UI-NAV-R2 — Reader: Zitieren und Zurückspringen (R3 + R5 + R7) *(done, verschoben 4.8.2026)*

  - [x] **UI-NAV-R2 · Reader: Zitieren und Zurückspringen (R3 + R5 + R7)** — zitierfähige Referenz mit Permalink · Rücksprung-Chip-Restscope · Deep-Link-Skeleton «Springe zu Art. X …». §4.
    <!-- @meta id: W2·10-UI-NAV-R2 · status: done · of: ja · blocker: null · dep: [W2·5d] · kollision: [src/pages/gesetz-leser/scrollAnker.ts, src/components/layout/InhaltsKopf.tsx] · worktree: ja · 26x: nein · fahrplan: fahrplaene/FAHRPLAN-UI-NAVIGATION.md -->

## W2·10-UI-NAV-URL — Scroll-Hash nur bei explizitem Klick/Teilen (LM-202) *(done, verschoben 4.8.2026)*

  - [x] **UI-NAV-URL · Scroll-Hash nur bei explizitem Klick/Teilen (LM-202, David-Entscheid 3.8.2026)** — kontinuierlichen Scroll-Sync der URL entfernen (falls vorhanden); URL ändert sich nur bei Klick auf einen Artikel-Anker bzw. bei der Teilen-Aktion; Rückweg-/History-Verhalten testen; e2e linkTeilen-Tests beachten. FAHRPLAN-UI-BEFUNDE.md §1.1 LM-202.
    <!-- @meta id: W2·10-UI-NAV-URL · status: done · of: ja · blocker: null · dep: [W2·5d] · kollision: [src/pages/gesetz-leser/scrollAnker.ts, src/components/LinkTeilenButton.tsx, src/lib/liveUrlSync.ts] · worktree: ja · 26x: nein · fahrplan: fahrplaene/FAHRPLAN-UI-BEFUNDE.md -->

## W2·10-UI-NAV-R3 — Reader: Weiterlesen und Tastatur (R4 + R8) *(done, verschoben 4.8.2026)*

  - [x] **UI-NAV-R3 · Reader: Weiterlesen und Tastatur (R4 + R8)** — Positions-Persistenz «Weiterlesen bei Art. X» + Tastatur-Navigation j/k mit «?»-Overlay (R8 = niedrigste Priorität der Reihe). §4.
    <!-- @meta id: W2·10-UI-NAV-R3 · status: done · of: ja · blocker: null · dep: [W2·5d] · kollision: [src/pages/gesetz-leser/inhalt.tsx, src/lib/zuletztVerwendet.ts] · worktree: ja · 26x: nein · fahrplan: fahrplaene/FAHRPLAN-UI-NAVIGATION.md -->

## W2·10-UI-NAV-R4 — Trefferflächen und a11y (R6 + E4) *(done, verschoben 4.8.2026)*

  - [x] **UI-NAV-R4 · Trefferflächen und a11y (R6 + E4)** — Tap-Target-Sammelticket mit **Token-Regel ins `DESIGN-REGLEMENT.md`** + a11y-Prüfauftrag der Linsen. **Grenze zu `W2·17-UI-BEFUNDE-B10`:** hier entsteht die REGEL (ein Token, eine Reglement-Zeile), dort werden die einzelnen Symbolknöpfe und Aktions-Anker daran angepasst. §4/§7.
    <!-- @meta id: W2·10-UI-NAV-R4 · status: done · of: ja · blocker: null · dep: [W2·5d] · kollision: [src/index.css, e2e/a11y.e2e.ts, DESIGN-REGLEMENT.md] · worktree: ja · 26x: nein · fahrplan: fahrplaene/FAHRPLAN-UI-NAVIGATION.md -->

## W2·10-UI-NAV-Z — Zusatzposten Ausleitung (Z1 + Z2) *(done, verschoben 4.8.2026)*

  - [x] **UI-NAV-Z · Zusatzposten Ausleitung (Z1 + Z2)** — ICS-/Kalender-Export der Fristergebnisse + Print-CSS für Fundstellen; Ist-Stand vor dem Bau erheben. §7.
    <!-- @meta id: W2·10-UI-NAV-Z · status: done · of: ja · blocker: null · dep: [W2·5d] · kollision: [src/lib/icsExport.ts, src/index.css] · worktree: ja · 26x: nein · fahrplan: fahrplaene/FAHRPLAN-UI-NAVIGATION.md -->

## Übernahme 5.8.2026 — Ziff.-6-Vollzug (QS-PLAN-REVIEW)

### Abschluss QS-SESSION-ZYKLUS (5.8.2026 abends)

Skill `bauschritt` (107 Z., dünne Klammer über auftrag/gegenpruefung/landung/lehren):
Standard-Lebenszyklus Einstieg→Bau→Prüfung→Landung→Abschluss mit Grössen-Check
(sessionfüllend, Bündeln/Schneiden) und Token-Regel-Kasten; jeder Lagebild-Bau-Prompt
beginnt mit der Auslöse-Zeile samt Schritt-ID (70/70 verifiziert, Erste-Zeile-Test).
Anlass: Auftrag David («Session immer gleich anfangen … am Ende aufräumen; mein
einziger Input ist der Einzelschritt-Prompt»). Bau feat/qs-session-zyklus, 46 Tests.

- [x] **`QS-SESSION-ZYKLUS` · Standard-Lebenszyklus als Skill `bauschritt` + Lagebild-Auslöser**
  <!-- @meta id: QS-SESSION-ZYKLUS · status: done · of: ja · blocker: null · dep: [] · kollision: [.claude/skills, scripts/plan] · worktree: ja · 26x: nein · fahrplan: fahrplaene/FAHRPLAN-PLAN-STEUERUNG.md -->

### Abschluss QS-PLAN-WIP-FRISCHE (5.8.2026 abends, wörtlich aus ROADMAP.md)

- [x] **`QS-PLAN-WIP-FRISCHE` · `plan:next` warnt vor `wip`-Marken ohne Bau-Spur** *(Anlass: 5.8.2026 baute eine Session `QS-TOK` + `QS-TOK-AUFRAEUMEN` fertig, landete #457/#458 und endete, **ohne die wip-Marke freizugeben** — das Lagebild zeigte stundenlang «im Bau», was auf `main` lag, bis David nachfragte; **zweiter Fall** desselben Musters nach dem 10-wip-Vorfall vom ~20.7.2026 ⇒ Eskalation Prosa→Maschine, Skill `lehren` Regel 5)* — Der Lage-Block prüft je `wip`-Schritt, ob eine **Bau-Spur** existiert (Worktree oder lokaler Branch mit seinem Slug; mit `--prs` zusätzlich ein offener PR über `headRefName`/Titel) und meldet sonst eine Freigabe-Zeile. Kein neues Zustandsfile, keine Zeit-Heuristik; bei **nicht abfragbarer** git-Lage wird **nicht** gewarnt («nicht prüfbar» ist nicht «stale»). Reine Werkzeug-Schicht, kein `src/`-Code. **Detail:** [FAHRPLAN-PLAN-STEUERUNG.md](fahrplaene/FAHRPLAN-PLAN-STEUERUNG.md) §Frische-Warnung.
  <!-- @meta id: QS-PLAN-WIP-FRISCHE · status: done · of: ja · blocker: null · dep: [] · kollision: [scripts/plan] · worktree: ja · 26x: nein · fahrplan: fahrplaene/FAHRPLAN-PLAN-STEUERUNG.md -->


### Abschluss QS-TOK (5.8.2026, Dekret-Block wörtlich aus ROADMAP.md)

Rest T10 · T12-Stufe-2 · T14-Stufe-1 · T16 · T20 gelandet (PRs #457/#458, QS-TOK-Session 5.8. vormittags); wip-Marke nach Session-Ende offen geblieben, Abschluss-Nachzug durch die Orchestrier-Session. Übrige §§4–§7-Pakete des Fahrplans sind eigenständiger Backlog, nicht Teil des Schritt-Rests.

> **⬆ OBERSTER OFFENER SCHRITT: `W2·10-UI-NAV`.** Der Queue-Kopf `QS-TOK` ist seit
> 5.8.2026 **`wip`** (Bau in der Orchestrierungs-Session; Priorisierung David
> 10.7.2026, Wortlaut «oberster schritt soll sein den token verbrauch zu minimieren»); die
> Aufräumwelle vom 31.7.2026 (AP-0…AP-11, PR #407) ist gebaut.
> Rest am 5.8.2026 abgeschlossen (Stand-Block im Fahrplan, §Stand 5.8.2026); Landung via
> PR `feat/qs-tok` + `feat/qs-tok-t14`. Das ROADMAP-Ceiling misst
> `python3 .claude/hooks/struktur-rotieren.py --check` — **allein dieser Befehl** sagt, ob es
> gerade eingehalten ist; ein Momentwert wird hier bewusst **nicht** zweitgeführt (jede fixe
> Zahl war binnen Stunden überholt, Endprüfungs-Funde 6/12/31, zuletzt Bauplan-Review-Befund B2).
> Hebel bei einem Riss ist die Rotation samt Chronik-Überführung — so wurde der Riss vom 4.8.2026
> mit der Rotation vom 5.8.2026 behoben.
> **Bau-Spec: [`fahrplaene/FAHRPLAN-TOKEN-OEKONOMIE.md`](fahrplaene/FAHRPLAN-TOKEN-OEKONOMIE.md) §§3–§7, Reihenfolge §8; Stand/Belege: §Stand 31.7.2026.**
> Danach folgt `W2·10-UI-NAV` gemäss `@queue` (zweiter Eintrag der Zeile oben).
> <!-- @meta id: QS-TOK · status: done · of: ja · blocker: null · dep: [] · kollision: [package.json, scripts, .claude, CLAUDE.md, ROADMAP.md, STRUKTUR.md] · worktree: ja · 26x: nein · fahrplan: fahrplaene/FAHRPLAN-TOKEN-OEKONOMIE.md -->
> Bau verbraucht **weniger Tokens** — nur über Effizienz (gezielter lesen, kompakter übergeben,
> deterministisch statt modellgetrieben, cachen, indizieren); Einmal-Investitionen ok.
> **Leitplanke (nicht verhandelbar):** keine Massnahme kürzt Beweis, Tor oder Prüfung —
> Gegenprüfung/Doppel-Verifikation/iterative Bug-Checks/golden byte-gleich bleiben unangetastet.
> Die Feature-Reihenfolge steht in der **`@queue`-Zeile oben** (SSoT); abgelöste Fassung wörtlich
> → `ROADMAP-CHRONIK.md` → Steuerungs-Prosa (24.7.2026).
> **Stand 31.7.2026:** autonomer Bau-Rest der Pakete T1–T19 ist gebaut; offen bleiben die fünf
> Posten oben (Go David 27.7.2026) plus das ROADMAP-Ceiling. Nachmess-Beleg und die drei Massgaben
> (T16 nur in frischer Session · T12-Stufe-2 Weglassungs-Begründung neu bewerten · T20 ist ein
> stehendes Instrument, kein Einmal-Bau) wörtlich → `ROADMAP-CHRONIK.md` → QS-TOK (3.8.2026).


### Abschluss QS-TOK-AUFRAEUMEN (5.8.2026, wörtlich aus ROADMAP.md)

Skill `aufraeumen` gebaut, gelandet und zweifach re-reviewt (d710c8208 · ea1764007 · 5bbb5ad2a); wip-Marke stand nach Session-Ende noch, Freigabe-Nachzug durch die Orchestrier-Session.

- [x] **`QS-TOK-AUFRAEUMEN` · Skill `aufraeumen` (Playbook der Session vom 3.8.2026)** *(Anlass: die Aufräum-Session hat ein wiederholbares Verfahren erzeugt — Rotation, Chronik-Überführung, Streich-Massstab, Fahrplan-Archivierung, Tor-Reihenfolge —, das heute nur im Kopf steht)* — als Skill ablegen, damit die nächste Aufräumung nicht wieder erfunden wird. Prozedur gehört in einen Skill, nicht ins Reglement (CLAUDE.md-Kopf). **Detail:** [FAHRPLAN-TOKEN-OEKONOMIE.md](fahrplaene/FAHRPLAN-TOKEN-OEKONOMIE.md) §11.2.
  <!-- @meta id: QS-TOK-AUFRAEUMEN · status: done · of: ja · blocker: null · dep: [] · kollision: [.claude/skills] · worktree: nein · 26x: nein · fahrplan: fahrplaene/FAHRPLAN-TOKEN-OEKONOMIE.md -->


### Abschluss QS-PLAN-BILD-LAGE (5.8.2026 nachmittags, wörtlich aus ROADMAP.md)

Lagebild in Laiensprache (Auftrag David 5.8.2026): Block «Was gerade passiert» (Bau/fertig/wartet-auf-David), Wirkungsbereich-Etiketten aus kollision:-Globs, Titel-zuerst an sechs Stellen, Kürzel-Legende + Bereichs-Definitionen auf der Methode-Seite, Namensregel im Skill auftrag. 42 neue Tests, Byte-Rückrechnung identisch, check:schlankheit-Split bildMethode.ts.

- [x] **`QS-PLAN-BILD-LAGE` · Lagebild-Einstieg: Block «Was gerade passiert» in Laiensprache** *(Anlass: Auftrag David 5.8.2026 — «ich brauche einfachere Sprache um zu verstehen was gerade passiert»)* — Der Einstieg `plan-bild.html` trägt zuoberst drei Fragen ohne Fachsprache: woran gerade gebaut wird (belegte Flächen über eine statische Pfad→Alltagsbegriff-Tabelle), was zuletzt auf `main` gelandet ist, und was namentlich bei David liegt. **Alle Sätze statisch im Code**, nur die Werte mechanisch gefüllt (kein Modell zur Laufzeit, §2); die Fachsektionen darunter bleiben unverändert. **Detail:** [FAHRPLAN-PLAN-STEUERUNG.md](fahrplaene/FAHRPLAN-PLAN-STEUERUNG.md) §Laien-Block.
  <!-- @meta id: QS-PLAN-BILD-LAGE · status: done · of: ja · blocker: null · dep: [] · kollision: [scripts/plan] · worktree: ja · 26x: nein · fahrplan: fahrplaene/FAHRPLAN-PLAN-STEUERUNG.md -->


### Abschluss QS-CI-VERCEL (5.8.2026 vormittags, wörtlich aus ROADMAP.md)

PR #445 gemergt 5.8.2026 08:11Z (Auto-Squash; Skip=success-Beweis: Doku-Diff «Canceled by Ignored Build Step» mit Check-State success, App-Diff-Build DEPLOYED — Merge-Go David 4.8., Bedingung erfüllt).

- [x] **`QS-CI-VERCEL` · Vercel-Kontingent schonen: Ignored Build Step für App-fremde Diffs** *(Anlass 4.8.2026, §17: das Free-Tier-Tageslimit — über 100 Preview-Deployments an einem Tag — blockierte den merge-pflichtigen «Vercel»-Check von PR #443, einem Diff, der die App gar nicht berührt; Landung nur per Admin-Bypass, Entscheid David. Bei heutigem Parallel-Session-Volumen wiederholt sich das.)* — Ignored Build Step verdrahten (`vercel.json` `ignoreCommand` bzw. Projekt-Einstellung): Preview nur bauen, wenn der Diff App-Flächen berührt (`src/`, `public/`, `index.html`, `package.json`, Vite-/Vercel-Konfig); reine Doku-/Skript-Diffs melden den Check ohne Deployment grün. Konservativ: im Zweifel bauen (gleiche Linie wie die ci.yml-Diff-Klassierung). **Scheiterns-Fähigkeit einmal zeigen (§6.7):** ein App-Diff muss nachweislich weiterhin bauen. **Stand 4.8.2026 abends:** PR #445 (Testträger, `[NICHT MERGEN]`) gebaut — `ignoreCommand` verdrahtet, beide Exit-Code-Beweise lokal geführt (App-Diff `f4817ba47` → 1/bauen · Doku-Diff `5dc364b4c` → 0/skip). **Offen vor Merge:** empirischer Beleg nach Limit-Reset, als WAS der übersprungene Build beim Pflicht-Check «Vercel» erscheint (success ⇒ mergefähig; canceled/neutral ⇒ Check-Pflicht-Politik als David-Entscheid) — Testplan im PR. **Testhälfte App-Diff ist real erbracht** (Branch-Build `89842148c` DEPLOYED); der Doku-Testcommit `d52d44d26` liegt bereit, wurde am 4.8. aber noch rate-limited («retry in 24 hours») — **morgen: Vercel-Re-Run/neuen Doku-Commit auslösen, Check-Status ablesen, bei success mergen (Merge-Go David 4.8.2026 erteilt)**, Testdatei `docs/vercel-skip-test.md` vor dem Merge wieder entfernen.
  <!-- @meta id: QS-CI-VERCEL · status: done · of: ja · blocker: null · dep: [] · kollision: [vercel.json] · worktree: ja · 26x: nein -->


### Abschluss QS-PLAN-REVIEW (5.8.2026 nachts, wörtlich aus ROADMAP.md)

- [x] **`QS-PLAN-REVIEW` · Bauplan-Review 4.8.2026 — Befund-Fixes + Prävention (Spec-Bindungs-Tor, Lage-Block)** *(Anlass: Auftrag David 4.8.2026 abends, «schau dir den bauplan an … fixe alle befunde»; vier unabhängige read-only-Prüfagenten über ROADMAP, alle 28 Fahrpläne, git-Historie und offene PRs. Gesamtbild: mechanisch sauber — `check:plan` grün, kein falsches `done` —, **die Fehler sitzen dort, wo das Tor blind ist**: Anker, die auflösen aber das Falsche treffen (B1) · Steuerungs-Prosa, die von der Wirklichkeit überholt wurde (B2) · fertig gebaute Arbeit, die als `ready` in offenen PRs parkt und darum doppelt gebaut werden kann (B3, F6-Nachbarschaft))* — Doku-Fixes + zwei Präventionen: **Tor-Erweiterung `check:plan` auf Spec-Bindung** (je `fahrplan:`-Verweis mit §-Anker prüfen, dass der Anker auflöst UND der §-Abschnitt die Schritt-ID wörtlich enthält; **Geburtsbeweis:** auf dem Stand vor den Fixes dreifach rot, §6.7) und **Lage-Block in `plan:next`** (wip-Schritte mit `kollision:`-Globs + `git worktree list`, Flag `--prs` für `gh pr list`; offline-Default bleibt netzfrei). Ausdrücklich **nicht** gebaut: SessionStart-Hook (zerstört den Prompt-Cache, Entscheid QS-TOK/T19), Claim-Registry (zweimal verworfen), Prosa-Frische-Heuristik, jedes neue Zustandsfile. **Detail:** [FAHRPLAN-PLAN-STEUERUNG.md](fahrplaene/FAHRPLAN-PLAN-STEUERUNG.md) § «Bauplan-Review 4.8.2026».
  <!-- @meta id: QS-PLAN-REVIEW · status: done · of: ja · blocker: null · dep: [] · kollision: [scripts/plan, .claude/hooks, fahrplaene, ROADMAP.md] · worktree: ja · 26x: nein · fahrplan: fahrplaene/FAHRPLAN-PLAN-STEUERUNG.md -->


### Querschnitt-Band: Code-Inventur (§14-Intake 4.8.2026) — vier Strukturmassnahmen *(Befunde, done)*

- [x] **`QS-CODE-TURSO` · Turso-Sync-Durchsatz: Wurzel-Fix des FTS-Insert-Pfads** *(Anlass: Code-Inventur 4.8.2026 — 22.3 von 32.8 min Sync entfallen auf zeilenweises Insert in `fts_entscheide_schaufenster` bei ~4 Zeilen/s; Timeout-Reserve trägt nur ~3.7× Korpusgrösse, kollidiert mit `W2·13-KANTONE`)* — **Risikopfad** (`scripts/datenhaltung`) ⇒ Gegenprüfung. Abgrenzung: nur Durchsatz des bestehenden Syncs — Architektur bleibt `W2·6-DATA`, Wachstums-Schwellen bleiben `QS-AUTOMATIK`. **Detail:** [FAHRPLAN-CODE-VERBESSERUNG.md](fahrplaene/FAHRPLAN-CODE-VERBESSERUNG.md) §1.
  <!-- @meta id: QS-CODE-TURSO · status: done · of: ja · blocker: null · dep: [] · kollision: [scripts/datenhaltung, .github/workflows/turso-sync.yml] · worktree: ja · 26x: nein · fahrplan: fahrplaene/FAHRPLAN-CODE-VERBESSERUNG.md -->
- [x] **`QS-CODE-AUSSENKANTEN` · Unbewachte Aussenkanten: Tor `check:ui-normzitate` + typisierte JSON-Kanten** *(Anlass: Code-Inventur 4.8.2026 — 1'141 hart kodierte `Art.`-Zitate in 107 UI-Dateien sind eine zweite Norm-Quelle ohne Tor gegen das Register; 9× `as unknown as` an JSON-Importen in `src/data` lassen Struktur-Drift compiler-stumm)* — Verhaltensneutral. **Detail:** [FAHRPLAN-CODE-VERBESSERUNG.md](fahrplaene/FAHRPLAN-CODE-VERBESSERUNG.md) §3.
  <!-- @meta id: QS-CODE-AUSSENKANTEN · status: done · of: ja · blocker: null · dep: [] · kollision: [scripts, src/data, package.json] · worktree: ja · 26x: nein · fahrplan: fahrplaene/FAHRPLAN-CODE-VERBESSERUNG.md -->
- [x] **`QS-CODE-ENTDOPPLUNG` · Entdopplungs-Programm Darstellungsschicht (D1–D7)** *(Anlass: Code-Inventur 4.8.2026 — 24 von 29 Vorlagen-Seiten rollen von Hand, was der existierende Rahmen `VorlagenSeite.tsx` kann; `VorlageAgGruendung` hält 55 Einzel-useState neben dem 24-fach genutzten `useWizardState`; Gerichtswahl-Block 6×, Kantonsvergleichs-Tabelle 4×, Permalink-Einlesen 17× kopiert)* — §3-konforme Verkleinerung NUR in der Darstellungsschicht. **Detail:** [FAHRPLAN-CODE-VERBESSERUNG.md](fahrplaene/FAHRPLAN-CODE-VERBESSERUNG.md) §4.
  <!-- @meta id: QS-CODE-ENTDOPPLUNG · status: done · of: ja · blocker: null · dep: [] · kollision: [src/pages, src/components/vorlagen, src/components/forms] · worktree: ja · 26x: nein · fahrplan: fahrplaene/FAHRPLAN-CODE-VERBESSERUNG.md -->
- [x] **`QS-CODE-SPLITS` · Grossdatei-Aufteilungen mit dokumentiertem Schnitt** *(Anlass: Code-Inventur 4.8.2026 — sechs Misch-Dateien mit klarem Trenner: `fedlex.ts` 1'017 Z/4 Achsen, `zustaendigkeit.ts` 986 Z/2 Engines, `besetzung.ts` 874 Z Parser↔Kanon, `prozesskosten.ts`, `zitat-extraktion.ts`, `EntscheidLeser.tsx` 893-Z-Monolith neben dem in 28 Dateien zerlegten Gesetz-Leser)* — je Datei ein verhaltensneutraler Schritt nach Skill `refactoring`, **opportunistisch beim ohnehin anstehenden Bau an der Datei**, nie als Selbstzweck-Welle. **Detail:** [FAHRPLAN-CODE-VERBESSERUNG.md](fahrplaene/FAHRPLAN-CODE-VERBESSERUNG.md) §5.
  <!-- @meta id: QS-CODE-SPLITS · status: done · of: ja · blocker: null · dep: [] · kollision: [src/lib/fedlex.ts, src/lib/zustaendigkeit.ts, src/lib/rechtsprechung, src/pages/EntscheidLeser.tsx] · worktree: ja · 26x: nein · fahrplan: fahrplaene/FAHRPLAN-CODE-VERBESSERUNG.md -->

### Welle 2·5d — Gesetzes-UX & Darstellungs-Reglement *(done, verschoben 5.8.2026)*

- [x] **5d · Gesetzes-UX & Darstellungs-Reglement** *(GESETZES-UX, `[OF]`, eigener Worktree; Auftrag David 4.7.)*:
  <!-- @meta id: W2·5d · status: done · of: ja · blocker: null · dep: [] · kollision: [src/pages/gesetz-leser/parts.tsx, src/pages/gesetz-leser/inhalt.tsx, src/components/normtext/ArtikelBody.tsx, src/lib/normtext/register.ts, src/components/suche, scripts/normtext] · seq-hart: [QS-PERF(ArtikelBody.tsx)] · worktree: ja · 26x: nein · fahrplan: fahrplaene/FAHRPLAN-GESETZES-UX.md -->
  **Detail (Spec wörtlich, inkl. Nachzug-Wellen A19–A25/A29–A40, IA-Reihe §11, eId-Reihe §12):** [FAHRPLAN-GESETZES-UX.md](fahrplaene/FAHRPLAN-GESETZES-UX.md) §16.


# Umschichtung 7.8.2026 — erledigte Schritte aus dem Steuerungsplan

(QS-SELBSTOPT-Abschluss-Session; Session-Karte in STRUKTUR.md bzw. archiv/STRUKTUR-SESSIONKARTEN.md.)

## QS-SELBSTOPT — Selbstoptimierender Bau — eine ganze Session, ergebnisoffen *(done, verschoben 7.8.2026)*

- [x] **`QS-SELBSTOPT` · Selbstoptimierender Bau — eine ganze Session, ergebnisoffen** *(Anlass: Auftrag David 5.8.2026 «wie kriegen wir es hin, dass sich der Bau von selbst optimiert? … insgesamt als eigener schritt. eine ganze session soll der selbstoptimierung gewidmet sein. dabei ist sie offen. … ziel: jeder bau soll besser sein als der vorherige in sachen sicherheit, tokenverbrauch etc.»; Recherche mit Quellen und drei bewussten Absagen: [selbstoptimierender-bau-2026-08-05.md](bibliothek/recherche/selbstoptimierender-bau-2026-08-05.md))* — Die Session entscheidet selbst, was den Bau am meisten verbessert; empfohlener Pfad (Fahrplan-§): erst **messen** (generierte Zeitreihe: Tor-Rot je `check:*`, CI-Raten aus der nativen Actions-API, Rework-/Flaky-Beobachtung, Rückfall-Zähler je Lehren-F-Klasse, Anzeige im Lagebild), dann **deuten** (manuelles `retro:17`, Entwurfs-Vorschläge). **Gleichwertiger Auftrag ist die ENT-Regulierung** (David 5.8.2026: «nicht überregulieren, keine unnötigen Sicherungen, die Bauzeit kosten»): je Regel/Sicherung das Anthropic-Löschkriterium («würde das Fehlen einen realen Fehler verursachen? sonst streichen») und die Zeitreihe als Streich-Beleg (Tor seit Geburt nie rot + kostet Laufzeit = Kandidat; vorher Provenienz klären, Chesterton's Fence). Harte Grenzen bleiben: kein Fremddienst (§5) · kein Automat, der Planänderungen selbst beschliesst (§17: Automatisieren zuletzt; Hebung nur mit David-Entscheid) · Rechtslogik/Engines/Korpus nie selbstoptimierend (§1/§2/§7) · Fitness-Signale nur deterministisch, nie LLM-Urteil (Beleg: Reward-Hacking 0.94 vs. wahre 0.20, Runde 2 der Recherche). **Detail:** [FAHRPLAN-PLAN-STEUERUNG.md](fahrplaene/FAHRPLAN-PLAN-STEUERUNG.md) § «Selbstoptimierender Bau».
  <!-- @meta id: QS-SELBSTOPT · status: done · of: ja · blocker: null · dep: [] · kollision: [scripts/plan, scripts/gate.sh, scripts/check-parallel.ts, messwerte] · worktree: ja · 26x: nein · groesse: M · fahrplan: fahrplaene/FAHRPLAN-PLAN-STEUERUNG.md -->

## QS-ENTREG-KONFIG — Vorbereitete Konfig-Entlastungen *(done, verschoben 7.8.2026)*

- [x] **`QS-ENTREG-KONFIG` · Vorbereitete Konfig-Entlastungen — Anwendung/Commit nur durch David** *(Anlass: Ent-Regulierung QS-SELBSTOPT 7.8.2026. **ERLEDIGT 7.8. abends:** alle vier Posten angewandt und gelandet — a per David-cp `de3d7fa0c`, b+c per David-Commit `464e00986`, d aktiviert in ~/.zshrc; Details im Dossier-Pflegeabschnitt)* — Posten: (a) `gate-stopp.py` Grün-Fingerabdruck — fertige Vorschlagsdatei `scripts/hooks-vorschlag-gate-stopp.py` (Stop-Hook misst ~36–38 s und feuert nach jeder Antwort; Fingerabdruck überspringt nur bereits grün geprüfte identische Zustände, null Schutzverlust), Anwendung per `cp` laut Datei-Kopf; (b) `tor-schutz.py`-Präzisions-Patch (angewandt, Probe a–g); (c) CLAUDE.md §16 Kurzform (angewandt); (d) Token-Messung aktivieren: `OTEL_METRICS_EXPORTER=prometheus` in Davids Claude-Code-Umgebung setzen, damit der Sammler das lokale `tokens`-Feld füllen kann (kein Fremddienst). **Detail:** [entregulierung-2026-08-07.md](bibliothek/betrieb/entregulierung-2026-08-07.md).
  <!-- @meta id: QS-ENTREG-KONFIG · status: done · of: ja · blocker: null · dep: [] · kollision: [.claude/hooks, CLAUDE.md] · worktree: nein · 26x: nein · groesse: S -->

## QS-DISPATCH-P0-PRUEF — Dispatch-§0-Prüfvariante für read-only-Klassen *(done, verschoben 7.8.2026)*

- [x] **`QS-DISPATCH-P0-PRUEF` · Dispatch-§0 bekommt eine Prüf-Variante für read-only-Klassen** *(Anlass: Ent-Regulierung QS-SELBSTOPT 7.8.2026 — pruefung/recherche-Agenten tragen heute inapplikable Bau-Pflichten (Commits, Sonden, Merge-Verbot) im direkten Widerspruch zu ihrem eigenen read-only-TABU, ~150 Token je Prüf-Dispatch)* — Variant-Fähigkeit in Generator (`scripts/dispatch.ts`, `dispatch:agents`), `dispatch-schutz.py` UND `check:dispatch-klausel` (zweiter Sollwert, sonst wird der Byte-Gleichheits-Wächter zur Attrappe); übernommene Ziffern im Wortlaut unverändert, nur Inapplikables weglassen; Wächter einmal rot zeigen (§6.7). Blockiert, weil der Umbau die Pflichtklausel-Durchsetzung selbst berührt — Freigabe durch David. **Detail:** [entregulierung-2026-08-07.md](bibliothek/betrieb/entregulierung-2026-08-07.md).
  <!-- @meta id: QS-DISPATCH-P0-PRUEF · status: done · of: ja · blocker: null · dep: [] · kollision: [scripts/dispatch.ts, scripts/check-dispatch-klausel.ts, .claude/agents] · worktree: ja · 26x: nein · groesse: M -->

## Intake-Prosa Code-Inventur 4.8.2026 *(erledigt, verschoben 7.8.2026 — QS-CODE-Reihe komplett gelandet 4./5.8., beide David-Fragen beantwortet)*

**§14-Intake 4.8.2026 (Code-Inventur — drei read-only Analysen der Logik-, Darstellungs- und
Pipeline-Schicht auf Auftrag David, «denk gross»).** Befunde mit Belegen:
[code-inventur-2026-08-04.md](bibliothek/betrieb/code-inventur-2026-08-04.md) · Bau-Specs:
[FAHRPLAN-CODE-VERBESSERUNG.md](fahrplaene/FAHRPLAN-CODE-VERBESSERUNG.md) (§6 dort = Verortungs-
Register der Befunde, die in bestehende Schritte geflossen sind; die zwei David-Fragen aus §7 sind
am 4.8.2026 beantwortet: Manifest-Nullzeilen gewollt · `normalisiereTarifText`-Freigabe bestätigt
und in `DESIGN-REGLEMENT-NORMTEXT.md` §1 gehoben).

# Umschichtung 8.8.2026 — erledigte Schritte aus dem Steuerungsplan

(Aufräum-Session nach `struktur-rotieren.py --check` rot [ROADMAP.md 104.8 KB > 100 KB];
Wortlaut unverändert übernommen, Ausführungs-Protokoll Ziff. 6.)

## QS-E2E-TEMPO — CI-Wartezeit pro Push senken: Shard-Packung nach CI-Messwerten erneuert *(done, verschoben 8.8.2026)*

- [x] **`QS-E2E-TEMPO` · CI-Wartezeit pro Push senken: Shard-Packung nach CI-Messwerten erneuert** *(Anlass: Auftrag David 7.8.2026 «Prüfstrasse beschleunigen» — Messung der letzten 8 grünen Läufe: 7 von 8 e2e-Gruppen ~5–7 min, Gruppe 1 konsistent 9–16 min; die dokumentierte Neu-Pack-Schwelle der Packung vom 3.8. [Max-Gruppe >~7 min] war gerissen)* — **Gebaut 8.8. (inline, kein Fahrplan):** LPT-Neu-Packung aus den Report-Artefakten von Lauf 31220026058 (71 Specs, 38.4 min Summe) → sieben Gruppen je ~3.9 min, `leser-r1-r2` solo (11.5 min, unteilbar auf Datei-Ebene; sein Erstversuch-Flake-Befund → `QS-E2E-STABIL`, Wurzel-Fläche `W2·10-UI-NAV`). Union-Wächter grün, reine Verteilung (§6.3), `Gegenpruefung: n/a`. **Verbleibende Hebel, bewusst NICHT gebaut:** (a) grösster Hebel ist der r1-r2-Wurzel-Fix (≈ −4 min/Lauf), liegt auf fremder wip-Fläche; (b) Rüstzeit der Shards (~4 min: npm ci + Chromium) via node_modules-Cache; (c) `needs: bau`-Entkopplung der Shards — b/c erst prüfen, wenn a gelandet ist.
  <!-- @meta id: QS-E2E-TEMPO · status: done · of: ja · blocker: null · dep: [] · kollision: [e2e/shard-gruppen.json] · worktree: nein · 26x: nein · groesse: S -->

## QS-GP-BEREICH — `gegenpruefung:ok --bereich A..B` + `check:gegenpruefung` prüft auch `origin/main..HEAD` *(done, verschoben 8.8.2026)*

- [x] **`QS-GP-BEREICH` · `gegenpruefung:ok --bereich A..B` + `check:gegenpruefung` prüft auch `origin/main..HEAD`** *(Anlass: drei Hand-Hash-Quittungen an einem Tag — 3.8.2026 —, weil das Tor nur den Working Tree sieht; committete Branch-Arbeit muss heute per Hand-Hash quittiert werden. 2. Anlass 7.8.2026, W2·10-UI-NAV-V: vierte Hand-Hash-Quittung, und eine falsche «kein Risikopfad»-Bau-Aussage blieb lokal unbemerkt, weil das Tor nach dem Commit nicht mehr scheitern kann — das kurzlebige Duplikat `QS-GP-COMMITDIFF` vom 7.8. ist hier fusioniert, Detail §3.7→§3.1)* — Tor-Code ohne Inhaltsänderung; **Scheiterns-Fähigkeit einmal rot zeigen** (§6.7). **Detail:** [FAHRPLAN-LERNPHASE-2026.md](fahrplaene/FAHRPLAN-LERNPHASE-2026.md) §3.1.
  <!-- @meta id: QS-GP-BEREICH · status: done · of: ja · blocker: null · dep: [] · kollision: [scripts/gegenpruefung-ok.ts, scripts/check-gegenpruefung.ts, scripts/gegenpruefung/kern.ts] · worktree: ja · 26x: nein · groesse: M · fahrplan: fahrplaene/FAHRPLAN-LERNPHASE-2026.md -->

## W2·10-UI-NAV-S — UI-NAV-S · Suche-Rest (S1 + S6) *(done, verschoben 8.8.2026)*

  - [x] **UI-NAV-S · Suche-Rest (S1 + S6)** — Query-Durchreichung `?q=` in die Browse-Pages + mobiler Such-Fokusmodus (≥16 px gegen iOS-Zoom). §2.
    <!-- @meta id: W2·10-UI-NAV-S · status: done · of: ja · blocker: null · dep: [] · kollision: [src/lib/universalSuche.ts, src/components/suche, src/components/layout/HeaderSuche.tsx] · worktree: ja · 26x: nein · groesse: M · fahrplan: fahrplaene/FAHRPLAN-UI-NAVIGATION.md -->

## W2·10-UI-NAV-V — UI-NAV-V · Verzahnung ohne Reader-Fläche (V2 + V4 + V6) *(done, verschoben 8.8.2026)*

  - [x] **UI-NAV-V · Verzahnung ohne Reader-Fläche (V2 + V4 + V6)** — Hover-Trigger am bestehenden NormPopover · NormChip-`href` intern (Cmd-Klick landet intern) · Vorlage↔Rechner-Kreuzlinks. §3.
    <!-- @meta id: W2·10-UI-NAV-V · status: done · of: ja · blocker: null · dep: [] · kollision: [src/components/NormPopover.tsx, src/lib/vorlagen] · worktree: ja · 26x: nein · groesse: M · fahrplan: fahrplaene/FAHRPLAN-UI-NAVIGATION.md -->

## W2·10-UI-NAV-J — UI-NAV-J · Rechtsprechungs-Seiten (J1 + J2 + J4) *(done, verschoben 8.8.2026)*

  - [x] **UI-NAV-J · Rechtsprechungs-Seiten (J1 + J2 + J4)** — Browse-Liste mit Batching und Band-Sprungleiste · Mobil-Filter als Bottom-Sheet · «Neues vom Bundesgericht»-Karten. **Grenze zu `W2·6-UEBERSICHT` (gleiche Seite!):** hier die **Darstellung** der Liste (Batching, Sprungleiste, Sheet), dort die **Korpus-Breite** dahinter (SG-Regeste-Rest, Facetten-Umfang, Kantons-Ausweitung). Wer zuerst baut, macht den Kollisions-Precheck. §6.
    <!-- @meta id: W2·10-UI-NAV-J · status: done · of: ja · blocker: null · dep: [] · kollision: [src/pages/Rechtsprechung.tsx, src/components/rechtsprechung] · worktree: ja · 26x: nein · groesse: M · fahrplan: fahrplaene/FAHRPLAN-UI-NAVIGATION.md -->

## W2·10-UI-NAV-O — UI-NAV-O · Übersichten und Sidebar (O2 + O4 + O5) *(done, verschoben 8.8.2026)*

  - [x] **UI-NAV-O · Übersichten und Sidebar (O2 + O4 + O5)** — Sidebar-Konsistenz · Kantons-Einstieg mit Abdeckung vor dem Klick · Scope-Labels der lokalen Suchfelder; alle drei S. §6.
    <!-- @meta id: W2·10-UI-NAV-O · status: done · of: ja · blocker: null · dep: [] · kollision: [src/components/layout/Sidebar.tsx, src/pages/Gesetze.tsx] · worktree: ja · 26x: nein · groesse: M · fahrplan: fahrplaene/FAHRPLAN-UI-NAVIGATION.md -->

## QS-E2E-STABIL — datierte ✅-Teilerfolge *(Schritt bleibt OFFEN; Prosa verschoben 8.8.2026)*

Konvention 22.7.2026: datierte Teilerfolgs-Prosa aus einem noch offenen Schritt wandert
wörtlich hierher, im Plan bleibt ein ✅-Einzeiler mit Pointer. Wortlaut wie am 8.8.2026
in `ROADMAP.md` gestanden:

- [ ] **`QS-E2E-STABIL` · Lokale e2e-/Test-Budgets an gemessene Streuung binden** *(Anlass 3./4.8.: BS-640.100-axe 60 s lokal, suche.test.ts-Hook-Timeout. **7.8., #461:** Stall-Wurzel GEFIXT — a11y-Defekt zugeklappter TOC-Äste — samt Druck-Budget + CI-Eindämmung [maxFailures 3, 25-min-Deckel, Traces]. Restkern: Budgets an 4 Stellen CI/lokal gegabelt → Budget-Modul `e2e/helpers/`; norm-sprung-Forensik offen, Verdacht 9,5-MB-Register → QS-PERF. **8.8., QS-E2E-TEMPO-Messung:** `leser-r1-r2` — alle 7 R1-Suche-Fälle scheitern im CI SYSTEMATISCH im Erstversuch [Lauf 31220026058: 687 s statt ~456 s grün]. **Wurzel-KORREKTUR 8.8. nachts [Messung, Branch `feat/w2-10-ui-nav-leser-suche`, Commit 0b482aebe]:** die Vermutung «Leser-Suche rendert alle Treffer-Artikel» ist WIDERLEGT [Suchmodus rendert 282 statt 1686 Knoten; fill→Leiste ≤5 s selbst bei 20×-Drossel]. Echte CI-Signatur: Fehler ist «element not found» — der Suchmodus wird NIE betreten, und es trifft ausnahmslos den ZWEITEN schweren OR-Reader im selben Chromium-Worker [jeder grüne Retry = frischer Worker]; lokal bis 20×-Drossel nicht reproduzierbar, braucht die CI-Umgebung. Nächster Schritt: CI-Forensik [trace:'on' für diese Datei bzw. Experiment Worker-Neustart je Test], KEIN UI-Bau ins Blaue und weiterhin NICHT per Timeout maskieren; Nebenbefund Erst-Render OR-Leser [12,5 s bei 20×, 83 % Long-Tasks] → `QS-PERF`-Fläche)* — keine CI-Änderung. **Detail:** [FAHRPLAN-LERNPHASE-2026.md](fahrplaene/FAHRPLAN-LERNPHASE-2026.md) §3.4.

## W2·5d-Residuum — abgelöste Plan-Fassung aufgelöst *(verschoben 8.8.2026)*

Der erledigte Elter `5d` stand seit der Übernahme 5.8.2026 nur noch als Pointer-Zeile im Plan —
die Form der **abgelösten** Fassung (Ziff. 6 verlangt: im Plan bleibt nichts). Aufgelöst, das
offene `L-3` ist auf die Ebene gehoben. Wortlaut wie am 8.8.2026 in `ROADMAP.md` gestanden:

- [x] **5d · Gesetzes-UX & Darstellungs-Reglement** — erledigt, verschoben in `ROADMAP-CHRONIK.md` § «Übernahme 5.8.2026».
  - [~] **A24** (L-1+L-2+L-3): Linien-Reparatur, Auto-Default-Umkehr ZGB/OR (Umkehr
    #161, David freigegeben); L-4 entfällt. V2 §2 F4.
    - [ ] **L-3** (Auto-Default-Umkehr): weiterhin **hinter David/Council-Gate** —
      NICHT in feat/v2-l1-l2 gebaut. V2 §2 F4.

## W2·7-VZUI — datierte ✅-Teilerfolge *(Schritt bleibt OFFEN; Prosa verschoben 8.8.2026)*

Konvention 22.7.2026. Die Kopfzeile trug die Teilerfolge und nannte die offenen Punkte doppelt
(Kopf + Prosa darunter); im Plan bleibt der ✅-Einzeiler, die Offen-Nennung nur noch einmal.
Wortlaut wie am 8.8.2026 in `ROADMAP.md` gestanden:

- [ ] **7-VZUI · Verzahnung sichtbar machen** *(David-Auftrag 3.7.2026; reine UI auf vorhandenen Daten)* — **V1a ✅ 3.7. · V1c ✅ 4.7. · V1b ✅ 4.7.2026 GEBAUT** · **offen: V2 (E3-Serving) · V3 (E6a)**:

## Streichung 8.8.2026 — `QS-COCKPIT` (nie gebaut)

- **`QS-COCKPIT` · Lagebild wird Steuerpult (Klick «Bau starten» öffnet die Session)** — auf
  Davids Auftrag am 8.8.2026 als Schritt angelegt (lokaler 127.0.0.1-Server, `/bau`-Endpunkt,
  osascript→Terminal→`claude`) und **~30 Minuten später auf Davids Entscheid gestrichen**
  (Wortlaut: «machen wir das nicht … das Lagebild mit Prompt kopieren ist ausreichend»), noch
  vor der ersten Bau-Zeile. Rückstände vollständig entfernt (Schritt, @queue-Rang 3, Inventar);
  einzige Spuren sind die Commits `249556afc`/`f09980ed9` und dieser Eintrag. Falls der Wunsch
  wiederkommt: Das Design stand im Schritt-Wortlaut (Commit `249556afc`).

# Umschichtung 8.8.2026, zweite Welle — QS-SKILL-DIAET-Abschluss

## QS-SKILL-DIAET — Landungs-Prozeduren: vier Skills auf zwei konsolidieren *(done, verschoben 8.8.2026)*

- [x] **`QS-SKILL-DIAET` · Landungs-Prozeduren: vier Skills auf zwei konsolidieren** *(Entscheid David 7.8.2026 nach Überregulierungs-Frage; bauschritt-D/E, landung, deploy-check, aufraeumen regeln denselben Übergang vierfach, ~1500 Z.)* — kein Regelverlust, Löschkriterium je Zeile; Grundsatz seither: neue Regeln nur als Tor/Hook, nie als Prosa. **Zugleich baut die Konsolidierung den leichten Pfad ein (Entscheid David 8.8.2026, Entstückelung):** für sortenreine Nicht-Risiko-Fix-Batches ein verkürzter Session-Zyklus (kurzer Einstieg: plan-Stand + wip; kurzer Abschluss: eine Karten-Zeile) — die Tore laufen in beiden Pfaden identisch, verschlankt wird nur Prozedur-Prosa. **Und sie kodifiziert die Weiterbau-Regel (Entscheid David 8.8.2026):** Nach gelandetem Schritt baut eine tragfähige Session automatisch weiter — (a) selbe Dach-Checkliste, (b) sonst oberster ready-Schritt gleicher Risikoklasse im selben Wirkungsbereich, (c) sonst Abschluss; je Weiterbau wip + volle Sorgfalt + eigener Trailer, Schluss bevor der Kontext zur Neige geht (bis zur Diät-Landung trägt der generierte Bau-Prompt die Regel als Ziff. 7). **Detail:** [entregulierung-2026-08-07.md](bibliothek/betrieb/entregulierung-2026-08-07.md).
  <!-- @meta id: QS-SKILL-DIAET · status: done · of: ja · blocker: null · dep: [] · kollision: [.claude/skills] · worktree: nein · 26x: nein · groesse: M -->

*Umsetzung: PR #468 (Merge f14c1f25a, 8.8.2026) — Konsolidierungs-Protokoll mit Zeilen-Konkordanz: `bibliothek/betrieb/skill-diaet-2026-08-08.md`; Gegenprüfung (Opus, high): bestanden unter vier Auflagen, alle umgesetzt.*

## QS-CONFIDENCE-EHRLICH — Confidence-Prüfung bekommt einen echten Exit-Code *(done, verschoben 8.8.2026)*

- [x] **`QS-CONFIDENCE-EHRLICH` · Confidence-Prüfung bekommt einen echten Exit-Code** *(Ent-Regulierung 7.8.2026: `check:`-Präfix, kann nie rot werden, ist aber Pflichtschritt der Kantons-Pipeline — §6.7 an einem Risikopfad-Werkzeug)* — echter Exit ODER `report:`-Umbenennung mit Nachzug (~14 Referenzen); Gegenprüfungs-Skill beachten. **Detail:** [entregulierung-2026-08-07.md](bibliothek/betrieb/entregulierung-2026-08-07.md).
  <!-- @meta id: QS-CONFIDENCE-EHRLICH · status: done · of: ja · blocker: null · dep: [] · kollision: [package.json, scripts/normtext] · worktree: ja · 26x: nein · groesse: S -->

*Umsetzung: PR #469 (Merge 48f0ec29d, 8.8.2026) — gewählt wurde die `report:`-Umbenennung (Präzedenz check:tot → report:tot): Quarantäne ist erwarteter Normalzustand, ein erzwungener Exit-Code wäre dauer-rot oder bräuchte eine erfundene Schwellen-Politik. Dateiname bleibt als grep-Anker. Gegenprüfung (Opus, high): bestanden; 4 Doku-Befunde in Folge-Commit 5b681a964 adressiert.*

## QS-AUDIT-VERWEISE — Reglement-Audit 7.8.: Konkordanzen, zwei Tore, Restpunkte *(done, verschoben 8.8.2026)*

- [x] **`QS-AUDIT-VERWEISE` · Reglement-Audit 7.8.: Konkordanzen, zwei Tore, Restpunkte** *(Dach-Schritt mit Checkliste seit 8.8.2026 — Entstückelungs-Schnitt der L-Einheit; PR #460; Punkte 1+7, §16/§17, Präambel am 7.8. in QS-SELBSTOPT erledigt; landung-Merge-Politik-Altstand am 8.8. in QS-SKILL-DIAET versöhnt)* — sortenrein checklisten-weise abarbeiten, alles Nicht-Risiko; Punkt 8 der Rangfolge bleibt bei David. **Detail:** [AUDIT-CLAUDE-MD-REGLEMENT-2026-08-07.md](bibliothek/register/AUDIT-CLAUDE-MD-REGLEMENT-2026-08-07.md) § «Massnahmen-Rangfolge».
  <!-- @meta id: QS-AUDIT-VERWEISE · status: done · of: ja · blocker: null · dep: [] · kollision: [CLAUDE.md, .claude/skills, fahrplaene, eslint.config.js, .claude/hooks] · worktree: ja · 26x: nein · groesse: L -->
  - [x] §15-Konkordanz: ~111 tote §15.x-Unternummern-Verweise lösen im Skill `perf` auf (Muster: `auftrag` Ziff. 9)
  - [x] §13-Konkordanz: ~12 tote §13.x-Verweise (Ziel: DESIGN-REGLEMENT-Dach)
  - [x] §12.2-Anker-Kollision auflösen
  - [x] `fixkosten-audit-t10.md:33` bereinigen (Rest aus Rangfolge-Punkt 2)
  - [x] §6.3-Diff-Tor bauen (~30 Z., einmal rot zeigen, §6.7)
  - [x] §3-ESLint-Tor: §2-Muster auf `src/pages`+`src/components` übertragen, Bestand grandfathern, einmal rot zeigen
  - [x] CLAUDE.md-Zeilen-Budget im struktur-rotieren-Wächter (Drift ist strukturell; Ceiling-Zahl nur im Skript-Kopf)
  - [x] §10-Chesterton-Prüfung: streichen mit Nummern-Sperre (§16-Muster) oder Anlass benennen

*Umsetzung: PR #470 (Merge 791dee94e, 8.8.2026), alle 8 Positionen in einer Session (Dach-Schnitt am selben Tag). Neu: check:testtreue (§6.3) · §3-ESLint-Regel · CLAUDE.md-Budget im Wächter · Konkordanzen §15/§13/§12.2. §17-Wurzel-Fix: bindeCheckbox × Dach-Checklisten (plan:set toggelte falsche Checkbox). Gegenprüfung Konkordanzen: Sonnet, bestanden. Rangfolge-Punkt 8 (Abnahme-Domäne) bleibt bei David.*

# Umschichtung 13.8.2026 — drei erledigte Schritte aus dem Steuerungsplan

## W2·5k-LINIEN-KONZEPT — Linienführung tiefer Kodifikationen neu konzipieren *(done, verschoben 13.8.2026)*

- [x] **5k-LINIEN-KONZEPT · Linienführung tiefer Kodifikationen neu konzipieren** *(Anlass: Davids
  zweifaches Live-Verdikt — 12.7.2026 (A28) und 3.8.2026 nach Preview von PR #423: «eine einzige
  linie und unbrauchbar». Die EINE Auto-Guide-Linie auf der Gliederungsebene trägt bei ZGB/OR
  keine nützliche Orientierung; der Schalter-Flip wurde zweimal gebaut und zweimal am selben
  Urteil verworfen)* — **KONZEPT-Schritt, kein Bau**, **zur David-Abnahme VOR jedem Vollbau**.
  Harte Regel aus der Lehre: dieser Gegenstand wird **nie wieder über eine blosse Default-Umkehr**
  gelöst. **ENTSCHIEDEN 13.8.2026** (David, Chat, wörtlich: «ja linien ganz entfernen. 2 es
  reicht. 3 nein. 4. ok») — Variante V1 (Rückbau) gewählt, Umsetzung als
  `W2·5k-LINIEN-RUECKBAU` (unten). **Detail:**
  [FAHRPLAN-GESETZESDARSTELLUNG-V2.md](fahrplaene/FAHRPLAN-GESETZESDARSTELLUNG-V2.md) §9.2
  (Spec-Wortlaut) + §9.3 (Konzept, Varianten, Entscheid-Protokoll; Sachstand: §2, Massnahme F4
  «Liniengliederung reparieren», Posten L-3 samt Bau- und Rücknahme-Vermerk); Vorgeschichte A28:
  [FAHRPLAN-GESETZES-UX.md](fahrplaene/FAHRPLAN-GESETZES-UX.md) Ziff. 10.9.
  <!-- @meta id: W2·5k-LINIEN-KONZEPT · status: done · of: ja · blocker: null · dep: [] · kollision: [src/pages/gesetz-leser/linienAufbau.ts, scripts/check-linien-kanon.ts] · worktree: ja · 26x: nein · groesse: S · fahrplan: fahrplaene/FAHRPLAN-GESETZESDARSTELLUNG-V2.md -->

## W2·19-GLIEDERUNG — Gesetzes-Leser-Seitenleiste: Fundament neu, flüssig, selbst-zuklappend *(done, verschoben 13.8.2026)*

- [x] **19-GLIEDERUNG · Gesetzes-Leser-Seitenleiste: Fundament neu (Gliederung · Suche · Kontext), flüssig, selbst-zuklappend, schöner markiert** *(Fehlerbuch-Befunde David 8.8.2026; erweitert im Chat 8.8. auf die ganze Seitenleiste — Wortlaut, Entscheide (a)(b)(c) und drei §11-Entscheide: Spec §9-Kopf/§11)*
  <!-- @meta id: W2·19-GLIEDERUNG · status: done · of: ja · blocker: null · dep: [] · kollision: [src/pages/gesetz-leser, src/App.tsx, src/index.css, e2e] · worktree: ja · 26x: nein · groesse: L · fahrplan: fahrplaene/FAHRPLAN-W2-19-SEITENLEISTE.md -->
  **Bau-Spec:** [FAHRPLAN-W2-19-SEITENLEISTE.md](fahrplaene/FAHRPLAN-W2-19-SEITENLEISTE.md) §9
  (Ultracode-Fundament, Slices S1–S10); Diagnose: [Dossier 8.8.](bibliothek/betrieb/gliederung-perf-diagnose-2026-08-08.md).
  **Stand 9.8.2026:** S1–S7 gelandet (PRs #478/#479) · **S8 in Landung (PR #480)** · S9–S10 offen (Modi/T11/Anhang ·
  Mobile/Pane, Zonen-Komponenten, Roadmap-Nachträge inkl. Sidecar-Nachzug + SG-3849-Prüfauftrag).
  **DoD-Beleg:** Perf-Nachmessung 9.8.2026 (Datei kommt mit PR #480: bibliothek/betrieb/gliederung-perf-nachmessung-2026-08-09.md; Kernziele erreicht; Restposten als W2·18-Zeilen/David-Entscheide); LM-163 geprüft:
  Verdacht widerlegt (FAHRPLAN-UI-BEFUNDE Z. 334).

## W2·19B-KORPUS — Korpus-Nacharbeiten Gliederung (Risikopfad, aus W2·19) *(done, verschoben 13.8.2026)*

- [x] **19b · Korpus-Nacharbeiten Gliederung (Risikopfad, aus W2·19)** *(S10-Nachträge 9.8.2026)*
  <!-- @meta id: W2·19B-KORPUS · status: done · of: ja · blocker: null · dep: [] · kollision: [scripts/normtext, public/normtext] · worktree: ja · 26x: nein · groesse: M -->
  Beides Extraktions-Risikopfad ⇒ Skill `gegenpruefung` Pflicht, Merge gesperrt bis Verdikt:
  - [x] **Sidecar-Nachzug der 42 Kantonserlasse ohne Gliederungs-Sidecar** — erledigt 13.8.2026, soweit amtlich möglich: **4 von 42 nachgezogen** (LU-3870, GR-3348, VS-1413, FR-8428), Artikel-Ebene je vollständig belegt. Die übrigen 38 sind **amtlich nicht strukturiert erschliessbar**: 3 clex-Erlasse führen `structured_document_id: null` (nur PDF), 1 scheitert am neuen Fassungs-Tor (SG-2808), 9 laufen über lexfind-`tolv` (liefert `application/pdf`), 25 über kantonseigene Portale ohne Struktur-API. Negativbefunde je Familie in `bibliothek/normen/kanton-gliederung-sidecar-luecke-2026-08-13.md` — nicht erneut suchen.
  - [x] **Korpus-Prüfauftrag SG-3849** — erledigt 13.8.2026. **Annahme widerlegt:** der Erlass (GebT, sGS 821.5) ist nicht teilerfasst, er hat amtlich GAR KEINE Artikel; alle 17 «Art. N» sind Fehlextraktionen aus Verweisen auf fremde Erlasse (Stichprobe 17/17, zwei unabhängige Wege). §8-Hinweis präzisiert statt aufgelöst.
  Drei Folgebefunde aus dem Schritt — je eigener Eintrag nötig, Priorisierung offen:
  - [ ] **PDF-Pfad liest Ziffern-Tarife falsch** — die Wurzel des SG-3849-Fehlers: das generische «Art. N»-Muster greift auch in Querverweisen. Braucht eine Regel «Nr. XX.YY am Zeilenanfang». Gleicher Verdacht bei ZH-243, SG-2935, AR-1203 (Typ Ziffern-Tarif, nicht geprüft).
  - [ ] **Fassungs-Drift PDF-erfasster Kantons-Snapshots bleibt unbemerkt** (§17-Wurzel-Fix) — der `fassungsToken` ist ein Inhalts-Hash des PDF und ändert sich nicht, wenn das Portal eine neue Fassung führt. Belegt: SG-2808 hängt an Version 2808/2012, amtlich gilt 3863 seit 1.7.2026. Nötig ist ein Tor `current_version.id` ↔ Snapshot-Version; übergangsweise im Verfallsregister geführt.
  - [ ] **37 der 42 zeigen eine LEERE Leiste, keinen Artikel-Index** — die T10-Annahme «B2/B3 aus Snapshot-Labels» trägt nicht, weil keiner dieser Snapshots Randtitel führt (Dichte 0 ⇒ die Modus-Kette fällt auf `b3-leer`). Kollidiert mit Davids Vorgabe 13.8.2026 «Gliederung bis zum einzelnen Artikel sichtbar». UI-Entscheid, kein Korpus-Schritt.

*Hinweis (Rotation 13.8.2026): die drei offenen Folgebefunde am Ende dieses Blocks
(«PDF-Pfad liest Ziffern-Tarife falsch» · «Fassungs-Drift PDF-erfasster Kantons-Snapshots»
· «37 der 42 zeigen eine LEERE Leiste») sind hier nur historisch dokumentiert — als aktive
Positionen wurden sie unverändert weitergeführt: die beiden Risikopfad-Befunde unter
`W2·13-KANTONE-DATEN`, der UI-Befund (kein Korpus-Schritt) unter `W2·18-FEHLERBUCH`.*

## W2·18-FEHLERBUCH — datierte ✅-Teilerfolge *(Schritt bleibt OFFEN; Prosa verschoben 13.8.2026)*

Konvention 22.7.2026: Teilerfolgs-Prosa eines noch offenen Sammel-Schritts wandert wörtlich
in die Chronik, im Plan bleibt ein ✅-Einzeiler + Pointer. Wortlaut wie am 13.8.2026 in
`ROADMAP.md` unter `W2·18-FEHLERBUCH` gestanden:

  - [x] **Artikel-Ebene in der Gliederung — in JEDEM Erlass (David 9.8.2026 «umgekehrt», erweitert 13.8.2026):** ✅ PR #486. Der Auftrag wurde im Bau erweitert: keine Dichte-Schwelle als Aufnahme-Kriterium mehr — die Artikel sind in allen Baum-Modi die unterste Klapp-Ebene («Art. 5 — Sachtitel», sonst «Art. 5»), ausgenommen die 20 Erlasse, deren Baum über Randtitel-Blätter schon artikel-granular ist (OR/ZGB unverändert, per Unit-Test belegt). Zusätzlich fällt die frühere B3-Leerzeile: 68 Erlasse ohne Sidecar/Randtitel zeigten eine LEERE Leiste und tragen jetzt den flachen Artikel-Index (ZH-243 150 · SG-3849 607 · GE-rsg_d3_30 194 …). `gliederungsModell.ts` dabei nach §6.6 in drei Dateien geteilt (Typen · Artikel · Sektionsbaum). Nachtrag im selben PR: auch die artikel-granularen Bäume (OR/ZGB, SchKG, IPRG …) bekommen die Ebene dort, wo Artikel sonst nicht anspringbar wären — korpusweit 0 unerreichbare Artikel (vorher OR 83 · ZGB 48 · LFG 17 · KOV 8 …), ohne die Randtitel-Blätter zu doppeln. Verbleibende Ausnahme, deklariert: die 74 ZGB-Artikel der A36-Kuration.
  - [x] **a33-Zielkonflikt Auto-Aufklapp ↔ CLS-Kontrakt:** ✅ Entscheid David 9.8.2026 = Weg a (Aufklappen erst bei Scroll-Ruhe), umgesetzt in PR #480 — a33 kalt 20/20 grün (vorher 2–4/20); ~39-Zeilen-Ziel von David als überholt gestrichen («kein Wuchern genügt»). Dossier nachgeführt.
  - [x] **Baum-Fokus beim Auto-Zuklappen retten (B8, WCAG 2.4.3):** ✅ PR #486 — `retteFokusVorZuklapp` in `tocAutoZuklappen.ts`, aufgerufen vor dem `flushSync` in `inhalt-hooks.tsx`; sechs Unit-Fälle, Rot-Beweis geführt. *(W2·19-Bug-Check, zurückgestellt.)*


# Etiketten-Konsolidierung 15.8.2026 — Fusionen (BAUPLAN-UMBAU)

**14 Etiketten aufgegangen** (nicht gestrichen — jede lebt als Checklisten-Zeile in ihrem Dach
weiter, Risiko-Vermerke und Fahrplan-Zeiger wörtlich an der Zeile; Dach-`kollision` je um die
aufgenommene Fläche erweitert). Anlass: Auftrag David 15.8.2026 («eventuell schritte zusammenlegen»,
BAUPLAN-UMBAU: «alle offenen Schritte gross schneiden»); Muster der Etiketten-Konsolidierung vom
14.8.2026. Etiketten-Bestand 65 → 53 (14 aufgegangen, 2 neue Dächer). **Sortenreinheit lebt an der
Zeile, nicht am Etikett** (Korrektur 15.8. nach Gegenprüfungs-Auflage): ein Dach darf Zeilen
verschiedener Risiko-Klassen tragen — massgeblich ist, dass jede Bau-Session eine sortenreine
Teilmenge nimmt und das Gegenprüfungs-Tor pfadbasiert greift (`istRisikoPfad`); Risiko-Zeilen
tragen den `QS-GP`-Vermerk wörtlich an der Zeile. Fusion 4 überspannt zudem bewusst vier Flächen
(Welle-3-Horizont).

**Die fünf Fusionen mit Begründung:**

1. `W2·6-ADRESSEN` · `W2·6-FILTER` · `W2·6-ZNETZ` · `W2·6-UEBERSICHT` → **`W2·6`** — dieselbe Fläche
   (Rechtsprechung: `scripts/rechtsprechung`, `public/rechtsprechung`, `src/lib/rechtsprechung`);
   Risiko-Klassen GEMISCHT an den Zeilen (Korrektur 15.8.: `W2·6-ZNETZ` berührt
   `scripts/verzahnung/` und `W2·6-FILTER` `scripts/datenhaltung` — beides `istRisikoPfad`-wahr,
   `QS-GP`-Vermerk an diesen Zeilen; ADRESSEN/UEBERSICHT nicht-Risiko). Das Dach trug die vier
   ohnehin als «vier eigenständige Unterschritte». Die bisherige `dep: [W2·6-RESOLVER]` von
   `W2·6-UEBERSICHT` ist Prosa geworden («erst nach dem Resolver-Teil»).
2. `W2·6-RNAME` → **`W2·6-RESOLVER`** — beide Risikopfad Rechtsprechungs-Daten (Extraktion/
   Personendaten, `QS-GP` Pflicht), beide arbeiten am Auflösen von Rohtext gegen amtliche Register.
3. `W2·5j-TABELLEN` · `W2·6-MEHRSPRACH` → **`W2·5g-ZEIT`** — alle drei Fläche Gesetzesdaten
   (`scripts/normtext` / `public/normtext` / Gesetzes-Leser). Korrektur 15.8. (Gegenprüfungs-
   Auflage): die Fläche `scripts/normtext` ist `istRisikoPfad`-wahr — wo eine Zeile Extraktion
   berührt, gilt Gegenprüfungs-Pflicht; der `QS-GP`-Vermerk steht seit der Korrektur auch an der
   MEHRSPRACH-Zeile.
4. `W3·10` · `W3·11` · `W3·13` · `W3·14` → **`W3-AUSBAU`** (neu) — Welle-3-Horizont, vier Flächen
   (Rechner · Fedlex · Vorlagen · UI) unter einem Dach; je Zeile eine sortenreine Bau-Einheit.
   `W3·12` bleibt eigenständig (26×-Slot-Inhaber), `W3·15-RICHTER` bleibt eigenständig (blocked,
   Freigabe-Gate).
5. `QS-KORPUS-BMV` · `QS-KORPUS-SCOPE` · `QS-KORPUS-RSPR-DATUM` → **`QS-KORPUS`** (neu) — alle drei
   Korpus-Pflege, alle drei Risikopfad ⇒ Gegenprüfungs-Pflicht steht im Kopf des Dachs.

**Nachzug an den Rändern** (Regel 11, Spec-Bindung): `FAHRPLAN-ENTSCHEIDSUCHE-AUSBAU.md §8` und
`FAHRPLAN-FEDLEX-PORTFOLIO.md §20.4` nennen jetzt den bauenden Schritt (`W2·6-RESOLVER` bzw.
`QS-KORPUS`) — die Spec ist dem Etikett gefolgt, nicht umgekehrt. Die Archiv-Ausnahme
`W3·10 §P3` in `scripts/plan/specBindung.ts` ist mit dem Schritt auf `W3-AUSBAU §P3` umgeschlüsselt
(Begründung unverändert: Archiv-Fahrplan ohne §-Überschriften, seine Auflösung ist der erste
Arbeitsschritt).

*Wortlaut der aufgegangenen Schritte, wie er bis 15.8.2026 in `ROADMAP.md` stand:*

## W2·6-ADRESSEN — Gerichts-/Behörden-Adressregister *(fusioniert in W2·6, verschoben 15.8.2026)*

    - [ ] **6-ADRESSEN · Gerichts-/Behörden-Adressregister** — Lese-/Index-Schicht über die bestehenden Bestände, **kein Datenduplikat** (§5). Quelle `bibliothek/behoerden/`. §13.
      <!-- @meta id: W2·6-ADRESSEN · status: ready · blocker: null · dep: [] · kollision: [bibliothek/behoerden, src/lib/kontext.ts, src/pages/RechnerUebersicht.tsx] · worktree: ja · 26x: nein · groesse: M · fahrplan: fahrplaene/FAHRPLAN-RECHTSPRECHUNG.md -->

## W2·6-FILTER — Entscheid-Filter über die API — Richter + allgemeine Facetten *(fusioniert in W2·6, verschoben 15.8.2026)*

- [ ] **6-FILTER · Entscheid-Filter über die API — Richter + allgemeine Facetten** *(§14-Intake 20.7.2026, David — Queue-Plätze 2 und 3; **ULTRACODE freigegeben** für Teil b)*
  <!-- @meta id: W2·6-FILTER · status: ready · blocker: null · dep: [] · kollision: [api/suche.ts, scripts/datenhaltung, src/components/suche, src/lib/rechtsprechung, public/rechtsprechung] · worktree: ja · 26x: nein · groesse: L · fahrplan: fahrplaene/FAHRPLAN-ENTSCHEIDSUCHE-AUSBAU.md -->
  **Gebündelt, weil beide Teile dieselbe Bau-Fläche tragen** (Turso-Schema + `api/suche.ts` + Facetten-UI):
  Richter-Facette (aus `R-RICHTER` Block B) und die allgemeinen Entscheid-Facetten über die API.
  **Detail:** [FAHRPLAN-ENTSCHEIDSUCHE-AUSBAU.md](fahrplaene/FAHRPLAN-ENTSCHEIDSUCHE-AUSBAU.md) §7.

## W2·6-ZNETZ — Zitationsnetz: Rückwärts-Zitate + Leitentscheid-Score *(fusioniert in W2·6, verschoben 15.8.2026)*

- [ ] **6-ZNETZ · Zitationsnetz: Rückwärts-Zitate + Leitentscheid-Score** *(Ideen-Intake 20.7.2026 · Daten-Derivation, `QS-GP`)*:
  <!-- @meta id: W2·6-ZNETZ · status: ready · blocker: null · dep: [] · kollision: [scripts/verzahnung, src/lib/verzahnung, src/lib/rechtsprechung, public/rechtsprechung] · worktree: ja · 26x: nein · groesse: L · fahrplan: fahrplaene/FAHRPLAN-VERZAHNUNG-UI.md -->
  «Welche Entscheide zitieren diesen?» (Rückwärts-Kanten) + **Leitentscheid-Score**, deterministisch
  aus dem Zitat-Graph abgeleitet (§2 — kein Ranking-Modell, kein Bedeutungs-Urteil); Daten-Derivation
  ⇒ `QS-GP`. **Merkposten LM-042** («ff.»-Sammelzitate) als Auflage mitführen, kein eigener Posten.
  **Detail:** [FAHRPLAN-VERZAHNUNG-UI.md](fahrplaene/FAHRPLAN-VERZAHNUNG-UI.md) §10.

## W2·6-UEBERSICHT — Rechtsprechungs-Übersicht: P0-Rest + Korpus-Breite *(fusioniert in W2·6, verschoben 15.8.2026)*

    - [ ] **6-UEBERSICHT · Rechtsprechungs-Übersicht: P0-Rest + Korpus-Breite** — SG-Regeste-Rest und die Übersichts-/Facetten-Breite; Kantons-Ausweitung setzt den Resolver voraus (darum `dep`). §13.
      <!-- @meta id: W2·6-UEBERSICHT · status: ready · blocker: null · dep: [W2·6-RESOLVER] · kollision: [src/pages/Rechtsprechung.tsx, src/components/rechtsprechung, public/rechtsprechung/register.json] · worktree: ja · 26x: nein · groesse: L · fahrplan: fahrplaene/FAHRPLAN-RECHTSPRECHUNG.md -->

## W2·6-RNAME — Richternamen gegen den Staatskalender auflösen *(fusioniert in W2·6-RESOLVER, verschoben 15.8.2026)*

- [ ] **6-RNAME · Richternamen gegen den Staatskalender auflösen** *(§14-Intake 20.7.2026, David · **Extraktion/Personendaten — Risikopfad**, `QS-GP`)*
  <!-- @meta id: W2·6-RNAME · status: ready · blocker: null · dep: [] · kollision: [scripts/rechtsprechung, public/rechtsprechung, src/lib/rechtsprechung] · worktree: ja · 26x: nein · groesse: M · fahrplan: fahrplaene/FAHRPLAN-ENTSCHEIDSUCHE-AUSBAU.md -->
  Abgekürzte Vornamen auflösen: **«P. Kaderli» → «Kaderli Peter»**, Abgleich gegen den amtlichen
  Staatskalender. **Extraktion/Personendaten = Risikopfad** ⇒ `QS-GP` Pflicht, nie raten.
  **Detail:** [FAHRPLAN-ENTSCHEIDSUCHE-AUSBAU.md](fahrplaene/FAHRPLAN-ENTSCHEIDSUCHE-AUSBAU.md) §8.

## W2·5j-TABELLEN — Tabellen in Gesetzen lesbar machen *(fusioniert in W2·5g-ZEIT, verschoben 15.8.2026)*

- [ ] **5j-TABELLEN · Tabellen in Gesetzen lesbar machen** *(§14-Intake 20.7.2026 · Extraktion + Darstellung, `QS-GP`)* — **ENTPARKT 3.8.2026 (David).**
  <!-- @meta id: W2·5j-TABELLEN · status: ready · blocker: null · dep: [] · kollision: [scripts/normtext/adapter-pdf.ts, src/components/normtext/ArtikelBody.tsx, src/pages/gesetz-leser/inhalt.tsx] · worktree: ja · 26x: nein · groesse: M · fahrplan: fahrplaene/FAHRPLAN-GESETZES-UX.md -->
  Beispiel-Defekt `/gesetze/kanton/BS-154.810#art-29`. Extraktion = Risikopfad ⇒ `QS-GP` + golden
  byte-gleich; Zellinhalte exakt wie Quelle, mehrdeutig ⇒ Block als Text belassen (§1).
  **Grenze zu `W2·13-KANTONE-K7`** beachten (dort die PDF-Extraktion davor, hier die Darstellung).
  **Detail:** [FAHRPLAN-GESETZES-UX.md](fahrplaene/FAHRPLAN-GESETZES-UX.md) §18.

## W2·6-MEHRSPRACH — Mehrsprachiger Normvergleich DE/FR/IT *(fusioniert in W2·5g-ZEIT, verschoben 15.8.2026)*

    - [ ] **6-MEHRSPRACH · Mehrsprachiger Normvergleich DE/FR/IT** — Auslegungswerkzeug nach Art. 14 PublG: drei Sprachfassungen je Erlass + Synopse-UI; heute ist nur `de` befüllt. §13.
      <!-- @meta id: W2·6-MEHRSPRACH · status: ready · blocker: null · dep: [] · kollision: [scripts/normtext, public/normtext/bund, src/pages/gesetz-leser] · worktree: ja · 26x: nein · groesse: L · fahrplan: fahrplaene/FAHRPLAN-RECHTSPRECHUNG.md -->

## W3·10 — Neue Rechner-Klingen *(fusioniert in W3-AUSBAU, verschoben 15.8.2026)*

- [ ] **10 · Neue Rechner-Klingen** *(`[OF]`, §2/§7)* — Zustellfiktions-Engine · Gesellschafts-
  <!-- @meta id: W3·10 · status: ready · blocker: null · dep: [] · kollision: [src/lib, src/lib/startseiteConfig.ts, src/pages] · worktree: nein · 26x: nein · groesse: L · fahrplan: archiv/FAHRPLAN-PRODUKTAUSBAU-BURGGRABEN.md -->
  rechts-Schwellen (OR 727/671/653s) · IGE-Gebühren · Geltungsstand-Prüfer · Kantonale
  Gerichtsferien-Datenschicht (26×-Asset, Slot beachten). **Erster Arbeitsschritt:**
  Restpunkte-Extraktion aus `archiv/FAHRPLAN-PRODUKTAUSBAU-BURGGRABEN.md` §P3 in einen aktiven
  Fahrplan (deklarierte Archiv-Ausnahme).

## W3·11 — Gesetzgebungs-/Rechtsetzungs-Tracking *(fusioniert in W3-AUSBAU, verschoben 15.8.2026)*

- [ ] **11 · Gesetzgebungs-/Rechtsetzungs-Tracking** *(neu, amtlich)*. Übersicht «was kommt»:
  <!-- @meta id: W3·11 · status: ready · blocker: null · dep: [] · kollision: [scripts/fedlex-wiedervorlage-generieren.ts, src/lib/fedlex, public/normtext, src/pages] · worktree: nein · 26x: nein · groesse: L · fahrplan: fahrplaene/FAHRPLAN-FEDLEX-PORTFOLIO.md -->
  Rest offen: Parlamentsgeschäfte (parlament.ch), künftige-Fassungen-Drift, Übersichtsseite «alle
  laufenden Vernehmlassungen», Laufend-Badge im Reader-Kopf. Andockpunkt `fedlex.ts`/Drift-System;
  Detail `fahrplaene/FAHRPLAN-FEDLEX-PORTFOLIO.md §Paket 3`.

## W3·13 — Vorlagen-Breite *(fusioniert in W3-AUSBAU, verschoben 15.8.2026)*

- [ ] **13 · Vorlagen-Breite** *(VORLAGEN V5/V6/V8, GMBH G2, VERTRAGS-VARIANTEN P3; Worktree)*.
  <!-- @meta id: W3·13 · status: ready · blocker: null · dep: [] · kollision: [src/lib/vorlagen] · worktree: ja · 26x: nein · groesse: L · fahrplan: fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md -->
  Tiefe vor Stückzahl. GmbH qualifizierte Gründung (777c II) · Musterklagen (Bauhandwerkerpfand) ·
  Basistypen (Kauf/Fahrniskauf Art. 184 ff. dispositiv, Schenkung/Pacht/Darlehen/Bürgschaft).
  **Detail:** [FAHRPLAN-ARCHIV-RESTPUNKTE.md](fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md) §10
  (Vertrags-Varianten) + §11 (GmbH-Gründung) — W3·13 trägt beide Stränge.

## W3·14 — Multi-Pane / Split-View *(fusioniert in W3-AUSBAU, verschoben 15.8.2026)*

- [ ] **14 · Multi-Pane / Split-View** *(SPLIT-VIEW, Fundament-Umbau, eigener Worktree; Auftrag
  <!-- @meta id: W3·14 · status: ready · blocker: null · dep: [] · kollision: [src/components/layout, src/App.tsx, tailwind.config.js] · worktree: ja · 26x: nein · groesse: L · fahrplan: fahrplaene/FAHRPLAN-SPLIT-VIEW.md -->
  David 29.6.2026)*. 2–3 „Engines" nebeneinander **wie im Browser** → der **Verzahnungs-Burggraben
  sichtbar** (Gesetz | Rechner | Begründungs-Absatz). Dach-Schritt mit Checkliste; eigener Worktree (§12).
  **Detail:** [FAHRPLAN-SPLIT-VIEW.md](fahrplaene/FAHRPLAN-SPLIT-VIEW.md) §1.
  - [ ] **B3 · Scroll & Fokus pro Pane — Restposten** — offen: Scroll-POSITIONS-Wiederherstellung (`App.tsx` noch window-basiert) + Tastatur-Pane-Wechsel. §STRANG B (B-3).
  - [ ] **Bündel S** — S1 Breadcrumb-Navigation in der Pane · S2 Tracker «alles schliessen»; gebündelt bauen. §1.
  - [ ] **a11y-Restpunkte** — 3 verifizierte, bewusst zurückgestellte a11y-Kanten der Pane-Schicht. §1.

## QS-KORPUS-BMV — Geltende BMV (Totalrevision cc/2025/408) in den Korpus aufnehmen *(fusioniert in QS-KORPUS, verschoben 15.8.2026)*

- [ ] **`QS-KORPUS-BMV` · Geltende BMV (Totalrevision `cc/2025/408`) in den Korpus aufnehmen** — die seit 1.3.2026 geltende Nachfolge-Verordnung (gleiche SR 412.103.1) fehlt; Nutzer finden nur den historischen Text. **Risikopfad** ⇒ Gegenprüfung. **Detail:** [FAHRPLAN-FEDLEX-PORTFOLIO.md](fahrplaene/FAHRPLAN-FEDLEX-PORTFOLIO.md) §20.4.
  <!-- @meta id: QS-KORPUS-BMV · status: ready · blocker: null · dep: [] · kollision: [scripts/fedlex-cache.sh, public/normtext/bund, src/lib/normtext/aufhebungen.ts] · worktree: ja · 26x: nein · groesse: M · fahrplan: fahrplaene/FAHRPLAN-FEDLEX-PORTFOLIO.md -->

## QS-KORPUS-SCOPE — scope/decl-Sektionen von 12 Staatsverträgen ingestieren *(fusioniert in QS-KORPUS, verschoben 15.8.2026)*

- [ ] **`QS-KORPUS-SCOPE` · scope/decl-Sektionen von 12 Staatsverträgen ingestieren** — 23 amtliche Sektionen liegen ausserhalb des `div#annex`-Containers und fehlen im Snapshot. **Risikopfad** ⇒ Gegenprüfung; golden-Diff erwartet (neue amtliche Substanz). **Detail:** [FAHRPLAN-FEDLEX-PORTFOLIO.md](fahrplaene/FAHRPLAN-FEDLEX-PORTFOLIO.md) §19.
  <!-- @meta id: QS-KORPUS-SCOPE · status: ready · blocker: null · dep: [] · kollision: [scripts/normtext, public/normtext/bund] · worktree: ja · 26x: nein · groesse: M · fahrplan: fahrplaene/FAHRPLAN-FEDLEX-PORTFOLIO.md -->

## QS-KORPUS-RSPR-DATUM — Entscheid-Datumsfehler im Rechtsprechungs-Register bereinigen *(fusioniert in QS-KORPUS, verschoben 15.8.2026)*

- [ ] **`QS-KORPUS-RSPR-DATUM` · Entscheid-Datumsfehler im Rechtsprechungs-Register bereinigen** — `bge_151_II_475` trägt 1999 statt 2025; Datum gegen bger.ch verifizieren, in der Pipeline-Quelle korrigieren (nie im Projektions-JSON, §5), Register-Sweep nach weiteren Band/Jahr-Diskrepanzen, Projektion neu erzeugen. **Risikopfad** ⇒ Gegenprüfung. **Detail-Heimat:** [FAHRPLAN-RECHTSPRECHUNG.md](fahrplaene/FAHRPLAN-RECHTSPRECHUNG.md).
  <!-- @meta id: QS-KORPUS-RSPR-DATUM · status: ready · blocker: null · dep: [] · kollision: [scripts/rechtsprechung, public/rechtsprechung/register.json] · worktree: ja · 26x: nein · groesse: S · fahrplan: fahrplaene/FAHRPLAN-RECHTSPRECHUNG.md -->

## BAUPLAN-UMBAU — Auftrags-Wortlaut *(erledigt 15.8.2026, ✅-Prosa aus offenem `QS-EFFIZIENZ` verschoben 15.8.2026)*

· [ ] BAUPLAN-UMBAU (David 15.8., Prompt-Wortlaut: Chat-Übergabe / sinngemäss hier): Plan vereinfachen + Doku-Pflichten reduzieren (Streich-Massstab, mit Beleg) · Fahrpläne LEBENDIG machen (Mechanismus: Ist-Abweichung ⇒ Spec direkt korrigieren, datiert begründen, weiterbauen — statt gegen veraltete Spec bauen) · alle offenen Schritte gross schneiden (Massstab 15.8.) · Gesamtaufbau fundiert prüfen, erst recherchieren (auch Internet-Inspiration) dann umbauen · NACHZIEH-PFLICHT an jeder Ecke (Skills, bildSeiten/bauPrompt, check:plan, CLAUDE.md, Chronik; Regelverlust-Tore je Streichung) · Grenzen unverändert (§1, Risikopfad-Gegenprüfung, §14.7/§18, Kollisions-Sichtbarkeit erhalten)

## QS-EXTQUELLEN — Externe Quellen/APIs/Repos neu bewerten *(done, verschoben 15.8.2026)*

- [x] **`QS-EXTQUELLEN` · Externe Quellen/APIs/Repos neu bewerten** *(Anordnung David 3.8.2026)* — fertig, wenn je Befund entschieden (EINE Frage an David: kommerzieller Betrieb? entscheidet über CC-BY-NC-SA-Quelle). **Befunde:** [externe-quellen-repos-2026-08-03.md](bibliothek/recherche/externe-quellen-repos-2026-08-03.md).
  <!-- @meta id: QS-EXTQUELLEN · status: done · blocker: null · dep: [] · kollision: [bibliothek/recherche] · worktree: nein · 26x: nein · groesse: S -->

**Abschluss 15.8.2026:** alle 13 Befunde entschieden (Entscheid-Blöcke im Dossier `bibliothek/recherche/externe-quellen-repos-2026-08-03.md`, Status BEWERTET); 3 Übernahmen als Checklisten-Zeilen in `W3-AUSBAU`; die eine David-Frage (kommerzieller Betrieb? → NC-Quellen-Politik) bleibt offen, gate-t aber nichts mehr — die einzige NC-Quelle wurde unabhängig davon verworfen (keine Lizenzdatei im Repo).

## QS-CURRENCY-TESTS — Testbindung cacheBefund + Kanonik-Ausschluss *(done, verschoben 15.8.2026)*

- [x] **`QS-CURRENCY-TESTS` · Testbindung `cacheBefund` + Kanonik-Ausschluss** — beide hängen an keinem Test (§6.7). Reine Prüflogik, kein Pin wird geändert (Risikopfad-Anteil liegt in `QS-CURRENCY-KANON`). **Detail:** [FAHRPLAN-FEDLEX-PORTFOLIO.md](fahrplaene/FAHRPLAN-FEDLEX-PORTFOLIO.md) §18.2.
  <!-- @meta id: QS-CURRENCY-TESTS · status: done · blocker: null · dep: [] · kollision: [scripts/fedlex-cache.sh, src/tests] · worktree: ja · 26x: nein · groesse: S · fahrplan: fahrplaene/FAHRPLAN-FEDLEX-PORTFOLIO.md -->

**Abschluss 15.8.2026:** 15 neue Vitest-Fälle (`fedlex-cache-befund.test.ts` neu, `fedlex-wiedervorlage.test.ts` erweitert), jeder per Mutation mindestens einmal rot gezeigt (5 Mutationen), 0 Produktionscode-Zeilen, Golden 256/256 byte-gleich; FAHRPLAN-FEDLEX-PORTFOLIO §18.2 korrigiert (Bau-Fläche war fälschlich `scripts/fedlex-cache.sh`, real `src/tests/`).

# Umschichtung 17.8.2026 — erledigte Schritte aus dem Steuerungsplan (S1-Nachzug, Deckel-Rotation)

## QS-E2E-SHARD-GEN — Shard-Zuordnung in die Spec, JSON generieren *(done, verschoben 17.8.2026)*

- [x] **`QS-E2E-SHARD-GEN` · Shard-Zuordnung in die Spec, JSON generieren** — `e2e/shard-gruppen.json` ist der häufigste Merge-Konflikt-Ort. **Detail:** [FAHRPLAN-LERNPHASE-2026.md](fahrplaene/FAHRPLAN-LERNPHASE-2026.md) §3.5.
  <!-- @meta id: QS-E2E-SHARD-GEN · status: done · blocker: null · dep: [] · kollision: [e2e, scripts/e2e-shard-gruppen.mjs, .gitattributes] · worktree: ja · 26x: nein · groesse: M · fahrplan: fahrplaene/FAHRPLAN-LERNPHASE-2026.md -->

## QS-UI-HIGHLIGHT — `::highlight()`-Registry je Leser-Instanz *(done, verschoben 17.8.2026)*

- [x] **`QS-UI-HIGHLIGHT` · `::highlight()`-Registry je Leser-Instanz** — **erledigt 16.8.2026 mit `W2·5m-LESER-V3`/H2** (Buchführung je Instanz in `suchHighlight.ts`; Rot-Beweis `src/tests/suchHighlight.test.ts`, Browser-Beweis `e2e/leser-v3-highlight-split.e2e.ts`; Detail: Vollzugsvermerk H2 in `fahrplaene/FAHRPLAN-LESER-V3.md`). Rest bewusst offen: zwei ENTSCHEID-Panes teilen weiterhin eine Modul-Instanz (unverändert gegenüber dem Vorzustand). Ursprünglicher Befund: — eine Registry, drei Schreiber: im Split-View löscht das Rail-Suchfeld die Markierung des Nachbar-Panes. Reine Darstellung. **Detail:** [FAHRPLAN-UI-NAVIGATION.md](fahrplaene/FAHRPLAN-UI-NAVIGATION.md) §9.
  <!-- @meta id: QS-UI-HIGHLIGHT · status: done · blocker: null · dep: [] · kollision: [src/pages/gesetz-leser/inhalt.tsx, src/pages/entscheidLeserRegeln.ts, src/pages/EntscheidLeser.tsx] · worktree: ja · 26x: nein · groesse: M · fahrplan: fahrplaene/FAHRPLAN-UI-NAVIGATION.md -->

## QS-E2E-STABIL — Lokale e2e-/Test-Budgets an gemessene Streuung binden *(done, verschoben 17.8.2026)*

- [x] **`QS-E2E-STABIL` · Lokale e2e-/Test-Budgets an gemessene Streuung binden** — offen: (a) Budget-Modul `e2e/helpers/` statt 4 gegabelter Stellen; (b) `leser-r1-r2`-Wurzel per CI-Forensik (kein UI-Bau ins Blaue, nicht per Timeout maskieren); (c) norm-sprung/Erst-Render → `QS-PERF`. **Detail:** [FAHRPLAN-LERNPHASE-2026.md](fahrplaene/FAHRPLAN-LERNPHASE-2026.md) §3.4.
  <!-- @meta id: QS-E2E-STABIL · status: done · blocker: null · dep: [] · kollision: [playwright.config.ts, e2e/a11y.e2e.ts, scripts/datenhaltung] · worktree: ja · 26x: nein · groesse: M · fahrplan: fahrplaene/FAHRPLAN-LERNPHASE-2026.md -->

## QS-TOK-DECKEL — Root-Markdown-Deckel 22 → ~20 *(done, verschoben 17.8.2026)*

- [x] **`QS-TOK-DECKEL` · Root-Markdown-Deckel 22 → ~20** — datierte Audit-/Backlog-Dateien nach `archiv/`, Verweise nachziehen. Reine Doku. **Detail:** [FAHRPLAN-TOKEN-OEKONOMIE.md](fahrplaene/FAHRPLAN-TOKEN-OEKONOMIE.md) §11.1.
  <!-- @meta id: QS-TOK-DECKEL · status: done · blocker: null · dep: [] · kollision: [archiv] · worktree: nein · 26x: nein · groesse: S · fahrplan: fahrplaene/FAHRPLAN-TOKEN-OEKONOMIE.md -->

## QS-HOOKS-AUSBAU — Vier Hook-/Konfig-Ausbauten *(done, verschoben 17.8.2026)*

- [x] **`QS-HOOKS-AUSBAU` · Vier Hook-/Konfig-Ausbauten** — **FREIGEGEBEN David 14.8.2026** (Chat, wörtlich: «alle hooks freigegeben»; zuvor «punkt 1 freigegeben»): alle vier Punkte baubar — (1) SubagentStop-Wache §14.7 · (2) `.claude/rules`-Pfad-Scoping · (3) SessionEnd-Lehren-Check · (4) `/sandbox` prüfen. Jeder neue Wächter einmal rot zeigen (§6.7); Anwendung/Wirkung David im Ergebnis zeigen. **Detail:** [state-of-the-art-abgleich-2026-08-07.md](bibliothek/recherche/state-of-the-art-abgleich-2026-08-07.md) § «Lücken».
  <!-- @meta id: QS-HOOKS-AUSBAU · status: done · blocker: null · dep: [] · kollision: [.claude/hooks, CLAUDE.md] · worktree: nein · 26x: nein · groesse: M -->

## QS-TYP-LUECKE — Typprüfung deckt scripts/ und e2e/ nicht — 33 reale Fehler, teils Risikopfad *(done, verschoben 17.8.2026)*

- [x] **`QS-TYP-LUECKE` · Typprüfung deckt scripts/ und e2e/ nicht — 33 reale Fehler, teils Risikopfad** — Werkzeug-Analyse 14.8.2026 (Zweit-Session, verifiziert): tsc -b prüft nur src/ + vite.config; in scripts/normtext, scripts/materialien, scripts/datenhaltung liegen belegte Null-/Union-Fehler (struktur-run.ts:84/93, check-bezuege.ts:367, soft-law-snapshot.ts:118ff, abk-aliase-generieren.ts:865, masse-ingest.ts:94ff) — ein durchrutschendes undefined erzeugt stille Korpus-Lücken, die Byte-Golden nie sehen. Zu bauen: tsconfig für scripts/+e2e (references), die realen Fehler fixen (Risikopfad-Anteile mit Gegenprüfung), Tor bleibt tsc -b. Bekannt seit Juli (BACKLOG-AUDIT-WERKZEUGE-2026-07 Z. 50), war nie Plan-Schritt.
  <!-- @meta id: QS-TYP-LUECKE · status: done · blocker: null · dep: [] · kollision: [tsconfig.json, scripts/normtext, scripts/materialien, scripts/datenhaltung] · worktree: ja · 26x: nein · groesse: M -->

## W2·5h-GESETZ-UI — Gesetzes-Webseite: UX-Pass *(done, verschoben 17.8.2026)*

- [x] **5h-GESETZ-UI · Gesetzes-Webseite: UX-Pass** *(Ideen-Intake 20.7.2026 · reine UI/Darstellung)*:
  <!-- @meta id: W2·5h-GESETZ-UI · status: done · blocker: null · dep: [] · kollision: [src/pages/gesetz-leser, src/pages/GesetzLeser.tsx, src/components/normtext, src/components/suche, scripts/check-linien-kanon.ts, e2e] · worktree: ja · 26x: nein · groesse: L · fahrplan: fahrplaene/FAHRPLAN-GESETZES-UX.md -->
  **Folgeschritt aus `QS-UI`** (Davids Sequenz: erst app-weit, dann die Gesetzes-Seite): UX-Pass auf
  der Gesetzes-Webseite inkl. Kopfzeilen-Bündel — reine UI/Darstellung, amtliche Substanz unangetastet.
  **Detail:** [FAHRPLAN-GESETZES-UX.md](fahrplaene/FAHRPLAN-GESETZES-UX.md) §17.
  - [x] **Gliederungslinie im Lesetext entfernen** *(gebaut 16.8.2026, PR feat/w2-5h-gesetz-ui)* *(Entscheid David 13.8.2026: V1 «Linien ganz entfernen»)* — Rückbau der Guide-Mechanik; Übersicht trägt allein die Seitenleiste. **Deklarierte Verhaltensänderung** (§6): Vorher/Nachher-Beweis Pflicht, Linien-Kanon Teil A unberührt. [FAHRPLAN-GESETZESDARSTELLUNG-V2.md](fahrplaene/FAHRPLAN-GESETZESDARSTELLUNG-V2.md) §9.3.

# Umschichtung 21.8.2026 — Steuerdeckel-Rotation (ROADMAP.md > 100 KB)

## W2·5m-LESER-V3 — sechs datierte ✅-Teilerfolge *(Schritt bleibt OFFEN; Prosa verschoben 21.8.2026)*

Konvention 22.7.2026: datierte Teilerfolgs-Prosa aus einem noch offenen Schritt wandert
wörtlich hierher, im Plan bleibt je Teilerfolg ein ✅-Einzeiler mit Pointer. Wortlaut wie
am 21.8.2026 in `ROADMAP.md` gestanden:

  - [x] **Phase 0b · Design-Fundament** *(erledigt 16.8.2026: docs/ux-audit-2026-07/reader/leser-v3-design-grundlage.md)* — Design-Recherche (Apple-Lese-Oberflächen · Best-in-class Web-Leser · Rechtstext-Typografie + Ist-Tokens) → verdichtete Design-Grundlage (Schriftsystem, Abstandsraster, Farbrollen, Radien/Schatten, Ikonen, Bewegung) als Eingabe für V-0; Auftrag David 16.8.2026 («bevor wir bauen noch eine design recherche als fundament»). Kap. 6.
  - [x] **V-0 · Klick-Prototyp** *(gebaut 16.8.2026, docs/ux-audit-2026-07/reader/leser-v3-prototyp/; David: F3=V1, F7=A, F8=Lasche)* — statischer HTML-Prototyp mit echtem StPO-Text, drei Breiten, Variante A (Kopf mit «Ansicht ▾») / B (Kopf ohne Menü, Schalter im Panel-Reiter «Anzeige»); David entscheidet am Bild (**F7**). Kap. 6.
  - [x] **Vorprobe H1** *(erledigt 16.8.2026, PR H1; Protokoll docs/ux-audit-2026-07/reader/leser-v3-vorprobe.md — V-1/V-2 bestanden, V-3 nicht kalibrierbar: das Repo kennt keinen Feature-Flag-Präzedenzfall)* — Fassade als Schaltpunkt (`?leser=v3`), Flag-Playwright-Projekt (N-Tests laufen auch gegen V3), Nullprobe Flag-aus, Basisrate Etappen/Woche aus dem Verlauf. Kap. 6.
  - [x] **H1 Fundament** *(erledigt 16.8.2026; Kontaktbogen docs/ux-audit-2026-07/reader/leser-v3-h1/README.md — Sucheingaben im Gesetz 2 → 1, Kopf ohne `imPane`-Verzweigung, Kern byte-gleich; Tab-Titel-Parität war bereits gegeben, s. Fahrplan Kap. 12 A-3)* — Rahmen · ein Kopf (Ort · Artikel · ein Menü) · Seitenleiste mit Übersichtsbox (nicht sticky) + einem Such-/Sprungfeld + Gliederung (sticky, «alles ein-/aus», «↑ Anfang») · Tab-Titel-Parität Split-View. Kap. 7.
  - [x] **H2 Suche** *(erledigt 16.8.2026; Kontaktbogen `docs/ux-audit-2026-07/reader/leser-v3-h2/README.md` — Trefferliste als Verzeichnis mit einer Zeile je Fundstelle, Suchbereich, ✕/Esc ohne Scroll-Bewegung; Bund-Probe StPO/VMWG/LugÜ ohne Sonderpfad, CLS 0/0, axe 52 Regeln mit 3 offenen Verstössen; NM-Zahlen unverändert bzw. auf dem Handy +1 Schritt — ausgewiesen, nicht geglättet. Ästhetik-Nachzug ausgelagert nach **H2b**, Detail Fahrplan Kap. 7)* — Treffer in Erlass-Reihenfolge, gruppiert je Artikel, Suchbereich; ✕ ohne Sprung (Scroll-Position). Kap. 7.
  - [x] **S3 Erlass-Kopf + Standausweis-Wortlaut** *(gebaut 16.8.2026, Branch `feat/leser-v3-s3`; Belege docs/ux-audit-2026-07/reader/leser-v3-s3/)* — Fakten/Status/Aktionen getrennt, «gegen Fedlex-Konsolidierung geprüft am …» (**F5**; Pos. 11 geklärt: Fedlex selbst nicht konsolidiert). Kap. 7.

## Nachschub 21.8.2026 (Abend) — W2·5m-Etappen-Vollzeilen

  - [x] **H2b Ästhetik-Nachzug** ✅ vollzogen 17.8.2026 (Vollzugsvermerk Kap. 7; Ä-Reste als Positionen weitergeführt) — Ä1 (Leerzone/Krumen-Wahrheit + App-Seitenleiste eingeklappt), Ä5, Ä8, Ä9, Ä10, Ä14; Ä1 öffnet `src/components/layout/**` mit deklarierter Whitelist. Neu dazu aus dem H2-Kontaktbogen: zwei nicht unterscheidbare ✕ im Suchfeld, ellipsierender Trefferzähler, drei offene axe-Verstösse. Kap. 7.
  - [x] **H3 Rechtsprechung/Kontext** ✅ vollzogen 17.8.2026 (Kap. 7) — Seitenpanel/Sheet mit Instanz · Kanton · Zeitstrahl · Reiter Entscheide/Änderungen/Materialien; Inline nur Zähler (**F4**). Kap. 7.
  - [x] **H4 Umschalten** ✅ vollzogen 18.8.2026 (PR #552, Vermerk «H4 — DER FLIP») — V3 wird Hauptroute; Bild-Vergleich je Breite (Handy · voll · Split) als Abnahme; David-Go. Kap. 7.
  - [x] **H5 Löschung** ✅ vollzogen 21.8.2026 (dieser PR; Vollzugsvermerk Kap. 7, −4900 Zeilen) — alte Hülle raus (Streich-Massstab aufraeumen.md §3, Beweis vor Löschung), Zielzahlen Kap. 10. Kap. 7.
  - [x] **§7b-Lücken schliessen: fünf leser-v3-Testdeckungen** ✅ erledigt 21.8.2026 (PR #558 + H5-Nachbau Panel-Filter/Split) — Materialien-Panel (`e2e/materialien-m5-verzahnung.e2e.ts:25,45`) · Facetten/Zeitstrahl = ↻-Badge/Revisionsdatum (`e2e/normrevision-badge.e2e.ts:21,46`) · ★-Wortlaut/via Art. N (`e2e/verzahnung.e2e.ts:147,198`) · Erwägungs-Sprung/Popover (`e2e/verzahnung.e2e.ts:214`, `e2e/leitfaelle-chips.e2e.ts:142`) · Druck im Split (`e2e/druck-fundstellen-z2.e2e.ts:127`) — Vorbedingung H5, Beleg: zehn `test.skip`-Sperren mit `istHuellenGrund(...'H5-Auflage'...)` an den genannten Stellen (Zeilen verifiziert 21.8.2026 gegen den Ist-Stand, weichen leicht von den im Auftrag genannten Zeilen ab — §7).

# Umschichtung 29.8.2026 — erledigte Schritte aus dem Steuerungsplan

## W2·10-UI-NAV — UI-Nutzwert & Navigation *(done, verschoben 29.8.2026; Dach komplett mit Landung von J3 in PR #564, Trennungs-Nachzug PR #573)*

- [ ] **10-UI-NAV · UI-Nutzwert & Navigation (Ultracode-Synthese 11.7.)** *(`[OF]`, reine UI/Navigation)*:
  <!-- @meta id: W2·10-UI-NAV · status: done · blocker: null · dep: [] · kollision: [src/components/suche, src/lib/suche, src/lib/universalSuche.ts, src/components/layout, src/components/rechtsprechung, src/pages/Rechtsprechung.tsx, src/pages/gesetz-leser, src/pages/GesetzLeser.tsx] · worktree: ja · 26x: nein · groesse: L · fahrplan: fahrplaene/FAHRPLAN-UI-NAVIGATION.md -->
  Suche, Navigation und Auffindbarkeit über alle Oberflächen; reine Darstellungsschicht (§3).
  Offen ist nur noch **-J3**. **Detail:** [FAHRPLAN-UI-NAVIGATION.md](fahrplaene/FAHRPLAN-UI-NAVIGATION.md) §8.
  - [x] **Gesetzesübersicht nach Rechtsgebieten (Idee David 16.8.2026, dejure.org «Gesetze nach Rechtsgebieten»)** ✅ gebaut 21.8.2026 (PR folgt; nicht zu verwechseln mit W2·10-UI-NAV-J3 = Sachgebiets-Pipeline, eigener Schritt) — `/gesetze`: Erlasse je Rechtsgebiet gruppiert, dichte Spalten mit Kurztiteln als Linkliste; dieselbe Einteilung wie «Nach Sachgebiet» in der Rechtsprechung (SSoT). Reine Übersichtsseite, nach dem Leser-Umbau (W2·5m). Detail: FAHRPLAN-LESER-V3.md Kap. 14.
  - [x] **UI-NAV-J3 · Sachgebiets-Pipeline verfeinern (J3)** — **bewusst allein**, weil Risiko-Pfad: `QS-GP` Pflicht + golden byte-gleich, eigene Gegenprüfungs-Runde. §6.
    <!-- @meta id: W2·10-UI-NAV-J3 · status: done · blocker: null · dep: [] · kollision: [scripts/rechtsprechung, public/rechtsprechung/register.json, src/lib/normtext/browse.ts] · worktree: ja · 26x: nein · groesse: M · fahrplan: fahrplaene/FAHRPLAN-UI-NAVIGATION.md -->

## W2·15-CLS — Echter CLS-Defekt auf /gesetze *(done, verschoben 29.8.2026; PR #565, CLS 0.4385→0.0000, Route im Perf-Tor)*

- [x] **15-CLS · Echter CLS-Defekt auf `/gesetze` (0.109 @8× CPU)** *(§14-Intake 20.7.2026 · **Produktfehler**, reine UI)*
  <!-- @meta id: W2·15-CLS · status: done · blocker: null · dep: [] · kollision: [src/pages/Gesetze.tsx, src/components/start] · worktree: ja · 26x: nein · groesse: M · fahrplan: fahrplaene/FAHRPLAN-PERFORMANCE.md -->
  Gemessener Produktfehler auf `/gesetze`, reine UI.
  **Detail:** [FAHRPLAN-PERFORMANCE.md](fahrplaene/FAHRPLAN-PERFORMANCE.md) §2.



---

## Plan-Neuschnitt 29.8.2026 — ROADMAP nach sieben Baufeldern *(Auftrag David 29.8.2026 im Chat: «volle Handlungsfreiheit, radikal, Kontrolle abbauen wo nicht nötig»)*

**Provenienz.** Der Council-Entscheid vom 3.7.2026 gegen eine ROADMAP-Restrukturierung ist durch
diesen Auftrag ausdrücklich abgelöst. Die ROADMAP gliedert seither nach den sieben Baufeldern
(`leser` · `korpus` · `rechtsprechung` · `suche` · `design` · `werkzeuge` · `betrieb`) statt nach
Auftrags-Herkunft (Wellen/Querschnitt-Band); jeder Schritt trägt genau ein `feld:`, das zugleich die
frühere `kollision:`-Globliste ersetzt. Die @meta-Felder `kollision`, `26x`, `slot`, `groesse` und
`worktree` sind gestrichen (Begründung je Feld im Kopf von `scripts/plan/etikett.ts`), ebenso
`scripts/plan/inventar.ts` und die check:plan-Regeln 1 (Inventar-Abdeckung), 5/5b/5c (26×-Slot) und
6 (kollision-Pfade). **Alle Schritt-IDs sind unverändert** — lage.ts, Commit-Trailer und
Branch-Namen hängen daran.

**Kennzahlen:** ROADMAP.md 101 702 → 46 371 Bytes (−54 %); 43 Etiketten, unverändert; die vier
grössten Einzelzeilen (QS-EFFIZIENZ-Checkliste 6,8 KB · W2·18-Fehlerbuchliste 11,8 KB ·
QS-MONITOR-ROT-Checkliste 2,7 KB · QS-DATA-INGEST-DRIFT-Befund 1,6 KB) liegen jetzt wörtlich in
zwei neuen Fahrplänen.

### Was wohin ging — je Streichung eine Begründung

- **Leitprinzip 4 (26×-Assets) und der `@slot-kette`-Block** — gestrichen, weil die Mechanik, die
  sie trugen (`@meta`-Felder `26x`/`slot`, check.ts 5/5b/5c, zwei resolve()-Buckets), entfällt. Die
  Sache selbst bleibt: «eine Datensäule fertig führen» steht als neues Leitprinzip 4, und die
  konkrete Kette W3·12 → W2·6-DATA ist jetzt eine `dep`-Kante, die check:plan Regel 4/4c prüft.
  Wortlaut:

4. **Nie zwei 26×-Datenassets gleichzeitig offen** — eine Säule fertig führen. Die sechs 26×-Assets — **fertig gebaut + aus dem Slot entlassen**
   (Abnahme ausstehend): Notariat-Grundbuch · Beurkundungs-Ausbau (entlassen 2.7.2026); **offen,
   Reihenfolge = @slot-kette-Kommentar unten:** BGer-Massenkorpus (QS-DATA E3) · Gesetze-Import-3Tier
   (W3·12) · Prozesskosten-Cockpit (W1·4-Rest) · Kantonale-Entscheide (E5). *Ein P0-Bugfix an einem Asset ist kein Daten-Bulklauf und **öffnet den
   26×-Slot nicht**.*

<!-- @slot-kette (dokumentarisch; harte Prüfung via @meta-Feld `slot: inhaber`, check.ts 5b)
inhaber: W3·12 (Kanton-Gesetze, übergeben 20.7.2026 — E3 war seit 3.7.2026 fertig, der Slot nur nie zurückgegeben)
kette: ~~E3(W2·6-DATA) ✅ 3.7.2026~~ · W3·12(Kanton-Gesetze) ← JETZT · Tarif-Bündel(W1·4) · E5(Kanton-Rechtsprechung, W2·6-DATA) · Gerichtsferien-Matrix
begruendung-uebergabe: E3 ist gebaut (195 342 Entscheide, 2 Voll-Läufe determinismus-gleich, Gegenprüfung bestanden) ⇒ Leitprinzip 4 «eine Säule fertig führen» erfüllt. Der offene E3-**Serving**-Rest ist KEIN Massenimport, sondern hängt am David-Gate `vps-bestellung-david` — er rechtfertigt keine Slot-Bindung. Nächstes Kettenglied ist laut Kette W3·12 (Davids Reihenfolge-Entscheid 2.7.2026, `fahrplaene/FAHRPLAN-DATENHALTUNG.md` §10(1)); W1·4 wäre falsch (26x: nein — der frühere Zusatzgrund «eigener Blocker `wbqdyap3x`» ist mit der Entparkung vom 3.8.2026 entfallen).
uebergabe: nur per explizitem `plan:set <id> slot=inhaber`-Commit; check:plan erzwingt höchstens EINEN Inhaber (muss 26x: ja)
-->

- **Zwei `@blockers`-Einträge mit «ERLEDIGT»-Vermerk** (`david-go-leser-v3`, `david-freigabe-hooks-ausbau`)
  — aus dem Register entfernt, weil ihre Bindung gelöst ist und kein Schritt mehr auf sie zeigt; sie
  standen dort nur noch als Beleg. Der Beleg steht jetzt hier:

david-go-leser-v3: ERLEDIGT — Go David 16.8.2026 im Chat («go, empfehlungen übernehmen, bau den prototyp»): D-A/D-B/D-C und F1/F2/F4/F5 = Empfehlung, F6 nein, F3 + F7 entscheidet David am Prototyp (V-0). Eintrag bleibt als Beleg.
david-freigabe-hooks-ausbau: ERLEDIGT — Freigabe David 14.8.2026 im Chat («alle hooks freigegeben»); Eintrag bleibt als Beleg, Bindung ist gelöst.

- **Alle `- [x]`-Checklisten-Positionen der offenen Dach-Schritte** — aus der ROADMAP entfernt, weil
  Erledigtes nicht steuert (Ausführungs-Protokoll Ziff. 4). Wortlaut vollständig:

  - [x] **Vercel-Tageslimit durch Branch-Pushes (Vorfall 16.8.2026 abends: 100 Deployments/Tag Free gerissen — jeder Push auf jeden Branch erzeugt ein Deployment, auch «Canceled by Ignored Build Step»; Prod-Deploy von S3 (#540) 24 h blockiert)** — Wurzel-Fix gebaut 17.8.2026, Weg (b) nach Entscheid David: `vercel.json` → `git.deploymentEnabled: false` (Vercel deployt nichts mehr von selbst) + neuer CI-Job «Deploy (Prod, Vercel CLI)» in `ci.yml`, `needs: [diff, tore, bau, e2e]`, `concurrency: prod-deploy` seriell, `vercel pull`/`build`/`deploy --prebuilt --prod` mit `VERCEL_TOKEN`; `VERCEL_GIT_COMMIT_SHA: github.sha` speist `<meta name="lexmetrik-build">`, Nachkontrolle im Job (curl == Kurz-SHA, 3 Versuche) fängt «gemerged, aber nicht live» selbst. Ein Deployment entsteht jetzt je Merge auf main statt je Push. §6.7-Rot-Beweis: `workflow_dispatch` mit `probe=ohne-token` ⇒ «VERCEL_TOKEN leer». Sicherung `scripts/vercel-ignore.sh` + Tor bleiben liegen, falls Git-Deploy je wieder eingeschaltet wird.
  - [x] Wächter-Zustandsbericht + Verwaiste-Worktree-Sonde — gebaut 15.8. (`npm run bericht:automatik`, check-ci-laeufe.ts --bericht; Rot-Beweis mit synthetischem Waisen-Worktree; Spec-Schärfung: «Diff leer» allein reicht nicht, zusätzlich «nichts uncommittet»). §3.1.
  - [x] ~~Der Wächter selbst ist seit 12.8. rot: 403/bash -e~~ — Diagnose ÜBERHOLT (Befund-Korrektur 14.8.: Röte war korrektes Monitor-Urteil; 403-Lesung ist seit waechter.yml Z.118 optional mit ::warning). Rest-Wurzel offen: GITHUB_TOKEN kann Branch-Schutz strukturell nicht lesen (kein administration-Scope) ⇒ Kontext-Nachzug läuft faktisch nie — Wurzel-Fix braucht PAT-Secret (§18) oder andere Quelle für Required-Kontexte (eigener Punkt, wartet auf PLAN_BUCHUNG_TOKEN-Entscheid, gleicher PAT nutzbar).
  - [x] Paritäts-Sonde gebaut 15.8. (check-tor-paritaet.ts unterscheidet PR-Pfad vs. Wächter-Pfad; erster Lauf ROT mit exakt den 5 vorhergesagten Toren — 4 in ci.yml verdrahtet (~5 s), check:verfall begründet auf Allowlist (wanduhrabhängig, K7); neue Regel 0: Workflow ohne lesbaren on:-Block = rot). §3.5.
  - [x] Wächter-Autozug BEHIND-PRs gebaut 15.8. (waechter.yml Job `autozug`: max. 1 PR/Lauf, ältester, nur autoMergeRequest≠null ∧ BEHIND; stösst ci.yml per workflow_dispatch an, weil GITHUB_TOKEN-Pushes keine Workflows triggern — sonst «BEHIND»→«für immer blockiert»). Auswahl gegen Fixtures bewiesen; **erster LIVE-Lauf noch zu bestätigen** (Auftrag verbot PR/Merge). Fork-PRs: ::warning statt still. Code-Lupe 15.8., zwei Design-Grenzen (offen, keine Fehler): (A) BEHIND-Fälle, die erst NACH dem main-Push grün werden, wartet der Autozug bis zum Tages-Cron (Push-Lauf sieht oft noch `UNKNOWN`) — Kadenz-Entscheid ausstehend; (B) der `workflow_dispatch` von ci.yml fährt auch den Perf-Budget-Job (Lighthouse), den der PR-Pfad seit 26.7. bewusst überspringt — Rot dort blockiert den PR; ci.yml-Bedingung um `event_name != 'workflow_dispatch'` prüfen. §3.1.
  - [x] **Deploy-Automatik-Ausfall 15./16.8. behoben** (7 Merges nicht live, weil der Ignored Build Step bei `fatal: bad object` skippte) — `ignoreCommand` auf «unsicher ⇒ bauen» umgestellt (`git cat-file -e` statt `rev-parse --verify`, das bei vollem 40-Hex-SHA auch ohne Objekt Exit 0 gibt; leerer/fehlerhafter Diff ⇒ bauen), Build-Kennung `<meta name="lexmetrik-build">` in jede prerenderte Seite, Prod-Smoke-Wächter «Prod hinkt hinter main» mit 30-min-Frische-Toleranz. Rot-Beweise: Shallow-Klon-Simulation (alt Exit 0 = falsches Skip, neu Exit 1), Tor `src/tests/vercel-ignore-command.test.ts` (8 Fälle inkl. Rot-Beweis gegen den alten String), `npm run smoke:prod` gegen die Live-Site rot. **Lehre:** ein Tor, das bei Unsicherheit «skip» sagt, ist schlimmer als keines — und ein Wächter, der nur HTTP 200 prüft, sieht eine tote Auslieferungskette nicht (24 h grün über 7 nicht ausgelieferten PRs).
  - [x] Teilpass (b) Informationshierarchie 15.8.: Audit über alle Werkzeuge (14 Rechner, 6 gegatete, 4 Entscheid-Leser, 26 Vorlagen, 2 Mappen, 30 Formvorschrift-Badges) — **bereits überall konform** (seit 4.8. durch I1–I10/A9 gegatet), kein Bau; Fahrplan §2.3 nachgezogen.
  - [x] Teilpass (e) Gate-Verschärfung, erster Zug 15.8.: `qsui-hierarchie.e2e.ts` meldete falsch rot (3–6/65 unter --workers≥14 — `.lc-route` fade-in ab opacity:0, `checkVisibility` auf dem Null-Frame false); Fix `emulateMedia({reducedMotion:'reduce'})` im beforeEach (Haus-Muster a11y/hist-ansicht) — 2× 65/65 grün unter workers=16.
  - [x] **DESIGN-D0 · Deckkraft-Suffix-Klassen reparieren (Infrastruktur-Fund B4, 8.8.2026)** *(erledigt 16.8.2026)* — Tailwind-Klassen mit Opacity-Zusatz (`bg-brass-100/70` u. ä.) erzeugen am aktuellen Stand KEINE CSS-Regel und rendern unsichtbar (belegt: LM-156, unsichtbare Aktiv-Zeile der Gesetzes-Gliederung, PR #472); Repo-weiter Sweep nach betroffenen Stellen + Wurzel-Fix in `tailwind.config.js`, danach Sichtprüfung der Fundstellen. Vor D6–D8 ziehen (dieselbe Token-Fläche).
  - [x] **Phase 0b · Design-Fundament** ✅ erledigt 16.8.2026 (Chronik). Kap. 6.
  - [x] **V-0 · Klick-Prototyp** ✅ gebaut 16.8.2026 (Chronik). Kap. 6.
  - [x] **Vorprobe H1** ✅ erledigt 16.8.2026 (Chronik). Kap. 6.
  - [x] **H1 Fundament** ✅ erledigt 16.8.2026 (Chronik). Kap. 7.
  - [x] **H2 Suche** ✅ erledigt 16.8.2026 (Chronik). Kap. 7.
  - [x] **H2b Ästhetik-Nachzug** ✅ vollzogen 17.8.2026 (Chronik). Kap. 7.
  - [x] **H3 Rechtsprechung/Kontext** ✅ vollzogen 17.8.2026 (Chronik). Kap. 7.
  - [x] **H4 Umschalten** ✅ vollzogen 18.8.2026, PR #552 (Chronik). Kap. 7.
  - [x] **H5 Löschung** ✅ vollzogen 21.8.2026, PR #560, −4900 Zeilen (Chronik). Kap. 7.
  - [x] **§7b-Lücken schliessen** ✅ erledigt 21.8.2026, PR #558 + H5-Nachbau (Chronik).
  - [x] **International-Erlasse unter `/gesetze/bund/`** — gebaut 29.8.2026 (Entscheid David: ja, mit Redirects). Kanonisch `/gesetze/international/:kuerzel`, Alt leitet dauerhaft. Herleitung: `lib/normtext/erlassAdresse`. *(Befund 45.)*

- **Die Produktvisions-Sektion «So sieht das Taschenmesser aus»** — aus der ROADMAP entfernt, weil
  sie den Nordstern beschreibt und keine Reihenfolge steuert; das Leitbild steht in CLAUDE.md, die
  Informationsarchitektur in `fahrplaene/FAHRPLAN-GESAMTAUFBAU.md`. Wortlaut:

## So sieht das Taschenmesser aus (Produktvision)

**LexMetrik ist DIE EINE Anlaufplattform für alle Rechtsanwender** *(Nordstern geschärft, David
3.7.2026)* — Kanzlei, Gericht, Inhouse, **Steuerbehörden, Ämter/Verwaltung, Notariate, Treuhänder**,
Studierende — um **das Schweizer Recht zu konsultieren und damit zu arbeiten.** Ein vielseitiges
Werkzeug, zu dem man zuerst greift; **alles auf amtlichen Quellen** (Fedlex, amtliche
Entscheid-Sammlungen, amtliche Tarife/Materialien — Art. 5 URG, urheberrechtlich frei),
**deterministisch gerechnet statt KI-geschätzt.**

Die «Klingen» (= die Informationsarchitektur):

- **Konsultieren.** Gesetze (Volltext + amtliche Systematik, **mehrsprachig DE/FR/IT zum
  Vergleich**) · Rechtsprechung (BGE/BGer-Korpus, amtliche Regesten) · amtliche Materialien
  (Botschaften/BBl) · **Gesetzgebung/Rechtsetzung** (was kommt: Vernehmlassung/Parlament/AS-BBl) · **Verwaltungsverordnungen/amtliche Praxis** (Kreisschreiben ESTV/BSV/FINMA/SEM, Weisungen, Merkblätter, Rundschreiben — Etappe E6a, Detail `fahrplaene/FAHRPLAN-DATENHALTUNG.md` §5).
- **Rechnen.** Die deterministischen Klingen: Fristen · Streitwert · Prozesskosten · Verzug/
  Forderung · Zuständigkeit/Rechtsweg · Verjährung · Beurkundung · Gründungen — jeder Wert mit
  Norm + Link + Stand.
- **Verzahnen (der Burggraben).** **Norm → Werkzeug → Schriftsatz** und zurück: vom Artikel in
  den passenden Rechner/Entscheid, vom Rechen-Ergebnis in den kopierfertigen Begründungs-Absatz.
  Und quer über den ganzen Korpus: **Norm ↔ Entscheid ↔ Material ↔ Verwaltungsverordnung** — ein
  Kreisschreiben zeigt, welche Norm es auslegt; ein Entscheid, welchen Artikel er anwendet; eine
  Botschaft hängt am Gesetz; von jedem Artikel zu allem, was ihn betrifft, und zurück. **Dieselbe
  Graph-Struktur, nicht vier Silos — das Organisationsprinzip des gesamten Datenausbaus**
  (Architektur `fahrplaene/FAHRPLAN-DATENHALTUNG.md` §0/§0bis/§1; Etappen E4/E5/E6), nicht nur der Rechner-Achse.
- **Finden (der Griff).** Eine Auffindbarkeits-Schicht: zweiachsiger Einstieg (Rechtsgebiet ×
  Aufgabe) + globale Suche → die richtige Klinge in einem Klick.

Universell, nicht in Personas-Schubladen: dieselben Klingen dienen allen; einzig die Verpackung
(Einstiege, Erklär-/Übungs-Layer) variiert. **Geparkt:** Dossier-/Mandatsverwaltung — alle
Werkzeuge bleiben **strikt zustandslos** (rechnen/drucken/ICS, keine Persistenz von Falldaten).

**Verzahnung als Rückgrat (Organisationsprinzip, kein Einzelfeature):** die tragenden Schritte dieses
Plans sind Glieder EINES Graphen (Norm ↔ Entscheid ↔ Material ↔ VerwVO) — das kann kein einzelnes
Amtsportal, darum ist die Verzahnung Burggraben UND das Einsortierungs-Kriterium für neue Schritte
(§14: neue Doktypen docken an den Graphen an, nie als Silo). *Ehrliche Grenze: Plan-Doktrin, kein
maschinelles Tor.* Glieder-Aufzählung und Code-Bestands-Inventar (kontext.ts/KontextPanel/norm-index):
`fahrplaene/FAHRPLAN-DATENHALTUNG.md` §0bis.

- **Detail-WIE offener Schritte** — nicht gestrichen, sondern in die Fahrpläne verschoben, wo die
  ROADMAP nur noch Ziel und Grenze nennt (Zielform: Checkbox + @meta + 2–4 Zeilen):
  - `QS-EFFIZIENZ`-Checkliste → neu `fahrplaene/FAHRPLAN-EFFIZIENZ-CHECKLISTE.md` §1. Die
    Auslagerung war als Posten in der Liste selbst vermerkt (Merge-Konflikt-Falle: 6 Konflikte in
    EINER Zeile bei 15 offenen PRs, 16.8.2026) — hier vollzogen.
  - `QS-KORPUS`, `QS-MONITOR-ROT`, `QS-DATA-INGEST-DRIFT`, `W2·18-FEHLERBUCH`, `QS-CODE-PROP` →
    neu `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md` §§1–5. Diese fünf Dach-Schritte hatten als einzige
    keinen eigenen Fahrplan und trugen ihre Befundlisten deshalb im Plan.
  - `QS-PERF`-Messreihe (Erst-Render OR, Reader-Kopf-Reflow) → `fahrplaene/FAHRPLAN-PERFORMANCE.md`
    §1. Wortlaut dort unverändert; in der ROADMAP bleibt der Ein-Satz-Befund mit der Zahl.

- **Nicht angetastet:** alle Schritt-IDs, die `@queue`, der `⬆ OBERSTER OFFENER SCHRITT`-Marker,
  das `@blockers`-Register (bis auf die zwei erledigten Einträge), der `@david-fragen`-Block,
  Geparkt-Liste, Pflege & Termine.

### Was die Auslagerung NICHT ist

Kein Inhalt wurde gekürzt, zusammengefasst oder «nachgeführt». Datierte Mess- und
Reproduktionsangaben stehen in den Zieldateien wörtlich wie zuvor (§0 Ziff. 2b: Belege altern
nicht). Was hier als «gestrichen» geführt ist, steht in diesem Abschnitt vollständig im Wortlaut.

---

## 31.8.2026 — Blocker `zeitreihe-5-snapshots` erfüllt, nicht gestrichen

Der Blocker band `QS-AUTOPILOT-STUFE1` (David-Freigabe 7.8.2026, «stufe 1 ja») an die
Mindestdatenlage «≥ 5 Snapshots in `messwerte/selbstopt-zeitreihe.json`». Die Bedingung ist
**erfüllt**: `npm run retro:17` meldet am 31.8.2026 selbst *«Quellen: messwerte/selbstopt-zeitreihe.json
(14 Snapshots) · ROADMAP-CHRONIK.md · Letzte Erhebung: 2026-08-29»* — 14 statt der geforderten 5,
also auch über der Schwelle `MIN_SNAPSHOTS = 5`, ab der die Regel «nie rot» überhaupt auswertet.

Der Registereintrag wird darum aus `@blockers` entfernt und `QS-AUTOPILOT-STUFE1` von
`blocked` auf `wip` gesetzt. Das ist **kein Wegfall der Bedingung** (§0 Ziff. 2b — Belege altern
nicht): die Bedingung galt und gilt, sie ist bloss eingetreten. Wer die Zeitreihe künftig
zurücksetzt, hat wieder einen Blocker, nicht eine erledigte Frage.

---

## Ent-Regulierung Runde 2 / Batch A — e2e-Diät *(31.8.2026, Anker `QS-EFFIZIENZ`)*

**Auftrag:** David, Ent-Regulierung Runde 2 (`bibliothek/betrieb/entregulierung-2026-08-07.md`
§Runde 2; Startbedingung «17 Token-Spool-Messpunkte» erfüllt). **Beweisgrundlage für jede Zeile
unten:** `bibliothek/betrieb/testapparat-fang-historie-2026-08-31.md` — dort auch der Kernbefund,
der die Zurückhaltung erklärt: es gibt **kein Fehlerbuch, das Fänge Tests zuordnet**, in 116 Specs
ist genau EIN e2e-Fang belegt. Jeder Rückbau hier ist deshalb indiziengestützt und fällt im
Zweifel gegen die Streichung aus.

**Zahlen** (beide Stände mit `npx playwright test --list` gezählt, Basis `337d2c9ef`):
Spec-Dateien **116 → 111** · Fälle **718 → 716** — die beiden Wegfälle sind bewiesene Duplikate,
sonst kein Fall verloren. Zeilen in `e2e/` netto −417 allein durch die
`fehlerSammeln`-Zusammenführung. Beweislauf: 57 Fälle über alle berührten Specs lokal grün
(`--workers=1`, `vite preview` aus dist/, 2.3 min).

### Was gestrichen wurde — je Streichung eine Begründung

- **`e2e/leser-gliederung-kein-overflow.e2e.ts`** — entfällt 31.8.2026: wortlautgleich in
  `e2e/leser-kein-ueberlauf.e2e.ts` aufgegangen (dort Teil 2), alle drei Fälle erhalten. Beide
  Specs messen dieselbe Zusage — im Leser läuft nichts quer — auf zwei Ebenen (Seite / TOC-Scroller).
  `topbar-kein-ueberlauf-320.e2e.ts` ist NICHT aufgenommen: sie misst den App-Streifen @320 und
  schliesst die übrige Seite ausdrücklich aus (PR #567). Fang-Historie §7 Ziff. 4.
- **`e2e/leser-kopf-g2b.e2e.ts`** · **`e2e/leser-v3-h4-kopfwege.e2e.ts`** ·
  **`e2e/leser-kopf-a9.e2e.ts`** · **`e2e/leser-kopf-paritaet.e2e.ts`** — entfallen 31.8.2026 als
  eigene Dateien: vollständig in `e2e/leser-v3-kopf.e2e.ts` aufgegangen (22 Fälle, Gruppe 1),
  Datei-Köpfe wörtlich übernommen. Kein Fall gestrichen. Fang-Historie §3 Kandidat 2.
- **`e2e/leser-v3-kopf-buendig.e2e.ts`** — entfällt 31.8.2026: in `e2e/leser-v3-kopfzeile.e2e.ts`
  aufgegangen (mit `leser-v3-eine-kopfzeile`, 16 Fälle, Gruppe 6). Kein Fall gestrichen.
- **Zwei Testfälle in `e2e/leser-marken-geometrie.e2e.ts`** (Ä61 «V1», Ä62 «StGB V1») — gestrichen
  31.8.2026 als BEWIESENE DUPLIKATE, nicht als Rückbau: seit der V1-Löschung (H5, 21.8.2026) liest
  der Produktcode `?leser=v3` nicht mehr, die «V1»-Adressen waren damit zeichenweise dieselben wie
  die V3-Adressen daneben. Beide liefen `test.slow()` auf OR bzw. StGB. Fang-Historie §7 Ziff. 1.
- **67 lokale Kopien von `function fehlerSammeln`** — gestrichen 31.8.2026 zugunsten von
  `e2e/helpers/fehlerSammeln.ts` (§5). Kein Testfall berührt. Eine deklarierte Abweichung: die
  Sonderfassung in `leser-kopf-a9` ist aufgegangen, geändert hat sich allein der WORTLAUT der
  Fehlermeldung im Rot-Fall, nie die geprüfte Bedingung (`toEqual([])`).
- **Der tote Query-Parameter `?leser=v3`** — aus 108 URL-Literalen in 35 Specs entfernt.
  Produktcode-Beweis: `src/pages/GesetzLeser.tsx` rendert bedingungslos `LeserRahmenV3`, kein
  `leser=`-Switch, kein `v2`-Verzeichnis (Stand `337d2c9ef`). Die elf Split-Adressen
  `?leser=v3&p=…` bleiben — dort ist er nicht der einzige Query-Teil.
- **Eine `eslint-disable no-console`-Zeile in `leser-kopf-cls-s3`** — gestrichen 31.8.2026: sie
  meldete sich selbst als «Unused eslint-disable directive», die Regel greift unter `e2e/` gar
  nicht. Ausnahme von einer Regel, die nicht gilt.

### Was NICHT gestrichen wurde, obwohl der Auftrag es vorsah (§7-Abweichungen)

- **`e2e/leser-kopf-v2.e2e.ts`** — der Auftrag führte sie als «V2-Erbe, streichen». WIDERLEGT: «V2»
  ist die Fahrplan-Etappe GESETZESDARSTELLUNG-V2, nicht die Leser-Hülle; alle vier Fälle prüfen den
  ausgelieferten V3-Stand, B-1 greift `[data-v3-panel]`. Bleibt vollständig, mit Warn-Vermerk im
  Kopf gegen die Wiederkehr der Fehl-Lesung.
- **`e2e/leser-kopf-paritaet.e2e.ts`** — geführt als «Paritäts-Zweck V2↔V3 entfällt ohne V2».
  WIDERLEGT: geprüft wird die PANE-Parität (Einzelansicht ↔ primäres ↔ sekundäres Pane), eine reine
  V3-Eigenschaft. Der Fall lebt unverändert als Teil 4 in `leser-v3-kopf.e2e.ts`, ebenfalls mit
  Warn-Vermerk.
- **`check:inventur`-Reste** — es gibt keine. `package.json` kennt nur noch `report:inventur`; der
  repo-weite Sweep trifft `check:inventur` ausschliesslich in datierten Artefakten (`archiv/`,
  `messwerte/selbstopt-zeitreihe.json`, `bibliothek/register/AUDIT-TORE-2026-07-20.md`), die nach
  §0 Ziff. 2b nicht nachgeführt werden. Der Rückbau war mit `8c544a9fd` bereits vollständig.
- **Kein Zusammenlegen auf EINE Kopf-Datei.** CI fährt `workers: 1` je Shard, die Wandzeit ist also
  die schwerste Gruppen-Summe. Gemessen (lokal, kalt, `--workers=1`, dist/): die sechs Kopf-Specs
  kosten zusammen 87 s; alle in eine Gruppe zu legen hätte eine Gruppe um 87 s beladen. Statt
  dessen zwei Dateien in den beiden leichtesten Gruppen (1 und 6); Gruppe 8 (die schwerste,
  267 s laut Lastprobe 18.8.) wird um 28 s ENTLASTET, Gruppe 4 um 35 s. Gegenprobe nach dem Umbau:
  50.3 + 36.1 = 86.4 s gegen 87.0 s vorher — Zusammenlegen spart keine Laufzeit, nur Regelfläche.

### Prozess-Lehre, verankert

`.claude/skills/bauschritt/aufraeumen.md` §3 trägt neu die **Fang-Vermerk-Pflicht**: wer einen
Defekt fixt, den ein Test oder Tor gefangen hat, schreibt der Chronik-/Fehlerbuch-Zeile den Fänger
zu. Ohne Fang-Protokoll bleibt jeder spätere Rückbau Indizienarbeit — genau die Lage, in der dieser
Batch gearbeitet hat.
---

## Ent-Regulierung Runde 2 / Batch B — Steuerungs-Selbsttests *(31.8.2026, Anker `QS-EFFIZIENZ`)*

19 Testdateien → 9, ein Fall gestrichen.

Ent-Regulierung Runde 2, **Batch B** (Auftrag David; Anker `QS-EFFIZIENZ`, Feld `betrieb`).
Beweisgrundlage: `bibliothek/betrieb/testapparat-fang-historie-2026-08-31.md` §3 Kandidat 1
(«22 Unit-Dateien, 511 Tests, 0 Rechtsbezug, kaum belegte Fänge»).

**Abgrenzung des Bestands (Befund, §7 — die Zahl des Dossiers trägt so nicht).** Der Kandidat
nennt 22 Dateien / 511 Fälle. Am Ist-Stand `bc8930d0f` sind es **19 Dateien / 463 Fälle**. Die
Differenz sind Dateien, die zwar `scripts/**` importieren, aber Rechtsdaten prüfen und darum
unter das Tabu von §4 desselben Dossiers fallen: `komparator-totalitaet` (Rechtsprechungs-
Ordnungen), `leitfall-shards`, `snapshot-walker`, `golden-kanton-merge`,
`golden-voll-lauf-merge`, `mehrspaltig-sha`. Sie sind **nicht angefasst**. Der Dossier-Wert
wird dadurch nicht nachgeführt, sondern ergänzt (§0 Ziff. 2b).

**Zusammengelegt — eine Datei je Werkzeug-Strang statt einer je Funktion.**

| neu | aus | Fälle |
|---|---|---|
| `plan-lesen.test.ts` | `plan-parse` + `plan-etikett` + `plan-dump` + `plan-next` | 43 |
| `plan-schreiben.test.ts` | `plan-set` + `plan-buchung` | 67 |
| `plan-check.test.ts` | `plan-check` + `plan-spec-bindung` (Regel 11 ist eine Regel von `pruefe`) | 71 |
| `plan-lage.test.ts` | `plan-lage` + `plan-retro17` | 48 |
| `steuerwerkzeuge.test.ts` | `fahrplanSlice` + `dispatch-klausel` + `check-testtreue` + `ci-diff-klassieren` | 64 |
| `hooks-wache.test.ts` | `hooks-wache` + `hook-mcp-deckung` | 30 |

Unverändert: `plan-selbstopt` (59), `plan-bild-lage` (61), `vercel-ignore-command` (19) — jede
für sich unter der §6.6-Schwelle nicht zusammenlegbar, ohne sie zu reissen.

**Streichliste — genau ein Fall.** Ein maschineller Rumpf-Vergleich über alle 463 Fälle
(normalisiert, kommentarfrei) fand **null dateiübergreifende Duplikate** und zwei
Verdachtsfälle innerhalb einer Datei. Einer davon war ein Artefakt der Normalisierung
(`parseStatusTrailer('  ready  ')` prüft genau die Leerzeichen, die der Vergleich wegwarf) und
bleibt. Gestrichen wurde:

- `plan-set.test.ts` → «`[d]` + parked bleibt `[d]` (Bewahrung unangetastet)». **Begründung:**
  wörtlich rumpfgleich mit «parked → parked erhält die Legendenmarke `[d]`» (Fund R2-9/R2-15) —
  dieselbe Eingabe, dieselbe Erwartung, kein eigener Fehlerklassen-Bezug. Beide eingefrorenen
  Vorfälle überleben: R2-9/R2-15 im verbliebenen Zwilling, die R3-2-Gegenprobe im Fall
  «`[D]` + blocked bleibt `[D]`» desselben Blocks. Die Streichung ist am Fundort vermerkt.

**Erhalten, weil vorfalls-einfrierend** (nicht abschliessend): Fund 26 (Mehrwort-§-Zeiger),
Fund 27 + R2-9/R2-15 + R3-2 (Legendenmarke `[d]`), Fund R2-1/R2-10 (Checkbox-Bindung über
Prosa), Fund R2-3 (`plan:dump` ohne `checkbox`-Feld), Fund 4/5 (bare Fahrplan-Dateinamen),
Regeln 8/8.3/9/10 von `check:plan`, Regel 11 samt Geburtsbeweis `d316f5884` und der
Wortgrenzen-Prüfung nach CLAUDE.md §7, Befund B3 der Dispatch-Gegenprüfung 7.8.2026,
B1-1/B1-3 (Trailer-Footer/Codeblöcke), die Matcher-Falle vom 15.8.2026 (Literal- statt
Regex-Matcher, `deploy-schutz` konnte nie feuern), die Hook-Auflagen B1–B7/B10/B11,
PR #519/#531 (Vercel-`ignoreCommand`, sieben Prod-Deployments gingen nie live), PR #530
(`done` räumt die `@queue`), die §6.3-Grenzfälle von `check:testtreue` und die
Auftrags-Testmatrix von `ci-diff-klassieren`.

**Verhaltens-Beweis.** `npx vitest run` über die 19 Alt-Dateien: **463/463 grün**. Über die
9 neuen Dateien: **463/463 grün** (byte-gleiche Fallmenge, reiner Datei-Umbau), nach der
Streichung **462/462 grün**. Abgleich 463 − 1 = 462 geht ohne stillen Verlust auf.

**Was das spart — und was nicht (§8).** Dateien −53 % (19 → 9). Zeilen **+88** (4625 → 4713,
gemessen gegen `origin/main`): sechs Herkunfts-Köpfe, achtzehn Banner und der Streich-Vermerk
kosten mehr, als die vereinigten Import-Zeilen
sparen. Das ist kein Fehlschlag der Massnahme, sondern ihr ehrlicher Preis — die
Kommentar-Köpfe SIND der Schutz (§17: eine Lehre, die nur im Chat existiert, gilt als nicht
gezogen), und sie zu kürzen hätte genau das eingespart, was zu erhalten war. CI-Zeit spart
der Umbau erwartungsgemäss nicht: die 19 Dateien liefen zusammen unter 1 s (Dossier §1 —
alle 5661 Unit-Fälle kosten 138 s, der Kostenhebel ist e2e). Der Gewinn liegt allein in der
Regelfläche: wer künftig ein Plan-Werkzeug ändert, öffnet eine Datei statt vier.

# Umschichtung 5.9.2026 — erledigte Schritte aus dem Steuerungsplan (Deckel-Rotation, W2·23/W2·24)

## SEO-BASIS *(done, verschoben 5.9.2026)*

- [x] **Auffindbarkeits-Basis: Sitemap + Search Console (kein SEO-Ausbau)** *(`SEO-BASIS`, Entscheid David D5, 3.9.2026)*
  <!-- @meta id: SEO-BASIS · status: done · blocker: null · dep: [] · feld: betrieb · fahrplan: fahrplaene/FAHRPLAN-SEO-A11Y-GOVERNANCE.md -->
  Ziel: Das Repo hat heute keine Sitemap — Suchmaschinen sehen die prerenderten Seiten nur, soweit sie
  sie zufällig finden. **Nullbefund 4.9.2026: falsch — Sitemap existiert seit 11.6.2026 (`scripts/prerender.ts`,
  8280 URLs, Drift-Check, Prod-Smoke); technisch erledigt, offen nur Search-Console-Verifikation (David).** Ein deterministischer Generator aus dem Prerender-Manifest, dazu `robots.txt`
  und die Search-Console-Verifikation durch David. Grenze: **kein SEO-Ausbau** — `SEO-A11Y` bleibt
  geparkt, hier entsteht nur die technische Basis.
  **Detail:** [FAHRPLAN-SEO-A11Y-GOVERNANCE.md](fahrplaene/FAHRPLAN-SEO-A11Y-GOVERNANCE.md) §12.

## QS-AUTOPILOT-STUFE1 *(done, verschoben 5.9.2026)*

- [x] **Vorschlags-Autopilot (Entwurfs-PRs aus der Messreihe)** *(`QS-AUTOPILOT-STUFE1`)*
  <!-- @meta id: QS-AUTOPILOT-STUFE1 · status: done · blocker: null · dep: [] · feld: betrieb · fahrplan: fahrplaene/FAHRPLAN-PLAN-STEUERUNG.md -->
  David: «stufe 1 ja», gebunden an ≥ 5 Snapshots; Stufe 2/3 NICHT freigegeben. Cron fährt `retro:17`,
  eröffnet Entwurfs-PR, kein Auto-Merge.
  **Detail:** [FAHRPLAN-PLAN-STEUERUNG.md](fahrplaene/FAHRPLAN-PLAN-STEUERUNG.md) § «Selbstoptimierender Bau».


# Umschichtung 6.9.2026 — erledigte Zeilen aus dem Steuerungsplan

## W2·13-KANTONE — Kantonale Gesetze — Darstellung & Suche *(verschoben 6.9.2026)*

  - [x] **K-1 · Reader-Treue P0** *(F24/F25/F28/F33/F29-Display/F5)* — ✅ 31.8.2026: F24 dokumentlinear (4 Erlasse inkl. Bund/KKV), F25 pathname-Decode (3 GL-Schlüssel geheilt), F5 fr/it (+38 Erlasse); F28/F33 waren seit 18.8. gebaut, F29 gegenstandslos (0 `*`-Vorkommen). §1-A + Ist-Stand-Block Fahrplan §2.

  - [x] **K-2 · §8-Ehrlichkeit UI** *(F26-UI/F37/F44/F27-Rest)* — ✅ 31.8.2026: «Geltung ungeprüft» (interaktiv + prerendert, lebt-Gate), «Stand unbekannt», Kanton-Leerzustände der Panels, Systematik-Hinweis; F44 war seit K-2c gebaut. §1-A.

  - [x] **K-3 · Suche: Kanton-Treffer auf die richtige Ebene** *(F35/F36)* — ✅ 31.8.2026: Edge-DTO additiv um ebene/kanton, Href + Kanton-Marke, Ebenen-Routing via Kantonskürzel-Regel (heilt auch chipZiel & Co.); Betriebs-Vorbehalt: Live-Turso braucht Spalten aus PR #313 (nach Merge geprüft). §1-A.

  - [x] **K-5 · NormText-Verweise Kanton** *(F41 → F40 → F42)* — ✅ 31.8.2026: F41 (199 falsche Self-Links gesperrt, 0 nachher), F40 (3267 §-Links in 464 Erlassen), Bund byte-unverändert; F42 entfällt nach Messung (<1 % Ertrag, Falschlink-Risiko). §1-A.

  - [x] **K-11 · Kanton-Reader-Performance profilieren** *(F32)* — ✅ 31.8.2026 NUR gemessen: 50-s-Symptom nicht reproduzierbar, Blocker beziffert (753-KB-Register je Leserseite u. a.), Wächter-Route im Lighthouse-Tor, Dossier `bibliothek/seo/kanton-reader-profil-2026-08-31.md`; Fixes = eigener Schritt mit §15-Bewertung. §1-A.


## W2·7-VZUI — Verzahnung sichtbar machen *(verschoben 6.9.2026)*

  - [x] **«Grundzustand ohne Zusatz-Fetch» ehrlich gemacht** *(31.8.2026; §13-Weg 2, Weg 1 gegenstandslos)* — nachgemessen: das §15-Versprechen ist am Ist-Stand **strenger** eingelöst als der Kommentar behauptete, nur an anderer Stelle. Die Ladeweiche ist das Panel-Gate (`usePanelBezuege`/`jeGeoeffnet`), nicht `istErweitert` (deren einziger Konsument ist der Hinweistext in `BezugFacettenWahl.tsx:106`); der schlanke `norm-index`-Shard wird im Gesetz-Leser seit H3/H4 gar nicht mehr geholt — der §13-Befund «beide Shards unterwegs» ist mit der V3-Hülle entfallen. Korrigiert: vier falsche Zusagen, darunter **ein sichtbarer Nutzertext** («steht am Artikel als eigene Linie … gezeigt werden fünf, ein Klick lädt die nächsten fünf» / «Weitere Instanzen laden zusätzliche Daten nach» — es gibt weder Artikel-Linie noch Fünferportion noch Nachladen). Tor statt Prosa: `e2e/leser-v3-prerender-bezuege.e2e.ts` bewacht jetzt **beide** Shard-Familien (rot gesehen 31.8.).

  - [x] **Ankunfts-Sprung `?norm=` nutzt beide Fundstellen-Regeln** *(Auftrag David 30.8.2026)* — `ankunftsAnker` (`src/pages/entscheidLeserRegeln.ts`): Fedlex-Fundstelle, sonst erste wörtliche Nennung; e2e-Deckung des SPLIT-Wegs neu (`e2e/split-erwaegungssprung.e2e.ts`). Gemessen über alle 75 365 Kanten: 46.6 % → 48.8 % (Bund 54.3 → 55.3 %, **Kanton 0.0 → 9.1 %**).

  - [x] **Panel-Reiter fachlich sauber geschnitten — vierter Reiter «Anwendung»** *(31.8.2026)* — die Behörden-Ressourcen (`kontextSoftLaw`) und die «Passenden Werkzeuge» hatten seit H3 keinen Ort mehr: sie gehören nicht in «Materialien» (dort steht die Entstehung), waren im V3-Panel aber ersatzlos entfallen. Neu `v3/PanelAnwendung.tsx` mit zwei Abschnitten (Behörden-Praxis · Werkzeuge) hinter demselben Panel-Gate wie die anderen Reiter. Bestand gemessen statt geraten: ARG = beide Abschnitte · DBG = nur Behörden-Praxis (Werkzeug-Karten geplant ⇒ §8-ausgeblendet) · OR = 15 artikelscharfe Gruppen, kein Kanten-Shard. Reiter-Leiste @1440 nachgemessen: 385 px in 350 px ⇒ 35 px Scrollweg (der Fall, für den H4-II sie scrollbar gemacht hat); @390 passt sie ganz. e2e `leser-v3-panel-anwendung.e2e.ts` (5 Fälle, 4× rot gesehen).


## W2·22-VERWEIS-FEDLEX — Amtlicher Fedlex-Zitatgraph: Erlass-Verweise ohne Artikelnummer + Warn-Bericht + «zitiert von» (Bund) *(verschoben 6.9.2026)*

  - [x] **Z1 Erlass-Verweis ohne Artikelnummer verlinken** («richten sich nach der ZPO», «des
    Datenschutzgesetzes vom 25. September 2020», «Bucheffektengesetzes vom 3. Oktober 2008 (BEG)»)
    in `src/lib/fedlex/erkennung.ts`/`positivliste.ts`/`parser.ts`; Erlassdatums-Prüfung wie Form B;
    Inventar `messwerte/verweis-inventar.json` neu messen; Gegenprüfung Pflicht. (#628)

  - [x] **Z2 Build-Zeit-Artefakt `messwerte/fedlex-zitatgraph.json`** — je gepinnter Consolidation
    `jolux:Citation` mit gebundenem `citationToRs` (Sprache DEU, Count-Gate, Content-Type-Prüfung
    am SPARQL-Endpoint wegen Soft-200), Skript `scripts/fedlex-zitatgraph.ts`. (#627)

  - [x] **Z3 Warn-Bericht** «Fedlex kennt Erlass-Verweis, Leser verlinkt nicht» (kein hartes Tor;
    Fussnoten-Rauschen dokumentiert). (#627)

  - [x] **Z5 Ausgeschriebene Artikelverweise («Artikel N Absatz M KÜRZEL») verlinken** — Anlass
    Z3-Klasse A (824 amtlich belegte Kanten): das Ziel war erkannt (N2 Form A), der Link aber nur
    unterdrückt. Neue reine Funktion `ausgeschriebeneVerweiseImText` (`src/lib/fedlex/spannen.ts`),
    additiv in `normVerweiseImText`; Guards Self · Form B · A10-Plural · Zeit-Kante ·
    `KUERZEL_NUR_BUND` (kantonale Doppelbedeutung «StG»). +4166 Links, Klasse A 824 → 0,
    Stichprobe 15/15. Gegenprüfung Pflicht.


## W2·13-KANTONE-DATEN — Kantonale Gesetze — Daten & Extraktion *(verschoben 6.9.2026)*

  - [x] **ZH-Tranche Stufe 2 · Fix-Runde nach Gegenprüfung** *(Fahrplan §4)* — ✅ 31.8.2026: Die adversariale Gegenprüfung hat die Kern-Tranche **widerlegt** (stiller Textverlust in fünf Klassen). Alle Wurzeln an der Roh-Geometrie der 24 amtlichen PDF diagnostiziert und behoben: B-2 (Fussnoten-Ziffer als Absatznummer), B-3 (ein «§» im Fliesstext beendete den Artikel — 26 Stellen), B-4 (Wortverschmelzung), B-5 (60 aufgehobene eIds gerettet), B-6 (Änderungsapparat im letzten §), B-9 (erfundenes Kürzel «AnwG»), E1 (leerer Einleitungssatz vor Tarif-Tabellen), E2-H1 (Art.-Zählweise), E2-H4 (`stand` aus dem Publikationsdatum). **B-1 falsifiziert** (der Bestand trug 1771 lit.-Positionen; der Befund zählte im falschen Feld). **Neuer Fund**, in der Gegenprüfung nicht enthalten: der hochgestellte lat. Suffix ging verloren — ZH-230 §§ 174bis/183bis/183ter/183quater fehlten ganz. Korpus 2371 → 2573 Einträge; abgeschnittene Blöcke 13 → 0, fehlende Leerzeichen 826 → 0, Apparat-Blöcke 43 → 0. Neues Tor `check:zh-vollstaendigkeit` (unabhängige Zweitlesung derselben PDF; Rot-Beweis 14/23 rot, danach 24/24 grün). Rückbau: `entglueZhTarif()` gestrichen (zerschnitt 60+ amtliche Abkürzungen). **Re-Bless** der drei Bestands-Erlasse 211.11/215.3/243 deklariert — fachliche Abnahme steht aus.

  - [x] **ZH-Tranche Stufe 2b · Fix-Runde 2 nach der zweiten Gegenprüfung** *(Fahrplan §4)* — ✅ 31.8.2026: Die zweite adversariale Gegenprüfung hat den Stand der Fix-Runde 1 erneut **widerlegt**; die Befundnummern B-1…B-6 dieser Runde sind eine EIGENE Zählung (nicht die der Runde 1). Behoben, jede Wurzel an der Roh-Geometrie aller 24 amtlichen PDF gemessen: **B-1** Absätze mit lat. Suffix («2bis») kommen aus pdfjs als EIN Fragment und wurden als Fliesstext in den Vorgänger-Absatz geschoben — 0 → **6 Blöcke** (ZH-101 Art. 104, ZH-631.1 § 7 + §§ 30/35/47); **B-2** Sammel-Aufhebungsköpfe «§§ 66–69.» klebten am Vorgänger-§ und die genannten §§ fehlten ersatzlos — Erkennung jetzt GEOMETRISCH am hängenden Kopf-Einzug von 14.2 pt (gemessen an 2376 Kopfzeilen), 38 Köpfe, **215 «Aufgehoben»-Platzhalter**, ZH-230 172 → 313 Einträge; **B-3** Gliederungstitel im Normtext 103 → 0 Blöcke; **B-4** das Tor teilte die blinden Flecken des Geprüften (Common Mode) — vier neue Prüfungen (§§-Sammelköpfe · Suffix-Absätze je § · Gliederungstitel · **Werte-Wächter inkl. `mehrspaltig`-Zellen**), jede einmal rot gezeigt, u. a. gegen die Mutation «Grundgebühr 1 050 → 1 060»; **B-5** erste Staffelzeile ohne Spaltentrennung (ZH-211.11 § 4 **und** ZH-215.3 § 4); **B-6** die bewusste Auslassung (Übergangs-/Schlussapparat, PBG-Anhang) ist jetzt maschinenlesbar ausgewiesen — neues Artefakt `public/normtext/kanton-luecken.json`, 15 Erlasse (ZH-700.1: 11 % der Textzeilen). Korpus **2573 → 2788 Einträge** (215 neu, 0 entfallen, 163 geändert, je Erlass im Commit-Body deklariert). `lexmetrik-golden.json` byte-gleich, `src/data/tarif/**` unberührt; `check:zh-vollstaendigkeit` 24/24 grün, `check:normtext-netz` ZH-Drift 0. Neues Modul `scripts/normtext/zh-sammelkopf.ts` (§6.6: splitten statt Baseline mitwachsen lassen). **Fachliche Abnahme steht aus.**

  - [x] **ZH-Tranche Stufe 2c · Fix-Runde 3 nach der dritten Gegenprüfung (zwei Linsen)** *(Fahrplan §4-R3)* — ✅ 31.8.2026: Beide Linsen (Extraktion + Tor-Härte) lauteten «noch nicht bestanden»; der gebündelte Restkatalog ist gebaut. **A1** Die Wurzel der arabisch nummerierten Gliederungstitel ist die **Schrift**, nicht die Position: von 504 Zeilen der Form «N. Text» im Gesamtbestand stehen 34 in reiner Titel-Schrift (ausnahmslos Überschriften), 470 tragen Body-Schrift (ausnahmslos Aufzählungen) — der Einzug trennt die Klassen nicht. Gegenprobe: alle 524 Zeilen der bereits bewährten Gliederungs-Muster stehen ebenfalls in Titel-Schrift, 0 Ausreisser. **33 Leck-Blöcke → 0**, 0 Einträge entfallen (Wort-Multimengen je § geprüft). **A2** Die Synthese «(vgl. Ziff. …)» steht in KEINEM amtlichen PDF — jetzt eigenes Feld `verweis {etikett, ziffern}` mit am Spaltenkopf GELESENEM Etikett; 32 → 0, und die zwei zuvor kollabierten Quell-Spalten bleiben unterscheidbar. Zweite geprüfte Synthese: der Spaltentitel «Zuschlag» steht nicht im PDF (jetzt leer). **A3** Ziffern-Aufzählungen werden `items` (drei Wächter gegen Fehltreffer), aufgehobene Ziffern als Platzhalter statt «1. 2. 3. 4.»-Prosa. **A4** Lücken-Index deklariert ALLE Schnitte (ZH-700.1: Übergangsapparat 110 + Anhang 381 Zeilen) und weist ZH-243 nicht länger fälschlich als Lücke aus. **A5** «7 von 24» war eine Fehlzählung — gemessen 11 von 24. **B (Tor-Härtung 2):** die elf Mutationen der Zweitlinse sind jetzt **alle rot** — neue Prüfungen: Zahlenfolge je §-Region positionsgebunden und beidseitig (fängt Wertetausch, den keine Multimenge sieht), Zeichen-Deckungsgrad je § (Schranke 90 %, gemessener Bestands-Tiefstwert 95.9 %), Anhang-Punkt-Ziffern beidseitig (118 von 150 ZH-243-Einträgen waren von KEINER Kopf-Prüfung erfasst), Erfindungs-Klasse, vier Trennstrich-Codepoints, lit.-Deckung EXAKT je § (0 Abweichungen in 2656 §§, keine Ausnahme) — dabei zwei echte Defekte gefunden: die nackte, aufgehobene lit.-Marke klebte am Vorgänger-item. **C:** Roh-PDF-Cache `daten/pdf-cache-zh/` (O1) und `fassungsToken` = sha256 der **Quell-Bytes** statt der Extraktion (vorher blind für Quell-Änderungen in verworfenen Teilen — bei ZH-700.1 14 % der Textzeilen); deklarierter Token-Reset aller 24, `check:normtext-netz` danach Drift 0. Korpus 2788 → 2788 Einträge, 99 sha geändert (alle ZH, 0 Nicht-ZH), `lexmetrik-golden.json` byte-gleich, `src/data/tarif/**` unberührt. Rückbau: Geometrie-Schicht als `zh-seitenmontage.ts` herausgelöst (§6.6, Adapter 1918 → 1372 Z.). **Fachliche Abnahme steht aus; die adversariale Gegenprüfung dieser Runde ist der nächste Auftrag.**

  - [x] **ZH-Tranche Stufe 2 · Kern-Erlasse** *(ZH-4a/4b/4c, Fahrplan §4)* — ✅ 31.8.2026: 20 Kern-Erlasse importiert (23 ZH-Erlasse, 2371 Snapshots), deklarative Quellenliste `scripts/normtext/zh-quellen.ts` + Auflöse-Werkzeug, `holeZhPdf` mit Retry/Drossel und sichtbarem Abbruch bei Fehl-Erlassen (Rot-Beweis geführt). `check:normtext-netz` prüft 23 statt 3 ZH-Gruppen ⇒ §7-d-Lücke geschlossen. Zurückgestellt: LS 101 (KV, «Art.» statt «§») und LS 131.11 (VGG, Anhang-Kontenrahmen). `lexmetrik-golden.json` byte-gleich, `normtext-snapshot.json` rein additiv.

  - [x] **ZH-4e · Art.-Marker-Zweig im ZH-PDF-Adapter** *(Befund 31.8.2026)* — ✅ 31.8.2026 in der Fix-Runde: `erkenneZhMarker()` erhebt die Zählweise je Erlass aus der Textbasis (Mehrheit der zeilenanfangs-verankerten Köpfe), Label folgt («Art. N» statt «§ N»). **LS 101 KV aufgenommen: 147 Artikel.** §1-A.

  - [x] **K-14 · Kantonales Zitat-Vokabular — POC** *(F39)* — nur exakte Sammlungsnummer-Matches; Prämisse «Entscheid-`normKeys` sind Bund-only» vor dem Bau nachmessen. §1-A.
        *Teil-eingelöst 31.8.2026 (N0a). Prämisse nachgemessen und **bestätigt**: 0 von 6341 Register-Einträgen trugen einen kantonalen key. Geliefert als eigene Projektion `public/rechtsprechung/normkeys-kanton.json` (3191 Entscheide, 6990 Paare, 147 Erlasse, Kanton BS), Tor `check:normkeys-kanton`. **Nicht** ins Rechtsprechungs-Register geladen: das steht bei 97.0 % seines gzip-Deckels. **Offen bleibt** die Ausweitung über BS hinaus — sie hängt an `SYSTEMATIK_PRAEFIX` (kanton-norm-resolver.ts), das nur BS deklariert; die übrigen fünf Entscheid-Kantone (AG/BE/GR/SG/ZH) haben zusammen 30 Entscheide und keinen Erlass-Bestand, gegen den aufzulösen wäre.*

  - [x] **`inkraftSeit` für Kantone — GEPRÜFT UND ABGELEHNT** *(Befund N0b 31.8.2026, §7-Abweichung)* — ein Auftrag verlangte, das Feld für alle 1231 kantonalen Erlasse aus dem vorhandenen `stand` zu füllen («Bund 227, Kanton 0/1231»). **Nicht gebaut, und zwar nicht aus Aufwand, sondern weil es fachlich falsch wäre.** `inkraftSeit` bedeutet im bestehenden Vertrag das **Ur-Inkrafttreten des Erlasses** (Fedlex `jolux:dateEntryInForce` am Abstract-ELI, Sidecar `inkrafttreten.json`), und die UI beschriftet es «in Kraft seit». Der kantonale `stand` ist das In-Kraft-Datum der **aktuellen Fassung** — eine andere Tatsache. Empirischer Abstand am Bund: von 227 Erlassen mit beiden Werten sind sie bei **genau einem** gleich (ZGB: stand 2026-07-01 vs. inkraftSeit 1912-01-01). Der Nachtrag hätte für AG-291.150 behauptet, das Anwaltsdekret gelte seit 2024. Die Auslassung ist ausserdem **dokumentiert und begründet**, nicht vergessen: `inkrafttreten-generieren.ts` («LexWork trägt strukturell KEIN unterscheidbares Ur-Inkrafttreten … darum §8: Kanton ehrlich WEGLASSEN») und der Feld-Kommentar in `browse-typen.ts`. **Voraussetzung für eine spätere Umsetzung:** eine amtliche Quelle je Kanton, die das Ur-Inkrafttreten trägt — offline nicht vorhanden. Wer den Punkt wieder aufmacht, liest zuerst diese Zeile.


## QS-KORPUS — Korpus-Pflege: fehlende und fehlerhafte amtliche Substanz *(verschoben 6.9.2026)*

  - [x] **VZV Art. 3/4: amtliche Ausweiskategorien durch generische lit.-Marken ersetzt** *(Befund Diskrepanz-Finder 4.9.2026, PR #650)* — Fedlex führt `<dt>A: </dt>`, `<dt>BE: </dt>` (Führerausweis-Kategorien); `public/normtext/bund/VZV.json` Art. 3 Abs. 1 trägt stattdessen `marke: a,b,c,d,b,c,d` — die amtliche Bezeichnung ist weg und die Marken sind doppelt. Aus «Kategorie BE» wird «lit. b»: fachlich falsch zitierbar (§1). Wurzel im Fedlex-Adapter (`<dl>`-Marken werden offenbar nachnummeriert statt gelesen), nie in den Daten flicken; Breite messen (alle Erlasse mit nicht-alphabetischen `<dt>`-Marken). Risikopfad ⇒ Gegenprüfung. — **erledigt (PR #658)**: Wurzel im Fedlex-Adapter (`parseDefinitionsListe`, Präfix-Match kürzte jede nicht-kanonische Marke auf ihr erstes Token). Neu wird die Marke gelesen: `<dt>` mit `:` = Label verbatim (51 Vorkommen in genau 3 Erlassen gemessen, keine davon lit.-Aufzählung), sonst nur normalisieren, wenn die GANZE Marke kanonisch ist. Breite: 35 Erlasse, 62 Artikel, 193 Einzelmarken — nebst VZV auch die römischen Ziffern der Staatsverträge (`ii)`→`i`), ASYLV-2-Legenden, VBB-Kolonnen, UVG-Rentenlabels, lat. Suffixe bis `decies`. Messung: `bibliothek/normtext/dt-marken-inventar-2026-09-04.md`.

  - [x] **AMBV: fünf Snapshot-Defekte aus zerrissenen Wörtern und loser Interpunktion** *(Befund Diskrepanz-Finder 4.9.2026, PR #650)* — `public/normtext/bund/AMBV.json` gegen den gepinnten Fedlex-Text: Art. 6 «Zwischen produkten», «Erfah rung», «natur wissenschaftliche», «Hochschul aus bildung», «Fütterungs arznei mitteln»; Art. 12 «Qualifika tionen»; Art. 14 «GMP-Kon trollsysteme»; Art. 11/12 «werden ;» bzw. «ausreicht ;»; Art. 21 «werden .». Klasse: Silbentrennung des Quell-Layouts nicht zusammengezogen bzw. Leerzeichen vor Satzzeichen. Deterministisch reproduzierbar mit `npx vite-node scripts/analyse/gemini-diskrepanz.ts bund/AMBV --nur-diff`; Sweep über den Bund-Bestand vor dem Fix, die Klasse ist mit hoher Wahrscheinlichkeit nicht auf AMBV beschränkt. Risikopfad ⇒ Gegenprüfung. — **erledigt (PR #658)**: Weder Silbentrennung noch `&shy;`, sondern leere Namensraum-Marker der Fedlex-Word-Konversion (`<tmp:inl …></tmp:inl>`) MITTEN im Wort; `entferneTags` las den Tagnamen ohne Namensraum («tmp») und ersetzte den Marker durch ein Leerzeichen. Neu ist ein Tagname mit `:` inline. Breite: 8 Erlasse, 16 Artikel (AMBV, BETMKV, LugÜ, BBV, EPV, FAMZV, NBV, **AHVV** — dort korrigiert der Fix einen Frankenbetrag «10.—», Gegenprüfung 4.9.2026); im Cache gemessen: `tmp:inl` 680, `w:smartTag` 64, `w:moveFromRange*` 4.


## QS-MONITOR-ROT — Normen-Monitor seit ≥5 Wochen rot — Wurzel-Fix *(verschoben 6.9.2026)*

  - [x] LIK-Reihe 2026-05→2026-07 nachziehen (amtliche Werte ⇒ Gegenprüfung). *(#499 14.8., bestätigt #581 30.8.: 30/30 Identitätstreffer BFS cc-d-05.02.08; Häkchen 1.9.2026)*

  - [x] 10 ESTV-MWST-Snapshot-Drifts aktualisieren · AIG-Botschaft BOTSCHAFT-2025-3067 nachführen · VRV-Vernehmlassung VERN-2026-79 bereinigen. *(#524 15.8. + #581 30.8., Gegenprüfung bestanden; Häkchen 1.9.2026)*

  - [x] Verfahrens-Gap Reparatur-Arm vs. Detektions-Arm — ✅ 2.9.2026 (PR #623): Monitor-Cron 07:17 UTC nach dem Reparatur-Arm, Reparatur-PR ohne Kanton-Churn, Tafel aller 12 Verdikte statt &&-Kette.


## W2·17-UI-BEFUNDE — UI-Befundliste extern (210 Befunde, Cowork 29.7.2026) *(verschoben 6.9.2026)*

  - [x] **B6-N1 · LM-162: Ergebniskasten wächst mit dem Inhalt** — Entscheid David 8.8.2026; CLS-Budget trotzdem halten. §7.

  - [x] **B6-N2 · LM-164: «nicht erfasst» wird ausgewiesen** — **erledigt (überholt)** 30.8.2026: am gebauten Stand nicht mehr reproduzierbar (V1-Hülle gelöscht, kein Artikel trägt eine Rechtsprechungs-Zeile), §8-Substanz im V3-Reiter «Entscheide» bereits gebaut (drei Zustände, drei Sätze). Rest-Punkt am Panel-Öffner wartet auf David. §7.

  - [x] **B7-N1 · Scrim hinter Overlays (LM-010/LM-015)** — gebaut 30.8.2026 am «Ansicht ▾»-Menü (Regel: der Scrim folgt der Fokus-Falle, Ä52 bleibt); LM-010 erledigt (überholt) — das Rechtsprechungs-Panel ist seit Ä60 eine Spur neben dem Text, kein Overlay. Dunkelmodus-Fehler des Blatt-Scrims mitbehoben. §8.


## QS-UI — Oberflächen-Qualität app-weit *(verschoben 6.9.2026)*

  - [x] **Marken-Präfix im Leser: «lit. BE» statt «Kategorie BE», «A.» statt «A:»** *(Gegenprüfung PR #658)* — gebaut #679 (`markenArt` in `ArtikelBody.helfer.ts`), Tests nachgezogen 5.9.2026 (VZV Art. 3: `BE:` statt `BE.`, Zitat ohne «lit.»; Golden byte-gleich).

  - [x] **Pfadgebundene Wächter zeigen nur auf `ArtikelBody.tsx`** *(Nebenfund #663-Split, §6.7)* — erledigt 5.9.2026: drei Wächter (leser-typo-tokens, design-r3b-chrome, check-linien-kanon) auf Glob `ArtikelBody.*` umgestellt, je Rot-Beweis in `ArtikelBody.helfer.ts`. Hinweis bleibt: `EntscheidLeser.tsx`-Wächter (11 Tests) analog anpassen, falls dort gesplittet wird.


## QS-FREMDAGENTEN — Fremde Agenten im Bau — Jules, Antigravity, Gemini *(verschoben 6.9.2026)*

  - [x] Phase 0 — Testläufe T1–T6 (Jules-Pilot, agy-Recall, agy-Betrieb, NotebookLM, Prüfer-Probe, Tabu-Probe); Messwerte §5 (T4 David offen, T6: AGENTS.md hält nicht als Zaun). §2.

  - [x] Pilot Jules — 3/3 PRs ohne Code-Nacharbeit (#639, #647, #648), Fremd-PR-Tor in CI (#645, Muster #649). §2/§5.

  - [x] Diskrepanz-Finder Korpus-Werkstatt (#650, deterministischer Erstfilter + Gemini-Konsens; Pilot AMBV 8/8). §2/§3.


## QS-VERWENDEN — Verwenden statt bauen — risikoarme Fertigteile aus der Fremdquellen-Sichtung 2.9.2026 *(verschoben 6.9.2026)*

  - [x] **V1 Lizenz-Tor** — `check:lizenzen` mit Allowlist (MIT/Apache-2.0/BSD/ISC/0BSD/CC0/Unlicense/Python-2.0/BlueOak; MPL-2.0 nur gekennzeichnet) über `npm ls --all --json`/Paket-`license`-Felder, LGPL/GPL/AGPL/CPAL/NOASSERTION = rot; SBOM via cyclonedx-node-npm optional; einmal rot zeigen (§6.7); ins `gate` einhängen. Beleg: Rangliste #3.

  - [x] **V1b check:lizenzen in ci.yml Tore-Job verdrahten** (Paritäts-Allowlist danach entfernen) — Folgeschritt aus Bug-Check-Nachzug PR #622 (Absprache 2.9.2026).

  - [x] **V2 Cache für `daten/*.db`** im Turso-Sync-Workflow (`turso-sync.yml`, Job sync; ci.yml baut keine DBs, Tore bauen in-memory aus JSON) mit Schlüssel = `daten-manifest.json` + `scripts/datenhaltung/**` + `scripts/suche-felder.ts` + `package-lock.json` (`actions/cache@v4`, kein restore-key). Nutzen: wiederholte sync-Läufe ohne Datenänderung (der Cron-Job frische baut nichts). Beleg: Rangliste #10, PR #621.

  - [x] **V3 Raw-Store Fedlex** — `scripts/fedlex-cache.sh`-Rohfassungen je Korpus-Stand als GitHub-Release-Asset (Tag `korpus-raw-<datum>`), plus `actions/attest-build-provenance`; Prüfung «Raw für jeden Pin vorhanden» via `check:raw-store`. Beleg: Rangliste #9.

  - [x] **V4 JSON-LD vervollständigen** — `legislationDateVersion`/`legislationLegalForce` in `src/lib/seo-detail.ts` aus Konsolidierungsdatum/`inForceStatus` füllen (Geltungsaussage nur, wo der Pin sie kennt; sonst Feld weglassen; Bug-Check #630: Feldname korrekt `legislationDateVersion`, nicht `legislationDate`). Beleg: Rangliste #12.

  - [x] **V5 Atom-Feed «geänderte Erlasse»** aus `public/normtext/register.json` (`status==='snapshot'`, Feld `stand`) statisch nach `public/feed/erlasse.xml`, deterministisch (keine Bauzeit-Stempel, sha256 zweier Läufe identisch); handgebautes XML statt Paket `feed` (§17 Rückbau-Gegengewicht). Beleg: Rangliste #14, PR (QS-VERWENDEN V5+V6).

  - [x] **V6 valibot-Formprüfung** an den Datei-Grenzen für Manifeste/generierte JSON (nur Grenzen, nie Engines): `daten-manifest.json` (turso-sync.ts Quell-Riegel) + `public/normtext/register.json` (ingest.ts ladeRegister()). Beleg: Rangliste #16, PR (QS-VERWENDEN V5+V6).

  - [x] **V8 pagefind-Spike** gegen `suche-eval-gold` (Messung, kein Umbau) — Spike gemessen 2.9.2026: nicht ersetzen (Notiz [bibliothek/recherche/pagefind-spike-2026-09-02.md](bibliothek/recherche/pagefind-spike-2026-09-02.md)). Beleg: Rangliste #11.

# Umschichtung 6.9.2026 (2) — erledigte Zeilen aus dem Steuerungsplan

*Anlass: `check:steuerdeckel` riss beim Anlegen von `W2·25-ARBEITSMAPPE` und
`W2·24-PERF-REST` (ROADMAP 102.2 KB > Deckel 100 KB). Rotiert wurde das
Minimum, das den Deckel hält, ausserhalb des Design-Bandes und ohne den Schritt
`W2·24-DESIGN-IDENTITAET` zu berühren. Wortlaut unverändert (nie zusammenfassen).*

## W2·5l-NORMTEXT-B2 / M15 — Fedlex-Fussnoten als Änderungsgeschichte je Artikel *(erledigt, verschoben 6.9.2026)*

*Im Plan bleibt ein ✅-Einzeiler mit Pointer; der Schritt `W2·5l-NORMTEXT-B2`
selbst ist offen und unangetastet.*

  - [x] **M15 · Fedlex-Fussnoten als Änderungsgeschichte je Artikel** — AKN `<authorialNote>`-refs (OR: 2 315, davon 2 236 AS/BBl-Fundstellen) werden in `adapter-htm.ts` heute gestrippt; als Datenschicht «geändert durch AS … am …» je Artikel erhalten. Risikopfad. Quelle: Fremdquellen-Sichtung 2.9.2026 §1 #7. **Ergänzung 6.9.2026 (R1-Zensus):** inhaltlich bereits erledigt durch G-HIST (`public/normtext/historie/`, `W2·5i-HIST-ANSICHT` 26.7.2026, 26 686 Ereignisse mit AS/BBl-Links); der Strip sitzt in `scripts/normtext/extrahiere-fedlex.ts` Z. 74/126–132, nicht in `adapter-htm.ts` (Kanton-Pfad). Absorbiert in `W2·6c-ENTSTEHUNG-DATEN`.

## `@blockers` / `k3-scharfschaltung-folgt` — historischer Blocker-Eintrag *(erledigt, verschoben 6.9.2026)*

*Der Eintrag war seit dem 1.9.2026 selbst als «historisch» gekennzeichnet
(QS-BASIS steht seither auf `ready`) und blockierte keinen Schritt mehr; kein
Schritt trägt `blocker: k3-scharfschaltung-folgt`. Aus dem Register entfernt,
Wortlaut hier:*

k3-scharfschaltung-folgt: (historisch, QS-BASIS seit 1.9.2026 ready) QS-BASIS(d) Suche-Edge — Umzug gelandet (#604), der K3-Umschalter (Kanton-Volltext nur Edge, statischer Index Bund-only, −45 %) ist VORBEREITET und wartet auf die eigene Folge-Landung: Flag an + Budget-Zeile check-perf-budget:152 deklariert senken + Abdeckungszeile useUniversalSuche (Design-Fläche, TABU bis frei). David-Go liegt vor («schalte scharf sobald geprüft und verifiziert», 31.8.2026); Live-Verifikation Edge positiv. KEIN David-Gate — reiner Sequenz-Blocker.

## QS-EFFIZIENZ / «Steuerdeckel-Entscheid» — sechs erledigte Nebenpunkte vom 5.9.2026 *(verschoben 6.9.2026)*

*Der Punkt selbst bleibt im Plan offen («wartet auf David»); nur die sechs
durchgestrichenen, am 5.9.2026 erledigten Nebenpunkte sind hierher gezogen:*

· ~~**Projektionskette nach main-Merge**~~ erledigt 5.9.2026: `npm run projektionen` + Landungs-Skill Nachkontrolle 8/9; kein neues Tor (Drift-Tore bestehen) · ~~**`src/lib/suche/**` nicht im Risiko-Prädikat** (#681, §6.7)~~ Entscheid 5.9.2026 (§17-Gegengewicht): kein Zuwachs — Suche ist Darstellung/Ranking, kein datierter Vorfall; Wiedervorlage nur bei Vorfall an `bgeQuery.ts`/`normQuery.ts`, dann als Teilmenge. · ~~**`schlankheit:update` nur gezielt**~~ erledigt 5.9.2026 (`--update <pfad…>`, ohne Pfad nur Aufräumen + Exit 1 bei Neuzugängen; Rot-Beweis, #699) · ~~`ZhStueckFixture` auch in `-runde2/-runde3`-Fixtures dupliziert (§5, #702)~~ erledigt 5.9.2026 (Jules 13b, #715: Basistyp importiert, runde3 per `extends`). · ~~**Paritäts-Tor kennt nur die `check:seriell`-Kette**~~ erledigt 5.9.2026: Gegenrichtung ci.yml → lokal, `ALLOWLIST_NUR_CI` (3 Einträge), Rot-Beweis (#712) · ~~**Messung: Klasse «Entwurf-Antwort»**~~ erledigt 5.9.2026: Label `entwurf-antwort` (auf #707), `entwurf_antworten_7d` (Schema 5), Skill/Vorlage/Fahrplan §5 nachgezogen.

## W2·20-VERWEIS-SCHAERFE — Teilbefund (b) «alte Fassung zitiert» *(erledigt, verschoben 6.9.2026)*

*Teilerfolgs-Prosa aus einem offenen Schritt (Ausnahme 22.7.2026); im Plan
bleibt ein ✅-Einzeiler:*

    Anker; ~~(b) «… KAG in der Fassung vom 28. September 2012» zitiert eine ALTE Fassung~~ —
    **erledigt** mit dem Gegenprüfungs-Nachzug zu Z5 (Guard `historischeFassung`,
    `src/lib/fedlex/positivliste.ts`; 19 Links gemessen zurückgebaut, PR #635);

## W2·13-KANTONE-DATEN / K-13 — Systematik-Baum ZH *(erledigt 31.8.2026, verschoben 6.9.2026)*

*Teilerfolgs-Prosa aus einem offenen Schritt (Ausnahme 22.7.2026); im Plan
bleibt ein ✅-Einzeiler, die offenen Kantone GE/VD/TI/SZ/NE/JU stehen dort
unverändert weiter.*

  - [ ] **K-13 · Systematik-Bäume 7 Kantone** *(F6≡F43)* — **ZH erledigt 31.8.2026** (14 amtliche Ordner aus der server-gerenderten Suchseite, `scripts/normtext/zh-systematik.ts` → Generator-Zweig; Zuordnung über das Nummernband, 20/20 gegen den amtlichen JSON-Endpunkt bestätigt). Offen: GE/VD/TI/SZ/NE/JU (+GL-Index-Ordinalzahlen, +ZH-Band-Zweig); Quell-Erhebung je Kanton empirisch und browserlos. §1-A.

# Umschichtung 7.9.2026 — erledigte Schritte und Teilerfolge aus dem Steuerungsplan

*Anlass: Buchung `W2·24-DESIGN-IDENTITAET` (PR #739) riss den ROADMAP-Deckel (102.3 / 100 KB vor
der Buchung). Wörtlich übernommen, nicht zusammengefasst. `W2·23-STARTSEITE-V4` und
`W3-TARIF-STAND` behalten im Plan einen ✅-Einzeiler samt `@meta` — der erste, weil er der einzige
Link auf `FAHRPLAN-STARTSEITE-V4.md` ist (`check:plan` Regel FAHRPLAN-Link), der zweite, weil
offene Folgeschritte unter ihm hängen.*

## W2·23-STARTSEITE-V4 — Startseite V4 «Werkbank» *(done, verschoben 7.9.2026)*

- [x] **Startseite V4 «Werkbank»: Einstieg mit Gesetzes-Schwerpunkt, persönliche Begrüssung, Kopf- und Seitenleiste** *(`W2·23-STARTSEITE-V4`, Auftrag David 5.9.2026)*
  <!-- @meta id: W2·23-STARTSEITE-V4 · status: done · blocker: null · dep: [] · feld: design · fahrplan: fahrplaene/FAHRPLAN-STARTSEITE-V4.md -->
  Die Startseite erklärt auf dem ersten Bildschirm «Schweizer Recht an einem Ort» (Gesetze
  Bund + Kantone, Entscheide, Materialien — verzahnt), begrüsst persönlich (Tageszeit-Pool,
  Wunsch David), macht Norm · Entscheid · Frist mit einem Zug erreichbar; Schnellrechner
  schrumpft auf eine Zeile, News wird ehrlich «Jüngste Entscheide im Korpus» mit Korpus-Stand;
  Topbar auf «/» ohne Zweitsuche, Schriftregler nach `/einstellungen`, Seitenleiste mit
  Korpus-Stand. Council-Schalter V3 durch David geöffnet (Chat 5.9.2026). Grenzen §1/§3/§8.
  **Detail:** [FAHRPLAN-STARTSEITE-V4.md](fahrplaene/FAHRPLAN-STARTSEITE-V4.md) §1.

## W3-TARIF-STAND — Tarif-Stammdaten: Stand maschinenlesbar + Drift-Tor *(done, Rumpf verschoben 7.9.2026)*

- [x] **Tarif-Stammdaten: Stand maschinenlesbar + Drift-Tor** *(`W3-TARIF-STAND`, Rules-as-Code-Sichtung 5.9.2026, Entscheid David 5.9.2026)*
  <!-- @meta id: W3-TARIF-STAND · status: done · blocker: null · dep: [] · feld: werkzeuge -->
  Ziel: die ~950 Tarif-Einträge in `src/data/tarif/**` werden maschinell auf Fassungs-Drift prüfbar
  (§7 d für Tarifzahlen — heute nur für Normtext): `stand` als ISO-Datum plus Fassungskennung der
  Quelle je Eintrag, Tor `check:tarif-drift` mit Rot-Beweis am SG-2808-Fall, Verfallsregister aus dem
  Tor statt aus Handzeilen. **Grenzen:** verhaltensneutral (Golden byte-gleich), keine Tarifwert-
  Änderung, keine Zeitachse und kein Stichtag in den Engines — das ist ein eigener Folgeschritt mit
  offener Vorfrage (frühere Fassungen bei lexfind/zh.ch/belex adressierbar?). Risikopfad ⇒ Gegenprüfung.
  **Detail:** [rules-as-code-sichtung-2026-09-05.md](bibliothek/recherche/rules-as-code-sichtung-2026-09-05.md) §6.

## W2·24-DESIGN-IDENTITAET — Zielbeschreibung vor der Landung *(Rumpf verschoben 7.9.2026)*

- [~] **Design-Identität: eigene Farb- und Schrift-Handschrift** *(`W2·24-DESIGN-IDENTITAET`, David 5.9.2026)*
  <!-- @meta id: W2·24-DESIGN-IDENTITAET · status: wip · blocker: null · dep: [] · feld: design · fahrplan: fahrplaene/FAHRPLAN-DESIGN-IDENTITAET.md -->
  Weg von Creme+Gold, Versal-Etiketten und weichen Karten (Verwechselbarkeit mit legaldeadline.ch):
  Token-Tausch, flip-reversibel; erst drei Varianten-Bilder nach Landung W2·23, David wählt.
  **Detail:** [FAHRPLAN-DESIGN-IDENTITAET.md](fahrplaene/FAHRPLAN-DESIGN-IDENTITAET.md) §1.
  - [ ] **Bezüge-Zeile am Artikel: Umfang und Form** (D20) — nach R9 prüfen, ob Entscheide/Materialien am Rand noch stimmen. **Wartet auf David.**

*(D20 ist mit der Landung 7.9.2026 in die Zeile «Bezüge-Zeile: Kopfzähler gefiltert/ungefiltert»
aufgegangen — Entscheid N1 vom 7.9.2026: Kopfzähler = Bezugsgrösse, Filter nur im Panel.)*

# Umschichtung 7.9.2026 (2) — Residuen-Einzeiler aus dem Steuerungsplan

*Anlass: die Schlussbuchung der W2·24-Nachwünsche (7.9.2026) braucht Platz unter
dem ROADMAP-Deckel (100 KB; Ist vor der Rotation 102.1 KB — `check:steuerdeckel`
hätte die neuen Zeilen abgewiesen). Rotiert sind ausschliesslich die
Residuen-Einzeiler der Umschichtung 6.9.2026 — deren Sach-Wortlaut steht dort
bereits; hier stehen die Plan-Zeilen selbst, unverändert (nie zusammenfassen).
Im Plan bleibt je Elternschritt EIN Pointer; das `@meta` der offenen
Elternschritte ist unangetastet.*


## Kantonale Gesetze — Darstellung & Suche — erledigte Unterzeilen *(Residuen, verschoben 7.9.2026)*

  - [x] **K-1 · Reader-Treue P0** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).
  - [x] **K-2 · §8-Ehrlichkeit UI** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).
  - [x] **K-3 · Suche: Kanton-Treffer auf die richtige Ebene** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).
  - [x] **K-5 · NormText-Verweise Kanton** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).
  - [x] **K-11 · Kanton-Reader-Performance profilieren** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).


## Verzahnung sichtbar machen — erledigte Unterzeilen *(Residuen, verschoben 7.9.2026)*

  - [x] **«Grundzustand ohne Zusatz-Fetch» ehrlich gemacht** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).
  - [x] **Ankunfts-Sprung `?norm=` nutzt beide Fundstellen-Regeln** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).
  - [x] **Panel-Reiter fachlich sauber geschnitten — vierter Reiter «Anwendung»** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).


## Amtlicher Fedlex-Zitatgraph: Erlass-Verweise ohne Artikelnummer + Warn-Bericht + «zitiert von» (Bund) — erledigte Unterzeilen *(Residuen, verschoben 7.9.2026)*

  - [x] **Z1 Erlass-Verweis ohne Artikelnummer verlinken** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).
  - [x] **Z2 Build-Zeit-Artefakt `messwerte/fedlex-zitatgraph.json`** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).
  - [x] **Z3 Warn-Bericht** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).
  - [x] **Z5 Ausgeschriebene Artikelverweise («Artikel N Absatz M KÜRZEL») verlinken** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).


## Schlusstitel/UeB/Anhänge (M13) + wortgenaue Fussnoten (M14) — erledigte Unterzeilen *(Residuen, verschoben 7.9.2026)*

  - [x] **M15 · Fedlex-Fussnoten als Änderungsgeschichte je Artikel** — ✅ absorbiert in `W2·6c-ENTSTEHUNG-DATEN` (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).


## Kantonale Gesetze — Daten & Extraktion — erledigte Unterzeilen *(Residuen, verschoben 7.9.2026)*

  - [x] **ZH-Tranche Stufe 2 · Fix-Runde nach Gegenprüfung** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).
  - [x] **ZH-Tranche Stufe 2b · Fix-Runde 2 nach der zweiten Gegenprüfung** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).
  - [x] **ZH-Tranche Stufe 2c · Fix-Runde 3 nach der dritten Gegenprüfung (zwei Linsen)** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).
  - [x] **ZH-Tranche Stufe 2 · Kern-Erlasse** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).
  - [x] **ZH-4e · Art.-Marker-Zweig im ZH-PDF-Adapter** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).
  - [x] **K-14 · Kantonales Zitat-Vokabular — POC** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).
  - [x] **`inkraftSeit` für Kantone — GEPRÜFT UND ABGELEHNT** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).


## Korpus-Pflege: fehlende und fehlerhafte amtliche Substanz — erledigte Unterzeilen *(Residuen, verschoben 7.9.2026)*

  - [x] **VZV Art. 3/4: amtliche Ausweiskategorien durch generische lit.-Marken ersetzt** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).
  - [x] **AMBV: fünf Snapshot-Defekte aus zerrissenen Wörtern und loser Interpunktion** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).


## Normen-Monitor seit ≥5 Wochen rot — Wurzel-Fix — erledigte Unterzeilen *(Residuen, verschoben 7.9.2026)*

  - [x] **LIK-Reihe 2026-05→2026-07 nachziehen** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).
  - [x] **10 ESTV-MWST-Snapshot-Drifts aktualisieren · AIG-Botschaft BOTSCHAFT-2025-3067 nachführen · VRV-Vernehmlassung VERN-2026-79 bereinigen** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).
  - [x] **Verfahrens-Gap Reparatur-Arm vs. Detektions-Arm** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).


## UI-Befundliste extern (210 Befunde, Cowork 29.7.2026) — erledigte Unterzeilen *(Residuen, verschoben 7.9.2026)*

  - [x] **B6-N1 · LM-162: Ergebniskasten wächst mit dem Inhalt** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).
  - [x] **B6-N2 · LM-164: «nicht erfasst» wird ausgewiesen** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).
  - [x] **B7-N1 · Scrim hinter Overlays (LM-010/LM-015)** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).


## Oberflächen-Qualität app-weit — erledigte Unterzeilen *(Residuen, verschoben 7.9.2026)*

  - [x] **Marken-Präfix im Leser: «lit. BE» statt «Kategorie BE», «A.» statt «A:»** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).
  - [x] **Pfadgebundene Wächter zeigen nur auf `ArtikelBody.tsx`** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).


## Fremde Agenten im Bau — Jules, Antigravity, Gemini — erledigte Unterzeilen *(Residuen, verschoben 7.9.2026)*

  - [x] **Phase 0** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).
  - [x] **Pilot Jules** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).
  - [x] **Diskrepanz-Finder Korpus-Werkstatt** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).


## Verwenden statt bauen — risikoarme Fertigteile aus der Fremdquellen-Sichtung 2.9.2026 — erledigte Unterzeilen *(Residuen, verschoben 7.9.2026)*

  - [x] **V1 Lizenz-Tor** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).
  - [x] **V1b check:lizenzen in ci.yml Tore-Job verdrahten** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).
  - [x] **V2 Cache für `daten/*.db`** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).
  - [x] **V3 Raw-Store Fedlex** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).
  - [x] **V4 JSON-LD vervollständigen** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).
  - [x] **V5 Atom-Feed «geänderte Erlasse»** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).
  - [x] **V6 valibot-Formprüfung** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).
  - [x] **V8 pagefind-Spike** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).


# Umschichtung 8.9.2026 — erledigte Schritte aus dem Steuerungsplan

*Anlass: Roadmap-Aufräumen (Auftrag David 8.9.2026, „kannst du auch noch roadmap aufräumen?").
`W2·23-STARTSEITE-V4` behielt seit der Umschichtung 7.9.2026 einen ✅-Einzeiler samt `@meta` in
`ROADMAP.md`, weil er der einzige Link auf `fahrplaene/FAHRPLAN-STARTSEITE-V4.md` war
(`check:plan` Regel 7/9). Verify-then-archive (aufraeumen.md Ziff. 4): kein weiterer lebender
Zeiger auf den Basenamen in ROADMAP.md, fahrplaene/, bibliothek/ oder docs/, keine `dep:`-Referenz
auf die ID — Fahrplan nach `archiv/fahrplaene/FAHRPLAN-STARTSEITE-V4.md` verschoben, der
verbliebene Rest-Stub darum jetzt vollständig geschlossen.*

## W2·23-STARTSEITE-V4 — Rest-Stub, geschlossen mit Fahrplan-Archivierung *(done, verschoben 8.9.2026)*

- [x] **Startseite V4 «Werkbank»: Einstieg mit Gesetzes-Schwerpunkt, persönliche Begrüssung, Kopf- und Seitenleiste** *(`W2·23-STARTSEITE-V4`, Auftrag David 5.9.2026)*
  <!-- @meta id: W2·23-STARTSEITE-V4 · status: done · blocker: null · dep: [] · feld: design · fahrplan: fahrplaene/FAHRPLAN-STARTSEITE-V4.md -->
  ✅ gelandet 5.9.2026 (#730/#732) — Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 7.9.2026. Der
  Eintrag bleibt hier, bis `FAHRPLAN-STARTSEITE-V4.md` archiviert ist (einziger Link, `check:plan`).
  **Detail:** [FAHRPLAN-STARTSEITE-V4.md](fahrplaene/FAHRPLAN-STARTSEITE-V4.md) §1.

# Umschichtung 8.9.2026 (Landung #764) — erledigte Prosa aus dem Steuerungsplan (wörtlich, Deckel 100 KB)

## W3-TARIF-NACHVERIFIKATION — Drift-Nachverifikation der Tarif-Stammdaten (34 Erlasse, 93 Einträge), Auftrag David 6.9.2 *(verschoben 8.9.2026)*

- [~] **Drift-Nachverifikation der Tarif-Stammdaten (34 Erlasse, 93 Einträge)** *(`W3-TARIF-NACHVERIFIKATION`, Auftrag David 6.9.2026, Befund Tor-Erstlauf `check:tarif-drift`)*
  <!-- @meta id: W3-TARIF-NACHVERIFIKATION · status: wip · blocker: null · dep: [] · feld: werkzeuge -->
  Ziel: jede DRIFT-Zeile des Tors wird an der **aktuellen amtlichen Fassung** nachverifiziert — Tarifwerte
  der referenzierten Artikel vergleichen, bei Abweichung Wert + Norm-Anker + `quelleUrl`-Pin + `stand`
  nachziehen (nie ohne Quelle), bei Gleichheit nur Pin/Stand; danach `check:tarif-drift` DRIFT 0 und
  Verdrahtung in die Netz-Kette (`check:netz:kette`). **Grenzen:** `verifiziert` bleibt unverändert (§7:
  «geprüft» setzt nur David); Golden-Änderung nur deklariert je Wert; Risikopfad ⇒ Gegenprüfung Pflicht;
  keine Änderung an Engines. **Detail:** [rules-as-code-sichtung-2026-09-05.md](bibliothek/recherche/rules-as-code-sichtung-2026-09-05.md) §6 Ziff. 2 + Tor-Ausgabe.
  **Belegkette:** [tarif-drift-nachverifikation-2026-09-06.md](bibliothek/kosten/tarif-drift-nachverifikation-2026-09-06.md) (drei Berichte wörtlich, Abruf 6.9.2026) — dort auch der Wortlaut zu den Folgezeilen.

## W2·24 — Orchestrator-Entscheide vom Tag 7.9. (Unterzeile, wörtlich) *(verschoben 8.9.2026)*

  - [x] **Orchestrator-Entscheide vom Tag 7.9. — David 7.9.2026 «alles bestätigt»:** Meta-Routen sind ebenfalls Reiter, «ohne Ausnahme» (R14b) · kein separater Fussnoten-Apparat-Schalter, die Dreier-Wahl deckt ihn ab (F3) · das Ansicht-Menü klebt am Griff und ragt 61 px über die Lesespalte (F4) · der Menü-Eintrag heisst «Alles ausblenden»/«Alles zeigen» statt «Nur Gesetzestext» (F2, Name vom Schriftregler belegt).

## Blocker-Register — Streichungen 8.9.2026 (kein lebender Schritt referenziert das Token)

- **`§4-lizenz`** — gestrichen 8.9.2026: von keinem `@meta blocker:` mehr referenziert; Wortlaut: `§4-lizenz: Live-Rechtsprechung — CC-BY-SA vs. Art. 5 URG, CORS/Rate-Limits unbestätigt`
- **`zh-tranche-laeuft`** — gestrichen 8.9.2026: von keinem `@meta blocker:` mehr referenziert; Wortlaut: `zh-tranche-laeuft: W2·13-KANTONE-DATEN — ZH-Programm läuft (FAHRPLAN-KANTONE §5): Kern-Tranche gelandet, Tranchen A/B/C + 13 Runden folgen; Dach-Schritt bleibt offen bis Programm-Ende. Kein David-Gate — Sequenz-Marker für die Plan-Buchung.`

## Datierte Teilerfolgs-Prosa und Präzisierungen aus offenen Schritten *(verschoben 8.9.2026, Landung #764)*

### Nachtrag 31.8.2026 (N0b, an den Merge-Stand 1.9.2026 angepasst): die f

        *Nachtrag 31.8.2026 (N0b, an den Merge-Stand 1.9.2026 angepasst): die fehlenden Bäume kosten messbar — Regenerat-Messung 1.9.2026: 65 Erlasse ohne `sachgebietKanton` (24 ZH Band-Zweig + 41 aus JU 7 · VD 7 · GL 5 · LU 5 · TI 5 · GE 4 · NE 4 · SZ 4); LU-Baum vorhanden, aber `index` führt Ordinalzahlen statt Systematik-Nummern (5 Erlasse offen). Der N0b-Befund «ZH nicht in kanton-systematik.json» galt für main VOR dieser Landung — der ZH-Baum kommt mit ihr. **Regenerat-Messung 1.9.2026: Join greift für ZH noch NICHT (0/24)** — der ZH-Baum schlüsselt über Ordner-BÄNDER (101–176 …), der N0b-Join über Nummern-PRÄFIXE; braucht den Band-Zweig (LU-Klasse). Gehört zu R9/N0-Nachzug.*

### Teil-eingelöst 31.8.2026 (N0b): das deklarierte Feld existiert jetzt —

        *Teil-eingelöst 31.8.2026 (N0b): das **deklarierte Feld** existiert jetzt — `sachgebietKanton` je kantonalem Erlass, aus dem amtlichen Systematik-Baum gejoint statt aus dem Titel geraten (1187/1231 = 96.4 %). Das ist die Datenseite. **Offen bleiben** die beiden anderen Hälften: (a) das Muster-Raten an den Bestandsstellen zurückbauen, die heute noch Titel lesen, (b) die David-Frage zur Kernklasse. Achtung bei (a): `sachgebietKanton` ist die AMTLICHE Ordnung des jeweiligen Kantons und damit **nicht kantonsübergreifend vergleichbar** — es ersetzt `rechtsgebiet` nicht, sondern steht daneben.*

### K-16 Präzisierung 6.9.2026 (Wortlaut)

**Präzisiert 6.9.2026 (David: «analog für Zürich» = ja, nach Bund):** Reihenfolge Bund (`W2·6c-*`) → BS (data.bs.ch CC BY 4.0, Gesetzesänderungen 100355 mit `change_date`/`version_id`) → ZH; ZH-Pendant = FAHRPLAN-KANTONE §5 Phase IV **R12b** (braucht R3/R7/R12; kein amtlicher Schlüssel Erlass ↔ Vorlage ⇒ Kante `maschinell`; zwei Handgriffe David/OGD-ZH: Feed-Lizenz, Schlüssel erfragen).

### QS-LAGEBILD Sitzung 1 (#765) — Wortlaut der ✅-Zeile *(verschoben 8.9.2026)*

  ✅ Sitzung 1 gelandet 8.9.2026 (#765): Hauptseite auf fünf Klartext-Blöcke (Wo stehen wir · Wartet auf dich mit voller Gate-Prosa · Läuft · Als Nächstes · Erledigt), 1714 → 558 sichtbare Wörter, Bau-Details als eigene Seite, Laien-Band zurückgebaut, Wortbudget-Tor ≤ 600 (Rot-Beweis). *(Der PR-Trailer nannte irrtümlich eine nicht existierende ID `QS-PLAN-EINFACH` — Heimat ist dieser Schritt.)*

### QS-BASIS (d) Suche-Edge-Umzug Kanton — Teilerfolgs-Prosa der Unterzeile *(verschoben 8.9.2026)*

  - [~] **(d) Datenhaltungs-Optimierung — Suche-Edge-Umzug Kanton** (31.8.2026). K0 Nullprobe · K1 Recall-Parität (`fts_artikel` 1→6 Felder, contentless) · K2 Ranking-Parität (topische Stufung IM SQL-Kern; **Befund: bm25 allein reicht nicht — OR 253 lag bei «Miete» auf Rang 128 von 165**, ein Client-Re-Ranking des 50er-Fensters kann das nicht heilen) · K3 Bund-only-Flag **vorbereitet, Default AUS** · K5 Nachführ-Kette · **K6 Fix-Runde nach der Gegenprüfung** (F1–F5, je mit Rot-Beweis): **F1 HOCH — die Landung hätte 502 auf jede Artikel-Query erzeugt** (spalten-gefilterte MATCH gegen die alte Ein-Spalten-Replika; weder die `paths` von `turso-sync.yml` noch der Frische-Wächter sahen je eine Schema-Änderung) → `paths` erweitert **und** DDL-Vergleich als Dimension 0 im Wächter · F2 Spaltenfilter von UND auf ODER (Client-Semantik: «Verjährung Fristen» hebt OR 127 von Rang 8 auf 1, recall-neutral belegt) · F3 echter Byte-Beweis für das K3-Flag · F4 K5-Kette getestet (Naht + Subprozess gegen npm-Stub) · F5 Zweitkopien raus, bm25-Ordnung bewacht. Messungen und Belege: [suche-edge-nullprobe-2026-08-31.md](bibliothek/register/suche-edge-nullprobe-2026-08-31.md), Fix-Runde in [FAHRPLAN-DATENHALTUNG.md](fahrplaene/FAHRPLAN-DATENHALTUNG.md) §16 (K6).

### QS-MONITOR-ROT — §17-Wurzelfix Finding-7-Wanduhr 12.9.2026 (Wortlaut, PR #803)

  - [x] **`check:materialien` Finding 7 war wanduhr-abhängig** (2. Vorfall in 24 h — #789 und
    12.9.2026, VERN-2026-45 fristEnde 2026-09-11 gegen `heute` 2026-09-12) — jeder Tag mit
    abgelaufener Frist färbte die PR-CI rot, ohne dass ein Bau daran schuld war. Wurzel-Fix,
    kein Ausklammern (§6.7): Finding 7 prüft jetzt `fristEnde` gegen das vom Generator
    geschriebene Erhebungsdatum (`r.stand`), nie mehr gegen die Wanduhr — deterministisch,
    kein `Date.now`/`heute` im Kern der Prüflogik (§2). Ergänzt um einen eigenen
    Alterungs-Wächter (einzige verbliebene, benannte Wanduhr-Lesestelle im Tor, mit
    `--datum`-Override deterministisch testbar): das Erhebungsdatum älter als 35 Tage ⇒ rot
    «Nachführung fällig». Rot-Beweise (§6.7, manipulierte Kopie) für beide Äste geführt:
    fristEnde < stand (Datenfehler zum Erhebungszeitpunkt) und Erhebungsdatum > 35 Tage alt.
    Frische-Kreislauf ergänzt: `normen-monitor.yml` fährt den Vernehmlassungs-Generator jetzt
    monatlich (neuer Job `vernehmlassungen`, Cron `11 4 1 * *`, nach BS-Grossrat/vor dem
    Reparatur-Arm) und öffnet bei Änderung einen eigenen PR (kein Auto-Merge, Gegenprüfung
    nachgelagert) — Vorbild Curia-/BS-Monatslauf. Sofort geheilt: Pflegeweg
    `materialien:vernehmlassungen → materialien → gen:zaehler → datenhaltung:manifest` mit
    `--datum=2026-09-12` (Abrufdatum Fedlex-Gesetzgebungs-Graph, SPARQL) gefahren — einziger
    fachlicher Übergang: VERN-2026-45 (AHV 2030) `laufend` → `abgeschlossen-stellungnahmen`
    (Frist 2026-09-11 lief amtlich ab), kein Zu-/Abgang sonst (831 Verfahren, 0 neu/entfernt).
    Kommentar in `fedlex-frische.yml` (offener Punkt seit 5.9.2026, #789) ergänzt (nicht
    überschrieben, §2b) mit dem Lösungs-Verweis. Detail: FAHRPLAN-OFFENE-BEFUNDE.md §2.

  - [x] **Gegenprüfung PR #803 — Auflagen A1–A3 (12.9.2026, selber PR, vor dem Merge):**
    **A1** Deckel 35→45 Tage (ein 31-Tage-Monat + bis zu 5 Tage Gegenprüfung/Merge-Verzug
    riss 35 schon am 6. des Folgemonats) UND K7-Entscheid: der Alterungs-Wächter zog aus
    `check-materialien.ts` in einen eigenen, standalone Tor `check:vernehmlassungen-alter`
    (`scripts/materialien/check-vernehmlassungen-alter.ts`), bewusst NICHT Teil von
    `check:seriell` — sonst hätte er weiterhin fachfremde Aufrufer von `check:materialien`
    (normen-monitor.yml Job `bs-grossrat`, das eigene `npm run check` von fedlex-frische.yml)
    vor deren PR-/Merge-Schritt getötet, genau das K7-Muster von `check:verfall`
    (`scripts/check-tor-paritaet.ts` ALLOWLIST). Einziger Aufrufer: der wöchentliche
    Detektor in `normen-monitor.yml` (Job `normen`, direkt nach `check:verfall`,
    `if: always()`). **A2** `--datum` wird jetzt gegen ISO validiert (`parseDatumArg` in
    der neuen, testbaren `scripts/materialien/vernehmlassungen-tor.ts`) — ein kaputtes
    Format wirft statt `Date.parse` still auf NaN laufen zu lassen und den Check
    lautlos abzuschalten (Rot-Beweis: `--datum=kaputt` lieferte vorher exit 0, jetzt
    exit 1 in beiden Toren). **A3** kein BUND/vernehmlassung-Eintrag ⇒ eigener Fehler
    (`alterungsFehler`) statt stillem Skip. Reine Prüf-Logik (`finding7Fehler`,
    `alterungsFehler`, `parseDatumArg`, `minimum`) jetzt in `vernehmlassungen-tor.ts`
    ausgelagert (Muster `wortfeld.ts`) — dadurch erstmals mit echten Unit-Tests
    (`src/tests/vernehmlassungen-tor.test.ts`) belegt; der ursprüngliche Finding-7-Rot-
    Beweis war ohne Artefakt (nur Konsolen-Log). `check-materialien.ts` liest an KEINER
    Stelle mehr `heute`/`Date.now`. Zwei absolute Sätze präzisiert statt nachgeführt
    (§2b): `fedlex-frische.yml` (Kommentar beim offenen Punkt) und
    `FAHRPLAN-OFFENE-BEFUNDE.md` §2 (Zeile zum Reparatur-Arm-Befund).

### Deckel-Reserven vor ZH (R12b) — Wortlaut vor der Lösung + Lösung 12.9.2026 (PR #802)

  **Ursprünglicher Befund (Wortlaut, bis 12.9.2026 offen):** «Deckel-Reserven vor ZH
  (R12b) — Materialien-Register 332/400 KB gzip (83 %, gemessen 12.9.2026),
  Verfahrens-Ereignisse 85/100 KB (85 %, 407 Ketten); ein ZH-Schritt gleicher Grösse
  wie K-16 BS reisst beide Deckel. Deckel-Strategie (Shard je Kanton oder lazy
  Projektion) klären, bevor R12b baut.»

  - [x] **Gelöst 12.9.2026, PR #802 (`c0acd4557`):** Messung vorab
    (`bibliothek/materialien/2026-09-12-register-deckel-messung.md`) fand den echten
    Treiber — vier Feldgruppen (`sha`, `ereignisse`, `bsKanten`, Join-Felder) gehen an
    JEDEN Browser, ohne dass eine Browser-Zeile sie liest, dazu die FR/IT-Titel, die
    der deutsche Lesefluss nie anfasst. Gewählt: Trennung nach Nutzungszeitpunkt statt
    Shard je Kanton (verworfen — Übersicht/Suche brauchen alle Herkünfte) oder
    Kopf-Index + lazy Detail (verworfen — N Fetches je Kontext-Panel-Aufklappen). Ein
    Generator-Lauf, eine In-Memory-SSoT, drei Projektionen, jedes Feld in genau EINER
    Datei (§5): `register.json` (Kern), `register-i18n.json` (nur locale fr/it),
    `register-provenienz.json` (nie vom Browser geholt). Zahlen gzip: Kern 331,8 →
    118,3 KB (Deckel 400 → **280 KB**, gesenkt nicht angehoben — 42 % Auslastung, ZH-
    Prognose 49 %); i18n neu 83,7/140 KB (60 %); Provenienz neu 92,9/240 KB (39 %);
    Verfahrens-Ereignisse 16,0/60 KB (27 %, jetzt über alle Herkünfte statt nur Bund —
    §17-Nebenfund: der alte Deckel mass nur `botschaften.generated.ts`, die 117
    BS-Ketten aus #799 waren ihm unsichtbar). §15 Logikverlust: keiner — kein
    Verbraucher verliert ein Feld. Tore: `check:entstehung`/`check:datenhaltung`/
    `check:paritaet` (9189 Dateien) grün, `golden:vergleich` 256 Fälle byte-gleich,
    zweiter Generator-Lauf byte-gleich (Determinismus). Messung:
    `bibliothek/materialien/2026-09-12-register-deckel-messung.md`.

### `check:materialien` lokal 7 falsche Shard-Abweichungen — §17-Wurzelfix 12.9.2026 (PR #703-Nachzug)

  **Ursprünglicher Befund (Wortlaut, bis 12.9.2026 offen):** «`check:materialien`
  lokal 7 falsche Shard-Abweichungen (#703) — wenn `daten/soft-law.db` nur die
  gecrawlte Quelle trägt (ARG…VSTG); Tor darf DB-Zustand nur bei vollständig
  geladenen Quellen vergleichen. Zähler «0 Kanten · 0 Downgrades» strukturell 0,
  während der Lauf 3380/1157 zählt (§6.7).»

  - [x] **Nullprobe/Reproduktion 12.9.2026:** `daten/soft-law.db` per
    `seedSoftLawDb` voll aus dem committeten Zustandsträger + den committeten
    Shards aufgebaut (298 Dok-Zeilen · 3372 Kanten), dann auf `ESTV-MWST-%`
    getrimmt (48 · 3091) — simuliert genau den Befund («nur die gecrawlte
    Quelle»). `check:materialien` unmodifiziert darauf ausgeführt: 11 falsche
    ROT-Befunde — 7 Orphan-Shards `ARG.json … VSTG.json` (exakt der im Befund
    genannte Bereich, alphabetisch erste bis letzte der nicht-ESTV-MWST-Shards)
    + 4 «weicht von der Projektion ab» (`MWSTG.json`, `MWSTG/1.json`,
    `MWSTG/2.json`, `MWSTV.json`). Ursache: der `reprojektionsfaehig`-Schalter
    (`kanten.length > 0`) prüfte nur "hat die DB überhaupt Kanten", nicht "hat
    sie ALLE" — eine DB mit EINIGEN Kanten bestand ihn trotzdem und nahm den
    Byte-Reprojektions-Pfad, der die aus dem Teilstand projizierten Shards gegen
    die VOLLSTÄNDIGEN committeten Shards verglich.
  - [x] **Fix:** neuer Vollständigkeits-Marker `pruefeDbVollstaendigkeit` in
    `scripts/materialien/db-vollstaendigkeit.ts` (Muster `vernehmlassungen-tor.ts`
    — reine Prüf-Logik, aus dem vite-node-Entry ausgelagert, damit sie ohne den
    ganzen Lauf testbar ist): jede im Zustandsträger `soft-law-zustand.jsonl`
    'gelistet' geführte id MUSS in der aus der DB geladenen Dokument-Meta
    auftauchen; fehlt auch nur eine, ist die DB nicht reprojektionsfähig.
    `check-materialien.ts` weicht dann — wie im bereits gelösten
    hohle-DB-Fall (Falsch-Rot 21.7.2026) — auf `pruefeCommittedShards` (Direkt-
    validierung der committeten Dateien) aus und protokolliert das als klarer
    HINWEIS (`HINWEIS materialien: … unvollständig geladen …`), nie rot wegen
    lokalem Teilstand, nie still. Zweiter Teil (§6.7-Zähler): die Tor-
    Zusammenfassung («N Kanten · M Downgrades») kam vorher aus der lokalen DB
    und war in JEDEM Fallback-Zweig (CI ohne DB, hohle DB, jetzt auch
    unvollständige DB) strukturell 0 — unabhängig von der Grösse des
    committeten Bestands. Neue reine Funktion `zaehleShardKanten` (selbe Datei)
    zählt Kanten/Downgrade-Kandidaten je Shard-Objekt; `pruefeShardDatei` gibt
    sie zurück, `pruefeShardDrift`/`pruefeCommittedShards` akkumulieren sie —
    die Ausgabe zeigt jetzt in JEDEM Zweig den tatsächlich validierten Bestand
    (im obigen Teilstand-Repro: «2054 Kanten» statt «0 Kanten»; im CI-Pfad ohne
    jede lokale DB ebenso). Downgrades zählen bewusst «heute gegen den
    Revisions-Cutoff verstossende Kanten» (0 in gesundem Bestand — ein echter
    Befund), nicht die während einer Live-Projektion angewandten Downgrades
    (kein committetes Artefakt, siehe `soft-law-projektion-run.ts`).
  - [x] **Rot-Beweis §6.7 (nach dem Fix, im selben Teilstand):** Kopie von
    `public/materialien/kanten/MWSTG/1.json` manipuliert — eine artikelscharfe
    Kante (Art. 18, cutoff-pflichtig laut `REVISIONS_CUTOFF.MWSTG`) auf Stand
    `2020-01-01` (< Cutoff 2025-01-01) gesetzt, Rest unverändert. `check:materialien`
    bleibt trotz unvollständiger DB rot: «Shard …/MWSTG/1.json: artikelscharfe
    Kante Art. 18 mit Stand 2020-01-01 < Cutoff MWSTG (Revisions-Regel §2.4
    verletzt).» Datei danach exakt zurückgesetzt (`git status` sauber).
  - [x] **Tore/Tests:** `check:materialien`, `check:bs-materialien`,
    `check:datenhaltung`, `check:tor-paritaet`, `npx tsc -b`, `lint` grün;
    `npx vitest run src/tests/*materialien*` 16 Dateien/273 Tests grün
    (davon neu `src/tests/db-vollstaendigkeit.test.ts`, 7 Tests). Keine
    Artefakt-Änderung (nur `scripts/materialien/check-materialien.ts` geändert,
    `db-vollstaendigkeit.ts` + Test neu, `daten/` bleibt gitignored/unberührt).

### Gegenprüfungs-Auflagen A1–A3 zu PR #815 (12.9.2026) — Nachzug am selben Tag

  **Auflage (Wortlaut Gegenprüfung, PR #815):** «(A1) Ursachen-Zuschreibung
  korrigieren: die 7 Orphan-Rots stammen aus der Teil-DB, die 4 «Byte-
  Abweichungen» dagegen aus dem `erzeugt`-Stempel — mit voller,
  inhaltsgleicher DB meldet das Tor 11/11 Shards abweichend, Einzeldiff nur
  Zeile 2 `erzeugt`. (A2a) Vollständigkeits-Marker auf die Kanten-Dimension
  erweitern: Gegenprobe — volle Dok-Meta 298/298, aber `norm_referenzen` auf
  ESTV-MWST getrimmt ⇒ Marker sagt «vollständig», Tor liefert die 7 falschen
  Orphans. (A2b) `erzeugt`-Stempel aus dem Byte-Vergleich herausnehmen. (A2c)
  Dieselbe Vollständigkeits-Wache in `soft-law-projektion-run.ts` (schreibender
  Lauf schützt Orphan-Löschung nur mit `kanten.length > 0`) — bei
  unvollständiger DB kein Löschen, klarer Abbruch. (A3) Downgrade-Zähler: in
  grünem Lauf strukturell 0, weil jeder Downgrade zugleich Fehler ist —
  ehrlich formulieren oder streichen, Entscheid begründen.»

  - [x] **A1 (Ursachen-Trennung, per Nullprobe bestätigt):** `daten/soft-law.db`
    per `seedSoftLawDb` VOLL aufgebaut (298/3372, keine Trimmung) —
    `check:materialien` unmodifiziert darauf ausgeführt meldete tatsächlich
    ALLE 11 committeten Shards als «weicht von der Projektion ab», nicht nur
    4. Ursache bestätigt: `register.json` trägt den `erzeugt`-Stempel des
    AKTUELLEN Laufs (z. B. `2026-09-12`), jeder committete Shard seinen
    EIGENEN, historischen (z. B. `2026-08-30` — Shards werden nur bei
    Byte-Abweichung neu geschrieben, nicht bei jedem Register-Lauf). Eine vom
    Vollständigkeits-Befund unabhängige, zweite Falsch-Rot-Klasse.
  - [x] **A2a (zweite Vollständigkeits-Dimension):** neue Funktion
    `pruefeKantenVollstaendigkeit` (`scripts/materialien/db-vollstaendigkeit.ts`)
    neben der bestehenden `pruefeDbVollstaendigkeit` (beide jetzt auf einer
    gemeinsamen `pruefeMengenDeckung`-Primitive) — verlangt, dass jedes
    Dokument mit mindestens einer COMMITTETEN Kante (gesammelt aus den
    Shard-Dateien selbst via neuer, gemeinsam genutzter
    `sammleKantenDokIds()` in `soft-law-projektion.ts`, da der Zustandsträger
    keine Kanten-Zahl je Dokument führt) auch in der DB-Kantenmenge
    (`quelldok_id` aus `norm_referenzen`) auftaucht. Rot-Beweis der
    Gegenprobe reproduziert: `soft_law` auf 298/298 belassen, NUR
    `norm_referenzen` auf `ESTV-MWST-%` getrimmt (3372 → 3091 Kanten) — die
    alte, einzeldimensionale Prüfung hätte «vollständig» gemeldet;
    `pruefeKantenVollstaendigkeit` erkennt die Lücke und `check:materialien`
    zeigt den ehrlichen HINWEIS statt der 7 falschen Orphans.
  - [x] **A2b (Stempel-neutraler Vergleich):** neue Funktion
    `shardInhaltGleich` (selbe Datei) vergleicht zwei Shard-JSON-Strings ohne
    das Feld `erzeugt` (Fast-Path bei Byte-Gleichheit, sonst Parse + Feld
    entfernen + zweiter Vergleich; ungültiges JSON auf einer Seite ⇒
    ungleich, die eigentliche Meldung bleibt bei `pruefeShardDatei`).
    `pruefeShardDrift` nutzt sie jetzt statt rohem `!==`. Rot-Beweis nach dem
    Fix: die A1-Nullprobe (volle, inhaltsgleiche DB) läuft jetzt grün (0
    falsche Abweichungen); ein ECHTER Inhaltsdrift (Unit-Test: unterschiedliche
    Kanten-Werte bei gleichem UND bei unterschiedlichem Stempel) bleibt
    ungleich/rot.
  - [x] **A2c (Wache vor dem schreibenden Lauf):** `soft-law-projektion-run.ts`
    prüft dieselben zwei Dimensionen (importiert aus `db-vollstaendigkeit.ts`)
    VOR dem Register-Schreiben, sobald `kanten.length > 0`; bei Lücke:
    `process.exit(1)` mit Diagnose, KEIN Schreiben, KEIN Löschen. Rot-Beweis
    (auf der A2a-Gegenprobe-DB, danach vollständig zurückgesetzt via
    `git checkout`): die UNGESICHERTE Fassung (`git show HEAD:…` temporär
    eingesetzt) löschte beim Lauf tatsächlich 7 committete Shards
    (`orphan entfernt: …/ARG.json` … `VSTG.json`) und schrieb die
    verbleibenden 4 neu — reale, reproduzierte Beinahe-Datenverlust-Situation
    wie 21.7.2026, nur durch einen Teilstand statt einer leeren DB ausgelöst.
    Die GESICHERTE Fassung bricht auf derselben DB klar ab (exit 1), `git
    status` bleibt auf `public/materialien/` sauber.
  - [x] **A3 (Downgrade-Zähler gestrichen, nicht umformuliert):** Begründung
    (§17-Gegengewicht): die Bedingung, die eine Kante als «Downgrade» zählen
    würde (`braucheDowngrade(...)`), löst in `pruefeShardDatei` IMMER
    gleichzeitig einen `fehler.push(...)` aus — der Lauf wird in demselben
    Moment rot. Der Zähler kann also im einzigen Zustand, in dem er angezeigt
    wird (grüner Lauf), nie einen anderen Wert als 0 tragen — kein Befund,
    sondern ein struktureller Blindwert. Gestrichen statt nur ehrlicher
    beschriftet («0 Downgrades (jeder Downgrade wäre rot)» wäre die
    Alternative gewesen, aber selbst diese Formulierung bewacht einen Zustand,
    der nicht eintreten kann). Die eigentliche Prüfung bleibt unverändert
    scharf; nur die redundante Anzeigezahl fällt weg. `zaehleShardKanten` →
    `zaehleKanten` (nur noch Kantenzahl, kein `braucheDowngradeFn`-Parameter
    mehr).
  - [x] **Tore/Tests (nach allen vier Auflagen):** `check:materialien` zweimal
    hintereinander byte-identisch grün («2054 Kanten · 11 Shards», kein
    Downgrade-Feld mehr); `check:bs-materialien`, `check:datenhaltung`,
    `check:tor-paritaet`, `npx tsc -b`, `lint` grün (0 Fehler);
    `npx vitest run src/tests/*materialien* src/tests/db-vollstaendigkeit.test.ts`
    17 Dateien/286 Tests grün. `git status` nur Code/Test/Doku — `daten/` und
    `public/materialien/` nach jeder Rot-Beweis-Manipulation exakt
    zurückgesetzt (`git checkout` / `rm`).

### Auflage A4 (Entlistungs-Deadlock) zu PR #815 (12.9.2026) — Nachzug am selben Tag

  **Auflage (Wortlaut Delta-Prüfung, PR #815):** «in `soft-law-projektion-
  run.ts:48-70` (und im Tor) ist das Kanten-Soll `sammleKantenDokIds()` = ALLE
  Dokumente mit committeter Kante, auch entlistete. Nach einer Entlistung
  (Kanten + soft_law-Zeile eines Dokuments weg, Rest voll — Prüfer simulierte
  EDOEB-LEITFADEN-WAHLEN-ABSTIMMUNGEN-VERSION-2022) bricht der Generator mit
  exit 1 ab, während `check-materialien.ts:456` für genau diesen Zustand rot
  macht («nicht als 'gelistet'») — der einzige Reparaturweg ist blockiert,
  trifft auch den nächtlichen normen-monitor.»

  - [x] **Nullprobe (Deadlock reproduziert):** volle DB (`seedSoftLawDb`,
    298/3372) gebaut, dann EDOEB-LEITFADEN-WAHLEN-ABSTIMMUNGEN-VERSION-2022
    ECHT entlistet — Zeile in der (lokalen Kopie der) `soft-law-
    zustand.jsonl` auf `status: entlistet` gesetzt UND die Zeilen in
    `soft_law`/`norm_referenzen` entfernt (so wie es `soft-law-snapshot.ts`
    nach einem realen Crawl-Verlust selbst schreiben würde), committeter
    `DSG.json`-Shard unverändert (referenziert das Dokument noch).
    `check:materialien` meldete exakt den zitierten Befund: «Shard …/DSG.json:
    dok-Verweis '…' nicht als 'gelistet' im Zustands-Manifest» (plus
    Folgefehler, weil `register.json` seinerseits noch nicht regeneriert war
    — real und erwartet). `npm run materialien -- --datum=…` (der einzige
    Reparaturweg) brach mit «unvollständig geladen» ab — der Deadlock.
  - [x] **A4-Fix:** `sammleKantenDokIds()` bleibt unverändert (Ground Truth
    aus den committeten Shards), aber BEIDE Wächter (`check-materialien.ts`
    UND `soft-law-projektion-run.ts`) schränken die Menge jetzt vor dem
    Vergleich auf `∩ gelistet` ein — neue Funktion `nurGelistete` in
    `db-vollstaendigkeit.ts`. Begründung im Docstring von
    `pruefeKantenVollstaendigkeit`: ein entlistetes Dokument hat im
    committeten (noch nicht bereinigten) Shard eine Kante, aber weder im
    Zustandsträger noch in einer frischen DB je wieder eine — kein
    Ladefehler, sondern der Normalzustand direkt nach einer Entlistung, den
    der laufende Generator selbst beheben soll.
  - [x] **Rot-Beweis nachher (derselbe präparierte Zustand):** `npm run
    materialien -- --datum=…` lief jetzt durch (`register.json 1680
    Materialien … Shards 11 Datei(en) [11 geschrieben · 0 orphan]`),
    `DSG.json` trägt die Kante des entlisteten Dokuments danach nicht mehr
    (`grep -c` 0 Treffer), `check:materialien` läuft grün («1680 Materialien
    … 2053 Kanten»). Bestehende Rot-Beweise unverändert bestätigt: die
    A2a-Gegenprobe (soft_law voll, `norm_referenzen` auf ESTV-MWST getrimmt,
    KEINE Entlistung) liefert weiterhin den HINWEIS «unvollständig» in
    beiden Wächtern, weil diese Dokumente nach wie vor 'gelistet' sind
    (`∩ gelistet` verändert dort nichts). Alle Manipulationen (JSONL,
    `public/materialien/`, `daten/`) danach exakt zurückgesetzt.
  - [x] **Unit-Tests:** `src/tests/db-vollstaendigkeit.test.ts`, neue
    `describe('nurGelistete …')` mit 4 Fällen inkl. End-zu-Ende-Vergleich
    (`pruefeKantenVollstaendigkeit` ohne vs. mit Filter auf derselben
    Eingabe) — vorher (HEAD vor A4) 4 rot (`nurGelistete is not a
    function`), nachher 17/17 grün.
  - [x] **Nebenfund benannt, nicht behoben (optional laut Auflage):**
    `shardInhaltGleich` (A2b) normalisiert nicht nur den `erzeugt`-Stempel,
    sondern jede reine Umformatierung, die bei gleicher Feldreihenfolge
    keinen semantischen Unterschied hinterlässt — im Docstring vermerkt;
    folgenlos, solange Shards ausschliesslich generiert werden (§2/§5).
  - [x] **Tore/Tests (nach A4):** `check:materialien` zweimal byte-identisch
    grün auf sauberem Baum (`2054 Kanten · 11 Shards`); `check:bs-
    materialien`, `check:datenhaltung`, `check:tor-paritaet`, `npx tsc -b`,
    `lint` grün (0 Fehler); `npx vitest run src/tests/*materialien*
    src/tests/db-vollstaendigkeit.test.ts` 17 Dateien/290 Tests grün.
    `git merge origin/main` sauber. `git status` nur Code/Test/Doku.

## Revisionen: Plausibilitäts-Marker `rectifies`-Notation ≠ eigene (Gegenprüfung #703) — GELÖST 12.9.2026

- [x] **Nullprobe (live, Skill `scraping-swiss-official-sources`, SPARQL):**
  gegen `https://fedlex.data.admin.ch/sparqlendpoint`, abgerufen 12.9.2026 —
  `<eli/oc/2026/448> jolux:classifiedByTaxonomyEntry` → Taxonomie-Notation
  `642.11` (DBG); dieselbe Ressource trägt `jolux:rectifies` →
  `<eli/oc/1996/1445_1445_1445>`, dessen eigene
  `jolux:classifiedByTaxonomyEntry` → `824.0` (ZDG, nicht im Korpus) liefert.
  Der Titel des AS-2026-448-Eintrags nennt explizit «Zivildienstgesetz,
  ZDG). Berichtigung» — der Widerspruch ist damit auf Fedlex-Seite, nicht im
  Generator. Vor der Änderung stand der Eintrag in
  `public/normtext/revisionen/DBG.json` ohne jede Kennzeichnung; es existiert
  kein `ZDG.json` (ZDG ist kein Bund-Volltext-Erlass in `register.ts`), der
  Widerspruch war also nur am Titeltext zu erahnen.
- [x] **Marker (additiv, §6.7):** `baueQueryB` (`scripts/normtext/
  revisionen-generieren.ts`) fragt neu `OPTIONAL { ?oc jolux:rectifies
  ?rectifies }` mit ab. Neue reine Funktion `baueOcZuRectifiesSr(bBindings,
  zielSrProOc)` bildet oc → SR-Notation des berichtigten Erlasses; neue
  Netzfunktion `holeRectifiesSr(ocUris)` löst diese SR-Notationen in einer
  globalen VALUES-Batch auf (Muster wie `holeStaendeA`/`holeBindingsB`).
  `baueRevisionen` erhält den zusätzlichen Parameter `rectifiesSrProOc`
  (Default leere Map, rückwärtskompatibel zu allen Bestandsaufrufen/-Tests)
  und setzt `plausibilitaet: 'widerspruch-fedlex-notation'` +
  `plausibilitaetsGrund` NUR, wenn die aufgelöste rectifies-SR von der SR
  DIESES Erlasses abweicht — Fedlex bleibt Quelle (§7), der Eintrag wird nie
  umgehängt. `shaEintrag` hängt die neuen Felder NUR bei gesetztem Marker an
  den Hash-Input an, damit die sha (und damit der byte-Inhalt) jedes
  unbetroffenen Eintrags unverändert bleibt (§6.7-Auflage, sonst hätte ein
  bedingungslos angehängtes Feld JEDE sha im Korpus verändert). Store-raw
  (`bibliothek/normtext/revisionen-raw/<KEY>.json`) trägt neu
  `rectifiesSrProOc` (Re-Parse ohne Re-Crawl, §11); `check-revisionen.ts`
  liest sie offline für den Determinismus-Check und löst sie im
  `--netz`-Pfad zusätzlich frisch auf (§6.7: sonst könnte
  `holeRectifiesSr`/`baueOcZuRectifiesSr` beliebig kaputtgehen und
  `check:revisionen-netz` bliebe grün) sowie eine neue Schema-Prüfung (8):
  `plausibilitaetsGrund` gdw. `plausibilitaet`, kein unbekannter Marker-Wert.
  Reader (`src/lib/normtext/revisionen.ts`) übernimmt die zwei Felder
  1:1 in `RevisionBezug`; `KontextPanel.tsx` zeigt bei
  `art === 'aenderung'` eine warn-Hinweiszeile — Whitelist auf exakt den
  einen bekannten Wert `'widerspruch-fedlex-notation'`, kein genereller
  Switch (kein Ausbau ohne neuen Befund).
- [x] **Unit-Tests (rot vor Grün, §6.7):** `src/tests/
  normtext-revisionen.test.ts` — 4 neue Fälle für `baueRevisionen`
  (Marker bei SR-Abweichung inkl. Grund-Text mit beiden SR-Nummern, kein
  Marker bei SR-Gleichheit, kein Marker ohne rectifies-Signal, sha
  unbetroffener Einträge byte-identisch mit/ohne leere `rectifiesSrProOc`-
  Map) + 1 für die neue reine Komposition `baueOcZuRectifiesSr`. Rot-Beweis
  per `git stash` nur der Implementierungsdateien (Tests blieben): 2/29 rot
  (`expected undefined to be 'widerspruch-fedlex-notation'`,
  `baueOcZuRectifiesSr is not a function`) — danach `git stash pop`, 59/59
  grün (`normtext-revisionen.test.ts` + `verzahnung-artikel-revisionen.test.ts`).
- [x] **Vollerhebung (korpusweit, live SPARQL):** vollständiger Lauf über
  alle 227 Bund-Volltext-Erlasse fand `jolux:rectifies` an 71 Änderungs-
  Erlassen (70 SR aufgelöst) und **18 Widersprüche in 14 Erlassen**: AIG,
  CHEMRRV, DBG (×3 — AS 2026 448/ZDG-824.0, AS 2024 215/BGS-935.51, AS 2022
  112/OR-220), ELV, MSTG (×2), MWSTV (×2), RVOV, SKV, SSV, STGB, VIL, VVEA,
  VVV, ZPO (je 1, ausser vermerkt). Committet wurden **nur diese 14
  Sidecars** (`--nur=AIG,CHEMRRV,DBG,ELV,MSTG,MWSTV,RVOV,SKV,SSV,STGB,VIL,
  VVEA,VVV,ZPO`, plus deren `bibliothek/normtext/revisionen-raw/*.json`) —
  ein erster ungezielter Vollauf hatte zusätzlich 5 unbeteiligte Erlasse
  (EOV, FAMZV, IVV, VRV, VTS) mit genuinem, aber unverbundenem Fedlex-
  Tagesdrift verändert (neue Amendments seit dem letzten Korpus-Stand,
  0 Bezug zu `rectifies`); dieser Lauf wurde verworfen (`git checkout --`)
  und durch den gezielten `--nur`-Lauf ersetzt, um die Fund-Reparatur nicht
  mit unrelated Datendrift zu vermengen (§1). `normtext:churn-reset`
  bestätigte für die 14 Zieldateien 0 reinen Datums-Churn / 14 mit Substanz.
- [x] **Tore (nackt, alle grün):** `check:revisionen` (227 Sidecars, 5153
  Einträge, Determinismus+Schema+Cross-Link+DSG-Anker), `check:revisionen
  -netz` (Stichprobe DSG/MWSTG/OR/DBG/FZA inkl. frischer rectifies-
  Auflösung — deckt DBG direkt ab), `check:artikel-revisionen` (202
  Erlasse/12947 Artikel synchron), `check:historie` (209 Shards synchron),
  `check:datenhaltung` (Manifest deterministisch, 0 Orphans),
  `check:paritaet` (9194 Dateien byte-gleich aus der DB), `golden:vergleich`
  (256 Fälle IDENTISCH), `npx vitest run src/tests/*revision*` (59/59),
  `npm run lint` (0 Fehler, 1 vorbestehende unabhängige Warnung). Kaskade:
  `check:entstehung` fiel zunächst mit «14 Projektions-Datei(en) decken sich
  nicht mit der Neuberechnung» (exakt die 14 betroffenen Erlasse) — behoben
  durch `gen:entstehung-projektion` + `gen:entstehung-deckung`
  (Deckungs-Sicht unverändert), danach GRÜN; Manifest anschliessend erneut
  über `datenhaltung:manifest` nachgezogen, `check:datenhaltung`/
  `check:paritaet`/`golden:vergleich` erneut grün bestätigt.
- [x] **Fund-Zeile abgehakt:** `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md`.

Whitelist: `scripts/normtext/revisionen-generieren.ts`, `scripts/normtext/
revisionen-generieren-run.ts`, `scripts/normtext/check-revisionen.ts`,
`public/normtext/revisionen/**` (14 betroffene), `public/materialien/
entstehung/**` (Kaskade, 14 betroffene), `daten-manifest.json`,
`src/lib/normtext/revisionen.ts`, `src/components/kontext/KontextPanel.tsx`
(nur Hinweiszeile), `src/tests/normtext-revisionen.test.ts`,
`fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md` (Fund-Zeile), `ROADMAP-CHRONIK.md`.

### Nachtrag 12.9.2026 (Gegenprüfung PR #827, ERGÄNZT — der Eintrag oben ist FALSIFIZIERT, nicht überschrieben, §2b)

**Verdikt: WIDERLEGT.** Der obige Eintrag beschrieb `jolux:rectifies` als
«Fedlex-internen Widerspruch» — live nachgerechnet (Opus-Gegenprüfung,
4/4 Fälle) ist das falsch. `jolux:rectifies` nennt das AS-DOKUMENT, in dem
der fehlerhafte Text ERSTPUBLIZIERT wurde; `classifiedByTaxonomyEntry`
nennt den betroffenen SR-Erlass. Bei einer Berichtigung einer «Änderung
bisherigen Rechts» (Anhangs-Novelle) sind das regelmässig ZWEI verschiedene
Erlasse — ohne jeden Widerspruch:

- AS 2026 448: ZDG-Enactment (AS 1996 1445) änderte im Anhang Ziff. 7 auch
  DBG Art. 124 Abs. 4/133 Abs. 3 → die 2026er-Berichtigung dieser
  DBG-Bestimmungen ist korrekt unter 642.11 klassiert, `rectifies` zeigt auf
  das ZDG-Enactment.
- AS 2023 739 (OR-Anhang Ziff. 5 → StGB Art. 154), AS 2026 284 (MG-Anhang
  Ziff. 1 → MStG Art. 3), AS 2024 144 (Sammelberichtigung SSV direkt + NSV-
  Anhang 4 Ziff. II 6 → SSV Art. 98, Fedlex führt nur EIN `rectifies`), AS
  2025 686 (berichtigt laut Text den eigenen Erlass SR 741.013 —
  `rectifies`-Ziel liegt daneben, ebenfalls kein Fehler).

**Korrekturen (alle committet, Kopf-SHA im PR-Body):**

- (a) Marker umbenannt: `plausibilitaet: 'berichtigung-fremdes-as-dokument'`
  statt `'widerspruch-fedlex-notation'`; Begründungstext neutral
  («… im AS-Text eines anderen Erlasses … erstpubliziert …»), nie mehr
  «Widerspruch»/«widersprüchlich». `KontextPanel.tsx` zeigt die Zeile jetzt
  in `text-ink-500` (neutral), nicht `text-warn-700` (Warnung) — es ist
  keine Warnung.
- (b) Die drei ursprünglichen «Fedlex-interner Widerspruch»-Docstrings
  (`revisionen-generieren.ts` `RevisionEintrag.plausibilitaet`,
  `revisionen.ts` `RevisionBezug.plausibilitaet`,
  `normtext-revisionen.test.ts` Blockkommentar vor dem Test-`describe`) sind
  je mit «FALSIFIZIERT 12.9.2026 (Gegenprüfung PR #827)» + Gegenbeleg
  markiert stehen geblieben, NICHT stillschweigend gelöscht (§2b) —
  darunter die korrigierte Lesart.
- (c) **Deklaration (Auflage c):** `public/normtext/revisionen/SSV.json`
  trägt zusätzlich zum Marker zwei genuine, unverbundene neue Einträge
  (AS 2026 453/458, in Kraft 2026-10-01, `nichtKonsolidiert`) aus dem
  12.9.2026-Lauf — Fedlex-Tagesdrift für SSV, real und korrekt, nicht mit
  dem Marker-Fund zu verwechseln. Alle 14 regenerierten Sidecars tragen
  einheitlich `abgerufen: "2026-09-12"`; die übrigen 213 Sidecars des
  Korpus bleiben unverändert bei ihrem letzten Lauf (`2026-09-05` oder
  älter) — kein Vollauf, nur die 14 vom Fund betroffenen Dateien.
- (d) **Rot-Beweis (§6.7), neue Prüfung (8b) in `check-revisionen.ts`:**
  ein `plausibilitaet` ohne Rückhalt in `raw` (rectifies-Bindung +
  abweichende Fremd-SR) macht den Ast jetzt unabhängig von der
  Determinismus-Prüfung rot. Demonstriert: `AIG.json` manuell mit einem
  unbelegten Marker versehen → `npm run check:revisionen` →
  ```
  check:revisionen ROT: 2 Befund(e):
    - Determinismus: AIG — Neubau aus raw ≠ committetes Sidecar (Nichtdeterminismus oder Handedit).
    - AIG: plausibilitaet gesetzt ohne Rückhalt in raw (rectifies-Bindung/Fremd-SR) bei https://fedlex.data.admin.ch/eli/oc/2026/393.
  ```
  Danach Original wiederhergestellt, `check:revisionen` erneut grün.
- (e) **Determinismus (§2):** `holeRectifiesSr`/`baueOcZuRectifiesSr` wählten
  bei mehreren Treffern je oc bisher «das zuerst gesehene» — abhängig von
  der SPARQL-Antwort-/Bindungsreihenfolge. Beide wählen jetzt IMMER den
  lexikografisch KLEINSTEN Wert (SR-Notation bzw. rectifies-Ziel-URI),
  unabhängig von der Eingabereihenfolge. Neuer Test: gleiche Bindungen in
  beiden Reihenfolgen → identisches Ergebnis.
- Tore erneut nackt grün: `check:revisionen`, `check:revisionen-netz`,
  `check:artikel-revisionen`, `check:historie`, `check:datenhaltung`,
  `check:paritaet`, `golden:vergleich` (256 IDENTISCH), `npx vitest run
  src/tests/normtext-revisionen.test.ts src/tests/verzahnung-artikel-
  revisionen.test.ts` (60/60), `npx tsc -b`, `lint` (0 Fehler). Kaskade
  (`gen:entstehung-projektion`/`gen:entstehung-deckung`) erneut gefahren:
  0 Abweichungen (unverändert, da nur Label/Text-Felder betroffen waren).

### Nachtrag 2, 12.9.2026 (Gegenprüfung PR #827, Auflage f — der Nachtrag oben ist selbst teilweise FALSIFIZIERT, ERGÄNZT statt überschrieben, §2b)

Der erste Nachtrag korrigierte «Widerspruch» zu «Berichtigung mit AS-Fundstelle
im Enactment eines anderen Erlasses» — behauptete dabei aber selbst zu viel:
«erstpubliziert» und «Anhangs-Änderung ‹Änderung bisherigen Rechts›» als
FAKTUM, obwohl das `jolux:rectifies`-Tripel das nicht trägt.

**Gegenbeleg (Auflage f, Fedlex-Filestore, 12.9.2026 abgerufen):** AS 2025 686
(SKV) berichtigt laut Text wörtlich «SKV Änderung vom 15. Oktober 2025
(AS 2025 644; SR 741.013) Art. 24 Abs. 1 Bst. b Ziff. 2» — SKV berichtigt hier
den EIGENEN Erlass. Fedlex' `jolux:rectifies` zeigt für AS 2025 686 aber
FÄLSCHLICH auf `eli/oc/2025/648` (TAFV 2, SR 741.413) statt auf `eli/oc/2025/644`
(die im Text genannte Fundstelle) — ein BELEGTER FEDLEX-DATENFEHLER in der
Verknüpfung selbst, keine Anhangs-Konstellation. Zusätzlich: AS 2024 144 (SSV)
berichtigt laut Fedlex ZWEI Stellen (SSV direkt + NSV-Anhang), ein einzelner
Grund-Satz kann das nie vollständig abbilden.

**Korrekturen (dritte, konservative Fassung):**

- Grund-Text-Template geändert zu: «Fedlex verknüpft diese Berichtigung
  (jolux:rectifies) mit dem AS-Dokument \<Ziel-Fundstelle\>, das unter SR
  \<Fremd-SR\> klassiert ist — häufig, weil die berichtigte Bestimmung im
  Anhang eines anderen Erlasses geändert wurde; massgeblich ist die amtliche
  Sammlung.» — berichtet NUR das Tripel, keine Tatsachenbehauptung
  («erstpubliziert»/«Änderung bisherigen Rechts» als Faktum entfernt).
  `KontextPanel.tsx`-Fallback-Text ebenso angepasst.
- Datenmodell erweitert: `RectifiesInfo { fremdeSr, zielOc, zielFundstelle? }`
  statt reiner SR-String; `holeRectifiesSr` fragt neu zusätzlich
  `historicalId` der Ziel-ocs ab, `baueOcZuRectifiesSr` leitet die
  Ziel-Fundstelle über die bestehende `fundstelle()`-Funktion ab (kein
  Duplikat, §10). `baueRevisionen`s Parameter entsprechend umbenannt
  (`rectifiesInfoProOc`), Store-raw-Feld `rectifiesInfoProOc` (vorher
  `rectifiesSrProOc`) — alle 14 betroffenen raw-Dateien neu geschrieben.
- Generator-Docstring (`RevisionEintrag.plausibilitaet`) trägt jetzt DREI
  Fassungen übereinander (§2b: jede FALSIFIZIERT, keine gelöscht) — die
  zweite («erstpubliziert») ausdrücklich mit Datum + SKV-Gegenbeleg als
  Fedlex-Datenfehler-Klasse markiert.
- Live-Probe SKV bestätigt die Korrektur: `plausibilitaetsGrund` zeigt jetzt
  «AS-Dokument AS 2025 648» (die tatsächliche, wenn auch aus Fedlex-Sicht
  falsche, rectifies-Verknüpfung) statt einer erfundenen
  Anhangs-Interpretation.

**Tore erneut nackt grün:** `check:revisionen` ZWEIMAL hintereinander,
`check:revisionen-netz`, `check:artikel-revisionen`, `check:historie`,
`check:datenhaltung`, `check:paritaet`, `golden:vergleich` (256 IDENTISCH),
`npx tsc -b` (nach `--force`-Neubau, um die Inkrement-Cache-Lücke
auszuschliessen), `lint` (0 Fehler), `npx vitest run
src/tests/normtext-revisionen.test.ts src/tests/verzahnung-artikel-
revisionen.test.ts` (61/61). Kaskade (`gen:entstehung-projektion`/
`-deckung`) erneut 0 Abweichungen. Rot-Beweis (8b) erneut demonstriert
(identischer Ablauf wie Nachtrag 1, neues Schema).

# Umschichtung 14.9.2026 (7) — vier erledigte Schritte aus dem Steuerungsplan

**Anlass:** `check:steuerdeckel` rot. `ROADMAP.md` stand auf `main` (`f6bdd89c7`)
bei 122 875 von 122 880 Bytes — **fünf Bytes Luft**: jede weitere Plan-Zeile,
von welcher Session auch immer, hätte das Tor gerissen. Aufgefallen ist das beim
Doku-PR zur Jules-Suggestions-Sichtung; überführt wird nach `aufraeumen.md` §2
(vollständig und wörtlich, nichts zusammengefasst). Alle vier Schritte tragen
`status: done`, haben keine offenen Unterpunkte und sind von keinem Schritt als
`dep` referenziert.

**Bewusst NICHT überführt**, obwohl ebenfalls `done`: `W2·6c-ENTSTEHUNG-DATEN`,
`W2·6c-ENTSTEHUNG-LESER`, `W2·6c-ENTSTEHUNG-SYNOPSE` und `W2·26-FUNKTIONSZEILE`
— auf sie zeigen `dep`-Einträge lebender Schritte; die Überführung machte
`check:plan` rot («dep existiert nicht»). Sie bleiben im Plan, bis die
Abhängigkeiten aufgelöst sind. **Der Deckel bleibt damit knapp** (~2 KB Luft):
die nächste grössere Umschichtung ist absehbar fällig und braucht dann den
dep-Umbau.


## W2·6c-ENTSTEHUNG-SYNOPSE-LESER — Entstehung am Artikel — Synopse alt/neu in der Änderungskarte *(done, verschoben 14.9.2026)*

- [x] **Entstehung am Artikel — Synopse alt/neu in der Änderungskarte** *(`W2·6c-ENTSTEHUNG-SYNOPSE-LESER`, §14-Intake 11.9.2026)*
  <!-- @meta id: W2·6c-ENTSTEHUNG-SYNOPSE-LESER · status: done · blocker: null · dep: [W2·6c-ENTSTEHUNG-SYNOPSE, W2·6c-ENTSTEHUNG-LESER] · feld: leser · fahrplan: fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md -->
  Ziel: in der Änderungskarte (E3, `EntstehungsBlock.tsx`) je Fassungspunkt den alten Wortlaut aus
  `public/materialien/synopse/<KEY>.json` gegen den geltenden zeigen, nachgeladen erst beim Klick,
  Zustände ehrlich (`ohne_ereignis`-Blöcke als «ohne Fussnoten-Ereignis» gekennzeichnet), §7-Merkmale
  sichtbar (Stand, Quelle, Live-Link), Entwurf↔Beschluss aus `synopse-entwurf/` wo vorhanden. Grenzen:
  kein Prerender-Markup, CLS 0, Deckel unverändert. **Bau erst nach Merge von** `W2·6c-ENTSTEHUNG-SYNOPSE`
  **(PR #794, Stand 11.9.2026: offen).**
  **Detail:** [FAHRPLAN-MATERIALIEN-VERZAHNUNG.md](fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md) §11.5.

## W2·6c-ENTSTEHUNG-QUELLLUECKE — Entstehung am Artikel — Quelllücken in einzelnen Fedlex-Ständen ehrlich zeigen *(done, verschoben 14.9.2026)*

- [x] **Entstehung am Artikel — Quelllücken in einzelnen Fedlex-Ständen ehrlich zeigen** *(`W2·6c-ENTSTEHUNG-QUELLLUECKE`, Auflage A6 Gegenprüfung PR #798, 12.9.2026)*
  <!-- @meta id: W2·6c-ENTSTEHUNG-QUELLLUECKE · status: done · blocker: null · dep: [W2·6c-ENTSTEHUNG-SYNOPSE] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md -->
  Erkennt der Generator, dass eine eId in GENAU EINEM Stand fehlt und danach unverändert
  zurückkehrt (Beleg CHEMRRV `cc/2005/478` @2022-05-01: Art. 4–24 stehen als
  `<mod>`/`<quotedStructure>` eines Anhangs statt als `<article>`, 22 Blöcke darum fälschlich
  «entfallen»/«neu»), bucht er «Quelle unvollständig» statt «entfallen»/«neu»; Karte
  (`SynopseKarte.tsx`) zeigt den Zustand. Lineage-Regel in `neuNach()` über die ganze
  Stände-Kette statt des nächsten Token-Treffers (zweite, andersartige Ursache in derselben
  Ausnahmeliste: AVIV 57b @2021-07-01, echte Token-Kontinuität — bleibt dort, keine
  Quelllücke). Löst die 11 befristeten Ausnahmen in
  `bibliothek/register/entstehung-leerdiff-ausnahmen.json` ab — **fällig vor deren Verfall
  2026-10-12**. **Detail:** [FAHRPLAN-MATERIALIEN-VERZAHNUNG.md](fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md) §11.10.

## W2·26-FUNKTIONSZEILE-ZAEHLER — Bezüge-Zähler in den Erlass-Payload *(done, verschoben 14.9.2026)*

- [x] **Bezüge-Zähler in den Erlass-Payload** *(`W2·26-FUNKTIONSZEILE-ZAEHLER`, D34-Nachfix)*
  <!-- @meta id: W2·26-FUNKTIONSZEILE-ZAEHLER · status: done · blocker: null · dep: [W2·26-FUNKTIONSZEILE] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-DESIGN-IDENTITAET.md -->
  Bezüge-Zähler (Entscheide/Materialien/Verweise/Rechner) in den Erlass-Payload statt eigenem
  Fetch — heute entstehen die Fuss-Zeilen erst in der zweiten Render-Runde. Korpus/Generator ⇒
  **Gegenprüfung Pflicht**, Golden byte-gleich bzw. deklarierter Re-Bless.
  **Detail:** [FAHRPLAN-DESIGN-IDENTITAET.md](fahrplaene/FAHRPLAN-DESIGN-IDENTITAET.md) §9.

## W2·25-ARBEITSMAPPE — Reiter anheften und Arbeitsmappe *(done, verschoben 14.9.2026)*

- [x] **Reiter anheften und Arbeitsmappe** *(`W2·25-ARBEITSMAPPE`, §5a Ziff. 5/9 · R11-M5)*
  <!-- @meta id: W2·25-ARBEITSMAPPE · status: done · blocker: null · dep: [W2·24-DESIGN-IDENTITAET] · feld: design · fahrplan: fahrplaene/FAHRPLAN-DESIGN-IDENTITAET.md -->
  Angeheftete Kürzel-Reiter (OR/ZGB/ZPO, links, ohne ✕, überleben «Alle schliessen») und die
  benannte Arbeitsmappe (offene Reiter lokal speichern/öffnen, als Adresse teilbar,
  deterministisch ohne Konto). **Risiko D16:** Anheften darf keine zweite Anzeige-Ordnung sein,
  sondern muss den flachen Speicher umsortieren — sonst Rückfall in den behobenen Zieh-Bug.
  **Detail:** [FAHRPLAN-DESIGN-IDENTITAET.md](fahrplaene/FAHRPLAN-DESIGN-IDENTITAET.md) §7.

# Umschichtung 15.9.2026 (2) — vier erledigte Schritte aus dem Steuerungsplan

**Anlass:** `check:steuerdeckel` stand auf 13 Bytes Luft (ROADMAP.md 122 867 von 122 880
Bytes). Überführt nach `aufraeumen.md` §2 (vollständig und wörtlich, nichts zusammengefasst).
Vier `status: done`-Schritte ohne offene Unterpunkte und ohne eingehende `dep`-Referenz eines
noch lebenden Schrittes.

**Bewusst NICHT überführt**, obwohl ebenfalls `done`: `W2·6c-ENTSTEHUNG-DATEN` und
`W2·6c-ENTSTEHUNG-SYNOPSE` — der offene Schritt `R12a-ENTSTEHUNG-BS` (status: blocked) trägt
`dep: [W2·6c-ENTSTEHUNG-SYNOPSE]`, und SYNOPSE selbst trägt `dep: [W2·6c-ENTSTEHUNG-DATEN]`;
eine Überführung hätte `check:plan` rot gemacht («dep existiert nicht»). `W2·24-DESIGN-IDENTITAET`,
`W3-TARIF-STAND` und `W3-TARIF-NACHVERIFIKATION` tragen ebenfalls `status: done`, ihre
Elternzeile ist aber bereits in früheren Umschichtungen auf Pointer-Form reduziert UND sie
tragen weiterhin zahlreiche offene `- [ ]`-Unterpunkte (Folgeschritte) — ein Verschieben des
ganzen Blocks zöge lebende offene Arbeit in die Chronik. Bleiben stehen, gemeldet als
Urteilsbedarf.

## W2·6c-ENTSTEHUNG-LESER — Entstehung am Artikel — Leser: Chip mit Fassungszahl, Karte mit Fassungsleiste und Begründung *(done, verschoben 15.9.2026)*

- [x] **Entstehung am Artikel — Leser: Chip mit Fassungszahl, Karte mit Fassungsleiste und Begründung** *(`W2·6c-ENTSTEHUNG-LESER`, 6.9.2026)*
  <!-- @meta id: W2·6c-ENTSTEHUNG-LESER · status: done · blocker: null · dep: [W2·6c-ENTSTEHUNG-DATEN, W2·24-DESIGN-IDENTITAET] · feld: leser · fahrplan: fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md -->
  **Nachgeführt 11.9.2026 (Sichtung §11 Fassung 5):** die Fassung ist seit D40 (#761, 7.9.2026)
  eine Rubrik der Funktionszeile am Artikelende, der frühere Kopf-/Marginalie-Slot ist entfallen;
  die Karte rendert im bestehenden Aufklapp-Block (`.lr7-bez-inhalt`, künftig `Funktionszeile.tsx`)
  — **kein zweiter Slot nötig**, C5/C6 der alten Spec sind damit gegenstandslos. Nichts lädt vor
  dem Klick (Auflage David 6.9.2026). Alle neun slot-verlagernden W2·24-Branches sind auf `main`
  (geprüft 11.9.2026 gegen `git log origin/main`, PR #744–#761).
  Etappe E3. **Detail:** [FAHRPLAN-MATERIALIEN-VERZAHNUNG.md](fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md) §11.

## W2·26-FUNKTIONSZEILE — Funktionszeile am Artikelende überarbeiten *(done, verschoben 15.9.2026)*

- [x] **Funktionszeile am Artikelende überarbeiten** *(`W2·26-FUNKTIONSZEILE`, Mandat David 11.9.2026)*
  <!-- @meta id: W2·26-FUNKTIONSZEILE · status: done · blocker: null · dep: [] · feld: leser · fahrplan: fahrplaene/FAHRPLAN-DESIGN-IDENTITAET.md -->
  Bau läuft seit 11.9.2026 in Worktree `feat/w226-funktionszeile`. Fassung zugeklappt zeigt nur
  «Gilt seit …», Akkordeon je Artikel, Fussnoten-Option blendet auch SR-Nummer-Fussnoten aus,
  Aktionen nur bei Hover/Fokus/offener Rubrik, D45-Split, Umbenennung `BezuegeKopf` →
  `Funktionszeile`. **Detail:** [FAHRPLAN-DESIGN-IDENTITAET.md](fahrplaene/FAHRPLAN-DESIGN-IDENTITAET.md) §9.

## W2·24-PERF-REST — Perf-Rest Leser: `fremdRoutingFormB` / `artikelnPluralVerweise` *(done, verschoben 15.9.2026)*

- [x] **Perf-Rest Leser: `fremdRoutingFormB` / `artikelnPluralVerweise`** *(`W2·24-PERF-REST`)*
  <!-- @meta id: W2·24-PERF-REST · status: done · blocker: null · dep: [W2·24-DESIGN-IDENTITAET] · feld: leser · fahrplan: fahrplaene/FAHRPLAN-DESIGN-IDENTITAET.md -->
  Zwei Fix-Vorschläge aus `abnahme/design-identitaet/PERF-LESER.md` (`fedlex/parser.ts`
  `FREMD_FORM_B`, Aufruf `NormText.tsx`; ~2.3 s). **Die Root-Cause war zum Messzeitpunkt NICHT
  abschliessend verifiziert** — Ziel ist erst verifizieren (misst der gelandete Fix das schon
  weg?), dann fixen; ohne Verifikation kein Eingriff (§7). Risikopfad (`src/lib/fedlex`) ⇒
  **Gegenprüfung Pflicht**, Merge gesperrt bis Verdikt. Messregel: nie neben laufendem Build
  oder e2e (Skill `perf` Bauregel 7).
  - [x] **`check:perf-budget` deckt die Struktur-Sidecars nicht** *(Befund 11.9.2026, #791 — erledigt #874, 15.9.2026: Deckel 95 KB gzip je Sidecar + 175 KB Register)* — `public/normtext/**/struktur/*.json` (vorbestehend, seit #791 um die Zähler-Nutzlast
    gewachsen) läuft ausserhalb der festen Deckel-Liste; eigene Zusicherung nachziehen.

- **Idee (ohne `@meta`, W2·24-PERF-REST 15.9.2026):** Regex-Kosten des Verweis-Linkers (~1.4 s @CPU×4 auf OR); Memoisierung widerlegt (`abnahme/design-identitaet/PERF-LESER.md`, Nachtrag 15.9.) — Hebel liegt in der Regex-Semantik, Risikopfad `src/lib/fedlex`.

## QS-TURSO-SCHREIBVOLUMEN — Turso-Schreibkontingent: Sync bündeln, Unverändertes überspringen, Sperre klar melden *(done, verschoben 15.9.2026)*

- [x] **Turso-Schreibkontingent: Sync bündeln, Unverändertes überspringen, Sperre klar melden** *(`QS-TURSO-SCHREIBVOLUMEN`, Vorfall 15.9.2026)*
  <!-- @meta id: QS-TURSO-SCHREIBVOLUMEN · status: done · blocker: null · dep: [] · feld: betrieb · fahrplan: fahrplaene/FAHRPLAN-DATENHALTUNG.md -->
  Schreibsperre 15.9.2026 (Gratis-Kontingent): Voll-Rebuild je Push (~171 000 Zeilen, 39 Läufe/14 d).
  **Ziel:** täglich EIN Sync, Tabellen-Skip per Signatur, Sperre als Exit 3; Wächter bleiben ehrlich. Lesen nie betroffen.
  **Detail:** [FAHRPLAN-DATENHALTUNG.md](fahrplaene/FAHRPLAN-DATENHALTUNG.md) §17.

# Umschichtung 15.9.2026 (4) — ✅-Teilerfolgs-Prosa `W2·27-BUND-FERTIG` (#888/#889/#892), Fehlerbuch #894, `QS-EFFIZIENZ` dep-Umbau (Wortlaut, Steuerdeckel 120 KB)

Anlass: `check:steuerdeckel` rot nach Session 15.9.2026 (4) (ROADMAP 124,7 KB). Verschoben sind nur
✅-Teilerfolgs-Prosa und erledigte Unterzeilen offener Schritte (aufraeumen.md §2, Ausnahme 22.7.2026);
kein `@meta` berührt. Im Plan bleibt je ein ✅-Einzeiler mit Pointer hierher.

## W2·27-BUND-FERTIG — Randtitel-Doppelmodell auflösen *(Phase-1-Schnitt ✅, offen Phase 2, verschoben 15.9.2026)*
  - [~] **Randtitel-Doppelmodell auflösen** — `NormSnapshot.titel` (Bund 0/25 463) und `struktur.marginalie` (22 223 Artikel) sind zwei Heimaten derselben amtlichen Sache (§5). **Entschieden David 14.9.2026 (Fahrplan §4 c, Option i):** `struktur.marginalie` wird die eine Quelle, `NormSnapshot.titel` Projektion oder entfällt; Kanton migriert Phase 2. Vorbedingung Sidecar-Drift-Riegel: PR #851. *Risikopfad ⇒ Gegenprüfung.* — **Phase-1-Schnitt ✅ 15.9.2026, PR #889 (`d20e3f5d3`, Gegenprüfung bestanden 5a93ac060):** Bund ist faktisch eine Quelle (0/25 463 `titel`); die zwei Inline-Kopien in `leserSuche.ts` laufen über den einen Accessor `artikelRandtitel` (`gliederungsArtikel.ts`), Bund-Wächter + je ersetzte Stelle eine Zusicherung mit Rot-Probe (`randtitel-eine-quelle-w227.test.ts`), `typen.ts` deklariert `titel` als Kanton-Übergangs-Projektion. **Rest Phase 2 (Fahrplan §1.2):** Kanton `titel` → `marginalie`, Suchindex ohne Fallback, NormChip, zweiter Kanton-Parser `struktur-lexwork.ts:317`; Nebenfund Prüfer B3: der `titel`-Zweig ist heute toter Code (alle 17 840 Kanton-Artikel mit `titel` tragen auch `marginalie`) ⇒ evtl. ersatzlos rückbaubar (§17-Gegengewicht); Asymmetrie Fall d/e (Platzhalter-marginalie + titel) wird erst bei Phase-2-Änderung scharf.

## W2·27-BUND-FERTIG — §8-Anzeige der ungeklärten Leerstellen *(✅ PR #892, verschoben 15.9.2026)*
  - [x] **§8-Anzeige der ungeklärten Leerstellen** *(Auflage Gegenprüfung #859)* — der Leser zeigt 98 Bund- und 481 Kanton-Leerstellen ohne Aufhebungsvermerk weiter als «aufgehoben», darunter geltende Änderungsartikel (AVIG 115, BGFA 35, AIG 126f, StGB 108); Ziel: neutraler Hinweis «kein Text im Snapshot» statt «aufgehoben» (deklarierter Re-Bless, `darstellung.ts:307-315`, trifft auch Kanton). Dazu Anhänge/`<section>` ins Aufhebungs-Signal (KKV Anh. 1–3 tragen den Vermerk). — ✅ 15.9.2026, PR #892 (`674cc42ae`, Gegenprüfung bestanden dbe25de86): `artikelLeerstellenStatus(bloecke, markiert) → lebt | aufgehoben | leer-ungeklaert` in `darstellung.ts` (eine Funktion, `artikelGanzAufgehoben` byte-gleich), Leser/Nachbarn/Einzelmodus/Entstehung/Synopse zeigen «kein Text im Snapshot» nur bei leeren Blöcken, «…» bleibt «aufgehoben»; 18 neue Fälle, deklarierter Re-Bless in 5 Alt-Tests. Prüfer-Nebenfund: StGB 67f «Gegenstandslos gemäss …» ist kein Aufhebungs-Signal (nur «Aufgehoben durch») → Signal-Erweiterung `aufhebung-signal.ts` (Zeile Anhänge/Gegenstandslos unten); Bauer-Nebenfund: absatz-genaues Aufhebungs-Signal zur Bauzeit (872 Bund-/~869 Kanton-Absätze pauschal) → eigene Zeile unten.

## W2·27-BUND-FERTIG — §17 `confidence.json` ohne Frische-Tor *(✅ PR #888, verschoben 15.9.2026)*
  - [x] **§17 · `confidence.json` ohne Frische-Tor** *(Wurzel-Befund Prüfer #848)* — das Feld `erzeugt` wird per `--datum` von Hand gesetzt; nichts koppelt es an Korpus oder `daten-manifest.json`, darum alterte die Datei drei Monate unbemerkt. Wurzel-Fix: Tor oder Kopplung ans Manifest, einmal rot zeigen (§6.7). — ✅ 15.9.2026, PR #888 (`3202047ae`, Gegenprüfung bestanden af1d214a3): `report:confidence --schreibe` schreibt `korpus.{quelle,sha}` (= `daten-manifest.json#normtext.db.artikel.sha`), Tor `check:confidence-frische` (in `check:seriell` + CI) wird rot bei fehlendem/abweichendem sha oder Dateizahl (einmal rot gezeigt); Neulauf 1567→1570 Erlasse (AVG/EMRK/EÖBV waren die Staleness). Nebenfund: reine Umbenennung einer Snapshot-Datei bewegt weder sha noch Zahl (schmale Klasse, offen); `korpus.erlasseDateien` totes Duplikat von `zusammenfassung.erlasse` → Rückbau beim nächsten Diff an `check-confidence.ts`.

## W2·18-FEHLERBUCH — Gliederungs-Pfeil klappt teils erst beim zweiten Klick *(✅ PR #894, verschoben 15.9.2026)*
  - [x] **Gliederungs-Pfeil klappt teils erst beim zweiten Klick** *(David 15.9.2026, Chat: «zum teil klappt pfeil erst beim zweiten klick auf»)* — ✅ 15.9.2026, PR #894 (`fb0ab0249`). Nicht reproduzierbar (0/112 Klicks); Wurzel war ein per Artikel-Sprung geöffneter, gegen das Auto-Akkordeon ungeschützter Ast (`springeZuArtikel` verbuchte ihn nicht als manuell — jetzt eine Ast-Buchhaltung `sprungAst.ts`, Rot-Probe belegt) plus Klickziel 16×16 → 24×24 px (`--tap-ziel`) und eine Standort-Marke bei font-weight 400 statt 500 (Tailwind-Regelfolge `.font-normal` nach `.font-medium`). Marke jetzt 3-px-Strich über volle Zeilenhöhe + `brass-100`-Fläche (Strich↔Leiste 8,26:1 hell / 10,62:1 dunkel).

## QS-EFFIZIENZ — ROADMAP-Deckel bleibt knapp, `dep`-Umbau *(✅ PR #896, verschoben 15.9.2026)*
  - [x] **ROADMAP-Deckel bleibt knapp — nächste Umschichtung braucht einen `dep`-Umbau** *(Messung 14.9.2026)* — `main` stand bei 122 875 von 122 880 Bytes (fünf Bytes Luft); vier erledigte Schritte sind in die Chronik überführt (Umschichtung 14.9.2026 (7)), vier weitere `done`-Schritte **können nicht** wandern, weil lebende Schritte `dep` auf sie halten (`W2·6c-ENTSTEHUNG-DATEN`/`-LESER`/`-SYNOPSE`, `W2·26-FUNKTIONSZEILE`). Wurzel-Kandidat: `dep` auf erledigte Schritte auflösen oder `check:plan` erledigte `dep`-Ziele aus der Chronik akzeptieren lassen. **Erledigt 15.9.2026 (PR dieser Session, Schritt `QS-EFFIZIENZ`):** Wurzel-Kandidat (b) gebaut — `chronikErledigte` in `scripts/plan/parse.ts`, `check:plan` Regel 4/4c, `resolve()`/`plan:next`, `plan:bild` und `plan:set` akzeptieren ein `dep`-Ziel, das in `ROADMAP-CHRONIK.md` als `done` archiviert ist; `ROADMAP.md` gewinnt bei Doppel-Fundstellen, ein Archiv-Eintrag mit `status != done` und ein mehrdeutiges Archiv sind rot (Rot-Beweis: `src/tests/plan-check.dep-chronik.test.ts`). Erste Anwendung: `W2·6c-ENTSTEHUNG-DATEN`/`-SYNOPSE` und `W3-TARIF-NACHVERIFIKATION` überführt (Chronik, «Umschichtung 15.9.2026 (dep-Umbau)»), 120 788 → 119 487 Bytes.

# Umschichtung 17.9.2026 — `QS-BEWAEHRUNG` (Wortlaut, Steuerdeckel 120 KB)

Anlass: `check:steuerdeckel` rot nach Buchung Session 17.9.2026 (ROADMAP 122,1 KB). Verschoben ist ein
vollständig erledigter Schritt ohne offene Unterzeilen (aufraeumen.md §2); kein lebender `dep` zeigt
auf `QS-BEWAEHRUNG`.

## QS-BEWAEHRUNG — Bewährungs-Messung für Tore, Hooks und Regeln *(✅, verschoben 17.9.2026)*
- [x] **Bewährungs-Messung für Tore, Hooks und Regeln** *(`QS-BEWAEHRUNG`, Entscheid David 15.9.2026)*
  <!-- @meta id: QS-BEWAEHRUNG · status: done · blocker: null · dep: [] · feld: betrieb -->
  Ziel: der §17-Kreislauf bekommt ein Fitness-Signal für sich selbst. (1) Tor-Bewährungs-Register
  plus Auswerter: je `check:*`-Tor und Hook das Datum des letzten echten Rot (CI-Import + Fang-Vermerke);
  nie rot in 90 Tagen ⇒ Rückbau-Kandidat nach §17-Gegengewicht, Liste bei jeder Chronik-Überführung.
  (2) Wiedervorlage-Datum für Prosa-Regeln (CLAUDE.md, Skills, Lehren-Register), Wächter meldet Überfällige.
  (3) Prozess-Kennzahlen mit Verlauf (Zeilen CLAUDE.md/Skills, Tore, Hooks, Prozess-Commit-Anteil)
  je Chronik-Überführung fortgeschrieben. (4) STANDARDS S1 gilt auch für `bibliothek/betrieb/`:
  Tor-Schleife erweitert, Altbestand nachgetragen. Grenzen: kein Agent ändert Tore oder Regeln
  selbständig — der Auswerter schlägt vor, David entscheidet; kein Risiko-Pfad.
  **Detail:** [rekursive-selbstverbesserung-gegenueberstellung-2026-09-15.md](bibliothek/betrieb/rekursive-selbstverbesserung-gegenueberstellung-2026-09-15.md) §8.

# Umschichtung 18.9.2026 — erledigte Schritte/Teilerfolge aus dem Steuerungsplan

Anlass: `check:steuerdeckel` rot nach Buchung (ROADMAP 123 081 B = 120,2 KB > 120 KB). Verschoben
sind ausschliesslich datierte ✅-/`[x]`-Teilerfolgs-Zeilen aus offenen Schritten (aufraeumen.md §2);
kein `@meta` eines lebenden Schrittes berührt, keine offene `[ ]`-Zeile angefasst. Im Plan bleibt je
Gruppe ein ✅-Einzeiler mit Pointer hierher.

## W2·5m-LESER-V3 — D0/S1/S2 Teilerfolge *(✅, verschoben 18.9.2026)*
  - [x] **D0 · Farb-Vorarbeit** — ✅ 16.8.2026, PR #534 (`47f805423`); Wächter-Ausbau #680 (`0cffc695a`).
  - [x] **S1 · Historie-Modell** — ✅ 17.8.2026, PR #547 (`2538dd356`).
  - [x] **S2 · Typografie + Artikel-Raster** — ✅ 17.8.2026, PR #550 (`afc008c19`), F3 = V2 (17 px / lh 1.55).

## W2·20-VERWEIS-SCHAERFE — V-7 Bund-Rest: Trägergesetz-Kontext + Kurztitel-Positivliste *(✅ PR #864, verschoben 18.9.2026)*
  - [x] **V-7 Bund-Rest: Trägergesetz-Kontext + Kurztitel-Positivliste** — ✅ erledigt 14.9.2026, PR #864 (`6fb37368b`); Gegenprüfung bestand im Kern und **widerlegte die Vollständigkeit** (drei Befunde, im PR nachgezogen). 197 belegte Stellen; darunter **97 «des Gesetzes»-Glieder in Verordnungen, die bis 14.9.2026 FALSCHE Self-Links trugen** (Link auf die Verordnung statt aufs Trägergesetz) — §1-relevant, im Fehlerbuch §4 als behobener Falschlink-Fall geführt.

## W2·27-BUND-FERTIG — KKV-Label `Art. 126z` statt `Art. 126ztredecies` *(✅ PR #890, verschoben 18.9.2026)*
  - [x] **KKV-Label `Art. 126z` statt `Art. 126ztredecies`** *(Nebenfund Prüfer #851)* — ✅ 15.9.2026, PR #890 (`682edb070`, Gegenprüfung zweimal bestanden 390ed4917/a93c616c8): Label aus dem Fedlex-`<sup>` (`doppel-id-label.ts`), `quelleUrl` auf den amtlichen Anker `#ta126z` (`amtlicherAnker()`, Live-Nachweis Playwright); `tredecies` in `ART_SUFFIXE`. Rest: `__N`-Deep-Link, Label-Drift-Tor (Zeilen unten).

## QS-KORPUS — Kernerlasse-Lücken Bund schliessen + confidence.json veraltet *(✅ PR #860/#848, verschoben 18.9.2026)*
  - [x] **Kernerlasse-Lücken Bund schliessen** — ✅ erledigt 14.9.2026, PR #860 (`6a67f01be`); Gegenprüfung **mit Auflage bestanden**, Auflage im PR nachgezogen. EMRK (SR 0.101), EÖBV (SR 211.435.1) und AVG (SR 823.11) liegen als Fedlex-Snapshots vor. **Status «entwurf» — die fachliche Abnahme macht David** (§7, Zeitsperre 1.12.2026).
  - [x] **`public/normtext/confidence.json` veraltet** *(Befund PR #668, 4.9.2026)* — ✅ erledigt 14.9.2026, PR #848 (`90cb59fff`); geführt unter `W2·27-BUND-FERTIG`. Offen bleibt dort die Frische-Kopplung (§17).

## QS-FREMDAGENTEN — Fremd-PR-Tor Kommentar-MULTIMENGE + Suggestions abgeschaltet *(✅ PR #862, verschoben 18.9.2026)*
  - [x] **Fremd-PR-Tor vergleicht die Kommentar-MULTIMENGE** — ✅ erledigt 14.9.2026, PR #862 (`d61193dbe`): Regel 3b prüft die getrimmten Kommentarzeilen zeichengleich (`comm -23` leer), nicht mehr nur die Summe. Anlass: #855 baute die Summe nach einer Ablehnung exakt zurück (580 → 580) und verfälschte dabei trotzdem vier Zeilen.
  - [x] **Proaktiver Kanal «Suggestions» abgeschaltet** *(Entscheid David 14.9.2026 — Wortlaut, Zahlen und Begründung: Fahrplan §6 D8, Messwerte §5)* — 76 unaufgeforderte Vorschläge, am Code geprüft: 3 belastbar (~4 %), 0 gestartet; die drei Funde als Schritt `QS-CODE-LFZ-GRENZE` eingeordnet. Jules bleibt für auftragsgebundene Tickets verbunden.

## W2·24-DESIGN-IDENTITAET — acht Nachwunsch-Teilerfolge *(✅, verschoben 18.9.2026)*
  - [x] **L6 · PaneKopf-Name** — ✅ gelandet 7.9.2026 (PR #746, `d32e5bf80`), Protokoll `L6-PANEKOPF.md`.
  - [x] **Leerer 34-px-Reiterstreifen auf «/»** — bleibt (David 7.9.2026, wie empfohlen).
  - [x] **ZGB-Reiter am Dokumentanfang** — «ZGB» bleibt (David 7.9.2026, wie empfohlen).
  - [x] **Orchestrator-Entscheide 7.9.2026 bestätigt** (D33 A · D32 · N1 · N4 · R13; David «alles wie empfohlen»).
  - [x] **D45 · Entscheid-Klick in der Fusszeile öffnet daneben** — ✅ umgebucht 11.9.2026 nach `W2·26-FUNKTIONSZEILE`. Detail: `FAHRPLAN-DESIGN-IDENTITAET.md` §9 Z5.
  - [x] **«Daneben öffnen» in der Funktionszeile** — entfällt (David 7.9.2026, D44 #760: Aktion bewusst entfernt; Erlass-Kopf behält «Daneben öffnen»).
  - [x] **Bezüge-Zähler in den Erlass-Payload** *(D34-Nachfix, Korpus ⇒ **Gegenprüfung Pflicht**)* — ✅ umgebucht 11.9.2026 als eigener Schritt `W2·26-FUNKTIONSZEILE-ZAEHLER`.
  - [x] **OR-Leser trägt 15'239 Knöpfe im DOM** *(§15, seit F1 sichtbar)* — ✅ umgebucht 11.9.2026 nach `W2·26-FUNKTIONSZEILE`. Detail: `FAHRPLAN-DESIGN-IDENTITAET.md` §9 Z6.

## W2·17-UI-BEFUNDE — B9/B10/B15/B16 geschlossen *(✅, verschoben 18.9.2026)*
  - [x] **B9 · Textsatz und Umbruch (K-12)** — 12/12 geschlossen (Fahrplan §10, Nachzug Häkchen 13.9.2026).
  - [x] **B10 · Aktions-Anker, Symbolknöpfe, Trefferflächen (K-09b)** — 7/7 geschlossen 4.9.2026 (Fahrplan §11, Nachzug Häkchen 13.9.2026).
  - [x] **B15 · Umschalter, Tabs, Akkordeons (K-06)** — 9/9. §16. · **B16 · Seitengerüst/Inhaltsbreite (K-13)** — 8/8. §17. *(Nachzug Häkchen 13.9.2026)*

# Umschichtung 19.9.2026 — `QS-ORG-UMZUG` erledigt (Merge-Queue steht), Herleitung aus `QS-CI-MINUTEN`

Anlass: der Org-Umzug ist vollzogen (Repo `LexMetrik/Whatever`, Merge-Queue-Ruleset 23699779 aktiv,
erster Durchlauf #922/#917 am 19.9.2026), und ROADMAP.md steht über dem 120-KB-Steuerdeckel.
Verschoben sind ein vollständig erledigter Schritt ohne offene Unterzeilen (aufraeumen.md §2) und die
erledigte Beleg-Prosa des offenen Schrittes `QS-CI-MINUTEN` (✅-Teilerfolg, Ausnahme 22.7.2026).
Kein lebender `dep` und kein `@queue`-Eintrag zeigt auf `QS-ORG-UMZUG`; der Blocker
`david-entscheid-org-umzug` ist mit dem Schritt aus dem `@blockers`-Register entfallen.

## QS-ORG-UMZUG — Repo in eine GitHub-Organisation überführen (Merge Queue) *(✅, verschoben 19.9.2026)*
- [x] **Repo in eine GitHub-Organisation überführen (Merge Queue)** *(`QS-ORG-UMZUG`)*
  <!-- @meta id: QS-ORG-UMZUG · status: done · blocker: null · dep: [] · feld: betrieb -->
  Erst, wenn der Auto-Nachzug (Checklisten-Zeile unter `QS-AUTOMATIK`) nicht reicht. **Stand 19.9.2026 (erledigt):** er reicht nicht (#914 und #892 je ein bzw. vier zusätzliche volle CI-Läufe), und David will die Merge-Queue («ja», 19.9.2026) — offen ist nur noch der Umzug selbst: Organisation anlegen und Repo übertragen macht David (Konto-Handlung), die ~1 h Nacharbeit (Vercel, Branch-Schutz, Secrets, Remote-URLs, Queue-Ruleset) die Session.
  - [x] **DAVID (Ja 19.9.2026, Anleitung im Chat):** (1) Gratis-Organisation `lexmetrik` anlegen (Name am 19.9. frei), (2) Repo `Whatever` per Settings → Transfer ownership dorthin übertragen, Namen NICHT ändern, (3) Vercel → Settings → Git prüfen. Vorher der Session Bescheid geben (keine Landung im Flug). — ✅ 19.9.2026: Organisation `LexMetrik` (Free, public) angelegt, Repo als `LexMetrik/Whatever` übertragen, Vercel-Git-Anbindung geprüft.
  - [x] **Session danach:** Merge-Queue-Ruleset auf `main` (SQUASH, ALLGREEN, Timeout 60 min — CI braucht ~20 min) und `strict` im klassischen Branch-Schutz AUS (die Queue zieht selbst nach) · `git remote set-url origin` auf `lexmetrik/Whatever` (ein `.git` für alle Worktrees) · Test-PR bis Deploy-Job grün · Secrets `AUTOMERGE_TOKEN`/`PLAN_BUCHUNG_TOKEN` am nächsten Lauf prüfen — feingranulare PATs mit Eigentümer `davidgraf95-sys` verlieren den Zugriff, Neuanlage kann nur David · Skill `landung` auf Queue-Betrieb nachführen (`gh pr merge --auto` reiht ein; `update-branch`-Nachzug und `landung-kette.sh`-Halt entfallen — §17-Rückbau) · `BETRIEB.md:13`/`PROJEKTBESCHRIEB.md:4` nennen noch die alten Repo-Namen `LegalCalc`/`LexMetrik`, tatsächlich `Whatever` — mitkorrigieren. — ✅ 19.9.2026: Ruleset 23699779 (SQUASH, ALLGREEN, max 3 Einträge, Timeout 60 min, keine Bypass-Akteure), `strict` AUS; erster Durchlauf #922 (`06489b10c`) + #917 (`9b125ce8e`) gemeinsam gelandet 15:05:00Z, `merge_group`-Lauf 35449369984 alle vier Required grün (inkl. Perf-Budget), Push-Lauf 35450690297 Deploy grün, live `lexmetrik-build=9b125ce8`. Remote-URLs, `BETRIEB.md`/`PROJEKTBESCHRIEB.md` (`aed15a7b8`) und die Skills `landung`/`bauschritt`/`auftrag` nachgeführt; `AUTOMERGE_TOKEN`/`PLAN_BUCHUNG_TOKEN` stehen als eigene Zeile unter `QS-BASIS` zur Prüfung am Lauf vom 21.9.2026.
  **Detail:** [entregulierung-2026-08-07.md](bibliothek/betrieb/entregulierung-2026-08-07.md).

## QS-CI-MINUTEN — «Offen: Merge Queue (Gate)», Beleg-Prosa *(✅-Teilerfolg, verschoben 19.9.2026)*

Wortlaut, wie er bis zum 19.9.2026 in `ROADMAP.md` stand (die Frage «persönliches Repo kann keine
Merge Queue» ist mit dem Org-Umzug beantwortet; im Plan bleibt eine Kurz-Zeile mit Verweis hierher):

  Gebaut 8.9.2026: M1–M5, Flacker-Wächter (Melde-Modus bis 22.9.2026, dann hart), Ergebnis-Job, Playwright-Install-Retry — Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (3); Regeln: Skill `landung` §«Prüfstrasse seit 8.9.2026». **Nachmessung 8.10.2026.** Offen: Merge Queue (Gate) — **Beleg 18.9.2026:** PR #914 war mit allen Toren grün, zündete aber nicht, weil die Parallel-Session während der ~20 min Prüfzeit nach `main` landete ⇒ `BEHIND`; `gh pr update-branch` kostete einen VOLLEN zweiten CI-Zyklus (4 Playwright-Schichten à 16–20 min). Präzedenz #892 (15.9., fünf Läufe aus demselben Grund; die Lehre damals behandelte mit `landung-kette.sh` nur das Symptom). Wurzel: bei zwei parallel landenden Sessions und «branch up to date» verliert der langsamere PR das Rennen strukturell — die Merge-Queue serialisiert und zieht den Zweig selbst nach. **David 19.9.2026: «ja zur merge warteschlange»** — der Schalter ist aber auf einem PERSÖNLICHEN Repo nicht setzbar (gemessen: GraphQL kennt `requiresMergeQueue` nicht, Ruleset-API antwortet 422 `Invalid rule 'merge_queue'`); die CI trägt den `merge_group`-Auslöser bereits. Weg: `QS-ORG-UMZUG` (Repo in eine Gratis-Organisation) · Wurzel der 6 flackernden Specs (Fehlerbuch §4, bis 22.9.) — **einer davon ist am 14.9.2026 gelöst**: die D16-Spec war kein Test-Flake, sondern ein Ladezeit-Race der App (PR #865, `a57e4698a`; Fehlerbuch §4.R4). Entscheide David 8.9.2026 (Weg A, M2) ebenfalls in der Chronik.

## Vier BEHIND-Zeilen, durch die Merge-Queue erledigt *(✅, verschoben 19.9.2026)*

Wortlaut, wie er bis zum 19.9.2026 in `ROADMAP.md` stand; im Plan bleibt je ein ✅-Einzeiler mit
Verweis hierher (aufraeumen.md §2, Ausnahme datierte ✅-Teilerfolgs-Prosa aus offenen Schritten).

- `W2·18-FEHLERBUCH`: **Plan-Buchungs-Commit wirft wartende Auto-Merge-PRs auf BEHIND** *(§17-Prozessfund 13.9.2026, PR #843)* — `plan-buchung.yml` schreibt nach jedem Merge einen `[skip ci]`-Commit auf main; bei `strict`-Schutz fällt jeder offene Auto-Merge-PR auf BEHIND und kostet Rebase + vollen CI-Lauf (~25 min). Wurzel-Fix: der Buchungs-Workflow aktualisiert danach alle offenen PRs mit aktivem Auto-Merge (`gh pr update-branch`), oder Merge-Queue (David-Handgriff, offen). Bis dahin: nach jeder Landung sofort rebasen.
- `QS-BASIS`: **§17 BEHIND-Schleife durch Plan-Buchung** *(Befund Parallel-Session 2.9.2026, an einer Nacht mit 5 offenen PRs belegt)* — jeder Squash-Merge erzeugt via `plan-buchung.yml` einen Folge-Commit auf main (`[skip ci]`), der alle offenen PRs sofort BEHIND setzt; bei «up to date»-Pflicht kostet jede Landung damit einen zweiten vollen CI-Lauf (15–20 min). Wurzel-Kandidaten: Buchung im PR-Branch vor dem Merge statt auf main, oder Merge-Queue (`QS-ORG-UMZUG`, David-Entscheid). Bis dahin: Landungen zwischen Sessions ansagen, je Seite genau ein Nachzug.
- `QS-CI-MINUTEN`: Wurzel `strict: true` ⇒ Merge Queue (`QS-ORG-UMZUG` unten, Gate G7).
- `QS-CI-MINUTEN`: **Plan-Buchungs-Commit macht jede wartende PR BEHIND** *(Befund 11.9.2026, #791/#793)* — geführt unter `QS-BASIS` («§17 BEHIND-Schleife durch Plan-Buchung»), dort zusammen mit der teureren Schwester DIRTY (14.9.2026). Hier nur als CI-Minuten-Posten: ein zusätzlicher Volllauf je Landung.

Erledigt am 19.9.2026 durch das Merge-Queue-Ruleset 23699779 (`strict` AUS — die Queue zieht den
Zweig selbst nach, BEHIND kostet keinen zweiten Volllauf mehr). Offen bleibt allein die Plan-Buchung
selbst (Zeile «Plan-Buchung: messen, dann zurückbauen» unter `QS-CI-MINUTEN`) und die teurere
DIRTY-Schwester vom 14.9.2026 unter `QS-BASIS`.

### Streichung 19.9.2026

- **`QS-CI-MINUTEN` / «Plan-Buchungs-Commit macht jede wartende PR BEHIND»** — gestrichen 19.9.2026:
  der Posten war schon bei seiner Anlage (11.9.2026) ein Zweitzeiger auf die `QS-BASIS`-Zeile «§17
  BEHIND-Schleife durch Plan-Buchung»; mit der Merge-Queue ist die Sache dort erledigt, ein zweiter
  Eintrag derselben Wahrheit (§5) steuert nichts mehr. Wortlaut oben archiviert.

# Umschichtung 19.9.2026 (2) — `QS-MONITOR-ROT`: drei Teilerfolge (rectifies-Tor R2, Curia-Kaskade, Materialien-Kaskade)

Ausnahme 22.7.2026 (datierte ✅-Teilerfolgs-Prosa aus einem noch OFFENEN Schritt — `QS-MONITOR-ROT`
bleibt `status: ready`, weitere Unterzeilen offen); im Plan bleibt je ein ✅-Einzeiler mit Verweis
hierher (aufraeumen.md §2).

## QS-MONITOR-ROT — rectifies-Tor Runde 2 *(✅-Teilerfolg, verschoben 19.9.2026)*

  - [x] **rectifies-Tor Runde 2 — blockiert JEDEN Fedlex-Frische-PR** *(Gegenprüfung #909, 18.9.2026; Risikopfad)* — der Automatik-Lauf materialisiert erstmals `belegteOcs`/`rectifiesInfoProOc` (latent seit #827): Kanten 31 → 82, vier neu rot: KRK `oc/2026/314` (Staatsvertrags-Headline → ∅), OR `oc/2023/62` (Fussnotenzeichen «AS 2020 4005 ¹»), VZAE `oc/2026/170` (Ziel = cc-Abstract, Klassifikationslücke), **LRV `oc/2025/448` echte Abweichung** (Text AS 1992 124 vs. Ziel AS 1986 208 — amtlich einordnen, nie raten). Mit bauen (Auflagen #908): 0-Treffer-Fall eigene Meldung «keine Headline erkannt — zuerst Parser prüfen, NICHT Ausnahmeliste» (`check-revisionen-rectifies.ts:121`; genau diese Meldung legte am 18.9. die falsche Fedlex-Fehler-Spur) · nicht konsumierte Einträge in `rectifies-ausnahmen.json` melden (§6.7, Docstring verspricht es) · Phantom «(AS 2015 5699, 2022; …)» → `AS 2015 2022` (`rectifies-berichtigung.ts:118`) · Test-Eingabe `:423` erzeugbar machen · bei `sammelberichtigung` den treffenden Block statt der Vereinigungs-SR zeigen. Danach #909 bzw. den Folge-PR der Automatik landen (Verdikt-Kommentar am PR #909; bringt auch den VRV/VTS-Pflegetermin 1.10.2026 statt 1.1.2031). — ✅ 19.9.2026, PR #926 (`c9e2e32cb`): Parser-Lücken KRK/OR/VZAE + BPV-Fussnotenfalle, LRV `oc/2025/448` und KLV `oc/2026/209` als amtlich belegte Fedlex-Fehlziele in `rectifies-ausnahmen.json`, Auflagen #908 B-1..B-5, Fugen-Falsch-Grün (Fuzz alt 2 251 / neu 0), Obergrenze 20 nicht-abrufbar. Dossier: `bibliothek/normtext/rectifies-tor-runde2-2026-09-19.md`.

## QS-MONITOR-ROT — Curia-Vista-Monatsjob + Materialien-Kaskade *(✅-Teilerfolg, verschoben 19.9.2026)*

  - [x] **Curia-Vista-Monatsjob rot: Kaskade fehlt im Workflow** *(Lauf 35373415150, 18.9.2026)* — `normen-monitor.yml` Job `curia` fährt nach `materialien:curia` direkt `check:entstehung`; die Deckungs-Sicht (`public/materialien/deckungs-sicht.json`, 1 Abweichung zur Neuberechnung) wird nie regeneriert ⇒ Job scheitert VOR dem PR-Öffnen, der Monatsabgleich kommt nie an. Fix: `gen:entstehung-projektion` + `gen:entstehung-deckung` vor die Offline-Tore (gleiche Klasse wie #907; am besten über das Kaskaden-Skript der nächsten Zeile). Offen dazu: Automatik-PR #913 (BS-Monatslauf) braucht Gegenprüfung wie #909. — ✅ 19.9.2026, PR #921 (`2db154675`): alle drei Monats-Jobs fahren `entstehung:projektion-kaskade` + `check:entstehung`; Nachweislauf 35457303103: Vollabgleich, Teilkaskade, Vorflug-Prüfung grün — Job-Rot nur noch am Schritt «PR eröffnen» (Token-Befund, `QS-BASIS`). #913 war zu diesem Zeitpunkt bereits gelandet (`135ec0cba`, Identitätsbeleg data.bs.ch); #909 lag mit Verdikt «bestanden» vor, war aber noch nicht eingereiht.
  - [x] **Materialien-Kaskade als EIN Skript** *(analog #907)* — nach `materialien:botschaften`/`:vernehmlassungen`/`:bs`/`:snapshot`: `gen:entstehung-deckung`, Revisionen-Sidecar (`botschaftIndex()`-Cross-Link, `check:revisionen`), Zähler, Manifest zuletzt; heute undokumentiert (ein Bau-Agent erklärte das Folge-Rot zum «Vorbestand», Gegenmessung widerlegte es). Raw-Caches (`botschaften-raw`, `vernehmlassungen-raw`, `revisionen-raw`) sortiert + literal-normalisiert schreiben — je Lauf 100–220 Dateien Schein-Diff. — ✅ 19.9.2026, PR #921 (`2db154675`): `scripts/entstehung/projektion-kaskade.ts` als letztes Glied der bestehenden `materialien:kaskade`. Die Raw-Caches-Sortierung ist nur für BS (`vergleicheBsDokumente`) mitgelöst — übrige Caches bleiben offen, eigene Zeile unten.

## QS-CI-MINUTEN — drei erledigte Merge-Queue-Nachweise *(✅, verschoben 19.9.2026, Steuerdeckel-Ausgleich)*

  - [x] **Ersten reinen Doku-Eintrag in der Queue beobachten** — ✅ 19.9.2026, #931: `merge_group`-Lauf 35456359531 klassiert «Reiner Doku-Queue-Eintrag (2 Dateien)», Bau/Shards/Perf-Budget `skipped`, Tore + Merge-Schutz + Browser-Smoke (Ergebnis) grün, Laufzeit ~1 min, gelandet `951382d26` — ein übersprungenes Perf-Budget zählt in der Queue als erfüllt, kein Hänger.
  - [x] **`scripts/landung/landung-kette.sh` real gegen die Queue fahren** *(19.9.2026)* — ✅ 19.9.2026 mit PR #919: eingereiht 15:59Z, `mergeQueueEntry.state` gepollt, MERGED `661612cea` 16:29:21Z, Zweig von GitHub selbst gelöscht, Exit 0. **Nur der Gut-Pfad ist real belegt**; die Halte-Pfade (UNMERGEABLE, verschwundener Eintrag, GraphQL-Fehler) sind weiterhin nur simuliert (Simulation a–g, 377ea3c11).
  - [x] **Erster `merge_group`-Lauf der neuen Klassierung** — ✅ 19.9.2026, Lauf 35454618928 (#927): Compare `95cb5a712…a5734fb86` (Basis = Queue-Commit des Vordermanns #925, nicht main), 19 Dateien, `art=code`, alle vier Required grün.

---

# Umschichtung 2026-09-20 — erledigte Schritte und Teilerfolgs-Prosa aus dem Steuerungsplan

Anlass: Re-Akkumulations-Wächter meldet `ROADMAP.md` GELB (141.6 KB > Budget 120 KB).
Ausnahme 22.7.2026 (datierte ✅-Teilerfolgs-Prosa aus einem noch OFFENEN Schritt —
`W2·5m-LESER-V3` bleibt `status: ready`, die übrigen Unterzeilen offen); im Plan bleibt
je ein ✅-Einzeiler mit Verweis hierher (aufraeumen.md §2). Erledigte SCHRITTE wurden
in dieser Umschichtung KEINE überführt — die beiden `done`-Schritte
`W2·24-DESIGN-IDENTITAET` und `W3-TARIF-STAND` halten zusammen 15 offene
`- [ ]`-Unterposten; eine vollständige Überführung nach aufraeumen.md §2 hätte diese
offene Steuerung mitgenommen. Auflösung (Umbau zu offenen Schritten oder Herauslösen
der Unterposten) ist ein eigener Entscheid, keine Aufräum-Bewegung.

## W2·5m-LESER-V3 — Gliederung: Standort, unterste Ebene, Auf/Zu-Handling *(✅-Teilerfolg, verschoben 2026-09-20)*

    - [x] **Gliederung «noch schlecht» — Standort und unterste Ebene** *(Befund David 19.9.2026)* — ✅ 19.9.2026: gemessen = Anzeige (Art.-Ebene `art@` lief mit Zeilenzustand auseinander) + Daten (SVG-Randtitel «Grundregel»); Anzeige #924, Daten #923 (Gegenprüfung bestanden). Detail: Session-Karte STRUKTUR.md 19.9.2026 (2).

    - [x] **Erledigt 19.9.2026:** Auf/Zu-Handling + Befund David 19.9. («svg art. 26 nicht ersichtlich … unterste ebene klappt nicht auf», Nachtrag «auch das aufklappen soll optimiert werden») — Zeilen-Offen-Zustand aus dem Sichtbaren abgeleitet (`zeilenAnsicht`), alle ausdrücklichen Öffner über `klappKarte.ts` inkl. Artikel-Ebene, ein Klick öffnet ganz, «alles auf» öffnet die Artikel, Marke nach Sprung auf dem Artikel; Wächter `gliederung-sichtbarkeit.test.ts` (vorher 11/12 rot, u. a. 4'690 offen-leere Zeilen). Daten-Teil SVG-Randtitel «Grundregel» PR #923 (Gegenprüfung bestanden).

## Nachtrag 2026-09-20 (2) — die beiden `done`-Köpfe folgen nun doch, nach Herauslösung ihrer offenen Unterposten

Der Absatz am Kopf dieses Blocks («Erledigte SCHRITTE wurden in dieser Umschichtung KEINE
überführt …») bleibt unverändert als Beleg des damaligen Stands stehen — Belege altern nicht,
sie werden ergänzt. Entscheid David 20.9.2026: die 15 offenen `- [ ]`-Unterposten werden aus den
beiden `done`-Köpfen herausgelöst, weil ein `done`-Kopf sie für `npm run plan:next` unsichtbar
macht — darunter Davids eigene Fachfrage zur Verjährungsrevision 2020. Sie stehen seit dem
20.9.2026 in vier neuen offenen Schritten in `ROADMAP.md`:

| neuer Schritt | `feld` | Posten | Herkunft |
|---|---|---|---|
| `W2·24-C` — Design-Identität: offene Nachzüge nach der Landung | design | 4 | `W2·24-DESIGN-IDENTITAET` |
| `W2·24-PERF-REST` — Leser-Kopf: Rest-CLS und Mount-Messung | design | 2 | `W2·24-DESIGN-IDENTITAET` |
| `W3-TARIF-FOLGE` — Tarif-Stammdaten: Folgeschritte und Datenhygiene | werkzeuge | 7 | `W3-TARIF-STAND` |
| `W3-RECHTSSTAND-WEICHE` — Rechtsstand als echte Weiche in den Rechen-Engines | werkzeuge | 2 | `W3-TARIF-STAND` |

Die IDs `W2·24-C` und `W2·24-PERF-REST` sind keine Neuerfindung: `fahrplaene/FAHRPLAN-DESIGN-IDENTITAET.md`
§8 führt beide bereits als «eigene Schritte» — die Herauslösung löst damit nur ein, was der
Fahrplan seit 7.9.2026 vorsah. Gestrichen wurde nichts; die Gegenzählung 15 = 4 + 2 + 7 + 2 steht
im Bericht der ausführenden Session. Danach wandern die beiden nun leeren Köpfe vollständig
hierher — Checkbox, `@meta`, Prosa und ihre bereits erledigten Unterposten:

## W2·24-DESIGN-IDENTITAET — Design-Identität: eigene Farb- und Schrift-Handschrift *(done, verschoben 2026-09-20)*

- [x] **Design-Identität: eigene Farb- und Schrift-Handschrift** *(`W2·24-DESIGN-IDENTITAET`, David 5.9.2026)*
  <!-- @meta id: W2·24-DESIGN-IDENTITAET · status: done · blocker: null · dep: [] · feld: design · fahrplan: fahrplaene/FAHRPLAN-DESIGN-IDENTITAET.md -->
  ✅ **erledigt 7.9.2026 (PR #739, e2ac7def9)** — Handschrift «Sammlung»: R1–R13 samt Nachzügen, Gesamtprüfung
  (Ästhetik + Funktions-Inventar 90 OK / 0 verloren), Reglement §F0. Protokolle
  `abnahme/design-identitaet/`; Zielbeschreibung: ROADMAP-CHRONIK.md, Umschichtung 7.9.2026.
  **Nachwünsche 7.9. (Tag):** 16 weitere PRs #744–#761 (D34–D44, D35-F1…F4, L6, R13B, R14, R14b) —
  Tabelle Thema/PR/SHA/Protokoll in STRUKTUR.md, Abschnitt «Nachwünsche 7.9.» (zuletzt #761 ae32c5c4e).
  **Detail:** [FAHRPLAN-DESIGN-IDENTITAET.md](fahrplaene/FAHRPLAN-DESIGN-IDENTITAET.md) §1 — Stand je Runde dort in §6, Folgeschritte in §8.
  - [x] **Bezüge-Zeile: Kopfzähler gefiltert/ungefiltert** — ✅ entschieden und gebaut 11.9.2026. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (6).
  - [x] **Erledigt:** L6 PaneKopf-Name · Reiterstreifen/ZGB-Reiter (bleiben) · Orchestrator-Entscheide 7.9. bestätigt · D45/«Daneben öffnen»/Bezüge-Zähler/OR-Leser-Knöpfe (umgebucht nach `W2·26-FUNKTIONSZEILE`) — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 18.9.2026.
  - [x] **Orchestrator-Entscheide vom Tag 7.9. — David 7.9.2026 «alles bestätigt»:** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 8.9.2026 (Landung)).
  - [x] **Budget-Entscheid Entry 99,5 %** (59.7 / 60.0 KB) — ✅ David 19.9.2026 «Kopfbereich budget heben»: Entry-Budget 60 → 70 KB (`scripts/check-perf-budget.ts`); der react-dom-Rückfall bleibt über die Zeichenketten-Prüfung gefangen.

## W3-TARIF-STAND — Tarif-Stammdaten: Stand maschinenlesbar + Drift-Tor *(done, verschoben 2026-09-20)*

- [x] **Tarif-Stammdaten: Stand maschinenlesbar + Drift-Tor** *(`W3-TARIF-STAND`, Rules-as-Code-Sichtung 5.9.2026, Entscheid David 5.9.2026)*
  <!-- @meta id: W3-TARIF-STAND · status: done · blocker: null · dep: [] · feld: werkzeuge -->
  ✅ gelandet 6.9.2026 (#734) — Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 7.9.2026. Die offenen
  Folgeschritte darunter bleiben unverändert stehen.
  **Detail:** [rules-as-code-sichtung-2026-09-05.md](bibliothek/recherche/rules-as-code-sichtung-2026-09-05.md) §6.

# Umschichtung 2026-09-20 — erledigte Unterpunkte (mechanisch)

Wörtlich aus ROADMAP.md herausgelöst (`npm run plan:posten -- migrieren`, QS-EFFIZIENZ,
Posten-Modell). Kein Satz ist umformuliert; reine Zeiger-Stubs auf diese Datei sind
ersatzlos entfallen und im PR einzeln aufgeführt.

## W2·7-VZUI

  - [x] **Erledigt:** Grundzustand-Fetch · `?norm=`-Sprung · vierter Reiter «Anwendung» — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 7.9.2026 (2).

## W2·22-VERWEIS-FEDLEX

  - [x] **Erledigt:** Z1 · Z2 · Z3 · Z5 — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 7.9.2026 (2).

## W2·27-BUND-FERTIG

  - [x] **Erledigt 14.9.2026 (Phase-1-Welle, alle vier Risikopfad-PRs mit bestandener Gegenprüfung):** Sollbild + Messung (elf Bausteine, Fahrplan §1/§2) · Sidecar-Drift-Riegel 216/228 **und** KKV-Token `126_z__2` — #851 (`6c4f9fa2f`) · `aufgehoben` strukturell statt Text-Heuristik, 0 → **1 277/25 463**, Wächter `check:leerstellen` — #859 (`d16acf466`) · `confidence.json`-Neulauf (Qualitätsbild 23.6. → 14.9.2026) — #848 (`90cb59fff`) · Zukunftsfassungen-Hinweis im Leserkopf — #863 (`7f5aa592e`). **Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (6).**
  - [x] **§8-Anzeige der ungeklärten Leerstellen** *(Auflage Gegenprüfung #859)* — ✅ 15.9.2026, PR #892 (`674cc42ae`, Gegenprüfung bestanden dbe25de86): «kein Text im Snapshot» statt «aufgehoben». Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 15.9.2026 (4).
  - [x] **§17 · `confidence.json` ohne Frische-Tor** *(Wurzel-Befund Prüfer #848)* — ✅ 15.9.2026, PR #888 (`3202047ae`, Gegenprüfung bestanden af1d214a3): Tor `check:confidence-frische`. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 15.9.2026 (4).
  - [x] **KKV-Label `Art. 126z` statt `Art. 126ztredecies`** *(Nebenfund Prüfer #851)* — ✅ 15.9.2026, PR #890. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 18.9.2026. Rest: `__N`-Deep-Link, Label-Drift-Tor (Zeilen unten).

## W2·5l-NORMTEXT-B2

  - [x] **Erledigt:** M15 (absorbiert in `W2·6c-ENTSTEHUNG-DATEN`) — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 7.9.2026 (2).

## QS-CURRENCY-KANON

  - [x] **Erledigt 12.9.2026:** Pin `erv` html-6 → kanonisch html-7 (#806, `56d33dae8`; Korrektur in der Gegenprüfung: **textgleich, Markup abweichend** — 224/224 Artikel-SHAs) · `QS-CURRENCY-KANON-FRISCHE` (#808, `datenhaltung:manifest` läuft unbedingt, Pin-Identitäts-Sonde) — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (6).

## QS-MONITOR-ROT

  - [x] **Nach Token-Tausch (David): Normen-Monitor per `workflow_dispatch` erneut fahren** — ✅ 20.9.2026: Lauf 35513728588, Curia-Job vollständig grün (Vollabgleich · Teilkaskade · Vorflug · «PR eröffnen» ⇒ #939), ebenso BS (#936) und Vernehmlassungen (#937, beide reiner Datums-Churn, geschlossen). Offen: Fedlex-Frische Mo 21.9.2026 04:43 UTC eröffnet ihren PR selbst? — nachsehen.

## W2·17-UI-BEFUNDE

  - [x] **Erledigt:** B6-N1 · B6-N2 · B7-N1 — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 7.9.2026 (2).
  - [x] **Erledigt:** B9 (12/12) · B10 (7/7) — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 18.9.2026.
  - [x] **Erledigt:** B15 (9/9) · B16 (8/8) — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 18.9.2026.

## W2·18-FEHLERBUCH

  - [x] **Gliederungs-Pfeil klappt teils erst beim zweiten Klick** *(David 15.9.2026)* — ✅ 15.9.2026, PR #894 (`fb0ab0249`): Ast bleibt nach Sprung offen (`sprungAst.ts`), Klickziel 24 px, Marke; Rest `W2·5m-LESER-V3`. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 15.9.2026 (4).
  - [x] **Plan-Buchungs-Commit wirft wartende Auto-Merge-PRs auf BEHIND** *(13.9.2026, #843)* — ✅ 19.9.2026, Merge-Queue (`strict` AUS). Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 19.9.2026.
  - [x] **Reiterleiste-Wellen 1–3** — ✅ 13.9.2026, PR #842/#843/#844 (+ Nachzug R8-Sweep mobil); Specs Fahrplan §4.R/§4.R2/§4.R3. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (6).

## QS-UI

  - [x] **Erledigt:** Marken-Präfix im Leser · pfadgebundene Wächter — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 7.9.2026 (2).

## QS-CODE-PROP

  - [x] **Gefixt 12.9.2026, PR #820, Gegenprüfung ausstehend — nicht gemergt:** `nichtKonsolidiert`-Marker bei Staatsverträgen falsch-positiv (FZA) — Wurzel-Fix + Vollerhebung siehe [ROADMAP-CHRONIK.md](ROADMAP-CHRONIK.md).

## QS-EFFIZIENZ

  - [x] **ROADMAP-Deckel steht dauerhaft gelb** *(Messung 18.9.2026)* — ✅ 20.9.2026, Posten-Modell (`plan:posten`, `check:plan` 16): 140 Unterposten als eigene Dateien herausgelöst, ROADMAP −44 KB. Damit ist auch der Konflikt-Hotspot Nr. 1 der Merge-Queue entschärft (50 % Berührungsquote, 4 von 10 Queue-Rauswürfen `merge_conflict`). Befund im Wortlaut: 120,6 KB bei Session-Start, 132,1 KB nach zwei parallelen Sessions, 130,0 KB nach einer Teil-Überführung in die Chronik; Budget 120 KB. Seit dem Entscheid David 18.9.2026 (#905) blockiert der Deckel nicht mehr, **darum wächst er unbemerkt weiter** — die Warnung allein ändert kein Verhalten. Fällige Chronik-Überführung nach Skill `bauschritt` → [aufraeumen.md](.claude/skills/bauschritt/aufraeumen.md): erledigte Unterpunkte lebender Dach-Schritte auslagern (nicht nur `done`-Schritte), je mit Zeiger-Zeile. Als eigener Schritt fahren, nicht nebenbei — die Auslagerung muss `check:plan` und die `dep`-Auflösung intakt lassen.
  - [x] **Hebel ROADMAP-Grösse: Befund-Prosa in die Fahrpläne** *(David 18.9.2026, vorgemerkt)* — ✅ 20.9.2026 ANDERS gelöst als vorgemerkt: nicht Auslagern in die Fahrpläne mit Kurzzeilen-Stub (das kostete die Sessions Mehrarbeit, Vorgabe David 20.9.2026), sondern eine Datei je Posten. Ursprünglicher Befund: 54 % der Datei sind offene Zeilen (64 KB; Erledigtes 0,4 KB): lange `[ ]`-Befundzeilen in den Detail-Fahrplan des Dachs, hier je Kurzzeile + `**Detail:**`-Zeiger (Skill `auftrag` Ziff. 1), danach automatisierbar. ROADMAP-Deckel seit 18.9. nur Warnung (`struktur-rotieren.py` NUR_WARNUNG). Daneben: Vault-Eintrag `lexmetrik-lektionen` — UI-/Code-Konventionen ins Reglement, dann archivieren.
  - [x] **ROADMAP-Deckel bleibt knapp — nächste Umschichtung braucht einen `dep`-Umbau** *(Messung 14.9.2026)* — ✅ 15.9.2026 (PR #896, `d26dbbac6`): `check:plan` akzeptiert erledigte `dep`-Ziele aus der Chronik. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 15.9.2026 (4).
  - [x] **Session-Notizen-Datei (Nebenfunde/Lehren überleben Kompaktierung und Übergabe)** — erledigt 15.9.2026, PR #891

## QS-FREMDAGENTEN

  - [x] **Erledigt:** Phase 0 · Pilot Jules · Diskrepanz-Finder — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 7.9.2026 (2).
  - [x] **Erledigt:** Fremd-PR-Tor Kommentar-MULTIMENGE (PR #862) — ✅ 14.9.2026. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 18.9.2026.

## QS-VERWENDEN

  - [x] **Erledigt:** V1 · V1b · V2 · V3 · V4 · V5 · V6 · V8 — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 7.9.2026 (2).

## Umschichtung 20.9.2026 — `@queue` auf fünf Einträge

**Entscheid David 20.9.2026** (Prozess-Messung, Leitlinie «Prozess verschlanken»): die `@queue`
trägt nur noch die nächsten 3–5 Schritte. Messung: 11 der 22 Einträge standen 90 Tage unberührt,
und nur 21 % der Bau-Trailer zeigten überhaupt auf einen Queue-Eintrag — die lange Liste war
Absichtserklärung, keine Reihenfolge. Was nicht in der Queue steht, ordnet die Dokumentreihenfolge
(Produkt-Felder vor `Betrieb & Prüfstrasse`); nachgefüllt wird, wenn der Kopf erledigt ist.

Die Queue lautete bis dahin im Wortlaut (die ersten fünf bleiben stehen):

`W2·27-BUND-FERTIG, W2·5l-NORMTEXT-B2, QS-KORPUS, W2·20-VERWEIS-SCHAERFE, W2·22-VERWEIS-FEDLEX,
W2·5m-LESER-V3, QS-PERF, W2·5n-BUND-VOLL, W2·21-ZULIEFERER, W2·6d-VERFAHREN-RECHERCHE,
W2·6d-PARLAMENT-ARTIKEL, W2·13-KANTONE-DATEN, W2·13-KANTONE-DRIFT, W3·12, W2·5g-ZEIT,
W2·14-SIGNAL, W2·6, W2·6d-BOTSCHAFT-TEXT, W2·6d-BULLETIN-VOTEN, W2·6d-URSPRUNG,
W2·6d-ENTSTEHUNGSNOTIZ, W2·6d-VERNEHMLASSUNG-DOKUMENTE`

Die Phasen-Prosa im ROADMAP-Kopf (Phase 1 Bund → 2 Kantone → 3 Mehr als Fedlex) bleibt unverändert
und trägt die grobe Reihenfolge weiter; die fünf verbliebenen Einträge sind der Kern von Phase 1.

## Umschichtung 20.9.2026 (2) — zwei stille Schritte werden Ideen-Zeilen

**Entscheid David 20.9.2026** («mach 5 und 6 wie empfohlen»), Verfahren nach Skill `auftrag`
Ziff. 1 («Über der Plan-Kapazität → Ideen-Zeile ohne `@meta`») und `aufraeumen.md` Ziff. 3.
Nachmessung: von den Phase-3-Schritten sind genau diese zwei echte Kandidaten — 90 Tage ohne
Trailer- oder PR-Nennung, nicht in der `@queue`, kein `dep:` darauf, kein junger David-Auftrag.
Sie verlieren ihr `@meta` und stehen fortan als Ideen-Zeilen am Ende des Feldes `rechtsprechung`;
die Bau-Specs in den Fahrplänen bleiben unberührt und bleiben verlinkt.

Wortlaut der beiden Blöcke, wie sie bis zum 20.9.2026 in `ROADMAP.md` standen:

```
- [ ] **Kantonaler Norm-Resolver → Kantonalnorm-Buckets (P0-Kern)** *(`W2·6-RESOLVER`)*
  <!-- @meta id: W2·6-RESOLVER · status: ready · blocker: null · dep: [] · feld: rechtsprechung · fahrplan: fahrplaene/FAHRPLAN-RECHTSPRECHUNG.md -->
  `norm-index` füllt heute nur Bundesnorm-Buckets; der Resolver ist Voraussetzung der kantonalen
  Stufe. Risikopfad-Dach der Rechtsprechungs-DATEN.
  **Detail:** [FAHRPLAN-RECHTSPRECHUNG.md](fahrplaene/FAHRPLAN-RECHTSPRECHUNG.md) §13.

- [ ] **Sachgebiet-Facette an der Norm↔Entscheid-Kante** *(`W2·7-VZUI-SACHGEBIET`)*
  <!-- @meta id: W2·7-VZUI-SACHGEBIET · status: ready · blocker: null · dep: [] · feld: rechtsprechung · fahrplan: fahrplaene/FAHRPLAN-VERZAHNUNG-UI.md -->
  Deterministisch aus der amtlichen BGE-Bandnummer I–V (§2, keine Heuristik). Extraktion =
  Risikopfad ⇒ Gegenprüfung.
  **Detail:** [FAHRPLAN-VERZAHNUNG-UI.md](fahrplaene/FAHRPLAN-VERZAHNUNG-UI.md) §12.
```

**Der eine offene Posten wurde nicht geschlossen, sondern umgehängt.**
`plan/posten/2026-09-20-richternamen-gegen-den-staatskalender-aufloesen.md` hing unter
`W2·6-RESOLVER`; ein Posten unter einem toten Dach macht `check:plan` Regel 16 (a) rot. Statt ihn
zu schliessen (das hätte einen offenen Befund unsichtbar gemacht) trägt er jetzt das Dach `W2·6`
(«Konsultieren-Klingen», `feld: rechtsprechung`, `status: ready`) — dieselbe Fläche, derselbe
Fahrplan-Strang, der Befund bleibt offen und zählbar. `W2·7-VZUI-SACHGEBIET` trug keinen Posten.

**Offengelegte Abweichung (§7):** der ROADMAP-Text von `W2·6-RESOLVER` nannte sich selbst
«Voraussetzung der kantonalen Stufe», und `fahrplaene/FAHRPLAN-ENTSCHEIDSUCHE-AUSBAU.md` §64 nennt
ihn den «bauenden Schritt dieser Spec»; `fahrplaene/FAHRPLAN-RECHERCHE-KOMFORT.md` §82 führt ihn als
Andockpunkt. Ein maschineller `dep:`-Eintrag besteht nirgends, und kein lebender Schritt wartet auf
ihn — die kantonale Rechtsprechungs-Stufe selbst liegt in Phase 3. Die Verweise zeigen weiterhin auf
denselben Namen, der als Ideen-Zeile in der ROADMAP sichtbar bleibt; ein späteres Wiederöffnen
heisst, die `@meta`-Zeile oben wörtlich zurückzustellen.


## Verworfen 21.9.2026 — Mutter/Tochter-Bauprozess (Entscheid David)

Zwei Test-Durchläufe am 21.9.2026 (eine orchestrierende «Mutter»-Session legt je Bau-Ding einen
Chip an, David startet damit eine «Tochter»-Session, die eigenständig baut und mit Artefakten
meldet). Zwischenstand «kleine Fassung» (PR #967) am selben Abend zurückgebaut — David: «es soll
alles nicht noch komplizierter werden» · «ok, bau es zurück». **Standard bleibt: eine Session baut
ein Ding; Serien über den Übergabe-Chip.**

Zahlen (Listenpreis-Äquivalent USD, je `message.id` entdoppelt; David zahlt den Max-Plan):
Durchlauf 1 ≈ 285 (Töchter 94 + 52, Mutter 57, ihre Unteragenten 82; Mutter-Kontext 626k, ~12
David-Entscheide, Chip→live 3,5 h / 2,8 h) · Durchlauf 2 ≈ 75–78 (Töchter 23,0 + 24,5, Mutter
17,5, Unteragenten 9,7; Kontext 314k, 2 Klicks, 0 Entscheide, 1 h 39 / 1 h 48, davon > 50 % CI).
Gegenrechnung an Tochter A: Orchestrierung 11,3 (Opus-Tochter) vs. ≈ 11,7 (dieselben Züge in der
Fable-Mutter) ⇒ **kostenneutral**; die Mutter-Schicht kostete ≈ 27 von 75 obendrauf. Grund der
Verwerfung: kein Kostenvorteil, n = 2, eine zusätzliche Schicht für zwei seltene Fälle (zwei
parallele Bau-Dinge kann David selbst starten; Verlaufs-Sprengung löst der Übergabe-Chip).

**Behalten, weil sie ohne Mutter wirken:** Prüf-Rezept im Skill `gegenpruefung` (§Praxis-Rezept;
Beleg PR #963: zwei blockierende Lücken, die jedes Tor passiert hätten) · Posten Verbrauchs-Summe
als npm-Script (Skript: `plan/posten/anhang/2026-09-21-verbrauch-summe.py`) · Posten
`aufraeumen:git` «nur meine». Die erprobte Chip-Vorlage steht in der git-Historie
(`docs/token-oekonomie/tochter-chip-vorlage.md`, PR #967); die Messprotokolle liegen lokal unter
`<Haupt-Checkout>/.claude/notizen/archiv/2026-09-21-*`.


## Geschlossen 22.9.2026 — vier Posten und eine David-Frage (Recherche-Buchung)

Entscheide David 22.9.2026 im Chat; die Posten-Dateien liegen im Wortlaut unter `archiv/posten/`.
Belegkette zu allem Übrigen:
`bibliothek/recherche/legal-design-und-korrektheits-recherche-2026-09-21.md` Ziff. 20.

**1. `2026-09-19-jules-github-app-in-der-organisation-lexmetrik-installiert.md` (QS-BASIS).**
Wortlaut David: «jules ist nicht installiert». *Begründung: Frage beantwortet.* **Folge, die
bleibt:** auftragsgebundene Jules-Tickets (grüne Spur, Skill `auftrag` Ziff. 6) laufen in der
Organisation derzeit NICHT — bis zu einer Installation, die allein David vornehmen kann und die er
nicht angekündigt hat, werden keine Jules-Tickets angelegt. Suggestions sind seit 14.9.2026
ohnehin aus.

**2. `2026-09-20-steuerdeckel-entscheid-scripts-check-ts-david.md` (QS-EFFIZIENZ).**
Wortlaut David: «alten posten schliessen». *Begründung: überholt durch die am selben Tag
freigegebene einmalige Streich-Runde* (`plan/posten/2026-09-21-einmalige-streich-runde-nie-fuendige-tore-loeschen-council-2.md`),
die denselben Streichkandidaten-Bereich mit einem schärferen Massstab abdeckt.

**3. `2026-09-20-monatlicher-abbau-vorschlag-aus-tor-bewaehrung-ab-dezember-2.md` (QS-EFFIZIENZ).**
Wortlaut David: «schliessen». *Begründung: widerspricht dem Council-Verdikt und dem Nordstern vom
22.9.2026 — «Produkt vor Prozess», keine Wiederholung als Ritual.* Der monatliche Rhythmus war
selbst der Prozess-Zuwachs, den die einmalige Streich-Runde vermeiden soll. **Gerettet, nicht
verloren:** die dort genannte Vorbedingung — der Fang-Scanner-Bug in der Bewährungs-Erhebung, ohne
dessen Behebung `messwerte/tor-bewaehrung.json` falsch zählt und ein wirksames Tor gestrichen
werden könnte — steht jetzt als Vorbedingung im Streich-Runden-Posten.

**4. `2026-09-20-automerge-token-getauscht-…` (QS-BASIS).**
Wortlaut David: «schliessen». *Begründung: gegenstandslos — der Posten hing am direkten
Hauptzweig-Push von `.github/workflows/plan-buchung.yml:282`, und diese Datei existiert seit dem
Abbau #952 (20.9.2026) nicht mehr; `PLAN_BUCHUNG_TOKEN` hat repo-weit null Treffer.*
**Gerettet:** `AUTOMERGE_TOKEN` lebt weiter (`normen-monitor.yml:314/392/469`,
`fedlex-frische.yml:447`), ein PAT-Ablaufdatum steht in
`bibliothek/register/parameter-verfall.md` heute nicht — dieser Rest läuft als eigener Ein-Zeiler
weiter (`plan/posten/2026-09-22-pat-ablaufdatum-als-pflegetermin-eintragen.md`, wartet auf David).

**5. `@david-fragen`-Eintrag `zgb-a36-anhang` gelöscht.** Wortlaut David: «nein». *Begründung:
Frage beantwortet, der Block ist die Single Source der offenen David-Fragen und wird nach der
Antwort geleert (§5).* **Der Entscheid im Wortlaut, damit er auffindbar bleibt:** Die
ZGB-Gliederung zeigt die 74 Artikel des Anhangs «Wortlaut der früheren Bestimmungen des sechsten
Titels» **bewusst NICHT** in der Gliederungs-Leiste (Alt-Kuration A36); es sind aufgehobene
Alt-Fassungen, die im Lesetext weiterhin vorhanden und verlinkbar bleiben. Die Vorgabe vom
13.8.2026 («Artikel-Ebene in allen Gesetzen») ist sonst korpusweit erfüllt. Derselbe Vermerk steht
im Bibliothek-Eintrag Ziff. 20.

## Ablösung 23.9.2026 (Werkbank-Umbau, LESER S5) — `W2·5m-LESER-V3` gestrichen (Wortlaut)

**Begründung.** `W2·29-WERKBANK-LESER` hat dasselbe Ziel auf anderem Weg erreicht (Hülle
neu im Werkbank-Design, Normtext-Kern byte-gleich — Kern-Probe `src/tests/ArtikelBody.test.tsx`);
FAHRPLAN-WERKBANK-UMBAU §5a Ziff. 5 und §7 (Zeile «`FAHRPLAN-LESER-V3.md` + `W2·5m-LESER-V3`»)
verlangen «Posten unter LESER, Schritt in die Chronik, Fahrplan ins Archiv». Vollzogen in der
letzten Leser-Scheibe S5 (Branch `feat/w229-werkbank-leser-s5`). Der Fahrplan liegt jetzt in
`archiv/FAHRPLAN-LESER-V3.md` (die gleichnamige Auslagerungs-Datei `archiv/fahrplaene/FAHRPLAN-LESER-V3.md`
bleibt unverändert daneben). Mitgezogen: `FAHRPLAN-SPLIT-VIEW.md` nach `archiv/` (ohne lebenden
Schritt; der offene Rest lebt als Posten `plan/posten/2026-06-29-multi-pane-split-view.md` unter
`W3-AUSBAU` weiter und zeigt auf das Archiv).

**Verbleib der offenen Zeilen aus FAHRPLAN-LESER-V3 §16 und der Posten des Schrittes:**

| Zeile / Posten | Verbleib |
|---|---|
| `leserV3Modell.ts` 420/420 + `uebersichtAngaben.ts` schneiden | `uebersichtAngaben.ts` erledigt (S2, 417 → 223); Rest (Adapter 419/420 verhaltenstragend, Satz «inzwischen in Kraft» nach `erlassKopfText.ts`) → Posten `2026-09-23-adapter-leserv3modell-ts-schneiden-…` unter `W2·29-WERKBANK-REST` |
| `ArtikelLeser.tsx` ca. Z. 621, Kommentar `data-such-meta` | erledigt S5 (Ergänzungs-Satz im Kommentar, §2b) — *Ergänzung 23.9.2026 (Rebase auf S3): erledigt war es schon in S1 (PR #985, Nachtrag «KEIN `data-such-meta` mehr» am `data-hist-druck`-Block); der alte Kommentarblock ist dort gefallen, der S5-Satz entfiel beim Rebase* |
| `NormText.tsx` 795/800 | Posten `2026-09-23-normtext-tsx-795-800-…` unter `W2·29-WERKBANK-REST` |
| 8 Artikel ohne eigene Gliederungszeile | Posten `2026-09-23-8-artikel-ohne-…` unter `W2·27-BUND-FERTIG` |
| Struktur-Extraktor HTML statt XML (Risikopfad) | Posten `2026-09-23-struktur-extraktor-…` unter `W2·27-BUND-FERTIG` |
| CLS-Flake `leser-funktionszeile-zaehler.e2e.ts:80` | Posten `2026-09-23-cls-flake-…` unter `W2·24-PERF-REST` (CLS/Mount ist §15) |
| Bezugslinien-Orakel in zwei Specs | erledigt S3 (`e2e/helpers/bezugslinie.ts`, PR #988) |
| Stop-and-go-Wächter | erledigt S3 (F1 pausenlos, PR #988) |
| Empfindlichkeitsgrenze der Rückstands-Sonde | kein Mangel, reine Dokumentation — steht als Warnung im Test-Kommentar; ohne Posten geschlossen |
| Akkordeon nur bei Scroll-Ruhe | Posten `2026-09-23-akkordeon-klappt-…` unter `W2·29-WERKBANK-REST` |
| `w224-d35-f2-kopf.e2e.ts:96` unter Last | Posten `2026-09-23-w224-d35-f2-kopf-…` unter `W2·29-WERKBANK-REST` |
| Posten «Einzelartikel-Ansicht E3» (Druck/Export, Rechtsprechungs-Block) | umgehängt an `W2·29-WERKBANK-REST` (E3 Druck → REST, §5a Ziff. 5) |
| Posten «Fassungs-Diff-Tab» | umgehängt an den eigenen Schritt `W2·5g-ZEIT` «Norm-Zeitmaschine + Fassungs-Diff» |
| Posten «Gliederung: Standort sichtbar, Mitlaufen, Auf/Zu» | geschlossen (Auf/Zu ✅ 19.9.2026, Mitlaufen ✅ 18.9.2026) → `archiv/posten/` |

Wortlaut des gestrichenen Schrittes:

- [ ] **Gesetz-Leser V3 — Hülle neu, Kern unangetastet** *(`W2·5m-LESER-V3`, Auftrag David 16.8.2026)*
  <!-- @meta id: W2·5m-LESER-V3 · status: ready · blocker: null · dep: [] · feld: leser · fahrplan: fahrplaene/FAHRPLAN-LESER-V3.md -->
  Ziel: Leser-Oberfläche nach Apple-HIG-Prinzipien radikal vereinfacht; Kern (`ArtikelBody`,
  `ArtikelLeser`, Datenlogik) unangetastet, Golden byte-gleich. **H1–H5 und S1–S4 sind seit
  21.8.2026 vollständig** (Chronik; S-Buchung nachgeholt 15.9.2026). **Offen und damit neues
  Fertig-Kriterium:** die drei Deckel-/Schnitt-Posten (Wortlaut im Fahrplan §16), Einzelartikel E3 samt
  Rechtsprechungs-Block und der Fassungs-Diff-Tab.
  **Detail:** [FAHRPLAN-LESER-V3.md](fahrplaene/FAHRPLAN-LESER-V3.md) (Kurzfassung zuoberst; Kap. 7 Etappen H1–H5/S1–S4, Kap. 9 Fragen F1–F6).
  **Offene Unterpunkte im Wortlaut** (verlagert 20.9.2026, Entscheid David): [FAHRPLAN-LESER-V3.md](fahrplaene/FAHRPLAN-LESER-V3.md) §16 — die drei Deckel-/Schnitt-Posten und die Gliederungs-Nebenfunde.
  **Wird durch `W2·29-WERKBANK-LESER` abgelöst** (gleiches Ziel, anderer Weg) — Posten dort
  abarbeiten (Fahrplan Werkbank-Umbau §7); bis dahin unverändert baubar.


# Umschichtung 2026-09-24 (1) — Bauplan-Konsolidierung: erledigte Schritte, Teilerfolge, Streichungen, David-Fragen, Queue

Anlass: Auftrag David 24.9.2026 («prüfe auch noch den gesamten bauplan indem du inventarisierst und
gleich die befunde einbaust und auch sonst zusammenlegst was es zu zusammenlegen gibt»), Schritt
`QS-DOKU-DIAET`. Grundlage: Bauplan-Inventar Phase 1 (Projektordner
`pruefung-herz-nieren-2026-09-24/bauplan-inventar.md`, Massnahmen M-01, M-03 … M-07, M-30, Frage
F-1), freigegeben vom Orchestrator 24.9.2026. Alles wörtlich (aufraeumen.md §2), je Streichung eine
Begründungszeile (§3). Kein `@meta` eines lebenden Schritts wurde verändert — ausser der
freigegebenen Buchung `QS-DOKU-DIAET` (wip, `dep: []`, Commit davor).

## W2·28-TREFFER-LANDKARTE — Treffer-Landkarte: wo im Dokument liegen die Treffer *(done, verschoben 2026-09-24)*

- [x] **Treffer-Landkarte: wo im Dokument liegen die Treffer** *(`W2·28-TREFFER-LANDKARTE`, David 18.9.2026; reine UI)*
  <!-- @meta id: W2·28-TREFFER-LANDKARTE · status: done · blocker: null · dep: [] · feld: leser · fahrplan: fahrplaene/FAHRPLAN-RECHERCHE-KOMFORT.md -->
  Streifen neben dem Scrollbalken mit einer Marke je Suchtreffer (Gesetz + Entscheid), Klick springt; dieselbe Trefferquelle wie die Hervorhebung (§5).
  **Detail:** [FAHRPLAN-RECHERCHE-KOMFORT.md](fahrplaene/FAHRPLAN-RECHERCHE-KOMFORT.md) §1.

*`fahrplaene/FAHRPLAN-RECHERCHE-KOMFORT.md` bleibt über die offenen Posten verlinkt (check:plan Regel 7).*

## W2·29-MARKE — Marke: Logo A2 «Registerbuch» und Reiterleiste «Echte Registerreiter» *(done, verschoben 2026-09-24)*

- [x] **Marke: Logo A2 «Registerbuch» und Reiterleiste «Echte Registerreiter»** *(`W2·29-MARKE`, Auftrag David 24.9.2026)*
  <!-- @meta id: W2·29-MARKE · status: done · blocker: null · dep: [] · feld: design -->
  Name und Wortmarke bleiben. Siegel → A2 (Buch, Rücken, §, vier Registerreiter), Favicon aus dem
  Designsystem; offene-Reiter-Leiste als Blätter mit Registerstrich oben, aktiver Reiter verschmilzt mit der Seite.

## QS-CI-MINUTEN — Teilerfolgs-Prosa *(✅-Teilerfolg, verschoben 2026-09-24)*

Die Zeile stand bis 24.9.2026 im offenen Schritt; im Plan bleibt ein ✅-Einzeiler mit Termin
(Nachmessung 8.10.2026) und dem offenen Punkt. Nachgeführt dort: der Stichtag «bis 22.9.» ist
verstrichen — `scripts/check-e2e-flake.ts:162` schaltet ab `hart_ab` (`e2e/flake-modus.json`:
2026-09-22) auf hart.

  Gebaut 8.9.2026: M1–M5, Flacker-Wächter (Melde-Modus bis 22.9.2026, dann hart), Ergebnis-Job, Playwright-Install-Retry — Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (3); Regeln: Skill `landung` §«Prüfstrasse seit 8.9.2026». **Nachmessung 8.10.2026.** **Merge Queue erledigt 19.9.2026:** Repo `LexMetrik/Whatever`, Ruleset 23699779 (SQUASH, ALLGREEN, max 3, Timeout 60 min, keine Bypass-Akteure), `strict` AUS; erster Durchlauf #922 + #917 gemeinsam gelandet 15:05:00Z. Herleitung (#914/#892), `QS-ORG-UMZUG` im Wortlaut, Entscheide David 8.9.2026 (Weg A, M2): Chronik, Umschichtung 19.9.2026 bzw. 14.9.2026 (3). Offen: Wurzel der flackernden Specs (Fehlerbuch §4, bis 22.9.) — unter der Queue schwerer.

## QS-PERF — Teilerfolgs-Prosa *(✅-Teilerfolg, verschoben 2026-09-24)*

  Leser-Tempo gebaut 1.9.2026 (A/B n=5): OR **10 368 → 7 899 ms @4×+4G**, **38 296 → 27 432 ms @6×+3G**,
  ungedrosselt 780 ms — Wortlaut samt Bestands-Fix `InhaltsKopf`: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (3).

## Streichungen 2026-09-24

- **`QS-BEWAEHRUNG`** (Residuen-Stub ohne `@meta`) — gestrichen 2026-09-24: der Schritt ist seit
  15.9.2026 erledigt und steht samt `@meta` im Wortlaut in der Umschichtung 17.9.2026; der Stub
  steuerte nichts mehr (keine `dep`, keine Queue). Wortlaut des Stubs:

  ```
  - [x] **Bewährungs-Messung für Tore, Hooks und Regeln** *(`QS-BEWAEHRUNG`)* — ✅ 15.9.2026. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 17.9.2026.
  ```
- **`W2·9`** — gestrichen 2026-09-24: (a) A3 Kachel-Höhen ist gegenstandslos
  (`fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md` §20, «Stand 24.9.2026 (W2·29-WERKBANK-RECHNER R2):
  gegenstandslos»; die Rest-Befunde LM-066/LM-032 laufen im Posten
  `plan/posten/2026-09-23-w2-9-a-kachel-hoehen-gebvkostenform-tsx-97-samt-lm-032-066-0.md` unter
  `W2·29-WERKBANK-REST`); (b) «aufgehobene Normen ausblenden» ist eine Entscheidfrage («Abhaken
  bleibt David-Entscheid») und steht seit 24.9.2026 als Zeile `aufgehobene-normen-schalter` im
  Block `@david-fragen` der ROADMAP. *Abweichung offengelegt:* `FAHRPLAN-WERKBANK-UMBAU.md` §5f
  plante für (b) «als Posten umbuchen»; freigegeben war `@david-fragen`, weil erst David
  entscheidet, ob gebaut wird — ein Posten würde eine Bau-Einheit vortäuschen. Wortlaut:

- [ ] **Aufräum-Item — zwei Restpunkte** *(`W2·9`)*
  <!-- @meta id: W2·9 · status: ready · blocker: null · dep: [] · feld: design · fahrplan: fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md -->
  (a) A3 Kachel-Höhen (zur David-Abnahme geflaggt); (b) globaler Schalter «aufgehobene Normen
  ausblenden» nie gebaut. Abhaken bleibt David-Entscheid.
  **Detail:** [FAHRPLAN-ARCHIV-RESTPUNKTE.md](fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md) §20.
  **(a) fällt mit `W2·29-WERKBANK-RECHNER`** (Gegenstand Betreibungskosten-Formular, Planung
  23.9.2026); (b) ist eine Funktion und bleibt hier.

- **Blocker `david-go-entstehung`** — gestrichen 2026-09-24: ERTEILT seit 11.9.2026, kein `@meta`
  referenziert ihn mehr (`npm run plan:dump`). Wortlaut der Register-Zeile:

  ```
  david-go-entstehung: ERTEILT — Go David 11.9.2026 («führe alles durch»); die drei W2·6c-ENTSTEHUNG-*-Schritte stehen auf `status: ready`, Blocker entfernt. Design freigegeben 6.9.2026; §11.9 der Materialien-Spec bucht die Entscheide 1–6 als entschieden 11.9.2026 (Mandat), Nr. 7 (fachliche Abnahme) bleibt bei David.
  ```
- **Blocker `david-design-entscheide`** — gestrichen 2026-09-24: ENTSCHIEDEN 22.9.2026, kein `@meta`
  referenziert ihn mehr; der Entscheid im Wortlaut steht zusätzlich in
  `fahrplaene/FAHRPLAN-WERKBANK-UMBAU.md` §4. Wortlaut der Register-Zeile:

  ```
  david-design-entscheide: ENTSCHIEDEN — David 22.9.2026 (Chat): (1) Seitenleiste-Aufbau bleibt wie im Produkt; (2) Startseite vier Kacheln, Zahl aus dem generierten Zähler; (3) Farbe als Fläche JA (F0.2 und `check:farbwelt` im Tokens-Schritt ändern). `W2·29-WERKBANK-TOKENS` steht auf `ready`, Blocker entfernt; Wortlaut in FAHRPLAN-WERKBANK-UMBAU.md §4.
  ```

## Geparkt «Offene David-Grundsatzfragen» → `@david-fragen` (Abgleich gegen W-01 … W-22)

Die Zeile stand seit 28.6.2026 im Block «Geparkt»; das Lagebild liest offene Fragen aber allein aus
`@david-fragen` (`davidFragen`, `scripts/plan/bildDaten.ts`) — David hat sie dort nie gesehen.
Abgleich 24.9.2026 gegen `fahrplaene/FAHRPLAN-RECHTSLOGIK.md` §4 (W-01 … W-22, Stand `main`
e92e7ba1d): **keine der vier Fragen ist dort beantwortet** — W-13 betrifft die Berner Skala der
Lohnfortzahlung (nicht den Dienstjahr-Stichtag der Kündigungsfrist), W-22 die Gleitkomma-Rundung
`round2` (nicht die Frage, ob die GebV-SchKG 0.05 verlangt). Alle vier ziehen darum als offene
Fragen nach `@david-fragen` (Schlüssel `dienstjahr-stichtag`, `sperrtage-anzeige`,
`export-antworten`, `gebv-schkg-rundung`); ausführlicher Ursprung: `archiv/HANDLUNGSPLAN.md`
Z.211–218 (7.6.2026). Wortlaut der Geparkt-Zeile:

- **Offene David-Grundsatzfragen** (gebündelt mitführen): Dienstjahr-Stichtag Kündigungsfrist ·
  Sperrtage-Konvention · 3 Export-Antworten · GebV-SchKG-Promille-Rundung (0.01 vs. amtlich 0.05).

## `@queue` nachgeführt 2026-09-24 (Frage F-1)

Befund Phase 1: von 106 `Roadmap:`-Trailern seit 17.9.2026 zeigten 2 auf Queue-IDs; gebaut wurde
`W2·29-WERKBANK-*` (63) und `W2·30-RL-*` (7) — die Go-Entscheide 22.9. (Werkbank) und 23./24.9.
(Rechtslogik parallel) standen nicht in der Queue. Nachgeführt (Entscheid Orchestrator, David hat
Veto): `W2·30-RL-W2A, W2·29-WERKBANK-REST, W2·27-BUND-FERTIG, W2·5l-NORMTEXT-B2, QS-KORPUS`. Aus der
Queue gefallen (bleiben `ready`, ordnen sich per Dokumentreihenfolge): `W2·20-VERWEIS-SCHAERFE`,
`W2·22-VERWEIS-FEDLEX`. Das Phasen-Dekret 14.9.2026 im ROADMAP-Kopf bleibt unverändert stehen.

Queue und Marker bis 24.9.2026 im Wortlaut:

`<!-- @queue: W2·27-BUND-FERTIG, W2·5l-NORMTEXT-B2, QS-KORPUS, W2·20-VERWEIS-SCHAERFE, W2·22-VERWEIS-FEDLEX -->`

> **⬆ OBERSTER OFFENER SCHRITT: `W2·27-BUND-FERTIG`** (Sollbild «Was ist ein Gesetz bei LexMetrik», am Bund
> festgeschrieben und dort eingelöst — Restposten als Zeilen im Schritt; seit 18.9.2026 wieder
> `ready`, weil `wip` ohne Bau-Spur stand). Danach `W2·5l-NORMTEXT-B2` (Text-Treue M13/M14).


# Fusionen 2026-09-24 — Bauplan-Konsolidierung (aufgegangene Schritte)

Anlass und Grundlage wie «Umschichtung 2026-09-24 (1)» (Bauplan-Inventar Phase 1, Massnahmen M-08 …
M-15, freigegeben vom Orchestrator 24.9.2026; Schritt `QS-DOKU-DIAET`). **17 Schritte aufgegangen,
nicht gestrichen** — Muster der Etiketten-Konsolidierung 15.8.2026 (oben), angepasst an das
Posten-Modell (20.9.2026): was an einem aufgegangenen Schritt noch steuert, lebt als Posten-Datei
bzw. Etappen-Zeile unter dem Dach weiter; eingehende `dep` und Posten-Dächer sind umgehängt, die
Fahrplan-Abschnitte nennen das Dach (Nachzug an den Rändern). Kein Risikomix: jede Fusion bleibt
im selben `feld` und in derselben Risikoklasse, ausser M-13 (design → betrieb, beide
§15-Geräte-Last, Posten unverändert sortenrein).

**Die acht Fusionen mit Begründung:**

1. Sieben `W2·6d-*` → **`W2·6d-ENTSTEHUNG`** (neu, `feld: korpus`, Risikopfad) — Etappen 0/2/3–5/
   6/7/8/9 derselben Spec (FAHRPLAN-MATERIALIEN-VERZAHNUNG §12.3); jede bildete in `plan:next` eine
   eigene Lane. Im Dach als Etappen-Zeilen `EA0` … `EA9`; die bisherige `dep` von
   `W2·6d-BULLETIN-VOTEN` auf `W2·6d-PARLAMENT-ARTIKEL` ist Prosa an der Zeile `EA6` («erst nach
   EA2»). *Kennung EA statt E (Abweichung vom Vorschlag, offengelegt):* derselbe Fahrplan führt
   **E0**–**E4** mit ✅ für die Stufe `W2·6c-ENTSTEHUNG`; `check:plan` Regel 14 läse eine offene
   `E0`-Zeile gegen dieses ✅ als Widerspruch.
2. `QS-CURRENCY-KANON` → **`QS-KORPUS`** — Bestandsdefekt der Pins ist «fehlerhafte amtliche
   Substanz» (Dach der Fusion 15.8.2026); Schritt-Text als Posten, sechs Posten umgehängt.
3. `QS-FRIT-DRIFT` → **`W2·5g-ZEIT`** — nach dem Phasen-Entscheid 14.9.2026 («fr/it später»,
   Titel von `W2·5g-ZEIT`) gehört der fr/it-Datenanteil dorthin; zwei Posten umgehängt, die
   Posten-Stufe-2 trägt den Bau.
4. `W2·13-KANTONE-DRIFT` · `W3·12` → **`W2·13-KANTONE-DATEN`** — dieselbe Fläche (kantonale
   Daten, Phase 2), beide ohne Posten und nie mit Trailer; je ein Posten. `W2·6-DATA` trägt die
   `dep` jetzt auf dem Dach (Leitprinzip 4). `FAHRPLAN-GESETZE-IMPORT-3TIER.md` → `archiv/`
   (verify-then-archive: kein lebender Zeiger ausser `W3·12`; drei `bibliothek/recherche/`-Stellen
   ergänzt; Kommentare in `scripts/normtext*` bewusst NICHT angefasst — Risikopfad).
5. `W2·24-C` · `QS-UI` → **`W2·19-DESIGN-KONSISTENZ`** — alle drei «durch `W2·29-WERKBANK-*`
   abgelöst», die Posten beider liegen seit #1047 unter REST/NACHLAUF.
6. `W2·24-PERF-REST` → **`QS-PERF`** — Teilmenge («Reader-Kopf-Reflow» führt `QS-PERF` selbst);
   sieben Posten umgehängt. Die Chronik führt `W2·24-PERF-REST` damit zweimal (done 20.9.2026 und
   aufgegangen hier) — kein `dep` zeigt darauf (check:plan Regel 4 unberührt).
7. `W1·5-PRAXIS` · `W2·8` → **`W3-AUSBAU`** (parked → parked) — Horizont-Dach der Fusion 15.8.2026;
   je ein Posten, drei `W2·8`-Posten umgehängt.
8. `W2·16-INVENTAR` → **`W2·16-ANLEITUNG`** — Anlass weitgehend entfallen (`docs/INVENTAR-FUNKTIONEN.md`,
   #975); Rest als Posten. `W2·16-ANLEITUNG`: `dep: []`, `status: parked`, `blocker:
   zielbild-gesetzesleser` (freigegebene Status-Setzung; ohne `dep` wäre der «bewusst späte» Schritt
   sofort baubar gewesen).

**Umgehängte Posten (18)** — je mit Zeile «Umgehängt 24.9.2026 …» im Rumpf:

  - `plan/posten/2026-09-20-aufgehoben-flag-ist-golden-neutral-blinder-fleck.md` (QS-CURRENCY-KANON → QS-KORPUS)
  - `plan/posten/2026-09-20-fedlex-frische-yml-auf-nur-bund-umstellen.md` (QS-CURRENCY-KANON → QS-KORPUS)
  - `plan/posten/2026-09-20-gen-pdf-quellen-nur-kanton-nachfahren-check-pdf-quellen-in-d.md` (QS-CURRENCY-KANON → QS-KORPUS)
  - `plan/posten/2026-09-20-leser-mount-auf-langsamem-netz-messen.md` (W2·24-PERF-REST → QS-PERF)
  - `plan/posten/2026-09-20-public-normtext-pdf-quellen-json-in-eine-paritaets-klasse-au.md` (QS-CURRENCY-KANON → QS-KORPUS)
  - `plan/posten/2026-09-20-rest-cls-0-0003-im-leser-kopf.md` (W2·24-PERF-REST → QS-PERF)
  - `plan/posten/2026-09-20-stufe-2-abgleich-ueber-artikelnummer-statt-eid.md` (QS-FRIT-DRIFT → W2·5g-ZEIT)
  - `plan/posten/2026-09-20-vier-fedlex-fundstellen-dem-fedlex-betrieb-melden-david.md` (QS-FRIT-DRIFT → W2·5g-ZEIT)
  - `plan/posten/2026-09-20-vorbestand-drei-skripte-lesen-tmp-caches-ohne-pin-pruefung.md` (QS-CURRENCY-KANON → QS-KORPUS)
  - `plan/posten/2026-09-20-zitat-export-fussnoten-ausgabe.md` (W2·8 → W3-AUSBAU)
  - `plan/posten/2026-09-20-zitierstil-amtlich-gtr-anhang-3-bk-stand-5-6-2026-bger-zitie.md` (W2·8 → W3-AUSBAU)
  - `plan/posten/2026-09-20-zotero-translator-fedlex-admin-ch-bger-ch-eigenbau-klein.md` (W2·8 → W3-AUSBAU)
  - `plan/posten/2026-09-21-frische-rennen-automatik-chip-aus-einer-momentaufnahme-kann.md` (QS-CURRENCY-KANON → QS-KORPUS)
  - `plan/posten/2026-09-23-cls-flake-leser-funktionszeile-zaehler-e2e-ts-80-an-der-wurz.md` (W2·24-PERF-REST → QS-PERF)
  - `plan/posten/2026-09-23-firefox-safari-kennen-rel-expect-nicht-seltener-gruss-tausch.md` (W2·24-PERF-REST → QS-PERF)
  - `plan/posten/2026-09-23-stylesheet-im-head-hinter-23-modulepreload-anweisungen-unter.md` (W2·24-PERF-REST → QS-PERF)
  - `plan/posten/2026-09-24-schlanker-such-index-fuer-das-rechtsprechung-blatt-der-start.md` (W2·24-PERF-REST → QS-PERF)
  - `plan/posten/2026-09-24-suche-eingabe-sucheaktiv-1-34-s-bei-cpu-4-usedeferredvalue-m.md` (W2·24-PERF-REST → QS-PERF)

**Neue Posten aus aufgegangenen Schritten (6):**

  - `plan/posten/2026-09-24-fza-cmr-nicht-kanonisch-klaeren-und-kanonisch-nachfuehren-vo.md`
  - `plan/posten/2026-09-24-kantonale-snapshots-gegen-die-quellen-nachfuehren-28-mit-inh.md`
  - `plan/posten/2026-09-24-kantons-massenimport-kanton-gesetze-buendel-vormals-w3-12.md`
  - `plan/posten/2026-09-24-frist-kosten-verzahnen-ein-praxis-weg-vormals-w1-5-praxis.md`
  - `plan/posten/2026-09-24-schriften-baukasten-berufung-bgg-beschwerde-sistierung-bewei.md`
  - `plan/posten/2026-09-24-funktions-inventar-rest-status-abgleich-8-von-docs-inventar.md`

*Wortlaut der aufgegangenen Schritte, wie er bis 24.9.2026 in `ROADMAP.md` stand:*

## W2·6d-VERFAHREN-RECHERCHE — Entstehung am Artikel — Deep Research Gesetzgebungsprozess *(aufgegangen in W2·6d-ENTSTEHUNG 2026-09-24)*

- [ ] **Entstehung am Artikel — Deep Research Gesetzgebungsprozess** *(`W2·6d-VERFAHREN-RECHERCHE`, §14-Intake 15.9.2026)*
  <!-- @meta id: W2·6d-VERFAHREN-RECHERCHE · status: ready · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md -->
  Verfahrensmodell «Wie entsteht ein Bundeserlass» aus amtlichen Quellen, je Schritt Norm · Akteur ·
  Dokument · Publikationsort · Datenspur; Vorlage = Entwurf 15.9.2026. Recherche, kein Bau; Bund
  zuerst; Gegenprüfung zweites Modell; Abnahme David `[D]` blockiert die Daten-Etappen nicht.
  **Detail:** [FAHRPLAN-MATERIALIEN-VERZAHNUNG.md](fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md) §12.3 Etappe 0.

## W2·6d-PARLAMENT-ARTIKEL — Entstehung am Artikel — Nationalrats-Abstimmungen je Artikel + Vehikel der Vorlage *(aufgegangen in W2·6d-ENTSTEHUNG 2026-09-24)*

- [ ] **Entstehung am Artikel — Nationalrats-Abstimmungen je Artikel + Vehikel der Vorlage** *(`W2·6d-PARLAMENT-ARTIKEL`, 15.9.2026)*
  <!-- @meta id: W2·6d-PARLAMENT-ARTIKEL · status: ready · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md -->
  Curia-Vista-`Vote` je Detailberatungs-Abstimmung strukturiert am Artikel (Chip «im Rat
  umstritten») + `BusinessType` im Verfahrens-Block. Grenzen: keine Personendaten, Auflagen der
  Parlamentsdienste am Block, Monatslauf; Risikopfad ⇒ Gegenprüfung.
  **Detail:** [FAHRPLAN-MATERIALIEN-VERZAHNUNG.md](fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md) §12.3 Etappe 2.

## W2·6d-BOTSCHAFT-TEXT — Entstehung am Artikel — Botschaftstext je Artikel (Erläuterung als §7-Zitat) *(aufgegangen in W2·6d-ENTSTEHUNG 2026-09-24)*

- [ ] **Entstehung am Artikel — Botschaftstext je Artikel (Erläuterung als §7-Zitat)** *(`W2·6d-BOTSCHAFT-TEXT`, 15.9.2026; Phase 3)*
  <!-- @meta id: W2·6d-BOTSCHAFT-TEXT · status: ready · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md -->
  Stufe A: XML ab 2022 + DOCX 2020/21 (kapitelscharf deterministisch, artikelscharf nur wo
  strukturell); B: PDF/A 1999–2019 auf dem PDF-Kern (K-7); C: Kommissionsberichte + Stellungnahmen
  BR. **Auflagen:** erst nach Synopse E5/E6 (#794); Erläuterung an die Fassung gebunden, die aus der Botschaft hervorging;
  Mantel über Eltern-Level; URLs nur aus `isExemplifiedBy`; nichts vor 1999; Gegenprüfung.
  **Detail:** [FAHRPLAN-MATERIALIEN-VERZAHNUNG.md](fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md) §12.3 Etappen 3–5.

## W2·6d-BULLETIN-VOTEN — Entstehung am Artikel — Bulletin-Voten Bundesrat/Kommission: Metadaten + Deep-Link *(aufgegangen in W2·6d-ENTSTEHUNG 2026-09-24)*

- [ ] **Entstehung am Artikel — Bulletin-Voten Bundesrat/Kommission: Metadaten + Deep-Link** *(`W2·6d-BULLETIN-VOTEN`, 15.9.2026; Phase 3)*
  <!-- @meta id: W2·6d-BULLETIN-VOTEN · status: ready · blocker: null · dep: [W2·6d-PARLAMENT-ARTIKEL] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md -->
  Voten nach Funktion, Rat, Datum, Lesung mit Deep-Link ins Amtliche Bulletin und AB-Fundstelle «AB Jahr S/N Seite» (19.9.2026); Artikel-Zuordnung
  «maschinell» mit ausgewiesener Präzision; SR-Stimmenzahlen aus dem Text. **Kein Redetext, kein Name.**
  **Detail:** [FAHRPLAN-MATERIALIEN-VERZAHNUNG.md](fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md) §12.3 Etappe 6.

## W2·6d-URSPRUNG — Entstehung am Artikel — Ursprung der Bestimmung (Bundesratsentwurf oder Parlament) *(aufgegangen in W2·6d-ENTSTEHUNG 2026-09-24)*

- [ ] **Entstehung am Artikel — Ursprung der Bestimmung (Bundesratsentwurf oder Parlament)** *(`W2·6d-URSPRUNG`, 19.9.2026; Phase 3)*
  <!-- @meta id: W2·6d-URSPRUNG · status: ready · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md -->
  «Nicht im BR-Entwurf, von Kommission SR/NR eingefügt» auch vor 2021 + Kante «Botschaft zu anderem
  Geschäft als Material». Weg zuerst messen; nicht deterministisch ⇒ nur über die Entstehungsnotiz.
  **Detail:** [FAHRPLAN-MATERIALIEN-VERZAHNUNG.md](fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md) §12.3 Etappe 8, §12.6.

## W2·6d-ENTSTEHUNGSNOTIZ — Entstehung am Artikel — kuratierte Entstehungsnotiz mit Bulletin-Kurzzitat *(aufgegangen in W2·6d-ENTSTEHUNG 2026-09-24)*

- [ ] **Entstehung am Artikel — kuratierte Entstehungsnotiz mit Bulletin-Kurzzitat** *(`W2·6d-ENTSTEHUNGSNOTIZ`, 19.9.2026; Phase 3)*
  <!-- @meta id: W2·6d-ENTSTEHUNGSNOTIZ · status: ready · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md -->
  Von David verfasste/freigegebene Notiz je Artikel: nur Entstehungsfakten mit Fundstelle, Kurzzitate
  nur kuratiert, Namen von BR-Mitgliedern zulässig. Referenzfall Art. 90 Abs. 3/4 SVG; Abgrenzung vor Bau bestätigen.
  **Detail:** [FAHRPLAN-MATERIALIEN-VERZAHNUNG.md](fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md) §12.3 Etappe 9, §12.6.

## W2·6d-VERNEHMLASSUNG-DOKUMENTE — Entstehung am Artikel — Vernehmlassungs-Dokumente als Verweise *(aufgegangen in W2·6d-ENTSTEHUNG 2026-09-24)*

- [ ] **Entstehung am Artikel — Vernehmlassungs-Dokumente als Verweise** *(`W2·6d-VERNEHMLASSUNG-DOKUMENTE`, 15.9.2026; Phase 3)*
  <!-- @meta id: W2·6d-VERNEHMLASSUNG-DOKUMENTE · status: ready · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md -->
  Vorentwurf, Erläuternder Bericht, Ergebnisbericht je Verfahren (für Verordnungen die einzige
  Entstehungsquelle). Grenzen: Weg zuerst erheben, nur Verweis-Klasse.
  **Detail:** [FAHRPLAN-MATERIALIEN-VERZAHNUNG.md](fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md) §12.3 Etappe 7.

## QS-CURRENCY-KANON — `fza`/`cmr` NICHT-KANONISCH klären und kanonisch nachführen *(aufgegangen in QS-KORPUS 2026-09-24)*

- [ ] **`fza`/`cmr` NICHT-KANONISCH klären und kanonisch nachführen** *(`QS-CURRENCY-KANON`)*
  **Nachtrag 4.9.2026 (Gegenprüfung PR #658):** `check:fedlex-versionen` rot mit geänderter Menge — `dbg` überholt (Pin 2026-01-01, geltend 2026-09-02), `fmg` + `fdv` nicht-kanonisch; FMG-Snapshot nach Re-Pin regenerieren (liegt unter den 43 von #658).
  <!-- @meta id: QS-CURRENCY-KANON · status: ready · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-FEDLEX-PORTFOLIO.md -->
  Bestandsdefekt auf `main`; erst Ursache klären, dann re-pinnen + regenerieren + §7-Verifikation.
  **Nullprobe zuerst** — `fedlex-cache.sh:368` pinnt `fza` bereits auf html-9, der Befund vom 2.8.
  könnte dafür erledigt sein. **Detail:** [FAHRPLAN-FEDLEX-PORTFOLIO.md](fahrplaene/FAHRPLAN-FEDLEX-PORTFOLIO.md) §17.

## QS-FRIT-DRIFT — FR/IT-Drift-Wächter Stufe 2 *(aufgegangen in W2·5g-ZEIT 2026-09-24)*

- [ ] **FR/IT-Drift-Wächter Stufe 2** *(`QS-FRIT-DRIFT`, Stufe 1 gebaut 15.8.2026)*
  <!-- @meta id: QS-FRIT-DRIFT · status: ready · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-FEDLEX-PORTFOLIO.md -->
  Erstlauf-Befund: OR, PatG und BewG weichen in fr/it real ab ⇒ **`eId` trägt nicht sprachübergreifend**.
  Dossier: [frit-drift-2026-08-15.md](bibliothek/register/frit-drift-2026-08-15.md).
  **Detail:** [FAHRPLAN-FEDLEX-PORTFOLIO.md](fahrplaene/FAHRPLAN-FEDLEX-PORTFOLIO.md) §18.1.

## W2·13-KANTONE-DRIFT — Kantonale Snapshots gegen die Quellen nachführen *(aufgegangen in W2·13-KANTONE-DATEN 2026-09-24)*

- [ ] **Kantonale Snapshots gegen die Quellen nachführen** *(`W2·13-KANTONE-DRIFT`, Befund 2.8.2026; Phase 2, Entscheid 14.9.2026)*
  <!-- @meta id: W2·13-KANTONE-DRIFT · status: ready · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-KANTONE.md -->
  Der Bundes-Durchgang vom 2.8.2026 meldete **~28 kantonale Snapshots mit echter Inhaltsdrift** —
  bewusst ausgeklammert und **unverifiziert**. **Reihenfolge gegen `K-7`** beachten.
  **Detail:** [FAHRPLAN-KANTONE.md](fahrplaene/FAHRPLAN-KANTONE.md) §3.

## W3·12 — Kanton-Gesetze-Bündel *(aufgegangen in W2·13-KANTONE-DATEN 2026-09-24)*

- [ ] **Kanton-Gesetze-Bündel** *(`W3·12`, GESETZE-IMPORT-3TIER + BS-VORBILDKANTON + RECHTSSAMMLUNG P6; Phase 2, Entscheid 14.9.2026)*
  <!-- @meta id: W3·12 · status: ready · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-GESETZE-IMPORT-3TIER.md -->
  Grosser Kantons-Massenimport. Nach Leitprinzip 4 die nächste zu führende Datensäule (Davids
  Reihenfolge-Entscheid 2.7.2026); erst öffnen, wenn keine andere Bulk-Tranche läuft.
  **Reihenfolge (Entscheid David 1.9.2026):** ZH → BS (Perfektionierung des vollständigen
  Bestands) → BE → AG → SG → LU; VD/GE/TI und alle fr/it-Fassungen zuletzt (Zielbild Deutschschweiz).
  **Methode (1.9.2026):** Texte weiterhin selbst von den amtlichen Portalen (§7); Quellenlisten,
  Portalpfade und Eigenheiten aus `opencaselaw/scrapers/cantonal_laws/*.py` (MIT) als Vorlage,
  deren Artikelzahlen je Erlass als unabhängige Zweitlesung unserer Extraktion.
  **Detail:** [FAHRPLAN-GESETZE-IMPORT-3TIER.md](fahrplaene/FAHRPLAN-GESETZE-IMPORT-3TIER.md) §6.

## W2·24-C — Design-Identität: offene Nachzüge nach der Landung *(aufgegangen in W2·19-DESIGN-KONSISTENZ 2026-09-24)*

- [ ] **Design-Identität: offene Nachzüge nach der Landung** *(`W2·24-C`, herausgelöst 20.9.2026 aus dem `done`-Kopf `W2·24-DESIGN-IDENTITAET`)*
  <!-- @meta id: W2·24-C · status: ready · blocker: null · dep: [] · feld: design · fahrplan: fahrplaene/FAHRPLAN-DESIGN-IDENTITAET.md -->
  Die vier offenen UI-Nachzüge der Handschrift «Sammlung» — reine Darstellungsschicht (§13), kein
  Risikopfad; Normtext-Körper farbfrei, golden byte-gleich (§6). Der erledigte Kopf samt Prosa und
  den erledigten Unterposten steht in [ROADMAP-CHRONIK.md](ROADMAP-CHRONIK.md), Umschichtung
  2026-09-20 (2) — dort auch die Begründung der Herauslösung.
  **Detail:** [FAHRPLAN-DESIGN-IDENTITAET.md](fahrplaene/FAHRPLAN-DESIGN-IDENTITAET.md) §8.
  **Wird durch `W2·29-WERKBANK-KATALOGE`/`-REST` abgelöst** — Posten dort abarbeiten (§7).

## QS-UI — Oberflächen-Qualität app-weit *(aufgegangen in W2·19-DESIGN-KONSISTENZ 2026-09-24)*

- [ ] **Oberflächen-Qualität app-weit** *(`QS-UI`, reines UI/Design §13, kontinuierlich)*
  <!-- @meta id: QS-UI · status: ready · blocker: null · dep: [] · feld: design · fahrplan: fahrplaene/FAHRPLAN-UI-QUALITAET.md -->
  Kontinuierlicher Oberflächen-Pass (Fundament → Hierarchie → Politur), kein Einzel-Redesign.
  **Detail:** [FAHRPLAN-UI-QUALITAET.md](fahrplaene/FAHRPLAN-UI-QUALITAET.md) §8.
  **Wird durch `W2·29-WERKBANK-REST` abgelöst** — Posten dort abarbeiten (§7).

## W2·24-PERF-REST — Leser-Kopf: Rest-CLS und Mount-Messung *(aufgegangen in QS-PERF 2026-09-24)*

- [ ] **Leser-Kopf: Rest-CLS und Mount-Messung** *(`W2·24-PERF-REST`, herausgelöst 20.9.2026 aus dem `done`-Kopf `W2·24-DESIGN-IDENTITAET`)*
  <!-- @meta id: W2·24-PERF-REST · status: ready · blocker: null · dep: [] · feld: design · fahrplan: fahrplaene/FAHRPLAN-DESIGN-IDENTITAET.md -->
  Die zwei offenen §15-Posten der Handschrift: der letzte CLS-Sprung im Leser-Kopf und die
  ausstehende Mount-Messung auf langsamem Netz. Messung vor Fix; jede Massnahme trägt eine
  Logikverlust-Bewertung (§15), bei Konflikt gewinnt die Treue.
  **Detail:** [FAHRPLAN-DESIGN-IDENTITAET.md](fahrplaene/FAHRPLAN-DESIGN-IDENTITAET.md) §8.

## W1·5-PRAXIS — Frist × Kosten verzahnen *(aufgegangen in W3-AUSBAU 2026-09-24)*

- [ ] **Frist × Kosten verzahnen** *(`W1·5-PRAXIS`, Ideen-Intake 20.7.2026, UI-Orchestrierung)*
  <!-- @meta id: W1·5-PRAXIS · status: parked · blocker: zielbild-gesetzesleser · dep: [] · feld: werkzeuge · fahrplan: fahrplaene/FAHRPLAN-PROZESSKOSTEN-COCKPIT.md -->
  Die heute isoliert nebeneinander stehenden Rechner zu **einem Praxis-Weg** verketten
  (Frist → Kosten → Vorlage), reine UI-Orchestrierung ohne neue Rechtsregel (§3).
  **Detail:** [FAHRPLAN-PROZESSKOSTEN-COCKPIT.md](fahrplaene/FAHRPLAN-PROZESSKOSTEN-COCKPIT.md) §1.

## W2·8 — Schriften-Baukasten *(aufgegangen in W3-AUSBAU 2026-09-24)*

- [ ] **Schriften-Baukasten** *(`W2·8`, VORLAGEN)*
  <!-- @meta id: W2·8 · status: parked · blocker: zielbild-gesetzesleser · dep: [] · feld: werkzeuge · fahrplan: fahrplaene/FAHRPLAN-VORLAGEN-AUSBAU.md -->
  Berufung/BGG-Beschwerde/Sistierung/Beweisverzeichnis über `vorlagen/engine.ts`; Zulässigkeit nur
  Hinweis, Status «entwurf».
  **Detail:** [FAHRPLAN-VORLAGEN-AUSBAU.md](fahrplaene/FAHRPLAN-VORLAGEN-AUSBAU.md) §1.

## W2·16-INVENTAR — Funktions-Inventar (Vorstufe der Bedienungsanleitung) *(aufgegangen in W2·16-ANLEITUNG 2026-09-24)*

- [ ] **Funktions-Inventar (Vorstufe der Bedienungsanleitung)** *(`W2·16-INVENTAR`, §14-Intake 20.7.2026)*
  <!-- @meta id: W2·16-INVENTAR · status: parked · blocker: zielbild-gesetzesleser · dep: [] · feld: werkzeuge · fahrplan: fahrplaene/FAHRPLAN-UI-QUALITAET.md -->
  Ehrliche Aufnahme dessen, was LexMetrik heute kann — Quelle `startseiteConfig.ts` (§5),
  Status-Modell ungeschönt (§8).
  **Detail:** [FAHRPLAN-UI-QUALITAET.md](fahrplaene/FAHRPLAN-UI-QUALITAET.md) §9.

*Die Dach-Blöcke selbst sind nur ergänzt (je eine Zeile «Seit 24.9.2026 aufgegangen …»); ihr
Wortlaut vorher steht im Git-Verlauf dieses Commits und wird hier bewusst NICHT samt `@meta`
kopiert — ein zweiter, älterer `@meta`-Anker eines lebenden Schritts machte ihn in der Chronik
«mehrdeutig», sobald er später erledigt hierher zieht (check:plan Regel 4, dep-Auflösung). Zwei
`@meta`-Änderungen an lebenden Schritten, beide freigegeben: `W2·6-DATA` `dep: [W3·12]` →
`dep: [W2·13-KANTONE-DATEN]`; `W2·16-ANLEITUNG` `status: ready · blocker: null · dep:
[W2·16-INVENTAR]` → `status: parked · blocker: zielbild-gesetzesleser · dep: []`.*
