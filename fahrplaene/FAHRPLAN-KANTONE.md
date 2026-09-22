# FAHRPLAN — Kantonale Gesetze & Darstellung (Ultracode-Synthese 12.7.2026)
<!-- @lagebild name: Kantonale Gesetze · zweck: Die kantonalen Erlasse so sauber darstellen und sichern wie das Bundesrecht. -->

> **ROADMAP-Schritt:** `W2·13-KANTONE` (Welle 2, hinter den laufenden Reader-/Verzahnungs-Strängen).
> **Auftrag David 12.7.2026 (wörtlich):** «recherche mit ultracode zu kantonalen gesetze und
> deren darstellung und setze befunde um».
> **Quelle:** Ultracode-Recherche 12.7.2026 — 44 Befunde **F1–F44** (Register-/Korpus-Zählungen ·
> Live-Abgleiche gegen Amtsquellen bgs.zg.ch/bgs.so.ch/ar.clex.ch · Playwright-Proben gegen Prod ·
> Code-Lektüre Reader/Suche/Adapter) plus 3 adversariale Kritik-Linsen: **regel-treue** (42
> Verdikte, 0 Streichfälle, 1 Massnahme ersetzt, 5 Bündelungen), **beleg-haerte** (10 Befunde
> selbst re-verifiziert, davon 4 live an der Amtsquelle; 4 Korrekturen), **praxis-roi**
> (8 Repo-Spot-Checks, alle bestätigt; Bündelung + Priorisierung).
> Dieses Dokument ist die **Synthese**: Verdikt-gefilterte Befunde, zu Bau-Einheiten gebündelt
> (§14.2), **sofort baubare Einheiten zuerst** (kantons-einzelne Fixes, Display-/UI-Schicht),
> **gegatete 26×-Einheiten klar dahinter** (Slot durch E3/W2·6-DATA belegt). Verworfenes steht
> explizit mit Grund (§Z), Beleg-Qualität in §B, Korrekturen aus den Kritiken in §K.
>
> **Bilanz:** 44 Befunde → Dubletten-Merges (F43≡F6 · F15≈F8 · F27 zerfällt in F9/F11 + Rest-Item)
> → **41 netto** → **39 übernommen** (davon 7 mit korrigierter/verschärfter Massnahme aus den
> Kritiken) · **1 Massnahme ersetzt** (F10-Client-Kanton-Index → F35/F36, Arbiter-Entscheid) ·
> **1 Positivbefund ohne Aktion** (F34 Mobil/§-Weiche = Verifikations-Baseline).
> Kein Befund verlangt Headless-Scraping; keiner verletzt den OCL-Schema-Entscheid (11.7.:
> kein korpusweiter json_content-Wechsel).

---

## §0 · Verbindliche Prozess-Regeln (gelten für JEDE Einheit dieses Plans)

1. **G1 — Amtsquellen-only (§7 + Lizenz-Leitplanke).** Texte/Metadaten/PDF ausschliesslich von
   den amtlichen Kantonsportalen (bgs.*, *.clex.ch, gesetzessammlung.bs.ch, m3.ti.ch, sz.ch,
   zh.ch, VD BLV …). **lexfind.ch nur als Fakten-/Lücken-Signal** (Enumeration, Versions-Heuristik),
   nie als Text-/PDF-Quelle, nie Aggregator-Dateien einbacken. Quell-Menü **je Kanton empirisch**
   erheben (Daueranweisung; GL-Lektion `/app/` vs `/api/` — Content-Type prüfen, Angular-Shells
   erkennen). **Headless ist KEIN zulässiger Fallback** — bietet ein Portal nur JS-gerendertes
   HTML: strukturierte Endpunkte/PDF oder Verzicht.
2. **G2 — 26×-Slot-Regel (Leitprinzip 4).** Der Slot ist durch **E3 (W2·6-DATA)** belegt. Nie
   zwei 26-Kantone-Massenläufe parallel. **Kantons-einzelne Fixes und Display-/UI-Schicht sind
   frei**; jeder korpusnahe Lauf (≥ ~3 Kantone Regeneration, 26-Kantone-Läufer, Vollkorpus-Import)
   ist eine **gegatete Einheit** (§1-B) — nur vorbereiten, nicht starten. Sequenzielle
   Kantons-Tranchen dürfen nicht als Schlupfloch für einen faktischen Vollkorpuslauf dienen
   (regel-treue-Auflage zu F1/F4). Sonderfall: ein **BS-Neulauf (859 Erlasse)** ist formal 1 Kanton,
   faktisch ein Massenzugriff auf einen Amts-Host → Tranchen + Rate-Limit + eigene Bau-Einheit.
3. **G3 — Gegenprüfungs-Pflicht (Skill `gegenpruefung`, Tor `check:gegenpruefung`).** Zwingend
   bei allen Tarif-/Extraktions-Risikopfaden dieses Plans: **K-4, K-6, K-7, K-14** sowie jeder
   Regeneration eines Tarif-Belegs (FR-261.16/8428, SG-2935/3849, TI-Gerichtskosten, SZ-Notariat,
   ZH-AnwGebV, VD-Notariat/Steuer, GL-Gebührentarif). Quittung `npm run gegenpruefung:ok`,
   Trailer `Gegenpruefung:` am Commit. PDF-Extraktion zusätzlich mit **pdfplumber-Gegenprobe**
   (nicht-lasttragend, s. W3·12-Werkzeug-Fund B3).
4. **G4 — Harte Sequenz-Constraints.**
   - **F20 (Dehyphenation) VOR jedem FR/VS/AR-PDF-Nachzug** — sonst stille Regression
     («se - condaire»); Snapshots FR-8428/VS-1413 bleiben bis dahin gesperrt.
   - **F41 (Art.-Self-Link-Unterdrückung) VOR oder MIT F40** (§-Selbstverweise) — sonst fehlt der Ersatz.
   - **Adapter-Fixes VOR Regenerations-Welle:** K-7 (Range-Platzhalter) + K-8 (<p>-Struktur)
     mergen, DANN K-G1 fahren — sonst zweite Welle. F13-Betroffenheits-Rescan NACH K-G1.
   - **K-G1/K-G2/K-G3/K-G4/K-G5 erst nach E3-Slot-Freigabe** (Etikett-Übergabe per
     `plan:set`-Commit, check.ts 5b).
5. **G5 — Beweis-Anker je Fläche.** Reader-/Display-Fixes: **golden byte-gleich für Bund beweisen,
   nicht annehmen** (F24-Auflage) + e2e/DOM-Reihenfolge-Test. Adapter-Fixes: Unit-Test mit dem
   echten Quell-Markup (AR-133.1, VD-105539-Negativfälle) + Golden-Diff korpusweit **offline**
   (additiv beweisen). Jeder Snapshot-Nachzug mit eigenem **version_uid-Drift-Token**; jede
   Fassungs-Entscheidung **gegen die Amtsquelle** (nie nach Datei-Alter). Zahlen am Bau-Tag frisch
   erheben, nicht aus diesem Audit abschreiben.
6. **G6 — Modell-Daueranweisung.** Bau = Opus (Default), Risikopfade IMMER Opus + `effort: high`;
   mechanische Display-Einzeiler (K-1c) Sonnet zulässig. Fable orchestriert nur.
7. **G7 — Davids Fachzeit.** Nichts in diesem Plan blockiert auf David (Zeitsperre 1.12.2026).
   Empfohlene Touchpoints (nicht blockierend): Kantons-Priorisierung K-G5 (ZH→BE→VD→AG→SG→LU→GE
   als Vorschlag) · spätere Abnahme der K-12-Kern-Erlass-Liste (Abnahme-Warteschlange).
   Push/Deploy bleibt §9.

---

## §2 · ROADMAP-Spec W2·13-KANTONE + W2·13-KANTONE-DATEN (wörtlich verschoben 31.7.2026; Aufteilung Darstellung/Daten 8.8.2026)

> **Aufteilung 8.8.2026 (Entscheid David, Entstückelung):** Die 14 Einheiten K-1…K-14 sind in der
> ROADMAP neu auf zwei sortenreine Dach-Schritte verteilt — `W2·13-KANTONE` (Darstellung & Suche,
> Nicht-Risiko: K-1, K-2, K-3, K-5, K-11) und `W2·13-KANTONE-DATEN` (Daten & Extraktion,
> Risikopfad: K-4, K-6, K-7, K-8, K-9, K-10, K-12, K-13, K-14). Die Bau-Spezifikation der
> Einheiten bleibt unverändert §1-A dieser Datei; die frühere serielle `dep`-Kette war
> Abarbeitungsordnung, kein fachlicher Zwang.

> **→ Bau-Spec: «§1-A · SOFORT BAUBARE EINHEITEN» (K-1…K-14), dazu §1-B/§1-C/§1-D dieser Datei.** Dieser § ist die *wörtlich hierher verschobene ROADMAP-Prosa* (Wortlaut-Heimat), nicht die Bau-Spezifikation — wer nur ihn slict, baut ohne die verbindlichen Einheiten, Entscheide und Querschnitt-Regeln.

