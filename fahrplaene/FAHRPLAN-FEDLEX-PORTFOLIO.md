# FAHRPLAN-FEDLEX-PORTFOLIO — Nützliche Fedlex-Datenarten für LexMetrik
<!-- @lagebild name: Bundesrecht aktuell halten · zweck: Wächter gegen Abweichungen zur amtlichen Quelle; Korpus-Lücken schliessen; Watchlist. -->

**Heimat: ROADMAP-Schritte `QS-CURRENCY` und `W2·14-SIGNAL`** (je Paket am Ende dieses
Dokuments benannt). *Nachtrag 14.8.2026 (QS-PLAN-EINFACH): die früheren Teil-Etiketten
`W2·14-SIGNAL-B1/-B2/-GER` sind Checklisten-Zeilen des Dachs — Trailer ist einheitlich
`Roadmap: W2·14-SIGNAL`.*

## §0 · Zweck und Quer-Regeln

> **Fahrplan-§-Diät 15.8.2026 (`aufraeumen.md` §4b).** Die vier ausgeführten Pakete **2, 5, 3, 4**
> stehen im vollen, unveränderten Wortlaut in [`archiv/FAHRPLAN-FEDLEX-PORTFOLIO-erledigt.md`](../archiv/FAHRPLAN-FEDLEX-PORTFOLIO-erledigt.md);
> hier hält je eine Stub-Zeile den §-Anker. Offen und darum **hier** geblieben sind Paket 1
> (nur P1-a/b gebaut), Bridge B1 und die §§ 15–20.

Detailquelle (§14) zu den oben genannten ROADMAP-Schritten — sechs verwertbare
Fedlex-Datenarten für LexMetrik, Paket für Paket. Kein zweiter Einstieg.
**Fable plant, Opus baut** — jedes Paket ist Risiko-Pfad (Extraktion/Norm) ⇒
`check:gegenpruefung` Pflicht (§14 DoD), §7-Verifikation, §9-Deploy nur mit
Davids Ja. **Quellen-Hygiene (für ALLE Pakete):** ausschliesslich die amtliche
Fedlex-Stelle (SPARQL-Endpoint + Filestore-HTML) — nie ein Dritt-Repo.

> **Rolle dieses Dokuments:** Detailquelle (§14) zu den ROADMAP-Schritten, die am Ende je Paket benannt sind. **Kein** zweiter Einstieg. **Fable plant, Opus baut** — jedes Paket ist Risiko-Pfad (Extraktion/Norm) → `check:gegenpruefung` Pflicht (§14 DoD), §7-Verifikation, §9-Deploy nur mit Davids Ja.
> **Quellen-Hygiene (für ALLE Pakete):** ausschliesslich die amtliche Fedlex-Stelle — SPARQL `https://fedlex.data.admin.ch/sparqlendpoint` (POST, `Accept: application/sparql-results+json`, `curl --data-urlencode`) + Filestore-HTML. **Nie** das Dritt-Repo `droid-f/fedlex` (CC BY-NC-SA, kommerziell verboten). Kein fremdes Byte fliesst ins Produkt.
>
> Status: Plan (2.7.2026), noch kein Code. §14-Intake (ROADMAP-Verlinkung) erfolgt erst mit Davids Freigabe je Paket.
>
> **Ergänzt 3.7.2026:** Opus-Härtung (7 Untersuchungs-Briefs + 3 adversariale Kritiken + 3 live-verifizierte Repo-Fakten) in DIESE eine Datei eingearbeitet — Fable-Überblick bleibt §0; Andockregeln/Bausteine/Moat-Hebel/Verifikationspunkte/Meilensteine (Abschnitte 0b–0d + je Paket «Opus-Härtung» + Bridge B1 + Abschnitte «Recht/Lizenz-Leitplanken» / «Offene Verifikationspunkte» / «Reihenfolge & Meilensteine») stammen aus dem Opus-Bauplan. Reihenfolge bindend **1 → 2 → (B1) → 5 → 3 → 4**.
>
> **Drei live gegen den Arbeitsbaum verifizierte Repo-Fakten (nicht nur aus den Briefs übernommen; Currency-Blindfleck ist Paket-1-relevant):**
> 1. `scripts/fedlex-pins.ts:19` = `/^\s*"([a-z_]+)\|([a-z0-9/_]+)\|(\d{8})\|/gm` — Namensgruppe ohne `0-9`.
> 2. `scripts/fedlex-cache.sh` enthält **bereits** 13+ Ziffern-Namen-Pins (`asylv1/2/3`, `argv1..5`, `bvv_2`, `bvv3`, `co2_gesetz`, …) → diese Pins sind **jetzt parser-blind** = latenter Currency-Blindfleck. 218 Pin-Zeilen total.
> 3. `scripts/datenhaltung/ingest.ts:8,32` ingestet **nur** `public/normtext/bund` als `typ='normtext-bund'`; `scripts/gegenpruefung/kern.ts:63-84` Risiko-Globs = `scripts/normtext/`, `src/lib/normtext/`, `public/normtext/*.json`, `scripts/**/*check*` — **nicht** `scripts/materialien/`, **nicht** `public/materialien/`, **nicht** `scripts/`-root (also `fedlex-cache.sh`-Edits triggern das Gate nicht).

---

## §16 · ROADMAP-Spec W2·14-SIGNAL (wörtlich verschoben 31.7.2026)

> **→ Bau-Spec: «Paket 7 — Watchlist & Änderungs-Signale» dieser Datei.** Dieser § ist die *wörtlich hierher verschobene ROADMAP-Prosa* (Wortlaut-Heimat), nicht die Bau-Spezifikation — wer nur ihn slict, baut ohne die verbindlichen Einheiten, Entscheide und Querschnitt-Regeln.

