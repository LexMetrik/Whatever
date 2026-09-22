# Legal Design, Wizard-Korrektheit und rechtliche Bereitschaft — Recherche-Session 21./22.9.2026

**Erstellt:** 21./22.9.2026. Anlass: David schickt `https://lawbydesign.co/` mit der Auflage «nur
recherchieren, viele Sessions laufen» (21.9.2026) und später «diese session soll nur planen und
roadmap nichts bauen oder vorschlagen zu bauen» (22.9.2026). Elf read-only-Unteragenten
(`lex-recherche`/`lex-pruefung`, Sonnet und Opus) über zwei Tage; **kein Code berührt**, alle
Mess-Skripte lagen im flüchtigen Session-Scratchpad und sind nicht mehr vorhanden.
Ablage-Freigabe David 22.9.2026: «ok du darfst alles ablegen».

**Status:** **ERSTRECHERCHE, keine fachliche Abnahme.** Die Rechts- und Lizenz-Einordnungen sind
Einschätzungen, keine Rechtsauskunft. Der Verifikationsstand ist je Fund einzeln vermerkt: *selbst
gelesen* (Code-Stelle oder amtliche Quelle im Volltext geprüft) · *per Skript bewiesen* (Ablauf
im Scratchpad reproduziert, Skript nicht erhalten) · *Stichprobe* · *nicht verifiziert*.
Die §7-Abnahmen (SF-F1, SF-F2, Verjährungsrevision 2020, BS-Lizenz, TERMDAT) bleiben offen —
nicht drängen.

**Quellen (Abruf jeweils 21. oder 22.9.2026):**
- `lawbydesign.co` Kap. 3.1 (Ausgangspunkt, © ohne freie Lizenz — nur Ideen, kein Text übernommen).
- `contract-design.worldcc.foundation` (WorldCC Contract Design Pattern Library, © ohne CC).
- `design-system.service.gov.uk` (GOV.UK Design System, OGL v3.0); `ech.ch` eCH-0059 v3.
- GitHub per `gh repo view`: `digitalservicebund/a2j-rechtsantragstelle`, `alphagov/govuk-frontend`,
  `swiss/designsystem`, `jhpyle/docassemble`, `SuffolkLITLab/*`, `CatalaLang/catala`,
  `accordproject/template-archive`, `digitalservicebund/ris-ui`, `jonashertner/opencaselaw`.
- `search.bger.ch` / `entscheidsuche.ch` (bger.ch selbst durchgehend HTTP 503) für die BGE/BGer-Belege.
- `ws.parlament.ch/odata.svc` (`$metadata`, `Preconsultation`, `Business`) und parlament.ch
  «Open Data / Web Services».
- `data.bs.ch` (Datensätze 100311/100313/100354/100355), `opendata.swiss`,
  `gesetzessammlung.bs.ch` (`/api/texts_of_law/`, `/api/de/settings`, `robots.txt`),
  Fedlex SR 231.1 (URG), SG BS 151.200/151.210/153.260.
- LexMetrik-Bestand, main-Stand 21./22.9.2026 (Basis u. a. `7adcc0b28`) — alle `datei:zeile`-Angaben
  unten beziehen sich auf diesen Stand.

---

## 0. Ergebnis in sechs Sätzen

Der Abgleich mit dem Legal-Design-Feld brachte wenig Neues — das DESIGN-REGLEMENT deckt die
tragenden Regeln bereits, teils schärfer; die echten Funde entstanden beim Nachmessen der eigenen
Formulare. Dort liegen **vier rechtlich relevante Orte**, an denen ein Feldwert aus einem
verlassenen Zweig in ein Dokument oder eine Berechnung gelangt (Patientenverfügung, Mietvertrag,
Schlichtungsgesuch BS, Mietrecht-Rechner), dazu fünf Stellen, an denen ein Nutzer feststeckt, und
zwei irreführende Warnungen. Die gemeinsame Wurzel ist, dass Feld-*Sichtbarkeit* in der Seite lebt
und Feld-*Verwendung* in Schema, Mapping und Gate — die Verknüpfung ist nirgends deklariert,
weshalb kein Test sie prüfen kann. Ein fünfter §1-Ort kam über die BGE-Recherche dazu: die
Verjährungsrevision 2020 ist in der Engine gar nicht abgebildet und erzeugt messbar falsche
Verdikte, im Personenschadenfall ohne jede Warnung. Ausserhalb der Rechtslogik sind die Befunde
Vorbereitung, nicht Dringlichkeit: barrierefreie Exporte, Verzahnung Rechner→Vorlage, Texte vor
einem Live-Gang. David hat am 22.9.2026 zehn offene Fragen entschieden (Ziff. 20) — darunter
Curia-Variante C und «einreihen, nicht vorziehen» für die Geistereinträge.

---

## 1. Legal Design ↔ DESIGN-REGLEMENT (Abgleich lawbydesign Kap. 3.1)

*Verifikation: selbst gelesen, alle Fundstellen im Repo geprüft (Opus).*

**Bereits gedeckt, teils schärfer:** zwei Schriften (`DESIGN-REGLEMENT.md:250`), Hierarchie,
«Verdikt zuerst» (B1, `:869`), Raster (F1, `:339`), kein ALL-CAPS (A2, `:63`, fünf weitere
Aufrufer), Farbe sparsam (F0.2, Tor `check:farbwelt`).

**Bewusst abweichend (keine Lücke):** Weissraum — F1 setzt auf Dichte für Fachnutzer;
Schriftgrösse 12–16 pt in PDF/DOCX — Ist ist 10.5 pt (`formatvorlagen.ts:57`) bzw. Arial 11 pt
(`vorlagenDocx.ts:259`), das ist CH-Usanz und Golden-geschützt.

**Fünf Kandidaten für eine Reglement-Ergänzung** (bewusst nicht gebucht, Ziff. 21):
1. Zeilenlänge: «~66 ch» steht nur in `DESIGN-REGLEMENT-RECHTSPRECHUNG.md:94`; `max-w-reading`
   = 40rem (`tailwind.config.js:298`) ergibt **geschätzt** 71–80 Zeichen — Zahl gerendert
   nachmessen, dann ins Dach §B2. Kein Golden-Risiko.
2. Mindestschriftgrösse Web als Satz **plus** Tor: der `fontSize:'10px'`-Ausreisser ist in
   `DESIGN-REGLEMENT.md:809` dokumentiert und unterläuft die Stufe `micro` (11 px).
3. Nachher-Checkliste (Hierarchie · Nutzerziel · Ausrichtung · Weissraum) bei
   `DESIGN-REGLEMENT-VORLAGEN.md:136` — in eigenen Worten, die Quelle trägt keinen Lizenzvermerk.
4. «Fett sparsam» als Halbsatz in A2.
5. PDF/DOCX-Zeilenlänge (~81–86 Zeichen, geschätzt) als **bewusste** Abweichung in VORLAGEN V4
   dokumentieren — Ränder nie ändern (`golden:vergleich`).

---

## 2. Das Feld «Legal Design» (Umfeld-Sichtung)

*Verifikation: Stichprobe (Sonnet); die als «nicht verifiziert» markierten Punkte sind es auch.*

Nützlich und lizenzrechtlich brauchbar: **GOV.UK Design System Patterns** (OGL v3.0),
**eCH-0059 v3** (WCAG 2.1 AA + PDF/UA, gilt für die Verwaltung), **ISO 24495-1** (Plain Language,
kostenpflichtig). Die **WorldCC Contract Design Pattern Library** ist © ohne CC-Lizenz — nur als
Ideenquelle, nie Text oder Grafik übernehmen.

Ideen daraus: Schichtung Kurzfassung→Volltext · Zeitstrahl bei Fristen · Klausel-Kurzerklärungen ·
«check your answers»-Seite vor dem Absenden.

**Nicht verifiziert (nicht zitieren):** die Passera-Studie mit 124 Teilnehmenden — die angegebene
Tandfonline-URL antwortet mit HTTP 403 und die Journal-Zuordnung ist zweifelhaft; die URL des
Gesetzgebungsleitfadens (fedpol-Pfad vermutlich falsch, gehört zum BJ); die DaPIS-Lizenz.

**Schweiz:** kein eigenes Legal-Design-Feld belegbar; einziger Fund ist ein CAS-Baustein der ZHAW.

---

## 3. GitHub-Sichtung «Legal Design»

*Verifikation: `gh repo view` je Repo, 21.9.2026.*

Das Etikett «Legal Design» ist leer. Brauchbar unter anderen Etiketten:

