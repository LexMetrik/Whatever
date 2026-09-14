# FAHRPLAN — Verweis-Schärfe: Binnenverweise, Aussen-Anzeige, Inventar (Auftrag David 31.8.2026)
<!-- @lagebild name: Verweis-Schärfe · zweck: Verweise in Gesetzen springen richtig — im Gesetz selbst, und Aussenverweise sind als solche erkennbar. -->

> **ROADMAP-Schritt:** `W2·20-VERWEIS-SCHAERFE` (`feld: leser`).
> **Auftrag David 31.8.2026 (wörtlich):** «baue noch vertieft anhand der vorhandenen daten wie
> das gesetz selbst verlinkt ist, also dass es wenn es bspw. bestimmt sich nach art. xx dieses
> gesetzes dass es dann zu dem gesetz springt und wenn es ausserhalb ist dass es das anzeigt.
> insgesamt die schärfe wie gesetze inventarisiert sind erhöhen.»
> **Messgrundlage:** Bestandsmessung 31.8.2026 (Erkenner-Replay über alle 1 458 Snapshots,
> 24 489 Zitat-Stellen: 71.1 % verlinkt) — Volltext:
> `bibliothek/normtext/verweis-inventar-messung-2026-08-31.md`.

## §1 · Einheiten (`W2·20-VERWEIS-SCHAERFE`)

Leitplanke überall: **kein Link ist besser als ein falscher Link** (§1); nur vorhandene Daten
(Register-Manifest, Snapshots), kein Scraping, kein Korpus-Rebuild.

- **V-1 · Verweis-Inventar-Tor** *(S–M)* — deterministisches Report-Skript
  (`scripts/check-verweis-inventar.ts`): je Erlass/Formklasse erkannte Verweise,
  aufgelöst intern/extern/Text, als committetes Artefakt + Wächter mit Basislinien-Modell
  (Vorbild `check:ui-normzitate`). Ersetzt Kommentar-Zahlen durch Messbares; flaggt tote
  Selbstziele (KVG Art. 11, AI-640.000 Art. 90a) als Datensignal. **Vor** jeder Schärfung.
- **V-2 · Selbstmarker-Weiche vor die Fremd-Guards** *(S)* — «des vorliegenden Gesetzes /
  der vorliegenden Verordnung …» und das EIGENE Kürzel sind explizite Selbst-Signale und
  dürfen nicht im des/der-Guard bzw. M12 landen (36 Stellen: 18 + 13 kantonal eigene
  Kürzel + 5 Bund eigenes Kürzel als Fedlex-Extern-Chip). Zwillings-Beleg AHVG Art. 9
  (unverlinkt) vs. AIG Art. 80a (verlinkt). Golden-neutral für alles andere.
- **V-3 · Kanton-Kürzel-Resolver** *(M)* — Fremd-Kürzel in kantonalen Erlassen
  kantons-gescoped über das Register-Manifest auflösen (1 158 eindeutige Kürzel; 400 heute
  unterdrückte Stellen werden Links auf den korpus-eigenen Snapshot); 65 mehrdeutige und
  107 registerlose bleiben Text. Kein neuer Client-Index — das Manifest lädt der Leser schon.
- **V-4 · Aussen-Anzeige** *(M)* — sichtbare Ruhe-Unterscheidung Self-Sprung vs. Verweis in
  einen ANDEREN Erlass (heute identische Klasse `VERWEIS_INLINE_CLASS`, null Signal);
  Anatomie nach DESIGN-REGLEMENT (bestehende Verweis-/Chip-Idiome, kein neues Farbwort).
  Der Grundsatz-Entscheid «korpus-interne Bundes-Fremdziele intern statt Fedlex-extern
  adressieren» hängt an 16 Wächter-Zusicherungen (`NormChip.tsx:76-88`) und ist HIER NICHT
  enthalten — eigener Folge-Schritt nach V-1-Baseline.
