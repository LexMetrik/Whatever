# Kernerlasse-Lücken Bund: EMRK, EÖBV, AVG (14.9.2026)

> §11-Ablage zum ROADMAP-Schritt **`QS-KORPUS`**, Checklisten-Zeile «Kernerlasse-Lücken Bund
> schliessen» (Phase 1 «Bund fertig machen», `fahrplaene/FAHRPLAN-BUND-FERTIG.md` §1 Zeile
> «Bestand», §3 Nr. 2). Bestandsmessung 1.9.2026: EMRK (SR 0.101) nur `pdf-embed`, EÖBV
> (SR 211.435.1) und AVG (SR 823.11) fehlten ganz.
> Quelle ausschliesslich amtlich: Fedlex-SPARQL + Fedlex-Filestore-HTML. Keine Aggregatoren.

## 1. Quelle + Stand

- **Endpunkt:** `https://fedlex.data.admin.ch/sparqlendpoint` — SR → `jolux:ConsolidationAbstract`,
  geltende Konsolidierung über `jolux:dateApplicability`, kanonische HTML-Manifestation über
  `jolux:isRealizedBy`(DEU) → `jolux:isEmbodiedBy`(userFormat=html) → `jolux:isExemplifiedBy`
  (= `scripts/fedlex-manifest.ts`, nicht konstruiert).
- **Volltext:** Fedlex-Filestore `…/eli/<eli>/<kons>/de/html/…`.
- **Abrufdatum:** 14.9.2026. Geltend = grösste `dateApplicability` ≤ 2026-09-14.
- **Künftige Fassungen:** für alle drei Erlasse **keine** (`dateApplicability > heute` = leer) —
  es wird also keine Zukunftsfassung gepinnt (§7).

## 2. Quell-Menü je Erlass (empirisch, nicht angenommen)

| Erlass | SR | ELI | Konsolidierungen | geltend | html-N (kanonisch) | Grösse | `art_*` |
|---|---|---|---|---|---|---|---|
| EMRK | 0.101 | `cc/1974/2151_2151_2151` | 32 | **2022-09-16** | **9** | 122 930 B | **59** |
| EÖBV | 211.435.1 | `cc/2018/29` | 3 | **2024-01-01** | **5** | 36 738 B | **28** |
| AVG | 823.11 | `cc/1991/392_392_392` | 23 | **2026-01-01** | **0** (echt suffixlos) | 104 031 B | **49** |

Formatverfügbarkeit je Konsolidierung (EMRK, SPARQL `userFormat`):

| Konsolidierung | verfügbare deutsche Manifestationen |
|---|---|
| 1999-04-01 … 2010-06-01 (5 Stände) | **nur `pdf-a`** |
| 2012-02-23 · 2021-08-01 · 2022-02-01 | `doc`, `docx`, `html`, `pdf-a`, `xml` |
| **2022-09-16** (geltend) | `docx`, **`html`**, `pdf-a`, `xml` |

## 3. Befund A (§17, Werkzeug-Wurzel) — `fedlex:eli` löst zwei Fehlerklassen falsch auf

`scripts/fedlex-eli-aufloesen.ts` (npm `fedlex:eli`) liefert für alle drei Erlasse ein falsches
Ergebnis. **Rot-Beweis 14.9.2026** (direkte SPARQL-Abfrage gegen dieselbe Quelle):

| Erlass | `fedlex:eli` liefert | amtlich richtig | Fehlerklasse |
|---|---|---|---|
| EMRK | ELI ok, Kons. **1990-01-01** | Kons. **2022-09-16** | (a) `LIMIT 200` |
| EÖBV | ELI **`cc/12/369_337_369`**, Kons. 2024-01-01 | ELI **`cc/2018/29`** | (b) `bindings[0].cc` |
| AVG | ELI **`cc/1951/1211_1217_1249`**, Kons. 2024-01-01 | ELI **`cc/1991/392_392_392`**, Kons. **2026-01-01** | (a) + (b) |

- **(a) `LIMIT 200` schneidet die Datumsliste ab.** Die Abfrage in `loese()` begrenzt auf 200
  Zeilen; `geltend = daten.filter(d => d <= heute).pop()` rechnet dann auf einer *abgeschnittenen*
  Menge. Für EMRK fielen so alle Konsolidierungen nach 1990 weg (17 statt 32 Daten) — das Ergebnis
  sieht plausibel aus und ist um 32 Jahre falsch. **Still**: kein Fehler, keine Warnung.
