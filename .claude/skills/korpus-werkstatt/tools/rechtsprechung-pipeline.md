# Werkzeug-Leitfaden — Rechtsprechungs-Pipeline (Mechanik, exakt)

Die *wie*-Schicht für den Korpus **Rechtsprechung** (`public/rechtsprechung/`). Ziehe diese Datei
erst, wenn `methodology/rechtsprechung.md` beim Schritt «Vollbau / additiv / Snapshot generieren»
darauf verweist — nicht vorab. Das *was/warum* (Zweigwahl, Invarianten) steht in der methodology,
hier stehen nur die exakten Befehle, das JSON-Schema und die OCL-Quirks.

Generator: `scripts/normtext-entscheide.ts` (Orchestrator) · Adapter: `scripts/normtext/adapter-entscheide.ts`
(OpenCaseLaw → Snapshot) · Writer: `scripts/normtext/entscheide-schreiben.ts` · Typen:
`src/lib/rechtsprechung/typen.ts` + `register.ts`. Schreibt **nie von Hand editierte Dateien** — alles
aus diesem Generator (§7-Build-Regel). Recht: Urteilstext gemeinfrei (Art. 5 URG), Regeste lizenz-getrennt.

---

## Befehle in Reihenfolge

```
# Vollbau — zieht ALLE drei Live-Quellzweige neu (BGE-Leitentscheide + Bund-BFS + Kantone)
npm run entscheide -- --datum=$(date +%F) --bge-von=2024-01-01 --bge-limit=300 \
  --limit=45 --seeds=bger_5A_1100_2025 --courts=zh_obergericht,be_verwaltungsgericht --kanton-pro=8

# Additiv — Bestand byte-treu von der Platte + nur die eidg. Gerichte ergänzen (kein Drift der 272)
npm run entscheide -- --datum=$(date +%F) --additiv --eidg=bvger,bstger,bpatger --eidg-pro=5

# Additiv — Stichproben eidg. UND kantonaler Gerichte auffrischen (seit 25.9.2026): je Gericht
# die N NEUEN Urteile (Bestands-ids fallen vor der N-Auswahl heraus), danach --remap wie oben
npm run entscheide -- --datum=$(date +%F) --additiv --eidg=bvger,bstger,bpatger --eidg-pro=5 \
  --courts=zh_obergericht,be_verwaltungsgericht,sg_gerichte,gr_gerichte,ag_gerichte --kanton-pro=6

# Offline aus Fixtures (Quelle nicht erreichbar / deterministischer Trockenlauf)
npm run entscheide:seed -- --datum=$(date +%F)

# BGE-Band-Nachzug (additiv, band-basiert) — DANACH immer --remap (offline): der Nachzug bildet
# normKeys nur aus statutes, der Remap auch aus dem Fliesstext (Posten «sprachgebundene Alias-
# Auflösung», bis zur Angleichung; Beleg #1099: +IRSG/+VKL erst im Remap sichtbar)
npm run entscheide -- --datum=$(date +%F) --additiv --bge-baender=152
npm run entscheide -- --datum=$(date +%F) --remap
# Danach Folgeprojektionen (sonst check:zaehler rot):
npm run gen:zaehler && npm run gen:bezuege-zaehler && npm run datenhaltung:manifest
# Folgeprojektionen danach (sonst check:zaehler/check:bezuege-zaehler rot, Beleg 152 I 2, 25.9.2026):
npm run gen:zaehler && npm run gen:bezuege-zaehler && npm run datenhaltung:manifest

# Integritäts-Tor (Manifest⊇Snapshots · Provenienz · sha · Norm-Index⊆Manifest · BUDGET_MB)
npm run check:entscheide
# Vor dem Push bei JEDEM Korpus-Zuwachs die volle Sammelkette + korpusabhängige e2e, nicht nur
# gate:schnell: check:normkeys (Token-Schwelle 20) und e2e-Zahl-Pins reissen am Zuwachs
# (Beleg #1099, 25.9.2026: ein CI-Lauf verloren)
npm run check
# Ebenfalls VOR der PR-Übergabe — beides reisst sonst erst im PR- bzw. merge_group-Lauf:
#  · `npm run build && npm run check:perf-budget` — Daten-Nutzlast register.json (Budget 900 KB,
#    Freigabe David 25.9.2026; Beleg #1112)
#  · `npm run check:fachaenderung -- --pr <n>` — Pin-Nachführungen brauchen im Body
#    «Fachaenderung: <Norm> — <Begründung>»; Beleg #1112: Form ohne « — » → Tore rot

# §11-Übersichtsliste (bibliothek/) neu schreiben — NICHT von Hand editieren
npx vite-node scripts/bge-register-generieren.ts > bibliothek/rechtsprechung/bge-register.md
```