- **V-7 · Erlassnamen-Positivliste** *(M; Bund-Stufe gebaut 1.9.2026)* — zwei gemessene
  Restklassen brauchen denselben Unterbau: (a) des/der-Guard-Stellen (812; ~20 % echte
  Self-Links in der V-6-Stichprobe — NIE über eine weichere Guard-Regel lösen), (b)
  ausgeschriebene Fremdgesetz-Namen mit EINEM Grossbuchstaben (78 Bund-Stellen, Mehrheit
  echt selbstbezüglich). Auflösung nur über eine kuratierte Namen→Erlass-Liste (Vorbild
  GENITIV_GESETZ), nie heuristisch (§1). **Gebaut:** `src/lib/fedlex/positivliste.ts` —
  Kurztitel-Genitive mit Geltung je Ebene (`bund`, wenn ein Kanton den Namen ebenfalls
  vergibt; Falschlink BE-154.21 KDSG→DSG auf main), amtliche Volltitel «Bundesgesetzes/
  Verordnung [vom Datum] über …» (Register-Titel wörtlich), Klammer-Nachprüfung; Wächter
  `fedlex-positivliste.test.ts` belegt jeden Eintrag am Bund-Register. Bilanz im V-1-Tor:
  FREMD 4 900→6 048, 198 falsche Self-Links entfernt (Dossier
  `bibliothek/normtext/verweis-positivliste-messung-2026-09-01.md`).
  **Bund-Rest gebaut 14.9.2026** — V-7c Trägergesetz-Kontext: «des Gesetzes» meint das Gesetz,
  das der Ingress der Vollzugsverordnung LEGALDEFINIERT («… des Arbeitsgesetzes vom 13. März 1964
  (Gesetz, ArG)»). Kuratierte Tabelle `src/lib/fedlex/traegergesetz.ts` (ARGV1, ARGV2, UVV, MVV,
  LSV, LRV, VKL → ArG/UVG/MVG/USG/KVG), Wächter `src/tests/fedlex-traegergesetz.test.ts` prüft je
  Eintrag Ingress-Wortlaut, Eindeutigkeit der «Gesetz»-Klammer und Datums-Gleichheit; 169 Glieder,
  davon 97 vorher FALSCHE Self-Links. Dazu 15 amtliche Kurztitel mit Korpus-Ziel (28 Glieder).
  Dossier `bibliothek/normtext/verweis-traegergesetz-messung-2026-09-14.md`.
  **Offen:** kantonale Namensliste («§ N des Personalgesetzes», 916 Stellen), Kurztitel OHNE
  Korpus-Erlass (Gaststaat-, Revisionsaufsichts-, Subventions-, Zollgesetz … ~146 Stellen — hängt
  am Korpus, s. Dossier §Kernbefund 3), historische Titel.
- **V-8 · Amtliche Kürzel-Schreibweisen** *(S; gebaut 1.9.2026)* — 601 «Art. N KÜRZEL»-
  Stellen trugen die amtliche Mischschreibung (BankG, AsylG, FinfraG, GSchG …), die
  FEDLEX-Tabelle den Grossbuchstaben-Key: unbekanntes Kürzel ⇒ Text. Tabelle
  `KUERZEL_SCHREIBWEISEN` (Beleg: Titel-Klammer im Register) wirkt in Anker, N2, Form B
  und Chapeau-Eindeutigkeit; M12-Klasse 1 572→991.
- **V-5 · Zeit-Kante (Übergangs-/Altrecht-Selbstverweise)** *(offen, Konzept nötig)* —
  93 + 72 Stellen meinen eine Vorfassung; Sprung in die geltende Fassung ist ohne Hinweis
  irreführend (§8). Nicht bauen ohne Konzept (hängt an W2·5g-ZEIT); nur im V-1-Report
  ausweisen.

**Risikopfad-Hinweis:** Bau berührt `src/components/NormText.tsx`/`NormChip.tsx`/
`inhalt-sprung.tsx` (kein Risikopfad) — NICHT `src/lib/normtext/**` und NICHT
`scripts/normtext/**`; der Resolver konsumiert das Manifest zur Laufzeit. Damit keine
Gegenprüfungs-Pflicht per Pfad; die fachliche Schärfe sichert das V-1-Tor. V-7/V-8 (1.9.)
liegen in `src/lib/fedlex/**` (Erkenner-Tabellen, kein Risikopfad nach `istRisikoPfad`);
die kuratierten Einträge gehen als prüfbare Liste in den PR (Zweitblick, Abnahme David).

### §1a · Bekannter konservativer Verlust (Auflage Gegenprüfung 1.9.2026, PR #611)

Die Fortsetzungs-Regel des Volltitel-Zweigs (kein Link, wenn hinter dem Titel-Fragment ein weiteres
Titelwort folgt, ohne bestätigendes Datum) nimmt rund 11 **richtige** Links mit (z. B. AR-721.1 art_77
«…des Bundesgesetzes über den Schutz der Gewässer betreffend die Ausscheidung…», AR-832.311 art_7 KVG).
Bewusst so belassen: §1 «kein Link besser als falscher». Wer sie zurückholen will, braucht eine
Titel-Vollform je Ziel (nicht das Präfix) — kein Regex-Nachbau.

## §2 · Mess-Kern (31.8.2026, Kurzform)

Verteilung: 14 691 Self-Links · 2 720 Fremd-Links (Chips) · 7 078 Text, davon
des/der-Guard 1 692 · N2-Kürzel 2 375 · kein Token 985 · Grosswort 585 (400 kantonal
eindeutig auflösbar) · M12 486 · F41 355 (Nullprobe: kostet 0 explizite Selbstmarker).
Selbstmarker verweis-tragend: 548 Stellen/79 Erlasse, davon 528 bereits verlinkt.
`bestimmungsEtikettStatus:'entwurf'` bei allen 1 231 kantonalen Erlassen = ungedeckter
Unterbau jeder §/Art.-Weiche (Abnahme-Warteschlange David).
