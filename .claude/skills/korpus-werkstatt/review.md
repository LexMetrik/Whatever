# Review — Quell-Verifikation (user-getriggert)

Der Generator liefert *Daten* — er verbürgt nicht die Richtigkeit. Verifikation ist ein
**eigener Durchgang, den der Nutzer auslöst** — etwa «prüf das nochmal», «verifizier den
Erlass X», «stimmt der Anker/Stand?», «review», «halluziniert da was?», «check die Quelle».
Wenn das kommt, fahre diesen Audit.

**Abgrenzung (zwingend lesen):** Dies ist **NICHT** der §14.4-Pflicht-Pass. Die adversariale
Gegenprüfung nach jeder Extraktions-Produktion auf einem Risiko-Pfad läuft **verpflichtend**
zum Produktionsabschluss und wird vom Tor `check:gegenpruefung` erzwungen (§14.4 — seit
im Skill `bauschritt`, Definition of Done; siehe `SKILL.md`). `review.md` dagegen
ist der **zusätzliche, on-demand** Audit, den David eigens anstösst. Er ersetzt den
Pflicht-Pass nicht und wird **nicht** bei jeder Antwort automatisch gefahren.

## Grundsatz

**Jeden produzierten/zitierten Posten neu prüfen — der gespeicherten Quelle traust du, dem
Entwurf und dem Gedächtnis nicht.** Ein Anker/Wert ist erst verifiziert, wenn du die Quelle
*jetzt* erneut geholt und gelesen hast, was sie tatsächlich sagt. Re-fetch über den
Identifikator, der schon im Snapshot steht (Mechanik in `tools/verifikation.md`):

- **Normtext-Anker** → Fedlex-Filestore-HTML zur gepinnten Konsolidierung, Anker-Format
  `art_335_c` (sprachunabhängig, §7); Geltung gegen `npm run check:fedlex-versionen`.
- **Snapshot-Provenienz** → die im Snapshot gespeicherte `quelleUrl`/`fassungsToken` neu
  fetchen und gegen `src/lib/normtext/register.ts` (SR-Nr, `ErlassStatus`, `fedlexKey`) und
  `src/lib/fedlex.ts` (`FedlexGesetz`/`FEDLEX`-Map) abgleichen.
- **Rechtsprechung** → die `quelleUrl`/`bgeReferenz`/`azaUrteil` des `EntscheidSnapshot`
  erneut auflösen; offline über `npm run entscheide:seed` / Fixtures, wenn OCL nicht
  erreichbar ist (Lauf abbrechen statt halben Korpus prüfen, ehrlicher §8-Fallback).

Nimm **jeden** produzierten Anker/Wert **und** jeden Provenienz-Eintrag des Entwurfs
einzeln und fahre die sechs Fallgruben plus die Darstellungs- und Rechtsprechungs-Prüfungen
unten durch.

## Die sechs Fallgruben (Normtext-Inhalt)

Jeden zitierten Normtext-Posten gegen alle sechs screenen — gemappt auf Lexmetriks reale
Bugklassen:

- **Typ 1 — Die Kompletterfindung (Anker existiert nicht, §7).** Existiert der zitierte
  Artikel/Absatz/Litera in der gepinnten Fedlex-Konsolidierung wirklich (`art_335_c`)? Liefert
  der Anker beim Re-fetch keinen echten, passenden Inhalt, ist die Zitatstelle erfunden —
  Anker entfernen oder durch die reale Stelle ersetzen, nie einen nicht-auflösbaren Anker
  behalten. Tor-Bezug: Register ⊇ Snapshots (`src/tests/normtext-register.test.ts`).

- **Typ 2 — Der umgedeutete Inhalt (falsches «aufgehoben»).** Stimmt die dargestellte
  Geltung mit dem Quelltext überein? «aufgehoben» ist auf Snapshot-Ebene nur zulässig, wenn
  der Artikel weder `items` noch `tabelle` noch `mehrspaltig` trägt — ein blocktragender
  Artikel, der als «aufgehoben» rendert, ist umgedeutet (ArtikelBody zeigt «aufgehoben» nur
  ohne Blöcke; STRUKTUR.md, Befund «Falsches «aufgehoben» (232)»). Geltung/«aufgehoben» wird auf Snapshot-Ebene behandelt,
  nicht im Register. (Für Rechtsprechung gilt die Typ-2-Analogie im Block «Rechtsprechung»:
  trägt der zitierte Leitsatz wirklich die tragende Erwägung?)

