# FAHRPLAN-VERZAHNUNG-UI — Die Verzahnung sichtbar machen (V1 vor VPS · V2 Masse · V3 Soft-Law)
<!-- @lagebild name: Verzahnung sichtbar machen · zweck: Das Alleinstellungsmerkmal: Gesetz, Entscheid und Werkzeug verknüpft anzeigen. -->

> **Eingefroren 5.10.2026:** Spezifikation, kein Bau-Stand; Fortschritts-Häkchen werden nicht mehr nachgeführt; Entscheidtabellen gelten unverändert — hier ausdrücklich: §12 David-Entscheid 2.8.2026 (nur Sachgebiet).

**Stand:** 3.7.2026 · **Auftrag:** David 3.7.2026 («Verzahnung sichtbar machen») · **Erarbeitet:** Fable (Konzept + adversariale Gegenprüfung eingearbeitet) · **Rolle:** Detailquelle der `ROADMAP.md` für Schritt **W2·7-VZUI** (§14 — die ROADMAP bleibt die eine Steuerungsquelle, dieser Fahrplan trägt das Wie).

## §0 · Zweck und Leitplanken

Detailquelle zu `W2·7-VZUI` (auch `W2·6`/`W2·7-BEZUG`; Zitationsnetz vormals
`W2·6-ZNETZ`, Etiketten-Konsolidierung 15.8.2026) — die Verzahnung
Norm↔Rechtsprechung sichtbar machen (V1 vor VPS · V2 Masse · V3 Soft-Law).

**Leitplanken (bindend):**
- **§7 Status-Modell:** Kein Element behauptet je «geprüft»/`verified` — das ist Davids Abnahme vorbehalten (gesperrt bis 1.12.2026). Wortfeld «geprüft/gegengeprüft/verifiziert» ist in JEDEM Nutzertext dieses Fahrplans verboten.
- **§8 Ehrlichkeit:** Herkunft (amtlich/kuratiert/maschinell) wird nie verschwiegen; Zähler nennen Erfassungsgrenzen («n **erfasste** Urteile»), nie Vollzähligkeit.
- **§15 Lesedichte/Perf:** Verzahnung lebt am Dokument-/Artikelfuss, nie im Lesetext (einzige Ausnahme: das wörtliche Inline-Zitat); CLS = 0; nichts merklich langsamer.
- **R16 bleibt zu:** Keine Ampel-/Treatment-Farben (überruled/bestätigt) — auf keiner Etappe dieses Plans existieren Treatment-Daten.
- **Q1:** Bandjahr-Präzision nie als Tagesdatum rendern.
- **Regelmässig-aufräumen:** Kein toter Code in Prod; Erweiterungspunkte als Kommentar, nicht als tote Zweige.

---

## §10 · ROADMAP-Spec W2·6-ZNETZ (wörtlich verschoben 31.7.2026)

*Nachzug 15.8.2026 (Etiketten-Konsolidierung BAUPLAN-UMBAU): Das Etikett `W2·6-ZNETZ` ist
aufgegangen — bauender Schritt dieser Spec ist seither das Dach `W2·6` (Rechtsprechungs-Daten),
die Zeile steht dort als Checklisten-Eintrag. **Trailer also `Roadmap: W2·6`**, nicht der im
wörtlichen Block unten zitierte Alt-Trailer. Gegenstand, Risikoklasse und Gegenprüfungs-Pflicht
unverändert.*

> **→ Bau-Spec: «8. Zitationsnetz — Rückwärts-Zitate + Leitentscheid-Score» dieser Datei.** Dieser § ist die *wörtlich hierher verschobene ROADMAP-Prosa* (Wortlaut-Heimat), nicht die Bau-Spezifikation — wer nur ihn slict, baut ohne die verbindlichen Einheiten, Entscheide und Querschnitt-Regeln.

