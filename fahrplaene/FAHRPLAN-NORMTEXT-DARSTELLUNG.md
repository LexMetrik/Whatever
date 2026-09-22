# Fahrplan — Gesetzesdarstellung Bund/DE (Normtext-Umbau)
<!-- @lagebild name: Normtext-Darstellung · zweck: Treue Darstellung der Gesetzestexte im Leser. -->

**Heimat: ROADMAP «Querschnitt-Band»** — Quell-Architektur-Entscheid + Intake
(«Informations-Nutzung der Gesetze») verlinkt aus `W2·5d`; SIDECAR-Spec (§M14)
zusätzlich Grundlage für `W2·5g-ZEIT` (zeit-historik-poc). Kein eigener `@meta`-Schritt.

## §0 · Zweck

Konsolidierter Masterplan für den Normtext-Umbau Bund/DE: Davids 12 Punch-Punkte +
33 Audit-Lücken (`AUDIT-FEDLEX-DARSTELLUNG-2026-06-28.md`). **Scope: Bund, DE.**
Kein Deploy (bauen+gaten), isolierter Worktree `feat/normtext-bund-de`. Regelwerk:
`DESIGN-REGLEMENT.md` §N.

> **Stand 28.6.2026.** Konsolidierter Masterplan (ultracode: 5 Oberflächen-Karten → 3 unabhängige
> Cluster-Strategien → Synthese). Deckt Davids 12 Punch-Punkte + 33 Audit-Lücken
> (`AUDIT-FEDLEX-DARSTELLUNG-2026-06-28.md`). **Scope: Bund, DE.** Kein Deploy (bauen+gaten),
> isolierter Worktree `feat/normtext-bund-de`. Regelwerk: `DESIGN-REGLEMENT-NORMTEXT.md` (seit 23.9.2026: `DESIGN-REGLEMENT.md` §N).

## B2 — eigener Pass direkt nach B1