`npm run check:entscheide` ist in die Sammel-Kette `npm run check` verdrahtet — das fünfte Glied der
gate-«Fünferkette» (`tsc -b` · `vitest` · `golden:vergleich` · `lint` · `check`, in `scripts/gate.sh`).
`npm run gate` läuft sie voll zum Abschluss, `npm run gate:schnell` (nur `tsc -b` · `vitest` ·
`golden:vergleich`) pro Iteration.

### Flags des Generators (alle am Code verifiziert; Beleg = die Arg-Parsing-Konstante in `scripts/normtext-entscheide.ts`)

| Flag | Default | Wirkung | Beleg (Konstante) |
|---|---|---|---|
| `--datum=YYYY-MM-DD` | heute (ISO) | Abrufdatum / Provenienz; **immer `$(date +%F)` aus der Shell** (§2) | `const datum` |
| `--limit=N` | `45` | Bund-BFS: max. gewählte Urteile | `const bundLimit` |
| `--seeds=a,b` | `bger_5A_1100_2025` | Start-IDs des Citation-Graph-BFS | `const SEEDS` (in `bundKorpus`) |
| `--courts=c1,c2` | – | kantonale Gerichte (Listing je Gericht); **Vollbau und — seit 25.9.2026 — `--additiv`** | `const kantCourts` |
| `--kanton-pro=N` | `8` | je Kanton-Gericht gewählte Urteile aus den 4·N neuesten des Listings — Vollbau nach Rang (Regeste → Leitentscheid → Datum desc), **additiv streng nach Datum desc** und nur **neue** (Bestands-ids vorher ausgeschlossen) | `const kantonPro` |
| `--bge-von=YYYY-MM-DD` | – | **aktiviert** den BGE-Leitentscheid-Zweig (sonst keine BGE) | `const bgeVon` |
| `--bge-limit=N` | `300` | enumerierte BGE ab `--bge-von` | `const bgeLimit` |
| `--eidg=bvger,bstger,bpatger` | – | eidg. Gerichte als eigener Zweig (**nur sinnvoll mit `--additiv`**) | `const eidgCourts` |
| `--eidg-pro=N` | `5` | je eidg. Gericht die N neuesten (Datum desc aus den 4·N neuesten des Listings); additiv: N **neue** (Bestands-ids vorher ausgeschlossen) | `const eidgPro` |
| `--additiv` | aus | Bestand von der Platte laden + nur Neues ergänzen (kein Live-Neuzug der 272) | `const additiv` (Pfad in `main()`) |
| `--bge-refresh` | aus | nur additiv: mitten im Wort (U+2026) gekappte Bestands-BGE neu nachladen, `by id` ersetzen | `const bgeRefresh` |

**`--archive=tgz` existiert NICHT (mehr).** Aus altem Memory; nicht im Code, nicht verwenden.

Vier Quellzweige (Funktionen in `main()`): `bgeKorpus` (BGE, nur mit `--bge-von`) · `bundKorpus`
(Citation-Graph-BFS ab Seeds) · `kantonKorpus` (Listing je Gericht) · `eidgKorpus`
(BVGer/BStGer/BPatGer, nur im additiven Pfad). Ohne `--additiv` überschreibt der Lauf
den bestehenden Korpus aus den Live-Quellen; mit `--additiv` bleibt der committete Bestand byte-gleich.
Additiv laufen `eidgKorpus` und `kantonKorpus` (25.9.2026); Zusammenführen (Bestand gewinnt jede
id-Kollision) und Leer-Guard je Zweig (angefordert, aber 0 **geholt** ⇒ Abbruch; «0 neu», weil alles
schon im Bestand liegt, ist kein Abbruch) leben im reinen Kern `scripts/normtext/entscheide-additiv.ts`
(Test `src/tests/entscheide-additiv.test.ts`). Das Log nennt je Gericht «davon k schon im Bestand» und
die Datumsspanne der Auswahl — liegt sie vor dem jüngsten Bestandsurteil, lieferte das Listing nichts
Jüngeres (Stichprobe nicht aufgefrischt, ehrlich melden). Ein einzelnes Gericht ohne erreichbares Listing
(0 IDs) oder ohne geholte Details wird **übersprungen** — nie still: je Gericht eine Zeile
«<court>: übersprungen — …» und eine Sammelzeile «[additiv] übersprungen (k): …»; ins Lauf-Protokoll
bzw. den Bericht übernehmen.

