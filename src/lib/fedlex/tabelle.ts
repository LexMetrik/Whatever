// ─── Fedlex · Achse 1: Konstantentabelle ───
//
// Teil der Achsen-Aufteilung von src/lib/fedlex.ts (QS-CODE-SPLITS): dort steht
// nur noch die Fassade, die alles Bisherige unveraendert re-exportiert. Gerichtete
// Kette ohne Zyklus: tabelle ← url ← erkennung ← parser.

// Dossier: bibliothek/register/quellen-register.md
// ─── Fedlex-Verlinkung (verifizierte Anker) ───────────────────────────────
//
// Verifizierte Fedlex-Basis-URLs (Systematische Rechtssammlung, konsolidierte,
// in Kraft stehende Fassung, Sprache de). Kein ?version=-Parameter, damit der
// Link stets die geltende Fassung auflöst.
// SR 220 OR · SR 210 ZGB · SR 272 ZPO · SR 281.1 SchKG · SR 822.11 ArG ·
// SR 312.0 StPO · SR 172.021 VwVG

export const FEDLEX = {
  OR:    'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de',
  ZGB:   'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/de',
  ZPO:   'https://www.fedlex.admin.ch/eli/cc/2010/262/de',
  SchKG: 'https://www.fedlex.admin.ch/eli/cc/11/529_488_529/de',
  // ArG: Anker art_9/art_12/art_13/art_46 empirisch gegen das konsolidierte
  // Filestore-HTML verifiziert (Konsolidierung 20230901; geprüft 5.6.2026).
  ArG:   'https://www.fedlex.admin.ch/eli/cc/1966/57_57_57/de',
  // VMWG SR 221.213.11 – ELI via Fedlex-SPARQL verifiziert; Anker art_16/17/
  // 19/19a empirisch am Filestore-HTML (Konsolidierung 20251001; 5.6.2026 —
  // diese Notiz war korrekt: die zwischenzeitliche «19a existiert nicht»-
  // Diskrepanz [5./6.6.] beruhte auf dem 20250101-Cache; aufgelöst 7.6.2026,
  // 20251001 liegt als n=0-Datei, jetzt regulär gepinnt).
  VMWG:  'https://www.fedlex.admin.ch/eli/cc/1990/835_835_835/de',
  // StPO SR 312.0 – Anker art_129 empirisch am Filestore-HTML verifiziert
  // (Konsolidierung 20240101; geprüft 5.6.2026, Vollmacht-Vorlage).
  StPO:  'https://www.fedlex.admin.ch/eli/cc/2010/267/de',
  // VwVG SR 172.021 – Anker art_11 empirisch am Filestore-HTML verifiziert
  // (Konsolidierung 20210101; geprüft 5.6.2026, Vollmacht-Vorlage).
  VwVG:  'https://www.fedlex.admin.ch/eli/cc/1969/737_757_755/de',
  // VVG SR 221.229.1 – Anker art_35_a/35_b/35_c sowie art_97/98 empirisch am
  // Filestore-HTML verifiziert (Konsolidierung 20240101 = neuste abrufbare;
  // geprüft 6.6.2026, Kündigungs-Maske 3: 35a halbzwingend [98], 35b/35c
  // absolut zwingend [97], Lebensversicherung ausgenommen [35a Abs. 3]).
  VVG:   'https://www.fedlex.admin.ch/eli/cc/24/719_735_717/de',
  // HRegV SR 221.411 – Anker art_20/24_a/43/44/45/71/72/117 empirisch am
  // Filestore-HTML verifiziert (Konsolidierung 20250101 = neuste abrufbare,
  // 1.7.2025/1.1.2026 existieren nicht; geprüft 6.6.2026, Gründungs-Masken;
  // Dossiers bibliothek/recherche/gesellschaftsgruendung.md + gmbh-/ag-…).
  HRegV: 'https://www.fedlex.admin.ch/eli/cc/2007/686/de',
  // GebV SchKG SR 281.35 — ELI via Fedlex-SPARQL verifiziert; Anker art_16/
  // 20/30/48 etc. empirisch am Filestore-HTML (Konsolidierung 20260101 =
  // neuste, keine künftige Fassung; geprüft 7.6.2026, Betreibungskosten-
  // Rechner; Dossier bibliothek/recherche/gebv-schkg-kostenrechner.md).
  GebVSchKG: 'https://www.fedlex.admin.ch/eli/cc/1996/2937_2937_2937/de',
  // BGG SR 173.110 — Cache gepinnt (fedlex-cache.sh, Konsolidierung 20260401);
  // Anker art_42–art_119 empirisch verifiziert (11.6.2026, BGer-Rechtsweg;
  // Dossier bibliothek/recherche/bgg-beschwerde-engine.md).
  BGG:   'https://www.fedlex.admin.ch/eli/cc/2006/218/de',
  // BGerR SR 173.110.131 — Cache gepinnt 11.6.2026 (Konsolidierung 20260201,
  // Filestore NUR ohne -N-Suffix); Anker art_33/34/35/35_a/36 zeichengenau
  // verifiziert (rechtsmittel-spruchkoerper-kantone.md §3).
  BGerR: 'https://www.fedlex.admin.ch/eli/cc/2006/834/de',
  // KVG SR 832.10 — Cache gepinnt 11.6.2026 (Konsolidierung 20260101 = neuste
  // echte, 202602–202606 nur SPA-Shell; Filestore OHNE -N-Suffix); Anker
  // art_7/62/64_a zeichengenau verifiziert (KVG-Preset Kündigungs-Maske 3;
  // Dossier bibliothek/recherche/kvg-grundversicherung-kuendigung.md).
  KVG:   'https://www.fedlex.admin.ch/eli/cc/1995/1328_1328_1328/de',
  // KVV SR 832.102 — Cache gepinnt 11.6.2026 (Konsolidierung 20260101, OHNE
  // -N-Suffix); Anker art_94/99/100 verifiziert (besondere Versicherungs-
  // formen: Wechsel nur auf Jahresende, Art. 94 Abs. 2 / 100 Abs. 3 KVV,
  // Fassung AS 2024 697).
  KVV:   'https://www.fedlex.admin.ch/eli/cc/1995/3867_3867_3867/de',
  // StGB SR 311.0 — Cache gepinnt (fedlex-cache.sh, Konsolidierung 20260612);
  // Anker art_30/97/98/101/109/333/389 (Antrag/Verjährung) extrahiert. Bisher
  // unerreichbar: Snapshot STGB.json existierte (Vollabdeckung), aber StGB war
  // nicht in FEDLEX → erkenneFedlexGesetz lieferte null. Kollisionsfrei zu StG:
  // Regex `(^|\s)KEY$` matcht «Art. 97 StGB» nur auf StGB (StGB endet nicht auf
  // « StG»). Reiner Screen-Pfad — der PDF-Erlasskatalog (pdf/normLinks.ts) ist
  // unberührt (eigene ERLASSE-Liste), Golden bleibt byte-gleich.
  StGB:  'https://www.fedlex.admin.ch/eli/cc/54/757_781_799/de',
  // StG SR 641.10 (Stempelabgaben) — Cache gepinnt (Konsolidierung 20240101);
  // Anker art_5/6/8 extrahiert. «Art. 8 StG» → 'StG' (nicht 'StGB').
  StG:   'https://www.fedlex.admin.ch/eli/cc/1974/11_11_11/de',
  // GebV-HReg SR 221.411.1 — Cache gepinnt (Konsolidierung 20210101); Anker
  // art_3/4/8 extrahiert (Handelsregister-Gebühren).
  GebVHReg: 'https://www.fedlex.admin.ch/eli/cc/2020/180/de',
  // ── Erweiterung 17.6.2026 (Auftrag David «jedes verwendete Gesetz in seiner
  // Gesamtheit abspeichern»): die übrigen im Produkt zitierten Bundesgesetze.
  // ELI + geltende Konsolidierung via Fedlex-SPARQL (latest dateApplicability
  // ≤ heute) ermittelt, Identität (SR-Nr.) + Pflicht-Anker am Filestore-HTML
  // empirisch verifiziert (§7). Snapshots: scripts/fedlex-cache.sh + normtext.
  // MWSTG SR 641.20 — eli cc/2009/615, Konsolidierung 20250331 (132 Anker).
  MWSTG: 'https://www.fedlex.admin.ch/eli/cc/2009/615/de',
  // URG SR 231.1 — eli cc/1993/1798_1798_1798, Konsolidierung 20250701 (113).
  URG: 'https://www.fedlex.admin.ch/eli/cc/1993/1798_1798_1798/de',
  // BewG (Lex Koller) SR 211.412.41 — eli cc/1984/1148_1148_1148, 20230701 (41).
  BewG: 'https://www.fedlex.admin.ch/eli/cc/1984/1148_1148_1148/de',
  // EOG SR 834.1 — eli cc/1952/1021_1046_1050, Konsolidierung 20260601 (66).
  EOG: 'https://www.fedlex.admin.ch/eli/cc/1952/1021_1046_1050/de',
  // SVG SR 741.01 — eli cc/1959/679_705_685, Konsolidierung 20250401 (159).
  SVG: 'https://www.fedlex.admin.ch/eli/cc/1959/679_705_685/de',
  // DSG (revDSG) SR 235.1 — eli cc/2022/491, Konsolidierung 20250707 (77).
  DSG: 'https://www.fedlex.admin.ch/eli/cc/2022/491/de',
  // BBG SR 412.10 — eli cc/2003/674, Konsolidierung 20250301 (76).
  BBG: 'https://www.fedlex.admin.ch/eli/cc/2003/674/de',
  // GBV (Grundbuchverordnung) SR 211.432.1 — eli cc/2011/667. Neuste mit
  // Filestore-HTML verfügbare Konsolidierung 20240101 (186 Anker); spätere
  // (2026-04-15) sind bei Fedlex nur als SPA-Shell vorhanden — Live-Link bleibt
  // massgeblich (§7/§8), Muster wie VMWG.
  GBV: 'https://www.fedlex.admin.ch/eli/cc/2011/667/de',
  // JStPO (Jugendstrafprozessordnung) SR 312.1 — eli cc/2010/226,
  // Konsolidierung 20250701 (54 Anker); kollisionsfrei zu StPO (endet auf «JStPO»).
  JStPO: 'https://www.fedlex.admin.ch/eli/cc/2010/226/de',
  // ── Volltext-Ausbau 19.6.2026: ELI + geltende Konsolidierung empirisch am
  //    Filestore-HTML verifiziert (n=0, alle Pflicht-Anker vorhanden); SR/Titel
  //    gegen Fedlex-SR-Register gegengeprüft (§7, [[immer-doppelt-verifizieren]]).
  BV:    'https://www.fedlex.admin.ch/eli/cc/1999/404/de', // SR 101, Kons. 20240303
  DBG:   'https://www.fedlex.admin.ch/eli/cc/1991/1184_1184_1184/de', // SR 642.11, Kons. 20260101
  VStG:  'https://www.fedlex.admin.ch/eli/cc/1966/371_385_384/de', // SR 642.21, Kons. 20250101
  KG:    'https://www.fedlex.admin.ch/eli/cc/1996/546_546_546/de', // SR 251, Kons. 20230701
  FusG:  'https://www.fedlex.admin.ch/eli/cc/2004/320/de', // SR 221.301, Kons. 20230101
  MSchG: 'https://www.fedlex.admin.ch/eli/cc/1993/274_274_274/de', // SR 232.11, Kons. 20250701
  UWG:   'https://www.fedlex.admin.ch/eli/cc/1988/223_223_223/de', // SR 241, Kons. 20250101
  PatG:  'https://www.fedlex.admin.ch/eli/cc/1955/871_893_899/de', // SR 232.14, Kons. 20250701
  // ── Volltext-Ausbau Bund 23.6.2026 (Promotion aus nur-live-link-Stubs; ELI/
  //    Konsolidierung via Fedlex-SPARQL geltend-verifiziert, art_1 am Filestore-
  //    HTML bestätigt, §7). ──
  PARTG: 'https://www.fedlex.admin.ch/eli/cc/2005/782/de', // SR 211.231, Kons. 20250101
  JSTG:  'https://www.fedlex.admin.ch/eli/cc/2006/551/de', // SR 311.1, Kons. 20250701
  // Ältere plain-<p><sup>-Markup-Erlasse — entsperrt durch den Extraktor-Fix 23.6.2026.
  IPRG:  'https://www.fedlex.admin.ch/eli/cc/1988/1776_1776_1776/de', // SR 291, Kons. 20260101
  BETMG: 'https://www.fedlex.admin.ch/eli/cc/1952/241_241_245/de', // SR 812.121, Kons. 20230901
  VSTRR: 'https://www.fedlex.admin.ch/eli/cc/1974/1857_1857_1857/de', // SR 313.0, Kons. 20230901
  // Batch 2 (23.6.2026) — klar aktuelle Konsolidierungen (Currency via check:fedlex-versionen).
  ATSG:  'https://www.fedlex.admin.ch/eli/cc/2002/510/de', // SR 830.1, Kons. 20240101
  BVG:   'https://www.fedlex.admin.ch/eli/cc/1983/797_797_797/de', // SR 831.40, Kons. 20250101
  UVG:   'https://www.fedlex.admin.ch/eli/cc/1982/1676_1676_1676/de', // SR 832.20, Kons. 20260101
  AVIG:  'https://www.fedlex.admin.ch/eli/cc/1982/2184_2184_2184/de', // SR 837.0, Kons. 20260101
  RPG:   'https://www.fedlex.admin.ch/eli/cc/1979/1573_1573_1573/de', // SR 700, Kons. 20260401
  USG:   'https://www.fedlex.admin.ch/eli/cc/1984/1122_1122_1122/de', // SR 814.01, Kons. 20260401
  VGG:   'https://www.fedlex.admin.ch/eli/cc/2006/352/de', // SR 173.32, Kons. 20260612
  BGFA:  'https://www.fedlex.admin.ch/eli/cc/2002/153/de', // SR 935.61, Kons. 20250701
  KKG:   'https://www.fedlex.admin.ch/eli/cc/2002/593/de', // SR 221.214.1, Kons. 20230901
  GWG:   'https://www.fedlex.admin.ch/eli/cc/1998/892_892_892/de', // SR 955.0, Kons. 20240301
  // Batch 3 (23.6.2026) — Konsolidierung via check:fedlex-versionen geltend-verifiziert.
  IVG:    'https://www.fedlex.admin.ch/eli/cc/1959/827_857_845/de', // SR 831.20
  FAMZG:  'https://www.fedlex.admin.ch/eli/cc/2008/51/de', // SR 836.2
  STHG:   'https://www.fedlex.admin.ch/eli/cc/1991/1256_1256_1256/de', // SR 642.14
  AIG:    'https://www.fedlex.admin.ch/eli/cc/2007/758/de', // SR 142.20
  ASYLG:  'https://www.fedlex.admin.ch/eli/cc/1999/358/de', // SR 142.31
  GLG:    'https://www.fedlex.admin.ch/eli/cc/1996/1498_1498_1498/de', // SR 151.1
  FINMAG: 'https://www.fedlex.admin.ch/eli/cc/2008/736/de', // SR 956.1
  BGBB:   'https://www.fedlex.admin.ch/eli/cc/1993/1410_1410_1410/de', // SR 211.412.11
  // Batch 4 (23.6.2026) — Konsolidierung via Filestore-HTML-Inhalts-Sonde gepinnt.
  AHVG:   'https://www.fedlex.admin.ch/eli/cc/63/837_843_843/de', // SR 831.10, Kons. 20260101
  BANKG:  'https://www.fedlex.admin.ch/eli/cc/51/117_121_129/de', // SR 952.0, Kons. 20240101
  HMG:    'https://www.fedlex.admin.ch/eli/cc/2001/422/de', // SR 812.21, Kons. 20250101
  // ── Punkt 12 Batch 1 (24.6.2026, Bund-Gesetze aus Davids Anwaltsprüfungs-
  //    Bookmark-Liste, Promotion aus nur-live-link-Stubs). ELI über die
  //    date-geordnete Taxonomie-Abfrage gewählt (Resolver gab für mehrere die
  //    REPEALTE Altfassung — rvog/stbog/desg/finig/wag/pueg), gegen
  //    check:fedlex-versionen (alle aktuell) + Filestore-HTML-Inhalts-Sonde
  //    (art_1 vorhanden) + den Titel der GEPINNTEN ELI doppelt verifiziert (§7).
  BUEG:    'https://www.fedlex.admin.ch/eli/cc/2016/404/de', // SR 141.0, Kons. 20230901
  BGOE:    'https://www.fedlex.admin.ch/eli/cc/2006/355/de', // SR 152.3, Kons. 20231101
  BPR:     'https://www.fedlex.admin.ch/eli/cc/1978/688_688_688/de', // SR 161.1, Kons. 20221023
  VG:      'https://www.fedlex.admin.ch/eli/cc/1958/1413_1483_1489/de', // SR 170.32, Kons. 20250615
  PUBLG:   'https://www.fedlex.admin.ch/eli/cc/2004/745/de', // SR 170.512, Kons. 20230901
  PARLG:   'https://www.fedlex.admin.ch/eli/cc/2003/510/de', // SR 171.10, Kons. 20260302
  RVOG:    'https://www.fedlex.admin.ch/eli/cc/1997/2022_2022_2022/de', // SR 172.010, Kons. 20250501
  BOEB:    'https://www.fedlex.admin.ch/eli/cc/2020/126/de', // SR 172.056.1, Kons. 20260101
  BPG:     'https://www.fedlex.admin.ch/eli/cc/2001/123/de', // SR 172.220.1, Kons. 20240101
  STBOG:   'https://www.fedlex.admin.ch/eli/cc/2010/444/de', // SR 173.71, Kons. 20240101
  DESG:    'https://www.fedlex.admin.ch/eli/cc/2002/226/de', // SR 232.12, Kons. 20250701
  OHG:     'https://www.fedlex.admin.ch/eli/cc/2008/232/de', // SR 312.5, Kons. 20250101
  NHG:     'https://www.fedlex.admin.ch/eli/cc/1966/1637_1694_1679/de', // SR 451, Kons. 20250801
  ENTG:    'https://www.fedlex.admin.ch/eli/cc/47/689_701_723/de', // SR 711, Kons. 20210101
  GSCHG:   'https://www.fedlex.admin.ch/eli/cc/1992/1860_1860_1860/de', // SR 814.20, Kons. 20250801
  ENTSG:   'https://www.fedlex.admin.ch/eli/cc/2003/231/de', // SR 823.20, Kons. 20240101
  ELG:     'https://www.fedlex.admin.ch/eli/cc/2007/804/de', // SR 831.30, Kons. 20260101
  FZG:     'https://www.fedlex.admin.ch/eli/cc/1994/2386_2386_2386/de', // SR 831.42, Kons. 20240101
  WAG:     'https://www.fedlex.admin.ch/eli/cc/1992/2521_2521_2521/de', // SR 921.0, Kons. 20250801
  PUEG:    'https://www.fedlex.admin.ch/eli/cc/1986/895_895_895/de', // SR 942.20, Kons. 20260508
  FIDLEG:  'https://www.fedlex.admin.ch/eli/cc/2019/758/de', // SR 950.1, Kons. 20240301
  KAG:     'https://www.fedlex.admin.ch/eli/cc/2006/822/de', // SR 951.31, Kons. 20240301
  FINIG:   'https://www.fedlex.admin.ch/eli/cc/2018/801/de', // SR 954.1, Kons. 20240301
  FINFRAG: 'https://www.fedlex.admin.ch/eli/cc/2015/853/de', // SR 958.1, Kons. 20240201
  // VAG: ACHTUNG html-Variante 1! Unter cc/2005/734/20240901 liegen ZWEI Erlasse —
  // html-0 = Agrar-Einfuhr-VO (SR 916.01), html-1 = VAG (SR 961.01). Bug-Check
  // 25.6.2026 fing den Fehlgriff (Snapshot trug zunächst die Agrar-VO); Cache-Tor
  // um SR-Identitäts-Sonde gehärtet (fedlex-cache.sh, 6. Feld = erwartete SR).
  VAG:     'https://www.fedlex.admin.ch/eli/cc/2005/734/de', // SR 961.01, Kons. 20240901 (html-1)
  // ── Punkt 12 Batch 2 (24.6.2026, Bund-VERORDNUNGEN, Promotion aus nur-live-
  //    link-Stubs). Geltende Konsolidierung via date-geordnete Taxonomie-Abfrage
  //    (Resolver lieferte für viele die REPEALTE Vorgänger-VO) + Filestore-HTML-
  //    Inhalts-Sonde (art_1 + Artikelzahl == Snapshot) doppelt verifiziert (§7). ──
  AHVV: 'https://www.fedlex.admin.ch/eli/cc/63/1185_1183_1185/de', // SR 831.101, Kons. 20260101
  IVV: 'https://www.fedlex.admin.ch/eli/cc/1961/29_29_29/de', // SR 831.201, Kons. 20250601
  ELV: 'https://www.fedlex.admin.ch/eli/cc/1971/37_37_37/de', // SR 831.301, Kons. 20250101
  'BVV 2': 'https://www.fedlex.admin.ch/eli/cc/1984/543_543_543/de', // SR 831.441.1, Kons. 20250101
  UVV: 'https://www.fedlex.admin.ch/eli/cc/1983/38_38_38/de', // SR 832.202, Kons. 20260101
  AVIV: 'https://www.fedlex.admin.ch/eli/cc/1983/1205_1205_1205/de', // SR 837.02, Kons. 20260101
  ATSV: 'https://www.fedlex.admin.ch/eli/cc/2002/569/de', // SR 830.11, Kons. 20240101
  KLV: 'https://www.fedlex.admin.ch/eli/cc/1995/4964_4964_4964/de', // SR 832.112.31, Kons. 20260511
  MWSTV: 'https://www.fedlex.admin.ch/eli/cc/2009/828/de', // SR 641.201, Kons. 20250101
  VStV: 'https://www.fedlex.admin.ch/eli/cc/1966/1585_1641_1624/de', // SR 642.211, Kons. 20250101
  VZAE: 'https://www.fedlex.admin.ch/eli/cc/2007/759/de', // SR 142.201, Kons. 20260612
  VRV: 'https://www.fedlex.admin.ch/eli/cc/1962/1364_1409_1420/de', // SR 741.11, Kons. 20260401
  VZV: 'https://www.fedlex.admin.ch/eli/cc/1976/2423_2423_2423/de', // SR 741.51, Kons. 20260101
  SSV: 'https://www.fedlex.admin.ch/eli/cc/1979/1961_1961_1961/de', // SR 741.21, Kons. 20250701
  DSV: 'https://www.fedlex.admin.ch/eli/cc/2022/568/de', // SR 235.11, Kons. 20251201
  'ArGV 1': 'https://www.fedlex.admin.ch/eli/cc/2000/243/de', // SR 822.111, Kons. 20240901
  BewV: 'https://www.fedlex.admin.ch/eli/cc/1984/1164_1164_1164/de', // SR 211.412.411, Kons. 20240301
  'BüV': 'https://www.fedlex.admin.ch/eli/cc/2016/405/de', // SR 141.01, Kons. 20190709
  FZV: 'https://www.fedlex.admin.ch/eli/cc/1994/2399_2399_2399/de', // SR 831.425, Kons. 20240301
  KOV: 'https://www.fedlex.admin.ch/eli/cc/27/751_749_771/de', // SR 281.32, Kons. 20210801
  RPV: 'https://www.fedlex.admin.ch/eli/cc/2000/310/de', // SR 700.1, Kons. 20260520
  VFRR: 'https://www.fedlex.admin.ch/eli/cc/1996/2877_2877_2877/de', // SR 281.31, Kons. 20160101
  'VöB': 'https://www.fedlex.admin.ch/eli/cc/2020/127/de', // SR 172.056.11, Kons. 20230901
  VZG: 'https://www.fedlex.admin.ch/eli/cc/36/425_433_469/de', // SR 281.42, Kons. 20120101
  'BVV 3': 'https://www.fedlex.admin.ch/eli/cc/1985/1778_1778_1778/de', // SR 831.461.3, Kons. 20250101
  MVV: 'https://www.fedlex.admin.ch/eli/cc/1993/3080_3080_3080/de', // SR 833.11, Kons. 20260101
  EOV: 'https://www.fedlex.admin.ch/eli/cc/2005/187/de', // SR 834.11, Kons. 20260601
  FamZV: 'https://www.fedlex.admin.ch/eli/cc/2008/52/de', // SR 836.21, Kons. 20250101
  'ArGV 2': 'https://www.fedlex.admin.ch/eli/cc/2000/244/de', // SR 822.112, Kons. 20251201
  'ArGV 3': 'https://www.fedlex.admin.ch/eli/cc/1993/2553_2553_2553/de', // SR 822.113, Kons. 20240901
  'ArGV 4': 'https://www.fedlex.admin.ch/eli/cc/1993/2564_2564_2564/de', // SR 822.114, Kons. 20150501
  VEV: 'https://www.fedlex.admin.ch/eli/cc/2018/493/de', // SR 142.204, Kons. 20260612
  VIntA: 'https://www.fedlex.admin.ch/eli/cc/2018/511/de', // SR 142.205, Kons. 20251201
  'AsylV 1': 'https://www.fedlex.admin.ch/eli/cc/1999/359/de', // SR 142.311, Kons. 20260101
  'AsylV 2': 'https://www.fedlex.admin.ch/eli/cc/1999/360/de', // SR 142.312, Kons. 20220101
  'AsylV 3': 'https://www.fedlex.admin.ch/eli/cc/1999/361/de', // SR 142.314, Kons. 20240601
  GSchV: 'https://www.fedlex.admin.ch/eli/cc/1998/2863_2863_2863/de', // SR 814.201, Kons. 20251201
  LRV: 'https://www.fedlex.admin.ch/eli/cc/1986/208_208_208/de', // SR 814.318.142.1, Kons. 20260101
  LSV: 'https://www.fedlex.admin.ch/eli/cc/1987/338_338_338/de', // SR 814.41, Kons. 20260401
  VVEA: 'https://www.fedlex.admin.ch/eli/cc/2015/891/de', // SR 814.600, Kons. 20260101
  ChemV: 'https://www.fedlex.admin.ch/eli/cc/2015/366/de', // SR 813.11, Kons. 20260424
  NHV: 'https://www.fedlex.admin.ch/eli/cc/1991/249_249_249/de', // SR 451.1, Kons. 20250801
  WaV: 'https://www.fedlex.admin.ch/eli/cc/1992/2538_2538_2538/de', // SR 921.01, Kons. 20250801
  VTS: 'https://www.fedlex.admin.ch/eli/cc/1995/4425_4425_4425/de', // SR 741.41, Kons. 20260430
  BankV: 'https://www.fedlex.admin.ch/eli/cc/2014/273/de', // SR 952.02, Kons. 20250101
  KKV: 'https://www.fedlex.admin.ch/eli/cc/2006/859/de', // SR 951.311, Kons. 20251125
  ERV: 'https://www.fedlex.admin.ch/eli/cc/2012/629/de', // SR 952.03, Kons. 20250124
  FINIV: 'https://www.fedlex.admin.ch/eli/cc/2019/763/de', // SR 954.11, Kons. 20250101
  FinfraV: 'https://www.fedlex.admin.ch/eli/cc/2015/854/de', // SR 958.11, Kons. 20250101
  FIDLEV: 'https://www.fedlex.admin.ch/eli/cc/2019/759/de', // SR 950.11, Kons. 20220101
  AVO: 'https://www.fedlex.admin.ch/eli/cc/2005/735/de', // SR 961.011, Kons. 20260226
  'GwV-FINMA': 'https://www.fedlex.admin.ch/eli/cc/2015/390/de', // SR 955.033.0, Kons. 20230101
  VAM: 'https://www.fedlex.admin.ch/eli/cc/2018/588/de', // SR 812.212.21, Kons. 20260101
  AMBV: 'https://www.fedlex.admin.ch/eli/cc/2018/786/de', // SR 812.212.1, Kons. 20250315
  MepV: 'https://www.fedlex.admin.ch/eli/cc/2020/552/de', // SR 812.213, Kons. 20231101
  EpV: 'https://www.fedlex.admin.ch/eli/cc/2015/298/de', // SR 818.101.1, Kons. 20250101
  BPV: 'https://www.fedlex.admin.ch/eli/cc/2001/319/de', // SR 172.220.111.3, Kons. 20260101
  RVOV: 'https://www.fedlex.admin.ch/eli/cc/1999/170/de', // SR 172.010.1, Kons. 20260301
  VGKE: 'https://www.fedlex.admin.ch/eli/cc/2008/321/de', // SR 173.320.2, Kons. 20100401
  BetmKV: 'https://www.fedlex.admin.ch/eli/cc/2011/362/de', // SR 812.121.1, Kons. 20230123
  QStV: 'https://www.fedlex.admin.ch/eli/cc/2018/274/de', // SR 642.118.2, Kons. 20250110
  // ── Punkt 12 Batch 3 (25.6.2026): Promotion nur-live-link-Stub → Volltext ──
  SortG: 'https://www.fedlex.admin.ch/eli/cc/1977/862_862_862/de', // SR 232.16, Kons. 20110101
  PRG: 'https://www.fedlex.admin.ch/eli/cc/1993/3152_3152_3152/de', // SR 944.3, Kons. 20210820
  BEG: 'https://www.fedlex.admin.ch/eli/cc/2009/450/de', // SR 957.1, Kons. 20230101
  MStG: 'https://www.fedlex.admin.ch/eli/cc/43/359_375_369/de', // SR 321.0, Kons. 20260608
  MStP: 'https://www.fedlex.admin.ch/eli/cc/1979/1059_1059_1059/de', // SR 322.1, Kons. 20240701
  IRSG: 'https://www.fedlex.admin.ch/eli/cc/1982/846_846_846/de', // SR 351.1, Kons. 20240101
  MVG: 'https://www.fedlex.admin.ch/eli/cc/1993/3043_3043_3043/de', // SR 833.1, Kons. 20240101
  EnG: 'https://www.fedlex.admin.ch/eli/cc/2017/762/de', // SR 730.0, Kons. 20260401
  'CO2-Gesetz': 'https://www.fedlex.admin.ch/eli/cc/2012/855/de', // SR 641.71, Kons. 20250101
  EpG: 'https://www.fedlex.admin.ch/eli/cc/2015/297/de', // SR 818.101, Kons. 20250801
  TxG: 'https://www.fedlex.admin.ch/eli/cc/2007/279/de', // SR 810.21, Kons. 20210201
  LMG: 'https://www.fedlex.admin.ch/eli/cc/2017/62/de', // SR 817.0, Kons. 20241001
  LFG: 'https://www.fedlex.admin.ch/eli/cc/1950/471_491_479/de', // SR 748.0, Kons. 20260101
  EBG: 'https://www.fedlex.admin.ch/eli/cc/1958/335_341_347/de', // SR 742.101, Kons. 20260101
  FMG: 'https://www.fedlex.admin.ch/eli/cc/1997/2187_2187_2187/de', // SR 784.10, Kons. 20260601
  MG: 'https://www.fedlex.admin.ch/eli/cc/1995/4093_4093_4093/de', // SR 510.10, Kons. 20260601
  ZStV: 'https://www.fedlex.admin.ch/eli/cc/2004/362/de', // SR 211.112.2, Kons. 20250601
  THG: 'https://www.fedlex.admin.ch/eli/cc/1996/1725_1725_1725/de', // SR 946.51, Kons. 20230901
  BGBM: 'https://www.fedlex.admin.ch/eli/cc/1996/1738_1738_1738/de', // SR 943.02, Kons. 20250101
  // ── Punkt 12 Batch 3 (25.6.2026): kuratierte zentrale Bundes-VERORDNUNGEN ──
  MSchV: 'https://www.fedlex.admin.ch/eli/cc/1993/296_296_296/de', // SR 232.111, Kons. 20250701
  PatV: 'https://www.fedlex.admin.ch/eli/cc/1977/2027_2027_2027/de', // SR 232.141, Kons. 20250701
  DesV: 'https://www.fedlex.admin.ch/eli/cc/2002/183/de', // SR 232.121, Kons. 20250701
  URV: 'https://www.fedlex.admin.ch/eli/cc/1993/1821_1821_1821/de', // SR 231.11, Kons. 20250701
  TGBV: 'https://www.fedlex.admin.ch/eli/cc/2013/3/de', // SR 211.432.11, Kons. 20240101
  BKV: 'https://www.fedlex.admin.ch/eli/cc/1993/1363_1363_1363/de', // SR 642.118.1, Kons. 20260101
  ZentV: 'https://www.fedlex.admin.ch/eli/cc/2002/29/de', // SR 360.1, Kons. 20230901
  VKKG: 'https://www.fedlex.admin.ch/eli/cc/2002/594/de', // SR 221.214.11, Kons. 20210701
  'ArGV 5': 'https://www.fedlex.admin.ch/eli/cc/2007/692/de', // SR 822.115, Kons. 20240401
  VVK: 'https://www.fedlex.admin.ch/eli/cc/2007/101/de', // SR 832.105, Kons. 20230101
  VKL: 'https://www.fedlex.admin.ch/eli/cc/2002/418/de', // SR 832.104, Kons. 20250601
  VFV: 'https://www.fedlex.admin.ch/eli/cc/1961/419_429_439/de', // SR 831.111, Kons. 20250101
  BBV: 'https://www.fedlex.admin.ch/eli/cc/2003/748/de', // SR 412.101, Kons. 20250301
  BMV: 'https://www.fedlex.admin.ch/eli/cc/2009/423/de', // SR 412.103.1, Kons. 20160823
  // Totalrevision derselben SR 412.103.1: `BMV` = die 2009er Fassung, seit
  // 1.3.2026 aufgehoben (historisch, src/lib/normtext/aufhebungen.ts);
  // `BMV-2025` = die geltende Verordnung vom 13. Juni 2025 (ELI cc/2025/408,
  // in Kraft seit 1.3.2026). Zwei Schlüssel, weil BEIDE Texte im Korpus liegen
  // und das Register beide führt (Tor 3 verlangt FEDLEX-Schlüssel ≡ Register).
  'BMV-2025': 'https://www.fedlex.admin.ch/eli/cc/2025/408/de', // SR 412.103.1, Kons. 20260301
  'ZEMIS-V': 'https://www.fedlex.admin.ch/eli/cc/2006/303/de', // SR 142.513, Kons. 20260612
  AdoV: 'https://www.fedlex.admin.ch/eli/cc/2011/505/de', // SR 211.221.36, Kons. 20230123
  RDV: 'https://www.fedlex.admin.ch/eli/cc/2012/713/de', // SR 143.5, Kons. 20251101
  ZAV: 'https://www.fedlex.admin.ch/eli/cc/2008/760/de', // SR 364.3, Kons. 20230101
  AkkBV: 'https://www.fedlex.admin.ch/eli/cc/1996/1904_1904_1904/de', // SR 946.512, Kons. 20250101
  'FinfraV-FINMA': 'https://www.fedlex.admin.ch/eli/cc/2015/855/de', // SR 958.111, Kons. 20230201
  'FINMA-GebV': 'https://www.fedlex.admin.ch/eli/cc/2008/749/de', // SR 956.122, Kons. 20240301
  'KKV-FINMA': 'https://www.fedlex.admin.ch/eli/cc/2014/707/de', // SR 951.312, Kons. 20210101
  NBV: 'https://www.fedlex.admin.ch/eli/cc/2004/233/de', // SR 951.131, Kons. 20240701
  PAVO: 'https://www.fedlex.admin.ch/eli/cc/1977/1931_1931_1931/de', // SR 211.222.338, Kons. 20230123
  VGR: 'https://www.fedlex.admin.ch/eli/cc/2008/320/de', // SR 173.320.1, Kons. 20230601
  SKV: 'https://www.fedlex.admin.ch/eli/cc/2007/296/de', // SR 741.013, Kons. 20260101
  VVV: 'https://www.fedlex.admin.ch/eli/cc/1959/1271_1321_1317/de', // SR 741.31, Kons. 20260101
  VIL: 'https://www.fedlex.admin.ch/eli/cc/1994/3050_3050_3050/de', // SR 748.131.1, Kons. 20240101
  FDV: 'https://www.fedlex.admin.ch/eli/cc/2007/166/de', // SR 784.101.1, Kons. 20260301
  FAV: 'https://www.fedlex.admin.ch/eli/cc/2016/24/de', // SR 784.101.2, Kons. 20240815
  UVPV: 'https://www.fedlex.admin.ch/eli/cc/1988/1931_1931_1931/de', // SR 814.011, Kons. 20250101
  ChemRRV: 'https://www.fedlex.admin.ch/eli/cc/2005/478/de', // SR 814.81, Kons. 20260101
  VeVA: 'https://www.fedlex.admin.ch/eli/cc/2005/551/de', // SR 814.610, Kons. 20250801
  VGV: 'https://www.fedlex.admin.ch/eli/cc/2000/299/de', // SR 814.621, Kons. 20220101
  // ── International: Staatsverträge SR 0.* (Volltext-Promotion 25.6.2026) ──
  CISG: 'https://www.fedlex.admin.ch/eli/cc/1991/307_307_307/de', // SR 0.221.211.1
  LUGUE: 'https://www.fedlex.admin.ch/eli/cc/2010/801/de', // SR 0.275.12
  HZUE: 'https://www.fedlex.admin.ch/eli/cc/1994/2809_2809_2809/de', // SR 0.274.131
  HBEWUE: 'https://www.fedlex.admin.ch/eli/cc/1994/2824_2824_2824/de', // SR 0.274.132
  HKUE: 'https://www.fedlex.admin.ch/eli/cc/1983/1694_1694_1694/de', // SR 0.211.230.02
  FZA: 'https://www.fedlex.admin.ch/eli/cc/2002/243/de', // SR 0.142.112.681
  VRK: 'https://www.fedlex.admin.ch/eli/cc/1990/1112_1112_1112/de', // SR 0.111
  UNO_PAKT_II: 'https://www.fedlex.admin.ch/eli/cc/1993/750_750_750/de', // SR 0.103.2
  // ── International P2 (25.6.2026): weitere Staatsverträge SR 0.* ──
  UNO_PAKT_I: 'https://www.fedlex.admin.ch/eli/cc/1993/725_725_725/de', // SR 0.103.1
  KRK: 'https://www.fedlex.admin.ch/eli/cc/1998/2055_2055_2055/de', // SR 0.107
  CEDAW: 'https://www.fedlex.admin.ch/eli/cc/1999/239/de', // SR 0.108
  UNO_ANTIFOLTER: 'https://www.fedlex.admin.ch/eli/cc/1987/1307_1307_1307/de', // SR 0.105
  HEUE: 'https://www.fedlex.admin.ch/eli/cc/2009/381/de', // SR 0.211.232.1
  HAUE: 'https://www.fedlex.admin.ch/eli/cc/2003/99/de', // SR 0.211.221.311
  PVUE: 'https://www.fedlex.admin.ch/eli/cc/1970/620_620_620/de', // SR 0.232.04
  ICAO: 'https://www.fedlex.admin.ch/eli/cc/63/1377_1378_1381/de', // SR 0.748.0
  STAATENLOSE: 'https://www.fedlex.admin.ch/eli/cc/1972/2320_2374_2150/de', // SR 0.142.40
  GFK: 'https://www.fedlex.admin.ch/eli/cc/1955/443_461_469/de', // SR 0.142.30
  // ── QS-KORPUS Kernerlasse (14.9.2026): ELI je SPARQL belegt, siehe die Pins in
  //    scripts/fedlex-cache.sh und bibliothek/register/fedlex-kernerlasse-2026-09-14.md. ──
  EMRK: 'https://www.fedlex.admin.ch/eli/cc/1974/2151_2151_2151/de', // SR 0.101
  EOEBV: 'https://www.fedlex.admin.ch/eli/cc/2018/29/de', // SR 211.435.1
  AVG: 'https://www.fedlex.admin.ch/eli/cc/1991/392_392_392/de', // SR 823.11
  // ── International P4 (Fedlex-Portfolio Paket 4, 10.7.2026): kuratierte
  //    Staatsverträge SR 0.*. ELI + kanonische html-N via Fedlex-SPARQL
  //    (isExemplifiedBy) belegt — html-0 war bei 5/8 STALE (P1-a-Falle), s.
  //    fedlex-cache.sh-Pins + bibliothek/register/fedlex-staatsvertraege-2026-07-10.md. ──
  HKSUE96: 'https://www.fedlex.admin.ch/eli/cc/2009/380/de', // SR 0.211.231.011
  HUVUE: 'https://www.fedlex.admin.ch/eli/cc/1976/1559_1559_1559/de', // SR 0.211.213.02
  EAUE: 'https://www.fedlex.admin.ch/eli/cc/1967/814_854_850/de', // SR 0.353.1
  CMR: 'https://www.fedlex.admin.ch/eli/cc/1970/851_851_851/de', // SR 0.741.611
  MONTREAL: 'https://www.fedlex.admin.ch/eli/cc/2005/566/de', // SR 0.748.411
  RBUE: 'https://www.fedlex.admin.ch/eli/cc/1993/2659_2659_2659/de', // SR 0.231.15
  UNO_BRK: 'https://www.fedlex.admin.ch/eli/cc/2014/245/de', // SR 0.109
  ISTANBUL: 'https://www.fedlex.admin.ch/eli/cc/2018/168/de', // SR 0.311.35
  APOSTILLE: 'https://www.fedlex.admin.ch/eli/cc/1973/348_347_349/de', // SR 0.172.030.4
} as const;

export type FedlexGesetz = keyof typeof FEDLEX;
