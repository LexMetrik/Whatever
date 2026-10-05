# Strategie: Grundlagen für eine führende Plattform deterministischer Rechts-Engines

**Auftrag David 7.6.2026:** «überprüfe fundiert und erstelle handlungsplan» (Ultra-Effort),
mit der ausdrücklichen Rahmenbedingung: **Die Website wird noch nicht verwendet –
es geht ausschliesslich darum, die Grundlagen zu erstellen, auf denen aufgebaut
werden kann.** Kein Launch, kein Marketing, keine Zahlung jetzt.

**Methode:** 2 Web-Recherche-Agents (Markt/Wettbewerb CH · Recht/Hosting/Zahlung/
Pricing) + Ultra-Workflow mit 6 Analyse-Linsen (Produkt, Technik, Vertrauen, Markt,
Betrieb, Moat) und 3 adversarialen Kritikern (Solo-Machbarkeit, CLAUDE.md-Prinzipien,
Markt-Realismus). Roh-Berichte: `.scratch/strategie-plattform-2026-06-07/`.
Dieses Dokument ist die konsolidierte Synthese; das operative Tagesgeschäft bleibt
in `ROADMAP.md` (früher HANDLUNGSPLAN.md).

---

## Direktive David (14.6.2026): Ausbau-Phase vor den Kanzleigesprächen

> **REVIDIERT 8.8.2026 (David, Chat; Alt-Entscheide-Audit 14.8.2026):** Die
> Prioritäts-Direktive unten gilt NICHT mehr — seit dem 8.8. gilt «Prozess
> geht grundsätzlich vor Produkt» (Session-Karte 8.8., Memory Nordstern).
> Der Block bleibt als historischer Kontext stehen; massgeblich sind
> `ROADMAP.md` (ZIEL/JETZT) und die Nordstern-Notiz, nicht dieser Absatz.

**Übersteuert die Tagespriorität bis zu den ersten Kanzleigesprächen (G1, erst in
einigen Monaten).** Bis dahin gilt NICHT Nutzer-Validierung als Maßstab, sondern
**maximaler Produktausbau zu einem imposanten Produkt mit Burggraben** — kein
simples Werkzeug, das ohnehin schon existiert. Jeder Bau-Entscheid wird an drei
Maßstäben gemessen: **(1) Praxistauglichkeit · (2) Skalierbarkeit der
Bau-Architektur · (3) fachliche Tiefe** (Differenzierung durch Tiefe/Abdeckung,
nicht Breite an Trivialem).

Burggraben-Priorität = die unter §0 genannten verteidigbaren Schichten:
**Datenassets** (26-Kantone, Behörden-Registries, **Tarif-Staffeln**) +
**Durchgängigkeit/Verknüpfung** der Werkzeuge + **Verifikations-Prozess**.

**Bewusst zurückgestellt:** die Abnahme-Welle / `geprüft`-Hebungen / Validierung
sind bis G1 NICHT die Priorität und werden nicht proaktiv vorangetrieben. Es wird
weiter auf `entwurf`-Niveau gebaut (§8-Ehrlichkeit bleibt). Markt-Themen
(Hosting/Zahlung/Login) bleiben draußen.

---

## 0 · Kernbefunde (das Fundament der Priorisierung)

1. **Der Moat ist nicht der Code.** Engine-Logik ist von einem LLM-Team in Wochen
   kopierbar. Verteidigbar sind: (B) die **Datenassets** (26-Kantone-Schichten,
   bedingte Feiertagsregeln, Behörden-Registries, Tarif-Staffeln – Nachbau 3–6 Monate
   *plus* laufende Pflege), (C) der **Verifikations-Prozess** (Norm-Anker-Empirie,
   Golden-Protokoll, Sweeps – eine eingeübte Methodik, kein Artefakt) und (D) die
   **fachkundige Person** (Davids Abnahme). C+D sind unsichtbar, bis sie kommuniziert
   werden; B verfällt ohne Pflege. Code allein = ~6 Monate Vorsprung, nicht mehr.