---

## JSON-Schema `EntscheidSnapshot` (Interface in `src/lib/rechtsprechung/typen.ts`)

Ein Snapshot = genau EIN Entscheid (Datei `public/rechtsprechung/<id>.json`, Wrapper
`{ erzeugt, eintraege: [snap] }` = Typ `EntscheidSnapshotDatei`, geschrieben von `schreibeKorpus` in
`scripts/normtext/entscheide-schreiben.ts`). Eigener, schlanker Typ — der `NormSnapshot` der Gesetze
wird NICHT überladen, eigener Baum (golden-neutral, §5/§6). Die Belege je Feld sind der **Feldname im
Interface** selbst; Querverweise nennen die erzeugende Funktion.

```
EntscheidSnapshot {
  id              'bund/bger/5A_1100_2025' | 'kanton/<KT>/<court>/<docket>'  (dateisicher;
                  vergeben als `idSafe` in mappeEntscheidOCL — canton==='CH' ⇒ bund/, sonst kanton/<KT>/)
  // Identität (selbsttragend, §7-Provenienz)
  gericht         OCL court ('bger' | 'bge' | 'bvger' | …)
  gerichtName     'Bundesgericht' / Anzeigename
  gerichtstyp     'bundesgericht'|'bundesverwaltungsgericht'|'bundesstrafgericht'
                  |'bundespatentgericht'|'kantonal'              (Typ `Gerichtstyp`)
  kanton          'CH' für Bund (NIE leer)
  abteilung       OCL chamber | null
  nummer          docket '5A_1100/2025'
  bgeReferenz     'BGE 150 I 17' | null  — HARTE Invariante (gesetzt in mappeEntscheidOCL):
                  leitcharakter==='leitentscheid' ⟺ bgeReferenz≠null
  azaUrteil       { aktenzeichen, key, quelleUrl } | null
                  Nur BGE mit aufgelöstem Volltext; sonst null (= nur Sammlungs-Auszug, §8)
  zitierung       OCL citation_string_de
  datum           'YYYY-MM-DD' (BGE-Auszug-only: Bandjahr-Platzhalter via `aufAuszugZurueck`)
  sprache         'de'|'fr'|'it'|'rm' (Typ `EntscheidSprache`) — aus dem BODY via `spracheAusBody`
                  (in mappeEntscheidOCL), NICHT aus dem OCL-Record kopiert (Mislabel-Quelle)
  leitcharakter   'leitentscheid'|'routine'                       (Typ `Leitcharakter`)
  sachgebiet      Rechtsgebiet (kuratiert, deklariert, nie geraten)
  legalArea       rohes OCL legal_area | null (Provenienz, NICHT verifiziert)
  // Inhalt
  rubrum          { besetzung?, parteien?, gegenstand?, vorinstanz? } | null  (nur Bund, §8; Typ `EntscheidRubrum`)
  regeste         { text, quelle } | null                         (Typ `EntscheidRegeste`)
  regesteAmtlich  true nur beim amtlich publizierten BGE          (gesetzt in mappeEntscheidOCL)
  abschnitte[]    { typ:'sachverhalt'|'erwaegung'|'dispositiv', vollstaendig?, bloecke[] }
                  bloecke: { marke('E. 3.2.1'|null), tiefe?, text }   (Typen `EntscheidAbschnitt`/`EntscheidBlock`)
  auszugAbschnitte[]  amtlicher BGE-Sammlungstext (UI-Umschalter gegen abschnitte=Volltext)
  dispositivOrders[]  OCL dispositiv_orders
  // Verzahnung
  zitierteNormen[]  OCL statutes[] (Roh-Drittextraktion, NICHT verifiziert)
  normKeys[]        normalisiert auf Register-key (build-time)
  zitierteEntscheide[]
  // Status (zwei orthogonale Achsen)
  bestand           'snapshot'|'nur-live-link'                    (Typ `Bestandstatus`)
  kuratierung       'maschinell'|'geprueft' — 'geprueft' NUR via Abnahme (§7) (Typ `Kuratierungsstatus`)
  // Provenienz / Drift
  quelle            'opencaselaw'|'entscheidsuche'                (Typ `Entscheidquelle`)
  quelleUrl         amtliche Live-URL (bger.ch)
  abgerufen         ISO
  fassungsToken     OCL content_hash (Inhalts-/Verfügbarkeits-Fingerabdruck)
  sha               sha256EntscheidBloecke(abschnitte) — Drift-Anker
}
```

