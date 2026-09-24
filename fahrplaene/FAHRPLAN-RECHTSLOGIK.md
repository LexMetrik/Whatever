# FAHRPLAN — Rechtslogik-Umsetzungsplan (Befund-Wellen, Stand 23.9.2026)

> **Detailquelle zu den ROADMAP-Schritten `W2·30-RL-W0` … `W2·30-RL-W4`** (Abschnitt
> «Rechtslogik — Befunde Prüfung 23.9.2026») — nie zweiter Einstieg, immer nur
> verlinkte Detailquelle. Je RL-Einheit liegt zusätzlich EIN Posten unter dem
> Dach ihrer Welle (`npm run plan:posten -- info RL-xx` bzw. Verzeichnis
> `plan/posten/`).

**Provenienz:** Prüfung Rechtslogik 23.9.2026 (fünf unabhängige Miner-Teile A–D +
Judge, Details: `~/Documents/David/03_Projekte/LexMetrik/pruefung-rechtslogik-2026-09-23/`)
→ `UMSETZUNGSPLAN.md` (Abschnitte 3–8, Zeilen/Anker am Worktree-Stand **54ef46198**
nachgemessen) → Bauplan-Aufnahme **RL-01** (dieser Fahrplan + ROADMAP-Schritte +
Posten, Go David 23.9.2026 «Ja, wie vorliegend», W-01).

**Entscheide, die für die ganze Kette gelten:**
- **W-01 (entschieden):** Plan wird wie vorliegend umgesetzt und in ROADMAP/plan
  aufgenommen; Bau in eigener Session per Übergabe-Chip, **parallel** zum
  Werkbank-Umbau, nicht in dessen PRs.
- **W-02 (entschieden, Variante b):** Änderungen an den Prüf-Toren selbst
  (`scripts/gegenpruefung/kern.ts`, CI-Torschritte, Golden-Werkzeug) kommen
  **sofort** in RL-02 in die Gegenprüfungs-Grenze (eigener «Tor-Pfad» im Tor,
  nicht nur als Auftragsbedingung).
- **F3-A16-Warnhinweis (BGG-Stillstand, W-07):** nur Bundesgericht (RL-15); die
  ZPO-Ausdehnung ist Recherche-Posten unter Welle 2a, nicht Teil des Baus.
- **UR-Verbandstarif (W-14, entschieden):** «nicht mehr rechnen» gilt für **alle**
  23 Einträge (21 in `beurkundung.ts`, 2 in `notariat-grundbuch.ts`), nicht nur
  den Grundstückkauf.

---

## §1 · Reihenfolge und Wellen

Regeln (Skill `auftrag` Ziff. 3): verwandte Fläche bündeln, **nie Risiko-Klassen
mischen**; Welle 0 zuerst — die schweren Fixes F4-01 (mietrecht.ts), F5-05
(gewaehrleistung.ts), B3-01 (erbteilung.ts), Q6 (lohnfortzahlungSkalen.ts),
R1-02/03 (zpoFeiertage.ts), F1-01 (zpoPresets.ts) liegen heute ausserhalb von
`istRisikoPfad()` und ändern teils Tests/Golden — ohne RL-02/RL-03 würden sie per
Auto-Merge ohne Zweitblick landen (Befund S1-01/S1-02). Jede Einheit: vor
Baubeginn Kollisions-Sonden (§0 Ziff. 5 der Dispatch-Klausel), `golden:vergleich`
vor und nach dem Fix.

**Nachtrag 23.9.2026:** RL-11 (Gesetzesleser «Aufgehoben seit») ist direkt nach
Welle 0 vorgezogen (keine Abhängigkeit, kein Blocker, hoher Rot-Beweis-Wert:
heute ≥ 87 Artikel würden das neue Tor rot melden) — Reihenfolge in den
ROADMAP-Schritten spiegelt das (`W2·30-RL-W1` beginnt mit RL-11 vor RL-04…RL-14).

Der folgende Block ist der **wörtliche Inhalt von UMSETZUNGSPLAN.md Abschnitt 3**
(Reihenfolge der Bau-Einheiten) — nicht umformuliert, damit Detail-Zeilen,
Golden-Namen und Blocker-Verweise gegen den Plan verifizierbar bleiben.

### Welle 0 — Voraussetzungen (1 Session, 3 PRs)

**RL-01 Bauplan-Eintrag und Befund-Buchhaltung** (D-D7 Teil 1; S-X1)
- Inhalt: nach W-01 Fahrplan/ROADMAP-Schritt(e) mit eigenem `feld:` (`rechtslogik`)
  anlegen; je RL-Einheit ein Posten in `plan/posten/` mit Befund-IDs; Altbefunde
  S3/S3b/S3c (§7 Zuordnungstabelle unten) als Posten; R2-09 und die
  Recherche-Posten aus §5 (Quellenfragen) als Posten. Befundliste um die
  falsifizierte «Phantom-URL»-Zeile (S1-17) ergänzen (§0 Ziff. 2b, nicht
  streichen).
- Klasse doku · Tor nein · GP nein · Tests/Golden keine · 1 PR · Abh.: W-01 ·
  Blocker: W-01.
- **Das ist dieser PR** (Commit-Trailer `Roadmap: W2·30-RL-W0`).

**RL-02 Risiko-Grenze** (D-D1; S1-01; Risikopfad-Lücken aus A-N6, B-N2, C-N1/N2
zusammengeführt)
- Dateien: `scripts/gegenpruefung/kern.ts` (explizite Basename-Liste statt
  breiterer `RECHNEN_RE`), `src/tests/gegenpruefung.test.ts:145 ff.`
