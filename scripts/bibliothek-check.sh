#!/usr/bin/env bash
# ─── Bibliotheks-Standard-Check (bibliothek/STANDARDS.md S10) ────────────────
# Maschinell prüfbare Mindeststandards; Exit 1 bei Verstoss. Teil des
# §9-Bug-Checks, wenn ein Deploy Bibliotheks-Änderungen enthält.
#   bash scripts/bibliothek-check.sh
set -u
cd "$(dirname "$0")/../bibliothek" || exit 1
fehler=0
melde() { echo "VERSTOSS [$1] $2"; fehler=$((fehler+1)); }

# ── S7.1: jede Datei hat ihre INDEX-Zeile ───────────────────────────────────
for f in recherche/*.md; do
  b=$(basename "$f"); [ "$b" = "INDEX.md" ] && continue
  grep -q "($b)" recherche/INDEX.md || melde S7 "recherche/INDEX.md ohne Zeile für $b"
done
for f in behoerden/*.md kosten/*.md normen/*.md rechtsprechung/*.md register/*.md materialien/*.md normtext/*.md seo/*.md betrieb/*.md werkzeuge/*.md muster/MANIFEST.md *.md; do
  b=$(basename "$f")
  [ "$b" = "INDEX.md" ] && continue
  grep -q "$b" INDEX.md || melde S7 "Haupt-INDEX ohne Eintrag für $f"
done

# ── S7.3: relative MD-Links lösen auf ───────────────────────────────────────
grep -rhoE '\]\([a-zA-Z0-9./_-]+\.md\)' --include="*.md" . \
  | sed -E 's/\]\((.*)\)/\1/' | sort -u | while read -r l; do
  ok=0
  # `betrieb` ergänzt 7.8.2026 (QS-SELBSTOPT): den Ordner gibt es seit dem
  # VPS-Dossier (17.7.2026), in dieser Liste stand er nie. Jeder relative Link
  # INNERHALB von betrieb/ galt darum als tot, obwohl er auflöst — belegt an
  # `betrieb/claude-md-gutachten-2026-08-07.md` → `entregulierung-2026-08-07.md`
  # (Datei liegt gleich daneben, Link stimmt, Tor meldete «toter Link»). Ein
  # Tor, das Fehlalarme produziert, wird bald ignoriert: dieselbe Wirkung wie
  # eines, das nie rot wird (§6.7), nur von der anderen Seite.
  for base in . recherche behoerden normen kosten register rechtsprechung muster materialien normtext quellen seo werkzeuge betrieb; do
    [ -f "$base/$l" ] && ok=1 && break
  done
  [ "$ok" = "0" ] && echo "VERSTOSS [S7] toter Link: $l"
done | tee /tmp/bibcheck-links.txt
[ -s /tmp/bibcheck-links.txt ] && fehler=$((fehler+$(wc -l < /tmp/bibcheck-links.txt)))

# ── S1: Pflichtkopf (Erstellt/Datum + Status) in Fach-Dossiers ──────────────
for f in recherche/*.md behoerden/*.md kosten/*.md normen/*.md materialien/*.md normtext/*.md seo/*.md betrieb/*.md; do
  b=$(basename "$f"); [ "$b" = "INDEX.md" ] && continue
  kopf=$(head -30 "$f")
  echo "$kopf" | grep -qiE '\*\*(Erstellt|Datum|Stand)\b' || melde S1 "$f ohne Erstellt-/Datums-Zeile im Kopf"
  echo "$kopf" | grep -qiE '\bStatus\b' || melde S1 "$f ohne Status-Zeile im Kopf"
done

# ── S4: /tmp nur für Fedlex-Caches + deklarierte Cache-Ableitungen ──────────
# Whitelist dynamisch aus fedlex-cache.sh (alle gepinnten Gesetzes-Caches) +
# Norm-Extrakt-Arbeitskopien. Vorher hart kodiert (15 Ur-Caches) und damit
# stale gegenüber dem gewachsenen Pin-Bestand (Befund 26.7.2026: argv5/vstv).
WHITELIST=$(awk '/^EINTRAEGE=\(/,/^\)/' ../scripts/fedlex-cache.sh | grep -oE '^  "[a-z0-9_]+\|' | sed -E 's/^  "([a-z0-9_]+)\|/\1/' | paste -sd'|' -)
[ -n "$WHITELIST" ] || { echo "VERSTOSS [S4] Whitelist leer — fedlex-cache.sh nicht lesbar (Tor darf nicht blind durchwinken)"; exit 1; }
grep -rnoE '/tmp/[a-zA-Z0-9._-]+' --include="*.md" . | grep -vE "/tmp/(${WHITELIST})\.html$" \
  | grep -vE '/tmp/(gruendung|kaperh)[a-z0-9_-]*-extrakt2?\.txt' \
  | grep -v 'muster/' \
  | tee /tmp/bibcheck-tmp.txt
[ -s /tmp/bibcheck-tmp.txt ] && { echo "VERSTOSS [S4] /tmp-Verweise ausserhalb der Cache-Whitelist (oben)"; fehler=$((fehler+$(wc -l < /tmp/bibcheck-tmp.txt))); }

# ── S6: «Verfallsregister-Kandidat»-Marker müssen registriert sein ──────────
# Geschärft 10.6.2026 (FAHRPLAN-GRUNDLAGEN G4.1): FEHLER statt Warnung.
# Mechanik: Wer den Marker trägt, muss mit seinem Dateinamen in
# register/parameter-verfall.md auftauchen (Fundstellen-Spalte verlinkt das
# Dossier). Historische Marker ohne Registereintrag sind damit Verstösse.
grep -rln "Verfallsregister-Kandidat" --include="*.md" recherche behoerden normen kosten 2>/dev/null | while read -r f; do
  b=$(basename "$f")
  grep -q "$b" register/parameter-verfall.md \
    || echo "VERSTOSS [S6] $f trägt Kandidat-Marker, aber register/parameter-verfall.md nennt $b nicht"
done | tee /tmp/bibcheck-s6.txt
[ -s /tmp/bibcheck-s6.txt ] && fehler=$((fehler+$(wc -l < /tmp/bibcheck-s6.txt)))

if [ "$fehler" -gt 0 ]; then
  echo; echo "❌ ${fehler} Standard-Verstoss/-Verstösse — STANDARDS.md S1/S4/S6/S7 prüfen."
  exit 1
fi
echo; echo "✅ Bibliothek erfüllt die maschinell prüfbaren Mindeststandards (S1, S4, S6, S7)."
