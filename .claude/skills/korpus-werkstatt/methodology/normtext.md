# Normtext — fachliche Reihenfolge

Die *fachliche* Reihenfolge, einen Erlass in den Volltext-Korpus zu bringen oder
ihn nach Drift neu zu pinnen — Bund (Fedlex) wie Kanton (LexFind). Diese Datei
sagt **was zu tun ist, in welcher Reihenfolge und warum**. Für das **wie** (exakte
Befehle, JSON-Schema, Editier-Stellen) ziehe beim jeweiligen Schritt
`tools/normtext-pipeline.md` in den Kontext — nicht vorab.

Verbindlicher Rahmen, der hier nicht dupliziert wird: `CLAUDE.md` §7 (Normen
verifizieren + Build-Regel Norm-Snapshots: Vollabdeckung, Aufzählungen
vollständig, geltende Fassung, Provenienz, Drift-Tor — Snapshots NIE von Hand
editieren), §2 (Determinismus: Datum immer `$(date +%F)` aus der Shell), §5
(Single Source of Truth: Snapshot/Register ist die eine Wahrheit), §8
(Status/Ehrlichkeit), §11 (Wissensablage). Status-Vokabular + Negativbefund-
Pflicht: `bibliothek/STANDARDS.md` S2/S5; Datiertes → S6.

## Zuerst: zielgerichtet oder offen?

- **Zielgerichteter Auftrag** → direkt zum relevanten Pfad, den Rest überspringen.
  - «verifizier Art. 335c OR» / «stimmt der Anker/Stand bei Erlass X?» → das ist
    KEINE Produktion: direkt `review.md` (+ `tools/verifikation.md`), nicht der
    Neu-Anlage-Flow unten.
  - «Erlass X ist veraltet / `check:fedlex-versionen` ist rot» → direkt zum
    **zweiten Pfad** «aktualisieren / neu pinnen» unten.
  - «Render-Bug bei Erlass X» (falsches «aufgehoben», Tausendertrenner, Tabelle
    verschmolzen) → `tools/verifikation.md` (Playwright/Screenshots via Bash) +
    die passende `review.md`-Bugklasse; Produktion überspringen.
- **Offener Auftrag** («nimm Bundeserlass Y in den Volltext auf») → die
  Default-Reihenfolge unten. Stop, sobald das Nötige steht — aber bei einer
  Neu-Produktion gehört der §14.4-Pflicht-Pass (adversariale Gegenprüfung) immer
  dazu, er ist nicht optional.

Bereich früh festlegen: **Ebene** (Bund / Kanton — verschiedene Pipelines, andere
Tore), bei Kanton **welcher Kanton**, und die **Quelllage** (Fedlex-Volltext vs.
kantonaler Tier A/B/C). Ist Ebene oder Erlass nicht eindeutig aus dem Auftrag
ableitbar → eine gezielte Rückfrage, bevor produziert wird (eine Fehlroute
riskiert verifizierte Kantons-Snapshots).

## Default-Reihenfolge — neuen Bundeserlass hinzufügen

**1 — ELI + geltende Konsolidierung auflösen.** `npm run fedlex:eli -- <SR-Nr>`
fragt den amtlichen Fedlex-SPARQL-Endpoint. *Warum zuerst:* «geltend» ist die
grösste `dateApplicability` ≤ heute — künftige, noch nicht in Kraft stehende
Fassungen werden NICHT gepinnt (§7 Build-Regel 3 — in `SKILL.md`; die Funktion
`loese()` in `scripts/fedlex-eli-aufloesen.ts`). Ohne die richtige Konsolidierung extrahiert alles
Folgende die falsche Fassung.