### §M13 · Schlusstitel/UeB/Anhaenge lesbar machen: disp+annex-Pfad, Schema, Render-Slot, Anhang-Tabellen, deren Fussnoten (grosser Daten-Pass)
*(Bau-Spec des ROADMAP-Schritts `W2·5l-NORMTEXT-B2`, zusammen mit §M14; §-Sigel nachgezogen 30.8.2026, Spec-Bindungs-Nachzug.)*
- **STATUS 30.6.2026 — disp-Hälfte (Schlusstitel/UeB/Schlussbestimmungen) FERTIG + gegatet** (Worktree `feat/normtext-schlusstitel-m13`, noch nicht deployt). G24–G27 (disp) erledigt: `disp_uN/art_*` über `alleSchlussteilAnker` + `extrahiereArtikelAusAnker` extrahiert, kollisionsfreies Token `disp_uN_art_*` (`ankerZuToken`), additiv in `eintraege[]`, Struktur-Sidecar (`struktur-extrahiere.ts` ID-Regex geöffnet) gruppiert → neue Top-Sektion, **0 Renderer-Umbau**. 5 Gesetze, **275 Artikel** (ZGB 178/OR 83/PatG 9/SchKG 4/SVG 1). Golden additiv **+275, 0 geändert/0 entfernt** (Engine-Golden byte-gleich). **Bewusste Abweichung (§7/§1):** KEINE `anhaenge[]`-Schema-Dimension — Schlussteil-Artikel SIND Artikel → Token-Namespace statt neuer Strahlung (niedrigerer Blast). `check:vollstaendigkeit` erweitert, Voll-Gate grün, Playwright-Sicht (ZGB/OR), 1 adversariale Gegenprüfung. Detail: `bibliothek/normen/norm-vorschau-snapshot-system.md` §M13. **Nachtrag 30.6. (Vollständigkeits-Audit aller Fedlex-HTMLs):** Schlusstitel jetzt 277 Art./6 Gesetze — die Variante **`disp_N` OHNE «u»** (VZG art_135/136, «Schlussbestimmungen») war zunächst übersehen, Regex auf `disp_u?\d+` erweitert + deployt. **VERIFIZIERT: 0 verfehlte disp-Artikel mehr.** **OFFEN (M13-Rest, quantifiziert): (1) Anhänge `annex_*` — 99 Gesetze, 2221 annex-Anker** (chemrrv 526/lrv 309/fidlev 184/vts 161/gschv 82…; nur 53 sind `<article>`-gewickelt, Rest = annex-Sektionen/Tabellen/Listen) = G18-Pass, andere Risiko-Klasse. **(2) Bilder/Formeln `<img>` — 29 Gesetze, 480 Bilder** (SSV 300 Piktogramme, VTS 45, chem. Piktogramme, Formeln-als-Bild) = G21/G22, von `entferneTags` gedroppt. **(3) Staatsvertrags-Protokolle `lvl_*/art_*`** — nur LugÜ (9 Art., röm. Nummerierung). Erfasste Artikel sind textlich vollständig (check:vollstaendigkeit + sha + neues check:struktur-konsistenz).
- **STATUS 30.6.2026 — annex-Hälfte (Anhänge) FERTIG + gegatet** (Worktree `feat/normtext-annex-m13`). G18 (Anhänge) erledigt: dedizierter Pfad `alleAnhangAnker` + `extrahiereAnhang` (Anhänge sind `<section>` im `<div id="annex">`, KEINE `<article>` — eigener Parser für Unter-Überschriften/klassenlose `<p>`/`<dl>`/`<table>`). Token-Namespace `annex_*`/`lvl_*`, additiv, Struktur-Sidecar-Gliederung «Anhänge» → Top-Sektion, **0 Renderer-Umbau** ausser neuem `titel`-Block (Ziffer-Zwischentitel). **390 Einträge / 134 Bund-Gesetze** (vorher 0). Golden additiv **+370, 0 geändert/0 entfernt** (Engine-Golden byte-gleich). **Bewusste Abweichung (§7/§1):** wie disp KEINE `anhaenge[]`-Dimension — einziges neues Feld `titel?` (render-only, golden-neutral). Korrektur zur Vorab-Quantifizierung: «53 `<article>`-gewickelt» traf NICHT zu — alle Anhänge sind `<section>`; die 2221 Anker zählten genestete `lvl_*`-Stufen mit (Extraktionseinheit = top-level Anhang, nicht jede Stufe). Voll-Gate grün, `check:vollstaendigkeit`/`check:struktur-konsistenz` erweitert, Playwright-Sicht (GSchV/ChemRRV/BVG/KAG), Wort-Coverage 99.65 % (44 479 Wörter), 12 neue Unit-Tests. **2 Gegenprüfungen** (Code + Fidelity); fanden **6 §1-Befunde, alle gefixt:** C1 Apparat-Variant-Klasse leckte Historie; C2 geschachtelte Tabellen zerschnitten → `findeTableEnde`; C3 marke-lose Notiz-Reihenfolge; D1 Marken-Kürzung «1.1.1»→«1»/«Flupo»→«f»; D2 all-`<th>`-Datentabellen als Kopf gelesen (LRV/VTS); D3 verschachtelte marke-lose `<dd>` verloren → rekursiv. **D1/D2 in geteilten Parsern → `anhang`-Flag NUR im Anhang-Pfad (Artikel byte-gleich, 0 sha-Änderung);** Haupttext-Garbling = deklarierter Folgeschritt. Plus früh: `<p>`-umwickelte Tabellen, 78 Gesetze mit einzigem/`lvl_u`-Anhang + Deckblatt (`alleAnhangAnker` Blatt-Regel). Detail: `bibliothek/normen/norm-vorschau-snapshot-system.md` §M13-Annex. **OFFEN (M13-Rest):** ~~(2) Bilder/Formeln~~ (3) LugÜ-Protokolle; (4) Haupttext-Marken-Garbling (Folgeschritt).
- **STATUS 1.7.2026 — Bilder & Formeln (G21/G22) FERTIG + gegatet** (Worktree `normtext-bilder-formeln`, gate voll grün, Push/Deploy §9 offen). Fedlex-`<img>` (Piktogramme SSV/VTS/chem. + Formeln-als-Bild KKG/DBG/FZV/LSV) wurden von `entferneTags` gedroppt → jetzt erfasst als Block-Feld **`bild`** (Standalone) bzw. **`bildKacheln`** (flaches Karten-Raster NUR bei reinen Piktogramm-Katalogen; gemischte Datentabellen wie SSV Anhang 3 bleiben `mehrspaltig`, §1). **Selbst gehostet**: Generator `ladeBilder` rechnet die relative src → amtliche Filestore-URL, lädt herunter nach `public/normtext/bilder/<erlass>/` (445 Dateien), **sha** über die Bytes, idempotent, Escape-Hatch (kein Bild-Loch). Fedlex-`[tab]`-Spacer gestrippt → **SSV-Signal-Anhänge** vom Text-Wirrwarr zum bebilderten Signal-Katalog (Kachel-Raster, Bild+Nr+Name). Neues Tor **`check:bilder`** (Existenz+sha+keine Waisen). Render `BildFigur`/`BildKacheln` (§13-Tokens, CLS-fest). **Engine-Golden byte-gleich**; Daten-Index re-gesegnet. **Containment 455/455 distinct** (Catch-all `ergaenzeFehlendeBilder`, auch `<dt>`/`<sub>`). **Opus-Gegenprüfung** fand+fixte Text-Dublette (`[tab]`-Marke: markeloseNotizen↔parseDefinitionsListe) + SSV-Mehrfach-Zelle-Textverlust; korpusweit re-verifiziert (0 Dublette/0 Verlust). Cosmetic offen: `formel`-Flag nie gesetzt → Formeln als «Amtliche Abbildung» statt «Formel».
- **STATUS 5.7.2026 — Adjazenz-Härtung (Nachtrag zu G21/G22) FERTIG + gegatet** (Branch `fix/fedlex-extraktor-adjazenz`; Auslöser = 3 vorbestehende Grenzen aus der P1-a/b-Gegenprüfung, Beleg `bibliothek/register/fedlex-currency-2026-07-05.md` §Nachtrag). Zwei §1-Fixes in `extrahiere-fedlex.ts`: **(a) `match[6]`-Bild-Absatz** erfasste nur das `<img>` — Text-Läufe VOR/NACH dem Bild im selben `<p class="bild">` werden jetzt in Dokumentreihenfolge als eigene Blöcke geführt (VTS art_123/3 «Türen zählen ebenfalls als Notausstiege …», +36 Wörter; reine Bild-`<p>` byte-gleich). **(b) markenloses Folge-`<dd>`** (leeres `<dt></dt>`) wird in `parseDefinitionsListe` NUR im Haupttext-Pfad (`!anhang`) an das vorausgehende Item angehängt (SSV art_24 lit. a–c Signal-Beschreibungen «Der Führer muss …», +35 Wörter); Anhang-Pfad bewusst ausgenommen — dort erfasst `markeloseNotizen` schon (sonst Chapeau-Dublette, im ersten Wurf real aufgetreten und gefixt). **VRV annex_I/II geprüft: amtlich aufgehoben** (leerer Body) → «…» faithful, 0 Änderung. Re-Extraktion NUR vts/ssv/vrv; Wort-Multiset **+71/-0** korpusweit, VRV.json byte-gleich; 5 Regressionstests (3 Adjazenz-Klassen + Regel-Fall + Anhang-Anti-Dublette). Engine-Golden byte-gleich, Voll-Gate + 158 e2e grün, Opus-Gegenprüfung BESTANDEN (6 Aufträge, 0 Widerlegungen, Hash `c6639e0d9623…`). **Backlog neu (pre-existing, nicht diff-verursacht):** SVG-`<style>`-Leak (`.cls-1 { fill: #010101 }`) im SSV-Anhang-Signalkatalog-Text — eigener kleiner Strip-Fix.
- umfasst: - / G10,G13,G18,G24,G25,G26,G27 | Ebene: beides | Tiefe: tief | Aufwand: XL | dep: M7
- Tiefe-Begründung: GROESSTER reiner Fundiertheits-Sprung ueberhaupt (ZGB ist ohne Schlusstitel 178 Art. + OR 83 schlicht unvollstaendig; 277 UeB-Art/62 Erlasse, 150 Anhang-Sektionen/121 Erlasse). Gemeinsame Wurzel 'liest nur art_' (alleArtikelTokens digit-only :370 + Regex :53 + fussnoten:63): disp_u1/art_* und annex_* sind echte <article> mit Praefix-ID. EHRLICH zu L0: B2 NUR aus Risiko-/Verifizierbarkeitsgruenden, NICHT weil weniger wert — als ALLERERSTER B2-Schritt unmittelbar nach B1-Abnahme.
- Risiko: HOCH/XL: erzwingt NEUE Schema-Dimension NormSnapshotDatei.anhaenge[] (eigener Token-Namespace st_/anhang_) die in vollstaendigkeit-logik.ts, check-drift.ts, sha256Bloecke, browse-typen.ts ausstrahlt. EIGENTLICHE FALLE = Token-Kollision disp_u1/art_1 vs art_1 (ohne eigenen id-Raum ueberschreibt Schlusstitel-Art.1 den Haupttext = stiller Daten-Verlust). MIT ABSTAND groesster neuer Golden-Segment (ZGB +178 etc.) -> eigene Re-Bless-Welle, disjunkt von B1. G18 (Annex-Tabellen) huckepack auf parseFedlexTabelle (M7), G13 (disp-Fussnoten) + G27 (Render-Slot) hierher. struktur-extrahiere.ts = Andockpunkt fuer Ueberschriften (sieht <h*> schon).
- Gating: EIGENER Re-Bless-Pass (npm run normtext + normtext:struktur), getrennt vom B1-Block; check:vollstaendigkeit + check:normtext erweitern; gestaffelt (B2a Schema+ZGB/OR-Pilot byte-fuer-byte vs Fedlex -> B2b G18-Annex-Tabellen -> B2c Rest 62/121); browse-Manifest artikelAnzahl konsistent.