*Wörtlich aus `ROADMAP.md` (QS-TOK/ROADMAP-Diät B4, 31.7.2026); dort bleiben Checkbox, `@meta`, Einzeiler, Pointer. Steuert nicht — Spec-Heimat.*

  «Welche Entscheide zitieren diesen?» (Rückwärts-Kanten) + **Leitentscheid-Score nach Zitierhäufigkeit**.
  **Baut auf** hartem Bestand: jeder Entscheid-Snapshot trägt bereits `zitierteEntscheide` (BGE-Zitate UND
  Geschäftsnummern; 200-BGE-Stichprobe = 2566 Kanten), die Vorwärts-Auflösung läuft schon zur Laufzeit
  (`src/lib/verzahnung/entscheid-kanten.ts` gegen `register.json`), und ein **1:1-Vorbild für den
  Build-Zeit-Rückwärts-Index existiert**: `scripts/normtext/entscheide-schreiben.ts` schreibt bereits
  `register.json` + `norm-index.json` + Leitfall-Shards (Typen `src/lib/rechtsprechung/norm-index.ts`).
  **Feasibility ehrlich zweistufig:**
  🟢 **kuratierter Korpus** (5093 Snapshots auf Platte) ist jetzt baubar — der neue Build-Generator ist
  der Spiegel des norm-index-Generators (+ Shards + UI-Chip). 🟠 **Long-Tail über die 195k Massen-Entscheide
  ist es NICHT:** er hängt am nicht ausgelieferten ~5,7-GB-Artefakt `masse.db` (dort liegt `zitat_kanten`
  mit `ix_zitat_nach` bereits vor) und fällt damit in **`W2·6-DATA` E3-Serving/E4** — kein Parallel-Schritt
  (§14.3). **UI läuft in `W2·7-VZUI` V2 ein** («Wird zitiert von» + Startseiten-Kachel «Meistzitierte
  Artikel») und wird hier **nicht doppelt geplant**. **Score bleibt deskriptiv** — reine Zählhäufigkeit mit
  ausgewiesener Grundgesamtheit, kein LLM-Ranking und keine Qualitätsaussage (§2/§8). Feasibility-Beleg:
  `bibliothek/recherche/zitationsnetz-feasibility.md`. **DoD:** Generator deterministisch (2 Läufe
  byte-gleich) · `check:gegenpruefung` bestanden · golden byte-gleich · Tore grün. Trailer
  `Roadmap: W2·6-ZNETZ` + `Gegenpruefung: <Verdikt>`.

---

## §11 · ROADMAP-Spec W2·7-VZUI (wörtlich verschoben 31.7.2026)

> **→ Bau-Spec: «1. Die Interaktions-Grammatik», «3. Etappen» und «9. Bezüge am Artikel» dieser Datei.** Dieser § ist die *wörtlich hierher verschobene ROADMAP-Prosa* (Wortlaut-Heimat), nicht die Bau-Spezifikation — wer nur ihn slict, baut ohne die verbindlichen Einheiten, Entscheide und Querschnitt-Regeln.

*Wörtlich aus `ROADMAP.md` (QS-TOK/ROADMAP-Diät B4, 31.7.2026); dort bleiben Checkbox, `@meta`, Einzeiler, Pointer. Steuert nicht — Spec-Heimat.* *Wörtlich bis auf die Selbstverweise, die am 31.7.2026 auf «diese Datei» neutralisiert wurden (Endprüfung Fix-Runde 1; Fund R2-18).*

  EINE Interaktions-Grammatik (KantenChip · StatusBadge nur-Abweichung · KontextGruppe-Overlines ·
  MehrKante · FundstellenAnker · Begriff-Glossar) über GesetzLeser/EntscheidLeser/MaterialLeser/Suche/
  Split-View. **V1a JETZT vor VPS** (4 Leitentscheid-Darstellungen vereinheitlicht, EntscheidLeser beide
  Richtungen am Fuss, Artikel-Sublabels, ⧉ Panel+Popover unter Pane-Gating; Zusatzaufträge David 3.7.:
  Fundstellen-Sprung zur massgeblichen Erwägung an ALLEN eingehenden Entscheid-Links + Popover-Verankerung
  am Link) · **V1c** Normrevisions-Ehrlichkeit (David 3.7.: alter Entscheid nie unbesehen an revidierte
  Norm — `fassungsBezug` aus Sidecar-Revisions-Fussnoten, `StatusBadge revidiert`; Extraktions-Risikopfad
  ⇒ `check:gegenpruefung`) · **V1b** Rangliste-Einbacken
  (gated: law-code-Kanonisierung ✅ E4 3.7.; Provenienz nie gemischt; `check:gegenpruefung`) · **V2** Masse/Edge
  (Registry + «Wird zitiert von» + `masse`-Badge, mit E3-Serving) · **V3** Soft-Law (E6a-Anschluss,
  `nur-verweis`, VersionsLeiste). §7-Wortfeld-Tor («geprüft» verboten), R16 zu, Q1 Bandjahr, CLS 0.
  **Sequenz:** erst `fix/leitentscheid-stern-tooltip` + `feat/entscheid-verweis-praezision` mergen;
  `parts.tsx`-Eigentümerschaft geklärt (W2·5c fertig). Kein 26×-Bezug — parallel zu E3 fahrbar.
  Startseiten-Kachel «Meistzitierte Artikel» = Andockpunkt (W2·5c fertig, Fläche frei).
  **Detailquelle:** diese Datei.

