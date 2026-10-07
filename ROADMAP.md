# LexMetrik — Bauplan

> **Zweck:** wohin (ZIEL), was gerade (JETZT), was ansteht (EINGANG). Das *Wie* in `fahrplaene/`
> (eingefroren, `npm run fahrplan -- <datei> <§>`), Einzelbefunde in `plan/posten/`.
>
> **Provenienz:** Modell seit 5.10.2026 (U1–U8, Vault `03_Projekte/LexMetrik/inventar-optimierung-2026-10-04/
> umstieg-schlanker-plan-2026-10-05.md`; Alt-Fassung `archiv/ROADMAP-bis-2026-10-05.md`). **Ebenen seit
> 7.10.2026** (David E1–E4, Chat): «ich will das so gebaut wird, dass das wichtige zuerst kommt».
> *FB* = Anhang «Fehlerbestand» (gleicher Ordner), IDs wie B-76 nur dort gültig; vor Behebung amtlich
> prüfen (§7). **Grenze:** Budget/Kosten und Merkzettel mit Davids Frage oder Abnahme nur auf sein Wort.

**Regeln**

1. **Form:** ZIEL (mit Fortschrittszeile) · JETZT (höchstens 5) · EINGANG (höchstens 30 Zeilen) ·
   Zurückgestellt. Datei ≤ 15 KB (Grössenwächter warnt, kein Tor).
2. **Ebenen** (E1 David 7.10.: «Ja, so übernehmen»; ersetzt «S > R > N > F»):
   - **E0 Brandschutz** — nur was Nutzer oder Betrieb ausfallen lässt, eine stille Falschauskunft
     erzeugt oder eine Frist < 30 Tage hat. Pflege eigener Werkzeuge/CI ist **nie** E0.
   - **E1, zwei parallele Spuren.** **A Bundestext** (Hauptspur): A1 Fundament → A2 jedes Bundesgesetz →
     A3 Bundesrats-Verordnungen → A4 Departements-/Amtsverordnungen; daneben Messlauf und Leser-Kernfehler.
     **B falsche Rechtsergebnisse** (eigene Session): B1 Warnhinweis + Urteile → B2 Werkzeuge nach Schaden.
   - **Kleinkram-Anteil:** jede fünfte gelandete Korrektur kommt aus E3, Davids Alltagsfunde zuerst.
   - **E3 Kleinkram:** Oberflächen-Feinschliff, Design-Nachlauf, Doku. **E3·W** Werkzeug-Pflege nur,
     wenn sie den laufenden Bau nachweislich blockiert — dann sofort, sonst nicht.
   - **E4 geparkt:** Kantone (Phase 2), Phase 3, Breitbild-Design, VPS, Impressum vor Live-Gang,
     Staatsverträge.

   JETZT: E0 vor E1; Spur A und B je mindestens ein Platz.
3. **EINGANG:** eine Zeile je Sache, ≤ 200 Zeichen, `- <Ebene> · <Herkunft TT.MM.> · <Klartext> — <Ort>`;
   Ebene = E0, E1·A, E1·B, E3, E3·W, E4. Erledigt = Zeile im erledigenden PR löschen. Über 30 Zeilen
   fällt die älteste E3/E3·W/E4-Zeile ohne Go und ohne Herkunft «David» weg (git behält sie).

Der letzte PR eines Vorhabens streicht es aus JETZT, legt erledigte Merkzettel nach `archiv/posten/`,
rückt nach Regel 2 nach und führt die Fortschrittszeile nach. *Merkzettel* = `plan/posten/*.md`,
Gruppen über `dach:` (`grep -l '^dach: <DACH>' plan/posten/*.md`).

---

## ZIEL

**Nordstern (David 7.8.2026):** «In einem Jahr eine wirklich tolle und funktionierende Webseite, die
von allen Juristen und Rechtsanwendern gerne und häufig genutzt wird.» Seit 22.9.: **Produkt vor
Prozess.**

