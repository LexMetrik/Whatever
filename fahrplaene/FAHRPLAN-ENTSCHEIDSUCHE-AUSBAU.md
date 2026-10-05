# Fahrplan — entscheidsuche voll ausschöpfen (Teil-B-Ausbau)
<!-- @lagebild name: Entscheide filtern · zweck: Filter nach Gericht und Facetten; Richternamen-Auflösung (Risikopfad). -->

> **Eingefroren 5.10.2026:** Spezifikation, kein Bau-Stand; Fortschritts-Häkchen werden nicht mehr nachgeführt; Entscheidtabellen gelten unverändert.

**Heimat: ROADMAP-Schritte `W2·6` (Dach, Checklisten-Zeile «Entscheid-Filter»; vormals
`W2·6-FILTER`) und `W2·6-RESOLVER` (vormals `W2·6-RNAME`) — Etiketten-Konsolidierung 15.8.2026.**

**Auftrag David (24.6.2026):** Den vollen Mehrwert von entscheidsuche
(`https://mcp.entscheidsuche.ch/` + darunterliegende API) für LexMetrik heben.
Dieser Plan priorisiert die noch ungenutzten Hebel und gibt je Phase konkrete
Dateien, Tore und Risiken. **Reiner Plan — nichts hier ist umgesetzt** (§9).

## §0 · Zweck

Detailquelle zu `W2·6`/`W2·6-RESOLVER` (vormals `W2·6-FILTER`/`W2·6-RNAME`,
Etiketten-Konsolidierung 15.8.2026) — entscheidsuche.ch (MCP + Live-Suche)
für LexMetrik voll ausschöpfen. Steuert nicht; kein zweiter Einstieg (§14). Datei-
spezifisch: **reiner Plan, nichts hier ist umgesetzt** (§9) — Umsetzungsstand steht
allein in `ROADMAP.md`/`STRUKTUR.md`, nicht in diesem Dokument.

## §7 · ROADMAP-Spec W2·6-FILTER (wörtlich verschoben 31.7.2026)

*Nachzug 15.8.2026 (Etiketten-Konsolidierung BAUPLAN-UMBAU): Das Etikett `W2·6-FILTER` ist
aufgegangen — bauender Schritt dieser Spec ist seither das Dach `W2·6` (Rechtsprechungs-Daten),
die Zeile steht dort als Checklisten-Eintrag. **Trailer also `Roadmap: W2·6`**, nicht der im
wörtlichen Block unten zitierte Alt-Trailer. Gegenstand, Bündelungs-Begründung und die Abgrenzung
zur Namens-Auflösung (§8, heute `W2·6-RESOLVER`) unverändert.*

> **→ Bau-Spec: «5. Entscheid-Filter über die API» dieser Datei.** Dieser § ist die *wörtlich hierher verschobene ROADMAP-Prosa* (Wortlaut-Heimat), nicht die Bau-Spezifikation — wer nur ihn slict, baut ohne die verbindlichen Einheiten, Entscheide und Querschnitt-Regeln.

