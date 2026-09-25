# ZPO: Fristende auf Sa/So/Feiertag unmittelbar vor dem Stillstand (A16 für ZPO, W-07)

**Erstellt:** 25.9.2026, Posten «A16 für ZPO — Recherche vor Ausdehnung (W-07)»
(Dach `W2·30-RL-W2A`). Recherche-Agent Sonnet, read-only.
**Status:** ERSTRECHERCHE · Abnahme **offen** (Ausdehnung wartet auf David, W-07).

## Frage

Der BGG-Rechner warnt seit RL-15 (Befund A16, Entscheid David 23.9.2026), wenn
der rohe Fristablauf auf Sa/So/Feiertag fällt und der nächste Werktag im
Stillstand liegt (Art. 45 Abs. 1 / Art. 46 Abs. 1 BGG): Die Engine verschiebt
das Ende über den Stillstand hinaus, amtlich belegt ist das nicht; sicher ist der
Werktag vor dem Stillstand (`src/lib/bggVwvgFristen.ts`, `bggStillstandsnaeheWarnung`).
Gilt dieselbe Kollision im ZPO-Recht, und ist sie amtlich geklärt?

## Normlage (amtlich)

ZPO SR 272, Fedlex-Filestore-HTML Konsolidierungen **20250101** und **20260701**
(Art. 142/145/146 wortidentisch, geprüft 25.9.2026):

- Art. 142 Abs. 3 ZPO: «Fällt der letzte Tag einer Frist auf einen Samstag, einen
  Sonntag oder einen am Gerichtsort vom Bundesrecht oder vom kantonalen Recht
  anerkannten Feiertag, so endet sie am nächsten Werktag.»
- Art. 145 Abs. 1 ZPO: Stillstand Ostern ±7 Tage, 15.7.–15.8., 18.12.–2.1.;
  Abs. 2: nicht im Schlichtungs- und summarischen Verfahren; Abs. 4 (seit
  1.1.2025, AS 2023 491): gilt für alle SchKG-Klagen vor Gericht, nicht für die
  Beschwerde an die Aufsichtsbehörde. Keine Neufassung per 1.7.2026.
- Art. 146 Abs. 1 ZPO regelt nur den Fristbeginn bei Zustellung im Stillstand.

Die Struktur entspricht Art. 45 Abs. 1 / Art. 46 Abs. 1 BGG.

## Rechtsprechung (entscheidsuche.ch-Volltext, bger.ch teils 503)

Kein amtlicher Entscheid klärt die Kollision «verschobener Werktag liegt im
Stillstand». Geprüfte Treffer wenden Art. 142 Abs. 3 und Art. 145 auf
verschiedene Fristabschnitte an oder betreffen Fälle ohne Stillstand:
KGer SZ BEK 2026 1 (23.2.2026) E. 4 (summarisch, kein Stillstand) · KGer GR
ZK2 2014 6 (18.6.2014) · KGer FR 102 2016 38 (22.8.2016) · BGer 5A_691/2023 =
BGE 150 III 367 (Fristbeginn Monatsfristen) · BGer 4A_635/2023, 9C_97/2025.

Nebenfund: uneinheitliche kantonale Praxis zur Reichweite von Art. 145 Abs. 4
ZPO bei SchKG-Summarverfahren (OG ZH PS250115 E. 1.2, OG GR SBK 25 30 E. 1.2
gegen OG AG ZSU.2025.201 E. 1.2; BGer noch nicht entschieden, zitiert in KGer SZ
BEK 2026 1 E. 4).

## Materialien

Botschaft BBl 2020 2697 in dieser Recherche nicht amtlich abgerufen (ELI nicht
gefunden) — Pflegebedarf.

## Ergebnis (deterministische Regel)

- Keine amtliche Klärung; die ZPO-Normstruktur ist mit dem BGG wortgleich.
- **Empfehlung:** ZPO-Warnung wie RL-15 bauen (nur Warnung, Engine unverändert;
  sicheres Datum = Werktag vor dem Stillstand). Sicherheitsgrad **mittel**.
- **Geltung:** nur Tagesfristen im Stillstands-Regime; nicht Schlichtungs- und
  summarisches Verfahren (Art. 145 Abs. 2 ZPO).
- **Pflege:** BGer-Praxis zur Kollision beobachten; BBl 2020 2697 nachlesen;
  `quellen-register.md` ZPO-Pin 20250101 → 20260701 (Art. 142/145 unverändert).
- **Abnahme:** offen — W-07 hat nur «BGG jetzt, ZPO nach Belegprüfung»
  entschieden; die Belegprüfung fand keinen Beleg, die Ausdehnung liegt bei David
  (Posten `[D]` unter `W2·30-RL-W2A`).