*Wörtlich aus `ROADMAP.md` (QS-TOK/ROADMAP-Diät B4, 31.7.2026); dort bleiben Checkbox, `@meta`, Einzeiler, Pointer. Steuert nicht — Spec-Heimat.* *Wörtlich bis auf die Selbstverweise, die am 31.7.2026 auf «diese Datei» neutralisiert wurden (Endprüfung Fix-Runde 1; Fund R2-18).*

  «Sag mir, wenn sich Norm Y ändert / Gericht X neu entscheidet.» **Baut auf** vorhandener Currency-/
  Drift-Infra: `check:fedlex-versionen`, `check:rss-oc`, `scripts/fedlex-wiedervorlage-generieren.ts`,
  `register/parameter-verfall.md`, `public/normtext/currency.json`, Muster `src/lib/zuletztVerwendet.ts`.
  **Feasibility bewusst gespalten (§8) — die zwei baubaren Stufen sind NICHT das, wonach es klingt:**
  **B1 🟢 statischer Änderungs-Feed** (RSS/Atom/JSON, zur Build-Zeit aus `currency.json` + Verfallsregister
  erzeugt, analog `gen:fedlex-wiedervorlage`) · **B2 🟢 Client-Watchlist** (localStorage-Liste gemerkter
  Normen/Gerichte, beim Besuch gegen die statischen Build-Artefakte geprüft → «seit deinem letzten Besuch
  geändert»-Flag; exakt das `zuletztVerwendet`-Muster). Beide sind **zustandslos-konform** und aus dem
  Bestand baubar.
  **Welches Feld das Rückblick-Signal WIRKLICH trägt (empirisch nachgelesen, §7 — Korrektur zum
  Erst-Intake):** `public/normtext/currency.json` führt je Erlass nur `{geprueftAm, naechsteFassungAb?}`.
  `geprueftAm` ist das Datum **unseres Currency-Laufs**, kein Norm-Änderungsdatum — es wandert bei jedem
  Re-Check auch ohne jede Änderung (→ Falschmeldungen) und markiert eine echte Änderung nicht als solche.
  **Tragfähig ist es nur für den VORWÄRTS-Fall** (`naechsteFassungAb`, «ab wann kommt eine neue Fassung»).
  Das **RÜCKBLICK-Signal kommt aus den Normtext-Snapshots**: `public/normtext/**/<ERLASS>.json` führt je
  Artikel `stand` (In-Kraft-Datum) + `fassungsToken` + `sha` (§7 Build-Regel 4) — nachgeprüft an
  `bund/ADOV` Art. 1 (`stand: 2023-01-23`, `fassungsToken: 20230123`). Der Watchlist-Vergleich läuft
  darum gegen `fassungsToken`/`sha`, nicht gegen `geprueftAm`.
  **Gerichts-Hälfte — eigenes Verdikt, nicht unter dem Fedlex-🟢 mitgeführt (§8, Korrektur zum
  Erst-Intake):** die oben genannten Belege (`check:fedlex-versionen`, `check:rss-oc`,
  `fedlex-wiedervorlage-generieren.ts`, `currency.json`) sind **ausnahmslos Norm-seitig** — auch
  `check:rss-oc` prüft den Amtliche-Sammlung-RSS, nicht Gerichte. Der Bestand, der «Gericht X entscheidet
  neu» trägt, ist ein **anderer**: `public/rechtsprechung/register.json` (6341 Einträge, je Eintrag
  `gericht`/`gerichtstyp`/`kanton`/`datum`/`normKeys`/`fassungsToken`) plus die Import-Strecke
  `scripts/rechtsprechung/` (BS) und `scripts/normtext-entscheide.ts`. **Verdikt darauf: 🟡 baubar mit
  ehrlicher Einschränkung** — ein Build-Zeit-Delta über `register.json` (neue Einträge je Gericht/Norm
  seit Datum X) ist deterministisch und billig; es gibt aber **keinen Live-Gerichts-Feed**: das Signal
  feuert erst, wenn WIR neu importieren. Die Latenz ist damit die Import-Kadenz, nicht die Publikations-
  geschwindigkeit des Gerichts — **das wird in der UI offengelegt** («Stand des Entscheid-Bestands: …»),
  sonst suggeriert die Funktion eine Aktualität, die der Korpus nicht trägt.
  **🟠 Echtes Push-/E-Mail-Abo ist ein Architektur-BRUCH** — es verlangt Nutzeridentität,
  serverseitigen Subscription-State und einen Sendedienst und verletzt damit «Werkzeuge bleiben zustandslos»
  (CLAUDE.md §5): **kein Bau ohne ausdrücklichen Architektur-Entscheid Davids**, und **nicht** in den
  B1/B2-Bau mischen. Optionen-Vergleich (B1/B2/Push, mit Kosten und Bruchstellen):
  `bibliothek/recherche/watchlist-signale-architektur.md`. Currency-Fläche: `FAHRPLAN-FEDLEX-PORTFOLIO.md`;
  lose an `QS-CURRENCY`. **DoD:** Feed-Generator deterministisch (2 Läufe byte-gleich) · **keine
  Mandats-/Personendaten in localStorage** (§8, Berufsgeheimnis) · Rückblick-Flag nachweislich gegen
  `fassungsToken`/`sha` gebildet, **nicht** gegen `geprueftAm` (sonst Falschmeldungen) · Gerichts-Signal
  mit sichtbarem Bestands-Stand ausgeliefert (§8-Offenlegung der Import-Latenz) · Tore grün.
  Trailer `Roadmap: W2·14-SIGNAL`.

### Teilschritt-Spezifikation W2·14-SIGNAL (verschoben 31.7.2026)

*Aus `ROADMAP.md` hierher verschoben (QS-TOK-Nachdiät, 31.7.2026, Nachhalte-Konvention*
*Ausführungs-Protokoll Ziff. 6). Die ROADMAP führt je Teilschritt nur noch Checkbox,*
*`@meta` und einen Einzeiler; der Wortlaut unten ist die massgebliche Fassung.*