- **(b) `bindings[0].cc` wählt bei mehreren Abstracts willkürlich.** Eine SR-Notation kann an
  **mehreren** `ConsolidationAbstract` hängen — typischerweise am geltenden Erlass *und* an
  seinem aufgehobenen Vorgänger. Der Resolver nimmt die erste Zeile und mischt zusätzlich die
  Konsolidierungsdaten **beider** Abstracts zu einer Liste. Die Vorgänger hier:
  - SR 211.435.1 → `cc/12/369_337_369` = BG vom 25.6.1891 betr. die zivilrechtlichen
    Verhältnisse der Niedergelassenen und Aufenthalter (NAG).
  - SR 823.11 → `cc/1951/1211_1217_1249` = BG vom 22.6.1951 über die Arbeitsvermittlung (aufgehoben).

  Beides sind **andere Erlasse**. Ohne SR-Sonde wäre die Kollision unbemerkt geblieben — aber die
  SR-Sonde prüft die SR, und die ist bei Vorgänger und Nachfolger **identisch**; sie hätte hier
  also **nicht** angeschlagen.

**Konsequenz für diesen Bau:** die drei Pins stammen aus der direkten SPARQL-Abfrage, nicht aus
`fedlex:eli`. **Wurzel-Fix offen** — als eigener Schritt zu führen (§17): `LIMIT` entfernen bzw.
paginieren, je `?cc` getrennt gruppieren, bei >1 Abstract hart abbrechen statt raten.

## 4. Befund B (§7/§8) — EMRK: die `pdf-embed`-Begründung ist an ihren Pin gebunden

`src/lib/normtext/pdf-embed.ts` begründet den Status mit «Fedlex liefert nur eine SPA-Shell ohne
`<article>`» (25.6.2026). **Diese Angabe wird nicht nachgeführt, sondern ergänzt** — sie war für
den *damals* gepinnten Stand **20050323** zutreffend: unter dieser Konsolidierung ist `pdf-a` die
**einzige** deutsche Manifestation (§2, Formattabelle). Erst ab Konsolidierung 2012-02-23 führt
Fedlex HTML.

Der Re-Pin **20050323 → 20220916** (QS-CURRENCY P1-a, 5.7.2026) verschob das **Datum**, nicht die
**Format-Entscheidung** — die Frage «gibt es unter dem neuen Stand HTML?» wurde nicht neu gestellt,
weil EMRK in `pdf-embed.ts` und nicht in `fedlex-cache.sh` wohnt und damit ausserhalb der
P1-a/b-Kanonik-Reparatur lag. Nachgeholt 14.9.2026.

**Vollständigkeitsprüfung vor dem Statuswechsel** (ROADMAP-Bedingung: «EMRK-Pin ersetzt die
pdf-embed-Zeile nur, wenn der Fedlex-Konsolidierungstext vollständig ist»):

- **Artikel:** `art_1` … `art_59`, lückenlos, keine Lücke, keine Dublette. Die EMRK hat seit
  Protokoll Nr. 11 genau 59 Artikel.
