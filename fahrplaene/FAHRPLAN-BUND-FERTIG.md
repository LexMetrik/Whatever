# FAHRPLAN — Phase 1: Bund fertig machen (Entscheide David 14.9.2026)
<!-- @lagebild name: Bund fertig machen · zweck: Sollbild «Was ist ein Gesetz bei LexMetrik», am Bund zuerst — Datenstruktur schliessen, Leser schärfen, dann alle Bundeserlasse. -->

> **ROADMAP-Schritt:** `W2·27-BUND-FERTIG` (`feld: korpus`) — Dach der Phase 1.
> **Messgrundlage:** Ist-Messung des Bundes-Normtext-Korpus vom **14.9.2026** (N = 228
> Snapshot-Dateien, 25 463 Artikel; node-Aggregation über `public/normtext/bund/*.json` +
> `public/normtext/struktur/bund/*.json`, read-only, ohne Netzzugriff). Alle Zahlen unten sind
> mit «Messung 14.9.2026» gekennzeichnet.
> **Lebendige Spec.** Diese Datei wird fortgeschrieben, nicht rückwirkend korrigiert: datierte
> Mess- und Reproduktionsangaben werden **ergänzt**, nie an einen neuen Ist-Stand nachgeführt
> (Dispatch-§0 Ziff. 2b). Erledigtes wird in ROADMAP.md abgehakt und in ROADMAP-CHRONIK.md
> nachgetragen.

---

## §0 · Zweck, Entscheide, drei Phasen

**Zweck.** Bevor die Breite wächst (Kantone, Rechtsprechung, Server), muss **einmal
niedergeschrieben sein, was ein Gesetz bei LexMetrik überhaupt ist** — welche Bausteine ein Erlass
trägt, wie sie im Datenmodell heissen und wie der Leser sie zeigt. Dieses Sollbild wird **am Bund**
festgelegt und dort eingelöst; Kantone folgen ihm in Phase 2.

**Entscheide David 14.9.2026 (Chat, wörtlich):**

1. «ok dann lass uns erst das fundament fertig bauen und vps erst danach»
2. «das wirkt alles sehr kompliziert. können wir das klarer aufbauen? ich denke der erste schritt
   sollte sein den gesetzesleser und die struktur der daten die wir darstellen zu optimieren»
3. «grundsätzlich würde ich zuerst mit dem bund beginnen»
4. «ja das passt grundsätzlich aber lass uns zuerst das für den bund machen»

Das **Zielbild-Dekret 1.9.2026** (bester Gesetzesleser für Schweizer Juristen, nur amtliche
Quellen) bleibt unverändert gültig; ersetzt wird allein sein **Vier-Block-Aufbau** durch drei
Phasen:

| Phase | Inhalt | Gebunden an |
|---|---|---|
| **1 · Bund fertig machen** | (1) Sollbild am Bund · (2) Datenstruktur Bund schliessen · (3) Leser am Bund · (4) alle Bundeserlasse (238 → ~5 100 SR) | dieser Fahrplan, `W2·27-BUND-FERTIG` |
| **2 · Kantone** | ZH und BS auf das Bund-Sollbild; Drift, Quellen-Hygiene, PDF-Werkstatt; dann BE/AG/SG/LU. VD/GE/TI und fr/it zuletzt. **Prüfschritt am Anfang:** Zulieferer-Entscheid `W2·21-ZULIEFERER` | FAHRPLAN-KANTONE.md |
| **3 · Mehr als Fedlex** | Zeitmaschine · Watchlist · Rechtsprechungs-Nachweis · Server (VPS) | FAHRPLAN-GESETZESDARSTELLUNG-V2.md, FAHRPLAN-RECHTSPRECHUNG.md, FAHRPLAN-DATENHALTUNG.md |

**Nebenher, ohne Phasenplatz:** Fehlerbuch, Betrieb & Prüfstrasse, Fremdagenten. Geparktes
(Rechner, Vorlagen, Design-Wärme, FINMA) bleibt geparkt.

**VPS-Bestellung:** erst **nach Phase 2** (Entscheid 14.9.2026); der Termin «Sonntag 13.9.2026»
ist hinfällig.

**Bestehender kantonaler Online-Bestand** bleibt bis Phase 2 unverändert — nur echte Fehler werden
übers Fehlerbuch behoben.

**Fertig-Kriterium Phase 1:** Ein Schweizer Jurist liest **jedes** Bundesgesetz bei uns
**vollständig** (nichts fehlt, was amtlich dazugehört), **strukturgleich** (Gliederung, Randtitel,
Fussnoten, Schlusstitel, Anhänge, Tabellen an ihrem Platz) und **schneller als auf Fedlex**.

---

## §1 · Sollbild «Was ist ein Gesetz bei LexMetrik»

Soll = was ein **lesender Jurist** braucht. Ist = Messung 14.9.2026 am Bund. Status: erfüllt /
teilweise / fehlt.

