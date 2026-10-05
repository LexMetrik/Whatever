# LexMetrik — Praxis-Abdeckungskarte (Katalog-Roadmap)

**Umgebaut 10.6.2026 (FAHRPLAN-GRUNDLAGEN G1):** Diese Datei ist neu die
**Praxis-Abdeckungskarte** — die systematische Karte der ermessensfreien
Alltagsaufgaben einer Kanzlei, gegen die das Produkt gemessen wird. Sie
ersetzt die lose «~80 geplante Karten»-Liste und steuert: die
**Abnahme-Reihenfolge** (G2/B), die **Auffindbarkeit/Konsolidierung** (G3.2)
und — nach Öffnung der §0a-Sperre — die **Bau-Reihenfolge**.

**Methodik & Legende:**

- Klassifizierung je Aufgabe (Vorschlag Claude → **David entscheidet
  einzeln**, Entscheid-Spalte bleibt bis dahin «offen»):
  - ✅ **rein** — eigenes deterministisches Regime → Rechner/Vorlage
  - ◐ **Hinweis/Checkliste** — Wert vorhanden, aber Ermessen/Form-only
    (Präzedenz: beurkundungspflichtige Gründung, §8)
  - ✗ **raus** — reines Ermessen ODER vom generischen Werkzeug abgedeckt (§0)
- Verifikations-Marker: **[V]** = am Gesetz/Cache verifiziert (Datum) ·
  **[E]** = fachliche Einschätzung, vor Entscheid/Bau am Gesetz verifizieren.
- Ist-Stand (G1.3, gegen `startseiteConfig.ts` + `engine-map.md`,
  Inventur 10.6.2026): **gebaut** (Status entwurf — nichts ist «geprüft»!) ·
  **geplant** (Karte existiert) · **Lücke** (keine Karte).
- Praxiswert (G1.4): **H**äufigkeit × **R**isiko-bei-Fehlen ×
  **D**eterminismus-Klarheit, je 1–3 → Produkt 1–27.

**Zähler-Ist 10.6.2026 (`npm run report:inventur`):** 105 Karten · 32
verfügbar (gebaut — alle nur «entwurf») · 73 geplant · **0 geprüft**.

---

## §0-Mehrwert-Test (Daueranweisung David 7.6.2026 — Alt-ROADMAP §0, `archiv/ROADMAP-bis-2026-10-05.md`; früher HANDLUNGSPLAN)

Geplant wird nur, was ein EIGENES Regime hat (Stillstand, Sonderunter-
brechung, abweichende Berechnungsregeln, eigene Tarif-/Datenschicht).
**Triage 7.6.2026 (Agent, Normen am Fedlex-Cache verbatim verifiziert):**

**GESTRICHEN (Tagerechner/bestehendes Werkzeug deckt ab) — von David
entschieden:**
- *Strafverfahrensfristen* + *Haftfristen* — Art. 89 Abs. 2 StPO: «Im
  Strafverfahren gibt es keine Gerichtsferien»; Art. 90 = generische
  Mechanik (Davids Beispiel). → Tagerechner-Presets (Einsprache
  Strafbefehl 10 T., Berufung 20 T.).
- *Strafantragsfrist* (Rechner) — Art. 31 StGB: 3 Monate ab Kenntnis,
  kein Stillstand. → Tagerechner-Preset; die VORLAGE Strafantrag bleibt.
- *Bauhandwerkerpfandrecht* — Art. 839 Abs. 2 ZGB: 4 Monate ab
  Vollendung, fix. → Tagerechner-Preset.
- *Widerrufsrechte/Konsum* — Art. 40e Abs. 2 OR: 14 Tage, kein
  Sonderregime (Fristbeginn-Gate = Hinweis, kein Rechenregime).
  → Tagerechner-Preset mit Beginn-Notiz.
- *Inverzugsetzung* — Karten-Dublette der Mahnung (dasselbe Schreiben,
  Art. 102 OR). → Variante der Mahnungs-Vorlage.
- *Markenwiderspruch* — MSchG 31 III: 3 MONATE ab Veröffentlichung;
  Art. 22a VwVG greift nur für TAGES-bestimmte Fristen → KEIN Stillstand;
  nicht erstreckbar (41 IV lit. c). → Tagerechner-Preset (Monatsfrist).
  ⚠ Fach-Falle: NIE die VwVG-Stillstand-Logik anwenden.