- **Struktur vollständig:** `preface` · `preamble` · Abschnitt I (Rechte und Freiheiten) ·
  Abschnitt II (Europäischer Gerichtshof für Menschenrechte) · Abschnitt III (Verschiedene
  Bestimmungen) · `Unterschriften` · `scope`/`scope_u1` = «Geltungsbereich am 16. September 2022».
  **Nachmessung 14.9.2026 (Gegenprüfungs-Auflage PR #860), ergänzend — die Zeile oben zählt die
  Sektionen der AMTLICHEN Quelle, nicht die des Snapshots:** `preface` und `preamble` sind im
  Snapshot vorhanden, aber im Struktur-Sidecar (`kopf.srNummer`/`kopf.titel`/`kopf.erlassdatum`
  bzw. `kopf.praeambel`), nicht als Einträge. `scope_u1` ist ein eigener Eintrag
  (`bund/EMRK/scope_u1`). **`<section id="signature">` ist NICHT im Snapshot** — die 60 Einträge
  sind `art_1`…`art_59` + `scope_u1`; `grep "Geschehen zu Rom"` und `grep "Unterschriften"` auf
  `public/normtext/bund/EMRK.json` liefern 0 Treffer. Amtlicher Wortlaut der fehlenden Sektion
  (Filestore-HTML `…-20220916-de-html-9.html`, 122 930 B, abgerufen 14.9.2026): «Unterschriften /
  Geschehen zu Rom am 4. November 1950 in englischer und französischer Sprache, wobei jeder
  Wortlaut gleichermassen verbindlich ist, in einer Urschrift, die im Archiv des Europarats
  hinterlegt wird. Der Generalsekretär übermittelt allen Unterzeichnern beglaubigte Abschriften.
  (Es folgen die Unterschriften)». Das ist eine **Extraktor-Grenze, kein EMRK-Sonderfall**:
  wo die amtliche Quelle den Unterschriftsblock IN einen Artikel oder Anhang legt, trägt ihn der
  Snapshot sehr wohl (belegt: `EAUE/art_32`, `RBUE/annex_u1`, `FZA/annex_III`, `CMR/annex_u1` —
  je mit «(Es folgen die Unterschriften)»); nur die eigene `<section id="signature">` fällt weg.
  Rechtlich ohne Normgehalt (Schlussformel), darum §8-Lücke und kein Blocker — aber zu nennen.
- **Randtitel:** an allen 59 Artikeln vorhanden (z. B. Art. 6 «Recht auf ein faires Verfahren»).
- **Gegen das amtliche PDF/A** (`…-20220916-de-pdf-a-2.pdf`, 445 401 B, 22 Seiten): Buchstabenstrom
  HTML 37 490 vs. PDF **ohne Seitenkopf/-fuss** 37 901 — die Differenz von 1,1 % liegt in der
  abweichenden **Platzierung** der Fussnoten (PDF: Seitenfuss, mitten in den Artikeltext gespleisst;
  HTML: eigene Elemente), nicht in fehlendem Text. Stichproben mit Wortgrenze im HTML getroffen:
  «Urteile der Kammern werden nach Massgabe des Artikels 44 Absatz 2 endgültig» (Art. 42, Rumpftext)
  und «Fassung gemäss Art. 14 des Prot. Nr. 14 vom 13. Mai 2004» (Fussnote 28).
- **Fussnoten-Nachmessung 14.9.2026 (Gegenprüfungs-Auflage PR #860), ergänzend:** die amtlichen
  HTML-Fassungen tragen EMRK **38**, EÖBV **18**, AVG **70** `id="fn-…"`. Die Historie-Abdeckung
  des Snapshots (`public/normtext/historie/*.json`, Feld `abdeckung.fussnoten`) liegt darunter:
  EMRK **33/38**, EÖBV **12/18**, AVG **67/70**. Die Differenz sind genau die Fussnoten der
  Sonder-Sektionen ausserhalb der Artikel — EMRK 4 in `preface`/`preamble` + 1 in `scope_u1`;
  EÖBV 4 in `preface` + 2 in `annex_u1/lvl_u1`; AVG 3 in `preface`. Dieselbe Extraktor-Grenze
  wie beim Unterschriftsblock, im Fahrplan `FAHRPLAN-BUND-FERTIG.md` §2 als §8-Lücke vermerkt.

- **Protokolle:** die Zusatzprotokolle sind **eigene SR-Nummern** (0.101.06, 0.101.07, 0.101.09 …)
  und gehören nicht zum Konsolidierungstext von SR 0.101. «Vollständig» heisst hier also Art. 1–59
  — und die sind vollständig.

**Ergebnis:** Bedingung erfüllt ⇒ EMRK wechselt von `pdf-embed` auf `snapshot`.

## 5. Falle: `class="srnummer "` mit Leerzeichen (EÖBV)

Die SR-Identitäts-Sonde in `scripts/fedlex-cache.sh` ist bei EÖBV besonders wichtig (zwei Abstracts
unter derselben SR-Notation, §3b). Fedlex schreibt dort `<p class="srnummer ">` **mit** Leerzeichen
im Klassenattribut, bei EMRK und AVG ohne. Die Sonden-Regex deckt beides über `srnummer[^"]*` ab —
empirisch geprüft, alle drei treffen. **Kein Fix nötig**; hier notiert, damit die nächste Session
die Abweichung nicht für einen Defekt hält (S5: Negativbefund).

## 6. `bis`/`ter`-Fälle und Anhänge

- **AVG:** `art_33_a`, `art_34_a`, `art_34_b`, `art_35_a`, `art_35_b` (5 Buchstaben-Artikel);
  9 `chap_*`-Gliederungsebenen.
- **EÖBV:** 9 `sec_*`-Abschnitte, **2 `annex_*`-Anhänge**.
- **EMRK:** keine Buchstaben-Artikel; 2 `scope`-Sektionen (Geltungsbereich).

## 7. Pflegebedarf

- Currency-Arbiter bleibt `check:fedlex-versionen`; Drift gegen die Quelle `check:normtext-netz`.
- **AVG** steht auf Konsolidierung 2026-01-01 — der jüngste Stand im Bund-Korpus; bei der nächsten
  Revision zuerst hier nachführen.
- Offener Wurzel-Fix aus §3 (`fedlex:eli`) — bis dahin **keine** `fedlex:eli`-Zeile ungeprüft
  übernehmen: ELI gegen den Erlasstitel und die Konsolidierung gegen eine LIMIT-freie Abfrage
  gegenprüfen.

## 8. Abnahme-Status

**entwurf.** Maschinelle Extraktions- und Vollständigkeitsprüfung liegt vor (§2–§6); die
**fachliche Abnahme durch David** (§7/§8, Zeitsperre bis 1.12.2026) steht aus. `verified:true`
wurde nicht gesetzt.
