# Rechtsprechung — Korpus erweitern (fachliche Reihenfolge + Warum)

Die fachliche Reihenfolge, um den Rechtsprechungs-Korpus (`public/rechtsprechung/`)
zu erweitern oder nachzuziehen. **Hier steht nur Reihenfolge + Warum** — die
exakten Befehle, Flags, das Snapshot-Schema und die OCL-Quirks leben in
`tools/rechtsprechung-pipeline.md`; ziehe diese Datei erst, wenn du den jeweiligen
Schritt fährst (nicht vorab). Snapshots werden **nie von Hand editiert**, nur über
den Generator `scripts/normtext-entscheide.ts` (§7, Build-Regel).

## Zuerst: zielgerichtet oder offen?
**Zielgerichtet** («hol den BGE zu X», «nimm die neuesten BVGer-Urteile auf»,
«ergänze Gericht Y») → springe direkt in den passenden Zweig unten, ergänze
**additiv** und stoppe, sobald der Bestand das Verlangte enthält. **Offen**
(«bau den Korpus aus», «mehr Leitentscheide») → wähle den Zweig nach Zielkorpus
und fahre den Lauf bis zum DoD-Abschluss. Keine starre Pipeline — stoppe, sobald
das Nötige erreicht ist.

## Zweigwahl
Der Generator hat vier Quell-Zweige (jeder eine eigene `--`-Flag-Gruppe; Details
in `tools/rechtsprechung-pipeline.md`). Wähle nach dem, was in den Korpus soll:

1. **Bund — Citation-Graph-BFS** (Default, ohne Extra-Flag; `--seeds=…`,
   `--limit=…`). Tiefer, regeste-reicher Bundesgerichts-Bestand über den
   Zitiergraphen ab Seeds — *listing-unabhängig*, weil der BFS auch ohne
   erreichbares Listing trägt.
2. **BGE-Leitentscheide** (`--bge-von=YYYY-MM-DD`, `--bge-limit=…`). Aktiviert den
   amtlichen Leitentscheid-Zweig (BGE-Sammlung) mit angereichertem Volltext-Merge.
   Nur amtliche BGE bekommen den Leitcharakter (§8, harte Invariante unten).
3. **Kantone** (`--courts=zh_obergericht,be_verwaltungsgericht,…`,
   `--kanton-pro=…`). Je kantonalem Gericht ein Listing → keyed Detail (de). Kein
   BFS — der kantonale Zitiergraph führt nicht zu bger; `/structure` ist Bund-only,
   kantonal greift der ehrliche Fliesstext-Fallback (§8).
4. **Eidg. Gerichte** (`--eidg=bvger,bstger,bpatger`, `--eidg-pro=…`). Die drei
   weiteren eidg. Gerichte als eigener OCL-Zweig, je Gericht die N neuesten Urteile.
   **Kein** BGE/Leitentscheid-Status (`bgeReferenz` bleibt null → `leitcharakter`
   `routine`).

## Vollbau vs. `--additiv`
- **Vollbau** (ohne `--additiv`): vereint die angeforderten Zweige, dedupt global
  und **überschreibt** den Korpus. Nutzen, wenn der gesamte Bestand aus den Quellen
  neu gezogen werden soll.
- **`--additiv`**: lädt den committeten Bestand **byte-treu von der Platte**
  (`ladeBestandSnapshots`) und ergänzt nur die frisch geholten Zweige — er zieht die
  bestehenden BGE/Bund/Kanton **nicht** über die Live-API neu (§6: kein
  Bestand-Drift). Das ist der Default für jede gezielte Ergänzung (z. B. neue
  eidg. Gerichte, `--bge-refresh` gekappter BGE). Ohne `--additiv` würde der
  bestehende Korpus überschrieben.
- **Leer-Guard (§6):** Wurden Quellen angefordert, aber nichts geholt (OCL down),
  bleibt der Korpus **unberührt** statt entwertet. Ein leeres Ergebnis ist ein
  Negativbefund, kein leerer Schreiblauf (STANDARDS S5) — Lauf abbrechen, nicht
  halben Korpus schreiben.

## Warum — die tragenden Invarianten
Diese vier prüfst du nach jedem Lauf (sie sind zugleich review.md-Bugklassen):

- **Leitentscheid ⟺ BGE-Referenz** (harte Invariante, §8). «Leitentscheid» ist nur
  ein amtlicher BGE mit `bgeReferenz`. Bund/Kanton/eidg. ohne BGE-Referenz bleiben
  `routine` — kein Routine-Entscheid darf als Leitentscheid auftreten und umgekehrt.