## Manifest-Schema `BrowseEntscheid` (Interface in `src/lib/rechtsprechung/register.ts`)

Aus dem Snapshot abgeleitete Metadaten-Karte; landet in `register.json` (lazy geladen, nie im Bundle,
§3). **Key, nicht UUID:** Funktion `keyVon(snap)` = `${gericht}_${docketSafe}`, z.B. `bge_150_I_17`
(in `scripts/normtext/entscheide-schreiben.ts`). Felder: `key · gericht · gerichtName · gerichtstyp ·
kanton · nummer · bgeReferenz · datum · zitierung · leitcharakter · regesteVorhanden · regesteKurz ·
sachgebiet · sprache · normKeys · bestand · kuratierung · datei · quelle · quelleUrl · fassungsToken ·
verweis?`.

- **`datei`**: Pfad relativ zu `public/rechtsprechung` (`'bund/bger/….json'`) — Typ `string | null`,
  **`null`** beim Verweis-Eintrag (kein Datei-Duplikat).
- **`verweis`** (Interface `VolltextVerweis`): `{ zielKey, ansicht:'voll', bgeReferenz }`. Gesetzt
  nur für die EIGENE Karte «vollständiges Urteil zu BGE X» (Deep-Link auf die BGE-Detailseite mit
  Voll-Ansicht). In `schreibeKorpus` erzeugt für jeden BGE mit `azaUrteil` + `auszugAbschnitte` (Branch
  `snap.gericht === 'bge' && snap.azaUrteil && snap.auszugAbschnitte?.length`):
  `key__voll`, `datei:null`, `bgeReferenz:null`, `normKeys:[]` → keine BGE-/Norm-Doppelzählung.

`schreibeKorpus` schreibt zusätzlich `norm-index.json` (`proNorm`, je Norm-key max. 12 Refs) und
`erfasste-keys.generated.ts` (`ERFASST`-Set, interne Verlinkung). **Norm-Index nur Bundesgericht:** nur
Snapshots mit `gerichtstyp==='bundesgericht'` (bge/bger) speisen `proNorm` — die eidg. Gerichte (canton
'CH', aber NICHT Bundesgericht) bleiben draussen, sonst erschienen sie fälschlich unter
«Bundesgerichtsentscheide zu diesem Erlass» (§8).

---

## OCL-Quirks — Warn-Liste (am Code verifiziert)

Diese Härtungen sind im Adapter/Orchestrator bereits verdrahtet; sie zu kennen ist nötig, damit du beim
Verifizieren (`review.md`) weisst, **welche Pathologie der Generator bereits abfängt** und wo ein Befund
auf einen NEUEN Regress deutet.

1. **aza-Kollisions-Quarantäne (§8).** Greift dieselbe `aza`-id für ZWEI BGE, ist mindestens eine
   Zuordnung falsch (zitiertes Präjudiz statt Eigenfall) → **beide** auf Auszug-only zurückstufen
   (Funktion `aufAuszugZurueck`, setzt `azaUrteil=null`), nie ein potenziell falscher Volltext unter einem
   Leitentscheid. Verdrahtet im Vollbau-Pfad von `main()` (`scripts/normtext-entscheide.ts`, Block
   «Kollisions-Quarantäne») und im additiven `--bge-refresh`-Pfad (gleicher Block über `alleBge`).

2. **Inversions-Schutz (≥ 85 %).** Das aufgelöste Volltext-Urteil muss mindestens ~annähernd so
   umfangreich sein wie der publizierte Sammlungs-Auszug (der Auszug ist eine Teilmenge). Ist der
   aza-Body `< 0.85 ×` des Auszug-Bodys, wurde eine prozessuale Nebenentscheidung erwischt →
   `azaSnap=null`, Auszug-only. In `holeBgeLeitentscheid` (`adapter-entscheide.ts`), Vergleich
   `bodyLen(azaSnap.abschnitte) < bodyLen(basis.abschnitte) * 0.85`.