*Wörtlich aus `ROADMAP.md` (QS-TOK/ROADMAP-Diät B4, 31.7.2026); dort bleiben Checkbox, `@meta`, Einzeiler, Pointer. Steuert nicht — Spec-Heimat.* *Wörtlich bis auf die Selbstverweise, die am 31.7.2026 auf «diese Datei» neutralisiert wurden (Endprüfung Fix-Runde 1; Fund R2-18).*

  44 Befunde + 3 Kritik-Linsen, davon 10 live an Amtsquellen re-verifiziert)* — **14 sofort
  baubare Einheiten K-1…K-14** (kantons-einzelne Fixes + Display-/UI-Schicht, slot-frei):
  P0 Reader-Treue (Lesereihenfolge in 404 Erlassen zerrissen · GL-Routen tot · falsches
  «SR»-Label) → §8-Ehrlichkeit (Currency-Chip «Geltung ungeprüft», Kontext-Panel-Hinweis,
  Abdeckungs-Ausweis) → Suche-Ebenen-Fix (Kanton-Treffer landen auf `/gesetze/bund/`) →
  Einzel-Nachzüge (ZG-161.7 stale seit 1.7.! · SZ-Stand-2027 · Invariante «stand ≤ heute») →
  NormText-§-Verweise (F41 vor F40) → Quellen-Hygiene (9 lexfind-quelleUrls = §7-Verstoss →
  amtliche Portale, Dedupe-Tor) → PDF-Werkstatt (Dehyphenation-**GATE** vor jedem
  FR/VS/AR-PDF-Nachzug; VD/SZ/ZH-Profile) → Werkzeug-Brücke, AR-Sidecars, Perf-Profil,
  Reports, Systematik-7, Zitat-Vokabular-POC. **Gegatet dahinter (26×-Slot durch E3 belegt,
  nur ausgewiesen): K-G1…K-G5** — pre-S1-Regenerationswelle (93 Snapshots/23 Kantone),
  Currency-/Juli-Drift-Läufer, Gliederungs-Extraktion korpusweit, Tabellen/Barème,
  Vollkorpus-Ausbau (BS+AR = 91,4 % des Korpus, ZH 3/~940) — **K-G5 hängt in `W3·12` ein,
  kein Parallel-Schritt** (§14.3). Risikopfade (Tarif/Extraktion) je Opus + `gegenpruefung`.
  Verworfen u. a. Client-Kanton-Suchindex (K10/§15-Arbiter). Detail: diese Datei.
  **§14-Intake 20.7.2026 (David) — zwei Punkte HIER eingegliedert statt danebengelegt (§14.3), weil sie
  exakt dieselbe Bau-Fläche treffen (`scripts/normtext`, `public/normtext/kanton`, kantonale Adapter):**
  - **K-15 · Kantonale Extraktionstiefe** *(**ULTRACODE**, David: später)*. **Befund, nicht Vermutung:**
    **BS hat 41 % Erlasse ohne Gliederung** · kantonale Fussnoten sind **um Faktor ~40 dünner als beim
    Bund** · **ZH hat 0 Struktur-Dateien**. **Hypothese** (ausdrücklich als solche markiert): Quellen-
    Priorität bzw. PDF-Tier — kantonale Erlasse werden aus schwächeren Quellformaten gezogen als die
    Bundes-Erlasse. **DIAGNOSE VOR FIX, verbindlich:** erst je Kanton erheben, **welches Quellformat**
    tatsächlich verwendet wird und **wo** die Struktur verloren geht (Quelle dünn? Adapter dünn?
    Nachbearbeitung?). Ein Fix ohne diese Zuordnung repariert die falsche Schicht. Passt zur bestehenden
    Leitplanke «korpusweiter Adapter-Hebel VOR jedem Bulk» (`archiv/FAHRPLAN-BS-VORBILDKANTON.md`) und zu
    K-G3 (Gliederungs-Extraktion korpusweit) — dort einhängen, nicht doppelt planen.
  - **K-16 · Kantonale Änderungshistorie + Fundstelle im Kantonsblatt** *(David: «wenn möglich»)*.
    **Feasibility 🟢, belegt:** die kantonale Quelle liefert das **strukturiert** — `change_documents`
    und `history_information_map`. Es ist also Mapping-Arbeit, keine Text-Heuristik. **Zwei Auflagen:**
    (i) §7 Norm + Link + **Stand** je Fundstelle; (ii) die Kantonsblatt-Fundstelle ist eine amtliche
    Referenz — **stichprobenweise gegen das Kantonsblatt selbst verifizieren**, nicht der API blind
    glauben. Beide Punkte sind Risikopfad (Extraktion) ⇒ `check:gegenpruefung`, Opus.
  **§14-Intake 21.7.2026 (David) — hier eingegliedert (§14.3, gleiche Bau-Fläche `scripts/normtext` +
  `public/normtext/kanton`):**
  - **K-17 · enumeration_item-Verschachtelung: explizite `tiefe` im LexWork-Adapter** *(Anlassfall
    `BS-154.100` § 71 GOG, David: «Tabelle nicht stimmig»)*. **Kette komplett diagnostiziert (nicht
    Hypothese):** die amtliche LexWork-Quelle TRÄGT die Stufe (Unterpunkt = leere erste Nummernzelle
    + zweite `number`-Zelle im `enumeration_item`-Markup), `adapter-lexwork.ts` flacht beim
    Extrahieren ab (`items` ohne `tiefe` — das Feld existiert seit M6 nur für Bund/Fedlex), und die
    Renderer-Fallback-Heuristik (`ArtikelBody.tsx`) rät die Stufen mit der **inversen** Annahme
    (lit.=Hauptstufe, Ziff. danach=Unterstufe) → § 71 rückt «2. das Dreiergericht» UNTER lit. a/b
    ein, Haupt- und Unterpunkte erscheinen vertauscht. **§1-Folge, darum kein Kosmetik-Punkt: die
    Zitat-Kette der Zitierknöpfe baut auf den geratenen Stufen** — präzise Zitate («§ 71 Abs. 1
    Ziff. 2 lit. b GOG») können falsch zusammengesetzt werden. Konkreter, **sofort baubarer**
    Einzelfall der K-15-Klasse mit bereits erfüllter Diagnose-Auflage (richtige Schicht = Adapter,
    Quelle ist nachweislich reich genug); NICHT K-G4 (das ist die andere Block-Klasse
    `enumeration_tabular`/Barème). Risikopfad (Extraktion) ⇒ `check:gegenpruefung`, Opus.
    Detail: diese Datei §1-D.
  - **K-18 · Verweis-Erkenner: zusammengesetzte Abs.-/Art.-Angaben** *(Anlassfall `BS-154.100`
    § 92 Abs. 1 lit. d/f GOG, David: StGB-Verweise nicht verlinkt)*. **Am Erkenner reproduziert:**
    `normVerweiseImText` (geteilt, `src/lib/fedlex.ts`) erkennt «Art. 62c **Abs. 1-3 und Abs. 6**
    StGB», «Art. 63b **Abs. 2, 3 und 5** StGB» und «(Art. 7 **Abs. 3, 39 und 40** JStPO)» NICHT
    (je 0 Treffer); einfache Formen inkl. Buchstaben-Artikel (62a/62c) treffen. **Wirkung
    site-weit, nicht kantonsspezifisch** — Ausmass obere Schranke ~117 Stellen / **72 Erlasse**
    (Bund + Kanton). Vorbild für den Fix: `artikelnPluralVerweise` (Plural-Formen sind gelöst).
    Eigene Einheit statt K-5-Anbau (K-5 = «EINE Einheit, gleiche Datei» für §-Verweise); kein
    Korpus-Rebuild, golden-neutral; Leitplanke «kein Link besser als falscher Link» (§1).
    Detail: diese Datei §1-D/K-18.
  Trailer `Roadmap: W2·13-KANTONE`.

> **Ist-Stand-Messung 31.8.2026 (lebendige Spec, Anlass: Bau-Session W2·13-KANTONE; Erhebung
> read-only am Stand `337d2c9ef`).** Die §1-A-Specs (12.7., archiviert) sind an mehreren Stellen
> vom Ist-Code überholt — massgeblich für den Bau ist dieser Block:
> - **Bereits gebaut:** K-1c «SR»-Label (Ä75 18.8.2026, Weiche `src/pages/gesetz-leser/helpers.tsx`
>   `kennungEtikett`) · K-1d Titel-Dopplung Kopf-Teil (`ErlassLeserKopf.tsx`, `titelRedundant`) ·
>   K-2c Abdeckungs-Kontextzeile (`src/pages/Gesetze.tsx`, Kommentar nennt K-2c).
> - **Gegenstandslos:** K-1e Fussnoten-Stern-Strip — 0 `*`-Vorkommen in 23 370 Marginalien +
>   17 670 Titeln (A42-Generatorfix verwirft `<strong>*</strong>` quellseitig); kein Display-Code
>   bauen (§17-Gegengewicht: was nicht scheitern kann, wird gestrichen statt bewacht).
> - **Zahlen überholt:** F24 betrifft nach der Regenerierung vom 27.7. noch **3** Erlasse
>   (BS-569.500 · GR-310.250 · ZG-641.1), nicht 404; Beleg AG-291.150 trägt heute durchgehend
>   `gliederung`. F26-Prämisse falsifiziert: `currency.json` hat 0 kantonale Einträge — der Chip
>   behauptet keine Geltung mehr; offen ist nur die fehlende zweite Stufe («Geltung ungeprüft»).
> - **Anker-Umzüge:** `inhalt-volltext.tsx`-Zweig → `v3/LeserLesespalte.tsx` (Block-vor-Sektionen);
>   `GesetzLeser.tsx:6` → `src/pages/GesetzLeser.tsx:56`; `relevanz.ts` →
>   `src/lib/normtext/relevanz.ts`; `suche-kern.ts` → `scripts/datenhaltung/suche-kern.ts`;
>   statischer Suchpfad `artikelVolltext.ts` ist bereits ebenen-bewusst, nur der Online-Pfad
>   (`onlineVolltext.ts`) nicht.
> - **K-11-Profil (31.8.2026, Dossier `bibliothek/seo/kanton-reader-profil-2026-08-31.md`):** das
>   50-s-Symptom der Spec war ohne Messbedingung notiert und liess sich nicht reproduzieren
>   (Maximum 21.6 s bei 6×-CPU + langsamem 3G; Streuung n=12: 8.7 %). Gemessene Blocker:
>   `/rechtsprechung/register.json` (753 KB gzip) lädt auf jeder Leserseite (−16–19 % First-Article
>   im A/B) · serielle Kette Register→Snapshot · Drei-Wellen-Chunk-Kaskade. Fixes = eigener
>   Schritt mit §15-Logikverlust-Bewertung, nicht Teil von W2·13-KANTONE.
> - **Prozess:** `src/lib/normtext/**` zählt mechanisch als Risikopfad (`istRisikoPfad`) — auch
>   Display-nahe Edits dort (relevanz.ts, erlassKopfText.ts) brauchen die Gegenprüfung. Der
>   K-3-Deploy-Vorbehalt («§9-Ja») vom 12.7. ist durch Davids Blanko-Go 24.7. entsperrt.

### Teilschritt-Spezifikation W2·13-KANTONE (verschoben 31.7.2026)

*Aus `ROADMAP.md` hierher verschoben (QS-TOK-Nachdiät, 31.7.2026, Nachhalte-Konvention*
*Ausführungs-Protokoll Ziff. 6). Die ROADMAP führt je Teilschritt nur noch Checkbox,*
*`@meta` und einen Einzeiler; der Wortlaut unten ist die massgebliche Fassung.*

**Schnitt-Begründung (Session-Granularität AP-6) — wörtlich:** *Wörtlich bis auf die Selbstverweise, die am 31.7.2026 auf «diese Datei» neutralisiert wurden (Endprüfung Fix-Runde 1; Fund R2-18).*

  **Session-Granularität (AP-6, 31.7.2026):** je Einheit ein Teilschritt, dieser Schritt bleibt das
  Dach. Die `dep`-Kette K-1 → … → K-14 bildet die Vorgabe des Fahrplans **«Ausführungsreihenfolge =
  Tabellen-Reihenfolge»** (§1-A) maschinenlesbar ab und erfüllt damit zugleich den harten
  G4-Constraint «K-7a F20-Gate vor jedem FR/VS/AR-PDF-Nachzug» (betrifft K-12a). **Bewusst NICHT
  als Teilschritt:** K-G1…K-G5 (gegatet bis zur E3-Slot-Freigabe, Leitprinzip 4), K-15 (David:
  «später»), K-16/K-17/K-18 (§14-Intake-Nachträge, bleiben vorerst unter dem Dach).

**Ursprünglicher Wortlaut der Teilschritt-Bullets — wörtlich:** *Wörtlich bis auf die Selbstverweise, die am 31.7.2026 auf «diese Datei» neutralisiert wurden (Endprüfung Fix-Runde 1; Fund R2-18).*

  - [ ] **K-1 · Reader-Treue P0** *(F24/F25/F28/F33/F29-Display/F5, M)* — Lesereihenfolge, Doppel-Decode, «SR»-Label, Titel-Dopplung, Fussnoten-Stern-Strip, A14-Relevanz fr/it; reine Display-Schicht. Detail: diese Datei §1-A. Trailer `Roadmap: W2·13-KANTONE-K1`.
  - [ ] **K-2 · §8-Ehrlichkeit UI** *(F26-UI/F37/F44/F27-Rest, S–M)* — zweistufiger Currency-Chip, Kanton-Hinweis im KontextPanel, Abdeckungs-Kontextzeile, «Stand unbekannt», Systematik-Hinweis; reine Anzeige. Detail: diese Datei §1-A. Trailer `Roadmap: W2·13-KANTONE-K2`.
  - [ ] **K-3 · Suche: Kanton-Treffer auf die richtige Ebene** *(F35/F36, S)* — Edge-DTO um `ebene`/`kanton`, Treffer-Href auf `/gesetze/<ebene>/…`, Kanton-Marke, Reader-Redirect als Defense-in-depth. **`api/suche`-Änderung geht erst mit Davids §9-Ja live.** Detail: diese Datei §1-A. Trailer `Roadmap: W2·13-KANTONE-K3`.
  - [ ] **K-4 · Einzel-Nachzüge Stand/Currency** *(F14/F9 + SO-Lektion, S — **Risikopfad**, `QS-GP`)* — ZG-161.7 nachziehen, SZ-Stand klären, Invariante «stand ≤ Generierungsdatum» ins Tor `check:normtext`, Vollständigkeits-Invariante gegen den strukturell blinden Drift-Check. Detail: diese Datei §1-A. Trailer `Roadmap: W2·13-KANTONE-K4`.
  - [ ] **K-5 · NormText-Verweise Kanton** *(F41 → F40 → F42, M)* — **EINE Einheit (gleiche Datei)**, golden-neutral; harte Binnenfolge **F41 vor F40** (sonst fehlt der Ersatz), F42 nachrangig. Detail: diese Datei §1-A. Trailer `Roadmap: W2·13-KANTONE-K5`.
  - [ ] **K-6 · Quellen-Hygiene: lexfind → amtlich + Dedupe** *(F7/F8/F15/F11/F25-Keys/F22, M — **Risikopfad**, `QS-GP`)* — **pro Kanton eine Tranche**; Binnenfolge K-6a (Dedupe) vor K-6d (GL-Key-Migration). Detail: diese Datei §1-A. Trailer `Roadmap: W2·13-KANTONE-K6`.
  - [ ] **K-7 · PDF-Werkstatt VD/SZ/ZH + Range-Platzhalter** *(F20-GATE/F17a/F18/F16/F19/F23/F13, M — **Risikopfad**, `QS-GP` + pdfplumber-Gegenprobe)* — Teil a ist das **harte Dehyphenations-Gate**; ohne es bleibt jeder FR/VS/AR-PDF-Nachzug gesperrt. Detail: diese Datei §1-A. Trailer `Roadmap: W2·13-KANTONE-K7`.
  - [ ] **K-8 · xhtml-`<p>`-Strukturerhalt** *(F21, M)* — `parseSegment` im LexWork-Adapter, Schema nur additiv, Golden-Diff korpusweit offline; **Regeneration kantonsweise, > 2 Kantone → in K-G1 einhängen**. Detail: diese Datei §1-A. Trailer `Roadmap: W2·13-KANTONE-K8`.
  - [ ] **K-9 · Erlass→Werkzeug-Brücke Kanton** *(F38, M)* — Build-Zeit-Inversion der Tarif-`quelleUrl`s zu `KANTON_ERLASS_WERKZEUGE`, Mapping nur bei exaktem Match, Konsistenz-Tor; reine Metadaten, kein Slot. Detail: diese Datei §1-A. Trailer `Roadmap: W2·13-KANTONE-K9`.
  - [ ] **K-10 · AR-Sidecar-Batch** *(F30-AR, M)* — 263 der 314 fehlenden Struktur-Sidecars sind AR; nur amtliche Überschriften, **Einzel-Erlass-POC vor dem Batch**; 1 Kanton = slot-frei. Detail: diese Datei §1-A. Trailer `Roadmap: W2·13-KANTONE-K10`.
  - [ ] **K-11 · Kanton-Reader-Performance profilieren** *(F32, M)* — **erst messen**: `check:perf-budget` um den Kanton-Leserpfad erweitern, nichts «fixen» vor dem Profil (Ursache unbewiesen). Detail: diese Datei §1-A. Trailer `Roadmap: W2·13-KANTONE-K11`.
  - [ ] **K-12 · Reports & kuratierte Listen** *(F3-Report/F4-Liste/F33-Daten, S–M)* — lesend/planend; K-12b ist reine Planung ohne Fetch, K-12a-AR-Anteile erst nach dem F20-Gate aus K-7. Detail: diese Datei §1-A. Trailer `Roadmap: W2·13-KANTONE-K12`.
  - [ ] **K-13 · Systematik-Bäume 7 Kantone** *(F6≡F43, M)* — ZH/GE/VD/TI/SZ/NE/JU fehlen (19 von 26 vorhanden); Quell-Erhebung je Kanton empirisch und browserlos, kantons-einzeln frei. Detail: diese Datei §1-A. Trailer `Roadmap: W2·13-KANTONE-K13`.
  - [ ] **K-14 · Kantonales Zitat-Vokabular — POC** *(F39, L — **Risikopfad**, `QS-GP`)* — POC über 5 Gerichts-Kantone × 6 Entscheide, nur exakte Sammlungsnummer-Matches, additiver Extraktions-Pass. **Prämisse «Entscheid-`normKeys` sind Bund-only» vor dem Bau gegen `W2·6-NKEY` nachmessen.** Detail: diese Datei §1-A. Trailer `Roadmap: W2·13-KANTONE-K14`.