| Repo | Lizenz | Einordnung |
|---|---|---|
| `digitalservicebund/a2j-rechtsantragstelle` | MIT, TypeScript, aktiv | nächstes Wizard-Vorbild (Ziff. 4) |
| `alphagov/govuk-frontend` | MIT | Muster-Fundus |
| `swiss/designsystem` | Bund, Vue, eigene Lizenz | Referenz Amtlich-Schweiz |
| `jhpyle/docassemble`, `SuffolkLITLab/*` | MIT, Python | Interview-Muster |
| `CatalaLang/catala` | Apache-2.0 | Rules-as-Code (vertieft in `recherche/rules-as-code-sichtung-2026-09-05.md`) |
| `accordproject/template-archive` | Apache-2.0 | Vertragsvorlagen-Format |
| `digitalservicebund/ris-ui` | **GPL-3.0** | **kein Code übernehmen** |
| `jonashertner/opencaselaw` | Code MIT / Daten CC0 laut Repo | CH-Urteile; Texte trotzdem von der Amtsquelle (Vault-Eintrag «Lizenz gescrapter Amtsdaten») |

Lizenz unklar und deshalb nicht verwendbar: Bonterms-Repos, `commonform/commonform.org`
(inaktiv seit 2022).

---

## 4. `a2j-rechtsantragstelle` ↔ LexMetrik-Wizard

*Verifikation: selbst gelesen (Opus, read-only, Klon im Scratchpad); der Live-Dienst wurde
**nicht** aufgerufen.*

**a2j:** React-Router-Server-App, Redis-Sitzung, Strapi-CMS, XState-Flow plus Zod je Seite
(`pages.ts`/`xstateConfig.ts`), pdf-lib/pdfkit, KERN-UX. Bemerkenswert: ein **Pruner** (ADR 0014)
löscht Antworten, die durch einen Weichenwechsel unerreichbar geworden sind; Flow-Tests laufen
über alle Zustände (`allStepsFromMachine`); axe läuft über **alle** Flow-URLs.

**LexMetrik ist an fünf Stellen belegbar stärker:** Live-Vorschau mit Bausteinprotokoll samt Norm
(`engine.ts:45-48`) · ein Assemble für PDF/DOCX/Text (`vorlagen.export.test.ts:9-27`) ·
Formvorschrift im Schema (`engine.ts:36`) · kein Eingabefehler vor der ersten Eingabe
(`wizard.tsx:77-83`) · nichts verlässt das Gerät (`useWizardState.ts:22-57`, mit den Ausnahmen
aus Ziff. 15).

**Fünf Kandidaten** (Nr. 1 wurde nachgemessen und ist Ziff. 5):
1. Verwaiste Antworten — `useWizardState.ts:52` `set()` überschreibt nur, **kein** Bereinigen nach
   Weichen-Wechsel gefunden. → nachgemessen, siehe Ziff. 5/6.
2. Pfadüberdeckungs-Test je Vorlage (jede `includeIf`-Kante einmal wahr und einmal falsch) — klein,
   Risiko null, §6.7-tauglich.
3. axe über **alle** Vorlagen-Routen aus `registry.ts` statt Stichprobe (`e2e/a11y.e2e.ts:200,388`)
   — klein. *(Teilweise überholt: Ziff. 10 zeigt, dass axe über alle prerenderten Routen bereits
   läuft; offen bleiben die Wizard-Zwischenzustände.)*
4. Schritt-Sichtbarkeit als Daten statt `switch` (`VorlageKuendigungArbeitgeber.tsx:25,114`) —
   mittel, §3 beachten.
5. Benanntes Array-Muster (Übersicht → Eintrag → zurück) — mittel.

**Nicht übernehmen:** Server-Sitzung, CMS, Login, eine-Frage-pro-Seite, Sackgassen-Seiten.

---

## 5. Geistereinträge in den Vorlagen — Nachmessung (Vorlagen-Seite)

*Verifikation: **per Skript bewiesen** (zwei `lex-pruefung`-Runden Opus; die beiden Hauptbefunde
zusätzlich von Fable per Code-Lektüre gegengelesen). Die Skripte lagen im Session-Scratchpad und
sind flüchtig — die Fundstellen unten sind der bleibende Beleg.*

**Befund zur Mechanik:** Es gibt keinerlei Bereinigungslogik. `useWizardState.ts:52` `set()` setzt
genau ein Feld; `normalisieren` repariert beim Hydrieren nur Typen; der Schutz liegt rein
konventionell in den `…Zusammenstellen()`-Funktionen. **Wurzel:** Feld-Sichtbarkeit lebt in der
Seite, Feld-Verwendung in Schema, Mapping und Gate — die Verknüpfung ist nirgends deklariert.

**Rechtlich relevant (Vorlagen):**

1. **Patientenverfügung** — `patientenverfuegung.ts:281` (P07b) und `:290` (P07c) hängen nur an
   `nichtLeer` des eigenen Feldes, **nicht** an `vertretungName` (P07, `:273`). Folge: Weisungen
   und Ersatzperson erscheinen im Dokument, ohne dass eine Vertretungsperson bezeichnet ist
   (Art. 370 ZGB). Die Felder sind in der Seite nur bei gesetztem `vertretungName` sichtbar
   (`VorlagePatientenverfuegung.tsx:198`).
2. **Mietvertrag** — `mietvertrag.ts:564` (`staffelListe`) ohne Modell-Guard; `M05b_staffelliste`
   (`:450`, Bedingung `nichtLeer`) erscheint deshalb auch bei `mietzinsModell='index'`. Folge:
   eine Mischklausel, die der Baustein `:441` selbst als unzulässig bezeichnet
   (Art. 269b/269c OR).
3. **Schlichtungsgesuch BS** — `schlichtungsgesuchBs.ts:457` (Rechtsöffnungs-Begehren) und `:463`
   (unbezifferte Forderung) **ohne** Typ-Guard, während `:451` ihn hat; dazu `:165` (sgStreitwert)
   und `:341` (Hinweis Art. 85). Ablauf: Geldforderung mit Betreibung erfassen → Typ auf
   `miete_pacht`/`gleichstellung_glg`/`uebrige` wechseln (Geld- und Betreibungsblock werden
   unsichtbar, Seite `:325`/`:352`) → das Gesuch enthält «Rechtsvorschlag zu beseitigen», der
   Streitwert rechnet mit der alten Zahl, `sgMaengel` ist leer → Export frei. Kein `speicherKey`,
   der Zustand überlebt keinen Reload — wirkt aber in der Sitzung sofort.

**Nutzer steckt fest (5 Orte):**
- Mietvertrag `mietvertrag.ts:318` — Konkurrenzschutz-Blocker ohne `!wohnung`.
- Handelsreisendenvertrag `handelsreisendenvertrag.ts:100/101` — Delkredere-Blocker ohne
  `NUR_EXPERTE`.
- Schlichtungsgesuch BS `:297` + Seite `:389` — Checkbox `disabled` bei `checked`
  (Rechtsöffnung nach Abwahl des Rechtsvorschlags).
- Schlichtungsgesuch BS `:312` + Seite `:473` — `antragEntscheid` bleibt gesetzt, wenn der Betrag
  über 2000 steigt.
- Klage ordentlich `klageOrdentlich.ts:185` — ohne `!a.klagebewilligungVorhanden`; die
  Nachbarstellen `:322`/`:357` haben den Guard.

**Gemeinsame Wurzel dieser fünf:** «disabled oder ausgeblendet bei gesetztem Wert» — ein
deaktiviertes Bedienelement darf keinen Wert festhalten, der ein Tor sperrt.

**Irreführende Warnungen (2):** Vollmacht `vollmacht.ts:162,168,174,181` (`bereiche[]` ohne
Typ-Guard) · Testament `testament.ts:84` (Scheidungs-Warnung ohne `zivilstand`-Guard).

**Vorbilder, die es richtig machen:** `kuendigungArbeitgeber.ts:76-79`,
`kuendigungArbeitnehmer.ts:71-73`, Seite Schlichtungsgesuch `:366` (`set('geld', undefined)`).

**Abdeckung (ehrlich):** Das Register führt 32 Vorlagen (`src/lib/vorlagen/registry.ts`, 29 einzeln
+ 3 Mappen). Vollständig von Hand geprüft: die 29 Einzel-Vorlagen, dazu Detailgrad-Querschnitt und
Export-Dateinamen. AG-Gründungsmappe vollständig (14 Weichen + 6 Randweichen + Fuzz über 3000
Zustände, **0 Lecks**); GmbH vollständig für die erreichbaren Zweige; Kapitalerhöhung nur
gemustert (nur 3 erreichbare Weichen). **Nicht geprüft:** PDF- und DOCX-Renderer selbst,
Browser-Hydration.

