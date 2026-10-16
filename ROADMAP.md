# LexMetrik — Bauplan

> Das *Wie* in `fahrplaene/` (eingefroren, `npm run fahrplan -- <datei> <§>`), Einzelbefunde in
> `plan/FEHLERBESTAND.md` (*FB*, IDs nur dort gültig; vor Behebung amtlich prüfen, §7). Budget/Kosten
> und Befunde mit Davids Frage oder Abnahme nur auf sein Wort.

1. **Form:** ZIEL mit Fortschrittszeile, JETZT ≤ 5, EINGANG ≤ 30 Zeilen, Zurückgestellt; Datei ≤ 15 KB.
2. **Ebenen** (David 7.10.); JETZT: E0 vor E1, Spur A und B je mindestens ein Platz.
   - **E0 Brandschutz:** nur was Nutzer oder Betrieb ausfallen lässt, still falsch auskunftet oder eine
     Frist < 30 Tage hat; eigene Werkzeuge/CI **nie**.
   - **E1·A Bundestext** (Hauptspur): A1 Fundament → A2 jedes Bundesgesetz → A3 Bundesrats-VO →
     A4 Departements-/Amts-VO; daneben Messlauf und Leser-Kernfehler. **E1·B falsche Rechtsergebnisse**
     (eigene Session): B1 Warnhinweis + Urteile → B2 Werkzeuge nach Schaden.
   - **E3 Kleinkram** (Feinschliff, Design-Nachlauf, Doku): jede fünfte gelandete Korrektur, Davids
     Alltagsfunde zuerst. **E3·W** Werkzeug-Pflege nur, wenn sie den Bau nachweislich blockiert.
   - **E4 geparkt:** Kantone (Phase 2), Phase 3, Breitbild-Design, VPS, Impressum, Staatsverträge.
3. **EINGANG:** je Sache eine Zeile ≤ 200 Zeichen `- <Herkunft>: <Klartext> — <Ort>` unter ihrer Ebene.
   Über 30 Zeilen fällt die älteste E3/E3·W/E4-Zeile ohne Go und ohne «David» weg.

Der letzte PR eines Vorhabens streicht es aus JETZT, erledigt FB-Zeilen (löschen oder PR-Nummer) und
führt die Fortschrittszeile nach.

## ZIEL

**Nordstern (David 7.8.):** «In einem Jahr eine wirklich tolle und funktionierende Webseite, die
von allen Juristen und Rechtsanwendern gerne und häufig genutzt wird.» **Produkt vor Prozess** (22.9.).

**Phasen (Mandat 14.9.):** 1 Bund fertig (läuft); 2 Kantone, nach gelandeter Phase 1; 3 Mehr als
Fedlex, nach gelandeter Phase 2.

**Phase 1 ist fertig, wenn** ein Schweizer Jurist **jedes** Bundesgesetz bei uns **vollständig**,
**strukturgleich** (Gliederung, Randtitel, Fussnoten, Schlusstitel, Anhänge, Tabellen) und **schneller
als auf Fedlex** liest (FAHRPLAN-BUND-FERTIG §0). **«Jedes»** = alle geltenden Landesrecht-Erlasse mit
deutscher Fassung, ~2150 (David 7.10.).

**Nicht jetzt:** E4, Reichweite/Domain (21.9.). «Geprüft» setzt nur David.

**Fortschritt** (bei uns/geltend; eröffnet jeden Abschlussbericht; nachführen, wer sie ändert):

