# Jules-Ticket-Vorlage (grüne Spur, Phase 4 — QS-FREMDAGENTEN)

Verwendung: Roadmap-Schritt/Unterpunkt ausgewählt (Kriterien: Skill `auftrag` Ziff. 6 «Grüne Spur →
Jules»), Platzhalter ersetzen, als GitHub-Issue mit Label `jules` anlegen (`gh issue create --label jules
--body-file …`). Jules startet innert Minuten, liefert nach ~30 min einen PR unter dem Konto des
Repo-Eigentümers (Branch mit 19-stelliger Task-ID; eigene Branches nie mit `jules-`/`jules/` beginnen). Landung (nie `update-branch`, immer Cherry-Pick des geprüften Heads, Beleg #710): Skill `landung`
§«Fremde PRs (Jules)» (`referenz-jules.md`) — eigener Tor-Lauf, `scripts/analyse/test-assertion-diff.ts`, Whitelist-Diff,
Trailer beim Squash nachsetzen. Das Beispiel unten ist das reale Ticket #654 (Komponenten-Split); für
Test-Splits siehe #643/#644. Massgebliches Fertig-Kriterium bei Zählwerten ist die repo-lokale Quelle
`npx vite-node scripts/analyse/test-assertion-diff.ts <Basis> <Head> src/tests/` = 0 Differenz — die
Beispiel-PRs sind Beleg, nicht Massstab. Absichtliche Proben der Prüfstrasse (kein Bau-Auftrag)
tragen das Label `probe` und zählen nicht in die Landungsquote (Konvention QS-FREMDAGENTEN,
`klassierePrs()` in `scripts/analyse/fremdagenten-messung.ts`). Eine gültige Entwurf-Antwort
(Auftrag verlangte bei Feldabweichung Entwurfs-PR + Abbruch statt fertigem Bau) trägt vor dem
Schliessen das Label `entwurf-antwort` und zählt ebenso weder als Landung noch als Ablehnung
(Klasse `entwurf-antwort`, QS-EFFIZIENZ 5.9.2026).

**Pflicht nach dem Anlegen (Regel 14.9.2026, Beleg #858):** den erzeugten Body zurücklesen —
`gh issue view <N> --json body -q .body | wc -l` muss mindestens die Zeilenzahl dieser Vorlage
melden; sonst ist das Ticket defekt (leerer Body wird von `gh` klaglos angenommen) und Jules darf
nicht gestartet werden.

---

**Summary (EN):** Split the oversized React component file `src/components/normtext/ArtikelBody.tsx` (926 lines) into at most three files by moving whole sub-components/helpers verbatim into sibling files. No behaviour change, no test change. Read `AGENTS.md` first.

## Ziel
`src/components/normtext/ArtikelBody.tsx` (926 Zeilen) liegt über der Schlankheits-Grenze von 800 Zeilen (CLAUDE.md §6.6). Ganze Unterkomponenten und Hilfsfunktionen sollen **unverändert** in höchstens zwei neue Nachbardateien verschoben werden (z. B. `ArtikelBody.bloecke.tsx`, `ArtikelBody.helfer.ts`); `ArtikelBody.tsx` importiert sie und behält seine öffentliche Schnittstelle (gleiche Exporte, gleiche Props). Heimat: Roadmap-Schritt `QS-FREMDAGENTEN` (Phase 4). Vor dem Start `AGENTS.md` lesen — es gilt vollständig.

## Whitelist
- `src/components/normtext/ArtikelBody.tsx` (wird kleiner)
- neue Dateien `src/components/normtext/ArtikelBody.<teil>.tsx` / `.ts` (höchstens zwei, jede ≤ 800 Zeilen)

## Tabu
Alles andere: keine Tests, keine anderen Komponenten, kein `src/lib/**`, kein `scripts/**`, `package.json`, `.github/**`, Steuer-Doku. Keine neuen Abhängigkeiten, keine Umbenennung von Props/Exports, keine Logik-, Text- oder Style-Änderung (auch keine «Verbesserungen» nebenbei). **Kommentare sind Inhalt:** sie wandern mit dem Code mit, werden nie gelöscht oder gekürzt (die Prüfstrasse zählt sie).

## Fertig-Kriterium (maschinell)
1. `npm ci` · `npm run build` grün · `npm test` grün mit gleicher Testanzahl · `npm run lint` 0 Fehler · `npx tsc -b` sauber.
2. `npm run gate` grün; letzte Zeilen in die PR-Beschreibung.
3. `npm run golden:vergleich` byte-gleich (Exit 0).
4. Keine Datei über 800 Zeilen.

## Wenn etwas rot ist oder unklar
Nicht «kreativ» lösen. PR als Entwurf öffnen, Problem beschreiben, abbrechen.

## PR-Form
Titel deutsch («QS-FREMDAGENTEN Phase 4: ArtikelBody.tsx aufteilen»). Beschreibung nach `AGENTS.md` §7. Letzter Absatz der Commit-Message: `Roadmap: QS-FREMDAGENTEN`. Nicht selbst mergen.
Commit-Betreff nie mit Typ `refactor` bei Änderungen unter `src/tests/**` — Test-Splits sind deklarierte Änderungen, Form «QS-FREMDAGENTEN … : <deutscher Titel>» (Beleg PR #709).