**Gegenbefund Gründungsmappen — NICHT bestätigt:** jede Lesestelle wiederholt dort die Weiche
(Vorbild `gruendungAgDokumente.ts:43-46` und `:394-395`, Gates `:37-41`). Nebenbefund reine UX
(kein Geist): `kapitalKern.ts:82` — die individuelle Liberierung schlägt den globalen Wert ohne
Hinweis, das Label sagt es allerdings (`schritte-eingabe.personen.tsx:47-50`).

**Lösungsrichtungen** (nicht gebaut, Entscheid offen): (a) Bereinigung im Zustand — erzeugt
Datenverlust beim Hin-und-Her; (b) **Maskierung unsichtbarer Felder vor `assemble()` und vor den
Gates** als reine Funktion, plus ein Tor «Seiten-Bedingung ≤ Baustein-/Gate-Bedingung»
(Empfehlung des prüfenden Agenten). Klasse Rechtslogik → Dispatch plus Gegenprüfung, Golden:
sauber erfasste Fälle bleiben byte-gleich, nur die Geisterfälle ändern sich — das ist eine
deklarierte fachliche Änderung mit eigenen Tests. Ein Sofort-Flick wäre je Baustein ein
`and`-Guard (zwei Stellen je Ort); der Wurzel-Fix bleibt davon getrennt (§17).

---

## 6. Geistereinträge in den Rechnern — Nachmessung (Runde 3)

*Verifikation: **per Skript bewiesen** (`lex-pruefung` Opus); die Mietrecht-Stelle von Fable
gegengelesen. Skripte flüchtig.*

**Zustandsmechanik:** je Form ein eigener `useState`, kein `localStorage`. **Aber** der Permalink
macht verwaiste Werte reload- und teilfest: Mount-Lesen in `src/hooks/usePermalinkFelder.ts`,
laufendes Zurückschreiben über `LinkTeilenButton.tsx:31-34` → `src/lib/liveUrlSync.ts:33`. Keine
zentrale Bereinigung; der Schutz liegt im Mapping Seite→Engine.

**Rechtlich relevant (Mietrecht-Rechner, 2 Stellen):**
- `MietrechtForm.tsx:122` — `vereinbarteFristMonate` **ohne** Guard, das Feld ist nur bei `:241`
  (`art==='ordentlich' && istRaum`) sichtbar → `mietrecht.ts:266-274`. Ablauf: Wohnräume wählen,
  Frist 6 eingeben → Objekt auf «Unbewegliche Sache» wechseln → Mietende **31.03.2026 statt
  30.09.2025**, spätester Zugang **30.09.2025 statt 30.06.2025**. Die Annahmen-Zeile nennt die
  Vereinbarung, der Fehler ist also bemerkbar; der Link trägt `fm=6` (`:159`).
- `MietrechtForm.tsx:118/119` — `terminQuelle`/`vertragsTermineMonate` ohne
  `objekt!=='moebliertes_zimmer'`-Guard (Select nur `:205`) → `mietrecht.ts:303`:
  **30.09.2025 statt 14.07.2025** (Art. 266e OR).

**Kosmetisch oder latent (kein falsches Ergebnis):** Verjährung Link/ICS
`VerjaehrungForm.tsx:341-349` — das Engine-Mapping `:144/147` filtert korrekt; ZPO
`gerichtshinweisStillstand` roh, Engine `zpoFristen.ts:99` neutralisiert; SchKG-Hemmung nur über
einen von Hand editierten Link erreichbar.

**Vorbilder:** `useZustaendigkeitForm.ts:245-270`, `BgerRechtswegForm.tsx:104-122`,
`ProzesskostenForm.tsx:127-132`; doppelt gesichert `kuendigungsfrist.ts:196`.

**Abdeckung:** 16 Rechner vollständig, 6 gemustert (Beurkundung/Grundbucheintrag:
`geschaeftswertCHF` bei `!wertNoetig` roh — **nicht verifiziert**). **Nicht geprüft:**
`StrafZustaendigkeitTeil.tsx`, `SchkgZustaendigkeitTeil.tsx`, `ZustErgebnis*`,
`EreignisFristen.tsx`, `KombinierteAnsicht.tsx`, `RechnerTagerechner.tsx`, Inkasso-Strecke,
Verjährungs-Board. `src/tests/mietrecht.test.ts` kennt die Fehlerklasse nicht.

**Gesamtbilanz Geister/Verwaisung:** **4 rechtlich relevante Orte** — Patientenverfügung ·
Mietvertrag · Schlichtungsgesuch BS · Mietrecht-Rechner (2 Stellen). Dazu 5 Steckenbleiber und
2 irreführende Warnungen. Ein **fünfter §1-Ort** kam über Ziff. 18.3 dazu (Verjährungsrevision
2020) — andere Fehlerklasse, gleiche Schwere.

---

## 7. Prüfmethoden für die Rechtslogik

*Verifikation: selbst gelesen (Opus, Repo-Stand main `7adcc0b28`).*

**Ist-Stand stark:** 13 Property-Dateien mit fast-check (Register
`register/property-invarianten-2026-08-15.md`, 99 Tests in 7,6 s), Golden ~23 000 Zeilen,
`check:sweep`, rund 55 Tore. Vorarbeit liegt in `recherche/rules-as-code-sichtung-2026-09-05.md`
und `recherche/fremdnutzen-suchrunde-2-2026-09-06.md` (Befund dort: kein amtliches Orakel).

**Es fehlt:** ein Test, der eine **Weiche umstellt**; Mutationstests; Coverage.

**Drei Massnahmen, priorisiert:**
1. **Metamorpher Weichen-Test**, generisch über `registry.ts`: Relation «füll(a) → setze w=b»
   ≡ «frisch(b)». Der Rot-Beweis ist geschenkt — der Test scheitert heute an P07b und M05b.
2. **Statisches Tor `check:weichen`**: Baustein-Bedingung ⊇ Weichen-Bedingung, Feld→Weiche als
   Deklaration je Schema. Achtung F2f: die Implikation auswerten, nicht die blosse Existenz.
3. **Stryker nightly** nur auf `engine.ts` (plus zwei Engines), nicht in der PR-CI (§15).

**Wichtige Einschränkung:** ein metamorpher Test über `zusammenstellen` fängt die
disabled-bei-checked-Klasse **nicht** vollständig — die lebt in Seite plus Gate. Die Gates gehören
deshalb in die Relation (`Mängel(dirty) ≡ Mängel(clean)`). Dasselbe gilt für die Rechner: die
Relation muss auf Form-Zustand→Engine-Input und auf den Permalink ausgedehnt werden (verwaiste
Parameter nicht schreiben).

**Nicht lohnend (begründete Absagen):** weitere Property-Tests für Fristen und Tarife (gedeckt,
Rückbau-Gebot) · Catala/OpenFisca als Stack (Entscheid 5.9.2026) · MC/DC-Kennzahl · Z3 ·
amtliches Differenz-Orakel.

---

## 8. Verständlichkeit der Wizard-Texte und der Marker «zu verifizieren»

*Verifikation: Stichprobe über 5 Vorlagen (Sonnet); die Zählung 23 per grep 22.9.2026 (Fable).*

**Zählung:** 23 Fundstellen «zu verifizieren» in `src/lib/vorlagen/`, davon **18 nutzersichtbar**
(hinweise/warnungen/blocker/`hinweis:`) und 5 Kommentare oder interne Listen
(`mietvertrag.ts:52,201,293`, `schlichtungsgesuchBs.ts:35` und ggf. eine weitere). Nutzersichtbar
belegt u. a. `mietvertrag.ts:207` (Blocker-Text) und `arbeitsvertrag.ts:307`.

**Inhalt — was tatsächlich zu verifizieren ist:**
- *Mietvertrag:* Kaution «Bruttomietzins nach h.L.» (`:207`) · BGE 124 III 57 Index/Staffel
  (`:252`) · BGE 121 III 397 (`:289`) · BGer 4C.250/2006 (`:293`) · BGE 121 III 460 (`:298`) ·
  Art. 27 Abs. 2 ZGB im Einzelfall (`:341`) · BGE 134 III 446 (`:351`) · Untermiet-Aufschlag
  BGE 119 II 353 (`:359`, `:52`) · BGE 125 III 358 (`:375`).
- *Arbeitsvertrag:* BGer 4A_5/2025 vom 26.6.2025 und BGE 78 II 230 (`:252`, `:255`) ·
  BGE 129 III 618 (`:280`) · BGE 139 III 155 (`:288`, `:410`) · BGE 135 III 640 (`:307`) ·
  GAV-Günstigkeitsvergleich (`:324`) · BGE 131 III 439 (`:452`) · BGE 128 III 271 (`:495`).
