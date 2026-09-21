// ─── GENERIERT aus bibliothek/register/parameter-verfall.md via `npm run gen:verfall` ──────────
// NICHT von Hand editieren. Quelle (SSoT §5) ist das Register; Drift-Tor:
// `npm run check:verfall-ui`. Der Tagesbezug (verfallen/fällig) entsteht
// erst in der Anzeige-Schicht (Methodik-Seite), nicht hier.

export type VerfallTermin = {
  label: string;
  datum: string; // ISO YYYY-MM-DD
  quelle: 'Tabelle' | 'Freitext';
  fundstelle?: string;
  wert?: string;
  rhythmus?: string;
};

export const VERFALL_STAND = "6.9.2026";
export const VERFALL_QUELLE = "bibliothek/register/parameter-verfall.md";
export const VERFALL_MANUELL_ANZAHL = 22;

export const VERFALL_TERMINE: VerfallTermin[] = [
  {
    "label": "Künftige Fassung BankG (SR 952.0)",
    "datum": "2026-10-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (BANKG)",
    "wert": "gepinnt 1.1.2024",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung BBG (SR 412.10)",
    "datum": "2026-10-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (BBG)",
    "wert": "gepinnt 1.3.2025",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung BBV (SR 412.101)",
    "datum": "2026-10-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (BBV)",
    "wert": "gepinnt 1.3.2025",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung BEG (SR 957.1)",
    "datum": "2026-10-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (BEG)",
    "wert": "gepinnt 1.1.2023",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung FIDLEG (SR 950.1)",
    "datum": "2026-10-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (FIDLEG)",
    "wert": "gepinnt 1.3.2024",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung FINIG (SR 954.1)",
    "datum": "2026-10-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (FINIG)",
    "wert": "gepinnt 1.3.2024",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung GwG (SR 955.0)",
    "datum": "2026-10-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (GWG)",
    "wert": "gepinnt 1.3.2024",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung HRegV (SR 221.411)",
    "datum": "2026-10-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (HREGV)",
    "wert": "gepinnt 1.1.2025",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung KAG (SR 951.31)",
    "datum": "2026-10-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (KAG)",
    "wert": "gepinnt 1.3.2024",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung OR (SR 220)",
    "datum": "2026-10-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (OR)",
    "wert": "gepinnt 1.1.2026",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung RVOV (SR 172.010.1)",
    "datum": "2026-10-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (RVOV)",
    "wert": "gepinnt 1.3.2026",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung SSV (SR 741.21)",
    "datum": "2026-10-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (SSV)",
    "wert": "gepinnt 1.7.2026",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung StGB (SR 311.0)",
    "datum": "2026-10-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (STGB)",
    "wert": "gepinnt 12.6.2026",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung VEV (SR 142.204)",
    "datum": "2026-10-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (VEV)",
    "wert": "gepinnt 12.6.2026",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung VRV (SR 741.11)",
    "datum": "2026-10-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (VRV)",
    "wert": "gepinnt 1.7.2026",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung VTS (SR 741.41)",
    "datum": "2026-10-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (VTS)",
    "wert": "gepinnt 1.7.2026",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung VZAE (SR 142.201)",
    "datum": "2026-10-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (VZAE)",
    "wert": "gepinnt 12.6.2026",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung ZEMIS-V (SR 142.513)",
    "datum": "2026-10-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (ZEMIS_V)",
    "wert": "gepinnt 1.8.2026",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Formularpflicht-Kantone (Mietzins)",
    "datum": "2026-11-01",
    "quelle": "Tabelle",
    "fundstelle": "`src/lib/vorlagen/mietvertrag.ts` (`MV_FORMULARPFLICHT`)",
    "wert": "BWO 4.2.2026",
    "rhythmus": "jährlich; BE ändert dynamisch per 1.11.2026"
  },
  {
    "label": "Hypothekarischer Referenzzinssatz",
    "datum": "2026-12-01",
    "quelle": "Tabelle",
    "fundstelle": "`src/lib/vorlagen/mietvertrag.ts` (`MV_PARAMETER.referenzzinssatz`)",
    "wert": "1.25 % (unverändert; Stand 2.9.2026, publiziert 1.9.2026, BWO https://www.bwo.admin.ch/de/referenzzinssatz)",
    "rhythmus": "quartalsweise (bwo.admin.ch/de/referenzzinssatz)"
  },
  {
    "label": "Künftige Fassung ChemRRV (SR 814.81)",
    "datum": "2026-12-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (CHEMRRV)",
    "wert": "gepinnt 16.7.2026",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "BE EAV (BSG 168.711, amtliche Anwälte): bis 31.12.2026 (Nachfolge 1.1.2027).",
    "datum": "2026-12-31",
    "quelle": "Freitext"
  },
  {
    "label": "GR Honorarverordnung (HV, BR 310.250): bis 31.12.2026 (Nachfolge 1.1.2027).",
    "datum": "2026-12-31",
    "quelle": "Freitext"
  },
  {
    "label": "TI LTORF (Legge sulle tasse e gli emolumenti del registro fondiario, RL 216.200 = `TI-ti-181`): geltende Fassung 17.5.2024 gilt bis 31.12.2026 (Nachfolge 1.1.2027, Änderung BU 2026, 281).",
    "datum": "2026-12-31",
    "quelle": "Freitext"
  },
  {
    "label": "AHV/IV/EO Selbständige (Satz, sinkende Skala) + Bundes-Verzugszinsen",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "nur Dossiers (`gesellschaftsgruendung.md` Teil 5; `recherche/INDEX.md`-Nachträge) — nicht verdrahtet",
    "wert": "10,0 % / Skala < CHF 60'500 (Merkblatt 2.02, 2026); EFD 4,0 %",
    "rhythmus": "jährlich + vor Verdrahtung"
  },
  {
    "label": "Aufhebung angekündigt: PatV (SR 232.141)",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (PATV)",
    "wert": "Aufhebung angekündigt per 1.1.2027",
    "rhythmus": "einmalig — Snapshot ersetzen/entfernen (§7/§8), Nachfolge prüfen"
  },
  {
    "label": "Aufhebung angekündigt: VGV (SR 814.621)",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (VGVP)",
    "wert": "Aufhebung angekündigt per 1.1.2027",
    "rhythmus": "einmalig — Snapshot ersetzen/entfernen (§7/§8), Nachfolge prüfen"
  },
  {
    "label": "Betreibungsämter-Stammdaten 26 Kt. (130 Kreis-Ämter in 13 Kt. + 10 Einheitsämter, Gemeinde-Karten 11 Kt.)",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`src/data/betreibungsaemter.ts` + `src/data/betreibung/aemterKantone.json` ↔ `behoerden/betreibungskreise-kantone.md` — VERDRAHTET 7.6.2026 (Etappen 1–3)",
    "wert": "Extraktion + adversariale Stichproben 7.6.2026; gemeindescharf: ZH/FR/SO/AR/GR/TG/TI/VD/ZG/UR/SZ. Verzeichnis-Link (keine belastbare Liste, §8): LU (gerichte.lu.ch→Verbands-Plattform, Fusionen) · AG (~14/19 Kreise, Verbands-URL tot) · SG (Negativbefund: kein amtl. Verzeichnis) · ZG-PDF Stand 2/2023 (jüngste amtl. Gesamtliste) · BE: «Avenir Berne romande» (Moutier 1.1.2026 → Jura/Biel-Umzüge bis ~2029)",
    "rhythmus": "jährlich; ZH bei Kreis-Reorganisation KOMPLETT neu; ZG-PDF + AG/LU bei amtlicher Gesamtliste nachziehen"
  },
  {
    "label": "Emissionsabgabe (1 %, Freibetrag CHF 1 Mio.)",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`gruendungsunterlagen.ts` (`emissionsabgabe`, `EMISSIONSABGABE_FREIBETRAG_CHF`)",
    "wert": "Art. 6 Abs. 1 lit. h / 8 Abs. 1 StG @ 1.1.2024 (Cache)",
    "rhythmus": "jährlich — politisch volatil (Abschaffungs-Vorlagen)"
  },
  {
    "label": "Fedlex-Re-Pins terminiert: ZGB+ZPO 1.7.2026 VOLLZOGEN 1.7.2026 (AS 2026 94/16); StGB 12.6.2026 (AS 2026 231) VOLLZOGEN 12.6.2026",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` ← `normen/fedlex-pin-nachverifikation-2026-06.md`",
    "wert": "ZGB→20260701/html-1 (FALLE: n=0 ist STALE ohne AS 2026 94 art_302 — nur html-1 kanonisch; 6 Anker byte-identisch, Inventar 1099→1099). ZPO→20260701/no-suffix (14 Anker operativ byte-identisch, art_314 nur Fussnoten-Reklassifikation; neu art_260a/b). Volltext-Snapshots + Struktur + Manifest gezielt regeneriert (`--erlass=zgb,zpo`), Engine-golden byte-gleich, adversarial QS-GP. `check:caches`/`check:zitate` grün 1.7.2026",
    "rhythmus": "einmalig je Stichtag (`check:caches`+`check:zitate`+ggf. `normtext --erlass`)"
  },
  {
    "label": "HReg-Gebühren (Neueintragung 420/280/210 …)",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`src/lib/gruendungsunterlagen.ts` + Masken-/Mappen-Texte",
    "wert": "GebV-HReg-Anhang @ 1.1.2021 (einzige Konsolidierung, Cache)",
    "rhythmus": "jährlich (Verordnungs-Pauschalen)"
  },
  {
    "label": "Kantonale Mindestlöhne",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`src/lib/vorlagen/arbeitsvertrag.ts` (`AV_MINDESTLOEHNE`)",
    "wert": "je Eintrag datiert",
    "rhythmus": "jährlich (Indexierung per 1.1.)"
  },
  {
    "label": "Künftige Fassung AHVG (SR 831.10)",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (AHVG)",
    "wert": "gepinnt 1.1.2026",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung AIG (SR 142.20)",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (AIG)",
    "wert": "gepinnt 12.6.2026",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung AsylG (SR 142.31)",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (ASYLG)",
    "wert": "gepinnt 12.6.2026",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung AVIV (SR 837.02)",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (AVIV)",
    "wert": "gepinnt 1.8.2026",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung BankV (SR 952.02)",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (BANKV)",
    "wert": "gepinnt 1.1.2025",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung BPG (SR 172.220.1)",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (BPG)",
    "wert": "gepinnt 1.1.2024",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung BPV (SR 172.220.111.3)",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (BPV)",
    "wert": "gepinnt 1.7.2026",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung CO2-Gesetz (SR 641.71)",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (CO2_GESETZ)",
    "wert": "gepinnt 1.1.2025",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung DBG (SR 642.11)",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (DBG)",
    "wert": "gepinnt 2.9.2026",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung DesV (SR 232.121)",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (DESV)",
    "wert": "gepinnt 1.7.2025",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung EBG (SR 742.101)",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (EBG)",
    "wert": "gepinnt 1.1.2026",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung ELG (SR 831.30)",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (ELG)",
    "wert": "gepinnt 1.1.2026",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung EnG (SR 730.0)",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (ENG)",
    "wert": "gepinnt 1.4.2026",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung ERV (SR 952.03)",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (ERV)",
    "wert": "gepinnt 24.1.2025",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung FINMA-GebV (SR 956.122)",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (FINMA_GEBV)",
    "wert": "gepinnt 1.3.2024",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung FINMAG (SR 956.1)",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (FINMAG)",
    "wert": "gepinnt 1.4.2025",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung HMG (SR 812.21)",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (HMG)",
    "wert": "gepinnt 1.1.2025",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung IVG (SR 831.20)",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (IVG)",
    "wert": "gepinnt 1.1.2026",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung KLV (SR 832.112.31)",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (KLV)",
    "wert": "gepinnt 1.8.2026",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung KVV (SR 832.102)",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (KVV)",
    "wert": "gepinnt 1.8.2026",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung MSchV (SR 232.111)",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (MSCHV)",
    "wert": "gepinnt 1.7.2025",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung MWSTV (SR 641.201)",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (MWSTV)",
    "wert": "gepinnt 1.1.2025",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung ParlG (SR 171.10)",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (PARLG)",
    "wert": "gepinnt 2.3.2026",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung PatG (SR 232.14)",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (PATG)",
    "wert": "gepinnt 1.7.2025",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung UVV (SR 832.202)",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (UVV)",
    "wert": "gepinnt 1.1.2026",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung VG (SR 170.32)",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (VG)",
    "wert": "gepinnt 15.6.2025",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung VGG (SR 173.32)",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (VGG)",
    "wert": "gepinnt 12.6.2026",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung VwVG (SR 172.021)",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (VWVG)",
    "wert": "gepinnt 1.7.2022",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung VZV (SR 741.51)",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (VZV)",
    "wert": "gepinnt 1.1.2026",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "ZH-Betreibungskreis-Reorganisation (56 → 34 oder 18 Kreise)",
    "datum": "2027-01-01",
    "quelle": "Tabelle",
    "fundstelle": "nur Dossier (`behoerden/betreibungskreise-kantone.md`) — nicht verdrahtet",
    "wert": "RR-Beschluss/Vernehmlassung 5.11.2025, NOCH NICHT in Kraft; aktuell massgeblich: Ämterliste Betreibungsinspektorat",
    "rhythmus": "halbjährlich bis Inkrafttreten; danach Ämterliste + ZH-Zuordnung komplett neu erfassen"
  },
  {
    "label": "BWO-Verzeichnis Miet-Schlichtungsbehörden",
    "datum": "2027-02-01",
    "quelle": "Tabelle",
    "fundstelle": "noch nicht verdrahtet (Bibliothek: `schlichtungsbehoerden-kantone.md`)",
    "wert": "PDF-Stand 13.02.2026",
    "rhythmus": "jährlich"
  },
  {
    "label": "Kantons-Snapshots aus dem PDF-Pfad (Fassungs-Bindung)",
    "datum": "2027-02-01",
    "quelle": "Tabelle",
    "fundstelle": "`public/normtext/kanton/*.json` mit `quelleUrl` `…/api/<lang>/versions/<vid>/pdf_file` (8 Erlasse) ↔ `normen/kanton-gliederung-sidecar-luecke-2026-08-13.md`",
    "wert": "Diese Snapshots hängen an einer festen Versions-Id; ihr `fassungsToken` ist ein Inhalts-Hash des PDF und ändert sich NICHT, wenn das Portal längst eine neue Fassung führt — die Drift bleibt unbemerkt. Belegt 13.8.2026: SG-2808 (GKV sGS 941.12) hängt an Version 2808 / Stand 1.3.2012, amtlich gilt Version 3863 seit 1.7.2026. Übrige sieben am selben Datum fassungsgleich geprüft",
    "rhythmus": "halbjährlich, bis ein Tor `current_version.id` gegen die Snapshot-Version prüft (Wurzel-Fix, §17). NACHTRAG 6.9.2026: Für die TARIF-Seite derselben Erlasse leistet das jetzt `check:tarif-drift` (es meldet SG-2808 automatisch, Lauf 6.9.2026); die SNAPSHOT-Seite (`public/normtext/kanton/*.json`) ist damit NICHT gedeckt — dieser Wurzel-Fix bleibt offen"
  },
  {
    "label": "Künftige Fassung BVV 3 (SR 831.461.3)",
    "datum": "2027-06-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (BVV3)",
    "wert": "gepinnt 1.1.2025",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung FZV (SR 831.425)",
    "datum": "2027-06-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (FZV)",
    "wert": "gepinnt 1.8.2026",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Notariats-Anlaufstellen je Kanton (inkl. Listen-PDFs)",
    "datum": "2027-06-01",
    "quelle": "Tabelle",
    "fundstelle": "`src/lib/notariate.ts` ↔ `behoerden/notariate-kantone.md`",
    "wert": "URLs geprüft 7.6.2026; Listen-Stände SZ 4/2026 · OW 5/2026 · NE 1/2026 · GE 6/2025; UR/AI/BL verifiziert 7.6.2026 (System amtlich; Personenlisten teils nur offline)",
    "rhythmus": "jährlich; UR/AI/BL vorab klären"
  },
  {
    "label": "Künftige Fassung EOG (SR 834.1)",
    "datum": "2027-07-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (EOG)",
    "wert": "gepinnt 1.6.2026",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung EOV (SR 834.11)",
    "datum": "2027-07-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (EOV)",
    "wert": "gepinnt 1.6.2026",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung FamZV (SR 836.21)",
    "datum": "2027-07-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (FAMZV)",
    "wert": "gepinnt 1.1.2025",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung IVV (SR 831.201)",
    "datum": "2027-07-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (IVV)",
    "wert": "gepinnt 1.6.2025",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung BVG (SR 831.40)",
    "datum": "2027-09-26",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (BVG)",
    "wert": "gepinnt 1.1.2025",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung ELV (SR 831.301)",
    "datum": "2028-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (ELV)",
    "wert": "gepinnt 1.1.2025",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung GSchV (SR 814.201)",
    "datum": "2028-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (GSCHV)",
    "wert": "gepinnt 1.12.2025",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung KVG (SR 832.10)",
    "datum": "2028-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (KVG)",
    "wert": "gepinnt 1.7.2026",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung FAV (SR 784.101.2)",
    "datum": "2028-07-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (FAV)",
    "wert": "gepinnt 15.8.2024",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "TG Steuergesetz (RB 640.1) — Handänderungssteuersatz",
    "datum": "2028-10-01",
    "quelle": "Tabelle",
    "fundstelle": "`src/data/tarif/notariat-grundbuch.ts` (TG, § 140 Abs. 1: 1 %)",
    "wert": "Geltende Fassung Version 2929, in Kraft seit 1.1.2025 und ausdrücklich befristet bis 31.12.2028 (`https://www.rechtsbuch.tg.ch/app/de/texts_of_law/640.1`, Abruf 6.9.2026, Beleg: `kosten/tarif-drift-nachverifikation-2026-09-06.md`). Läuft die Befristung aus, ohne dass eine Folgefassung gilt, zeigt der Eintrag einen Satz ohne geltende Grundlage",
    "rhythmus": "vor dem 31.12.2028 prüfen, ob eine Folgefassung publiziert ist; laufend maschinell über `check:tarif-drift` (meldet die neue Fassungs-Id, sobald TG sie führt)"
  },
  {
    "label": "Künftige Fassung BV (SR 101)",
    "datum": "2029-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (BV)",
    "wert": "gepinnt 3.3.2024",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung FinfraG (SR 958.1)",
    "datum": "2029-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (FINFRAG)",
    "wert": "gepinnt 1.2.2024",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung StHG (SR 642.14)",
    "datum": "2029-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (STHG)",
    "wert": "gepinnt 1.1.2025",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung BetmG (SR 812.121)",
    "datum": "2029-08-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (BETMG)",
    "wert": "gepinnt 1.9.2023",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung BVV 2 (SR 831.441.1)",
    "datum": "2030-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (BVV_2)",
    "wert": "gepinnt 1.8.2026",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung GlG (SR 151.1)",
    "datum": "2032-07-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (GLG)",
    "wert": "gepinnt 1.7.2020",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung VKL (SR 832.104)",
    "datum": "2032-07-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (VKL)",
    "wert": "gepinnt 1.6.2025",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  },
  {
    "label": "Künftige Fassung AHVV (SR 831.101)",
    "datum": "2034-01-01",
    "quelle": "Tabelle",
    "fundstelle": "`scripts/fedlex-cache.sh` (AHVV)",
    "wert": "gepinnt 1.1.2026",
    "rhythmus": "einmalig — Fedlex-Konsolidierung, dann re-pinnen (§7)"
  }
];
