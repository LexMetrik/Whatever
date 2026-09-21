#!/usr/bin/env bash
# ─── Fedlex-Cache: konsolidierte Filestore-HTMLs laden + Anker prüfen ────────
#
# Reproduzierbare §7-Verifikation: lädt die konsolidierten Fassungen der von
# LexMetrik verwendeten Gesetze nach /tmp (Caches überleben Neustarts nicht)
# und prüft das Anker-Inventar. Konsolidierungsdaten = die im Quellen-Register
# (bibliothek/register/quellen-register.md) dokumentierten, verifizierten Stände —
# bei Rechtsänderungen dort UND hier nachführen.
#
# Aufruf:  bash scripts/fedlex-cache.sh
set -u

BASIS="https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli"

# gesetz|eli|konsolidierung|html-N|pflicht-anker|sr
#
# ── P1-a/b KANONIK-RE-PIN (11.7.2026, Querschnitts-Wurzel) ────────────────────
# Das html-N JEDES Pins ist jetzt die KANONISCHE isExemplifiedBy-Manifestation
# (SPARQL: isRealizedBy(DEU) → isEmbodiedBy(userFormat=html) → isExemplifiedBy),
# aufgelöst von scripts/fedlex-manifest.ts, angewandt von fedlex-repin-kanonik.ts,
# als Dauer-Tor bewacht von check:fedlex-versionen (Kanonik-Arbiter). 166 von 227
# Pins docken FRÜHER an der nicht-kanonischen ALIAS-URL (…-de-html.html ohne
# -N-Suffix): die lieferte je Erlass content-äquivalentes HTML, einen Alt-
# Generations-Dump ODER eine Soft-404-Casemates-Shell — die 1–5-Fallback-Heuristik
# hätte die echten kanonischen N (kov/ssv/kkv_finma=14, chemrrv=26, finma_gebv=17,
# mwstv=11 …) nie gefunden. Deshalb: html-N = registrierte Manifestation, KEINE
# Konstruktion mehr (wie U-PDF #189 / Paket 4). Betroffene Snapshots/Struktur-
# Sidecars aus der kanonischen Fassung regeneriert (nur wo der Diff amtlich vom
# alten Dump abweicht — reine Datum-Churn zurückgesetzt). Alle Änderungen sind
# AMTLICH (Quell-URL alias→kanonisch, KEIN Parser-Eingriff). Die alten inline-
# «n=0 / OHNE -N-Suffix»-Vermerke einzelner Pins sind damit überholt (n trägt jetzt
# das kanonische Revisions-N). Beleg: bibliothek/register/fedlex-pin-kanonik-2026-07-11.md.
#
# ── QS-CURRENCY Re-Pin-Batch (5.7.2026, Fedlex-Portfolio Paket 1 · P1-a) ──────
# 18 überholte Bund-Snapshots auf die geltende Konsolidierung gehoben (SPARQL
# dateApplicability, letzte ≤ heute). html-N je Erlass SPARQL-KANONISCH via
# jolux:isExemplifiedBy (nicht die 1–5-Fallback-Heuristik — klv/vrv=8, ssv=14
# liegen ausserhalb!): Filestore-Inhalts-Sonde (Anker + SR) + SPARQL stimmen
# überein. Neue Stände: 20260701 → kvg kvv svg rpg klv vrv ssv rpv vts mepv bpv
# vil fdv; 20260201 → argv2; 20260612 → asylv1 asylv2 asylv3 icao. Artikel-Diff
# (Inventar alt→neu, +85 neue Artikel, 9 eId-Renames/Bereichs-Regroups 1:1 belegt,
# 0 echter Verlust; VRV-«99 geändert» ≈ Soft-Hyphen-Bereinigung der N=8-Fassung,
# kein Sachinhalt): Details bibliothek/register/fedlex-currency-2026-07-05.md.
# EMRK/NYÜ (pdf-embed) separat in src/lib/normtext/pdf-embed.ts re-gepinnt.
EINTRAEGE=(
  "or|cc/27/317_321_377|20260101|12|art_11,art_32,art_77,art_104,art_216,art_324_a,art_335_c,art_336_c,art_396,art_493|220"
  # Re-Pin 20260101→20260701 (§7-Nachverifikation 1.7.2026, AS 2026 94 gewaltfreie
  # Erziehung art_302 + AS 2026 16 Besitzesschutz art_926 ff.). Alle 6 zitierten Anker
  # byte-identisch, Inventar 1099→1099 (art_302 Intra-Artikel, kein neuer Anker).
  # FALLE unter dieser Konsolidierung: mehrere html-Revisionen liefern echtes HTML,
  # und die niedrigste ist STALE (ohne AS 2026 94). Welche kanonisch ist, steht
  # NICHT in diesem Kommentar, sondern im 4. Feld der Datenzeile — dort gepflegt von
  # fedlex-repin-kanonik.ts (isExemplifiedBy) und bewacht von check:fedlex-versionen.
  # (Der Kommentar nannte bis 3.8.2026 «html-1 kanonisch», während das Feld auf 2
  # stand: eine zweite Wahrheit neben dem Pin, §5 — darum jetzt ohne Revisionsnummer.)
  "zgb|cc/24/233_245_233|20260701|2|art_19_c,art_360,art_361,art_370,art_467,art_505|210"
  # ZPO-Anker um die Rechtsmittel-Artikel erweitert (Umbau 6.6.2026).
  # Re-Pin 20250101→20260701 (§7-Nachverifikation 1.7.2026, AS 2026 16 Besitzesschutz:
  # neu art_260_a/art_260_b, nicht zitiert). No-Suffix (n=0; n≥1 = Casemates-SPA). Alle 14
  # zitierten Anker operativ byte-identisch (art_314 nur Fussnoten-Reklassifikation, Fristen 10/30 T. unverändert).
  "zpo|cc/2010/262|20260701|1|art_4,art_6,art_68,art_145,art_197,art_198,art_199,art_210,art_212,art_243,art_308,art_314,art_319,art_321|272"
  # SchKG-Anker um die Zuständigkeits-Karten-Pillen erweitert (Katalog-Split 6.6.2026).
  # Re-Pin 20250101→20260101 (§7-Nachverifikation 7.6.2026): alle engine-
  # tragenden Artikel (46–53, 56, 63, 83–88, 166, 174, 250, 271–280) body-
  # identisch; einzige Normänderung Art. 230 (10→20 T., nicht verdrahtet),
  # neu art_222a (nicht verdrahtet). Anker +88/+166 (Verwirkungsfristen-Drift).
  "schkg|cc/11/529_488_529|20260101|3|art_17,art_46,art_56,art_63,art_84,art_88,art_166,art_272|281.1"
  "arg|cc/1966/57_57_57|20230901|6|art_9,art_12,art_13,art_46|822.11"
  # VMWG: Re-Pin 20250101→20251001 (§7-Nachverifikation 7.6.2026). Die alte
  # «nur SPA-Shell»-Annahme war FALSCH — die Datei liegt OHNE «-N»-Suffix
  # (n=0, Muster GebV SchKG). art_19_a existiert seit 1.10.2025 (V 21.3.2025,
  # AS 2025 191): Staffel-Mitteilung neu in 19a, Index-Teil bleibt in 19 II;
  # Art. 16/17 byte-identisch zu 20250101 (Teuerungs-Engine unberührt).
  "vmwg|cc/1990/835_835_835|20251001|0|art_16,art_17,art_19,art_19_a|221.213.11"
  # StPO-Anker um die Straf-Zuständigkeits-Pillen erweitert (6.6.2026).
  # Re-Pin 20240101→20250401 (§7-Nachverifikation 7.6.2026, Auslöser AS 2025
  # 178 [USG, nur Art. 269]): Gerichtsstands-Kaskade 31–42, Fristen/Wege
  # 301/354–357/381–402/410 f. wortidentisch; einzig Art. 393 I lit. c neu
  # gefasst (Sexualstrafrecht-Rev., AS 2024 27) — nur Fundstellen-Zitat.
  "stpo|cc/2010/267|20250401|4|art_31,art_129,art_301,art_379|312.0"
  # Re-Pin 20210101→20220701 (§7-Nachverifikation 7.6.2026): Art. 11/20
  # byte-identisch; einzige Änderung Art. 66 II lit. d (EGMR, AS 2022 289).
  # Künftige Konsolidierung 20270101 existiert, HTML noch leer — NICHT pinnen.
  "vwvg|cc/1969/737_757_755|20220701|17|art_11|172.021"
  # BGG: bisher Ad-hoc-Cache — seit 6.6.2026 reproduzierbar gepinnt (html-1
  # empirisch bestätigt; Grundlage bestimmeRechtsmittel + Dossier
  # bibliothek/recherche/bgg-beschwerde-engine.md).
  # Re-Pin 20250101→20260401 (§7-Nachverifikation 7.6.2026, Auslöser AS 2026
  # 99 = energierechtl. Beschleunigungserlass): nur Art. 83 z-bis/z-ter,
  # 117 II, 132b (Wasserkraft — nicht verdrahtet); ALLE engine-tragenden
  # Artikel (45–47, 51, 74, 75, 92 f., 98, 100, 113 ff.) wortidentisch.
  # ACHTUNG: Das ist NICHT die «kleine BGG-Revision» (Botschaft 5.12.2025) —
  # deren Monitoring im Verfallsregister bleibt offen!
  "bgg|cc/2006/218|20260401|2|art_45,art_46,art_74,art_75,art_93,art_98,art_100,art_113|173.110"
  # BGerR (Reglement für das Bundesgericht, SR 173.110.131): gepinnt 11.6.2026
  # für die Abteilungs-Auskunft (BGer-Rechtsweg-Ausbau; Vorverifikation
  # 7.6.2026 im Dossier behoerden/rechtsmittel-spruchkoerper-kantone.md §3 —
  # ELI cc/2006/834, Konsolidierung 1.2.2026, Filestore NUR ohne -N-Suffix;
  # seit 1.2.2026 ZWEI strafrechtliche Abteilungen Art. 35/35a, AS 2025 856).
  # 29.6.2026: URL bestätigt korrekt (SPARQL = kanonische HTML-Manifestation,
  # 117 kB, 69 art_-Anker, SR 173.110.131, art_35_a vorhanden). Die 9-kB-
  # «Casemates»-SPA-Shell der B1-Re-Segnung (28.6.) war ein TRANSIENTER
  # Filestore-Fehler, KEIN URL-Problem — frischer Fetch liefert echtes HTML;
  # BGERR am 29.6. mit-regeneriert (drei M6-Tiefe-shas Art. 29/30/34).
  "bgerr|cc/2006/834|20260201|0|art_33,art_34,art_35,art_35_a,art_36|173.110.131"
  # VVG: gepinnt 6.6.2026 (html-2!, 200 kB; Kündigungs-Maske 3 — 35a/b/c
  # + Zwingend-Kataloge 97/98 am Wortlaut verifiziert).
  "vvg|cc/24/719_735_717|20240101|14|art_35_a,art_35_b,art_35_c,art_97,art_98|221.229.1"
  # HRegV: gepinnt 6.6.2026 (Gründungs-Masken GmbH/AG; 20250101 = neuste
  # greifbare Konsolidierung, 1.7.2025/1.1.2026 liefern nur die SPA-Shell).
  # Beleg-Artikel 43/44/71/72 + Form (18/20/21/22/23/24a) + Domizil 117.
  "hregv|cc/2007/686|20250101|6|art_18,art_20,art_21,art_22,art_23,art_24_a,art_43,art_44,art_45,art_71,art_72,art_117|221.411"
  # GebV-HReg: gepinnt 6.6.2026 (HReg-Gebühren, Anhang Ziff. 1.3 = CHF 420;
  # ELI via SPARQL aufgelöst, 20210101 = einzige Konsolidierung; nur ~30 kB!).
  "gebv_hreg|cc/2020/180|20210101|6|art_3,art_4,art_8|221.411.1"
  # GebV SchKG: gepinnt 7.6.2026 (Bibliotheks-Standard S3-Nachzug — der
  # Betreibungskosten-Rechner nutzte einen Ad-hoc-Cache; ELI lt. Dossier
  # gebv-schkg-kostenrechner.md, Konsolidierung 1.1.2026).
  "gebv_schkg|cc/1996/2937_2937_2937|20260101|0|art_16,art_15_a|281.35"
  # StGB: gepinnt 7.6.2026 (S3-Nachzug — strafrecht-cluster.md nutzte einen
  # Ad-hoc-Cache ohne dokumentiertes ELI; Verjährung 97 ff., Antrag 30 ff.).
  # Re-Pin 20260101→20260612 (terminiert, vollzogen 12.6.2026): AS 2026 231
  # (Eurodac/Schengen) ändert nur Art. 354/357 (nicht verdrahtet); alle
  # zitierten Artikel normtext-identisch, Anker-Inventar 477/477 stabil;
  # neue Datei liegt OHNE -N-Suffix (n=0, Muster GebV SchKG).
  "stgb|cc/54/757_781_799|20260612|4|art_30,art_97,art_98,art_101,art_109,art_333,art_389|311.0"
  # StG: gepinnt 6.6.2026 (Emissionsabgabe in den Gründungs-Masken:
  # Art. 8 Abs. 1 = 1 %, Art. 6 Abs. 1 lit. h = Freibetrag 1 Mio.;
  # 20240101 = neuste Konsolidierung).
  "stg|cc/1974/11_11_11|20240101|3|art_5,art_6,art_8|641.10"
  # KVG: gepinnt 11.6.2026 (KVG-Preset der Kündigungs-Maske 3 — Art. 7
  # Wechsel des Versicherers, Art. 64a Abs. 6 Ausstands-Sperre; 20260101 =
  # neuste echte Konsolidierung, 202602–202606 liefern nur die SPA-Shell;
  # Datei OHNE -N-Suffix. Dossier kvg-grundversicherung-kuendigung.md).
  "kvg|cc/1995/1328_1328_1328|20260701|1|art_7,art_62,art_64_a|832.10"
  # KVV: gepinnt 11.6.2026 (besondere Versicherungsformen: Art. 94 Abs. 2 /
  # Art. 100 Abs. 3 — Wechsel nur auf Jahresende, Fassung AS 2024 697).
  "kvv|cc/1995/3867_3867_3867|20260801|0|art_94,art_99,art_100|832.102"
  # ── Erweiterung 17.6.2026 (jedes zitierte Bundesgesetz mit Volltext-Snapshot,
  # Auftrag David). ELI + geltende Konsolidierung via Fedlex-SPARQL ermittelt,
  # SR-Nr. + Pflicht-Anker am Filestore-HTML empirisch verifiziert (§7). Alle n=0.
  "mwstg|cc/2009/615|20250331|4|art_22,art_26|641.20"
  "urg|cc/1993/1798_1798_1798|20250701|7|art_17|231.1"
  "bewg|cc/1984/1148_1148_1148|20230701|7|art_2,art_5,art_18|211.412.41"
  "eog|cc/1952/1021_1046_1050|20260601|1|art_16_c|834.1"
  "svg|cc/1959/679_705_685|20260701|0|art_65|741.01"
  "dsg|cc/2022/491|20250707|1|art_25|235.1"
  "bbg|cc/2003/674|20250301|3|art_14|412.10"
  # GBV/JStPO ergänzt 17.6.2026. GBV: neuste Konsolidierung MIT Filestore-HTML
  # ist 20240101 (spätere nur SPA-Shell, Live-Link massgeblich, Muster VMWG).
  "gbv|cc/2011/667|20240101|7|art_86|211.432.1"
  "jstpo|cc/2010/226|20250701|3|art_10|312.1"
  # ── Volltext-Ausbau 19.6.2026 (Batch «wichtigste»): ELI/Konsolidierung/n=0
  #    empirisch am Filestore-HTML verifiziert, alle Pflicht-Anker vorhanden. ──
  "bv|cc/1999/404|20240303|10|art_1,art_5,art_8,art_36,art_190|101"
  "dbg|cc/1991/1184_1184_1184|20260902|1|art_1,art_16,art_33,art_125,art_205|642.11"
  "vstg|cc/1966/371_385_384|20250101|11|art_1,art_4,art_13,art_21,art_61|642.21"
  "kg|cc/1996/546_546_546|20230701|5|art_1,art_4,art_5,art_7,art_30|251"
  "fusg|cc/2004/320|20230101|9|art_1,art_3,art_29,art_69|221.301"
  "mschg|cc/1993/274_274_274|20250701|3|art_1,art_3,art_13,art_30|232.11"
  "uwg|cc/1988/223_223_223|20250101|5|art_1,art_2,art_3,art_23|241"
  "patg|cc/1955/871_893_899|20250701|5|art_1,art_3,art_8,art_66|232.14"
  # ── Volltext-Ausbau Bund 23.6.2026 (Promotion aus nur-live-link-Stubs;
  #    Konsolidierung via ELI-Resolver/SPARQL geltend-verifiziert, art_1 am
  #    Filestore-HTML bestätigt, §7). NUR Erlasse, die der bestehende Extraktor
  #    (class="absatz"-Markup) sauber erfasst — IPRG/BetmG/VStrR (ältere
  #    plain-<p>-Intros vor <dl>) brauchen erst einen verifizierten Parser-Fix. ──
  "partg|cc/2005/782|20250101|2|art_1|211.231"
  "jstg|cc/2006/551|20250701|4|art_1|311.1"
  "iprg|cc/1988/1776_1776_1776|20260101|3|art_1|291"
  "betmg|cc/1952/241_241_245|20230901|14|art_1|812.121"
  "vstrr|cc/1974/1857_1857_1857|20230901|5|art_1|313.0"
  # ── Volltext-Ausbau Bund Batch 2 (23.6.2026) — klar aktuelle Konsolidierungen
  #    (≥2023, SPARQL-geltend); Currency zusätzlich via check:fedlex-versionen. ──
  "atsg|cc/2002/510|20240101|4|art_1|830.1"
  "bvg|cc/1983/797_797_797|20250101|13|art_1|831.40"
  "uvg|cc/1982/1676_1676_1676|20260101|0|art_1|832.20"
  "avig|cc/1982/2184_2184_2184|20260101|1|art_1|837.0"
  "rpg|cc/1979/1573_1573_1573|20260701|3|art_1|700"
  "usg|cc/1984/1122_1122_1122|20260801|3|art_1|814.01"
  "vgg|cc/2006/352|20260612|2|art_1|173.32"
  "bgfa|cc/2002/153|20250701|1|art_1|935.61"
  "kkg|cc/2002/593|20230901|5|art_1|221.214.1"
  "gwg|cc/1998/892_892_892|20240301|7|art_1|955.0"
  # ── Batch 3 (23.6.2026) — Resolver-Daten; Currency via check:fedlex-versionen korrigiert. ──
  "ivg|cc/1959/827_857_845|20260101|8|art_1|831.20"
  "famzg|cc/2008/51|20260101|1|art_1|836.2"
  "sthg|cc/1991/1256_1256_1256|20250101|11|art_1|642.14"
  "aig|cc/2007/758|20260612|3|art_1|142.20"
  "asylg|cc/1999/358|20260612|0|art_1|142.31"
  "glg|cc/1996/1498_1498_1498|20200701|7|art_1|151.1"
  "finmag|cc/2008/736|20250401|2|art_1|956.1"
  "bgbb|cc/1993/1410_1410_1410|20140101|10|art_1|211.412.11"
  # ── Batch 4 (23.6.2026) — korrekte Konsolidierung via Filestore-HTML-Sonde
  #    (ELI-Resolver gab hier veraltete/HTML-lose Daten; neueste MIT HTML gepinnt). ──
  "ahvg|cc/63/837_843_843|20260101|1|art_1|831.10"
  "bankg|cc/51/117_121_129|20240101|6|art_1|952.0"
  "hmg|cc/2001/422|20250101|7|art_1|812.21"
  # ── Punkt 12 Batch 1 (24.6.2026) — Bund-Gesetze aus Davids Anwaltsprüfungs-
  #    Bookmark-Liste, Promotion aus nur-live-link-Stubs. ELI/Konsolidierung via
  #    Resolver, danach gegen check:fedlex-versionen + Filestore-HTML-Sonde
  #    korrigiert (art_1 + Stichproben empirisch verifiziert, §7). ──
  "bueg|cc/2016/404|20230901|6|art_1|141.0"
  "bgoe|cc/2006/355|20231101|7|art_1|152.3"
  "bpr|cc/1978/688_688_688|20221023|11|art_1|161.1"
  "vg|cc/1958/1413_1483_1489|20250615|0|art_1|170.32"
  "publg|cc/2004/745|20230901|9|art_1|170.512"
  "parlg|cc/2003/510|20260302|2|art_1|171.10"
  "rvog|cc/1997/2022_2022_2022|20250501|3|art_1|172.010"
  "boeb|cc/2020/126|20260101|1|art_1|172.056.1"
  "bpg|cc/2001/123|20240101|7|art_1|172.220.1"
  "stbog|cc/2010/444|20240101|2|art_1|173.71"
  "desg|cc/2002/226|20250701|4|art_1|232.12"
  "ohg|cc/2008/232|20250101|5|art_1|312.5"
  "nhg|cc/1966/1637_1694_1679|20250801|2|art_1|451"
  "entg|cc/47/689_701_723|20210101|7|art_1|711"
  "gschg|cc/1992/1860_1860_1860|20250801|5|art_1|814.20"
  "entsg|cc/2003/231|20240101|2|art_1|823.20"
  "elg|cc/2007/804|20260101|3|art_1|831.30"
  "fzg|cc/1994/2386_2386_2386|20240101|3|art_1|831.42"
  "wag|cc/1992/2521_2521_2521|20250801|3|art_1|921.0"
  "pueg|cc/1986/895_895_895|20260508|1|art_1|942.20"
  "fidleg|cc/2019/758|20240301|4|art_1|950.1"
  "kag|cc/2006/822|20240301|7|art_1|951.31"
  "finig|cc/2018/801|20240301|4|art_1|954.1"
  "finfrag|cc/2015/853|20240201|5|art_1|958.1"
  "vag|cc/2005/734|20240901|6|art_1|961.01"
  # ── Punkt 12 Batch 2 (24.6.2026, Bund-VERORDNUNGEN Volltext, Promotion aus
  #    nur-live-link). ELI/Konsolidierung via date-geordnete Taxonomie-Abfrage
  #    (Resolver gab vielfach die REPEALTE Vorgänger-VO — geltende Konsolidierung
  #    gewählt, gegen check:fedlex-versionen) + Filestore-HTML-Inhalts-Sonde
  #    (art_1 + Artikelzahl == Snapshot) + SR-Kollisions-Tor (6. Feld) verifiziert (§7). ──
  "ahvv|cc/63/1185_1183_1185|20260101|0|art_1|831.101"
  "ivv|cc/1961/29_29_29|20250601|0|art_1|831.201"
  "elv|cc/1971/37_37_37|20250101|8|art_1|831.301"
  "bvv_2|cc/1984/543_543_543|20260801|0|art_1|831.441.1"
  "uvv|cc/1983/38_38_38|20260101|0|art_1|832.202"
  "aviv|cc/1983/1205_1205_1205|20260801|0|art_1|837.02"
  "atsv|cc/2002/569|20240101|2|art_1|830.11"
  "klv|cc/1995/4964_4964_4964|20260801|0|art_1|832.112.31"
  "mwstv|cc/2009/828|20250101|11|art_1|641.201"
  "vstv|cc/1966/1585_1641_1624|20250101|6|art_1|642.211"
  "vzae|cc/2007/759|20260612|2|art_1|142.201"
  "vrv|cc/1962/1364_1409_1420|20260701|8|art_1|741.11"
  "vzv|cc/1976/2423_2423_2423|20260101|3|art_1|741.51"
  "ssv|cc/1979/1961_1961_1961|20260701|14|art_1|741.21"
  "dsv|cc/2022/568|20251201|2|art_1|235.11"
  "argv1|cc/2000/243|20240901|3|art_1|822.111"
  "bewv|cc/1984/1164_1164_1164|20240301|4|art_1|211.412.411"
  "buev|cc/2016/405|20260801|0|art_1|141.01"
  "fzv|cc/1994/2399_2399_2399|20260801|0|art_1|831.425"
  "kov|cc/27/751_749_771|20210801|14|art_1|281.32"
  "rpv|cc/2000/310|20260701|2|art_1|700.1"
  "vbb|cc/1996/2877_2877_2877|20160101|8|art_1|281.31"
  "voeb|cc/2020/127|20230901|8|art_1|172.056.11"
  "vzg|cc/36/425_433_469|20120101|6|art_1|281.42"
  "bvv3|cc/1985/1778_1778_1778|20250101|5|art_1|831.461.3"
  "mvv|cc/1993/3080_3080_3080|20260101|0|art_1|833.11"
  "eov|cc/2005/187|20260601|0|art_1|834.11"
  "famzv|cc/2008/52|20250101|6|art_1|836.21"
  "argv2|cc/2000/244|20260201|0|art_1|822.112"
  "argv3|cc/1993/2553_2553_2553|20240901|3|art_1|822.113"
  "argv4|cc/1993/2564_2564_2564|20150501|6|art_1|822.114"
  "vev|cc/2018/493|20260612|1|art_1|142.204"
  "vinta|cc/2018/511|20251201|0|art_1|142.205"
  "asylv1|cc/1999/359|20260612|0|art_1|142.311"
  "asylv2|cc/1999/360|20260714|2|art_1|142.312"
  "asylv3|cc/1999/361|20260612|0|art_1|142.314"
  "gschv|cc/1998/2863_2863_2863|20251201|1|art_1|814.201"
  "lrv|cc/1986/208_208_208|20260801|2|art_1|814.318.142.1"
  "lsv|cc/1987/338_338_338|20260401|1|art_1|814.41"
  "vvea|cc/2015/891|20260801|4|art_1|814.600"
  "chemv|cc/2015/366|20260424|0|art_1|813.11"
  "nhv|cc/1991/249_249_249|20250801|2|art_1|451.1"
  "wav|cc/1992/2538_2538_2538|20250801|2|art_1|921.01"
  "vts|cc/1995/4425_4425_4425|20260701|0|art_1|741.41"
  "bankv|cc/2014/273|20250101|10|art_1|952.02"
  "kkv|cc/2006/859|20251125|5|art_1|951.311"
  "erv|cc/2012/629|20250124|7|art_1|952.03"
  "finiv|cc/2019/763|20250101|4|art_1|954.11"
  "finfrav|cc/2015/854|20250101|4|art_1|958.11"
  "fidlev|cc/2019/759|20220101|11|art_1|950.11"
  "avo|cc/2005/735|20260226|0|art_1|961.011"
  "gwv_finma|cc/2015/390|20230101|10|art_1|955.033.0"
  "vam|cc/2018/588|20260101|0|art_1|812.212.21"
  "ambv|cc/2018/786|20250315|1|art_1|812.212.1"
  "mepv|cc/2020/552|20260701|2|art_1|812.213"
  "epv|cc/2015/298|20250101|2|art_1|818.101.1"
  "bpv|cc/2001/319|20260701|0|art_1|172.220.111.3"
  "rvov|cc/1999/170|20260301|3|art_1|172.010.1"
  "vgke|cc/2008/321|20100401|6|art_1|173.320.2"
  "betmkv|cc/2011/362|20230123|3|art_1|812.121.1"
  "qstv|cc/2018/274|20250110|1|art_1|642.118.2"
  # ── Punkt 12 Batch 3 (25.6.2026): Promotion nur-live-link-Stub → Volltext ──
  #    (16 Gesetze + ZStV; geltende Konsolidierung + SR-Sonde je Pin geprüft).
  "sortg|cc/1977/862_862_862|20110101|14|art_1|232.16"
  "prg|cc/1993/3152_3152_3152|20210820|9|art_1|944.3"
  "beg|cc/2009/450|20230101|8|art_1|957.1"
  "mstg|cc/43/359_375_369|20260608|0|art_1|321.0"
  "mstp|cc/1979/1059_1059_1059|20240701|4|art_1|322.1"
  "irsg|cc/1982/846_846_846|20240101|9|art_1|351.1"
  "mvg|cc/1993/3043_3043_3043|20240101|3|art_1|833.1"
  "eng|cc/2017/762|20260401|1|art_1|730.0"
  "co2_gesetz|cc/2012/855|20250101|6|art_1|641.71"
  "epg|cc/2015/297|20250801|2|art_1|818.101"
  "txg|cc/2007/279|20210201|12|art_1|810.21"
  "lmg|cc/2017/62|20241001|5|art_1|817.0"
  "lfg|cc/1950/471_491_479|20260101|0|art_1|748.0"
  "ebg|cc/1958/335_341_347|20260101|0|art_1|742.101"
  "fmg|cc/1997/2187_2187_2187|20260601|2|art_1|784.10"
  "mg|cc/1995/4093_4093_4093|20260601|1|art_1|510.10"
  "zstv|cc/2004/362|20250601|5|art_1|211.112.2"
  "thg|cc/1996/1725_1725_1725|20230901|4|art_1|946.51"
  "bgbm|cc/1996/1738_1738_1738|20250101|4|art_1|943.02"
  # ── Punkt 12 Batch 3 (25.6.2026): kuratierte zentrale Bundes-VERORDNUNGEN ──
  #    (geltende Konsolidierung via date-geordnete Taxonomie + SR-Sonde geprüft;
  #    repealte Vorgänger-ELIs des einfachen Resolvers verworfen.)
  "mschv|cc/1993/296_296_296|20250701|4|art_1|232.111"
  "patv|cc/1977/2027_2027_2027|20250701|7|art_1|232.141"
  "desv|cc/2002/183|20250701|1|art_1|232.121"
  "urv|cc/1993/1821_1821_1821|20250701|6|art_1|231.11"
  "tgbv|cc/2013/3|20240101|8|art_1|211.432.11"
  "bkv|cc/1993/1363_1363_1363|20260101|0|art_1|642.118.1"
  "zentv|cc/2002/29|20230901|5|art_1|360.1"
  "vkkg|cc/2002/594|20210701|10|art_1|221.214.11"
  "argv5|cc/2007/692|20240401|2|art_1|822.115"
  "vvk|cc/2007/101|20230101|3|art_1|832.105"
  "vkl|cc/2002/418|20250601|0|art_1|832.104"
  "vfv|cc/1961/419_429_439|20250101|5|art_1|831.111"
  "bbv|cc/2003/748|20250301|2|art_1|412.101"
  "bmv|cc/2009/423|20160823|7|art_1|412.103.1"
  # ── TOTALREVISION BMV (W2·18-FEHLERBUCH, 12.9.2026) ────────────────────────
  # SR 412.103.1 trägt seit dem 1.3.2026 einen NEUEN Erlass: die Verordnung vom
  # 13. Juni 2025 über die eidgenössische Berufsmaturität (ELI cc/2025/408). Sie
  # hebt die Fassung von 2009 (Zeile darüber, ELI cc/2009/423) in ihrem Art. 34
  # ausdrücklich auf und tritt nach Art. 36 am 1.3.2026 in Kraft.
  # ZWEI Pins auf DERSELBEN SR sind hier Absicht, kein Duplikat (§5/§8): der
  # alte Pin trägt den historischen, ausdrücklich als aufgehoben deklarierten
  # Text (src/lib/normtext/aufhebungen.ts, Register-Badge «aufgehoben»), der
  # neue die geltende Fassung. Ein Re-Pin der bmv-Zeile hätte den historischen
  # Text ersatzlos aus dem Korpus entfernt — die Aufhebungs-Deklaration, ihr
  # Nachfolge-Vermerk und die Wiedervorlage-Mechanik hängen an genau diesem ELI.
  # Kanonische html-Manifestation via isExemplifiedBy (scripts/fedlex-manifest.ts,
  # aufgelöst 12.9.2026): n=0, echt suffixlose Datei (KEINE Alias-Konstruktion).
  # Amtlich verifiziert 12.9.2026 (Fedlex-SPARQL): einzige Konsolidierung
  # 2026-03-01, kein dateNoLongerInForce, Taxonomie-Slot 6599 skos:notation
  # «412.103.1», Status CURRENT.
  "bmv_2025|cc/2025/408|20260301|0|art_1,art_34,art_36|412.103.1"
  "zemis_v|cc/2006/303|20260801|0|art_1|142.513"
  "adov|cc/2011/505|20230123|5|art_1|211.221.36"
  "rdv|cc/2012/713|20260820|1|art_1|143.5"
  "zavv|cc/2008/760|20230101|4|art_1|364.3"
  "akkbv|cc/1996/1904_1904_1904|20250101|7|art_1|946.512"
  "finfrav_finma|cc/2015/855|20230201|5|art_1|958.111"
  "finma_gebv|cc/2008/749|20240301|17|art_1|956.122"
  "kkv_finma|cc/2014/707|20210101|14|art_1|951.312"
  "nbv|cc/2004/233|20240701|4|art_1|951.131"
  "pavo|cc/1977/1931_1931_1931|20230123|3|art_1|211.222.338"
  "vgr|cc/2008/320|20230601|3|art_1|173.320.1"
  "skv|cc/2007/296|20260101|1|art_1|741.013"
  "vvv|cc/1959/1271_1321_1317|20260101|1|art_1|741.31"
  "vil|cc/1994/3050_3050_3050|20260701|0|art_1|748.131.1"
  "fdv|cc/2007/166|20260701|1|art_1|784.101.1"
  "fav|cc/2016/24|20240815|10|art_1|784.101.2"
  "uvpv|cc/1988/1931_1931_1931|20250101|1|art_1|814.011"
  # Re-Pin 20260101→20260716 (§7-Nachverifikation 18.7.2026): Fedlex publizierte
  # am 16.7.2026 die neue ChemRRV-Konsolidierung (check:fedlex-versionen-Arbiter,
  # dateApplicability ≤ heute) — die alte 20260101-Fassung war html-26.
  # Korrektur (Gegenprüfung PR #383, 27.7.2026, F2): html-0 (SUFFIXLOS) war die
  # nicht-kanonische ALIAS-URL, nicht die kanonische Manifestation — sie trug in
  # Anhang 2 Ziff. 12 eine eId-Kollision (lvl_7 doppelt). Kanonisch per
  # isExemplifiedBy ist html-1 (…-20260716-de-html-1.html), von
  # fedlex-repin-kanonik.ts aufgelöst und re-gepinnt. Filestore-Sonde: 933 kB,
  # srnummer 814.81, art_1 vorhanden (kein Casemates-Shell).
  "chemrrv|cc/2005/478|20260716|1|art_1|814.81"
  "veva|cc/2005/551|20250801|0|art_1|814.610"
  "vgvp|cc/2000/299|20220101|10|art_1|814.621"
  # ── International: Staatsverträge SR 0.* als Volltext (Auftrag David 25.6.2026) ──
  # ELI/Konsolidierung via fedlex:eli aufgelöst; SR-Sonde + art_1-Anker verifizieren je Vertrag.
  "cisg|cc/1991/307_307_307|20260522|0|art_1|0.221.211.1"
  "lugue|cc/2010/801|20160408|12|art_1|0.275.12"
  "hzue|cc/1994/2809_2809_2809|20230612|7|art_1|0.274.131"
  "hbewue|cc/1994/2824_2824_2824|20260101|0|art_1|0.274.132"
  "hkue|cc/1983/1694_1694_1694|20240613|4|art_1|0.211.230.02"
  "fza|cc/2002/243|20201215|9|art_1|0.142.112.681"
  "vrk|cc/1990/1112_1112_1112|20200508|12|art_1|0.111"
  "uno_pakt_ii|cc/1993/750_750_750|20220509|15|art_1|0.103.2"
  # ── International P2 (25.6.2026): weitere Staatsverträge SR 0.* als Volltext.
  # ELI/Kons via SPARQL + Filestore-HTML-Gehalt (art_-Anker) je Vertrag verifiziert.
  "uno_pakt_i|cc/1993/725_725_725|20241128|5|art_1|0.103.1"
  "krk|cc/1998/2055_2055_2055|20260612|0|art_1|0.107"
  "cedaw|cc/1999/239|20230419|6|art_1|0.108"
  "uno_antifolter|cc/1987/1307_1307_1307|20260528|1|art_1|0.105"
  "heue|cc/2009/381|20230509|2|art_1|0.211.232.1"
  "haue|cc/2003/99|20250507|0|art_1|0.211.221.311"
  "pvue|cc/1970/620_620_620|20240109|6|art_1|0.232.04"
  "icao|cc/63/1377_1378_1381|20260612|2|art_1|0.748.0"
  "staatenlose|cc/1972/2320_2374_2150|20260522|0|art_1|0.142.40"
  "gfk|cc/1955/443_461_469|20120614|4|art_1|0.142.30"
  # ── Fedlex-Portfolio Paket 4 (10.7.2026): kuratierte Staatsverträge SR 0.*.
  # Königsweg = konsolidierte eli/cc-Pipeline (kein eli/treaty-Extraktor). html-N
  # SPARQL-KANONISCH via jolux:isExemplifiedBy — FALLE (wie P1-a): html-0 lädt für
  # EAUe/CMR/RBÜ/Istanbul/HUVÜ ein STALES/nicht-kanonisches Manifest (das cache.sh-
  # 1..5-Fallback hätte html-0 akzeptiert und nie das kanonische -N geholt), darum
  # das kanonische N je Erlass explizit gepinnt: HUVÜ=3, EAUe=5, CMR=3, RBÜ=2,
  # Istanbul=1; HKsÜ/Montreal/UNO-BRK=0. SR-Sonde + art_1 je Datei verifiziert.
  # Beleg: bibliothek/register/fedlex-staatsvertraege-2026-07-10.md.
  "hksue96|cc/2009/380|20260119|0|art_1|0.211.231.011"
  "huvue|cc/1976/1559_1559_1559|20160915|3|art_1|0.211.213.02"
  "eaue|cc/1967/814_854_850|20230628|5|art_1|0.353.1"
  "cmr|cc/1970/851_851_851|20210210|6|art_1|0.741.611"
  "montreal|cc/2005/566|20260407|0|art_1|0.748.411"
  "rbue|cc/1993/2659_2659_2659|20240606|2|art_1|0.231.15"
  "uno_brk|cc/2014/245|20260501|0|art_1|0.109"
  "istanbul|cc/2018/168|20241220|1|art_1|0.311.35"
  # Apostille SR 0.172.030.4: geltende Kons 20240904 (check:fedlex-versionen-Arbiter —
  # NICHT 20160706, das ist eine ältere Fassung, deren HTML nur SPA-Shell ist). Unter
  # 20240904 liefert Fedlex extrahierbares HTML; kanonisch html-4 (isExemplifiedBy).
  "apostille|cc/1973/348_347_349|20240904|4|art_1|0.172.030.4"
  # ── QS-KORPUS Kernerlasse-Luecken Bund (14.9.2026) ──────────────────────────
  # Drei Kernerlasse, die der Bestandsmessung 1.9.2026 fehlten. ELI + geltende
  # Konsolidierung je SPARQL (dateApplicability, groesste <= 2026-09-14), html-N
  # kanonisch via isExemplifiedBy (scripts/fedlex-manifest.ts) — NICHT konstruiert.
  #
  # FALLE, hier empirisch aufgetreten (14.9.2026): `npm run fedlex:eli -- <SR>` liefert
  # fuer EOEBV und AVG die FALSCHE ConsolidationAbstract und fuer EMRK das falsche
  # Datum — Ursache ist der Resolver selbst (LIMIT 200 + bindings[0].cc), Detail und
  # Rot-Beweis in bibliothek/register/fedlex-kernerlasse-2026-09-14.md. Die Pins
  # unten stammen darum aus der direkten SPARQL-Abfrage, nicht aus fedlex:eli.
  #
  # EMRK SR 0.101 — geltend 2022-09-16 (32 Konsolidierungen, keine kuenftige).
  # Wechselt von status 'pdf-embed' auf 'snapshot': Fedlex fuehrt den Konsolidierungs-
  # text seit der Konsolidierung 2012-02-23 als HTML (davor, u.a. unter dem bis
  # 5.7.2026 gepinnten Stand 20050323, war pdf-a die EINZIGE deutsche Manifestation —
  # die pdf-embed-Begruendung vom 25.6.2026 war fuer ihren Pin zutreffend und wird
  # hier nicht nachgefuehrt, sondern ergaenzt). html-9 traegt Praeambel, Art. 1-59
  # lueckenlos, Unterschriften und «Geltungsbereich am 16. September 2022».
  "emrk|cc/1974/2151_2151_2151|20220916|9|art_1,art_6,art_8,art_34,art_35,art_59|0.101"
  # EOEBV SR 211.435.1 — geltend 2024-01-01, ELI cc/2018/29. NICHT cc/12/369_337_369:
  # das ist das BG vom 25.6.1891 betr. die zivilrechtlichen Verhaeltnisse der
  # Niedergelassenen und Aufenthalter (NAG), das dieselbe SR-Notation historisch traegt.
  # Die SR-Sonde ist hier besonders wichtig (zwei Abstracts unter derselben SR) und
  # greift: Fedlex schreibt bei diesem Erlass `class="srnummer "` MIT Leerzeichen —
  # die Sonden-Regex deckt das ueber `srnummer[^"]*` bereits ab (empirisch 14.9.2026).
  "eoebv|cc/2018/29|20240101|5|art_1,art_10,art_16,art_28|211.435.1"
  # AVG SR 823.11 — geltend 2026-01-01, ELI cc/1991/392_392_392. NICHT
  # cc/1951/1211_1217_1249: das ist das aufgehobene AVG vom 22.6.1951.
  # html-N kanonisch = 0 (echt suffixlose Datei, per isExemplifiedBy belegt).
  "avg|cc/1991/392_392_392|20260101|0|art_1,art_12,art_19,art_33_a,art_35_b,art_44|823.11"
)

