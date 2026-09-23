# Verzahnungs-Klingen (ROADMAP W2·7) — Norm- & Bau-Dossier

**Erstellt:** 5.7.2026 · Auftrag David, ROADMAP W2·7 «Verzahnungs-Klingen» (gebaut, nicht nur recherchiert).
**Status:** zweifach geprüft (Erstrecherche live + unabhängige adversariale Gegenprüfung, Verdikt bestanden); fachliche Abnahme durch David steht aus (§8, `verified: false`, Katalog-Status `entwurf`).

Drei «Klingen» als Verpackung/Verzahnung auf bestehenden Engines.

Die Norm-Anker des Gerichts-Baustein-Sets sind **live gegen die in-force
Fedlex-AKN-XML verifiziert** (§7) und durch eine **unabhängige adversariale
Gegenprüfung** (Opus, frischer Kontext, gegen die amtliche Quelle) mit Verdikt
**bestanden** bestätigt (QS-GP, Register-Zeile 5.7.2026).

---

## 1. Verjährungs-/Gewährleistungs-Board

**Was:** Reine Darstellung (`src/pages/RechnerVerjaehrungBoard.tsx`) auf den
bestehenden Engines — keine neue Rechtslogik.

- **Rückgrat:** die sechs Verjährungs-Regime aus `verjaehrung.ts` (`REGIME`),
  gerendert als Übersichts-Matrix (Anspruchstyp · relative/absolute Frist ·
  Fristbeginn · Normen-Chips).
- **Sonderfall:** der interaktive Gewährleistungs-Rechner (`GewaehrleistungForm`,
  `berechneGewaehrleistung`) — Rügefrist + Verjährung der Mängelrechte.
- **Verzahnung:** Hinweis Rügefrist (Verwirkung, keine Hemmung) ↔ Verjährung
  (Einrede, AT-Mechanik) + Brücke zum Verjährungsrechner.
- **CISG nur Link:** UN-Kaufrecht SR 0.221.211.1, amtliche Fedlex-Fassung
  (`https://www.fedlex.admin.ch/eli/cc/1991/307_307_307/de`) — keine eigene
  CISG-Engine (bewusst weggelassen, ROADMAP-Wortlaut «CISG nur Link»).

**Bewusst weggelassen:** keine automatische Ableitung des Verjährungs-Regimes
aus den Vertragsdaten (wäre §2-widrige Heuristik) — die Regime-Wahl bleibt im
Verjährungsrechner explizit.

## 2. Verzugszins-/Forderungs-/Inkasso-Strecke

**Was:** Stateless «Strecke» (`src/pages/RechnerInkassoStrecke.tsx`) — ein
strukturierter Reverse-Reader der Durchsetzungsschritte, jeder mit dem
zuständigen Werkzeug verlinkt:

1. Fälligkeit & Verzug (Art. 102 OR)
2. Verzugszins berechnen (Art. 104 OR) — eingebetteter `VerzugszinsForm`
   (`berechneVerzugszins`)
3. Mahnung / Inverzugsetzung (→ `/vorlagen/mahnung`)
4. Betreibung einleiten (Art. 67 SchKG, → `/rechner/betreibungskosten`)
5. Fristen im Betreibungsverfahren (Art. 74 SchKG, → `/rechner/schkg-fristen`)

**Auflage erfüllt (§5):** Der Verzugszins wird ausschliesslich von der Engine
`berechneVerzugszins` gerechnet; die Mahnung-Vorlage nennt den Satz (Art. 104
OR), rechnet die 5 % aber **nicht** selbst nach. Stateless: keine Speicherung.

## 3. Gerichts-Baustein-Set

### 3a. Amtlicher Zitierer BGE/BGer (`src/lib/gerichtszitat.ts`)

Deterministischer Struktur-Formatierer (§2), reine Zeichenketten-Ausgabe, kein
Berechnungsergebnis (dokumentierte Ausnahme DESIGN-REGLEMENT §R-12).

- **BGE:** `BGE {Band} {Teil} {Seite}` [+ ` E. {Erwägung}`]. Sammlungsteile
  I · Ia · Ib · II · III · IV · V (fünf Hauptteile der Amtlichen Sammlung +
  historische Feinunterteilung Ia/Ib).
- **BGer:** `BGer {Geschäftsnummer} vom {Datum ausgeschrieben}` [+ ` E. …`] plus
  amtliche Langform `Urteil des Bundesgerichts …`. Geschäftsnummer-Muster
  `^\d[A-Z]{1,2}_\d+/\d{4}$` (z. B. 5A_691/2023, 4A_123/2025, 1C_45/2024).
- **Zitier-SSoT:** `src/lib/konventionen.ts` — «BGE 140 III 409 E. 4.3» /
  «BGer 5A_691/2023 vom 13. August 2024 E. 2.1» (Datum ausgeschrieben).