- *Schlichtungsgesuch BS:* BGer 4A_413/2012 (`:344`) · Ausweichstandort St. Alban-Vorstadt 25
  (`:35`, Kommentar).

**Einordnung (22.9.2026):** Die ursprüngliche Frage war schief gestellt. Der Marker ist inhaltlich
**korrekt** — die Zitate sind ungeprüft, und §7/§8 verlangen genau diese Offenlegung. Offen ist
allein die **Form** der Offenlegung (Status-Badge statt Halbsatz im Blocker-Text); nicht dringlich.

**Reglement-Lücken** (`DESIGN-REGLEMENT.md` A1–A6 deckt Satzlänge, Aktiv, Jargon): es fehlen
K3 Handlungsanweisung im Fehlertext · K4 Hint-Platzierung (`src/components/vorlagen/ui.tsx:76-80`
setzt den Hint **unter** das Feld, GOV.UK setzt ihn zwischen Label und Feld) · K6/K7 Anrede- und
Begriffs-Konsistenz (Patientenverfügung «Sie/Bitte», der Rest Infinitiv) · K8 keine internen
Vermerke. Es gibt kein Sprach-Tor unter `check:*`. ß-Ausreisser nur als Kommentar in
`nichtbekanntgabe.ts:73`. Hausformel-Vorbild: `klageVereinfacht.ts:296`.

---

## 9. Barrierefreie Exporte (PDF und DOCX)

*Verifikation: Rechtslage Stichprobe (Sonnet), Code-Stellen selbst gelesen.*

**Pflicht heute: keine.** eCH-0059 V3.0 gilt nur für die Verwaltung. Die BehiG-Teilrevision
(Botschaft 20.12.2024, Inkrafttreten evtl. 1.1.2027) würde Private erfassen, ist aber **nicht
geltendes Recht**. Der EAA erfasst nur die Anhang-I-Kategorien; für LexMetrik unklar. Für
Gerichtseingaben verlangt Art. 6 VeÜ-ZSSV PDF — eine **PDF/A-Pflicht ist nicht belegt**, die
Kantone sind offen.

**Ist:** `jspdf ^4.2.1` (`vorlagenPdf.ts:48`) nutzt nur den Helvetica-Standardfont, kein
`setProperties`/`setLanguage`, kein Tagging. `docx ^9.7.1` erzeugt echte Headings
(`vorlagenDocx.ts:98,107,257-262`), aber **keine Dokumentsprache und keine echten Listen**.

**Befund:** kein Browser-JS-PDF-Erzeuger hat 2026 reifes PDF/UA.

**Empfehlung:** (1) DOCX Sprache + echte Listen (klein) · (2) PDF-Metadaten Titel und Sprache
(klein; ob die API in 4.2.1 vorhanden ist, wurde **nicht verifiziert**) · (3) PDF/UA jetzt nicht.
Alle drei ändern Export-Bytes → **deklarierte Golden-Änderung**. CI-fähiges Prüfwerkzeug: veraPDF.

---

## 10. Barrierefreiheit der Web-Oberfläche

*Verifikation: Repo selbst gelesen; Rechtslage Stichprobe, teils ausdrücklich unbelegt.*

**Recht:** Art. 6 BehiG erfasst Private nur mit einem Diskriminierungsverbot. Die Teilrevision
(Botschaft 20.12.2024; WBK-N Eintreten 28.3.2025) tritt nach Sekundärquellen um 2027 in Kraft —
**BBl- und Curia-Nummer nicht verifiziert**, die Schwellen für eine unentgeltliche private Site
sind unklar. Der EAA kennt eine Kleinstunternehmen-Ausnahme für Dienstleistungen.

**Ist-Stand stark — und dieser Befund korrigiert Ziff. 4 Kandidat 3:** axe läuft über **alle**
prerenderten Routen (`e2e/a11y-flaeche.e2e.ts`); die Aussage «nur Stichprobe» ist damit **falsch**.
Offen sind allein die Wizard-Zwischenzustände. Dazu Fokus-Management (`wizard.tsx:101-107`),
`aria-current` (`ui.tsx:303`), Skip-Link (`Shell.tsx:432`), `reduced-motion`.

**Lücken:** kein `jsx-a11y`-Lint · Tap-Ziel-Nachrüstliste offen (`e2e/a11y.e2e.ts:490-527`, geführt
in `W2·17-UI-BEFUNDE` B10) · kein axe auf dem offenen Lesemodus-Dialog · WCAG-2.2-Kriterien nicht
im Reglement · `lang` bei FR/IT-Zitaten · keine Barrierefreiheitserklärung.

**Veraltete Steuer-Doku (mit dieser Buchung berichtigt, Ziff. 20):**
`fahrplaene/FAHRPLAN-SEO-A11Y-GOVERNANCE.md:38` (W1.6 Karten-Fokus) und `:40` (W2.2 Tabellen)
führten zwei Befunde als offen, die im Code längst behoben sind — Belege `SchweizKarte.tsx:150-172`
und `ArtikelTabellen.tsx:94-172`.

---

## 11. Verzahnung Rechner ↔ Vorlagen (Ist-Stand)

*Verifikation: selbst gemessen (Sonnet); **eine Zählung widerspricht sich** und ist nachzumessen.*

**Bestand:** Katalog 80 Rechner-Karten (37 entwurf / 43 geplant) — ein zweiter Agent zählte 63,
die **Zählung ist uneinheitlich und muss nachgemessen werden**. 68 Vorlagen-Karten (29/39),
32 Schemas. Korpus: 1580 Erlasse, 6345 Entscheide, 1683 Materialien, 11 485 Artikel→Entscheid-Kanten;
`src/lib/normtext/werkzeuge.ts` trägt 17 Erlass-Einträge und 61 Artikel-Kanten zu Werkzeugen.

**Rechner→Vorlage mit echter Wertübergabe: nur 3 Fälle** — Zuständigkeit → Klage ordentlich,
vereinfacht oder Schlichtungsgesuch (`ZustErgebnisEinleitung.tsx:142/146`,
`useZustaendigkeitForm.ts:314`, `*PrefillKodieren`). Sonst nur Links (`ThemenEinstieg.tsx`,
`related:`).

**Vorlage→Rechner** (Engine-Wiederverwendung) ist sauber, 8 Vorlagen, z. B.
`kuendigungArbeitgeber.ts:5-6`. **Lücke:** `mahnung.ts` nutzt `verzugszins.ts` nicht.

**Geplant ist bisher nur Korpus↔Korpus** (`FAHRPLAN-VERZAHNUNG-UI.md` W2·7-VZUI,
`FAHRPLAN-MATERIALIEN-VERZAHNUNG.md`, Posten «zitationsnetz» 20.9.2026). Rechner↔Vorlage-
Wertübergabe ist **nicht geplant**.

**Priorisierte Lücken:** Mahnung ⇄ Verzugszins · Kündigungs-Rechner → Kündigungsschreiben mit
Datum · Verjährung → Verjährungsverzicht · Streitwert/Prozesskosten → Klage direkt · Norm-Chips →
eigener Leser (erst messen) · Mietrecht → Kündigung Mieter · Erbteilung → Testament.
**Achtung:** Wertübergabe in Bausteine ist Rechtslogik (Gegenprüfung) und erzeugt genau die
Geister-Klasse aus Ziff. 5/6 — Prefill plus Weichenwechsel. Deshalb erst nach dem Umstell-Test.

---

## 12. Marktblick Schweiz

*Verifikation: Stichprobe (Sonnet); Preise und Betreiberangaben teils nur aus Suchtreffern.*

**Rechner** sind dicht besetzt, gratis und mit Fedlex-Beleg: `frist.ch`, `durchblick.nl`,
`gerichtskostenrechner.ch` (ein niederländischer Betreiber, Durchblick Consultancy BV, deckt
26 Kantone Gerichtskosten), `legaldeadline.ch`, `fristenrechner.ch` (seit 2011), `univeva.ch`.
**Keiner zeigt ein Stand-Datum oder eine Drift-Erkennung.** → Der Mehrwert-Test für reine
Fristen- und Kostenrechner ist **nicht klar bestanden**; die Differenz liegt in der
Stand-Transparenz (§7), der Tiefe und der Verzahnung.

**Vorlagen:** gratis gibt es nur statische Word-Downloads (kmu.admin.ch, muster-vorlage.ch);
bezahlt WEKA, HEV (CHF 8.50/11 je Formular), Mieterverband (Mitglieder). Wizards existieren nur
für Gründungen (Fasoon, Startups.ch). → **Wizard + Norm je Baustein + PDF/DOCX gratis ist eine
Lücke.**