---

## §12 · Sachgebiet-Facette an der Norm↔Entscheid-Kante (`W2·7-VZUI-SACHGEBIET`, David-Entscheid 2.8.2026)

**Herkunft.** UI-Befund **LM-041** (`FAHRPLAN-UI-BEFUNDE.md` §2): «Der Chip unterscheidet nicht, in
welcher Rolle die Norm im Entscheid steht.» Der Befund war am 31.7./1.8.2026 zurückgestellt, weil
das Facetten-Modell in §9/B1 als abschliessend deklariert war und §1.2 die Dichte-Regel «EIN Zusatz
je Chip» setzt. **David hat den Befund am 2.8.2026 als Variante (b) geöffnet: nur Sachgebiet.**

### §12.1 Was gebaut wird — und was ausdrücklich nicht

| | Entscheid |
|---|---|
| **Sachgebiet** | **GEBAUT.** Eine neue Facette `sachgebiet` an der Kante Norm ↔ Entscheid. |
| **Zitier-Rolle** | **BLEIBT ZU.** «Tragend / beiläufig / abgegrenzt» ist aus dem Entscheidtext nicht deterministisch ableitbar; jede Ableitung wäre Heuristik oder Schätzung — beides ist nach §2 gesperrt, und eine falsch als «tragend» markierte Fundstelle ist ein fachlicher Fehler, kein Darstellungsfehler (§1). Öffnung nur mit einem Verfahren, das den Determinismus **belegt**, nicht behauptet. |

### §12.2 Herleitung — deterministisch, nicht heuristisch (§2)

Quelle ist die **amtliche BGE-Bandnummer** (römisch **I–V**), die die Zitierform selbst trägt
(`BGE 148 II 475` → Band II) und die im Korpus bereits im Entscheid-Key steckt
(`bge_148_II_475`, s. `src/lib/rechtsprechung/erfasste-keys.generated.ts`). Die Abbildung
Band → Sachgebiet ist eine **feste Tabelle**, kein Modell: gleiche Eingabe, gleiche Ausgabe, kein
Textverständnis, kein LLM.

**Auflage §7 (bindend, vor dem Bau einzulösen):** Die Tabelle Band → Sachgebiet wird **gegen die
amtliche Quelle des Bundesgerichts belegt** (Norm/Fundstelle + Abrufdatum im Code als Kommentar,
CLAUDE.md §11), nicht aus Modellwissen gesetzt. Zwei Punkte sind dabei ausdrücklich **offen und
nachzuweisen**, nicht anzunehmen:

1. der genaue amtliche Wortlaut je Band (Sachgebiets-Bezeichnung), und
2. die **Zeitachse**: die Bände sind historisch nicht durchgehend gleich geschnitten
   (Sozialversicherungsrecht/EVG). Ergibt die Prüfung eine Zäsur, trägt die Tabelle das Jahr —
   oder die betroffenen Jahrgänge liefern **`sachgebiet: null`** («nicht bestimmbar»), nie einen
   geratenen Wert (§8).

**Nicht-BGE-Kanten** (BGer-Nicht-Leitentscheide, kantonale Entscheide) haben keine Bandnummer und
tragen darum `sachgebiet: null`. Das ist der Regelfall, kein Defekt: `null` heisst «nicht
bestimmbar» und wird als solches angezeigt bzw. weggelassen — **nie** als «alle Sachgebiete» oder
als leerer Filter, der stillschweigend alles durchlässt. Die Grundgesamtheit wird am Filter ehrlich
ausgewiesen (§8), wie schon bei den B7-Zählern.

