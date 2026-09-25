# Werkzeug — Normtext-Pipeline (Gesetze)

Die **exakte Mechanik** für den Normtext-Korpus: Befehle in Reihenfolge, das
fedlex:eli-Nachbearbeitungs-Ritual, das JSON-Schema der Snapshots, die
Register-Felder und das Zeilenformat von `fedlex-cache.sh`. Das *Warum* und die
fachliche Reihenfolge stehen in `methodology/normtext.md`; **diese Datei erst
beim Schritt «Cache laden / Snapshot generieren» in den Kontext ziehen**, nicht
vorab. Eiserne Regel (§7 Build-Regeln, in `SKILL.md`): Snapshots werden
**ausschliesslich vom Generator** erzeugt, **nie von Hand editiert**; das Datum
kommt immer aus der Shell (`$(date +%F)`, §2 — kein `new Date()` im Skript,
erzwungen in der Funktion `leseDatum()` in `scripts/normtext-snapshot.ts`, die
`--datum=YYYY-MM-DD` als Pflicht-Argument verlangt).

Jeder hier genannte Befehl ist ein **npm-Script in `package.json`** (Script-Name
ist der stabile Anker — kein Pfad/keine Zeilennummer nötig). Bund- und
Kanton-Spur haben **getrennte Tor-Blöcke** — sie sind nicht austauschbar.

---

## Bund — Befehlskette in Reihenfolge

```
npm run fedlex:eli -- <SR-Nr>                          # → 5-Feld-GERUEST  key|eli|YYYYMMDD|0|art_1  (NACHBEARBEITUNG noetig, s.u.)
# … Zeile von Hand nachbearbeiten + in scripts/fedlex-cache.sh einfuegen (Register-Eintrag inkl. kuerzel ergaenzen — fehlt er, bricht der Snapshot-Lauf ab) …
bash scripts/fedlex-cache.sh                           # bzw. npm run check:caches — laedt Filestore-HTML nach /tmp + prueft Anker + SR-Sonde
npm run normtext -- --nur=bund --datum=$(date +%F)     # regeneriert ALLE Bund-Snapshots aus der gepinnten cache.sh
npm run normtext:struktur -- --datum=$(date +%F)       # Struktur-Sidecar BUND (NICHT struktur-kanton)
npm run normtext:register -- --datum=$(date +%F)       # Browse-Register public/normtext/register.json
npm run gen:suchindex                                  # Such-Index nachziehen
npm run check:fedlex-versionen && npm run check:normtext && npm run check:suchindex && npm run gate
```

Alle zehn Namen sind als Script in `package.json` hinterlegt (per `grep '"<name>":' package.json` prüfbar).