> **7.10.2026:** Bundesgesetze 97/348 (dringliche 0/5) · VO der Bundesversammlung 0/25 · Bundesrats-VO
> 90/926 · Departements-VO 4/340 · Amts-VO 4/303 · **Landesrecht 202/2150** · falsche Rechtsergebnisse
> offen (FB Klasse A): Rechner/Vorlagen 37 belegt + 12 Verdacht, Urteile 1 + 4 neu (11.10., #1365) · Warnhinweis an 17 Rechnern (11.10., #1364)

*Zählung:* geltend = Fedlex-SPARQL 7.10. je Erlass-Typ (±2 %); bei uns = 231 Pins (`lesePins`):
202 Landesrecht, 28 Staatsverträge, 1 aufgehoben (BMV `cc/2009/423`).

**Messung Phase 1** — je Merkmal ein Messlauf je Lieferung (≤ 500 Erlasse), kein Tor:

- *jedes:* geltendes deutsches Landesrecht laut Fedlex, das bei uns fehlt = 0; heute 0 (7.10.: 231 Pins =
  231 Dateien in `public/normtext/bund/`)
- *vollständig:* offene Fehler Textverlust/«aufgehoben»/«Gilt seit» = 0, Stichprobe ≥ 10 Erlasse ohne
  Abweichung; heute 83 R-Zeilen FB Bereich 1 (5.10.)
- *strukturgleich:* Strukturteile je Erlass bei uns = bei Fedlex; nicht gemessen
- *schneller:* erster lesbarer Artikel bei OR, ZGB, grosser Verordnung schneller als Fedlex; nicht
  gemessen (OR 3,5 s oder 11,3 s)

## JETZT

Kürzel = Zweig-Präfix und Trailer `Roadmap:`.

1. **Fundament für den Bund-Ausbau** (`A1-FUNDAMENT`) · E1·A · Gegenprüfung ja, wo Normdaten
   *Fertig, wenn* (a) `such-index/artikel.json` entfällt (Gesetzes-Wortsuche nur über Server,
   Entscheide eigene Suche; David 7.10.) und `normtext/register.json` (93 % des Deckels,
   `scripts/perf/daten-budget.ts`) vor Lieferstart aufgeteilt ist; (b) Pins als Datendatei statt
   Handzeilen in `scripts/fedlex-cache.sh` + `src/lib/fedlex/tabelle.ts`, Kurzname ohne amtliche
   Abkürzung `CH-<SR>`; (c) vervielfachende Fehler: ELI-Auflösung wählt falsche Fassung
   (`scripts/fedlex-eli-aufloesen.ts:44-56`, B-07/B-09), Inkrafttretens-Zeile fehlt in 86/231 (NT-10),
   «Gilt seit» generisch «lieber leer als falsches Datum» statt Handregister
   (`bibliothek/normtext/generalanweisungen-gilt-seit-2026-10-05.md`), Disp-Text ausserhalb Artikel
   (289 Abschnitte/59 Erlasse), Sidecars (B-75), Positivliste (V-02, V-04).
   *Datenablage entschieden 16.10.* (David, Variante A: bleibt, wo sie ist): Turso repliziert
   355 MiB (Gesetze 104, Urteile 251), bei 2150 Erlassen ≈ 750 MiB, Spitze beim Vollneubau bis ≈ 2×;
   Grenze Turso Free 5 GB (`scripts/datenhaltung/hot-groesse.ts`, Bestätigung aus Davids Konto
   offen); Vercel ≈ 1,5 GB je Stand, 3 Stände ≈ 4,6 von 10 GB.
   *Lage:* Vault `03_Projekte/LexMetrik/a1-fundament-2026-10-07/lage.md`.
2. **Jedes Bundesgesetz** (`A2-BUNDESGESETZE`) · E1·A · Gegenprüfung ja · nach JETZT 1
   *Fertig, wenn* eine Lieferung die 256 fehlenden Bundesgesetze (251+5 dringliche) und 25 VO der
   Bundesversammlung bringt (281), Fortschrittszeile «348/348». *Ort:* FAHRPLAN-FEDLEX-PORTFOLIO §21.
3. **Rechtslogik nach Schaden** (`RECHTSLOGIK`) · E1·B · Go David 23./24.9. · Gegenprüfung ja
   *Fertig, wenn* behoben in der Reihenfolge notariat-grundbuch (Welle 2b, 8 A-Fälle) → Fristenrechner
   (7) → prozesskosten (4) → Vorlagen (RV-06, RV-30, RV-31, RV-47, RV-74, RV-77); je Werkzeug
   Warnhinweis entfernen (Zeile in `src/lib/bekannteFehler.ts`, #1364). RL-43 berührt `historie-parse.ts`/`revisionen-extrakt.ts` ⇒ seriell zu Spur A.
   *Ort:* FB Bereich 5; `fahrplaene/FAHRPLAN-RECHTSLOGIK.md` §4 (W-01…W-22).
   *Stand 15.10. (abends):* notariat-grundbuch Welle 2b GELANDET: RL-26 Uri (#1379), RL-27 Staffel-Primitiv
   (#1380), RL-29 T1 Staffeln (#1382) + T3 Rundungen (#1397), RL-28 T1 Deutschschweiz (#1385) + T2/3
   Romandie/TI + Pfandsteuer (#1398), RL-33 T1 MWST (#1388) + T2 Hinweise/Formulare (#1399), RL-34
   Emissionsabgabe (#1400), RL-36 Tarifkopien (#1392); RV-17/19/20/24/25/27 erledigt, RV-82 Rest «weitere
   Geschäftsarten» FR/VD/VS/JU/NE offen; GP-Nebenfunde FB RV-96…102. Nächster Teil: Fristenrechner (7
   A-Fälle) — Fahrplan §4; Warnhinweis-Zeilen RV-19/20/24/25 entfernt.

*Gestrichen 11.10.:* `WARNHINWEIS` gebaut (#1364 Warnhinweis an 17 Rechnern, Auswahlregel im Kopf von `src/lib/bekannteFehler.ts`; #1365 Urteile U-03/04/10/13/16/24/25, U-06 schon #1149; U-15 offen in FB).

*Gestrichen 7.10.:* `GILTSEIT` gebaut (#1298, #1309: ZGB 299/300 2000-01-01, 307 2013-01-01, StGB 52
2007-01-01, OR 631 2023-01-01, SVG 89a bewusst ohne) — nur Abnahme David offen, nicht nachfragen.

## EINGANG

```
E0
- 7.10.: Turso nach #1343/#1350: 1. Lauf Vollneubau ~260k Zeilen, dann Delta-Log «erfolgreich» vs. «expired» (M-2) prüfen — FAHRPLAN-DATENHALTUNG §17
- David-Handgriff: AUTOMERGE_TOKEN bis 20.10. erneuern (FB S-14); normen-monatslauf.yml stösst keine CI an (Lauf 1.11.)
E1·A
- 15.10. Korpus-Nachzug UR RB 9.2311 und GL art_7.1 als Kantons-Snapshots (BEKANNTE_LUECKEN in check-vollstaendigkeit.ts) — Korpus-Werkstatt
- David 7.10.: Messlauf Phase 1 strukturgleich + schneller (1 PR, 6–10 h, kein Tor; Zählung wie segmente-logik.ts; Tempo mit Fedlex-Arm, gleiche Drossel, n ≥ 5)
- 16.10. LESER-NAV gelandet (#1378–#1413, 15 PRs); offen: Suche O-19/O-20/O-23 nach #1352, OR-Tempo O-21/O-22, O-34f, O-56, Nebenfunde O-77…O-83, Nachkontrolle O-75 ab 4.1.2027 — FB Bereich 6
- wartet auf David 16.10.: LESER-NAV-Fragen O-04/O-05 Wortlaut, O-10, O-11, O-13, O-17, O-21, O-27, O-29, O-32, O-33c, O-36, O-42, O-47, O-50c, O-51, O-52, O-63, O-70, O-74, O-76c — FB Spalte «David?»
- HN-05: Bundestext-Rest: Zwischentitel (NT-03), AHVG-Anhang (B-21, erst reproduzieren), B-02, B-17 — FB B-16
- Go David 24.9.: Fehllinks SchKG 39, ChemRRV Anh. 1/2, BGG 123/124 (V-02, HN-09), 12 Fussnoten-Selbstlinks (V-07), dann Normverweis im eigenen Leser (HN-D1) — FB V-06
- 12.9.: BMV-Pin cc/2009/423 (aufgehoben 1.3.2026) noch im Bestand, «Art. 9 BMV» löst darauf auf (daneben bmv_2025) — FB V-08; src/lib/fedlex/tabelle.ts
- 14.9.: Tabellen (W2·5l): 0 Brüche, 29 % Legacy-Darstellung, kein Inhaltsverlust — FAHRPLAN-NORMTEXT-DARSTELLUNG
- 5.10.: check:zitate: TJPG (SR 955.3) fehlt in Linktabelle/Korpus/Muster; Zitate auf aufgehobene Artikel bleiben grün, solange das Element besteht (OR 697j/790a)
- 14.9.: Folge-Lieferungen A3 Bundesrats-VO (836 fehlend, 2 Lieferungen), A4 Departements-/Amts-VO (635) — FAHRPLAN-FEDLEX-PORTFOLIO §21
- Sammel: übriger Bundestext — FB Bereich 1
E1·B
- 15.10. RECHTSLOGIK-Rest aus GP: GE-Deckel, Rundungsnormen übrige Grundbuch-Posten, Pfandsteuer-Rappen, JU/TI-Lesarten, Golden-Lücke, Hinweis-Kleinkram, TG Schlichtungshinweis — FB RV-94…102
- wartet auf David 15.10.: W-16 MWST BS/VD/JU «zuzüglich 8,1 % nach Bundesrecht» (Empfehlung ja); AG Grundpfand-Minimum Notariatsteil 200 (umgesetzt) oder 300; A1-FUNDAMENT #1351/#1352 offen
- Sammel: übrige Rechner/Vorlagen und Urteilsdaten — FB Bereiche 3, 5
- 5.10.: Gegenprüfungs-Pin «fedlex OR 20260101» überholt (Cache 20261001) ⇒ Gegenprüfungen der OR-Engines neu fällig
- Abnahme David: Gründungs-Checklisten AG/GmbH nach TJPG — bibliothek/recherche/ag-gruendung.md, gmbh-gruendung.md
- 7.10.: Widerspruch W-17: FB RV-26 «wartet auf David» vs. FAHRPLAN-RECHTSLOGIK §4 «entschieden 24.9.»; W-09/11/17/22 dort ohne Zeichen
E3
- Go David 24.9.: Rest «eine Titel- und Abschnittsordnung» (HN-D2 gebaut #1190/#1197, Band-Rezept #1373): Titelschrift — FB Teil B
- Go David 8.8.: Kalender-Export: Termine als «frei» — FB Teil B
- David 1.10./3.10.: Deaktiviert-/Hover-Varianten angleichen; Regelsätze von Belegen entflechten — FB Teil B
- David 2.10.: Rest-Rückbau tote Rechtsprechungs-Zeilen: revisionFuer nur noch Kommentar, data-leitfaelle u. a. prüfen — FB Teil B
- David 6.10.: Omnilex-Sichtung: 7 Posten U2–U8 (Datums-Tor zu «Gilt seit», Ausgang-Label wartet auf David) — bibliothek/recherche/omnilex-app-sichtung-2026-10-06.md §6
- 10.10. E0-REGISTER-Rest: wartet auf David quelleUrl auslagern (≈115 KB, Karten-Link ändern); norm-index.json 6 MB UI-ungenutzt; 4 Prüf-Nachzüge — FB S-26
E3·W
- 15.10. RECHTSLOGIK-Prozess: Pflicht-Testliste Tarif-PRs (Rundungs-Inventar, Export-Ratsche, grundpfand B1/B2), Trailer < 72 Z., Abschluss-Commit mit Inhalt, Alias-Doppelzählung — Skill bauschritt
- Go David 5.10.: CI: Dauer-Wackler an der Wurzel (git 3fd5db8f9:bibliothek/betrieb/e2e-fang-historie-2026-10-05/), leser-kopf-cls-s3 hängt an Fedlex, Läufer-Kontingent
- Go David 7.10.: Leser-Logik (162 .ts unter src/pages|components, ~22k Zeilen) nach src/lib/leser, danach Lint-Grenze — §3
- wartet auf David 7.10./10.10.: §5 vs. Ist (ingest.ts liest public/*.json in die DB); Rechtsprechung-Einzelentscheide (300 MB) als Release-Artefakt statt git; scripts/archiv/ (9 Skripte) löschen
E4
- David 21.9./7.10.: Impressum/Datenschutz erst vor Live-Gang (FB S-01); Staatsverträge SR 0.* (3186, 28 gepinnt) verlinken bis dahin auf Fedlex; Vercel Hobby nur nicht-kommerziell (vercel.com/docs/limits/fair-use-guidelines) ⇒ Planwahl vor Live-Gang
```

*Ruhend:* FB Teil B (Entscheide/Fragen Davids), nicht nachfragen.

## Zurückgestellt und ruhende Fragen

Wortlaut: `git 3fd5db8f9:archiv/ROADMAP-bis-2026-10-05.md`,
`@blockers`/`@david-fragen`.

- **VPS** nach Phase 2: `git 3fd5db8f9:bibliothek/betrieb/vps-bestell-dossier-2026-07-17.md`.
- **Richter-Analytik:** RANKING/PROGNOSE gesperrt (David 22.9.); Filter gebaut.
- **Zielbild-Rückstellung** (1.9.): Rechner-/Vorlagen-Ausbau, Design-Wärme, FINMA ruhen bis Phase 2
  (FINMA vorziehen bei externem Termin).
- **BS-Lizenzanfrage** (R12a): optional (data.bs.ch CC BY 4.0); ob die Sperre fällt: David.
- Fragen: `aufgehobene-normen-schalter` (FAHRPLAN-ARCHIV-RESTPUNKTE §20) · `dienstjahr-stichtag`,
  `sperrtage-anzeige`, `export-antworten`, `gebv-schkg-rundung` (`git 3fd5db8f9:archiv/HANDLUNGSPLAN.md` Z. 211–217) · **Auto-Merge beim Fedlex-Abgleich** (Freigabe 16.7. vs. «Gesetzesdaten nie
  automatisch mergen»: abschalten, nur Abrufstand automatisch, oder lassen?).

## Prüfung nach vier Wochen (ab Anfang November 2026)

- Fortschrittszeile gestiegen (7.10.: Landesrecht 202/2150); mindestens zwei JETZT-Vorhaben fertig.
- `wc -c ROADMAP.md` unter 15 KB.
- `npm run check:deckel` — Wert in `messwerte/deckel.json` gesunken oder gleich (Start: Wert nach
  Kahlschlag, siehe Commit).
- `grep -n 'Go David' ROADMAP.md` — keine Marke älter als 14 Tage ohne Grund im Abschlussbericht.