**KI-Recherche:** DeepLaw CHF 39–299/Monat, Omnilex, CASUS — durchweg nicht deterministisch.
Positionierung daraus: «amtlich, gratis, nachrechenbar».

**Weitere Lücken:** Verzahnung Rechner↔Vorlage · kantonsübergreifender Schlichtungsgesuch-Wizard ·
Sperrfristen und Beurkundung mit Formvorschrift-Warnung.

---

## 13. Auffindbarkeit

*Verifikation: Repo selbst gemessen; die Suchmaschinen-Aussagen sind Stichprobe und **nicht
beweisbar** ohne Search Console.*

**Technik sauber:** Titel, Description und Canonical individuell (`src/lib/seo.ts:64-131,181`,
`seo-detail.ts`), JSON-LD (WebSite, Organization, WebApplication, Legislation, BreadcrumbList,
Article), Prerender ohne JS, Sitemap-Index plus 4 Teile (`scripts/prerender.ts:480-524`).
**Fehlt:** `<lastmod>`, hreflang (einsprachig), llms.txt (ohne belegten Effekt).

**Hauptbefund:** `SITE_URL = 'https://lexmetrik.vercel.app'` (`src/lib/seo.ts:17`, von Fable
gegengelesen) — ein Domainwechsel ist genau dieser eine Wert. In 8 Such-Stichproben nie sichtbar;
die `site:`-Abfrage (über WebSearch, **nicht** der Google-Index) lieferte keinen Live-Treffer
→ vermutlich kaum indexiert, ohne Search Console aber nicht beweisbar.

**Massnahmen (bewusst nicht gebucht, Ziff. 21):** eigene .ch-Domain (David kauft, dann `SITE_URL`) ·
Search Console plus Sitemap einreichen (Davids Konto) · `lastmod` · Uni-Linklisten (ius.uzh.ch,
fvjuris.ch/links, Unibas, Unibe) · Beitrag in Jusletter oder Anwaltsrevue.

**Entscheid David 21.9.2026:** «ich will noch nicht live gehen sodass ich gefunden werde» —
Domain, Search Console und Linklisten werden **nicht** vorgeschlagen, bis David den Live-Gang
ansagt. Auf die Rückfrage, ob die Seite aktiv aus den Suchmaschinen herausgehalten werden soll:
«so lassen fürs erste» — **kein `noindex`, kein Passwortschutz**. Ist heute: `public/robots.txt`
= `Allow: /` plus Sitemap; kein `noindex` gefunden (grep über index.html, vercel.json, robots.txt).

---

## 14. Nutzertests (Minimalplan, nicht gebucht)

*Verifikation: Stichprobe (Sonnet); Methodenquellen teils ungeprüft.*

3–4 Fallvignetten (**nie** Mandatsdaten) · 5 Personen × 45 Minuten remote, Think-Aloud, SEQ je
Aufgabe, SUS am Ende (die deutsche Fassung vor dem Einsatz prüfen: Gao/Kortum/Oswald 2020 gegen
neuere) · nur Notizen, Ton und Bild nur mit Einwilligung · Auswertung nach Häufigkeit × Schwere,
Top-3 beheben · Rhythmus nach Krug (ein Vormittag pro Monat). Vertrauenssignale (Norm, Stand)
mittesten.

**Messung ohne Tracking:** Vercel Web Analytics (auf Hobby gratis, cookielos; **Datenstandort
offen**), Umami oder Plausible self-hosted. Der EDÖB-Cookie-Leitfaden (22.1.2025, Fassung Okt. 2025)
wird in Sekundärquellen zur Frage «Bannerpflicht bei cookieloser Aggregatmessung» **uneinheitlich**
wiedergegeben → das ist Davids eigene Prüfung. Die gesuchte Methodenpublikation des
digitalservice.bund wurde **nicht gefunden**.

---

## 15. Rechtliche Bereitschaft vor einem Live-Gang

*Verifikation: Code-Stellen selbst gelesen; die vier BGE-Regesten auf bger.ch verifiziert
(111 II 471, 116 II 695, 120 II 331, 121 III 350); die Rechtsfragen teils ausdrücklich offen.*

**Tatsache Netzwerk-Abfluss — «nichts verlässt den Browser» gilt NICHT absolut.** Vier Stellen:
1. `ZefixSuche.tsx:43` — Firmenname und UID an zefix.ch.
2. `AdresseBundSuche.tsx:45` — Adresse an api3.geo.admin.ch.
3. `src/lib/rechtsprechung/livesuche.ts:109` — Suchbegriff an entscheidsuche.ch (Opt-in);
   **in `Datenschutz.tsx` nicht offengelegt** (grep leer, von Fable bestätigt).
4. `src/components/fehlermeldung.ts:68` — an `/api/fehler` (Fehlertext höchstens 300 Zeichen, Pfad
   ohne Query, 25 % Stichprobe).

Kein Analytics, kein Sentry; PDF und DOCX entstehen lokal; Schriften self-hosted; CSP `connect-src`
in `vercel.json`.

**Offen vor dem Live-Gang:** Impressum fehlt (keine Route; `Ueber.tsx:96-104` nennt nur Name und
LinkedIn; Art. 3 Abs. 1 lit. s UWG — Anwendbarkeit bei Unentgeltlichkeit **unklar**) ·
`Datenschutz.tsx:34` Platzhalter «Verantwortlicher», `:98-99` Platzhalter Vercel/USA ·
**Vercel-DPF-Status widersprüchlich** (der privacyshield.gov-Datensatz führt «Inactive» seit 2022,
Vercel gibt das Gegenteil an; dataprivacyframework.gov war nicht lesbar) ·
`VITE_KONTAKT_EMPFAENGER` evtl. leer (`src/lib/kontakt.ts:14`) · keine Nutzungsbedingungen ·
Hinweis nach Art. 45c FMG für `localStorage` · kantonale Entscheide mit Namen der
Gerichtsbesetzung im Korpus — Weiterverbreitung und Anonymisierung **ungeprüft** · die Terms von
Fedlex, bger und entscheidsuche **nicht gelesen** · Marke **nicht geprüft** · BGFA und PrHG
**nicht verifiziert**.

**Repo-Sichtbarkeit (Fable-Messung, `gh repo view`, 21.9.2026):** das GitHub-Repo
`LexMetrik/Whatever` ist **public** — Code, PRs und Steuer-Doku sind öffentlich lesbar. Das passt
nicht ohne Weiteres zu «noch nicht gefunden werden»; §18 (Geheimnisse) wiegt damit umso schwerer.
**Entscheid David 22.9.2026:** privat wäre ihm lieber, «aber dann kostet CI zu viel» → **bleibt
vorerst public**. Beleg: `fahrplaene/FAHRPLAN-CI-MINUTEN.md:7` nennt 61 381 min/Monat
(Sparplan −24 300); privat sind nur 2000–3000 min/Monat frei. Zusammenhang für später:
`QS-CI-MINUTEN`; ein eigener Runner auf eigenem Server würde die Minutenkosten umgehen — die
GitHub-Preisregeln für self-hosted Runner in privaten Repos 2026 sind **nicht verifiziert**.

**Veraltet im Code:** `ZefixSuche.tsx:8` trägt ein TODO an David. *(Bewusst nicht angefasst — diese
Session durfte keinen Code ändern.)*

---

## 16. Vertrags-Muster (WorldCC) → eigene Vorlagen

*Verifikation: Engine-Fähigkeiten selbst gelesen; die Wirkungs-Behauptungen sind **nicht belegt**.*

**Die Engine kann heute:** Ziffern und Einzug (`engine.ts:188-202`), Rollen rubrum/parteien/
unterschrift (`:27-29`), Seitenzahl (`vorlagenPdf.ts:60-68`), Wasserzeichen (`:283-296`).
**Es fehlt:** Tabelle, Inhaltsverzeichnis, Definitionen, Anhänge, Kopfzeile, Querverweise.

Sechs Ideen, nach Eingriffstiefe (a = Engine, b = Web-Oberfläche, c = additiv):
1. Eckdaten-Begleitblatt «wer, was, wann, wie viel» (c, Goldens unberührt).
2. «Antworten prüfen»-Übersicht im Wizard (b).
3. Fristen-Zeitstrahl in der Web-Vorschau (b).
4. Tabellen-Baustein (a, gross, Golden).
5. Inhaltsverzeichnis für lange Dokumente (a).
6. Druckbares «Nächste Schritte»-Blatt aus dem Bausteinprotokoll für Testament, Vorsorgeauftrag
   und Patientenverfügung (c, klein).