**Schnitt-Begründung (Session-Granularität AP-6) — wörtlich:** *Wörtlich bis auf die Selbstverweise, die am 31.7.2026 auf «diese Datei» neutralisiert wurden (Endprüfung Fix-Runde 1; Fund R2-18).*

  **Session-Granularität (AP-6, 31.7.2026):** die Spec portioniert selbst in B1 · B2 · Gerichts-Hälfte;
  die drei Teilschritte unten folgen dieser Reihenfolge (B2 prüft gegen das Build-Artefakt aus B1, das
  Gerichts-Signal hängt sich an die Watchlist aus B2). Dieser Schritt bleibt das Dach. **Bewusst NICHT
  als Teilschritt:** das 🟠 Push-/E-Mail-Abo — Architektur-BRUCH gegen «Werkzeuge bleiben zustandslos»,
  kein Bau ohne ausdrücklichen Architektur-Entscheid Davids und **nicht** in B1/B2 hineinziehen.

**Ursprünglicher Wortlaut der Teilschritt-Bullets — wörtlich:** *Wörtlich bis auf die Selbstverweise, die am 31.7.2026 auf «diese Datei» neutralisiert wurden (Endprüfung Fix-Runde 1; Fund R2-18).*

  - [ ] **14-SIGNAL-B1 · Statischer Änderungs-Feed (🟢)** — RSS/Atom/JSON zur Build-Zeit aus `currency.json` + Verfallsregister, analog `gen:fedlex-wiedervorlage`; **nur der VORWÄRTS-Fall** (`naechsteFassungAb`). DoD: Generator deterministisch, 2 Läufe byte-gleich. Detail: diese Datei §7.1. Trailer `Roadmap: W2·14-SIGNAL` (Teil-Etikett 14.8.2026 ins Dach konsolidiert).
  - [ ] **14-SIGNAL-B2 · Client-Watchlist (🟢)** — localStorage-Liste gemerkter Normen, beim Besuch gegen die statischen Build-Artefakte geprüft (`zuletztVerwendet`-Muster). **Rückblick-Flag zwingend gegen `fassungsToken`/`sha`, nie gegen `geprueftAm`** (sonst systematische Falschmeldungen); keine Mandats-/Personendaten in localStorage (§8). Detail: diese Datei §7.0/§7.1. Trailer `Roadmap: W2·14-SIGNAL` (Teil-Etikett 14.8.2026 ins Dach konsolidiert).
  - [ ] **14-SIGNAL-GER · Gerichts-Delta mit ehrlicher Latenz (🟡)** — Build-Zeit-Delta über `register.json` (neue Einträge je Gericht/Norm seit Datum X); **eigenes Verdikt, nicht unter dem Fedlex-🟢 mitgeführt**. Es gibt keinen Live-Gerichts-Feed — die Import-Kadenz wird als «Stand des Entscheid-Bestands» sichtbar ausgeliefert (§8). Detail: diese Datei §7.2. Trailer `Roadmap: W2·14-SIGNAL` (Teil-Etikett 14.8.2026 ins Dach konsolidiert).

### Dach-Prosa W2·14-SIGNAL im Wortlaut (verschoben 31.7.2026) *Wörtlich bis auf die Selbstverweise, die am 31.7.2026 auf «diese Datei» neutralisiert wurden (Endprüfung Fix-Runde 1; Fund R2-18).*

*Aus `ROADMAP.md` hierher verschoben (QS-TOK-Nachdiät, 31.7.2026); massgebliche Fassung.*

>   «Sag mir, wenn sich Norm Y ändert / Gericht X neu entscheidet.» **Baut ausschliesslich auf vorhandenen
>   Signalen** (Currency/Register/Wiedervorlage) — kein neuer Rechtsinhalt, keine Beratung; Speicherung
>   lokal, Werkzeuge bleiben zustandslos (Leitbild).
>   **Detail:** diese Datei §16. Trailer `Roadmap: W2·14-SIGNAL`.


---

## §17 · Kanonik-Arbiter meldet `fza`/`cmr` NICHT-KANONISCH (`QS-CURRENCY-KANON`, Befund 2.8.2026)

*24.9.2026: `QS-CURRENCY-KANON` ist in `QS-KORPUS` aufgegangen (Posten «fza/cmr NICHT-KANONISCH
klären …» dort; ROADMAP-CHRONIK.md, Fusionen 2026-09-24). Die Spec hier gilt unverändert.*

**Befund, reproduziert.** `npm run check:fedlex-versionen` endet mit **Exit 1**; im Abschnitt
«Kanonik-Arbiter (html-N vs. `isExemplifiedBy`)» stehen zwei Erlasse:

```
NICHT-KANONISCH  fza: gepinnt html-5, kanonisch html-9  → re-pinnen + regenerieren!
NICHT-KANONISCH  cmr: gepinnt html-3, kanonisch html-6  → re-pinnen + regenerieren!
```

Beide sind **Staatsverträge** (FZA `cc/2002/243`, Konsolidierung 2020-12-15 · CMR
`cc/1970/851_851_851`, Konsolidierung 2021-02-10). Die Versionszeile davor meldet für beide `OK`
(«gepinnt … = neueste Konsolidierung») — es geht also **nicht** um eine veraltete Fassung, sondern
um die **Alias-/Alt-Revisions-Wurzel innerhalb derselben Konsolidierung**: gepinnt ist eine andere
`html-N`-Datei als die, die Fedlex über `isExemplifiedBy` als kanonisch ausweist.

**Bestandsdefekt auf `main`, kein Feature-Nebenwirkung (§3 Verteilung statt Einzelwert).**
Nullprobe am 2.8.2026 im **unveränderten Haupt-Checkout**: derselbe Fehlschlag, Exit 1; die
betroffenen `scripts/fedlex-cache.sh`-Zeilen sind **byte-identisch zu `origin/main`**. Der Befund
gehört damit dem Bestand, nicht der laufenden Arbeit — und er ist beim Verfallsregister-Durchgang
vom 2.8.2026 nur **aufgefallen**, nicht verursacht worden.

**Was zu tun ist.**

