# Watchlist & Änderungs-Signale — Architektur-Optionen (B1 / B2 / Push)

**Erstellt:** 20.7.2026 (Ideen-Intake §14 der 8 Alleinstellungs-Ideen, Idee 5 — Verortung als
ROADMAP-Schritt `W2·14-SIGNAL`; dieses Dossier trennt die zwei zustandslos baubaren Stufen von
der Variante, die einen Architektur-Entscheid Davids verlangt) · **Status:** ERSTRECHERCHE —
Optionen-Vergleich gegen den Repo-Stand vom 20.7.2026, kein adversarialer Zweitdurchgang.

**Quellen:**

| Beleg | Fundort | Rolle |
|---|---|---|
| Currency-Prüfdatum je Erlass | `public/normtext/currency.json` (`geprueftAm`, opt. `naechsteFassungAb`) | **nur** Vorwärts-Signal — s. §3-Warnung |
| Fassungsstand je Artikel | `public/normtext/**/<ERLASS>.json` → `stand` · `fassungsToken` · `sha` | **das** Rückblick-Signal (§7 Build-Regel 4) |
| Entscheid-Register | `public/rechtsprechung/register.json` (6341 Einträge; `gericht`/`datum`/`normKeys`/`fassungsToken`) | Datenquelle Gerichts-Signal |
| Entscheid-Import-Strecke | `scripts/rechtsprechung/`, `scripts/normtext-entscheide.ts` | bestimmt die Signal-Latenz |
| Wiedervorlage-Generator (Bau-Muster) | `scripts/fedlex-wiedervorlage-generieren.ts` | Vorbild B1 |
| Currency-/Drift-Tore | `check:fedlex-versionen`, `check:rss-oc` (gestrichen 5.10.2026, MONITOR-Rückbau) | Erkennung |
| Verfallsregister | `bibliothek/register/parameter-verfall.md` | datierte Parameter |
| Client-Persistenz-Muster | `src/lib/zuletztVerwendet.ts` | Vorbild B2 |
| Zustandslosigkeits-Regel | CLAUDE.md §5 | **die Leitplanke** |

---

## §1 · Die Frage

«Benachrichtige mich, wenn sich Norm Y ändert oder Gericht X neu entscheidet.» Das klingt nach
**einem** Feature, ist aber **drei** — mit sehr unterschiedlichen architektonischen Kosten.

## §2 · Die drei Optionen im Vergleich

| | **B1 — statischer Feed** | **B2 — Client-Watchlist** | **Push/E-Mail-Abo** |
|---|---|---|---|
| **Was der Nutzer bekommt** | abonnierbarer RSS/Atom/JSON-Feed «was hat sich geändert» | gemerkte Normen/Gerichte, beim Besuch «seit deinem letzten Besuch geändert» | aktive Zustellung ohne Besuch |
| **Wo lebt der Zustand** | nirgends (Build-Artefakt) | ausschliesslich im Browser (localStorage) | **Server** |
| **Braucht Nutzeridentität** | nein | nein | **ja** |
| **Braucht Sendedienst** | nein (der Feed-Leser holt) | nein | **ja** |
| **Zustandslos (§5)** | ✅ | ✅ | ❌ **Bruch** |
| **Aus Bestand baubar** | 🟢 ja — Muster `fedlex-wiedervorlage-generieren.ts` | 🟢 ja — Muster `zuletztVerwendet.ts` | 🟠 nein |
| **Verdikt** | **bauen** | **bauen** | **nur nach Architektur-Entscheid Davids** |

## §3 · Regel deterministisch

> **⚠ Feld-Warnung (empirisch nachgelesen 20.7.2026, korrigiert den Erst-Entwurf):**
> `currency.json` führt je Erlass **nur** `{geprueftAm, naechsteFassungAb?}` — ein `stand`-Feld
> gibt es dort **nicht**. `geprueftAm` ist das Datum **unseres Currency-Laufs**, kein
> Norm-Änderungsdatum: es wandert bei jedem Re-Check auch dann, wenn sich nichts geändert hat
> (→ Falschmeldungen), und markiert eine echte Änderung nicht als solche. Der Rückblick-Vergleich
> läuft darum gegen `stand`/`fassungsToken`/`sha` aus den **Normtext-Snapshots**
> (`public/normtext/**/<ERLASS>.json`, §7 Build-Regel 4 — verifiziert an `bund/ADOV` Art. 1:
> `stand: 2023-01-23`, `fassungsToken: 20230123`). Aus `currency.json` trägt allein
> `naechsteFassungAb` — und zwar nur den **Vorwärts**-Fall («ab wann kommt eine neue Fassung»).

**B1 — Feed (Build-Zeit):**
```
Eingang:  Normtext-Snapshots (fassungsToken/sha je Artikel) + currency.json (naechsteFassungAb)
          + parameter-verfall.md (datierte Parameter)
Regel:    je Erlass E: wenn fassungsToken(E, heute) != fassungsToken(E, letzter Build) → Eintrag
          Eintrag = { Erlass, alter Stand, neuer Stand, amtliche Fundstelle, Datum }
Ausgang:  Feed-Datei, stabil sortiert (Determinismus §2 → zwei Läufe byte-gleich)
```

