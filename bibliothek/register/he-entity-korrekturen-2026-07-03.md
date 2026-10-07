# `he`-Entity-Umstellung — Divergenz-Analyse & Korrektur-Register (3.7.2026)

**Anlass:** Werkzeug-Audit Nulltarif-Paket (`archiv/BACKLOG-AUDIT-WERKZEUGE-2026-07.md`
§Audit 1 ADOPT): `scripts/normtext/html-entities.ts` ersetzt die handgepflegte
~75-Einträge-Tabelle `NAMED_ENTITIES` durch `he.decode` (WHATWG-vollständig,
2231 benannte Entities; he 1.2.0, devDependency — läuft nur build-time in den
Generatoren, nie im Client-Bundle). Der Einmal-Scan (`ENTITY_RE`, kein
Doppel-Dekodieren von `&amp;lt;`) bleibt EXAKT erhalten: `he.decode` wird nur
auf das einzelne gematchte Token angewandt, nie auf den Gesamtstring.

## Vollständige Divergenz-Tabelle Alt-Tabelle ↔ `he.decode`

Programmatisch erhoben (alle 75 Alt-Einträge aus `git show HEAD` geparst und
gegen `he.decode` verglichen — nicht von Hand abgetippt):

| Entity | Alt (Hand-Tabelle) | `he`/WHATWG | Entscheid |
|---|---|---|---|
| `&nbsp;` | U+0020 (normales Leerzeichen) | U+00A0 | **Alt-Verhalten BEHALTEN** (dokumentierter Sonderfall: Normtext-Anzeige erwartet normale Leerzeichen) |
| `&mu;` | U+00B5 µ MICRO SIGN | U+03BC μ GREEK SMALL MU | **Alt-Verhalten BEHALTEN** (korpus-begründet: `&mu;` steht im Korpus nur als Einheiten-Präfix, BS-781.500 «µg/m²» Feinstaub-Grenzwert; committete Snapshots/sha bleiben stabil) |
| `&ldquo;` | U+0022 `"` (ASCII) | U+201C `“` | **KORRIGIERT auf `he`** (deklarierte fachliche Korrektur, s.u.) |
| `&rdquo;` | U+0022 `"` (ASCII) | U+201D `”` | **KORRIGIERT auf `he`** (deklarierte fachliche Korrektur, s.u.) |

Alle übrigen 71 Einträge: byte-identisch zu `he.decode`.

## Korrektur `&ldquo;`/`&rdquo;` (einzige Verhaltensänderung)

- **Befund:** Die Alt-Tabelle flachte beide typografischen Anführungszeichen
  undokumentiert auf ASCII-`"` ab (mutmasslich Editor-Smart-Quote-Unfall beim
  Anlegen der Tabelle — der Nachbar-Eintrag `&bdquo;` → `„` U+201E ist korrekt).
  WHATWG (https://html.spec.whatwg.org/multipage/named-characters.html) und
  jeder Browser der amtlichen Quelle dekodieren `&ldquo;` → U+201C und
  `&rdquo;` → U+201D. Die Abflachung war Treue-Verlust gegenüber der Quelle (§7).
- **Korpus-Impact heute: NULL.** Doppelt belegt:
  1. `grep -rE "&(ldquo|rdquo);" /tmp/*.html` über ALLE gepinnten
     Fedlex-Caches (218 Erlasse, geladen via `scripts/fedlex-cache.sh`,
     Konsolidierungs-Pins gem. Datei): **kein Treffer**.
  2. `grep -rlE "&(ldquo|rdquo);" public/` über den gesamten committeten
     Korpus: **kein Treffer**.
- **Sandbox-Doppellauf (Beweis Refactor golden-neutral):** Bund-Regen
  `--nur=bund --datum=2026-06-30` aus den gepinnten Caches, VOR und NACH der
  he-Umstellung: beide Läufe reproduzieren die committeten 218
  `public/normtext/bund/*.json` + `golden/normtext-snapshot.json`
  **byte-identisch** (git status leer). → Fall (a) der Umbau-Spec: reiner
  Refactor, **kein** `public/**`/golden-Commit nötig.
- **Einzige sichtbare Änderung:** die Test-Erwartung in
  `src/tests/normtext-entities.test.ts` (synthetische Eingabe
  `&bdquo;Hallo&rdquo;`) — deklarierte fachliche Korrektur nach §6.3, im
  Commit ausgewiesen. U+201C/U+201D sind bereits heute im Korpus darstellbar
  (kommen via numerischer Entities vor: CHEMRRV/MEPV/NHV-Snapshots).
- **Zukunftswirkung (gewollt, Kern des ADOPT):** Bei künftigen Regens dekodiert
  der Generator jetzt alle 2231 WHATWG-Entities — die Klasse «unbekannte Entity
  verfälscht Inhalt» (`&ge;`/`&le;` trugen real Tarif-Schwellen, BS-772.110/
  BS-772.430) ist strukturell geschlossen statt per Nachpflege-Tabelle gejagt.

## Prüfweg / Reproduktion

```
bash scripts/fedlex-cache.sh                                        # Pins laden
npx vite-node scripts/normtext-snapshot.ts -- --datum=2026-06-30 --nur=bund
git status --short public/ golden/                                  # muss leer sein
```

Divergenz-Tabelle reproduzieren: die 75 `'&…;': '…'`-Einträge der Alt-Tabelle
aus `git show <alt>:scripts/normtext/html-entities.ts` per Regex parsen und
jeden Wert gegen `he.decode(entity)` vergleichen (Wegwerf-Skript, ~15 Zeilen).

Gegenprüfung: unabhängiger Zweitdurchgang (Opus, frischer Kontext) — Quittung
im Gegenprüfungs-Register.
