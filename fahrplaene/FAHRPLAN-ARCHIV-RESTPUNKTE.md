# Archiv-Restpunkte — offene Reste der 20 archivierten Fahrpläne (Archiv-Welle 31.7.2026)
<!-- @lagebild name: Archiv-Restpunkte · zweck: Übriggebliebene Einzelposten älterer Aufträge. -->

**Heimat:** ROADMAP «Strang-Detailpunkte & Hygiene» — dort steht je Strang ein Einzeiler,
hier der wörtliche Rest. Diese Datei steuert nicht; sie hält fest, was beim `git mv` der 20
Fahrpläne nach `archiv/` sonst verloren ginge.

Jeder `## §<n>` entspricht **genau einem** archivierten Strang (Reihenfolge wie in der
ROADMAP-Sektion) und lässt sich einzeln ziehen:
`npm run fahrplan -- fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md <n>` — das liefert Kopf + §0 + den
gewünschten §, statt der ganzen Datei.

*Je Datei prüfte ein Nur-Lese-Opus-Agent, ob ALLE offenen Punkte in `ROADMAP.md` stehen; alle
Verdikte lauteten NUR-MIT-NACHTRAG. Die folgenden Einzeiler sind dieser Nachtrag — sie steuern nicht,
sie halten den Rest fest, damit der `git mv` nach `archiv/` informationsverlustfrei ist.*

*Zwei Wellen: **AP-3** (11 verwaiste Fahrpläne, 45 Einzeiler — ab «Beurkundungs-Ausbau») und
**AP-4** (9 Fahrpläne erledigter/überholter Schritte, 36 Einzeiler — ab «Rechtssammlung»). In AP-4
prüften 12 Agenten; **drei Dateien bleiben begründet im Root**: `FAHRPLAN-PLAN-STEUERUNG.md` (einzige
Doku der `@meta`-DSL, keine Ersatz-Heimat), `FAHRPLAN-RECHTSPRECHUNG.md` (Detailquelle des noch
offenen `R-RICHTER`) und `FAHRPLAN-OPENCASELAW-QUELLEN.md` (geltende Grundlage von
`PLAN-OCL-ABBAU.md`).*

## §0 · Quer-Lektionen

- **Herkunft:** Methode *verify-then-archive* — je Datei prüfte ein Nur-Lese-Opus-Agent, ob
  ALLE offenen Punkte in `ROADMAP.md` stehen; alle 20 Verdikte lauteten NUR-MIT-NACHTRAG.
  Die §§ unten sind dieser Nachtrag, wörtlich aus `ROADMAP.md` hierher verschoben.
- **Regel beim Abarbeiten:** Ein erledigter Punkt wird **hier** abgehakt (nicht in der
  ROADMAP, die nur den Einzeiler trägt); erfordert er eine fachliche Abnahme (§7/§8), gehört
  der David-Abnahme-Vermerk mit Datum an denselben Punkt. Fällt ein ganzer § leer, bleibt
  die Überschrift stehen und bekommt den Vermerk «vollständig erledigt» — sonst rutschen die
  §-Nummern und die Einzeiler in der ROADMAP zeigen ins Falsche.
- **Datei-Historie** (welche Datei wann und warum ins Archiv ging): `archiv/README.md`.
  Die archivierten Fahrpläne selbst bleiben byte-genau historisch stehen — ihre Köpfe sind
  teilweise stale und werden dort **nicht** nachgeführt.

## §1 · Beurkundungs-Ausbau

*(→ `archiv/FAHRPLAN-BEURKUNDUNGS-AUSBAU.md`)*

- **BEURKUNDUNG Tarif-Lücken (72 Zellen):** in `src/data/tarif/beurkundung.ts` tragen 72 von 546
  (Geschäftsart × Kanton)-Kombinationen keinen Sondertarif → Engine `status: 'offen'`, UI «In
  Recherche» (§8-ehrlich, nie ein Schätzwert). Systematisch fehlen **baurecht/vorkaufsrecht/
  schuldbrief/verpfruendung/kapitalherabsetzung für LU·GL·ZG·SO·BS·BL·SH·AR·AI·AG**, dazu
  vorsorgeauftrag (6 Kt) · schuldanerkennung (6) · vollmacht (3) · schenkung (2) ·
  genossenschaft_gruendung (2) · stiftung/statutenaenderung (je 1) · vorkaufsrecht TI. Mitursache:
  der im Plan vorgesehene Default `GENERELLER_WERTTARIF` ist ein **leeres** Objekt (Z.31), der
  Fallback in `tarifFuer()` läuft nie. Je Zelle **erheben oder als tariflos begründen** (freies
  Notariat ZG/SO/BL: Honorar frei → «nach Vereinbarung» statt «in Recherche»). Heimat
  `archiv/FAHRPLAN-BEURKUNDUNGS-AUSBAU.md` §3 + `archiv/FAHRPLAN-LUECKEN-SCHLIESSEN.md`
  (L2-Nachfolge, dort bisher nur die 3 prozeduralen Arten inventarisiert). Risiko-Pfad ⇒ `QS-GP`.
  `[OF]`