**Wichtige Mechanik-Punkte:** (alle im `--nur=bund`-Zweig der Funktion `main()`
in `scripts/normtext-snapshot.ts`, Eintritt `if (process.argv.includes('--nur=bund'))`)
- **Es gibt KEINEN Per-Erlass-Filter.** `--nur=bund` regeneriert **alle**
  Bund-Snapshots aus der gepinnten `cache.sh`; das ist gewollt — der
  Golden-Index wird dabei **gemischt**: die kantonalen `kanton/*`-Einträge
  bleiben unangetastet, nur `bund/*` wird ersetzt (Schleife
  «kantonale … unverändert übernehmen / frische bund/*-Einträge ergänzen»). So
  lässt sich ein neuer Bundeserlass ergänzen, **ohne verifizierte
  Kantons-Snapshots zu riskieren**.
- `--nur=bund` setzt voraus, dass `golden/normtext-snapshot.json` schon
  existiert (ein Voll-Lauf muss zuerst die kantonalen Einträge erzeugt haben),
  sonst bricht der Lauf ab (der `throw` «`--nur=bund: … fehlt`» in eben diesem
  Zweig).
- Fehlt ein `/tmp/<name>.html`, ruft der Generator `fedlex-cache.sh` selbst auf
  (die Funktion `sicherstelleCaches()` via `execSync('bash scripts/fedlex-cache.sh')`);
  der explizite Cache-Lauf davor ist trotzdem Pflicht, weil nur er Anker +
  SR-Sonde verifiziert.
- **Update-Pfad (bestehender Erlass nach Drift):** kein `fedlex:eli`-Neueintrag,
  nur das `YYYYMMDD`-Feld der bestehenden `cache.sh`-Zeile bumpen, dann dieselbe
  Kette ab `--nur=bund`. Gegenprobe: `git diff --stat public/normtext/bund/` zeigt
  genau die Ziel-Datei(en); **nicht** `npm run golden:vergleich` (das prüft den
  Engine-Golden `lexmetrik-golden.json`, nicht den Normtext-Byte-Index
  `golden/normtext-snapshot.json`, den der `--nur=bund`-Zweig per
  `writeFileSync(goldenPfad, …)` schreibt).

---

## Nachbearbeitung der `fedlex:eli`-Zeile (vor dem Einfügen in `fedlex-cache.sh`)

`npm run fedlex:eli -- <SR-Nr>` (löst SR → ELI + **geltende** Konsolidierung via
Fedlex-SPARQL auf — geltend = grösste `dateApplicability ≤ heute`, in der
Funktion `loese()` als `geltend = daten.filter((d) => d <= heute).pop()` in
`scripts/fedlex-eli-aufloesen.ts`) emittiert **nur ein 5-Feld-GERÜST**, keine
fertige Zeile, **kein** abschliessendes `|SR`-Feld (`ok.push("…|0|art_1")`):

```
"<key>|<eli>|<YYYYMMDD>|0|art_1"
```

Drei Korrekturen, bevor die Zeile in das `EINTRAEGE`-Array von
`scripts/fedlex-cache.sh` kommt:

**(a) Feld 1 (`key`):** Bei der direkten `<SR-Nr>`-Aufrufform steht im
key-Feld die **SR-Nummer selbst** (die Direkt-Form `args.map((sr) => ({ sr, key: sr }))`
in `fedlex-eli-aufloesen.ts`, lowercased erst beim `ok.push`). Das ist falsch —
der key muss das **lowercase Erlass-Kurzkürzel == Register-key** sein (z. B.
`or`, `stgb`, `mwstg`), sonst bricht **Tor 1** (`describe('Tor 1 — Register ⊇
Bund-Snapshots …')` in `src/tests/normtext-register.test.ts`; die Invariante
«Register ⊇ Snapshots» ist im Kopfkommentar von `src/lib/normtext/register.ts`
deklariert): ein blind eingefügter Output ergäbe sonst eine Snapshot-id wie
`bund/830.1/…` statt `bund/ATSG/…`.
**Tipp:** für die Promotion bestehender `nur-live-link`-Stubs die Aufrufform
`npm run fedlex:eli -- --register=GRUPPE` bevorzugen — die zieht `r.key` korrekt
aus dem Register (`--register`-Zweig `.map((r) => ({ sr: String(r.sr), key: r.key }))`),
das Kürzel stimmt dann bereits.

**(b) Feld 5 (`art_1`):** `art_1` ist ein **Platzhalter-Startwert** (so im
`ok.push`-Gerüst und im Kopfkommentar «html-N=0 + pflicht-anker art_1 sind
Startwerte» von `fedlex-eli-aufloesen.ts`). Ersetzen durch die echten, **gegen
Fedlex verifizierten Pflicht-Anker** (kommagetrennt, Anker-Format `art_335_c`,
§7-Vollabdeckung). Beispiel-Pin OR: `…|art_11,art_32,art_77,art_104,…` (die
`or|…|220`-Zeile im `EINTRAEGE`-Array von `scripts/fedlex-cache.sh`). Diese Anker
prüft der Cache-Lauf per `grep -q "id=\"${a}\""` gegen das HTML.

**(c) 6. Feld (SR-Hauskonvention):** Die SR-Nummer als **sechstes Feld**
anhängen → `key|eli|YYYYMMDD|N|anker|SR` (Muster `…|art_11,…|220` in der
`or|…`-Zeile von `EINTRAEGE`). Das Feld ist **optional** und der HTML-Parser
nutzt es nicht (`scripts/normtext/inventar-bund.ts` destrukturiert nur die Felder
1–5: `const [name, eli, konsolidierung, htmlNStr, ankerStr] = teile`), aber das
Hausformat erwartet es **und** der Cache-Lauf fährt damit die
**SR-Identitäts-Sonde** (Erlass-Kollisions-Tor): er prüft die im HTML
eingebettete `<p class="srnummer">NNN</p>` gegen die erwartete SR (der
`srnummer`-grep im Prüf-Loop von `fedlex-cache.sh`). Diese Sonde fing am
25.6.2026 den VAG-Fall — `cc/2005/734/20240901` html-0 = Agrar-Einfuhr-VO
(SR 916.01), html-1 = VAG (SR 961.01); das `art_1`-Tor allein war blind dafür
(siehe der VAG-Kommentar bei der SR-Sonde in `fedlex-cache.sh`).

---

## `fedlex-cache.sh` — Zeilenformat & Tor-Mechanik

Das `EINTRAEGE`-Array in `scripts/fedlex-cache.sh` führt eine Pipe-getrennte
Zeile je Erlass:

```
name | eli | konsolidierung(YYYYMMDD) | html-N | pflicht-anker(kommagetrennt) | sr(optional)
```

- **`html-N`:** Suffix-Index der Filestore-Variante. **`N=0` → Datei OHNE
  `-N`-Suffix** (URL-Zusammensetzung im `for e in "${EINTRAEGE[@]}"`-Loop); bei
  Misserfolg probiert der Lauf `-1 … -5` automatisch durch (der Fallback-Loop
  «andere html-N-Varianten probieren»).
- **Grössen-Schwelle 20 kB** (`groesse -lt 20000` im selben Loop): kleinere
  Antworten sind SPA-Shell/Fehlerseiten (~9 kB) ohne Anker; der kleinste echte
  Cache ist GebV-HReg mit ~30 kB.
- Der Lauf gibt je Erlass `OK …` oder `FEHLER …` aus und endet mit **Exit 1**,
  wenn ein Anker fehlt oder die SR-Sonde anschlägt (der abschliessende
  `if [ "$fehler" -gt 0 ]; then … exit 1`).
- **Konsolidierungsdaten = die im Quellen-Register
  (`bibliothek/register/quellen-register.md`) dokumentierten, verifizierten
  Stände** — bei Rechtsänderung dort UND hier nachführen (Kopfkommentar
  «Konsolidierungsdaten = die im Quellen-Register … bei Rechtsänderungen dort
  UND hier nachführen»). **Künftige, noch nicht in Kraft stehende
  Konsolidierungen NICHT pinnen** (§7).

---

## JSON-Schema `NormSnapshot` (`src/lib/normtext/typen.ts`)

Ein Snapshot-Eintrag = **genau EIN Artikel** eines Erlasses, mit Provenienz
(`interface NormSnapshot` in `src/lib/normtext/typen.ts`). `stand`, `quelleUrl`,
`abgerufen` sind **Pflicht** (§7-Zitat-Ausnahme, kein Default). Feld-Belege
unten: reine Schema-Felder = die gleichnamige Property im `interface NormSnapshot`;
berechnete Werte verweisen auf die erzeugende Stelle in `scripts/normtext-snapshot.ts`.

| Feld | Typ | Bedeutung / Beleg |
|---|---|---|
| `id` | string | Stabiler Schlüssel `bund/OR/art_335_c` bzw. `kanton/BE/161.12/art_4`. Bund-Form `bund/${gesetzKey}/${ankerVoll}`, Kanton `kanton/${g.kanton}/${schluessel}/art_${token}` (beide als `id`-Zuweisung im jeweiligen Snapshot-Assembly von `normtext-snapshot.ts`). |
| `ebene` | `'bund' \| 'kanton'` | Property `ebene`. |
| `quelle` | string | Bund: Fedlex-Key (`OR`); Kanton: Kantonskürzel (`BE`). Property `quelle`. |
| `erlass` | string | Anzeige-Bezeichnung, Format `Volltitel, Kürzel (SR-Nr.)` (Funktion `erlassBezeichnung()` in `normtext-snapshot.ts`). |
| `artikel` | string | Token wie im Anker (`335_c`, `4`). Property `artikel`. |
| `artikelLabel` | string | Menschlich (`Art. 335c`, `§ 4`). Property `artikelLabel`. |
| `titel?` | string | Amtlicher Randtitel, falls vorhanden; Aufhebungs-Platzhalter «…» → Feld **weggelassen** (§7). Property `titel?`. |
| `grundlage?` | string | Delegationsnorm-Verweis «(Art. N ArG)» bei Verordnungen. Property `grundlage?`. |
| `bloecke` | Array | Absatz-/Marginalie-Blöcke in Reihenfolge (s. u.). Property `bloecke`. |
| `stand` | string | Konsolidierungs-/Fassungsdatum der Quelle (ISO). Property `stand`. |
| `quelleUrl` | string | Amtliche Live-URL mit Anker. Bund: `` `https://www.fedlex.admin.ch/eli/${eli}/de#${ankerVoll}` `` (`quelleUrl`-Zuweisung im Bund-Assembly). |
| `abgerufen` | string | Abrufdatum (ISO) = `--datum`. Property `abgerufen`. |
| `fassungsToken` | string | Drift-Token: Bund = Konsolidierung `YYYYMMDD` (`fassungsToken: konsolidierung` im Bund-Assembly); LexWork = `version_uid`; HTM/ZH/PDF = `quelleHash` (sha256 des Volltexts). Property `fassungsToken`. |
| `sha` | string | sha256 über Text **+ items + tabelle + mehrspaltig** (Funktion `sha256Bloecke()` in `normtext-snapshot.ts`) — Regressions-/Drift-Anker. Property `sha`. |

Eine **Snapshot-Datei** pro Erlass/Kanton: `{ erzeugt, eintraege: NormSnapshot[] }`
(`interface NormSnapshotDatei` in `typen.ts`).

### Block-Schema `bloecke[]` (Property `bloecke` in `interface NormSnapshot`)

```
{
  absatz: string | null,                       // '1','2','a','bis' … oder null
  text: string,                                 // Einleitungstext OHNE Listenpunkte
  items?:    Array<{ marke, text, tiefe? }>,    // lit./Ziff.-Aufzaehlung; marke nackt ('a','5a'); tiefe 0=direkt (weggelassen), 1+=verschachtelt
  tabelle?:  Array<{ beschreibung, betrag }>,   // Stufe 1: Fuellpunkt-Tarifzeilen
  mehrspaltig?: { kopf?: string[], zeilen: string[][] }  // Stufe 2: Mehrspalten-Tabelle (Streitwert/Grundgebuehr/Zuschlag)
}
```

- **Provenienz-Felder** (§7-Zitat-Ausnahme a–d): `stand` · `quelleUrl` ·
  `abgerufen` · `fassungsToken` · `sha` — alle fünf an jedem Eintrag.
- `titel` und `grundlage` fliessen **nicht** in den `sha` (golden-neutral — sie
  werden `sha256Bloecke()` gar nicht übergeben, vgl. den Kommentar «Artikel-level
  wie titel → NICHT im Block-sha» im Bund-Assembly); `items`, `tabelle`,
  `mehrspaltig` **schon** (`itemTeil`/`tabTeil`/`mTeil` in `sha256Bloecke()`) —
  eine gedroppte Tabellenzeile ist also drift-sichtbar.
- **Tabellen erhalten:** Mehrspalten-Tabellen MÜSSEN als `mehrspaltig`-Block
  (kopf/zeilen) erhalten bleiben, nicht als Fliesstext verschluckt; das ist die
  reale Bugklasse (vgl. `review.md`).

---

## Register-Eintrag (`src/lib/normtext/register.ts`)

`register.ts` ist die **Single Source of Truth für Identität + Taxonomie** —
**kein Normtext** (der lebt in den Snapshots, §5/§7). Felder von
`interface ErlassRegistereintrag` in `src/lib/normtext/register.ts`:

| Feld | Pflicht | Bedeutung |
|---|---|---|
| `key` | ja | == Snapshot-Datei-Stamm ohne `.json` (`OR`, `GEBV_SCHKG`, `BE-161.12`). |
| `ebene` | ja | `'bund' \| 'kanton'`. |
| `kanton?` | Kanton | Kantonskürzel. |
| `kuerzel` | ja | Anzeige-Kürzel (`OR`, `GebV SchKG`). |
| `titel` | ja | Volltitel. |
| `sr?` | Bund | SR-Nummer (`220`). |
| `rechtsgebiet` | ja | Sach-Achse (`privat`/`straf`/`prozess`/`oeffentlich`/`schkg`/`sozial-abgaben`/`international`, `type Rechtsgebiet` in `register.ts`). |
| `sprache` | ja | `'de' \| 'fr' \| 'it'`. |
| `rang` | ja | Sortiergewicht innerhalb (ebene, rechtsgebiet). |
| `status` | ja | `ErlassStatus` (s. u.). |
| `fedlexKey?` | Bund | FEDLEX-Schlüssel; hält `fedlex.ts` ↔ Register synchron (Tor). |
| `quelleUrl?` | nur `nur-live-link` | Pflicht bei status `nur-live-link`. |
| `stand?` | — | optional. |
| `pdfPfad?` | nur `pdf-embed` | Pfad zum gehosteten amtlichen PDF. |

**`ErlassStatus`** (`type ErlassStatus = 'snapshot' | 'pdf-embed' | 'nur-live-link'` in `register.ts`):
- `'snapshot'` — strukturierter Volltext-Snapshot (`public/normtext/.../KEY.json`).
- `'pdf-embed'` — amtliches PDF in-app eingebettet (kein extrahierbarer Volltext;
  das Angezeigte IST die amtliche Fassung, §7/§8, kein Extraktionsrisiko).
- `'nur-live-link'` — nur Link zur amtlichen Quelle (kein In-App-Text).

Neuer Bund-Snapshot → Eintrag über die `bund(key, kuerzel, titel, sr,
rechtsgebiet, rang, fedlexKey?)`-Helferfunktion in `register.ts`; fehlt der
FEDLEX-Schlüssel, wirft `bund()` schon beim Laden (`if (!(fk in FEDLEX)) throw …
FEDLEX-Schlüssel fehlt`). Das Anzeige-Kürzel (`erlass`) kommt ausschliesslich
aus dem `kuerzel` dieses Register-Eintrags (`bundKuerzelNachschlagen` in
`normtext-snapshot.ts`); ein Cache-Name ohne Bund-Register-Eintrag ist ein
Build-Fehler, kein Rückfall. Die frühere zweite Tabelle `ERLASS_MAP` ist seit
HN-04 (25.9.2026) gestrichen; `src/tests/normtext-bund-erlass-register.test.ts`
prüft «Snapshot-`erlass` = Register-Kürzel» über alle Bund-Dateien.

---

## Kanton — eigener Tor-Block

Die Bund-Tore reichen kantonal **nicht**. Der Struktur-Sidecar ist kantonal ein
**anderer** Befehl, und das Treue-Gate (`report:confidence`) tritt hinzu.

```
npm run normtext -- --nur=kanton --kanton=<KT> --discovery   # bzw. --nur=zh  (regeneriert nur die Ziel-Kantone)
npm run normtext:struktur-kanton -- --datum=$(date +%F)      # NICHT normtext:struktur (= Bund)
npm run report:confidence -- --schwelle=0.95 --schreibe       # Treue-Gate / Confidence-Quarantaene
npm run check:vollstaendigkeit                               # Kanton-Zitat-Abdeckung + Manifest-Konsistenz
npm run gate
```

Belege: alle Befehle sind npm-Scripts in `package.json` (`normtext`,
`normtext:struktur-kanton`, `normtext:struktur` [= Bund-Variante],
`report:confidence`, `check:vollstaendigkeit`, `gate`). Den `--nur=kanton`-Handler
trägt der Zweig `if (process.argv.includes('--nur=kanton'))` in `main()` von
`scripts/normtext-snapshot.ts` (verlangt `--kanton=XX[,YY]` via `throw '--nur=kanton
verlangt --kanton=XX[,YY]'`; `--discovery` — Zweig `if (discovery)` mit
`enumeriereKanton(…)` — enumeriert den Vollkorpus via LexFind statt nur
tarif-zitierter Erlasse); `--nur=zh` ist der Zweig
`if (process.argv.includes('--nur=zh'))` ebendort.

**Mechanik-Punkte:**
- `--nur=kanton` mischt den Golden-Index kanton-selektiv und **bewahrt den
  Altbestand fehlgeschlagener Kantone** (kein stiller Verlust, §8 — der
  `istErsetzbar`-Filter + die WARN-Ausgabe «Ziel-Kantone OHNE neue Snapshots …
  ihr Golden-Altbestand bleibt UNVERÄNDERT» im `--nur=kanton`-Zweig).
- **`report:confidence`** misst maschinell die Extraktions-**TREUE** zur Quelle —
  **nicht** die juristische Korrektheit (die bleibt Davids Abnahme, §7/§8). Flags
  in `scripts/normtext/check-confidence.ts`: `--schwelle=` (Default 0.95, via
  `Number(arg('schwelle') ?? '0.95')`), `--schreibe` (schreibt
  `public/normtext/confidence.json`, im `if (process.argv.includes('--schreibe'))`-Zweig),
  optional `--datum=`. Erlasse mit `score < Schwelle` landen in der
  **Quarantäne** = manueller Pflicht-Review; **Realität ~25–40 % Pflicht-Review**
  (LexFind-3-Tier-Strategie). Hohe Confidence hebt den Status **nicht** auf
  «geprüft» — Snapshot bleibt «entwurf», bis David abnimmt (§8).
- **`check:pdf` / `check:pdf-netz` gehören NICHT in den Kanton-Block.** Die prüfen
  die **internationalen** pdf-embed-Erlasse (`PDF_EMBED_QUELLEN` aus
  `src/lib/normtext/pdf-embed.ts`: EMRK/NYÜ), nicht die kantonale Tier-C-Spur.
  Kantonale pdf-embed-Quellen sind über `check:vollstaendigkeit`
  (Manifest-Konsistenz) abgedeckt.

---

## Verweise (kein Duplikat, §5)

- *Was/Warum* + fachliche Reihenfolge (Neuanlage / Update / kantonale 3-Tier-
  Spur) + §11-Wissensablage: `methodology/normtext.md`.
- Verifikations-Werkzeugkasten (`gate`/`gate:schnell`, `golden:diff`,
  `test:e2e`/`screenshots`, adversariale Gegenprüfung), Fehlerfall-Diagnosewege
  (§6.5): `tools/verifikation.md`.
- Adversariale Bugklassen (Anker/Zuordnung/Tabelle/«aufgehoben»/Tausendertrenner
  …): `review.md`.
- Grenzen: `CLAUDE.md` §2 (Determinismus), §5 (SSoT), §7 (Normen verifizieren),
  §8 (Status/Ehrlichkeit); `bibliothek/STANDARDS.md` S2/S5/S6/S8. Release →
  `landung`, fachliche Abnahme → `abnahme`. Diese Pipeline löst **weder
  Deploy noch Abnahme** aus.
