# FAHRPLAN-GESAMTAUFBAU - Chronologischer Zukunfts-Ausbau der LexMetrik-Website
<!-- @lagebild name: Gesamtkarte (7 Phasen) · zweck: Ordnet alle Stränge chronologisch bis zum Nordstern; reine Lese-Sicht. -->

> **Eingefroren 5.10.2026:** Spezifikation, kein Bau-Stand; Fortschritts-Häkchen werden nicht mehr nachgeführt; Entscheidtabellen gelten unverändert.

**Heimat: ROADMAP «Funktions-Katalog (Aufbau + Auflagen je Werkzeug)» §1 (Kern-Auflagen je
Werkzeug) und «Strang-Detailpunkte & Hygiene» §2** (Offene Detailpunkte · Infrastruktur-
Fundament · Archiv-Kandidaten · Stale Doku-Köpfe · Klein-Backlog) — kein eigener `@meta`-Schritt,
nur Prosa-Verweis aus der ROADMAP.

## §0 · Zweck

ORDNET die bestehenden FAHRPLÄNE und die `ROADMAP.md` (§14) chronologisch — **ersetzt die
ROADMAP nicht**; sie bleibt die eine Steuerungsquelle. Der Plan ist **nicht zeitgebunden**
(Monatslabels sind indikativ); einzige harte Zeitschranke: Davids fachliche Abnahme erst ab
Dezember 2026.

**Stand:** 2.7.2026 · **Erarbeitet:** Council + Fable (Kritik-Runde eingearbeitet) · **Status:** ORDNET die bestehenden FAHRPLÄNE und die `ROADMAP.md` (§14) chronologisch — **ersetzt die ROADMAP nicht**; sie bleibt die eine Steuerungsquelle. · **Ist-Stand-Nachtrag 3.7.2026** (E0 gemergt, Phase 0 vollzogen, Betriebs-Fixes A2–A6 — s. Abschnitt «Ist-Stand-Nachtrag (3.7.2026)» unten).
**Nordstern (geschärft David 3.7.2026):** DIE EINE Anlaufplattform für JEDEN Rechtsanwender — Gerichte, Steuerbehörden, Ämter/Verwaltung, Studierende, Notariate, Treuhänder, nicht nur Anwältinnen. Übersichtliches Zuhause für JEGLICHE amtlichen Materialien von Bund + 26 Kantonen (inkl. Verwaltungsverordnungen/amtliche Praxis) — DB = die EINE Wahrheit, selbst gehostet, immer geltender Stand, transparent mit Fundstelle, Historie. *(Wortlaut-SSoT = ROADMAP-Produktvision; hier nur nachzitiert.)*

**Zeit-Hinweis (David 2.7.2026):** Der Plan ist **NICHT zeitgebunden** — die Monatslabels sind nur
**indikative Reihenfolge/Orientierung, keine Termine**. Einzige harte Zeitschranke: **Davids
fachliche Abnahme erst ab Dezember 2026** (Zeitsperre `[OF]`). Bis dahin ausschliesslich
Fachzeit-freie, tor-verifizierte Schritte; Tempo = so schnell die Tore grün werden. Das im Plan
genannte „ab Feb 2027" für die Abnahme-Welle ist damit **nach vorne offen ab Dez 2026** (Davids Wahl,
kein Zwang).

---

## §1 · ROADMAP-Spec Funktions-Katalog/Kern-Auflagen (wörtlich verschoben 31.7.2026)

> **→ Bau-Spec: «Phase 0» … «Phase 7» dieser Datei** (chronologische Bau-Reihenfolge; Kurzfassung in «Übersichtstabelle», Reihenfolge-Auflagen in «Die 5 grössten Reihenfolge-Risiken»). Dieser § ist die *wörtlich hierher verschobene ROADMAP-Prosa* (Wortlaut-Heimat), nicht die Bau-Spezifikation — wer nur ihn slict, baut ohne die verbindlichen Einheiten, Entscheide und Querschnitt-Regeln. *(Zeiger nachgetragen 31.7.2026, Endprüfungs-Fund R2-23: 33 der 35 ROADMAP-Spec-§§ trugen ihn, diese zwei nicht — ohne dokumentierte Begründung, obwohl GESAMTAUFBAU mit Phase 0…7 sehr wohl eine Bau-Spec in derselben Datei hat.)*