- **Dedup BGE-kanonisch.** Beim Vereinen steht BGE **zuerst**, ist also bei
  id-Kollision die kanonische Quelle; ein bger-Urteil, das bereits als
  BGE-Volltext erfasst ist, wird **nicht** zusätzlich als Routine-Eintrag geführt
  (sonst derselbe Entscheid doppelt als Leit- UND Routine). Zusätzlich die
  aza-Kollisions-Quarantäne: griff dieselbe aza-id für zwei BGE, werden **beide**
  auf Auszug zurückgestuft (§8 — nie ein potenziell falscher Volltext unter einem
  Leitentscheid).
- **Norm-Index nur Bundesgericht** (§8). In den Norm-Index (Verzahnung Entscheid ↔
  Norm) gehören nur Bundesgerichts-Entscheide — kein Kantons-/eidg.-Entscheid darf
  hineinlecken. Bei der Verifikation gegenprüfen.
- **Sprache aus dem Body ableiten.** `sprache` kommt aus dem Urteilstext, nicht aus
  einem (oft falschen) OCL-Label — Bund/eidg. werden mit `sprache: null` geholt
  (FR/IT-lastig) und der Body entscheidet; Kantone keyed mit `sprache: 'de'`. Ein
  Sprach-Mislabel ist eine reale Bugklasse (review.md).

## DoD-Abschluss (nach Zweigwahl/Vollbau — Pflicht)
Nicht nur «Tore grün», sondern die volle Definition of Done (§14.4):
1. **Integritäts-Tor** `npm run check:entscheide` (BUDGET_MB-Deckel) + `npm run gate`
   grün; Tor-Status pro Schritt notiert.
2. **Pflicht-Gegenprüfung (§14.4).** Der Entscheid-Generator
   `scripts/normtext-entscheide.ts` ist ein Risiko-Pfad (die reinen
   `public/rechtsprechung/**`-Outputs sind es nicht) → die adversariale Gegenprüfung
   ist **verpflichtend**, nicht auf Abruf. Das Tor `check:gegenpruefung` erzwingt sie
   allerdings nur bei Diffs am Generator `scripts/normtext-entscheide.ts`, nicht bei
   Output-only-Diffs (`public/rechtsprechung/**`) — dort die Pflicht-Gegenprüfung
   dennoch fahren.
   Linsen: die vier Invarianten oben + die OCL-Quirk-Liste aus
   `tools/rechtsprechung-pipeline.md` + **Zuordnung inhaltlich**: Stichprobe der
   `normKeys` neuer Einträge (Kürzel → Erlass) gegen die DE-Regeste, gezielt auf
   sprachübergreifende Homonyme (Beleg #1099, 25.9.2026: fr. «AIMP» = IVöB lief als
   it. «AIMP» = IRSG — neun Beschaffungs-BGE unter dem IRSG, sieben davon schon live;
   Runde 1 hatte nur Determinismus/Verdrängung geprüft). Davon getrennt der user-getriggerte
   `review.md`-Audit («prüf das») — das ist **nicht** dieser Pflicht-Pass.
3. **Status-Marker (§8)** gesetzt — `verifiziert`/«geprüft» **nie automatisch**
   (Zeitsperre bis 1.12.2026; Status-Hebung nur über den `abnahme`-Skill).
4. **§14.5-Trailer** am Produktions-Commit: `Roadmap: <ID>` und auf diesem
   Risiko-Pfad zusätzlich
   `Gegenpruefung: <Verdikt> (<Modell>, <Linsen>) — <Befunde>`.

## §11 Wissensablage (Pflicht)
Die Übersichtsliste für Rechtsprechung ist die **generierte**
`bibliothek/rechtsprechung/bge-register.md` (Generator-Befehl in
`tools/rechtsprechung-pipeline.md`) — nach dem Lauf neu erzeugen, nicht von Hand
pflegen. Zusätzlich in `bibliothek/INDEX.md` verlinken, mit den §11-Pflichtfeldern:
**Quelle + Stand** (amtliche OCL/entscheidsuche-Herkunft, Build-Datum),
**Geltungsbereich/Ausnahmen** (Gerichtskreis, Sprach-/Bestand-Grenzen),
**Pflegebedarf** (datierter Bestand → Verfallsregister-Kandidat, STANDARDS S6) und
**Abnahme-Status** (Erstrecherche / zweifach geprüft / durch David abgenommen).
**Kein Duplikat der Snapshot-Daten (§5):** Register/Snapshot bleibt Single Source
of Truth, die `bibliothek/`-Liste ist nur der indexierte Zeiger + Provenienz +
Abnahme-Status.
