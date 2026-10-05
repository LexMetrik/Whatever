# FAHRPLAN — UI-Nutzwert & Navigation (Ultracode-Synthese 11.7.2026)
<!-- @lagebild name: Suchen & Navigieren · zweck: App-weite Suche und Wege zwischen Gesetzen, Entscheiden und Werkzeugen. -->

> **Eingefroren 5.10.2026:** Spezifikation, kein Bau-Stand; Fortschritts-Häkchen werden nicht mehr nachgeführt; Entscheidtabellen gelten unverändert.

> **ROADMAP-Schritt:** `W2·10-UI-NAV` (Welle 2, nach den laufenden W2·5d-Einheiten).
> **Quelle:** Ultracode-Recherche 11.7.2026 — 60 empirische UI-Befunde (Playwright/DOM/Code)
> plus 3 adversariale Kritik-Linsen (**david-treue** · **repo-realität** · **praxis-nutzen**)
> mit Repo-Spot-Checks. Dieses Dokument ist die **Synthese**: Verdikt-gefilterte Befunde,
> zu Bau-Einheiten gebündelt (§14.2), priorisiert nach **Praxis-Hebel × Machbarkeit ohne
> Fachzeit × Kollisionslage**. Verworfenes steht explizit mit Grund (§Z).
>
> **Bilanz:** 80 Einzelverdikte (60 Befunde + Dubletten-Fassungen) → **44 übernommen ·
> 32 geändert** (davon 6 David-Entscheid, 3 hart gegated) · **4 verworfen**; nach
> Dubletten-Merges ≈ 52 Netto-Befunde in **~26 Bau-Einheiten** + 6 Zusatzposten der Linsen.

---

> Erledigt-/Stand-Abschnitte vom 14.8.2026 nach `archiv/FAHRPLAN-ERLEDIGT-ABSCHNITTE.md` verschoben (QS-PLAN-EINFACH).

## §0 · Verbindliche Prozess-Regeln (gelten für JEDE Einheit dieses Plans)

1. **Vintage-Regel (Prod-Re-Audit vor jedem Schnitt).** Viele Befunde wurden gegen einen
   Prod-Stand **vor** den Merges vom 10./11.7. erhoben (U-VERWEIS, U-POSITION, Kopf-PR #194,
   D9/D10, A5-Mobil-Dropdown) — mehrere sind bereits teilwiderlegt. **Pflicht:** Befund am
   aktuellen `lexmetrik.vercel.app` reproduzieren + Abgleich gegen `FAHRPLAN-GESETZES-UX.md`
   §10 (A1–A25) und `FAHRPLAN-VERZAHNUNG-UI.md` (Bewusst-NICHT-Liste), **bevor** gebaut wird.
2. **Sequenzierung Reader-Flächen.** Einheiten, die `parts.tsx`/`inhalt.tsx`/`ArtikelBody.tsx`/
   `index.css` berühren, laufen **hart HINTER** den offenen A-Restposten (A20/A21/A22/A24/A25
   C-2/C-3) — Kollisions-Precheck nach §10.3 (`git worktree list` + Datei-Abgleich). Suche-/
   Rechner-/Rechtsprechungs-Einheiten sind weitgehend kollisionsfrei und **zuerst** schneidbar.
3. **Modell-Daueranweisung:** Bau = Opus (Default); Risiko-Pfade (Daten-Pipeline, Presets,
   Extraktions-Nähe) = Opus + Skill `gegenpruefung` (`check:gegenpruefung`-Quittung).
4. **§8-Ehrlichkeit als Bau-Kriterium:** kein Feature zeigt mehr, als der Korpus trägt;
   maschinelle Zuordnungen tragen «maschinell»-Marker; lokale Persistenz trägt «nur auf
   diesem Gerät».
5. **§15/§13:** CLS über token-basierte Mindesthöhen, keine Magic-Numbers; golden-relevante
   Flächen byte-gleich beweisen, nicht behaupten.

**Leitthema der ganzen Welle («gebaut ≠ gefunden», Befund der Praxis-Linse):** LexMetrik hat
starke, fertige Features mit null Entdeckbarkeit (Split-View, Norm-Sprung, Popover, Zitat-
Aktionen, Pane-Persistenz). Ein Grossteil dieses Plans ist darum **Sichtbarmachung + tote
Pfade schliessen**, nicht Neubau.

---

## §7 · Zusatzposten der Linsen (neu aufgenommen)