**BLEIBT mit verifiziertem Eigen-Regime [V 7.6.2026]:** BGG-Fristen
(Art. 46 BGG eigener Stillstand + Ausnahmenkatalog) · Verwaltungs-/
Steuerverfahren (Art. 22a VwVG Stillstand nur Tagesfristen) ·
Sozialversicherung (Art. 38 Abs. 4 ATSG: Stillstand auch für
MONATS-Fristen — breiter als VwVG!) · strafrechtliche Verjährung
(Art. 97 ff. StGB strafrahmenabhängig, eigene Beginn-/Ruhensregeln) ·
*steuer-verjaehrung* (DBG 120/121 verbatim: relativ 5 J. + ABSOLUT
15/10 J., abschliessende Stillstands- und NEUBEGINN-Gründe; StHG 47
harmonisiert — Korrektur der Erst-Triage 7.6.2026 abends).

---

## A · Abnahme-Rangliste (steuert G2/B — gebaute Werkzeuge, nach Praxiswert)

Heute ist **kein einziges Werkzeug als «geprüft» ausgewiesen** — für eine
Kanzlei sind alle 36 gebauten Karten «entwurf». Die Abnahme-Welle (David,
Wort-für-Wort, Protokoll `abnahme/<id>.md`) folgt dieser Reihenfolge.
⚠ Gemeinsamer Abnahme-Blocker aller Fristen-Werkzeuge: das
**Feiertagsverzeichnis** ist gegen die BJ-Liste doppelt geprüft (6.6.2026),
laut engine-map vor «geprüft» aber noch je Kanton am kantonalen Erlass zu
verifizieren (Verfallsregister offen).

| Rang | Werkzeug (id) | H×R×D | Begründung |
|---|---|---|---|
| 1 | tagerechner | 3·3·3=27 | Fundament; deckt alle §0-gestrichenen Presets ab |
| 2 | zpo-fristen | 3·3·3=27 | Kern-Haftungsrisiko jeder Prozesskanzlei |
| 3 | schkg-fristen | 3·3·3=27 | dito Betreibungspraxis (Art.-63-Regime!) |
| 4 | zustaendigkeit (Zivil·SchKG·Straf) | 3·3·2=18 | Eingangsfrage jedes Mandats; 3 Engines + Amts-Finder |
| 5 | mietrecht | 3·3·2=18 | Kündigungs-/Anfechtungs-/Erstreckungsfristen |
| 6 | kuendigung-sperrfristen | 3·3·2=18 | Sperrfristen-Blocker = Haftungskern Arbeitsrecht |
| 7 | verjaehrung | 3·3·2=18 | Alltag Forderungsmandate |
| 8 | fristenspiegel | 3·3·2=18 | NACH 1–3 (reiner Orchestrierer derselben Engines) |
| 9 | erbrecht-fristen | 2·3·3=18 | Ausschlagung/Inventar — harte Verwirkung |
| 10 | verzugszins | 3·2·3=18 | Standardrechnung jeder Forderung |
| 11 | betreibungskosten | 3·2·2=12 | GebV-Tarif 1.1.2026 verifiziert |
| 12 | kuendigung-arbeitgeber/-arbeitnehmer (Masken) | 2·3·2=12 | konsumieren Engine 6 |
| 13 | kuendigung-mieter/-vermieter (Masken) | 2·3·2=12 | konsumieren Engine 5 |
| 14 | gewaehrleistung | 2·2·3=12 | Rüge-/Verjährungsfristen Kauf |
| 15 | erbteilung | 2·3·2=12 | Pflichtteils-Quoten (Rev. 2023) |
| 16 | lohnfortzahlung | 2·2·2=8 | Skalen kantonal, KTG-Weiche |
| 17 | streitwert | 2·2·2=8 | Ermessen sauber ausgegrenzt |
| 18 | teuerungsrechner | 2·1·3=6 | LIK-Mechanik |
| 19 | vollmacht · testament · vorsorgeauftrag · patientenverfuegung | 2·2·2=8 | Vorsorge-Block zusammen abnehmen |
| 20 | arbeitsvertrag · mietvertrag-wohnen | 2·2·2=8 | Vertrags-Block |
| 21 | schlichtungsgesuch · klage-vereinfacht | 2·2·2=8 | BS-Zuschnitt offenlegen |
| 22 | ag-gruendung · gmbh-gruendung · kapitalerhoehung · kuendigung-vertrag | 1·3·2=6 | AG: `npm run abnahme:ag` (195 Bausteine, 13 Schemas) liegt David bereits vor |

