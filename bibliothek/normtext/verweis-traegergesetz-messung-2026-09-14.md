# Trägergesetz-Kontext «des Gesetzes» und Kurztitel ohne Fedlex-Ziel — Messung und Bau 14.9.2026

**Erstellt:** 14.9.2026 — Anlass: `W2·20-VERWEIS-SCHAERFE`, offener Posten **V-7-Bund-Rest**
aus `verweis-positivliste-messung-2026-09-01.md` («des Gesetzes» 169 Stellen, Kurztitel ohne
FEDLEX-Ziel — Gaststaatgesetz 28 u. a.).
**Status:** BAU-MESSUNG — technisch belegt (V-1-Tor-Artefakt vorher/nachher, Rot-Beweise,
Stichprobe gegen die amtliche Fedlex-Fassung); fachliche Abnahme der kuratierten Tabellen
durch David offen.

**Quelle/Stand:**
- V-1-Tor `check:verweis-inventar` auf main `7b0338916` (vorher) und auf
  `feat/w2-20-v7-bund-rest` (nachher), 1 567 Snapshot-Erlasse, 36 187 Verweis-Stellen.
- Belege der Trägergesetz-Tabelle: **Ingress** (`kopf.praeambel[rolle='ingress']`) der
  Struktur-Sidecars `public/normtext/struktur/bund/<KEY>.json`, aus der amtlichen
  Fedlex-Fassung übernommen; Register führt `quelleUrl`/`stand`.
- Belege der Kurztitel: **Titel-Klammer** des Bund-Register-Titels
  (`public/normtext/register.json`).
- §7-Gegenprobe: `fedlex.data.admin.ch` SPARQL (in-Kraft-Fenster enthält 2026-09-14) →
  `isExemplifiedBy` → AKN-XML, 21 Prüfungen, 21 Treffer (Protokoll unten).

## Regel (deterministisch)

### V-7c — «Artikel N des Gesetzes» ⇒ Trägergesetz

Der Verweis ist nicht unbestimmt: eine Vollzugsverordnung **legaldefiniert** die Kurzform im
Ingress, in der Klammer hinter dem zitierten Erlass. Die Tabelle
`src/lib/fedlex/traegergesetz.ts` (`TRAEGER_EINTRAEGE`) ist kuratiert; der Wächter
`src/tests/fedlex-traegergesetz.test.ts` prüft je Eintrag drei Dinge am Sidecar-Ingress:
(1) der hinterlegte Beleg steht **wörtlich** darin, (2) es gibt **genau eine** Klammer, die
`Gesetz` definiert, (3) das unmittelbar davor zitierte Erlassdatum ist das `ERLASSDATUM` des
hinterlegten Ziels. Dazu eine **Bestandsprüfung**: jede so verlinkte Korpus-Stelle zeigt auf
einen Artikel, den der Ziel-Snapshot führt.

| Verordnung | SR | Ingress-Legaldefinition (wörtlich) | Ziel | SR | Stellen |
|---|---|---|---|---|---|
| ARGV1 | 822.111 | «gestützt auf Artikel 40 des Arbeitsgesetzes vom 13. März 1964 **(Gesetz, ArG)**» | ArG | 822.11 | 36 |
| ARGV2 | 822.112 | «gestützt auf Artikel 27 des Arbeitsgesetzes vom 13. März 1964 **(Gesetz)**,» | ArG | 822.11 | 11 |
| UVV | 832.202 | «auf das Bundesgesetz vom 20. März 1981 über die Unfallversicherung **(Gesetz/UVG)**» | UVG | 832.20 | 61 |
| MVV | 833.11 | «des Bundesgesetzes vom 19. Juni 1992 über die Militärversicherung **(Gesetz)**,» | MVG | 833.1 | 39 |
| LSV | 814.41 | «des Umweltschutzgesetzes vom 7. Oktober 1983 **(Gesetz)**,» | USG | 814.01 | 11 |
| LRV | 814.318.142.1 | «des Bundesgesetzes vom 7. Oktober 1983 über den Umweltschutz **(Gesetz)**,» | USG | 814.01 | 3 |
| VKL | 832.104 | «gestützt auf Artikel 96 des Bundesgesetzes vom 18. März 1994 über die Krankenversicherung **(Gesetz)**,» | KVG | 832.10 | 8 |

