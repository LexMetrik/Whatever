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

**Verifikations-Blockaden (einmal definiert, danach nur referenziert):**
- **§4 — Lizenz/CORS für Live-Rechtsprechung** (CC-BY-SA vs. Art. 5 URG, CORS/Rate-Limits
  unbestätigt) → Rechts-/Lizenzbeurteilung = **`[D]`**. Solange offen: ENTSCHEIDSUCHE-P1 &
  KANTONALE-P1-Adapter **geparkt**. Nicht-§4-blockierte Korpus-/Übersichtsarbeit ist ausgenommen.
- **Prozesskosten I2** — die Recherche zu Schlichtungs-/Reduktionsfaktoren ist `[OF]` und **Teil von
  `W1·4`** (Entparkung 3.8.2026, David): erster Arbeitsschritt des Schrittes, kein Wartegrund.

<!-- @blockers
vps-bestellung-david: E3-Serving + E4-UI hängen an einer VPS-Bestellung (David, ~15 Min) — Dossier `bibliothek/betrieb/vps-bestell-dossier-2026-07-17.md` (PR #271). ECHTES David-Gate, kein Bau-Blocker; bis dahin sind QS-DATA/W2·6-DATA nur im NICHT-VPS-Teil baubar (E0–E4 sind lokal fertig). Entscheid David 14.9.2026: Bestellung erst nach Phase 2 (Kantone); Termin 13.9.2026 hinfällig.
richter-analytik-gate: Richter-/Spruchkörper-Analytik (W3·15-RICHTER). GRENZE (20.7.2026): Filtern/Facette/Verlinkung sind FREI und gebaut (#309/#311); gesperrt bleiben allein RANKING und PROGNOSE. Nur deskriptiv; bewusste Freigabe Davids erforderlich (heikel: Standesrecht, Persönlichkeitsschutz, richterliche Unabhängigkeit)
david-entscheid-org-umzug: QS-ORG-UMZUG — Repo-Transfer in eine Gratis-Organisation für die native Merge Queue (User-Konten haben keine); Infrastruktur-Entscheid mit ~1 h Nacharbeit (Vercel, Branch-Schutz, Secrets). Erst prüfen, ob der Auto-Nachzug (Checklisten-Zeile unter QS-AUTOMATIK) den BEHIND-Schmerz ausreichend dämpft (Entscheid David 7.8.2026: «B als Schritt, A parken»)
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

<!-- @queue: W2·27-BUND-FERTIG, W2·5l-NORMTEXT-B2, QS-KORPUS, W2·20-VERWEIS-SCHAERFE, W2·22-VERWEIS-FEDLEX, W2·5m-LESER-V3, QS-PERF, W2·5n-BUND-VOLL, W2·21-ZULIEFERER, W2·13-KANTONE-DATEN, W2·13-KANTONE-DRIFT, W3·12, W2·5g-ZEIT, W2·14-SIGNAL, W2·6 -->
<!-- ^ SSoT der Bau-Reihenfolge: plan:next wertet die @queue VOR der Dokumentreihenfolge aus;
     Integrität erzwingt check:plan Regel 8. Priorität ändern = NUR diese Zeile ändern.
     Ohne Queue-Eintrag entscheidet die Dokumentreihenfolge — Produkt-Felder stehen darum
     vor `Betrieb & Prüfstrasse`. -->

> **⬆ OBERSTER OFFENER SCHRITT: `W2·5l-NORMTEXT-B2`** (Text-Treue M13/M14).
> **In Arbeit:** `W2·27-BUND-FERTIG` (Sollbild «Was ist ein Gesetz bei LexMetrik», am Bund
> festgeschrieben und dort eingelöst) — `status: wip`, darum liefert `plan:next` den nächsten
> Queue-Eintrag.
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

- [~] **Gesetz-Leser V3 — Hülle neu, Kern unangetastet** *(`W2·5m-LESER-V3`, Auftrag David 16.8.2026)*
  <!-- @meta id: W2·5m-LESER-V3 · status: wip · blocker: null · dep: [] · feld: leser · fahrplan: fahrplaene/FAHRPLAN-LESER-V3.md -->
  Ziel: Leser-Oberfläche nach Apple-HIG-Prinzipien radikal vereinfacht; Kern (`ArtikelBody`,
  `ArtikelLeser`, Datenlogik) unangetastet, Golden byte-gleich. **Fertig, wenn** H1–H5 gelandet
  und die S-Etappen abgehakt sind. H1–H5 sind seit 21.8.2026 gebaut (Chronik).
  **Detail:** [FAHRPLAN-LESER-V3.md](fahrplaene/FAHRPLAN-LESER-V3.md) (Kurzfassung zuoberst; Kap. 7 Etappen H1–H5/S1–S4, Kap. 9 Fragen F1–F6).
  - [ ] **D0 · Farb-Vorarbeit** — Tailwind-Deckkraft-Klassen (`bg-brass-100/70`) erzeugen keine CSS-Regel; Wurzel-Fix + Rot-Beweis, eigener kleiner PR. Kap. 14.
  - [ ] **S1 · Historie-Modell** — «Änderungsvermerke: an/aus», bei «aus» keine Spur im Lesetext (Sichtbarkeits-Wächter §8) — **wartet auf F1/F2**. Kap. 7.
  - [ ] **S2 · Typografie + Artikel-Raster** — Variante nach Bildvergleich (**F3**), gleichmässige Abstände, CLS 0. Kap. 7/8.
  - [ ] **S4 · Kantons-Probe** — Kantonserlasse rendern unverändert (Fokus Bund, nichts bricht); der H2-Kontaktbogen deckt nur Bund ab. Kap. 7.
  - [ ] **Tor-Konflikt `erlassAnsicht.ts`-Deckel** *(§17-Wurzel-Fix, Befund 31.8.2026)* — `leser-v3-fundament` verlangt jede `.ebene`-Ableitung in `erlassAnsicht.ts` UND deckelt die Datei (421/420er-Grenze, muss unter `leserV3Modell.ts` bleiben); die nächste erzwungene Ableitung hat keinen Platz. Deckel neu kalibrieren oder Datei schneiden — Wurzel-Fix, kein Einzelfall-Umschiffen.
  - [ ] **Nachbar-Artikel-Pfeile** (← Art. 89 · Art. 90a →) im Artikelkopf; Muster gesetze-im-internet/dejure/buzer. Reine Hülle, Kern unangetastet. Quelle: Fremdnutzen-Suchrunde 2 (6.9.2026) §3 #1.
  - [ ] **Rohdaten-Link je Erlass** (JSON-Snapshot/AKN-Quelle, Stand, Fassungs-Token) im Leser-Kopf — §7-Transparenz, Muster legislation.gov.uk «Print Options». Quelle: Fremdnutzen-Suchrunde 2 (6.9.2026) §3 #11.
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
  «Art. xx dieses Gesetzes» springt im Gesetz; Verweise nach ausserhalb sind als solche
  erkennbar; Inventar-Schärfe messbar statt Kommentar-Zahlen. **Stand 14.9.2026 (Prosa
  nachgezogen):** V-1 (Mess-Tor `check:verweis-inventar`) · V-2 · V-3 · V-4 · V-6 gebaut 1.9.2026
  (PR #599), V-7/V-8 Bund-Stufe 1.9.2026. **Offen (Phase 1):** V-7-Bund-Rest — Trägergesetz-Kontext
  «des Gesetzes» (169 Stellen) und Kurztitel ohne Fedlex-Ziel (28) als kuratierte Positivliste
  (prüfbare Liste im PR, nie heuristisch). **Phase 2:** V-7 kantonale Namensliste (916 Stellen).
  **Phase 3:** V-5 (Zeit-Kante), Konzept an W2·5g-ZEIT. Leitplanke: kein Link besser als falscher (§1).
  **Detail:** [FAHRPLAN-VERWEIS-SCHAERFE.md](fahrplaene/FAHRPLAN-VERWEIS-SCHAERFE.md) §1.

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
    (a) ✅ erledigt 14.9.2026 — die Suffix-Reihe (bis…duodecies) steht jetzt EINMAL in
    `src/lib/fedlex/nummer.ts`; alle vier Konsumenten lesen sie. 13 Fundstellen in 9 Bundes-
    erlassen lösen neu auf (41 unterdrückte Aufzählungs-Glieder → 50 Links, +2 Selbstsprünge),
    0 kantonale Stellen, 0 neue tote Anker; (b) ✅ erledigt (Wortlaut: Chronik, Umschichtung 6.9.2026);
    (c) **Artikel-Anker gegen den Ziel-Snapshot prüfen, Fallback Erlass-Link** — ein Fremd-Anker
    entsteht heute allein aus Kürzel + Nummer, ohne dass die Zielbestimmung im Snapshot des
    Zielerlasses nachgeschlagen wird. Gemessen 2.9.2026: 16 tote Artikel-Anker aus Z5 (StGB
    `art_91_a` ×4, StGB `art_340` …); dieselbe Mechanik trägt auch die ALTEN Anker-Pfade, der
    Bestand ist also mitzumessen. Zielbild: existiert das Ziel-Token nicht, auf den Erlass-Link
    zurückfallen statt auf einen toten Sprung (§8). Risikopfad — Gegenprüfung Pflicht.
  - [ ] **Z4 Leser-Schicht «zitiert von»** (Erlassebene, nur Bund) — erst nach Z1–Z3 und Abnahme.

- [ ] **Norm-Zeitmaschine + Fassungs-Diff** *(`W2·5g-ZEIT`, Ideen-Intake 20.7.2026; Phase 3 — FR/IT-Datenanteil gehört hierher, Entscheid David 14.9.2026 «fr/it später», FAHRPLAN-BUND-FERTIG §4 a)*
  <!-- @meta id: W2·5g-ZEIT · status: ready · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-GESETZESDARSTELLUNG-V2.md -->
  «Art. X, wie er am Tag Y galt» + visueller Diff zweier Konsolidierungen; harte Bau-Reihenfolge
  (a) POC → (b) AKN-XML Phase 1 + `G-HIST` → (c) Bau.
  **Detail:** [FAHRPLAN-GESETZESDARSTELLUNG-V2.md](fahrplaene/FAHRPLAN-GESETZESDARSTELLUNG-V2.md) §8.
  - [ ] **Mehrsprachiger Normvergleich DE/FR/IT** — Auslegungswerkzeug nach Art. 14 PublG; heute ist nur `de` befüllt. Regel aus `QS-FRIT-DRIFT`: **eId trägt nicht über Sprachen** — Abgleich über die Artikelnummer.

- [~] **Phase 1 · Bund fertig machen — Sollbild und Struktur-Schluss** *(`W2·27-BUND-FERTIG`, Entscheid David 14.9.2026)*
  <!-- @meta id: W2·27-BUND-FERTIG · status: wip · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-BUND-FERTIG.md -->
  Dach der Phase 1: einmal niederschreiben, **was ein Gesetz bei LexMetrik ist**, und es am Bund
  einlösen — Sollbild, Datenstruktur schliessen, Leser schärfen, dann alle Bundeserlasse. Der
  Schritt trägt selbst nur die Struktur-Posten ohne eigenen Schritt; die übrigen Phase-1-Einheiten
  sind bestehende Schritte (`W2·5l-NORMTEXT-B2` … `W2·5n-BUND-VOLL`), ihre Reihenfolge steht in der
  `@queue`. **Fertig, wenn** ein Schweizer Jurist jedes Bundesgesetz vollständig, strukturgleich und
  schneller als auf Fedlex liest.
  **Detail:** [FAHRPLAN-BUND-FERTIG.md](fahrplaene/FAHRPLAN-BUND-FERTIG.md) §3.
  - [x] **Sollbild + Messung 14.9.2026** (dieser PR) — elf Bausteine mit Soll/Ist-Bund/Leser/Zuständigkeit, Fünf-Artefakte-Befund, Randtitel-Doppelmodell, zehn Lücken (Fahrplan §1/§2).
  - [ ] **Randtitel-Doppelmodell auflösen** — `NormSnapshot.titel` (Bund 0/25 463) und `struktur.marginalie` (22 223 Artikel) sind zwei Heimaten derselben amtlichen Sache (§5). **Entschieden David 14.9.2026 (Fahrplan §4 c, Option i):** `struktur.marginalie` wird die eine Quelle, `NormSnapshot.titel` Projektion oder entfällt; Kanton migriert Phase 2. Vorbedingung Sidecar-Drift-Riegel: PR #851. *Risikopfad ⇒ Gegenprüfung.*
  - [ ] **Zukunftsfassungen-Hinweis im Leserkopf** *(Entscheid David 14.9.2026, Fahrplan §4 b)* — «ab <Datum> gilt eine neue Fassung» + amtlicher Link aus `naechsteFassungAb`/Inkrafttreten-Register (62 Erlasse, 93 künftige Inkrafttreten liegen als Daten vor); reiner Hinweis, kein Umschalter (Phase 3). Hülle, kein Risikopfad.
  - [x] **`aufgehoben` strukturell statt Text-Heuristik** — Artikel galten nur deshalb als aufgehoben, weil ihr Body leer oder «…» ist; ein Extraktionsfehler sähe identisch aus (§7/§8). Erledigt 14.9.2026: amtliches Signal = Aufhebungs-Vermerk der Fedlex-Fussnote; `aufgehoben` 0 → **1 277/25 463**, Golden byte-gleich. Neuer Wächter `check:leerstellen` deckelt die 98 ungeklärten Bund-Leerstellen. Zahlen, Restklassen und ein Historie-Nebenbefund: Fahrplan §1 (Nachtrag 14.9.). *Risikopfad ⇒ Gegenprüfung.*
  - [x] **Sidecar-Drift-Riegel 216/228** — der Struktur-Sidecar trug in 216 von 228 Dateien keinen eigenen `stand`/`fassungsToken`; Randtitel und Fussnoten alterten unbemerkt (passt zu «Golden-Token blind für Randtitel», `sha-bloecke.ts:50`). Erledigt 14.9.2026: Generator-Lauf zog alle 228 nach (215 davon substanz-byte-gleich = die Marke ist reproduziert, nicht behauptet), `check:struktur-konsistenz` verlangt sie im Bund-Ast neu als Pflicht statt additiv. *Risikopfad ⇒ Gegenprüfung.*
  - [ ] **`confidence.json`-Neulauf** — das Artefakt stammt vom 23.6.2026 (150 Erlasse), der Korpus umfasst heute ~1 566; das ausgewiesene Qualitätsbild ist veraltet (§8).
  - [x] **KKV-Token `126_z__2`** — ein Artikel existierte im Snapshot, nicht im Struktur-Sidecar (25 463 vs. 25 462). Geklärt 14.9.2026: **Quell-Effekt** — Fedlex vergibt die id `art_126_z` zweimal (Art. 126z und Art. 126z^tredecies, dessen Ordinal-Suffix fehlt in der eId); unser Struktur-Extraktor kannte den Synthese-Suffix `__2` des Snapshot-Generators nicht und liess das zweite `<article>` das erste überschreiben. Es fehlte also nicht nur ein Eintrag, Art. 126z trug **fremde** Marginalie und Gliederung. Fix an der Pipeline-Quelle, Tor meldet den Fall neu als Fehler. *Risikopfad ⇒ Gegenprüfung.*
  - [ ] **Staatsverträge ohne Randtitel und Historie (19)** — CISG, CMR, LugÜ, HKÜ, UNO-Pakte u. a.: kein Sachtitel im Sprungziel, kein «gilt seit». Bau-Heimat `QS-KORPUS`, hier als Phase-1-Pflicht geführt. *Risikopfad ⇒ Gegenprüfung.*

- [ ] **Schlusstitel/UeB/Anhänge (M13) + wortgenaue Fussnoten (M14)** *(`W2·5l-NORMTEXT-B2`)*
  <!-- @meta id: W2·5l-NORMTEXT-B2 · status: ready · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-NORMTEXT-DARSTELLUNG.md -->
  **Golden-Re-Bless erwartet** (additiv). Tragende Falle: Token-Kollision `disp_u1`/`art_1` — ohne
  eigenen id-Raum stiller Daten-Verlust.
  **Detail:** [FAHRPLAN-NORMTEXT-DARSTELLUNG.md](fahrplaene/FAHRPLAN-NORMTEXT-DARSTELLUNG.md) §M13/§M14
  (§-Sigel nachgezogen 30.8.2026 — Regel 11 bindet).
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
  - [ ] **K-7 · PDF-Werkstatt VD/SZ/ZH + Range-Platzhalter** — Teil a ist das **harte Dehyphenations-Gate**; ohne es bleibt jeder FR/VS/AR-PDF-Nachzug gesperrt. §1-A.
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
  - [ ] **`check:paritaet` ist gegen Datei-LÖSCHUNG blind** *(Nebenfund ZH-Fix-Runde 3, 31.8.2026 — bewusst NICHT hier gefixt, fremde Baufläche `scripts/datenhaltung/**`)* — Am Code belegt (`scripts/datenhaltung/check-paritaet.ts`, gelesen 31.8.2026): das Tor baut seine DB durch INGEST DER VORHANDENEN DATEIEN (`ingestNormtext(db)`) und vergleicht danach jeden Pfad, den diese DB kennt, byte-weise mit der Datei. Eine gelöschte Datei wird nie ingestiert, steht nie in `alleEintragPfade()` und wird nie verglichen — die Löschung ist für dieses Tor unsichtbar, nicht wegen eines Fehlers, sondern wegen der Richtung des Beweises. Auffallen kann sie nur einem Tor, das eine andere Frage stellt (`check:golden-normtext` vermisst die sha-Einträge). Nötig ist die Gegenrichtung im Paritäts-Tor: DB-Erlassmenge ⊆ Dateimenge. Fläche `scripts/datenhaltung/check-paritaet.ts`, zu bauen zusammen mit dem Datenhaltungs-Strang (§12: die beiden Stränge landen abwechselnd, nie gleichzeitig auf dieselben Artefakte).
  - [x] **K-15 · Sprengel-Zuordnung BE aus amtlichen Geodaten** — erledigt 12.9.2026, PR #810 (`064d191f6`): 334/334 Gemeinden, 5 Gerichtsstandorte, 4 regionale Staatsanwaltschaften; Normbasis GSOG Art. 80/81/88a/92 (BSG 161.1); Artefakt `src/data/zustaendigkeit/beSprengel.json`; Tore `check:be-sprengel`/`check:be-sprengel-netz`. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 12.9.2026.
  - [ ] **K-15-Nachzug · Fachliche Abnahme der BE-Sprengel-Tabelle** (David, §7) — bis dahin UI unverändert.
  - [ ] **K-15-Nachzug · UI-Verdrahtung BE-Sprengel im Zuständigkeits-Rechner mit Pflicht-Quellenangabe AGI BE** (eigener Schritt nach Abnahme).
  - [x] **K-16 (BS-Teil) · Kantonale Materialien Basel-Stadt an die Botschaften-Pipeline** — erledigt 12.9.2026, PR #799 (`c83501304`): Grosser Rat (data.bs.ch, CC BY 4.0), 117 Geschäfte, 122 Kanten (8 amtlich, 114 maschinell gekennzeichnet), 409 Verfahrens-Ereignisse. ZH-Teil bleibt offen (Präzisierung 6.9.2026: Bund → BS → ZH; ZH-Pendant FAHRPLAN-KANTONE §5 R12b). Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 12.9.2026.
  - [ ] **K-16-Nachzug · CC-BY-Namensnennung data.bs.ch in der UI** (Entscheid David) — die 114 maschinell gekennzeichneten Kanten und die BS-Materialien stammen aus einer CC-BY-4.0-Quelle; wo/wie die Namensnennung im UI erscheint, ist offen.
  - [ ] **K-16-Nachzug · Fachliche Abnahme der 114 maschinellen Kanten** (David, §7) — Erlass↔Vorstoss-Zuordnung ohne amtlichen Schlüssel (heuristisch, `quelle: maschinell`), Abnahme steht aus.
  - [x] **Deckel-Reserven vor ZH (R12b) — erledigt 12.9.2026 (PR #802, `c0acd4557`):** Register in drei Projektionen geteilt (Kern/i18n/Provenienz nach Nutzungszeitpunkt) — Kern 118/280 KB gzip (42 %), i18n 84/140 KB (60 %), Provenienz 93/240 KB (39 %), Verfahrens-Ereignisse 16/60 KB (27 %, jetzt alle Herkünfte statt nur Bund); ZH-Prognose Kern 49 %. — ✅ Wortlaut: ROADMAP-CHRONIK.md.

  - [ ] **PDF-Pfad liest Ziffern-Tarife falsch** *(19B-Nachtrag 13.8.)* — SG-3849-Wurzel: generisches «Art. N»-Muster greift auch in Querverweisen; Regel «Nr. XX.YY am Zeilenanfang» nötig. §1-A.
  - [ ] **Fassungs-Drift PDF-erfasster Snapshots unbemerkt** *(§17-Wurzel-Fix)* — `fassungsToken` ändert sich nicht bei neuer Portal-Fassung (SG-2808 hängt an 2808/2012, amtlich gilt 3863). Nötig: Tor `current_version.id` ↔ Snapshot. §1-A.
  - [ ] **Kern-Kategorie als Registerfeld statt Titel-Muster** *(§17-Wurzel-Fix, Gegenprüfung 31.8.2026 Befunde 1+2)* — heute entscheidet die zufällige Wortzusammensetzung («Handänderungs**steuergesetz**» trifft, «Gesetz über die Handänderungssteuer» nicht; 15 Erlasse tragen die Sache nur im Kürzel, Bestandsmuster lesen nur den Titel). Deklariertes Feld in der Pipeline-Quelle, Muster-Raten zurückbauen; dabei die David-Frage «Handänderungs-/Grundbuchabgaben = Kernklasse?» mitentscheiden lassen.
        *Teil-eingelöst 31.8.2026 (N0b): das deklarierte Feld existiert jetzt —… — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 8.9.2026 (Landung).*
  - [ ] **SG-Langform-Erstzitate heben Recall der Zitat-Brücke** *(GP-N0-Hinweis 31.8.2026)* — 802/7790 SG-Nummern-Zitate mit vorhandenem Snapshot bleiben unaufgelöst (10,3 %; Muster: Langform-Erstzitierung «…gesetz, GOG; SG 154.100», BS-154.100 allein 396×) — Wurzel kanton-norm-resolver.ts (Altbestand); SG-Nummern-Fenster über die Langform ⇒ ~+800 Paare. Dazu: normkeys-kanton.json beim ERSTEN UI-Konsum in DATEN_BUDGET eintragen.
  - [ ] **Manifest-Sprache ehrlich + Dubletten** *(Befund Bau W2·13-KANTONE 31.8.2026)* — 37 fr/it-Erlasse als `sprache:'de'` deklariert (nur 2 korrekt ≠ de, §8); mehrere Erlasse doppelt im Manifest (FR-261.16-Notariatstarif, JU-Décret émoluments, TI-Legge tariffa giudiziaria, VS-Notariats-Règlement). Pipeline-Quelle fixen, nie die Projektion (§5).
  - [ ] **ZH-Programm: 13 Runden + Tranchen** *(Aufträge David 31.8.2026, Dauer-Baumandat)* — Phasenplan mit Abhängigkeiten statt Bestell-Reihenfolge: Tranchen A/B/C mit Prüf-Schleife · Tag-Leser-Familie (Gliederung/Tabellen/Fussnoten/Anhänge) · Semantik (Verweise/Definitionen/Abkürzungen/Sachgebiete) · Zeit (Inkrafttreten/Historie) · Ernte (Rechtsprechungs-Brücke/Mehrsprachigkeit/Suche); alles kanton-generisch. **Spec:** [FAHRPLAN-KANTONE.md](fahrplaene/FAHRPLAN-KANTONE.md) §5.
  - [~] **ZH-Tranche: Inventar + Kern-Erlasse** *(Auftrag David 31.8.2026, gestuft)* — Stufe 1 erledigt: 944 in-Kraft-Erlasse via amtlichem JSON-Endpunkt gezählt, Volltext nur PDF (beweisgeführt), Systematik-Ebene 1 = 14 Ordner browserlos, Drift-Token = PDF-ETag; Dossier [zh-quellinventar-2026-08-31.md](bibliothek/recherche/zh-quellinventar-2026-08-31.md). Stufe 2 (läuft): deklarative ZH-Quellenliste + Inventar/Drift-Anbindung (§7-d-Lücke) + `holeZhPdf`-Retry (§17) + 15–25 Kern-Erlasse + ZH-Systematik Ebene 1; Spec [FAHRPLAN-KANTONE.md](fahrplaene/FAHRPLAN-KANTONE.md) §4. Stufe 3 (Ausbau in Tranchen Richtung 944) erst nach sauberer Stichproben-Abnahme von Stufe 2.
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

- [x] **Entstehung am Artikel — Daten: Verfahrens-Ereignisse, Historie-Kopf, Botschafts-Keys, Anker, Parlament** *(`W2·6c-ENTSTEHUNG-DATEN`, §14-Intake 6.9.2026, Design-Freigabe David 6.9.2026)*
  <!-- @meta id: W2·6c-ENTSTEHUNG-DATEN · status: done · blocker: null · dep: [] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md -->
  Ziel: die Fassungskette je Artikel (liegt als G-HIST-Shard vor) mit der Verfahrenskette der Vorlage
  (Fedlex-Projektgraph, Curia Vista) und der Botschaft verbinden — ohne zweiten Parser, ohne Volltext,
  ohne Personendaten. Grenzen: Bund zuerst; Historie-Generator und -Shard bleiben unangetastet; Curia
  nur aggregiert, Monatslauf statt Gate-Kette. Etappen E1, E2, E4. **Bau erst auf Davids Go.**
  **Detail:** [FAHRPLAN-MATERIALIEN-VERZAHNUNG.md](fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md) §11.

- [x] **Entstehung am Artikel — Leser: Chip mit Fassungszahl, Karte mit Fassungsleiste und Begründung** *(`W2·6c-ENTSTEHUNG-LESER`, 6.9.2026)*
  <!-- @meta id: W2·6c-ENTSTEHUNG-LESER · status: done · blocker: null · dep: [W2·6c-ENTSTEHUNG-DATEN, W2·24-DESIGN-IDENTITAET] · feld: leser · fahrplan: fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md -->
  **Nachgeführt 11.9.2026 (Sichtung §11 Fassung 5):** die Fassung ist seit D40 (#761, 7.9.2026)
  eine Rubrik der Funktionszeile am Artikelende, der frühere Kopf-/Marginalie-Slot ist entfallen;
  die Karte rendert im bestehenden Aufklapp-Block (`.lr7-bez-inhalt`, künftig `Funktionszeile.tsx`)
  — **kein zweiter Slot nötig**, C5/C6 der alten Spec sind damit gegenstandslos. Nichts lädt vor
  dem Klick (Auflage David 6.9.2026). Alle neun slot-verlagernden W2·24-Branches sind auf `main`
  (geprüft 11.9.2026 gegen `git log origin/main`, PR #744–#761).
  Etappe E3. **Detail:** [FAHRPLAN-MATERIALIEN-VERZAHNUNG.md](fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md) §11.

- [x] **Entstehung am Artikel — Synopse alt/neu ab 2021 und Entwurf↔Beschluss** *(`W2·6c-ENTSTEHUNG-SYNOPSE`, 6.9.2026; absorbiert den Datenanteil von M16)*
  <!-- @meta id: W2·6c-ENTSTEHUNG-SYNOPSE · status: done · blocker: null · dep: [W2·6c-ENTSTEHUNG-DATEN] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md -->
  Diff zweier Fedlex-Konsolidierungen je Artikel (HTML nur ab Stand 1.1.2021), gespeichert wird nur der
  Alt-Block als §7-Zitat mit Deckel 8 MB / 2 MB je Erlass; Vor-Messung E5.0 vor dem Bau. Etappen E5.0, E5, E6.
  **Detail:** [FAHRPLAN-MATERIALIEN-VERZAHNUNG.md](fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md) §11.

- [x] **Entstehung am Artikel — Synopse alt/neu in der Änderungskarte** *(`W2·6c-ENTSTEHUNG-SYNOPSE-LESER`, §14-Intake 11.9.2026)*
  <!-- @meta id: W2·6c-ENTSTEHUNG-SYNOPSE-LESER · status: done · blocker: null · dep: [W2·6c-ENTSTEHUNG-SYNOPSE, W2·6c-ENTSTEHUNG-LESER] · feld: leser · fahrplan: fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md -->
  Ziel: in der Änderungskarte (E3, `EntstehungsBlock.tsx`) je Fassungspunkt den alten Wortlaut aus
  `public/materialien/synopse/<KEY>.json` gegen den geltenden zeigen, nachgeladen erst beim Klick,
  Zustände ehrlich (`ohne_ereignis`-Blöcke als «ohne Fussnoten-Ereignis» gekennzeichnet), §7-Merkmale
  sichtbar (Stand, Quelle, Live-Link), Entwurf↔Beschluss aus `synopse-entwurf/` wo vorhanden. Grenzen:
  kein Prerender-Markup, CLS 0, Deckel unverändert. **Bau erst nach Merge von** `W2·6c-ENTSTEHUNG-SYNOPSE`
  **(PR #794, Stand 11.9.2026: offen).**
  **Detail:** [FAHRPLAN-MATERIALIEN-VERZAHNUNG.md](fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md) §11.5.

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
  - [x] **`adapter-lexwork.ts:778` Fetch-Ergebnis unvalidiert** — ✅ erledigt 12.9.2026, PR #813 (`af5e35ce9`); Gegenprüfung ausstehend. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (2).
  - [ ] **Bezüge-Kanten mit Phantom-Zitaten** *(Befund Split-Bau 30.8.2026, PR #582)* — 18 854 von
    75 365 Artikel↔Entscheid-Kanten nennen den Artikel im Entscheid-Snapshot gar nicht; Stichprobe
    `bge_148_V_265` trägt `«Art. 4 BGE»` in `zitierteNormen` (Extraktions-Artefakt). Wurzel im
    Bezüge-/Zitat-Generator suchen (Risikopfad, Gegenprüfung), nie in den Daten flicken.
    *Zuschnitt 1.9.2026:* zuerst den billigen **Filter** (Kante nur, wenn der Artikel im
    Entscheid-Snapshot wörtlich steht — §1 sofort erfüllt), den Generator-Neubau erst nach
    `W2·21-ZULIEFERER` (kommt der Graph von dort, entfällt er).
  - [ ] **Kernerlasse-Lücken Bund schliessen** *(Bestandsmessung 1.9.2026, Zielbild Gesetzesleser)* — EMRK (SR 0.101) ist nur PDF-Einbettung, kein Snapshot; EÖBV (SR 211.435.1) und AVG (SR 823.11) fehlen ganz. Fedlex-Adapter, Pin in `fedlex-cache.sh`, §7-Beleg; EMRK-Pin ersetzt die pdf-embed-Zeile nur, wenn der Fedlex-Konsolidierungstext vollständig ist (sonst Einbettung behalten, §8).
  - [x] **Geltende BMV in den Korpus aufnehmen** — ✅ erledigt 12.9.2026 (#823, gelandet). Wortlaut: ROADMAP-CHRONIK.md.
  - [x] **scope/decl-Sektionen von 12 Staatsverträgen ingestieren** — ✅ erledigt 12.9.2026, PR #838; Gegenprüfung bestanden. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (2).
  - [x] **Entscheid-Datumsfehler bereinigen** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 12.9.2026).
  - [x] **Erledigt:** VZV Art. 3/4 · AMBV — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 7.9.2026 (2).
  - [ ] **Golden-Token blind für Randtitel** *(Befund PR #668, 4.9.2026)* — `sha256Bloecke` (`scripts/normtext/sha-bloecke.ts`) hasht weder `titel` noch `absatz` (Gegenprüfung 4.9.2026: `sha-bloecke.ts:50`); eine reine Randtitel-Revision (BE 154.21 Art. 31) bewegt den Golden-Index nicht. Wurzel-Fix korpusweit (~60k Hashes) als eigener Schritt mit Gegenprüfung.
  - [ ] **`public/normtext/confidence.json` veraltet** *(Befund PR #668, 4.9.2026)* — erzeugt 23.6.2026 mit 150 Erlassen, heutiger Lauf liefert 1566 (196 Quarantäne); eigener Schritt: neu erzeugen, Quarantäne-Liste sichten, `report:confidence` als Tor oder Wächter-Zeile.
  - [ ] **Nebenfunde Nacht 5.9.2026** (7 Zeilen: Cache ohne Fassungsschlüssel, struktur-Filter, stumme Löschung, GL-Kanonik, Kanton-Drift, Fedlex-Trenner, standRechtsprechung) — Fahrplan §1.
  - [x] **Erledigt:** Deckungs-Seite «was wir nicht haben» — ✅ Wortlaut: ROADMAP-CHRONIK.md, PR #807 (12.9.2026).
  - [x] **Ingest-Wächter `ungedeckteTopLevelJson`** (#807) fand vier vorbestehende Lücken (`inkrafttreten`, `kanton-luecken`, `pdf-quellen`, `bezuege-bilanz`) — geschlossen; Ausnahme-Mechanik ohne Verfall bewusst nicht gebaut.
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
  - [x] **`check:fedlex-versionen` rot: Pin `erv` html-6 ≠ kanonisch html-7** *(gemeldet von zwei Prüfern 12.9.2026, Vorbestand, Netz-Tor)* — gelöst mit PR #806 (`56d33dae8`): Pin auf die kanonische Fedlex-Manifestation html-7 nachgeführt (Republish derselben Konsolidierung 2025-01-24). Erster Beleg «byte-identisch» war falsch, in der Gegenprüfung (Opus, #808) korrigiert (§2b, ergänzt statt überschrieben): richtig ist **textgleich, Markup abweichend** — Extraktionsgleichheit über 224/224 Artikel-SHAs belegt.
  - [x] **`QS-CURRENCY-KANON-FRISCHE`** — gelöst mit PR #808: `fedlex-frische.yml` regenerierte das Manifest nur bei einem `cache.sh`-Diff, während `gen:fedlex-wiedervorlage` `currency.json` (ingestierte DB-Quelle) in JEDEM Lauf schreibt — Lauf 34107274098 scheiterte an `check:datenhaltung`, PR-Schritt `skipped`. `datenhaltung:manifest` läuft jetzt unbedingt nach der Regenerierung. Dazu Pin-Identitäts-Sonde in `scripts/normtext/cache-pin-befund.ts`: ein `/tmp`-Cache gilt erst nach Marker-Abgleich (`eli|konsolidierung|html-N`) als gültig, nicht mehr nach reiner Inhalts-Sonde.
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
  - [x] **Erledigt:** LIK 2026-05→07 · ESTV-MWST/AIG · Verfahrens-Gap — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 7.9.2026 (2).
  - [x] **§17-Wurzelfix 12.9.2026 (PR #803):** `check:materialien` Finding 7 war wanduhr-abhängig (2. Vorfall in 24 h, #789 + heute) — ✅ Wortlaut: ROADMAP-CHRONIK.md.
  - [ ] **§17-Wurzel-Fix:** soft-law-Detektor prüft nur den ToC-Token, nicht das Publikationsdatum — Detektor zusätzlich auf `stand`-Wechsel, Token nur über cipherDisplay-Anker.
  - [ ] Sieben Materialien-System-Befunde (a)–(h) je mit eigenem Wurzel-Fix — Liste im Fahrplan-§.
  - [ ] **Auflagen Gegenprüfung PR #623 (2.9.2026):** Stand-Wächter deckt 34/48 ESTV-Dokumente — 14 nur geloggt bzw. Fallback-Ziffer ohne Dok-Stand (`check-materialien-netz.ts:203-205`, `estv-mwst-stand-probe.ts:57`); Delay 300 ms vs. Doku «~1 req/s» angleichen. Restliste Befunde (b), (c), (e), (h) + `check:vernehmlassungen-netz` 8-Key-Blindheit.
  - [ ] **§17 Tor-Reihenfolge: Generat-Konsistenz vor Merge-Schutz** *(Befund Gegenprüfung PR #618, 2.9.2026)* — `check:verfall-ui`/`check:zaehler` laufen im Tor-Lauf erst NACH dem Merge-Schutz und damit bei fehlendem Verdikt nie; die Gegenprüfung sah eine Projektion, die kein Tor angefasst hatte. Billige Generat-Checks vor den Merge-Schutz ziehen oder Pfad-Hook auf `parameter-verfall.md` → `gen:verfall`.
  - [ ] **Pflegetermin 1.10.2026:** 14 «Künftige Fassung»-Einträge (OR/StGB/BankG/GwG u. a., SR-Tabellen) werden fällig — Register `parameter-verfall.md`, vorher nachführen (Hinweis Referenzzins-Agent 2.9.2026).
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
  **Detail:** [FAHRPLAN-RECHTSPRECHUNG.md](fahrplaene/FAHRPLAN-RECHTSPRECHUNG.md) §15.

- [ ] **Konsultieren-Klingen — Dach der Rechtsprechungs-Fläche** *(`W2·6`, `[OF]`, amtlich; Phase 3)*
  <!-- @meta id: W2·6 · status: ready · blocker: null · dep: [] · feld: rechtsprechung · fahrplan: fahrplaene/FAHRPLAN-RECHTSPRECHUNG.md -->
  Leitsatz David 16.8.2026 (dejure-Modell): **Nachweisdatenbank statt Volltextsammlung** —
  Fundstellen + Link auf die amtliche Quelle, Anbindung entscheidsuche.ch.
  **Detail:** [FAHRPLAN-RECHTSPRECHUNG.md](fahrplaene/FAHRPLAN-RECHTSPRECHUNG.md) §13.
  - [ ] **Gerichts-/Behörden-Adressregister** — Lese-/Index-Schicht über die bestehenden Bestände, **kein Datenduplikat** (§5); Quelle `bibliothek/behoerden/`.
  - [ ] **Entscheid-Filter über die API — Richter + allgemeine Facetten** — eine Bau-Fläche (Turso-Schema + `api/suche.ts` + Facetten-UI); Risikopfad ⇒ Gegenprüfung. [FAHRPLAN-ENTSCHEIDSUCHE-AUSBAU.md](fahrplaene/FAHRPLAN-ENTSCHEIDSUCHE-AUSBAU.md) §7.
  - [ ] **Zitationsnetz: Rückwärts-Zitate + Leitentscheid-Score** — deterministisch aus dem Zitat-Graph (§2 — kein Ranking-Modell); Merkposten LM-042 («ff.»-Sammelzitate) als Auflage. [FAHRPLAN-VERZAHNUNG-UI.md](fahrplaene/FAHRPLAN-VERZAHNUNG-UI.md) §10.
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

- [x] **Design-Identität: eigene Farb- und Schrift-Handschrift** *(`W2·24-DESIGN-IDENTITAET`, David 5.9.2026)*
  <!-- @meta id: W2·24-DESIGN-IDENTITAET · status: done · blocker: null · dep: [] · feld: design · fahrplan: fahrplaene/FAHRPLAN-DESIGN-IDENTITAET.md -->
  ✅ **erledigt 7.9.2026 (PR #739, e2ac7def9)** — Handschrift «Sammlung»: R1–R13 samt Nachzügen, Gesamtprüfung
  (Ästhetik + Funktions-Inventar 90 OK / 0 verloren), Reglement §F0. Protokolle
  `abnahme/design-identitaet/`; Zielbeschreibung: ROADMAP-CHRONIK.md, Umschichtung 7.9.2026.
  **Nachwünsche 7.9. (Tag):** 16 weitere PRs #744–#761 (D34–D44, D35-F1…F4, L6, R13B, R14, R14b) —
  Tabelle Thema/PR/SHA/Protokoll in STRUKTUR.md, Abschnitt «Nachwünsche 7.9.» (zuletzt #761 ae32c5c4e).
  **Detail:** [FAHRPLAN-DESIGN-IDENTITAET.md](fahrplaene/FAHRPLAN-DESIGN-IDENTITAET.md) §1 — Stand je Runde dort in §6, Folgeschritte in §8.
  - [ ] **⚖ öffnet Entscheide im zweiten Pane** *(`W2·24-C`, Variante C zu D33)* — heute Variante A (überlagerndes Blatt, Δ=0); C = echtes zweites Pane (Split-Regel M3). **Zuerst prüfen, ob D35-F2 (#758, Erlass-Blatt) das schon abdeckt** — sonst doppelter Weg zum selben Inhalt. Fahrplan §8.
  - [x] **Bezüge-Zeile: Kopfzähler gefiltert/ungefiltert** — ✅ entschieden 11.9.2026 (Mandat David «führe alles durch»): EINE Zahl, gefiltert bei aktivem Filter, Gesamtzahl nur im `title`. Detail: `FAHRPLAN-DESIGN-IDENTITAET.md` §9 Z3.
  - [ ] **Nachzüge aus R13 und Gesamtprüfung** — R13-11 Reiter-Adress-Kern · Geschäftsnummer-Kurzform statt R8-Allowlist · `StatusBadge` «maschinell» (§8) · `qsui-hierarchie` Vorlagen-Schranke 1.2533. Fahrplan §8.
  - [x] **L6 · PaneKopf-Name** — ✅ gelandet 7.9.2026 (PR #746, `d32e5bf80`), Protokoll `L6-PANEKOPF.md`.
  - [x] **Leerer 34-px-Reiterstreifen auf «/»** — bleibt (David 7.9.2026, wie empfohlen).
  - [x] **ZGB-Reiter am Dokumentanfang** — «ZGB» bleibt (David 7.9.2026, wie empfohlen).
  - [x] **Orchestrator-Entscheide 7.9.2026 bestätigt** (D33 A · D32 · N1 · N4 · R13; David «alles wie empfohlen»).
  - [x] **Orchestrator-Entscheide vom Tag 7.9. — David 7.9.2026 «alles bestätigt»:** — ✅ (Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 8.9.2026 (Landung)).
  - [x] **D45 · Entscheid-Klick in der Fusszeile öffnet daneben** — ✅ umgebucht 11.9.2026 nach `W2·26-FUNKTIONSZEILE`. Detail: `FAHRPLAN-DESIGN-IDENTITAET.md` §9 Z5.
  - [x] **«Daneben öffnen» in der Funktionszeile** — entfällt (David 7.9.2026, D44 #760: Aktion bewusst entfernt; Erlass-Kopf behält «Daneben öffnen»).
  - [x] **Bezüge-Zähler in den Erlass-Payload** *(D34-Nachfix, Korpus ⇒ **Gegenprüfung Pflicht**)* — ✅ umgebucht 11.9.2026 als eigener Schritt `W2·26-FUNKTIONSZEILE-ZAEHLER`.
  - [x] **OR-Leser trägt 15'239 Knöpfe im DOM** *(§15, seit F1 sichtbar)* — ✅ umgebucht 11.9.2026 nach `W2·26-FUNKTIONSZEILE`. Detail: `FAHRPLAN-DESIGN-IDENTITAET.md` §9 Z6.
  - [ ] **Rest-CLS 0.0003 im Leser-Kopf** — `LeserKopf.tsx:289` (`data-v3-kopf-griffe`, Klassenwechsel `gap`/`pl`); klein, aber der einzige verbliebene Sprung in `leser-r1-r2`.
  - [ ] **«OR» dreimal untereinander @1440** *(L6-Nebenbefund)* — Reiter · Pane-Titel · Leser-Kennung; der V3-Leser sollte sein Kürzel im Pane abgeben.
  - [ ] **Leser-Mount auf langsamem Netz messen** — Nachlauf zu #743/L2 (grosser Erlass: Ankersprung erst nach der zweiten Ladung, Anker-Oberkante 433 px statt 193 px).
  - [ ] **Budget-Entscheid Entry 99,5 %** (59.7 / 60.0 KB) — der nächste Kopf-Bau reisst das Budget: Lazy-Laden oder Budget-Hebung (§15). **Wartet auf David.**
  - [ ] **Jules-Kandidaten** (grüne Spur, nach Landung W2·24): toter CSS-Rückbau `[data-lr-spiegel]`/`.lr-notiz*`/alte Druckregeln in `index.css` · Typ-Härtungen `lib/tabs.ts`/`tabGruppen.ts` · Allowlist-Pflege `e2e/kein-abschnitt.allow.json`. Datei-Splits erledigt (ArtikelLeser R6F; `Reiterleiste.tsx` 7.9. gemessen 650 Z.).

- [x] **Funktionszeile am Artikelende überarbeiten** *(`W2·26-FUNKTIONSZEILE`, Mandat David 11.9.2026)*
  <!-- @meta id: W2·26-FUNKTIONSZEILE · status: done · blocker: null · dep: [] · feld: leser · fahrplan: fahrplaene/FAHRPLAN-DESIGN-IDENTITAET.md -->
  Bau läuft seit 11.9.2026 in Worktree `feat/w226-funktionszeile`. Fassung zugeklappt zeigt nur
  «Gilt seit …», Akkordeon je Artikel, Fussnoten-Option blendet auch SR-Nummer-Fussnoten aus,
  Aktionen nur bei Hover/Fokus/offener Rubrik, D45-Split, Umbenennung `BezuegeKopf` →
  `Funktionszeile`. **Detail:** [FAHRPLAN-DESIGN-IDENTITAET.md](fahrplaene/FAHRPLAN-DESIGN-IDENTITAET.md) §9.

- [x] **Bezüge-Zähler in den Erlass-Payload** *(`W2·26-FUNKTIONSZEILE-ZAEHLER`, D34-Nachfix)*
  <!-- @meta id: W2·26-FUNKTIONSZEILE-ZAEHLER · status: done · blocker: null · dep: [W2·26-FUNKTIONSZEILE] · feld: korpus · fahrplan: fahrplaene/FAHRPLAN-DESIGN-IDENTITAET.md -->
  Bezüge-Zähler (Entscheide/Materialien/Verweise/Rechner) in den Erlass-Payload statt eigenem
  Fetch — heute entstehen die Fuss-Zeilen erst in der zweiten Render-Runde. Korpus/Generator ⇒
  **Gegenprüfung Pflicht**, Golden byte-gleich bzw. deklarierter Re-Bless.
  **Detail:** [FAHRPLAN-DESIGN-IDENTITAET.md](fahrplaene/FAHRPLAN-DESIGN-IDENTITAET.md) §9.

- [x] **Reiter anheften und Arbeitsmappe** *(`W2·25-ARBEITSMAPPE`, §5a Ziff. 5/9 · R11-M5)*
  <!-- @meta id: W2·25-ARBEITSMAPPE · status: done · blocker: null · dep: [W2·24-DESIGN-IDENTITAET] · feld: design · fahrplan: fahrplaene/FAHRPLAN-DESIGN-IDENTITAET.md -->
  Angeheftete Kürzel-Reiter (OR/ZGB/ZPO, links, ohne ✕, überleben «Alle schliessen») und die
  benannte Arbeitsmappe (offene Reiter lokal speichern/öffnen, als Adresse teilbar,
  deterministisch ohne Konto). **Risiko D16:** Anheften darf keine zweite Anzeige-Ordnung sein,
  sondern muss den flachen Speicher umsortieren — sonst Rückfall in den behobenen Zieh-Bug.
  **Detail:** [FAHRPLAN-DESIGN-IDENTITAET.md](fahrplaene/FAHRPLAN-DESIGN-IDENTITAET.md) §7.

- [ ] **Perf-Rest Leser: `fremdRoutingFormB` / `artikelnPluralVerweise`** *(`W2·24-PERF-REST`)*
  <!-- @meta id: W2·24-PERF-REST · status: ready · blocker: null · dep: [W2·24-DESIGN-IDENTITAET] · feld: leser · fahrplan: fahrplaene/FAHRPLAN-DESIGN-IDENTITAET.md -->
  Zwei Fix-Vorschläge aus `abnahme/design-identitaet/PERF-LESER.md` (`fedlex/parser.ts`
  `FREMD_FORM_B`, Aufruf `NormText.tsx`; ~2.3 s). **Die Root-Cause war zum Messzeitpunkt NICHT
  abschliessend verifiziert** — Ziel ist erst verifizieren (misst der gelandete Fix das schon
  weg?), dann fixen; ohne Verifikation kein Eingriff (§7). Risikopfad (`src/lib/fedlex`) ⇒
  **Gegenprüfung Pflicht**, Merge gesperrt bis Verdikt. Messregel: nie neben laufendem Build
  oder e2e (Skill `perf` Bauregel 7).
  - [ ] **`check:perf-budget` deckt die Struktur-Sidecars nicht** *(Befund 11.9.2026, #791)* — `public/normtext/**/struktur/*.json` (vorbestehend, seit #791 um die Zähler-Nutzlast
    gewachsen) läuft ausserhalb der festen Deckel-Liste; eigene Zusicherung nachziehen.

- [ ] **UI-Befundliste extern (210 Befunde, Cowork 29.7.2026)** *(`W2·17-UI-BEFUNDE`)*
  <!-- @meta id: W2·17-UI-BEFUNDE · status: ready · blocker: null · dep: [] · feld: design · fahrplan: fahrplaene/FAHRPLAN-UI-BEFUNDE.md -->
  Externe Sichtprüfung, geschnitten nach Bauteil; alles reine Darstellungsschicht, Blocker zuerst.
  **Detail:** [FAHRPLAN-UI-BEFUNDE.md](fahrplaene/FAHRPLAN-UI-BEFUNDE.md) §24.
  - [x] **Erledigt:** B6-N1 · B6-N2 · B7-N1 — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 7.9.2026 (2).
  - [ ] **B8 · Menüinhalt, Zustandsanzeige, Scrollbereiche (K-03 + K-07)** — 10 Befunde (Blocker 1 · Hoch 3). §9. · **Blocker LM-061 vorgemessen 30.8.2026, wartet auf David:** News-Reihe verbirgt 2'588 px ohne Affordanz — der Bau würde den Entscheid D11 («angeschnittene Karte IST die Affordanz») revidieren. Messung + Bauform-Vorschlag im Fahrplan.
  - [x] **B9 · Textsatz und Umbruch (K-12)** — 12/12 geschlossen (Fahrplan §10, Nachzug Häkchen 13.9.2026).
  - [x] **B10 · Aktions-Anker, Symbolknöpfe, Trefferflächen (K-09b)** — 7/7 geschlossen 4.9.2026 (Fahrplan §11, Nachzug Häkchen 13.9.2026).
  - [ ] **B11 · Karten (K-04)** — 12/13, Rest LM-032 zurückgestellt. §12. · **B12 · Eingabe-/Auswahlfelder (K-08a)** — 9/11, Reste LM-066/LM-075 zurückgestellt (dokumentierte Entscheide). §13. *(Stand 13.9.2026)*
  - [ ] **B13 · Zahlen-, Datums-, Zählformate (K-11)** — 8/12, Reste LM-109/110/114/117 zurückgestellt. §14. · **B14 · Brotkrume/Kopfzeilen (K-19a)** — 4/8, Reste LM-183/184/197/198 zurückgestellt. §15. *(Stand 13.9.2026)*
  - [x] **B15 · Umschalter, Tabs, Akkordeons (K-06)** — 9/9. §16. · **B16 · Seitengerüst/Inhaltsbreite (K-13)** — 8/8. §17. *(Nachzug Häkchen 13.9.2026)*
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
  - [ ] **rectifies-Wächter blind für Fedlex-Berichtigungen ohne HTML** *(Gegenprüfung #834, 12.9.2026)* — 7 von 25 geprüften `rectifies`-Kanten sind nicht abrufbar, weil Fedlex die Berichtigung nur als doc/pdf-a führt, nicht als HTML; lesbar via `textutil -convert txt` (macOS) bzw. PyMuPDF. Tor um die doc-Manifestation erweitern, damit die Klasse «nicht abrufbar» auf 0 sinkt.
  - [ ] **Bund-Pfad löst «Art. 9 BMV» auf die aufgehobene Fassung auf** *(Gegenprüfung #833, 12.9.2026)* — `src/lib/fedlex/tabelle.ts` löst das Kürzel weiterhin auf die per 1.3.2026 aufgehobene Fassung `cc/2009/423` auf, obwohl `aufhebungen.ts` die Nachfolge kennt. Die in #823 gebaute Fassungs-Reihe (`normKeyFuerAbk` mit Datum) auch im Verweis-Resolver nutzen bzw. auf die geltende Fassung mit Datumskontext auflösen.
  - [ ] **Plan-Buchungs-Commit wirft wartende Auto-Merge-PRs auf BEHIND** *(§17-Prozessfund 13.9.2026, PR #843)* — `plan-buchung.yml` schreibt nach jedem Merge einen `[skip ci]`-Commit auf main; bei `strict`-Schutz fällt jeder offene Auto-Merge-PR auf BEHIND und kostet Rebase + vollen CI-Lauf (~25 min). Wurzel-Fix: der Buchungs-Workflow aktualisiert danach alle offenen PRs mit aktivem Auto-Merge (`gh pr update-branch`), oder Merge-Queue (David-Handgriff, offen). Bis dahin: nach jeder Landung sofort rebasen.
  - [ ] **Flacker-Fall `leser-v3-blatt` (c) ⌘K im Split** *(CI #844, 13.9.2026; isoliert 6/6 grün auf Branch und main)* — last-/parallelbedingt, deckt sich mit «⌘K-Vorlauf im Split» (CI #711); Fahrplan §4.
  - [ ] **WARTET AUF DAVID:** Sollen die Meta-Routen (/ueber, /methodik, /einstellungen, /kontakt) einen Reiter tragen? Seit R14b (`istReiterPfad` gestrichen) ist jede Route Reiterinhalt — Orchestrator-Entscheid, Bestätigung offen (FAHRPLAN-DESIGN-IDENTITAET §7, Korrektur 13.9.2026).
  - [x] **Reiterleiste: sechs stille Fehler** — ✅ 13.9.2026, PR #842 (+ Nachzug R8-Sweep mobil), dazu Welle 2 #843 (Tastatur-Ring, Alt+Q, Ring-Ordnung, Menü-Vorlauf, 24-px-Griffe) und Welle 3 #844 (Kopf weicht am Anschlag, Rand-Schub, Reiter als Links, Hover-Karte, Touch-Umordnen); Specs Fahrplan §4.R/§4.R2/§4.R3. *(Sichtprüfung + Code-Zweitblick 13.9.2026, Auftrag David «bau 1 bis 6»)* — Alt-Kürzel am Mac (`e.key` statt `e.code`), Render-Kaskade beim Scrollen, Kappungs-Verluste ohne Ring, gestutzte Beschriftungen ab 7 Reitern, Nachbar-Wahl nach Schliessen, stehender Blatt-Filter. Spec: Fahrplan §4.R «Reiterleiste 13.9.2026».

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

- [x] **Drift-Nachverifikation der Tarif-Stammdaten (34 Erlasse, 93 Einträge)** *(`W3-TARIF-NACHVERIFIKATION`, Auftrag David 6.9.2026, Befund Tor-Erstlauf `check:tarif-drift`)*
  <!-- @meta id: W3-TARIF-NACHVERIFIKATION · status: done · blocker: null · dep: [] · feld: werkzeuge -->
  ✅ Gelandet 8.9.2026 (PR #764, Gegenprüfung Opus bestanden: 4 Wertkorrekturen amtlich nachgerechnet, DRIFT 0, `check:tarif-drift` in der Netz-Kette; Drift-Tor: unerreichbar ⇒ rot). Ziel/Grenzen/Belegkette wörtlich: ROADMAP-CHRONIK.md, Umschichtung 8.9.2026 (Landung). Offene Folgeschritte unten.
  - [ ] **OW Beurkundungstarif Ziff. 35 lit. a/b — Zuordnungsverdacht** *(Nebenfund 6.9.2026)* — `beurkundung.ts` (OW) etikettiert die Staffel als lit. a; amtlich ist lit. a ein Rahmen 500–2000, und erst lit. b verweist auf Ziff. 31 Bst. a. Kodiert ist lit. b. Eigener Prüfschritt: Wert und Etikett zusammenführen.
  - [ ] **VS LTar Art. 15 — zwei Einträge, dieselbe Norm, verschiedene Begründung** *(§5, 6.9.2026)* — `schlichtung.ts` (50–500) und `nicht-vermoegensrechtlich.ts` (60–500) berufen sich beide auf Art. 15 mit demselben Hinweis-Baustein; amtlich sind Abs. 1 lit. a/b (170–350) und Abs. 2 (60–500) verschiedene Tatbestände. Klären, welcher Absatz je Rechner gilt, dann EINE Quelle.
  - [ ] **Härtungen `check:tarif-drift`** *(Wurzelbefunde 6.9.2026, je mit Rot-Beweis; `scripts/tarif/**` ist Risikopfad)* — (a) zeigen `artikel` und `quelleUrl` auf verschiedene Erlasse, urteilt das Tor über den falschen (belegt AG 725.100/725.110, SH 221.101/211.433) ⇒ «unklar/Zuordnung» statt DRIFT; (b) pinnt die URL die geltende Fassung, bleibt ein uralter `stand` unsichtbar (11 FR-261.16-Einträge trugen «7.10.1986» bei Pin auf 2016) ⇒ Zusatzbefund «Pin aktuell, stand > 1 Jahr daneben»; (c) 13 Einträge nannten das Beschlussdatum GENAU DIESER Fassung (FR 214.5.16, BS 154.810) ⇒ als gültigen Stand akzeptieren.
  - [ ] **Werkzeug-Falle Norm-PDFs** *(6.9.2026, gehört ins Fehlerbuch-Dach `W2·18-FEHLERBUCH`)* — `Read` auf PDF > 200 KB blockt `lese-schutz.py`, `pdftotext` fehlt auf dieser Maschine; funktionierender Ersatz: PyMuPDF (`python3 -c "import fitz; …"`).
  - [ ] **Konflations-Wächter breiter** *(Gegenprüfungs-Nachtrag D2, 12.9.2026, PR #816, gehört ins Fehlerbuch-Dach `W2·18-FEHLERBUCH`)* — `findeFremdeFundstelleImBody` (`scripts/normtext/entscheide-koerper-konflation.ts`) sieht nur Bodies mit einem laufenden Seitenkopf-Marker («BGE … S. …»); Prüfmenge effektiv 6/1259 BGE (0,5 % Abdeckung), kurze Auszüge ohne Seitenumbruch bleiben blind. Zwei zusätzliche, unabhängige Signale würden den Anlassfall `bge_152_V_2` BEIDE gefangen haben: (a) Regeste-Normen vs. Body-normKeys — die amtliche Regeste nennt ATSG/IVG, der (damals kontaminierte) Body zitierte KLV/MVG/BV/OR/SVG, keine Schnittmenge; (b) Regeste-Sprache vs. Body-Sprache — die Regeste von 152 V 2 ist italienisch (`Regesto`), der kontaminierte Body deutsch. Beide Signale sind rein aus bereits persistierten Feldern ableitbar (kein Netz nötig); als eigener Schritt zu bauen, mit Rot-Beweis am (inzwischen quarantänierten) Alt-Zustand von `bge_152_V_2`.
  - [ ] **`BMV`-Zitat löst auf die aufgehobene Fassung auf** *(Nebenfund PR #823, 12.9.2026, gehört ins Fehlerbuch-Dach `W2·18-FEHLERBUCH`)* — `src/lib/fedlex/tabelle.ts` führt den FEDLEX-Schlüssel `BMV` weiter auf `cc/2009/423`; ein blosses Zitat «Art. 5 BMV» im Fliesstext endet über die Token-Erkennung (`erkenneFedlexGesetz`) darum auf der **aufgehobenen** Fassung, und `src/lib/fedlex/positivliste.ts` kennt zur geltenden Verordnung vom 13.6.2025 weder einen `TITEL_EINTRAEGE`-Eintrag (Fragment «über die eidgenössische Berufsmaturität») noch ein `ERLASSDATUM` (2025-06-13). **Heute wirkungslos** (korpusweite Messung 12.9.2026: null echte Zitate der Berufsmaturitätsverordnung) — darum eigener Schritt statt Mitnahme. Zu klären ist dabei die GENERELLE Regel für Totalrevisionen: soll das nackte Kürzel auf die geltende Fassung zeigen und die aufgehobene einen eigenen Schlüssel tragen (`BMV-2009`), oder bleibt die Datums-Prüfung aus §V-7 der einzige Arbiter? Mit Rot-Beweis an einem konstruierten Zitat.
  - [ ] **Prerender-Shell nennt aufgehobene Erlasse «geltend»** *(Nebenfund PR #823, 12.9.2026, gehört ins Fehlerbuch-Dach `W2·18-FEHLERBUCH`)* — `src/lib/seo-detail.ts:359` schreibt in die crawlbare Kopfzeile JEDES Erlasses fest «amtliche Fassung (geltend)», auch wenn `e.aufgehoben` gesetzt ist (zwei Zeilen darüber wird das Feld bereits ausgewertet). Gemessen an `dist/gesetze/bund/BMV.html` (Build 12.9.2026): Zeile «BMV · SR 412.103.1 · Stand 2016-08-23 · amtliche Fassung (geltend)», kein Aufhebungs-Hinweis, kein Nachfolge-Link — der Reader-Kopf ist seit PR #823 ehrlich, die prerenderte Fassung für Suchmaschinen und Nutzer ohne JS nicht (§8). Fix: Wortlaut am `aufgehoben`-Feld ausrichten und den Nachfolger (sofern im Korpus, `erlassKeyVonEli`) auch dort verlinken; Rot-Beweis über die erzeugte BMV-Shell.
  - [ ] **Tabellen-`<dt>`-Marken «–»/[tab] als Aufzählungsmarken extrahiert** *(Nebenfund PR #836, 12.9.2026, gehört ins Fehlerbuch-Dach `W2·18-FEHLERBUCH`)* — betrifft ZPO art_250, StG art_5 f., BV art_197: Extraktions-Altlast, bei der `extrahiere-fedlex.ts` Tabellen-`<dt>`-Zellen wie Aufzählungs-`<dt>` behandelt und ihnen fälschlich eine Aufzählungsmarke zuweist. Fix im Extraktor — Tabellen-`<dt>` von Aufzählungs-`<dt>` trennen —, nie in den Daten selbst geflickt (§5).
  - [ ] **216 Struktur-Sidecars ohne `stand`/`fassungsToken`** *(Nebenfund PR #836, 12.9.2026, gehört ins Fehlerbuch-Dach `W2·18-FEHLERBUCH`)* — additiver Alt-Rollout aus #824: nur die 12 Sidecars aus #838 tragen die Felder bereits, die übrigen 216 noch nicht. Eigener Regenerations-Schritt aus dem Cache mit Skelett-Nullprobe, kein Inhaltsdiff erwartet.
  - [ ] **Test-Budget `scripts/datenhaltung/suche.test.ts`** *(Messung 6.9.2026 zum bekannten Wurzel-Fix-Kandidaten)* — der `beforeAll` baut den ganzen Suchindex bei 95 s Budget. Seriell je ein Lauf: sauberer `main` 91.79 s grün (3 s Luft), Worktree kalt 119.72 s rot, warm 43.28 s grün. Ausschlag ist kalt/warm, nicht Inhalt (+0.07 % Korpus). Fixture verkleinern oder Budget an die kalte Messung binden.

---

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
  - [ ] **Steuerdeckel-Entscheid — wartet auf David:** Streichkandidat unter `scripts/check-*.ts` (5.9.2026 Prosa-Diät statt Deckel-Hebung; Hooks ~0 B Luft) *(sechs erledigte Nebenpunkte 5.9.2026 umgeschichtet: ROADMAP-CHRONIK.md, Umschichtung 6.9.2026).*

- [ ] **Fremde Agenten im Bau — Jules, Antigravity, Gemini** *(`QS-FREMDAGENTEN`, Freigabe David 3.9.2026)*
  <!-- @meta id: QS-FREMDAGENTEN · status: ready · blocker: null · dep: [] · feld: betrieb · fahrplan: fahrplaene/FAHRPLAN-FREMDAGENTEN.md -->
  Ziel: neben Claude Code eine zweite Bauequipe (Jules) und einen Lese-/Sichtungsweg (Antigravity,
  Gemini) auf der grünen Spur nutzen — risikofrei, eng umrissen, Tor-geprüft. Grenzen: Risikopfade
  bleiben Claude-Unteragenten, Verdikte und Landung bleiben bei Claude, die fachliche Abnahme bei
  David; jede Phase hat eine Rückbau-Schwelle statt einer Bewachung.
  **Detail:** [FAHRPLAN-FREMDAGENTEN.md](fahrplaene/FAHRPLAN-FREMDAGENTEN.md) §2.
  - [x] **Erledigt:** Phase 0 · Pilot Jules · Diskrepanz-Finder — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 7.9.2026 (2).
  - [ ] Zweitblick-Messung — erster Durchgang eingetragen (#658, VZV/AMBV: 1 echt vorbestehend, 7 Schein, 0 verpasst; 1/5, Schwelle §3 noch nicht erreicht), weitere vier im Alltag. §2/§3.
  - [ ] Phase 4 Skalierung läuft — Landungsquote 83 % (n=6), Median 30 min ⇒ Ticketzahl 3–5 offen; Jules-API mit Plan-Gegenlesen (D4) noch offen; Antigravity-Claude als Bauarbeiter (D7) **geparkt** (Bauleiter/David-Chat 4.9.2026, kein Zwischenmarkt zu Jules — Wiedervorlage nur bei Kontingent-Engpass). §2.
  - [ ] **Wiedervorlage «Google-Ökosystem-Sichtung»** *(Dach QS-FREMDAGENTEN, Phase 4)* — alle 3 Monate, erste Fälligkeit **Dezember 2026**: Gemini-Recherche (agy, `read_url(*)`) «neue Google-KI-Produkte/Modelle, Jules-/Antigravity-Changelog seit \<Datum\>», Bewertung ~30 min, Eintrag in Fahrplan §7. Maschinischer Anstoss: `retro:17` Regel (h) ab 30 Tagen seit `bibliothek/register/antigravity-stand.json`. §7.
  - [ ] **`scripts/plan/selbstoptKern.ts` über der Schlankheits-Schwelle, unregistriert gefunden** *(Nebenfund Abschluss-Session 4.9.2026)* — 1094 Z. (Schwelle 800), vermutlich durch #666 gewachsen, ohne dass jemand `npm run schlankheit:update` fuhr; diese Session hat die Datei nur ins Baseline-Register aufgenommen (kein Split, Doku-Auftrag), Split bleibt offen. `src/tests/plan-selbstopt.test.ts` (1087 Z., ebenfalls jetzt registriert statt gesplittet) — *seit PR #699 (Jules 8, 5.9.2026) gesplittet: 500/236/382 Z., Baseline-Eintrag entfernt* hängt dran — beide teilen sich denselben Wächter-Blick.

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
  - [ ] **E2E-Flake Shard 2/8 — Wurzel messen statt neu starten** *(Befund QS-FREMDAGENTEN, Session 4.9.2026)* — «IA-1 Named-Article-Klick» OR 336c/257d sowie die Richter-Facetten-Trefferzahl flackerten 3× auf Branches OHNE App-Änderung (#650, #658 ×2), Rerun jeweils grün. Möglicherweise dieselbe Hydrations-Wurzel wie der Eintrag oben, möglicherweise eine eigene Wartezeit-/Prerender-Race — vor dem nächsten Rerun-only-Fix die Wurzel messen (Wartezeit-Histogramm der zwei Specs über mehrere Läufe), nicht nur den Shard neu starten.
  - [ ] **§17 BEHIND-Schleife durch Plan-Buchung** *(Befund Parallel-Session 2.9.2026, an einer Nacht mit 5 offenen PRs belegt)* — jeder Squash-Merge erzeugt via `plan-buchung.yml` einen Folge-Commit auf main (`[skip ci]`), der alle offenen PRs sofort BEHIND setzt; bei «up to date»-Pflicht kostet jede Landung damit einen zweiten vollen CI-Lauf (15–20 min). Wurzel-Kandidaten: Buchung im PR-Branch vor dem Merge statt auf main, oder Merge-Queue (`QS-ORG-UMZUG`, David-Entscheid). Bis dahin: Landungen zwischen Sessions ansagen, je Seite genau ein Nachzug.
  - [ ] **§17 F13 klären: Warum wurde der main-Lauf 1123b1974 (#629) «cancelled»?** *(2.9.2026)* — `cancel-in-progress` ist für main seit 26.7. aus; trotzdem endete der Merge-Lauf ~30 s nach dem Folge-Push 9cdbb6a55 als cancelled, der Deploy fehlte (Sidecar 404, Heilung per `gh run rerun`). Kandidaten: Selbst-Cancel-Schritt («BEHIND-PR … nachziehen»/«Geplante Workflows»), GitHub-seitig. Rot-Beweis mit zwei schnellen main-Pushes, dann Wurzel-Fix; bis dahin Skill `landung` Nachkontrolle 0.
  - [ ] Totcode-Meldung wird echtes Tor `check:tot` — blockierend bei NEUEN Meldungen (Basis: 1). §3.2.
  - [ ] Dependency-Frische: `npm audit` + Majors + knip-Unlisted als Meldung, nie Stopper. **Lockfile nur über `npx npm@10`.** §3.3.
  - [ ] tailwind 3→4-Migration (PR #503; ~249 className-Dateien visuelle Regression — kein Dependabot-Merge).
  - [ ] Dependabot-Lock-Wurzelfix: npm-Major-Mismatch erzeugt fehlende genestete Einträge (H-8-Muster) — Weg finden, der den Lock automatisch mit npm@10 nachzieht.
  - [~] **(d) Datenhaltungs-Optimierung — Suche-Edge-Umzug Kanton** (31. ✅ Teilerfolge K0–K3 wörtlich: ROADMAP-CHRONIK.md, Umschichtung 8.9.2026 (Landung).
    **VOR DEM MERGE (Landungs-Protokoll aus F1):** Sync und Deploy hängen am selben Push und warten NICHT aufeinander — gemessen 5,3–6,6 min (Sync) gegen 14,8 min (Prod live), im Normalfall also die sichere Reihenfolge, aber ein Rennen. **Ohne `TURSO_AUTH_TOKEN` überspringt der Sync-Job und endet grün, während der Deploy ausliefert** — dann bleibt das Fenster offen bis zu einem Sync von Hand. Billigster Riegel: «Turso-Serving-Sync» per `workflow_dispatch` auf dem Branch fahren, **bevor** gemergt wird (die alte Edge-Funktion verträgt den neuen Index — verifiziert; `daten-manifest.json` unverändert, `check:turso-frische` bleibt also grün).
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
  **Ergänzt 1.9.2026 (Leser-Tempo gebaut, A/B n=5, alte Zahl bleibt stehen — §0/2b):** Das
  753-KB-`rechtsprechung/register.json` lädt nicht mehr auf Gesetzes-Leserseiten, und der Prerender
  lädt Register/Struktur im Kopf vor → OR **10 368 → 7 899 ms @4×+4G (−23,8 %)**,
  **38 296 → 27 432 ms @6×+3G (−28,4 %)**; ungedrosselt misst derselbe Basis-Stand **780 ms**, die
  17.8.-Zahl ist dort also nicht mehr reproduzierbar. **Bestands-Defekt dabei gefunden UND gefixt:**
  `InhaltsKopf` montierte die Sprung-Rückmeldungen beim Wechsel auf `kopfzeileSelbst` um → die
  Deep-Link-Ansage «Springe zur verlinkten Stelle …» blinkte (Aus-Flanke auf die Millisekunde mit
  dem Zweigwechsel, 3/3); jetzt EIN Träger mit zwei Zuständen, Markup byte-gleich, R7 50/50 grün,
  volle e2e 722/722. **Offen:** der Snapshot-Preload (+3–10 %) hängt an einer ZWEITEN
  Reihenfolge-Stelle im Spy-Effekt (`inhalt-hooks.tsx`, 20 Specs, nicht untersucht) ·
  K3-Chunk-Kaskade · Reader-Kopf-Reflow (Design-Entscheid §13) · `hydrateRoot` (eigener PR unter
  `QS-BASIS`).
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
  - [~] **V7 Feiertags-Gegenprobe** als reiner Test: kantonale Feiertagsformeln vs. date-holidays CH (Abweichung = Prüfauftrag, kein Fix ohne Quelle). Beleg: Rangliste #15. `src/tests/feiertage-gegenprobe.test.ts`, 26 Kantone × 2024–2027; 45 Rohabweichungen, 43 über eine kommentierte Ausnahmeliste (Norm/Kommentar-Beleg je Eintrag) als gewollt erklärt, 1 offen: Näfelser Fahrt GL 2027 (`test.skip`, TODO(David) — Formel nennt 1.4., date-holidays 8.4., nur 2026 amtlich gegen gl.ch verifiziert).
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
  ✅ M2 (#767) · M1/M3/M4/M5 (#773) · Flacker-Wächter (#779, Melde-Modus bis 22.9.2026, dann hart) · Ergebnis-Job (#780) · Playwright-Install-Retry dpkg-Sperre (#785); Regeln: Skill `landung` §«Prüfstrasse seit 8.9.2026». **Nachmessung 8.10.2026.** Offen: Merge Queue (Gate) · Wurzel der 6 flackernden Specs (Fehlerbuch §4, bis 22.9.).
  **Entscheide David 8.9.2026:** Weg **A** (Repo bleibt öffentlich, Sparplan bauen; privat nur zusammen mit VPS/Self-hosted Runner) · **M2 freigegeben und gelandet** (Dependabot monatlich, `rebase-strategy: disabled`).
  Ziel: CI-Minuten senken, kein Tor entfällt, `check:e2e-shards` bleibt.
  **Detail:** [ci-minuten-sparplan-2026-09-08.md](bibliothek/betrieb/ci-minuten-sparplan-2026-09-08.md)
  — 61'381 min/Monat, `ci.yml` 97,5 %, Sparplan −24'300 ohne Prüftiefe-Verlust.
  - [ ] **M1** main-Push-Lauf auf Bau/Perf/Deploy kürzen (−15'050/Mt,
    Bauschritt + §6.7-Tor: `strict==true` + Head ist Squash-Merge eines
    grünen PR, sonst Volllauf; Wurzel wie `QS-ORG-UMZUG` unten).
  - [ ] **M2** Dependabot `rebase-strategy: disabled` + monatlich (−3'800,
    sofort/Konfig, **David-Freigabe**).
  - [ ] **M3** e2e-Shards 8 → 4 (−3'800, Bauschritt + Branch-Regel).
  - [ ] **M4** Doku-Läufe: 8 Shard-Kontexte → 1 Sammel-Kontext (−1'500,
    Bauschritt + Branch-Regel — **Fallstrick:** Required-Check-Name ändert,
    `check:merge-schutz`-Liste im selben Schritt nachziehen).
  - [ ] **M5** Plan-Buchung `npm ci` erst nach Trailer-Fund (−150,
    sofort/Konfig, **David-Freigabe**).
  - [ ] Wurzel `strict: true` ⇒ Merge Queue (`QS-ORG-UMZUG` unten, Gate G7).
  - [ ] **Plan-Buchungs-Commit macht jede wartende PR BEHIND** *(Befund 11.9.2026, #791/#793)* — der automatische `docs(plan): … [skip ci]`-Commit nach jedem Merge zieht jeden offenen
    Branch hinter `origin/main` zurück ⇒ ein zusätzlicher CI-Lauf je Landung, bevor gemergt
    werden kann. Wurzel-Optionen: GitHub Merge Queue (Repo-Setting, David) oder die Buchung
    im PR selbst statt danach.

- [ ] **Repo in eine GitHub-Organisation überführen (Merge Queue)** *(`QS-ORG-UMZUG`)*
  <!-- @meta id: QS-ORG-UMZUG · status: blocked · blocker: david-entscheid-org-umzug · dep: [] · feld: betrieb -->
  Erst, wenn der Auto-Nachzug (Checklisten-Zeile unter `QS-AUTOMATIK`) nicht reicht.
  **Detail:** [entregulierung-2026-08-07.md](bibliothek/betrieb/entregulierung-2026-08-07.md).

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