### §12.3 Darstellung — Filter, nicht zweiter Chip-Zusatz

Die Facette erscheint als **Filter-Facette im «Rechtsprechung ▾»-Menü** (B5-Fläche,
Analogie zum Ansicht-Menü `LeserAnsichtV3.tsx`; Vorgänger `LeserAnsichtMenu.tsx` in H5
gelöscht, 21.8.2026), zusammen mit den bestehenden Schaltern Instanz/Ebene/Kanton/Status
und dem Zeitstrahl. Sie erscheint **nicht** als zusätzlicher Zusatz am Chip: die Dichte-Regel aus
**§1.2 gilt unverändert** — EIN Zusatz je Chip (Fundstellen-Sublabel ODER ★-Glyph), sonst wird aus
der Chip-Reihe wieder die Chip-Wüste, gegen die §0/1c gebaut wurde. Wer die Facette am Chip sehen
will, sieht sie über den Filter: gefiltert wird die Menge, nicht das einzelne Etikett beschriftet.

### §12.4 Risiko-Klasse und Tore

Die Ableitung berührt die **Extraktions-/Datenschicht** der Kanten ⇒ **Risiko-Pfad**:
`npm run check:gegenpruefung` **pflichtig** (Skill `gegenpruefung`), Generator deterministisch,
**zwei Läufe byte-gleich**, golden byte-gleich. Die reine Filter-UI darüber ist Darstellung (§3).
Sequenz/Kollision: teilt die Fläche mit `W2·7-BEZUG`/B4+B5 (`bezugAuswahl.ts`,
`BezugFacettenWahl.tsx`, `LeserAnsichtV3.tsx`; Vorgänger `LeserAnsichtMenu.tsx` in H5
gelöscht, 21.8.2026) und mit `W2·5h-GESETZ-UI` — Worktree-Pflicht (§12).

### §12.5 DoD

Tabelle mit amtlichem Beleg + Abrufdatum am Fundort · `sachgebiet: null` sichtbar ehrlich
behandelt · Facette im «Rechtsprechung ▾» bedienbar, Chip-Dichte unverändert · Zähler mit
Grundgesamtheit · Gegenprüfung bestanden · golden byte-gleich · Zitier-Rolle nachweislich **nicht**
mitgebaut.

---


---

## Archivierte Abschnitte *(Plan-Neuschnitt 29.8.2026)*

13 Abschnitt(e) dieser Datei sind wörtlich nach
[`archiv/fahrplaene/FAHRPLAN-VERZAHNUNG-UI.md`](../archiv/fahrplaene/FAHRPLAN-VERZAHNUNG-UI.md) ausgelagert — sie tragen keine offene
ROADMAP-Bindung mehr. Titel:

- 0. Kritik-Einarbeitung (adversariale Gegenprüfung 3.7.2026)
- 1. Die Interaktions-Grammatik (6 Elemente + Glossar, verbindlich für ALLE Oberflächen)
- 2. Soll-Bild je Oberfläche
- 3. Etappen
- 4. Die 5 Magic Moments als Leit-Testfälle (e2e-Sollsätze)
- 5. Erweiterungspunkte (Andocken statt Umbauen)
- 6. Bewusst-NICHT-Liste
- 7. Kollisions-/Sequenz-Hinweise
- ROADMAP-EINBAU (für Opus)
- 8. Zitationsnetz — Rückwärts-Zitate + Leitentscheid-Score (`W2·6-ZNETZ`, Ideen-Intake 20.7.2026)
- 9. Bezüge am Artikel — Facetten-Fundament alle Instanzen (`W2·7-BEZUG`, §14-Intake 24.7.2026)
- §13 · Bezüge-Laden: das §15-Versprechen «Grundzustand ohne Zusatz-Fetch» (`W2·7-BEZUG-LADEN`, Entscheid-Schritt)
- §14 · ROADMAP-Spec-Nachzug (wörtlich verschoben 4.8.2026, ROADMAP-Diät Welle 3)