**2 — Editier-Stellen von Hand setzen (Identität ≠ Normtext).** Drei deklarierte
Pflicht-Stellen, kein Generator-Automatismus (`CLAUDE.md` §2: keine Heuristik):
`scripts/fedlex-cache.sh`-Zeile (der Pin), der `register.ts`-Eintrag (Identität +
Taxonomie), und — wenn der FEDLEX-Schlüssel vom `key` abweicht — der `fedlexKey`
samt `fedlex.ts`-Eintrag (der `fedlexKey` ist typisiert `FedlexGesetz`, ein neuer
Wert muss also im `FEDLEX`-Objekt `src/lib/fedlex.ts` existieren). Das
Anzeige-Kürzel (Snapshot-Feld `erlass`) ist das `kuerzel` desselben
`register.ts`-Eintrags — amtliche Abkürzung (Fedlex `titleShort`, Kurztitel oder
Ingress eines Ausführungsgesetzes), sonst ausdrücklich als Hand-Kürzel in
`bibliothek/recherche/fedlex-abkuerzungen-titleshort.md` geführt.
`scripts/normtext-snapshot.ts` liest es über `bundKuerzelNachschlagen`; fehlt der
Register-Eintrag, ist das ein **Build-Fehler**, kein Rückfall auf den `key`
(HN-04, 25.9.2026: die frühere zweite Tabelle `ERLASS_MAP` samt
Grossbuchstaben-Rückfall ist gestrichen; Wächter
`src/tests/normtext-bund-erlass-register.test.ts`). *Warum:*
Das Register ist Single Source of Truth für
Identität/Taxonomie (Kopfkommentar «Single Source of Truth für Identität +
Taxonomie» in `src/lib/normtext/register.ts`), nicht für den Normtext (der lebt
im Snapshot, §5). Das Register↔fedlex-Tor und das Tor «Register ⊇ Snapshots»
(`Tor 1` in `src/tests/normtext-register.test.ts`) brechen sonst.

**Wichtig — `fedlex:eli` liefert nur ein 5-Feld-GERÜST, keine fertige Zeile.** Vor
dem Einfügen in `scripts/fedlex-cache.sh` nachbearbeiten (exakt in
`tools/normtext-pipeline.md`):
- **Feld 1:** Bei der `<SR-Nr>`-Aufrufform steht dort die SR-Nummer selbst
  (`key=sr` — der Direkt-Argument-Zweig `args.map((sr) => ({ sr, key: sr }))` in
  `scripts/fedlex-eli-aufloesen.ts`). Auf das lowercase Erlass-Kurzkürzel ==
  Register-`key` setzen, sonst bricht Tor 1 (Register ⊇ Snapshots; ein blind
  eingefügter Output ergäbe Snapshot-id `bund/830.1/…` statt `bund/atsg/…`). Für
  die Promotion bestehender nur-live-link-Stubs die Aufrufform
  `npm run fedlex:eli -- --register=GRUPPE` bevorzugen — der nur-live-link-Zweig
  (`.map((r) => ({ sr: String(r.sr), key: r.key }))` in
  `scripts/fedlex-eli-aufloesen.ts`) setzt `r.key` korrekt.
- **Feld 5 (`art_1`):** Platzhalter-Startwert → durch die echten, gegen Fedlex
  verifizierten Pflicht-Anker ersetzen (§7 Vollabdeckung).
- **6. Feld:** SR-Nummer als Hauskonvention anhängen; der Parser nutzt sie nicht.

**3 — Cache laden + Pflicht-Anker/SR-Sonde.** Den Fedlex-Cache ziehen und die
Sonde laufen lassen. *Warum:* Sie schützt vor zwei realen Fehlklassen — der
leeren SPA-Shell (Filestore liefert nur das App-Gerüst statt Inhalts-HTML) und
der Erlass-Kollision (eine SR-Nummer löst auf den falschen Text auf). Schlägt die
Sonde an → Quarantäne, Identität in `register.ts`/`fedlexKey` klären, erst dann
weiter.

**4 — Snapshot generieren mit `--nur=bund`.** `npm run normtext -- --nur=bund
--datum=$(date +%F)`. *Warum der Filter:* `--nur=bund` überspringt die
kantonalen Phasen (LexWork/ZH/HTM/PDF) und mischt den Golden-Index — die
bestehenden kantonalen Einträge bleiben unangetastet, nur `bund/*` wird ersetzt
(der `--nur=bund`-Zweig `if (process.argv.includes('--nur=bund'))` in
`scripts/normtext-snapshot.ts`). Ohne den Filter würden verifizierte
Kantons-Snapshots erneut über das Netz gezogen und riskiert. Es gibt KEINEN
Per-Erlass-Filter — `--nur=bund` regeneriert alle Bund-Snapshots aus der
gepinnten `cache.sh`.

**5 — Struktur-Sidecar, Browse-Register, Such-Index nachziehen.**
`normtext:struktur`, `normtext:register`, `gen:suchindex`. *Warum:* Der Snapshot
allein ist noch nicht auffindbar — das Browse-Manifest (Rubrik «Gesetze») und der
Such-Index müssen den neuen Erlass kennen, sonst existiert er im Korpus, aber
nicht in der UI.