### §M14 · Fussnoten-Marker an exakter Wortposition statt Absatz-/Item-Ende (G14)
*(Teil der Bau-Spec von `W2·5l-NORMTEXT-B2`.)*
- umfasst: #9-Rest / G14 | Ebene: beides | Tiefe: minimal | Aufwand: L | dep: M10
- Tiefe-Begründung: Bewusst niedrige L0-Tiefe trotz hohem Aufwand: G14 ist reine DARSTELLUNG (Marker am exakten Wort vs Absatz-Ende, ~1121 Faelle ZGB/OR/BV/AHVG/ARGV1) — KEIN Info-Verlust, der Inhalt ist da. Von #10/#11 ENTKOPPELT (Resolver-Karte: Body hat keine Hrefs) -> kein Grund es in B1 zu zwingen. Baut auf dem tag-bewussten clean() aus M10/G15 auf.
- Risiko: Hoch im Aufwand, niedrig im Nutzen: ~1121 Marker neu positionieren; braucht tag-bewussten Serialisierer (Ersatz fuer entferneFussnotenSups:36, der heute Marker samt Position LOESCHT). Als SIDECAR (Wort-Offsets separat) -> Snapshot-Index byte-gleich. Falsche Position = sichtbarer Amtstreue-Fehler -> eigener adversarialer Pass, erst lohnend wenn B1-Substanz steht.
- Gating: Sidecar-Variante haelt golden; eigener Wort-Position-Check; FnRef-Render-Test; visuelle Stichprobe ZGB Art.56/OR.