3. **März-Regex `\S+`, nicht `\w+`.** Im aza-Az.-Kopf-Scanner (Funktion `azaAusBgeKopf`) ist der Monat als
   `\S+` gematcht. `\w` matcht ohne Unicode-Flag das «ä» in «März» NICHT — sonst fiele jeder im **März**
   entschiedene Eigenfall durch und die Regex griffe das nächste (zitierte) Az. (kritischer Bug-Check
   26.6.2026; Kommentar und Regex stehen beide in `azaAusBgeKopf`). Suchfenster: nur Kopf-Bereich vor
   den Erwägungen (`fenster = fullText.slice(0, … ≤ 8000)`) — zitierte Präjudizien leben erst in den Erwägungen.

4. **Sprach-Mislabel.** Das Sprach-Label wird aus dem **Body** bestimmt (Funktion `spracheAusBody`,
   distinkte Funktionswörter je Sprache zählen; klarer Sieger ≥ 5 Treffer **und** ≥ 1.25× Zweitplatzierter,
   sonst `null` → Fallback OCL-Record), NICHT aus dem OCL-`language`-Feld kopiert: ein fr/it-BGE trägt im
   'bge'-Record `language='de'`, der FR/IT-Body stammt aber aus dem unterliegenden aza-Urteil. `spracheAusBody`
   ist in `adapter-entscheide.ts` definiert und in `mappeEntscheidOCL` + `holeBgeLeitentscheid` angewandt.

5. **`paragraph_excerpt_chars=5000`.** OCL-`/structure`-Excerpts sind bei > 5000 Z. hart gekappt
   (Ellipsis-Marker …; ein höheres Limit liefert HTTP 422 → gar kein Strukturtext). Über dem Limit
   kratzende oder bereits gekappte Erwägungsknoten werden per `/erwaegung/{id}/{e}` voll nachgeladen
   (Funktion `fuelleGekappteErwaegungen` via `holeErwaegung`) — für Urteils-Body UND BGE-Sammlungs-Auszug,
   sonst bricht der Text still mitten im Wort ab (U+2026, «W2·6-BGE»). Das `paragraph_excerpt_chars=5000`-
   URL-Limit steht in den `jget`-Aufrufen von `holeEntscheidOCL`/`holeBgeLeitentscheid`.

6. **Zukunftsdaten-Verwurf.** Ein Entscheid kann nicht NACH dem Abrufzeitpunkt datiert sein (der Crawl
   holt nichts aus der Zukunft). `decision_date > abgerufen` ⇒ Snapshot wird NICHT aufgenommen (ehrlich
   weglassen statt ein Zukunftsdatum zeigen, §8). In `mappeEntscheidOCL`, Guard `if (datumRoh && abgerufen
   && datumRoh > abgerufen) return null`.

7. **Leer-Guard (§6).** Wird eine Quelle angefordert, aber **nichts** geholt, bleibt der bestehende
   Korpus **unberührt** — nie einen committeten Korpus durch einen fehlgeschlagenen OCL-Lauf entwerten.
   In `main()` (`scripts/normtext-entscheide.ts`) an jedem Schreib-Punkt verdrahtet (Vollbau, additiv-eidg/-kantonal — Kern `scripts/normtext/entscheide-additiv.ts`,
   additiv-gesamt, `--bge-refresh`; grep-bar über die «Leer-Guard»-Kommentare und die «Korpus unberührt»-
   Log-Zeilen). ⇒ Bei OCL-Ausfall NICHT halben Korpus
   schreiben — Lauf bricht selbsttätig ab (Fehlerfall 2, `methodology` / SKILL.md): offline über
   `npm run entscheide:seed` weiterarbeiten.

