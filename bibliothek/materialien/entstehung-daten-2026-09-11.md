# Entstehung am Artikel — Bau-Befunde der Daten-Etappen E1/E2/E4

**Erstellt:** 11.9.2026, Auftrag David 11.9.2026 («führe alles durch», Go zu
`W2·6c-ENTSTEHUNG-DATEN`); Spec `fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md` §11 Fassung 5.
**Status:** einfach belegt (alle Zahlen im Bau selbst erhoben; adversariale Gegenprüfung steht aus,
fachliche Abnahme David offen).

**Quellen (alle live abgerufen 11.9.2026):**

| Quelle | Endpunkt | Abruf |
|---|---|---|
| Fedlex-Gesetzgebungs-Projektgraph (jolux) | `https://fedlex.data.admin.ch/sparqlendpoint` (POST, `sparql-results+json`) | 11.9.2026 |
| Vokabular `type-projet` | `https://fedlex.data.admin.ch/vocabulary/type-projet` (`skos:inScheme`/`skos:prefLabel`@de) | 11.9.2026 |
| Bundesblatt-HTML (Botschaften) | Filestore-URL aus `jolux:isExemplifiedBy`, nie konstruiert | 11.9.2026 |
| Curia Vista (Parlamentsdienste) | `https://ws.parlament.ch/odata.svc/` (OData v3, `$format=json`) | 11.9.2026 |

Nutzungsauflage Curia Vista (Zitat, R4 6.9.2026 erneut bestätigt): Quellenangabe
«Parlamentsdienste der Bundesversammlung, Bern»; die Daten dürfen inhaltlich nicht verändert werden.
Übernommene Textfelder (`ResolutionText`, `CommitteeName`, `Subject`) stehen deshalb unverändert im
Shard; abgeleitete Zahlen sind als eigene Auszählung beschriftet.

---

## 1 · Verfahrenskette (E1) — was der Projektgraph wirklich hergibt

- **Vokabular `type-projet` ist vollständig 26 Codes** (Abfrage `skos:inScheme`, COUNT = 26). Die
  Recherche vom 6.9.2026 hatte 15 Codes über Belegungszahlen gefunden; die elf weiteren (3, 5, 7,
  450, 700, 701, 710, 715, 716, 720, 900) fehlten dort. Sie sind in der festen Tabelle
  `src/lib/materialien/verfahren.ts` ergänzt. Ein Code ausserhalb der Tabelle macht den Generator rot.
- **Abdeckung im Repo-Korpus: 1 609 Verfahrens-Ereignisse über 407/407 Botschaften (100 %)**,
  aus 479 Projekt-Knoten. Jede Botschaft trägt mindestens den Schritt «Botschaft des Bundesrats»
  (Code 200) — erwartbar, weil die Botschaft selbst dieser Schritt ist.
- **Zwei Durchgänge statt eines OPTIONAL.** Ein `?event` in der Botschaften-Query multipliziert
  jede `?sr × ?oc × ?proj × ?botschaft`-Zeile mit der Ereigniszahl (Median 5, Max > 12). Der zweite
  Durchgang über die bereits bekannten proj-URIs kostet 12 Anfragen und bleibt beim selben Endpunkt.
- **Gespeichert wird nur der amtliche Code.** Schlüssel und deutsches Etikett sind daraus ableitbar;
  sie mitzuspeichern wäre eine zweite Wahrheit (§5) und kostete 40 KB von 100 KB Deckel.
- **Determinismus:** drei vollständige Netzläufe hintereinander, Ergebnis byte-gleich.

## 2 · Botschafts-Anker (E2) — der Bonus ist klein, und das ist die Nachricht

| Messung 11.9.2026 | Wert |
|---|---|
| Botschaften im Korpus | 407 |
| davon mit HTML-Manifestation (DE) | **43** (10,6 %) |
| davon mit `id="art_*"` | **4** (9,3 % der HTML-Botschaften, 1,0 % aller Botschaften) |
| eindeutige Artikel-Anker insgesamt | **189** |
| verworfene MEHRDEUTIGE eIds | **83** (30,5 % aller gefundenen eIds) |
| Sidecar-Volumen | 31,5 KB (Deckel 512 KB) |

- Der Cutover-Befund aus R3 (Anker erst ab 16.4.2025) trifft zu, wirkt sich im **Repo-Korpus**
  aber viel kleiner aus als im Gesamt-Bundesblatt: nur zwei unserer Botschaften sind überhaupt
  jünger als der Cutover. Die vier Treffer verteilen sich auf GWG, DBG, AIG, EOG — zwei davon
  (2024-650, 2024-1607) tragen Anker trotz Datum **vor** dem Cutover. Die Vergabe hängt also am
  Redaktionswerkzeug, nicht am Datum; R3s Formulierung «kein Dokument vor 16.4.2025» gilt für
  R3s Stichprobe, nicht allgemein. **Das ist eine Ergänzung zu R3, keine Nachführung** — R3s
  Stichprobenbefund bleibt als das stehen, was er am 6.9.2026 war.