**Nicht übernehmen:** Comics, Icons im Dokument, lockerer Umgangston.
**Beleglage:** eine Wirksamkeitsaussage findet sich nur bei GOV.UK zur «check your answers»-Seite
und auch dort nur als Selbstauskunft; alles Übrige ist **unbelegt**.

---

## 17. Curia-Vorberatungen — Entscheid-Grundlage

*Verifikation: `lex-recherche` Opus 22.9.2026, read-only; Geschäft 08.053 von Fable per eigenem
OData-GET gegengeprüft (16 Zeilen → 2 Gruppen, Datum 25.6.2008 = `Business.SubmissionDate`).*

Bezug: Posten `plan/posten/2026-09-21-curia-vorberatungen-62-der-amtlichen-zeilen-fallen-zusammen.md`
(Dach `QS-KORPUS`). David 22.9.2026 zunächst: «keine ahnung. dazu soll nochmals recherchiert
werden.»

**Auflage der Quelle:** parlament.ch «Open Data / Web Services» → Nutzungsbedingungen mit vier
gleichrangigen Auflagen: kein amtlicher Anschein · Quellenangabe · **inhaltlich nicht verändern** ·
Downloadzeitpunkt ersichtlich. Die französische Fassung: «Le contenu des données doit rester
inchangé». Eine amtliche Auslegungshilfe wurde **nicht gefunden**. opendata.swiss führt den (alten)
Webservice unter `terms_by` — also nur Quellenangabe. Der Wortlaut liegt bereits im Repo, u. a.
`materialien/entstehung-2026-09-15/bulletin-vote-ursprung.md:44`.

**Warnung nach §14.7:** eine WebFetch-Zusammenfassung der «Rahmenregeln Parlamentsdaten»
(Sept. 2022) **erfand** ein Veränderungsverbot und eine Aggregations-Erlaubnis — im Volltext null
Treffer. **Nicht zitieren.**

**Was `$metadata` sagt:** `Preconsultation` hat den Schlüssel `ID` plus `Language` und Beziehungen
zu `Bill` (über `IdBill`) und `Business`; **keine** Beziehung zu Meeting oder Session. Die Zeile
ist amtlich also «je Entwurf».

**Neu und wichtig:** `PreconsultationDate` ist **kein Sitzungsdatum**, sondern ein Zuweisungs- bzw.
Einreichungsdatum. Belegt: 08.053 = `SubmissionDate`; 01.023, 02.046, 09.043, 16.077, 19.046 =
Botschaftsdatum; 24.041 ungeklärt. Eine Beschriftung «Kommission X beriet am Y» wäre damit falsch
(§8) — unabhängig von der gewählten Variante. Auch die Posten-Begründung «je Sitzung» trägt nicht.

**Stichprobe über 8 Geschäfte:** die zusammenfallenden Zeilen unterscheiden sich in 8 von 8 nur in
`BillNumber`/`IdBill`, in 2 von 8 zusätzlich in `TreatmentCategory` (09.043, 24.041; die Bedeutung
ist **nicht amtlich belegt**, vermutlich Behandlungskategorien des Nationalrats). Kein Fall
«Entwurf 1 zugewiesen, Entwurf 2 nicht» am selben Datum und derselben Kommission.

**Nebenfund (eigener kleiner Verlust):** `scripts/entstehung/curia.ts:229` verwirft mit
`if (!name) continue` amtliche Zeilen **ohne** `CommitteeName` ersatzlos — bei 24.041 sind das
3 Zeilen.

**LexMetrik-Seite:** Schlüssel `[datum,name]` in `curia.ts:226/239`; `CuriaKommission` (`:142`)
führt kein `vorlage`, die drei Schwesterlisten führen es. **Die Liste wird heute nirgends
angezeigt** (grep über `src/**`) → es ist ein reiner Daten-Entscheid. Zähler in
`curia-run.ts:124/130/180`; das Tor `curia-tor.ts:145/230` hat für die Vorberatungen **keine
unabhängige Referenz**.

**Optionen:** A je Zuweisung und Kommission (790 Zeilen, Entwurfs-Zuordnung geht verloren) ·
B je Entwurf (~2093) · **C je Zuweisung mit Entwurfs-Liste (790 Zeilen, verlustfrei)**.

**Entscheid David 22.9.2026 (Chat, Wortlaut «dann c»): Variante C.**

**Offen:** die Darstellung auf parlament.ch (JS-Hülle, nicht belegbar) · der **Zählwiderspruch**
korpusweit 35 309 amtliche Zeilen (Messung 22.9.2026) gegen 32 031 im Posten (Messung 21.9.2026) ·
andere Weiterverwender nicht geprüft.

---

## 18. BGE-Recherche zu den drei offenen §7-Fragen

*Verifikation: zwei `lex-recherche`-Läufe Opus, 22.9.2026, read-only. bger.ch antwortete
durchgehend mit HTTP 503, die Belege stammen deshalb über search.bger.ch und entscheidsuche.ch.
**Unpublizierte Urteile wurden nicht systematisch erfasst.** Der Entscheid bleibt bei David —
nicht drängen.*

### 18.1 SF-F1 — Art. 63 SchKG, Nicht-Monotonie der Hemmung

**Gedeckt:** Anker am **Ende** der geschlossenen Zeit plus drei **Werktage** — Art. 63 Satz 2/3
DE und IT («nach deren Ende» / «dopo la fine delle medesime»), BGE 149 III 179 E. 2 (mit amtlichem
Rechenbeispiel 19.4. → 22.4.2020), BGE 108 III 49 E. 1–3, BGE 80 III 103 (nur Regeste verifiziert).
**Die französische Fassung weicht ab:** «jusqu'au troisième jour utile», ohne Anker — das ist ein
eigenes Auslegungsargument und fehlt bisher beim Pin SF-8.

Art. 63 setzt eine Betreibungshandlung voraus: BGE 149 III 179 E. 4.1, 117 III 4 E. 3, 115 III 6.
Gerichtliche SchKG-Klagen fallen unter den ZPO-Stillstand (BGE 143 III 149 E. 2.4.1.2;
Art. 56 Abs. 2 SchKG seit 1.1.2025).

**Ungeklärt (kein Entscheid; die Botschaft BBl 1991 III 56/71 f./109 schweigt):** ob Art. 63 die
Verwirkungsfristen nach Art. 88 Abs. 2 und 166 Abs. 2 erfasst · das Zusammentreffen von Hemmung
und Betreibungsferien · die Nicht-Monotonie als solche. BGE 149 III 410, 152 III 92 und
113 III 120 (Stillstand) erwähnen Art. 63 nicht.

**Engine:** `src/lib/fristenEngine.ts:167-185` (Z. 179 `nthWerktagNach(p.bis, 3, kanton)`),
`src/lib/schkgFristen.ts:50-74` (Perioden-Hülle) und `:155-179` — dort wird die Hemmung als
`addDays` **vor** der Endnormalisierung angewendet, und genau das ist die Ursache der
Vorverlagerung.

### 18.2 SF-F2 — Wartefristen

**Kein Entscheid** zur Anwendung von Art. 63 auf Warte- oder Mindestfristen.

**Indizien dagegen:** BGE 108 III 49 E. 2 (Zweck: Schutz dessen, der **handeln** muss und zu
dessen Ungunsten die Frist läuft) · BGE 150 III 219 E. 3.1–3.3 (5A_611/2023 vom 7.3.2024: die
Minimalfrist nach Art. 116 besteht «ausschliesslich im Interesse des Schuldners»; die Berechnung
läuft über Art. 31 SchKG i.V.m. Art. 142 Abs. 1 und 2 ZPO — **Abs. 3 wird nicht genannt**; ein
verfrühtes Begehren ist blosse Ordnungsvorschrift). Betreibungshandlung ist eine Handlung der
Vollstreckungs**organe** (BGE 114 III 60 E. 2b; 120 III 9; 121 III 284) → ein Gläubigerbegehren in
den Ferien ist nicht verboten, separat judiziert ist das allerdings nicht.

**Der Engine fehlt ein Hinweis:** Art. 9 Abs. 2/3 VFRR (SR 281.31) weist verfrühte Begehren
zurück, ausser sie sind höchstens zwei Tage zu früh.

**Engine:** `schkgFristen.ts:182-193` (`istWartefrist` umgeht `normalisiereEnde`, Fix aus der
Gegenprüfung 2.7.2026), `:266-276`.

