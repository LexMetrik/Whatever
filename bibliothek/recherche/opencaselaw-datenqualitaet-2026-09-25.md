# OpenCaseLaw — Datumsqualität, Pipeline/API, Abdeckung & Lizenz

**Erstellt:** 25.9.2026 (Session «Urteils-Automatik schärfen», Auftrag David
25.9.2026: «das repo von open case law noch mehr untersuchen» + «mit
mehreren Agenten») · **Abrufdatum: 25.9.2026** · **Status: Erstrecherche,
drei unabhängige Sonnet-Recherchen (read-only, GitHub-API + `mcp.opencaselaw.ch`);
Abnahme David ausstehend.**

Querverweis statt Dublette: `fremdquellen-sichtung-2026-09-02.md` (Zeile ~142)
behandelt OpenCaseLaw bereits allgemein (Umfang, Lizenz, Zulieferer-Chance,
Incapsula-Bypass als Ausschlussfrage) — hier NUR die drei neuen, engeren
Befunde aus dieser Session, keine Wiederholung.

## Quelle + Stand

- Repo `github.com/jonashertner/opencaselaw` (MIT-Code, CC0-Daten laut
  README), `mcp.opencaselaw.ch/api` (OpenAPI-3-Spec unter
  `/api/openapi-v3.json`), alle Abrufe 25.9.2026.
- Pipeline: VPS-Cron (nicht GitHub Actions), Vollbau täglich 03:30 UTC,
  inkrementell Mo–Sa 03:30 UTC, `bger-poller.timer` alle 15 Min Mo–Fr
  05:00–16:45 UTC. `/api/scraper-health` bestätigt `run_at` passend zum Cron.

## Regel deterministisch (Eingabe → Ausgabe)

**A. Datumsherkunft kantonal (`ocl-datum-herkunft.md`).** `decision_date`
aus OCL ist für GR/BE-Verwaltungsgericht und SG NICHT deterministisch
gleich dem amtlichen Entscheiddatum:
- GR + BE-VG: gleicher Parser `scrapers/cantonal/base_tribuna.py:490-499`
  nimmt das ERSTE datumsförmige Token der Zeile, ohne die Spalte
  (Entscheiddatum/Erfasst/Rechtskraft) zu kennen. Gemessenes Fehlmuster
  passt zu `createDate`/`legalDate` statt `decisionDate` (GR-Bestand
  +6…+62 Tage, BE-Bestand +23…+29 Tage; BE-NEU seit dem Docket-Anker-Fix
  vom 27.8.2026 korrekt).