**Phasen (Mandat 14.9.2026):** 1 · Bund fertig (läuft) · 2 · Kantone, erst nach gelandeter Phase 1 ·
3 · Mehr als Fedlex, erst nach gelandeter Phase 2.

**Phase 1 ist fertig, wenn** ein Schweizer Jurist **jedes** Bundesgesetz bei uns **vollständig**,
**strukturgleich** (Gliederung, Randtitel, Fussnoten, Schlusstitel, Anhänge, Tabellen) und **schneller
als auf Fedlex** liest (FAHRPLAN-BUND-FERTIG §0, 14.9.). **«Jedes»** = alle geltenden Landesrecht-Erlasse mit
deutscher Fassung, ~2150 (E2 David 7.10.: «Nein, Phase 1 = Landesrecht»; löst U3 (a) «~5100» ab).
Staatsverträge (SR 0.*, 3186) verlinken auf Fedlex und kommen später.

**Nicht jetzt:** Ebene 4 (Regel 2, mit Staatsverträgen), Reichweite/Domain (21.9.). «Geprüft» setzt nur David.

**Fortschritt** (bei uns/geltend; jeder Abschlussbericht an David beginnt damit; nachführen, wer sie ändert):

> **7.10.2026:** Bundesgesetze 97/348 (dringliche 0/5) · VO der Bundesversammlung 0/25 · Bundesrats-VO
> 90/926 · Departements-VO 4/340 · Amts-VO 4/303 · **Landesrecht 202/2150** · falsche Rechtsergebnisse
> offen (FB Klasse A): Rechner/Vorlagen 37 belegt + 12 Verdacht, Urteile 8

*Zählung:* geltend = Fedlex-SPARQL 7.10. je Erlass-Typ (±2 %); bei uns = 231 Pins (`lesePins`) × Typ:
202 Landesrecht, 28 Staatsverträge, 1 aufgehoben (BMV `cc/2009/423`).

**Messung Phase 1** — U2 (a): je Merkmal ein Messlauf, kein Tor.

| Merkmal | Messung je Lieferung von ≤ 500 Erlassen | erfüllt, wenn | heute |
|---|---|---|---|
| jedes | Fedlex-Abfrage: geltendes Landesrecht (deutsch), das bei uns fehlt | 0 | 7.10.: 231 Pins = 231 Dateien in `public/normtext/bund/`; «238» war die Registerzahl 2.9. — Differenz 0 |
| vollständig | offene Fehler Textverlust/«aufgehoben»/«Gilt seit» + Stichprobe ≥ 10 Erlasse | 0, Stichprobe ohne Abweichung | 5.10.: 83 R-Zeilen FB Bereich 1 |
| strukturgleich | je Erlass Zählung der Strukturteile bei uns und bei Fedlex | 0 Abweichungen | nicht gemessen |
| schneller | Zeit bis zum ersten lesbaren Artikel: OR, ZGB, grosse Verordnung | alle drei schneller | nicht gemessen (OR 3,5 s oder 11,3 s) |

---

## JETZT

Kürzel = Präfix des Arbeitszweigs und Wert des Commit-Trailers `Roadmap:`.

1. **Rechtsprechungs-Register aufteilen** (`E0-REGISTER`) · E0 · Gegenprüfung ja, soweit Urteilsdaten
   *Fertig, wenn* das Rechtsprechungs-Register (839 KB von 900 KiB, 91 %, +7–12 KB/Woche) aufgeteilt ist,
   bevor `check:perf-budget` jeden PR rot färbt (FB S-26). *Frist:* ~Ende Nov./Dez.