2. **Die Fristen-Alleinstellung ist falsifiziert.** legaldeadline.ch deckt gratis
   ZPO/StPO/VwVG/BGG/SchKG/ATSG/DBG ab – mit Schritt-Herleitung, Normverweisen,
   Fedlex-Links und .ics-Export; fristenrechner.ch besetzt die «Gegencheck»-
   Positionierung wörtlich; insgesamt ≥6 Gratis-Fristenrechner CH. Fristen sind ein
   **Commodity-Markt**. Sie bleiben fürs Fundament zentral (höchstes Haftungsrisiko →
   zuerst abnehmen), aber der spätere zahlungsfähige Wert liegt dort, wo es kein
   Gratis-Tool gibt: **kantonale Kosten/Anwaltstarife, Existenzminimum,
   Kostenrisiko-Modul** – genau auf dem vorhandenen Daten-Moat.

3. **Der Engpass ist nicht der Bau, sondern die Abnahme.** Agents bauen schneller,
   als eine Person abnehmen kann. 0 von ~35 Einträgen tragen `verified:true`.
   Jede neue Engine ohne Abnahme-Pfad vergrössert nur den Entwurfs-Berg
   («Breite ohne verified ist wertlos»). Daraus folgt die Plattform-Regel:
   **Bau-Rate ≤ Abnahme-Rate + Puffer.**

4. **Die grösste Betriebslücke ist die fehlende Automatisierung.** Kein `.github/`
   (kein CI!), die Dauerwerkzeuge (Golden, Sweeps, Zitate-Prüfer, bibliothek-check)
   laufen nur, wenn manuell gestartet; das Verfallsregister ist Disziplin, nicht
   Mechanik – und listet bereits terminierte Verfälle (SG GKV 30.6.2026,
   BE-Formularpflicht 1.11.2026, GR/BE 31.12.2026). Pflegelast heute ~8–15 PT/Jahr,
   bei 100+ Engines ohne Automatisierung 40–70 PT/Jahr → Solo-Grenze.

