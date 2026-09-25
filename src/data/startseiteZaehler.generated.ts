// ─── GENERIERT via `npm run gen:zaehler` ────────────────────────────────
// NICHT von Hand editieren. Quellen (SSoT §5): public/normtext/register.json,
// public/rechtsprechung/register.json und der Katalog (startseiteConfig.ts).
// Drift-Tor: `npm run check:zaehler`. Nur echter Volltext ist gezählt
// (Gesetze/Entscheide: status snapshot bzw. Nicht-Verweise).

export interface StartseiteZaehler {
  /** Bundeserlasse im Volltext (status snapshot). */
  gesetzeBundVolltext: number;
  /** Kantonserlasse im Volltext (status snapshot). */
  gesetzeKantonVolltext: number;
  /** Bund + Kanton im Volltext. */
  gesetzeVolltext: number;
  /** IA-7: erfasste Erlasse JE Kanton (alle Manifest-Einträge der Ebene kanton —
   *  dieselbe Zählregel wie die IA-2-Badges/`kantonAnzahl` in Gesetze.tsx). */
  kantonErlassZahlen: Record<string, number>;
  /** W2·24-R3: Systematik des Bundesrechts (Ordnung + Titel aus
   *  `lib/normtext/systematik.ts`, Anker `/gesetze?ebene=bund#sys-<id>`),
   *  je Kategorie die Zahl der VOLLTEXT-Erlasse und bis zu vier Kürzel. */
  bundSystematik: Array<{ nr: string; id: string; titel: string; kuerzel: string[]; anzahl: number }>;
  /** K5: Bundeserlasse der Säule «Bundesrecht» im Volltext (ohne International) —
   *  Bundesrecht + International = gesetzeBundVolltext. */
  gesetzeBundesrechtVolltext: number;
  /** Bundeserlasse der Säule «International» im Volltext (rechtsgebiet international). */
  gesetzeInternationalVolltext: number;
  /** Bis zu vier Kürzel der Säule «International» (Register-Reihenfolge). */
  internationalKuerzel: string[];
  /** Gerichtsentscheide im Volltext (Nicht-Verweise). */
  rechtsprechungVolltext: number;
  /** K5: Verweis-Einträge (vollständiges Urteil zu einem BGE, Deep-Link in den
   *  Leitentscheid) — getrennt von `rechtsprechungVolltext`, nie addiert. */
  rechtsprechungVollurteilVerweise: number;
  /** W2·24-D26: Entscheide je Sachgebiet (Ordnung/Label aus `GEBIETE`),
   *  Zählregel identisch zu `zaehleSachgebiete` (Verweise raus); Sachgebiete
   *  ohne Entscheid fehlen (§8). Ziel je Zeile: `/rechtsprechung?rg=<id>`. */
  rechtsprechungSachgebiete: Array<{ id: string; label: string; anzahl: number }>;
  /** W2·24-D26: amtliche Leitentscheide (Nicht-Verweise, leitcharakter
   *  `leitentscheid`) — Ziel `/rechtsprechung?leit=1`. */
  rechtsprechungLeitentscheide: number;
  /** Erfasste amtliche Materialien (Behördenpublikationen, nur-live-link). */
  materialien: number;
  /** U12: davon Materialien im Hausbegriff — Gesetzgebung (Botschaften,
   *  Vernehmlassungen, kantonale Parlamentsgeschäfte; `gattungVon`). */
  materialienGesetzgebung: number;
  /** U12: davon Erläuterungen — Verwaltungspraxis ohne Gesetzesrang.
   *  materialienGesetzgebung + materialienErlaeuterungen = materialien. */
  materialienErlaeuterungen: number;
  /** W2·24-R3: erfasste Materialien je Behörde, Reihenfolge BEHOERDEN (rang);
   *  Behörden ohne Eintrag fehlen (nie eine 0-Zeile behaupten, §8). */
  materialienBehoerden: Array<{ id: string; kuerzel: string; name: string; anzahl: number }>;
  /** Verfügbare Rechner (eigene Seite). */
  rechner: number;
  /** Verfügbare Vorlagen (eigene Seite). */
  vorlagen: number;
  /** Stand der Gesetzes-Register-Erzeugung (ISO). */
  standGesetze: string;
  /** Fix #691 (12.9.2026): jüngstes ABRUFDATUM über den echten Rechtsprechungs-
   *  Bestand (ISO) — zuvor stand hier das Erzeugungsdatum des Registers
   *  (`register.json`s `erzeugt`, ein Bau-Zeitstempel), der bei jedem
   *  Teil-Lauf auf «heute» sprang, unabhängig davon ob neue Entscheide
   *  dazukamen. Andere Bedeutung als `standGesetze`/`standMaterialien`
   *  (die bleiben Bau-Zeitstempel) — bewusst, weil hier ein echtes
   *  Abrufdatum je Snapshot vorliegt (§8). */
  standRechtsprechung: string;
  /** Stand der Materialien-Register-Erzeugung (ISO). */
  standMaterialien: string;
  /** D8: jüngster Konsolidierungsstand über alle Volltext-Erlasse (ISO)
   *  — das Alter der INHALTE, nicht des Builds. null = kein gültiges Datum. */
  juengsterGesetzStand: string | null;
  /** D8: jüngstes Entscheiddatum (Nicht-Verweise, ISO) oder null. */
  juengsterEntscheid: string | null;
  /** D8: jüngster Materialien-Stand (ISO) oder null — fehlt das Feld im
   *  Register durchgehend, bleibt die Zeile in der Anzeige weg (§8). */
  juengsteMaterialie: string | null;
}