*Wörtlich aus `ROADMAP.md` (QS-TOK/ROADMAP-Diät B4, 31.7.2026); dort bleiben Checkbox, `@meta`, Einzeiler, Pointer. Steuert nicht — Spec-Heimat.*

**Kern-Auflagen (§1/§2/§8-kritisch):**
- **Fristen-Cockpit:** Vorwärts nur mit *bestehenden* Auslösern bündeln (jede neue Ereignis→Frist-
  Abbildung ist verifikationspflichtiger Rechtsregel-Code → bricht `[OF]`); stateless.
- **Streitwert:** ZPO-Streitwert ≠ BGG-Schwelle (Art. 51–53 vs. 74 BGG); `kostenBasisCHF` nur ins
  Kosten-Cockpit, `streitwertVerfahrenCHF` nur in Zuständigkeit/Rechtsmittel; Ermessen → `null`, nie 0.
- **Rechtsmittelprüfung:** BGG-Schicht an `berechneBgerRechtsweg()` **delegieren**, nicht neu codieren;
  nicht-rechenbare Tore (Art. 74 II lit. a, Art.-83-Katalog) als «selbst prüfen», keine Scheinpräzision.
- **Prozesskosten:** Dispositiv bei Ermessenstarif nur Spanne+Kriterien; bei `quote=null` keinen Saldo
  erzwingen; §8-Disclaimer auch im Gericht-Modus; MwSt nur auf Schalter.
- **Recherche/Gerichts-Set (grenzwertig):** nur amtliche Regeste **oder** eigene maschinelle (Marker
  «maschinell»); kein fremdverfasster Drittleitsatz; `statutes[]` = «genannt/zitiert», nicht «einschlägig».
- **Adressregister:** Lese-Schicht, kein Datenduplikat; Zuständigkeits-Schluss bleibt im Navigator;
  «noch nicht erfasst» statt raten; Stand + Verfallsregister.
- **Verzug/Inkasso:** Reverse-Reader nur strukturierte Eingabe (kein Freitext/LLM); Mahnung ruft Engine,
  rechnet 5 % nicht nach (§5).
- **B2B-Vertrag (grenzwertig):** vorhandene Schemas (NDA/Auftrag/Zession) nicht neu bauen (§5); nicht-
  dispositive Klauseln nur an konkrete Norm verankert oder mit §8-Offenlegung weglassen — kein
  Kommentar-/Verlagswortlaut.
- **Schwellen-Module:** OR 727 I = 2 von 3 Schwellen in **zwei** Folgejahren; DSG kennt keine 72h-Frist
  («so rasch als möglich») → kein numerischer Wert, nur Zitat + §8.

---

### Katalog-Tabelle (wörtlich verschoben 3.8.2026 aus ROADMAP.md)

Quellen durchgehend amtlich (Art. 5 URG). Alle Werkzeuge **stateless**. «grenzwertig» =
amtlich nutzbar mit harter Auflage. Die Kern-Auflagen je Werkzeug stehen oben in diesem §1.

| Werkzeug | Welle | neu/vorh. | §2 | Quelle amtl. | Aufw. |
|---|---|---|---|---|---|
| Fristen-Cockpit (Vorw./Rückw./Stillstand) | 1 | Verpackung | ja | ja | M |
| Streitwert + Grenzwert-Abgleich | 1 | Ausbau | ja | ja | S |
| Zuständigkeits-/Verfahrensnavigator | 1 | Ausbau | ja | ja | S |
| Rechtsmittel-/Eintretensprüfung | 1 | neu | teils | ja | M |
| Prozesskosten-Cockpit (Risiko/Festsetz./Dispositiv) | 1/2 | Verpackung | ja | ja | L |
| Norm→amtlicher Entscheid (Recherche) | 1/2 | Ausbau | ja | grenzwertig | M |
| Mehrsprach-Vergleich DE/FR/IT | 2 | neu | ja | ja | L |
| Verjährungs-/Gewährleistungs-Board | 2 | Ausbau | ja | ja | M |
| Verzugs-/Forderungs-/Inkasso-Strecke | 2 | Verpackung | teils | ja | M |
| Gerichts-/Behörden-Adressregister | 2 | Verpackung | ja | ja | M |
| Gerichts-Baustein-Set (Rubrum + Zitierer) | 2 | Verpackung | ja | grenzwertig | M |
| Schriften-/Eingaben-Baukasten | 2 | Ausbau | teils | ja | L |
| Gesetzgebungs-/Rechtsetzungs-Tracking | 3 | neu | teils | ja | M |
| Zustellfiktions-Engine | 3 | neu | ja | ja | M |
| Gesellschafts-/Schwellen-Module | 3 | neu | teils | ja | L |
| B2B-/Basis-Vertragsbaukasten | 3 | Ausbau | ja | grenzwertig | L |
| Schutzrechts-Gebühren (IGE) | 3 | neu | ja | ja | M |
| Normfassungs-/Geltungsstand-Prüfer | 3 | neu | teils | ja | L |