Summe **169 Glieder** (167 Form-B-Treffer im Singular-Pfad + 12 Glieder aus Plural-Regionen;
die Klassen-Zeile `n2b-traeger` zählt 167 Stellen, die 12 Plural-Glieder laufen unter
`plural-glied-fremd`). Das ist exakt die im Fahrplan als offen geführte Zahl «169».

### V-7a-Nachzug — Kurztitel, deren Ziel im Korpus liegt

15 neue `GENITIV_EINTRAEGE`, je belegt durch den Kurztitel **wörtlich in der Titel-Klammer**
des Bund-Register-Titels («Verordnung über die Arzneimittel (Arzneimittelverordnung, VAM)»).
Geltung durchgehend `bund` — es sind Verordnungs-Kurztitel, die ein Kanton gleich benennen
kann; alle gemessenen Stellen liegen ohnehin in Bundeserlassen, die Einschränkung kostet
nichts (§1).

| Name | Ziel | Register-Titel-Beleg | Stellen |
|---|---|---|---|
| Arzneimittelverordnung | VAM | «… (Arzneimittelverordnung, VAM)» | 3 |
| Datenschutzverordnung | DSV | «… (Datenschutzverordnung, DSV)» | 2 |
| Raumplanungsverordnung | RPV | «Raumplanungsverordnung (RPV)» | 2 |
| Bundespersonalverordnung | BPV | «Bundespersonalverordnung (BPV)» | 2 |
| Chemikalienverordnung | ChemV | «… (Chemikalienverordnung, ChemV)» | 2 |
| Lärmschutz-Verordnung | LSV | «Lärmschutz-Verordnung (LSV)» | 2 |
| Erwerbsersatzverordnung | EOV | «Erwerbsersatzverordnung (EOV)» | 2 |
| Handelsregisterverordnung | HRegV | «Handelsregisterverordnung» | 1 |
| Abfallverordnung | VVEA | «… (Abfallverordnung, VVEA)» | 1 |
| Bankenverordnung | BankV | «… (Bankenverordnung, BankV)» | 1 |
| Medizinprodukteverordnung | MepV | «Medizinprodukteverordnung (MepV)» | 1 |
| Finanzmarktinfrastrukturverordnung | FinfraV | «… (Finanzmarktinfrastrukturverordnung, FinfraV)» | 1 |
| Verkehrszulassungsverordnung | VZV | «… (Verkehrszulassungsverordnung, VZV)» | 1 |
| Freizügigkeitsverordnung | FZV | «… (Freizügigkeitsverordnung, FZV)» | 1 |
| Adoptionsverordnung | AdoV | «… (Adoptionsverordnung, AdoV)» | 1 |

Sechs fehlende `ERLASSDATUM`-Werte (EOV, RPV, BPV, LSV, HRegV, MepV) wurden aus dem
Struktur-Sidecar nachgetragen — Projektion, keine zweite Wahrheit; der bestehende Wächter
vergleicht jeden Wert gegen `kopf.erlassdatum`.

## Kernbefunde

1. **«des Gesetzes» war überwiegend gar kein Text, sondern ein FALSCHER Self-Link.** Von den
   169 Gliedern lagen vor dem Bau nur 52 im `art-desder-guard` (Text). 97 waren
   `art-self` — ein Sprung auf den gleichnamigen Artikel der VERORDNUNG statt des Gesetzes
   (UVV Art. 88 «Artikel 68 des Gesetzes» sprang auf UVV Art. 68) —, 42 waren
   `art-kein-token` (Self-Ziel existiert nicht). Ursache ist dieselbe wie bei den 198
   Falschlinks vom 1.9.2026: der des/der-Guard prüft den ROHEN Rest, ein Passus («Absatz 2»)
   verdeckt das «des».