### Dach-Prosa W2·13-KANTONE im Wortlaut (verschoben 31.7.2026) *Wörtlich bis auf die Selbstverweise, die am 31.7.2026 auf «diese Datei» neutralisiert wurden (Endprüfung Fix-Runde 1; Fund R2-18).*

*Aus `ROADMAP.md` hierher verschoben (QS-TOK-Nachdiät, 31.7.2026); massgebliche Fassung.*

>   44 Befunde + 3 Kritik-Linsen, davon 10 live an Amtsquellen re-verifiziert)* — **14 sofort
>   baubare Einheiten K-1…K-14** (kantons-einzelne Fixes + Display-/UI-Schicht, slot-frei);
>   Extraktions-Anteile sind Risikopfad ⇒ `QS-GP` + golden byte-gleich.
>   **Detail:** diese Datei §2. Trailer `Roadmap: W2·13-KANTONE`.

### Restposten aus ROADMAP.md *(verlagert 20.9.2026)*

Herkunft: `ROADMAP.md`, Dach-Schritte `W2·13-KANTONE` (Darstellung) und
`W2·13-KANTONE-DATEN` (Daten/Extraktion). Anlass: der 120-KB-Deckel des Plans, Entscheid
David 20.9.2026 — in `ROADMAP.md` bleiben Ziel, Auflagen, Status und der Zeiger auf diesen
§2, die Unterpunkt-Listen stehen ab hier. **Wortlaut byte-genau, nichts zusammengefasst.**
In `ROADMAP.md` bewusst geblieben sind die vier `K-15`/`K-16`-Nachzüge (fachliche Abnahme
bzw. Entscheid David, §7) sowie `ZH-Programm` und `ZH-Tranche` (Auftrag David 31.8.2026,
Stufen-Status `[~]`).

