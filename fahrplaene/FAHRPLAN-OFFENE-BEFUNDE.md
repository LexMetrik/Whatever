# FAHRPLAN — Offene Befunde ohne eigenen Strang-Fahrplan

**Zweck.** Fünf Dach-Schritte der ROADMAP hatten bis zum Plan-Neuschnitt vom 29.8.2026 keinen
eigenen Fahrplan und trugen ihre Befundlisten deshalb IM Plan — teils als einzelne Zeilen von
mehreren Kilobyte. Diese Datei ist ihre Detailquelle: die Listen stehen hier **wörtlich** so, wie
sie in ROADMAP.md standen, mit ihren Belegen und Daten. In der ROADMAP steht seither je Schritt nur
noch Ziel, Grenze und ein Zeiger hierher.

**Belege altern nicht.** Datierte Mess- und Reproduktionsangaben in dieser Datei werden nie an einen
neuen Ist-Stand «nachgeführt», nur ergänzt. Wer eine Position abarbeitet, hakt sie in ROADMAP.md ab
und trägt das Ergebnis in ROADMAP-CHRONIK.md nach.

---

## §1 — `QS-KORPUS` · Korpus-Pflege: fehlende und fehlerhafte amtliche Substanz

Dach-Schritt (Fusion 15.8.2026) für die offenen Reparaturen an Normtext- und
Rechtsprechungs-Korpus. **Jede Zeile liegt auf dem Risikopfad** (Extraktion/Korpus,
`istRisikoPfad()`) ⇒ **Gegenprüfung Pflicht**, amtlicher Beleg mit Norm + Link + Stand (§7),
Korrektur nie in der Projektion, immer in der Pipeline-Quelle (§5); je Zeile eine sortenreine
Bau-Einheit.

