# Suchgüte-Eval — Baseline 16.7.2026

> **Nachtrag 7.10.2026 (A1-FUNDAMENT):** Das Werkzeug (`scripts/suche-eval.ts`,
> `npm run eval:suche`, Gold-Set `scripts/suche-eval-gold.json`) ist **entfallen** —
> es mass die Browser-Suche (FlexSearch-Recall + `artikelRanking`), und die gibt es
> nicht mehr: die Wortsuche im Gesetzestext läuft nur noch über den Server
> (`api/suche`, Entscheid David «Ja, nur über Server»). Die Messwerte unten sind
> die Baseline des damaligen Browser-Index und bleiben als Beleg stehen; die Gold-Paare
> sind im Versionsverlauf (vor dem Commit «Browser-Suchindex entfaellt») nachlesbar. Eine
> Güte-Messung des Server-Weges wäre ein eigener Schritt (Prod-Smoke `pruefeApiSuche`
> prüft heute nur Erreichbarkeit und Form).

**Werkzeug:** `scripts/suche-eval.ts` · `npm run eval:suche` · Gold-Set
`scripts/suche-eval-gold.json` (69 Paare, zweifach verifiziert).
**Charakter:** advisory — **kein Gate, kein CI-Einbau**, read-only Mess-Werkzeug.
Deterministisch, LLM-frei (§2): FlexSearch-Recall + `artikelRanking` +
Sprung-Parser, kein Netz, kein `Date.now()` in der Messlogik.

## 1. Quelle + Stand

- **Korpus (Lauf 16.7.2026):** 25 389 Bund-Artikel (frisch aus den gepinnten
  Snapshots via `baueBundIndex`, MIT m/n/g-Ranking-Feldern — **nicht** die
  veraltete committete `such-index/artikel-bund.json`), 1 469 Erlasse
  (`public/normtext/register.json`), 1 426 Entscheide
  (`public/rechtsprechung/register.json`).
- **Gemessene Pipeline (§5, kein Parallel-Index):** exakt die Produktions­funktionen
  des Such-Hooks — `parseNormQuery`/`sprungGruppe` (Norm-Sprung),
  `parseBgeSprung`/`bgeSprungGruppe` (BGE-Sprung), `baueSuchFn`
  (FlexSearch-Recall) + `rangiere` (`artikelRanking`), `gesetzGruppe`/
  `artikelGruppe`/`entscheidGruppe`, assembliert in der Hook-Reihenfolge
  (Sprung → Gesetze → Gesetzestext → Rechtsprechung).
- **Gemessener Kanal:** der Rang eines Ziels wird IM Produkt-Kanal seines
  Inhaltstyps gemessen (Norm-Sprung ⧺ Gesetzestext für Artikel; BGE-Sprung ⧺
  Rechtsprechung für Entscheide; Norm-Sprung ⧺ Gesetze für Erlasse). Die
  gruppen­übergreifende Reihenfolge ist eine separate UI-Frage (A6/§13) und wird
  hier bewusst **nicht** mit der Ranking-Güte des Kanals vermischt.
- **Fenster:** Artikel-Limit 50, Kappung 50 je Gruppe (= /suche-Vollseite S5,
  nicht das 6er-Dropdown). Ränge jenseits 50 zählen als Miss.

## 2. Ergebnis (Baseline)

| Klasse | n | Recall@1 | Recall@5 | Recall@10 | MRR | NDCG@10 |
| --- | --: | --: | --: | --: | --: | --: |
| normzitat | 18 | 0.833 | 0.833 | 0.833 | 0.833 | 0.833 |
| umgangssprache | 17 | 0.000 | 0.118 | 0.176 | 0.049 | 0.065 |
| bge | 18 | 0.833 | 0.833 | 0.833 | 0.833 | 0.833 |
| stichwort | 16 | 0.500 | 0.750 | 0.813 | 0.603 | 0.651 |
| **gesamt** | 69 | 0.551 | 0.638 | 0.667 | 0.586 | 0.602 |

Determinismus verifiziert (identische Ränge über zwei Läufe). Laufzeit ~3 s.

## 3. Auffälligste Schwächen (regelbasiert, decision-tree-fähig)