8. **Exakt-Id-Guard (Präfix-Unschärfe).** Der OCL-Keyed-Lookup `/decisions/{id}` matcht bei kurzen
   Seiten-Ids PRÄFIXUNSCHARF (`151_V_1` → `151_V_194`, `151_V_30` → `151_V_306`). Nur die exakt passende
   Entscheidung wird übernommen (`idNorm`-Vergleich in `holeBgeLeitentscheid`), sonst lieber kein Eintrag
   als ein falscher. Die zwei unauflösbaren Reste sind als WARN-Quarantäne geführt (Set
   `BGE_KAPPUNG_QUARANTAENE` in `scripts/normtext/check-entscheide.ts`), nicht gate-blockierend.

9. **BUDGET_MB-Deckel — Ort.** Der Mengen-Deckel sitzt **nicht** im Generator, sondern im Tor
   `scripts/normtext/check-entscheide.ts`: Konstante `BUDGET_MB` (aktueller Wert im Tor), Verstoss
   `dirGroesseMB(PUB) > BUDGET_MB` ⇒ exit 1. Freigabe David 26.6.: pro Aufgabe **fliessend** setzen
   (Ist + grosszügige Reserve) — bremst Unfälle, limitiert nicht künstlich. Bei Korpus-Ausbau hier
   bewusst nachziehen, mit Begründungs-Kommentar (Anpassungs-Historie steht im File).

10. **Kantonales `decision_date` ≠ Entscheiddatum (25.9.2026)** — oft Mitteilungs-/BGer-Datum; es gilt der
    Urteilskopf (`entscheid-kopfdatum.ts`, PDF-Rückfall `entscheid-kantonsdatum.ts`), Bestand per
    `--kopfdatum-refresh`. Beleg: `bibliothek/rechtsprechung/kantonales-entscheiddatum-kopf-2026-09-25.md`.
11. **BGE-Record vermischt (152 I 2 ← 152 I 20, 25.9.2026)** — Band-Nachzug ersetzt den Auszug durch den
    amtlichen clir-Auszug (`clir-auszug.ts`), sonst verwirft der Konflations-Guard.

11. **BGE-Basis-Record vermischt → clir-Auszug-Rückfall (25.9.2026).** Trägt OCLs Sammlungs-Auszug den
    laufenden Kopf eines anderen BGE desselben Bandes (Anlass 152 I 2: `full_text`, `statutes`, `cited_decisions`,
    `docket_number_2` von 152 I 20), ersetzt `ersetzeKonflatiertenAuszug` (`scripts/normtext/clir-auszug.ts`) im
    Band-Nachzug den Body durch den amtlichen clir-Auszug (`parseClirAuszug`) und verwirft die Record-Felder
    (statutes/Rubrum/Dispositiv/Zitate); ohne sauberen clir-Auszug verwirft der Konflations-Guard wie bisher.

Weitere am Code verdrahtete Invarianten (für `review.md` relevant), alle in `main()`
(`scripts/normtext-entscheide.ts`): **BGE-Dedup** — ein bereits als BGE-Volltext erfasstes bger-Urteil
wird nicht zusätzlich als Routine-Eintrag geführt (Dedup über `bge.filter((s) => s.azaUrteil)`);
**BGE-kanonisch zuerst** bei Kollision (Vereinigung mit «BGE ZUERST = kanonisch»); **Leit ⟺ BGE** ist
gate-geprüft (in `mappeEntscheidOCL`, `const leit = istBge || !!det.bge_reference` — kein `!!regeste`-Glied
mehr, eine maschinelle/kantonale Regeste begründet keinen amtlichen Leitstatus).

---

## Fehlerfälle (Verweis)

- **Quelle / OCL nicht erreichbar** → Lauf bricht durch den Leer-Guard selbst ab (Quirk 7). Offline über
  `npm run entscheide:seed -- --datum=$(date +%F)` aus Fixtures weiterbauen; ehrlicher §8-Fallback-Status
  statt erfundener Werte. Diagnose-/Tor-Wege in `tools/verifikation.md`.
- **`check:entscheide` rot** → Meldung lesen (Manifest⊇Snapshots · Provenienz · sha-Drift · Norm-Index-Refs ·
  BUDGET_MB). Bei BUDGET-Überschreitung Deckel-Ort bewusst nachziehen (Quirk 9), bei sha-Drift Snapshot neu
  generieren — **nie die JSON von Hand editieren** (§7).
- **Abschluss-Regel:** bei rotem Tor kein Push, keine Übergabe an `landung` (§9). DoD: §14.4-Pflicht-
  Gegenprüfung + §14.5-Trailer + §11-Ablage (`bge-register.md`).