| Baustein | Soll (ein Satz) | Ist Bund (Messung 14.9.2026) | Leser-Darstellung heute | Zuständig | Status |
|---|---|---|---|---|---|
| **Gliederung** (Titel/Kapitel/Abschnitt) | Jeder Artikel weiss, unter welchen amtlichen Überschriften er steht, bis zur amtlichen Tiefe. | 225/228 Dateien, 25 034/25 462 Artikel, 54 583 Knoten, Tiefe 1–5; `eId` an 100 % der Knoten. Ohne Gliederung: NHG, VMWG, ZENTV; 428 Artikel ohne Knoten. | `SektionKopf.tsx`, `gliederungsModell.ts`, `GesetzeGliederung.tsx` | `W2·5m-LESER-V3` S2 (Reste) · `W2·27` (3 Dateien) | teilweise |
| **Artikel/Absätze/Aufzählungen mit Tiefe** | Absätze und Buchstaben-/Ziffern-Listen stehen in der amtlichen Schachtelung, nicht in einer geratenen. | 69 693 Blöcke, 41 193 Items; `tiefe` an **4 407 (10,7 %)** Items, nur in 162/228 Dateien; keine dritte Schachtelungsebene modelliert. | `ArtikelBody.tsx` rät die Stufe aus dem Markentyp, wo `tiefe` fehlt | `W2·13-KANTONE-DATEN` K-8 (Strukturerhalt, wirkt korpusweit) | teilweise |
| **Randtitel / Marginalien** | Jeder Artikel trägt seinen amtlichen Randtitel als Sachtitel — im Lesetext, in der Gliederung und im Sprungziel. | `struktur.marginalie` in 209/228 Dateien, 22 223/25 462 Artikel (**87,3 %**); Snapshot-Feld `titel` **0/25 463**. 19 Dateien ohne Marginalien (fast alle Staatsverträge). | `ArtikelLeser.kopfteile.tsx`, `darstellung.ts` (`randtitelKnoten`, `artikelSachtitel`) | `W2·27` (Doppelmodell, §4) · `QS-KORPUS` (Staatsverträge) | teilweise |
| **Fussnoten** | Der Marker steht **am Wort**, auf das sich die Fussnote bezieht, nicht am Absatzende. | 31 178 Artikel-Fussnoten (223/228) + 641 Kopf-Fussnoten; **wortgenau (`pos`) 16 912 = 54,2 %** ⇒ **14 266 Marker (45,8 %)** stehen am Absatz-/Item-Ende. | `ArtikelLeser.fussnoten.ts`, `FnRef` in `ArtikelBody.tsx` | `W2·5l-NORMTEXT-B2` §M14 | teilweise |
| **Schlusstitel / Übergangsbest. / Anhänge** | Schluss- und Übergangsbestimmungen und Anhänge sind eigene, adressierbare Teile des Erlasses. | `annex_*` 381 Einträge/136 Dateien · `disp_*` **276/nur 5 Dateien** (ZGB, OR, PatG, SchKG, SVG, VZG) · `scope_*` 27/26 · `decl_u*` 17/12. LugÜ-Protokolle (`lvl_*`, 9 Art.) **0 gemessen** ⇒ weiterhin fehlend. | `ArtikelBody.tsx` (Block-`titel`, 2 055 Blöcke), `ArtikelTabellen.tsx` | `W2·5l-NORMTEXT-B2` §M13 | teilweise |
| **Tabellen** | Eine amtliche Tabelle wird als Tabelle gelesen; mehrdeutige Fälle bleiben Text statt falsch geraten (§1). | 545 mehrspaltige Blöcke in 94 Dateien; `tabelle` 0/228 (Kanton-Feld), `verweis` 0/228; `bild` 268. | `ArtikelTabellen.tsx`, `BildElemente.tsx` | `W2·5l-NORMTEXT-B2` (Unterzeile «Tabellen lesbar machen») | teilweise |
| **Verweise** (Binnen / Aussen / «zitiert von») | Ein Verweis springt richtig, zeigt an, ob er den Erlass verlässt, und das Ziel weiss, wer es zitiert. | Korpusweit 36 161 Stellen (19 728 self · 11 360 fremd · 5 073 Text; Bund-Teil nicht separat ausgewiesen). **Kein persistenter Zitatgraph** — jeder Verweis wird beim Rendern neu erkannt; **16 tote Artikel-Anker** gemessen. | `NormText.tsx`, `NormChip.tsx`, `inhalt-sprung.tsx` | `W2·20-VERWEIS-SCHAERFE` (V-1…V-5) · `W2·22-VERWEIS-FEDLEX` (Z4, Z6a, Z6c) | teilweise |
| **Stand / Fassung / Zukunftsfassungen** | Jede Textstelle sagt, welche Fassung sie ist, woher sie stammt und ob eine neue Fassung bevorsteht. | Snapshot: `stand`/`quelleUrl`/`abgerufen`/`fassungsToken`/`sha` **100 %**, `quelleUrl` mit `#`-Anker 100 %. **Struktur-Sidecar nur 12/228 mit eigenem `stand`/`fassungsToken`.** Zukunft: 62/224 `naechsteFassungAb`, 93 künftige Inkrafttreten in 64 Dateien. | `fassungsEtikett.ts`, `ErlassKopfBlock.tsx`, `Erfassungsgrad.tsx` | Snapshot: erfüllt · Sidecar-Riegel `W2·27` · Zukunfts-UI `W2·5l` M16 / `W2·5g-ZEIT` (§4) | teilweise |
| **Aufgehoben / Historie** | «Aufgehoben» ist ein **deklariertes Feld**, kein Textbefund; jede Änderung ist als Ereignis nachlesbar. | `aufgehoben` **0/25 463** im Bund ⇒ Text-Heuristik `artikelGanzAufgehoben` greift bei **1 389 Artikeln in 177 Dateien**. Erlassebene: 1 (BMV). Historie: 209 Dateien, 13 093 Artikel, 26 686 Ereignisse; **19 Snapshots ohne Historie-Shard**. | `ArtikelHistorie.tsx`, `fassungsEtikett.ts`, `LeserAenderungsWahl.tsx` | `W2·27` (strukturelles Feld) · `QS-KORPUS` (Staatsverträge) | fehlt (strukturell) |
| **Sprachen de/fr/it** | Der mehrsprachige Auslegungsvergleich (Art. 14 PublG) ist als Werkzeug verfügbar. | **239/239 Bund-Erlasse `de`**, 0 fr, 0 it; keine fr/it-Dateien im Repo. `QS-FRIT-DRIFT` vergleicht nur eId-Mengen. | `SprachUmschalter.tsx` existiert, ohne Bund-Daten | `W2·5g-ZEIT` (Datenanteil) — Phasenzuordnung offen, §4 | fehlt |
| **Metadaten** | Titel, Kürzel, SR-Nummer, Rechtsgebiet, Rang, Status, Stand, Quelle **einmal** definiert (§5). | 239 Register-Einträge; ohne `sr` 8 (EU-Rechtsakte), ohne `inkraftSeit` 11, ohne `pdfUrl` 11; `titel`/`kuerzel`/`quelleUrl` vollständig. `register.json` **1,45 MB**, lädt ganz. Erlass-Volltitel + `erlassdatum` + `praeambel` liegen zusätzlich im Struktur-`kopf` ⇒ **vierte Metadaten-Heimat**. | `ErlassKarte.tsx`, `ErlassKopfBlock.tsx`, `Gesetze.tsx` | `QS-PERF` (Register-Schnitt, harte Vorbedingung von `W2·5n-BUND-VOLL`) | teilweise |
| **Bestand** | Jeder Erlass, den ein Schweizer Jurist aufschlägt, ist da. | 228 Snapshots / 239 Register-Einträge; 9 `nur-live-link`, 2 `pdf-embed`. Ziel ~5 100–5 500 SR ⇒ **4,4 %**. Fehlend: EMRK (nur PDF), EÖBV, AVG. | `Gesetze.tsx`, `kernerlasse.ts` | `QS-KORPUS` (Kernerlasse) · `W2·5n-BUND-VOLL` (Breite) | teilweise |
| **Leser-Tempo** | Das Kernwerkzeug ist auf einem Kanzlei-Notebook im Zug benutzbar. | Zitiert (1.9.2026, nicht nachgemessen): OR **7 899 ms @4×+4G**, **27 432 ms @6×+3G**; ungedrosselt 780 ms. | — | `QS-PERF` (Erst-Render + Register-Schnitt) | teilweise |