## B · Abdeckungskarte je Rechtsgebiet (G1.1/G1.2 — Entscheidvorlage)

Spalten: Aufgabe · Typ (F Frist / B Betrag / Z Zuständigkeit / V Vorlage) ·
Vorschlag · Ist · H×R×D · Entscheid David.

### Zivilprozess & Bundesgericht

| Aufgabe | Typ | Vorschlag | Ist | HRD | Entscheid |
|---|---|---|---|---|---|
| Verfahrens-/Rechtsmittelfristen ZPO | F | ✅ [V] | gebaut | 27 | implizit ja (live) |
| Rechtsmittel-Weiche (Berufung/Beschwerde, Instanz, Frist) | Z | ✅ [V] | gebaut | 18 | implizit ja |
| Zuständigkeit/Verfahrensart/Schlichtungspflicht | Z | ✅ [V] | gebaut | 18 | implizit ja |
| Streitwert (91–94a) | B | ✅ [V] | gebaut | 8 | implizit ja |
| Klagebewilligung Geltungsdauer (209) | F | ✅ [V] | gebaut (Spiegel) | 18 | implizit ja |
| **Gerichts-/Parteikosten kantonal** | B | ✅ [E: Tarife deterministisch, Ermessens-Spannen offenlegen] | geplant (`prozesskosten`) | **3·2·2=12** | **offen** |
| Kostenvorschuss (98) | B | ✗ eigene Karte → in `prozesskosten` falten (= Gerichtskosten-Funktion) [E] | geplant | — | **offen** |
| Bundesgerichtsgebühren | B | ✗ eigene Karte → Datenschicht in `prozesskosten` (BGerR-Tarif) [E] | geplant | — | **offen** |
| Sicherheit Parteientschädigung (99) | B | ◐ Voraussetzungs-Checkliste; Höhe = Ermessen [E] | geplant | 4 | **offen** |
| Rechtsmittelprüfung (Karte) | Z | ✗ Dublette des Rechtsmittel-Fahrplans in `zustaendigkeit` [V: dieselbe Engine] | geplant | — | **offen** |
| **BGG-Fristen (Art. 46-Stillstand)** | F | ✅ [V 7.6.] | geplant (`bgg-fristen`; Dossier bgg-beschwerde-engine liegt) | **2·3·3=18** | **offen** |
| Fristwiederherstellung (148) | F | ◐ 10-T.-Preset + Checkliste; «leichtes Verschulden» = Wertung [E] | geplant | 4 | **offen** |
| Schlichtungsgesuch (Vorlage) | V | ✅ | gebaut | 8 | implizit ja |
| Klage vereinfacht (Vorlage) | V | ✅ — kantonaler Ausbau über BS hinaus = Lücke | gebaut (BS) | 8 | **offen (Ausbau)** |

### Betreibung & Konkurs

| Aufgabe | Typ | Vorschlag | Ist | HRD | Entscheid |
|---|---|---|---|---|---|
| Betreibungs-/Konkursfristen (inkl. Ferien/Stillstand) | F | ✅ [V] | gebaut | 27 | implizit ja |
| SchKG-Zuständigkeit + Betreibungsamt-Finder | Z | ✅ [V] | gebaut | 18 | implizit ja |
| Betreibungskosten (GebV) | B | ✅ [V 1.1.2026] | gebaut | 12 | implizit ja |
| Rechtsöffnungs-/Aberkennungs-/Kollokations-/Arrest-Fristen | F | ✗ eigene Karten → Presets in `schkg-fristen`/Spiegel (gleiche Engine) [E: kein abweichendes Regime] | geplant (Teil-Presets da) | — | **offen** |
| **Existenzminimum & Pfändungsquote** | B | ✅ [E: Richtlinien-Sätze deterministisch; wertende Posten offenlegen] | geplant | **3·3·2=18** | **offen** |
| Rechtsvorschlag (Vorlage) | V | ✅ [E: Form + Frist deterministisch] | geplant | 3·2·3=18 | **offen** |
| Rechtsöffnungsbegehren (Vorlage) | V | ✅ [E: strukturiert; Titel-Würdigung als Gate offenlegen] | geplant | 2·3·2=12 | **offen** |
| Schuldanerkennung (Vorlage; 82 SchKG-Wirkung) | V | ✅ [E] — hoher SchKG-Nutzen (prov. Rechtsöffnungstitel) | geplant (unter OR) | 2·2·3=12 | **offen** |
| Aberkennungsklage · Arrestgesuch · SchKG-Beschwerde | V | ◐ Gerüst (Würdigungsanteil; Arrest: Glaubhaftmachung) | geplant [Gerüst] | 4 | **offen** |

