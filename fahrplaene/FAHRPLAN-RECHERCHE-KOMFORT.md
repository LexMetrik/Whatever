# FAHRPLAN — Recherche-Komfort: Treffer-Landkarte, Zitatnetz am Urteil, Reiterleisten-Abgleich (Auftrag David 18.9.2026)
<!-- @lagebild name: Recherche-Komfort · zweck: Man sieht auf einen Blick, wo im Dokument die Treffer liegen, springt von Urteil zu Urteil bis auf die Erwägung und findet alle Urteile zu einem Artikel. -->

> **ROADMAP-Schritte:** `W2·28-TREFFER-LANDKARTE` (`feld: leser`, §1) · Unterschritt
> «Zitationsnetz» im Dach `W2·6` (`feld: rechtsprechung`, §2) · Unterschritt
> «Reiterleisten-Abgleich + Merkliste-Entscheid» im Dach `W2·18-FEHLERBUCH`
> (`feld: design`, §3).
> **Auftrag David 18.9.2026 (Chat, wörtlich):** «kannst du selbst mal auf swisslex gehen und
> schauen welche konzepte wie bspw. die seitenleiste wo graphisch angezeigt wird wo sich die
> relevanten stellen befinden» · «auch in bezug auf rechtssprechung» · «auch wie die tableiste
> funktioniert als vorbild» · «auch favoriten» · «alle drei in den bauplan aufnehmen».
> **Vorbild, nicht Vorlage:** Sichtung der Bedienkonzepte von Swisslex 6.0 am 18.9.2026
> (live, Dokument-, Urteils-, Such- und Filteransicht). Übernommen wird ausschliesslich das
> **Bedienkonzept** — kein Inhalt, kein Code, keine Gestaltung 1:1; Anatomie nach
> `DESIGN-REGLEMENT.md`. Alles hier ist **regelbasiert** (§2): die KI-Teile des Vorbilds
> (Abschnitts-Relevanz, KI-Suche, Zusammenfassungen) sind ausdrücklich NICHT Teil des Plans.
> **Ist-Stand-Messung 18.9.2026** (repo-weite Suche, `lex-recherche`): siehe je § «Bestand».

## §1 · Treffer-Landkarte (`W2·28-TREFFER-LANDKARTE`, reine UI)

**Ziel.** Wer im Gesetz- oder Entscheid-Leser nach einem Wort sucht, sieht neben dem
Scrollbalken das ganze Dokument als schmalen Streifen mit einer Marke je Treffer — dicht
behandelt oder nur gestreift ist ohne Scrollen erkennbar; Klick springt an die Stelle.

**Bestand.** Suche im Dokument mit Hervorhebung existiert (`src/pages/gesetz-leser/
leserSuche.ts`, `suchHighlight.ts`, `inhalt-suchtreffer.tsx`; Entscheid:
`src/pages/entscheidLeserRegeln.ts` Treffer-Bündel je Erwägung). Es **fehlen**: die
Landkarte (kein Code, kein Plan-Eintrag) und der Verteilungsbalken in der Trefferliste.

**Einheiten.**
- **L-1 · Landkarte im Leser** *(M)* — ein Streifen (Richtwert 48–64 px, Höhe = sichtbarer
  Lesebereich), massstäblich zum Dokument: Blöcke je Absatz/Artikel bzw. Erwägung,
  Überschriften abgesetzt, Treffer-Marken aus **denselben** Treffern wie die bestehende
  Hervorhebung (§5 — eine Trefferquelle, nie zweite Zählung). Abschnitts-Etiketten aus der
  vorhandenen Struktur: Gesetz = Gliederungsebenen; Entscheid = Regeste · Sachverhalt ·
  Erwägungen · Dispositiv, soweit die Daten sie tragen (sonst weglassen, nie raten).
  Lesepositions-Anzeige; Klick = Sprung; Marke trägt zugänglichen Namen (Tastatur/Screenreader).

  > **Korrektur L-1 (Fertigbau 21.9.2026) — zugänglicher Name am STREIFEN, nicht an
  > jeder Marke.** Gebaut ist die Alternative: der Streifen ist `role="img"` mit
  > zusammenfassendem `aria-label` («N Fundstellen in M Abschnitten»), das SVG darin
  > `aria-hidden`; Tastatur und Screenreader bedienen dieselben Sprungziele über die
  > bestehende Trefferliste (↑/↓, ‹ ›). Anlass: ein Dokument trägt bis zu 1146 Marken
  > (OR) — ebenso viele Tabstopps vor der Lesespalte wären für genau jene Nutzer eine
  > Verschlechterung, die der Satz schützen soll (WCAG 2.1.1 ist über die Alternative
  > erfüllt). Herleitung in `src/components/leser/TrefferLandkarte.tsx`, gemessen in
  > `e2e/leser-w228-landkarte.e2e.ts` (b). Breite: 48 px, also die Untergrenze des
  > Richtwerts oben — der Streifen liegt `fixed` in der gemessenen Randluft von 104 px
  > und verdrängt die Lesespalte damit nicht.