- **Gründungs-Tarif doppelt gepflegt (§5):** neben der 26-Kt-Schicht `src/lib/beurkundung.ts`/
  `src/data/tarif/beurkundung.ts` versorgt die 6-Kt-Alt-Engine
  `src/lib/notariatsgebuehrenGruendung.ts` (Dossier
  `bibliothek/kosten/notariatstarife-gruendung-kantone.md`) weiterhin
  `src/pages/vorlage-ag-gruendung/schritte-dokumente.tsx` — die im Plan verlangte
  Dossier-Integration ist nur inhaltlich, nicht strukturell erfolgt. Zusammenführen **oder** die
  Regime-Trennung ausdrücklich begründen (§1 vor §6); Divergenz-Präzedenz: BS-Gründung Rahmen
  750–2000 vs. Punktwert (16.6.2026 behoben).
- **Stale Register-Einträge Gründungs-Dossier:** `bibliothek/INDEX.md` Z.283,
  `bibliothek/register/parameter-verfall.md` Z.36 und `bibliothek/register/engine-map.md` Z.95
  führen ZH-Nachtrag-123 · SG-Brutto/Netto-MwSt · Agio weiter als «offen», obwohl Agio am 7.6.2026
  auf «belegt» gehoben, die MwSt zentral in `src/lib/beurkundungZusatzkosten.ts` (MWSTG Art. 25 I,
  8,1 %, nur freies Notariat) gelöst und ZH Ziff. 4.4.3.1 in `beurkundung.ts` mit der
  Nachtrag-123-Fassung (Stand 1.1.2024) verlinkt ist — nachführen oder den Restzweifel benennen;
  ZH-123-PDF-Beleg ist von der Aufräumwelle **nicht** am Original nachgeprüft worden.
- **Klein-Backlog Beurkundung:** «Eintragung Eigentumsvorbehalt» (Plan-Tabelle «alles weitere») ist
  in keiner Taxonomie abgebildet — fachlich Register beim Betreibungsamt (Art. 715 ZGB, EigVV
  SR 211.413.1), nicht Notariat/Grundbuch: entweder eigener Kostenblock oder bewusst streichen und
  in `beurkundung-typen.ts` als Nicht-Gegenstand vermerken.

## §10 · Vertrags-Varianten

*(→ `archiv/FAHRPLAN-VERTRAGS-VARIANTEN.md`)*

- **VERTRAGS-VARIANTEN — Restbestand neuer Basistypen** *(Heimat
  `archiv/FAHRPLAN-VERTRAGS-VARIANTEN.md` §2/§5; Bau-Anker `W3-AUSBAU (Zeile Vorlagen-Breite, vormals W3·13, Konsolidierung 15.8.2026)`)*: **P3-Rest** Tausch (237) ·
  Gebrauchsleihe (305) · Miet-Untertypen Parkplatz/möbliert — **P4-Rest** Schuldanerkennung
  (82 SchKG) · Garantievertrag (111) — **P5** Mäkler (412 ff.) · Agentur (418a ff.) · Kommission
  (425) · Lizenz (innominat) · Kooperation/JV · Franchise — **P6** einfache Gesellschaft (530 ff.)
  als eigene Karte · Aufhebungsvereinbarung (Feld A, Saldoklausel-Module). Je eigenes OR-Regime →
  eigenes Schema/eigene Engine (§4), nie in eine bestehende Karte kollabieren; jede neue Karte
  trifft `startseiteConfig`/`vorlagenRegistry` → Worktree (§12).