**Nebenfunde im Korpus:** `src/data/verifikation.ts:206-231` führt BGE 143 III 149, 114 III 60,
108 III 49 und 149 III 179 mit `verifiziert:false`; der lokale BGE-Bestand reicht nur bis Band 146;
`norm-index.json` verknüpft BGE 150 III 219 nicht mit SchKG 116/88.

### 18.3 Verjährungsrevision 2020 (Art. 49 SchlT ZGB) — die Messung zeigt falsche Verdikte

**Regeln, belegt:**
1. Die neue, längere Frist gilt nur, wenn die Forderung am 1.1.2020 noch nicht verjährt war —
   Art. 49 Abs. 1; BGE 148 II 73 E. 6.2.2; 9C_608/2024 E. 3.2.
2. Kein Wiederaufleben — Botschaft BBl 2014 268 f.; 4A_648/2024 E. 5.1.
3. Die verlängerte Frist läuft ab dem ursprünglichen dies a quo, abgelaufene Zeit wird angerechnet
   — Abs. 3; 9C_429/2022 E. 5.1.2/5.2.
4. Ist das neue Recht kürzer, gilt das alte — Abs. 2.
5. Stillstand, Unterbrechung und Verzicht nach neuem Recht erst ab 1.1.2020 — Abs. 4;
   5A_435/2025 E. 7.1.2 (Art. 134 Abs. 1 Ziff. 8); 4A_507/2020 E. 4.1 (Art. 141).

Zu Art. 60 Abs. 1bis und Art. 128a OR in der Sache gibt es **keinen** BGer-Entscheid.

**Engine:** `src/lib/verjaehrung.ts:71-109` trägt **nur die neuen Fristen**, ohne jede
Datumsverzweigung; die Warnung `:545` hängt allein an `beginnRelativ` (`:210`; von Fable
gegengelesen).

**Gemessen (Skripte im Scratchpad, flüchtig) — falsche Verdikte «nicht verjährt» (Klasse K2):**
- Delikt, Kenntnis 1.3.2018: Soll verjährt 1.3.2019, Engine sagt 1.3.2021.
- Bereicherung, Kenntnis 1.9.2018: dieselbe Klasse.
- **Personenschaden, Verhalten 1.6.2005, Kenntnis 2021:** Engine rechnet absolut bis 2025,
  richtig wäre verjährt seit 2015 — **und zwar ohne jede Warnung**, weil nur `beginnAbsolut`
  vor 2020 liegt.
- Der Fehler wandert über Unterbrechungsketten bis 2026 weiter.

**Kandidat K3/K4:** `vertrag_person`, Pflichtverletzung 2015, Kenntnis 2021 → Engine sagt
«verjährt 1.3.2024», altrechtlich liefe Art. 127 bis 1.3.2025 (Art. 49 Abs. 2) — **Herleitung des
Agenten, nicht belegt**; ohne Warnung.

**Korrekt (K1):** alle am 1.1.2020 noch laufenden Fristen. **Fehlalarm:** die Warnung erscheint
auch bei `ordentlich`, wo Art. 127 unverändert ist.

→ Das ist der **fünfte §1-Ort**. Dach: `W3-RECHTSSTAND-WEICHE`.

---

## 19. Basel-Stadt — Lizenz und Schlüssel (Blocker `david-bs-lizenz-schluessel`, R12a)

*Verifikation: `lex-recherche` Opus 22.9.2026; Datensatz 100354 von Fable per eigenem API-GET
gegengeprüft (Herausgeber Zentraler Rechtsdienst, CC BY 4.0, 11 018 Records). David: «weiss ich
nicht, das findest du sicher raus».*

**Ausgangslage** (`fahrplaene/FAHRPLAN-KANTONE.md:755-765`,
`materialien/2026-09-12-k16-bs-vormessung.md:252 ff.`):
`https://www.gesetzessammlung.bs.ch/api/texts_of_law/<SG>` liefert `old_versions[]`, je Fassung
Volltext-XHTML unter `…/versions/<id>` (geprüft an 132.100, 10 Fassungen, 12.9.2026) — **ohne
Lizenzvermerk**, eine undokumentierte interne API (anders als data.bs.ch 100311–100355 = CC BY 4.0).
Zwei Handgriffe Davids waren vorgesehen: (1) Nutzung und Lizenz des Endpunkts klären, (2) den
amtlichen Schlüssel Erlass↔Geschäft anfragen.

### 19.1 Handgriff 1 (Lizenz) — weitgehend geklärt **ohne** Anfrage

- **data.bs.ch `100354` «Gesetzessammlung: Gesetzestexte»** (Zentraler Rechtsdienst, **CC BY 4.0**):
  1370 SG-Nummern, 8061 Records mit Fassungs-Volltext (`gesetzestext_html`), Deep-Links auf
  **dieselben** Fassungs-IDs wie die interne API (`…/versions/<id>`).
  **Aber:** Fussnoten und Änderungstabellen fehlen im OGD-Text (2 von 2 Stichproben) — genau das
  braucht R12a.
- **opendata.swiss** führt «Systematische Gesetzessammlung (inkl. Gemeinderecht)», Ressource ist
  die Website, `rights=terms_open` (Freie Nutzung). Der Eintrag stammt von 2016/2018 — ob er die
  API mitträgt, ist Auslegung.
- **`gesetzessammlung.bs.ch/robots.txt`** sperrt nur Such-Endpunkte, **nicht**
  `/api/texts_of_law/` oder `versions`; kein Crawl-delay (bs.ch selbst: 10). Die Website hat kein
  Impressum und keine Nutzungsbedingungen. Offizieller PDF-Export je Fassung:
  `…/api/de/versions/<id>/pdf_file`.
- **Recht:** URG Art. 5 Abs. 1 lit. a und Abs. 2 (erfasst Erlasse **und** amtliche Sammlungen,
  ohne Beschränkung auf den Bund; SR 231.1, Stand 1.7.2025) · PublG BS SG 151.200 §5 (massgeblich
  ist das elektronische Kantonsblatt), §12 Abs. 2 (Einsicht unentgeltlich) · PublV SG 151.210
  §10–14 · IDG SG 153.260 ohne OGD-Norm · OGD-Richtlinie des Regierungsrats vom 22.1.2019 Ziff. 2.2
  «OGD by default», gilt für alle Verwaltungseinheiten. Die data.bs.ch-Bedingungen untersagen
  «amtlich anmutende Veröffentlichungen» und Hoheitszeichen. UWG Art. 5 lit. c ist nur ein
  Prüfpunkt.
  **Nicht verifiziert:** ein amtlicher Beleg «kein sui-generis-Datenbankrecht» (es liegt nur ein
  Negativbefund aus dem URG-Volltext vor); keine BGer-Recherche dazu.
- **Rest, der eine Anfrage rechtfertigen würde:** Fussnoten und Änderungstabellen liegen
  **ausserhalb** der erklärten CC-BY-Lizenz; der Endpunkt ist undokumentiert (der Client nutzt
  bereits `api/main/v1/…`) → Stabilität und Abrufrate sind eine Betriebs- und Höflichkeitsfrage.

### 19.2 Handgriff 2 (Schlüssel Erlass↔Geschäft) — teilweise vorhanden

**Kein Datenfeld:** 100311 hat 30 Felder ohne SG-Bezug, 100355 ebenso; LexWork meldet
`materials_enabled:false` in `/api/de/settings`.
**Aber** die amtlichen Änderungsdokumente
(`…/api/de/change_documents/file_dictionaries/<id>/pdf_file`) nennen im Ingress die Ratschlags-
bzw. Berichtsnummer (3 von 3 Stichproben: 16.0479.01/.02; 21.1239.01/.02; 24.5460.01), identisch
mit `signatur_dok` in Datensatz 100313 (4 von 4), dazu die geänderten §§ wörtlich.
**Der Schlüssel ist die Nummer, nie das Datum** (das Ingress-Datum weicht in 2 von 3 Fällen um
einen Tag ab). Erreichbar ist er nur über PDF-Fliesstext — das ist ein Risikopfad und steht
**nicht** im CC-BY-Datensatz.

### 19.3 Falls doch eine Anfrage

Fünf Fragen: Deckt `terms_open` die JSON-Endpunkte samt Fussnoten und Änderungstabellen? · Welche
Form der Namensnennung? · Zulässige Abrufrate und Zeitfenster? · Sind Endpunkt-Änderungen geplant? ·
Warum ist `materials_enabled` aus, und ist die interne Zuordnung publizierbar?
Stellen: Redaktion Gesetzessammlung (ZRD, JSD) · Fachstelle OGD · Parlamentsdienst. Die
Funktionsadressen stehen im Agentenbericht und werden hier bewusst nicht wiederholt.