- **Typ 3 — Die falsche Quelle (Provenienz, §7).** Liefert die gespeicherte `quelleUrl` beim
  Re-fetch tatsächlich den zitierten Erlass? Drei Teilproben, scharf getrennt von Typ 1
  (Anker existiert generell) und Typ 6 (dieselbe Quelle ist nur veraltet):
  1. **Anker/SR-Nr. matchen** das gelieferte Dokument.
  2. **Keine SPA-Shell** — es ist Filestore-Inhalts-HTML vorhanden, nicht nur die leere
     App-Shell (reale Klasse: ELG/GSchG/EnG/EpG serviert Fedlex nur als SPA-Shell → bleiben
     nur-live-link, §8; STRUKTUR.md, Karte «Bund Batch 4»).
  3. **Kein thematisch fremder Inhalt** — keine Erlass-Kollision (SG-GebT-`quelleUrl` zeigte
     auf den GB-GebV-Snapshot — `AUDIT-TARIF-2026-06-17.md`, Abschnitt «C — Snapshot-/Normtext-
     Lücken», Befund «SG GebT sGS 821.5»; VD-105540 trug Orchester-Subventionen statt Tarif —
     ebenda, Befund «VD-vd-105540.json»).

- **Typ 4 — Die falsche Zuordnung.** Ist die Referenz selbst korrekt — richtiger Anker **und**
  richtiger Erlass? Der gespeicherte Anker muss am RICHTIGEN Erlass hängen: SR-Nr. und
  `fedlexKey` gegen `src/lib/normtext/register.ts` gegenprüfen. Richtiger Text unter falschem
  Label ist trotzdem falsch (reale Klasse: VS-Notariat-Anker `Art. 96 ch. I` alter
  OcRF-Nummerierung → `Art. 32/33 OcRF`; `AUDIT-TARIF-2026-06-17.md`, Abschnitt «B — Norm-Anker
  falsch», Befund «VS Notariat/Grundbuch»). Nicht nur prüfen,
  dass der Anker irgendwo existiert.

- **Typ 5 — Die halbe Wahrheit (Vollständigkeit, §7 Build-Regel 1/2).** Ist der Inhalt
  vollständig wiedergegeben? Drei reale Vollständigkeits-Klassen:
  - **Leerer/zerschossener Artikel-Body** (dokumentiert, STRUKTUR.md, Befund «leerer/kaputter
    Artikel 68»): Body ohne `text`/`items`/`tabelle` oder «…»-Fragment — **manuell**
    unterscheiden: legitime Fedlex-Auslassung (lassen) vs. abgebrochene Extraktion (neu
    generieren). Kein Hart-Fail, Mensch-Urteil.
  - **Tabelle/Staffel verloren oder Spalten verschmolzen** (siehe eigener Pflicht-Block
    unten) — die zahlentragende Klasse.
  - **Aufzählung unvollständig** (§7 Build-Regel 2): lit./Ziff./Sub-Staffel-Zeilen je Absatz
    Posten-für-Posten gegen die Quelle abzählen — kein abgeschnittenes Sub-item, keine flach
    gezogene Verschachtelung, keine gedroppte Tabellenzeile (reale Klassen: Sub-Staffeln in
    Tabellenzellen — STRUKTUR.md, Normtext-Adapter-Fix «zwei-td.number (NW §18 Sub-Staffel)»
    (NW-Adapter-Zweitverschachtelung mit zwei `td.number`) — und verschachtelte Unterlisten
    flach, STRUKTUR.md, Karte «Bug-Check + Extraktor-Fix» «verschachtelte Unterlisten flach»).
    Ein wahrer Satz, der die entscheidende
    lit./Ziff. weglässt, ist ein Fehler.