**Nachtrag 14.9.2026 zur Zeile «Aufgehoben / Historie» (ERGÄNZUNG, keine Korrektur —
die Messung oben bleibt stehen).** Beim Bau der Checklisten-Zeile «`aufgehoben` strukturell
statt Text-Heuristik» ergab die Nachmessung am selben Korpus **1 375 Heuristik-Treffer in
153 Dateien** statt der oben ausgewiesenen 1 389 in 177. Kommando und Ausgabe stehen im PR;
die Differenz ist nicht aufgelöst (plausibel: andere Zählweise der Anhang-/Schlussteil-Token
bzw. Messung vor dem Sidecar-Lauf #851). Beide Zahlen gelten für ihr Datum.

**Was 14.9.2026 eingelöst wurde.** Das amtliche Signal ist der Aufhebungs-Vermerk der
Fedlex-Fussnote — am Kopf-Marker des `<article>` (leerer Body, OR Art. 48) oder am Marker
jedes «…»-Absatzes (ASYLG Art. 52); Sonderform: der amtliche Wortlaut IST «Aufgehoben»
(ASYLV2 Art. 19). Regel und Belege: `scripts/normtext/aufhebung-signal.ts`.
Ergebnis: `aufgehoben` **0 → 1 277 / 25 463** in 145 von 228 Dateien.

**Was NICHT markiert wurde und warum (§7/§8).** 98 Bund-Leerstellen bleiben ungeklärt,
in vier Klassen — und drei davon sind Artikel, die heute FÄLSCHLICH als «aufgehoben»
angezeigt werden:
1. **Änderungs-Artikel** — «…» + Fussnote «Die Änderung kann unter AS … konsultiert
   werden» (AVIG Art. 115, BGFA Art. 35, VGG Art. 50–52). Die Bestimmung gilt.
2. **Noch nicht in Kraft / befristet** — «Tritt zu einem späteren Zeitpunkt in Kraft»
   (AIG Art. 126f), «in Kraft vom … bis zum …» (EPV Art. 64a–64j).
3. **Amtliche Vermerke ausserhalb der Fussnoten-Grammatik** — «Gegenstandslos»
   (StGB Art. 67f), «Dieser Art. bleibt aus gesetzestechnischen Gründen leer»
   (StGB Art. 108, gilt nicht als aufgehoben), «Diese aufgehobenen Art. werden …
   ersetzt durch» (StGB Art. 201–212), amtlicher Tippfehler «Aufgehobn durch» (BKV Art. 8).
4. **Anhänge** (`annex_*`) — eigenes `<section>`-Schema, vom Artikel-Signal noch nicht
   erfasst (AKKBV Anhang 3, EPV Anhang 1/2, EBG Anhang).
Klasse 1 und 2 sind ein eigener §8-Posten (die Anzeige lügt heute), Klasse 3 und 4 sind
Erweiterungen des Signals. Gedeckelt und sichtbar über `npm run check:leerstellen`.

**Nebenbefund für die Zeile «Aufgehoben / Historie» (nicht in diesem Bau behoben):** die
Artikel-Historie führt `aufgehobenSeit` auf Artikelebene aus Fussnoten mit `absatz == null`.
Gemessen 14.9.2026: 1 300 Artikel tragen `aufgehobenSeit`, **82 davon haben einen lebenden
Wortlaut** (AHVG Art. 58/87/88, AIG Art. 103a, ARG Art. 12 u. a.) — dort ist nur ein ABSATZ
aufgehoben, die Zuordnung fällt mangels Absatz-Skopus auf den ganzen Artikel. Darum ist
`historie.aufgehobenSeit` NICHT als Quelle für `NormSnapshot.aufgehoben` verwendet worden.

### §1.1 · Struktur-Befund: ein Gesetz besteht heute aus fünf Artefakten

Es gibt **kein einzelnes Objekt «Erlass»**. Je Erlass-Key existieren: Snapshot
(`bund/X.json`) · Struktur-Sidecar (`struktur/bund/X.json`) · Historie-Shard (`historie/X.json`) ·
Revisionen (`revisionen/X.json`), dazu vier globale Register (`register.json`, `currency.json`,
`inkrafttreten.json`, `confidence.json`). Die Bausteine eines Gesetzes sind also über fünf
Dateien verteilt, die **getrennt altern** — belegt an zwei Stellen: der Sidecar trägt in 216/228
Dateien keinen eigenen `stand`/`fassungsToken`, und `KKV.json`, Token `126_z__2`, existiert im
Snapshot, aber nicht im Sidecar (25 463 vs. 25 462).

**Sollbild-Entscheid (Vorschlag, nicht umgesetzt):** Das Fünf-Artefakt-Modell **bleibt** — es ist
eine Ladeoptimierung, kein Fehler, und ein Zusammenlegen widerspräche `QS-PERF`. Was fehlt, ist
die **Klammer**: (a) jedes Artefakt trägt `stand` + `fassungsToken` des Erlasses, (b) ein Tor
prüft, dass alle fünf denselben Wert tragen und dieselbe Artikelmenge kennen. Damit wird «ein
Gesetz» als Einheit prüfbar, ohne das Speichermodell zu ändern.

**Umsetzung 14.9.2026 (ergänzt, ersetzt die Messung oben nicht).** (a) und (b) sind für das Paar
Snapshot ↔ Struktur-Sidecar eingelöst:

- **Sidecar-Marke, 216 nachgezogen.** `struktur-run.ts` stempelte `stand`/`fassungsToken` schon
  seit #808 B4, aber nur in neu geschriebene Dateien. Ein Generator-Lauf
  (`npm run normtext:struktur -- --datum=2026-09-14`, 228/228, 215 geschrieben) zog den Rest nach.
  **Beleg, dass die Marke reproduziert und nicht behauptet ist:** 215 der 216 geänderten Dateien
  sind ausserhalb von `erzeugt`/`stand`/`fassungsToken` byte-gleich zum Vorzustand — die
  Sidecar-Substanz folgt unverändert aus denselben gepinnten Fedlex-Caches wie die Snapshots.
- **Tor scharf.** `check:struktur-konsistenz` verlangt die Marke im Bund-Ast neu als Pflicht
  (`versionsKlammerBefund`); der bisherige `standDriftBefund` schlug nur an, wenn **beide** Seiten
  sie tragen, und konnte für 216/228 gar nicht rot werden (§6.7). Der Kanton-Ast bleibt bewusst
  additiv (eigener Generator, Phase 2). Neue Ausgabe: «228/228 mit geschlossener Fassungs-Klammer».
- **Historie-Shard und Revisionen** brauchten keine eigene Marke: der Shard wird von
  `historie-generieren.ts` aus dem Sidecar erzeugt, und `check:historie` erzwingt Byte-Gleichheit
  gegen eine frische Ableitung — die Klammer trägt dort schon ein anderes Tor (§17 Gegengewicht:
  nicht zweimal dieselbe Sorge bewachen).

**KKV-Token `126_z__2` — Quell-Effekt, kein Generationslauf-Versatz.** Das Fedlex-HTML der KKV
vergibt die id `art_126_z` **zweimal**: für Art. 126z «Anlagebeschränkungen und Anlagetechniken»
und für Art. 126z^tredecies «Wesentliche Mängel», dessen Ordinal-Suffix Fedlex nicht in die eId
schreibt. Der Snapshot-Generator löst das seit M9/G7 mit dem Synthese-Suffix `__2`; der
Struktur-Extraktor tat es nicht und liess das zweite `<article>` das erste überschreiben. Der
Befund war damit **schwerer als gemessen**: nicht ein Artikel ohne Struktur, sondern ein Artikel
mit **fremder** Marginalie und Gliederung (§1/§7). Fix an der Pipeline-Quelle; korpusweiter
Blast-Radius gemessen: 1 Datei, 1 Token.

**Offen und ausgewiesen (§8) — Stand 14.9.2026 (historisch, nicht nachgeführt):** Der Snapshot
führte `126_z__2` mit `artikelLabel: "Art. 126z"` — amtlich richtig wäre «Art. 126ztredecies».
Die Ursache liegt in der Fedlex-eId, die Korrektur beträfe den Snapshot (Golden) und gehört in
einen eigenen, deklarierten Schritt; damals bewusst **nicht** mitgemacht. Zwei Artikel des
Erlasses trugen darum im Leser dasselbe Label.

**Erledigt am 15.9.2026 (WP-C, der oben verlangte eigene Schritt).** Beide Punkte sind behoben,
und zwar generisch für jeden `__N`-Token, nicht KKV-hart-kodiert:

- **Label aus dem amtlichen Heading.** Das zweite `<article id="art_126_z">` trägt das
  unterscheidende Ordinal selbst — wörtlich aus dem gepinnten Cache (`/tmp/kkv.html`,
  ELI `cc/2006/859`, Konsolidierung 20251125):
  `<b>Art. 126</b><i>z</i><sup></sup> <sup>tredecies</sup><sub></sub>Wesentliche Mängel`
  (das erste Vorkommen trägt an derselben Stelle nur leere `<sup></sup>`). Neu leitet
  `scripts/normtext/doppel-id-label.ts` das Label von dort ab: `Art. 126ztredecies`, im Hausstil
  der Nachbarn `art_126_z_bis` … `art_126_z_duodecies`, die das Ordinal in der id führen. Die
  Regel ist eine **Form**-Regel, keine Wortliste: genau ein `<sup>` im Artikel-Kopf, dessen Text
  nach Tag-Entfernung aus reinen Kleinbuchstaben (≥ 3) besteht. Trägt der Kopf keines oder mehr
  als eines, bleibt es beim Basis-Label (§7: nichts erfinden). Empirische Deckung: Sweep über
  **alle 262 gepinnten Fedlex-HTML-Caches** — in Artikel-Köpfen treten als reine
  Kleinbuchstaben-`<sup>` ausschliesslich die 12 Ordinalia `bis · ter · quater · quinquies ·
  sexies · septies · octies · novies · decies · undecies · duodecies · tredecies` auf, kein
  einziger Fehltreffer (Fussnoten sind `<sup><a …>N</a></sup>`).
- **`quelleUrl` ohne Synthese-Suffix.** Der Haupttext-Pfad schrieb `…/de#art_126_z__2` — ein
  Fragment, das in der amtlichen Fassung nicht existiert. Neu der rohe Anker `#art_126_z`, wie es
  der Schlussteil- und der Anhang-Pfad seit je tun (§5: eine Anker-Wahrheit). **Bewusst
  ausgewiesene Rest-Unschärfe (§8):** bei doppelter id springt Fedlex auf das **erste** Vorkommen
  — der Erlass stimmt, die Stelle ist ungenau. Das ist ehrlicher als ein toter Anker; im Code
  vermerkt. Der Verifizier-Deep-Link (`src/lib/normtext/verifikationslink.ts`) unterdrückt den
  Artikel-Link bei `__N` unverändert ganz.

**Nachtrag 15.9.2026 (Gegenprüfung PR #890, Schwere mittel) — der Anker trifft jetzt das
richtige Vorkommen.** Der Absatz darüber bleibt als Beleg des Zwischenstands stehen; die dort
ausgewiesene Rest-Unschärfe ist **behoben**, nicht nur ausgewiesen. `#art_126_z` ist der Anker des
**ersten** Vorkommens — ein Browser löst ein doppeltes `id` immer auf das erste Element auf, der
Leser landete also bei «Anlagebeschränkungen» statt bei «Wesentliche Mängel».

- **Herkunft des neuen Ankers.** Fedlex legt vor jeden Artikel-Kopf einen eigenen amtlichen
  Namens-Anker `<a name="…"></a>`; beim zweiten `<article id="art_126_z">` lautet er `ta126z`,
  beim ersten `a126z` (gepinnter Cache `/tmp/kkv.html`, KKV SR 951.311, ELI `cc/2006/859`,
  Konsolidierung 20251125: genau 1× `name="ta126z"`, 0× `id="ta126z"` — kollisionsfrei).
  `amtlicherAnker()` in `scripts/normtext/artikel-vorkommen.ts` nutzt ihn generisch für jeden
  `__N`-Token und nur dann, wenn er dokumentweit genau einmal als `name` und nie als `id`
  vorkommt; sonst bleibt es beim Basis-Anker (§7). Eingehängt an beiden `__N`-fähigen
  Generator-Pfaden (Haupttext, Schlussteil). Empirie: Sweep über alle **269** gepinnten
  Fedlex-Caches — 25 880 `<article>`, ausnahmslos alle mit `<a name>` vor dem Kopf; zwei doppelte
  ids mit N ≥ 2, beide mit eindeutigem Namen.
- **Live-Nachweis (Playwright, headless Chromium, 15.9.2026, Viewport 1280×900, `networkidle`
  + 3 s).** Fedlex ist eine SPA und setzt den Sprung selbst — sie springt den `name`-Anker an:
  `…/de#ta126z` → `scrollY` 64886, 2. Vorkommen «Wesentliche Mängel» bei `top=0px` (im Viewport),
  1. Vorkommen bei `top=-3097px` (draussen). Gegenprobe `…/de#art_126_z` → `scrollY` 61735,
  1. Vorkommen «Anlagebeschränkungen» bei `top=32px` (im Viewport), 2. Vorkommen bei `top=3129px`
  (draussen) — der reproduzierte Fehlsprung.
- **Diff der Regeneration:** genau **eine** Zeile gegen den Vorstand (`quelleUrl` von
  `…#art_126_z` auf `…#ta126z`); der Eintrag `bund/KKV/art_126_z` behält `#art_126_z`.
  Golden unverändert (Anker ist nicht im Block-sha). Neuer Test:
  `src/tests/artikel-vorkommen-anker.test.ts` mit wörtlichem Cache-Markup beider `<article>`.

**Blast-Radius (gemessen 15.9.2026):** `126_z__2` ist der **einzige** `__N`-Token im gesamten
Korpus (`public/normtext/**`: 1 Datei, 1 Token). Diff der Regeneration: exakt zwei Zeilen —
`artikelLabel` und `quelleUrl` dieses einen Eintrags; die übrigen 210 Einträge byte-gleich,
`golden/normtext-snapshot.json` unverändert (weder Label noch `quelleUrl` fliessen in den
Block-sha, `scripts/normtext/sha-bloecke.ts`).

**Weiterhin offen (§8):** Genau weil Label und `quelleUrl` golden-neutral sind, bewacht sie **kein
Drift-Tor** — ein künftiger Rückfall bliebe still. Geschützt sind sie heute nur durch
`src/tests/doppel-id-label.test.ts` und `src/tests/artikel-vorkommen-anker.test.ts` (Fixtures =
wörtliches Cache-Markup) und die Pflicht-Gegenprüfung. Ein Label-/Anker-Riegel im Sinne von §6.7 wäre ein eigener Schritt.

### §1.2 · Struktur-Befund: das Randtitel-Doppelmodell

Randtitel haben **zwei Modellfelder**: `NormSnapshot.titel` (`typen.ts:16-22`) — im Bund
**0/25 463** gesetzt, vom Kanton-Pfad genutzt — und `struktur.artikel[tok].marginalie: string[]`
(`browse.ts`) — im Bund 22 223 Artikel, vom Kanton nicht genutzt. Dieselbe amtliche Sache hat zwei
Heimaten (§5-Risiko).

**Sollbild-Entscheid (Vorschlag, David entscheidet, §4):** `struktur.marginalie` wird die eine
Quelle, `NormSnapshot.titel` wird zur Projektion oder entfällt. Grund: der Randtitel gehört zur
selben Schicht wie Gliederung und Fussnoten (alle im Sidecar), und das Bund-Feld trägt heute die
weitaus grössere Datenmenge. Gegenargument, das mitentschieden werden muss: der Kanton-Pfad müsste
migrieren, und der Sidecar hat heute keinen Drift-Riegel (§2, Zeile Sidecar).

**Umsetzung 15.9.2026 (WP-D, verhaltensneutraler Phase-1-Schnitt, Entscheid David 14.9.2026
Option i):** die zwei Inline-Kopien der Fallback-Kette (`marginalie` vor `titel`) in
`leserSuche.ts` (`baueLeserSuchIndex`, vormals Z.230 und Z.246) sind durch den kanonischen
Accessor `artikelRandtitel` (`gliederungsArtikel.ts:75`) ersetzt — EINE Stelle im Code für die
Regel, geprüft in `src/tests/randtitel-eine-quelle-w227.test.ts`. Der Typ-Kommentar zu
`NormSnapshot.titel` (`typen.ts`) benennt das Sollbild jetzt ausdrücklich als KANTON-
Übergangsprojektion. Neuer Wächter im selben Test-File: kein Bund-Artikel im Korpus trägt
`titel` (Ist 0/25 601, Stand 15.9.2026). Bewusst **Phase 2** (unverändert, kein Kanton-Verhalten
angefasst): `NormSnapshot.titel` bleibt als Feld bestehen und wird vom Kanton-Pfad weiter
geschrieben (`adapter-lexwork.ts:615–659`); `such-index-generieren.ts:134–151` und
`NormChip.tsx:225` lesen weiterhin nur `marginalie`, ohne `titel`-Fallback (für Kanton eine
bestehende Lücke, für Bund korrekt); der zweite, unabhängige Kanton-Parser für `marginalie`
(`struktur-lexwork.ts:317`) bleibt bestehen; `ArtikelLeser.tsx`/`ArtikelLeser.kopfteile.tsx`
(Render mit den zwei Props `randtitel`/`titel`) sind unverändert — der Render-Fallback bleibt
als Kanton-Übergang bestehen, bis Phase 2 den Kanton-Pfad migriert.

---

## §2 · Lücken, nach Nutzen für einen lesenden Juristen

| # | Lücke (Messung 14.9.2026) | Warum sie weh tut | Zuständig |
|---|---|---|---|
| 1 | **EMRK nur PDF-Einbettung, EÖBV und AVG fehlen ganz** | Drei Erlasse, die täglich aufgeschlagen werden, sind nicht als Normtext benutzbar. | `QS-KORPUS` |
| 2 | **228 von ~5 100 Bundeserlassen (4,4 %)** | Wer ausserhalb des Kernrepertoires sucht, findet nichts. | `W2·5n-BUND-VOLL` |
| 3 | **19 Staatsverträge ohne Randtitel und ohne Historie** (CISG, CMR, LugÜ, HKÜ, UNO-Pakte …) | Kein Sachtitel im Sprungziel, kein «gilt seit» — also kein Fassungsvertrauen. | `QS-KORPUS` |
| 4 | **1 389 aufgehobene Artikel stehen auf einer Text-Heuristik** | Ein Extraktionsfehler sähe exakt aus wie eine Aufhebung (§7/§8). | `W2·27` |
| 5 | **45,8 % der Fussnoten-Marker am falschen Ort** (14 266 von 31 178) | Der Leser sieht die Fussnote am Absatzende statt am Wort. | `W2·5l-NORMTEXT-B2` §M14 |
| 6 | **Kein persistenter Zitatgraph, 16 tote Artikel-Anker** | Verweise entstehen aus Kürzel + Nummer ohne Nachschlag im Ziel; «zitiert von» gibt es nicht. | `W2·22-VERWEIS-FEDLEX` Z4/Z6c |
| 7 | **Aussen- und Binnenverweis sehen gleich aus** (V-4) | Der Leser weiss beim Klick nicht, ob er das Gesetz verlässt. | `W2·20-VERWEIS-SCHAERFE` |
| 8 | **Zukunftsfassungen sind Daten ohne Oberfläche** (93 künftige Inkrafttreten in 64 Erlassen) | Wer wissen will, was ab 1.1. gilt, sieht es nicht. | `W2·5l` M16-UI / `W2·5g-ZEIT` (§4) |
| 9 | **Nur Deutsch** | Der mehrsprachige Auslegungsvergleich (Art. 14 PublG) fällt als Werkzeug aus. | `W2·5g-ZEIT` (§4) |
| 10 | **Erst-Render OR 7,9 s @4×, 27,4 s @6×+3G** | Im Zug unbenutzbar; zugleich blockiert der fehlende Register-Schnitt jede Bestandsvergrösserung. | `QS-PERF` (Vorbedingung von `W2·5n-BUND-VOLL`) |

**Nebenfunde (Messung 14.9.2026, Teil E):**

| Nebenfund | Beleg | Zuständig |
|---|---|---|
| `confidence.json` stammt vom **23.6.2026** (150 Erlasse; heutiger Lauf ~1 566) ⇒ Qualitätsbild veraltet | `public/normtext/confidence.json` | `W2·27` (Neulauf; Frische-Tor `check:confidence-frische` seit 15.9.2026) |
| Korpus stammt aus **drei Generationsläufen** (113 Dateien 29.8. · 109 Dateien 12.9. · 6 Dateien 4.9.2026) — kein einheitlicher Stand | Dateizeitstempel `public/normtext/bund/` | `W2·27` (Messung dokumentiert; Neubau erst mit `W2·5n-BUND-VOLL`) |
| Struktur-Sidecar **ohne eigenen Drift-Riegel**: 216/228 Dateien ohne `stand`/`fassungsToken` — Randtitel und Fussnoten altern unbemerkt; passt zum Befund «Golden-Token blind für Randtitel» (`sha-bloecke.ts:50`) | Messung §1.1 | `W2·27` (Risikopfad) |
| **KKV-Token `126_z__2`** fehlt im Struktur-Sidecar (Snapshot 25 463 vs. Struktur 25 462) — ein Artikel ohne Gliederung, Randtitel und Fussnoten | `KKV.json` | `W2·27` |
| **Sonder-Sektionen ausserhalb der Artikel fallen aus dem Snapshot** (§8-Lücke): eine eigene `<section id="signature">` wird gar nicht extrahiert (EMRK: «Geschehen zu Rom am 4. November 1950 … (Es folgen die Unterschriften)» fehlt), und Fussnoten aus `preface`/`preamble`/`scope`/`annex_u1` fehlen in der Historie-Abdeckung: EMRK 33/38, EÖBV 12/18, AVG 67/70. Liegt der Unterschriftsblock IN einem Artikel/Anhang, trägt der Snapshot ihn (EAUE `art_32`, RBUE/CMR `annex_u1`, FZA `annex_III`) — es ist eine Sektions-, keine Text-Grenze. Ohne Normgehalt, darum Nebenfund. | Messung 14.9.2026 gegen `…-20220916-de-html-9.html` (122 930 B) u. a. | `W2·27` |

**Nicht gemessen (ehrliche Grenze, §8):** Vollständigkeit **gegen die amtliche Quelle** — alle
«befüllt»-Zahlen sagen nur, was im Repo steht. Ob Fedlex mehr enthält (fehlende Randtitel bei
3 239 Artikeln, fehlende `disp_*` in 223 Erlassen), ist aus den Daten allein nicht entscheidbar
und braucht einen Soll-Ist-Abgleich gegen Fedlex — heute existiert dafür **kein Tor**.

---

## §3 · Bau-Einheiten der Phase 1, in Reihenfolge (`W2·27-BUND-FERTIG`)

Dieser Abschnitt **referenziert** bestehende Schritte, er spezifiziert sie nicht neu (§5) — je Zeile
steht nur, **was davon zu Phase 1 gehört**. Die Reihenfolge ist die `@queue` in ROADMAP.md.

| # | Schritt | Was davon zu Phase 1 gehört | Spec |
|---|---|---|---|
| 0 | `W2·27-BUND-FERTIG` | Sollbild (§1), Messung 14.9.2026, und die vier Struktur-Posten ohne eigenen Schritt: Randtitel-Doppelmodell auflösen · `aufgehoben` strukturell · Sidecar-Drift-Riegel · `confidence.json`-Neulauf · KKV-Token. | diese Datei |
| 1 | `W2·5l-NORMTEXT-B2` | **§M13** Schlusstitel/ÜbBest./Anhänge (LugÜ-Protokolle `lvl_*`) und **§M14** wortgenaue Fussnoten — Restmenge **14 266**, nicht die im Fahrplan genannten ~1 121; dazu die Unterzeile «Tabellen lesbar machen» (Bund-Anteil: 545 mehrspaltige Blöcke). | [FAHRPLAN-NORMTEXT-DARSTELLUNG.md](FAHRPLAN-NORMTEXT-DARSTELLUNG.md) §M13/§M14 |
| 2 | `QS-KORPUS` | Nur die Bund-Zeilen: Kernerlasse EMRK/EÖBV/AVG · 19 Staatsverträge ohne Randtitel/Historie · Phantom-Zitate (Filter-Stufe). | [FAHRPLAN-OFFENE-BEFUNDE.md](FAHRPLAN-OFFENE-BEFUNDE.md) §1 |
| 3 | `W2·20-VERWEIS-SCHAERFE` | V-1 (Mess-Tor) → V-2 (Selbstmarker) → V-4 (Aussen-Anzeige). V-3 (Kanton-Kürzel-Resolver) ist **Phase 2**, V-5 (Zeit-Kante) **Phase 3**. | [FAHRPLAN-VERWEIS-SCHAERFE.md](FAHRPLAN-VERWEIS-SCHAERFE.md) §1 |
| 4 | `W2·22-VERWEIS-FEDLEX` | Amtlicher Zitatgraph aus Fedlex-`jolux:Citation`; Z6a (`29septies`), Z6c (tote Anker → Erlass-Link-Fallback), Z4 («zitiert von», Bund). Hängt per `dep` an Nr. 3. | ROADMAP.md, Schritt-Checkliste |
| 5 | `W2·5m-LESER-V3` | Nachbar-Artikel-Pfeile · Rohdaten-Link je Erlass · S2 (Typografie/Artikel-Raster) · D0 (Farb-Vorarbeit) · S4 (Kantons-Probe: nichts bricht). Fassungs-Diff-Tab erst nach M16. | [FAHRPLAN-LESER-V3.md](FAHRPLAN-LESER-V3.md) Kap. 7/8 |
| 6 | `QS-PERF` | **Nur** OR-Erst-Render (Snapshot-Preload, K3-Chunk-Kaskade, Reader-Kopf-Reflow) **und der Register-Schnitt** — letzterer ist harte Vorbedingung von Nr. 7. | [FAHRPLAN-PERFORMANCE.md](FAHRPLAN-PERFORMANCE.md) §1 |
| 7 | `W2·5n-BUND-VOLL` | **Abschluss der Phase 1:** 238 → ~5 100 SR-Erlasse über die bestehende Fedlex-Pipeline. Erst nach dem Register-Schnitt aus Nr. 6. | [FAHRPLAN-FEDLEX-PORTFOLIO.md](FAHRPLAN-FEDLEX-PORTFOLIO.md) §21 |

**Risikopfad.** Die Nummern 0–2, 4 und 7 berühren Extraktion bzw. amtliche Substanz ⇒
**Gegenprüfung Pflicht**, Beleg mit Norm + Link + Stand (§7), Korrektur in der Pipeline-Quelle,
nie in der Projektion (§5), golden byte-gleich bzw. deklarierter Re-Bless.

---

## §4 · Offene Punkte für David — entschieden 14.9.2026

> **Entscheid David 14.9.2026 (Chat, wörtlich): «fr/it später, zukunftsfassungen phase 1, randtitel
> wie empfohlen».** Gebucht: **(a) = (ii)** — FR/IT nach Phase 1, als eigener Zug mit `W2·5g-ZEIT`
> (Phase 3); **(b) = gestaffelt** — der Hinweis im Leserkopf («ab <Datum> gilt eine neue Fassung» +
> amtlicher Link) ist Phase-1-Posten unter `W2·27-BUND-FERTIG`, Umschalter/Diff bleiben Phase 3;
> **(c) = (i)** — `struktur.marginalie` wird die eine Quelle, `NormSnapshot.titel` wird Projektion
> oder entfällt, Kanton migriert in Phase 2; Auflage Sidecar-Drift-Riegel zuerst (PR #851).
> Die Optionen darunter bleiben als Entscheidungsgrundlage stehen.


**(a) FR/IT-Fassungen — Phase 1 oder später?**
Optionen: **(i)** in Phase 1, weil «vollständig» bei einem mehrsprachigen Bundesrecht auch die
Sprachfassungen meint (Art. 14 PublG); **(ii)** nach Phase 1, als eigener Zug zusammen mit
`W2·5g-ZEIT`; **(iii)** Phase 3.
**Empfehlung: (ii).** Die Datenmenge verdreifacht den Bund-Korpus, und das Sollbild lässt sich an
einer Sprache genauso festschreiben. Phase 1 bleibt damit endlich.

**(b) Zukunftsfassungen-UI — Phase 1 oder Phase 3 (Zeitmaschine)?**
Optionen: **(i)** Phase 1, als **Hinweis** im Leserkopf («ab 1.1.2027 gilt eine neue Fassung» +
amtlicher Link) — die Daten liegen bereits (62 `naechsteFassungAb`, 93 künftige Inkrafttreten);
**(ii)** Phase 3, zusammen mit der vollen Zeitmaschine und dem Fassungs-Diff.
**Empfehlung: Beides gestaffelt** — der reine Hinweis in Phase 1 (klein, §8-Ehrlichkeit, kein
neues Datenmodell), Umschalter und Diff in Phase 3.

**(c) Randtitel-Doppelmodell — welches Feld bleibt?**
Optionen: **(i)** `struktur.marginalie` bleibt, `NormSnapshot.titel` wird Projektion/entfällt
(Kanton migriert); **(ii)** `NormSnapshot.titel` bleibt, Bund-Marginalien werden hineinprojiziert;
**(iii)** beide bleiben, mit deklarierter Zuständigkeit je Herkunft.
**Empfehlung: (i)** — der Randtitel gehört in dieselbe Schicht wie Gliederung und Fussnoten, und
das Bund-Feld trägt die grössere Datenmenge. Auflage: der Sidecar-Drift-Riegel (§2, Nebenfunde)
muss **vorher** stehen, sonst wandert die Randtitel-Wahrheit in eine Datei ohne Wächter.

---

## §5 · Nicht-Ziele der Phase 1

Ausdrücklich **nicht** Gegenstand — wer sie anfasst, baut ausserhalb des Auftrags:

- **Kantone.** Kantonale Extraktion, Drift, Quellen-Hygiene, PDF-Werkstatt, Systematik-Bäume und
  der kantonale Zitat-Resolver sind **Phase 2**. Der bestehende kantonale Online-Bestand bleibt
  unverändert; nur echte Fehler laufen übers Fehlerbuch.
- **Rechtsprechung.** Nachweis-Index, Zitationsgraph, entscheidsuche-Anbindung, Zulieferer-Bau —
  **Phase 2 (Prüfschritt) bzw. Phase 3**.
- **Rechner und Vorlagen.** Bleiben geparkt (Blocker `zielbild-gesetzesleser`).
- **Design-Wärme.** Gestalterische Ausbaustufen bleiben geparkt; in Phase 1 zählt allein die
  **Design-Konsistenz im Leser** (gleiche Typografie, gleiche Abstände, CLS 0).
- **Server / VPS.** Erst nach Phase 2 (Entscheid David 14.9.2026).