**B2 — Watchlist (Client):**
```
Eingang:  localStorage: [{ id, gesehenerToken, gemerktAm }]   — NUR Kennungen
Regel:    beim Besuch je Eintrag: fassungsToken(id) != gesehenerToken → Flag
          (NICHT geprueftAm — das wandert ohne Änderung, s. Feld-Warnung)
Ausgang:  «geändert seit deinem letzten Besuch» + Sprung zur amtlichen Fundstelle
```

**B3 — Gerichts-Signal (Build-Zeit; eigenes Verdikt 🟡, NICHT unter dem Fedlex-🟢 mitgeführt):**

Der Erst-Entwurf führte «Gericht X entscheidet neu» unter denselben Belegen wie die Norm-Seite.
Das war falsch: `check:fedlex-versionen`, `check:rss-oc` (gestrichen 5.10.2026, MONITOR-Rückbau), `fedlex-wiedervorlage-generieren.ts` und
`currency.json` sind **ausnahmslos Norm-seitig** — auch `check:rss-oc` prüft den
Amtliche-Sammlung-RSS, nicht Gerichte. Der tragende Bestand ist ein anderer:

```
Eingang:  public/rechtsprechung/register.json (6341 Einträge; gericht, gerichtstyp, kanton,
          datum, normKeys, fassungsToken)
Regel:    je Watchlist-Eintrag (Gericht G bzw. Norm N): Einträge mit datum > gesehenesDatum
          und gericht == G bzw. normKeys enthält N → Liste, stabil sortiert
Ausgang:  «neue Entscheide seit deinem letzten Besuch» + Sprung in den Entscheid-Leser
```

**Ehrliche Einschränkung (§8, muss in die UI):** es gibt **keinen Live-Gerichts-Feed**. Das Signal
feuert erst, wenn WIR neu importieren (`scripts/rechtsprechung/`, `scripts/normtext-entscheide.ts`).
Die Latenz ist die **Import-Kadenz**, nicht die Publikationsgeschwindigkeit des Gerichts. Ohne einen
sichtbaren Bestands-Stand («Entscheid-Bestand Stand: …») suggeriert die Funktion eine Aktualität,
die der Korpus nicht trägt — dann ist sie nicht zu bauen.

## §4 · Harte Auflagen (Berufsgeheimnis, §8)

1. **In localStorage gehören ausschliesslich Kennungen** (Erlass-/Gerichts-IDs, Stände).
   **Keine** Mandatsbezüge, keine Parteinamen, keine Aktenzeichen, keine Freitextnotizen —
   der Browser eines Anwalts ist kein sicherer Ort für Mandatsdaten.
2. **Kein Anschein von Fristenüberwachung.** Ein Änderungs-Signal ist **keine** Zusicherung,
   dass der Nutzer rechtzeitig erfährt, was er wissen muss. Das gehört ausdrücklich an die
   Fläche (§8) — sonst entsteht ein Verlass, den das Werkzeug nicht tragen kann.
3. **Signal zeigt auf die amtliche Fundstelle**, nie nur auf die eigene Darstellung (§7).
4. **Lücken sichtbar:** überwacht wird nur, was im Korpus ist. Die Abdeckung wird benannt.

## §5 · Warum Push ein Architektur-Bruch ist (und nicht nur «mehr Arbeit»)

Push verlangt drei Dinge, die es heute bewusst **nicht** gibt: eine **Nutzeridentität**, einen
**serverseitig gehaltenen Abonnement-Zustand** und einen **Sendedienst**. Damit fallen zugleich
Datenschutz-Pflichten, Zustellbarkeit, Abmeldung und Betriebslast an. Das ist keine Erweiterung
der bestehenden Architektur, sondern ihr **Gegenteil** (CLAUDE.md §5 «Werkzeuge zustandslos»).

**Empfehlung:** B1 + B2 bauen und in der Praxis messen, ob sie den Bedarf tatsächlich decken.
Sehr oft tut ein Feed genau das, was der Wunsch «benachrichtige mich» meinte — ohne einen
einzigen der obigen Folgekosten. Push erst danach neu bewerten, wenn überhaupt.

## §6 · Pflegebedarf

B1/B2 führen **keine neuen datierten Rechts-Parameter** ein; sie lesen die bestehende
Currency-Kette. Pflegepunkt ist allein, dass `currency.json` aktuell bleibt — das leisten die
vorhandenen Tore (`check:fedlex-versionen`; `check:rss-oc` ist seit 5.10.2026 gestrichen, MONITOR-Rückbau), hier entsteht keine zweite Wahrheit (§5).

## §7 · Abnahme-Status

ERSTRECHERCHE. B1/B2 sind ohne weitere Freigabe baubar (zustandslos-konform).
**Push bleibt gesperrt** bis zu einem ausdrücklichen Architektur-Entscheid Davids.