1. **Klären, warum** die kanonische Wurzel abweicht — Staatsvertrags-Erlasse tragen bei Fedlex
   mehrere `html-N`-Ausprägungen derselben Konsolidierung (Sprach-/Ausgabe-Varianten,
   Nachpublikationen). Die Ursache gehört in die Übersichtsliste (`bibliothek/`, CLAUDE.md §11),
   nicht nur in einen Commit-Text: ohne verstandene Ursache ist ein Re-Pin ein Ratespiel, und der
   Arbiter meldet beim nächsten Lauf dasselbe.
2. **Kanonisch nachführen:** `scripts/fedlex-repin-kanonik.ts` auf beide Erlasse, danach
   Snapshots/Struktur **regenerieren**.
3. **§7-Verifikation nach dem Re-Pin:** Anker und Wortlaute der beiden Erlasse gegen die amtliche
   Fassung nachprüfen — ein Wurzel-Wechsel kann Artikel-Anker verschieben. Extraktions-/
   Generator-Fläche ⇒ **Risiko-Pfad**, `npm run check:gegenpruefung` pflichtig, golden byte-gleich
   (Änderungen an FZA/CMR sind erwartbar und müssen als **erklärter** Diff ausgewiesen werden, nicht
   als «golden angepasst»).
4. **Abschluss-Kriterium:** `npm run check:fedlex-versionen` meldet für `fza`/`cmr` keine
   Kanonik-Abweichung mehr. *Das Tor bleibt davon unabhängig rot, solange andere Pins überholt
   sind — das ist die laufende Currency-Pflege und gehört **nicht** in diesen Schritt (§14.3).*

**Abgrenzung.** Reiner Nachzug an der Kanonik-Wurzel. Keine Portfolio-Erweiterung, kein neuer
Erlass, keine Änderung am Arbiter selbst — wenn der Arbiter falsch läge, wäre das ein eigener
Befund und müsste zuerst an einem echten Fehlschlag gezeigt werden (§6.7).

*Hinweis zur Herkunft: Zu diesem Punkt hat ein Sub-Agent am 2.8.2026 einen Task-Chip angelegt.
Der Chip ist durch diesen Plan-Eintrag **ersetzt** (Vorgabe David: keine Chips) — massgeblich ist
allein dieser §.*

---

## §18 · §14-Intake 3.8.2026 (`QS-FRIT-DRIFT`, `QS-CURRENCY-TESTS`)

*Angelegt 3.8.2026 (Bauplan-QS). Beide sind reine Prüflogik ohne Snapshot-Schreiben —*
*`Gegenpruefung: n/a`. Die Ursachenklärung der Kanonik-Wurzeln bleibt `QS-CURRENCY-KANON` (§17).*

### §18.1 `QS-FRIT-DRIFT` — FR/IT-Drift-Wächter Stufe 1

*24.9.2026: `QS-FRIT-DRIFT` ist in `W2·5g-ZEIT` aufgegangen (Posten Stufe 2 dort; ROADMAP-CHRONIK.md, Fusionen 2026-09-24).*

- **Anlass:** sämtliche Norm-Verifikationen vom 3.8.2026 liefen **nur auf DE**. Eine
  französische oder italienische Fassung könnte längst abweichen, ohne dass ein Tor es sieht.
- **Zu bauen:** im `normen-monitor.yml` je **~30 Kern-Erlass** die **eId-Mengen** der drei
  Sprachfassungen über SPARQL abfragen und vergleichen; Abweichung ⇒ Meldung mit Erlass,
  Sprache und Differenz-Menge. Vollausbau auf alle 227 Pins ist optional und folgt der Laufzeit.
- **Ausdrücklich NICHT:** ein dreisprachiges Korpus. Dieser Schritt **vergleicht Mengen und
  meldet** — er schreibt keinen Snapshot. Das Befüllen der `fr`/`it`-Fassungen ist ein eigener
  Produktentscheid (Speicher, Pflege, §8-Ehrlichkeit) und liegt in **`W2·5g-ZEIT`**, Zeile
  «Mehrsprachiger Normvergleich» (vormals `W2·6-MEHRSPRACH`, Etiketten-Konsolidierung 15.8.2026).
- **Fertig, wenn:** eine künstlich verfälschte Mengenliste den Wächter **einmal rot** zeigt
  (§6.7) und der Grün-Fall über die 30 Kern-Erlasse reproduzierbar durchläuft.
- **Dateien:** `.github/workflows/normen-monitor.yml`, `scripts/fedlex-versionen-pruefen.ts`.

#### Bau-Stand 15.8.2026 — GEBAUT, mit drei Spec-Korrekturen (lebendige Spec)

**Dateien real:** `scripts/fedlex-frit-drift.ts` (neu, eigenes Modul),
`src/tests/fedlex-frit-drift.test.ts`, `package.json` (`check:frit-drift`),
`.github/workflows/normen-monitor.yml`. **`fedlex-versionen-pruefen.ts` wurde NICHT
angefasst** — dort lebt die Currency-Frage (welcher Stand gilt), hier die
Sprach-Frage (trägt der ausgelieferte Stand dieselbe Struktur in de/fr/it). Zwei
Fragen, zwei Tore; der Risikopfad-Nachbar bleibt unberührt.

**Korrektur 1 — «eId-Mengen über SPARQL abfragen» geht so nicht.** eIds stehen
**nicht** im Triplestore; jolux kennt Erlass, Konsolidierung, Sprach-Expression und
Manifestation, aber keine Artikel-Knoten. Real gebaut: SPARQL löst je Erlass und
Sprache die **XML-Manifestation** des gepinnten Standes auf
(`isRealizedBy(DEU|FRA|ITA) → isEmbodiedBy(userFormat=xml) → isExemplifiedBy`),
danach werden die eIds aus dem AKN-XML **gelesen** (Soft-404-Sonde über
Content-Type, nie über den Status).