### Arbeit

| Aufgabe | Typ | Vorschlag | Ist | HRD | Entscheid |
|---|---|---|---|---|---|
| Kündigungsfristen + Sperrfristen | F | ✅ [V] | gebaut | 18 | implizit ja |
| Anfechtungsfrist missbräuchliche Kündigung (336b) | F | ✅ [V] | gebaut (Spiegel A.3) | 18 | implizit ja |
| Lohnfortzahlung (Skalen) | B | ✅ [V] | gebaut | 8 | implizit ja |
| Ferienanspruch + Ferienkürzung (329a–c) | B | ✅ EIN Rechner (Kürzungs-Karenzen = eigenes Regime) [E] — `ferienkuerzung` in `ferienanspruch` falten | geplant (2 Karten) | 2·2·2=8 | **offen** |
| Anteiliger 13. Monatslohn | B | ✗ raus [E: reiner Dreisatz ohne Rechtsregime; Treuhand-Domäne] | geplant | — | **offen** |
| Überstunden-/Überzeitzuschlag (321c OR / ArG) | B | ✅ [E: Sätze+Schwellen regelbasiert] | geplant | 2·1·2=4 | **offen** |
| Entschädigungen 336a/337c | B | ◐ Kappen-Rahmen anzeigen; Höhe = Ermessen [V: Monatslohn-Kappen im Gesetz] | geplant (`arbeit-entschaedigung`) | 4 | **offen** |
| Massenentlassung Konsultations-/Anzeigefristen (335f/g) | F | ✅ [E: Schwellen+Fristen deterministisch] | Lücke | 1·3·2=6 | **offen** |
| Kündigungs-Masken (AG/AN) | V | ✅ | gebaut | 12 | implizit ja |
| Arbeitsvertrag | V | ✅ | gebaut | 8 | implizit ja |
| Freistellung (Vorlage) | V | ✅ [E: einfache Erklärung + Lohnfolgen-Hinweise] | geplant | 2·1·2=4 | **offen** |
| Verwarnung (Vorlage) | V | ◐ [E: Inhalt einzelfallabhängig → Gerüst] | geplant | 2 | **offen** |
| Arbeitszeugnis | V | ◐→✗ [E: Formulierung = Wertung; höchstens Struktur-Checkliste] | geplant | — | **offen** |
| Aufhebungsvereinbarung | V | ◐ Gerüst (Freiwilligkeits-/Sperrfristen-Risiken als Gates) | geplant | 4 | **offen** |

### Miete

| Aufgabe | Typ | Vorschlag | Ist | HRD | Entscheid |
|---|---|---|---|---|---|
| Kündigungs-/Anfechtungs-/Erstreckungsfristen | F | ✅ [V] | gebaut | 18 | implizit ja |
| **Mietzinsanpassung (Referenzzins/Teuerung)** | B | ✅ [E: BWO-Satz-Staffel + 40%-LIK deterministisch; Kostensteigerung als offene Eingabe] | geplant | **3·2·2=12** | **offen** |
| Nebenkosten-Abrechnungsprüfung | B | ✗ [E: faktisch/wertend] | Lücke | — | **offen** |
| Mietvertrag (W/G/Untermiete) | V | ✅ | gebaut | 8 | implizit ja |
| Kündigungs-Masken (Mieter/Vermieter-Checkliste) | V | ✅/◐ (Vermieter: Formularzwang 266l → bewusst Checkliste, §8) | gebaut | 12 | implizit ja |
| Mängelrüge/Herabsetzungsbegehren | V | ◐ [E: Rüge-Schreiben deterministisch, Herabsetzungsquote = Ermessen (Backlog bestätigt)] | Lücke | 4 | **offen** |

### Vertrag & Forderung (OR)