1. **Umgangssprache/Volltext-Fragen — der grosse Einbruch (Recall@10 = 0.18,
   MRR 0.05).** Ganze Laien-Fragen finden den Kernartikel fast nie. Ursache:
   FlexSearch `tokenize:'forward'` matcht nur Präfixe — ein **Kompositum** in der
   Query (`Verjährungsfrist`, `Werkeigentümerhaftung`, `Kündigungsfrist`) ist
   **kein Präfix** des Index-Tokens (`Verjährung`, `Werkeigentümers`), also
   **null Recall**. Verifiziert: «Verjährungsfrist Forderung allgemein» liefert
   50 Treffer, aber OR 127 ist nicht darunter; «Werkeigentümerhaftung» → 0
   Treffer. Das ist die ehrlich offengelegte Grenze (§8: Term-/Zitat-Suche, keine
   Semantik). **Hebel:** Dekompositions-/Stemming-Schicht ODER kuratierte
   Synonyme/Weiterleitungen im `vokabular` — beides deterministisch möglich.
2. **FR/IT-Kürzel + SR-Nummer im Norm-Sprung unvollständig.** `art. 29 Cst`
   (→ BV 29), `art. 190 LDIP` (→ IPRG 190) und `SR 220 Art. 1 OR` (→ OR 1) lösen
   **null** auf. Verifiziert: `parseNormQuery` gibt `null`. Die `ALIAS`-Tabelle in
   `normQuery.ts` kennt nur CO/CC/CP/CPC/LP — **Cst, LDIP** (und weitere welsche/
   italienische Kurztitel) fehlen; SR-Nummern werden gar nicht geparst. **Hebel:**
   `ALIAS` um Cst/LDIP/… ergänzen; optional SR-Nummer→Erlass-Auflösung (billig,
   `register.json.sr` trägt sie bereits).
3. **Thematische BGE-Suche mit mehreren Sachwörtern (3/18 bge-Miss).** «Betrug
   sexuelle Dienstleistung Zahlungsbereitschaft», «Landesverweisung
   Rückwirkungsverbot», «Videokonferenz Hauptverhandlung ZPO» finden ihren
   Leitentscheid nicht. `filterEntscheide` ist ein **Substring-AND** über die
   Regeste (`heu.includes(q)`), d. h. die **ganze** Query muss als
   zusammenhängender Teilstring vorkommen — Mehrwort-Umschreibungen scheitern.
   Direkte BGE-Zitate (BGE/ATF …) und einprägsame Ein-/Zweiwort-Themen
   («alternierende Obhut») sitzen dagegen sauffrei auf Rang 1.
4. **Stichwort-Komposita/FR (Recall@1 = 0.50).** Gleiche Wurzel wie (1):
   «Werkeigentümerhaftung» → 0, «offres publiques» (FR) → 0, «Eigentum» → Rang 17
   (das definitorische ZGB 641 wird von wörtlicheren Treffern verdrängt),
   «Beweislast» → Rang 6. Ein-Wort-Kernbegriffe (`Verjährung`, `Miete`, `Notwehr`,
   `OR`, `ZPO`) sind dagegen top.

**Kurz:** Direkte Zitate (Norm & BGE) und Ein-Wort-Kernbegriffe sind stark
(Rang 1); **natürlichsprachige Mehrwort-/Kompositum-Anfragen** sind die klar
grösste Lücke — genau die Klasse, für die das Produkt keine Semantik verspricht.

## 4. Geltungsbereich / Ausnahmen

- Nur **Bund-Artikel** im Volltext-Recall (kantonale Erlasse nur nach Titel,
  §11.5) — das Gold-Set hält sich daran (alle Artikel-/Erlass-Ziele Bund).
- Spätere Gruppen (Materialien/Katalog/Presets/Online-Edge) sind ausgelassen:
  sie tragen keine Artikel-/Entscheid-/Erlass-Ziele und stehen in der Anzeige
  hinter den gemessenen Kanälen → kein Einfluss auf den gemessenen Rang.
- Online-Edge (`api/suche`, Turso) ist derzeit nicht provisioniert (503); der
  Client-Index ist Fallback und genau das, was hier gemessen wird.

## 5. Pflegebedarf

- Gold-Set (`scripts/suche-eval-gold.json`) mitziehen, wenn sich Zielnormen/
  BGE-Bestand ändern (Belege je Paar im `beleg`-Feld gegen `struktur/bund/*.json`
  bzw. `rechtsprechung/register.json`).
- Baseline neu erheben nach jeder Recall-/Ranking-Änderung (Vokabular,
  `artikelRanking`, `ALIAS`) — Zahlen hier sind der Vorher-Stand.

## 6. Abnahme-Status

Erst-Erhebung des Bau-Agenten (zweifach verifiziert: Harness-Korrektheit an den
Rang-1-Klassen belegt, Miss-Ursachen einzeln empirisch bestätigt). Fachliche
Abnahme durch David ausstehend (§8). Methodik-Herkunft:
`bibliothek/werkzeuge/omnilex-ai-und-kaggle-legal-ir-2026-07-16.md`
(Apache-2.0 — nur Methodik, kein Code-Copy).
