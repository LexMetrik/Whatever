# Parameter-Verfallsregister

Alle **datierten Parameter** im Code: Werte, die sich ausserhalb des Repos ändern
und darum regelmässig geprüft werden müssen. Wer einen neuen datierten Wert
verdrahtet, trägt ihn HIER ein (mit Fundstelle, Stand, Prüfrhythmus).

Stand des Registers: 6.9.2026 (fortlaufend gepflegt — zuletzt inhaltlich
ergänzt um die maschinelle Fassungsprüfung der kantonalen Tarif-Stammdaten
(`check:tarif-drift`, W3-TARIF-STAND); davor die BWO-Publikation vom 1.9.2026 zum hypothekarischen
Referenzzinssatz (unverändert 1.25 %, gültig ab 2.9.2026, nächste Publikation
1.12.2026); davor die angekündigte TI-LTORF-Fassung per 1.1.2027 samt der Feststellung,
dass die Wiedervorlage-Automatik kantonale Quellen strukturell nicht sieht; davor
die Fassungs-Bindung der PDF-erfassten Kantons-Snapshots, Fedlex-Pin-Kanonik/
GL-LexWork-Migration/SG-GKV-Sunset; das Datum wird maschinell gelesen —
`scripts/verfall-parse.ts` `registerStand()` — bei jeder inhaltlichen Ergänzung
mitziehen, nicht nur beim jährlichen Audit).