**A · aus `W2·13-KANTONE` (Darstellung & Suche):**

  - [x] **Erledigt:** K-1 · K-2 · K-3 · K-5 · K-11 — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 7.9.2026 (2).
  - [ ] **des/der-Guard Bund passus-tolerant** *(K-5-Ausläufer, Messung 31.8.2026)* — hätte 371 Self-Links in 226 **Bundes**-Erlassen entfernt ⇒ fachliche Änderung mit eigenem Schritt (§6.3), nicht golden-neutral; Caveat: die «über»-Alternative erzeugt echte Self-Verweise (VTS art_222j), 7 von 8 Stichproben der Kandidaten waren falsch.
  - [ ] **Kanton-Lücken-Hinweis auch im prerenderten HTML** *(Auflage F4 Gegenprüfung PR #616, 2.9.2026)* — der Hinweis «Nicht vollständig erfasst» erscheint erst nach Hydration; `scripts/prerender.ts` (`erlassVolltextHtml`) kennt den Sidecar `kanton-luecken.json` nicht ⇒ §8-Offenlegung fehlt für Crawler/No-JS, und `check:perf-lighthouse` misst nur `/gesetze/bund/OR` (CLS des Kanton-Kopfs unbewacht). Zwei Renderpfade, einer offenbart (§5).
  - [ ] **«§ N» in Fremdgesetz-Chapeau-Items verlinken** *(K-5-Lücke, 31.8.2026)* — `ArtikelBody` baut `fremdIntern` ohne `paragrafDesigniert`; dort bleibt «§ N» unverlinkt (konservativ, §1-konform — Nachzug klein).

**B · aus `W2·13-KANTONE-DATEN` (Daten & Extraktion):**

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
  - [ ] **PDF-Pfad liest Ziffern-Tarife falsch** *(19B-Nachtrag 13.8.)* — SG-3849-Wurzel: generisches «Art. N»-Muster greift auch in Querverweisen; Regel «Nr. XX.YY am Zeilenanfang» nötig. §1-A.
  - [ ] **Fassungs-Drift PDF-erfasster Snapshots unbemerkt** *(§17-Wurzel-Fix)* — `fassungsToken` ändert sich nicht bei neuer Portal-Fassung (SG-2808 hängt an 2808/2012, amtlich gilt 3863). Nötig: Tor `current_version.id` ↔ Snapshot. §1-A.
  - [ ] **Kern-Kategorie als Registerfeld statt Titel-Muster** *(§17-Wurzel-Fix, Gegenprüfung 31.8.2026 Befunde 1+2)* — heute entscheidet die zufällige Wortzusammensetzung («Handänderungs**steuergesetz**» trifft, «Gesetz über die Handänderungssteuer» nicht; 15 Erlasse tragen die Sache nur im Kürzel, Bestandsmuster lesen nur den Titel). Deklariertes Feld in der Pipeline-Quelle, Muster-Raten zurückbauen; dabei die David-Frage «Handänderungs-/Grundbuchabgaben = Kernklasse?» mitentscheiden lassen.
        *Teil-eingelöst 31.8.2026 (N0b): das deklarierte Feld existiert jetzt —… — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 8.9.2026 (Landung).*
  - [ ] **SG-Langform-Erstzitate heben Recall der Zitat-Brücke** *(GP-N0-Hinweis 31.8.2026)* — 802/7790 SG-Nummern-Zitate mit vorhandenem Snapshot bleiben unaufgelöst (10,3 %; Muster: Langform-Erstzitierung «…gesetz, GOG; SG 154.100», BS-154.100 allein 396×) — Wurzel kanton-norm-resolver.ts (Altbestand); SG-Nummern-Fenster über die Langform ⇒ ~+800 Paare. Dazu: normkeys-kanton.json beim ERSTEN UI-Konsum in DATEN_BUDGET eintragen.
  - [ ] **Manifest-Sprache ehrlich + Dubletten** *(Befund Bau W2·13-KANTONE 31.8.2026)* — 37 fr/it-Erlasse als `sprache:'de'` deklariert (nur 2 korrekt ≠ de, §8); mehrere Erlasse doppelt im Manifest (FR-261.16-Notariatstarif, JU-Décret émoluments, TI-Legge tariffa giudiziaria, VS-Notariats-Règlement). Pipeline-Quelle fixen, nie die Projektion (§5).
  - [ ] **lexfind-API-Vertrag gebrochen** *(Inventar-Nebenfund 31.8.2026)* — `POST /api/fe/de/fulltext-search` weist das im Repo dokumentierte Schema (23.6.2026) mit HTTP 400 «Obsolete keys» ab; neues Schema im ZH-Dossier dokumentiert. Betrifft `scripts/normtext/lexfind-discovery.ts` (andere Kantone; ZH braucht lexfind nicht mehr). Nachziehen, bevor der nächste lexfind-Discovery-Lauf ansteht.



---

## §3 · Inhaltsdrift der kantonalen Snapshots gegen die Quellen (`W2·13-KANTONE-DRIFT`, Befund 2.8.2026)

**Befund (Herkunft ehrlich ausgewiesen).** Beim Nachführungs-Durchgang vom 2.8.2026 wurde die
Bundes-Ebene bewusst allein bearbeitet (`--nur=bund`). Der Drift-Abgleich meldete dabei für die
**kantonale Ebene rund 28 Snapshots mit echter Inhaltsdrift** gegenüber den Amtsquellen, unter
anderem:

- **BE 154.21** — neue Fassung per **1.8.2026**;
- **AG 291.150** — neu **aufgehobene Artikel**.

**Verifikations-Stand: UNVERIFIZIERT.** Die Zahl 28 und die beiden Beispiele stammen aus dem
Lauf-Protokoll jenes Durchgangs und sind hier als **Anlass** festgehalten, nicht als Ergebnis. Sie
werden im Schritt selbst **neu erhoben** (`npm run check:normtext-netz`, nackt, volle Ausgabe
lesen) — die Liste wird sich bis dahin bewegt haben, und eine übernommene Zahl wäre eine zweite
Wahrheit (§5) plus eine Behauptung ohne eigenen Beleg (§7). Ausgangspunkt ist der Lauf, nicht
dieser Absatz.

**Warum ein eigener Schritt und kein Anhängsel.** Kantonale Nachführung ist **Korpus-Produktion**,
nicht Darstellung: pro Erlass Quelle mit Stand, Anker-Prüfung, Re-Extraktion, Snapshot-Neubau.
Das ist ein **Risiko-Pfad** und wird nach Skill **`korpus-werkstatt`** gefahren, mit
`npm run check:gegenpruefung` als Tor. An einen UI- oder Currency-Schritt angehängt, liefe es
ungegated mit — genau die Vermischung von Risiko-Klassen, die §14.2 untersagt.

**Auflagen (bindend).**

1. **Je Erlass ein Beleg:** amtliche Quelle-URL + Konsolidierungs-/Abrufdatum, sichtbarer
   Live-Link im UI, Drift-Erkennung aktiv — die vier Merkmale der Zitat-Ausnahme (CLAUDE.md §7).
   Fehlt eines, wird der Snapshot **nicht** aktualisiert, sondern der Erlass als offen ausgewiesen.
2. **Aufgehobene Artikel** (AG-Fall) sind ein §8-Thema, kein Löschthema: die Aufhebung wird
   **sichtbar** gemacht, nicht der Artikel stillschweigend entfernt.
3. **Determinismus:** Generator zwei Läufe byte-gleich; Diffs an unbeteiligten Kantonen sind ein
   Fehlschlag, kein Rauschen.
4. **`verified: true` / Status «geprüft» setzt niemand automatisch** — fachliche Abnahme David
   (§7/§8).
5. **Portionierung:** kanton-weise, nicht in einem Rutsch — ein Sammel-Commit über 28 Erlasse ist
   nicht mehr prüfbar.

*Hinweis zur Herkunft: Zu diesem Punkt hat ein Sub-Agent am 2.8.2026 einen Task-Chip angelegt.
Der Chip ist durch diesen Plan-Eintrag **ersetzt** (Vorgabe David: keine Chips) — massgeblich ist
allein dieser §.*

---

## §4 · ZH-Tranche: Inventar → Kern-Erlasse → Ausbau (Auftrag David 31.8.2026, lebendige Spec)

**Anlass:** Auftrag David 31.8.2026 «Zürcher Gesetze inventarisieren und in LexMetrik
einbauen», zwingend gestuft (Messen vor Handeln). Grundlage: Dossier
[`bibliothek/recherche/zh-quellinventar-2026-08-31.md`](../bibliothek/recherche/zh-quellinventar-2026-08-31.md)
(944 in-Kraft-Erlasse, Formate, Fallen) + interner Pipeline-Befund (HEAD `cec6cdbfb`).

**Stufe 1 — Inventar: erledigt 31.8.2026.** Kernbefunde: Bestand **944** (amtlicher
JSON-Endpunkt `lawcollectionsearch…zhweb-zhlex-ls.zhweb-cache.json`, ordner-weise
`fileNumber=1…14`, Kappungs-Flag geprüft); Volltext **nur PDF** (kein XML/DOCX/HTML —
Formatleiter-Abstieg beweisgeführt, `adapter-zh-pdf.ts` bleibt der Weg); Systematik
Ebene 1 = **14 Ordner** browserlos aus server-gerendertem HTML; Drift-Token =
**PDF-ETag/Last-Modified** auf notes.zh.ch (Registry-`Last-Modified` ist Abrufzeit,
unbrauchbar); lexfind für ZH obsolet (und dessen API-Vertrag ohnehin gebrochen —
eigener ROADMAP-Punkt).

**Stufe 2 — Kern-Tranche (Bauschritt, kein Datenlauf):**

1. **ZH-4a · Deklarative ZH-Quellenliste** (~20 Kern-Erlasse aus Dossier §6:
   KV 101 · GOG 211.1 · AnwG 215.1 · NotG 242 · StG 631.1 · VRG 175.2 · GG 131.1 ·
   EG ZGB 230 · PolG 550.1 · PBG 700.1 … je LS-Nr + Registry-URL + erwartetes Kürzel),
   eingehängt in `sammleZhPdfInventar()` (`inventar-kanton.ts:340`) **UND**
   `check-drift.ts:321` — NIE über `src/data/tarif/*.ts` (reisst `lexmetrik-golden.json`).
   Damit schliesst sich die §7-d-Lücke (Erlasse ohne Tarif-Zitat waren driftblind).
2. **ZH-4b · `holeZhPdf`-Retry (§17-Wurzelfix):** nacktes `fetch` ×3/Erlass →
   `fetchMitWiederholung` (`netz-retry.ts`), Tranchen-Rate ≤ ~1 req/s gegen notes.zh.ch
   (BS-Sonderfall-Regel G2: ein Kanton, aber Massenzugriff). Fetch-Fehler dürfen nie
   still verschluckt werden (Lauf bricht sichtbar ab oder listet Fehl-Erlasse).
3. **ZH-4c · Systematik ZH Ebene 1** (K-13-Anteil): die 14 Ordner (Nummernband→Thema,
   Dossier §3) als ZH-Eintrag in `kanton-systematik.json` — Quelle server-gerendertes
   HTML der Suchseite; Zuordnung Erlass→Ordner deterministisch über das Nummernband.
4. **Beweise (G5):** je Snapshot Norm + amtliche Quell-URL + Stand + `fassungsToken`
   (quelleHash; §7-Zitat-Ausnahme alle vier Merkmale) · `lexmetrik-golden.json`
   byte-gleich · `normtext-snapshot.json` rein additiv (Alt-Keys unverändert, git-diff) ·
   pdfplumber-Gegenprobe an ≥2 neuen PDFs (G3) · Identitätsbeleg n ≥ 10 gegen die
   Amtsquelle im PR-Body (landung 6b) · Gegenprüfung Pflicht, Auto-Merge gesperrt.
5. **Bekannte Fallen** (Dossier §5/§7): HTTP 204 leer bei 0 Treffern · 150er-Kappung ·
   AEM-Komponenten-ID zur Laufzeit auflösen · `istZh21111`-Hardcode + `'4' in artikel`-
   Staffel-Heuristik je neuem Erlass prüfen · Spiegelrand-Layout-Annahmen empirisch
   verifizieren (VRG 1959 und PBG 1975 sind alte Sätze!).

**Stufe 2 — Ergebnis 31.8.2026 (lebendige Spec fortgeschrieben, nicht rückwirkend korrigiert):**

- **Gebaut:** ZH-4b (Retry + serielle ~1-req/s-Drossel in `holeZhPdf`, Fehl-Erlass
  bricht den Lauf sichtbar ab — Rot-Beweis mit einem nicht existierenden
  Listen-Eintrag: Exit 1) · ZH-4a (`scripts/normtext/zh-quellen.ts` +
  Auflöse-Werkzeug `zh-quellen-aufloesen.ts`; Vereinigung mit der Tarif-Ableitung
  in `sammleZhPdfInventar()`, `check-drift.ts` liest dieselbe Funktion) · ZH-4c
  (`scripts/normtext/zh-systematik.ts` → ZH-Zweig in `kanton-systematik-run.ts`).
- **Bilanz:** 20 Kern-Erlasse importiert, 23 ZH-Erlasse gesamt, 2371 Snapshots.
  `check:normtext-netz` prüft jetzt **23** statt 3 ZH-Gruppen → die §7-d-Lücke ist
  messbar geschlossen.
- **Zurückgestellt (Qualitäts-Triage §1):** **LS 101 KV** — zählt in «Art. N»,
  der ZH-Adapter kennt nur «§ N.» → 0 Paragraphen. **LS 131.11 VGG** — der
  Anhang-Zweig zerlegt den Kontenrahmen in 397 Pseudo-Paragraphen
  («Anhang Ziff. 3637.24 Beihilfen»). Beides braucht einen Adapter-Schritt.
- **Auftragskorrektur (§7):** LS 323.1 heisst amtlich **GebV StrV** (Dossier §6
  führte «GebV Strafverfolgung», eine Sachbezeichnung).
- **Neuer Befund ZH-4d (offen, blockiert Stufe 3 nicht):** Der §-Segmentierer
  hängt Gliederungs-Überschriften zwischen zwei §§ («4. Abschnitt: Medien») an
  den letzten Block des VORANGEHENDEN § — 129 Blöcke in 16 der 20 Erlasse. Kein
  Textverlust, aber falsche Zuordnung. In den drei Bestands-Erlassen (kurze
  Gebührenverordnungen ohne Zwischentitel) trat das nie auf — darum bis jetzt
  unentdeckt. Zweitbefund: der Loseblatt-Änderungsapparat am Erlass-Ende landet
  im letzten § (10 von 2173 Artikeln). Drittbefund: Gebührentabellen in 323.1 /
  212.812 bleiben Fliesstext (der `mehrspaltig`-Zweig ist auf ZH-211.11/215.3
  §3/§4 verdrahtet) — Werte vollständig, Struktur flach.
- **Fremdbefund (nicht mitgenommen):** ein frischer `kanton-systematik-run.ts`
  zeigt Upstream-Drift bei **AG** (Knoten 401 entfallen) und **BS** (731, 788,
  RiE#731 neu). Der Commit hält den Diff bewusst ZH-only; die Drift gehört in
  einen eigenen Schritt.

**Stufe 2 — Fix-Runde nach adversarialer Gegenprüfung, 31.8.2026.** Die
Gegenprüfung hat die Kern-Tranche **widerlegt** (stiller Textverlust in fünf
Klassen). Alle Wurzeln an der Roh-Geometrie der 24 amtlichen PDF diagnostiziert,
nicht am Symptom geraten. Stand nach der Runde:

| Befund | Wurzel | Behoben |
|---|---|---|
| **B-1** lit.-Verlust «flächendeckend» | — | **FALSIFIZIERT.** Der Bestand trug schon vorher 1771 lit.-Positionen in `items` (527 von 4917 Blöcken); die genannten Belege ZH-215.1 § 11, ZH-212.812 § 3, ZH-175.2 § 10 Abs. 3/4 hatten ihre Aufzählung vollständig. Der Befund zählte lit.-Muster offenbar im `text`-Feld statt im `items`-Array. Messung nach dem Fix: lit.-Deckung gegen die unabhängige Zweitlesung 23× 100 %, schlechtester Wert 99.7 %. |
| **B-2** Fussnoten-Ziffer als Absatznummer | pdfjs gibt jeder Hochstellung eine eigene Grundlinie (2.76 pt) → eigene y-Gruppe → Position 0 → als Absatznummer gelesen | ja — Hochstellung wird ihrer Trägerzeile zugeordnet |
| **B-3** «§» im Fliesstext beendet den Artikel | `PARAGRAF_KOPF` unverankert; `speichere()` verwarf den gesehenen Token still | ja — Zeilenanker + Wiedereröffnung verboten (26 Stellen) |
| **B-4** Wortverschmelzung | Leerzeichen erst ab 18 pt Fragmentlücke | ja — Schwelle 0.8 pt aus der gemessenen Lückenverteilung |
| **B-5** aufgehobene §§ verschwanden | nackter Kopf ohne Blöcke fiel weg | ja — Platzhalter «Aufgehoben», 60 eIds gerettet |
| **B-6** Änderungsapparat im letzten § | Erkennung über Eröffnungs-Wendungen, Fortsetzungszeilen liefen durch | ja — geometrisch (Fussnoten-Grundschrift) + Grenze «Übergangs-/Schlussbestimmung»/«Anhang» |
| **B-9** erfundenes Kürzel «AnwG» | `kuerzel` wurde vom Auflöse-Werkzeug gar nicht geprüft | ja — Feld geleert, Prüfung ergänzt |
| **E1** leerer Einleitungssatz vor Tarif-Tabellen | `text` wurde hart auf `''` gesetzt | ja — Einleitung wird gelesen, Einheit «(in Franken)» im Spaltentitel |
| **E2-H1** «Art. N»-Erlasse | Adapter kannte nur «§ N.» | ja — Zählweise je Erlass erhoben; **LS 101 KV aufgenommen** (147 Artikel) |
| **E2-H4** falscher `stand` | Ur-Inkrafttreten aus dem URL-Slug | ja — Publikationsdatum der geltenden Nachtragsfassung aus der Registry |
| **NEU (nicht im Befund)** lat. Suffix ging verloren | «§ 183^bis» stand als Geisterzeile «bis»; der Kopf las «§ 183» und kollidierte | ja — ZH-230 §§ 174bis/183bis/183ter/183quater sind wieder eigenständig |

**Neues Tor `check:zh-vollstaendigkeit`** (§17-Verankerung): hält den Snapshot
gegen eine **unabhängige zweite Lesung** derselben PDF (eigenes Modul
`scripts/normtext/zh-zweitlesung.ts`, teilt keine Zeile Code mit dem Adapter) —
§-/Art.-Menge exakt, lit.-Deckung ≥ 95 %, kein Block endet auf einem
Trennstrich. Rot-Beweis am unfixierten Korpus: 14 von 23 Erlassen rot; nach der
Regeneration 24 von 24 grün. Das Tor hat dabei einen Fehler der Fix-Runde selbst
gefangen (Apparat-Kante nach Ziffernhöhe verschluckte ZH-211.1 § 105 Abs. 2 und
§ 106).

**Rückbau (§17-Gegengewicht):** `entglueZhTarif()` ersatzlos gestrichen — nach
dem Geometrie-Fix trat keine ihrer sechs Klebe-Formen mehr auf, ihre
camelCase-Regel zerschnitt dagegen 60+ amtliche Abkürzungen («StGB» → «St GB»,
«SchKG» → «Sch KG»).

**Bilanz Fix-Runde:** 24 Erlasse, 2371 → 2573 Einträge; abgeschnittene Blöcke
13 → 0, Klebe-Abkürzungen 83 → 0, fehlende Leerzeichen 826 → 0,
Apparat-Blöcke 43 → 0, leere Tabellen-Einleitungen 3 → 0.

**Stufe 2b — Fix-Runde 2 nach der ZWEITEN adversarialen Gegenprüfung,
31.8.2026.** Die Gegenprüfung hat den Stand der Fix-Runde 1 erneut **widerlegt**.
Die Befundnummern B-1…B-6 dieser zweiten Runde sind **eine eigene Zählung** und
decken sich nicht mit der Tabelle oben (Runde 1) — die Runde-1-Zeilen bleiben
unverändert stehen, sie waren zu ihrem Datum richtig.

| Befund (Runde 2) | Wurzel (an der Roh-Geometrie aller 24 PDF gemessen) | Behoben |
|---|---|---|
| **B-1** Absätze mit lat. Suffix fehlten als eigene Absätze (0 im ganzen Korpus) | pdfjs liefert «2bis» als EIN Fragment (x 68.0, h 5.70, eigene y-Gruppe); das Muster `/^\d+$/` verwarf es als Nicht-Ziffer und schob es in die Trägerzeile — die Absatznummer landete als nackter Text im Vorgänger-Absatz | ja — `ABSATZ_HOCHZAHL` (Ziffer + optionaler Suffix) an beiden Entscheidstellen; **6 Blöcke**: ZH-101 Art. 104 Abs. 2bis, ZH-631.1 § 7 Abs. 1bis + 1ter, §§ 30/35/47 Abs. 2bis |
| **B-2** Sammel-Aufhebungsköpfe «§§ A–B.» nicht erkannt | `PARAGRAF_KOPF` schliesst «§§» ausdrücklich aus → die Zeile war gewöhnlicher Text und klebte am Vorgänger-§; die genannten §§ fehlten ersatzlos | ja — GEOMETRISCH über den hängenden Kopf-Einzug von **14.2 pt** (gemessen an 2376 Kopfzeilen: p05 = med = p95 = 14.2; die textgleiche Nicht-Kopf-Zeile ZH-331 § 17 liegt bei 0). 38 Köpfe, **215 Platzhalter**; ZH-230 172 → 313 Einträge |
| **B-3** Gliederungstitel im Normtext (103 Blöcke, 10 Erlasse) | «2. Kapitel: Grundrechte» steht in Body-Schrift ohne Einzug — vom Schriftbild nicht von Fliesstext trennbar | ja — `GLIEDERUNG_ZAEHLEND` (Zähler + Gliederungswort + **Doppelpunkt**); am Gesamtbestand erhoben, 0 Fehltreffer gegen die Fliesstext-Vorkommen derselben Wörter |
| **B-4** Tor teilte die blinden Flecken (COMMON MODE) | die Zweitlesung kannte weder «§§» noch den lat. Suffix, prüfte keine Gliederungstitel und keine Werte → Prüfungen 1/2 trügerisch grün | ja — vier neue Prüfungen, jede einmal rot gezeigt (s. u.) |
| **B-5** erste Staffelzeile ohne Spaltentrennung | pdfjs liefert «000 25% des Streitwertes …» als EIN Fragment über die am Spaltenkopf **gemessene** Grenze hinweg | ja — `teileAmSpaltenrand` trennt an der Wortgrenze, die der Spaltengrenze am nächsten liegt (gemessener Abstand 3.5 pt, Toleranz 12 pt). Wirkt auch auf ZH-215.3 § 4 |
| **B-6** Auslassung unsichtbar | Übergangs-/Schlussapparat und PBG-Anhang werden bewusst weggelassen — das stand nur im Code-Kommentar | ja — `public/normtext/kanton-luecken.json`, 15 Erlasse mit Klartext-Hinweis inkl. Zeilenanteil (ZH-700.1: 486 von 4327 = 11 %) |

**Tor-Härtung (B-4) — vier Prüfungen, jede einmal ROT gezeigt:**
4. §§-Sammelköpfe · Rot: Mutation «§ 58 aus ZH-230 entfernt» → «1 § aus einem
   «§§ …»-Sammelkopf fehlt im Snapshot: 58».
5. Suffix-Absätze je § · Rot: Mutation «ZH-101 Art. 104 absatz 2bis → 3» →
   «1 Absatz mit lat. Suffix im PDF, aber nicht im Snapshot: 104/2bis».
6. Gliederungstitel im Normtext (läuft offline) · Rot am ungeheilten Korpus:
   **14 von 24 Erlassen, 132 Blöcke**.
7. Werte-Wächter (jede Ziffernfolge im Snapshot muss im PDF stehen, **inkl.
   `mehrspaltig`-Zellen**) · Rot: Mutation «ZH-211.11 § 4 Grundgebühr
   1 050 → 1 060» → «§ 4 (Tabelle): «060»». Genau die Klasse, die die
   Mutationsprobe der Gegenprüfung noch durchliess.

Die Zweitlesung bleibt unabhängig (§6.7 lit. d): sie erkennt die Sammelköpfe
**nur an der Textgestalt**, nicht am Kopf-Einzug, und rechnet Bereiche
konservativer aus als der Adapter (nur reine Zahlenspannen). Die Tor-Doku ist
entsprechend ehrlich gestellt — sie versprach «verschwundene aufgehobene §§»,
gefangen wurden aber nur die Einzel-Köpfe.

**Rückbau/Schlankheit:** `adapter-zh-pdf.ts` stand an der §6.6-Baseline
(1421 Z.); die Sammelkopf-Erkennung und -Expansion ist darum als eigenes Modul
`scripts/normtext/zh-sammelkopf.ts` entstanden, statt die Baseline mitwachsen zu
lassen.

**Bilanz Fix-Runde 2:** 24 Erlasse, 2573 → **2788 Einträge** (215 neu, 0
entfallen, 163 inhaltlich geändert); Suffix-Absätze 0 → 6, Gliederungs-Lecks
103 → 0, Sammelkopf-Kontaminationen 26 → 0, Tarif-Staffelzeilen ohne
Spaltentrennung 2 → 0. `golden/lexmetrik-golden.json` unverändert,
`src/data/tarif/**` unberührt. `check:zh-vollstaendigkeit` 24/24 grün,
`check:normtext-netz` ZH-Drift 0.

**Offen nach Runde 2 (bewusst nicht gebaut):**
- Drei Sammel-Bereiche sind nicht lückenlos ableitbar («§§ 74–80 d.»,
  «§§ 39–40 a.», «§§ 137bis–144.»). Erfasst ist das sicher Enthaltene; ob
  dazwischen §§ mit Buchstaben-Suffix stehen, sagt der Kopf nicht und wird
  NICHT geraten (§8). Die Auslassung steht im Lücken-Index.
- Der §8-Lücken-Index liegt als eigene Datei neben den Snapshots, weil die
  Snapshot-JSON byte-genaue Projektionen aus `daten/lexmetrik.db` sind und ein
  Erlass-Feld eine Schema-Änderung in `scripts/datenhaltung/**` verlangte (dort
  wird parallel gebaut). Überführung in die DB-Projektion = Nachzug.
- Die UI weist die Lücken noch nicht aus — der Index macht es nur MÖGLICH.

**Nach ZH-4d verschoben (bewusst NICHT in dieser Runde gebaut):**
- **B-8 / Gliederungs-Zuordnung:** Überschriften zwischen zwei §§ hängen am
  letzten Block des VORANGEHENDEN § (129 Blöcke). Teilentlastung in dieser
  Runde: römische Gliederungsziffern («VII. Enteignungsähnliche
  Beschränkungen») werden jetzt wie die Buchstaben-Gliederung verworfen; die
  Marginalien-/Randnoten-Ebene bleibt offen. Braucht den Tag-Leser-Schritt.
- **Übergangs- und Schlussbestimmungen** sind seit dieser Runde NICHT mehr im
  Snapshot enthalten (§8: ausgewiesene Lücke statt falscher Zuordnung an den
  letzten §). Ihre Aufnahme als eigener Eintragstyp gehört zu ZH-4d — dort
  gehört auch der PBG-Anhang, der ältere Fassungen einzelner §§ nachdruckt.
- **LS 131.11 VGG** bleibt zurückgestellt: der Anhang-Spalten-Zweig zerlegt den
  Kontenrahmen in Pseudo-Paragraphen. Der B-6-Fix hat das nicht nebenbei gelöst.
- **Gebührentabellen in 323.1 / 212.812** bleiben Fliesstext (der
  `mehrspaltig`-Zweig ist auf ZH-211.11/215.3 §3/§4 verdrahtet).

*Ergänzung 31.8.2026, Fix-Runde 2 (die vier Punkte oben bleiben im Wortlaut —
sie beschreiben den Stand nach Runde 1):* Von **B-8** ist seit Runde 2 auch die
ZÄHLENDE Gliederungsform erledigt («2. Kapitel:», «1. Abschnitt:», «Erster
Teil:» — 103 Blöcke); offen bleibt die Marginalien-/Randnoten-Ebene, die
weiterhin den Tag-Leser-Schritt braucht. Die Auslassung der **Übergangs- und
Schlussbestimmungen** und des **PBG-Anhangs** ist seit Runde 2 im Artefakt
ausgewiesen (`public/normtext/kanton-luecken.json`) — die Aufnahme als eigener
Eintragstyp bleibt ZH-4d.

### §4-R3 · Fix-Runde 3 (31.8.2026) — nach der DRITTEN Gegenprüfung (zwei Linsen)

Beide Linsen der dritten Gegenprüfung — Extraktion (GP3a/GP3b) und Tor-Härte
(Zweitlinse, elf Mutationen) — lauteten «noch nicht bestanden». Der gebündelte
Restkatalog ist gebaut; die Befundnummern sind wieder eine EIGENE Zählung.

**A · Extraktion**

| Befund | Wurzel (gemessen, nicht vermutet) | erledigt |
|---|---|---|
| **A1** arabisch nummerierte Gliederungstitel (28 gemeldete Lecks in 6 Erlassen) | Die Wurzel ist die **Schrift**, nicht die Position. Gemessen an allen 24 PDF: 504 Zeilen der Form «N. Text», davon **34 in reiner Titel-Schrift** (ausnahmslos Überschriften), **470 mit mindestens einem Body-Schrift-Fragment** (ausnahmslos Aufzählungen/Fliesstext). Der EINZUG trennt die Klassen NICHT — beide stehen teils bei dx = 0, teils bei dx = 14.2 (dem Kopf-Einzug). Gegenprobe: alle **524** Zeilen, die die bereits bewährten Muster `GLIEDERUNG`/`GLIEDERUNG_ZAEHLEND` treffen, stehen ebenfalls in Titel-Schrift — **0 Ausreisser**; das Kriterium reproduziert den verifizierten Bestand exakt und erweitert ihn nur. | ja — `TITEL_MARKER` trägt die typografische Tatsache durch die Serialisierung, `GLIEDERUNG_ARABISCH` entscheidet NUR zusammen mit ihm; mehrzeilige Titel über eine auf 2 Fortsetzungszeilen **gedeckelte** Kette (der Deckel schützt die vollständig in Titel-Schrift gesetzte Tarif-Tabelle ZH-211.11 § 4). **33 Leck-Blöcke → 0**, 0 Einträge entfallen |
| **A2** ZH-243: «(vgl. Ziff. …)» steht in keinem PDF (32 Blöcke) | Der Adapter synthetisierte den Verweis als Fliesstext; dabei kollabierten ZWEI Quell-Spalten («Grundbuchgebühren siehe Ziff.:», S. 5–7 · «Beurkundungsgebühren siehe Ziff.:», S. 8–14) auf denselben Wortlaut | ja — eigenes Blockfeld `verweis {etikett, ziffern}`, Etikett am Spaltenkopf **gelesen**; 32 → 0 Synthesen, 15 × Grundbuch / 17 × Beurkundung unterscheidbar |
| **A2b** zwei weitere Synthesen geprüft | «Zuschlag» als Spaltentitel (ZH-211.11 § 4, ZH-215.3 § 4): im PDF steht dort **kein** Kopf — die Zuschlagsformel läuft ohne Überschrift neben der Grundgebühr | ja — Titel jetzt leer wie die Quelle. «Aufgehoben» bleibt als **deklarierte Haus-Konvention**, im Code benannt |
| **A3** Aufzählungen ohne `items` | Der Block-Sammler kannte nur die BUCHSTABEN-Marke; Ziffern-Aufzählungen flossen als Prosa durch («… zuständige Behörde: 1. 2. 3. 4. 5. für die …») | ja — Ziffern-Marke mit drei Wächtern (Sequenz · Datums-Ausschluss · Titel-Schrift); aufgehobene Ziffern als Platzhalter statt Prosa; Aufzählungen laufen über die Absatzgrenze (ZH-230 § 44: Abs. 1 Ziff. 1–8, Abs. 2 Ziff. 9–17) |
| **A4** Lücken-Index unvollständig | `schnitt` merkte sich nur den ERSTEN Schnitt je Erlass | ja — alle Schnitte, gleichartige zusammengefasst; ZH-700.1 deklariert jetzt Übergangsapparat (110 Zeilen) **und** Anhang (381). Korpusweit geprüft: die unnummerierten Schlussbestimmungen (ZH-215.3 nach § 25, ZH-101 nach Art. 145, ZH-700.1) tragen alle eine «Übergangsbestimmung …»-Überschrift und waren bereits deklariert. **Ehrlichkeits-Korrektur:** ZH-243 wies seinen Anhang als Lücke aus, obwohl er erfasst IST (132 Ziffern) |
| **A5** Doku-Ehrlichkeit | «7 von 24» war eine Fehlzählung derselben Session | ja — gemessen weichen **11 von 24** Fussband-Marken vom Publikationsdatum ab (URL-Datum: 22 von 24); Modulkopf sagt jetzt, dass `stand` das Registry-Publikationsdatum ist; Sammelkopf-Zählweise erklärt (41 Köpfe = Einzug UND Gestalt · 42 Zeilen blosser Gestalt · 38 = Stand vor dem Suffix-Nachzug) |

**Zwei echte Defekte, die erst der neue lit.-Wächter zutage förderte:** die
NACKTE, aufgehobene lit.-Marke («e.» allein, ZH-631.1 § 23; «d.», ZH-230 § 194)
klebte am Vorgänger-item — und die Zweitlesung zählte sie nicht mit. Beides
behoben; Konvention wie bei den Ziffern und beim nackten §-Kopf.

**B · Tor-Härtung 2 — elf Mutationen, alle einmal ROT gezeigt**

Sandbox-Kopie über `ZH_SNAPSHOT_DIR` (nie im Arbeitsbaum, nie `git checkout`
auf Artefakte — Skill-Regel):

| Mutation | vorher | jetzt gefangen von |
|---|---|---|
| **M6b** Wertetausch «1 050» ↔ «3 150» in ZH-211.11 § 4 | grün (Multimenge unverändert) | 7b Zahlenfolge, «§ 4 bei ‹14›, Stelle 19 von 60» |
| **M6c** 14 % → 8 % | grün (8 kommt anderswo vor) | 7b |
| **M6d** Staffelgrenze ersetzt | grün | 7b |
| **M3** Absatz gelöscht (ZH-631.1 § 7) | grün | 7c Zeichen-Deckung 81 % + Suffix-Absatz |
| **M11** `bloecke: []` | grün | 7c 0 % + lit.-Deckung + 7b |
| **M12** Kappung ohne Trennstrich | grün | 7c 67 % + 7b |
| **M8a** ein lit. gelöscht | grün (99 % ≥ 95 %) | 2 lit. EXAKT je § «§23 5/6» + 7c |
| **M9b** U+2011 | grün | 3 Trennstrich-Varianten |
| **M9c** Kappung nach Ziffer | grün | 3 + 7b |
| **M13** 40 Anhang-Tarif-Ziffern gelöscht | grün (118 von 150 unbewacht) | 8 Anhang-Ziffern beidseitig |
| **M14** erfundener «§ 77 b» in einer Sammel-Spanne | grün (Spannen-Nachsicht) | 1 Kopf-Menge; Nachsicht nur noch für den Platzhalter |

**Schwellen, am geheilten Bestand erhoben:** Zeichen-Deckung je § —
2441 Regionen, min 95.9 % · p01 98.3 % · p05 99.0 % · Median 100.0 %; Schranke
**90 %**, also vier Punkte unter dem Tiefstwert. lit.-Deckung je § — **0
Abweichungen in 2656 §§**, darum EXAKT und **ohne eine einzige Ausnahme**.
Zahlenfolge — **7 deklarierte Ausnahmen** mit exaktem Delta (kein Polster), alle
aus der bewussten Konservativität der Zweitlesung, keine aus einem
Snapshot-Mangel.

**Die Zweitlesung selbst war mitschuldig** (jeder Punkt gemessen und behoben):
Body-Spalte 18 pt zu schmal (schnitt jedes Zeilenende ab) · Hochstellungen
zählten als Regions-Zahlen · Art.- und §-Zählweise brauchen GETRENNTE Bücher (in
einem «§»-Erlass riss jede Zeile «Art. 260 a Abs. 1 …» eine Schein-Region auf) ·
keine Wiedereröffnung eines Kopfs (ZH-211.1 § 150 hing an § 31) · Tarif-Zeilen im
Kleinsatz gehörten in die Messung.

**Dritte geteilte Modellentscheidung, offen deklariert** (§6.7 lit. d): «eine
Überschrift steht in der Titel-Schrift». Die Regionen prüfen damit NICHT mehr
unabhängig, ob Überschrift und Aufzählung richtig getrennt wurden — das leisten
Prüfung 6 und die beidseitigen Unit-Tests am Adapter. Für den ZWECK der Regionen
(einen Wert an seinen § binden) ist die Teilung folgenlos: eine falsch
ausgelassene Überschrift fehlt BEIDEN Seiten gleich.

**C · Roh-PDF-Cache (O1) und Drift auf die Quelle (§7 d)**

- `daten/pdf-cache-zh/` (gitignored, Schlüssel sha256(RegistryUrl), Sidecar mit
  ETag/Last-Modified/Abrufdatum/Byte-sha256), drei Modi `auto`/`netz`/`offline`;
  `npm run zh:cache` füllt ihn (24 × 3 = 72 Requests, ~75 s). Regeneration und
  Tor laufen seither OHNE Netz.
- **`fassungsToken` = sha256 der ROHEN PDF-Bytes.** Vorher hashte er die
  Extraktion und war damit blind für jede Quell-Änderung in einem verworfenen
  Teil (ZH-700.1: 14 % der Textzeilen). `meta.extraktHash` bleibt als zweite
  Stufe daneben (nicht im Snapshot gespeichert — die Schema-Erweiterung liegt im
  fremden Datenhaltungs-Strang). **Deklarierter Token-Reset aller 24**, je Erlass
  alt→neu im Commit-Body; `check:normtext-netz` danach Drift 0.

**Verdrahtung (B7):** `--artefakt` (ohne PDF) in `scripts/gate.sh` UND `ci.yml`;
der volle Offline-Teil in `gate.sh`, sobald der Cache da ist — fehlt er, wird das
Überspringen LAUT gesagt (beide Zweige einmal gezeigt: mutierter Snapshot →
`ROT zh-artefakt` + `ROT zh-vollstaendigkeit` + `GATE ROT`; entfernter Cache →
`-- zh-vollstaendigkeit ÜBERSPRUNGEN`).

**Bilanz Fix-Runde 3:** 24 Erlasse, **2788 → 2788 Einträge** (die Zahl bleibt —
diese Runde hat nichts hinzugefügt, sondern Fremdmaterial entfernt und Struktur
gehoben): 99 sha-Einträge geändert, davon ZH-243 32 · ZH-700.1 15 · ZH-211.1 7 ·
ZH-215.1 7 · ZH-230 6 · ZH-175.2 5 · ZH-242 5 · ZH-281.1 5 · ZH-131.1 4 ·
ZH-631.1 4 · ZH-170.4 2 · ZH-323.1 2 · ZH-101/211.11/215.3/331/851.1 je 1.
**0 Nicht-ZH-Einträge berührt**, `golden/lexmetrik-golden.json` byte-gleich,
`src/data/tarif/**` unberührt. `check:zh-vollstaendigkeit --offline` 24/24 grün
mit allen zehn Prüfungen; `check:normtext-netz` ZH-Drift 0.

**Rückbau/Schlankheit:** `adapter-zh-pdf.ts` stand mit 1918 Zeilen 35 % über
seiner §6.6-Baseline; die Geometrie-Schicht ist als
`scripts/normtext/zh-seitenmontage.ts` (544 Z.) herausgelöst, der Adapter steht
wieder bei 1372. Verhaltensneutralität bewiesen: frische Extraktion aller 24
gegen die committeten Snapshots, 0 Zeichen Differenz, Wort-Multimengen je §
identisch.

**Offen nach Runde 3 (bewusst nicht gebaut):**
- Das Feld `verweis` ist im Artefakt, die **UI zeigt es noch nicht** (Design-
  Fläche `src/components/**` ist TABU für diesen Strang) — Nachzug.
- `check:paritaet` ist gegen Datei-LÖSCHUNG blind (am Code belegt: es ingestiert
  die vorhandenen Dateien und vergleicht nur deren Pfade). Fläche
  `scripts/datenhaltung/**` = fremder Strang, als ROADMAP-Zeile hinterlegt.
- Silbentrennungs-Fehler bei ECHTEN Bindestrich-Ellipsen: «Grenz- und
  Gebäudeabstände» wird zu «Grenzund». Der Zeilen-Joiner kann die Ellipse
  nicht von der Silbentrennung unterscheiden — braucht die Wortliste oder den
  Tag-Leser (R1). **Erhebungs-KORREKTUR GP5 1.9.2026: kein Vollinventar —
  unabhängige Korpus-Erhebung zählt ≥48 §-Stellen (UNTERGRENZE; nur
  Anschlusswörter und/oder/bzw./sowie/rechtlich* — geklebte Formen, die
  zufällig ein gültiges Wort ergeben, sind unzählbar).** Die R1-Abhak-Liste
  ist darum MASCHINELL zu erzeugen (Erhebungs-Skript), nie von Hand.
  GP4-Teilliste (12, davon 1 Fehl-Zuordnung: «×2 in § 260» falsch — § 260
  einmal, zweite Stelle ist **§ 268**; § 223 fehlte): 131.1 § 141 · 211.1
  § 87 · 631.1 §§ 27, 31, 72a, 88, 162a, 235, 237 · 700.1 §§ 50, 260, 268.
  GP5-Zusatzfunde (Auszug): 700.1 §§ 64, 111, 113, 138, 195, 217, 223
  («öffentlichrechtliche»), 239, 276, 328, 334 · 211.1 §§ 16, 80 · 101
  Art. 144 · 131.1 § 127 · 171.1 § 132 · 175.2 §§ 21a, 72 · 177.10 §§ 35,
  43 · 211.15 § 27 · 230 §§ 180, 194 · 232.3 § 78 · 242 § 33 · 243 § 8 ·
  331 § 26 · 550.1 §§ 32b, 54, 60 · 631.1 §§ 109c, 162 · 851.1 §§ 47c, 48a.
  §8-Auflage (GP5): sichtbar falsch zitierter Normtext («Bauund
  Niveaulinien») — R1 wird darum VORGEZOGEN und läuft parallel zur
  Tranche A, nicht erst in Phase II (Orchestrator-Entscheid 1.9.2026).
  R1-Zettel (GP5-Nachverifikation): + 101 Art. 88 («Quartieroder») ·
  131.1 § 64 («rechtund») als Prüfpunkte des Erhebungs-Skripts; und die
  Exponent-Wache ruht allein auf der Einheiten-Regex (Klebe-Bedingung
  <0.8 pt trennt nichts: 638/638 kleben; Zweitlesung nutzt DIESELBE
  Regex = Common-Mode) — R1/Tag-Leser entkoppelt die Kriterien.
- GP4-Restrisiko-Notiz (7c): der Zeichen-Deckungsgrad ist eine **90 %-
  UNTERGRENZE** je §-Region — ein Textverlust unter einem Zehntel der
  Bestimmung bleibt 7c unsichtbar und wird nur gefangen, wenn er eine Zahl
  (7b), ein lit. (2), einen Absatz-Marker (5) oder seit Runde 4 einen
  Einheiten-Exponenten (9) trägt. Bewusst so belassen (Schwelle am geheilten
  Bestand: min 95.9 %); die Lücke schliesst erst der zeichen-vollständige
  Tag-Leser-Kreuzvergleich (R1, Phase II).
- Die sieben Zahlenfolge-Ausnahmen könnten entfallen, sobald die Zweitlesung die
  verschachtelten Ziffern-Aufzählungen nicht mehr für Überschriften hält.

**Stufe 3 — Ausbau in Tranchen** (Richtung 944, Katalog-Generator über den
JSON-Endpunkt): erst nach gelandeter Stufe 2 und sauberer Stichproben-Abnahme;
G2-Slot-Regel beachten (kein faktischer Vollkorpuslauf als Tranchen-Schlupfloch —
Freigabe je Tranche beim Orchestrator/David).

---

## §5 · ZH-Programm: 13 Runden + Tranchen + Speicher-Umbau (Aufträge David 31.8.2026, lebendige Spec)

**Anlass:** Serie von David-Aufträgen 31.8.2026 nachmittags (Chat, je «mache
danach/am schluss auch noch runde für …») unter dem stehenden **Dauer-Baumandat**
(«bau bis ich stop sage. verbessere kontinuierlich») und dem Tranche-Muster
(«mehr zh gesetze live … und dann diese intensiv prüfen und befunde verbessern»).
Dazu drei Querschnitt-Entscheide Davids gleichentags: **Suchindex-Speicherlimite
aufgehoben** («speicherlimite aufgehoben» — betrifft NUR das Suchindex-Budget,
NICHT den 780-KB-Deckel des Rechtsprechungs-Registers) · **K3-Scharfschaltung
freigegeben** «sobald geprüft und verifiziert» · **Kanton-Generik** («wenn du
etwas für andere kantone brauchen kannst achte darauf, dass es bei allen
implementiert wird») · Token-Sparsamkeit für dieses Programm ausdrücklich
nachrangig («token spahren egal»). Stadt-Zürich-Volltexte bleiben AUS
(robots.txt-Hürde, Dossier `stadt-zuerich-amtliche-sammlung-2026-08-31.md`).

### 5.1 Querschnitt-Regeln (gelten für jede Runde)

- **Reihenfolge-Entscheid David 1.9.2026 (überschreibt K-G5 ZH→BE→VD→AG→SG→LU→GE):** Zielbild
  Deutschschweiz. ZH und BS zuerst perfektionieren, dann BE → AG → SG → LU; VD/GE/TI und fr/it-
  Fassungen ausdrücklich zuletzt. Kanton-Generik bleibt Pflicht (jede Runde wirkt korpusweit).

1. **Kanton-generisch bauen — «gilt für alle» als Default (verschärft,
   David 31.8.2026 zweite Weisung):** Was für alle Kantone sinnvoll ist,
   wird so gebaut, dass es für alle Kantone GILT — nicht nur dokumentiert.
   Konkret, je Runde: (a) Datenmodell/Schema-Felder existieren für alle 26;
   (b) TORE laufen korpusweit über alle vorhandenen Kanton-Snapshots (nicht
   nur ZH — ein Gliederungs-Leck-Wächter z. B. prüft AR/BS/… sofort mit);
   (c) alles OFFLINE Befüllbare (aus bereits liegenden Snapshots, Sidecars,
   DB, LexWork-Strukturdaten) wird sofort für ALLE Kantone befüllt — offline
   heisst kein Massen-Fetch, also kein G2-Fall; (d) nur was einen NEUEN
   Massen-ABRUF braucht, bleibt gegatete Tranche (G2) mit dokumentiertem
   Befüll-Weg je Quell-Familie (LexWork-XHTML · SIL · TI · BS-API ·
   zhlex-PDF). ZH ist Pilot für die PDF-Familie, nie die Grenze des Baus.
2. **Prüf-Schleife je Runde und je Tranche:** Bau (Opus/high, frischer Kontext)
   → adversariale Gegenprüfung (frischer Kontext, unabhängige Dritt-Lesung,
   Blind-Werte vor Vergleich) → Fix-Runde → erneute Gegenprüfung, bis
   `bestanden`; Tore, die die Runde einführt, zeigen jede Prüfung einmal ROT.
3. **Jede Runde erweitert das Dauer-Tor-Netz** (`check:zh-vollstaendigkeit`
   ist das Muster): die Fehlerklasse der Runde wird maschinell bewacht, nicht
   nur einmalig behoben.
4. **Fachliche Abnahme bleibt bei David** (§7/§8): Status-Hebungen nie
   automatisch; Runden liefern «entwurf»-Qualität mit Beweispaket.
5. **Landungen seriell** (§12); ZH-Korpus-Strang und Datenhaltungs-Strang
   landen abwechselnd, nie gleichzeitig auf dieselben Artefakte.

### 5.2 Phasenplan (Abhängigkeiten, nicht blosse Bestell-Reihenfolge)

**Phase 0 — läuft:** Kern-Tranche (24 Erlasse) durch Gegenprüfungs-Schleife
bringen und landen · Speicher-Umbau K0–K5 gegenprüfen und landen (Flag AUS) ·
danach K3-Scharfschaltung (Bedingungen: Gegenprüfung bestanden + gelandet,
Turso-Sync mit Recall-Feldern gefahren, Produktions-Probe grün — Live-Probe
31.8. positiv; + Budget-Zeile deklariert senken + UI-Abdeckungszeile, sobald
Design-TABU-Fläche frei).

**Phase I — Masse mit Schleife:** Tranche A (amtlich **170**, nicht 155 — Zählkorrektur PR #614, 1.9.2026: Ordner 3+10+4 komplett;
Vorprüfungen GO 31.8., Grössen 10,3 MB, Fallen im Skill verankert) →
intensive Prüfrunde (mehrere unabhängige Prüf-Agenten + Messbank + Tore) →
Befunde fixen → Tranche B (236 + die 5 Ordner-1-Auffüller) → Schleife →
Tranche C (Rest auf 944) → Schleife. Tranchen B/C erst nach gelandetem K3
(Suchindex-Entlastung) ODER mit deklarierter Budget-Anhebung (Entscheid
David «Speicherlimite aufgehoben» deckt das).

**Phase II — Extraktions-Tiefe (Tag-Leser-Familie):** Fundament =
Tag-Leser-Modul (Vorbau läuft, `scratchpad/tagleser/`, E1-Beweis: Rollen
Marginalie/Haupttext/Fussnote deterministisch, 119/119 Seiten zeichen-
vollständig). Darauf, je EIGENE Runde mit eigener Gegenprüfung:
- **R1 Gliederung** *(vorgezogen, Auftrag David 2.9.2026 wörtlich: «achte bei zh auch darauf, dass wir
  marginale extrahieren und in der gliederung darstellen» — Bau läuft seit 2.9., Branch
  `feat/zh-r1-marginalien`)*: Randtitel/Marginalien als Sachtitel (483 verworfen),
  Kapitel-/Abschnitts-Struktur als eigene Blöcke, die 129 Überschriften-
  Fehlzuordnungen, römische Ebenen. Kreuzvergleich Tag-Weg ↔ Positions-Weg
  als neues Dauer-Tor.
- **R2 Tabellen:** `mehrspaltig`-Pfad generalisieren (heute auf 211.11/215.3
  §3/§4 verdrahtet), Fliesstext-Tarife 323.1/212.812 strukturieren,
  243-Anhang-Spalten-Inkonsistenz; Werte-Wächter beidseitig (Zahlen-
  Multimenge je §-Region — offener Rest der Fix-Runde 2).
- **R3 Fussnoten:** Apparat als eigene Schicht (Marker · Text · Anker
  getrennt; Rolle `Fussnote` aus dem Tag-Baum); trägt OS-Fundstellen und
  «Aufgehoben durch …»-Belege.
- **R4 Anhänge:** Anhänge + Übergangs-/Schlussbestimmungen als eigene
  Einträge (heute §8-Lücken-Index `kanton-luecken.json`, 15 Erlasse;
  Vorbild anhang_*-Tokens der NotGebV 243); löst die drei nicht lückenlos
  ableitbaren Sammel-Bereiche auf; danach VGG 131.11 nachziehen.

**Phase III — Semantik-Schichten (kanton-generisch):**
- **R5 Verweise/Querverweise:** interne §-Verweise + externe (SR/LS) als
  Anker; Vorbild `bezuege-bauen.ts`; VOR Start Kollisionsprüfung
  Verweis-Baufeld (31.8. durch Parallel-Session belegt).
- **R6 Legaldefinitionen:** NUR regelbasierte Muster («gilt als», «im Sinne
  dieses Gesetzes», Begriffs-Marginalien); Status entwurf bis Abnahme.
- **R8 Abkürzungen:** amtliche Kürzel als Such-Aliase (Klammerzusatz +
  Kurztitel-Feld; nie erfinden — B-9-Lektion; Kollisionen FKG/EKZ/SDK;
  Kürzel nie als Schlüssel); Vorbild `abk-aliase-generieren.ts`.
- **R9 Sachgebiete/Systematik:** Feingliederung unter den 14 Ordnern
  (Jahresregister-PDF als Kandidat-Quelle, Dossier §8), Sachgebiet als
  deklariertes Registerfeld statt Titel-Raten (löst den ROADMAP-Punkt
  «Kern-Kategorie als Registerfeld»), «Bereich N»-Fallback ersetzen (K-13).

**Phase IV — Zeit-Schichten:**
- **R7 Inkrafttreten/Übergangsrecht:** je Erlass maschinenlesbar «in Kraft
  seit», Fassungsregister, geltendes Übergangsrecht (aus R4-Erfassung +
  R3-Apparat); ZH-Pendant zu gen:historie/gen:inkrafttreten (heute
  Bund-only).
- **R12 Änderungshistorie/Versionen:** Volltext-Historie + Wort-Diff
  zwischen Fassungen — zhlex liefert ALLE Vorfassungen als PDF (ø 4,2,
  max 48; Stadt-AS analog); natürlicher POC für W2·5g-ZEIT
  (Blocker zeit-historik-poc), was der Bund mangels Alt-Volltext nicht kann.
- **R12a Entstehung am Paragraph — Basel-Stadt (vor Zürich)** (`R12a-ENTSTEHUNG-BS`)
  *(Vormessung lex-recherche 12.9.2026, Grundlage `bibliothek/materialien/
  2026-09-12-k16-bs-vormessung.md` §3/§7/§9 — Nicht-Bau-Entscheid.)*
  **Noch nicht baubar:** BS hat keine Fassungskette je § — 0 kantonale
  Historie-Einträge in `public/normtext/historie/`; 2908 Fussnoten in
  793 BS-Struktur-Sidecars, davon nur 13 mit «GRB vom» und 8 mit
  Ratschlagsnummer. Der amtliche Schlüssel Erlass↔Geschäft aus `K-16`
  deckt 5 von 859 Erlassen (8 von 122 Kanten); der Rest trägt
  `quelle: maschinell`. **Neuer Fund (12.9.2026):** die LexWork-API der
  BS-Gesetzessammlung (`https://www.gesetzessammlung.bs.ch/api/
  texts_of_law/<SG>`, undokumentiert, kein Lizenzvermerk am Endpunkt)
  liefert `old_versions[]` und je Fassung Volltext-XHTML unter
  `.../versions/<id>` — geprüft am Beispiel 132.100 (10 Fassungen).
  Ziel, sobald freigegeben: BS-Fassungskette je § aus `old_versions`/
  `versions/<id>`, Verknüpfung mit den K-16-Kanten, Synopse-BS analog E5
  mit Profil-Normalisierung, Karte für BS-Keys. **Grenzen:** Lizenz des
  `versions`-Endpunkts vorab klären (kein CC-BY-Vermerk); Endpunkt
  undokumentiert ⇒ Stabilitäts-Sonde vor Bau; Vorstufen R3/R7/R12 für BS
  neu (heute nur für ZH definiert). **Zwei Handgriffe ohne Bau (David):**
  (1) Lizenz des LexWork-`versions`-Endpunkts klären, (2) amtlichen
  Schlüssel Erlass↔Geschäft bei BS anfragen. Deckel-Reserve nach `#802`
  ausreichend.
  **Nachtrag 22.9.2026 (Recherche R2) — die Anfrage ist nur noch OPTIONAL.**
  Handgriff 1 weitgehend geklärt ohne Anfrage: `data.bs.ch` 100354
  «Gesetzessammlung: Gesetzestexte» (Zentraler Rechtsdienst) steht unter
  **CC BY 4.0**, führt 1370 SG-Nummern und 8061 Fassungs-Volltexte und
  verlinkt **dieselben** Fassungs-IDs wie die interne API; opendata.swiss
  führt die Sammlung unter `terms_open`; `robots.txt` sperrt
  `/api/texts_of_law/` und `versions` nicht; URG Art. 5 Abs. 1 lit. a und
  Abs. 2 erfassen Erlasse UND amtliche Sammlungen ohne Beschränkung auf den
  Bund. **Rest, der eine Anfrage rechtfertigt:** Fussnoten und
  Änderungstabellen fehlen im CC-BY-Text (2/2 Stichproben) — genau das
  braucht R12a — und der Endpunkt bleibt undokumentiert
  (Stabilität/Abrufrate). Handgriff 2 **teilweise vorhanden:** kein
  Datenfeld (100311/100355 ohne SG-Bezug, `materials_enabled:false`), aber
  die amtlichen Änderungsdokumente nennen im Ingress die Ratschlagsnummer
  (3/3), identisch mit `signatur_dok` in 100313 (4/4); Schlüssel ist die
  NUMMER, nie das Datum. Nur über PDF-Fliesstext ⇒ Risikopfad. Belegkette:
  `bibliothek/recherche/legal-design-und-korrektheits-recherche-2026-09-21.md`
  Ziff. 19, Nachtrag §10 in
  `bibliothek/materialien/2026-09-12-k16-bs-vormessung.md`. Der Blocker
  `david-bs-lizenz-schluessel` **bleibt stehen** — David hat ihn nicht
  aufgehoben.
- **R12b Entstehung am Paragraph — ZH-Pendant zu `W2·6c-ENTSTEHUNG-*`**
  *(David 6.9.2026: «Botschaften und anderes analog von Gesetzen Zürich» —
  ja, aber nach Bund und BS; Grundlage `bibliothek/materialien/
  entstehung-2026-09-06/kantone-zh-bs.md` §1, Spec Bund: FAHRPLAN-
  MATERIALIEN-VERZAHNUNG §11).* **Braucht R3 + R7 + R12 als Vorstufen**
  (heute 0 Fussnoten in den ZH-Struktur-Sidecars ⇒ keine Fassungskette je §).
  Quellen ZH (Stand 6.9.2026): Kantonsrats-Geschäftsdatenbank
  `parlzhcdws.cmicloud.ch` (CMI-XML-Feed, 18 946 Geschäfte, Weisungen/Anträge
  RR als Geschäftsart mit PDF, Index ABLAUFSCHRITTE = Verfahrens-Zeitstrahl;
  undokumentiert, **Lizenz nicht deklariert**) · zhlex-Vorfassungen als PDF
  (ø 4,2 / max 48 je Erlass, **ohne Zeitgrenze** — Synopse könnte anders als
  beim Bund vor 2021 zurückreichen, Weg über R12) · Abstimmungsarchiv ab 1831
  (OGD) · Staatsarchiv TEI (Kantonsratsprotokolle, RRB 1803–1998, Zenodo
  13347459, Fremdquellen-Sichtung 2.9.2026) · RRB aktuell, Vernehmlassungen
  ZH, ZH-Lex-API: **Negativbefund** (nur HTML/PDF). **Kein amtlicher Schlüssel
  Erlass/§ ↔ Vorlage:** die OS-Fundstelle der Fussnote nennt keine Vorlagen-
  Nummer ⇒ Zuordnung zur Weisung nur über Datum/Titel = Heuristik, Kante
  `quelle: maschinell` (§8), nie stillschweigend amtlich. **Zwei Handgriffe
  ohne Bau (David/OGD-Fachstelle ZH):** (1) Lizenz des Kantonsrats-Feeds
  klären, (2) nach einem amtlichen Schlüssel Erlass ↔ Vorlage fragen — mit
  Schlüssel würde die Kante amtlich. Etappen dann wie Bund E1/E2/E3 (Zeitstrahl
  aus ABLAUFSCHRITTE, Fassungskette aus R3, Karte im ZH-Leser), ohne E4-Pendant
  (keine Namensabstimmungs-Daten gefunden). Reihenfolge: **Bund (#792–#801)
  → BS (R12a) → ZH (R12b).**

**Phase V — Ernte:**
- **R13 Rechtsprechungs-Brücke:** (a) LS-Zitate in Entscheiden → kantonale
  normKeys (löst K-14 ein; Prämisse «normKeys Bund-only» vorher nachmessen;
  braucht R5+R8); (b) ZH-Urteils-Korpus = EIGENE gegatete Einheit
  (Rechtsprechungs-Register-Deckel 780 KB NICHT aufgehoben; VPS-Gate;
  Quell-Menü ZH-Gerichte empirisch erheben).
- **R10 Mehrsprachigkeit:** ZH ist einsprachig (944/944 deutsch) —
  Runde wirkt korpusweit: sprache-Ehrlichkeit (37 fr/it als 'de'
  deklariert — bestehender ROADMAP-Punkt), Parallel-Fassungs-Verknüpfung
  BE/FR/VS (Muster FR-130.11-de/-fr), UI-Sprachausweis. KEINE eigenen/
  KI-Übersetzungen (§2/§7).
- **R11 Suchoptimierung (Abschluss):** erntet alle Schichten als Suchfelder;
  Umlaut-Faltung (Befund «Verjaehrung»), Mehrwort-ANY/Präfix am Edge,
  Alias-Treffer («GOG»→211.1), Ranking-Entdopplung; jede Änderung gegen
  die eingefrorene K0-Nullprobe + eval:suche bewiesen.

### 5.4 Bau-Optimierungen (Selbstbefund aus der Session 31.8.2026, Auftrag David «optimierter bauen»)

Gemessene Reibung: 3 Gegenprüfungs-Zyklen bis Konvergenz; jede Prüf-Runde
lud dieselben PDFs neu; ein GP-Fehlalarm (lit./items) kostete eine volle
Runde. Daraus, priorisiert:

*(Stand 31.8.2026 nach Fix-Runde 3: **O1 gebaut** — `daten/pdf-cache-zh/` +
`npm run zh:cache`, Regeneration und Tor laufen offline; **O2 gefahren** — das
volle Wächter-Set plus elf Mutationsproben liefen VOR der Rückgabe, jede Probe
in einer Kopien-Sandbox; **O3 angewandt** — der Schema-Steckbrief des Dispatches
hat in dieser Runde 0 Fehlalarme der Klasse «im falschen Feld gezählt» erzeugt.
**O4 offen** (`gate:zh`-Bündel — Teil-Ersatz: die zwei ZH-Schritte hängen jetzt
IN `gate.sh`, ein Agent braucht dafür kein eigenes Kommando mehr). O5/O6
unverändert.)*

- **O1 · Roh-PDF-Cache (grösster Hebel):** Skill-Prinzip «store raw as
  golden» für ZH einlösen — Runner legt jedes amtliche PDF unter
  `daten/pdf-cache-zh/` (gitignored) ab, Schlüssel URL-Hash + ETag;
  Regenerationen und Prüfer laufen OFFLINE aus dem Cache (Frische holt nur
  der Drift-Check). Wirkung: Fix-Runden ohne 3×n Netz-Requests, Amts-Host
  geschont, `check:zh-vollstaendigkeit` CI-fähig offline. **Bauen als
  ERSTES Stück der Tranche A** (der 155er-Lauf befüllt ihn gleich).
- **O2 · Builder-Selbst-Gegenprobe (Pflicht im Dispatch):** jeder Bau-Agent
  fährt VOR seiner Rückgabe das volle Wächter-Set + EINE Mini-Mutations-
  probe je neuer Prüfung (Kopie-Sandbox) — Ziel: Gegenprüfung konvergiert
  in 1 Runde statt 3.
- **O3 · Prüfer-Schema-Steckbrief (fester Dispatch-Baustein):** Blockschema
  (text/items/mehrspaltig.zeilen/absatz-Suffixe/anhang_*-Tokens) + die
  bekannten Fehlalarm-Fallen als Standard-Absatz in jedem Prüf-Auftrag —
  Fehlalarm-Klasse «im falschen Feld gezählt» stirbt.
- **O4 · `gate:zh`-Bündel:** npm-Alias für die korpusrelevanten Tore
  (zh-vollstaendigkeit · normtext · golden-normtext · vollstaendigkeit ·
  struktur-konsistenz · stand-zukunft · tabellen · paritaet · datenhaltung),
  damit Agenten nicht n Einzelkommandos + Voll-gate fahren.
- **O5 · Runden-Pipelining:** während die Gegenprüfung von Runde N läuft,
  baut Runde N+1 bereits im eigenen Worktree (Quittungs-Hash bindet je
  Branch-Kopf — deshalb NIE in einen Branch bauen, dessen GP läuft);
  Landungen bleiben seriell.
- **O6 · Dispatch-Bausteine hier im §:** Standard-Block für jeden Agenten
  dieses Programms = §14.7 wörtlich + Skill-Ladeliste (korpus-werkstatt +
  scraping-swiss-official-sources; Prüfer: gegenpruefung) + TABU-Flächen +
  Netz-Disziplin (~1 req/s, UA mit Kontakt) + O2/O3-Pflichten + «KEIN Push/
  PR/Quittung ausser beauftragt». Orchestrator kopiert, statt neu zu texten.
- **O7 · `zh-quellen.ts` schreiben statt drucken (Wurzel-Fix, offen seit
  1.9.2026):** Das Auflöse-Werkzeug DRUCKT heute Einträge, die jemand in
  `zh-quellen.ts` einsetzt. Mit Tranche A ist die Datei auf 1206 Zeilen
  gewachsen und musste in die §6.6-Baseline aufgenommen werden
  (`scripts/schlankheit-bestand.json`) — ein Workaround, kein Zustand:
  `check-schlankheit.ts` schliesst `*.generated.ts` ausdrücklich aus, «weil
  ihre Zeilenzahl eine Funktion der Quelldaten ist, kein Wartbarkeits-Signal»,
  und genau das trifft auf diese Liste zu. FIX: `--schreiben`-Modus, der die
  beiden Arrays nach `zh-quellen.generated.ts` schreibt; `zh-quellen.ts`
  behält Interface, Doku und Re-Export und fällt unter 800 Zeilen; der
  Baseline-Eintrag wird beim selben Schritt wieder GELÖSCHT, nicht bloss
  stehen gelassen. Vorsicht: `ZH_ZURUECKGESTELLT` trägt GEMESSENE Befunde
  (Tor-Ausgaben), die der Endpunkt nicht liefert — der Schreib-Modus muss sie
  erhalten, nicht überschreiben (§2b: Belege altern nicht).
  Nebenbefund zum Mitnehmen: `schlankheit:update` schreibt die GANZE Baseline
  neu und hebt dabei die Deckel fremder, ungeänderter Dateien mit (gemessen
  1.9.2026: normtext-snapshot.ts 1589 → 1682, adapter-htm.ts 957 → 1022 …).
  Wer einen Eintrag aufnimmt, nimmt NUR seinen auf — sonst wächst die Baseline
  still mit, genau der Fehlmodus, den das Tor benennt.

*(Bereits eingelöst diese Session: geteilte Scratch-Werkzeuge — Messbank,
E1-Skripte, PDF-Ablagen — werden agentenübergreifend wiederverwendet;
Mutationsproben-Regel steht im Skill korpus-werkstatt.)*

- **O8 · Regenerations-Kaskade Kanton** *(Befund 2.9.2026, PR #613: `check:zaehler` rot in CI, weil die
  Regeneration nach dem Register-Nachzug `gen:zaehler` nicht mitfuhr)*: ein Kommando, das nach jedem
  Register-Eingriff Manifest, Startseiten-Zähler, Paritäts-DB und Verweis-Basislinie in fester Reihenfolge
  nachzieht (Vorbild `materialien:kaskade`, Befund (g) QS-MONITOR-ROT). Bis dahin: Landungs-Checkliste
  `gen:zaehler` + `check:verweis-inventar -- --schreiben` nach jedem Merge von main in einen Korpus-Branch.

### 5.3 Offene David-Punkte (nicht blockierend gesammelt)

- Fachliche Abnahme: Re-Bless 211.11/215.3/243 + Stichproben-Abnahme
  Kern-Tranche (Skill `abnahme`).
- R13(b) ZH-Urteils-Korpus: Register-Deckel/Projektion + VPS.
- Stadt-ZH-Volltexte: nur nach Stadtkanzlei-Anfrage.
- «Handänderungs-/Grundbuchabgaben = Kernklasse?» (bestehender Punkt).

---

## Archivierte Abschnitte *(Plan-Neuschnitt 29.8.2026)*

9 Abschnitt(e) dieser Datei sind wörtlich nach
[`archiv/fahrplaene/FAHRPLAN-KANTONE.md`](../archiv/fahrplaene/FAHRPLAN-KANTONE.md) ausgelagert — sie tragen keine offene
ROADMAP-Bindung mehr. Titel:

- §1-A · SOFORT BAUBARE EINHEITEN (slot-frei; Ausführungsreihenfolge = Tabellen-Reihenfolge)
- §1-B · GEGATETE EINHEITEN (26×-Slot durch E3 belegt — ausgewiesen, NICHT starten)
- §Z · Verworfenes (explizit, mit Grund)
- §K · Korrekturen aus den Kritik-Linsen (in die Einheiten eingearbeitet)
- §B · Beleg-Qualität (Kurzreferenz)
- §S · Sequenz-Übersicht (Kurzform)
- §1-C · §14-Intake 20.7.2026 (David) — K-15 und K-16
- §1-D · §14-Intake 21.7.2026 (David) — K-17
- §3-N · ROADMAP-Spec `W2·13-KANTONE-DRIFT` — Nachzug (wörtlich verschoben 4.8.2026, ROADMAP-Diät Welle 3)