2. **Fundament für den Bund-Ausbau** (`A1-FUNDAMENT`) · E1·A · Gegenprüfung ja, wo Normdaten
   *Fertig, wenn* (a) der Browser-Suchindex `such-index/artikel.json` entfällt: Wortsuche in Gesetzen nur noch
   über den Server, Entscheide eigene Suche (David 7.10.: «suche zurückfahren. nur noch nach gesetzen und
   werkzeugen suchen lassen. separat für entscheide»; Wortsuche «Ja, nur über Server»), und
   `normtext/register.json` (93 % des Deckels, `scripts/perf/daten-budget.ts`) ist aufgeteilt (vor Lieferstart);
   (b) Pins als Datendatei statt Handzeilen in `scripts/fedlex-cache.sh` + `src/lib/fedlex/tabelle.ts`,
   Kurzname für Erlasse ohne amtliche Abkürzung `CH-<SR>` (David 7.10.); (c) vervielfachende Fehler zu: ELI-Auflösung
   wählt falsche Fassung (`scripts/fedlex-eli-aufloesen.ts:44-56`, B-07/B-09), Inkrafttretens-Zeile
   fehlt in 86/231 Erlassen (NT-10), «Gilt seit» generisch «lieber leer als falsches Datum» statt
   Handregister (`bibliothek/normtext/generalanweisungen-gilt-seit-2026-10-05.md`), Disp-Text ausserhalb
   Artikel (25.9.: 289 Abschnitte/59 Erlasse), Sidecars nachziehen (B-75), Positivliste (V-02, V-04).
   *Offen:* Datenablage bei ~2150 Erlassen (81 MB für 231; `.git` ~594 MiB); Turso-Speicher: Replika 751 MiB von
   1024 MiB (#1350) — vor Lieferstart klären. *Lage:* Vault
   `03_Projekte/LexMetrik/a1-fundament-2026-10-07/lage.md`.
3. **Jedes Bundesgesetz** (`A2-BUNDESGESETZE`) · E1·A · Gegenprüfung ja · startet nach JETZT 2
   *Fertig, wenn* eine Lieferung die 256 fehlenden Bundesgesetze (251 + 5 dringliche) und 25
   Verordnungen der Bundesversammlung bringt (281) und die Fortschrittszeile «348/348» zeigt.
   *Ort:* FAHRPLAN-FEDLEX-PORTFOLIO §21.
4. **Warnhinweis und Urteile** (`WARNHINWEIS`) · E1·B · Gegenprüfung nein (Warnhinweis: Darstellung;
   Urteile: David 25.9.) — das Tor greift trotzdem bei `scripts/normtext/**`, `scripts/rechtsprechung/**`
   *Fertig, wenn* Rechner mit belegt falschem Ergebnis «bekannter Fehler, Ergebnis nicht verwenden»
   zeigen (E3 David 7.10.; FB Bereich 5 Klasse A, v. a. notariat-grundbuch RV-17…20/24/25/27/82,
   prozesskosten RV-21…23/28, Fristenrechner RV-49/52/53/54/58/59/63; Uri rechnet laut W-14 nicht mehr);
   kein Phantomzitat «Art. … BGE» (U-04; 7.10.: 85 Treffer/64 Dateien,
   `grep -roE 'Art\. [0-9]+[a-z]{0,9} BGE' public/rechtsprechung`); «SBK 26 88» (U-16); Gerichtsname
   amtlich (U-24: «Kantonsgericht GR» statt «Obergericht», `entscheide-mapping.ts:1174`; Tor
   Präfix→Gericht für ag_/sg_); Vorinstanz im Nominativ (U-03); U-06/10/13/15/25. Trailer Urteile: `URTEILE`.
5. **Rechtslogik nach Schaden** (`RECHTSLOGIK`) · E1·B · Gegenprüfung ja
   *Herkunft:* Go David 23./24.9.; seit 7.10. im Mandat (bisher U5 (a) «ausserhalb»).
   *Fertig, wenn* behoben, in dieser Reihenfolge: notariat-grundbuch (Welle 2b, 8 A-Fälle) → Fristenrechner
   (7) → prozesskosten (4) → Vorlagen (RV-06, RV-30, RV-31, RV-47, RV-74, RV-77); je Werkzeug
   Warnhinweis entfernen. RL-43 berührt `historie-parse.ts`/`revisionen-extrakt.ts` ⇒ seriell zu Spur A.
   *Ort:* Dach `W2·30-RL-*`, `QS-CODE-PROP`; `fahrplaene/FAHRPLAN-RECHTSLOGIK.md` §4 (W-01…W-22).

*Gestrichen 7.10.:* `GILTSEIT` gebaut (#1298, #1309 5f6c6c12a: ZGB 299/300 2000-01-01, 307 2013-01-01,
StGB 52 2007-01-01, OR 631 2023-01-01, SVG 89a bewusst ohne) — nur Abnahme David offen, nicht nachfragen.
`BUNDTEXT`: NT-01 gelandet (#1313); NT-10 → JETZT 2, Rest → EINGANG. `URTEILE` → JETZT 4.
`E0-BRANDSCHUTZ` gebaut (#1342, #1343, #1350); Rechtsprechungs-Register → JETZT 1.

---

## EINGANG

```
- E1·A · Auftrag 7.10. · Messlauf Phase 1 strukturgleich + schneller (1 PR, 6–10 h, kein Tor; Zählung wie segmente-logik.ts; Tempo mit Fedlex-Arm, gleiche Drossel, n ≥ 5)
- E1·A · FB · Leser-Kernfehler Navigation: ?p=-Link überschreibt Split-Panes (O-27), Einzelmodus-Zurück (O-31), Weiterlesen (O-34), Deep-Link OR (O-38) — FB Bereich 6
- E1·A · FB · Leser-Kernfehler Suche: Stack-Überlauf (O-36), Fehler geschluckt (O-19), OR-Tempo/Suchlatenz (O-20…O-23); O-15 «3 statt 20» zuerst klären — FB Bereich 6
- E1·A · HN-05 · Bundestext-Rest: Zwischentitel (NT-03), AHVG-Anhang (B-21, erst reproduzieren), B-02, B-17 — Merkzettel 2026-09-25-hn-05-…
- E1·A · Go David 24.9. · Fehllinks SchKG 39, ChemRRV Anh. 1/2, BGG 123/124 (V-02, HN-09), 12 Fussnoten-Selbstlinks (V-07); danach Normverweis öffnet eigenen Leser (HN-D1) — FB V-06
- E1·A · 12.9. · BMV-Pin cc/2009/423 seit 1.3.2026 aufgehoben noch im Bestand, «Art. 9 BMV» löst darauf auf (daneben bmv_2025) — FB V-08; src/lib/fedlex/tabelle.ts
- E1·A · Mandat 14.9. · Tabellen (W2·5l): 0 Brüche, 29 % Legacy-Darstellung, kein Inhaltsverlust — FAHRPLAN-NORMTEXT-DARSTELLUNG
- E1·A · 5.10. · check:zitate: TJPG (SR 955.3) fehlt in Linktabelle/Korpus/Muster; Zitate auf aufgehobene Artikel bleiben grün, solange das Element besteht (OR 697j/790a)
- E1·A · Mandat 14.9. · Folge-Lieferungen A3 Bundesrats-Verordnungen (836 fehlend, 2 Lieferungen), A4 Departements-/Amtsverordnungen (635) — FAHRPLAN-FEDLEX-PORTFOLIO §21
- E1·A · Sammel · übriger Bundestext — FB Bereich 1
- E1·B · Sammel · übrige Rechner/Vorlagen und Urteilsdaten — FB Bereiche 3, 5; Dach W2·30-RL-*, QS-KORPUS
- E1·B · 5.10. · Gegenprüfungs-Pin «fedlex OR 20260101» überholt (Cache 20261001) ⇒ Gegenprüfungen der OR-Engines neu fällig
- E1·B · Abnahme David · Gründungs-Checklisten AG/GmbH nach TJPG — bibliothek/recherche/ag-gruendung.md, gmbh-gruendung.md
- E1·B · 7.10. · Doku-Widerspruch W-17: FB RV-26 «wartet auf David» vs. FAHRPLAN-RECHTSLOGIK §4 «entschieden 24.9.»; W-09/11/17/22 dort ohne Zeichen
- E0 · 7.10. · Turso nach #1343/#1350: 1. Lauf Vollneubau ~260k Zeilen, dann Delta-Log «erfolgreich» vs. «expired» (M-2) prüfen — FAHRPLAN-DATENHALTUNG §17
- E0 · David-Handgriff · AUTOMERGE_TOKEN bis 20.10. erneuern (FB S-14); normen-monatslauf.yml stösst keine CI an (Lauf 1.11.)
- E3 · Go David 24.9. · Rest «eine Titel- und Abschnittsordnung» (HN-D2 gebaut #1190/#1197): Band-Rezept, Titelschrift — Dach W2·29-WERKBANK-NACHLAUF
- E3 · Go David 19.9. · Merkliste bauen — Merkzettel 2026-09-18-reiterleisten-abgleich-merkliste-bauen
- E3 · Go David 8.8. · Kalender-Export: Termine als «frei» — Merkzettel 2026-09-24-kalender-export-…
- E3 · Entscheid David 1.10./Auftrag 3.10. · Deaktiviert-/Hover-Varianten angleichen; Regelsätze von Belegen entflechten — Merkzettel 2026-10-01-deaktiviert-…, 2026-10-03-regelsaetze-…
- E3 · Entscheid David 2.10. · Rest-Rückbau tote Rechtsprechungs-Zeilen: revisionFuer nur noch Kommentar (grep 7.10.), data-leitfaelle u. a. prüfen — Merkzettel 2026-10-02-rest-rueckbau-…
- E3 · Auftrag David 6.10. · Omnilex-Sichtung: 7 Posten U2–U8 (Datums-Tor zu «Gilt seit», Ausgang-Label wartet auf David) — bibliothek/recherche/omnilex-app-sichtung-2026-10-06.md §6
- E3 · 6.10. · Doku pdf-netz nennt EMRK/NYÜ, seit 14.9. nur NYÜ; Fedlex-Frische-PR-Titel «(Auto-Merge)» irreführend (#1311 ohne CI)
- E3 · Sammel · Oberfläche und übrige Verweise — FB Bereiche 6, 4
- E3 · Sammel · Sicherheit/Betrieb übrige (FB Bereich 7; E0 je Zeile prüfen); Prüf-Lücken «latent», kein Bauauftrag (FB Teil C)
- E3·W · Go David 5.10. · CI: Dauer-Wackler an der Wurzel (bibliothek/betrieb/e2e-fang-historie-2026-10-05/), leser-kopf-cls-s3 hängt an Fedlex, Läufer-Kontingent
- E3·W · 5.10. · Tore/Hooks: tor-schutz.py Quote-Split (Diff 5260e0118), gate-stopp.py, tor-paritaet (GP #1323), Streich-Runde nie fündiger Tore (Freigabe 22.9.) — QS-CPU, QS-TORE-DIAET
- E3·W · 5.10. · Rückbau nach Umstieg (flaechenZeile, trendZeile, Rotation, ci.yml:70), Worktrees bleiben liegen, 8.10. CI-Sparplan nachmessen; PLAN_BUCHUNG_TOKEN gegenstandslos (David)
- E3·W · Go David 7.10. · Cache-Tore ehrlich: p-klassen/vollstaendigkeit/struktur-konsistenz/verklebung melden in PR-CI grün ohne Prüfung — scripts/run-parallel.ts, ci.yml
- E3 · Go David 7.10. · Nachgeladene JSON prüfen: 29× res.json ungeprüft, pruefeJson (src/data/jsonSchutz.ts) einsetzen, dazu Versions-Parameter — src/pages, src/components
- E3·W · Go David 7.10. · Leser-Logik (162 .ts unter src/pages|components, ~22k Zeilen) nach src/lib/leser, danach Lint-Grenze — §3 Schichtentrennung
- E3·W · wartet auf David 7.10. · §5-Text vs. Ist: ingest.ts liest public/*.json → DB, JSON ist faktisch Quelle — Umstellung fertig bauen oder §5 präzisieren — CLAUDE.md §5
- E3·W · wartet auf David 7.10. · Rechtsprechung-Einzelentscheide (300 MB) als Release-Artefakt statt in git — public/rechtsprechung/
- E3·W · wartet auf David 7.10. · Doku-Tore check:steuerdeckel + check:steuerflaeche zusammenlegen, nachts statt in der Queue — ci.yml, package.json
- E3 · wartet auf David 7.10. (§15) · public/rechtsprechung/register.json 9,9 MB aufteilen; norm-index.json 6 MB laut Kommentar UI-ungenutzt — public/
- E3·W · später 7.10. · noUncheckedIndexedAccess für src/lib (338 Fehler); src/tests nach Schicht ordnen; tabs.ts in rein/Store trennen — tsconfig.app.json, src/tests
- E4 · Phase 2 · Kantonstext (FB Bereich 2, Dach W2·13-KANTONE-DATEN); ZH-Generator nicht je Erlass fahrbar, 68 ZH_ZURUECKGESTELLT ohne Auflöser
- E4 · David 21.9./E2 7.10. · Impressum/Datenschutz erst vor Live-Gang (FB S-01); Staatsverträge SR 0.* (28 schon gepinnt) verlinken bis dahin auf Fedlex
```

*Ruhend:* Merkzettel mit Entscheid oder Frage Davids (FB Teil B) — nicht nachfragen. *Berichtigt 7.10.:*
«371 falsche Selbstlinks» = Links, die ein Guard entfernt **hätte** (Merkzettel `…-des-der-guard-…`, 31.8.).

---

## Zurückgestellt und ruhende Fragen

*Nicht nachfragen, nicht erinnern.* Wortlaut: Alt-Fassung, `@blockers`/`@david-fragen`.

- **VPS** — erst nach Phase 2 (David 14.9.); `bibliothek/betrieb/vps-bestell-dossier-2026-07-17.md`.
- **Richter-Analytik** (W3·15-RICHTER) — RANKING/PROGNOSE gesperrt (David 22.9.); Filter frei, gebaut.
- **Zielbild-Rückstellung 1.9.** — Rechner-/Vorlagen-Ausbau, Design-Wärme, FINMA ruhen bis Phase 2
  (FINMA vorziehen bei externem Termin).
- **BS-Lizenzanfrage** (R12a) — optional (data.bs.ch CC BY 4.0); ob die Sperre fällt: David.
- Fragen: `aufgehobene-normen-schalter` (FAHRPLAN-ARCHIV-RESTPUNKTE §20) · `dienstjahr-stichtag`,
  `sperrtage-anzeige`, `export-antworten`, `gebv-schkg-rundung` (archiv/HANDLUNGSPLAN.md Z. 211–217;
  verwandt W-22) · **Auto-Merge beim Fedlex-Abgleich** (Freigabe 16.7. vs. «Gesetzesdaten nie
  automatisch mergen»: abschalten, nur Abrufstand automatisch, oder lassen?).

---

## Prüfung nach vier Wochen (ab Anfang November 2026)

- Fortschrittszeile gestiegen (7.10.: Landesrecht 202/2150); mindestens zwei JETZT-Vorhaben fertig.
- `ls plan/posten/*.md | wc -l` — schrumpft (Start 472 nach L3 — #1314 nennt 492; 7.10.: 483).
- `wc -c ROADMAP.md` — unter 15 KB.
- `npm run prozess:kennzahlen` — Prozessanteil unter 30 % (25.9.: 207/582 = 35,6 % alte Regel; 5.10.:
  193/635 = 30,4 %; 7.10.: 171/593 = 28,8 %; Teilfenster 22.9.–7.10.: 75/353 = 21,2 %, `istProzessCommit`).
- `grep -n 'Go David' ROADMAP.md` — keine Marke älter als 14 Tage ohne Grund im Abschlussbericht.