- **Mehrdeutige eIds werden nicht ausgeliefert.** In `BOTSCHAFT-2025-1478` (AIG) sind 69 von 200
  eIds doppelt vergeben, weil das Dokument Artikel mehrerer Erlasse führt. Den ersten Treffer zu
  nehmen hiesse, den Leser mit hoher Wahrscheinlichkeit an die falsche Erläuterung zu schicken.
  Sie stehen im Feld `mehrdeutig` und der Artikel zeigt dann nur den Live-Link (§1 vor Abdeckung).
- **Die Mantel-Heuristik wurde nicht gebaut.** R3 hat sie an 28 Erlass-Unterabschnitten gemessen:
  ~32 % Treffer. Eine Zuordnung, die in zwei von drei Fällen falsch oder leer ist, erzeugt am
  Artikel eine falsche Behauptung. Mantelvorlagen bleiben auf Erlass-Ebene (`mantel: true`).
- **Typografie-Treue:** `&nbsp;`/`&#160;` werden zu U+00A0 aufgelöst und nie zu einem gewöhnlichen
  Leerzeichen gefaltet; Inline-Auszeichnung (`<sup>` …) verschwindet spurlos, damit aus
  «Art. 16<sup>c</sup>» nicht «Art. 16 c» wird — eine andere Artikelnummer.

## 3 · Deckungs-Diagnose je Erlass (E2) — der gebuchte Stand

Gemessen wird offline über zwei committete Artefakte: die oc-Fundstellen der Artikel-Fussnoten
(`public/normtext/historie/<KEY>.json`) gegen die Fedlex-Änderungsliste
(`public/normtext/revisionen/<KEY>.json`).

- **205 Erlasse, 1 573 von 3 968 Fussnoten-oc in der Änderungsliste = 39,6 % gesamt.**
- Spanne je Erlass **0 % … 100 %** — die Korpus-Summe verdeckt also genau das, wovor Kritik A7
  gewarnt hat. Deshalb bucht `bibliothek/register/entstehung-deckung.json` **je Erlass**.
- Die Zahl ist eine DIAGNOSE, keine Zusicherung: die Fussnoten reichen bis in die 1950er, die
  SPARQL-Liste ist erst ab ~2000 verlässlich. Ein Teilmengen-Tor wäre dauerrot. Was etwas
  bedeutet, ist der Rückgang je Erlass — und der macht `check:entstehung` rot.

## 4 · Rückbau-Prüfung `artikel-revisionen` (Kritik A13) — Behalt, mit Grund

A13 vermutete, der Shard `public/verzahnung/artikel-revisionen/**` samt Tor werde durch die
Historie-Daten zur Teilmenge und könne zurückgebaut werden. **Gemessen: nein.**

- **Konsumenten (Stand 11.9.2026, `grep` über `src/`): 17 Dateien**, darunter `KontextPanel.tsx`,
  `EntscheidVerzahnung.tsx`, `EntscheidLeser.tsx`, `bezugAuswahl.ts`, `bezugZeit.ts`,
  `inhalt-zustand.tsx`, `panelKontextLaden.ts`, `ArtikelLeser.leitfaelle.tsx`.
- **Der Shard beantwortet eine ANDERE Frage** als die Historie: `entscheidPraezision` /
  `entscheidDatum` / `bezugZeit` brauchen je Artikel das Revisionsdatum, um zu entscheiden, welche
  Fassung zum Zeitpunkt eines Gerichtsentscheids galt. Die Historie liefert die Fassungskette des
  Artikels, nicht diesen Zeitbezug.
- **Entscheid: behalten.** Benannter Grund: V1c-Vertrag des Entscheid-Lesers (Zeitbezug
  Entscheid ↔ Artikelfassung), 17 lebende Konsumenten, kein Duplikat der Historie.
  (§17-Gegengewicht verlangt den Rückbau nur, wo dieselbe Sorge doppelt getragen wird.)

## 4a · Parlaments-Etappen (E4) — Curia Vista im Vollabgleich

| Messung 11.9.2026 | Wert |
|---|---|
| Curia-Nummern aus dem Botschaften-Register | 402 |
| davon mit `Business`-Datensatz | **385** (95,8 %) |
| Rats-Beschlüsse (`Resolution`, über ALLE Vorlagen) | **3 577** |
| Kommissions-Vorberatungen (`Preconsultation`, Organ) | **790** |
| Schlussabstimmungen mit NR-Aggregat | **454** |
| Shard-Volumen | 1 492 KB über 385 Dateien (~3,9 KB je Geschäft; Deckel 2 MB = 73 %) |
| Laufzeit Vollabgleich | ~25 min (3 216 Anfragen, global ≤ 2/s) |

