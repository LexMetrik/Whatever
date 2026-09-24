# LexFind / clex — Quellen & strukturierter Import kantonaler Gesetze

**Erstellt:** 23.6.2026 (Auftrag David: «alle kantonalen Gesetze sauber + klickbar
abbilden, ohne jedes einzeln prüfen zu müssen» → Reverse-Engineering von lexfind.ch
+ clex/LexWork-APIs als Quellen-Grundlage).
**Status:** ERSTRECHERCHE (empirisch live verifiziert 23.6.2026; Abnahme durch
David offen).
**Quellen:**
- LexFind-API `https://www.lexfind.ch/api/fe/{de|fr|it}` — Live-Abruf 22./23.6.2026.
- clex/LexWork-Plattformen (Sitrox), exemplarisch `https://ar.clex.ch/api/de/texts_of_law/146.1`
  — Live-Abruf 23.6.2026, version_uid `5f943b504fb0cb838afbebd1813116f9`, Stand 01.01.2025.

## 1. Quelle + Stand

- **LexFind-Aggregator** `https://www.lexfind.ch/api/fe/{de|fr|it}` — offene
  REST-API (keine Auth), aggregiert alle 26 Kantone + Bund. Verifiziert 22./23.6.2026.
- **clex/OrdoLex/LexWork-Kantonsplattformen** (Sitrox) — z.B. `ar.clex.ch`,
  `www.gr-lex.gr.ch`, `www.gesetzessammlung.sg.ch`, `srl.lu.ch`, `bdlf.fr.ch`,
  `lex.vs.ch`, `belex.sites.be.ch`, `www.rechtsbuch.tg.ch`. Verifiziert für AR.

## 2. Regel deterministisch (Endpunkte)

**Entdeckung (LexFind, kantonsweit):**
1. `POST /api/fe/{lang}/fulltext-search` mit `entity_filter:[<id>]` → `{id, session_id}`.
2. `GET /api/fe/{lang}/fulltext-search/{id}?session_id=..&page_no=N&results_per_page=M`
   → `number_of_pages`, `texts_of_law_with_matches[]` mit `systematic_number`,
   `is_active`, `dta_urls[].original_url`, `matches[].title`, `version_active_since`.
3. `GET /api/fe/{lang}/entities/{id}/systematics` → kantonsweiter Systematik-Baum
   (Navigation; Knoten `{identifier,title,parent,children,tols}`).
4. entity-id-Map: CH=27, ZH=26, BE=4, LU=12, UR=22, SZ=19, OW=15, NW=14, GL=9,
   ZG=25, FR=7, SO=18, BS=6, BL=5, SH=17, AR=3, AI=2, SG=16, GR=10, AG=1, TG=20,
   TI=21, VD=23, VS=24, NE=13, GE=8, JU=11.

**Strukturierter Normtext (clex/LexWork, pro Erlass):**
- `original_url` hat die Form `https://{host}/data/{sn}/{lang}` →
  `GET https://{host}/api/{lang}/texts_of_law/{sn}` liefert `text_of_law` mit:
  - `selected_version.xhtml_tol` (flaches getyptes HTML; vom bestehenden
    `adapter-lexwork.ts` geparst) **oder** `…/show_as_json` →
    `selected_version.json_content.document` (getypter Baum `title→article→paragraph`,
    stabile `uid` pro Knoten als Deep-Link-Anker, `text`+`html_content`,
    `footnotes` SEPARAT mit `law_link`-Querverweisen).
  - `version_uid` (Drift-Token), `current_version`/`old_versions` (Versionsgraph),
    `enactment`, `abrogated`, `abrogated_scheduled`, `pdf_link_tol` (amtliches PDF).
- **PDF pro Erlass/Version:** `lexfind.ch/tol/{id}/{lang}` bzw. `/tolv/{vid}/{lang}`
  (`Content-Type: application/pdf`). Erzeuger heterogen pro Behörde (verifiziert via
  PDF-Metadaten): LibreOffice (clex-Mehrheit), MS Word (Bund/NE/GE/JU), Adobe
  FrameMaker/InDesign (ZH/SZ), iText (LU/BL/VD), Aspose (TI). → LexFind rendert
  nichts selbst, es spiegelt das offizielle Behörden-PDF.

**Tier-Klassifikation (Erschliessungsgrad → Render-/Import-Pfad):**
- **Tier A** (getypter Body via LexWork-API) — clex/OrdoLex/LexWork-Hosts. Erschliessbar
  mit dem BESTEHENDEN `adapter-lexwork.ts` (kein neuer Parser, §10).
- **Tier B** (amtliches PDF, layout-extrahierbar) — `adapter-pdf.ts`-Profile.
- **Tier C** (PDF/HTM ohne verlässliche Extraktion → Original einbetten) —
  `zh.ch`-zhlex, `m3.ti.ch`, `silgeneve.ch`, `rsn.ne.ch`, `rsju.jura.ch`.

## 3. Geltungsbereich + empirische Belege (23.6.2026)

- **Phase-0-Beweis AR 146.1 (Datenschutzgesetz):** `show_as_json.json_content.document`
  ist ein getypter, absatzgranularer Baum mit `uid`-Ankern + separaten Fussnoten
  mit `law_link`. Der *plain*-Endpoint liefert zusätzlich `xhtml_tol` (99 KB).
- **Tier-A-Pilot AR 146.1 via bestehendem `adapter-lexwork`:** 35 Artikel sauber
  extrahiert (`nurPdf=false`, stand `2025-01-01`, version_uid `5f943b50…`),
  Treue-Flags **0**, Confidence **1.000** → auto-live-fähig (Status entwurf).
- **Kantonsweite Discovery AR:** **331 in Kraft stehende Erlasse, alle 331 als
  Tier A** klassifiziert (0 PDF-only, 0 unbekannt). Heute im Repo nur die
  tarif-zitierten — der strukturierte Vollkorpus ist über Discovery erreichbar.

## 4. Pflegebedarf

- `version_uid` als Drift-Token pro Erlass (bestehende `check-drift.ts`-Mechanik).
- clex-Markup kann sich ändern → Struktur-Fingerprint-Drift (geplant, FAHRPLAN).
- LexFind-API inoffiziell/undokumentiert → defensiv (Backoff, Schema-Guard, Cache).
- Sprachpfad pro Entity: FR/IT-Kantone (GE/NE/JU/VD/TI/FR/VS) über `/fr/` bzw. `/it/`.

## 5. Massgeblichkeit (§7/§8)

LexFind + clex-Snapshots sind **nicht-massgebende Komfortschicht**; massgebend
bleibt die amtliche kantonale Sammlung (im UI als Live-Link offengelegt). Jeder
Snapshot trägt stand + quelleUrl + version_uid + Drift-Tor (§7-Zitat-Ausnahme).
Auto-akzeptierte Imports bleiben Status «entwurf», nie «geprüft» ohne David.

→ Umsetzungsplan: `FAHRPLAN-GESETZE-IMPORT-3TIER.md` (seit 24.9.2026 archiviert: `archiv/FAHRPLAN-GESETZE-IMPORT-3TIER.md`).
→ Module: `scripts/normtext/lexfind-discovery.ts`, `scripts/normtext/confidence-logik.ts`.