*Wörtlich aus `ROADMAP.md` (QS-TOK/ROADMAP-Diät B4, 31.7.2026); dort bleiben Checkbox, `@meta`, Einzeiler, Pointer. Steuert nicht — Spec-Heimat.*

  **Gebündelt, weil beide Teile dieselbe Bau-Fläche tragen** (Turso-Schema + Sync + `api/suche` + Facetten-UI)
  und dieselbe Risiko-Klasse haben (Abfrage/Projektion, **kein** Rechtsinhalt) — §14.2. Reihenfolge folgt
  Davids Queue: **a vor b**. Vorleistung steht: Besetzung ist extrahiert und verlinkt (#309/#310/#311),
  die Sync-Architektur trägt seit #313 einen atomaren Voll-Rebuild.
  - **a · Richterfilter über die API** — Turso-Tabelle **`entscheid_richter(entscheid_id, slug, rolle)`** +
    Slug-Index, `api/suche` um **`?richter=<slug>`**. Heute existiert der Filter nur client-seitig über die
    ausgelieferten Projektionen; über die API ist er nicht abfragbar. **Feasibility 🟢** — Daten liegen vor
    (19 467 Nennungen, 484 Personen, 100 % eindeutig), es ist Schema + Sync + Query-Parameter.
  - **b · Gerichtsentscheide allgemein besser filterbar** — gilt **allgemein, nicht nur BS** (David).
    **Datenlage erhoben, drei ehrlich getrennte Klassen (§8):**
    🟢 **billig, sofort:** `datum` · `leitcharakter` (**1259 Leitentscheide**) · `sprache` ·
    `regesteVorhanden` · `gerichtstyp` — alle durchgängig befüllt.
    🔴 **teuer, NICHT als Filter versprechen:** `normKeys` ist **nur zu 18 % befüllt**. Ein Normen-Filter auf
    18 % Abdeckung erzeugt stille Falsch-Negative («keine Treffer» statt «nicht erfasst») — das ist der
    Fehler aus PR #313 in neuer Form. Entweder vorher die Abdeckung heben oder die Lücke im UI **ausweisen**;
    nicht stillschweigend filtern. **Abdeckung heben = eigener Schritt `W2·6-NKEY`** (§14-Intake 21.7.2026).
    🟠 **ableitbar, aber verifikationspflichtig:** **Geschäftsnummer-Präfix → Verfahrensart**
    (VD 612 · BES 494 · SB 450 · IV 429 …). Die Ableitung ist plausibel und wertvoll, aber sie ist eine
    **Rechtsaussage über die Verfahrensart** — sie **MUSS gegen die amtliche Geschäftsordnung/das amtliche
    Abkürzungsverzeichnis verifiziert werden**, bevor sie ein Filter-Label wird (§7 Norm+Link+Stand). Bis
    dahin nicht ausliefern. Dieser Teil ist Risikopfad ⇒ `check:gegenpruefung`, Opus.
  **Abgrenzung:** Ranking und Prognose über Richter:innen bleiben gesperrt (`richter-analytik-gate`,
  `W3·15-RICHTER`); Filtern/Facette/Verlinkung sind ausdrücklich frei. Richter im Entscheid klickbar (#24)
  ist ✅ mit #311 erledigt und hier **nicht** erneut geplant.
  **DoD:** `check:entscheide` · `check:besetzung` · `check:turso-frische` (Soll-Zahlen mitziehen!) ·
  Verifikations-Beleg für jede Verfahrensart-Abkürzung · golden byte-gleich. Trailer `Roadmap: W2·6-FILTER`.

---

## §8 · ROADMAP-Spec W2·6-RNAME (wörtlich verschoben 31.7.2026)

*Nachzug 15.8.2026 (Etiketten-Konsolidierung BAUPLAN-UMBAU): Das Etikett `W2·6-RNAME` ist
aufgegangen — bauender Schritt dieser Spec ist seither `W2·6-RESOLVER` (Risikopfad-Dach der
Rechtsprechungs-Daten), die Zeile steht dort als Checklisten-Eintrag. Gegenstand, Gegenrichtung
und `QS-GP`-Pflicht unverändert.*

> **→ Bau-Spec: «6. Richternamen gegen den Staatskalender auflösen» dieser Datei.** Dieser § ist die *wörtlich hierher verschobene ROADMAP-Prosa* (Wortlaut-Heimat), nicht die Bau-Spezifikation — wer nur ihn slict, baut ohne die verbindlichen Einheiten, Entscheide und Querschnitt-Regeln.

*Wörtlich aus `ROADMAP.md` (QS-TOK/ROADMAP-Diät B4, 31.7.2026); dort bleiben Checkbox, `@meta`, Einzeiler, Pointer. Steuert nicht — Spec-Heimat.*

  Abgekürzte Vornamen auflösen: **«P. Kaderli» → «Kaderli Peter»**, Abgleich gegen **Staatskalender /
  amtliches Behördenverzeichnis** (§7: amtliche Quelle, mit Stand). **Bewusst NICHT mit `W2·6-FILTER`
  gebündelt (§14.2): andere Risiko-Klasse** — hier werden Personen identifiziert, dort nur abgefragt.
  **Harte Gegenrichtung, die den Schritt definiert:** zwei verschiedene Personen mit gleichem Nachnamen +
  gleicher Initiale werden **NIE verschmolzen**. Aufgelöst wird **nur bei Eindeutigkeit**; bei jeder
  Mehrdeutigkeit bleiben die Einträge **getrennt** und wandern in einen **Kollisions-Report**. Diese Regel
  ist nicht optional: #309 ging mit **11 erfundenen Amtsträger:innen** live (u. a. «Donzallaz Beusch» =
  zwei Bundesrichter verschmolzen), gefunden erst **nach** dem Merge. Eine Namens-Auflösung ist exakt die
  Operation, die diese Fehlerklasse erzeugt.
  **DoD:** Auflösung nur bei Eindeutigkeit · Kollisions-Report als Artefakt · Phantom-Scan + Vorsitz-
  Kardinalität (die Tore aus #310) grün über die **volle** Grundgesamtheit, nicht über eine Stichprobe ·
  `check:gegenpruefung` **bestanden** (Opus, unabhängig gegen den Staatskalender) · golden byte-gleich.
  **Fundament zugleich für** `W3·15-RICHTER` und Davids «Kenne-deine-Prüfer»-Dossier.
  Trailer `Roadmap: W2·6-RNAME`.

---


---

## Archivierte Abschnitte *(Plan-Neuschnitt 29.8.2026)*

8 Abschnitt(e) dieser Datei sind wörtlich nach
[`archiv/fahrplaene/FAHRPLAN-ENTSCHEIDSUCHE-AUSBAU.md`](../archiv/fahrplaene/FAHRPLAN-ENTSCHEIDSUCHE-AUSBAU.md) ausgelagert — sie tragen keine offene
ROADMAP-Bindung mehr. Titel:

- 0. Ausgangslage (Stand 24.6.2026)
- 1. Leitplanken (verbindlich)
- 2. Phasen (priorisiert nach Wert ÷ Aufwand ÷ Risiko)
- 3. Reihenfolge & Abhängigkeiten
- 4. Offene Verifikationspunkte (vor Bau prüfen)
- 5. Entscheid-Filter über die API (`W2·6-FILTER`, §14-Intake 20.7.2026)
- 6. Richternamen gegen den Staatskalender auflösen (`W2·6-RNAME`, §14-Intake 20.7.2026)
- §9 · ROADMAP-Spec-Nachzug `W2·6-RNAME` (wörtlich verschoben 4.8.2026, ROADMAP-Diät Welle 3)