**6 — Tore grün ziehen + DoD-Abschluss.** `check:fedlex-versionen`,
`check:normtext`, `check:suchindex`, `gate` (Befehlskette in
`tools/normtext-pipeline.md`). «aufgehoben»/Geltung wird auf **Snapshot-Ebene**
behandelt, nicht im Register (der Status «aufgehoben» bleibt sichtbar, die
Zitatzeile erscheint auf Klick). **DoD ist mehr als grüne Tore** (§14.4/§14.5 —
Skill `auftrag`, Ziff. 4/5):
- Pflicht-Gegenprüfung gelaufen — eine Bund-Neu-Extraktion (`public/normtext/**/*.json`,
  `scripts/normtext-snapshot.ts`, `scripts/fedlex-*`) ist ein Risiko-Pfad, die
  adversariale Gegenprüfung ist verpflichtend, nicht auf Abruf; das Tor
  `check:gegenpruefung` erzwingt sie (Muster `AUDIT-TARIF-…md`, siehe
  `tools/verifikation.md`).
- Status-Marker §8 gesetzt — «verifiziert»/«geprüft» NIE automatisch (Zeitsperre
  bis 1.12.2026, Status-Hebung nur über den `abnahme`-Skill).
- §14.5-Trailer am Commit: `Roadmap: <ID>` + auf dem Risiko-Pfad
  `Gegenpruefung: <Verdikt> (<Modell>, <Linsen>) — <Befunde>`.
- Bei rotem Tor: kein Push, keine Übergabe an `landung`.

**7 — §11 Wissensablage (Pflicht, `CLAUDE.md` §11).** Den produzierten Erlass in
einer kurzen `bibliothek/`-Liste eintragen und in `bibliothek/INDEX.md`
verlinken — mit den §11-Pflichtfeldern: **Quelle + Stand**,
**Geltungsbereich/Ausnahmen**, **Pflegebedarf** (datierte Konsolidierung →
Verfallsregister-Kandidat, S6), **Abnahme-Status** (Erstrecherche / zweifach
geprüft / durch David abgenommen). *Warum kein Duplikat (§5):* Snapshot/Register
bleibt Single Source of Truth — die `bibliothek/`-Liste ist der indexierte Zeiger
+ Provenienz + Abnahme-Status, nicht eine zweite Kopie der Snapshot-Daten.

## Zweiter Pfad — bestehenden Bund-Erlass aktualisieren / nach Drift neu pinnen

Kein voller Parallel-Flow; die meisten Schritte teilen sich mit der
Default-Reihenfolge. Der Unterschied: kein neuer Register-Eintrag, ein engeres
Tor.

**1 — Drift erkennen.** `npm run check:fedlex-versionen` (Exit 1 = die gepinnte
Konsolidierung ist überholt). *Warum:* Dieses Tor ist der Currency-Arbiter — der
ELI-Resolver allein kann veraltete Daten liefern, das Versionen-Tor ist die
verbindliche Drift-Quelle.

**2 — Nur das Datum-Feld bumpen.** In `scripts/fedlex-cache.sh` **nur das
`YYYYMMDD`-Feld der bestehenden Zeile** des Zielerlasses aktualisieren — KEIN
neuer `register.ts`-Eintrag, kein neues `kuerzel`/`fedlexKey`. `npm run fedlex:eli --
<SR-Nr>` liefert die frische Zeile zum Abgleich. *Warum:* Identität und Taxonomie
ändern sich bei einem reinen Stand-Update nicht — nur die geltende Fassung.

**3 — Bund regenerieren.** `npm run normtext -- --nur=bund --datum=$(date +%F)`.
*Warum kein Per-Erlass-Filter:* Es existiert keiner; `--nur=bund` regeneriert ALLE
Bund-Snapshots aus der gepinnten `cache.sh` (die einzigen Nur-Filter sind
`--nur=bund`/`--nur=zh`/`--nur=kanton`, je ein `process.argv.includes(...)`-Zweig
in `scripts/normtext-snapshot.ts`). Das ist unkritisch, weil die übrigen Pins
unverändert sind → ihre Snapshots fallen byte-gleich aus.

**4 — Update-Tor «nur Ziel geändert».** `git diff --stat public/normtext/bund/`
MUSS genau die Datei(en) des Zielerlasses zeigen; die übrigen `bund/*`-Snapshots
bleiben byte-gleich (ihre `cache.sh`-Daten sind unverändert). Der vom
`--nur=bund`-Zweig neu geschriebene Byte-Index `golden/normtext-snapshot.json`
(`writeFileSync(goldenPfad, …)` in `scripts/normtext-snapshot.ts`) beweist, dass nur die sha-Einträge des Ziels
wechseln. *Warum NICHT `npm run golden:vergleich`:* Das prüft den Engine-Golden
(`golden/lexmetrik-golden.json`), nicht den Normtext-Index — falsches Tor für
diesen Pfad.