| Aufgabe | Typ | Vorschlag | Ist | HRD | Entscheid |
|---|---|---|---|---|---|
| Verjährung (inkl. Unterbrechung) | F | ✅ [V] | gebaut | 18 | implizit ja |
| Gewährleistung & Mängelrüge | F | ✅ [V] | gebaut | 12 | implizit ja |
| Verzugszins (inkl. Teilzahlungen) | B | ✅ [V] | gebaut | 18 | implizit ja |
| Schadenszins | B | ✗ eigene Karte → Verzugszins-Preset [E: gleiche 5%-Mechanik ab Schadenstag — vor Streichung verifizieren] | geplant | — | **offen** |
| Anwendbares Recht (IPRG) | Z | ◐ [E: Anknüpfungsleiter regelbasiert, Ausweichklausel 15 = Wertung; Praxiswert allg. Kanzlei tief] | geplant | 1·2·2=4 | **offen** |
| Mahnung (free; inkl. Inverzugsetzungs-Variante) | V | ✅ [V: §0-Triage] — Quick-Win B.9 offen | geplant | 3·1·3=9 | **offen** |
| Vertrags-Kündigungsmaske (VVG/Darlehen/Auftrag/Abo) | V | ✅ | gebaut | 12 | implizit ja |
| Darlehensvertrag | V | ✅ [E: regelbasiert; KKG-Grenzen als Gates] | geplant | 2·2·2=8 | **offen** |
| Einfacher Kaufvertrag | V | ✅ [E] | geplant | 2·1·2=4 | **offen** |
| Vergleichsvereinbarung | V | ◐ Gerüst (Saldoklausel-Risiken als Hinweise) | geplant | 4 | **offen** |

### Erbrecht & Vorsorge

| Aufgabe | Typ | Vorschlag | Ist | HRD | Entscheid |
|---|---|---|---|---|---|
| Erb-Fristen (Ausschlagung/Inventar/Klagen) | F | ✅ [V] | gebaut (+ Spiegel A.6) | 18 | implizit ja |
| Pflichtteil & verfügbare Quote | B | ✅ [V] | gebaut | 12 | implizit ja |
| **Ausgleichung & Herabsetzung (Beträge)** | B | ✅ [E: Regelwerk liegt laut Plan bereit — David-Punkt «Erbrechts-Engines»] | geplant | **2·3·2=12** | **offen** |
| Eigenhändiges Testament | V | ✅ | gebaut | 8 | implizit ja |
| Öffentl. Testament · Erbvertrag · Erbverzicht | V | ◐ Checklisten [V: Beurkundungszwang → kein Export, §8-Präzedenz] | geplant | 4 | **offen** |
| Erbteilungsvereinbarung | V | ◐ Gerüst [E: Teilungspunkte wertend] | geplant | 4 | **offen** |
| Vorsorgeauftrag · Patientenverfügung · Vollmacht | V | ✅ | gebaut | 8 | implizit ja |

### Familienrecht

| Aufgabe | Typ | Vorschlag | Ist | HRD | Entscheid |
|---|---|---|---|---|---|
| Familienrechtliche Fristen (Karte `familie-fristen`) | F | ✗ [E: 314-II-Familien-Summarsachen sind im Rechtsmittel-Zweig/Spiegel abgedeckt; kein weiteres Eigen-Regime erkennbar — vor Streichung verifizieren] | geplant | — | **offen** |
| Vorsorgeausgleich (BVG-Teilung) | B | ✅ [E: hälftige Teilung der Austrittsleistungen deterministisch; Abweichungen = Ermessen, offenlegen] | geplant | 2·2·2=8 | **offen** |
| Güterrechtliche Auseinandersetzung / Vorschlag | B | ✅ [E: Errungenschafts-Arithmetik (Art. 215) deterministisch bei erfassten Massen; Massen-Zuordnung = Eingabe] | geplant | 2·2·2=8 | **offen** |
| Unterhalt (Kindes-/Ehegatten-) | B | ✗ [bestätigt: Ermessen — Backlog] | Backlog | — | entschieden ✗ |
| Trennungsvereinbarung · Scheidungskonvention · Elternvereinbarung | V | ◐ Gerüste [E: stark wertend + Genehmigungsvorbehalt] | geplant | 4 | **offen** |
| **Eheschutzgesuch · gemeinsames Scheidungsbegehren · Scheidungsklage (unbegründet zuerst!) · Abänderungs-/Massnahmengesuch · Konkubinatsauflösung** | V | ◐ Gerüste mit deterministischen Begehren-Rastern [Bauspez. liegt: recherche/familienrecht-klagen-vorlagen.md, 10.6.2026 — Voraussetzung: BO-Baustein-Rahmen §10] | Lücke | 2·3·2=12 | **offen** |
| Vaterschafts-/Anfechtungs-/Unterhalts-Fristen (263/256c/262 ZGB · 279 ZPO · 546 OR · 313 II ZGB · KESB 450b/445 III · 291 III ZPO) | F | ✅ als Tagerechner-PRESET-Paket [Bauspez. dito; 256c = Doppelfrist min(rel,abs); ZH-KESB ohne Stillstand!] | Lücke (Presets) | 2·3·3=18 | **offen** |
| Zuständigkeits-Routing Gericht/KESB (315/315a/b, 298b III, 304 II) | Z | ✅ vierter Rechtsweg-Tab der Zuständigkeits-Engine [deterministisch; Bauspez. dito] | Lücke (§0a) | 2·3·3=18 | **offen** |