- **L-2 · Schalter und Ruhezustand** *(S)* — Landkarte erscheint nur bei aktiver
  Dokumentsuche (kein Dauer-Element, DESIGN-REGLEMENT Ruhe-Grundsatz); ein Schalter
  blendet Hervorhebung **und** Marken gemeinsam aus. Mobil: ausgeblendet oder als
  waagrechter Balken — Entscheid im Bau nach Messung, nicht vorab.
- **L-3 · Verteilungsbalken in der Trefferliste** *(M, `feld: suche`-Berührung)* — je Treffer
  der globalen Suche ein waagrechter Balken «wo im Dokument liegen die Treffer». Nur bauen,
  wenn die Such-Antwort die Positionen **ohne** zweiten Volltext-Abruf je Treffer liefern
  kann (§15 — sonst Logikverlust-Bewertung und Verzicht); sonst als Ideen-Zeile parken.

**Grenzen.** Kein neuer Such-Index, keine Änderung an Treffer-Logik oder Rangfolge (§1/§6:
Golden byte-gleich, Tests unverändert). Virtualisierte Leser-Ansichten: Positionen aus dem
Daten-Modell rechnen, nicht aus dem DOM messen (Skill `perf`). Performance-Bewertung mit
expliziter Logikverlust-Zeile (§15).

**DoD.** Tore grün · Sichtprüfung nach `.claude/rules/webseiten-pruefung.md` (Gesetz lang:
OR/ZGB; Entscheid lang; hell/dunkel; mobil) · Marken-Zahl = Treffer-Zahl der Dokumentsuche
(Zusicherung im Test) · kein CLS beim Ein-/Ausblenden.

## §2 · Zitatnetz am Urteil (Unterschritt «Zitationsnetz» im Dach `W2·6`)

Erweitert §10 von [FAHRPLAN-VERZAHNUNG-UI.md](FAHRPLAN-VERZAHNUNG-UI.md) (Rückwärts-Zitate +
Leitentscheid-Score) um vier am Vorbild gesichtete Konzepte. **Zwei Risiko-Klassen — nie in
einem PR mischen** (Skill `auftrag` Ziff. 3): erst Daten (Risikopfad, Gegenprüfung Pflicht),
dann UI auf den gelandeten Daten.

**Bestand.** Norm→Entscheide «Wird zitiert von» ist gebaut (`KontextPanel.tsx`,
`VerweisKontext.tsx`); Entscheid→Entscheid ist nur als Erweiterungspunkt vermerkt
(`KontextPanel.tsx` «Erweiterungspunkt V2», Edge-Query auf `zitat_kanten`). Hover-Vorschau
gibt es nur für Normen (`hoverVorschau.ts`, `NormPopover.tsx`). Erwägungsgenaue
BGE→BGE-Links und eine Normsuche über Urteile fehlen.

**Daten (Klasse daten, Gegenprüfung):**
- **Z-1 · Erwägungsgenaue Zitat-Kante** — Zitate der Form «BGE 147 III 293 E. 4.4» tragen
  die Ziel-Erwägung als eigenes Feld der Kante; nur wo die Erwägungsnummer im Zitat steht
  **und** im Ziel-Entscheid als Anker existiert — sonst Link auf den Entscheid ohne Anker
  («kein Link ist besser als ein falscher Link», §1). Merkposten LM-042 («ff.»-Sammelzitate)
  bleibt Auflage.