- SG: Court-Code `sg_gerichte` läuft über die entscheidsuche.ch-Ingestion
  (`entscheidsuche_ingest.py:111`), NICHT über den sauberen
  `sg_publikationen.py`-Scraper; plausibel (strukturanalog zu OCL-Issue
  #90, dort für TI/VD belegt), aber für SG nicht letztgültig verifiziert,
  dass das Datum eines nachgelagerten BGer-Verfahrens übernommen wird.
- AG: `decree_date` kommt direkt aus dem JSON-Feld der DecWork/LexWork-API
  (`ag_gerichte.py:24`) — Ursache des gemessenen Tage-Musters UNKLAR, kein
  Codebeleg gefunden.
- OCLs eigene QS (`quality/checks/dates.py`) prüft nur grobe Plausibilität
  (>1 Jahr, Jahr-0000, Docket-Jahr) — Tage-/Wochen-Drift fällt durch jeden
  Filter.
- **Regel für LexMetrik:** `decision_date` aus OCL nie blind für UI-Zitate
  übernehmen (ohnehin durch CLAUDE.md §7 Zitat-Ausnahme verlangt) —
  Kantonsdatum aus dem amtlichen PDF-Kopf lesen. Umgesetzt in
  `plan/posten/2026-09-25-gr-be-datum-quellfehler-1-tag-neu-und-publikationsdatum-im-b.md`
  und `plan/posten/2026-09-25-sg-ag-adapter-entscheiddatum-falsch-wurzel-fix-bestandskorre.md`.

**B. Pipeline & API (`ocl-pipeline-api.md`).** `/decisions` filtert nur
`date_from`/`date_to` auf `decision_date` — es gibt KEINEN
`updated_since`/`scraped_since`-Parameter (Spec-Grep: 0 Treffer). Gemessener
Publikationsverzug: BGer ~8 Tage, be_verwaltungsgericht ~25 Tage (Stichprobe
25.9.2026). **Regel:** ein Wochenlauf, der "alle neuen seit X" finden will,
muss `date_from = letzter Lauf − Sicherheitsmarge` verwenden (nicht die
N neuesten IDs) — geänderte Alt-Entscheide mit gleichbleibendem
`decision_date` bleiben nur per periodischem Voll-Hash-Diff auffindbar,
dafür gibt es keinen API-Weg. Umgesetzt in
`plan/posten/2026-09-25-wochenlauf-zeitfenster-date-from-statt-fester-stueckzahl-ocl.md`.

**C. Abdeckung & Lizenz (`ocl-abdeckung-lizenz.md`).** Unser
`register.json`-Bestand ist bei praktisch jedem gemeinsamen Gerichts-Code
nur ein Bruchteil des OCL-Bestands (z. B. bger 1356 vs. OCL 193'506, bge
1339 vs. OCL 50'502) — Stichprobe/Teilimport, kein Vollabgleich; OCL führt
zusätzlich grosse, bei uns fehlende Gerichte (GE 170'721, VD, TI, ZH-Sozial-
/Verwaltungsgericht u. a.). Lizenz: Code MIT, Daten CC0 laut README (keine
eigene LICENSE-Datei für Daten). **Incapsula-Bot-Schutz-Bypass**
(`incapsula_bypass.py`) betrifft in unserer Gerichtsliste NUR bger und bge
(Code-Suche: 8 Treffer, alle bger/bge-Scraper oder das Modul selbst) —
NICHT bvger/bstger/bpatger/zh/be/sg/gr/ag. **Regel:** solange die
Incapsula-Herkunft nicht bewertet ist, zieht der Wochenlauf bger/bge NICHT
nach — Leitbild-Frage an David offen, siehe
`plan/posten/2026-09-25-bger-nachzug-fehlt-im-wochenlauf-leitbild-frage-incapsula-by.md`.

## Geltungsbereich und Ausnahmen

- Gilt nur für die von uns genutzten Gerichts-Codes (bger, bge, bvger,
  bstger, bpatger, zh_obergericht, be_verwaltungsgericht, sg_gerichte,
  gr_gerichte, ag_gerichte, bs_*). Andere Tribuna-Kantone (FR/JU/LU, gleicher
  Scraper-Code wie GR/BE) sind nicht Teil dieser Session — dieselbe
  Datumsschwäche ist dort plausibel, aber nicht geprüft.
- OCL selbst ist NIE Textquelle (§7) — nur Fundstellen-/Metadaten-Zulieferer;
  der amtliche Volltext/Kopf bleibt massgeblich.
- `fr_gerichte` trägt bei OCL ein Zukunftsdatum (`latest_unvalidated: true`,
  2027) — als Datenfehler des Betreibers erkannt, nicht übernehmen.

## Pflegebedarf

- Kein Verfallsregister-Eintrag (keine amtliche Zahl/Frist, sondern eine
  Code-Analyse eines Fremdrepos zum Stand 25.9.2026) — bei einem OCL-Update
  der genannten Scraper/API-Version erneut stichprobenartig verifizieren.
- Vier Folge-Posten (oben verlinkt) tragen die konkrete Umsetzung; dieses
  Dossier bleibt die Fundstellen-Sammlung dahinter.

## Abnahme-Status

Erstrecherche, drei unabhängige Sonnet-Agenten (read-only), empirisch mit
GitHub-Code-Belegen und Live-API-Proben unterlegt; fachliche Abnahme durch
David aussteht.