**Korrektur 2 — «Abweichung ⇒ Meldung» braucht zwei Ebenen, sonst ist das Tor
dauerhaft rot.** Gemessen am 15.8.2026: **Kern-eIds** (ohne `/`, also Artikel und
Top-Container) stimmen in 27 von 30 Erlassen exakt; **Unter-eIds** (`art_220/para_1`)
weichen fast überall ab, weil DE/FR/IT real verschieden viele Absätze zählen — und
zwar amtlich gewollt: das OR sagt es in Art. 1033 selbst («Im französischen und
italienischen Text besteht dieser Artikel aus einem einzigen Absatz»). Darum:
Kern-Differenz ⇒ **rot** (Exit 1), Unter-Differenz ⇒ **RESIDUE-Hinweis**, nie rot.
Extremwert der Residue: BV 330/665 (fr) bzw. 328/783 (it) bei identischer
Artikel-Menge — Stufe 2 müsste dafür eine eigene Absatz-Semantik bauen.

**Korrektur 3 — der Mengenvergleich allein greift zu kurz: DUPLIKAT-Prüfung ergänzt.**
Der Erstbefund (unten) entstand dadurch, dass FR/IT einen eId **zweimal** vergeben.
Eine Menge schluckt das stillschweigend. Ein doppelter eId zerstört aber die
eId-Adressierbarkeit — genau die Eigenschaft, auf der `W2·5g-ZEIT` aufsetzen würde.
Doppelte Kern-eIds sind darum ebenfalls rot.

**Netz-Politik:** Exit 0 nur, wenn **alle** Kern-Erlasse verglichen wurden; sonst
Exit 2 «unvollständig» (kein stilles Grün, §6.7). Im Monitor wird Exit 2 als
`::warning::` annotiert statt rot gefärbt — «Fedlex nicht erreichbar» ist kein
Rechtsstands-Befund und würde den Alarm entwerten; Exit 1 färbt rot.

**Kern-Erlass-Auswahl (nicht von Hand geführt, §5):** abgeleitet aus
`fedlex-cache.sh` — Anker-Zahl ↓ (die §7-verifizierten, vom Produkt zitierten
Artikel = Tiefe der Abhängigkeit), Snapshot-Gewicht ↓, Name ↑; die ersten 30.
Liste jederzeit: `npm run check:frit-drift -- --liste`.

**Live-Lauf 15.8.2026 (34 s, 30/30 verglichen, 0 Netz-Ausfälle) — drei BEFUNDE,
alle gegen das amtliche Filestore-XML nachgeprüft (§7):**

| Erlass | Sprache | Befund |
|---|---|---|
| **OR** (SR 220 @ 2026-01-01) | fr | `art_219` fehlt; `art_221` **doppelt** — der Knoten mit `<num>Art. 219</num>` trägt den eId `art_220`, der Artikel-Text ist gegenüber dem eId **um eins versetzt** |
| **OR** | it | `art_219_a` fehlt; `art_219` **doppelt** — der Knoten mit `<num>Art. 219a</num>` trägt den eId `art_219` |
| **PatG** (SR 232.14 @ 2025-07-01) | fr + it | `art_86_l` fehlt; `art_86_k` **doppelt** — der Knoten mit `<num>Art. 86l</num>` trägt `art_86_k` |
| **BewG** (SR 211.412.41 @ 2023-07-01) | fr | `disp_u2`–`disp_u4` fehlen als eIds — der Inhalt ist da, aber als `<level eId="chap_6/lvl_u6…u8">`; **FR `disp_u1` = Schlussbestimmung 2020, DE `disp_u1` = die von 1997**: gleicher eId, anderer Erlassteil |

Gemeinsamer Mechanismus bei OR und PatG: ein **neu eingeschobener** Artikel
(`Art. 219a`, eingefügt per 1.1.2026 «Baumängel»; `Art. 86l`) bekommt in FR/IT
keinen eigenen eId, sondern den des Vorgängers. **Produktrelevanz:** wer FR/IT je
über eIds adressiert, serviert dort stillschweigend den falschen Artikel. Das ist
eine Eigenschaft der amtlichen Quelle, kein Defekt dieses Tors — Konsequenz für
`W2·5g-ZEIT`: die eId-Achse trägt **nicht** sprachübergreifend, es braucht einen
Abgleich über `<num>`. Dossier: `bibliothek/register/frit-drift-2026-08-15.md`.

**Korrektur 4 — ein Tor, das dauerhaft rot steht, wird stummgeschaltet.** Die vier
Fundstellen liegen bei Fedlex; wir können sie nicht beheben. Ein permanent roter
Monitor-Schritt hätte genau den Verfall wiederholt, den `normen-monitor.yml` an
Issue #166 selbst dokumentiert (vier Wochen identischer Kommentare). Übernommen
wurde darum das im Repo bereits bewährte Muster **G-AUFH** aus
`fedlex-versionen-pruefen.ts` (`anerkannteAufhebungNachEli`): die §7-verifizierte
Abweichung wird in `ANERKANNTE_DRIFT` **deklariert** und bei **jedem** Lauf live
gegen die Quelle nachgeprüft — deckungsgleich ⇒ ANERKANNT (grün, aber im Log
genannt); abweichend oder gewachsen ⇒ rot («Deklaration nachführen»); Abweichung
verschwunden ⇒ rot («Deklaration entfernen»). Undeklarierte Drift bleibt rot; ein
Duplikat in der **Ankersprache DE** ist nie anerkennbar. Der Befund wird damit
festgehalten und überwacht, nicht weggedrückt.

**Stand nach Deklaration (Lauf 15.8.2026, 42 s, Exit 0):** 14 Erlasse vollständig
identisch, 13 identisch auf Artikel-Ebene mit Absatz-Residue, 3 mit deklarierter und
live bestätigter Sprach-Drift, 0 undeklariert, 0 Netz-Ausfälle.

**Gegenprüfung 15.8.2026 (Fable, unabhängig, read-only): Verdikt zunächst «nicht
bestanden» — drei Funde, alle behoben und nachgemessen:**