| Parameter | Fundstelle | Wert / Stand | Prüfrhythmus | Nächste Prüfung |
|---|---|---|---|---|
| Hypothekarischer Referenzzinssatz | `src/lib/vorlagen/mietvertrag.ts` (`MV_PARAMETER.referenzzinssatz`) | 1.25 % (unverändert; Stand 2.9.2026, publiziert 1.9.2026, BWO https://www.bwo.admin.ch/de/referenzzinssatz) | **quartalsweise** (bwo.admin.ch/de/referenzzinssatz) | 1.12.2026 |
| MWST-Normalsatz | `src/lib/vorlagen/mietvertrag.ts` (`MV_PARAMETER.mwstSatz`) | 8.1 % (seit 1.1.2024) | bei Satzänderung | — |
| MWST-Normalsatz (Prozesskosten-Cockpit, MwSt auf Parteientschädigung) | `src/data/tarif/typen.ts` (`MWST_NORMALSATZ_PROZENT`) | 8.1 % (seit 1.1.2024, Art. 25 I MWSTG) | bei Satzänderung — **zusammen mit der Mietvertrags-Kopie pflegen** | — |
| Kantonale Tarif-Fassungen (954 Einträge: Gerichtskosten, Parteientschädigung, Schlichtung, Beurkundung, Grundbuch, Notariat) | `src/data/tarif/*.ts` (`stand` + `quelleUrl` je Eintrag) | **maschinell geprüft: `npm run check:tarif-drift`** (Netz-Tor, vergleicht die hinterlegte Fassung gegen `current_version` der Quelle). Erster Lauf 6.9.2026: 557 aktuell · **93 DRIFT in 34 Erlassen** · 304 unklar (Portale ohne Adapter) · 0 unerreichbar. NACHTRAG 6.9.2026 (W3-TARIF-NACHVERIFIKATION, Phase 2): alle DRIFT-Fälle nachverifiziert und nachgezogen — Lauf danach **aktuell 643 · DRIFT 0 · unklar 311 · unerreichbar 0**; Belegkette je Erlass in `kosten/tarif-drift-nachverifikation-2026-09-06.md`; das Tor hängt seither in `check:netz:kette` und läuft im Normen-Monitor mit | **maschinell** statt Handzeile; die Werte-Nachverifikation der DRIFT-Fälle bleibt fachliche Arbeit (§7) | **DRIFT 0** — der nächste Befund kommt maschinell aus dem Netz-Tor, kein Handtermin; offen bleiben die 311 «unklar»-Einträge (Portale ohne Adapter) |
| TG Steuergesetz (RB 640.1) — Handänderungssteuersatz | `src/data/tarif/notariat-grundbuch.ts` (TG, § 140 Abs. 1: 1 %) | Geltende Fassung Version 2929, in Kraft seit 1.1.2025 und **ausdrücklich befristet bis 31.12.2028** (`https://www.rechtsbuch.tg.ch/app/de/texts_of_law/640.1`, Abruf 6.9.2026, Beleg: `kosten/tarif-drift-nachverifikation-2026-09-06.md`). Läuft die Befristung aus, ohne dass eine Folgefassung gilt, zeigt der Eintrag einen Satz ohne geltende Grundlage | **vor dem 31.12.2028** prüfen, ob eine Folgefassung publiziert ist; laufend maschinell über `check:tarif-drift` (meldet die neue Fassungs-Id, sobald TG sie führt) | **1.10.2028** |
| Kantonale Mindestlöhne | `src/lib/vorlagen/arbeitsvertrag.ts` (`AV_MINDESTLOEHNE`) | je Eintrag datiert | **jährlich** (Indexierung per 1.1.) | Jan. 2027 |
| Formularpflicht-Kantone (Mietzins) | `src/lib/vorlagen/mietvertrag.ts` (`MV_FORMULARPFLICHT`) | BWO 4.2.2026 | jährlich; **BE ändert dynamisch per 1.11.2026** | **1.11.2026 (BE!)** |
| LIK-Indexreihen | `src/data/likReihe.ts` (`LIK_REIHEN`, bis `LIK_LETZTER_MONAT`) | bis 2026-05 (BFS, abgerufen 5.6.2026) | monatlich/bei Bedarf — `scripts/lik-reihe-generieren.py` | bei Nutzerbedarf |
| Feiertagsverzeichnis (EJPD) | `src/data/zpoFeiertage.ts` | BJ-Liste Stand 2011; **Doppelcheck 26/26 am 6.6.2026** (7 Korrekturen + Fussnotenregeln → `normen/feiertage-kantone-bj.md`) | je Kanton gegen geltendes kantonales Recht vor «geprüft»; bei neuer BJ-Publikation Matrix neu abgleichen | offen (kantonale Erlasse) |
| BWO-Verzeichnis Miet-Schlichtungsbehörden | noch nicht verdrahtet (Bibliothek: `schlichtungsbehoerden-kantone.md`) | PDF-Stand 13.02.2026 | **jährlich** | Feb. 2027 |
| Behörden-Stammdaten | `src/lib/vorlagen/behoerden.ts` | je Adresse `stand`-Feld (BS: 5.6.2026) | vor jeder «geprüft»-Hebung; sonst jährlich | — |
| Fedlex-Konsolidierungsstände | `bibliothek/register/quellen-register.md` | je Gesetz dokumentiert | bei Rechtsänderungen (AS-Publikationen) | bei neuen Aufträgen |
| Kantons-Snapshots aus dem PDF-Pfad (Fassungs-Bindung) | `public/normtext/kanton/*.json` mit `quelleUrl` `…/api/<lang>/versions/<vid>/pdf_file` (8 Erlasse) ↔ `normen/kanton-gliederung-sidecar-luecke-2026-08-13.md` | Diese Snapshots hängen an einer festen Versions-Id; ihr `fassungsToken` ist ein Inhalts-Hash des PDF und ändert sich NICHT, wenn das Portal längst eine neue Fassung führt — die Drift bleibt unbemerkt. **Belegt 13.8.2026: SG-2808 (GKV sGS 941.12) hängt an Version 2808 / Stand 1.3.2012, amtlich gilt Version 3863 seit 1.7.2026.** Übrige sieben am selben Datum fassungsgleich geprüft | **halbjährlich**, bis ein Tor `current_version.id` gegen die Snapshot-Version prüft (Wurzel-Fix, §17). NACHTRAG 6.9.2026: Für die TARIF-Seite derselben Erlasse leistet das jetzt `check:tarif-drift` (es meldet SG-2808 automatisch, Lauf 6.9.2026); die SNAPSHOT-Seite (`public/normtext/kanton/*.json`) ist damit NICHT gedeckt — dieser Wurzel-Fix bleibt offen | **SG-2808: sofort** · übrige: Feb. 2027 |
| Beurkundungs-/Beglaubigungs-Hinweise (Kantone, Richtwerte CHF) | `src/lib/vorlagen/vorsorgeauftrag.ts` (`beurkundungsHinweis`) | dokumentierte Beispiele, 5.6.2026 | jährlich, niedrige Priorität | — |
| Verzugszins-Sätze (gesetzlich 5 %) | `src/lib/…verzugszins` | gesetzlich fix (Art. 104 OR) | nur bei Gesetzesänderung | — |
| HReg-Gebühren (Neueintragung 420/280/210 …) | `src/lib/gruendungsunterlagen.ts` + Masken-/Mappen-Texte | GebV-HReg-Anhang @ 1.1.2021 (einzige Konsolidierung, Cache) | **jährlich** (Verordnungs-Pauschalen) | Jan. 2027 |
| Zulässige Fremdwährungen Kapital (GBP/EUR/USD/JPY) | Gates/Hinweise `gruendungsunterlagen.ts` + Dokumentmappen | Anhang 3 HRegV @ 1.1.2025 (Cache verbatim) | bei HRegV-Änderung (BR-Kompetenz) | mit nächstem HRegV-Pin |
| Emissionsabgabe (1 %, Freibetrag CHF 1 Mio.) | `gruendungsunterlagen.ts` (`emissionsabgabe`, `EMISSIONSABGABE_FREIBETRAG_CHF`) | Art. 6 Abs. 1 lit. h / 8 Abs. 1 StG @ 1.1.2024 (Cache) | jährlich — **politisch volatil** (Abschaffungs-Vorlagen) | Jan. 2027 |
| MWST-Pflicht-Schwellen (100k; 150k gemeinnützig) | nur Dossier (`recherche/gesellschaftsgruendung.md` Teil 5) — NICHT verdrahtet | ESTV-Abruf 6.6.2026; MWSTG-Cache-Verifikation offen | jährlich + zwingend vor Verdrahtung | vor Verdrahtung |
| Notariats-Anlaufstellen je Kanton (inkl. Listen-PDFs) | `src/lib/notariate.ts` ↔ `behoerden/notariate-kantone.md` | URLs geprüft 7.6.2026; Listen-Stände SZ 4/2026 · OW 5/2026 · NE 1/2026 · GE 6/2025; **UR/AI/BL verifiziert 7.6.2026 (System amtlich; Personenlisten teils nur offline)** | **jährlich**; UR/AI/BL vorab klären | **UR/AI/BL: vor Abnahme** · Listen: Juni 2027 |
| Gesetzgebungs-Monitoring: «kleine BGG-Revision» | `bestimmeRechtsmittel` (Art. 74/100/46-Behauptungen) ← `normen/zustaendigkeit-engine-verifikation.md` | Botschaft 5.12.2025, parlamentarisches Stadium (Stand 6.6.2026, bj.admin.ch); **BGG-Kons. 1.4.2026 war NICHT diese Revision** (Energierecht AS 2026 99, geprüft 7.6.2026) | bei AS-Publikation: Art. 74/100/46 neu prüfen | bei Inkrafttreten |
| Fedlex-Re-Pins terminiert: ZGB+ZPO 1.7.2026 **VOLLZOGEN 1.7.2026** (AS 2026 94/16); StGB 12.6.2026 (AS 2026 231) **VOLLZOGEN 12.6.2026** | `scripts/fedlex-cache.sh` ← `normen/fedlex-pin-nachverifikation-2026-06.md` | **ZGB→20260701/html-1** (FALLE: n=0 ist STALE ohne AS 2026 94 art_302 — nur html-1 kanonisch; 6 Anker byte-identisch, Inventar 1099→1099). **ZPO→20260701/no-suffix** (14 Anker operativ byte-identisch, art_314 nur Fussnoten-Reklassifikation; neu art_260a/b). Volltext-Snapshots + Struktur + Manifest gezielt regeneriert (`--erlass=zgb,zpo`), Engine-golden byte-gleich, adversarial QS-GP. `check:caches`/`check:zitate` grün 1.7.2026 | einmalig je Stichtag (`check:caches`+`check:zitate`+ggf. `normtext --erlass`) | Jan. 2027 |
| HG-Bestand & internationale Spruchkörper (Art. 6 IV lit. c ZPO) | `zustaendigkeit.ts` (HG-Weichen) ← dito | ZH/BE/AG/SG, Stand 6.6.2026 | bei kantonaler Errichtung nachführen | — |
| AHV/IV/EO Selbständige (Satz, sinkende Skala) + Bundes-Verzugszinsen | nur Dossiers (`gesellschaftsgruendung.md` Teil 5; `recherche/INDEX.md`-Nachträge) — nicht verdrahtet | 10,0 % / Skala < CHF 60'500 (Merkblatt 2.02, 2026); EFD 4,0 % | **jährlich** + vor Verdrahtung | Jan. 2027 |
| Amtliche Muster-Suiten (Statuten/Urkunden/Erklärungen/KE) | `bibliothek/muster/` (MANIFEST.md) ← Bausteine der 3 Dokumentmappen | ZH 26.7.2024 · SG «…2023» · GL undatiert · EHRA 1.4.2017 (ÜBERHOLT, nur Referenz) | bei OR-/HRegV-Rechtsänderung neu abrufen + Baustein-Abgleich | mit nächstem OR-Pin |
| Notariatstarife AG-Gründung (Beurkundung Errichtungsakt) je Kanton | nur Dossier (`kosten/notariatstarife-gruendung-kantone.md`) — NICHT verdrahtet | ZH NotGebV LS 243 (Nachtrag-123-Beleg offen) · BE GebVN 169.81 @ 1.3.2022 (Anhang 4) · LU BeurkGebV 258 @ 1.1.2022 (§ 37) · SG GebT 821.5 @ **1.1.2026** (Nr. 60.13) · BS Notariatstarif 292.400 @ 1.7.2016 (Ziff. 33) · AG Dekret 295.250 @ 1.1.2025 (**Gründung NICHT tarifiert → Aufwand**); alle netto, + MWST 8,1 % | jährlich + vor Verdrahtung; **AG nicht deterministisch (Aufwand)**; ZH-123-Verifikation zwingend vor «geprüft» | **ZH-123 + SG-MWST: vor Abnahme** |
| Handelsregisterämter-Adressen 26 Kt. | `src/data/handelsregisteraemter.ts` ↔ `behoerden/handelsregisteraemter-kantone.md` (verdrahtet 10.6.2026, HrAmtHinweis) | amtliche kantonale Behördenseiten, Abruf 7.6.2026 (zefix-REST-API der EHRA: 401, Abgleich offen) | jährlich; **ZG-Adresse (Umzug 10/2025) prüfen**; zefix-Abgleich sobald API-Zugang | ZG + zefix: vor Abnahme |
| **ZH-Betreibungskreis-Reorganisation** (56 → 34 oder 18 Kreise) | nur Dossier (`behoerden/betreibungskreise-kantone.md`) — nicht verdrahtet | RR-Beschluss/Vernehmlassung 5.11.2025, NOCH NICHT in Kraft; aktuell massgeblich: Ämterliste Betreibungsinspektorat | **halbjährlich** bis Inkrafttreten; danach Ämterliste + ZH-Zuordnung komplett neu erfassen | Jan. 2027 |
| Betreibungsämter-Stammdaten 26 Kt. (130 Kreis-Ämter in 13 Kt. + 10 Einheitsämter, Gemeinde-Karten 11 Kt.) | `src/data/betreibungsaemter.ts` + `src/data/betreibung/aemterKantone.json` ↔ `behoerden/betreibungskreise-kantone.md` — **VERDRAHTET 7.6.2026 (Etappen 1–3)** | Extraktion + adversariale Stichproben 7.6.2026; gemeindescharf: ZH/FR/SO/AR/GR/TG/TI/VD/ZG/UR/SZ. **Verzeichnis-Link (keine belastbare Liste, §8): LU** (gerichte.lu.ch→Verbands-Plattform, Fusionen) · **AG** (~14/19 Kreise, Verbands-URL tot) · **SG** (Negativbefund: kein amtl. Verzeichnis) · **ZG-PDF Stand 2/2023** (jüngste amtl. Gesamtliste) · **BE: «Avenir Berne romande» (Moutier 1.1.2026 → Jura/Biel-Umzüge bis ~2029)** | **jährlich**; ZH bei Kreis-Reorganisation KOMPLETT neu; ZG-PDF + AG/LU bei amtlicher Gesamtliste nachziehen | Jan. 2027 (ZH halbjährlich, s. eigene Zeile) |
| ZH-Merkblatt-/Formular-Stände AG-Gründung einzeln (Checklisten + Merkblatt Neueintragung + Opting-out 11.12.2024 · formelle Anforderungen 7.1.2025 · Lex-Koller 1.1.2025 · VR-Pflichten 3.12.2025 · private Register 17.2.2026) | Gates/Checklisten in `gruendungsunterlagen.ts`, Bausteine `gruendungAgDokumente.ts` (D13/D17/D20/D21/D23/D24, `AE11_opting_out`, `LEXKOLLER_SCHEMA`) ← `recherche/ag-gruendung-musterabgleich.md` (Zweitabgleich 10.6.2026) | je Dokument datiert (s. links); ergänzt die Suite-Zeile oben (nur 26.7.2024) | bei OR-/HRegV-Rechtsänderung neu abrufen + Baustein-Abgleich | mit nächstem OR-Pin |
| MWST-Normalsatz in «zzgl. MwSt.»-Rechtsbegehren-Bausteinen | nur Dossier (`recherche/ordentliche-klage-rechtsbegehren.md` § 2 R6) — NICHT verdrahtet; Quellen nennen überholte 7,7 %/8 %, Dossier beziffert bewusst NIE (Engine soll parametrisieren: heute 8,1 %, s. MWST-Zeile oben) | 10.6.2026 | jährlich + zwingend vor Bau der Vorlage «ordentliche Klage» | vor Verdrahtung |
| BGer-Praxis Vermieter-Klage Mietzinserhöhung = Feststellungsklage (4A_616/2020) als Begehren-Weiche | nur Dossier (`recherche/ordentliche-klage-rechtsbegehren.md` § 4.4) — nicht verdrahtet | Urteil 6.5.2021 (via Privatquelle 2022) | bei Miet-Dossier-Pflege / neuem BGE | vor Verdrahtung |
| Zulässigkeit abstraktes Erbteilungs-Begehren unter eidg. ZPO (BGer offen) | nur Dossier (`recherche/ordentliche-klage-rechtsbegehren.md` § 4.5) | Quellen-Stand 2017/2018 | vor Bau einer Erbteilungs-Klage-Vorlage neu prüfen | vor Verdrahtung |
| Streitwert-Formeln Miete (3-Jahres-Sperrfrist BGE 137 III 389 · 20×-Regel Art. 92 II ZPO) + Ordnungsbussen Art. 343 I lit. b/c (5000/1000) | nur Dossier (`recherche/ordentliche-klage-rechtsbegehren.md` § 4.4, § 2 R14) — nicht verdrahtet | ZPO-Cache **20260701** / BGE — beim ZPO-Re-Pin 1.7.2026 verifiziert: Fristen-/Zuständigkeits-Anker (142–148, 314, 321, 92 II i.V.m. 2–94a) byte-identisch, Dossier-Werte unverändert | erneut vor Verdrahtung / bei nächstem ZPO-Re-Pin | vor Verdrahtung |

<!-- AUTO fedlex-wiedervorlage -->

## Künftige Fedlex-Konsolidierungen (datierte Wiedervorlage, P1-c)

Maschinell aus dem amtlichen Fedlex-SPARQL-Graphen (`dateApplicability` >
Laufdatum) je Bund-Volltext-Erlass geerntet — Fedlex führt künftige Fassungen
bereits im Triplestore. Jede Zeile ist eine angekündigte künftige Fassung; am
genannten Tag `scripts/fedlex-cache.sh` neu pinnen + §7-Verifikation. Massgeblich
bleibt stets die amtliche Quelle. NICHT von Hand editieren — Block wird von
`npm run gen:fedlex-wiedervorlage` regeneriert. Stand des Laufs: 2026-09-18.

| Erlass (künftige Fassung) | Fundstelle | Aktuell gepinnt | Rhythmus | Nächste Prüfung |
|---|---|---|---|---|
| Künftige Fassung VZAE (SR 142.201) | `scripts/fedlex-cache.sh` (VZAE) | gepinnt 12.6.2026 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.10.2026 |
| Künftige Fassung VEV (SR 142.204) | `scripts/fedlex-cache.sh` (VEV) | gepinnt 12.6.2026 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.10.2026 |
| Künftige Fassung ZEMIS-V (SR 142.513) | `scripts/fedlex-cache.sh` (ZEMIS_V) | gepinnt 1.8.2026 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.10.2026 |
| Künftige Fassung RVOV (SR 172.010.1) | `scripts/fedlex-cache.sh` (RVOV) | gepinnt 1.3.2026 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.10.2026 |
| Künftige Fassung OR (SR 220) | `scripts/fedlex-cache.sh` (OR) | gepinnt 1.1.2026 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.10.2026 |
| Künftige Fassung HRegV (SR 221.411) | `scripts/fedlex-cache.sh` (HREGV) | gepinnt 1.1.2025 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.10.2026 |
| Künftige Fassung StGB (SR 311.0) | `scripts/fedlex-cache.sh` (STGB) | gepinnt 12.6.2026 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.10.2026 |
| Künftige Fassung BBG (SR 412.10) | `scripts/fedlex-cache.sh` (BBG) | gepinnt 1.3.2025 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.10.2026 |
| Künftige Fassung BBV (SR 412.101) | `scripts/fedlex-cache.sh` (BBV) | gepinnt 1.3.2025 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.10.2026 |
| Künftige Fassung VRV (SR 741.11) | `scripts/fedlex-cache.sh` (VRV) | gepinnt 1.7.2026 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.10.2026 |
| Künftige Fassung SSV (SR 741.21) | `scripts/fedlex-cache.sh` (SSV) | gepinnt 1.7.2026 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.10.2026 |
| Künftige Fassung VTS (SR 741.41) | `scripts/fedlex-cache.sh` (VTS) | gepinnt 1.7.2026 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.10.2026 |
| Künftige Fassung FIDLEG (SR 950.1) | `scripts/fedlex-cache.sh` (FIDLEG) | gepinnt 1.3.2024 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.10.2026 |
| Künftige Fassung KAG (SR 951.31) | `scripts/fedlex-cache.sh` (KAG) | gepinnt 1.3.2024 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.10.2026 |
| Künftige Fassung BankG (SR 952.0) | `scripts/fedlex-cache.sh` (BANKG) | gepinnt 1.1.2024 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.10.2026 |
| Künftige Fassung FINIG (SR 954.1) | `scripts/fedlex-cache.sh` (FINIG) | gepinnt 1.3.2024 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.10.2026 |
| Künftige Fassung GwG (SR 955.0) | `scripts/fedlex-cache.sh` (GWG) | gepinnt 1.3.2024 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.10.2026 |
| Künftige Fassung BEG (SR 957.1) | `scripts/fedlex-cache.sh` (BEG) | gepinnt 1.1.2023 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.10.2026 |
| Künftige Fassung ChemRRV (SR 814.81) | `scripts/fedlex-cache.sh` (CHEMRRV) | gepinnt 16.7.2026 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.12.2026 |
| Künftige Fassung AIG (SR 142.20) | `scripts/fedlex-cache.sh` (AIG) | gepinnt 12.6.2026 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2027 |
| Künftige Fassung AsylG (SR 142.31) | `scripts/fedlex-cache.sh` (ASYLG) | gepinnt 12.6.2026 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2027 |
| Künftige Fassung VG (SR 170.32) | `scripts/fedlex-cache.sh` (VG) | gepinnt 15.6.2025 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2027 |
| Künftige Fassung ParlG (SR 171.10) | `scripts/fedlex-cache.sh` (PARLG) | gepinnt 2.3.2026 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2027 |
| Künftige Fassung VwVG (SR 172.021) | `scripts/fedlex-cache.sh` (VWVG) | gepinnt 1.7.2022 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2027 |
| Künftige Fassung BPG (SR 172.220.1) | `scripts/fedlex-cache.sh` (BPG) | gepinnt 1.1.2024 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2027 |
| Künftige Fassung BPV (SR 172.220.111.3) | `scripts/fedlex-cache.sh` (BPV) | gepinnt 1.7.2026 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2027 |
| Künftige Fassung VGG (SR 173.32) | `scripts/fedlex-cache.sh` (VGG) | gepinnt 12.6.2026 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2027 |
| Künftige Fassung MSchV (SR 232.111) | `scripts/fedlex-cache.sh` (MSCHV) | gepinnt 1.7.2025 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2027 |
| Künftige Fassung DesV (SR 232.121) | `scripts/fedlex-cache.sh` (DESV) | gepinnt 1.7.2025 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2027 |
| Künftige Fassung PatG (SR 232.14) | `scripts/fedlex-cache.sh` (PATG) | gepinnt 1.7.2025 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2027 |
| Künftige Fassung MWSTV (SR 641.201) | `scripts/fedlex-cache.sh` (MWSTV) | gepinnt 1.1.2025 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2027 |
| Künftige Fassung CO2-Gesetz (SR 641.71) | `scripts/fedlex-cache.sh` (CO2_GESETZ) | gepinnt 1.1.2025 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2027 |
| Künftige Fassung DBG (SR 642.11) | `scripts/fedlex-cache.sh` (DBG) | gepinnt 2.9.2026 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2027 |
| Künftige Fassung EnG (SR 730.0) | `scripts/fedlex-cache.sh` (ENG) | gepinnt 1.4.2026 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2027 |
| Künftige Fassung VZV (SR 741.51) | `scripts/fedlex-cache.sh` (VZV) | gepinnt 1.1.2026 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2027 |
| Künftige Fassung EBG (SR 742.101) | `scripts/fedlex-cache.sh` (EBG) | gepinnt 1.1.2026 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2027 |
| Künftige Fassung HMG (SR 812.21) | `scripts/fedlex-cache.sh` (HMG) | gepinnt 1.1.2025 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2027 |
| Künftige Fassung AHVG (SR 831.10) | `scripts/fedlex-cache.sh` (AHVG) | gepinnt 1.1.2026 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2027 |
| Künftige Fassung IVG (SR 831.20) | `scripts/fedlex-cache.sh` (IVG) | gepinnt 1.1.2026 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2027 |
| Künftige Fassung ELG (SR 831.30) | `scripts/fedlex-cache.sh` (ELG) | gepinnt 1.1.2026 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2027 |
| Künftige Fassung KVV (SR 832.102) | `scripts/fedlex-cache.sh` (KVV) | gepinnt 1.8.2026 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2027 |
| Künftige Fassung KLV (SR 832.112.31) | `scripts/fedlex-cache.sh` (KLV) | gepinnt 1.8.2026 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2027 |
| Künftige Fassung UVV (SR 832.202) | `scripts/fedlex-cache.sh` (UVV) | gepinnt 1.1.2026 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2027 |
| Künftige Fassung AVIV (SR 837.02) | `scripts/fedlex-cache.sh` (AVIV) | gepinnt 1.8.2026 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2027 |
| Künftige Fassung BankV (SR 952.02) | `scripts/fedlex-cache.sh` (BANKV) | gepinnt 1.1.2025 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2027 |
| Künftige Fassung ERV (SR 952.03) | `scripts/fedlex-cache.sh` (ERV) | gepinnt 24.1.2025 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2027 |
| Künftige Fassung FINMAG (SR 956.1) | `scripts/fedlex-cache.sh` (FINMAG) | gepinnt 1.4.2025 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2027 |
| Künftige Fassung FINMA-GebV (SR 956.122) | `scripts/fedlex-cache.sh` (FINMA_GEBV) | gepinnt 1.3.2024 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2027 |
| Künftige Fassung FZV (SR 831.425) | `scripts/fedlex-cache.sh` (FZV) | gepinnt 1.8.2026 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.6.2027 |
| Künftige Fassung BVV 3 (SR 831.461.3) | `scripts/fedlex-cache.sh` (BVV3) | gepinnt 1.1.2025 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.6.2027 |
| Künftige Fassung IVV (SR 831.201) | `scripts/fedlex-cache.sh` (IVV) | gepinnt 1.6.2025 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.7.2027 |
| Künftige Fassung EOG (SR 834.1) | `scripts/fedlex-cache.sh` (EOG) | gepinnt 1.6.2026 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.7.2027 |
| Künftige Fassung EOV (SR 834.11) | `scripts/fedlex-cache.sh` (EOV) | gepinnt 1.6.2026 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.7.2027 |
| Künftige Fassung FamZV (SR 836.21) | `scripts/fedlex-cache.sh` (FAMZV) | gepinnt 1.1.2025 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.7.2027 |
| Künftige Fassung BVG (SR 831.40) | `scripts/fedlex-cache.sh` (BVG) | gepinnt 1.1.2025 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 26.9.2027 |
| Künftige Fassung GSchV (SR 814.201) | `scripts/fedlex-cache.sh` (GSCHV) | gepinnt 1.12.2025 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2028 |
| Künftige Fassung ELV (SR 831.301) | `scripts/fedlex-cache.sh` (ELV) | gepinnt 1.1.2025 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2028 |
| Künftige Fassung KVG (SR 832.10) | `scripts/fedlex-cache.sh` (KVG) | gepinnt 1.7.2026 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2028 |
| Künftige Fassung FAV (SR 784.101.2) | `scripts/fedlex-cache.sh` (FAV) | gepinnt 15.8.2024 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.7.2028 |
| Künftige Fassung BV (SR 101) | `scripts/fedlex-cache.sh` (BV) | gepinnt 3.3.2024 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2029 |
| Künftige Fassung StHG (SR 642.14) | `scripts/fedlex-cache.sh` (STHG) | gepinnt 1.1.2025 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2029 |
| Künftige Fassung FinfraG (SR 958.1) | `scripts/fedlex-cache.sh` (FINFRAG) | gepinnt 1.2.2024 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2029 |
| Künftige Fassung BetmG (SR 812.121) | `scripts/fedlex-cache.sh` (BETMG) | gepinnt 1.9.2023 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.8.2029 |
| Künftige Fassung BVV 2 (SR 831.441.1) | `scripts/fedlex-cache.sh` (BVV_2) | gepinnt 1.8.2026 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2030 |
| Künftige Fassung GlG (SR 151.1) | `scripts/fedlex-cache.sh` (GLG) | gepinnt 1.7.2020 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.7.2032 |
| Künftige Fassung VKL (SR 832.104) | `scripts/fedlex-cache.sh` (VKL) | gepinnt 1.6.2025 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.7.2032 |
| Künftige Fassung AHVV (SR 831.101) | `scripts/fedlex-cache.sh` (AHVV) | gepinnt 1.1.2026 | einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7) | 1.1.2034 |