fehler=0
for e in "${EINTRAEGE[@]}"; do
  # 6. Feld (sr) ist OPTIONAL: trägt es eine SR-Nummer, prüft das Tor die im
  # HTML eingebettete <p class="srnummer">NNN</p> gegen die erwartete SR. Das
  # fängt die Erlass-KOLLISIONS-Klasse (richtige ELI/Konsolidierung + richtiger
  # art_-Anker, aber FALSCHER Erlass unter dieser html-Variante) — entdeckt
  # 25.6.2026 an VAG: cc/2005/734/20240901 html-0 = Agrar-Einfuhr-VO (SR 916.01),
  # html-1 = VAG (SR 961.01); das art_1-Tor allein war blind dafür. Fehlt das
  # Feld (Altbestand), läuft die Prüfung wie bisher (rückwärtskompatibel, §6).
  IFS='|' read -r name eli kons n anker sr <<<"$e"
  datei="/tmp/${name}.html"
  pfad="${eli//\//-}"
  # n=0: Datei OHNE «-N»-Suffix (Spezialfall GebV SchKG, festgestellt 7.6.2026)
  if [ "$n" = "0" ]; then
    url="${BASIS}/${eli}/${kons}/de/html/fedlex-data-admin-ch-eli-${pfad}-${kons}-de-html.html"
  else
    url="${BASIS}/${eli}/${kons}/de/html/fedlex-data-admin-ch-eli-${pfad}-${kons}-de-html-${n}.html"
  fi
  code=$(curl -s -o "$datei" -w "%{http_code}" "$url")
  groesse=$(wc -c < "$datei" | tr -d ' ')
  # Schwelle 20 kB: SPA-Shell/Fehlerseiten sind ~9 kB bzw. ~77 kB OHNE Anker —
  # die Anker-Prüfung unten fängt grosse Blindgänger; kleinster echter Cache
  # ist die GebV-HReg mit ~30 kB (darum nicht mehr 40 kB).
  # ── KEIN FALLBACK (3.8.2026) ────────────────────────────────────────────
  # Bis hierher probierte eine Schleife bei Fehlschlag html-1..5 durch und
  # setzte die erste Variante ein, die 200 + >20 kB lieferte. Drei Gründe,
  # warum das gefährlicher war als ein Fehlschlag:
  #   1. Der Ersatz ist STILL. Eine andere html-Revision ist ein anderer
  #      Generations-Dump desselben Erlasses — amtlicher Text, aber nicht der
  #      geltende. Trägt er die Pflicht-Anker (was er meist tut, weil es
  #      derselbe Erlass ist), meldet das Tor «OK» und niemand erfährt, dass
  #      eine andere Fassung geprüft wurde als die gepinnte.
  #   2. Der Bereich 1..5 ist zu klein. 67 der 227 Pins stehen auf N≥6 (bis
  #      N=17, vwvg/finma_gebv) — für sie hätte die Schleife die kanonische
  #      Revision nie erreicht, sondern zwangsläufig eine falsche eingesetzt.
  #      (Die Zahl wurde für diese Reparatur ausgezählt; die Annahme «nur ein
  #      paar Pins liegen über 5» trifft nicht zu.)
  #   3. Es ist die falsche Zuständigkeit. Welche Revision kanonisch ist,
  #      beantwortet Fedlex über isExemplifiedBy — dafür gibt es
  #      fedlex-repin-kanonik.ts und den Arbiter in check:fedlex-versionen.
  #      Ein Rate-Fallback im Cache-Tor ist eine zweite, schlechtere Antwort
  #      auf dieselbe Frage (§5).
  # Darum jetzt: der gepinnte Abruf scheitert LAUT. Reparatur ist Sache des
  # Re-Pins, nicht dieses Skripts.
  if [ "$code" != "200" ] || [ "$groesse" -lt 20000 ]; then
    echo "FEHLER  ${name}: gepinnter Abruf fehlgeschlagen (HTTP ${code}, ${groesse} B)"
    echo "        URL: ${url}"
    echo "        KEIN Fallback auf andere html-Revisionen — das würde still eine"
    echo "        nicht-kanonische Fassung einsetzen. Reparatur: Konsolidierung ${kons}"
    echo "        prüfen, dann 'npm run fedlex:repin-kanonik -- --write' (Revision) bzw."
    echo "        'npm run fedlex:repin-batch -- --write' (Konsolidierungsdatum)."
    fehler=$((fehler+1)); continue
  fi
  # Soft-404-Sonde (P1-a/b Querschnitts-Wurzel): die Casemates-Angular-Shell
  # kommt mit HTTP 200 (~9 kB, aber Grenzfälle auch grösser). Nach Body urteilen,
  # nie nach Status (scraping-skill Fakt 3): trägt die Datei den Shell-Marker,
  # ist sie KEIN Normtext — hart abweisen, egal wie gross.
  shell_problem=""
  if grep -qE '<title>Casemates</title>|ng-version|<app-root' "$datei"; then
    shell_problem=" SOFT-404: Casemates-Angular-Shell statt Normtext (kanonisches html-N in fedlex-cache.sh prüfen)"
  fi
  # Anker-Count-Sonde: ein Alt-Generations-Dump/Teil-Extrakt kann die 1–2
  # Pflicht-Anker tragen und trotzdem verstümmelt sein. Grobe Plausibilität:
  # ein echter Erlass hat ≥1 art_-Anker; 0 ⇒ Shell/Fremdformat.
  ankerzahl=$(grep -oE 'id="(art_|annex_|lvl_)' "$datei" | wc -l | tr -d ' ')
  if [ "$ankerzahl" -eq 0 ] && [ -z "$shell_problem" ]; then
    shell_problem=" KEINE art_/annex_/lvl_-Anker (verstümmelter Dump?) — kanonisches html-N prüfen"
  fi
  fehlend=""
  IFS=',' read -ra LISTE <<<"$anker"
  for a in "${LISTE[@]}"; do
    if ! grep -q "id=\"${a}\"" "$datei"; then fehlend="${fehlend} ${a}"; fi
  done
  # SR-Identitäts-Sonde (Erlass-Kollisions-Tor): nur wenn eine erwartete SR
  # angegeben ist. Fedlex bettet die SR als <p class="srnummer">NNN</p> ein.
  sr_problem=""
  if [ -n "${sr:-}" ]; then
    if ! grep -qE "class=\"srnummer[^\"]*\"[^>]*>[[:space:]]*${sr//./\\.}[[:space:]]*<" "$datei"; then
      gefunden=$(grep -oE 'class="srnummer[^"]*"[^>]*>[[:space:]]*[0-9.]+' "$datei" | grep -oE '[0-9.]+$' | head -1)
      sr_problem=" FALSCHER ERLASS: erwartet SR ${sr}, HTML trägt SR ${gefunden:-?}"
    fi
  fi
  if [ -n "$fehlend" ] || [ -n "$sr_problem" ] || [ -n "$shell_problem" ]; then
    echo "FEHLER  ${name} (${kons}, ${groesse} B):${fehlend:+ fehlende Anker:${fehlend}}${sr_problem}${shell_problem}"
    fehler=$((fehler+1))
  else
    echo "OK      ${name} (${kons}) → ${datei} (${groesse} B), ${#LISTE[@]}/${ankerzahl} Anker${sr:+ + SR ${sr}} geprüft"
  fi
done

if [ "$fehler" -gt 0 ]; then
  echo; echo "${fehler} Gesetz(e) mit Problemen — Konsolidierungsstände im Quellen-Register prüfen."
  exit 1
fi
echo; echo "Alle Caches aktuell, alle Pflicht-Anker vorhanden."