- **Kantons-Adressen ohne Segment-Wache (W2·18-FEHLERBUCH; Gegenprüfung Intl-Routing 29.8.2026,
  Befund 1, VORBESTEHEND):** `/gesetze/<beliebig>/AG-291.150` rendert den
  Erlass statt zu leiten — `routenEbeneVonKey` kennt nur die 238 Bundes-Keys
  (ERLASS_REGISTER) und fällt für 1231 Kantons-Keys aufs URL-Segment zurück.
  Wurzel-Fix: Entscheid gegen das gebaute Browse-Manifest statt Register;
  danach Kanonik-Tor auf Kantons-Stichprobe ausweiten.

| ID | Posten | Aufwand | Einordnung |
|---|---|---|---|
| **Z1** | **ICS-/Kalender-Export des Frist-Ergebnisses** («Verjährung Forderung X: 31.03.2027» nach Outlook/Fristenkontrolle) — haftungsrelevanteste Lücke der Praxis-Linse; von der Produktvision explizit gedeckt («rechnen/drucken/ICS»). Ist-Stand zuerst erheben; Export «ohne Gewähr»-gelabelt (§8), reine UI-Ausleitung ohne neues Rechenrisiko. | S–M | eigene kleine Einheit nach N0 |
| **Z2** | **Print-CSS für Fundstellen** (Artikel-/Erwägungs-genauer Druck, Stand-Zeile + ELI im Ausdruck) — Kanzlei = Papier-/PDF-Akte; 755k-px-Seiten drucken heute mutmasslich katastrophal. Dockt an das gebaute U-PDF an (amtliches PDF = Ganz-Erlass; Z2 = Auszug). | S–M | Reader-Fläche, nach §0.2 |
| **Z3** | FR/IT-Kürzel-Aliasse in der Norm-Sprung-Suche | S | in **S2** eingefaltet |
| **Z4** | «Im Entscheid suchen» | — | in **V5** eingefaltet |
| **Z5** | Listen-Scroll-Restoration als Prüfpunkt | — | in **J1** eingefaltet |
| **Z6** | Korpus-Abdeckungsseite «Was ist drin» (global, aus Registern generiert) | S | in **S3/E1** eingefaltet |
| **E4** | a11y-Prüfauftrag: Skip-Link, Fokus nach Anker-Sprung, aria-live «✓ kopiert» | S–M | Prüfauftrag + Fixes, mit R6 |
| **G-SUCH** | **Suchindex indexiert Fussnoten + Tabellen mit** (Intake 17.7.2026, siehe §7b) | S | eigene Index-Einheit, Nähe **S4** |

---


---

## Archivierte Abschnitte *(Plan-Neuschnitt 29.8.2026)*

15 Abschnitt(e) dieser Datei sind wörtlich nach
[`archiv/fahrplaene/FAHRPLAN-UI-NAVIGATION.md`](../archiv/fahrplaene/FAHRPLAN-UI-NAVIGATION.md) ausgelagert — sie tragen keine offene
ROADMAP-Bindung mehr. Titel:

- §1 · P0 — Quick-Win-Paket (alles S, kollisionsfrei, zusammen ~1–2 Sessions)
- §2 · P1 — Suche glaubwürdig machen (Kette S1→S6; Zuschnitt der repo-Linse)
- §3 · P2 — Verzahnung Norm ↔ Rechtsprechung ↔ Werkzeug (der Burggraben-Anschluss)
- §4 · P3 — Reader & Wiedereinstieg (hart hinter A20–A25, §0.2)
- §5 · P3b — Verlauf-Initiative (EINE Baueinheit, EINE Datenquelle)
- §6 · P4 — Rechtsprechungs-Übersicht & Startseiten-News
- §7b · Intake G-SUCH — Suchindex ignoriert Fussnoten + Tabellen (David 17.7.2026)
- §Y · David-Entscheide (NICHT autonom bauen — als 3-Zeilen-Fragen vorlegen)
- §X · Hart gegated (Blocker ausweisen, nicht in Kurzfrist-Listen mischen)
- §Z · Verworfen / Nicht bauen (explizit, mit Grund — verhindert Wiederkehr)
- §S · Stand 4.8.2026 — Reader-Kette gelandet (Orchestrier-Session bauplan-review-095048)
- §Q · Benchmark-Belege (Muster-Quellen der Recherche)
- §R · Empfohlene Bau-Reihenfolge (Praxis-Hebel × Machbarkeit, kollisionssortiert)
- §8 · ROADMAP-Spec W2·10-UI-NAV (wörtlich verschoben 31.7.2026)
- §9 · ROADMAP-Spec `QS-UI-HIGHLIGHT` — `::highlight()`-Registry je Leser-Instanz