### Aufgehobene und zur Aufhebung angekündigte Erlasse (Aufhebungs-Posten, G-AUFH-Follow-up #259)

Aus dem amtlichen Fedlex-SPARQL-Graphen (`jolux:dateNoLongerInForce` auf der
ConsolidationAbstract) geerntet. Diese Erlasse werden GANZ aufgehoben — je
Zeile entweder bereits erfolgt («aufgehoben seit») oder erst amtlich
angekündigt und bis dahin geltend («Aufhebung angekündigt per», §8). Der
Snapshot bleibt allenfalls als historische Fassung nutzbar, darf aber nie mehr
als geltend dargestellt werden, sobald das Datum erreicht ist.

Zwei Klassen, gefiltert über die SSoT `src/lib/normtext/aufhebungen.ts`
(#287-Nachzug):

- **«Aufgehoben (anerkannt)»** — der Repeal ist deklariert und deckt sich mit
  dem amtlichen `dateNoLongerInForce`. Der Erlass wird bewusst als historische
  Fassung geführt (§8), Katalog/Reader zeigen das Aufgehoben-Badge und den
  Nachfolge-Link. Die Massnahme ist ERLEDIGT — dieselbe Beurteilung wie in
  `check:fedlex-versionen` («OK (aufgehoben)»), damit nicht zwei Register
  Gegenteiliges über denselben Erlass sagen (§5).
- **«Aufgehoben» / «Aufhebung angekündigt»** — noch NICHT deklariert. Massnahme
  offen: Snapshot ersetzen/entfernen, Nachfolge-Erlass prüfen, danach eine Zeile
  in `aufhebungen.ts` ergänzen.

| Erlass (Aufhebungs-Posten) | Fundstelle | Aufhebungsdatum | Rhythmus | Nächste Prüfung |
|---|---|---|---|---|
| Aufgehoben (anerkannt): BMV (SR 412.103.1) | `src/lib/normtext/aufhebungen.ts` (BMV) | aufgehoben seit 1.3.2026 | einmalig — erledigt | Nachgeführt: als historische Fassung geführt (§8) — Nachfolger SR 412.103.1 (`cc/2025/408`) |
| Aufhebung angekündigt: PatV (SR 232.141) | `scripts/fedlex-cache.sh` (PATV) | Aufhebung angekündigt per 1.1.2027 | einmalig — Snapshot ersetzen/entfernen (§7/§8), Nachfolge prüfen | Aufhebung angekündigt ab 1.1.2027 |
| Aufhebung angekündigt: VGV (SR 814.621) | `scripts/fedlex-cache.sh` (VGVP) | Aufhebung angekündigt per 1.1.2027 | einmalig — Snapshot ersetzen/entfernen (§7/§8), Nachfolge prüfen | Aufhebung angekündigt ab 1.1.2027 |

<!-- /AUTO fedlex-wiedervorlage -->

## Konventionen

1. Jeder datierte Wert trägt im Code ein `stand`-Feld oder einen datierten Kommentar.
2. Hinweise an Nutzer («quartalsweise prüfen») gehören zusätzlich in die UI, wo der
   Wert wirkt (Vorbild: Referenzzins-Hinweis im Mietvertrag).
3. Verfallene Prüfungen sind ein Deploy-Hindernis für die betroffene Vorlage, kein
   stiller Weiterbetrieb (§8).

## NE: Umzug Tribunal régional Montagnes/Val-de-Ruz (Sommer 2026)
- **Was:** TR La Chaux-de-Fonds zieht von Av. Léopold-Robert 10 auf
  **Av. Léopold-Robert 63** (2. OG, Postgebäude / bâtiment de la Poste);
  Akteneinsicht 27.4.–27.5.2026 gesperrt. NICHT das Tribunal cantonal!
- **PRÜFUNG 12.7.2026 (fällig 12.7.2026): Adresse amtlich UNVERÄNDERT.**
  Die amtliche ne.ch-Behördenseite listet als operative Adresse weiterhin
  **Av. Léopold-Robert 10, 2300 La Chaux-de-Fonds** (Hôtel judiciaire); der
  Umzugs-Hinweis nennt dort noch KEINE neue Adresse, nur die Bücher-Ausleih-
  Sperre **1.7.–14.8.2026**. NE-Regionalmedien (RTN 8.7.2026) bestätigen nun
  konkret Nr. 63 (2. OG Postgebäude) und dass ab **Abschluss des Umzugs,
  vorgesehen 17.8.2026**, alle Audienzen an der neuen Adresse stattfinden.
  → Engine-Wert (Nr. 10) heute korrekt; Stammdaten-Hinweise in 3 Dateien
  auf den dat­ierten, medienbestätigten Stand geschärft (s. unten). Adresse
  erst umstellen, wenn ne.ch selbst auf Nr. 63 wechselt.
- **Betroffene Stammdaten:** `src/data/zivilgerichteErstinstanz.ts` (NE),
  `src/data/strafgerichte.ts` (NE), `src/data/schlichtungsstellen.ts` (NE) —
  nur `hinweis`-Felder geschärft, Adresswert Nr. 10 unverändert.
- **Wiedervorlage:** **ab 18.8.2026** (nach vorgesehenem Umzugs-Abschluss
  17.8.2026) ne.ch-Adresse erneut prüfen und bei amtlicher Umstellung die
  Adresswerte auf Av. Léopold-Robert 63 (2. OG) nachführen.
- **Belege:** ne.ch-Behördenseite (Tribunal d'instance, live abgerufen
  12.7.2026: <https://www.ne.ch/autorites/PJNE/tribunaux-regionaux/Pages/INST-CHX.aspx>);
  RTN NE 8.7.2026 (<https://www.rtn.ch/rtn/Actualite/Region/20260708-La-Chaux-de-Fonds-le-Tribunal-regional-des-Montagnes-demenage.html>);
  ursprünglicher Doppelcheck-Durchgang 5.6.2026.

## ~~GL LexWork-Migration `gesetze.gl.ch` — `xhtml_tol`-Endpunkt tot~~ → AUFGELÖST (Prämisse widerlegt, 11.7.2026 abends)
- **Ursprungs-Befund (11.7.2026, POC):** Glarus ist von `gl.clex.ch` (301) auf
  `gesetze.gl.ch` migriert; der vom `adapter-lexwork.ts` genutzte
  `GET …/texts_of_law/{lawId}` (→ `xhtml_tol`) liefere eine Soft-404-Angular-Shell,
  nur `/show_as_json` (`json_content`) lebe weiter; 5 GL-Snapshots drifteten.
- **AUFLÖSUNG 11.7.2026 (§7 «per Messung, nicht per Annahme»):** Die Prämisse ist
  **widerlegt**. Live-Nachmessung (`/api/de/texts_of_law/{lawId}`) liefert für **alle 5**
  GL-Erlasse HTTP 200 + `application/json` mit **populiertem `xhtml_tol`** (44 KB), 3/3
  reproduzierbar. Der `version_uid`-Drift-Token jedes committeten Snapshots ist
  **zeichengleich zum Live-Wert** → GL war nie gedriftet, sondern aktuell. Die
  «Angular-Shell» (2.3 KB, HTTP 200, text/html, «Casemates») serviert nur der
  **`/app/`-SPA-Pfad** (die menschliche `quelleUrl`), **nicht** der vom Adapter genutzte
  **`/api/`-Endpunkt** — der POC hatte die beiden Pfade verwechselt. Kein `json_content`-
  Umbau, kein David-SCHEMA-ENTSCHEID nötig; die reservierte a/b/c-Frage bleibt unberührt.
- **Statt Umbau — Klasse dauerhaft entschärft:** `holeLexWork` erkennt jetzt eine
  Soft-404-Shell (Content-Type ≠ JSON **oder** HTML-Body statt JSON) als eigene
  `LexWorkShellError`; `check:normtext-netz` (Prüfung 3) wertet sie als **HARTEN**
  Fehler (Exit 1) statt als blosse Netz-Warnung — falls ein LexWork-Host seinen
  `/api/`-Endpunkt je wirklich migriert, driftet die Klasse **nie wieder still**.
  Host-agnostisch für alle 19 LexWork-Kantone. GL-Snapshots zur aktuellen Adapter-
  Vintage refresht (nur Extraktions-Diff: +5 S1-Leerplatzhalter III-C.1, Randtitel;
  amtlich 0 Änderung, golden nur additiv). Gegenprüfung bestanden (3 Erlasse zeichengenau).
- **Quelle:** Live-Nachmessung 11.7.2026; POC-Nachtrag in
  `bibliothek/normen/lexwork-kantone-poc-19-verdikt.md` §GL-Nachtrag.

## Terminierte Nachfolgefassungen kantonaler Kosten-Erlasse (✓2-Befund 5.6.2026)
- **SG Gerichtskostenverordnung (GKV, sGS 941.12): Nachfolgefassung seit 1.7.2026 in Vollzug — AUFGELÖST + verifiziert 1.7.2026.**
  Nachtrag vom 5.12.2025 (nGS 2026-001), LexWork `current_version` 3863. Art. 10
  (Entscheidgebühren-Rahmen Fr. 500.– bis Fr. 6000.–) und Art. 11 (Streitwert-%-
  Decke: über 50k→höchstens 200 %, über 100k→300 %, je weitere 250k→je +100 %)
  sind **wortgleich zur Vorfassung** → Rechner-Werte (`gerichtskosten.ts` SG)
  unverändert korrekt. Verifiziert gegen die amtliche in-Kraft-Fassung
  (`gesetzessammlung.sg.ch/api/de/versions/3863/pdf_file`, pdfjs-Extraktion Art. 10/11,
  1.7.2026). Nächste periodische Prüfung: Juni 2027 (kein publizierter Sunset).
- **GR Honorarverordnung (HV, BR 310.250): bis 31.12.2026** (Nachfolge 1.1.2027).
- **BE EAV (BSG 168.711, amtliche Anwälte): bis 31.12.2026** (Nachfolge 1.1.2027).
- **TI LTORF (Legge sulle tasse e gli emolumenti del registro fondiario, RL 216.200 = `TI-ti-181`): geltende Fassung 17.5.2024 gilt bis 31.12.2026** (Nachfolge 1.1.2027, Änderung BU 2026, 281).
  Die Fassung vom 17.5.2024 (BU 2024, 131) ist bis dahin der `stand` des
  Snapshots. Amtlicher Beleg: der Abschnitt «PROSSIME VARIAZIONI» der Erlass-Seite
  `m3.ti.ch/CAN/RLeggi/public/index.php/raccolta-leggi/legge/num/181` (Abruf
  29.8.2026), Änderungstext `www3.ti.ch/CAN/fu/2026/BU_028.pdf`. Massnahme am
  Stichtag: `npm run normtext -- --datum=<ISO> --nur=kanton --kanton=TI`, danach
  Register/Manifest nachziehen. **Nächste Prüfung: 1.1.2027.**
- Quelle: OrdoLex-API `current_version`-Metadaten (Doppelcheck 5.6.2026); TI aus
  dem Ankündigungs-Abschnitt der Erlass-Seite (29.8.2026).

### Deklarierter Rest: die Wiedervorlage-Automatik sieht nur den Bund (29.8.2026)

Die Einträge dieses Abschnitts werden **von Hand** geführt, und das ist kein
Versehen, sondern eine Lücke mit Namen. Der AUTO-Block weiter oben («Künftige
Fedlex-Konsolidierungen», P1-c) wird von `scripts/fedlex-wiedervorlage-generieren.ts`
erzeugt; dessen Grundmenge ist ausdrücklich `register.json` gefiltert auf
`ebene='bund'` und die Quelle ausschliesslich der Fedlex-SPARQL-Endpunkt
(`jolux:dateApplicability`). Kantonale Sammlungen haben kein Gegenstück dazu:
weder TI (`m3.ti.ch`, HTML-Ankündigungsabschnitt) noch die LexWork-/OrdoLex-Familie
liefern angekündigte Fassungen über eine gemeinsame, maschinell abfragbare
Schnittstelle. Eine künftige kantonale Fassung erreicht dieses Register darum nur,
wenn ein Mensch sie einträgt.

ANLASS: Am 29.8.2026 wurde die TI-Ankündigung zunächst nicht als Wiedervorlage,
sondern als `stand` des Snapshots verbucht (2027-01-01 statt 17.5.2024) — die
Extraktion las den Ankündigungs-Abschnitt als Teil des Erlasses. Der Wurzel-Fix
sitzt im Adapter (`tiErlassDokument` in `scripts/normtext/adapter-htm.ts`) und im
Tor `check:stand-zukunft`; beide verhindern die falsche Datierung, aber **keines
von beiden erfasst die künftige Fassung als Termin**. Genau dafür steht dieser
Eintrag hier.

Solange kein Kantons-Wiedervorlage-Generator existiert, gilt: wer beim Bau oder
bei einer Verifikation eine angekündigte kantonale Fassung sieht, trägt sie in
diesem Abschnitt ein (S6). Ein Wurzel-Fix (§17) wäre ein Generator, der die
Ankündigungs-Abschnitte der erfassten Kantons-Portale erntet — er ist **nicht**
gebaut und hier bewusst nur benannt, nicht behauptet (§8).

## GebV SchKG (SR 281.35) — ~~Konsolidierung 1.1.2026 nur signiert~~ KORRIGIERT (S8, 7.6.2026)
- ~~«HTML-Manifestation nicht publiziert (nur signiertes PDF)»~~ — **widerlegt
  7.6.2026:** Das Filestore-HTML der Konsolidierung 20260101 existiert, nur
  OHNE das übliche «-N»-Suffix im Dateinamen; seither reproduzierbar gepinnt
  (`fedlex-cache.sh`, Eintrag `gebv_schkg`, Anker art_16/art_15_a geprüft).
- Bereits 6.6.2026 hatte die Kostenrechner-Recherche dieselbe Fundstelle
  (Voll-Diff 2022↔2026: nur Art. 15a/15b geändert) — dieser Registerblock
  hinkte hinterher. Der UI-Vorbehalt in zustaendigkeitKosten kann nach
  Davids Abnahme des Kostenrechner-Dossiers fallen.

## SG GKV — DIVERGENZ zum Sunset 30.6.2026 — AUFGELÖST 1.7.2026
Am 5./6.6.2026 fand die Gebühren-Tiefenerfassung im damals publizierten
konsolidierten Text KEINE Sunset-Klausel und keine publizierte Nachfolge; die
OrdoLex-Metadaten «in Vollzug bis 30. Juni 2026» blieben als Vorbehalt stehen.
**Auflösung 1.7.2026:** Die LexWork-API führt seit heute `current_version` 3863
«Aktuelle Fassung in Vollzug seit: 01.07.2026 (Erlassdatum 05.12.2025)» — die
Nachfolge existierte real (Nachtrag 5.12.2025, nGS 2026-001), war am 6.6. nur
noch nicht in der Konsolidierung sichtbar. Art. 10/11 sind wortgleich zur
Vorfassung (s. Abschnitt «Terminierte Nachfolgefassungen» oben) → die Rechner-
Werte (`zustaendigkeitKosten.SG` / `gerichtskosten.ts`) bleiben unverändert
korrekt; der UI-Vorbehalt kann unabhängig davon nach Davids Abnahme fallen.

## FR Bezirksgericht Saane — PROVISORISCHE Adresse (Re-Audit 6.6.2026)
Route d'Englisberg 13, 1763 Granges-Paccot ist ein Provisorium (Umzug
April 2026, Dauer ~2 Jahre; vorher Route des Arsenaux 17). → ca. Anfang
2028 Rückzug/Definitivum prüfen.