1. **Kern-Definition zu eng.** «eId ohne `/`» warf **83 echte OR-Artikel**
   (`disp_u2/art_1`, vom Korpus als `disp_u2_art_1` adressiert) und 9 PatG-Artikel
   in die nie-rote Residue-Klasse — eine künftige Drift dort wäre unsichtbar grün
   gewesen. Neu ist das **letzte Pfadsegment** massgeblich (`art_`/`annex_`).
   Wirkung messbar: OR 1629 → 1712 Kern-eIds, ZGB 1109 → 1287, PatG 201 → 210.
2. **Pfad zu stillem Grün.** Drei leere eId-Mengen sind formal «identisch» und
   liefen als GLEICH/Exit 0 durch; eine Wartungsantwort mit korrektem
   `application/xml` («`<error>maintenance</error>`») kam durch die Soft-404-Sonde.
   Neu: Rumpf muss `<akomaNtoso` enthalten, und eine leere DE-Menge ist nie
   «gleich».
3. **BewG-Befund falsch beschrieben** (s. Tabelle oben) — die Deklaration hätte
   bei jedem Lauf eine unzutreffende Begründung als «live bestätigt» gedruckt.
   Zusätzlich unterdrückte ein `continue` nach ANERKANNT die RESIDUE-Zeile, die
   den wahren Mechanismus gezeigt hätte; beides korrigiert.
   Ebenfalls geschlossen: eine Deklaration ohne Inhalt erzeugt keine
   ANERKANNT-Zeile mehr (Blanko-Freibrief).

**Offen / für Stufe 2:** (a) Abgleich über `<num>`/Heading statt über die Menge —
der BewG-Fall (gleicher eId, anderer Erlassteil) ist für einen Mengenvergleich
**prinzipiell unsichtbar**; (b) Absatz-Semantik für die BV-Residue (330/665 bzw.
328/783 ist kein «1–5 %-Rest», sondern ein anderes Absatz-eId-Schema — die
Residue-Klasse trägt heute sehr Verschiedenes unter einem Etikett); (c) Ausbau von
30 auf alle 227 Pins (hochgerechnet ~5 min — erst nach (a) sinnvoll).
**Wartet auf David:** ob die vier Fundstellen Fedlex gemeldet werden.

### §18.2 `QS-CURRENCY-TESTS` — Testbindung `cacheBefund` + Kanonik-Ausschluss

