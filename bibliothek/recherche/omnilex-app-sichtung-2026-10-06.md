# Omnilex-App-Sichtung 6.10.2026 — was brauchbar ist und wie wir es umsetzen

**Erstellt:** 6.10.2026 — Auftrag David 6.10.2026 («mit mehreren Agenten klären, was genau aus der Omnilex-Sichtung brauchbar ist und wie wir es implementieren; dann eintragen»). Fortschreibung des Vorgänger-Eintrags [omnilex-ai-und-kaggle-legal-ir-2026-07-16.md](../werkzeuge/omnilex-ai-und-kaggle-legal-ir-2026-07-16.md) (dort: GitHub-Org und Kaggle-Wettbewerb; hier: das Produkt selbst).
**Status:** ERSTRECHERCHE — einfach belegt (Sichtung + drei read-only-Bewerter, Stichproben der Belege durch die Synthese). Keine fachliche Abnahme; kein Code, keine Roadmap-Änderung durch diese Datei. Umsetzungspunkte in §6 sind Vorschläge.

**Pflegebedarf:** Omnilex-Zahlen sind datierte Selbstangaben; bei Wiedervorlage neu sichten (frühestens Q1/2027).

**Quellen (Abruf 6.10.2026):**
- Omnilex-App: <https://app.omnilex.ai> — Gratis-Testkonto, nur gelesen, keine Rechtsfrage gestellt ausser einer Beispielantwort; gesichtet: Korpus-Übersicht, Einstellungen, eine Antwort, Gesetzesansicht AVIG (Art. 23), Urteilsansicht 8C_766/2015 und BGE 150 V 235. Login-pflichtig, nicht öffentlich zitierbar; Inhalte nicht archiviert.
- Firma: <https://omnilex.ai/en/> (Selbstbeschreibung «AI workspace for legal professionals», siehe Vorgänger-Eintrag).
- Vergleichsgrösse amtlich: Fedlex <https://www.fedlex.admin.ch> (Art. 23 AVIG, SR 837.0) — nur als Massstab der Darstellung, kein Norm-Beleg in diesem Dossier.
- LexMetrik-Bestand: Repo-Stand `main` = 272057e43 (6.10.2026), Messbefehle je Zahl unten.

**Lesehinweis Zahlen.** Alle Omnilex-Zahlen sind **Selbstangaben aus deren Oberfläche am 6.10.2026**, nicht nachgeprüft. LexMetrik-Zahlen tragen ihren Messbefehl; massgeblich für ausgelieferte Zahlen bleibt `src/data/startseiteZaehler.generated.ts` (erzeugt von `npm run gen:zaehler`, Drift-Tor `check:zaehler`).

---

## §1 Anlass und Methode

1. **Sichtung** durch die Haupt-Session am 6.10.2026 im Gratis-Test (Lesen, Klicken, keine Uploads, keine Projekte), Ergebnis als Lernliste mit elf Ideen-Kandidaten E1–E11 (Arbeitsdatei der Session, nicht archiviert; Inhalt in §2–§5 aufgenommen).
2. **Drei Bewerter** (lex-recherche, read-only, je ein Feld): (1) Urteilsdarstellung, (2) Normtext und Rechner, (3) Quellen, Abdeckung, Doku. Die Session-Notizen der Bewerter sind nicht archiviert; ihre Datei:Zeile-Belege stehen in §5 und §6 dieser Datei.
3. **Synthese** (diese Datei): Urteil je Idee, Umsetzungsplan, Stichprobe je Idee mindestens eine Datei:Zeile im Repo nachgeprüft (§5 Spalte «Beleg»). Plan- und Gegenprüfungs-Durchgang folgen nach dieser Datei.

**Negativbefunde der Methode (S5):** keine Omnilex-API und kein Export gesichtet; die Antwortqualität der KI nur an einer Frage (Taggeld AVIG) gesehen — kein Urteil über Omnilex insgesamt.

---

## §2 Was Omnilex ist, und Quellen-Inventar

Schweizer KI-Recherche-Arbeitsplatz: LLM-Chat, der Antworten mit Belegen aus einem eigenen Korpus (Gesetze, Urteile, amtliche Dokumente, Literatur) versieht; dazu Gesetzes- und Urteilsansichten, Projekte/Upload. Für LexMetrik ist das **Gegenmodell** in der Antwortlogik (KI statt fester Regeln, CLAUDE.md §2) und ein **Vergleichsmassstab** bei Quellenbreite und Darstellung.