5. **Die fehlende Zeitachse ist die grösste Architektur-Lücke.** Nur 2 von ~17
   Engines kennen einen Rechtsstand (erbteilung, gewaehrleistung); alle anderen
   rechnen hart «geltendes Recht heute» (z. B. Entscheidvorschlags-Schwelle 10'000
   ohne Zugriff auf die alte 5'000er-Schwelle vor 2025). Anwälte rechnen
   Vergangenheitsfälle (Übergangsrecht ist Alltag); Reproduzierbarkeit Jahre später
   ist Beweisfrage. Versionierung (Engine-Version, Rechtsstand, Beweis-Hash) ist
   **schwer nachrüstbar** und gehört deshalb ins Fundament – aber schrittweise,
   nie als Sammel-Refactoring (§6!).

6. **Markt-Realismus als spätere Schranke:** Kein Beleg existiert, dass eine
   Kanzlei für ein solches Tool zahlt. Vor jedem grossen Ausbau (Monetarisierung,
   Sprachen, API) steht eine Validierungs-Sequenz (Teil 2, Gate G1). Für die
   jetzige Grundlagen-Phase ist das keine Bremse – es bestimmt nur, was JETZT
   bewusst NICHT gebaut wird.

7. **Markttyp: «trust-takes-most».** Mehrere Anbieter koexistieren, aber Kanzleien
   standardisieren auf das EINE Tool, dem sie für haftungsrelevante Berechnung
   vertrauen. Konsequenz: **schnell bei Infrastruktur, kompromisslos langsam beim
   Inhalt.** Die CLAUDE.md-Disziplin ist das Wettbewerbsmittel, nicht die Bremse.

---

## 1 · Fundament-Plan (JETZT – Website bleibt unbenutzt)

Gegliedert in 7 Stränge. Reihenfolge innerhalb der Stränge = Empfehlung;
F1/F2 sind sofort und parallel startbar. «David-Zeit» = nicht delegierbar.

### F1 · Absicherung (Tage, trivial, blockiert Späteres)

- [ ] **F1.1 Domain `lexmetrik.ch` registrieren** – einziger Punkt, in dem alle
  9 Berichte übereinstimmen. Stunden, < CHF 20, Squatting-Risiko real.
  Nur registrieren/parken – kein Umzug, kein Launch. Ggf. gleich `lexmetrik.com`
  defensiv dazu.
- [ ] **F1.2 Rechtstexte als Entwürfe vorbereiten** (Impressum UWG 3 I lit. s ·
  Datenschutzerklärung revDSG · AGB mit Verantwortungsteilung statt
  Pauschal-Ausschluss [OR 100: nur leichte/mittlere Fahrlässigkeit wegbedingbar]).
  David schreibt sie als Jurist selbst; sie gehen erst mit der Nutzungsfreigabe
  live. GmbH und Versicherung bewusst NICHT jetzt (Kritik-Befund: Kapitalbindung
  vor Umsatz; Einzelfirma genügt für die Grundlagen-Phase).
- [ ] **F1.3 Runbook `BETRIEB.md`** gegen Bus-Faktor 1: Accounts (Vercel, GitHub,
  Registrar), Deploy-Schritte, Regenerier-Anleitungen (LIK, PLZ, Caches),
  Jahres-/Quartals-Termine, Notfall-Plan. 2–3 Tage, fast alles Agent-Arbeit.

### F2 · Betriebs-Infrastruktur: Disziplin → Mechanik (der grösste Hebel)

- [ ] **F2.1 `npm run check:*`-Skripte** – golden-outputs, norm-zitate-pruefen,
  logik-sweep, bibliothek-check, katalog-inventur, smoke-render sind heute NICHT
  in `package.json` verdrahtet (verifiziert). Minuten-Arbeit, Voraussetzung für CI.
- [ ] **F2.2 CI-Pipeline (GitHub Actions):** bei jedem Push `tsc -b · test · lint
  (voller Output) · build · alle check:*-Skripte`. Macht §6/§9 maschinell
  erzwingbar statt Session-Disziplin – wichtigster Schutz gegen den dokumentierten
  Parallel-Session-Datenverlust und die tail-1-Falle. 2–3 Tage.
- [ ] **F2.3 Verfalls-Gate maschinell:** `parameter-verfall.md` in maschinenlesbare
  Form (Frontmatter/JSON) + Prüfskript: jedes `stand`-Feld (65 Dateien tragen
  Stände) gegen Rhythmus/Termin; Überschreitung → CI-Alarm, betroffener Eintrag
  im Katalog auf «Prüfung fällig» statt stillschweigend weiterrechnen.
  3–5 Tage. Die 2026er-Termine (30.6.! 1.11., 31.12.) sind der Testfall.
- [ ] **F2.4 Fedlex-Versions-Monitoring:** `fedlex-cache.sh` erkennt heute nur
  Anker-Existenz im GEPINNTEN Stand – nicht, ob eine NEUERE Konsolidierung
  existiert. SPARQL-Abfrage je ELI (geltende + angekündigte künftige Fassungen
  vs. gepinnter Stand), wöchentlicher Cron, Abweichung → Alarm. 3–5 Tage.
  Später auf kantonale Erlasse (OrdoLex/LexWork-APIs) ausweiten.
- [ ] **F2.5 Agent-gestützte Pflege-Runs** (nach F2.2–F2.4): scheduled Jobs für
  LIK-Regeneration (Skript existiert, Trigger fehlt), Referenzzins-Check,
  Behörden-Link-Checker (HTTP-Status aller Registry-URLs). Output = Diff zur
  fachlichen Durchsicht, nie Auto-Merge von Logik (→ F5, Deploy-Klassen).

### F3 · Versionierung & Reproduzierbarkeit (schwer nachrüstbar = Fundament)

- [ ] **F3.1 Engine-Versionskonstanten** (`VERSION` Semver je Engine + Build-ID/
  Git-SHA via Vite define). 3–5 Tage, Enabler für alles Weitere (Beweis-Block,
  Golden-Archiv, späteres SDK/MCP). Regel: fachliche Änderung → Bump → erneute
  Abnahme fällig.
- [ ] **F3.2 Golden-Output-Archiv je Engine-Version** (nicht überschreiben) +
  CI-Gate: Golden-Änderung ohne Versions-Bump = Build-Fehler. 2–3 Tage.
- [ ] **F3.3 Beweis-Block im PDF-Rechenbericht:** Engine-Version, Rechtsstand,
  normalisierte Eingaben (Permalink-Spec existiert!), SHA-256 via `crypto.subtle`
  – vollständig clientseitig. **Prinzipien-Auflage (scharf):** Hash NUR über
  deterministische Felder `{engineVersion, rechtsstand, inputs, outputs}` –
  Erstellungszeit/Aktenzeichen sind Metadaten NEBEN dem Hash, nie im Preimage
  (sonst §2-Bruch: zwei Läufe → zwei Hashes). Optional Verify-Ansicht
  («Hash prüfen»). 1–2 Wochen. Das ist das stärkste Differenzierungsmerkmal
  gegen jede KI-Lösung: «deterministisch + beweisbar».
- [ ] **F3.4 Rechtsstand-Resolver als Infrastruktur** (Registry datierter
  Parameter `gueltigAb/gueltigBis` + `paramAm(stichtag)`), dann **Migration
  engine-weise, gekoppelt an die Abnahme-Welle (F4)** – jede Migration ist eine
  DEKLARIERTE fachliche Änderung (nie Sammel-Refactoring; Default-Stichtag muss
  golden-byte-identisch zum Status quo rechnen, Diff = 0). Beginnen bei Engines
  mit realem Übergangsrechts-Alltag (Verjährung alt/neu, ZPO-Revisions-Schwellen,
  Gewährleistung [hat es], Erbrecht [hat es]). Infrastruktur 1 Woche; Migration
  je Engine 1–3 Tage Agent + Davids Verifikation der historischen Stände
  (§11-Dossier je Engine Pflicht). Voll-Querschnitt bewusst NICHT auf einmal.

### F4 · Abnahme-Fundament (Davids Kern-Zeit – der eigentliche Engpass)

- [ ] **F4.1 Abnahme-Protokoll-Schema** `abnahme/<engine>.md`: geprüfte Anker +
  Konsolidierungsstand, Golden-Referenzfälle (≥1 amtlich belegt: BGE-Sachverhalt
  oder Behörden-Beispiel), abgehakte Edge-Cases (Feiertag, Monatsende, Schaltjahr,
  Zustellfiktion), Known Limitations, Prüfer + Datum. 2–3 Tage Schema (Agent).
- [ ] **F4.2 Build-Gate:** `verified:true` ohne Abnahme-Protokoll + ohne
  Akzeptanztest = Build-Fehler. Macht «geprüft» technisch unmöglich ohne Beleg.
  1–2 Tage.
- [ ] **F4.3 Risikobasierte Abnahme-Reihenfolge** statt Katalogposition:
  Risiko = Schadenshöhe × Frequenz × Irreversibilität → **Welle 1: die
  Fristen-Engines** (zpoFristen, schkgFristen, allgemeineFrist, erbFristen,
  sperrfristen; verpasste Frist = definitiver Schaden), Welle 2 Form-Gate-Vorlagen
  (Testament, Gründungsurkunden), Welle 3 Beträge (reversibel/nachrechenbar).
  Vorbedingung Welle 1: kantonale Feiertags-Verifikation (ROADMAP, früher HANDLUNGSPLAN, C.14;
  BJ-Liste = Stand 2011, Matrix-Dossier ist die Arbeitsgrundlage).
- [ ] **F4.4 Welle 1 durchführen** – 1–2 Wochen Davids Kernzeit, je Engine mit
  Protokoll (F4.1). Selbstabnahme ist für die Grundlagen-Phase korrekt (David IST
  die fachkundige Person); die externe Zweitprüfung ist NICHT Voraussetzung
  (Kritik-Befund: sonst Zirkelschluss kein Umsatz ↔ keine Prüfung), sondern
  spätere Verschärfung (Teil 2). Transparenz im Protokoll: «Selbstabnahme,
  Zweitprüfung ausstehend».
- [ ] **F4.5 Statusgetriebener Disclaimer:** `PflichtDisclaimer.tsx` aus den
  Abnahme-Daten speisen – «berechnet nach Art. X, Konsolidierungsstand Y,
  geprüft am Z von …» statt Pauschal-Floskel. Macht das ehrliche Status-Modell
  (§8) vom Eingeständnis zum Verkaufsargument. 2–3 Tage nach F4.1.

### F5 · Prinzipien-Erweiterung (Davids Freigabe nötig — Nummerierung überholt)

> **Nummerierung überholt (25.7.2026).** Die hier vorgeschlagenen Nummern
> §12–§16 sind seither im Reglement anderweitig belegt; **§16 ist zudem
> ausdrücklich gestrichen und wird nicht neu belegt** (`CLAUDE.md` §16). Der
> Entwurf beansprucht diese Nummern daher nicht mehr. **Die Inhalte bleiben
> unverändert offene Vorschläge — über sie ist nichts entschieden.** Wird einer
> angenommen, bekommt er eine freie Nummer (§17 aufwärts), nie eine belegte.

Die §§1–11 regeln den Bau; der Plattform-Betrieb ist ungeregelt. Entwurf
(Detail-Begründung: `kritik-prinzipien.md`):

- **§12 Versionierung & Reproduzierbarkeit** – VERSION je Engine; Rechtsstand-
  Stichtag als Eingabe; Hash nur über deterministische Felder (nie Systemzeit);
  Golden-Archiv je Version; Bump-Pflicht bei fachlicher Änderung.
- **§13 Datentrennungs-Invariante** – falls je ein Backend entsteht (Auth/
  Billing): es sieht ausschliesslich Identität + Zahlungsstatus + Lizenz-Token;
  Eingaben/Berechnungen/Permalinks verlassen den Browser NIE; CSP connect-src
  nur für den Auth-Endpoint. Schriftlich fixieren, BEVOR es aktuell wird –
  sonst erodiert die Grenze schleichend.
- **§14 Erweiterter Abnahme-Kreis** – `verified:true` setzt Abnahme-Protokoll
  voraus; Abnahme durch David ODER eine von ihm autorisierte qualifizierte
  Fachperson; für Fristen-Engines später Vier-Augen-Pflicht. §7 bleibt im Kern
  (menschlich, nie automatisch) – nur der Personenkreis wird delegierbar,
  sonst ist «führend» arithmetisch unmöglich.
- **§15 Deploy-Klassen** – (A) Logik/Norm/Schwelle/Vorlage → Davids explizites
  Ja (unverändert); (B) quellengenerierte Daten-Regenerate (LIK, PLZ) mit
  Golden-Diff nur auf erwarteten Datenzeilen + grünem Verfalls-Check →
  automatischer Merge zulässig, asynchrones Review.
- **Vorfalls-Disziplin** (Entwurfs-Nummer §16 **entfallen**, siehe Kasten oben —
  Inhalt bleibt offener Vorschlag) – bestätigter Fehler in einer `verified`-Engine →
  sofortiger Status-Rückfall auf `entwurf` + Changelog + Versions-Bump;
  «Berechnung scheint falsch»-Meldeweg (mailto + Permalink, kein Datenabfluss).
- **Lesart-Klarstellung §1:** «Duplikat vor Abstraktion» gilt für RECHTSLOGIK;
  Katalog-/Build-/Darstellungs-Infrastruktur fällt unter §3/§6/§10 und darf
  zur Skalierung umgebaut werden (verhaltensneutral bewiesen).

### F6 · Portfolio-Grundsätze (was noch gebaut wird – und was pausiert)

Befund: Die letzte Bau-Phase war **frequenz-invertiert** – viel Energie in die
Gesellschafts-Achse (niederfrequent, einmalige Vorgänge), während hochfrequente
Kanzlei-Werkzeuge `geplant` sind. Ab jetzt:

- **Regel: Bau-Rate ≤ Abnahme-Rate.** Neue Engines nur mit (a) §11-Dossier und
  (b) realistischem Abnahme-Pfad.
- [ ] **F6.1 Anwaltshonorar/Parteientschädigung-Rechner** – die EINE
  Neubau-Ausnahme: Das Dossier `kosten/anwaltstarife-kantone.md` ist zweifach
  geprüft (26 Kantone, Streitwert-Staffeln), der teuerste Teil liegt fertig vor;
  häufigste ökonomische Kanzleifrage; KEIN Gratis-Konkurrent. Höchster ROI im
  Portfolio, fehlt als Karte sogar in der Roadmap. 1–2 Wochen + Abnahme.
- [ ] **F6.2 Mahnung-Vorlage (free)** – `freeReihenfolge.ts` referenziert sie,
  die Karte existiert nicht (verifizierte Inkonsistenz). Dossier baufertig,
  wenige Tage.
- [ ] **F6.3 Fristen-Vollabdeckung** (StPO · VwVG/Steuer · ATSG · BGG-Presets) –
  Preset-Arbeit auf bestehender Infrastruktur, Dossiers liegen; je 1–2 Wochen.
  Danach Kosten-Cluster Bund (BGer-Gebühren, Kostenvorschuss).
- [ ] **F6.4 Praxis-Querschnitte vereinheitlichen** (Befund M-8: PDF/Aktenzeichen/
  Teilen fehlen im Rechtsmittel-/SchKG-/Straf-Zweig) – Konsistenz-Arbeit,
  1–2 Wochen Agent.
- **PAUSIERT:** weitere Gesellschafts-Dokumente nach Abschluss der laufenden
  AG-Etappen (erst Frequenz-Kern), kantonale Prozesskosten-Vollerfassung
  (Pflege-Moloch; Bundes-Teile zuerst), Existenzminimum (P1, nach Kosten-Cluster),
  Familienrecht (P2).

### F7 · Daten-Moat pflegen und verbreitern (laufend, Agent-lastig)

- [ ] Offene Datenlücken schliessen (AR-Hausnr., TI-Leventina, UR/AI/BL-Notariate,
  SZ-Schlichtung, Gerichtskosten Teil B) – jede geschlossene Lücke erhöht die
  Nachbau-Kosten für Fast-Follower.
- [ ] Bibliothek weiter nach §11-Disziplin; `muster/`-Bestand aktuell halten;
  Verfallsregister wird durch F2.3 maschinell.
- **Erkenntnis festhalten:** Der Daten-Moat ist ein Abo, kein Besitz – er
  existiert nur, solange F2 die Pflege trägt.

---

## 2 · Aufbau-Phase (SPÄTER – jede Stufe hinter einem Gate)

Festgehalten, damit die Grundlagen darauf zulaufen; NICHTS davon jetzt bauen.

**Gate G0 – Nutzungsfreigabe durch David:** Rechtstexte live (F1.2), Welle-1-
Abnahme abgeschlossen (F4.4), CI grün (F2). Erst dann darf die Seite überhaupt
beworben/verwendet werden.

**Gate G1 – Markt-Validierung VOR Monetarisierung** (Kosten ~0, 4–8 Wochen,
wichtigste Investition des ganzen Plans):
1. **20 strukturierte Kanzlei-Gespräche** (BS-Netzwerk): «Was rechnest du heute
   wie? Wofür würdest du zahlen?» Erfolg: ≥5 nennen unaufgefordert dasselbe
   zahl-fähige Problem (Hypothese: Kosten/Tarife, NICHT Fristen).
2. **Landing-Page-Test** mit echtem Preis → Warteliste. Erfolg: ≥30 qualifizierte
   Anwalts-Leads in 4 Wochen.
3. **3 bezahlte Pilot-Kanzleien** für die in (1) identifizierte Engine-Gruppe.
   Erfolg: 3/3 verlängern freiwillig.
   Scheitert (1), ist die ehrliche Alternative: LexMetrik als exzellentes
   Reputations-/Akquise-Instrument der eigenen Kanzlei – das muss vor grossem
   Ausbau ausgeschlossen sein.

**Nach G1, in dieser Reihenfolge:**
- **Zahlung schlank** (Payrexx [CH, TWINT nativ] oder Stripe Billing; signiertes
  Lizenz-Token, §13-Invariante; Pro = NUR das verifizierte Subset – Geld nie
  schneller als `verified:true`, härteste rote Linie des Prinzipien-Wächters).
  Realistisches Einstiegsmodell laut Markt-Kritik: flache Kanzlei-Lizenz
  (~CHF 200–400/Jahr) statt Per-Seat.
- **Externe Zweitprüfung/Fachbeirat** aus erstem Umsatz finanzieren (§14 nutzbar
  machen); GmbH-Gründung (Dogfooding mit der eigenen Maske!) und
  Vermögensschaden-Versicherung ab realem zahlendem Fristen-Einsatz.
- **CH-Hosting-Migration (Infomaniak)** – rein wahrnehmungsgetrieben sinnvoll
  (clientseitig = technisch unkritisch), Tage Aufwand, zusammen mit Domain-Going-
  live. **PWA/Offline** (vite-plugin-pwa, 3–5 Tage): «rechnet im Gerichtssaal
  ohne WLAN» – Quick-Win bei Nutzungsstart.
- **Weblaw LegalTech Hub**-Eintrag (einziger etablierter CH-Vertrauenskanal,
  Stunden) · Methodik-Seite + öffentliches Prüfstand-Dashboard (aus F4-Daten
  generiert – kein Konkurrent legt seinen Prüfstand offen) · Fachartikel.
- **MCP-Server/SDK** (`@lexmetrik/engines` + MCP-Wrapper): strategisch richtig
  (KI-Agenten als Kanal statt Killer; «Agent fragt, LexMetrik rechnet beweisbar»),
  aber erst wenn ≥5 Engines verified UND G1 bestanden – eine API, die Entwürfe
  an KI-Agenten ausliefert, multipliziert ungeprüfte Logik maschinell.
  `src/lib/` ist React-frei (verifiziert) → die Extraktion bleibt jederzeit
  billig; es gibt keinen Grund, sie früh zu erzwingen. Die Invariante
  «lib bleibt UI-frei» (§3) ist die einzige Grundlage, die JETZT zählt.
- **FR-Oberfläche**: UI-Strings/Norm-Labels (Anker sind sprachneutral) erst nach
  bewiesener Nachfrage; **FR/IT-VORLAGEN nie als blosse Übersetzung** – sie sind
  fachliche Neuerstellung mit eigenem verified-Status je Sprache (§7).
- **Katalog Richtung 50+/50+** – erst wenn die Abnahme-Rate es trägt.

---

## 3 · Bewusst verworfen / unbestimmt zurückgestellt

| Empfehlung aus den Berichten | Urteil | Grund |
|---|---|---|
| Outlook/M365-Add-in | gestrichen | eigenes Mini-Produkt mit Wartungslast; .ics/Webcal deckt 90 % |
| Bug-Bounty für Juristen | zurückgestellt | braucht geprüfte Engines + Publikum + Triage-Kapazität |
| Uni-Kooperation, Fachpublikation jetzt | zurückgestellt | Monate Latenz, zahlt erst nach G1 ein |
| GmbH + Versicherung jetzt | zurückgestellt | Kapitalbindung vor Umsatz; Einzelfirma genügt für Grundlagen |
| Rechtsstand-Voll-Querschnitt (6–10 Wo am Stück) | eingegrenzt | F3.4: Infrastruktur jetzt, Migration engine-weise mit der Abnahme |
| Per-Seat-Pricing-Detail | offen bis G1 | Enforcement bei Client-only schwer; flache Kanzlei-Lizenz realistischer |
| Kantonale Prozesskosten-Vollerfassung | pausiert | linear skalierender Pflege-Moloch; Bundes-Teile zuerst |
| «Pro-Teaser mit gesperrtem Ergebnis» | nur auf verified | §8: keine Sperre auf ungeprüfte Entwürfe |
| startseiteConfig-Split / Route-Manifest / Test-Sharding | bei ~60+ Einträgen | präventiv, noch kein Schmerz |

---

## 4 · Entscheide für David (blockieren einzelne Stränge, nicht den Start)

1. **CLAUDE.md-Erweiterung (F5)** – Freigabe des Entwurfs? Insbesondere der
   erweiterte Abnahme-Kreis und die Deploy-Klassen für Daten-Regenerate. Die
   Entwurfs-Nummern §12–§16 sind überholt (Kasten bei F5); bei Annahme gibt es
   freie Nummern ab §17.
2. **Abnahme-Welle 1 terminieren** – die Fristen-Säule ist Davids nicht
   delegierbare Kernzeit (1–2 Wochen); davor Feiertags-Verifikation 26 Kantone
   abschliessen. Wann?
3. **Domain-Registrierung (F1.1)** – darf sofort erfolgen? (Kein Launch, nur
   Sicherung; Registrar-Wahl z. B. Infomaniak wegen späterer Hosting-Option.)
4. **Bau-Pause Gesellschafts-Achse** nach den laufenden AG-Etappen bestätigen
   (Frequenz-Kern zuerst: F6.1–F6.3)?
5. **Beweis-Block-Zuschnitt (F3.3)** – Hash im PDF sichtbar (Vertrauens-Feature)
   oder zunächst nur intern (Metadaten-Zeile)?

---

## 5 · Kompass

> LexMetrik gewinnt nicht durch mehr Engines als die Konkurrenz, sondern indem
> es das eine Werkzeug wird, dem Kanzleien (und später KI-Agenten) für die
> haftungsrelevante Berechnung vertrauen. Der Moat ist Prozess + Person +
> sichtbar gemachte Methodik, abgesichert durch die kantonalen Datenassets.
> Schnell sein bei Infrastruktur (CI, Versionierung, Monitoring, Domain) –
> kompromisslos langsam beim Inhalt (Verifikation). Geld, Marketing und API
> niemals schneller als `verified:true`.

**Pflege dieses Dokuments:** Erledigtes abhaken; operative Detailplanung weiter
in `ROADMAP.md` (früher HANDLUNGSPLAN.md) (dieses Dokument = Richtungsentscheid, jenes = Tagesgeschäft).
Stand in `STRUKTUR.md` spiegeln, sobald Stränge starten.