Wörtlich aus ROADMAP.md (Stand 29.8.2026):

  · [x] **`adapter-lexwork.ts:778` Fetch-Ergebnis unvalidiert** — `Response.json()` liefert unter `lib: DOM` `any`; Shape vor Verwendung prüfen (Nebenfund QS-TYP-LUECKE 15.8., Gegenprüfungs-Auflage A1; Risikopfad Extraktion ⇒ QS-GP) — ✅ erledigt 12.9.2026, PR #813 (`af5e35ce9`): Laufzeit-Validierung `validiereTextOfLaw()` statt Compile-Cast, Nullprobe mit drei vorher rot laufenden Tests; Gegenprüfung ausstehend, noch nicht gemergt. Wortlaut: ROADMAP-CHRONIK.md.
  · [x] **Geltende BMV in den Korpus aufnehmen** — die seit 1.3.2026 geltende Nachfolge-Verordnung (Totalrevision `cc/2025/408`, gleiche SR 412.103.1) fehlte; Nutzer fanden nur den historischen Text. **Risikopfad** ⇒ Gegenprüfung. (fusioniert 15.8., vormals `QS-KORPUS-BMV`; Fahrplan: [FAHRPLAN-FEDLEX-PORTFOLIO.md](fahrplaene/FAHRPLAN-FEDLEX-PORTFOLIO.md) §20.4) — ✅ erledigt 12.9.2026: geltender Text als **neuer Register-Key `BMV_2025`** (Pin `bmv_2025|cc/2025/408|20260301|0|art_1,art_34,art_36|412.103.1`, html-N kanonisch via `isExemplifiedBy`), historischer Text bleibt unter `BMV` mit Aufhebungs-Marker. Belege + Schlüssel-Entscheid + SR-Kollisions-Wurzelfix: `bibliothek/register/bmv-totalrevision-2026-09-12.md`; Wortlaut ROADMAP-CHRONIK.md. Gegenprüfung ausstehend, noch nicht gemergt.
  · [x] **scope/decl-Sektionen von 12 Staatsverträgen ingestieren** — 23 amtliche Sektionen liegen ausserhalb des `div#annex`-Containers und fehlen im Snapshot. **Risikopfad** ⇒ Gegenprüfung; golden-Diff erwartet (neue amtliche Substanz). (fusioniert 15.8., vormals `QS-KORPUS-SCOPE`; Fahrplan: [FAHRPLAN-FEDLEX-PORTFOLIO.md](fahrplaene/FAHRPLAN-FEDLEX-PORTFOLIO.md) §19) — **erledigt 12.9.2026, PR #838 (`87db8a514`):** Vollerhebung 228 Caches (136 nur `div#annex`, 26 nur `div#scope`, 14 beide, 12 nur scope) → 23 nicht erfasste `scope_*`/`decl_*`-Sektionen in 12 Staatsverträgen (CEDAW, CISG, EAUE, HBEWUE, HUVUE, KRK, MONTREAL, PVUE, UNO_ANTIFOLTER, UNO_BRK, UNO_PAKT_I, UNO_PAKT_II); Golden 60 347→60 370, 0 Drops. Gegenprüfung bestanden (Sonnet, Bau Opus): eigener Census 228 Caches 136/26/14/12, 23/23 h1 == Label, Live-Stichprobe 3 Erlasse byte-gleich — keine Blocker. Nebenfund: Leser-Wurzel für scope/decl heisst synthetisch «Anhänge» → eigener Schritt PR #840 (offen, noch nicht gemergt).
  · [x] **Entscheid-Datumsfehler im Rechtsprechungs-Register bereinigen** — `bge_151_II_475` trug 1999 statt 2025; Datum gegen bger.ch verifiziert, in der Pipeline-Quelle korrigiert (nie im Projektions-JSON, §5), Register-Sweep nach weiteren Band/Jahr-Diskrepanzen durchgeführt, Projektion neu erzeugt. **Risikopfad** ⇒ Gegenprüfung. (fusioniert 15.8., vormals `QS-KORPUS-RSPR-DATUM`; Fahrplan: [FAHRPLAN-RECHTSPRECHUNG.md](fahrplaene/FAHRPLAN-RECHTSPRECHUNG.md)) — **erledigt 12.9.2026** (Fund W2·18-FEHLERBUCH): Wurzel war NICHT im Adapter (`adapter-entscheide.ts` trägt die Bandjahr-Korrektur bereits seit 5.7.2026, ec5ac2211), sondern im Refresh-Orchestrator `normtext-entscheide.ts` — der B1-Zweig von `--regeste-refresh` verwarf ein frisch geholtes Auszug-only-Ergebnis (`azaUrteil:null`) und liess dadurch den alten Fehlwert stehen; zusätzlich fehlte dort die clir-Kopf-Datumsanreicherung, die `--bge-baender` schon nutzt. Amtlich verifiziert (bger.ch clir + aktuelle OCL-`decision_date`): Urteil 2C_64/2023 vom 26.11.2024 (nicht 1999-06-21 = Datum des in der Regeste zitierten Luftverkehrsabkommens). Fix: Orchestrator übernimmt jetzt jedes erfolgreich geholte B1-Ergebnis (auch Auszug-only) + holt kopf.datumFallback wie im Band-Nachzug; neues Dauer-Tor `check:entscheide` (Bandjahr-Plausibilität, Fenster wie aza-Resolver: Bandjahr−Jahr>5 ⇒ FEHLER) gegen Wiederkehr. Vollerhebung (Skript, ganzer BGE-Bestand 1259 Einträge): 1 Treffer — nur dieser Fund; nach dem Fix 0 Treffer. **Präzisierung Gegenprüfung 12.9.2026 (A1/A2, PR #816):** «Register-Sweep durchgeführt» hiess nur das Fenster-Tor (Bandjahr−Jahr(datum) > 5 ⇒ FEHLER) — dieses Fenster ist BLIND für den Bandjahr-Platzhalter (`<Bandjahr>-01-01`, diff ≤ 5, sieht plausibel aus) und hätte einen zweiten Fehlerkanal nicht gefangen: der B1-Zweig übernahm ein frisches Ergebnis unbedingt, auch wenn eine Netzstörung beim clir-Fetch den Kopf zu `null` degradierte und dadurch ein bereits EXAKTES Bestandsdatum durch den Platzhalter ersetzt hätte (A1-Fix: `verschlechtertDatum`, nie ein plausibles Bestandsdatum abwerten; neuer Unit-Test `entscheid-bandjahr.test.ts`). A2 — gezielter Nachlauf für die 5 damals im B1-Log als «weiterhin Auszug» geführten BGE, amtlich verifiziert (bger.ch clir + OCL, Abruf 12.9.2026): `151 I 73` → 2C_248/2023 vom 20.9.2024 (voll aufgelöst) · `151 II 710` → 2C_46/2023 vom 25.2.2025 (voll aufgelöst) · `151 III 336` → 4A_527/2024 vom 18.12.2024 (Datum gehoben, Auszug bleibt — der aza-Kandidat selbst ist kürzer als der amtliche Auszug, Inversions-Schutz §8, plus abweichendes OCL-decision_date des Kandidaten) · `152 V 20` → 9C_121/2024 vom 23.6.2025 (voll aufgelöst, vorher fälschlich mit 152 V 2 kollidiert) · `152 V 2` → **neuer, tieferer Befund**: OCLs EIGENER Basis-Record `bge_152 V 2` (nicht nur die aza-Auswahl) ist bei `full_text`, `docket_number_2` UND `decision_date` vollständig mit `bge_152 V 20` konfliert (live gegen OCL geprüft: liefert wörtlich den Urteilskopf von 152 V 20 unter dem 152-V-2-Schlüssel) — nur `docket_number` und `regeste` sind korrekt; auf den ehrlichen Bandjahr-Platzhalter (2026-01-01) zurückgestuft, Content-Korrektur bleibt offen (kein Wurzel-Fix in diesem PR, §5-konform nichts geraten).
  · [x] **`bge_152_V_2` — OCLs Basis-Record selbst konfliert, nicht nur die aza-Auswahl** — `mcp.opencaselaw.ch/api/decisions/bge_152%20V%202` liefert `full_text`, `docket_number_2` UND `decision_date` von `bge_152 V 20` (live geprüft: Urteilskopf-Text beginnt wörtlich «152 V 20 … 9C_121/2024 vom 23. Juni 2025»); nur `docket_number` («152 V 2») und `regeste` sind bei der Quelle korrekt. Das bestehende Kollisions-Quarantäne-Muster (`aufAuszugZurueck`) schützt nur vor einer falschen aza-ZUORDNUNG — hier ist der BASIS-Record selbst (vor jeder aza-Wahl) bereits falsch, kein bestehender Mechanismus fängt das ab. **Risikopfad** ⇒ Gegenprüfung. — **Body-Quarantäne erledigt 12.9.2026 (C1, PR #816):** der Fund wurde durch das korrekte Datum (2026-01-29, A3) gefährlicher — der Leser zeigte «BGE 152 V 2 vom 29.1.2026» mit dem Sachverhalt eines fremden Urteils. `abschnitte`/`rubrum`/`zitierteNormen`/`dispositivOrders` genullt, neues Feld `quarantaene: 'ocl-konflation-152-V-20'` gesetzt (`EntscheidSnapshot`, additiv, `src/lib/rechtsprechung/typen.ts`); `regeste` bleibt (separat verifiziert korrekt, deckt sich mit dem amtlichen it-clir-Auszug). UI: `EntscheidBody.tsx` rendert leere `abschnitte` bereits ehrlich («Für diesen Entscheid liegt kein erfasster Text vor — massgeblich ist die amtliche Fassung»), kein Component-Eingriff nötig. Neuer korpusweiter Wächter `findeFremdeFundstelleImBody` (`scripts/normtext/entscheide-koerper-konflation.ts`, unit-getestet): der amtliche Druck trägt an jedem Seitenumbruch den laufenden Kopf «BGE Band Abt Nr S. Seite» — trägt der Body denselben Band, aber eine ANDERE Nummer, ist der Body fremd (legitime Zitate ÄLTERER Bände bleiben unberührt). Rot-Beweis erbracht (exakt der eine Treffer, exit 1), Vollerhebung: korpusweit einziger Treffer bleibt 152_V_2, 0 nach dem Fix.

---

**Nebenfunde Nacht 5.9.2026 (Gegenprüfungen #679/#691/#694/#695):**
- [x] **§17 /tmp-HTML-Cache invalidiert nicht bei Re-Pin** — `struktur-run.ts:61` refetcht nur bei Abwesenheit, `normtext-snapshot.ts:387` nur bei <20 KB; Generator stempelt neuen `fassungsToken` auf alten Text (Beleg DBG #695). Wurzel: Cache-Schlüssel um fassungsToken/html-N. Dazu (§6.7): `check-struktur-konsistenz.ts` vergleicht nur Artikel-Keys, nicht `stand`/`fassungsToken`. — ✅ erledigt 12.9.2026, PR fix/strukturfilter: statt eines Cache-Schlüssel-Umbaus (invasiv, ausserhalb Whitelist) wurde die bereits gebaute Pin-Identitäts-Sonde (`cache-pin-befund.ts`, Gegenprüfung #808) auf die drei restlichen Konsumenten ausgeweitet, die den /tmp-Cache bisher nur mit `existsSync` lasen: `struktur-run.ts` (neue `cacheGueltig()`, inkl. Pin-Nachzug nach dem Fetch — ohne den hätte KEIN Cache je wieder als gültig gegolten, im ersten Testlauf selbst rot erlebt), `check-vollstaendigkeit.ts:392`, `check-p-klassen.ts:106`. §6.7-Ast ergänzt: `standDriftBefund()` in `check-struktur-konsistenz.ts` vergleicht zusätzlich `stand`/`fassungsToken` (additiv wie `kl`, ältere Sidecars ohne die Felder werden nicht rückwirkend rot); `struktur-run.ts` stempelt die Felder ab sofort neu. Wortlaut: ROADMAP-CHRONIK.md.
- [x] **`normtext:struktur` ohne Erlass-Filter** — je Lauf 227 `erzeugt`-Felder (Churn); `--nur=<key>` analog `--nur=bund`. — ✅ erledigt 12.9.2026, PR fix/strukturfilter: `--nur=<KEY[,KEY2]>` (analog `struktur-kanton-run.ts`/`revisionen-generieren-run.ts`) — Nullprobe belegt: Breitband-Lauf berührt 227 Dateien, `--nur=OR` genau eine. Churn-Wurzel zusätzlich behoben: `sollSchreiben()` (reuse `istReinerDatumsChurn`, churn-reset.ts) stempelt `erzeugt` nur bei echter Inhaltsänderung — empirisch belegt (`--nur=OR` zweimal mit wechselndem `--datum` gefahren, Datei nach dem zweiten Lauf byte-identisch trotz neuem Datum). Wortlaut: ROADMAP-CHRONIK.md.
- [x] **Offline-Refresh löscht bei fehlendem Shard stumm** (#691, Rechtsprechungs-Teil) — `entscheide-schreiben.ts:577` `continue` + `:239` `rmSync`, Guard nur `basis.length>0`; Bestandszahl-Sperre vor `schreibeKorpus`, Mindestzahl in `check:entscheide`. — ✅ erledigt 12.9.2026, PR fix/offrefresh (Gegenprüfungs-Runde 2 korrigiert eine anfängliche 5-%-Toleranz, die auf dem VOLLSTÄNDIGEN Korpus fälschlich gefeuert hätte, weil `altManifest.entscheide.length` die abgeleiteten `__voll`-Verweis-Einträge mitzählte, `auswahl.length` aber nicht — Nullprobe auf dem echten Korpus 5093/6341 belegt): Bestandszahl-Sperre OHNE Prozent-Freibrief (jeder Abgang wirft, Vergleich gegen die Nicht-Verweis-Zahl), `LEXMETRIK_ERLAUBE_ABGANG=1`-Fluchttür, absolute Pfadauflösung in `schreibeKorpus`/`ladeBestandSnapshots`, laute Fehlend-Meldung statt stillem `continue`, `MINDESTZAHL_ENTSCHEIDE`-Ast in `check:entscheide` (Rot-Beweis geführt), 8 Vitest-Fälle (vorher je rot, Nullprobe + Regressionstest belegt). Wortlaut: ROADMAP-CHRONIK.md.
  · [ ] **Analoges cwd-fail-open in `golden-kanton-merge.ts`** (#694, NICHT Teil dieser Bau-Einheit) — `snapshotDateiPfad()`/`dateiExistiert()` (Aufrufer u.a. Zeilen ~106/246, Verwendung ~185–194) liegen im Normtext/Gesetze-Merge, ausserhalb des Rechtsprechungs-Korpus und damit ausserhalb der Whitelist dieses Fixes; bleibt bewusst offen (ehrlich nicht abgehakt) für eine eigene, sortenreine Bau-Einheit.
- [ ] **GL-Schlüssel auf amtliche `canonical_link`-Form (`III-B.7.1`)** (#694) — 2 Erlasse `%`-Kanonik, 2 Punkt-Form; entscheiden, sonst zweite 301-Kette. Gleiche Dubletten-Klasse: FR-261.16↔FR-8428, JU-…-34172↔…-dl (PDF-Zweitweg).
- [x] **Kanton-Fremd-Drift 19 Struktur-Sidecars** (#694) — BS Bürgerrechtsgesetz Stand 1.7.2026, AR/BS-PDF-Versionen; Drift-PR. `confidence.json` seit 23.6. stale (150/1565). — ✅ erledigt 12.9.2026, PR fix/kantondrift (Wortlaut: ROADMAP-CHRONIK.md).
- [x] **Fedlex-Trenner `a. ` vs `A: ` mitführen** (#679) — `extrahiere-fedlex.ts` verwirft ihn; ~90 Marken mit Sonderzeichen-Anfang falsch beschriftet. Extraktion + Neuerzeugung, Gegenprüfung. — ✅ erledigt 12.9.2026, PR #836 (`0f8981838`): `items[].trenner` additiv in der Extraktion (Opus-Bau, Sonnet-Gegenprüfung), 87 «:»-Labels/1447 «)»-Marken/2852 ohne Trenner erfasst, 227 Bund-Snapshots nur um das neue Feld ergänzt (Skelett-Nullprobe: 0 Restdiff), Leser nutzt das Feld statt der bisherigen Heuristik.
- [x] **`standRechtsprechung` = Erzeugungs- statt Abrufdatum** (#691, latent, nirgends gerendert) — Stand aus max(abgerufen) (§8). — ✅ erledigt 12.9.2026, PR fix/standrs (Nullprobe ergänzt: die Behauptung «nirgends gerendert» stimmte am 5.9. bei Fund-Erfassung, ist seit dem D8-Umbau 6.9.2026 aber überholt — `KorpusStand.tsx` liest den Wert seither in die «Register erzeugt am»-Zeile, gerendert in Topbar/Sidebar/Shell): `standRechtsprechung` kommt jetzt aus `berechneStandRechtsprechung` (neuer Helfer `scripts/startseite-zaehler-stand.ts`, keine Top-Level-Seiteneffekte, isoliert testbar) — jüngstes `abgerufen` je Snapshot-Datei über den Nicht-Verweis-Bestand, Fallback auf das alte `register.json`-`erzeugt` nur bei leerem Register. Rot-Beweis (Fixture mit fingiertem Register-`erzeugt` 2099 vs. echtem Bestand): ALT `2099-01-01`, NEU `2026-09-12`. Am realen Korpus blieb der Wert unverändert `2026-09-12` (Determinismus-Beleg: heutiger Refresh hatte real den jüngsten Abruf). 7 neue Vitest-Fälle. Wortlaut: ROADMAP-CHRONIK.md.

### Restposten aus ROADMAP.md *(verlagert 20.9.2026)*

Herkunft: `ROADMAP.md`, Dach-Schritt `QS-KORPUS`. Anlass: der 120-KB-Deckel des Plans,
Entscheid David 20.9.2026 — in `ROADMAP.md` bleiben Ziel, Auflagen, Status und der Zeiger
auf diesen §1, die Befundliste steht ab hier. **Wortlaut byte-genau, nichts
zusammengefasst.** Die Auflage des Dach-Schritts gilt unverändert für jede Zeile:
Risikopfad ⇒ Gegenprüfung Pflicht, amtlicher Beleg mit Norm + Link + Stand (§7), Korrektur
nie in der Projektion, immer in der Pipeline-Quelle (§5).

  - [x] **Erledigt (7.9.–12.9.2026):** `adapter-lexwork.ts:778` (#813, `af5e35ce9`) · geltende BMV (#823) · scope/decl-Sektionen 12 Staatsverträge (#838) · Entscheid-Datumsfehler · VZV Art. 3/4 · AMBV · Deckungs-Seite «was wir nicht haben» + Ingest-Wächter `ungedeckteTopLevelJson` (#807, vier vorbestehende Lücken geschlossen) — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtungen 7.9./12.9.2026 und 14.9.2026 (6).
  - [ ] **AVG-normKeys nachführen + Alias-Kollisionen** *(Gegenprüfung #911, 18.9.2026)* — 11 Snapshots (5 BGE 147 II 397 · 148 II 203 · 148 II 426 · 151 II 178 · 151 III 143; 6 BS BEZ.2023.59 · VD.2025.49 · ZB.2023.64 · ZB.2023.66 · ZB.2024.11 · AH.2023.9) tragen `AVG` erst nach dem Voll-Lauf `npm run entscheide` · Tor-Kandidat: neue Fedlex-Aliase gegen kantonale Kürzel prüfen (it-«LC» = Waadtländer LC, gesperrt in `ABK_AUSSCHLUSS`; im Korpus dazu «Least Concern», «RS/GE LC», «letter of credit»; «LSE» = Lohnstrukturerhebung latent); feiner als die Sperre wäre der B1-Riegel `fremdDefinierteKeys` (`bezuege-bauen.ts:339 ff.`, dritter Fall 149 I 343) · `GESETZ_CODE` (`zitat-extraktion.ts:271`) erlaubt Umlaut nur am Code-Ende ⇒ «Art. 7 EÖBV» im Fliesstext unauflösbar (24/549 Kürzel) · `check:normkeys`: IGNORE 'VO' unter Schwelle (19 < 20) = Streich-Kandidat.
  - [ ] **Bezüge-Kanten mit Phantom-Zitaten** *(Befund Split-Bau 30.8.2026, PR #582)* — 18 854 von
    75 365 Artikel↔Entscheid-Kanten nennen den Artikel im Entscheid-Snapshot gar nicht; Stichprobe
    `bge_148_V_265` trägt `«Art. 4 BGE»` in `zitierteNormen` (Extraktions-Artefakt). Wurzel im
    Bezüge-/Zitat-Generator suchen (Risikopfad, Gegenprüfung), nie in den Daten flicken.
    *Zuschnitt 1.9.2026:* zuerst den billigen **Filter** (Kante nur, wenn der Artikel im
    Entscheid-Snapshot wörtlich steht — §1 sofort erfüllt), den Generator-Neubau erst nach
    `W2·21-ZULIEFERER` (kommt der Graph von dort, entfällt er).
  - [x] **Erledigt:** Kernerlasse-Lücken Bund schliessen (PR #860, EMRK/EÖBV/AVG) · `public/normtext/confidence.json` veraltet (PR #848) — ✅ 14.9.2026. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 18.9.2026.
  - [ ] **Kernerlasse-Tranche 2** *(Hebel-Befund #864, 14.9.2026)* — Gaststaat-, Zoll-, Subventions-, Revisionsaufsichts-, Strafregister-, Post- und Medizinalberufegesetz als Fedlex-Snapshots. Wirkung doppelt: sie schliessen Abdeckungslücken **und** lösen die ~146 Kurztitel-Verweise ein, die heute Text bleiben, weil das Ziel keinen Snapshot hat (W2·20 «Offen (Phase 1)»). Der Wurzel-Fix ist der Snapshot, nie eine Wächter-Lockerung (§1). *Risikopfad ⇒ Gegenprüfung.*
  - [ ] **§17 · `scripts/fedlex-eli-aufloesen.ts:44-56` liefert falsche ELI** *(Prüfer #860, 14.9.2026)* — für 2 von 3 geprüften SR kommt ELI **und** Datum aus dem falschen Abstract: `LIMIT 200` kappt die Datumsliste (EMRK 1990 statt 2022), `bindings[0].cc` greift bei mehreren Abstracts den aufgehobenen Vorgänger (EÖBV → NAG 1891, AVG → AVG 1951); die SR-Sonde ist blind, weil die SR gleich bleibt. Repro: `npx vite-node scripts/fedlex-eli-aufloesen.ts -- 0.101 211.435.1 823.11`. Fix: `GROUP BY` je Abstract, kein `LIMIT`, Abstract-Wahl über die geltende Konsolidierung. Bestandspins unbetroffen (`check:fedlex-versionen` grün). *Risikopfad.*
  - [ ] **`--erlass=` filtert nur die Bund-Route** *(§17-Generator-Befund #860)* — HTM-, ZH- und PDF-Adapter laufen beim gezielten Neulauf mit; im Lauf vom 14.9.2026 hätte das VS-173.8-fr «RS» → «SR» geändert. Filter auf alle Routen ziehen.
  - [ ] **`check:pdf-quellen`: Kanton-Ratsche, 152 Erlasse ohne PDF** *(Messung #860)* — Bund scharf (231/231), Kanton läuft als Ratsche: ZH 111, JU 7, VD 7, TI 5 ohne PDF-Quelle. Phase-2-Posten.
  - [ ] **Golden-Token blind für Randtitel** *(Befund PR #668, 4.9.2026)* — `sha256Bloecke` (`scripts/normtext/sha-bloecke.ts`) hasht weder `titel` noch `absatz` (Gegenprüfung 4.9.2026: `sha-bloecke.ts:50`); eine reine Randtitel-Revision (BE 154.21 Art. 31) bewegt den Golden-Index nicht. Wurzel-Fix korpusweit (~60k Hashes) als eigener Schritt mit Gegenprüfung.
  - [ ] **Nebenfunde Nacht 5.9.2026** (7 Zeilen: Cache ohne Fassungsschlüssel, struktur-Filter, stumme Löschung, GL-Kanonik, Kanton-Drift, Fedlex-Trenner, standRechtsprechung) — Fahrplan §1.
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


## §2 — `QS-MONITOR-ROT` · Normen-Monitor seit ≥5 Wochen rot

Wörtlich aus ROADMAP.md (Stand 29.8.2026) — Aktivierungs-Audit 14.8.2026 und die daraus
abgeleitete Checkliste, samt den sieben Materialien-System-Befunden (a)–(h):

- [ ] **`QS-MONITOR-ROT` · Normen-Monitor seit ≥5 Wochen rot — Wurzel-Fix** — Aktivierungs-Audit 14.8.2026: `normen-monitor.yml` 5/5 Läufe failure (seit 6.7., Issue #166 offen, 8 rote Läufe in Folge); scheiternde Schritte `check:netz` und LIK-Reihe (BFS O-1.6). Rechtsstand-relevant. DIAGNOSE 14.8. (Session-Befund, Issue #166 beantwortet): Monitor korrekt, Rot ist ECHT — Checkliste: · [ ] LIK-Reihe 2026-05→2026-07 nachziehen (scripts/lik-reihe-generieren.py; amtliche Werte ⇒ Gegenprüfung trotz formal fehlendem Risikopfad-Flag) · [x] 14 nicht-kanonische Fedlex-Pins repariert (#497, 2 Gegenprüfungs-Runden 14/14 SPARQL-rederiviert; PR von 574 auf 10 Dateien entbläht — Automaten-Churn inkl. 115 Kanton-Dateien ist Befund (a2)) · [x] Frische-Automat: gen:historie/check:historie in Kaskade+Prüfliste nachgerüstet (Nullprobe-belegt) · [ ] 10 ESTV-MWST-Snapshot-Drifts aktualisieren (Risikopfad Materialien) · [ ] AIG-Botschaft BOTSCHAFT-2025-3067 nachführen (botschaften-netz rot, Klasse d — materialien:botschaften-Generator; Risikopfad) · [ ] VRV-Vernehmlassung VERN-2026-79 bereinigen (vernehmlassungen-netz rot, Klasse d — Verfahren live nicht mehr gelistet; Risikopfad) · [x] Rest-Sondierung 14.8.: 8 weitere Netz-Tore einzeln GRÜN (caches/zitate/rss-oc/normtext/pdf/pdf-quellen/revisionen/abk) — nur materialien-netz + fedlex-versionen noch offen · [ ] Materialien-System-Befunde 14.8. (aus Korpus-Nachzug, je §17-Wurzel-Fix nötig): (a) `npm run materialien` löscht in DB-losen Worktrees still 11 kanten-Artefakte — Orphan-Bereinigung bei fehlender DB überspringen; (b) Generator-Abgänge ohne Grabstein/Logzeile — Zu-/Abgänge ausgeben, Abgänge bestätigungspflichtig; (c) VERN-Schlüssel erbt mutable Fedlex-Projektnummer (79→78-Umnummerierung belegt) — intrinsische Identität wie bei fga-URIs; (d) botschaften-netz-Stichprobe = 8 feste Keys, blind für Register-Zuwachs (9 neue Erlasse monatelang ungeprüft) — Vollabgleich Grundmenge↔Roh-Dateien; (e) VERN-shas rauschen (stand=Abfragedatum im Hash); (f) Botschaften-Roh ohne ORDER BY — deterministisch sortieren; (h) Fussnoten-Link-Extraktor erzeugt «Link .»-Leerzeichen bei Satzend-Links (TGBV Fn 20/32 belegt, Muster main-weit) — Fix im Extraktor, nie in den Daten; (a2) Frische-Automat fasst bei Bund-Läufen 115 Kanton-Dateien mit Datums-Churn an (Verletzung der eigenen Reset-Invariante cache.sh:31); (g) Generator-Kaskade als EIN Kommando (materialien ⇒ normtext:revisionen ⇒ gen:zaehler — am 14.8. kostete das einzelweise Entdecken zwei CI-Rotläufe auf #499) · [ ] Verfahrens-Gap: Reparatur-Arm (Mo 04:43) vs. Detektions-Arm (Mo 05:17) — Cadence/Reihenfolge entscheiden; check:netz-&&-Kette zeigt nur ersten Befund (eigener deklarierter Schritt, §17).

**Ist-Diagnose 1.9.2026 (Session QS-MONITOR-ROT, Verteilung über 15 Läufe statt Einzelwert
— Ergänzung, keine Nachführung; die 14.8.-Angaben oben bleiben, wie sie waren):**

- Rotgrund A (6.7.–15.8.: LIK 05–07/2026, ESTV-MWST-Drifts, AIG-Botschaft, VERN-2026-79) ist
  seit #499 (14.8.), #524 (15.8.) und #581 (30.8., Gegenprüfung bestanden) behoben; Beleg: Lauf
  31.8. 00:31 UTC GRÜN (`check:lik-frische` 2026-07 ≥ 2026-06 · materialien-netz 48/48 ·
  botschaften/vernehmlassungen-netz OK). Die ROADMAP-Häkchen fehlten nur.
- Rotgrund B (24.8., 31.8. 11:38 — der stehende Rotgrund): Kanonik-Arbiter in
  `check:fedlex-versionen` — Fedlex republiziert html-N-Manifestationen (24.8.: 10 Pins bgg/vgg/
  aig/glg/ohg/elg/fidlev/beg/lmg/thg; 31.8.: stgb html-0→4). Der Reparatur-Arm
  (`fedlex-frische.yml`) erkennt und re-pinnt korrekt, sein PR landet aber nicht: Voll-Lauf
  `npm run normtext` fasst 4860 Kantons-Snapshots mit Datums-Churn an (Befund (a2)) → #596
  kollidiert an vier ZH-Dateien mit #606 (`git merge-tree`-Beleg) und bleibt liegen; der Monitor
  läuft 34 min nach dem Reparatur-Lauf, vor dessen Merge. Verfahrens-Gap damit belegt, nicht
  vermutet.
- Rotgrund C (30.8. 22:37 + 22:48, beide `workflow_dispatch`): `check:fedlex-abk-netz` — SPARQL-
  Teilantwort (Live 594 Zeilen, 199/230 SR) gegen Artefakt 597; 00:31 derselbe Lauf mit 597/597
  grün. Flake der Quelle, fail-closed korrekt («KEIN URTEIL MÖGLICH … NICHT regenerieren»). Kein
  Fix nötig; Verteilung notiert (2/15 Läufe).
- ESTV-ToC-Sonde 1.9.2026 (1 GET `tableOfContent.xhtml?publicationId=1248491`): 0× «Publiziert
  am», 0 Datumsangaben — das ToC trägt keine Publikationsdaten; der Stand-Wechsel MUSS über die
  Ziffer-Seiten geprüft werden (Stand-Probe je Dokument, `estv-mwst-stand-probe.ts`).
- Befund (a) war bereits behoben (`soft-law-projektion-run.ts` Z. 48–63: ohne Harvest-Kanten
  keine Orphan-Bereinigung) — hier nur festgestellt, nicht neu gebaut.

Erledigt und hier als Beleg belassen:

  - [x] ESTV-MWST-Drift 15.8. behoben: MI 05 + Branchen-Info 04 Snapshots nachgezogen (Gegenprüfung bestanden), check:materialien-netz 48/48 drift-frei; Monitor-Rotgrund seit 10.8. damit weg.
  - [x] 1.9.2026 (Branch `feat/qs-monitor-rot`): Verfahrens-Gap geschlossen — Monitor-Cron 07:17 UTC
    (2,5 h nach dem Reparatur-Arm), Reparatur-PR ohne Kanton-Churn (`--nur=bund` +
    `normtext:churn-reset`, Befund (a2)), `check:netz` als Runner mit Tafel aller 12 Verdikte
    (Rot-Beweis: zwei rote Dummy-Glieder beide sichtbar). StGB-Pin html-0→4 (kanonisch, SPARQL
    isExemplifiedBy; Regenerat aus html-4 = reiner Datums-Churn, Inhalt identisch).
  - [x] 1.9.2026 Befund (d): `check:botschaften-netz` = Vollabgleich der Grundmenge (227 Erlasse);
    Mutationsprobe BOTSCHAFT-2025-1528/EOG entfernt → alt grün, neu rot.
  - [x] 1.9.2026 Befund (f): Roh-Bindings deterministisch (`sortiereBindings`); reproduziert (4 Dateien
    umsortiert, multiset-identisch), Migration 59 Dateien, zweiter Lauf byte-stabil.
  - [x] 1.9.2026 Befund (g): `npm run materialien:kaskade -- --datum=…` (Projektion → Revisionen →
    Zähler → Churn-Reset → Manifest, Abbruch beim ersten Rot).
  - [x] 1.9.2026 Befund (a): bereits behoben vorgefunden (Projektion ohne Harvest-Kanten löscht nichts).

---

**Nacht 5.9.2026 (#687/#695, Läufe 33936281247/33937353756):**
- [x] **Finding 7 ohne Reparaturweg** — bleibt Fedlex nach Fristablauf bei `laufend`, verlangt das Tor etwas, das der Generator verweigert; abgeleiteter Status `frist-abgelaufen` (amtlicher Status als Feld). `materialien:vernehmlassungen` in `materialien:kaskade` hängen (Zähler/Manifest fielen einzeln rot). **GELÖST ABWEICHEND 12.9.2026 (§17-Wurzelfix, PR #803, §7-Offenlegung):** kein neues Status-Feld gebaut — Finding 7 vergleicht `fristEnde` stattdessen gegen das committete Erhebungsdatum (`r.stand`) statt gegen `heute`; ein Ablauf NACH der Erhebung ist damit gar kein Fehler mehr (der eigentliche Reparaturweg entfällt), ein Ablauf VOR der Erhebung bleibt rot (Datenfehler). `materialien:vernehmlassungen` läuft jetzt monatlich im Frische-Kreislauf (`normen-monitor.yml`, Job `vernehmlassungen`) statt in `materialien:kaskade` gehängt zu sein. Wortlaut: ROADMAP-CHRONIK.md.
- [x] **Register-`sha` rotiert mit `stand`** — `material-manifest.ts:45` hasht `r.stand`; stand-freie `shaVernehmlassung()` nur im Test (§5/§6.7). **GELÖST 12.9.2026 (PR #814):** `r.stand` aus `shaEintrag()` entfernt, `shaVernehmlassung()` als Duplikat gelöscht (eine Formel, §5). Nullprobe Lauf #789→#803: 831/831 Vernehmlassungs-sha änderten sich bei nur 1 Statusübergang. Wortlaut: ROADMAP-CHRONIK.md.
- [x] **Reparatur-Arm ohne `normtext:revisionen`** (#703) — Arm fährt nur `gen:artikel-revisionen`; DBG-Drift 54→55 blieb liegen. Dazu `--nur-geaendert` für den Revisionen-Lauf (227 `abgerufen`-Bumps je Lauf blähen den Diff ×20). **GELÖST 12.9.2026 (PR folgt, §7-Abweichung offengelegt):** fehlenden Schritt `normtext:revisionen` in `fedlex-frische.yml` nachgezogen (nach `normtext:struktur`, vor `normtext:churn-reset`). `--nur-geaendert` im Generator NICHT gebaut — Rot-Beweis zeigt, dass `normtext:churn-reset` (seit 1.9.2026) den abgerufen-Bump bereits generisch als Churn erkennt, eine gekürzte Revisionen-Liste (die DBG-Klasse) dagegen nie; ein zweites `--nur-geaendert` wäre dieselbe Prüfung doppelt (§5/§10/§17-Gegengewicht). Wortlaut: ROADMAP-CHRONIK.md.
- [x] **`check:materialien` lokal 7 falsche Shard-Abweichungen** (#703) — wenn `daten/soft-law.db` nur die gecrawlte Quelle trägt (ARG…VSTG); Tor darf DB-Zustand nur bei vollständig geladenen Quellen vergleichen. Zähler «0 Kanten · 0 Downgrades» strukturell 0, während der Lauf 3380/1157 zählt (§6.7). **GELÖST 12.9.2026 (PR folgt):** Reproduziert (seedSoftLawDb voll + auf `ESTV-MWST-%` getrimmt ⇒ exakt 7 Orphan-Shards ARG/ARGV1/BGOE/DBG/DSG/STG/VSTG + 4 Byte-Abweichungen, 11 Verstösse). Vollständigkeits-Marker aus dem Zustandsträger (`pruefeDbVollstaendigkeit` in neuem `scripts/materialien/db-vollstaendigkeit.ts`): jede im JSONL 'gelistet' geführte id muss in der DB-Dokument-Meta auftauchen, sonst HINWEIS (nicht rot) + Direktvalidierung der committeten Shards statt Byte-Reprojektion. Zähler «Kanten/Downgrades» in der Tor-Ausgabe kommen jetzt IMMER aus dem tatsächlich validierten committeten Bestand (`zaehleShardKanten`, akkumuliert in `pruefeShardDrift`/`pruefeCommittedShards`), nie mehr aus der lokalen DB — im obigen Teilstand zeigt die Ausgabe entsprechend echte "2054 Kanten" statt "0". Rot-Beweis §6.7 erhalten: eine manipulierte Shard-Kopie mit einer Downgrade-Verletzung (MWSTG Art. 18, Stand vor Cutoff) bleibt rot. Unit-Tests: `src/tests/db-vollstaendigkeit.test.ts`. Wortlaut: ROADMAP-CHRONIK.md. **PRÄZISIERT nach Gegenprüfung 12.9.2026 (PR #815, Auflagen A1–A3, ergänzt statt der obige Text überschrieben):** die 4 Byte-Abweichungen waren KEINE Folge des Teilstands, sondern des `erzeugt`-Stempels — Nullprobe mit einer vollständigen, inhaltsgleichen DB meldete alle 11 committeten Shards als abweichend, Einzeldiff nur die `erzeugt`-Zeile; behoben über `shardInhaltGleich` (Vergleich ohne Stempel, A2b). Der Vollständigkeits-Marker prüfte nur die Dokument-Meta — Gegenprobe der Gegenprüfung (volle Dok-Meta 298/298, `norm_referenzen` auf ESTV-MWST getrimmt) bestand ihn trotzdem und lieferte die 7 falschen Orphans; ergänzt um eine zweite Dimension `pruefeKantenVollstaendigkeit` (Kanten-Deckung je committetem Dokument, A2a). Dieselbe Wache jetzt auch VOR dem schreibenden Lauf `soft-law-projektion-run.ts` (A2c) — Rot-Beweis: die ungesicherte Fassung löschte auf der getrimmten DB tatsächlich 7 committete Shards (ARG…VSTG), die gesicherte bricht klar ab, kein Schreiben. Downgrade-Zähler gestrichen statt umformuliert (A3, §17-Gegengewicht): strukturell 0 in jedem grünen Lauf, da jeder Verstoss gleichzeitig rot macht (`pruefeShardDatei`) — kein Befund, ein Blindwert. **A4-NACHZUG 12.9.2026 (Deadlock, Delta-Prüfung PR #815, ergänzt):** das Kanten-Soll (`sammleKantenDokIds()`) verlangte bisher auch Kanten ENTLISTETER Dokumente — nach einer Entlistung (Kante + soft_law-Zeile weg, Rest voll; reproduziert mit EDOEB-LEITFADEN-WAHLEN-ABSTIMMUNGEN-VERSION-2022) brach `soft-law-projektion-run.ts` (A2c) mit «unvollständig» ab, während `check-materialien.ts` denselben stehengebliebenen Shard direkt validierte und «nicht als gelistet» rot meldete — der einzige Reparaturweg (den Generator laufen lassen) war blockiert. Fix: Soll-Menge beider Wächter auf `sammleKantenDokIds() ∩ gelistet` eingeschränkt (`nurGelistete` in `db-vollstaendigkeit.ts`); ein entlistetes Dokument darf fehlen, der laufende Generator bereinigt seine Shard-Kante gerade selbst. Rot-Beweis vorher/nachher: derselbe Lauf brach vorher ab, lief nachher durch und entfernte die Kante aus `DSG.json` (2054 → 2053 Kanten, 1681 → 1680 Materialien). Die bestehenden Rot-Beweise (Teilstand-DB, Deadlock-Löschung, Downgrade-Verstoss) bleiben unverändert rot/HINWEIS. Nebenfund benannt, nicht behoben: `shardInhaltGleich` lässt auch eine reine (nicht nur `erzeugt`-) Umformatierung grün durch, solange die Feld-Reihenfolge gleich bleibt — folgenlos, da Shards nie von Hand editiert werden (§2/§5).
- [ ] **Anker-Modell ESTV zieht nur verlinkte Normen** (Gegenprüfung #703) — MWSTV-Rechtsgrundlage von MBI 26 (Art. 83/93 MWSTV) unverlinkt ⇒ keine Kante; Text-Nennungen als Kandidaten-Kanten (Gegenprüfung).
- [x] **Revisionen: Plausibilitäts-Marker `rectifies`-Notation ≠ eigene** (Gegenprüfung #703) — Fedlex klassiert die ZDG-Berichtigung AS 2026 448 unter 642.11 (DBG); Generator liest treu, Marker macht den Widerspruch sichtbar (§8). **GELÖST 12.9.2026 (PR folgt):** Nullprobe live gegen den Fedlex-SPARQL-Endpunkt (`jolux:rectifies` von `eli/oc/2026/448` → `eli/oc/1996/1445_1445_1445`, dessen `classifiedByTaxonomyEntry` SR 824.0/ZDG ist, während `oc/2026/448` selbst unter 642.11/DBG klassiert ist) bestätigt den Befund exakt. `RevisionEintrag.plausibilitaet: 'widerspruch-fedlex-notation'` + `plausibilitaetsGrund` additiv im Generator (sha unbetroffener Einträge unverändert, §6.7); Vollerhebung korpusweit 18 Widersprüche in 14 Erlassen (AIG, CHEMRRV, DBG ×3, ELV, MSTG ×2, MWSTV ×2, RVOV, SKV, SSV, STGB, VIL, VVEA, VVV, ZPO), nur diese 14 Sidecars regeneriert. Wortlaut: ROADMAP-CHRONIK.md. **NACHTRAG 12.9.2026 (Gegenprüfung PR #827): Verdikt WIDERLEGT** — «Widerspruch» war eine Fehllesart; `jolux:rectifies` nennt nur das AS-Dokument der Erstpublikation (oft ein Mantelerlass-Anhang), kein Fedlex-Fehler. Marker umbenannt zu `berichtigung-fremdes-as-dokument` (neutral, kein «Widerspruch» mehr), Determinismus-Lücke (Auflage e) und fehlender Rot-Beweis (Auflage d, neue Prüfung 8b) behoben, SSV-Nebenfund deklariert. Details: ROADMAP-CHRONIK.md Nachtrag. **NACHTRAG 2, 12.9.2026 (Gegenprüfung PR #827, Auflage f):** auch die Korrektur selbst behauptete mit «erstpubliziert»/«Anhangs-Änderung» zu viel (das Tripel trägt keine Provenienz-Aussage) — Gegenbeleg AS 2025 686 (SKV): `jolux:rectifies` zeigt dort fälschlich auf einen anderen Erlass (belegter Fedlex-Datenfehler, keine Anhangs-Konstellation). Grund-Text auf reine Tripel-Wiedergabe reduziert («Fedlex verknüpft … mit dem AS-Dokument …»), Datenmodell um Ziel-Fundstelle (`RectifiesInfo`) erweitert. Details: ROADMAP-CHRONIK.md Nachtrag 2.
- [x] **Reparatur-Arm scheitert an wanduhr-abhängigem `check:materialien`** — Tor im Arm entschärfen (Kommentar in `fedlex-frische.yml`); Arm re-pinnte DBG korrekt, kam ohne PR durch (Feed/pdf-quellen-Reihenfolge behoben in #695). **GELÖST 12.9.2026 (§17-Wurzelfix, PR #803, präzisiert nach Gegenprüfungs-Auflage A1):** `check:materialien` ist vollständig wanduhr-frei (Finding 7 prüft gegen `r.stand`, nicht `heute`); der Alterungs-Wächter (45-Tage-Deckel, angehoben von ursprünglich 35 — ein 31-Tage-Monat + bis zu 5 Tage Gegenprüfung/Merge-Verzug riss den 35er-Deckel schon am 6. des Folgemonats) läuft NICHT mehr in `check:materialien`, sondern als eigener Tor `check:vernehmlassungen-alter`, bewusst nicht Teil von `check:seriell` (K7) — dieser Arm hier (fährt `npm run check`) führt ihn darum gar nicht aus und kann an keinem der beiden Befunde mehr scheitern. Kommentar in `fedlex-frische.yml` ergänzt (nicht überschrieben, §2b), keine Entschärfung nötig. Wortlaut: ROADMAP-CHRONIK.md.
- [x] **`QS-CURRENCY-KANON-FRISCHE` · Reparatur-PR verwirft sich selbst bei fremder Manifest-Drift** (Gegenprüfung #806, Lauf 34107274098, 7.9.2026) — `fedlex-frische.yml` regenerierte `daten-manifest.json` nur bei einem Diff auf `scripts/fedlex-cache.sh`, während `gen:fedlex-wiedervorlage` `public/normtext/currency.json` (ingestierte DB-Quelle, `scripts/datenhaltung/ingest.ts:33`) in JEDEM Lauf schreibt (`geprueftAm` je Erlass); blieb ein Re-Pin an einem Lauf aus, übersprang der Regenerierungs-Schritt die Manifest-Regenerierung, `check:datenhaltung` wurde rot, der PR-Schritt lief `skipped`, jede berechnete Reparatur ging mitverloren. Zweiter Befund derselben Gegenprüfung: `sicherstelleCaches()`/`cacheBefund` in `scripts/normtext-snapshot.ts` prüfte einen `/tmp`-Cache nur nach Inhalt (Grösse/Shell-Marker/Anker), nie gegen die gepinnte html-N — nach einem Re-Pin hätte ein liegengebliebener Alt-Cache den Snapshot still aus der falschen Manifestation gebaut. **GELÖST 12.9.2026, PR #808:** `npm run datenhaltung:manifest` läuft jetzt unbedingt nach dem Regenerierungs-Schritt (nicht mehr an den `cache.sh`-Diff gekoppelt); neue Cache-Pin-Sonde (`scripts/normtext/cache-pin-befund.ts`, Marker `/tmp/<name>.html.pin` = `eli|konsolidierung|html-N`) macht einen Re-Pin für `sicherstelleCaches` sichtbar. Rot-Beweis: `src/tests/fedlex-cache-pin-befund.test.ts`.

## §3 — `QS-DATA-INGEST-DRIFT` · Ingest-Strecke 3× langsamer

Wörtlich aus ROADMAP.md (Stand 29.8.2026) — Messreihe, Nullprobe und die Auflage, den Deckel erst
NACH der Ursachenklärung neu zu bemessen:

  Befund: `scripts/datenhaltung/suche.test.ts` fiel im Vollauf mit «Hook timed out in
  95000ms» (`beforeAll`). **Nicht der Deckel ist falsch, die Basis ist gewandert.**
  Der Deckel wurde am 14.8.2026 sauber kalibriert (Ist + 3 sd) gegen eine
  ISOLIERTE Datei-Dauer von **10.85 s** (n=5, sd 0.45) und einen Lastfaktor ~4.7×.
  Neu gemessen am 17.8.2026, gleiche Maschine, unbelastet: **35.26 · 33.32 ·
  25.56 s** (Mittel 31.4) — die Ingest-Strecke kostet das **Dreifache**. Mit dem
  dokumentierten Lastfaktor liegt der Hook unter Last bei ~150 s und reisst 95 s
  systematisch, nicht zufällig.
  Nullprobe (§0 Ziff. 3): `scripts/datenhaltung/**` und die Korpus-Projektionen sind
  auf `feat/leser-v3-s1` **byte-identisch zu `main`** (`git diff origin/main...HEAD`
  leer für diesen Pfad) — die Eingaben des Tests sind dieselben, der Defekt liegt
  also auf `main`. Rate im Vollauf dort gemessen: **1 rot in 2 Läufen** (rot bei
  113 s Gesamtdauer, grün bei 67 s ⇒ lastabhängig).
  **Wurzel-Fix, nicht Deckel-Anhebung (§17):** zuerst klären, WARUM die Strecke 3×
  teurer wurde — Korpus-Zuwachs seit 14.8. oder eine Regression in
  `ingest.ts`/`fts.ts`. Den Deckel erst danach neu bemessen, nach demselben
  Protokoll wie am 14.8. (n=5 isoliert + n=5 unter gedeckelter Parallel-Last, Ist +
  max(3 sd, 25 %)). Den Hook NICHT durch ein gecachtes DB-Artefakt entlasten: er
  baut beide HOT-DBs über dieselben ingest+fts-Bausteine wie `datenhaltung:build`,
  und genau das ist die Aussage der Datei (§1 vor Tempo — Begründung steht im
  Datei-Kommentar).

---

## §4 — `W2·18-FEHLERBUCH` · Davids Alltags-Fehlerfunde

Stehender Sammel-Schritt (Entscheid David 8.8.2026 — Kleinvieh bündeln statt einzeln durch die
volle Maschine). David sammelt Fehler aus der täglichen Nutzung formlos als `- [ ]`-Zeile (oder
meldet sie im Chat — die Session trägt sie ein); Fix-Batch-Sessions arbeiten mehrere Positionen
sortenrein ab. **Risikopfad-Funde gehören NICHT hierher**, sondern in den passenden
Risiko-Dach-Schritt. Der Schritt bleibt stehen (nie `done`); Erledigtes wird abgehakt und
periodisch in die Chronik geräumt.

**Lese-Regel für rote Browser-Sonden (14.9.2026, §17):** Wird eine UI-Sonde in einem **reinen
Daten-PR** rot, ist das ein **Ladezeit-Race der App**, kein Test-Flake — und damit ein Befund, kein
Rerun-Fall. Beleg: die D16-Spec `e2e/w224-reiter-umordnen-d16.e2e.ts:534` war 3/3 rot auf CI in
PR #859 (nur `public/normtext/**`); die Wurzel lag in `Reiter.tsx` (Beschriftung wächst beim
Manifest-Nachladen zwischen `dragover` und `drop`, der Drop rechnete die Seite neu statt die Marke
zu vollziehen), behoben mit PR #865 — Herleitung unten in §4.R4. Gleiche Familie:
`uinav-j-rechtsprechung` 201/200 Links (Reiterbreiten am Ladezeitpunkt). Wer eine solche Sonde
nur neu startet, verliert den Befund. Tor dazu besteht: `check:e2e-flake`.

Die Liste steht wörtlich so, wie sie am 29.8.2026 in ROADMAP.md stand:

  - [ ] **Frische-Workflow fährt kein check:netz/fedlex-versionen** *(GP-Mitdenken 29.8.: genau der Lauf, der Pins bewegt, prüft die Currency-Tore nicht automatisch — Netz-Tor in fedlex-frische.yml ergänzen.)*
- [ ] **DIAGNOSE · e2e-Flake `suche-seite.e2e.ts` («Deep-Link ?q=Miete … ungekappt»)** *(Agent-Befund 31.8.2026, Volllauf zu PR #587)* — `expect.poll` auf >6 Treffer erhielt 0 (Timeout 10 s). Messbedingung (F3): 1× rot im Volllauf 663 Tests/5 Worker/KALT; isoliert 5/5 grün; unter warmer Last 30/30 grün (`--repeat-each=6 --workers=6`). Nicht reproduziert unter Warm-Last — Kalt-/Erstlauf-Verdacht (Familie F2g/⌘K-Wächter). Erst Verteilung messen, dann Fix; nichts «umschiffen». **Messpunkte 2 (31.8.2026, Branch feat/w213-kantone, Maschine unter Agenten-Last):** Volllauf 5 Worker → 3 rot (Deep-Link 0 Treffer · «alle N»-Option nicht sichtbar · V5-CLS 0.0006 statt 0 — zwei NEUE Signaturen derselben Familie, alle drei laden den 17,7-MB-Suchindex bzw. throtteln CPU); Wiederholung 5 Worker/3× → 1 rot (Deep-Link); isoliert 2 Worker/6× + 1 Worker/3× → 9/9 grün. Verdachtsverdichtung: Ressourcen-Kontention beim Erstladen des Client-Index, nicht datenabhängig (Diff berührt artikelVolltext nicht). **Messpunkt 3 (31.8., dritter Volllauf nach main-Einzug Test-Diät):** wieder genau 1 rot, wieder ANDERE Signatur (`international-kanonik-ia6` Deep-Link-Scroll, viewport ratio 0); isoliert 33/33 grün. Vier Vollläufe, vier verschiedene Einzel-Signaturen, alle isoliert grün — die Familie ist Erstlade-/Scroll-Timing unter Parallel-Last, nicht testspezifisch. **Messpunkt 4 (31.8., Design-Branch, zwei Vollläufe):** je 2–3 rot aus derselben Familie (Deep-Link-0, «alle N», leser-position-CLS byte-identisch 0.0506, leser-kopf-cls 0.060); ALLE isoliert grün (5/5, 6/6, 8/8, 5/5). Muster stabil: jeder Volllauf unter Last wirft 1–3 Familienmitglieder, isoliert nie reproduzierbar.
- [ ] **Gliederungsbaum: Knoten-Merge ohne Adjazenz-Bedingung** *(§9-Bug-Check 31.8.2026, Fund 3 — Vorbestand)* — `browse.ts` verschmilzt «letzter Knoten dieser Ebene + gleiches Label» auch über dazwischenliegende Direktartikel hinweg: `SG-811.1` rendert § 251bis direkt nach § 248bis (beide Marginalie «2. Straflose Selbstanzeige»), vor §§ 249–251. Wurzel-Fix: Adjazenz-Bedingung beim Merge; betrifft TOC + Lesespalte gleichermassen.
- [ ] **LM-165 · Deep-Link auf grossen Erlassen scrollt weit übers Ziel** *(Agent-Befund 31.8.2026, PR #584)* — `/gesetze/bund/OR#art-368` landet bei y≈1'077'504 statt ~355'887; danach ist `[data-v3-kopf-artikel]` leer und das Norm-Panel fällt auf Art. 1 zurück. Verdacht: spät auflösende content-visibility-Platzhalter; verwandt mit LM-163. Repro dokumentiert, kein Risikopfad.
- [ ] **PROZESS · Befund-Anker-Sweep vor jedem Rest-Batch** *(Lehre Batch 30./31.8.)* — 2 von 4 gebauten Befunden waren durch den V3-Umbau überholt; §8 führt `LeserAnsichtMenu.tsx`/`LeserRechtsprechungMenu.tsx` als Anker, die Dateien existieren nicht mehr. Vor dem nächsten Batch: tote Datei-Anker der Befundliste maschinell listen (git ls-files-Abgleich) und Positionen zuerst re-messen.
- [ ] **⌘K-Wächter seit ≥16.8. auf CI im Erstversuch 69/69 rot — von retries:2 maskiert** *(Forensik 29.8.2026 über 69 main-Läufe; Hydration-Hypothese widerlegt (20× Drossel greift sofort). Eigener Diagnose-Auftrag; zugleich frisst er ein maxFailures-Budget — so lief das neue topbar-320-Tor in Gruppe 6 nie («10 did not run»). Retry-Politik = David-Frage. Skill lehren F2-Verschärfung (i).)*
- [ ] **Leerflächen-Reservierung /gesetze messbasiert lösen (L1↔L2-Spannung)** *(Design-Review 29.8.: min-h-inhalt-region erzeugt bis 488 px Leerlauf auf ?ebene=bund; naive Verkleinerung brächte den Footer-Sprung (0.44 CLS) zurück — Fix braucht Messreihe, nicht Pixel-Jagd; App-weite Rahmen-Idee (EINE Reservierungs-Regel Route-Fallback+Platzhalter, App.tsx-Naht) als §10-Kandidat, siehe FAHRPLAN-PERFORMANCE dritter Posten.)*
- [ ] **Browser-Pane ist nicht Worktree-isoliert (§17-Werkzeugbefund 21.8.2026, zwei Agenten unabhängig)** — fremde Tabs/Navigationen zwischen parallelen Worktree-Sessions, `preview_start` mit launch.json-Name serviert den HAUPT-Checkout statt des Worktrees, resize wirkungslos. Wurzel-Fix: Worktree-bewusste launch.json-Auflösung bzw. je-Session-Pane; bis dahin Workaround eigener Playwright-Lauf (in Dispatch-Berichten dokumentiert).
  - [ ] **FlexSearch `suggest:true` wirkt bei Mehrwort-Queries wie ODER/fuzzy** *(Wurzel von Cowork-Befund 29, Fix 21.8. nur in artikelVolltext.ts; Rest der Suche-Schicht systematisch nach weiteren `doc.search(mehrwort, {suggest:true})`-Stellen absuchen.)*
  - [x] **EMRK-docTitle «EMRK (EMRK)»** *(Kürzel-Duplikat im title-Tag bei pdf-embed; Gegenprüfung J3 21.8., kosmetisch.)* **Erledigt 5.9.2026: `metaFuerErlass()` hängt Kürzel nur an, wenn nicht im Titel; Unit-Test.**
  - [x] **Kantonskarte: aktiver Kanton verliert Hervorhebungs-Rand bei Hover über Nachbar** *(nur EIN Overlay `gezeigt = hover ?? aktiv`; Gegenprüfung 21.8., kosmetisch.)* **Überholt 5.9.2026: Duplikat von Befund 12, behoben 29.8.2026 (`markierungen()`, zwei Ringe).**
  - [x] **`e2e/helpers/istHuelle.ts` löschen (totes Modul seit H5)** *(Nachlese 21.8.2026: kein Importer mehr, Projekt leser-v1 entfernt; Streich-Massstab aufraeumen.md §3 — Beweis = leerer grep vor Löschung.)* **Erledigt 5.9.2026 (Batch W2·18): gelöscht, grep-Beweis ohne Importer.**
  - [ ] **e2e-Assertions-Latten unter CPU-Aushungerung** *(QS-E2E-STABIL-Messreihe 14.8.: eigene Klasse, kein Timeout — international-kanonik-ia6 3× toBeInViewport, gesetze-ia-v2-walks, suche-seite:27 expect.poll, verlauf-o1, qsui-Vorlagen; wandert je Lauf mit Aushungerungstiefe; weitere Mitglieder 21.8.2026: leser-position-u:147, rechtsprechung.e2e:318 Rail-CLS, leser-gliederung-a33, norm-sprung Ctrl+K-Fokus — alle standalone grün nachgewiesen. Methode wie QS-E2E-STABIL, aber gedeckelte Lastbedingung — nie die verworfene Übersättigung. Weitere Mitglieder 29.8.2026 (drei Prüf-Sessions unabhängig): international-kanonik-ia6, leser-kopf-cls-s3, rechtsprechung-richter, datenhaltung/suche, leser-v3-h4-Familie, suche/rankingTestset-vitest-Hooks — je seriell grün, unter 5-Worker-Last wandernd.)*
  - [ ] **druck-fundstellen-z2 flakt NUR auf CI-Runnern** *(CI-Forensik 14.8.: 10 Vorkommen/30 Tage; lokal 11/11 sauber bei 19,8 s gegen 30-s-Budget — braucht Runner-Messung, kein lokaler Fix; blosses Budget-Hochsetzen ohne Messreihe bleibt ausgeschlossen.)*
  - [ ] **Kalender-Export: Termine als «frei» markieren (TRANSP:TRANSPARENT)** — Go David 8.8.2026 («frei ok»); bricht deklariert einen Golden-Anker ⇒ fachliche Änderung mit Golden-Neuschrieb im eigenen Commit (Herkunft: Session-Karte 3./4.8.2026, archiv/STRUKTUR-SESSIONKARTEN.md).
  - [ ] **LM-016-Wurzel: Topbar-Icon-Zeile an die Brotkrume-Breite angleichen** (Befund B7 8.8.2026, zurückgestellt: braucht eigenen Entscheid statt Menü-Pflaster).
  - [x] `check:design-tokens` scannt Kommentartext mit (Utility-Platzhalter im Kommentar = rotes Tor, je Vorfall ein Zyklus); Wurzel-Fix: Kommentar-Strip vor dem Scan, einmal rot zeigen (§6.7). *(Agent-Fund 8.8.2026.)* **Erledigt 5.9.2026: Kommentar-Strip vor dem Scan, Rot-Beweis beidseitig.**
  - [ ] **Perf-Blick auf den langen Artikel-Index (aus PR #486):** der flache Index ist bewusst nicht virtualisiert; seit dem B3-Wegfall trägt SG-3849 607 Zeilen (davon 590 im Anhang-Ast, der bei Anhang-Dominanz aufgeklappt startet), ZH-243 152. Messen, ob das auf schwachen Geräten trägt — sonst Virtualisierung des Index als eigener Schritt (Skill `perf`).
  - [ ] **`check:materialien` läuft durch blossen Kalender-Ablauf rot** — das Tor misst Kalenderzeit statt Korrektheit; Wurzel-Fix: abgelaufene Fristen deterministisch als «abgeschlossen» ableiten oder auf Harvest-Alter umstellen.
  - [ ] **Muster «Test pinnt von-Hand-Tageswert» anderswo suchen** — der `registerStand`-Fall (garantierter Fehlalarm bei jeder Pflege) ist gefixt; Geschwister finden.
  - [ ] **Alt-Flake `qsui-hierarchie.e2e.ts` (Vorlagen-Block, ~25 %/Fall, Nullprobe-belegt 25/84 auf main):** Wurzel-Fix mit Mandat; Familie + Zahlen im a33-Dossier-Nachtrag (PR #480).
  - [ ] **Alt-Flake `leser-weiterlesen-r4-r8` (Shard-Kontext, vorbestehend, Befund 9.8.2026):** gleiche Familie; Wurzel-Fix mit Mandat, Messbedingung protokollieren.
  - [ ] **Alt-Flake `leser-ohne-gliederungslinie.e2e.ts:71` (OR Art. 319, Befund 16.8.2026, Vorprobe LESER-V3):** 20-s-Timeout auf `getByRole('button', {name:'Ansicht'})`. Nullprobe-belegt auf `main` — **Flag aus** 1/3 rot, Flag an 2/5 rot, gepoolt 3/8 ≈ 38 %; Messbedingung lokal/warm/5 Worker/60 Tests im Lauf, isoliert 0/1 rot. Gleiche Familie wie oben; die Wurzel ist in `e2e/shard-gruppen.json` bereits benannt («zweiter schwerer OR-Reader je Chromium-Worker») und weiterhin ungefixt. CI unauffällig (`workers:1`, 90 s, `retries:2`) — der Preis fällt lokal an. Wurzel-Fix mit Mandat, nicht per Timeout maskieren. Zahlen: `docs/ux-audit-2026-07/reader/leser-v3-vorprobe.md`.
  - [ ] **Flake-Beobachtung 14.8.2026 (Voll-Suite, isoliert grün):** `gesetze-historie-badge` Lade-CLS-Budget (§15-Messrauschen unter Last) + `leser-kontext-e4` Deeplink — je 1× rot bei 539 grün, Wiederholung 8/8 grün; bei Wiederkehr zur CLS-/Leser-Flake-Familie schlagen.
  - [ ] **Klick-Pfad der Gliederungs-Zeile (Perf-Restposten W2·19):** 161 ms @4×, OR/BGFA-Verhältnis 7→14.6 verschlechtert; Messpunkte in der Perf-Nachmessung (bibliothek, via PR #480). Skill perf.
  - [ ] **Lese-Kadenz-TBT @4× (U3-Rest, ~10 s/32 s, @1× unmerklich):** Spy-/Zuklapp-/Re-Render-Pfad; Messvorschrift: Kadenz-Kopfzeile der Nachmessung.
  - [ ] **Liste `/gesetze`: ~370-px-Leerfläche am Seitenende schliessen** (LM-163-Alternativerklärung, risikoarm; Nachprüfung 9.8.2026).
  - [ ] **Tor gegen case-blinde Korpus-Pfad-Literale** (`public/normtext/**.json`-Strings zeichengenau gegen den git-Baum; macOS case-blind vs. Linux-CI, PR #478): `normtext-fixture.ts` deckt nur Nutzer; einmal rot zeigen (§6.7).
  - [ ] **tor-schutz.py: Trailer-Block-Format beim Commit prüfen** — ein `Gegenpruefung:`/`Roadmap:`-Trailer mit Leerzeile IM Block wird von git nicht als Trailer geparst und fällt erst als roter Merge-Schutz im CI auf (ein voller Zyklus; real 13.8.2026, PR #487, trotz Memory-Eintrag). Hook-Check beim Commit = Wurzel-Fix; einmal rot zeigen (§6.7). *(Konfig-Fläche — Umsetzung mit David-Freigabe.)*
  - [ ] **Tor gegen die Flake-Familie «einmaliges DOM-Lesen ohne Wartung»** (`boundingBox()!`, ungewartete Einzel-Lesungen in `page.evaluate`): vier belegte Fälle, je ein Diagnose-Zyklus Kosten; einmal rot zeigen (§6.7).
  - [ ] **Eingebettetes PDF: Ladephase ohne Messung** — Wortlaut korrigiert (29.8.2026): Fläche ist **hellgrau MIT Ladebalken**, nicht schwarz ohne Anzeige. **Dauer offen**: der Screenshot-Pfad misst sie nicht (ab 1 s unverändertes Bild = Browser-PDF-Viewer). Braucht Zeitmessung am `<iframe>`-Load; erst dann entscheidbar, ob etwas zu tun ist. *(Befund 46.)*
  - [ ] **FR/IT-Band: nicht reproduzierbar wie beschrieben** — 29.8.2026: das `<details>` schliesst sauber, weder «nur durch Aufgeben entfernbar» noch der 19-px-Sprung traten auf. **Fundort unklar** (andere Stelle? Viewport? inzwischen behoben?). Bleibt offen als *Suchauftrag nach dem Fundort*, nicht als Fix-Auftrag; ohne neue Repro-Angabe Rückbau-Kandidat (§17). *(Befund 48.)*
  - [x] **International-Erlasse unter `/gesetze/bund/`** — gebaut 29.8.2026 (Entscheid David: ja, mit Redirects). Kanonisch `/gesetze/international/:kuerzel`, Alt leitet dauerhaft. Herleitung: `lib/normtext/erlassAdresse`. *(Befund 45.)*
  - [ ] **Kantonswahl: Karte UND Karte/Liste-Umschalter verschwinden nach der Wahl** — «ZH 3» bricht dabei allein um. **Verifiziert 29.8.2026, bewusst nicht gebaut:** der ganze Detailzustand (Kürzelleiste + der Ort für den Umschalter) liegt in `src/pages/Gesetze.tsx`, `KantonAuswahl.tsx` wird beim Wählen ausgehängt — Datei belegt von PR #565. **Direkt nach #565 anschliessen**, zusammen mit Befund 12. *(Befund 41.)*
  - [ ] **Brotkrume Kantonsebene zu flach** — **Prämisse widerlegt (29.8.2026):** die Krume trägt bei KEINER Ebene eine Nummer (drei Stufen, `v3/erlassAnsicht.ts:377-386`); was wie «[SR 220]» aussieht, kommt aus dem Erlass-Kopf darunter — kein Bundes-Vorbild anzugleichen. Echter Unterschied: `zeigeVolltitel()` unterdrückt den Volltitel bei **775/1231 (63 %)** Kantonserlassen (Register-Kürzel = Volltitel). Sigle liegt schon im `sr` (ZH «LS 211.11», 1227/1231). Umsetzung: Ableitung in `erlassAnsicht.ts` + Geschwister-Element in `LeserKopf.tsx:204`. **Kein Fix-Batch-Posten** — vier e2e-Pins an der Ort-Zone, darunter die Ä-A4-Breitenfalle. 4/1231 ohne `sr` ⇒ muss entfallen können (§8). *(Befund 43/C8.)*
  - [ ] **SchweizKarte: aktiver Kanton verliert den Rand beim Hover über Nachbarn** — `gezeigt = hover ?? aktiv`, nur EIN Overlay-Pfad. **Heute folgenlos** (kein Aufrufer übergibt `aktiv`), **scharf sobald Befund 41 gebaut wird**. Notiz am Fundort; Auflösung = zweiter dauerhafter Overlay-Pfad für `aktiv`. Ins **Kantonskarten-Paket F1/F2** mit 41 + 49. *(Befund 12; geprüft 29.8.2026.)*
  - [ ] **Kantonskarte ohne Legende** — Pastellfarben ohne erklärte Bedeutung, Kantonsnamen erst nach Klick sichtbar. *(Cowork-Befund 49, 18.8.2026, unverifiziert — vor Bau reproduzieren.)* **Zusammen mit Befund 12 + 41 im Kantonskarten-Paket bauen** (alle drei sitzen in `SchweizKarte.tsx`/`Gesetze.tsx`; einzeln gebaut kollidieren sie).
  - [ ] **4'490 fokussierbare Elemente unter 24×24 px (WCAG 2.5.8)** — eigener Schritt, kein Nebenbei-Fix, nicht mit anderen Positionen bündeln. *(Cowork-Befund 37, 18.8.2026, unverifiziert — vor Bau reproduzieren.)*
  - [ ] **ZPO-Chronologie: 11 Sammelerlass-Einträge ohne Titel/AS-Fundstelle, Links kleben am Satzende** — **Verdikt (Datenklärung 21.8.2026, lex-recherche): strukturelle Lücke des SPARQL-Pfads, kein leeres Feld.** Pfad (b) findet nur Änderungserlasse mit primärer SR-Klassierung des Ziel-Erlasses; Mantelerlasse fremder SR fallen durchs Raster, Pfad (a) trägt nur das Datum. Fix = dritter Query-Pfad (c) über die tatsächliche Modifikations-Beziehung (`scripts/normtext/revisionen-generieren.ts` Z. 33–39/238–251), mittlerer Aufwand, mind. 10 betroffene Erlass-Dateien; der bestehende ehrliche UI-Hinweis bleibt für echte Rest-Lücken nötig. *(Cowork-Befund 36, 18.8.2026, unverifiziert am UI — vor Bau reproduzieren.)*
  - [ ] **Kantonale Gliederung ZH-211.11 nur «§ 1…§ 23» ohne Überschriften** — **Verdikt (Datenklärung 21.8.2026, lex-recherche): Extraktions-Lücke, keine Quell-Lücke.** `scripts/normtext/struktur-kanton-run.ts` überspringt bewusst Nicht-LexWork-Quellen (PDF/lexfind/zhlex); die Quelle (zhlex GebV OG) HAT eine Buchstaben-Gliederung («A. Allgemein» …). Systematisch: 38 von 1'231 kantonalen Erlassen ohne Struktur-Sidecar (ZH 3/3, JU 7, VD 7, TI 5, GE 4, NE 4, SZ 4, SG 3, AR 1, BS 0). Wurzel-Fix wäre ein PDF-Struktur-Adapter je Quellsystem — Priorisierungsentscheid, kein Quick-Fix. *(Cowork-Befund 42, 18.8.2026, unverifiziert am UI — vor Bau reproduzieren.)*

---

**Nacht 5.9.2026 (CI #691/#683):**
- [ ] **Kontention (5.9.2026, Nachmittag):** bei ≥ 4 parallelen Bau-Agenten + Stop-Hook-Gate auf einer Maschine reissen `scripts/datenhaltung/suche.test.ts`/`suche-rang.test.ts` ihr 95-s-Setup-Limit (Vollsuite 224 s statt 40 s) und E2E-Latten (`international-kanonik-ia6` toBeInViewport, `leser-kopf-cls-s3` CLS, `a11y` dunkel BS-640.100) — isoliert stets grün (belegt 4×). Kein Code-Fix; Regel: Tore seriell fahren, wenn Bauer laufen; Stop-Hook-Gate unter Last als Hinweis lesen, nicht als Rot. **Wurzel-Fix-Kandidat (Opus-Prüfer 5.9.2026):** `suche.test.ts` baut je Lauf den In-memory-FTS-Index auf (Budget 14.8. schon 60→95 s gehoben) — vorgebaute DB-Fixture statt Aufbau je Lauf; eigener Schritt unter QS-DATA-INGEST-DRIFT oder QS-BASIS.
- [ ] **Flake-Sammlung 5.9.2026 (je 1 failed, Retry grün):** `gesetze-ia-v2-walks:65` (#691/#711), `split-erwaegungssprung.e2e.ts:47` ⧉-Pane auf Erwägung, `tastatur.e2e.ts:81` Skip-Link (#715), `leser-v3-blatt:105` ⌘K-Split — alle Hydration-/Timing-Klasse; nach der 60-s-Härtung Rate neu messen (`zaehleFlakySpecs` in der Selbstopt-Zeitreihe).
- [x] **OR-Leser-e2e auf 60-s-Budget härten** — `gesetze-ia-v2-walks.e2e.ts:72` 10-s-Timeout auf `#art-336_c` (2-vCPU); #682 härtete nur `norm-sprung`/`leser-suche`; alle `gesetze/bund/OR`-Specs als Infrastruktur. — ✅ erledigt 12.9.2026, PR #837 (`8a7336e5a`): Wurzel gemessen (CDP-CPU-Drossel 10x: 10-s-Default 8/8 rot, 60 s 0/8), zentraler Helfer `e2e/helpers/orLeser.ts` (`OR_LESER_FRIST`/`warteOrGeladen()`), bare 10-s-Defaults in 6 Specs ersetzt.
- [ ] **⌘K-Vorlauf im Split** (CI #711, `leser-v3-blatt.e2e.ts:105` flaky) — Verdacht Nebenwirkung von #682 (vor Hydration löst der Vorlauf in der Kopf-Suche aus, nicht im fokussierten Pane); bei Wiederholung `fruehesSuchKuerzel.ts`: Vorlauf nur einlösen, wenn kein Pane-Fokus.
- [ ] **Flacker-Fall leser-v3-blatt (c), gemessen 13.9.2026** — CI-Rot Shard 1/4 (Lauf 34783413401) auf PR #844, «(c) im Split trifft das Kürzel nie das fremde Pane»: 1× rot, Retry grün («Fokus stand im Pane «sekundaer», ⌘K landete woanders»). Nullprobe: isoliert (`--repeat-each=6`, 5 Worker, `dist`) auf Branch `feat/w2-18-reiterleiste-teil3` (c020885a5) 6/6 grün, auf `origin/main` (ae63949d3) ebenfalls 6/6 grün — Fall lässt sich isoliert nicht reproduzieren, weder mit noch ohne Welle-2/3-Code. Deckt sich mit der bereits offenen Zeile «⌘K-Vorlauf im Split» oben (dieselbe Spec/Zeile, seit CI #711) — Klasse Last-/Parallel-bedingt (4 Shards gleichzeitig in CI), kein Beleg für eine Welle-2/3-Ursache. Nicht gefixt; Wurzel bleibt bei der bestehenden Zeile offen.
- [ ] **`check:e2e-shards` deckelt Laufzeit je Shard** — Balance über mehrere CI-Läufe mitteln (Streuung ≈ verschobener Betrag).

- [ ] **Flackernde Browser-Tests, Wurzel messen** *(Fund des neuen Flacker-Wächters, Lauf 34231123731, 8.9.2026; Ausnahmen in `e2e/flake-ausnahmen.json` bis 8.10.2026)* — `leser-r1-r2.e2e.ts` «Ohne aktive Suche kein Zähler …» und `w224-reiterverhalten.e2e.ts` «(d) ⌘/Ctrl+Enter öffnet neuen Reiter» wurden nur im Wiederholungsversuch grün. Wurzel je Spec messen (Timing/Race, nicht «retry»), dann Ausnahme streichen; verfällt die Ausnahme ungemessen, wird der Wächter rot. Klasse wie «E2E-Flake Shard 2/8 — Wurzel messen statt neu starten».

  **Nachtrag 8.9.2026 (Messung Orchestrator, drei Wächter-Läufe im eigenen PR #779):** die Browser-Suite flackert breit — 6 verschiedene Specs nur im Retry grün, je Lauf andere: `leser-r1-r2.e2e.ts`, `w224-reiterverhalten.e2e.ts`, `leser-v3-blatt.e2e.ts`, `leser-v3-suche-ohne-gliederung.e2e.ts`, `w224-r11-reiterleiste.e2e.ts`, `leser-v3-panel-zaehler.e2e.ts`. Ein harter Wächter mit Ausnahmeliste kann so nicht landen, ohne dass die Liste jeden Lauf wächst. **Entscheid (abweichend von «sofort rot», offengelegt):** Melde-Modus über `e2e/flake-modus.json` — bis dahin nur `::warning`/Exit 0, danach hart wie oben. **Stichtag hart 22.9.2026.** Auftrag: Wurzel je Spec messen (Race/Timing), nicht Ausnahmen sammeln.

  **Nachtrag 19.9.2026 (PR #917, Lauf 35445618485) — Spur mit fester Zeichenzahl:**
  `e2e/leser-r1-r2.e2e.ts:420` (S8 «Normtext-DOM unverändert») war im PR-Lauf **auch im
  automatischen Retry rot**; `gh run rerun --failed` lief danach grün. Die verglichene
  DOM-Signatur weicht in vielen Artikeln um **genau +27 Zeichen** ab — art-2 2989→3016,
  art-7 1006→1033, art-8 1154→1181, art-10_a 444→471, art-12 1819→1846, art-15 625→652.
  Ein konstanter Betrag über verschiedene Artikel ist kein Timing-Zufall, sondern ein
  nachladendes Element fester Länge in Artikeln mit einem gemeinsamen Merkmal; naheliegend
  ist, dass der Test den `vorher`-Wert nimmt, bevor dieses Element steht. **Das ist eine
  Hypothese, kein Beleg** — das Merkmal ist nicht bestimmt und das Element nicht benannt.
  Zwei weitere Specs waren im selben Lauf nur im Retry grün: `e2e/rechtsprechung.e2e.ts:107`
  und `e2e/uinav-j-rechtsprechung.e2e.ts:30`.
  **Warum das seit 19.9.2026 schwerer wiegt:** unter der Merge-Queue prüft jeder Eintrag alle
  vier Required-Checks noch einmal; ein Flake wirft den Eintrag aus der Warteschlange und
  lässt die Nachfolger neu bauen — der Schaden ist nicht mehr ein Retry, sondern eine Kette.

  **Wurzel gefunden 19.9.2026 — `leser-r1-r2.e2e.ts` «Ohne aktive Suche kein Zähler …» (1 von 2 Ausnahmen erledigt).** Anlass: der Fall fiel am 19.9.2026 zweimal HART (auch im Retry rot) — Läufe 35445618485 (PR #917) und 35446174293 (PR #920), je Shard 4/4; seit der Merge-Queue wirft ein solcher Fehlschlag Queue-Einträge und baut Nachfolger neu.
  *Befund, gemessen:* in genau sechs Artikeln wuchs die Wortlaut-Signatur um exakt 27 Zeichen (art-2 2989→3016 · art-7 1006→1033 · art-8 1154→1181 · art-10_a 444→471 · art-12 1819→1846 · art-15 625→652 — byte-gleich mit dem CI-Log). Der Zusatz ist «FassungGilt seit TT.MM.JJJJ» aus `ArtikelHistorieZeile` (`src/pages/gesetz-leser/parts/ArtikelHistorie.tsx`) im Druck-Wrapper `[data-hist-druck]` (`src/pages/gesetz-leser/parts/ArtikelLeser.tsx`, `hidden print:block`). Betroffen ist genau die Artikelmenge mit Eintrag in `public/normtext/historie/BGFA.json`; der Shard wird idle geladen und trifft auf einem langsamen Runner erst NACH der `vorher`-Messung ein.
  *Urteil: TEST-Fehler, kein App-Defekt.* Der Wrapper ist am Bildschirm in jeder Vermerke-Stellung `display:none`, und der Such-Walker der App überspringt nicht gerenderte Teilbäume ohnehin (`istGerendert`, `src/pages/gesetz-leser/suchHighlight.ts`) — dort wird nie gemalt, gezählt oder hingesprungen. Die Signatur des Tests war als einzige der drei Walker-Stellen ohne `display:none`-Regel und mass damit eine Fläche, die die Suche gar nicht erreichen kann.
  *Fix:* `signatur()` schneidet `display:none`-Teilbäume ab — dieselbe Regel, die `malbareFundstellen` in derselben Datei und `istGerendert` in der App schon führen. Kein `waitForTimeout`, kein angehobenes Budget, Aussage unverändert scharf.
  *Belege:* Rot vor dem Fix — echte Rückstands-Mutation in `setzeSuchHighlightRanges` (Textknoten beim Abräumen der Suche), geschärfter Test rot mit art-2 1610→1621, Exit 1. Die CI-Reihenfolge lokal deterministisch nachgestellt (Historie-Shard bis nach der `vorher`-Messung angehalten, 6× CPU-Drossel): alte Signatur divergiert byte-gleich mit dem CI-Log, neue bleibt konstant. Grün nach dem Fix: 20/20 Wiederholungen des Falls, 20/20 unter Drossel + angehaltenem Shard, volle Spec 11/11. Ausnahme in `e2e/flake-ausnahmen.json` gestrichen (nur diese eine; `w224-reiterverhalten.e2e.ts` bleibt offen).

**Befunde 14.9.2026 (Phase-1-Welle #846–#869):**

- [ ] **§17 · Doku-PR gegen offenen Bau-PR: nicht BEHIND, sondern DIRTY** *(Vorfall 14.9.2026, #870 gegen #869)* — der Session-Abschluss-PR #870 schrieb die ROADMAP-Zeile «Einzelartikel-Ansicht» um, die der zu diesem Zeitpunkt offene Bau-PR #869 ebenfalls anfasste. #870 landete zuerst (Auto-Merge, alle Tore grün), #869 stand danach auf `DIRTY` statt `BEHIND` und braucht einen Rebase von Hand durch die bauende Session — deren Worktree `LexMetrik-wt-einzelartikel` von aussen nicht angefasst werden darf (§12). Das ist die teure Schwester der BEHIND-Schleife (`QS-BASIS`): BEHIND kostet einen CI-Lauf, DIRTY kostet eine fremde Session. **Regel bis zum Wurzel-Fix:** vor dem Schreiben eines Doku-PR `gh pr list --state open --json number,files` gegen die geplanten ZEILEN halten — §0 Ziff. 5 nennt diese Sonde bereits für Bau-Dateien, sie gilt für Steuer-Doku genauso — und die Zeile eines offenen PR entweder unangetastet lassen oder erst nach dessen Landung buchen. **Wurzel-Kandidat:** die Plan-Buchungen einer Abschluss-Session laufen erst nach der letzten Bau-Landung, nicht parallel dazu.

- [ ] **`confidence-logik.ts:78` — «`[N]` ist nie legitimer Normtext» ist falsch** *(Prüfer #848)* — FIDLEV Anh. 9 (SR 950.11, `eli/cc/2019/759`, Stand 1.1.2022) führt amtlich «[1] Jahr». Das Flag ist dort ein Falsch-Positiv; Kommentar und Klassenbeschreibung korrigieren, nicht die Daten.
- [ ] **VD-vd-106879 Art. 81: echte Tabellen-Verklebung auto-akzeptiert** *(Prüfer #848)* — «332'000333'000…» ist eine harte Extraktionslücke, wurde aber nur als weicher Fall geführt und mit 0.95 automatisch akzeptiert. Schwelle und Klassenzuordnung prüfen.
- [ ] **`confidence.json` ohne Frische-Tor** *(§17, Prüfer #848)* — das Feld `erzeugt` wird per `--datum` von Hand gesetzt, nichts koppelt es an Korpus oder `daten-manifest.json`; darum alterte die Datei drei Monate unbemerkt. Tor oder Kopplung, einmal rot zeigen (§6.7). Dach: `W2·27-BUND-FERTIG`.
- [ ] **VIL trägt den Token `27_bbis`** *(Fixer #852, klein)* — Tokenisierungs-Ausreisser (gemeint ist vermutlich «Art. 27b bis»); gegen Fedlex prüfen und im Generator fixen, nie in der Projektion (§5). Kandidat `W2·5l-NORMTEXT-B2` / `QS-KORPUS`.
- [ ] **`--erlass=` filtert nur die Bund-Route** *(§17, Fixer #860)* — beim gezielten Neulauf laufen HTM-, ZH- und PDF-Adapter mit; im Lauf vom 14.9.2026 hätte das VS-173.8-fr «RS» → «SR» geändert. Filter auf alle Routen ziehen. Auch als ROADMAP-Zeile unter `QS-KORPUS`.
- [ ] **`scripts/ui-normzitate-kommentare.ts:40` — Hand-Lexer wertet `//` in URLs als Kommentar** *(Prüfer #856, latent)* — steht in ausgeliefertem JSX-Text eine URL (`https://…`) und im selben Text ein falsches Zitat, gilt der Rest der Zeile als Kommentar und das Tor bleibt grün. **Heute 0 reale Fälle.** Fix: `//` nur dann als Kommentar werten, wenn kein `:` unmittelbar vorangeht.
- [ ] **Altzahl «10 254» an zwei Stellen** *(Prüfer #856, Doku)* — `src/components/normtext/NormChip.tsx:105` und der ROADMAP-Text zu Z6c nannten «39 von 10 254»; massgeblich ist das Artefakt nach PR #852: **10 276** prüfbare Ziele. ROADMAP ist nachgezogen, der Code-Kommentar noch nicht.
- [x] **97 falsche Self-Links in Verordnungen** *(Befund und Fix #864, 14.9.2026)* — «des Gesetzes»-Glieder in Verordnungen zeigten auf die Verordnung selbst statt auf das im Ingress legaldefinierte Trägergesetz. §1-relevant (ein stumm falscher Sprung ist schlimmer als kein Sprung), behoben mit PR #864 (`6fb37368b`). Als behobener Falschlink-Fall hier geführt, damit die Klasse auffindbar bleibt.

### §4.R — Reiterleiste: sechs stille Fehler (13.9.2026)

Anlass: Sichtprüfung im Dev-Server (7 Reiter, Handy-Breite, Kontextmenü, Überlauf-Blatt) plus
read-only Code-Zweitblick (Opus) am 13.9.2026; Auftrag David «bau 1 bis 6». Alles Darstellungs-
schicht (`src/components/layout/Reiterleiste.tsx`, `reiterleiste/*`, `useTabs.ts`, `src/lib/tabs.ts`),
kein Risikopfad. Reihenfolge = Priorität; je Punkt ein eigener Commit mit Rot-Beweis (§6.7), wo ein
Test die Eigenschaft pinnen kann.

1. **Alt-Kürzel am Mac.** `Reiterleiste.tsx` (Tastatur-Effekt, ~Z. 280–332) prüft `e.key === 't'`,
   `'w'`, `/^[1-9]$/`. macOS liefert bei Option+Buchstabe/Ziffer das Sonderzeichen («†», «¡» …) als
   `key`, nicht den Buchstaben ⇒ Alt+T / Alt+W / Alt+1…9 tot am Mac, CI (Linux) grün. Fix: auf
   `e.code` (`KeyT`, `KeyW`, `Digit1`…`Digit9`) prüfen, `e.key` als Fallback für exotische Layouts
   behalten. Test: `KeyboardEvent` mit `{ altKey:true, key:'†', code:'KeyT' }` muss neuen Reiter
   öffnen (vorher rot). Beworbene Kürzel-Liste im Blatt (`ReiterBlatt.tsx`) unverändert.
2. **Render-Kaskade beim Scrollen.** Scroll-Spy schreibt alle 200 ms die Lesestellung nach
   `localStorage` (`src/pages/gesetz-leser/inhalt-hooks.tsx` ~Z. 384); `useTabs.ts` (Z. 12–14) setzt
   danach IMMER ein neues Array, der Manifest-Effekt in `Reiterleiste.tsx` (~Z. 100–125) hängt an
   `[tabs]` und setzt IMMER ein neues Objekt ⇒ Leiste samt Fenster-Vermessung rendert ~5×/s.
   Fix: strukturelle Gleichheit in `useTabs` (gleiche Schlüssel + gleiche Titel/Anker ⇒ altes Array
   behalten); Manifest-Effekt an eine stabile Kennung (z. B. verkettete Pfad-Schlüssel) statt an
   `tabs`. Beleg: Render-Zähler-Test oder gemessene Renders vor/nach im PR-Text.
3. **Nach dem Schliessen rechten Nachbarn aktivieren** (Chrome/Firefox-Norm), heute links
   (`Reiterleiste.tsx` ~Z. 189, `schliessen`). Ist kein rechter Nachbar da, der linke. Test pinnt
   beides.
4. **Stille Kappungs-Verluste** (`src/lib/tabs.ts`): `ladeTabs` `.slice(0, MAX)` (~Z. 475) und
   `stelleLetztenWiederHer` (~Z. 739) behalten die ERSTEN 50, `merkeTab` `.slice(-MAX)` (~Z. 536)
   die LETZTEN 50 — zwei Richtungen; Gekapptes fällt ohne Ring-Eintrag weg. `leereTabs` legt alle in
   den Ring, `schreibeGeschlossene` kappt auf `ZU_MAX = 10` (~Z. 677, 699–701) ⇒ «Alle schliessen»
   mit >10 Reitern nur zu 10 umkehrbar. Fix: EINE Richtung (die ältesten fallen, wie bei `merkeTab`),
   Gekapptes in den Ring; `ZU_MAX` so, dass «Alle schliessen» vollständig umkehrbar ist (Ring-Kappe
   ≥ Reiter-Kappe, oder «Alle schliessen» legt einen Sammel-Eintrag ab). Tests je Kappe rot→grün.

   **Nachtrag 13.9.2026 (beim Bau gemessen, Zeilen oben unverändert):** gebaut wie oben — eine
   Richtung (`slice(-MAX)` überall), Gekapptes in den Ring, `ZU_MAX = MAX`. Dabei ist ein ZWEITER,
   ÄLTERER Defekt aufgefallen, der NICHT Teil dieses Schritts ist: `stelleLetztenWiederHer` setzt
   nach einem «Alle schliessen» verschachtelt ein (r49, r48 … statt r0, r1 …). Ursache ist die
   Positions-Regel selbst — `leereTabs` legt die Reiter mit ihren Indizes 0…n in den Ring, die
   Wiederherstellung zieht sie vom ENDE und setzt auf `min(index, länge)`, was nur aufgeht, solange
   die übrigen Reiter noch stehen. Reproduzierbar schon bei drei Reitern; der Kommentar an
   `leereTabs` («Position um Position stimmt») ist insoweit falsch. Der W2·18-Test prüft darum
   Vollständigkeit (50 von 50 zurück statt 10 von 50), nicht die Reihenfolge. Eigener Folgeschritt.
5. **Gestutzte Beschriftungen ab 7 Reitern.** Gemessen 13.9.2026 bei 1024 px: Reiter zeigen «St…»,
   «ZP…», «Sa…»; Duplikate «ZPO-Fristen (2)» und «(3)» sind visuell identisch, weil die Nummer hinten
   abgeschnitten wird. Fix (a) Mindestbreite je Reiter so, dass ≥ 6–8 Zeichen sichtbar bleiben, und
   früher ins «+N»-Blatt (Fenster-Messung `useReiterFenster.ts`); (b) Instanz-Nummer bei Duplikaten
   vorne oder als nicht-kürzbares Suffix (`reiterKurzformText` in `src/lib/tabs.ts`). Sichtbeleg
   (Screenshot 7 Reiter bei 1024 px) im PR.
6. **Blatt-Filter beim Schliessen leeren.** Das Suchfeld des «+N»-Blatts behält seinen Wert
   (`Reiterleiste.tsx` ~Z. 71, 419, 727); beim nächsten Öffnen «fehlen» Reiter. Fix: Filter auf
   Schliessen zurücksetzen. Test pinnt es.

Nicht Teil dieses Schritts (eigener Roadmap-Schritt, Vorschläge 7–9 vom 13.9.2026): Umordnen über die
Fenstergrenze hinaus, Reiter als Links, Umordnen auf Touch. Bereits geplant: Anheften/Arbeitsmappe
(`W2·25-ARBEITSMAPPE`).

### §4.R2 — Reiterleiste Welle 2: Tastatur, Pendeln, Bewegung, Ring-Ordnung (13.9.2026)

Anlass: Auftrag David 13.9.2026 «recherchiere, was eine perfekte Tabliste ausmacht, und setz das um»
+ «bau insgesamt weiter an der Tabliste bis ich stop sage». Grundlage: Recherche-Datei
`scratchpad/reiter-recherche-2026-09-13.md` (14 Quellen; Lücke 2 «Andere schliessen fehlt» ist
widerlegt, `schliesseAndere` existiert) und Nachfunde aus Welle 1 (§4.R). Baut auf Welle 1 auf
(Branch `feat/w2-18-reiterleiste-teil2`). Darstellungsschicht, kein Risikopfad. Je Punkt ein Commit
mit Rot-Beweis.

1. **Pfeiltasten im Reiterstreifen (roving tabindex, WAI-ARIA APG Tabs/Toolbar).** Liegt der Fokus
   auf einem Reiter, wechseln ←/→ den Fokus (nicht die Auswahl) auf den Nachbarreiter, Home/End auf
   den ersten/letzten sichtbaren; Enter/Space aktivieren; Delete schliesst den fokussierten Reiter.
   Nur EIN Reiter im Tab-Ring (`tabindex=0`, übrige −1). ⇧+←/→ (Umordnen) bleibt unverändert.
   `nav`-Semantik bleibt (kein `role=tablist`, weil Navigation, nicht Panel-Umschaltung).
2. **Pendeln zwischen den zwei zuletzt aktiven Reitern (MRU).** Ein Kürzel springt zum vorher aktiven
   Reiter und zurück (Chrome «Ctrl+Tab in MRU» / VS Code «Ctrl+Tab»). Tastenwahl: `Alt+Tab` fängt das
   OS auf Windows/Linux, `Ctrl+Tab` der Browser ⇒ `Alt+Q` (frei in Chrome/Firefox/Safari auf allen
   drei Systemen; vor dem Bau prüfen, dass `Alt+Q` auf macOS nicht «œ»-Konflikt hat — `e.code` löst
   das). MRU-Liste in `lib/tabs.ts` (persistiert, max. 10), Aktualisierung beim Aktiv-Wechsel.
   Kürzel in die Liste des «+N»-Blatts aufnehmen.
3. **`prefers-reduced-motion`.** Ziehen/Einfügemarke/Blatt-Öffnen/Reiter-Übergänge ohne Bewegung,
   wenn das System es verlangt (`@media (prefers-reduced-motion: reduce)` in `index.css` bzw.
   Tailwind `motion-reduce:`). Test: Playwright `emulateMedia({ reducedMotion: 'reduce' })`,
   gemessene `transition-duration` 0s.
   — **Korrektur 13.9.2026 (Zeilen darüber unverändert, §2b), Anlass: Ist-Messung vor dem Bau.**
   Die Zusage wird bereits eingelöst, und zwar GLOBAL: `src/index.css` setzt unter `reduce` für
   `*, *::before, *::after` `animation-duration`/`transition-duration` auf `.001ms !important`.
   GEMESSEN (Chromium, Dev-Server 5182, vier Reiter + offenes Blatt, `reduce` gegen
   `no-preference`): Griffe und «+» 0.15 s → `1e-06s`; Reiterhülle, Einfügemarke, Blatt und Scrim
   messen in BEIDEN Zuständen 0 s, `scroll-behavior` des Streifens ist `auto` (das Rad setzt
   `scrollLeft` hart). Die erwarteten «0s» sind also `1e-06s` — und das mit Absicht, damit
   `transitionend` weiter feuert. ZU BAUEN war darum keine zweite, reiter-eigene Regel (das wäre
   die zweite Wahrheit, §5), sondern der fehlende WÄCHTER: `e2e/w224-r11-reiterleiste.e2e.ts`
   «W2·18 Welle 2 Punkt 3» misst die Zusage über alle Flächen von Leiste und Blatt; rot, sobald
   die globale Regel fällt (einmal gefahren: «längster Übergang: BUTTON.rl-plus rl-plus-solo,
   0.15 > 0.01»).
4. **Ring-Ordnung nach «Alle schliessen».** `stelleLetztenWiederHer` setzt verschachtelt ein (r49,
   r48 … statt r0, r1 …; Nachtrag §4.R Welle 1). Fix in `lib/tabs.ts`: Position beim Ablegen so
   merken, dass das Wiederherstellen in Ur-Reihenfolge landet; Kommentar an `leereTabs` berichtigen.
   Test: 3 Reiter → Alle schliessen → 3× Wiederherstellen ⇒ Ur-Reihenfolge.
5. **Kontextmenü vorladen.** Der lazy Chunk `ReiterMenue` lädt erst beim ersten Rechtsklick (13.9.2026
   gemessen: erster Rechtsklick zeigte nichts, zweiter das Menü). Fix: `import()` beim ersten
   `pointerenter` auf die Leiste bzw. beim `contextmenu` sofort anstossen und das Menü nach dem Laden
   öffnen, nicht verwerfen. Start-Chunk-Budget (60 KB gzip, `check:perf-budget`) darf nicht wachsen.
   — **Korrektur 13.9.2026 (Zeilen darüber unverändert, §2b), Anlass: der vorgeschlagene Fix hat die
   Ursache nur zur Hälfte getroffen.** Nachgemessen IN der Seite (MutationObserver von `contextmenu`
   bis `[role=menu]` im DOM; gebautes dist/ hinter `vite preview`, Chromium, vier Reiter): 1.
   Rechtsklick 320 ms · 2. 10 ms · 3. 8 ms. Das Menü wurde also nie verworfen, es kam zu spät — und
   MIT vorgeladenem Chunk blieben es 316 ms (gegen 322 ohne). Die zweite, grössere Ursache ist
   `React.lazy`/`Suspense`: der erste Render ruft den Loader, bekommt ein bereits erfülltes
   Versprechen und suspendiert trotzdem; der Inhalt kommt erst im Nachlauf nach dem Fallback.
   GEBAUT ist darum beides — Vorlauf beim Betreten der Leiste (Zeiger ODER Fokus, sonst hätte
   Shift+F10 keinen) UND der dynamische Import von Hand statt `lazy`/`Suspense`, so dass das Menü im
   selben Commit wie der Rechtsklick rendert. Danach: 1. Rechtsklick 17 ms · 2. 9 ms · 3. 9 ms.
   Entry-Chunk unverändert 54.9 KB gzip (Budget 60.0), der Menü-Chunk bleibt ein eigener (923 B gzip).
6. **Reiter-Kopf nie als blosses «…».** Der gekürzte Gerichts-/Erlass-Kopf darf weichen (F6), aber
   ein alleinstehendes Auslassungszeichen wird nicht gezeigt — dann ganz ausblenden.
   — **Korrektur 13.9.2026 (Zeilen darüber unverändert, §2b), Anlass: der Befund ist auf diesem
   Stand nicht mehr reproduzierbar, und sein Verschwinden hat einen Preis, den ein anderer gerade
   bezahlt.** GEMESSEN (gebautes dist/, Chromium, sechs Reiter, davon vier mit Kopf, bei 1440 · 1024
   · 390 · 360 · 320 · 300 · 280 · 260 · 240 · 200 px): JEDER gezeigte Kopf steht in voller Breite —
   «OGer AG» 58/58 px, «AppGer BS» 71/71 px, «BGE» 30/30 px. Die Hülle schrumpft seit Welle 1 gar
   nicht mehr unter ihren Inhalt (`.rl-reiter { min-width: min-content }`, Commit `6f7eb49c0`):
   statt zu quetschen, schickt das Fenster die überzähligen Reiter ins «+N»-Blatt. Mit dem BODEN VOR
   Welle 1 (`min-width: 5rem`) ist der Befund dagegen sofort da — @1024 schrumpft «BGE» auf 10 px,
   schmaler als das Auslassungszeichen selbst (12 px).
   ZWEI FOLGEN: (a) eine neue Regel wäre ein Fix ohne gesehenen Fehlschlag (§0.2) — GEBAUT ist
   darum nur der WÄCHTER `e2e/w224-r13-reiter.e2e.ts` «W2·18 Welle 2 Punkt 6», der über vier
   Breiten misst, dass jeder gezeigte Kopf mindestens ein Zeichen plus Auslassung trägt (rot
   gefahren am 5-rem-Boden: «Kopf «BGE» … 8 px, nötig 24 px»). (b) Genau diese `min-content`-Regel
   ist zugleich die Ursache des R8-Sweep-Befundes (`a-ueberlauf-ohne-scroller`, 18 Funde bei 320/390
   px), an dem parallel gearbeitet wird: wer den Boden wieder schrumpfbar macht, HOLT DEN
   KOPF-BEFUND ZURÜCK und wird von diesem Wächter rot gestellt. Das «dann ganz ausblenden» gehört
   folglich in DIESEN Fix — die Schwelle hängt am neuen Boden und lässt sich vorher nicht wählen.
   Ein `min-width` am Kopf wäre hier ausdrücklich der falsche Weg: er hebt die `min-content`-Breite
   des Reiters und verschärft damit den Überlauf, den der andere Fix gerade abstellt.
   — **Nachtrag 13.9.2026 nach dem Abgleich mit Welle 1 (Zeilen darüber unverändert, §2b), Anlass:
   der erwartete Rot-Umschlag ist AUSGEBLIEBEN — und zwar aus einem Grund, der die Bedingung des
   Fixes aufhebt.** Die Erwartung war: Welle 1 macht den Reiter wieder schrumpfbar, der Wächter
   stellt daraufhin den Kopf-Befund rot, und «dann ganz ausblenden» wird in DIESEM Zug gebaut.
   Welle 1 hat den Boden aber nur für die Reiter OHNE Kopf schrumpfbar gemacht (`reiterBoden`,
   eine `calc()`-Zahl in `Reiter.tsx`); die Reiter MIT Kopf blieben ausdrücklich bei
   `.rl-reiter { min-width: auto }` — dort ist der Kern `shrink-0`, und die automatische Rechnung
   zählt Kern UND Kopf in voller Breite (Commit `736f1a9ff`, Abschnitt «Reiter MIT Kopf»).
   GEMESSEN auf dem abgeglichenen Stand (gebautes dist/, Chromium, die sechs Reiter des Wächters,
   @1440 · 1024 · 390 · 320): JEDER gezeigte Kopf steht in voller Breite, `breite == scrollWidth` —
   «OGer AG» 58/58 px, «AppGer BS» 71/71 px, «BGE» 30/30 px. Gequetscht wird kein Kopf; statt zu
   quetschen schickt das Fenster die überzähligen Reiter ins «+N»-Blatt
   (`data-reiter-fenster` 0/6/6 · 0/4/6 · 0/1/6 · 0/1/6). Der Befund ist also auch nach Welle 1
   nicht reproduzierbar, und eine Ausblend-Regel wäre WEITERHIN ein Fix ohne gesehenen Fehlschlag
   (§0.2) — und dazu eine Regel, die nicht feuern kann (§17-Gegengewicht, §6.7). GEBAUT ist darum
   erneut nichts; der Wächter bleibt allein.
   DASS DER WÄCHTER LEBT, IST AUF DIESEM STAND NACHGEWIESEN (§6.7, nicht bloss aus der Vorrunde
   übernommen): `.rl-reiter { min-width: auto }` → `5rem`, neu gebaut, Wächter gefahren ⇒ 3 von 4
   Breiten rot — «Kopf «BGE» an /rechtsprechung/bge_146_III_1: 7 px, nötig 22 px» (@1024),
   «Kopf «OGer AG» an /rechtsprechung/ag_gerichte_HOR_2024_19: 0 px, nötig 23 px» (@390 und @320);
   @1440 blieb grün. Mutation danach zurückgenommen, neu gebaut.
   NEUER BEFUND AUS DERSELBEN MESSUNG (nicht in diesem Zug gebaut, weil er die Zusage «Wächter
   unverändert grün» bricht — s. u.): @320 läuft ein EINZELNER Entscheid-Reiter über den Streifen,
   GEMESSEN `/rechtsprechung/ag_gerichte_HOR_2024_19` (Kopf «OGer AG», Kern «HOR.2024.19»):
   Streifen `scrollWidth 192` gegen `clientWidth 171`. Der Streifen ist `overflow-x: auto`, trägt
   aber `.lc-reiter-scroll` — und die Klasse blendet den Scrollbalken aus
   (`scrollbar-width: none`, `::-webkit-scrollbar { display: none }`, `index.css`). Das ist
   Kategorie `a-ueberlauf-ohne-scroller`, dieselbe, die Welle 1 für die Reiter OHNE Kopf gerade
   abgestellt hat: der Detektor verlangt neben `overflow-x: auto` die Affordanz-Klasse
   `lc-scrollrand-x` (`e2e/helpers/abschnittMessung.ts`). Der R8-Sweep sieht ihn NICHT, weil seine
   beiden Entscheid-Vertreter (`bge_152_V_52`, `bger_1B_278_2022`) kurze Köpfe tragen und in 171 px
   passen — der Sweep meldet auf diesem Stand 0 Funde.
   HIER, UND NUR HIER, HÄTTE «der Kopf weicht ganz» eine Aufgabe: fiele «OGer AG» (58 px) weg,
   bliebe der Reiter bei ~130 px und passte — genau die F6-Reihenfolge (erst der Kopf, dann der
   Kern). Der Auslöser wäre aber nicht «der Kopf wäre nur noch ein «…»» (das ist er nie), sondern
   «das Fenster kann nicht weiter schrumpfen und läuft immer noch über» — eine ANDERE Regel an
   einer anderen Stelle (`useReiterFenster`, mit Epochen-Riegel gegen das Pendeln «Kopf weg →
   passt → Kopf da → passt nicht»). Und sie stellt den Wächter oben rot: @320 zeigt der Streifen
   genau EINEN Reiter, dessen Kopf dann verschwindet, worauf dessen Sonde 0 Köpfe findet und an
   `expect(koepfe.length).toBeGreaterThan(0)` scheitert. Diese Zusicherung müsste im selben,
   ERKLÄRTEN Schritt nachgezogen werden (§6.3: Teständerung = fachliche Änderung) — z. B. «bei
   1440/1024 müssen Köpfe da sein; wo keiner steht, darf der Streifen nicht überlaufen». Das ist
   ein eigener Bauschritt, kein Nebenprodukt eines Abgleichs.**
7. **Trefferflächen ⧉/✕ gegen WCAG 2.5.8 prüfen.** `komfort={false}` ist begründet (A3-1: das
   Pseudo-Element nähme Nachbarn die Klicks). Prüfen, ob 24×24 CSS-px OHNE Pseudo-Element erreichbar
   ist (Padding innerhalb des Reiters); wenn ja, bauen; wenn nein, Ausnahme mit Abstand-Regel
   (2.5.8 «spacing») im Kommentar dokumentieren, nicht still kippen (§0.2 UI-Befunde).
   — **Ergebnis 13.9.2026 (Zeilen darüber unverändert, §2b):** GEMESSEN (gebautes dist/, Chromium,
   @1440 und @1024, drei Reiter) — ✕ 24 × 24 (bringt `.lc-schliessknopf` über `--tap-ziel` mit), ⧉
   20 × 24, also vier Pixel unter der AA-Untergrenze; Lücke zwischen den beiden Griffen 0 px, die
   «spacing»-Ausnahme trägt damit NICHT. 24 px sind ohne Pseudo-Element erreichbar — GEBAUT als
   echte Mindestbox am ⧉ (`min-h/min-w: var(--tap-ziel)`, die Zahl bleibt im Token, §5/D2), danach
   beide Griffe 24 × 24. Die A3-1-Begründung für `komfort={false}` bleibt unberührt: das
   Pseudo-Element hätte den Nachbarn die Klicks genommen, die Mindestbox tut das nicht. Wächter:
   `e2e/w224-r13-reiter.e2e.ts` «W2·18 Welle 2 Punkt 7». Breiten-Nebenwirkung: +4 px je Reiter, nur
   ab `lg` (darunter ist der Griff nicht gerendert) — die Sweep-Breiten 320/390 px sind unberührt.

Welle 3 (nach dieser): Umordnen über die Fenstergrenze hinaus (Auto-Scroll am Rand, Ziehen ins/aus
dem Blatt), Reiter als Links, Hover-Karte mit Volltitel + Stand, Touch-Umordnen.

### §4.R3 — Reiterleiste Welle 3: Umordnen, Links, Hover-Karte, Touch, Kopf-Überlauf (13.9.2026)

Anlass: Auftrag David 13.9.2026 «bau insgesamt weiter an der Tabliste bis ich stop sage». Grundlage:
Vorschläge 7–9 der Sichtprüfung, Recherche-Datei (Hover-Karte, Tastaturäquivalenz) und der Nebenfund
aus dem Welle-2-Abgleich (§4.R2 Punkt 6, Nachtrag). Baut auf Welle 2 auf (Branch
`feat/w2-18-reiterleiste-teil3`). Darstellungsschicht, kein Risikopfad. Je Punkt ein Commit mit
Rot-Beweis; Rot-Beweise auf DIESEM Stand fahren, nie übernehmen.

1. **Einzelner Entscheid-Reiter läuft @320 über** (Welle-2-Abgleich, gemessen
   `/rechtsprechung/ag_gerichte_HOR_2024_19`: Streifen scrollWidth 192 gegen clientWidth 171; Kopf
   «OGer AG» 58 px). Regel F6 «erst weicht der Kopf, dann wird der Kern gekürzt» wirklich umsetzen:
   ist das Fenster am Anschlag und der Streifen überläuft trotzdem, weicht der Kopf des betroffenen
   Reiters ganz (Epochen-Riegel gegen Pendeln in `useReiterFenster.ts`). Der Wächter «kein Kopf als
   blosses …» (Welle 2) erwartet @320 `koepfe.length > 0` — diese Erwartung ist eine fachliche
   Änderung und wird im Commit deklariert (§6.3): @320 darf der Kopf fehlen, wenn der Streifen sonst
   überliefe. Zusätzlich den R8-Sweep (`e2e/kein-abschnitt.e2e.ts`) um einen Entscheid-Vertreter mit
   langem Gerichtskopf ergänzen (dritter Vertreter), damit die Klasse künftig selbst gefunden wird.
   — **Nachtrag 13.9.2026 (Zeilen darüber unverändert, §2b), Anlass: der R8-Sweep hat am Schluss
   des Auftrags ein ZWEITES Gesicht desselben Befundes gezeigt.** Der Fall oben läuft über den
   STREIFEN über; hier PASST der Reiterkasten, und sein Inhalt blutet heraus. GEMESSEN
   `/rechtsprechung/bger_1B_278_2022` @390: Kasten 240/240, der Link darin trug 217 px Inhalt in
   einem 212-px-Kasten, Kopf «BGer» auf Breite 0 (scrollWidth 34) — Sweep-Meldungen
   «[a-ueberlauf-ohne-scroller] a.flex … scrollWidth=217 clientWidth=212» und
   «[f-reiter-mitten-im-wort] … Schnitt nach «Reiter 1: BGer 1B_278/2022 vo»». Der Befund ist ÄLTER
   als dieser Auftrag und NICHT vom Rollenwechsel (Punkt 3) verursacht: A/B in derselben Seite
   (derselbe Knoten einmal als `<a>`, einmal als `<button>`) ergibt zweimal 217/212. Sichtbar wurde
   er erst, weil die Reiter-Sonde des Detektors auf `nav[aria-label="Offene Reiter"] a` greift — und
   Reiter waren bis Punkt 3 keine Links; dass der erste Sweep-Lauf dieses Auftrags trotzdem grün
   war, liegt an der lazy geladenen Beschriftung (GEMESSEN: ~0 ms «Entscheid öffnen» 120/120, ab
   ~200 ms «BGer 1B_278/2022 vom 20. Juni 2022» 217/212 — der Lauf mass davor; die Messung ist also
   zeitabhängig, nicht der Defekt). GEBAUT: `useReiterFenster` prüft am Anschlag BEIDE Gesichter —
   Streifen-Überlauf ODER blutender Inhalt (`inhalt.scrollWidth > clientWidth + TOLERANZ_PX`);
   Epochen-Riegel unverändert. NACHGEMESSEN: @320 171/171, Link 142/142 · @390 240/240, Link
   212/212 (Kern gekürzt, Kopf weg); @1440 unverändert MIT Kopf. Wächter:
   `e2e/w224-r13-reiter.e2e.ts` «der Inhalt eines Entscheid-Reiters bleibt in seinem Kasten» (@320
   und @390), rot gefahren gegen die entschärfte Blutungs-Prüfung: «der Link trug 217 px in 212 px
   … Expected: <= 213, Received: 217».
2. **Umordnen über die Fenstergrenze hinaus.** Beim Ziehen an den linken/rechten Rand des Streifens
   scrollt der Streifen automatisch (Auto-Scroll, ~8 px je Frame, reduced-motion: sofort); Ablegen auf
   dem «+N»-Knopf hängt den Reiter ans Ende der Ordnung (und damit ins Blatt); im Blatt bleibt das
   Umordnen per ▲▼ (bestehend). Test: 15 Reiter @1024, Reiter 12 per Drag nach vorn ⇒ Position 1.
   — **Korrektur 13.9.2026 (Zeilen darüber unverändert, §2b), Anlass: die Auto-Scroll-Prämisse ist
   durch Messung widerlegt.** GEMESSEN vor dem Bau (gebautes dist/, Chromium, 15 Reiter, aktiv
   Nr. 12): der Streifen scrollt NIE — @1024 `scrollWidth 859 == clientWidth 859` (Fenster 4/8/15),
   @1440 `1275 == 1275` (0/12/15), @390 `241 == 241` (11/1/15). Seit R13-2 ist der Überlauf kein
   Scrollbalken mehr, sondern ein FENSTER über die Speicherordnung; was nicht nebeneinander passt,
   steht im «+N»-Blatt. Ein Auto-Scroll («~8 px je Frame») wäre damit eine Mechanik, die nicht
   feuern kann (§6.7, §17-Gegengewicht) — und die `reduced-motion`-Zusage hätte nichts zu beruhigen.
   GEBAUT ist darum dasselbe Ziel mit dem Mittel, das diese Leiste wirklich hat: am Rand
   (`randSeite`, 32-px-Zone) schiebt sich der GEZOGENE Reiter selbst durch die Speicherordnung,
   einen Platz je 250 ms (`schubZiel`, kein Umlauf an den Enden) — er wandert also über die
   Fenstergrenze hinaus, und das Fenster folgt ihm (R13-3). NACHGEMESSEN: Reiter 12 → Platz 1 in
   2'826 ms (11 Schübe), Fenster 4/8/15 → 0/8/15. Ablegen auf «+N» ist wie beschrieben gebaut
   (umordnen ans Ende, nicht schliessen). Wächter: `e2e/w224-reiter-umordnen-d16.e2e.ts` «W2·18
   Welle 3 Punkt 2» (drei Fälle) und `src/tests/reiter-randschub.test.ts` (9 Fälle).
3. **Reiter als Links.** Der Reiter-Knopf wird ein `<a href>` (React-Router `Link`), Screenreader
   melden «Link», Mittelklick/Ctrl-Klick öffnen wie überall in der App (heute Sonderbehandlung in
   `Reiter.tsx`); Tastatur-Ring aus Welle 2 (roving tabindex) bleibt; Drag-Verhalten bleibt (`draggable`
   auf dem Link, `dragstart` verhindert Navigations-Drag). Bestehende e2e-Selektoren (`getByRole('button',
   {name:/Reiter/})`) werden NICHT umgeschrieben, sondern die Sonden prüfen, ob sie über `nav[aria-label]`
   + Text zugreifen — Änderungen an bestehenden Sonden im Commit deklarieren (§6.3).
   — **Korrektur 13.9.2026 (Zeilen darüber unverändert, §2b), Anlass: zwei Annahmen haben dem
   Ist-Code nicht standgehalten.** (a) MITTELKLICK. Der Fahrplan wollte «Mittelklick/Strg-Klick
   öffnen wie überall in der App». In der Leiste SCHLIESST der Mittelklick seit R11 den Reiter
   (Entscheid David «analog browser») — das stärkere Idiom, und «in einem neuen Reiter öffnen» wäre
   hier ein stiller Leerlauf, weil der Reiter schon offen ist. GEMESSEN nach dem Rollenwechsel
   (gebautes dist/, Chromium, vier Reiter): die app-weite Geste in `TabTracker.tsx` fing den
   Mittelklick auf JEDEM `a[href]` in der Capture-Phase ab (`preventDefault` + `stopPropagation`)
   und endete in `merkeTab` auf einen bereits offenen Pfad — der Reiter blieb stehen statt zu
   schliessen, und der `onAuxClick` des Reiters war tot. GEBAUT: die Geste lässt Anker innerhalb
   von `[data-reiter-streifen]` aus; Mittelklick schliesst wieder, Strg/⌘-Klick fällt an den
   Browser (zweites Browser-Fenster, dieselbe Reiterliste aus demselben localStorage).
   (b) `draggable`. Statt `draggable` AM Link steht dort `draggable={false}`: damit beginnt der Zug
   wie bisher an der ziehbaren Hülle, und der D15-Ghost (`setDragImage` auf den ganzen Reiter)
   bleibt wortgleich. Mit `draggable` am Link wäre der Link die Quelle, Chromium legte
   `text/uri-list` dazu, und der Ghost wäre der Schriftzug.
   (c) SONDEN. Die Rollen-Korrektur IST die Massnahme — `getByRole('button', …)` kann sie nicht
   überleben. Umgestellt auf `link` bzw. `a` sind sechs Stellen in vier Dateien, jede im Commit
   und am Ort deklariert (§6.3); Namen, Reihenfolge und geprüfte Zusagen unverändert.
4. **Hover-Karte.** Statt des zusammengeklebten `title` eine strukturierte Karte nach 600 ms Hover oder
   bei Fokus: Volltitel · Kürzel/Kategorie · Stand (bei Erlassen) · Lesestellung (Art.) · Fenster (◧/◨).
   Kein Layout-Shift, Escape schliesst, verschwindet beim Verlassen; `prefers-reduced-motion` ohne
   Einblendung; auf Touch keine Hover-Karte. Kein neuer Chunk im Start-Bundle über Budget (60 KB);
   die Karte lazy laden wie das Kontextmenü (Vorlauf bei `pointerenter`).
   — **Ergänzung 13.9.2026 (Zeilen darüber unverändert, §2b), Anlass: drei Stellen, an denen der
   Ist-Code die Vorgabe präzisiert hat.** (a) DER `title` BLEIBT. «Statt des zusammengeklebten
   `title`» hätte ihn gestrichen — er ist aber die einzige Auskunft auf Touch (dort gibt es keine
   Karte) UND die Bedingung, unter der der R8-Sweep eine per Ellipse gekappte Stelle nicht als Fund
   zählt (`gekapptMitTitle` in `e2e/helpers/abschnittMessung.ts`). GEBAUT ist darum: der `title`
   steht, und nur solange der Zeiger auf DIESEM Reiter ist, weicht er (sonst legte Chromium ~400 ms
   nach der Karte noch seinen einzeiligen Tooltip darüber). (b) FOKUS NUR SICHTBAR. «bei Fokus»
   allein öffnete die Karte auch beim ANTIPPEN — GEMESSEN (Playwright `hasTouch`, @390): der Tap
   fokussiert den Link, die Karte stand als Fleck. Der Fokus-Weg hängt darum an `:focus-visible`,
   der Unterscheidung, die der Browser ohnehin trifft. (c) VOLLTITEL. Bei einem Erlass ist der
   Verlaufstitel selbst schon das Kürzel («OR»); die Karte zeigt darum zusätzlich den
   ausgeschriebenen Manifest-Titel (`ReiterKarteTeile.langtitel`) — der `title`-Einzeiler rührt ihn
   nicht an und bleibt Zeichen für Zeichen derselbe (bewacht: `src/tests/reiter-karte.test.ts`).
   GEMESSEN nach dem Bau: Karte im DOM 606 · 605 · 604 ms nach `pointerenter` (Vorgabe 600 ms, der
   Vorlauf beim Betreten der Leiste kostet also nichts); eigener Chunk `ReiterKarte` 1'910 B roh /
   0.95 KB gzip; Entry 55.9 KB gzip gegen 60.0 KB Budget. Wächter:
   `e2e/w224-r11-reiterleiste.e2e.ts` «W2·18 Welle 3 Punkt 4» (drei Fälle, darunter Touch).
5. **Touch-Umordnen — günstige Variante.** Kontextmenü (bestehend, auch per Langdruck erreichbar
   machen: 500 ms `pointerdown` ohne Bewegung öffnet es) bekommt «Nach links», «Nach rechts», «An den
   Anfang», «Ans Ende»; damit ist die Reihenfolge auf Touch und per Tastatur änderbar, ohne
   HTML5-Drag. Test: Menü-Eintrag verschiebt korrekt; Langdruck öffnet das Menü (Playwright
   `hasTouch`).
   — **Ergänzung 13.9.2026 (Zeilen darüber unverändert, §2b):** gebaut wie beschrieben, mit zwei
   Präzisierungen aus dem Bau. (a) Die vier Einträge erscheinen nur, WO sie wirken — am ersten
   Reiter gibt es kein «Nach links»/«An den Anfang» (§8); Kürzel Alt+⇧+←/→ stehen daneben, weil das
   Menü der Ort ist, an dem man sie lernt (R13-7). (b) Der Langdruck gilt nur für Finger und Stift
   (`pointerType !== 'mouse'`): unter der gedrückten MAUSTASTE nähme ein aufgehendes Menü dem Ziehen
   den Anfang, und die Maus hat den Rechtsklick. Der `click`, der dem Loslassen folgt, wird
   unterdrückt — sonst navigierte der Langdruck zusätzlich (Chromium schickt ihn nach `pointerup`).
   GEMESSEN: Menü im DOM 516 · 505 · 507 ms nach `pointerdown` (Vorgabe 500 ms), Bewegungstoleranz
   10 px. Wächter: `e2e/w224-reiter-umordnen-d16.e2e.ts` «W2·18 Welle 3 Punkt 5» (drei Fälle,
   darunter `hasTouch`).
6. **`data-`-Anker für Kopf- und Kern-Span** (`data-reiter-teil="kopf|kern|nummer"`), damit Sonden
   nicht an Tailwind-Deckeln hängen; bestehende Sonden auf die Anker umstellen (rein mechanisch, §6.3
   deklariert, Verhalten identisch).
   — **Ergänzung 13.9.2026 (Zeilen darüber unverändert, §2b):** gebaut wie beschrieben. Umgestellt
   sind drei Sonden — zwei in `e2e/w224-r13-reiter.e2e.ts` (hingen an
   `span[class*="max-w-[9rem]"]`) und eine in `src/tests/reiter-beschriftung.test.tsx` (pinnte den
   Markup-Schnipsel der Nummer). Neuer Wächter: `e2e/w224-r13-reiter.e2e.ts` «W2·18 Welle 3
   Punkt 6» — Entscheid (Kopf + Kern), Rechner in zweiter Instanz (Kern + Nummer), Gesetz (nur
   Kern, KEIN leerer Kopf-Anker).

### §4.R4 — Die Marke sagte «dahinter», der Reiter landete «davor» (14.9.2026, behoben)

**Spec:** `e2e/w224-reiter-umordnen-d16.e2e.ts` «INNERHALB der freien Zone zieht es weiter wie vor
W2·25» — auf CI 3/3 rot in PR #859 (Run 34837942934, Shard 2/4, ein reiner Daten-PR) und 2/2 rot in
#855; lokal 4/10 rot (warmer `vite preview`, `--workers=1`, @1440).
**Wurzel:** keine Test-Flake, ein Zusagebruch in der App. Die Reiter-Beschriftung kommt aus einem
nachladenden Manifest — der Entscheid-Reiter wächst von «Entscheid öffnen» (171 px) auf «AppGer BS
BEZ.2022.42» (225 px), alles rechts davon rückt 54 px weiter (`/vorlagen/arbeitsvertrag` von left
429 auf 483). Fällt das Nachladen zwischen das letzte `dragover` und das `drop`, liegt ein ruhender
Zeiger plötzlich in der anderen Ziel-Hälfte (x 529; Mitte vorher 495.5, nachher 549.5);
`Reiter.onDrop` rechnete die Seite aus der frischen Geometrie NEU und fügte «davor» ein, während die
Einfügemarke «dahinter» anzeigte (§8).
**Fix:** `src/components/layout/reiterleiste/Reiter.tsx` — das Loslassen vollzieht die angesagte
Seite aus `ueber`; nur ohne Marke an diesem Reiter bleibt die Geometrie der Anhaltspunkt. Neuer
Wächter im selben Spec-File («was die Einfügemarke ansagt, gilt auch dann, wenn die Leiste danach
rückt»), der den Ruck erzwingt statt auf den Ladezeitpunkt zu warten — ohne Fix 5/5 rot, mit Fix
20/20 grün (ganze Datei: 500/500).
**Nachbarbefund, offen (14.9.2026):** `e2e/uinav-j-rechtsprechung.e2e.ts` «Treffer → Detail →
zurück» zählt im vollen Lauf 201 statt 200 `a[href^="/rechtsprechung/"]` — der eine zusätzliche Link
ist der REITER des besuchten Entscheids. Allein gefahren 4/4 grün, im vollen Lauf 3/3 rot (lokal,
`CI=1`, `--workers=1`, macOS). Verdacht: dieselbe Familie — wie breit die Reiter sind, entscheidet,
welche im Streifen stehen und welche im Überlauf, und das hängt am Ladezeitpunkt der Manifeste. Die
Sonde zählt Reiter-Links mit; ein `:not([data-reiter-streifen] a)` im Selektor wäre die ehrliche
Abgrenzung. Eigener Schritt, nicht in diesem PR.

## §5 — `QS-CODE-PROP` · Eigenschafts-Tests (property-based) für die Rechen-Engines

Entscheid David 7.8.2026: je Engine ein Invarianten-Katalog («eine Frist endet nie vor ihrem
Beginn»), tausende generierte Eingaben. **Die Invarianten-Formulierung ist fachlich** — Katalog mit
Gegenprüfung härten und David vorlegen (§7); je Invariante einmal rot zeigen (§6.7).

Wörtlich aus ROADMAP.md (Stand 29.8.2026):

  - [x] **`nichtKonsolidiert`-Marker bei Staatsverträgen falsch-positiv (FZA, Gegenprüfung S3 16.8.2026)** — `scripts/normtext/revisionen-generieren.ts:233` setzt `dateForce > korpusStand`, kennt aber «in Kraft ≠ angewendet ab» nicht: Fedlex-Konsolidierung 15.12.2020 enthält AS 2021 12 bereits (Fussnote «Bereinigt gemäss Beschluss Nr. 1/2020 … angewendet ab 1. Jan. 2021»), Warnung «seit 01.01.2021 geltend, nicht eingearbeitet» ist falsch (§1/§8). Wurzel-Fix: AS-Fundstelle im Konsolidierungs-XML als Konsolidiert-Beleg werten; Gegenrechnung über alle 87 Marker; Gegenprüfung Pflicht. Ergänzend `revisionen.ts:130` Kommentar (BMV-Begründung) berichtigen; Warnung auch in den Prerender-Standausweis (`seo-detail.ts`) übernehmen (§8 für Suchmaschinen).
    — **Ergänzung 12.9.2026 (§2b, Zeile oben bleibt unverändert stehen):** gefixt, PR #820,
    Gegenprüfung ausstehend, nicht gemergt. Wortlaut + Vollerhebung (34 geprüfte AS-Fundstellen,
    genau 1 Text-Beleg: FZA — ein zweiter Kandidat KLV wurde geprüft und live widerlegt, s.
    ROADMAP-CHRONIK) in [ROADMAP-CHRONIK.md](../ROADMAP-CHRONIK.md). Die beiden
    Nebenpunkte (`revisionen.ts:130`-Kommentar, `seo-detail.ts`-Standausweis) sind NICHT
    Teil dieses Fixes — offen, ggf. eigener Folgeschritt.
    — **Nachtrag 12.9.2026 (b), Orchestrator-Synthese, Zeilen oben unverändert:** PR
    #820 zwischenzeitlich gemergt (`8aa845bb0`, 10:36 UTC) — Gegenprüfung damit
    abgeschlossen, nicht mehr «ausstehend». Häkchen oben entsprechend gesetzt.
  - [ ] **WARTET AUF DAVID (fachlich, §7):** SF-F1 — bleibt die Art.-63-Verlängerung bei gehemmter Frist erhalten (sonst verkürzt die Hemmung eine Verwirkungsfrist)? · SF-F2 — Wartefrist-Ablauf in den Betreibungsferien ergibt früheren «frühesten Handlungstag» (4.1.) als dieselbe Frist als Handlungsfrist (6.1.) — gewollt? Katalog-Zeilen «fachlich vorzulegen» dort.

Runde 1 (erledigt, als Beleg belassen):

  - [x] Runde 1 gebaut 15.8.: 12 Engines, 81 Invarianten, 99 fast-check-Tests (7,6 s), Katalog `bibliothek/register/property-invarianten-2026-08-15.md`; 89/89 Rot-Beweise; **kein Engine-Defekt** — Fund schkgFristen: Art. 63 S. 2 SchKG («bis zum dritten Tag nach DEREN Ende» = Ende der Ferien) macht Fristende nicht-monoton, normkonform (Pin SF-8).

## §N+ · Befunde 8.9.2026 (Session Aufräumen/Sparplan) — Korpus, Wächter

- **Raw-Store-Release deckt Pin `dbg` nicht** *(Fund 8.9.2026 beim Verdrahten von `check:raw-store --streng` in `korpus-raw-release.yml`, PR #779)*: jüngster `korpus-raw-*`-Release trägt DBG mit Konsolidierungs-Stand 2026-01-01, der aktuelle Pin ist 2026-09-02 ⇒ `--streng` rot. Korpus-Territorium (§7): Release neu erzeugen oder Pin-Abgleich klären — eigener Auftrag mit Gegenprüfung, nicht mechanisch fixen.
- **`AzRegister.tsx` Kommentar «Chevron-Feld drehneutral»** stimmt nur für 0°/90°; während der 150-ms-Drehung ist die Hülle bis 28,3 px breit (Ursache des R8-Flackerns, #778). Kommentar bei nächster Berührung präzisieren.
- **Wächter-Fläche zählte Nicht-Tore** (`run-parallel`, `run-netz-alle`, `report-zitatgraph-warnungen` — umbenannt 8.9.2026, Chronik «Umbenennungen 8.9.2026»); Regel künftig: `check-*` nur für Skripte, die rot werden können.