**Folge für die Steuer-Doku:** Der Blocker `david-bs-lizenz-schluessel` **bleibt stehen** — David
hat ihn nicht aufgehoben. Der Text wurde um diesen Befund ergänzt und die Anfrage als **optional**
gekennzeichnet; derselbe Nachtrag steht als §10 in `materialien/2026-09-12-k16-bs-vormessung.md`.

---

## 20. Entscheide David 22.9.2026 (Chat) — mit Wortlaut

Alle zehn wurden mit dieser Buchung in die Steuer-Doku übertragen; wo ein Posten betroffen war,
wurde der Marker `wartet-auf: david` entfernt.

| # | Sache | Wortlaut | Folge |
|---|---|---|---|
| 1 | Geistereinträge (Ziff. 5/6) | «einreihen» (Option B) | als Posten unter `QS-CODE-PROP`, **nicht** in die `@queue`; das Mandat «Bund zuerst» bleibt unangetastet |
| 2 | Fedlex-Fundstellen melden | «ja melden» | Posten bleibt offen, bis David gemeldet hat — die Meldung ist eine ausgehende Nachricht und damit sein Handschritt; nie selbst senden |
| 3 | Entscheid-Suche | Zählzeile «leer lassen», Suche «ab zwei Zeichen» | Posten ist baubar, kein `wartet-auf` mehr |
| 4 | Jules-GitHub-App | «jules ist nicht installiert» | Posten geschlossen. **Folge: bis zu einer Installation (Davids Handgriff, nicht angekündigt) keine auftragsgebundenen Jules-Tickets anlegen.** Der Vault-Eintrag `fremdagenten-freigaben-2026-09-03.md` nennt «drei Handgriffe Davids offen» — beim nächsten Fremdagenten-Schritt abgleichen |
| 5 | Curia-Vorberatungen (Ziff. 17) | «dann c» | Variante C: eine Zeile je Kommission und Zuweisung, betroffene Entwürfe als Liste. Posten umgeschrieben, Risikopfad Korpus, Reihenfolge nach `@queue`/`QS-KORPUS` |
| 6 | Hook-Patch | «ja zum patch» | Freigabe **nur** für `plan/posten/anhang/2026-09-19-hook-main-push.patch` (streicht den Schalter `LEXMETRIK_MAIN_PUSH=1` in `.claude/hooks/tor-schutz.py`; `src/tests/hooks-wache.test.ts:377` erwartet dann Exit 2). Der Nebenverdacht `struktur-rotieren.py --hook` ist **nicht** freigegeben und bleibt offen |
| 7 | Steuerdeckel-Posten | «alten posten schliessen» | geschlossen, überholt durch den Streich-Runden-Posten |
| 8 | Token-Posten | «schliessen» | gegenstandslos, `.github/workflows/plan-buchung.yml` existiert seit dem Abbau #952 nicht mehr |
| 9 | Abbau-Vorschlag monatlich | «schliessen» | widerspricht Council und Nordstern 22.9.2026 («keine Wiederholung als Ritual»). Die dort genannte Vorbedingung — der Fang-Scanner-Bug in der Bewährungs-Erhebung — wurde in den Streich-Runden-Posten hinübergerettet |
| 10 | ZGB-Anhang A36 (74 Alt-Artikel in die Gliederungs-Leiste?) | «nein» | Eintrag aus dem `@david-fragen`-Block gelöscht; der Entscheid ist hier festgehalten: **die 74 Artikel des ZGB-Anhangs «Wortlaut der früheren Bestimmungen des sechsten Titels» erscheinen bewusst NICHT in der Gliederungs-Leiste** (es sind aufgehobene Alt-Fassungen, im Lesetext weiterhin vorhanden und verlinkbar). Das ist zugleich der Entscheid-Vermerk am Fundort der Alt-Kuration A36 |

**Unverändert bestätigt:** Blocker `richter-analytik-gate` — David 22.9.2026 «bleibt gesperrt»;
nicht erneut fragen. Gesperrt bleiben allein Ranking und Prognose; Filtern, Facette und
Verlinkung sind frei und gebaut.

**Noch offen, nicht drängen (§7-Abnahme):** SF-F1 und SF-F2
(`register/property-invarianten-2026-08-15.md:79,89`) · Verjährungsrevision 2020
(`src/lib/verjaehrung.ts:547`) · BS-Lizenz und Schlüssel · TERMDAT-Lizenz (die CKAN-Abfrage vom
22.9.2026 scheiterte technisch, kein Befund).

---

## 21. Bewusst NICHT als Posten gebucht — mit Grund

Rahmen: Nordstern 22.9.2026 «**Produkt vor Prozess**» und «nichts überschiessen». Prozess-Arbeit
nur, wenn sie den Bau blockiert. Der Steuerungs-Deckel hatte am 22.9.2026 rund 22 KB Luft.

| Nicht gebucht | Grund |
|---|---|
| Reglement-Ergänzungen (Ziff. 1, fünf Punkte; dazu K3/K4/K6/K7/K8 aus Ziff. 8) | Prozess und Reglement, kein Produktnutzen, kein Bau blockiert. `W2·19-DESIGN-KONSISTENZ` wäre das Dach, falls es später doch gebucht wird |
| A11y-Rest und `jsx-a11y`-Lint (Ziff. 10) | keine geltende Pflicht (Ziff. 9/10); `W2·17-UI-BEFUNDE` B10 trägt die Tap-Ziele bereits — ein zweiter Posten wäre eine Doppelung |
| Stryker nightly (Ziff. 7 Nr. 3) | CI-Minuten; `QS-CI-MINUTEN` misst 61 381 min/Monat, ein Nightly-Mutationslauf wirkte direkt gegen ein bekanntes Kostenproblem |
| Nutzertest-Runde (Ziff. 14) | Davids eigener Handschritt, vor dem Live-Gang nicht sinnvoll |
| Reichweite: Domain, Search Console, Linklisten, Publikation (Ziff. 13) | **Entscheid David 21.9.2026** «ich will noch nicht live gehen sodass ich gefunden werde» — zurückgestellt, bis er den Live-Gang ansagt |
| Repo-Sichtbarkeit privat schalten (Ziff. 15) | Entscheid David 22.9.2026: bleibt public, weil CI privat zu teuer wäre |
| Vorlagen-Extras (Ziff. 16 Nr. 3–6: Zeitstrahl, Tabellen-Baustein, Inhaltsverzeichnis, «Nächste Schritte»-Blatt) | Wirkung unbelegt (Ziff. 16), Engine-Eingriff mit Golden-Folgen; erst nach dem Umstell-Test sinnvoll |
| Pfadüberdeckungs-Test je Vorlage (Ziff. 4 Nr. 2) | geht im metamorphen Weichen-Test auf — ein eigener Posten wäre dieselbe Sorge zweimal (§17 Gegengewicht) |
| a2j-Muster Nr. 4/5 (Schritt-Sichtbarkeit als Daten, Array-Muster) | mittlere Umbauten ohne belegten Nutzer-Schmerz |

---

## 22. Pflegebedarf und offene Unsicherheiten

- **Die Mess-Skripte sind weg.** Alle «per Skript bewiesen»-Befunde sind über ihre
  `datei:zeile`-Angaben reproduzierbar, aber nicht per Knopfdruck. Wer die Geister-Fixes baut,
  stellt den Rot-Beweis neu her — er ist nach Ziff. 7 Nr. 1 geschenkt.
- **Zwei Zählungen widersprechen sich** und sind vor einer Verwendung nachzumessen: Rechner-Karten
  80 gegen 63 (Ziff. 11) · Curia-Zeilen korpusweit 35 309 gegen 32 031 (Ziff. 17).
- **Drei Schätzungen** sind als solche markiert und nie als Messwert zu zitieren: Zeilenlänge Web
  71–80 Zeichen, PDF/DOCX 81–86 Zeichen (Ziff. 1), `jspdf`-4.2.1-API für Metadaten (Ziff. 9).
- **Rechtslage in Bewegung:** BehiG-Teilrevision (Inkrafttreten ~2027, nur Sekundärquellen),
  BEKJ, EAA-Anwendbarkeit, Vercel-DPF-Status. Wiedervorlage spätestens, wenn David den Live-Gang
  ansagt.
- **Nicht zitieren:** die erfundenen «Rahmenregeln Parlamentsdaten» (Ziff. 17) und die
  unverifizierte Passera-Studie (Ziff. 2).
- **Offen bei David, ohne Posten:** welche Kandidaten aus Ziff. 1 in den Bauplan sollen; ob eine
  Vertiefung `a2j-rechtsantragstelle` ↔ LexMetrik-Wizard gewünscht ist.