- **Anlass (Gegenprüfung zu PR #420, Befund 1):** die neue Cache-Inhalts-Sonde und die
  Kanonik-Ausschlussliste hängen an **keinem Test**. Ein Tor, das nicht scheitern kann, ist
  gefährlicher als keines (§6.7).
- **Zu bauen:** je einen Negativfall — (a) ein Cache-Eintrag mit falschem Inhalt muss
  `cacheBefund` rot machen; (b) ein Erlass, der fälschlich auf der Ausschlussliste steht, muss
  auffallen. Beide zuerst **rot gezeigt**, dann grün gestellt.
- **Nicht hier:** re-pinnen, regenerieren oder Anker verifizieren — das ist Risikopfad und
  liegt in `QS-CURRENCY-KANON` (§17). Dieser Schritt ändert **keinen Pin**.
- **Dateien:** `src/tests/` — und NUR dort. *(Korrigiert 15.8.2026 beim Bau, lebendige
  Spec: die Zeile nannte `scripts/fedlex-cache.sh`. Dort liegt keiner der beiden Bausteine.
  `cacheBefund` steht in `scripts/normtext-snapshot.ts:362`, die Kanonik-Ausschluss-Dimension
  in `scripts/fedlex-wiedervorlage-generieren.ts:206-217` (`erhebe()`); beide sind exportiert
  und unter `VITEST` seiteneffektfrei importierbar — keine Fassade nötig. `fedlex-cache.sh`
  trägt nur die Bash-Zwillinge der drei Sonden-Konstanten (:449/:463/:469) und ist Risikopfad
  — es zu ändern wäre hier ausdrücklich falsch gewesen. Gebaut mit Diff = ausschliesslich
  `src/tests/`.)*

## §19 `QS-KORPUS-SCOPE` — scope/decl-Sektionen ohne annex-Container ingestieren

**Erledigt 12.9.2026, PR #838 (`87db8a514`):** 23 scope/decl-Sektionen in den 12 unten
genannten Staatsverträgen ingestiert, Gegenprüfung (Sonnet, Bau Opus) bestanden — keine
Blocker. Nebenfund: Leser-Wurzel-Label «Anhänge» uneinheitlich → eigener Schritt PR #840
(offen). Spec-Wortlaut unten unverändert stehen gelassen.

*Nachzug 15.8.2026 (Etiketten-Konsolidierung BAUPLAN-UMBAU): Das Etikett `QS-KORPUS-SCOPE` ist
aufgegangen — bauender Schritt dieser Spec ist seither das Dach `QS-KORPUS` (Korpus-Pflege,
Risikopfad ⇒ Gegenprüfung), die Zeile steht dort als Checklisten-Eintrag. **Trailer also
`Roadmap: QS-KORPUS`.** Gegenstand unverändert.*

- **Anlass (Gegenprüfung zu PR #425 / `W2·5d-ANNEX`, Nebenbefund N2, 3.8.2026):** 12
  Staatsverträge (cedaw, cisg, eaue, hbewue, huvue, krk, montreal, pvue, uno_antifolter,
  uno_brk, uno_pakt_i, uno_pakt_ii) tragen amtlich zusammen **23** `scope_`/`decl_`-Sektionen
  (Geltungsbereich / CH-Erklärungen und Vorbehalte) **ausserhalb** eines `div#annex`-Containers.
  `alleAnhangAnker` beginnt am Container — diese Inhalte fehlen darum **vollständig** in
  Snapshot und Sidecar. **Vorbestand** (vor und nach #425 identisch), an CISG/KRK/UNO_PAKT_II/
  CEDAW belegt. Zum Vergleich: bei den 14 Verträgen MIT Container (LUGUE-Klasse) sind dieselben
  Sektionstypen erfasst — die Lücke ist ein Container-Artefakt, kein Inhaltsentscheid.
- **Zu bauen:** Extraktor-Erweiterung, die `scope_*`/`decl_*`-Geschwister auch ohne
  `div#annex`-Container erfasst (eigener `div#scope`-Pfad); Snapshot + Sidecar der 12 Erlasse
  regenerieren; §7-Verifikation je Erlass (Identitätstreffer gegen die ELI-Fassung).
- **Mitnahme (Nebenbefund N1, gleiche Datei):** `ANNEX_CONTAINER`-Regex in
  `extrahiere-fedlex.ts` — Literal-Capture statt case-insensitivem Capture härten
  (`getElementById` ist case-sensitiv; Korpus heute 0 Varianten, reine Robustheit).
- **Risikopfad** (Extraktion) ⇒ adversariale Gegenprüfung Pflicht; golden-Diff ist hier
  ERWARTET (neue amtliche Substanz) und wird als beabsichtigt abgenommen, Drop/Leak-Prüfung
  über den textuellen Snapshot-Diff.
- **Dateien:** `scripts/normtext/extrahiere-fedlex.ts`, `scripts/normtext/struktur-extrahiere.ts`,
  `public/normtext/bund` (nur via Generator-Lauf).

---

## §20 · ROADMAP-Spec-Nachzug (wörtlich verschoben 4.8.2026, ROADMAP-Diät Welle 3)

*Herkunft: `ROADMAP.md`, Querschnitt-Band — AP-11 rückwirkend angewandt (ROADMAP-Diät Welle 3,
4.8.2026). In der ROADMAP bleiben je Schritt Checkbox, Titel, `@meta`, der **Anlass** (dort
ausdrücklich verlangt) und der Pointer auf den jeweiligen §; die **Bau-Spec** steht unten und in
den §§17–19. Steuert nicht — Spec-Heimat.*

### §20.1 `QS-CURRENCY-KANON` — Bau-Spec im Wortlaut *(→ Bau-Spec: §17 dieser Datei)*

> `check:fedlex-versionen` meldet im Kanonik-Arbiter beide Staatsverträge mit falscher `html-N`-Wurzel (`fza` html-5 statt html-9 · `cmr` html-3 statt html-6); die **Fassung** ist aktuell, die **Wurzel** nicht. *(Anmerkung 3.8.2026: die Kanonik-Wurzeln von acht Pins — `zgb`,`mwstg`,`bbg`,`usg`,`gwg`,`kag`,`fza`,`cmr` — sind mit PR #414 nachgeführt; dieser Schritt bleibt offen, bis die Ursache belegt und die Anker §7-verifiziert sind.)*

### §20.2 `QS-FRIT-DRIFT` — Bau-Spec im Wortlaut *(→ Bau-Spec: §18.1 dieser Datei)*

*Nachzug 15.8.2026 (Etiketten-Konsolidierung BAUPLAN-UMBAU): das im Wortlaut unten genannte
`W2·6-MEHRSPRACH` heisst seither `W2·5g-ZEIT` (Zeile «Mehrsprachiger Normvergleich»); die
Abgrenzung «hier nur Mengenvergleich, dort das Befüllen» ist unverändert.*

> im Monitor je **~30 Kern-Erlass** die eId-**Mengen** der drei Sprachfassungen vergleichen und Abweichungen melden; Vollausbau auf alle 227 optional. **Ausdrücklich KEIN dreisprachiges Korpus** — dieser Schritt vergleicht nur MENGEN und meldet; das Befüllen der `fr`/`it`-Fassungen ist **`W2·6-MEHRSPRACH`** und bleibt dort. Reine Prüflogik, kein Snapshot-Schreiben. **Fertig, wenn** der Monitor je Kern-Erlass drei eId-Mengen vergleicht und eine künstlich eingebaute Abweichung **einmal rot** zeigt (§6.7).

### §20.3 `QS-CURRENCY-TESTS` — Bau-Spec im Wortlaut *(→ Bau-Spec: §18.2 dieser Datei)*

> je einen Negativfall bauen, der die Sonde und den Ausschluss **einmal rot** zeigt, dann grün. Reine Prüflogik (`Gegenpruefung: n/a`) — **die Ursachenklärung der `fza`/`cmr`-Wurzeln ist Risikopfad und liegt in `QS-CURRENCY-KANON`**; hier wird nur die Scheiterns-Fähigkeit der Sonde gebaut, kein Pin geändert.

### §20.4 `QS-KORPUS-BMV` — Bau-Spec im Wortlaut

*Nachzug 15.8.2026 (Etiketten-Konsolidierung BAUPLAN-UMBAU): Das Etikett `QS-KORPUS-BMV` ist
aufgegangen — bauender Schritt dieser Spec ist seither das Dach `QS-KORPUS` (Korpus-Pflege,
Risikopfad ⇒ Gegenprüfung), die Zeile steht dort als Checklisten-Eintrag. Gegenstand unverändert.*

*(Kein Weiterzeiger: anders als §20.1/§20.3/§20.5 hat `QS-KORPUS-BMV` keinen eigenen
Befund-§ weiter oben — §17 behandelt ausschliesslich die `fza`/`cmr`-Kanonik. **Dieser
Abschnitt IST die Bau-Spec**; der frühere Verweis «→ §17» war ein Copy-Paste-Erbe von
§20.1 und zeigte auf einen fremden Gegenstand, Bauplan-Review 4.8.2026, Befund B1.)*

> regulärer Bundeserlass-Ingest nach Skill `korpus-werkstatt` (Pin, Snapshot, Sidecar, Register; neuer Register-Key neben dem historischen `bmv`), §7-Verifikation, Risikopfad ⇒ Gegenprüfung. Amtsbeleg: AKN `eli/cc/2025/408/20260301`, Art. 34 (Aufhebung alt) / Art. 36 (Inkrafttreten 1.3.2026).

### §20.5 `QS-KORPUS-SCOPE` — Bau-Spec im Wortlaut *(→ Bau-Spec: §19 dieser Datei)*

*Nachzug 15.8.2026 (Etiketten-Konsolidierung BAUPLAN-UMBAU): aufgegangen im Dach `QS-KORPUS` —
Trailer `Roadmap: QS-KORPUS`, Gegenstand unverändert.*

> Extraktor-Erweiterung + Regeneration der 12 Erlasse, §7-Verifikation; Mitnahme N1 (ANNEX_CONTAINER-Regex-Härtung, gleiche Datei). **Risikopfad** ⇒ Gegenprüfung; golden-Diff erwartet (neue amtliche Substanz).


---

## §21 · ROADMAP-Spec `W2·5n-BUND-VOLL` — Bund-Vollabdeckung (Entscheid David 1.9.2026)

**Anlass:** Quellen-Sichtung 1.9.2026 (`bibliothek/recherche/fremdquellen-sichtung-2026-09-02.md` (absorbiert)):
Legalize-ch (5'139) und OpenCaseLaw (5'525) zeigen, dass alle SR-Erlasse mit deutschem Akoma-Ntoso-XML
maschinell ladbar sind; LexMetrik pinnt 238. Zielbild «alle Gesetze, die ein Schweizer Jurist braucht»
heisst für den Bund: die ganze SR, nicht nur der Kern.

**Ziel und Grenzen (Schritt nennt Ziel, nicht Weg):**
- Inventar per Fedlex-SPARQL: alle `eli/cc/`-Erlasse mit deutscher XML-Konsolidierung, in Kraft.
  Zweitlesung des Inventars gegen die Dateilisten von Legalize-ch (`ch/cc-*.md`) und OpenCaseLaw
  (`laws` federal) — Abweichungen je Richtung ausweisen, nie stillschweigend übernehmen.
- Laden über den bestehenden Fedlex-Adapter (`fedlex-cache.sh` / Skill `korpus-werkstatt`, sechs
  Build-Regeln), in Tranchen ≤ 500 Erlasse mit je einer Gegenprüfungs-Stichprobe n ≥ 10.
- **Harte Auflage Datenlast (§15):** Voraussetzung ist der Register-Schnitt aus `QS-PERF` — Register
  je Erlass/Shard, Katalog-Projektion getrennt; `check:perf-budget` ist das Tor, der Deckel wird nicht
  angehoben. Ohne Schnitt kein Tranchen-Start.
- Bestand golden byte-gleich; neue Erlasse Status «entwurf», Abnahme-Welle ab 1.12.2026.
- Ausserhalb: fr/it (Zielbild Deutschschweiz), Staatsverträge ohne deutsches XML (bleiben Live-Link).

**Fertig, wenn** das Inventar 0 fehlende deutsche XML-Konsolidierungen meldet und `check:normtext`,
`check:fedlex-versionen`, `check:perf-budget` grün sind.

---

## Archivierte Abschnitte *(Plan-Neuschnitt 29.8.2026)*

19 Abschnitt(e) dieser Datei sind wörtlich nach
[`archiv/fahrplaene/FAHRPLAN-FEDLEX-PORTFOLIO.md`](../archiv/fahrplaene/FAHRPLAN-FEDLEX-PORTFOLIO.md) ausgelagert — sie tragen keine offene
ROADMAP-Bindung mehr. Titel:

- 0. Portfolio-Überblick
- 0a. Endziel & Moat-These (warum dieses Fundament) — Opus-Bauplan
- 0b. Architektur-Grundsatz (Andockung an die neue DB; Datei↔DB-Koexistenz; Abstraktions-Schnittstelle) — Opus-Bauplan
- 0c. Gemeinsame Bausteine (wiederverwendbar über alle Pakete) — Opus-Bauplan
- 0d. Moat-Hebel (die 2–3 Verknüpfungen, die den Burggraben vertiefen) — Opus-Bauplan
- Paket 1 — Gesetze-Currency & Coverage (P0)
- Paket 2 — Botschaften / Bundesblatt (P1, Vorzeige-Paket) ✅ (erledigt 10.7.2026 — AUSGEFÜHRT, Wortlaut: `archiv/FAHRPLAN-FEDLEX-PORTFOLIO-erledigt.md`)
- Bridge B1 — Norm-Kontext-Bus verdrahten (Moat-Kern, nach Paket 2, vor Paket 5)
- Paket 5 — Änderungshistorie / Amtliche Sammlung (P1.5) ✅ (erledigt 10.7.2026 — AUSGEFÜHRT, Wortlaut: `archiv/FAHRPLAN-FEDLEX-PORTFOLIO-erledigt.md`)
- Paket 3 — Vernehmlassungen (P2) ✅ (erledigt 10.7.2026 — AUSGEFÜHRT, Wortlaut: `archiv/FAHRPLAN-FEDLEX-PORTFOLIO-erledigt.md`)
- Paket 4 — Staatsverträge (P3) ✅ (erledigt 10.7.2026 — AUSGEFÜHRT, Wortlaut: `archiv/FAHRPLAN-FEDLEX-PORTFOLIO-erledigt.md`)
- Paket 6 — Was Fedlex NICHT hergibt (ehrliche Abgrenzung)
- 5. Recht/Lizenz-Leitplanken (Do/Don't)
- 6. Offene Verifikationspunkte für Opus (empirisch VOR Bau prüfen)
- Priorisierte Gesamt-Reihenfolge
- 7. Reihenfolge & Meilensteine (mit abnahme-tauglichen Zwischenständen)
- Offene Entscheidungen für David
- Paket 7 — Watchlist & Änderungs-Signale (`W2·14-SIGNAL`, Ideen-Intake 20.7.2026)
- §15 · ROADMAP-Spec W2·6/FEDLEX-PORTFOLIO (wörtlich verschoben 31.7.2026)