export const STARTSEITE_ZAEHLER: StartseiteZaehler = {
  "gesetzeBundVolltext": 231,
  "gesetzeKantonVolltext": 1339,
  "gesetzeVolltext": 1570,
  "kantonErlassZahlen": {
    "AG": 5,
    "AI": 4,
    "AR": 266,
    "BE": 5,
    "BL": 5,
    "BS": 859,
    "FR": 6,
    "GE": 4,
    "GL": 4,
    "GR": 6,
    "JU": 7,
    "LU": 5,
    "NE": 4,
    "NW": 4,
    "OW": 3,
    "SG": 5,
    "SH": 3,
    "SO": 2,
    "SZ": 4,
    "TG": 4,
    "TI": 5,
    "UR": 1,
    "VD": 7,
    "VS": 6,
    "ZG": 4,
    "ZH": 111
  },
  "bundSystematik": [
    {
      "nr": "01",
      "id": "staat",
      "titel": "Staats- und Verfassungsrecht",
      "kuerzel": [
        "BV",
        "ParlG",
        "RVOG",
        "RVOV"
      ],
      "anzahl": 9
    },
    {
      "nr": "02",
      "id": "privatrecht",
      "titel": "Privatrecht",
      "kuerzel": [
        "ZGB",
        "ZStV",
        "GBV",
        "TGBV"
      ],
      "anzahl": 33
    },
    {
      "nr": "03",
      "id": "zivilverfahren",
      "titel": "Zivilprozess- und Zwangsvollstreckungsrecht",
      "kuerzel": [
        "ZPO",
        "SchKG",
        "GebV SchKG",
        "KOV"
      ],
      "anzahl": 6
    },
    {
      "nr": "04",
      "id": "straf",
      "titel": "Strafrecht und Strafverfahren",
      "kuerzel": [
        "StGB",
        "StPO",
        "JStPO",
        "JStG"
      ],
      "anzahl": 14
    },
    {
      "nr": "05",
      "id": "verwaltung",
      "titel": "Verwaltungsrecht",
      "kuerzel": [
        "VwVG",
        "VGG",
        "VGKE",
        "VGR"
      ],
      "anzahl": 141
    }
  ],
  "gesetzeBundesrechtVolltext": 203,
  "gesetzeInternationalVolltext": 28,
  "internationalKuerzel": [
    "EMRK",
    "CISG",
    "LugÜ",
    "HZÜ"
  ],
  "rechtsprechungVolltext": 5093,
  "rechtsprechungVollurteilVerweise": 1252,
  "rechtsprechungSachgebiete": [
    {
      "id": "privat",
      "label": "Privatrecht",
      "anzahl": 992
    },
    {
      "id": "straf",
      "label": "Strafrecht",
      "anzahl": 1419
    },
    {
      "id": "prozess",
      "label": "Verfahrensrecht",
      "anzahl": 86
    },
    {
      "id": "oeffentlich",
      "label": "Öffentliches Recht",
      "anzahl": 1330
    },
    {
      "id": "steuern",
      "label": "Steuern & Abgaben",
      "anzahl": 116
    },
    {
      "id": "sozialversicherung",
      "label": "Sozialversicherung",
      "anzahl": 1150
    }
  ],
  "rechtsprechungLeitentscheide": 1259,
  "materialien": 1683,
  "materialienGesetzgebung": 1356,
  "materialienErlaeuterungen": 327,
  "materialienBehoerden": [
    {
      "id": "ESTV",
      "kuerzel": "ESTV",
      "name": "Eidgenössische Steuerverwaltung",
      "anzahl": 144
    },
    {
      "id": "EDOEB",
      "kuerzel": "EDÖB",
      "name": "Eidg. Datenschutz- und Öffentlichkeitsbeauftragter",
      "anzahl": 19
    },
    {
      "id": "SECO",
      "kuerzel": "SECO",
      "name": "Staatssekretariat für Wirtschaft",
      "anzahl": 155
    },
    {
      "id": "BSV",
      "kuerzel": "BSV",
      "name": "Bundesamt für Sozialversicherungen",
      "anzahl": 3
    },
    {
      "id": "BJ",
      "kuerzel": "EHRA",
      "name": "Eidg. Amt für das Handelsregister (Bundesamt für Justiz)",
      "anzahl": 2
    },
    {
      "id": "FINMA",
      "kuerzel": "FINMA",
      "name": "Eidgenössische Finanzmarktaufsicht",
      "anzahl": 2
    },
    {
      "id": "IGE",
      "kuerzel": "IGE",
      "name": "Eidg. Institut für Geistiges Eigentum",
      "anzahl": 2
    },
    {
      "id": "BR",
      "kuerzel": "BR",
      "name": "Bundesrat (Botschaften)",
      "anzahl": 408
    },
    {
      "id": "BUND",
      "kuerzel": "Bund",
      "name": "Bund (Vernehmlassungen)",
      "anzahl": 831
    },
    {
      "id": "BS-GR",
      "kuerzel": "GR BS",
      "name": "Grosser Rat des Kantons Basel-Stadt",
      "anzahl": 117
    }
  ],
  "rechner": 23,
  "vorlagen": 26,
  "standGesetze": "2026-09-21",
  "standRechtsprechung": "2026-09-23",
  "standMaterialien": "2026-09-18",
  "juengsterGesetzStand": "2026-09-02",
  "juengsterEntscheid": "2026-07-08",
  "juengsteMaterialie": "2026-09-18"
};