- **Z-2 · Zitat-Kontext** — je eingehender Kante die Fundstelle des Zitats im zitierenden
  Entscheid (Erwägung + Zeichenbereich), damit die UI den zitierenden Satz **aus dem
  vorhandenen Text** zeigen kann; kein gespeicherter Zweit-Text (§5/§7 Zitat-Ausnahme).
  Abhängig vom Zuschnitt aus `W2·21-ZULIEFERER` (OpenCaseLaw-Zitationsgraph als Wegweiser).
- **Z-3 · Normsuche über Urteile, sprachübergreifend** — «alle Urteile zu Art. 125 ZGB»
  findet auch «art. 125 CC»/«art. 125 CC (it.)»: Abbildung der amtlichen Erlass-Abkürzungen
  DE/FR/IT aus Fedlex-Stammdaten (amtliche Quelle, §7), nie aus einer Übersetzungs-Heuristik.
  Andockpunkt `norm-index`/`W2·6-RESOLVER`; Facetten-Fläche siehe
  [FAHRPLAN-ENTSCHEIDSUCHE-AUSBAU.md](FAHRPLAN-ENTSCHEIDSUCHE-AUSBAU.md) §7.

**UI (Klasse bau, nach den Daten):**
- **Z-4 · Urteils-Vorschau beim Überfahren** — bestehende Hover-Vorschau (Normen) auf
  Entscheid-Links erweitern: Fundstelle · Gericht · Datum · Regeste-Anriss (§10: bestehender
  Baustein, keine Kopie).
- **Z-5 · «Wird zitiert von» am Entscheid mit Zitat-Kontext** — Gruppe im KontextPanel
  (eingehend / ausgehend, Zähler), je Eintrag der zitierende Satz mit markiertem Zitat;
  «Neueste Zitierungen» als Kurzliste. Sortierung deterministisch (Datum), kein Score-Modell (§2).

**Grenzen.** Leitsatz `W2·6` gilt: Nachweisdatenbank statt Volltextsammlung; §8: Deckungsgrad
des Zitatnetzes wird in der UI offengelegt (welche Gerichte/Jahre abgedeckt sind).

## §3 · Reiterleisten-Abgleich + Merkliste-Entscheid (`feld: design`)

**Bestand.** In-App-Reiter sind gebaut (`src/lib/tabs.ts`, `src/components/layout/
Reiterleiste.tsx`, `useTabs.ts`; Wellen 1–3, PR #842–#844). **Favoriten hat David am
5.6.2026 gestrichen** und durch «Zuletzt verwendet» ersetzt (`useZuletzt.ts`;
`katalog.test.tsx` sichert, dass «Favoriten» nicht auf der Startseite steht; Wortlaut
ROADMAP-CHRONIK.md).

- **R-1 · Abgleich gegen das Vorbild** *(S, Prüfschritt vor jedem Bau)* — gesichtete Merkmale
  einzeln gegen den Bestand prüfen und nur Lücken bauen: Typ-Symbol je Reiter (Suche /
  Gesetz / Urteil / Werkzeug) · Aufklapp-Liste aller offenen Reiter bei Überlauf · Reiter per
  Ziehen umsortieren · je Reiter erhaltene Leseposition und Seitenleiste · Adresse und
  Seitentitel folgen dem aktiven Reiter (teilbarer Link) · Öffnen aus Trefferliste/Verweis
  in neuem Reiter. Ergebnis = Lückenliste als Unterzeilen, kein Sammel-Umbau.
- **R-2 · WARTET AUF DAVID: Merkliste ja/nein** — eine lokale Merkliste (nur im Browser des
  Nutzers, kein Konto, kein Server; exportier-/teilbar als Link) wäre mit dem Leitbild
  vereinbar (lokaler Komfortzustand ist Praxis: Reiter, Leseposition, Leser-Optionen) —
  läuft aber gegen den Streich-Entscheid vom 5.6.2026. Ohne ausdrückliche Bestätigung wird
  nichts gebaut; Dossiers/Notizen/Teamfunktionen des Vorbilds sind serverseitig und bleiben
  ausgeschlossen.

## Quellen

Sichtungsnotiz der Session 18.9.2026 (Bedienkonzepte, technische Anatomie der Landkarte:
ein SVG, Blöcke je Absatz, Marken je Treffer, Abschnitts-Etiketten) — in diesen Fahrplan
überführt; keine Inhalte des Vorbilds gespeichert.
