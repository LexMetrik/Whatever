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
3. **Markiere erledigt** (`plan:set … status=done`) — im PR, der den Schritt abschliesst.
   Push/PR/Auto-Merge stehend freigegeben (§9: Merge nach `main` = Deploy; Sorgfalt VOR dem Merge).
   Commit-Trailer immer `Roadmap: <@meta id>`.
4. **Nur was steuert, bleibt hier.** Ein Nebenfund/Unterposten ist eine eigene Datei
   (`npm run plan:posten -- neu --dach <ID> --titel "…"`, erzwungen von `check:plan` 16),
   Erledigt-Prosa wandert wörtlich in die [`ROADMAP-CHRONIK.md`](ROADMAP-CHRONIK.md), Detail-WIE in
   den verlinkten Fahrplan; je Streichung eine Begründungszeile in der Chronik.
   Grössen-Wächter: `struktur-rotieren.py --check`.

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
richter-analytik-gate: Richter-/Spruchkörper-Analytik (W3·15-RICHTER). GRENZE (20.7.2026): Filtern/Facette/Verlinkung sind FREI und gebaut (#309/#311); gesperrt bleiben allein RANKING und PROGNOSE. Nur deskriptiv; bewusste Freigabe Davids erforderlich (heikel: Standesrecht, Persönlichkeitsschutz, richterliche Unabhängigkeit). **Bestätigt 22.9.2026** (David: «bleibt gesperrt») — nicht erneut fragen.
zielbild-gesetzesleser: Zurückgestellt durch das Zielbild-Dekret 1.9.2026 (Gesetzesleser zuerst) — wieder öffnen, sobald die Phasen 1–2 gelandet sind oder David einen Schritt ausdrücklich vorzieht (FINMA: vorziehen, wenn ein externer Termin drängt). Kein Bau-Blocker, reine Reihenfolge-Entscheidung.
david-go-entstehung: ERTEILT — Go David 11.9.2026 («führe alles durch»); die drei W2·6c-ENTSTEHUNG-*-Schritte stehen auf `status: ready`, Blocker entfernt. Design freigegeben 6.9.2026; §11.9 der Materialien-Spec bucht die Entscheide 1–6 als entschieden 11.9.2026 (Mandat), Nr. 7 (fachliche Abnahme) bleibt bei David.
david-bs-lizenz-schluessel: R12a — David klärt Lizenz LexWork-versions-Endpunkt + fragt amtlichen Schlüssel Erlass↔Geschäft bei BS an (Vormessung 12.9.2026). **Recherche 22.9.2026 (R2): Anfrage nur noch OPTIONAL.** Lizenz weitgehend geklärt ohne Anfrage — data.bs.ch 100354 (Zentraler Rechtsdienst) ist CC BY 4.0 und verlinkt dieselben Fassungs-IDs; opendata.swiss führt die Sammlung unter `terms_open`; URG Art. 5 Abs. 1 lit. a/Abs. 2 erfasst Erlasse UND amtliche Sammlungen (nicht nur Bund). REST für eine Anfrage: Fussnoten und Änderungstabellen fehlen im CC-BY-Text (2/2 Stichproben) und liegen damit ausserhalb der erklärten Lizenz; der Endpunkt ist undokumentiert (Stabilität/Abrufrate). Schlüssel TEILWEISE vorhanden: die Ratschlagsnummer steht im Ingress der amtlichen Änderungsdokumente (3/3), identisch mit `signatur_dok` in 100313 (4/4) — nur über PDF-Fliesstext, Risikopfad. Beleg: bibliothek/recherche/legal-design-und-korrektheits-recherche-2026-09-21.md Ziff. 19. Blocker BLEIBT — ob er fällt, entscheidet David.
david-design-entscheide: ENTSCHIEDEN — David 22.9.2026 (Chat): (1) Seitenleiste-Aufbau bleibt wie im Produkt; (2) Startseite vier Kacheln, Zahl aus dem generierten Zähler; (3) Farbe als Fläche JA (F0.2 und `check:farbwelt` im Tokens-Schritt ändern). `W2·29-WERKBANK-TOKENS` steht auf `ready`, Blocker entfernt; Wortlaut in FAHRPLAN-WERKBANK-UMBAU.md §4.
-->

<!-- @david-fragen
-->
<!-- ^ Offene Fragen an David OHNE eigenen blockierten Schritt (sonst gehören sie in @blockers).
     Das Lagebild liest diesen Block mechanisch (davidFragen, scripts/plan/bildDaten.ts) —
     beantwortete Fragen HIER löschen, dann verschwinden sie von der Seite (§5). -->

<!-- @queue: W2·27-BUND-FERTIG, W2·5l-NORMTEXT-B2, QS-KORPUS, W2·20-VERWEIS-SCHAERFE, W2·22-VERWEIS-FEDLEX -->
<!-- ^ SSoT der Bau-Reihenfolge: plan:next wertet die @queue VOR der Dokumentreihenfolge aus;
     Integrität erzwingt check:plan Regel 8. Priorität ändern = NUR diese Zeile ändern.
     Ohne Queue-Eintrag entscheidet die Dokumentreihenfolge — Produkt-Felder stehen darum
     vor `Betrieb & Prüfstrasse`.
     Die Queue trägt nur die nächsten 3–5 Schritte (Entscheid David 20.9.2026, Messung:
     11 von 22 Einträgen 90 Tage unberührt, nur 21 % der Bau-Trailer zeigten auf die Queue);
     nachfüllen, wenn der Kopf erledigt ist. Der gestrichene Schwanz steht im Wortlaut in
     ROADMAP-CHRONIK.md (Umschichtung 20.9.2026). -->

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

- [ ] **Werkbank-Umbau Schritt 2: der Gesetzes-Leser** *(`W2·29-WERKBANK-LESER`, Go David 22.9.2026)*
  <!-- @meta id: W2·29-WERKBANK-LESER · status: ready · blocker: null · dep: [W2·29-WERKBANK-TOKENS] · feld: leser · fahrplan: fahrplaene/FAHRPLAN-WERKBANK-UMBAU.md -->
  Ziel: die Leser-Hülle auf die Werkbank umziehen — grösster Korpus, darum zuerst. Abnahmeliste
  ist Abschnitt 2 des Funktions-Inventars (jede Fläche, jedes Feld, jeder Zustand). Grenzen:
  **Normtext-Körper golden byte-gleich**, Rechen-/Datenlogik unangetastet, alte Komponente fällt
  im selben PR, e2e-Selektoren ziehen mit; drei Sessions, sonst zurückstellen.
  **Detail:** [FAHRPLAN-WERKBANK-UMBAU.md](fahrplaene/FAHRPLAN-WERKBANK-UMBAU.md) §5, Scheiben §5a (S0–S5, S6 Erlass-Blatt).

- [ ] **Kantonale Gesetze — Darstellung & Suche** *(`W2·13-KANTONE`, Auftrag David 12.7.2026, `[OF]`; Phase 2, Entscheid 14.9.2026)*
  <!-- @meta id: W2·13-KANTONE · status: ready · blocker: null · dep: [] · feld: leser · fahrplan: fahrplaene/FAHRPLAN-KANTONE.md -->
  Hier die NICHT-Risiko-Einheiten (reine Darstellung/Suche/Anzeige); Extraktion & Daten liegen in
  `W2·13-KANTONE-DATEN`. **Fertig, wenn** K-1 bis K-11 abgehakt sind.
  **Detail:** [FAHRPLAN-KANTONE.md](fahrplaene/FAHRPLAN-KANTONE.md) §2.
  **Offene Unterpunkte im Wortlaut** (verlagert 20.9.2026, Entscheid David): Fahrplan §2, Abschnitt «Restposten aus ROADMAP.md» A.

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

- [x] **Treffer-Landkarte: wo im Dokument liegen die Treffer** *(`W2·28-TREFFER-LANDKARTE`, David 18.9.2026; reine UI)*
  <!-- @meta id: W2·28-TREFFER-LANDKARTE · status: done · blocker: null · dep: [] · feld: leser · fahrplan: fahrplaene/FAHRPLAN-RECHERCHE-KOMFORT.md -->
  Streifen neben dem Scrollbalken mit einer Marke je Suchtreffer (Gesetz + Entscheid), Klick springt; dieselbe Trefferquelle wie die Hervorhebung (§5).
  **Detail:** [FAHRPLAN-RECHERCHE-KOMFORT.md](fahrplaene/FAHRPLAN-RECHERCHE-KOMFORT.md) §1.

- [ ] **Verzahnung sichtbar machen** *(`W2·7-VZUI`, David-Auftrag 3.7.2026; reine UI auf vorhandenen Daten)*
  <!-- @meta id: W2·7-VZUI · status: ready · blocker: null · dep: [] · feld: leser · fahrplan: fahrplaene/FAHRPLAN-VERZAHNUNG-UI.md -->
  EINE Interaktions-Grammatik für die Verzahnung, ohne neue Rechtsregel (§3). Offen: V2 (E3-Serving)
  und V3 (E6a) — an den Datenstrang gekoppelt. Fertig-Kriterium (Panel-Reiter fachlich sauber
  geschnitten) ✅ erfüllt 31.8.2026 — Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (2).
  **Detail:** [FAHRPLAN-VERZAHNUNG-UI.md](fahrplaene/FAHRPLAN-VERZAHNUNG-UI.md) §11.

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

- [ ] **Norm-Zeitmaschine + Fassungs-Diff** *(`W2·5g-ZEIT`, Ideen-Intake 20.7.2026; Phase 3 — FR/IT-Datenanteil gehört hierher, Entscheid David 14.9.2026 «fr/it später», FAHRPLAN-BUND-FERTIG §4 a)*
  <!-- @meta id: W2·5g-ZEIT · status: ready · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-GESETZESDARSTELLUNG-V2.md -->
  «Art. X, wie er am Tag Y galt» + visueller Diff zweier Konsolidierungen; harte Bau-Reihenfolge
  (a) POC → (b) AKN-XML Phase 1 + `G-HIST` → (c) Bau.
  **Detail:** [FAHRPLAN-GESETZESDARSTELLUNG-V2.md](fahrplaene/FAHRPLAN-GESETZESDARSTELLUNG-V2.md) §8.

- [ ] **Phase 1 · Bund fertig machen — Sollbild und Struktur-Schluss** *(`W2·27-BUND-FERTIG`, Entscheid David 14.9.2026)*
  <!-- @meta id: W2·27-BUND-FERTIG · status: ready · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-BUND-FERTIG.md -->
  Dach der Phase 1: einmal niederschreiben, **was ein Gesetz bei LexMetrik ist**, und es am Bund
  einlösen — Sollbild, Datenstruktur schliessen, Leser schärfen, dann alle Bundeserlasse. Der
  Schritt trägt selbst nur die Struktur-Posten ohne eigenen Schritt; die übrigen Phase-1-Einheiten
  sind bestehende Schritte (`W2·5l-NORMTEXT-B2` … `W2·5n-BUND-VOLL`), ihre Reihenfolge steht in der
  `@queue`. **Fertig, wenn** ein Schweizer Jurist jedes Bundesgesetz vollständig, strukturgleich und
  schneller als auf Fedlex liest.
  **Detail:** [FAHRPLAN-BUND-FERTIG.md](fahrplaene/FAHRPLAN-BUND-FERTIG.md) §3.

- [ ] **Schlusstitel/UeB/Anhänge (M13) + wortgenaue Fussnoten (M14)** *(`W2·5l-NORMTEXT-B2`)*
  <!-- @meta id: W2·5l-NORMTEXT-B2 · status: ready · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-NORMTEXT-DARSTELLUNG.md -->
  **Golden-Re-Bless erwartet** (additiv). Tragende Falle: Token-Kollision `disp_u1`/`art_1` — ohne
  eigenen id-Raum stiller Daten-Verlust.
  **Detail:** [FAHRPLAN-NORMTEXT-DARSTELLUNG.md](fahrplaene/FAHRPLAN-NORMTEXT-DARSTELLUNG.md) §M13/§M14
  (§-Sigel nachgezogen 30.8.2026 — Regel 11 bindet).
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
  **Offene Unterpunkte im Wortlaut** (verlagert 20.9.2026, Entscheid David): Fahrplan §2, Abschnitt «Restposten aus ROADMAP.md» B. Hier bleiben nur die David-gebundenen Posten.

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
  **Offene Befundliste im Wortlaut** (verlagert 20.9.2026, Entscheid David): Fahrplan §1, Abschnitt «Restposten aus ROADMAP.md». Jede Zeile liegt auf dem Risikopfad ⇒ Gegenprüfung Pflicht, amtlicher Beleg mit Norm + Link + Stand (§7), Korrektur nie in der Projektion (§5).

- [ ] **`fza`/`cmr` NICHT-KANONISCH klären und kanonisch nachführen** *(`QS-CURRENCY-KANON`)*
  **Nachtrag 4.9.2026 (Gegenprüfung PR #658):** `check:fedlex-versionen` rot mit geänderter Menge — `dbg` überholt (Pin 2026-01-01, geltend 2026-09-02), `fmg` + `fdv` nicht-kanonisch; FMG-Snapshot nach Re-Pin regenerieren (liegt unter den 43 von #658).
  <!-- @meta id: QS-CURRENCY-KANON · status: ready · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-FEDLEX-PORTFOLIO.md -->
  Bestandsdefekt auf `main`; erst Ursache klären, dann re-pinnen + regenerieren + §7-Verifikation.
  **Nullprobe zuerst** — `fedlex-cache.sh:368` pinnt `fza` bereits auf html-9, der Befund vom 2.8.
  könnte dafür erledigt sein. **Detail:** [FAHRPLAN-FEDLEX-PORTFOLIO.md](fahrplaene/FAHRPLAN-FEDLEX-PORTFOLIO.md) §17.

- [ ] **FR/IT-Drift-Wächter Stufe 2** *(`QS-FRIT-DRIFT`, Stufe 1 gebaut 15.8.2026)*
  <!-- @meta id: QS-FRIT-DRIFT · status: ready · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-FEDLEX-PORTFOLIO.md -->
  Erstlauf-Befund: OR, PatG und BewG weichen in fr/it real ab ⇒ **`eId` trägt nicht sprachübergreifend**.
  Dossier: [frit-drift-2026-08-15.md](bibliothek/register/frit-drift-2026-08-15.md).
  **Detail:** [FAHRPLAN-FEDLEX-PORTFOLIO.md](fahrplaene/FAHRPLAN-FEDLEX-PORTFOLIO.md) §18.1.

- [ ] **Normen-Monitor seit ≥5 Wochen rot — Wurzel-Fix** *(`QS-MONITOR-ROT`, Aktivierungs-Audit 14.8.2026)*
  <!-- @meta id: QS-MONITOR-ROT · status: ready · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md -->
  Rechtsstand-relevant: `normen-monitor.yml` 5/5 Läufe failure. Diagnose 14.8. — **das Rot ist ECHT**,
  der Monitor korrekt. **Detail:** [FAHRPLAN-OFFENE-BEFUNDE.md](fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md) §2.
  Befund- und Beleg-Historie: ebenda, Abschnitt «Restposten aus ROADMAP.md» *(verlagert 20.9.2026, Nachzug)*.

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

- [ ] **Spruchkörper-Analytik** *(`W3·15-RICHTER`, bewusst freigabe-pflichtig)*
  <!-- @meta id: W3·15-RICHTER · status: blocked · blocker: richter-analytik-gate · dep: [] · feld: rechtsprechung · fahrplan: fahrplaene/FAHRPLAN-RECHTSPRECHUNG.md -->
  Ausschliesslich deskriptive Spruchkörper-Muster; **keine Erfolgsquoten, keine Prognose über
  Personen** (§2/§8).
  **Detail:** [FAHRPLAN-RECHTSPRECHUNG.md](fahrplaene/FAHRPLAN-RECHTSPRECHUNG.md) §14.

**Ideen ohne Plan-Platz** *(kein `@meta`, kein Bau-Anspruch — §17-Gegengewicht: der Plan bildet
Kapazität ab, nicht Absicht; Begründung im Wortlaut: [ROADMAP-CHRONIK.md](ROADMAP-CHRONIK.md),
Umschichtung 20.9.2026 (2)):*

- Kantonaler Norm-Resolver → Kantonalnorm-Buckets (vormals `W2·6-RESOLVER`) — Spec lebt in
  [FAHRPLAN-RECHTSPRECHUNG.md](fahrplaene/FAHRPLAN-RECHTSPRECHUNG.md) §13 und
  [FAHRPLAN-ENTSCHEIDSUCHE-AUSBAU.md](fahrplaene/FAHRPLAN-ENTSCHEIDSUCHE-AUSBAU.md) §8.
- Sachgebiet-Facette an der Norm↔Entscheid-Kante (vormals `W2·7-VZUI-SACHGEBIET`) — Spec lebt in
  [FAHRPLAN-VERZAHNUNG-UI.md](fahrplaene/FAHRPLAN-VERZAHNUNG-UI.md) §12.

---

## Suche & Datenhaltung  *(`feld: suche`)*

- [ ] **Datenhaltung / VPS-Gate** *(`QS-DATA`)*
  <!-- @meta id: QS-DATA · status: blocked · blocker: vps-bestellung-david · dep: [] · feld: suche · fahrplan: fahrplaene/FAHRPLAN-DATENHALTUNG.md -->
  Server-Session (Bestellung nach Phase 2, Entscheid David 14.9.2026; NEUE Session): E3 Etappe 2 = Nachtlauf neue Entscheide (Status «entwurf», Morgenprotokoll, Stille ≠ Erfolg); Vercel bleibt für die Website, Prüfpunkt März 2027.
  Trägt nur das David-Gate: E3-Serving + E4-UI-Panels hängen an einer VPS-Bestellung (~15 Min
  David). Der Datenhaltungs-BAU selbst liegt in `W2·6-DATA`.
  Vorbereitung steht: Bestellanleitung aktualisiert (Dossier Nachtrag 8.9.), Setup-Plan §3 gilt; Runner NICHT auf diesem Host.
  **Detail:** [FAHRPLAN-DATENHALTUNG.md](fahrplaene/FAHRPLAN-DATENHALTUNG.md) §13.

- [ ] **Ingest-Strecke ist in drei Tagen 3× langsamer geworden** *(`QS-DATA-INGEST-DRIFT`, gemessen 17.8.2026)*
  <!-- @meta id: QS-DATA-INGEST-DRIFT · status: ready · blocker: null · dep: [] · feld: suche · fahrplan: fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md -->
  `scripts/datenhaltung/suche.test.ts` reisst dadurch seinen Hook-Deckel. **Nicht der Deckel ist
  falsch, die Basis ist gewandert** (10.85 s → Mittel 31.4 s, Nullprobe-belegt auf `main`).
  **Wurzel-Fix, nicht Deckel-Anhebung (§17):** erst klären, WARUM die Strecke 3× teurer wurde.
  **Detail:** [FAHRPLAN-OFFENE-BEFUNDE.md](fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md) §3.

- **Idee (ohne `@meta`, über der Plan-Kapazität):** DE/FR/IT-Stemming in der Korpus-Suche (`multilingual-stemmer`, MIT, Wasm, zero deps) plus TERMDAT-Synonyme — nur mit Messung gegen `suche-eval-gold`, TERMDAT erst nach Lizenzklärung. Quelle: Fremdnutzen-Suchrunde 2 (6.9.2026) §2 #1/#6.

---

## Design & Oberfläche  *(`feld: design`)*

- [x] **Werkbank-Umbau Schritt 1: eine Token-Quelle** *(`W2·29-WERKBANK-TOKENS`, Go David 22.9.2026)*
  <!-- @meta id: W2·29-WERKBANK-TOKENS · status: done · blocker: null · dep: [W2·29-WERKBANK-TOR] · feld: design · fahrplan: fahrplaene/FAHRPLAN-WERKBANK-UMBAU.md -->
  Ziel: `tokens.json` des Design-Systems als **einzige** Quelle im Repo; generiert werden daraus
  die `:root`/`html.dark`-Blöcke und die Farb-/Typo-Teile von `tailwind.config.js`, die fünf
  Reglemente werden auf eines konsolidiert (§5). Grenzen: Kontrast-Tore grün, Normtext-Körper
  farbfrei, Golden byte-gleich, **Startseite unberührt** (V4 Werkbank live seit 5.9.2026).
  **Detail:** [FAHRPLAN-WERKBANK-UMBAU.md](fahrplaene/FAHRPLAN-WERKBANK-UMBAU.md) §4.

- [x] **Werkbank-Umbau Schritt 0b: vierte Sediment-Gattung — ungenutzte Exporte** *(`W2·29-WERKBANK-EXPORTE`, Go David 22.9.2026 «einverstanden zu allem»)*
  <!-- @meta id: W2·29-WERKBANK-EXPORTE · status: done · blocker: null · dep: [W2·29-WERKBANK-TOR] · feld: betrieb · fahrplan: fahrplaene/FAHRPLAN-WERKBANK-UMBAU.md -->
  Ziel: `check:sediment` (d) — exportierte Funktionen und Typen ohne Importer (knip liefert sie
  schon: gemessen 22.9.2026 84 Exporte + 43 Typen). Geburtsbeweis rot, dann alle Funde im
  selben PR beseitigt (Export entfernen oder Code löschen), Tor grün; keine Baseline.
  Grenzen: Rechtslogik unberührt, Golden byte-gleich, `src/lib/**` nur Export-Schlüsselwort.
  **Detail:** [FAHRPLAN-WERKBANK-UMBAU.md](fahrplaene/FAHRPLAN-WERKBANK-UMBAU.md) §3 (Nachtrag d).

- [ ] **Tore-Diät: 92 Wachen auf Wirksamkeit messen** *(`QS-TORE-DIAET`, Go David 22.9.2026)*
  <!-- @meta id: QS-TORE-DIAET · status: ready · blocker: null · dep: [W2·29-WERKBANK-REST] · feld: betrieb · fahrplan: null -->
  Ziel: jedes `check:*`-Tor (22.9.2026: 92, davon 22 unter `scripts/check-*.ts` = 218 KB)
  gegen `npm run tor:bewaehrung -- --import-ci` messen: hat es in 60 Tagen je etwas gefangen?
  Unwirksame und doppelte Prädikate (z. B. `check:be-sprengel`, laut `check-tor-paritaet.ts`
  «prüft nichts Zusätzliches») streichen; Flächen-Deckel danach auf Ist + 5 % senken.
  Grenzen: Rechtsdaten-Tore (§7-Prüftiefe) sind vom Rückbau ausgenommen; jede Streichung mit
  Messwert im Commit. Anlass: Deckel zweimal gerissen in #979 (0,2 KB Luft).

- [ ] **Doku-Diät: Fahrpläne und Belege** *(`QS-DOKU-DIAET`, Go David 22.9.2026)*
  <!-- @meta id: QS-DOKU-DIAET · status: ready · blocker: null · dep: [W2·29-WERKBANK-REST] · feld: betrieb · fahrplan: null -->
  Ziel: (a) die 36 aktiven Fahrpläne gegen «hat der Schritt in 30 Tagen einen Commit gesehen?»
  prüfen, Rest nach `archiv/` (Steuer-Deckel 22.9.2026: 1 268 von 1 290 KB, +389 KB seit
  15.8.); (b) datierte Belege, die kein Werkzeug liest und kein Skill als Pflichtlektüre nennt
  (`abnahme/**`, `docs/ui-befunde-2026-07/**`, Audit-Tabellen), in den Obsidian-Vault
  `03_Projekte/LexMetrik/archiv-belege/` auslagern (Weisung David 22.9.2026 «nach Obsidian
  auslagern, soweit sinnvoll»; erster Fall: 549 UX-Audit-Screenshots, 130 MB, PR dieser Zeile).
  Grenzen: `bibliothek/` (Tor `check:bibliothek`) und Norm-Belege bleiben im Repo.

- [x] **Werkbank-Umbau Schritt 3: die vier Kataloge** *(`W2·29-WERKBANK-KATALOGE`, Go David 22.9.2026)*
  <!-- @meta id: W2·29-WERKBANK-KATALOGE · status: done · blocker: null · dep: [] · feld: design · fahrplan: fahrplaene/FAHRPLAN-WERKBANK-UMBAU.md -->
  Ziel: Gesetze-, Rechtsprechungs-, Rechner- und Vorlagen-Katalog samt Suche, Abdeckung und
  Einstellungen auf die Werkbank umziehen; Abnahmeliste sind die Inventar-Abschnitte 2.2/3.2/4.2/5.2.
  Seit 23.9.2026 auch die Startseite (1.2, vier Kacheln) und parallel zu LESER (Entscheid David).
  Grenzen: Status-Modell bleibt sichtbar (§8), Löschpflicht im selben PR, Löschbilanz ≥ 50 %.
  **Detail:** [FAHRPLAN-WERKBANK-UMBAU.md](fahrplaene/FAHRPLAN-WERKBANK-UMBAU.md) §5.

- [x] **Werkbank-Umbau: Grundton — Werkbank-Hintergrund und Rundungen für alle Seiten** *(`W2·29-WERKBANK-GRUNDTON`, David 23.9.2026)*
  <!-- @meta id: W2·29-WERKBANK-GRUNDTON · status: done · blocker: null · dep: [] · feld: design · fahrplan: fahrplaene/FAHRPLAN-WERKBANK-UMBAU.md -->
  Ziel: Grundregel des Umbaus in `design/tokens.json` — Hintergrund wie Werkbank, Radius-Skala.
  Grenzen: Kontrast-Tore grün, Normtext gerade, Golden byte-gleich.
  **Detail:** [FAHRPLAN-WERKBANK-UMBAU.md](fahrplaene/FAHRPLAN-WERKBANK-UMBAU.md) §5d.

- [x] **Werkbank-Umbau: neue Startseite mit aufklappenden Kacheln** *(`W2·29-WERKBANK-START`, Prototyp + Go David 23.9.2026)*
  <!-- @meta id: W2·29-WERKBANK-START · status: done · blocker: null · dep: [W2·29-WERKBANK-GRUNDTON] · feld: design · fahrplan: fahrplaene/FAHRPLAN-WERKBANK-UMBAU.md -->
  Ziel: vier Kacheln, die vor Ort aufklappen und bis zum Erlass bzw. Werkzeug führen.
  Grenzen: Zahlen nur aus dem Zähler (§8), Suchdaten erst beim Öffnen (§15), Löschpflicht.
  **Detail:** [FAHRPLAN-WERKBANK-UMBAU.md](fahrplaene/FAHRPLAN-WERKBANK-UMBAU.md) §5d.

- [x] **Werkbank-Umbau: Startseite Feinschliff — Aufklappen ruhig, nichts abgeschnitten** *(`W2·29-WERKBANK-START-FEINSCHLIFF`, David 24.9.2026)*
  <!-- @meta id: W2·29-WERKBANK-START-FEINSCHLIFF · status: done · blocker: null · dep: [W2·29-WERKBANK-START] · feld: design · fahrplan: fahrplaene/FAHRPLAN-WERKBANK-UMBAU.md -->
  Ziel: alle Blätter und Stufen bei 1280–360 px hell/dunkel messen, Kappungen und Bedienmängel beheben.
  Grenzen: Entscheide 23.9. bleiben; R8-Tor deckt offene Blätter ab.
  **Detail:** [FAHRPLAN-WERKBANK-UMBAU.md](fahrplaene/FAHRPLAN-WERKBANK-UMBAU.md) §5d.

- [x] **Werkbank-Umbau: Startseite neu gegliedert — Kacheln füllen die Fläche** *(`W2·29-WERKBANK-START-LAYOUT`, David 24.9.2026)*
  <!-- @meta id: W2·29-WERKBANK-START-LAYOUT · status: done · blocker: null · dep: [W2·29-WERKBANK-START-FEINSCHLIFF] · feld: design · fahrplan: fahrplaene/FAHRPLAN-WERKBANK-UMBAU.md -->
  Ziel: Entscheid-Liste weg, rechte Spalte als zwei eigene Flächen, Kachelfeld bündig mit dem Schnellwerkzeug.
  **Detail:** [FAHRPLAN-WERKBANK-UMBAU.md](fahrplaene/FAHRPLAN-WERKBANK-UMBAU.md) §5d.

- [x] **Werkbank-Umbau: Startseite überarbeitet — Gesetze-Blatt, Schnellwerkzeug-Wahl, Begrüssung** *(`W2·29-WERKBANK-START-UEBERARBEITUNG`, David 24.9.2026)*
  <!-- @meta id: W2·29-WERKBANK-START-UEBERARBEITUNG · status: done · blocker: null · dep: [W2·29-WERKBANK-START-LAYOUT] · feld: design · fahrplan: fahrplaene/FAHRPLAN-WERKBANK-UMBAU.md -->
  Ziel: Gesetze-Blatt ohne Leerfläche, Schnellwerkzeug wählbar, nur höfliche Begrüssungen, «Häufig gebraucht» unter den Kacheln.
  **Detail:** [FAHRPLAN-WERKBANK-UMBAU.md](fahrplaene/FAHRPLAN-WERKBANK-UMBAU.md) §5d-bis.

- [ ] **Werkbank-Umbau Schritt 6: Rest und Rückbau** *(`W2·29-WERKBANK-REST`, Go David 22.9.2026)*
  <!-- @meta id: W2·29-WERKBANK-REST · status: ready · blocker: null · dep: [W2·29-WERKBANK-RECHNER] · feld: design · fahrplan: fahrplaene/FAHRPLAN-WERKBANK-UMBAU.md -->
  Ziel: Entscheid-Leser, Materialien, statische Seiten, mobile Breite und Druckansicht umziehen —
  und die letzten Alt-Stylesheet-Reste samt abgelösten Reglementen und Fahrplänen löschen.
  Grenzen: `check:sediment` grün ohne Ausnahme; datierte Belege (`abnahme/**`) bleiben.
  **Detail:** [FAHRPLAN-WERKBANK-UMBAU.md](fahrplaene/FAHRPLAN-WERKBANK-UMBAU.md) §5f (Scheiben S0–S5) + §7.

- [ ] **Werkbank-Umbau Nachlauf: Design-Feinpaket und Leser-Nachlauf** *(`W2·29-WERKBANK-NACHLAUF`, Entscheid David 24.9.2026)*
  <!-- @meta id: W2·29-WERKBANK-NACHLAUF · status: ready · blocker: null · dep: [W2·29-WERKBANK-REST, W2·29-WERKBANK-LESER] · feld: design · fahrplan: fahrplaene/FAHRPLAN-WERKBANK-UMBAU.md -->
  Ziel: N1 Dunkel-Paket, Mono-Diät, Motiv-Katalog, 14-px-Radius der Flächen, CSS-Querschnitt; N2 was
  LESER bewusst umgebucht hat (NormText schneiden, NormChip-Ort, Akkordeon, E3 u. a.). Aus REST gelöst,
  damit REST im Abbruchkriterium bleibt (§2 Ziff. 4). **Detail:** [FAHRPLAN-WERKBANK-UMBAU.md](fahrplaene/FAHRPLAN-WERKBANK-UMBAU.md) §5f.

- [ ] **Design-Konsistenz: gleiche Dinge gleich darstellen** *(`W2·19-DESIGN-KONSISTENZ`, Auftrag David 31.8.2026)*
  <!-- @meta id: W2·19-DESIGN-KONSISTENZ · status: ready · blocker: null · dep: [] · feld: design · fahrplan: fahrplaene/FAHRPLAN-DESIGN-KONSISTENZ.md -->
  Dieselbe Inhaltsklasse site-weit im selben Muster (Split-View vs. Vollansicht, Leser-Köpfe,
  Chips, Leerzustände …); Massstab ist das Reglement, Vereinheitlichung über geteilte Bausteine
  (§5/§10), Normtext-Körper farbfrei/golden. Methode: Finder-Wellen → umsetzen → **run till dry**
  (Mandat David 31.8.2026, Befunde direkt umsetzen).
  **Detail:** [FAHRPLAN-DESIGN-KONSISTENZ.md](fahrplaene/FAHRPLAN-DESIGN-KONSISTENZ.md) §1.
  **Wird durch `W2·29-WERKBANK-*` abgelöst** — die Posten dort je Rubrik abarbeiten (Fahrplan
  Werkbank-Umbau §7); bis dahin unverändert baubar.

- [ ] **Design-Identität: offene Nachzüge nach der Landung** *(`W2·24-C`, herausgelöst 20.9.2026 aus dem `done`-Kopf `W2·24-DESIGN-IDENTITAET`)*
  <!-- @meta id: W2·24-C · status: ready · blocker: null · dep: [] · feld: design · fahrplan: fahrplaene/FAHRPLAN-DESIGN-IDENTITAET.md -->
  Die vier offenen UI-Nachzüge der Handschrift «Sammlung» — reine Darstellungsschicht (§13), kein
  Risikopfad; Normtext-Körper farbfrei, golden byte-gleich (§6). Der erledigte Kopf samt Prosa und
  den erledigten Unterposten steht in [ROADMAP-CHRONIK.md](ROADMAP-CHRONIK.md), Umschichtung
  2026-09-20 (2) — dort auch die Begründung der Herauslösung.
  **Detail:** [FAHRPLAN-DESIGN-IDENTITAET.md](fahrplaene/FAHRPLAN-DESIGN-IDENTITAET.md) §8.
  **Wird durch `W2·29-WERKBANK-KATALOGE`/`-REST` abgelöst** — Posten dort abarbeiten (§7).

- [ ] **Leser-Kopf: Rest-CLS und Mount-Messung** *(`W2·24-PERF-REST`, herausgelöst 20.9.2026 aus dem `done`-Kopf `W2·24-DESIGN-IDENTITAET`)*
  <!-- @meta id: W2·24-PERF-REST · status: ready · blocker: null · dep: [] · feld: design · fahrplan: fahrplaene/FAHRPLAN-DESIGN-IDENTITAET.md -->
  Die zwei offenen §15-Posten der Handschrift: der letzte CLS-Sprung im Leser-Kopf und die
  ausstehende Mount-Messung auf langsamem Netz. Messung vor Fix; jede Massnahme trägt eine
  Logikverlust-Bewertung (§15), bei Konflikt gewinnt die Treue.
  **Detail:** [FAHRPLAN-DESIGN-IDENTITAET.md](fahrplaene/FAHRPLAN-DESIGN-IDENTITAET.md) §8.

- [ ] **UI-Befundliste extern (210 Befunde, Cowork 29.7.2026)** *(`W2·17-UI-BEFUNDE`)*
  <!-- @meta id: W2·17-UI-BEFUNDE · status: ready · blocker: null · dep: [] · feld: design · fahrplan: fahrplaene/FAHRPLAN-UI-BEFUNDE.md -->
  Externe Sichtprüfung, geschnitten nach Bauteil; alles reine Darstellungsschicht, Blocker zuerst.
  **Detail:** [FAHRPLAN-UI-BEFUNDE.md](fahrplaene/FAHRPLAN-UI-BEFUNDE.md) §24.
  **Gegenstand ist die alte Hülle** — je Rubrik durch `W2·29-WERKBANK-*` abgelöst; Befunde dort
  abhaken oder als gegenstandslos in die Chronik (Fahrplan Werkbank-Umbau §7).
  - [ ] **B8 · Menüinhalt, Zustandsanzeige, Scrollbereiche (K-03 + K-07)** — 10 Befunde (Blocker 1 · Hoch 3). §9. · **Blocker LM-061 vorgemessen 30.8.2026, wartet auf David:** News-Reihe verbirgt 2'588 px ohne Affordanz — der Bau würde den Entscheid D11 («angeschnittene Karte IST die Affordanz») revidieren. Messung + Bauform-Vorschlag im Fahrplan.
  - [ ] **B11 · Karten (K-04)** — 12/13, Rest LM-032 zurückgestellt. §12. · **B12 · Eingabe-/Auswahlfelder (K-08a)** — 9/11, Reste LM-066/LM-075 zurückgestellt (dokumentierte Entscheide). §13. *(Stand 13.9.2026)*
  - [ ] **B13 · Zahlen-, Datums-, Zählformate (K-11)** — 8/12, Reste LM-109/110/114/117 zurückgestellt. §14. · **B14 · Brotkrume/Kopfzeilen (K-19a)** — 4/8, Reste LM-183/184/197/198 zurückgestellt. §15. *(Stand 13.9.2026)*
  - [ ] **B17 · Schaltflächen (K-09a)** — 7/8, Rest LM-087 an Gate-Verschärfung gebunden. §18. · **B18 · Listen/Suche/Relevanz (K-19b)** — 8/8 ✅. §19. · **B19 · Felder Detail (K-08b)** — 6/7, Rest LM-083 zurückgestellt. §20. *(Stand 13.9.2026)*

- [ ] **Davids Alltags-Fehlerfunde** *(`W2·18-FEHLERBUCH`, stehender Sammel-Schritt, Entscheid David 8.8.2026)*
  <!-- @meta id: W2·18-FEHLERBUCH · status: ready · blocker: null · dep: [] · feld: design · fahrplan: fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md -->
  David sammelt Fehler aus der täglichen Nutzung formlos; Fix-Batch-Sessions arbeiten mehrere
  Positionen sortenrein ab. **Risikopfad-Funde gehören NICHT hierher**, sondern in den passenden
  Risiko-Dach-Schritt. Der Schritt bleibt stehen (nie `done`).
  **Detail:** [FAHRPLAN-OFFENE-BEFUNDE.md](fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md) §4 — dort die
  vollständige, wörtlich übernommene Befundliste (33 offene Positionen mit ihren Belegen);
  Such-/Navigations-Posten zusätzlich in [FAHRPLAN-UI-NAVIGATION.md](fahrplaene/FAHRPLAN-UI-NAVIGATION.md) §7.

- [ ] **Oberflächen-Qualität app-weit** *(`QS-UI`, reines UI/Design §13, kontinuierlich)*
  <!-- @meta id: QS-UI · status: ready · blocker: null · dep: [] · feld: design · fahrplan: fahrplaene/FAHRPLAN-UI-QUALITAET.md -->
  Kontinuierlicher Oberflächen-Pass (Fundament → Hierarchie → Politur), kein Einzel-Redesign.
  **Detail:** [FAHRPLAN-UI-QUALITAET.md](fahrplaene/FAHRPLAN-UI-QUALITAET.md) §8.
  **Wird durch `W2·29-WERKBANK-REST` abgelöst** — Posten dort abarbeiten (§7).

- [ ] **Aufräum-Item — zwei Restpunkte** *(`W2·9`)*
  <!-- @meta id: W2·9 · status: ready · blocker: null · dep: [] · feld: design · fahrplan: fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md -->
  (a) A3 Kachel-Höhen (zur David-Abnahme geflaggt); (b) globaler Schalter «aufgehobene Normen
  ausblenden» nie gebaut. Abhaken bleibt David-Entscheid.
  **Detail:** [FAHRPLAN-ARCHIV-RESTPUNKTE.md](fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md) §20.
  **(a) fällt mit `W2·29-WERKBANK-RECHNER`** (Gegenstand Betreibungskosten-Formular, Planung
  23.9.2026); (b) ist eine Funktion und bleibt hier.

- [ ] **Bedienungsanleitung / Onboarding** *(`W2·16-ANLEITUNG`, §14-Intake 20.7.2026, bewusst spät)*
  <!-- @meta id: W2·16-ANLEITUNG · status: ready · blocker: null · dep: [W2·16-INVENTAR] · feld: design · fahrplan: fahrplaene/FAHRPLAN-UI-QUALITAET.md -->
  Die Anleitung folgt dem Inventar (`dep`).
  **Detail:** [FAHRPLAN-UI-QUALITAET.md](fahrplaene/FAHRPLAN-UI-QUALITAET.md) §10.

---

## Rechtslogik — Befunde Prüfung 23.9.2026  *(`feld: rechtslogik`)*

- [x] **Welle 0 — Voraussetzungen: Bauplan-Eintrag, Risiko-Grenze, Fachänderungs-Riegel** *(`W2·30-RL-W0`, Go David 23.9.2026)*
  <!-- @meta id: W2·30-RL-W0 · status: done · blocker: null · dep: [] · feld: rechtslogik · fahrplan: fahrplaene/FAHRPLAN-RECHTSLOGIK.md -->
  RL-01 (dieser Schritt) · RL-02 (Risiko-Grenze, Gegenprüfungs-Pflicht auch für
  Tor-Dateien selbst, W-02 entschieden) · RL-03 (Fachänderungs-Riegel für
  Fixes ausserhalb der Risiko-Grenze). Muss vor jeder anderen RL-Welle gelandet
  sein.
  **Detail:** [FAHRPLAN-RECHTSLOGIK.md](fahrplaene/FAHRPLAN-RECHTSLOGIK.md) §1.

- [x] **Welle 1 — Gesetzesleser + die 11 schweren Rechtslogik-Befunde** *(`W2·30-RL-W1`, Go David 23.9.2026)*
  <!-- @meta id: W2·30-RL-W1 · status: done · blocker: null · dep: [W2·30-RL-W0] · feld: rechtslogik · fahrplan: fahrplaene/FAHRPLAN-RECHTSLOGIK.md -->
  RL-11 (vorgezogen, «Aufgehoben seit») dann RL-04…RL-10, RL-12…RL-14:
  Mietkündigung, SchKG-Weiterzug, Gewährleistung, Fristen-Anknüpfung,
  Verjährung, Erbteilung, Mietvertrag, Katalog-Status, Sperrfrist-Rückfall,
  Verjährungsverzicht.
  **Detail:** [FAHRPLAN-RECHTSLOGIK.md](fahrplaene/FAHRPLAN-RECHTSLOGIK.md) §1 (Welle 1).

- [~] **Welle 2a — mittlere Befunde Fristen** *(`W2·30-RL-W2A`, Go David 23.9.2026)*
  <!-- @meta id: W2·30-RL-W2A · status: wip · blocker: null · dep: [W2·30-RL-W0] · feld: rechtslogik · fahrplan: fahrplaene/FAHRPLAN-RECHTSLOGIK.md -->
  RL-15…RL-25: BGG-Stillstand, Probezeit, SchKG-Fristen, ZPO-/StPO-Presets,
  Feiertags-Daten und -Hinweise, Tagerechner, Lohnfortzahlungs-Skalen.
  **Detail:** [FAHRPLAN-RECHTSLOGIK.md](fahrplaene/FAHRPLAN-RECHTSLOGIK.md) §1 (Welle 2a).

- [ ] **Welle 2b — mittlere Befunde Beträge/Tarife** *(`W2·30-RL-W2B`, Go David 23.9.2026)*
  <!-- @meta id: W2·30-RL-W2B · status: ready · blocker: null · dep: [W2·30-RL-W0] · feld: rechtslogik · fahrplan: fahrplaene/FAHRPLAN-RECHTSLOGIK.md -->
  RL-26…RL-38: UR-Verbandstarif (W-14 entschieden), Tarif-Primitiv,
  Grundpfand-Kombiposten, Notariats-/Grundbuch-/Gerichtskosten-Staffeln,
  Verfahrensart-Tarife, MWST Notariate, Emissionsabgabe, BGG-Kapitalisierung,
  §5-Kopien Tarifdaten, ZPO-Kosten Bund, Erbteilung/Verzugszins/Teuerung Rest.
  **Detail:** [FAHRPLAN-RECHTSLOGIK.md](fahrplaene/FAHRPLAN-RECHTSLOGIK.md) §1 (Welle 2b).

- [ ] **Welle 2c — mittlere Befunde Vorlagen/Zuständigkeit/Leser** *(`W2·30-RL-W2C`, Go David 23.9.2026)*
  <!-- @meta id: W2·30-RL-W2C · status: ready · blocker: null · dep: [W2·30-RL-W0] · feld: rechtslogik · fahrplan: fahrplaene/FAHRPLAN-RECHTSLOGIK.md -->
  RL-39…RL-47: Werkvertrag, Familienrecht, Vorlagen Gesellschaft/Prozess,
  Straf-/Zivilzuständigkeit, Leser-Fassungsstand Rest, Stammdaten-Adressen,
  Formular-Eingaben, Logik aus UI, Datum-/Zitier-Helfer.
  **Detail:** [FAHRPLAN-RECHTSLOGIK.md](fahrplaene/FAHRPLAN-RECHTSLOGIK.md) §1 (Welle 2c).

- [ ] **Welle 3 — Prüfsystem-Rest** *(`W2·30-RL-W3`, Go David 23.9.2026)*
  <!-- @meta id: W2·30-RL-W3 · status: ready · blocker: null · dep: [W2·30-RL-W0] · feld: rechtslogik · fahrplan: fahrplaene/FAHRPLAN-RECHTSLOGIK.md -->
  RL-48…RL-54: Golden-Split werte/texte, quellbelegte Fallsammlung,
  Gegenprüfung messbar, Testlücken + Test-Orakel, Stammdaten-/Tarif-Drift,
  Befund-Buchhaltung Rest, Kleinhygiene.
  **Detail:** [FAHRPLAN-RECHTSLOGIK.md](fahrplaene/FAHRPLAN-RECHTSLOGIK.md) §1 (Welle 3).

- [ ] **Welle 4+5 — Verschlankung und Offenlegung Vorlagen-Reste** *(`W2·30-RL-W4`, Go David 23.9.2026)*
  <!-- @meta id: W2·30-RL-W4 · status: ready · blocker: null · dep: [W2·30-RL-W2A] · feld: rechtslogik · fahrplan: fahrplaene/FAHRPLAN-RECHTSLOGIK.md -->
  RL-55…RL-58: Entdopplung verhaltensneutral (Risikopfad und ohne),
  round2-Gleitkomma (W-22 offen), Vorlagen-Offenlegung Rest.
  **Detail:** [FAHRPLAN-RECHTSLOGIK.md](fahrplaene/FAHRPLAN-RECHTSLOGIK.md) §1 (Welle 4/5).

---

## Werkzeuge — Rechner & Vorlagen  *(`feld: werkzeuge`)*

- [x] **Werkbank-Umbau Schritt 4: Vorlagen-Rahmen, dann die 30 Vorlagen** *(`W2·29-WERKBANK-VORLAGEN`, Go David 22.9.2026)*
  <!-- @meta id: W2·29-WERKBANK-VORLAGEN · status: done · blocker: null · dep: [W2·29-WERKBANK-KATALOGE] · feld: werkzeuge · fahrplan: fahrplaene/FAHRPLAN-WERKBANK-UMBAU.md -->
  Ziel: **ein** gemeinsamer Assistenten-Rahmen aus den bestehenden Vorlagen-Modulen in `src/lib/vorlagen/`,
  darauf die 30 Vorlagen; die 42 geplanten fallen danach aus demselben Rahmen. Grenzen: kein
  zweites Schema-Modell (§5), PDF und DOCX aus demselben Assemble-Ergebnis, Golden byte-gleich.
  **Detail:** [FAHRPLAN-WERKBANK-UMBAU.md](fahrplaene/FAHRPLAN-WERKBANK-UMBAU.md) §5.

- [x] **Werkbank-Umbau Schritt 5: die 20 Rechner, einzeln** *(`W2·29-WERKBANK-RECHNER`, Go David 22.9.2026)*
  <!-- @meta id: W2·29-WERKBANK-RECHNER · status: done · blocker: null · dep: [W2·29-WERKBANK-VORLAGEN] · feld: werkzeuge · fahrplan: fahrplaene/FAHRPLAN-WERKBANK-UMBAU.md -->
  Ziel: gemeinsamer Rahmen **nur** für Kopf, Ergebnisblock und Exportleiste; die 20 Rechner
  ziehen einzeln um. Grenzen: **Rechenfälle werden nie abstrahiert (§1)** — lieber 20 Handgriffe
  als eine Fabrik, die zwei rechtlich verschiedene Fälle gleich behandelt; Engine-Tests
  unverändert (§6.3), Golden byte-gleich.
  **Detail:** [FAHRPLAN-WERKBANK-UMBAU.md](fahrplaene/FAHRPLAN-WERKBANK-UMBAU.md) §5.

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

- [ ] **Funktions-Inventar (Vorstufe der Bedienungsanleitung)** *(`W2·16-INVENTAR`, §14-Intake 20.7.2026)*
  <!-- @meta id: W2·16-INVENTAR · status: parked · blocker: zielbild-gesetzesleser · dep: [] · feld: werkzeuge · fahrplan: fahrplaene/FAHRPLAN-UI-QUALITAET.md -->
  Ehrliche Aufnahme dessen, was LexMetrik heute kann — Quelle `startseiteConfig.ts` (§5),
  Status-Modell ungeschönt (§8).
  **Detail:** [FAHRPLAN-UI-QUALITAET.md](fahrplaene/FAHRPLAN-UI-QUALITAET.md) §9.

- [ ] **Welle-3-Ausbau: Rechner · Fedlex · Vorlagen · UI** *(`W3-AUSBAU`, Dach der Fusion 15.8.2026)*
  <!-- @meta id: W3-AUSBAU · status: parked · blocker: zielbild-gesetzesleser · dep: [] · feld: werkzeuge -->
  Vier Horizont-Stränge unter einem Dach, opportunistische Reihenfolge; **je Zeile eine sortenreine
  Bau-Einheit** (Flächen nie in EINER Session mischen).

- [ ] **Eigenschafts-Tests (property-based) für die Rechen-Engines** *(`QS-CODE-PROP`, Entscheid David 7.8.2026)*
  <!-- @meta id: QS-CODE-PROP · status: ready · blocker: null · dep: [] · feld: werkzeuge · fahrplan: fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md -->
  Runde 1 ist gebaut (12 Engines, 81 Invarianten, kein Engine-Defekt — Chronik). Offen bleiben ein
  Korpus-Defekt und zwei fachliche David-Fragen.
  **Detail:** [FAHRPLAN-OFFENE-BEFUNDE.md](fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md) §5.

- [ ] **Grenzwert-Test Lohnfortzahlung + zwei überholte Code-Kommentare** *(`QS-CODE-LFZ-GRENZE`, Ertrag der Jules-Suggestions-Sichtung 14.9.2026)*
  <!-- @meta id: QS-CODE-LFZ-GRENZE · status: ready · blocker: null · dep: [] · feld: werkzeuge · fahrplan: fahrplaene/FAHRPLAN-FREMDAGENTEN.md -->
  Die drei belastbaren Funde aus 76 proaktiven Jules-Vorschlägen (~4 % Ausbeute) als EINE
  sortenreine Bau-Einheit. Ziel: die Drei-Monats-Grenze von Art. 324a OR direkt prüfen und zwei
  Kommentare, die Erledigtes als offen ausgeben, auf ihren Beleg zeigen lassen. Grenzen: keine
  Verhaltensänderung, bestehende Tests bleiben unverändert (§6.3).
  **S-Grösse ⇒ mit der nächsten `feld: werkzeuge`-Einheit bündeln, nicht allein fahren.**
  **Detail (Fundstellen, Belege, Rauschen-Muster):** [FAHRPLAN-FREMDAGENTEN.md](fahrplaene/FAHRPLAN-FREMDAGENTEN.md) §5.

- [ ] **Tarif-Stammdaten: Folgeschritte und Datenhygiene** *(`W3-TARIF-FOLGE`, herausgelöst 20.9.2026 aus dem `done`-Kopf `W3-TARIF-STAND`)*
  <!-- @meta id: W3-TARIF-FOLGE · status: ready · blocker: null · dep: [] · feld: werkzeuge -->
  Die offenen Folgeschritte zum gelandeten Drift-Tor (#734): Wert-Zeitreihe, amtliche
  Golden-Quellen, Fassungsadressierung, Datenhygiene, Klassifikator-Lücke. **Risikopfad
  Rechtsdaten ⇒ Gegenprüfung Pflicht**, Golden byte-gleich, jeder Wert mit Norm + Link + Stand
  (§7). **Je Zeile eine sortenreine Bau-Einheit** — `src/data/tarif/**` und `scripts/tarif/**`
  nie in EINER Session mischen. Der erledigte Kopf samt Prosa steht in
  [ROADMAP-CHRONIK.md](ROADMAP-CHRONIK.md), Umschichtung 2026-09-20 (2).
  **Detail (Herkunft der Folgeschritte):** [rules-as-code-sichtung-2026-09-05.md](bibliothek/recherche/rules-as-code-sichtung-2026-09-05.md) §6.

- [ ] **Rechtsstand als echte Weiche in den Rechen-Engines** *(`W3-RECHTSSTAND-WEICHE`, herausgelöst 20.9.2026 aus dem `done`-Kopf `W3-TARIF-STAND`)*
  <!-- @meta id: W3-RECHTSSTAND-WEICHE · status: ready · blocker: null · dep: [] · feld: werkzeuge -->
  Zwei Posten derselben Fläche (Rechen-Engines unter `src/lib/**`): die `if datum >= …`-Weiche im
  Rumpf auf nebeneinanderstehende Regeln mit Norm-Anker und Geltungsintervall umstellen — und
  Davids offene Fachfrage zur Verjährungsrevision 2020, die erst entscheidet, ob dort eine zweite
  Regel überhaupt entsteht. **Risikopfad Rechnen ⇒ Gegenprüfung Pflicht**; bestehende
  Mehr-Rechtsstand-Tests bleiben unverändert (§6.3). **Der zweite Posten wartet auf David (§7) —
  ohne seinen Entscheid wird dort nicht gebaut.**


---

## Betrieb & Prüfstrasse  *(`feld: betrieb`)*

> Dieses Feld steht bewusst zuletzt: ohne `@queue`-Eintrag entscheidet die Dokumentreihenfolge,
> und dann soll ein Produkt-Schritt gewinnen, nicht ein Prozess-Schritt.

- [x] **Werkbank-Umbau Schritt 0: Tor gegen Sediment** *(`W2·29-WERKBANK-TOR`, Go David 22.9.2026, Auflage 3 des Rats-Verdikts)*
  <!-- @meta id: W2·29-WERKBANK-TOR · status: done · blocker: null · dep: [] · feld: betrieb · fahrplan: fahrplaene/FAHRPLAN-WERKBANK-UMBAU.md -->
  Ziel: ein Tor `check:sediment` gegen tote CSS-Klassen, verwaiste Komponenten und doppelte
  Metadaten-Quellen — die drei Gattungen, für die keine der 91 Wachen zuständig ist. Grenzen:
  **keine Baseline, keine Bestandsliste, kein Warnung-statt-Fail**; vorhandenes `knip` prüfen,
  statt es zu verdoppeln (§17-Gegengewicht). **Fällt das Tor nicht rot, fällt der ganze
  Umbau-Plan** — die sechs Folgeschritte werden dann gestrichen, nicht gebaut.
  **Detail:** [FAHRPLAN-WERKBANK-UMBAU.md](fahrplaene/FAHRPLAN-WERKBANK-UMBAU.md) §3.

- [ ] **Effizienz-Dauerauftrag (Token/Prozess)** *(`QS-EFFIZIENZ`, stehender Auftrag David 14.8.2026)*
  <!-- @meta id: QS-EFFIZIENZ · status: ready · blocker: null · dep: [] · feld: betrieb · fahrplan: fahrplaene/FAHRPLAN-EFFIZIENZ-CHECKLISTE.md -->
  «bau immer weiter an dingen die bei zukünftigem bau token sparen … bis ich stop sage»: fortlaufende,
  serielle Kleinschritte an Skills/Hooks/Toren/Steuer-Doku; je Punkt eigener Commit/PR, Grenzen
  unverändert (§1, Abnahme, Risiko-Gegenprüfung).
  **Detail:** [FAHRPLAN-EFFIZIENZ-CHECKLISTE.md](fahrplaene/FAHRPLAN-EFFIZIENZ-CHECKLISTE.md) §1 —
  die Checkliste liegt seit 29.8.2026 dort statt hier (sie war eine Merge-Konflikt-Falle: 6 Konflikte
  in EINER Zeile bei 15 PRs).

- [x] **Bewährungs-Messung für Tore, Hooks und Regeln** *(`QS-BEWAEHRUNG`)* — ✅ 15.9.2026. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 17.9.2026.

- [ ] **Fremde Agenten im Bau — Jules, Antigravity, Gemini** *(`QS-FREMDAGENTEN`, Freigabe David 3.9.2026)*
  <!-- @meta id: QS-FREMDAGENTEN · status: ready · blocker: null · dep: [] · feld: betrieb · fahrplan: fahrplaene/FAHRPLAN-FREMDAGENTEN.md -->
  Ziel: neben Claude Code eine zweite Bauequipe (Jules) und einen Lese-/Sichtungsweg (Antigravity,
  Gemini) auf der grünen Spur nutzen — risikofrei, eng umrissen, Tor-geprüft. Grenzen: Risikopfade
  bleiben Claude-Unteragenten, Verdikte und Landung bleiben bei Claude, die fachliche Abnahme bei
  David; jede Phase hat eine Rückbau-Schwelle statt einer Bewachung.
  **Detail:** [FAHRPLAN-FREMDAGENTEN.md](fahrplaene/FAHRPLAN-FREMDAGENTEN.md) §2.

- [ ] **Automatik-Gesundheit** *(`QS-AUTOMATIK`, `[OF]`)*
  <!-- @meta id: QS-AUTOMATIK · status: parked · blocker: zielbild-gesetzesleser · dep: [] · feld: betrieb · fahrplan: fahrplaene/FAHRPLAN-BASIS-AUSBAU.md -->
  Läuft unsere Automatik wirklich, und würde sie scheitern können? Offen: Turso-Wächter-Abdeckung +
  Wachstums-Schwellen.
  **Detail:** [FAHRPLAN-BASIS-AUSBAU.md](fahrplaene/FAHRPLAN-BASIS-AUSBAU.md) §1.

- [ ] **Basis-Ausbau — Fundament** *(`QS-BASIS`, `[OF]`)*
  <!-- @meta id: QS-BASIS · status: ready · blocker: null · dep: [] · feld: betrieb · fahrplan: fahrplaene/FAHRPLAN-BASIS-AUSBAU.md -->
  CI/lokal-Tor-Parität + offene B-Einheiten.
  **Detail:** [FAHRPLAN-BASIS-AUSBAU.md](fahrplaene/FAHRPLAN-BASIS-AUSBAU.md) §2.
  Befundliste: ebenda, Abschnitt «Restposten aus ROADMAP.md» *(verlagert 20.9.2026, Nachzug)*.

- [ ] **Adversariale Gegenprüfung — Restkampagne + Werkzeug-Härtungen** *(`QS-GP`, `[OF]`)*
  <!-- @meta id: QS-GP · status: parked · blocker: zielbild-gesetzesleser · dep: [] · feld: betrieb · fahrplan: fahrplaene/FAHRPLAN-LERNPHASE-2026.md -->
  Offen ist Baustein d (rückwirkende Kampagne, Stufen 2–3 + BGE-Korpus-Regenerierung).
  **Detail:** [FAHRPLAN-LERNPHASE-2026.md](fahrplaene/FAHRPLAN-LERNPHASE-2026.md) §2.

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

- [ ] **Lagebild für David schlank und ehrlich** *(`QS-LAGEBILD`, Auftrag David 8.9.2026 «schlanker und übersichtlicher für mich»)*
  <!-- @meta id: QS-LAGEBILD · status: ready · blocker: null · dep: [] · feld: betrieb -->
  ✅ Sitzung 1 gelandet 8.9.2026 (#765): fünf Klartext-Blöcke, 1714 → 558 Wörter, Bau-Details eigene Seite, Wortbudget-Tor (Wortlaut: Chronik, Umschichtung 8.9.2026 (Landung)).
  Ziel Sitzung 2: jeder Entscheid trägt Frage · Optionen · Empfehlung; Grenzen: `scripts/plan/bild*` + ROADMAP-Kopfblöcke.

- [ ] **Prüfstrasse sparsamer ohne Prüftiefe-Verlust** *(`QS-CI-MINUTEN`, Auftrag David 8.9.2026)*
  <!-- @meta id: QS-CI-MINUTEN · status: ready · blocker: null · dep: [] · feld: betrieb · fahrplan: fahrplaene/FAHRPLAN-CI-MINUTEN.md -->
  Gebaut 8.9.2026: M1–M5, Flacker-Wächter (Melde-Modus bis 22.9.2026, dann hart), Ergebnis-Job, Playwright-Install-Retry — Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (3); Regeln: Skill `landung` §«Prüfstrasse seit 8.9.2026». **Nachmessung 8.10.2026.** **Merge Queue erledigt 19.9.2026:** Repo `LexMetrik/Whatever`, Ruleset 23699779 (SQUASH, ALLGREEN, max 3, Timeout 60 min, keine Bypass-Akteure), `strict` AUS; erster Durchlauf #922 + #917 gemeinsam gelandet 15:05:00Z. Herleitung (#914/#892), `QS-ORG-UMZUG` im Wortlaut, Entscheide David 8.9.2026 (Weg A, M2): Chronik, Umschichtung 19.9.2026 bzw. 14.9.2026 (3). Offen: Wurzel der flackernden Specs (Fehlerbuch §4, bis 22.9.) — unter der Queue schwerer.
  Ziel: CI-Minuten senken, kein Tor entfällt, `check:e2e-shards` bleibt.
  **Detail:** [ci-minuten-sparplan-2026-09-08.md](bibliothek/betrieb/ci-minuten-sparplan-2026-09-08.md)
  — 61'381 min/Monat, `ci.yml` 97,5 %, Sparplan −24'300 ohne Prüftiefe-Verlust.
  **Detail (Restposten im Wortlaut, verlagert 20.9.2026, Entscheid David):** [FAHRPLAN-CI-MINUTEN.md](fahrplaene/FAHRPLAN-CI-MINUTEN.md) §1.

---

## Geparkt (bis ≥1.12.2026 / Nutzerfeedback / Markt)

- **Dossier / Fall-Rückgrat** *(FALL-RUECKGRAT, G3.3)* — Mandats-/Dossierverwaltung & «Meine
  Fristen». Vorerst draussen; alle Werkzeuge bleiben stateless. Umfasst auch das nie gebaute
  schlanke URL-Kontext-Rückgrat (PRODUKTAUSBAU P2) samt Bau-Auflagen — Detail
  `archiv/FAHRPLAN-PRODUKTAUSBAU-BURGGRABEN.md` §P2.
- **Markt-Themen** — Hosting (Infomaniak), Domain `lexmetrik.ch`, Zahlung (Payrexx/Datatrans/TWINT),
  Login/Pro.
- **Live-Rechtsprechung** — §4-blockiert (s. Verifikations-Blockaden).
- **Rules-as-Code-Sprachen (Catala, OpenFisca)** — als Sprache/Engine nicht übernommen (OCaml-Kette, 5-MB-Bundle §15, AGPL); Wiedervorlage nur, wenn Catala ein natives JS/TS-Backend erhält. Muster sind in `W3-TARIF-FOLGE`/`QS-CODE-PROP` verankert. Quelle: Rules-as-Code-Sichtung 5.9.2026 §5.
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
