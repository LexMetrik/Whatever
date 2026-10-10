#!/usr/bin/env bash
# Amtsquellen-Tor (ehem. Regel S4 aus scripts/bibliothek-check.sh, Kahlschlag 10.10.2026):
# /tmp-Verweise in bibliothek/**.md nur auf gepinnte Fedlex-Caches (fedlex-cache.sh) und
# deklarierte Norm-Extrakt-Arbeitskopien. Exit 1 bei Verstoss.   bash scripts/check-amtsquellen.sh
set -u
cd "$(dirname "$0")/../bibliothek" || exit 1
WHITELIST=$(awk '/^EINTRAEGE=\(/,/^\)/' ../scripts/fedlex-cache.sh | grep -oE '^  "[a-z0-9_]+\|' | sed -E 's/^  "([a-z0-9_]+)\|/\1/' | paste -sd'|' -)
[ -n "$WHITELIST" ] || { echo "VERSTOSS [S4] Whitelist leer — fedlex-cache.sh nicht lesbar (Tor darf nicht blind durchwinken)"; exit 1; }
treffer=$(grep -rnoE '/tmp/[a-zA-Z0-9._-]+' --include="*.md" . | grep -vE "/tmp/(${WHITELIST})\.html$" \
  | grep -vE '/tmp/(gruendung|kaperh)[a-z0-9_-]*-extrakt2?\.txt' | grep -v 'muster/')
[ -z "$treffer" ] || { echo "$treffer"; echo "VERSTOSS [S4] /tmp-Verweise ausserhalb der Cache-Whitelist (oben)"; exit 1; }
echo "✅ Amtsquellen: /tmp-Verweise in bibliothek/ nur auf gepinnte Fedlex-Caches (S4)."