- **Typ 6 — Die Fassung von gestern (Stand-Drift).** Ist der Snapshot noch die geltende
  Fassung? `npm run check:fedlex-versionen` fahren — überholte Konsolidierung? Exit 1 = neu
  pinnen (geltende Konsolidierung = grösste ≤ heute, **keine künftige Fassung**, §7); den
  Update-Pfad in `methodology/normtext.md` nehmen, **nicht aus dem Gedächtnis** rekonstruieren.
  Reale Lektion: der ELI-Resolver lieferte mehrfach veraltete Konsolidierungen, das
  Currency-Gate fing sie (AHVG 2019→2026, BankG 2011→2024, HMG 2019→2025; STRUKTUR.md, Karte «Bund Batch 4»).
  Abgegrenzt von Typ 3 (falsche/fremde Quelle) — hier ist es **dieselbe** Quelle, nur stale.

> **Block-sha-Integrität** (`text`+`items`-Konsistenz, §7 Build-Regel 4/5) ist über
> `npm run check:normtext` automatisch abgedeckt — **kein** eigener Review-Posten.

## Darstellungs-Schicht (Render-Bugklassen)

Diese sitzen nicht im Snapshot-Inhalt, sondern in der Render-/Darstellungs-Schicht (§3); sie
brauchen die **visuelle** Gegenprobe (Screenshots 360/768/1280 via `scripts/screenshots.ts`,
Playwright via Bash — `tools/verifikation.md`):

- **Tabelle/Staffel verloren oder Spalten verschmolzen** (Pflicht-Gegenprobe gegen den
  Quelltext: Fedlex-`<table>` bzw. Kantons-PDF). Ist jede Tabelle als `mehrspaltig`-Block
  (`kopf`/`zeilen`) erhalten und nicht als Fliesstext verschluckt? Sind Zellen spaltentreu
  (kein Spaltenriss/Merge)? Reale Belege: `<table>`-Drop korpusweit über 52 Gesetze
  (STRUKTUR.md, Karte «Bug-Check + Extraktor-Fix»), 22 untableisierte Kantonstarife
  (STRUKTUR.md, Befund «untableisierter-tarif 22»), Spaltenriss «10 Mio. 106»→col1 statt
  `['über 10 Mio.', '106 400', …]` (STRUKTUR.md, Befund «Row-11-Spaltenriss in
  `extrahiereZhStreitwertStaffel`»). Das ist
  der konkrete **Gegentest-Kandidat**: findet der Audit diese dokumentierten Befunde wieder?