### Gesellschaftsrecht

| Aufgabe | Typ | Vorschlag | Ist | HRD | Entscheid |
|---|---|---|---|---|---|
| GmbH-/AG-Gründung (Dokumentmappen) | V | ✅/◐ [V: Beurkundungs-Grenze §8 eingebaut] | gebaut | 6 | implizit ja (AG-Abnahme liegt vor) |
| Kapitalerhöhung | V | ✅ | gebaut | 6 | implizit ja |
| **Kapitalverlust & Überschuldung (725 ff.)** | B | ✅ EIN Rechner für beide Schwellen [V-Bedarf: 725a/b Rev. 2023] | geplant (2 Karten → 1) | **2·3·3=18** | **offen** |
| Liberierungsgrad | B | ✗ eigene Karte [V: effektiveLiberierung() ist in Gründungs-/KE-Masken die eine Geld-Quelle] | geplant | — | **offen** |
| Beteiligungs-/Stimmrechtsquoten + GV-Quoren (703/704) | B | ✅ EIN «GV-Quoren»-Rechner [E] | geplant | 2·2·3=12 | **offen** |
| Gesellschaftsrechtliche Fristen (700, 706a …) | F | ✗ Karte → Tagerechner-Presets [E: Einberufung 20 T. fix, Anfechtung 2 Mt. verwirkend ohne Stillstand — verifizieren] | geplant | — | **offen** |
| Statuten (eigene Karte) | V | ✗ Dublette [V: Statuten kurz/lang sind Teil der Gründungs-Mappen]; eigenständig nur künftig «Statutenänderung» | geplant | — | **offen** |
| GV-/VR-Beschluss (Protokoll-Vorlagen) | V | ✅ [E: formal-deterministisch; Konstituierung etc. als Muster vorhanden] | geplant | 2·2·2=8 | **offen** |

### Straf

| Aufgabe | Typ | Vorschlag | Ist | HRD | Entscheid |
|---|---|---|---|---|---|
| Örtliche Zuständigkeit/Gerichtsstand | Z | ✅ [V] | gebaut | 12 | implizit ja |
| **Strafrechtliche Verjährung (97 ff.)** | F | ✅ [V 7.6.: eigenes Regime] | geplant | **2·3·2=12** | **offen** |
| Verfahrens-/Haft-/Strafantragsfristen | F | ✗ [V: §0-Triage] → Presets | entschieden | — | entschieden ✗ |
| Strafanzeige · Strafantrag · Einsprache Strafbefehl · Akteneinsicht | V | ✅ [E: strukturierte Eingaben, deterministische Form] | geplant | 2·2·2=8 | **offen** |
| Entschädigungsbegehren (429) · Adhäsionsklage | V | ◐ Gerüste [E: Beträge wertend] | geplant | 4 | **offen** |

### Verwaltung / Steuer / Sozialversicherung / Übrige