- Aufzunehmen (Vereinigung aller Teile): lib: verzugszins, lohnfortzahlung,
  erbteilung, mietrecht, gewaehrleistung, teuerung, datumsUtils,
  emissionsabgabe, notariatGrundbuch, notariate, vdSchlichtung, zpoPresets;
  data: zpoFeiertage, schkgFeiertage, lohnfortzahlungSkalen, likReihe,
  mietTermine, zustaendigkeitKosten, zustaendigkeitKantone. **Im Bau zu
  entscheiden** (von D nicht gelistet, von A/C gemeldet): famStatusPresets.ts
  (A-N6), presetIndex.ts, gerichtszitat.ts (C-N2), src/lib/pdf/** (D-N3),
  Katalogtext-Dateien startseiteKartenBetraegeWerkzeuge.ts /
  startseiteVorlagenEingabenGesellschaft.ts (C-N1: heute nur
  startseiteKartenFristen.ts zufällig über «frist» erfasst),
  src/pages/VorlageVerjaehrungsverzicht.tsx (Rechtshinweis-Text, C-N4).
  Adress-/Behördendaten → W-03. **Nach W-02 (b), entschieden 23.9.: zusätzlich
  Tor-Pfad** — scripts/gegenpruefung/**, .github/workflows/ci.yml
  (Torschritte), scripts/gate.sh, scripts/golden-outputs.ts + Golden-Datei,
  scripts/analyse/test-assertion-diff.ts; Rot-Beweis §6.7 auch dafür; Achtung
  Selbstbezug: der PR, der kern.ts ändert, fällt selbst unter die neue Regel →
  Gegenprüfung für RL-02 von Hand anordnen. **Zusatz LESER-Session 23.9.:**
  src/lib/rechtsprechung/bezuege.ts und public/rechtsprechung/bezuege/*.json
  (entscheiden «kein Entscheid» vs. «Ladefehler» und Artikel-Zuordnung)
  aufnehmen.
- Klasse bau (Tor) · kern.ts ist Prüflogik (Tor nein) → **freiwillige GP als
  Auftragsbedingung** (W-02) · Tests: neue Erwartungen je Pfad `true`,
  Gegenprobe kantone.ts/bruch.ts `false`; **Rot-Beweis §6.7** (neue
  Erwartungen gegen alten kern.ts rot, dann grün) · Golden keine · 1 PR · Abh.:
  RL-01 · Blocker: W-02 (Art der GP), W-03 (nur Umfang Adressdaten; ohne
  Entscheid Variante (c) bauen).

**RL-03 Fachänderungs-Riegel** (D-D2 PR 1; S1-02, S1-05, S1-06)
- Dateien: .github/workflows/ci.yml (neues Tor; Rückbau :801 testtreue und
  Jules-Zweig :826–862), scripts/analyse/test-assertion-diff.ts, neuer
  Tor-Kern, scripts/gate.sh:135–139, scripts/check-testtreue.ts +
  scripts/testtreue-kern.ts (streichen). Trailer `Fachaenderung: <Norm> —
  <Befund-ID>` in die bestehende Konvention §14.5 (Skill `auftrag`) einhängen,
  keine zweite.
- Klasse bau (Tor, Rückbau 2 Tore) · Tor nein → freiwillige GP (W-02) · Tests:
  Kern-Test Trailer-Pflicht; **Rot-Beweis** per Doku-PR-Nullprobe + Test-PR mit
  geänderter Assertion ohne Trailer · Golden keine (Golden-`werte`-Diff erst
  mit RL-48) · 1 PR · Abh.: RL-02 · Blocker: W-02. **Muss vor jeder Einheit mit
  Eintrag in §3 gelandet sein.**

### Welle 1 — die 11 schweren Befunde + RL-11 vorgezogen (≈ 3 Sessions, 13–15 PRs)

Reihenfolge: RL-11 zuerst (vorgezogen, kein Blocker), dann ohne David-Blocker
nach Schaden (Teil A: B1 → B3a → B7 → B4a → B5), dann Beträge/Vorlagen/Leser/
Anzeige, am Ende die zwei entscheidabhängigen. Fehlt ein Entscheid, geht die
Session in Welle 2a weiter statt zu warten.

| RL | Befunde (Herkunft) | Dateien (Kern) | Klasse | Risikopfad / GP | §6.3 / Tests | Golden | PRs | Abh. | Blocker |
|---|---|---|---|---|---|---|---|---|---|
| **RL-11** Gesetzesleser «Aufgehoben seit» | R2-01 + neues Tor «aufgehoben ⇒ kein lebender Text» (C-C5 PR 1) | src/lib/normtext/historie-parse.ts:342-345, scripts/normtext/historie-generieren.ts:68, public/normtext/historie/*.json; Anzeige-Dateien unverändert | daten (Extraktion) | Tor ja | neu: AVIG 60 → kein aufgehobenSeit, giltSeit 2026-01-01; EOG 1a, BBV 66; Gegenprobe OR 48; **Rot-Beweis** des neuen Tors (heute ≥ 87 rot) | historie/*.json ändern sich (≥ 87 Artikel) → Datenänderung deklarieren; `check:golden-normtext`/`check:historie` | 1 | — | — |
| **RL-04** Mietkündigung Zustelltag | F4-01 (+F4-06 Miete-Tests) (A-B1) | src/lib/mietrecht.ts:17-18/:67-83/:346/:356-361, MietrechtForm.tsx:200; Folge: fristenspiegel/vermieterkuendigung.ts, vorlagen/kuendigungMieter.ts:68 (+ Vermieter-Vorlage) nur Tests | rechnen (Form-Hint als Folgeänderung) | Tor nein → **manuell** (mietrecht.ts; nach RL-02 ja) | keine Zementierung; neu: 1.9.2025 → 31.12.2025, 2.10.2023 → 31.12.2024, möbl. Zimmer 18.8.2025 → 30.9.2025, je 1 Fall Spiegel + Vorlage | miet:ordentlich, miet:geschaeft, absatz:miet:ordentlich: Werte gleich, Rechenweg-Text ändert → deklariert (§5 Nr. 19) | 1 | RL-03 | — |
| **RL-05** SchKG-Weiterzug Art. 18 | F2-01 (A-B3a Teil 1) | src/lib/schkgPresets.ts:210-212 (`weiterzug_ab` → modus `kein`) | rechnen | Tor ja | neu: 10.7.2026 ZH → 20.7.2026 (Art. 18/63 SchKG, 5A_730/2023) | keine | 1 | — | — |
| **RL-06** Gewährleistung Übergangsrecht | F5-05/S3-c, S3-b (`!sia` :242-243), F5-06, F5-08 (A-B7) | src/lib/gewaehrleistung.ts:166/:239/:242-243/:271-280 | rechnen | Tor nein → **manuell** | **§5 Nr. 5** gewaehrleistung.test.ts:116-125 — **Soll neu herleiten** (Widerspruch 1.7.2026 vs 1.7.2027, §2 unten); neu: Werkvertrag 2.3.2026 + 2 J → 2.3.2028; Grundstückkauf alt 1 J | keine | 1 | RL-03 | — |
| **RL-07** Feiertags-Anknüpfung Rechtsmittel | F1-01, F3-04, Q8-01, Q8-02, Q8-03 (A-B4a) | zpoPresets.ts:96-98 (`schied_bger` → BGG-Engine), ZpoFristenForm, EinfacheFristForm.tsx:277/:353-356, allgemeineFrist.ts:69-72/:79, bggVwvgFristen.ts:159; zpoFristen.ts:248 **nicht** ändern | rechnen (Label-Texte als Folgeänderung; Art. 142 ZPO / 45 BGG / 90 StPO bleiben getrennte Regeln, §1 CLAUDE.md) | zpoPresets Tor nein → **manuell**; allgemeineFrist/bggVwvg Tor ja | neu: 21.8.2026 + 30 T, Vertretung ZH → 21.9.2026; Label je Regime; StPO-Hinweis ohne ZPO-Verweis | allg:30t/allg:klemm nur bei Grundtext-Änderung (Empfehlung: StPO-Zusatz nur im StPO-Pfad → byte-gleich) | 1–2 | RL-03 | — |
| **RL-08** Verjährung Altfälle | F5-01, F5-02, F5-07, F5-09 (Altfall-Teil) (A-B5) | src/lib/verjaehrung.ts:71/:545-548 | rechnen | Tor ja | neu: delikt_person 2005/2021/Stichtag 2023 → verjährt 1.3.2015; vertrag_person 2008 → 2018; Kenntnis 1.6.2018 → 3.6.2019 | keine (verj:* Beginn ≥ 2020) | 1 | — | — |
| **RL-09** Erbteilung Rückschlag | B3-01, UI-11 (B-E Teil 1; C extern) | src/lib/erbteilung.ts:140-143/:153-154, ErbteilungForm.tsx:289 | rechnen (Form-Hinweis als Folgeänderung) | Tor nein → **manuell** | **§5 Nr. 6/6b** erbteilung.test.ts:182-189 (120'000 → 70'000); neu: E14 → 100'000; Rückschlag Überlebender bleibt gekappt | keine (erb:* ohne Güterstand) | 1 | RL-03 | — |
| **RL-10** Mietvertrag Mindestdauer | VB-02, S3c-a (mietvertrag.ts:660 `/Mieter/g` ohne Wortgrenze) (C-C2) | src/lib/vorlagen/mietvertrag.ts:176-185/:244/:259/:660 | rechnen | Tor ja | **§5 Nr. 7** mietvertrag.test.ts:197-202 (MT-22); neu: Index 30.9.2031 / 29.9.2031, Staffel 30.9.2029 / 29.9.2029, Beginn 29.2.2028; Untermieter-Wortgrenze | voraussichtlich keine (belegen) | 1 | RL-03 | — |
| **RL-12** Status-Ehrlichkeit Katalog + Rechnerkopf | R3-04, R3-05, R3-07 (+VorlageKlageVereinfacht.tsx:406), R3-08, R2-10, R5-07, dann R3-06 (C-C6 = B-T12) | startseiteKartenFristen.ts:79/:137/:242, startseiteKartenBetraegeWerkzeuge.ts:82/:310, startseiteVorlagenEingabenGesellschaft.ts:16/:45, VorlageKlageVereinfacht.tsx:406; PR 2: RechnerKopf.tsx:14-80 (Status via `kartenProPfad()`, Text aus EntwurfLegende) | bau (Anzeige §8) | startseiteKartenFristen.ts Tor ja (nur via «frist»), übrige nein → GP empfohlen | neu: Katalog-Check «status ≠ geprüft ⇒ kein ‹amtlich verifiziert/abgenommen/geprüft›» (Wortgrenze; Rot-Beweis ≥ 4 Treffer); Render-Test Statuszeile je Oberkategorie | keine; prerenderte Seiten/SEO ändern sich | 2 | — | — (Kollision `W2·29-WERKBANK-KATALOGE`, §4 unten) |
| **RL-13** Sperrfrist-Rückfall | UI-06, S3f-3, dann UI-05 (A-B2a = C-C11-Teil) | src/lib/sperrfristen.ts:20/:348/:416-429/:448/:453; PR 2: KombinierteAnsicht.tsx:21-33/:36-47/:90-91 (Typen-Kopie → sperrereignisseShared.ts), KuendigungSperrForm | rechnen (PR 1) / bau (PR 2) | sperrfristen Tor ja; Formulare nein → GP empfohlen | **§5 Nr. 11** sperrfristen.test.ts:61-72, :205-217 (ausserhalb Q7 → W-05); neu: Rückfall 15.9.–31.10.2025 → Ende 31.10.2025, Zugang 18.9. nichtig; Vaterschafts-Resttage 10 → 10.6.2025 | voraussichtlich keine (belegen) | 1–2 | RL-03 | **W-04, W-05** |
| **RL-14** Verjährungsverzicht Vorlage + Rechner | PR 1 Vorlage: VB-01, VB-03, Page-Hint; PR 2 Rechner: F5-04/Q1/S3-e, F5-03, UI-04, F5-09 (Verzicht-Teil) (C-C1 + A-B6, eine Einheit, §2 unten) | vorlagen/verjaehrungsverzicht.ts:24-30/:75-83/:138-141, src/pages/VorlageVerjaehrungsverzicht.tsx:72; verjaehrung.ts:516-537/:576/:578, VerjaehrungForm.tsx:151/:288/:322 | rechnen | beide Tor ja (Page nein) | **§5 Nr. 12** verjaehrung.test.ts:154-167 + verjaehrung.property.test.ts:144-150 (ausserhalb Q7 → W-05); neu: VV-Fall V6 bis 31.12.2029 ohne «ab Beginn der Verjährung»; Grenze Erklärung 15.1.2026 → 15.1.2036 zulässig, 16.1.2036 Blocker; Verzicht ohne Dauer → Warnung; Einrede-ausgeschlossen-Satz | **§5 Nr. 18** vorl:vv-standard, vv-betrag-ohne-vorbehalte, vv-blanko, vv-gates-hoechstdauer neu segnen | 2 | RL-08 (gleiche Datei), RL-03 | **W-06, W-05** |

*(RL-12: VorlageKlageVereinfacht.tsx und RL-14: VorlageVerjaehrungsverzicht.tsx
sind Koordinationspunkte mit der VORLAGEN-Session — §4 unten.)*

### Welle 2a — mittlere Befunde Fristen (`W2·30-RL-W2A`, ≈ 3 Sessions, 11–14 PRs)

| RL | Befunde (Herkunft) | Dateien (Kern) | Klasse | Risikopfad / GP | §6.3 / Tests | Golden | PRs | Abh. | Blocker |
|---|---|---|---|---|---|---|---|---|---|
| **RL-15** BGG-Stillstand-Warnhinweis (entschieden) | A16, F3-05, F3-07, F3-08 (A-B4b) | bggVwvgFristen.ts:69/:121/:124-171/:128/:166 (fristenEngine.ts:126 ff. nur falls roher Ablauf geliefert werden muss; Endregel selbst unverändert) | rechnen | Tor ja | neu: BGG 10 T ab 18.3.2026 → 13.4.2026 + Warnung mit 30.3.2026; Gegenprobe ohne Warnung | frist:bgg-tage30-ostern, frist:bgg-tage10-weihnacht prüfen; sonst byte-gleich | 1 | — | W-07 nur für ZPO-Ausdehnung (nicht blockierend) |
| **RL-16** Probezeit | F4-02/S3c-b, F4-03 (=VB-05), F4-04, S3b-a (A-B2b) | kuendigungsfrist.ts:35-43/:67-68/:71-76/:184, sperrfristen.ts (Probezeit-Schritt) | rechnen | Tor ja | neu: VB 1.1.2025, PZ 1 Mt, krank 10.–19.1. → Ende 12.2.2025; Folgefall gültig statt nichtig; GAV-Halbmonat | keine | 1–2 (Warnung, dann Rechnung) | RL-13 (gleiche Datei) | **W-08** (nur Stufe 2) |
| **RL-17** SchKG Art. 63 Rest | F2-02, F2-08/R1-07, F2-09, R5-02, R5-03, Anker schkgPresets.ts:209 (A-N5) (A-B3a Teil 2) | schkgPresets.ts:10-12/:174/:189-192/:207-209, SchkgFristenForm, schkgFristen.ts:266-268, fristenspiegel/zahlungsbefehl.ts:33-36; zpoPresets.ts:91 (Etikett) | rechnen | Tor ja (zpoPresets nein → manuell für diese Zeile) | neu: 10.7.2026 → 20.7. (nein) / 5.8. (ja) | keine | 1 | RL-05 | **W-09** ✅ entschieden 24.9.2026 «nach Empfehlung» |
| **RL-18** SchKG Ferienzustellung | F2-03, F2-04 (A-B3b) | schkgFristen.ts:52-55/:103/:231/:295/:298, fristenspiegel/zahlungsbefehl.ts:29-39 | rechnen | Tor ja | **§5 Nr. 4/4b** schkgFristen.test.ts:183-184; property:59 nachmessen; neu: ZB 8.4.2026 → Fortsetzung frühestens 4.5.2026; RS 18.–27.3.2026 → Warnung | schkg:weihnachten nur ohne `ausloeser`-Bindung → Bindung empfohlen, dann byte-gleich | 1 | RL-03 | — |
| **RL-19** SchKG Hemmung/Validierung | F2-06, F2-05, F2-07 (A-B3c) | schkgPresets.ts:125/:129/:159, schkgFristen.ts:48/:103/:159-166, SchkgFristenForm | rechnen | Tor ja | neu: Verwertungsfrist mit Hemmung; Wechsel 13.7.+5, RS 15.–25.7. → 29.7. | keine | 1 | RL-17, RL-18 | — |
| **RL-20** ZPO-Presets | R5-01, R5-04, R5-05, F1-04, R1-08 (A-B4c; R5-07 → RL-12) | zpoPresets.ts:42/:50-53/:63-65/:74/:77/:91, zpoFristen.ts:229 | rechnen (Hinweistexte) | zpoPresets Tor nein → manuell; zpoFristen ja | neu: begruendung summarisch → 20.7.; `berufungsantwort_summar` → 20.7. (Art. 314 Abs. 1) | keine | 1 | RL-07 | — |
| **RL-21** StPO-Texte | F3-01, F3-02, F3-03, F3-09 (A-B4d) | strafRechtsmittel.ts:85/:151-170/:212/:217-219/:263 | rechnen | Tor ja | neu: nur_zivilpunkt → Art. 398 Abs. 5-Text | keine | 1 | — | — |
| **RL-22** Feiertags-Daten | R1-02, R1-03, R1-04 (NE), R1-01/05/09 (Quellen), F1-08 (A-B8a) | src/data/zpoFeiertage.ts:62-83/:80-81/:99 ff./:101/:107/:121-122, bibliothek/normen/feiertage-kantone-bj.md:10-12 | **daten** | Tor nein → **manuell** (nach RL-02 ja) | **§5 Nr. 13** feiertage-gegenprobe.test.ts:96-99, :155 (ausserhalb Q7 → W-05); neu: SO 21.4.2026 → 4.5.; UR 16.12.2028 → 27.12.2028; NE 31.12. | keine | 1–2 | RL-03 | **W-05**, W-10 (nur NE) |
| **RL-23** Feiertags-Hinweise | Q5 (GL 2.1.), Q8-04 (A-B8b) | zentrale Hilfe in zpoFeiertage.ts:167/:192 oder fristenEngine + alle Fristen-Engines | rechnen | Tor ja (Engines) | neu: GL 23.12.2025 → 5.1.2026 + Warnung; SG/SH ohne Warnung | keine | 1 | RL-22 | **W-11** ✅ entschieden 24.9.2026 «nach Empfehlung» |
| **RL-24** Allgemeine Frist / Tagerechner | F1-02, F1-06, F1-07, R5-06, UI-07, UI-08, S3f-7, VS3-08 (A-B9 = C-C11-Teile) | allgemeineFrist.ts:121-129/:227-232/:283-284/:388-393/:426-431, zpoFristen.ts:92/:289-291, famStatusPresets.ts:77, AllgemeineFristForm.tsx:266, EinfacheFristForm.tsx:109-110, ErbFristenForm.tsx:46/:104, erbFristen.ts:184-200 | rechnen (Form-Teile als Folgeänderung; bei grossem Form-Umfang 2. PR bau) | allgemeineFrist/erbFristen/zpoFristen Tor ja; famStatusPresets nein → manuell | neu: 22.7.2025 + 10 T Vertrag → 2.8.2025 / gesetzlich 4.8.2025; 31.3. rückwärts → 28.2.; 1.8.2025 ohne Kanton (VS3-08) | allg:30t/allg:klemm unverändert, wenn Standard «gesetzlich» | 1–2 | RL-07 (allgemeineFrist.ts) | **W-12** (nur UI-07) |
| **RL-25** Lohnfortzahlungs-Skalen | Q6/S3b-b, F4-05, S3f-10 (A-B10) | src/data/lohnfortzahlungSkalen.ts:48-50, lohnfortzahlung.ts | **daten** | Tor nein → **manuell** | **§5 Nr. 14** lohnfortzahlung.test.ts auf Alt-Bänder prüfen; neu: BE DJ 12 → 4 Mt, DJ 17 → 5 Mt | keine | 1 | RL-03 | **W-13** (nur DJ 25+/NW; DJ 1–19 sofort) |

### Welle 2b — mittlere Befunde Beträge/Tarife (`W2·30-RL-W2B`, ≈ 6 Sessions, 24–27 PRs)

| RL | Befunde (Herkunft) | Dateien (Kern) | Klasse | Risikopfad / GP | §6.3 / Tests | Golden | PRs | Abh. | Blocker |
|---|---|---|---|---|---|---|---|---|---|
| **RL-26** UR-Verbandstarif abschalten (entschieden, alle 23 Einträge — W-14) | B5-03, B5-04 (B-T4) | notariat-grundbuch.ts:28-32/:144, beurkundung.ts (21 UR-Einträge Quelle urilaw) | daten | Tor ja | **§5 Nr. 1/1a** notariatGrundbuch.test.ts:27; beurkundung.test.ts:84/:85/:103-105; tarifInvarianten.test.ts `null`-Toleranz | keine | 1 | RL-03 | **W-14** (entschieden: alle) |
| **RL-27** Tarif-Primitiv «Staffel mit Deckel und Rundung» | Voraussetzung für B2-01/02/03, B4-02, B5-01, B2-07/08, B4-10/11/12, B4-05/B5-06, B4-09 (B-T1) | src/lib/tarif/staffel.ts:90-118 (+ typen): `summe`, `basisRundung`, `ergebnisRundung`, Streitwertfaktor-Stufe, interpolierter Richtpunkt | daten | Tor ja | eigene Property-Tests; Bestand unverändert | byte-gleich (verhaltensneutral für Bestand) | 1 | — | — |
| **RL-28** Grundpfand-Kombiposten | B2-01, B2-02, B2-03, B4-02, B5-01, B5-02, B5-11, B5-12, VS1-03, S3e VS, S3b-e, S3b-f (B-T2) | notariat-grundbuch.ts:140-170 (GRUNDPFAND), notariatGrundbuch.ts:96-108, grundbuch.ts:46 ff., beurkundung.ts SONDERTARIFE.schuldbrief (16 Kantone, je Kanton vorher gegen Norm prüfen), beurkundungZusatzkosten.ts:82-91 PFANDSTEUER | daten | tarif Tor ja; notariatGrundbuch.ts Tor nein → **manuell** | neu je Kanton (VD 100k 650 / 1 Mio 4175 / 50 Mio 35'425; BS 10 Mio 26'000, 100k 700; AG 1 Mio 3633; LU 3625; OW 20 Mio 20'450; NW 10 Mio 12'175; JU 1 Mio 3873.50; SH 30k 110) | keine (ng:*:pfand nur ZH) | 2–3 (Deutschschweiz · Romandie+TI · Steuer-Trennung) | RL-27, RL-26 | Quellenfrage B4-02 (§5 unten, Q-1) vor Romandie-PR |
| **RL-29** Notariat-/Grundbuch-Staffeln | PR 1 B4-01 (TI, vorgezogen); PR 2 B2-04, B4-03, B5-05, B2-05 (VD/FR/VS/NE/GE/JU/BE); PR 3 B2-07, B2-08, B4-10, B4-12, B4-14, B4-04, AV-05, AV-09, S3e GE (B-T3) | notariat-grundbuch.ts NOTARIAT/GRUNDBUCH (:20/:33-36/:56-57/:79-90/:111/:112/:122/:129/:145), grundbuch.ts:147, beurkundung.ts:351/:409/:413 | daten | Tor ja | neu: TI 3 Mio 8375, 60 Mio 37'375; 1-Mio-Punkte FR 2455, VS 3875, NE 2950, GE 5200, VD 2875, JU 3525, BE 2915–4575; SO 1 Mio | **§5 Nr. 20** bk:grundstueckkauf:1_5mio:TI ändert (deklariert) | 3 | Rundungen (PR 3) nach RL-27 | — |
| **RL-30** Gerichtskosten-Staffeln | B4-06, B4-13, B5-09 (sofort, reine maxProzent-Daten); B4-05, B5-06, B4-11/S3b-c, B4-09 (nach RL-27); S3-f BGer-Klagetarif (Lücke) (B-T5) | gerichtskosten.ts:153-174/:232-247/:248-273/:334/:374 ff., parteientschaedigung.ts:343 ff. (TG), bundesgericht.ts (S3-f) | daten | Tor ja | neu: ZG 1500 → 220–330, 120'000 → 6000–7200; SG 80k 500–12'000, 1 Mio 500–36'000; AR 1 Mio 100–30'000; AI 1 Mio 500–36'000; TG 50k 6428.57 | keine | 2 | RL-27 (PR 2) | Quellenfrage SG welches Gericht (Q-3) |
| **RL-31** Verfahrensart-Tarife | B4-07, B4-08, B5-07, B5-08, B5-13, S3e SZ/OW, S3b-d (BE/GR), B5-10 (B-T6) | typen.ts, modifikatoren.ts:64-68/:80, gerichtskosten.ts:68-83/:93 ff., parteientschaedigung.ts:139-154, prozesskosten.ts | daten | Tor ja | neu: LU 300k vereinfacht PE 2250–15'000, GK 3000–10'000; UR vereinfacht 20k 1000–5000, summarisch 2 Mio 200–20'000; OW 1 Mio PE 10'000–35'000, summarisch 400–5000 | keine | 2 (Struktur+LU · UR/OW) | — | B5-10 erst nach Quellenfrage Q-2 |
| **RL-32** VS-Parteientschädigung | AV-02 (41'200 streichen, sofort), AV-01 + Q2 (B-T7) | parteientschaedigung.ts:401/:421-423/:430-435 | daten | Tor ja | **§5 Nr. 15** prozesskosten.property.test.ts:117-126 — normbelegte Ausnahme (LTar Art. 32), nicht Q7-gedeckt → W-05 | keine | 1 | RL-03 | **W-15** (Divergenz-Zellen), W-05 |
| **RL-33** MWST Notariate | B2-06, Q3, Q3b, VS1-04 (notariate.ts), B2-12, B2-13, Kombi-Rechner-Text «(freies Notariat)» (B-N3) (B-T8) | beurkundungZusatzkosten.ts:8/:24-25/:34/:38/:43-52/:74-75/:119, notariate.ts; PR 2 (bau): notariatGrundbuch.ts:112, NotariatGrundbuchForm.tsx:32 | daten (PR 1) / bau (PR 2) | beurkundungZusatzkosten Tor ja; notariatGrundbuch/Form nein → manuell | **§5 Nr. 2** beurkundungZusatzkosten.test.ts:31, :51; neu: ZH AG-Gründung 500 → +40.50; ZH Beglaubigung ohne Aufschlag; ZG «inbegriffen»; 2500 → 202.50 | keine | 2 | RL-28 (gleiche Datei notariatGrundbuch.ts, seriell) | **W-16** (Restkantone; 7 belegte Kantone + ZG sofort) |
| **RL-34** Emissionsabgabe | UI-02 (Form), B2-09, S3e Agio (lib) (B-T9) | BeurkundungForm.tsx:100-102/:115-118/:156; beurkundungZusatzkosten.ts:58-60/:163 ff. | bau (Form) / daten (lib) — **2 getrennte PRs** | lib Tor ja; Form nein → GP empfohlen | neu: AG 5 Mio → 40'000; Genossenschaft 1,5 Mio → 5000 | keine | 2 | RL-33 (gleiche lib-Datei) | — |
| **RL-35** Art. 51 Abs. 4 BGG Kapitalisierung | Q4, Q4-F1, dann VS2-01 (Rückbau `bgerKapitalwert20x`) (B-T10 = D-VS2-01) | streitwert.ts:96 (geteilte Kapitalisierung), bgerRechtsweg.ts:85/:125-130/~:294-333, BgerRechtswegForm.tsx:90/:197 | rechnen (PR 1 Sofort-Hinweis Form = bau) | Tor ja (Form nein) | **§5 Nr. 17** bgerRechtsweg.test.ts:166, property:166-171 fallen mit dem Helfer (Rückbau); neu: Unterhalt 1000/Mt → 240'000; Miete 2000/Mt 5 J → 120'000; Rechtsöffnung keine Kapitalisierung | bger:* (11) byte-gleich, solange Feld optional; Annahmen-Text-Änderung → alle bger:* deklarieren | 2 | RL-03 | **W-17** ✅ entschieden 24.9.2026 «nach Empfehlung» |
| **RL-36** §5-Kopien Tarifdaten | VS1-01, B2-10, S3c-c (B-T11) | zustaendigkeitKosten.ts:48-222, useZustaendigkeitForm.ts, notariatsgebuehrenGruendung.ts:36-53/:59/:80-101, pages/vorlage-ag-gruendung/schritte-dokumente.tsx:4/:88, schlichtung.ts (AI zuerst korrigieren, GGV Art. 7) | daten | notariatsgebuehrenGruendung Tor ja; zustaendigkeitKosten nein → **manuell** | **§5 Nr. 16** notariatsgebuehren.test.ts:30 (BE 25 Mio → 16'450–27'350) → W-05; neu: Konsistenztest Zuständigkeits- = Prozesskostenrahmen | zust:*-Golden vorher prüfen | 2 | RL-30 (gleiche Tarifquellen) | W-05 |
| **RL-37** ZPO-Kosten Bund + Verfahrensart | B1-01, B1-02/S3-d, B1-03, B1-04 … B1-09, UI-01 (B-T13 + C-UI-01) | prozesskosten.ts:205-206/:258/:428-447/:499-512 (+ `verfahrensartAbgeleitet`), streitwert.ts:62/:75/:232/:248-296, gebvKosten.ts:68-76/:160-172; Form-PR: ProzesskostenForm.tsx:106/:132/:136/:149/:157/:296 | rechnen / bau (Form getrennt) | Engines Tor ja; Form nein | **§5 Nr. 3** prozesskosten.test.ts:369-370; neu: Miete 50'000 vereinfacht → ausgeschlossen; 9'000/10'000 Berufung; Lohn-Rechtsöffnung 8'000; 20'000 LU → vereinfacht 450–3'000 | pk:miete:25k:ZH prüfen; Form-Default golden-neutral | 2–3 | RL-03 | **W-18** (nur Form) |
| **RL-38** Erbteilung/Verzugszins/Teuerung Rest | B3-02, B3-03 (= UI-03 Engine-Teil), B3-04, S3-a, UI-03 (Form); B3-05, R4-09, AV-03, B3-06; B3-07, B3-08, B3-09 (B-E Rest) | verzugszins.ts:31/:105-113/:132-134/:186/:316, VerzugszinsForm.tsx:169; likReihe.ts:13-14, lik-reihe-generieren.py:49, teuerung.ts:65-67/:96; erbteilung.ts:13-14/:200, types/erbrecht.ts:22-24 | rechnen / daten (LIK-Reihe getrennt) | alle Tor nein → **manuell** (nach RL-02 ja) | neu: V6 Zinsforderung Mahnung → kein Zins; Mahnung → Folgetag (BGE 103 II 102); T1 LIK → 2'172.00; Enkel-Warnung Art. 457 Abs. 3 | verzugszins-/teuerung-/erb-Fälle vor Bau `golden:vergleich`; B3-08-Warnung nur bedingt | 2–3 (Verzugszins · LIK+Teuerung · Erb-Kleinteile) | RL-09 (erbteilung.ts) | — |

### Welle 2c — mittlere Befunde Vorlagen/Zuständigkeit/Leser (`W2·30-RL-W2C`, ≈ 4 Sessions, 18–19 PRs)

| RL | Befunde (Herkunft) | Dateien (Kern) | Klasse | Risikopfad / GP | §6.3 / Tests | Golden | PRs | Abh. | Blocker |
|---|---|---|---|---|---|---|---|---|---|
| **RL-39** Werkvertrag | VC-01, VC-02, VC-06/07 (C-C4) | vorlagen/werkvertrag.ts:98-99/:150-152/:158/:225-228 | rechnen | Tor ja | neu: unbeweglich / beweglich-eingebaut → «60 Tage» + Art. 370 Abs. 4; rein beweglich «sofort» | **§5 Nr. 21** vorl:wv-unbeweglich-aufwand, wv-gates-unbeweglich (± vorl:wv-einfach/experte) neu segnen | 1 | RL-06 (nur Textabstimmung) | — |
| **RL-40** Familienrecht | PR 1 VD-01+VD-10; PR 2 VD-02, VD-03, VD-04, VD-05; PR 3 VD-06, VD-07, VD-08, VD-11 + Tests VD-09 (C-C7) | vorlagen/scheidungsklage.ts:208/:227-230, scheidungsbegehren.ts:204, eheschutzgesuch.ts:244-251, konkubinat.ts | rechnen | Tor ja | **§5 Nr. 10** vorl:sk-kinder-115 (Q7 Nr. 10); neu: Kind geb. 2007 → kein Sorge-Antrag; 17 J. 364 T. → Antrag; Art. 114 ZGB an der Grenze | vorl:sk-*, sb-*, eg-*, kk-* (§5 Nr. 22) | 3 | RL-03 | **W-19** (nur VD-08) |
| **RL-41** Vorlagen Gesellschaft/Prozess | PR 0 Golden-Fälle Kapitalerhöhung/GmbH-Gründung/Klage vereinfacht ergänzen (C-N6); PR 1 VA-01, VA-02, VA-05; PR 2 VA-04; PR 3 VA-06 → VA-03 (C-C3) | vorlagen/kapitalerhoehung.ts:101/:179/:274/:540, gruendungsunterlagen.ts:219/:226/:510, gruendungGmbhDokumente.ts:317-319, gruendungAgDokumente.ts:347-349, klageVereinfacht.ts:264/:334-336, klageOrdentlich.ts:142 | rechnen | Tor ja | **§5 Nr. 8/9** kapitalerhoehung.test.ts:97 (ergänzen), gruendungGmbhDokumente.test.ts:168-172 | neue Golden-Fälle zuerst (PR 0), Fix-Diff dann sichtbar; agDokumentmappe prüfen | 3–4 | RL-07 (VA-06 gleiche Ursache Feiertags-Kanton) | **W-20** (VA-02) |
| **RL-42** Straf-/Zivilzuständigkeit | Z1-01, Z1-02, Z1-07; Z1-03, Z1-04, Z1-05, Z1-06, Z1-08, VS3-19 (C-C8) | strafZustaendigkeit.ts:95-100/:133-136/:146-149, zustaendigkeit/* (inkl. rechtsmittel.ts:263) | rechnen | Tor ja | Z1-07: strafZustaendigkeit.test.ts:144-146 verschärfen (§5 Nr. 23); neu: Minderjähriger Tatort BE, Aufenthalt ZH → Forum ZH | keine | 2 | — | — (Z1-06-Anker vor Bau prüfen, §2 unten) |
| **RL-43** Leser-Fassungsstand Rest | R2-02, R2-04, R2-03 + VS3-18, R2-08 (C-C5 + D-VS3-18) | historie-parse.ts:294-296, verzahnung/revisionen-extrakt.ts, public/verzahnung/artikel-revisionen/** | daten | Tor ja | neu: OR 631 giltSeit 2023; EPG 80 befristet; je Fussnotenform 1 Fall | Projektionen ändern (deklarieren) | 2 | RL-11 | — |
| **RL-44** Stammdaten-Adressen | R4-01 … R4-06, R4-07, R4-08 (C-C10; R4-09 → RL-38) | zivilgerichteErstinstanz.ts:204/:364, handelsregisteraemter.ts:27, obereInstanzen.ts:66, schlichtung/zhFriedensrichter.json, bibliothek/register/parameter-verfall.md | daten | Tor nein (Umfang nach W-03) → GP empfohlen | neu: Postfach-PLZ-Test | keine | 2 | — | W-03 (nur ob Risikopfad) |
| **RL-45** Formular-Eingaben | UI-09, UI-10, UI-12 (C-C11-Rest; UI-03 → RL-38, UI-04 → RL-14, UI-05 → RL-13, UI-07/UI-08 → RL-24) | MietrechtForm.tsx:92/:99-102, EreignisFristen.tsx:193, VerjaehrungForm:156, GewaehrleistungForm:133, ErbFristenForm:59, VerzugszinsForm:119, KombinierteAnsicht:91, DatumsFeld.tsx:117/:136 | bau | Tor nein · GP empfohlen | Render-Tests Fehlermeldung | keine | 1 | RL-13, RL-14 (gleiche Formulare) | — |
| **RL-46** Logik aus UI | VS3-01 (C-C12 = D-V-FACH), VS3-02, VS3-03, VS3-04, VS3-05, UI-§3, VC-08 | useZustaendigkeitForm.ts:125/:160-235/:304-307, SgBehoerdenWahl.tsx:82/:136-190 → neu src/lib/zustaendigkeit/; MietrechtForm.tsx:105-110, mietrecht.ts:141-153, KuendigungSperrForm.tsx:89-90, EinfacheFristForm.tsx:120-123, ProzesskostenForm:118-124, EreignisFristen:182-185, StrafZustaendigkeitTeil:411-428, LohnfortzahlungForm:20 | rechnen (Verhaltensänderung deklariert) | Ziel src/lib/zustaendigkeit Tor ja | neu: Rand-PLZ Stadt ZH, TI Circolo, VD, SO | zust:* prüfen | 2 | RL-03 | — |
| **RL-47** Datum-/Zitier-Helfer | R3-01, R3-02, R3-03, VS3-10 Teil 2, VS3-12, R2-05, R2-06/VS3-17, R2-07 (C-C9 + D) | format.ts:167, leserOptionen.ts:374, seiteHelfer.ts:10 (21 Aufrufe), EinfacheFristForm.tsx:32, gerichtszitat.ts, bge.ts, rechtsprechungUrl.ts | bau (Verhaltensänderung deklariert; VS3-12 eigener fachlicher PR) | Tor nein · GP empfohlen | neu: TZ Europe/Zurich 1.1.2026 00:30/00:59 → 2026-01-01; '2025-02-30'/'2023-02-29' abgelehnt | vorl (106) byte-gleich nachweisen | 2 | RL-56 (VS3-10 Teil 1 zuerst sinnvoll, nicht zwingend) | — |

### Welle 3 — Prüfsystem-Rest (`W2·30-RL-W3`, ≈ 4 Sessions, 14–20 PRs)

| RL | Befunde (Herkunft) | Dateien | Klasse | GP | Tests / Rot-Beweis | PRs | Abh. | Blocker |
|---|---|---|---|---|---|---|---|---|
| **RL-48** Golden-Split werte/texte | S1-08 (D-D2 PR 2) | scripts/golden-outputs.ts, golden/lexmetrik-golden.json (256 Fälle) | prüfsystem (verhaltensneutral) | empfohlen | Vereinigung(werte, texte) == alte Datei per Skript; danach Riegel RL-03 auch auf Golden-`werte` | 1 | RL-03 | — |
| **RL-49** Quellbelegte Fallsammlung | S1-03, S1-15, Brücke S-X1 (`it.fails` mit `offenerBefund`) (D-D3) | src/tests/faelle/**, Sperrklinken-Tor | prüfsystem | stichprobenweise für neu formulierte Erwartungen | Saat: soll-und-laeufe/<Bereich>/soll.md (~1'900) + AV (107 Fälle); Sperrklinke «herkunft≠hand je Risiko-Engine sinkt nicht» | 1 Rahmen + 4–6 | RL-02 · **darf ab Welle 1 parallel** | — |
| **RL-50** Gegenprüfung messbar | S1-04 (D-D4) | scripts/gegenpruefung-ok.ts:14/:140/:221, Skill gegenpruefung SKILL.md:52–66/:180, bibliothek/register/gegenpruefung-register.md | prüfsystem | freiwillig (W-02) | `--vorab`-Pflicht rot ohne Datei; Verdikt `widerlegt` registrierbar | 1 | RL-02 | W-02 |
| **RL-51** Testlücken + Test-Orakel | D-Abschnitt 3 (S2/S2b, alle Zeilen), S1-10, S1-13, S1-14 (Stryker-Monitor), VS4; A-B12: F1-03, F3-06, F4-06 (Kündigungsteil), R1-06, R5-08 | src/tests/**, Monitor-Skript, vite.config.ts:137–152, scripts/logik-sweep.ts | prüfsystem | empfohlen (Erwartungswerte blind aus Norm) | zuerst S2-28/29/32, S2b-19/33; R5-08 Tor-Test über PRESET_INDEX einmal rot (§6.7) | 3–6 | RL-02; Soll erst nach dem jeweiligen Fix grün (sonst `it.fails`) | **W-21** (nur Stryker) |
| **RL-52** Stammdaten- und Tarif-Drift | S1-09 = B2-11, S1-11, S1-12, S1-16, AV-08 (D-D6 + B-P1) | scripts/tarif/tarif-drift.ts:10–22, package.json:105, ci.yml/normen-monitor, feiertage-gegenprobe.test.ts:7/:27/:39, check-lik-frische.ts, plan/posten/2026-09-20-v7-feiertags-gegenprobe.md, bibliothek/recherche/fremdnutzen-suchrunde-2-2026-09-06.md:15/:19 | prüfsystem | empfohlen | Sperrklinke «unklar» (Rot-Beweis: Adapter entfernen); Adapter VD/GE/NE/SZ/JU/TI; JAHRE 2024–2045 | 2–3 | RL-22 (gleiche Testdatei feiertage-gegenprobe) | — |
| **RL-53** Befund-Buchhaltung Rest | S3-g, S-X1 (3)/(4) (D-D7 Teil 2) | scripts/check-sediment.ts (neue Gattung TODO/FIXME ohne Posten-Anker), PLAN-OCL-ABBAU.md (archivieren) | prüfsystem/doku | nein | Rot-Beweis TODO ohne Anker | 1 | RL-01 | — |
| **RL-54** Kleinhygiene | S1-07, S1-17, S1-19 (D-D8) | src/tests/abnahmeGate.test.ts:28, messwerte/tor-bewaehrung.json, Hook tor-schutz.py | prüfsystem | nein | Negativ-Fixture «nicht abgenommen» | 1 | — | — |

### Welle 4 — Verschlankung (`W2·30-RL-W4`, ≈ 1 Session, 2–4 PRs)

| RL | Befunde (Herkunft) | Dateien | Klasse | Risikopfad / GP | Golden | PRs | Abh. | Blocker |
|---|---|---|---|---|---|---|---|---|
| **RL-55** Entdopplung verhaltensneutral, Risikopfad | VS3-07, F1-05 (A-B11), VS3-13/14 Schritt 1, VS1-05 (D-V-NEUTRAL Risikoteil) | zpoFristen.ts:74-75 → `naechsterWerktag` (zpoFeiertage.ts:192), ZpoFristenForm.tsx:37-45 (`STILLSTAND_GILT` importieren), round2 (gebvKosten.ts:40, verzugszins.ts:69, tarif/staffel.ts:124), formatCHF → fmtCHF, gruendungsunterlagen.ts:387/:656 → `HREG_GEBUEHR` | refactoring | Tor ja (formal) → GP Pflicht | byte-gleich (Pflicht); Tests unverändert | 1–2 | nach RL-07/RL-20/RL-24 (gleiche Dateien) | — |
| **RL-56** Entdopplung verhaltensneutral, ohne Risikopfad | VS3-11, VS3-10 Teil 1, VS2-02, VS2-03, VS2-04, VS2-05, VS2-06 | gerichtszitat.ts:62–67, VerfallUebersicht.tsx:26, EinfacheFristForm.tsx:34, VerzugszinsForm.tsx:96, konventionen.ts, navigation.ts:185 (Wache international-redirect.test.ts:61/69 behalten), tabGruppen.ts:88, tabs.ts:585, vorlagen/registry.ts:155/159 (nur prüfen) | refactoring | Tor nein (registry.ts ja) | byte-gleich | 1 | — | — |
| **RL-57** round2-Gleitkomma | VS3-13/14 Schritt 2 (D-V-FACH) | round2-Aufrufer | rechnen (nur mit Rundungsnorm) oder Offenlegung | Tor ja | Rappen können ändern | 0–1 | RL-55 | **W-22** ✅ entschieden 24.9.2026 «nach Empfehlung» |

### Welle 5 — Offenlegung/leichte Vorlagen-Reste (mit Welle 4 in einer Session, 1 PR)

| RL | Befunde (Herkunft) | Dateien | Klasse | Risikopfad / GP | PRs | Abh. | Blocker |
|---|---|---|---|---|---|---|---|
| **RL-58** Vorlagen-Offenlegung Rest | VB-04, VC-03 (erst BGE 133 III 201 amtlich prüfen), VC-04, VC-05, VC-09 = VS2-07, VC-10, S3d-Reste (erst nachstellen) (C-C13) | vorlagen/testament.ts:52-91, nda.ts, vollmacht, handelsreisendenvertrag.ts, vorlagenText.ts:9 | rechnen | Tor ja | 1 | — | — |

**Nur als Posten (kein eigener Bau-Schritt):** R2-09 Praxisänderung (vermutet) ·
B3-08 rekursive Stämme · VD-08 Option B (PartG-Ausbau) · A16 für ZPO (W-07,
Recherche) · MWST-Tarife der 11 ungeprüften Kantone (W-16 c).

---

## §2 · Widersprüche und Nachherleitungen (nicht geglättet)

Wörtlicher Inhalt von UMSETZUNGSPLAN.md §4.2 — **nicht** vorab auflösen, jede
Einheit klärt ihren Punkt selbst gegen die amtliche Quelle (§7 CLAUDE.md).

1. **Soll-Wert gewaehrleistung.test.ts:116-125 (F5-05, §3 Nr. 5).** Q7 nennt
   «1.7.2027»; Teil A liest Übergabe 1.7.2025 + vereinbart 1 J → **1.7.2026**;
   Teil D bestätigt den Widerspruch. Heute im Test: `endeISO` 2030-07-01,
   `vereinbartUnwirksam` true, `jahre` 5. → **RL-06 leitet den Soll aus der
   Abrede neu her** (Art. 371 Abs. 3 / 219a Abs. 3 OR, AS 2025 270, Art. 1
   SchlT) und lässt ihn in der GP unabhängig nachrechnen; weder Q7 noch Teil A
   abschreiben.
2. **B3-01-Sollwerte.** VS4-07 nennt 150'000/100'000, Q7 120'000/70'000.
   Teil D: zwei verschiedene Fälle (E14 = 100k/−50k/+100k → Soll 100'000,
   reproduziert Ist 150'000 in Teil F; Testfall :182-189 = 100k/−50k/40k →
   Soll 70'000). Kein Sachwiderspruch, aber VS4-07 ordnet den Fall falsch zu →
   im RL-09-Auftrag beide Fälle getrennt nennen.
3. **Q7-Zeilenangaben verschoben** (Teil D gemessen): notariatGrundbuch.test.ts
   :25 → **:27**; beurkundungZusatzkosten.test.ts :29 → **:31** (+ :51);
   schkgFristen.test.ts :181-183 → **:183-184**; mietvertrag.test.ts Teil C
   :197-202 vs Teil D :197-200. **schkgFristen.property.test.ts:59** laut Q7
   zementierend — am Worktree **nicht bestätigt** (:50–65 ist SF-2 «Ereignis ≤
   dies a quo ≤ dies ad quem»; Ferien-Properties :113–130) → in RL-18
   nachmessen, ggf. keine Property-Änderung. Teil A schlägt dagegen vor, die
   Property auf «massgeblicher Ereignistag ≥ Eingabe» umzustellen — erst nach
   Nachmessung entscheiden.
4. **Anker schkgPresets.ts:209 (`beschwerde_aufsicht`)** zitiert «Art. 145
   Abs. 4 Satz 2 ZPO»; laut V14 seit 1.1.2025 durch **Art. 56 Abs. 2 SchKG**
   abgelöst (A-N5; R5-02 verlangt ebenfalls den ZPO-Hinweis zu streichen).
   **Gegenläufig:** Teil C schlägt für **Z1-06** («SchKG-Fristen ohne
   Stillstand-Hinweis», RL-42) einen Hinweis auf «Art. 145 Abs. 4 ZPO» vor. →
   Vor RL-17 und RL-42 die geltende Fassung (Fedlex ZPO Art. 145, SchKG
   Art. 56) öffnen und beide Stellen auf denselben, geltenden Anker setzen.
5. **Soll-Widerspruch F5-05 / B3-01 in den Berichten** (Teil D Nebenfund 5) =
   Ziff. 1 und 2 oben; Fix-PRs müssen Soll neu herleiten.
6. **UR-Inkonsistenz im Bestand:** beurkundung.test.ts:105 Schenkung UR 1 Mio =
   2500 (Vollstaffel) vs notariatGrundbuch.test.ts:27 Grundstückkauf UR 1 Mio =
   2625 (marginal) — gleicher Verbandstarif, zwei Lesarten; mit RL-26
   gegenstandslos (B-N5).
7. **Q5 GL 2. Januar:** Q5 empfiehlt «weiter zählen + Hinweis» (späteres
   Fristende); Teil A merkt an, «nicht zählen» wäre die vorsichtigere Richtung.
   Offen in W-11.
8. **Teil A F2-02** «belegt Grundsatz / vermutet Art. 239» — die
   Art.-239-Hälfte ist nicht belegt; RL-17 darf Art. 239 nur mit Beleg
   umstellen, sonst Offenlegung.
9. **S1-17 «Phantom-URL»** in der Befundliste ist falsifiziert (`git remote -v`
   = github.com/LexMetrik/…, URLs echt) → Befundliste ergänzt (§0 Ziff. 2b,
   nicht gestrichen — Nachtrag von RL-01, siehe BEFUNDLISTE.md).
10. **VS4-02 «Parität statt Wahrheit»** ist keine tote Wache (beide
    Tarif-Engines live) → Test behalten, in RL-49 nicht als quellbelegt
    zählen.
11. **Jules-Status «aus»** ist Gedächtnis-Stand 22.9., nicht repo-verifiziert;
    der Rückbau des Jules-Zweigs in RL-03 ist davon unabhängig korrekt
    (Teil D).
12. **Aufwand-Schätzung Teil C** («~26 PRs») ist eine Handschätzung; dieser
    Plan zählt per Skript (UMSETZUNGSPLAN.md Abschnitt 2).

---

## §3 · §6.3-Liste — Tests und Golden, die heute einen Fehler festschreiben

Grundlage Teil D §4 (Zeilen am Worktree **54ef46198** per grep nachgemessen),
ergänzt um A/B/C. Diese Stellen dürfen und müssen im genannten Fix-PR geändert
werden, als **deklarierte fachliche Änderung** (Trailer `Fachaenderung:` nach
RL-03). Jede andere Test-Änderung im selben PR ist verboten; bricht ein Fix
einen weiteren Test, ist das KEIN Freigabe-Fall — erst Norm-Beleg + Befund-ID,
sonst Fix stoppen.

| # | Test/Golden : Zeile (54ef46198) | Befund | Ist im Test → Soll | Norm-Beleg | Gedeckt durch | RL |
|---|---|---|---|---|---|---|
| 1 | src/tests/notariatGrundbuch.test.ts:27 (`toBe(2625); // marginal`) | B5-03/B5-04 | 2625 → Verweis auf Notariat statt Betrag; Deckel 30'000 (notariat-grundbuch.ts:28–32) entfällt | RB 9.2311 Art. 38 Abs. 3 | Q7 Nr. 1 + V13 §1 + David-Entscheid 23.9. | RL-26 |
| 1a | src/tests/beurkundung.test.ts:84 (Testament UR 750), :85 (Vollmacht UR 40 — prüfen, ob Verbandstarif), :103-105 (Schenkung UR); tarifInvarianten.test.ts (Monotonie muss `null` tolerieren — prüfen) | B5-03/B5-04 | Betrag → «nicht deterministisch» | wie 1 | David-Entscheid 23.9., **nicht** Q7-Wortlaut → W-14 | RL-26 |
| 2 | src/tests/beurkundungZusatzkosten.test.ts:31 (`freiesNotariat).toBe(false)`), :51 (`posten).toHaveLength(0)`) | B2-06 | «Amtsnotariat keine MWST» → MWST-Posten (ZH, SZ, NW, GL, AR, SG, TG amtlich; SO/SH/AI offen) | MWSTV Art. 14 Ziff. 13; NotGebV ZH § 2 | Q7 Nr. 2, V5 C, Q3/Q3b | RL-33 |
| 3 | src/tests/prozesskosten.test.ts:369–370 | B1-01 (UI-01) | vereinfacht, vermögensrechtlich > 30'000 «möglich» → an Art.-243-Katalog koppeln | Art. 99 Abs. 3 lit. a, 243 Abs. 1/2 ZPO | Q7 Nr. 3, V11 Ziff. 1 | RL-37 |
| 4 | src/tests/schkgFristen.test.ts:183–184 (1.4.2026 → 22.04.2026) | F2-03 | Zustellung in Betreibungsferien wirkt nach Ferienende (8.4. → Soll 4.5.2026) | BGE 121 III 284 E. 2b/c | Q7 Nr. 4, V2 D | RL-18 |
| 4b | src/tests/schkgFristen.property.test.ts:59 (Q7) — am Worktree nicht bestätigt | F2-03 | vor dem Fix prüfen, welche Property den Fehler generalisiert — ggf. keine | — | offen (§2 Ziff. 3) | RL-18 |
| 5 | src/tests/gewaehrleistung.test.ts:116–125 (`endeISO` 2030-07-01, `vereinbartUnwirksam` true, `jahre` 5) | F5-05 | Altabrede bleibt wirksam, Ende nach vereinbarter Frist; **Soll neu herleiten** (1.7.2026 vs 1.7.2027) | Art. 371 Abs. 3 / 219a Abs. 3 OR (AS 2025 270); Art. 1 SchlT ZGB | Q7 Nr. 5, V3 C | RL-06 |
| 6 | src/tests/erbteilung.test.ts:182–189 (`nachlassChf` 120'000) | B3-01 | Fall 100k/−50k/40k → 70'000 | Art. 210 Abs. 2, 209 Abs. 2, 474 Abs. 2 ZGB | Q7 Nr. 6, V4 A | RL-09 |
| 6b | ErbteilungForm.tsx:289 Hinweis «negativ = Rückschlag (zählt 0 …)» (kein Test) | B3-01 | UI-Text mitändern | wie 6 | UI-Bericht | RL-09 |
| 7 | src/tests/mietvertrag.test.ts:197–202 (MT-22, `befristetBis: '2031-09-30'` → Blocker) | VB-02 | 1.10.2026–30.9.2031 zulassen | Art. 269b, 269c lit. a OR | Q7 Nr. 7, V6 | RL-10 |
| 8 | src/tests/kapitalerhoehung.test.ts:97 | VA-01 | für neue Aktien richtig → **ergänzen**, nicht ersetzen (Teilliberierung bisheriger Aktien) | Art. 626 Abs. 1 Ziff. 3, 632, 652g OR | Q7 Nr. 8, V11 Ziff. 3 | RL-41 |
| 9 | src/tests/gruendungGmbhDokumente.test.ts:168–172 | VA-04 | Bestätigung bei jeder Bareinlage in der 777b-Liste; HRegV-Weiche nur HR-Beilagen (Wurzel gruendungsunterlagen.ts:219/:510) | Art. 631 Abs. 2 Ziff. 4 / 777b Abs. 2 Ziff. 4 OR; HRegV Art. 43 Abs. 1 lit. f / 71 Abs. 1 lit. g | Q7 Nr. 9, V13 §2 | RL-41 |
| 10 | golden/lexmetrik-golden.json `vorl:sk-kinder-115` (Schlüssel :18989, Text :19018, Rb 3+4) | VD-02 | alternierende Obhut → Betreuungsanteile statt «persönlicher Verkehr» | Art. 273 Abs. 1, 133 Abs. 1 Ziff. 3 ZGB; BGE 142 III 612 E. 4.1 | Q7 Nr. 10, V13 §3 | RL-40 |
| 11 | src/tests/sperrfristen.test.ts:61-72 («um 10 Tage», nur Ereignis 0), :205-217 (`beansprucht` 0) | UI-06 | Rückfall aus Restkontingent | Art. 336c Abs. 1 lit. b, Abs. 2 OR | Beleg V10 — **nicht Q7** → W-05 | RL-13 |
| 12 | src/tests/verjaehrung.test.ts:154-167 (2040-01-15 «ab Eintritt», Default 10 J), verjaehrung.property.test.ts:144-150 (Deckel «nach Verjährungseintritt») | F5-04/Q1 | Laufbeginn nicht als Gesetzesregel; keine stille 10-J.-Vorgabe | Art. 141 Abs. 1 OR; BBl 2014 235 S. 262 | Beleg Q1 — **nicht Q7** → W-05 | RL-14 |
| 13 | src/tests/feiertage-gegenprobe.test.ts:96-99 (SO 1. Mai «bewusst weggelassen»), :155 (UR/AR 26.12.-Ausnahme) | R1-02/R1-03 | SO 1. Mai Feiertag; UR Stephanstag unbedingt | EG ZPO SO § 22 Abs. 2 (BGS 221.2); UR LSG Art. 9 lit. b (RB 70.1421) | Beleg R1 (amtlich geöffnet) — **nicht Q7** → W-05 | RL-22 |
| 14 | src/tests/lohnfortzahlung.test.ts — prüfen, ob Alt-Bänder BE festgeschrieben | Q6/S3b-b | DJ 10–14 = 4 Mt, 15–19 = 5 Mt | OG BE Tabelle (zsg.justice.be.ch) | Beleg Q6 — nicht Q7 → W-05 (nur falls Treffer) | RL-25 |
| 15 | src/tests/prozesskosten.property.test.ts:117-126 (monotone PE-Untergrenze) | AV-01/AV-02/Q2 | normbelegte Ausnahme für VS (Norm selbst nicht monoton; Ursache der normlosen 41'200) | LTar VS Art. 32 | **nicht Q7** → W-05 | RL-32 |
| 16 | src/tests/notariatsgebuehren.test.ts:30 (BE 25 Mio «offen») | VS1-01/B2-10 | → 16'450–27'350 nach Umstellung auf SONDERTARIFE | GebVN BE Anhang 4 | **nicht Q7** → W-05 | RL-36 |
| 17 | src/tests/bgerRechtsweg.test.ts:166, bgerRechtsweg.property.test.ts:166-171 | Q4/VS2-01 | fallen mit `bgerKapitalwert20x` (Rückbau, keine Assertion an lebendem Code) | Art. 51 Abs. 4 BGG | Begründung im Commit (Teil D) | RL-35 |
| 18 | golden `vorl:vv-standard`, `vorl:vv-betrag-ohne-vorbehalte`, `vorl:vv-blanko` (Baustein), `vorl:vv-gates-hoechstdauer` (Blocker-/Hinweistext) | VB-01 | «… Höchstdauer von zehn Jahren ab Beginn der Verjährung» → Formulierung nach W-06 | Art. 141 Abs. 1 OR; BBl 2014 235 S. 262 | fachlicher Schritt §1, W-06 | RL-14 |
| 19 | golden `miet:ordentlich`, `miet:geschaeft`, `absatz:miet:ordentlich` (Rechenweg «Art. 78 OR …») | F4-01 | Werte gleich, Rechenweg-Satz ändert | Art. 266a/266c, 78 OR | fachlicher Schritt | RL-04 |
| 20 | golden `bk:grundstueckkauf:1_5mio:TI` | B4-01 | 3‰-Band → 2,5/2/1/0,5‰, Grenze 50 Mio | LTN TI Art. 5 cpv. 1 | fachlicher Schritt | RL-29 |
| 21 | golden `vorl:wv-unbeweglich-aufwand`, `vorl:wv-gates-unbeweglich` (± `wv-einfach`/`wv-experte`) | VC-01 | «sofort» → 60 Tage für verdeckte Mängel | Art. 370 Abs. 4 OR | fachlicher Schritt | RL-39 |
| 22 | golden `vorl:kk-*` (Hinweise VD-06), weitere `vorl:sk-*`/`sb-*`/`eg-*` aus VD-02 … VD-05 | VD-02 … VD-06 | Neusegnung nach Hinweis-/Begehrens-Ergänzung | Art. 298a ZGB u. a. | fachlicher Schritt | RL-40 |
| 23 | src/tests/strafZustaendigkeit.test.ts:144-146 (nur Existenz der Warnung) | Z1-07 | verschärfen auf Forum/Behörde (zu schwach, nicht zementierend) | Art. 10 Abs. 1 JStPO | Test-Verschärfung, deklarieren | RL-42 |

Zählung: 10 Q7-Posten (Nr. 1–10, V13-zweitgeprüft) + 4b/6b (aus D) + 1a, 11–23
(aus A/B/C bzw. Golden-Neusegnung). Nr. 1a, 11–16 brauchen W-05.

---

## §4 · Wartet auf David

Sortiert nach der frühesten blockierten Einheit. Empfehlungen sind Vorschläge
(Weisung 23.9.: bei Sicherheit mittel/tiefer oder OFFEN entscheidet David).
Keiner dieser Punkte ist ein Drängen; unbeantwortete Punkte blockieren nur die
genannte Einheit, der Bau läuft an anderer Stelle weiter. **W-01 und W-02 sind
entschieden** (siehe Kopf); die übrigen stehen an, sobald die jeweils
blockierte Einheit ansteht — dann werden sie David vorgelegt, nicht vorab als
Posten angelegt.

**Nachtrag 24.9.2026 abends:** David hat alle offenen Punkte W-03…W-22 «nach
Empfehlung» entschieden — massgeblich ist damit die Spalte «Empfehlung».

| W | Frage (Klartext) | Optionen | Empfehlung | blockiert |
|---|---|---|---|---|
| **W-01** ✅ entschieden 23.9.2026 | Soll dieser Plan so umgesetzt und in den Bauplan (ROADMAP/plan) aufgenommen werden? | (a) ja, wie vorliegend · (b) ja, mit Änderungen · (c) nein/später | **(a) «Ja, wie vorliegend»**; Bau in neuer Session per Übergabe-Chip, parallel zum Werkbank-Umbau, nicht in dessen PRs | RL-01 und damit alles |
| **W-02** ✅ entschieden 23.9.2026 | Sollen Änderungen an den Prüf-Toren selbst (kern.ts, CI-Torschritte, Golden-Werkzeug) zwingend gegengeprüft werden? Heute kann ein Tor aufgeweicht werden, ohne dass ein Tor es merkt. (E-D1) | (a) nein, wie heute · (b) ja, eigener «Tor-Pfad» im Tor · (c) als feste Auftragsbedingung, ohne neues Tor | **(b) sofort — «Ja, in Welle 0 mitbauen»**: Tor-Dateien kommen in RL-02 in die Gegenprüfungs-Grenze | RL-02, RL-03, RL-50 (Art der Prüfung) |
| **W-03** ✅ entschieden 24.9.2026 «nach Empfehlung» | Sollen Adress-/Behördendaten (Gerichte, Schlichtungsstellen, Betreibungsämter, HR-Ämter) nur mit Zweitprüfung geändert werden dürfen? Gefunden wurden dort nur leichte Adressfehler. (E-D2) | (a) ja, alle · (b) nein, Aktualität über Register (RL-44) · (c) nur Dateien mit Zuständigkeitsregeln | (c) | RL-02 (Umfang), RL-44 |
| **W-04** ✅ entschieden 24.9.2026 «(a) rechnen + offenlegen» | Kündigungsschutz bei Rückfall derselben Krankheit: Soll der Rechner den Schutz aus dem Rest des ursprünglichen Kontingents berechnen? Heute gibt er gar keinen Schutz (sicher falsch); die Lesart des Gesetzes ist nur «vermutet». (E1) | (a) rechnen + Annahme offenlegen · (b) nur Warnung «Schutz möglich, nicht berechnet» | (a) | RL-13 |
| **W-05** ✅ entschieden 24.9.2026 «(a) Sammelfreigabe» (Q7-Nachtrag im Projektordner) | Dürfen Tests geändert werden, die einen Fehler festschreiben, für die aber (anders als bei den 10 von dir freigegebenen, Q7) noch keine ausdrückliche Freigabe vorliegt? Belege liegen jeweils vor (§3 Nr. 1a, 11–16). (E2 + B-Test-Stellen) | (a) Q7-Dossier um diese Stellen nachführen, Sammelfreigabe · (b) Einzelfreigabe je PR | (a) | RL-13, RL-14, RL-22, RL-25, RL-26, RL-32, RL-36 |
| **W-06** ✅ entschieden 24.9.2026 «Vorlage B, Rechner a» | Verjährungsverzicht: Ab wann laufen die höchstens 10 Jahre? Das Gesetz lässt es bewusst offen. (a) Wie soll die **Vorlage** formulieren? (b) Welchen Standard soll der **Rechner** zeigen? (C-Entscheid 1 + A-E8) | Vorlage: A neutral · B «mit Wirkung ab Datum dieser Erklärung bis …; längstens zehn Jahre ab Datum dieser Erklärung» · C Klausel streichen. Rechner: a Standard «ab Erklärung» · b beide Daten gleichrangig · c Nutzer wählt | Vorlage **B**, Rechner **a** | RL-14 |
| **W-07** ✅ entschieden 24.9.2026 «nach Empfehlung» | Den Warnhinweis «Fristende kurz vor dem Stillstand» (für das Bundesgericht bereits entschieden) auch im ZPO-Rechner zeigen? Gleiche Rechenregel, aber noch nicht belegt. (E5) | (a) nur BGG (Entscheid 23.9.) · (b) auch ZPO nach Belegprüfung | (a) jetzt, ZPO als Recherche-Posten | RL-15 (nur Erweiterung, nicht blockierend) |
| **W-08** ✅ entschieden 24.9.2026 «nach Empfehlung» | Probezeitverlängerung wegen Krankheit: nur warnen oder genau rechnen? Genaues Rechnen braucht ein neues Feld «Arbeitstage pro Woche». (E3) | (a) nur Warnung · (b) Rechnung mit Feld (Standard Mo–Fr) | (a) sofort, (b) danach | RL-16 (Stufe 2) |
| **W-09** | SchKG-Beschwerde (Art. 17/239): Neuer Schalter «angefochten ist eine Betreibungshandlung» — welche Voreinstellung? (E4) | «nein» (kürzere Frist) · «ja» | «nein», Schalter sichtbar | RL-17 |
| **W-10** ✅ entschieden 24.9.2026 «nach Empfehlung» | Neuenburg: amtlich festgelegte Schliesstage der Gerichte als Feiertage aufnehmen? Folge: spätere Fristenden (amtlich belegt). BL/VD nur als Hinweis. (E9) | (a) NE ergänzen, BL/VD Hinweis · (b) alles nur Hinweis | (a) | RL-22 (nur NE-Teil) |
| **W-11** | Glarus, 2. Januar: als Feiertag zählen? Belegt ist nur «arbeitsfreier Tag» der Verwaltung, kein Gesetz, kein Urteil (Sicherheit mittel-tief). (E6/Q5) | (a) zählen + Warnung (Q5) · (b) nicht zählen · (c) nicht zählen + Hinweis | (a) laut Q5 — Hinweis: (b)/(c) wären vorsichtiger | RL-23 |
| **W-12** ✅ entschieden 24.9.2026 «nach Empfehlung» | Tagerechner: Voreinstellung «ZPO-Gerichtsferien» (im Code als früherer Auftrag vermerkt) beibehalten? Befund nur vermutet. (A-E10 = C-Entscheid 4) | (a) beibehalten + deutlicher Hinweis · (b) Standard «keine» · (c) Pflichtwahl ohne Voreinstellung | (c) | RL-24 (nur UI-07) |
| **W-13** ✅ entschieden 24.9.2026 «nach Empfehlung» | Berner Skala Lohnfortzahlung ab 25 Dienstjahren und Zuordnung Nidwalden (DJ 1–19 ist sicher und wird sofort korrigiert). (E7/Q6) | DJ 25+: 6 Monate fest vs. +1 Monat je 5 DJ · NW: Berner vs. Basler Skala | 6 Monate + Alternative offenlegen; NW mit Warnung bis Klärung durch Arbeitsamt NW | RL-25 (nur DJ 25+/NW) |
| **W-14** ✅ entschieden 23.9.2026 | Uri: gilt «nicht mehr rechnen» für **alle** 23 Einträge aus dem Verbandstarif, nicht nur den Grundstückkauf? | ja, alle · nur Grundstückkauf | **ja, alle** (gleiche Quelle, gleicher Grund) | RL-26 |
| **W-15** ✅ entschieden 24.9.2026 «nach Empfehlung» | Wallis, Parteientschädigung: In zwei Stufen weichen deutsche und französische Fassung ab (24'000/24'900; 33'100/33'300), amtlich nicht aufgelöst (Sicherheit mittel). Die Untergrenze 41'200 fällt in jeder Variante. (Q2) | (a) beide Werte als Spanne + Hinweis · (b) je ein Wert (24'000 / 33'300) · (c) französische Werte wie heute | (a) | RL-32 (Divergenz-Zellen) |
| **W-16** ✅ entschieden 24.9.2026 «nach Empfehlung» | MWST auf Notariatsgebühren in den übrigen Kantonen: FR/GE/TI und SO/SH/AI (Tarif schweigt), 11 Kantone ohne gelesenen Tarif. | (a) überall «zuzüglich 8,1 %» nach Bundesrecht, Hinweis Umsatzgrenze · (b) «offen» ohne Betrag · (c) Tarife erst beschaffen | (a) für FR/GE/TI/SO/SH/AI, (c) für die 11 als Posten | RL-33 (Restkantone; 7 belegte + ZG sofort) |
| **W-17** | Bundesgericht, Streitwert bei wiederkehrenden Leistungen (Art. 51 Abs. 4 BGG): mit drei Regeln verdrahten und danach den alten Hilfsrechner löschen? Sicherheit mittel-hoch. (E-D4/Q4) | (a) Vorschlag übernehmen · (b) nur Hinweis im Formular | (a) | RL-35 |
| **W-18** ✅ entschieden 24.9.2026 «nach Empfehlung» | Prozesskosten: Verfahrensart heute fest «ordentlich». Wie soll sie gesetzt werden? (C-Entscheid 3) | (a) automatisch aus Streitwert/Materie, Warnung bei Abweichung · (b) Pflichtwahl · (c) nur Warnung | (a) | RL-37 (Form-PR) |
| **W-19** ✅ entschieden 24.9.2026 «nach Empfehlung» | Familienrecht-Vorlagen und eingetragene Partnerschaft (heute gar nicht berücksichtigt, Frist falsch 2 statt 1 Jahr). (C-Entscheid 2) | (a) Hinweis «gilt nicht für eingetragene Partnerschaften» · (b) Vorlagen auf PartG ausbauen (neuer Umfang) | (a) jetzt, (b) als ROADMAP-Posten | RL-40 (PR 3) |
| **W-20** ✅ entschieden 24.9.2026 «nach Empfehlung» | Kapitalerhöhung mit bereits dahingefallenem Beschluss: sperren oder nur warnen? (C-Entscheid 5) | Sperre (Blocker) · Warnung | Sperre | RL-41 (PR 1) |
| **W-21** ✅ entschieden 24.9.2026 «nach Empfehlung» | Mutationstests (Stryker) als zusätzliches Messwerkzeug einführen? Kostet Laufzeit. (E-D3) | (a) nein · (b) manuell/monatlich, kein PR-Tor · (c) als PR-Tor | (b), erst nach den Testlücken | RL-51 (nur Stryker-Teil) |
| **W-22** | Rappen-Rundung (1.005 wird heute zu 1.00): ohne belegte Rundungsnorm ändern oder nur offenlegen? (E-D5) | (a) ändern · (b) nur offenlegen, bis eine Norm die Rundung vorschreibt | (b) | RL-57 |

---

## §5 · Quellenfragen (Recherche, kein David-Entscheid)

Vor dem jeweiligen Bau durch Recherche zu klären, nicht durch Rückfrage an
David:

- **Q-1** Pfandsteuer-Anteile FR/GE/VS (Steuererlasse FR 635.1.1, GE LDE D 3 30,
  VS LDM 643.1 öffnen) vor RL-28 Romandie-PR.
- **Q-2** B5-10 OW summarisch (GOG OW Art. 34/80) vor RL-31.
- **Q-3** SG Gerichtskosten Ziff. 111 vs 121 (welches Gericht) in RL-30.
- **Q-4** schkgFristen.property.test.ts:59 nachmessen (RL-18).
- **Q-5** Soll F5-05 neu herleiten (RL-06).
- **Q-6** S3e Agio / S3e SZ-OW «UNKLAR» (RL-34/RL-31).
- **Q-7** VC-03 BGE 133 III 201 amtlich prüfen (RL-58).
- **Q-8** Anker Art. 145 Abs. 4 ZPO vs Art. 56 Abs. 2 SchKG (RL-17/RL-42).
- **Q-9** VS1-05 Satzbau «Gebühr CHF 420» vs Ziff. 1.3 GebV-HReg (RL-55;
  GebV-HReg-Stand 1.1.2021 lokal ungeprüft).
- **Q-10** Zählweise dies a quo 13. oder 14.4. bei F2-03 (offenlegen, RL-18).

---

## §6 · Koordination mit laufenden Fahrplänen

- **VORLAGEN-Session** (`W2·29-WERKBANK-VORLAGEN`): `VorlageKlageVereinfacht.tsx`
  (RL-12) und `VorlageVerjaehrungsverzicht.tsx` (RL-14) nur nach Absprache —
  beide Dateien werden dort ebenfalls berührt. Kollisions-Sonden vor Baubeginn
  (§0 Ziff. 5 Dispatch-Klausel).
- **RechnerKopf.tsx/Formulare** (RL-12): vor Bau mit `W2·29-WERKBANK-RECHNER`
  abstimmen, falls dieser Fahrplan zum Zeitpunkt des Baus noch läuft.
- **LESER-Session** (`W2·29-WERKBANK-LESER`, Baufeld `leser`): RL-11 ist
  vorgezogen — vor Baubeginn eine Dateimeldung an die LESER-Session (berührt
  `src/lib/normtext/historie-parse.ts`, `public/normtext/historie/*.json`;
  Anzeige-Dateien bleiben unverändert). RL-43 nur nach Absprache (gleiche
  Fläche `historie-parse.ts`/Verzahnung). Kollision nur bei RL-12 (Katalogtexte,
  RechnerKopf.tsx) — eigener Worktree, nicht parallel ins Baufeld `design`.
- **LESER-Datenbefunde, die NICHT hierher gehören** (gesondert gemeldet,
  ausserhalb dieses Plans): 01.01.-Datum-Behandlung, unpublizierte Erwägung,
  Regeste-Teil-Behandlung, ESTV-Kreisschreiben-Aktualität, Art. 324a OR,
  Art. 8a SchKG — diese bleiben in der LESER-Session bzw. eigenen Posten, sie
  sind nicht Teil der RL-Wellen.

### §6.1 · Zuordnungstabelle Altbefunde S3/S3b/S3c → RL

Wörtlich aus UMSETZUNGSPLAN.md §4.1 (Zeile «Altbefunde S3/S3b/S3c»), Detail je
Zeile in §1 Welle 0 Block «1b Offene Altbefunde» (UMSETZUNGSPLAN.md Abschnitt 8):

| Altbefund | Heimat (RL) |
|---|---|
| S3-a | RL-38 |
| S3-b | RL-06 |
| S3-c | RL-06 |
| S3-d (= B1-02) | RL-37 |
| S3-e | RL-14 |
| S3-f | RL-30 |
| S3b-a | RL-16 |
| S3b-b (= Q6) | RL-25 |
| S3b-c (= B4-11) | RL-30 |
| S3b-d | RL-31 |
| S3b-e | RL-28 |
| S3b-f | RL-28 |
| S3c-a | RL-10 |
| S3c-b | RL-16 |
| S3c-c (= B2-10) | RL-36 |
| S3-g | RL-53 |

---

## §7 · Detail je Befund

Nicht kopiert — nur Verweis: **UMSETZUNGSPLAN.md Abschnitt 8** («Detail je
Befund») und die zugehörige **BEFUNDLISTE.md**, beide unter
`~/Documents/David/03_Projekte/LexMetrik/pruefung-rechtslogik-2026-09-23/`.
Vor jedem RL-Bau dort die Fundstelle, Norm-Beleg und den vorgeschlagenen
Änderungstext nachlesen — dieser Fahrplan bündelt nur die Bau-Reihenfolge,
Wellen-Zuordnung und die entscheidungsrelevanten Punkte.