2. **Die Legaldefinition ist die einzige tragfähige Quelle.** Eine Heuristik «Verordnung ⇒
   Gesetz mit ähnlichem Namen» hätte drei gemessene Gegenbeispiele falsch verlinkt:
   `bund/BANKG art_16` und `bund/GSCHG art_83` sagen «des Gesetzes» in einem **Gesetz**
   (kein Trägergesetz), und `bund/LUGUE annex_I` meint mit «des Gesetzes zur Lösung von
   Gesetzeskollisionen …» ein **ausländisches** Gesetz. Alle drei bleiben Text.
3. **Restklasse (b) ist grösser als gedacht und zum grossen Teil nicht baubar.** Gemessen
   14.9.2026 über alle Bund-Snapshots: 315 unaufgelöste Kurztitel-Genitiv-Stellen, davon 141
   generische Köpfe («des Bundesgesetzes …» 50, «der Verordnung …» 91 — unaufgelöste
   Volltitel und EU-Verordnungen) und **174 echte Kurztitel** über 101 Namen. Nur 28 davon
   haben ein Ziel im Korpus (⇒ gebaut). Die grössten Kandidaten OHNE Korpus-Erlass:
   Revisionsaufsichtsgesetz 8 · Subventionsgesetz 6 · Zollgesetz 6 · DNA-Profil-Gesetz 6 ·
   Strafregistergesetz 5 · Postgesetz 4 · Gaststaatgesetz 4 · Medizinalberufegesetz 4 ·
   Personenbeförderungs-, Nachrichtendienst-, Jagd-, Krankenversicherungsaufsichtsgesetz je 3.
   **Blockiert, nicht vergessen:** der bestehende Wächter verlangt für jedes Positivlisten-Ziel
   ein `ERLASSDATUM` aus dem Struktur-Sidecar (Zeit-Kante — ohne Erlassdatum verlinkt ein
   datiertes Zitat ohnehin nie). Ohne Snapshot des Ziels gibt es kein Sidecar. Der Wurzel-Fix
   ist darum ein Korpus-Schritt (Snapshot der genannten Erlasse), nicht eine Lockerung des
   Wächters — als Roadmap-Posten unter `@queue` vermerkt (§17).
4. **Gaststaatgesetz: 4 statt 28.** Die Zahl 28 stammt aus der Kopf-Gruppen-Zählung vom
   1.9.2026 auf main `70002a287`, VOR dem V-7-Bau; seither fangen Klammer-Zweig, Volltitel-
   Zweig und die Kürzel-Schreibweisen den grössten Teil ab. Zahlen nicht fortschreiben — der
   Ist-Stand steht im V-1-Tor.

## Bilanz (V-1-Artefakt `messwerte/verweis-inventar.json`)

| | main 7b0338916 | nach V-7c/V-7a-Nachzug | Δ |
|---|---|---|---|
| Stellen | 36 173 | 36 187 | +14 (Form-B-Glieder) |
| SELF | 19 750 | 19 653 | **−97 (falsche Self-Links)** |
| FREMD | 11 390 | 11 616 | +226 |
| TEXT | 5 033 | 4 918 | −115 |
| `n2b-traeger` | – | 167 | NEU |
| `n2b-genitiv` | 672 | 695 | +23 |
| `n2b-glied` | 342 | 344 | +2 |
| `anker-erlass` | 1 095 | 1 108 | +13 (Z1 über die neuen Kurztitel) |
| `plural-glied-fremd` | 1 484 | 1 505 | +21 |
| `plural-region-unterdrueckt` | 533 | 512 | −21 |
| `art-desder-guard` | 921 | 869 | −52 |
| `art-kein-token` | 959 | 917 | −42 |
| `art-self` | 12 963 | 12 866 | −97 |
| tote Selbstziele | 3 | 3 | 0 (kein neuer toter Anker) |

