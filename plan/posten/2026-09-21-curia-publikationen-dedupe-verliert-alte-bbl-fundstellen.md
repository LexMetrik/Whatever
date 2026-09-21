<!-- @posten
dach: QS-KORPUS
titel: Curia-Publikationen-Dedupe verliert alte BBl-Fundstellen
anlass: Gegenprüfung PR #939 (Opus 5, 21.9.2026), Verdikt bestanden mit Auflagen; vorbestehend auf main seit #792 (11.9.2026)
-->

**Dach-Wahl (begründet, keiner der Fahrpläne nennt `scripts/entstehung/curia.ts` wörtlich):**
`QS-KORPUS` (`fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md`) — dort laufen die
Curia-Monatslauf-Befunde und -Gegenprüfungen bereits zusammen (Z. 147 „Gegenprüfung
Curia-Monatslauf #939", Z. 154 „Curia-Vista-Monatsjob ROT"). `W2·6d-PARLAMENT-ARTIKEL`
(NR-Abstimmungen je Artikel) und `W2·6d-URSPRUNG` (Ursprung je Bestimmung) sind
Feature-Bau-Schritte auf denselben Rohdaten, aber nicht Träger des Generators selbst —
ein Dedupe-Bug im Publikationen-Parsing ist kein Feature-Umfang dieser beiden.

**Verifiziert 21.9.2026 (Fundstellen selbst gelesen, Zeilennummern bestätigt):**

`scripts/entstehung/curia.ts:231–248` (`bauePublikationen`):
```
231  export function bauePublikationen(zeilen: OdataZeile[]): CuriaPublikation[] {
232    const m = new Map<string, CuriaPublikation>();
233    for (const z of zeilen) {
234      const p: CuriaPublikation = {
235        datum: odataDatum(z.PublicationDate),
236        art: txt(z.PublicationTypeName),
237        jahr: txt(z.PublicationYear),
238        nummer: txt(z.PublicationNumber),
239        text: txt(z.ReferenceText),
240        referendumsfrist: odataDatum(z.ReferendumDeadline),
241      };
242      m.set(`${p.datum ?? ''}|${p.art ?? ''}|${p.jahr ?? ''}|${p.nummer ?? ''}|${p.referendumsfrist ?? ''}`, p);
243    }
244    return [...m.values()].sort((a, b) => {
245      const ka = `${a.datum ?? '9999'}|${a.jahr ?? ''}|${(a.nummer ?? '').padStart(8, '0')}`;
246      const kb = `${b.datum ?? '9999'}|${b.jahr ?? ''}|${(b.nummer ?? '').padStart(8, '0')}`;
247      return ka < kb ? -1 : ka > kb ? 1 : 0;
248    });
```
Der Dedupe-Schlüssel (Z. 242, `datum|art|jahr|nummer|referendumsfrist`) enthält `text`
(= Curia `ReferenceText`) **nicht**. Alte BBl-Fundstellen liefern `PublicationYear`/
`PublicationNumber` = `null`; mehrere Entwürfe desselben Publikationsdatums (gleiches
`datum`/`art`/`referendumsfrist`, verschiedener `text`) kollabieren dann auf EINEN
Map-Eintrag — der zuletzt verarbeitete gewinnt, die übrigen verschwinden lautlos. Der
Sortier-Vergleicher (Z. 244–248) vergleicht ebenfalls nur `datum|jahr|nummer`, nicht
`text`/`art` — bei Ties (z. B. mehrere `null`-jahr/nummer-Einträge desselben Datums)
liefert er `0`; §2-Determinismus hält heute nur zufällig, weil der Dedupe solche
Gleichstände bereits vorher wegwirft.

`src/pages/MaterialienDeckung.tsx:164` zeigt nur eine Geschäfts-**Zählung**
(`eb.curia.haben`/`eb.curia.gesamt`, „Parlamentsgeschäfte im Bestand") — der Verlust
einzelner Publikationen ist damit heute nicht direkt nutzersichtbar, wohl aber in jeder
Ableitung, die `publikationen.length`/-Inhalt konsumiert.

`scripts/entstehung/curia.ts:13–17` (Nutzungsauflage, Zitat bestätigt): „Die Daten
dürfen nur mit Angabe der Quelle ‹Parlamentsdienste der Bundesversammlung, Bern›
verwendet werden." / „Die Daten dürfen inhaltlich nicht verändert werden." — ein
Dedupe, der amtliche Fundstellen stillschweigend verwirft, ist im Ergebnis eine
inhaltliche Veränderung des amtlichen Datensatzes, nicht nur ein Darstellungsfehler.

**Beleg der Live-Auswirkung (aus der Gegenprüfung PR #939, Opus 5, 21.9.2026 — hier
NICHT selbst neu gegen den Endpunkt geprüft, nur übernommen und mit Quelle
gekennzeichnet, §0 Ziff. 1):** Abruf `ws.parlament.ch/odata.svc`, 2026-09-21 — Geschäft
01.023 amtlich 32 `Objective`-Zeilen (DE), gespeichert 21 (−11, u. a. BGG/SGG/VGG; FR
32→21, IT 30→20); 08.053 −2 · 05.046 −1 · 99.067 −1. Stichprobe 15 verlorene Einträge in
4 von 21 geprüften Geschäften; Exposition 183 von 386 Shards (mindestens eine
Publikation mit `jahr`+`nummer` = `null`).

**Klasse:** Risikopfad, Klasse `daten` (Extraktion/Korpus) — Fix gehört NICHT in diese
Doku-Session (TABU `scripts/**`), sondern in einen eigenen `fix(`-Auftrag mit
Gegenprüfung.

**Nächste Schritte (Checkliste für den Bau-Auftrag):**
- [x] Fix (Klasse `daten`, `lex-daten` + eigene Gegenprüfung): `text` in den Dedupe-
      Schlüssel (Z. 242) aufnehmen UND gleichzeitig den Sortier-Vergleicher (Z. 244–248)
      um `text`+`art` als Tiebreaker erweitern (sonst kippt §2-Determinismus bei echten
      Gleichständen, die der geschärfte Schlüssel jetzt zulässt); Vollabgleich neu fahren,
      Erwartung Geschäft 01.023 → 32 Publikationen (DE).
- [x] Tor (§6.7, einmal rot zeigen): `check:entstehung` prüft je Shard
      `publikationen.length` gegen die im Lauf gezählten `Objective`-Zeilen, oder der
      Runner wird rot, wenn der Dedupe Zeilen schluckt.
- [x] Vor der ersten Anzeige beschriften (§8) — VERIFIZIERT und teilweise berichtigt, siehe Erledigungs-Vermerk: `publikationen[].datum` ist Curias
      Dokumentdatum, nicht das BBl-Erscheinungsdatum (Beleg 02.008: 2002-01-09 vs.
      Fedlex 2002-02-26); `schlussabstimmungen: []` heisst „keine Einzelstimmen-Daten"
      (vor ~2007), nicht „keine Schlussabstimmung".
- [ ] Nach dem Fix: PR #939 (Curia-Monatslauf 2026-09-20) schliessen, Monatslauf neu
      fahren (nächster planmässiger Termin 1.10.2026).

**FAHRPLAN-OFFENE-BEFUNDE.md geprüft, nicht geändert:** die Zeile „Gegenprüfung
Curia-Monatslauf #939" (Herkunft der Auflage) steht laut Z. 143–152 dieses Fahrplans
bewusst NICHT hier, sondern bleibt in `ROADMAP.md` (Dach-Schritt `QS-MONITOR-ROT`,
„harte Auflagen" — dort byte-genau, nichts zusammengefasst). `ROADMAP.md` ist für diese
Session TABU (Posten-Modell: Nebenfunde sind Dateien, keine ROADMAP-Zeilen) — dieser
Posten hier ist der vorgesehene Ablageort für den neuen Befund, keine Änderung an
`ROADMAP.md` nötig oder vorgenommen.


---

## Erledigungs-Vermerk 21.9.2026 (Bau-Session, Branch `fix/curia-publikationen-dedupe`)

**Erledigt bis auf den letzten Haken.** Offen bleibt nur: PR #939 schliessen und den
Monatslauf vom 1.10.2026 abwarten — der schreibt den Rest des Korpus fort.

**Der Fix ging TIEFER als diese Checkliste.** `text` allein genügte nicht. Ein Vollzensus
aller 14 669 DE-`Objective`-Zeilen (Abruf 21.9.2026, `$inlinecount=allpages`) hat gezeigt:
was der Sechs-Feld-Schlüssel danach noch zusammenfasste, sind **keine Doppellieferungen,
sondern dieselbe Fundstelle zu verschiedenen Entwürfen** desselben Geschäfts. Erst
`BillNumber` (im Shard als `publikationen[].vorlage`) macht den Lauf verlustfrei:
1923 → 2044 mit sechs Feldern, **2059 mit `vorlage` = rohe amtliche Zeilenzahl**.
Gefunden hat das die adversariale Gegenprüfung; ohne sie wäre ein halber Fix gelandet.

**Drei Zahlen dieses Postens sind berichtigt** (F8 — nicht überschrieben, sondern
korrigiert): Exposition **182 von 385** Shards, nicht 183 von 386; gespeicherter
Ausgangsbestand **1923**, nicht 1927. Nach dem Vollabgleich sind es **386** Shards
(02.008 kam neu dazu).

**Die beiden Beschriftungs-Hinweise waren nur teilweise richtig** — selbst nachgemessen
statt übernommen (§7), Belege in
`bibliothek/materialien/curia-publikationen-identitaet-2026-09-21.md`:
- `publikationen[].datum`: im Kern bestätigt (= Fedlex `jolux:dateDocument`), aber **enger**
  — gilt nur für `ReferenceTypeName` «Beratungsgegenstand / Entwurf»;
  `Schlussabstimmungstext`-Zeilen tragen das Erscheinungsdatum korrekt. Das hier zitierte
  Beleg-Geschäft **02.008 hatte zum Zeitpunkt der Behauptung gar keinen Shard**; geprüfte
  Ersatzbelege: 02.024 (−74 Tage), 08.053 (−62 Tage).
- `schlussabstimmungen: []`: Mechanismus bestätigt, **Grenze widerlegt** — nicht «~2007»,
  sondern die **Wintersession 2003** (früheste erfasste Schlussabstimmung 19.12.2003). Und
  die Deutung gilt nicht durchgehend: in neun Fällen nach 2003 heisst leer wirklich «keine
  Schlussabstimmung». Ungeprüft übernommen hätte das eine falsche Pflege-Regel ergeben.

**Nachbarn, die derselbe Mechanismus trifft** — eigene Posten, NICHT in diesem PR:
Kommissions-Vorberatungen (`Preconsultation`) verlieren über die Shard-Geschäfte
2093 → 790 Zeilen (62 %), Rats-Beschlüsse (`Resolution`) 3581 → 3577.