- **VERTRAGS-VARIANTEN P2-Rest (Untertypen, nicht Detailgrad)**: der Detailgrad-Rollout ist auf allen
  sechs Vertrags-Karten durch, der **Untertyp**-Rollout nicht — offen: Auftrag
  (Beratung/Treuhand/Inkasso/Mandat) · NDA (Personal/M&A/IT) · Werkvertrag-Experte-Module
  (Zahlungsplan/Bauhandwerkerpfand-Hinweis/Pönale/Abnahmeprotokoll) · Konkubinat-Module. Detail
  `archiv/FAHRPLAN-VERTRAGS-VARIANTEN.md` §2/§5-P2.
- **VERTRAGS-VARIANTEN P1f — Zähl-Hygiene**: `src/lib/vorlagen/variantenInventar.ts` +
  `src/tests/variantenInventar.test.ts` sind der ehrliche Fortschrittszähler (Stand 168 erzeugbare
  Dokumente = 17 % des 1000-Ziels) — **bei jeder neuen Vertrags-Karte und jedem neuen Untertyp
  Inventar UND Test nachführen** (§8, kein stiller Schwund). «1000» ist die kombinatorische
  Dokumentenmenge (Typ × Untertyp × Detailgrad × Module), nie eine Kartenzahl.
- **Abnahme-Warteschlange, Ergänzung Rang 2 (Form-Gate-Vorlagen)**: Lehrvertrag
  (Schriftform-Gültigkeit Art. 344a I) · Handelsreisendenvertrag (347–350a) · Heimarbeitsvertrag
  (351–354) — gebaut 14.6.2026, Anker am Fedlex-Cache 20260101 verifiziert, golden additiv;
  **fachliche Abnahme David ausstehend** (Detail `archiv/FAHRPLAN-VERTRAGS-VARIANTEN.md` §7).
- **Stale Doku-Köpfe**: Teileintrag «VERTRAGS-VARIANTEN «1000»» ist mit der Archivierung 31.7.2026
  **gestrichen** — der Kopf bleibt im Archiv byte-genau stehen, die Zähl-Wahrheit trägt jetzt
  `variantenInventar` (Stand 168 = 17 %).
- **`W3-AUSBAU` @meta** (Zeile «Vorlagen-Breite», vormals `W3-AUSBAU (Zeile Vorlagen-Breite, vormals W3·13, Konsolidierung 15.8.2026)`, Etiketten-Konsolidierung
  15.8.2026): nach der Archivierung `fahrplan: archiv/FAHRPLAN-VERTRAGS-VARIANTEN.md` ergänzen
  (Feld fehlt heute) —
  `npm run fahrplan -- archiv/FAHRPLAN-VERTRAGS-VARIANTEN.md §2` löst den Pfad auf, der Slice bleibt
  damit erreichbar.

## §20 · UX-Punkteliste

*(→ `archiv/FAHRPLAN-UX-PUNKTELISTE.md`)*

**Zählung (31.7.2026, R2-22):** **2 Restpunkte** (A3-Abnahme · E-Optional), **dazu 1
Statusbefund** (der dritte Spiegelstrich stellt nur fest, dass `W2·9` auf genau diese zwei
verengt ist — er ist kein eigener Bau-Posten). Die ROADMAP-Zeile nennt darum «2 Restpunkte
+ 1 Statusbefund»; die frühere Angabe «3 Restpunkte» widersprach dem Verengungs-Satz zwei
Sektionen weiter oben.

- **UX-PUNKTELISTE A3 · Betreibungskosten-Kacheln, Anweisung und Umsetzung zeigen in verschiedene
  Richtungen** *(Anw. 18, David-Abnahme offen seit 26.6.2026)*: verlangt war «Kacheln einer Reihe
  gleich hoch» (`auto-rows-fr` + `h-full`), gebaut wurde in
  `src/components/forms/GebvKostenForm.tsx:97` `items-start` — also ausdrücklich **ungleiche**
  Höhen; der Commit `3ccfd9d7e` deklariert das selbst offen («Felder bereits zeilen-aligned an
  Desktop/Tablet verifiziert — zur Abnahme geflaggt»). Entweder David nimmt die abweichende Lösung
  ab oder `auto-rows-fr`/`h-full` nachziehen. Reine Darstellung (§3), kein Risiko-Pfad. Detail
  `archiv/FAHRPLAN-UX-PUNKTELISTE.md` A3. **Stand 24.9.2026 (W2·29-WERKBANK-RECHNER R2): gegenstandslos** — seit U2 (6.9.2026) tragen die Felder keinen Rahmen mehr, es gibt keine sichtbaren «Kacheln», deren Höhe abweichen könnte; gemessen @1280 `/rechner/betreibungskosten`: Feld-Oberkanten je Reihe gleich (0/0 · 193/193 · 305/305 px), `items-start` hält Label und Eingabe bündig. Rest-Befunde LM-066 (Bedienhöhen 36/50 px) → RECHNER R4, LM-032 (Normzeile) bleibt fachlich.