Verlinkungsquote (SELF+FREMD)/Stellen: 86.1 % → 86.4 %.

## §7-Stichprobe gegen die amtliche Fassung (14.9.2026, 21/21)

Weg nach Skill `scraping-swiss-official-sources`: SPARQL `dateApplicability`-Fenster enthält
2026-09-14 → `isExemplifiedBy` → AKN-XML (Content-Type-Prüfung gegen den Casemates-Soft-404).

- **(a) 7 Verordnungen:** je genau EINE «Gesetz»-Klammer im amtlichen Ingress — ARGV1
  «(Gesetz, ArG)», ARGV2 «(Gesetz)», UVV «(Gesetz/UVG)», MVV «(Gesetz)», LSV «(Gesetz)»,
  LRV «(Gesetz)», VKL «(Gesetz)» — und der jeweils geprüfte Ziel-Artikel existiert in der
  in Kraft stehenden Fassung des Trägergesetzes: ArG `art_15`/`art_36` (Stand 1.9.2023),
  UVG `art_68` (1.1.2026), MVG `art_43` (1.1.2024), USG `art_22`/`art_44_a` (1.8.2026),
  KVG `art_39` (1.7.2026).
- **(b) 14 Kurztitel-Ziele:** DSV `art_26` · VVEA `art_4` · BankV `art_42` · LSV `art_37_a` ·
  VAM `art_8` · FZV `art_10` · AdoV `art_4` · RPV `art_28` · BPV `art_98` · ChemV `art_77` ·
  FinfraV `art_58_k` · VZV `art_27` · HRegV `art_2` · EOV `art_27` — alle in der heute
  geltenden Konsolidierung vorhanden, kein Ziel aufgehoben.

Zusätzlich korpusweit (Test, nicht Stichprobe): **alle 169** Trägergesetz-Glieder und **alle
28** Glieder der neuen Kurztitel zeigen auf einen Artikel, den der Ziel-Snapshot führt.

## Geltung/Ausnahmen

- Momentaufnahme 14.9.2026; Zahlen NICHT fortschreiben — den Ist-Stand trägt das V-1-Tor.
- Nur **Bund**. Kantonale «des Gesetzes»-Stellen (80 gesamt − 35 Bund-Köpfe = kantonaler
  Rest) und die kantonale Namensliste («§ N des Personalgesetzes», 916) bleiben Phase 2.
- Nicht gebaut, bewusst: EU-Verordnungen («der Verordnung (EU) …»), unaufgelöste Volltitel
  («des Bundesgesetzes über …» ohne Positivlisten-Fragment), historische Titel, und die
  Kurztitel ohne Korpus-Erlass (Befund 3).
- Bekannter konservativer Verlust unverändert nach §1a des Fahrplans.

## Pflegebedarf

- Neuer Trägergesetz-Eintrag ⇒ Ingress-Beleg wörtlich hinterlegen; der Wächter verlangt
  genau eine «Gesetz»-Klammer und Datums-Gleichheit mit `ERLASSDATUM`.
- Kommt ein heute fehlender Ziel-Erlass als Snapshot in den Korpus, wird sein Kurztitel in
  `GENITIV_EINTRAEGE` nachziehbar (Befund 3) — dann V-1-Tor regenerieren.
- Ändert Fedlex den Ingress einer der 7 Verordnungen (Revision der Rechtsgrundlage), reisst
  der Wächter beim nächsten Snapshot-Nachzug — das ist gewollt.

## Abnahme-Status

Technisch belegt (Tor-Artefakt vorher/nachher, zwei Rot-Beweise am Wächter, Bestandsprüfung
169+28, Stichprobe 21/21 gegen Fedlex live). **Fachliche Abnahme durch David offen:** die
7 Trägergesetz-Zuordnungen und die 15 Kurztitel-Einträge stehen als prüfbare Liste im PR.
