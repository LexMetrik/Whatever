# LexMetrik — Handlungsplan (DER eine Steuerungsplan)

> **Die einzige Steuerungsquelle:** Reihenfolge + bau-jetzt vs. geparkt. Das *Wie* je Strang steht
> in der jeweiligen `fahrplaene/FAHRPLAN-*.md` (Detailquelle), der **Ist-Zustand/Deploy** in
> `STRUKTUR.md`, die G1-Praxis-Abdeckung in `KATALOG-ROADMAP.md`.
>
> **Schritte nennen Ziel und Grenzen, nicht den Weg** (Vereinfachungs-Auftrag David 14.8.2026):
> verbindlich sind das Ziel, die Risiko-Klassierung und die genannten harten Auflagen — Reihenfolge
> im Schritt, Werkzeugwahl und Umsetzungsweg entscheidet die bauende Session selbst.
>
> **Gliederung = die sieben Baufelder** (Plan-Neuschnitt 29.8.2026, Auftrag David «radikal,
> Kontrolle abbauen wo nicht nötig»; löst den Council-Entscheid vom 3.7.2026 gegen eine
> ROADMAP-Restrukturierung ausdrücklich ab). Jeder Schritt trägt genau ein `feld:` — es sagt, auf
> welcher Code-Fläche er liegt, und ersetzt die früheren `kollision:`-Globlisten: **zwei Schritte
> desselben Felds laufen nie parallel, zwei verschiedener Felder immer.** Die Reihenfolge INNERHALB
> und QUER über die Felder steuert allein die `@queue`.

---

## ▶ Ausführungs-Protokoll (für jede künftige Bau-Session)

1. **Nimm den obersten offenen Schritt** (`npm run plan:next`); blockierte/`[D]` überspringen.
2. **Gate vor Abschluss:** `npm run gate` grün; verhaltensändernd ⇒ Golden byte-gleich.
3. **Markiere erledigt** (`plan:set … status=done`), Karten-Zeile in `STRUKTUR.md` nachziehen.
   Push/PR/Auto-Merge stehend freigegeben (§9: Merge nach `main` = Deploy; Sorgfalt VOR dem Merge).
   Commit-Trailer immer `Roadmap: <@meta id>`.
4. **Nur was steuert, bleibt hier.** Erledigt-Prosa wandert wörtlich in die
   [`ROADMAP-CHRONIK.md`](ROADMAP-CHRONIK.md), Detail-WIE in den verlinkten Fahrplan; je Streichung
   eine Begründungszeile in der Chronik. Grössen-Wächter: `struktur-rotieren.py --check`.

---

## Leitprinzipien (gelten immer)

1. **Amtliche Quellen, urheberrechtlich frei.** Inhalte ruhen **nur** auf amtlichen Werken
   (Art. 5 URG): Fedlex/kantonale amtliche Sammlungen, amtlich publizierte Entscheide + Regesten,
   amtliche Tarife/Verzeichnisse/Formulare, Botschaften/BBl. **Keine Kommentare/geschützte
   Sekundärliteratur.**
2. **Mehrwert-Test (§0).** Nur bauen/behalten, was echten Mehrwert über generische Werkzeuge
   liefert (sonst streichen + in `KATALOG-ROADMAP.md` begründen).
3. **Zeitsperre bis 1.12.2026.** Nur Arbeit, die (a) **keine Davids-Fachzeit** braucht `[OF]`
   und (b) die spätere Abnahme-Welle billiger macht. Kein `verified`/`geprüft` ohne David
   (§7/§8). `[D]` = geparkt, in der Abnahme-Warteschlange (nicht drängen).
4. **Eine Datensäule fertig führen.** Grosse Daten-Bulkläufe (Massenkorpora, Kantons-Import,
   Tarif-Tranchen) nie zwei gleichzeitig — die Reihenfolge steht als `dep` am Schritt, die
   Warnung bei belegter Fläche gibt `plan:next` (gleiches `feld` auf `wip`). *Ein P0-Bugfix an
   einem Asset ist kein Daten-Bulklauf.*
5. **Worktree-Isolation (§12)** bei jeder Parallel-Session; welche Schritte einander ausschliessen,
   sagt das `feld:`.
6. **Merge nach `main` ist der Deploy (§9, stehend freigegeben — Sorgfalt VOR dem Merge);** jeder
   verhaltensändernde Schritt golden-gegated (§6). **§1 (Logik vor allem) / §5 (eine Quelle)** sind
   Invarianten über allen Feldern. **Zustandslosigkeit** (kein Dossier-Creep) ist Querschnittsregel.
7. **Geräte-Last: nicht merklich langsamer — ausser bei Logikverlust** (CLAUDE.md §15): bei Konflikt
   gewinnt **immer die Treue**; jede Optimierung trägt eine Logikverlust-Bewertung.
8. **Endziel: alles Amtliche kennen, am Artikel verknüpfen, nur das Nötige kopieren** (David
   15.9.2026; «Nachweisdatenbank statt Volltextsammlung», 16.8.2026). Speicherklassen, je Quelle
   die niedrigste mit Mehrwert: **Verweis** (Regel) → **Zitat** (§7 a–d, nur wenn der Block am
   Artikel zeigt, was der Link nicht kann) → **Korpus** (nur wo unser Leser mehr kann als die
   Quelle). Aufnahme nur, wenn amtlich und frei (oder Auflagen erfüllbar), Artikel-Anker vorhanden,
   Mehrwert-Test bestanden. Spec: [FAHRPLAN-MATERIALIEN-VERZAHNUNG.md](fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md) §12.1.

**Verifikations-Blockaden (einmal definiert, danach nur referenziert):**
- **§4 — Lizenz/CORS für Live-Rechtsprechung** (CC-BY-SA vs. Art. 5 URG, CORS/Rate-Limits
  unbestätigt) → Rechts-/Lizenzbeurteilung = **`[D]`**. Solange offen: ENTSCHEIDSUCHE-P1 &
  KANTONALE-P1-Adapter **geparkt**. Nicht-§4-blockierte Korpus-/Übersichtsarbeit ist ausgenommen.
- **Prozesskosten I2** — die Recherche zu Schlichtungs-/Reduktionsfaktoren ist `[OF]` und **Teil von
  `W1·4`** (Entparkung 3.8.2026, David): erster Arbeitsschritt des Schrittes, kein Wartegrund.