### §M15 · Sprachverfuegbarkeit DE/FR/IT erfassen + verlinken (G29)
- umfasst: - / G29 | Ebene: beides | Tiefe: standard | Aufwand: M | dep: M5
- Tiefe-Begründung: Vom Auftrag explizit dem spaeteren FR/IT-Batch zugeordnet; ausserhalb des DE-only-Scope. Hier nur als Platzhalter im Plan.
- Risiko: Mittel: Sprach-Datenmodell + Fedlex-Sprachvarianten-Abruf; gehoert in die Mehrsprachen-Welle, nicht DE-only B1.
- Gating: Eigener FR/IT-Batch; nicht in B1.


---

## Archivierte Abschnitte *(Plan-Neuschnitt 29.8.2026)*

9 Abschnitt(e) dieser Datei sind wörtlich nach
[`archiv/fahrplaene/FAHRPLAN-NORMTEXT-DARSTELLUNG.md`](../archiv/fahrplaene/FAHRPLAN-NORMTEXT-DARSTELLUNG.md) ausgelagert — sie tragen keine offene
ROADMAP-Bindung mehr. Titel:

- ▶ Bau-Fortschritt (Branch `feat/normtext-bund-de`, nicht deployt)
- Leitsatz (L0)
- David-Entscheide (28.6.)
- Sicherheits-Architektur (Golden)
- B1 — jetzt
- B3 — später (Punkt 2 / FR-IT)
- Empfohlene Batch-Grenze (Begründung)
- Quell-Architektur-Entscheid — AKN-XML als Langfrist-Fundament (Council 30.6.2026)
- Intake — Recherche «Informations-Nutzung der Gesetze» (David 17.7.2026)
