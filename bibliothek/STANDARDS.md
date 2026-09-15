# Bibliotheks-Mindeststandards (verbindlich)

**Erlassen 7.6.2026** (Auftrag David: «notwendige Mindeststandards für die
Library»). Konkretisiert CLAUDE.md **§7** (verifizieren, nicht vertrauen)
und **§11** (geordnete Ablage) zu prüfbaren Regeln. **Durchsetzung:**
`bash scripts/bibliothek-check.sh` (Exit 1 bei Verstoss) — gehört zum
Bug-Check §9 vor jedem Deploy, der Bibliotheks-Änderungen enthält.

## S1 — Pflichtkopf jedes Dossiers

Jede Datei in `recherche/`, `behoerden/`, `normen/`, `kosten/`, `materialien/`,
`normtext/`, `seo/`, `betrieb/` beginnt mit:

1. `# Titel` (Zeile 1),
2. **Erstellt:**-Zeile mit Datum **und Auftrag/Anlass** (wer hat es warum
   bestellt),
3. **Status:**-Zeile mit GENAU einem Vokabular-Wert aus S2,
4. Quellen-Block: jede Quelle mit **amtlicher URL + Abrufdatum** bzw.
   Fedlex-**Cache + Konsolidierungsstand** (Format wie
   `register/quellen-register.md`).

## S2 — Status-Vokabular (ehrlich, dreistufig + Abnahme)

`ERSTRECHERCHE` (einfach belegt) · `ZWEIFACH GEPRÜFT` (Erstrecherche +
unabhängiger adversarialer Durchgang) · `ABGENOMMEN` (Wort-für-Wort durch
David). Zusatzmarker erlaubt («Norm-Kerne zweifach»), ersetzen den
Hauptstatus nicht. **Nie** «verifiziert/geprüft» ohne diese Bedeutung —
das UI-Statusmodell (`entwurf`/`geprüft`) und der `verified`-Anker hängen
daran (§8). Hochstufung nur mit Beleg im Dossier (wer, wann, wogegen).
Betriebs-Dossiers (`betrieb/`) starten ebenfalls mit `ERSTRECHERCHE`, auch
wenn sie inhaltlich eher ein Messbericht oder Entscheid sind — das Vokabular
wird dafür nicht erweitert.

## S3 — Quellen-Hierarchie und Zitier-Disziplin

1. **Nur amtliche Quellen als Beleg** (Fedlex, kantonale Erlasssammlungen
   via API in geltender Konsolidierung, Behörden-/Gerichtsseiten);
   private Quellen nur ALS PRAXIS-Schicht, ausdrücklich «privat» markiert.
2. Norm-**Wortlaute verbatim** aus dem gepinnten Cache (Anker-Format
   `art_335_c`); jedes «verbatim»/«wörtlich» im Dossier heisst
   ZEICHENGENAU — Haus-Anpassungen heissen «Haus-Fassung» und nennen die
   Abweichung (Lehre aus Review-Befund M-1/N-3, 7.6.2026).
3. Neue Gesetze: Pin in `scripts/fedlex-cache.sh` + Eintrag im
   Quellen-Register, **bevor** das Dossier sie als Beleg führt.

## S4 — Flüchtiges ist kein Beleg

`/tmp/…`-Pfade sind in Dossiers nur zulässig für die **reproduzierbaren
Fedlex-Caches** (Dateien aus `fedlex-cache.sh`, z. B. `/tmp/or.html`) und
klar als Arbeitskopie deklarierte Ableitungen daraus. **Heruntergeladene
Originale (Muster, Merkblätter, PDFs) werden als Text-Extrakt in
`bibliothek/muster/` archiviert** und im `MANIFEST.md` mit URL + Stand
geführt — URLs amtlicher Stellen sind NICHT wiederbeschaffungs-garantiert
(Lehre 7.6.2026: 51 Muster lebten nur in /tmp).

## S5 — Negativbefunde sind Pflichtinhalt

«Existiert nicht / nicht auffindbar / 404» wird ausdrücklich festgehalten
(Beispiele: kein EHRA-AG-Muster; kein amtliches KE-Anmeldeformular) —
sonst sucht die nächste Recherche dasselbe noch einmal oder, schlimmer,
erfindet es.

## S6 — Datiertes wandert SOFORT ins Verfallsregister

Jeder datierte/änderbare Parameter (Tarif, Listen-PDF, Muster-Stand,
Schwellenwert) erhält **im selben Arbeitsgang** eine Zeile in
`register/parameter-verfall.md` (Fundstelle, Stand, Prüfrhythmus,
nächste Prüfung). «Verfallsregister-Kandidat» als blosse Dossier-Notiz
ist ein Verstoss (Audit-Befund 7.6.2026: 6 Kandidaten waren nie
registriert).

## S7 — Vernetzung ist Pflicht, nicht Kür

1. Jede neue Datei erhält **im selben Commit** ihre Zeile im zuständigen
   INDEX (recherche → `recherche/INDEX.md`, alles andere → Haupt-INDEX).
2. Wird ein Modul gebaut/geändert, wird seine Zeile in
   `register/engine-map.md` nachgeführt (Modul → Dossiers → Status).
3. Relative MD-Links müssen auflösen; Code-Verweise (`src/…`) müssen
   existieren — **geplante** Dateinamen sind als solche zu kennzeichnen
   («künftig», «Plan»).
4. Wird etwas GEBAUT, wird der tragende Dossier-Eintrag nachgeführt
   (GEBAUT-Vermerk + Commit/Route) — Dossiers, die Gebautes als offen
   führen, sind Verstösse (Audit-Befund: betreibungskosten.ts).

## S8 — Korrekturen am eigenen Bestand (§7-Korrektur-Protokoll)

Stellt eine Recherche einen Fehler in einem ÄLTEREN Dossier fest, wird
dieser **dort** korrigiert (durchgestrichen + Korrekturvermerk mit Datum
und Beleg) und im neuen Dossier referenziert — nie stillschweigend
überschrieben (Vorbild: 806b-Korrektur, 7.6.2026).

## S9 — Bestelltes Wissen, nicht Halden

Dossiers sind **engine-orientiert** (§11): decision-tree-fähige Regeln
(Eingabe → Ausgabe), Geltungsbereich/Ausnahmen, Bauspezifikation. Reine
Prosa-Sammlungen ohne Regel-Destillat erfüllen den Standard nicht.

## S10 — Prüfung

`scripts/bibliothek-check.sh` prüft maschinell: INDEX-Vollständigkeit ·
tote relative Links · Pflichtkopf (Erstellt/Status) · verbotene
/tmp-Verweise (ausserhalb der Cache-Whitelist) · unregistrierte
«Verfallsregister-Kandidat»-Marker. Der Check ist Teil des §9-Bug-Checks;
nicht prüfbare Standards (S2-Ehrlichkeit, S3-Zitiertreue, S9) bleiben
Gegenstand der adversarialen Durchgänge und der Abnahme.