<!-- @blockers
vps-bestellung-david: E3-Serving + E4-UI hängen an einer VPS-Bestellung (David, ~15 Min) — Dossier `bibliothek/betrieb/vps-bestell-dossier-2026-07-17.md` (PR #271). ECHTES David-Gate, kein Bau-Blocker; bis dahin sind QS-DATA/W2·6-DATA nur im NICHT-VPS-Teil baubar (E0–E4 sind lokal fertig). Entscheid David 14.9.2026: Bestellung erst nach Phase 2 (Kantone); Termin 13.9.2026 hinfällig.
richter-analytik-gate: Richter-/Spruchkörper-Analytik (W3·15-RICHTER). GRENZE (20.7.2026): Filtern/Facette/Verlinkung sind FREI und gebaut (#309/#311); gesperrt bleiben allein RANKING und PROGNOSE. Nur deskriptiv; bewusste Freigabe Davids erforderlich (heikel: Standesrecht, Persönlichkeitsschutz, richterliche Unabhängigkeit)
zielbild-gesetzesleser: Zurückgestellt durch das Zielbild-Dekret 1.9.2026 (Gesetzesleser zuerst) — wieder öffnen, sobald die Phasen 1–2 gelandet sind oder David einen Schritt ausdrücklich vorzieht (FINMA: vorziehen, wenn ein externer Termin drängt). Kein Bau-Blocker, reine Reihenfolge-Entscheidung.
david-go-entstehung: ERTEILT — Go David 11.9.2026 («führe alles durch»); die drei W2·6c-ENTSTEHUNG-*-Schritte stehen auf `status: ready`, Blocker entfernt. Design freigegeben 6.9.2026; §11.9 der Materialien-Spec bucht die Entscheide 1–6 als entschieden 11.9.2026 (Mandat), Nr. 7 (fachliche Abnahme) bleibt bei David.
david-bs-lizenz-schluessel: R12a — David klärt Lizenz LexWork-versions-Endpunkt + fragt amtlichen Schlüssel Erlass↔Geschäft bei BS an (Vormessung 12.9.2026).
-->

<!-- @david-fragen
zgb-a36-anhang: Die ZGB-Gliederung zeigt 74 Artikel des Anhangs «Wortlaut der früheren Bestimmungen des sechsten Titels» bewusst NICHT (Alt-Kuration A36; es sind aufgehobene Alt-Fassungen, im Lesetext weiterhin vorhanden und verlinkbar). Deine Vorgabe 13.8. («Artikel-Ebene in allen Gesetzen») ist sonst korpusweit erfüllt. Sollen diese 74 Alt-Artikel AUCH in der Leiste erscheinen? Aufwand: eine Zeile. Empfehlung: Nein (Alt-Recht bläht die Navigation, Lesetext deckt es ab).
-->
<!-- ^ Offene Fragen an David OHNE eigenen blockierten Schritt (sonst gehören sie in @blockers).
     Das Lagebild liest diesen Block mechanisch (davidFragen, scripts/plan/bildDaten.ts) —
     beantwortete Fragen HIER löschen, dann verschwinden sie von der Seite (§5). -->

<!-- @queue: W2·27-BUND-FERTIG, W2·5l-NORMTEXT-B2, QS-KORPUS, W2·20-VERWEIS-SCHAERFE, W2·22-VERWEIS-FEDLEX, W2·5m-LESER-V3, QS-PERF, W2·5n-BUND-VOLL, W2·21-ZULIEFERER, W2·6d-VERFAHREN-RECHERCHE, W2·6d-PARLAMENT-ARTIKEL, W2·13-KANTONE-DATEN, W2·13-KANTONE-DRIFT, W3·12, W2·5g-ZEIT, W2·14-SIGNAL, W2·6, W2·6d-BOTSCHAFT-TEXT, W2·6d-BULLETIN-VOTEN, W2·6d-URSPRUNG, W2·6d-ENTSTEHUNGSNOTIZ, W2·6d-VERNEHMLASSUNG-DOKUMENTE -->
<!-- ^ SSoT der Bau-Reihenfolge: plan:next wertet die @queue VOR der Dokumentreihenfolge aus;
     Integrität erzwingt check:plan Regel 8. Priorität ändern = NUR diese Zeile ändern.
     Ohne Queue-Eintrag entscheidet die Dokumentreihenfolge — Produkt-Felder stehen darum
     vor `Betrieb & Prüfstrasse`. -->

> **⬆ OBERSTER OFFENER SCHRITT: `W2·27-BUND-FERTIG`** (Sollbild «Was ist ein Gesetz bei LexMetrik», am Bund
> festgeschrieben und dort eingelöst — Restposten als Zeilen im Schritt; seit 18.9.2026 wieder
> `ready`, weil `wip` ohne Bau-Spur stand). Danach `W2·5l-NORMTEXT-B2` (Text-Treue M13/M14).
> **Phasen-Dekret 14.9.2026 (David):** «erst das fundament fertig bauen und vps erst danach» ·
> «der erste schritt sollte sein den gesetzesleser und die struktur der daten die wir darstellen zu
> optimieren» · «grundsätzlich würde ich zuerst mit dem bund beginnen». Das Zielbild-Dekret
> 1.9.2026 (bester Gesetzesleser für Schweizer Juristen, nur amtliche Quellen) bleibt; seine
> **vier Blöcke sind durch drei Phasen ersetzt** — Block 1 ist Historie (gelandet 1./2.9.2026:
> K3 #610, Leser-Tempo #612, Normen-Monitor #623). Die `@queue` bildet die Phasen ab:
> **1 Bund fertig machen** (Sollbild + Struktur-Schluss · Text-Treue M13/M14 · Korpus-Lücken ·
> Verweis-Schärfe + amtlicher Zitatgraph · Leser-V3-Rest · OR-Erst-Render und Register-Schnitt ·
> Bund-Vollabdeckung ~5 100 SR) → **2 Kantone** (Zulieferer-Entscheid als Prüfschritt zuerst, dann
> ZH und BS auf das Bund-Sollbild, danach BE/AG/SG/LU; VD/GE/TI und fr/it zuletzt) →
> **3 Mehr als Fedlex** (Zeitmaschine · Watchlist · Rechtsprechungs-Nachweis · Server/VPS).
> Nebenher ohne Phasenplatz: Fehlerbuch, Betrieb & Prüfstrasse, Fremdagenten. Rechner, Vorlagen,
> Design-Wärme und FINMA bleiben geparkt (`zielbild-gesetzesleser`); Fokus-Dekret 24.7.2026 bleibt
> enthalten. Wortlaute der Dekrete → `ROADMAP-CHRONIK.md`.

---

## Leser — Gesetzes-Darstellung  *(`feld: leser`)*

- [ ] **Gesetz-Leser V3 — Hülle neu, Kern unangetastet** *(`W2·5m-LESER-V3`, Auftrag David 16.8.2026)*
  <!-- @meta id: W2·5m-LESER-V3 · status: ready · blocker: null · dep: [] · feld: leser · fahrplan: fahrplaene/FAHRPLAN-LESER-V3.md -->
  Ziel: Leser-Oberfläche nach Apple-HIG-Prinzipien radikal vereinfacht; Kern (`ArtikelBody`,
  `ArtikelLeser`, Datenlogik) unangetastet, Golden byte-gleich. **H1–H5 und S1–S4 sind seit
  21.8.2026 vollständig** (Chronik; S-Buchung nachgeholt 15.9.2026). **Offen und damit neues
  Fertig-Kriterium:** die drei Deckel-/Schnitt-Posten unten, Einzelartikel E3 samt
  Rechtsprechungs-Block und der Fassungs-Diff-Tab.
  **Detail:** [FAHRPLAN-LESER-V3.md](fahrplaene/FAHRPLAN-LESER-V3.md) (Kurzfassung zuoberst; Kap. 7 Etappen H1–H5/S1–S4, Kap. 9 Fragen F1–F6).
  - [x] **Erledigt:** D0 · S1 · S2 — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 18.9.2026.
  - [x] **S4 · Trefferreihenfolge** — ✅ 16.8.2026 mit H2, PR #539 (`19a989f93`); die «Kantons-Probe», die #577 unter dieser Kennung führte, war ein Nachweis und ist erbracht (H4-Bogen Ziff. 7, PR #552). Wortlaut, Ursachen-Analyse und Kollisions-Auflösung aller vier Posten: ROADMAP-CHRONIK.md, Umschichtung 15.9.2026 (1).
  - [ ] **`leserV3Modell.ts` 420/420 und `uebersichtAngaben.ts` 418/420 schneiden** *(§17, offen nach #868)* — der v3-Deckel hat null Kopfraum; der Zukunftsfassungen-Hook (#863) musste deshalb nach `useZukunftsfassung.ts` ausweichen. Der Schnitt am Adapter ist laut Tor-Kommentar (16.8.2026) **verhaltenstragend** (Hook-Reihenfolge) ⇒ **eigener deklarierter Schritt** mit Rot-Beweis, kein Struktur-Umbau (§6.3). Dazu: der Satz «inzwischen in Kraft» gehört nach `src/lib/normtext/erlassKopfText.ts` (§5, heute zweite Heimat), `seo-detail.ts:354` trägt ihn unverlinkt.
  - [ ] **`ArtikelLeser.tsx` ca. Z. 621: Kommentar behauptet `data-such-meta` am «Gilt seit»-Block** *(Nebenfund 19.9.2026, PR #929)* — seit D40 (7.9.2026) trägt `[data-hist-druck]` das Attribut nicht mehr; folgenlos (der Such-Walker schneidet `display:none` ab), aber die Aussage ist falsch. Ein-Zeilen-Nachtrag.
  - [ ] **`NormText.tsx` 795/800 Zeilen** *(Messung 14.9.2026, `check:schlankheit`)* — fünf Zeilen Kopfraum: die nächste Änderung an der Datei lässt das Tor anschlagen. Erst schneiden (§6.6), dann ändern — kein Deckel-Anheben (§17). *(Nebenbefund der Jules-Suggestions-Sichtung 14.9.2026.)*
  - [x] **Erledigt:** Tor-Konflikt `erlassAnsicht.ts`-Deckel (§17-Wurzel-Fix) #868 (`892a6f0fb`) · Nachbar-Artikel-Pfeile + Rohdaten-Link je Erlass #854 (`7b0338916`) · Rohdaten-Zeiger ohne `fassungsToken` (#854 — §7 d verlangt Drift-**Erkennung**, keinen Hash-Abdruck im UI) · **Einzelartikel-Ansicht E1 + E2** #869 (`946cb155d`, David «merge»: Umschalter, Blättern, Dossier-Blöcke). Wortlaute: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (4)/(6) und 15.9.2026 (1).
  - [ ] **Einzelartikel-Ansicht E3** *(Rest des Konzepts Kap. 15)* — offen (Druck/Export). Ebenfalls offen: der **Rechtsprechung-Block im Artikel-Dossier**, bewusst hinter M3 / `QS-KORPUS` gestellt (Formulierung aus PR #869).
  - [ ] **Gliederung: Standort sichtbar, Mitlaufen beim Lesen, Auf/Zu-Handling** *(David 15.9.2026: «gliederung ist vom ui handling noch schwerfällig … man erkennt nicht so gut wo man sich befindet»)* — aktiver Abschnitt/Artikel deutlich markiert und in der Seitenleiste im Blick gehalten; Auf-/Zuklappen mit weniger Klicks (Nachbarn: «ganz auf/zu» Fahrplan LESER-V3 #16, Klickpfad 161 ms QS-PERF-Rest, Knoten-Merge-Bug FAHRPLAN-OFFENE-BEFUNDE §Gliederungsbaum). Mehrwert-Satz **gemessen 18.9.2026** (Browser, fedlex.admin.ch, OR): 522'993 px auf einer Seite, **null** `position:sticky|fixed` beim Lesen, kein IntersectionObserver, das Inhaltsverzeichnis (1'603 Anker) nur am Seitenanfang — Fedlex gibt beim Lesen keinerlei Standort-Rückmeldung. **Marke + Klickziel vorgezogen PR #894**; **Mitlaufen erledigt 18.9.2026** (s. Unterzeilen). Offen: Auf/Zu-Handling.
    - [x] **Gliederung «noch schlecht» — Standort und unterste Ebene** *(Befund David 19.9.2026)* — ✅ 19.9.2026: gemessen = Anzeige (Art.-Ebene `art@` lief mit Zeilenzustand auseinander) + Daten (SVG-Randtitel «Grundregel»); Anzeige #924, Daten #923 (Gegenprüfung bestanden). Detail: Session-Karte STRUKTUR.md 19.9.2026 (2).
    - [x] **Erledigt 18.9.2026:** Mitlaufen beim Lesen · Standort-Fläche war ein Fehlalarm · Wächter auf Synchronität geschärft — PR #914 (`606b19066`) + #916. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 18.9.2026 (Leser-Mitlaufen).
    - [x] **Erledigt 19.9.2026:** Auf/Zu-Handling + Befund David 19.9. («svg art. 26 nicht ersichtlich … unterste ebene klappt nicht auf», Nachtrag «auch das aufklappen soll optimiert werden») — Zeilen-Offen-Zustand aus dem Sichtbaren abgeleitet (`zeilenAnsicht`), alle ausdrücklichen Öffner über `klappKarte.ts` inkl. Artikel-Ebene, ein Klick öffnet ganz, «alles auf» öffnet die Artikel, Marke nach Sprung auf dem Artikel; Wächter `gliederung-sichtbarkeit.test.ts` (vorher 11/12 rot, u. a. 4'690 offen-leere Zeilen). Daten-Teil SVG-Randtitel «Grundregel» PR #923 (Gegenprüfung bestanden).
    - [ ] **8 Artikel ohne eigene Gliederungszeile** *(Messung 19.9.2026)* — OR 748_750, 752, 858, ZGB disp_u1_art_39 u. a. (Umfang `luecken`) nur über die Abschnittszeile erreichbar; prüfen, ob gewollt.
    - [ ] **Struktur-Extraktor liest Randtitel aus HTML statt aus `fedlex:role="marginal"` (XML)** *(Nebenfund 19.9.2026, #923)* — Fix greift nur bei h1–h5-Auszeichnung der Gliederung; robuster wäre das amtliche XML-Attribut. Risikopfad.
    - [ ] **CLS-Flake `e2e/leser-funktionszeile-zaehler.e2e.ts:80`** *(Nebenfund 19.9.2026, #924)* — CLS konstant 0.04387 gegen 0.001, nur unter Parallel-Last (merge-base `135ec0cba` 8/20 rot, einzeln 0/8); Quelle unbekannt. Wurzel suchen (§17), nicht Budget anheben.
    - [ ] **Bezugslinien-Orakel liegt in zwei Specs** *(§5-Nebenfund 18.9.2026)* — die Regel «`scroll-margin-top` + 8, Zwischenraum» steht jetzt in `e2e/leser-marke-mitlaufen.e2e.ts` **und** `e2e/leser-spy-w25d.e2e.ts`; die Kopie trägt einen Querverweis auf die Herleitung. Sauber wäre ein Baustein unter `e2e/helpers/` — bewusst nicht im selben Schritt gezogen, weil er `leser-spy-w25d` mitverändert hätte (§6.3: eigener deklarierter Schritt).
    - [ ] **Empfindlichkeitsgrenze der Rückstands-Sonde** *(Messung 18.9.2026, kein Mangel — Dokumentation)* — eine auf **60 ms** verkürzte Entprellung liegt bei 51/59 = 86 % treu, reisst die 90-%-Schranke also nur knapp und die 5-%-Schranke gar nicht. Unterhalb des Frame-Intervalls des Runners ist eine Trailing-Entprellung prinzipiell nicht mehr von Synchronität unterscheidbar. Steht als Warnung im Test-Kommentar; **die 90 % nie blind hochschieben** (Ist-Stand unter 10× Drossel: 98 %).
    - [ ] **Akkordeon klappt nur bei Scroll-Ruhe tiefer auf** *(Nachzug Gegenprüfung 18.9.2026, P6 ii)* — bei pausenlosem Dauerzug bleibt die Marke auf Pfadtiefe 1 («Erste Abteilung …»), nach 1 s Ruhe Tiefe 5 («II. Grundsatz»); heute strikt binär «scrollt/ruht». Prüfen, ob langsames, aber nicht pausierendes Lesen früher aufklappen darf — Grenze ist der Reflow im Scroll (§15, a33-CLS-Wurzel nicht antasten).
    - [ ] **Stop-and-go-Wächter messen die eigene Messpause** *(§17-Nebenfund 18.9.2026)* — `e2e/leser-gliederung-a33.e2e.ts` (F1 «Highlight folgt») blieb grün, während die Funktion beim durchgehenden Lesen nie ansprang: er wartet nach jedem 120-px-Schritt 260 ms und lässt damit genau den Timer feuern, der beim echten Lesen verhungert. Regel verankert in `.claude/rules/webseiten-pruefung.md`; offen ist, F1 selbst auf eine pausenlose Strecke zu heben.
    - [ ] **`w224-d35-f2-kopf.e2e.ts:96` unter Last** *(Nebenfund 18.9.2026)* — riss einmalig im Vollauf (5 Worker) mit `element(s) not found`, isoliert 27/27 bzw. 9/9 grün, diff-fremd; im Gegenlauf riss stattdessen `leser-r1-r2.e2e.ts:420` (Byte-Längen-Drift). Indiz für Last-Flake, **kein Beweis** — lokal 10 vCPU gegen CI 2 vCPU. Bei Gelegenheit gedrosselt wiederholen.
  - [ ] **Fassungs-Diff-Tab** — UI-Anteil zu `W2·5l-NORMTEXT-B2` M16 (Fassungs-Zeitleiste), erst danach; einziges Vorbild mit echtem Diff: Légifrance «Comparer les versions». Quelle: Fremdnutzen-Suchrunde 2 (6.9.2026) §3 #9.

- [ ] **Kantonale Gesetze — Darstellung & Suche** *(`W2·13-KANTONE`, Auftrag David 12.7.2026, `[OF]`; Phase 2, Entscheid 14.9.2026)*
  <!-- @meta id: W2·13-KANTONE · status: ready · blocker: null · dep: [] · feld: leser · fahrplan: fahrplaene/FAHRPLAN-KANTONE.md -->
  Hier die NICHT-Risiko-Einheiten (reine Darstellung/Suche/Anzeige); Extraktion & Daten liegen in
  `W2·13-KANTONE-DATEN`. **Fertig, wenn** K-1 bis K-11 abgehakt sind.
  **Detail:** [FAHRPLAN-KANTONE.md](fahrplaene/FAHRPLAN-KANTONE.md) §2.
  - [x] **Erledigt:** K-1 · K-2 · K-3 · K-5 · K-11 — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 7.9.2026 (2).
  - [ ] **des/der-Guard Bund passus-tolerant** *(K-5-Ausläufer, Messung 31.8.2026)* — hätte 371 Self-Links in 226 **Bundes**-Erlassen entfernt ⇒ fachliche Änderung mit eigenem Schritt (§6.3), nicht golden-neutral; Caveat: die «über»-Alternative erzeugt echte Self-Verweise (VTS art_222j), 7 von 8 Stichproben der Kandidaten waren falsch.
  - [ ] **Kanton-Lücken-Hinweis auch im prerenderten HTML** *(Auflage F4 Gegenprüfung PR #616, 2.9.2026)* — der Hinweis «Nicht vollständig erfasst» erscheint erst nach Hydration; `scripts/prerender.ts` (`erlassVolltextHtml`) kennt den Sidecar `kanton-luecken.json` nicht ⇒ §8-Offenlegung fehlt für Crawler/No-JS, und `check:perf-lighthouse` misst nur `/gesetze/bund/OR` (CLS des Kanton-Kopfs unbewacht). Zwei Renderpfade, einer offenbart (§5).
  - [ ] **«§ N» in Fremdgesetz-Chapeau-Items verlinken** *(K-5-Lücke, 31.8.2026)* — `ArtikelBody` baut `fremdIntern` ohne `paragrafDesigniert`; dort bleibt «§ N» unverlinkt (konservativ, §1-konform — Nachzug klein).

- [ ] **Verweis-Schärfe: Binnenverweise, Aussen-Anzeige, Inventar** *(`W2·20-VERWEIS-SCHAERFE`, Auftrag David 31.8.2026)*
  <!-- @meta id: W2·20-VERWEIS-SCHAERFE · status: ready · blocker: null · dep: [] · feld: leser · fahrplan: fahrplaene/FAHRPLAN-VERWEIS-SCHAERFE.md -->
  «Art. xx dieses Gesetzes» springt im Gesetz; Verweise nach ausserhalb sind als solche erkennbar;
  Inventar-Schärfe messbar statt Kommentar-Zahlen. **Gebaut:** V-1 bis V-4, V-6, V-7/V-8 (1.9.2026,
  PR #599), V-7c 14.9.2026 (Zeile unten) — Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (6).
  **Offen (Phase 1):** Kurztitel OHNE Korpus-Erlass (~146 Stellen) — hängt am KORPUS, nicht am
  Erkenner; Wurzel-Fix ist der Snapshot (`QS-KORPUS`, Kernerlasse-Tranche 2), nie eine
  Wächter-Lockerung. **Phase 2:** kantonale Namensliste (916). **Phase 3:** V-5 an `W2·5g-ZEIT`.
  Kein Link besser als falscher (§1).
  **Detail:** [FAHRPLAN-VERWEIS-SCHAERFE.md](fahrplaene/FAHRPLAN-VERWEIS-SCHAERFE.md) §1.
  - [x] **V-7 Bund-Rest: Trägergesetz-Kontext + Kurztitel-Positivliste** — ✅ erledigt 14.9.2026, PR #864. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 18.9.2026.
  - [ ] **V-7-Folgen** *(Nebenfunde #864)* — **(a)** `KLAMMER_NACH_NAME` sperrt ArGV 4 `art_37` Abs. 4 → ArG Art. 7 Abs. 4, obwohl der Link korrekt wäre: Klammer-Guard auf die Kürzel-Form (≥ 2 Grossbuchstaben) einschränken; **(b)** `definiertGesetz` arbeitet mit einer endlichen Einführungswort-Liste — breiterer Filter «Gesetz eigenständig in Klammer»; **(c)** `NormText.tsx:407` liest den Erlass-Key ohne `decodeURIComponent` (§5-Abweichung gegen `inhalt-sprung.tsx:279`). *Risikopfad ⇒ Gegenprüfung.*
  - [ ] **Kantonales Trägergesetz-Register** *(Phase 2, Folge aus #864)* — 19 kantonale Vollzugsverordnungen (AR u. a., HuV → HuG) verlieren mit #864 den falschen Self-Link, bekommen aber keinen richtigen: die Ingress-Auswertung gibt es nur für den Bund (nur dort tragen die Struktur-Sidecars den Ingress). Kein Link ist besser als ein falscher (§1) — der Nachzug ist ein eigener Schritt. Dazu die **12. Handkopie der Suffix-Reihe**: `KantonNormText.tsx:49` (`RE_PARAGRAF`) trägt nur `(?:bis|ter)?`, darum bleiben SO-614.11 § 115septies…undecies unverlinkt (Kanton-Grammatik auf `ART_SUFFIXE` ziehen).

- [ ] **Treffer-Landkarte: wo im Dokument liegen die Treffer** *(`W2·28-TREFFER-LANDKARTE`, David 18.9.2026; reine UI)*
  <!-- @meta id: W2·28-TREFFER-LANDKARTE · status: ready · blocker: null · dep: [] · feld: leser · fahrplan: fahrplaene/FAHRPLAN-RECHERCHE-KOMFORT.md -->
  Streifen neben dem Scrollbalken mit einer Marke je Suchtreffer (Gesetz + Entscheid), Klick springt; dieselbe Trefferquelle wie die Hervorhebung (§5).
  **Detail:** [FAHRPLAN-RECHERCHE-KOMFORT.md](fahrplaene/FAHRPLAN-RECHERCHE-KOMFORT.md) §1.

- [ ] **Verzahnung sichtbar machen** *(`W2·7-VZUI`, David-Auftrag 3.7.2026; reine UI auf vorhandenen Daten)*
  <!-- @meta id: W2·7-VZUI · status: ready · blocker: null · dep: [] · feld: leser · fahrplan: fahrplaene/FAHRPLAN-VERZAHNUNG-UI.md -->
  EINE Interaktions-Grammatik für die Verzahnung, ohne neue Rechtsregel (§3). Offen: V2 (E3-Serving)
  und V3 (E6a) — an den Datenstrang gekoppelt. Fertig-Kriterium (Panel-Reiter fachlich sauber
  geschnitten) ✅ erfüllt 31.8.2026 — Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (2).
  **Detail:** [FAHRPLAN-VERZAHNUNG-UI.md](fahrplaene/FAHRPLAN-VERZAHNUNG-UI.md) §11.
  - [x] **Erledigt:** Grundzustand-Fetch · `?norm=`-Sprung · vierter Reiter «Anwendung» — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 7.9.2026 (2).
  - [ ] **Kantonaler Zitat-Resolver** — 9 674 kantonale Kanten haben weiterhin kein Sprungziel: `fedlexLinkFuerArtikel`/`normVerweiseImText` kennen nur Bundesrecht, und die wörtliche Regel greift nur, wo der Entscheid exakt `§ N <Kürzel>` schreibt. Nötig wäre eine Kürzel-/Alias-Tabelle je kantonalem Erlass **mit Kanton-Scoping** (ein «StG» in BS ist nicht das «StG» in ZH — ohne Scoping entstünde ein stumm falscher Sprung, §1). Risiko-Pfad Extraktion ⇒ eigener Schritt mit Gegenprüfung, nicht als UI-Nebenprodukt.

---

## Korpus — Gesetzes- & Materialiendaten  *(`feld: korpus`, durchgehend Risikopfad)*

> Jede Zeile dieses Felds berührt Extraktion oder amtliche Substanz ⇒ **Gegenprüfung Pflicht**,
> Beleg mit Norm + Link + Stand (§7), Korrektur nie in der Projektion, immer in der Pipeline-Quelle
> (§5), golden byte-gleich bzw. deklarierter Re-Bless.

- [ ] **Amtlicher Fedlex-Zitatgraph: Erlass-Verweise ohne Artikelnummer + Warn-Bericht + «zitiert von» (Bund)** *(`W2·22-VERWEIS-FEDLEX`, Fremdquellen-Sichtung 2.9.2026)*
  <!-- @meta id: W2·22-VERWEIS-FEDLEX · status: ready · blocker: null · dep: [] · feld: korpus -->
  *dep auf W2·20 gelöst 14.9.2026: die V-1-Basislinie (`check:verweis-inventar`) besteht seit PR #599; der Rest von W2·20 (V-7-Bund-Rest, V-5) ist keine Vorbedingung des Zitatgraphen.*
  Quelle: [fremdquellen-sichtung-2026-09-02.md](bibliothek/recherche/fremdquellen-sichtung-2026-09-02.md)
  §1 (Rangliste #1/#2) + Abschnitt «jolux:Citation» im Dossier (OR: 2 315 Citations = 2 315
  AKN-Fussnoten-refs; kein `citationToReference`). Risikopfad — Gegenprüfung Pflicht.
  - [x] **Erledigt:** Z1 · Z2 · Z3 · Z5 — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 7.9.2026 (2).
  - [ ] **Z6 Gemessene Rest-Kanten der Verweis-Erkennung** (Nebenfunde aus Z5 und seiner
    Gegenprüfung, 2.9.2026):
    (a) ✅ erledigt 14.9.2026, PR #852 (`4c38d316b`) — Suffix-Reihe EINMAL in `src/lib/fedlex/nummer.ts`,
    13 Fundstellen in 9 Bundeserlassen lösen neu auf; (b) ✅ erledigt (Chronik, Umschichtung 6.9.2026);
    (c) ✅ erledigt 14.9.2026, PR #856 (`40f2c2967`) — **39 tote Fremd-Anker von 10 276 prüfbaren**,
    28 Ziele (36 Bund / 3 Kanton BS), Fallback auf den Erlass-Link, Wächter `check:verweis-inventar`.
    *Zahl-Korrektur 14.9.2026: «16 tote Anker» war ein Z5-Teilbestand, «10 254» der Stand vor #852 —
    massgeblich ist das Artefakt nach #852 (10 276). Wortlaut beider Bau-Befunde: ROADMAP-CHRONIK.md,
    Umschichtung 14.9.2026 (6).*
  - [ ] **Suffix-Reihe noch zweimal von Hand** *(§5-Duplikat, Nebenfund #852)* — `src/lib/normtext/passus.ts`
    endet bei `quinquies`, `src/lib/suche/normQuery.ts` und `src/lib/pdf/normLinks.ts` tragen verkürzte
    Reihen; alle drei auf `ART_SUFFIXE` (`src/lib/fedlex/nummer.ts`) umstellen. Dazu die Zähl-Divergenz
    `struktur-extrahiere.ts` ↔ `fussnoten-extrahiere.ts` (verschiedene Regex-Mengen für `__N`) auf eine
    gemeinsame Funktion ziehen. Korrektur zur Zeile (a): es sind **sechs** Konsumenten, nicht vier
    (`url`, `erkennung`, `parser`, `spannen`, `NormText.tsx`, `verweis-inventar-transkription`).
  - [ ] **Z6c-Folgen** — **(1)** Sammel-Anker auflösen (19 Ziele, `sammelblockFuer()` erkennt 15);
    **(2)** Umnummerierungen ZGB 89bis→89a (7 Ziele, Alias ≠ Block-Sprung); **(3)** kantonaler
    Fallback (V-3-Weiche, 579 Stellen, 3 tote) + Projektion vom Leser-Prefetch lösen (14.66 KB
    gzip auf jeder Seite); **(4)** V-4 intern adressieren statt immer Fedlex.
    *Alle Risikopfad ⇒ Gegenprüfung. Herleitung und Wortlaut: Chronik, Umschichtung 14.9.2026 (3).*
  - [ ] **Z4 Leser-Schicht «zitiert von»** (Erlassebene, nur Bund) — erst nach Z1–Z3 und Abnahme.

- [ ] **Norm-Zeitmaschine + Fassungs-Diff** *(`W2·5g-ZEIT`, Ideen-Intake 20.7.2026; Phase 3 — FR/IT-Datenanteil gehört hierher, Entscheid David 14.9.2026 «fr/it später», FAHRPLAN-BUND-FERTIG §4 a)*
  <!-- @meta id: W2·5g-ZEIT · status: ready · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-GESETZESDARSTELLUNG-V2.md -->
  «Art. X, wie er am Tag Y galt» + visueller Diff zweier Konsolidierungen; harte Bau-Reihenfolge
  (a) POC → (b) AKN-XML Phase 1 + `G-HIST` → (c) Bau.
  **Detail:** [FAHRPLAN-GESETZESDARSTELLUNG-V2.md](fahrplaene/FAHRPLAN-GESETZESDARSTELLUNG-V2.md) §8.
  - [ ] **Mehrsprachiger Normvergleich DE/FR/IT** — Auslegungswerkzeug nach Art. 14 PublG; heute ist nur `de` befüllt. Regel aus `QS-FRIT-DRIFT`: **eId trägt nicht über Sprachen** — Abgleich über die Artikelnummer.

- [ ] **Phase 1 · Bund fertig machen — Sollbild und Struktur-Schluss** *(`W2·27-BUND-FERTIG`, Entscheid David 14.9.2026)*
  <!-- @meta id: W2·27-BUND-FERTIG · status: ready · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-BUND-FERTIG.md -->
  Dach der Phase 1: einmal niederschreiben, **was ein Gesetz bei LexMetrik ist**, und es am Bund
  einlösen — Sollbild, Datenstruktur schliessen, Leser schärfen, dann alle Bundeserlasse. Der
  Schritt trägt selbst nur die Struktur-Posten ohne eigenen Schritt; die übrigen Phase-1-Einheiten
  sind bestehende Schritte (`W2·5l-NORMTEXT-B2` … `W2·5n-BUND-VOLL`), ihre Reihenfolge steht in der
  `@queue`. **Fertig, wenn** ein Schweizer Jurist jedes Bundesgesetz vollständig, strukturgleich und
  schneller als auf Fedlex liest.
  **Detail:** [FAHRPLAN-BUND-FERTIG.md](fahrplaene/FAHRPLAN-BUND-FERTIG.md) §3.
  - [x] **Erledigt 14.9.2026 (Phase-1-Welle, alle vier Risikopfad-PRs mit bestandener Gegenprüfung):** Sollbild + Messung (elf Bausteine, Fahrplan §1/§2) · Sidecar-Drift-Riegel 216/228 **und** KKV-Token `126_z__2` — #851 (`6c4f9fa2f`) · `aufgehoben` strukturell statt Text-Heuristik, 0 → **1 277/25 463**, Wächter `check:leerstellen` — #859 (`d16acf466`) · `confidence.json`-Neulauf (Qualitätsbild 23.6. → 14.9.2026) — #848 (`90cb59fff`) · Zukunftsfassungen-Hinweis im Leserkopf — #863 (`7f5aa592e`). **Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (6).**
  - [~] **Randtitel-Doppelmodell auflösen** *(David 14.9.2026, Fahrplan §4 c)* — **Phase-1-Schnitt ✅ 15.9.2026, PR #889 (`d20e3f5d3`, Gegenprüfung bestanden 5a93ac060)**, Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 15.9.2026 (4). **Rest Phase 2 (Fahrplan §1.2):** Kanton `titel` → `marginalie`, Suchindex, NormChip, `struktur-lexwork.ts:317`; der `titel`-Zweig ist heute toter Code (Prüfer B3) ⇒ evtl. ersatzlos rückbaubar.
  - [x] **§8-Anzeige der ungeklärten Leerstellen** *(Auflage Gegenprüfung #859)* — ✅ 15.9.2026, PR #892 (`674cc42ae`, Gegenprüfung bestanden dbe25de86): «kein Text im Snapshot» statt «aufgehoben». Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 15.9.2026 (4).
  - [x] **§17 · `confidence.json` ohne Frische-Tor** *(Wurzel-Befund Prüfer #848)* — ✅ 15.9.2026, PR #888 (`3202047ae`, Gegenprüfung bestanden af1d214a3): Tor `check:confidence-frische`. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 15.9.2026 (4).
  - [x] **KKV-Label `Art. 126z` statt `Art. 126ztredecies`** *(Nebenfund Prüfer #851)* — ✅ 15.9.2026, PR #890. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 18.9.2026. Rest: `__N`-Deep-Link, Label-Drift-Tor (Zeilen unten).
  - [ ] **Staatsverträge ohne Randtitel und Historie — Befund korrigiert 15.9.2026, Rest = «gilt seit»-Projektion** — 17 Staatsverträge (CISG, LugÜ, CMR …) + VBB/VG. Randtitel amtlich nicht vorhanden (Fedlex-Heading nur «Art. N», §7); Historie: LugÜ = Anhang-Fussnoten → `W2·5l` M13, CMR ohne Datum. **Offen (Leseoberfläche):** Artikel ohne Historie-Ereignis zeigen «Erlass in Kraft seit …» als Projektion aus `inkrafttreten.json`. Spec: Fahrplan BUND-FERTIG §2 Z.3, `w227-staatsvertraege-spec.md` (Übergabe).
  - [ ] **Aufhebungs-Signal: Anhänge/`<section>` und «Gegenstandslos»** *(Prüfer #892)* — `aufhebung-signal.ts` kennt nur «Aufgehoben durch»; StGB 67f «Gegenstandslos gemäss …» bleibt «leer-ungeklärt». *Risikopfad ⇒ Gegenprüfung.*
  - [ ] **Absatz-genaues Aufhebungs-Signal zur Bauzeit** *(Bauer #892)* — heute pauschal je Artikel; 872 Bund- (Historie-Shard) und ~869 Kanton-Absätze (`abrogation_ellip`) könnten absatzgenau «aufgehoben» tragen. *Risikopfad ⇒ Gegenprüfung.*
  - [ ] **`verifikationslink.ts` unterdrückt den Deep-Link bei `__N`-Token** *(Nebenfund #890)* — seit `amtlicherAnker()` (`#ta126z`) freigeben, wenn `quelleUrl` einen amtlichen Anker trägt. Klein.
  - [ ] **`artikelLabel`/`quelleUrl` ohne Drift-Tor** *(§8, Fahrplan §1.1, PR #890)* — golden-neutral, stille Änderung fiele nicht auf; Kandidat: Riegel in `check:normtext`.
  - [ ] **Frische-Tor-Lücke Umbenennung** *(Prüfer #888)* — Umbenennung einer Snapshot-Datei bewegt weder `artikel.sha` noch Dateizahl; Kandidat: Dateinamen in den Manifest-Hash.

- [ ] **Schlusstitel/UeB/Anhänge (M13) + wortgenaue Fussnoten (M14)** *(`W2·5l-NORMTEXT-B2`)*
  <!-- @meta id: W2·5l-NORMTEXT-B2 · status: ready · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-NORMTEXT-DARSTELLUNG.md -->
  **Golden-Re-Bless erwartet** (additiv). Tragende Falle: Token-Kollision `disp_u1`/`art_1` — ohne
  eigenen id-Raum stiller Daten-Verlust.
  **Detail:** [FAHRPLAN-NORMTEXT-DARSTELLUNG.md](fahrplaene/FAHRPLAN-NORMTEXT-DARSTELLUNG.md) §M13/§M14
  (§-Sigel nachgezogen 30.8.2026 — Regel 11 bindet).
  - [ ] **Signature-Sektion und Sonder-Sektionen ohne Fussnoten** *(§8-Lücke, Prüfer #860, 14.9.2026)* — `<section id="signature">` (Unterschriftenblock, EMRK) landet in **0 von 231** Bund-Snapshots; Sonder-Sektionen tragen **korpusweit 0 von 410** Fussnoten (belegt an EMRK FN 38, EÖBV FN 17/18). Gehört zum M13-Schlussteil-Ausbau, nicht zu W2·27. Dazu `scripts/normtext-snapshot.ts` exakt auf dem 1747-Zeilen-Deckel (§6.6) — Split in dieselbe Generator-Einheit.
  - [ ] **Tabellen in Gesetzen lesbar machen** *(hierher verschoben 1.9.2026, Zielbild Gesetzesleser)* — Beispiel-Defekt `/gesetze/kanton/BS-154.810#art-29`; Zellinhalte exakt wie Quelle, mehrdeutig ⇒ Block als Text belassen (§1). Grenze zu `K-7` beachten. [FAHRPLAN-GESETZES-UX.md](fahrplaene/FAHRPLAN-GESETZES-UX.md) §18.
  - [x] **Erledigt:** M15 (absorbiert in `W2·6c-ENTSTEHUNG-DATEN`) — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 7.9.2026 (2).
  - [ ] **M16 · Fassungs-Zeitleiste je Erlass (point-in-time)** — **Datenanteil absorbiert in `W2·6c-ENTSTEHUNG-SYNOPSE` (6.9.2026; 57 künftige HTML-Stände bis 2032 belegt, R2); UI-Umschalter bleibt hier.** — Konsolidierungsdaten inkl. Zukunftsfassungen aus Fedlex als Zeitleiste; UI-Anteil später im Leser. Muster legalize-ch (Konsolidierung = Commit), Laws.Africa Indigo, legislation.gov.uk. Quelle: Fremdquellen-Sichtung 2.9.2026 §1 #17, Quelle: Rules-as-Code-Sichtung 5.9.2026 §8.

- [ ] **Bund-Vollabdeckung: alle SR-Erlasse mit deutschem Fedlex-XML** *(`W2·5n-BUND-VOLL`, Entscheid David 1.9.2026 nach Quellen-Sichtung; **Abschluss Phase 1**, Auflage Register-Schnitt aus `QS-PERF`)*
  <!-- @meta id: W2·5n-BUND-VOLL · status: ready · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-FEDLEX-PORTFOLIO.md -->
  Ziel: von 238 gepinnten auf alle ~5'100–5'500 SR-Erlasse mit deutscher Akoma-Ntoso-Konsolidierung
  (Inventar per SPARQL, Zweitlesung gegen die Inventare von Legalize-ch und OpenCaseLaw), über die
  bestehende Fedlex-Pipeline — kein PDF-Weg. **Harte Auflage:** erst nach dem Register-Schnitt aus
  `QS-PERF` (das 9,5-MB-Register darf nicht mitwachsen; Projektion je Erlass, Deckel `check:perf-budget`).
  Golden byte-gleich für den Bestand; neue Erlasse Status «entwurf». **Fertig, wenn** das Inventar
  0 fehlende deutsche XML-Konsolidierungen meldet.
  **Detail:** [FAHRPLAN-FEDLEX-PORTFOLIO.md](fahrplaene/FAHRPLAN-FEDLEX-PORTFOLIO.md) §21.

- [ ] **Kantonale Gesetze — Daten & Extraktion** *(`W2·13-KANTONE-DATEN`, Aufteilung 8.8.2026, sortenrein; Phase 2, Entscheid 14.9.2026)*
  <!-- @meta id: W2·13-KANTONE-DATEN · status: ready · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-KANTONE.md -->
  Skill `korpus-werkstatt` + Gegenprüfung + golden byte-gleich; zwingende Binnenfolgen stehen an der
  Zeile. **Detail:** [FAHRPLAN-KANTONE.md](fahrplaene/FAHRPLAN-KANTONE.md) §2.
  - [ ] **K-4 · Einzel-Nachzüge Stand/Currency** *(F14/F9 + SO-Lektion)* — Invariante «stand ≤ Generierungsdatum» ins Tor `check:normtext`. §1-A.
  - [ ] **K-6 · Quellen-Hygiene: lexfind → amtlich + Dedupe** *(F7/F8/F15/F11/F25-Keys/F22)* — pro Kanton eine Tranche; K-6a vor K-6d. §1-A.
  - [ ] **K-7 · PDF-Werkstatt VD/SZ/ZH + Range-Platzhalter** — Teil a ist das **harte Dehyphenations-Gate**; ohne es bleibt jeder FR/VS/AR-PDF-Nachzug gesperrt. §1-A. **Teil b (15.9.2026): PDF-Kern** — ein Leser aus `adapter-pdf.ts` + `adapter-zh-pdf.ts` (Golden byte-gleich), Fehlerraten-Messgeschirr, pdfjs↔PyMuPDF-Vergleich; Vorbedingung `W2·6d-BOTSCHAFT-TEXT` B. Detail: Fahrplan Materialien §12.3 Etappe 1.
  - [ ] **K-8 · xhtml-`<p>`-Strukturerhalt** *(F21)* — Schema nur additiv, Golden-Diff korpusweit offline. §1-A.
  - [ ] **K-9 · Erlass→Werkzeug-Brücke Kanton** *(F38)* — Build-Zeit-Inversion der Tarif-`quelleUrl`s + Konsistenz-Tor. §1-A.
  - [ ] **K-10 · AR-Sidecar-Batch** *(F30-AR)* — nur amtliche Überschriften, **Einzel-Erlass-POC vor dem Batch**. §1-A.
  - [ ] **K-12 · Reports & kuratierte Listen** — lesend/planend; K-12a-AR-Anteile erst nach dem F20-Gate aus K-7. §1-A.
  - [ ] **K-13 · Systematik-Bäume 7 Kantone** *(F6≡F43)* — ZH ✅ 31.8.2026 (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026). Offen: GE/VD/TI/SZ/NE/JU (+GL-Index-Ordinalzahlen, +ZH-Band-Zweig); Quell-Erhebung je Kanton empirisch und browserlos. §1-A.
        *Nachtrag 31.8.2026 (N0b, an den Merge-Stand 1.9.2026 angepasst): die f… — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 8.9.2026 (Landung).*
  - [x] **Erledigt:** ZH-Stufe 2 · 2b · 2c · Kern-Erlasse · ZH-4e · K-14 · `inkraftSeit` (geprüft und abgelehnt) — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 7.9.2026 (2).
  - [ ] **R1-Restposten** *(Auflage GP PR #629)* — stille Randtitel-Auslassung ZH-615 §§ 1–2; 14 Randtitel scheitern an der Marker-Zählweise (Art. vs. §). Fix an der Snapshot-Zählweise, nicht am Sidecar. §1-A. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026.
  - [ ] **ZH-4d · Gliederung + Übergangsbestimmungen** *(Befund 31.8.2026)* — offen: Marginalien-/Randnoten-Ebene (braucht den Tag-Leser) und die Aufnahme von Übergangs-/Schlussbestimmungen samt PBG-Anhang als eigener Eintragstyp; Lücke in `kanton-luecken.json` ausgewiesen (§8). Vor ZH-Stufe 3. §1-A. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026.
  - [ ] **Systematik-Upstream-Drift AG/BS** *(Befund 31.8.2026, bewusst nicht mitgenommen)* — ein frischer `kanton-systematik-run.ts` zeigt: AG verliert Knoten 401, BS gewinnt 731/788/RiE#731. Eigener Schritt, damit der ZH-Diff sortenrein bleibt. §1-A.
  - [ ] **`check:paritaet` ist gegen Datei-LÖSCHUNG blind** *(Nebenfund ZH-Fix-Runde 3, 31.8.2026 — bewusst NICHT hier gefixt, fremde Baufläche `scripts/datenhaltung/**`)* — Befund-Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (5); Bau-Einheit offen, Zeiger genügt zur Steuerung.
  - [x] **Erledigt 12.9.2026:** K-15 BE-Sprengel (#810, `064d191f6`) · K-16 BS-Materialien (#799, `c83501304`) · Deckel-Reserven R12b (#802, `c0acd4557`) — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 12.9.2026 bzw. 14.9.2026 (6). Die vier Nachzüge (Abnahmen, UI-Verdrahtung, CC-BY-Nennung) stehen unverändert offen.
  - [ ] **K-15-Nachzug · Fachliche Abnahme der BE-Sprengel-Tabelle** (David, §7) — bis dahin UI unverändert.
  - [ ] **K-15-Nachzug · UI-Verdrahtung BE-Sprengel im Zuständigkeits-Rechner mit Pflicht-Quellenangabe AGI BE** (eigener Schritt nach Abnahme).
  - [ ] **K-16-Nachzug · CC-BY-Namensnennung data.bs.ch in der UI** (Entscheid David) — die 114 maschinell gekennzeichneten Kanten und die BS-Materialien stammen aus einer CC-BY-4.0-Quelle; wo/wie die Namensnennung im UI erscheint, ist offen.
  - [ ] **K-16-Nachzug · Fachliche Abnahme der 114 maschinellen Kanten** (David, §7) — Erlass↔Vorstoss-Zuordnung ohne amtlichen Schlüssel (heuristisch, `quelle: maschinell`), Abnahme steht aus.

  - [ ] **PDF-Pfad liest Ziffern-Tarife falsch** *(19B-Nachtrag 13.8.)* — SG-3849-Wurzel: generisches «Art. N»-Muster greift auch in Querverweisen; Regel «Nr. XX.YY am Zeilenanfang» nötig. §1-A.
  - [ ] **Fassungs-Drift PDF-erfasster Snapshots unbemerkt** *(§17-Wurzel-Fix)* — `fassungsToken` ändert sich nicht bei neuer Portal-Fassung (SG-2808 hängt an 2808/2012, amtlich gilt 3863). Nötig: Tor `current_version.id` ↔ Snapshot. §1-A.
  - [ ] **Kern-Kategorie als Registerfeld statt Titel-Muster** *(§17-Wurzel-Fix, Gegenprüfung 31.8.2026 Befunde 1+2)* — heute entscheidet die zufällige Wortzusammensetzung («Handänderungs**steuergesetz**» trifft, «Gesetz über die Handänderungssteuer» nicht; 15 Erlasse tragen die Sache nur im Kürzel, Bestandsmuster lesen nur den Titel). Deklariertes Feld in der Pipeline-Quelle, Muster-Raten zurückbauen; dabei die David-Frage «Handänderungs-/Grundbuchabgaben = Kernklasse?» mitentscheiden lassen.
        *Teil-eingelöst 31.8.2026 (N0b): das deklarierte Feld existiert jetzt —… — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 8.9.2026 (Landung).*
  - [ ] **SG-Langform-Erstzitate heben Recall der Zitat-Brücke** *(GP-N0-Hinweis 31.8.2026)* — 802/7790 SG-Nummern-Zitate mit vorhandenem Snapshot bleiben unaufgelöst (10,3 %; Muster: Langform-Erstzitierung «…gesetz, GOG; SG 154.100», BS-154.100 allein 396×) — Wurzel kanton-norm-resolver.ts (Altbestand); SG-Nummern-Fenster über die Langform ⇒ ~+800 Paare. Dazu: normkeys-kanton.json beim ERSTEN UI-Konsum in DATEN_BUDGET eintragen.
  - [ ] **Manifest-Sprache ehrlich + Dubletten** *(Befund Bau W2·13-KANTONE 31.8.2026)* — 37 fr/it-Erlasse als `sprache:'de'` deklariert (nur 2 korrekt ≠ de, §8); mehrere Erlasse doppelt im Manifest (FR-261.16-Notariatstarif, JU-Décret émoluments, TI-Legge tariffa giudiziaria, VS-Notariats-Règlement). Pipeline-Quelle fixen, nie die Projektion (§5).
  - [ ] **ZH-Programm: 13 Runden + Tranchen** *(Aufträge David 31.8.2026, Dauer-Baumandat)* — Phasenplan mit Abhängigkeiten statt Bestell-Reihenfolge: Tranchen A/B/C mit Prüf-Schleife · Tag-Leser-Familie (Gliederung/Tabellen/Fussnoten/Anhänge) · Semantik (Verweise/Definitionen/Abkürzungen/Sachgebiete) · Zeit (Inkrafttreten/Historie) · Ernte (Rechtsprechungs-Brücke/Mehrsprachigkeit/Suche); alles kanton-generisch. **Spec:** [FAHRPLAN-KANTONE.md](fahrplaene/FAHRPLAN-KANTONE.md) §5.
  - [~] **ZH-Tranche: Inventar + Kern-Erlasse** *(Auftrag David 31.8.2026, gestuft)* — Stufe 1 erledigt (Dossier [zh-quellinventar-2026-08-31.md](bibliothek/recherche/zh-quellinventar-2026-08-31.md); Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (6)). Stufe 2 (läuft): deklarative ZH-Quellenliste + Inventar/Drift-Anbindung (§7-d-Lücke) + `holeZhPdf`-Retry (§17) + 15–25 Kern-Erlasse + ZH-Systematik Ebene 1; Spec [FAHRPLAN-KANTONE.md](fahrplaene/FAHRPLAN-KANTONE.md) §4. Stufe 3 (Ausbau in Tranchen Richtung 944) erst nach sauberer Stichproben-Abnahme von Stufe 2.
  - [ ] **lexfind-API-Vertrag gebrochen** *(Inventar-Nebenfund 31.8.2026)* — `POST /api/fe/de/fulltext-search` weist das im Repo dokumentierte Schema (23.6.2026) mit HTTP 400 «Obsolete keys» ab; neues Schema im ZH-Dossier dokumentiert. Betrifft `scripts/normtext/lexfind-discovery.ts` (andere Kantone; ZH braucht lexfind nicht mehr). Nachziehen, bevor der nächste lexfind-Discovery-Lauf ansteht.

- [ ] **Kantonale Snapshots gegen die Quellen nachführen** *(`W2·13-KANTONE-DRIFT`, Befund 2.8.2026; Phase 2, Entscheid 14.9.2026)*
  <!-- @meta id: W2·13-KANTONE-DRIFT · status: ready · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-KANTONE.md -->
  Der Bundes-Durchgang vom 2.8.2026 meldete **~28 kantonale Snapshots mit echter Inhaltsdrift** —
  bewusst ausgeklammert und **unverifiziert**. **Reihenfolge gegen `K-7`** beachten.
  **Detail:** [FAHRPLAN-KANTONE.md](fahrplaene/FAHRPLAN-KANTONE.md) §3.

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

- [ ] **Datenhaltung-Bau: DB-Artefakt + Massen-Korpus + Edge-Suche** *(`W2·6-DATA`, Council 2.7.2026)*
  <!-- @meta id: W2·6-DATA · status: ready · blocker: null · dep: [W3·12] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-DATENHALTUNG.md -->
  Die Adapter befüllen ein libSQL/SQLite-Artefakt, `public/*.json` + Prerender werden Projektion
  (Tor `check:paritaet`). **Heiss/Kalt-Grenze bleibt DAVID-GATE.** Die `dep` auf `W3·12` hält
  Leitprinzip 4 fest, das früher das Feld `26x`/`slot` trug (Kette 20.7.2026: E3 → W3·12 → E5).
  **Detail:** [FAHRPLAN-DATENHALTUNG.md](fahrplaene/FAHRPLAN-DATENHALTUNG.md) §14.
  **Merkposten:** `register.json` steht bei 97 % des 780-KB-gzip-Deckels — wer es weiter belädt,
  reisst `check:perf-budget`; Lösung ist eine eigene Projektion, nie das Anheben der Schranke (§8).

- [ ] **FINMA-Materialien prioritär + Verzahnung** *(`W2·6b-MAT-FINMA`, §14-Intake 24.7.2026)*
  <!-- @meta id: W2·6b-MAT-FINMA · status: parked · blocker: zielbild-gesetzesleser · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md -->
  FINMA-Rundschreiben/Wegleitungen als nächste Quelle der Materialien-Pipeline (Verweis-/
  Register-Ebene, kein Volltext-Nachbau). Kontext: externer Termin (FINMA-Bereich soll vorzeigbar sein).
  **Detail:** [FAHRPLAN-MATERIALIEN-VERZAHNUNG.md](fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md) §10.

- [ ] **Entstehung am Artikel — Deep Research Gesetzgebungsprozess** *(`W2·6d-VERFAHREN-RECHERCHE`, §14-Intake 15.9.2026)*
  <!-- @meta id: W2·6d-VERFAHREN-RECHERCHE · status: ready · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md -->
  Verfahrensmodell «Wie entsteht ein Bundeserlass» aus amtlichen Quellen, je Schritt Norm · Akteur ·
  Dokument · Publikationsort · Datenspur; Vorlage = Entwurf 15.9.2026. Recherche, kein Bau; Bund
  zuerst; Gegenprüfung zweites Modell; Abnahme David `[D]` blockiert die Daten-Etappen nicht.
  **Detail:** [FAHRPLAN-MATERIALIEN-VERZAHNUNG.md](fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md) §12.3 Etappe 0.

- [ ] **Entstehung am Artikel — Nationalrats-Abstimmungen je Artikel + Vehikel der Vorlage** *(`W2·6d-PARLAMENT-ARTIKEL`, 15.9.2026)*
  <!-- @meta id: W2·6d-PARLAMENT-ARTIKEL · status: ready · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md -->
  Curia-Vista-`Vote` je Detailberatungs-Abstimmung strukturiert am Artikel (Chip «im Rat
  umstritten») + `BusinessType` im Verfahrens-Block. Grenzen: keine Personendaten, Auflagen der
  Parlamentsdienste am Block, Monatslauf; Risikopfad ⇒ Gegenprüfung.
  **Detail:** [FAHRPLAN-MATERIALIEN-VERZAHNUNG.md](fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md) §12.3 Etappe 2.

- [ ] **Entstehung am Artikel — Botschaftstext je Artikel (Erläuterung als §7-Zitat)** *(`W2·6d-BOTSCHAFT-TEXT`, 15.9.2026; Phase 3)*
  <!-- @meta id: W2·6d-BOTSCHAFT-TEXT · status: ready · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md -->
  Stufe A: XML ab 2022 + DOCX 2020/21 (kapitelscharf deterministisch, artikelscharf nur wo
  strukturell); B: PDF/A 1999–2019 auf dem PDF-Kern (K-7); C: Kommissionsberichte + Stellungnahmen
  BR. **Auflagen:** erst nach Synopse E5/E6 (#794); Erläuterung an die Fassung gebunden, die aus der Botschaft hervorging;
  Mantel über Eltern-Level; URLs nur aus `isExemplifiedBy`; nichts vor 1999; Gegenprüfung.
  **Detail:** [FAHRPLAN-MATERIALIEN-VERZAHNUNG.md](fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md) §12.3 Etappen 3–5.

- [ ] **Entstehung am Artikel — Bulletin-Voten Bundesrat/Kommission: Metadaten + Deep-Link** *(`W2·6d-BULLETIN-VOTEN`, 15.9.2026; Phase 3)*
  <!-- @meta id: W2·6d-BULLETIN-VOTEN · status: ready · blocker: null · dep: [W2·6d-PARLAMENT-ARTIKEL] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md -->
  Voten nach Funktion, Rat, Datum, Lesung mit Deep-Link ins Amtliche Bulletin und AB-Fundstelle «AB Jahr S/N Seite» (19.9.2026); Artikel-Zuordnung
  «maschinell» mit ausgewiesener Präzision; SR-Stimmenzahlen aus dem Text. **Kein Redetext, kein Name.**
  **Detail:** [FAHRPLAN-MATERIALIEN-VERZAHNUNG.md](fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md) §12.3 Etappe 6.

- [ ] **Entstehung am Artikel — Ursprung der Bestimmung (Bundesratsentwurf oder Parlament)** *(`W2·6d-URSPRUNG`, 19.9.2026; Phase 3)*
  <!-- @meta id: W2·6d-URSPRUNG · status: ready · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md -->
  «Nicht im BR-Entwurf, von Kommission SR/NR eingefügt» auch vor 2021 + Kante «Botschaft zu anderem
  Geschäft als Material». Weg zuerst messen; nicht deterministisch ⇒ nur über die Entstehungsnotiz.
  **Detail:** [FAHRPLAN-MATERIALIEN-VERZAHNUNG.md](fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md) §12.3 Etappe 8, §12.6.

- [ ] **Entstehung am Artikel — kuratierte Entstehungsnotiz mit Bulletin-Kurzzitat** *(`W2·6d-ENTSTEHUNGSNOTIZ`, 19.9.2026; Phase 3)*
  <!-- @meta id: W2·6d-ENTSTEHUNGSNOTIZ · status: ready · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md -->
  Von David verfasste/freigegebene Notiz je Artikel: nur Entstehungsfakten mit Fundstelle, Kurzzitate
  nur kuratiert, Namen von BR-Mitgliedern zulässig. Referenzfall Art. 90 Abs. 3/4 SVG; Abgrenzung vor Bau bestätigen.
  **Detail:** [FAHRPLAN-MATERIALIEN-VERZAHNUNG.md](fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md) §12.3 Etappe 9, §12.6.

- [ ] **Entstehung am Artikel — Vernehmlassungs-Dokumente als Verweise** *(`W2·6d-VERNEHMLASSUNG-DOKUMENTE`, 15.9.2026; Phase 3)*
  <!-- @meta id: W2·6d-VERNEHMLASSUNG-DOKUMENTE · status: ready · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md -->
  Vorentwurf, Erläuternder Bericht, Ergebnisbericht je Verfahren (für Verordnungen die einzige
  Entstehungsquelle). Grenzen: Weg zuerst erheben, nur Verweis-Klasse.
  **Detail:** [FAHRPLAN-MATERIALIEN-VERZAHNUNG.md](fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md) §12.3 Etappe 7.

- [ ] **Entstehung am Paragraph — Basel-Stadt (vor Zürich)** *(`R12a-ENTSTEHUNG-BS`, Vormessung
  lex-recherche 12.9.2026)*
  <!-- @meta id: R12a-ENTSTEHUNG-BS · status: blocked · blocker: david-bs-lizenz-schluessel · dep: [W2·6c-ENTSTEHUNG-SYNOPSE] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-KANTONE.md -->
  **Nicht jetzt baubar** (Vormessung 12.9.2026): BS hat keine Fassungskette je § — 0 kantonale
  Historie-Einträge, 2908 Fussnoten in 793 BS-Sidecars, davon nur 13 «GRB vom», 8 mit
  Ratschlagsnummer; der amtliche Schlüssel Erlass↔Geschäft (K-16) deckt 5/859 Erlasse, 8/122 Kanten.
  **Neuer Fund:** die LexWork-API der BS-Gesetzessammlung
  (`https://www.gesetzessammlung.bs.ch/api/texts_of_law/<SG>`, undokumentiert) liefert
  `old_versions[]` und je Fassung Volltext-XHTML unter `.../versions/<id>` — geprüft 12.9.2026 am
  Beispiel 132.100 (10 Fassungen); Lizenz des `versions`-Endpunkts nicht deklariert. Ziel, sobald
  freigegeben: BS-Fassungskette je § aus `old_versions`/`versions/<id>`, Verknüpfung mit den K-16-
  Kanten (amtlich nur 5 Erlasse, Rest `quelle: maschinell`), Synopse-BS analog E5 mit
  Profil-Normalisierung, Karte für BS-Keys. Grenzen: Stabilitäts-Sonde des undokumentierten
  Endpunkts vor Bau; Vorstufen R3/R7/R12 für BS neu (heute nur für ZH definiert).
  **Detail:** [FAHRPLAN-KANTONE.md](fahrplaene/FAHRPLAN-KANTONE.md) §5 R12a.
  **Grundlage:** `bibliothek/materialien/2026-09-12-k16-bs-vormessung.md` §3/§7/§9.

- [ ] **Watchlist & Änderungs-Signale** *(`W2·14-SIGNAL`, Ideen-Intake 20.7.2026; Phase 3)*
  <!-- @meta id: W2·14-SIGNAL · status: ready · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-FEDLEX-PORTFOLIO.md -->
  «Sag mir, wenn sich Norm Y ändert.» **Baut ausschliesslich auf vorhandenen Signalen**
  (Currency/Register/Wiedervorlage); Speicherung lokal, Werkzeuge bleiben zustandslos. Bau-Reihenfolge
  B1 → B2 → GER. **Detail:** [FAHRPLAN-FEDLEX-PORTFOLIO.md](fahrplaene/FAHRPLAN-FEDLEX-PORTFOLIO.md) §16.
  - [ ] **B1 · Statischer Änderungs-Feed** — RSS/Atom/JSON zur Build-Zeit aus `currency.json` + Verfallsregister; nur der VORWÄRTS-Fall (`naechsteFassungAb`).
  - [ ] **B2 · Client-Watchlist** — localStorage-Liste gemerkter Normen, gegen Build-Artefakte geprüft; Rückblick-Flag gegen `fassungsToken`/`sha`, nie `geprueftAm`.
  - [ ] **GER · Gerichts-Delta mit ehrlicher Latenz** — Build-Zeit-Delta je Gericht/Norm; eigenes Verdikt, Import-Kadenz sichtbar (§8).

- [ ] **Korpus-Pflege: fehlende und fehlerhafte amtliche Substanz** *(`QS-KORPUS`, Fusion 15.8.2026)*
  <!-- @meta id: QS-KORPUS · status: ready · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md -->
  Dach für die offenen Reparaturen an Normtext- und Rechtsprechungs-Korpus; je Zeile eine
  sortenreine Bau-Einheit. **Detail:** [FAHRPLAN-OFFENE-BEFUNDE.md](fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md) §1.
  - [x] **Erledigt (7.9.–12.9.2026):** `adapter-lexwork.ts:778` (#813, `af5e35ce9`) · geltende BMV (#823) · scope/decl-Sektionen 12 Staatsverträge (#838) · Entscheid-Datumsfehler · VZV Art. 3/4 · AMBV · Deckungs-Seite «was wir nicht haben» + Ingest-Wächter `ungedeckteTopLevelJson` (#807, vier vorbestehende Lücken geschlossen) — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtungen 7.9./12.9.2026 und 14.9.2026 (6).
  - [ ] **AVG-normKeys nachführen + Alias-Kollisionen** *(Gegenprüfung #911, 18.9.2026)* — 11 Snapshots (5 BGE 147 II 397 · 148 II 203 · 148 II 426 · 151 II 178 · 151 III 143; 6 BS BEZ.2023.59 · VD.2025.49 · ZB.2023.64 · ZB.2023.66 · ZB.2024.11 · AH.2023.9) tragen `AVG` erst nach dem Voll-Lauf `npm run entscheide` · Tor-Kandidat: neue Fedlex-Aliase gegen kantonale Kürzel prüfen (it-«LC» = Waadtländer LC, gesperrt in `ABK_AUSSCHLUSS`; im Korpus dazu «Least Concern», «RS/GE LC», «letter of credit»; «LSE» = Lohnstrukturerhebung latent); feiner als die Sperre wäre der B1-Riegel `fremdDefinierteKeys` (`bezuege-bauen.ts:339 ff.`, dritter Fall 149 I 343) · `GESETZ_CODE` (`zitat-extraktion.ts:271`) erlaubt Umlaut nur am Code-Ende ⇒ «Art. 7 EÖBV» im Fliesstext unauflösbar (24/549 Kürzel) · `check:normkeys`: IGNORE 'VO' unter Schwelle (19 < 20) = Streich-Kandidat.
  - [ ] **Bezüge-Kanten mit Phantom-Zitaten** *(Befund Split-Bau 30.8.2026, PR #582)* — 18 854 von
    75 365 Artikel↔Entscheid-Kanten nennen den Artikel im Entscheid-Snapshot gar nicht; Stichprobe
    `bge_148_V_265` trägt `«Art. 4 BGE»` in `zitierteNormen` (Extraktions-Artefakt). Wurzel im
    Bezüge-/Zitat-Generator suchen (Risikopfad, Gegenprüfung), nie in den Daten flicken.
    *Zuschnitt 1.9.2026:* zuerst den billigen **Filter** (Kante nur, wenn der Artikel im
    Entscheid-Snapshot wörtlich steht — §1 sofort erfüllt), den Generator-Neubau erst nach
    `W2·21-ZULIEFERER` (kommt der Graph von dort, entfällt er).
  - [x] **Erledigt:** Kernerlasse-Lücken Bund schliessen (PR #860, EMRK/EÖBV/AVG) · `public/normtext/confidence.json` veraltet (PR #848) — ✅ 14.9.2026. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 18.9.2026.
  - [ ] **Kernerlasse-Tranche 2** *(Hebel-Befund #864, 14.9.2026)* — Gaststaat-, Zoll-, Subventions-, Revisionsaufsichts-, Strafregister-, Post- und Medizinalberufegesetz als Fedlex-Snapshots. Wirkung doppelt: sie schliessen Abdeckungslücken **und** lösen die ~146 Kurztitel-Verweise ein, die heute Text bleiben, weil das Ziel keinen Snapshot hat (W2·20 «Offen (Phase 1)»). Der Wurzel-Fix ist der Snapshot, nie eine Wächter-Lockerung (§1). *Risikopfad ⇒ Gegenprüfung.*
  - [ ] **§17 · `scripts/fedlex-eli-aufloesen.ts:44-56` liefert falsche ELI** *(Prüfer #860, 14.9.2026)* — für 2 von 3 geprüften SR kommt ELI **und** Datum aus dem falschen Abstract: `LIMIT 200` kappt die Datumsliste (EMRK 1990 statt 2022), `bindings[0].cc` greift bei mehreren Abstracts den aufgehobenen Vorgänger (EÖBV → NAG 1891, AVG → AVG 1951); die SR-Sonde ist blind, weil die SR gleich bleibt. Repro: `npx vite-node scripts/fedlex-eli-aufloesen.ts -- 0.101 211.435.1 823.11`. Fix: `GROUP BY` je Abstract, kein `LIMIT`, Abstract-Wahl über die geltende Konsolidierung. Bestandspins unbetroffen (`check:fedlex-versionen` grün). *Risikopfad.*
  - [ ] **`--erlass=` filtert nur die Bund-Route** *(§17-Generator-Befund #860)* — HTM-, ZH- und PDF-Adapter laufen beim gezielten Neulauf mit; im Lauf vom 14.9.2026 hätte das VS-173.8-fr «RS» → «SR» geändert. Filter auf alle Routen ziehen.
  - [ ] **`check:pdf-quellen`: Kanton-Ratsche, 152 Erlasse ohne PDF** *(Messung #860)* — Bund scharf (231/231), Kanton läuft als Ratsche: ZH 111, JU 7, VD 7, TI 5 ohne PDF-Quelle. Phase-2-Posten.
  - [ ] **Golden-Token blind für Randtitel** *(Befund PR #668, 4.9.2026)* — `sha256Bloecke` (`scripts/normtext/sha-bloecke.ts`) hasht weder `titel` noch `absatz` (Gegenprüfung 4.9.2026: `sha-bloecke.ts:50`); eine reine Randtitel-Revision (BE 154.21 Art. 31) bewegt den Golden-Index nicht. Wurzel-Fix korpusweit (~60k Hashes) als eigener Schritt mit Gegenprüfung.
  - [ ] **Nebenfunde Nacht 5.9.2026** (7 Zeilen: Cache ohne Fassungsschlüssel, struktur-Filter, stumme Löschung, GL-Kanonik, Kanton-Drift, Fedlex-Trenner, standRechtsprechung) — Fahrplan §1.
  - [ ] **`public/normtext/historie/**` ausserhalb des Paritäts-Ingest** *(Kritik C9, FAHRPLAN-MATERIALIEN-VERZAHNUNG.md §11.0, unverändert offen)* — `check:paritaet` prüft den
    Historie-Shard nicht mit; bewusst nicht Teil von W2·6c (Historie-Generator/-Shard bleiben
    unangetastet), aber als Lücke im Paritäts-Netz weiterhin unbehoben.
  - [ ] **Zitat-Extraktion dreistufig trennen** — Erkennen (Tokenizer) · Auflösen (Resolver gegen Register) · Annotieren, mit Konfidenz je Treffer; Phantom-Kanten fallen dann im Resolver statt im Generator. Architektur-Muster `freelawproject/eyecite` (BSD-2), kein Code-Import (US-Stil). Nach dem Filter oben, Risikopfad. Quelle: Rules-as-Code-Sichtung 5.9.2026 §8.
  - [ ] **Testdaten für die Zitat-Extraktion aus `rcds/*` (Hugging Face)** — swiss_leading_decisions/swiss_doc2doc_ir als Fixture-Quelle (nie Produktquelle); Lizenz je Datensatzkarte (Snippet: CC-BY-4.0) vor Übernahme einzeln belegen. Quelle: Fremdnutzen-Suchrunde 2 (6.9.2026) §2 #5.
  - [ ] **LexWork-Standlesung kennt «in Vollzug seit» nicht** *(§17-Befund 6.9.2026)* — `inKraftSeit()` in `scripts/normtext/adapter-lexwork.ts` liest nur «in Kraft seit»/«en vigueur»; SG schreibt «Aktuelle Fassung in Vollzug seit: 01.07.2026», der Stand fällt auf `enactment` zurück (`register.json` führt SG-2808 mit stand 2012-03-01, amtlich V3863 seit 2026-07-01). Variante ergänzen + betroffene Kanton-Snapshots neu ziehen; Risikopfad.
  - [ ] **Tor gegen Import-Nebenwirkung `void main()`** *(§17-Befund 6.9.2026)* — CLI-Module (Muster `pdf-quellen-generieren.ts`, Falle bereits als Kommentar bekannt) starten beim blossen Import ihren Generator; Tor, das `void main()`-Module erkennt, die von anderen Modulen importiert werden. Rot-Beweis am Bestand.
  - [ ] **Bund-Korpus gegen legalize-ch abgleichen (nur Test/Bericht)** — `legalize-dev/legalize-ch` (5 139 SR-Erlasse DE aus Fedlex-AKN, Konsolidierungen als Git-Commits, Pipeline MIT, Daten gemeinfrei): SR-Bestand und Konsolidierungsdaten diffen; Abweichungen = Prüfauftrag, nie Quelle (§5). Fund Rules-as-Code-Sichtung 5.9.2026 §8.

  - [ ] **Einheit + Hochzahl zerrissen («125 cm 3» statt cm³)** *(Gegenprüfungs-Fund 4.9.2026, Phase-3-Durchgang Gemini, PR #658)* — `<sup>` an Masseinheiten wird als Leerzeichen + Ziffer gerendert; korpusweit 218 Treffer (m³ 143, m² 39, cm² 17, cm³ 13). Wurzel im Adapter (Sup-Behandlung), nie in den Daten. Risikopfad ⇒ Gegenprüfung.
  - [ ] **Führende Klammer/Guillemet in `<dt>`-Marken verstümmelt** *(Gegenprüfungs-Fund 4.9.2026, PR #658)* — `(i`, `(ii` (GFK Art. 24), `«5.4` (AVO Anh. 7), `(2) a` (UNO-Pakt I Art. 16): vorbestehend, vom Marken-Fix nicht erfasst. Wurzel `parseDefinitionsListe`; Risikopfad ⇒ Gegenprüfung.

- [ ] **`fza`/`cmr` NICHT-KANONISCH klären und kanonisch nachführen** *(`QS-CURRENCY-KANON`)*
  **Nachtrag 4.9.2026 (Gegenprüfung PR #658):** `check:fedlex-versionen` rot mit geänderter Menge — `dbg` überholt (Pin 2026-01-01, geltend 2026-09-02), `fmg` + `fdv` nicht-kanonisch; FMG-Snapshot nach Re-Pin regenerieren (liegt unter den 43 von #658).
  <!-- @meta id: QS-CURRENCY-KANON · status: ready · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-FEDLEX-PORTFOLIO.md -->
  Bestandsdefekt auf `main`; erst Ursache klären, dann re-pinnen + regenerieren + §7-Verifikation.
  **Nullprobe zuerst** — `fedlex-cache.sh:368` pinnt `fza` bereits auf html-9, der Befund vom 2.8.
  könnte dafür erledigt sein. **Detail:** [FAHRPLAN-FEDLEX-PORTFOLIO.md](fahrplaene/FAHRPLAN-FEDLEX-PORTFOLIO.md) §17.
  - [ ] **fedlex-frische.yml auf `--nur=bund` umstellen** — regeneriert heute sinnlos alle Kantone ohne LexWork-Token; Wurzel zweier Golden-Verluste.
  - [ ] **`gen:pdf-quellen --nur=kanton` nachfahren + `check:pdf-quellen` in den Tor-Block** — sonst driftet der amtliche PDF-Link still auf überholte Fassungen.
  - [ ] **`public/normtext/pdf-quellen.json` in eine Paritäts-Klasse aufnehmen** — kann heute byte-abweichen, ohne dass `check:paritaet` es sieht.
  - [ ] **`aufgehoben`-Flag ist golden-neutral (blinder Fleck)** — eine FALSCHE Aufhebungs-Markierung sieht kein Drift-Tor (§8).
  - [x] **Erledigt 12.9.2026:** Pin `erv` html-6 → kanonisch html-7 (#806, `56d33dae8`; Korrektur in der Gegenprüfung: **textgleich, Markup abweichend** — 224/224 Artikel-SHAs) · `QS-CURRENCY-KANON-FRISCHE` (#808, `datenhaltung:manifest` läuft unbedingt, Pin-Identitäts-Sonde) — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (6).
  - [ ] **Vorbestand:** `struktur-run.ts:61/68`, `check-vollstaendigkeit.ts:392`, `check-p-klassen.ts:106` lesen `/tmp`-Caches ohne Pin-Prüfung (Gegenprüfung #808 B4); im Frische-Arm durch den vorgelagerten `normtext`-Lauf gedeckt.

- [ ] **FR/IT-Drift-Wächter Stufe 2** *(`QS-FRIT-DRIFT`, Stufe 1 gebaut 15.8.2026)*
  <!-- @meta id: QS-FRIT-DRIFT · status: ready · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-FEDLEX-PORTFOLIO.md -->
  Erstlauf-Befund: OR, PatG und BewG weichen in fr/it real ab ⇒ **`eId` trägt nicht sprachübergreifend**.
  Dossier: [frit-drift-2026-08-15.md](bibliothek/register/frit-drift-2026-08-15.md).
  **Detail:** [FAHRPLAN-FEDLEX-PORTFOLIO.md](fahrplaene/FAHRPLAN-FEDLEX-PORTFOLIO.md) §18.1.
  - [ ] **WARTET AUF DAVID:** die 4 Fedlex-Fundstellen dem Fedlex-Betrieb melden? Empfehlung: ja — belegte Fehler in der amtlichen Publikation, Meldung kostet wenig.
  - [ ] Stufe 2: Abgleich über Artikelnummer statt eId; Vollausbau auf alle 227 Pins nach Laufzeit.

- [ ] **Normen-Monitor seit ≥5 Wochen rot — Wurzel-Fix** *(`QS-MONITOR-ROT`, Aktivierungs-Audit 14.8.2026)*
  <!-- @meta id: QS-MONITOR-ROT · status: ready · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md -->
  Rechtsstand-relevant: `normen-monitor.yml` 5/5 Läufe failure. Diagnose 14.8. — **das Rot ist ECHT**,
  der Monitor korrekt. **Detail:** [FAHRPLAN-OFFENE-BEFUNDE.md](fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md) §2.
  - [x] **Nachweislauf 18.9.2026 (35353185468): sechs echte Daten-Befunde behoben** — ✅ 18.9.2026: #908 (`790a32bf5`, rectifies-Parser Mehrfach-Fundstellen — VTS `oc/2025/691` war Parser-Lücke, kein Fedlex-Fehler, KEIN Ausnahme-Eintrag) · #910 (`f7aa5c12d`, EDÖB-Merkblatt, AVG-Botschaften `BOTSCHAFT-2002-172`/`-2000-99` + Revisionen-Sidecar, `BS-GR-26.0508`, VERN-2026-51/-52 + drei vom 8-Erlass-Tor ungesehene Deltas) · #911 (`59ac17fcd`, Fedlex-Abkürzungen EÖBV/AVG de/fr/it; it-«LC» als Waadtländer Homonym gesperrt) · #912 (`a1d099a79`, Re-Pin `uno_antifolter` html-1) · Wurzel-Fix Fedlex-Frische #907 (`745b276b7`, `projektionen:normtext`, Nachweislauf 35365372442 grün). Je Opus-Gegenprüfung, Register. Normen-Monitor-Lauf 35373415150 auf `a1d099a79`: Job «Rechtsstände (check:netz) · Live-Site-Smoke · Runtime-APIs» GRÜN, Issue #754 vom Lauf selbst geschlossen (#750 bleibt by design bis Turso-Reset 1.10. offen); Monatsjobs Vernehmlassungen + Basel-Stadt grün (BS öffnete Automatik-PR #913), Curia-Vista-Monatsjob ROT = dokumentierter Rest (Kaskaden-Lücke, eigene Zeile)
  - [ ] **rectifies-Tor Runde 2 — blockiert JEDEN Fedlex-Frische-PR** *(Gegenprüfung #909, 18.9.2026; Risikopfad)* — der Automatik-Lauf materialisiert erstmals `belegteOcs`/`rectifiesInfoProOc` (latent seit #827): Kanten 31 → 82, vier neu rot: KRK `oc/2026/314` (Staatsvertrags-Headline → ∅), OR `oc/2023/62` (Fussnotenzeichen «AS 2020 4005 ¹»), VZAE `oc/2026/170` (Ziel = cc-Abstract, Klassifikationslücke), **LRV `oc/2025/448` echte Abweichung** (Text AS 1992 124 vs. Ziel AS 1986 208 — amtlich einordnen, nie raten). Mit bauen (Auflagen #908): 0-Treffer-Fall eigene Meldung «keine Headline erkannt — zuerst Parser prüfen, NICHT Ausnahmeliste» (`check-revisionen-rectifies.ts:121`; genau diese Meldung legte am 18.9. die falsche Fedlex-Fehler-Spur) · nicht konsumierte Einträge in `rectifies-ausnahmen.json` melden (§6.7, Docstring verspricht es) · Phantom «(AS 2015 5699, 2022; …)» → `AS 2015 2022` (`rectifies-berichtigung.ts:118`) · Test-Eingabe `:423` erzeugbar machen · bei `sammelberichtigung` den treffenden Block statt der Vereinigungs-SR zeigen. Danach #909 bzw. den Folge-PR der Automatik landen (Verdikt-Kommentar am PR #909; bringt auch den VRV/VTS-Pflegetermin 1.10.2026 statt 1.1.2031).
  - [ ] **Automatik-PR «(Auto-Merge)» auf Risikopfad hängt immer am Merge-Schutz** *(18.9.2026, #909)* — Titel/Body der Fedlex-Frische-PRs ehrlich machen («wartet auf Gegenprüfung») und den Wächter solche PRs melden lassen; `check:revisionen-rectifies` läuft nur im Netz-Rhythmus — latente Schema-Erweiterungen werden erst im Automatik-PR rot.
  - [ ] **Re-Pin ohne Snapshot-Lauf lässt lokale Pin-Marker veralten** *(18.9.2026, nach #912; Meldung Leser-Session)* — ein Re-Pin, der nur `scripts/fedlex-cache.sh` ändert, macht auf JEDEM lokalen Checkout `check:p-klassen` + `check:vollstaendigkeit` rot («Pin-Marker weicht ab … Neuabruf nötig»; CI grün, weil dort /tmp leer). `.pin` stempelt nur `sicherstelleCaches` (`normtext-snapshot.ts`/`struktur-run.ts`); Cache löschen hilft nicht (Teilbestand-Fehler 230/231). Heil-Weg heute: `npm run normtext -- --nur=bund --erlass=<key> --datum=$(date +%F)`, Datums-Diff verwerfen (18.9.: 36/36 sha gleich). Wurzel-Fix: Fehlermeldung in `cache-pin-befund.ts` nennt diesen Befehl ODER ein Stempel-Kommando ohne Snapshot-Schreiben (`check:caches -- --stempeln`, gleiche mtime-Sonde); und die Re-Pin-Kaskade (#907) regeneriert den betroffenen Erlass immer mit.
  - [ ] **`check:vernehmlassungen-netz` sieht nur 8 Erlasse** *(Beleg Gegenprüfung #910)* — 2 von 5 Deltas (VERN-2026-39 FAV/FDV, VERN-2025-34 ZEMIS_V) und die neue AVG-Kante lagen ausserhalb; der Prüfer glich alle 831 Einträge + 1294 (SR, Konsultation, Status)-Paare in einer Session ab ⇒ Vollabgleich als Tor machbar.
  - [ ] **Curia-Vista-Monatsjob rot: Kaskade fehlt im Workflow** *(Lauf 35373415150, 18.9.2026)* — `normen-monitor.yml` Job `curia` fährt nach `materialien:curia` direkt `check:entstehung`; die Deckungs-Sicht (`public/materialien/deckungs-sicht.json`, 1 Abweichung zur Neuberechnung) wird nie regeneriert ⇒ Job scheitert VOR dem PR-Öffnen, der Monatsabgleich kommt nie an. Fix: `gen:entstehung-projektion` + `gen:entstehung-deckung` vor die Offline-Tore (gleiche Klasse wie #907; am besten über das Kaskaden-Skript der nächsten Zeile). Offen dazu: Automatik-PR #913 (BS-Monatslauf) braucht Gegenprüfung wie #909.
  - [ ] **Materialien-Kaskade als EIN Skript** *(analog #907)* — nach `materialien:botschaften`/`:vernehmlassungen`/`:bs`/`:snapshot`: `gen:entstehung-deckung`, Revisionen-Sidecar (`botschaftIndex()`-Cross-Link, `check:revisionen`), Zähler, Manifest zuletzt; heute undokumentiert (ein Bau-Agent erklärte das Folge-Rot zum «Vorbestand», Gegenmessung widerlegte es). Raw-Caches (`botschaften-raw`, `vernehmlassungen-raw`, `revisionen-raw`) sortiert + literal-normalisiert schreiben — je Lauf 100–220 Dateien Schein-Diff.
  - [ ] **Kleinfunde Materialien (Gegenprüfung #910):** Botschafts-`titelIt`/`titelFr` übernimmt Fedlex-`title`, der teils der ERLASS-Titel ist (BOTSCHAFT-2002-172 it) — Fallback `titleAlternative` + zählender Wächter · `stand` trägt drei Semantiken (BS Leitdokument, EDÖB Dokumentdatum, VERN Abfragedatum) ⇒ «Jüngster Eintrag: Materialien» (`gen-startseite-zaehler.ts:189`, `KorpusStand.tsx:44`) = Abfragedatum · `register-provenienz` zeigt bei BOTSCHAFT-2000-99 nur `proj/1999/5673`, nicht `5684` · EDÖB-Merkblatt ist gemeinsame Publikation EDÖB + privatim · `abgerufen` der Revisionen-Sidecars strukturell ungeschützt (`check-revisionen.ts:73`) · `sammelerlass-marker` VZAE/VEV ohne Link auf änderndes `oc/2026/474`.
  - [x] **Erledigt:** LIK 2026-05→07 · ESTV-MWST/AIG · Verfahrens-Gap — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 7.9.2026 (2).
  - [x] **§17-Wurzelfix 12.9.2026 (PR #803):** `check:materialien` Finding 7 war wanduhr-abhängig (2. Vorfall in 24 h, #789 + heute) — ✅ Wortlaut: ROADMAP-CHRONIK.md.
  - [ ] **§17-Wurzel-Fix:** soft-law-Detektor prüft nur den ToC-Token, nicht das Publikationsdatum — Detektor zusätzlich auf `stand`-Wechsel, Token nur über cipherDisplay-Anker.
  - [ ] Sieben Materialien-System-Befunde (a)–(h) je mit eigenem Wurzel-Fix — Liste im Fahrplan-§.
  - [ ] **Auflagen Gegenprüfung PR #623 (2.9.2026):** Stand-Wächter deckt 34/48 ESTV-Dokumente — 14 nur geloggt bzw. Fallback-Ziffer ohne Dok-Stand (`check-materialien-netz.ts:203-205`, `estv-mwst-stand-probe.ts:57`); Delay 300 ms vs. Doku «~1 req/s» angleichen. Restliste Befunde (b), (c), (e), (h) + `check:vernehmlassungen-netz` 8-Key-Blindheit.
  - [ ] **§17 Tor-Reihenfolge: Generat-Konsistenz vor Merge-Schutz** *(Befund Gegenprüfung PR #618, 2.9.2026)* — `check:verfall-ui`/`check:zaehler` laufen im Tor-Lauf erst NACH dem Merge-Schutz und damit bei fehlendem Verdikt nie; die Gegenprüfung sah eine Projektion, die kein Tor angefasst hatte. Billige Generat-Checks vor den Merge-Schutz ziehen oder Pfad-Hook auf `parameter-verfall.md` → `gen:verfall`.
  - [ ] **Pflegetermin 1.10.2026:** 14 «Künftige Fassung»-Einträge (OR/StGB/BankG/GwG u. a., SR-Tabellen) werden fällig — Register `parameter-verfall.md`, vorher nachführen (Hinweis Referenzzins-Agent 2.9.2026). **Achtung 18.9.2026:** VRV/VTS stehen im Register auf 1.1.2031, amtlich nächste Fassung 1.10.2026 — Korrektur steckt im blockierten #909.
  - [ ] **§17 Reparatur-Arm deckt Kanton-Drift nicht** *(Anlass 4.9.2026, #597/#600: BE 154.21 driftete 3 Läufe lang rot, Nachführung von Hand in PR #668)* — Reparatur-Arm um enge Kanton-Regeneration erweitern (`normtext -- --nur=kanton --kanton=XX` + `gen:pdf-quellen -- --kanton=XX`, neu in #668), Gegenprüfung bleibt Pflicht (Risikopfad, kein Auto-Merge).
  - [ ] **`gate` flaky parallel zu `check-drift.ts --netz`** *(Nullprobe 4.9.2026, PR #668)* — Netz-Lauf schreibt `daten/pdf-cache-zh/`, während der Offline-Teil liest (73× «Roh-PDF-Cache leer»); Wurzel-Fix: Netz-Modus in Temp-Verzeichnis schreiben und atomar tauschen, oder Tor-Lock.
  - [x] **Nacht 5.9.2026:** Finding 7 ohne Reparaturweg · Register-sha rotiert mit stand · Arm-Tor wanduhrabhängig — Fahrplan §2. **Alle drei gelöst 12.9.2026 (PR #803, #814):** Wortlaut ROADMAP-CHRONIK.md, Detail Fahrplan §2.

---

## Rechtsprechung  *(`feld: rechtsprechung`)*

- [ ] **Zulieferer-Entscheid: Nachweis-Index und Materialien anbinden statt nachbauen** *(`W2·21-ZULIEFERER`, Quellen-Sichtung David/Session 1.9.2026; Prüfschritt am Anfang von Phase 2)*
  <!-- @meta id: W2·21-ZULIEFERER · status: ready · blocker: null · dep: [] · feld: rechtsprechung · fahrplan: fahrplaene/FAHRPLAN-RECHTSPRECHUNG.md -->
  Prüfschritt, kein Bau: Kann LexMetrik den Rechtsprechungs-Nachweis (Fundstelle + amtlicher Link),
  den Botschaften-Artikel-Index und den Zitationsgraph von OpenCaseLaw (CC0) als Zulieferer nutzen —
  §7-konform (nur Wegweiser, nie Wahrheit), als tägliche Datei statt Live-Abfrage (Zustandslosigkeit),
  unter Ausschluss von Gerichten mit umgangenem Bot-Schutz? Ergebnis = Entscheidvorlage an David mit
  Lizenz-/§7-Matrix je Datenschicht; bestimmt den Zuschnitt von Block 4 (`W2·6`, `W2·14-SIGNAL`-GER,
  Materialien) und die Tiefe des Phantom-Kanten-Fixes in `QS-KORPUS`.
  **Detail:** [FAHRPLAN-RECHTSPRECHUNG.md](fahrplaene/FAHRPLAN-RECHTSPRECHUNG.md) §15 — Nachtrag
  18.9.2026 (Ziff. 6–8): `PLAN-OCL-ABBAU.md` abgleichen, Regulierungsbehörden, OCL-Scraper als Kantons-Vorlage.

- [ ] **Konsultieren-Klingen — Dach der Rechtsprechungs-Fläche** *(`W2·6`, `[OF]`, amtlich; Phase 3)*
  <!-- @meta id: W2·6 · status: ready · blocker: null · dep: [] · feld: rechtsprechung · fahrplan: fahrplaene/FAHRPLAN-RECHTSPRECHUNG.md -->
  Leitsatz David 16.8.2026 (dejure-Modell): **Nachweisdatenbank statt Volltextsammlung** —
  Fundstellen + Link auf die amtliche Quelle, Anbindung entscheidsuche.ch.
  **Detail:** [FAHRPLAN-RECHTSPRECHUNG.md](fahrplaene/FAHRPLAN-RECHTSPRECHUNG.md) §13.
  - [ ] **Gerichts-/Behörden-Adressregister** — Lese-/Index-Schicht über die bestehenden Bestände, **kein Datenduplikat** (§5); Quelle `bibliothek/behoerden/`.
  - [ ] **Entscheid-Filter über die API — Richter + allgemeine Facetten** — eine Bau-Fläche (Turso-Schema + `api/suche.ts` + Facetten-UI); Risikopfad ⇒ Gegenprüfung. [FAHRPLAN-ENTSCHEIDSUCHE-AUSBAU.md](fahrplaene/FAHRPLAN-ENTSCHEIDSUCHE-AUSBAU.md) §7.
  - [ ] **Zitationsnetz: Rückwärts-Zitate + Leitentscheid-Score** — deterministisch aus dem Zitat-Graph (§2 — kein Ranking-Modell); Merkposten LM-042 («ff.»-Sammelzitate) als Auflage. [FAHRPLAN-VERZAHNUNG-UI.md](fahrplaene/FAHRPLAN-VERZAHNUNG-UI.md) §10; erweitert 18.9.2026 (erwägungsgenaue Links, Zitat-Kontext, Normsuche DE/FR/IT, Urteils-Vorschau; Daten vor UI): [FAHRPLAN-RECHERCHE-KOMFORT.md](fahrplaene/FAHRPLAN-RECHERCHE-KOMFORT.md) §2.
  - [ ] **Rechtsprechungs-Übersicht: P0-Rest + Korpus-Breite** — SG-Regeste-Rest und die Übersichts-/Facetten-Breite; **erst nach `W2·6-RESOLVER`**.

- [ ] **Kantonaler Norm-Resolver → Kantonalnorm-Buckets (P0-Kern)** *(`W2·6-RESOLVER`)*
  <!-- @meta id: W2·6-RESOLVER · status: ready · blocker: null · dep: [] · feld: rechtsprechung · fahrplan: fahrplaene/FAHRPLAN-RECHTSPRECHUNG.md -->
  `norm-index` füllt heute nur Bundesnorm-Buckets; der Resolver ist Voraussetzung der kantonalen
  Stufe. Risikopfad-Dach der Rechtsprechungs-DATEN.
  **Detail:** [FAHRPLAN-RECHTSPRECHUNG.md](fahrplaene/FAHRPLAN-RECHTSPRECHUNG.md) §13.
  - [ ] **Richternamen gegen den Staatskalender auflösen** — abgekürzte Vornamen auflösen, Abgleich gegen den amtlichen Staatskalender; Extraktion/Personendaten = Risikopfad, nie raten. [FAHRPLAN-ENTSCHEIDSUCHE-AUSBAU.md](fahrplaene/FAHRPLAN-ENTSCHEIDSUCHE-AUSBAU.md) §8.

- [ ] **Sachgebiet-Facette an der Norm↔Entscheid-Kante** *(`W2·7-VZUI-SACHGEBIET`)*
  <!-- @meta id: W2·7-VZUI-SACHGEBIET · status: ready · blocker: null · dep: [] · feld: rechtsprechung · fahrplan: fahrplaene/FAHRPLAN-VERZAHNUNG-UI.md -->
  Deterministisch aus der amtlichen BGE-Bandnummer I–V (§2, keine Heuristik). Extraktion =
  Risikopfad ⇒ Gegenprüfung.
  **Detail:** [FAHRPLAN-VERZAHNUNG-UI.md](fahrplaene/FAHRPLAN-VERZAHNUNG-UI.md) §12.

- [ ] **Spruchkörper-Analytik** *(`W3·15-RICHTER`, bewusst freigabe-pflichtig)*
  <!-- @meta id: W3·15-RICHTER · status: blocked · blocker: richter-analytik-gate · dep: [] · feld: rechtsprechung · fahrplan: fahrplaene/FAHRPLAN-RECHTSPRECHUNG.md -->
  Ausschliesslich deskriptive Spruchkörper-Muster; **keine Erfolgsquoten, keine Prognose über
  Personen** (§2/§8).
  **Detail:** [FAHRPLAN-RECHTSPRECHUNG.md](fahrplaene/FAHRPLAN-RECHTSPRECHUNG.md) §14.

---

## Suche & Datenhaltung  *(`feld: suche`)*

- [ ] **Datenhaltung / VPS-Gate** *(`QS-DATA`)*
  <!-- @meta id: QS-DATA · status: blocked · blocker: vps-bestellung-david · dep: [] · feld: suche · fahrplan: fahrplaene/FAHRPLAN-DATENHALTUNG.md -->
  Server-Session (Bestellung nach Phase 2, Entscheid David 14.9.2026; NEUE Session): E3 Etappe 2 = Nachtlauf neue Entscheide (Status «entwurf», Morgenprotokoll, Stille ≠ Erfolg); Vercel bleibt für die Website, Prüfpunkt März 2027.
  Trägt nur das David-Gate: E3-Serving + E4-UI-Panels hängen an einer VPS-Bestellung (~15 Min
  David). Der Datenhaltungs-BAU selbst liegt in `W2·6-DATA`.
  Vorbereitung steht: Bestellanleitung aktualisiert (Dossier Nachtrag 8.9.), Setup-Plan §3 gilt; Runner NICHT auf diesem Host.
  **Detail:** [FAHRPLAN-DATENHALTUNG.md](fahrplaene/FAHRPLAN-DATENHALTUNG.md) §13.
  - [ ] **Binärdateien aus dem Repo auslagern** *(Nebenfund 18.9.2026)* — `.git` 561 MB ohne LFS; `docs/ux-audit-2026-07/**` (549 PNG) hat keinen maschinellen Leser, `abnahme/` (96 MB) und `bibliothek/`-Rohdaten (54 MB) hängen an Toren. Ziel: Storage Box bzw. LFS, Tore ziehen mit; Geschichte NICHT umschreiben (stoppt nur das Wachstum).

- [ ] **Ingest-Strecke ist in drei Tagen 3× langsamer geworden** *(`QS-DATA-INGEST-DRIFT`, gemessen 17.8.2026)*
  <!-- @meta id: QS-DATA-INGEST-DRIFT · status: ready · blocker: null · dep: [] · feld: suche · fahrplan: fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md -->
  `scripts/datenhaltung/suche.test.ts` reisst dadurch seinen Hook-Deckel. **Nicht der Deckel ist
  falsch, die Basis ist gewandert** (10.85 s → Mittel 31.4 s, Nullprobe-belegt auf `main`).
  **Wurzel-Fix, nicht Deckel-Anhebung (§17):** erst klären, WARUM die Strecke 3× teurer wurde.
  **Detail:** [FAHRPLAN-OFFENE-BEFUNDE.md](fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md) §3.

- **Idee (ohne `@meta`, über der Plan-Kapazität):** DE/FR/IT-Stemming in der Korpus-Suche (`multilingual-stemmer`, MIT, Wasm, zero deps) plus TERMDAT-Synonyme — nur mit Messung gegen `suche-eval-gold`, TERMDAT erst nach Lizenzklärung. Quelle: Fremdnutzen-Suchrunde 2 (6.9.2026) §2 #1/#6.

---

## Design & Oberfläche  *(`feld: design`)*

- [ ] **Design-Wärme & Atmosphäre** *(`W2·11-DESIGN`, Ultracode-Synthese 11.7., reine Token-Schicht)*
  <!-- @meta id: W2·11-DESIGN · status: parked · blocker: zielbild-gesetzesleser · dep: [] · feld: design · fahrplan: fahrplaene/FAHRPLAN-DESIGN-WAERME.md -->
  Farbklima/Wärme/Typografie nach §13; Normtext-Körper bleibt farbfrei, golden byte-gleich.
  **Detail:** [FAHRPLAN-DESIGN-WAERME.md](fahrplaene/FAHRPLAN-DESIGN-WAERME.md) §5.
  - [ ] **Design-Qualitäts-Pass Gesetzes-Bereich** *(Auftrag David 21.8.2026, nach H5)* — fünf parallele Review-Blickwinkel (Typografie · Farbe/Themes · Header/Chrome · Layout/Hierarchie · Legal-Tech-Benchmark), je hell+dunkel, Desktop+Handy; Geschmacksfragen als Vorlage an David.
  - [ ] **DESIGN-D6 · Dunkel-Paket: Elevation, Schatten, Scrims (EIN PR)** — Token-only, flip-reversibel, `check:farbwelt` + axe dunkel. §2 (D-6).
  - [ ] **DESIGN-D7 · Ein Lese-Register (`--reading-ink`, `--lese-fs`/`--lese-lh`)** — CPL-Messung, Regel in beide Domänen-Reglemente; golden neutral. §2 (D-7).
  - [ ] **DESIGN-D8a · slate auf Entscheid-Flächen (D-8.1)** — Entscheid-Leser-Chrome und Rubrik-Label auf die Rollen-Schicht ziehen.
  - [ ] **DESIGN-D8b · Mono-Diät — Pilot, dann Rest (D-8.2)** — ~50 Fundstellen; **Pilot zuerst**, nicht flip-reversibel, **nach D8a**.
  - [ ] **DESIGN-D8c · Motiv-Katalog (D-8.3)** — `scale-rule`-Motiv an 2–3 Sektions-Orten; **nach D8b**.

- [ ] **Design-Konsistenz: gleiche Dinge gleich darstellen** *(`W2·19-DESIGN-KONSISTENZ`, Auftrag David 31.8.2026)*
  <!-- @meta id: W2·19-DESIGN-KONSISTENZ · status: ready · blocker: null · dep: [] · feld: design · fahrplan: fahrplaene/FAHRPLAN-DESIGN-KONSISTENZ.md -->
  Dieselbe Inhaltsklasse site-weit im selben Muster (Split-View vs. Vollansicht, Leser-Köpfe,
  Chips, Leerzustände …); Massstab ist das Reglement, Vereinheitlichung über geteilte Bausteine
  (§5/§10), Normtext-Körper farbfrei/golden. Methode: Finder-Wellen → umsetzen → **run till dry**
  (Mandat David 31.8.2026, Befunde direkt umsetzen).
  **Detail:** [FAHRPLAN-DESIGN-KONSISTENZ.md](fahrplaene/FAHRPLAN-DESIGN-KONSISTENZ.md) §1.
  - [ ] **Kontrast unter 4,5:1 an zwei Tokens — blockiert Dependabot #918** *(19.9.2026)* — das axe-Update der Gruppe `browser-tests` meldet echte Verstösse: `.lc-termin-ring` 4,45:1 und `.text-auf-gold` 3,46:1 (WCAG AA verlangt 4,5:1 für Normaltext). Tokens in `src/index.css` auf ≥ 4,5 heben (Reglement §F0; Farbwahl: David darf bestimmen, sonst minimal abdunkeln), dann #918 einreihen. Kommentar mit den Messwerten steht am PR.

- [x] **Design-Identität: eigene Farb- und Schrift-Handschrift** *(`W2·24-DESIGN-IDENTITAET`, David 5.9.2026)*
  <!-- @meta id: W2·24-DESIGN-IDENTITAET · status: done · blocker: null · dep: [] · feld: design · fahrplan: fahrplaene/FAHRPLAN-DESIGN-IDENTITAET.md -->
  ✅ **erledigt 7.9.2026 (PR #739, e2ac7def9)** — Handschrift «Sammlung»: R1–R13 samt Nachzügen, Gesamtprüfung
  (Ästhetik + Funktions-Inventar 90 OK / 0 verloren), Reglement §F0. Protokolle
  `abnahme/design-identitaet/`; Zielbeschreibung: ROADMAP-CHRONIK.md, Umschichtung 7.9.2026.
  **Nachwünsche 7.9. (Tag):** 16 weitere PRs #744–#761 (D34–D44, D35-F1…F4, L6, R13B, R14, R14b) —
  Tabelle Thema/PR/SHA/Protokoll in STRUKTUR.md, Abschnitt «Nachwünsche 7.9.» (zuletzt #761 ae32c5c4e).
  **Detail:** [FAHRPLAN-DESIGN-IDENTITAET.md](fahrplaene/FAHRPLAN-DESIGN-IDENTITAET.md) §1 — Stand je Runde dort in §6, Folgeschritte in §8.
  - [ ] **⚖ öffnet Entscheide im zweiten Pane** *(`W2·24-C`, Variante C zu D33)* — heute Variante A (überlagerndes Blatt, Δ=0); C = echtes zweites Pane (Split-Regel M3). **Zuerst prüfen, ob D35-F2 (#758, Erlass-Blatt) das schon abdeckt** — sonst doppelter Weg zum selben Inhalt. Fahrplan §8.
  - [x] **Bezüge-Zeile: Kopfzähler gefiltert/ungefiltert** — ✅ entschieden und gebaut 11.9.2026. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (6).
  - [ ] **Nachzüge aus R13 und Gesamtprüfung** — R13-11 Reiter-Adress-Kern · Geschäftsnummer-Kurzform statt R8-Allowlist · `StatusBadge` «maschinell» (§8) · `qsui-hierarchie` Vorlagen-Schranke 1.2533. Fahrplan §8.
  - [x] **Erledigt:** L6 PaneKopf-Name · Reiterstreifen/ZGB-Reiter (bleiben) · Orchestrator-Entscheide 7.9. bestätigt · D45/«Daneben öffnen»/Bezüge-Zähler/OR-Leser-Knöpfe (umgebucht nach `W2·26-FUNKTIONSZEILE`) — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 18.9.2026.
  - [x] **Orchestrator-Entscheide vom Tag 7.9. — David 7.9.2026 «alles bestätigt»:** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 8.9.2026 (Landung)).
  - [ ] **Rest-CLS 0.0003 im Leser-Kopf** — `LeserKopf.tsx:289` (`data-v3-kopf-griffe`, Klassenwechsel `gap`/`pl`); klein, aber der einzige verbliebene Sprung in `leser-r1-r2`.
  - [ ] **«OR» dreimal untereinander @1440** *(L6-Nebenbefund)* — Reiter · Pane-Titel · Leser-Kennung; der V3-Leser sollte sein Kürzel im Pane abgeben.
  - [ ] **Leser-Mount auf langsamem Netz messen** — Nachlauf zu #743/L2 (grosser Erlass: Ankersprung erst nach der zweiten Ladung, Anker-Oberkante 433 px statt 193 px).
  - [x] **Budget-Entscheid Entry 99,5 %** (59.7 / 60.0 KB) — ✅ David 19.9.2026 «Kopfbereich budget heben»: Entry-Budget 60 → 70 KB (`scripts/check-perf-budget.ts`); der react-dom-Rückfall bleibt über die Zeichenketten-Prüfung gefangen.
  - [ ] **Jules-Kandidaten** (grüne Spur, nach Landung W2·24): toter CSS-Rückbau `[data-lr-spiegel]`/`.lr-notiz*`/alte Druckregeln in `index.css` · Typ-Härtungen `lib/tabs.ts`/`tabGruppen.ts` · Allowlist-Pflege `e2e/kein-abschnitt.allow.json`. Datei-Splits erledigt (ArtikelLeser R6F; `Reiterleiste.tsx` 7.9. gemessen 650 Z. — **überholt: seit #843–#845 wieder 1 237 Z.**, s. Jules-Bilanz unten). *(Der proaktive Jules-Kanal «Suggestions» ist seit 14.9.2026 abgeschaltet — diese Kandidaten laufen unverändert als auftragsgebundene Tickets weiter; Entscheid D8: `fahrplaene/FAHRPLAN-FREMDAGENTEN.md` §6.)*

- [ ] **UI-Befundliste extern (210 Befunde, Cowork 29.7.2026)** *(`W2·17-UI-BEFUNDE`)*
  <!-- @meta id: W2·17-UI-BEFUNDE · status: ready · blocker: null · dep: [] · feld: design · fahrplan: fahrplaene/FAHRPLAN-UI-BEFUNDE.md -->
  Externe Sichtprüfung, geschnitten nach Bauteil; alles reine Darstellungsschicht, Blocker zuerst.
  **Detail:** [FAHRPLAN-UI-BEFUNDE.md](fahrplaene/FAHRPLAN-UI-BEFUNDE.md) §24.
  - [x] **Erledigt:** B6-N1 · B6-N2 · B7-N1 — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 7.9.2026 (2).
  - [ ] **B8 · Menüinhalt, Zustandsanzeige, Scrollbereiche (K-03 + K-07)** — 10 Befunde (Blocker 1 · Hoch 3). §9. · **Blocker LM-061 vorgemessen 30.8.2026, wartet auf David:** News-Reihe verbirgt 2'588 px ohne Affordanz — der Bau würde den Entscheid D11 («angeschnittene Karte IST die Affordanz») revidieren. Messung + Bauform-Vorschlag im Fahrplan.
  - [x] **Erledigt:** B9 (12/12) · B10 (7/7) — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 18.9.2026.
  - [ ] **B11 · Karten (K-04)** — 12/13, Rest LM-032 zurückgestellt. §12. · **B12 · Eingabe-/Auswahlfelder (K-08a)** — 9/11, Reste LM-066/LM-075 zurückgestellt (dokumentierte Entscheide). §13. *(Stand 13.9.2026)*
  - [ ] **B13 · Zahlen-, Datums-, Zählformate (K-11)** — 8/12, Reste LM-109/110/114/117 zurückgestellt. §14. · **B14 · Brotkrume/Kopfzeilen (K-19a)** — 4/8, Reste LM-183/184/197/198 zurückgestellt. §15. *(Stand 13.9.2026)*
  - [x] **Erledigt:** B15 (9/9) · B16 (8/8) — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 18.9.2026.
  - [ ] **B17 · Schaltflächen (K-09a)** — 7/8, Rest LM-087 an Gate-Verschärfung gebunden. §18. · **B18 · Listen/Suche/Relevanz (K-19b)** — 8/8 ✅. §19. · **B19 · Felder Detail (K-08b)** — 6/7, Rest LM-083 zurückgestellt. §20. *(Stand 13.9.2026)*

- [ ] **Davids Alltags-Fehlerfunde** *(`W2·18-FEHLERBUCH`, stehender Sammel-Schritt, Entscheid David 8.8.2026)*
  <!-- @meta id: W2·18-FEHLERBUCH · status: ready · blocker: null · dep: [] · feld: design · fahrplan: fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md -->
  David sammelt Fehler aus der täglichen Nutzung formlos; Fix-Batch-Sessions arbeiten mehrere
  Positionen sortenrein ab. **Risikopfad-Funde gehören NICHT hierher**, sondern in den passenden
  Risiko-Dach-Schritt. Der Schritt bleibt stehen (nie `done`).
  **Detail:** [FAHRPLAN-OFFENE-BEFUNDE.md](fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md) §4 — dort die
  vollständige, wörtlich übernommene Befundliste (33 offene Positionen mit ihren Belegen);
  Such-/Navigations-Posten zusätzlich in [FAHRPLAN-UI-NAVIGATION.md](fahrplaene/FAHRPLAN-UI-NAVIGATION.md) §7.
  - [ ] **OR-Leser-e2e-Timeouts app-weit härten · Shard-Laufzeit-Deckel** *(CI 5.9.2026)* — Fahrplan §4.
  - [ ] **Werkzeug-Falle Worktree-Preview: Fonts 403** *(Bauer #892)* — Vite `server.fs.allow` kennt das symlinkte `node_modules` nicht; Wurzel-Fix `fs.allow` auf `fs.realpathSync('node_modules')` in `vite.config.ts`.
  - [x] **Gliederungs-Pfeil klappt teils erst beim zweiten Klick** *(David 15.9.2026)* — ✅ 15.9.2026, PR #894 (`fb0ab0249`): Ast bleibt nach Sprung offen (`sprungAst.ts`), Klickziel 24 px, Marke; Rest `W2·5m-LESER-V3`. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 15.9.2026 (4).
  - [ ] **rectifies-Wächter blind für Fedlex-Berichtigungen ohne HTML** *(Gegenprüfung #834, 12.9.2026)* — 7 von 25 geprüften `rectifies`-Kanten sind nicht abrufbar, weil Fedlex die Berichtigung nur als doc/pdf-a führt, nicht als HTML; lesbar via `textutil -convert txt` (macOS) bzw. PyMuPDF. Tor um die doc-Manifestation erweitern, damit die Klasse «nicht abrufbar» auf 0 sinkt.
  - [ ] **Bund-Pfad löst «Art. 9 BMV» auf die aufgehobene Fassung auf** *(Gegenprüfung #833, 12.9.2026)* — `src/lib/fedlex/tabelle.ts` löst das Kürzel weiterhin auf die per 1.3.2026 aufgehobene Fassung `cc/2009/423` auf, obwohl `aufhebungen.ts` die Nachfolge kennt. Die in #823 gebaute Fassungs-Reihe (`normKeyFuerAbk` mit Datum) auch im Verweis-Resolver nutzen bzw. auf die geltende Fassung mit Datumskontext auflösen.
  - [x] **Plan-Buchungs-Commit wirft wartende Auto-Merge-PRs auf BEHIND** *(13.9.2026, #843)* — ✅ 19.9.2026, Merge-Queue (`strict` AUS). Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 19.9.2026.
  - [ ] **Flacker-Fall `leser-v3-blatt` (c) ⌘K im Split** *(CI #844, 13.9.2026; isoliert 6/6 grün auf Branch und main)* — last-/parallelbedingt, deckt sich mit «⌘K-Vorlauf im Split» (CI #711); Fahrplan §4.
  - [ ] **Meta-Routen OHNE Reiter bauen** — Entscheid David 19.9.2026: «keine reiter für meta seite». /ueber, /methodik, /einstellungen, /kontakt öffnen keinen Reiter mehr; das kehrt den Orchestrator-Entscheid aus R14b (`istReiterPfad` gestrichen, jede Route Reiterinhalt) für diese vier Routen um. Bau: Ausnahme-Liste an EINER Stelle (§5), e2e-Wächter mit Rot-Beweis (§6.7); FAHRPLAN-DESIGN-IDENTITAET §7 datiert nachführen.
  - [ ] **Reiterleisten-Abgleich + Merkliste bauen** *(David 18.9.2026; Merkliste: «ja», David 19.9.2026)* — Lücken zum Vorbild einzeln prüfen; die Merkliste wird gebaut (die Merkliste hebt den Favoriten-Verzicht vom 5.6.2026 auf — der neuere Entscheid David 19.9.2026 gilt; vor dem Bau gegen Fedlex messen, Mehrwert-Satz Pflicht). [FAHRPLAN-RECHERCHE-KOMFORT.md](fahrplaene/FAHRPLAN-RECHERCHE-KOMFORT.md) §3.
  - [x] **Reiterleiste-Wellen 1–3** — ✅ 13.9.2026, PR #842/#843/#844 (+ Nachzug R8-Sweep mobil); Specs Fahrplan §4.R/§4.R2/§4.R3. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (6).
  - [ ] **Zurückgeholt aus der Chronik** *(Umschichtung 15.9.2026 (Entstehung); Nebenfund #896: offene Posten im Archiv sind für `plan:next` unsichtbar)* — Konflations-Wächter breiter (D2 #816) · Prerender-Shell nennt aufgehobene Erlasse «geltend» (#823) · Tabellen-`<dt>`-Marken «–»/[tab] als Aufzählung (#836; ZPO art_250, StG art_5 f., BV art_197) · 216 Struktur-Sidecars ohne `stand`/`fassungsToken` (#836) · Test-Budget `suche.test.ts` 95 s bei 3 s Luft — Wortlaut dort. BMV-Zitat (#823) deckt die Zeile «Art. 9 BMV» oben; Werkzeug-Fallen Norm-PDF/Scratchpad ✅ #895.

- [ ] **Oberflächen-Qualität app-weit** *(`QS-UI`, reines UI/Design §13, kontinuierlich)*
  <!-- @meta id: QS-UI · status: ready · blocker: null · dep: [] · feld: design · fahrplan: fahrplaene/FAHRPLAN-UI-QUALITAET.md -->
  Kontinuierlicher Oberflächen-Pass (Fundament → Hierarchie → Politur), kein Einzel-Redesign.
  **Detail:** [FAHRPLAN-UI-QUALITAET.md](fahrplaene/FAHRPLAN-UI-QUALITAET.md) §8.
  - [x] **Erledigt:** Marken-Präfix im Leser · pfadgebundene Wächter — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 7.9.2026 (2).
  - [ ] Teilpass (e) Rest: Farbwelt-Baseline enger, axe von Stichprobe auf Flächendeckung; Restliste §2.3 Ziff. 6.
  - [ ] **Nebenfunde Nacht 5.9.2026** (Baum-Namen Rest + David-Frage, UI-String-Linter, Checkbox-Grösse, /einstellungen-Meta, Design R8) — [FAHRPLAN-UI-QUALITAET.md](fahrplaene/FAHRPLAN-UI-QUALITAET.md) §2.5.

- [ ] **Aufräum-Item — zwei Restpunkte** *(`W2·9`)*
  <!-- @meta id: W2·9 · status: ready · blocker: null · dep: [] · feld: design · fahrplan: fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md -->
  (a) A3 Kachel-Höhen (zur David-Abnahme geflaggt); (b) globaler Schalter «aufgehobene Normen
  ausblenden» nie gebaut. Abhaken bleibt David-Entscheid.
  **Detail:** [FAHRPLAN-ARCHIV-RESTPUNKTE.md](fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md) §20.

- [ ] **Bedienungsanleitung / Onboarding** *(`W2·16-ANLEITUNG`, §14-Intake 20.7.2026, bewusst spät)*
  <!-- @meta id: W2·16-ANLEITUNG · status: ready · blocker: null · dep: [W2·16-INVENTAR] · feld: design · fahrplan: fahrplaene/FAHRPLAN-UI-QUALITAET.md -->
  Die Anleitung folgt dem Inventar (`dep`).
  **Detail:** [FAHRPLAN-UI-QUALITAET.md](fahrplaene/FAHRPLAN-UI-QUALITAET.md) §10.

---

## Werkzeuge — Rechner & Vorlagen  *(`feld: werkzeuge`)*

- [ ] **Prozesskosten-Cockpit Restbau** *(`W1·4`, Hauptmoat, ENTPARKT 3.8.2026 David)*
  <!-- @meta id: W1·4 · status: parked · blocker: zielbild-gesetzesleser · dep: [] · feld: werkzeuge · fahrplan: fahrplaene/FAHRPLAN-PROZESSKOSTEN-COCKPIT.md -->
  Ziel: Tarif-Modifikatoren an amtlichen Tarifen recherchieren (Risikopfad ⇒ Gegenprüfung), damit
  I2 bauen, dann Festsetzung/Dispositiv. Die Tarif-Tranche ist eine Datensäule nach Leitprinzip 4.
  **Detail:** [FAHRPLAN-PROZESSKOSTEN-COCKPIT.md](fahrplaene/FAHRPLAN-PROZESSKOSTEN-COCKPIT.md) §1.

- [ ] **Frist × Kosten verzahnen** *(`W1·5-PRAXIS`, Ideen-Intake 20.7.2026, UI-Orchestrierung)*
  <!-- @meta id: W1·5-PRAXIS · status: parked · blocker: zielbild-gesetzesleser · dep: [] · feld: werkzeuge · fahrplan: fahrplaene/FAHRPLAN-PROZESSKOSTEN-COCKPIT.md -->
  Die heute isoliert nebeneinander stehenden Rechner zu **einem Praxis-Weg** verketten
  (Frist → Kosten → Vorlage), reine UI-Orchestrierung ohne neue Rechtsregel (§3).
  **Detail:** [FAHRPLAN-PROZESSKOSTEN-COCKPIT.md](fahrplaene/FAHRPLAN-PROZESSKOSTEN-COCKPIT.md) §1.

- [ ] **Schriften-Baukasten** *(`W2·8`, VORLAGEN)*
  <!-- @meta id: W2·8 · status: parked · blocker: zielbild-gesetzesleser · dep: [] · feld: werkzeuge · fahrplan: fahrplaene/FAHRPLAN-VORLAGEN-AUSBAU.md -->
  Berufung/BGG-Beschwerde/Sistierung/Beweisverzeichnis über `vorlagen/engine.ts`; Zulässigkeit nur
  Hinweis, Status «entwurf».
  **Detail:** [FAHRPLAN-VORLAGEN-AUSBAU.md](fahrplaene/FAHRPLAN-VORLAGEN-AUSBAU.md) §1.
  - [ ] **Zitat-Export & Fussnoten-Ausgabe** — Ein-Klick-Zitat in korrekter amtlicher Form (`BGE 148 III 1 E. 2.3`); Formvorschriften bestimmen die angebotenen Exportformate (§8).
  - [ ] **Zitierstil amtlich: GTR Anhang 3 (BK, Stand 5.6.2026) + BGer-Zitierreglement**, Export RIS/BibTeX/COinS; Eigenbau statt `citeproc` (CPAL/AGPL), CSL «juristische-zitierweise-schweizer» nur als Abgleich. Quelle: Fremdquellen-Sichtung 2.9.2026 §1 #13.
  - [ ] **Zotero-Translator fedlex.admin.ch + bger.ch (Eigenbau, klein)** — im Repo `zotero/translators` existiert keiner; PR #2752 (fedlex/lexfind) seit 11/2021 offen und gescheitert (US-Feldschema, lexfind JS-Seite). Reichweite bei Juristen; MVP-Schätzung fedlex 1–3 Tage, bger 3–5 Tage (unbelegt). Quelle: Fremdnutzen-Suchrunde 2 (6.9.2026) §3 B.

- [ ] **Funktions-Inventar (Vorstufe der Bedienungsanleitung)** *(`W2·16-INVENTAR`, §14-Intake 20.7.2026)*
  <!-- @meta id: W2·16-INVENTAR · status: parked · blocker: zielbild-gesetzesleser · dep: [] · feld: werkzeuge · fahrplan: fahrplaene/FAHRPLAN-UI-QUALITAET.md -->
  Ehrliche Aufnahme dessen, was LexMetrik heute kann — Quelle `startseiteConfig.ts` (§5),
  Status-Modell ungeschönt (§8).
  **Detail:** [FAHRPLAN-UI-QUALITAET.md](fahrplaene/FAHRPLAN-UI-QUALITAET.md) §9.

- [ ] **Welle-3-Ausbau: Rechner · Fedlex · Vorlagen · UI** *(`W3-AUSBAU`, Dach der Fusion 15.8.2026)*
  <!-- @meta id: W3-AUSBAU · status: parked · blocker: zielbild-gesetzesleser · dep: [] · feld: werkzeuge -->
  Vier Horizont-Stränge unter einem Dach, opportunistische Reihenfolge; **je Zeile eine sortenreine
  Bau-Einheit** (Flächen nie in EINER Session mischen).
  - [ ] **Neue Rechner-Klingen** — Zustellfiktions-Engine · Gesellschaftsrechts-Schwellen (OR 727/671/653s) · IGE-Gebühren · Geltungsstand-Prüfer · Kantonale Gerichtsferien-Datenschicht. **Erster Arbeitsschritt:** Restpunkte-Extraktion aus `archiv/FAHRPLAN-PRODUKTAUSBAU-BURGGRABEN.md` §P3 in einen aktiven Fahrplan (deklarierte Archiv-Ausnahme).
  - [ ] **Gesetzgebungs-/Rechtsetzungs-Tracking** — Übersicht «was kommt»: Parlamentsgeschäfte, künftige-Fassungen-Drift, laufende Vernehmlassungen, Laufend-Badge im Reader-Kopf. `fahrplaene/FAHRPLAN-FEDLEX-PORTFOLIO.md §Paket 3`.
  - [ ] **Vorlagen-Breite** — Tiefe vor Stückzahl: GmbH qualifizierte Gründung (777c II) · Musterklagen · Basistypen (Kauf/Schenkung/Pacht/Darlehen/Bürgschaft). [FAHRPLAN-ARCHIV-RESTPUNKTE.md](fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md) §10.
  - [ ] **Gemeinde-Validierungsliste (BFS eCH-0071)** — Build-Time-Snapshot mit gepinntem Stichtag; prüft Ortseingaben als **Hinweis**, nie als Blockade (§8).
  - [ ] **QR-Zahlteil (`swissqrbill`, MIT)** — gebunden an die Existenz einer Zahlungs-Vorlage; browser-seitig, deterministisch; §15-Bewertung vor Aufnahme.
  - [ ] **PDF/A-2b-Export vorbereiten** *(Wiedervorlage 1.1.2027)* — BEKJ tritt 1.7.2027 in Kraft, `jspdf` erreicht PDF/A-2b nicht → Export-Schicht-Umbau mit Vorlauf. *Nachtrag 6.9.2026: BEKJ-Pflicht für berufsmässige Akteure spätestens Mitte 2032, Plattform frühestens 1.7.2028; justitia.swiss publiziert bisher keine PDF/A-Version, eCH-Nummer oder Metadaten-Vorgabe — nicht an eine Formatvorgabe binden. Quelle: Fremdnutzen-Suchrunde 2 (6.9.2026) §3 A.*
  - [ ] **Multi-Pane / Split-View** *(Fundament-Umbau, eigener Worktree §12; Auftrag David 29.6.2026)* — Restposten B3 Scroll-Positions-Wiederherstellung + Tastatur-Pane-Wechsel · Bündel S · 3 a11y-Restpunkte. [FAHRPLAN-SPLIT-VIEW.md](fahrplaene/FAHRPLAN-SPLIT-VIEW.md) §1.
  - [ ] **Amtliche APIs als Rechner-Zulieferer** — SHAB (`shab.ch/api/v1/publications`: Fristen ab Publikationsdatum — Schuldenruf, Kollokation; Nutzungsbedingungen/Art. 5 URG vorab klären) · UID-Register (SOAP `uid-wse.admin.ch`: Partei-Identifikation im Rubrum statt Freitext) · SNB-Datenportal (Zinsreihen für Verzugs-/Schadenszins). Je Quelle Build-Zeit-Snapshot mit Stand, nie Live-Abfrage im Werkzeug (§2). Quelle: Fremdquellen-Sichtung 2.9.2026 §2.
  - [ ] **Sozialversicherungs-Stammdaten** — BSV «Familienzulagen 2026» (26 Kantone) + «Beträge ab 1.1.2026» als ein Stammdatensatz für Koordinationsabzug, 3a, UVG-Grenze, EL; Risikopfad Rechnen, Zeitreihen-Form nach `W3-TARIF-STAND` Folgeschritt A. Quelle: Fremdquellen-Sichtung 2.9.2026 §1 #18.
  - [ ] **Existenzminimum-Rechner (Karte `existenzminimum`, heute `geplant`)** — Stammdaten aus den **kantonalen** Richtlinien-Publikationen (AG/LU/SG/TG amtlich, ZG Stand 2010 = Drift, BE via Verband), nicht aus den KBK-Richtlinien des Vereins; Zeitreihen-Form nach `W3-TARIF-STAND` Folgeschritt A; Risikopfad Rechnen. Quelle: Fremdnutzen-Suchrunde 2 (6.9.2026) §1.
  - [ ] **FR/IT-Parallelansicht im Leser** (Muster EUR-Lex «Multilingual display») — **Vorfrage zuerst:** sind Fedlex-AKN-`eId` in DE/FR/IT identisch? An einem Erlass per SPARQL/AKN belegen; dazu TERMDAT (LINDAS-SPARQL, ~400k Einträge) für Glossar/Begriffe nur nach Lizenzklärung (wartet auf David, Bibliothek §5). Quelle: Fremdnutzen-Suchrunde 2 (6.9.2026) §2/§3.

- [ ] **Eigenschafts-Tests (property-based) für die Rechen-Engines** *(`QS-CODE-PROP`, Entscheid David 7.8.2026)*
  <!-- @meta id: QS-CODE-PROP · status: ready · blocker: null · dep: [] · feld: werkzeuge · fahrplan: fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md -->
  Runde 1 ist gebaut (12 Engines, 81 Invarianten, kein Engine-Defekt — Chronik). Offen bleiben ein
  Korpus-Defekt und zwei fachliche David-Fragen.
  **Detail:** [FAHRPLAN-OFFENE-BEFUNDE.md](fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md) §5.
  - [ ] **Split-Regel: bei jedem §6.6-Auszug `check:zyklen` nackt mitfahren** *(Beleg #804: Fassaden-Re-Export + Rückimport = Zyklus, CI rot)*.
  - [x] **Gefixt 12.9.2026, PR #820, Gegenprüfung ausstehend — nicht gemergt:** `nichtKonsolidiert`-Marker bei Staatsverträgen falsch-positiv (FZA) — Wurzel-Fix + Vollerhebung siehe [ROADMAP-CHRONIK.md](ROADMAP-CHRONIK.md).
  - [ ] **Staffel-Invariante lückenlos + widerspruchsfrei** — Property-Test über alle `src/data/tarif/**`-Staffeln: jeder Streitwert trifft genau eine Stufe, keine Überlappung, keine Lücke, Stufen-Grenzen monoton; Rot-Beweis per Mutation. Muster Catala/Z3 «keine Regel anwendbar / zwei Regeln kollidieren». Quelle: Rules-as-Code-Sichtung 5.9.2026 §5.
  - [ ] **Monatsend-Arithmetik der Fristen-Engine explizit** — Prüfauftrag, ob `fristenEngine.ts`/`datumsUtils.ts` bei «31.1. + 1 Monat» und Schaltjahr stillschweigend rundet; Ergebnis als Property-Test mit belegter Norm (Art. 77 OR / Art. 142 ZPO) und ausdrücklicher Rundungsregel statt date-fns-Default. Muster Catala `dates-calc` (Apache-2.0, Namensnennung). Quelle: Rules-as-Code-Sichtung 5.9.2026 §2/§5.
  - [ ] **Rechenweg-Vollständigkeit als Invariante** — jede `status: 'ok'`-Antwort trägt ≥1 `Rechenschritt` mit Norm-Anker; heute leere `rechenweg: []`-Pfade in `beurkundung.ts`, `lohnfortzahlung.ts`, `grundbuchgebuehren.ts`, kein Rechenweg in `emissionsabgabe.ts`. Muster Catala `--trace`/GoRules-Trace (Regel → Artikel → Zwischenwert). Quelle: Rules-as-Code-Sichtung 5.9.2026 §5/§8.
  - [ ] **WARTET AUF DAVID (fachlich, §7):** SF-F1 (Art.-63-Verlängerung bei gehemmter Frist?) und SF-F2 (Wartefrist-Ablauf in den Betreibungsferien) — Katalog-Zeilen «fachlich vorzulegen».
  - [ ] **`scripts/materialien/check-botschaften-netz.ts` nutzt literales U+0001 als Join-Trenner** *(Befund 11.9.2026, W2·6c-ENTSTEHUNG-DATEN)* — Steuerzeichen im String-Join
    statt einer benannten Konstante/eines strukturierten Schlüssels; ersetzen.

- [ ] **Grenzwert-Test Lohnfortzahlung + zwei überholte Code-Kommentare** *(`QS-CODE-LFZ-GRENZE`, Ertrag der Jules-Suggestions-Sichtung 14.9.2026)*
  <!-- @meta id: QS-CODE-LFZ-GRENZE · status: ready · blocker: null · dep: [] · feld: werkzeuge · fahrplan: fahrplaene/FAHRPLAN-FREMDAGENTEN.md -->
  Die drei belastbaren Funde aus 76 proaktiven Jules-Vorschlägen (~4 % Ausbeute) als EINE
  sortenreine Bau-Einheit. Ziel: die Drei-Monats-Grenze von Art. 324a OR direkt prüfen und zwei
  Kommentare, die Erledigtes als offen ausgeben, auf ihren Beleg zeigen lassen. Grenzen: keine
  Verhaltensänderung, bestehende Tests bleiben unverändert (§6.3).
  **S-Grösse ⇒ mit der nächsten `feld: werkzeuge`-Einheit bündeln, nicht allein fahren.**
  **Detail (Fundstellen, Belege, Rauschen-Muster):** [FAHRPLAN-FREMDAGENTEN.md](fahrplaene/FAHRPLAN-FREMDAGENTEN.md) §5.
  - [ ] **Gegenprüfung nicht erforderlich — gemessen, nicht geraten** *(14.9.2026)*: `istRisikoPfad()` ist für alle vier Dateien **false**. **Offener Punkt daraus:** `src/lib/datumsUtils.ts` trägt die 324a-Grenze, fällt aber aus dem Klassifikator (`RECHNEN_RE` trifft den Dateinamen nicht) — mit Rot-Beweis (§6.7) entscheiden, **bevor** dort jemand Rechenlogik ändert.

- [x] **Tarif-Stammdaten: Stand maschinenlesbar + Drift-Tor** *(`W3-TARIF-STAND`, Rules-as-Code-Sichtung 5.9.2026, Entscheid David 5.9.2026)*
  <!-- @meta id: W3-TARIF-STAND · status: done · blocker: null · dep: [] · feld: werkzeuge -->
  ✅ gelandet 6.9.2026 (#734) — Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 7.9.2026. Die offenen
  Folgeschritte darunter bleiben unverändert stehen.
  **Detail:** [rules-as-code-sichtung-2026-09-05.md](bibliothek/recherche/rules-as-code-sichtung-2026-09-05.md) §6.
  - [ ] **Folgeschritt A · Wert-Zeitreihe je Tarif** *(nicht vor dem Tor)* — `{ab, wert, quelle, stand}` je Eintrag, UI-Eingabe «massgebender Zeitpunkt», Zeitreihen-Golden (ein Sachverhalt über alle Rechtsstände, Muster OpenFisca `tests/rates_rebates/time.yaml`); Vorfrage: frühere Fassungen bei lexfind/zh.ch/belex stabil adressierbar? Typ-Muster bitemporal (`nicia-ai/typegraph`, MIT). Quelle: Rules-as-Code-Sichtung 5.9.2026 §5/§6.
  - [ ] **Folgeschritt B · Rechtsstand als Datumsbedingung neben der Regel** — `erbteilung.ts:200` und `gewaehrleistung.ts:71` von der `if datum >= …`-Weiche im Rumpf auf zwei nebeneinanderstehende, je mit Norm-Anker und Geltungsintervall versehene Regeln umstellen (verhaltensneutral, bestehende Mehr-Rechtsstand-Tests bleiben unverändert §6.3); Konvention dazu: nicht codierte Teilnormen als Kommentar mit Grund stehen lassen (Muster OpenFisca `CONTRIBUTING.md`). Risikopfad ⇒ Gegenprüfung. Quelle: Rules-as-Code-Sichtung 5.9.2026 §4/§5.
  - [ ] **Amtliche Golden-Quellen ins Tor** — Kantonsgericht VS Excel «Calcul des frais de justice» (7.2.2025), Amtsnotariate SG Gebührentabelle (Stand 27.3.2026), BGer-Tarif SR 173.110.210.1; Steuerrekursgericht-ZH-Excel (2019) nur nach Normabgleich. Negativbefund: kein Kanton betreibt einen interaktiven amtlichen Rechner, private Rechner sind keine Quelle (§7). Quelle: Fremdnutzen-Suchrunde 2 (6.9.2026) §1.
  - [ ] **Drift-Nachverifikation der 34 Erlasse** → eigener Schritt `W3-TARIF-NACHVERIFIKATION` (herausgelöst 6.9.2026, Auftrag David).
  - [ ] **Adapter-Lücke 268 Einträge / 34 Quellen ohne Fassungsadressierung** (lexfind 42, silgeneve, rsn.ne, m3.ti, sz.ch-PDF, rsju, urilaw, ur.ch, prestations.vd, 4 Einträge ohne `quelleUrl`) — je Portal Fassungskennung finden (Muster `zh-quellinventar`), lexfind und die 4 URL-losen zuerst.
  - [ ] **Datenhygiene `src/data/tarif/**`** *(§5-Befund 6.9.2026)* — 72 von 122 `quelleUrl` tragen mehr als einen `stand`-String (bis 8, TI atto/181; OW 210.32 fünf Schreibweisen desselben Datums); `erlassNr` «914.5 (GB-GebV); 821.5 (GebT)» nennt zwei Erlasse in einem Feld (20 Einträge «unklar»). Vereinheitlichen ohne Wertänderung, Golden byte-gleich, Gegenprüfung.
  - [ ] **`scripts/tarif/**` in `istRisikoPfad()` aufnehmen** *(Nebenfund Nachzug 6.9.2026)* — die Drift-Logik fällt Rechtsdaten-Verdikte, liegt aber ausserhalb des Klassifikators in `scripts/gegenpruefung/kern.ts`; Rot-Beweis: Edit an `drift-logik.ts` muss `check:gegenpruefung` rot machen.
  - [ ] **WARTET AUF DAVID (fachlich, §7):** Verjährungsrevision 2020 (relative Frist 1→3 J.) als echte Weiche statt Nutzerwarnung (`verjaehrung.ts:547`).


---
  - [ ] **Zurückgeholt aus der Chronik** *(Umschichtung 15.9.2026 (Entstehung))* — OW Beurkundungstarif Ziff. 35 lit. a/b Zuordnungsverdacht · VS LTar Art. 15 zwei Einträge, verschiedene Begründung (§5) · Härtungen `check:tarif-drift` (a)–(c), je mit Rot-Beweis, `scripts/tarif/**` Risikopfad — Wortlaut dort.

## Betrieb & Prüfstrasse  *(`feld: betrieb`)*

> Dieses Feld steht bewusst zuletzt: ohne `@queue`-Eintrag entscheidet die Dokumentreihenfolge,
> und dann soll ein Produkt-Schritt gewinnen, nicht ein Prozess-Schritt.

- [ ] **Effizienz-Dauerauftrag (Token/Prozess)** *(`QS-EFFIZIENZ`, stehender Auftrag David 14.8.2026)*
  <!-- @meta id: QS-EFFIZIENZ · status: ready · blocker: null · dep: [] · feld: betrieb · fahrplan: fahrplaene/FAHRPLAN-EFFIZIENZ-CHECKLISTE.md -->
  «bau immer weiter an dingen die bei zukünftigem bau token sparen … bis ich stop sage»: fortlaufende,
  serielle Kleinschritte an Skills/Hooks/Toren/Steuer-Doku; je Punkt eigener Commit/PR, Grenzen
  unverändert (§1, Abnahme, Risiko-Gegenprüfung).
  **Detail:** [FAHRPLAN-EFFIZIENZ-CHECKLISTE.md](fahrplaene/FAHRPLAN-EFFIZIENZ-CHECKLISTE.md) §1 —
  die Checkliste liegt seit 29.8.2026 dort statt hier (sie war eine Merge-Konflikt-Falle: 6 Konflikte
  in EINER Zeile bei 15 PRs).
  - [ ] **ROADMAP-Deckel steht dauerhaft gelb** *(Messung 18.9.2026)* — 120,6 KB bei Session-Start, 132,1 KB nach zwei parallelen Sessions, 130,0 KB nach einer Teil-Überführung in die Chronik; Budget 120 KB. Seit dem Entscheid David 18.9.2026 (#905) blockiert der Deckel nicht mehr, **darum wächst er unbemerkt weiter** — die Warnung allein ändert kein Verhalten. Fällige Chronik-Überführung nach Skill `bauschritt` → [aufraeumen.md](.claude/skills/bauschritt/aufraeumen.md): erledigte Unterpunkte lebender Dach-Schritte auslagern (nicht nur `done`-Schritte), je mit Zeiger-Zeile. Als eigener Schritt fahren, nicht nebenbei — die Auslagerung muss `check:plan` und die `dep`-Auflösung intakt lassen.
  - [ ] **Hebel ROADMAP-Grösse: Befund-Prosa in die Fahrpläne** *(David 18.9.2026, vorgemerkt)* — 54 % der Datei sind offene Zeilen (64 KB; Erledigtes 0,4 KB): lange `[ ]`-Befundzeilen in den Detail-Fahrplan des Dachs, hier je Kurzzeile + `**Detail:**`-Zeiger (Skill `auftrag` Ziff. 1), danach automatisierbar. ROADMAP-Deckel seit 18.9. nur Warnung (`struktur-rotieren.py` NUR_WARNUNG). Daneben: Vault-Eintrag `lexmetrik-lektionen` — UI-/Code-Konventionen ins Reglement, dann archivieren.
  - [x] **ROADMAP-Deckel bleibt knapp — nächste Umschichtung braucht einen `dep`-Umbau** *(Messung 14.9.2026)* — ✅ 15.9.2026 (PR #896, `d26dbbac6`): `check:plan` akzeptiert erledigte `dep`-Ziele aus der Chronik. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 15.9.2026 (4).
  - [ ] **Steuerdeckel-Entscheid — wartet auf David:** Streichkandidat unter `scripts/check-*.ts` (5.9.2026 Prosa-Diät statt Deckel-Hebung; Hooks ~0 B Luft) *(sechs erledigte Nebenpunkte 5.9.2026 umgeschichtet: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).*
  - [ ] **Rückbau-Kandidaten aus `npm run tor:bewaehrung` — wartet auf David:** `check:smoke` · `check:sweep` · `check:verfall` · `check:normtext` (je 83 Läufe, null Rot seit Einführung, Stand 15.9.2026); dazu entscheiden, ob `tor:bewaehrung` und `retro:17` (gleiche Frage, andere Zeitreihe) zusammengelegt werden (§17-Gegengewicht). Hook-Log-Diff für die 9 Hooks liegt bei David (`/tmp/qs-bewaehrung-hook-log.diff`).
  - [x] **Session-Notizen-Datei (Nebenfunde/Lehren überleben Kompaktierung und Übergabe)** — erledigt 15.9.2026, PR #891
  - [ ] **Chronik-Hygiene** *(Nebenfunde #896, 15.9.2026)* — `ROADMAP-CHRONIK.md` 489 KB ungedeckelt und seit #896 bei jedem `plan:next`/`check:plan` gelesen → Monats-Split wie `archiv/STRUKTUR-SESSIONKARTEN*`; Wächter «keine offene `- [ ]`-Zeile in der Chronik» (Beleg: elf Posten lagen nach #893 unsichtbar im Archiv, zurückgeholt 15.9.); Dublette `W2·23-STARTSEITE-V4` 2× done.
  - [ ] **Branch-Sonde vor Commit als Sperre statt Prosa** *(zweiter Beleg 18.9.2026, PR #903)* — Haupt-Session committete `docs(plan)` auf den Branch einer Parallel-Session, die im Haupt-Checkout gewechselt hatte (Skill `auftrag` 6 (j) deckt nur Dispatch). Ziel: Hook verweigert `git commit`, wenn der Branch nicht der erwartete ist; §12-Verstoss «Branch-Wechsel im Haupt-Checkout» mitprüfen.
  - [ ] **`check:lizenzen` in Agent-Worktrees ohne `node_modules` immer rot** *(17.9.2026)* — meldet «0 Paket(e) geprüft» als Lizenzverstoss statt Umgebungsproblem. Fix: `node_modules` vor `npm ls` prüfen, sonst «npm ci» melden.

- [x] **Bewährungs-Messung für Tore, Hooks und Regeln** *(`QS-BEWAEHRUNG`)* — ✅ 15.9.2026. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 17.9.2026.

- [ ] **Fremde Agenten im Bau — Jules, Antigravity, Gemini** *(`QS-FREMDAGENTEN`, Freigabe David 3.9.2026)*
  <!-- @meta id: QS-FREMDAGENTEN · status: ready · blocker: null · dep: [] · feld: betrieb · fahrplan: fahrplaene/FAHRPLAN-FREMDAGENTEN.md -->
  Ziel: neben Claude Code eine zweite Bauequipe (Jules) und einen Lese-/Sichtungsweg (Antigravity,
  Gemini) auf der grünen Spur nutzen — risikofrei, eng umrissen, Tor-geprüft. Grenzen: Risikopfade
  bleiben Claude-Unteragenten, Verdikte und Landung bleiben bei Claude, die fachliche Abnahme bei
  David; jede Phase hat eine Rückbau-Schwelle statt einer Bewachung.
  **Detail:** [FAHRPLAN-FREMDAGENTEN.md](fahrplaene/FAHRPLAN-FREMDAGENTEN.md) §2.
  - [x] **Erledigt:** Phase 0 · Pilot Jules · Diskrepanz-Finder — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 7.9.2026 (2).
  - [x] **Erledigt:** Fremd-PR-Tor Kommentar-MULTIMENGE (PR #862) — ✅ 14.9.2026. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 18.9.2026.
  - [ ] **Jules-Bilanz 14.9.2026 — drei Tickets, drei Ablehnungen** *(Messreihe: FAHRPLAN-FREMDAGENTEN §5)* — Tickets #849/#850/#858 (Reiterleiste.tsx-/tabs.ts-Split), PRs #855, #857 und #861 **alle abgelehnt**. Muster: **Jules generiert, statt zu verschieben** (Kommentar-Paraphrasen, gelöschte Kommentarzeilen, in #855 zusätzlich eine geänderte Hook-Reihenfolge). **Ticket #858 war mein eigener Fehler** — der Body enthielt nur die EN-Summary-Zeile, die Detailregeln fehlten (Vorfall und Regel: Fahrplan §5). Die Rückbau-Schwelle §3 ist damit zu prüfen; die Neuanlauf-Tickets (Reiterleiste, `tabs.ts`-Split dritter Anlauf mit gemeinsamer Typen-Datei) gehören in die **nächste Session**, nicht in diese. **Nachtrag 15.9.2026:** `check:schlankheit` war deshalb **auf main rot** (Nullprobe `e94a3dc90`: `Reiterleiste.tsx` 1 237 Z., `lib/tabs.ts` 1 205 Z., Schwelle 800) — ein Dauer-Rot wird überlesen (F2-Familie), der Split ist **dringlich**, nicht nur fällig. PR #874 (`40f634b3d`) hat beide Dateien in `schlankheit-bestand.json` aufgenommen: Tor grün **ohne Schnitt** (§17 «kein Deckel-Anheben») — das Rot ist weg, der Befund nicht.
  - [ ] Zweitblick-Messung — erster Durchgang eingetragen (#658, VZV/AMBV: 1 echt vorbestehend, 7 Schein, 0 verpasst; 1/5, Schwelle §3 noch nicht erreicht), weitere vier im Alltag. §2/§3.
  - [ ] Phase 4 Skalierung läuft — Landungsquote 83 % (n=6), Median 30 min ⇒ Ticketzahl 3–5 offen; Jules-API mit Plan-Gegenlesen (D4) noch offen; Antigravity-Claude als Bauarbeiter (D7) **geparkt** (Bauleiter/David-Chat 4.9.2026, kein Zwischenmarkt zu Jules — Wiedervorlage nur bei Kontingent-Engpass). §2.
  - [ ] **Wiedervorlage «Google-Ökosystem-Sichtung»** *(Dach QS-FREMDAGENTEN, Phase 4)* — alle 3 Monate, erste Fälligkeit **Dezember 2026**: Gemini-Recherche (agy, `read_url(*)`) «neue Google-KI-Produkte/Modelle, Jules-/Antigravity-Changelog seit \<Datum\>», Bewertung ~30 min, Eintrag in Fahrplan §7. Maschinischer Anstoss: `retro:17` Regel (h) ab 30 Tagen seit `bibliothek/register/antigravity-stand.json`. §7.
  - [ ] **Ein Regel-Kern für alle Modelle** *(Nebenfund 18.9.2026)* — `AGENTS.md` und `CLAUDE.md` sind zwei von Hand parallel gepflegte Regelwerke, kein Tor erkennt Drift (§5). Ziel: neutraler Kern, auf den `CLAUDE.md` verweist, plus Wegweiser zu den Skills; lohnt erst bei erneutem Fremdmodell-Bau.
  - [ ] **`Reiterleiste.tsx` (1237 Z.) + `tabs.ts` (1205 Z.) über der Schlankheits-Schwelle** *(Nebenfund 15.9.2026, aus #843–#845; Tor nicht CI-pflichtig)* — Baseline aufgenommen (#874), **Split offen**.
  - [ ] **`scripts/plan/selbstoptKern.ts` über der Schlankheits-Schwelle, unregistriert gefunden** *(Nebenfund 4.9.2026)* — 1094 Z. (Schwelle 800), nur ins Baseline-Register aufgenommen, **Split offen**. Das Geschwister `src/tests/plan-selbstopt.test.ts` ist seit PR #699 gesplittet. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (6).

- [ ] **Automatik-Gesundheit** *(`QS-AUTOMATIK`, `[OF]`)*
  <!-- @meta id: QS-AUTOMATIK · status: parked · blocker: zielbild-gesetzesleser · dep: [] · feld: betrieb · fahrplan: fahrplaene/FAHRPLAN-BASIS-AUSBAU.md -->
  Läuft unsere Automatik wirklich, und würde sie scheitern können? Offen: Turso-Wächter-Abdeckung +
  Wachstums-Schwellen.
  **Detail:** [FAHRPLAN-BASIS-AUSBAU.md](fahrplaene/FAHRPLAN-BASIS-AUSBAU.md) §1.
  - [ ] **§17 Plan-Buchung-Fallback akzeptiert den Roadmap-Block nur als letzten PR-Body-Absatz** *(#628 nicht gebucht, 2.9.2026)* — Wurzel-Kandidat: Block an beliebiger Stelle des Bodys akzeptieren oder `check:merge-schutz` prüft den PR-Body-Aufbau.

- [ ] **Basis-Ausbau — Fundament** *(`QS-BASIS`, `[OF]`)*
  <!-- @meta id: QS-BASIS · status: ready · blocker: null · dep: [] · feld: betrieb · fahrplan: fahrplaene/FAHRPLAN-BASIS-AUSBAU.md -->
  CI/lokal-Tor-Parität + offene B-Einheiten.
  **Detail:** [FAHRPLAN-BASIS-AUSBAU.md](fahrplaene/FAHRPLAN-BASIS-AUSBAU.md) §2.
  - [ ] **`main.tsx` nutzt `createRoot` statt `hydrateRoot`** — prerendertes DOM wird 27–78 ms nach `load` verworfen (Nullprobe auf main bestätigt); Wurzel der «flaky» Tastatur-/Skip-Link-Specs und ein CLS-/TTI-Posten. Fix mit Hydrations-Fehler-Wächter, Vorher/Nachher-Messung, Gegenprüfung, eigener PR.
  - [ ] **Geparkter Stand `hydrateRoot` (9 Commits, still seit 15.9.) — Tag `archiv/qs-basis-hydrate-2026-09-18` (ae04f6caf), Branch + Worktree am 18.9.2026 abgeräumt; kollidiert nach #899 mit `Begruessung.tsx`/`SuchBlock.tsx`/`prerender.ts`** *(17.9.2026)* — Wiederaufnahme aus dem Tag (`git switch -c feat/qs-basis-hydrate archiv/qs-basis-hydrate-2026-09-18`), dabei `anfangsGruss()` in `useHeute` übernehmen.
  - [ ] **`linkedom`-`window` ist Proxy auf `globalThis`: Werte lecken in Folgetests** (`begruessung-strictmode.test.tsx`, 17.9.2026).
  - [ ] **E2E-Flake Shard 2/8 — Wurzel messen statt neu starten** *(Befund QS-FREMDAGENTEN, Session 4.9.2026)* — Befund-Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (5); Bau-Einheit offen, Zeiger genügt zur Steuerung.
  - [ ] **§17 Doku-PR macht offene PRs nicht nur BEHIND, sondern DIRTY** *(Vorfall 14.9.2026, #870 gegen #869)* — BEHIND kostet einen CI-Lauf, DIRTY eine fremde Session. Befund, Regel und Wurzel-Kandidat: FAHRPLAN-OFFENE-BEFUNDE §4 («Doku-PR gegen offenen Bau-PR»).
  - [x] **§17 BEHIND-Schleife durch Plan-Buchung** *(2.9.2026)* — ✅ 19.9.2026, Wurzel-Kandidat «Merge-Queue» gezogen; Rest (Plan-Buchung selbst) unter `QS-CI-MINUTEN`. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 19.9.2026.
  - [ ] **§17 F13 klären: Warum wurde der main-Lauf 1123b1974 (#629) «cancelled»?** *(2.9.2026)* — `cancel-in-progress` ist für main seit 26.7. aus; trotzdem endete der Merge-Lauf ~30 s nach dem Folge-Push 9cdbb6a55 als cancelled, der Deploy fehlte (Sidecar 404, Heilung per `gh run rerun`). Kandidaten: Selbst-Cancel-Schritt («BEHIND-PR … nachziehen»/«Geplante Workflows»), GitHub-seitig. Rot-Beweis mit zwei schnellen main-Pushes, dann Wurzel-Fix; bis dahin Skill `landung` Nachkontrolle 0.
  - [ ] **Zugangsschlüssel nach dem Org-Umzug prüfen** *(19.9.2026, fällig am Lauf Mo 21.9.2026)* — `AUTOMERGE_TOKEN` (`fedlex-frische.yml`, `normen-monitor.yml`) und `PLAN_BUCHUNG_TOKEN`: feingranulare PATs des Eigentümers `davidgraf95-sys` verlieren mit dem Eigentümerwechsel den Zugriff. **Neuanlage nur David.**
  - [ ] **WARTET AUF DAVID · Hook-Diff zum Entscheid «alles durch die warteschlange»** *(19.9.2026; Sessions ändern `.claude/hooks/*.py` nicht selbst)* — `tor-schutz.py` (ca. Z. 205–224) bewirbt weiter `LEXMETRIK_MAIN_PUSH=1`, `src/tests/hooks-wache.test.ts:377` prüft sie als ERLAUBT — beides widerspricht dem Entscheid (kein Direkt-Push, kein Bypass). Dazu: `struktur-rotieren.py --hook` kann seinen Commit-Pfad verlieren, seit die Rotation im Doku-PR läuft (`LEXMETRIK_NO_ROTATE=1`, `1ef2797f4`).
  - [ ] **§17 Notizen-Datei: Haupt-Checkout aus einem Worktree nur per Bash schreibbar** *(19.9.2026)* — das Write-Werkzeug sperrt aus einem Worktree Schreibzugriffe auf `<Haupt-Checkout>/.claude/`; die Regel (`bauschritt` Station A 4, globale CLAUDE.md) ist nur per `Bash` erfüllbar. Umgekehrt sehen Kompaktierungs-Hook und `plan:next` eine im Worktree abgelegte Datei nicht. Wurzel offen.
  - [ ] **`README.md` ist ein Fossil** *(19.9.2026)* — «Swiss Legal Calc – Modul 1: Arbeitsrecht» plus ein Architektur-Baum, den es nicht mehr gibt — für eine übernehmende Person die erste und irreführendste Datei (Zweck `BETRIEB.md`). Auf Ist-Stand bringen oder dorthin verweisen.
  - [ ] **Vercel Deployment Storage nachmessen — überfällig** *(Auftrag 8.9.2026, «48 h nach der ersten Landung»)* — war 261.91 GB gegen 10 GB Hobby-Grenze (ein Stand = 738 MB); über 10 GB ⇒ die 455 MB Korpus-Dateien je Stand auslagern. Wortlaut: `landung/referenz-ci.md` Ziff. 1b.
  - [ ] **`shellcheck` fehlt lokal** *(19.9.2026)* — `landung-kette.sh` und `scripts/ci/*.sh` prüft nur `bash -n` (Syntax), nicht Quoting/Wort-Trennung. Als Voraussetzung dokumentieren oder ein Tor bauen, das ohne shellcheck übersprungen wird — aber eines, das scheitern kann (§6.7).
  - [ ] **§17 · Steuerdeckel-Glob umgehbar durch Dateinamen-Wahl** *(Prüfer/Fixer #856, 14.9.2026)* — der 204-KB-Deckel auf `scripts/check-*.ts` steht bei 203,8 KB, sieht aber die Seitenwagen der gleichen Steuerungsfläche nicht: `scripts/verweis-inventar-messung.ts`, `scripts/ui-normzitate-kommentare.ts`, `scripts/tor-paritaet-sonden.ts` u. a. = 75,4 KB ausserhalb des Globs. Wer den Deckel reissen würde, benennt die Datei anders — das ist kein Budget, das ist eine Namenskonvention. Wurzel-Fix: Glob auf die Steuerungsfläche erweitern **oder** ein zweites, deklariertes Flächenbudget; einmal rot zeigen (§6.7).
  - [ ] Totcode-Meldung wird echtes Tor `check:tot` — blockierend bei NEUEN Meldungen (Basis: 1). §3.2.
  - [ ] Dependency-Frische: `npm audit` + Majors + knip-Unlisted als Meldung, nie Stopper. **Lockfile nur über `npx npm@10`.** §3.3.
  - [ ] tailwind 3→4-Migration (PR #503; ~249 className-Dateien visuelle Regression — kein Dependabot-Merge).
  - [ ] Dependabot-Lock-Wurzelfix: npm-Major-Mismatch erzeugt fehlende genestete Einträge (H-8-Muster) — Weg finden, der den Lock automatisch mit npm@10 nachzieht.
  - [~] **(d) Datenhaltungs-Optimierung — Suche-Edge-Umzug Kanton** (31. ✅ Teilerfolge K0–K3 wörtlich: ROADMAP-CHRONIK.md, Umschichtung 8.9.2026 (Landung).
    **VOR DEM MERGE (Landungs-Protokoll aus F1):** «Turso-Serving-Sync» per `workflow_dispatch` auf dem Branch fahren, **bevor** gemergt wird — Sync und Deploy hängen am selben Push und warten nicht aufeinander. Messreihe und Herleitung: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (6).
    **Offen:** K4 (Suchindex-Budgetzeile — fremde Datei, Parallel-Session) · **K3-Scharfschaltung = David-Entscheid** (§8: kantonale Treffer kämen dann nur noch online; Ersparnis 4.26 MiB gzip = 45.2 %) · Gegenprüfung der Fix-Runde.
    **Folgepunkte aus F2 und dem Nebenbefund** — eigene Schritte, bewusst nicht in der Fix-Runde gebaut:
    - [ ] **Präfix-Parität des Edge-Weges** — der Client findet «Verjähr» (FlexSearch `tokenize: 'forward'`), der DB-Weg nicht. FTS5 könnte es (`"Verjähr"*`), aber Angleichen ist eine Recall-, RANG- und Latenz-Änderung auf jeder Query (GP-Messung 31.8.: Präfix hebt z. B. bei «Eigentum» OR 261/ZGB 200 via Marginalien-startsWith auf Stufe 0/Seite 1 — Rang-/Golden-Prüfung MIT budgetieren): lokal, warm, n=3 Median «Eigentum» 15,6 → 107,1 ms bei 658 → 1502 Treffern (6,9x), über Turso-HTTP ungemessen obendrauf. Braucht eigene Messung am Edge und eigene Gegenprüfung.
    - [ ] **Umlaut-Faltung ae/oe/ue** — «Verjaehrung» findet nichts, «Verjahrung» findet alle 259. `remove_diacritics 2` faltet ä→a, aber niemand faltet ae→ä. Betrifft **beide** Wege gleich (der Client strippt NFKD-Diakritika), ist also keine Edge-Lücke, sondern eine gemeinsame; ein Fix müsste beide Indizes zusammen ändern und braucht linguistische Sorgfalt («Aeroplan», «Israel», «Praesidium»).

- [ ] **Adversariale Gegenprüfung — Restkampagne + Werkzeug-Härtungen** *(`QS-GP`, `[OF]`)*
  <!-- @meta id: QS-GP · status: parked · blocker: zielbild-gesetzesleser · dep: [] · feld: betrieb · fahrplan: fahrplaene/FAHRPLAN-LERNPHASE-2026.md -->
  Offen ist Baustein d (rückwirkende Kampagne, Stufen 2–3 + BGE-Korpus-Regenerierung).
  **Detail:** [FAHRPLAN-LERNPHASE-2026.md](fahrplaene/FAHRPLAN-LERNPHASE-2026.md) §2.
  - [ ] `check:prerender-golden` als Opt-in-Beweiswerkzeug (nicht im Pflicht-Gate) — der Seiten-Byte-Gleichheits-Beweis ist heute Handarbeit. §3.2.
  - [ ] Verdikt-Prüfung vor dem Push (lokaler pre-push-Hook) — spart den 11-Minuten-CI-Umweg; einmal rot zeigen (§6.7). §3.3.
  - [ ] Vier Härtungen aus Gegenprüfungen: (a) fedlex-Extraktionsschicht Risiko-klassieren; (b) `leakErkannt` ohne Konsument; (c) `trenneInterneTitel` unterläuft `PARTEI_RE`; (d) `check-merge-schutz.ts` diffs ohne `-z`/`--no-renames`. **b/c Risikopfad ⇒ Gegenprüfung**; je Punkt Rot-Beweis. §3.6.

- [ ] **Status-Marker-Audit + Verifikations-Infrastruktur** *(`LERNPHASE-AB`, `[OF]`)*
  <!-- @meta id: LERNPHASE-AB · status: ready · blocker: null · dep: [] · feld: betrieb · fahrplan: fahrplaene/FAHRPLAN-LERNPHASE-2026.md -->
  Jede Karte/Engine trägt sichtbaren ehrlichen Status + Stand; Golden-Abdeckung und
  Norm-Anker-Prüfung automatisieren.
  **Detail:** [FAHRPLAN-LERNPHASE-2026.md](fahrplaene/FAHRPLAN-LERNPHASE-2026.md) §1.

- [ ] **SEO/A11y** *(`SEO-A11Y`)*
  <!-- @meta id: SEO-A11Y · status: parked · blocker: zielbild-gesetzesleser · dep: [] · feld: betrieb · fahrplan: fahrplaene/FAHRPLAN-SEO-A11Y-GOVERNANCE.md -->
  A11y zahlt auf Bedienbarkeit ein → begleitendes Tor (Tabellen-Semantik, Tastatur-e2e, hreflang).
  Reines SEO bleibt geparkt.
  **Detail:** [FAHRPLAN-SEO-A11Y-GOVERNANCE.md](fahrplaene/FAHRPLAN-SEO-A11Y-GOVERNANCE.md) §4/§5
  (§-Sigel nachgezogen 30.8.2026 — Regel 11 bindet).

- [ ] **Geräte-Last / Performance** *(`QS-PERF`, `[OF]`; **OR-Erst-Render und Register-Schnitt gehören zu Phase 1**, Entscheid 14.9.2026)*
  <!-- @meta id: QS-PERF · status: ready · blocker: null · dep: [] · feld: betrieb · fahrplan: fahrplaene/FAHRPLAN-PERFORMANCE.md -->
  Nicht merklich langsamer, ohne Logikverlust (§15). Der **Erst-Render des OR braucht 8,4–17,2 s
  bis zur Bedienbarkeit** (vermessen 17.8.2026, Nullprobe auf `main` 6/6 rot) — das ist die Wurzel
  des Shard-7-Rots und der Fix gehört hierher, nicht in eine Spec-Anpassung.
  Leser-Tempo gebaut 1.9.2026 (A/B n=5): OR **10 368 → 7 899 ms @4×+4G**, **38 296 → 27 432 ms @6×+3G**,
  ungedrosselt 780 ms — Wortlaut samt Bestands-Fix `InhaltsKopf`: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (3).
  **Budget-Lücke (Messung #860, 14.9.2026):** `public/normtext/register.json` wuchs mit den drei
  Kernerlassen von 1 516 auf 1 518 KB und liegt **in keinem Budget** — der 780-KB-Deckel von
  `check:perf-budget` gilt nur `rechtsprechung/register.json`. Der Register-Schnitt ist damit nicht
  nur Vorbedingung von `W2·5n-BUND-VOLL`, sondern heute schon unbewachte Fläche.
  **Offen (Phase 1):** Snapshot-Preload (zweite Reihenfolge-Stelle im Spy-Effekt, `inhalt-hooks.tsx`) ·
  K3-Chunk-Kaskade · Reader-Kopf-Reflow (§13) · `hydrateRoot` (eigener PR unter `QS-BASIS`) · Register-Schnitt (Vorbedingung `W2·5n-BUND-VOLL`).
  - [ ] **Startseite LCP 9,3 s — wahre Ursache offen** *(Lighthouse Mobil, 17.9.2026)* — 9,38 s/66 vor #879; 9,33 s/66 nach #879 (`13fbaaead`, 35015052713, kein Gewinn); 9,34 s/69 nach #899 (`c18e65574`, 35222958433); 9,40 s/66 nach #900 (`e4189bed6`). TTI==LCP, Budget 10,0 s. Verdacht: Route-Suspense zeigt Startseite erneut (#899). `perf-budget` 58,0/60 KB knapp.
  - [ ] **#899 CSP-Hash `GRUSS_SKRIPT` nur per Unit-/e2e-Test** — Vercel-Header prüft CI nicht.
  **Detail:** [FAHRPLAN-PERFORMANCE.md](fahrplaene/FAHRPLAN-PERFORMANCE.md) §1 (dort seit 29.8.2026
  auch die vollständige Messreihe und der Reader-Kopf-Reflow-Befund, wörtlich aus der ROADMAP; §1-N3
  trägt die A/B-Reihe vom 1.9.2026) und
  [bibliothek/seo/leser-tempo-qs-perf-2026-09-01.md](bibliothek/seo/leser-tempo-qs-perf-2026-09-01.md).

- [ ] **Optimierungs-Research Juli 2026** *(`QS-OPT`, `[OF]`)*
  <!-- @meta id: QS-OPT · status: parked · blocker: zielbild-gesetzesleser · dep: [] · feld: betrieb · fahrplan: fahrplaene/FAHRPLAN-OPTIMIERUNG-2026-07.md -->
  Betriebs-/Tor-/Bau-Optimierungen ohne Rechtsinhalt (O-Reihe); keine Massnahme kürzt Beweis, Tor
  oder Prüfung.
  **Detail:** [FAHRPLAN-OPTIMIERUNG-2026-07.md](fahrplaene/FAHRPLAN-OPTIMIERUNG-2026-07.md) §1.

- [ ] **Verwenden statt bauen — risikoarme Fertigteile aus der Fremdquellen-Sichtung 2.9.2026** *(`QS-VERWENDEN`)*
  <!-- @meta id: QS-VERWENDEN · status: ready · blocker: null · dep: [] · feld: betrieb -->
  Quelle: [fremdquellen-sichtung-2026-09-02.md](bibliothek/recherche/fremdquellen-sichtung-2026-09-02.md)
  §1 (Rangliste). Alles Risiko gering.
  - [x] **Erledigt:** V1 · V1b · V2 · V3 · V4 · V5 · V6 · V8 — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 7.9.2026 (2).
  - [ ] **V5b check:feed in ci.yml Tore-Job verdrahten** (Paritäts-Allowlist-Eintrag danach entfernen) — Folgeschritt aus der Gegenprüfung 2.9.2026 (Auflage H-2): das Drift-Tor `check:feed` läuft bis dahin nur lokal in `check:seriell`/`gate`, nicht im PR-Pfad; analog V1b für `check:lizenzen`.
  - [~] **V7 Feiertags-Gegenprobe** als reiner Test: kantonale Feiertagsformeln vs. date-holidays CH (Abweichung = Prüfauftrag, kein Fix ohne Quelle). Beleg: Rangliste #15. `src/tests/feiertage-gegenprobe.test.ts` (26 Kantone × 2024–2027, 45 Rohabweichungen, 43 als gewollt erklärt — Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (6)); **1 offen:** Näfelser Fahrt GL 2027 (`test.skip`, TODO(David) — Formel nennt 1.4., date-holidays 8.4., nur 2026 amtlich gegen gl.ch verifiziert).
  - [ ] **V9 Prüf-Roboter als GitHub Actions** — axe-core/Pa11y (eCH-0059 = WCAG 2.1 AA), lychee (Erreichbarkeit amtlicher Links), REUSE (Lizenz-Linter); nur Transport-/Form-Prüfung, nie §7-Inhalts-Drift; §17-Gegengewicht: je Roboter eine bestehende Handprüfung streichen. Quelle: Fremdquellen-Sichtung 2.9.2026 §1 #20.
  - [ ] **V10 Task-Graph + Remote-Cache** (Turborepo, Vercel Remote Cache gratis) — erst nach Messung, welche der 48 seriellen `check:*` die CI-Zeit kosten; Messung ist der Schritt, der Umbau folgt nur bei belegtem Gewinn. Quelle: Fremdquellen-Sichtung 2.9.2026 §1 #19.
  - [ ] **V11 Korpus-Stand zitierbar** — Zenodo-DOI (oder HF-CC0-Spiegel) je Korpus-Release aus dem Manifest; unveränderlicher Stand für Zitate in Schriftsätzen (§8). Quelle: Fremdquellen-Sichtung 2.9.2026 §2.
  - [ ] **V12 CKAN-Wächter** — `ckan.opendata.swiss/api/3/action/package_search` periodisch nach neuen amtlichen Rechtsdatensätzen (Gerichte, Erlasse, Gebühren) abfragen; Fund = Roadmap-Zeile, kein Auto-Import. Quelle: Fremdquellen-Sichtung 2.9.2026 §2.

- [ ] **Lagebild für David schlank und ehrlich** *(`QS-LAGEBILD`, Auftrag David 8.9.2026 «schlanker und übersichtlicher für mich»)*
  <!-- @meta id: QS-LAGEBILD · status: ready · blocker: null · dep: [] · feld: betrieb -->
  ✅ Sitzung 1 gelandet 8.9.2026 (#765): fünf Klartext-Blöcke, 1714 → 558 Wörter, Bau-Details eigene Seite, Wortbudget-Tor (Wortlaut: Chronik, Umschichtung 8.9.2026 (Landung)).
  Ziel Sitzung 2: jeder Entscheid trägt Frage · Optionen · Empfehlung; Grenzen: `scripts/plan/bild*` + ROADMAP-Kopfblöcke.
  - [ ] `@blockers`-Zeilen um `frage:` / `optionen:` / `empfehlung:` / `zurückgestellt:` erweitern; Lagebild rendert die Felder als Karte, Gate-Prosa optional eingeklappt.
  - [ ] `davidFragen`-Parser (`scripts/plan/bildDaten.ts`): Formfehler (fehlendes `· quelle:`) ⇒ `check:plan` rot statt stummer Drop (§17-Wurzel-Fix, Beleg 8.9.2026: 1 Frage verschluckt).
  - [ ] «wartet seit N Tagen» nur ohne `zurückgestellt:`-Feld (Beleg: `richter-analytik-gate` 49 Tage, obwohl bewusst ruhend).
  - [ ] Kürzel in Schritt-Titeln (`M13`, `D40`) — Titelregel `auftrag` Ziff. 1.

- [ ] **Prüfstrasse sparsamer ohne Prüftiefe-Verlust** *(`QS-CI-MINUTEN`, Auftrag David 8.9.2026)*
  <!-- @meta id: QS-CI-MINUTEN · status: ready · blocker: null · dep: [] · feld: betrieb -->
  Gebaut 8.9.2026: M1–M5, Flacker-Wächter (Melde-Modus bis 22.9.2026, dann hart), Ergebnis-Job, Playwright-Install-Retry — Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (3); Regeln: Skill `landung` §«Prüfstrasse seit 8.9.2026». **Nachmessung 8.10.2026.** **Merge Queue erledigt 19.9.2026:** Repo `LexMetrik/Whatever`, Ruleset 23699779 (SQUASH, ALLGREEN, max 3, Timeout 60 min, keine Bypass-Akteure), `strict` AUS; erster Durchlauf #922 + #917 gemeinsam gelandet 15:05:00Z. Herleitung (#914/#892), `QS-ORG-UMZUG` im Wortlaut, Entscheide David 8.9.2026 (Weg A, M2): Chronik, Umschichtung 19.9.2026 bzw. 14.9.2026 (3). Offen: Wurzel der flackernden Specs (Fehlerbuch §4, bis 22.9.) — unter der Queue schwerer.
  Ziel: CI-Minuten senken, kein Tor entfällt, `check:e2e-shards` bleibt.
  **Detail:** [ci-minuten-sparplan-2026-09-08.md](bibliothek/betrieb/ci-minuten-sparplan-2026-09-08.md)
  — 61'381 min/Monat, `ci.yml` 97,5 %, Sparplan −24'300 ohne Prüftiefe-Verlust.
  - [ ] **M1** main-Push-Lauf auf Bau/Perf/Deploy kürzen (−15'050/Mt,
    Bauschritt + §6.7-Tor: Head ist Squash-Merge eines grünen PR, sonst
    Volllauf). **Bedingung `strict==true` neu fassen** — `strict` ist seit
    19.9.2026 AUS (Merge-Queue).
  - [ ] **M2** Dependabot `rebase-strategy: disabled` + monatlich (−3'800,
    sofort/Konfig, **David-Freigabe**).
  - [ ] **M3** e2e-Shards 8 → 4 (−3'800, Bauschritt + Branch-Regel).
  - [ ] **M4** Doku-Läufe: 8 Shard-Kontexte → 1 Sammel-Kontext (−1'500,
    Bauschritt + Branch-Regel — **Fallstrick:** Required-Check-Name ändert,
    `check:merge-schutz`-Liste im selben Schritt nachziehen).
  - [ ] **M5** Plan-Buchung `npm ci` erst nach Trailer-Fund (−150,
    sofort/Konfig, **David-Freigabe**).
  - [x] Wurzel `strict: true` ⇒ Merge Queue (Gate G7) — ✅ 19.9.2026, Ruleset 23699779, `strict` AUS.
  - [ ] **Plan-Buchung: messen, dann zurückbauen** *(19.9.2026, UNGEMESSEN)* — passiert der `[skip ci]`-Push von `plan-buchung.yml` das Ruleset 23699779 noch? Wurzel ist ohnehin der Rückbau: der Status fährt seit 19.9.2026 im PR mit (`landung` Ziff. 9) ⇒ streichen oder auf reine Prüfung umstellen. Zwei Defekte in denselben Schnitt: `git log -1` sieht bei Sammel-Landung nur den Kopf-PR; eine `Co-Authored-By:`-Zeile im Trailer-Absatz leert den Fallback (`extractTrailerBlock`, `scripts/plan/buchung.ts`).
  - [ ] **Ersten reinen Doku-Eintrag in der Queue beobachten** *(19.9.2026, nach Landung des `ci.yml`-Umbaus)* — «`art=doku` ⇒ übersprungenes Perf-Budget zählt als erfüllt» ist nur aus GitHub-Doku und PR-Ebene belegt, nicht aus einem `merge_group`-Lauf. Worst Case: Hänger bis zum 60-min-Timeout.
  - [x] **`scripts/landung/landung-kette.sh` real gegen die Queue fahren** *(19.9.2026)* — ✅ 19.9.2026 mit PR #919: eingereiht 15:59Z, `mergeQueueEntry.state` gepollt, MERGED `661612cea` 16:29:21Z, Zweig von GitHub selbst gelöscht, Exit 0. **Nur der Gut-Pfad ist real belegt**; die Halte-Pfade (UNMERGEABLE, verschwundener Eintrag, GraphQL-Fehler) sind weiterhin nur simuliert (Simulation a–g, 377ea3c11).
  - [ ] **`landung-kette.sh`: Test-Harness ins Repo** *(19.9.2026)* — die Simulation a–g samt Rot-Beweis lag nur im Session-Scratchpad und ist weg; ohne sie ist jeder Folge-Edit an den Halte-Pfaden ungeprüft. Als `scripts/landung/*.test.*` mit gefälschtem `gh` im PATH nachbauen (§6.7: einmal rot zeigen).
  - [ ] **`check:schlankheit` sieht keine `.sh`-Dateien** *(19.9.2026)* — `landung-kette.sh` und `scripts/ci/*.sh` wachsen ohne Deckel. Glob erweitern oder bewusst ausnehmen und begründen.
  - [ ] **Dequeue-Helfer fehlt** *(19.9.2026)* — `gh` kennt keinen Befehl, einen PR aus der Queue zu nehmen (nur Web oder GraphQL `dequeuePullRequest`); ein irrtümlich eingereihter PR ist heute nur von Hand zu stoppen. Kleiner Helfer unter `scripts/landung/` plus Zeile im Skill `landung`.
  - [ ] **Rename-Schutz der Diff-Klassierung ohne dauerhaftes Tor** *(Gegenprüfung 19.9.2026)* — `previous_filename` fliesst seit 16ff18090 in alle drei `ci.yml`-Zweige, belegt ist das nur durch die einmalige Prüfer-Probe; die Vitest-Parität (a80a6a3bd) deckt die Muster, nicht die jq-Zeile `DATEI_JQ`. Probe mit aufgezeichneter Compare-Antwort nachziehen.
  - [ ] **`ci.yml` ca. Z. 300: «keine Direkt-Pushes mehr» ist ungenau** *(19.9.2026)* — das Ruleset 23699779 trägt nur die Regel `merge_queue`; ob der Server einen Direkt-Push ablehnt, ist UNGEMESSEN (der Klassifikator blockt den Versuch). Kommentar auf «per Hook und Entscheid David 19.9.2026 gesperrt, serverseitig ungemessen» richtigstellen.
  - [x] **Erster `merge_group`-Lauf der neuen Klassierung** — ✅ 19.9.2026, Lauf 35454618928 (#927): Compare `95cb5a712…a5734fb86` (Basis = Queue-Commit des Vordermanns #925, nicht main), 19 Dateien, `art=code`, alle vier Required grün.
  - [ ] **Flacker-Stichtag 22.9.2026 — zwei Specs und eine Ausnahme ungemessen** *(19.9.2026)* — ab 22.9. ist `check:e2e-flake` hart. Wurzel `leser-r1-r2` S8 ist behoben (PR #929, Test-Fehler: Signatur zählte `display:none`). Offen: `e2e/rechtsprechung.e2e.ts:123` («Weitere anzeigen» lud 200 statt >339) und `e2e/uinav-j-rechtsprechung.e2e.ts:75` (201 statt 200 Links) — beide am 19.9. nur im Retry grün, Nachlade-Familie; Ausnahme `w224-reiterverhalten.e2e.ts` (Verfall 8.10.2026) ohne Wurzel-Messung. Unter der Queue wirft ein harter Flake den Eintrag und lässt Nachfolger neu bauen. Detail: FAHRPLAN-OFFENE-BEFUNDE §4.
  - [ ] **`scripts/ci/diff-klassieren.ts`: Kopf-Kommentar behauptet einen Aufrufer, den es nicht gibt** *(§5-Nebenfund 19.9.2026)* — `ci.yml` ruft die Funktion nicht auf, sondern trägt eine wortgleiche Shell-Fassung. Kommentar richtigstellen oder Doppelpflege beenden (§5).

---

## Geparkt (bis ≥1.12.2026 / Nutzerfeedback / Markt)

- **Dossier / Fall-Rückgrat** *(FALL-RUECKGRAT, G3.3)* — Mandats-/Dossierverwaltung & «Meine
  Fristen». Vorerst draussen; alle Werkzeuge bleiben stateless. Umfasst auch das nie gebaute
  schlanke URL-Kontext-Rückgrat (PRODUKTAUSBAU P2) samt Bau-Auflagen — Detail
  `archiv/FAHRPLAN-PRODUKTAUSBAU-BURGGRABEN.md` §P2.
- **Markt-Themen** — Hosting (Infomaniak), Domain `lexmetrik.ch`, Zahlung (Payrexx/Datatrans/TWINT),
  Login/Pro.
- **Live-Rechtsprechung** — §4-blockiert (s. Verifikations-Blockaden).
- **Rules-as-Code-Sprachen (Catala, OpenFisca)** — als Sprache/Engine nicht übernommen (OCaml-Kette, 5-MB-Bundle §15, AGPL); Wiedervorlage nur, wenn Catala ein natives JS/TS-Backend erhält. Muster sind in `W3-TARIF-STAND`/`QS-CODE-PROP` verankert. Quelle: Rules-as-Code-Sichtung 5.9.2026 §5.
- **Browser-Erweiterung «Schweizer Normzitate überall verlinken» + offener MCP-Server auf den Korpus** — Produktentscheide, **wartet auf David** (Markt-Beleg iusLink CHF 59/Mt.). Quelle: Fremdquellen-Sichtung 2.9.2026 §2.
- **Betriebs-Instrumente (später):** Sentry (erst bei Traffic) · CodeQL · Claude-Code-PR-Action —
  Detail + Verworfen-Liste: `BACKLOG-AUDIT-WERKZEUGE-2026-07.md`.
- **L-3 (Auto-Default-Umkehr ZGB/OR)** — hinter David/Council-Gate, nicht gebaut; L-1/L-2 gebaut,
  L-4 entfällt (Chronik). V2 §2 F4.
- **Abnahme-Warteschlange** (Haftungsrang: 1 Fristen → 2 Form-Gate-Vorlagen → 3 Beträge; aufgereiht,
  nicht gedrängt): BGER-RECHTSWEG (§7) · BEURKUNDUNGS-AUSBAU · NOTARIAT/LUECKEN (`geprüft`) ·
  GESETZESTEXT-POPUP-Snapshots · GRUNDLAGEN G2/B.
- **Offene David-Grundsatzfragen** (gebündelt mitführen): Dienstjahr-Stichtag Kündigungsfrist ·
  Sperrtage-Konvention · 3 Export-Antworten · GebV-SchKG-Promille-Rundung (0.01 vs. amtlich 0.05).

---

## Pflege & Termine  *(Quelle: `bibliothek/register/parameter-verfall.md`)*

- **Anfang Sept.** — Referenzzins (quartalsweise). · **1.11.2026** — BE-Formularpflicht.
  · **Vor SchKG-Abnahme** — GebV-SchKG-Revision AS 2025 630 vs. Staffel 1.1.2022.
  · **Vor Mietvertrags-Abnahme** — VMWG Art. 19a am Original. · **Feiertage** je Kanton vor
  «geprüft» (BJ-Liste Stand 2011).
- **1.1.2027 — Ganz-Aufhebung `PatV` (SR 232.141) und `VGV` (SR 814.621).** Beide sind in
  `scripts/fedlex-cache.sh` gepinnt und werden per 1.1.2027 **vollständig aufgehoben** (amtlich
  angekündigt). Massnahme am Stichtag: Snapshot ersetzen/entfernen, Nachfolgeerlass prüfen (§7/§8)
  — ein ausgeliefertes Gesetz, das es nicht mehr gibt, ist der schwerere Fehler als eine Lücke.
  **Bereits erfolgt:** `BMV` (SR 412.103.1) aufgehoben 1.3.2026 (#287/#422); Nachfolger
  `cc/2025/408` seit 12.9.2026 als eigener Register-Key `BMV_2025` im Korpus (der historische
  Text bleibt unter `BMV`) — Beleg `bibliothek/register/bmv-totalrevision-2026-09-12.md`.

---

## Nachschlagewerke (steuern nicht)

- **Funktions-Katalog** (18 Werkzeuge: Welle · neu/vorhanden · §2 · Quelle · Aufwand) und die
  Kern-Auflagen je Werkzeug stehen wörtlich in
  [FAHRPLAN-GESAMTAUFBAU.md](fahrplaene/FAHRPLAN-GESAMTAUFBAU.md) §1 — Bau-Auflagen, keine Steuerung:
  vor dem Bau des jeweiligen Werkzeugs lesen. Dieselbe Datei ordnet in §2 die offenen Detailpunkte,
  das Infrastruktur-Fundament und das Klein-Backlog.
- **Restpunkte der Archiv-Welle 31.7.2026** (20 `FAHRPLAN-*.md` verify-then-archive) — wörtlich in
  [FAHRPLAN-ARCHIV-RESTPUNKTE.md](fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md), je Strang ein § (§1–§20).
- **Token-Ökonomie-Fundament** (Baseline, Steuer-Doku-Diät, Dispatch/Prozess, Werkzeuge/Output,
  Code-Struktur) — wörtlich in [`archiv/fahrplaene/FAHRPLAN-TOKEN-OEKONOMIE.md`](archiv/fahrplaene/FAHRPLAN-TOKEN-OEKONOMIE.md);
  am 29.8.2026 ins Archiv gezogen, weil kein offener Schritt mehr darauf zeigt — der laufende
  Auftrag ist `QS-EFFIZIENZ`.
- **Etikett-System (`@meta`/`@queue`/`@blockers`) und Tor-Regeln** —
  [FAHRPLAN-PLAN-STEUERUNG.md](fahrplaene/FAHRPLAN-PLAN-STEUERUNG.md).