| Aufgabe | Typ | Vorschlag | Ist | HRD | Entscheid |
|---|---|---|---|---|---|
| **VwVG-Fristen (22a-Stillstand)** | F | ✅ [V 7.6.] | geplant (`beschwerde-verwaltung`) | **2·3·3=18** | **offen** |
| **ATSG-Fristen (38 IV — Monats-Stillstand!)** | F | ✅ [V 7.6.] | geplant (`sozialversicherung`) | **2·3·3=18** | **offen** |
| Steuer-Verjährung (DBG/StHG) | F | ✅ [V 7.6.] | geplant | 1·2·3=6 | **offen** |
| Vergabe-Fristen | F | OFFEN — Regime-Recherche (22a II nimmt Beschaffung aus; IVöB/GATT-Fristen) | geplant | ? | **offen (Recherche)** |
| Baurecht-Fristen | F | OFFEN — kantonale Sonderstillstände? | geplant | ? | **offen (Recherche)** |
| Ausländer-/Asyl-Fristen | F | OFFEN — Asyl-Sonderfristen vs. VwVG (Verhältnis prüfen) | geplant | ? | **offen (Recherche)** |
| Verrechnungssteuer (Rückerstattung) | B | ✅ [E: 35% + Verwirkungsfristen deterministisch; Praxiswert tief] | geplant | 1·2·3=6 | **offen** |
| Grundstückgewinn-/Handänderungssteuer | B | ✅ [E: kantonale Tarife deterministisch — grosse Datenschicht, hoher Pflegeaufwand] | geplant | 2·2·2=8 | **offen** |
| AHV-Beiträge | B | ✗ [E: Treuhand-Domäne, nicht Anwalts-Alltag] | geplant | — | **offen** |
| Datenschutz-Fristen (DSG 25: 30 T.) | F | ✗ Karte → Tagerechner-Preset [E: fixe Frist — verifizieren] | geplant | — | **offen** |
| Auskunfts-/Löschungsbegehren DSG | V | ✅ [E: einfache strukturierte Schreiben] | geplant | 2·1·3=6 | **offen** |

### Übergreifende Werkzeuge

| Aufgabe | Typ | Vorschlag | Ist | HRD | Entscheid |
|---|---|---|---|---|---|
| Tagerechner · Fristenspiegel · Teuerungsrechner | W | ✅ | gebaut | 27/18/6 | implizit ja |
| Ferien-Checker · Ferien-Assistent | W | ✗ eigene Karten → im Tagerechner aufgehen (zeigt Stillstand bereits an) [E] | geplant (2) | — | **offen** |
| Mandatsaufnahme-Formular | W | ✅ — wird zum **Fall-Kontext-Fundament** (G3.3: Parteien/Az einmal erfassen → Rechner/Vorlagen) | geplant | 2·2·3=12 | **offen** |
| Kostenblatt-Export | W | ◐ später mit `prozesskosten` | geplant | 4 | **offen** |
| Checklisten (generische Karte) | W | ✗ [E: kein konkretes Werkzeug — Checklisten leben je Thema] | geplant | — | **offen** |

---

## C · Lücken-/Bau-Rangliste (greift NACH §0a-Öffnung; Reihenfolge = Praxiswert)

1. **Gerichts-/Parteikosten kantonal** (`prozesskosten`, inkl. Vorschuss/
   BGer-Gebühren) — Dossiers liegen zweifach geprüft (Gerichtsgebühren 26/26,
   Anwaltstarife); STRATEGIE-PLATTFORM: höchster zahlungsfähiger Wert. HRD 12,
   Daten fertig → ROI-Spitze.
2. **BGG-Fristen** (Art.-46-Regime [V], Dossier/Decision-Tree liegt). HRD 18.
3. **VwVG-** und **ATSG-Fristen** (je [V]; §4 neu: EIN Verfahrensfristen-
   Einstieg mit intern getrennten Regimes denkbar — Davids Konsolidierungs-
   Entscheid). HRD je 18.
4. **Existenzminimum & Pfändungsquote** (Richtlinien-Datenschicht). HRD 18.
5. **Kapitalverlust/Überschuldung 725** (ein Rechner). HRD 18.
6. **Mietzinsanpassung** (Referenzzins-Staffel + LIK-Baustein vorhanden). HRD 12.
7. **Strafrechtliche Verjährung** ([V]). HRD 12.
8. **Erb-Ausgleichung/Herabsetzung** (Regelwerk liegt). HRD 12.
9. **Mahnung** (free; §0-bestätigt, Quick-Win B.9). HRD 9.
10. **Rechtsvorschlag/Rechtsöffnungsbegehren/Schuldanerkennung** (SchKG-
    Vorlagen-Paket). HRD 12–18.