## §2 · ROADMAP-Spec Strang-Detailpunkte (wörtlich verschoben 31.7.2026)

> **→ Bau-Spec: «Phase 0» … «Phase 7» dieser Datei** (chronologische Bau-Reihenfolge; Kurzfassung in «Übersichtstabelle», Reihenfolge-Auflagen in «Die 5 grössten Reihenfolge-Risiken»). Dieser § ist die *wörtlich hierher verschobene ROADMAP-Prosa* (Wortlaut-Heimat), nicht die Bau-Spezifikation — wer nur ihn slict, baut ohne die verbindlichen Einheiten, Entscheide und Querschnitt-Regeln. *(Zeiger nachgetragen 31.7.2026, Endprüfungs-Fund R2-23: 33 der 35 ROADMAP-Spec-§§ trugen ihn, diese zwei nicht — ohne dokumentierte Begründung, obwohl GESAMTAUFBAU mit Phase 0…7 sehr wohl eine Bau-Spec in derselben Datei hat.)*

*Wörtlich aus `ROADMAP.md` (QS-TOK/ROADMAP-Diät B4, 31.7.2026); dort bleiben Checkbox, `@meta`, Einzeiler, Pointer. Steuert nicht — Spec-Heimat.*

- **Offene Detailpunkte:** GRUNDLAGEN G3.4 kant. Stammdaten · BS C3/§-Verlinkung/N5/D3 · POPUP
  PDF-only-Kantone/Token-Lücken · LUECKEN L7 Konfidenz-UI/L8 · NOTARIAT NG-4 Zweitpass · TARIF G3b
  komplett (A+B+C+D); Residuum = 32 mehrdeutige SG-Restblöcke (faithful Plaintext, §1) + eigener
  ZH-PDF-Strang (ZH-243 NotGebV §17 / hierarchische Ziffer-Tarife, andere Risiko-Klasse).
  **ERLEDIGT 5.7. (SG-2935-Rohtext-Reparatur, Branch `fix/sg2935-x-spalten`).** Wortlaut → `ROADMAP-CHRONIK.md` → Strang-Detailpunkte/SG-2935 (26.7.2026); Detail `archiv/FAHRPLAN-TARIF-TABELLEN-STUFE2.md` §SG-2935-Reparatur.
- **Infrastruktur-Fundament:** GESETZESTEXT-POPUP (Snapshot/Drift) trägt RECHTSSAMMLUNG/Rechtsprechungs-
  Verzahnung/GESETZE-IMPORT → vor aufsetzenden Strängen mitdenken.
- **Archiv-Kandidaten**: INTERNATIONAL-VOLLTEXT-Rest. RECHTSPRECHUNG-Dach/TARIF-STUFE2/
  BGER-RECHTSWEG deployt → nur Abnahme. **Erledigt 31.7.2026:** die Archiv-Welle hat 11 verwaiste
  Fahrpläne verify-then-archive ins Archiv gebracht (je ein Opus-Verdikt NUR-MIT-NACHTRAG), 45
  Nachtrag-Einzeiler unter «Nachträge aus der Archiv-Welle 31.7.2026» ergänzt, `ARCHIV_BACKLOG`
  geleert. Methode bleibt für künftige Fälle: je Datei ein Opus-Verdikt, erst mappen, dann
  verschieben.
