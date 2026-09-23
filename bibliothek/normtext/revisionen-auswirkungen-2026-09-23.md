# Änderungsliste je Erlass aus der Fedlex-Rechtsanalyse «Auswirkungen» (23.9.2026)

**Erstellt:** 23.9.2026 — Anlass: Scheibe S6-D1, ROADMAP `W2·29-WERKBANK-LESER`, Befunde
AE-2 bis AE-5 (Reiter «Änderungen» im Gesetzes-Leser).
**Status:** Erstrecherche (Bau-Messung Opus) — Gegenprüfung ausstehend, fachliche Abnahme
David offen. Kein `verified`/«geprüft» gesetzt.
**Vorläufer:** `revisionen-2026-07-10.md` (Pfad (a) Fassungen, Pfad (b) SR-Taxonomie).
**Code:** `scripts/normtext/revisionen-generieren.ts`, `scripts/normtext/revisionen-auswirkungen.ts`,
Tor `scripts/normtext/check-revisionen.ts` (Ziff. 5, 9–12).

## Quelle (live erhoben 23.9.2026, https://fedlex.data.admin.ch/sparqlendpoint)

Fedlex führt je Änderungserlass eine Rechtsanalyse `<oc>/legal-analysis` mit Knoten
`LegalResourceImpact`:

| Prädikat (jolux) | Inhalt |
|---|---|
| `impactFromLegalResource` | Teil des ändernden Erlasses (`eli/oc/2020/746/lvl_I`, `…/text`) |
| `impactToLegalResource` | Teil des geänderten Erlasses (`eli/cc/27/317_321_377/art_734f`, `…/text`) |
| `legalResourceImpactHasType` | `vocabulary/impact-type/<n>` (1 Änderung, 2 Aufhebung, 3 Genehmigung, 5 Inkrafttreten, 6 Berichtigung, 7 Verlängerung, 9 Geltungsbereich, 12 2. Fundstelle, 27 Vollständige Aufhebung, 30 Teilinkraftsetzung) |
| `legalResourceImpactHasDateEntryInForce` | Inkrafttreten dieser Auswirkung |
| `impactConsolidatedBy` | Fassung, die die Auswirkung einarbeitet (`…/<YYYYMMDD>`) |

Jeder Zielteil hängt per `legalResourceSubdivisionIsPartOf` direkt am Abstract (OR: 997
Auswirkungen, Präfix-Zählung = Teil-Join). Vollerhebung 231 Bund-Abstracts: 15 515
Roh-Auswirkungen, alle Quellen unter `eli/oc/`.

## Regel (deterministisch)

1. Einträge = ändernde Erlasse mit Auswirkung auf das GEPINNTE Abstract, je
   Inkrafttretensdatum ein Eintrag (Etappen). Vorgänger-Erlasse gleicher SR haben ein anderes
   Abstract und fallen weg; der Stammerlass (`jolux:basicAct`) ist nie ein Eintrag.
2. Pfad (b) (SR-Taxonomie) ergänzt nur im Geltungsfenster [`dateEntryInForce`,
   `dateNoLongerInForce`] des Abstracts (gemessen 11 Fälle, u. a. künftige Änderungen, denen
   Fedlex noch keine Auswirkung zuordnet).
3. Auswirkungsdatum == Beschlussdatum < Inkrafttreten des ändernden Erlasses und keine Fassung
   an diesem Datum → Inkrafttreten des ändernden Erlasses (77 Fälle; Beleg ZPO ← AS 2010 281).
4. Fassung VOR dem Auswirkungsdatum (614 von 15 515) → Datum ist Erfassungsartefakt, zählt
   wie undatiert (AVIG-Altbestand «2023-01-01»; AHVG ← AS 1965 537 «2066-01-01»).
5. Ersatzdaten (3, 4, undatiert, nur Pfad b) tragen `datumAusErlass: true` (104 Einträge).
6. Marker nur noch für Fassungen ohne zugeordneten Erlass (20 in 19 Erlassen), verlinkt auf
   `https://www.fedlex.admin.ch/eli/<abstract>/<YYYYMMDD>/de`.

## Messung vorher/nachher (231 Sidecars, Skript im Bau-Scratchpad, Kommandos im PR)

| Grösse | vorher (main 4617fd955) | nachher |
|---|---|---|
| Marker gesamt / Sidecars | 1978 / 196 | 20 / 19 |
| Marker-Links `/eli/cc/<SR>` (Fedlex page-not-found) | 1978 | 0 |
| Einträge vor dem Inkrafttreten des Erlasses | 360 in 107 | 23 in 19 (alle aus der Rechtsanalyse, keine Vorgänger) |
| Änderungs-Einträge | 3232 | 6978 |
| Fussnoten-oc in der Änderungsliste (Entstehung-Deckung) | 1575 / 3988 gebucht | 3899 / 3988 |

## Pflegebedarf / offene Punkte

- Fedlex-Datenfehler (melden, nicht umhängen): AHVG-Fassung 2066-01-01; Beschlussdaten als
  Inkrafttreten im Altbestand; Nachkonsolidierungs-Artefakte «2023-01-01».
- Die Darstellung von `wirkungen`, `etappen`, `datumAusErlass` im Reiter ist Sache von W1c.
- Beschriftung «Sammelerlass» der Rest-Marker trifft nicht mehr zu (Rest = Fassung ohne
  zugeordneten Erlass) — W1c.