11. **Mandatsaufnahme** als G3.3-Fundament (kein Rechtsregime, aber
    Workflow-Hebel). HRD 12.
12. Danach: GV-Quoren · Ferien-Rechner · Vorsorgeausgleich · Güterrecht-
    Vorschlag · Straf-Vorlagen · DSG-Vorlagen · Überstunden · Massen-
    entlassung · Verrechnungssteuer · GGSt (Datenschicht!) · Darlehen/Kauf.
13. OFFEN nach Recherche: Vergabe · Baurecht · Ausländer/Asyl · IPRG-Zuschnitt.

**Gesperrt bis David öffnet (§0a, ausdrücklich):** Zwei-Kategorien-
Kapitalmodell AG · GmbH-Volldokumente G1–G7 · Eheschutz/GlG-Engine ·
BGG-Stufe 2 in `bestimmeRechtsmittel`.

## D · Offene Fall-für-Fall-Entscheide David (kompakt)

**Streichen/Falten (✗-Vorschläge):** 13. Monatslohn · Schadenszins→Preset ·
Rechtsmittelprüfungs-Karte · Kostenvorschuss→prozesskosten · BGer-Gebühren→
prozesskosten · Liberierungsgrad · Gesellschafts-Fristen→Presets ·
Statuten-Karte · familie-fristen · AHV-Beiträge · Datenschutz-Fristen→Preset ·
Ferien-Checker+Assistent→Tagerechner · Checklisten-Karte · SchKG-Einzelfrist-
Karten→Presets · Nebenkostenprüfung (Lücke bleibt Lücke) · Arbeitszeugnis.

**Neu/Hochstufen (✅-Lücken):** Massenentlassung · Mängelrüge-Schreiben (◐) ·
Mandatsaufnahme als Fall-Kontext.

**Recherche-Aufträge vor Entscheid:** Vergabe-/Baurecht-/Ausländer-Fristen ·
706a/700-Regime-Freiheit · Schadenszins-Identität · DSG-25-Fristcharakter ·
familie-fristen-Restbestand.

**Abnahme-Start (A-Rangliste):** Tagerechner → zpo-fristen → schkg-fristen →
zustaendigkeit → mietrecht → … (Blocker: Feiertags-Kantonsverifikation).

**Empirie-Notizen (Optimierungs-Research 12.7.2026, `FAHRPLAN-OPTIMIERUNG-2026-07.md`
O-6 — ändert KEINEN Entscheid-Status, senkt nur den Bau-Aufwand nach Öffnung):**
Kostenvorschuss → Berechnung liegt komplett (`prozesskosten.ts:398–402` Art. 98 ZPO
Stand 1.1.2025 + BGG Z.217; Falten = Deep-Link) · BGer-Gebühren → doppelt verifizierter
Tarif `src/data/tarif/bundesgericht.ts` + `instanz='bundesgericht'` in der Engine
(`prozesskosten.ts:63/194`), nur Verdrahtung fehlt · Schadenszins → 5%-Mechanik inkl.
Kumulationsverbots-Warnung (BGE 122 III 53/131 III 12) fertig in `verzugszins.ts:301–302`
(stützt den Preset-Vorschlag) · Mietzinsanpassung (C-Rang #6) → LIK-Reihe+Teuerungs-Engine
liegen, fehlt nur BWO-Referenzzins-Reihe + VMWG-Formel (Art. 13/16); Verfallsregister-
Kandidat (Quartals-Pflege) · Straf-Verjährung (C-Rang #7) → fristenEngine-Muster erprobt,
StGB-Volltext im Korpus, Nachbar-Engines existieren · Ferien → Verhinderungs-Eingaben
überschneiden mit `lohnfortzahlung.ts` (Formular-Synergie für den EIN-Rechner-Vorschlag) ·
SchKG-Vorlagen-Paket (C-Rang #10) → Vorlagen-Framework voll ausgebaut, je Vorlage nur
Schema+Seite.

---

## Backlog (Ermessen — bewusst nicht im Katalog; bestätigt)

Kindes-/Ehegattenunterhalt · Bonus-Qualifikation · Mietzinsherabsetzung bei
Mängeln · Konventionalstrafe-Herabsetzung · UVG-/IV-Leistungsbemessung ·
Schadenersatz/Genugtuung · Geldstrafen-Tagessatz · Konkurrenzverbot-
Zulässigkeit.