- **UX-PUNKTELISTE E-Optional · globaler Schalter «aufgehobene Normen ausblenden» nie gebaut**
  *(Batch E «Optional», verzahnt mit C2)*: das Ansicht-Menü des Lesers kennt nur
  `linien|fussnoten|verweise|leitfaelle` (`src/pages/gesetz-leser/leserOptionen.ts:65`,
  `LeserAnsichtV3.tsx`; `LeserAnsichtMenu.tsx` in H5 gelöscht, 21.8.2026); aufgehobene
  Artikel sind heute fix eine gedämpfte Einzeile mit
  AS-Aufhebungsnotiz (`ArtikelLeser.tsx:431/450`), ohne Ausblende-Option. Entweder als fünftes
  `OptFeld` nachziehen **oder** bewusst streichen mit der Begründung, dass eine ausgeblendete Norm
  dem Leser eine Lücke verschweigt (§8). Detail `archiv/FAHRPLAN-UX-PUNKTELISTE.md` Batch E,
  letzter Spiegelstrich. `[OF]`
- **UX-PUNKTELISTE · `W2·9` ist gegenstandslos geworden** *(Befund 31.7.2026)*: Der Schritt
  verlangt eine Mapping-Tabelle «alt-Punkt → Code-Pfad → Status», *bevor* die Restpunkte **C2/C5**
  angefasst werden — beide sind längst gebaut (C2 = `artikelGanzAufgehoben` + Aufhebungsnotiz,
  `ArtikelLeser.tsx:169/450`; C5 = Ingress/Erlassformel als M5,
  `scripts/normtext/kopf-extrahiere.ts` + `parts/ErlassKopfBlock.tsx`). Von den 20 Anweisungen
  sind 18 live, Batch D ist über IV-1/IV-2 gemappt, Batch F über
  `archiv/FAHRPLAN-KANTONALE-ENTSCHEIDE.md`. **Verbleibender Restbestand = genau die beiden Zeilen
  oben (A3-Abnahme, E-Optional).** `W2·9` darum abhaken oder auf diese zwei Punkte verengen; der
  Datei-Kopf «Status: reiner Plan. Noch nichts umgesetzt.» ist seit dem 26.6.2026 stale und bleibt
  im Archiv nur historisch stehen — die Status-Wahrheit trägt die Session-Karte
  `archiv/STRUKTUR-SESSIONKARTEN.md` («16/20 live + D-Teil + 2 Pläne»).

---


---

## Archivierte Abschnitte *(Plan-Neuschnitt 29.8.2026)*

18 Abschnitt(e) dieser Datei sind wörtlich nach
[`archiv/fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md`](../archiv/fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md) ausgelagert — sie tragen keine offene
ROADMAP-Bindung mehr. Titel:

- §2 · BGer-Rechtsweg
- §3 · Fall-Rückgrat
- §4 · Fundament-Umbau
- §5 · Grundlagen
- §6 · International-Volltext
- §7 · Kantonale Entscheide
- §8 · Lücken schliessen
- §9 · Notariat & Grundbuch
- §11 · GmbH-Gründung
- §12 · Rechtssammlung (Rubrik V «Gesetze»)
- §13 · Begründungs-Absatz
- §14 · BS-Vorbildkanton
- §15 · Code- & Bibliothek-Hygiene
- §16 · Gesetzesdarstellung Bund
- §17 · Gesetzestext-Popup (Norm-Vorschau)
- §18 · Startseite V3 + Branding I2
- §19 · Tarif-Tabellen Stufe 2
- §21 · ROADMAP-Spec-Nachzug `W2·9` / `W3-AUSBAU (Zeile Vorlagen-Breite, vormals W3·13, Konsolidierung 15.8.2026)` (wörtlich verschoben 4.8.2026, ROADMAP-Diät Welle 3)