**17 Nummern ohne `Business`-Datensatz** — und das ist ein Muster, kein Zufall:
`09.095-2`, `zu 08.047`, `zu 13.075` (abgeleitete Geschäftsformen) sowie dreizehn
Legacy-Nummern mit vierstelligem Jahr (`1998.075`, `1999.026` … `2000.045`). Curia Vista
führt diese Vorgänge nicht unter der Nummer, die der Fedlex-Graph als
`parliamentDraftId` trägt. Für sie zeigt die Oberfläche nur den Fedlex-Link, nie einen
leeren Parlaments-Block (§8).

**Drei Befunde, die R4 (6.9.2026) korrigieren bzw. schliessen** — R4 bleibt als datierte
Stichprobe stehen und wird ERGÄNZT:

1. **`Resolution`-Abdeckung.** R4 §4 mass 6/15 = 40 % und markierte das selbst als
   methodisch verzerrt (Join nur über die ERSTE `Bill`). Über alle `Bill`-IDs gejoint
   ergeben sich **3 577 Beschlüsse über 385 Geschäfte**; DSG (17.059) allein hat 20
   statt der 0, die der naive Join lieferte. R4s Verdacht war richtig, die Zahl war es nicht.
2. **Decision-Codeliste vollständig.** R4 kannte fünf Codes (1, 2, 5, 6, 7). Live erhoben
   sind es **acht** — neu: 3 «Enthaltung», 4 «Anwesend», 8 «Demissioniert». Die Codes 0, 9,
   10 liefern keine Zeile. Details, Erhebungsmethode und Gegenprobe:
   [`register/curia-decision-codes.md`](../register/curia-decision-codes.md).
3. **Latenz statt Rate ist der Engpass.** Die Planannahme «~2 300 Anfragen bei ≤ 2/s
   ⇒ ~20 min» unterstellt, die Pause zwischen den Anfragen bestimme die Dauer. Gemessen
   antwortet der Endpunkt mit **~3,5 s Latenz**; streng seriell dauerte der Lauf **~3,5 h**
   (erster Anlauf: 25 Geschäfte in 13 min). Mit acht gleichzeitigen Geschäften und EINEM
   gemeinsamen Takt vor jedem Absenden bleibt die Rate bei ≤ 2 Anfragen/s und die Dauer
   fällt auf ~25 min. Wer künftig eine Crawl-Dauer schätzt: die Pause ist eine Obergrenze
   der Rate, keine Vorhersage der Dauer.

**Personendaten — die Grenze wirkt in der Abfrage, nicht erst im Artefakt.** Die
Voting-Abfrage nennt über `$select` genau `IdVote,Decision,DecisionText`. Namen,
`PersonNumber`, Fraktion und Kanton verlassen den Endpunkt nicht; die Aggregation ist
keine nachträgliche Anonymisierung, sondern die einzige Form, in der die Einzelstimmen je
gesehen werden. `check:entstehung` prüft zusätzlich die ausgelieferten Shards gegen eine
Sperrliste von 14 Feldnamen (Rot-Beweis im PR).

**Ständerat:** `Voting` trägt kein `Council`-Feld; der Rat wird nur über die Zeilenzahl
plausibilisiert (150–200 ⇒ Nationalrat). Für den Ständerat steht `rat: null` und nie eine
Zahl — Entscheid David 11.9.2026 Nr. 3.

## 5 · Pflegebedarf

| Was | Wann | Wie |
|---|---|---|
| Verfahrensketten | mit jedem Botschaften-Lauf | `npm run materialien:botschaften -- --datum=$(date +%F)`; Arbiter `check:botschaften-netz` |
| Anker-Sidecars | wenn eine neue Botschaft dazukommt | `npm run materialien:anker -- --datum=$(date +%F)`; Parser-Änderung nur mit `--parser-neu="<Grund>"` |
| Deckungs-Register | nach jedem Historie-/Revisions-Lauf | `npm run entstehung:deckung -- --datum=$(date +%F)`; Senkung nur mit Feld `grund` |
| Curia-Shards | Monatslauf | `normen-monatslauf.yml`, nie in der Gate-Kette (≈ 20 min) |
| `type-projet`-Tabelle | wenn der Generator einen unbekannten Code meldet | gegen das amtliche Vokabular nachführen, nie raten |

## 6 · Offen

1. Fachliche Abnahme David (§7/§8) — steht für alle Stufe-1-Dossiers aus.
2. Warum vier Botschaften Anker tragen und 39 gleichartige nicht: nicht verifiziert
   (Redaktionswerkzeug des jeweiligen Amts, R3 §8).
3. Exakte 1:1-Auflösung Curia-`Objective`-Koordinaten ↔ Fedlex-oc-ELI: weiterhin offen
   (R4 §3, hier nicht weiterverfolgt — der Shard verlinkt beide Seiten, behauptet keine Gleichheit).