- **Tausendertrenner / Bereichsstrich** — «65– 250»→«65–250», bare/Leerzeichen-getrennte
  Tausender → Apostroph («5 000»→«5'000»), Jahreszahlen geschützt (kein 3-Ziffern-Match).
- **text-indent-Clipping** — erste Tabellenzeile links abgeschnitten (geerbtes negatives
  `text-indent` aus `<p pl-9 -indent-9>`; `scrollWidth` zeigt es **nicht** → nur visuell
  sichtbar, STRUKTUR.md, Befund «Tabellen links abgeschnitten»).
- **Zerrissene Wörter/Abkürzungen** — «St PO»→«StPO» (STRUKTUR.md, Befund «zerrissenes-Wort 16»).
- **Fussnoten-/Änderungshistorie-Leak** im Fliesstext — «Fassung gemäss…»/«B vom…»/
  Aufhebungs-Vermerke, die in den Body geraten (häufigste Klasse, STRUKTUR.md, Befund
  «fussnoten-leak 103»; latent auch in OR/ZGB/StGB, STRUKTUR.md, Karte «Bug-Check + Extraktor-Fix»
  «auch OR/ZGB/StGB latent»).
- **Absatz-Nummerierung** — lückenlos ab «1» (keine fehlende Erstziffer); **keine
  hochgestellte Fussnotenziffer als Absatznummer** interpretiert (ZH-243 §4: «10»/«5» waren
  Fussnoten, keine Absätze, STRUKTUR.md, Befund «ZH-243 §4 «10»/«5»»). Vom Fussnoten-Leak-Check abgrenzen:
  dort leakt *Text*, hier eine *Ziffer*.

## Rechtsprechung-spezifisch

Für den Entscheid-Korpus zusätzlich (re-fetch über `bgeReferenz`/`azaUrteil`/`normKeys`):

- **Leit ⟺ BGE-Invariante** (harte Invariante): jeder Leitentscheid hat eine BGE-Referenz und
  umgekehrt — keine Seite ohne Gegenstück.
- **aza-Kollision / Inversions-Schutz** — kein aza-Urteil in der Kollisions-Quarantäne
  durchgerutscht; Inversions-Schwelle (≥85 %) gehalten.
- **Sprach-Mislabel** — die Sprache ist aus dem Body abgeleitet, nicht falsch etikettiert.
- **Norm-Index nur Bundesgericht (§8)** — kein Kantons-/eidg.-Entscheid leakt in den
  Norm-Index.
- **BGE-Dedup** — kein doppelter BGE-kanonischer Eintrag (Dedup BGE-kanonisch).
- **Zukunftsdaten-Verwurf** — kein Entscheid-Datum > heute.

## Querschnitt (für jeden Posten beider Korpora)

- **Norm + Link + Stand vollständig** (§13 D1, verzahnt mit §7-Zitat-Ausnahme a–d): jeder
  Rechtswert trägt amtliche Quelle-URL, sichtbaren Live-Link und Stand (Konsolidierungs-/
  Abrufdatum). Fehlt eines, ist es kein Zitat, sondern eine zweite Wahrheit (§5).
- **Status-Ehrlichkeit (§7/§8)** — das `verifiziert`-Feld / der Status «geprüft» ist korrekt
  gesetzt; **nie 'geprüft'/`verified:true` ohne Davids Abnahme** (fachkundige Person,
  Zeitsperre bis 1.12.2026; Status-Hebung nur über den `gegenpruefung`-Skill (Abschnitt Abnahme), das Gate
  `src/tests/abnahmeGate.test.ts` bricht die Suite sonst). Kantonale Confidence misst nur die
  Extraktions-**Treue** zur Quelle, nicht die juristische Korrektheit — hohe Confidence bleibt
  Status «entwurf».
- **mobil/Lesbarkeit** — Screenshots 360/768/1280: mehrspaltige Blöcke gerendert, Zellen nicht
  verschmolzen, keine Clipping-Kante, Fliesstext in der Lesespalte (`max-w-reading`, §13 B1/B2).

## Ausgabe

**Posten-für-Posten** berichten — je produziertem/zitiertem Anker oder Wert:

> **Referenz** · «verifiziert» **oder** Bugtyp + Beleg (der **re-gefetchte** Text, der den
> Fehler zeigt) · **Korrektur**.

Dann den Entwurf korrigieren: falsche Anker/Zuordnungen richtigstellen, weggelassene
Aufzählungspunkte/Tabellenzeilen ergänzen, nicht-auflösbare Zitate ersetzen oder streichen,
Stale-Pins zum Neu-Pinnen flaggen (Update-Pfad in `methodology/normtext.md`), Render-Befunde
in die Darstellungs-Schicht (§3) zurückgeben. Hält alles, sage es **pro Posten** klar — nicht
mit einer pauschalen Unbedenklichkeits-Floskel. Links bleiben in der korrigierten Fassung
klickbar (Norm + Link + Stand, §13 D1).

**Findest du einen Fehler im bestehenden Korpus**, ist das ein §7-Korrektur-Fall: am Fundort als
Kommentar mit Quellenverweis verankern (§11) und im Korrektur-Protokoll nach `STANDARDS.md` **S8**
führen (datiertes wandert zusätzlich ins Verfallsregister, **S6**). Ein **Negativbefund** —
«geprüft, nichts gefunden» — wird aktiv dokumentiert, nicht verschwiegen (**S5**).

**Abschluss-Regel:** Bei einem roten Tor (Stand-Drift Exit 1, Gate rot) **kein Push, keine
Übergabe an `landung`** (§9). `review.md` deckt auf und korrigiert; Release bleibt bei
`landung`, die fachliche Abnahme bei `gegenpruefung` (Abschnitt Abnahme) — kein Duplikat (§5).