| Bereich | Omnilex (Selbstangabe 6.10.2026) |
|---|---|
| Gesetze | 22'317 gesamt; Bund 5'350 (davon ~3'200 Staatsverträge, ~350 Bundesgesetze, ~1'575 Verordnungen); alle 26 Kantone (266–2'005 je Kanton) |
| Urteile | 807'825 gesamt; BGer 178'196, BGE 35'440 (alle Jahrgänge), BVGer 89'743, BStGer 10'553, VPB 23'973 (bis 2016), EGMR 486, SIX 210; kantonal rund 470'000 (u. a. VD, GE, ZH inkl. Bezirksgerichte, TI, BE, BS). Kein BPatGer. |
| Amtliche Dokumente | 70'610; u. a. Parlamentsdienste 24'865, BBl 8'534, zahlreiche Bundesämter (BAG, BSV, ESTV, FINMA, EDÖB, WEKO, SECO, BJ …); kantonal rund 17'000 (davon ZH Amt für Raumentwicklung 13'708) |
| Literatur | 2'561 Open-Access-Texte (u. a. Onlinekommentar.ch, sui generis, ex/ante) und 66 eigene KI-Kommentare |
| Weitere Werkzeuge der KI | Handelsregister/Zefix, SHAB, SIMAP, Swissreg |

---

## §3 Quellenvergleich Omnilex ↔ LexMetrik

LexMetrik-Zahlen 6.10.2026, Messbefehle: Normtext `jq '[.erlasse[]|.ebene]|group_by(.)…' public/normtext/register.json` (bund 241, kanton 1'339) und `jq '[.erlasse[]|select(.ebene=="kanton")|.kanton]|group_by(.)…'`; Rechtsprechung `jq '[.entscheide[]|select(.verweis|not)|.gericht]|group_by(.)…' public/rechtsprechung/register.json`; Materialien `jq '[.materialien[]|.behoerdeKuerzel]|group_by(.)…' public/materialien/register.json`.

| Quelle | LexMetrik heute | Einordnung der Lücke | Fundstelle |
|---|---|---|---|
| Bundesrecht | Register Bund 241 (231 Volltext, 9 nur-live-link, 1 pdf-embed; `gesetzeBundVolltext` 231) | **geplant, Phase 1**: alle ~5'100 SR-Erlasse in Lieferungen à ≤ 500 | ROADMAP EINGANG «Bund vollständig» · `fahrplaene/FAHRPLAN-FEDLEX-PORTFOLIO.md` §21 |
| Kantonsrecht | 1'339 Erlasse in 26 Kantonen; breit nur BS 859, AR 266, ZH 111, übrige 23 Kantone 1–7 | **geplant, Phase 2** (LexFind/LexWork-Adapter); ruht bis Phase 1 gelandet | ROADMAP «Kantonstext — ruht bis Phase 2», Dach `W2·13-KANTONE-DATEN` |
| BGE | 1'340 Volltext (opencaselaw; Jahrgänge laut Sichtung 2019–2026, nicht nachgemessen) | Ausbau möglich, Budgetgrenze | ROADMAP EINGANG «Rechtsprechungs-Register bei 91 % des Daten-Budgets» |
| BGer (nicht amtlich publiziert) | 24 Volltext + 1'333 Verweis-Einträge auf BGE-Vollurteile | Massenkorpus **später**: Serving wartet auf VPS- und Incapsula-Entscheid David | `fahrplaene/FAHRPLAN-DATENHALTUNG.md` Z. 52; Merkzettel `2026-09-25-bger-nachzug-fehlt-im-wochenlauf-leitbild-frage-incapsula-by…` |
| BVGer · BStGer · BPatGer | je 20 Volltext | **später** (Daten-Budget) | wie BGE |
| Kantonale Gerichte | BS Appellationsgericht 3'011, BS Sozialversicherungsgericht 953, BS Zivilgericht 4; BE 24, ZH 24, GR 18, SG 14, AG 10 | Phase 2; Gerichtsnamen AG/SG/GR fehlerhaft → §5 E10 | Dach `QS-KORPUS` |
| EGMR | keine | **ungeklärt**: Lizenz HUDOC laut Bewerter 3 offen (nicht nachgeprüft); Phase 3 | `fahrplaene/FAHRPLAN-RECHTSPRECHUNG.md` Z. 181 (nur Datensatz-Abgleich) |
| VPB | keine | **verworfen**: Reihe eingestellt («TOT»), Archiv beim Bundesarchiv | `bibliothek/register/e6a-quell-inventar-2026-07-03.md` §9 |
| Materialien Gesetzgebung | 1'687 Einträge, alle nur-live-link: Botschaften 409, Vernehmlassungen 833, BS Grossrat 118 u. a.; Curia Vista und Entstehungsgeschichte separat (`public/materialien/curia`, `…/entstehung`) | gedeckt im Kern; Parlamentsdienste-Breite nicht Ziel | Materialien-Bot `materialien-nachzug` (#1336) |
| Bundesämter-Dokumente | ESTV 144, SECO 155, EDÖB 19, BSV 3, FINMA 2, IGE 2, EHRA 2 | Bot deckt SECO/EDÖB/ESTV; Reihenfolge laut Bewerter 3 BSV zuerst, FINMA zuletzt — erst nach der S-Zeile «Materialien-Bot verwirft ganzen Baum» | ROADMAP EINGANG S · 6.10. Materialien-Bot |
| Literatur, KI-Kommentare | keine | **verworfen**: Leitbild nur amtliche/urheberrechtsfreie Quellen (Art. 5 URG), keine Kommentare | CLAUDE.md Leitbild |
| Zefix | Live-Lookup in Vorlagen | gedeckt, soweit gebraucht | — |
| SHAB · SIMAP · Swissreg | keine | SHAB geparkt; SIMAP/Swissreg ungeprüft → **nein** (kein Rechtsanwender-Kern) | Bewerter 3; `fremdquellen-sichtung-2026-09-02.md` (SHAB live geprüft) |

**Kleinabweichungen zur Sichtungsnotiz (Messung Synthese):** ESTV 144 statt 145; «BJ 2» heisst im Register `EHRA` (2). Den lokalen BGer-Massenkorpus (`daten/masse.db`, 195'342) fand die Synthese im Haupt-Checkout nicht (`ls daten/`; `find .. -maxdepth 3 -name masse.db` leer) — die Zahl stammt aus `FAHRPLAN-DATENHALTUNG.md` Z. 52, nicht aus einer Messung am 6.10.

---

## §4 Darstellungsvergleich (Art. 23 AVIG, BGE 150 V 235)

**Wo LexMetrik vorne liegt:** Absatz-Gliederung mit eigener Randziffer für Abs. 2bis/3bis · Querverweise verlinkt · Gliederung/Inhaltsverzeichnis · Stand «gegen Fedlex geprüft am …» · Zitat/Permalink je Absatz und litera · Erlass-Blatt je Artikel (Entscheide, Änderungen, Materialien, Werkzeuge) · amtliche Regeste vorn · Erwägungs-Navigation · BGE-Seitenzahlen im Text · «Angewandte Normen».

**Omnilex-Schwächen = Negativmuster für uns (nicht nachahmen):**

| Muster bei Omnilex | Warum schädlich | Unsere Regel |
|---|---|---|
| KI-Regeste bei BGE **vorgewählt** (Umschalter «Amtlich / KI-generiert»), englische KI-Titel und -Zusammenfassung | Leser hält KI-Text für amtlich | §2, §8: nur amtlicher Text; nicht-amtliche Zusammenfassung stets als solche beschriftet (`src/pages/EntscheidLeser.tsx:557`: Label «Zusammenfassung», wenn `regesteAmtlich` fehlt) |
| Abs. 2bis/3bis in den Vorabsatz **verschmolzen**, Absätze als «1.»-Liste | Zitat «Abs. 2bis» nicht auffindbar, Struktur falsch | Phase-1-Merkmal «strukturgleich» |
| Platzhalter-Inkrafttreten **1.1.1900** (GE/NE/TI/JU) | Scheinbares Datum statt «unbekannt» | §8; Tor-Idee E10 |
| Sammelklasse «Übriges Gericht» (TI 56'909 von 57'152) | Zitat ohne entscheidendes Gericht | Gerichtsname amtlich (JETZT `URTEILE`) |
| Widersprüchliche Stand-Angaben | Leser weiss nicht, welche Fassung gilt | Stand + Live-Link (§7 Zitat-Ausnahme) |
| KI-Antwort zum Taggeld liess den Höchstbetrag (Art. 23 Abs. 1 AVIG) weg, obwohl die Norm zitiert war — laut Sichtung, ohne Norm-Gegenprüfung (kein Fedlex-Beleg in diesem Dossier) | Beleg ≠ korrekte Aussage | §1, §2: feste Regeln statt Schätzung |

---

## §5 Bewertung je Idee E1–E11

Urteile: **brauchbar** · **teilweise** · **schon vorhanden** · **nein**. Stichprobe = von der Synthese am 6.10. im Repo nachgelesen.

| Idee | Urteil | Begründung | Beleg (Stichprobe) |
|---|---|---|---|
| **E1** Ausgang-Label im Urteilskopf | **brauchbar, mit Vorbehalt** — wartet auf David (§8) | Daten liegen vor, werden im UI nicht gelesen. Prototyp-Messung Bewerter 1: labelbar BGE ~63 % (strikt ~25 %), BS ~56 % (strikt ~35 %) — **kein Skript-Artefakt im Repo, nicht reproduziert**. Fallen: Vereinigung in Ziff. 1, Nebenanträge (unentgeltliche Rechtspflege), FR/IT, «gutgeheissen und zurückgewiesen»; bei BGE gehören `dispositivOrders` zum unterliegenden BGer-Urteil. Nur fail-closed (Whitelist), sonst kein Label. | `src/lib/rechtsprechung/typen.ts:179` (`dispositivOrders: string[]`); kein Treffer in `src/components`/`src/pages` (grep); Dispositiv-Darstellung `src/components/rechtsprechung/EntscheidBody.tsx:173` |
| **E2** Zitat → Erwägung mit Markierung | **teilweise** | `?norm=`-Hervorhebung, Erwägungsanker und «Fundstelle kopieren» bestehen. Echte Lücke: Entscheid-Zitate im Fliesstext gehen extern auf bger.ch ohne Erwägungs-Sprung, auch wenn der Entscheid im Korpus liegt. Satz-Markierung `?hl=` optional, später. | `src/lib/bge.ts:47` und `:54` (externe bger.ch-URLs) |
| **E3** Normtext neben Rechner-Ergebnis | **teilweise** | Normverweise im Ergebnis und Popover/«daneben öffnen» existieren. Lücke nur eine Sammelzeile «Angewandte Normen (n) → daneben öffnen». Rechner liegen ausserhalb des Mandats Phase 1. | `src/components/ErgebnisAnzeige.tsx:258–262` (Block «Normverweise») |
| **E4** Verordnung ↔ Gesetzesgrundlage | **schon vorhanden** (Korrektur der Lernliste) | Gebaut (G23/M8): Feld `grundlage`, Anzeige unter der Artikelüberschrift; laut Bewerter 2 2'171 Einträge in 35 Erlassen (nicht nachgezählt). Delta: die Zeile ist noch nicht verlinkt. | `src/pages/gesetz-leser/parts/ArtikelLeser.tsx:392–396` |
| **E5** Feste Gliederung Rechner-Erläuterung | **teilweise** (Korrektur der Lernliste) | Layout steht: Hinweise/Vorbehalte, Rechenweg, Annahmen, Normverweise. **Zahlenbeispiel = nein**: ein festes Beispiel neben der echten Berechnung ist eine zweite Wahrheit (§5). Echte Lücke «nicht berücksichtigt» je Engine ist ein Rechtslogik-Audit (Risikopfad, gross) — nicht jetzt buchen, Kandidat für `W2·30-RL-*` nach `RECHTSLOGIK`. | `src/components/ErgebnisAnzeige.tsx:181` (Block «Hinweise / Vorbehalte»; :37 ist Kommentar, :71 die Kopierfunktion) |
| **E6** Erlass-Steckbrief | **teilweise** | Titelblatt zeigt Stand, «in Kraft seit», Status. Delta: Beschlussdatum, Sprachen — erst nach `GILTSEIT` (gleiche Datumsfelder). | `src/pages/gesetz-leser/parts/ErlassLeserKopf.tsx:185–186` |
| **E7** Öffentliche Abdeckungsseite | **teilweise** | `/abdeckung` existiert. Ausbau: Stand je Kanton und je Gericht, generierte Lückenzeile. **Kein «heute hinzugefügt»** — das Register kennt kein Aufnahmedatum. Zählregel vorher festlegen (bger: 1'357 Einträge, davon 1'333 Verweise, 24 Volltext). | `src/pages/Abdeckung.tsx` (vorhanden); Zählregel `scripts/gen-startseite-zaehler.ts:162` (`!e.verweis`) |
| **E8** Interner Link statt Fedlex | **schon geplant** (Korrektur der Lernliste) | Beobachtung der Sichtung war ungenau: Linksklick öffnet das In-Reader-Popover; nur Cmd-/Mittelklick und «Link kopieren» gehen auf Fedlex. Das ist HN-D1 (Go David 24.9.), nach HN-09. **Nichts neu buchen.** | ROADMAP EINGANG «R · Go David 24.9. · Verweise: 371 falsche Selbstlinks … (HN-D1 «ja unbedingt»)» |
| **E9** Quellen-Lücken | **teilweise / schon geplant** | Siehe §3: Bund und Kantone geplant (Phase 1/2), BGer-Masse wartet auf VPS-Entscheid, BVGer/BStGer budgetgebunden, VPB verworfen, EGMR ungeklärt, SHAB/SIMAP/Swissreg nein. Neu nur: Bundesämter-Reihenfolge im Materialien-Bot (BSV vor FINMA) — gehört in dessen Merkzettel, kein eigener Posten. | §3 |
| **E10** Prüftor gegen Platzhalter | **brauchbar** (zwei Teile) | (a) **Gerichtsname**: kein «Übriges Gericht», aber die Sammelcodes `ag_gerichte`/`sg_gerichte`/`gr_gerichte` setzen pauschal einen Namen für 42 Entscheide (AG 10, SG 14, GR 18); belegt falsch u. a. AG VBE.2024.399 (Versicherungsgericht) und HOR.2024.19 (Handelsgericht) («Obergericht AG»), GR alle 18 («Kantonsgericht GR» statt «Obergericht des Kantons Graubünden», datumsabhängig). Befund: 42 Entscheide mit Sammelnamen (jq, s. Beleg); der Rot-Beweis des künftigen Tors ist Teil von U1 (§6.7). (b) **Datum**: 0 Dateien mit `1900-01-01`; 8 Dateien mit `1970-01-01` — ob Platzhalter oder echtes Datum, ist **ungeklärt** (s. §6 U2). `check:stand-zukunft` prüft nur die Obergrenze. | `scripts/normtext/entscheide-mapping.ts:1172–1174`; Zählung `jq '[.entscheide[]|select(.gericht=="ag_gerichte" or …)]'`; `rg -l '"1970-01-01"' public/normtext public/rechtsprechung` (8); `scripts/normtext/check-stand-zukunft.ts` |
| **E11** Doku-Korrekturen | **brauchbar** | ROADMAP «238»: am 2.9.2026 zählte das **Bund-Register** 238 Einträge (227 snapshot + 9 nur-live-link + 2 pdf-embed), nicht 238 Pins — die «Differenz 7» ist damit erklärt; heute 231 Pins = 231 Dateien, Register 241. PROJEKTBESCHRIEB-Zahlen Stand ≤ 21.7.2026 und Widerspruch 195'342 vs 191'304; INDEX «610» historisch. Ersetzungen gehen mit dem PR, der diese Datei einträgt (§6 U9). | `git show d49b9e3d84:public/normtext/register.json \| jq` (238) und `git show d49b9e3d84:scripts/fedlex-cache.sh \| grep -cE …` (227); heute `grep -cE '^\s*"[a-z0-9_]+\|…' scripts/fedlex-cache.sh` (231) |

---

## §6 Umsetzungsplan der brauchbaren Punkte

Form: Ziel und Grenzen, nicht der Weg. Klasse nach `istRisikoPfad()` in `scripts/gegenpruefung/kern.ts`. Bündelung nach Skill `auftrag` Ziff. 3: verwandte Schritte zusammen, **nie** Risiko-Klassen mischen.

### U1 — Gerichtsname amtlich statt Sammelname (aus E10a)
- **Wirkungsbereich:** Gesetzes- & Urteilsdaten · **Klasse:** daten · **Gegenprüfung:** ja · **Aufwand:** S (Tor) + M (Behebung) · **Regel-2-Klasse:** R
- **Ziel:** Jeder ausgelieferte Entscheid trägt den amtlichen Namen des entscheidenden Gerichts, abgeleitet aus Aktenzeichen-Präfix bzw. PDF-Kopf, bei GR abhängig vom Entscheiddatum (Justizreform). Ein Tor wird rot, sobald ein Sammelcode ohne eindeutige Präfix-Zuordnung einen Namen erhält.
- **Grenzen:** Kein Raten — unbekanntes Präfix ⇒ Tor rot bzw. Eintrag zurückhalten, nie Default-Name. Gerichtsbezeichnung mit Norm + Link + Stand belegen (§7). Tor zuerst rot zeigen (Befund heute: 42 Entscheide mit Sammelnamen). Ein neues Tor (z. B. künftig `scripts/normtext/check-gerichtsname.ts`) braucht seinen Eintrag in `TOR_DATEIEN` (`scripts/gegenpruefung/kern.ts`).
- **Dateien:** `scripts/normtext/entscheide-mapping.ts:1172–1174`; Projektion `public/rechtsprechung/register.json` (regeneriert, nie von Hand); Tor künftig (Name offen).
- **Abhängigkeit/Bündel:** mit den Merkzetteln `2026-09-30-entscheide-mapping-ts-1174-gr-gerichte-kantonsgericht-gr` und `2026-09-25-zitierung-falscher-gerichtsname-gr-kantonsgericht-gr-statt-o` (Dach `QS-KORPUS`) in **einem** daten-PR; gehört zu JETZT 4 `URTEILE` («Gerichtsname amtlich»).
- **Offengelegter Widerspruch:** JETZT 4 sagt «Gegenprüfung nein (David 25.9.: Urteilsdaten noch kein Risikopfad)», aber `scripts/normtext/` ist nach `istRisikoPfad()` Risikopfad — das Tor `check:gegenpruefung` verlangt also ein Verdikt. Davids Entscheid betrifft `public/rechtsprechung/**`, nicht den Mapping-Code; der Bau holt das Verdikt ein (§8 Ziff. 2).

### U2 — Datums-Untergrenze und Platzhalter-Erkennung (aus E10b)
- **Wirkungsbereich:** Gesetzes- & Urteilsdaten · **Klasse:** daten · **Gegenprüfung:** ja · **Aufwand:** S · **Regel-2-Klasse:** offen bis zur Klärung (R, falls Platzhalter sichtbar als Datum erscheinen)
- **Ziel:** Datumsfelder (`stand`, `pdfStand`, `giltSeit`, `inkraftSeit`, `aufgehobenSeit`, `dateEntryInForce`, `datum`) enthalten keine Platzhalter (1900-01-01, Unix-Epoche 1970-01-01, ähnliche Sentinels), ausser ein Eintrag ist mit amtlichem Beleg ausdrücklich erlaubt.
- **Befund vor Bau (rg -l, 6.10.):** 8 Dateien mit `1970-01-01` — `public/normtext/kanton/BS-953.820.json` und `BS-953.860.json` (je 9× `stand`), `public/normtext/register.json` und `pdf-quellen.json` (je 2× `stand`/`pdfStand`), `public/normtext/historie/AHVG.json`, `historie/BETMG.json`, `revisionen/AHVG.json`, `revisionen/BETMG.json` (Inkrafttreten/Aufhebung). Bei den Bundesfällen kann 1.1.1970 ein echtes Inkrafttreten sein — **vor Bau gegen Fedlex/BS prüfen, nicht als Fehler vorab werten** (§7). «54 Daten vor 1848 (BS)» laut Bewerter 2, nicht nachgemessen.
- **Grenzen:** Rückbau vor Zubau (§17 Gegengewicht): `check:stand-zukunft` trägt dieselbe Sorge (Obergrenze) — dort die Untergrenze ergänzen statt ein neues Tor bauen. Aber: `check:stand-zukunft` deckt heute nur `stand` in `bund/` und `kanton/` (`scripts/normtext/check-stand-zukunft.ts:39`); die Untergrenze braucht eine erweiterte Wurzel- und Feldliste (`register.json`, `pdf-quellen.json`, `historie/`, `revisionen/`; Felder `pdfStand`, `aufgehobenSeit`, `dateEntryInForce`) — nur 2 der 8 Dateien mit 1970-Treffern (die beiden BS-Erlasse) liegen heute im Geltungsbereich. Rot-Beweis vor grün.
- **Dateien:** `scripts/normtext/check-stand-zukunft.ts`, `scripts/normtext/stand-zukunft.ts`; Behebung in der jeweiligen Extraktion (Risikopfad).
- **Bündel:** mit JETZT 1 `GILTSEIT` (gleiche Klasse daten, gleiche Sorge «Datum stimmt») als dessen Abschluss-Tor oder unmittelbar danach.

### U3 — Gesetzesgrundlage der Verordnung verlinken (Delta zu E4)
- **Wirkungsbereich:** Benutzeroberfläche · **Klasse:** bau (solange nur die bestehende Verweis-Auflösung aufgerufen wird; wird `src/lib/fedlex.ts` oder `src/lib/fedlex/` geändert ⇒ daten + Gegenprüfung) · **Gegenprüfung:** nein im Fall bau · **Aufwand:** S · **Regel-2-Klasse:** F
- **Ziel:** Die schon angezeigte Zeile «(Art. N XG)» unter der Verordnungs-Überschrift verhält sich wie jeder andere Normverweis im Leser (Popover, «daneben öffnen»).
- **Grenzen:** Gleiches Linkverhalten wie die übrigen Normverweise — kein Sonderweg. Ohne Ziel im Korpus wie heute bei anderen Verweisen.
- **Dateien:** `src/pages/gesetz-leser/parts/ArtikelLeser.tsx:392–396`.
- **Abhängigkeit:** nach HN-09 (371 falsche Selbstlinks und Verweisziele), zusammen mit oder nach HN-D1 (Normverweis öffnet eigenen Leser). Phase 1 (Leser am Bund).

### U4 — Erlass-Steckbrief: Beschlussdatum und Sprachen (Delta zu E6)
- **Wirkungsbereich:** Gesetzes- & Urteilsdaten (Feld) + Benutzeroberfläche (Anzeige) · **Klasse:** zwei PRs — Datenfeld daten (falls neue Extraktion in `scripts/normtext/`), Anzeige bau · **Gegenprüfung:** ja für den Daten-PR · **Aufwand:** M · **Regel-2-Klasse:** F
- **Ziel:** Kopf des Erlasses nennt zusätzlich das Beschlussdatum und die verfügbaren Amtssprachen, beides amtlich aus Fedlex.
- **Grenzen:** Nur Felder, die Fedlex amtlich führt; fehlt eines, wird es weggelassen, nie geschätzt (§8). Vor Bau prüfen, ob das Feld schon im Snapshot liegt.
- **Dateien:** `src/pages/gesetz-leser/parts/ErlassLeserKopf.tsx:185–186`; Extraktion künftig.
- **Abhängigkeit:** nach `GILTSEIT` (dieselben Datumsfelder). Phase 1.

### U5 — Entscheid-Zitate im Text intern öffnen (aus E2)
- **Wirkungsbereich:** Benutzeroberfläche · **Klasse:** bau · **Gegenprüfung:** nein (kein Risikopfad), Stichprobe der Linkziele empfohlen · **Aufwand:** S–M · **Regel-2-Klasse:** F
- **Ziel:** Ein Entscheid-Zitat im Fliesstext (BGE …, 4A_…/2020, mit «E. x») öffnet den Entscheid im eigenen Leser an der Erwägung, wenn er im Korpus liegt; sonst wie heute extern.
- **Grenzen:** Erwägungs-Sprung nur, wenn der Anker existiert; mehrdeutiger Schlüssel ⇒ externer Link wie heute. Satz-Markierung (`?hl=`) nicht in diesem Schritt.
- **Dateien:** `src/lib/bge.ts:47`, `:54`; Aufrufer von `RechtsprechungLink` (`src/components/NormText.tsx`, `src/components/ErgebnisAnzeige.tsx`, `src/components/KantonNormText.tsx`).
- **Abhängigkeit:** keine harte; sinnvoll nach JETZT 4 `URTEILE` (Phantomzitate weg). Liegt im Mandat nur soweit Urteilsdaten (JETZT 4) — sonst nach Phase 1.

### U6 — Ausgang des Urteils als Kopf-Label (aus E1) — wartet auf David
- **Wirkungsbereich:** Benutzeroberfläche · **Klasse:** bau · **Gegenprüfung:** ja (freiwillig, Rechtsaussage; das Tor erzwingt sie nicht) · **Aufwand:** M · **Regel-2-Klasse:** I
- **Ziel:** Kopf zeigt «gutgeheissen / teilweise gutgeheissen / abgewiesen / nicht eingetreten / Rückweisung» mit Quellenhinweis «Dispositiv Ziff. 1» — nur wenn eindeutig.
- **Grenzen:** reine Funktion (künftig `src/lib/rechtsprechung/ausgang.ts`), deterministisch aus dem Dispositiv (§2); fail-closed per Whitelist, sonst kein Label; bei BGE kein Label aus dem Dispositiv des unterliegenden BGer-Urteils, solange das nicht gekennzeichnet ist; DE zuerst, FR/IT erst mit eigener Whitelist; kein Label, wenn `quarantaene` gesetzt ist (`src/lib/rechtsprechung/typen.ts:193`) oder der Snapshot nur das Dispositiv trägt (FB U-09/U-04).
- **Dateien:** `src/lib/rechtsprechung/typen.ts:179`, `src/components/rechtsprechung/EntscheidBody.tsx:173`.
- **Abhängigkeit:** Entscheid David (§8 unten); Abdeckung vorher mit einem Skript im Repo messen (Bewerter-Prozente sind nicht reproduzierbar abgelegt).

### U7 — Abdeckungsseite mit Stand je Kanton und Gericht (aus E7)
- **Wirkungsbereich:** Benutzeroberfläche · **Klasse:** bau · **Gegenprüfung:** nein · **Aufwand:** S–M · **Regel-2-Klasse:** I
- **Ziel:** `/abdeckung` zeigt Tabellen Stand je Kanton und je Gericht sowie eine generierte Zeile «was fehlt» (§8 ehrliche Lücken); alle Zahlen aus `gen:zaehler`.
- **Grenzen:** keine Handzahl in der Seite (§5); kein «heute hinzugefügt» ohne Aufnahmedatum im Register; Zählregel Volltext vs. Verweis vorher festlegen.
- **Dateien:** `src/pages/Abdeckung.tsx`, `scripts/gen-startseite-zaehler.ts`, `src/data/startseiteZaehler.generated.ts`.
- **Abhängigkeit:** keine; passt als Fortschrittsanzeige zu den Bund-Lieferungen à ≤ 500 Erlasse, Bau aber nicht vor den R-Posten.

### U8 — Rechner: «Angewandte Normen → daneben öffnen» (aus E3)
- **Wirkungsbereich:** Benutzeroberfläche · **Klasse:** bau · **Gegenprüfung:** nein · **Aufwand:** S–M · **Regel-2-Klasse:** I
- **Ziel:** Unter dem Rechner-Ergebnis eine Sammelzeile, die alle angewandten Normen im Wortlaut neben dem Ergebnis öffnet (bestehendes «daneben öffnen»).
- **Grenzen:** Normliste aus dem Ergebnis der Engine, keine zweite Liste (§5).
- **Dateien:** `src/components/ErgebnisAnzeige.tsx:258–262`.
- **Abhängigkeit:** nach Phase 1 (Rechner ausserhalb des Mandats; «Nicht jetzt: Design-Feinschliff»).

### U9 — Doku-Korrekturen (E11)
Mechanisch, unter 30 Zeilen ⇒ Haupt-Session direkt (Weisung 15.9.2026 Delegations-Untergrenze). Die Ersetzungen (ROADMAP Messtabelle, PROJEKTBESCHRIEB Z. 148/152/233/236, Haupt-INDEX Z. 97) gehen mit dem PR, der diese Datei einträgt; datierte Angaben werden ergänzt, nicht überschrieben (Dispatch-§0 Ziff. 2b).

### Reihenfolge-Vorschlag (Regel 2 S > R > N > F, Mandat «Bund zuerst»)

| Platz | Punkt | Bündel | Warum hier |
|---|---|---|---|
| 1 | U9 Doku | — | sofort, mit dem Eintrage-PR dieser Datei |
| 2 | U1 Gerichtsname | daten-PR mit den zwei GR-Merkzetteln, in JETZT 4 `URTEILE` | R, Befund 42 Entscheide, läuft schon im Mandat |
| 3 | U2 Datums-Untergrenze | mit/nach JETZT 1 `GILTSEIT` (daten) | Phase 1, gleiche Sorge |
| 4 | U3 Grundlage verlinken | nach HN-09, mit HN-D1 (bau-Teil getrennt vom daten-Teil HN-09) | Phase 1, klein |
| 5 | U4 Steckbrief | nach `GILTSEIT`; daten- und bau-PR getrennt | Phase 1 |
| 6 | U5 Entscheid-Zitate intern | nach `URTEILE` | F |
| 7 | U7 Abdeckung | eigener bau-PR | I |
| 8 | U6 Ausgang-Label | nach Entscheid David, zusammen mit U5 nur wenn beide bau | I, wartet |
| 9 | U8 Rechner-Sammelzeile | nach Phase 1 | I |

---

## §7 Bewusst nicht übernehmen

| Omnilex-Funktion | Grund |
|---|---|
| KI-Chat, KI-Antworten | §2 Determinismus — feste Regeln, keine Schätzung |
| KI-Regesten, KI-Kommentare, KI-Zusammenfassungen, englische KI-Titel | §2, §8; Gefahr der Verwechslung mit amtlichem Text (Negativmuster §4) |
| Literatur und Kommentare | Leitbild: nur amtliche/urheberrechtsfreie Quellen (Art. 5 URG) |
| Upload, Projekte, Akten | Leitbild «Werkzeuge zustandslos» |
| Zahlenbeispiel in Rechner-Erläuterungen (E5) | zweite Wahrheit neben der echten Berechnung (§5) |
| «heute hinzugefügt» auf der Abdeckungsseite | kein Aufnahmedatum im Register; Zahl wäre geschätzt |
| VPB als Quelle | Reihe eingestellt (`e6a-quell-inventar-2026-07-03.md` §9) |
| SIMAP, Swissreg | kein Kern der Rechtsanwendung; ungeprüft, kein Bedarf gemeldet |

---

## §8 Offene Punkte — wartet auf David

1. **Ausgang-Label (U6):** Soll ein Label erscheinen, wenn es nur bei rund 56–63 % der Entscheide eindeutig ableitbar ist (strikt 25–35 %)? Optionen: (a) ja, nur wo eindeutig, sonst kein Label; (b) nein, der Ausgang bleibt im Dispositiv; (c) erst nach einer Messung im Repo entscheiden. Empfehlung Synthese: (c), dann (a) — ein Label, das bei jedem zweiten Entscheid fehlt, wirkt sonst wie ein Fehler.
2. **David informieren (kein Entscheid nötig):** sein Entscheid 25.9. (Urteilsdaten kein Risikopfad) betrifft `public/rechtsprechung/**`; ein Mapping-Edit unter `scripts/normtext/entscheide-mapping.ts` ist laut `istRisikoPfad()` trotzdem Risikopfad und braucht ein Verdikt (betrifft U1).

**Nicht offen (schon entschieden, nicht erneut fragen):** HN-D1 (Go 24.9.), Kantone erst Phase 2 (Mandat 14.9.), VPS/BGer-Masse (Merkzettel mit Davids Frage, ruhend).