- **Stale Doku-Köpfe** (in der jeweiligen `FAHRPLAN-*.md` korrigieren):
  ~~POPUP «27»→218~~ **erledigt durch die Archivierung 31.7.2026** (Datei nach
  `archiv/FAHRPLAN-GESETZESTEXT-POPUP.md`, Kopf bleibt byte-genau historisch stehen); Nebenbefund:
  der Zielwert 218 war selbst überholt — `public/normtext/bund/` trägt am 31.7.2026 **227** Dateien,
  massgeblich ist ab hier der §11-Träger `bibliothek/normen/norm-vorschau-snapshot-system.md`.
  ~~VERTRAGS-VARIANTEN «1000»~~ · ~~LUECKEN~~ · ~~NOTARIAT-GRUNDBUCH~~ **erledigt durch die
  Archivierung 31.7.2026** (Dateien nach `archiv/`; die Köpfe bleiben dort byte-genau historisch
  stehen). Massgeblich sind ab hier die Nachfolge-Träger: `variantenInventar` (Stand 168 erzeugbare
  Dokumente = 17 %) für die Zähl-Wahrheit, `src/data/tarif/notariat-grundbuch.ts` +
  `bibliothek/kosten/notariat-grundbuch-kantone.md` für Notariat/Grundbuch (die überholten
  Kopf-Angaben — Handänderungssteuer-Kantonsliste ohne SZ/NW/OW-Korrektur, Datei-Pfade
  `notariat.ts`/`grundbuch.ts` — sind damit historisch), `src/data/tarif/beurkundung.ts` für die
  Lücken-Statusspalte.
- **Klein-Backlog** (Issue-Ebene): Direktklage Art. 8 ZPO < 100k plausibilisieren · stabile Keys in
  7 Listen-Editoren · Datepicker-Pfeiltasten · Markenschriften in Vorlagen-PDFs · Detailseiten-Titel an
  Katalog-Titel (§13) · CHF-Formatter `chf(n,dez)` als SSoT (nur mit Golden) · Norm-Chip-Kopien auf
  geteilten NormLink · Gründungs-Rahmen GmbH/AG teilen · 4× `MONATE`-Array → eine lib-Konstante ·
  GebV-SchKG: lokalen `staffel()`-Helfer (`gebvKosten.ts`) nur nach Charakterisierungs-Test der
  Bandgrenzen-Semantik aufs `tarif/staffel.ts`-Primitiv heben — bei Nicht-Deckung NICHT
  vereinheitlichen (§1 vor §6; `archiv/FAHRPLAN-PRODUKTAUSBAU-BURGGRABEN.md` §P4) ·
  **BGE-Metadaten-Asymmetrie** (OCL-Quelle, Befund Gegenprüfung 30.6.): bei manchen BGE
  `aktenzeichen`/`abteilung`/`titel` `null`, einzelne ohne `rubrum`/`dispositivOrders` (z. B.
  `151_V_30`) — Korpus-weit prüfen, ob aus `full_text`/`citation` nachziehbar (kein Inhalts-/
  Identitätsproblem, rein Metadaten; `[OF]`).

### Auftrags-Eingang 30.6.2026 (David) im Wortlaut (verschoben 31.7.2026)

*Aus `ROADMAP.md` hierher verschoben (QS-TOK-Nachdiät, 31.7.2026); massgebliche Fassung.*