**5 — Tore + DoD.** `npm run check:fedlex-versionen && npm run check:normtext &&
npm run gate` grün, dann DoD-Abschluss wie oben Schritt 6/7 (Gegenprüfung nur,
falls die Extraktion sich inhaltlich änderte; reines Stand-Bump ohne
Body-Änderung → `Gegenpruefung: n/a — reine Prüflogik`). §11-Ablage-Eintrag auf
den neuen Stand aktualisieren.

## Kantonale Spur (LexFind, Tier A/B/C)

Kantonale Erlasse haben eine **eigene Pipeline und eigene Tore** — die
Bund-Schritte reichen kantonal nicht (u.a. ist der Struktur-Sidecar kantonal
`normtext:struktur-kanton`, nicht `normtext:struktur`). Mechanik im
Kanton-Tor-Block von `tools/normtext-pipeline.md`.

**Quellen-Klassifikation (Tier A/B/C).** Die LexFind-Discovery klassifiziert je
Quelle in:
- **Tier A-struktur** — LexWork/clex-API liefert strukturierten Text →
  `adapter-lexwork`. Höchste Treue.
- **Tier B-pdf** — amtliches PDF, layout-extrahierbar → `adapter-pdf` (pdfjs,
  Body-Spalten-x, §7 Build-Regeln in `SKILL.md` + `bibliothek/normen/`-Profil).
- **Tier C-pdf-embed** — keine verlässliche Extraktion möglich → das amtliche
  Original einbetten (das Angezeigte IST die amtliche Fassung, §8, kein
  Extraktionsrisiko).

Adapter-Priorität: **LexWork → HTM → HTML → PDF → Live-Link** (§7 Quell-Wahl, in
`SKILL.md`).
*Warum:* je strukturierter die Quelle, desto treuer die Extraktion und desto
kleiner das Render-Risiko (Tabellen-Drop, Spaltenmerge).

**Treue-Gate (Verifikations-Mandat).** `npm run report:confidence`
(`confidence-logik.ts`) misst **maschinell die Extraktions-TREUE zur Quelle** —
NICHT die juristische Korrektheit (die bleibt Davids Abnahme, §7/§8) — über
Min-Score + harte Vetos. Hohe Confidence → Snapshot bleibt Status «entwurf» (NIE
«geprüft»/«verified» ohne David, §8). Unter der Schwelle → Quarantäne-Liste bzw.
ehrlicher Tier-C-pdf-embed-Fallback (§8 statt erfundener Werte).

**Realität: ~25–40 % Pflicht-Review bleiben** (LexFind-Dossier). `report:confidence`
filtert maschinell vor, der Mensch prüft nur Erlasse mit score < Schwelle — der
«0-Check»-Import ist unerreichbar. Der §11-Ablage-Schritt (oben Schritt 7) gilt
für kantonale Erlasse analog, mit dem Abnahme-Status ehrlich auf «Erstrecherche».

## Auseinanderhalten (die häufigsten Normtext-Fehler)

- **Identität vs. Normtext** — `register.ts` (welcher Erlass, welche Taxonomie)
  vs. Snapshot (der Text). Nie das eine ins andere mischen (§5).
- **Anker-Existenz vs. richtige Zuordnung** — dass `art_335_c` existiert, heisst
  nicht, dass er am richtigen Erlass hängt (SR-Nr + `fedlexKey` gegenprüfen).
- **Stand-Drift vs. Quellen-Kollision** — überholte Konsolidierung (gleiche
  Quelle, alt) vs. die Quelle liefert einen fremden Erlass (SPA-Shell /
  Erlass-Kollision). Verschiedene Fehler, verschiedene Fixe (siehe `review.md`).
- **Geltende vs. künftige Fassung** — nur die grösste `dateApplicability` ≤ heute
  pinnen, nie eine künftige (§7).

## Mitnehmen

Festhalten: SR-Nr + ELI + gepinnte Konsolidierung, die geänderten
Editier-Stellen (`cache.sh`/`register.ts`), die durchlaufenen Tore mit Status, das
Gegenprüfungs-Verdikt (Risiko-Pfad) und den §11-Ablage-Eintrag mit
Abnahme-Status. Übergabe an `landung` (Release) bzw. `abnahme` (fachliche
Abnahme) — dieser Skill löst weder das eine noch das andere aus.