- **§8-Ehrlichkeit:** prüft die **Form** der Fundstelle, **nicht** ob der
  Entscheid existiert oder was er sagt (keine Recherche, «grenzwertig»).

### 3b. Rubrum-Vorlage (`src/lib/vorlagen/rubrum.ts`)

Reiner Nutzer-Eingabe-Builder für den Kopf eines Entscheids; ausgabeArt
`entwurf` (Gerüst), Blanko-Download-Konvention (leere Pflichtfelder → `________`).

**Norm-Anker (live gegen Fedlex verifiziert 5.7.2026, § Quelle unten):**

| Norm | Rolle | Beleg |
|---|---|---|
| Art. 238 lit. a ZPO | Bezeichnung + Zusammensetzung des Gerichts | s. Quelle |
| Art. 238 lit. b ZPO | Ort + Datum des Entscheids | s. Quelle |
| Art. 238 lit. c ZPO | Bezeichnung der Parteien + ihrer Vertretung | s. Quelle |
| Art. 238 lit. d–h ZPO | Rest-Inhalt (Dispositiv/Mitteilung/Rechtsmittel/Gründe/Unterschrift) — als Hinweis | s. Quelle |
| Art. 112 Abs. 1 lit. a–d BGG | Inhalt der beschwerdefähigen Entscheide — als Weiterzugs-Hinweis | s. Quelle |
| Art. 112 Abs. 3 BGG | Rückweisung zur Verbesserung — als Hinweis | s. Quelle |

---

## Quelle + Stand (§7, §11 Ziff. 1)

| Norm | SR | Konsolidierung (ELI) | Stand (dateApplicability) | Live-Link |
|---|---|---|---|---|
| **Art. 238 ZPO** | 272 | `eli/cc/2010/262/20260701` | **1.7.2026** (offen, keine Folgeversion, nicht aufgehoben) | https://www.fedlex.admin.ch/eli/cc/2010/262/de |
| **Art. 112 BGG** | 173.110 | `eli/cc/2006/218/20260401` | **1.4.2026** (offen, keine Folgeversion, nicht aufgehoben) | https://www.fedlex.admin.ch/eli/cc/2006/218/de |

Methode: SPARQL `dateApplicability`-Fenster (heute 5.7.2026) → `isExemplifiedBy`
Filestore-XML → `Content-Type: application/xml` bestätigt (kein Casemates-Shell),
Struktur aus dem AKN-Baum (`<article>`/`<paragraph>`/`<blockList>`/`<item>`),
nicht aus Erinnerung. **Befund der Struktur:** Art. 238 ZPO trägt EINEN
unnummerierten Absatz (kein `<num>`), darum wird nur `lit.` zitiert, nie `Abs.`.
Beide Fassungen haben die Revision «Verbesserung der Praxistauglichkeit und der
Rechtsdurchsetzung» (in Kraft seit 1.1.2025) bereits eingearbeitet.

## Regel deterministisch (§11 Ziff. 2)

- Board/Strecke: keine eigene Regel — Projektion + Verlinkung bestehender
  Engines/Vorlagen (Darstellungsschicht §3).
- gerichtszitat: Eingabe (typ+Felder) → validierte Zeichenkette | `unzulaessig`
  (Teil ∉ Menge, Band/Seite keine Ganzzahl, Aktenzeichen-Muster verfehlt,
  Datum ungültig, Erwägung ungültig).
- rubrum: Eingabe (Felder) → assemble-Dokument mit Blanko-Strichen; Gates rein
  hinweisend (keine Blocker), instanz-abhängige Reihenfolge (BGer → Art. 112 BGG
  zuerst).

## Geltungsbereich & Ausnahmen (§11 Ziff. 3)

- Rubrum bildet nur den KOPF ab; Dispositiv/Begründung/Rechtsmittelbelehrung/
  Unterschrift ergänzt die zuständige Person (in Hinweisen offengelegt).
- CISG (internationaler Warenkauf) nur verlinkt, nicht gerechnet.
- gerichtszitat prüft nicht die Existenz/Aussage des Entscheids.

## Pflegebedarf (§11 Ziff. 4)

- Datierte Parameter: keine (Norm-Zitate; Currency via `check:fedlex-versionen`).
  Die ZPO-Konsolidierung 20260701 gilt erst seit dem 1.7.2026 — vor einer
  Abnahme SPARQL-Datum erneut prüfen (AS-Lag via RSS-OC).

## Abnahme-Status (§11 Ziff. 5)

**Zweifach geprüft** (Erstrecherche live + unabhängige adversariale Gegenprüfung,
Verdikt bestanden). Fachliche Abnahme durch David steht aus (`verified: false`
auf allen Norm-Chips, Status `entwurf`).