> > **■ Auftrags-Eingang 30.6.2026 (David) — §14 gebündelt + verortet.** 13 Aufträge, alle `[OF]`
> > (reine Darstellung oder amtliche Daten, keine Davids-Fachzeit). **Risiko-Klassen getrennt halten**
> > (§14.2: reines UI ≠ Daten/Pipeline ≠ §1-nahe Verweis-Logik — nicht in EINEN Commit mischen). Daten-/
> > Verweis-Pfade ⇒ adversariale Gegenprüfung (`QS-GP`) + golden byte-gleich.
> >
> > **Bündel R · Reader-Lesesteuerung** und **Bündel N · Normtext-Fidelity/Verweise** → beide in
> > **Schritt 5b gebaut** (R ✅ 30.6. prod · N ✅ 1.7., inkl. Ursachen-Proben N1 Inline-Tag-Strip /
> > N2 ELI-Ziel-lesen-statt-raten). Wortlaut inkl. Befunde → `ROADMAP-CHRONIK.md` → Eingang-30.6. (22.7.2026).
> >
> > **Quell-Architektur-Entscheid (Council 30.6.2026):** Phase 0 = N1/N2 + Containment-Tor +
> > Status-Marker; HTML→AKN-XML = Phase 1, inkrementell, nie Big-Bang; M16 als `W2·5g-ZEIT`
> > getrackt. **Vollinhalt (verifiziert 24.7.2026, kein Info-Verlust): `FAHRPLAN-NORMTEXT-DARSTELLUNG.md
> > §Quell-Architektur-Entscheid`** + Memory `lexmetrik-akn-xml-architektur-entscheid`; abgelöster
> > ROADMAP-Wortlaut → `ROADMAP-CHRONIK.md` → Steuerungs-Prosa (24.7.2026).
> >
> > **Intake «Informations-Nutzung der Gesetze» (David 17.7.2026):** Lücken G-REF/G-HIST =
> > Extraktions-Risikopfad, **Bau-GO je Kandidat ausstehend (David)**. **Vollinhalt (verifiziert
> > 24.7.2026): `FAHRPLAN-NORMTEXT-DARSTELLUNG.md §Intake`** (G-SUCH → `FAHRPLAN-UI-NAVIGATION.md §7b`,
> > G-PRERENDER → `FAHRPLAN-SEO-A11Y-GOVERNANCE.md §11`); abgelöster Wortlaut → `ROADMAP-CHRONIK.md`
> > → Steuerungs-Prosa (24.7.2026).
> >
> > **Bündel B · Rechtsprechungs-Leser → Schritt 6 / W2·6-BGE:** B1 (BGE ohne «vollständiges Urteil»)
> > und B2 (Regeste wie amtlich) ✅ 5.7.2026 in `W2·6-B`, B3 (Sticky-Kopf überdeckt Body) ✅ 10.7.2026
> > via U-KOPF-Refactor `60988318` — alle drei erledigt. Detail: `ROADMAP-CHRONIK.md` →
> > Auftrags-Eingang 30.6.2026 / Bündel B (31.7.2026).
> >
> > **Bündel S · Split-View → Schritt 14** *(SPLIT-VIEW, eigener Worktree):*
> > - **S1 Breadcrumbs in der Pane:** `InhaltsKopf.tsx` Z.30 nutzt globalen Router-`<Link to>` → zielt
> >   aufs Hauptfenster statt in die autonome Pane. Fix über `PaneKontext`-Navigator.
> > - **S2 Tracker «alles schliessen» schliesst auch Panes:** Panes leben in `usePaneLayout`
> >   (localStorage `lexmetrik-panes`), separater Store von den Tabs → Close-all muss `usePaneLayout`
> >   mit-resetten. *(S1+S2 bündeln, gleiches Subsystem.)*
> >
> > **Einzeln:** I1 + I2 ✅ in W2·5c gebaut · Merker Startseite ✅ entparkt → W2·5c. Wortlaut →
> > `ROADMAP-CHRONIK.md` → Eingang-30.6. bzw. Steuerungs-Prosa (24.7.2026).

---


---

## Archivierte Abschnitte *(Plan-Neuschnitt 29.8.2026)*

15 Abschnitt(e) dieser Datei sind wörtlich nach
[`archiv/fahrplaene/FAHRPLAN-GESAMTAUFBAU.md`](../archiv/fahrplaene/FAHRPLAN-GESAMTAUFBAU.md) ausgelagert — sie tragen keine offene
ROADMAP-Bindung mehr. Titel:

- Kritik-Einarbeitung (Council-Runde 2.7.2026)
- Ist-Stand-Nachtrag (3.7.2026)
- Leitgedanke der Chronologie
- Phase 0 — Ordnung, Deploy-Fenster, Freigabe-Paket *(jetzt, Juli 2026, ~1–2 Wochen)*
- Phase 1 — Fundament: Currency → Vollständigkeit → E0 → E1 Generator-Flip *(Juli–Aug 2026)*
- Phase 2 — Senke füllen: Edge-Suche + BGer-Masse + Materialien *(Aug–Sep 2026)*
- Phase 3 — Darstellung + Verzahnung Bund: Zitat-Graph, Versionierung, XML *(Sep–Okt 2026)*
- Phase 4 — Kantone (Gesetze): Treue-Fixes → Breitenimport + Vendor-Sondierungs-Tor *(Okt–Nov 2026)*
- Phase 5 — Autonome Fortsetzung + Abnahme-Bereitstellung *(Dez 2026–Jan 2027)*
- Phase 6 — Abnahme-Welle 1 + Kanton-Rechtsprechung + VerwVO + Materialien-Vollausbau *(Feb–Mai 2027)*
- Phase 7 — Nordstern-Vollzug: Selbst-Hosting, Historie, Long-Tail *(ab Mitte 2027)*
- Übersichtstabelle
- Die 5 grössten Reihenfolge-Risiken
- Andockung an die bestehende ROADMAP (§14)
- §3 · ROADMAP-Spec-Nachzug `W3·10` (wörtlich verschoben 4.8.2026, ROADMAP-Diät Welle 3)
